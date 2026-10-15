// Opt-in core. No DOM, network, storage, credentials or singleton at import time.
export function createLoadCoordinator({
  context,
  limits = {},
  now = () => Date.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  defer = queueMicrotask,
} = {}) {
  const cap = { network: 4, cpu: 1, background: 1, origin: 2, lane: 1, reserve: 1, ...limits };
  for (const [key, value] of Object.entries(cap)) {
    if (!Number.isInteger(value) || value < (key === 'reserve' ? 0 : 1)) throw new TypeError('invalid_limit');
  }
  if (cap.reserve >= cap.network) throw new TypeError('invalid_reserve');
  const scopeOf = x => {
    if (!x || typeof x.sessionEpoch !== 'string' || !x.sessionEpoch) throw new TypeError('opaque_epoch_required');
    if (typeof x.caseId !== 'string' || !Number.isSafeInteger(x.selectionGeneration) || x.selectionGeneration < 0) throw new TypeError('invalid_context');
    return Object.freeze({ sessionEpoch: x.sessionEpoch, caseId: x.caseId, selectionGeneration: x.selectionGeneration });
  };
  let current = scopeOf(context), closed = false, backgroundPaused = false, queued = false, serial = 0;
  const live = new Set(), flights = new Map(), ids = new Set(), handles = new WeakMap();
  const currentFor = task => current && task.scope.sessionEpoch === current.sessionEpoch &&
    (task.scopeType === 'session' || (task.scope.caseId === current.caseId && task.scope.selectionGeneration === current.selectionGeneration));
  const priorityOf = task => Math.min(task.inheritedPriority ?? Infinity,
    ...[...task.consumers].filter(c => !c.done).map(c => c.priority));
  const plan = () => { if (!queued) { queued = true; defer(() => { queued = false; pump(); }); } };
  const deliver = (consumer, outcome) => {
    if (consumer.done) return;
    consumer.done = true;
    consumer.outcome = outcome;
    consumer.resolve(Object.freeze(outcome));
  };
  const detachFlight = task => { if (flights.get(task.key) === task) flights.delete(task.key); };
  const settle = (task, state, reason, value) => {
    if (task.outcome) return;
    task.state = state;
    task.outcome = Object.freeze({ state, ...(reason ? { reason } : {}),
      ...(state === 'succeeded' ? { value } : {}), current: !!currentFor(task) });
    clearTimer(task.timer);
    detachFlight(task);
    for (const c of task.consumers) deliver(c, task.outcome);
    // Abort is only a request. An adapter ignoring it keeps its physical slot
    // until run() actually settles; never launch an invisible replacement burst.
    if (!task.active) live.delete(task);
    plan();
  };
  const stopRead = (task, reason) => {
    settle(task, 'cancelled', reason);
    if (task.active) task.controller.abort();
  };
  function expire(task) {
    if (task.outcome) return;
    if (task.kind === 'write' && task.active) {
      settle(task, 'failed', 'write_outcome_unknown');
    } else {
      settle(task, 'failed', 'deadline_exceeded');
      if (task.active) task.controller.abort();
    }
  }
  function dependencyState(task) {
    for (const dep of task.dependencies) {
      if (!dep.outcome) return 'waiting';
      if (dep.outcome.state !== 'succeeded') return 'failed';
    }
    return 'ready';
  }
  function fits(task) {
    const running = [...live].filter(t => t.active);
    const sameResource = running.filter(t => t.resource === task.resource);
    const priority = priorityOf(task);
    if (sameResource.length >= cap[task.resource]) return false;
    if (task.resource === 'network') {
      const origin = sameResource.filter(t => t.origin === task.origin);
      if (origin.length >= cap.origin || origin.filter(t => t.lane === task.lane).length >= cap.lane) return false;
      if (priority >= 2 && (sameResource.length >= cap.network - cap.reserve ||
          origin.length >= Math.max(1, cap.origin - cap.reserve))) return false;
    }
    if (priority >= 2) {
      if (backgroundPaused || running.filter(t => t.admittedPriority >= 2).length >= cap.background) return false;
      if ([...live].some(t => !t.outcome && !t.active && priorityOf(t) <= 1 && dependencyState(t) === 'ready')) return false;
    }
    return true;
  }
  function start(task) {
    task.active = true;
    task.state = 'running';
    task.startedAt = now();
    task.admittedPriority = priorityOf(task);
    const contextAtStart = task.scope;
    // A run adapter must perform the existing permission check and must not
    // mutate the UI directly. The caller publishes only a current outcome.
    Promise.resolve().then(() => {
      if (task.outcome) return undefined;
      if (!currentFor(task)) { settle(task, 'cancelled', 'stale_scope'); return undefined; }
      return task.run({ signal: task.controller.signal, scope: contextAtStart });
    }).then(value => {
      if (task.outcome) return;
      if (task.kind !== 'write' && !currentFor(task)) stopRead(task, 'stale_scope');
      else settle(task, 'succeeded', null, value);
    }, () => settle(task, 'failed', task.kind === 'write' ? 'write_outcome_unknown' : 'run_failed'))
      .finally(() => { task.active = false; live.delete(task); plan(); });
  }
  function pump() {
    // Dependencies are earlier handles, hence an acyclic graph. Propagate
    // urgency backwards so a visible operation never waits on paused preload.
    for (const task of live) task.inheritedPriority = Infinity;
    for (const task of [...live].sort((a, b) => b.order - a.order)) {
      if (!task.outcome) for (const dep of task.dependencies) {
        if (!dep.outcome) dep.inheritedPriority = Math.min(dep.inheritedPriority, priorityOf(task));
      }
    }
    for (const task of [...live]) {
      if (task.outcome || task.active) continue;
      if (!currentFor(task)) { settle(task, 'cancelled', 'stale_scope'); continue; }
      if (task.deadline <= now()) { expire(task); continue; }
      const deps = dependencyState(task);
      if (deps === 'failed') { settle(task, 'failed', 'dependency_failed'); continue; }
      task.state = deps === 'waiting' ? 'blocked' : 'pending';
    }
    const ready = [...live].filter(t => !t.outcome && !t.active && t.state === 'pending')
      .sort((a, b) => priorityOf(a) - priorityOf(b) || a.order - b.order);
    for (const task of ready) if (fits(task)) start(task);
  }
  function submit(spec) {
    if (closed || !current) throw new Error('coordinator_unavailable');
    const { taskId, resourceKey, revision, run, kind = 'read', priority = 1,
      resource = 'network', origin = 'default', lane = 'default', scopeType = 'selection',
      dependencies = [], timeoutMs = 25000 } = spec;
    if (typeof taskId !== 'string' || !taskId || ids.has(taskId)) throw new TypeError('unique_task_id_required');
    if (typeof resourceKey !== 'string' || !resourceKey || typeof revision !== 'string' || typeof run !== 'function') throw new TypeError('invalid_operation');
    if (!['read', 'write', 'asset'].includes(kind) || !['network', 'cpu'].includes(resource) || !['session', 'selection'].includes(scopeType) ||
        !Number.isInteger(priority) || priority < 0 || priority > 3 || !Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647 ||
        typeof origin !== 'string' || typeof lane !== 'string' || !Array.isArray(dependencies)) throw new TypeError('invalid_task');
    if (kind === 'write' && priority > 1) throw new TypeError('speculative_write_forbidden');
    const scope = scopeOf(spec.scope ?? current);
    const deps = dependencies.map(handle => {
      const t = handles.get(handle);
      if (!t || t.scope.sessionEpoch !== scope.sessionEpoch ||
          (t.scopeType === 'selection' && (t.scope.caseId !== scope.caseId || t.scope.selectionGeneration !== scope.selectionGeneration || scopeType === 'session')))
        throw new TypeError('invalid_dependency_scope');
      return t;
    });
    // resourceKey includes canonical operation+parameters. revision includes
    // adapter/policy version. No credentials or raw request URLs belong here.
    const key = JSON.stringify([kind, resourceKey, revision, scope.sessionEpoch,
      scopeType, scopeType === 'selection' ? [scope.caseId, scope.selectionGeneration] : null,
      resource, origin, lane, timeoutMs, deps.map(t => t.order)]);
    let task = kind !== 'write' && flights.get(key);
    if (!task) {
      task = { key, kind, resource, origin, lane, scopeType, scope, run, dependencies: deps,
        order: ++serial, state: 'pending', consumers: new Set(), controller: new AbortController(),
        active: false, outcome: null, queuedAt: now(), deadline: now() + timeoutMs };
      if (!currentFor(task)) throw new TypeError('stale_scope');
      live.add(task);
      if (kind !== 'write') flights.set(key, task);
      task.timer = setTimer(() => expire(task), timeoutMs);
    }
    ids.add(taskId);
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    const consumer = { priority, resolve, done: false };
    task.consumers.add(consumer);
    const handle = Object.freeze({
      promise,
      cancel() {
        if (consumer.done) return false;
        if (task.kind === 'write' && task.active) return false;
        deliver(consumer, { state: 'cancelled', reason: 'consumer_cancelled', current: !!currentFor(task) });
        if ([...task.consumers].every(c => c.done)) stopRead(task, 'no_consumers');
        plan();
        return true;
      },
      promote(to) {
        if (!Number.isInteger(to) || to < 0 || to > 3) throw new TypeError('invalid_priority');
        if (consumer.done) return false;
        consumer.priority = Math.min(consumer.priority, to);
        plan();
        return true;
      },
      status() {
        return Object.freeze({ state: consumer.done ? consumer.outcome.state : task.state,
          queueMs: (task.startedAt ?? now()) - task.queuedAt, active: task.active,
          current: !!currentFor(task) });
      },
    });
    handles.set(handle, task);
    promise.then(() => { if (task.kind !== 'write') ids.delete(taskId); task.consumers.delete(consumer); });
    plan();
    return handle;
  }
  function changeContext(next) {
    current = next;
    for (const task of [...live]) if (!currentFor(task) && !task.outcome) {
      if (task.kind === 'write' && task.active) continue;
      stopRead(task, 'stale_scope');
    }
    plan();
  }
  return Object.freeze({
    submit,
    setContext(next) { if (closed) throw new Error('coordinator_closed'); changeContext(scopeOf(next)); },
    revoke() { changeContext(null); },
    pauseBackground(paused = true) { backgroundPaused = !!paused; plan(); },
    dispose() { closed = true; changeContext(null); },
    snapshot() {
      return Object.freeze({ active: [...live].filter(t => t.active).length,
        pending: [...live].filter(t => !t.active && !t.outcome).length,
        blocked: [...live].filter(t => t.state === 'blocked').length,
        draining: [...live].filter(t => t.active && t.outcome).length,
        backgroundPaused, closed });
    },
  });
}
