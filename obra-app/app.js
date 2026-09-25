/* YOD Obra · la super app de obra.
   Misma metodología que YOD OS: folio PRJ, acceso con el Portero (Google), cadena
   CAPTURA → VERIFICA → AUTORIZA del motor de obra, pendientes con días de espera.
   - Equipo (rol admin o código OB): portafolio, obra, unidades, bandeja, alta de obra,
     y el módulo cliente (dudas, pagos, documentos, fotos, gastos).
   - Cliente (su correo en CLIENTES del módulo cliente): solo su unidad y solo lo autorizado.
   La captura y la firma de avances siguen en obra.html (motor probado); aquí se enlazan. */
(function(){
'use strict';
var LSK='pyod_clave_v1';
var K=''; try{K=localStorage.getItem(LSK)||'';}catch(e){}
var TIPOS=window.YOD_OBRA_TIPOS, REG=window.YOD_OBRAS, C=window.YOD_OBRA_CALC, PRJ=window.YodProyectos;
var SES=null, PERFIL=null, YO=null;           // sesión del Portero, 'equipo'|'cliente', respuesta de «yo»
var BOARDS={}, EQ={};                          // caché por folio: motor de obra y módulo cliente (equipo)

var $=function(s){return document.querySelector(s);};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var pct=function(x){return Math.round((Number(x)||0)*1000)/10+'%';};
var dinero=function(v){return '$'+(Number(v)||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});};
var fecha=function(f){if(!f) return '';var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(f));var d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date(f);
  return isNaN(d)?String(f):d.toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});};
var bar=function(x){return '<div class="bar"><i style="width:'+Math.min(100,Math.max(0,(Number(x)||0)*100)).toFixed(1)+'%"></i></div>';};
var razon=function(e){return typeof e==='string'?(e==='liga'?'tu sesión no abre este motor':e):'sin conexión';};

/* ── red ── */
function timeout(p,ms){return Promise.race([p,new Promise(function(_,rj){setTimeout(function(){rj('sin respuesta');},ms||25000);})]);}
function pedir(base,qs){
  return timeout(fetch(base+'?'+qs+'&k='+encodeURIComponent(K)+'&cb='+Date.now(),{cache:'no-store',credentials:'omit'}))
    .then(function(r){return r.json();}).then(function(j){if(!j.ok) throw (j.error||'error');return j;});
}
function mandar(base,cuerpo){
  // text/plain sin cabecera: no hay preflight CORS, igual que obra.html
  return timeout(fetch(base,{method:'POST',body:JSON.stringify(Object.assign({k:K},cuerpo)),credentials:'omit'}))
    .then(function(r){return r.json();}).then(function(j){if(!j.ok){var e=j.error||'error';if(j.duplicado) e={duplicado:j.duplicado};throw e;}return j;});
}
function canje(){
  var P=window.YOD_PORTERO||{};
  function intenta(b){return b?timeout(fetch(b+'?recurso=canje&t='+encodeURIComponent(K),{cache:'no-store',credentials:'omit'}),20000)
    .then(function(r){return r.text();}).then(function(t){try{return JSON.parse(t);}catch(e){return null;}}):Promise.resolve(null);}
  return intenta(P.original).catch(function(){return null;}).then(function(j){
    if(j&&j.ok) return j; return intenta(P.respaldo).catch(function(){return null;});
  }).then(function(j){return (j&&j.ok)?j:null;});
}
function board(o){
  if(BOARDS[o.folio]) return Promise.resolve(BOARDS[o.folio]);
  return pedir(o.motor,'recurso=board').then(function(d){BOARDS[o.folio]=d;return d;});
}
function equipoCli(folio){
  if(!REG.cliente) return Promise.resolve(null);
  if(EQ[folio]) return Promise.resolve(EQ[folio]);
  return pedir(REG.cliente,'recurso=equipo&folio='+encodeURIComponent(folio)).then(function(d){EQ[folio]=d;return d;});
}

/* ── quién soy en el motor de obra (ROLES del Sheet) ── */
function personaEn(D){
  if(!SES||!D) return {persona:'',rol:''};
  var n=function(v){return String(v==null?'':v).trim().toLowerCase();};
  var ps=(D.roles||[]).filter(function(r){return String(r.activo).toUpperCase()==='SI';});
  var r=ps.find(function(x){return SES.correo&&n(x.correo)===n(SES.correo);})||ps.find(function(x){return SES.nombre&&n(x.persona)===n(SES.nombre);});
  return r?{persona:r.persona,rol:String(r.rol||'').toUpperCase()}:{persona:'',rol:''};
}
function tipoDe(o){return TIPOS.tipo(o&&o.tipo);}

/* ── marco ── */
function crumbs(l){$('#crumbs').innerHTML=l.map(function(c,i){return i<l.length-1?'<a href="'+c[1]+'">'+esc(c[0])+'</a> /':'<span>'+esc(c[0])+'</span>';}).join(' ');}
function tabs(l,cur){
  var t=$('#tabs'); if(!l){t.hidden=true;return;}
  t.hidden=false;
  $('#tabsNav').innerHTML=l.map(function(x){return '<a href="'+x[2]+'"'+(x[0]===cur?' aria-current="page"':'')+'><b>'+x[1]+'</b>'+esc(x[0])+'</a>';}).join('');
}
function pinta(h){$('#main').innerHTML=h;window.scrollTo(0,0);}
function cargando(){pinta('<p class="cargando">Cargando…</p>');}
function falla(e){pinta('<div class="aviso">No se pudo leer: '+esc(razon(e))+'. <button class="btn" onclick="location.reload()">Reintentar</button></div>');}
function pill(est){
  var m={'terminado':'p-ok','en curso':'p-w','sin empezar':'p-n','freno':'p-b','AUTORIZADO':'p-ok','RECIBIDO':'p-ok','APROBADO':'p-ok','RESPONDIDA':'p-i','CERRADA':'p-ok',
    'PROPUESTO':'p-w','VERIFICADO':'p-i','AVISADO':'p-i','PENDIENTE':'p-w','PROGRAMADO':'p-n','POR REVISAR':'p-w','POR COMPROBAR':'p-b','ABIERTA':'p-w','RECHAZADO':'p-b'};
  return '<span class="pill '+(m[est]||'p-n')+'">'+esc(est)+'</span>';
}
function espera(d){return d>=3?'<span class="pill p-b">'+d+' días</span>':d>=1?'<span class="pill p-w">'+d+(d===1?' día':' días')+'</span>':'<span class="pill p-i">hoy</span>';}
function claseU(u){return u.frenos?'u-fr':u.avance>=0.999?'u-ok':u.avance>0?'u-cur':'u-no';}
function sinModulo(){return '<div class="aviso"><b>Módulo cliente sin instalar.</b> Pagos, documentos, dudas, fotos y gastos se encienden cuando se publique <span class="mono">obra-app/motor/ObraCliente.gs</span> (instrucciones en <span class="mono">obra-app/motor/INSTALAR.md</span>).</div>';}

/* ════════════════ EQUIPO ════════════════ */
function tabsEquipo(folio,cur){
  if(!folio) return tabs([['Obras','▦','#/'],['Alta','＋','#/alta']],cur);
  var b='#/o/'+encodeURIComponent(folio);
  tabs([['Obras','▦','#/'],['Obra','◧',b],['Hoy','●',b+'/hoy'],['Cliente','◎',b+'/cliente'],['Alta','＋','#/alta']],cur);
}

function vPortafolio(){
  crumbs([['Obras','#/']]); tabsEquipo(null,'Obras');
  var obras=REG.obras;
  pinta('<h1>Mis obras</h1><p class="sub">'+obras.length+' obra'+(obras.length>1?'s':'')+' con motor · el avance lo calcula el sistema con lo autorizado.</p>'+
    '<div class="kpis" id="pk"></div><div class="stack" id="pl">'+obras.map(function(o){return '<div class="card" id="po_'+esc(o.folio)+'">'+esc(o.nombre)+' · cargando…</div>';}).join('')+'</div>'+
    '<div class="acc"><a class="btn" href="#/alta">＋ Dar de alta una obra</a></div>');
  var tot={frenos:0,firma:0,atraso:0};
  Promise.all(obras.map(function(o){
    return board(o).then(function(D){
      var g=C.global(D), us=C.unidades(D), cola=C.colaFirma(D), fr=us.reduce(function(s,u){return s+u.frenos;},0), T=tipoDe(o);
      var firma=cola.verificar.n+cola.autorizar.n, viejo=Math.max(cola.verificar.viejo,cola.autorizar.viejo);
      tot.frenos+=fr; tot.firma+=firma; if(viejo>=3||fr) tot.atraso++;
      $('#po_'+CSS.escape(o.folio)).outerHTML='<a class="card" style="text-decoration:none;display:block" href="#/o/'+encodeURIComponent(o.folio)+'">'+
        '<div class="row" style="padding-top:0"><div class="t"><span class="mono sub">'+esc(o.folio)+'</span><br><b>'+esc(o.nombre)+'</b><div class="sub">'+esc(T.nombre)+' · '+us.length+' '+esc(us.length===1?T.unidad.toLowerCase():T.unidades.toLowerCase())+'</div></div>'+
        '<div style="text-align:right"><b style="font-size:22px">'+pct(g.avance)+'</b><br>'+(fr?'<span class="pill p-b">'+fr+' freno'+(fr>1?'s':'')+'</span>':viejo>=3?'<span class="pill p-w">firma atrasada</span>':'<span class="pill p-ok">al día</span>')+'</div></div>'+
        bar(g.avance)+'<div class="sub" style="margin-top:6px">'+firma+' esperando firma'+(g.costeado?'':' · sin costear: avance por promedio')+'</div></a>';
    }).catch(function(e){var el=document.getElementById('po_'+o.folio);if(el) el.innerHTML='<b>'+esc(o.nombre)+'</b> · <span class="msg err">'+esc(razon(e))+'</span>';});
  })).then(function(){
    $('#pk').innerHTML=[[obras.length,'obras'],[tot.atraso,'necesitan atención'],[tot.frenos,'frenos abiertos'],[tot.firma,'esperando firma']]
      .map(function(k){return '<div class="kp"><b>'+k[0]+'</b><small>'+k[1]+'</small></div>';}).join('');
  });
}

function vObra(o){
  var T=tipoDe(o), base='#/o/'+encodeURIComponent(o.folio);
  crumbs([['Obras','#/'],[o.nombre,base]]); tabsEquipo(o.folio,'Obra'); cargando();
  board(o).then(function(D){
    var g=C.global(D), us=C.unidades(D), cola=C.colaFirma(D), yo=personaEn(D);
    var fr=us.reduce(function(s,u){return s+u.frenos;},0), listas=us.filter(function(u){return u.avance>=0.999;}).length;
    var mios=C.pendientes(D,yo.rol,yo.persona);
    pinta('<span class="mono sub">'+esc(o.folio)+' · '+esc(T.nombre)+'</span><h1>'+esc(o.nombre)+'</h1>'+
      '<div class="card hero" style="margin-top:10px"><small>Avance de la obra · lo calcula el sistema</small><div class="big">'+pct(g.avance)+'</div>'+bar(g.avance)+
      '<small style="display:block;margin-top:6px">'+(g.costeado?'Ponderado por importe: '+dinero(g.ejecutado)+' de '+dinero(g.importe):'Sin precios todavía: cada partida pesa igual')+'</small></div>'+
      '<div class="kpis">'+[[us.length,T.unidades.toLowerCase()],[listas,'terminadas'],[fr,'frenos'],[cola.verificar.n,'por verificar'],[cola.autorizar.n,'por autorizar']]
        .map(function(k){return '<div class="kp"><b>'+k[0]+'</b><small>'+k[1]+'</small></div>';}).join('')+'</div>'+
      (mios.length?'<div class="aviso">Te '+(mios.length===1?'toca 1 cosa':'tocan '+mios.length+' cosas')+' en esta obra. <a href="'+base+'/hoy"><b>Ver mi bandeja →</b></a></div>':'')+
      '<h2>'+esc(T.unidades)+'</h2><div class="unid">'+us.map(function(u){return '<a class="'+claseU(u)+'" href="'+base+'/u/'+encodeURIComponent(u.unidad)+'" title="'+esc(C.estado(u))+'">'+esc(u.unidad)+'<br>'+Math.round(u.avance*100)+'%</a>';}).join('')+'</div>'+
      '<p class="sub" style="margin-top:6px">Verde terminado · dorado en curso · gris sin empezar · rojo con freno</p>'+
      '<h2>Trabajo de campo</h2><div class="card"><p class="sub" style="margin-top:0">Capturar, firmar y planear la semana se hace en el motor de obra, con la misma cadena de siempre: '+
        '<b>captura → verifica → autoriza</b>.</p><div class="acc">'+
        '<a class="btn pri" href="'+esc(o.captura)+'#capturar">Capturar avance</a>'+
        '<a class="btn" href="'+esc(o.captura)+'#bandeja">Firmar</a>'+
        '<a class="btn" href="'+esc(o.captura)+'#semana">La semana</a>'+
        '<a class="btn" href="'+esc(o.captura)+'#frenos">Frenos y colados</a></div></div>'+
      '<h2>Cliente</h2><div id="cliRes"></div>');
    equipoCli(o.folio).then(function(E){
      if(!E){$('#cliRes').innerHTML=sinModulo();return;}
      var ab=E.dudas.filter(function(d){return d.estado==='ABIERTA';}).length, av=E.pagos.filter(function(p){return p.estado==='AVISADO';}).length;
      var gp=E.movimientos.filter(function(m){return m.estado==='PROPUESTO'||m.estado==='POR COMPROBAR';}).length, fp=E.fotos.filter(function(f){return String(f.autorizada).toUpperCase()!=='SI';}).length;
      $('#cliRes').innerHTML='<div class="kpis">'+[[E.clientes.length,'clientes con acceso'],[ab,'dudas abiertas'],[av,'pagos avisados'],[gp,'gastos por autorizar'],[fp,'fotos por autorizar']]
        .map(function(k){return '<div class="kp"><b>'+k[0]+'</b><small>'+k[1]+'</small></div>';}).join('')+'</div><a class="btn" href="'+base+'/cliente">Abrir el módulo cliente →</a>';
    }).catch(function(e){$('#cliRes').innerHTML='<p class="msg err">Módulo cliente: '+esc(razon(e))+'</p>';});
  }).catch(falla);
}

function vUnidad(o,unidad){
  var T=tipoDe(o), base='#/o/'+encodeURIComponent(o.folio);
  crumbs([['Obras','#/'],[o.nombre,base],[T.unidad+' '+unidad,'']]); tabsEquipo(o.folio,'Obra'); cargando();
  board(o).then(function(D){
    var u=C.unidades(D).find(function(x){return x.unidad===unidad;});
    if(!u){pinta('<div class="aviso">No existe «'+esc(unidad)+'» en esta obra.</div>');return;}
    var frenos=(D.restricciones||[]).filter(function(r){return r.frente===unidad&&String(r.estado||'ABIERTA').toUpperCase()!=='CERRADA';});
    pinta('<span class="mono sub">'+esc(C.folioUnidad(o.folio,unidad))+'</span><h1>'+esc(T.unidad+' '+unidad)+'</h1>'+
      '<div class="card hero"><small>Avance · calculado</small><div class="big">'+pct(u.avance)+'</div>'+bar(u.avance)+'<small style="display:block;margin-top:6px">'+
        (u.costeado?dinero(u.ejecutado)+' de '+dinero(u.importe):'Sin costear: promedio simple de '+u.n+' partidas')+'</small></div>'+
      (frenos.length?'<h2>Frenos</h2><div class="card">'+frenos.map(function(r){return '<div class="row"><div class="t"><b>'+esc(r.titulo)+'</b><div class="sub">'+esc(r.responsable||'sin responsable')+(r.compromiso?' · para '+esc(fecha(r.compromiso)):'')+'</div></div>'+espera(C.dias(r.fecha||r.creado))+'</div>';}).join('')+'</div>':'')+
      '<h2>Partidas</h2><div class="card">'+u.conceptos.map(function(c){var a=C.avanceDe([c]);
        return '<div class="row"><div class="t"><div style="display:flex;justify-content:space-between;gap:8px"><span>'+esc(String(c.descripcion).slice(0,90))+'</span><b>'+pct(a.avance)+'</b></div>'+bar(a.avance)+'</div></div>';}).join('')+'</div>'+
      '<div class="acc"><a class="btn pri" href="'+esc(o.captura)+'#capturar">Capturar avance</a><a class="btn" href="'+base+'/u/'+encodeURIComponent(unidad)+'/vista">Ver como cliente</a></div>');
  }).catch(falla);
}

function vHoy(o){
  var base='#/o/'+encodeURIComponent(o.folio);
  crumbs([['Obras','#/'],[o.nombre,base],['Hoy','']]); tabsEquipo(o.folio,'Hoy'); cargando();
  Promise.all([board(o),equipoCli(o.folio).catch(function(){return null;})]).then(function(r){
    var D=r[0],E=r[1],yo=personaEn(D),l=C.pendientes(D,yo.rol,yo.persona);
    if(E){
      E.dudas.filter(function(d){return d.estado==='ABIERTA';}).forEach(function(d){l.push({titulo:'Duda de cliente · '+d.unidad+': '+String(d.texto).slice(0,60),dias:C.dias(d.creado),link:base+'/cliente'});});
      if(E.autoriza){
        E.pagos.filter(function(p){return p.estado==='AVISADO';}).forEach(function(p){l.push({titulo:'Confirmar pago · '+p.unidad+' · '+dinero(p.importe),dias:C.dias(p.creado),link:base+'/cliente'});});
        E.movimientos.filter(function(m){return m.estado==='PROPUESTO';}).forEach(function(m){l.push({titulo:'Autorizar gasto · '+m.concepto+' · '+dinero(m.importe),dias:C.dias(m.creado),link:base+'/cliente'});});
      }
      E.movimientos.filter(function(m){return m.estado==='POR COMPROBAR';}).forEach(function(m){l.push({titulo:'Gasto sin comprobante · '+dinero(m.importe),dias:C.dias(m.creado),link:base+'/cliente'});});
      l.sort(function(a,b){return b.dias-a.dias;});
    }
    pinta('<span class="sub">'+esc(yo.persona||SES.nombre||SES.correo)+' · '+esc(yo.rol||'sin rol de firma')+'</span><h1>Te toca hoy</h1>'+
      (l.length?'<div class="card">'+l.map(function(x){return '<a class="row" style="text-decoration:none" href="'+(x.link||(o.captura+(x.tipo==='freno'?'#frenos':'#bandeja')))+'"><div class="t">'+esc(x.titulo)+(x.monto?'<div class="sub">'+dinero(x.monto)+'</div>':'')+'</div>'+espera(x.dias)+'</a>';}).join('')+'</div>'
        :'<p class="vacio">Nada esperándote. '+(yo.rol==='CAPTURA'?'Tu trabajo es capturar el avance con foto.':'')+'</p>')+
      '<p class="sub">Lo que lleva 3 días o más aparece en rojo y sube al inicio de Dirección en YOD OS.</p>'+
      '<div class="acc"><a class="btn pri" href="'+esc(o.captura)+'#capturar">＋ Capturar avance</a></div>');
  }).catch(falla);
}

/* ── módulo cliente, lado del equipo ── */
function vEquipoCliente(o){
  var base='#/o/'+encodeURIComponent(o.folio), T=tipoDe(o);
  crumbs([['Obras','#/'],[o.nombre,base],['Cliente','']]); tabsEquipo(o.folio,'Cliente');
  if(!REG.cliente){pinta('<h1>Módulo cliente</h1>'+sinModulo());return;}
  cargando();
  Promise.all([board(o),equipoCli(o.folio)]).then(function(r){
    var D=r[0],E=r[1],us=C.unidades(D).map(function(u){return u.unidad;});
    var opU=function(id,todas){return '<select id="'+id+'">'+(todas?'<option value="">Toda la obra</option>':'')+us.map(function(u){return '<option>'+esc(u)+'</option>';}).join('')+'</select>';};
    var partidas=[].concat.apply([],C.unidades(D).map(function(u){return u.conceptos.map(function(c){return c.descripcion;});})).filter(function(v,i,l){return l.indexOf(v)===i;});
    pinta('<h1>Módulo cliente</h1><p class="sub">Lo que ven los clientes de '+esc(o.nombre)+'. Solo sale lo autorizado.</p>'+
      '<h2>Dudas abiertas</h2><div class="card">'+(E.dudas.filter(function(d){return d.estado!=='CERRADA';}).map(function(d){
        return '<div class="row" style="align-items:flex-start"><div class="t"><b>'+esc(d.unidad)+'</b> · '+esc(d.texto)+(d.respuesta?'<div class="sub">↳ '+esc(d.respuesta)+'</div>':'')+
          '<div class="acc"><input id="rp_'+esc(d.id)+'" placeholder="Respuesta" style="flex:1;min-width:10rem;border:1px solid var(--line);border-radius:9px;padding:8px;background:var(--card)"><button class="btn" data-resp="'+esc(d.id)+'">Responder</button><button class="btn" data-cerr="'+esc(d.id)+'">Responder y cerrar</button></div></div>'+espera(C.dias(d.creado))+'</div>';}).join('')||'<p class="vacio">Sin dudas abiertas.</p>')+'</div>'+
      '<h2>Pagos</h2><div class="card">'+(E.pagos.map(function(p){
        return '<div class="row"><div class="t"><b>'+esc(p.unidad)+'</b> · '+esc(p.concepto)+'<div class="sub">'+dinero(p.importe)+' · vence '+esc(fecha(p.vence))+(p.comprobante?' · comprobante: '+esc(p.comprobante):'')+'</div></div>'+pill(p.estado)+
          (p.estado==='AVISADO'&&E.autoriza?'<button class="btn pri" data-pago="'+esc(p.id)+'">Confirmar</button>':'')+'</div>';}).join('')||'<p class="vacio">Sin pagos programados.</p>')+
        '<div class="form" style="margin-top:10px"><label class="field">'+esc(T.unidad)+opU('pgU')+'</label><label class="field">Concepto<input id="pgC" placeholder="Mensualidad 12"></label>'+
        '<label class="field">Importe<input id="pgI" type="number" min="0" step="0.01"></label><label class="field">Vence<input id="pgV" type="date"></label></div>'+
        '<div class="acc"><button class="btn" id="pgBtn">Programar pago</button><span class="msg" id="pgMsg"></span></div></div>'+
      '<h2>Gastos de obra</h2><div class="card">'+(E.movimientos.slice(-30).reverse().map(function(m){
        return '<div class="row"><div class="t">'+esc(m.concepto)+(m.factura?' · '+esc(m.factura):'')+'<div class="sub">'+esc(m.partida||'')+' · '+esc(fecha(m.fecha))+' · capturó '+esc(m.capturo)+'</div></div><b>'+dinero(m.importe)+'</b>'+pill(m.estado)+
          (m.estado==='PROPUESTO'&&E.autoriza?'<button class="btn pri" data-gasto="'+esc(m.id)+'">Autorizar</button>':'')+'</div>';}).join('')||'<p class="vacio">Sin gastos capturados.</p>')+
        '<div class="form" style="margin-top:10px"><label class="field">Partida<select id="gsP">'+partidas.map(function(p){return '<option>'+esc(p)+'</option>';}).join('')+'</select></label>'+
        '<label class="field">Concepto<input id="gsC" placeholder="Cemento y varilla"></label><label class="field">Factura<input id="gsF" placeholder="F-4820"></label>'+
        '<label class="field">Importe<input id="gsI" type="number" min="0" step="0.01"></label><label class="field">Fecha<input id="gsD" type="date"></label>'+
        '<label class="field">Liga al comprobante<input id="gsK" placeholder="https://drive…"></label></div>'+
        '<div class="acc"><button class="btn" id="gsBtn">Capturar gasto</button><span class="msg" id="gsMsg"></span></div></div>'+
      '<h2>Fotos</h2><div class="card"><div class="fotos">'+E.fotos.slice(-24).reverse().map(function(f){return '<a href="'+esc(f.url)+'" target="_blank" rel="noopener" title="'+esc((f.unidad||'obra')+' · '+(f.partida||''))+'"><img loading="lazy" src="'+esc(f.url)+'" alt=""></a>';}).join('')+'</div>'+
        (E.fotos.filter(function(f){return String(f.autorizada).toUpperCase()!=='SI';}).map(function(f){return '<div class="row"><div class="t">'+esc(f.unidad||'obra')+' · '+esc(f.partida||'')+' · subió '+esc(f.subio)+'</div>'+(E.autoriza?'<button class="btn pri" data-foto="'+esc(f.id)+'">Autorizar</button>':pill('POR REVISAR'))+'</div>';}).join(''))+
        '<div class="form" style="margin-top:10px"><label class="field">'+esc(T.unidad)+opU('ftU',true)+'</label><label class="field">Partida<select id="ftP">'+partidas.map(function(p){return '<option>'+esc(p)+'</option>';}).join('')+'</select></label>'+
        '<label class="field">Foto<input id="ftF" type="file" accept="image/*" capture="environment"></label><label class="field">Nota<input id="ftN"></label></div>'+
        '<div class="acc"><button class="btn" id="ftBtn">Subir foto</button><span class="msg" id="ftMsg"></span></div></div>'+
      '<h2>Documentos</h2><div class="card">'+(E.documentos.map(function(d){
        return '<div class="row"><div class="t"><a href="'+esc(d.url)+'" target="_blank" rel="noopener">'+esc(d.titulo)+'</a><div class="sub">'+esc(d.categoria)+' · '+esc(d.unidad||'toda la obra')+(String(d.visible_cliente).toUpperCase()==='NO'?' · interno':'')+'</div></div>'+pill(d.estado)+
          (d.estado==='POR REVISAR'&&E.autoriza?'<button class="btn" data-doc="'+esc(d.id)+'">Aprobar</button>':'')+'</div>';}).join('')||'<p class="vacio">Sin documentos.</p>')+
        '<div class="form" style="margin-top:10px"><label class="field">Categoría<select id="dcC">'+E.categorias.map(function(c){return '<option>'+esc(c)+'</option>';}).join('')+'</select></label>'+
        '<label class="field">'+esc(T.unidad)+opU('dcU',true)+'</label><label class="field">Título<input id="dcT"></label><label class="field">Liga (Drive)<input id="dcL" placeholder="https://drive…"></label>'+
        '<label class="field">¿Lo ve el cliente?<select id="dcV"><option value="1">Sí</option><option value="0">No, es interno</option></select></label></div>'+
        '<div class="acc"><button class="btn" id="dcBtn">Agregar documento</button><span class="msg" id="dcMsg"></span></div></div>'+
      '<h2>Clientes con acceso</h2><div class="card">'+(E.clientes.map(function(c){return '<div class="row"><div class="t"><b>'+esc(c.nombre||c.correo)+'</b><div class="sub">'+esc(c.correo)+'</div></div><span class="mono">'+esc(C.folioUnidad(c.folio,c.unidad))+'</span></div>';}).join('')||'<p class="vacio">Nadie todavía.</p>')+
        (E.autoriza?'<div class="form" style="margin-top:10px"><label class="field">Nombre<input id="clN"></label><label class="field">Correo (Google)<input id="clC" type="email"></label><label class="field">'+esc(T.unidad)+opU('clU')+'</label></div>'+
        '<div class="acc"><button class="btn" id="clBtn">Dar acceso</button><span class="msg" id="clMsg"></span></div><p class="sub">El correo también debe estar dado de alta en el Portero (Accesos) para poder entrar con Google.</p>':'')+'</div>'+
      '<div class="acc"><a class="btn" href="'+base+'/u/'+encodeURIComponent(us[0]||'')+'/vista">Ver la app como cliente →</a></div>');
    var recarga=function(){delete EQ[o.folio];vEquipoCliente(o);};
    var envia=function(msgId,cuerpo){var m=$(msgId);m.className='msg';m.textContent='Guardando…';
      return mandar(REG.cliente,Object.assign({folio:o.folio},cuerpo)).then(function(){m.className='msg ok';m.textContent='Listo.';setTimeout(recarga,600);})
        .catch(function(e){m.className='msg err';m.textContent=e&&e.duplicado?'Ya existe: '+e.duplicado.concepto+' · '+dinero(e.duplicado.importe)+' · '+fecha(e.duplicado.fecha)+'. No se guardó.':'No se pudo: '+razon(e);});};
    var enviaDirecto=function(btn,cuerpo){btn.disabled=true;mandar(REG.cliente,Object.assign({folio:o.folio},cuerpo)).then(recarga).catch(function(e){btn.disabled=false;btn.textContent='Error: '+razon(e);});};
    document.querySelectorAll('[data-resp],[data-cerr]').forEach(function(b){b.onclick=function(){var id=b.dataset.resp||b.dataset.cerr;
      enviaDirecto(b,{accion:'responder',id:id,respuesta:(document.getElementById('rp_'+id)||{}).value||'',cerrar:!!b.dataset.cerr});};});
    document.querySelectorAll('[data-pago]').forEach(function(b){b.onclick=function(){enviaDirecto(b,{accion:'pago',id:b.dataset.pago,estado:'RECIBIDO'});};});
    document.querySelectorAll('[data-gasto]').forEach(function(b){b.onclick=function(){enviaDirecto(b,{accion:'autorizar_gasto',id:b.dataset.gasto});};});
    document.querySelectorAll('[data-foto]').forEach(function(b){b.onclick=function(){enviaDirecto(b,{accion:'autorizar_foto',id:b.dataset.foto});};});
    document.querySelectorAll('[data-doc]').forEach(function(b){b.onclick=function(){enviaDirecto(b,{accion:'revisar_documento',id:b.dataset.doc});};});
    $('#pgBtn').onclick=function(){if(!Number($('#pgI').value)){$('#pgMsg').className='msg err';$('#pgMsg').textContent='Falta el importe.';return;}
      envia('#pgMsg',{accion:'pago',unidad:$('#pgU').value,concepto:$('#pgC').value,importe:$('#pgI').value,vence:$('#pgV').value});};
    $('#gsBtn').onclick=function(){var nuevo={factura:$('#gsF').value,importe:$('#gsI').value,fecha:$('#gsD').value||new Date().toISOString().slice(0,10),concepto:$('#gsC').value};
      var dup=C.gastoDuplicado(E.movimientos,nuevo);
      if(dup){$('#gsMsg').className='msg err';$('#gsMsg').textContent='Parece repetido: '+dup.concepto+' · '+dinero(dup.importe)+' · '+fecha(dup.fecha)+'. No se guardó.';return;}
      envia('#gsMsg',Object.assign({accion:'gasto',partida:$('#gsP').value,comprobante:$('#gsK').value},nuevo));};
    $('#dcBtn').onclick=function(){envia('#dcMsg',{accion:'documento',categoria:$('#dcC').value,unidad:$('#dcU').value,titulo:$('#dcT').value,url:$('#dcL').value,visible_cliente:$('#dcV').value==='1'});};
    $('#ftBtn').onclick=function(){var f=$('#ftF').files[0];if(!f){$('#ftMsg').className='msg err';$('#ftMsg').textContent='Escoge la foto.';return;}
      reduceFoto(f).then(function(data){return envia('#ftMsg',{accion:'foto',unidad:$('#ftU').value,partida:$('#ftP').value,nota:$('#ftN').value,data:data,mime:'image/jpeg',nombre:o.folio});});};
    if($('#clBtn')) $('#clBtn').onclick=function(){envia('#clMsg',{accion:'cliente',nombre:$('#clN').value,correo:$('#clC').value,unidad:$('#clU').value});};
  }).catch(falla);
}
/* la foto se achica a 1600 px antes de subir: una de celular pesa 5 MB, así pesa ~300 KB */
function reduceFoto(file){
  return new Promise(function(ok,no){var img=new Image(),u=URL.createObjectURL(file);
    img.onload=function(){var s=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',0.82));};
    img.onerror=function(){no('La foto no se pudo leer.');};img.src=u;});
}

/* ── alta de obra ── */
function vAlta(){
  crumbs([['Obras','#/'],['Alta de obra','']]); tabsEquipo(null,'Alta');
  pinta('<h1>Nueva obra</h1><p class="sub">Cualquier tipo de obra usa la misma estructura: folio → '+'unidades → partidas → avance.</p>'+
    '<div class="card stack"><div class="form"><label class="field">Nombre de la obra<input id="alN" placeholder="Real del Ruiseñor"></label>'+
    '<label class="field">Tipo<select id="alT">'+TIPOS.claves.map(function(k){return '<option value="'+k+'">'+esc(TIPOS.tipos[k].nombre)+'</option>';}).join('')+'</select></label></div>'+
    '<div id="alDup"></div>'+
    '<label class="field" id="alUL">Unidades<textarea id="alU"></textarea></label>'+
    '<label class="field">Partidas (una por línea)<textarea id="alP" style="min-height:8rem"></textarea></label>'+
    '<div class="acc"><button class="btn pri" id="alBtn">Armar la obra</button></div></div><div id="alOut"></div>');
  var ponTipo=function(){var T=TIPOS.tipo($('#alT').value);$('#alUL').firstChild.textContent=T.unidades+' (ej. «'+T.ejemplo+'», o rangos como C1..C15, separados por coma)';
    $('#alU').placeholder=T.ejemplo;$('#alP').value=T.partidas.join('\n');};
  $('#alT').onchange=ponTipo; ponTipo();
  $('#alN').oninput=function(){var v=$('#alN').value.trim();if(!v||!PRJ){$('#alDup').innerHTML='';return;}
    var ya=PRJ.buscar(v)||PRJ.lista.find(function(p){return PRJ.parecidas(v,p.nombre);});
    $('#alDup').innerHTML=ya?'<div class="aviso">Ya existe <b>'+esc(ya.nombre)+'</b> con folio <span class="mono">'+esc(ya.folio)+'</span>. Si es la misma obra, usa ese folio: no se da de alta dos veces.</div>':'';};
  $('#alBtn').onclick=function(){
    var nom=$('#alN').value.trim(),tipo=$('#alT').value,T=TIPOS.tipo(tipo),us=C.expandeUnidades($('#alU').value),ps=$('#alP').value.split('\n').map(function(s){return s.trim();}).filter(Boolean);
    if(!nom||!us.length||!ps.length){$('#alOut').innerHTML='<p class="msg err">Faltan nombre, '+esc(T.unidades.toLowerCase())+' o partidas.</p>';return;}
    var ya=PRJ&&(PRJ.buscar(nom)||PRJ.lista.find(function(p){return PRJ.parecidas(nom,p.nombre);}));
    var folio=ya?ya.folio:'PRJ-'+nom.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,20);
    var filas=C.plantilla(tipo,us,ps);
    var tsv=['id\tfrente\tdescripcion\tcantidad\tunidad\tprecio_unitario'].concat(filas.map(function(f){return [f.id,f.frente,f.descripcion,f.cantidad,f.unidad,f.precio_unitario].join('\t');})).join('\n');
    var reg="    { folio:'"+folio+"', nombre:'"+nom.replace(/'/g,"\\'")+"', tipo:'"+tipo+"',\n      motor:'PEGA-AQUI-EL-/exec-DE-SU-MOTOR',\n      captura:'../obra.html' },";
    $('#alOut').innerHTML='<h2>Lista para crear · <span class="mono">'+esc(folio)+'</span></h2>'+
      (ya?'':'<div class="aviso">Folio nuevo: agrégalo también a <span class="mono">os/proyectos.js</span> para que todo YOD OS lo reconozca.</div>')+
      '<div class="kpis">'+[[us.length,T.unidades.toLowerCase()],[ps.length,'partidas'],[filas.length,'renglones']].map(function(k){return '<div class="kp"><b>'+k[0]+'</b><small>'+k[1]+'</small></div>';}).join('')+'</div>'+
      '<div class="card stack"><b>1 · Copia el Sheet de obra</b><p class="sub" style="margin:0">Archivo → Hacer una copia del Sheet de obra con su script. Borra los renglones de CONCEPTOS y pega estos (con el precio de cada partida cuando lo tengas; sin precio, todas pesan igual):</p>'+
      '<pre class="copia" id="alTsv">'+esc(tsv)+'</pre><div class="acc"><button class="btn" data-copia="alTsv">Copiar renglones</button></div>'+
      '<b>2 · Publica su motor</b><p class="sub" style="margin:0">En el script de la copia: Implementar → Nueva implementación (es un script nuevo) → Aplicación web. Copia su /exec.</p>'+
      '<b>3 · Regístrala en YOD Obra</b><p class="sub" style="margin:0">Agrega este renglón a <span class="mono">obra-app/obras.js</span> con el /exec del paso 2:</p>'+
      '<pre class="copia" id="alReg">'+esc(reg)+'</pre><div class="acc"><button class="btn" data-copia="alReg">Copiar renglón</button></div></div>';
    document.querySelectorAll('[data-copia]').forEach(function(b){b.onclick=function(){var t=document.getElementById(b.dataset.copia).textContent;
      (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='Copiado ✓';}).catch(function(){var r=document.createRange();r.selectNodeContents(document.getElementById(b.dataset.copia));var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Seleccionado: copia con ⌘C';});};});
  };
}

/* ════════════════ CLIENTE ════════════════ */
var CLI={};  // folio|unidad → respuesta del módulo cliente
function tabsCliente(ctx,cur){
  var b='#/c/'+encodeURIComponent(ctx.folio)+'/'+encodeURIComponent(ctx.unidad);
  var l=[['Inicio','⌂',b],['Avance','◧',b+'/avance'],['Fotos','◉',b+'/fotos'],['Pagos','$',b+'/pagos'],['Docs','▤',b+'/docs'],['Dudas','?',b+'/dudas']];
  if(ctx.gastos) l.splice(4,0,['Gastos','≡',b+'/gastos']);
  tabs(l,cur);
}
function datosCliente(folio,unidad,fresco){
  var k=folio+'|'+unidad; if(CLI[k]&&!fresco) return Promise.resolve(CLI[k]);
  return pedir(REG.cliente,'recurso=cliente&folio='+encodeURIComponent(folio)+'&unidad='+encodeURIComponent(unidad)).then(function(d){CLI[k]=d;return d;});
}
/* el equipo puede ver la app del cliente sin módulo instalado: se arma con el motor de obra */
function datosVista(o,unidad){
  if(REG.cliente) return datosCliente(o.folio,unidad);
  return board(o).then(function(D){var v=C.vistaCliente(D,unidad);
    return {folio:o.folio,unidad:unidad,avance:v.unidad?{global:v.global.avance,unidad:v.unidad.avance,partidas:v.unidad.partidas}:null,
      pagos:[],documentos:[],dudas:[],fotos:[],gastos:null,entrega:'',camara:'',spei:{},_sinModulo:true};});
}

function vCliente(folio,unidad,sec,vista){
  var o=REG.porFolio(folio)||{folio:folio,nombre:folio,tipo:'otra'}, T=tipoDe(o);
  var b=vista?'#/o/'+encodeURIComponent(folio)+'/u/'+encodeURIComponent(unidad)+'/vista':'#/c/'+encodeURIComponent(folio)+'/'+encodeURIComponent(unidad);
  crumbs(vista?[['Obras','#/'],[o.nombre,'#/o/'+encodeURIComponent(folio)],['Vista del cliente · '+unidad,'']]:[[o.nombre+' · '+T.unidad+' '+unidad,'']]);
  cargando();
  (vista?datosVista(o,unidad):datosCliente(folio,unidad)).then(function(d){
    var ctx={folio:folio,unidad:unidad,gastos:!!d.gastos};
    if(vista) tabs(null); else tabsCliente(ctx,{'':'Inicio',avance:'Avance',fotos:'Fotos',pagos:'Pagos',docs:'Docs',dudas:'Dudas',gastos:'Gastos'}[sec||'']);
    var av=d.avance||{global:0,unidad:0,partidas:[]}, fu=C.folioUnidad(folio,unidad);
    var pend=d.pagos.filter(function(p){return p.estado!=='RECIBIDO';}).sort(function(a,b){return String(a.vence).localeCompare(String(b.vence));});
    var pagado=d.pagos.filter(function(p){return p.estado==='RECIBIDO';}).reduce(function(s,p){return s+Number(p.importe||0);},0);
    var total=d.pagos.reduce(function(s,p){return s+Number(p.importe||0);},0);
    var aviso=d._sinModulo?'<div class="aviso">Vista previa armada con el motor de obra. Pagos, fotos, documentos y dudas aparecen al instalar el módulo cliente.</div>':'';
    var H='';
    if(vista||!sec){
      H='<div class="sub">'+esc((YO&&YO.nombre)||'')+'</div><span class="mono sub">'+esc(fu)+'</span><h1>'+esc(o.nombre)+'</h1><div class="sub">'+esc(T.unidad+' '+unidad)+'</div>'+aviso+
        '<div class="card hero" style="margin-top:10px"><small>Avance de tu '+esc(T.unidad.toLowerCase())+'</small><div class="big">'+pct(av.unidad)+'</div>'+bar(av.unidad)+
        '<small style="display:block;margin-top:6px">Obra completa: '+pct(av.global)+(d.entrega?' · entrega estimada '+esc(fecha(d.entrega)):'')+' · solo cuenta lo autorizado</small></div>'+
        (d.camara?'<div class="acc"><a class="btn dark" href="'+esc(d.camara)+'" target="_blank" rel="noopener">● Ver cámara en vivo</a></div>':'')+
        (d.fotos.length?'<h2>Lo más reciente</h2><div class="fotos">'+d.fotos.slice(-6).reverse().map(fotoHTML).join('')+'</div>':'')+
        '<div class="kpis">'+[[pend[0]?dinero(pend[0].importe):'—','próximo pago'+(pend[0]?' · '+fecha(pend[0].vence):'')],[d.dudas.filter(function(x){return x.estado!=='CERRADA';}).length,'dudas abiertas'],[d.documentos.length,'documentos']]
          .map(function(k){return '<div class="kp"><b>'+k[0]+'</b><small>'+esc(k[1])+'</small></div>';}).join('')+'</div>';
      if(vista) H+=secAvance(av,T)+secPagos(d,pend,pagado,total,true)+secDocs(d);
    }
    else if(sec==='avance') H='<h1>Avance</h1>'+secAvance(av,T);
    else if(sec==='fotos') H='<h1>Fotos</h1>'+(d.camara?'<div class="acc"><a class="btn dark" href="'+esc(d.camara)+'" target="_blank" rel="noopener">● Cámara en vivo</a></div>':'')+
      (d.fotos.length?porSemana(d.fotos):'<p class="vacio">Aún no hay fotos autorizadas.</p>');
    else if(sec==='pagos') H='<h1>Pagos</h1>'+secPagos(d,pend,pagado,total,false);
    else if(sec==='docs') H='<h1>Documentos</h1>'+secDocs(d);
    else if(sec==='gastos') H='<h1>Gastos de obra</h1>'+secGastos(d);
    else if(sec==='dudas') H='<h1>Dudas</h1><div class="card">'+(d.dudas.slice().reverse().map(function(x){return '<div class="row" style="align-items:flex-start"><div class="t">'+esc(x.texto)+
      (x.respuesta?'<div class="aviso" style="margin-top:6px"><b>'+esc(x.respondio)+':</b> '+esc(x.respuesta)+'</div>':'')+'<div class="sub">'+esc(fecha(x.creado))+'</div></div>'+pill(x.estado)+'</div>';}).join('')||'<p class="vacio">No has preguntado nada todavía.</p>')+'</div>'+
      '<div class="card stack" style="margin-top:10px"><label class="field">Escribe tu duda<textarea id="duT"></textarea></label><div class="acc"><button class="btn pri" id="duBtn">Enviar</button><span class="msg" id="duMsg"></span></div><p class="sub" style="margin:0">Te contesta el equipo de obra. Cada duda tiene responsable y se cuentan los días.</p></div>';
    pinta(H);
    if($('#duBtn')) $('#duBtn').onclick=function(){var t=$('#duT').value.trim(),m=$('#duMsg');if(!t){m.className='msg err';m.textContent='Escribe tu duda.';return;}
      m.className='msg';m.textContent='Enviando…';mandar(REG.cliente,{accion:'duda',folio:folio,unidad:unidad,texto:t}).then(function(){datosCliente(folio,unidad,true).then(function(){vCliente(folio,unidad,'dudas');});})
        .catch(function(e){m.className='msg err';m.textContent='No se pudo: '+razon(e);});};
    document.querySelectorAll('[data-aviso]').forEach(function(bt){bt.onclick=function(){var id=bt.dataset.aviso,ref=(document.getElementById('av_'+id)||{}).value||'';
      if(!ref.trim()){bt.textContent='Escribe la referencia o liga del comprobante';return;}
      bt.disabled=true;mandar(REG.cliente,{accion:'aviso_pago',folio:folio,unidad:unidad,id:id,comprobante:ref,metodo:'SPEI'}).then(function(){datosCliente(folio,unidad,true).then(function(){vCliente(folio,unidad,'pagos');});})
        .catch(function(e){bt.disabled=false;bt.textContent='No se pudo: '+razon(e);});};});
    document.querySelectorAll('[data-copia]').forEach(function(bt){bt.onclick=function(){var t=bt.dataset.copia;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){bt.textContent='Copiado ✓';}).catch(function(){bt.textContent=t;});};});
  }).catch(falla);
}
function fotoHTML(f){return '<a href="'+esc(f.url)+'" target="_blank" rel="noopener" title="'+esc((f.partida||'')+' · '+(f.semana||fecha(f.creado)))+'"><img loading="lazy" src="'+esc(f.url)+'" alt="'+esc(f.partida||'foto de obra')+'"></a>';}
function porSemana(fotos){
  var g={};fotos.forEach(function(f){var k=f.semana||String(f.creado||'').slice(0,10);(g[k]=g[k]||[]).push(f);});
  return Object.keys(g).sort().reverse().map(function(k){return '<h2>'+esc(/^\d{4}-/.test(k)?fecha(k):'Semana '+k)+' · '+g[k].length+' foto'+(g[k].length>1?'s':'')+'</h2><div class="fotos">'+g[k].map(fotoHTML).join('')+'</div>';}).join('');
}
function secAvance(av,T){
  return '<h2>Avance por partida</h2><div class="card">'+(av.partidas.length?av.partidas.map(function(p){
    return '<div class="row"><div class="t"><div style="display:flex;justify-content:space-between;gap:8px"><span>'+esc(p.partida)+'</span><b>'+pct(p.avance)+'</b></div>'+bar(p.avance)+'</div></div>';}).join(''):'<p class="vacio">Sin partidas todavía.</p>')+
    '</div><p class="sub">El avance lo calcula el sistema con lo que el supervisor verificó y Dirección autorizó. Nadie lo escribe a mano.</p>';
}
function secPagos(d,pend,pagado,total,compacto){
  var sp=d.spei||{};
  return (compacto?'<h2>Pagos</h2>':'')+'<div class="card hero"><small>Saldo pendiente</small><div class="big" style="font-size:34px">'+dinero(total-pagado)+'</div>'+bar(total?pagado/total:0)+
    '<small style="display:block;margin-top:6px">Pagado '+dinero(pagado)+' de '+dinero(total)+'</small></div>'+
    (sp.clabe&&!compacto?'<div class="card" style="margin-top:10px"><b>Paga por transferencia (SPEI)</b><div class="row"><span>CLABE</span><button class="btn mono" data-copia="'+esc(sp.clabe)+'">'+esc(sp.clabe)+'</button></div>'+
      '<div class="row"><span>Beneficiario</span><b>'+esc(sp.beneficiario)+'</b></div><div class="row"><span>Referencia</span><button class="btn mono" data-copia="'+esc(sp.referencia)+'">'+esc(sp.referencia)+'</button></div>'+
      '<p class="sub" style="margin:6px 0 0">Después de pagar, avisa abajo con la referencia o la liga del comprobante. Se marca «recibido» cuando Dirección lo confirma.</p></div>':'')+
    '<h2>Calendario</h2><div class="card">'+(pend.map(function(p){return '<div class="row" style="flex-wrap:wrap"><div class="t"><b>'+esc(p.concepto)+'</b><div class="sub">vence '+esc(fecha(p.vence))+'</div></div><b>'+dinero(p.importe)+'</b>'+pill(p.estado)+
      (!compacto&&(p.estado==='PROGRAMADO'||p.estado==='PENDIENTE')?'<div class="acc" style="width:100%"><input id="av_'+esc(p.id)+'" placeholder="Referencia o liga del comprobante" style="flex:1;min-width:10rem;border:1px solid var(--line);border-radius:9px;padding:8px;background:var(--card)"><button class="btn pri" data-aviso="'+esc(p.id)+'">Ya pagué</button></div>':'')+'</div>';}).join('')||'<p class="vacio">Nada pendiente.</p>')+'</div>'+
    (compacto?'':'<h2>Historial</h2><div class="card">'+(d.pagos.filter(function(p){return p.estado==='RECIBIDO';}).reverse().map(function(p){return '<div class="row"><div class="t">'+esc(p.concepto)+'<div class="sub">'+esc(fecha(p.fecha_pago))+' · '+esc(p.metodo||'')+'</div></div><b>+'+dinero(p.importe)+'</b>'+pill('RECIBIDO')+'</div>';}).join('')||'<p class="vacio">Sin pagos registrados.</p>')+'</div>');
}
function secDocs(d){
  var cats=['Contratos','Planos','Cuentas T','Informes'];
  var ok=d.documentos.filter(function(x){return x.estado==='APROBADO';}).length;
  return '<h2>Documentos</h2><div class="card"><div class="row" style="padding-top:0"><b>Documentación revisada</b><b>'+(d.documentos.length?pct(ok/d.documentos.length):'—')+'</b></div>'+bar(d.documentos.length?ok/d.documentos.length:0)+'</div>'+
    cats.map(function(c){var l=d.documentos.filter(function(x){return x.categoria===c;});
      return '<h2>'+esc(c)+' <span class="sub">· '+l.length+'</span></h2><div class="card">'+(l.map(function(x){return '<div class="row"><a class="t" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.titulo)+'</a>'+pill(x.estado)+'</div>';}).join('')||'<p class="vacio">Nada aquí todavía.</p>')+'</div>';}).join('');
}
function secGastos(d){
  var g=d.gastos||[],tot=g.reduce(function(s,x){return s+Number(x.importe||0);},0),pre=Number(d.presupuesto)||0;
  var mes={};g.forEach(function(x){var k=String(x.fecha).slice(0,7);mes[k]=(mes[k]||0)+Number(x.importe||0);});
  var ks=Object.keys(mes).sort().slice(-6),mx=Math.max.apply(null,ks.map(function(k){return mes[k];}).concat([1]));
  return '<div class="card hero"><small>Total ejercido</small><div class="big" style="font-size:34px">'+dinero(tot)+'</div>'+(pre?bar(tot/pre)+'<small style="display:block;margin-top:6px">Presupuesto '+dinero(pre)+' · resta '+dinero(pre-tot)+'</small>':'')+'</div>'+
    (ks.length?'<h2>Por mes</h2><div class="card"><div style="display:flex;align-items:flex-end;gap:10px;height:120px">'+ks.map(function(k){return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end"><small class="mono">'+Math.round(mes[k]/1000)+'k</small><div style="width:100%;background:var(--gold);border-radius:5px 5px 0 0;height:'+(mes[k]/mx*80).toFixed(0)+'%"></div><small>'+esc(fecha(k+'-01').split(' ')[1]||k)+'</small></div>';}).join('')+'</div></div>':'')+
    '<h2>Movimientos</h2><div class="card">'+(g.slice().reverse().map(function(x){return '<div class="row"><div class="t">'+esc(x.concepto)+'<div class="sub">'+esc(x.partida||'')+' · '+esc(fecha(x.fecha))+'</div></div><b>-'+dinero(x.importe)+'</b></div>';}).join('')||'<p class="vacio">Sin gastos autorizados.</p>')+'</div>';
}

/* ════════════════ rutas ════════════════ */
function ruta(){
  var p=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);
  if(PERFIL==='cliente'){
    var us=(YO&&YO.unidades)||[];
    if(p[0]==='c'&&us.some(function(u){return u.folio===p[1]&&u.unidad===p[2];})) return vCliente(p[1],p[2],p[3]||'');
    if(us.length===1){location.replace('#/c/'+encodeURIComponent(us[0].folio)+'/'+encodeURIComponent(us[0].unidad));return;}
    crumbs([['Mis obras','']]);tabs(null);
    return pinta('<h1>Tus obras</h1><div class="stack">'+us.map(function(u){var o=REG.porFolio(u.folio)||{nombre:u.folio};
      return '<a class="card" style="text-decoration:none" href="#/c/'+encodeURIComponent(u.folio)+'/'+encodeURIComponent(u.unidad)+'"><b>'+esc(o.nombre)+'</b><div class="sub">'+esc(u.unidad)+'</div></a>';}).join('')+'</div>');
  }
  if(p[0]==='alta') return vAlta();
  if(p[0]==='o'&&p[1]){
    var o=REG.porFolio(p[1]); if(!o) return pinta('<div class="aviso">No hay obra con folio '+esc(p[1])+'.</div>');
    if(p[2]==='u'&&p[3]) return p[4]==='vista'?vCliente(o.folio,p[3],'',true):vUnidad(o,p[3]);
    if(p[2]==='hoy') return vHoy(o);
    if(p[2]==='cliente') return vEquipoCliente(o);
    return vObra(o);
  }
  if(p[0]==='c'&&p[1]&&p[2]) return vCliente(p[1],p[2],p[3]||'');
  return vPortafolio();
}

/* ════════════════ arranque ════════════════ */
function gate(msg){
  $('#app').hidden=true;$('#tabs').hidden=true;$('#gate').hidden=false;$('#gMsg').textContent=msg||'';
}
$('#gGoogle').onclick=function(){
  if(window.YODPortero&&window.YODPortero.entrar) window.YODPortero.entrar();
  else $('#gMsg').textContent='Cargando el acceso con Google… vuelve a tocar en un momento.';
};
function arranca(){
  if(!K) return gate('');
  canje().then(function(s){
    if(!s) return gate('No pudimos validar tu sesión. Entra con Google otra vez.');
    SES=s;
    var eq=window.YodAccessPolicy&&window.YodAccessPolicy.canOpen(s.boards,'SYS-OBRA',s.rol);
    var cli=REG.cliente?pedir(REG.cliente,'recurso=yo').catch(function(){return null;}):Promise.resolve(null);
    return cli.then(function(y){
      YO=y||{nombre:s.nombre,unidades:[]};
      PERFIL=eq?'equipo':(y&&y.perfil==='cliente')?'cliente':null;
      if(!PERFIL) return gate(REG.cliente?'Tu cuenta no tiene ninguna obra asignada. Pídele acceso a tu contacto en YOD.':'Tu acceso no incluye Obra. Pídeselo a Dirección.');
      $('#gate').hidden=true;$('#app').hidden=false;
      $('#who').innerHTML=esc(s.nombre||s.correo||'')+'<br>'+(PERFIL==='equipo'?'Equipo · <a href="../os/">YOD OS</a>':'Cliente');
      addEventListener('hashchange',ruta);ruta();
    });
  }).catch(function(){gate('Sin conexión. Revisa tu internet e inténtalo de nuevo.');});
}
arranca();
})();
