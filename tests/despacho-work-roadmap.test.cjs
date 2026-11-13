
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const goal=(patch={})=>({goal_id:'synthetic-goal',title:'Comparar alternativas',instruction:'Leer el expediente',criterion:'Comparativa con evidencia',status:'running',updated_at:'2026-10-11T00:00:00Z',summary:'',tasks:[{id:'task-1',title:'Leer la fuente',criterion:'Identificar revisión',status:'ready_for_review',summary:'Leída',evidence_ids:['e1']},{id:'task-2',title:'Comparar capacidad',criterion:'Capacidad verificable',status:'pending',summary:'',evidence_ids:[]}],...patch});
test('next action is derived from the ordered canonical tasks and never counts a synthetic percentage',async()=>{
 const {goalRoadmap}=await import('../despacho3d/goals.mjs'),g=goal(),before=JSON.stringify(g),r=goalRoadmap([g]);
 assert.equal(r.next,'Comparar capacidad');assert.equal(r.why,'Capacidad verificable');assert.equal(JSON.stringify(g),before);assert.equal(r.percent,undefined);
 assert.equal(goalRoadmap([goal({tasks:[{...g.tasks[1],status:'blocked',summary:'Falta fuente normativa'}]})]).why,'Falta fuente normativa');
});
test('review, stopped work and history have distinct next decisions and old high sequence cannot hide a recent goal',async()=>{
 const {goalRoadmap}=await import('../despacho3d/goals.mjs');
 assert.equal(goalRoadmap([goal({status:'ready_for_review'})]).mode,'review');
 assert.equal(goalRoadmap([goal({status:'stopped'})]).mode,'stopped');
 const active=goal({sequence:1}),old=goal({goal_id:'old',sequence:99,status:'stopped',updated_at:'2026-10-10T00:00:00Z'});
 assert.equal(goalRoadmap([old,active]).goal.goal_id,active.goal_id);
 assert.equal(goalRoadmap([]).mode,'empty');
});
test('native PPP identity is translated only through its registered binding and pinned version',async()=>{
 const {resolveBoard,nativeBoardState}=await import('../despacho3d/project-station.mjs');
 const selected={case_id:'worker-b',ppp:{case_id:'worker-b',board_case_id:'board-b',scenario_id:'version-b',url:'https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=board-b'}};
 const link=resolveBoard(selected),data={case_id:'board-b',scenario_id:'version-b',revision:'r1',inputs:{inArea:1}};
 assert.equal(nativeBoardState(data,selected,link).case_id,'worker-b');assert.equal(data.case_id,'board-b');
 assert.equal(nativeBoardState({...data,case_id:'board-c'},selected,link),null);
 assert.equal(nativeBoardState({...data,scenario_id:'other'},selected,link),null);
 assert.equal(nativeBoardState({...data,version_context:{board_case_id:'board-c'}},selected,link),null);
 assert.equal(nativeBoardState(data,selected,null),null);
});
test('voice summary retains why and how from the canonical goal, bounds output and excludes worker metadata',async()=>{
 const {summarizeGoals}=await import('../despacho3d/voice-actions.mjs');
 const g=goal({source_revision:'r1',lease_token:'NEVER_SEND_THIS'});
 const result=summarizeGoals({source_revision:'r1',goals:[g]});
 assert.equal(result.goals[0].criterion,g.criterion);assert.equal(result.goals[0].instruction,g.instruction);
 assert.equal(result.goals[0].tasks[1].criterion,g.tasks[1].criterion);assert.equal(result.goals[0].lease_token,undefined);
 assert.equal(summarizeGoals({source_revision:'r1',goals:[]}).total,0);
});
