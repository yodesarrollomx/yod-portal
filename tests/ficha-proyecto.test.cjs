'use strict';
// os/ficha-proyecto.js · la ficha igual para todos los terrenos (PLAN-06). Datos sintéticos.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const F = require('../os/ficha-proyecto.js');

const HOY = '2026-11-14T12:00:00';
const EV = [
  { id: 'EV-3', fecha: '2026-11-10', hora: '10:00', tipo: 'minuta', titulo: 'Minuta <b>', resumen: 'Acuerdos', decisiones: 'TIR 15%', fuente: 'Docs', fuente_url: 'javascript:alert(1)', folios: ['PRJ-A'] },
  { id: 'EV-2', fecha: '2026-10-01', hora: '', tipo: 'reunion', titulo: 'Visita', resumen: '', fuente: 'Gemini', fuente_url: 'https://docs.google.com/x', folios: ['PRJ-A', 'PRJ-B'] },
  { id: 'EV-1', fecha: '2026-09-01', tipo: 'presentacion', titulo: 'Lámina vieja', folios: ['PRJ-C'] }
];
const PD = [
  { id: 'PD-1', fecha_origen: '2026-10-20', fecha_compromiso: '2026-11-20', tarea: 'Rehacer el modelo', responsable: 'Avermont', folios: ['PRJ-A'] },
  { id: 'PD-2', fecha_origen: '2026-10-01', fecha_compromiso: '', tarea: 'Valor catastral', responsable: 'Otro: por definir', folios: ['PRJ-A'] },
  { id: 'PD-3', fecha_origen: '2026-10-01', fecha_compromiso: '2026-11-04', tarea: 'Láminas', responsable: 'Puebla Arq.', folios: ['PRJ-B'] },
  { id: 'PD-4', fecha_origen: '2026-10-01', fecha_compromiso: '', tarea: 'Sin dueño', responsable: 'Otro: por definir', folios: ['PRJ-D'] },
  { id: 'PD-5', fecha_origen: '2026-10-01', fecha_compromiso: '', tarea: 'De un externo', folios: ['PRJ-E'] }
];
const base = folio => ({ folio, eventos: EV, pendientes: PD, hoy: HOY });

test('el siguiente hito, quién lo trae y qué lo frena salen de los datos, sin inventar', () => {
  let r = F.resumen(base('PRJ-A'));
  assert.equal(r.siguiente.tarea, 'Rehacer el modelo'); assert.equal(r.siguiente.quien, 'Avermont');
  assert.equal(r.siguiente.vencido, false); assert.equal(r.freno, null, 'a tiempo, con dueño y con movimiento hace 4 días');
  assert.equal(r.ultimo.titulo, 'Minuta <b>'); assert.equal(r.ultimo.dias, 4); assert.equal(r.abiertos, 2); assert.equal(r.registros, 2);
  r = F.resumen(base('PRJ-B'));
  assert.equal(r.freno, 'Vencido hace 10 días'); assert.equal(r.siguiente.diasVencido, 10);
  r = F.resumen(base('PRJ-C'));
  assert.equal(r.siguiente, null); assert.equal(r.freno, 'Sin movimiento hace 74 días', 'sin pendientes y quieto más de 14 días');
  r = F.resumen(base('PRJ-D'));
  assert.equal(r.siguiente.quien, ''); assert.equal(r.freno, 'Nadie lo trae');
  r = F.resumen(base('PRJ-E'));
  assert.equal(r.siguiente.quien, null, 'a un externo no le llega el responsable: no se dice «nadie»'); assert.equal(r.freno, null);
  r = F.resumen(base('PRJ-Z'));
  assert.equal(r.siguiente, null); assert.equal(r.ultimo, null); assert.equal(r.freno, null);
  r = F.resumen({ folio: 'PRJ-Q', eventos: [{ fecha: '2026-11-13', titulo: 'x', folios: ['PRJ-Q'] }], pendientes: [], hoy: HOY });
  assert.equal(r.freno, 'Sin siguiente hito escrito');
});

test('la ficha completa va escapada, con pendientes, historia y ligas sólo https', () => {
  const h = F.html(Object.assign(base('PRJ-A'), { nombre: 'Terreno <i>A</i>', etapa: '2 · Evaluado' }));
  assert.ok(h.includes('<h3>Terreno &lt;i&gt;A&lt;/i&gt;</h3>'));
  assert.ok(h.includes('PRJ-A · 2 · Evaluado · 2 registros · 2 pendientes abiertos'));
  assert.ok(h.includes('<dt>Siguiente hito</dt><dd>Rehacer el modelo<small>Compromiso: 20 nov 2026</small>'));
  assert.ok(h.includes('<dt>Lo trae</dt><dd>Avermont</dd>'));
  assert.ok(h.includes('Nada por ahora'));
  assert.ok(h.includes('Valor catastral<small>Sin quién lo traiga · sin fecha</small>'));
  assert.ok(h.includes('Minuta &lt;b&gt;') && !h.includes('Minuta <b>'));
  assert.ok(h.includes('<b>Acuerdos:</b> TIR 15%'));
  assert.ok(!h.includes('javascript:'));
  assert.ok(h.includes('href="https://docs.google.com/x"') && h.includes('rel="noopener noreferrer"'));
  assert.ok(h.indexOf('Minuta') < h.indexOf('Visita'));
  const vacia = F.html({ folio: 'PRJ-Z', nombre: 'Z', eventos: [], pendientes: [], hoy: HOY });
  assert.ok(vacia.includes('Sin siguiente hito escrito') && vacia.includes('Sin registros en el historial') && vacia.includes('Sin etapa del folio'));
});

test('el renglón compacto dice qué sigue y qué lo frena', () => {
  const a = F.fila(Object.assign(base('PRJ-B'), { nombre: 'B' }));
  assert.ok(a.startsWith('<button type="button" class="fp-fila" data-folio="PRJ-B">'));
  assert.ok(a.includes('Sigue: Láminas · Puebla Arq.') && a.includes('<span class="fp-freno">Vencido hace 10 días</span>'));
  const z = F.fila({ folio: 'PRJ-Z', nombre: 'Z <x>', eventos: [], pendientes: [], hoy: HOY });
  assert.ok(z.includes('Z &lt;x&gt;') && z.includes('Sin siguiente hito escrito') && !z.includes('fp-freno'));
});

test('Codesarrollos y el tablero cargan la misma ficha', () => {
  const t = fs.readFileSync(path.join(__dirname, '..', 'track-codesarrollos.html'), 'utf8');
  const b = fs.readFileSync(path.join(__dirname, '..', 'tablero.html'), 'utf8');
  for (const s of [t, b]) assert.match(s, /<script src="os\/ficha-proyecto\.js\?v=[^"]+"><\/script>/);
  assert.ok(t.includes("pedir('cartera')") && t.includes("pedir('historial')") && t.includes("credentials:'omit'"));
  assert.ok(!/localStorage\.removeItem\(['"]pyod_clave_v1/.test(t), 'nunca borra la sesión');
  assert.ok(b.includes('window.YodFicha.html('));
});
