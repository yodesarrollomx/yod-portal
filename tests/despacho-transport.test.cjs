const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../os/despacho-transport.js'),'utf8');
function harness(fetch){const c=vm.createContext({AbortController,setTimeout,clearTimeout});vm.runInContext(source,c);let session={ready:true,allowed:true,token:'synthetic-session',epoch:1};return {create:(extra={})=>c.YodDespachoTransport.create({endpoint:'https://script.google.com/macros/s/synthetic/exec',getSession:()=>session,fetch,...extra}),session:s=>{session=s;}};}
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
