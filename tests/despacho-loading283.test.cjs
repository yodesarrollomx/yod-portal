const test=require('node:test'),assert=require('node:assert/strict');
test('loading only completes actual stages and never converts failure into empty success',async()=>{
 const {loadingView}=await import('../despacho3d/office-loading.mjs');
 assert.equal(loadingView().completed,0);
 const waiting={scene:true,workspace:true,catalog:{phase:'loading',cases:[]}};
 assert.equal(loadingView(waiting).completed,2);assert.equal(loadingView(waiting).ready,false);
 for(const phase of ['unauthorized','reconnecting']){const v=loadingView({...waiting,catalog:{phase,cases:[]}});assert.equal(v.ready,false);assert.equal(v.blocked,true);assert.notEqual(v.label,'Sin proyectos autorizados');}
 assert.equal(loadingView({...waiting,catalog:{phase:'current',cases:[]}}).label,'Sin proyectos autorizados');
 assert.equal(loadingView({...waiting,catalog:{phase:'current',cases:[{}]}}).ready,true);
});
