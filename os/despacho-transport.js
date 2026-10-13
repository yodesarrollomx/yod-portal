(function(root){
 'use strict';
 function create(options){
  var endpoint=options.endpoint;
  if(typeof endpoint!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))throw Error('invalid_endpoint');
  var methods=['listAuthorized','resolveCurrent','read','enqueue','createGoal','readGoals','reviewGoal','mintFastSession','readVisits','recordVisit','readOfficePermissions','readOfficePending','readTeam','writeTeam','lookupTeamReceipt'];
  function keys(value,names){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===names.length&&names.every(function(key){return Object.prototype.hasOwnProperty.call(value,key);});}
  function str(value,max){return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
  function validGoalPayload(operation,p){
   if(operation==='readTeam')return keys(p,[]);
   if(operation==='lookupTeamReceipt')return keys(p,['request_id'])&&typeof p.request_id==='string'&&/^[a-zA-Z0-9_-]{16,100}$/.test(p.request_id);
   if(operation==='writeTeam')return keys(p,['version','kind','text','task_id','request_id','expected_revision'])&&p.version===1&&['request','note'].includes(p.kind)&&str(p.text,12000)&&typeof p.request_id==='string'&&/^[a-zA-Z0-9_-]{16,100}$/.test(p.request_id)&&str(p.expected_revision,256)&&((p.kind==='request'&&p.task_id===null)||(p.kind==='note'&&str(p.task_id,256)));
   if(operation==='listAuthorized')return keys(p,[]);
   if(operation==='resolveCurrent')return keys(p,[])||(keys(p,['case_id'])&&str(p.case_id,200));
   if(operation==='readOfficePending')return keys(p,['case_id','space_id'])&&str(p.case_id,256)&&p.space_id==='juntas';
   if(operation==='recordVisit')return keys(p,['case_id','request_id','visit_id','expected_revision','space_id','visitor_kind','reason_code','arrival_ref'])&&str(p.case_id,256)&&str(p.request_id,256)&&str(p.visit_id,256)&&str(p.arrival_ref,256)&&Number.isSafeInteger(p.expected_revision)&&p.expected_revision>=0&&p.expected_revision<10000&&['juntas','biblioteca','edicion'].includes(p.space_id)&&((p.visitor_kind==='agent'&&p.reason_code==='agent_arrived')||(p.visitor_kind==='direction'&&p.reason_code==='visitor_opened'));
   if(operation==='readOfficePermissions'||operation==='readVisits'||operation==='readGoals'||operation==='mintFastSession')return keys(p,['case_id'])&&str(p.case_id,256);
   if(operation==='createGoal')return keys(p,['case_id','request_id','expected_revision','title','instruction','criterion','scope'])&&str(p.case_id,256)&&str(p.request_id,256)&&str(p.expected_revision,256)&&str(p.title,160)&&str(p.instruction,4000)&&str(p.criterion,1000)&&p.scope==='local_analysis_v1';
   if(operation==='reviewGoal')return keys(p,['case_id','goal_id','request_id','expected_revision','action'])&&str(p.case_id,256)&&str(p.goal_id,256)&&str(p.request_id,256)&&str(p.expected_revision,256)&&['approve','resume','stop'].includes(p.action);
   return true;
  }
  async function call(operation,payload){
   var sourceSession=options.getSession();
   if(!sourceSession||sourceSession.allowed!==true||!sourceSession.token)throw Error('unauthorized');
   if(sourceSession.ready!==true)throw Error('session_pending');
   // Capture scalar identity now; a caller may mutate its session object in place.
   var session={token:sourceSession.token,epoch:sourceSession.epoch};
   if(!validGoalPayload(operation,payload))throw Error('invalid_payload');
   var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},options.timeout||45000);
   try{
    var response=await (options.fetch||root.fetch)(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},
     body:JSON.stringify({tipo:'despacho-v1',operation:operation,payload:payload,k:session.token}),
     credentials:'omit',cache:'no-store',redirect:'follow',signal:controller.signal});
    if(controller.signal.aborted)throw Error('timeout');
    if(!response.ok)throw Error('unavailable');
    // The durable read includes growing history as well as source metadata.
    // Other operations retain their original bound; each consumer still validates its projection.
    var limit=(operation==='read'||operation==='readTeam')?2097152:524288;
    var raw=await response.text();if(raw.length>limit)throw Error('response_limit');
    if(controller.signal.aborted)throw Error('timeout');
    var data;try{data=JSON.parse(raw);}catch(_){throw Error('invalid_response');}
    var current=options.getSession();
    if(!current||current.epoch!==session.epoch||current.token!==session.token)throw Error('session_changed');
    if(current.allowed!==true)throw Error('unauthorized');
    if(current.ready!==true)throw Error('session_pending');
    if(['readTeam','writeTeam','lookupTeamReceipt'].includes(operation)&&data&&data.ok===false){var code=typeof data.error==='string'&&/^[a-zA-Z0-9_:-]{1,100}$/.test(data.error)?data.error:'team_unavailable';throw Error(code);}
    return data;
   }catch(error){if(controller.signal.aborted||error&&error.name==='AbortError')throw Error('timeout');throw error;}
   finally{clearTimeout(timer);}
  }
  var transport={};methods.forEach(function(method){transport[method]=function(payload){return call(method,payload);};});
  return Object.freeze(transport);
 }
 root.YodDespachoTransport=Object.freeze({create:create});
})(typeof globalThis!=='undefined'?globalThis:this);
