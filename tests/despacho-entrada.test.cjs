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
