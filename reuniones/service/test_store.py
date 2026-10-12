import hashlib
import io
import json
import wave
import pytest
from fastapi.testclient import TestClient
from store import Store, Conflict
from api import create_app
from worker import Worker, assemble

TOKEN='synthetic-device-token-not-a-real-secret'
@pytest.fixture
def store(tmp_path):
    return Store(tmp_path)

def create(store, mid='meeting-1'):
    store.create(mid,'owner','project','audio/webm','stream')

def put(store, data=b'audio',seq=0,duration=5):
    digest=hashlib.sha256(data).hexdigest()
    return store.put('meeting-1','owner',seq,data,digest,duration)

def manifest(store):
    return [{'seq':r['seq'],'sha256':r['hash'],'size':r['size']} for r in store.chunks('meeting-1')]

def test_lost_ack_is_idempotent_and_conflict_is_rejected(store):
    create(store);a=put(store);assert put(store)==a
    assert len(store.chunks('meeting-1'))==1
    with pytest.raises(Conflict):put(store,b'changed')
    with pytest.raises(ValueError):store.put('meeting-1','owner',1,b'changed','0'*64,5)

def test_restart_retains_audio_and_manifest(store):
    create(store);put(store)
    reopened=Store(store.root)
    assert reopened.audio_path(reopened.chunks('meeting-1')[0]['hash']).read_bytes()==b'audio'
    first=reopened.finalize('meeting-1','owner',manifest(store))
    second=reopened.finalize('meeting-1','owner',manifest(store))
    assert first==second and first['state']=='sealed'
    with pytest.raises(Conflict):put(store,b'later',seq=1)

def test_gaps_cannot_finalize_or_generate_preview(store):
    create(store);put(store,seq=1,duration=300)
    with pytest.raises(Conflict):store.finalize('meeting-1','owner',manifest(store))
    assert store.claim() is None
    put(store,seq=0,duration=300)
    assert store.claim()['kind']=='preview'

def test_corruption_blocks_seal(store):
    create(store);a=put(store);store.audio_path(a['sha256']).write_bytes(b'corrupt')
    with pytest.raises(Conflict):store.finalize('meeting-1','owner',manifest(store))

def test_expired_worker_lease_and_stale_completion(store):
    create(store);put(store,duration=300);a=store.claim();assert store.claim() is None
    with store.db() as db:db.execute('UPDATE jobs SET retry=0')
    b=store.claim();assert a['lease']!=b['lease']
    store.finish_job(a, result={'wrong':True})
    with store.db() as db:assert db.execute('SELECT state FROM jobs').fetchone()[0]=='running'
    store.finish_job(b,result={'ok':True})
    assert store.claim() is None

def test_api_actor_project_and_size_hash_boundaries(store):
    g={'sha256':hashlib.sha256(TOKEN.encode()).hexdigest(),'owner':'owner','projects':['project']}
    client=TestClient(create_app(store,[g]));h={'Authorization':'Bearer '+TOKEN}
    payload={'project':'project','mime':'audio/webm'}
    assert client.post('/meetings/meeting-1',json=payload).status_code==401
    assert client.post('/meetings/meeting-1',json={**payload,'project':'other'},headers=h).status_code==403
    assert client.post('/meetings/meeting-1',json=payload,headers=h).status_code==200
    store.create('private','another-owner','project','audio/webm','stream')
    assert client.get('/meetings/private',headers=h).status_code==404
    assert client.put('/meetings/meeting-1/chunks/0',content=b'audio',headers={**h,'X-SHA256':'0'*64}).status_code==400
    assert client.post('/meetings/meeting-1/finalize',json={'manifest':[]},headers=h).status_code==400

def test_final_whole_audio_and_evidence_review(store):
    create(store);put(store,b'first');put(store,b'second',seq=1)
    store.finalize('meeting-1','owner',manifest(store),interrupted=True)
    def transcribe(path):
        assert path.read_bytes()==b'firstsecond'
        return [{'text':'Hay que revisar el presupuesto.','start':0,'end':5,'review':False},
                {'text':'Acordamos algo dudoso.','start':5,'end':9,'review':True}]
    assert Worker(store,transcriber=transcribe).once()
    final=store.status('meeting-1','owner')['jobs'][0]['result']
    # jobs ordering may put drive first; select final explicitly
    final=next(j['result'] for j in store.status('meeting-1','owner')['jobs'] if j['kind']=='final')
    assert final['interrupted'] and final['requires_human_review']
    assert len(final['candidates'])==1 and final['candidates'][0]['owner'] is None

def test_missing_drive_retries_without_deleting_audio(store):
    create(store);put(store);store.finalize('meeting-1','owner',manifest(store))
    worker=Worker(store,transcriber=lambda _:[]);worker.once();worker.once()
    jobs=store.status('meeting-1','owner')['jobs']
    assert next(j for j in jobs if j['kind']=='drive')['state']=='retry'
    assert store.audio_path(manifest(store)[0]['sha256']).exists()

def test_native_wav_segments_assemble(store,tmp_path):
    store.create('meeting-1','owner','project','audio/wav','wav_segments')
    def wav(data):
        b=io.BytesIO()
        with wave.open(b,'wb') as out:out.setparams((1,2,16000,0,'NONE','not compressed'));out.writeframes(data)
        return b.getvalue()
    put(store,wav(b'\x00\x00'*160));put(store,wav(b'\x01\x00'*160),seq=1)
    output=tmp_path/'joined.wav';assemble(store,store.meeting('meeting-1','owner'),store.chunks('meeting-1'),output)
    with wave.open(str(output)) as src:assert src.getnframes()==320
