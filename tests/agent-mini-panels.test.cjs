'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const modulePromise=import('../os/agent-preview.data.mjs');
test('maquetas separadas; fuente no registrada o de otro caso no se devuelve',async()=>{
 const api=await modulePromise,a=api.createDemoCase('demo-gaston'),b=api.createDemoCase('demo-luis');
 assert.equal(api.sourceFor(a,b.sources[0].id),null);assert.equal(api.sourceFor(a,'missing'),null);
 assert.ok(a.sources.every(s=>s.kind==='example'&&s.case_id===a.id&&s.date&&s.revision&&s.location));
 assert.throws(()=>api.createDemoCase('business-case'),/unavailable/);
});
test('consulta cambia viabilidad de esa versión sin modificar defendida ni calcular finanzas',async()=>{
 const api=await modulePromise,m=api.createDemoCase('demo-gaston'),s=api.createProjectState(m),original=JSON.stringify(m);
 api.consultScenario(m,s,'v1');assert.equal(api.viabilityFor(m,s.scenario_id).version,'V1');assert.equal(m.defended_scenario_id,'v2');
 api.consultScenario(m,s,'v3');assert.equal(api.viabilityFor(m,s.scenario_id).status,'No defendible aún');assert.equal(api.irrLabel(m,m.scenarios[2]),'20% anual · proyecto');assert.equal(JSON.stringify(m),original);
});
test('una TIR sin evidencia o sin periodo no aparece como cero',async()=>{
 const api=await modulePromise,m=api.createDemoCase('demo-luis'),scenario={...m.scenarios[0]};
 assert.equal(api.irrLabel(m,{...scenario,irr_percent:null}),'TIR no calculada');assert.equal(api.irrLabel(m,{...scenario,irr_period:''}),'TIR no calculada');assert.equal(api.irrLabel(m,{...scenario,source_id:'missing'}),'TIR no calculada');
 assert.equal(api.irrLabel(m,{...scenario,irr_percent:0}),'0% anual · proyecto');
});
test('referencia prepara borrador sin enviar, conserva texto y liga caso y versión',async()=>{
 const api=await modulePromise,m=api.createDemoCase('demo-ruisenor'),s=api.createProjectState(m);
 s.draft='Quiero entender el artículo';api.consultScenario(m,s,'v1');api.citeSource(m,s,m.id+':norm');
 assert.equal(s.draft,'Quiero entender el artículo');assert.equal(s.draft_ref.case_id,m.id);assert.equal(s.draft_ref.scenario_id,'v1');assert.equal(s.messages.length,1);
 assert.throws(()=>api.citeSource(m,s,'demo-gaston:norm'),/unavailable/);
});
test('referencias comerciales conservan unidades y vínculo al estudio; todas las versiones tienen base común',async()=>{
 const api=await modulePromise,m=api.createDemoCase('demo-gaston');
 for(const r of m.market){const src=api.sourceFor(m,r.source_id);assert.ok(src&&r.unit);assert.equal(src.parent_id,m.id+':market-study');assert.ok(api.sourceFor(m,src.parent_id));}
 assert.deepEqual(m.scenarios.map(s=>s.horizon_years),[1,1,1]);assert.deepEqual(m.scenarios.map(s=>s.irr_type),['proyecto','proyecto','proyecto']);assert.equal(new Set(m.scenarios.map(s=>s.source_id)).size,1);
});
