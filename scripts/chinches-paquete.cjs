#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const BEGIN = '/* BEGIN CHINCHE SEQUENCE SHARED */';
const END = '/* END CHINCHE SEQUENCE SHARED */';
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const SHA = /^[a-f0-9]{64}$/;
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
function assert(condition, message) { if (!condition) throw Error(message); }
function json(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function relative(value) {
  assert(typeof value === 'string' && value.length > 0 && !value.includes('\\') && !value.includes('\0') && !path.isAbsolute(value), 'Ruta relativa no válida');
  assert(!value.split('/').some(p => !p || p === '.' || p === '..'), 'Ruta fuera del destino');
  return value;
}
function inside(root, name) {
  relative(name);
  const absoluteRoot = path.resolve(root), target = path.resolve(absoluteRoot, name);
  assert(target.startsWith(absoluteRoot + path.sep), 'Ruta fuera del destino');
  assert(fs.existsSync(absoluteRoot) && fs.statSync(absoluteRoot).isDirectory(), 'El destino no existe');
  assert(!fs.lstatSync(absoluteRoot).isSymbolicLink(), 'No se aceptan destinos enlazados');
  let current = absoluteRoot;
  for (const part of name.split('/')) {
    current = path.join(current, part);
    let stat; try { stat = fs.lstatSync(current); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat) assert(!stat.isSymbolicLink(), 'No se aceptan enlaces simbólicos');
  }
  return target;
}
function load(root = ROOT) {
  const pkg = json(inside(root, 'chinche/paquete.json'));
  assert(pkg.schemaVersion === 1 && typeof pkg.name === 'string' && SEMVER.test(pkg.version) && Number.isInteger(pkg.sequenceProtocol) && pkg.sequenceProtocol > 0, 'Manifiesto de paquete no válido');
  assert(Array.isArray(pkg.assets) && pkg.assets.length > 0, 'Faltan assets');
  const seen = new Set();
  for (const asset of pkg.assets) {
    relative(asset.path); assert(SHA.test(asset.sha256) && !seen.has(asset.path), 'Asset inválido o duplicado'); seen.add(asset.path);
  }
  const registry = json(inside(root, 'chinche/registro.json'));
  assert(registry.schemaVersion === 1 && Array.isArray(registry.integrations), 'Registro no válido');
  const ids = new Set(), surfaces = new Set();
  for (const integration of registry.integrations) {
    assert(typeof integration.id === 'string' && /^[a-z0-9][a-z0-9._-]*$/i.test(integration.id) && !ids.has(integration.id), 'ID de integración inválido o duplicado'); ids.add(integration.id);
    assert(['shared', 'bundle', 'native-prefix', 'indirect'].includes(integration.mode), 'Modo de integración no válido');
    assert(typeof integration.repository === 'string' && /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(integration.repository), 'Repositorio no válido');
    assert(['dom-guarded', 'technical-card', 'none'].includes(integration.capturePolicy), 'Política de captura obligatoria');
    if (integration.targetVersion !== undefined) assert(SEMVER.test(integration.targetVersion), 'Versión objetivo no válida');
    assert(Array.isArray(integration.surfaces), 'Faltan superficies registradas');
    for (const surface of integration.surfaces) { relative(surface.endsWith('/') ? surface.slice(0, -1) : surface); const key = integration.repository + ':' + surface; assert(!surfaces.has(key), 'Superficie duplicada'); surfaces.add(key); }
    assert(integration.targets === undefined || Array.isArray(integration.targets), 'Destinos no válidos');
    for (const target of integration.targets || []) {
      relative(target.path); assert(['markers', 'prefix'].includes(target.kind), 'Tipo de destino no válido');
      assert(Array.isArray(target.components) && target.components.length > 0 && new Set(target.components).size === target.components.length, 'Componentes del destino no válidos');
      for (const component of target.components) { relative(component); assert(pkg.assets.some(a => a.path === component || path.posix.basename(a.path) === component), 'Componente no registrado: ' + component); }
      assert(target.acceptedSha256 === undefined || Array.isArray(target.acceptedSha256) && target.acceptedSha256.every(hash => SHA.test(hash)), 'Huellas de bloque no válidas');
      assert(target.acceptedBlocks === undefined || Array.isArray(target.acceptedBlocks) && target.acceptedBlocks.every(b => b && SHA.test(b.sha256) && Number.isInteger(b.bytes) && b.bytes > 0), 'Bloques aceptados no válidos');
      if (target.prefixOffset !== undefined) assert(Number.isInteger(target.prefixOffset) && target.prefixOffset >= 0 && (target.prefixOffset === 0 || SHA.test(target.prefixGuardSha256 || '')), 'Cabecera de prefijo no válida');
      if (target.prefixBytes !== undefined) assert(Number.isInteger(target.prefixBytes) && target.prefixBytes > 0, 'Longitud de prefijo no válida');
    }
  }
  return { root: path.resolve(root), pkg, registry };
}
function assetData(context, component) {
  const asset = context.pkg.assets.find(a => a.path === component || path.posix.basename(a.path) === component);
  assert(asset, 'Componente no registrado: ' + component);
  const data = fs.readFileSync(inside(context.root, asset.releasePath || asset.path));
  assert(sha256(data) === asset.sha256, 'Huella de asset distinta: ' + asset.path);
  return { asset, data };
}
function componentData(context, components) {
  assert(Array.isArray(components) && components.length > 0, 'Faltan componentes del destino');
  return Buffer.concat(components.flatMap((name, index) => index ? [Buffer.from('\n'), assetData(context, name).data] : [assetData(context, name).data]));
}
function markerBlock(data) {
  const start = Buffer.from(BEGIN + '\n'), end = Buffer.from('\n' + END);
  const a = data.indexOf(start), b = data.indexOf(end);
  assert(a >= 0 && b >= a + start.length && data.indexOf(start, a + 1) < 0 && data.indexOf(end, b + 1) < 0, 'Marcadores compartidos ausentes o ambiguos');
  return { begin: a + start.length, end: b };
}
function accepted(target, data) {
  const hash = sha256(data);
  return (target.acceptedSha256 || []).includes(hash) || (target.acceptedBlocks || []).some(x => x.sha256 === hash && x.bytes === data.length);
}
function replaceManaged(old, wanted, target) {
  if (target.kind === 'markers') {
    const range = markerBlock(old), current = old.subarray(range.begin, range.end);
    assert(current.equals(wanted) || accepted(target, current), 'Conflicto: el bloque compartido cambió');
    return Buffer.concat([old.subarray(0, range.begin), wanted, old.subarray(range.end)]);
  }
  assert(target.kind === 'prefix', 'Tipo de destino no válido');
  const offset = target.prefixOffset || 0;
  assert(Number.isInteger(offset) && offset >= 0 && offset <= old.length, 'Desfase de prefijo no válido');
  if (offset > 0) assert(SHA.test(target.prefixGuardSha256 || '') && sha256(old.subarray(0, offset)) === target.prefixGuardSha256, 'Conflicto: cabecera del prefijo distinta');
  if (old.subarray(offset, offset + wanted.length).equals(wanted)) return old;
  const candidates = [...(target.acceptedBlocks || [])];
  if (Number.isInteger(target.prefixBytes) && target.prefixBytes > 0) candidates.push(...(target.acceptedSha256 || []).map(hash => ({ bytes: target.prefixBytes, sha256: hash })));
  const candidate = candidates.find(x => Number.isInteger(x.bytes) && x.bytes > 0 && offset + x.bytes <= old.length && SHA.test(x.sha256) && sha256(old.subarray(offset, offset + x.bytes)) === x.sha256);
  assert(candidate, 'Conflicto: el prefijo no coincide con una versión conocida');
  return Buffer.concat([old.subarray(0, offset), wanted, old.subarray(offset + candidate.bytes)]);
}
function fileChange(root, name, data) {
  const file = inside(root, name), old = fs.existsSync(file) ? fs.readFileSync(file) : null;
  return { path: name, beforeSha256: old === null ? null : sha256(old), sha256: sha256(data), bytes: data.length, changed: old === null || !old.equals(data), data };
}
function selectRelease(context, version) {
  assert(SEMVER.test(version || ''), 'Versión SemVer no válida');
  const base = relative(context.pkg.releasesDir || 'chinche/releases') + '/' + version;
  const manifest = json(inside(context.root, base + '/manifest.json'));
  assert(manifest.schemaVersion === 1 && manifest.name === context.pkg.name && manifest.version === version && manifest.sequenceProtocol === context.pkg.sequenceProtocol && Array.isArray(manifest.assets), 'Release incompatible o manifiesto no válido');
  const assets = manifest.assets.map(asset => { relative(asset.path); relative(asset.source); assert(SHA.test(asset.sha256), 'Huella de release inválida'); return { path: asset.source, sha256: asset.sha256, releasePath: base + '/' + asset.path }; });
  const selected = { ...context, pkg: { ...context.pkg, version, assets } };
  for (const asset of assets) assetData(selected, asset.path);
  return selected;
}
function installPlan(context, integrationId, destination) {
  const integration = context.registry.integrations.find(i => i.id === integrationId);
  assert(integration, 'Integración no registrada: ' + integrationId);
  assert(integration.mode !== 'indirect', 'Integración indirecta: verificar su superficie antes de instalar');
  destination = path.resolve(destination);
  // Validate every source and every target before creating a single file.
  for (const a of context.pkg.assets) assetData(context, a.path);
  const lockPath = inside(destination, 'chinche.lock.json');
  let previous;
  if (fs.existsSync(lockPath)) {
    previous = json(lockPath);
    assert(previous.id === integration.id && previous.repository === integration.repository && previous.package === context.pkg.name, 'Conflicto con lock de otra integración');
    assert(previous.sequenceProtocol === context.pkg.sequenceProtocol, 'Cambio de protocolo: requiere migración y verificación de backend');
  }
  const changes = [], managed = [];
  if (integration.mode === 'shared') {
    assert(integration.capturePolicy === 'dom-guarded', 'La política de captura requiere un adaptador explícito; no se genera captura DOM');
    const repo = integration.repository.split('/');
    const config = { org: repo[0], repo: repo[1], pantalla: integration.id };
    const snippet = '<!-- Revisar identidad, permisos y política de captura del host antes de incluir este fragmento. No añade credenciales ni activa un backend. -->\n<script src="https://yodesarrollomx.github.io/yod-portal/chinche.js"></script>\n<script>YODChinche.init(' + JSON.stringify(config) + ');</script>\n';
    changes.push(fileChange(destination, '.chinche-instalacion.html', Buffer.from(snippet)));
  } else {
    assert(Array.isArray(integration.targets) && integration.targets.length > 0, 'Faltan destinos de integración');
    const paths = new Set();
    for (const target of integration.targets) {
      assert(!paths.has(target.path), 'Destino duplicado'); paths.add(target.path);
      const file = inside(destination, target.path); assert(fs.existsSync(file) && fs.statSync(file).isFile(), 'Falta destino: ' + target.path);
      const knownTarget = { ...target, acceptedBlocks: [...(target.acceptedBlocks || [])] };
      if (previous && previous.version !== context.pkg.version) {
        const oldContext = selectRelease(context, previous.version), oldComponent = componentData(oldContext, target.components);
        knownTarget.acceptedBlocks.push({ sha256: sha256(oldComponent), bytes: oldComponent.length });
      }
      const wanted = componentData(context, target.components), next = replaceManaged(fs.readFileSync(file), wanted, knownTarget);
      changes.push(fileChange(destination, target.path, next)); managed.push({ path: target.path, kind: target.kind, sha256: sha256(wanted), bytes: wanted.length });
    }
  }
  const lock = { schemaVersion: 1, id: integration.id, repository: integration.repository, package: context.pkg.name, version: context.pkg.version, sequenceProtocol: context.pkg.sequenceProtocol, mode: integration.mode, assets: context.pkg.assets.map(a => ({ path: a.path, sha256: a.sha256 })), managed };
  changes.push(fileChange(destination, 'chinche.lock.json', Buffer.from(JSON.stringify(lock, null, 2) + '\n')));
  const manual = integration.mode === 'native-prefix' ? ['Regenerar los artefactos del host y publicar la implementación original de Apps Script cuando corresponda; este comando no despliega ni acredita recepción.'] : integration.mode === 'shared' ? ['Revisar e incluir el fragmento en la entrada del host; registrar publicación y entrega por separado.'] : ['Ejecutar pruebas del host y comprobar su publicación y entrega por separado.'];
  for (const command of integration.update?.regenerate || []) { assert(typeof command === 'string', 'Regenerador no válido'); manual.push('Regeneración registrada (no se ejecuta aquí): ' + command); }
  if (integration.update?.frontendPublish === 'htmlservice-original-deployment') manual.push('HTMLService: revisar y publicar Index.html regenerado en la implementación ORIGINAL; conservar URL, permisos y versiones anteriores.');
  return { schemaVersion: 1, command: 'instalar', integration: integration.id, version: context.pkg.version, destination, changes, manual, rollback: { command: 'instalar --id ' + integration.id + ' --dest <mismo-destino> --version <version-anterior> --write', previousVersion: previous?.version || null, requiresImmutableSnapshot: true, preserved: ['glue del host', 'IDs', 'paquetes privados', 'recibos', 'borradores'] } };
}
function registerPlan(context, options) {
  assert(typeof options.id === 'string' && /^[a-z0-9][a-z0-9._-]*$/i.test(options.id), 'ID no válido');
  assert(typeof options.repository === 'string' && /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(options.repository), 'Repositorio no válido');
  assert(['shared', 'bundle', 'native-prefix', 'indirect'].includes(options.mode), 'Modo no válido');
  assert(['dom-guarded', 'technical-card', 'none'].includes(options.capture), 'Política de captura obligatoria');
  relative(options.surface);
  assert(!context.registry.integrations.some(i => i.id === options.id || i.repository === options.repository && (i.surfaces || []).includes(options.surface)), 'ID o superficie ya registrados');
  const integration = { id: options.id, repository: options.repository, mode: options.mode, surfaces: [options.surface], capturePolicy: options.capture, targetVersion: context.pkg.version, integrationConfirmed: false, targets: [], review: { source: 'github-issues-and-authorized-private-package', status: 'pendiente' }, deployment: { status: 'pendiente' }, receipt: { status: 'pendiente' }, replay: { status: 'pendiente' } };
  const registry = { ...context.registry, integrations: [...context.registry.integrations, integration] };
  return { schemaVersion: 1, command: 'registrar', integration: integration.id, destination: context.root, changes: [fileChange(context.root, 'chinche/registro.json', Buffer.from(JSON.stringify(registry, null, 2) + '\n'))], manual: ['Revisar autenticación y destino privado; los modos bundle/native-prefix necesitan targets y hashes comprobados antes de instalar. El registro no acredita instalación ni entrega.'] };
}
function releasePlan(context, version) {
  assert(SEMVER.test(version || ''), 'Versión SemVer no válida');
  const directory = relative(context.pkg.releasesDir || 'chinche/releases') + '/' + version;
  const names = new Set(), changes = [], assets = [];
  for (const source of context.pkg.assets) {
    const data = fs.readFileSync(inside(context.root, source.path)), name = path.posix.basename(source.path); assert(!names.has(name), 'Assets con nombre de release duplicado'); names.add(name);
    const target = directory + '/' + name;
    changes.push(fileChange(context.root, target, data)); assets.push({ path: name, source: source.path, sha256: sha256(data), bytes: data.length });
  }
  const manifest = { schemaVersion: 1, name: context.pkg.name, version, sequenceProtocol: context.pkg.sequenceProtocol, assets };
  changes.push(fileChange(context.root, directory + '/manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n')));
  const exists = fs.existsSync(inside(context.root, directory));
  if (exists) assert(changes.every(c => !c.changed), 'La versión ya existe y es inmutable');
  return { schemaVersion: 1, command: 'versionar', version, destination: context.root, changes, manual: ['Actualizar manifiesto/registro mediante revisión y PR; crear el snapshot no publica ni activa consumidores.'] };
}
function activatePlan(context, version) {
  const selected = selectRelease(context, version), previous = selectRelease(context, context.pkg.version), changes = [];
  const assets = selected.pkg.assets.map(a => ({ path: a.path, sha256: a.sha256 }));
  for (const asset of selected.pkg.assets) {
    const file = inside(context.root, asset.path), currentHash = sha256(fs.readFileSync(file)), oldAsset = context.pkg.assets.find(a => a.path === asset.path);
    assert(oldAsset && (currentHash === oldAsset.sha256 || currentHash === asset.sha256), 'Conflicto: edición canónica no reconocida: ' + asset.path);
    changes.push(fileChange(context.root, asset.path, assetData(selected, asset.path).data));
  }
  const nextPackage = { ...context.pkg, version, assets }, nextRegistry = { ...context.registry, integrations: context.registry.integrations.map(i => ({ ...i, targetVersion: version, ...(i.targets ? { targets: i.targets.map(target => {
    const known = [...(target.acceptedBlocks || [])];
    for (const release of [previous, selected]) { const data = componentData(release, target.components), block = { sha256: sha256(data), bytes: data.length }; if (!known.some(x => x.sha256 === block.sha256 && x.bytes === block.bytes)) known.push(block); }
    return { ...target, acceptedBlocks: known };
  }) } : {}) })) };
  for (const integration of context.registry.integrations.filter(i => i.repository === (context.pkg.repository || 'yodesarrollomx/yod-portal'))) {
    for (const target of integration.targets || []) {
      const content = fs.readFileSync(inside(context.root, target.path)), wanted = componentData(selected, target.components);
      const oldComponent = componentData(previous, target.components), knownTarget = { ...target, acceptedBlocks: [...(target.acceptedBlocks || []), { sha256: sha256(oldComponent), bytes: oldComponent.length }] };
      changes.push(fileChange(context.root, target.path, replaceManaged(content, wanted, knownTarget)));
    }
  }
  changes.push(fileChange(context.root, 'chinche/paquete.json', Buffer.from(JSON.stringify(nextPackage, null, 2) + '\n')));
  changes.push(fileChange(context.root, 'chinche/registro.json', Buffer.from(JSON.stringify(nextRegistry, null, 2) + '\n')));
  return { schemaVersion: 1, command: 'activar', version, destination: context.root, changes, manual: ['Propagar las copias mediante plan/instalar y PR con sus pruebas; verificar publicaciones, backends, recibos y reproducción por separado. Nunca se modifica una grabación en curso.'] };
}
function applyPlan(plan) {
  const changes = plan.changes.filter(c => c.changed), staged = [], renamed = [];
  const seen = new Set();
  for (const change of changes) {
    assert(!seen.has(change.path), 'Plan con destinos duplicados'); seen.add(change.path);
    assert(Buffer.isBuffer(change.data) && sha256(change.data) === change.sha256, 'El plan fue alterado');
    const file = inside(plan.destination, change.path), current = fs.existsSync(file) ? fs.readFileSync(file) : null;
    assert((current === null ? null : sha256(current)) === change.beforeSha256, 'Conflicto posterior al plan: ' + change.path);
  }
  try {
    for (const change of changes) {
      const file = inside(plan.destination, change.path); fs.mkdirSync(path.dirname(file), { recursive: true });
      const temp = file + '.chinche-' + crypto.randomBytes(8).toString('hex') + '.tmp';
      const original = fs.existsSync(file) ? fs.readFileSync(file) : null;
      const mode = original === null ? 0o644 : fs.statSync(file).mode & 0o777;
      fs.writeFileSync(temp, change.data, { flag: 'wx', mode }); staged.push({ file, temp, original, beforeSha256: change.beforeSha256 });
    }
    for (const item of staged) { const current = fs.existsSync(item.file) ? fs.readFileSync(item.file) : null; assert((current === null ? null : sha256(current)) === item.beforeSha256, 'Conflicto durante la preparación'); }
    for (const item of staged) {
      const current = fs.existsSync(item.file) ? fs.readFileSync(item.file) : null; assert((current === null ? null : sha256(current)) === item.beforeSha256, 'Conflicto durante la aplicación');
      fs.renameSync(item.temp, item.file); renamed.push(item);
    }
  } catch (error) {
    for (const item of renamed.reverse()) {
      if (item.original === null) fs.unlinkSync(item.file); else fs.writeFileSync(item.file, item.original);
    }
    for (const item of staged) if (fs.existsSync(item.temp)) fs.unlinkSync(item.temp);
    throw error;
  }
  return changes.length;
}
function verify(context) {
  const result = { schemaVersion: 1, command: 'verificar', version: context.pkg.version, assets: [], localBundles: [], releases: [], ok: true };
  for (const a of context.pkg.assets) { assetData(context, a.path); result.assets.push({ path: a.path, sha256: a.sha256 }); }
  const own = context.registry.integrations.filter(i => i.repository === (context.pkg.repository || 'yodesarrollomx/yod-portal'));
  for (const integration of own) for (const target of integration.targets || []) {
    const content = fs.readFileSync(inside(context.root, target.path)), wanted = componentData(context, target.components);
    const current = target.kind === 'markers' ? (() => { const r = markerBlock(content); return content.subarray(r.begin, r.end); })() : content.subarray(target.prefixOffset || 0, (target.prefixOffset || 0) + wanted.length);
    assert(current.equals(wanted), 'Bundle local desviado: ' + target.path); result.localBundles.push({ id: integration.id, path: target.path, sha256: sha256(current) });
  }
  const releaseRoot = inside(context.root, context.pkg.releasesDir || 'chinche/releases');
  if (fs.existsSync(releaseRoot)) for (const version of fs.readdirSync(releaseRoot).sort()) {
    assert(SEMVER.test(version), 'Directorio de release no válido');
    const manifest = json(inside(context.root, (context.pkg.releasesDir || 'chinche/releases') + '/' + version + '/manifest.json'));
    assert(manifest.version === version && manifest.schemaVersion === 1 && manifest.name === context.pkg.name && Array.isArray(manifest.assets), 'Manifiesto de release no válido');
    for (const asset of manifest.assets) { const file = inside(context.root, (context.pkg.releasesDir || 'chinche/releases') + '/' + version + '/' + relative(asset.path)); assert(SHA.test(asset.sha256) && sha256(fs.readFileSync(file)) === asset.sha256, 'Release modificado: ' + version + '/' + asset.path); }
    result.releases.push(version);
  }
  return result;
}
function upgradePlan(context, snapshot) {
  const list = Array.isArray(snapshot) ? snapshot : snapshot.integrations;
  assert(Array.isArray(list), 'Snapshot debe contener integrations');
  const observed = new Map(); for (const item of list) { assert(item && typeof item.id === 'string' && !observed.has(item.id), 'Snapshot con IDs duplicados'); observed.set(item.id, item); }
  const actions = []; let checkedShared = false;
  for (const target of context.registry.integrations) {
    const current = observed.get(target.id), requiredVersion = target.targetVersion || context.pkg.version;
    const absenceAudited = target.inventoryStatus === 'source-not-installed', auditedCommit = target.source?.auditedCommit;
    const dependencies = target.source?.dependencies || [], observedDependencies = current?.dependencies ?? [];
    const dependenciesMatch = Array.isArray(dependencies) && Array.isArray(observedDependencies) && observedDependencies.length === dependencies.length && dependencies.every(dependency => {
      if (!dependency || typeof dependency.repository !== 'string' || typeof dependency.path !== 'string' || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(dependency.commit || '')) return false;
      const matches = observedDependencies.filter(observed => observed && observed.repository === dependency.repository && observed.path === dependency.path);
      return matches.length === 1 && matches[0].commit === dependency.commit;
    });
    if (absenceAudited && typeof auditedCommit === 'string' && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(auditedCommit) && current?.commit === auditedCommit && dependenciesMatch) {
      actions.push({ id: target.id, action: 'instalar-integracion', reason: 'Ausencia de instalación comprobada en este mismo commit; preparar la adaptación sin repetir la auditoría de esa fuente', commit: auditedCommit, surfaces: [...target.surfaces], writes: false });
      observed.delete(target.id); continue;
    }
    if (target.integrationConfirmed !== true) actions.push({ id: target.id, action: 'verificar-integracion', reason: 'Registro sin importación comprobada; versión y huella no acreditan instalación' });
    if (!current) { actions.push({ id: target.id, action: 'auditar-fuente', reason: 'Sin observación; no equivale a instalación ausente' }); continue; }
    if (absenceAudited) actions.push({ id: target.id, action: 'auditar-fuente', reason: current.commit === auditedCommit && !dependenciesMatch ? 'Faltan dependencias comprobadas o cambiaron; el commit del host no acredita la vigencia del cargador externo' : current.commit ? 'El commit cambió; la evidencia anterior de ausencia no acredita la fuente actual' : 'Falta el commit actual; no se puede dar vigencia a la evidencia anterior de ausencia' });
    if (target.mode === 'indirect') { if (target.integrationConfirmed === true) actions.push({ id: target.id, action: 'verificar-integracion', reason: 'Cobertura indirecta sin acreditar' }); continue; }
    const desired = requiredVersion === context.pkg.version ? context : selectRelease(context, requiredVersion);
    if (target.mode === 'shared') {
      const sharedHash = current.sharedCoreSha256 || (!Array.isArray(snapshot) && snapshot.sharedCoreSha256);
      const expectedSha256 = sha256(componentData(desired, ['secuencia.js', 'entrega.js']));
      if (!checkedShared) {
        if (!SHA.test(sharedHash || '')) actions.push({ id: 'shared-core', action: 'auditar-huella-compartida', expectedSha256 });
        else if (sharedHash !== expectedSha256) actions.push({ id: 'shared-core', action: 'conflicto-huella-compartida', expectedSha256, observedSha256: sharedHash });
        checkedShared = true;
      } else if (SHA.test(sharedHash || '') && sharedHash !== expectedSha256 && !actions.some(a => a.action === 'conflicto-huella-compartida')) {
        const missing = actions.findIndex(a => a.action === 'auditar-huella-compartida'); if (missing >= 0) actions.splice(missing, 1);
        actions.push({ id: 'shared-core', action: 'conflicto-huella-compartida', expectedSha256, observedSha256: sharedHash });
      }
    } else {
      const observedTargets = current.managed || current.targets || [], byPath = new Map();
      assert(Array.isArray(observedTargets), 'Snapshot de bloques no válido');
      for (const block of observedTargets) { assert(block && typeof block.path === 'string' && !byPath.has(block.path), 'Snapshot con bloques duplicados'); byPath.set(block.path, block); }
      for (const block of target.targets || []) {
        const expectedSha256 = sha256(componentData(desired, block.components)), actual = byPath.get(block.path);
        if (!actual || !SHA.test(actual.sha256 || '')) actions.push({ id: target.id, action: 'auditar-huella', path: block.path, expectedSha256 });
        else if (actual.sha256 !== expectedSha256) actions.push({ id: target.id, action: 'conflicto-huella', path: block.path, expectedSha256, observedSha256: actual.sha256 });
      }
    }
    if (current.version !== requiredVersion) actions.push({ id: target.id, action: target.mode === 'shared' ? 'verificar-herencia-central' : 'actualizar-bloque', from: current.version || null, to: requiredVersion });
    if (current.publishedVersion !== requiredVersion) actions.push({ id: target.id, action: 'verificar-publicacion', version: requiredVersion });
    if (target.mode === 'native-prefix' && current.backendProtocol !== context.pkg.sequenceProtocol) actions.push({ id: target.id, action: 'verificar-backend-original', manual: true, protocol: context.pkg.sequenceProtocol });
    if (!current.receiptVerified || !current.replayVerified) actions.push({ id: target.id, action: 'verificar-entrega-reproduccion', receiptVerified: current.receiptVerified === true, replayVerified: current.replayVerified === true });
    observed.delete(target.id);
  }
  for (const id of observed.keys()) if (!context.registry.integrations.some(i => i.id === id)) actions.push({ id, action: 'registrar-integracion', reason: 'Integración observada fuera del registro' });
  return { schemaVersion: 1, command: 'plan', version: context.pkg.version, actions, writes: false };
}
function publicPlan(plan) { return { ...plan, changes: plan.changes.map(({ data, ...change }) => change) }; }
function main(argv = process.argv.slice(2)) {
  const command = argv.shift() || 'verificar', options = {};
  while (argv.length) { const key = argv.shift(); assert(/^--[a-z-]+$/.test(key), 'Argumento no válido'); if (key === '--write' || key === '--json') options[key.slice(2)] = true; else { assert(argv.length && !argv[0].startsWith('--'), 'Falta valor: ' + key); options[key.slice(2)] = argv.shift(); } }
  let context = load(options.root || ROOT); let output;
  if (command === 'verificar') output = verify(context);
  else if (command === 'plan') { assert(options['repos-json'], 'Falta --repos-json'); output = upgradePlan(context, json(path.resolve(options['repos-json']))); }
  else if (command === 'instalar' || command === 'versionar' || command === 'registrar' || command === 'activar') {
    if (command === 'instalar') { assert(options.id && options.dest, 'Faltan --id y --dest'); if (options.version) context = selectRelease(context, options.version); output = installPlan(context, options.id, options.dest); }
    else if (command === 'registrar') output = registerPlan(context, options);
    else if (command === 'activar') output = activatePlan(context, options.version);
    else output = releasePlan(context, options.version);
    const written = options.write ? applyPlan(output) : 0; output = { ...publicPlan(output), dryRun: !options.write, written };
  } else throw Error('Comando no válido: ' + command);
  process.stdout.write(JSON.stringify(output, null, 2) + '\n'); return output;
}
if (require.main === module) { try { main(); } catch (error) { process.stderr.write(JSON.stringify({ ok: false, error: error.message }) + '\n'); process.exitCode = 1; } }
module.exports = { sha256, inside, load, assetData, componentData, markerBlock, replaceManaged, installPlan, registerPlan, releasePlan, activatePlan, selectRelease, applyPlan, verify, upgradePlan, main };
