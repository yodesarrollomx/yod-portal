(function(root){
  'use strict';
  var ENDPOINT='https://script.google.com/macros/s/AKfycbztAKA7K5QwO6k45PqjixYLNppLypzCpoz2KvNIkML8kciBLZVKKoais8__0DnYuEQQOg/exec';

  function number(value){var parsed=Number(String(value==null?'':value).replace(/[^0-9.-]/g,''));return Number.isFinite(parsed)?parsed:0;}
  function summarize(data){
    data=data&&typeof data==='object'?data:{};var kpis=data.kpis||{},spend=data.gasto||{};
    var leads=number(kpis.leads),appointments=number(kpis.citas),clients=number(kpis.clientes),spendCurrent=number(spend.semana_actual);
    return {leads:leads,appointments:appointments,clients:clients,untouched24h:number(kpis.nuevos_sin_tocar_24h),spend:spendCurrent,costPerLead:leads?spendCurrent/leads:0,appointmentRate:leads?appointments/leads:0,clientRate:leads?clients/leads:0,period:data.meta&&data.meta.periodo||''};
  }
  async function load(token){
    if(!token)throw new Error('sin_sesion');
    var url=ENDPOINT+'?recurso=board&k='+encodeURIComponent(token)+'&cb='+Date.now();
    // Sin límite de tiempo la tarjeta se quedaba en "Consultando…" para siempre.
    var controller=(typeof AbortController!=='undefined')?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort();},12000):null;
    try{
      var response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller?controller.signal:undefined});
      if(!response.ok)throw new Error('HTTP '+response.status);
      var data=await response.json();if(!data||data.error)throw new Error(data&&data.error||'marketing');
      // Sin KPIs no hay dato: falla cerrado en vez de pintar ceros como reales.
      if(!data.kpis||typeof data.kpis!=='object')throw new Error('formato_inesperado');
      return {data:data,summary:summarize(data),updatedAt:new Date()};
    }finally{if(timer)clearTimeout(timer);}
  }
  root.YodMarketing=Object.freeze({load:load,summarize:summarize});
})(typeof globalThis!=='undefined'?globalThis:this);
