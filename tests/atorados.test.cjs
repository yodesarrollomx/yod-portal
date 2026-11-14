'use strict';
// os/atorados.js · lo atorado de asistentes (Buzón por el Portero) y personas (MOAC vencidas). Red y DOM sintéticos.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../os/atorados.js'), 'utf8');
const ops = fs.readFileSync(path.join(__dirname, '../os/adapters/operations.js'), 'utf8');
const AGENTES = [
  { origen: 'Mando', id: 'Mando 13', que: 'Súper Jarvis <b>', quien: 'Hermes · astra', estado: 'Atorado', dias: 4, siguiente: 'Pasarlo a Decisiones' },
  { origen: 'Tareas', id: 'SALA-12', que: 'Rehacer guion', frente: 'Sala', quien: 'Codex', estado: 'Tomada', dias: 2 },
  { origen: 'Tareas', id: 'PLAN-03', que: 'Primer externo', quien: 'Claude', estado: 'Bloqueada', dias: 0 }
];
function hoyMenos(d) { const t = new Date(); t.setDate(t.getDate() - d); return t; }
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function tarea(diasVencida, extra) {
  const f = hoyMenos(diasVencida);
  return Object.assign({ actividad: 'Tarea ' + diasVencida, responsable: 'Sayri', proyecto: 'Miramar', estado: 'Pendiente',
    fecha: String(f.getDate()), mes: MESES[f.getMonth()], anio: String(f.getFullYear()) }, extra || {});
}
function mundo(respuesta, { falla = false } = {}) {
  const pedidos = [];
  const caja = { hidden: true, html: '', set innerHTML(v) { this.html = v; }, get innerHTML() { return this.html; },
    querySelector: () => null };
  const head = { hijos: [], appendChild(n) { this.hijos.push(n); } };
  const ctx = { console, setTimeout, clearTimeout, AbortController, Promise, Date, Object, String, Array, JSON, Math, encodeURIComponent, parseInt, isFinite, Number,
    document: { head, createElement: () => ({ textContent: '' }), getElementById: id => (id === 'atorados' ? caja : null) },
    fetch: (url, o) => { pedidos.push({ url, o }); return falla ? Promise.reject(new Error('sin red')) : Promise.resolve({ json: async () => respuesta }); } };
  ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx); vm.runInContext(ops, ctx); vm.runInContext(src, ctx);
  return { A: ctx.YodAtorados, caja, pedidos, ctx };
}
const BASE = { token: 'sy-sintetica-000000000000', portero: 'https://portero.invalid/exec' };

test('junta asistentes y personas, los más días primero, sin las terminadas ni las de hoy', () => {
  const w = mundo({ ok: true, atorados: [] });
  const l = w.A._juntar(AGENTES, [tarea(9), tarea(1), tarea(0), tarea(5, { estado: 'Terminado' }), tarea(12, { archivada: true }), tarea(3, { fecha: '' })], w.ctx.YodOperations);
  assert.equal(JSON.stringify(l.map(x => x.que)), JSON.stringify(['Tarea 9', 'Súper Jarvis <b>', 'Rehacer guion', 'Tarea 1', 'Primer externo']));
  assert.equal(l[0].tipo, 'persona'); assert.equal(l[0].etiqueta, 'vencida'); assert.equal(l[0].donde, 'MOAC · Miramar');
  assert.equal(l[1].etiqueta, 'sin moverse'); assert.equal(l[2].etiqueta, 'sin latido'); assert.equal(l[4].etiqueta, 'bloqueada');
  assert.equal(l[2].donde, 'Buzón · SALA-12');
});

test('pinta escapado, lee una vez del Portero sin cookies y luego suma las de personas', async () => {
  const w = mundo({ ok: true, atorados: AGENTES });
  await w.A.montar(BASE);
  assert.equal(w.pedidos.length, 1);
  assert.match(w.pedidos[0].url, /\?recurso=atorados&k=sy-sintetica/);
  assert.equal(w.pedidos[0].o.credentials, 'omit');
  assert.equal(w.caja.hidden, false);
  assert.match(w.caja.html, /Atorados<span>3<\/span>/);
  assert.ok(w.caja.html.includes('Súper Jarvis &lt;b&gt;') && !w.caja.html.includes('<b>'.replace('b', 'b>') + 'Súper'));
  w.A.personas([tarea(7)]);
  assert.match(w.caja.html, /Atorados<span>4<\/span>/);
  assert.ok(w.caja.html.indexOf('Tarea 7') < w.caja.html.indexOf('Súper Jarvis'), '7 días va antes que 4');
  assert.ok(w.caja.html.includes('7 d vencida') && w.caja.html.includes('Sayri · MOAC · Miramar · persona'));
});

test('si el Portero no contesta, sigue con las de personas y lo dice', async () => {
  const w = mundo(null, { falla: true });
  w.A.personas([tarea(2)]);
  await w.A.montar(BASE);
  assert.ok(w.caja.html.includes('Tarea 2'));
  assert.ok(w.caja.html.includes('No pude leer los de los asistentes ahora'));
  const v = mundo({ ok: false, error: 'recurso' });
  await v.A.montar(BASE);
  assert.ok(v.caja.html.includes('No pude leer los de los asistentes ahora'), 'un Portero sin la lectura nueva no rompe');
});

test('sin sesión de Dirección se esconde; sin nada atorado lo dice', async () => {
  const w = mundo({ ok: false, error: 'admin' });
  await w.A.montar(BASE);
  assert.equal(w.caja.hidden, true); assert.equal(w.caja.html, '');
  const v = mundo({ ok: true, atorados: [] });
  await v.A.montar(BASE);
  v.A.personas([]);
  assert.ok(v.caja.html.includes('nada lleva días sin moverse'));
  assert.equal(await mundo({ ok: true, atorados: [] }).A.montar({ token: '', portero: BASE.portero }), null);
});
