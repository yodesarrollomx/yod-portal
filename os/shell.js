/* ==========================================================================
   YOD OS · Shell compartido (shell.js) — la CARA única para todos los boards.
   Se carga como portero.js. Envuelve el contenido existente del board en el
   chrome de YOD OS (barra lateral de tableros + topbar con buscador ⌘K +
   identidad/rol), sin tocar la lógica ni los datos del board.
   Requiere shell.css y la webfont Tabler (ti ti-*).
   ========================================================================== */
(function () {
  'use strict';

  /* NAVIGATION-BEGIN */
  // Generado desde os/catalogo.js: presentación común; no concede accesos.
  var NAV_ORDER = ["SYS-DESPACHO","SYS-POTENCIALES","SYS-TRACK","SYS-MIRAMAR","SYS-TAREAS","SYS-FLUJO","SYS-INTERIORES","SYS-INVERSION","SYS-MARKETING","SYS-OBRA","SYS-CONTROL"];
  var NAV_PARENT = {"SYS-MIRAMAR":"SYS-TRACK"};
  function orderedModules(rows) {
    var seen = Object.create(null);
    return (Array.isArray(rows) ? rows : []).filter(function (row) {
      if (!row || !row.system_id || seen[row.system_id]) return false;
      seen[row.system_id] = true; return true;
    }).sort(function (a, b) {
      var ai = NAV_ORDER.indexOf(a.system_id), bi = NAV_ORDER.indexOf(b.system_id);
      if (ai < 0) ai = NAV_ORDER.length; if (bi < 0) bi = NAV_ORDER.length;
      return ai - bi || String(a.system_id).localeCompare(String(b.system_id));
    });
  }
  function sidebarModules(rows, available) {
    var sorted = orderedModules(rows);
    var ids = sorted.filter(function (row) { return !available || available(row); }).map(function (row) { return row.system_id; });
    return sorted.filter(function (row) { return !NAV_PARENT[row.system_id] || ids.indexOf(NAV_PARENT[row.system_id]) < 0; });
  }
  /* NAVIGATION-END */
  if (window.__YOD_SHELL__) return; window.__YOD_SHELL__ = 1;
  // Embebido dentro de la máscara del OS: el marco ya lo pone el padre.
  try {
    if (window.parent !== window) {
      if (/[?&]embed=1/.test(location.search)) return;
      var ancestor = window.parent;
      while (true) {
        if (ancestor.document.querySelector('.app-shell,.yod-shell')) return;
        if (ancestor.parent === ancestor) break;
        ancestor = ancestor.parent;
      }
    }
  } catch (e) { /* Cross-origin standalone consumers keep their own shell. */ }

  var SELF = (document.currentScript && document.currentScript.src) || 'https://yodesarrollomx.github.io/yod-portal/os/shell.js';
  var LSC = 'pyod_clave_v1';
  var PORTAL = 'https://script.google.com/macros/s/AKfycby5LKYKRwl0EsNgppOIeD_ArST8vSXRgNO4ns8XZbFW4yjfglzu4io_vhabB8h-J792Tw/exec?action=read&resource=Portal';
  /* El marco que envuelve TODOS los tableros tenía su propio portero apuntando
     al del dominio suspendido. Con la suscripción caída, su canje fallaba y el
     usuario quedaba en "Sesión por validar" aunque el gate ya lo hubiera dejado
     entrar. Ahora usa el mismo relevo que el resto: original, y si falla, respaldo. */
  /* La dirección del Portero vive SOLO en os/yod-acceso.js. Si la página no la
     cargó, se pide aquí (misma carpeta que este archivo) antes del primer canje. */
  var ACCESO_LISTO = window.YOD_PORTERO ? Promise.resolve() : new Promise(function (ok) {
    var sc = document.createElement('script'); sc.src = SELF.replace(/shell\.js(\?.*)?$/, 'yod-acceso.js?v=20261030-fase0');
    sc.onload = sc.onerror = function () { ok(); }; document.head.appendChild(sc);
  });
  /* El ORIGINAL siempre primero; el respaldo solo si aquel falla en esta
     llamada. Antes el relevo se pegaba en localStorage y, al reactivarse
     Google, el navegador seguía en el respaldo (que no conoce los correos ni
     el login de Google). Limpiamos ese resto de la emergencia. */
  try { localStorage.removeItem('pyod_portero'); } catch (e) { }
  function rechazoAcceso(error) {
    return ['liga','clave','expirado','revocado','sin_sesion','sin_acceso','sin acceso','denegado','no autorizado','unauthorized','forbidden','http 401','http 403'].includes(String(error && error.message || error || '').trim().toLowerCase());
  }
  async function canjeConRelevo(k, opts) {
    if (typeof cargadorActivo_ === 'function' && cargadorActivo_()) return canjeConCargador_(k, opts);
    /* T-105 (30-oct-2026) · el respaldo contesta 404 «Page Not Found» desde el 23-sep (esa implementación ya no
       existe en Google; lo midió el vigía de yod-portal). Saltar a él convertía cada tardanza del ORIGINAL en una
       sesión «por validar». Mientras no haya un respaldo vivo, el segundo intento vuelve a ser el ORIGINAL tras
       1.5 s, igual que potenciales-yod/portero.js (RESPALDO_VIVO). Para reactivar el respaldo: respaldoVivo = true
       con una URL que conteste (y devolver a la prueba 'caída de transporte' su expectativa de dos direcciones). */
    var respaldoVivo = false;
    async function intenta(base) {
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, 25000) : null;
      try {
        var r = await fetch(base + '?recurso=canje&t=' + encodeURIComponent(k), { cache: 'no-store', credentials: 'omit', signal: controller ? controller.signal : undefined });
        if (r.status === 401 || r.status === 403) return { ok: false, error: 'HTTP ' + r.status };
        if (r.ok === false) throw new Error('HTTP ' + r.status);
        return await r.json();
      } finally { if (timer) clearTimeout(timer); }
    }
    await ACCESO_LISTO;
    var P = window.YOD_PORTERO; if (!P) return null;
    var j = null; try { j = await intenta(P.original); } catch (e) { }
    if (j && (j.ok || rechazoAcceso(j.error))) return j;
    if (!respaldoVivo) {
      // T-105: el segundo intento es el ORIGINAL otra vez (el respaldo está muerto). Un rechazo explícito del
      // original sí es concluyente; cualquier otra cosa sigue siendo «sin respuesta» (null) y se reintenta en fondo.
      await new Promise(function (listo) { setTimeout(listo, 1500); });
      try { var otra = await intenta(P.original); return otra && (otra.ok || rechazoAcceso(otra.error)) ? otra : null; } catch (e) { return null; }
    }
    // El respaldo puede usar otra base de sesiones. Un rechazo suyo no puede
    // invalidar una credencial cuando el primario simplemente no respondió.
    try { var backup = await intenta(P.respaldo); return backup && backup.ok ? backup : null; } catch (e) { return null; }
  }
  /* ══ FASE 1 · «UN CARGADOR» (T-102) ═══════════════════════════════════════════
     Si la página cargó os/yod-cargador.js (window.YodCargador), el marco lo usa para destrabar el tablero y
     pintar el menú desde la última copia buena, y las revalida en segundo plano. Es ADITIVO: canjeConRelevo,
     loadIdentity, loadCatalog, cargarChinche y logout abren con UNA línea que delega aquí sólo si
     cargadorActivo_(); sin cargador, o con ?cargador=legacy (o localStorage.yodcg_legacy='1'), corre el código
     de siempre. El marco NUNCA borra pyod_clave_v1 por un rechazo propio (regla 5 de CLAUDE.md): sólo
     purga las copias del cargador; la dueña de la sesión es la cabina. El muro sigue siendo cada backend. */
  function cargadorActivo_() { var c = window.YodCargador; return !!(c && c.v && !c.legacy); }
  // Misma forma de salida que canjeConRelevo: {ok:true,token,rol,boards,nombre,correo[,origen,edadMs]},
  // {ok:false,error[,rechazo,origen]} o null. fuerzaRed ignora la copia (revalidar una sesión ya confirmada, reintentos).
  async function canjeConCargador_(k, opts) {
    var fuerzaRed = opts && opts.fuerzaRed !== undefined ? Boolean(opts.fuerzaRed)
      : (state.identity === 'ok' && state.sessionToken === k) || (state.reconnectAttempts || 0) > 0;
    try {
      var r = await window.YodCargador.sesion.canjear({ modo: fuerzaRed ? 'red' : 'cache-primero' });
      return r && typeof r === 'object' ? r : null;
    } catch (e) { return null; }
  }
  // Un rechazo vivo tira TODA copia guardada: una recarga no puede resucitar la identidad.
  function purgarCargador_() { try { window.YodCargador.purgar(); } catch (e) { } }
  function cerrarCargador_(token, motivo) { try { return window.YodCargador.sesion.cerrar({ token: token, motivo: motivo }); } catch (e) { return false; } }
  var CATALOG_BASE = PORTAL.split('?')[0];
  function configurarCatalogo_() {
    var c = window.YodCargador;
    if (state.cargadorConfigurado || !c || typeof c.config !== 'function') return;
    try { c.config({ catalogo: { url: CATALOG_BASE } }); state.cargadorConfigurado = true; } catch (e) { }
  }
  var OS = 'https://yodesarrollomx.github.io/yod-portal/os/';
  var CORPORATE = 'https://yodesarrollo.mx/'; // sitio público; la marca del shell ya NO cuelga de aquí (lleva al OS)
  function esPropioShell(u){return /^https:\/\/(yodesarrollomx\.github\.io|tableros\.yodesarrollo\.mx|alexpueblag\.github\.io|aurumarquitectos\.github\.io)\//.test(String(u||''));}
  var DEST = {
    'SYS-DESPACHO': 'https://yodesarrollomx.github.io/yod-despacho/',
    'SYS-POTENCIALES': 'https://yodesarrollomx.github.io/potenciales-yod/',
    'SYS-TRACK': 'https://yodesarrollomx.github.io/yod-portal/track-codesarrollos.html',
    'SYS-MIRAMAR': 'https://yodesarrollomx.github.io/real-miramar-board/',
    'SYS-TAREAS': 'https://yodesarrollomx.github.io/board-aurum/',
    'SYS-FLUJO': 'https://yodesarrollomx.github.io/board-flujo-yod/',
    'SYS-INTERIORES': 'https://yodesarrollomx.github.io/interiores-aurum/',
    'SYS-INVERSION': 'https://yodesarrollomx.github.io/yodesarrollo-board/brokers.html',
    'SYS-MARKETING': 'https://yodesarrollomx.github.io/aurum-board/',
    'SYS-OBRA': 'https://yodesarrollomx.github.io/yod-portal/obra.html'
  };
  var ICON = { 'SYS-DESPACHO': 'layout-grid', 'SYS-POTENCIALES': 'map-2', 'SYS-TRACK': 'route', 'SYS-MIRAMAR': 'building-community', 'SYS-TAREAS': 'checklist', 'SYS-FLUJO': 'wallet', 'SYS-INTERIORES': 'armchair-2', 'SYS-INVERSION': 'presentation-analytics', 'SYS-MARKETING': 'speakerphone', 'SYS-OBRA': 'building-skyscraper' };
  /* Los títulos oficiales viven en la pestaña Portal del Control Maestro
     (titulo_portal); estos son solo el respaldo si aquella no contesta.
     Deben decir LO MISMO que el Sheet — si renombras allá, renombra acá. */
  var NAME = { 'SYS-DESPACHO': 'El Despacho', 'SYS-POTENCIALES': 'PPP', 'SYS-TRACK': 'Codesarrollos', 'SYS-MIRAMAR': 'Real de Miramar', 'SYS-TAREAS': 'MOAC', 'SYS-FLUJO': 'Flujo', 'SYS-INTERIORES': 'AURUM', 'SYS-INVERSION': 'Masterbrokers', 'SYS-MARKETING': 'Embudo comercial', 'SYS-OBRA': 'Obra en vivo' };
  // Códigos por tablero — MISMA matriz que YOD OS (access-policy.js). El menú
  // solo enseña lo que tu sesión permite; el muro real sigue siendo cada backend.
  var CODES = {
    // generado desde os/catalogo.js (node scripts/catalogo.cjs); SYS-CONTROL solo lo abre Dirección
    'SYS-DESPACHO': ['DP'],
    'SYS-POTENCIALES': ['PT', 'MP', 'MA', 'MX', 'UN', 'RE', 'PA'],
    'SYS-TRACK': ['CO', 'TC'],
    'SYS-MIRAMAR': ['RM'],
    'SYS-TAREAS': ['TA'],
    'SYS-FLUJO': ['FL'],
    'SYS-INTERIORES': ['IN'],
    'SYS-INVERSION': ['IV'],
    'SYS-MARKETING': ['MK'],
    'SYS-OBRA': ['OB'],
    'SYS-CONTROL': ['AC']
  };
  // identity: 'pending' (validando) | 'ok' (canje válido) | 'fail' (sin sesión o canje falló)
  var state = { role: '', boards: '', modules: [], identity: 'pending', catalogRows: null, catalogIds: null, identityRequest: 0, sessionToken: '', sessionIdentity: '', verifiedAt: 0, reconnectAttempts: 0, retryTimer: null };

  /* El catálogo consultado se conserva en memoria de la sesión validada. Las
     antiguas llaves compartidas se mantienen aquí únicamente para purgarlas. */
  var CATCACHE = 'yod_portal_cat_v1';
  /* Los ids que el Sheet SI trae, aunque vengan apagados. Sirven para distinguir
     "Direccion lo apago" (se respeta) de "nadie lo dio de alta" (se rellena). */
  var CATIDS = 'yod_portal_cat_ids_v1';
  // Las versiones persistidas no indican de qué sesión vinieron. El catálogo
  // vigente solo se guarda en memoria tras consultar con la sesión actual.
  function readCatIds() { return state.catalogIds; }
  function writeCatIds(ids) { state.catalogIds = ids; }
  function readCatCache() { return state.catalogRows; }
  function writeCatCache(rows) { state.catalogRows = rows; }

  // Solo Activo abre (igual que el OS). Las filas de respaldo no traen `estado`:
  // sin estado se consideran vivas, si no el menú de respaldo quedaría vacío.
  function vivo(r) { var s = String(r && r.estado || '').trim().toLowerCase(); return !s || s === 'activo'; }
  /* La URL manda desde el Sheet, pero solo si cuelga del destino conocido
     (mismo criterio de prefijo que safeByManifest en portal-core.js). */
  function destino(row) {
    var base = DEST[row && row.system_id]; if (!base) return '';
    var u = String(row && row.url || ''); if (!u) return base;
    try { var p = new URL(u); return (p.protocol === 'https:' && p.href.indexOf(base) === 0) ? p.href : ''; }
    catch (e) { return ''; }
  }
  function boardsList() { return String(state.boards || '').toUpperCase().split(/[,|; ]+/).filter(Boolean); }
  function canOpen(sys) {
    if (state.identity !== 'ok') return false;   // fail-closed: sin sesión validada, el menú no enseña nada
    if (state.role === 'admin') return true;
    if (sys === 'SYS-CONTROL') return false;
    var l = boardsList();
    if (l.indexOf('*') > -1) return true;
    var req = CODES[sys] || [];
    for (var i = 0; i < req.length; i++) { if (l.indexOf(req[i]) > -1) return true; }
    return false;
  }

  function tok() { try { return localStorage.getItem(LSC) || ''; } catch (e) { return ''; } }
  function canOpenProject(p) {
    if (state.identity !== 'ok' || !p || !p.tablero) return false;
    var code = {'PRJ-RM':'RM','PRJ-ALYSA':'AL','PRJ-MARIA':'TM'}[p.folio];
    if (!code) return false;
    var list = boardsList();
    return state.role === 'admin' || list.indexOf('*') >= 0 || list.indexOf(code) >= 0;
  }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function set(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
  function currentSys() { var here = location.href, best = ''; Object.keys(DEST).forEach(function (k) { if (here.indexOf(DEST[k].replace(/\/$/, '')) === 0) best = k; }); return best; }

  function moduleTitle(row) { return row.system_id === 'SYS-INVERSION' ? (state.role === 'admin' ? 'Master Developer' : 'Master Broker') : (row.titulo_portal || NAME[row.system_id] || row.system_id); }
  function defaultRows() { return Object.keys(DEST).map(function (k) { return { system_id: k, titulo_portal: NAME[k] }; }); }
  /* Un tablero que ya vive aqui (DEST + NAME + CODES) pero al que nadie dio de
     alta en la pestaña Portal quedaba fuera del menu de TODOS los tableros,
     aunque tu sesion tuviera su codigo. Se le pone su fila de respaldo. Si el
     Sheet si lo trae y lo apago, ese id aparece en idsDelSheet y no se toca. */
  function conAltasNuevas(rows, idsDelSheet) {
    var vistos = {};
    (idsDelSheet || []).forEach(function (id) { if (id) vistos[id] = 1; });
    (rows || []).forEach(function (r) { if (r && r.system_id) vistos[r.system_id] = 1; });
    var faltan = Object.keys(DEST).filter(function (k) { return !vistos[k]; });
    if (!faltan.length) return rows || [];
    return (rows || []).concat(faltan.map(function (k) { return { system_id: k, titulo_portal: NAME[k] }; }));
  }
  /* El Embudo comercial no se abre "pelón": vive en la máscara de la cabina
     (Sala · Métricas · Plan de Potencial). Desde cualquier tablero envuelto,
     su enlace lleva a esa ruta del OS, igual que un clic en la cabina. */
  function enlace(row) {
    var url = destino(row); if (!url) return '';
    return (row && row.system_id === 'SYS-MARKETING') ? OS + '#/embudo/metricas' : url;
  }
  function navItem(row, cur) {
    var url = enlace(row); if (!url) return null;
    var nuevo = false; try { nuevo = row.system_id !== cur && localStorage.getItem('yod_nuevo_' + row.system_id) === '1'; } catch (e) { }
    var a = el('a', 'yod-nav-item' + (row.system_id === cur || row.system_id === NAV_PARENT[cur] ? ' active' : '') + (nuevo ? ' hay-nuevo' : ''));
    if (nuevo) a.title = 'Hay algo nuevo desde tu última visita';
    a.href = url; a.setAttribute('rel', 'noopener'); if(!esPropioShell(url)) a.setAttribute('target','_blank');
    a.innerHTML = '<i class="ti ti-' + (ICON[row.system_id] || 'layout-dashboard') + '"></i><span>' + esc(moduleTitle(row)) + '</span>';
    return a;
  }
  function renderNav(rows, cur) {
    var box = document.getElementById('yodNav'); if (!box) return; box.innerHTML = '';
    rows = orderedModules(rows); state.modules = rows;
    sidebarModules(rows, vivo).forEach(function (r) {
      var n = navItem(r, cur); if (n) box.appendChild(n);
    });
    if (state.role === 'admin') {
      var people = el('a', 'yod-nav-item'); people.href = 'https://yodesarrollomx.github.io/potenciales-yod/accesos.html';
      people.innerHTML = '<i class="ti ti-users"></i><span>Personas y accesos</span>'; box.appendChild(people);
    }
    rows.forEach(function (r) { if (r.system_id === cur && r.titulo_portal) set('yodCrumbHere', moduleTitle(r)); });
    if (!box.children.length) box.innerHTML = '<span class="yod-nav-loading">Sin tableros</span>';
  }

  // Pinta el menú SOLO con los tableros de esta sesión (misma decisión que YOD OS).
  // Mientras la identidad no valide, se queda en "Cargando…" — nunca se enseña de más.
  function applyNav() {
    var cur = currentSys();
    if (state.identity === 'pending') {
      state.modules = [];var pending = document.getElementById('yodNav');
      if (pending) pending.innerHTML = '<span class="yod-nav-loading">Validando acceso…</span>';return;
    }
    if (state.identity === 'fail') {
      var box = document.getElementById('yodNav');
      if (box) box.innerHTML = '<span class="yod-nav-loading">Sesión por validar</span>';
      state.modules = [];
      return;
    }
    var base = (state.catalogRows && state.catalogRows.length) ? state.catalogRows : (readCatCache() || defaultRows());
    var rows = conAltasNuevas(base, state.catalogIds || readCatIds());
    renderNav(rows.filter(function (r) { return canOpen(r.system_id) && vivo(r); }), cur);
    if(state.catalogUnavailable){
      var note=el('span','yod-nav-loading');note.textContent='Catálogo sin acceso · lista de respaldo';
      var box=document.getElementById('yodNav');if(box)box.appendChild(note);
    }
  }

  // Cachés de datos que cada board guarda en localStorage (origen compartido:
  // alexpueblag.github.io y yodesarrollomx.github.io). Cuando cae el candado se purgan los del board
  // negado, para que en un dispositivo compartido no queden datos de otra
  // persona visibles sin permiso.
  var DATA_CACHES = {
    'SYS-TAREAS': ['aurum-cache-v5','yod_ops_me'],
    'SYS-TRACK': ['codeyod-cache-v1'],
    'SYS-MIRAMAR': ['rm_cache_v3', 'rm_fin_v1'],
    // La cola de escrituras aurum_postq_v1 no es caché de presentación: no se
    // elimina al revalidar una sesión, para conservar trabajo pendiente.
    'SYS-INTERIORES': ['aurum_cache_v1'],
    'SYS-INVERSION': ['ydr_board_data_v1'],
    'SYS-MARKETING': ['aurum_board_q_v1'],
    // El board de Flujo guarda el nombre de quien captura ("¿Quién eres?"): en una
    // tablet compartida quedaba puesto para el siguiente. Verificado 4-sep-2026.
    'SYS-FLUJO': ['yodflujo-user']
  };
  /* Esta lista contiene cachés de presentación conocidas; agregar nuevas
     requiere revisar por separado las colas de escrituras pendientes. */
  function purgeCaches(sys) {
    (DATA_CACHES[sys] || []).forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
  }
  function purgeAll() {
    Object.keys(DATA_CACHES).forEach(function (s) { purgeCaches(s); });
    [CATCACHE,CATIDS,'yod_pulse_v1'].forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
    try{sessionStorage.removeItem('yod_id_v1');}catch(e){}
  }
  // Cerrar sesión: borra la credencial, la identidad de la sesión y los cachés de
  // datos LISTADOS en DATA_CACHES (no "todo el localStorage": lo que no está en la
  // lista sobrevive). Vital en dispositivos compartidos (una tablet del equipo)
  // para no dejar la sesión ni los datos de una persona al alcance de la siguiente.
  function logout() {
    if (typeof cargadorActivo_ === 'function' && cargadorActivo_()) cerrarCargador_(tok(), 'salir');
    state.identityRequest++;state.identity='fail';state.sessionToken='';maybeLock();
    try { localStorage.removeItem(LSC); sessionStorage.removeItem('pyod_rol'); sessionStorage.removeItem('yod_id_v1'); localStorage.removeItem('yod_pulse_v1'); } catch (e) { }
    purgeAll();
    location.href = OS;
  }

  // Candado de página: si el canje validó y este tablero NO está en tus accesos,
  // se tapa el contenido y se purga su caché local. (El muro real es el backend
  // del board — esto es la cara honesta de ese muro, para que no parezca que
  // "entraste" y para que no queden datos cacheados en el dispositivo.)
  function maybeLock() {
    var cur = currentSys();if (!cur) return;
    var canvas = document.querySelector('.yod-canvas'),lock = document.getElementById('yodLock');
    if (state.identity === 'ok' && canOpen(cur)) {
      if (lock && lock.parentNode) lock.parentNode.removeChild(lock);
      if (canvas) canvas.style.display = '';
      return;
    }
    if (canvas) canvas.style.display = 'none';
    if (state.identity !== 'pending') purgeCaches(cur);
    var main = document.querySelector('.yod-main');if (!main) return;
    if (!lock) { lock = el('div', 'yod-lock');lock.id = 'yodLock';main.appendChild(lock); }
    var titulo = state.identity === 'pending' ? 'Validando tu acceso…' : state.identity === 'fail' ? 'Sesión por validar' : (NAME[cur] || 'Este tablero') + ' no está en tus accesos';
    var mensaje = state.identity === 'pending' ? 'Espera la confirmación del servidor.' : state.identity === 'fail' ? 'Vuelve al OS para validar tu sesión o reintentar.' : 'Tu sesión es válida, pero este tablero no forma parte de tus permisos.';
    lock.innerHTML = '<i class="ti ti-shield-lock"></i><h2>' + esc(titulo) + '</h2><p>' + esc(mensaje) + '</p>'
      + '<a href="' + OS + '"><i class="ti ti-home-2"></i> Volver a YOD OS</a>';
  }

  /* SHELL-10, de verdad (25-sep): cualquier encabezado pegajoso del tablero con
     top menor al alto de la barra del marco quedaba DEBAJO de ella al bajar (PPP
     Residencial: .sticky-header en top:0). La regla de shell.css solo cubría
     header/.secnav/.topbar. Aquí se corrige cualquiera, midiendo la barra real. */
  function ajustaPegajosos() {
    try {
      var bar = document.querySelector('.yod-topbar'); if (!bar) return;
      var alto = Math.round(bar.getBoundingClientRect().height);
      if (!alto) return;   // barra aún oculta (candado): se reintenta al bajar o al cambiar tamaño
      document.querySelectorAll('.yod-canvas *').forEach(function (e) {
        var c = getComputedStyle(e); if (c.position !== 'sticky') return;
        var base = e.dataset.yodTop != null ? +e.dataset.yodTop : (parseFloat(c.top) || 0);
        if (e.dataset.yodTop == null) { if (base >= alto) return; e.dataset.yodTop = String(base); }
        e.style.top = (alto + base) + 'px';
      });
    } catch (e) { }
  }
  /* OS-3 · la misma pastilla de estado en todos los tableros, en palabras llanas:
     verde «Conectado», ámbar «Validando…», rojo «Sin sesión» (clic → entrar en YOD OS). */
  function pastilla(tipo) {
    var c = document.getElementById('yodConn'); if (!c) return;
    var T = { ok: ['Conectado', 'Tu sesión de Google está activa'], wait: ['Validando…', 'Validando tu acceso con Google'], fail: ['Sin sesión', 'Toca para entrar con Google en YOD OS'] }[tipo];
    c.className = 'yod-conn yod-conn-' + tipo; c.title = T[1];
    c.querySelector('span').textContent = T[0];
    c.onclick = tipo === 'fail' ? function () { location.href = OS; } : null;
    c.style.cursor = tipo === 'fail' ? 'pointer' : '';
  }
  function boot() {
    // registro de proyectos (folio): lo usan el buscador ⌘K y la chinche
    if (!window.YodProyectos) { var sp = document.createElement('script'); sp.src = SELF.replace(/shell\.js(\?.*)?$/, 'proyectos.js?v=20261030-fase0'); document.head.appendChild(sp); }
    if (document.querySelector('.yod-shell')) return;
    /* Los íconos de la barra son de Tabler: los tableros que no traían su hoja (MOAC)
       mostraban botones vacíos. El marco la carga él mismo, y las fuentes de la marca. */
    if (!document.querySelector('link[href*="tabler-icons"]')) {
      var ti = document.createElement('link'); ti.rel = 'stylesheet';
      ti.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css';
      document.head.appendChild(ti);
    }
    if (!document.querySelector('link[href*="Instrument+Serif"],link[href*="Instrument Serif"]')) {
      var gf = document.createElement('link'); gf.rel = 'stylesheet';
      gf.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap';
      document.head.appendChild(gf);
    }
    document.body.classList.add('yod-on');
    var cur = currentSys();
    var canvas = el('div', 'yod-canvas');
    while (document.body.firstChild) { canvas.appendChild(document.body.firstChild); }

    var side = el('aside', 'yod-sidebar');
    side.innerHTML = '<a class="yod-brand" href="' + OS + '#inicio" title="Ir a YOD OS" aria-label="Ir a YOD OS"><b>YOD</b><span>OS</span></a>'
      + '<nav class="yod-nav"><p class="yod-nav-label">Tableros</p><div id="yodNav"><span class="yod-nav-loading"><i class="ti ti-loader-2 yod-spin"></i> Cargando…</span></div></nav>'
      + '<div class="yod-foot"><div class="yod-avatar" id="yodAv">YO</div><div class="yod-id"><strong id="yodName">Equipo YOD</strong><span id="yodRole">Verificando…</span></div><button class="yod-out" id="yodOut" type="button" title="Cerrar sesión" aria-label="Cerrar sesión"><i class="ti ti-logout"></i></button></div>';

    var main = el('main', 'yod-main');
    var top = el('header', 'yod-topbar');
    top.innerHTML = '<button class="yod-burger" id="yodBurger" type="button" aria-label="Abrir tableros"><i class="ti ti-menu-2"></i></button>'
      + '<button class="yod-back" id="yodBack" type="button" title="Volver a la pantalla anterior" aria-label="Volver a la pantalla anterior"><i class="ti ti-arrow-left"></i><span>Atrás</span></button>'
      + '<a class="yod-topbrand" href="' + OS + '#inicio" title="Ir a YOD OS" aria-label="Ir a YOD OS"><b>YOD</b><span>OS</span></a>'
      + '<nav class="yod-crumbs" id="yodCrumbs" aria-label="Dónde estoy"><span>YOD OS</span><i class="ti ti-chevron-right"></i><b id="yodCrumbHere">' + esc(NAME[cur] || document.title || 'Tablero') + '</b></nav>'
      + '<button class="yod-search" id="yodSearch" type="button"><i class="ti ti-search"></i><span>Buscar un tablero…</span><kbd>⌘ K</kbd></button>'
      + '<div class="yod-top-actions"><span class="yod-conn yod-conn-wait" id="yodConn" title="Validando tu acceso con Google"><i></i><span>Validando…</span></span><span class="yod-role" id="yodChip" style="display:none"></span></div>';
    main.appendChild(top); main.appendChild(canvas);

    var shell = el('div', 'yod-shell'); shell.appendChild(side); shell.appendChild(main);
    var scrim = el('div', 'yod-scrim'); shell.appendChild(scrim);
    document.body.appendChild(shell);

    // The shared visual layer preserves this shell's identity and routing.
    var chromeCSS=document.createElement('link');chromeCSS.rel='stylesheet';chromeCSS.href=new URL('ui-chrome.css?v=20261030-fase0',SELF).href;document.head.appendChild(chromeCSS);
    var chromeJS=document.createElement('script');chromeJS.src=new URL('ui-chrome.js?v=20261030-fase0',SELF).href;document.head.appendChild(chromeJS);
    wireDrawer(shell, scrim);
    // «hay algo nuevo»: entrar a este tablero cuenta como visita; su punto se apaga
    try { if (cur) { localStorage.setItem('yod_visto_' + cur, String(Date.now())); localStorage.removeItem('yod_nuevo_' + cur); } } catch (e) { }
    ajustaPegajosos();
    addEventListener('resize', ajustaPegajosos); setTimeout(ajustaPegajosos, 800); setTimeout(ajustaPegajosos, 2500); setTimeout(ajustaPegajosos, 6000);
    var _pegTick = 0; addEventListener('scroll', function () { if (_pegTick) return; _pegTick = setTimeout(function () { _pegTick = 0; ajustaPegajosos(); }, 250); }, { passive: true });
    wireBack();
    var out = document.getElementById('yodOut');
    if (out) out.addEventListener('click', function () { if (confirm('¿Cerrar tu sesión en este dispositivo?')) logout(); });
    // El menú NO se pinta hasta validar la sesión (fail-closed): queda "Cargando…"
    wireSearch();
    suscribirCargador_();
    loadIdentity();
    cargarChinche();
  }

  /* La Chinche en TODOS los tableros que envuelve el marco: mismo script que el OS
     (yod-portal/chinche.js), en modo "contexto" (DOM). Cada chinche guarda la tarjeta
     donde se picó por última vez y el repo de la página, para que el encargo llegue al
     repo correcto. Si el board ya la trae, no se carga dos veces. */
  var CHINCHE_V = "20261030-fase0";
  function cargarChinche() {
    if (window.YODChinche) return;
    var ultimo = null;
    document.addEventListener('pointerdown', function (e) { ultimo = e.target; }, true);
    function tarjeta() {
      var n = ultimo && ultimo.closest ? ultimo.closest('[data-card],article,section,.card,.panel') : null;
      if (!n) return '';
      var h = n.querySelector('h1,h2,h3,.card-title,.card-header,summary');
      return ((h && h.textContent) || n.getAttribute('data-card') || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    }
    var s = document.createElement('script');
    s.src = SELF.replace(/os\/shell\.js.*$/, 'chinche.js') + '?v=' + CHINCHE_V;
    s.onload = function () {
      try {
        if (window.YODChinche && window.YODChinche.inicializada) return;
        var pag = (location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/, '') || 'index';
        window.YODChinche && YODChinche.init({ pantalla: pag,
          vista: function () { return document.title || pag; },
          seccion: tarjeta,
          valores: function () { var t = ultimo && ultimo.textContent ? ultimo.textContent.replace(/\s+/g, ' ').trim().slice(0, 140) : ''; return t ? { picado: t } : {}; } });
      } catch (e) { }
    };
    if (typeof cargadorActivo_ === 'function' && cargadorActivo_()) { insertarDespues_(s); return; }
    document.head.appendChild(s);
  }
  // Con cargador, la chinche se baja DESPUÉS del primer dato (o a los 4 s), no compitiendo con él. Se inserta lo
  // que armó cargarChinche (s) y su onload corre cuando el cargador lo termina de bajar; si el cargador falla,
  // se inserta en el acto como siempre.
  function insertarDespues_(s) {
    var corrio = false;
    function alCargar() { if (corrio) return; corrio = true; try { s.onload(); } catch (e) { } }
    try {
      window.YodCargador.cargarDespues(s.src, { cuando: 'primer-dato', maxMs: 4000 }).then(function (el) {
        if (window.YODChinche) alCargar(); else if (el && el.addEventListener) el.addEventListener('load', alCargar, { once: true });
      }, function () { document.head.appendChild(s); });
    } catch (e) { document.head.appendChild(s); }
  }

  function wireBack() {
    var back = document.getElementById('yodBack');
    if (!back) return;
    var ref = document.referrer || '';
    var trusted = /^https:\/\/(?:alexpueblag\.github\.io|yodesarrollomx\.github\.io|tableros\.yodesarrollo\.mx|(?:www\.)?yodesarrollo\.mx)(?:\/|$)/i.test(ref);
    back.addEventListener('click', function () {
      if (trusted && history.length > 1) history.back();
      else location.href = OS;
    });
  }

  function wireDrawer(shell, scrim) {
    function open() { shell.classList.add('yod-nav-open'); }
    function close() { shell.classList.remove('yod-nav-open'); }
    function toggle() { shell.classList.toggle('yod-nav-open'); }
    // En móvil el menú se abre SOLO la primera vez de la sesión (para descubrirlo);
    // navegar entre tableros recarga la página, así que no lo reabrimos en cada carga.
    if (window.matchMedia && window.matchMedia('(max-width:900px)').matches) {
      var seen = false; try { seen = sessionStorage.getItem('yod_drawer_seen') === '1'; } catch (e) {}
      if (!seen) { open(); try { sessionStorage.setItem('yod_drawer_seen', '1'); } catch (e) {} }
    }
    var burger = document.getElementById('yodBurger');
    if (burger) burger.addEventListener('click', toggle);
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    // al tocar un tablero, cerrar el cajón (aunque navegue, se siente app-nativo)
    var nav = document.getElementById('yodNav');
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('.yod-nav-item')) close(); });
    // cerrar al pasar a escritorio
    if (window.matchMedia) window.matchMedia('(min-width:901px)').addEventListener('change', function (m) { if (m.matches) close(); });
  }

  function loadCatalog(cur) {
    if (typeof cargadorActivo_ === 'function' && cargadorActivo_()) return loadCatalogConCargador_(cur);
    var k = tok(), request = state.identityRequest;
    return fetch(PORTAL + (k ? '&k=' + encodeURIComponent(k) : '') + '&cb=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) {
        if(r.status===401||r.status===403)return {ok:false,error:'HTTP '+r.status};
        if(r.ok===false)throw new Error('HTTP '+r.status);
        return r.json();
      })
      .then(function (d) {
        if (request !== state.identityRequest || k !== tok() || state.identity !== 'ok') return;
        if (d && ((d.ok === true && d.actor !== 'SESSION') || (!d.ok && rechazoAcceso(d.error)))) {
          state.catalogRows=null;state.catalogIds=null;state.catalogUnavailable=true;applyNav();return;
        }
        if (!d || !d.ok || !Array.isArray(d.rows)) return;
        var rows = d.rows.filter(function (r) { return r && r.visible === 'SI' && r.system_id && DEST[r.system_id]; })
          .sort(function (a, b) { return Number(a.orden) - Number(b.orden); });
        writeCatIds(Array.isArray(d.known_system_ids) ? d.known_system_ids.filter(function(id){return typeof id==='string';}) : d.rows.map(function (r) { return r && r.system_id; }).filter(Boolean));
        writeCatCache(rows);state.catalogUnavailable=false;applyNav();
      }).catch(function () { });
  }
  function aplicaIdentidad(j) {
    state.role = String(j.rol || 'vista').trim().toLowerCase(); state.boards = j.boards || '';
    state.identity = 'ok'; pastilla('ok');
    var nm = j.nombre || j.correo || 'Equipo YOD';
    var persona = state.role === 'admin' ? 'direccion' : 'colaborador';
    set('yodName', nm); set('yodRole', persona === 'direccion' ? 'Dirección' : 'Colaborador');
    var av = document.getElementById('yodAv'); if (av) av.textContent = (nm.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('') || 'YO').toUpperCase();
    var chip = document.getElementById('yodChip'); if (chip) { chip.className = 'yod-role ' + persona; chip.textContent = persona === 'direccion' ? 'Dirección' : 'Colaborador'; chip.style.display = ''; }
    applyNav(); maybeLock();
  }
  function loadIdentity() {
    if (typeof cargadorActivo_ === 'function' && cargadorActivo_()) return loadIdentityConCargador_();
    var k = tok(), previous = state.sessionToken, request = ++state.identityRequest;
    var confirmedHere = !!k && previous === k && state.identity === 'ok';
    if (state.retryTimer) { clearTimeout(state.retryTimer); state.retryTimer = null; }
    // Solo conservar una identidad YA confirmada en esta carga. Una visita nueva
    // nunca recibe permisos desde localStorage o una caché de roles.
    if (!confirmedHere) {
      state.identity = k ? 'pending' : 'fail';state.role = '';state.boards = '';state.modules = [];
      state.catalogRows = null;state.catalogIds = null;state.catalogUnavailable = false;purgeAll();
      set('yodName', 'Equipo YOD');set('yodRole', k ? 'Validando acceso…' : 'Sin sesión');set('yodAv', 'YO');
      var chip = document.getElementById('yodChip');if(chip)chip.style.display='none';
      var results = document.getElementById('yodRes');if(results)results.replaceChildren();
      pastilla(k ? 'wait' : 'fail');applyNav();maybeLock();
    } else {
      pastilla('wait');set('yodRole', 'Sesión activa · verificando');
    }
    // Evita filtrar el estado de un board a otra persona.
    if (previous && previous !== k) { state.sessionToken = '';location.reload();return Promise.resolve(); }
    if (!k) { state.reconnectAttempts = 0;state.verifiedAt = 0;return Promise.resolve(); }
    return canjeConRelevo(k).then(function(j) {
      if (request !== state.identityRequest || k !== tok()) return;
      if (!j) throw new Error('sin-respuesta');
      if (j.ok !== true || j.token !== k || typeof j.rol !== 'string' || !j.rol.trim() || typeof j.boards !== 'string') {
        throw new Error(j.ok === false && j.error ? j.error : 'respuesta-invalida');
      }
      var identity = JSON.stringify([j.correo || '',j.nombre || '',j.rol || 'vista',j.boards || '']);
      if (state.sessionIdentity && state.sessionIdentity !== identity) {
        // Un cambio de rol/permisos/persona debe ocultar datos ANTES de recargar.
        state.identity = 'pending';state.role = '';state.boards = '';state.modules = [];
        state.sessionToken = '';purgeAll();applyNav();maybeLock();location.reload();return;
      }
      state.sessionIdentity = identity;state.sessionToken = k;
      state.verifiedAt = Date.now();state.reconnectAttempts = 0;
      aplicaIdentidad(j);return loadCatalog(currentSys());
    }).catch(function(err) {
      if (request !== state.identityRequest || k !== tok()) return;
      var reason = String(err && err.message || err || 'sin-respuesta').trim().toLowerCase();
      // Problemas de transporte NO son pruebas de revocación. Solo el rechazo
      // explícito del Portero invalida los permisos. Durante una caída el canje
      // se reintenta automáticamente, sin borrar la credencial de este dispositivo.
      var temporal = !rechazoAcceso(reason); // cualquier error no concluyente permite reconectar, sin conceder nuevos permisos
      if (temporal) {
        var fresh = reason !== 'respuesta-invalida' && confirmedHere && state.verifiedAt && Date.now() - state.verifiedAt < 5 * 60000;
        if (fresh) {
          // Gracia limitada para una identidad ya validada. El backend sigue
          // autorizando cada operación protegida; NO hay permisos offline nuevos.
          state.identity = 'ok';
          pastilla('wait');set('yodRole', 'Sesión activa · reconectando');
        } else {
          // Sin canje confirmado recientemente se ocultan datos privados,
          // pero no se obliga a entrar de nuevo: se espera al Portero.
          state.identity = 'pending';state.role = '';state.boards = '';state.modules = [];
          state.sessionToken = '';pastilla('wait');set('yodRole', 'Sin conexión · reintentando');
          applyNav();maybeLock();
        }
        state.reconnectAttempts = (state.reconnectAttempts || 0) + 1;
        var wait = Math.min(30000, 15000 * Math.pow(2, Math.min(5, state.reconnectAttempts - 1)));
        state.retryTimer = setTimeout(function() {
          state.retryTimer = null;
          if (request === state.identityRequest && tok() === k) loadIdentity();
        }, wait);
        return;
      }
      // Rechazo definitivo o respuesta inválida: cerrar el lienzo sin borrar
      // el token (el OS dueño de la sesión decide si debe pedir nuevo acceso).
      purgeAll();state.identity = 'fail';state.sessionToken = '';state.verifiedAt = 0;
      state.reconnectAttempts = 0;pastilla('fail');
      set('yodRole', rechazoAcceso(reason) ? 'Acceso vencido o retirado' : 'Validando acceso…');applyNav();maybeLock();
    });
  }
  // Rechazo definitivo (lo mismo que hace loadIdentity al recibirlo): se cierra el lienzo y se tira lo privado, sin
  // borrar el token (regla 5); lo único nuevo es que también se purgan las copias del cargador.
  function rechazoDefinitivo_(reason) {
    purgarCargador_();
    purgeAll(); state.identity = 'fail'; state.sessionToken = ''; state.verifiedAt = 0;
    state.reconnectAttempts = 0; pastilla('fail');
    set('yodRole', rechazoAcceso(reason) ? 'Acceso vencido o retirado' : 'Validando acceso…'); applyNav(); maybeLock();
  }
  // Copia deliberada de loadIdentity (ver nota del bloque). El orden es el de siempre: primero se cierra el
  // lienzo (carga en frío) y luego se pide el canje; si la respuesta es la copia guardada (origen:'cache') llega
  // por microtareas, aplicaIdentidad() → maybeLock() lo abre en la MISMA tarea (sin parpadeo ni esperar a la red)
  // y el cargador la revalida en segundo plano (sesionRefrescada_ / sesionRechazada_).
  async function loadIdentityConCargador_() {
    var k = tok(), previous = state.sessionToken, request = ++state.identityRequest;
    var confirmedHere = !!k && previous === k && state.identity === 'ok';
    if (state.retryTimer) { clearTimeout(state.retryTimer); state.retryTimer = null; }
    if (!confirmedHere) {
      state.identity = k ? 'pending' : 'fail';state.role = '';state.boards = '';state.modules = [];
      state.catalogRows = null;state.catalogIds = null;state.catalogUnavailable = false;purgeAll();
      set('yodName', 'Equipo YOD');set('yodRole', k ? 'Validando acceso…' : 'Sin sesión');set('yodAv', 'YO');
      var chip = document.getElementById('yodChip');if(chip)chip.style.display='none';
      var results = document.getElementById('yodRes');if(results)results.replaceChildren();
      pastilla(k ? 'wait' : 'fail');applyNav();maybeLock();
    } else {
      pastilla('wait');set('yodRole', 'Sesión activa · verificando');
    }
    if (previous && previous !== k) { state.sessionToken = '';location.reload();return; }
    if (!k) { state.reconnectAttempts = 0;state.verifiedAt = 0;return; }
    try {
      // ⟳, reintentos y sesión ya confirmada piden red; sólo la carga en frío puede salir de la copia guardada.
      var j = await canjeConRelevo(k, { fuerzaRed: confirmedHere || (state.reconnectAttempts || 0) > 0 });
      if (request !== state.identityRequest || k !== tok()) return;
      if (!j) throw new Error('sin-respuesta');
      if (j.ok !== true || j.token !== k || typeof j.rol !== 'string' || !j.rol.trim() || typeof j.boards !== 'string') {
        throw new Error(j.ok === false && j.error ? j.error : 'respuesta-invalida');
      }
      var identity = JSON.stringify([j.correo || '',j.nombre || '',j.rol || 'vista',j.boards || '']);
      if (state.sessionIdentity && state.sessionIdentity !== identity) {
        state.identity = 'pending';state.role = '';state.boards = '';state.modules = [];
        state.sessionToken = '';purgeAll();applyNav();maybeLock();location.reload();return;
      }
      state.sessionIdentity = identity;state.sessionToken = k;
      // verifiedAt dice la verdad: una identidad de copia guardada tiene la edad de la copia, no la de ahora
      state.verifiedAt = Date.now() - (j.origen === 'cache' ? Math.max(0, Number(j.edadMs) || 0) : 0);state.reconnectAttempts = 0;
      aplicaIdentidad(j);
      return await loadCatalog(currentSys());
    } catch (err) {
      if (request !== state.identityRequest || k !== tok()) return;
      var reason = String(err && err.message || err || 'sin-respuesta').trim().toLowerCase();
      var temporal = !rechazoAcceso(reason);
      if (temporal) {
        var fresh = reason !== 'respuesta-invalida' && confirmedHere && state.verifiedAt && Date.now() - state.verifiedAt < 5 * 60000;
        if (fresh) {
          state.identity = 'ok';
          pastilla('wait');set('yodRole', 'Sesión activa · reconectando');
        } else {
          state.identity = 'pending';state.role = '';state.boards = '';state.modules = [];
          state.sessionToken = '';pastilla('wait');set('yodRole', 'Sin conexión · reintentando');
          applyNav();maybeLock();
        }
        state.reconnectAttempts = (state.reconnectAttempts || 0) + 1;
        var wait = Math.min(30000, 15000 * Math.pow(2, Math.min(5, state.reconnectAttempts - 1)));
        state.retryTimer = setTimeout(function() {
          state.retryTimer = null;
          if (request === state.identityRequest && tok() === k) loadIdentity();
        }, wait);
        return;
      }
      rechazoDefinitivo_(reason);
    }
  }
  // Resultado FRESCO de la revalidación en segundo plano (yodcargador:sesion): si cambió quién eres o qué puedes
  // ver, se oculta todo ANTES de recargar (igual que loadIdentity); si no, sólo se anota que ya es verdad de ahora.
  function sesionRefrescada_(d) {
    var k = tok();
    if (!d || d.ok !== true || !k || state.identity !== 'ok' || state.sessionToken !== k) return;
    if (d.token !== undefined && d.token !== k) return;
    if (typeof d.rol !== 'string' || !d.rol.trim() || typeof d.boards !== 'string') return;
    var identity = JSON.stringify([d.correo || '',d.nombre || '',d.rol || 'vista',d.boards || '']);
    state.verifiedAt = Date.now();
    if (state.sessionIdentity && state.sessionIdentity !== identity) {
      state.identity = 'pending';state.role = '';state.boards = '';state.modules = [];
      state.sessionToken = '';purgeAll();applyNav();maybeLock();location.reload();
    }
  }
  // El Portero rechazó, en segundo plano, la sesión con la que se destrabó el tablero: el mismo trato que un
  // rechazo explícito del canje (cierra el lienzo, sin borrar el token) más la purga de las copias del cargador.
  function sesionRechazada_(d) {
    var k = tok();
    if (!k || !d || (d.token && d.token !== k)) return;
    if (state.retryTimer) { clearTimeout(state.retryTimer); state.retryTimer = null; }
    state.identityRequest++;
    rechazoDefinitivo_(String(d.error || 'revocado').trim().toLowerCase());
  }
  function suscribirCargador_() {
    var c = window.YodCargador;
    if (!cargadorActivo_() || state.cargadorSuscrito || !c.sesion || typeof c.sesion.alCambiar !== 'function') return;
    state.cargadorSuscrito = true; configurarCatalogo_();
    c.sesion.alCambiar(function (ev) {
      var tipo = String(ev && ev.type || ''), d = (ev && ev.detail) || {};
      if (tipo === 'yodcargador:sesion-rechazada') sesionRechazada_(d);
      else if (tipo === 'yodcargador:sesion') sesionRefrescada_(d);
      // 'sesion-cerrada' y el 'storage' de otra pestaña ya los atiende este marco (logout, addEventListener('storage'))
    });
  }
  function aplicaCatalogo_(d) {
    var rows = d.rows.filter(function (r) { return r && r.visible === 'SI' && r.system_id && DEST[r.system_id]; })
      .sort(function (a, b) { return Number(a.orden) - Number(b.orden); });
    writeCatIds(Array.isArray(d.known_system_ids) ? d.known_system_ids.filter(function(id){return typeof id==='string';}) : d.rows.map(function (r) { return r && r.system_id; }).filter(Boolean));
    writeCatCache(rows);state.catalogUnavailable=false;applyNav();
  }
  // Copia deliberada de loadCatalog: el menú se pinta YA desde la última copia buena (alViejo) y se refresca en
  // segundo plano; mismas guardas que la respuesta en vivo (actor SESSION, visible==='SI', DEST).
  function loadCatalogConCargador_(cur) {
    var k = tok(), request = state.identityRequest, c = window.YodCargador;
    function vigente() { return request === state.identityRequest && k === tok() && state.identity === 'ok'; }
    function conSesion(d) { return !!(d && d.ok === true && d.actor === 'SESSION' && Array.isArray(d.rows)); }
    // El catálogo jamás tira la identidad: si el cargador truena al pedirlo, el menú se queda como estaba.
    try {
      configurarCatalogo_();
      return c.catalogo({ token: k, alViejo: function (d) { if (vigente() && conSesion(d)) aplicaCatalogo_(d); } })
        .then(function (r) {
          // Una copia que el backend firmó SIN sesión no sirve: una vez, en vivo y sin caché.
          if (vigente() && r && r.origen === 'cache' && r.data && !conSesion(r.data)) {
            return c.get(CATALOG_BASE, { action: 'read', resource: 'Portal', k: k }, { viejoMs: 0, frescoMs: 0, telemetria: 'catalogo' });
          }
          return r;
        })
        .then(function (r) {
          if (!vigente()) return;
          var d = r && r.data;
          if (!d && r && (r.status === 401 || r.status === 403)) d = { ok: false, error: 'HTTP ' + r.status };
          if (d && ((d.ok === true && d.actor !== 'SESSION') || (!d.ok && rechazoAcceso(d.error)))) {
            state.catalogRows=null;state.catalogIds=null;state.catalogUnavailable=true;applyNav();return;
          }
          if (!d || !d.ok || !Array.isArray(d.rows)) return;
          aplicaCatalogo_(d);
        }).catch(function () { });
    } catch (e) { return Promise.resolve(); }
  }
  window.addEventListener('storage',function(e){if(e.key===LSC||e.key===null)loadIdentity();});
  window.addEventListener('focus',function(){if(state.sessionToken!==tok())loadIdentity();});

  function wireSearch() {
    var trig = document.getElementById('yodSearch'); if (!trig) return;
    var dlg = el('dialog', 'yod-dialog');
    dlg.innerHTML = '<form method="dialog"><i class="ti ti-search" style="color:var(--ymuted);font-size:20px"></i><input id="yodQ" type="search" placeholder="Buscar tablero, código o proyecto (RM, Miramar…)" autocomplete="off"><button value="cancel" type="submit" style="border:0;background:none;cursor:pointer;color:var(--ymuted);font-size:19px"><i class="ti ti-x"></i></button></form><div class="yr" id="yodRes"></div>';
    document.body.appendChild(dlg);
    function results(q) {
      var box = document.getElementById('yodRes'); if (!box) return; box.innerHTML = '';
      var t = (q || '').toLowerCase();
      state.modules.filter(function (r) { return vivo(r) && (!t || [moduleTitle(r), r.titulo_portal || NAME[r.system_id] || '', NAME[r.system_id] || '', (CODES[r.system_id] || []).join(' ')].join(' ').toLowerCase().indexOf(t) >= 0); }).forEach(function (r) {
        var url = enlace(r); if (!url) return;
        var a = el('a'); a.href = url; a.setAttribute('rel', 'noopener'); if(!esPropioShell(url)) a.setAttribute('target','_blank');
        a.innerHTML = '<i class="ti ti-' + (ICON[r.system_id] || 'layout-dashboard') + '"></i><span><strong>' + esc(moduleTitle(r)) + '</strong></span>';
        box.appendChild(a);
      });
      // OS-2 · también proyectos por folio o nombre (registro os/proyectos.js)
      var RP = window.YodProyectos;
      if (RP && t) RP.lista.filter(function (p) {
        return canOpenProject(p) && [p.folio, p.codigo, p.nombre].concat(p.alias || []).join(' ').toLowerCase().indexOf(t) >= 0;
      }).forEach(function (p) {
        var a = el('a'); a.href = p.tablero;
        a.innerHTML = '<i class="ti ti-folder"></i><span><strong>' + esc(p.nombre) + '</strong> <small style="opacity:.6">' + esc(p.folio) + ' · ' + esc(p.etapa_actual || '') + '</small></span>';
        box.appendChild(a);
      });
      if (!box.children.length) {
        box.innerHTML = '<span class="yod-nav-loading">' +
          (state.identity === 'ok' ? 'Sin tableros con ese nombre' : 'Sesión por validar') + '</span>';
      }
    }
    function open() { results(''); if (dlg.showModal) dlg.showModal(); setTimeout(function () { var q = document.getElementById('yodQ'); if (q) q.focus(); }, 0); }
    trig.addEventListener('click', open);
    dlg.addEventListener('input', function (e) { results(e.target.value); });
    // Enter abre el primer resultado (antes el envío implícito solo cerraba el diálogo).
    var frm = dlg.querySelector('form');
    if (frm) frm.addEventListener('submit', function (e) {
      if (e.submitter && e.submitter.value === 'cancel') return;
      var first = dlg.querySelector('#yodRes a');
      if (!first) return;
      e.preventDefault(); if (dlg.close) dlg.close(); location.href = first.href;
    });
    document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
