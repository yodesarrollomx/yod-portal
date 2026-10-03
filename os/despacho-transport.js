(function(root){
 'use strict';
 function create(options){
  var endpoint=options.endpoint;
  if(typeof endpoint!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))throw Error('invalid_endpoint');
  var methods=['resolveCurrent','read','enqueue','createGoal','readGoals','reviewGoal'];
  function keys(value,names){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===names.length&&names.every(function(key){return Object.prototype.hasOwnProperty.call(value,key);});}
  function str(value,max){return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
  function validGoalPayload(operation,p){
   if(operation==='readGoals')return keys(p,['case_id'])&&str(p.case_id,256);
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
    var raw=await response.text();if(raw.length>524288)throw Error('response_limit');
    if(controller.signal.aborted)throw Error('timeout');
    var data=JSON.parse(raw),current=options.getSession();
    if(!current||current.epoch!==session.epoch||current.token!==session.token)throw Error('session_changed');
    if(current.allowed!==true)throw Error('unauthorized');
    if(current.ready!==true)throw Error('session_pending');
    return data;
   }catch(error){if(controller.signal.aborted||error&&error.name==='AbortError')throw Error('timeout');throw error;}
   finally{clearTimeout(timer);}
  }
  var transport={};methods.forEach(function(method){transport[method]=function(payload){return call(method,payload);};});
  return Object.freeze(transport);
 }
 root.YodDespachoTransport=Object.freeze({create:create});
})(typeof globalThis!=='undefined'?globalThis:this);
