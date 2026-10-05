'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const core=fs.readFileSync('despacho-runtime/source/shared/office-permissions.js','utf8'),ctx={};vm.runInNewContext(core,ctx);
const copy=v=>JSON.parse(JSON.stringify(v)),caseId='CASE-SYNTHETIC';
function fixture(){
 const f={allowed:true,actor:'ACTOR-SYNTHETIC',auths:0,reads:0};
 f.backend=ctx.createOfficePermissions({case_id:caseId,serverContext:{},now:()=>Date.UTC(2026,9,4),authenticate:()=>{f.auths++;return {allowed:f.allowed,actor_id:f.actor,case_id:caseId};}});
 f.request={case_id:caseId,space_id:'juntas',operation:'readPending'};return f;
}
test('policy matrix contains nine rooms, only three visit scopes and no draft/action grants',()=>{
 const f=fixture(),r=copy(f.backend.inspect({case_id:caseId}));assert.equal(r.scope,'informational');assert.equal(r.spaces.length,9);assert.equal(r.spaces.filter(s=>s.connected).length,3);assert.equal(f.auths,2);
 for(const s of r.spaces)assert.ok(s.level===null||s.level==='observar');
 assert.deepEqual(r.spaces.find(s=>s.space_id==='biblioteca').operations,['recordVisit']);
 assert.equal('actor_id' in r,false);assert.equal('token' in r,false);
});
test('direct calls deny unknown operations, other cases, forged identity/level and unconnected rooms before reader IO',()=>{
 const changes=[{operation:'sendDraft',space_id:'comunicacion'},{operation:'createDraft',space_id:'drive'},{operation:'approveDelivery'},
  {operation:'unknown'},{operation:'__proto__'},{case_id:'OTHER-SYNTHETIC'},{level:'accion'},{actor_id:'ADMIN-SPOOF'},{space_id:'biblioteca'},{space_id:'unknown'}];
 for(const change of changes){const f=fixture(),r=f.backend.executeRead({...f.request,...change},()=>{f.reads++;return {ok:true};});assert.equal(r.ok,false);assert.equal(f.reads,0);}
});
test('valid scoped read returns data only while the original identity remains authorized',()=>{
 const f=fixture(),r=f.backend.executeRead(f.request,a=>{assert.equal(a.actor_id,f.actor);f.reads++;return {ok:true,items:['SYNTHETIC']};});assert.equal(r.ok,true);assert.equal(f.reads,1);assert.equal(f.auths,2);
 for(const change of ['revoke','actor']){const x=fixture(),r=x.backend.executeRead(x.request,()=>{x.reads++;if(change==='revoke')x.allowed=false;else x.actor='OTHER-ACTOR';return {ok:true,items:['WITHHOLD-SYNTHETIC']};});assert.equal(r.error,'unauthorized');assert.equal('items' in r,false);assert.equal(x.reads,1);}
});
test('denied session and failed authentication never execute reader or expose matrix',()=>{
 const f=fixture();f.allowed=false;assert.equal(f.backend.inspect({case_id:caseId}).error,'unauthorized');assert.equal(f.backend.executeRead(f.request,()=>{f.reads++;}).error,'unauthorized');assert.equal(f.reads,0);
 const failed=ctx.createOfficePermissions({case_id:caseId,now:()=>0,authenticate:()=>{throw Error('PRIVATE-ERROR');}});assert.deepEqual(copy(failed.inspect({case_id:caseId})),{ok:false,error:'backend_unavailable'});
});
test('policy authorize is scope only; mutation cannot be executed by the read helper',()=>{
 const f=fixture(),visit={case_id:caseId,space_id:'edicion',operation:'recordVisit'};assert.equal(f.backend.authorize(visit).level,'observar');assert.equal(f.backend.executeRead(visit,()=>{f.reads++;}).error,'invalid_operation');assert.equal(f.reads,0);
});
test('Portero adapter keeps current session, canonical case and strict read-only routing',()=>{
 let actor={actor_id:'ACTOR-SYNTHETIC'},forwarded=[],revoke=false;
 const link={YOD_DESPACHO_CONFIG:{case_id:caseId},Date,createOfficePermissions:ctx.createOfficePermissions,yodDespachoActor_:()=>actor,
  yodDespachoRequest_:r=>{forwarded.push(copy(r));if(revoke)actor=null;return {ok:true,case_id:caseId,goals:['SYNTHETIC']};}};
 vm.runInNewContext(fs.readFileSync('despacho-runtime/source/server/permisos-portero.gs','utf8'),link);
 const request={operation:'readOfficePending',payload:{case_id:caseId,space_id:'juntas'},k:'SESSION-SYNTHETIC'};
 assert.equal(link.yodDespachoOffice_(request).ok,true);assert.deepEqual(forwarded,[{operation:'readGoals',payload:{case_id:caseId},k:'SESSION-SYNTHETIC'}]);
 for(const payload of [{case_id:caseId,space_id:'drive'},{case_id:'OTHER-SYNTHETIC',space_id:'juntas'},{case_id:caseId,space_id:'juntas',level:'accion'}])assert.equal(link.yodDespachoOffice_({...request,payload}).ok,false);
 assert.equal(forwarded.length,1);revoke=true;assert.equal(link.yodDespachoOffice_(request).error,'unauthorized');actor={actor_id:'ACTOR-SYNTHETIC'};
 assert.equal(link.yodDespachoOffice_({operation:'readOfficePermissions',payload:{case_id:caseId}}).spaces.length,9);
 assert.equal(link.yodDespachoOffice_({operation:'sendDraft'}).error,'invalid_operation');
});
test('client accepts only current case and baseline observe policy; forged higher grants fail',async()=>{
 const {validarPermisos}=await import('../despacho3d/permisos.mjs');const r=copy(fixture().backend.inspect({case_id:caseId}));assert.equal(validarPermisos(r,caseId).spaces.length,9);
 for(const change of [x=>{x.case_id='OTHER-SYNTHETIC';},x=>{x.spaces[0].level='accion';},x=>{x.spaces[0].operations.push('approveDelivery');},x=>{x.spaces[1].connected=true;},x=>{x.spaces.pop();},x=>{x.issued_at='2026';}]){const x=copy(r);change(x);assert.throws(()=>validarPermisos(x,caseId),/invalid_permissions/);}
});
test('client blocks before verified read and clears matrix on revoked RPC or late reply',async()=>{
 const {Permisos}=await import('../despacho3d/permisos.mjs');const r=copy(fixture().backend.inspect({case_id:caseId}));let calls=0,finish;
 const p=new Permisos({transport:{readOfficePermissions:async()=>r,readOfficePending:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}}});
 await assert.rejects(()=>p.readPending(),/permission_denied/);assert.equal(calls,0);await p.open(caseId);assert.equal(p.permits('juntas','readPending'),true);assert.equal(p.permits('drive','createDraft'),false);
 const pending=p.readPending();p.close();finish({ok:true,goals:['PRIVATE-SYNTHETIC']});await assert.rejects(()=>pending,/session_changed/);assert.equal(p.state().matrix,null);
 await p.open(caseId);const revoked=p.readPending();finish({ok:false,error:'unauthorized'});await assert.rejects(()=>revoked,/unauthorized/);assert.equal(p.state().matrix,null);
 p.transport.readOfficePending=async()=>{throw Error('session_changed');};await p.open(caseId);await assert.rejects(()=>p.readPending(),/session_changed/);assert.equal(p.state().matrix,null);
});
test('late permission snapshot cannot restore a closed or changed case',async()=>{
 const {Permisos}=await import('../despacho3d/permisos.mjs');let finish;const p=new Permisos({transport:{readOfficePermissions:()=>new Promise(r=>{finish=r;})}});const pending=p.open(caseId);p.close();finish(copy(fixture().backend.inspect({case_id:caseId})));assert.equal(await pending,false);assert.equal(p.state().matrix,null);assert.equal(p.state().status,'off');
});
