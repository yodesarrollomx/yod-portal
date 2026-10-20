'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { emptyState, sanitizeState } = require('../scripts/chinches-revision.cjs');
const { encodeRows, decodeRows, exportState, importState } = require('../scripts/chinches-estado.cjs');
const A = 'a'.repeat(64), T = '2026-10-20T18:00:00.000Z';
function state(evidence = 'https://example.test/private/review') {
  const s = emptyState();
  s.watermarks.portal = { cutoff: T, observedAt: T, cursor: 'opaque-safe-metadata' };
  s.items.portal = { 'pin-1': { integrationId: 'portal', id: 'pin-1', hash: A, kind: 'legacy', updatedAt: T, receiptConfirmed: true, integrityConfirmed: true, sequence: null, reasons: [] } };
  s.acknowledgements.portal = { 'pin-1': { [A]: { revisado: { at: T, evidence } } } };
  s.lastPlan = { schemaVersion: 1, cutoff: T, queue: [{ integrationId: 'portal', id: 'pin-1', hash: A, kind: 'legacy', sourceComplete: true, integrationConfirmed: true, readyToReview: true, receiptConfirmed: true, integrityConfirmed: true, observedNow: true, requiresPrivateReceipt: false }] };
  return s;
}
function manualRows(serialized, size = 35000) {
  const parts = [];
  for (let n = 0; n < serialized.length; n += size) parts.push(serialized.slice(n, n + size));
  return [['manifest', JSON.stringify({ schemaVersion: 1, sha256: crypto.createHash('sha256').update(serialized).digest('hex'), parts: parts.length, chars: serialized.length })],
    ...parts.map((p, n) => ['part:' + String(n + 1).padStart(4, '0'), p])];
}

test('transporta estado saneado en filas con manifiesto íntegro y sin cabeceras', () => {
  const original = state(), rows = encodeRows(original, 150);
  const manifest = JSON.parse(rows[0][1]);
  assert.equal(rows[0][0], 'manifest');
  assert.equal(rows[1][0], 'part:0001');
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.parts, rows.length - 1);
  assert.ok(rows.slice(1).every(row => row[1].length <= 150));
  assert.deepEqual(decodeRows(rows), sanitizeState(original));
  assert.deepEqual(decodeRows([...rows].reverse()), sanitizeState(original));
});

test('los fragmentos no parten parejas Unicode y sobreviven el transporte JSON', () => {
  const original = state('https://example.test/📌/🎙️/método'), rows = encodeRows(original, 17);
  assert.ok(rows.length > 2);
  for (const [, chunk] of rows.slice(1)) {
    assert.ok(chunk.length <= 17);
    assert.equal(Buffer.from(chunk, 'utf8').toString('utf8'), chunk);
  }
  assert.deepEqual(decodeRows(JSON.parse(JSON.stringify(rows))), sanitizeState(original));
});

test('la exportación y la importación eliminan texto, medios y campos fuera de contrato', () => {
  const raw = state();
  raw.privateAudio = 'PRIVATE-AUDIO';
  raw.items.portal['pin-1'].notes = 'PRIVATE-NOTE';
  raw.lastPlan.queue[0].screenshot = 'PRIVATE-SCREENSHOT';
  const rows = encodeRows(raw);
  assert.ok(!JSON.stringify(rows).includes('PRIVATE'));
  const imported = decodeRows(manualRows(JSON.stringify(raw)));
  assert.ok(!JSON.stringify(imported).includes('PRIVATE'));
});

test('faltantes, claves duplicadas y partes extra abortan', () => {
  const rows = encodeRows(state(), 200);
  assert.throws(() => decodeRows(rows.slice(0, -1)), /Faltan|Falta/);
  assert.throws(() => decodeRows([...rows, rows[1]]), /duplicada/);
  assert.throws(() => decodeRows([...rows, rows[0]]), /duplicada/);
  assert.throws(() => decodeRows([...rows, ['part:9999', 'old']]), /otra versión/);
  assert.throws(() => decodeRows(rows.map(row => row[0] === 'part:0001' ? ['part:0000', row[1]] : row)), /Falta un fragmento/);
});

test('no importa una mezcla de fragmentos viejos y un manifiesto nuevo', () => {
  const oldRows = encodeRows(state('https://example.test/old'), 100);
  const newRows = encodeRows(state('https://example.test/new'), 100);
  const changed = newRows.findIndex((row, n) => n > 0 && row[1] !== oldRows[n]?.[1]);
  assert.ok(changed > 0);
  newRows[changed] = oldRows[changed];
  assert.throws(() => decodeRows(newRows), /integridad/);
});

test('el checksum y el número de caracteres detectan alteración y truncado', () => {
  const rows = encodeRows(state());
  const changed = rows.map(row => [...row]); changed[1][1] = changed[1][1].replace('portal', 'portxl');
  assert.throws(() => decodeRows(changed), /integridad/);
  const truncated = rows.map(row => [...row]); truncated[1][1] = truncated[1][1].slice(0, -1);
  assert.throws(() => decodeRows(truncated), /integridad/);
});

test('manifiestos, filas y Unicode inválidos son rechazados', () => {
  const rows = encodeRows(state());
  for (const manifest of [{}, { ...JSON.parse(rows[0][1]), schemaVersion: 2 }, { ...JSON.parse(rows[0][1]), parts: 201 }, { ...JSON.parse(rows[0][1]), extra: 'field' }]) {
    const broken = rows.map(row => [...row]); broken[0][1] = JSON.stringify(manifest);
    assert.throws(() => decodeRows(broken), /Manifiesto/);
  }
  assert.throws(() => decodeRows([['manifest', '{'], ...rows.slice(1)]), /Manifiesto JSON/);
  assert.throws(() => decodeRows(rows.map(row => [...row, 'extra-column'])), /Cada fila/);
  assert.throws(() => decodeRows([rows[0], ['part:0001', '\ud83d']]), /Unicode/);
  assert.throws(() => encodeRows(state(), 1), /Tamaño/);
  assert.throws(() => encodeRows(state(), 35001), /Tamaño/);
});

test('limita 200 partes y 4 MB reconstruidos antes de importar', () => {
  assert.throws(() => encodeRows(state(), 2), /200 fragmentos/);
  const tooLarge = JSON.stringify({ schemaVersion: 1, ignored: 'x'.repeat(4 * 1024 * 1024) });
  assert.throws(() => decodeRows(manualRows(tooLarge)), /Manifiesto|integridad/);
  const tooManyUtf8Bytes = JSON.stringify({ schemaVersion: 1, ignored: 'é'.repeat(3 * 1024 * 1024) });
  assert.throws(() => decodeRows(manualRows(tooManyUtf8Bytes)), /integridad/);
  const oversized = emptyState(); oversized.acknowledgements.portal = {};
  for (let n = 0; n < 2200; n++) oversized.acknowledgements.portal['pin-' + n] = { [A]: { revisado: { at: T, evidence: 'https://example.test/' + 'x'.repeat(2000) } } };
  assert.throws(() => encodeRows(oversized), /4 MB/);
});

test('las funciones de archivo conservan permisos privados y no sobreescriben la entrada', t => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chinche-state-files-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const stateFile = path.join(tmp, 'state.json'), rowsFile = path.join(tmp, 'rows.json'), imported = path.join(tmp, 'imported.json');
  fs.writeFileSync(stateFile, JSON.stringify(state()));
  const out = exportState(stateFile, rowsFile);
  const input = importState(rowsFile, imported);
  assert.equal(input.sha256, out.sha256);
  assert.deepEqual(JSON.parse(fs.readFileSync(imported)), sanitizeState(state()));
  assert.equal(fs.statSync(rowsFile).mode & 0o777, 0o600);
  assert.equal(fs.statSync(imported).mode & 0o777, 0o600);
  assert.throws(() => exportState(stateFile, stateFile), /archivos distintos/);
});

test('CLI exige rutas privadas; un transporte alterado no cambia el estado existente', t => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chinche-state-cli-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const stateFile = path.join(tmp, 'state.json'), rowsFile = path.join(tmp, 'rows.json'), imported = path.join(tmp, 'imported.json');
  fs.writeFileSync(stateFile, JSON.stringify(state()));
  const cli = path.resolve(__dirname, '../scripts/chinches-estado.cjs');
  const exportResult = spawnSync(process.execPath, [cli, 'export', '--state', stateFile, '--rows', rowsFile], { encoding: 'utf8' });
  assert.equal(exportResult.status, 0, exportResult.stderr);
  const importResult = spawnSync(process.execPath, [cli, 'import', '--rows', rowsFile, '--state', imported], { encoding: 'utf8' });
  assert.equal(importResult.status, 0, importResult.stderr);
  const saved = fs.readFileSync(imported, 'utf8');
  const rows = JSON.parse(fs.readFileSync(rowsFile)); rows[1][1] += 'x'; fs.writeFileSync(rowsFile, JSON.stringify(rows));
  const broken = spawnSync(process.execPath, [cli, 'import', '--rows', rowsFile, '--state', imported], { encoding: 'utf8' });
  assert.equal(broken.status, 1);
  assert.equal(fs.readFileSync(imported, 'utf8'), saved);
  const publicOutput = spawnSync(process.execPath, [cli, 'export', '--state', stateFile, '--rows', path.resolve(__dirname, '../chinche/state-rows.json')], { encoding: 'utf8' });
  assert.equal(publicOutput.status, 1);
  assert.match(publicOutput.stderr, /fuera del repositorio/);
});
