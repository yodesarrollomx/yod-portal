const CODES = new Set([
  'adapter_unavailable', 'invalid_configuration', 'backend_timeout', 'backend_unavailable',
  'invalid_claim', 'invalid_snapshot', 'invalid_lease', 'lease_expired', 'lease_fenced',
  'stale_revision', 'invalid_result', 'auth_unavailable', 'executor_timeout',
  'executor_unavailable', 'executor_failed', 'output_limit', 'invalid_ack',
  'completion_unconfirmed', 'claim_unconfirmed', 'cancelled', 'conflict', 'forbidden',
  'job_unavailable', 'idempotency_conflict', 'lease_insufficient', 'unauthorized',
  'case_mismatch', 'request_id_reused', 'schema_mismatch', 'server_dependency_failure', 'case_busy'
]);

export class RuntimeError extends Error {
  constructor(code) {
    super(CODES.has(code) ? code : 'backend_unavailable');
    this.name = 'RuntimeError';
    this.code = this.message;
  }
}

// Never persist exception text, prompts, stdout, stderr, tokens or credentials.
export function diagnosticCode(error, fallback = 'backend_unavailable') {
  return CODES.has(error?.code) ? error.code : fallback;
}

export function fail(code) { throw new RuntimeError(code); }

export async function boundedCall(operation, input, timeoutMs, code = 'backend_timeout') {
  let timer;
  const abort = new AbortController();
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(input, {signal: abort.signal})),
      new Promise((_, reject) => {
        timer = setTimeout(() => { abort.abort(); reject(new RuntimeError(code)); }, timeoutMs);
      })
    ]);
  } finally { clearTimeout(timer); }
}
