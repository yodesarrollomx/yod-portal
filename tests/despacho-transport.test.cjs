const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../os/despacho-transport.js'),'utf8');
function harness(fetch,timers={}){const c=vm.createContext({AbortController,setTimeout,clearTimeout,...timers});vm.runInContext(source,c);let session={ready:true,allowed:true,token:'synthetic-session',epoch:1};return {create:(extra={})=>c.YodDespachoTransport.create({endpoint:'https://script.google.com/macros/s/synthetic/exec',getSession:()=>session,fetch,...extra}),session:s=>{session=s;}};}
test('POST retains credentials in body, uses one server and preserves the receipt',async()=>{let calls=[];const h=harness(async(url,request)=>{calls.push({url,request});return {ok:true,text:async()=>'{"ok":true,"job_id":"job-synthetic"}'};});let t=h.create();const r=await t.enqueue({request_id:'req-synthetic',message:'Texto'});assert.equal(r.job_id,'job-synthetic');assert.equal(calls.length,1);assert.ok(!calls[0].url.includes('session'));const b=JSON.parse(calls[0].request.body);assert.equal(b.k,'synthetic-session');assert.equal(b.operation,'enqueue');assert.equal(calls[0].request.credentials,'omit');assert.equal(calls[0].request.headers['Content-Type'],'text/plain;charset=UTF-8');});
test('no request without confirmed permission; session changes discard late private result',async()=>{let release,count=0;const h=harness(async()=>{count++;await new Promise(r=>release=r);return {ok:true,text:async()=>'{"ok":true}'};});h.session({ready:false});await assert.rejects(h.create().read({}),/unauthorized/);assert.equal(count,0);h.session({ready:true,allowed:true,token:'a',epoch:1});const pending=h.create().read({});h.session({ready:true,allowed:true,token:'b',epoch:2});release();await assert.rejects(pending,/session_changed/);});
test('invalid endpoints and oversized responses fail closed without fallback',async()=>{let count=0;const h=harness(async()=>{count++;return {ok:true,text:async()=>'x'.repeat(524289)};});assert.throws(()=>h.create({endpoint:'https://example.test/exec'}),/invalid_endpoint/);assert.throws(()=>h.create({endpoint:'https://script.google.com/macros/s/x/exec?k=secret'}),/invalid_endpoint/);await assert.rejects(h.create().resolveCurrent({}),/response_limit/);assert.equal(count,1);});
test('temporary validation pending does not send a write or impersonate a revoked session',async()=>{let calls=0;const h=harness(async()=>{calls++;return {ok:true,text:async()=>'{"ok":true}'};});h.session({ready:false,allowed:true,token:'same-session',epoch:1});await assert.rejects(h.create().enqueue({request_id:'request-original',message:'Texto'}),/session_pending/);assert.equal(calls,0);h.session({ready:true,allowed:true,token:'same-session',epoch:1});await h.create().read({});assert.equal(calls,1);});
test('same-session readiness loss suppresses private response without claiming an identity change',async()=>{let release;const h=harness(async()=>{await new Promise(resolve=>release=resolve);return {ok:true,text:async()=>'{"ok":true,"private":"synthetic"}'};});const session={ready:true,allowed:true,token:'same-session',epoch:1};h.session(session);const request=h.create().read({});session.ready=false;release();await assert.rejects(request,/session_pending/);});
test('actual permission revocation and in-place epoch changes fence late responses',async()=>{let release;const h=harness(async()=>{await new Promise(resolve=>release=resolve);return {ok:true,text:async()=>'{"ok":true}'};});const session={ready:true,allowed:true,token:'same-session',epoch:1};h.session(session);let request=h.create().read({});session.allowed=false;release();await assert.rejects(request,/unauthorized/);session.allowed=true;request=h.create().read({});session.epoch=2;release();await assert.rejects(request,/session_changed/);});
test('fetch timeout stays transient and never retries a mutation behind the caller',async()=>{const calls=[];const h=harness(async(url,request)=>{calls.push(JSON.parse(request.body));await new Promise((resolve,reject)=>request.signal.addEventListener('abort',()=>{const error=Error('aborted');error.name='AbortError';reject(error);},{once:true}));});await assert.rejects(h.create({timeout:5}).enqueue({request_id:'original-mutation',message:'Texto sintético'}),/timeout/);assert.equal(calls.length,1);assert.equal(calls[0].payload.request_id,'original-mutation');});
test('office requests accept only scoped reads and never accept actor or level from the client',async()=>{
 const calls=[],h=harness(async(url,request)=>{calls.push(JSON.parse(request.body));return {ok:true,text:async()=>'{"ok":true}'};});const t=h.create();
 for(const p of [{case_id:'synthetic',space_id:'drive'},{case_id:'synthetic',space_id:'juntas',level:'accion'},{case_id:'synthetic',space_id:'juntas',actor_id:'forged'}])await assert.rejects(t.readOfficePending(p),/invalid_payload/);
 await assert.rejects(t.readOfficePermissions({case_id:'synthetic',level:'accion'}),/invalid_payload/);assert.equal(calls.length,0);
 await t.readOfficePermissions({case_id:'synthetic'});await t.readOfficePending({case_id:'synthetic',space_id:'juntas'});
 assert.deepEqual(calls.map(c=>c.operation),['readOfficePermissions','readOfficePending']);assert.equal(calls[1].k,'synthetic-session');assert.deepEqual(calls[1].payload,{case_id:'synthetic',space_id:'juntas'});
});

test('only authenticated durable read may carry bounded accumulated history; other operations retain their524288-character bound',async()=>{
 const payload=JSON.stringify({ok:true,history:'x'.repeat(620120)}),calls=[];
 const h=harness(async(url,request)=>{calls.push(JSON.parse(request.body));return {ok:true,text:async()=>payload};}),transport=h.create();
 assert.equal((await transport.read({case_id:'synthetic-case'})).history.length,620120);
 await assert.rejects(transport.resolveCurrent({case_id:'synthetic-case'}),/response_limit/);
 await assert.rejects(transport.readGoals({case_id:'synthetic-case'}),/response_limit/);
 assert.deepEqual(calls.map(c=>c.operation),['read','resolveCurrent','readGoals']);
 const tooLarge=harness(async()=>({ok:true,text:async()=>'x'.repeat(2097153)}));
 await assert.rejects(tooLarge.create().read({case_id:'synthetic-case'}),/response_limit/);
});
test('large source read remains fenced by revocation and late session change',async()=>{
 let release;const payload=JSON.stringify({ok:true,history:'x'.repeat(620120)});
 const h=harness(async()=>{await new Promise(r=>release=r);return {ok:true,text:async()=>payload};});
 const session={ready:true,allowed:true,token:'same-session',epoch:1};h.session(session);
 let request=h.create().read({case_id:'synthetic-case'});session.allowed=false;release();await assert.rejects(request,/unauthorized/);
 session.allowed=true;request=h.create().read({case_id:'synthetic-case'});session.epoch++;release();await assert.rejects(request,/session_changed/);
});
test('an unreadable JSON response reports format without logging its body',async()=>{
 const h=harness(async()=>({ok:true,text:async()=>'<html>synthetic unreadable response</html>'}));
 await assert.rejects(h.create().read({case_id:'synthetic-case'}),/^Error: invalid_response$/);
});

test('team operations validate exact intent and return direct correlated responses',async()=>{
 const calls=[],h=harness(async(url,request)=>{const b=JSON.parse(request.body);calls.push(b);return {ok:true,text:async()=>JSON.stringify(b.operation==='readTeam'?{version:1,revision:'r',members:[],tasks:[],events:[]}:{version:1,status:'saved',request_id:b.payload.request_id,text:b.payload.text})};});
 const t=h.create(),intent={version:1,kind:'request',text:'Exact text  ',task_id:null,request_id:'request_synthetic_12345',expected_revision:'r'};
 assert.equal((await t.readTeam({})).version,1);assert.equal((await t.writeTeam(intent)).text,intent.text);await t.lookupTeamReceipt({request_id:intent.request_id});
 assert.deepEqual(calls.map(b=>b.operation),['readTeam','writeTeam','lookupTeamReceipt']);assert.deepEqual(calls[1].payload,intent);
 for(const bad of [{...intent,author_id:'forged'},{...intent,task_id:'task'},{...intent,text:' '},{...intent,request_id:'short'}])await assert.rejects(t.writeTeam(bad),/invalid_payload/);
 await assert.rejects(t.readTeam({actor_id:'forged'}),/invalid_payload/);assert.equal(calls.length,3);
});
test('team server errors and session revocation cannot produce a saved receipt',async()=>{
 const h=harness(async()=>({ok:true,text:async()=>JSON.stringify({ok:false,error:'revision_conflict'})}));await assert.rejects(h.create().readTeam({}),/revision_conflict/);
 let release;const delayed=harness(async()=>{await new Promise(r=>release=r);return {ok:true,text:async()=>JSON.stringify({version:1,status:'saved'})};});
 const session={ready:true,allowed:true,token:'same',epoch:1};delayed.session(session);const p=delayed.create().lookupTeamReceipt({request_id:'request_synthetic_12345'});session.allowed=false;release();await assert.rejects(p,/unauthorized/);
});

test('explicit team authority rejection signals teardown instead of retaining private snapshot',async()=>{for(const error of ['forbidden','unauthorized','revocado']){const h=harness(async()=>({ok:true,text:async()=>JSON.stringify({ok:false,error})}));await assert.rejects(h.create().readTeam({}),/session_changed/);}});

const reply=value=>({ok:true,text:async()=>JSON.stringify(value)});
const fastWaits=scheduled=>({setTimeout(fn,ms){scheduled.push(ms);return setTimeout(fn,ms===500||ms===1000?0:ms);}});
test('only read and readGoals recover explicit pre-execution lock refusal with one total deadline',async()=>{
 for(const method of ['read','readGoals']){
  const calls=[],scheduled=[];
  const h=harness(async(url,request)=>{calls.push(request.body);return reply(calls.length<3?{ok:false,error:'lock_busy'}:{ok:true,source_revision:'synthetic-r2'});},fastWaits(scheduled));
  const payload={case_id:'synthetic-original'},pending=h.create()[method](payload);payload.case_id='changed-by-caller';
  assert.equal((await pending).source_revision,'synthetic-r2');
  assert.equal(calls.length,3);assert.equal(new Set(calls).size,1);assert.equal(JSON.parse(calls[2]).payload.case_id,'synthetic-original');
  assert.deepEqual(scheduled,[45000,500,1000]);
 }
});
test('lock refusal exhausts exactly three attempts and retains its distinct code',async()=>{
 let calls=0;const scheduled=[],h=harness(async()=>{calls++;return reply({ok:false,error:'lock_busy'});},fastWaits(scheduled));
 const result=await h.create().read({case_id:'synthetic'});
 assert.equal(result.ok,false);assert.equal(result.error,'lock_busy');assert.equal(calls,3);assert.deepEqual(scheduled,[45000,500,1000]);
 const {validateWorkspaceSources,workspaceSourceNotice}=await import('../despacho3d/conversation.mjs');
 assert.throws(()=>validateWorkspaceSources(result,'synthetic'),error=>error.message==='lock_busy'&&workspaceSourceNotice(error).includes('atendiendo otra consulta'));
 const {DurableGoals}=await import('../despacho3d/goals.mjs');
 const goals=new DurableGoals({transport:{readGoals:async()=>result},getContext:()=>({selection:{case_id:'synthetic',goals:{schema:1,ready:true}}})});
 assert.equal(await goals.read(),false);assert.equal(goals.status,'unavailable');assert.match(goals.notice,/atendiendo otra consulta/);
});
test('total deadline includes the lock wait and does not start a later attempt',async()=>{
 let calls=0;const h=harness(async()=>{calls++;return reply({ok:false,error:'lock_busy'});});
 await assert.rejects(h.create({timeout:10}).read({case_id:'synthetic'}),/^Error: timeout$/);assert.equal(calls,1);
});
test('uncertain reads, malformed responses, HTTP failures and authority refusals never retry',async()=>{
 for(const fetch of [async()=>{throw Error('network');},async()=>({ok:false}),async()=>({ok:true,text:async()=>'{invalid'}),async()=>reply({ok:false,error:'unauthorized'}),async()=>reply({ok:false,error:'session_changed'}),async()=>reply({ok:true,error:'lock_busy'})]){
  let calls=0;const h=harness(async(...args)=>{calls++;return fetch(...args);});
  try{await h.create().read({case_id:'synthetic'});}catch{}
  assert.equal(calls,1);
 }
 let calls=0;const h=harness(async(url,request)=>{calls++;await new Promise((resolve,reject)=>request.signal.addEventListener('abort',()=>reject(Object.assign(Error('abort'),{name:'AbortError'})),{once:true}));});
 await assert.rejects(h.create({timeout:5}).readGoals({case_id:'synthetic'}),/^Error: timeout$/);assert.equal(calls,1);
});
test('mutations and other reads never recover lock refusal behind their caller',async()=>{
 const calls=[],h=harness(async(url,request)=>{calls.push(JSON.parse(request.body).operation);return reply({ok:false,error:'lock_busy'});}),t=h.create();
 await t.enqueue({request_id:'synthetic-request',message:'Synthetic message'});
 await t.createGoal({case_id:'synthetic',request_id:'request-goal',expected_revision:'r1',title:'Synthetic goal',instruction:'Read only',criterion:'Report evidence',scope:'local_analysis_v1'});
 await t.reviewGoal({case_id:'synthetic',goal_id:'goal-1',request_id:'request-review',expected_revision:'r1',action:'approve'});
 await t.resolveCurrent({case_id:'synthetic'});await t.listAuthorized({});await t.mintFastSession({case_id:'synthetic'});
 assert.deepEqual(calls,['enqueue','createGoal','reviewGoal','resolveCurrent','listAuthorized','mintFastSession']);
});
test('session changes during lock wait prevent another request',async()=>{
 for(const change of [{ready:true,allowed:true,token:'new-session',epoch:2},{ready:false,allowed:true,token:'synthetic-session',epoch:1},{ready:true,allowed:false,token:'synthetic-session',epoch:1}]){
  let calls=0;const h=harness(async()=>{calls++;return reply({ok:false,error:'lock_busy'});},{setTimeout(fn,ms){return setTimeout(()=>{if(ms===500)h.session(change);fn();},ms===500?0:ms);}});
  await assert.rejects(h.create().read({case_id:'synthetic'}),/session_changed|session_pending|unauthorized/);assert.equal(calls,1);
 }
});
test('dispose aborts a lock wait and active request without retrying or leaving a usable transport',async()=>{
 let calls=0;const h=harness(async()=>{calls++;return reply({ok:false,error:'lock_busy'});}),t=h.create();
 const pending=t.read({case_id:'synthetic'});await new Promise(setImmediate);t.dispose();
 await assert.rejects(pending,/closed/);await assert.rejects(t.readGoals({case_id:'synthetic'}),/closed/);assert.equal(calls,1);
 let active=0;const held=harness(async(url,request)=>{active++;await new Promise((resolve,reject)=>request.signal.addEventListener('abort',()=>reject(Object.assign(Error('abort'),{name:'AbortError'})),{once:true}));}),transport=held.create();
 const request=transport.read({case_id:'synthetic'});transport.dispose();await assert.rejects(request,/closed/);assert.equal(active,1);
});
