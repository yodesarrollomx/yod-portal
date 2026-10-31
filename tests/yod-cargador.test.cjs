'use strict';
/* Pruebas de os/yod-cargador.js (T-101). Sin red y sin reloj real: fetch, storage, timers,
   location, document y performance son falsos y los controla cada prueba, así que todas son
   deterministas. Sólo hay datos sintéticos (hosts .invalid, tokens de mentira, sin correos). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crear = require('../os/yod-cargador.js');

const ORIGINAL = 'https://portero.invalid/exec';
const RESPALDO = 'https://respaldo.invalid/exec';
const CATALOGO = 'https://catalogo.invalid/exec';
const PPP = 'https://ppp.invalid/exec';
const TOK = 'sy-prueba-0000000000000001';
const OTRO = 'sy-prueba-0000000000000002';
const MIN = 60000, HORA = 3600000;
const LIMITE_BYTES = 25000;                                               // se afina al final del recorte
const CANJE_OK = { ok: true, token: TOK, rol: 'editor', boards: 'MA,MX', nombre: 'Persona de prueba', correo: 'correo-de-prueba' };

/* vacía las microtareas pendientes sin tocar el reloj del cargador */
const tick = () => new Promise(r => setImmediate(r));
const asentar = async (n = 6) => { for (let i = 0; i < n; i++) await tick(); };

function reloj(inicio = 1700000000000) {
  const r = { t: inicio, base: inicio, timers: [], sig: 1 };
  r.now = () => r.t;
  r.perfNow = () => r.t - r.base;
  r.setTimeout = (f, ms) => { const id = r.sig++; r.timers.push({ id, f, en: r.t + (ms || 0) }); return id; };
  r.clearTimeout = id => { r.timers = r.timers.filter(x => x.id !== id); };
  r.avanzar = async ms => {
    const meta = r.t + ms;
    await asentar();
    for (;;) {
      const prox = r.timers.filter(x => x.en <= meta).sort((a, b) => a.en - b.en || a.id - b.id)[0];
      if (!prox) break;
      r.timers = r.timers.filter(x => x !== prox);
      r.t = Math.max(r.t, prox.en);
      prox.f();
      await asentar();
    }
    r.t = meta;
    await asentar();
  };
  return r;
}

/* localStorage falso: puede llenarse (cuota, en caracteres) o romperse del todo (rota) */
function almacen(inicial = {}) {
  const d = new Map(Object.entries(inicial));
  const s = { cuota: Infinity, rota: false, mapa: d };
  const total = () => [...d].reduce((n, [k, v]) => n + k.length + v.length, 0);
  const vivo = () => { if (s.rota) throw new Error('SecurityError'); };
  s.getItem = k => { vivo(); return d.has(k) ? d.get(k) : null; };
  s.setItem = (k, v) => {
    vivo(); v = String(v);
    const sin = d.has(k) ? k.length + d.get(k).length : 0;
    if (total() - sin + k.length + v.length > s.cuota) throw new Error('QuotaExceededError');
    d.set(k, v);
  };
  s.removeItem = k => { vivo(); d.delete(k); };
  s.key = i => { vivo(); return [...d.keys()][i] ?? null; };
  Object.defineProperty(s, 'length', { get() { vivo(); return d.size; } });
  s.claves = pre => [...d.keys()].filter(k => k.startsWith(pre));
  return s;
}

/* fetch falso. cola: 'caida' (rechaza) · 'colgado' (no responde nunca) · {json,status,texto} · función · {diferido} */
function respuesta({ json, status = 200, texto } = {}) {
  const cuerpo = texto !== undefined ? texto : JSON.stringify(json);
  return { ok: status >= 200 && status < 300, status, text: async () => cuerpo, json: async () => JSON.parse(cuerpo) };
}
function diferido() { let ok, no; const promesa = new Promise((a, b) => { ok = a; no = b; }); return { promesa, ok, no }; }
function red() {
  const r = { llamadas: [], cola: [], defecto: null };
  r.fetch = (url, opt) => {
    r.llamadas.push({ url, opt });
    const p = r.cola.length ? r.cola.shift() : r.defecto;
    if (p === 'caida') return Promise.reject(new TypeError('fallo de red'));
    if (p === 'colgado' || p == null) return new Promise(() => { });
    if (typeof p === 'function') return p(url, opt);
    if (p.diferido) return p.diferido.promesa;
    return Promise.resolve(respuesta(p));
  };
  r.pon = (...xs) => { r.cola.push(...xs); return r; };
  r.urls = () => r.llamadas.map(x => x.url);
  return r;
}

function montar(op = {}) {
  const rl = op.reloj || reloj(), rd = red(), bus = new EventTarget();
  const st = op.storage !== undefined ? op.storage : almacen(op.token === undefined ? { pyod_clave_v1: TOK } : op.token ? { pyod_clave_v1: op.token } : {});
  const loc = { pathname: op.pathname !== undefined ? op.pathname : '/potenciales-yod/macrolotes.html', search: op.search || '', hash: op.hash || '' };
  const hist = { reemplazos: [], replaceState(_s, _t, url) {
    hist.reemplazos.push(url);
    const m = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(url);
    loc.pathname = m[1]; loc.search = m[2] || ''; loc.hash = m[3] || '';
  } };
  const insertados = [];
  const doc = {
    currentScript: op.script ? { src: op.script } : null,
    createElement: tag => ({ tagName: tag.toUpperCase(), attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }),
    head: { appendChild: el => { insertados.push(el); return el; } }
  };
  const env = {
    fetch: rd.fetch, storage: st, now: rl.now, location: loc, history: hist, document: doc,
    performance: { now: rl.perfNow }, setTimeout: rl.setTimeout, clearTimeout: rl.clearTimeout,
    addEventListener: (...a) => bus.addEventListener(...a), removeEventListener: (...a) => bus.removeEventListener(...a),
    dispatchEvent: e => bus.dispatchEvent(e),
    YOD_PORTERO: op.sinPortero ? undefined : { original: ORIGINAL, respaldo: RESPALDO }
  };
  if (op.idle) env.requestIdleCallback = op.idle;
  const eventos = [];
  ['sesion', 'sesion-rechazada', 'sesion-cerrada', 'dato', 'primer-dato'].forEach(n => bus.addEventListener('yodcargador:' + n, e => eventos.push({ tipo: n, detalle: e.detail })));
  const core = crear(env);
  return { core, env, rl, st, rd, bus, loc, hist, insertados, eventos, doc };
}
const de = (m, tipo) => m.eventos.filter(e => e.tipo === tipo);
const claveCanje = (t = TOK, board) => ORIGINAL + '?recurso=canje&t=' + encodeURIComponent(t) + (board ? '&board=' + board : '');

/* ───────────── sesión · canje ───────────── */

test('1 · canjear sin token: sin_sesion y ni un fetch', async () => {
  const m = montar({ token: '' });
  const r = await m.core.sesion.canjear();
  assert.deepEqual(r, { ok: false, error: 'sin_sesion', rechazo: true, origen: 'sin_red', token: '' });
  assert.equal(m.rd.llamadas.length, 0);
});

test('2 · canje por red guarda caché (sin el token); la segunda llamada sale de caché sin fetch', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK });
  const a = await m.core.sesion.canjear({ board: 'MA' });
  assert.equal(a.ok, true); assert.equal(a.origen, 'red'); assert.equal(a.edadMs, 0);
  assert.deepEqual([a.rol, a.boards, a.nombre, a.correo, a.token], ['editor', 'MA,MX', 'Persona de prueba', 'correo-de-prueba', TOK]);
  assert.deepEqual(m.rd.urls(), [claveCanje(TOK, 'MA')]);
  assert.deepEqual(m.rd.llamadas[0].opt.cache, 'no-store'); assert.equal(m.rd.llamadas[0].opt.credentials, 'omit');
  const guardada = JSON.parse(m.st.getItem('yodcg_sesion_v1'));
  assert.equal(guardada.h, m.core.hash(TOK)); assert.equal(guardada.board, 'MA'); assert.equal(guardada.data.rol, 'editor');
  for (const [k, v] of m.st.mapa) if (k !== 'pyod_clave_v1') assert.ok(!k.includes(TOK) && !v.includes(TOK), 'el token no puede estar en ' + k);
  await m.rl.avanzar(5 * MIN);
  const b = await m.core.sesion.canjear({ board: 'MA' });
  assert.equal(b.ok, true); assert.equal(b.origen, 'cache'); assert.equal(b.edadMs, 5 * MIN); assert.equal(b.token, TOK);
  assert.equal(m.rd.llamadas.length, 1, 'con la caché fresca no hay red');
  m.rd.pon({ json: CANJE_OK });
  const c = await m.core.sesion.canjear({ board: 'MX' });
  assert.equal(c.origen, 'red', 'otro board = otra entrada');
  assert.equal(m.rd.llamadas.length, 2);
});

test('3 · caché vieja (> fresco, < viejo): se pinta con ella, UN refresco en fondo y evento sesion', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }, { json: Object.assign({}, CANJE_OK, { rol: 'admin' }) });
  await m.core.sesion.canjear();
  await m.rl.avanzar(30 * MIN);
  const [a, b] = await Promise.all([m.core.sesion.canjear(), m.core.sesion.canjear()]);
  assert.equal(a.origen, 'cache'); assert.equal(a.rol, 'editor'); assert.equal(b.origen, 'cache');
  await asentar();
  assert.equal(m.rd.llamadas.length, 2, 'un solo refresco aunque se canjee dos veces');
  const ev = de(m, 'sesion');
  assert.equal(ev.length, 1); assert.equal(ev[0].detalle.ok, true); assert.equal(ev[0].detalle.rol, 'admin'); assert.equal(ev[0].detalle.origen, 'red');
  assert.equal(JSON.parse(m.st.getItem('yodcg_sesion_v1')).data.rol, 'admin', 'la caché queda fresca');
  assert.equal((await m.core.sesion.canjear()).rol, 'admin');
  assert.equal(m.rd.llamadas.length, 2);
});

test('4 · refresco rechazado (revocado): borra la caché, avisa y NO toca pyod_clave_v1', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }, { json: { ok: false, error: 'revocado' } });
  await m.core.sesion.canjear();
  await m.rl.avanzar(2 * HORA);
  const r = await m.core.sesion.canjear();
  assert.equal(r.origen, 'cache');
  await asentar();
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
  assert.equal(m.st.getItem('pyod_clave_v1'), TOK, 'cerrar() lo decide el adoptante');
  const ev = de(m, 'sesion-rechazada');
  assert.equal(ev.length, 1); assert.deepEqual(ev[0].detalle, { error: 'revocado', token: TOK });
  assert.equal(de(m, 'sesion').length, 0);
  m.rd.pon({ json: { ok: false, error: 'revocado' } });
  const otra = await m.core.sesion.canjear();
  assert.deepEqual([otra.ok, otra.rechazo, otra.origen, otra.error], [false, true, 'red', 'revocado']);
});

test('5 · dedupe: tres canjes concurrentes hacen UN fetch; modo red también comparte la promesa en vuelo', async () => {
  const m = montar(), d = diferido();
  m.rd.pon({ diferido: d });
  const ps = [m.core.sesion.canjear(), m.core.sesion.canjear({ modo: 'red' }), m.core.sesion.canjear()];
  await asentar();
  assert.equal(m.rd.llamadas.length, 1);
  d.ok(respuesta({ json: CANJE_OK }));
  const rs = await Promise.all(ps);
  assert.equal(m.rd.llamadas.length, 1);
  assert.ok(rs.every(r => r.ok && r.origen === 'red' && r.rol === 'editor'));
  assert.notEqual(rs[0], rs[1], 'cada quien recibe su copia');
  m.rd.pon({ json: CANJE_OK });
  assert.equal((await m.core.sesion.canjear({ modo: 'red' })).origen, 'red', 'sin vuelo, modo red ignora la caché');
  assert.equal(m.rd.llamadas.length, 2);
});

test('6 · timeout: espera 1.5 s, reintenta UNA vez contra el MISMO original y no inventa rechazo', async () => {
  const m = montar();
  const p = m.core.sesion.canjear({ board: 'MA' });
  await asentar();
  assert.equal(m.rd.llamadas.length, 1);
  await m.rl.avanzar(24999); assert.equal(m.rd.llamadas.length, 1);
  await m.rl.avanzar(1);
  assert.equal(m.rd.llamadas[0].opt.signal.aborted, true, 'el plazo aborta la petición');
  await m.rl.avanzar(1499); assert.equal(m.rd.llamadas.length, 1, 'aún espera el 1.5 s');
  await m.rl.avanzar(1); assert.equal(m.rd.llamadas.length, 2);
  await m.rl.avanzar(25000);
  const r = await p;
  assert.deepEqual(r, { ok: false, error: 'timeout', rechazo: false, origen: 'sin_red', token: TOK });
  assert.equal(m.rd.llamadas.length, 2, 'una sola reintentada');
  assert.deepEqual(m.rd.urls(), [claveCanje(TOK, 'MA'), claveCanje(TOK, 'MA')]);
  assert.ok(m.rd.urls().every(u => !u.startsWith(RESPALDO)), 'jamás el respaldo');
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
  assert.equal(m.st.getItem('pyod_clave_v1'), TOK, 'una falla de red no cierra la sesión');
});

test('6b · una caída de red se reintenta tras 1.5 s; si el segundo intento responde, se usa', async () => {
  const m = montar();
  m.rd.pon('caida', { json: CANJE_OK });
  const p = m.core.sesion.canjear();
  await asentar(); assert.equal(m.rd.llamadas.length, 1);
  await m.rl.avanzar(1500);
  const r = await p;
  assert.equal(r.ok, true); assert.equal(m.rd.llamadas.length, 2);
  const m2 = montar(); m2.rd.pon('caida', 'caida');
  const p2 = m2.core.sesion.canjear(); await m2.rl.avanzar(1500);
  assert.deepEqual(await p2, { ok: false, error: 'red', rechazo: false, origen: 'sin_red', token: TOK });
});

test('7 · token distinto: la caché del anterior no sirve y no se guarda tras un cambio en el vuelo', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK });
  await m.core.sesion.canjear();
  m.st.setItem('pyod_clave_v1', OTRO);
  m.rd.pon({ json: Object.assign({}, CANJE_OK, { token: OTRO, nombre: 'Otra persona' }) });
  const b = await m.core.sesion.canjear();
  assert.equal(b.origen, 'red'); assert.equal(b.nombre, 'Otra persona'); assert.equal(b.token, OTRO);
  assert.equal(m.rd.urls()[1], claveCanje(OTRO));
  assert.equal(JSON.parse(m.st.getItem('yodcg_sesion_v1')).h, m.core.hash(OTRO));
  assert.equal((await m.core.sesion.canjear()).origen, 'cache', 'la caché es de OTRO y OTRO sigue vigente');
  assert.equal(m.rd.llamadas.length, 2);
  // la persona cambia MIENTRAS el canje vuela: esa respuesta no puede quedar guardada
  const d = diferido(); m.rd.pon({ diferido: d });
  m.st.removeItem('yodcg_sesion_v1');
  const p = m.core.sesion.canjear({ modo: 'red' }); await asentar();
  m.st.setItem('pyod_clave_v1', TOK);
  d.ok(respuesta({ json: Object.assign({}, CANJE_OK, { token: OTRO }) }));
  assert.equal((await p).ok, true);
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
  // el servidor contesta con otro token: no es la sesión pedida
  m.rd.pon({ json: Object.assign({}, CANJE_OK, { token: OTRO }) });
  const x = await m.core.sesion.canjear({ modo: 'red' });
  assert.deepEqual([x.ok, x.error, x.rechazo], [false, 'token_distinto', false]);
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
});

test('8 · esRechazo: lista cerrada, 401/403, Error, objetos y NO los errores transitorios', () => {
  const { esRechazo } = montar().core.sesion;
  for (const s of ['liga', 'clave', 'expirado', 'revocado', 'sin_sesion', 'sin_acceso', 'sin acceso', 'denegado', 'no autorizado', 'unauthorized', 'forbidden', 'http 401', 'http 403', ' HTTP 403 ', 'Revocado', 'FORBIDDEN']) assert.equal(esRechazo(s), true, s);
  assert.equal(esRechazo(401), true); assert.equal(esRechazo(403), true);
  assert.equal(esRechazo(new Error('revocado')), true);
  assert.equal(esRechazo({ ok: false, error: 'expirado' }), true);
  assert.equal(esRechazo({ status: 403 }), true);
  for (const s of ['servidor', 'red', 'timeout', 'http', 'formato', 'http 500', 'board', '', 'sin_config']) assert.equal(esRechazo(s), false, s);
  for (const n of [0, 200, 404, 500, 429]) assert.equal(esRechazo(n), false, String(n));
  for (const x of [null, undefined, {}, [], new Error('servidor'), { ok: false, error: 'servidor' }, { ok: true }]) assert.equal(esRechazo(x), false, JSON.stringify(x));
});

test('9 · cerrar: con otro token no borra la llave; con el mismo borra y purga; siempre avisa', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }, { json: { ok: true, rows: [1] } });
  await m.core.sesion.canjear();
  m.core.catalogo; m.core.config({ catalogo: { url: CATALOGO } });
  await m.core.catalogo();
  assert.ok(m.st.claves('yodcg_cache_v1:').length >= 1);
  assert.equal(m.core.sesion.cerrar({ token: OTRO, motivo: 'carrera' }), false);
  assert.equal(m.st.getItem('pyod_clave_v1'), TOK, 'otra pestaña ya entró con otra persona');
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
  assert.equal(m.st.claves('yodcg_cache_v1:').length, 0);
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
  assert.equal(m.core.sesion.cerrar({ token: TOK, motivo: 'rechazo' }), true);
  assert.equal(m.st.getItem('pyod_clave_v1'), null);
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
  assert.deepEqual(de(m, 'sesion-cerrada').map(e => e.detalle), [{ motivo: 'carrera' }, { motivo: 'rechazo' }]);
  assert.equal(m.core.sesion.cerrar(), false, 'sin token no borra nada');
  assert.equal(m.core.sesion.cerrar({ token: '' }), false);
});

test('9b · alCambiar: eventos propios y cambios de pyod_clave_v1 en otra pestaña; se puede desuscribir', () => {
  const m = montar(), vistos = [];
  const off = m.core.sesion.alCambiar(e => vistos.push(e.type + (e.key !== undefined ? ':' + e.key : '')));
  m.core.sesion.cerrar({ motivo: 'x' });
  m.bus.dispatchEvent(Object.assign(new Event('storage'), { key: 'pyod_clave_v1' }));
  m.bus.dispatchEvent(Object.assign(new Event('storage'), { key: 'otra_cosa' }));
  m.bus.dispatchEvent(Object.assign(new Event('storage'), { key: null }));
  assert.deepEqual(vistos, ['yodcargador:sesion-cerrada', 'storage:pyod_clave_v1', 'storage:null']);
  off();
  m.core.sesion.cerrar({ motivo: 'y' });
  m.bus.dispatchEvent(Object.assign(new Event('storage'), { key: 'pyod_clave_v1' }));
  assert.equal(vistos.length, 3, 'desuscrito');
  const m2 = montar(), quien = [];
  m2.core.sesion.alCambiar(() => { throw new Error('falla del adoptante'); });
  m2.core.sesion.alCambiar(() => quien.push('b'));
  const avisos = []; const w = console.warn; console.warn = (...a) => avisos.push(a.join(' '));
  try { m2.core.sesion.cerrar(); } finally { console.warn = w; }
  assert.deepEqual(quien, ['b'], 'un adoptante que lanza no tumba a los demás');
  assert.equal(avisos.length, 1);
});

test('S1 · HTTP 401/403 = rechazo sin reintento; 500 reintenta una vez; JSON inválido no reintenta', async () => {
  for (const status of [401, 403]) {
    const m = montar(); m.rd.pon({ status });
    const r = await m.core.sesion.canjear();
    assert.deepEqual([r.ok, r.error, r.rechazo, r.origen], [false, 'http ' + status, true, 'red']);
    assert.equal(m.rd.llamadas.length, 1);
  }
  const m = montar(); m.rd.pon({ status: 500 }, { status: 502 });
  const p = m.core.sesion.canjear(); await m.rl.avanzar(1500);
  const r = await p;
  assert.deepEqual([r.ok, r.error, r.rechazo, r.origen], [false, 'http', false, 'red']);
  assert.equal(m.rd.llamadas.length, 2);
  const f = montar(); f.rd.pon({ texto: '<html>login de Google</html>' });
  const rf = await f.core.sesion.canjear();
  assert.deepEqual([rf.ok, rf.error, rf.rechazo], [false, 'formato', false]);
  assert.equal(f.rd.llamadas.length, 1);
  const g = montar(); g.rd.pon({ json: { ok: false, error: 'servidor' } });
  const rg = await g.core.sesion.canjear();
  assert.deepEqual([rg.ok, rg.error, rg.rechazo, rg.origen], [false, 'servidor', false, 'red']);
  assert.equal(g.st.getItem('pyod_clave_v1'), TOK);
});

test('S2 · sin YOD_PORTERO inyecta yod-acceso.js junto a este archivo y espera; sin dirección no hay fetch; nunca usa el respaldo', async () => {
  const m = montar({ sinPortero: true, script: 'https://pages.invalid/yod-portal/os/yod-cargador.js?v=abc' });
  m.rd.pon({ json: CANJE_OK });
  const p = m.core.sesion.canjear();
  await asentar();
  assert.equal(m.insertados.length, 1);
  assert.equal(m.insertados[0].src, 'https://pages.invalid/yod-portal/os/yod-acceso.js?v=20261030-fase0');
  assert.equal(m.rd.llamadas.length, 0, 'espera a que cargue la dirección');
  m.env.YOD_PORTERO = { original: ORIGINAL, respaldo: RESPALDO };
  m.insertados[0].onload();
  assert.equal((await p).ok, true);
  assert.equal(m.rd.urls()[0].startsWith(ORIGINAL), true);
  m.rd.pon({ json: CANJE_OK });
  assert.equal((await m.core.sesion.canjear({ modo: 'red' })).ok, true);
  assert.equal(m.insertados.length, 1, 'se inyecta una sola vez');
  const n = montar({ sinPortero: true }); n.rd.pon({ json: CANJE_OK });
  const q = n.core.sesion.canjear({ modo: 'red' }); await asentar();
  n.insertados[0].onerror();
  assert.deepEqual(await q, { ok: false, error: 'red', rechazo: false, origen: 'sin_red', token: TOK });
  assert.equal(n.rd.llamadas.length, 0);
  assert.equal(n.insertados[0].src, 'https://yodesarrollomx.github.io/yod-portal/os/yod-acceso.js?v=20261030-fase0');
});

/* ───────────── datos · get, catálogo, arranque ───────────── */

test('10 · get: alViejo corre SINCRÓNICO con la caché y luego resuelve la red; red caída → cache-fallback; jamás cachea ok:false', async () => {
  const m = montar(), P = { recurso: 'lista', k: TOK }, o = { clave: 'lista-x', viejoMs: HORA, telemetria: 'lista' };
  const llave = 'yodcg_cache_v1:lista-x';
  m.rd.pon({ json: { ok: true, filas: [1, 2] } });
  const a = await m.core.get(ORIGINAL, P, o);
  assert.deepEqual([a.ok, a.status, a.origen, a.data.filas], [true, 200, 'red', [1, 2]]);
  assert.equal(m.rd.urls()[0], ORIGINAL + '?recurso=lista&k=' + encodeURIComponent(TOK));
  assert.deepEqual([m.rd.llamadas[0].opt.cache, m.rd.llamadas[0].opt.credentials], ['no-store', 'omit']);
  assert.deepEqual(JSON.parse(m.st.getItem(llave)).data, { ok: true, filas: [1, 2] });
  assert.ok(!m.st.getItem(llave).includes(TOK));

  let visto = null;
  m.rd.pon({ json: { ok: true, filas: [1, 2, 3] } });
  const p = m.core.get(ORIGINAL, P, Object.assign({ alViejo: (data, meta) => { visto = { data, meta, fetchs: m.rd.llamadas.length }; } }, o));
  assert.deepEqual(visto.data, { ok: true, filas: [1, 2] }, 'alViejo ya corrió, sin esperar nada');
  assert.equal(visto.fetchs, 1, 'y corrió ANTES de ir a red'); assert.equal(visto.meta.edadMs, 0);
  const b = await p;
  assert.deepEqual([b.origen, b.data.filas], ['red', [1, 2, 3]]);
  assert.deepEqual(de(m, 'dato').map(e => [e.detalle.clave, e.detalle.origen, e.detalle.igual]), [['lista-x', 'red', false], ['lista-x', 'red', false]]);

  m.rd.pon({ json: { ok: true, filas: [1, 2, 3] } });                       // la red trae lo mismo: igualmente resuelve
  const c = await m.core.get(ORIGINAL, P, Object.assign({ alViejo() { } }, o));
  assert.equal(c.origen, 'red'); assert.equal(de(m, 'dato').pop().detalle.igual, true);

  await m.rl.avanzar(10 * MIN);
  m.rd.pon('caida', 'caida');
  const q = m.core.get(ORIGINAL, P, o); await m.rl.avanzar(1500);
  const d = await q;
  assert.deepEqual([d.ok, d.origen, d.data.filas, d.edadMs, d.error], [true, 'cache-fallback', [1, 2, 3], 10 * MIN, 'red']);

  m.rd.pon({ json: { ok: false, error: 'servidor' } });                     // ok:false con caché previa: se informa y no se pisa
  const e = await m.core.get(ORIGINAL, P, o);
  assert.deepEqual([e.ok, e.error, e.rechazo, e.origen], [false, 'servidor', false, 'red']);
  assert.deepEqual(JSON.parse(m.st.getItem(llave)).data.filas, [1, 2, 3]);

  m.rd.pon({ json: { ok: false, error: 'servidor' } });                     // ok:false sin caché: nada se guarda
  assert.equal((await m.core.get(ORIGINAL, P, { clave: 'otra', viejoMs: HORA })).ok, false);
  m.rd.pon({ status: 500 }, { status: 500 });
  const f = m.core.get(ORIGINAL, P, { clave: 'otra', viejoMs: HORA }); await m.rl.avanzar(1500);
  assert.deepEqual([(await f).ok, m.st.getItem('yodcg_cache_v1:otra')], [false, null]);
});

test('10c · get: rechazo borra lo guardado y NO sirve caché; frescoMs/viejoMs; sin viejoMs no guarda; sin red ni caché falla limpio', async () => {
  const m = montar(), P = { recurso: 'lista', k: TOK }, llave = 'yodcg_cache_v1:z';
  m.rd.pon({ json: { ok: true, n: 1 } });
  await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA, frescoMs: 5 * MIN });
  await m.rl.avanzar(4 * MIN);
  let pintado = 0;
  const fresca = await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA, frescoMs: 5 * MIN, alViejo() { pintado++; } });
  assert.deepEqual([fresca.origen, fresca.edadMs, m.rd.llamadas.length, pintado], ['cache', 4 * MIN, 1, 0]);
  await m.rl.avanzar(2 * MIN);
  m.rd.pon({ json: { ok: true, n: 2 } });
  const vieja = await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA, frescoMs: 5 * MIN, alViejo() { pintado++; } });
  assert.deepEqual([vieja.origen, vieja.data.n, m.rd.llamadas.length, pintado], ['red', 2, 2, 1]);
  await m.rl.avanzar(2 * HORA);                                             // pasó viejoMs: ya no es utilizable
  m.rd.pon('caida', 'caida');
  const sin = m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA, alViejo() { pintado++; } }); await m.rl.avanzar(1500);
  assert.deepEqual([(await sin).ok, (await sin).error, (await sin).origen, pintado], [false, 'red', 'sin_red', 1]);
  m.rd.pon({ json: { ok: true, n: 3 } });
  await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA });
  m.rd.pon({ status: 403 });
  const r403 = await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA });
  assert.deepEqual([r403.ok, r403.error, r403.rechazo, m.st.getItem(llave)], [false, 'http 403', true, null]);
  m.rd.pon({ json: { ok: true, n: 4 } }); await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA });
  m.rd.pon({ json: { ok: false, error: 'clave' } });
  const rj = await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA });
  assert.deepEqual([rj.ok, rj.rechazo, m.st.getItem(llave)], [false, true, null]);
  m.rd.pon({ json: { ok: true, n: 5 } });
  await m.core.get(ORIGINAL, P, { clave: 'sin-cache' });
  assert.equal(m.st.getItem('yodcg_cache_v1:sin-cache'), null, 'sin viejoMs no se guarda nada');
  m.rd.pon({ json: { ok: true, n: 6 } });
  await m.core.get(ORIGINAL, { recurso: 'lista', k: OTRO }, { clave: 'ajena', viejoMs: HORA });
  assert.equal(m.st.getItem('yodcg_cache_v1:ajena'), null, 'con la credencial de otra persona no se guarda');
});

test('10e · si la persona cierra sesión o cambia MIENTRAS get/ppp.get vuelan, su respuesta no queda guardada', async () => {
  const m = montar(), d1 = diferido(), d2 = diferido();
  m.rd.pon({ diferido: d1 }, { diferido: d2 });
  const a = m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'c1', viejoMs: HORA });
  const b = m.core.ppp.get(PPP, { recurso: 'lista', k: TOK });
  await asentar();
  m.core.sesion.cerrar({ token: TOK, motivo: 'salir' });                    // la persona sale mientras los datos viajan
  d1.ok(respuesta({ json: { ok: true, privado: 1 } })); d2.ok(respuesta({ json: { ok: true, privado: 2 } }));
  assert.equal((await a).ok, true); assert.equal((await b).ok, true, 'quien pidió igual recibe su respuesta');
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'pero ya no queda nada guardado de esa persona');
  m.st.setItem('pyod_clave_v1', OTRO);                                       // entra otra persona en el mismo navegador
  const d3 = diferido(); m.rd.pon({ diferido: d3 });
  const c = m.core.get(ORIGINAL, { recurso: 'lista', k: OTRO }, { clave: 'c2', viejoMs: HORA });
  await asentar(); m.st.setItem('pyod_clave_v1', TOK);
  d3.ok(respuesta({ json: { ok: true } })); await c;
  assert.equal(m.st.getItem('yodcg_cache_v1:c2'), null);
});

test('10d · get: URL con encodeURIComponent, omite undefined/null, une con & si ya hay ?, clave por defecto sin k ni t', async () => {
  const m = montar();
  m.rd.pon({ json: [1, 2] }, { json: { ok: true } });
  await m.core.get(ORIGINAL, { q: 'a b&c/ñ', x: undefined, n: 0, z: null, v: false }, { viejoMs: HORA });
  assert.equal(m.rd.urls()[0], ORIGINAL + '?q=a%20b%26c%2F%C3%B1&n=0&v=false');
  await m.core.get(ORIGINAL + '?action=read', { t: TOK, tipo: 'MA' }, { viejoMs: HORA });
  assert.equal(m.rd.urls()[1], ORIGINAL + '?action=read&t=' + encodeURIComponent(TOK) + '&tipo=MA');
  const llaves = m.st.claves('yodcg_cache_v1:');
  assert.deepEqual(llaves, ['yodcg_cache_v1:' + ORIGINAL + '?q=a%20b%26c%2F%C3%B1&n=0&v=false', 'yodcg_cache_v1:' + ORIGINAL + '?action=read?tipo=MA:' + m.core.hash(TOK)]);
  assert.ok(llaves.every(k => !k.includes(TOK) && !k.includes('t=')), 'la clave no lleva t ni el token');
  assert.deepEqual(JSON.parse(m.st.getItem(llaves[0])).data, [1, 2], 'una respuesta sin campo ok también es válida');
});

test('D1 · catálogo: sin config → sin_config; con config usa clave catalogo:<h>, fresco 5 min, viejo 7 días y alViejo', async () => {
  const m = montar();
  assert.deepEqual(await m.core.catalogo(), { ok: false, status: 0, error: 'sin_config', rechazo: false, origen: 'sin_red', ms: 0 });
  assert.equal(m.core.config({ catalogo: { url: 'http://inseguro.invalid/exec' } }).catalogo, null, 'sólo https');
  assert.deepEqual(m.core.config({ catalogo: { url: CATALOGO }, timeoutMs: 1000, frescoMs: -5, viejoMs: 'x' }), { catalogo: { url: CATALOGO }, timeoutMs: 1000, frescoMs: 600000, viejoMs: 86400000 });
  m.core.config({ timeoutMs: 25000 });
  assert.equal(m.rd.llamadas.length, 0);
  m.rd.pon({ json: { ok: true, rows: ['a'] } });
  const a = await m.core.catalogo();
  assert.equal(m.rd.urls()[0], CATALOGO + '?action=read&resource=Portal&k=' + encodeURIComponent(TOK));
  assert.deepEqual([a.ok, a.origen, a.data.rows], [true, 'red', ['a']]);
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), ['yodcg_cache_v1:catalogo:' + m.core.hash(TOK)]);
  await m.rl.avanzar(4 * MIN);
  assert.equal((await m.core.catalogo()).origen, 'cache'); assert.equal(m.rd.llamadas.length, 1);
  await m.rl.avanzar(2 * MIN);
  let pintado = null; m.rd.pon({ json: { ok: true, rows: ['b'] } });
  const b = await m.core.catalogo({ alViejo: d => { pintado = d.rows; } });
  assert.deepEqual([pintado, b.origen, b.data.rows], [['a'], 'red', ['b']]);
  await m.rl.avanzar(8 * 24 * HORA);
  m.rd.pon('caida', 'caida');
  const c = m.core.catalogo({ alViejo() { assert.fail('7 días: ya no sirve'); } }); await m.rl.avanzar(1500);
  assert.deepEqual([(await c).ok, (await c).error], [false, 'red']);
  const sin = montar({ token: '' }); sin.core.config({ catalogo: { url: CATALOGO } });
  sin.rd.pon({ json: { ok: true, rows: [] } }); await sin.core.catalogo();
  assert.equal(sin.rd.urls()[0], CATALOGO + '?action=read&resource=Portal', 'sin sesión no manda k');
  assert.deepEqual(sin.st.claves('yodcg_cache_v1:'), ['yodcg_cache_v1:catalogo:' + sin.core.hash('')]);
});

test('D2 · arranque: canje y catálogo salen a la vez (en paralelo) y vuelven juntos', async () => {
  const m = montar(), dc = diferido(), dk = diferido();
  m.core.config({ catalogo: { url: CATALOGO } });
  const segunUrl = url => (url.startsWith(CATALOGO) ? dk : dc).promesa;      // el orden de salida es incidental
  m.rd.pon(segunUrl, segunUrl);
  const p = m.core.arranque({ board: 'MA' });
  await asentar();
  assert.equal(m.rd.llamadas.length, 2, 'ambos pedidos en vuelo antes de que conteste alguno');
  assert.deepEqual(m.rd.urls().map(u => u.split('?')[0]).sort(), [CATALOGO, ORIGINAL]);
  dk.ok(respuesta({ json: { ok: true, rows: [1] } })); dc.ok(respuesta({ json: CANJE_OK }));
  const r = await p;
  assert.deepEqual([r.sesion.ok, r.sesion.rol, r.catalogo.ok, r.catalogo.data.rows], [true, 'editor', true, [1]]);
  const sin = montar();                                                      // sin config de catálogo el canje sigue andando
  sin.rd.pon({ json: CANJE_OK });
  const s = await sin.core.arranque();
  assert.deepEqual([s.sesion.ok, s.catalogo.error], [true, 'sin_config']);
});

/* ───────────── adaptador PPP ───────────── */

test('11 · ppp.get lista: con caché resuelve YA como Response (json/text/yod) y revalida en fondo; sin caché y red caída RECHAZA', async () => {
  const m = montar(), P = { recurso: 'lista', tipo: 'MACROLOTES', k: TOK }, H = m.core.hash(TOK);
  const llave = 'yodcg_cache_v1:ppp:lista:MACROLOTES::' + H;
  const v1 = { ok: true, casos: [{ id: 'c1' }] }, v2 = { ok: true, casos: [{ id: 'c1' }, { id: 'c2' }] };
  m.rd.pon({ json: v1 });
  const a = await m.core.ppp.get(PPP, P);
  assert.deepEqual([a.ok, a.status, a.yod.origen, typeof a.yod.ms], [true, 200, 'red', 'number']);
  const da = await a.json(); da.casos.push('mutado por el motor');
  assert.deepEqual(await a.json(), v1, 'cada json() es una copia: el motor no ensucia la caché');
  assert.equal(await a.text(), JSON.stringify(v1));
  assert.equal(m.rd.urls()[0], PPP + '?recurso=lista&tipo=MACROLOTES&k=' + encodeURIComponent(TOK));
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [llave]);
  assert.ok(!llave.includes(TOK) && !m.st.getItem(llave).includes(TOK));

  m.rd.pon({ json: v2 });
  const b = await m.core.ppp.get(PPP, P);
  assert.equal(b.yod.origen, 'cache'); assert.deepEqual(await b.json(), v1, 'lo guardado, ya');
  await asentar();
  assert.equal(m.rd.llamadas.length, 2, 'y se revalida en fondo');
  assert.deepEqual(de(m, 'dato').pop().detalle, { clave: 'ppp:lista:MACROLOTES::' + H, origen: 'red', data: v2, igual: false });
  m.rd.pon({ json: v2 });
  assert.deepEqual(await (await m.core.ppp.get(PPP, P)).json(), v2, 'la revalidación dejó la caché al día');
  await asentar(); assert.equal(de(m, 'dato').pop().detalle.igual, true);

  const n0 = m.rd.llamadas.length;
  const [x, y] = [m.core.ppp.get(PPP, P), m.core.ppp.get(PPP, P)];       // dos llamadas seguidas = una sola revalidación
  m.rd.pon({ json: v2 });
  await Promise.all([x, y]); await asentar();
  assert.equal(m.rd.llamadas.length, n0 + 1);
  const antes = m.rd.llamadas.length;
  m.rd.pon('caida');                                                       // revalidar y fallar no molesta a nadie
  assert.equal((await m.core.ppp.get(PPP, P)).yod.origen, 'cache'); await asentar();
  assert.equal(m.rd.llamadas.length, antes + 1);
  await m.core.ppp.get(PPP, P, { frescoMs: 10 * MIN }); await asentar();
  assert.equal(m.rd.llamadas.length, antes + 1, 'con frescoMs la caché reciente no se revalida');

  await m.rl.avanzar(13 * HORA);                                           // pasó el límite de 12 h: no hay caché que valga
  m.rd.pon('caida');
  await assert.rejects(m.core.ppp.get(PPP, P), e => e instanceof Error && e.message === 'red' && e.rechazo === false);
  const s = montar({ token: TOK }); s.rd.pon('colgado');
  const rechazada = assert.rejects(s.core.ppp.get(PPP, P), e => e.message === 'timeout');
  await s.rl.avanzar(25000); await rechazada;
  assert.equal(s.rd.llamadas.length, 1, 'ppp no reintenta por omisión');
});

test('11c · ppp.get mapa y catálogo también van caché-primero; otros recursos van directo y sin caché; ok:false no se guarda', async () => {
  const m = montar(), H = m.core.hash(TOK);
  m.rd.pon({ json: { ok: true, puntos: 1 } }, { json: { ok: true, puntos: 2 } });
  await m.core.ppp.get(PPP, { recurso: 'mapa', k: TOK });
  assert.equal((await m.core.ppp.get(PPP, { recurso: 'mapa', k: TOK })).yod.origen, 'cache');
  await asentar();
  m.rd.pon({ json: { ok: true, items: [] } });
  await m.core.ppp.get(PPP, { recurso: 'catalogo', k: TOK });
  assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), ['yodcg_cache_v1:ppp:catalogo:::' + H, 'yodcg_cache_v1:ppp:mapa:::' + H]);
  const n = m.rd.llamadas.length;
  m.rd.pon({ json: { ok: true, t: 1 } }, { json: { ok: true, t: 2 } });
  assert.equal((await (await m.core.ppp.get(PPP, { recurso: 'track', k: TOK })).json()).t, 1);
  assert.equal((await (await m.core.ppp.get(PPP, { recurso: 'track', k: TOK })).json()).t, 2, 'sin caché: cada vez a la red');
  assert.equal(m.rd.llamadas.length, n + 2); assert.equal(m.st.claves('yodcg_cache_v1:').length, 2);
  const w = montar(); w.rd.pon({ json: { ok: false, error: 'clave' } });
  const r = await w.core.ppp.get(PPP, { recurso: 'lista', k: TOK });
  assert.deepEqual([r.ok, (await r.json()).error, w.st.claves('yodcg_cache_v1:').length], [true, 'clave', 0]);
});

test('12 · ppp.get caso: red primero aunque haya caché; si la red cae, cache-fallback (24 h) sin esperar; clave por caso_id o palabra', async () => {
  const m = montar(), H = m.core.hash(TOK), P = { recurso: 'caso', caso_id: 'C-001', k: TOK };
  const llave = 'yodcg_cache_v1:ppp:caso::C-001:' + H;
  m.rd.pon({ json: { ok: true, caso: { v: 1 } } }, { json: { ok: true, caso: { v: 2 } } });
  assert.equal((await (await m.core.ppp.get(PPP, P)).json()).caso.v, 1);
  const b = await m.core.ppp.get(PPP, P);
  assert.deepEqual([b.yod.origen, (await b.json()).caso.v, m.rd.llamadas.length], ['red', 2, 2]);
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [llave]);
  await m.rl.avanzar(20 * HORA);
  m.rd.pon('caida');
  const c = await m.core.ppp.get(PPP, P);
  assert.deepEqual([c.ok, c.yod.origen, (await c.json()).caso.v], [true, 'cache-fallback', 2]);
  assert.equal(m.rd.llamadas.length, 3, 'cayó a la caché sin reintentar ni esperar');
  await m.rl.avanzar(5 * HORA);                                            // 25 h: la caché del caso ya no vale
  m.rd.pon('caida');
  await assert.rejects(m.core.ppp.get(PPP, P), e => e.message === 'red');
  m.rd.pon({ json: { ok: true, caso: { v: 3 } } }); await m.core.ppp.get(PPP, P);
  m.rd.pon({ status: 403 });
  await assert.rejects(m.core.ppp.get(PPP, P), e => e.rechazo === true && e.status === 403 && e.message === 'http 403');
  assert.equal(m.st.getItem(llave), null, 'un rechazo no se disfraza con caché');
  m.rd.pon({ json: { ok: true, caso: { v: 4 } } }); await m.core.ppp.get(PPP, { recurso: 'caso', palabra: 'amanecer', k: TOK });
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), ['yodcg_cache_v1:ppp:caso::amanecer:' + H]);
  m.rd.pon({ json: { ok: false, error: 'no_encontrado' } });
  const nf = await m.core.ppp.get(PPP, { recurso: 'caso', caso_id: 'C-9', k: TOK });
  assert.equal((await nf.json()).error, 'no_encontrado'); assert.equal(m.st.claves('yodcg_cache_v1:').length, 1);
});

/* ───────────── telemetría, página, hash ───────────── */

test('13 · telemetría: primerDato una vez; codigos() ≤ 40 sin espacios y sin repetir; resumen() con mediana y p90', async () => {
  const m = montar({ pathname: '/potenciales-yod/macrolotes.html' }), T = m.core.telemetria;
  await m.rl.avanzar(1832);
  assert.equal(T.primerDato('red', { via: 'lista' }), true);
  assert.equal(T.primerDato('cache'), false, 'sólo la primera cuenta');
  assert.deepEqual(de(m, 'primer-dato').map(e => e.detalle), [{ t: 1832, origen: 'red', tablero: 'MA', frio: true, extra: { via: 'lista' } }]);
  assert.deepEqual(T.codigos(), ['pd:MA:1832:r']);
  assert.deepEqual(T.codigos(), [], 'ya reportado');
  assert.deepEqual(JSON.parse(m.st.getItem('yodcg_telemetria_v1')), [{ t: 1832, p: 'pd', tablero: 'MA', origen: 'red', frio: true }]);

  m.core.config({ catalogo: { url: CATALOGO } });
  m.rd.pon(async () => { await m.rl.avanzar(250); return respuesta({ json: CANJE_OK }); }, async () => { await m.rl.avanzar(120); return respuesta({ json: { ok: true, rows: [] } }); });
  await m.core.sesion.canjear();
  await m.core.catalogo();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear({ modo: 'red' });
  await m.core.sesion.canjear(); await m.core.catalogo();
  const cods = T.codigos();
  assert.deepEqual(cods, ['cj:MA:250:r', 'cat:120:r'], 'un código por tipo y por página');
  assert.ok(cods.every(c => /^\S{1,40}$/.test(c)));
  assert.deepEqual(T.codigos(), []);
  assert.equal(T.marca('arranque'), m.rl.perfNow());

  const r = montar({ token: TOK });                                        // otra página, misma sesión ya en caché: arranca «caliente»
  r.rd.pon({ json: CANJE_OK }); await r.core.sesion.canjear();
  const r2 = crear(Object.assign({}, r.env, { location: { pathname: '/yod-portal/os/', search: '', hash: '' } }));
  r2.telemetria.primerDato('cache');
  assert.deepEqual(r2.telemetria.codigos(), ['pd:OS:0:c']);
  assert.equal(JSON.parse(r.st.getItem('yodcg_telemetria_v1')).pop().frio, false);

  const q = montar();
  const anillo = [{ t: 100, p: 'pd', tablero: 'MA' }, { t: 200, p: 'cj', tablero: 'MA' }, { t: 300, p: 'pd', tablero: 'MA' }, { t: 400, p: 'cat', tablero: 'MA' }, { t: 1000, p: 'pd', tablero: 'MA' }, { t: 50, p: 'pd', tablero: 'MX' }];
  q.st.setItem('yodcg_telemetria_v1', JSON.stringify(anillo.concat([{ t: 'x' }, null, 7])));
  assert.deepEqual(q.core.telemetria.resumen(), { n: 6, mediana_ms: 250, p90_ms: 1000, ultimos: anillo });
  assert.deepEqual([q.core.telemetria.resumen({ tablero: 'MA' }).n, q.core.telemetria.resumen({ tablero: 'MA' }).mediana_ms, q.core.telemetria.resumen({ tablero: 'MA' }).p90_ms], [5, 300, 1000]);
  assert.deepEqual([q.core.telemetria.resumen({ p: 'pd' }).mediana_ms, q.core.telemetria.resumen({ tablero: 'MX' }).n, q.core.telemetria.resumen({ tablero: 'ZZ' }).n], [200, 1, 0]);
  const largo = Array.from({ length: 12 }, (_, i) => ({ t: (i + 1) * 10, p: 'pd', tablero: 'MA' }));
  q.st.setItem('yodcg_telemetria_v1', JSON.stringify(largo));
  assert.deepEqual(q.core.telemetria.resumen().ultimos.map(x => x.t), [30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
  q.core.telemetria.limpiar();
  assert.deepEqual(q.core.telemetria.resumen(), { n: 0, mediana_ms: 0, p90_ms: 0, ultimos: [] });
  q.st.setItem('yodcg_telemetria_v1', '{no es json');
  assert.equal(q.core.telemetria.resumen().n, 0, 'un anillo dañado cuenta como vacío');
});

test('13b · el anillo guarda como mucho 60 muestras (las más recientes) y limpiar() no toca la sesión', async () => {
  const m = montar(), viejo = Array.from({ length: 60 }, (_, i) => ({ t: i + 1, p: 'lista', tablero: 'MA', origen: 'red', frio: false }));
  m.st.setItem('yodcg_telemetria_v1', JSON.stringify(viejo));
  m.rd.pon({ json: { ok: true } }, { json: { ok: true } });
  await m.core.get(ORIGINAL, { recurso: 'lista' }, { telemetria: 'lista' });
  await m.core.get(ORIGINAL, { recurso: 'lista' }, { telemetria: 'lista' });
  const a = JSON.parse(m.st.getItem('yodcg_telemetria_v1'));
  assert.equal(a.length, 60); assert.equal(a[0].t, 4, 'salieron las 3 más viejas (2 nuevas + el primer dato)');
  assert.deepEqual(a.pop(), { t: 0, p: 'lista', tablero: 'MA', origen: 'red', frio: true });
  m.core.telemetria.limpiar();
  assert.equal(m.st.getItem('yodcg_telemetria_v1'), null); assert.equal(m.st.getItem('pyod_clave_v1'), TOK);
  m.core.purgar();
  m.st.setItem('yodcg_telemetria_v1', '[]'); m.core.purgar(); m.core.sesion.cerrar({ token: OTRO });
  assert.equal(m.st.getItem('yodcg_telemetria_v1'), '[]', 'ni purgar ni cerrar borran la telemetría');
});

test('pagina(): mismo criterio que portero.js más tablero, obra y la cabina (os/index)', () => {
  const casos = [
    ['/potenciales-yod/index.html', 'PT'], ['/potenciales-yod/', 'PT'], ['/', 'PT'], ['', 'PT'], ['/potenciales-yod/mapa.html', 'MP'], ['/potenciales-yod/macrolotes.html', 'MA'],
    ['/potenciales-yod/mixto.html', 'MX'], ['/potenciales-yod/unifamiliar.html', 'UN'], ['/potenciales-yod/residencial.html', 'RE'], ['/potenciales-yod/patrimonial.html', 'PA'],
    ['/potenciales-yod/accesos.html', 'AC'], ['/yod-portal/tablero.html', 'TB'], ['/yod-portal/obra.html', 'OB'], ['/yod-portal/os/', 'OS'], ['/yod-portal/os/index.html', 'OS'],
    ['/yod-portal/track-alysa.html', 'TA'], ['/yod-portal/track-maria.html', 'TM'], ['/yod-portal/track-codesarrollos.html', 'TC'],
    ['/real-miramar-board/', 'MR'], ['/real-miramar-board/index.html', 'MR'], ['/real-miramar-board/tramites.html', 'MT'], ['/real-miramar-board/direccion.html', 'MD'],
    ['/real-miramar-board/evidencia.html', 'ME'], ['/real-miramar-board/cuentas.html', 'MC'], ['/real-miramar-board/otra.html', 'MO'],
    ['/yod-portal/despacho.html', 'DE'], ['/x/constructor.html', 'CO'], ['/x/ab', 'AB']
  ];
  for (const [ruta, esperado] of casos) assert.equal(montar({ pathname: ruta }).core.pagina(), esperado, ruta || '(vacío)');
});

test('hash: FNV-1a de 32 bits (vectores conocidos), siempre 8 hex y determinista', () => {
  const { hash } = montar().core;
  assert.deepEqual(['', 'a', 'foobar'].map(hash), ['811c9dc5', 'e40c292c', 'bf9cf968']);
  for (const s of [TOK, OTRO, 'ñandú 📌', undefined, null, 12345]) assert.match(hash(s), /^[0-9a-f]{8}$/);
  assert.equal(hash(undefined), hash('')); assert.notEqual(hash(TOK), hash(OTRO));
});

/* ───────────── carga diferida, reversión, ?sesion= ───────────── */

test('14 · cargarDespues: entra con el primer dato, o a los maxMs, o en idle; nunca dos veces el mismo src; resuelve con el script', async () => {
  const SRC = 'https://cdn.invalid/pesado.js';
  const m = montar();
  const p = m.core.cargarDespues(SRC, { atributos: { async: true, crossorigin: 'anonymous', 'data-x': 7 } });
  await asentar(); await m.rl.avanzar(3999);
  assert.equal(m.insertados.length, 0, 'todavía no hay nada que mirar');
  assert.equal(m.core.cargarDespues(SRC, { cuando: 'idle' }), p, 'misma promesa para el mismo src');
  m.core.telemetria.primerDato('red');
  assert.equal(m.insertados.length, 1);
  const sc = m.insertados[0];
  assert.equal(sc.src, SRC); assert.deepEqual(sc.attrs, { async: '', crossorigin: 'anonymous', 'data-x': '7' });
  assert.equal(m.rl.timers.length, 0, 'el plazo maxMs se canceló');
  sc.onload(); assert.equal(await p, sc);
  assert.equal(m.core.cargarDespues(SRC), p); m.core.telemetria.primerDato('cache');
  assert.equal(m.insertados.length, 1);

  const b = montar(); b.core.cargarDespues('https://cdn.invalid/b.js');   // maxMs por omisión: 4 s
  await b.rl.avanzar(3999); assert.equal(b.insertados.length, 0);
  await b.rl.avanzar(1); assert.equal(b.insertados.length, 1);
  b.core.telemetria.primerDato('red'); assert.equal(b.insertados.length, 1, 'el evento tardío ya no inserta de nuevo');

  const c = montar(); c.core.cargarDespues('https://cdn.invalid/c.js', { maxMs: 100 });
  await c.rl.avanzar(100); assert.equal(c.insertados.length, 1);

  const d = montar(); d.core.telemetria.primerDato('cache');               // el primer dato ya pasó: entra de inmediato
  const pd = d.core.cargarDespues('https://cdn.invalid/d.js');
  assert.equal(d.insertados.length, 1); d.insertados[0].onerror();
  await assert.rejects(pd, /carga/);

  let idle = null; const e = montar({ idle: (f, o) => { idle = { f, o }; return 7; } });
  e.core.cargarDespues('https://cdn.invalid/e.js', { cuando: 'idle', maxMs: 900 });
  assert.equal(idle.o.timeout, 900); e.core.telemetria.primerDato('red');
  assert.equal(e.insertados.length, 0, 'en idle el primer dato no cuenta'); idle.f(); assert.equal(e.insertados.length, 1);
  await e.rl.avanzar(900); assert.equal(e.insertados.length, 1);
  const f = montar(); f.core.cargarDespues('https://cdn.invalid/f.js', { cuando: 'idle', maxMs: 250 });   // Safari: sin requestIdleCallback
  await f.rl.avanzar(250); assert.equal(f.insertados.length, 1);
});

test('15 · legacy (?cargador=legacy, #…&cargador=legacy o yodcg_legacy=1): todo sigue existiendo pero sin caché, sin dedupe y sin esperas', async () => {
  const activos = [{ search: '?cargador=legacy' }, { search: '?a=1&cargador=legacy&b=2' }, { hash: '#x=1&cargador=legacy' }, { hash: '#cargador=legacy' }, { storage: almacen({ pyod_clave_v1: TOK, yodcg_legacy: '1' }) }];
  for (const op of activos) assert.equal(montar(op).core.legacy, true, JSON.stringify(Object.keys(op)) + JSON.stringify(op.search || op.hash || ''));
  for (const op of [{}, { search: '?cargador=nuevo' }, { search: '?cargador=legacyx' }, { search: '?x=cargador=legacy' }, { hash: '#a=cargador-legacy' }, { storage: almacen({ pyod_clave_v1: TOK, yodcg_legacy: '0' }) }]) assert.equal(montar(op).core.legacy, false);
  assert.equal(typeof montar().core.legacy, 'boolean');

  const m = montar({ search: '?cargador=legacy' });
  m.rd.pon({ json: CANJE_OK }, { json: CANJE_OK }, { json: CANJE_OK });
  const [a, b] = await Promise.all([m.core.sesion.canjear(), m.core.sesion.canjear()]);
  assert.equal(m.rd.llamadas.length, 2, 'sin dedupe'); assert.ok(a.ok && b.ok && a.origen === 'red');
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null, 'no guarda caché de sesión');
  assert.equal((await m.core.sesion.canjear()).origen, 'red'); assert.equal(m.rd.llamadas.length, 3);

  const g = montar({ search: '?cargador=legacy' });                        // aunque haya caché sembrada de otro tiempo, se ignora
  g.st.setItem('yodcg_cache_v1:z', JSON.stringify({ ts: g.rl.t, data: { ok: true, viejo: true } }));
  g.st.setItem('yodcg_cache_v1:ppp:lista:MACROLOTES::' + g.core.hash(TOK), JSON.stringify({ ts: g.rl.t, data: { ok: true, viejo: true } }));
  g.rd.pon({ json: { ok: true, nuevo: true } }, { json: { ok: true, nuevo: true } }, { json: { ok: true, nuevo: 2 } }, { json: { ok: true, nuevo: 3 } });
  let pintado = false;
  const r = await g.core.get(ORIGINAL, { k: TOK }, { clave: 'z', viejoMs: HORA, frescoMs: HORA, alViejo() { pintado = true; } });
  assert.deepEqual([r.origen, r.data.nuevo, pintado], ['red', true, false]);
  const l1 = await g.core.ppp.get(PPP, { recurso: 'lista', tipo: 'MACROLOTES', k: TOK });
  assert.deepEqual([l1.yod.origen, (await l1.json()).nuevo], ['red', true]);
  const l2 = await g.core.ppp.get(PPP, { recurso: 'lista', tipo: 'MACROLOTES', k: TOK });
  assert.equal((await l2.json()).nuevo, 2); assert.equal(g.rd.llamadas.length, 3, 'ppp.get: cada llamada va a la red');
  assert.equal(JSON.parse(g.st.getItem('yodcg_cache_v1:z')).data.viejo, true, 'legacy no toca la caché de nadie');
  assert.deepEqual(de(g, 'dato').map(e => e.detalle.clave), ['z'], 'get avisa cada resolución de red; ppp.get en legacy no revalida y no avisa');

  g.core.cargarDespues('https://cdn.invalid/l.js');
  assert.equal(g.insertados.length, 1, 'inmediato');
  g.core.telemetria.primerDato('red');
  assert.deepEqual(g.core.telemetria.codigos(), ['pd:MA:0:r'], 'la telemetría sigue midiendo');
  assert.equal(JSON.parse(g.st.getItem('yodcg_telemetria_v1')).length >= 2, true);
  const s = montar({ search: '?cargador=legacy&sesion=' + TOK, token: '' });
  assert.equal(s.st.getItem('pyod_clave_v1'), TOK, '?sesion= se procesa también en legacy');
});

test('16 · ?sesion= se guarda y se quita de la URL conservando el resto; ?liga= no se toca', () => {
  const m = montar({ token: '', pathname: '/potenciales-yod/macrolotes.html', search: '?x=1&sesion=' + TOK + '&y=2', hash: '#mapa' });
  assert.equal(m.st.getItem('pyod_clave_v1'), TOK); assert.equal(m.core.sesion.token(), TOK);
  assert.deepEqual(m.hist.reemplazos, ['/potenciales-yod/macrolotes.html?x=1&y=2#mapa']);
  assert.equal(m.loc.search, '?x=1&y=2');

  const solo = montar({ token: '', pathname: '/yod-portal/os/', search: '?sesion=' + OTRO });
  assert.deepEqual(solo.hist.reemplazos, ['/yod-portal/os/']); assert.equal(solo.st.getItem('pyod_clave_v1'), OTRO);

  const liga = montar({ token: '', search: '?liga=lg-prueba-1' });
  assert.deepEqual(liga.hist.reemplazos, []); assert.equal(liga.st.getItem('pyod_clave_v1'), null);
  assert.equal(liga.loc.search, '?liga=lg-prueba-1'); assert.equal(liga.rd.llamadas.length, 0, 'canjear la liga es de portero.js');

  const ambas = montar({ token: '', search: '?liga=lg-prueba-2&sesion=' + TOK });
  assert.equal(ambas.st.getItem('pyod_clave_v1'), TOK); assert.equal(ambas.loc.search, '?liga=lg-prueba-2');

  const vacia = montar({ search: '?sesion=' });                            // ya había sesión: un ?sesion= vacío no la pisa
  assert.equal(vacia.st.getItem('pyod_clave_v1'), TOK); assert.deepEqual(vacia.hist.reemplazos, []);
  const pisa = montar({ search: '?sesion=' + OTRO });
  assert.equal(pisa.st.getItem('pyod_clave_v1'), OTRO, 'la liga nueva reemplaza a la sesión anterior, como portero.js');

  const sinHist = montar({ token: '', search: '?sesion=' + TOK }); // eslint-disable-line
  const env = Object.assign({}, sinHist.env, { history: undefined, location: { pathname: '/p.html', search: '?sesion=' + TOK, hash: '' }, storage: almacen() });
  assert.doesNotThrow(() => crear(env)); assert.equal(env.storage.getItem('pyod_clave_v1'), TOK);
});

/* ───────────── almacenamiento roto o lleno ───────────── */

async function recorrido(m) { // usa casi toda la API; nada puede lanzar
  const T = m.core.telemetria;
  m.rd.pon({ json: CANJE_OK }, { json: { ok: true, n: 1 } }, { json: { ok: true, n: 2 } }, { json: { ok: true, n: 3 } }, { json: { ok: true, n: 4 } });
  const out = {};
  out.canje = await m.core.sesion.canjear({ board: 'MA' });
  out.get = await m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'q', viejoMs: HORA, telemetria: 'lista' });
  out.ppp1 = await m.core.ppp.get(PPP, { recurso: 'lista', k: TOK });
  out.ppp2 = await m.core.ppp.get(PPP, { recurso: 'lista', k: TOK }); await asentar();
  T.primerDato('red'); T.marca('x'); out.codigos = T.codigos(); out.resumen = T.resumen(); T.limpiar();
  m.core.purgar(); out.cerrar = m.core.sesion.cerrar({ token: TOK, motivo: 'prueba' }); out.token = m.core.sesion.token();
  return out;
}

test('17 · localStorage que lanza (cuota llena, bloqueado o ausente): ninguna llamada revienta y todo sigue andando sin caché', async () => {
  const lleno = almacen({ pyod_clave_v1: TOK }); lleno.cuota = 0;          // leer sí, escribir nunca (ni podando)
  const a = await recorrido(montar({ storage: lleno }));
  assert.deepEqual([a.canje.ok, a.canje.origen, a.get.ok, a.get.origen, a.ppp1.yod.origen, a.ppp2.yod.origen], [true, 'red', true, 'red', 'red', 'red']);
  assert.deepEqual(a.codigos.map(c => c.split(':')[0]).sort(), ['cj', 'pd'], 'la telemetría de la página sigue andando aunque no pueda guardar el anillo');
  assert.deepEqual([a.resumen.n, a.cerrar], [0, true]);
  assert.equal(lleno.claves('yodcg_').length, 0);

  for (const storage of [Object.assign(almacen(), { rota: true }), null]) {
    const m = montar({ storage }), b = await (async () => { m.rd.pon({ json: { ok: true, n: 1 } }, { json: { ok: true, n: 2 } }, { json: { ok: true, n: 3 } }); return recorrido(m); })();
    assert.deepEqual([b.token, b.canje.error, b.canje.rechazo, b.cerrar], ['', 'sin_sesion', true, false], 'sin storage no hay sesión que canjear');
    assert.deepEqual([b.get.ok, b.ppp1.yod.origen, b.ppp2.yod.origen], [true, 'red', 'red']);
    assert.equal(m.core.legacy, false);
  }
  const bloqueado = montar({ storage: Object.assign(almacen(), { rota: true }), search: '?sesion=' + TOK });
  assert.deepEqual(bloqueado.hist.reemplazos, [], 'si no pudo guardar el token, la URL queda tal cual para portero.js');

  const roto = { fetch: red().fetch, setTimeout: reloj().setTimeout, clearTimeout() { }, YOD_PORTERO: { original: ORIGINAL } };
  Object.defineProperty(roto, 'localStorage', { get() { throw new Error('SecurityError: acceso denegado'); } });
  const core = crear(roto);                                               // sin document, performance, location, now ni dispatchEvent
  assert.deepEqual([core.sesion.token(), core.pagina(), core.legacy], ['', 'PT', false]);
  assert.equal((await core.sesion.canjear()).error, 'sin_sesion');
  assert.equal(core.telemetria.primerDato('red'), true);
  assert.equal(core.telemetria.codigos()[0].startsWith('pd:PT:'), true);
  await assert.rejects(core.cargarDespues('https://cdn.invalid/x.js', { maxMs: 0 }));
  const r = red(); r.pon({ json: { ok: true } });
  const sinNada = crear({ fetch: r.fetch, setTimeout: reloj().setTimeout, clearTimeout() { }, storage: almacen({ pyod_clave_v1: TOK }), YOD_PORTERO: { original: ORIGINAL } });
  r.pon({ json: CANJE_OK });
  assert.equal((await sinNada.sesion.canjear()).ok, true);
});

test('cuota llena: se borran las cachés más viejas (no las ajenas) y se reintenta UNA vez; si sigue llena, se sigue sin caché', async () => {
  const st = almacen({ pyod_clave_v1: TOK });
  for (let i = 1; i <= 4; i++) st.setItem('yodcg_cache_v1:viejo' + i, JSON.stringify({ ts: i * 1000, data: 'x'.repeat(100) }));
  st.setItem('otra_app', 'z'.repeat(50));
  const usado = [...st.mapa].reduce((n, [k, v]) => n + k.length + v.length, 0);
  st.cuota = usado + 30;
  const m = montar({ storage: st });
  m.rd.pon({ json: { ok: true, n: 1 } }, { json: { ok: true, n: 2 } });
  assert.equal((await m.core.get(ORIGINAL, {}, { clave: 'nuevo', viejoMs: HORA })).ok, true);
  assert.deepEqual(st.claves('yodcg_cache_v1:'), ['yodcg_cache_v1:viejo3', 'yodcg_cache_v1:viejo4', 'yodcg_cache_v1:nuevo'], 'salieron las dos MÁS viejas');
  assert.equal(st.getItem('otra_app'), 'z'.repeat(50)); assert.equal(st.getItem('pyod_clave_v1'), TOK);
  st.cuota = 10;                                                           // ya nada cabe
  const r = await m.core.get(ORIGINAL, {}, { clave: 'nuevo2', viejoMs: HORA });
  assert.equal(r.ok, true); assert.equal(st.getItem('yodcg_cache_v1:nuevo2'), null);
  assert.deepEqual(st.claves('yodcg_cache_v1:'), ['yodcg_cache_v1:viejo4', 'yodcg_cache_v1:nuevo'], 'una sola poda por intento, sin bucle');
});

/* ───────────── el archivo en sí ───────────── */

const FUENTE = fs.readFileSync(path.join(__dirname, '../os/yod-cargador.js'), 'utf8');

test('el archivo es público y clásico: sin ids de Apps Script, correos, hojas ni respaldo; sin POST; sólo ES2017', () => {
  assert.doesNotMatch(FUENTE, /AKfy|AIza|gh[pousr]_|docs\.google|script\.google|@[A-Za-z0-9._-]+\.[A-Za-z]/);
  assert.doesNotMatch(FUENTE, /\.respaldo|\[\s*['"]respaldo['"]/, 'nunca se lee la dirección de respaldo');
  assert.doesNotMatch(FUENTE, /method\s*:|sendBeacon|XMLHttpRequest|\.send\(/, 'sólo lectura: ningún POST');
  assert.doesNotMatch(FUENTE, /console\.(log|info|debug)/, 'en operación normal no se imprime nada');
  assert.doesNotMatch(FUENTE, /^\s*(import|export)\s|\beval\s*\(|new Function|document\.write|innerHTML|\.finally\(|\?\?|\?\.[A-Za-z_$(\[]|\{\s*\.\.\.|\(\?<[=!]/m);
  assert.match(FUENTE, /^\/\*[\s\S]*?\*\/\s*\(function \(raiz\) \{\s*'use strict';/, 'IIFE clásico con use strict');
  assert.ok(Buffer.byteLength(FUENTE) <= LIMITE_BYTES, 'tamaño ' + Buffer.byteLength(FUENTE) + ' B > ' + LIMITE_BYTES);
});

test('fábrica exportable en Node; en el navegador se autoinstancia como window.YodCargador y es idempotente', () => {
  assert.equal(typeof crear, 'function'); assert.equal(crear.length, 1);
  assert.equal(typeof globalThis.YodCargador, 'undefined', 'en Node no se instancia nada global');
  const ctx = {
    fetch() { return new Promise(() => { }); }, localStorage: almacen({ pyod_clave_v1: TOK }), location: { pathname: '/yod-portal/os/', search: '', hash: '' },
    document: { currentScript: null }, performance: { now: () => 5 }, setTimeout, clearTimeout, console, URLSearchParams, AbortController, CustomEvent,
    addEventListener() { }, removeEventListener() { }, dispatchEvent() { return true; }
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(FUENTE, ctx);
  const primera = ctx.YodCargador;
  assert.equal(primera.v, '1'); assert.equal(primera.legacy, false); assert.equal(primera.pagina(), 'OS'); assert.equal(primera.sesion.token(), TOK);
  vm.runInContext(FUENTE, ctx);
  assert.equal(ctx.YodCargador, primera, 'el segundo script no hace nada');
  assert.deepEqual(Object.keys(primera).sort(), ['arranque', 'cargarDespues', 'catalogo', 'config', 'get', 'hash', 'legacy', 'pagina', 'ppp', 'purgar', 'sesion', 'telemetria', 'v']);
  assert.deepEqual(Object.keys(primera.sesion).sort(), ['alCambiar', 'canjear', 'cerrar', 'esRechazo', 'token']);
  assert.deepEqual(Object.keys(primera.telemetria).sort(), ['codigos', 'limpiar', 'marca', 'primerDato', 'resumen']);
});

test('transporte tolerante: vale un fetch con sólo json(); sin AbortController no hay signal; el catálogo con token ajeno no se guarda', async () => {
  const m = montar();
  m.rd.pon(async () => ({ ok: true, json: async () => CANJE_OK }), async () => ({ json: async () => ({ ok: true, x: 1 }) }), async () => ({ ok: false }), async () => ({ ok: false }), async () => ({ status: 200, text: async () => '[1,2]' }), async () => ({ status: 200, text: async () => '7' }));
  assert.equal((await m.core.sesion.canjear()).ok, true);
  const b = await m.core.get(ORIGINAL, {}, {});
  assert.deepEqual([b.ok, b.data.x, b.status], [true, 1, 200]);
  const c = m.core.get(ORIGINAL, {}, {}); await m.rl.avanzar(1500);
  assert.deepEqual([(await c).ok, (await c).error, (await c).status], [false, 'http', 0]);
  assert.deepEqual((await m.core.get(ORIGINAL, {}, {})).data, [1, 2]);
  const d = await m.core.get(ORIGINAL, {}, {});
  assert.deepEqual([d.ok, d.error], [false, 'formato'], 'un JSON que no es objeto ni lista no es un dato');

  m.core.config({ catalogo: { url: CATALOGO } });
  m.rd.pon({ json: { ok: true, rows: [] } });
  await m.core.catalogo({ token: OTRO });
  assert.equal(m.rd.urls().pop(), CATALOGO + '?action=read&resource=Portal&k=' + encodeURIComponent(OTRO));
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'con la credencial de otra persona no se guarda');

  const vistos = [];
  const ctx = {
    fetch: (u, o) => { vistos.push(o); return Promise.resolve(respuesta({ json: CANJE_OK })); }, localStorage: almacen({ pyod_clave_v1: TOK }),
    location: { pathname: '/p.html', search: '', hash: '' }, document: { currentScript: null }, performance: { now: () => 5 },
    setTimeout, clearTimeout, console, URLSearchParams, CustomEvent, addEventListener() { }, removeEventListener() { }, dispatchEvent() { return true; },
    YOD_PORTERO: { original: ORIGINAL }
  };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(FUENTE, ctx);   // contexto sin AbortController
  const r = await ctx.YodCargador.sesion.canjear();
  assert.equal(r.ok, true); assert.equal('signal' in vistos[0], false); assert.deepEqual([vistos[0].cache, vistos[0].credentials], ['no-store', 'omit']);
});
