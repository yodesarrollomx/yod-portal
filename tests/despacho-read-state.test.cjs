'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('slow, failed and empty canonical reads cannot be confused; recovery retains the exact last observation',async()=>{
 const {DurableGoals,goalReadView}=await import('../despacho3d/goals.mjs');
 let release,fail=false,revoked=false;
 const selection={case_id:'synthetic',goals:{schema:1,ready:true},can_enqueue:true};
 const controller=new DurableGoals({getContext:()=>({selection}),transport:{readGoals:()=>fail?Promise.reject(Error(revoked?'unauthorized':'unavailable')):new Promise(resolve=>release=resolve)}});
 const pending=controller.read();
 assert.equal(goalReadView(controller.state()).phase,'loading');
 assert.equal(goalReadView(controller.state()).route,null);
 assert.doesNotMatch(goalReadView(controller.state()).next,/Definir/);
 release({ok:true,schema:1,source_revision:'r1',goals:[]});assert.equal(await pending,true);
 assert.equal(goalReadView(controller.state()).route.mode,'empty');
 const observed=controller.model;fail=true;
 assert.equal(await controller.read(),false);assert.equal(controller.model,observed);
 assert.equal(goalReadView(controller.state()).historical,true);
 assert.match(goalReadView(controller.state()).label,/sin conexión/);
 revoked=true;assert.equal(await controller.read(),false);assert.equal(controller.model,null);
 assert.equal(goalReadView(controller.state()).route,null);
 assert.doesNotMatch(goalReadView(controller.state()).label,/Sin encargo/);
});
test('uncertain writes remain pending even with a saved model; unavailable capability does not claim an empty project',async()=>{
 const {goalReadView}=await import('../despacho3d/goals.mjs');
 assert.equal(goalReadView({model:{goals:[]},status:'ready',pending:{method:'reviewGoal'}}).phase,'unconfirmed');
 const view=goalReadView({status:'disconnected'},false);
 assert.equal(view.phase,'unavailable');assert.equal(view.route,null);assert.match(view.why,/no está conectado/);
});
test('completed meeting topics are historical, without a false pending approval',async()=>{
 const {buildMeeting}=await import('../despacho3d/project-meeting.mjs');
 const goal={goal_id:'synthetic-goal',case_id:'synthetic',title:'Entrega',instruction:'Leer',criterion:'Evidencia',scope:'local_analysis_v1',status:'completed',source_revision:'s1',revision:'r1',sequence:1,created_at:'2026-10-09T00:00:00Z',updated_at:'2026-10-09T00:01:00Z',tasks:[{id:'task-1',title:'Tema',criterion:'Fuente',status:'ready_for_review',summary:'Resultado',evidence_ids:['e1']}],evidence:[{id:'e1',task_id:'task-1',title:'Documento',text:'Evidencia',sha256:'a'.repeat(64),bytes:9}],summary:'Revisado'};
 const deck=buildMeeting(goal,'synthetic','Personaje');
 assert.match(deck.slides[0].checkpoint,/revisada/);assert.doesNotMatch(deck.slides[0].script,/pendiente de tu revisión/);
});
