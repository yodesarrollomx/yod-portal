
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
require('../os/access-policy.js');
const policy=globalThis.YodAccessPolicy;
const shell=fs.readFileSync(require.resolve('../os/shell.js'),'utf8');
const canOpen=/  function canOpen\(sys\) \{[\s\S]*?\n  \}/.exec(shell)[0];
const codes=/  var CODES = \{[\s\S]*?\n  \}/.exec(shell)[0];
test('Control Maestro exige administración explícita en cabina y marco',()=>{
 for(const boards of ['', 'AC','*','FL,*'])for(const role of ['vista','editor','admin']){
  const c=vm.createContext({state:{identity:'ok',role,boards}});
  vm.runInContext(codes+';\n'+/  function boardsList\(\) \{[^\n]+\}/.exec(shell)[0]+'\n'+canOpen,c);
  assert.equal(policy.canOpen(boards,'SYS-CONTROL',role),role==='admin');
  assert.equal(c.canOpen('SYS-CONTROL'),role==='admin');
 }
});
test('Cada código configurado abre exclusivamente módulos canónicos compatibles',()=>{
 for(const [id,codes] of Object.entries(policy.systemCodes).filter(([id])=>id!=='SYS-CONTROL')){
  for(const code of codes){assert.equal(policy.canOpen(code,id,'vista'),true);
   for(const [other,required] of Object.entries(policy.systemCodes).filter(([other])=>other!==id&&other!=='SYS-CONTROL')){
    assert.equal(policy.canOpen(code,other,'vista'),required.includes(code));
   }
  }
 }
 assert.equal(policy.canOpen('','SYS-TAREAS','vista'),false);
 assert.equal(policy.canOpen('*','SYS-TAREAS','vista'),true);
});
test('El respaldo distingue un módulo ausente de uno oculto en Control Maestro',()=>{
 const app=fs.readFileSync(require.resolve('../os/app.js'),'utf8');
 const fn=/  function conAltasNuevas\(rows\)\{[\s\S]*?\n  \}/.exec(app)[0];
 const c=vm.createContext({state:{catalogIds:['SYS-MIRAMAR']},CAT_RESPALDO:[{system_id:'SYS-MIRAMAR'},{system_id:'SYS-DESPACHO'}]});vm.runInContext(fn,c);
 assert.deepEqual(Array.from(c.conAltasNuevas([]),x=>x.system_id),['SYS-DESPACHO']);
 c.state.catalogIds=null;assert.deepEqual(Array.from(c.conAltasNuevas([]),x=>x.system_id),['SYS-MIRAMAR','SYS-DESPACHO']);
 const sc=vm.createContext({DEST:{'SYS-MIRAMAR':'synthetic','SYS-DESPACHO':'synthetic'},NAME:{}});
 vm.runInContext(/  function conAltasNuevas\(rows, idsDelSheet\) \{[\s\S]*?\n  \}/.exec(shell)[0],sc);
 assert.deepEqual(Array.from(sc.conAltasNuevas([],['SYS-MIRAMAR']),x=>x.system_id),['SYS-DESPACHO']);
});
test('Buscar proyectos conserva los permisos de RM, AL y TM y exige sesión validada',()=>{
 const c=vm.createContext({state:{identity:'ok',role:'vista',boards:'FL'}});
 vm.runInContext(/  function boardsList\(\) \{[^\n]+\}/.exec(shell)[0]+'\n'+/  function canOpenProject\(p\) \{[\s\S]*?\n  \}/.exec(shell)[0],c);
 for(const [folio,code] of [['PRJ-RM','RM'],['PRJ-ALYSA','AL'],['PRJ-MARIA','TM']]){
  const p={folio,tablero:'synthetic'};assert.equal(c.canOpenProject(p),false);
  c.state.boards=code;assert.equal(c.canOpenProject(p),true);c.state.identity='pending';assert.equal(c.canOpenProject(p),false);
  c.state.identity='ok';c.state.boards='FL';
 }
 c.state.boards='*';assert.equal(c.canOpenProject({folio:'PRJ-ALYSA',tablero:'synthetic'}),true);
 assert.equal(c.canOpenProject({folio:'PRJ-UNKNOWN',tablero:'synthetic'}),false);
});
