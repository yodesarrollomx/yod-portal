(function(){
  'use strict';

  var CATALOG_ENDPOINT='https://script.google.com/macros/s/AKfycby5LKYKRwl0EsNgppOIeD_ArST8vSXRgNO4ns8XZbFW4yjfglzu4io_vhabB8h-J792Tw/exec?action=read&resource=Portal';
  /* El portal validaba la sesión SIEMPRE contra el portero del dominio
     aurumarquitectos.com (hoy suspendido): aunque el gate ya te dejara pasar, el
     portal se quedaba en "Verificando Acceso…" para siempre. Ahora usa el mismo
     relevo que el resto del sistema: original primero, respaldo si falla. */
  var PORTERO_ORIGINAL='https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec';
  var PORTERO_RESPALDO='https://script.google.com/macros/s/AKfycbyrhqMb70Qh8BljAOYnSYBZ8IXUuEclFWPg10NWIv3GJ-nAR597OTsGB4IL-xyUl7Ms/exec';
  /* El ORIGINAL siempre primero; el respaldo solo si aquel falla en esta llamada.
     Antes el relevo se pegaba en localStorage y, al reactivarse Google, el
     navegador seguía en el respaldo (que no conoce correos ni login de Google). */
  try{localStorage.removeItem('pyod_portero');}catch(e){}
  function conLimite_(p,ms){return Promise.race([p,new Promise(function(_,rj){setTimeout(function(){rj(new Error('timeout'));},ms||LIMITE_MS);})]);}
  // El Portero (Apps Script) hoy tarda entre 3 y 25 s: esperar 12 s lo daba por muerto
  // y el OS se ponía «Sin conexión» con el backend vivo. 25 s + reintento en fondo.
  var LIMITE_MS=25000, REINTENTO_MS=15000, REINTENTOS_MAX=3;
  async function canjearConRelevo_(token){
    async function intenta(base){
      var r=await conLimite_(fetch(base+'?recurso=canje&t='+encodeURIComponent(token),{cache:'no-store',credentials:'omit'}));
      var raw=await r.text(); try{return JSON.parse(raw);}catch(e){return null;}
    }
    var d=null; try{ d=await intenta(PORTERO_ORIGINAL); }catch(e){ d=null; }
    if(!d||!d.ok){ try{ d=await intenta(PORTERO_RESPALDO); }catch(e){ d=null; } }
    return d;
  }
  var TOKEN_KEY='pyod_clave_v1';
  /* ENTRAR CON GOOGLE A LA SALA (3-sep): si el navegador no tiene la llave de la Sala,
     el OS canjea su propia sesión (el token del Portero) por la llave que corresponde
     al correo. El Sheet de la Sala le pregunta al Portero antes de entregar nada. */
  var SALA_GAS='https://script.google.com/macros/s/AKfycbx61UWsEYCL_dHzi0JrUv3GuAUFSDWW4iCmlNmbDDvWBIYY4Hhqkf6sYmt4d8UGIlk7MA/exec';
  var _pidiendoLlave=false;
  async function llaveDeSala_(){
    if(_pidiendoLlave) return null; _pidiendoLlave=true;
    try{
      var t=localStorage.getItem(TOKEN_KEY); if(!t) return null;
      var r=await fetch(SALA_GAS,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({accion:'canje_os',token:t})});
      var j=await r.json();
      if(!j||!j.ok) return null;
      localStorage.setItem('sala_gas',j.gas); localStorage.setItem('sala_clave',j.clave); localStorage.setItem('sala_rol',j.rol||'lector');
      var f=document.getElementById('embudoFrame');
      if(f&&/sala-edicion/.test(f.src||'')&&!/#gas=/.test(f.src||''))
        f.src=f.src.split('#')[0]+'#gas='+encodeURIComponent(j.gas)+'&clave='+encodeURIComponent(j.clave)+'&rol='+encodeURIComponent(j.rol||'lector');
      return j;
    }catch(_e){ return null } finally{ _pidiendoLlave=false }
  }
  var ICONS={
    'SYS-POTENCIALES':'map-2','SYS-TRACK':'route','SYS-MIRAMAR':'building-community',
    'SYS-TAREAS':'checklist','SYS-FLUJO':'wallet','SYS-INTERIORES':'armchair-2',
    'SYS-INVERSION':'presentation-analytics','SYS-MARKETING':'speakerphone','SYS-OBRA':'building-skyscraper'
  };
  // Versión corta del tablero embebido: se sube a mano cuando cambia tablero.html
  // (sin esto, el caché de 10 min de Pages servía el tablero viejo tras un deploy).
  var TABLERO_V='os2';
  var state={modules:[],rawRows:[],role:'vista',boards:'',profileReady:false,loading:false,opsScope:'mias',allTasks:[],sesionEpoch:0};
  var $=function(id){return document.getElementById(id);};
  // ¿hay clave guardada? distingue «sin sesión» de «sesión validándose»
  function hayToken(){try{return !!localStorage.getItem(TOKEN_KEY);}catch(_e){return false;}}
  // Higiene de sesión en equipos compartidos: purga los datos sensibles cacheados
  // (la lista de tareas de todos los responsables) y, al cerrar sesión, el token del Portero.
  var SENSITIVE_CACHES=['aurum-cache-v5','yod_ops_me','yod_pulse_v1','yod_portal_cat_v1','sala_clave','sala_gas','sala_rol','sala_cola'];
  // sesionEpoch: cada purga invalida las cargas en vuelo, para que una respuesta
  // que llegue tarde no vuelva a pintar (ni a cachear) datos de la sesión anterior.
  function purgarDatosSensibles(){state.sesionEpoch++;SENSITIVE_CACHES.forEach(function(k){try{localStorage.removeItem(k);}catch(_e){}});try{sessionStorage.removeItem('yod_id_v1');}catch(_e){}}

  /* ── Velocidad: pintar al instante con lo último conocido, refrescar en fondo ──
     El cuello era la cadena de esperas a Google: canje del portero (segundos)
     ANTES de enseñar nada, y luego cada tarjeta esperando su propio GAS.
     Ahora: la identidad validada se recuerda por pestaña (sessionStorage) y los
     resúmenes del Pulso se recuerdan en localStorage; se pintan de inmediato
     con su sello de edad y la consulta en vivo los reemplaza al llegar.
     Si el canje de fondo falla, se purga todo y se cierra (fail-closed). */
  // La identidad cacheada va FIRMADA con la huella del token (mismo criterio que
  // el portero): si cambias de clave en la misma pestaña, la caché ajena no se pinta.
  function huella(token){return String(token||'').slice(0,14);}
  function idCacheRead(token){try{var r=sessionStorage.getItem('yod_id_v1');if(!r)return null;var j=JSON.parse(r);if(!j||!j.rol)return null;return j.f===huella(token)?j:null;}catch(_e){return null;}}
  function idCacheWrite(d,token){try{sessionStorage.setItem('yod_id_v1',JSON.stringify({ok:true,f:huella(token),rol:d.rol||'vista',boards:d.boards||'',nombre:d.nombre||'',correo:d.correo||''}));}catch(_e){}}
  function pulseCacheRead(k){try{var j=JSON.parse(localStorage.getItem('yod_pulse_v1')||'{}');return (j[k]&&j[k].summary)?j[k]:null;}catch(_e){return null;}}
  function pulseCacheWrite(k,summary){try{var j=JSON.parse(localStorage.getItem('yod_pulse_v1')||'{}');j[k]={summary:summary,ts:Date.now()};localStorage.setItem('yod_pulse_v1',JSON.stringify(j));}catch(_e){}}
  function edadSello(ts){var m=Math.round((Date.now()-ts)/60000);return m<1?'de hace un momento':m<60?('de hace '+m+' min'):('de hace '+Math.round(m/60)+' h');}
  function marcarCache(panelId,ts){var p=$(panelId);if(!p)return;var n=document.createElement('small');n.className='pulse-cache-note';n.style.cssText='display:block;margin-top:8px;opacity:.6;font-size:11px';n.textContent='Datos '+edadSello(ts)+' · actualizando…';p.appendChild(n);}
  // Si la consulta en vivo falla y había caché, el sello deja de mentir con un
  // «actualizando…» que ya no está pasando: se conserva el dato con su edad real.
  function marcarCacheFallo(panelId){var p=$(panelId);if(!p)return;var n=p.querySelector('.pulse-cache-note');if(n)n.textContent=n.textContent.replace(' · actualizando…',' · no se pudo actualizar');}
  function cerrarSesion(){try{localStorage.removeItem(TOKEN_KEY);}catch(_e){}purgarDatosSensibles();try{location.reload();}catch(_e){location.href=location.pathname;}}

  function greeting(){var h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';}
  function timeLabel(date){return new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(date);}
  function edadTexto(ms){
    var m=Math.floor(ms/60000); if(m<2)return'hace un momento'; if(m<60)return'hace '+m+' min';
    var h=Math.floor(m/60); if(h<24)return'hace '+h+(h===1?' hora':' horas');
    var d=Math.floor(h/24); if(d<31)return'hace '+d+(d===1?' día':' días');
    var me=Math.floor(d/30); return'hace '+me+(me===1?' mes':' meses');
  }
  /* Antes decía "Hoy, 10:32" con la hora del NAVEGADOR: parecía recién actualizado
     aunque el Sheet llevara meses sin tocarse. Si la respuesta trae la fecha del
     dato, esa manda; si no, se dice claramente que es la hora de consulta. */
  function selloDato(data){
    var crudo=data&&(data.generated_at||data.updated_at||data.actualizado);
    if(crudo){
      var f=new Date(crudo);
      if(!isNaN(f)) return 'Datos del '+new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long'}).format(f)+
                            ' · '+edadTexto(Date.now()-f.getTime());
    }
    return 'Consultado a las '+timeLabel(new Date());
  }
  function setConnection(kind,text){var el=$('connection');el.className='connection '+kind;el.innerHTML='<i class="ti ti-'+(kind==='ok'?'cloud-check':kind==='error'?'cloud-off':'loader-2 spin')+'"></i> '+text;}
  function safeText(value){return String(value==null?'':value);}
  function initials(name){return safeText(name).split(/\s+/).filter(Boolean).slice(0,2).map(function(v){return v.charAt(0);}).join('').toUpperCase()||'YO';}
  function money(value){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(value)||0);}
  function percent(value){return new Intl.NumberFormat('es-MX',{style:'percent',maximumFractionDigits:0}).format(Number(value)||0);}

  function hrefDe(url){
    // el embudo se abre DENTRO del OS: su enlace es la propia ruta de la mascara
    return esEmbudo(url) ? '#/embudo/'+vistaDe(url) : url;
  }  function moduleNode(row){
    var url=hrefDe(window.PortalCore.resolveUrl(row));if(!url)return null;
    // Control Maestro gobierna la disponibilidad: si el estado no es Activo, la tarjeta
    // se muestra pero NO se convierte en enlace (antes siempre decía "Disponible" y abría).
    var on=window.PortalCore.enabled(row),b=window.PortalCore.badge(row);
    var link=document.createElement(on?'a':'div');link.className='module-card'+(on?'':' module-card-off');
    if(on){link.href=url;link.rel='noopener';}else{link.setAttribute('aria-disabled','true');}
    var top=document.createElement('div');top.className='module-top';
    var icon=document.createElement('span');icon.className='module-icon';icon.innerHTML='<i class="ti ti-'+(ICONS[row.system_id]||window.PortalCore.safeIcon(row.icono))+'"></i>';
    var status=document.createElement('span');status.className='module-state';status.textContent=on?'Disponible':b.text;top.append(icon,status);
    var title=document.createElement('h3');title.textContent=safeText(row.titulo_portal)||safeText(row.system_id);
    var desc=document.createElement('p');desc.textContent=safeText(row.descripcion_portal)||'Abrir espacio de trabajo.';
    var foot=document.createElement('footer');var audience=document.createElement('span');audience.textContent=safeText(row.audiencia)||'Equipo autorizado';var arrow=document.createElement('i');arrow.className='ti ti-arrow-up-right';foot.append(audience,arrow);
    link.append(top,title,desc,foot);return link;
  }


  function sidebarNode(row){
    var url=window.PortalCore.resolveUrl(row);if(!url)return null;
    var on=window.PortalCore.enabled(row);
    var a=document.createElement(on?'a':'span');a.className='nav-item'+(on?'':' nav-item-off');
    if(on){a.href=hrefDe(url);a.rel='noopener';}else{a.setAttribute('aria-disabled','true');}
    a.dataset.systemId=row.system_id;
    var i=document.createElement('i');i.className='ti ti-'+(ICONS[row.system_id]||window.PortalCore.safeIcon(row.icono));
    var s=document.createElement('span');s.textContent=safeText(row.titulo_portal)||safeText(row.system_id);
    a.append(i,s);return a;
  }

  /* ── Trampa de foco: una sola para la máscara y para el cajón móvil ──
     Sin esto, con Tab te salías del diálogo al menú y a la cabecera que quedan
     tapados detrás del velo. Devuelve la función que la suelta. */
  var FOCO_SEL='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';
  function trapFocus(container){
    if(!container)return function(){};
    function foco(){return Array.prototype.filter.call(container.querySelectorAll(FOCO_SEL),function(el){return el.offsetParent!==null||el===document.activeElement;});}
    function onKey(e){
      if(e.key!=='Tab')return;
      var f=foco();if(!f.length)return;
      var pri=f[0],ult=f[f.length-1],dentro=container.contains(document.activeElement);
      if(e.shiftKey&&(!dentro||document.activeElement===pri)){e.preventDefault();ult.focus();}
      else if(!e.shiftKey&&(!dentro||document.activeElement===ult)){e.preventDefault();pri.focus();}
    }
    document.addEventListener('keydown',onKey,true);
    return function(){document.removeEventListener('keydown',onKey,true);};
  }

  /* ══ Máscara del Embudo comercial ═══════════════════════════════════════
     Alejandro pidió que picarle NO lo saque del OS: una máscara de pantalla
     (como la revisión de decisiones) con la Sala de Edición lista para decidir.
     La Sala vive en el MISMO origen, así que entra con su sesión ya puesta. */
  // Las dos casas a la vez, a proposito: durante la mudanza la liga vieja sigue
  // llegando por el cascaron de redireccion y debe seguir contando como del embudo.
  var EMBUDO_URLS=['yodesarrollomx.github.io/aurum-board','yodesarrollomx.github.io/sala-edicion',
                   'yodesarrollomx.github.io/plan-potencial',
                   'tableros.yodesarrollo.mx/aurum-board','tableros.yodesarrollo.mx/sala-edicion',
                   'tableros.yodesarrollo.mx/plan-potencial',
                   'alexpueblag.github.io/aurum-board','alexpueblag.github.io/sala-edicion',
                   'alexpueblag.github.io/plan-potencial'];
  (function(){
    var mask=document.getElementById('embudoMask');if(!mask)return;
    var frame=document.getElementById('embudoFrame'),load=document.getElementById('embudoLoad'),
        tabs=document.getElementById('embudoTabs'),tit=document.getElementById('embudoMaskT'),
        abrir=document.getElementById('embudoAbrir'),pie=document.getElementById('embudoPie'),
        x=document.getElementById('embudoX'),ultimo=null,tOut=null,soltarFoco=null,vistaActual=null,
        bloqueado=false,mkPrev=null;
    var PIE={sala:'La Sala guarda en su Sheet — tus decisiones no se quedan aquí.',
             metricas:'Números del CRM y de Meta · el cuello del embudo se ve aquí.',
             ppp:'El imán de leads · así lo ve quien llega por tus publicaciones.'};
    var CARGANDO='<i class="ti ti-loader-2 spin" style="font-size:26px"></i><span>Abriendo…</span>';
    // Métricas del embudo es aurum-board (SYS-MARKETING): sin el código MK no se
    // carga el iframe. Fail-closed: mientras el canje no resuelve, tampoco abre.
    function mkOK(){return state.profileReady&&window.YodAccessPolicy.canOpen(state.boards,'SYS-MARKETING',state.role);}
    function ir(vista){
      var b=tabs.querySelector('[data-vista="'+vista+'"]');if(!b)return;
      tabs.querySelectorAll('.mask-tab').forEach(function(t){t.classList.toggle('on',t===b);});
      tit.textContent=b.dataset.t;pie.textContent=PIE[vista]||'';
      // «Abrir en pestaña aparte» debe abrir el tablero CON su marco: sin embed=1
      abrir.href=String(b.dataset.src||'').replace(/[?&]embed=1/,'').replace(/\?$/,'');
      clearTimeout(tOut);
      load.classList.remove('off');
      if(vista==='metricas'&&!mkOK()){
        bloqueado=true;frame.src='about:blank';   // se suelta el tablero anterior
        load.innerHTML='<i class="ti ti-shield-lock" style="font-size:26px"></i><span>Métricas del embudo no está incluida en los permisos de esta cuenta.</span>';
        return;
      }
      bloqueado=false;load.innerHTML=CARGANDO;
      // el iframe NO se refresca con Ctrl+Shift+R del OS: sin esto, Alejandro
      // veía versiones de la Sala de hace días aunque ya estuvieran corregidas
      // RELEVO DE LLAVE (3-sep): dentro de un marco, Safari puede darle al tablero
      // embebido un almacenamiento aparte; aunque él ya haya entrado, la Sala llega
      // sin llave. El OS (que sí la tiene, mismo origen) se la pasa por el #hash.
      var extra='';
      try{
        if(b.dataset.vista==='sala'){
          // UNA SOLA LLAVE: si la Sala no tiene la suya, va la credencial del OS.
          // El Sheet de la Sala la valida contra el Portero y decide el rol.
          var g=localStorage.getItem('sala_gas')||SALA_GAS;
          var k=localStorage.getItem('sala_clave')||localStorage.getItem(TOKEN_KEY);
          var r=localStorage.getItem('sala_rol');
          if(g&&k) extra='#gas='+encodeURIComponent(g)+'&clave='+encodeURIComponent(k)+(r?'&rol='+encodeURIComponent(r):'');
        }
      }catch(_e){}
      frame.src=b.dataset.src+(b.dataset.src.indexOf('?')>-1?'&':'?')+'cb='+Date.now()+extra;
      // si el marco nunca dispara «load», el velo dejaba «Abriendo…» para siempre
      tOut=setTimeout(function(){load.textContent='No cargó · usa «abrir» aquí arriba';},12000);
    }
    // La Sala avisa cuando abre una capa (expediente, zoom): el marco vuelve arriba
    // para que la capa no quede fuera de vista si el OS estaba scrolleado (3-sep).
    var ORIGEN_SALA='https://yodesarrollomx.github.io';
    window.addEventListener('message',function(ev){
      if(ev.origin!==ORIGEN_SALA) return;         // sin esto, cualquier página podía sembrar una llave
      try{ if(ev.data&&ev.data.tipo==='sala:llave'&&ev.data.gas&&ev.data.clave){
        localStorage.setItem('sala_gas',ev.data.gas); localStorage.setItem('sala_clave',ev.data.clave);
        if(ev.data.rol) localStorage.setItem('sala_rol',ev.data.rol);
      } }catch(_e){}
      try{ if(ev.data&&ev.data.tipo==='sala:arriba'){ mask.scrollTop=0; frame.scrollIntoView&&frame.scrollIntoView({block:'start'}); } }catch(_e){} });
    frame.addEventListener('load',function(){
      clearTimeout(tOut);
      if(bloqueado)return;               // el velo con el candado NO se destapa
      load.classList.add('off');
      // Esc sigue cerrando aunque el foco esté DENTRO del tablero embebido
      try{frame.contentDocument.addEventListener('keydown',function(e){if(e.key==='Escape'&&mask.classList.contains('open'))cerrar();});}catch(_e){}
    });
    var VISTAS={sala:1,metricas:1,ppp:1};
    function rutaCruda(){var m=/^#\/embudo\/([\w-]+)/.exec(location.hash||'');return m?m[1]:null;}
    function rutaDe(){var c=rutaCruda();return c&&VISTAS[c]?c:null;}
    // una subvista desconocida (#/embudo/loquesea) no deja la pantalla en blanco:
    // se corrige a #/embudo y se ve la sección de las tres puertas
    function normalizarHash(){var c=rutaCruda();if(c&&!VISTAS[c]){history.replaceState({},'','#/embudo');return true;}return false;}
    window.abrirEmbudo=function(vista,silencioso){
      vista=VISTAS[vista]?vista:'sala';
      var abierta=mask.classList.contains('open');
      if(abierta&&vistaActual===vista){if(window.pintarSeccionEmbudo)window.pintarSeccionEmbudo();return;}
      if(!abierta)ultimo=document.activeElement;
      mask.hidden=false;mask.classList.add('open');document.body.style.overflow='hidden';
      vistaActual=vista;
      ir(vista);if(!abierta)x.focus();
      if(!soltarFoco)soltarFoco=trapFocus(mask);
      // la mascara vive en la URL: el login de Google recarga la pagina y antes la mataba
      if(!silencioso&&rutaDe()!==vista) history.pushState({embudo:vista},'','#/embudo/'+vista);
      if(window.pintarSeccionEmbudo) window.pintarSeccionEmbudo();
    };
    function cerrar(silencioso){
      mask.classList.remove('open');mask.hidden=true;document.body.style.overflow='';
      clearTimeout(tOut);
      frame.src='about:blank';           // liberar el tablero al cerrar
      vistaActual=null;
      if(soltarFoco){soltarFoco();soltarFoco=null;}
      if(ultimo&&ultimo.focus)ultimo.focus();
      // NO te regresa al Inicio: te deja parado EN Embudo comercial
      // replaceState (no push): con pushState, «Atrás» resucitaba la máscara recién cerrada
      if(!silencioso) history.replaceState({},'','#/embudo');
      pintarSeccionEmbudo();
    }
    // el candado de Métricas se aplica también cuando la identidad llega tarde
    window.revisarPuertaEmbudo=function(){
      var ok=mkOK(),mt=tabs.querySelector('[data-vista="metricas"]');
      if(mt)mt.hidden=state.profileReady&&!ok;
      // solo se repinta cuando el permiso CAMBIÓ: si no, cada refresco recargaba el marco
      if(ok!==mkPrev&&mask.classList.contains('open')&&vistaActual==='metricas')ir('metricas');
      mkPrev=ok;
    };
    // la sección del embudo: tarjeta clara con las tres puertas, como las decisiones del día
    function pintarSeccionEmbudo(){
      var host=document.getElementById('seccionEmbudo'); if(!host) return;
      var enEmbudo=/^#\/embudo(\/|$)/.test(location.hash||'');
      host.hidden=!enEmbudo;
      document.querySelectorAll('.hero,.status-strip,#tablero,#pulso,#operacion,#modulos,#reconcile,#quick-section').forEach(function(sec){
        if(sec) sec.hidden=enEmbudo;
      });
      document.querySelectorAll('#nav-modules a').forEach(function(a){
        a.classList.toggle('activo', enEmbudo && /#\/embudo/.test(a.getAttribute('href')||''));
      });
      // Inicio deja de verse activo cuando estás en el Embudo
      var ini=document.querySelector('.nav-item[href="#inicio"],.nav-item[href="#"]');
      if(ini) ini.classList.toggle('nav-item-activo-off', enEmbudo);
      document.querySelectorAll('.sidebar .nav-item').forEach(function(a){
        if(/#inicio|^#$/.test(a.getAttribute('href')||'')) a.classList.toggle('activo-no', enEmbudo);
      });
      if(enEmbudo) window.scrollTo(0,0);
    }
    window.pintarSeccionEmbudo=pintarSeccionEmbudo;
    addEventListener('hashchange',pintarSeccionEmbudo);
    normalizarHash();
    pintarSeccionEmbudo();
    x.addEventListener('click',function(){cerrar()});
    addEventListener('popstate',function(){normalizarHash();var v=rutaDe();if(v)window.abrirEmbudo(v,true);else if(mask.classList.contains('open'))cerrar(true)});
    addEventListener('hashchange',function(){normalizarHash();var v=rutaDe();if(v)window.abrirEmbudo(v,true);else if(mask.classList.contains('open'))cerrar(true)});
    if(rutaDe()) window.abrirEmbudo(rutaDe(),true);   // arranque en frio: aterriza EN la mascara
    mask.addEventListener('click',function(e){if(e.target.hasAttribute('data-cerrar'))cerrar();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&mask.classList.contains('open'))cerrar();});
    tabs.addEventListener('click',function(e){var b=e.target.closest('.mask-tab');
      if(b){ir(b.dataset.vista);history.replaceState({embudo:b.dataset.vista},'','#/embudo/'+b.dataset.vista)}});
  })();
  function esEmbudo(href){return EMBUDO_URLS.some(function(u){return String(href||'').indexOf(u)>-1;});}
  // cada puerta del embudo aterriza en LO SUYO (antes las tres caían en la Sala)
  function vistaDe(h){h=String(h||'');return /aurum-board/.test(h)?'metricas':/plan-potencial/.test(h)?'ppp':'sala';}
  (function(){var box=document.getElementById('nav-modules');if(!box)return;
    // el refresco en fondo puede REEMPLAZAR el <a> entre el pointerdown y el
    // pointerup: el click muere en el contenedor. Se captura el destino al
    // bajar el dedo y se navega al soltarlo — el DOM ya no importa.
    var pendiente=null;
    function baja(e){var a=e.target.closest('a[href]');if(a)pendiente=a.href;}
    function sube(e){if(!pendiente)return;var h=pendiente;pendiente=null;e.preventDefault();
      if(esEmbudo(h)&&window.abrirEmbudo){window.abrirEmbudo(vistaDe(h));return;}
      location.assign(h);}
    box.addEventListener('pointerdown',baja);box.addEventListener('mousedown',baja);box.addEventListener('touchstart',baja,{passive:true});
    box.addEventListener('pointerup',sube);box.addEventListener('mouseup',sube);
    box.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;e.preventDefault();
      if(esEmbudo(a.href)&&window.abrirEmbudo){window.abrirEmbudo(vistaDe(a.href));return;}
      if(!pendiente)location.assign(a.href);});
  })();
  function renderSidebarModules(){
    var box=$('nav-modules');if(!box)return;box.replaceChildren();
    if(!state.profileReady){var h=document.createElement('span');h.className='nav-loading';h.textContent=hayToken()?'Validando tu acceso…':'Inicia sesión para ver tus tableros';box.appendChild(h);if(window.pintarSeccionEmbudo)window.pintarSeccionEmbudo();return;}
    if(!state.modules.length){var e=document.createElement('span');e.className='nav-loading';e.textContent='Sin tableros disponibles';box.appendChild(e);if(window.pintarSeccionEmbudo)window.pintarSeccionEmbudo();return;}
    state.modules.forEach(function(row){var n=sidebarNode(row);if(n)box.appendChild(n);});
    // el menú se repinta después del arranque en frío: sin esto, con #/embudo/sala
    // el lateral seguía marcando Inicio en vez de Embudo
    if(window.pintarSeccionEmbudo)window.pintarSeccionEmbudo();
  }

  var _lastModulesFirma='';
  function renderModules(rows){
    var grid=$('module-grid');
    var firmaRows=Array.isArray(rows)?rows:state.rawRows;
    // la firma lleva la fila COMPLETA: antes un cambio de estado/url/descripción en
    // el Sheet no repintaba (solo se firmaba id+título+url_override)
    var firma=state.profileReady+'|'+state.role+'|'+state.boards+'|'+JSON.stringify(firmaRows||[]);
    if(firma===_lastModulesFirma&&grid.children.length){state.rawRows=firmaRows;return;}
    _lastModulesFirma=firma;
    grid.replaceChildren();
    state.rawRows=Array.isArray(rows)?rows:state.rawRows;
    if(!state.profileReady){state.modules=[];var waiting=document.createElement('div');waiting.className='empty-state';waiting.textContent=hayToken()?'Validando tu acceso…':'Inicia sesión para consultar tus módulos autorizados.';grid.appendChild(waiting);grid.setAttribute('aria-busy','false');$('module-count').textContent='—';renderSidebarModules();return;}
    state.modules=window.PortalCore.cleanRows(state.rawRows).filter(function(row){return Boolean(window.PortalCore.resolveUrl(row))&&window.YodAccessPolicy.canOpen(state.boards,row.system_id,state.role);});
    state.modules.forEach(function(row){var node=moduleNode(row);if(node)grid.appendChild(node);});
    if(!grid.children.length){var empty=document.createElement('div');empty.className='empty-state';empty.textContent='No hay módulos disponibles en Control Maestro.';grid.appendChild(empty);}
    // el contador dice DISPONIBLES: los que están en mantenimiento/revisión no cuentan
    grid.setAttribute('aria-busy','false');$('module-count').textContent=String(state.modules.filter(window.PortalCore.enabled).length);renderSidebarModules();buildSearch('');
  }

  async function loadCatalog(){
    if(state.loading)return;state.loading=true;$('refresh').disabled=true;var _mr=$('mobile-refresh');if(_mr)_mr.disabled=true;setConnection('','Actualizando');
    var controller=new AbortController();var timeout=setTimeout(function(){controller.abort();},LIMITE_MS);
    try{
      var _tk='';try{_tk=localStorage.getItem(TOKEN_KEY)||'';}catch(_e){}
      var response=await fetch(CATALOG_ENDPOINT+(_tk?'&k='+encodeURIComponent(_tk):'')+'&cb='+Date.now(),{cache:'no-store',credentials:'omit',signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);var data=await response.json();
      if(!data.ok||!Array.isArray(data.rows))throw new Error('Respuesta incompleta');
      state.catRetry=0;renderModules(data.rows);nombrarAccionesRapidas();$('updated-at').textContent=selloDato(data);setConnection('ok','En línea');
      try{localStorage.setItem('yod_portal_cat_v1',JSON.stringify(data.rows));}catch(_e){}
    }catch(error){
      state.catRetry=(state.catRetry||0)+1;
      if(state.catRetry<=REINTENTOS_MAX){setConnection('error','Portero lento · reintentando');$('updated-at').textContent='Reintentando en fondo';setTimeout(loadCatalog,REINTENTO_MS);}
      else{setConnection('error','Sin conexión');$('updated-at').textContent='No se pudo actualizar';}
      if(!state.modules.length){var grid=$('module-grid');grid.setAttribute('aria-busy','false');grid.innerHTML='<div class="empty-state">Control Maestro no respondió. Por seguridad no se habilitaron enlaces. Intenta actualizar de nuevo.</div>';}
    }finally{clearTimeout(timeout);state.loading=false;$('refresh').disabled=false;var _mr2=$('mobile-refresh');if(_mr2)_mr2.disabled=false;}
  }

  /* ── El tablero cenital entra con los códigos de ESTA sesión ──
     Antes arrancaba solo (src fijo en el HTML) y enseñaba CRM, PPP, Miramar y
     Obra a quien no tiene esos códigos. Ahora el marco se monta hasta que el
     canje resuelve y le pasa boards/rol; el propio tablero apaga sus capas. */
  function montarTablero(){
    var f=$('board-frame'),aviso=$('board-locked');if(!f)return;
    var base=f.getAttribute('data-src')||'../tablero.html?embed=1';
    var url=base+(base.indexOf('?')>-1?'&':'?')+'boards='+encodeURIComponent(state.boards)+
            '&rol='+encodeURIComponent(state.role)+'&v='+TABLERO_V;
    if(f.getAttribute('src')!==url)f.setAttribute('src',url);
    f.hidden=false;if(aviso)aviso.classList.add('hidden');
  }
  function tableroSinSesion(){
    var f=$('board-frame'),aviso=$('board-locked'),t=$('board-locked-t');if(!f)return;
    f.removeAttribute('src');f.hidden=true;
    if(t)t.textContent='Inicia sesión para ver el tablero.';
    if(aviso)aviso.classList.remove('hidden');
  }
  function applyIdentity(data){
    state.role=String(data.rol||'vista').toLowerCase();state.boards=data.boards||'';state.profileReady=true;
    state.personName=String(data.nombre||'').trim();
    var name=data.nombre||data.correo||'Equipo YOD';$('user-name').textContent=name;$('user-role').textContent=state.role;$('avatar').textContent=initials(name);$('first-name').textContent=name.split(/\s|@/)[0];$('access-status').textContent=state.role==='admin'?'Dirección':'Autorizado';
    var persona=state.role==='admin'?'direccion':'colaborador';
    document.documentElement.setAttribute('data-persona',persona);
    var chip=$('role-chip');chip.className='role-chip '+persona;chip.textContent=persona==='direccion'?'Dirección':'Colaborador';
    $('user-role').textContent=persona==='direccion'?'Dirección':'Colaborador';
    if(persona==='direccion'){$('hero-eyebrow').textContent='Centro de operación';$('hero-copy').textContent='Un solo acceso para entrar a la operación completa, sin mover ni duplicar la información de tus tableros.';}
    else{$('hero-eyebrow').textContent='Tu espacio de trabajo';$('hero-copy').textContent='Tus módulos y tus pendientes de la semana, en un solo lugar. Abre lo que necesites.';}
    document.querySelectorAll('.admin-only').forEach(function(el){el.classList.toggle('hidden',state.role!=='admin');});
    var visibleQuick=0;document.querySelectorAll('.quick-card[data-system-id]').forEach(function(el){var allowed=window.YodAccessPolicy.canOpen(state.boards,el.dataset.systemId,state.role);el.classList.toggle('hidden',!allowed);if(allowed)visibleQuick++;});$('quick-section').classList.toggle('hidden',visibleQuick===0);
    nombrarAccionesRapidas();
    // «Abrir tablero completo» de Operación semanal: sin el código TA, el encabezado
    // se queda (sostiene el mensaje de candado) pero la liga viva desaparece
    var opLink=document.querySelector('#operacion .section-link');
    if(opLink)opLink.classList.toggle('hidden',!window.YodAccessPolicy.canOpen(state.boards,'SYS-TAREAS',state.role));
    montarTablero();
    if(window.revisarPuertaEmbudo)window.revisarPuertaEmbudo();
    if(state.rawRows.length)renderModules(state.rawRows);
  }
  // OTROS-6: las Acciones rápidas se llaman como el catálogo del Sheet (MOAC, PPP…);
  // si la fila aún no llegó, se conserva el texto que trae el HTML.
  function nombrarAccionesRapidas(){
    var filas=window.PortalCore.cleanRows(state.rawRows||[]);
    document.querySelectorAll('.quick-card[data-system-id]').forEach(function(el){
      var id=el.dataset.systemId,fila=null;
      filas.some(function(r){if(String(r.system_id||'')===id){fila=r;return true;}return false;});
      var t=fila&&String(fila.titulo_portal||'').trim();
      var strong=el.querySelector('strong');
      if(t&&strong)strong.textContent=t;
    });
  }
  function startData(token){
    var requests=[loadPulse(token)];
    if(window.YodAccessPolicy.hasCode(state.boards,'TA')||state.role==='admin')requests.push(loadOperations(token));else renderOperationsLocked();
    return Promise.allSettled(requests);
  }
  // El diagnóstico técnico del canje se traduce a una frase corta en español.
  var FRASE_CANJE={'canje:clave':'Acceso vencido · vuelve a entrar','canje:liga':'Acceso vencido · vuelve a entrar',
                   'canje:revocado':'Acceso retirado · pídelo de nuevo','canje:expirado':'Acceso vencido · vuelve a entrar',
                   'canje:sin-respuesta':'Google no contestó · toca ⟳','canje:timeout':'Google no contestó · toca ⟳'};
  function frasePendiente(d){return FRASE_CANJE[d]||'Sin validar · toca ⟳';}
  async function loadIdentity(){
    var token='';try{token=localStorage.getItem(TOKEN_KEY)||'';}catch(_error){}
    if(!token){
      purgarDatosSensibles();$('access-status').textContent='Requiere acceso';
      // sin esto el lateral decía «Verificando acceso…» para siempre y Operación
      // se quedaba dando vueltas con un spinner que ya no espera nada
      $('user-role').textContent='Sin sesión';
      renderOperationsSinSesion();tableroSinSesion();
      state.profileReady=false;renderModules(state.rawRows);return;
    }
    // 1) Pintar YA con la identidad validada de esta pestaña (si existe) y
    //    arrancar los datos en paralelo — sin esperar el canje de Google.
    var cached=idCacheRead(token),arrancado=false;
    if(cached){console.info('[YOD OS] pintado instantáneo desde caché de pestaña; canje revalidando en fondo');applyIdentity(cached);arrancado=true;startData(token);}
    // 2) Revalidar el canje en fondo; si cambió algo se re-aplica, si falla se cierra.
    try{
      var data=await canjearConRelevo_(token);
      if(!data||!data.ok){var diag='canje:'+((data&&data.error)||'sin-respuesta');console.warn('[YOD OS] canje falló →',diag);var e2=new Error(diag);e2._diag=diag;throw e2;}
      try{localStorage.removeItem('yod_canje_fail');}catch(_e){}
      idCacheWrite(data,token);state.canjeRetry=0;
      var cambio=!cached||cached.rol!==(data.rol||'vista')||String(cached.boards||'')!==String(data.boards||'');
      if(cambio)applyIdentity(data);
      if(!arrancado)await startData(token);
      else if(cambio)startData(token);
    }catch(err){
      var d=(err&&err._diag)||'error';
      // Portero LENTO (no rechazo): si esta pestaña ya validó, se queda pintada y se
      // reintenta en fondo; purgar aquí cerraba la sesión con el backend vivo.
      var LENTO={'canje:sin-respuesta':1,'canje:timeout':1,'error':1};
      if(LENTO[d]&&cached){state.canjeRetry=(state.canjeRetry||0)+1;
        if(state.canjeRetry<=REINTENTOS_MAX){setConnection('error','Portero lento · reintentando');console.warn('[YOD OS] canje lento ('+state.canjeRetry+'/'+REINTENTOS_MAX+') — se conserva la identidad de la pestaña y se reintenta en '+(REINTENTO_MS/1000)+' s');setTimeout(loadIdentity,REINTENTO_MS);return;}
      }
      purgarDatosSensibles();state.profileReady=false;
      // token RECHAZADO por el portero (no timeout): soltarlo y mostrar la puerta.
      // Sin esto, un relevo muerto deja el OS en «Validando…» para siempre.
      // Un rechazo PUEDE ser pasajero (carrera entre portero y relevo). Sólo se
      // suelta la sesión tras 3 rechazos seguidos; cualquier canje bueno borra la cuenta.
      var MUERTO={'canje:clave':1,'canje:liga':1,'canje:revocado':1,'canje:expirado':1};
      if(MUERTO[d]){
        var n=0;try{n=(parseInt(localStorage.getItem('yod_canje_fail')||'0',10)||0)+1;localStorage.setItem('yod_canje_fail',String(n));}catch(_e){}
        if(n>=3){try{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem('yod_canje_fail');sessionStorage.removeItem('yod_id_v1');}catch(_e){}
          console.warn('[YOD OS] token rechazado 3 veces seguidas — se suelta y se pide acceso');
          location.reload();return;}
        console.warn('[YOD OS] canje rechazado ('+n+'/3) — la sesión se conserva por si es pasajero');
      }
      // La tira de estado la lee Alejandro, no un técnico: el código queda en el title
      $('user-role').textContent='Sesión por validar';$('access-status').textContent=frasePendiente(d);$('access-status').title='Diagnóstico del canje: '+d+' — revisa la consola para el detalle.';console.warn('[YOD OS] identidad no validada:',d,err);
      if(arrancado){renderModules([]);$('pulso').classList.add('hidden');renderOperationsLocked();tableroSinSesion();}
    }
  }

  function renderOperationsLocked(){var panel=$('operation-panel');panel.setAttribute('aria-busy','false');panel.innerHTML='<div class="operation-message"><i class="ti ti-shield-lock"></i><span>Operación semanal no está incluida en los permisos de esta cuenta.</span></div>';}
  function renderOperationsSinSesion(){var panel=$('operation-panel');if(!panel)return;panel.setAttribute('aria-busy','false');panel.innerHTML='<div class="operation-message"><i class="ti ti-lock"></i><span>Inicia sesión para ver tus tareas.</span></div>';}

  // Conciliación de identidad (solo Dirección): cruza los responsables del board
  // contra las personas de Accesos, para cazar los "cruces" — nombres del board
  // que no corresponden a ninguna cuenta, y personas sin tareas a su nombre.
  async function loadReconcile(token){
    var section=$('reconcile');if(!section)return;
    try{
      var url=PORTERO_ORIGINAL+'?recurso=accesos-lista&k='+encodeURIComponent(token)+'&cb='+Date.now();
      var resp=await fetch(url,{cache:'no-store',credentials:'omit'});var data=await resp.json();
      if(!data||!data.ok||!Array.isArray(data.usuarios))return;
      var personas=data.usuarios.filter(function(u){return String(u.estado||'').toLowerCase()==='activo';});
      var tasks=state.allTasks||[];
      var responsables=[];var vistos={};
      tasks.forEach(function(t){var r=String(t&&t.responsable||'').trim();if(r&&!vistos[r.toLowerCase()]){vistos[r.toLowerCase()]=1;responsables.push(r);}});
      // Responsables del board sin cuenta en Accesos
      var huerfanos=responsables.filter(function(r){return !personas.some(function(p){return window.YodOperations.isMine(r,p.nombre||p.correo);});});
      // Personas de Accesos (con TA) sin ninguna tarea a su nombre
      var conTA=personas.filter(function(p){var b=String(p.boards||'');return b.trim()==='*'||b.toUpperCase().split(/[,;| ]+/).indexOf('TA')>-1||String(p.rol||'').toLowerCase()==='admin';});
      var sinTareas=conTA.filter(function(p){return !responsables.some(function(r){return window.YodOperations.isMine(r,p.nombre||p.correo);});});
      renderReconcile(huerfanos,sinTareas,responsables.length,personas.length);
    }catch(e){/* silencioso: es una ayuda, no debe romper la home */}
  }
  function renderReconcile(huerfanos,sinTareas,nResp,nPers){
    var section=$('reconcile'),panel=$('reconcile-panel');if(!section||!panel)return;
    if(!huerfanos.length&&!sinTareas.length){
      section.classList.remove('hidden');
      panel.innerHTML='<div class="reconcile-ok"><i class="ti ti-circle-check"></i><span>Todo cuadra: los '+nResp+' responsables del tablero corresponden a personas en Accesos.</span></div>';
      return;
    }
    section.classList.remove('hidden');panel.replaceChildren();
    if(huerfanos.length){
      var b1=document.createElement('div');b1.className='reconcile-block warn';
      b1.innerHTML='<h3><i class="ti ti-alert-triangle"></i> Nombres en el tablero sin cuenta en Accesos</h3><p>Estas personas aparecen como «responsable» en tareas, pero su nombre no coincide con nadie en Accesos. No verán sus tareas en su resumen hasta que el nombre coincida (o se den de alta).</p>';
      var ul=document.createElement('div');ul.className='reconcile-chips';
      huerfanos.forEach(function(n){var c=document.createElement('span');c.className='reconcile-chip';c.textContent=n;ul.appendChild(c);});
      b1.appendChild(ul);panel.appendChild(b1);
    }
    if(sinTareas.length){
      var b2=document.createElement('div');b2.className='reconcile-block';
      b2.innerHTML='<h3><i class="ti ti-user-off"></i> Personas con acceso a Operación sin tareas a su nombre</h3><p>Tienen el tablero, pero no hay tareas donde el «responsable» coincida con su nombre. Puede ser normal, o que el nombre esté escrito distinto en el tablero.</p>';
      var ul2=document.createElement('div');ul2.className='reconcile-chips';
      sinTareas.forEach(function(p){var c=document.createElement('span');c.className='reconcile-chip muted';c.textContent=p.nombre||p.correo;ul2.appendChild(c);});
      b2.appendChild(ul2);panel.appendChild(b2);
    }
  }

  function taskDueLabel(task){var days=window.YodOperations.daysUntil(task);if(days==null)return {text:'Sin fecha',overdue:false};if(days<0)return {text:Math.abs(days)+' d vencida',overdue:true};if(days===0)return {text:'Vence hoy',overdue:false};return {text:'En '+days+' d',overdue:false};}
  function renderOperations(result){
    var panel=$('operation-panel'),summary=result.summary;panel.replaceChildren();panel.setAttribute('aria-busy','false');
    // Toggle: el resumen es TUYO por defecto (para todos, incluida Dirección); «Equipo» muestra todo.
    var scope=result.scope||'mias';
    var toggle=document.createElement('div');toggle.className='ops-scope';
    toggle.innerHTML='<button type="button" data-scope="mias" class="'+(scope==='mias'?'on':'')+'">Mis tareas</button><button type="button" data-scope="equipo" class="'+(scope==='equipo'?'on':'')+'">Todo el equipo</button>';
    toggle.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){if(state.opsScope===b.dataset.scope)return;state.opsScope=b.dataset.scope;renderOpsScoped(state._opsSource,state._opsUpdatedAt);});});
    panel.appendChild(toggle);
    // "Soy: [nombre]" — elige tu nombre del tablero para que el resumen sea tuyo.
    // Útil cuando entras como propietario/clave maestra (aún sin nombre personal).
    if(scope==='mias'&&(result.responsables||[]).length){
      var cur=result.personName||'';
      var opts=result.responsables.map(function(r){var me=window.YodOperations.isMine(r,cur);return '<option'+(me?' selected':'')+'>'+String(r).replace(/[&<>"]/g,'')+'</option>';}).join('');
      var who=document.createElement('div');who.className='ops-whoami'+(result.personGeneric?' ask':'');
      who.innerHTML='<i class="ti ti-user-circle"></i><span>Soy</span><select class="ops-whoami-sel" aria-label="Tu nombre en el tablero"><option value="">— elige tu nombre —</option>'+opts+'</select>';
      var sel=who.querySelector('select');
      sel.addEventListener('change',function(){try{if(sel.value)localStorage.setItem('yod_ops_me',sel.value);else localStorage.removeItem('yod_ops_me');}catch(e){}renderOpsScoped(state._opsSource,state._opsUpdatedAt);});
      panel.appendChild(who);
    }
    if(result.source==='cache'){var note=document.createElement('div');note.className='operation-note';note.innerHTML='<i class="ti ti-history"></i><span>Mostrando el último resumen guardado en este dispositivo. La consulta en vivo no respondió; abre el tablero para reintentar.</span>';panel.appendChild(note);}
    var metrics=document.createElement('div');metrics.className='operation-metrics';[['Abiertas',summary.open],['Vencidas',summary.overdue],['Próximos 7 días',summary.dueSoon],['En revisión',summary.review]].forEach(function(item){var box=document.createElement('div');box.className='operation-metric';var label=document.createElement('span');label.textContent=item[0];var value=document.createElement('strong');value.textContent=String(item[1]);box.append(label,value);metrics.appendChild(box);});panel.appendChild(metrics);
    var list=document.createElement('div');list.className='task-list';summary.priority.forEach(function(task){var row=document.createElement('div');row.className='task-row';var title=document.createElement('div');title.className='task-title';var strong=document.createElement('strong');strong.textContent=task.actividad||task.entregable||'Tarea sin título';var project=document.createElement('small');project.textContent=task.proyecto||task.empresa||'Sin proyecto';title.append(strong,project);var person=document.createElement('span');person.className='task-person';person.textContent=task.responsable||'Sin responsable';var status=document.createElement('span');status.className='task-status';status.textContent=window.YodOperations.normalizeStatus(task.estado);var dueInfo=taskDueLabel(task);var due=document.createElement('span');due.className='task-due'+(dueInfo.overdue?' overdue':'');due.textContent=dueInfo.text;row.append(title,person,status,due);list.appendChild(row);});
    if(!summary.priority.length){
      var empty=document.createElement('div');empty.className='operation-message';
      if(result.mine&&summary.total===0){
        empty.innerHTML='<i class="ti ti-user-question"></i><span>No encontramos tareas a tu nombre'+(result.totalEquipo?(' (el equipo tiene '+result.totalEquipo+'). Si esperabas ver las tuyas, revisa que tu nombre en Accesos coincida con el de «responsable» en el tablero.'):'.')+'</span>';
      }else if(result.mine){
        empty.textContent='No tienes tareas abiertas. Todo al día.';
      }else{
        empty.textContent='No hay tareas abiertas que requieran atención.';
      }
      list.appendChild(empty);
    }panel.appendChild(list);
  }
  // Quién soy para el filtro: un nombre elegido a mano (guardado en el dispositivo)
  // gana sobre el del canje. Sirve cuando entras como propietario/clave maestra y
  // el Portero aún no devuelve tu nombre real.
  function myName(){ try{ var o=localStorage.getItem('yod_ops_me'); if(o) return o; }catch(e){} return state.personName||''; }
  function nameIsGeneric(n){ n=String(n||'').toLowerCase(); return !n||n==='propietario'||n==='clave maestra'; }
  function uniqueResponsables(tasks){ var out=[],seen={}; (tasks||[]).forEach(function(t){var r=String(t&&t.responsable||'').trim();if(r&&!seen[r.toLowerCase()]){seen[r.toLowerCase()]=1;out.push(r);}}); return out.sort(); }

  // Pinta el resumen según el alcance elegido (mías/equipo), sin volver a pedir datos.
  function renderOpsScoped(source,updatedAt){
    state._opsSource=source;state._opsUpdatedAt=updatedAt;
    var all=state.allTasks||[];var scope=state.opsScope||'mias';
    var titulo=$('operation-title'),eyebrow=titulo&&titulo.closest('.section-head')?titulo.closest('.section-head').querySelector('.eyebrow'):null;
    var tasks,mine=false;var who=myName();
    if(scope==='mias'){
      tasks=window.YodOperations.tasksForPerson(all,who);mine=true;
      if(titulo)titulo.textContent='Tus tareas de la semana';if(eyebrow)eyebrow.textContent='Lo tuyo, primero';
    }else{
      tasks=all;
      if(titulo)titulo.textContent='Operación semanal · equipo';if(eyebrow)eyebrow.textContent='Todo el equipo';
    }
    renderOperations({tasks:tasks,summary:window.YodOperations.summarize(tasks),updatedAt:updatedAt,source:source,mine:mine,personName:who,personGeneric:nameIsGeneric(who),responsables:uniqueResponsables(all),totalEquipo:all.length,scope:scope});
  }
  async function loadOperations(token){
    var panel=$('operation-panel');panel.setAttribute('aria-busy','true');
    var ep=state.sesionEpoch;   // si la sesión se purga mientras esto viaja, no se pinta
    // Pintar YA con el último caché del tablero (mismo que usa el board directo);
    // la consulta en vivo lo reemplaza al llegar.
    var cachedTasks=null;try{var _raw=localStorage.getItem('aurum-cache-v5');var _pj=_raw?JSON.parse(_raw):null;cachedTasks=Array.isArray(_pj)?_pj:null;}catch(_e){}
    if(cachedTasks&&cachedTasks.length){state.allTasks=cachedTasks;if(state.role==='admin')renderDecisions(cachedTasks,'cache');renderOpsScoped('cache',null);}
    try{
      var result=await window.YodOperations.load(token);
      if(ep!==state.sesionEpoch)return;
      state.allTasks=Array.isArray(result.tasks)?result.tasks:[];
      if(state.role==='admin')loadReconcile(token);
      if(state.role==='admin')renderDecisions(state.allTasks,result.source);
      renderOpsScoped(result.source,result.updatedAt);
    }
    catch(error){
      if(ep!==state.sesionEpoch)return;
      var diag=(error&&(error._diag||error.message))||'error';
      panel.setAttribute('aria-busy','false');
      panel.innerHTML='<div class="operation-message"><i class="ti ti-shield-lock"></i><span>No se pudo consultar Operación semanal con esta sesión ('+String(diag)+'). El tablero original permanece intacto.</span></div>';
      console.warn('[YOD OS] Operación no cargó →',diag,error);
      if(state.role==='admin')renderPulseError('decision-card','decision-panel','Decisiones (MOAC)');
    }
  }

  /* ── Decisiones pendientes (proyecto "Decisiones" de MOAC) ──
     Convención del Centro de Decisión: Pendiente = esperando la palabra de
     Dirección; En proceso = ya decidida, en ejecución; Terminado = cerrada.
     La edad sale de "DESDE: AAAA-MM-DD" en las observaciones si existe. */
  function decisionAgeDays(task){
    var m=String(task&&(task.observaciones||task.obs||'')||'').match(/DESDE:\s*(\d{4})-(\d{2})-(\d{2})/i);
    if(!m)return null;
    var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    return Math.max(0,Math.round((Date.now()-d.getTime())/86400000));
  }
  function renderDecisions(tasks,source){
    var card=$('decision-card'),panel=$('decision-panel');if(!card||!panel)return;
    card.setAttribute('aria-busy','false');panel.replaceChildren();
    var all=(Array.isArray(tasks)?tasks:[]).filter(function(t){
      if(!t||/decisi/i.test(String(t.proyecto||''))===false)return false;
      var arch=t.archivada===true||String(t.archivada).toLowerCase()==='true'||t.borrada===true||String(t.borrada).toLowerCase()==='true';
      return !arch;
    });
    var porDecidir=all.filter(function(t){return window.YodOperations.normalizeStatus(t.estado)==='Pendiente';});
    var enEjecucion=all.filter(function(t){return window.YodOperations.normalizeStatus(t.estado)==='En proceso';});
    var ages=porDecidir.map(decisionAgeDays).filter(function(v){return v!=null;});
    var oldest=ages.length?Math.max.apply(null,ages):null;
    var grid=document.createElement('div');grid.className='pulse-metrics';
    grid.append(
      pulseMetric('Por decidir',String(porDecidir.length),porDecidir.length?'Te esperan en MOAC':'Nada pendiente',porDecidir.length?'alert':'positive'),
      pulseMetric('En ejecución',String(enEjecucion.length),'Decididas, en curso'),
      pulseMetric('La más vieja',oldest!=null?oldest+' d':'—',oldest!=null?'esperando desde entonces':'sin fecha registrada')
    );
    panel.appendChild(grid);
    if(porDecidir.length){
      var list=document.createElement('div');list.className='task-list';
      porDecidir.slice(0,3).forEach(function(t){
        var row=document.createElement('div');row.className='task-row';
        var title=document.createElement('div');title.className='task-title';
        var strong=document.createElement('strong');strong.textContent=t.actividad||t.entregable||'Decisión sin título';
        var age=decisionAgeDays(t);var small=document.createElement('small');small.textContent=age!=null?('esperando '+age+' días'):'sin fecha';
        title.append(strong,small);row.appendChild(title);list.appendChild(row);
      });
      panel.appendChild(list);
    }
    // el número de decisiones no puede parecer de hoy si salió del caché del equipo
    if(source==='cache'){
      var n=document.createElement('div');n.className='operation-note';
      n.innerHTML='<i class="ti ti-history"></i><span>Último resumen guardado en este dispositivo. La consulta en vivo no respondió.</span>';
      panel.appendChild(n);
    }
  }

  function pulseMetric(label,value,note,kind){var box=document.createElement('div');box.className='pulse-metric'+(kind?' '+kind:'');var name=document.createElement('span');name.textContent=label;var strong=document.createElement('strong');strong.textContent=value;box.append(name,strong);if(note){var small=document.createElement('small');small.textContent=note;box.appendChild(small);}return box;}
  function renderPulseError(cardId,panelId,label){var card=$(cardId),panel=$(panelId);card.setAttribute('aria-busy','false');panel.innerHTML='<div class="pulse-message"><i class="ti ti-cloud-off"></i><span>No se pudo consultar '+label+' en línea. Usa Actualizar para reintentar.</span></div>';}
  // Si el GAS contestó pero SIN saldo, se dice «—»: un $0 se lee como cifra real.
  function sinSaldo(result){return !!(result&&result.data)&&!(result.data.saldo&&result.data.saldo.monto!=null&&result.data.saldo.monto!=='');}
  function renderFinance(result){var card=$('finance-card'),panel=$('finance-panel'),s=result.summary,vacio=sinSaldo(result);card.setAttribute('aria-busy','false');panel.replaceChildren();var grid=document.createElement('div');grid.className='pulse-metrics';grid.append(pulseMetric('Saldo actual',vacio?'—':money(s.balance),vacio?'sin saldo registrado':(s.updatedAt||'Fuente: Flujo YOD')),pulseMetric('Pagos pendientes',money(s.payments),s.paymentsCount+' registrados'),pulseMetric('Ingresos esperados',money(s.income),s.incomeCount+' registrados'),pulseMetric('Saldo proyectado',vacio?'—':money(s.projected),vacio?'falta el saldo para calcularlo':'Saldo + ingresos − pagos',vacio?'':(s.projected<0?'negative':'positive')));panel.appendChild(grid);}
  function sinKpis(result){return !!(result&&result.data)&&!(result.data.kpis&&Object.keys(result.data.kpis).length);}
  function renderMarketing(result){var card=$('marketing-card'),panel=$('marketing-panel'),s=result.summary,vacio=sinKpis(result);card.setAttribute('aria-busy','false');panel.replaceChildren();if(vacio){panel.innerHTML='<div class="pulse-message"><i class="ti ti-help-circle"></i><span>El CRM contestó sin cifras del periodo. No hay números que mostrar todavía.</span></div>';return;}var grid=document.createElement('div');grid.className='pulse-metrics';grid.append(pulseMetric('Leads',String(s.leads),s.period||'Periodo activo'),pulseMetric('Citas',String(s.appointments),percent(s.appointmentRate)+' de leads'),pulseMetric('Clientes',String(s.clients),percent(s.clientRate)+' de leads'),pulseMetric('Sin tocar 24 h',String(s.untouched24h),'Requieren seguimiento',s.untouched24h>0?'alert':''));panel.appendChild(grid);}
  async function loadFinance(token){
    var c=pulseCacheRead('finance'),ep=state.sesionEpoch;
    if(c){renderFinance({summary:c.summary});marcarCache('finance-panel',c.ts);}
    try{var r=await window.YodFinance.load(token);if(ep!==state.sesionEpoch)return;renderFinance(r);if(!sinSaldo(r))pulseCacheWrite('finance',r.summary);}
    catch(_error){if(ep!==state.sesionEpoch)return;if(!c)renderPulseError('finance-card','finance-panel','Tesorería');else marcarCacheFallo('finance-panel');}
  }
  async function loadMarketing(token){
    var c=pulseCacheRead('marketing'),ep=state.sesionEpoch;
    if(c){renderMarketing({summary:c.summary});marcarCache('marketing-panel',c.ts);}
    try{var r=await window.YodMarketing.load(token);if(ep!==state.sesionEpoch)return;renderMarketing(r);if(!sinKpis(r))pulseCacheWrite('marketing',r.summary);}
    catch(_error){if(ep!==state.sesionEpoch)return;if(!c)renderPulseError('marketing-card','marketing-panel','Marketing');else marcarCacheFallo('marketing-panel');}
  }
  async function loadPulse(token){
    var financeAllowed=state.role==='admin';var marketingAllowed=state.role==='admin'||window.YodAccessPolicy.hasCode(state.boards,'MK');
    var decisionsAllowed=state.role==='admin';
    $('finance-card').classList.toggle('hidden',!financeAllowed);$('marketing-card').classList.toggle('hidden',!marketingAllowed);$('decision-card').classList.toggle('hidden',!decisionsAllowed);$('pulso').classList.toggle('hidden',!financeAllowed&&!marketingAllowed&&!decisionsAllowed);
    if(window.revisarPuertaEmbudo)window.revisarPuertaEmbudo();   // misma regla MK para la pestaña Métricas
    var requests=[];if(financeAllowed)requests.push(loadFinance(token));if(marketingAllowed)requests.push(loadMarketing(token));await Promise.allSettled(requests);
  }

  (function(){
    var t=document.getElementById('funnelToggle'),m=document.getElementById('funnelMenu');
    if(!t||!m)return;
    function cerrar(){m.hidden=true;t.setAttribute('aria-expanded','false');}
    t.addEventListener('click',function(e){e.stopPropagation();var abre=m.hidden;m.hidden=!abre;t.setAttribute('aria-expanded',String(abre));});
    document.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target)&&e.target!==t)cerrar();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')cerrar();});
  })();

  function buildSearch(query){
    var box=$('search-results');box.replaceChildren();var term=safeText(query).trim().toLowerCase();
    var matches=state.modules.filter(function(row){return !term||[row.titulo_portal,row.descripcion_portal,row.audiencia].join(' ').toLowerCase().includes(term);});
    // el buscador respeta a Control Maestro igual que las tarjetas: lo que está en
    // Mantenimiento/Revisión aparece, dice por qué, y NO es enlace
    matches.forEach(function(row){
      var on=window.PortalCore.enabled(row),b=window.PortalCore.badge(row);
      var a=document.createElement(on?'a':'div');a.className='search-result';
      if(on){a.href=hrefDe(window.PortalCore.resolveUrl(row));a.rel='noopener';a.addEventListener('click',function(){try{$('search-dialog').close();}catch(_e){}});}
      else{a.setAttribute('aria-disabled','true');}
      a.innerHTML='<i class="ti ti-'+(ICONS[row.system_id]||'layout-dashboard')+'"></i>';
      var text=document.createElement('span');var strong=document.createElement('strong');strong.textContent=safeText(row.titulo_portal);
      var small=document.createElement('small');small.textContent=on?(safeText(row.audiencia)||'Equipo autorizado'):b.text;
      text.append(strong,small);a.appendChild(text);box.appendChild(a);
    });
    if(!matches.length){var empty=document.createElement('div');empty.className='empty-state';empty.textContent='No encontramos un módulo con ese nombre.';box.appendChild(empty);}
    var cuenta=$('search-count');
    if(cuenta)cuenta.textContent=matches.length===1?'1 resultado':(matches.length+' resultados');
  }

  function openSearch(){var dialog=$('search-dialog');dialog.showModal();$('search-input').value='';buildSearch('');setTimeout(function(){$('search-input').focus();},0);}
  $('welcome-title').firstChild.textContent=greeting()+', ';
  // ⟳ también revalida la identidad: tras un fallo pasajero del canje el OS se
  // quedaba en «Sesión por validar» hasta recargar a mano.
  function refreshAll(){loadCatalog();var token='';try{token=localStorage.getItem(TOKEN_KEY)||'';}catch(_error){}if(!token)return;if(!state.profileReady){loadIdentity();return;}loadPulse(token);if(window.YodAccessPolicy.hasCode(state.boards,'TA')||state.role==='admin')loadOperations(token);}
  $('refresh').addEventListener('click',refreshAll);var _mrb=$('mobile-refresh');if(_mrb)_mrb.addEventListener('click',refreshAll);$('search-trigger').addEventListener('click',openSearch);$('search-input').addEventListener('input',function(e){buildSearch(e.target.value);});var _lo=$('logout');if(_lo)_lo.addEventListener('click',cerrarSesion);
  document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}});
  // Cajón lateral en móvil (☰) — misma navegación que escritorio
  (function(){
    var shell=document.querySelector('.app-shell');var burger=$('menu-toggle');var scrim=$('nav-scrim');if(!shell)return;
    var lateral=document.querySelector('.sidebar'),soltar=null,disparador=null;
    // el cajón anuncia su estado y atrapa el foco: con Tab ya no te salías al
    // contenido que queda tapado detrás del velo
    function sync(){
      var a=shell.classList.contains('nav-open');
      if(burger){burger.setAttribute('aria-expanded',String(a));burger.setAttribute('aria-label',a?'Cerrar menú':'Abrir menú');}
      if(a&&!soltar)soltar=trapFocus(lateral);
      if(!a&&soltar){soltar();soltar=null;if(disparador&&disparador.focus)disparador.focus();disparador=null;}
    }
    if(window.matchMedia&&window.matchMedia('(max-width:900px)').matches){var seen=false;try{seen=sessionStorage.getItem('yod_drawer_seen')==='1';}catch(e){}if(!seen){shell.classList.add('nav-open');try{sessionStorage.setItem('yod_drawer_seen','1');}catch(e){}}}
    sync();
    function closeNav(){shell.classList.remove('nav-open');sync();}
    if(burger)burger.addEventListener('click',function(){disparador=burger;shell.classList.toggle('nav-open');sync();});
    if(scrim)scrim.addEventListener('click',closeNav);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});
    var nav=$('nav-modules');if(nav)nav.addEventListener('click',function(e){if(e.target.closest('.nav-item'))closeNav();});
    if(window.matchMedia){var mq=window.matchMedia('(min-width:901px)');mq.addEventListener('change',function(m){if(m.matches)closeNav();});}
  })();
  // Catálogo: arrancar con el último conocido (mismo caché que usa el marco de
  // los tableros); loadCatalog lo refresca y reescribe al llegar.
  try{var _cc=JSON.parse(localStorage.getItem('yod_portal_cat_v1')||'null');if(Array.isArray(_cc)&&_cc.length)state.rawRows=_cc;}catch(_e){}
  loadIdentity();loadCatalog();
  /* ── Entrar la clave DENTRO del tablero despierta al resto del OS ──
     Antes había que recargar a mano: el iframe guardaba la llave y el padre
     seguía en «Verificando acceso…». Dos avisos, ambos del mismo origen. */
  addEventListener('message',function(e){
    if(e.origin!==location.origin)return;
    if(!e.data||e.data.yodTablero!=='sesion')return;
    if(state.profileReady)refreshAll();else loadIdentity();
  });
  addEventListener('storage',function(e){
    if(e.key===TOKEN_KEY&&e.newValue&&!state.profileReady)loadIdentity();
  });
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href]');if(!a)return;
    if(a.closest('#embudoMask')||a.target==='_blank')return;
    if(esEmbudo(a.href)&&window.abrirEmbudo){e.preventDefault();window.abrirEmbudo(vistaDe(a.href));}
  },true);
})();

/* ── El tablero embebido dice cuánto mide; el marco se ajusta solo. ── */
addEventListener('message', function (ev) {
  if (ev.origin !== location.origin) return;                 // solo nuestro propio iframe
  var d = ev.data;
  if (!d || d.yodTablero !== 'alto') return;
  var f = document.getElementById('board-frame');
  var h = Number(d.alto);
  if (f && h > 200 && h < 4000) f.style.height = h + 'px';
});
