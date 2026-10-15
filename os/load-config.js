(function(root){
  'use strict';
  // Parte 6 autoriza y verifica la activación; no habilitar por URL/storage.
  root.YodLoadConfig=Object.freeze({enabled:false});
})(typeof globalThis!=='undefined'?globalThis:this);
