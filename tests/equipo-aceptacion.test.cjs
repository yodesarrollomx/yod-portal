const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const modulePromise=import('../despacho3d/equipo-aceptacion.mjs');
async function fixture(){const {createAcceptance}=await modulePromise;let authorized=true,epoch=1,writeCount=0,receipt=null,lose=false;const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};const options={storage,storageScope:'a'.repeat(64),requestId:()=> 'acceptance_synthetic_1234',digest:async s=>createHash('sha256').update(s).digest('hex'),isAuthorized:()=>authorized,identityEpoch:()=>epoch,transport:{read:async()=>({version:1,revision:'r1',read_at:'2026-10-18T00:00:00Z',members:[],events:[],tasks:[{id:'fixture-task',title:'Existing task',status:'En proceso'}]}),write:async intent=>{writeCount++;receipt={...intent,id:'fixture-receipt',revision:'r2',status:'saved',recorded_at:'2026-10-18T00:01:00Z'};if(lose)throw Error('lost');return receipt;},lookupReceipt:async id=>receipt||{status:'not_found',request_id:id}}};return {api:createAcceptance(options),reload:()=>createAcceptance(options),store,options,count:()=>writeCount,lose:()=>lose=true,revoke:()=>{authorized=false;epoch++;},receipt:()=>receipt};}
test('exact real-intent shape, private text absent from storage and reload lookup has no second write',async()=>{const h=await fixture();await h.api.read();const text='  Nota privada revisada\ncon texto exacto.  ';await h.api.send('fixture-task',text);assert.equal(h.receipt().text,text);assert.equal(h.receipt().kind,'note');assert.equal(h.count(),1);const encoded=JSON.stringify([...h.store]);assert.equal(encoded.includes('Nota privada'),false);assert.equal(encoded.includes('token'),false);const next=h.reload();assert.equal((await next.recover()).text,text);assert.equal(h.count(),1);await assert.rejects(next.send('fixture-task','duplicate'),/pending_receipt/);});
test('lost response survives reload and only looks up same request',async()=>{const h=await fixture();await h.api.read();h.lose();await assert.rejects(h.api.send('fixture-task','texto'),/lost/);assert.equal((await h.reload().recover()).request_id,'acceptance_synthetic_1234');assert.equal(h.count(),1);});
test('missing receipt after reload never sends the note',async()=>{const h=await fixture();await h.api.read();h.options.transport.write=async()=>{throw Error('network before acceptance');};await assert.rejects(h.api.send('fixture-task','texto'));assert.equal((await h.reload().recover()).status,'not_found');assert.equal(h.count(),0);});
test('wrong text receipt and changed authority fail closed',async()=>{const h=await fixture();await h.api.read();await h.api.send('fixture-task','texto');h.receipt().text='different';await assert.rejects(h.reload().recover(),/receipt_unconfirmed/);h.revoke();await assert.rejects(h.api.recover(),/session_changed/);});
test('storage failure and unknown task prevent any write',async()=>{const h=await fixture();await h.api.read();await assert.rejects(h.api.send('missing','texto'),/instruction_invalid/);h.options.storage.setItem=()=>{throw Error('storage unavailable');};await assert.rejects(h.api.send('fixture-task','texto'),/storage unavailable/);assert.equal(h.count(),0);});

test('another verified identity cannot recover previous pending metadata',async()=>{const h=await fixture();await h.api.read();await h.api.send('fixture-task','texto');h.options.storageScope='b'.repeat(64);assert.equal(h.reload().pending(),null);await assert.rejects(h.reload().recover(),/no_pending/);assert.equal(h.count(),1);});

test('correlated durable conflict requires explicit fresh read and a new intent, preserving rejected metadata',async()=>{
 const h=await fixture();await h.api.read();await h.api.send('fixture-task','texto');Object.assign(h.receipt(),{status:'rejected',reason:'revision_conflict'});
 const next=h.reload();await assert.rejects(next.prepareNew(),/rejection_required/);assert.equal((await next.recover()).status,'rejected');
 await assert.rejects(next.send('fixture-task','texto'),/pending_receipt/);assert.equal(h.count(),1);
 await next.prepareNew();assert.equal(next.pending(),null);assert.equal(h.count(),1);assert.ok([...h.store.keys()].some(k=>k.endsWith(':rejected:acceptance_synthetic_1234')));
 await assert.rejects(next.send('fixture-task','texto'),/request_id_reused/);assert.equal(h.count(),1);
 h.options.requestId=()=> 'acceptance_synthetic_5678';const fresh=h.reload();await fresh.read();await fresh.send('fixture-task','texto');assert.equal(h.count(),2);assert.equal(h.receipt().request_id,'acceptance_synthetic_5678');
});
test('mismatched or absent receipt never enables a new intent',async()=>{
 for(const mode of ['task','text','kind','id','reason','not_found','uncertain']){const h=await fixture();await h.api.read();await h.api.send('fixture-task','texto');Object.assign(h.receipt(),{status:'rejected',reason:'revision_conflict'});
 if(mode==='task')h.receipt().task_id='other';if(mode==='text')h.receipt().text='other';if(mode==='kind')h.receipt().kind='request';if(mode==='id')h.receipt().request_id='other';if(mode==='reason')h.receipt().reason='other';
 if(mode==='not_found')h.options.transport.lookupReceipt=async id=>({status:'not_found',request_id:id});if(mode==='uncertain')h.options.transport.lookupReceipt=async()=>{throw Error('unknown');};
 const next=h.reload();try{await next.recover();}catch{}await assert.rejects(next.prepareNew(),/rejection_required/);assert.ok(next.pending());assert.equal(h.count(),1);
 }
});
test('failed fresh read or changed receipt retains rejected pending guard',async()=>{
 const h=await fixture();await h.api.read();await h.api.send('fixture-task','texto');Object.assign(h.receipt(),{status:'rejected',reason:'revision_conflict'});const next=h.reload();await next.recover();
 h.options.transport.read=async()=>{throw Error('read failed');};await assert.rejects(next.prepareNew(),/read failed/);assert.ok(next.pending());assert.equal(h.count(),1);
 h.receipt().task_id='other';await assert.rejects(next.prepareNew(),/receipt_unconfirmed/);assert.ok(next.pending());assert.equal(h.count(),1);
});
test('live rejected write is reconciled by lookup and explicit prepare uses the newly read revision',async()=>{
 const h=await fixture();let n=0,rev='r1',saved=null;const sent=[];
 h.options.requestId=()=> 'acceptance_new_intent_'+(++n);
 h.options.transport.read=async()=>({version:1,revision:rev,read_at:'2026-10-18T00:00:00Z',members:[],events:[],tasks:[{id:'fixture-task',title:'Existing',status:'En proceso'}]});
 h.options.transport.write=async intent=>{sent.push(intent);saved={...intent,id:'receipt-'+n,revision:rev,status:n===1?'rejected':'saved',reason:n===1?'revision_conflict':undefined,recorded_at:'2026-10-18T00:01:00Z'};return saved;};h.options.transport.lookupReceipt=async()=>saved;
 const api=h.reload();await api.read();await assert.rejects(api.send('fixture-task','exact text'),/revision_conflict/);assert.ok(api.pending());await api.recover();rev='r2';await api.prepareNew();assert.equal(sent.length,1);await api.send('fixture-task','exact text');assert.equal(sent.length,2);assert.notEqual(sent[0].request_id,sent[1].request_id);assert.equal(sent[1].expected_revision,'r2');
});
