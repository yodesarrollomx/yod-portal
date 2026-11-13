#!/usr/bin/env node
'use strict';

// Sheets transport for private review metadata. This is integrity, not an ACL.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { sanitizeState, assertPrivatePath } = require('./chinches-revision.cjs');
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PARTS = 200;
const MAX_CHARS = 35000;
const HASH = /^[a-f0-9]{64}$/;
function assert(ok, message) { if (!ok) throw new Error(message); }
function sha256(text) { return crypto.createHash('sha256').update(text, 'utf8').digest('hex'); }
function partKey(number) { return 'part:' + String(number).padStart(4, '0'); }
function validUnicode(text) {
  for (let n = 0; n < text.length; n++) {
    const code = text.charCodeAt(n);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(++n);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}
function encodeRows(state, maxChars = MAX_CHARS) {
  assert(Number.isInteger(maxChars) && maxChars >= 2 && maxChars <= MAX_CHARS, 'Tamaño de fragmento inválido; usar entre 2 y 35000 caracteres.');
  const serialized = JSON.stringify(sanitizeState(state));
  assert(Buffer.byteLength(serialized, 'utf8') <= MAX_BYTES, 'El estado supera 4 MB.');
  const parts = [];
  for (let offset = 0; offset < serialized.length;) {
    let end = Math.min(offset + maxChars, serialized.length);
    const last = serialized.charCodeAt(end - 1);
    if (end < serialized.length && last >= 0xd800 && last <= 0xdbff) end--;
    assert(end > offset, 'No se pudo fragmentar el estado.');
    parts.push(serialized.slice(offset, end));
    assert(parts.length <= MAX_PARTS, 'El estado requiere más de 200 fragmentos.');
    offset = end;
  }
  const manifest = { schemaVersion: 1, sha256: sha256(serialized), parts: parts.length, chars: serialized.length };
  return [['manifest', JSON.stringify(manifest)], ...parts.map((part, n) => [partKey(n + 1), part])];
}
function decodeRows(rows) {
  assert(Array.isArray(rows) && rows.length >= 2 && rows.length <= MAX_PARTS + 1, 'Filas de estado inválidas.');
  const byKey = new Map();
  for (const row of rows) {
    assert(Array.isArray(row) && row.length === 2 && typeof row[0] === 'string' && typeof row[1] === 'string', 'Cada fila debe contener clave y texto.');
    assert((row[0] === 'manifest' || /^part:\d{4}$/.test(row[0])) && !byKey.has(row[0]), 'Clave desconocida o duplicada.');
    assert(row[1].length > 0 && row[1].length <= MAX_CHARS && validUnicode(row[1]), 'Fragmento vacío, demasiado grande o Unicode inválido.');
    byKey.set(row[0], row[1]);
  }
  const manifestText = byKey.get('manifest');
  assert(manifestText && manifestText.length <= 1024, 'Falta un manifiesto válido.');
  let manifest;
  try { manifest = JSON.parse(manifestText); } catch { throw new Error('Manifiesto JSON inválido.'); }
  assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest) &&
    Object.keys(manifest).sort().join(',') === 'chars,parts,schemaVersion,sha256' && manifest.schemaVersion === 1 && HASH.test(manifest.sha256) &&
    Number.isInteger(manifest.parts) && manifest.parts >= 1 && manifest.parts <= MAX_PARTS &&
    Number.isInteger(manifest.chars) && manifest.chars > 0 && manifest.chars <= MAX_BYTES, 'Manifiesto de estado inválido.');
  assert(byKey.size === manifest.parts + 1, 'Faltan fragmentos o hay fragmentos de otra versión.');
  const parts = [];
  for (let n = 1; n <= manifest.parts; n++) {
    assert(byKey.has(partKey(n)), 'Falta un fragmento de estado.');
    parts.push(byKey.get(partKey(n)));
  }
  const serialized = parts.join('');
  assert(serialized.length === manifest.chars && Buffer.byteLength(serialized, 'utf8') <= MAX_BYTES && sha256(serialized) === manifest.sha256,
    'La integridad del estado no coincide; no importar ni avanzar la revisión.');
  let state;
  try { state = JSON.parse(serialized); } catch { throw new Error('Estado JSON inválido.'); }
  return sanitizeState(state);
}
function readJson(file, limit) {
  const stat = fs.statSync(file);
  assert(stat.isFile() && stat.size <= limit, 'Archivo JSON inválido o demasiado grande.');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  const text = JSON.stringify(value, null, 2) + '\n';
  assert(Buffer.byteLength(text) <= MAX_BYTES * 2 + 65536, 'El transporte de estado supera el límite.');
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = file + '.tmp-' + crypto.randomBytes(8).toString('hex');
  try {
    fs.writeFileSync(temporary, text, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function privatePair(input, output) {
  const source = assertPrivatePath(input), target = assertPrivatePath(output);
  assert(source !== target, 'Usar archivos distintos para estado y filas.');
  return { source, target };
}
function exportState(stateFile, rowsFile, maxChars = MAX_CHARS) {
  const { source, target } = privatePair(stateFile, rowsFile);
  const rows = encodeRows(readJson(source, MAX_BYTES), maxChars);
  writeJson(target, rows);
  return { rows: rows.length, ...JSON.parse(rows[0][1]) };
}
function importState(rowsFile, stateFile) {
  const { source, target } = privatePair(rowsFile, stateFile);
  const rows = readJson(source, MAX_BYTES * 2 + 65536);
  const state = decodeRows(rows);
  assert(Buffer.byteLength(JSON.stringify(state, null, 2) + '\n') <= MAX_BYTES, 'El estado importado supera 4 MB.');
  writeJson(target, state);
  return { rows: rows.length, ...JSON.parse(rows.find(row => row[0] === 'manifest')[1]) };
}
function cli(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv, args = {};
  assert(['export', 'import'].includes(command), 'Usar export o import.');
  for (let n = 0; n < rest.length; n += 2) {
    assert(['--state', '--rows'].includes(rest[n]) && typeof rest[n + 1] === 'string' && !rest[n + 1].startsWith('--'), 'Argumentos inválidos.');
    const key = rest[n].slice(2);
    assert(!Object.prototype.hasOwnProperty.call(args, key), 'Argumento duplicado.');
    args[key] = rest[n + 1];
  }
  assert(args.state && args.rows, 'Indicar --state y --rows privados.');
  const result = command === 'export' ? exportState(args.state, args.rows) : importState(args.rows, args.state);
  process.stdout.write(JSON.stringify(result) + '\n');
  return result;
}
module.exports = { encodeRows, decodeRows, exportState, importState, cli };
if (require.main === module) { try { cli(); } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; } }
