const test = require('node:test');
const assert = require('node:assert/strict');
const mod = import('../os/load-coordinator.mjs');
const ctx = (epoch = 'epoch-a', caseId = 'case-a', generation = 1) => ({ sessionEpoch: epoch, caseId, selectionGeneration: generation });
const drain = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
async function fixture(options = {}) {
  const { createLoadCoordinator } = await mod;
  let time = 0, timerId = 0;
  const timers = new Map();
  const c = createLoadCoordinator({ context: ctx(), now: () => time,
    setTimer: (fn, ms) => { timers.set(++timerId, { fn, at: time + ms }); return timerId; },
    clearTimer: id => timers.delete(id), ...options });
  let n = 0;
  const submit = (extra = {}) => c.submit({ taskId: `task-${++n}`, resourceKey: `op-${n}`, revision: 'v1', run: async () => n, ...extra });
  return { c, submit, async tick(ms) { time += ms; for (const [id, t] of [...timers]) if (t.at <= time) { timers.delete(id); t.fn(); } await drain(); } };
}
test('P0/P1 first, independent work parallel, background progresses after foreground', async () => {
  const { submit } = await fixture(); const order = [];
  const tasks = [3, 2, 1, 0].map(p => submit({ priority: p, origin: `origin-${p}`, run: async () => order.push(p) }));
  await Promise.all(tasks.map(t => t.promise)); assert.deepEqual(order, [0, 1, 2, 3]);
});
test('global/origin/lane limits and reserved foreground capacity', async () => {
  const { c, submit } = await fixture(); const gate = deferred(); const order = [];
  const run = label => () => { order.push(label); return gate.promise; };
  const a = submit({ priority: 3, run: run('background'), lane: 'a' });
  await drain();
  const b = submit({ priority: 3, lane: 'b', run: run('background2') });
  const visible = submit({ priority: 1, lane: 'c', run: run('visible') });
  const sameLane = submit({ priority: 0, lane: 'c', run: run('same-lane') });
  await drain(); assert.equal(c.snapshot().active, 2); assert.deepEqual(order, ['background', 'same-lane']);
  gate.resolve(); await Promise.all([a, b, visible, sameLane].map(t => t.promise)); assert.equal(c.snapshot().pending, 0);
});
test('three equal requests share one execution; new revision/case/epoch does not', async () => {
  const { submit, c } = await fixture(); let calls = 0; const run = async () => ++calls;
  const hs = Array.from({ length: 3 }, () => submit({ resourceKey: 'catalog', run }));
  assert.deepEqual((await Promise.all(hs.map(h => h.promise))).map(x => x.value), [1, 1, 1]);
  await submit({ resourceKey: 'catalog', revision: 'v2', run }).promise;
  c.setContext(ctx('epoch-a', 'case-b', 2)); await submit({ resourceKey: 'catalog', run }).promise;
  c.setContext(ctx('epoch-b', 'case-b', 2)); await submit({ resourceKey: 'catalog', run }).promise;
  assert.equal(calls, 4);
});
test('cancel one consumer preserves the shared read and promotes without duplication', async () => {
  const { c, submit } = await fixture(); c.pauseBackground(); let calls = 0;
  const a = submit({ resourceKey: 'shared', priority: 3, run: async () => ++calls });
  const b = submit({ resourceKey: 'shared', priority: 3, run: async () => ++calls });
  a.cancel(); b.promote(1); assert.equal((await a.promise).state, 'cancelled');
  assert.equal((await b.promise).value, 1); assert.equal(calls, 1);
});
test('last consumer cancellation aborts read but retains physical slot until settlement', async () => {
  const { c, submit } = await fixture({ limits: { network: 1, reserve: 0 } });
  const gate = deferred(); let signal, later = 0;
  const a = submit({ run: x => { signal = x.signal; return gate.promise; } }); await drain();
  a.cancel(); const b = submit({ run: async () => ++later }); await drain();
  assert.equal(signal.aborted, true); assert.equal(c.snapshot().draining, 1); assert.equal(later, 0);
  gate.resolve('late'); assert.equal((await a.promise).state, 'cancelled'); await b.promise; assert.equal(later, 1);
});
test('dependencies block only their branch and failures do not poison independent work', async () => {
  const { submit } = await fixture(); const gate = deferred(); let dependent = 0;
  const parent = submit({ run: () => gate.promise });
  const child = submit({ dependencies: [parent], run: () => ++dependent });
  const independent = submit({ origin: 'other', run: async () => 'ready' });
  await drain(); assert.equal(child.status().state, 'blocked'); assert.equal((await independent.promise).value, 'ready');
  gate.reject(new Error('private body must not escape')); assert.equal((await child.promise).reason, 'dependency_failed'); assert.equal(dependent, 0);
});
test('successful dependency unlocks child, FIFO within same priority', async () => {
  const { submit } = await fixture(); const order = [];
  const parent = submit({ run: async () => order.push('access') });
  const a = submit({ dependencies: [parent], run: async () => order.push('catalog') });
  const b = submit({ dependencies: [parent], run: async () => order.push('other') });
  await Promise.all([a.promise, b.promise]); assert.deepEqual(order, ['access', 'catalog', 'other']);
});
test('urgent operation promotes its dependency chain even while preload is paused', async () => {
  const { c, submit } = await fixture(); c.pauseBackground(); const order = [];
  const a = submit({ priority: 3, run: async () => order.push('access') });
  const b = submit({ priority: 3, dependencies: [a], run: async () => order.push('catalog') });
  const work = submit({ priority: 0, dependencies: [b], run: async () => order.push('visible') });
  await work.promise; assert.deepEqual(order, ['access', 'catalog', 'visible']);
});
test('same operation in different lanes/revisions is not accidentally coalesced', async () => {
  const { submit } = await fixture(); let calls = 0;
  const hs = ['a', 'b'].map(lane => submit({ lane, resourceKey: 'same', run: async () => ++calls }));
  await Promise.all(hs.map(h => h.promise)); assert.equal(calls, 2);
});
test('A→B invalidates late A result and does not let it replace B', async () => {
  const { c, submit } = await fixture(); const gate = deferred();
  const a = submit({ run: () => gate.promise }); await drain();
  c.setContext(ctx('epoch-a', 'case-b', 2));
  const b = submit({ origin: 'other', run: async () => 'B' });
  gate.resolve('private-A'); assert.equal((await a.promise).reason, 'stale_scope'); assert.equal((await a.promise).value, undefined);
  assert.equal((await b.promise).value, 'B');
});
test('session-scoped read survives selection change but never a change of identity', async () => {
  const { c, submit } = await fixture(); const gate = deferred();
  const a = submit({ scopeType: 'session', run: () => gate.promise }); await drain();
  c.setContext(ctx('epoch-a', 'case-b', 2)); gate.resolve('catalog'); assert.equal((await a.promise).state, 'succeeded');
  const second = deferred(); const b = submit({ scopeType: 'session', run: () => second.promise }); await drain();
  c.setContext(ctx('epoch-b')); second.resolve('old'); assert.equal((await b.promise).state, 'cancelled');
});
test('revocation rejects new work and cancels reads; fresh context must be supplied explicitly', async () => {
  const { c, submit } = await fixture(); const gate = deferred(); const a = submit({ run: () => gate.promise });
  await drain(); c.revoke(); assert.throws(() => submit(), /unavailable/); gate.resolve(); assert.equal((await a.promise).state, 'cancelled');
  c.setContext(ctx('new-verified-epoch')); assert.equal((await submit().promise).state, 'succeeded');
});
test('writes never dedupe or run speculatively; cancellation/context change does not abort admitted write', async () => {
  const { c, submit } = await fixture(); const gate = deferred(); let signal, calls = 0;
  assert.throws(() => submit({ kind: 'write', priority: 2 }), /speculative_write/);
  const a = submit({ resourceKey: 'save', kind: 'write', run: x => { calls++; signal = x.signal; return gate.promise; } });
  await drain(); assert.equal(a.cancel(), false); c.setContext(ctx('epoch-b')); assert.equal(signal.aborted, false);
  gate.resolve({ receipt: 'synthetic' }); const result = await a.promise;
  assert.equal(result.current, false); assert.equal(result.value.receipt, 'synthetic');
  const b = submit({ resourceKey: 'save', kind: 'write', run: async () => ++calls }); await b.promise; assert.equal(calls, 2);
});
test('lost write ACK reports uncertainty, never retries or reuses task ID', async () => {
  const { c, submit, tick } = await fixture(); const gate = deferred(); let calls = 0, signal;
  const a = submit({ taskId: 'write-one', kind: 'write', timeoutMs: 10, run: x => { calls++; signal = x.signal; return gate.promise; } });
  await drain(); await tick(11); assert.equal((await a.promise).reason, 'write_outcome_unknown'); assert.equal(signal.aborted, false);
  assert.throws(() => submit({ taskId: 'write-one', kind: 'write' }), /unique_task_id/);
  assert.equal(c.snapshot().draining, 1); gate.resolve('late-ack'); await drain(); assert.equal(calls, 1); assert.equal(c.snapshot().active, 0);
});
test('deadline includes queue wait and no expired task reaches adapter', async () => {
  const { c, submit, tick } = await fixture(); c.pauseBackground(); let calls = 0;
  const a = submit({ priority: 3, timeoutMs: 10, run: () => ++calls }); await tick(11); c.pauseBackground(false);
  assert.equal((await a.promise).reason, 'deadline_exceeded'); await drain(); assert.equal(calls, 0);
});
test('read timeout keeps slot until adapter finishes; no automatic retry storm', async () => {
  const { c, submit, tick } = await fixture({ limits: { network: 1, reserve: 0 } }); const gate = deferred(); let signal, calls = 0;
  const a = submit({ timeoutMs: 10, run: x => { signal = x.signal; return gate.promise; } }); await drain(); await tick(11);
  const b = submit({ run: async () => ++calls }); await drain(); assert.equal(calls, 0); assert.equal(signal.aborted, true);
  assert.equal((await a.promise).reason, 'deadline_exceeded'); gate.resolve(); await b.promise; assert.equal(calls, 1);
});
test('CPU and network have independent budgets; paused background resumes in bounded order', async () => {
  const { c, submit } = await fixture(); const gate = deferred(); const order = [];
  const cpu = submit({ resource: 'cpu', run: () => gate.promise }); await drain(); c.pauseBackground();
  const bg = submit({ priority: 3, run: async () => order.push('bg') });
  const fg = submit({ run: async () => order.push('fg') }); await fg.promise; assert.deepEqual(order, ['fg']);
  c.pauseBackground(false); await bg.promise; gate.resolve(); await cpu.promise; assert.deepEqual(order, ['fg', 'bg']);
});
test('foreign/cross-case dependencies and stale scopes fail before scheduling', async () => {
  const { c, submit } = await fixture(); const other = await fixture();
  const foreign = other.submit(); await foreign.promise; assert.throws(() => submit({ dependencies: [foreign] }), /dependency_scope/);
  const a = submit(); await a.promise; c.setContext(ctx('epoch-a', 'case-b', 2));
  assert.throws(() => submit({ dependencies: [a] }), /dependency_scope/);
  assert.throws(() => submit({ scope: ctx('old') }), /stale_scope/);
});
test('dispose cancels pending work without calling adapters', async () => {
  const { c, submit } = await fixture(); let calls = 0; const a = submit({ run: () => ++calls }); c.dispose();
  assert.equal((await a.promise).state, 'cancelled'); await drain(); assert.equal(calls, 0); assert.throws(() => submit(), /unavailable/);
});
test('safe snapshots exclude request keys, bodies, exceptions and identity', async () => {
  const { c, submit } = await fixture(); const a = submit({ resourceKey: 'private-operation', run: () => { throw new Error('private-error'); } });
  const result = await a.promise; assert.equal(result.reason, 'run_failed');
  assert.equal(JSON.stringify({ result, snapshot: c.snapshot() }).includes('private-'), false);
});
