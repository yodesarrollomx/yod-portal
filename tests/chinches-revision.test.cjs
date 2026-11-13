'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { emptyState, planReview, compactPlan, acknowledge, assertPrivatePath } = require('../scripts/chinches-revision.cjs');
const A = 'a'.repeat(64), B = 'b'.repeat(64);
const T0 = '2026-10-20T12:00:00.000Z', T1 = '2026-10-20T13:00:00.000Z', T2 = '2026-10-20T14:00:00.000Z';
const registry = (integrations = [{ id: 'portal', mode: 'shared', integrationConfirmed: true }]) => ({ schemaVersion: 1, integrations });
const pin = (extra = {}) => ({ id: 'pin-1', hash: A, updatedAt: T0, kind: 'sequence', delivery: { confirmed: true, id: 'pin-1', hash: A }, sequence: { verifiedHash: A, audio: true, frames: true, events: true }, ...extra });
const source = (extra = {}) => ({ integrationId: 'portal', complete: true, observedAt: T1, items: [pin()], ...extra });
const snapshot = (sources = [source()], cutoff = T1) => ({ schemaVersion: 1, cutoff, sources });
const reviewedArgs = (extra = {}) => ({ integrationId: 'portal', id: 'pin-1', hash: A, stage: 'revisado', evidence: 'https://example.test/private/review', ...extra });
const runPlan = (snap = snapshot(), state = emptyState(), reg = registry()) => planReview(snap, state, reg, { now: T1 });

test('una observación completa acredita recibo e integridad, pero no revisión', () => {
  const { plan, state } = runPlan();
  assert.equal(plan.coverage.complete, 1);
  assert.equal(plan.summary.received, 1);
  assert.equal(plan.summary.reviewed, 0);
  assert.equal(plan.queue[0].action, 'revisar');
  assert.equal(plan.sources[0].observationIsReview, false);
  assert.deepEqual(state.watermarks.portal, { cutoff: T1, observedAt: T1 });
});

test('la paginación incompleta no avanza corte ni permite acuse', () => {
  const first = runPlan().state;
  const result = runPlan(snapshot([source({ complete: false, observedAt: T2 })], T2), first);
  assert.deepEqual(result.state.watermarks, first.watermarks);
  assert.equal(result.plan.coverage.partial, 1);
  assert.equal(result.plan.queue[0].action, 'bloqueado');
  assert.throws(() => acknowledge(result.state, reviewedArgs()), /último plan/);
  const nextPage = runPlan(snapshot([source({ nextCursor: 'opaque-next-page' })]));
  assert.equal(nextPage.plan.coverage.partial, 1);
  assert.deepEqual(nextPage.state.watermarks, {});
});

test('un error de fuente no sustituye la última observación completa', () => {
  const first = runPlan().state;
  const result = runPlan(snapshot([source({ error: 'PRIVATE-DIAGNOSTIC', observedAt: T2 })], T2), first);
  assert.equal(result.plan.coverage.error, 1);
  assert.deepEqual(result.state.watermarks, first.watermarks);
  assert.ok(!JSON.stringify(result).includes('PRIVATE-DIAGNOSTIC'));
});

test('una fuente ausente conserva pendientes y nunca queda verde', () => {
  const first = runPlan().state;
  const result = runPlan(snapshot([]), first);
  assert.equal(result.plan.coverage.unknown, 1);
  assert.equal(result.plan.queue.length, 1);
  assert.equal(result.plan.queue[0].action, 'bloqueado');
  assert.ok(result.plan.queue[0].reasons.includes('pendiente-conservado-no-observado-en-corte'));
  assert.deepEqual(result.state.watermarks, first.watermarks);
});

test('un corte completo que omite una chinche no la borra ni la resuelve', () => {
  const first = runPlan().state;
  const result = runPlan(snapshot([source({ items: [], observedAt: T2 })], T2), first);
  assert.equal(result.plan.coverage.complete, 1);
  assert.equal(result.plan.queue[0].state, 'recibido');
  assert.equal(result.plan.summary.reviewed, 0);
  assert.equal(result.plan.summary.fulfilled, 0);
  assert.equal(result.plan.queue[0].observedNow, false);
  assert.ok(result.state.items.portal['pin-1']);
  assert.throws(() => acknowledge(result.state, reviewedArgs()), /último plan/);
});

test('integraciones indirectas y no registradas siguen desconocidas', () => {
  const indirect = runPlan(snapshot(), emptyState(), registry([{ id: 'portal', mode: 'indirect' }]));
  assert.equal(indirect.plan.coverage.unknown, 1);
  assert.equal(indirect.plan.queue[0].readyToReview, false);
  const confirmed = runPlan(snapshot(), emptyState(), registry([{ id: 'portal', mode: 'indirect', integrationConfirmed: true }]));
  assert.equal(confirmed.plan.coverage.complete, 1);
  const unknown = runPlan(snapshot([source({ integrationId: 'new-app' })]));
  assert.deepEqual(unknown.plan.unregisteredSources, ['new-app']);
  assert.equal(unknown.plan.coverage.unknown, 2);
  assert.equal(unknown.plan.queue[0].action, 'bloqueado');
});

test('ningún modo de instalación puede pisar una confirmación ausente o explícitamente falsa', () => {
  for (const mode of ['shared', 'bundle', 'native-prefix', 'indirect']) {
    for (const integrationConfirmed of [false, undefined]) {
      const reg = registry([{ id: 'portal', mode, integrationConfirmed }]);
      const { plan, state } = runPlan(snapshot([source({ items: [pin({ kind: 'legacy', sequence: undefined, delivery: undefined })] })]), emptyState(), reg);
      assert.equal(plan.coverage.unknown, 1);
      assert.equal(plan.queue[0].readyToReview, false);
      assert.throws(() => acknowledge(state, reviewedArgs()), /último plan/);
    }
  }
});

test('retirar una integración del registro no pierde sus chinches pendientes', () => {
  const first = runPlan().state;
  const result = runPlan(snapshot([]), first, registry([]));
  assert.deepEqual(result.plan.orphanedStateSources, ['portal']);
  assert.equal(result.plan.coverage.unknown, 1);
  assert.equal(result.plan.queue.length, 1);
});

test('un recibo con ID o hash distinto bloquea la revisión', () => {
  for (const delivery of [{ confirmed: true, id: 'pin-other', hash: A }, { confirmed: true, id: 'pin-1', hash: B }, { confirmed: false, id: 'pin-1', hash: A }]) {
    const { plan, state } = runPlan(snapshot([source({ items: [pin({ delivery })] })]));
    assert.equal(plan.summary.received, 0);
    assert.equal(plan.queue[0].readyToReview, false);
    assert.throws(() => acknowledge(state, reviewedArgs()), /último plan/);
  }
});

test('la secuencia exige integridad y estructuras de audio, capturas y eventos', () => {
  for (const changed of [{ verifiedHash: B }, { audio: false }, { frames: false }, { events: false }]) {
    const { state } = runPlan(snapshot([source({ items: [pin({ sequence: { ...pin().sequence, ...changed } })] })]));
    assert.throws(() => acknowledge(state, reviewedArgs()), /último plan/);
  }
});

test('audio opcional solo se acredita con ausencia explícita, nunca por fallo o denegación', () => {
  const sequence = { ...pin().sequence, audio: false, audioRequired: false, audioStatus: 'not-recorded' };
  const good = runPlan(snapshot([source({ items: [pin({ sequence })] })]));
  assert.equal(good.plan.queue[0].readyToReview, true);
  assert.doesNotThrow(() => acknowledge(good.state, reviewedArgs(), { now: T1 }));
  for (const audioStatus of ['failed', 'denied', 'unknown', undefined]) {
    const bad = runPlan(snapshot([source({ items: [pin({ sequence: { ...sequence, audioStatus } })] })]));
    assert.equal(bad.plan.queue[0].readyToReview, false);
  }
});

test('una chinche legacy conserva su propio contrato de recibo', () => {
  const snap = snapshot([source({ items: [pin({ kind: 'legacy', sequence: undefined, delivery: undefined })] })]);
  const regular = runPlan(snap);
  assert.equal(regular.plan.queue[0].readyToReview, true);
  const privateTransport = runPlan(snap, emptyState(), registry([{ id: 'portal', mode: 'shared', integrationConfirmed: true, review: { requiresPrivateReceipt: true } }]));
  assert.equal(privateTransport.plan.queue[0].readyToReview, false);
});

test('revisado y cumplido requieren acuses separados; el ACK es idempotente', () => {
  const { state } = runPlan();
  assert.throws(() => acknowledge(state, reviewedArgs({ stage: 'cumplido' }), { now: T1 }), /primero revisión/);
  const reviewed = acknowledge(state, reviewedArgs(), { now: T1 });
  const same = acknowledge(reviewed, reviewedArgs(), { now: T2 });
  assert.deepEqual(same, reviewed);
  assert.throws(() => acknowledge(reviewed, reviewedArgs({ evidence: 'https://example.test/other' })), /otra evidencia/);
  const followed = runPlan(snapshot(), reviewed);
  assert.equal(followed.plan.queue[0].action, 'seguir-correccion');
  assert.equal(followed.plan.summary.unchanged, 1);
  const fulfilled = acknowledge(reviewed, reviewedArgs({ stage: 'cumplido', evidence: 'https://example.test/commit/123' }), { now: T2 });
  const final = runPlan(snapshot(), fulfilled);
  assert.equal(final.plan.queue[0].state, 'cumplido');
  assert.equal(final.plan.queue[0].action, 'sin-cambios');
});

test('un nuevo hash exige otra revisión y conserva el historial anterior', () => {
  const reviewed = acknowledge(runPlan().state, reviewedArgs(), { now: T1 });
  const changed = pin({ hash: B, delivery: { confirmed: true, id: 'pin-1', hash: B }, sequence: { ...pin().sequence, verifiedHash: B } });
  const result = runPlan(snapshot([source({ items: [changed] })]), reviewed);
  assert.equal(result.plan.queue[0].action, 'revisar');
  assert.equal(result.plan.summary.reviewed, 0);
  assert.throws(() => acknowledge(result.state, reviewedArgs()), /último plan/);
  const next = acknowledge(result.state, reviewedArgs({ hash: B }), { now: T2 });
  assert.ok(next.acknowledgements.portal['pin-1'][A].revisado);
  assert.ok(next.acknowledgements.portal['pin-1'][B].revisado);
});

test('work omite cumplidas sin cambios y conserva las nuevas sin duplicar contenido en compacto', () => {
  const reviewed = acknowledge(runPlan().state, reviewedArgs(), { now: T1 });
  const fulfilled = acknowledge(reviewed, reviewedArgs({ stage: 'cumplido', evidence: 'https://example.test/commit/fix' }), { now: T1 });
  const other = pin({ id: 'pin-2', hash: B, delivery: { confirmed: true, id: 'pin-2', hash: B }, sequence: { ...pin().sequence, verifiedHash: B } });
  const result = runPlan(snapshot([source({ items: [pin(), other] })]), fulfilled);
  assert.equal(result.plan.queue.length, 2);
  assert.deepEqual(result.plan.work.map(p => p.id), ['pin-2']);
  const compact = compactPlan(result.plan);
  assert.equal(compact.queue, undefined);
  assert.equal(compact.summary.fulfilled, 1);
  assert.equal(compact.summary.pendingReview, 1);
  assert.equal(compact.work[0].id, 'pin-2');
  assert.deepEqual(compact.watermarkChanges, []);
  assert.equal(result.state.lastPlan.queue.length, 2);
});

test('no se mezclan acuses de igual ID y hash entre integraciones', () => {
  const reg = registry([{ id: 'portal', mode: 'shared', integrationConfirmed: true }, { id: 'sala', mode: 'shared', integrationConfirmed: true }]);
  const snap = snapshot([source(), source({ integrationId: 'sala' })]);
  const reviewed = acknowledge(runPlan(snap, emptyState(), reg).state, reviewedArgs(), { now: T1 });
  const next = runPlan(snap, reviewed, reg);
  assert.equal(next.plan.queue.find(q => q.integrationId === 'sala').action, 'revisar');
});

test('un corte anterior no retrocede la observación ni autoriza revisión', () => {
  const first = runPlan(snapshot([source({ observedAt: T2 })], T2)).state;
  const older = runPlan(snapshot(), first);
  assert.equal(older.plan.coverage.error, 1);
  assert.deepEqual(older.state.watermarks, first.watermarks);
  assert.equal(older.plan.queue[0].sourceComplete, false);
});

test('las fechas requieren ISO válido y no aceptan días inexistentes', () => {
  for (const observedAt of ['1', '20 octubre 2026', '2026-02-31T12:00:00Z']) {
    const result = runPlan(snapshot([source({ observedAt })]));
    assert.equal(result.plan.coverage.error, 1);
    assert.deepEqual(result.state.watermarks, {});
  }
});

test('una versión posterior al corte no convierte el caché anterior en observación actual', () => {
  const first = runPlan().state;
  const future = runPlan(snapshot([source({ items: [pin({ updatedAt: T2, hash: B })] })]), first);
  assert.equal(future.plan.queue[0].hash, A);
  assert.equal(future.plan.queue[0].observedNow, false);
  assert.equal(future.plan.queue[0].readyToReview, false);
});

test('no conserva texto, medios, errores privados ni otros campos ajenos al contrato', () => {
  const snap = snapshot([source({ debug: 'PRIVATE-TOKEN', items: [pin({ note: 'PRIVATE-NOTE', audio: 'data:audio/webm;base64,PRIVATE', sequence: { ...pin().sequence, transcript: 'PRIVATE-TRANSCRIPT', framesData: 'PRIVATE-FRAMES' } })] })]);
  const result = runPlan(snap);
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});

test('las evidencias son referencias y los IDs/hash malformados fallan sin mutar entrada', () => {
  const first = runPlan().state, before = JSON.stringify(first);
  for (const evidence of ['', 'audio privado de la reunión', 'data:audio/webm;base64,AAAA', 'javascript:alert(1)']) {
    assert.throws(() => acknowledge(first, reviewedArgs({ evidence })), /evidencia|referencia/);
  }
  assert.throws(() => runPlan(snapshot([source({ items: [pin(), pin()] })]), first), /duplicada/);
  assert.throws(() => runPlan(snapshot([source({ integrationId: '__proto__' })]), first), /Fuente/);
  const badHash = runPlan(snapshot([source({ items: [pin({ hash: 'unknown' })] })]));
  assert.equal(badHash.plan.queue[0].readyToReview, false);
  assert.equal(JSON.stringify(first), before);
});

test('el archivo privado rechaza el repo público y symlinks que apuntan al repo', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chinche-revision-paths-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const publicDir = path.join(root, 'public'), privateDir = path.join(root, 'private');
  fs.mkdirSync(publicDir); fs.mkdirSync(privateDir);
  fs.symlinkSync(publicDir, path.join(privateDir, 'public-link'));
  assert.throws(() => assertPrivatePath(path.join(publicDir, 'state.json'), publicDir), /fuera del repositorio/);
  assert.throws(() => assertPrivatePath(path.join(privateDir, 'public-link/state.json'), publicDir), /fuera del repositorio/);
  assert.equal(assertPrivatePath(path.join(privateDir, 'state.json'), publicDir), path.join(privateDir, 'state.json'));
  fs.mkdirSync(path.join(privateDir, '.git'));
  assert.throws(() => assertPrivatePath(path.join(privateDir, 'state.json'), publicDir), /cualquier repositorio Git/);
});

test('CLI genera estado y plan privados, y después registra revisión con referencia', t => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chinche-revision-cli-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const input = path.join(tmp, 'snapshot.json'), reg = path.join(tmp, 'registry.json');
  const state = path.join(tmp, 'state.json'), out = path.join(tmp, 'plan.json');
  fs.writeFileSync(input, JSON.stringify(snapshot())); fs.writeFileSync(reg, JSON.stringify(registry()));
  const cli = path.resolve(__dirname, '../scripts/chinches-revision.cjs');
  const result = spawnSync(process.execPath, [cli, 'plan', '--snapshot', input, '--registry', reg, '--state', state, '--out', out], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(fs.readFileSync(out)).queue[0].state, 'recibido');
  assert.equal(fs.statSync(state).mode & 0o777, 0o600);
  const ack = spawnSync(process.execPath, [cli, 'ack', '--state', state, '--integration', 'portal', '--id', 'pin-1', '--hash', A, '--stage', 'revisado', '--evidence', 'https://example.test/receipt'], { encoding: 'utf8' });
  assert.equal(ack.status, 0, ack.stderr);
  assert.ok(JSON.parse(fs.readFileSync(state)).acknowledgements.portal['pin-1'][A].revisado);
  const fulfilled = spawnSync(process.execPath, [cli, 'ack', '--state', state, '--integration', 'portal', '--id', 'pin-1', '--hash', A, '--stage', 'cumplido', '--evidence', 'https://example.test/commit/fix'], { encoding: 'utf8' });
  assert.equal(fulfilled.status, 0, fulfilled.stderr);
  const compact = spawnSync(process.execPath, [cli, 'plan', '--snapshot', input, '--registry', reg, '--state', state, '--out', out, '--compact'], { encoding: 'utf8' });
  assert.equal(compact.status, 0, compact.stderr);
  assert.equal(JSON.parse(compact.stdout).queue, undefined);
  assert.deepEqual(JSON.parse(fs.readFileSync(out)).work, []);
  assert.equal(JSON.parse(fs.readFileSync(state)).lastPlan.queue.length, 1);
  const publicState = spawnSync(process.execPath, [cli, 'plan', '--snapshot', input, '--registry', reg, '--state', path.resolve(__dirname, '../chinche/private-state.json')], { encoding: 'utf8' });
  assert.equal(publicState.status, 1);
  assert.match(publicState.stderr, /fuera del repositorio/);
});
