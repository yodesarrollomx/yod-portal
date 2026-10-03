'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const load=()=>import('../despacho3d/conversation.mjs');
const current={ok:true,case_id:'synthetic-case',name:'Terreno sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true};
function snapshot(){return {ok:true,case_id:current.case_id,source_revision:'rev-1',context:{identity:{case_id:current.case_id,name:current.name}},state:{updated_at:'2026-10-03T00:00:00Z'},conversation:[],jobs:[],events:[]};}
function server(){
 const state=snapshot(),receipts=new Map(),calls=[];
 return {state,calls,resolveCurrent:async()=>current,read:async()=>structuredClone(state),enqueue:async p=>{
  calls.push(p);if(receipts.has(p.request_id))return receipts.get(p.request_id);
  if(p.expected_revision!==state.source_revision)return {ok:false,error:'stale_revision'};
  const ack={ok:true,state:'queued',case_id:p.case_id,request_id:p.request_id,job_id:'job-1',source_revision:p.expected_revision};
  receipts.set(p.request_id,ack);state.jobs.push({case_id:p.case_id,job_id:ack.job_id,enqueue_request_id:p.request_id,status:'queued'});
  state.conversation.push({case_id:p.case_id,message_id:'message-1',role:'user',created_at:state.state.updated_at,body_json:JSON.stringify({message:p.message})});return ack;
 }};
}
test('resolves a private case without a browser selector and rereads persisted conversation after closing',async()=>{
 const {Conversation}=await load(),backend=server();let resolves=0;backend.resolveCurrent=async p=>{assert.deepEqual(p,{});resolves++;return current;};
 const c=new Conversation({transport:backend,uuid:()=> 'request-1'});assert.equal(await c.open(),true);assert.equal(await c.send('Mensaje sintético'),true);
 backend.state.jobs[0].status='completed';backend.state.conversation.push({case_id:current.case_id,message_id:'message-2',role:'assistant',created_at:backend.state.state.updated_at,body_json:JSON.stringify({reply:'Respuesta sintética conservada'})});
 c.close();assert.equal(c.model,null);assert.equal(c.selection,null);
 const reopened=new Conversation({transport:backend});assert.equal(await reopened.open(),true);assert.equal(reopened.model.messages[1].body,'Respuesta sintética conservada');assert.equal(backend.calls.length,1);assert.equal(resolves,3);
});
test('lost durable ACK retries the original ID and message without a duplicate',async()=>{
 const {Conversation}=await load(),backend=server(),enqueue=backend.enqueue;let fail=true;
 backend.enqueue=async p=>{const result=await enqueue(p);if(fail){fail=false;throw Error('lost ACK');}return result;};
 const c=new Conversation({transport:backend,uuid:()=> 'request-1'});await c.open();assert.equal(await c.send('Mensaje'),false);assert.equal(c.status,'unconfirmed');
 assert.equal(await c.send('texto distinto que no se enviará'),true);assert.deepEqual(backend.calls[0],backend.calls[1]);assert.equal(backend.state.conversation.length,1);
});
test('reread reconciles a lost ACK without any second enqueue',async()=>{
 const {Conversation}=await load(),backend=server(),enqueue=backend.enqueue;backend.enqueue=async p=>{await enqueue(p);throw Error('offline');};
 const c=new Conversation({transport:backend,uuid:()=> 'request-1'});await c.open();await c.send('Mensaje');await c.refresh();assert.equal(c.pending,null);assert.equal(c.status,'processing');assert.equal(backend.calls.length,1);
});
test('missing transport or disconnected engine never enables writes',async()=>{
 const {Conversation}=await load();const missing=new Conversation({transport:null});assert.equal(await missing.open(),false);assert.equal(await missing.send('Hola'),false);
 const backend=server();backend.resolveCurrent=async()=>({...current,agent_ready:false});const c=new Conversation({transport:backend});await c.open();assert.equal(await c.send('Hola'),false);assert.equal(backend.calls.length,0);
});
test('refresh revalidates worker availability and never changes the selected case silently',async()=>{
 const {Conversation}=await load(),backend=server();let ready=false,caseId=current.case_id;
 backend.resolveCurrent=async()=>({...current,case_id:caseId,agent_ready:ready,can_enqueue:ready});
 const c=new Conversation({transport:backend});await c.open();assert.equal(await c.send('Hola'),false);
 ready=true;await c.refresh();assert.equal(c.selection.agent_ready,true);
 ready=false;await c.refresh();assert.equal(await c.send('Hola'),false);
 caseId='another-case';assert.equal(await c.refresh(),false);assert.equal(c.model,null);assert.equal(backend.calls.length,0);
});
test('late read cannot restore private data after closing',async()=>{
 const {Conversation}=await load(),backend=server();let release;backend.read=()=>new Promise(resolve=>release=resolve);
 const c=new Conversation({transport:backend}),opening=c.open();await new Promise(resolve=>setImmediate(resolve));c.close();release(snapshot());assert.equal(await opening,false);assert.equal(c.model,null);assert.equal(c.selection,null);
});
test('source revision conflicts preserve the caller draft and require fresh reading',async()=>{
 const {Conversation}=await load(),backend=server(),c=new Conversation({transport:backend});await c.open();backend.state.source_revision='rev-2';assert.equal(await c.send('No sobrescribir'),false);assert.equal(c.status,'conflict');assert.equal(c.pending,null);assert.equal(backend.state.conversation.length,0);await c.refresh();assert.equal(c.model.revision,'rev-2');
});
test('forged ACK does not claim a saved message',async()=>{
 const {Conversation}=await load(),backend=server();backend.enqueue=async()=>({ok:true,state:'queued',request_id:'wrong'});const c=new Conversation({transport:backend});await c.open();assert.equal(await c.send('Mensaje'),false);assert.equal(c.status,'unconfirmed');assert.ok(c.pending);
});
test('bounded schemas reject another case, duplicate message IDs and executable URLs',async()=>{
 const {validateSelection,validateConversation}=await load();assert.throws(()=>validateSelection({...current,url:'javascript:alert(1)'}));let s=snapshot();s.context.identity.case_id='other';assert.throws(()=>validateConversation(s,current.case_id));s=snapshot();const row={case_id:current.case_id,message_id:'same',role:'user',created_at:s.state.updated_at,body_json:'{"message":"hola"}'};s.conversation=[row,row];assert.throws(()=>validateConversation(s,current.case_id));
});
function bridge(){
 const listeners={},posts=[],source={postMessage:r=>posts.push(r)},other={postMessage:()=>assert.fail('wrong frame')};let epoch=1,allowed=true,transport=server();
 const root={location:{origin:'https://portal.invalid'},addEventListener:(n,f)=>listeners[n]=f,removeEventListener:n=>delete listeners[n],setTimeout,clearTimeout,console};root.globalThis=root;
 vm.runInNewContext(fs.readFileSync(require.resolve('../os/despacho-conversation.js'),'utf8'),root);
 const binding=root.YodDespachoConversation.bind({isAuthorized:()=>allowed,getIframeWindow:()=>source,getEpoch:()=>epoch,getTransport:()=>transport,timeout:50});
 const request=(extra={})=>listeners.message({origin:root.location.origin,source,data:{type:'yod:case:request',version:1,id:'request-1',method:'resolveCurrent',payload:{}},...extra});
 return {posts,source,other,request,binding,setEpoch:v=>epoch=v,setAllowed:v=>allowed=v,setTransport:v=>transport=v};
}
test('bridge rejects wrong origins, windows, methods and arbitrary workbook selectors',async()=>{
 const b=bridge();await b.request({origin:'https://evil.invalid'});await b.request({source:b.other});await b.request({data:{type:'yod:case:request',version:1,id:'request-1',method:'resolveCurrent',payload:{spreadsheet_id:'any'}}});assert.equal(b.posts.length,0);await b.request();assert.equal(b.posts.length,1);
});
test('bridge discards old-session replies and requires current authorization',async()=>{
 const b=bridge();let release;b.setTransport({resolveCurrent:()=>new Promise(resolve=>release=resolve)});const promise=b.request();b.setEpoch(2);release(current);await promise;assert.equal(b.posts.length,0);b.setAllowed(false);await b.request();assert.equal(b.posts.length,0);
});
test('bridge fails closed without a server adapter and recovers a stalled request',async()=>{
 const b=bridge();b.setTransport(null);await b.request();assert.equal(b.posts[0].error,'unavailable');b.setTransport({resolveCurrent:()=>new Promise(()=>{})});await b.request();assert.equal(b.posts[1].error,'unavailable');b.setTransport(server());await b.request();assert.equal(b.posts[2].result.case_id,current.case_id);
});
