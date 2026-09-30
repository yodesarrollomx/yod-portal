'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../os/adapters/finance.js');
const finance = globalThis.YodFinance;

test('Tesorería excluye pagos realizados usando el contrato estado y conserva ingresos.estatus', () => {
  const summary = finance.summarize({
    saldo: { monto: '$1,000.50', fecha: '2026-09-30' },
    pagos: [
      { monto: 100, estado: 'Pendiente' },
      { monto: 500, estado: ' Pagado ' },
      { monto: 700, estado: 'Cancelada' },
      { monto: 900, estado: 'Realizado' }
    ],
    ingresosEsperados: [
      { monto: 250, estatus: 'Esperado' },
      { monto: 800, estatus: 'Cobrado' },
      { monto: 600, estatus: 'Cancelado' }
    ]
  });
  assert.deepEqual(summary, { balance: 1000.5, payments: 100, paymentsCount: 1,
    income: 250, incomeCount: 1, projected: 1150.5, updatedAt: '2026-09-30' });
});

test('estado canónico prevalece sobre estatus contradictorio; mantiene compatibilidad legacy', () => {
  const summary = finance.summarize({ pagos: [
    { monto: 500, estado: 'Pagado', estatus: 'Pendiente' },
    { monto: 20, estado: 'Pendiente', estatus: 'Pagado' },
    { monto: 30, estatus: 'Pendiente' },
    { monto: 40, estatus: 'Pagado' },
    { monto: 10, estado: null, estatus: 'Pendiente' }
  ] });
  assert.equal(summary.payments, 60);
  assert.equal(summary.paymentsCount, 3);
  assert.equal(summary.projected, -60);
});

test('sin colecciones no fabrica pagos ni ingresos', () => {
  assert.equal(finance.summarize(null).paymentsCount, 0);
  assert.equal(finance.summarize({ pagos: {} }).incomeCount, 0);
});
