(function(root){
 'use strict';
 function create(options){
  var endpoint=options.endpoint;
  if(typeof endpoint!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))throw Error('invalid_endpoint');
  var methods=['resolveCurrent','read','enqueue'];
  async function call(operation,payload){
   var session=options.getSession();
   if(!session||session.ready!==true||session.allowed!==true||!session.token)throw Error('unauthorized');
   var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},options.timeout||23000);
   try{
    var response=await (options.fetch||root.fetch)(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},
     body:JSON.stringify({tipo:'despacho-v1',operation:operation,payload:payload,k:session.token}),
     credentials:'omit',cache:'no-store',redirect:'follow',signal:controller.signal});
    if(!response.ok)throw Error('unavailable');
    var raw=await response.text();if(raw.length>524288)throw Error('response_limit');
    var data=JSON.parse(raw),current=options.getSession();
    if(!current||!current.ready||!current.allowed||current.epoch!==session.epoch||current.token!==session.token)throw Error('session_changed');
    return data;
   }finally{clearTimeout(timer);}
  }
  var transport={};methods.forEach(function(method){transport[method]=function(payload){return call(method,payload);};});
  return Object.freeze(transport);
 }
 root.YodDespachoTransport=Object.freeze({create:create});
})(typeof globalThis!=='undefined'?globalThis:this);
