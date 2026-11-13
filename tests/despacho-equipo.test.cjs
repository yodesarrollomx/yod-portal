'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const api=import(pathToFileURL(path.join(__dirname,'../despacho3d/equipo-model.mjs')));
const voice=import(pathToFileURL(path.join(__dirname,'../despacho3d/equipo-dictation.mjs')));
const NOW=Date.parse('2026-01-02T12:00:00Z');
const snapshot=()=>({version:1,revision:'r1',read_at:'2026-01-02T12:00:00Z',
members:[{id:'human',label:'Dirección',kind:'human'},{id:'agent',label:'Agente',kind:'agent'}],
tasks:[{id:'t1',title:'Preparar revisión',status:'Pendiente',owner:'agent',next_action:'Revisar fuentes',due_at:'2026-01-03T12:00:00Z'},{id:'t2',title:'Entregado',status:'Hecho'}],
events:[{id:'e1',at:'2026-01-01T12:00:00Z',text:'Recibido',kind:'ack'},{id:'e2',at:'2026-01-02T12:00:00Z',text:'Resultado'}]});
const saved=intent=>({...intent,status:'saved',id:'note-1',revision:'r2',recorded_at:'2026-01-02T12:01:00Z'});
async function setup(overrides={}) {
 const {createTeamSession}=await api;let allowed=true,epoch=1,count=0;
 const transport={read:async()=>snapshot(),write:async x=>saved(x),lookupReceipt:async id=>({status:'not_found',request_id:id}),...overrides};
 const session=createTeamSession({transport,isAuthorized:()=>allowed,identityEpoch:()=>epoch,requestId:()=>('request_000000000000_'+(++count))});
 await session.read();
 return {session,transport,deny:()=>allowed=false,rotate:()=>epoch++};
}
test('historical cutoff uses events only and does not mutate current tasks',async()=>{
 const {timeline}=await api,s=snapshot(),before=JSON.stringify(s);
 assert.deepEqual(timeline(s,'history',Date.parse('2026-01-01T23:59:59Z')).map(e=>e.id),['e1']);
 assert.equal(JSON.stringify(s),before);assert.equal(timeline(s,'now').length,1);
});
test('planned task never becomes completed when date passes',async()=>{
 const {timeline}=await api,s=snapshot();
 assert.equal(timeline(s,'plan',NOW+86400000*10)[0].status,'Pendiente');
});
test('malformed history date and duplicate identifiers are rejected',async()=>{
 const {validateSnapshot}=await api,s=snapshot();s.events[0].at='yesterday';
 assert.throws(()=>validateSnapshot(s),/snapshot_invalid/);
 const d=snapshot();d.tasks.push(d.tasks[0]);assert.throws(()=>validateSnapshot(d),/snapshot_invalid/);
});
test('missing or future heartbeat never means recent',async()=>{
 const {reviewSignal}=await api;
 assert.equal(reviewSignal({kind:'agent'},NOW).tone,'unknown');
 assert.equal(reviewSignal({kind:'agent',last_review_at:'2026-01-03T12:00:00Z',cadence_minutes:60},NOW).tone,'unknown');
});
test('age thresholds and human activity are distinct',async()=>{
 const {reviewSignal}=await api,m={kind:'agent',cadence_minutes:60,last_review_at:'2026-01-02T10:00:00Z'};
 assert.equal(reviewSignal(m,NOW).tone,'recent');assert.equal(reviewSignal(m,NOW+1).tone,'late');
 assert.equal(reviewSignal(m,NOW+3600001).tone,'unknown');
 assert.equal(reviewSignal({kind:'human',blocked:true},NOW).tone,'neutral');
 assert.equal(reviewSignal({...m,blocked:true},NOW).tone,'blocked');
});
test('source links reject executable schemes and credentials',async()=>{
 const {safeLink}=await api;
 assert.equal(safeLink('javascript:alert(1)'),null);assert.equal(safeLink('https://user:secret@example.org/'),null);
 assert.equal(safeLink('https://example.org/source'),'https://example.org/source');
});
test('prepare preserves exact text and transmits no claimed identity',async()=>{
 const {session}=await setup();const p=session.prepare({kind:'note',task_id:'t1',text:'  Mi nota\nsin resumir.  '});
 assert.equal(p.text,'  Mi nota\nsin resumir.  ');assert.equal(p.expected_revision,'r1');assert.equal('author' in p,false);
 assert.throws(()=>session.prepare({kind:'request',text:'Otra'}),/pending_receipt/);
});
test('notes require an existing target and requests cannot impersonate a note',async()=>{
 const {session}=await setup();assert.throws(()=>session.prepare({kind:'note',task_id:'missing',text:'Nota'}),/instruction_invalid/);
 assert.throws(()=>session.prepare({kind:'request',task_id:'t1',text:'Nota'}),/instruction_invalid/);
});
test('uncertain write reconciles same request without a second write',async()=>{
 let receipt,writes=0;const {session}=await setup({write:async intent=>{writes++;receipt=saved(intent);throw new Error('network');},lookupReceipt:async()=>receipt});
 const p=session.prepare({kind:'request',text:'Preparar resumen'});
 await assert.rejects(session.send(),/network/);assert.equal(session.pending().request_id,p.request_id);
 const result=await session.send(true);assert.equal(result.request_id,p.request_id);assert.equal(writes,1);assert.equal(session.pending(),null);
});
test('confirmed absence retries identical intent with the same request id',async()=>{
 const sent=[];const {session}=await setup({write:async intent=>{sent.push(intent);if(sent.length===1)throw new Error('network');return saved(intent);}});
 session.prepare({kind:'request',text:'Texto exacto'});
 await assert.rejects(session.send(),/network/);await session.send(true);assert.deepEqual(sent[0],sent[1]);
});
test('unknown lookup cannot trigger a duplicate write',async()=>{
 let writes=0;const {session}=await setup({write:async()=>{writes++;throw new Error('network');},lookupReceipt:async()=>null});
 session.prepare({kind:'request',text:'Texto'});await assert.rejects(session.send(),/network/);
 await assert.rejects(session.send(true),/receipt_unconfirmed/);assert.equal(writes,1);
});
test('mismatched receipt does not clear the draft',async()=>{
 const {session}=await setup({write:async intent=>({...saved(intent),text:'Texto distinto'})});
 session.prepare({kind:'request',text:'Original'});await assert.rejects(session.send(),/receipt_unconfirmed/);
 assert.equal(session.pending().text,'Original');
});
test('double click only runs one write',async()=>{
 let done,writes=0;const {session}=await setup({write:intent=>{writes++;return new Promise(resolve=>done=()=>resolve(saved(intent)));}});
 session.prepare({kind:'request',text:'Original'});const running=session.send();
 await assert.rejects(session.send(),/busy/);done();await running;assert.equal(writes,1);
});
test('session revocation prevents writing and clears private pending data',async()=>{
 let writes=0;const h=await setup({write:async x=>{writes++;return saved(x);}});
 h.session.prepare({kind:'request',text:'Private'});h.deny();await assert.rejects(h.session.send(),/session_changed/);
 assert.equal(writes,0);assert.equal(h.session.pending(),null);
});
test('late receipt under another identity is not accepted',async()=>{
 let done;const h=await setup({write:intent=>new Promise(resolve=>done=()=>resolve(saved(intent)))});
 h.session.prepare({kind:'request',text:'Private'});const running=h.session.send();h.rotate();done();
 await assert.rejects(running,/session_changed/);assert.equal(h.session.pending(),null);
});
test('out of order reads cannot replace the newest snapshot',async()=>{
 const h=await setup();let old;h.transport.read=()=>new Promise(resolve=>old=resolve);const first=h.session.read();
 h.transport.read=async()=>({...snapshot(),revision:'r9'});await h.session.read();old(snapshot());
 await assert.rejects(first,/read_superseded/);
 assert.equal(h.session.prepare({kind:'request',text:'Note'}).expected_revision,'r9');
});
test('dictation is user initiated, appends once and stops after dispose',async()=>{
 const {bindTeamDictation}=await voice;let instances=0,handler,instance;
 class Recognition {constructor(){instances++;instance=this;}start(){this.started=true;}abort(){this.aborted=true;}}
 const button={textContent:'',setAttribute(){},addEventListener(_,fn){handler=fn;},removeEventListener(){}};
 const textarea={value:'Nota',dispatchEvent(){}},status={};
 const bound=bindTeamDictation({button,textarea,status,host:{SpeechRecognition:Recognition}});
 assert.equal(instances,0);handler();assert.equal(instance.started,true);
 const result={0:{transcript:'nueva'},isFinal:true};instance.onresult({resultIndex:0,results:[result]});instance.onresult({resultIndex:0,results:[result]});
 assert.equal(textarea.value,'Nota nueva');bound.dispose();assert.equal(instance.aborted,true);
 instance.onresult({resultIndex:0,results:[result]});assert.equal(textarea.value,'Nota nueva');
});
test('unsupported dictation has a writing fallback',async()=>{
 const {bindTeamDictation}=await voice,button={setAttribute(){}},status={};
 bindTeamDictation({button,textarea:{},status,host:{}});assert.equal(button.disabled,true);assert.match(status.textContent,/escribir/);
});

test('definitive revision conflict preserves editable text but requires a fresh read and new request',async()=>{
 const {session,transport}=await setup({write:async intent=>({...saved(intent),status:'rejected',reason:'revision_conflict'})});
 const first=session.prepare({kind:'request',text:'Exact note'});
 await assert.rejects(session.send(),/revision_conflict/);assert.equal(session.pending(),null);
 assert.throws(()=>session.prepare({kind:'request',text:first.text}),/read_required/);
 transport.read=async()=>({...snapshot(),revision:'r2'});await session.read();
 const next=session.prepare({kind:'request',text:first.text});assert.equal(next.text,first.text);assert.equal(next.expected_revision,'r2');
 assert.equal(next.request_id===first.request_id,false);
});
