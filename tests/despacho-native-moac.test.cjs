const test=require('node:test'),assert=require('node:assert/strict');
const fixture=()=>({ok:true,case_id:'synthetic-case',context:{identity:{case_id:'synthetic-case'},moac:{schema:1,source:'native_moac',case_id:'synthetic-case',observed_at:'2026-10-17T20:00:00Z',source_revision:'r1',binding:'linked',metas:[{meta_id:'M1',meta:'Meta sintética'}],objetivos:[{objetivo_id:'O1',meta_id:'M1','objetivo / hito':'Hito sintético'}],tareas:[{tarea_id:'T1',objetivo_id:'O1',meta_id:'M1',revision:'r1',actividad:'Consultar fuentes',estado:'Terminado',responsable:'Responsable sintético',entregable:'Informe'}],deliveries:[{request_id:'receipt-1',tarea_id:'T1',at:'2026-10-17T19:00:00Z',status:'ready_for_review',summary:'Resumen comprobado'}],warnings:[]}}});
test('canonical projection retains IDs and business state; receipt is not approval',async()=>{
 const {nativeMoac}=await import('../despacho3d/native-moac.mjs'),r=fixture(),before=JSON.stringify(r),v=nativeMoac(r,'synthetic-case');
 assert.equal(v.phase,'ready');assert.equal(v.tasks[0].state,'Terminado');assert.equal(v.deliveries[0].status,'ready_for_review');assert.equal(v.tasks[0].objective_id,v.objectives[0].id);assert.equal(JSON.stringify(r),before);
});
test('another case, duplicate IDs, foreign relationships or receipts fail closed',async()=>{
 const {nativeMoac}=await import('../despacho3d/native-moac.mjs');
 const patches=[r=>r.case_id='other',r=>r.context.identity.case_id='other',r=>r.context.moac.case_id='other',r=>r.context.moac.tareas.push({...r.context.moac.tareas[0]}),r=>r.context.moac.objetivos[0].meta_id='foreign',r=>r.context.moac.tareas[0].meta_id='foreign',r=>r.context.moac.deliveries[0].tarea_id='foreign',r=>r.context.moac.deliveries[0].case_id='foreign',r=>r.context.moac.deliveries.push({...r.context.moac.deliveries[0]}),r=>r.context.moac.metas[0]=null];
 for(const change of patches){const r=fixture();change(r);assert.equal(nativeMoac(r,'synthetic-case').phase,'unavailable');}
});
test('missing transport, unavailable and unlinked are distinct and never fake no pending work',async()=>{
 const {nativeMoac}=await import('../despacho3d/native-moac.mjs'),r=fixture();
 delete r.context.moac;assert.equal(nativeMoac(r,'synthetic-case').phase,'missing');
 r.context.moac={schema:1,source:'native_moac',case_id:'synthetic-case',status:'unavailable'};assert.equal(nativeMoac(r,'synthetic-case').phase,'unavailable');
 const u=fixture();Object.assign(u.context.moac,{binding:'unlinked',metas:[],objetivos:[],tareas:[],deliveries:[]});assert.equal(nativeMoac(u,'synthetic-case').phase,'unlinked');
 u.context.moac.binding='linked';assert.equal(nativeMoac(u,'synthetic-case').phase,'unavailable');
});
test('unknown fields cannot introduce write controls or leak unrelated records; malformed bounds fail closed',async()=>{
 const {nativeMoac}=await import('../despacho3d/native-moac.mjs'),r=fixture();r.context.moac.tareas[0].secret='not-projected';r.context.moac.warnings=[{code:'derived_meta_mismatch',task_id:'T1'},{code:'derived_meta_mismatch',task_id:'foreign'}];
 const v=nativeMoac(r,'synthetic-case');assert(!JSON.stringify(v).includes('not-projected'));assert.deepEqual(v.warnings,['T1']);
 r.context.moac.observed_at='bad';assert.equal(nativeMoac(r,'synthetic-case').phase,'unavailable');
 const big=fixture();big.context.moac.tareas[0].actividad='x'.repeat(262145);assert.equal(nativeMoac(big,'synthetic-case').phase,'unavailable');
});

test('invalid document metadata cannot erase an independently valid canonical MOAC',async()=>{
 const {nativeMoac}=await import('../despacho3d/native-moac.mjs');const {validateWorkspaceSources,workspaceSourceNotice}=await import('../despacho3d/conversation.mjs');
 const r=fixture();Object.assign(r,{source_revision:'r1',state:{updated_at:'2026-10-17T20:00:00Z'}});r.context.identity.name='Sintético';r.context.documents=[[42]];
 let error;try{validateWorkspaceSources(r,'synthetic-case');}catch(e){error=e;}assert.equal(error.sourceMetadata,'documents');assert.match(workspaceSourceNotice(error),/índice de documentos/);assert.equal(nativeMoac(r,'synthetic-case').phase,'ready');
});
