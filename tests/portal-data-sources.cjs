'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../tablero.html'), 'utf8');
const start = html.indexOf('function estadoErrorFuente(');
const end = html.indexOf('/* ═══ SONDA finance');
const marks = html.slice(html.indexOf('const FUENTES={};'), html.indexOf('function abrir(){'));
assert.ok(start > 0 && end > start, 'No se encontró el bloque real de conectores');
const names = ['PPP', 'Miramar', 'Obra', 'Tracks', 'Taller', 'Codes', 'CRM'];

function harness({ payload = { ok: false, error: 'servidor' }, allow = true, cache = {}, fail, http = 200 } = {}) {
  const box = { innerHTML: '' }, calls = [];
  const context = vm.createContext({
    console: { log() {}, warn() {} },
    document: { getElementById() { return box; } },
    localStorage: { getItem(k) { return cache[k] || null; } },
    puedo: () => allow,
    pintar() {}, recalcularRecien() {}, prepararBajadas() {}, setLeadsCRM() {},
    cifra: v => v === null || v === undefined || v === '' ? null : v,
    cegar: (list, ids, reason) => ids.forEach(i => { list[i] = { st: 'ciego', src: reason }; }),
    KPIHEX_TOP: Array.from({ length: 8 }, () => ({})),
    KPIHEX_BOT: Array.from({ length: 8 }, () => ({})),
    ORIG: Array.from({ length: 5 }, () => ({})), PROJ: [{}, {}, {}],
    TRAD: null, TALD: null, ARCD: [], CODM: null, CRMEST: '', MOVIDOS: 0,
    CLAVE_OK: 'synthetic-token', GATE_GAS: 'https://example.invalid/exec', DIA_GRAVE: 60, DIA_ALARMA: 30,
    fetch: async (...args) => {
      calls.push(args);
      if (fail) throw fail;
      const body = typeof payload === 'function' ? payload(...args) : payload;
      return { ok: http >= 200 && http < 300, status: http, json: async () => body };
    }
  });
  vm.runInContext(html.slice(start, end) + '\n' + marks, context);
  return { context, calls, box };
}

for (const name of names) {
  test(name + ': excepción de transporte no se anuncia como éxito', async () => {
    const { context } = harness({ fail: new Error('synthetic network failure') });
    assert.equal(await context['conectar' + name](), 'error');
  });
  test(name + ': rechazo explícito de credencial no se etiqueta como backend caído', async () => {
    const { context } = harness({ payload: { ok: false, error: 'liga' } });
    assert.equal(await context['conectar' + name](), 'sinacceso');
  });
  test(name + ': HTTP 403 se trata como falta de acceso', async () => {
    const { context } = harness({ http: 403 });
    assert.equal(await context['conectar' + name](), 'sinacceso');
  });
}

for (const name of names) {
  test(name + ': sin permiso de menú no consulta la fuente', async () => {
    const { context, calls } = harness({ allow: false });
    assert.equal(await context['conectar' + name](), 'sinacceso');
    assert.equal(calls.length, 0);
  });
}

test('PPP distingue campos ausentes de conteos cero válidos', async () => {
  const partial = harness({ payload: { ok: true, kpis: {}, actividad_por_dia: [] } });
  assert.equal(await partial.context.conectarPPP(), 'incompleto');
  const valid = harness({ payload: { ok: true, kpis: { clientes: 0, agendadas: 0 }, actividad_por_dia: [] } });
  assert.equal(await valid.context.conectarPPP(), 'ok');
});

test('Miramar distingue una respuesta vacía de un error de transporte', async () => {
  const { context } = harness({ payload: { ok: true, tablas: { TRAMITES: [], LOTES: [] } } });
  assert.equal(await context.conectarMiramar(), 'sindatos');
});

test('Miramar conserva cálculos de trámites e inventario cuando ambas tablas llegan', async () => {
  const { context } = harness({ payload: { ok: true, tablas: {
    TRAMITES: [{ estado: 'verde' }, { estado: 'rojo' }],
    LOTES: [{ estado: 'apartado', lote_id: 'SYNTH-1' }, { estado: 'vendido', lote_id: 'SYNTH-2' }]
  } } });
  assert.equal(await context.conectarMiramar(), 'ok');
  assert.equal(context.KPIHEX_BOT[0].n, '1/2');
  assert.equal(context.KPIHEX_BOT[5].n, '1/2');
  assert.equal(context.ORIG[3].p, 2);
});

test('Obra sin avance no certifica una fuente completa', async () => {
  const { context } = harness({ payload: { ok: true, kpi: {}, frentes: {} } });
  assert.equal(await context.conectarObra(), 'incompleto');
});

test('Obra conserva avance cero como medida válida', async () => {
  const { context } = harness({ payload: { ok: true, kpi: { avance: 0, importe: 100, ejecutado: 0 }, frentes: {} } });
  assert.equal(await context.conectarObra(), 'ok');
  assert.equal(context.KPIHEX_BOT[7].n, '0.0%');
});

test('Tracks detecta fallo de un solo track aunque allSettled resuelva', async () => {
  const { context } = harness({ payload: url => url.includes('track=alysa') ? { ok: true, items: [{ estado: 'hecho' }] } : { ok: false, error: 'servidor' } });
  assert.equal(await context.conectarTracks(), 'error');
  assert.equal(context.PROJ[0].f, '1/1');
  assert.equal(context.PROJ[2].f, '—');
});

test('Tracks vacíos tienen estado sin datos', async () => {
  const { context } = harness({ payload: { ok: true, items: [] } });
  assert.equal(await context.conectarTracks(), 'sindatos');
});

test('Tracks con datos conservan proporción de hitos hechos', async () => {
  const { context } = harness({ payload: { ok: true, items: [{ estado: 'hecho' }, { estado: 'pendiente' }] } });
  assert.equal(await context.conectarTracks(), 'ok');
  assert.equal(context.PROJ[0].f, '1/2');
  assert.equal(context.KPIHEX_BOT[3].n, '50%');
});

test('Taller no consume cache legacy sin identidad si el backend falla', async () => {
  const { context } = harness({ fail: new Error('offline'), cache: { 'aurum-cache-v5': JSON.stringify([{ estado: 'Terminado' }]) } });
  assert.equal(await context.conectarTaller(), 'error');
  assert.equal(context.KPIHEX_BOT[2].st, 'ciego');
});

test('Taller vacío es sin datos y Taller poblado es ok', async () => {
  assert.equal(await harness({ payload: { ok: true, tasks: [] } }).context.conectarTaller(), 'sindatos');
  assert.equal(await harness({ payload: { ok: true, tasks: [{ estado: 'Terminado' }] } }).context.conectarTaller(), 'ok');
});

test('Codes usa agregado válido y distingue falta de inversiones', async () => {
  const valid = harness({ payload: { ok: true, total: 1000, n: 1, recibido: 200, pct: 0.2 } });
  assert.equal(await valid.context.conectarCodes(), 'ok');
  assert.equal(valid.calls.length, 1);
  const empty = harness({ payload: { ok: true, data: { Inversiones: [] } } });
  assert.equal(await empty.context.conectarCodes(), 'sindatos');
});

test('Codes no consume respaldo legacy sin identidad', async () => {
  const { context } = harness({ fail: new Error('offline'), cache: { 'codeyod-cache-v1': JSON.stringify({ Inversiones: [{ folio: 'SYNTH-1', montoTotal: 100 }] }) } });
  assert.equal(await context.conectarCodes(), 'error');
});

test('CRM distingue conteos ausentes de respuesta vacía válida', async () => {
  assert.equal(await harness({ payload: { ok: true, leads: [] } }).context.conectarCRM(), 'incompleto');
  const { context } = harness({ payload: { ok: true, leads: [], kpis: { contratosADA: 0, total: 0, vanTarde: 0, enJuego: 0, dormidos: 0 } } });
  assert.equal(await context.conectarCRM(), 'sindatos');
  assert.equal(context.CRMEST, 'linea');
});

test('CRM poblado conserva sus indicadores', async () => {
  const { context } = harness({ payload: { ok: true,
    leads: [{ id: 'SYNTH-1', emb: 'ADA', filtro: 'CONTACTABLE', dias: 5 }],
    kpis: { contratosADA: 0, total: 1, vanTarde: 0, enJuego: 0, dormidos: 0 }
  } });
  assert.equal(await context.conectarCRM(), 'ok');
  assert.equal(context.KPIHEX_TOP[2].n, '1');
  assert.equal(context.CRMEST, 'linea');
});

test('Resumen distingue carga, consulta, datos guardados, sin permiso y fallos', () => {
  const { context, box } = harness();
  context.marcaFuente('CRM', null);
  assert.match(box.innerHTML, /Cargando 1 de 1/);
  context.marcaFuente('CRM', 'error');
  assert.match(box.innerHTML, /No se pudo consultar: CRM/);
  assert.doesNotMatch(box.innerHTML, /fu-ok|Datos al día/);
  context.marcaFuente('CRM', 'ok');
  context.marcaFuente('Taller', 'cache');
  context.marcaFuente('Obra', 'sinacceso');
  context.marcaFuente('Códigos', 'sindatos');
  assert.match(box.innerHTML, /Datos guardados, sin actualizar: Taller/);
  assert.match(box.innerHTML, /Sin acceso: Obra/);
  assert.match(box.innerHTML, /Sin datos: Códigos/);
  assert.doesNotMatch(box.innerHTML, /No se pudo consultar|Datos al día/);
});

test('Un conector sin estado explícito no puede producir éxito y nombres se escapan', () => {
  const { context, box } = harness();
  context.marcaFuente('<img src=x onerror=alert(1)>', undefined);
  assert.match(box.innerHTML, /No se pudo consultar/);
  assert.doesNotMatch(box.innerHTML, /<img|fu-ok/);
});

test('abrir transmite el estado real de cada conector al resumen', async () => {
  const { context, box } = harness();
  Object.assign(context, {
    GT: { classList: { add() {} } },
    document: { getElementById(id) { return id === 'w' ? { style: {} } : box; } },
    sondaFinance() {}, avisarAlto() {}, setTimeout() {}, addEventListener() {}
  });
  for (const name of names) context['conectar' + name] = async () => name === 'CRM' ? 'error' : 'sinacceso';
  vm.runInContext(html.slice(html.indexOf('function abrir(){'), html.indexOf('async function entrar(){')), context);
  context.abrir();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(box.innerHTML, /No se pudo consultar: CRM/);
  assert.match(box.innerHTML, /Sin acceso/);
  assert.doesNotMatch(box.innerHTML, /fu-ok|Datos al día|Cargando/);
});
