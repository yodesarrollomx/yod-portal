/* Estado técnico por prueba. El permiso para montar lo decide la sesión de Accesos. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.YodSalud=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var REPORT='https://raw.githubusercontent.com/yodesarrollomx/yod-portal/estado-online/estado-online.json';
  var CLOUD='https://yod-cloud-room.onrender.com/horarios/estado.json';
  var CONNECT='https://yod-cloud-room.onrender.com/horarios/conectar';
  var CATALOG='https://yodesarrollomx.github.io/yod-portal/os/salud-catalogo.json?v=salud1';
  var TZ='America/Hermosillo',MAX_AGE=45*60000;
  var active=false,epoch=0,busy=false,timer=null,controller=null,box=null,last=null,cat=null,live=[],probeSession=null,filter='todas';
  var labels={verde:'Comprobado',rojo:'Falló',ambar:'Por verificar',atrasado:'Prueba vencida',corriendo:'En curso'};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fresh(when,now,max){var t=Date.parse(when);return Number.isFinite(t)&&t<=now&&now-t<=max;}
  function color(check,report,now,connected){
    if(!connected||!report||report.schema!==1||!fresh(report.generado_en,now,MAX_AGE))return 'atrasado';
    if(!check||!fresh(check.revisado_en,now,36*3600000))return 'ambar';
    var expiry=Date.parse(check.vence_en),started=Date.parse(check.revisado_en);
    if(!Number.isFinite(expiry)||expiry<started||expiry-started>36*3600000||now>expiry)return 'atrasado';
    if(check.estado==='fallo')return 'rojo';
    if(check.estado==='ejecutando')return 'corriendo';
    if(check.estado==='ok')return 'verde';
    return 'ambar';
  }
  function safeEvidence(s){
    try{
      var u=new URL(s);
      if(u.protocol!=='https:'||u.search||u.hash)return '';
      if(u.hostname==='yod-cloud-room.onrender.com'&&u.pathname==='/horarios/estado.json')return u.href;
      if(u.hostname==='github.com'&&/^\/yodesarrollomx\/[A-Za-z0-9._-]+\/actions\/runs\/\d+$/.test(u.pathname))return u.href;
      if(u.hostname==='yodesarrollomx.github.io'&&/^\/[A-Za-z0-9._/-]+$/.test(u.pathname))return u.href;
    }catch(e){}
    return '';
  }
  function validReport(r){
    return !!r&&r.schema===1&&Array.isArray(r.checks)&&r.checks.length<=200&&
      /^[0-9a-f]{40}$/.test(r.code_sha||'')&&
      (r.source==='render'?/^h-[0-9a-f-]{36}$/.test(r.cycle_id||''):(r.source==null||r.source==='github')&&/^\d+$/.test(r.run_id||''))&&
      r.checks.every(function(c){return c&&typeof c.id==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(c.id)&&
        typeof c.nombre==='string'&&typeof c.detalle==='string'&&Array.isArray(c.components)&&
        ['ok','fallo','sin_confirmar','ejecutando'].indexOf(c.estado)>=0;})&&
      new Set(r.checks.map(function(c){return c.id;})).size===r.checks.length;
  }
  function chooseReport(reports,now){
    var valid=reports.filter(validReport);
    var current=valid.filter(function(r){return fresh(r.generado_en,now,MAX_AGE);});
    return (current.length?current:valid.filter(function(r){return Date.parse(r.generado_en)<=now;}))
      .sort(function(a,b){return Date.parse(b.generado_en)-Date.parse(a.generado_en);})[0]||null;
  }
  function hora(s){
    var t=Date.parse(s);if(!Number.isFinite(t))return 'Sin fecha confirmada';
    return new Intl.DateTimeFormat('es-MX',{timeZone:TZ,day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(t);
  }
  function pill(state){return '<span class="salud-pill salud-'+state+'">'+esc(labels[state]||'Por verificar')+'</span>';}
  function row(c,r,now,online){
    var status=color(c,r,now,online),url=safeEvidence(c.evidencia_url);
    return '<article class="salud-row"><div><b>'+esc(c.nombre)+'</b>'+pill(status)+'</div><p>'+esc(c.detalle)+'</p><small>'
      +esc(c.alcance)+' · '+esc(hora(c.revisado_en))+' · vence '+esc(hora(c.vence_en))+'</small>'
      +(c.ultima_ejecucion?'<small>Última ejecución: '+esc(hora(c.ultima_ejecucion))+' · Hermosillo</small>':'')
      +(c.programado_en?'<small>Horario esperado: '+esc(hora(c.programado_en))+' · Hermosillo</small>':'')
      +(c.frecuencia?'<small>Programación: '+esc(c.frecuencia)+'</small>':'')
      +(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener">Ver evidencia</a>':'')+'</article>';
  }
  function processState(step,checks,report,now,online){
    if(step.modo==='manual')return {color:'ambar',text:'Intervención humana'};
    if(step.modo==='pendiente')return {color:'ambar',text:'Facultad pendiente'};
    // Cada paso necesita una sonda explícita de ese paso. Un ping de componentes no basta.
    var tests=checks.filter(function(c){return (c.process_steps||[]).indexOf(step.id)>=0;});
    if(!tests.length)return {color:'ambar',text:'Falta prueba de este paso'};
    var states=tests.map(function(c){return color(c,report,now,online);});
    return {color:states.indexOf('rojo')>=0?'rojo':states.every(function(s){return s==='verde';})?'verde':'ambar',
      text:states.every(function(s){return s==='verde';})?'Prueba del paso vigente':'Verificar las pruebas del paso'};
  }
  function render(online){
    if(!box||!active)return;
    var now=Date.now(),checks=last&&validReport(last)?last.checks:[],c=cat||{components:[],processes:[]};
    var directReport={schema:1,generado_en:new Date(now).toISOString()};
    var counts={verde:0,rojo:0,pendiente:0};
    checks.forEach(function(x){var s=color(x,last,now,online);if(s==='verde'||s==='rojo')counts[s]++;else counts.pendiente++;});
    var summary=checks.length?(counts.verde+' comprobadas · '+counts.rojo+' con fallo · '+counts.pendiente+' por verificar'):'Sin resultados comprobados';
    var msg=!online?'No se pudo consultar el monitor. Los resultados anteriores requieren una nueva comprobación.':
      (!last||!fresh(last.generado_en,now,MAX_AGE))?'El monitor está atrasado o aún no ha publicado.':'Actualizado '+hora(last.generado_en)+' · Hermosillo';
    var html='<div class="salud-top"><h2>Estado de los sistemas</h2><button type="button" class="btn mini" data-salud-refrescar>Actualizar estado</button></div>'
      +'<p class="salud-summary" role="status">'+esc(summary)+'</p><p>'+esc(msg)+'</p>'
      +'<p class="salud-note">Verde: la prueba indicada pasó y sigue vigente. El vigilante de nube revisa su reloj cada minuto y las páginas cada cinco minutos; esta pantalla se actualiza cada minuto. Cada prueba conserva su fecha y vigencia.</p>'
      +(last&&last.checks.some(function(x){return x.id==='conexion-horarios'&&color(x,last,now,online)!=='verde';})?'<p><a class="btn mini" href="'+CONNECT+'" target="_blank" rel="noopener">Conectar recuperación de horarios</a></p>':'')
      +'<div class="salud-top">'+['todas','sala','fallos','pendientes'].map(function(f){return '<button type="button" class="btn ghost mini" data-salud-filtro="'+f+'" aria-pressed="'+(f===filter)+'">'+({todas:'Pruebas conectadas',sala:'Sala',fallos:'Fallos',pendientes:'Por verificar'})[f]+'</button>';}).join('')+'</div>'
      +'<details open><summary>Pruebas por proceso y sistema</summary><div class="salud-grid">'+live.map(function(x){return row(x,directReport,now,true);}).join('')+checks.filter(function(x){
        var status=color(x,last,now,online);
        if(filter==='fallos')return status==='rojo';
        if(filter==='pendientes')return status!=='verde'&&status!=='rojo';
        if(filter==='sala')return /^(sala-|rutina:|horario:|vigilante-|conexion-horarios|persistencia-horarios|correo-|motor-|drive-|canario-)/.test(x.id)||x.id==='pagina:SYS-SALA';
        return x.id.indexOf('pendiente:')!==0;
      }).map(function(x){return row(x,last,now,online);}).join('')+'</div></details>';
    html+='<details><summary>Todos los componentes ('+c.components.length+')</summary><div class="salud-grid">'+c.components.map(function(comp){
      var tests=checks.filter(function(x){return x.components.indexOf(comp.id)>=0;});
      var states=tests.map(function(x){return color(x,last,now,online);});
      var status=states.indexOf('rojo')>=0?'rojo':states.length&&states.every(function(s){return s==='verde';})?'verde':'ambar';
      return '<article class="salud-row"><div><b>'+esc(comp.nombre)+'</b>'+pill(status)+'</div><small>'+esc(comp.id)+' · '+esc(comp.tipo)+'</small><p>'
        +(tests.length?esc(tests.length+' pruebas técnicas asociadas; alcance limitado a esas pruebas'):'Sin prueba funcional conectada')+'</p></article>';
    }).join('')+'</div></details>';
    html+='<details><summary>Recorrido de los procesos de negocio ('+c.processes.length+')</summary>'+c.processes.map(function(p){
      return '<details class="salud-process"><summary>'+esc(p.nombre)+'</summary>'+p.steps.map(function(s){
        var status=processState(s,checks,last,now,online);
        return '<div class="salud-step"><b>'+esc(s.nombre)+'</b>'+pill(status.color)+'<small>'+esc(status.text)+'</small></div>';
      }).join('')+'</details>';
    }).join('')+'</details>';
    box.innerHTML=html;
    var b=box.querySelector('[data-salud-refrescar]');if(b)b.onclick=function(){cargar();};
    if(box.querySelectorAll)box.querySelectorAll('[data-salud-filtro]').forEach(function(button){button.onclick=function(){filter=button.getAttribute('data-salud-filtro');render(online);};});
  }
  async function json(url,signal){
    var r=await fetch(url,{cache:'no-store',credentials:'omit',signal:signal});
    if(!r.ok)throw Error('lectura_sin_confirmar');
    return r.json();
  }
  async function cloudJson(signal){
    var ctrl=new AbortController(),to=setTimeout(function(){ctrl.abort();},5000);
    function stop(){ctrl.abort();}signal.addEventListener('abort',stop,{once:true});
    try{return await json(CLOUD+'?t='+Date.now(),ctrl.signal);}
    finally{clearTimeout(to);signal.removeEventListener('abort',stop);}
  }
  async function cargar(){
    if(!active||busy)return;
    var e=epoch;busy=true;
    controller=new AbortController();var ctrl=controller,to=setTimeout(function(){ctrl.abort();},18000);
    try{
      var results=await Promise.allSettled([json(REPORT+'?t='+Date.now(),ctrl.signal),cloudJson(ctrl.signal),cat?Promise.resolve(cat):json(CATALOG,ctrl.signal),
        probeSession?probeSession():Promise.resolve(null)]);
      if(!active||e!==epoch)return;
      var report=chooseReport(results.slice(0,2).filter(function(r){return r.status==='fulfilled';}).map(function(r){return r.value;}),Date.now()),catalog=results[2],session=results[3],time=new Date().toISOString();
      live=probeSession?[{id:'sesion-local',nombre:'Accesos · sesión en este dispositivo',components:['GAS-PORTERO'],estado:session.status==='fulfilled'&&session.value===true?'ok':'sin_confirmar',
        revisado_en:time,vence_en:new Date(Date.now()+90000).toISOString(),detalle:session.status==='fulfilled'&&session.value===true?'El Portero confirmó la sesión administradora actual':'La sesión actual no se pudo confirmar',alcance:'Canje de sesión leído ahora; refresco cada minuto'}]:[];
      if(catalog.status==='fulfilled'&&catalog.value&&catalog.value.schema===1&&Array.isArray(catalog.value.components)&&Array.isArray(catalog.value.processes))cat=catalog.value;
      if(!report)throw Error('informe_sin_contrato');
      last=report;render(true);
    }catch(err){if(active&&e===epoch)render(false);}
    finally{clearTimeout(to);if(e===epoch){busy=false;controller=null;}}
  }
  function activar(options){
    detener();
    if(typeof document==='undefined')return;
    box=document.getElementById(options&&options.elementId||'salud-sistemas');if(!box)return;
    active=true;epoch++;probeSession=options&&typeof options.probarSesion==='function'?options.probarSesion:null;filter='todas';box.hidden=false;box.innerHTML='<p role="status">Comprobando estado de los sistemas…</p>';
    style();cargar();timer=setInterval(cargar,60000);
  }
  function detener(){
    active=false;epoch++;busy=false;last=null;cat=null;live=[];probeSession=null;
    if(timer)clearInterval(timer);timer=null;
    if(controller)controller.abort();controller=null;
    if(box){box.hidden=true;box.innerHTML='';}box=null;
  }
  function style(){
    if(document.getElementById('salud-estilos'))return;
    var s=document.createElement('style');s.id='salud-estilos';
    s.textContent='.salud-top{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.salud-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:12px 0}.salud-row{border:1px solid var(--linea,#d8cfbb);border-radius:12px;padding:12px;min-width:0}.salud-row>div{display:flex;align-items:center;justify-content:space-between;gap:8px}.salud-row b{font-size:12px}.salud-row p,.salud-note{font-size:12px;line-height:1.5}.salud-row small,.salud-step small{display:block;font-size:10px;line-height:1.6;color:var(--muted,#766f62)}.salud-row a{display:inline-block;margin-top:8px;font-size:11px;color:var(--gold,#7d5f1e)}.salud-pill{font-size:10px;padding:3px 8px;border-radius:12px;white-space:nowrap;font-weight:700}.salud-verde{background:#e0efdf;color:#245c32}.salud-rojo{background:#f9e0db;color:#872b20}.salud-ambar,.salud-atrasado{background:#faedca;color:#735012}.salud-corriendo{background:#e0edf8;color:#234e70}.salud-summary{font-weight:700}.salud-process{margin:10px 0}.salud-step{padding:9px;border-bottom:1px solid var(--linea,#d8cfbb)}.salud-step b{display:inline-block;margin-right:10px;font-size:12px}#salud-sistemas summary{cursor:pointer;font-size:12px;font-weight:700;padding:7px 0}#salud-sistemas[hidden]{display:none!important}';
    document.head.appendChild(s);
  }
  if(typeof window!=='undefined')window.addEventListener('focus',function(){if(active)cargar();});
  return {activar:activar,detener:detener,color:color,validReport:validReport,safeEvidence:safeEvidence,processState:processState,chooseReport:chooseReport,reportUrl:REPORT,cloudUrl:CLOUD};
});
