'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Health=require('../os/yod-salud.js'),Monitor=require('../scripts/salud-online.cjs');
const now=Date.parse('2026-10-11T20:00:00Z'),iso=new Date(now).toISOString();
const check=extra=>({id:'probe',nombre:'Synthetic',components:['SYS-SALA'],estado:'ok',revisado_en:iso,
 vence_en:new Date(now+45*60000).toISOString(),detalle:'Synthetic proof',...extra});
const report=extra=>({schema:1,generado_en:iso,code_sha:'a'.repeat(40),run_id:'1',checks:[check()],...extra});
test('green requires a current check and current connected report',()=>{
 assert.equal(Health.color(check(),report(),now,true),'verde');
 for(const [c,r,t,online]of[
  [check(),report(),now,false],
  [check(),report({generado_en:new Date(now-46*60000).toISOString()}),now,true],
  [check({revisado_en:new Date(now+1).toISOString()}),report(),now,true],
  [check({vence_en:'invalid'}),report(),now,true],
  [check(),report(),now+46*60000,true],
  [check({estado:'sin_confirmar'}),report(),now,true]])assert.notEqual(Health.color(c,r,t,online),'verde');
});
test('failure or running result cannot be reused as success',()=>{
 assert.equal(Health.color(check({estado:'fallo'}),report(),now,true),'rojo');
 assert.equal(Health.color(check({estado:'ejecutando'}),report(),now,true),'corriendo');
});
test('invalid report, duplicates and unsafe evidence are rejected',()=>{
 assert.equal(Health.validReport(report()),true);
 assert.equal(Health.validReport(report({checks:[check(),check()]})),false);
 for(const url of ['javascript:alert(1)','https://evil.invalid/','https://github.com/yodesarrollomx/r/actions/runs/2?k=secret'])
  assert.equal(Health.safeEvidence(url),'');
 assert.ok(Health.safeEvidence('https://github.com/yodesarrollomx/sala-edicion/actions/runs/123'));
});
test('component ping never approves a business step',()=>{
 const s={id:'PROC:0',modo:'automatico'};
 assert.notEqual(Health.processState(s,[check()],report(),now,true).color,'verde');
 assert.equal(Health.processState(s,[check({process_steps:['PROC:0']})],report(),now,true).color,'verde');
 assert.notEqual(Health.processState({...s,modo:'manual'},[check()],report(),now,true).color,'verde');
});
test('public HTTP200 with nonHTML content is a failed page check',async()=>{
 const r=await Monitor.page(['SYS-SALA','Sala','sala-edicion/'],iso,async()=>'<p>wrong</p>');
 assert.equal(r.estado,'fallo');
});
test('access restriction is unknown rather than a healthy page',async()=>{
 const r=await Monitor.page(['SYS-SALA','Sala','sala-edicion/'],iso,async()=>{const e=Error();e.status=403;throw e;});
 assert.equal(r.estado,'sin_confirmar');
});
test('stale or failed backend read cannot remain green',()=>{
 const base={schema:1,revisado_en:iso,cola_leida_en:iso,cola_estado:'confirmada',reglas_estado:'confirmada',
  rutinas_estado:'confirmada',rutinas:[],errores:[],etapas:['voz','escena','corte','prospecto'],disparadores_nube:[]};
 assert.equal(Monitor.revisionChecks(base,iso).find(c=>c.id==='sala-lectura').estado,'ok');
 for(const obj of [{...base,cola_estado:'sin_confirmar'},{...base,revisado_en:new Date(now-46*60000).toISOString()}]){
  assert.notEqual(Monitor.revisionChecks(obj,iso).find(c=>c.id==='sala-lectura').estado,'ok');
 }
});
test('cancelled/skipped/future production jobs do not pass',()=>{
 const base={schema:1,revisado_en:iso,cola_leida_en:iso,cola_estado:'confirmada',reglas_estado:'confirmada',
  rutinas_estado:'confirmada',rutinas:[],errores:[],etapas:[],disparadores_nube:[]};
 for(const conclusion of ['cancelled','skipped','success']){
  base.rutinas=[{id:'productor',ultima:{status:'completed',conclusion,termino:new Date(now+1000).toISOString(),run_id:'1'}}];
  assert.notEqual(Monitor.revisionChecks(base,iso).find(c=>c.id==='rutina:productor').estado,'ok');
 }
});
test('new failed canary attempt invalidates the old success',()=>{
 const r={schema:1,code_sha:'a'.repeat(40),run_id:'10',generado_en:iso,checks:[check({id:'motor-voz'})]};
 const latest={id:11,status:'completed',conclusion:'failure',updated_at:new Date(now+1000).toISOString()};
 assert.equal(Monitor.canaryChecks(r,iso).find(c=>c.id==='motor-voz').estado,'ok');
 assert.notEqual(Monitor.canaryChecks(r,iso,latest).find(c=>c.id==='motor-voz').estado,'ok');
});
test('monitor only targets known read endpoints',()=>{
 assert.equal(Monitor.allowed('https://evil.invalid/'),false);
 assert.equal(Monitor.allowed('http://yodesarrollomx.github.io/'),false);
 assert.equal(Monitor.allowed('https://script.google.com/macros/s/example/exec?accion=entrada'),false);
 assert.equal(Monitor.allowed('https://script.google.com/macros/s/example/exec?recurso=meta'),true);
});
test('all components and process steps come from the model',()=>{
 const cat=require('../os/salud-catalogo.json'),m=require('../docs/arquitectura/modelo.json');
 assert.deepEqual(cat.components.map(c=>c.id).sort(),m.components.map(c=>c.id).sort());
 assert.deepEqual(cat.processes.map(c=>[c.id,c.steps.length]),m.processes.map(c=>[c.id,c.steps.length]));
});
test('stop clears view and discards a delayed response from the old session',async()=>{
 let resolve,requests=[],next=1,timers=new Map(),intervals=new Map();
 const node={hidden:true,innerHTML:'',querySelector:()=>null};
 const doc={getElementById:id=>id==='salud-sistemas'?node:null,createElement:()=>({}),head:{appendChild:()=>{}}};
 const ctx={document:doc,URL,Date,Intl,AbortController,Promise,Set,Number,console,
  setTimeout:fn=>{timers.set(next,fn);return next++;},clearTimeout:id=>timers.delete(id),
  setInterval:fn=>{intervals.set(next,fn);return next++;},clearInterval:id=>intervals.delete(id),
  fetch:url=>{requests.push(url);return url.includes('estado-online.json')?new Promise(r=>resolve=r):
    Promise.resolve({ok:true,json:async()=>({schema:1,components:[],processes:[]})});}};
 ctx.window=ctx;ctx.addEventListener=()=>{};
 vm.runInNewContext(fs.readFileSync(require.resolve('../os/yod-salud.js'),'utf8'),ctx);
 ctx.YodSalud.activar({elementId:'salud-sistemas'});
 ctx.YodSalud.detener();
 resolve({ok:true,json:async()=>report()});
 for(let i=0;i<15;i++)await Promise.resolve();
 assert.equal(node.hidden,true);assert.equal(node.innerHTML,'');assert.equal(intervals.size,0);
 assert.ok(requests.every(u=>!u.includes('k=')&&!u.includes('token')));
});

test('Render receipt is accepted without a fabricated Actions run',()=>{
 const r=report({source:'render',run_id:undefined,cycle_id:'h-00000000-0000-4000-8000-000000000001'});
 assert.equal(Health.validReport(r),true);
 assert.equal(Health.validReport({...r,cycle_id:'bad'}),false);
 assert.equal(Health.validReport(report({source:'unknown'})),false);
});
test('independent report selection rejects a future clock and falls back when cloud is expired',()=>{
 const github=report(),cloud=report({source:'render',run_id:undefined,cycle_id:'h-00000000-0000-4000-8000-000000000001',generado_en:new Date(now+1).toISOString()});
 assert.equal(Health.chooseReport([github,cloud],now),github);
 assert.equal(Health.chooseReport([github,{...cloud,generado_en:new Date(now-46*60000).toISOString()}],now),github);
 const current={...cloud,generado_en:iso};assert.ok(Health.chooseReport([current],now)===current);
});
test('a fresh Render heartbeat does not renew an old business observation',()=>{
 const r=report({source:'render',run_id:undefined,cycle_id:'h-00000000-0000-4000-8000-000000000001'});
 const old=check({revisado_en:new Date(now-60*60000).toISOString(),vence_en:new Date(now-15*60000).toISOString()});
 assert.notEqual(Health.color(old,r,now,true),'verde');
 assert.equal(Health.safeEvidence('https://yod-cloud-room.onrender.com/horarios/estado.json'),'https://yod-cloud-room.onrender.com/horarios/estado.json');
 assert.equal(Health.safeEvidence('https://yod-cloud-room.onrender.com/horarios/callback?code=secret'),'');
});
