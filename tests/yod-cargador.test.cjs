'use strict';
/* Pruebas de os/yod-cargador.js (T-101; entrega 2, T-201). Sin red y sin reloj real: fetch, storage, timers,
   location, document, navigator y performance son falsos y los controla cada prueba, así que todas son
   deterministas. Sólo hay datos sintéticos (hosts .invalid, tokens de mentira, sin correos). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crear = require('../os/yod-cargador.js');
const ETIQUETA = require('../os/versiones.json').propia; // la etiqueta la gobierna scripts/versiones.cjs --aplicar

const ORIGINAL = 'https://portero.invalid/exec';
const RESPALDO = 'https://respaldo.invalid/exec';
const CATALOGO = 'https://catalogo.invalid/exec';
const PPP = 'https://ppp.invalid/exec';
const TOK = 'sy-prueba-0000000000000001';
const OTRO = 'sy-prueba-0000000000000002';
const MIN = 60000, HORA = 3600000;
const LIMITE_BYTES = 32000;                                               // tope de regresión (entrega 2: recordar, peek, verificación y dispositivo; el objetivo de diseño era 14 KB, ver el reporte de T-101)
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
  if (op.navigator) env.navigator = op.navigator;                          // sin él (como en Node) el dispositivo es «otro»
  const eventos = [];
  ['sesion', 'sesion-rechazada', 'sesion-cerrada', 'dato', 'dato-negado', 'primer-dato'].forEach(n => bus.addEventListener('yodcargador:' + n, e => eventos.push({ tipo: n, detalle: e.detail })));
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

test('4 · refresco rechazado (revocado): borra la caché de sesión Y las de datos, avisa y NO toca pyod_clave_v1', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }, { json: { ok: true, casos: [] } }, { json: { ok: false, error: 'revocado' } });
  await m.core.sesion.canjear();
  await m.core.ppp.get(PPP, { recurso: 'lista', tipo: 'MACROLOTES', k: TOK });
  assert.equal(m.st.claves('yodcg_cache_v1:').length, 1, 'hay una lista guardada que sigue vigente (12 h)');
  await m.rl.avanzar(2 * HORA);
  const r = await m.core.sesion.canjear();
  assert.equal(r.origen, 'cache');
  await asentar();
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'ni la lista de la persona rechazada se sigue sirviendo');
  assert.equal(m.st.getItem('pyod_clave_v1'), TOK, 'cerrar() lo decide el adoptante');
  const ev = de(m, 'sesion-rechazada');
  assert.equal(ev.length, 1); assert.deepEqual(ev[0].detalle, { error: 'revocado', token: TOK });
  assert.equal(de(m, 'sesion').length, 0);
  m.rd.pon({ json: { ok: false, error: 'revocado' } });
  const otra = await m.core.sesion.canjear();
  assert.deepEqual([otra.ok, otra.rechazo, otra.origen, otra.error], [false, true, 'red', 'revocado']);
});

test('4b · la sesión guardada vale 12 h (como las listas): a 12 h menos 1 ms sigue siendo caché; a las 12 h se pide a la red', async () => {
  const a = montar();
  assert.equal(a.core.config().viejoMs, 12 * HORA);
  a.rd.pon({ json: CANJE_OK }, { json: CANJE_OK });
  await a.core.sesion.canjear();
  await a.rl.avanzar(12 * HORA - 1);
  const x = await a.core.sesion.canjear();
  assert.deepEqual([x.origen, x.edadMs, x.rol], ['cache', 12 * HORA - 1, 'editor']);
  await asentar();
  const b = montar();
  b.rd.pon({ json: CANJE_OK }, { json: Object.assign({}, CANJE_OK, { rol: 'admin' }) });
  await b.core.sesion.canjear();
  await b.rl.avanzar(12 * HORA);
  const y = await b.core.sesion.canjear();
  assert.deepEqual([y.origen, y.rol, b.rd.llamadas.length], ['red', 'admin', 2], 'cumplidas las 12 h ya no se pinta con la caché');
  const c = montar();                                                      // el adoptante puede ampliar o reducir la ventana
  c.core.config({ viejoMs: 3 * HORA });
  c.rd.pon({ json: CANJE_OK }, { json: CANJE_OK });
  await c.core.sesion.canjear(); await c.rl.avanzar(3 * HORA - 1);
  assert.equal((await c.core.sesion.canjear()).origen, 'cache'); await asentar();
  const d = montar(); d.core.config({ viejoMs: 3 * HORA });
  d.rd.pon({ json: CANJE_OK }, { json: CANJE_OK });
  await d.core.sesion.canjear(); await d.rl.avanzar(3 * HORA);
  assert.equal((await d.core.sesion.canjear()).origen, 'red');
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

test('6 · timeout: espera 1.5 s y reintenta UNA vez contra el MISMO original con el plazo de frío (75 s); no inventa rechazo', async () => {
  const m = montar();
  const p = m.core.sesion.canjear({ board: 'MA' });
  await asentar();
  assert.equal(m.rd.llamadas.length, 1);
  await m.rl.avanzar(24999); assert.equal(m.rd.llamadas.length, 1, 'el primer intento sigue con 25 s');
  await m.rl.avanzar(1);
  assert.equal(m.rd.llamadas[0].opt.signal.aborted, true, 'el plazo aborta la petición');
  await m.rl.avanzar(1499); assert.equal(m.rd.llamadas.length, 1, 'aún espera el 1.5 s');
  await m.rl.avanzar(1); assert.equal(m.rd.llamadas.length, 2);
  let resuelto = false; p.then(() => { resuelto = true; });
  await m.rl.avanzar(74999);
  assert.equal(resuelto, false, 'el reintento aguanta 75 s (Apps Script arrancando en frío), no 25'); assert.equal(m.rd.llamadas[1].opt.signal.aborted, false);
  await m.rl.avanzar(1);
  const r = await p;
  assert.equal(m.rd.llamadas[1].opt.signal.aborted, true);
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

test('O4 · canje en frío: si el primer intento muere a los 25 s, el reintento todavía puede tardar hasta 75 s y entrar; sólo el canje; configurable', async () => {
  const m = montar(), d = diferido();
  m.rd.pon('colgado', { diferido: d });                                    // Apps Script arrancando: el primer intento nunca contesta
  const p = m.core.sesion.canjear();
  await m.rl.avanzar(25000 + 1500);                                        // 25 s de plazo + 1.5 s de espera
  assert.equal(m.rd.llamadas.length, 2);
  await m.rl.avanzar(60000);                                               // 60 s después de lanzar el reintento: todavía vive (con 25 s ya habría muerto)
  d.ok(respuesta({ json: CANJE_OK }));
  const r = await p;
  assert.deepEqual([r.ok, r.origen, r.rol], [true, 'red', 'editor']);
  assert.equal(m.rd.llamadas[1].opt.signal.aborted, false);

  const c = montar(); assert.equal(c.core.config().timeoutFrioMs, 75000);   // los plazos por omisión
  assert.equal(c.core.config({ timeoutFrioMs: 5000 }).timeoutFrioMs, 5000);
  assert.equal(c.core.config({ timeoutFrioMs: 0 }).timeoutFrioMs, 5000, 'un plazo de 0 ms no vale');
  assert.equal(c.core.config({ timeoutFrioMs: 'x' }).timeoutFrioMs, 5000);
  assert.equal(c.core.config({ timeoutFrioMs: -1 }).timeoutFrioMs, 5000);
  c.rd.pon('colgado', 'colgado');
  const q = c.core.sesion.canjear(); let fin = false; q.then(() => { fin = true; });
  await c.rl.avanzar(25000 + 1500 + 4999); assert.equal(fin, false);
  await c.rl.avanzar(1);
  assert.deepEqual([(await q).error, c.rd.llamadas.length], ['timeout', 2]);

  const g = montar();                                                      // get y ppp.get no cambian: su reintento sigue con timeoutMs
  g.rd.pon('colgado', 'colgado');
  const pg = g.core.get(ORIGINAL, { recurso: 'lista' }, {}); let finG = false; pg.then(() => { finG = true; });
  await g.rl.avanzar(25000 + 1500 + 24999); assert.equal(finG, false);
  await g.rl.avanzar(1);
  assert.deepEqual([(await pg).error, g.rd.llamadas.length], ['timeout', 2]);
  const w = montar(); w.rd.pon('colgado', 'colgado');
  const pw = w.core.ppp.get(PPP, { recurso: 'lista', k: TOK }, { reintentos: 1 }); let finW = false; pw.catch(() => { finW = true; });
  await w.rl.avanzar(25000 + 1500 + 24999); assert.equal(finW, false);
  await w.rl.avanzar(1); await assert.rejects(pw, e => e.message === 'timeout');
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

/* ───────────── sesion.peek(): la identidad guardada, síncrona y sin red (T-201 punto 5) ───────────── */

test('P1 · peek: sin identidad guardada es null; tras un canje devuelve {ok, rol, boards, nombre, correo, edadMs} al instante y sin tocar la red', async () => {
  const m = montar();
  assert.equal(m.core.sesion.peek(), null, 'nada guardado');
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
  const n = m.rd.llamadas.length, p = m.core.sesion.peek();
  assert.deepEqual(p, { ok: true, rol: 'editor', boards: 'MA,MX', nombre: 'Persona de prueba', correo: 'correo-de-prueba', edadMs: 0 });
  assert.equal(typeof p.then, 'undefined', 'síncrona: no es una promesa');
  assert.ok(!('token' in p) && !JSON.stringify(p).includes(TOK), 'jamás lleva el token');
  await m.rl.avanzar(3 * MIN);
  assert.equal(m.core.sesion.peek().edadMs, 3 * MIN);
  p.rol = 'admin'; assert.equal(m.core.sesion.peek().rol, 'editor', 'cada llamada devuelve una copia');
  assert.equal(m.rd.llamadas.length, n, 'no toca la red (ni refresca aunque la identidad ya no sea fresca)');
  assert.deepEqual(de(m, 'sesion'), []);
});

test('P2 · peek: otro token, sin token, board distinto de «», identidad dañada o con ok:false → null', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
  assert.ok(m.core.sesion.peek());
  m.st.setItem('pyod_clave_v1', OTRO);
  assert.equal(m.core.sesion.peek(), null, 'la identidad es de otra persona');
  m.st.setItem('pyod_clave_v1', TOK); assert.ok(m.core.sesion.peek(), 'y vuelve con la suya');
  m.st.removeItem('pyod_clave_v1'); assert.equal(m.core.sesion.peek(), null, 'sin credencial no hay identidad');
  m.st.setItem('pyod_clave_v1', TOK);

  const guardada = (ext = {}) => JSON.stringify(Object.assign({ h: m.core.hash(TOK), board: '', data: { ok: true, rol: 'lector', boards: '*', nombre: 'N', correo: 'c' }, ts: m.rl.t }, ext));
  m.st.setItem('yodcg_sesion_v1', guardada({ board: 'MA' })); assert.equal(m.core.sesion.peek(), null, 'canjeada con un board: no es la identidad general');
  m.st.setItem('yodcg_sesion_v1', guardada({ board: undefined })); assert.equal(m.core.sesion.peek().rol, 'lector', 'sin campo board vale como «»');
  m.st.setItem('yodcg_sesion_v1', guardada({ data: { ok: false, error: 'revocado' } })); assert.equal(m.core.sesion.peek(), null);
  m.st.setItem('yodcg_sesion_v1', guardada({ data: null })); assert.equal(m.core.sesion.peek(), null);
  m.st.setItem('yodcg_sesion_v1', guardada({ ts: 'ayer' })); assert.equal(m.core.sesion.peek(), null, 'una marca de tiempo dañada no vale');
  m.st.setItem('yodcg_sesion_v1', guardada({ ts: undefined })); assert.equal(m.core.sesion.peek(), null);
  m.st.setItem('yodcg_sesion_v1', guardada({ ts: m.rl.t + 5000 })); assert.equal(m.core.sesion.peek().edadMs, 0, 'un reloj adelantado no da edades negativas');
  m.st.setItem('yodcg_sesion_v1', '{no es json'); assert.equal(m.core.sesion.peek(), null);
  m.st.removeItem('yodcg_sesion_v1'); assert.equal(m.core.sesion.peek(), null);
});

test('P3 · peek: vence a las 12 h (viejoMs, configurable) y un rechazo del canje la deja en null', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
  await m.rl.avanzar(12 * HORA - 1);
  assert.equal(m.core.sesion.peek().edadMs, 12 * HORA - 1, 'a un ms de las 12 h todavía vale');
  await m.rl.avanzar(1);
  assert.equal(m.core.sesion.peek(), null, 'a las 12 h ya no');
  m.core.config({ viejoMs: 13 * HORA });
  assert.equal(m.core.sesion.peek().edadMs, 12 * HORA, 'config({viejoMs}) la alarga');
  m.core.config({ viejoMs: 5 * MIN });
  assert.equal(m.core.sesion.peek(), null, 'y la acorta');
  m.core.config({ viejoMs: 12 * HORA });

  const r = montar();
  r.rd.pon({ json: CANJE_OK }, { json: { ok: false, error: 'revocado' } });
  await r.core.sesion.canjear(); assert.ok(r.core.sesion.peek());
  assert.equal((await r.core.sesion.canjear({ modo: 'red' })).rechazo, true);
  assert.equal(r.core.sesion.peek(), null, 'el rechazo tiró la identidad guardada');
});

test('P4 · peek con legacy → null aunque haya una identidad guardada válida; cerrar() y purgar() también la quitan', async () => {
  const sembrar = m => m.st.setItem('yodcg_sesion_v1', JSON.stringify({ h: m.core.hash(TOK), board: '', data: { ok: true, rol: 'editor', boards: 'MA', nombre: 'N', correo: 'c' }, ts: m.rl.t }));
  for (const op of [{ search: '?cargador=legacy' }, { hash: '#a&cargador=legacy' }, { storage: almacen({ pyod_clave_v1: TOK, yodcg_legacy: '1' }) }]) {
    const m = montar(op); sembrar(m);
    assert.equal(m.core.sesion.peek(), null, JSON.stringify(op)); assert.equal(m.rd.llamadas.length, 0);
  }
  const v = montar(); sembrar(v);
  assert.equal(v.core.sesion.peek().rol, 'editor', 'la misma identidad, sin legacy, sí se ve');
  v.core.purgar(); assert.equal(v.core.sesion.peek(), null);
  sembrar(v); v.core.sesion.cerrar({ token: TOK }); assert.equal(v.core.sesion.peek(), null);
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
  assert.equal(m.insertados[0].src, 'https://pages.invalid/yod-portal/os/yod-acceso.js?v=' + ETIQUETA);
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
  assert.equal(n.insertados[0].src, 'https://yodesarrollomx.github.io/yod-portal/os/yod-acceso.js?v=' + ETIQUETA);
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
  m.rd.pon({ status: 403 }, { json: CANJE_OK });                            // con copia en juego: el dato, y después el canje que verifica (la sesión sigue viva)
  const r403 = await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA });
  assert.deepEqual([r403.ok, r403.error, r403.rechazo, m.st.getItem(llave)], [false, 'http 403', true, null]);
  await asentar();
  assert.deepEqual(de(m, 'dato-negado').map(e => e.detalle), [{ clave: 'z', error: 'http 403' }]);
  m.rd.pon({ json: { ok: true, n: 4 } }); await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA });
  m.rd.pon({ json: { ok: false, error: 'clave' } }, { json: CANJE_OK });
  const rj = await m.core.get(ORIGINAL, P, { clave: 'z', viejoMs: HORA });
  assert.deepEqual([rj.ok, rj.rechazo, m.st.getItem(llave)], [false, true, null]);
  await asentar();
  assert.deepEqual(de(m, 'dato-negado').map(e => e.detalle), [{ clave: 'z', error: 'http 403' }, { clave: 'z', error: 'clave' }]);
  assert.deepEqual(rechazos(m), [], 'el rechazo de un dato, con el canje bueno, no cierra la sesión');
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
  assert.deepEqual(m.core.config({ catalogo: { url: CATALOGO }, timeoutMs: 1000, frescoMs: -5, viejoMs: 'x' }), { catalogo: { url: CATALOGO }, timeoutMs: 1000, timeoutFrioMs: 75000, frescoMs: 600000, viejoMs: 12 * HORA });
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

test('12 · ppp.get caso: red primero aunque haya caché; si la red cae, cache-fallback (24 h) sin esperar; clave por caso_id o palabra (id: ver 12b)', async () => {
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

test('12b · ppp.get caso con «id» (como lo piden los motores): cada caso su llave y su fallback; precedencia caso_id > id > palabra; sin identificador no hay caché', async () => {
  const m = montar(), H = m.core.hash(TOK), L = id => 'yodcg_cache_v1:ppp:caso:MACROLOTES:' + id + ':' + H;
  const caso = extra => m.core.ppp.get(PPP, Object.assign({ recurso: 'caso', tipo: 'MACROLOTES', k: TOK }, extra));
  const quien = async r => (await r.json()).caso.quien;
  m.rd.pon({ json: { ok: true, caso: { quien: 'A' } } }, { json: { ok: true, caso: { quien: 'B' } } });
  await caso({ id: 'A' }); await caso({ id: 'B' });
  assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), [L('A'), L('B')], 'dos id distintos, dos llaves distintas');
  m.rd.pon('caida', 'caida');                                              // sin red cada quien recibe SU caso, nunca el del otro
  const fa = await caso({ id: 'A' }), fb = await caso({ id: 'B' });
  assert.deepEqual([fa.yod.origen, await quien(fa), fb.yod.origen, await quien(fb)], ['cache-fallback', 'A', 'cache-fallback', 'B']);
  assert.equal(m.rd.llamadas.length, 4);

  m.rd.pon({ json: { ok: true, caso: { quien: 'C' } } }, { json: { ok: true, caso: { quien: 'I' } } }, { json: { ok: true, caso: { quien: 'P' } } });
  await caso({ caso_id: 'C1', id: 'I1', palabra: 'p1' });                  // gana caso_id
  await caso({ id: 'I2', palabra: 'p2' });                                 // luego id
  await caso({ palabra: 'p3' });                                           // y al final la palabra
  assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), [L('A'), L('B'), L('C1'), L('I2'), L('p3')].sort());

  const n = m.st.claves('yodcg_cache_v1:').length, datos = de(m, 'dato').length;
  m.rd.pon({ json: { ok: true, caso: { quien: 'nadie' } } }, { json: { ok: true, caso: { quien: 'nadie' } } }, 'caida');
  assert.equal(await quien(await caso({})), 'nadie');                      // sin id, ni caso_id ni palabra: a la red y no se guarda
  assert.equal(await quien(await caso({ id: '', palabra: '' })), 'nadie', 'vacío cuenta como ausente');
  assert.equal(m.st.claves('yodcg_cache_v1:').length, n); assert.equal(de(m, 'dato').length, datos, 'tampoco avisa un dato guardado');
  await assert.rejects(caso({}), e => e.message === 'red' && e.rechazo === false);   // y sin red no hay con qué responder
  assert.equal(m.st.claves('yodcg_cache_v1:').filter(k => k.startsWith('yodcg_cache_v1:ppp:caso:MACROLOTES::')).length, 0);

  m.rd.pon({ json: { ok: true, caso: { quien: 'otro tipo' } } });          // el tipo también distingue
  await m.core.ppp.get(PPP, { recurso: 'caso', tipo: 'MIXTO', id: 'A', k: TOK });
  assert.ok(m.st.getItem('yodcg_cache_v1:ppp:caso:MIXTO:A:' + H));
  assert.equal(JSON.parse(m.st.getItem(L('A'))).data.caso.quien, 'A');
});

/* ───────────── rechazo de credencial en un refresco de datos (checkpoint de Sol; entrega 2: lo decide el Portero) ─────────────
   Un 403 / sin_acceso / «clave» de UN backend de datos no prueba que la sesión murió: el cargador verifica con UN canje
   (pedir(token,'',h): ignora la caché de sesión) y sólo si el canje TAMBIÉN rechaza purga y avisa; si el canje contesta ok sólo
   cae la llave de ese dato y se emite dato-negado; si el canje falla por red no pasa nada más. En estas pruebas la cola de
   fetch lleva primero la respuesta del DATO y después la del canje de verificación. */

const LISTA = { recurso: 'lista', tipo: 'MACROLOTES', k: TOK }, MAPA = { recurso: 'mapa', k: TOK };
async function sembrada(op) {                                              // sesión canjeada + una lista y un mapa guardados
  const m = montar(op);
  m.rd.pon({ json: CANJE_OK }, { json: { ok: true, casos: [1] } }, { json: { ok: true, puntos: 1 } });
  await m.core.sesion.canjear({ board: 'MA' });
  await m.core.ppp.get(PPP, LISTA); await m.core.ppp.get(PPP, MAPA);
  assert.equal(m.st.claves('yodcg_cache_v1:').length, 2); assert.ok(m.st.getItem('yodcg_sesion_v1'));
  return m;
}
const rechazos = m => de(m, 'sesion-rechazada').map(e => e.detalle);

test('R1 · ppp.get lista: el refresco en fondo rechazado (revocado) se VERIFICA con el Portero y, si el canje también rechaza, purga TODO y avisa; con error de servidor no pasa nada', async () => {
  const s = await sembrada();                                              // servidor: ni verifica, ni purga ni avisa
  s.rd.pon({ json: { ok: false, error: 'servidor' } });
  assert.equal((await s.core.ppp.get(PPP, LISTA)).yod.origen, 'cache'); await asentar();
  assert.equal(s.st.claves('yodcg_cache_v1:').length, 2); assert.ok(s.st.getItem('yodcg_sesion_v1')); assert.deepEqual(rechazos(s), []);
  s.rd.pon({ status: 500 }); await s.core.ppp.get(PPP, LISTA); await asentar();   // HTTP 500, caída de red y timeout tampoco
  s.rd.pon('caida'); await s.core.ppp.get(PPP, LISTA); await asentar();
  s.rd.pon('colgado'); await s.core.ppp.get(PPP, LISTA); await s.rl.avanzar(25000);
  assert.equal(s.st.claves('yodcg_cache_v1:').length, 2); assert.deepEqual(rechazos(s), []);
  assert.equal(s.rd.urls().filter(u => u.includes('recurso=canje')).length, 1, 'ningún error transitorio provoca una verificación');

  const m = await sembrada();                                              // revocado: verificación → el canje también rechaza → purga y un solo aviso
  m.rd.pon({ json: { ok: false, error: 'revocado' } }, { json: { ok: false, error: 'revocado' } });
  const r = await m.core.ppp.get(PPP, LISTA);
  assert.equal(r.yod.origen, 'cache', 'al motor se le sigue pintando lo guardado, como siempre'); await asentar();
  assert.deepEqual(m.rd.urls().slice(-1), [claveCanje()], 'la verificación es un canje contra el Portero (sin board)');
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'ni la lista ni el mapa ni nada de esa persona');
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
  assert.equal(m.st.getItem('pyod_clave_v1'), TOK, 'cerrar() lo decide el adoptante');
  assert.deepEqual(rechazos(m), [{ error: 'revocado', token: TOK }]); assert.deepEqual(de(m, 'dato-negado'), []);
  m.rd.pon({ json: { ok: false, error: 'revocado' } });                    // ya sin caché: el motor ve el error en el JSON y nadie más
  const n = m.rd.llamadas.length;
  const sin = await m.core.ppp.get(PPP, LISTA);
  assert.deepEqual(await sin.json(), { ok: false, error: 'revocado' }); assert.equal(rechazos(m).length, 1);
  assert.equal(m.rd.llamadas.length, n + 1, 'sin copia en juego no hay verificación: el motor ya tiene el rechazo');
});

test('R2 · HTTP 401 y 403 en un refresco en fondo: si el canje también los recibe, purga y avisa con «http NNN»; igual los códigos del cuerpo', async () => {
  for (const status of [401, 403]) {
    const m = await sembrada();
    m.rd.pon({ status }, { status });                                      // el dato y el canje de verificación
    assert.equal((await m.core.ppp.get(PPP, MAPA)).yod.origen, 'cache'); await asentar();
    assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'HTTP ' + status);
    assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
    assert.deepEqual(rechazos(m), [{ error: 'http ' + status, token: TOK }]);
    assert.equal(m.rd.llamadas.length, 5, 'sin reintento: canje + lista + mapa + el dato negado + UNA verificación');
  }
  for (const error of ['clave', 'expirado', 'sin_sesion', 'forbidden']) {
    const m = await sembrada();
    m.rd.pon({ json: { ok: false, error } }, { json: { ok: false, error } }); await m.core.ppp.get(PPP, LISTA); await asentar();
    assert.deepEqual([m.st.claves('yodcg_cache_v1:').length, rechazos(m).map(x => x.error)], [0, [error]], error);
  }
});

test('R3 · get y catálogo: el rechazo llega DESPUÉS de pintar lo guardado → verificación y, si el canje rechaza, purga y aviso; sin nada guardado sólo se devuelve el rechazo', async () => {
  const m = montar(), P = { recurso: 'lista', k: TOK }, o = { clave: 'lista-x', viejoMs: HORA };
  m.rd.pon({ json: { ok: true, filas: [1] } }, { json: { ok: true, casos: [7] } });
  await m.core.get(ORIGINAL, P, o);
  await m.core.ppp.get(PPP, LISTA);                                        // otra caché de la misma persona
  let pintado = null;
  m.rd.pon({ json: { ok: false, error: 'expirado' } }, { json: { ok: false, error: 'expirado' } });
  const r = await m.core.get(ORIGINAL, P, Object.assign({ alViejo: d => { pintado = d.filas; } }, o));
  assert.deepEqual(pintado, [1], 'alViejo ya había pintado lo guardado');
  assert.deepEqual([r.ok, r.error, r.rechazo], [false, 'expirado', true]);
  assert.equal(m.st.getItem('yodcg_cache_v1:lista-x'), null, 'esa llave cae en el acto'); await asentar();
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'y, con el canje rechazado, también la otra caché de la persona');
  assert.deepEqual(rechazos(m), [{ error: 'expirado', token: TOK }]);

  const c = montar(); c.core.config({ catalogo: { url: CATALOGO } });
  c.rd.pon({ json: { ok: true, rows: ['a'] } });
  await c.core.catalogo(); await c.rl.avanzar(10 * MIN);                   // guardado, pero ya no fresco: se pide a la red
  c.rd.pon({ status: 403 }, { status: 403 });
  let vio = null;
  const k = await c.core.catalogo({ alViejo: d => { vio = d.rows; } });
  assert.deepEqual([vio, k.ok, k.error, k.rechazo], [['a'], false, 'http 403', true]); await asentar();
  assert.deepEqual(c.st.claves('yodcg_cache_v1:'), []); assert.deepEqual(rechazos(c), [{ error: 'http 403', token: TOK }]);

  const s = montar();                                                      // sin nada guardado: el adoptante ya ve el rechazo en la respuesta
  s.rd.pon({ status: 403 });
  const rs = await s.core.get(ORIGINAL, P, o);
  assert.deepEqual([rs.ok, rs.rechazo, rs.error], [false, true, 'http 403']);
  s.rd.pon({ json: { ok: false, error: 'clave' } });
  assert.equal((await s.core.get(ORIGINAL, P, o)).rechazo, true);
  assert.deepEqual(rechazos(s), [], 'y no se emite nada: no había nada que purgar'); await asentar();
  assert.equal(s.rd.llamadas.length, 2, 'ni se verifica: sin copia en juego el adoptante ya tiene el rechazo');
  const e = montar(); e.rd.pon({ json: { ok: true, filas: [1] } }, { json: { ok: false, error: 'servidor' } });   // error transitorio con caché: ni purga ni aviso
  await e.core.get(ORIGINAL, P, o); const ee = await e.core.get(ORIGINAL, P, o);
  assert.deepEqual([ee.ok, ee.rechazo, e.st.claves('yodcg_cache_v1:').length, rechazos(e), e.rd.llamadas.length], [false, false, 1, [], 2]);
});

test('R4 · ppp.get caso con caché: payload revocado o HTTP 403 → verificación y, si el canje rechaza, purga y aviso (el 403 además rechaza); un 500 cae a la caché sin avisar', async () => {
  const P = { recurso: 'caso', tipo: 'MACROLOTES', id: 'C-1', k: TOK };
  const m = montar();
  m.rd.pon({ json: { ok: true, caso: { v: 1 } } }, { json: { ok: true, caso: { v: 2 } } });
  await m.core.ppp.get(PPP, P); await m.core.ppp.get(PPP, Object.assign({}, P, { id: 'C-2' }));
  assert.equal(m.st.claves('yodcg_cache_v1:').length, 2);
  m.rd.pon({ json: { ok: false, error: 'revocado' } }, { json: { ok: false, error: 'revocado' } });
  const r = await m.core.ppp.get(PPP, P);
  assert.deepEqual(await r.json(), { ok: false, error: 'revocado' }, 'el motor ve el JSON tal cual'); await asentar();
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'se fue también el otro caso'); assert.deepEqual(rechazos(m), [{ error: 'revocado', token: TOK }]);

  const n = montar(); n.rd.pon({ json: { ok: true, caso: { v: 1 } } }); await n.core.ppp.get(PPP, P);
  n.rd.pon({ status: 403 }, { status: 403 });
  await assert.rejects(n.core.ppp.get(PPP, P), e => e.rechazo === true && e.status === 403); await asentar();
  assert.deepEqual(n.st.claves('yodcg_cache_v1:'), []); assert.deepEqual(rechazos(n), [{ error: 'http 403', token: TOK }]);

  const s = montar(); s.rd.pon({ json: { ok: true, caso: { v: 1 } } }); await s.core.ppp.get(PPP, P);
  s.rd.pon({ status: 500 });
  const f = await s.core.ppp.get(PPP, P);
  assert.deepEqual([f.yod.origen, (await f.json()).caso.v, s.st.claves('yodcg_cache_v1:').length, rechazos(s)], ['cache-fallback', 1, 1, []]);
});

test('R5 · varios refrescos rechazados a la vez: UNA verificación, una purga y un aviso; tras un canje bueno (o cerrar) vuelve a avisar', async () => {
  const m = await sembrada();
  m.rd.pon({ json: { ok: false, error: 'revocado' } }, { json: { ok: false, error: 'revocado' } }, { json: { ok: false, error: 'revocado' } });   // dos datos y UN canje
  const pendientes = [m.core.ppp.get(PPP, LISTA), m.core.ppp.get(PPP, MAPA)];   // dos refrescos en vuelo a la vez
  await Promise.all(pendientes); await asentar();
  assert.deepEqual(rechazos(m), [{ error: 'revocado', token: TOK }]);
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), []);
  assert.equal(m.rd.urls().filter(u => u.includes('recurso=canje')).length, 2, 'el canje de la sesión + UNA verificación para los dos');

  m.rd.pon({ json: CANJE_OK }, { json: { ok: true, casos: [9] } });
  await m.core.sesion.canjear({ modo: 'red' });                            // un canje bueno: la credencial vuelve a valer
  await m.core.ppp.get(PPP, LISTA);
  assert.equal(m.st.claves('yodcg_cache_v1:').length, 1, 'la lista otra vez'); assert.ok(m.st.getItem('yodcg_sesion_v1'), 'y la sesión');
  m.rd.pon({ json: { ok: false, error: 'clave' } }, { json: { ok: false, error: 'clave' } });
  await m.core.ppp.get(PPP, LISTA); await asentar();
  assert.deepEqual(rechazos(m).map(x => x.error), ['revocado', 'clave']);

  m.core.sesion.cerrar({ token: TOK, motivo: 'rechazo' });                 // el adoptante cierra; la misma credencial, si volviera, avisa de nuevo
  m.st.setItem('pyod_clave_v1', TOK);
  m.rd.pon({ json: { ok: true, casos: [10] } }, { json: { ok: false, error: 'expirado' } }, { json: { ok: false, error: 'expirado' } });
  await m.core.ppp.get(PPP, LISTA); await m.core.ppp.get(PPP, LISTA); await asentar();
  assert.deepEqual(rechazos(m).map(x => x.error), ['revocado', 'clave', 'expirado']);
});

test('R6 · si la persona cambia o sale MIENTRAS vuela el refresco, su rechazo no purga a la nueva ni avisa; sin credencial en la petición tampoco', async () => {
  const m = await sembrada(), d = diferido();
  m.rd.pon({ diferido: d });
  await m.core.ppp.get(PPP, LISTA);                                        // pinta la caché y deja el refresco en vuelo
  await asentar();
  m.st.setItem('pyod_clave_v1', OTRO);                                     // entra otra persona en el mismo navegador
  d.ok(respuesta({ json: { ok: false, error: 'revocado' } })); await asentar();
  assert.deepEqual(rechazos(m), []);
  assert.ok(m.st.getItem('yodcg_sesion_v1'), 'la sesión y el resto de cachés siguen: el rechazo era de la persona anterior');
  assert.equal(m.st.claves('yodcg_cache_v1:').length, 1, 'sólo cayó la lista cuya respuesta fue negada');

  const n = await sembrada(), e = diferido();
  n.rd.pon({ diferido: e });
  await n.core.ppp.get(PPP, LISTA); await asentar();
  n.core.sesion.cerrar({ token: TOK, motivo: 'salir' });                   // la persona sale mientras el refresco vuela
  e.ok(respuesta({ json: { ok: false, error: 'revocado' } })); await asentar();
  assert.deepEqual(rechazos(n), [], 'ya no hay a quién avisar');

  const q = await sembrada();                                              // petición sin k: no presentó credencial, así que su rechazo no dice nada de la sesión
  q.rd.pon({ json: { ok: true, filas: [1] } });
  await q.core.ppp.get(PPP, { recurso: 'lista', tipo: 'MIXTO' });
  assert.equal(q.st.claves('yodcg_cache_v1:').length, 3);
  q.rd.pon({ json: { ok: false, error: 'clave' } });
  assert.equal((await q.core.ppp.get(PPP, { recurso: 'lista', tipo: 'MIXTO' })).yod.origen, 'cache'); await asentar();
  assert.deepEqual(rechazos(q), []); assert.equal(q.st.claves('yodcg_cache_v1:').length, 2, 'sólo cae la entrada negada; lo demás sigue');
  assert.ok(q.st.getItem('yodcg_sesion_v1'));

  const a = montar({ token: '' }); a.core.config({ catalogo: { url: CATALOGO } });   // sin sesión ni credencial: el catálogo público
  a.rd.pon({ json: { ok: true, rows: [] } });
  await a.core.catalogo(); await a.rl.avanzar(10 * MIN);
  a.st.setItem('yodcg_cache_v1:de-otra-persona', JSON.stringify({ ts: a.rl.t, data: { ok: true } }));
  a.rd.pon({ status: 403 });
  const k = await a.core.catalogo();
  assert.deepEqual([k.ok, k.rechazo, rechazos(a)], [false, true, []], 'sin sesión no hay a quién avisar');
  assert.deepEqual(a.st.claves('yodcg_cache_v1:'), ['yodcg_cache_v1:de-otra-persona'], 'ni a quién purgar: sólo cae la entrada negada');
});

test('R7 · legacy: sin caché no hay nada que purgar ni que avisar', async () => {
  const m = montar({ search: '?cargador=legacy' });
  m.rd.pon({ json: { ok: false, error: 'revocado' } }, { status: 403 });
  await m.core.ppp.get(PPP, LISTA); await assert.rejects(m.core.ppp.get(PPP, LISTA), e => e.rechazo === true);
  assert.deepEqual(rechazos(m), []);
});

/* ───────────── recordar: memoria con plazo para CUALQUIER lectura del adoptante (T-201 punto 1) ───────────── */

const llaveMemo = (m, clave, tok = TOK) => 'yodcg_cache_v1:memo:' + clave + ':' + m.core.hash(tok);
const cuerpo = n => ({ ok: true, filas: [n] });
const sinFin = () => new Promise(() => { });                               // un cargar que nunca contesta
const niega = (error = 'sin_acceso') => () => Promise.resolve({ ok: false, error });
const canjes = m => m.rd.urls().filter(u => u.includes('recurso=canje')).length;

test('M1 · recordar (cache-primero): sin copia va a la red y guarda bajo memo:<clave>:<hash> sin el token; después contesta desde caché sin llamar a cargar', async () => {
  const m = montar(); let n = 0;
  const cargar = () => { n++; return Promise.resolve(cuerpo(n)); };
  const a = await m.core.recordar('tablero:Flujo', cargar);
  assert.deepEqual([a.ok, a.origen, a.data, typeof a.ms, n], [true, 'red', cuerpo(1), 'number', 1]);
  const llave = llaveMemo(m, 'tablero:Flujo');
  assert.equal(llave, 'yodcg_cache_v1:memo:tablero:Flujo:' + m.core.hash(TOK));
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [llave]);
  assert.ok(!llave.includes(TOK) && !m.st.getItem(llave).includes(TOK), 'ni la llave ni el valor llevan el token');
  assert.deepEqual(JSON.parse(m.st.getItem(llave)), { ts: m.rl.t, data: cuerpo(1) });
  assert.deepEqual(de(m, 'dato'), [], 'la lectura en primer plano no anuncia: quien la pidió ya tiene la respuesta');
  await m.rl.avanzar(30000);                                               // menos que frescoMs (60 s): ni siquiera revalida
  const b = await m.core.recordar('tablero:Flujo', cargar); await asentar();
  assert.deepEqual([b.ok, b.origen, b.data, b.edadMs, typeof b.ms, n], [true, 'cache', cuerpo(1), 30000, 'number', 1]);
  assert.deepEqual(de(m, 'dato'), []);
  const c = await m.core.recordar('otra-clave', cargar);                    // cada clave la suya
  assert.deepEqual([c.origen, c.data, n], ['red', cuerpo(2), 2]);
});

test('M2 · recordar (cache-primero) con copia vieja: contesta YA con ella y revalida UNA vez en fondo; el refresco anuncia yodcargador:dato y frescoMs evita el bucle', async () => {
  const m = montar(), d = diferido(); let cargas = 0;
  await m.core.recordar('c', () => Promise.resolve(cuerpo(1)));
  await m.rl.avanzar(2 * MIN);                                             // más vieja que frescoMs (1 min) y mucho menos que viejoMs (12 h)
  const lento = () => { cargas++; return d.promesa; };
  const r = await m.core.recordar('c', lento);                              // no espera a la red
  assert.deepEqual([r.ok, r.origen, r.data, r.edadMs], [true, 'cache', cuerpo(1), 2 * MIN]);
  await m.core.recordar('c', lento); await m.core.recordar('c', lento); await asentar();
  assert.equal(cargas, 1, 'mientras vuela un refresco de esa llave nadie lanza otro');
  assert.deepEqual(de(m, 'dato'), [], 'y hasta que llega no hay anuncio');
  d.ok(cuerpo(2)); await asentar();
  assert.deepEqual(de(m, 'dato').map(e => e.detalle), [{ clave: 'memo:c', origen: 'red', data: cuerpo(2), igual: false }]);
  assert.deepEqual(JSON.parse(m.st.getItem(llaveMemo(m, 'c'))), { ts: m.rl.t, data: cuerpo(2) }, 'la copia nueva se guardó ANTES de anunciar');
  const s = await m.core.recordar('c', lento); await asentar();             // el adoptante re-corre su conector al recibir el evento
  assert.deepEqual([s.origen, s.data, s.edadMs, cargas, de(m, 'dato').length], ['cache', cuerpo(2), 0, 1, 1], 'copia fresca: ni red ni otro evento (sin bucle)');
  await m.rl.avanzar(2 * MIN);
  await m.core.recordar('c', () => Promise.resolve(cuerpo(2))); await asentar();   // la red trae lo mismo
  assert.deepEqual(de(m, 'dato').pop().detalle, { clave: 'memo:c', origen: 'red', data: cuerpo(2), igual: true });
  await m.rl.avanzar(2 * MIN);                                             // un refresco que cae no anuncia ni borra la copia
  await m.core.recordar('c', () => Promise.reject(new TypeError('sin red'))); await asentar();
  await m.core.recordar('c', niega('servidor')); await asentar();
  assert.equal(de(m, 'dato').length, 2); assert.deepEqual(JSON.parse(m.st.getItem(llaveMemo(m, 'c'))).data, cuerpo(2));
  const e = await m.core.recordar('c', () => Promise.resolve(cuerpo(3))); await asentar();   // y puede volver a revalidar cuando el vuelo termina
  assert.deepEqual([e.origen, de(m, 'dato').length], ['cache', 3]);
});

test('M3 · recordar: frescoMs (60 s) y viejoMs (12 h) por omisión, a un milisegundo de cada borde, y configurables por llamada', async () => {
  const m = montar(); let cargas = 0;
  const cargar = () => { cargas++; return Promise.resolve(cuerpo(cargas)); };
  await m.core.recordar('c', cargar);
  await m.rl.avanzar(59999);
  assert.equal((await m.core.recordar('c', cargar)).origen, 'cache'); await asentar();
  assert.equal(cargas, 1, 'a 59,999 ms todavía es fresca');
  await m.rl.avanzar(1);                                                    // edad = frescoMs
  assert.equal((await m.core.recordar('c', cargar)).edadMs, 60000); await asentar();
  assert.equal(cargas, 2, 'a frescoMs revalida en fondo');

  const k = montar(); cargas = 0;                                           // frescoMs propio, y 0 = revalida siempre
  await k.core.recordar('c', cargar, { frescoMs: 10 * MIN });
  await k.rl.avanzar(5 * MIN); await k.core.recordar('c', cargar, { frescoMs: 10 * MIN }); await asentar();
  assert.equal(cargas, 1);
  await k.core.recordar('c', cargar, { frescoMs: 0 }); await asentar();
  await k.core.recordar('c', cargar, { frescoMs: 0 }); await asentar();
  assert.equal(cargas, 3, 'con frescoMs 0 cada lectura revalida (una vez por vuelo)');

  const v = montar(), vistas = [];                                          // viejoMs: a 4,999 ms la copia sirve; a 5,000 ya no
  await v.core.recordar('a', cargar, { viejoMs: 5000 }); await v.core.recordar('b', cargar, { viejoMs: 5000 });
  await v.rl.avanzar(4999);
  const caida = () => Promise.reject(new TypeError('sin red')), o = { modo: 'red-primero', viejoMs: 5000, alViejo: (d, meta) => vistas.push(meta.edadMs) };
  const a = await v.core.recordar('a', caida, o);
  assert.deepEqual([a.origen, a.edadMs, vistas], ['cache-fallback', 4999, [4999]]);
  await v.rl.avanzar(1);
  const b = await v.core.recordar('b', caida, o);
  assert.deepEqual([b.ok, b.error, b.origen, vistas], [false, 'red', 'sin_red', [4999]], 'con 5,000 ms de edad la copia ya no existe');
  const w = montar();                                                       // sin viejoMs válido: 12 h
  await w.core.recordar('c', cargar); await w.rl.avanzar(12 * HORA - 1);
  assert.equal((await w.core.recordar('c', cargar)).origen, 'cache');
  const x = montar(); await x.core.recordar('c', cargar, { viejoMs: 0 });   // viejoMs 0 = no se guarda nada
  assert.deepEqual(x.st.claves('yodcg_cache_v1:'), []);
});

test('M4 · recordar (red-primero): alViejo corre ANTES de cargar, la red gana, y si cae o se acaba el plazo la copia cubre; sin copia falla limpio', async () => {
  const m = montar(), orden = [];
  await m.core.recordar('c', () => Promise.resolve(cuerpo(1)));
  await m.rl.avanzar(5 * MIN);
  const r = await m.core.recordar('c', () => { orden.push('cargar'); return Promise.resolve(cuerpo(2)); }, { modo: 'red-primero', alViejo: (d, meta) => orden.push(['viejo', d, meta]) });
  assert.deepEqual(orden, [['viejo', cuerpo(1), { edadMs: 5 * MIN }], 'cargar']);
  assert.deepEqual([r.ok, r.origen, r.data, typeof r.ms], [true, 'red', cuerpo(2), 'number']);
  assert.deepEqual(JSON.parse(m.st.getItem(llaveMemo(m, 'c'))), { ts: m.rl.t, data: cuerpo(2) });
  assert.deepEqual(de(m, 'dato'), [], 'en primer plano no se anuncia');

  await m.rl.avanzar(5 * MIN);                                              // la red cae: la copia cubre y lo dice
  const f = await m.core.recordar('c', () => Promise.reject(new TypeError('fallo de red')), { modo: 'red-primero' });
  assert.deepEqual([f.ok, f.data, f.origen, f.error, f.edadMs], [true, cuerpo(2), 'cache-fallback', 'red', 5 * MIN]);
  const t = m.core.recordar('c', sinFin, { modo: 'red-primero', timeoutMs: 2000 }); await m.rl.avanzar(2000);
  assert.deepEqual([(await t).origen, (await t).error, (await t).data], ['cache-fallback', 'timeout', cuerpo(2)]);

  const s = await m.core.recordar('nueva', () => Promise.reject(new TypeError('fallo de red')), { modo: 'red-primero' });   // sin copia
  assert.deepEqual([s.ok, s.error, s.origen, s.rechazo], [false, 'red', 'sin_red', false]);
  const u = m.core.recordar('nueva', sinFin, { modo: 'red-primero', timeoutMs: 1500 }); await m.rl.avanzar(1500);
  assert.deepEqual([(await u).ok, (await u).error, (await u).origen], [false, 'timeout', 'sin_red']);
  let pintado = 0;
  const n = await m.core.recordar('nueva', () => Promise.resolve(cuerpo(9)), { modo: 'red-primero', alViejo() { pintado++; } });
  assert.deepEqual([n.origen, n.data, pintado], ['red', cuerpo(9), 0], 'sin copia no hay nada que pintar');
  const avisos = []; const w = console.warn; console.warn = (...a) => avisos.push(a.join(' '));   // alViejo que lanza no tumba la lectura
  try { await m.core.recordar('c', () => Promise.resolve(cuerpo(3)), { modo: 'red-primero', alViejo() { throw new Error('el adoptante falló al pintar'); } }); } finally { console.warn = w; }
  assert.deepEqual(JSON.parse(m.st.getItem(llaveMemo(m, 'c'))).data, cuerpo(3)); assert.equal(avisos.length, 1);
});

test('M5 · recordar: el plazo cubre al cargar (25 s por omisión), aborta su señal, y una respuesta tardía ni se guarda ni se anuncia; reintentos opcionales', async () => {
  const m = montar(); let senal = null, fin = false;
  const p = m.core.recordar('lento', s => { senal = s; return sinFin(); }); p.then(() => { fin = true; });
  await m.rl.avanzar(24999);
  assert.deepEqual([fin, senal && senal.aborted], [false, false]);
  await m.rl.avanzar(1);
  const r = await p;
  assert.deepEqual([r.ok, r.error, r.origen, r.rechazo, senal.aborted], [false, 'timeout', 'sin_red', false, true]);

  const d = diferido(); let s2 = null;                                      // la respuesta llega tarde: ya nadie la espera
  const q = m.core.recordar('tarde', s => { s2 = s; return d.promesa; }, { timeoutMs: 1000 }); await m.rl.avanzar(1000);
  assert.equal((await q).error, 'timeout'); d.ok(cuerpo(7)); await asentar();
  assert.deepEqual([m.st.claves('yodcg_cache_v1:'), de(m, 'dato'), s2.aborted], [[], [], true]);

  m.core.config({ timeoutMs: 3000 });                                       // el plazo por omisión es el de config()
  let fin3 = false; const c = m.core.recordar('cfg', sinFin); c.then(() => { fin3 = true; });
  await m.rl.avanzar(2999); assert.equal(fin3, false);
  await m.rl.avanzar(1); assert.equal((await c).error, 'timeout');

  let i0 = 0, i1 = 0;                                                        // sin reintento por omisión; con reintentos:1, a 1.5 s
  const sin = m.core.recordar('r0', () => { i0++; return Promise.reject(new TypeError('x')); }); await m.rl.avanzar(5000);
  assert.deepEqual([(await sin).error, i0], ['red', 1]);
  const con = m.core.recordar('r1', () => { i1++; return i1 < 2 ? Promise.reject(new TypeError('x')) : Promise.resolve(cuerpo(1)); }, { reintentos: 1 });
  await m.rl.avanzar(1499); assert.equal(i1, 1); await m.rl.avanzar(1);
  assert.deepEqual([(await con).ok, (await con).origen, i1], [true, 'red', 2]);
});

test('M6 · recordar: un cuerpo ok:false se informa tal cual y NUNCA se guarda ni pisa la copia; un ok:false sin error es «servidor»', async () => {
  const m = montar();
  const a = await m.core.recordar('c', niega('servidor'));
  assert.deepEqual([a.ok, a.error, a.rechazo, a.origen, a.data], [false, 'servidor', false, 'red', { ok: false, error: 'servidor' }]);
  const b = await m.core.recordar('c', () => Promise.resolve({ ok: false }));
  assert.deepEqual([b.error, b.rechazo], ['servidor', false]);
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'nada guardado');
  await m.core.recordar('c', () => Promise.resolve(cuerpo(1)));
  await m.rl.avanzar(2 * MIN);
  for (const modo of ['red-primero', 'cache-primero']) {                    // con copia: una respuesta mala no la pisa ni la borra
    const r = await m.core.recordar('c', niega('servidor'), { modo }); await asentar();
    assert.equal(r.ok, modo === 'cache-primero', modo);
    assert.deepEqual(JSON.parse(m.st.getItem(llaveMemo(m, 'c'))).data, cuerpo(1), modo);
    assert.deepEqual(m.eventos.filter(e => e.tipo !== 'dato').length, 0);
  }
  assert.deepEqual(de(m, 'dato'), [], 'ni se anuncia');
  const e = await m.core.recordar('c', niega('servidor'), { modo: 'red-primero' });
  assert.deepEqual([e.ok, e.error], [false, 'servidor'], 'un error de servidor no se disfraza con la copia: sólo la caída de red lo hace');
});

test('M7 · recordar: lo que no es un objeto JSON es «formato»; un cargar que lanza o rechaza es «red» (o «timeout» si así se llama); sin cargar no revienta', async () => {
  const m = montar();
  for (const raro of [null, undefined, 'texto', 42, true]) {
    const r = await m.core.recordar('f', () => Promise.resolve(raro));
    assert.deepEqual([r.ok, r.error, r.origen, r.rechazo], [false, 'formato', 'red', false], String(raro));
  }
  const l = await m.core.recordar('f', () => { throw new Error('boom'); });             // lanza síncrono
  assert.deepEqual([l.ok, l.error, l.origen], [false, 'red', 'sin_red']);
  assert.equal((await m.core.recordar('f', () => Promise.reject(new Error('timeout')))).error, 'timeout');
  assert.equal((await m.core.recordar('f', () => Promise.reject(undefined))).error, 'red');
  assert.equal((await m.core.recordar('f')).error, 'red');
  assert.equal((await m.core.recordar('f', 'no es función')).error, 'red');
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), []);
  await m.core.recordar('f', () => Promise.resolve(cuerpo(1)));            // con copia, «formato» sí deja la copia en su sitio
  await m.rl.avanzar(2 * MIN);
  const c = await m.core.recordar('f', () => Promise.resolve('basura'), { modo: 'red-primero' });
  assert.deepEqual([c.ok, c.origen, c.error, c.data], [true, 'cache-fallback', 'formato', cuerpo(1)]);
});

test('M8 · recordar: un rechazo LANZADO por el adoptante («403», Error HTTP 403, {status}, «revocado») es rechazo, no caída: no sirve la copia y la borra', async () => {
  const lanzados = [
    ['cadena 403', () => Promise.reject('403'), 'http 403'], ['cadena 401', () => Promise.reject('401'), 'http 401'],
    ['número 403', () => Promise.reject(403), 'http 403'], ['Error HTTP 403', () => Promise.reject(new Error('HTTP 403')), 'http 403'],
    ['Error con status 401', () => Promise.reject(Object.assign(new Error('x'), { status: 401 })), 'http 401'],
    ['Error revocado', () => Promise.reject(new Error('revocado')), 'revocado'], ['lanzado síncrono', () => { throw '403'; }, 'http 403']
  ];
  for (const [nombre, cargar, error] of lanzados) {
    const m = montar();
    await m.core.recordar('c', () => Promise.resolve(cuerpo(1))); await m.rl.avanzar(2 * MIN);
    m.rd.pon({ json: CANJE_OK });                                          // el Portero decide: la sesión sigue viva
    const r = await m.core.recordar('c', cargar, { modo: 'red-primero' }); await asentar();
    assert.deepEqual([r.ok, r.rechazo, r.error, r.origen], [false, true, error, 'red'], nombre);
    assert.equal(m.st.getItem(llaveMemo(m, 'c')), null, nombre + ': la copia cae');
    assert.deepEqual(de(m, 'dato-negado').map(e => e.detalle), [{ clave: 'memo:c', error }], nombre);
  }
  for (const [nombre, cargar] of [['HTTP 500', () => Promise.reject(new Error('HTTP 500'))], ['TypeError', () => Promise.reject(new TypeError('Failed to fetch'))], ['status 500', () => Promise.reject(Object.assign(new Error('x'), { status: 500 }))]]) {
    const m = montar();
    await m.core.recordar('c', () => Promise.resolve(cuerpo(1))); await m.rl.avanzar(2 * MIN);
    const r = await m.core.recordar('c', cargar, { modo: 'red-primero' }); await asentar();
    assert.deepEqual([r.ok, r.origen, r.rechazo, r.data], [true, 'cache-fallback', undefined, cuerpo(1)], nombre);
    assert.equal(canjes(m), 0, nombre + ': una caída no se verifica');
  }
});

test('M9 · recordar: nunca lee la copia de otra persona (llave por hash del token); si la persona cambia o sale MIENTRAS vuela, su respuesta no se guarda', async () => {
  const m = montar(); let n = 0;
  const cargar = () => { n++; return Promise.resolve(cuerpo(n)); };
  await m.core.recordar('c', cargar);                                       // TOK
  m.st.setItem('pyod_clave_v1', OTRO);
  const o = await m.core.recordar('c', cargar);
  assert.deepEqual([o.origen, o.data, n], ['red', cuerpo(2), 2], 'la copia de TOK no le sirve a OTRO');
  assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), [llaveMemo(m, 'c', OTRO), llaveMemo(m, 'c', TOK)].sort());
  m.st.setItem('pyod_clave_v1', TOK);
  assert.deepEqual([(await m.core.recordar('c', cargar)).data, n], [cuerpo(1), 2], 'y cada quien conserva la suya');
  let pintado = 0;
  const x = await m.core.recordar('c', cargar, { token: 'sy-ajeno-0000000000000003', modo: 'red-primero', alViejo() { pintado++; } });
  assert.deepEqual([x.origen, n, pintado], ['red', 3, 0], 'la copia de TOK no se le pinta a un token ajeno');
  assert.equal(m.st.getItem(llaveMemo(m, 'c', 'sy-ajeno-0000000000000003')), null, 'con un token que no es el vigente no se guarda (como get)');

  const k = montar(), d = diferido();                                       // cambia la persona durante el vuelo
  const p = k.core.recordar('v', () => d.promesa, { modo: 'red-primero' }); await asentar();
  k.st.setItem('pyod_clave_v1', OTRO); d.ok(cuerpo(1));
  assert.equal((await p).ok, true, 'quien pidió igual recibe su respuesta');
  assert.deepEqual([k.st.claves('yodcg_cache_v1:'), de(k, 'dato')], [[], []]);
  const s = montar(), e = diferido();                                       // y sale durante el refresco en fondo
  await s.core.recordar('v', () => Promise.resolve(cuerpo(1))); await s.rl.avanzar(2 * MIN);
  await s.core.recordar('v', () => e.promesa); await asentar();
  s.core.sesion.cerrar({ token: TOK, motivo: 'salir' }); e.ok(cuerpo(2)); await asentar();
  assert.deepEqual([s.st.claves('yodcg_cache_v1:'), de(s, 'dato')], [[], []], 'ni quedó guardado ni se anunció');
});

test('M10 · recordar con legacy (?cargador=legacy, #…&cargador=legacy, yodcg_legacy=1): ni lee ni guarda caché, ni alViejo; sólo cargar con su plazo', async () => {
  for (const op of [{ search: '?cargador=legacy' }, { hash: '#x&cargador=legacy' }, { storage: almacen({ pyod_clave_v1: TOK, yodcg_legacy: '1' }) }]) {
    const m = montar(op); let n = 0, viejo = 0;
    m.st.setItem(llaveMemo(m, 'c'), JSON.stringify({ ts: m.rl.t, data: cuerpo(99) }));   // una copia sembrada a mano tampoco se lee
    const cargar = () => { n++; return Promise.resolve(cuerpo(n)); };
    const a = await m.core.recordar('c', cargar, { alViejo() { viejo++; } });
    const b = await m.core.recordar('c', cargar, { alViejo() { viejo++; }, modo: 'red-primero' });
    assert.deepEqual([a.origen, a.data, b.origen, n, viejo, de(m, 'dato')], ['red', cuerpo(1), 'red', 2, 0, []], JSON.stringify(op));
    assert.deepEqual(JSON.parse(m.st.getItem(llaveMemo(m, 'c'))).data, cuerpo(99), 'la sembrada sigue intacta: no se pisa');
    const t = m.core.recordar('l', sinFin, { timeoutMs: 1000 }); await m.rl.avanzar(1000);
    assert.deepEqual([(await t).error, (await t).origen], ['timeout', 'sin_red']);
    const caida = await m.core.recordar('c', () => Promise.reject(new TypeError('x')));
    assert.deepEqual([caida.ok, caida.error], [false, 'red'], 'sin copia que cubra');
    const neg = await m.core.recordar('c', niega('clave')); await asentar();
    assert.deepEqual([neg.rechazo, canjes(m), de(m, 'dato-negado'), rechazos(m)], [true, 0, [], []], 'sin caché no hay nada que verificar');
  }
});

test('M11 · recordar con telemetria: mide como get (red o cache) y dispara el primer dato de la página una sola vez', async () => {
  const m = montar();
  await m.core.recordar('c', () => Promise.resolve(cuerpo(1)), { telemetria: 'flujo' });
  assert.deepEqual(JSON.parse(m.st.getItem('yodcg_telemetria_v1')).map(x => [x.p, x.origen]), [['flujo', 'red'], ['pd', 'red']]);
  assert.deepEqual(m.core.telemetria.codigos(), ['pd:MA:0:r@otro']);
  await m.core.recordar('c', () => Promise.resolve(cuerpo(1)), { telemetria: 'flujo' });
  assert.deepEqual(JSON.parse(m.st.getItem('yodcg_telemetria_v1')).slice(2).map(x => [x.p, x.origen]), [['flujo', 'cache']]);
  assert.deepEqual(de(m, 'primer-dato').length, 1);
  await m.core.recordar('d', () => Promise.resolve(cuerpo(1)));            // sin nombre no mide
  assert.equal(JSON.parse(m.st.getItem('yodcg_telemetria_v1')).length, 3);
});

/* ───────────── el rechazo de un DATO lo decide el Portero (T-201 punto 3) ─────────────
   get, ppp.get y recordar comparten la regla: si un backend de datos niega la credencial y había una copia en juego, se pide UN
   canje (pedir(token,'',h): sin board y sin mirar la caché de sesión). Rechaza → purga y sesion-rechazada; contesta ok → sólo cae
   la llave de ese dato y sale dato-negado; falla por red → nada más. En cada prueba la cola de fetch lleva primero la respuesta
   del DATO y después la del canje de verificación (recordar no usa la cola: cargar es del adoptante). */

const HTOK = montar().core.hash(TOK);
const FUENTES = {
  'recordar (primer plano)': {
    clave: 'memo:a', llave: m => llaveMemo(m, 'a'),
    sembrar: m => m.core.recordar('a', () => Promise.resolve(cuerpo('a'))),
    negar: (m, e) => m.core.recordar('a', niega(e), { modo: 'red-primero' })
  },
  'recordar (revalidación en fondo)': {
    clave: 'memo:a', llave: m => llaveMemo(m, 'a'),
    sembrar: m => m.core.recordar('a', () => Promise.resolve(cuerpo('a'))),
    negar: (m, e) => m.core.recordar('a', niega(e))
  },
  get: {
    clave: 'lista-x', llave: () => 'yodcg_cache_v1:lista-x',
    sembrar: m => { m.rd.pon({ json: cuerpo('g') }); return m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'lista-x', viejoMs: HORA }); },
    negar: (m, e) => { m.rd.pon({ json: { ok: false, error: e } }); return m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'lista-x', viejoMs: HORA }); }
  },
  'ppp.get': {
    clave: 'ppp:lista:MACROLOTES::' + HTOK, llave() { return 'yodcg_cache_v1:' + this.clave; },
    sembrar: m => { m.rd.pon({ json: cuerpo('p') }); return m.core.ppp.get(PPP, LISTA); },
    negar: (m, e) => { m.rd.pon({ json: { ok: false, error: e } }); return m.core.ppp.get(PPP, LISTA); }
  }
};
async function preparar(f, op) {                                           // sesión canjeada (board '' y fresca) + una copia de la fuente + otra ajena a ella
  const m = montar(op);
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
  await f.sembrar(m);
  await m.core.recordar('otra', () => Promise.resolve(cuerpo('otra')));
  await m.rl.avanzar(2 * MIN);
  assert.ok(m.st.getItem(f.llave(m)), 'precondición: la fuente tiene copia'); assert.ok(m.core.sesion.peek(), 'y la sesión guardada está fresca');
  return m;
}
const FALLAS = {
  'caída de red': { cola: ['caida', 'caida'], ms: 1500 }, 'HTTP 500': { cola: [{ status: 500 }, { status: 500 }], ms: 1500 },
  'JSON inválido': { cola: [{ texto: '<html>' }], ms: 0 }, 'timeout (25 s + 1.5 s + 75 s)': { cola: ['colgado', 'colgado'], ms: 25000 + 1500 + 75000 }
};

for (const [nombre, f] of Object.entries(FUENTES)) {
  test(`V1 · ${nombre}: si el canje contesta ok, sólo cae la llave de ese dato y sale dato-negado {clave, error}: ni purga, ni sesion-rechazada, ni se toca pyod_clave_v1`, async () => {
    const m = await preparar(f), antes = canjes(m), otras = m.st.claves('yodcg_cache_v1:').filter(k => k !== f.llave(m)).sort();
    const p = f.negar(m, 'sin_acceso'); m.rd.pon({ json: CANJE_OK });
    await p; await asentar();
    assert.equal(m.st.getItem(f.llave(m)), null, 'esa llave cae');
    assert.deepEqual(de(m, 'dato-negado').map(e => e.detalle), [{ clave: f.clave, error: 'sin_acceso' }]);
    assert.equal(canjes(m) - antes, 1, 'UNA verificación, aunque la sesión guardada estaba fresca (la verificación la ignora)');
    assert.deepEqual(m.rd.urls().slice(-1), [claveCanje()], 'pedir(token, "") : sin board');
    assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), otras, 'las demás copias de la persona siguen');
    assert.ok(m.st.getItem('yodcg_sesion_v1')); assert.equal(m.st.getItem('pyod_clave_v1'), TOK);
    assert.deepEqual([rechazos(m), de(m, 'sesion-cerrada').length], [[], 0]);
  });

  test(`V2 · ${nombre}: si el canje también rechaza, purga TODO y avisa UNA vez (sesion-rechazada con el error del Portero); pyod_clave_v1 lo cierra el adoptante`, async () => {
    for (const canje of [{ json: { ok: false, error: 'revocado' } }, { status: 403 }, { status: 401 }]) {
      const m = await preparar(f);
      const p = f.negar(m, 'sin_acceso'); m.rd.pon(canje);
      await p; await asentar();
      const error = canje.status ? 'http ' + canje.status : 'revocado';
      assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], error);
      assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
      assert.deepEqual(rechazos(m), [{ error, token: TOK }]);
      assert.deepEqual(de(m, 'dato-negado'), [], 'si la sesión murió no es un dato negado');
      assert.equal(m.st.getItem('pyod_clave_v1'), TOK, 'cerrar() lo decide el adoptante');
    }
  });

  test(`V3 · ${nombre}: si el canje de verificación falla por red (caída, HTTP 500, timeout, JSON inválido) no pasa nada más: ni purga ni eventos`, async () => {
    for (const [cual, falla] of Object.entries(f === FUENTES['recordar (primer plano)'] ? FALLAS : { 'caída de red': FALLAS['caída de red'] })) {
      const m = await preparar(f), antes = canjes(m), otras = m.st.claves('yodcg_cache_v1:').filter(k => k !== f.llave(m)).sort();
      const p = f.negar(m, 'sin_acceso'); m.rd.pon(...falla.cola);
      await p; await m.rl.avanzar(falla.ms); await asentar();
      assert.equal(m.st.getItem(f.llave(m)), null, cual + ': el dato negado igual deja de servirse');
      assert.deepEqual([de(m, 'dato-negado'), rechazos(m), de(m, 'sesion-cerrada')], [[], [], []], cual);
      assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), otras, cual + ': lo demás sigue');
      assert.ok(m.st.getItem('yodcg_sesion_v1') && m.st.getItem('pyod_clave_v1') === TOK, cual);
      assert.ok(canjes(m) - antes >= 1, cual + ': sí se intentó verificar');
    }
  });
}

test('V4 · tres fuentes negadas a la vez (recordar, get y ppp.get): UNA sola verificación; canje ok → tres dato-negado; canje rechaza → una purga y un aviso', async () => {
  for (const ok of [true, false]) {
    const m = montar();
    m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
    m.rd.pon({ json: cuerpo('g') }, { json: cuerpo('p') });
    await m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'lista-x', viejoMs: HORA }); await m.core.ppp.get(PPP, LISTA);
    await m.core.recordar('a', () => Promise.resolve(cuerpo('a'))); await m.rl.avanzar(2 * MIN);
    const antes = canjes(m);
    m.rd.pon({ json: { ok: false, error: 'sin_acceso' } }, { json: { ok: false, error: 'sin_acceso' } });   // get y ppp.get
    const ps = [m.core.recordar('a', niega(), { modo: 'red-primero' }), m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'lista-x', viejoMs: HORA }), m.core.ppp.get(PPP, LISTA)];
    m.rd.pon({ json: ok ? CANJE_OK : { ok: false, error: 'revocado' } });    // y UN canje de verificación
    await Promise.all(ps); await asentar();
    assert.equal(canjes(m) - antes, 1, 'una verificación para toda la página');
    if (ok) {
      assert.deepEqual(de(m, 'dato-negado').map(e => e.detalle.clave).sort(), ['lista-x', 'memo:a', FUENTES['ppp.get'].clave].sort());
      assert.deepEqual(rechazos(m), []); assert.ok(m.st.getItem('yodcg_sesion_v1'));
    } else {
      assert.deepEqual(rechazos(m), [{ error: 'revocado', token: TOK }]); assert.deepEqual(de(m, 'dato-negado'), []);
      assert.deepEqual(m.st.claves('yodcg_cache_v1:'), []);
    }
  }
});

test('V5 · si el canje de la página ya está en vuelo la verificación NO reentra: se sube a él y espera su veredicto', async () => {
  for (const ok of [true, false]) {
    const m = await preparar(FUENTES['recordar (primer plano)']), d = diferido(), antes = canjes(m);
    m.rd.pon({ diferido: d });
    const enVuelo = m.core.sesion.canjear({ modo: 'red' });                  // el canje de la página (board '') vuela
    await asentar();
    const r = await m.core.recordar('a', niega(), { modo: 'red-primero' }); await asentar();
    assert.equal(r.rechazo, true); assert.equal(canjes(m) - antes, 1, 'un solo canje en el aire');
    assert.deepEqual([de(m, 'dato-negado'), rechazos(m)], [[], []], 'todavía no hay veredicto');
    d.ok(respuesta({ json: ok ? CANJE_OK : { ok: false, error: 'expirado' } })); await enVuelo; await asentar();
    assert.equal(canjes(m) - antes, 1);
    if (ok) assert.deepEqual(de(m, 'dato-negado').map(e => e.detalle), [{ clave: 'memo:a', error: 'sin_acceso' }]);
    else { assert.deepEqual(rechazos(m), [{ error: 'expirado', token: TOK }]); assert.deepEqual(m.st.claves('yodcg_cache_v1:'), []); }
  }
});

test('V6 · si la persona cambia o sale MIENTRAS vuela la verificación, su veredicto no purga ni avisa ni emite a la nueva', async () => {
  for (const [cual, canje] of [['ok', { json: CANJE_OK }], ['rechazo', { json: { ok: false, error: 'revocado' } }]]) {
    for (const cambio of ['otra persona', 'sale']) {
      const m = await preparar(FUENTES['recordar (primer plano)']), d = diferido(), otras = m.st.claves('yodcg_cache_v1:').filter(k => k !== llaveMemo(m, 'a')).sort();
      m.rd.pon({ diferido: d });
      await m.core.recordar('a', niega(), { modo: 'red-primero' }); await asentar();
      if (cambio === 'sale') m.core.sesion.cerrar({ token: TOK, motivo: 'salir' }); else m.st.setItem('pyod_clave_v1', OTRO);
      const antes = m.eventos.length;
      d.ok(respuesta(canje)); await asentar();
      assert.deepEqual([de(m, 'dato-negado'), rechazos(m)], [[], []], cual + '/' + cambio);
      assert.equal(m.eventos.length, antes, 'ningún evento más');
      if (cambio === 'otra persona') assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), otras, 'no se purga a la persona nueva');
    }
  }
});

test('V7 · una sesión ya dada por muerta no se vuelve a verificar: otro dato negado sólo vuelve a purgar (sin segundo aviso) hasta un canje bueno o cerrar()', async () => {
  const m = await preparar(FUENTES['recordar (primer plano)']);
  m.rd.pon({ json: { ok: false, error: 'revocado' } });
  await m.core.recordar('a', niega(), { modo: 'red-primero' }); await asentar();
  assert.equal(rechazos(m).length, 1); const antes = canjes(m);
  await m.core.recordar('d', () => Promise.resolve(cuerpo('d')));            // el adoptante no cerró: sigue con el mismo token
  await m.core.recordar('d', niega('clave'), { modo: 'red-primero' }); await asentar();
  assert.deepEqual([canjes(m) - antes, rechazos(m).length, m.st.claves('yodcg_cache_v1:')], [0, 1, []]);
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear({ modo: 'red' });   // un canje bueno: la credencial vuelve a valer
  await m.core.recordar('d', () => Promise.resolve(cuerpo('d')));
  m.rd.pon({ json: CANJE_OK });
  await m.core.recordar('d', niega('clave'), { modo: 'red-primero' }); await asentar();
  assert.deepEqual([de(m, 'dato-negado').map(e => e.detalle.clave), rechazos(m).length], [['memo:d'], 1]);
});

test('V8 · sin copia en juego (o con legacy) un rechazo no dispara verificación: el adoptante ya lo tiene en su respuesta', async () => {
  const m = montar();
  const r = await m.core.recordar('nueva', niega('sin_acceso')); await asentar();
  assert.deepEqual([r.ok, r.rechazo, r.error, canjes(m), m.rd.llamadas.length, m.eventos], [false, true, 'sin_acceso', 0, 0, []]);
  const l = montar({ search: '?cargador=legacy' });
  await l.core.recordar('x', () => Promise.resolve(cuerpo(1)));
  assert.equal((await l.core.recordar('x', niega('clave'))).rechazo, true); await asentar();
  assert.deepEqual([l.rd.llamadas.length, l.eventos], [0, []]);
});

test('V9 · un token vacío no verifica (nadie a quien avisar); el canje de verificación nunca lleva board ni toca el respaldo', async () => {
  const m = montar({ token: '' });
  await m.core.recordar('a', () => Promise.resolve(cuerpo(1)), { token: '' }); await m.rl.avanzar(2 * MIN);
  const r = await m.core.recordar('a', niega('clave'), { modo: 'red-primero', token: '' }); await asentar();
  assert.deepEqual([r.rechazo, m.rd.llamadas.length, m.eventos], [true, 0, []]);
  const k = await preparar(FUENTES['recordar (primer plano)']);
  k.rd.pon({ json: CANJE_OK });
  await k.core.recordar('a', niega(), { modo: 'red-primero' }); await asentar();
  assert.ok(k.rd.urls().filter(u => u.includes('recurso=canje')).every(u => u.startsWith(ORIGINAL + '?') && !u.includes('board=') && !u.startsWith(RESPALDO)));
});

/* ───────────── un token rechazado no resucita sus copias (T-201, hallazgo de Terra 2 al adoptar recordar) ─────────────
   Tras sesion-rechazada el token SIGUE en pyod_clave_v1 (sólo cerrar() lo borra), así que lo que YA volaba (get, ppp.get,
   recordar, el canje en fondo) terminaba y volvía a escribir su copia. Ahora el token rechazado queda marcado en esta página
   (avisado): nada suyo se guarda ni se anuncia hasta un canje bueno que salga DESPUÉS de la marca, o hasta cerrar(). */

const VUELOS = [
  { nombre: 'get', arrancar: m => m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'lista-x', viejoMs: HORA }), llegar: (d, b) => d.ok(respuesta({ json: b })) },
  { nombre: 'ppp.get (lista, primer plano)', arrancar: m => m.core.ppp.get(PPP, LISTA), llegar: (d, b) => d.ok(respuesta({ json: b })) },
  { nombre: 'ppp.get (lista, revalidación en fondo)', sembrar: m => { m.rd.pon({ json: cuerpo('p') }); return m.core.ppp.get(PPP, LISTA); },
    arrancar: m => m.core.ppp.get(PPP, LISTA), llegar: (d, b) => d.ok(respuesta({ json: b })) },
  { nombre: 'recordar (primer plano)', arrancar: (m, d) => m.core.recordar('a', () => d.promesa, { modo: 'red-primero' }), llegar: (d, b) => d.ok(b) },
  { nombre: 'recordar (revalidación en fondo)', sembrar: m => m.core.recordar('a', () => Promise.resolve(cuerpo('a'))),
    arrancar: (m, d) => m.core.recordar('a', () => d.promesa), llegar: (d, b) => d.ok(b) }
];

for (const f of VUELOS) {
  test(`G1 · ${f.nombre}: si el Portero rechaza la sesión (canje en fondo) ANTES de que llegue el dato, el dato tardío no vuelve a guardarse ni a anunciarse`, async () => {
    const m = montar(), canjeD = diferido(), datoD = diferido();
    m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();              // sesión guardada (board «»)
    if (f.sembrar) await f.sembrar(m);                                         // la fuente ya tenía copia: lo que vuela es su revalidación
    await m.rl.avanzar(11 * MIN);                                              // la sesión ya no es fresca: canjear() sirve la guardada y revalida en fondo
    const anunciados = de(m, 'dato').length;                                   // (ppp.get anuncia hasta en primer plano: se cuenta desde aquí)
    m.rd.defecto = url => url.includes('recurso=canje') ? canjeD.promesa : datoD.promesa;
    const p = f.arrancar(m, datoD);                                            // el dato vuela...
    assert.equal((await m.core.sesion.canjear()).origen, 'cache');             // ...y el canje en fondo también
    await asentar();
    canjeD.ok(respuesta({ json: { ok: false, error: 'revocado' } })); await asentar();   // el Portero rechaza ANTES de que llegue el dato
    assert.deepEqual(rechazos(m), [{ error: 'revocado', token: TOK }]);
    assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'la purga dejó todo limpio');
    f.llegar(datoD, cuerpo('tarde')); await p; await asentar();               // el dato llega tarde y bien
    assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'nada de ese token reaparece');
    assert.equal(m.st.getItem('yodcg_sesion_v1'), null);
    assert.equal(de(m, 'dato').length, anunciados, 'ni se anuncia como dato fresco');
    assert.equal(m.st.getItem('pyod_clave_v1'), TOK, 'la llave no se toca: cerrar() es del adoptante');
  });
}

test('G2 · un canje en fondo que salió ANTES del rechazo y llega bien DESPUÉS es una respuesta vieja: no reescribe la sesión, no anuncia sesion y no limpia la marca', async () => {
  const m = montar(), viejo = diferido(), verif = diferido();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear({ board: 'MA' });   // sesión guardada con board «MA»
  await m.core.recordar('a', () => Promise.resolve(cuerpo('a')));
  await m.rl.avanzar(11 * MIN);
  m.rd.defecto = url => url.includes('board=MA') ? viejo.promesa : verif.promesa;
  assert.equal((await m.core.sesion.canjear({ board: 'MA' })).origen, 'cache'); await asentar();   // el canje en fondo (board MA) vuela
  await m.core.recordar('a', niega(), { modo: 'red-primero' }); await asentar();                   // un dato negado: verificación (sin board)
  verif.ok(respuesta({ json: { ok: false, error: 'revocado' } })); await asentar();
  assert.deepEqual(rechazos(m), [{ error: 'revocado', token: TOK }]);
  viejo.ok(respuesta({ json: CANJE_OK })); await asentar();                      // y llega el viejo, bien
  assert.equal(m.st.getItem('yodcg_sesion_v1'), null, 'la sesión no resucita');
  assert.equal(m.core.sesion.peek(), null);
  assert.deepEqual(de(m, 'sesion'), [], 'ni se anuncia como vigente');
  await m.core.recordar('b', () => Promise.resolve(cuerpo('b')));              // la marca sigue: lo que se pide después tampoco se guarda
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), []);
  assert.equal(rechazos(m).length, 1, 'y sigue habiendo un solo aviso');
});

test('G3 · dato-negado no sale si el token se rechazó mientras volaba la verificación (el veredicto bueno ya es viejo)', async () => {
  const m = montar(), refresco = diferido(), verif = diferido();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear({ board: 'MA' });
  await m.core.recordar('a', () => Promise.resolve(cuerpo('a')));
  await m.rl.avanzar(11 * MIN);
  m.rd.defecto = url => url.includes('board=MA') ? refresco.promesa : verif.promesa;
  await m.core.sesion.canjear({ board: 'MA' }); await asentar();
  await m.core.recordar('a', niega(), { modo: 'red-primero' }); await asentar();   // la verificación (sin board) vuela
  refresco.ok(respuesta({ json: { ok: false, error: 'expirado' } })); await asentar();   // el otro canje rechaza primero: purga y marca
  verif.ok(respuesta({ json: CANJE_OK })); await asentar();                      // y la verificación vuelve «ok» tarde
  assert.deepEqual(rechazos(m), [{ error: 'expirado', token: TOK }]);
  assert.deepEqual(de(m, 'dato-negado'), [], 'sería contradecir sesion-rechazada');
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), []);
});

test('G4 · un canje bueno con el MISMO token, pedido después de la marca, la limpia: vuelve a guardar y a anunciar; cerrar() también; el de otro token no', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
  await m.core.recordar('a', () => Promise.resolve(cuerpo('a'))); await m.rl.avanzar(2 * MIN);
  m.rd.pon({ json: { ok: false, error: 'revocado' } });
  await m.core.recordar('a', niega('clave'), { modo: 'red-primero' }); await asentar();
  assert.equal(rechazos(m).length, 1);
  const pedir = async () => {                                                    // las tres vías de lectura
    await m.core.recordar('b', () => Promise.resolve(cuerpo('b')));
    m.rd.pon({ json: cuerpo('g') }); await m.core.get(ORIGINAL, { recurso: 'lista', k: TOK }, { clave: 'lista-x', viejoMs: HORA });
    m.rd.pon({ json: cuerpo('p') }); await m.core.ppp.get(PPP, LISTA);
    return m.st.claves('yodcg_cache_v1:').length;
  };
  assert.equal(await pedir(), 0, 'marcado: no se guarda nada');
  assert.deepEqual(de(m, 'dato'), [], 'ni se anuncia');

  m.st.setItem('pyod_clave_v1', OTRO);                                           // el canje bueno de OTRA persona no limpia la marca de TOK
  m.rd.pon({ json: Object.assign({}, CANJE_OK, { token: OTRO }) }); assert.equal((await m.core.sesion.canjear()).ok, true);
  m.st.setItem('pyod_clave_v1', TOK); m.core.purgar();
  assert.equal(await pedir(), 0, 'sigue marcado');

  m.rd.pon({ json: CANJE_OK });                                                  // un canje bueno con TOK, pedido ya marcado: limpia
  const c = await m.core.sesion.canjear(); assert.deepEqual([c.ok, c.origen], [true, 'red']);
  assert.ok(m.st.getItem('yodcg_sesion_v1') && m.core.sesion.peek(), 'y la identidad vuelve a guardarse');
  assert.equal(await pedir(), 3, 'ahora sí se guarda todo');
  await m.rl.avanzar(2 * MIN); await m.core.recordar('b', () => Promise.resolve(cuerpo('b2'))); await asentar();
  assert.deepEqual(de(m, 'dato').map(e => e.detalle.clave), ['lista-x', 'ppp:lista:MACROLOTES::' + m.core.hash(TOK), 'memo:b'], 'y vuelve a anunciar');

  m.rd.pon({ json: { ok: false, error: 'clave' } });                             // otro rechazo: marca y aviso de nuevo
  await m.core.recordar('b', niega('clave'), { modo: 'red-primero' }); await asentar();
  assert.deepEqual(rechazos(m).map(x => x.error), ['revocado', 'clave']);
  assert.equal(await pedir(), 0);
  m.core.sesion.cerrar({ token: TOK, motivo: 'salir' }); m.st.setItem('pyod_clave_v1', TOK);   // cerrar() limpia la marca
  assert.equal(await pedir(), 3, 'tras cerrar() la misma credencial vuelve a guardar');
});

test('G5 · la marca es sólo del token rechazado: el anillo de telemetría, los datos sin credencial y otra persona siguen escribiendo', async () => {
  const m = montar();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear();
  await m.core.recordar('a', () => Promise.resolve(cuerpo('a'))); await m.rl.avanzar(2 * MIN);
  m.rd.pon({ json: { ok: false, error: 'revocado' } });
  await m.core.recordar('a', niega('clave'), { modo: 'red-primero' }); await asentar();   // TOK rechazado y marcado
  assert.equal(rechazos(m).length, 1);

  const antes = JSON.parse(m.st.getItem('yodcg_telemetria_v1') || '[]').length;   // 1. el anillo de telemetría
  const t = await m.core.recordar('t', () => Promise.resolve(cuerpo('t')), { telemetria: 'flujo' });
  const anillo = JSON.parse(m.st.getItem('yodcg_telemetria_v1'));
  assert.equal(t.ok, true, 'quien pidió igual recibe su respuesta');
  assert.ok(anillo.length > antes && anillo.some(x => x.p === 'flujo' && x.origen === 'red'), 'la telemetría se sigue anotando');
  assert.deepEqual(m.st.claves('yodcg_cache_v1:'), [], 'pero la copia de TOK no');

  m.rd.pon({ json: cuerpo('pub') });                                             // 2. lo que se pide sin credencial no es de nadie
  await m.core.get(ORIGINAL, { recurso: 'publico' }, { clave: 'publico', viejoMs: HORA });
  assert.ok(m.st.getItem('yodcg_cache_v1:publico'), 'sin k se guarda');
  assert.deepEqual(de(m, 'dato').map(e => e.detalle.clave), ['publico'], 'y se anuncia');

  m.st.setItem('pyod_clave_v1', OTRO);                                           // 3. otra persona en el mismo navegador
  await m.core.recordar('o', () => Promise.resolve(cuerpo('o')));
  m.rd.pon({ json: cuerpo('g') }); await m.core.get(ORIGINAL, { recurso: 'lista', k: OTRO }, { clave: 'lista-o', viejoMs: HORA });
  m.rd.pon({ json: cuerpo('p') }); await m.core.ppp.get(PPP, { recurso: 'lista', tipo: 'MACROLOTES', k: OTRO });
  assert.deepEqual(m.st.claves('yodcg_cache_v1:').sort(), ['yodcg_cache_v1:lista-o', 'yodcg_cache_v1:publico', llaveMemo(m, 'o', OTRO), 'yodcg_cache_v1:ppp:lista:MACROLOTES::' + m.core.hash(OTRO)].sort());
  const n0 = de(m, 'dato').length;
  await m.rl.avanzar(2 * MIN); await m.core.recordar('o', () => Promise.resolve(cuerpo('o2'))); await asentar();
  assert.deepEqual(de(m, 'dato').slice(n0).map(e => e.detalle.clave), ['memo:o'], 'y a OTRO sí se le anuncia lo fresco');
});

/* ───────────── telemetría, página, hash ───────────── */

test('13 · telemetría: primerDato una vez; codigos() ≤ 40 sin espacios y sin repetir; resumen() con mediana y p90', async () => {
  const m = montar({ pathname: '/potenciales-yod/macrolotes.html' }), T = m.core.telemetria;
  await m.rl.avanzar(1832);
  assert.equal(T.primerDato('red', { via: 'lista' }), true);
  assert.equal(T.primerDato('cache'), false, 'sólo la primera cuenta');
  assert.deepEqual(de(m, 'primer-dato').map(e => e.detalle), [{ t: 1832, origen: 'red', tablero: 'MA', frio: true, extra: { via: 'lista' } }]);
  assert.deepEqual(T.codigos(), ['pd:MA:1832:r@otro'], 'sin navigator (Node) el dispositivo es «otro»');
  assert.deepEqual(T.codigos(), [], 'ya reportado');
  assert.deepEqual(JSON.parse(m.st.getItem('yodcg_telemetria_v1')), [{ t: 1832, p: 'pd', tablero: 'MA', origen: 'red', frio: true, disp: 'otro' }]);

  m.core.config({ catalogo: { url: CATALOGO } });
  m.rd.pon(async () => { await m.rl.avanzar(250); return respuesta({ json: CANJE_OK }); }, async () => { await m.rl.avanzar(120); return respuesta({ json: { ok: true, rows: [] } }); });
  await m.core.sesion.canjear();
  await m.core.catalogo();
  m.rd.pon({ json: CANJE_OK }); await m.core.sesion.canjear({ modo: 'red' });
  await m.core.sesion.canjear(); await m.core.catalogo();
  const cods = T.codigos();
  assert.deepEqual(cods, ['cj:MA:250:r@otro', 'cat:120:r@otro'], 'un código por tipo y por página');
  assert.ok(cods.every(c => /^\S{1,40}$/.test(c)));
  assert.deepEqual(T.codigos(), []);
  assert.equal(T.marca('arranque'), m.rl.perfNow());

  const r = montar({ token: TOK });                                        // otra página, misma sesión ya en caché: arranca «caliente»
  r.rd.pon({ json: CANJE_OK }); await r.core.sesion.canjear();
  const r2 = crear(Object.assign({}, r.env, { location: { pathname: '/yod-portal/os/', search: '', hash: '' } }));
  r2.telemetria.primerDato('cache');
  assert.deepEqual(r2.telemetria.codigos(), ['pd:OS:0:c@otro']);
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
  assert.deepEqual(a.pop(), { t: 0, p: 'lista', tablero: 'MA', origen: 'red', frio: true, disp: 'otro' });
  m.core.telemetria.limpiar();
  assert.equal(m.st.getItem('yodcg_telemetria_v1'), null); assert.equal(m.st.getItem('pyod_clave_v1'), TOK);
  m.core.purgar();
  m.st.setItem('yodcg_telemetria_v1', '[]'); m.core.purgar(); m.core.sesion.cerrar({ token: OTRO });
  assert.equal(m.st.getItem('yodcg_telemetria_v1'), '[]', 'ni purgar ni cerrar borran la telemetría');
});

/* ───────────── dispositivo en la telemetría (T-201 punto 4) ───────────── */

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipod: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  cros: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  win: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  lin: 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'
};
const PLATAFORMAS = [
  ['iPhone', { userAgent: UA.iphone }, 'ios'], ['iPad', { userAgent: UA.ipad }, 'ios'], ['iPod', { userAgent: UA.ipod }, 'ios'],
  ['iPad en modo escritorio (Macintosh con toques)', { userAgent: UA.mac, maxTouchPoints: 5 }, 'ios'],
  ['Mac con exactamente 2 toques', { userAgent: UA.mac, maxTouchPoints: 2 }, 'ios'],
  ['Mac de verdad (0 toques)', { userAgent: UA.mac, maxTouchPoints: 0 }, 'mac'], ['Mac con 1 solo toque no es iPad', { userAgent: UA.mac, maxTouchPoints: 1 }, 'mac'],
  ['Mac sin maxTouchPoints', { userAgent: UA.mac }, 'mac'],
  ['Android (su agente también dice Linux)', { userAgent: UA.android }, 'and'], ['ChromeOS (CrOS)', { userAgent: UA.cros }, 'cros'],
  ['Windows', { userAgent: UA.win }, 'win'], ['Linux', { userAgent: UA.lin }, 'lin'],
  ['userAgentData.platform «Android»', { userAgentData: { platform: 'Android' }, userAgent: UA.lin }, 'and'],
  ['userAgentData.platform «Chrome OS»', { userAgentData: { platform: 'Chrome OS' } }, 'cros'],
  ['userAgentData.platform «Chromium OS»', { userAgentData: { platform: 'Chromium OS' } }, 'cros'],
  ['userAgentData.platform «Windows»', { userAgentData: { platform: 'Windows' } }, 'win'],
  ['userAgentData.platform «macOS»', { userAgentData: { platform: 'macOS' }, maxTouchPoints: 0 }, 'mac'],
  ['userAgentData.platform «macOS» con toques', { userAgentData: { platform: 'macOS' }, maxTouchPoints: 5 }, 'ios'],
  ['userAgentData.platform «Linux»', { userAgentData: { platform: 'Linux' } }, 'lin'],
  ['userAgentData.platform manda sobre el userAgent', { userAgentData: { platform: 'Windows' }, userAgent: UA.android }, 'win'],
  ['platform vacía → userAgent', { userAgentData: { platform: '' }, userAgent: UA.win }, 'win'],
  ['platform «Unknown» → userAgent', { userAgentData: { platform: 'Unknown' }, userAgent: UA.android }, 'and'],
  ['userAgentData sin platform → userAgent', { userAgentData: {}, userAgent: UA.cros }, 'cros'],
  ['agente irreconocible', { userAgent: 'curl/8.0' }, 'otro'], ['navigator vacío', {}, 'otro'], ['userAgent vacío', { userAgent: '' }, 'otro']
];

test('T1 · dispositivo: ios (iPhone/iPad/iPod o Macintosh con maxTouchPoints > 1), and, cros, win, mac, lin u otro, de userAgentData.platform o del userAgent', () => {
  for (const [nombre, nav, esperado] of PLATAFORMAS) {
    const m = montar({ navigator: nav });
    m.core.telemetria.primerDato('red');
    assert.deepEqual(m.core.telemetria.codigos(), ['pd:MA:0:r@' + esperado], nombre);
    assert.equal(JSON.parse(m.st.getItem('yodcg_telemetria_v1'))[0].disp, esperado, nombre + ' (el anillo guarda disp)');
  }
  const sin = montar();                                                    // sin navigator (Node, workers) no revienta
  sin.core.telemetria.primerDato('cache');
  assert.deepEqual(sin.core.telemetria.codigos(), ['pd:MA:0:c@otro']);
  for (const prop of ['userAgent', 'userAgentData', 'maxTouchPoints']) {   // un navigator hostil (getters que lanzan) tampoco
    const nav = {}; Object.defineProperty(nav, prop, { get() { throw new Error('bloqueado'); } });
    const m = montar({ navigator: nav });
    m.core.telemetria.primerDato('red'); assert.deepEqual(m.core.telemetria.codigos(), ['pd:MA:0:r@otro'], prop);
  }
  const falso = montar({ navigator: { userAgentData: { get platform() { throw new Error('x'); } }, userAgent: UA.win } });
  falso.core.telemetria.primerDato('red'); assert.deepEqual(falso.core.telemetria.codigos(), ['pd:MA:0:r@otro'], 'si el dato falla, «otro»; no se adivina');
});

test('T2 · los códigos de la bitácora (pd:, cj: y cat:) terminan en @<disp>, siguen ≤ 40 caracteres sin espacios y el anillo guarda disp; el dispositivo se calcula una vez', async () => {
  for (const [nav, disp] of [[{ userAgent: UA.iphone }, 'ios'], [{ userAgent: UA.cros }, 'cros'], [{ userAgentData: { platform: 'Windows' } }, 'win']]) {
    const m = montar({ navigator: nav, pathname: '/real-miramar-board/tramites.html' });
    m.core.config({ catalogo: { url: CATALOGO } });
    m.rd.pon(async () => { await m.rl.avanzar(250); return respuesta({ json: CANJE_OK }); }, async () => { await m.rl.avanzar(120); return respuesta({ json: { ok: true, rows: [] } }); });
    await m.core.sesion.canjear(); await m.core.catalogo();                  // el catálogo mide y dispara el primer dato de la página
    const cods = m.core.telemetria.codigos();
    assert.deepEqual(cods, ['cj:MT:250:r@' + disp, 'cat:120:r@' + disp, 'pd:MT:370:r@' + disp]);
    assert.ok(cods.every(c => /^\S{1,40}$/.test(c)), 'sin espacios y ≤ 40');
    const anillo = JSON.parse(m.st.getItem('yodcg_telemetria_v1'));
    assert.ok(anillo.length >= 3 && anillo.every(x => x.disp === disp), 'todas las muestras llevan disp');
    assert.deepEqual(anillo.map(x => Object.keys(x).sort().join()).filter((v, i, a) => a.indexOf(v) === i), ['disp,frio,origen,p,t,tablero']);
  }
  const nav = { userAgent: UA.win }, m = montar({ navigator: nav });
  nav.userAgent = UA.iphone;                                                // el dispositivo no cambia durante la página
  m.core.telemetria.primerDato('red'); assert.deepEqual(m.core.telemetria.codigos(), ['pd:MA:0:r@win']);
  const largo = montar({ navigator: { userAgent: UA.cros } });              // el tope de 40 se conserva con el sufijo más largo (cros)
  await largo.rl.avanzar(999999999); largo.core.telemetria.primerDato('cache');
  const [cod] = largo.core.telemetria.codigos(); assert.deepEqual([cod, cod.length <= 40], ['pd:MA:999999999:c@cros', true]);
});

test('T3 · resumen(o) acepta o.disp (y se combina con tablero y p); las muestras viejas sin disp no entran en un filtro por dispositivo', () => {
  const m = montar();
  const anillo = [
    { t: 100, p: 'pd', tablero: 'MA', disp: 'ios' }, { t: 200, p: 'pd', tablero: 'MA', disp: 'ios' }, { t: 900, p: 'pd', tablero: 'MA', disp: 'win' },
    { t: 300, p: 'cj', tablero: 'MA', disp: 'ios' }, { t: 50, p: 'pd', tablero: 'MX', disp: 'ios' }, { t: 7000, p: 'pd', tablero: 'MA' }
  ];
  m.st.setItem('yodcg_telemetria_v1', JSON.stringify(anillo));
  const r = o => { const x = m.core.telemetria.resumen(o); return [x.n, x.mediana_ms, x.p90_ms]; };
  assert.deepEqual(r(), [6, 250, 7000]);
  assert.deepEqual(r({ disp: 'ios' }), [4, 150, 300]);
  assert.deepEqual(r({ disp: 'win' }), [1, 900, 900]);
  assert.deepEqual(r({ disp: 'ios', tablero: 'MA' }), [3, 200, 300]);
  assert.deepEqual(r({ disp: 'ios', tablero: 'MA', p: 'pd' }), [2, 150, 200]);
  assert.deepEqual(r({ disp: 'cros' }), [0, 0, 0]);
  assert.deepEqual(r({ tablero: 'MA' }), [5, 300, 7000], 'sin o.disp no se filtra por dispositivo (incluye la muestra vieja sin disp)');
  assert.deepEqual(m.core.telemetria.resumen({ disp: 'ios' }).ultimos.map(x => x.t), [100, 200, 300, 50]);
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
  assert.deepEqual(g.core.telemetria.codigos(), ['pd:MA:0:r@otro'], 'la telemetría sigue midiendo');
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

test('la telemetría nunca expulsa cachés de datos para hacerse sitio (los datos sí podan a las viejas)', () => {
  const st = almacen({ pyod_clave_v1: TOK });
  st.setItem('yodcg_cache_v1:a', JSON.stringify({ ts: 1, data: 'x'.repeat(50) }));
  st.setItem('yodcg_cache_v1:b', JSON.stringify({ ts: 2, data: 'x'.repeat(50) }));
  st.cuota = [...st.mapa].reduce((n, [k, v]) => n + k.length + v.length, 0);   // lleno hasta el tope
  const m = montar({ storage: st });
  assert.equal(m.core.telemetria.primerDato('red'), true);
  assert.deepEqual(st.claves('yodcg_cache_v1:'), ['yodcg_cache_v1:a', 'yodcg_cache_v1:b']);
  assert.equal(st.getItem('yodcg_telemetria_v1'), null);
  assert.deepEqual(m.core.telemetria.codigos(), ['pd:MA:0:r@otro'], 'el código para la bitácora sale igual');
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
  assert.equal(primera.v, '2'); assert.equal(primera.legacy, false); assert.equal(primera.pagina(), 'OS'); assert.equal(primera.sesion.token(), TOK);
  vm.runInContext(FUENTE, ctx);
  assert.equal(ctx.YodCargador, primera, 'el segundo script no hace nada');
  assert.deepEqual(Object.keys(primera).sort(), ['arranque', 'cargarDespues', 'catalogo', 'config', 'get', 'hash', 'legacy', 'pagina', 'ppp', 'purgar', 'recordar', 'sesion', 'telemetria', 'v']);
  assert.deepEqual(Object.keys(primera.sesion).sort(), ['alCambiar', 'canjear', 'cerrar', 'esRechazo', 'peek', 'token']);
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
