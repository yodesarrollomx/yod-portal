'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {validateOfficeCoverage, renderOfficeCoverage} = require('../scripts/oficina-cobertura.cjs');

const SHA = 'a'.repeat(40);
function fixture() {
  return {
    revision:'synthetic-coverage',
    components:[
      {id:'SYS-YOD-OS', aliases:['SYS-PORTAL'], nombre:'YOD OS', proposito:'Coordinar',
        source_of_truth:'Registro original', owner_role:'Dirección', status:'codigo',
        runtime_status:'Lectura no verificada', evidence:[{repo:'example/portal', path:'src/main.js', commit:SHA, lines:'12', claim:'Código inspeccionado', status:'codigo'}]},
      {id:'SYS-PPP', nombre:'PPP', proposito:'Comparar alternativas', source_of_truth:'Sheets',
        owner_role:'Responsable del proceso por confirmar', status:'declarado',
        evidence:[{repo:'example/ppp', path:'README.md', source_revision:'HEAD_baseline', claim:'Declaración histórica', status:'declarado'}]},
      {id:'EXT-SHEETS', nombre:'Sheets', tipo:'servicio_externo', status:'pendiente'}
    ],
    connections:[{id:'CON-PPP', from:'SYS-PPP', to:'EXT-SHEETS', kind:'lectura', label:'Consulta el modelo',
      status:'codigo', runtime_verified:false, evidence:[]}],
    office_coverage:{
      observed_at:'2026-10-07T05:27:56Z', scope:'Inventario sintético; no acredita producción.',
      verification_owner:'Coordinación técnica YOD',
      catalog_snapshot:{observed_at:'2026-10-07T05:26:00Z', canonical_ids:['SYS-PORTAL','SYS-PPP'], technical_ids:['SYS-PPP']},
      surfaces:[
        {component:'SYS-PORTAL',entry:'https://example.test/os/',description:'Portal'},
        {component:'SYS-YOD-OS',entry:'https://example.test/os/#/despacho',description:'Oficina'}
      ],
      areas:[
        {id:'direccion',nombre:'Dirección',place:'decisions',placement:'propuesto',components:['SYS-PORTAL']},
        {id:'potenciales',nombre:'Desarrollo',place:'potential',placement:'propuesto',components:['SYS-PPP','EXT-SHEETS']}
      ]
    }
  };
}
const errors = model => validateOfficeCoverage(model).join('\n');

test('conciliación por alias conserva IDs, dos superficies y modelo íntegro', () => {
  const model = fixture(), before = structuredClone(model);
  assert.deepEqual(validateOfficeCoverage(model), []);
  const result = renderOfficeCoverage(model);
  assert.deepEqual(Object.keys(result).sort(), ['oficina-cobertura.html','oficina-cobertura.md']);
  assert.deepEqual(model, before);
  assert.match(result['oficina-cobertura.md'], /2 sistemas y 3 componentes/);
  assert.match(result['oficina-cobertura.md'], /1 conexiones registradas, 0 marcadas/);
  assert.match(result['oficina-cobertura.md'], /SYS-PORTAL → SYS-YOD-OS/);
  assert.match(result['oficina-cobertura.html'], /https:\/\/example\.test\/os\/#\/despacho/);
});

test('rechaza componentes desconocidos, omitidos y asignados dos veces mediante alias', () => {
  const unknown = fixture();
  unknown.office_coverage.areas[0].components.push('SYS-INVENTADO');
  assert.match(errors(unknown), /Componente desconocido.*SYS-INVENTADO/);
  const omitted = fixture();
  omitted.office_coverage.areas[1].components.pop();
  assert.match(errors(omitted), /Componente sin área: EXT-SHEETS/);
  const duplicate = fixture();
  duplicate.office_coverage.areas[1].components.push('SYS-YOD-OS');
  assert.match(errors(duplicate), /Componente asignado más de una vez: SYS-YOD-OS/);
});

test('rechaza aliases que colisionan con IDs o con otro alias', () => {
  const collision = fixture();
  collision.components[1].aliases = ['SYS-YOD-OS'];
  assert.match(errors(collision), /Alias en colisión.*SYS-YOD-OS/);
  const repeated = fixture();
  repeated.components[1].aliases = ['SYS-PORTAL'];
  assert.match(errors(repeated), /Alias en colisión.*SYS-PORTAL/);
  const own = fixture();
  own.components[0].aliases.push('SYS-YOD-OS');
  assert.match(errors(own), /Alias en colisión.*SYS-YOD-OS/);
  const invalid = fixture();
  invalid.components[1].aliases = 'SYS-OTRO';
  assert.match(errors(invalid), /Aliases inválidos/);
});

test('catálogos normalizados no admiten duplicados, desconocidos ni servicios externos', () => {
  const duplicate = fixture();
  duplicate.office_coverage.catalog_snapshot.canonical_ids.push('SYS-YOD-OS');
  assert.match(errors(duplicate), /Catálogo operativo: ID normalizado repetido SYS-YOD-OS/);
  const missing = fixture();
  missing.office_coverage.catalog_snapshot.canonical_ids = ['SYS-PORTAL'];
  assert.match(errors(missing), /Sistema técnico ausente.*SYS-PPP/);
  const unknown = fixture();
  unknown.office_coverage.catalog_snapshot.technical_ids = ['SYS-FANTASMA'];
  assert.match(errors(unknown), /Catálogo técnico: ID desconocido SYS-FANTASMA/);
  const external = fixture();
  external.office_coverage.catalog_snapshot.canonical_ids.push('EXT-SHEETS');
  assert.match(errors(external), /Catálogo operativo: no es un sistema EXT-SHEETS/);
});

test('superficies resuelven alias pero rechazan desconocidos y entradas repetidas', () => {
  const unknown = fixture();
  unknown.office_coverage.surfaces[0].component = 'SYS-FANTASMA';
  assert.match(errors(unknown), /Superficie con componente desconocido/);
  const duplicate = fixture();
  duplicate.office_coverage.surfaces.push({...duplicate.office_coverage.surfaces[0], component:'SYS-YOD-OS'});
  assert.match(errors(duplicate), /Superficie repetida/);
  const blank = fixture();
  blank.office_coverage.surfaces[0].description = '';
  assert.match(errors(blank), /Superficie sin descripción/);
});

test('fecha UTC, área única y ubicación propuesta son requisitos de cierre', () => {
  const badDate = fixture();
  badDate.office_coverage.observed_at = '2026-02-30T12:00:00Z';
  assert.match(errors(badDate), /observed_at debe ser una fecha UTC ISO/);
  const local = fixture();
  local.office_coverage.catalog_snapshot.observed_at = '2026-10-06T22:27:56-07:00';
  assert.match(errors(local), /catalog_snapshot.observed_at/);
  const duplicatedArea = fixture();
  duplicatedArea.office_coverage.areas[1].id = 'direccion';
  assert.match(errors(duplicatedArea), /Área repetida/);
  const granted = fixture();
  granted.office_coverage.areas[0].placement = 'autorizado';
  assert.match(errors(granted), /placement propuesto/);
});

test('render no oculta responsables pendientes ni confunde conexiones con ejecución', () => {
  const result = renderOfficeCoverage(fixture());
  for (const doc of Object.values(result)) {
    assert.match(doc, /Responsable del proceso por confirmar/);
    assert.match(doc, /Ejecución no verificada en el atlas/);
    assert.match(doc, /No hay conexiones registradas para este componente/);
    assert.match(doc, /no concede permisos/);
  }
  const model = fixture();
  model.connections[0].runtime_verified = true;
  const html = renderOfficeCoverage(model)['oficina-cobertura.html'];
  assert.match(html, /1 \/ 1/);
  assert.match(html, /Ejecución marcada como verificada en el atlas; revisar evidencia/);
  assert.equal(model.components[1].status, 'declarado');
});

test('HTML escapa texto, entradas y evidencia; no carga JS ni recursos de red', () => {
  const model = fixture();
  const attack = '<script>alert("x")</script><img src=x onerror=alert(1)>';
  model.components[0].nombre = attack;
  model.components[0].source_of_truth = attack;
  model.components[0].owner_role = attack;
  model.components[0].evidence[0].claim = attack;
  model.office_coverage.scope = attack;
  model.office_coverage.surfaces[0].entry = 'javascript:alert("x")';
  const html = renderOfficeCoverage(model)['oficina-cobertura.html'];
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.doesNotMatch(html, /<script|<img|<iframe|<link\b|@import/i);
  assert.doesNotMatch(html, /href="javascript:|<[^>]+\ssrc\s*=/i);
  assert.match(html, /<meta name="viewport"/);
  assert.equal((html.match(/<details /g) || []).length, model.office_coverage.areas.length);
});

test('enlaces de evidencia se fijan al SHA; revisiones históricas quedan como texto', () => {
  const model = fixture();
  const html = renderOfficeCoverage(model)['oficina-cobertura.html'];
  assert.ok(html.includes('https://github.com/example/portal/blob/' + SHA + '/src/main.js#L12'));
  assert.doesNotMatch(html, /href="[^"]*HEAD_baseline/);
  model.components[0].evidence[0].path = '../secreto';
  const unsafePath = renderOfficeCoverage(model)['oficina-cobertura.html'];
  assert.doesNotMatch(unsafePath, /href="[^"]*secreto/);
});

test('el generador falla cerrado ante cobertura incompleta y el validador informa shape inválido', () => {
  const model = fixture();
  model.office_coverage.areas[1].components.pop();
  assert.throws(() => renderOfficeCoverage(model), /Cobertura de oficina inválida/);
  assert.deepEqual(validateOfficeCoverage(null), ['Modelo sin componentes.']);
  assert.match(errors({components:[]}), /Falta office_coverage/);
});
