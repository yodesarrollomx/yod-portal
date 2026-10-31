'use strict';
/* T-203 (Fase 1 «Un cargador», entrega 2) · obra.html adopta el cargador compartido (os/yod-cargador.js).
   El <script> en línea de obra.html es una IIFE sin exports: aquí se CORTA POR TEXTO (funciones de columna 0) y corre en un
   vm con fetch, localStorage, timers y DOM de mentira. Con cargador de mentira (el contrato: sesion.canjear, get,
   telemetria.primerDato) salvo UNA prueba contra el cargador real. Ninguna petición real; hosts .invalid y tokens sintéticos.
   Lo que se vigila: canje compartido (sin respaldo y sin borrar pyod_clave_v1), pedir() sin caché, arranque en paralelo,
   telemetría de primer dato, y que escribir (mandar) siga sin pasar por el cargador. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crearCargador = require('../os/yod-cargador.js');
const ETIQUETA = require('../os/versiones.json').propia;   // la gobierna scripts/versiones.cjs --aplicar

const html = fs.readFileSync(require.resolve('../obra.html'), 'utf8');
const guion = /<script>\n\(function\(\)\{\n"use strict";\n([\s\S]*?)\n\}\)\(\);\n<\/script>/.exec(html);
assert.ok(guion, 'obra.html: <script> en línea con su IIFE');
const SRC = guion[1];
const politica = (() => { const caja = vm.createContext({}); vm.runInContext(fs.readFileSync(require.resolve('../os/access-policy.js'), 'utf8'), caja); return caja.YodAccessPolicy; })();

const TOK = 'sy-prueba-obra-0000000000000001';
const TECLEADA = 'sy-prueba-obra-0000000000000002';
const ORIGINAL = 'https://portero.invalid/exec';
const RESPALDO = 'https://respaldo.invalid/exec';
const J = x => JSON.stringify(x);                       // lo creado dentro del vm tiene otro prototipo: se compara por JSON
const asentar = (n = 4) => { let p = Promise.resolve(); for (let i = 0; i < n; i++) p = p.then(() => new Promise(r => setImmediate(r))); return p; };
function diferido() { let ok, no; const promesa = new Promise((a, b) => { ok = a; no = b; }); return { promesa, ok, no }; }

/* ── cortes por texto ── */
function linea(prefijo) {
  const m = new RegExp('^' + prefijo.replace(/[$.*+?^{}()|[\]\\]/g, '\\$&') + '.*$', 'm').exec(SRC);
  assert.ok(m, 'línea «' + prefijo + '» en obra.html');
  return m[0];
}
function corte(nombre) {
  const m = new RegExp('^(?:async )?function ' + nombre + '\\(|^const ' + nombre + '=', 'm').exec(SRC);
  assert.ok(m, nombre + ' existe en obra.html');
  const resto = SRC.slice(m.index), primera = resto.slice(0, resto.indexOf('\n'));
  if (/^const /.test(primera) || primera.endsWith('}')) return primera;                  // una sola línea
  const fin = /^}\s*$/m.exec(resto);
  assert.ok(fin, nombre + ' tiene cierre en columna 0');
  return resto.slice(0, fin.index + fin[0].length);
}
const CABECERA = ['const GAS=', 'const LSK=', 'const PORTERO_ORIGINAL=', 'let K=', 'const $=', 'let P=null'].map(linea);
const GAS = /const GAS="([^"]+)"/.exec(SRC)[1];
const FUNCIONES = ['razon', 'cargadorActivo', 'pedir', 'mandar', 'mandarOGuardar', 'canjearDirecto', 'llaveGuardada', 'canjear', 'sesion', 'mensajeGate', 'entrar', 'primerDato', 'abrir', 'cargar', 'cargarProd', 'arrancar'];

/* ── el mundo de mentira ── */
function nodo() {
  const clases = new Set();
  return { clases, classList: { add: c => clases.add(c), remove: c => clases.delete(c), contains: c => clases.has(c) }, style: {}, textContent: '', hidden: false, disabled: false, value: '' };
}
function cargadorFalso(o = {}) {
  const llamadas = { canjear: [], get: [], primerDato: [] };
  return {
    llamadas,
    cargador: {
      v: o.v === undefined ? '1' : o.v, legacy: Boolean(o.legacy),
      sesion: { canjear: async (...a) => { llamadas.canjear.push(a); if (o.canjear instanceof Error) throw o.canjear; return typeof o.canjear === 'function' ? o.canjear(...a) : o.canjear; } },
      get: (...a) => { llamadas.get.push(a); return typeof o.get === 'function' ? o.get(...a) : Promise.resolve(o.get); },
      telemetria: { primerDato: (...a) => { llamadas.primerDato.push(a); if (o.primerDato instanceof Error) throw o.primerDato; return true; } }
    }
  };
}
const SESION_OK = { ok: true, rol: 'vista', boards: 'OB', nombre: 'Persona de prueba', correo: 'persona@prueba.invalid', origen: 'cache', edadMs: 3600000, token: TOK };
const BOARD = { ok: true, kpi: { avance: 0.5 }, roles: [] };
const PRODUCCION = { ok: true, kpi: { frenos: 0 }, restricciones: [] };
const exito = data => ({ ok: true, status: 200, data, origen: 'red', ms: 5 });
const motorDice = error => ({ ok: false, status: 200, data: { ok: false, error }, error, rechazo: ['clave', 'liga', 'revocado'].includes(error), origen: 'red', ms: 5 });
const sinRed = error => ({ ok: false, status: 0, error, rechazo: false, origen: 'sin_red', ms: 5 });
const datos = recurso => (recurso === 'board' ? BOARD : PRODUCCION);

function respuesta(cuerpo) {
  const texto = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
  return { ok: true, status: 200, text: async () => texto, json: async () => JSON.parse(texto) };
}

function montar(op = {}) {
  const guardado = new Map(Object.entries(op.storage === undefined ? { pyod_clave_v1: TOK } : op.storage));
  const escrituras = [], borrados = [], urls = [], opciones = [], esperas = [], pintados = [], drenos = [], bitacora = [];
  const localStorage = {
    getItem: k => (guardado.has(k) ? guardado.get(k) : null),
    setItem: (k, v) => { escrituras.push(k); bitacora.push('set:' + k); guardado.set(k, String(v)); },
    removeItem: k => { borrados.push(k); guardado.delete(k); },
    key: i => [...guardado.keys()][i] ?? null,
    get length() { return guardado.size; }
  };
  const nodos = new Map();
  const cola = (op.fetch || []).slice();
  const fetchFalso = async (url, opt) => {
    urls.push(url); opciones.push(opt); bitacora.push('fetch:' + url.split('?')[0].replace(GAS, 'GAS').replace(ORIGINAL, 'PORTERO'));
    const x = cola.length ? cola.shift() : op.defecto;
    if (x === undefined) throw new TypeError('sin respuesta programada');
    if (x instanceof Error) throw x;
    if (typeof x === 'function') return x(url, opt);
    if (x && x.pendiente) return x.pendiente.promesa;
    if (x && x.html !== undefined) return { ok: true, status: 200, text: async () => x.html, json: async () => { throw new SyntaxError('no es JSON'); } };
    return respuesta(x);
  };
  const falso = op.cargador ? cargadorFalso(op.cargador) : null;
  const window = { YOD_PORTERO: { original: ORIGINAL, respaldo: RESPALDO }, YodAccessPolicy: politica };
  if (falso) window.YodCargador = falso.cargador;
  if (op.real) window.YodCargador = op.real({ localStorage, fetch: fetchFalso });
  const ctx = vm.createContext({
    window, localStorage, fetch: fetchFalso, URLSearchParams, Date,
    document: { querySelector: s => { if (!nodos.has(s)) nodos.set(s, nodo()); return nodos.get(s); } },
    setTimeout: (f, ms) => { esperas.push(ms); f(); return 0; },
    navigator: { onLine: true },
    pintar: () => { pintados.push(1); bitacora.push('pintar'); },
    drenarCola: async () => { drenos.push(1); }
  });
  vm.runInContext([...CABECERA, ...FUNCIONES.map(corte)].join('\n'), ctx);
  return {
    ctx, ev: expr => vm.runInContext(expr, ctx), nodo: s => ctx.document.querySelector(s), falso, guardado, escrituras, borrados, urls, opciones, esperas, pintados, drenos, bitacora, window,
    get cargador() { return falso; }
  };
}
const aGet = (h, i = 0) => ({ url: h.falso.llamadas.get[i][0], params: h.falso.llamadas.get[i][1], opts: h.falso.llamadas.get[i][2] });

/* ═════════ estáticas ═════════ */
test('obra.html carga yod-cargador.js justo después de yod-acceso.js, con la misma etiqueta ?v= y antes del código propio', () => {
  const m = /<script src="os\/yod-acceso\.js\?v=([^"]+)"><\/script>\s*<script src="os\/yod-cargador\.js\?v=([^"]+)"><\/script>\s*<meta charset/.exec(html);
  assert.ok(m, 'yod-cargador.js va inmediatamente después de yod-acceso.js');
  assert.equal(m[1], m[2]);assert.equal(m[2], ETIQUETA, 'la etiqueta la gobierna os/versiones.json');
  assert.ok(html.indexOf('os/yod-cargador.js') < html.indexOf('<script>\n(function(){'), 'antes del código propio de la página');
});

test('obra.html conserva el literal const GAS="…" (lo exige verify-obra-app), no estrena ids AKfy… y no nombra el respaldo', () => {
  assert.match(html, /const GAS="https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec"/);
  assert.equal((html.match(/AKfy/g) || []).length, 1, 'el único id es el del motor de obra');
  assert.doesNotMatch(SRC, /PORTERO_RESPALDO|\.respaldo\b/, 'ni una referencia al respaldo, ni en el código ni en los comentarios (sólo se nombra la palabra)');
});

test('regla 5: obra.html jamás borra pyod_clave_v1 (ni removeItem de la llave, ni clear)', () => {
  assert.doesNotMatch(html, /removeItem\(\s*(?:LSK|["']pyod_clave_v1["'])/);
  assert.doesNotMatch(html, /localStorage\.clear\(/);
});

test('escribir no pasa por el cargador (es de sólo lectura): mandar, mandarOGuardar y drenarCola no lo nombran y mandar sigue haciendo POST directo', () => {
  for (const n of ['mandar', 'mandarOGuardar', 'drenarCola']) assert.doesNotMatch(corte(n), /YodCargador/, n);
  assert.match(corte('mandar'), /fetch\(GAS,\{method:"POST",body:JSON\.stringify\(Object\.assign\(\{k:K\},cuerpo\)\)\}\)/);
});

test('cargadorActivo(): sólo con window.YodCargador presente, con versión y sin legacy', () => {
  const casos = [[undefined, false], [{ v: '1', legacy: false }, true], [{ v: '2', legacy: false }, true], [{ v: '1', legacy: true }, false], [{ legacy: false }, false], [{ v: '', legacy: false }, false]];
  for (const [cargador, esperado] of casos) {
    const h = montar();h.window.YodCargador = cargador;
    assert.equal(h.ev('cargadorActivo()'), esperado, J(cargador));
  }
});

/* ═════════ canje · con cargador ═════════ */
test('canjear() con cargador usa sesion.canjear() (la sesión compartida con la cabina) y devuelve la misma forma, sin fetch propio', async () => {
  const h = montar({ cargador: { canjear: () => SESION_OK } });
  const r = await h.ev('canjear()');
  assert.equal(r.ok, true);assert.deepEqual([r.rol, r.boards, r.nombre, r.correo], ['vista', 'OB', 'Persona de prueba', 'persona@prueba.invalid']);
  assert.equal(h.falso.llamadas.canjear.length, 1);assert.equal(h.urls.length, 0, 'ni un fetch propio: ni al original ni al respaldo');
  await h.ev('sesion()');
  assert.equal(h.ev('SES.boards'), 'OB');assert.equal(h.ev('SES.rol'), 'vista');assert.equal(h.ev('SES.nombre'), 'Persona de prueba');
});

test('sesion(): fail-closed igual que hoy — sin canje «sesion», sin el código OB «sinOB», con OB (o rol admin) pasa', async () => {
  const sin = montar({ cargador: { canjear: () => ({ ok: false, error: 'revocado', rechazo: true, origen: 'red', token: TOK }) } });
  await assert.rejects(sin.ev('sesion()'), e => { assert.equal(e, 'sesion'); return true; });
  const sinOB = montar({ cargador: { canjear: () => ({ ...SESION_OK, boards: 'TA,FL' }) } });
  await assert.rejects(sinOB.ev('sesion()'), e => { assert.equal(e, 'sinOB'); return true; });
  const admin = montar({ cargador: { canjear: () => ({ ...SESION_OK, rol: 'admin', boards: '' }) } });
  await admin.ev('sesion()');assert.equal(admin.ev('SES.rol'), 'admin');
  const comodin = montar({ cargador: { canjear: () => ({ ...SESION_OK, boards: '*' }) } });
  await comodin.ev('sesion()');assert.equal(comodin.ev('SES.boards'), '*');
  assert.match(sin.ev('mensajeGate("sesion")'), /No pudimos validar tu sesión con el Portero/);
  assert.match(sinOB.ev('mensajeGate("sinOB")'), /Obra no está en tus accesos/);
});

test('canjear() con cargador: rechazo (revocado, clave, liga, expirado, sin_sesion) → null y NUNCA toca pyod_clave_v1; un cargador que truena también es null', async () => {
  for (const error of ['revocado', 'clave', 'liga', 'expirado', 'sin_sesion']) {
    const h = montar({ cargador: { canjear: () => ({ ok: false, error, rechazo: true, origen: 'red', token: TOK }) } });
    assert.equal(await h.ev('canjear()'), null, error);
    await assert.rejects(h.ev('sesion()'), e => e === 'sesion');
    assert.equal(h.guardado.get('pyod_clave_v1'), TOK, 'la llave sigue ahí: es la sesión de TODO el OS');
    assert.deepEqual(h.borrados, []);assert.deepEqual(h.escrituras, []);assert.equal(h.urls.length, 0);
  }
  for (const falla of [{ ok: false, error: 'timeout', rechazo: false, origen: 'sin_red', token: TOK }, { ok: false, error: 'token_distinto', rechazo: false }, undefined, null, 'basura']) {
    const h = montar({ cargador: { canjear: () => falla } });
    assert.equal(await h.ev('canjear()'), null, J(falla));assert.equal(h.guardado.get('pyod_clave_v1'), TOK);
  }
  const truena = montar({ cargador: { canjear: new Error('boom') } });
  assert.equal(await truena.ev('canjear()'), null);assert.equal(truena.guardado.get('pyod_clave_v1'), TOK);
});

test('canjear() con cargador: la llave tecleada en el candado (aún no guardada) se canjea directa y nunca se cambia por la guardada', async () => {
  const h = montar({ cargador: { canjear: () => SESION_OK }, fetch: [{ ok: true, token: TECLEADA, rol: 'vista', boards: 'OB', nombre: 'Tecleada' }] });
  h.ev('K=' + J(TECLEADA));
  const r = await h.ev('canjear()');
  assert.equal(r.nombre, 'Tecleada');assert.equal(h.falso.llamadas.canjear.length, 0, 'el cargador canjea la llave GUARDADA, que no es la tecleada');
  assert.deepEqual(h.urls, [ORIGINAL + '?recurso=canje&t=' + TECLEADA]);
  h.ev('K=' + J(TOK));await h.ev('canjear()');
  assert.equal(h.falso.llamadas.canjear.length, 1, 'con K igual a la guardada sí es el canje compartido');
});

test('canjear() con cargador pero legacy:true (o sin cargador): camino directo; el cargador ni se toca', async () => {
  for (const variante of [{ cargador: { legacy: true, canjear: () => SESION_OK } }, {}]) {
    const h = montar({ ...variante, fetch: [{ ok: true, token: TOK, rol: 'vista', boards: 'OB', nombre: 'Directo' }] });
    const r = await h.ev('canjear()');
    assert.equal(r.nombre, 'Directo');assert.deepEqual(h.urls, [ORIGINAL + '?recurso=canje&t=' + TOK]);
    if (h.falso) assert.equal(h.falso.llamadas.canjear.length + h.falso.llamadas.get.length + h.falso.llamadas.primerDato.length, 0);
  }
});

/* ═════════ canje · legacy (T-203: se corrige el defecto del respaldo) ═════════ */
test('legacy: un rechazo explícito ({ok:false}) es concluyente — una llamada, sin espera de 1.5 s, jamás el respaldo', async () => {
  for (const rechazo of [{ ok: false, error: 'revocado' }, { ok: false, error: 'clave' }, { ok: false, error: 'servidor' }, { ok: false }]) {
    const h = montar({ fetch: [rechazo, { ok: true, token: TOK, rol: 'admin', boards: '*' }] });
    assert.equal(await h.ev('canjear()'), null, J(rechazo));
    assert.equal(h.urls.length, 1, 'el OK que sigue en la cola era la trampa de un reintento: nadie lo pidió');
    assert.deepEqual(h.esperas, []);assert.ok(h.urls.every(u => u.startsWith(ORIGINAL + '?')));
    assert.equal(h.guardado.get('pyod_clave_v1'), TOK);assert.deepEqual(h.borrados, []);
  }
  const cierra = montar({ fetch: [{ ok: false, error: 'revocado' }] });
  await assert.rejects(cierra.ev('sesion()'), e => e === 'sesion', 'sin canje válido, sesion() cierra el candado');
  assert.equal(cierra.urls.length, 1);
});

test('legacy: caída de transporte (fetch que lanza) → segundo intento al ORIGINAL tras 1.5 s, nunca al respaldo', async () => {
  const h = montar({ fetch: [new TypeError('Failed to fetch'), { ok: true, token: TOK, rol: 'vista', boards: 'OB', nombre: 'Recuperado' }] });
  const r = await h.ev('canjear()');
  assert.equal(r.nombre, 'Recuperado');
  assert.deepEqual(h.urls, [ORIGINAL + '?recurso=canje&t=' + TOK, ORIGINAL + '?recurso=canje&t=' + TOK]);assert.deepEqual(h.esperas, [1500]);
  assert.ok(h.urls.every(u => !u.startsWith(RESPALDO)));
  assert.deepEqual(h.opciones.map(o => J(o)), [J({ cache: 'no-store', credentials: 'omit' }), J({ cache: 'no-store', credentials: 'omit' })]);
});

test('legacy: JSON ilegible (HTML de error, cuerpo vacío, "null", un número) también cuenta como caída de transporte', async () => {
  for (const ilegible of ['<html>502 Bad Gateway</html>', '', 'null', '42']) {
    const h = montar({ fetch: [{ html: ilegible }, { ok: true, token: TOK, rol: 'vista', boards: 'OB' }] });
    assert.equal((await h.ev('canjear()')).ok, true, J(ilegible));
    assert.equal(h.urls.length, 2);assert.deepEqual(h.esperas, [1500]);assert.ok(h.urls.every(u => u.startsWith(ORIGINAL + '?')));
  }
});

test('legacy: dos caídas → null (sesión por validar); exactamente dos llamadas, ambas al original; la llave guardada intacta', async () => {
  for (const segunda of [new TypeError('offline'), { html: '<html>' }]) {
    const h = montar({ fetch: [new TypeError('offline'), segunda] });
    assert.equal(await h.ev('canjear()'), null);
    assert.equal(h.urls.length, 2);assert.ok(h.urls.every(u => u.startsWith(ORIGINAL + '?')));assert.deepEqual(h.esperas, [1500]);
    assert.equal(h.guardado.get('pyod_clave_v1'), TOK);assert.deepEqual(h.borrados, []);
  }
  const rechazoTardio = montar({ fetch: [new TypeError('offline'), { ok: false, error: 'revocado' }] });
  assert.equal(await rechazoTardio.ev('canjear()'), null, 'el rechazo del original en el segundo intento también es null');
  assert.equal(rechazoTardio.urls.length, 2);
});

test('legacy: éxito a la primera → una sola llamada y ninguna espera', async () => {
  const h = montar({ fetch: [{ ok: true, token: TOK, rol: 'vista', boards: 'OB', nombre: 'A la primera' }] });
  assert.equal((await h.ev('canjear()')).nombre, 'A la primera');assert.equal(h.urls.length, 1);assert.deepEqual(h.esperas, []);
});

/* ═════════ pedir ═════════ */
test('pedir() con cargador: get(GAS, {recurso, k}, {timeoutMs:45000, reintentos:1}) SIN caché (ni viejoMs ni frescoMs ni alViejo) y devuelve el JSON', async () => {
  const h = montar({ cargador: { get: (url, params) => exito(datos(params.recurso)) } });
  const j = await h.ev('pedir("board")');
  assert.equal(J(j), J(BOARD));assert.equal(h.urls.length, 0, 'ningún fetch propio');
  const { url, params, opts } = aGet(h);
  assert.equal(url, GAS);assert.equal(J(params), J({ recurso: 'board', k: TOK }));assert.equal(J(opts), J({ timeoutMs: 45000, reintentos: 1 }));
  for (const prohibida of ['viejoMs', 'frescoMs', 'alViejo', 'clave', 'telemetria']) assert.ok(!(prohibida in opts), 'Obra autoriza pagos: nada de copias viejas (' + prohibida + ')');
  assert.ok(!('cb' in params), 'el cb=Date.now() ya no hace falta: el cargador pide con cache:no-store');
});

test('pedir() con cargador: «extra» (cadena &a=b) se parsea con URLSearchParams; recurso y k mandan sobre un extra repetido; el primero de un extra repetido gana', async () => {
  const h = montar({ cargador: { get: () => exito({ ok: true }) } });
  await h.ev('pedir("board","&semana=2026-10&frente=C%201%20Norte&vacio=")');
  await h.ev('pedir("board","&k=otra&recurso=otro&a=1&a=2")');
  await h.ev('pedir("produccion","?x=1")');
  await h.ev('pedir("produccion","")');
  await h.ev('pedir("produccion")');
  const p = i => aGet(h, i).params;
  assert.equal(J(p(0)), J({ recurso: 'board', k: TOK, semana: '2026-10', frente: 'C 1 Norte', vacio: '' }));
  assert.equal(J(p(1)), J({ recurso: 'board', k: TOK, a: '1' }));
  assert.equal(J(p(2)), J({ recurso: 'produccion', k: TOK, x: '1' }));
  assert.equal(J(p(3)), J({ recurso: 'produccion', k: TOK }));assert.equal(J(p(4)), J({ recurso: 'produccion', k: TOK }));
});

test('pedir() con cargador: mismo contrato de salida — j si j.ok; si no, throw (j.error||"error"); transporte → throw "red"', async () => {
  const lanza = async (resp) => { const h = montar({ cargador: { get: () => resp } }); try { await h.ev('pedir("board")'); } catch (e) { return e; } return 'NO LANZÓ'; };
  assert.equal(await lanza(motorDice('clave')), 'clave');
  assert.equal(await lanza(motorDice('liga')), 'liga');
  assert.equal(await lanza(motorDice('sin_acceso')), 'sin_acceso');
  assert.equal(await lanza({ ok: false, status: 200, data: { ok: false }, error: 'servidor', origen: 'red' }), 'error', 'ok:false sin error → «error», como hoy');
  assert.equal(await lanza(exito({})), 'error', 'cuerpo 200 sin ok → «error»');
  assert.equal(await lanza(exito({ error: 'rara' })), 'rara');
  assert.equal(await lanza(exito({ ok: 0, error: 'cero' })), 'cero');
  for (const e of ['red', 'timeout', 'http', 'formato', 'http 401', 'http 403']) assert.equal(await lanza(sinRed(e)), 'red', e);
  assert.equal(await lanza({ ok: false, status: 403, error: 'http 403', rechazo: true, origen: 'red' }), 'red', 'un 403 de la infraestructura no trae cuerpo: es «red», igual que el SyntaxError de hoy');
  assert.equal(await lanza(undefined), 'red');
  assert.match(montar().ev('mensajeGate("red")'), /^Sin conexión con el motor de obra$/);
});

test('razon(): la caída «red» sigue diciendo «sin conexión con el motor» (como el TypeError de antes); lo demás no cambia', () => {
  const h = montar();
  assert.equal(h.ev('razon("red")'), 'sin conexión con el motor');assert.equal(h.ev('razon("clave")'), 'clave');assert.equal(h.ev('razon("error")'), 'error');
  assert.equal(h.ev('razon(new TypeError("Failed to fetch"))'), 'sin conexión con el motor');assert.equal(h.ev('razon(undefined)'), 'sin conexión con el motor');
});

test('pedir() legacy (sin cargador, o con legacy:true) es el de siempre: GET con cb, cache:no-store, j.ok o throw; el cargador ni se toca', async () => {
  for (const variante of [{}, { cargador: { legacy: true, get: () => exito(BOARD) } }]) {
    const h = montar({ ...variante, fetch: [{ ok: true, kpi: {} }, { ok: false, error: 'clave' }, { ok: false }] });
    assert.equal((await h.ev('pedir("board","&semana=2026-10")')).ok, true);
    assert.match(h.urls[0], new RegExp('^' + GAS.replace(/[.?]/g, '\\$&') + '\\?recurso=board&k=' + TOK + '&semana=2026-10&cb=\\d+$'));
    assert.equal(J(h.opciones[0]), J({ cache: 'no-store' }));
    await assert.rejects(h.ev('pedir("produccion")'), e => e === 'clave');
    await assert.rejects(h.ev('pedir("produccion")'), e => e === 'error');
    if (h.falso) assert.equal(h.falso.llamadas.get.length, 0, 'legacy:true no usa el cargador');
  }
  const h = montar({ fetch: [new TypeError('Failed to fetch')] });
  await assert.rejects(h.ev('pedir("board")'), e => e instanceof TypeError);
});

test('cargar() y cargarProd() siguen igual: cargar propaga el error; cargarProd lo atrapa (P=null, PERR) y nunca rechaza; D y P se llenan con lo que contesta el motor', async () => {
  const ok = montar({ cargador: { get: (u, p) => exito(datos(p.recurso)) } });
  await ok.ev('cargar()');await ok.ev('cargarProd()');
  assert.equal(J(ok.ev('D')), J(BOARD));assert.equal(J(ok.ev('P')), J(PRODUCCION));assert.equal(ok.ev('PERR'), '');
  const mal = montar({ cargador: { get: (u, p) => (p.recurso === 'board' ? motorDice('clave') : sinRed('timeout')) } });
  await assert.rejects(mal.ev('cargar()'), e => e === 'clave');
  await mal.ev('cargarProd()');
  assert.equal(mal.ev('P'), null);assert.equal(mal.ev('PERR'), 'red');
});

/* ═════════ arranque ═════════ */
test('arranque con cargador: tablero y frenos se piden A LA VEZ; abrir y drenarCola sólo cuando llegaron los dos', async () => {
  const board = diferido(), prod = diferido();
  const h = montar({ cargador: { canjear: () => SESION_OK, get: (u, p) => (p.recurso === 'board' ? board.promesa : prod.promesa) } });
  const fin = h.ev('arrancar()');
  await asentar();
  assert.equal(J(h.falso.llamadas.get.map(a => a[1].recurso)), J(['board', 'produccion']), 'las dos lecturas salieron antes de que llegara cualquiera');
  assert.equal(h.pintados.length, 0);assert.equal(h.drenos.length, 0);
  prod.ok(exito(PRODUCCION));await asentar();
  assert.equal(h.pintados.length, 0, 'falta el tablero: todavía no se abre');
  board.ok(exito(BOARD));await fin;
  assert.equal(h.pintados.length, 1);assert.equal(h.drenos.length, 1);
  assert.equal(J(h.ev('D')), J(BOARD));assert.equal(J(h.ev('P')), J(PRODUCCION));
  assert.equal(h.nodo('#gate').clases.has('off'), true);assert.equal(h.nodo('#app').style.display, '');
  assert.equal(J(h.falso.llamadas.primerDato), J([['red']]), 'primer dato cuando abrir pintó');
  assert.ok(h.bitacora.indexOf('pintar') >= 0 && h.falso.llamadas.primerDato.length === 1);
});

test('arranque con cargador: si los frenos fallan el tablero abre igual (cargarProd atrapa); si el tablero es rechazado se queda el candado, K="" y la llave NO se borra', async () => {
  const sinFrenos = montar({ cargador: { canjear: () => SESION_OK, get: (u, p) => (p.recurso === 'board' ? exito(BOARD) : sinRed('timeout')) } });
  await sinFrenos.ev('arrancar()');
  assert.equal(sinFrenos.pintados.length, 1);assert.equal(sinFrenos.ev('P'), null);assert.equal(sinFrenos.ev('PERR'), 'red');assert.equal(sinFrenos.drenos.length, 1);
  const rechazado = montar({ cargador: { canjear: () => SESION_OK, get: (u, p) => (p.recurso === 'board' ? motorDice('clave') : exito(PRODUCCION)) } });
  await rechazado.ev('arrancar()');
  assert.equal(rechazado.pintados.length, 0);assert.equal(rechazado.drenos.length, 0);assert.equal(rechazado.ev('K'), '');
  assert.equal(rechazado.nodo('#gerr').textContent, 'Tu sesión no abre el motor de obra. Entra desde YOD OS.');assert.equal(rechazado.nodo('#gvolver').hidden, false);
  assert.equal(rechazado.guardado.get('pyod_clave_v1'), TOK, 'regla 5: un rechazo del motor no cierra la sesión de todo el OS');
  assert.deepEqual(rechazado.borrados, []);assert.equal(rechazado.falso.llamadas.primerDato.length, 0, 'no hubo primer dato');
  const sinSesion = montar({ cargador: { canjear: () => ({ ok: false, error: 'revocado', rechazo: true }), get: () => exito(BOARD) } });
  await sinSesion.ev('arrancar()');
  assert.equal(sinSesion.falso.llamadas.get.length, 0, 'fail-closed: sin canje válido no se pide un solo dato');
  assert.equal(sinSesion.nodo('#gerr').textContent, sinSesion.ev('mensajeGate("sesion")'));assert.equal(sinSesion.guardado.get('pyod_clave_v1'), TOK);
  const sinOB = montar({ cargador: { canjear: () => ({ ...SESION_OK, boards: 'TA' }), get: () => exito(BOARD) } });
  await sinOB.ev('arrancar()');
  assert.equal(sinOB.falso.llamadas.get.length, 0);assert.equal(sinOB.nodo('#gerr').textContent, sinOB.ev('mensajeGate("sinOB")'));
  const red = montar({ cargador: { canjear: () => SESION_OK, get: () => sinRed('red') } });
  await red.ev('arrancar()');assert.equal(red.nodo('#gerr').textContent, 'Sin conexión con el motor de obra');
});

test('arranque legacy (sin cargador, ?cargador=legacy): la cadena de hoy, EN SERIE — canje, luego tablero, luego frenos', async () => {
  for (const variante of [{}, { cargador: { legacy: true, canjear: () => SESION_OK, get: () => exito(BOARD) } }]) {
    const canje = diferido(), board = diferido(), prod = diferido();
    const h = montar({ ...variante, fetch: [{ pendiente: canje }, { pendiente: board }, { pendiente: prod }] });
    const fin = h.ev('arrancar()');
    await asentar();assert.equal(h.urls.length, 1, 'primero el canje');
    canje.ok(respuesta({ ok: true, token: TOK, rol: 'vista', boards: 'OB', nombre: 'Legacy' }));await asentar();
    assert.equal(h.urls.length, 2, 'el tablero espera al canje');assert.match(h.urls[1], /recurso=board/);
    await asentar();assert.equal(h.urls.length, 2, 'y los frenos esperan al tablero (en serie)');
    board.ok(respuesta(BOARD));await asentar();
    assert.equal(h.urls.length, 3);assert.match(h.urls[2], /recurso=produccion/);assert.equal(h.pintados.length, 0);
    prod.ok(respuesta(PRODUCCION));await fin;
    assert.equal(h.pintados.length, 1);assert.equal(h.drenos.length, 1);assert.equal(h.esperas.length, 0);
    if (h.falso) assert.equal(h.falso.llamadas.canjear.length + h.falso.llamadas.get.length + h.falso.llamadas.primerDato.length, 0, 'legacy:true no toca al cargador');
  }
});

test('abrir(): pinta y marca primerDato("red") UNA vez con cargador; sin cargador (o legacy) no lo llama; si la telemetría truena, abrir no se rompe', () => {
  const con = montar({ cargador: {} });
  con.ev('abrir()');
  assert.equal(con.pintados.length, 1);assert.equal(J(con.falso.llamadas.primerDato), J([['red']]));
  assert.equal(con.nodo('#gate').clases.has('off'), true);assert.equal(con.nodo('#app').style.display, '');
  assert.ok(con.bitacora.indexOf('pintar') >= 0, 'pintó');
  const orden = montar({ cargador: {} });
  orden.falso.cargador.telemetria.primerDato = () => { orden.bitacora.push('primerDato'); return true; };
  orden.ev('abrir()');assert.deepEqual(orden.bitacora.filter(x => x === 'pintar' || x === 'primerDato'), ['pintar', 'primerDato'], 'después de pintar');
  const legacy = montar({ cargador: { legacy: true } });legacy.ev('abrir()');
  assert.equal(legacy.pintados.length, 1);assert.equal(legacy.falso.llamadas.primerDato.length, 0);
  const sin = montar();sin.ev('abrir()');assert.equal(sin.pintados.length, 1);
  const truena = montar({ cargador: { primerDato: new Error('boom') } });
  truena.ev('abrir()');assert.equal(truena.pintados.length, 1, 'abrir sigue');assert.equal(truena.nodo('#gate').clases.has('off'), true);
});

test('entrar() con cargador y una llave tecleada: se canjea directa, los datos salen con ESA llave y sólo al final se guarda en pyod_clave_v1', async () => {
  const h = montar({ storage: {}, cargador: { canjear: () => SESION_OK, get: (u, p) => exito(datos(p.recurso)) }, fetch: [{ ok: true, token: TECLEADA, rol: 'vista', boards: 'OB', nombre: 'Tecleada' }] });
  h.nodo('#clave').value = '  ' + TECLEADA + '  ';
  await h.ev('entrar()');
  assert.equal(h.falso.llamadas.canjear.length, 0);assert.deepEqual(h.urls, [ORIGINAL + '?recurso=canje&t=' + TECLEADA]);
  assert.equal(J(h.falso.llamadas.get.map(a => a[1])), J([{ recurso: 'board', k: TECLEADA }, { recurso: 'produccion', k: TECLEADA }]));
  assert.deepEqual(h.escrituras, ['pyod_clave_v1']);assert.equal(h.guardado.get('pyod_clave_v1'), TECLEADA);
  assert.equal(h.pintados.length, 1);assert.equal(h.nodo('#btnEntrar').disabled, false);
  assert.ok(h.bitacora.indexOf('set:pyod_clave_v1') > h.bitacora.indexOf('fetch:PORTERO'), 'la llave se guarda después de validarla');
  const mala = montar({ storage: {}, cargador: { get: () => motorDice('clave') }, fetch: [{ ok: true, token: TECLEADA, rol: 'vista', boards: 'OB' }] });
  mala.nodo('#clave').value = TECLEADA;await mala.ev('entrar()');
  assert.equal(mala.nodo('#gerr').textContent, 'Clave incorrecta');assert.deepEqual(mala.escrituras, [], 'una llave rechazada no se guarda');assert.equal(mala.pintados.length, 0);
});

/* ═════════ contra el cargador REAL (os/yod-cargador.js) ═════════
   El mismo código de la página, cortado por texto, contra el cargador de verdad: sólo cambian fetch (guion por URL, sin red),
   el almacén y el reloj de la espera de 1.5 s (a 0 ms, para no esperar). Aquí se prueba lo que los dobles no pueden:
   que lo que obra.html le pide al cargador es lo que el cargador entiende. */
function cargadorReal({ localStorage, fetch }) {
  const bus = new EventTarget();
  return crearCargador({
    fetch, storage: localStorage, now: Date.now, location: { pathname: '/yod-portal/obra.html', search: '', hash: '' }, history: { replaceState() { } },
    document: { currentScript: null, createElement: () => ({}), head: { appendChild() { } } }, performance: globalThis.performance,
    setTimeout: (f, ms) => setTimeout(f, ms === 1500 ? 0 : ms), clearTimeout,   // 1500 = la pausa entre intento e intento del cargador
    addEventListener: (...a) => bus.addEventListener(...a), removeEventListener: (...a) => bus.removeEventListener(...a), dispatchEvent: e => bus.dispatchEvent(e),
    YOD_PORTERO: { original: ORIGINAL, respaldo: RESPALDO }
  });
}
const CANJE_REAL = { ok: true, token: TOK, rol: 'vista', boards: 'OB', nombre: 'Persona de prueba', correo: 'persona@prueba.invalid' };
const rutear = programadas => async url => {            // responde por recurso, así no depende de cuántas peticiones haga el cargador
  const p = programadas[/[?&]recurso=([^&]+)/.exec(url)[1]];
  return typeof p === 'function' ? p(url) : respuesta(p);
};
const corto = h => h.urls.map(u => u.replace(GAS, 'GAS').replace(ORIGINAL, 'PORTERO'));

test('cargador REAL · arranque en frío: canje compartido y los dos datos a la red; sólo el hash de la sesión queda guardado, ninguna copia de datos, un solo primer dato', async () => {
  const h = montar({ real: cargadorReal, defecto: rutear({ canje: CANJE_REAL, board: BOARD, produccion: PRODUCCION }) });
  await h.ev('arrancar()');
  assert.deepEqual(corto(h), ['PORTERO?recurso=canje&t=' + TOK, 'GAS?recurso=board&k=' + TOK, 'GAS?recurso=produccion&k=' + TOK], 'el canje primero; luego tablero y frenos');
  assert.ok(h.urls.every(u => !u.startsWith(RESPALDO)), 'nunca el respaldo');
  assert.ok(h.opciones.every(o => o.cache === 'no-store' && o.credentials === 'omit'), 'el transporte del cargador pide sin caché del navegador y sin credenciales');
  assert.equal(h.pintados.length, 1);assert.equal(h.drenos.length, 1);
  assert.equal(h.ev('SES.boards'), 'OB');assert.equal(h.ev('SES.origen'), 'red');
  assert.equal(J(h.ev('D')), J(BOARD));assert.equal(J(h.ev('P')), J(PRODUCCION));
  const guardadas = [...h.guardado.keys()];
  assert.ok(guardadas.includes('yodcg_sesion_v1'), 'la sesión queda para la cabina y el marco (≤ 12 h)');
  assert.deepEqual(guardadas.filter(k => k.startsWith('yodcg_cache_v1:')), [], 'Obra autoriza pagos: ninguna copia de datos');
  for (const [k, v] of h.guardado) if (k !== 'pyod_clave_v1') assert.ok(!k.includes(TOK) && !v.includes(TOK), 'el token no puede estar en ' + k);
  const codigos = Array.from(h.window.YodCargador.telemetria.codigos());
  assert.equal(codigos.filter(c => /^pd:OB:\d+:r$/.test(c)).length, 1, 'un solo primer dato, con origen red: ' + codigos.join(' '));
  assert.ok(codigos.some(c => /^cj:OB:\d+:r$/.test(c)), 'y el canje: ' + codigos.join(' '));
});

test('cargador REAL · segunda carga: la sesión sale de lo guardado (sin otra ida al Portero) y los datos siguen yendo a la red', async () => {
  const a = montar({ real: cargadorReal, defecto: rutear({ canje: CANJE_REAL, board: BOARD, produccion: PRODUCCION }) });
  await a.ev('arrancar()');
  const b = montar({ real: cargadorReal, storage: Object.fromEntries(a.guardado), defecto: rutear({ board: BOARD, produccion: PRODUCCION }) });
  await b.ev('arrancar()');
  assert.deepEqual(corto(b), ['GAS?recurso=board&k=' + TOK, 'GAS?recurso=produccion&k=' + TOK], 'ni una ida al Portero: el canje compartido salió de lo guardado');
  assert.equal(b.ev('SES.origen'), 'cache');assert.equal(b.ev('SES.boards'), 'OB');
  assert.equal(b.pintados.length, 1);assert.equal(J(b.ev('D')), J(BOARD));
  assert.equal(b.guardado.get('pyod_clave_v1'), TOK);
});

test('cargador REAL · canje rechazado: candado con su razón, ni un dato pedido, y pyod_clave_v1 sigue en su sitio', async () => {
  for (const error of ['revocado', 'clave', 'expirado']) {
    const h = montar({ real: cargadorReal, defecto: rutear({ canje: { ok: false, error }, board: BOARD, produccion: PRODUCCION }) });
    await h.ev('arrancar()');
    assert.deepEqual(corto(h), ['PORTERO?recurso=canje&t=' + TOK], error);
    assert.equal(h.nodo('#gerr').textContent, h.ev('mensajeGate("sesion")'));assert.equal(h.pintados.length, 0);assert.equal(h.drenos.length, 0);
    assert.equal(h.guardado.get('pyod_clave_v1'), TOK, 'regla 5: ' + error);assert.ok(!h.borrados.includes('pyod_clave_v1'));
  }
});

test('cargador REAL · pedir() no guarda ni sirve copias: la segunda lectura con la red caída es «red», no el tablero de antes; el reintento (1.5 s) también falla igual', async () => {
  const h = montar({ real: cargadorReal, fetch: [BOARD, new TypeError('offline'), new TypeError('offline')] });
  assert.equal(J(await h.ev('pedir("board")')), J(BOARD));
  await assert.rejects(h.ev('pedir("board")'), e => e === 'red');
  assert.equal(h.urls.length, 3, 'una lectura buena y una caída con su único reintento');
  assert.deepEqual([...h.guardado.keys()].filter(k => k.startsWith('yodcg_cache_v1:')), [], 'ni una copia a la cual recurrir');
  const rechazo = montar({ real: cargadorReal, fetch: [{ ok: false, error: 'clave' }] });
  await assert.rejects(rechazo.ev('pedir("board")'), e => e === 'clave');
  assert.equal(rechazo.guardado.get('pyod_clave_v1'), TOK);assert.ok(!rechazo.borrados.includes('pyod_clave_v1'));
  assert.equal(rechazo.urls.length, 1, 'un rechazo del motor no se reintenta');
});

test('cargador REAL · el interruptor sin código (localStorage.yodcg_legacy = "1") devuelve a Obra al camino de siempre, en serie y con cb=', async () => {
  const h = montar({ real: cargadorReal, storage: { pyod_clave_v1: TOK, yodcg_legacy: '1' }, defecto: rutear({ canje: CANJE_REAL, board: BOARD, produccion: PRODUCCION }) });
  assert.equal(h.window.YodCargador.legacy, true);assert.equal(h.ev('cargadorActivo()'), false);
  await h.ev('arrancar()');
  assert.deepEqual(corto(h).map(u => u.replace(/&cb=\d+$/, '&cb=N')), ['PORTERO?recurso=canje&t=' + TOK, 'GAS?recurso=board&k=' + TOK + '&cb=N', 'GAS?recurso=produccion&k=' + TOK + '&cb=N']);
  assert.equal(J(h.opciones[0]), J({ cache: 'no-store', credentials: 'omit' }), 'el canje directo no usa el transporte del cargador (sin signal)');
  assert.equal(h.pintados.length, 1);assert.equal(h.guardado.has('yodcg_sesion_v1'), false, 'legacy no guarda sesión compartida');
  assert.deepEqual(Array.from(h.window.YodCargador.telemetria.codigos()), [], 'ni telemetría del cargador');
});
