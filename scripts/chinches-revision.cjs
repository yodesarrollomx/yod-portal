#!/usr/bin/env node
'use strict';

// Metadata only. A watermark proves a complete observation, never a review.
const fs = require('node:fs');
const path = require('node:path');
const REPO_ROOT = path.resolve(__dirname, '..');
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_ITEMS = 10000;
const SHA = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const forbidden = new Set(['constructor', 'prototype', '__proto__']);
const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const get = (o, k) => own(o, k) ? o[k] : undefined;
function assert(ok, message) { if (!ok) throw new Error(message); }
function object(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function id(v) { return typeof v === 'string' && ID.test(v) && !forbidden.has(v); }
function hash(v) { return typeof v === 'string' && SHA.test(v); }
function instant(v) {
  if (typeof v !== 'string' || v.length > 50) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(v);
  if (!match || !Number.isFinite(Date.parse(v))) return false;
  const date = new Date(0);
  date.setUTCFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() + 1 === Number(match[2]) && date.getUTCDate() === Number(match[3]);
}
function cleanEvidence(v) {
  assert(typeof v === 'string' && v.trim() && v.length <= 2048 && !/[\r\n\u0000]/.test(v), 'Falta una referencia de evidencia válida.');
  assert(/^[a-z][a-z0-9+.-]*:[^\s]+$/i.test(v.trim()) && !/^(data:|javascript:)/i.test(v.trim()), 'La evidencia debe ser una referencia URI, no contenido.');
  return v.trim();
}
function emptyState() { return { schemaVersion: 1, watermarks: {}, items: {}, acknowledgements: {}, lastPlan: null }; }
function cleanItem(raw, integrationId) {
  assert(object(raw) && id(raw.id), 'ID de chinche inválido.');
  const reasons = [];
  const digest = hash(raw.hash) ? raw.hash : null;
  if (!digest) reasons.push('hash-invalido');
  const kind = ['legacy', 'sequence'].includes(raw.kind) ? raw.kind : 'unknown';
  if (kind === 'unknown') reasons.push('tipo-desconocido');
  const updatedAt = instant(raw.updatedAt) ? raw.updatedAt : null;
  if (!updatedAt) reasons.push('fecha-invalida');
  const d = object(raw.delivery) ? raw.delivery : {};
  const receiptConfirmed = d.confirmed === true && d.id === raw.id && digest !== null && d.hash === digest;
  if (d.confirmed === true && !receiptConfirmed) reasons.push('recibo-no-coincide');
  const s = object(raw.sequence) ? raw.sequence : {};
  const sequence = kind === 'sequence' ? {
    verifiedHash: hash(s.verifiedHash) ? s.verifiedHash : null,
    audio: s.audio === true, audioRequired: s.audioRequired !== false,
    audioStatus: s.audioStatus === undefined ? (s.audio === true ? 'recorded' : 'unknown') :
      ['recorded', 'not-recorded', 'failed', 'denied'].includes(s.audioStatus) ? s.audioStatus : 'unknown',
    frames: s.frames === true, events: s.events === true
  } : null;
  const validAudio = sequence && (sequence.audio && sequence.audioStatus === 'recorded' ||
    !sequence.audio && !sequence.audioRequired && sequence.audioStatus === 'not-recorded');
  const integrityConfirmed = kind === 'legacy' || (sequence && digest !== null && sequence.verifiedHash === digest && validAudio && sequence.frames && sequence.events);
  if (kind === 'sequence') {
    if (!receiptConfirmed) reasons.push('recibo-privado-pendiente');
    if (sequence.verifiedHash !== digest || digest === null) reasons.push('integridad-pendiente');
    if (!validAudio) reasons.push('audio-pendiente');
    if (!sequence.frames) reasons.push('capturas-pendientes');
    if (!sequence.events) reasons.push('trazos-pendientes');
  }
  return { integrationId, id: raw.id, hash: digest, kind, updatedAt, receiptConfirmed, integrityConfirmed: !!integrityConfirmed, sequence, reasons };
}
function cleanAck(raw) {
  if (!object(raw) || !instant(raw.at)) return null;
  try { return { at: raw.at, evidence: cleanEvidence(raw.evidence) }; } catch { return null; }
}
function sanitizeState(raw) {
  if (raw === undefined || raw === null) return emptyState();
  assert(object(raw) && raw.schemaVersion === 1, 'Versión de estado no admitida.');
  const state = emptyState();
  let count = 0;
  for (const [integrationId, entries] of Object.entries(raw.items || {})) {
    assert(id(integrationId) && object(entries), 'Estado de integración inválido.');
    state.items[integrationId] = {};
    for (const [pinId, entry] of Object.entries(entries)) {
      assert(++count <= MAX_ITEMS && id(pinId) && object(entry) && entry.id === pinId, 'Estado de chinches inválido o demasiado grande.');
      const item = cleanItem({ id: entry.id, hash: entry.hash, kind: entry.kind, updatedAt: entry.updatedAt,
        delivery: entry.receiptConfirmed ? { confirmed: true, id: entry.id, hash: entry.hash } : undefined,
        sequence: entry.sequence }, integrationId);
      state.items[integrationId][pinId] = item;
    }
  }
  for (const [integrationId, rawWatermark] of Object.entries(raw.watermarks || {})) {
    assert(id(integrationId) && object(rawWatermark), 'Corte de observación inválido.');
    if (!instant(rawWatermark.cutoff) || !instant(rawWatermark.observedAt)) continue;
    const w = { cutoff: rawWatermark.cutoff, observedAt: rawWatermark.observedAt };
    if (typeof rawWatermark.cursor === 'string' && rawWatermark.cursor.length <= 2048) w.cursor = rawWatermark.cursor;
    if (typeof rawWatermark.commit === 'string' && /^[a-f0-9]{40}$/.test(rawWatermark.commit)) w.commit = rawWatermark.commit;
    state.watermarks[integrationId] = w;
  }
  for (const [integrationId, pins] of Object.entries(raw.acknowledgements || {})) {
    assert(id(integrationId) && object(pins), 'Acuses de integración inválidos.');
    const cleanPins = {};
    for (const [pinId, hashes] of Object.entries(pins)) {
      assert(id(pinId) && object(hashes), 'Acuses de chinche inválidos.');
      const cleanHashes = {};
      for (const [digest, stages] of Object.entries(hashes)) {
        assert(hash(digest) && object(stages), 'Huella de acuse inválida.');
        const reviewed = cleanAck(stages.revisado), fulfilled = cleanAck(stages.cumplido);
        if (reviewed) cleanHashes[digest] = { revisado: reviewed, ...(fulfilled ? { cumplido: fulfilled } : {}) };
      }
      cleanPins[pinId] = cleanHashes;
    }
    state.acknowledgements[integrationId] = cleanPins;
  }
  // Only this exact, sanitized plan can authorize an acknowledgement.
  if (object(raw.lastPlan) && raw.lastPlan.schemaVersion === 1 && instant(raw.lastPlan.cutoff) && Array.isArray(raw.lastPlan.queue)) {
    assert(raw.lastPlan.queue.length <= MAX_ITEMS, 'Plan demasiado grande.');
    state.lastPlan = { schemaVersion: 1, cutoff: raw.lastPlan.cutoff, queue: raw.lastPlan.queue.map(q => {
      assert(object(q) && id(q.integrationId) && id(q.id), 'Plan de acuse inválido.');
      return { integrationId: q.integrationId, id: q.id, hash: hash(q.hash) ? q.hash : null,
        sourceComplete: q.sourceComplete === true, integrationConfirmed: q.integrationConfirmed === true,
        readyToReview: q.readyToReview === true, receiptConfirmed: q.receiptConfirmed === true,
        integrityConfirmed: q.integrityConfirmed === true, observedNow: q.observedNow === true,
        requiresPrivateReceipt: q.requiresPrivateReceipt === true,
        kind: ['legacy', 'sequence'].includes(q.kind) ? q.kind : 'unknown' };
    }) };
  }
  return state;
}
function registryEntries(registry) {
  assert(object(registry) && registry.schemaVersion === 1 && Array.isArray(registry.integrations) && registry.integrations.length <= 1000, 'Registro de integraciones inválido.');
  const seen = new Set();
  for (const i of registry.integrations) {
    assert(object(i) && id(i.id) && !seen.has(i.id), 'ID de integración inválido o duplicado.');
    seen.add(i.id);
  }
  return registry.integrations;
}
function ackFor(state, integrationId, pinId, digest) {
  return get(get(get(state.acknowledgements, integrationId), pinId), digest) || {};
}
function planReview(snapshot, previousState, registry, options = {}) {
  const now = options.now || new Date().toISOString();
  assert(instant(now), 'Fecha de ejecución inválida.');
  assert(object(snapshot) && snapshot.schemaVersion === 1 && instant(snapshot.cutoff) && Array.isArray(snapshot.sources) && snapshot.sources.length <= 1000, 'Snapshot inválido.');
  const state = sanitizeState(previousState);
  const integrations = [...registryEntries(registry)];
  const bySource = new Map();
  let inputCount = 0;
  for (const source of snapshot.sources) {
    assert(object(source) && id(source.integrationId) && !bySource.has(source.integrationId), 'Fuente inválida o duplicada.');
    assert(source.items === undefined || Array.isArray(source.items), 'Listado de chinches inválido.');
    inputCount += (source.items || []).length;
    assert(inputCount <= MAX_ITEMS, 'Demasiadas chinches en una observación.');
    bySource.set(source.integrationId, source);
  }
  const registeredIds = new Set(integrations.map(i => i.id));
  const unregisteredSources = [...bySource.keys()].filter(sourceId => !registeredIds.has(sourceId));
  const orphanedStateSources = Object.keys(state.items).filter(sourceId => !registeredIds.has(sourceId));
  for (const integrationId of new Set([...unregisteredSources, ...orphanedStateSources])) {
    integrations.push({ id: integrationId, mode: 'indirect', registrationMissing: true });
  }
  const plan = { schemaVersion: 1, generatedAt: now, cutoff: snapshot.cutoff,
    coverage: { total: integrations.length, complete: 0, partial: 0, unknown: 0, error: 0 },
    sources: [], queue: [], watermarkChanges: [], summary: { received: 0, reviewed: 0, fulfilled: 0, pendingReview: 0, pendingCorrection: 0, blocked: 0, unchanged: 0 },
    unregisteredSources, orphanedStateSources };
  for (const integration of integrations) {
    const source = bySource.get(integration.id);
    const oldWatermark = get(state.watermarks, integration.id);
    const confirmedIntegration = integration.integrationConfirmed === true;
    const errors = [];
    if (!source) errors.push('fuente-no-observada');
    if (source && source.error) errors.push('error-de-fuente');
    if (source && !instant(source.observedAt)) errors.push('fecha-de-fuente-invalida');
    if (source && !Array.isArray(source.items)) errors.push('listado-no-observado');
    if (oldWatermark && Date.parse(snapshot.cutoff) < Date.parse(oldWatermark.cutoff)) errors.push('corte-anterior');
    if (source && oldWatermark && instant(source.observedAt) && Date.parse(source.observedAt) < Date.parse(oldWatermark.observedAt)) errors.push('observacion-anterior');
    const complete = !!source && source.complete === true && !source.nextCursor && errors.length === 0;
    let coverage = !source || !confirmedIntegration ? 'unknown' : errors.length ? 'error' : complete ? 'complete' : 'partial';
    plan.coverage[coverage]++;
    if (!confirmedIntegration) errors.push('integracion-sin-confirmar');
    if (integration.registrationMissing) errors.push('integracion-no-registrada');
    if (source && !complete && errors.length === 0) errors.push('paginacion-incompleta');
    const observedIds = new Set(), allIds = new Set();
    const itemMap = get(state.items, integration.id) || {};
    if (!own(state.items, integration.id)) state.items[integration.id] = itemMap;
    for (const raw of source?.items || []) {
      const item = cleanItem(raw, integration.id);
      assert(!allIds.has(item.id), 'Chinche duplicada en la misma fuente.');
      allIds.add(item.id);
      if (item.updatedAt && Date.parse(item.updatedAt) > Date.parse(snapshot.cutoff)) continue;
      observedIds.add(item.id);
      itemMap[item.id] = item;
    }
    let watermarkAdvanced = false;
    if (complete) {
      const watermark = { cutoff: snapshot.cutoff, observedAt: source.observedAt };
      if (typeof source.cursor === 'string' && source.cursor.length <= 2048) watermark.cursor = source.cursor;
      if (typeof source.commit === 'string' && /^[a-f0-9]{40}$/.test(source.commit)) watermark.commit = source.commit;
      watermarkAdvanced = JSON.stringify(watermark) !== JSON.stringify(oldWatermark);
      if (watermarkAdvanced) plan.watermarkChanges.push({ integrationId: integration.id,
        previousCutoff: oldWatermark?.cutoff || null, cutoff: watermark.cutoff, observedAt: watermark.observedAt });
      state.watermarks[integration.id] = watermark;
    }
    const sourceSummary = { integrationId: integration.id, coverage, observedComplete: complete, reasons: errors,
      observedItems: observedIds.size, retainedItems: Object.keys(itemMap).length,
      watermarkAdvanced, observationIsReview: false };
    plan.sources.push(sourceSummary);
    for (const item of Object.values(itemMap)) {
      const observedNow = observedIds.has(item.id) && (!item.updatedAt || Date.parse(item.updatedAt) <= Date.parse(snapshot.cutoff));
      const stages = item.hash ? ackFor(state, integration.id, item.id, item.hash) : {};
      const reviewed = !!stages.revisado, fulfilled = reviewed && !!stages.cumplido;
      const reasons = [...item.reasons, ...errors];
      if (!observedNow) reasons.push('pendiente-conservado-no-observado-en-corte');
      const requiresReceipt = item.kind === 'sequence' || integration.review?.requiresPrivateReceipt === true;
      if (requiresReceipt && !item.receiptConfirmed && item.kind !== 'sequence') reasons.push('recibo-privado-pendiente');
      const readyToReview = complete && confirmedIntegration && observedNow && !!item.hash && item.kind !== 'unknown' && !!item.updatedAt &&
        (!requiresReceipt || item.receiptConfirmed) && item.integrityConfirmed;
      let action;
      if (fulfilled && complete && observedNow && confirmedIntegration) action = 'sin-cambios';
      else if (reviewed && complete && observedNow && confirmedIntegration) action = 'seguir-correccion';
      else action = readyToReview ? 'revisar' : 'bloqueado';
      if (item.receiptConfirmed) plan.summary.received++;
      if (reviewed) plan.summary.reviewed++;
      if (fulfilled) plan.summary.fulfilled++;
      if (!reviewed) plan.summary.pendingReview++;
      if (reviewed && !fulfilled) plan.summary.pendingCorrection++;
      if (action === 'bloqueado') plan.summary.blocked++;
      if (reviewed && complete && observedNow && confirmedIntegration) plan.summary.unchanged++;
      plan.queue.push({ integrationId: integration.id, id: item.id, hash: item.hash, kind: item.kind,
        action, state: fulfilled ? 'cumplido' : reviewed ? 'revisado' : item.receiptConfirmed ? 'recibido' : 'pendiente',
        observedNow, sourceComplete: complete, integrationConfirmed: confirmedIntegration,
        receiptConfirmed: item.receiptConfirmed, integrityConfirmed: item.integrityConfirmed, requiresPrivateReceipt: requiresReceipt,
        readyToReview, reasons: [...new Set(reasons)] });
    }
  }
  assert(plan.queue.length <= MAX_ITEMS, 'El estado conserva demasiadas chinches.');
  plan.work = plan.queue.filter(item => item.action !== 'sin-cambios');
  state.lastPlan = { schemaVersion: 1, cutoff: plan.cutoff, queue: plan.queue.map(q => ({ ...q })) };
  return { plan, state };
}
function compactPlan(plan) {
  return { schemaVersion: plan.schemaVersion, generatedAt: plan.generatedAt, cutoff: plan.cutoff,
    coverage: plan.coverage, summary: plan.summary, sources: plan.sources,
    work: plan.work, watermarkChanges: plan.watermarkChanges,
    unregisteredSources: plan.unregisteredSources, orphanedStateSources: plan.orphanedStateSources };
}
function acknowledge(previousState, args, options = {}) {
  const state = sanitizeState(previousState);
  assert(object(args) && id(args.integrationId) && id(args.id) && hash(args.hash), 'Identidad de acuse inválida.');
  assert(['revisado', 'cumplido'].includes(args.stage), 'Etapa de acuse inválida.');
  const evidence = cleanEvidence(args.evidence);
  const candidate = state.lastPlan?.queue.find(q => q.integrationId === args.integrationId && q.id === args.id);
  assert(candidate && candidate.hash === args.hash && candidate.observedNow && candidate.sourceComplete && candidate.integrationConfirmed && candidate.readyToReview && candidate.integrityConfirmed,
    'El último plan no acredita una chinche íntegra, actual y completamente observada.');
  const cached = get(get(state.items, args.integrationId), args.id);
  assert(cached && cached.hash === args.hash, 'La chinche cambió desde el último plan.');
  assert(cached.integrityConfirmed && cached.kind === candidate.kind && (cached.kind !== 'sequence' && !candidate.requiresPrivateReceipt || cached.receiptConfirmed && candidate.receiptConfirmed),
    'El estado no conserva integridad y recibo suficientes para esa etapa.');
  const at = options.now || new Date().toISOString();
  assert(instant(at), 'Fecha de acuse inválida.');
  if (!own(state.acknowledgements, args.integrationId)) state.acknowledgements[args.integrationId] = {};
  const pins = state.acknowledgements[args.integrationId];
  if (!own(pins, args.id)) pins[args.id] = {};
  if (!own(pins[args.id], args.hash)) pins[args.id][args.hash] = {};
  const stages = pins[args.id][args.hash];
  if (args.stage === 'cumplido') assert(!!stages.revisado, 'Cumplido exige primero revisión íntegra y su evidencia.');
  if (stages[args.stage]) {
    assert(stages[args.stage].evidence === evidence, 'Ya existe un acuse de esa etapa con otra evidencia.');
    return state;
  }
  stages[args.stage] = { at, evidence };
  return state;
}
function canonicalDestination(file) {
  const absolute = path.resolve(file);
  let ancestor = absolute;
  const rest = [];
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    assert(parent !== ancestor, 'No se pudo resolver el destino.');
    rest.unshift(path.basename(ancestor)); ancestor = parent;
  }
  return path.resolve(fs.realpathSync(ancestor), ...rest);
}
function assertPrivatePath(file, repoRoot = REPO_ROOT) {
  assert(typeof file === 'string' && file && !file.includes('\0'), 'Falta ruta privada de estado.');
  const target = canonicalDestination(file), repository = fs.realpathSync(repoRoot);
  assert(target !== repository && !target.startsWith(repository + path.sep), 'El estado y el plan de revisión deben quedar fuera del repositorio público.');
  for (let ancestor = path.dirname(target); ; ancestor = path.dirname(ancestor)) {
    assert(!fs.existsSync(path.join(ancestor, '.git')), 'El estado de revisión debe quedar fuera de cualquier repositorio Git.');
    if (path.dirname(ancestor) === ancestor) break;
  }
  return target;
}
function readJson(file, optional = false) {
  if (optional && !fs.existsSync(file)) return undefined;
  const stat = fs.statSync(file);
  assert(stat.isFile() && stat.size <= MAX_BYTES, 'Archivo JSON inválido o demasiado grande.');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writePrivateJson(file, value) {
  const destination = assertPrivatePath(file);
  const text = JSON.stringify(value, null, 2) + '\n';
  assert(Buffer.byteLength(text) <= MAX_BYTES, 'El estado de revisión supera el límite.');
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const temporary = destination + '.tmp-' + process.pid;
  fs.writeFileSync(temporary, text, { mode: 0o600, flag: 'wx' });
  try { fs.renameSync(temporary, destination); } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function cli(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const args = {};
  for (let n = 0; n < rest.length; n++) {
    assert(/^--[a-z-]+$/.test(rest[n]), 'Argumentos inválidos.');
    const key = rest[n].slice(2); assert(!own(args, key), 'Argumento duplicado.');
    if (key === 'compact') { args[key] = true; continue; }
    assert(rest[n + 1] !== undefined && !rest[n + 1].startsWith('--'), 'Argumentos inválidos.');
    args[key] = rest[++n];
  }
  assert(args.state, 'Indicar --state fuera del repositorio público.');
  const stateFile = assertPrivatePath(args.state);
  const state = readJson(stateFile, true);
  if (command === 'plan') {
    assert(Object.keys(args).every(k => ['snapshot', 'state', 'registry', 'out', 'compact'].includes(k)), 'Argumento de plan desconocido.');
    assert(args.snapshot, 'Indicar --snapshot con metadatos de fuentes.');
    const registry = readJson(args.registry || path.join(REPO_ROOT, 'chinche/registro.json'));
    const out = args.out ? assertPrivatePath(args.out) : null;
    const { plan, state: next } = planReview(readJson(args.snapshot), state, registry);
    const report = args.compact ? compactPlan(plan) : plan;
    // Preflight both destinations before writing either one.
    assert(!out || out !== stateFile, 'El plan y el estado necesitan rutas distintas.');
    assert(Buffer.byteLength(JSON.stringify(next, null, 2) + '\n') <= MAX_BYTES && Buffer.byteLength(JSON.stringify(report, null, 2) + '\n') <= MAX_BYTES, 'Plan demasiado grande.');
    writePrivateJson(stateFile, next);
    if (out) writePrivateJson(out, report);
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return report;
  }
  assert(command === 'ack', 'Usar plan o ack.');
  assert(Object.keys(args).every(k => ['state', 'integration', 'id', 'hash', 'stage', 'evidence'].includes(k)), 'Argumento de acuse desconocido.');
  const next = acknowledge(state, { integrationId: args.integration, id: args.id, hash: args.hash, stage: args.stage, evidence: args.evidence });
  writePrivateJson(stateFile, next);
  const receipt = { integrationId: args.integration, id: args.id, hash: args.hash, stage: args.stage, evidence: args.evidence };
  process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

module.exports = { emptyState, sanitizeState, planReview, compactPlan, acknowledge, assertPrivatePath, cli };
if (require.main === module) { try { cli(); } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; } }
