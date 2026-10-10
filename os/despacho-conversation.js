(function(root){
 'use strict';
 var methods=['readModelPreferences','setModelPreferences','listAuthorized','resolveCurrent','read','enqueue','createGoal','readGoals','reviewGoal','mintFastSession','readVisits','recordVisit','readOfficePermissions','readOfficePending'];
 function keys(v,names){return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===names.length&&names.every(function(k){return Object.prototype.hasOwnProperty.call(v,k);});}
 function str(v,max){return typeof v==='string'&&v.length>0&&v.length<=max;}
 function bind(options){
  // A slow background goals read must not make the conversation look offline.
  // Mutations keep their original IDs; this bridge never retries them.
  var readFlights=new Map(),generation=0,disposed=false,busy={conversation:false,goals:false,fast:false,visits:false,office:false};
  function authorized(source,epoch){return !disposed&&options.isAuthorized()&&source===options.getIframeWindow()&&epoch===options.getEpoch();}
  async function receive(event){
   var m=event.data,epoch=options.getEpoch(),source=event.source;
   if(event.origin!==root.location.origin||!authorized(source,epoch)||!keys(m,['type','version','id','method','payload'])||m.type!=='yod:case:request'||m.version!==1||!str(m.id,100)||!methods.includes(m.method))return;
   var p=m.payload;
   if(m.method==='readModelPreferences'&&(!keys(p,['case_id'])||!str(p.case_id,200)))return;
   if(m.method==='setModelPreferences'&&(!keys(p,['case_id','request_id','expected_revision','scope','task_id','preference'])||!str(p.case_id,200)||!str(p.request_id,200)||!Number.isSafeInteger(p.expected_revision)||!['agent','task'].includes(p.scope)))return;
   if(m.method==='listAuthorized'&&!keys(p,[]))return;
   if(m.method==='resolveCurrent'&&!(keys(p,[])||(keys(p,['case_id'])&&str(p.case_id,200))))return;
   if(m.method==='read'&&(!keys(p,['case_id'])||!str(p.case_id,256)))return;
   if(m.method==='enqueue'&&(!keys(p,['case_id','expected_revision','request_id','message'])||!str(p.case_id,256)||!str(p.expected_revision,256)||!str(p.request_id,256)||!str(p.message,8000)))return;
   if(m.method==='readGoals'&&(!keys(p,['case_id'])||!str(p.case_id,256)))return;
   if(m.method==='readOfficePermissions'&&(!keys(p,['case_id'])||!str(p.case_id,256)))return;
   if(m.method==='readOfficePending'&&(!keys(p,['case_id','space_id'])||!str(p.case_id,256)||p.space_id!=='juntas'))return;
   if(m.method==='readVisits'&&(!keys(p,['case_id'])||!str(p.case_id,256)))return;
   if(m.method==='recordVisit'&&(!keys(p,['case_id','request_id','visit_id','expected_revision','space_id','visitor_kind','reason_code','arrival_ref'])||!str(p.case_id,256)||!str(p.request_id,256)||!str(p.visit_id,256)||!str(p.arrival_ref,256)||!Number.isSafeInteger(p.expected_revision)||p.expected_revision<0||p.expected_revision>=10000||!['juntas','biblioteca','edicion'].includes(p.space_id)||!((p.visitor_kind==='agent'&&p.reason_code==='agent_arrived')||(p.visitor_kind==='direction'&&p.reason_code==='visitor_opened'))))return;
   if(m.method==='mintFastSession'&&(!keys(p,['case_id'])||!str(p.case_id,256)))return;
   if(m.method==='createGoal'&&(!keys(p,['case_id','request_id','expected_revision','title','instruction','criterion','scope'])||!str(p.case_id,256)||!str(p.request_id,256)||!str(p.expected_revision,256)||!str(p.title,160)||!str(p.instruction,4000)||!str(p.criterion,1000)||p.scope!=='local_analysis_v1'))return;
   if(m.method==='reviewGoal'&&(!keys(p,['case_id','goal_id','request_id','expected_revision','action'])||!str(p.case_id,256)||!str(p.goal_id,256)||!str(p.request_id,256)||!str(p.expected_revision,256)||!['approve','resume','stop'].includes(p.action)))return;
   var own=generation;
   function reply(result,error){if(own===generation&&authorized(source,epoch))source.postMessage({type:'yod:case:result',version:1,id:m.id,result:result,error:error},root.location.origin);}
   var transport=options.getTransport(),lane=['readModelPreferences','setModelPreferences'].includes(m.method)?'model-preferences':['readOfficePermissions','readOfficePending'].includes(m.method)?'office':['readVisits','recordVisit'].includes(m.method)?'visits':m.method==='readGoals'?'goals':m.method==='mintFastSession'?'fast':'conversation';
   if(!transport||typeof transport[m.method]!=='function'){reply(null,'unavailable');return;}
   var readKey=['listAuthorized','resolveCurrent','read','mintFastSession'].includes(m.method)?m.method+'|'+JSON.stringify(p):null;
   if(readKey&&readFlights.has(readKey)){
    var shared=await readFlights.get(readKey);reply(shared.result,shared.error);return;
   }
   if(busy[lane]){reply(null,'transport_busy');return;}
   busy[lane]=true;
   var timer,settle;
   if(readKey)readFlights.set(readKey,new Promise(function(resolve){settle=resolve;}));
   try{var result=await Promise.race([transport[m.method](JSON.parse(JSON.stringify(p))),new Promise(function(_,reject){timer=setTimeout(function(){reject(Error('timeout'));},options.timeout||50000);})]);if(settle)settle({result:result,error:null});reply(result,null);}
   catch(error){var failure=['unauthorized','session_changed','session_pending','timeout','transport_busy'].includes(error&&error.message)?error.message:error&&error.name==='AbortError'?'timeout':'unavailable';if(settle)settle({result:null,error:failure});reply(null,failure);}
   finally{clearTimeout(timer);if(own===generation){busy[lane]=false;if(readKey)readFlights.delete(readKey);}}
  }
  function clear(){generation++;readFlights.clear();busy={conversation:false,goals:false,fast:false,visits:false,office:false};}
  root.addEventListener('message',receive);
  return {clear:clear,dispose:function(){clear();disposed=true;root.removeEventListener('message',receive);}};
 }
 root.YodDespachoConversation=Object.freeze({bind:bind});
})(typeof globalThis!=='undefined'?globalThis:this);
