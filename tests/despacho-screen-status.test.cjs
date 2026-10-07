const test=require('node:test'),assert=require('node:assert/strict');
test('monitor separates review, running, blocked and absent execution',async()=>{
 const {screenStatus}=await import('../despacho3d/office-screen-status.mjs');
 const s={phase:'ready',projectName:'Proyecto de prueba',work:{title:'Comparar variantes',updated_at:'2026-10-07T12:00:00Z',progress:{progress:{tasks:[{title:'Datos',status:'ready_for_review'},{title:'Falta superficie',status:'blocked'},{title:'Revisar documento',status:'running'}],summary:'Registro de prueba'}}}};
 let result=screenStatus(s);assert.equal(result.counts,'1/3 para revisar · 1 bloqueadas');assert.equal(result.detail,'Revisar documento');assert.equal(result.title,'Proyecto de prueba');
 s.work.progress.progress.tasks=[];s.work.result={summary:'Variantes preparadas'};
 assert.equal(screenStatus(s).detail,'Variantes preparadas');
 result=screenStatus({phase:'ready',case_id:'example',work:null});
 assert.equal(result.total,0);assert.equal(result.objective,'Sin ejecución registrada');assert.equal(result.detail,'');
});
