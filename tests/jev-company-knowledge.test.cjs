const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const modulePromise = import('../despacho-runtime/source/jev/company-knowledge.mjs');

async function fixture(overrides = {}) {
  const {createCompanyKnowledge} = await modulePromise;
  let clock = Date.parse('2026-10-03T18:00:00Z'), reads = 0, calls = 0, access = true;
  const atlas = {revision: 'test-1', components: [{id: 'SHEET-A', nombre: 'Programa', dominio: 'diseño'}]};
  const grant = {allowed: true, actor_id: 'AGENT-A', source_id: 'SHEET-A', scope_revision: 'scope-1',
    bindings: [{workbook_id: 'synthetic_book', sheet_id: 7, sheet_title: 'Programa', range: 'A1:B3', allow_jev: true}]};
  const fragment = () => ({...grant.bindings[0], revision: 'r' + reads,
    read_at: new Date(clock).toISOString(), rows: [['espacio', 'area'], ['sala', reads * 10]]});
  const deps = {loadAtlas: async () => atlas, now: () => clock,
    policy: {maxAgeMs: 60000, minConfidence: 0.8, minSupport: 0.7},
    authorize: async () => ({...grant, allowed: access}),
    readSource: async () => { reads++; return [fragment()]; },
    verifySource: async ({source_id, expected}) => ({source_id, current: expected}),
    askJev: async request => { calls++; return {model: 'jev-test', answers: {
      selection: {type: 'choice', choice: 'patio', confidence: 0.9,
        probabilities: {patio: 0.9, lucernario: 0.05, insufficient_evidence: 0.05}},
      support_0: {type: 'noul', noul: 0.9}, support_1: {type: 'noul', noul: 0.5}
    }}; }, ...overrides};
  const query = {query: '¿Qué alternativa encaja con el programa?', source_ids: ['SHEET-A'],
    context: {objetivo: 'iluminación natural'}, options: [
      {id: 'patio', description: 'Patio central', source_ids: ['SHEET-A']},
      {id: 'lucernario', description: 'Lucernario', source_ids: ['SHEET-A']}
    ]};
  return {tool: createCompanyKnowledge(deps), deps, query, grant, fragment, atlas,
    actor: {actor_id: 'AGENT-A'}, counts: () => ({reads, calls}), revoke: () => {access = false;},
    advance: ms => {clock += ms;}};
}

test('registra todas las fuentes lógicas del atlas, incluidas altas futuras', async () => {
  const {atlasSources} = await modulePromise;
  const model = JSON.parse(fs.readFileSync('docs/arquitectura/modelo.json', 'utf8'));
  assert.deepEqual(atlasSources(model).sources.map(s => s.source_id),
    model.components.filter(c => c.id.startsWith('SHEET-')).map(c => c.id));
  model.components.push({id: 'SHEET-NUEVA', nombre: 'Nueva'});
  assert.ok(atlasSources(model).sources.some(s => s.source_id === 'SHEET-NUEVA'));
});

test('cada consulta relee los datos y devuelve enlaces y revisión actuales', async () => {
  const f = await fixture();
  const a = await f.tool.consult(f.query, f.actor);
  const b = await f.tool.consult(f.query, f.actor);
  assert.equal(a.status, 'ready');
  assert.equal(b.sources[0].fragments[0].rows[1][1], 20);
  assert.notEqual(a.sources[0].fragments[0].data_digest, b.sources[0].fragments[0].data_digest);
  assert.match(b.sources[0].fragments[0].url, /#gid=7&range=/);
  assert.deepEqual(f.counts(), {reads: 2, calls: 0});
});

test('elige con Jev, agrupa juicios y conserva la procedencia fuera del modelo', async () => {
  let sent;
  const f = await fixture();
  const original = f.deps.askJev;
  const g = await fixture({askJev: async request => {sent = request; return original(request);}});
  const result = await g.tool.decide(g.query, g.actor);
  assert.equal(result.status, 'selected');
  assert.equal(result.selected, 'patio');
  assert.equal(Object.keys(sent.questions).length, 3);
  assert.equal(result.source_refs[0].source_id, 'SHEET-A');
  assert.equal(result.evidence_refs[0].fragments[0].revision, 'r1');
  assert.ok(!JSON.stringify(sent).includes('synthetic_book'));
  assert.ok(!JSON.stringify(sent).includes('AGENT-A'));
});

test('fuente pendiente impide inferencia y no expone errores del proveedor', async () => {
  const f = await fixture({readSource: async () => {throw Error('private provider diagnostics');}});
  const result = await f.tool.decide(f.query, f.actor);
  assert.equal(result.status, 'awaiting_data');
  assert.equal(f.counts().calls, 0);
  assert.ok(!JSON.stringify(result).includes('private'));
});

test('fuentes desconocidas no se consultan ni se sustituyen por otras', async () => {
  const f = await fixture();
  await assert.rejects(f.tool.consult({...f.query, source_ids: ['SHEET-UNKNOWN']}, f.actor), /unknown_source/);
  assert.deepEqual(f.counts(), {reads: 0, calls: 0});
});

test('actor distinto no recibe datos ni llama a Jev', async () => {
  const f = await fixture();
  const result = await f.tool.decide(f.query, {actor_id: 'AGENT-B'});
  assert.equal(result.status, 'awaiting_data');
  assert.deepEqual(f.counts(), {reads: 0, calls: 0});
});

test('procesamiento externo requiere autorización específica de cada rango', async () => {
  const f = await fixture();
  f.grant.bindings[0].allow_jev = false;
  assert.equal((await f.tool.consult(f.query, f.actor)).status, 'ready');
  assert.equal((await f.tool.decide(f.query, f.actor)).status, 'awaiting_authorization');
  assert.equal(f.counts().calls, 0);
});

test('un resultado de otro libro/rango no entra en la evidencia', async () => {
  const f = await fixture();
  const g = await fixture({readSource: async () => [{...f.fragment(), workbook_id: 'another_book'}]});
  assert.equal((await g.tool.decide(g.query, g.actor)).status, 'awaiting_data');
  assert.equal(g.counts().calls, 0);
});

test('lecturas antiguas o anteriores a la consulta se rechazan', async () => {
  const f = await fixture();
  const g = await fixture({readSource: async () => [{...f.fragment(), read_at: '2026-10-03T17:59:59Z'}]});
  assert.equal((await g.tool.decide(g.query, g.actor)).status, 'awaiting_data');
  assert.equal(g.counts().calls, 0);
});

test('revocación mientras Jev trabaja descarta la respuesta', async () => {
  const base = await fixture();
  let f;
  f = await fixture({askJev: async request => {f.revoke(); return base.deps.askJev(request);}});
  await assert.rejects(f.tool.decide(f.query, f.actor), /source_not_authorized/);
});

test('cambio de alcance durante inferencia descarta la respuesta', async () => {
  const base = await fixture();
  let f;
  f = await fixture({askJev: async request => {f.grant.scope_revision = 'scope-2'; return base.deps.askJev(request);}});
  await assert.rejects(f.tool.decide(f.query, f.actor), /scope_changed/);
});

test('si la evidencia caduca durante inferencia exige nueva consulta', async () => {
  const base = await fixture();
  let f;
  f = await fixture({askJev: async request => {f.advance(60001); return base.deps.askJev(request);}});
  await assert.rejects(f.tool.decide(f.query, f.actor), /stale_source/);
});

test('cambios de datos durante inferencia impiden devolver una decisión vigente', async () => {
  const f = await fixture({verifySource: async ({source_id, expected}) => ({source_id,
    current: expected.map(value => ({...value, revision: 'modified'}))})});
  const result = await f.tool.decide(f.query, f.actor);
  assert.equal(result.status, 'awaiting_data');
  assert.equal(f.counts().calls, 0);
  const base = await fixture();
  let checks = 0;
  const g = await fixture({verifySource: async ({source_id, expected}) => ({source_id,
    current: ++checks === 1 ? expected : expected.map(value => ({...value, revision: 'modified'}))}),
    askJev: base.deps.askJev});
  await assert.rejects(g.tool.decide(g.query, g.actor), /source_changed/);
});

test('confianza o respaldo bajos conservan la propuesta para revisar', async () => {
  const base = await fixture();
  const f = await fixture({askJev: async request => {
    const r = await base.deps.askJev(request); r.answers.support_0.noul = 0.2; return r;
  }});
  const result = await f.tool.decide(f.query, f.actor);
  assert.equal(result.status, 'needs_review'); assert.equal(result.selected, 'patio');
});

test('no-match conserva evidencia y devuelve revisión sin elección inventada', async () => {
  const base = await fixture();
  const f = await fixture({askJev: async request => {
    const r = await base.deps.askJev(request);
    r.answers.selection.choice = 'insufficient_evidence';
    r.answers.selection.probabilities = {patio: 0.1, lucernario: 0.1, insufficient_evidence: 0.8};
    return r;
  }});
  const result = await f.tool.decide(f.query, f.actor);
  assert.equal(result.selected, null); assert.equal(result.status, 'needs_review');
  assert.equal(result.evidence_refs.length, 1);
});

test('respuesta mal formada o elección fuera de las opciones se rechaza', async () => {
  const f = await fixture({askJev: async () => ({model: 'test', answers: {selection: {
    type: 'choice', choice: 'inventada', confidence: 1, probabilities: {inventada: 1}
  }}})});
  await assert.rejects(f.tool.decide(f.query, f.actor), /invalid_jev_response/);
});

test('fallo de servicio no se convierte en elección local', async () => {
  const f = await fixture({askJev: async () => {throw Error('provider response containing key');}});
  await assert.rejects(f.tool.decide(f.query, f.actor), /^Error: jev_unavailable$/);
});

test('HTTP usa destino fijo, bearer privado, timeout y rechaza redirects', async () => {
  const {createJevClient} = await modulePromise;
  let request;
  const client = createJevClient({apiKey: 'synthetic', fetch: async (url, opts) => {
    request = {url, opts}; return {ok: true, text: async () => JSON.stringify({model: 'test'})};
  }});
  assert.deepEqual(await client({state: 'synthetic'}), {model: 'test'});
  assert.equal(request.url, 'https://api.typesafe.ai/v1/systemone');
  assert.equal(request.opts.headers.Authorization, 'Bearer synthetic');
  assert.equal(request.opts.redirect, 'error'); assert.ok(request.opts.signal);
});
