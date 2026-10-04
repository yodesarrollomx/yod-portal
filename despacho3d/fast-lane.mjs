// Fast lane client. The browser never holds the OS session credential here: the
// parent window mints a short-lived, case-bound token (mintFastSession) and this
// module streams one turn from the cloud engine. No browser storage, no logs.
const TOKEN = /^[A-Za-z0-9_-]{20,1024}\.[a-f0-9]{64}$/;
const ENDPOINT = /^https:\/\/[a-z0-9-]{1,63}\.onrender\.com$/;
const REQUEST_ID = /^[A-Za-z0-9_.:-]{1,200}$/;
export class FastLaneError extends Error {
  constructor(code, {started = false} = {}) { super(code); this.name = 'FastLaneError'; this.code = code; this.started = started; }
}
const KNOWN = new Set(['unauthorized', 'unavailable', 'busy', 'rate_limited', 'model_failed', 'auth_unavailable', 'provider_busy',
  'model_unavailable', 'context_unavailable', 'invalid_request', 'cancelled', 'fast_lane_unavailable']);
const known = code => (KNOWN.has(code) ? code : 'unavailable');

export function validateFastSession(value, caseId, now = Date.now()) {
  if (!value || value.ok !== true || value.case_id !== caseId || typeof value.token !== 'string' || !TOKEN.test(value.token) ||
      typeof value.endpoint !== 'string' || !ENDPOINT.test(value.endpoint) || !Number.isSafeInteger(value.expires_at) ||
      value.expires_at <= now) throw new FastLaneError('unavailable');
  return {case_id: caseId, token: value.token, endpoint: value.endpoint, expires_at: value.expires_at};
}

export async function* readEvents(body) {
  const decoder = new TextDecoder(); let buffer = '';
  const emit = block => {
    const name = /^event: (.+)$/m.exec(block)?.[1];
    const data = block.split('\n').filter(line => line.startsWith('data: ')).map(line => line.slice(6)).join('\n');
    if (!name || !data) return null;
    try { return {name, data: JSON.parse(data)}; } catch { return null; }
  };
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, {stream: true}).replace(/\r\n/g, '\n');
    let index;
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const event = emit(buffer.slice(0, index)); buffer = buffer.slice(index + 2);
      if (event) yield event;
    }
  }
}

export function createFastLaneClient({mint, fetchImpl = (...args) => globalThis.fetch(...args), now = () => Date.now()} = {}) {
  if (typeof mint !== 'function') throw new TypeError('mint is required');
  let session = null, minting = null;
  const forget = () => { session = null; };
  async function ensure(caseId) {
    if (session && session.case_id === caseId && session.expires_at - now() > 60000) return session;
    if (!minting) {
      minting = (async () => {
        let raw; try { raw = await mint({case_id: caseId}); } catch { throw new FastLaneError('unavailable'); }
        if (raw?.ok === false) throw new FastLaneError(raw.error === 'unauthorized' ? 'unauthorized' : 'unavailable');
        return (session = validateFastSession(raw, caseId, now()));
      })().finally(() => { minting = null; });
    }
    return minting;
  }
  /** Prepares the credential and the server-side case cache; never throws. */
  async function warm(caseId) {
    try {
      const current = await ensure(caseId);
      const response = await fetchImpl(current.endpoint + '/fast/hello', {headers: {Authorization: 'Bearer ' + current.token}, cache: 'no-store', credentials: 'omit'});
      if (response.status === 401) forget();
      return response.ok;
    } catch { return false; }
  }
  async function turn({case_id, message, request_id, signal, onEvent = () => {}}, retried = false) {
    if (typeof message !== 'string' || !message.trim() || message.length > 8000 || !REQUEST_ID.test(request_id || '')) throw new FastLaneError('invalid_request');
    const current = await ensure(case_id);
    let response;
    try {
      response = await fetchImpl(current.endpoint + '/fast/turn', {method: 'POST', cache: 'no-store', credentials: 'omit', signal,
        headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + current.token}, body: JSON.stringify({message, request_id})});
    } catch (error) { throw new FastLaneError(signal?.aborted ? 'cancelled' : 'unavailable'); }
    if (response.status === 401) { forget(); void response.body?.cancel?.(); if (retried) throw new FastLaneError('unauthorized'); return turn({case_id, message, request_id, signal, onEvent}, true); }
    if (!response.ok) { let code = 'unavailable'; try { code = known((await response.json()).error); } catch { /* keep generic */ } throw new FastLaneError(response.status === 429 ? 'rate_limited' : code); }
    if (!response.body) throw new FastLaneError('unavailable');
    let reply = '', final = null, saved = null, started = false;
    try {
      for await (const {name, data} of readEvents(response.body)) {
        if (signal?.aborted) throw new FastLaneError('cancelled', {started});
        if (name === 'ack') started = true;
        if (name === 'delta' && typeof data?.text === 'string') reply += data.text;
        if (name === 'final' && typeof data?.reply === 'string') { final = data; reply = data.reply; }
        if (name === 'saved') saved = true;
        if (name === 'save_pending') saved = false;
        if (name === 'error') throw new FastLaneError(known(data?.code), {started});
        onEvent(name, data);
        if (saved !== null && final) break;
      }
    } catch (error) {
      if (error instanceof FastLaneError) throw error;
      if (final) return {final, saved: false};            // the answer arrived; only the confirmation was cut
      throw new FastLaneError(signal?.aborted ? 'cancelled' : 'unavailable', {started});
    }
    if (!final) throw new FastLaneError('unavailable', {started});
    return {final, saved: saved === true};
  }
  return {warm, turn, forget};
}
