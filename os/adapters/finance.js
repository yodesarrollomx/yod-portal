(function(root){
  'use strict';
  var ENDPOINT='https://script.google.com/macros/s/AKfycbxbQpBn7fpbrjXppE3e-DFMBjDmZ8Yy9CZqfuZa4vHNWthS0fl2EzrKnMHHOtPGzTA/exec';

  function number(value){var parsed=Number(String(value==null?'':value).replace(/[^0-9.-]/g,''));return Number.isFinite(parsed)?parsed:0;}
  function status(value){return String(value||'').trim().toLowerCase();}
  function isClosed(value){return ['pagado','realizado','cobrado','cancelado','cancelada'].includes(status(value));}
  function total(rows){return (Array.isArray(rows)?rows:[]).reduce(function(sum,row){return sum+number(row&&row.monto);},0);}
  function summarize(data){
    data=data&&typeof data==='object'?data:{};
    var payments=(Array.isArray(data.pagos)?data.pagos:[]).filter(function(row){return !isClosed(row&&row.estatus);});
    var income=(Array.isArray(data.ingresosEsperados)?data.ingresosEsperados:[]).filter(function(row){return !isClosed(row&&row.estatus);});
    var balance=number(data.saldo&&data.saldo.monto),paymentsTotal=total(payments),incomeTotal=total(income);
    return {balance:balance,payments:paymentsTotal,paymentsCount:payments.length,income:incomeTotal,incomeCount:income.length,projected:balance+incomeTotal-paymentsTotal,updatedAt:data.saldo&&data.saldo.fecha||''};
  }
  async function load(token){
    if(!token)throw new Error('sin_sesion');
    // Sin límite de tiempo la tarjeta se quedaba en "Consultando…" para siempre.
    var controller=(typeof AbortController!=='undefined')?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort();},12000):null;
    try{
      var response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({k:token,action:'getAll'}),redirect:'follow',cache:'no-store',credentials:'omit',signal:controller?controller.signal:undefined});
      if(!response.ok)throw new Error('HTTP '+response.status);var payload=await response.json();if(!payload.ok)throw new Error(payload.error||'tesoreria');
      var data=payload.data||{};return {data:data,summary:summarize(data),updatedAt:new Date()};
    }finally{if(timer)clearTimeout(timer);}
  }
  root.YodFinance=Object.freeze({load:load,summarize:summarize});
})(typeof globalThis!=='undefined'?globalThis:this);
