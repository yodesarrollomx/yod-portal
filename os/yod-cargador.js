/* ==========================================================================
   YOD OS · Cargador compartido — os/yod-cargador.js (Fase 1 · entrega 2, 31-oct-2026)
   Un solo canje de sesión, un solo transporte y una sola caché para la cabina, el
   marco (shell.js) y los motores PPP. Va después de yod-acceso.js y antes del código
   de la página; portero.js y shell.js lo usan SI está, nunca lo exigen.
   Reglas: sólo lectura (ningún POST) · sólo el Portero ORIGINAL (el respaldo contesta
   404 desde el 23-sep) · el token no se guarda en llaves propias, sólo su hash h ·
   reversión: ?cargador=legacy o localStorage yodcg_legacy = '1'.
   ========================================================================== */
(function (raiz) {
  'use strict';
  function crear(env) {
    var K_CLAVE = 'pyod_clave_v1', K_SES = 'yodcg_sesion_v1', K_TEL = 'yodcg_telemetria_v1', P_CACHE = 'yodcg_cache_v1:';
    var ESPERA = 1500, cfg = { catalogo: null, timeoutMs: 25000, timeoutFrioMs: 75000, frescoMs: 600000, viejoMs: 43200000 }; // sesión 12 h; reintento del canje 75 s
    var vuelo = {}, fondo = {}, vistos = {}, pend = [], marcas = {}, cargados = {}, yaPD = false, frio = true, accesoListo = null, avisado = '', DISP = dispositivo();
    var loc = env.location || {}, doc = env.document, perf = env.performance, ls = null;
    try { ls = env.storage !== undefined ? env.storage : env.localStorage; } catch (e) { } // localStorage puede lanzar (cookies bloqueadas)
    var ahora = typeof env.now === 'function' ? env.now : Date.now, T0 = ahora();
    var reloj = perf && typeof perf.now === 'function' ? function () { return perf.now(); } : function () { return ahora() - T0; };
    var CE = env.CustomEvent || (typeof CustomEvent === 'function' ? CustomEvent : null); // sin CE, emitir falla en silencio
    var AC = env.AbortController || (typeof AbortController === 'function' ? AbortController : null);
    function st(f, ms) { return (env.setTimeout || setTimeout).call(env, f, ms); }
    function ct(t) { return (env.clearTimeout || clearTimeout).call(env, t); }
    function aviso(e) { try { console.warn('[YOD cargador]', e && e.message || e); } catch (x) { } }
    function copia(o) { return Object.assign({}, o); }
    function emitir(n, d) { try { env.dispatchEvent(new CE(n, { detail: d })); } catch (e) { } }

    /* FNV-1a de 32 bits en hex: identifica la sesión en las llaves sin guardar el token. */
    function hash(s) {
      var h = 0x811c9dc5; s = String(s == null ? '' : s);
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      return ('0000000' + h.toString(16)).slice(-8);
    }

    /* ---------- almacenamiento (todo en try/catch; sin él, sin caché) ---------- */
    function lsGet(k) { try { return ls ? ls.getItem(k) : null; } catch (e) { return null; } }
    function lsDel(k) { try { if (ls) ls.removeItem(k); } catch (e) { } }
    function leer(k) { try { var v = lsGet(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
    function claves(pre) {
      var r = [];
      try { for (var i = 0, n = ls.length; i < n; i++) { var k = ls.key(i); if (k && k.indexOf(pre) === 0) r.push(k); } } catch (e) { }
      return r;
    }
    function podar() { // cuota llena: fuera la mitad más vieja de las cachés
      var xs = claves(P_CACHE).map(function (k) { var o = leer(k); return { k: k, ts: o && o.ts || 0 }; }).sort(function (a, b) { return a.ts - b.ts; });
      xs.slice(0, Math.max(1, xs.length >> 1)).forEach(function (x) { lsDel(x.k); });
    }
    function lsSet(k, v, sinPoda) { // sinPoda: lo secundario (telemetría) no expulsa cachés de datos
      if (!ls) return false;
      try { ls.setItem(k, v); return true; } catch (e) { }
      if (sinPoda) return false;
      podar();
      try { ls.setItem(k, v); return true; } catch (e) { return false; }
    }
    function escribir(k, o, sinPoda) { try { return lsSet(k, JSON.stringify(o), sinPoda); } catch (e) { return false; } }
    function purgar() { claves(P_CACHE).forEach(lsDel); lsDel(K_SES); }

    /* ---------- página, reversión, rechazos ---------- */
    var MAPA = { index: 'PT', mapa: 'MP', macrolotes: 'MA', mixto: 'MX', unifamiliar: 'UN', residencial: 'RE', patrimonial: 'PA', accesos: 'AC', tablero: 'TB', obra: 'OB', 'track-alysa': 'TA', 'track-maria': 'TM', 'track-codesarrollos': 'TC' };
    var MIRAMAR = { index: 'MR', tramites: 'MT', direccion: 'MD', evidencia: 'ME', cuentas: 'MC' };
    function pagina() { // mismo criterio que portero.js; la cabina (os/index) es OS
      var p = String(loc.pathname || '/'), seg = p.split('/'), f = (seg.pop() || 'index.html').replace(/\.html$/, '') || 'index';
      if (f === 'index' && seg[seg.length - 1] === 'os') return 'OS';
      var m = (/real-miramar-board/.test(p) ? MIRAMAR : MAPA)[f];
      return typeof m === 'string' ? m : /real-miramar-board/.test(p) ? 'M' + f.slice(0, 1).toUpperCase() : f.slice(0, 2).toUpperCase();
    }
    var legacy = /[?&#]cargador=legacy(?=$|[&#])/.test((loc.search || '') + '&' + (loc.hash || '')) || lsGet('yodcg_legacy') === '1';
    var RECHAZOS = ['liga', 'clave', 'expirado', 'revocado', 'sin_sesion', 'sin_acceso', 'sin acceso', 'denegado', 'no autorizado', 'unauthorized', 'forbidden', 'http 401', 'http 403'];
    function esRechazo(x) {
      if (typeof x === 'number') return x === 401 || x === 403;
      if (x && typeof x === 'object' && (x.status === 401 || x.status === 403)) return true;
      var s = x && typeof x === 'object' ? (x.error != null ? x.error : x.message) : x;
      return RECHAZOS.indexOf(String(s == null ? '' : s).trim().toLowerCase()) >= 0;
    }

    /* ---------- transporte: GET con plazo sobre cabeceras y cuerpo ---------- */
    function qs(p, sin) {
      return Object.keys(p || {}).filter(function (k) { return p[k] != null && !(sin && sin.indexOf(k) >= 0); })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&');
    }
    function unir(url, p) { var q = qs(p); return q ? url + (url.indexOf('?') < 0 ? '?' : '&') + q : url; }
    function pausa(ms) { return new Promise(function (ok) { st(ok, ms); }); }
    /* Plazo de todo trabajo de red: pasado ms → 'timeout' y se aborta la señal; si hacer(signal, listo) rechaza → 'red'. */
    function conPlazo(ms, hacer) {
      return new Promise(function (resolve) {
        var ctl = AC ? new AC() : null, fin = false, t;
        function listo(r) { if (fin) return; fin = true; ct(t); resolve(r); }
        t = st(function () { listo({ ok: false, error: 'timeout' }); if (ctl) { try { ctl.abort(); } catch (e) { } } }, ms);
        Promise.resolve().then(function () { return hacer(ctl ? ctl.signal : undefined, listo); }).catch(function () { listo({ ok: false, error: 'red' }); });
      });
    }
    function intento(url, ms) {
      return conPlazo(ms, function (signal, listo) {
        var opt = { cache: 'no-store', credentials: 'omit' }; if (signal) opt.signal = signal;
        return Promise.resolve(env.fetch(url, opt)).then(function (r) {
          var s = Number(r.status) || (r.ok === false ? 0 : 200);
          if (s === 401 || s === 403) return listo({ ok: false, error: 'http ' + s, status: s, rechazo: true });
          if (r.ok === false || s !== 200) return listo({ ok: false, error: 'http', status: s });
          return Promise.resolve(typeof r.text === 'function' ? r.text() : r.json()).then(function (b) {
            var d; try { d = typeof b === 'string' ? JSON.parse(b) : b; } catch (e) { d = null; }
            listo(d && typeof d === 'object' ? { ok: true, status: s, data: d } : { ok: false, error: 'formato', status: s });
          });
        });
      });
    }
    /* Sólo red/timeout/http se reintentan (una vez, a 1.5 s); 401/403, JSON inválido y un cuerpo recibido no. ms2: plazo del reintento. */
    function reintentar(hacer, ms, n, ms2) {
      return hacer(ms).then(function (r) {
        if (r.ok || r.rechazo || r.error === 'formato' || n < 1) return r;
        return pausa(ESPERA).then(function () { return reintentar(hacer, ms2, n - 1, ms2); });
      });
    }
    function traer(url, o) {
      var ms = o && o.timeoutMs || cfg.timeoutMs;
      return reintentar(function (t) { return intento(url, t); }, ms, o && o.reintentos != null ? o.reintentos : 1, o && o.reintentoMs || ms);
    }
    /* La dirección sale de window.YOD_PORTERO (os/yod-acceso.js); si falta se pide aquí, como portero.js. El respaldo ni se mira. */
    var SELF = (doc && doc.currentScript && doc.currentScript.src) || 'https://yodesarrollomx.github.io/yod-portal/os/yod-cargador.js';
    function portero() {
      if (!accesoListo) accesoListo = env.YOD_PORTERO ? Promise.resolve() : new Promise(function (ok) {
        try {
          var sc = doc.createElement('script'); sc.src = new URL('yod-acceso.js?v=20261031-fase1-e2', SELF).href; // misma carpeta que este archivo
          sc.onload = sc.onerror = function () { ok(); }; doc.head.appendChild(sc);
        } catch (e) { ok(); }
      });
      return accesoListo.then(function () { return (env.YOD_PORTERO || {}).original || ''; });
    }

    /* ---------- sesión ---------- */
    function token() { return lsGet(K_CLAVE) || ''; }
    /* Identidad guardada de ESTE token y board, si aún vale (< viejoMs). Regla única de canjear y de peek. */
    function guardada(tok, board) {
      var c = leer(K_SES), edad = c ? ahora() - c.ts : NaN; // un ts dañado da NaN y no vale
      return c && c.h === hash(tok) && (c.board || '') === board && c.data && c.data.ok === true && edad < cfg.viejoMs ? { data: c.data, edad: Math.max(0, edad) } : null;
    }
    function canjear(o) {
      o = o || {};
      var tok = token(), board = o.board || '', t0 = reloj();
      if (!tok) return Promise.resolve({ ok: false, error: 'sin_sesion', rechazo: true, origen: 'sin_red', token: '' });
      var h = hash(tok), c = !legacy && o.modo !== 'red' ? guardada(tok, board) : null;
      if (c) {
        if (c.edad > cfg.frescoMs) refrescar(tok, board, h);
        registrar('cj', reloj() - t0, 'cache');
        return Promise.resolve(Object.assign({}, c.data, { origen: 'cache', edadMs: c.edad, token: tok }));
      }
      return pedir(tok, board, h);
    }
    /* La identidad guardada, SIN red y síncrona, para pintar al instante; no autoriza (manda el canje de fondo). */
    function peek() {
      var tok = token(), c = legacy || !tok ? null : guardada(tok, '');
      return c && Object.assign({}, c.data, { edadMs: c.edad });
    }
    /* UNA promesa en vuelo por (h, board): portero.js, shell.js y app.js comparten el mismo canje. */
    function pedir(tok, board, h) {
      var k = h + '|' + board, t0 = reloj(), yaRechazado = avisado === tok;
      if (!legacy && vuelo[k]) return vuelo[k].then(copia);
      var p = portero().then(function (base) {
        if (!base) return { ok: false, error: 'red', rechazo: false, origen: 'sin_red', token: tok };
        var url = base + '?recurso=canje&t=' + encodeURIComponent(tok) + (board ? '&board=' + encodeURIComponent(board) : '');
        return traer(url, { reintentoMs: cfg.timeoutFrioMs }).then(function (r) {
          var d = r.data;
          if (r.ok && d.ok === true) {
            if (d.token && d.token !== tok) return { ok: false, error: 'token_distinto', rechazo: false, origen: 'red', token: tok };
            var data = { ok: true, rol: d.rol, boards: d.boards, nombre: d.nombre, correo: d.correo };
            if (avisado !== tok || yaRechazado) { // rechazado MIENTRAS volaba: respuesta vieja, ni se guarda ni limpia la marca
              if (!legacy && token() === tok) escribir(K_SES, { h: h, board: board, data: data, ts: ahora() });
              if (avisado === tok) avisado = '';
            }
            registrar('cj', reloj() - t0, 'red');
            return Object.assign({}, data, { origen: 'red', edadMs: 0, token: tok });
          }
          var err = r.ok ? String(d.error || 'servidor') : r.error, rc = esRechazo(err), c = rc ? leer(K_SES) : null;
          if (c && c.h === h) lsDel(K_SES);
          return { ok: false, error: err, rechazo: rc, origen: err === 'red' || err === 'timeout' ? 'sin_red' : 'red', token: tok };
        });
      });
      if (!legacy) { vuelo[k] = p; var libre = function () { delete vuelo[k]; }; p.then(libre, libre); }
      return p.then(copia);
    }
    function enFondo(llave, hacer) { // una revalidación a la vez por llave; el error se calla
      if (fondo[llave]) return;
      fondo[llave] = 1;
      var fin = function () { delete fondo[llave]; };
      hacer().then(fin, fin);
    }
    /* Revalida en fondo la caché vieja. Un rechazo NO borra pyod_clave_v1 (eso es de cerrar()): sólo purga y avisa. */
    function refrescar(tok, board, h) {
      enFondo(h + '|' + board, function () {
        return pedir(tok, board, h).then(function (r) {
          if (token() !== tok || r.ok && avisado === tok) return; // otra persona, o un OK viejo (se rechazó mientras volaba): nada que avisar
          if (r.ok) emitir('yodcargador:sesion', r);
          else if (r.rechazo) rechazar(tok, r.error);
        });
      });
    }
    function rechazoDe(r) { return !r.ok ? (r.rechazo ? r.error : '') : r.data.ok === false && esRechazo(r.data.error) ? String(r.data.error) : ''; } // el rechazo de un traer(), o ''
    /* Rechazo concluyente (del canje o de su verificación): se purga TODO lo guardado y se avisa UNA vez por token. Ese token queda marcado
       en avisado: nada que volaba antes se vuelve a guardar hasta un canje bueno (que salga después) o cerrar(). */
    function rechazar(tok, error) {
      if (!tok || token() !== tok) return;
      purgar();
      if (avisado === tok) return;
      avisado = tok;
      emitir('yodcargador:sesion-rechazada', { error: error, token: tok });
    }
    /* Un backend de DATOS negó la credencial: quizá sólo falta acceso a esa fuente, no murió la sesión. El Portero decide, con UN canje
       (sin caché de sesión): pedir() comparte el vuelo, así que varias fuentes a la vez, o el canje en curso, no lo repiten. */
    function verificar(tok) {
      return pedir(tok, '', hash(tok)).then(function (r) {
        if (r.rechazo) rechazar(tok, r.error); // el canje también rechaza: sesión muerta → purga + sesion-rechazada
        return r.ok ? 'ok' : r.rechazo ? 'rechazo' : 'incierto';
      });
    }
    function negado(clave, dueno, error) { // sólo con copia en juego: sin ella el adoptante ya ve el rechazo
      if (legacy || !dueno || token() !== dueno) return; // sin credencial, o ya es otra persona: no dice nada de esta sesión
      if (avisado === dueno) return rechazar(dueno, error); // ya se dio por muerta: sólo se vuelve a purgar
      verificar(dueno).then(function (d) { if (d === 'ok' && token() === dueno && avisado !== dueno) emitir('yodcargador:dato-negado', { clave: clave, error: error }); });
    }
    /* La guardia de carrera: sólo se borra la llave si sigue siendo el token rechazado. */
    function cerrar(o) {
      o = o || {};
      var igual = !!o.token && lsGet(K_CLAVE) === o.token;
      if (igual) lsDel(K_CLAVE);
      purgar(); avisado = '';
      emitir('yodcargador:sesion-cerrada', { motivo: o.motivo || '' });
      return igual;
    }
    var EVS = ['yodcargador:sesion', 'yodcargador:sesion-rechazada', 'yodcargador:sesion-cerrada', 'storage'];
    function alCambiar(fn) {
      function l(e) {
        if (e.type === 'storage' && e.key != null && e.key !== K_CLAVE) return;
        try { fn(e); } catch (x) { aviso(x); }
      }
      EVS.forEach(function (n) { env.addEventListener(n, l); });
      return function () { EVS.forEach(function (n) { env.removeEventListener(n, l); }); };
    }
    /* ?sesion=TOKEN (liga vieja del correo): se guarda y se quita de la URL, como portero.js. ?liga= es de portero.js. */
    function capturarSesion() {
      try {
        if (typeof URLSearchParams !== 'function' || !/[?&]sesion=/.test(loc.search || '')) return;
        var q = new URLSearchParams(loc.search), t = q.get('sesion');
        if (!t || !lsSet(K_CLAVE, t)) return;
        q.delete('sesion');
        env.history.replaceState(null, '', (loc.pathname || '') + (q.toString() ? '?' + q : '') + (loc.hash || ''));
      } catch (e) { }
    }

    /* ---------- datos ---------- */
    function config(c) {
      c = c || {};
      if (c.catalogo && typeof c.catalogo.url === 'string' && /^https:\/\//.test(c.catalogo.url)) cfg.catalogo = { url: c.catalogo.url };
      ['timeoutMs', 'timeoutFrioMs', 'frescoMs', 'viejoMs'].forEach(function (k) { if (typeof c[k] === 'number' && isFinite(c[k]) && c[k] >= (/^timeout/.test(k) ? 1 : 0)) cfg[k] = c[k]; });
      return Object.assign({}, cfg, { catalogo: cfg.catalogo && { url: cfg.catalogo.url } });
    }
    function medir(n, t0, orig) { if (n) { registrar(n, reloj() - t0, orig); primerDato(orig); } }
    function viejoDe(llave, max) { // lo guardado, si todavía vale: {data, edad} | null
      var c = max > 0 ? leer(llave) : null, edad = c && typeof c.ts === 'number' ? Math.max(0, ahora() - c.ts) : -1;
      return edad >= 0 && edad < max && c.data !== undefined ? { data: c.data, edad: edad } : null;
    }
    /* Dato fresco de la red: se guarda (si toca) y se avisa. dueno = con quién se pidió: si la persona cambió durante el vuelo no se guarda;
       si su token se rechazó (volaba antes) ni se guarda ni se anuncia hasta un canje bueno o cerrar(). */
    function dato(llave, clave, d, previo, dueno, guardar) {
      if (dueno && avisado === dueno) return;
      if (guardar && (!dueno || token() === dueno)) escribir(llave, { ts: ahora(), data: d });
      emitir('yodcargador:dato', { clave: clave, origen: 'red', data: d, igual: !!previo && JSON.stringify(previo.data) === JSON.stringify(d) });
    }
    /* get con caché opcional (sólo si viejoMs > 0). La clave nunca lleva k ni t (por persona se le suma h). Nunca guarda ok:false ni HTTP ≠ 200. */
    function get(url, params, o) {
      o = o || {};
      var t0 = reloj(), tk = params && (params.k || params.t) || '', viejo = legacy ? 0 : o.viejoMs | 0, fresco = o.frescoMs | 0;
      var clave = o.clave != null ? String(o.clave) : url + '?' + qs(params, ['k', 't']) + (tk ? ':' + hash(tk) : '');
      var llave = P_CACHE + clave, v = viejoDe(llave, viejo);
      if (v && fresco > 0 && v.edad < fresco) {
        medir(o.telemetria, t0, 'cache');
        return Promise.resolve({ ok: true, status: 200, data: v.data, origen: 'cache', ms: Math.round(reloj() - t0), edadMs: v.edad });
      }
      if (v && o.alViejo) { // el adoptante pinta lo último conocido mientras llega la red
        try { o.alViejo(v.data, { edadMs: v.edad }); } catch (e) { aviso(e); }
        medir(o.telemetria, t0, 'cache');
      }
      return traer(unir(url, params), { timeoutMs: o.timeoutMs, reintentos: o.reintentos }).then(function (r) {
        var ms = Math.round(reloj() - t0), d = r.data, rc = rechazoDe(r);
        if (rc) { lsDel(llave); if (v) negado(clave, tk, rc); } // ese dato ya no se sirve; el Portero dice si fue la sesión
        if (r.ok) {
          if (d.ok !== false) {
            dato(llave, clave, d, v, tk, viejo > 0);
            medir(o.telemetria, t0, 'red');
            return { ok: true, status: r.status, data: d, origen: 'red', ms: ms };
          }
          return { ok: false, status: r.status, data: d, error: String(d.error || 'servidor'), rechazo: !!rc, origen: 'red', ms: ms };
        }
        if (!rc && v) return { ok: true, status: 200, data: v.data, origen: 'cache-fallback', ms: ms, edadMs: v.edad, error: r.error };
        return { ok: false, status: r.status || 0, error: r.error, rechazo: !!rc, origen: r.error === 'red' || r.error === 'timeout' ? 'sin_red' : 'red', ms: ms };
      });
    }
    /* recordar(clave, cargar, o): memoria para CUALQUIER lectura del adoptante; el fetch es suyo (cargar(signal) → Promise<JSON>). o: modo
       (cache-primero | red-primero), frescoMs, viejoMs, timeoutMs, reintentos, alViejo, telemetria, token. La llave lleva el hash del token. */
    function intentoMemo(cargar, ms) { // nunca rechaza
      return conPlazo(ms, function (signal, listo) {
        return new Promise(function (ok) { ok(cargar(signal)); }).then(function (b) {
          listo(b && typeof b === 'object' ? { ok: true, body: b } : { ok: false, error: 'formato' });
        }, function (e) { // un rechazo lanzado ('403', 'HTTP 403', {status:403}…) no es caída de red: se serviría la copia
          var m = String(e && e.message != null ? e.message : e).trim().toLowerCase(), c = +(e && e.status || m), rc = c === 401 || c === 403 ? 'http ' + c : esRechazo(m) ? m : '';
          listo(rc ? { ok: true, body: { ok: false, error: rc } } : { ok: false, error: e && e.message === 'timeout' ? 'timeout' : 'red' });
        });
      });
    }
    function recordar(clave, cargar, o) {
      o = o || {};
      var t0 = reloj(), tk = o.token != null ? String(o.token) : token(), id = 'memo:' + clave, llave = P_CACHE + id + ':' + hash(tk);
      var fresco = o.frescoMs >= 0 ? o.frescoMs : 60000, viejo = legacy ? 0 : o.viejoMs >= 0 ? o.viejoMs : 43200000, ms = o.timeoutMs > 0 ? o.timeoutMs : cfg.timeoutMs, v = viejoDe(llave, viejo);
      function salida(x) { x.ms = Math.round(reloj() - t0); return x; }
      function red(anunciar) { // bueno: se guarda (en fondo, además se anuncia); rechazo: borra la llave y se verifica
        return reintentar(function (t) { return intentoMemo(cargar, t); }, ms, o.reintentos | 0, ms).then(function (r) {
          var b = r.body, e, rc;
          if (!r.ok) return { ok: false, error: r.error, rechazo: false, origen: r.error === 'formato' ? 'red' : 'sin_red' };
          if (b.ok === false) {
            e = String(b.error || 'servidor'); rc = esRechazo(b.error);
            if (rc) { lsDel(llave); if (v) negado(id, tk, e); }
            return { ok: false, data: b, error: e, rechazo: rc, origen: 'red' };
          }
          if (!tk || token() === tk && avisado !== tk) { // si la persona cambió o su token se rechazó durante el vuelo, ni se guarda ni se anuncia
            if (anunciar) dato(llave, id, b, v, tk, viejo > 0); else if (viejo > 0) escribir(llave, { ts: ahora(), data: b });
          }
          return { ok: true, data: b, origen: 'red' };
        });
      }
      if (!legacy && o.modo !== 'red-primero' && v) { // caché-primero con copia: responde YA y, si no está fresca, revalida en fondo
        if (!(v.edad < fresco)) enFondo(llave, function () { return red(true); });
        medir(o.telemetria, t0, 'cache');
        return Promise.resolve(salida({ ok: true, data: v.data, origen: 'cache', edadMs: v.edad }));
      }
      if (v && typeof o.alViejo === 'function') { // red-primero: se pinta lo último conocido mientras llega la red
        try { o.alViejo(v.data, { edadMs: v.edad }); } catch (e) { aviso(e); }
        medir(o.telemetria, t0, 'cache');
      }
      return red(false).then(function (x) {
        if (x.ok) medir(o.telemetria, t0, 'red');
        else if (v && !x.data) x = { ok: true, data: v.data, origen: 'cache-fallback', error: x.error, edadMs: v.edad }; // cayó la red: lo guardado cubre; un rechazo no
        return salida(x);
      });
    }
    function catalogo(o) {
      o = o || {};
      var u = cfg.catalogo && cfg.catalogo.url, tk = o.token != null ? o.token : token();
      if (!u) return Promise.resolve({ ok: false, status: 0, error: 'sin_config', rechazo: false, origen: 'sin_red', ms: 0 });
      return get(u, { action: 'read', resource: 'Portal', k: tk || undefined }, { clave: 'catalogo:' + hash(tk), frescoMs: 300000, viejoMs: 604800000, telemetria: 'catalogo', alViejo: o.alViejo });
    }
    /* Canje y catálogo en paralelo (el ?recurso=arranque del Portero llegará después). */
    function arranque(o) {
      o = o || {};
      return Promise.all([canjear({ board: o.board }), catalogo({ token: o.token, alViejo: o.alViejo })]).then(function (r) { return { sesion: r[0], catalogo: r[1] }; });
    }

    /* ---------- adaptador de transporte para los motores PPP ---------- */
    function resp(data, origen, ms) { // forma de Response: el código viejo (.then(r => r.json())) no cambia
      var txt = JSON.stringify(data);
      return { ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(txt)); }, text: function () { return Promise.resolve(txt); }, yod: { origen: origen, ms: ms } };
    }
    function falla(r) { var e = new Error(r.error || 'red'); e.rechazo = !!r.rechazo; e.status = r.status || 0; return Promise.reject(e); } // como fetch: el motor cae en su catch
    function pppGet(endpoint, params, o) {
      params = params || {}; o = o || {};
      var rec = params.recurso, dueno = params.k || params.t || '', tk = dueno || token(), t0 = reloj(), url = unir(endpoint, params);
      /* Qué caso es: los motores piden «id», el resto «caso_id» o «palabra». Sin ninguno no se guarda (ni se lee) y va a la red. */
      var cid = [params.caso_id, params.id, params.palabra].filter(function (x) { return x != null && x !== ''; })[0];
      cid = cid == null ? '' : String(cid);
      var modo = legacy ? 0 : rec === 'lista' || rec === 'catalogo' || rec === 'mapa' ? 1 : rec === 'caso' && cid ? 2 : 0; // 1 caché-primero · 2 red-primero · 0 directo
      var clave = 'ppp:' + rec + ':' + (params.tipo || '') + ':' + cid + ':' + hash(tk);
      var llave = P_CACHE + clave, v = viejoDe(llave, modo === 1 ? 43200000 : modo === 2 ? 86400000 : 0); // 12 h · 24 h
      var nom = rec === 'lista' || rec === 'caso' || rec === 'mapa' ? rec : '';
      function ms() { return Math.round(reloj() - t0); }
      function red() { // sin reintento por omisión: el motor ya sabe qué hacer sin conexión
        return traer(url, { timeoutMs: o.timeoutMs, reintentos: o.reintentos | 0 }).then(function (r) {
          var rc = rechazoDe(r);
          if (rc) { lsDel(llave); if (v) negado(clave, dueno, rc); }
          if (!r.ok) return falla(r);
          if (modo && r.data.ok !== false) dato(llave, clave, r.data, v, dueno, true);
          medir(nom, t0, 'red');
          return resp(r.data, 'red', ms());
        });
      }
      if (modo === 1 && v) { // se resuelve YA con lo guardado y se revalida en fondo (error en silencio)
        if (!(o.frescoMs > 0 && v.edad < o.frescoMs)) enFondo(llave, red);
        medir(nom, t0, 'cache');
        return Promise.resolve(resp(v.data, 'cache', ms()));
      }
      if (modo === 2 && v) return red().catch(function (e) { // un caso se pide a la red; la caché sólo cubre si la red cae
        if (e.rechazo) throw e; // red() ya tiró lo guardado
        return resp(v.data, 'cache-fallback', ms());
      });
      return red();
    }

    /* ---------- telemetría: anillo de ≤ 60 muestras + códigos para la bitácora ---------- */
    /* ios · and · cros · win · mac · lin · otro, de userAgentData.platform o del userAgent (sin navigator, «otro»). iOS antes que Mac y
       Android antes que Linux; un iPad «de escritorio» se delata por los toques. */
    function dispositivo() {
      try {
        var n = env.navigator, u = n && n.userAgentData;
        var de = function (s) {
          s = String(s || '').toLowerCase();
          return /iphone|ipad|ipod/.test(s) || (/macintosh|macos|mac os/.test(s) && n.maxTouchPoints > 1) ? 'ios' : /android/.test(s) ? 'and'
            : /\bcros\b|chrome os|chromium os/.test(s) ? 'cros' : /windows/.test(s) ? 'win' : /mac/.test(s) ? 'mac' : /linux/.test(s) ? 'lin' : '';
        };
        return n ? de(u && u.platform) || de(n.userAgent) || 'otro' : 'otro';
      } catch (e) { return 'otro'; }
    }
    function registrar(p, ms, orig) {
      p = p === 'catalogo' ? 'cat' : p;
      var t = Math.max(0, Math.round(ms)), tab = pagina(), a = leer(K_TEL);
      a = Array.isArray(a) ? a : [];
      a.push({ t: t, p: p, tablero: tab, origen: orig, frio: frio, disp: DISP });
      escribir(K_TEL, a.length > 60 ? a.slice(-60) : a, true);
      if ((p === 'pd' || p === 'cj' || p === 'cat') && !vistos[p]) { // un código por página y tipo
        vistos[p] = 1;
        pend.push({ s: (p === 'cat' ? 'cat:' : p + ':' + tab + ':') + t + ':' + (orig === 'cache' ? 'c' : 'r') + '@' + DISP, e: 0 });
      }
    }
    function marca(n) { return (marcas[n] = reloj()); }
    function primerDato(orig, extra) { // UNA vez por página: ms desde que arrancó la página
      if (yaPD) return false;
      yaPD = true;
      var t = Math.round(reloj());
      registrar('pd', t, orig);
      emitir('yodcargador:primer-dato', { t: t, origen: orig, tablero: pagina(), frio: frio, extra: extra });
      return true;
    }
    function codigos() { // sólo los no enviados; cada uno sale una vez
      var r = [];
      pend.forEach(function (x) { if (!x.e) { x.e = 1; r.push(x.s.replace(/\s+/g, '·').slice(0, 40)); } });
      return r;
    }
    function resumen(o) {
      var a = leer(K_TEL);
      a = (Array.isArray(a) ? a : []).filter(function (m) { return m && typeof m.t === 'number' && (!o || ((!o.tablero || m.tablero === o.tablero) && (!o.p || m.p === o.p) && (!o.disp || m.disp === o.disp))); });
      var v = a.map(function (m) { return m.t; }).sort(function (x, y) { return x - y; }), n = v.length;
      return { n: n, mediana_ms: n ? Math.round(n % 2 ? v[n >> 1] : (v[n / 2 - 1] + v[n / 2]) / 2) : 0, p90_ms: n ? Math.round(v[Math.ceil(0.9 * n) - 1]) : 0, ultimos: a.slice(-10) };
    }
    function limpiar() { lsDel(K_TEL); }

    /* ---------- carga diferida ---------- */
    function cargarDespues(src, o) {
      o = o || {};
      if (cargados[src]) return cargados[src]; // nunca dos veces el mismo src
      return (cargados[src] = new Promise(function (resolve, reject) {
        var hecho = false, quitar = [], max = o.maxMs == null ? 4000 : o.maxMs;
        function poner() {
          if (hecho) return;
          hecho = true; quitar.forEach(function (f) { f(); });
          try {
            var sc = doc.createElement('script'); sc.src = src;
            Object.keys(o.atributos || {}).forEach(function (k) { sc.setAttribute(k, o.atributos[k] === true ? '' : String(o.atributos[k])); });
            sc.onload = function () { resolve(sc); }; sc.onerror = function () { reject(new Error('carga')); };
            doc.head.appendChild(sc);
          } catch (e) { reject(e); }
        }
        if (legacy) return poner();
        var t = st(poner, max); quitar.push(function () { ct(t); });
        if (o.cuando === 'idle') { if (typeof env.requestIdleCallback === 'function') env.requestIdleCallback(poner, { timeout: max }); }
        else if (yaPD) poner();
        else { env.addEventListener('yodcargador:primer-dato', poner); quitar.push(function () { env.removeEventListener('yodcargador:primer-dato', poner); }); }
      }));
    }

    function sesionEnCache() { var c = leer(K_SES), t = token(); return !!(t && c && c.h === hash(t) && ahora() - c.ts < cfg.viejoMs); }
    var core = {
      v: '2', legacy: legacy, config: config, pagina: pagina, hash: hash,
      sesion: { token: token, peek: peek, canjear: canjear, esRechazo: esRechazo, cerrar: cerrar, alCambiar: alCambiar },
      get: get, recordar: recordar, catalogo: catalogo, arranque: arranque, ppp: { get: pppGet }, purgar: purgar,
      telemetria: { marca: marca, primerDato: primerDato, codigos: codigos, resumen: resumen, limpiar: limpiar },
      cargarDespues: cargarDespues
    };
    capturarSesion();
    frio = !sesionEnCache(); // «frío» = la página arrancó sin sesión en caché
    return core;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = crear;
  if (typeof window !== 'undefined' && raiz === window && !(window.YodCargador && window.YodCargador.v)) window.YodCargador = crear(window);
})(typeof window !== 'undefined' ? window : globalThis);
