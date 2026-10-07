'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {validate,render}=require('../scripts/arquitectura.cjs');
const {verify,verifyCheckout}=require('../scripts/verificar-impacto.cjs');
const root=path.resolve(__dirname,'..');
const load=()=>JSON.parse(fs.readFileSync(path.join(root,'docs/arquitectura/modelo.json'),'utf8'));
const schema=JSON.parse(fs.readFileSync(path.join(root,'docs/arquitectura/modelo.schema.json'),'utf8'));
test('modelo real válido y generación determinista',()=>{const m=load();assert.equal(validate(m,schema),true);assert.deepEqual(render(m),render(m));});
test('una conexión a componente inexistente se rechaza',()=>{const m=load();m.connections[0].to='SYS-INEXISTENTE';assert.throws(()=>validate(m,schema),/huérfana/);});
test('no admite IDs duplicados',()=>{const m=load();m.components.push(m.components[0]);assert.throws(()=>validate(m,schema),/duplicados/);});
test('una referencia de propuesta debe resolver a componente real',()=>{const m=load();m.proposals[0].boards.push('SYS-INEXISTENTE');assert.throws(()=>validate(m,schema),/desconocido/);});
test('rechaza emails reales e identificadores de infraestructura en modelo público',()=>{for(const value of ['contacto@example.org','https://docs.google.com/spreadsheets/d/ejemplo']){const m=load();m.components[0].proposito=value;assert.throws(()=>validate(m,schema),/privados/);}});
test('rechaza rutas de evidencia fuera de repositorio',()=>{const m=load();m.components[0].evidence[0].path='../privado';assert.throws(()=>validate(m,schema),/insegura/);});
test('valida evidencia de conexiones y procesos además de componentes',()=>{for(const list of ['connections','processes']){const m=load();m[list][0].evidence[0].path='../privado';assert.throws(()=>validate(m,schema),/insegura/);}});
test('no presenta una declaración como código comprobado',()=>{const m=load();m.connections[0].status='codigo';m.connections[0].evidence=[{claim:'Por confirmar',status:'pendiente'}];assert.throws(()=>validate(m,schema),/sin evidencia de código/);});
test('el HTML incrusta JSON sin permitir cierre de script',()=>{const m=load();m.components[0].proposito='</script><script>alert(1)</script>';const out=render(m)['index.html'];assert.ok(!out.includes('</script><script>alert(1)'));assert.ok(out.includes('\\u003c/script>'));});
test('el visor funciona sin dependencias de red',()=>{const html=render(load())['index.html'];assert.ok(html.includes("connect-src 'none'"));assert.ok(!/<script[^>]+src=/.test(html));assert.ok(!/<link[^>]+href=/.test(html));});
function fixture(){const model=load();const p=model.changes[0];return {model,impact:{model_revision:model.revision,proposal_id:p.id,summary:'Ejemplo sintético',rollback:'Restaurar versión anterior',components:p.components.slice(0,1),tests:['node --test']},changed:[]};}
test('cambiar código sin actualizar impacto falla',()=>{const f=fixture();f.changed=['os/app.js'];assert.throws(()=>verify(f),/sin actualizar/);});
test('código con propuesta e impacto válidos pasa',()=>{const f=fixture();f.changed=['os/app.js','architecture-impact.json'];assert.equal(verify(f).behavioral.length,1);});
test('documentación sola no obliga inventar cambios funcionales',()=>{const f=fixture();f.changed=['docs/arquitectura/README.md'];assert.equal(verify(f).behavioral.length,0);});
test('modelo de revisión distinta o propuesta inexistente falla',()=>{const f=fixture();f.impact.model_revision='otra';assert.throws(()=>verify(f),/revisión/);f.impact.model_revision=f.model.revision;f.impact.proposal_id='NO-EXISTE';assert.throws(()=>verify(f),/primero/);});
test('una modificación de motor no puede declarar solo el portal',()=>{const f=fixture();f.repository='yodesarrollomx/yod-portal';f.impact.components=['SYS-YOD-OS'];f.changed=['obra-app/motor/ObraCliente.gs','architecture-impact.json'];assert.throws(()=>verify(f),/GAS-OBRA-CLIENTE/);});
test('referencias de contratos también deben existir',()=>{const m=load();m.data_contracts[0].components=['SYS-INEXISTENTE'];assert.throws(()=>validate(m,schema),/contrato/);});
test('ownership rechaza referencias, vacíos y prefijos duplicados',()=>{
  for(const mutate of [r=>{r.repo='unknown/repo';},r=>{r.components=['SYS-INEXISTENTE'];},r=>{r.components=[];},r=>{r.prefix='../private';}]){
    const m=load();mutate(m.path_ownership[0]);assert.throws(()=>validate(m,schema),/Propiedad/);
  }
  const m=load();m.path_ownership.push(structuredClone(m.path_ownership[0]));assert.throws(()=>validate(m,schema),/duplicado/);
});
test('un propietario de archivo exacto no captura archivos con nombres parecidos',()=>{
  const f=fixture();f.repository='yodesarrollomx/yod-portal';f.impact.components=['SYS-YOD-OS','GAS-PORTERO'];
  f.changed=['os/app.js.bak.js','architecture-impact.json'];assert.throws(()=>verify(f),/falta declarar impacto/);
});
test('checkout distinto al SHA solicitado no puede dar verificación verde',()=>{
  assert.throws(()=>verifyCheckout('a'.repeat(40),'b'.repeat(40)),/checkout/);
  assert.doesNotThrow(()=>verifyCheckout('a'.repeat(40),'a'.repeat(40)));
});
test('la corrida manual no puede sustituir el check de pull request',()=>{
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/arquitectura.yml'),'utf8');
  assert.match(workflow,/name: \$\{\{ github\.event_name == 'workflow_dispatch' && 'Arquitectura YOD \(manual\)'/);
  assert.match(workflow,/ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.doesNotMatch(workflow,/if: github\.event_name != 'workflow_dispatch'/);
});
test('propuestas publican tareas, requisitos, aceptación y dependencias vacías legibles',()=>{
  const model=load(),markdown=render(model)['propuestas.md'];
  assert.match(markdown,/Sin dependencias previas/);assert.doesNotMatch(markdown,/Dependencias: \./);
  for(const p of model.proposals)for(const key of ['tasks','acceptance','prerequisites'])for(const value of p[key])assert.ok(markdown.includes(value),p.id+' '+key);
});
test('dependencias de propuestas deben existir',()=>{const m=load();m.proposals[0].dependencies=['ZZ'];assert.throws(()=>validate(m,schema),/dependencia/);});
test('IDs legales que colisionan en Mermaid son rechazados',()=>{const m=load(),copy=structuredClone(m.components[0]);copy.id=copy.id.replace(/-/g,'_');m.components.push(copy);assert.throws(()=>validate(m,schema),/colisionan/);});

test('actualizar el lockfile también exige declarar impacto',()=>{const f=fixture();f.changed=['package-lock.json'];assert.throws(()=>verify(f),/sin actualizar/);f.changed.push('architecture-impact.json');assert.equal(verify(f).behavioral.length,1);});

test('contratos duplicados se rechazan',()=>{const m=load();m.data_contracts.push(structuredClone(m.data_contracts[0]));assert.throws(()=>validate(m,schema),/duplicados/);});
test('conexión no puede referir un contrato inexistente',()=>{const m=load();m.connections[0].contract_ids=['CTR-NO-EXISTE'];assert.throws(()=>validate(m,schema),/contrato desconocido/);});
test('marcar runtime verificado exige recibo con fecha y alcance',()=>{const m=load();m.connections[0].runtime_verified=true;assert.throws(()=>validate(m,schema),/recibo fechado/);});

test('recibo sintético válido permite registrar ejecución; fecha imposible no',()=>{const m=load(),e=m.connections[0];e.runtime_verified=true;e.runtime_evidence={checked_at:'2026-10-07T05:34:28Z',scope:'Fixture sintética de prueba',receipt:'synthetic-receipt-1'};e.evidence.push({...e.evidence[0],status:'ejecucion',claim:'Fixture, no producción'});assert.equal(validate(m,schema),true);e.runtime_evidence.checked_at='2026-02-30T05:34:28Z';assert.throws(()=>validate(m,schema),/recibo fechado/);});
test('contrato vinculado cubre ambos participantes de la conexión',()=>{const m=load(),e=m.connections.find(x=>x.contract_ids.length);const c=m.data_contracts.find(x=>x.id===e.contract_ids[0]);c.components=c.components.filter(x=>x!==e.to);assert.throws(()=>validate(m,schema),/ambos participantes/);});
