'use strict';
// os/tu-palabra.js · las preguntas del Buzón (Decisiones) en el Inicio. Red y DOM sintéticos, sin navegador.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../os/tu-palabra.js'), 'utf8');
const DEC = [
  { id: 'DEC-22', fecha: '2026-11-13T23:25Z', frente: 'PPP', pregunta: '¿De dónde sale la parte del aliado <script>?', opcion1: 'Comisión sobre ventas', opcion2: 'De la parte de la alianza', recomendada: 'Ninguna: es regla tuya', reversible: 'Sí', si_no: 'Se queda igual' },
  { id: 'DEC-16', frente: 'Sala', pregunta: 'Otra pregunta', opcion1: 'Sí', opcion2: '', recomendada: '1', reversible: '', si_no: '' }
];
function mundo(respuesta, { falla = false, sinCaja = false } = {}) {
  const pedidos = [];
  const caja = { hidden: true, html: '', onclick: null, set innerHTML(v) { this.html = v; }, get innerHTML() { return this.html; } };
  const head = { hijos: [], appendChild(n) { this.hijos.push(n); } };
  const ctx = { console, setTimeout, clearTimeout, AbortController, Promise, Date, Object, String, Array, JSON, encodeURIComponent,
    document: { head, createElement: () => ({ textContent: '' }), getElementById: id => (id === 'tu-palabra' && !sinCaja ? caja : null) },
    fetch: (url, o) => { pedidos.push({ url, o }); return falla ? Promise.reject(new Error('sin red')) : Promise.resolve({ json: async () => respuesta }); } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx);
  return { T: ctx.YodTuPalabra, caja, pedidos, head };
}
const BASE = { token: 'sy-sintetica-000000000000', portero: 'https://portero.invalid/exec' };
test('lee una vez las abiertas del Portero y las pinta escapadas', async () => {
  const w = mundo({ ok: true, decisiones: DEC });
  const l = await w.T.montar(BASE);
  assert.equal(l.length, 2);
  assert.equal(w.pedidos.length, 1);
  assert.match(w.pedidos[0].url, /\?recurso=decisiones&k=sy-sintetica/);
  assert.equal(w.pedidos[0].o.credentials, 'omit');
  assert.equal(w.caja.hidden, false);
  assert.match(w.caja.html, /Te preguntan los asistentes<span>2<\/span>/);
  assert.ok(!w.caja.html.includes('<script>'), 'escapa la pregunta');
  assert.match(w.caja.html, /DEC-22 · PPP/);
  assert.match(w.caja.html, /data-n="1">1 · Comisión sobre ventas/);
  assert.match(w.caja.html, /Otra respuesta/);
});
test('marca la recomendada sólo cuando es 1 o 2 y omite la opción vacía', () => {
  const { T } = mundo({ ok: true, decisiones: [] });
  const h = T._item(DEC[1]);
  assert.match(h, /1 · Sí <em>recomendada<\/em>/);
  assert.ok(!/data-n="2"/.test(h), 'sin opción 2 no hay botón 2');
  assert.ok(!/recomendada/.test(T._item(DEC[0])), '«Ninguna» no marca ninguna');
});
test('sin pendientes lo dice', async () => {
  const w = mundo({ ok: true, decisiones: [] });
  await w.T.montar(BASE);
  assert.match(w.caja.html, /nada pendiente/);
});
test('sin permiso de Dirección no pinta nada', async () => {
  for (const error of ['admin', 'clave']) {
    const w = mundo({ ok: false, error });
    await w.T.montar(BASE);
    assert.equal(w.caja.hidden, true); assert.equal(w.caja.html, '');
  }
});
test('si el Portero no contesta, lo dice sin romper', async () => {
  const w = mundo(null, { falla: true });
  assert.equal(await w.T.montar(BASE), null);
  assert.match(w.caja.html, /No pude leer/);
});
test('sin sesión, sin Portero o sin la caja no pregunta', async () => {
  let w = mundo({ ok: true, decisiones: DEC });
  await w.T.montar({ portero: BASE.portero }); await w.T.montar({ token: BASE.token });
  assert.equal(w.pedidos.length, 0);
  w = mundo({ ok: true, decisiones: DEC }, { sinCaja: true });
  await w.T.montar(BASE); assert.equal(w.pedidos.length, 0);
});
test('una respuesta que llega con otra sesión no pinta', async () => {
  const w = mundo({ ok: true, decisiones: DEC });
  await w.T.montar(Object.assign({ vigente: () => false }, BASE));
  assert.ok(!/DEC-22/.test(w.caja.html));
});
