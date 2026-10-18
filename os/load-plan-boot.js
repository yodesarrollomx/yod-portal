(function(root){
  'use strict';
  root.YodLoadPlanReady=root.YodLoadConfig&&root.YodLoadConfig.enabled
    ? Promise.all([import('./load-plan.mjs?v=v2p4'),import('./tab-continuity.mjs?v=v2p4')]).then(function(modules){
      var tabs,plan=modules[0].createPortalLoadPlan({onChange:function(){if(tabs)tabs.changed();}}),channel=null;
      try{if(root.BroadcastChannel)channel=new root.BroadcastChannel('yod-background-v1');}catch(_e){}
      tabs=modules[1].createTabContinuity({id:root.crypto.randomUUID(),channel:channel,
        onPause:function(value){plan.pauseBackground(value);},onDirty:function(){plan.invalidate();},
        onWake:function(){if(root.YodContinuityWake)void root.YodContinuityWake();}});
      function state(){tabs.state({visible:!root.document.hidden,online:root.navigator.onLine!==false});}
      root.document.addEventListener('visibilitychange',state);root.addEventListener('online',state);root.addEventListener('offline',state);
      root.addEventListener('pagehide',function(event){
        if(event.persisted){tabs.state({visible:false,online:false});plan.invalidate();}
        else{tabs.close();plan.revoke();}
      });
      root.addEventListener('pageshow',function(event){if(event.persisted)state();});state();return plan;
    }).catch(function(){root.YodLoadConfig=Object.freeze({enabled:false});return null;})
    : Promise.resolve(null);
})(typeof globalThis!=='undefined'?globalThis:this);
