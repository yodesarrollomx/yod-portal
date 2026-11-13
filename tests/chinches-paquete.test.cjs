'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const pkg = require('../scripts/chinches-paquete.cjs');
const BEGIN = '/* BEGIN CHINCHE SEQUENCE SHARED */\n', END = '\n/* END CHINCHE SEQUENCE SHARED */';
function fixture(t, mode = 'bundle') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chinches-paquete-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const root = path.join(dir, 'package'), dest = path.join(dir, 'host'); fs.mkdirSync(path.join(root, 'chinche'), { recursive: true }); fs.mkdirSync(dest);
  const source = '/* núcleo ñ */\nwindow.seq = 1;\n', delivery = 'window.delivery = 1;\n';
  const data = { 'secuencia.js': source, 'entrega.js': delivery, 'microfono.html': '<button>Grabar</button>\n' };
  for (const [name, value] of Object.entries(data)) fs.writeFileSync(path.join(root, 'chinche', name), value);
  const wanted = Buffer.from([source, delivery].join('\n'));
  const target = mode === 'native-prefix' ? { path: 'native.js', kind: 'prefix', components: ['secuencia.js'], acceptedBlocks: [{ sha256: pkg.sha256(Buffer.from(source)), bytes: Buffer.byteLength(source) }] } : { path: 'host.js', kind: 'markers', components: ['secuencia.js', 'entrega.js'], acceptedSha256: [pkg.sha256(wanted)] };
  fs.writeFileSync(path.join(dest, target.path), mode === 'native-prefix' ? source + '\n/* glue privado */\nkeepCard();' : 'before();\n' + BEGIN + wanted + END + '\nafter();');
  const manifest = { schemaVersion: 1, name: '@yod/chinche', repository: 'owner/core', version: '1.0.0', sequenceProtocol: 1, releasesDir: 'chinche/releases', assets: Object.entries(data).map(([name, value]) => ({ path: 'chinche/' + name, sha256: pkg.sha256(Buffer.from(value)) })) };
  const registry = { schemaVersion: 1, integrations: [{ id: 'host', repository: 'owner/host', mode, integrationConfirmed: true, surfaces: ['index.html'], capturePolicy: mode === 'shared' ? 'dom-guarded' : 'technical-card', targets: mode === 'shared' || mode === 'indirect' ? [] : [target] }] };
  fs.writeFileSync(path.join(root, 'chinche/paquete.json'), JSON.stringify(manifest)); fs.writeFileSync(path.join(root, 'chinche/registro.json'), JSON.stringify(registry));
  return { root, dest, manifest, registry, source, delivery, target, context: pkg.load(root) };
}
function changedSource(f, value) {
  fs.writeFileSync(path.join(f.root, 'chinche/secuencia.js'), value);
  f.manifest.assets.find(a => a.path.endsWith('secuencia.js')).sha256 = pkg.sha256(Buffer.from(value));
  fs.writeFileSync(path.join(f.root, 'chinche/paquete.json'), JSON.stringify(f.manifest)); return pkg.load(f.root);
}
test('instalar planea sin escribir y es idempotente al repetir con lock', t => {
  const f = fixture(t); const plan = pkg.installPlan(f.context, 'host', f.dest);
  assert.equal(fs.existsSync(path.join(f.dest, 'chinche.lock.json')), false);
  assert.equal(plan.changes.filter(c => c.changed).length, 1);
  pkg.applyPlan(plan); assert.equal(pkg.applyPlan(pkg.installPlan(f.context, 'host', f.dest)), 0);
  assert.match(fs.readFileSync(path.join(f.dest, 'host.js'), 'utf8'), /^before\(\);/);
  assert.match(fs.readFileSync(path.join(f.dest, 'host.js'), 'utf8'), /after\(\);$/);
});
test('actualización de prefijo conserva glue técnico y usa longitudes UTF8', t => {
  const f = fixture(t, 'native-prefix'), oldGlue = fs.readFileSync(path.join(f.dest, 'native.js'), 'utf8').slice(f.source.length);
  const next = changedSource(f, '/* versión é 2 */\nwindow.seq = 2;\n'); pkg.applyPlan(pkg.installPlan(next, 'host', f.dest));
  const result = fs.readFileSync(path.join(f.dest, 'native.js'), 'utf8'); assert.ok(result.endsWith(oldGlue)); assert.ok(result.includes('window.seq = 2;'));
  assert.equal(pkg.applyPlan(pkg.installPlan(next, 'host', f.dest)), 0);
});
test('prefijo con cabecera protegida conserva su marcador y rechaza cabecera desviada', t => {
  const f = fixture(t, 'native-prefix'), header = Buffer.from('/* BEGIN SHARED SEQUENCE */\n');
  f.target.prefixOffset = header.length; f.target.prefixGuardSha256 = pkg.sha256(header); fs.writeFileSync(path.join(f.root, 'chinche/registro.json'), JSON.stringify(f.registry));
  const file = path.join(f.dest, 'native.js'); fs.writeFileSync(file, Buffer.concat([header, fs.readFileSync(file)]));
  const current = fs.readFileSync(file); const next = changedSource(f, 'window.seq = 2;\n'); pkg.applyPlan(pkg.installPlan(next, 'host', f.dest));
  assert.ok(fs.readFileSync(file).subarray(0, header.length).equals(header)); assert.ok(fs.readFileSync(file, 'utf8').endsWith('keepCard();'));
  fs.writeFileSync(file, Buffer.concat([Buffer.from('x'.repeat(header.length)), current.subarray(header.length)])); assert.throws(() => pkg.installPlan(next, 'host', f.dest), /cabecera/);
});
test('conflicto en cualquier destino aborta antes de escribir lock u otros archivos', t => {
  const f = fixture(t); const second = { ...f.target, path: 'other.js' }; f.registry.integrations[0].targets.push(second); fs.writeFileSync(path.join(f.root, 'chinche/registro.json'), JSON.stringify(f.registry));
  fs.writeFileSync(path.join(f.dest, 'other.js'), BEGIN + 'unexpected();' + END);
  const prior = fs.readFileSync(path.join(f.dest, 'host.js')); assert.throws(() => pkg.installPlan(pkg.load(f.root), 'host', f.dest), /Conflicto/);
  assert.deepEqual(fs.readFileSync(path.join(f.dest, 'host.js')), prior); assert.equal(fs.existsSync(path.join(f.dest, 'chinche.lock.json')), false);
});
test('cambio concurrente posterior al plan no produce escritura parcial', t => {
  const f = fixture(t); const plan = pkg.installPlan(f.context, 'host', f.dest); fs.writeFileSync(path.join(f.dest, 'chinche.lock.json'), 'concurrent');
  assert.throws(() => pkg.applyPlan(plan), /Conflicto posterior/); assert.equal(fs.readFileSync(path.join(f.dest, 'chinche.lock.json'), 'utf8'), 'concurrent');
});
test('fallo de escritura parcial restaura código original y conserva sus permisos', t => {
  const f = fixture(t), file = path.join(f.dest, 'host.js'), original = fs.readFileSync(file); fs.chmodSync(file, 0o600);
  const next = changedSource(f, 'window.seq=2;\n'), plan = pkg.installPlan(next, 'host', f.dest), rename = fs.renameSync; let calls = 0;
  t.mock.method(fs, 'renameSync', (from, to) => { if (++calls === 2) throw Error('synthetic disk failure'); return rename(from, to); });
  assert.throws(() => pkg.applyPlan(plan), /disk failure/); assert.deepEqual(fs.readFileSync(file), original); assert.equal(fs.statSync(file).mode & 0o777, 0o600); assert.equal(fs.existsSync(path.join(f.dest, 'chinche.lock.json')), false);
  assert.ok(!fs.readdirSync(f.dest).some(name => name.endsWith('.tmp')));
});
test('rechaza traversal y enlaces simbólicos incluidos enlaces rotos', t => {
  const f = fixture(t); for (const p of ['../escape', '/tmp/escape', 'a/../b', 'a\\b', 'a//b']) assert.throws(() => pkg.inside(f.dest, p), /Ruta/);
  fs.symlinkSync(f.root, path.join(f.dest, 'escape')); assert.throws(() => pkg.inside(f.dest, 'escape/chinche/paquete.json'), /enlaces/);
  fs.symlinkSync('/missing-target-path', path.join(f.dest, 'broken')); assert.throws(() => pkg.inside(f.dest, 'broken'), /enlaces/);
});
test('hash de fuente alterada impide instalar y verificar', t => {
  const f = fixture(t); fs.appendFileSync(path.join(f.root, 'chinche/entrega.js'), 'tampered'); assert.throws(() => pkg.installPlan(f.context, 'host', f.dest), /Huella/); assert.throws(() => pkg.verify(f.context), /Huella/);
});
test('release es inmutable, verificable e idempotente y exige SemVer', t => {
  const f = fixture(t); assert.throws(() => pkg.releasePlan(f.context, '../bad'), /SemVer/);
  const plan = pkg.releasePlan(f.context, '1.0.0'); assert.equal(fs.existsSync(path.join(f.root, 'chinche/releases')), false);
  pkg.applyPlan(plan); assert.equal(pkg.applyPlan(pkg.releasePlan(f.context, '1.0.0')), 0); assert.deepEqual(pkg.verify(f.context).releases, ['1.0.0']);
  fs.appendFileSync(path.join(f.root, 'chinche/secuencia.js'), 'new'); assert.throws(() => pkg.releasePlan(f.context, '1.0.0'), /inmutable/);
  fs.appendFileSync(path.join(f.root, 'chinche/releases/1.0.0/secuencia.js'), 'tampered'); assert.throws(() => pkg.selectRelease(f.context, '1.0.0'), /Huella/);
});
test('activar y rollback seleccionan snapshots conocidos sin tocar estados de ejecución', t => {
  const f = fixture(t, 'native-prefix'); pkg.applyPlan(pkg.releasePlan(f.context, '1.0.0')); pkg.applyPlan(pkg.installPlan(f.context, 'host', f.dest));
  fs.writeFileSync(path.join(f.root, 'chinche/secuencia.js'), 'window.seq = 2;\n'); pkg.applyPlan(pkg.releasePlan(f.context, '1.1.0'));
  pkg.applyPlan(pkg.activatePlan(f.context, '1.1.0')); const active = pkg.load(f.root); assert.equal(active.pkg.version, '1.1.0'); assert.equal(active.registry.integrations[0].targetVersion, '1.1.0');
  pkg.applyPlan(pkg.installPlan(active, 'host', f.dest)); assert.match(fs.readFileSync(path.join(f.dest, 'native.js'), 'utf8'), /window.seq = 2/);
  pkg.applyPlan(pkg.installPlan(pkg.selectRelease(active, '1.0.0'), 'host', f.dest)); assert.ok(fs.readFileSync(path.join(f.dest, 'native.js'), 'utf8').startsWith(f.source));
  assert.equal(pkg.load(f.root).pkg.version, '1.1.0'); assert.equal(JSON.parse(fs.readFileSync(path.join(f.dest, 'chinche.lock.json'))).version, '1.0.0');
});
test('shared genera fragmento revisable sin modificar entrada ni inventar backend', t => {
  const f = fixture(t, 'shared'); fs.writeFileSync(path.join(f.dest, 'index.html'), '<main>private</main>'); const plan = pkg.installPlan(f.context, 'host', f.dest); pkg.applyPlan(plan);
  assert.equal(fs.readFileSync(path.join(f.dest, 'index.html'), 'utf8'), '<main>private</main>'); assert.match(fs.readFileSync(path.join(f.dest, '.chinche-instalacion.html'), 'utf8'), /YODChinche.init/); assert.ok(plan.manual.length);
});
test('shared exige adaptador explícito para tarjeta técnica y política none', t => {
  const f = fixture(t, 'shared'); f.registry.integrations[0].capturePolicy = 'technical-card'; fs.writeFileSync(path.join(f.root, 'chinche/registro.json'), JSON.stringify(f.registry)); assert.throws(() => pkg.installPlan(pkg.load(f.root), 'host', f.dest), /adaptador explícito/);
  assert.equal(fs.existsSync(path.join(f.dest, 'chinche.lock.json')), false);
  f.registry.integrations[0].capturePolicy = 'none'; fs.writeFileSync(path.join(f.root, 'chinche/registro.json'), JSON.stringify(f.registry)); assert.throws(() => pkg.installPlan(pkg.load(f.root), 'host', f.dest), /adaptador explícito/);
});
test('activar no pisa una edición canónica posterior a la versión preparada', t => {
  const f = fixture(t); pkg.applyPlan(pkg.releasePlan(f.context, '1.0.0')); fs.writeFileSync(path.join(f.root, 'chinche/secuencia.js'), 'version two'); pkg.applyPlan(pkg.releasePlan(f.context, '1.1.0')); fs.writeFileSync(path.join(f.root, 'chinche/secuencia.js'), 'concurrent third version');
  assert.throws(() => pkg.activatePlan(f.context, '1.1.0'), /edición canónica no reconocida/); assert.equal(pkg.load(f.root).pkg.version, '1.0.0');
});
test('registro exige captura explícita, no duplica superficies y no acredita instalación', t => {
  const f = fixture(t); assert.throws(() => pkg.registerPlan(f.context, { id: 'new', repository: 'owner/new', mode: 'shared', surface: 'index.html' }), /captura/);
  pkg.applyPlan(pkg.registerPlan(f.context, { id: 'new', repository: 'owner/new', mode: 'shared', surface: 'index.html', capture: 'dom-guarded' }));
  const fresh = pkg.load(f.root); assert.equal(fresh.registry.integrations.at(-1).receipt.status, 'pendiente'); assert.equal(fresh.registry.integrations.at(-1).integrationConfirmed, false); assert.equal(fresh.registry.integrations.at(-1).review.source, 'github-issues-and-authorized-private-package'); assert.throws(() => pkg.registerPlan(fresh, { id: 'new2', repository: 'owner/new', mode: 'shared', surface: 'index.html', capture: 'dom-guarded' }), /registrados/);
});
test('plan distingue ausencia de observación, publicación y backend del código', t => {
  const f = fixture(t, 'native-prefix'); const absent = pkg.upgradePlan(f.context, { integrations: [] }); assert.equal(absent.actions[0].action, 'auditar-fuente');
  const actions = pkg.upgradePlan(f.context, { integrations: [{ id: 'host', version: '1.0.0' }] }).actions;
  assert.ok(actions.some(a => a.action === 'verificar-publicacion')); assert.ok(actions.some(a => a.action === 'verificar-backend-original' && a.manual)); assert.ok(actions.some(a => a.action === 'verificar-entrega-reproduccion')); assert.ok(!actions.some(a => a.action === 'actualizar-bloque'));
});
test('versión declarada correcta no oculta un bloque ausente o alterado', t => {
  const f = fixture(t), current = { id: 'host', version: '1.0.0', publishedVersion: '1.0.0', receiptVerified: true, replayVerified: true };
  assert.ok(pkg.upgradePlan(f.context, { integrations: [current] }).actions.some(a => a.action === 'auditar-huella'));
  const changed = pkg.upgradePlan(f.context, { integrations: [{ ...current, managed: [{ path: 'host.js', sha256: '0'.repeat(64) }] }] }); assert.ok(changed.actions.some(a => a.action === 'conflicto-huella'));
  const correct = pkg.upgradePlan(f.context, { integrations: [{ ...current, managed: [{ path: 'host.js', sha256: pkg.sha256(pkg.componentData(f.context, f.target.components)) }] }] }); assert.equal(correct.actions.length, 0);
});
test('shared audita huella una sola vez sin confiar solo en versiones declaradas', t => {
  const f = fixture(t, 'shared'); f.context.registry.integrations.push({ ...f.context.registry.integrations[0], id: 'second', repository: 'owner/second' });
  const integrations = ['host', 'second'].map(id => ({ id, version: '1.0.0', publishedVersion: '1.0.0', receiptVerified: true, replayVerified: true }));
  assert.equal(pkg.upgradePlan(f.context, { integrations }).actions.filter(a => a.action === 'auditar-huella-compartida').length, 1);
  assert.equal(pkg.upgradePlan(f.context, { integrations, sharedCoreSha256: '0'.repeat(64) }).actions.filter(a => a.action === 'conflicto-huella-compartida').length, 1);
  assert.equal(pkg.upgradePlan(f.context, { integrations, sharedCoreSha256: pkg.sha256(pkg.componentData(f.context, ['secuencia.js', 'entrega.js'])) }).actions.length, 0);
  const mixed = integrations.map((x, index) => ({ ...x, sharedCoreSha256: index ? '0'.repeat(64) : pkg.sha256(pkg.componentData(f.context, ['secuencia.js', 'entrega.js'])) })); assert.equal(pkg.upgradePlan(f.context, { integrations: mixed }).actions.filter(a => a.action === 'conflicto-huella-compartida').length, 1);
});
test('registro sin importación comprobada requiere verificación aunque versión y huella coincidan', t => {
  const f = fixture(t, 'shared'); f.context.registry.integrations[0].integrationConfirmed = false;
  const integrations = [{ id: 'host', version: '1.0.0', publishedVersion: '1.0.0', receiptVerified: true, replayVerified: true }], sharedCoreSha256 = pkg.sha256(pkg.componentData(f.context, ['secuencia.js', 'entrega.js']));
  assert.ok(pkg.upgradePlan(f.context, { integrations, sharedCoreSha256 }).actions.some(a => a.id === 'host' && a.action === 'verificar-integracion'));
  delete f.context.registry.integrations[0].integrationConfirmed; assert.ok(pkg.upgradePlan(f.context, { integrations, sharedCoreSha256 }).actions.some(a => a.action === 'verificar-integracion'));
});
test('ausencia acreditada al mismo commit planifica instalar sin repetir auditoría ni verificar esa integración', t => {
  const f = fixture(t, 'indirect'), auditedCommit = 'a'.repeat(40), target = f.context.registry.integrations[0];
  Object.assign(target, { integrationConfirmed: false, inventoryStatus: 'source-not-installed', source: { auditedCommit } });
  f.context.registry.integrations.push({ ...target, id: 'other', repository: 'owner/other', inventoryStatus: 'unknown', source: {} });
  const before = JSON.stringify(f.context.registry), plan = pkg.upgradePlan(f.context, { integrations: [{ id: 'host', commit: auditedCommit }] }), hostActions = plan.actions.filter(a => a.id === 'host');
  assert.deepEqual(hostActions.map(a => a.action), ['instalar-integracion']); assert.deepEqual(hostActions[0].surfaces, ['index.html']); assert.equal(hostActions[0].commit, auditedCommit); assert.equal(hostActions[0].writes, false);
  assert.ok(plan.actions.some(a => a.id === 'other' && a.action === 'auditar-fuente')); assert.equal(JSON.stringify(f.context.registry), before);
});
test('commit distinto o faltante no reutiliza la evidencia anterior de ausencia', t => {
  const f = fixture(t, 'shared'), target = f.context.registry.integrations[0]; Object.assign(target, { integrationConfirmed: false, inventoryStatus: 'source-not-installed', source: { auditedCommit: 'a'.repeat(40) } });
  const current = { id: 'host', version: '1.0.0', publishedVersion: '1.0.0', receiptVerified: true, replayVerified: true }, sharedCoreSha256 = pkg.sha256(pkg.componentData(f.context, ['secuencia.js', 'entrega.js']));
  for (const observation of [{ ...current, commit: 'b'.repeat(40) }, current]) {
    const actions = pkg.upgradePlan(f.context, { integrations: [observation], sharedCoreSha256 }).actions;
    assert.ok(actions.some(a => a.id === 'host' && a.action === 'auditar-fuente')); assert.ok(actions.some(a => a.id === 'host' && a.action === 'verificar-integracion')); assert.ok(!actions.some(a => a.action === 'instalar-integracion'));
  }
  const missing = pkg.upgradePlan(f.context, { integrations: [] }).actions; assert.equal(missing.filter(a => a.action === 'auditar-fuente').length, 1); assert.ok(!missing.some(a => a.action === 'instalar-integracion'));
});
test('ausencia con cargadores externos exige también dependencias idénticas y no ambiguas', t => {
  const f = fixture(t, 'indirect'), auditedCommit = 'a'.repeat(40), dependencies = [{ repository: 'owner/loader', path: 'portero.js', commit: 'b'.repeat(40) }, { repository: 'owner/core', path: 'os/shell.js', commit: 'c'.repeat(40) }];
  Object.assign(f.context.registry.integrations[0], { integrationConfirmed: false, inventoryStatus: 'source-not-installed', source: { auditedCommit, dependencies } });
  const matching = pkg.upgradePlan(f.context, { integrations: [{ id: 'host', commit: auditedCommit, dependencies: dependencies.map(x => ({ ...x })) }] }); assert.deepEqual(matching.actions.map(a => a.action), ['instalar-integracion']);
  const cases = [undefined, [], [dependencies[0]], [{ ...dependencies[0], commit: 'd'.repeat(40) }, dependencies[1]], [dependencies[0], { ...dependencies[1], path: 'other.js' }], [dependencies[0], dependencies[0], dependencies[1]], [...dependencies, { repository: 'owner/new-loader', path: 'new.js', commit: 'd'.repeat(40) }]];
  for (const observed of cases) {
    const actions = pkg.upgradePlan(f.context, { integrations: [{ id: 'host', commit: auditedCommit, dependencies: observed }] }).actions;
    assert.ok(actions.some(a => a.action === 'auditar-fuente')); assert.ok(actions.some(a => a.action === 'verificar-integracion')); assert.ok(!actions.some(a => a.action === 'instalar-integracion'));
  }
  delete f.context.registry.integrations[0].source.dependencies;
  const extra = pkg.upgradePlan(f.context, { integrations: [{ id: 'host', commit: auditedCommit, dependencies: [dependencies[0]] }] }).actions;
  assert.ok(extra.some(a => a.action === 'auditar-fuente')); assert.ok(extra.some(a => a.action === 'verificar-integracion')); assert.ok(!extra.some(a => a.action === 'instalar-integracion'));
});
test('CLI instalar dryrun produce JSON sin código y no escribe', t => {
  const f = fixture(t); const result = spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/chinches-paquete.cjs'), 'instalar', '--root', f.root, '--id', 'host', '--dest', f.dest, '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); const output = JSON.parse(result.stdout); assert.equal(output.dryRun, true); assert.equal(output.written, 0); assert.equal(output.changes[0].data, undefined); assert.equal(fs.existsSync(path.join(f.dest, 'chinche.lock.json')), false);
});
