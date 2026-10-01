const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '../obra-app/motor/ObraCliente.gs'), 'utf8');
const CLIENTE = { correo: 'cliente@example.invalid', nombre: 'Cliente prueba', rol: 'vista', boards: '' };
const EQUIPO = { correo: 'equipo@example.invalid', nombre: 'Equipo prueba', rol: 'equipo', boards: 'OB' };
const AUTORIZA = { correo: 'autoriza@example.invalid', nombre: 'Autoriza prueba', rol: 'equipo', boards: 'OB' };

function harness(identity = EQUIPO) {
  const sheets = new Map(), writes = [], lock = { waits: [], releases: 0 }, cache = new Map();
  class Sheet {
    constructor(name, values = []) { this.name = name; this.values = values; }
    getDataRange() { return { getValues: () => this.values.map(row => row.slice()) }; }
    appendRow(row) {
      this.values.push(Array.from(row));
      writes.push({ sheet: this.name, row: this.values.length, append: true });
    }
    setFrozenRows() {}
    getRange(row, column) {
      return { setValue: value => {
        assert.ok(this.values[row - 1], 'la escritura debe apuntar a una fila existente');
        this.values[row - 1][column - 1] = value;
        writes.push({ sheet: this.name, row, column, value });
      } };
    }
  }
  const spreadsheet = {
    getSheetByName: name => sheets.get(name),
    insertSheet(name) { const sheet = new Sheet(name); sheets.set(name, sheet); return sheet; }
  };
  const context = vm.createContext({
    Date,
    SpreadsheetApp: { getActive: () => spreadsheet },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: text => ({ text, setMimeType(type) { this.type = type; return this; } })
    },
    LockService: { getScriptLock: () => ({
      waitLock: timeout => lock.waits.push(timeout),
      releaseLock: () => { lock.releases++; }
    }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'https://example.invalid/portero' }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (_, value) => crypto.createHash('sha256').update(value).digest(),
      base64EncodeWebSafe: value => Buffer.from(value).toString('base64url'),
      formatDate: (_, __, pattern) => pattern === 'yyyy-MM-dd' ? '2026-01-10' : '2026-01-10T12:00:00'
    },
    // No transporte real: todas las respuestas de identidad son fixtures sintéticos.
    UrlFetchApp: { fetch: () => ({ getContentText: () => JSON.stringify({ ok: true, ...identity }) }) }
  });
  vm.runInContext(source, context, { filename: 'ObraCliente.gs' });
  function seed(name, records) {
    const headers = Array.from(context.HOJAS[name]);
    const rows = records.map(record => headers.map(key => record && record[key] != null ? record[key] : ''));
    sheets.set(name, new Sheet(name, [headers, ...rows]));
  }
  Object.keys(context.HOJAS).forEach(name => seed(name, []));
  function post(body) {
    const output = context.doPost({ postData: { contents: JSON.stringify({ k: 'synthetic-test-token', ...body }) } });
    assert.equal(output.type, 'application/json');
    return JSON.parse(output.text);
  }
  return { context, seed, post, writes, lock, values: name => sheets.get(name).values };
}

function pago(estado = 'PROGRAMADO') {
  return { id: 'PG-TEST', folio: 'PRJ-TEST', unidad: 'U1', concepto: 'Concepto prueba', importe: 100, estado,
    fecha_pago: estado === 'RECIBIDO' ? '2026-01-09' : '', metodo: 'TRANSFERENCIA', comprobante: 'ref-original' };
}

function clienteConPago(estado) {
  const h = harness(CLIENTE);
  h.seed('CLIENTES', [{ ...CLIENTE, folio: 'PRJ-TEST', unidad: 'U1', activo: 'SI' }]);
  h.seed('PAGOS', [null, pago(estado)]);
  return h;
}

test('filas conserva coordenadas físicas con huecos iniciales, intermedios y finales', () => {
  const h = harness();
  h.seed('DUDAS', [null, { id: 'DU-1', texto: 'Primera' }, null, { id: 'DU-2', texto: 'Segunda' }, null]);
  assert.deepEqual(Array.from(h.context.filas_('DUDAS'), row => [row.id, row._fila]), [['DU-1', 3], ['DU-2', 5]]);
  h.seed('DUDAS', [null, null]);
  assert.equal(h.context.filas_('DUDAS').length, 0);
});

test('responder por ID escribe únicamente la fila original después de los huecos', () => {
  const h = harness();
  h.seed('DUDAS', [null, { id: 'DU-1', texto: 'Primera' }, null, { id: 'DU-2', texto: 'Segunda' }, null]);
  const before = structuredClone(h.values('DUDAS'));
  assert.equal(h.post({ accion: 'responder', id: 'DU-2', respuesta: 'Respuesta prueba', cerrar: true }).ok, true);
  assert.ok(h.writes.length > 0);
  assert.ok(h.writes.every(write => write.sheet === 'DUDAS' && write.row === 5));
  for (const index of [0, 1, 2, 3, 5]) assert.deepEqual(h.values('DUDAS')[index], before[index]);
  const headers = h.values('DUDAS')[0], changed = h.values('DUDAS')[4];
  assert.equal(changed[headers.indexOf('id')], 'DU-2');
  assert.equal(changed[headers.indexOf('respuesta')], 'Respuesta prueba');
  assert.equal(changed[headers.indexOf('estado')], 'CERRADA');
  assert.equal(changed[headers.indexOf('respondio')], EQUIPO.nombre);
  assert.deepEqual(h.lock, { waits: [20000], releases: 1 });
});

test('autorizar requiere correo explícito para una sesión no administradora', () => {
  for (const config of [undefined, '', '   ', ', ; ', 'autoriza@example.invalid, ']) {
    const h = harness();
    h.seed('CONFIG', config === undefined ? [] : [{ clave: 'AUTORIZA_CORREOS', valor: config }]);
    for (const correo of [undefined, null, '', '   ']) {
      assert.equal(h.context.autoriza_({ ...EQUIPO, correo }), false, `correo=${String(correo)}, config=${String(config)}`);
    }
  }
});

test('autorizar conserva admin y normaliza la lista de correos permitidos', () => {
  const h = harness();
  h.seed('CONFIG', [{ clave: 'AUTORIZA_CORREOS', valor: ' OTRO@EXAMPLE.INVALID ; AUTORIZA@EXAMPLE.INVALID, ' }]);
  assert.equal(h.context.autoriza_({ ...AUTORIZA, correo: '  AUTORIZA@example.invalid  ' }), true);
  assert.equal(h.context.autoriza_(EQUIPO), false);
  assert.equal(h.context.autoriza_(null), false);
  h.seed('CONFIG', []);
  assert.equal(h.context.autoriza_({ rol: 'admin', correo: '' }), true);
});

test('confirmar un pago sin correo permitido rechaza y conserva todas las celdas', () => {
  const h = harness({ ...EQUIPO, correo: '' });
  h.seed('PAGOS', [pago('AVISADO')]);
  const before = structuredClone(h.values('PAGOS'));
  assert.equal(h.post({ accion: 'pago', id: 'PG-TEST', estado: 'RECIBIDO' }).ok, false);
  assert.deepEqual(h.values('PAGOS'), before);
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.lock, { waits: [20000], releases: 1 });
});

test('confirmar un pago con autorización explícita conserva el contrato y la firma del servidor', () => {
  const h = harness(AUTORIZA);
  h.seed('CONFIG', [{ clave: 'AUTORIZA_CORREOS', valor: AUTORIZA.correo }]);
  h.seed('PAGOS', [null, pago('AVISADO')]);
  assert.equal(h.post({ accion: 'pago', id: 'PG-TEST', estado: 'RECIBIDO', registro: 'nombre ignorado' }).ok, true);
  const row = h.context.filas_('PAGOS')[0];
  assert.equal(row.estado, 'RECIBIDO');
  assert.equal(row.registro, AUTORIZA.nombre);
  assert.equal(row.fecha_pago, '2026-01-10');
  assert.ok(h.writes.every(write => write.row === 3));
});

test('aviso actualiza un pago pendiente y conserva filas vecinas y huecos', () => {
  for (const estado of ['PROGRAMADO', 'PENDIENTE', 'AVISADO']) {
    const h = clienteConPago(estado);
    const beforeBlank = h.values('PAGOS')[1].slice();
    assert.equal(h.post({ accion: 'aviso_pago', folio: 'PRJ-TEST', unidad: 'U1', id: 'PG-TEST', comprobante: 'ref-nueva' }).ok, true);
    const row = h.context.filas_('PAGOS')[0];
    assert.equal(row.estado, 'AVISADO');
    assert.equal(row.comprobante, 'ref-nueva');
    assert.equal(row.metodo, 'SPEI');
    assert.deepEqual(h.values('PAGOS')[1], beforeBlank);
    assert.ok(h.writes.every(write => write.row === 3));
  }
});

test('aviso atrasado no modifica un pago ya recibido', () => {
  const h = clienteConPago('RECIBIDO');
  const before = structuredClone(h.values('PAGOS'));
  const result = h.post({ accion: 'aviso_pago', folio: 'PRJ-TEST', unidad: 'U1', id: 'PG-TEST', comprobante: 'ref-tardia' });
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, 'string');
  assert.deepEqual(h.values('PAGOS'), before);
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.lock, { waits: [20000], releases: 1 });
});

test('la confirmación terminada antes de un aviso tardío permanece registrada', () => {
  const h = clienteConPago('PROGRAMADO');
  h.seed('CONFIG', [{ clave: 'AUTORIZA_CORREOS', valor: AUTORIZA.correo }]);
  // Orden equivalente a peticiones serializadas por el ScriptLock: primero confirma el equipo.
  assert.equal(h.context.accion_(AUTORIZA, { accion: 'pago', id: 'PG-TEST', estado: 'RECIBIDO' }).ok, true);
  const before = structuredClone(h.values('PAGOS')), writesBefore = h.writes.length;
  assert.equal(h.post({ accion: 'aviso_pago', folio: 'PRJ-TEST', unidad: 'U1', id: 'PG-TEST' }).ok, false);
  assert.deepEqual(h.values('PAGOS'), before);
  assert.equal(h.writes.length, writesBefore);
});

test('aviso de otra unidad se rechaza antes de escribir', () => {
  const h = clienteConPago('PROGRAMADO');
  assert.equal(h.post({ accion: 'aviso_pago', folio: 'PRJ-TEST', unidad: 'U2', id: 'PG-TEST' }).ok, false);
  assert.deepEqual(h.writes, []);
});
