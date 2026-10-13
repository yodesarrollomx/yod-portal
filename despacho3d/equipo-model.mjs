/* Private records are supplied only by the authenticated host. No data or credentials here. */
export const TEAM_VERSION = 1;
const statuses = new Set(['Pendiente','En proceso','Espera OK de Alejandro','Hecho','Bloqueado']);
export function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(value)) return NaN;
  return Date.parse(value);
}
export function reviewSignal(member, now = Date.now()) {
  const at = time(member.last_review_at), cadence = member.cadence_minutes;
  if (member.kind === 'human') return {tone:'neutral',label:'Actividad registrada'};
  if (member.blocked === true) return {tone:'blocked',label:'Con un bloqueo'};
  if (!Number.isFinite(at) || at > now || !Number.isFinite(cadence) || cadence <= 0)
    return {tone:'unknown',label:'Revisión sin comprobar'};
  const age = now - at, limit = cadence * 60000;
  return age <= 2 * limit ? {tone:'recent',label:'Revisión reciente'}
    : age <= 3 * limit ? {tone:'late',label:'Revisión atrasada'}
    : {tone:'unknown',label:'Sin revisión reciente'};
}
export function safeLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
export function validateSnapshot(value) {
  if (!value || value.version !== TEAM_VERSION || !text(value.revision) || !Number.isFinite(time(value.read_at)) ||
      !Array.isArray(value.members) || !Array.isArray(value.tasks) || !Array.isArray(value.events))
    throw new Error('snapshot_invalid');
  for (const [name, rows] of [['members',value.members],['tasks',value.tasks],['events',value.events]]) {
    const seen = new Set();
    for (const row of rows) {
      if (!row || !text(row.id) || seen.has(row.id)) throw new Error('snapshot_invalid_' + name);
      seen.add(row.id);
    }
  }
  if (value.members.some(m => !text(m.label) || !['human','agent'].includes(m.kind)) ||
      value.tasks.some(t => !text(t.title) || !statuses.has(t.status)) ||
      value.events.some(e => !Number.isFinite(time(e.at)) || !text(e.text)))
    throw new Error('snapshot_invalid');
  return value;
}
// History contains only observed events. Today's mutable task status never leaks into a historical cutoff.
export function timeline(snapshot, lane, cutoff = Date.now()) {
  validateSnapshot(snapshot);
  if (!Number.isFinite(cutoff)) throw new Error('cutoff_invalid');
  if (lane === 'history') return snapshot.events.filter(e => time(e.at) <= cutoff)
    .slice().sort((a,b) => time(b.at) - time(a.at) || a.id.localeCompare(b.id));
  if (lane === 'plan') return snapshot.tasks.filter(t => t.status !== 'Hecho' && (t.next_action || Number.isFinite(time(t.due_at))))
    .slice().sort((a,b) => (time(a.due_at) || Infinity) - (time(b.due_at) || Infinity) || a.id.localeCompare(b.id));
  if (lane !== 'now') throw new Error('lane_invalid');
  return snapshot.tasks.filter(t => t.status !== 'Hecho').slice();
}
export function confirmedReceipt(receipt, intent) {
  return !!receipt && receipt.version === TEAM_VERSION && receipt.status === 'saved' &&
    text(receipt.id) && receipt.request_id === intent.request_id &&
    receipt.text === intent.text && receipt.kind === intent.kind &&
    (receipt.task_id || null) === (intent.task_id || null) &&
    text(receipt.revision) && Number.isFinite(time(receipt.recorded_at));
}
export function createTeamSession({transport, isAuthorized, identityEpoch, requestId}) {
  if (!transport || !['read','write','lookupReceipt'].every(k => typeof transport[k] === 'function') ||
      ![isAuthorized,identityEpoch,requestId].every(f => typeof f === 'function')) throw new TypeError('team_dependencies');
  let snapshot = null, pending = null, busy = false, generation = 0, readSequence = 0, closed = false;
  const epoch = identityEpoch();
  function authorized() {
    try { return !closed && isAuthorized() === true && identityEpoch() === epoch; } catch { return false; }
  }
  function requireAuthority() { if (!authorized()) { snapshot = null; pending = null; throw new Error('session_changed'); } }
  function sameAuthority(at) { requireAuthority(); if (at !== generation) throw new Error('session_changed'); }
  async function read() {
    requireAuthority(); const at = generation, sequence = ++readSequence;
    const result = await transport.read();
    sameAuthority(at);
    if (sequence !== readSequence) throw new Error('read_superseded');
    snapshot = structuredClone(validateSnapshot(result)); return structuredClone(snapshot);
  }
  function prepare({kind, text: body, task_id = null}) {
    requireAuthority();
    if (pending) throw new Error('pending_receipt');
    if (!snapshot) throw new Error('read_required');
    if (!['request','note'].includes(kind) || typeof body !== 'string' || !body.trim() || body.length > 12000 ||
        (kind === 'note' && !snapshot.tasks.some(t => t.id === task_id)) || (kind === 'request' && task_id !== null))
      throw new Error('instruction_invalid');
    const id = requestId();
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(id)) throw new Error('request_id_invalid');
    pending = Object.freeze({version:TEAM_VERSION,kind,text:body,task_id,request_id:id,expected_revision:snapshot.revision});
    return {...pending};
  }
  function finish(result, intent, at) {
    sameAuthority(at);
    if (!confirmedReceipt(result, intent)) throw new Error('receipt_unconfirmed');
    pending = null;
    return structuredClone(result);
  }
  async function send(reconcile = false) {
    requireAuthority();
    if (!pending || busy) throw new Error(busy ? 'busy' : 'instruction_required');
    busy = true; const at = generation, intent = pending;
    try {
      if (reconcile) {
        const result = await transport.lookupReceipt(intent.request_id);
        sameAuthority(at);
        if (result && result.status !== 'not_found') return finish(result, intent, at);
        if (!result || result.status !== 'not_found' || result.request_id !== intent.request_id) throw new Error('receipt_unconfirmed');
      }
      const result = await transport.write({...intent});
      return finish(result,intent,at);
    } finally { busy = false; }
  }
  function revoke() { closed = true; generation++; readSequence++; snapshot = null; pending = null; }
  return {read,prepare,send,revoke,pending:() => pending ? {...pending} : null};
}
