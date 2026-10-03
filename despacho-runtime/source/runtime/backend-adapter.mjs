import {fail} from './errors.mjs';

export const REQUIRED_OPERATIONS = Object.freeze([
  'claimJob', 'readSnapshot', 'checkLease', 'completeJob', 'stopJob', 'reconcileJob'
]);

// Local interfaces only. There is deliberately no URL, fetch, credential lookup,
// arbitrary workbook/range selector, or default backend in this package.
export function createBackendAdapter(operations) {
  if (!operations || REQUIRED_OPERATIONS.some(name => typeof operations[name] !== 'function'))
    fail('adapter_unavailable');
  const adapter = {};
  for (const name of REQUIRED_OPERATIONS) {
    const operation = operations[name].bind(operations);
    adapter[name] = (request, controls) => operation(structuredClone(request), controls);
  }
  return Object.freeze(adapter);
}
