'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../os/maquinas.js'), 'utf8');
const NOW = Date.parse('2026-09-30T18:00:00Z');
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return NOW; } }

function harness({ age = 0, conclusion = 'success', status = 'completed', empty = false, malformed = false, fail = false, http = 200, stored = null, runOverrides = {} } = {}) {
  const nodes = { 'maquinas-lista': { innerHTML: '' }, 'maquinas-resumen': { textContent: '' } };
  let saved, calls = 0;
  const context = vm.createContext({
    Date: Clock, AbortController, setTimeout, clearTimeout,
    window: {},
    document: { readyState: 'loading', addEventListener() {}, getElementById(id) { return nodes[id]; } },
    sessionStorage: {
      getItem() { return stored; },
      setItem(key, value) { saved = { key, value: JSON.parse(value) }; }
    },
    fetch: async url => {
      calls++;
      if (fail) throw new Error('offline');
      const repo = /\/repos\/(.*?)\/actions\//.exec(url)[1];
      return {
        ok: http === 200, status: http,
        json: async () => malformed ? {} : { workflow_runs: empty ? [] : [{
          status, conclusion, updated_at: new Date(NOW - age).toISOString(),
          html_url: 'https://github.com/' + repo + '/actions/runs/1234', ...runOverrides
        }] }
      };
    }
  });
  vm.runInContext(source, context);
  return { api: context.window.YodMaquinas, nodes, get saved() { return saved; }, get calls() { return calls; } };
}

test('Todas las consultas fallidas dejan estado por verificar, sin certificar salud', async () => {
  const h = harness({ fail: true });
  await h.api.carga(true);
  assert.match(h.nodes['maquinas-resumen'].textContent, /8 máquinas por verificar/);
  assert.doesNotMatch(h.nodes['maquinas-resumen'].textContent, /en orden|correctas/);
  assert.doesNotMatch(h.nodes['maquinas-lista'].innerHTML, /mq-verde/);
});

test('Sin corridas y payload incompleto no son éxito', async () => {
  for (const option of [{ empty: true }, { malformed: true }, { http: 403 }, { http: 404 }]) {
    const h = harness(option);
    await h.api.carga(true);
    assert.match(h.nodes['maquinas-resumen'].textContent, /por verificar/);
    assert.doesNotMatch(h.nodes['maquinas-lista'].innerHTML, /mq-verde/);
  }
});

test('Success reciente describe la última ejecución, sin prometer frescura del negocio', async () => {
  const h = harness();
  await h.api.carga(true);
  assert.equal(h.nodes['maquinas-resumen'].textContent, 'Últimas ejecuciones correctas');
  assert.equal((h.nodes['maquinas-lista'].innerHTML.match(/mq-verde/g) || []).length, 8);
  assert.doesNotMatch(h.nodes['maquinas-lista'].innerHTML, /Todas las máquinas en orden/);
});

test('Las tareas horarias antiguas dejan de estar verdes; despliegues por evento mantienen su último resultado', async () => {
  const h = harness({ age: 5 * 3600000 });
  await h.api.carga(true);
  const rows = h.saved.value.filas;
  assert.equal(rows.find(r => r.mq.w === 'vigia-diario.yml').color, 'ambar');
  assert.equal(rows.find(r => r.mq.w === 'refresh-board.yml').color, 'ambar');
  assert.equal(rows.find(r => r.mq.w === 'sala-cada-hora.yml').color, 'ambar');
  assert.equal(rows.find(r => r.mq.w === 'sala-diario.yml').color, 'verde');
  assert.equal(rows.find(r => r.mq.w === 'verificar.yml').color, 'verde');
  assert.match(h.nodes['maquinas-resumen'].textContent, /3 máquinas por verificar/);
});

test('Sala diaria supera el umbral de 26 horas sin certificar una tarea detenida', async () => {
  const h = harness({ age: 27 * 3600000 });
  await h.api.carga(true);
  assert.equal(h.saved.value.filas.find(r => r.mq.w === 'sala-diario.yml').color, 'ambar');
});

test('Fallo, espera y ejecución activa quedan diferenciados', async () => {
  for (const [option, color, text] of [
    [{ conclusion: 'failure' }, 'rojo', 'fallaron'],
    [{ conclusion: 'cancelled' }, 'ambar', 'por verificar'],
    [{ conclusion: null, status: 'queued' }, 'ambar', 'por verificar'],
    [{ conclusion: null, status: 'in_progress' }, 'ambar', 'por verificar'],
    [{ conclusion: 'action_required' }, 'ambar', 'por verificar']
  ]) {
    const h = harness(option);
    await h.api.carga(true);
    assert.match(h.nodes['maquinas-resumen'].textContent, new RegExp(text));
    assert.equal(h.saved.value.filas[0].color, color);
  }
});

test('Fecha inválida o futura no puede producir verde', async () => {
  for (const updated_at of ['invalid', '2026-10-01T18:00:00Z']) {
    const h = harness({ runOverrides: { updated_at } });
    await h.api.carga(true);
    assert.doesNotMatch(h.nodes['maquinas-lista'].innerHTML, /mq-verde/);
    assert.match(h.nodes['maquinas-lista'].innerHTML, /fecha sin verificar/);
  }
});

test('Enlaces fuera del run de GitHub no se convierten en href', async () => {
  const h = harness({ runOverrides: { html_url: 'javascript:alert(1)' } });
  await h.api.carga(true);
  assert.doesNotMatch(h.nodes['maquinas-lista'].innerHTML, /href=/);
});

test('Cache vacía o corrupta dispara consulta y no muestra falso éxito', async () => {
  for (const stored of ['malformed', JSON.stringify({ t: NOW, filas: [] }), JSON.stringify({ t: NOW, filas: [{}] })]) {
    const h = harness({ stored, fail: true });
    await h.api.carga(false);
    assert.equal(h.calls, 8);
    assert.match(h.nodes['maquinas-resumen'].textContent, /por verificar/);
  }
});

test('Cache reciente se reutiliza y contenido se escapa antes de renderizar', async () => {
  const initial = harness();
  await initial.api.carga(true);
  const stored = initial.saved.value;
  stored.filas[0].txt = '<img src=x onerror=alert(1)>';
  stored.filas[0].url = 'https://example.invalid';
  const h = harness({ stored: JSON.stringify(stored) });
  await h.api.carga(false);
  assert.equal(h.calls, 0);
  assert.doesNotMatch(h.nodes['maquinas-lista'].innerHTML, /<img|example\.invalid/);
  assert.match(h.nodes['maquinas-lista'].innerHTML, /&lt;img/);
});
