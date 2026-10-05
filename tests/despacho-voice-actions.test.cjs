'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const caseId='SYNTHETIC-CASE',id='voice-action-'+'a'.repeat(48),args={title:'Diagnóstico sintético',instruction:'Lee fuentes de ejemplo.',criterion:'Evidencia.'};
const selection={ok:true,case_id:caseId,name:'Expediente sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true,goals:{schema:1,ready:true,worker_ready:true}};
const intent={case_id:caseId,request_id:id,name:'objetivo_crear',args,state:'pending',prepared:null};
const goal=p=>({goal_id:'SYNTHETIC-GOAL',case_id:caseId,...args,scope:'local_analysis_v1',status:'queued',source_revision:p.expected_revision,revision:'r1',sequence:0,created_at:'2026-10-05T00:00:00Z',updated_at:'2026-10-05T00:00:00Z',summary:'',tasks:[],evidence:[]});
test('lost canonical receipt retries the same persisted payload without creating a duplicate',async()=>{
 const {createVoiceActionExecutor}=await import('../despacho3d/voice-actions.mjs');let prepared=null,writes=0,lose=true,time=1;const events=[],requests=[],rows=new Map();
 const transport={resolveCurrent:async()=>selection,readGoals:async()=>({ok:true,schema:1,source_revision:'source-r1',goals:[...rows.values()].map(r=>r.goal)}),createGoal:async p=>{
  writes++;requests.push(structuredClone(p));if(!prepared)throw Error('intent must be persisted');
  if(!rows.has(p.request_id))rows.set(p.request_id,{ok:true,request_id:p.request_id,goal:goal(p)});
  if(lose){lose=false;throw Error('lost_ack');}return rows.get(p.request_id);
 }};
 const ctx={caseId,active:()=>true,post:async(path,p)=>{
  if(path.endsWith('prepare')){prepared=structuredClone(p.payload);return{ok:true,receipt:{payload:prepared}};}
  assert.equal(p.result.goal.goal_id,'SYNTHETIC-GOAL');return{ok:true};
 }};
 const e=createVoiceActionExecutor({transport,onChange:v=>events.push(v),now:()=>time});
 e.consume([intent,intent],ctx);await e.settled();assert.equal(writes,1);assert.equal(events.at(-1).phase,'unconfirmed');
 time=20000;e.consume([{...intent,state:'prepared',prepared}],ctx);await e.settled();
 assert.equal(writes,2);assert.equal(rows.size,1);assert.deepEqual(requests[0],requests[1]);assert.equal(events.at(-1).phase,'confirmed');
 e.consume([intent],ctx);await e.settled();assert.equal(writes,2);
});
test('revocation and cross-case intents cannot write; stopping preserves the original objective and never closes voice',async()=>{
 const {createVoiceActionExecutor}=await import('../despacho3d/voice-actions.mjs');let writes=0;const results=[];
 const p={case_id:caseId,request_id:id,expected_revision:'source-r1',...args,scope:'local_analysis_v1'},g={...goal(p),status:'running'};
 const ctx={caseId,active:()=>true,post:async(path,value)=>{if(path.endsWith('prepare'))return{receipt:{payload:value.payload}};results.push(value.result);return{ok:true};}};
 const denied=createVoiceActionExecutor({transport:{resolveCurrent:async()=>({...selection,can_enqueue:false}),createGoal:async()=>writes++}});
 denied.consume([intent],ctx);await denied.settled();assert.equal(writes,0);assert.equal(results.at(-1).error,'unauthorized');
 const stop=createVoiceActionExecutor({transport:{resolveCurrent:async()=>selection,readGoals:async()=>({ok:true,schema:1,source_revision:'source-r1',goals:[g]}),reviewGoal:async v=>{writes++;assert.equal(v.action,'stop');assert.equal(v.goal_id,g.goal_id);return{ok:true,request_id:id,goal:{...g,status:'stopped'}};}}});
 stop.consume([{...intent,name:'objetivo_detener',args:{goal_id:g.goal_id}}],ctx);await stop.settled();assert.equal(writes,1);assert.equal(results.at(-1).goal.status,'stopped');
 const other=createVoiceActionExecutor({transport:{resolveCurrent:async()=>selection,createGoal:async()=>writes++}});
 other.consume([{...intent,case_id:'OTHER'}],ctx);await other.settled();assert.equal(writes,1);
});
test('menu projects only canonical documents, conversations and goals; PPP has registered source links',async()=>{
 const {projectMenu}=await import('../despacho3d/agent-menu.mjs');
 const doc={title:'PPP registrado',role:'Fuente',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit'};
 const m=projectMenu({documents:[doc],messages:[{role:'user',body:'Texto exacto'}],events:[{id:'event'}]},{goals:[{goal_id:'goal'}]});
 assert.deepEqual(m.ppp,[doc]);assert.equal(m.messages[0].body,'Texto exacto');assert.equal(m.goals.length,1);
 assert.deepEqual(projectMenu(null,null),{documents:[],history:[],messages:[],goals:[],ppp:[]});
});
