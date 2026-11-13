import {createCompanyKnowledge} from './company-knowledge.mjs';

export const OFFICE_PILOT_POLICY = Object.freeze({
  maxAgeMs: 300000,
  minConfidence: 0.92,
  minSupport: 0.92
});

const workflows = Object.freeze({
  ppp_comparison: Object.freeze(['SHEET-PORTERO', 'SHEET-PPP-MODELOS']),
  gaston_land_use: Object.freeze(['SHEET-PORTERO', 'SHEET-PPP-MODELOS', 'EXT-DRIVE'])
});

const fail = code => { throw new Error(code); };
const text = value => typeof value === 'string' && value.trim() && value.length <= 12000;

export function createOfficePilot(adapters = {}) {
  const {policy: _ignoredPolicy, ...privateAdapters} = adapters;
  const knowledge = createCompanyKnowledge({...privateAdapters, policy: OFFICE_PILOT_POLICY});

  function sourcesFor(workflow) {
    const sourceIds = workflows[workflow];
    if (!sourceIds) fail('unknown_workflow');
    return [...sourceIds];
  }

  async function checkSources(sourceIds) {
    const {sources} = await knowledge.listSources();
    const available = new Set(sources.map(source => source.source_id));
    if (sourceIds.some(sourceId => !available.has(sourceId))) fail('pilot_source_missing_from_atlas');
  }

  async function consult({workflow, query} = {}, actor) {
    if (!text(query)) fail('invalid_query');
    const source_ids = sourcesFor(workflow);
    await checkSources(source_ids);
    return knowledge.consult({query, source_ids}, actor);
  }

  async function decide({workflow, query, context, options} = {}, actor) {
    if (!text(query) || !Array.isArray(options) || options.length < 2 || options.length > 16 ||
        options.some(option => !option || Object.keys(option).some(key => !['id', 'description'].includes(key))))
      fail('invalid_query');
    const source_ids = sourcesFor(workflow);
    await checkSources(source_ids);
    const result = await knowledge.decide({query, source_ids, context,
      options: options.map(option => ({...option, source_ids}))}, actor);
    // Never expose a below-threshold choice as the pilot's answer.
    if (result.status !== 'selected') return {...result, selected: null};
    return result;
  }

  return Object.freeze({listSources: knowledge.listSources, consult, decide});
}
