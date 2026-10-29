'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const load=()=>import('../despacho3d/goals.mjs');
const caseId='case-synthetic';
const draft={title:'Diagnóstico sintético',instruction:'Leer la información sintética y preparar tareas.',criterion:'Evidencia revisable.'};
const selection={case_id:caseId,goals:{schema:1,ready:true,worker_ready:false}};
function goal(overrides={}){return {goal_id:'goal-synthetic',case_id:caseId,...draft,scope:'local_analysis_v1',status:'queued',source_revision:'source-1',revision:'goal-1',sequence:0,created_at:'2026-10-03T00:00:00Z',updated_at:'2026-10-03T00:00:00Z',tasks:[],evidence:[],summary:'',...overrides};}
function backend(){
 const state={source_revision:'source-1',goals:[]},calls=[],receipts=new Map();
 return {state,calls,receipts,readGoals:async payload=>{calls.push({op:'readGoals',payload});return {ok:true,schema:1,...structuredClone(state)};},createGoal:async payload=>{calls.push({op:'createGoal',payload});if(receipts.has(payload.request_id))return structuredClone(receipts.get(payload.request_id));if(payload.expected_revision!==state.source_revision)return {ok:false,error:'stale_revision'};const created=goal({...payload,goal_id:'goal-'+receipts.size,source_revision:payload.expected_revision});delete created.request_id;delete created.expected_revision;state.goals.push(created);const ack={ok:true,request_id:payload.request_id,goal:structuredClone(created)};receipts.set(payload.request_id,ack);return ack;},reviewGoal:async payload=>{calls.push({op:'reviewGoal',payload});if(receipts.has(payload.request_id))return structuredClone(receipts.get(payload.request_id));const item=state.goals.find(row=>row.goal_id===payload.goal_id);if(!item||item.revision!==payload.expected_revision)return {ok:false,error:'stale_revision'};Object.assign(item,{status:{approve:'completed',resume:'queued',stop:'stopped'}[payload.action],revision:'goal-'+(receipts.size+2),updated_at:new Date(Date.parse(item.updated_at)+1000).toISOString()});const ack={ok:true,request_id:payload.request_id,goal:structuredClone(item)};receipts.set(payload.request_id,ack);return ack;}};
}
async function harness(){const {DurableGoals}=await load(),server=backend();let context={selection:structuredClone(selection),busy:false},counter=0,denied=0;const controller=new DurableGoals({transport:server,getContext:()=>context,uuid:()=>`request-${++counter}`,onUnauthorized:()=>{denied++;context=null;}});return {server,controller,context:value=>context=value,denied:()=>denied};}
test('read-only goal dashboard never executes; offline motor still permits an explicit queued goal',async()=>{
 const h=await harness();await h.controller.read();assert.deepEqual(h.server.calls.map(c=>c.op),['readGoals']);assert.equal(await h.controller.create(draft),true);assert.equal(h.controller.model.goals[0].status,'queued');assert.equal(h.server.calls[1].payload.scope,'local_analysis_v1');assert.equal(h.server.calls[1].payload.expected_revision,'source-1');assert.equal(await h.controller.create(draft),false);assert.equal(h.server.state.goals.length,1);
});
test('lost creation acknowledgement survives readback and retries its exact original request, without duplicating the goal',async()=>{
 const h=await harness(),create=h.server.createGoal;let lose=true;h.server.createGoal=async p=>{const ack=await create(p);if(lose){lose=false;throw Error('lost');}return ack;};await h.controller.read();assert.equal(await h.controller.create(draft),false);const pending=structuredClone(h.controller.pending);assert.equal(h.controller.status,'unconfirmed');await h.controller.read();assert.equal(h.controller.model.goals.length,1);assert.deepEqual(h.controller.pending,pending);assert.equal(await h.controller.create({...draft,title:'Different'}),false);assert.equal(await h.controller.retry(),true);const writes=h.server.calls.filter(c=>c.op==='createGoal');assert.deepEqual(writes[0],writes[1]);assert.equal(h.server.state.goals.length,1);assert.equal(h.controller.pending,null);
});
test('replaying a receipt cannot overwrite newer progress observed in Sheets',async()=>{
 const h=await harness(),create=h.server.createGoal;let fail=true;h.server.createGoal=async p=>{const ack=await create(p);if(fail){fail=false;throw Error('lost');}return ack;};await h.controller.read();await h.controller.create(draft);Object.assign(h.server.state.goals[0],{status:'running',sequence:1,summary:'Avance ya guardado',updated_at:'2026-10-03T00:02:00Z'});await h.controller.read();assert.equal(await h.controller.retry(),true);assert.equal(h.controller.model.goals[0].summary,'Avance ya guardado');assert.equal(h.controller.model.goals[0].status,'running');
});
test('reviews use goal revision and gate completion, resume and cancellation by canonical state',async()=>{
 const h=await harness();h.server.state.goals=[goal()];await h.controller.read();assert.equal(await h.controller.review('goal-synthetic','approve'),false);assert.equal(await h.controller.review('goal-synthetic','resume'),false);assert.equal(await h.controller.review('goal-synthetic','stop'),true);assert.equal(h.server.calls.at(-1).payload.expected_revision,'goal-1');assert.equal(await h.controller.review('goal-synthetic','resume'),true);assert.equal(h.controller.model.goals[0].status,'queued');Object.assign(h.server.state.goals[0],{status:'ready_for_review',revision:'review-1',updated_at:'2026-10-03T00:03:00Z'});await h.controller.read();assert.equal(await h.controller.review('goal-synthetic','approve'),true);assert.equal(h.controller.model.goals[0].status,'completed');
});
test('late reads and writes cannot restore goal data after hiding or revoking a case',async()=>{
 const h=await harness();let release;h.server.readGoals=()=>new Promise(resolve=>release=resolve);const reading=h.controller.read();h.controller.hide();release({ok:true,schema:1,source_revision:'source-1',goals:[goal()]});assert.equal(await reading,false);assert.equal(h.controller.model,null);const h2=await harness();await h2.controller.read();h2.server.createGoal=()=>new Promise(resolve=>release=resolve);const writing=h2.controller.create(draft);h2.controller.reset();release({ok:true,request_id:'request-1',goal:goal()});assert.equal(await writing,false);assert.equal(h2.controller.model,null);assert.equal(h2.controller.pending,null);
});
test('stale revision requires refreshed evidence; permission denial clears all private goal state',async()=>{
 const h=await harness();await h.controller.read();h.server.state.source_revision='source-2';assert.equal(await h.controller.create(draft),false);assert.equal(h.controller.pending,null);assert.equal(h.controller.status,'conflict');await h.controller.read();assert.equal(await h.controller.create(draft),true);h.server.readGoals=async()=>({ok:false,error:'unauthorized',detail:'private server detail'});assert.equal(await h.controller.read(),false);assert.equal(h.controller.model,null);assert.equal(h.controller.pending,null);assert.equal(h.denied(),1);assert.ok(!h.controller.notice.includes('private'));
});
test('unknown provider errors stay private and keep mutation IDs until confirmed',async()=>{
 const h=await harness();await h.controller.read();h.server.createGoal=async()=>{throw Error('private token from provider');};await h.controller.create(draft);assert.equal(h.controller.status,'unconfirmed');assert.ok(h.controller.pending);assert.ok(!h.controller.notice.includes('private token'));h.server.createGoal=async p=>({ok:true,request_id:'different-id',goal:goal()});assert.equal(await h.controller.retry(),false);assert.ok(h.controller.pending);
});
test('bounded goal schema rejects cross-case records, lease secrets and invalid task evidence',async()=>{
 const {validateGoals,validateGoal}=await load();const base=goal();assert.equal(validateGoal(base,caseId).goal_id,base.goal_id);for(const change of [{case_id:'other'},{lease_token:'secret'},{sequence:-1},{sequence:0.1},{status:'made-up'},{tasks:Array(9).fill({})}])assert.throws(()=>validateGoal({...base,...change},caseId),/invalid_goals/);const evidenced=goal({tasks:[{id:'task-1',title:'Comprobar',criterion:'Dato concreto',status:'ready_for_review',summary:'Preparado',evidence_ids:['ev-1']}],evidence:[{id:'ev-1',task_id:'task-1',title:'Fuente',text:'Dato sintético',sha256:'a'.repeat(64),bytes:15}]});assert.equal(validateGoal(evidenced,caseId).evidence.length,1);assert.throws(()=>validateGoal({...evidenced,evidence:[{...evidenced.evidence[0],bytes:14}]},caseId),/invalid_goals/);assert.throws(()=>validateGoal({...evidenced,evidence:[]},caseId),/invalid_goals/);assert.throws(()=>validateGoals({ok:true,schema:1,source_revision:'s',goals:[base,base]},caseId),/invalid_goals/);
});
test('visible polling is read-only, waits for each read, and cancels while hidden or disposed',async()=>{
 const {watchGoals}=await load(),timers=[];let visible=false,reads=0,release,cleared;const controller={busy:false,read:async()=>{reads++;await new Promise(resolve=>release=resolve);}};const stop=watchGoals(controller,{visible:()=>visible,setTimer:(fn,ms)=>{assert.equal(ms,8000);timers.push(fn);return timers.length;},clearTimer:value=>cleared=value});assert.equal(reads,0);visible=true;const tick=timers.shift()();assert.equal(reads,1);assert.equal(timers.length,0);stop();release();await tick;assert.equal(timers.length,0);assert.equal(cleared,1);
});
function bridgeHarness(){const listeners={},posts=[],source={postMessage:value=>posts.push(value)},calls=[];let epoch=1;const root={globalThis:null,location:{origin:'https://portal.invalid'},setTimeout,clearTimeout,addEventListener:(event,fn)=>listeners[event]=fn,removeEventListener:event=>delete listeners[event]};root.globalThis=root;vm.runInNewContext(fs.readFileSync(require.resolve('../os/despacho-conversation.js'),'utf8'),root);root.YodDespachoConversation.bind({isAuthorized:()=>true,getIframeWindow:()=>source,getEpoch:()=>epoch,getTransport:()=>Object.fromEntries(['readGoals','createGoal','reviewGoal'].map(op=>[op,async payload=>{calls.push({op,payload});return {ok:true};}]))});return {calls,posts,source,epoch:value=>epoch=value,send:(method,payload,extra={})=>listeners.message({origin:root.location.origin,source,data:{type:'yod:case:request',version:1,id:'bridge-request',method,payload},...extra})};}
test('OS goal bridge accepts only exact bounded actor payloads from the authorized frame',async()=>{
 const h=bridgeHarness(),payload={case_id:caseId,request_id:'request-synthetic',expected_revision:'source-1',...draft,scope:'local_analysis_v1'};await h.send('createGoal',payload);assert.equal(h.calls.length,1);await h.send('createGoal',{...payload,target:'attacker-sheet'});await h.send('createGoal',{...payload,scope:'unrestricted'});await h.send('createGoal',{...payload,instruction:'x'.repeat(4001)});await h.send('createGoal',payload,{origin:'https://evil.invalid'});await h.send('createGoal',payload,{source:{}});assert.equal(h.calls.length,1);await h.send('readGoals',{case_id:caseId});await h.send('reviewGoal',{case_id:caseId,goal_id:'goal-synthetic',request_id:'request-review',expected_revision:'goal-1',action:'approve'});await h.send('reviewGoal',{case_id:caseId,goal_id:'goal-synthetic',request_id:'request-review',expected_revision:'goal-1',action:'complete_business'});assert.equal(h.calls.length,3);
});
test('authenticated transport signs actor operations only with current session and rejects extra authority',async()=>{
 const calls=[];let session={ready:true,allowed:true,token:'synthetic-private-session',epoch:1},release;const root={globalThis:null,AbortController,setTimeout,clearTimeout,fetch:async(url,request)=>{calls.push({url,request});if(release===null)await new Promise(resolve=>release=resolve);return {ok:true,text:async()=>'{"ok":true}'};}};root.globalThis=root;vm.runInNewContext(fs.readFileSync(require.resolve('../os/despacho-transport.js'),'utf8'),root);const transport=root.YodDespachoTransport.create({endpoint:'https://script.google.com/macros/s/SYNTHETIC/exec',getSession:()=>session});await transport.readGoals({case_id:caseId});const body=JSON.parse(calls[0].request.body);assert.equal(body.operation,'readGoals');assert.equal(body.k,session.token);assert.ok(!calls[0].url.includes(session.token));await assert.rejects(transport.readGoals({case_id:caseId,actor:'different'}),/invalid_payload/);release=null;const pending=transport.readGoals({case_id:caseId});session={...session,epoch:2,token:'changed'};release();await assert.rejects(pending,/session_changed/);assert.equal(calls.length,2);
});
test('background goal polling never blocks conversation reads or message delivery and concurrent goal reads share one call',async()=>{
 const listeners={},posts=[],calls=[],source={postMessage:value=>posts.push(value)};let release;
 const root={globalThis:null,location:{origin:'https://portal.invalid'},setTimeout,clearTimeout,addEventListener:(event,fn)=>listeners[event]=fn,removeEventListener:()=>{}};root.globalThis=root;vm.runInNewContext(fs.readFileSync(require.resolve('../os/despacho-conversation.js'),'utf8'),root);
 const transport={readGoals:payload=>{calls.push({op:'readGoals',payload});return new Promise(resolve=>release=resolve);},resolveCurrent:async()=>({ok:true,case_id:caseId}),enqueue:async payload=>{calls.push({op:'enqueue',payload});return {ok:true,request_id:payload.request_id};}};
 root.YodDespachoConversation.bind({isAuthorized:()=>true,getIframeWindow:()=>source,getEpoch:()=>1,getTransport:()=>transport});
 const send=(method,payload,id)=>listeners.message({origin:root.location.origin,source,data:{type:'yod:case:request',version:1,id,method,payload}});
 const polling=send('readGoals',{case_id:caseId},'background');await send('resolveCurrent',{},'conversation-read');await send('enqueue',{case_id:caseId,request_id:'original-write',expected_revision:'source-1',message:'Texto sintético'},'conversation-write');const redundant=send('readGoals',{case_id:caseId},'redundant-poll');
 assert.equal(posts.find(item=>item.id==='conversation-read').result.case_id,caseId);assert.equal(posts.find(item=>item.id==='conversation-write').result.request_id,'original-write');assert.equal(posts.find(item=>item.id==='redundant-poll'),undefined);assert.equal(calls.filter(item=>item.op==='readGoals').length,1);assert.equal(calls.filter(item=>item.op==='enqueue').length,1);release({ok:true});await polling;await redundant;assert.equal(posts.find(item=>item.id==='background').error,null);
 // Chinche #284: concurrent identical goal reads share one backend call instead of bouncing as transport_busy.
 assert.equal(posts.find(item=>item.id==='redundant-poll').error,null);assert.deepEqual(posts.find(item=>item.id==='redundant-poll').result,{ok:true});assert.equal(calls.filter(item=>item.op==='readGoals').length,1);
});
test('OS preserves safe transient diagnostics and does not forward provider details',async()=>{
 const listeners={},posts=[],source={postMessage:value=>posts.push(value)};let failure=Error('timeout');
 const root={globalThis:null,location:{origin:'https://portal.invalid'},setTimeout,clearTimeout,addEventListener:(event,fn)=>listeners[event]=fn,removeEventListener:()=>{}};root.globalThis=root;vm.runInNewContext(fs.readFileSync(require.resolve('../os/despacho-conversation.js'),'utf8'),root);root.YodDespachoConversation.bind({isAuthorized:()=>true,getIframeWindow:()=>source,getEpoch:()=>1,getTransport:()=>({resolveCurrent:async()=>{throw failure;}})});
 const request=()=>listeners.message({origin:root.location.origin,source,data:{type:'yod:case:request',version:1,id:'request-synthetic',method:'resolveCurrent',payload:{}}});
 await request();assert.equal(posts.at(-1).error,'timeout');failure=Error('session_pending');await request();assert.equal(posts.at(-1).error,'session_pending');failure=Error('provider detail private');await request();assert.equal(posts.at(-1).error,'unavailable');
});

test('goal status describes a durable record and server permission, never a live worker',async()=>{
 const {goalDisplay,taskDisplay,goalReviewActions}=await load();
 const task={status:'running'},base=goal({status:'running'});
 const before=JSON.stringify(base);
 for(const can_resume of [undefined,false]){
  const value={...base,...(can_resume===undefined?{}:{can_resume})};
  assert.equal(goalDisplay(value).label,'Ejecución registrada');
  assert.deepEqual(goalReviewActions(value),['stop']);
  assert.equal(taskDisplay(task,value),'Ejecución registrada');
 }
 const resumable={...base,can_resume:true};
 assert.equal(goalDisplay(resumable).label,'Necesita retomar');
 assert.deepEqual(goalReviewActions(resumable),['resume','stop']);
 assert.equal(taskDisplay(task,resumable),'Por retomar');
 assert.equal(taskDisplay(task,goal({status:'queued'})),'Pendiente de reanudación');
 for(const status of ['stopped','awaiting_data','ready_for_review','completed'])
  assert.equal(taskDisplay(task,goal({status})),'Interrumpida · pendiente de conciliación');
 assert.deepEqual(goalReviewActions(goal({status:'completed',can_resume:true})),[]);
 assert.equal(JSON.stringify(base),before);assert.equal(task.status,'running');
});
test('observing a resumable running goal never starts it; explicit resume preserves canonical revision',async()=>{
 const {goalDisplay,goalReviewActions}=await load(),h=await harness();
 h.server.state.goals=[goal({status:'running',can_resume:true,revision:'resume-revision'})];
 await h.controller.read();const stored=structuredClone(h.server.state.goals[0]);
 goalDisplay(h.controller.model.goals[0]);goalReviewActions(h.controller.model.goals[0]);
 assert.deepEqual(h.server.calls.map(c=>c.op),['readGoals']);
 assert.deepEqual(h.server.state.goals[0],stored);
 assert.equal(await h.controller.review('goal-synthetic','resume'),true);
 const write=h.server.calls.at(-1);
 assert.equal(write.op,'reviewGoal');assert.equal(write.payload.action,'resume');
 assert.equal(write.payload.expected_revision,'resume-revision');
 assert.equal(h.controller.model.goals[0].status,'queued');
});
test('running resume requires the explicit server flag and malformed permission is rejected',async()=>{
 const {validateGoal}=await load();
 for(const can_resume of [undefined,false]){
  const h=await harness();h.server.state.goals=[goal({status:'running',...(can_resume===undefined?{}:{can_resume})})];
  await h.controller.read();assert.equal(await h.controller.review('goal-synthetic','resume'),false);
  assert.deepEqual(h.server.calls.map(c=>c.op),['readGoals']);
 }
 for(const can_resume of ['true',1,null])assert.throws(()=>validateGoal(goal({can_resume}),caseId),/invalid_goals/);
 assert.throws(()=>validateGoal(goal({lease_expires_at:'2026-10-03T00:01:00Z'}),caseId),/invalid_goals/);
});

// Opening Entregas during the background read must await that read, not report failure.
test('concurrent views share one goal read and the next explicit read is fresh',async()=>{
 const h=await harness();let release,calls=0;
 h.server.readGoals=()=>{calls++;return new Promise(resolve=>release=resolve);};
 const first=h.controller.read(),second=h.controller.read();
 assert.equal(first,second);assert.equal(calls,1);
 release({ok:true,schema:1,source_revision:'source-1',goals:[goal()]});
 assert.deepEqual(await Promise.all([first,second]),[true,true]);
 assert.equal(h.controller.model.goals.length,1);
 const next=h.controller.read();assert.equal(calls,2);assert.notEqual(next,first);
 release({ok:true,schema:1,source_revision:'source-2',goals:[]});
 assert.equal(await next,true);assert.equal(h.controller.model.source_revision,'source-2');
});
test('shared goal reads report a real failure to every view and permit a later recovery',async()=>{
 const h=await harness();let release;h.server.readGoals=()=>new Promise(resolve=>release=resolve);
 const first=h.controller.read(),second=h.controller.read();
 release({ok:false,error:'unavailable'});assert.deepEqual(await Promise.all([first,second]),[false,false]);
 assert.equal(h.controller.model,null);assert.equal(h.controller.busy,false);
 const recovery=h.controller.read();release({ok:true,schema:1,source_revision:'source-2',goals:[]});
 assert.equal(await recovery,true);
});
test('background goal reads preserve a failed observation and update it only when fresh evidence arrives',async()=>{
 const {goalReadView}=await load(),h=await harness();let release;
 h.server.readGoals=()=>new Promise(resolve=>release=resolve);
 const first=h.controller.read({background:true});assert.equal(goalReadView(h.controller.state()).phase,'loading');
 release({ok:false,error:'unavailable'});await first;
 const failed=goalReadView(h.controller.state()),poll=h.controller.read({background:true});
 assert.equal(h.controller.busy,true);assert.deepEqual(goalReadView(h.controller.state()),failed);
 release({ok:false,error:'unavailable'});await poll;
 const recovery=h.controller.read({background:true});assert.deepEqual(goalReadView(h.controller.state()),failed);
 release({ok:true,schema:1,source_revision:'source-2',goals:[goal({title:'Meta recuperada'})]});await recovery;
 assert.equal(goalReadView(h.controller.state()).phase,'ready');assert.equal(goalReadView(h.controller.state()).title,'Meta recuperada');
 const last=goalReadView(h.controller.state()),next=h.controller.read({background:true});assert.deepEqual(goalReadView(h.controller.state()),last);
 release({ok:true,schema:1,source_revision:'source-3',goals:[goal({title:'Meta actualizada'})]});await next;
 assert.equal(goalReadView(h.controller.state()).title,'Meta actualizada');
});
test('explicit goal recovery still shows loading after a failed observation',async()=>{
 const {goalReadView}=await load(),h=await harness();let release;
 h.server.readGoals=()=>new Promise(resolve=>release=resolve);
 const first=h.controller.read();release({ok:false,error:'unavailable'});await first;
 const recovery=h.controller.read();assert.equal(goalReadView(h.controller.state()).phase,'loading');
 release({ok:true,schema:1,source_revision:'source-2',goals:[]});await recovery;
 assert.equal(goalReadView(h.controller.state()).phase,'ready');
});
test('workspace background goals wait twelve seconds after a slow read finishes, preserving the failure while recovering',async()=>{
 const {goalReadView}=await load(),h=await harness(),pending=[];let now=100000;
 h.server.readGoals=()=>new Promise(resolve=>pending.push(resolve));
 const source=fs.readFileSync(require.resolve('../despacho3d/agent-workspace.mjs'),'utf8');
 const from=source.indexOf(' async function refresh()'),to=source.indexOf(' function setTab(',from);
 assert.ok(from>=0&&to>from);
 const api=vm.runInNewContext('(function(){'+
  'let disposed=false,active=true,fetching=null,selected=selection,generation=1,lastTaskRead=0,frame={},readingSources=null,sourceAttempts=0,sourceRetryAt=0,tab="ppp",boardLink=null;'+
  'const getSelection=()=>selected;'+source.slice(from,to)+'return{refresh};})()',
  {selection,tasks:h.controller,Date:{now:()=>now},doc:{hidden:false}});
 await api.refresh();assert.equal(pending.length,1);
 now+=45000;await api.refresh();assert.equal(pending.length,1,'an unfinished read is shared, never replaced');
 pending.shift()({ok:false,error:'unavailable'});await new Promise(resolve=>setImmediate(resolve));
 const failed=goalReadView(h.controller.state());assert.equal(failed.phase,'unavailable');
 now+=11999;await api.refresh();assert.equal(pending.length,0,'the old start time cannot trigger an early poll');
 now++;await api.refresh();assert.equal(pending.length,1);assert.deepEqual(goalReadView(h.controller.state()),failed);
 pending.shift()({ok:true,schema:1,source_revision:'source-2',goals:[goal()]});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(goalReadView(h.controller.state()).phase,'ready');
});
test('a case switch cannot share the previous case read or accept its late response',async()=>{
 const h=await harness(),pending=[];h.server.readGoals=payload=>new Promise(resolve=>pending.push({payload,resolve}));
 const old=h.controller.read();
 h.context({selection:{...selection,case_id:'case-other'},busy:false});
 const current=h.controller.read();assert.notEqual(current,old);assert.equal(pending.length,2);
 pending[0].resolve({ok:true,schema:1,source_revision:'old',goals:[goal()]});
 assert.equal(await old,false);assert.equal(h.controller.model,null);assert.equal(h.controller.busy,true);
 pending[1].resolve({ok:true,schema:1,source_revision:'new',goals:[goal({case_id:'case-other'})]});
 assert.equal(await current,true);assert.equal(h.controller.model.goals[0].case_id,'case-other');
});
