// Install alongside the inspected r6-fast adapter. No private configuration copied.
// In yodDespachoRequest_, before its operation allowlist, dispatch readVisits/recordVisit
// to yodDespachoVisits_(request). This handler always reauthenticates the OS session.
function yodDespachoVisits_(request) {
  if (!request || ['readVisits','recordVisit'].indexOf(request.operation) < 0) return {ok:false,error:'invalid_operation'};
  // The backend authenticates before any Sheet IO, again inside its lock,
  // and at the end of reads / before commit. Avoid a redundant outer check.
  var backend = createOfficeVisitsBackend({case_id:YOD_DESPACHO_CONFIG.case_id,serverContext:request,
    Sheets:Sheets,scriptLock:LockService.getScriptLock(),now:function(){return Date.now();},
    newId:function(){return Utilities.getUuid();},digest:yodDespachoHash_,
    authorize:function(context,scope){var decision=yodDespachoOfficeAccess_(context,{case_id:scope.case_id,
      space_id:scope.action==='readVisits'?'oficina':context.payload.space_id,operation:scope.action});
      return decision.ok ? {allowed:true,actor_id:decision.actor_id,case_id:decision.case_id} : {allowed:false};},
    resolveCanonicalWorkbook:function(){return {case_id:YOD_DESPACHO_CONFIG.case_id,spreadsheet_id:YOD_DESPACHO_CONFIG.operational_book};}
  });
  return backend[request.operation](request.payload);
}
// Explicit initialization creates two empty owned tabs only. No visit is invented.
function YOD_prepararVisitas() {
  var email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(YOD_DESPACHO_CONFIG.editors.indexOf(email)<0)throw Error('unauthorized');
  var result=createOfficeVisitsBackend({case_id:YOD_DESPACHO_CONFIG.case_id,serverContext:{},Sheets:Sheets,
    scriptLock:LockService.getScriptLock(),now:function(){return Date.now();},newId:function(){return Utilities.getUuid();},digest:yodDespachoHash_,
    authorize:function(){var current=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();return {allowed:current===email&&YOD_DESPACHO_CONFIG.editors.indexOf(current)>=0,actor_id:current,case_id:YOD_DESPACHO_CONFIG.case_id,can_setup:true};},
    resolveCanonicalWorkbook:function(){return {case_id:YOD_DESPACHO_CONFIG.case_id,spreadsheet_id:YOD_DESPACHO_CONFIG.operational_book};}
  }).setup({case_id:YOD_DESPACHO_CONFIG.case_id});
  if(!result.ok)throw Error(result.error);console.log(JSON.stringify({ok:true,created:result.created}));
}

// Editor-only read diagnostic. Never initializes storage or invents a visit.
function YOD_verificarLecturaVisitas() {
  var email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(YOD_DESPACHO_CONFIG.editors.indexOf(email)<0)throw Error('unauthorized');
  var result=createOfficeVisitsBackend({case_id:YOD_DESPACHO_CONFIG.case_id,serverContext:{},Sheets:Sheets,
    scriptLock:LockService.getScriptLock(),now:function(){return Date.now();},newId:function(){return Utilities.getUuid();},digest:yodDespachoHash_,
    authorize:function(){var current=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();return {allowed:current===email&&YOD_DESPACHO_CONFIG.editors.indexOf(current)>=0,actor_id:current,case_id:YOD_DESPACHO_CONFIG.case_id,can_setup:true};},
    resolveCanonicalWorkbook:function(){return {case_id:YOD_DESPACHO_CONFIG.case_id,spreadsheet_id:YOD_DESPACHO_CONFIG.operational_book};}
  }).readVisits({case_id:YOD_DESPACHO_CONFIG.case_id});
  console.log(JSON.stringify(result));
}
