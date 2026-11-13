'use strict';
/* T-202 · el tablero cenital (tablero.html) adopta el cargador compartido.
   Se prueba con un CARGADOR DE MENTIRA que sólo implementa lo que el contrato de la entrega 2 promete
   (YodCargador.recordar, sesion.canjear/token, purgar, telemetria.primerDato, cargarDespues y los eventos
   yodcargador:*); no usa el archivo real de os/yod-cargador.js. El código del tablero se corta del HTML por texto
   (como tests/portal-data-sources.cjs) y corre en una vm ESTRICTA (como la página) con reloj, fecha y red de
   mentira: sin red real, sin datos reales, sin llamar a ningún /exec. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'tablero.html'), 'utf8');
const politica = fs.readFileSync(path.join(raiz, 'os', 'access-policy.js'), 'utf8');

function corte(desde, hasta) {
  const i = html.indexOf(desde), j = html.indexOf(hasta, i + 1);
  assert.ok(i >= 0 && j > i, 'no se encontró el bloque: ' + desde);
  return html.slice(i, j);
}
const ESTRICTO = '"use strict";\n';
const CODIGO = ESTRICTO + [
  corte('let SESION=null;', 'const CV=document.getElementById("c")'),
  corte('function estadoErrorFuente(', '/* ═══ SONDA finance'),
  corte('/* ═══ SONDA finance', 'let _ultimoAlto=0;'),
  corte('const FUENTES={};', 'async function entrar(){'),
  corte('/* ═══ FASE 1 (T-202) · lo que el cargador avisa', 'escucharCargador();\nconst CLV')
].join('\n');
const ENTRAR = ESTRICTO + corte('async function entrar(){', 'document.getElementById("gateBtn").onclick=entrar;');
const ARRANQUE = ESTRICTO + corte('const CLV=localStorage.getItem(LSK)||"";', '/* La Chinche vive FUERA del candado') + '\n' +
  corte('if(CLV){', 'avisarAlto(); setTimeout(avisarAlto,300);');
const CHINCHE_BLOQUE = ESTRICTO + corte('(function(){\n  const tag=document.getElementById("yodChincheSrc")', 'if(CLV){');
const SONDA_URL = /async function sondaFinance\(\)\{[\s\S]*?fetch\("(https:\/\/[^"]+)"/.exec(html)[1];

const FUENTES_NOMBRES = ['PPP', 'Miramar', 'Tracks', 'Taller', 'Códigos', 'CRM', 'Obra'];
const DEFS = {
  PPP: ['PPP', 'conectarPPP', 'PPP'], Miramar: ['Miramar', 'conectarMiramar', 'Miramar'], Tracks: ['Tracks', 'conectarTracks', 'Tracks'],
  Taller: ['Taller', 'conectarTaller', 'Taller'], Codes: ['Códigos', 'conectarCodes', 'Codes'], CRM: ['CRM', 'conectarCRM', 'CRM'], Obra: ['Obra', 'conectarObra', 'Obra']
};
const FRESCO = 60000, VIEJO = 43200000, PLAZO = 45000, MIN = 60000;
const RECHAZOS = ['liga', 'clave', 'expirado', 'revocado', 'sin_sesion', 'sin_acceso', 'sin acceso', 'denegado', 'no autorizado', 'unauthorized', 'forbidden', 'http 401', 'http 403'];
const esRechazo = x => RECHAZOS.includes(String(x == null ? '' : x).trim().toLowerCase());
const json = o => JSON.stringify(o);
const soltar = () => new Promise(r => setImmediate(r));

/* ───────────── reloj de mentira: los temporizadores del tablero y del cargador corren sólo cuando se les da cuerda ───────────── */
function relojes() {
  let t = 0, id = 0, pend = [];
  return {
    ahora: () => t,
    setTimeout(fn, ms) { const h = ++id; pend.push({ h, en: t + ms, fn }); return h; },
    clearTimeout(h) { pend = pend.filter(x => x.h !== h); },
    pendientes: () => pend.length,
    mover(ms) { t += ms; },
    async avanzar(ms) {
      await soltar();                 // lo que el tablero pone a correr se registra antes de dar cuerda
      const fin = t + ms;
      for (;;) {
        pend.sort((a, b) => a.en - b.en || a.h - b.h);
        const x = pend[0];
        if (!x || x.en > fin) break;
        pend.shift(); t = Math.max(t, x.en); x.fn();
        await soltar();
      }
      t = fin; await soltar();
    }
  };
}

/* ───────────── el cargador de mentira (subconjunto del contrato T-201) ───────────── */
function cargadorFalso(reloj, oyentes, op, ls) {
  const almacen = new Map(), llamadas = [], primerDatos = [], purgas = [], enFondo = new Set();
  const emitir = (n, detail) => (oyentes[n] || []).slice().forEach(f => f({ type: n, detail }));
  const yo = {
    v: op.v || '2', legacy: !!op.legacy,
    almacen, llamadas, primerDatos, purgas, emitir, canjes: 0, diferidos: [],
    canje: op.canje || { ok: true, rol: 'editor', boards: 'PT,RM,TA,CO,OB', nombre: 'Persona', correo: 'p@example.invalid', origen: 'cache', edadMs: 5 },
    sesion: {
      token: () => ls.getItem('pyod_clave_v1'),
      canjear() { yo.canjes++; return Promise.resolve(yo.canje); }
    },
    purgar() { purgas.push(1); almacen.clear(); },
    telemetria: { primerDato(o) { primerDatos.push(o); } },
    cargarDespues(src, o) { yo.diferidos.push([src, o]); return Promise.resolve({ addEventListener() {} }); }
  };
  if (op.v === '1') return yo;       // el cargador de la entrega 1: no tiene recordar
  yo.recordar = function (clave, cargar, o = {}) {
    llamadas.push({ clave, o });
    if (op.recordarColgado) return new Promise(() => {});
    const fresco = o.frescoMs == null ? FRESCO : o.frescoMs, viejo = o.viejoMs == null ? VIEJO : o.viejoMs, plazo = o.timeoutMs == null ? 25000 : o.timeoutMs;
    const c = almacen.get(clave), edad = c ? reloj.ahora() - c.ts : null;
    const red = () => new Promise(resolve => {
      let fin = false; const signal = { aborted: false };
      const t = reloj.setTimeout(() => { if (fin) return; fin = true; signal.aborted = true; resolve({ ok: false, error: 'timeout', origen: 'sin_red' }); }, plazo);
      Promise.resolve().then(() => cargar(signal)).then(body => {
        if (fin) return; fin = true; reloj.clearTimeout(t);
        if (body && body.ok === false) return resolve({ ok: false, data: body, error: String(body.error || 'servidor'), rechazo: esRechazo(body.error), origen: 'red' });
        almacen.set(clave, { ts: reloj.ahora(), data: body });
        resolve({ ok: true, data: body, origen: 'red' });
      }, () => { if (fin) return; fin = true; reloj.clearTimeout(t); resolve({ ok: false, error: 'red', origen: 'sin_red' }); });
    });
    if (c && edad < viejo) {
      if (edad >= fresco && !enFondo.has(clave)) {
        enFondo.add(clave);
        red().then(r => {
          enFondo.delete(clave);
          if (r.ok) emitir('yodcargador:dato', { clave: 'memo:' + clave, origen: 'red', data: r.data, igual: json(c.data) === json(r.data) });
          else if (r.rechazo) { almacen.delete(clave); emitir('yodcargador:dato-negado', { clave: 'memo:' + clave, error: r.error }); }
        });
      }
      return Promise.resolve({ ok: true, data: c.data, origen: 'cache', edadMs: edad, ms: 0 });
    }
    return red().then(r => {
      if (r.ok && op.emiteEnPrimera) emitir('yodcargador:dato', { clave: 'memo:' + clave, origen: 'red', data: r.data, igual: false });
      return r;
    });
  };
  return yo;
}

/* ───────────── el entorno del tablero ───────────── */
function elemento(extra) {
  const clases = new Set();
  return Object.assign({ style: {}, textContent: '', innerHTML: '', disabled: false,
    classList: { add: (...x) => x.forEach(c => clases.add(c)), remove: (...x) => x.forEach(c => clases.delete(c)), contains: c => clases.has(c) } }, extra);
}
function entorno(op = {}) {
  const reloj = relojes(), oyentes = {}, almacenLocal = new Map(), sesionLocal = new Map();
  const el = {};
  ['gate', 'gateMsg', 'gateErr', 'w', 'fuentes', 'f', 'gateBtn'].forEach(id => { el[id] = elemento(); });
  el.gateClave = elemento({ value: '' });
  el.gateMsg.textContent = 'El tablero de la operación.';
  el.w.style.display = '';
  const llamadasFetch = [], quitadas = [], recargas = [], mensajes = [], avisos = [];
  let red = op.red || (() => ({ ok: false, error: 'servidor' }));
  const BASE = Date.UTC(2026, 9, 31, 12, 0, 0);
  class FechaFalsa extends Date {              // Date.now() y new Date() siguen al reloj de mentira
    constructor(...a) { super(...(a.length ? a : [BASE + reloj.ahora()])); }
    static now() { return BASE + reloj.ahora(); }
  }
  const ls = {
    getItem: k => almacenLocal.has(k) ? almacenLocal.get(k) : null,
    setItem: (k, v) => { almacenLocal.set(k, String(v)); },
    removeItem: k => { quitadas.push(k); almacenLocal.delete(k); }
  };
  const ctx = {
    console: { log() {}, warn(...a) { avisos.push(a); } },
    Date: FechaFalsa,
    setTimeout: reloj.setTimeout, clearTimeout: reloj.clearTimeout,
    addEventListener(n, f) { (oyentes[n] = oyentes[n] || []).push(f); },
    document: { getElementById: id => el[id] || elemento() },
    localStorage: ls,
    sessionStorage: { getItem: k => sesionLocal.has(k) ? sesionLocal.get(k) : null, setItem: (k, v) => { sesionLocal.set(k, String(v)); } },
    location: Object.assign({ origin: 'https://example.invalid' }, op.sinRecarga ? {} : { reload() { recargas.push(1); } }),
    parent: { postMessage(m, o) { mensajes.push([m, o]); } },
    fetch(url, init) {
      llamadasFetch.push({ url: String(url), init });
      const r = typeof red === 'function' ? red(String(url), init) : red;
      if (r && r.__colgada) return new Promise(() => {});
      if (r && r.__falla) return Promise.reject(r.__falla);
      if (r && r.__tras != null) return new Promise(res => reloj.setTimeout(() => res({ ok: true, status: 200, json: () => Promise.resolve(r.cuerpo) }), r.__tras));
      const http = (r && r.__http) || 200;
      return Promise.resolve({ ok: http >= 200 && http < 300, status: http, json: () => Promise.resolve(r && r.__http ? {} : r) });
    },
    // lo que la página declara fuera de los bloques cortados
    EMBED: !!op.embed, BOARDS: op.boards || '', ROL: op.rol || '', SESION_OS: !!op.sesionOS,
    F: el.f, g: { clearRect() {} }, LG: { clearRect() {} }, LZ: { width: 1, height: 1 }, W: 1, H: 1,
    HIT: [], FOCOS: [], NUEVOS: [], TAPAS: [], RECIEN: [], BAJAN: [], MOVIDOS: 0,
    pintar() {}, recalcularRecien() {}, prepararBajadas() {}, setLeadsCRM() {},
    avisarAlto() { ctx.avisos = (ctx.avisos || 0) + 1; },
    cifra: v => v === null || v === undefined || v === '' ? null : v,
    cegar: (lista, ids, motivo) => ids.forEach(i => { lista[i] = { st: 'ciego', src: motivo }; }),
    KPIHEX_TOP: Array.from({ length: 8 }, () => ({})), KPIHEX_BOT: Array.from({ length: 8 }, () => ({})),
    ORIG: Array.from({ length: 5 }, () => ({})), PROJ: [{}, {}, {}],
    TRAD: null, TALD: null, ARCD: [], CODM: null, CRMEST: '', OBRD: null, APSET: null, VBLQ: 0, NBLQ: 0,
    DIA_GRAVE: 60, DIA_ALARMA: 30,
    tareasResumen: tasks => ({ done: tasks.filter(t => t.estado === 'Terminado').length, tot: tasks.length, blq: 0 }),
    sumaInversiones: d => d,
    window: null
  };
  vm.createContext(ctx);
  ctx.window = ctx;                                  // en el navegador window === el global
  ctx.YOD_PORTERO = { original: 'https://example.invalid/portero', respaldo: 'https://example.invalid/respaldo' };
  if (op.token !== null) almacenLocal.set('pyod_clave_v1', op.token || 'tok-sintetico');
  vm.runInContext(politica, ctx);                    // define YodAccessPolicy en el global
  if (op.cargador !== false) ctx.YodCargador = cargadorFalso(reloj, oyentes, Object.assign({}, op.cargadorOp), ls);
  vm.runInContext(CODIGO, ctx);
  vm.runInContext(ENTRAR, ctx);
  vm.runInContext('escucharCargador()', ctx);        // la página lo invoca justo después de definirlo
  const ev = n => vm.runInContext(n, ctx);
  return {
    ctx, reloj, el, oyentes, llamadasFetch, quitadas, recargas, mensajes, avisos, almacenLocal, sesionLocal,
    cargador: ctx.YodCargador, ev,
    poner: codigo => vm.runInContext(codigo, ctx),
    ponerRed(f) { red = f; },
    emitir(n, detail) { (oyentes[n] || []).slice().forEach(f => f({ type: n, detail })); },
    arrancar() { return vm.runInContext(ARRANQUE, ctx); },
    pastillas: () => el.fuentes.innerHTML,
    estado: n => (ev('FUENTES')[n] || {}).estado
  };
}

/* cuerpos sintéticos de cada backend (sin datos reales) */
const cuerpoPPP = (clientes = 3, agendadas = 2) => ({ ok: true, kpis: { clientes, agendadas, leads: 9 }, actividad_por_dia: [{ visitas: 10, empezaron: 5 }] });
const cuerpoTracks = (hechos = 1, tot = 2) => ({ ok: true, items: Array.from({ length: tot }, (_, i) => ({ estado: i < hechos ? 'hecho' : 'pendiente' })) });
const cuerpoObra = () => ({ ok: true, kpi: { avance: 0.5, importe: 100, ejecutado: 50, conceptos: 3 }, frentes: { A: { importe: 100, ejecutado: 50, n: 3 } } });
const ruta = (e, mapa) => url => { for (const [k, f] of Object.entries(mapa)) if (url.startsWith(e.ev(k))) return f(); return { ok: false, error: 'servidor' }; };

const correrUna = (e, k) => e.poner('FUENTES_DEF=[["' + DEFS[k][0] + '",' + DEFS[k][1] + ',"' + DEFS[k][2] + '"]]; marcaFuente("' + DEFS[k][0] + '",null); correrFuente(FUENTES_DEF[0])');
const sesionLista = e => e.poner('validar("tok-sintetico")');
const conCopia = (e, clave, cuerpo, edadMs) => e.cargador.almacen.set(clave, { ts: e.reloj.ahora() - edadMs, data: cuerpo });
const canje = (boards, rol = 'editor') => ({ cargadorOp: { canje: { ok: true, rol, boards, nombre: 'P', correo: 'p@example.invalid' } } });

/* ═══════════════════════════ la decisión única ═══════════════════════════ */
test('cargadorActivo exige recordar (v2): el v1 de main, legacy o sin cargador caen al camino viejo', () => {
  assert.equal(entorno().ev('cargadorActivo()'), true);
  assert.equal(entorno({ cargadorOp: { v: '1' } }).ev('cargadorActivo()'), false, 'v1 sin recordar: camino viejo');
  assert.equal(entorno({ cargadorOp: { legacy: true } }).ev('cargadorActivo()'), false, '?cargador=legacy');
  assert.equal(entorno({ cargador: false }).ev('cargadorActivo()'), false, 'sin cargador');
});

/* ═══════════════════════════ el candado por canje ═══════════════════════════ */
test('candado · canje ok: CLAVE_OK = llave, SESION = {boards, rol} del canje y no usa track=alysa', async () => {
  const e = entorno();
  await sesionLista(e);
  assert.equal(e.ev('CLAVE_OK'), 'tok-sintetico');
  assert.deepEqual(JSON.parse(json(e.ev('SESION'))), { boards: 'PT,RM,TA,CO,OB', rol: 'editor' });
  assert.equal(e.cargador.canjes, 1);
  assert.equal(e.llamadasFetch.length, 0, 'el canje lo hace el cargador: el tablero no pide track=alysa');
});
test('candado · con identidad en caché abre sin esperar nada (ningún temporizador)', async () => {
  const e = entorno();
  let listo = false;
  sesionLista(e).then(() => { listo = true; });
  await soltar();
  assert.equal(listo, true);
  assert.equal(e.reloj.pendientes(), 0);
});
test('candado · rechazo del canje: lanza el código, purga las copias y NO borra pyod_clave_v1 (regla 5)', async () => {
  for (const codigo of ['clave', 'liga', 'expirado', 'revocado', 'http 403', 'sin_acceso']) {
    const e = entorno(Object.assign({}, { cargadorOp: { canje: { ok: false, error: codigo, rechazo: true, origen: 'red' } } }));
    await assert.rejects(sesionLista(e), x => x === codigo, codigo);
    assert.deepEqual(e.quitadas, [], 'no se borra ninguna llave: ' + codigo);
    assert.equal(e.almacenLocal.get('pyod_clave_v1'), 'tok-sintetico');
    assert.equal(e.cargador.purgas.length, 1, 'se tiran las copias: ' + codigo);
    assert.equal(e.ev('CLAVE_OK'), null);
    assert.equal(e.ev('SESION'), null);
  }
});
test('candado · red o timeout del canje: lanza "red" (no es una sesión muerta) y no purga', async () => {
  for (const error of ['red', 'timeout', 'http', 'formato']) {
    const e = entorno({ cargadorOp: { canje: { ok: false, error, rechazo: false, origen: 'sin_red' } } });
    await assert.rejects(sesionLista(e), x => x === 'red', error);
    assert.equal(e.cargador.purgas.length, 0);
    assert.deepEqual(e.quitadas, []);
  }
});
test('candado · una clave distinta de la guardada (entrar a mano) no se da por buena con el canje de otra llave', async () => {
  const e = entorno({ red: { ok: true, items: [] } });
  await e.poner('validar("otra-clave")');
  assert.equal(e.cargador.canjes, 0, 'el canje no puede dar fe de una llave que no está guardada');
  assert.equal(e.llamadasFetch.length, 1);
  assert.match(e.llamadasFetch[0].url, /recurso=track&track=alysa&k=otra-clave/);
  assert.equal(e.ev('CLAVE_OK'), 'otra-clave');
  assert.equal(e.ev('SESION'), null);
});
test('mensajeGate dice lo que es cada rechazo', () => {
  const e = entorno();
  const m = c => e.ev('mensajeGate')(c);
  assert.equal(m('clave'), 'La clave cambió');
  for (const c of ['liga', 'expirado', 'revocado']) assert.match(m(c), /La sesión venció/);
  assert.match(m('sin_sesion'), /No hay sesión/);
  for (const c of ['sin_acceso', 'sin acceso', 'denegado', 'no autorizado', 'forbidden', 'unauthorized', 'http 401', 'http 403', '403']) assert.match(m(c), /no tiene acceso/, c);
  for (const c of ['red', 'timeout', 'error', undefined, new Error('x')]) assert.equal(m(c), 'Sin conexión con el Sheet');
});
test('entrar() con cargador · clave escrita: se valida, se guarda, el canje le da boards/rol y se avisa al OS', async () => {
  const e = entorno({ token: null, red: { ok: true, items: [] } });
  e.el.gateClave.value = '  clave-escrita ';
  await e.poner('entrar()');
  assert.equal(e.almacenLocal.get('pyod_clave_v1'), 'clave-escrita');
  assert.equal(e.cargador.canjes, 1, 'ya guardada, el canje la reconoce');
  assert.deepEqual(JSON.parse(json(e.ev('SESION'))), { boards: 'PT,RM,TA,CO,OB', rol: 'editor' });
  assert.equal(e.el.gate.classList.contains('off'), true, 'abierto');
  assert.equal(e.el.gateBtn.disabled, false);
  assert.deepEqual(JSON.parse(json(e.mensajes)), [[{ yodTablero: 'sesion' }, 'https://example.invalid']]);
});
test('entrar() · clave incorrecta, sin clave y sin conexión dicen lo que pasó y no guardan nada', async () => {
  const mala = entorno({ token: null, red: { ok: false, error: 'clave' } });
  mala.el.gateClave.value = 'x';
  await mala.poner('entrar()');
  assert.equal(mala.el.gateErr.textContent, 'Clave incorrecta');
  assert.equal(mala.almacenLocal.has('pyod_clave_v1'), false);
  assert.equal(mala.el.gate.classList.contains('off'), false);
  const vacia = entorno({ token: null });
  await vacia.poner('entrar()');
  assert.equal(vacia.el.gateErr.textContent, 'Escribe la clave');
  const caida = entorno({ token: null, red: { __falla: new TypeError('Failed to fetch') } });
  caida.el.gateClave.value = 'x';
  const p = caida.poner('entrar()');
  await caida.reloj.avanzar(1500);
  await p;
  assert.equal(caida.el.gateErr.textContent, 'Sin conexión con el Sheet');
  assert.equal(caida.el.gateBtn.disabled, false);
});

/* ═══════════════════════════ el arranque de la página ═══════════════════════════ */
test('arranque · con llave guardada y canje ok: dice «Verificando acceso…» y abre sin pedir la clave', async () => {
  const e = entorno();
  e.arrancar();
  assert.equal(e.el.gate.classList.contains('validando'), true);
  assert.equal(e.el.gateMsg.textContent, 'Verificando acceso…');
  await soltar();
  assert.equal(e.el.gate.classList.contains('off'), true);
  assert.equal(e.el.w.style.display, '');
  assert.equal(e.el.gateErr.textContent, '');
});
test('arranque · sin llave guardada deja el candado normal (nada que verificar)', async () => {
  const e = entorno({ token: null });
  e.arrancar();
  await soltar();
  assert.equal(e.el.gate.classList.contains('validando'), false);
  assert.equal(e.el.gate.classList.contains('off'), false);
  assert.equal(e.cargador.canjes, 0);
});
test('arranque · rechazo «clave»: con cargador NO se borra la llave (es de la cabina); el camino legacy la borra como siempre; embebido nunca', async () => {
  const con = entorno({ cargadorOp: { canje: { ok: false, error: 'clave', rechazo: true } } });
  con.arrancar(); await soltar();
  assert.deepEqual(con.quitadas, []);
  assert.equal(con.el.gateErr.textContent, 'La clave cambió');
  assert.equal(con.el.gate.classList.contains('validando'), false);
  assert.equal(con.el.gateMsg.textContent, 'El tablero de la operación.');
  const leg = entorno({ cargador: false, red: { ok: false, error: 'clave' } });
  leg.arrancar(); await soltar();
  assert.deepEqual(leg.quitadas, ['pyod_clave_v1']);
  const emb = entorno({ cargador: false, embed: true, red: { ok: false, error: 'clave' } });
  emb.arrancar(); await soltar();
  assert.deepEqual(emb.quitadas, []);
  assert.equal(emb.el.gateErr.textContent, 'La clave cambió');
});
test('arranque · sesión vencida, sin acceso y sin conexión cada uno con su mensaje y sin tocar la llave', async () => {
  const casos = [['revocado', true, /La sesión venció/], ['sin_acceso', true, /no tiene acceso/], ['timeout', false, /Sin conexión con el Sheet/]];
  for (const [error, rechazo, texto] of casos) {
    const e = entorno({ cargadorOp: { canje: { ok: false, error, rechazo } } });
    e.arrancar(); await soltar();
    assert.match(e.el.gateErr.textContent, texto, error);
    assert.deepEqual(e.quitadas, [], error);
    assert.equal(e.el.gate.classList.contains('off'), false);
  }
});

test('arranque · si la sesión se rechaza mientras se valida, abrir() no abre un tablero ya cerrado', async () => {
  const e = entorno();
  e.arrancar();                                       // validar(CLV).then(abrir) todavía en vuelo
  e.emitir('yodcargador:sesion-rechazada', { error: 'revocado' });
  await soltar();
  assert.equal(e.el.gate.classList.contains('off'), false);
  assert.equal(e.el.gate.classList.contains('validando'), false);
  assert.equal(e.el.w.style.display, 'none');
  assert.match(e.el.gateErr.textContent, /La sesión venció/);
  assert.equal(e.cargador.llamadas.length, 0, 'ninguna fuente corrió');
  assert.equal(e.llamadasFetch.length, 0);
});
test('entrar() tras cerrarse la sesión · reabre el tablero y los avisos del cargador vuelven a surtir efecto', async () => {
  const e = entorno();
  await sesionLista(e);
  e.emitir('yodcargador:sesion-rechazada', { error: 'revocado' });
  assert.equal(e.ev('CERRADO'), true);
  e.poner('NEGADO.PPP="sin_acceso"');
  e.el.gateClave.value = 'tok-sintetico';             // la llave guardada: el canje vuelve a dar boards/rol
  e.ponerRed(() => cuerpoPPP());
  await e.poner('entrar()');
  assert.equal(e.ev('CERRADO'), false);
  assert.equal(e.ev('NEGADO.PPP'), undefined, 'veredictos nuevos');
  assert.equal(e.el.gate.classList.contains('off'), true);
  assert.equal(e.el.w.style.display, '');
  await soltar();
  assert.equal(e.estado('PPP'), 'ok');
  e.emitir('yodcargador:sesion-rechazada', { error: 'revocado' });
  assert.equal(e.el.w.style.display, 'none', 'y se vuelve a cerrar si el Portero lo pide');
});

/* ═══════════════════════════ puedo(sys) ═══════════════════════════ */
test('puedo · con cargador manda el canje, embebido o suelto, y la liga del iframe ya no decide', async () => {
  const e = entorno(Object.assign({ boards: '*', rol: 'admin', sesionOS: true }, canje('RM')));
  assert.equal(e.ev('puedo("SYS-MIRAMAR")'), false, 'sin canje resuelto: nada se consulta');
  await sesionLista(e);
  assert.equal(e.ev('puedo("SYS-MIRAMAR")'), true);
  assert.equal(e.ev('puedo("SYS-OBRA")'), false, 'la liga decía *, el canje dice RM');
  assert.equal(e.ev('puedo("SYS-POTENCIALES")'), false);
  const suelto = entorno(canje('OB'));
  await sesionLista(suelto);
  assert.equal(suelto.ev('puedo("SYS-OBRA")'), true);
  assert.equal(suelto.ev('puedo("SYS-TAREAS")'), false, 'suelto también manda el canje (antes: todo permitido)');
  const admin = entorno(canje('', 'admin'));
  await sesionLista(admin);
  assert.equal(admin.ev('puedo("SYS-OBRA")'), true, 'admin ve todo');
  assert.equal(entorno().ev('puedo("SYS-OBRA")'), false, 'sin canje resuelto: false');
});
test('puedo · legacy queda como antes (liga del iframe; suelto = todo)', () => {
  assert.equal(entorno({ cargador: false }).ev('puedo("SYS-OBRA")'), true);
  const emb = entorno({ cargador: false, sesionOS: true, boards: 'RM', rol: 'editor' });
  assert.equal(emb.ev('puedo("SYS-MIRAMAR")'), true);
  assert.equal(emb.ev('puedo("SYS-OBRA")'), false);
  assert.equal(entorno({ cargadorOp: { v: '1' }, sesionOS: true, boards: 'OB', rol: 'editor' }).ev('puedo("SYS-OBRA")'), true, 'cargador v1 = camino viejo');
  assert.equal(entorno({ cargadorOp: { legacy: true }, sesionOS: true, boards: 'RM', rol: 'editor' }).ev('puedo("SYS-OBRA")'), false, '?cargador=legacy = como hoy');
});
test('SYS_DE coincide con el código que cada conector le pregunta a puedo()', async () => {
  const e = entorno();
  const vistos = {};
  e.ctx.puedo = sys => { vistos.ultimo = sys; return false; };
  const tabla = e.ev('SYS_DE');
  for (const k of Object.keys(DEFS)) {
    vistos.ultimo = null;
    assert.equal(await e.poner(DEFS[k][1] + '()'), 'sinacceso', k);
    assert.equal(tabla[DEFS[k][2]], vistos.ultimo, k);
  }
});

/* ═══════════════════════════ fuentes con cargador: copia primero, refresco en fondo ═══════════════════════════ */
test('fuente con copia · se pinta YA con la copia («cache»); el refresco distinto vuelve a correr el conector y queda «ok»', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(3, 2), 5 * MIN);
  e.ponerRed({ __tras: 3000, cuerpo: cuerpoPPP(5, 4) });          // el refresco tarda 3 s
  correrUna(e, 'PPP');
  await soltar();
  assert.equal(e.ev('KPIHEX_TOP[1].n'), '3/8', 'pinta la copia sin esperar la red');
  assert.equal(e.estado('PPP'), 'cache');
  assert.match(e.pastillas(), /Datos guardados, sin actualizar: PPP/);
  assert.doesNotMatch(e.pastillas(), /Cargando|fu-ok/);
  assert.equal(e.ev('ORIGEN.PPP'), 'cache');
  await e.reloj.avanzar(3000);
  assert.equal(e.ev('KPIHEX_TOP[1].n'), '5/8', 'con el refresco vuelve a correr');
  assert.equal(e.estado('PPP'), 'ok');
  assert.equal(e.ev('ORIGEN.PPP'), 'copia');
  assert.equal(e.llamadasFetch.length, 1, 'una sola petición: la segunda corrida lee la copia fresca, sin red');
  assert.deepEqual(e.cargador.llamadas.map(l => l.clave), ['tablero:PPP', 'tablero:PPP']);
  assert.equal(e.reloj.pendientes(), 0, 'ningún temporizador queda vivo');
});
test('fuente con copia · si el refresco no llega la copia sigue siendo honesta: «guardada, sin actualizar»', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(3, 2), 5 * MIN);
  e.ponerRed({ __colgada: true });
  correrUna(e, 'PPP');
  await e.reloj.avanzar(PLAZO + 3000);
  assert.equal(e.ev('KPIHEX_TOP[1].n'), '3/8');
  assert.equal(e.estado('PPP'), 'cache');
  assert.equal(e.reloj.pendientes(), 0, 'el cargador acotó el refresco con su timeoutMs');
});
test('recordar recibe la petición de hoy y las opciones del contrato (cache-primero, 60 s, 12 h, 45 s, token de la llave)', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed(() => cuerpoPPP());
  assert.equal(await e.poner('conectarPPP()'), 'ok');
  const l = e.cargador.llamadas[0];
  assert.equal(l.clave, 'tablero:PPP');
  assert.deepEqual(JSON.parse(json(l.o)), { modo: 'cache-primero', frescoMs: FRESCO, viejoMs: VIEJO, timeoutMs: PLAZO, token: 'tok-sintetico' });
  assert.match(e.llamadasFetch[0].url, /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec\?recurso=board&k=tok-sintetico&t=\d+$/, 'misma URL de siempre');
  assert.equal(e.llamadasFetch[0].init.cache, 'no-store');
  assert.ok(e.llamadasFetch[0].init.signal, 'el signal del cargador llega al fetch');
});
test('refresco con los MISMOS datos · no vuelve a correr el conector: sólo confirma («cache» pasa a «ok»)', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(3, 2), 5 * MIN);
  e.ponerRed({ __tras: 3000, cuerpo: cuerpoPPP(3, 2) });
  correrUna(e, 'PPP');
  await soltar();
  assert.equal(e.estado('PPP'), 'cache');
  await e.reloj.avanzar(3000);
  assert.equal(e.estado('PPP'), 'ok');
  assert.equal(e.ev('ORIGEN.PPP'), 'red');
  assert.equal(e.cargador.llamadas.length, 1, 'el conector corrió una sola vez');
  assert.equal(e.llamadasFetch.length, 1);
});
test('refresco duplicado · el mismo dato llegando dos veces corre el conector una sola vez', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(3, 2), 5 * MIN);
  e.ponerRed(() => cuerpoPPP(5, 4));
  correrUna(e, 'PPP');
  await soltar();
  assert.equal(e.estado('PPP'), 'ok');
  const antes = e.cargador.llamadas.length;
  assert.equal(antes, 2, 'la copia y la corrida que trajo el refresco');
  e.emitir('yodcargador:dato', { clave: 'memo:tablero:PPP', origen: 'red', data: cuerpoPPP(5, 4), igual: false });
  await soltar();
  assert.equal(e.cargador.llamadas.length, antes, 'ya había leído exactamente ese dato');
});
test('refresco que llega ANTES de que la primera corrida lo consuma · no la repite (primera petición, sin copia)', async () => {
  const e = entorno({ cargadorOp: { emiteEnPrimera: true } });
  await sesionLista(e);
  e.ponerRed(() => cuerpoPPP());
  correrUna(e, 'PPP');
  await soltar();
  assert.equal(e.cargador.llamadas.length, 1, 'sin copia el dato recién llegado ya es el que pintó');
  assert.equal(e.estado('PPP'), 'ok');
});
test('un refresco que llega mientras el conector corre se repite UNA vez si trae algo distinto', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed(() => cuerpoPPP(3, 2));
  correrUna(e, 'PPP');
  e.emitir('yodcargador:dato', { clave: 'memo:tablero:PPP', origen: 'red', data: cuerpoPPP(9, 9), igual: false });
  e.emitir('yodcargador:dato', { clave: 'memo:tablero:PPP', origen: 'red', data: cuerpoPPP(9, 9), igual: false });
  await soltar();
  assert.equal(e.cargador.llamadas.length, 2, 'una segunda corrida, no más');
});
test('un aviso de dato de otra clave, de otro origen o con el tablero cerrado no corre nada', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed(() => cuerpoPPP());
  correrUna(e, 'PPP');
  await soltar();
  const n = e.cargador.llamadas.length;
  e.emitir('yodcargador:dato', { clave: 'memo:otra-cosa:PPP', origen: 'red', data: cuerpoPPP(9, 9), igual: false });
  e.emitir('yodcargador:dato', { clave: 'memo:tablero:PPP', origen: 'cache', data: cuerpoPPP(9, 9), igual: false });
  e.emitir('yodcargador:dato', { clave: 'memo:tablero:Fantasma', origen: 'red', data: cuerpoPPP(9, 9), igual: false });
  await soltar();
  assert.equal(e.cargador.llamadas.length, n);
});
test('Tracks · dos peticiones con su propia memoria (alysa y maría): «cache» mientras las copias sean viejas, «ok» al refrescar', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:Tracks:alysa', cuerpoTracks(1, 2), 5 * MIN);
  conCopia(e, 'tablero:Tracks:maria', cuerpoTracks(0, 2), 5 * MIN);
  e.ponerRed({ __tras: 3000, cuerpo: cuerpoTracks(2, 2) });
  correrUna(e, 'Tracks');
  await soltar();
  assert.equal(e.estado('Tracks'), 'cache');
  assert.equal(e.ev('KPIHEX_BOT[3].n'), '50%', 'alysa: la copia (1 de 2)');
  await e.reloj.avanzar(3000);
  assert.equal(e.estado('Tracks'), 'ok');
  assert.equal(e.ev('KPIHEX_BOT[3].n'), '100%');
  assert.equal(e.llamadasFetch.length, 2, 'sólo los dos refrescos: las demás corridas leen la copia fresca');
  for (const l of e.llamadasFetch) assert.match(l.url, /^https:\/\/example\.invalid\/portero\?recurso=track&track=(alysa|maria)&k=tok-sintetico$/);
  assert.equal(e.reloj.pendientes(), 0);
});
test('Tracks · una petición sin copia espera a la red («Cargando…»); la otra, con copia vieja, se pone al día sola', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:Tracks:alysa', cuerpoTracks(1, 2), 5 * MIN);
  e.ponerRed({ __tras: 3000, cuerpo: cuerpoTracks(2, 2) });
  correrUna(e, 'Tracks');
  await soltar();
  assert.equal(e.estado('Tracks'), 'cargando', 'la fuente termina cuando contestan las dos');
  await e.reloj.avanzar(3000);
  assert.equal(e.estado('Tracks'), 'ok');
  assert.equal(e.ev('KPIHEX_BOT[3].n'), '100%');
  assert.equal(e.llamadasFetch.length, 2);
  assert.equal(e.reloj.pendientes(), 0);
});
test('copia vieja de una fuente con datos incompletos conserva su etiqueta (sólo «ok» se rebaja a «cache»)', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', { ok: true, kpis: {}, actividad_por_dia: [] }, 5 * MIN);
  e.ponerRed({ __colgada: true });
  correrUna(e, 'PPP');
  await soltar();
  assert.equal(e.estado('PPP'), 'incompleto');
});
test('copia fresca (<60 s) · se pinta como «ok»: ya es lo último que hay y no sale ninguna petición', async () => {
  const e = entorno();
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(3, 2), 10 * 1000);
  correrUna(e, 'PPP');
  await soltar();
  assert.equal(e.estado('PPP'), 'ok');
  assert.equal(e.llamadasFetch.length, 0);
  assert.equal(e.ev('ORIGEN.PPP'), 'copia');
});
test('abrir() con cargador · las 7 fuentes pasan por recordar con las claves y opciones del contrato', async () => {
  const e = entorno();
  await sesionLista(e);
  e.poner('abrir()');
  await soltar();
  const claves = [...new Set(e.cargador.llamadas.map(l => l.clave))].sort();
  assert.deepEqual(claves, ['tablero:CRM', 'tablero:Codes', 'tablero:Codes:todo', 'tablero:Miramar', 'tablero:Obra', 'tablero:PPP', 'tablero:Taller', 'tablero:Tracks:alysa', 'tablero:Tracks:maria']);
  for (const l of e.cargador.llamadas) {
    assert.deepEqual(JSON.parse(json(l.o)), { modo: 'cache-primero', frescoMs: FRESCO, viejoMs: VIEJO, timeoutMs: PLAZO, token: 'tok-sintetico' }, l.clave);
  }
  assert.equal(e.ev('FUENTES_DEF').length, 7);
  assert.deepEqual(JSON.parse(json(e.ev('FUENTES_DEF').map(f => f[0]))), FUENTES_NOMBRES);
});
test('cinturón · si recordar no contestara nunca, la fuente termina en «error» a los 47 s (plazo + 2 s)', async () => {
  const e = entorno({ cargadorOp: { recordarColgado: true } });
  await sesionLista(e);
  let fin = null;
  e.poner('conectarPPP()').then(x => { fin = x; });
  await e.reloj.avanzar(PLAZO + 2000 - 1);
  assert.equal(fin, null);
  await e.reloj.avanzar(1);
  assert.equal(fin, 'error');
  assert.equal(e.ev('KPIHEX_TOP[1].src'), 'GAS plan-potencial sin respuesta en 45 s');
  assert.equal(e.reloj.pendientes(), 0);
});

test('una fuente cuyo pintado truena no se queda «en vuelo» para siempre: avisa y puede volver a correr', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed(() => cuerpoPPP());
  let boom = false, texto = '';
  Object.defineProperty(e.el.fuentes, 'innerHTML', { configurable: true, get: () => texto, set: v => { if (boom) throw new Error('boom'); texto = v; } });
  correrUna(e, 'PPP');
  boom = true;                                        // truena al pintar el resultado
  await soltar();
  assert.ok(e.avisos.some(a => /tablero · fuente PPP/.test(a[0])), 'avisa en consola');
  assert.equal(e.ev('EN_VUELO.PPP'), null);
  boom = false;
  e.poner('correrFuente(FUENTES_DEF[0])');
  await soltar();
  assert.equal(e.estado('PPP'), 'ok');
  assert.equal(e.cargador.llamadas.length, 2);
});

/* ═══════════════════════════ plazos: nunca una fuente colgada ═══════════════════════════ */
for (const modo of ['cargador', 'legacy', 'v1']) {
  test('plazo de 45 s (' + modo + ') · las 7 fuentes colgadas terminan en «error» y «Cargando N de 7…» desaparece', async () => {
    const e = entorno(modo === 'cargador' ? {} : modo === 'v1' ? { cargadorOp: { v: '1' } } : { cargador: false });
    if (modo === 'cargador') await sesionLista(e);
    else e.poner('CLAVE_OK="tok-sintetico"');
    e.ponerRed({ __colgada: true });
    e.poner('abrir()');
    await soltar();
    assert.match(e.pastillas(), /Cargando 7 de 7 fuentes…/);
    await e.reloj.avanzar(PLAZO - 1);
    assert.match(e.pastillas(), /Cargando 7 de 7/, 'a los 44.999 s todavía espera');
    await e.reloj.avanzar(1);
    await e.reloj.avanzar(3000);
    for (const n of FUENTES_NOMBRES) assert.equal(e.estado(n), 'error', n);
    assert.doesNotMatch(e.pastillas(), /Cargando/);
    assert.match(e.pastillas(), /No se pudo consultar: PPP, Miramar, Tracks, Taller, Códigos, CRM, Obra/);
    assert.equal(e.reloj.pendientes(), 0, 'ningún temporizador queda vivo');
  });
}
test('timeout · el motivo del hexágono dice «sin respuesta en 45 s»', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed({ __colgada: true });
  const p = e.poner('conectarPPP()');
  await e.reloj.avanzar(PLAZO);
  assert.equal(await p, 'error');
  assert.equal(e.ev('KPIHEX_TOP[1].st'), 'ciego');
  assert.equal(e.ev('KPIHEX_TOP[1].src'), 'GAS plan-potencial sin respuesta en 45 s');
});
test('Códigos · si el agregado agotó el plazo no se le pide getAll otra vez', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed({ __colgada: true });
  const p = e.poner('conectarCodes()');
  await e.reloj.avanzar(PLAZO);
  assert.equal(await p, 'error');
  assert.equal(e.llamadasFetch.length, 1, 'una sola petición');
  assert.equal(e.ev('KPIHEX_BOT[4].src'), 'portal codesarrolladores sin respuesta en 45 s');
});
test('Códigos · si el agregado falla a los 10 s, getAll sólo cuenta con los 35 s que quedan del plazo de la fuente', async () => {
  const e = entorno();
  await sesionLista(e);
  let n = 0;
  e.ponerRed(() => (++n === 1 ? { __tras: 10000, cuerpo: { ok: false, error: 'accion' } } : { __colgada: true }));
  const p = e.poner('conectarCodes()');
  await e.reloj.avanzar(10000);
  const getAll = e.cargador.llamadas.find(l => l.clave === 'tablero:Codes:todo');
  assert.ok(getAll, 'se pidió getAll');
  assert.equal(getAll.o.timeoutMs, 35000);
  await e.reloj.avanzar(35000);
  assert.equal(await p, 'error');
  assert.equal(e.ev('KPIHEX_BOT[4].src'), 'portal codesarrolladores sin respuesta en 45 s');
});
test('Códigos · el agregado público basta: no se pide getAll ni se manda la credencial', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed({ ok: true, total: 1000000, n: 2, recibido: 400000, pct: 0.4 });
  assert.equal(await e.poner('conectarCodes()'), 'ok');
  assert.deepEqual(e.cargador.llamadas.map(l => l.clave), ['tablero:Codes']);
  assert.equal(e.llamadasFetch.length, 1);
  assert.equal(e.llamadasFetch[0].init.body, '{"action":"resumenPublico"}');
  assert.equal(e.ev('KPIHEX_BOT[4].n'), '40%');
});

/* ═══════════════════════════ rechazos de credencial ═══════════════════════════ */
test('HTTP 403 con cargador · se entrega como rechazo de credencial y la fuente queda «Sin acceso»', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed({ __http: 403 });
  assert.equal(await e.poner('conectarCRM()'), 'sinacceso');
  assert.equal(e.ev('CRMEST'), 'sinacceso');
  assert.equal(e.cargador.llamadas.length, 1);
});
test('HTTP 401 / 500 con cargador · 401 es acceso, 500 es error del servidor', async () => {
  const a = entorno();
  await sesionLista(a);
  a.ponerRed({ __http: 401 });
  assert.equal(await a.poner('conectarObra()'), 'sinacceso');
  const b = entorno();
  await sesionLista(b);
  b.ponerRed({ __http: 500 });
  assert.equal(await b.poner('conectarObra()'), 'error');
});
test('rechazo en el cuerpo con cargador · {ok:false,error:"liga"} → «sinacceso»; {ok:false,error:"servidor"} → «error»', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed({ ok: false, error: 'liga' });
  assert.equal(await e.poner('conectarPPP()'), 'sinacceso');
  const f = entorno();
  await sesionLista(f);
  f.ponerRed({ ok: false, error: 'servidor' });
  assert.equal(await f.poner('conectarPPP()'), 'error');
});
test('error de red con cargador · «error», sin cegar por acceso', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed({ __falla: new TypeError('Failed to fetch') });
  assert.equal(await e.poner('conectarObra()'), 'error');
  assert.equal(e.ev('KPIHEX_BOT[7].src'), 'motor de obra sin respuesta válida');
});
test('sin código de menú · ni siquiera se pide la copia (la copia no concede permisos)', async () => {
  const e = entorno(canje('PT'));
  await sesionLista(e);
  conCopia(e, 'tablero:Obra', cuerpoObra(), 5 * MIN);
  assert.equal(await e.poner('conectarObra()'), 'sinacceso');
  assert.equal(e.cargador.llamadas.length, 0);
  assert.equal(e.ev('OBRD'), null);
  assert.equal(e.ev('KPIHEX_BOT[7].src'), 'sin código de este módulo');
});

/* ═══════════════════════════ dato-negado ═══════════════════════════ */
test('dato-negado · sin poder recargar: la fuente pasa a «Sin acceso» y su conector corre sin pedir nada', async () => {
  const e = entorno({ sinRecarga: true });
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(), 5 * MIN);
  e.ponerRed({ __colgada: true });
  correrUna(e, 'PPP');
  await soltar();
  assert.equal(e.estado('PPP'), 'cache');
  const antes = e.cargador.llamadas.length;
  e.emitir('yodcargador:dato-negado', { clave: 'memo:tablero:PPP', error: 'sin_acceso' });
  await soltar();
  assert.equal(e.estado('PPP'), 'sinacceso');
  assert.equal(e.cargador.llamadas.length, antes, 'no vuelve a pedir una fuente negada');
  assert.equal(e.ev('KPIHEX_TOP[1].st'), 'ciego');
  assert.equal(e.ev('KPIHEX_TOP[1].src'), 'acceso no autorizado a esta fuente');
  assert.match(e.pastillas(), /Sin acceso: PPP/);
  assert.equal(e.ev('NEGADO.PPP'), 'sin_acceso');
});
test('dato-negado con datos ya pintados · el tablero se recarga (una vez por minuto) para no dejar la copia en pantalla', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(), 5 * MIN);
  e.ponerRed({ __colgada: true });
  correrUna(e, 'PPP');
  await soltar();
  e.emitir('yodcargador:dato-negado', { clave: 'memo:tablero:PPP', error: 'sin_acceso' });
  assert.equal(e.recargas.length, 1);
  assert.equal(e.sesionLocal.get('yodTbRecarga'), String(Date.UTC(2026, 9, 31, 12, 10, 0)));
  // un segundo aviso pocos segundos después no repite la recarga: cae al camino literal
  e.poner('NEGADO.PPP=null');
  e.emitir('yodcargador:dato-negado', { clave: 'memo:tablero:PPP', error: 'sin_acceso' });
  await soltar();
  assert.equal(e.recargas.length, 1, 'sin bucle de recargas');
  assert.equal(e.estado('PPP'), 'sinacceso');
});
test('dato-negado de una fuente que ya estaba «Sin acceso», de otra clave o vacío · se ignora', async () => {
  const e = entorno(canje('PT'));
  await sesionLista(e);
  correrUna(e, 'Obra');
  await soltar();
  assert.equal(e.estado('Obra'), 'sinacceso');
  e.emitir('yodcargador:dato-negado', { clave: 'memo:tablero:Obra', error: 'sin_acceso' });
  e.emitir('yodcargador:dato-negado', { clave: 'memo:otra-cosa:X', error: 'sin_acceso' });
  e.emitir('yodcargador:dato-negado', {});
  await soltar();
  assert.equal(e.recargas.length, 0);
  assert.equal(e.ev('NEGADO.Obra'), undefined);
});

/* ═══════════════════════════ sesión rechazada, cerrada o cambiada ═══════════════════════════ */
test('sesion-rechazada · el tablero se cierra (candado con mensaje, #w oculto, datos fuera) y NO borra pyod_clave_v1', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed(() => cuerpoPPP());
  e.poner('abrir()');
  await soltar();
  assert.equal(e.el.gate.classList.contains('off'), true, 'abierto');
  assert.match(e.pastillas(), /fu-ok/);
  e.emitir('yodcargador:sesion-rechazada', { error: 'revocado', token: 'tok-sintetico' });
  assert.equal(e.el.w.style.display, 'none');
  assert.equal(e.el.gate.classList.contains('off'), false, 'el candado vuelve');
  assert.match(e.el.gateErr.textContent, /La sesión venció/);
  assert.equal(e.el.gateMsg.textContent, 'El tablero de la operación.');
  assert.equal(e.el.fuentes.innerHTML, '', 'el resumen de fuentes sale de pantalla');
  assert.equal(e.el.f.innerHTML, '');
  assert.deepEqual(e.quitadas, [], 'regla 5: pyod_clave_v1 no se toca');
  assert.equal(e.almacenLocal.get('pyod_clave_v1'), 'tok-sintetico');
  assert.equal(e.ev('SESION'), null);
  assert.equal(e.ev('CLAVE_OK'), null);
  assert.equal(e.ev('CERRADO'), true);
  assert.equal(e.ev('puedo("SYS-POTENCIALES")'), false);
  assert.ok(e.ctx.avisos >= 1, 'se le avisó el alto al OS');
  // un refresco que llegue tarde ya no vuelve a correr nada
  const n = e.cargador.llamadas.length;
  e.emitir('yodcargador:dato', { clave: 'memo:tablero:PPP', origen: 'red', data: cuerpoPPP(9, 9), igual: false });
  e.emitir('yodcargador:dato-negado', { clave: 'memo:tablero:PPP', error: 'sin_acceso' });
  await soltar();
  assert.equal(e.cargador.llamadas.length, n);
  assert.equal(e.recargas.length, 0);
});
test('sesion-rechazada mientras valida (candado en «Verificando acceso…») · muestra el mensaje y quita «validando»', () => {
  const e = entorno();
  e.el.gate.classList.add('validando');
  e.emitir('yodcargador:sesion-rechazada', { error: 'expirado' });
  assert.equal(e.el.gate.classList.contains('validando'), false);
  assert.match(e.el.gateErr.textContent, /La sesión venció/);
});
test('sesion-rechazada sin código, o con «sin acceso», dice lo que pasó', () => {
  const a = entorno();
  a.emitir('yodcargador:sesion-rechazada', {});
  assert.match(a.el.gateErr.textContent, /La sesión venció/, 'sin código: revocado');
  const b = entorno();
  b.emitir('yodcargador:sesion-rechazada', { error: 'sin_acceso' });
  assert.match(b.el.gateErr.textContent, /no tiene acceso/);
});
test('sesion-cerrada · también cierra el tablero', async () => {
  const e = entorno();
  await sesionLista(e);
  e.emitir('yodcargador:sesion-cerrada', { motivo: 'salir' });
  assert.equal(e.el.w.style.display, 'none');
  assert.match(e.el.gateErr.textContent, /sesión se cerró/);
  assert.deepEqual(e.quitadas, []);
});
test('sesion con los mismos boards/rol (aunque cambie el orden o la capitalización) · no hace nada', async () => {
  const e = entorno(canje('PT,RM'));
  await sesionLista(e);
  e.ponerRed(() => cuerpoPPP());
  e.poner('abrir()');
  await soltar();
  const n = e.cargador.llamadas.length;
  e.emitir('yodcargador:sesion', { ok: true, rol: 'EDITOR', boards: 'rm, pt', origen: 'red', edadMs: 0 });
  await soltar();
  assert.equal(e.cargador.llamadas.length, n);
  assert.equal(e.recargas.length, 0);
});
test('sesion con más boards · SESION se actualiza, se limpian las negaciones y los conectores vuelven a preguntar puedo()', async () => {
  const e = entorno(canje('PT'));
  await sesionLista(e);
  e.ponerRed(ruta(e, { OBRA_GAS: cuerpoObra }));
  e.poner('abrir()');
  await soltar();
  assert.equal(e.estado('Obra'), 'sinacceso', 'sin OB');
  e.poner('NEGADO.Obra="sin_acceso"');
  e.emitir('yodcargador:sesion', { ok: true, rol: 'editor', boards: 'PT,OB', origen: 'red', edadMs: 0 });
  await soltar();
  assert.deepEqual(JSON.parse(json(e.ev('SESION'))), { boards: 'PT,OB', rol: 'editor' });
  assert.equal(e.ev('NEGADO.Obra'), undefined);
  assert.equal(e.recargas.length, 0, 'sólo se amplió el permiso: nada que retirar');
  assert.equal(e.estado('Obra'), 'ok', 'Obra ya se consulta');
  assert.ok(e.cargador.llamadas.some(l => l.clave === 'tablero:Obra'));
});
test('sesion con menos boards y datos ya pintados · recarga limpio (una vez por minuto); si no puede, los conectores cierran lo retirado', async () => {
  const e = entorno(canje('PT,OB'));
  await sesionLista(e);
  e.ponerRed(ruta(e, { OBRA_GAS: cuerpoObra }));
  e.poner('abrir()');
  await soltar();
  assert.equal(e.estado('Obra'), 'ok');
  e.emitir('yodcargador:sesion', { ok: true, rol: 'editor', boards: 'PT', origen: 'red', edadMs: 0 });
  await soltar();
  assert.equal(e.recargas.length, 1);
  // segunda vez sin pasar el minuto: no recarga, vuelve a evaluar y la fuente retirada queda «Sin acceso»
  e.emitir('yodcargador:sesion', { ok: true, rol: 'editor', boards: 'PT,OB', origen: 'red', edadMs: 0 });
  e.emitir('yodcargador:sesion', { ok: true, rol: 'editor', boards: 'PT', origen: 'red', edadMs: 0 });
  await soltar();
  assert.equal(e.recargas.length, 1, 'una recarga por minuto');
  assert.equal(e.estado('Obra'), 'sinacceso');
  assert.equal(e.ev('KPIHEX_BOT[7].src'), 'sin código de este módulo');
  // pasado el minuto, otra retirada sí puede recargar
  e.reloj.mover(61000);
  e.emitir('yodcargador:sesion', { ok: true, rol: 'editor', boards: 'PT,OB', origen: 'red', edadMs: 0 });
  await soltar();
  assert.equal(e.estado('Obra'), 'ok');
  e.emitir('yodcargador:sesion', { ok: true, rol: 'editor', boards: 'PT', origen: 'red', edadMs: 0 });
  assert.equal(e.recargas.length, 2);
});
test('sesion antes de abrir · sólo actualiza SESION (abrir() evaluará con la nueva)', async () => {
  const e = entorno();
  await sesionLista(e);
  e.emitir('yodcargador:sesion', { ok: true, rol: 'admin', boards: '*', origen: 'red', edadMs: 0 });
  await soltar();
  assert.deepEqual(JSON.parse(json(e.ev('SESION'))), { boards: '*', rol: 'admin' });
  assert.equal(e.cargador.llamadas.length, 0);
});
test('sesion no-ok o con el tablero cerrado · se ignora', async () => {
  const e = entorno();
  await sesionLista(e);
  e.emitir('yodcargador:sesion', { ok: false, error: 'red' });
  e.emitir('yodcargador:sesion', {});
  assert.deepEqual(JSON.parse(json(e.ev('SESION'))), { boards: 'PT,RM,TA,CO,OB', rol: 'editor' });
  e.emitir('yodcargador:sesion-cerrada', {});
  e.emitir('yodcargador:sesion', { ok: true, rol: 'admin', boards: '*' });
  assert.equal(e.ev('SESION'), null, 'cerrado no se reabre solo');
});
test('escucharCargador registra 5 oyentes con cargador y ninguno en legacy / v1 / sin cargador', () => {
  const e = entorno();
  assert.deepEqual(Object.keys(e.oyentes).sort(), ['yodcargador:dato', 'yodcargador:dato-negado', 'yodcargador:sesion', 'yodcargador:sesion-cerrada', 'yodcargador:sesion-rechazada']);
  for (const op of [{ cargador: false }, { cargadorOp: { legacy: true } }, { cargadorOp: { v: '1' } }]) {
    assert.deepEqual(Object.keys(entorno(op).oyentes), [], JSON.stringify(op));
  }
});
test('los oyentes no truenan con avisos incompletos (ninguno cae en el try/catch que los envuelve)', async () => {
  const e = entorno();
  await sesionLista(e);
  e.avisos.length = 0;
  for (const n of Object.keys(e.oyentes)) for (const f of e.oyentes[n]) { f({}); f({ detail: null }); f({ detail: { clave: 5 } }); f({ detail: { clave: 'memo:tablero:PPP' } }); }
  assert.deepEqual(e.avisos, []);
});

/* ═══════════════════════════ telemetría ═══════════════════════════ */
test('telemetría · primerDato UNA vez, cuando la primera fuente pinta datos reales; «cache» si salió de una copia', async () => {
  const e = entorno();
  e.reloj.mover(10 * MIN);
  await sesionLista(e);
  conCopia(e, 'tablero:PPP', cuerpoPPP(), 5 * MIN);
  e.ponerRed({ __colgada: true });
  correrUna(e, 'PPP');
  await soltar();
  assert.deepEqual(e.cargador.primerDatos, ['cache']);
  e.poner('correrFuente(FUENTES_DEF[0])');
  await soltar();
  assert.deepEqual(e.cargador.primerDatos, ['cache'], 'una sola vez por página');
});
test('telemetría · una fuente que no pintó datos (error, sin acceso, sin datos) no cuenta como primer dato', async () => {
  const e = entorno();
  await sesionLista(e);
  e.ponerRed({ ok: false, error: 'servidor' });
  correrUna(e, 'PPP');
  await soltar();
  assert.deepEqual(e.cargador.primerDatos, []);
  e.ponerRed(() => cuerpoPPP());
  e.poner('correrFuente(FUENTES_DEF[0])');
  await soltar();
  assert.deepEqual(e.cargador.primerDatos, ['red']);
});
test('telemetría · con el camino viejo también mide («red») si hay cargador v1 en la página; sin cargador no truena', async () => {
  const v1 = entorno({ cargadorOp: { v: '1' } });
  v1.poner('CLAVE_OK="tok-sintetico"');
  v1.ponerRed(() => cuerpoPPP());
  correrUna(v1, 'PPP');
  await soltar();
  assert.deepEqual(v1.cargador.primerDatos, ['red']);
  const sin = entorno({ cargador: false });
  sin.poner('CLAVE_OK="tok-sintetico"');
  sin.ponerRed(() => cuerpoPPP());
  correrUna(sin, 'PPP');
  await soltar();
  assert.equal(sin.estado('PPP'), 'ok');
});

/* ═══════════════════════════ legacy (sin cargador v2) ═══════════════════════════ */
for (const modo of ['sin cargador', 'cargador v1', '?cargador=legacy']) {
  const op = modo === 'sin cargador' ? { cargador: false } : modo === 'cargador v1' ? { cargadorOp: { v: '1' } } : { cargadorOp: { legacy: true } };
  test('legacy (' + modo + ') · las fuentes piden lo de siempre, sin recordar y sin copia', async () => {
    const e = entorno(op);
    e.poner('CLAVE_OK="tok-sintetico"');
    e.ponerRed(url => (url.includes('recurso=board') ? cuerpoPPP() : { ok: false, error: 'servidor' }));
    assert.equal(await e.poner('conectarPPP()'), 'ok');
    assert.equal(e.llamadasFetch.length, 1);
    assert.match(e.llamadasFetch[0].url, /recurso=board&k=tok-sintetico/);
    assert.equal(e.ev('ORIGEN.PPP'), 'red');
    assert.equal(e.cargador ? (e.cargador.llamadas || []).length : 0, 0);
  });
}
test('legacy · candado: el segundo intento va al ORIGINAL a los 1.5 s (nunca al respaldo) y GATE_GAS no cambia', async () => {
  const e = entorno({ cargador: false });
  let n = 0;
  e.ponerRed(() => (++n === 1 ? { __falla: new TypeError('Failed to fetch') } : { ok: true, items: [] }));
  const p = e.poner('validar("tok-sintetico")');
  await soltar();
  assert.equal(e.llamadasFetch.length, 1, 'todavía esperando');
  await e.reloj.avanzar(1499);
  assert.equal(e.llamadasFetch.length, 1);
  await e.reloj.avanzar(1);
  await p;
  assert.equal(e.llamadasFetch.length, 2);
  for (const l of e.llamadasFetch) assert.match(l.url, /^https:\/\/example\.invalid\/portero\?recurso=track&track=alysa&k=tok-sintetico$/);
  assert.ok(!e.llamadasFetch.some(l => l.url.includes('respaldo')), 'nunca el respaldo');
  assert.equal(e.ev('GATE_GAS'), 'https://example.invalid/portero');
  assert.equal(e.ev('CLAVE_OK'), 'tok-sintetico');
});
test('legacy · candado: dos fallos → «red»; un rechazo explícito es concluyente (sin segundo intento)', async () => {
  const e = entorno({ cargador: false });
  e.ponerRed({ __falla: new TypeError('Failed to fetch') });
  const p = e.poner('validar("tok-sintetico")');
  const r = assert.rejects(p, x => x === 'red');
  await e.reloj.avanzar(1500);
  await r;
  assert.equal(e.llamadasFetch.length, 2);
  const f = entorno({ cargador: false });
  f.ponerRed({ ok: false, error: 'clave' });
  await assert.rejects(f.poner('validar("tok-sintetico")'), x => x === 'clave');
  assert.equal(f.llamadasFetch.length, 1);
  assert.equal(f.reloj.pendientes(), 0);
});
test('legacy · el candado también sirve con el cargador v1 de main (no tiene recordar: no hay canje compartido que usar)', async () => {
  const e = entorno({ cargadorOp: { v: '1' }, red: { ok: true, items: [] } });
  await sesionLista(e);
  assert.equal(e.cargador.canjes, 0);
  assert.equal(e.llamadasFetch.length, 1);
  assert.equal(e.ev('SESION'), null);
  assert.equal(e.ev('puedo("SYS-OBRA")'), true, 'suelto, sin códigos: como hoy');
});
test('sondaFinance · sólo para Dirección: rol admin del canje (sin cargador, el ?rol= de la liga del OS)', async () => {
  const a = entorno({ cargador: false, rol: 'admin' });
  a.poner('CLAVE_OK="tok-sintetico"');
  await a.poner('sondaFinance()');
  assert.equal(a.llamadasFetch.length, 1);
  assert.equal(a.llamadasFetch[0].url, SONDA_URL);
  const b = entorno({ cargador: false, rol: 'editor' });
  b.poner('CLAVE_OK="tok-sintetico"');
  await b.poner('sondaFinance()');
  assert.equal(b.llamadasFetch.length, 0, 'ya no manda el token a Tesorería a quien no es Dirección');
  const c = entorno({ cargador: false });
  c.poner('CLAVE_OK="tok-sintetico"');
  await c.poner('sondaFinance()');
  assert.equal(c.llamadasFetch.length, 0, 'suelto, sin rol: tampoco');
  const d = entorno(Object.assign({ rol: 'editor' }, canje('*', 'admin')));
  await sesionLista(d);
  await d.poner('sondaFinance()');
  assert.equal(d.llamadasFetch.length, 1, 'con cargador manda el rol del canje, no el de la liga');
  const f = entorno();
  await sesionLista(f);
  await f.poner('sondaFinance()');
  assert.equal(f.llamadasFetch.length, 0, 'rol editor del canje');
  const g = entorno({ rol: 'admin' });
  await g.poner('sondaFinance()');
  assert.equal(g.llamadasFetch.length, 0, 'con cargador y sin canje resuelto: nada, aunque la liga diga admin');
});
test('abrir() · la sonda de Tesorería sale sólo si el canje dice admin', async () => {
  const admin = entorno(canje('*', 'admin'));
  await sesionLista(admin);
  admin.poner('abrir()');
  await soltar();
  assert.ok(admin.llamadasFetch.some(l => l.url === SONDA_URL), 'Dirección: sale');
  const editor = entorno(canje('PT,RM,TA,CO,OB', 'editor'));
  await sesionLista(editor);
  editor.poner('abrir()');
  await soltar();
  assert.ok(!editor.llamadasFetch.some(l => l.url === SONDA_URL), 'editor: no sale');
});

/* ═══════════════════════════ la chinche después del primer dato ═══════════════════════════ */
function montarChinche(cargador, { yaCargada = false } = {}) {
  const tag = /<script type="text\/plain" id="yodChincheSrc" src="(chinche\.js\?v=[^"]+)"><\/script>/.exec(html);
  assert.ok(tag, 'etiqueta inerte con id yodChincheSrc');
  const llamadas = [], cabeza = [], inits = [];
  const ctx = vm.createContext({
    document: { getElementById: id => (id === 'yodChincheSrc' ? { getAttribute: () => tag[1] } : null),
      createElement: () => ({}), body: { appendChild: s => { cabeza.push(s); } } },
    CV: {}, LZ: {}, VISTA: 'abaco', EMBED: true, window: null
  });
  ctx.window = ctx;
  const cargarChinche = () => { ctx.YODChinche = { init: o => inits.push(o) }; };
  if (yaCargada) cargarChinche();
  if (cargador) ctx.YodCargador = cargador(llamadas);
  vm.runInContext(CHINCHE_BLOQUE, ctx);
  return { src: tag[1], llamadas, cabeza, inits, cargarChinche };
}
test('chinche · la etiqueta es inerte (text/plain): el navegador no la baja y versiones.cjs sigue gobernando su ?v=', () => {
  assert.match(html, /<script type="text\/plain" id="yodChincheSrc" src="chinche\.js\?v=[^"]+"><\/script>/);
  assert.doesNotMatch(html, /<script src="chinche\.js/, 'ya no se baja de forma síncrona');
});
test('chinche · sin cargador, o con ?cargador=legacy, se inserta en el acto y arranca en cuanto carga', () => {
  for (const c of [null, () => ({ v: '2', legacy: true, cargarDespues() { throw new Error('no debe llamarse'); } })]) {
    const m = montarChinche(c);
    assert.equal(m.cabeza.length, 1);
    assert.equal(m.cabeza[0].src, m.src);
    m.cargarChinche(); m.cabeza[0].onload();
    assert.equal(m.inits.length, 1);
    assert.equal(m.inits[0].pantalla, 'tablero');
    assert.equal(m.inits[0].sinPastilla, true, 'embebido: manda la pastilla del portal');
    assert.equal(m.inits[0].vista(), 'abaco');
    m.cabeza[0].onload();
    assert.equal(m.inits.length, 1, 'init una sola vez');
  }
});
test('chinche · con cargador se difiere a después del primer dato (tope 4 s) y no se inserta a mano', async () => {
  let entrega;
  const m = montarChinche(ll => ({ v: '2', legacy: false, cargarDespues: (...a) => { ll.push(a); return new Promise(r => { entrega = r; }); } }));
  assert.equal(m.cabeza.length, 0);
  assert.equal(json(m.llamadas), json([[m.src, { cuando: 'primer-dato', maxMs: 4000 }]]));
  entrega({ addEventListener() {} });
  await soltar();
  assert.equal(m.cabeza.length, 0, 'tampoco después: la inserta el cargador');
});
test('chinche · si el script ya cargó cuando el cargador contesta arranca YA; si no, espera su «load»', async () => {
  let entrega, oyente = null;
  const ya = montarChinche(ll => ({ v: '2', legacy: false, cargarDespues: (...a) => { ll.push(a); return new Promise(r => { entrega = r; }); } }), { yaCargada: true });
  entrega({ addEventListener() { throw new Error('no hacía falta esperar'); } });
  await soltar();
  assert.equal(ya.inits.length, 1);
  const tarde = montarChinche(ll => ({ v: '2', legacy: false, cargarDespues: (...a) => { ll.push(a); return new Promise(r => { entrega = r; }); } }));
  entrega({ addEventListener: (n, f, o) => { oyente = [n, f, o]; } });
  await soltar();
  assert.equal(tarde.inits.length, 0);
  assert.deepEqual(JSON.parse(json([oyente[0], oyente[2]])), ['load', { once: true }]);
  tarde.cargarChinche(); oyente[1]();
  assert.equal(tarde.inits.length, 1);
});
test('chinche · si cargarDespues falla, se inserta como siempre', async () => {
  const m = montarChinche(() => ({ v: '2', legacy: false, cargarDespues: () => Promise.reject(new Error('carga')) }));
  await soltar();
  assert.equal(m.cabeza.length, 1);
  assert.equal(m.cabeza[0].src, m.src);
});

/* ═══════════════════════════ el HTML ═══════════════════════════ */
test('el cargador se carga en el <head>, justo después de yod-acceso.js y antes del código propio, con la etiqueta vigente', () => {
  const versiones = JSON.parse(fs.readFileSync(path.join(raiz, 'os', 'versiones.json'), 'utf8'));
  const lineas = html.split('\n');
  const i = lineas.findIndex(l => l.includes('os/yod-acceso.js'));
  assert.ok(i > 0 && i < 6);
  assert.equal(lineas[i + 1], '<script src="os/yod-cargador.js?v=' + versiones.propia + '"></script>');
  assert.ok(html.indexOf('os/yod-cargador.js') < html.indexOf('<script>'), 'antes del código propio de la página');
});
test('el respaldo muerto salió del tablero: ni la dirección ni PORTERO_RESPALDO ni «let GATE_GAS»', () => {
  assert.doesNotMatch(html, /PORTERO_RESPALDO|YOD_PORTERO\|\|\{\}\)\.respaldo/);
  assert.doesNotMatch(html, /let GATE_GAS/);
  assert.match(html, /const GATE_GAS=PORTERO_ORIGINAL;/);
});
test('el tablero nunca borra pyod_clave_v1 con el cargador activo (regla 5): el único borrado literal es del camino legacy', () => {
  const borrados = html.match(/localStorage\.removeItem\(LSK\)/g) || [];
  assert.equal(borrados.length, 1);
  assert.match(html, /e==="clave" && !EMBED && !cargadorActivo\(\)\)\{ try\{ localStorage\.removeItem\(LSK\)/);
});
test('ningún id de Apps Script nuevo: las direcciones /exec del tablero son las mismas que en la base', () => {
  const ids = s => [...s.matchAll(/macros\/s\/(AKfy[\w-]+)\/exec/g)].map(m => m[1]).sort();
  const base = require('node:child_process').execFileSync('git', ['show', 'f79867a:tablero.html'], { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const antes = ids(base), ahora = ids(html);
  assert.ok(ahora.length >= 6);
  for (const id of ahora) assert.ok(antes.includes(id), 'id nuevo: ' + id.slice(0, 8) + '…');
});
