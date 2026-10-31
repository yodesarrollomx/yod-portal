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
  const st = op.storage || almacen(op.token === undefined ? { pyod_clave_v1: TOK } : op.token ? { pyod_clave_v1: op.token } : {});
  const loc = { pathname: op.pathname || '/potenciales-yod/macrolotes.html', search: op.search || '', hash: op.hash || '' };
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

test('10a · HTTP 401/403 = rechazo sin reintento; 500 reintenta una vez; JSON inválido no reintenta', async () => {
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

test('10b · sin YOD_PORTERO inyecta yod-acceso.js junto a este archivo y espera; sin dirección no hay fetch; nunca usa el respaldo', async () => {
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

//@@T
