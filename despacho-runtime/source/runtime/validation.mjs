import {fail} from './errors.mjs';
import {createHash} from 'node:crypto';

export const MAX_SNAPSHOT_BYTES = 128 * 1024;
export const MAX_RESULT_BYTES = 32 * 1024;
const statuses = new Set(['awaiting_data', 'awaiting_approval', 'completed']);
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(value);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exact = (value, fields) => plain(value) && Object.keys(value).length === fields.length
  && fields.every(field => Object.hasOwn(value, field));
const boundedString = (value, max) => typeof value === 'string' && value.trim().length > 0
  && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);

export function requireId(value, code = 'invalid_configuration') {
  if (!identifier(value)) fail(code);
  return value;
}

export function jsonCopy(value, maxBytes, code) {
  let encoded;
  try { encoded = JSON.stringify(value); } catch { fail(code); }
  if (typeof encoded !== 'string' || Buffer.byteLength(encoded) > maxBytes) fail(code);
  const copy = JSON.parse(encoded);
  const visit = (node, depth = 0) => {
    if (depth > 24) fail(code);
    if (Array.isArray(node)) { if (node.length > 2000) fail(code); node.forEach(item => visit(item, depth + 1)); }
    else if (plain(node)) { if (Object.keys(node).length > 2000) fail(code); Object.values(node).forEach(item => visit(item, depth + 1)); }
  };
  visit(copy);
  return copy;
}

export function validateClaim(value, requestId, now) {
  if (!plain(value) || value.ok !== true || value.claim_request_id !== requestId) fail('invalid_claim');
  if (value.state === 'idle') return null;
  if (value.state === 'settled') {
    if (!exact(value.job, ['job_id', 'case_id', 'source_revision'])) fail('invalid_claim');
    Object.values(value.job).forEach(id => requireId(id, 'invalid_claim'));
    const completion_id = `completion:${createHash('sha256').update(requestId).digest('hex')}`;
    const receipt = value.receipt;
    if (!plain(receipt) || ![...statuses, 'stopped'].includes(receipt.state)
      || !/^[a-f0-9]{64}$/.test(receipt.payload_digest || '')
      || !matchingReceipt(receipt, {...value.job, completion_id, payload_digest: receipt.payload_digest}, receipt.state))
      fail('invalid_claim');
    return {settled: true, job: {...value.job}, receipt: {...receipt}};
  }
  if (value.state !== 'claimed' || !exact(value.job, ['job_id', 'case_id', 'source_revision'])
    || !exact(value.lease, ['token', 'expires_at'])) fail('invalid_claim');
  Object.values(value.job).forEach(id => requireId(id, 'invalid_claim'));
  requireId(value.lease.token, 'invalid_claim');
  const expires = Date.parse(value.lease.expires_at);
  if (!Number.isFinite(expires)) fail('invalid_claim');
  if (expires <= now) fail('lease_expired');
  return {job: {...value.job}, lease: {...value.lease}};
}

export function validateSnapshot(value, job) {
  if (!plain(value) || value.ok !== true || value.job_id !== job.job_id || value.case_id !== job.case_id)
    fail('invalid_snapshot');
  if (value.source_revision !== job.source_revision) fail('stale_revision');
  if (!Array.isArray(value.source_refs) || value.source_refs.length > 1000
    || value.source_refs.some(ref => !boundedString(ref, 1000))
    || new Set(value.source_refs).size !== value.source_refs.length || !plain(value.context)) fail('invalid_snapshot');
  validateCoreContext(value.context, job.case_id);
  return jsonCopy({job_id: job.job_id, case_id: job.case_id, source_revision: job.source_revision,
    source_refs: value.source_refs, context: value.context}, MAX_SNAPSHOT_BYTES, 'invalid_snapshot');
}

export function validateCoreContext(context, caseId) {
  if (!plain(context) || !plain(context.identity) || context.identity.case_id !== caseId
    || !boundedString(context.identity.name, 200) || !boundedString(context.mandate, 5000)
    || !boundedString(context.instruction, 12000)) fail('invalid_snapshot');
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (plain(value)) return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

export function payloadDigest(operation, payload) {
  return createHash('sha256').update(canonicalJson({operation, payload}), 'utf8').digest('hex');
}

export function validateLease(value, job, lease, now) {
  if (!plain(value) || value.ok !== true || value.valid !== true || value.job_id !== job.job_id
    || value.case_id !== job.case_id) fail('invalid_lease');
  if (value.source_revision !== job.source_revision) fail('stale_revision');
  if (value.lease_token !== lease.token) fail('lease_fenced');
  const expires = Date.parse(value.expires_at);
  // This worker does not renew a lease. Any changed expiry must be reconciled server-side.
  if (!Number.isFinite(expires) || value.expires_at !== lease.expires_at) fail('invalid_lease');
  if (expires <= now) fail('lease_expired');
}

export function validateResult(value, snapshot) {
  // Language is required by the output schema and prompt. A keyword whitelist
  // cannot classify a literal code, a number, or a short Spanish answer.
  if (!exact(value, ['case_id', 'language', 'reply', 'status', 'source_refs', 'next_action'])
    || value.case_id !== snapshot.case_id || value.language !== 'es'
    || !boundedString(value.reply, 12000)
    || !statuses.has(value.status) || !boundedString(value.next_action, 1000)
    || !Array.isArray(value.source_refs) || value.source_refs.length > 1000
    || new Set(value.source_refs).size !== value.source_refs.length
    || value.source_refs.some(ref => !snapshot.source_refs.includes(ref))) fail('invalid_result');
  return jsonCopy(value, MAX_RESULT_BYTES, 'invalid_result');
}

export function validateExecution(value, snapshot) {
  if (!plain(value) || value.authenticated !== true) fail('auth_unavailable');
  if (!identifier(value.execution_id) || value.job_id !== snapshot.job_id
    || value.case_id !== snapshot.case_id || value.source_revision !== snapshot.source_revision) fail('invalid_result');
  return validateResult(value.result, snapshot);
}

export function matchingReceipt(value, request, state) {
  return plain(value) && value.ok === true && value.state === state
    && ['job_id', 'case_id', 'source_revision', 'completion_id', 'payload_digest'].every(key => value[key] === request[key]);
}

export function assertBackendOK(value) {
  if (!plain(value) || value.ok !== true) fail(value?.error || 'backend_unavailable');
  return value;
}
