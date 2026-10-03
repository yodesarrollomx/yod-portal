'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const load=async()=>({...await import('../despacho3d/conversation.mjs'),...await import('../despacho3d/conversation-watch.mjs')});
const caseId='recovery-synthetic';
function selected(){return {ok:true,case_id:caseId,name:'Caso sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',agent_ready:true,can_enqueue:true,avatar:{id:caseId,case_id:caseId,entity_kind:'case',name:'Caso sintético',form:'child',color:'#345678',visual:{}}};}
function snapshot(){return {ok:true,case_id:caseId,source_revision:'source-1',context:{identity:{case_id:caseId,name:'Caso sintético'}},state:{updated_at:'2026-10-03T00:00:00Z'},conversation:[{case_id:caseId,message_id:'initial-message',role:'assistant',created_at:'2026-10-03T00:00:00Z',body_json:JSON.stringify({reply:'Texto ya guardado en Sheets.'})}],jobs:[],events:[]};}
function clock(){let time=0,timer;return {now:()=>time,schedule:(fn,ms)=>{assert.equal(timer,undefined,'must not overlap scheduled reads');timer={fn,ms};return fn;},cancel:()=>{timer=undefined;},get delay(){return timer?.ms;},advance:ms=>{time+=ms;},async fire(){assert.ok(timer,'a retry was scheduled');const next=timer;timer=undefined;time+=next.ms;return next.fn();}};}
async function harness(){
 const {Conversation}=await load(),state=snapshot(),calls=[],receipts=new Map();let fault=null,current=selected(),counter=0;
 const server={resolveCurrent:async()=>{calls.push({method:'resolveCurrent'});if(fault?.step==='selection')throw Error(fault.code);return structuredClone(current);},read:async payload=>{calls.push({method:'read',payload});if(fault?.step==='read')throw Error(fault.code);return structuredClone(state);},enqueue:async payload=>{calls.push({method:'enqueue',payload:structuredClone(payload)});if(receipts.has(payload.request_id))return structuredClone(receipts.get(payload.request_id));const ack={ok:true,case_id:caseId,job_id:'job-'+(++counter),request_id:payload.request_id,source_revision:payload.expected_revision,state:'queued'};receipts.set(payload.request_id,ack);state.jobs.push({case_id:caseId,job_id:ack.job_id,enqueue_request_id:payload.request_id,status:'queued'});state.conversation.push({case_id:caseId,message_id:'message-'+counter,job_id:ack.job_id,role:'user',created_at:state.state.updated_at,body_json:JSON.stringify({message:payload.message})});return structuredClone(ack);}};
 const conversation=new Conversation({transport:server,uuid:()=>`request-${counter+1}`});return {conversation,server,state,calls,fault:(step,code)=>fault=step?{step,code}:null,selection:value=>current=value};
}
test('a transient update preserves shown history and avatar but forbids writes until a fresh authorized read succeeds',async()=>{
 const h=await harness();await h.conversation.open();const oldModel=h.conversation.model,oldProfile=h.conversation.getProfile();let profileChanges=0;h.conversation.subscribeProfile(()=>profileChanges++);
 for(const code of ['timeout','unavailable','transport_busy','session_pending']){
  h.fault('read',code);assert.equal(await h.conversation.refresh(),false);assert.equal(h.conversation.status,'reconnecting');assert.equal(h.conversation.stale,true);assert.equal(h.conversation.model,oldModel);assert.deepEqual(h.conversation.getProfile(),oldProfile);assert.equal(await h.conversation.send('No debe enviarse con lectura vieja'),false);
 }
 assert.equal(h.calls.filter(c=>c.method==='enqueue').length,0);assert.equal(profileChanges,1,'transient failure does not revoke profile subscribers');
 h.fault(null);assert.equal(await h.conversation.refresh(),true);assert.equal(h.conversation.stale,false);assert.equal(h.conversation.status,'ready');assert.equal(await h.conversation.send('Mensaje después de recuperar la conexión'),true);assert.equal(h.calls.filter(c=>c.method==='enqueue').length,1);
});
test('lost ACK is reconciled by read-only following without sending the message a second time',async()=>{
 const h=await harness(),{watchConversation}=await load(),c=clock(),enqueue=h.server.enqueue;h.server.enqueue=async payload=>{await enqueue(payload);throw Error('timeout');};await h.conversation.open();assert.equal(await h.conversation.send('Mensaje sintético único'),false);assert.equal(h.conversation.status,'unconfirmed');assert.ok(h.conversation.pending);
 const stop=watchConversation(h.conversation,c);await c.fire();assert.equal(h.conversation.pending,null);assert.equal(h.conversation.status,'processing');assert.equal(h.calls.filter(call=>call.method==='enqueue').length,1);
 h.state.jobs[0].status='completed';h.state.conversation.push({case_id:caseId,message_id:'completed-reply',job_id:h.state.jobs[0].job_id,role:'assistant',created_at:h.state.state.updated_at,body_json:JSON.stringify({reply:'Resultado guardado.'})});await c.fire();assert.equal(h.conversation.status,'ready');assert.equal(h.conversation.model.messages.at(-1).body,'Resultado guardado.');assert.equal(c.delay,undefined);assert.equal(h.calls.filter(call=>call.method==='enqueue').length,1);stop();
});
test('an uncommitted uncertain message keeps its original ID through recovery and only an explicit retry writes',async()=>{
 const h=await harness(),{watchConversation}=await load(),c=clock(),enqueue=h.server.enqueue;let attempts=0;h.server.enqueue=async payload=>{attempts++;if(attempts===1)throw Error('timeout');return enqueue(payload);};await h.conversation.open();await h.conversation.send('Texto original');const pending=structuredClone(h.conversation.pending);h.fault('read','timeout');const stop=watchConversation(h.conversation,c);await c.fire();assert.equal(h.conversation.stale,true);assert.equal(await h.conversation.send('Texto que no reemplaza el pendiente'),false);assert.equal(attempts,1);
 h.fault(null);await c.fire();assert.equal(h.conversation.status,'unconfirmed');assert.deepEqual(h.conversation.pending,pending);assert.equal(attempts,1);assert.equal(await h.conversation.send('Otro texto que no se enviará'),true);assert.equal(attempts,2);assert.deepEqual(h.calls.filter(call=>call.method==='enqueue')[0].payload,pending);assert.equal(h.state.jobs.length,1);stop();
});
test('real authorization or case changes clear history and avatar and are not automatically retried',async()=>{
 const {watchConversation}=await load();
 for(const code of ['unauthorized','session_changed','case_changed']){
  const h=await harness();await h.conversation.open();h.conversation.pending={case_id:caseId,request_id:'pending-synthetic'};
  if(code==='case_changed')h.selection({...selected(),case_id:'different-case',avatar:undefined});else h.fault('selection',code);
  assert.equal(await h.conversation.refresh(),false);assert.equal(h.conversation.status,'unavailable');assert.equal(h.conversation.recoverable,false);assert.equal(h.conversation.selection,null);assert.equal(h.conversation.model,null);assert.equal(h.conversation.getProfile(),null);assert.equal(h.conversation.pending,null);
  const c=clock(),count=h.calls.length,stop=watchConversation(h.conversation,c);await c.fire();assert.equal(h.calls.length,count);assert.equal(c.delay,undefined);stop();
 }
});
test('follower retries an initial connection failure and stops after recovering the authorized conversation',async()=>{
 const h=await harness(),{watchConversation}=await load(),c=clock();h.fault('selection','timeout');assert.equal(await h.conversation.open(),false);assert.equal(h.conversation.recoverable,true);assert.equal(h.conversation.selection,null);assert.equal(h.calls.filter(call=>call.method==='read').length,0);
 h.fault(null);const stop=watchConversation(h.conversation,c);await c.fire();assert.equal(h.conversation.status,'ready');assert.equal(h.conversation.model.messages[0].body,'Texto ya guardado en Sheets.');assert.equal(h.calls.filter(call=>call.method==='read').length,1);assert.equal(c.delay,undefined);stop();
});
test('hidden initial and update recovery issue no reads or writes',async()=>{
 const h=await harness(),{watchConversation}=await load(),c=clock();let visible=false;h.fault('selection','timeout');await h.conversation.open();const count=h.calls.length;h.fault(null);const stop=watchConversation(h.conversation,{...c,visible:()=>visible});await c.fire();assert.equal(h.calls.length,count);visible=true;await c.fire();assert.equal(h.conversation.status,'ready');stop();
 h.fault('read','timeout');await h.conversation.refresh();const later=h.calls.length,c2=clock();visible=false;const stop2=watchConversation(h.conversation,{...c2,visible:()=>visible});await c2.fire();assert.equal(h.calls.length,later);assert.equal(h.calls.filter(call=>call.method==='enqueue').length,0);stop2();
});
test('closing during a recovery read fences late data and cancels future retries',async()=>{
 const h=await harness(),{watchConversation}=await load(),c=clock();await h.conversation.open();h.fault('read','timeout');await h.conversation.refresh();h.fault(null);let release;h.server.read=()=>new Promise(resolve=>release=resolve);const stop=watchConversation(h.conversation,{...c,onLimit:()=>assert.fail('a closed panel cannot notify')});const reading=c.fire();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.conversation.busy,true);assert.equal(c.delay,undefined);h.conversation.close();stop();c.advance(300000);release(structuredClone(h.state));await reading;assert.equal(h.conversation.status,'disconnected');assert.equal(h.conversation.model,null);assert.equal(h.conversation.selection,null);assert.equal(h.conversation.pending,null);assert.equal(c.delay,undefined);
});
test('automatic updates recover worker availability without inventing work or sending',async()=>{
 const h=await harness(),{watchConversation}=await load(),c=clock();h.selection({...selected(),agent_ready:false,can_enqueue:false});await h.conversation.open();assert.equal(h.conversation.status,'ready');const stop=watchConversation(h.conversation,c);await c.fire();assert.equal(h.calls.filter(call=>call.method==='enqueue').length,0);assert.equal(c.delay,5000);h.selection(selected());await c.fire();assert.equal(h.conversation.selection.agent_ready,true);assert.equal(c.delay,undefined);assert.equal(h.calls.filter(call=>call.method==='enqueue').length,0);stop();
});
test('a confirmed send remains visible until the saved message arrives, even if the immediate read fails',async()=>{
 const h=await harness(),{watchConversation}=await load(),c=clock();await h.conversation.open();h.fault('read','timeout');assert.equal(await h.conversation.send('Mensaje con recibo confirmado'),true);assert.equal(h.conversation.accepted.message,'Mensaje con recibo confirmado');assert.equal(h.conversation.status,'reconnecting');assert.equal(h.conversation.pending,null);
 h.fault(null);const stop=watchConversation(h.conversation,c);await c.fire();assert.equal(h.conversation.accepted,null);assert.equal(h.conversation.model.messages.filter(m=>m.body==='Mensaje con recibo confirmado').length,1);assert.equal(h.calls.filter(call=>call.method==='enqueue').length,1);stop();
});
