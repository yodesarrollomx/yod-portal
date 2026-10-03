'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {validate, render} = require('../scripts/arquitectura.cjs');
const {verify} = require('../scripts/verificar-impacto.cjs');
const root = path.resolve(__dirname, '..');
const load = () => JSON.parse(fs.readFileSync(path.join(root, 'docs/arquitectura/modelo.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'docs/arquitectura/modelo.schema.json'), 'utf8'));
const proposalId = 'CHG-DESPACHO-CORCHO-PROVISIONAL-035';
const proposal = m => m.changes.find(c => c.id === proposalId);

test('Corcho registra impacto válido para los dos consumidores y el atlas', () => {
  const model = load();
  const impact = JSON.parse(fs.readFileSync(path.join(root, 'architecture-impact.json'), 'utf8'));
  assert.equal(impact.proposal_id, proposalId);
  assert.equal(impact.model_revision, model.revision);
  assert.equal(validate(model, schema), true);
  for (const [repository, changed, components] of [
    ['yodesarrollomx/yod-portal', ['scripts/arquitectura.cjs', 'tests/corcho-provisional-atlas.test.cjs'], impact.components],
    ['yodesarrollomx/board-aurum', ['apps-script/corcho.gs', 'tests/corcho.test.mjs'], ['SYS-TAREAS', 'SYS-DESPACHO', 'GAS-OPERACION', 'GAS-PORTERO', 'STORE-DESPACHO-CORCHO', 'EXT-DRIVE']],
    ['yodesarrollomx/yod-despacho', ['app.js', 'tests/ui.test.cjs'], ['SYS-DESPACHO', 'GAS-OPERACION', 'GAS-PORTERO', 'STORE-DESPACHO-CORCHO']]
  ]) {
    assert.equal(verify({model, impact: {...impact, components}, repository, changed: [...changed, 'architecture-impact.json']}).proposal, proposalId);
  }
  assert.throws(() => verify({model, impact: {...impact, components: ['SYS-TAREAS', 'GAS-OPERACION', 'STORE-DESPACHO-CORCHO', 'EXT-DRIVE']}, repository: 'yodesarrollomx/board-aurum', changed: ['apps-script/corcho.gs', 'architecture-impact.json']}), /GAS-PORTERO/);
});

test('routing propuesto envía sólo Corcho a Portero y conserva Operación', () => {
  const model = load(), change = proposal(model);
  assert.deepEqual(change.routing.map(r => [r.to, r.actions]), [
    ['GAS-PORTERO', ['corchoGet', 'corchoSave']], ['GAS-OPERACION', ['getAll', 'update']]
  ]);
  for (const id of ['CON-DESPACHO-CORCHO-PORTERO', 'CON-PORTERO-CORCHO-STORE', 'CON-PORTERO-CORCHO-DRIVE', 'CON-DESPACHO-CORCHO-STORE']) {
    const edge = model.connections.find(c => c.id === id);
    assert.equal(edge.status, 'propuesto');
    assert.equal(edge.runtime_verified, false);
    assert.match(edge.contract, /CTR-DESPACHO-CORCHO|Drive full guard/);
  }
  assert.equal(model.connections.find(c => c.id === 'CON-DESPACHO-CORCHO-STORE').from, 'GAS-OPERACION');
  assert.equal(model.connections.find(c => c.id === 'CON-PORTERO-CORCHO-STORE').from, 'GAS-PORTERO');
  assert.match(model.connections.find(c => c.id === 'CON-016').contract, /getAll\/update siguen en GAS-OPERACION/);
  assert.equal(change.status, 'propuesto');
  assert.equal(change.baseline.ops_projects_compared, 13);
  assert.equal(change.baseline.ops_editable_identified, false);
  assert.equal(change.baseline.portero_version, 57);
});

test('adapter conserva identidad fresca, DP, full guard y configuración sin escrituras', () => {
  const model = load(), adapter = proposal(model).backend_adapter;
  assert.equal(adapter.identity_resolver, "canjearLigaLento_(key,'DP')");
  assert.equal(adapter.identity_owner, 'exacto');
  assert.equal(adapter.permission, 'DP');
  for (const flag of ['renew_session', 'positive_cache', 'self_http', 'configuration_writes', 'storage_creation']) assert.equal(adapter[flag], false);
  const contract = model.data_contracts.find(c => c.id === 'CTR-DESPACHO-CORCHO');
  const text = contract.invariants.join('\n');
  for (const pattern of [/LockService/, /versión esperada exacta/, /No borrar notas ni filas/, /permissions.list paginado/, /principal de ejecución/, /consentimiento_requerido/, /canjearLigaLento_/, /permissionId/, /published/, /raíz de Mi unidad/, /no escribe PropertiesService/, /sin fallback/]) assert.match(text, pattern);
  assert.match(contract.output.join('\n'), /snapshot válido confirmado/);
});

test('rollback y futura migración conservan archivo original y escritor único', () => {
  const model = load(), change = proposal(model);
  assert.deepEqual(change.migration.changes, ['endpoint', 'adapter']);
  assert.equal(change.migration.single_writer, true);
  assert.ok(change.migration.preserve.includes('STORE-DESPACHO-CORCHO'));
  assert.ok(change.migration.preserve.includes('version_global'));
  assert.match(change.rollback.backend, /misma implementación/);
  assert.match(change.rollback.storage, /no borrar ni restaurar datos/);
  const store = model.components.find(c => c.id === 'STORE-DESPACHO-CORCHO');
  assert.equal(store.physical_mapping_status, 'preparado_en_registro_privado');
  assert.match(store.source_of_truth, /Mismo archivo/);
  const maps = render(model)['mapas.md'];
  assert.match(maps, /n_GAS_PORTERO -\.->\|Provisional: CAS en Mi Corcho privado\| n_STORE_DESPACHO_CORCHO/);
  assert.match(maps, /Futuro Ops: mismo almacén/);
});

test('diagramas y fichas fijan evidencia Corcho a commits inspeccionados', () => {
  const model = load(), views = render(model);
  const board = proposal(model).baseline.board_aurum_commit;
  const front = proposal(model).baseline.yod_despacho_commit;
  assert.ok(views['fichas.md'].includes('/blob/' + board + '/apps-script/corcho.gs'));
  assert.ok(views['mapas.md'].includes('/blob/' + front + '/app.js'));
  const copy = structuredClone(model);
  copy.repositories.find(r => r.repo === 'yodesarrollomx/board-aurum').commit = 'a'.repeat(40);
  assert.ok(render(copy)['fichas.md'].includes('/blob/' + board + '/apps-script/corcho.gs'));
  const evidence = copy.components.find(c => c.id === 'STORE-DESPACHO-CORCHO').evidence[0];
  for (const invalid of ['main', '388ff86', 'a'.repeat(39), 'a'.repeat(41)]) {
    evidence.commit = invalid;
    assert.throws(() => validate(copy, schema), /commit de evidencia/);
  }
});

test('propuesta pública y vistas no incluyen identificadores físicos ni credenciales', () => {
  const model = load();
  const text = [JSON.stringify(model), ...Object.values(render(model)), fs.readFileSync(path.join(root, 'docs/arquitectura/despacho-corcho-provisional.md'), 'utf8')].join('\n');
  for (const pattern of [/script\.google\.com\/macros\//, /docs\.google\.com\/spreadsheets\/d\//, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, /AKfy[A-Za-z0-9_-]{15,}/, /gh[pousr]_[A-Za-z0-9_]{15,}/, /github_pat_[A-Za-z0-9_]+/, /-----BEGIN [^-]*PRIVATE KEY-----/]) assert.doesNotMatch(text, pattern);
});
