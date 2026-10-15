(function(root){
  'use strict';
  root.YodLoadPlanReady=root.YodLoadConfig&&root.YodLoadConfig.enabled
    ? import('./load-plan.mjs?v=v2p3').then(function(m){return m.createPortalLoadPlan();}).catch(function(){return null;})
    : Promise.resolve(null);
})(typeof globalThis!=='undefined'?globalThis:this);
