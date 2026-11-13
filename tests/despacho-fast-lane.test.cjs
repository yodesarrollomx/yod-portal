'use strict';
// Synthetic only: no network, no real case, no credentials.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const load=()=>import('../despacho3d/conversation.mjs'),loadFast=()=>import('../despacho3d/fast-lane.mjs');
const TOKEN='A'.repeat(30)+'.'+'a'.repeat(64),ENDPOINT='https://synthetic-engine.onrender.com';
const current={ok:true,case_id:'synthetic-case',name:'Terreno sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true};
function snapshot(){return {ok:true,case_id:current.case_id,source_revision:'rev-1',context:{identity:{case_id:current.case_id,name:current.name}},state:{updated_at:'2026-10-03T00:00:00Z'},conversation:[],jobs:[],events:[]};}
function backend(){
 const state=snapshot(),mints=[],enq=[];
 return {state,mints,enq,resolveCurrent:async()=>current,read:async()=>structuredClone(state),
  mintFastSession:async p=>{mints.push(p);return {ok:true,case_id:p.case_id,token:TOKEN,endpoint:ENDPOINT,expires_at:Date.now()+600000};},
  enqueue:async p=>{enq.push(p);state.jobs.push({case_id:p.case_id,job_id:'job-1',enqueue_request_id:p.request_id,status:'queued'});
   state.conversation.push({case_id:p.case_id,message_id:'m1',job_id:'job-1',role:'user',created_at:state.state.updated_at,body_json:JSON.stringify({message:p.message})});
   return {ok:true,state:'queued',case_id:p.case_id,request_id:p.request_id,job_id:'job-1',source_revision:p.expected_revision};}};
}
const sse=events=>events.map(([name,data])=>`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
const happy=(reply='Hola, aquí estoy.',savedEvent='saved')=>sse([['ack',{request_id:'x'}],['route',{tier:'simple',model:'gpt-6-luna',effort:'none',router:'heuristic'}],...reply.split(' ').map((w,i)=>['delta',{text:(i?' ':'')+w}]),['final',{reply,model:'gpt-6-luna',tier:'simple',total_ms:2100,ttft_ms:1500}],savedEvent==='saved'?['saved',{saved:true,job_id:'j'}]:['save_pending',{saved:false}]]);
function streamResponse(text,status=200){
 const encoder=new TextEncoder(),bytes=encoder.encode(text),parts=[bytes.slice(0,7),bytes.slice(7,40),bytes.slice(40)];
 return {ok:status<400,status,body:(async function*(){for(const p of parts)yield p;})(),json:async()=>JSON.parse(text)};
}
test('fast client validates the session, streams a turn across chunk boundaries and reports the confirmation',async()=>{
 const {createFastLaneClient,validateFastSession,FastLaneError}=await loadFast(),b=backend(),calls=[];
 for(const bad of [{ok:true,case_id:'other',token:TOKEN,endpoint:ENDPOINT,expires_at:Date.now()+9e5},{ok:true,case_id:current.case_id,token:'bad',endpoint:ENDPOINT,expires_at:Date.now()+9e5},{ok:true,case_id:current.case_id,token:TOKEN,endpoint:'https://evil.example',expires_at:Date.now()+9e5},{ok:true,case_id:current.case_id,token:TOKEN,endpoint:ENDPOINT,expires_at:1}])
  assert.throws(()=>validateFastSession(bad,current.case_id),FastLaneError);
 const seen=[];const client=createFastLaneClient({mint:p=>b.mintFastSession(p),fetchImpl:async(url,o)=>{calls.push({url,o});return streamResponse(happy());}});
 const result=await client.turn({case_id:current.case_id,message:'Hola',request_id:'req-1',onEvent:(n)=>seen.push(n)});
 assert.equal(result.final.reply,'Hola, aquí estoy.');assert.equal(result.saved,true);assert.equal(seen[0],'ack');
 assert.equal(calls[0].url,ENDPOINT+'/fast/turn');assert.equal(calls[0].o.credentials,'omit');assert.equal(calls[0].o.headers.Authorization,'Bearer '+TOKEN);
 await client.turn({case_id:current.case_id,message:'Otra',request_id:'req-2'});assert.equal(b.mints.length,1,'token reused until close to expiry');
});
test('an expired token is replaced once; a second rejection is unauthorized',async()=>{
 const {createFastLaneClient}=await loadFast(),b=backend();let n=0;
 const ok=createFastLaneClient({mint:p=>b.mintFastSession(p),fetchImpl:async()=>++n===1?{ok:false,status:401,json:async()=>({error:'unauthorized'})}:streamResponse(happy())});
 assert.equal((await ok.turn({case_id:current.case_id,message:'Hola',request_id:'r1'})).final.reply,'Hola, aquí estoy.');assert.equal(b.mints.length,2);
 const bad=createFastLaneClient({mint:p=>b.mintFastSession(p),fetchImpl:async()=>({ok:false,status:401,json:async()=>({error:'unauthorized'})})});
 await assert.rejects(bad.turn({case_id:current.case_id,message:'Hola',request_id:'r2'}),{code:'unauthorized'});
});
test('conversation streams into a visible turn, keeps it until Sheets shows it, and never enqueues behind the user',async()=>{
 const {Conversation}=await load(),b=backend();let release;
 const fetches=[];const {createFastLaneClient}=await loadFast();
 const fast=createFastLaneClient({mint:p=>b.mintFastSession(p),fetchImpl:async(url,o)=>{fetches.push(url);if(url.endsWith('/fast/hello'))return {ok:true,status:200};return streamResponse(happy('Hola, aquí estoy.'));}});
 const states=[];const c=new Conversation({transport:b,fast,uuid:()=> 'r'+states.length,notify:x=>states.push([x.status,x.fastTurns.map(t=>t.phase+':'+t.reply)])});
 assert.equal(await c.open(),true);await new Promise(r=>setTimeout(r,5));assert.ok(fetches.some(u=>u.endsWith('/fast/hello')),'warmed after opening');
 assert.equal(await c.send('Hola Gastón'),true);
 assert.equal(b.enq.length,0,'fast path does not queue');assert.ok(states.some(([s])=>s==='streaming'));
 assert.ok(states.some(([,t])=>t.some(x=>x.startsWith('streaming:Hola'))),'partial text was visible');
 assert.equal(c.status,'ready');assert.equal(c.fastTurns[0].phase,'done');assert.equal(c.fastTurns[0].reply,'Hola, aquí estoy.');
 // Sheets later shows both messages: the local overlay is reconciled away, never duplicated.
 b.state.conversation=[{case_id:current.case_id,message_id:'u',role:'user',created_at:b.state.state.updated_at,body_json:JSON.stringify({message:'Hola Gastón'})},
  {case_id:current.case_id,message_id:'a',role:'assistant',created_at:b.state.state.updated_at,body_json:JSON.stringify({reply:'Hola, aquí estoy.'})}];
 await c.refresh();assert.equal(c.fastTurns.length,0);assert.equal(c.model.messages.length,2);
});
test('an unconfirmed save keeps the turn pending so the shared watcher keeps reading; a failure before the answer falls back to the queue',async()=>{
 const {Conversation}=await load(),{createFastLaneClient}=await loadFast(),b=backend();
 const fast=createFastLaneClient({mint:p=>b.mintFastSession(p),fetchImpl:async(url)=>url.endsWith('/hello')?{ok:true,status:200}:streamResponse(happy('Ok listo','pending'))});
 const c=new Conversation({transport:b,fast});await c.open();await c.send('Pregunta');
 assert.equal(c.fastPending,true);assert.equal(c.fastTurns[0].saved,false);
 const down=new Conversation({transport:backend(),fast:createFastLaneClient({mint:async()=>({ok:false,error:'agent_unavailable'}),fetchImpl:async()=>{throw Error('offline');}}),uuid:()=> 'req'});
 const queued=down.transport;await down.open();assert.equal(await down.send('Mensaje por la cola'),true);
 assert.equal(queued.enq.length,1);assert.equal(queued.enq[0].message,'Mensaje por la cola');assert.equal(down.status,'processing');
 assert.equal(await down.send('Otro'),false,'processing blocks a second send');
});
test('errors after the engine accepted the turn never fall back or duplicate; the draft stays and nothing is claimed saved',async()=>{
 const {Conversation}=await load(),{createFastLaneClient}=await loadFast(),b=backend();
 const fast=createFastLaneClient({mint:p=>b.mintFastSession(p),fetchImpl:async(url)=>url.endsWith('/hello')?{ok:true,status:200}:streamResponse(sse([['ack',{}],['error',{code:'model_failed'}]]))});
 const c=new Conversation({transport:b,fast});await c.open();assert.equal(await c.send('Hola'),false);
 assert.equal(b.enq.length,0);assert.equal(c.fastTurns.length,0);assert.match(c.fastNotice,/no se guardó/);assert.equal(c.status,'ready');
});
test('without mintFastSession (old backend/transport) behaviour is the unchanged queue',async()=>{
 const {Conversation}=await load(),b=backend();delete b.mintFastSession;
 const c=new Conversation({transport:b,uuid:()=> 'request-1'});await c.open();assert.equal(await c.send('Hola'),true);assert.equal(b.enq.length,1);assert.equal(c.fastTurns.length,0);
});
test('closing the conversation aborts an in-flight turn and discards its answer',async()=>{
 const {Conversation}=await load(),b=backend();let sawAbort=false;
 const fast={warm:async()=>true,turn:({signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{sawAbort=true;reject(Object.assign(Error('cancelled'),{code:'cancelled'}));}))};
 const c=new Conversation({transport:b,fast});await c.open();const p=c.send('Hola');c.close();assert.equal(await p,false);
 assert.equal(sawAbort,true);assert.equal(c.fastTurns.length,0);assert.equal(c.model,null);
});
test('bridge and transport allow only an exact {case_id} mint on its own lane; the iframe never receives the OS credential',async()=>{
 const bridgeSrc=fs.readFileSync(require.resolve('../os/despacho-conversation.js'),'utf8'),transportSrc=fs.readFileSync(require.resolve('../os/despacho-transport.js'),'utf8');
 const listeners={},posts=[],source={postMessage:r=>posts.push(r)};let release;const calls=[];
 const root={location:{origin:'https://portal.invalid'},addEventListener:(n,f)=>listeners[n]=f,removeEventListener:()=>{},setTimeout,clearTimeout,console};root.globalThis=root;vm.runInNewContext(bridgeSrc,root);
 const transport={mintFastSession:async p=>{calls.push(p);return {ok:true,case_id:p.case_id,token:TOKEN,endpoint:ENDPOINT,expires_at:1};},read:()=>new Promise(r=>release=r)};
 root.YodDespachoConversation.bind({isAuthorized:()=>true,getIframeWindow:()=>source,getEpoch:()=>1,getTransport:()=>transport,timeout:50});
 const send=(method,payload,id)=>listeners.message({origin:root.location.origin,source,data:{type:'yod:case:request',version:1,id,method,payload}});
 await send('mintFastSession',{case_id:'c',extra:1},'a');await send('mintFastSession',{},'b');assert.equal(calls.length,0);
 const reading=send('read',{case_id:'c'},'r');await send('mintFastSession',{case_id:'c'},'m');assert.equal(calls.length,1,'a slow read does not block the mint lane');
 assert.equal(JSON.stringify(posts).includes('synthetic-session'),false);release({});await reading;
 const c=vm.createContext({AbortController,setTimeout,clearTimeout});vm.runInContext(transportSrc,c);let body;
 const t=c.YodDespachoTransport.create({endpoint:'https://script.google.com/macros/s/SYNTHETIC/exec',getSession:()=>({ready:true,allowed:true,token:'synthetic-session',epoch:1}),fetch:async(u,o)=>{body=JSON.parse(o.body);return {ok:true,text:async()=>'{"ok":true}'};}});
 await t.mintFastSession({case_id:'c'});assert.equal(body.operation,'mintFastSession');assert.deepEqual(body.payload,{case_id:'c'});
 await assert.rejects(t.mintFastSession({case_id:'c',x:1}),{message:'invalid_payload'});
});
test('public sources stay neutral: no engine URL, case identity or secrets in the fast-lane client',()=>{
 const text=fs.readFileSync(require.resolve('../despacho3d/fast-lane.mjs'),'utf8');
 assert.doesNotMatch(text,/ptmuaik6hq4px6g|yod-cloud-room|localStorage|sessionStorage|indexedDB|console\./);
});
