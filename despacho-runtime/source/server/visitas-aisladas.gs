// Explicit integration test. Creates a NEW private synthetic workbook, never resolves the business workbook.
// Keep the resulting file as evidence; rerunning creates a different isolated file.
function YOD_verificarVisitasAisladas() {
  var book=SpreadsheetApp.create('YOD prueba aislada de visitas '+new Date().toISOString());
  book.getSheets()[0].getRange('A1').setValue('Registro sintético aislado');
  var caseId='CASE-SYNTHETIC',actor='actor:synthetic',allowed=true,authCalls=0,revokeAt=0,lost=false;
  var api={Spreadsheets:{get:function(id,options){if(id!==book.getId())throw Error('wrong_target');return Sheets.Spreadsheets.get(id,options);},
    batchUpdate:function(request,id){if(id!==book.getId())throw Error('wrong_target');var result=Sheets.Spreadsheets.batchUpdate(request,id);if(lost){lost=false;throw Error('lost_ack');}return result;}}};
  function backend(){return createOfficeVisitsBackend({case_id:caseId,serverContext:{},Sheets:api,scriptLock:LockService.getScriptLock(),now:function(){return Date.now();},newId:function(){return Utilities.getUuid();},digest:yodDespachoHash_,
    authorize:function(){authCalls++;if(authCalls===revokeAt)allowed=false;return {allowed:allowed,case_id:caseId,actor_id:actor,can_setup:true};},
    resolveCanonicalWorkbook:function(){return {case_id:caseId,spreadsheet_id:book.getId()};}});}
  var passed=[];
  function check(name,condition){if(!condition)throw Error('isolated_test_failed:'+name);passed.push(name);}
  function request(n){return {case_id:caseId,request_id:'REQUEST-'+n,visit_id:'VISIT-'+n,expected_revision:n-1,space_id:'juntas',visitor_kind:'agent',reason_code:'agent_arrived',arrival_ref:'ARRIVAL-'+n};}
  check('read_does_not_create',backend().readVisits({case_id:caseId}).error==='schema_not_initialized');
  check('explicit_setup',backend().setup({case_id:caseId}).ok===true);
  var first=backend().recordVisit(request(1));check('durable_receipt',first.ok===true&&first.scope==='server-persisted');
  var reopened=backend().readVisits({case_id:caseId});check('recreated_adapter_recovers_same_visit',reopened.ok===true&&reopened.total===1&&reopened.visits[0].visit_id===first.visit_id&&reopened.visits[0].receipt.receipt_id===first.receipt_id);
  check('retry_same_receipt',JSON.stringify(backend().recordVisit(request(1)))===JSON.stringify(first));
  var changed=request(1);changed.space_id='edicion';check('changed_content_rejected',backend().recordVisit(changed).error==='request_id_reused');
  actor='another:synthetic';check('other_actor_rejected',backend().recordVisit(request(1)).error==='request_id_reused');actor='actor:synthetic';
  var stale=request(2);stale.expected_revision=0;check('cas_rejected',backend().recordVisit(stale).error==='stale_revision');
  lost=true;check('lost_ack_is_ambiguous',backend().recordVisit(request(2)).error==='backend_unavailable');
  check('lost_ack_recovers_receipt',backend().recordVisit(request(2)).ok===true);
  check('two_logical_visits',backend().readVisits({case_id:caseId}).total===2);
  authCalls=0;revokeAt=3;check('revocation_before_commit',backend().recordVisit(request(3)).error==='unauthorized');allowed=true;revokeAt=0;
  check('revocation_did_not_write',backend().readVisits({case_id:caseId}).total===2);
  check('original_tab_untouched',book.getSheets()[0].getRange('A1').getValue()==='Registro sintético aislado');
  console.log(JSON.stringify({ok:true,passed:passed.length,checks:passed,synthetic:true,book_url:book.getUrl(),visit_count:2}));
}
