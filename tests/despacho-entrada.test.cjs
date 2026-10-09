const test=require('node:test'),assert=require('node:assert/strict');
test('entry only describes the authorized case and clears late work from a previous one',async()=>{
 const {entryView}=await import('../despacho3d/office-entry.mjs');
 const a={case_id:'synthetic-a',name:'Proyecto A',avatar:{name:'Autón A'}},b={case_id:'synthetic-b',name:'Proyecto B',avatar:{name:'Autón B'}};
 const work={case_id:a.case_id,phase:'ready',work:{phase:'tool',current_tool:'Leyendo fuente',title:'Tarea A'}};
 assert.deepEqual(entryView(a,{},work),{ready:true,name:'Autón A',project:'Proyecto A',caseId:'synthetic-a',status:'Leyendo fuente',detail:'Tarea A'});
 const changed=entryView(b,{},work);
 assert.equal(changed.caseId,b.case_id);assert.equal(changed.detail,'');assert.equal(changed.status,'Consultando actividad…');
 for(const phase of ['loading','reconnecting','unauthorized']){
  const revoked=entryView(null,{phase},work);
  assert.equal(revoked.ready,false);assert.equal(revoked.caseId,null);assert.equal(revoked.detail,'');
  assert.doesNotMatch(JSON.stringify(revoked),/Tarea A|Autón A|Proyecto A/);
 }
 assert.equal(entryView(a,{}, {...work,phase:'unavailable'}).detail,'','offline work cannot be described as the current task');
 assert.equal(entryView(a,{}, {...work,work:null}).status,'En espera · sin ejecución registrada');
});

test('entry reuses the avatar activity label instead of rendering raw tool identifiers',async()=>{
 const {entryView}=await import('../despacho3d/office-entry.mjs');
 const id='synthetic-a',selection={case_id:id,name:'Proyecto A',avatar:{id,case_id:id,entity_kind:'case',name:'Autón A'}};
 const observation={case_id:id,phase:'ready',checked_at:Date.now(),work:{case_id:id,goal_id:'goal-a',phase:'tool',current_tool:'navegador_abrir',title:'Consulta de una fuente',updated_at:new Date().toISOString()}};
 assert.equal(entryView(selection,{},observation).status,'Investigando en internet');
 assert.equal(entryView(selection,{}, {...observation,work:{...observation.work,current_tool:'drive_leer'}}).status,'Consultando documentos');
 const legacy={...selection,avatar:{name:'Autón A'}};
 assert.equal(entryView(legacy,{}, {...observation,work:{...observation.work,current_tool:'tool_unknown'}}).status,'Consultando herramienta');
 const queued=entryView(selection,{}, {...observation,runtime:{phase:'waiting_capacity'}});
 assert.equal(queued.status,'Encargo en cola');assert.equal(queued.detail,'','prior goal is not presented as the new queued task');
});
