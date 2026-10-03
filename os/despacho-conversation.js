(function(root){
 'use strict';
 var methods=['resolveCurrent','read','enqueue'];
 function keys(v,names){return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===names.length&&names.every(function(k){return Object.prototype.hasOwnProperty.call(v,k);});}
 function str(v,max){return typeof v==='string'&&v.length>0&&v.length<=max;}
 function bind(options){
  var generation=0,disposed=false,busy=false;
  function authorized(source,epoch){return !disposed&&options.isAuthorized()&&source===options.getIframeWindow()&&epoch===options.getEpoch();}
  async function receive(event){
   var m=event.data,epoch=options.getEpoch(),source=event.source;
   if(event.origin!==root.location.origin||!authorized(source,epoch)||!keys(m,['type','version','id','method','payload'])||m.type!=='yod:case:request'||m.version!==1||!str(m.id,100)||!methods.includes(m.method))return;
   var p=m.payload;
   if(m.method==='resolveCurrent'&&!keys(p,[]))return;
   if(m.method==='read'&&(!keys(p,['case_id'])||!str(p.case_id,256)))return;
   if(m.method==='enqueue'&&(!keys(p,['case_id','expected_revision','request_id','message'])||!str(p.case_id,256)||!str(p.expected_revision,256)||!str(p.request_id,256)||!str(p.message,8000)))return;
   var own=generation;
   function reply(result,error){if(own===generation&&authorized(source,epoch))source.postMessage({type:'yod:case:result',version:1,id:m.id,result:result,error:error},root.location.origin);}
   var transport=options.getTransport();
   if(busy||!transport||typeof transport[m.method]!=='function'){reply(null,'unavailable');return;}
   busy=true;
   var timer;
   try{var result=await Promise.race([transport[m.method](JSON.parse(JSON.stringify(p))),new Promise(function(_,reject){timer=setTimeout(function(){reject(Error('timeout'));},options.timeout||25000);})]);reply(result,null);}
   catch(error){reply(null,['unauthorized','session_changed'].includes(error&&error.message)?error.message:error&&error.name==='AbortError'?'timeout':'unavailable');}
   finally{clearTimeout(timer);if(own===generation)busy=false;}
  }
  function clear(){generation++;busy=false;}
  root.addEventListener('message',receive);
  return {clear:clear,dispose:function(){clear();disposed=true;root.removeEventListener('message',receive);}};
 }
 root.YodDespachoConversation=Object.freeze({bind:bind});
})(typeof globalThis!=='undefined'?globalThis:this);
