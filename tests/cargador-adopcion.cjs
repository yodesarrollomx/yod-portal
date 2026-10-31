'use strict';
/* T-102 · Fase 1 «Un cargador»: la cabina (os/app.js), el marco (os/shell.js) y os/index.html adoptan
   window.YodCargador SIN tener todavía el archivo real: se programa contra el contrato
   (CONTRATO-yod-cargador.md) con un cargador de mentira. Ninguna petición real.
   Con cargador activo → las funciones nuevas (…ConCargador_). Sin cargador o con legacy → el camino de siempre
   (lo cubre tests/portal-identity.cjs sin cambios; aquí sólo se confirma que no se toca al cargador). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const appSource = fs.readFileSync(require.resolve('../os/app.js'), 'utf8');
const shellSource = fs.readFileSync(require.resolve('../os/shell.js'), 'utf8');
const indexHtml = fs.readFileSync(require.resolve('../os/index.html'), 'utf8');
const esperaReal = setTimeout;
const asienta = (ms = 12) => new Promise(r => esperaReal(r, ms));
// Los objetos creados DENTRO del vm tienen otro prototipo: se comparan por su JSON.
const J = x => JSON.stringify(x);

function fn(source, name) {
  const re = new RegExp('^  (?:async )?function ' + name + '\\(', 'm');
  const match = re.exec(source);assert.ok(match, name + ' existe');
  const rest = source.slice(match.index), line = rest.slice(0, rest.indexOf('\n'));
  if (line.endsWith('}')) return line;
  const end = /^  }\s*$/m.exec(rest);assert.ok(end, name + ' tiene cierre');
  return rest.slice(0, end.index + end[0].length);
}
function store(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k) };
}
function deferred() { let resolve, reject;const promise = new Promise((a, b) => { resolve = a;reject = b; });return { promise, resolve, reject }; }
function element() {
  return { textContent: '', innerHTML: '', hidden: false, disabled: false, style: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    replaceChildren() { this.children = [];this.innerHTML = ''; },
    setAttribute() {}, removeAttribute() {}, appendChild(x) { this.children.push(x); }, querySelector() { return null; } };
}

/* ── El cargador de mentira: sólo lo que dice el contrato ── */
function fakeCargador(o = {}) {
  const calls = { canjear: [], cerrar: [], purgar: 0, catalogo: [], get: [], config: [], primerDato: [], cargarDespues: [] };
  let manejador = null;
  const buenCatalogo = { ok: true, status: 200, origen: 'red', ms: 5, data: { ok: true, actor: 'SESSION', rows: [{ system_id: 'SYS-FRESCO', visible: 'SI', orden: '1' }] } };
  const cargador = {
    v: '1', legacy: Boolean(o.legacy),
    config(x) { calls.config.push(x);return x; },
    sesion: {
      token: () => '',
      canjear: async opts => { calls.canjear.push(opts);return typeof o.canjear === 'function' ? o.canjear(opts) : o.canjear; },
      esRechazo: () => false,
      cerrar(x) { calls.cerrar.push(x);return true; },
      alCambiar(f) { manejador = f;return () => { manejador = null; }; }
    },
    catalogo: opts => { calls.catalogo.push(opts);return typeof o.catalogo === 'function' ? o.catalogo(opts) : Promise.resolve(o.catalogo || buenCatalogo); },
    get: (...a) => { calls.get.push(a);return typeof o.get === 'function' ? o.get(...a) : Promise.resolve(buenCatalogo); },
    telemetria: { primerDato(origen, extra) { calls.primerDato.push(origen);return o.primerDato === null ? undefined : { t: 1800, origen }; } },
    cargarDespues(src, opts) { calls.cargarDespues.push([src, opts]);return o.cargarDespues ? o.cargarDespues(src, opts) : Promise.resolve({}); },
    purgar() { calls.purgar++; }
  };
  return { cargador, calls, emitir: (type, detail) => manejador && manejador({ type, detail }), get suscrito() { return Boolean(manejador); } };
}
const sesionCache = (extra = {}) => ({ ok: true, rol: 'vista', boards: 'TA', nombre: 'Persona en caché', correo: 'cache@example.invalid', origen: 'cache', edadMs: 3 * 3600000, token: 'tok-A', ...extra });
const sesionRed = (extra = {}) => ({ ...sesionCache(), origen: 'red', edadMs: 0, nombre: 'Persona en vivo', ...extra });

/* ── cabina (os/app.js) ── */
function appHarness(o = {}) {
  const token = o.token || 'tok-A';
  const nodes = new Map(), applied = [], loads = [], renders = [], blocks = [], timers = [], conexion = [], reloads = [];
  const node = id => { if (!nodes.has(id)) nodes.set(id, element());return nodes.get(id); };
  const localStorage = store(Object.assign({ pyod_clave_v1: token }, o.storage || {}));
  const fake = fakeCargador(o.cargador || {});
  const state = { modules: [], rawRows: [], role: 'vista', boards: '', profileReady: false, allTasks: [], sesionEpoch: 0, sessionToken: '', identityRequest: 0, pulseCache: {}, opsCache: null, verifiedAt: 0 };
  const win = {};if (!o.sinCargador) win.YodCargador = fake.cargador;
  const c = vm.createContext({
    state, localStorage, sessionStorage: store(), TOKEN_KEY: 'pyod_clave_v1', LLAVES_SALA: ['sala_clave', 'sala_gas', 'sala_rol'],
    SENSITIVE_CACHES: ['aurum-cache-v5', 'yod_ops_me', 'yod_pulse_v1', 'yod_portal_cat_v1', 'codeyod-cache-v1'],
    $: node, document: { querySelectorAll: () => [], createElement: () => element() }, window: win,
    console: { warn() {}, log() {}, info() {} }, location: { reload() { reloads.push(true); }, pathname: '/' },
    REINTENTOS_MAX: 3, REINTENTO_MS: 15000, LIMITE_MS: 25000, LIMITE_FRIO_MS: 75000,
    CATALOG_BASE: 'https://example.invalid/catalogo', CAT_RESPALDO: [{ system_id: 'SYNTH-RESPALDO' }], performance: { now: () => 2400 },
    setTimeout(f, ms) { if (!ms) return esperaReal(f, 0);timers.push({ f, ms });return timers.length; }, clearTimeout() {},
    renderOperationsSinSesion() {}, tableroSinSesion() {}, nombrarAccionesRapidas() {}, selloDato: () => 'Consultado a las 10:00',
    renderModules(rows) { renders.push(rows);state.rawRows = rows;state.modules = rows; },
    setConnection(kind, text) { conexion.push([kind, text]); }, frasePendiente: x => x,
    applyIdentity(d) { state.profileReady = true;state.role = String(d.rol).toLowerCase();state.boards = d.boards;state.personName = d.nombre;state.verifiedEmail = d.correo;applied.push(d.nombre); },
    startData: async t => { loads.push('datos:' + t); }
  });
  const nombres = ['tokenActual', 'rechazoAcceso', 'mismaSesion', 'purgarDatosSensibles', 'bloquearSesion', 'cerrarSesion', 'edadTexto', 'cargadorActivo_', 'canjearConRelevo_',
    'canjearConCargador_', 'respuestaInmediata_', 'cerrarCargador_', 'purgarCargador_', 'configurarCatalogo_', 'edadCopia_', 'mostrarTiempo_', 'marcarPrimerDato_',
    'catalogoAutenticado_', 'pintarCatalogo_', 'catalogoSinAcceso', 'loadCatalog', 'loadCatalogConCargador_', 'coordinatedPortalLoad', 'loadIdentity', 'loadIdentityOnce',
    'loadIdentityConCargador_', 'sesionRefrescada_', 'sesionRechazadaEnFondo_', 'suscribirCargador_'];
  vm.runInContext(nombres.map(n => fn(appSource, n)).join('\n'), c);
  const real = c.bloquearSesion;c.bloquearSesion = (...a) => { blocks.push(a);return real(...a); };
  function autoriza(extra = {}) { state.profileReady = true;state.sessionToken = token;state.role = 'vista';state.boards = 'TA';state.personName = 'Persona en caché';state.verifiedEmail = 'cache@example.invalid';state.verifiedAt = Date.now();Object.assign(state, extra); }
  return { c, state, fake, applied, loads, renders, blocks, timers, conexion, reloads, node, localStorage, autoriza };
}

test('App · copia guardada (origen cache): NO se llama bloquearSesion, se aplica la identidad al instante y la edad es la verdadera', async () => {
  const h = appHarness({ storage: { yod_canje_fail: '2' }, cargador: { canjear: () => sesionCache() } });
  await h.c.loadIdentity();
  assert.equal(h.blocks.length, 0, 'sin parpadeo de «Validando…»');assert.equal(h.localStorage.getItem('yod_canje_fail'), null, 'una copia sólo existe tras un éxito vivo: limpia los golpes');
  assert.deepEqual(h.applied, ['Persona en caché']);assert.equal(h.state.profileReady, true);assert.equal(h.state.sessionToken, 'tok-A');
  assert.equal(h.fake.calls.canjear.length, 1);assert.equal(h.fake.calls.canjear[0].modo, 'cache-primero');
  assert.ok(Date.now() - h.state.verifiedAt >= 3 * 3600000 - 1000, 'verifiedAt conserva la edad de la copia (no gana la gracia de 5 min)');
  assert.ok(h.loads.includes('datos:tok-A'), 'arranca la carga de datos');assert.equal(h.fake.calls.catalogo.length, 1, 'y el catálogo por el cargador');
});

test('App · respuesta de red (la copia no existe): se bloquea primero y se aplica al llegar, igual que hoy', async () => {
  const d = deferred();const h = appHarness({ cargador: { canjear: () => d.promise } });
  const cargando = h.c.loadIdentity();await asienta();
  assert.equal(h.blocks.length, 1, 'perdió la carrera de la vuelta del bucle: se bloquea y se espera');assert.equal(h.state.profileReady, false);assert.equal(h.applied.length, 0);
  h.localStorage.setItem('yod_canje_fail', '2');
  d.resolve(sesionRed());await cargando;
  assert.deepEqual(h.applied, ['Persona en vivo']);assert.equal(h.localStorage.getItem('yod_canje_fail'), null, 'una validación viva limpia los golpes');
  assert.ok(Date.now() - h.state.verifiedAt < 2000);
});

test('App · un token distinto NUNCA hereda la identidad pintada: se bloquea aunque su copia exista', async () => {
  const h = appHarness({ token: 'tok-B', cargador: { canjear: () => sesionCache({ token: 'tok-B', nombre: 'B en caché' }) } });
  h.autoriza();h.state.sessionToken = 'tok-A';                   // en pantalla está la identidad de A
  await h.c.loadIdentity();
  assert.equal(h.blocks.length, 1, 'primero se oculta lo de A');assert.deepEqual(h.applied, ['B en caché']);assert.equal(h.state.sessionToken, 'tok-B');
});

test('App · ⟳ y los reintentos piden red (modo "red"); la carga en frío sale de la copia (modo "cache-primero")', async () => {
  const h = appHarness({ cargador: { canjear: o => (o.modo === 'red' ? sesionRed() : sesionCache()) } });
  await h.c.loadIdentity();await h.c.loadIdentity();            // la segunda ya está validada → ⟳
  assert.deepEqual(h.fake.calls.canjear.map(x => x.modo), ['cache-primero', 'red']);
  const r = appHarness({ cargador: { canjear: () => sesionRed() } });r.state.canjeRetry = 1;
  await r.c.loadIdentity();assert.equal(r.fake.calls.canjear[0].modo, 'red');
});

test('App · fallo de transporte con el cargador: Portero lento → bloquea, reintenta y NO borra la credencial', async () => {
  const h = appHarness({ cargador: { canjear: () => ({ ok: false, error: 'timeout', rechazo: false, origen: 'sin_red', token: 'tok-A' }) } });
  await h.c.loadIdentity();
  assert.equal(h.state.profileReady, false);assert.equal(h.localStorage.getItem('pyod_clave_v1'), 'tok-A');
  assert.equal(h.timers.length, 1);assert.equal(h.timers[0].ms, 15000);assert.equal(h.fake.calls.purgar, 0);assert.equal(h.fake.calls.cerrar.length, 0);
  assert.equal(h.node('access-status').textContent, 'canje:timeout', 'el diagnóstico va a frasePendiente, como hoy');
});

test('App · si la promesa del canje se rechaza (excepción), se trata como Portero lento: bloquea, reintenta y conserva la credencial', async () => {
  const h = appHarness();h.c.canjearConRelevo_ = async () => { throw new Error('boom'); };
  await h.c.loadIdentity();
  assert.equal(h.state.profileReady, false);assert.equal(h.timers.length, 1);assert.equal(h.localStorage.getItem('pyod_clave_v1'), 'tok-A');assert.equal(h.fake.calls.purgar, 0);
});

test('App · token_distinto del cargador = Portero lento (hoy «sin-respuesta»): bloquea y reintenta, sin golpes, sin purga y sin cierre', async () => {
  const h = appHarness({ cargador: { canjear: () => ({ ok: false, error: 'token_distinto', rechazo: false, origen: 'red', token: 'tok-A' }) } });
  await h.c.loadIdentity();
  assert.equal(h.state.profileReady, false);assert.equal(h.timers.length, 1);assert.equal(h.timers[0].ms, 15000);
  assert.equal(h.localStorage.getItem('yod_canje_fail'), null);assert.equal(h.fake.calls.purgar, 0);assert.equal(h.fake.calls.cerrar.length, 0);assert.equal(h.localStorage.getItem('pyod_clave_v1'), 'tok-A');
});

test('App · gracia de 5 min sólo para una identidad VIVA: la de copia vieja se oculta al primer fallo de ⟳', async () => {
  const viva = appHarness({ cargador: { canjear: () => ({ ok: false, error: 'red', rechazo: false, origen: 'sin_red', token: 'tok-A' }) } });
  viva.autoriza();await viva.c.loadIdentity();
  assert.equal(viva.state.profileReady, true, 'validada hace instantes: se conserva');assert.equal(viva.timers.length, 1);
  const vieja = appHarness({ cargador: { canjear: () => ({ ok: false, error: 'red', rechazo: false, origen: 'sin_red', token: 'tok-A' }) } });
  vieja.autoriza({ verifiedAt: Date.now() - 3 * 3600000 });await vieja.c.loadIdentity();
  assert.equal(vieja.state.profileReady, false, 'una identidad de copia con 3 h de edad no se mantiene sin red');
});

test('App · rechazo explícito del canje (revocado): bloquea, purga el cargador y a la tercera cierra con cerrar({token})', async () => {
  const h = appHarness({ cargador: { canjear: () => ({ ok: false, error: 'revocado', rechazo: true, origen: 'red', token: 'tok-A' }) } });
  await h.c.loadIdentity();await h.c.loadIdentity();
  assert.equal(h.state.profileReady, false);assert.equal(h.localStorage.getItem('yod_canje_fail'), '2');assert.equal(h.fake.calls.cerrar.length, 0);
  assert.equal(h.fake.calls.purgar, 2, 'cada rechazo vivo tira las copias guardadas');assert.equal(h.localStorage.getItem('pyod_clave_v1'), 'tok-A');
  await h.c.loadIdentity();
  assert.equal(J(h.fake.calls.cerrar), J([{ token: 'tok-A', motivo: 'rechazado' }]));assert.equal(h.reloads.length, 1);assert.equal(h.localStorage.getItem('yod_canje_fail'), null);
});

test('App · yodcargador:sesion-rechazada (revalidación en fondo) bloquea, purga y cuenta el golpe; al tercero cierra con cerrar({token})', async () => {
  const h = appHarness({ cargador: { canjear: () => sesionCache() } });
  h.c.suscribirCargador_();assert.equal(h.fake.suscrito, true);
  await h.c.loadIdentity();assert.equal(h.state.profileReady, true);
  h.node('finance-panel').innerHTML = 'dato privado';h.state.pulseCache.finance = { summary: {}, ep: 0 };
  h.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'tok-A' });
  assert.equal(h.state.profileReady, false);assert.equal(h.state.sessionToken, '');assert.equal(h.node('finance-panel').innerHTML, '');assert.equal(Object.keys(h.state.pulseCache).length, 0);
  assert.equal(h.localStorage.getItem('yod_canje_fail'), '1');assert.equal(h.fake.calls.purgar, 1);assert.equal(h.fake.calls.cerrar.length, 0);
  assert.equal(h.localStorage.getItem('pyod_clave_v1'), 'tok-A', 'el primer golpe no borra la credencial');
  h.localStorage.setItem('yod_canje_fail', '2');
  h.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'tok-A' });
  assert.equal(J(h.fake.calls.cerrar), J([{ token: 'tok-A', motivo: 'rechazado' }]));assert.equal(h.reloads.length, 1);
});

test('App · un rechazo de OTRO token, o un código que no es definitivo, no cuenta como golpe', async () => {
  const h = appHarness();h.c.suscribirCargador_();h.autoriza();
  h.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'otro' });
  assert.equal(h.state.profileReady, true, 'rechazo de otro token: se ignora');
  h.fake.emitir('yodcargador:sesion-rechazada', { error: 'sin_acceso', token: 'tok-A' });
  assert.equal(h.state.profileReady, false);assert.equal(h.localStorage.getItem('yod_canje_fail'), null, 'sin_acceso bloquea pero no suma golpes (como hoy)');
});

test('App · yodcargador:sesion con la misma identidad sólo rejuvenece verifiedAt; con otros permisos oculta lo anterior y pinta lo nuevo', async () => {
  const h = appHarness({ cargador: { canjear: () => sesionCache() } });
  h.c.suscribirCargador_();await h.c.loadIdentity();
  const antes = h.state.verifiedAt, bloqueos = h.blocks.length;
  h.fake.emitir('yodcargador:sesion', sesionRed({ nombre: 'Persona en caché' }));
  assert.ok(h.state.verifiedAt > antes, 'ya es verdad de ahora');assert.equal(h.blocks.length, bloqueos, 'sin cambio no se parpadea');
  h.fake.emitir('yodcargador:sesion', sesionRed({ boards: 'TA,FL', nombre: 'Persona en caché' }));
  assert.equal(h.blocks.length, bloqueos + 1, 'cambió qué puede ver: se oculta lo anterior');assert.equal(h.state.boards, 'TA,FL');assert.equal(h.applied.at(-1), 'Persona en caché');
  await asienta();assert.ok(h.loads.filter(x => x === 'datos:tok-A').length >= 2, 'y se recargan los datos con los permisos nuevos');
  const otro = h.blocks.length;h.fake.emitir('yodcargador:sesion', sesionRed({ boards: '*', token: 'otro' }));
  assert.equal(h.blocks.length, otro, 'el resultado de otro token no se aplica');
});

test('App · cerrarSesion con cargador cierra por cerrar({token,motivo}); sin cargador no lo toca', () => {
  const con = appHarness();con.c.cerrarSesion();
  assert.equal(J(con.fake.calls.cerrar), J([{ token: 'tok-A', motivo: 'salir' }]));assert.equal(con.localStorage.getItem('pyod_clave_v1'), null);assert.equal(con.reloads.length, 1);
  const sin = appHarness({ sinCargador: true });sin.c.cerrarSesion();
  assert.equal(sin.fake.calls.cerrar.length, 0);assert.equal(sin.localStorage.getItem('pyod_clave_v1'), null);
});

/* ── catálogo de la cabina ── */
const filaCatalogo = id => ({ system_id: id, visible: 'SI', orden: '1', titulo_portal: id });
const cuerpo = (rows, extra = {}) => ({ ok: true, actor: 'SESSION', rows, ...extra });

test('App · catálogo: pinta la copia ANTES de la red y nunca asoma CAT_RESPALDO si hay copia', async () => {
  const red = deferred();
  const h = appHarness({ cargador: { catalogo: o => { o.alViejo(cuerpo([filaCatalogo('SYS-GUARDADO')]), { edadMs: 7 * 60000 });return red.promise; } } });
  h.autoriza();h.node('yodTiempo').hidden = true;
  const cargando = h.c.loadCatalog();
  assert.equal(h.renders.length, 1, 'la copia se pintó sin esperar a la red');assert.equal(h.renders[0][0].system_id, 'SYS-GUARDADO');
  assert.match(h.node('updated-at').textContent, /Datos guardados hace 7 min · actualizando…/);
  assert.equal(h.fake.calls.primerDato.length, 1);assert.equal(h.fake.calls.primerDato[0], 'cache');
  assert.equal(h.node('yodTiempo').hidden, false);assert.match(h.node('yodTiempo').textContent, /^⏱ 1\.8 s · caché$/);
  red.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([filaCatalogo('SYS-FRESCO')]) });await cargando;
  assert.equal(h.renders.at(-1)[0].system_id, 'SYS-FRESCO');assert.ok(h.renders.every(r => r.every(x => x.system_id !== 'SYNTH-RESPALDO')));
  assert.equal(h.fake.calls.primerDato.length, 1, 'el primer dato se marca una sola vez');assert.deepEqual(h.conexion.at(-1), ['ok', 'En línea']);
  assert.equal(h.node('updated-at').textContent, 'Consultado a las 10:00');
});

test('App · catálogo: la red falla con copia → cache-fallback es ÉXITO silencioso (sin reintentos, sin respaldo)', async () => {
  const h = appHarness({ cargador: { catalogo: o => { o.alViejo(cuerpo([filaCatalogo('SYS-GUARDADO')]), { edadMs: 2 * 3600000 });
    return Promise.resolve({ ok: true, status: 200, origen: 'cache-fallback', data: cuerpo([filaCatalogo('SYS-GUARDADO')]) }); } } });
  h.autoriza();await h.c.loadCatalog();
  assert.equal(h.timers.length, 0, 'ningún reintento programado');assert.equal(h.state.catRetry || 0, 0);
  assert.ok(h.renders.every(r => r.every(x => x.system_id !== 'SYNTH-RESPALDO')));
  assert.match(h.node('updated-at').textContent, /^Sin conexión · datos guardados hace 2 horas$/);assert.deepEqual(h.conexion.at(-1), ['error', 'Sin conexión']);
});

test('App · catálogo: una copia FRESCA llega sin pasar por alViejo y su edad sale de la propia respuesta', async () => {
  const h = appHarness({ cargador: { catalogo: () => Promise.resolve({ ok: true, status: 200, origen: 'cache', edadMs: 4 * 60000, data: cuerpo([filaCatalogo('SYS-GUARDADO')]) }) } });
  h.autoriza();await h.c.loadCatalog();
  assert.equal(h.renders.length, 1);assert.equal(h.renders[0][0].system_id, 'SYS-GUARDADO');
  assert.equal(h.node('updated-at').textContent, 'Datos guardados hace 4 min');assert.deepEqual(h.conexion.at(-1), ['ok', 'En línea']);
  assert.equal(h.timers.length, 0);assert.equal(h.fake.calls.get.length, 0, 'una copia firmada con sesión no pide nada más');
  assert.equal(h.fake.calls.primerDato.length, 1, 'y cuenta como primer dato (de caché)');
});

test('App · catálogo: sin copia y con la red caída se comporta como hoy (reintento en fondo y respaldo curado)', async () => {
  const h = appHarness({ cargador: { catalogo: () => Promise.resolve({ ok: false, status: 0, origen: 'red', error: 'red' }) } });
  h.autoriza();await h.c.loadCatalog();
  assert.equal(h.timers.length, 1);assert.equal(h.timers[0].ms, 15000);assert.equal(h.state.catRetry, 1);
  assert.deepEqual(h.renders.at(-1).map(x => x.system_id), ['SYNTH-RESPALDO']);assert.equal(h.node('updated-at').textContent, 'Mostrando la lista de respaldo');
  assert.equal(h.fake.calls.primerDato.length, 0, 'el respaldo curado NO es primer dato real');
});

test('App · catálogo: PUBLIC, 403 o rechazo → catalogoSinAcceso (respaldo curado), sin reintentos', async () => {
  for (const respuesta of [
    { ok: true, status: 200, origen: 'red', data: { ok: true, actor: 'PUBLIC', rows: [filaCatalogo('SYNTH-PUBLICO')] } },
    { ok: false, status: 403, origen: 'red' },
    { ok: true, status: 200, origen: 'red', data: { ok: false, error: 'liga' } }
  ]) {
    const h = appHarness({ cargador: { catalogo: () => Promise.resolve(respuesta) } });
    h.autoriza();await h.c.loadCatalog();
    assert.deepEqual(h.renders.at(-1).map(x => x.system_id), ['SYNTH-RESPALDO']);assert.equal(h.timers.length, 0);assert.equal(h.node('updated-at').textContent, 'Lista de respaldo según tus permisos');
  }
});

test('App · catálogo: una copia firmada SIN sesión no se pinta y se pide una vez en vivo sin caché', async () => {
  const publica = cuerpo([filaCatalogo('SYNTH-PUBLICO')], { actor: 'PUBLIC' });
  const h = appHarness({ cargador: {
    catalogo: o => { o.alViejo(publica, { edadMs: 60000 });return Promise.resolve({ ok: true, status: 200, origen: 'cache', data: publica }); },
    get: () => Promise.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([filaCatalogo('SYS-FRESCO')]) } ) } });
  h.autoriza();await h.c.loadCatalog();
  assert.equal(h.fake.calls.get.length, 1);const [url, params, opts] = h.fake.calls.get[0];
  assert.equal(url, 'https://example.invalid/catalogo');assert.equal(J(params), J({ action: 'read', resource: 'Portal', k: 'tok-A' }));assert.equal(opts.viejoMs, 0);assert.equal(opts.frescoMs, 0);
  assert.deepEqual(h.renders.map(r => r[0].system_id), ['SYS-FRESCO'], 'la copia sin sesión jamás se pintó');
});

test('App · catálogo: la respuesta de una sesión anterior (token cambió) no se pinta, ni la copia ni la red', async () => {
  const red = deferred();
  const h = appHarness({ cargador: { catalogo: o => red.promise } });
  h.autoriza();const cargando = h.c.loadCatalog();
  h.localStorage.setItem('pyod_clave_v1', 'tok-B');
  red.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([filaCatalogo('SYS-VIEJO')]) });await cargando;
  assert.equal(h.renders.length, 0);assert.equal(h.state.loading, false, 'el finally libera el candado de carga');
});

test('App · catálogo: dedupe intacto (una segunda llamada en vuelo no repite la consulta)', async () => {
  const red = deferred();const h = appHarness({ cargador: { catalogo: () => red.promise } });
  h.autoriza();const a = h.c.loadCatalog(), b = h.c.loadCatalog();
  assert.equal(h.fake.calls.catalogo.length, 1);red.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([filaCatalogo('SYS-FRESCO')]) });await Promise.all([a, b]);
});

test('App · el rechazo en fondo llega con el catálogo en vuelo: lo que el cargador guarde después se vuelve a tirar', async () => {
  const red = deferred();const h = appHarness({ cargador: { catalogo: () => red.promise } });
  h.c.suscribirCargador_();h.autoriza();const cargando = h.c.loadCatalog();
  h.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'tok-A' });
  assert.equal(h.fake.calls.purgar, 1, 'la purga del rechazo');
  red.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([filaCatalogo('SYS-TARDE')]) });await cargando;
  assert.equal(h.fake.calls.purgar, 2, 'y otra cuando el cargador ya escribió su copia');assert.ok(h.renders.every(r => r.every(x => x.system_id !== 'SYS-TARDE')), 'nada de la respuesta tardía se pinta en una sesión rechazada');
  const limpio = appHarness({ cargador: { catalogo: () => Promise.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([filaCatalogo('SYS-OK')]) }) } });
  limpio.autoriza();await limpio.c.loadCatalog();assert.equal(limpio.fake.calls.purgar, 0, 'sin rechazo no se purga de más');
  const rev = appHarness({ cargador: { canjear: () => sesionRed() } });rev.c.suscribirCargador_();rev.autoriza();
  rev.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'tok-A' });assert.equal(rev.state.rechazadoEnFondo, 'tok-A');
  await rev.c.loadIdentity();assert.deepEqual(rev.applied, ['Persona en vivo']);assert.equal(rev.state.rechazadoEnFondo, '', 'una identidad validada de nuevo borra la marca');
});

test('App · el cargador recibe la BASE del catálogo una sola vez (config) y suscribe una sola vez', async () => {
  const h = appHarness();h.c.suscribirCargador_();h.c.suscribirCargador_();h.autoriza();await h.c.loadCatalog();await h.c.loadCatalog();
  assert.equal(J(h.fake.calls.config), J([{ catalogo: { url: 'https://example.invalid/catalogo' } }]));
  assert.ok(appSource.includes("var CATALOG_BASE=CATALOG_ENDPOINT.split('?')[0];"), 'CATALOG_BASE sale de CATALOG_ENDPOINT: una sola copia del id');
  assert.match(/var CATALOG_ENDPOINT='([^']+)'/.exec(appSource)[1], /\/exec\?action=read&resource=Portal$/, 'el valor legacy no cambió');
});

/* ── (d) camino viejo intacto ── */
test('App · sin cargador o con legacy:true: el camino de siempre y el cargador ni se toca', async () => {
  for (const variante of [{ sinCargador: true }, { cargador: { legacy: true } }]) {
    const h = appHarness(variante);
    assert.equal(h.c.cargadorActivo_(), false);
    const llamadas = [];h.c.canjearConRelevo_ = async t => { llamadas.push(t);return { ok: true, token: t, rol: 'vista', boards: 'TA', nombre: 'Legacy' }; };
    Object.assign(h.c, { AbortController, clearTimeout() {}, CATALOG_ENDPOINT: 'https://example.invalid/catalogo?action=read&resource=Portal',
      fetch: async () => ({ ok: true, status: 200, json: async () => cuerpo([filaCatalogo('SYS-LEGACY')]) }) });
    await h.c.loadIdentity();
    assert.equal(J(llamadas), J(['tok-A']));assert.equal(J(h.applied), J(['Legacy']));assert.equal(h.blocks.length, 1, 'el camino viejo bloquea ANTES del canje, siempre');
    assert.equal(h.fake.calls.canjear.length, 0);assert.equal(h.fake.calls.catalogo.length, 0);assert.equal(h.fake.calls.primerDato.length, 0);
  }
  const h = appHarness({ cargador: { legacy: true } });let pedido = '';
  Object.assign(h.c, { AbortController, CATALOG_ENDPOINT: 'https://example.invalid/catalogo?action=read&resource=Portal', clearTimeout() {},
    fetch: async url => { pedido = url;return { ok: true, status: 200, json: async () => cuerpo([filaCatalogo('SYS-LEGACY')]) }; } });
  h.autoriza();await h.c.loadCatalog();
  assert.match(pedido, /^https:\/\/example\.invalid\/catalogo\?action=read&resource=Portal&k=tok-A&cb=\d+$/);assert.equal(h.fake.calls.catalogo.length, 0);
  assert.equal(h.fake.calls.primerDato.length, 0);assert.equal(h.node('yodTiempo').textContent, '', 'el camino viejo no muestra el tiempo del primer dato');
});
test('App · canjearConRelevo_ con cargador delega en sesion.canjear y devuelve la misma forma', async () => {
  const h = appHarness({ cargador: { canjear: () => sesionRed() } });
  const r = await h.c.canjearConRelevo_('tok-A');
  assert.deepEqual([r.ok, r.token, r.rol, r.boards, r.nombre, r.correo], [true, 'tok-A', 'vista', 'TA', 'Persona en vivo', 'cache@example.invalid']);
  assert.equal(h.fake.calls.canjear[0].modo, 'cache-primero', 'sin sesión pintada, el canje puede salir de la copia');
  h.autoriza();await h.c.canjearConRelevo_('tok-A');assert.equal(h.fake.calls.canjear[1].modo, 'red', 'con la sesión ya pintada pide red');
  await h.c.canjearConRelevo_('tok-A', { fuerzaRed: false });assert.equal(h.fake.calls.canjear[2].modo, 'cache-primero', 'opts.fuerzaRed manda');
  const roto = appHarness({ cargador: { canjear: () => { throw new Error('boom'); } } });
  assert.equal((await roto.c.canjearConRelevo_('tok-A')).ok, false, 'un cargador que truena no rompe la cabina');
});

/* ── marco (os/shell.js) ── */
function shellHarness(o = {}) {
  const token = o.token || 'tok-A';
  const nodes = new Map(), canvas = element(), main = element(), applied = [], reloads = [], timers = [], navs = [];
  const node = id => { if (!nodes.has(id)) nodes.set(id, element());return nodes.get(id); };
  const localStorage = store(Object.assign({ pyod_clave_v1: token }, o.storage || {}));
  const fake = fakeCargador(o.cargador || {});
  const state = { role: '', boards: '', modules: [], identity: 'pending', catalogRows: null, catalogIds: null, identityRequest: 0, sessionToken: '', sessionIdentity: '', verifiedAt: 0, reconnectAttempts: 0, retryTimer: null };
  const win = {};if (!o.sinCargador) win.YodCargador = fake.cargador;
  const c = vm.createContext({
    state, localStorage, sessionStorage: store(), LSC: 'pyod_clave_v1', CATCACHE: 'yod_portal_cat_v1', CATIDS: 'yod_portal_cat_ids_v1', DATA_CACHES: { 'SYS-TAREAS': ['aurum-cache-v5'] },
    NAME: { 'SYS-TAREAS': 'MOAC' }, DEST: { 'SYS-TAREAS': 'https://example.invalid/moac/', 'SYS-FLUJO': 'https://example.invalid/flujo/' }, OS: 'https://example.invalid/os', currentSys: () => 'SYS-TAREAS',
    CATALOG_BASE: 'https://example.invalid/catalogo', PORTAL: 'https://example.invalid/catalogo?action=read&resource=Portal', window: win,
    document: { getElementById: node, querySelector: s => (s === '.yod-canvas' ? canvas : main) }, el: () => element(), esc: String,
    set: (id, value) => { node(id).textContent = value; }, pastilla(kind) { state.pastilla = kind; }, applyNav() { navs.push((state.catalogRows || []).map(r => r.system_id)); },
    canOpen: () => state.identity === 'ok' && (state.boards === 'TA' || state.boards === 'TA,FL' || state.role === 'admin'),
    location: { reload() { reloads.push(true); } },
    aplicaIdentidad(j) { state.role = j.rol;state.boards = j.boards;state.identity = 'ok';applied.push(j.nombre);c.maybeLock(); },
    setTimeout(f, ms) { timers.push({ f, ms });return timers.length; }, clearTimeout() {},
    writeCatIds(ids) { state.catalogIds = ids; }, writeCatCache(rows) { state.catalogRows = rows; }, readCatIds: () => state.catalogIds
  });
  vm.runInContext(['tok', 'rechazoAcceso', 'purgeCaches', 'purgeAll', 'maybeLock', 'cargadorActivo_', 'canjeConRelevo', 'canjeConCargador_', 'purgarCargador_', 'cerrarCargador_',
    'configurarCatalogo_', 'rechazoDefinitivo_', 'loadIdentity', 'loadIdentityConCargador_', 'sesionRefrescada_', 'sesionRechazada_', 'suscribirCargador_', 'aplicaCatalogo_',
    'loadCatalog', 'loadCatalogConCargador_', 'logout'].map(n => fn(shellSource, n)).join('\n'), c);
  return { c, state, fake, localStorage, applied, canvas, reloads, timers, navs, node };
}

test('Marco · identidad de copia guardada: abre el lienzo SIN esperar a la red (ni al catálogo ni a la revalidación)', async () => {
  const catalogo = deferred();
  const h = shellHarness({ cargador: { canjear: () => sesionCache(), catalogo: () => catalogo.promise } });
  let termino = false;const cargando = h.c.loadIdentity().then(() => { termino = true; });
  await asienta();
  assert.equal(h.state.identity, 'ok');assert.equal(h.canvas.style.display, '', 'tablero destrabado');assert.deepEqual(h.applied, ['Persona en caché']);
  assert.equal(termino, false, 'la promesa sigue esperando al catálogo, pero el tablero ya está abierto');
  assert.equal(h.fake.calls.canjear[0].modo, 'cache-primero');assert.ok(Date.now() - h.state.verifiedAt >= 3 * 3600000 - 1000, 'edad verdadera');
  catalogo.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([{ system_id: 'SYS-TAREAS', visible: 'SI', orden: '2' }, { system_id: 'SYS-FLUJO', visible: 'NO', orden: '1' }, { system_id: 'SYS-X', visible: 'SI', orden: '0' }]) });
  await cargando;
  assert.deepEqual(h.state.catalogRows.map(r => r.system_id), ['SYS-TAREAS'], 'sólo visible==="SI" y con destino conocido');
});

test('Marco · carga en frío con red: el lienzo se cierra mientras valida y se abre al llegar (como hoy)', async () => {
  const d = deferred();const h = shellHarness({ cargador: { canjear: () => d.promise } });
  const cargando = h.c.loadIdentity();await asienta();
  assert.equal(h.canvas.style.display, 'none');assert.equal(h.state.identity, 'pending');
  d.resolve(sesionRed());await cargando;assert.equal(h.state.identity, 'ok');assert.equal(h.canvas.style.display, '');
});

test('Marco · sesion ya confirmada (⟳) y reintentos piden red; la gracia de 5 min respeta la edad verdadera', async () => {
  const h = shellHarness({ cargador: { canjear: o => (o.modo === 'red' ? { ok: false, error: 'red', rechazo: false, origen: 'sin_red', token: 'tok-A' } : sesionCache({ edadMs: 2 * 60000 })) } });
  await h.c.loadIdentity();assert.equal(h.state.identity, 'ok');
  await h.c.loadIdentity();
  assert.deepEqual(h.fake.calls.canjear.map(x => x.modo), ['cache-primero', 'red']);
  assert.equal(h.state.identity, 'ok', 'copia de 2 min: aún dentro de la gracia');assert.equal(h.timers.length, 1);assert.equal(h.localStorage.getItem('pyod_clave_v1'), 'tok-A');
  const vieja = shellHarness({ cargador: { canjear: o => (o.modo === 'red' ? { ok: false, error: 'red', rechazo: false, origen: 'sin_red', token: 'tok-A' } : sesionCache({ edadMs: 3 * 3600000 })) } });
  await vieja.c.loadIdentity();await vieja.c.loadIdentity();
  assert.equal(vieja.state.identity, 'pending', 'copia de 3 h: sin gracia');assert.equal(vieja.canvas.style.display, 'none');
});

test('Marco · rechazo (en el canje o en fondo): cierra el lienzo, purga el cargador y NO borra la credencial (regla 5)', async () => {
  const vivo = shellHarness({ cargador: { canjear: () => ({ ok: false, error: 'revocado', rechazo: true, origen: 'red', token: 'tok-A' }) } });
  await vivo.c.loadIdentity();
  assert.equal(vivo.state.identity, 'fail');assert.equal(vivo.canvas.style.display, 'none');assert.equal(vivo.fake.calls.purgar, 1);
  assert.equal(vivo.localStorage.getItem('pyod_clave_v1'), 'tok-A');assert.equal(vivo.fake.calls.cerrar.length, 0);assert.equal(vivo.timers.length, 0);
  const fondo = shellHarness({ cargador: { canjear: () => sesionCache() } });
  fondo.c.suscribirCargador_();await fondo.c.loadIdentity();assert.equal(fondo.canvas.style.display, '');
  fondo.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'tok-A' });
  assert.equal(fondo.state.identity, 'fail');assert.equal(fondo.canvas.style.display, 'none');assert.equal(fondo.fake.calls.purgar, 1);
  assert.equal(fondo.localStorage.getItem('pyod_clave_v1'), 'tok-A', 'el marco no cierra la sesión de TODO el OS');assert.equal(fondo.fake.calls.cerrar.length, 0);
  const ajeno = shellHarness({ cargador: { canjear: () => sesionCache() } });ajeno.c.suscribirCargador_();await ajeno.c.loadIdentity();
  ajeno.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'otro' });assert.equal(ajeno.state.identity, 'ok');
});

test('Marco · el rechazo en fondo llega con el catálogo en vuelo: se vuelve a tirar lo que el cargador guarde después', async () => {
  const red = deferred();const h = shellHarness({ cargador: { canjear: () => sesionCache(), catalogo: () => red.promise } });
  h.c.suscribirCargador_();const cargando = h.c.loadIdentity();await asienta();
  assert.equal(h.state.identity, 'ok', 'la copia ya destrabó el tablero y el catálogo sigue en vuelo');
  h.fake.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'tok-A' });
  assert.equal(h.fake.calls.purgar, 1);assert.equal(h.state.identity, 'fail');
  red.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([{ system_id: 'SYS-TAREAS', visible: 'SI', orden: '1' }]) });await cargando;
  assert.equal(h.fake.calls.purgar, 2, 'segunda purga: el cargador acababa de guardar la copia de esa credencial');assert.equal(h.state.catalogRows, null, 'nada se pinta de una sesión rechazada');
  assert.equal(h.localStorage.getItem('pyod_clave_v1'), 'tok-A', 'regla 5: el marco no borra la credencial');
});

test('Marco · yodcargador:sesion con otros permisos oculta todo y recarga; con los mismos sólo rejuvenece', async () => {
  const h = shellHarness({ cargador: { canjear: () => sesionCache() } });
  h.c.suscribirCargador_();await h.c.loadIdentity();const antes = h.state.verifiedAt;
  h.fake.emitir('yodcargador:sesion', sesionRed({ nombre: 'Persona en caché' }));
  assert.ok(h.state.verifiedAt > antes);assert.equal(h.reloads.length, 0);assert.equal(h.state.identity, 'ok');
  h.fake.emitir('yodcargador:sesion', sesionRed({ boards: 'TA,FL', nombre: 'Persona en caché' }));
  assert.equal(h.reloads.length, 1);assert.equal(h.state.identity, 'pending');assert.equal(h.canvas.style.display, 'none');
});

test('Marco · menú: se pinta de la copia antes de la red; PUBLIC/403 → catálogo no disponible; la copia sin sesión no se pinta', async () => {
  const red = deferred();
  const h = shellHarness({ cargador: { canjear: () => sesionCache(), catalogo: o => { o.alViejo(cuerpo([{ system_id: 'SYS-TAREAS', visible: 'SI', orden: '1' }]), { edadMs: 60000 });return red.promise; } } });
  const cargando = h.c.loadIdentity();await asienta();
  assert.deepEqual(h.state.catalogRows.map(r => r.system_id), ['SYS-TAREAS'], 'menú pintado de la copia con la red todavía en vuelo');
  red.resolve({ ok: true, status: 200, origen: 'red', data: { ok: true, actor: 'PUBLIC', rows: [] } });await cargando;
  assert.equal(h.state.catalogRows, null);assert.equal(h.state.catalogUnavailable, true);assert.equal(h.state.identity, 'ok');assert.equal(h.canvas.style.display, '');
  const publica = cuerpo([{ system_id: 'SYS-TAREAS', visible: 'SI' }], { actor: 'PUBLIC' });
  const g = shellHarness({ cargador: { canjear: () => sesionCache(), catalogo: o => { o.alViejo(publica, {});return Promise.resolve({ ok: true, status: 200, origen: 'cache', data: publica }); },
    get: () => Promise.resolve({ ok: true, status: 200, origen: 'red', data: cuerpo([{ system_id: 'SYS-FLUJO', visible: 'SI', orden: '1' }]) }) } });
  await g.c.loadIdentity();
  assert.equal(g.fake.calls.get.length, 1);assert.equal(g.fake.calls.get[0][2].viejoMs, 0);assert.deepEqual(g.state.catalogRows.map(r => r.system_id), ['SYS-FLUJO']);
  const f = shellHarness({ cargador: { canjear: () => sesionCache(), catalogo: () => Promise.resolve({ ok: false, status: 403, origen: 'red' }) } });
  await f.c.loadIdentity();assert.equal(f.state.catalogUnavailable, true);assert.equal(f.state.identity, 'ok');
});

test('Marco · si el cargador truena al pedir el catálogo, la identidad y el lienzo NO se caen', async () => {
  const h = shellHarness({ cargador: { canjear: () => sesionCache(), catalogo: () => { throw new Error('boom'); } } });
  await h.c.loadIdentity();
  assert.equal(h.state.identity, 'ok');assert.equal(h.canvas.style.display, '');assert.equal(h.timers.length, 0);assert.equal(h.fake.calls.purgar, 0);
});

test('Marco · logout cierra por cerrar({token,motivo}); sin cargador (o legacy) el camino de siempre y el cargador no se toca', async () => {
  const con = shellHarness();con.c.logout();
  assert.equal(J(con.fake.calls.cerrar), J([{ token: 'tok-A', motivo: 'salir' }]));assert.equal(con.localStorage.getItem('pyod_clave_v1'), null, 'la salida deliberada sí borra la credencial');
  for (const variante of [{ sinCargador: true }, { cargador: { legacy: true } }]) {
    const h = shellHarness(variante);assert.equal(h.c.cargadorActivo_(), false);
    let llamado = 0;h.c.canjeConRelevo = async t => { llamado++;return { ok: true, token: t, rol: 'vista', boards: 'TA', nombre: 'Legacy' }; };
    h.c.fetch = async () => ({ ok: true, status: 200, json: async () => cuerpo([{ system_id: 'SYS-TAREAS', visible: 'SI', orden: '1' }]) });
    await h.c.loadIdentity();
    assert.equal(llamado, 1);assert.equal(J(h.applied), J(['Legacy']));assert.equal(h.fake.calls.canjear.length, 0);assert.equal(h.fake.calls.catalogo.length, 0);
    if (variante.sinCargador) { h.c.logout();assert.equal(h.fake.calls.cerrar.length, 0); }
  }
});

/* ── chinche después del primer dato ── */
test('Cabina · la chinche es una etiqueta inerte gobernada por versiones.cjs y un decisor la carga después del primer dato', async () => {
  const tag = /<script type="text\/plain" id="yodChincheSrc" src="(\.\.\/chinche\.js\?v=[^"]+)"><\/script>/.exec(indexHtml);
  assert.ok(tag, 'etiqueta inerte con id yodChincheSrc');
  const inline = indexHtml.slice(indexHtml.indexOf(tag[0]) + tag[0].length).match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(indexHtml, /<script src="\.\.\/chinche\.js/, 'ya no se baja de forma síncrona');
  function corre(cargador, rechaza = false) {
    const llamadas = [], inits = [], listeners = {}, cd = deferred();
    const ctx = vm.createContext({ document: { getElementById: id => (id === 'yodChincheSrc' ? { getAttribute: () => tag[1] } : null), createElement: () => ({}),
      body: { appendChild: s => { llamadas.push(['directo', s.src]);ctx.YODChinche = { init: o => inits.push(J(o)) };s.onload(); } } } });
    ctx.window = ctx;
    if (cargador) ctx.YodCargador = { v: '1', legacy: Boolean(cargador.legacy), cargarDespues: (src, o) => { llamadas.push(['cargarDespues', src, J(o)]);return rechaza ? Promise.reject(new Error('x')) : cd.promise; } };
    vm.runInContext(inline, ctx);
    return { llamadas, inits, cd, ctx, listeners, elemento: { addEventListener(n, f) { listeners[n] = f; } } };
  }
  const sin = corre(null);
  assert.equal(J(sin.llamadas), J([['directo', tag[1]]]));assert.equal(J(sin.inits), J(['{"pantalla":"os"}']));
  const legacy = corre({ legacy: true });assert.equal(J(legacy.llamadas), J([['directo', tag[1]]]));assert.equal(legacy.inits.length, 1);
  const activo = corre({});
  assert.equal(J(activo.llamadas), J([['cargarDespues', tag[1], '{"cuando":"primer-dato","maxMs":4000}']]));assert.equal(activo.inits.length, 0, 'todavía no: espera al primer dato');
  activo.cd.resolve(activo.elemento);await asienta();
  activo.ctx.YODChinche = { init: o => activo.inits.push(J(o)) };activo.listeners.load();
  assert.equal(J(activo.inits), J(['{"pantalla":"os"}']));activo.listeners.load();assert.equal(activo.inits.length, 1, 'init una sola vez');
  const cae = corre({}, true);await asienta();
  assert.equal(J(cae.llamadas.map(x => x[0])), J(['cargarDespues', 'directo']), 'si el cargador falla, se inserta en el acto como siempre');assert.equal(cae.inits.length, 1);
});

test('Marco · cargarChinche con cargador la inserta después del primer dato (y su onload corre al cargar); sin cargador, en el acto', async () => {
  function corre(conCargador, rechaza = false) {
    const cabeza = [], inits = [], listeners = {}, llamadas = [], cd = deferred();
    const ctx = vm.createContext({ SELF: 'https://example.invalid/os/shell.js', CHINCHE_V: 'T-1', location: { pathname: '/tablero.html' },
      document: { addEventListener() {}, title: 'Tablero', head: { appendChild: s => cabeza.push(s) }, createElement: () => ({}) } });
    ctx.window = ctx;
    if (conCargador) ctx.YodCargador = { v: '1', legacy: false, cargarDespues: (src, o) => { llamadas.push([src, J(o)]);return rechaza ? Promise.reject(new Error('x')) : cd.promise; } };
    vm.runInContext(['cargadorActivo_', 'cargarChinche', 'insertarDespues_'].map(n => fn(shellSource, n)).join('\n'), ctx);
    ctx.cargarChinche();
    return { cabeza, inits, llamadas, cd, ctx, listeners };
  }
  const sin = corre(false);
  assert.equal(sin.cabeza.length, 1);assert.equal(sin.cabeza[0].src, 'https://example.invalid/chinche.js?v=T-1');
  const act = corre(true);
  assert.equal(act.cabeza.length, 0, 'no compite con el primer dato');
  assert.equal(J(act.llamadas), J([['https://example.invalid/chinche.js?v=T-1', '{"cuando":"primer-dato","maxMs":4000}']]));
  act.cd.resolve({ addEventListener(n, f) { act.listeners[n] = f; } });await asienta();
  act.ctx.YODChinche = { init: o => act.inits.push(o) };act.listeners.load();
  assert.equal(act.inits.length, 1);assert.equal(act.inits[0].pantalla, 'tablero');act.listeners.load();assert.equal(act.inits.length, 1);
  const cae = corre(true, true);await asienta();
  assert.equal(cae.cabeza.length, 1, 'si el cargador falla, se inserta en el acto como siempre');
});

/* ── os/index.html ── */
test('os/index.html carga yod-cargador.js justo después de yod-acceso.js y con la misma etiqueta ?v=', () => {
  const m = /<script src="yod-acceso\.js\?v=([^"]+)"><\/script>\s*<script src="yod-cargador\.js\?v=([^"]+)"><\/script>/.exec(indexHtml);
  assert.ok(m, 'yod-cargador.js va inmediatamente después de yod-acceso.js');assert.equal(m[1], m[2]);
  assert.ok(indexHtml.indexOf('yod-cargador.js') < indexHtml.indexOf('app.js'), 'antes del código propio de la cabina');
  assert.match(indexHtml, /<small id="yodTiempo"[^>]*\bhidden\b[^>]*><\/small>/, 'sitio discreto para el tiempo del primer dato');
});

test('T-102 no inventa direcciones: el id del catálogo vive en UN solo literal por archivo y el HTML no trae ninguno', () => {
  assert.equal((appSource.match(/AKfycby5LKYK/g) || []).length, 1, 'en os/app.js');
  assert.equal((shellSource.match(/AKfycby5LKYK/g) || []).length, 1, 'en os/shell.js');
  assert.equal((indexHtml.match(/AKfy/g) || []).length, 0, 'en os/index.html');
});
