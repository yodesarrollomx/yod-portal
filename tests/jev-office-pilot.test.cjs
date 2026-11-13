const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createOfficePilot, OFFICE_PILOT_POLICY} = require('../despacho-runtime/source/jev/office-pilot.mjs');

function fixture({confidence = 0.95, support = 0.95, includeDrive = true} = {}) {
  const now = Date.parse('2026-10-03T18:00:00Z');
  const sources = ['SHEET-PORTERO', 'SHEET-PPP-MODELOS', ...(includeDrive ? ['EXT-DRIVE'] : [])];
  const atlas = {revision: 'pilot-test-1', components: sources.map(id => ({id, nombre: id}))};
  const grants = Object.fromEntries(sources.map((source_id, i) => [source_id, {
    allowed: true, actor_id: 'DIRECTION', source_id, scope_revision: 'scope-1',
    bindings: source_id === 'EXT-DRIVE' ? [{kind: 'drive_document', file_id: 'mock-file',
      mime_type: 'application/pdf', title: 'PMDU vigente (simulado)', allow_jev: true}] :
      [{kind: 'sheet_range', workbook_id: 'mock_book_' + i, sheet_id: i + 1,
        sheet_title: 'Caso', range: 'A1:B2', allow_jev: true}]
  }]));
  const reads = [];
  const verifySource = async ({source_id, expected}) => ({source_id, current: expected});
  const readSource = async ({source_id, grant}) => {
    reads.push(source_id);
    return grant.bindings.map(binding => binding.kind === 'drive_document'
      ? {...binding, revision: 'file-v3', read_at: new Date(now).toISOString(),
        text: 'Documento normativo de prueba. Uso mixto permitido.'}
      : {...binding, revision: 'sheet-v2', read_at: new Date(now).toISOString(), rows: [['campo', 'valor'], ['uso', 'pendiente']]});
  };
  const askJev = async request => {
    const ids = Object.keys(request.questions.selection.criteria).filter(id => id !== 'insufficient_evidence');
    return {model: 'jev-test', answers: {selection: {type: 'choice', choice: ids[0], confidence,
      probabilities: {[ids[0]]: confidence, [ids[1]]: 1 - confidence, insufficient_evidence: 0}},
    ...Object.fromEntries(ids.map((_, i) => [`support_${i}`, {type: 'noul', noul: support}]))}};
  };
  return {pilot: createOfficePilot({loadAtlas: async () => atlas, authorize: async ({actor_id, source_id}) =>
      actor_id === 'DIRECTION' ? grants[source_id] : {allowed: false}, readSource, verifySource, askJev,
    now: () => now, policy: {maxAgeMs: 300000, minConfidence: 0, minSupport: 0}}), reads};
}

test('el piloto fija umbral 92% y oculta la selección bajo el umbral', async () => {
  assert.deepEqual(OFFICE_PILOT_POLICY, {maxAgeMs: 300000, minConfidence: 0.92, minSupport: 0.92});
  const f = fixture({confidence: 0.919, support: 0.99});
  const result = await f.pilot.decide({workflow: 'gaston_land_use', query: 'Uso oficial?',
    options: [{id: 'not_verified', description: 'No verificado'}, {id: 'mixed', description: 'Mixto'}]},
  {actor_id: 'DIRECTION'});
  assert.equal(result.status, 'needs_review');
  assert.equal(result.selected, null);
  assert.equal(result.confidence, 0.919);
});

test('el umbral mínimo inclusivo acepta 92% cuando el respaldo también pasa', async () => {
  const f = fixture({confidence: 0.92, support: 0.92});
  const result = await f.pilot.decide({workflow: 'ppp_comparison', query: 'Compara A contra B',
    options: [{id: 'A', description: 'Proyecto A'}, {id: 'B', description: 'Proyecto B'}]},
  {actor_id: 'DIRECTION'});
  assert.equal(result.status, 'selected');
  assert.equal(result.confidence, 0.92);
});

test('el flujo Gastón busca Sheets y documentos Drive y conserva la cita del archivo', async () => {
  let sent;
  const now = Date.parse('2026-10-03T18:00:00Z');
  const raw = createOfficePilot({loadAtlas: async () => ({revision: 'r1', components:
    ['SHEET-PORTERO', 'SHEET-PPP-MODELOS', 'EXT-DRIVE'].map(id => ({id, nombre: id}))}),
  authorize: async ({actor_id, source_id}) => ({allowed: true, actor_id, source_id, scope_revision: 's1',
    bindings: source_id === 'EXT-DRIVE' ? [{kind: 'drive_document', file_id: 'mock-file', mime_type: 'application/pdf', title: 'PMDU', allow_jev: true}]
      : [{kind: 'sheet_range', workbook_id: 'mock_book', sheet_id: 3, sheet_title: 'Memoria', range: 'A1:B2', allow_jev: true}]}),
  readSource: async ({source_id, grant}) => grant.bindings.map(b => b.kind === 'drive_document'
    ? {...b, revision: 'r2', read_at: new Date(now).toISOString(), text: 'Extracto de prueba PMDU.'}
    : {...b, revision: 'r1', read_at: new Date(now).toISOString(), rows: [['uso', 'pendiente']]}),
  verifySource: async ({source_id, expected}) => ({source_id, current: expected}), now: () => now,
  askJev: async request => {
    sent = request;
    return {model: 'jev-test', answers: {selection: {type: 'choice', choice: 'not_verified', confidence: 0.95,
      probabilities: {not_verified: 0.95, mixed: 0.04, insufficient_evidence: 0.01}},
    support_0: {type: 'noul', noul: 0.95}, support_1: {type: 'noul', noul: 0.95}}};
  }});
  const result = await raw.decide({workflow: 'gaston_land_use', query: '¿Cuál es el uso oficial?',
    options: [{id: 'not_verified', description: 'No verificado'}, {id: 'mixed', description: 'Uso mixto'}]},
  {actor_id: 'DIRECTION'});
  assert.equal(result.status, 'selected');
  assert.equal(result.selected, 'not_verified');
  assert.match(result.evidence_refs.find(x => x.source_id === 'EXT-DRIVE').fragments[0].url, /drive.google.com\/open\?id=mock-file/);
  assert.equal(sent.state.evidence.find(x => x.source_id === 'EXT-DRIVE').fragments[0].text, 'Extracto de prueba PMDU.');
  assert.ok(!JSON.stringify(sent).includes('mock-file'));
});

test('el flujo PPP se limita a sus dos almacenes y consulta lecturas nuevas', async () => {
  const f = fixture();
  const result = await f.pilot.consult({workflow: 'ppp_comparison', query: 'Compara utilidad y TIR'},
    {actor_id: 'DIRECTION'});
  assert.equal(result.status, 'ready');
  assert.deepEqual(f.reads, ['SHEET-PORTERO', 'SHEET-PPP-MODELOS']);
});

test('el umbral de respaldo también obliga a revisar aunque Jev prefiera una opción', async () => {
  const f = fixture({confidence: 0.99, support: 0.91});
  const result = await f.pilot.decide({workflow: 'ppp_comparison', query: 'Más viable',
    options: [{id: 'A', description: 'Proyecto A'}, {id: 'B', description: 'Proyecto B'}]},
  {actor_id: 'DIRECTION'});
  assert.equal(result.status, 'needs_review');
  assert.equal(result.selected, null);
});

test('el piloto bloquea flujos no registrados y comprueba fuentes presentes en el atlas', async () => {
  const f = fixture({includeDrive: false});
  await assert.rejects(f.pilot.consult({workflow: 'all', query: 'todo'}, {actor_id: 'DIRECTION'}), /unknown_workflow/);
  await assert.rejects(f.pilot.consult({workflow: 'gaston_land_use', query: 'uso'},
    {actor_id: 'DIRECTION'}), /pilot_source_missing_from_atlas/);
  assert.deepEqual(f.reads, []);
});
