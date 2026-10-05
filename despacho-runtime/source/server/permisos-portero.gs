// Install the exact shared office-permissions.js as Apps Script source first.
// Add only readOfficePermissions/readOfficePending to the existing despacho router.
// Existing Portero identity, editors, DP and canonical case are authoritative.
function yodDespachoOfficeBackend_(request) {
  return createOfficePermissions({case_id:YOD_DESPACHO_CONFIG.case_id,serverContext:request,now:function(){return Date.now();},
    authenticate:function(context){var a=yodDespachoActor_(context);return a ?
      {allowed:true,actor_id:a.actor_id,case_id:YOD_DESPACHO_CONFIG.case_id} : {allowed:false};}});
}
function yodDespachoOfficeAccess_(request,operation) {
  return yodDespachoOfficeBackend_(request).authorize(operation);
}
function yodDespachoOffice_(request) {
  if(!request || ['readOfficePermissions','readOfficePending'].indexOf(request.operation)<0)return {ok:false,error:'invalid_operation'};
  var backend=yodDespachoOfficeBackend_(request),p=request.payload;
  if(request.operation==='readOfficePermissions')return backend.inspect(p);
  if(!p || typeof p!=='object' || Array.isArray(p) || Object.keys(p).sort().join('|')!=='case_id|space_id')return {ok:false,error:'invalid_request'};
  return backend.executeRead({case_id:p.case_id,space_id:p.space_id,operation:'readPending'},function(){
    return yodDespachoRequest_({operation:'readGoals',payload:{case_id:p.case_id},k:request.k});
  });
}
