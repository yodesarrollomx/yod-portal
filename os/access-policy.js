(function(root){
  'use strict';
  // Código de cada tablero YOD OS (debe coincidir con la matriz de Accesos).
  // Se incluyen los códigos históricos de Potenciales/Track por compatibilidad.
  var SYSTEM_CODES=Object.freeze({
    'SYS-POTENCIALES':['PT','MP','MA','MX','UN','RE','PA'],
    'SYS-TRACK':['CO','TC'],
    'SYS-MIRAMAR':['RM'],
    'SYS-TAREAS':['TA'],
    'SYS-FLUJO':['FL'],
    'SYS-INTERIORES':['IN'],
    'SYS-INVERSION':['IV'],
    'SYS-MARKETING':['MK'],
    'SYS-OBRA':['OB'],
    'SYS-CONTROL':['AC']
  });
  function codes(value){var raw=String(value||'').trim();if(!raw)return [];if(raw==='*')return ['*'];return raw.toUpperCase().split(/[,|; ]+/).filter(Boolean);}
  function hasCode(boards,code){var list=codes(boards);return list.includes('*')||list.includes(String(code||'').toUpperCase());}
  function canOpen(boards,systemId,role){
    if(String(role||'').toLowerCase()==='admin'||codes(boards).includes('*'))return true;
    // El Control Maestro (Sheet de Dirección) no se otorga por código: solo rol admin.
    if(String(systemId||'')==='SYS-CONTROL')return false;
    var required=SYSTEM_CODES[String(systemId||'')];if(!required)return false;
    return required.some(function(code){return hasCode(boards,code);});
  }
  root.YodAccessPolicy=Object.freeze({systemCodes:SYSTEM_CODES,codes:codes,hasCode:hasCode,canOpen:canOpen});
})(typeof globalThis!=='undefined'?globalThis:this);
