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
  const ack={ok:true,state:'queued',case_id:p.case_id,request_id:p.request_id,job_id:'job-'+(receipts.size+1),source_revision:p.expected_revision};
  receipts.set(p.request_id,ack);state.jobs.push({case_id:p.case_id,job_id:ack.job_id,enqueue_request_id:p.request_id,status:'queued'});
  state.conversation.push({case_id:p.case_id,message_id:'message-'+(state.conversation.length+1),job_id:ack.job_id,role:'user',created_at:state.state.updated_at,body_json:JSON.stringify({message:p.message})});return ack;
 }};
}
test('chat alongside a running durable job keeps that job and never enqueues a second job',async()=>{
 const {Conversation}=await load(),backend=server();
 backend.state.jobs.push({case_id:current.case_id,job_id:'existing',enqueue_request_id:'original',status:'running'});
 const turns=[];const fast={warm:async()=>{},turn:async p=>{turns.push(p);return {final:{reply:'Respuesta de conversación'},saved:false};}};
 const c=new Conversation({transport:backend,fast,uuid:()=> 'parallel-chat'});await c.open();
 assert.equal(c.status,'processing');assert.equal(c.canSend,true);assert.equal(await c.send('¿Cómo va?'),true);
 assert.equal(turns.length,1);assert.equal(c.status,'processing');assert.equal(c.fastTurns[0].reply,'Respuesta de conversación');assert.equal(backend.calls.length,0);assert.equal(backend.state.jobs.length,1);
});
test('fast channel failure during work preserves the draft contract and cannot fall back to enqueue',async()=>{
 const {Conversation}=await load();
 for(const code of ['unavailable','busy','model_failed']){
  const backend=server();backend.state.jobs.push({case_id:current.case_id,job_id:'existing',enqueue_request_id:'original',status:'running'});
  const fast={warm:async()=>{},turn:async()=>{throw Object.assign(Error(code),{code,started:false});}};
  const c=new Conversation({transport:backend,fast,uuid:()=>code});await c.open();
  assert.equal(await c.send('Borrador conservado'),false);assert.equal(c.status,'processing');assert.equal(backend.calls.length,0);assert.equal(c.pending,null);assert.ok(c.fastNotice);assert.equal(c.fastTurns.length,0);
 }
});
test('parallel chat remains disabled without its channel, fresh authorization or current history',async()=>{
 const {Conversation}=await load(),backend=server();backend.state.jobs.push({case_id:current.case_id,job_id:'existing',enqueue_request_id:'original',status:'running'});
 const c=new Conversation({transport:backend});await c.open();assert.equal(c.canSend,false);assert.equal(await c.send('No enviar'),false);
 let turns=0;c.fastOverride={warm:async()=>{},turn:async()=>{turns++;}};
 backend.read=async()=>{throw Error('timeout');};await c.refresh();assert.equal(c.canSend,false);assert.equal(await c.send('No enviar'),false);
 backend.resolveCurrent=async()=>({...current,can_enqueue:false});backend.read=async()=>backend.state;await c.refresh();assert.equal(c.canSend,false);assert.equal(await c.send('No enviar'),false);assert.equal(turns,0);assert.equal(backend.calls.length,0);
});
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
test('a stopped turn is only resent by explicit action, with a new ID and the original text',async()=>{
 const {Conversation}=await load(),backend=server();let id=0;
 const c=new Conversation({transport:backend,uuid:()=> 'retry-'+(++id)});
 await c.open();await c.send('Mensaje original detenido');backend.state.jobs[0].status='stopped';await c.refresh();
 assert.equal(c.stoppedMessage,'Mensaje original detenido');assert.equal(backend.calls.length,1);
 assert.equal(await c.retryStopped(),true);assert.equal(backend.calls.length,2);
 assert.notEqual(backend.calls[1].request_id,backend.calls[0].request_id);assert.equal(backend.calls[1].message,backend.calls[0].message);
 assert.equal(backend.state.jobs[0].status,'stopped');assert.equal(await c.retryStopped(),false);assert.equal(backend.calls.length,2);
});
test('reread reconciles a lost ACK without any second enqueue',async()=>{
 const {Conversation}=await load(),backend=server(),enqueue=backend.enqueue;backend.enqueue=async p=>{await enqueue(p);throw Error('offline');};
 const c=new Conversation({transport:backend,uuid:()=> 'request-1'});await c.open();await c.send('Mensaje');await c.refresh();assert.equal(c.pending,null);assert.equal(c.status,'processing');assert.equal(backend.calls.length,1);
});
test('missing transport or disconnected engine never enables writes',async()=>{
 const {Conversation}=await load();const missing=new Conversation({transport:null});assert.equal(await missing.open(),false);assert.equal(await missing.send('Hola'),false);
 const backend=server();backend.resolveCurrent=async()=>({...current,agent_ready:false});const c=new Conversation({transport:backend});await c.open();assert.equal(await c.send('Hola'),false);assert.equal(backend.calls.length,0);
});
test('authorization and malformed history have distinct safe diagnostics, without reading or sending after denial',async()=>{
 const {Conversation}=await load(),backend=server();let reads=0;
 backend.resolveCurrent=async()=>({ok:false,error:'unauthorized',detail:'private provider detail'});
 backend.read=async()=>{reads++;return snapshot();};
 const c=new Conversation({transport:backend});assert.equal(await c.open(),false);
 assert.deepEqual(c.diagnostic,{step:'expediente',code:'unauthorized'});assert.equal(reads,0);assert.equal(await c.send('Hola'),false);
 backend.resolveCurrent=async()=>current;backend.read=async()=>({...snapshot(),context:{}});
 assert.equal(await c.open(),false);assert.deepEqual(c.diagnostic,{step:'historial',code:'invalid_snapshot'});
 c.close();assert.equal(c.diagnostic,null);
});
test('unknown provider exceptions are never exposed through connection diagnostics',async()=>{
 const {Conversation}=await load(),backend=server();backend.resolveCurrent=async()=>{throw Error('private token or transcript');};
 const c=new Conversation({transport:backend});await c.open();assert.deepEqual(c.diagnostic,{step:'expediente',code:'unavailable'});
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
 const b=bridge();b.setTransport(null);await b.request();assert.equal(b.posts[0].error,'unavailable');b.setTransport({resolveCurrent:()=>new Promise(()=>{})});await b.request();assert.equal(b.posts[1].error,'timeout');b.setTransport(server());await b.request();assert.equal(b.posts[2].result.case_id,current.case_id);
});
test('office bridge rejects forged scope, keeps visits independent and suppresses a revoked reply',async()=>{
 const b=bridge(),calls=[];let release;
 b.setTransport({readOfficePermissions:async p=>{calls.push(p);await new Promise(r=>release=r);return {ok:true};},readVisits:async()=>({ok:true,visits:[]}),readOfficePending:async p=>{calls.push(p);return {ok:true};}});
 const data=(id,method,payload)=>({type:'yod:case:request',version:1,id,method,payload});
 await b.request({origin:'https://other.invalid',data:data('a','readOfficePermissions',{case_id:'synthetic'})});
 await b.request({source:b.other,data:data('a','readOfficePermissions',{case_id:'synthetic'})});
 for(const payload of [{case_id:'synthetic',space_id:'drive'},{case_id:'synthetic',space_id:'juntas',level:'accion'},{case_id:'synthetic',space_id:'juntas',actor_id:'forged'}])await b.request({data:data('a','readOfficePending',payload)});
 assert.equal(calls.length,0);
 const pending=b.request({data:data('office','readOfficePermissions',{case_id:'synthetic'})});
 await b.request({data:data('visits','readVisits',{case_id:'synthetic'})});assert.equal(b.posts[0].id,'visits');
 await b.request({data:data('office-busy','readOfficePending',{case_id:'synthetic',space_id:'juntas'})});assert.equal(b.posts[1].error,'transport_busy');
 b.setAllowed(false);release();await pending;assert.equal(b.posts.length,2);assert.equal(calls.length,1);
});
test('chinche 249: a slow read never bounces a message, and mutations still go one at a time',async()=>{
 const b=bridge(),sent=[];let releaseRead,releaseSend;
 b.setTransport({read:async()=>{await new Promise(r=>releaseRead=r);return {ok:true};},enqueue:async p=>{sent.push(p.request_id);await new Promise(r=>releaseSend=r);return {ok:true,state:'queued'};}});
 const data=(id,method,payload)=>({type:'yod:case:request',version:1,id,method,payload});
 const msg=id=>({case_id:'synthetic',expected_revision:'r1',request_id:id,message:'Hola'});
 const reading=b.request({data:data('read','read',{case_id:'synthetic'})});
 const first=b.request({data:data('send-1','enqueue',msg('m1'))});
 await new Promise(r=>setImmediate(r));assert.deepEqual(sent,['m1']);
 await b.request({data:data('send-2','enqueue',msg('m2'))});assert.equal(b.posts[0].id,'send-2');assert.equal(b.posts[0].error,'transport_busy');assert.deepEqual(sent,['m1']);
 releaseSend();await first;assert.equal(b.posts[1].id,'send-1');assert.equal(b.posts[1].error,null);
 releaseRead();await reading;assert.equal(b.posts[2].id,'read');
});

test('workspace sources remain readable when unrelated conversation history is invalid',async()=>{
 const {validateWorkspaceSources,validateConversation}=await load(),s=snapshot();
 s.context.documents=[['source-1','PPP sintético','https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=synthetic-case','Plan de potencial']];
 s.conversation=[{case_id:s.case_id,message_id:'old-invalid',role:'assistant',body_json:'{invalid',created_at:s.state.updated_at}];
 assert.throws(()=>validateConversation(s,s.case_id));
 const sources=validateWorkspaceSources(s,s.case_id);
 assert.equal(sources.documents.length,1);assert.equal(sources.documents[0].title,'PPP sintético');
 assert.equal(sources.case_id,s.case_id);assert.equal(sources.revision,s.source_revision);
 assert.equal(Object.hasOwn(sources,'messages'),false);
});
test('workspace source metadata fails closed for denied, mixed case or malformed rows',async()=>{
 const {validateWorkspaceSources}=await load();
 for(const mutate of [s=>s.ok=false,s=>s.case_id='other-case',s=>s.context.identity.case_id='other-case',s=>s.source_revision='',s=>s.state.updated_at='bad',s=>s.context.documents=[['bad','shape']],s=>s.context.documents=Array.from({length:101},()=>['id','title','https://example.test','role'])]){
  const s=snapshot();mutate(s);assert.throws(()=>validateWorkspaceSources(s,current.case_id),{message:'invalid_snapshot'});
 }
});
test('workspace source projection never enables a conversation mutation from a bad snapshot',async()=>{
 const {Conversation,validateWorkspaceSources}=await load(),backend=server();
 backend.state.events=[{case_id:'other-case',event_id:'bad',kind:'bad',created_at:backend.state.state.updated_at}];
 assert.equal(validateWorkspaceSources(backend.state,current.case_id).case_id,current.case_id);
 const c=new Conversation({transport:backend});assert.equal(await c.open(),false);assert.equal(await c.send('No enviar'),false);
 assert.equal(backend.calls.length,0);
});

test('small authorized PPP sources survive accumulated history without weakening conversation validation',async()=>{
 const {validateWorkspaceSources,validateConversation,workspaceSourceNotice}=await load();
 const {resolveBoard}=await import('../despacho3d/project-station.mjs');
 const s=snapshot();s.context.documents=[['ppp','Plan de potencial','https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open='+current.case_id,'PPP']];
 s.conversation=[{body_json:'x'.repeat(620120)}];assert.ok(JSON.stringify(s).length>524288);
 const projection=validateWorkspaceSources(s,current.case_id);
 assert.ok(JSON.stringify(projection).length<2048);assert.equal(projection.documents.length,1);
 assert.equal(resolveBoard(current,projection.documents).board_case_id,current.case_id);
 assert.throws(()=>validateConversation(s,current.case_id),/invalid_message/);
 assert.match(workspaceSourceNotice(Error('response_limit')),/límite/);
 assert.match(workspaceSourceNotice(Error('invalid_response')),/ilegible/);
 assert.match(workspaceSourceNotice(Error('invalid_snapshot')),/metadatos válidos/);
 assert.match(workspaceSourceNotice(Error('timeout')),/tardó demasiado/);
});
test('PPP source projection still rejects foreign identity, malformed metadata, oversized documents and explicit access refusal',async()=>{
 const {validateWorkspaceSources}=await load();const valid=snapshot();
 valid.context.documents=[['ppp','Plan de potencial','https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open='+current.case_id,'PPP']];
 const rejected=[
  {...valid,case_id:'other-case'},
  {...valid,context:{...valid.context,identity:{case_id:'other-case',name:'Otro'}}},
  {...valid,state:{updated_at:'invalid-date'}},
  {...valid,source_revision:''},
  {...valid,context:{...valid.context,documents:[['incomplete']]}}
 ];
 for(const s of rejected)assert.throws(()=>validateWorkspaceSources(s,current.case_id),/invalid_snapshot/);
 const large=structuredClone(valid);large.context.documents=Array.from({length:100},()=>['ppp','x'.repeat(7000),'https://example.test/','PPP']);
 assert.throws(()=>validateWorkspaceSources(large,current.case_id),/response_limit/);
 assert.throws(()=>validateWorkspaceSources({ok:false,error:'unauthorized'},current.case_id),/^Error: unauthorized$/);
 assert.throws(()=>validateWorkspaceSources({ok:false,error:'private server detail'},current.case_id),/^Error: unavailable$/);
});
test('real OS read transport projects a large snapshot into the canonical board without a new API',async()=>{
 const {validateWorkspaceSources}=await load(),{resolveBoard}=await import('../despacho3d/project-station.mjs');
 const s=snapshot();s.context.documents=[['ppp','Plan de potencial','https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open='+current.case_id,'PPP']];s.events=[{payload_json:'x'.repeat(620120)}];
 const calls=[],source=fs.readFileSync(require('node:path').join(__dirname,'../os/despacho-transport.js'),'utf8'),context=vm.createContext({AbortController,setTimeout,clearTimeout});vm.runInContext(source,context);
 const t=context.YodDespachoTransport.create({endpoint:'https://script.google.com/macros/s/synthetic/exec',getSession:()=>({ready:true,allowed:true,token:'synthetic-session',epoch:1}),fetch:async(url,request)=>{calls.push(JSON.parse(request.body));return {ok:true,text:async()=>JSON.stringify(s)};}});
 const projection=validateWorkspaceSources(await t.read({case_id:current.case_id}),current.case_id);
 assert.equal(resolveBoard(current,projection.documents).board_case_id,current.case_id);
 assert.deepEqual(calls.map(c=>c.operation),['read']);assert.equal(calls[0].k,'synthetic-session');
 assert.deepEqual(calls[0].payload,{case_id:current.case_id});
});

test('large valid read preserves every message, job and event under the validated model budget',async()=>{
 const {validateConversation,Conversation}=await load(),s=snapshot(),extra='x'.repeat(620120),id=current.case_id;
 s.conversation=[{case_id:id,message_id:'message-1',role:'user',body_json:JSON.stringify({message:'Mensaje sintético conservado'}),created_at:s.state.updated_at}];
 s.jobs=[{case_id:id,job_id:'job-1',enqueue_request_id:'request-1',status:'queued',input_json:extra}];
 s.events=[{case_id:id,event_id:'event-1',kind:'queued',created_at:s.state.updated_at,payload_json:extra}];
 assert.ok(JSON.stringify(s).length>524288);assert.ok(JSON.stringify(s).length<2097152);
 const model=validateConversation(s,id);assert.equal(model.messages.length,1);assert.equal(model.jobs.length,1);assert.equal(model.events.length,1);
 assert.equal(model.messages[0].body,'Mensaje sintético conservado');assert.equal(model.processing,true);
 assert.equal(Object.hasOwn(model.jobs[0],'input_json'),false,'unrendered payload never belonged to the conversation model');
 const backend=server();Object.assign(backend.state,s);const conversation=new Conversation({transport:backend});assert.equal(await conversation.open(),true);
 assert.equal(conversation.model.messages[0].body,'Mensaje sintético conservado');
 for(const change of [
  v=>{v.conversation[0].case_id='other-case';},
  v=>{v.conversation[0].body_json=JSON.stringify({message:1});},
  v=>{v.jobs[0].status='';},
  v=>{v.jobs[0].case_id='other-case';},
  v=>{v.events[0].created_at='invalid';},
  v=>{v.events[0].case_id='other-case';}
 ]){const invalid=structuredClone(s);change(invalid);assert.throws(()=>validateConversation(invalid,id));}
});
test('history is never truncated to fit: excessive validated model is rejected in full',async()=>{
 const {validateConversation}=await load(),s=snapshot();
 s.conversation=Array.from({length:50},(_,i)=>({case_id:current.case_id,message_id:'message-'+i,role:'user',body_json:JSON.stringify({message:'x'.repeat(12000)}),created_at:s.state.updated_at}));
 assert.ok(JSON.stringify(s).length<2097152);assert.throws(()=>validateConversation(s,current.case_id),/invalid_snapshot/);
 const original=s.conversation.length;assert.equal(original,50);
 s.conversation[0].body_json=JSON.stringify({message:'small',ignored:'x'.repeat(2097152)});
 assert.throws(()=>validateConversation(s,current.case_id),/invalid_snapshot/);assert.equal(s.conversation.length,original);
});
test('source diagnostics cross the actual OS bridge without exposing private server errors',async()=>{
 const b=bridge();
 for(const [code,expected]of [['response_limit','response_limit'],['invalid_response','invalid_response'],['private server response','unavailable']]){
  b.setTransport({read:async()=>{throw Error(code);}});
  await b.request({data:{type:'yod:case:request',version:1,id:'diagnostic-'+expected,method:'read',payload:{case_id:'synthetic-case'}}});
  assert.equal(b.posts.at(-1).error,expected);
 }
 b.binding.dispose();
});
