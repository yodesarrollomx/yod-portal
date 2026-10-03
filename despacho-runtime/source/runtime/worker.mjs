import {createHash, randomUUID} from 'node:crypto';
import {createBackendAdapter} from './backend-adapter.mjs';
import {boundedCall, diagnosticCode, fail, RuntimeError} from './errors.mjs';
import {assertBackendOK, matchingReceipt, payloadDigest, requireId, validateClaim, validateExecution,
  validateLease, validateSnapshot} from './validation.mjs';

const uncertain = new Set(['backend_timeout', 'backend_unavailable', 'server_dependency_failure']);

export class BoundedAgentWorker {
  constructor({backend, executor, worker_id, claim_request_id = randomUUID(),
    lease_duration_ms = 120000, executor_timeout_ms = 60000, operation_timeout_ms = 5000,
    read_timeout_ms = operation_timeout_ms,
    recovery_attempts = 2, now = Date.now} = {}) {
    this.backend = createBackendAdapter(backend);
    if (typeof executor?.execute !== 'function') fail('adapter_unavailable');
    if (typeof now !== 'function' || !Number.isInteger(operation_timeout_ms) || operation_timeout_ms < 1
      || operation_timeout_ms > 30000 || !Number.isInteger(executor_timeout_ms) || executor_timeout_ms < 1
      || executor_timeout_ms > 120000 || !Number.isInteger(lease_duration_ms) || lease_duration_ms < 1000
      || lease_duration_ms > 120000 || !Number.isInteger(recovery_attempts) || recovery_attempts < 1
      || recovery_attempts > 3 || !Number.isInteger(read_timeout_ms) || read_timeout_ms < 1
      || read_timeout_ms > 30000) fail('invalid_configuration');
    this.executor = executor;
    this.workerId = requireId(worker_id);
    this.claimId = requireId(claim_request_id);
    this.leaseDuration = lease_duration_ms;
    this.executionTimeout = executor_timeout_ms;
    this.operationTimeout = operation_timeout_ms;
    this.readTimeout = read_timeout_ms;
    this.recoveryAttempts = recovery_attempts;
    this.now = now;
  }

  // Memoization bounds the entire worker instance to one claim and at most one
  // executor invocation, including concurrent calls to runOnce().
  runOnce() {
    this.running ??= this.run();
    return this.running;
  }

  async call(name, request) {
    const timeout = ['claimJob','readSnapshot','checkLease'].includes(name) ? this.readTimeout : this.operationTimeout;
    return assertBackendOK(await boundedCall(this.backend[name], request, timeout));
  }

  async run() {
    let claim;
    const claimRequest = {worker_id: this.workerId, claim_request_id: this.claimId,
      lease_duration_ms: this.leaseDuration};
    for (let attempt = 0; attempt < this.recoveryAttempts; attempt++) {
      try {
        claim = validateClaim(await this.call('claimJob', claimRequest), this.claimId, this.now());
        break;
      } catch (error) {
        const code = diagnosticCode(error);
        if (!uncertain.has(code))
          return {state: 'blocked', diagnostic: {code}};
      }
    }
    if (claim === undefined) return {state: 'unconfirmed', diagnostic: {code: 'claim_unconfirmed'}, claim_request_id: this.claimId};
    if (claim === null) return {state: 'idle'};
    if (claim.settled) return {state: claim.receipt.state, ...claim.job,
      completion_id: claim.receipt.completion_id, confirmed: true, recovered: true};
    const {job, lease} = claim;
    const binding = {...job, lease_token: lease.token};
    const completionId = `completion:${createHash('sha256').update(this.claimId).digest('hex')}`;
    try {
      const snapshot = validateSnapshot(await this.call('readSnapshot', binding), job);
      await this.assertCurrent(binding, job, lease);
      const reserve = this.readTimeout + 2 * this.recoveryAttempts * this.operationTimeout + 1000;
      const executionBudget = Math.min(this.executionTimeout, Date.parse(lease.expires_at) - this.now() - reserve);
      if (executionBudget < 1) fail('lease_insufficient');
      const execution = await boundedCall(this.executor.execute.bind(this.executor),
        {snapshot: structuredClone(snapshot), timeout_ms: executionBudget}, executionBudget, 'executor_timeout');
      const result = validateExecution(execution, snapshot);
      await this.assertCurrent(binding, job, lease);
      return await this.persist('completeJob', {...binding, completion_id: completionId, result}, result.status);
    } catch (error) {
      // A diagnostic is also a fenced durable operation. Rejected or uncertain
      // diagnostic persistence is reported as such; it never becomes a fake success.
      const code = diagnosticCode(error, 'executor_failed');
      const outcome = await this.persist('stopJob', {...binding, completion_id: completionId,
        diagnostic: {code}}, 'stopped');
      return {...outcome, diagnostic: {code}, ...(outcome.diagnostic && outcome.diagnostic.code !== code
        ? {persistence_diagnostic: outcome.diagnostic} : {})};
    }
  }

  async assertCurrent(binding, job, lease) {
    if (Date.parse(lease.expires_at) <= this.now()) throw new RuntimeError('lease_expired');
    validateLease(await this.call('checkLease', binding), job, lease, this.now());
  }

  async persist(operation, request, state) {
    request = {...request, payload_digest: payloadDigest(operation, request.result ?? request.diagnostic)};
    const outcome = {job_id: request.job_id, case_id: request.case_id,
      source_revision: request.source_revision, completion_id: request.completion_id};
    // Replay the same frozen logical completion. Never rerun the executor while
    // recovering a lost completion ACK, and never switch completion to stop.
    for (let attempt = 0; attempt < this.recoveryAttempts; attempt++) {
      try {
        const ack = await this.call(operation, request);
        if (matchingReceipt(ack, request, state)) return {state, ...outcome, confirmed: true};
      } catch (error) {
        const code = diagnosticCode(error);
        if (!uncertain.has(code) && code !== 'invalid_ack')
          return {state: 'blocked', ...outcome, confirmed: false, diagnostic: {code}};
      }
      try {
        const receipt = await this.call('reconcileJob', {...outcome, lease_token: request.lease_token,
          payload_digest: request.payload_digest});
        if (matchingReceipt(receipt, request, state)) return {state, ...outcome, confirmed: true, recovered: true};
        if (!matchingReceipt(receipt, request, 'uncommitted'))
          return {state: 'unconfirmed', ...outcome, confirmed: false, diagnostic: {code: 'invalid_ack'}};
      } catch (error) {
        const code = diagnosticCode(error);
        if (!uncertain.has(code))
          return {state: 'blocked', ...outcome, confirmed: false, diagnostic: {code}};
      }
    }
    return {state: 'unconfirmed', ...outcome, confirmed: false, diagnostic: {code: 'completion_unconfirmed'}};
  }
}
