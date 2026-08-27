/* ==========================================================================
   YOD OS · Shell compartido (shell.js) — la CARA única para todos los boards.
   Se carga como portero.js. Envuelve el contenido existente del board en el
   chrome de YOD OS (barra lateral de tableros + topbar con buscador ⌘K +
   identidad/rol), sin tocar la lógica ni los datos del board.
   Requiere shell.css y la webfont Tabler (ti ti-*).
   ========================================================================== */
(function () {
  'use strict';
  if (window.__YOD_SHELL__) return; window.__YOD_SHELL__ = 1;
  // Embebido dentro de la máscara del OS: el marco ya lo pone el padre.
  try { if (/[?&]embed=1/.test(location.search)) return; } catch (e) { }

  var LSC = 'pyod_clave_v1';
  var PORTAL = 'https://script.google.com/macros/s/AKfycby5LKYKRwl0EsNgppOIeD_ArST8vSXRgNO4ns8XZbFW4yjfglzu4io_vhabB8h-J792Tw/exec?action=read&resource=Portal';
  /* El marco que envuelve TODOS los tableros tenía su propio portero apuntando
     al del dominio suspendido. Con la suscripción caída, su canje fallaba y el
     usuario quedaba en "Sesión por validar" aunque el gate ya lo hubiera dejado
     entrar. Ahora usa el mismo relevo que el resto: original, y si falla, respaldo. */
  var PORTERO_ORIGINAL = 'https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec';
  var PORTERO_RESPALDO = 'https://script.google.com/macros/s/AKfycbyrhqMb70Qh8BljAOYnSYBZ8IXUuEclFWPg10NWIv3GJ-nAR597OTsGB4IL-xyUl7Ms/exec';
  /* El ORIGINAL siempre primero; el respaldo solo si aquel falla en esta
     llamada. Antes el relevo se pegaba en localStorage y, al reactivarse
     Google, el navegador seguía en el respaldo (que no conoce los correos ni
     el login de Google). Limpiamos ese resto de la emergencia. */
  try { localStorage.removeItem('pyod_portero'); } catch (e) { }
  function canjeConRelevo(k) {
    function intenta(base) {
      return fetch(base + '?recurso=canje&t=' + encodeURIComponent(k), { cache: 'no-store', credentials: 'omit' })
        .then(function (r) { return r.text(); })
        .then(function (t) { try { return JSON.parse(t); } catch (e) { return null; } });
    }
    return intenta(PORTERO_ORIGINAL).then(function (j) {
      if (j && j.ok) return j;
      return intenta(PORTERO_RESPALDO);
    }).catch(function () { return intenta(PORTERO_RESPALDO).catch(function () { return null; }); });
  }
  var OS = 'https://alexpueblag.github.io/yod-portal/os/';
  var CORPORATE = 'https://yodesarrollo.mx/';
  var DEST = {
    'SYS-POTENCIALES': 'https://alexpueblag.github.io/potenciales-yod/',
    'SYS-TRACK': 'https://alexpueblag.github.io/yod-portal/track-codesarrollos.html',
    'SYS-MIRAMAR': 'https://alexpueblag.github.io/real-miramar-board/',
    'SYS-TAREAS': 'https://alexpueblag.github.io/board-aurum/',
    'SYS-FLUJO': 'https://alexpueblag.github.io/board-flujo-yod/',
    'SYS-INTERIORES': 'https://alexpueblag.github.io/interiores-aurum/',
    'SYS-INVERSION': 'https://alexpueblag.github.io/yodesarrollo-board/',
    'SYS-MARKETING': 'https://alexpueblag.github.io/aurum-board/',
    'SYS-OBRA': 'https://alexpueblag.github.io/yod-portal/obra.html'
  };
  var ICON = { 'SYS-POTENCIALES': 'map-2', 'SYS-TRACK': 'route', 'SYS-MIRAMAR': 'building-community', 'SYS-TAREAS': 'checklist', 'SYS-FLUJO': 'wallet', 'SYS-INTERIORES': 'armchair-2', 'SYS-INVERSION': 'presentation-analytics', 'SYS-MARKETING': 'speakerphone', 'SYS-OBRA': 'building-skyscraper' };
  /* Los títulos oficiales viven en la pestaña Portal del Control Maestro
     (titulo_portal); estos son solo el respaldo si aquella no contesta.
     Deben decir LO MISMO que el Sheet — si renombras allá, renombra acá. */
  var NAME = { 'SYS-POTENCIALES': 'PPP', 'SYS-TRACK': 'Codesarrollos', 'SYS-MIRAMAR': 'Real de Miramar', 'SYS-TAREAS': 'MOAC', 'SYS-FLUJO': 'Flujo', 'SYS-INTERIORES': 'AURUM', 'SYS-INVERSION': 'Codesarrolladores', 'SYS-MARKETING': 'Embudo comercial', 'SYS-OBRA': 'Obra en vivo' };
  // Códigos por tablero — MISMA matriz que YOD OS (access-policy.js). El menú
  // solo enseña lo que tu sesión permite; el muro real sigue siendo cada backend.
  var CODES = {
    'SYS-POTENCIALES': ['PT', 'MP', 'MA', 'MX', 'UN', 'RE', 'PA'],
    'SYS-TRACK': ['CO', 'TC'],
    'SYS-MIRAMAR': ['RM'],
    'SYS-TAREAS': ['TA'],
    'SYS-FLUJO': ['FL'],
    'SYS-INTERIORES': ['IN'],
    'SYS-INVERSION': ['IV'],
    'SYS-MARKETING': ['MK'],
    'SYS-OBRA': ['OB']
  };
  // identity: 'pending' (validando) | 'ok' (canje válido) | 'fail' (sin sesión o canje falló)
  var state = { role: '', boards: '', modules: [], identity: 'pending', catalogRows: null };

  /* El menú se veía distinto en cada tablero: cada carga corría la carrera
     GAS-vs-respaldo de nuevo y a veces ganaba uno, a veces el otro (2 tableros
     "MOAC" vs 8 tableros "Operación"). Guardamos el último catálogo bueno para
     arrancar SIEMPRE con los títulos del Sheet, y la red solo refresca. */
  var CATCACHE = 'yod_portal_cat_v1';
  function readCatCache() {
    try {
      var raw = localStorage.getItem(CATCACHE); if (!raw) return null;
      var rows = JSON.parse(raw);
      return (Array.isArray(rows) && rows.length) ? rows : null;
    } catch (e) { return null; }
  }
  function writeCatCache(rows) {
    try { localStorage.setItem(CATCACHE, JSON.stringify(rows)); } catch (e) { }
  }

  function boardsList() { return String(state.boards || '').toUpperCase().split(/[,|; ]+/).filter(Boolean); }
  function canOpen(sys) {
    if (state.identity !== 'ok') return false;   // fail-closed: sin sesión validada, el menú no enseña nada
    if (state.role === 'admin') return true;
    var l = boardsList();
    if (l.indexOf('*') > -1) return true;
    var req = CODES[sys] || [];
    for (var i = 0; i < req.length; i++) { if (l.indexOf(req[i]) > -1) return true; }
    return false;
  }

  function tok() { try { return localStorage.getItem(LSC) || ''; } catch (e) { return ''; } }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function set(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
  function currentSys() { var here = location.href, best = ''; Object.keys(DEST).forEach(function (k) { if (here.indexOf(DEST[k].replace(/\/$/, '')) === 0) best = k; }); return best; }

  function defaultRows() { return Object.keys(DEST).map(function (k) { return { system_id: k, titulo_portal: NAME[k] }; }); }
  function navItem(row, cur) {
    var url = DEST[row.system_id]; if (!url) return null;
    var a = el('a', 'yod-nav-item' + (row.system_id === cur ? ' active' : ''));
    a.href = url; a.setAttribute('rel', 'noopener');
    a.innerHTML = '<i class="ti ti-' + (ICON[row.system_id] || 'layout-dashboard') + '"></i><span>' + esc(row.titulo_portal || NAME[row.system_id] || row.system_id) + '</span>';
    return a;
  }
  function renderNav(rows, cur) {
    var box = document.getElementById('yodNav'); if (!box) return; box.innerHTML = '';
    state.modules = rows;
    rows.forEach(function (r) { var n = navItem(r, cur); if (n) box.appendChild(n); });
    if (!box.children.length) box.innerHTML = '<span class="yod-nav-loading">Sin tableros</span>';
  }

  // Pinta el menú SOLO con los tableros de esta sesión (misma decisión que YOD OS).
  // Mientras la identidad no valide, se queda en "Cargando…" — nunca se enseña de más.
  function applyNav() {
    var cur = currentSys();
    if (state.identity === 'pending') return;
    if (state.identity === 'fail') {
      var box = document.getElementById('yodNav');
      if (box) box.innerHTML = '<span class="yod-nav-loading">Sesión por validar</span>';
      state.modules = [];
      return;
    }
    var rows = (state.catalogRows && state.catalogRows.length) ? state.catalogRows : (readCatCache() || defaultRows());
    renderNav(rows.filter(function (r) { return canOpen(r.system_id); }), cur);
  }

  // Cachés de datos que cada board guarda en localStorage (origen compartido:
  // alexpueblag.github.io). Cuando cae el candado se purgan los del board
  // negado, para que en un dispositivo compartido no queden datos de otra
  // persona visibles sin permiso.
  var DATA_CACHES = {
    'SYS-TAREAS': ['aurum-cache-v5'],
    'SYS-MIRAMAR': ['rm_cache_v3', 'rm_fin_v1'],
    'SYS-INTERIORES': ['aurum_cache_v1', 'aurum_postq_v1'],
    'SYS-INVERSION': ['ydr_board_data_v1'],
    'SYS-MARKETING': ['aurum_board_q_v1']
  };
  function purgeCaches(sys) {
    (DATA_CACHES[sys] || []).forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
  }
  function purgeAll() {
    Object.keys(DATA_CACHES).forEach(function (s) { purgeCaches(s); });
  }
  // Cerrar sesión: borra credencial + TODOS los cachés de datos y vuelve al OS.
  // Vital en dispositivos compartidos (una tablet del equipo) para no dejar
  // la sesión ni los datos de una persona al alcance de la siguiente.
  function logout() {
    try { localStorage.removeItem(LSC); sessionStorage.removeItem('pyod_rol'); sessionStorage.removeItem('yod_id_v1'); localStorage.removeItem('yod_pulse_v1'); } catch (e) { }
    purgeAll();
    location.href = OS;
  }

  // Candado de página: si el canje validó y este tablero NO está en tus accesos,
  // se tapa el contenido y se purga su caché local. (El muro real es el backend
  // del board — esto es la cara honesta de ese muro, para que no parezca que
  // "entraste" y para que no queden datos cacheados en el dispositivo.)
  function maybeLock() {
    var cur = currentSys();
    if (!cur || state.identity !== 'ok' || canOpen(cur)) return;
    purgeCaches(cur);
    var canvas = document.querySelector('.yod-canvas');
    if (canvas) canvas.style.display = 'none';
    var main = document.querySelector('.yod-main');
    if (main && !document.getElementById('yodLock')) {
      var lock = el('div', 'yod-lock');
      lock.id = 'yodLock';
      lock.innerHTML = '<i class="ti ti-shield-lock"></i><h2>' + esc(NAME[cur] || 'Este tablero') + ' no está en tus accesos</h2>'
        + '<p>Tu sesión es válida, pero este tablero no forma parte de tus permisos. Si lo necesitas, pídelo a Dirección.</p>'
        + '<a href="' + OS + '"><i class="ti ti-home-2"></i> Volver a YOD OS</a>';
      main.appendChild(lock);
    }
  }

  function boot() {
    if (document.querySelector('.yod-shell')) return;
    document.body.classList.add('yod-on');
    var cur = currentSys();
    var canvas = el('div', 'yod-canvas');
    while (document.body.firstChild) { canvas.appendChild(document.body.firstChild); }

    var side = el('aside', 'yod-sidebar');
    side.innerHTML = '<a class="yod-brand" href="' + CORPORATE + '" title="Ir a yodesarrollo.mx" aria-label="YOD, ir a yodesarrollo.mx"><b>YOD</b><span>OS</span></a>'
      + '<nav class="yod-nav"><a class="yod-nav-item yod-os-link" href="' + OS + '"><i class="ti ti-layout-dashboard"></i><span>Inicio YOD OS</span></a><p class="yod-nav-label">Tableros</p><div id="yodNav"><span class="yod-nav-loading"><i class="ti ti-loader-2 yod-spin"></i> Cargando…</span></div></nav>'
      + '<div class="yod-foot"><div class="yod-avatar" id="yodAv">YO</div><div class="yod-id"><strong id="yodName">Equipo YOD</strong><span id="yodRole">Verificando…</span></div><button class="yod-out" id="yodOut" type="button" title="Cerrar sesión" aria-label="Cerrar sesión"><i class="ti ti-logout"></i></button></div>';

    var main = el('main', 'yod-main');
    var top = el('header', 'yod-topbar');
    top.innerHTML = '<button class="yod-burger" id="yodBurger" type="button" aria-label="Abrir tableros"><i class="ti ti-menu-2"></i></button>'
      + '<button class="yod-back" id="yodBack" type="button" title="Volver a la pantalla anterior" aria-label="Volver a la pantalla anterior"><i class="ti ti-arrow-left"></i><span>Atrás</span></button>'
      + '<a class="yod-topbrand" href="' + CORPORATE + '" title="Ir a yodesarrollo.mx" aria-label="YOD, ir a yodesarrollo.mx"><b>YOD</b><span>OS</span></a>'
      + '<button class="yod-search" id="yodSearch" type="button"><i class="ti ti-search"></i><span>Buscar un tablero…</span><kbd>⌘ K</kbd></button>'
      + '<div class="yod-top-actions"><span class="yod-role" id="yodChip" style="display:none"></span><a class="yod-home" href="' + OS + '" title="Subir a YOD OS" aria-label="Subir a YOD OS"><i class="ti ti-home-2"></i><span>YOD OS</span></a></div>';
    main.appendChild(top); main.appendChild(canvas);

    var shell = el('div', 'yod-shell'); shell.appendChild(side); shell.appendChild(main);
    var scrim = el('div', 'yod-scrim'); shell.appendChild(scrim);
    document.body.appendChild(shell);

    wireDrawer(shell, scrim);
    wireBack();
    var out = document.getElementById('yodOut');
    if (out) out.addEventListener('click', function () { if (confirm('¿Cerrar tu sesión en este dispositivo?')) logout(); });
    // El menú NO se pinta hasta validar la sesión (fail-closed): queda "Cargando…"
    wireSearch();
    loadIdentity();
    loadCatalog(cur);
  }

  function wireBack() {
    var back = document.getElementById('yodBack');
    if (!back) return;
    var ref = document.referrer || '';
    var trusted = /^https:\/\/(?:alexpueblag\.github\.io|(?:www\.)?yodesarrollo\.mx)(?:\/|$)/i.test(ref);
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
    var k = tok();
    fetch(PORTAL + (k ? '&k=' + encodeURIComponent(k) : '') + '&cb=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok || !Array.isArray(d.rows)) return;
        var rows = d.rows.filter(function (r) { return r && r.visible === 'SI' && r.system_id && DEST[r.system_id]; })
          .sort(function (a, b) { return Number(a.orden) - Number(b.orden); });
        if (rows.length) { state.catalogRows = rows; writeCatCache(rows); applyNav(); }
      }).catch(function () { });
  }
  function aplicaIdentidad(j) {
    state.role = j.rol || 'vista'; state.boards = j.boards || '';
    state.identity = 'ok';
    var nm = j.nombre || j.correo || 'Equipo YOD';
    var persona = state.role === 'admin' ? 'direccion' : 'colaborador';
    set('yodName', nm); set('yodRole', persona === 'direccion' ? 'Dirección' : 'Colaborador');
    var av = document.getElementById('yodAv'); if (av) av.textContent = (nm.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('') || 'YO').toUpperCase();
    var chip = document.getElementById('yodChip'); if (chip) { chip.className = 'yod-role ' + persona; chip.textContent = persona === 'direccion' ? 'Dirección' : 'Colaborador'; chip.style.display = ''; }
    applyNav(); maybeLock();
  }
  function loadIdentity() {
    var k = tok();
    if (!k) { state.identity = 'fail'; set('yodRole', 'Requiere acceso'); applyNav(); return; }
    /* Velocidad: la identidad ya validada en esta pestaña pinta el menú AL
       INSTANTE; el canje corre en fondo y solo corrige o cierra si cambió. */
    var cacheado = null;
    try { var r = sessionStorage.getItem('yod_id_v1'); cacheado = r ? JSON.parse(r) : null; } catch (e) { }
    if (cacheado && cacheado.rol) aplicaIdentidad(cacheado);
    canjeConRelevo(k)
      .then(function (j) {
        if (!j || !j.ok) throw 0;
        try { sessionStorage.setItem('yod_id_v1', JSON.stringify({ ok: true, rol: j.rol || 'vista', boards: j.boards || '', nombre: j.nombre || '', correo: j.correo || '' })); } catch (e) { }
        aplicaIdentidad(j);
      }).catch(function () {
        try { sessionStorage.removeItem('yod_id_v1'); } catch (e) { }
        if (cacheado) purgeAll();
        state.identity = 'fail'; set('yodRole', 'Sesión por validar'); applyNav();
      });
  }

  function wireSearch() {
    var trig = document.getElementById('yodSearch'); if (!trig) return;
    var dlg = el('dialog', 'yod-dialog');
    dlg.innerHTML = '<form method="dialog"><i class="ti ti-search" style="color:var(--ymuted);font-size:20px"></i><input id="yodQ" type="search" placeholder="Buscar tablero…" autocomplete="off"><button value="cancel" type="submit" style="border:0;background:none;cursor:pointer;color:var(--ymuted);font-size:19px"><i class="ti ti-x"></i></button></form><div class="yr" id="yodRes"></div>';
    document.body.appendChild(dlg);
    function results(q) {
      var box = document.getElementById('yodRes'); if (!box) return; box.innerHTML = '';
      var t = (q || '').toLowerCase();
      state.modules.filter(function (r) { return !t || String(r.titulo_portal || NAME[r.system_id] || '').toLowerCase().indexOf(t) >= 0; }).forEach(function (r) {
        var url = DEST[r.system_id]; if (!url) return;
        var a = el('a'); a.href = url; a.setAttribute('rel', 'noopener');
        a.innerHTML = '<i class="ti ti-' + (ICON[r.system_id] || 'layout-dashboard') + '"></i><span><strong>' + esc(r.titulo_portal || NAME[r.system_id]) + '</strong></span>';
        box.appendChild(a);
      });
    }
    function open() { results(''); if (dlg.showModal) dlg.showModal(); setTimeout(function () { var q = document.getElementById('yodQ'); if (q) q.focus(); }, 0); }
    trig.addEventListener('click', open);
    dlg.addEventListener('input', function (e) { results(e.target.value); });
    document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
