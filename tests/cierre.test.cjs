'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { resumen, bloque, aplicar, TOPE, INICIO, FIN } = require('../scripts/cierre.cjs');

const modelo = {
  revision: 'sintetica.1',
  changes: [
    { id: 'CHG-1', status: 'propuesto', components: ['SYS-A'] },
    { id: 'CHG-2', status: 'publicado', components: ['SYS-A'] },
    { id: 'CHG-3', status: 'verificado', components: ['SYS-B'] },
    ...Array.from({ length: TOPE + 1 }, (_, i) => ({ id: 'CHG-L' + i, status: 'implementado_local', components: ['SYS-A', 'SYS-C'] })),
    { id: 'CHG-L9', status: 'implementado_local', components: ['SYS-B'] },
  ],
  connections: [{ runtime_verified: true }, { runtime_verified: false }, {}],
  proposals: [
    { id: 'A', titulo: 'Leads', effort: 'M', decision: 'pendiente', dependencies: [] },
    { id: 'B', titulo: 'Atribución', effort: 'L', decision: 'pendiente', dependencies: ['A'] },
    { id: 'Z', titulo: 'Ya decidida', effort: 'M', decision: 'aprobada' },
  ],
};

test('cierre: cuenta por estado y no confunde hecho con publicado', () => {
  const r = resumen(modelo);
  assert.strictEqual(r.total, TOPE + 5);
  assert.strictEqual(r.porEstado.propuesto, 1);
  assert.strictEqual(r.porEstado.implementado_local, TOPE + 2);
  assert.strictEqual(r.porEstado.publicado, 1);
  assert.strictEqual(r.porEstado.verificado, 1);
  assert.deepStrictEqual(r.conexiones, { total: 3, verificadas: 1 });
});

test('cierre: el tope señala sólo los componentes que lo rebasan', () => {
  const r = resumen(modelo);
  assert.deepStrictEqual(r.sobreTope.map(c => c.id), ['SYS-A', 'SYS-C']);
  assert.ok(r.sobreTope.every(c => c.abiertos === TOPE + 1));
});

test('cierre: sólo lista las decisiones pendientes', () => {
  assert.deepStrictEqual(resumen(modelo).decisiones.map(d => d.id), ['A', 'B']);
});

test('cierre: reescribe únicamente el bloque generado y es estable', () => {
  const nuevo = bloque(resumen(modelo));
  const doc = '# Título\n\nTexto a mano.\n\n' + INICIO + '\nviejo\n' + FIN + '\n\nPie a mano.\n';
  const una = aplicar(doc, nuevo);
  assert.ok(una.startsWith('# Título\n\nTexto a mano.\n\n') && una.endsWith('\n\nPie a mano.\n'));
  assert.ok(!una.includes('viejo') && una.includes('sintetica.1'));
  assert.strictEqual(aplicar(una, nuevo), una);
  assert.throws(() => aplicar('sin marcas', nuevo), /bloque generado/);
});

test('cierre: docs/CIERRE.md conserva las marcas del bloque', () => {
  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'CIERRE.md'), 'utf8');
  assert.ok(doc.indexOf(INICIO) >= 0 && doc.indexOf(FIN) > doc.indexOf(INICIO));
});
