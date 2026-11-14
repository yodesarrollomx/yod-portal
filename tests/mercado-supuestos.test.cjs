'use strict';
// PLAN-09 · «Supuestos para tus PPP» en el tablero de Mercado: plusvalía, absorción y corte salen de data.json.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '../mercado/hermosillo-2020-2030');
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const datos = JSON.parse(fs.readFileSync(path.join(DIR, 'data.json'), 'utf8'));

function linea(prefijo) {
  const l = html.split('\n').find(x => x.trim().startsWith(prefijo));
  assert.ok(l, 'falta ' + prefijo);
  return l.trim();
}
const ini = html.indexOf('  /* PLAN-09 · Supuestos para tus PPP');
const fin = html.indexOf("  fetch('data.json'", ini);
assert.ok(ini > 0 && fin > ini, 'no encontré las funciones de supuestos');
const codigo = [linea('const fmt ='), linea('const pct ='), linea('const esc_ ='), html.slice(ini, fin),
  'this.supuestosPPP = supuestosPPP; this.pintarSupuestosPPP = pintarSupuestosPPP;'].join('\n');

function pagina(d) {
  const caja = { innerHTML: '' }, sec = { hidden: true };
  const ctx = { Math, Number, String, Object, isFinite, isNaN, D: d,
    $: s => (s === '#supuestos-ppp' ? caja : s === '#sec-supuestos-ppp' ? sec : null) };
  vm.createContext(ctx); vm.runInContext(codigo, ctx);
  return { ctx, caja, sec };
}
const cerca = (a, b) => Math.abs(a - b) < 5e-4;

test('calcula plusvalía, absorción y corte con los números de data.json', () => {
  const s = pagina(datos).ctx.supuestosPPP(datos);
  const E = datos.equilibrio, P = (y, k) => E[y].P[k || 'base'].valor;
  assert.equal(s.ultimo, 2025);
  assert.equal(s.corte, 2026);
  assert.ok(cerca(s.plusvalia, P(2025) / P(2024) - 1));
  assert.ok(cerca(s.plusvaliaReal, P(2025, 'real') / P(2024, 'real') - 1));
  assert.ok(cerca(s.promedio, Math.pow(P(2025) / P(2022), 1 / 3) - 1));
  assert.ok(cerca(s.precioCorte, P(2026) / P(2025) - 1));
  assert.equal(s.absorcion, E['2025'].Q.base.valor);
  assert.ok(cerca(s.absorcionMes, E['2025'].Q.base.valor / 12));
  assert.equal(s.absorcionCorte, E['2026'].Q.base.valor);
  assert.equal(s.meses, Number(datos.meta.corte_sniiv.slice(5, 7)));
  assert.equal(s.corteSniiv, datos.meta.corte_sniiv);
  assert.equal(s.corteShf, E['2026'].P.base.fecha_corte);
});

test('pinta la tarjeta con las cifras y el corte que el PPP debe anotar', () => {
  const p = pagina(datos);
  p.ctx.pintarSupuestosPPP();
  const s = p.ctx.supuestosPPP(datos), h = p.caja.innerHTML, pct = x => (x > 0 ? '+' : '') + (x * 100).toFixed(1) + '%';
  assert.equal(p.sec.hidden, false);
  for (const t of [pct(s.plusvalia), pct(s.promedio), pct(s.plusvaliaReal), 'Absorción 2025', 'Absorción 2026 al corte',
    'SNIIV ' + datos.meta.corte_sniiv, 'SHF ' + s.corteShf, 'anota este corte']) assert.ok(h.includes(t), 'falta ' + t);
  assert.match(h, /todo el municipio/);
});

test('sin años observados no pinta nada y deja la tarjeta escondida', () => {
  const vacio = { meta: {}, equilibrio: { 2026: { estado: 'al corte' } } };
  const p = pagina(vacio);
  assert.equal(p.ctx.supuestosPPP(vacio), null);
  p.ctx.pintarSupuestosPPP();
  assert.equal(p.sec.hidden, true);
  assert.equal(p.caja.innerHTML, '');
});

test('un año faltante dice «—» y el texto de las fuentes va escapado', () => {
  const d = JSON.parse(JSON.stringify(datos));
  delete d.equilibrio['2024'];
  d.meta.corte_sniiv = '2026-07-31<img src=x onerror=1>';
  const p = pagina(d);
  p.ctx.pintarSupuestosPPP();
  const h = p.caja.innerHTML;
  assert.ok(h.includes('Plusvalía 2025</div><div class="grande">—'), 'la plusvalía sin 2024 debe ser «—»');
  assert.ok(!h.includes('<img'), 'el corte debe ir escapado');
  assert.ok(h.includes('&lt;img'));
});
