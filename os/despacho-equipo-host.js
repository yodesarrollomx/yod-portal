(function(root){
 'use strict';
 function create(options){
  var controller=null,pending=null,epoch=null,generation=0,disposed=false;
  function access(){try{return options.getAccess();}catch(_){return {allowed:false};}}
  function valid(expected){var a=access();return !disposed&&a.allowed===true&&a.epoch===expected;}
  function teardown(){generation++;pending=null;epoch=null;if(controller){controller.revoke();controller=null;}}
  function refresh(){
   var a=access();
   if(disposed||a.allowed!==true){teardown();return Promise.resolve(false);}
   if(epoch!==null&&epoch!==a.epoch)teardown();
   if(controller)return Promise.resolve(true);
   if(pending)return pending;
   var own=generation,expected=a.epoch;epoch=expected;
   var job=Promise.resolve().then(function(){return options.loadMount();}).then(function(mount){
    if(own!==generation||!valid(expected))return false;
    var mounted=mount({container:options.container,transport:options.transport,
     isAuthorized:function(){return own===generation&&valid(expected);},
     identityEpoch:function(){return access().epoch;},host:options.host||root});
    if(own!==generation||!valid(expected)){mounted.revoke();return false;}
    controller=mounted;return true;
   }).catch(function(error){
    if(own===generation&&valid(expected)&&options.onError)options.onError(error);
    return false;
   }).finally(function(){if(pending===job)pending=null;});
   pending=job;return job;
  }
  return Object.freeze({refresh:refresh,teardown:teardown,dispose:function(){teardown();disposed=true;}});
 }
 root.YodDespachoEquipoHost=Object.freeze({create:create});
})(typeof globalThis!=='undefined'?globalThis:this);
