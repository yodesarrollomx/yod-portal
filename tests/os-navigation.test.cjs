'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../os/catalogo.js');
function policy(path){const source=fs.readFileSync(require.resolve(path),'utf8');const block=source.match(/  \/\* NAVIGATION-BEGIN \*\/[\s\S]*?\/\* NAVIGATION-END \*\//);assert.ok(block,'política generada');const scope=vm.createContext({});vm.runInContext(block[0],scope);return scope;}
const app=policy('../os/app.js'),shell=policy('../os/shell.js');
const rows=ids=>ids.map(system_id=>({system_id,estado:'Activo'}));
const ids=r=>Array.from(r,x=>x.system_id);
for(const [name,p] of [['cabina',app],['marco',shell]]){
 test(name+': orden constante aunque cambien orden de respuesta y duplicados',()=>{
   const input=rows(['SYS-OBRA','SYS-POTENCIALES','SYS-TRACK','SYS-DESPACHO','SYS-POTENCIALES','SYS-TAREAS']);
   const before=JSON.stringify(input);const out=ids(p.orderedModules(input));
   assert.deepEqual(out,['SYS-DESPACHO','SYS-POTENCIALES','SYS-TRACK','SYS-TAREAS','SYS-OBRA']);
   assert.deepEqual(ids(p.orderedModules(input.slice().reverse())),out);
   assert.equal(JSON.stringify(input),before,'no modifica filas de origen');
 });
 test(name+': hijo permanece dentro del padre y no cambia al visitar otro tablero',()=>{
   const input=rows(['SYS-MIRAMAR','SYS-TRACK','SYS-OBRA']);
   assert.deepEqual(ids(p.sidebarModules(input)),['SYS-TRACK','SYS-OBRA']);
   assert.deepEqual(ids(p.sidebarModules(rows(['SYS-MIRAMAR']))),['SYS-MIRAMAR'],'no pierde acceso sin padre');
   input.find(r=>r.system_id==='SYS-TRACK').estado='Mantenimiento';
   assert.deepEqual(ids(p.sidebarModules(input,r=>r.estado==='Activo')),['SYS-TRACK','SYS-MIRAMAR','SYS-OBRA'],'padre apagado no oculta el hijo');
 });
 test(name+': no incorpora IDs que la sesión no entregó ni altera datos',()=>{
   const allowed=rows(['SYS-OBRA','SYS-TAREAS']);allowed[0].titulo_portal='Título de origen';
   const output=p.orderedModules(allowed);assert.deepEqual(ids(output),['SYS-TAREAS','SYS-OBRA']);
   assert.equal(output[1],allowed[0]);assert.equal(output[1].titulo_portal,'Título de origen');
   assert.equal(p.orderedModules(null).length,0);
   assert.deepEqual(ids(p.orderedModules(rows(['__proto__','__proto__','constructor']))),['__proto__','constructor']);
 });
}
test('ambos marcos provienen del mismo catálogo y no cambian permisos',()=>{
 assert.deepEqual(Array.from(app.NAV_ORDER),C.map(x=>x.id));assert.deepEqual(Array.from(shell.NAV_ORDER),C.map(x=>x.id));
 assert.deepEqual(JSON.parse(JSON.stringify(app.NAV_PARENT)),Object.fromEntries(C.filter(x=>x.navParent).map(x=>[x.id,x.navParent])));
 assert.deepEqual(JSON.parse(JSON.stringify(app.NAV_PARENT)),JSON.parse(JSON.stringify(shell.NAV_PARENT)));
});

for(const file of ['../os/app.js','../os/shell.js'])test(file+': role label is presentation only and keeps module identity',()=>{const source=fs.readFileSync(require.resolve(file),'utf8');const fn=source.match(/function moduleTitle\(row\)\s*\{[^}]+\}/)[0];const scope=vm.createContext({state:{role:'admin'},safeText:v=>String(v||''),NAME:{}});vm.runInContext(fn,scope);const row={system_id:'SYS-INVERSION',titulo_portal:'Inversión'};assert.equal(scope.moduleTitle(row),'Master Developer');scope.state.role='vista';assert.equal(scope.moduleTitle(row),'Master Broker');assert.equal(row.system_id,'SYS-INVERSION');assert.equal(row.titulo_portal,'Inversión');assert.equal(scope.moduleTitle({system_id:'SYS-OBRA',titulo_portal:'Obra'}),'Obra');});
