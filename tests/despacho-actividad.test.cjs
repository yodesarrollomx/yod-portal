const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=import('../despacho3d/actividad.mjs');
const identity={schema:1,activity_id:'ACT-EXAMPLE',case_id:'CASE-EXAMPLE',request_id:'REQ-EXAMPLE',actor_id:'ACTOR-EXAMPLE',space_id:'biblioteca',operation:'consulta',requires_arrival:true,created_at:'2026-01-01T00:00:00.000Z',expected_revision:'REV-EXAMPLE',links:{job_id:'JOB-EXAMPLE',message_id:'MSG-EXAMPLE'}};
const states=['solicitado','iniciado','llego','trabajando','esperando_revision','terminado'];
const kinds=['request','movement','movement','work','result','result'];
const event=(sequence,kind=states[sequence-1],extra={})=>({schema:1,event_id:'EVT-'+sequence,activity_id:identity.activity_id,case_id:identity.case_id,sequence,kind,source:'simulator',created_at:new Date(Date.UTC(2026,0,1,0,0,sequence)).toISOString(),evidence:{scope:'synthetic',kind:kinds[states.indexOf(kind)]||'error',ref:['esperando_revision','terminado'].includes(kind)?'RESULT-EXAMPLE':'PROOF-'+sequence},...extra});
async function ledger(opts={}){return(await core).crearActividad({activity:structuredClone(identity),mode:'synthetic',...opts});}

test('actividad: llegar no termina el trabajo; resultado exige la entrega revisada',async()=>{
 const l=await ledger();for(let n=1;n<=3;n++)l.aplicar(event(n));
 assert.equal(l.leer().state,'llego');assert.equal(l.leer().result_ref,null);
 assert.throws(()=>l.aplicar(event(4,'terminado')),/invalid_transition/);
 l.aplicar(event(4));l.aplicar(event(5));
 assert.throws(()=>l.aplicar(event(6,'terminado',{evidence:{scope:'synthetic',kind:'result',ref:'OTHER-RESULT'}})),/result_changed/);
 assert.equal(l.leer().state,'esperando_revision');assert.equal(l.leer().events.length,5);
 const ack=l.aplicar(event(6));assert.equal(ack.state,'terminado');assert.equal(ack.receipt_scope,'synthetic');
});
test('reintento: mismo ID y contenido no duplica, incluido después del cierre',async()=>{
 const l=await ledger();for(let n=1;n<=6;n++)l.aplicar(event(n));
 const e=event(1),reordered={evidence:{ref:e.evidence.ref,kind:e.evidence.kind,scope:e.evidence.scope},...e};
 assert.equal(l.aplicar(reordered).duplicate,true);assert.equal(l.leer().events.length,6);
 assert.throws(()=>l.aplicar({...e,created_at:'2026-01-01T00:00:07.000Z'}),/event_conflict/);
 assert.equal(l.leer().state,'terminado');
});
test('orden, ID del caso y actividad, hora y evidencia se validan antes de mutar',async()=>{
 const l=await ledger();l.aplicar(event(1));
 for(const [value,code]of [
  [event(3),'sequence_conflict'],
  [event(2,'iniciado',{case_id:'OTHER-CASE'}),'activity_changed'],
  [event(2,'iniciado',{activity_id:'OLD-ACTIVITY'}),'activity_changed'],
  [event(2,'iniciado',{created_at:'2025-12-31T23:59:59.000Z'}),'time_conflict'],
  [event(2,'iniciado',{source:'server'}),'invalid_evidence'],
  [event(2,'iniciado',{evidence:{scope:'synthetic',kind:'result',ref:'RESULT-EXAMPLE'}}),'invalid_evidence']
 ]){assert.throws(()=>l.aplicar(value),new RegExp(code));assert.equal(l.leer().events.length,1);}
});
test('procedencia: piloto solo acredita llegada local; recibo local no acredita respaldo',async()=>{
 const l=await ledger({mode:'verified-input'});
 const real=(n,source=n===1?'server':n===3?'pilot':'executor',scope=n===3?'local':'server')=>event(n,states[n-1],{source,evidence:{...event(n).evidence,scope}});
 assert.throws(()=>l.aplicar(event(1)),/invalid_evidence/);
 assert.throws(()=>l.aplicar(real(1,'pilot','local')),/invalid_evidence/);
 assert.equal(l.aplicar(real(1)).receipt_scope,'local-projection');l.aplicar(real(2));l.aplicar(real(3));
 assert.throws(()=>l.aplicar(real(4,'pilot','local')),/invalid_evidence/);
 assert.throws(()=>l.aplicar(real(4,'executor','local')),/invalid_evidence/);
 l.aplicar(real(4));l.aplicar(real(5));l.aplicar(real(6));assert.equal(l.leer().state,'terminado');
});
test('fallo/cancelación: respuesta tardía no reabre la actividad, reintento sí se reconoce',async()=>{
 for(const kind of ['fallido','cancelado']){
  const l=await ledger();l.aplicar(event(1));
  const e=event(2,kind,{code:kind==='fallido'?'tool_failed':'cancelled',evidence:{scope:'synthetic',kind:kind==='fallido'?'error':'cancel',ref:'PROOF-EXAMPLE'}});
  l.aplicar(e);assert.equal(l.aplicar(e).duplicate,true);
  assert.throws(()=>l.aplicar(event(3,'trabajando')),/activity_terminal/);assert.equal(l.leer().state,kind);
 }
});
test('esquema estricto: campo inesperado, ID inválido, fecha imposible y error sin código se rechazan',async()=>{
 const {validarActividad,validarEvento}=await core;
 for(const v of [{...identity,permissions:['*']},{...identity,case_id:''},{...identity,links:{job_id:'JOB-EXAMPLE',token:'x'}},{...identity,created_at:'2026-02-30T00:00:00.000Z'}])assert.throws(()=>validarActividad(v),/invalid_activity/);
 for(const e of [event(1,'solicitado',{code:'cancelled'}),event(1,'fallido'),event(1,'solicitado',{sequence:0}),event(1,'solicitado',{token:'x'})])assert.throws(()=>validarEvento(e),/invalid_event/);
});
test('historial: reproducción no ejecuta acciones; copias no cambian IDs ni evidencia',async()=>{
 const {reproducirActividad}=await core,l=await ledger();for(let n=1;n<=5;n++)l.aplicar(event(n));
 const snapshot=l.leer(),recovered=reproducirActividad(snapshot,{mode:'synthetic'});
 assert.deepEqual(recovered,snapshot);assert.deepEqual(recovered.activity.links,identity.links);
 snapshot.activity.links.job_id='OTHER';snapshot.events[0].evidence.ref='OTHER';
 assert.equal(l.leer().activity.links.job_id,'JOB-EXAMPLE');assert.equal(l.leer().events[0].evidence.ref,'PROOF-1');
 assert.throws(()=>reproducirActividad({activity:identity,events:[event(2)]},{mode:'synthetic'}),/sequence_conflict/);
});
test('consulta sin recorrido admite trabajo directo; con recorrido rechaza saltarse la llegada',async()=>{
 for(const requires_arrival of [true,false]){
  const l=await ledger({activity:{...identity,requires_arrival}});l.aplicar(event(1));l.aplicar(event(2));
  if(requires_arrival)assert.throws(()=>l.aplicar(event(3,'trabajando')),/invalid_transition/);
  else{l.aplicar(event(3,'trabajando'));assert.equal(l.leer().state,'trabajando');}
 }
});

class Node{
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.listeners={};this._text='';this.disabled=false;}
 setAttribute(k,v){this.attrs[k]=String(v);}appendChild(n){this.children.push(n);return n;}get firstChild(){return this.children[0];}removeChild(n){this.children=this.children.filter(c=>c!==n);}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ');}
 addEventListener(k,fn){this.listeners[k]=fn;}click(){if(!this.disabled)this.listeners.click?.();}all(){return this.children.flatMap(n=>[n,...n.all()]);}
}
async function demo(){const doc={createElement:t=>new Node(t)},root=new Node('main');const api=(await import('../despacho3d/actividad-demo.mjs')).montarDemo({doc,root});return {root,api,button:text=>root.all().find(n=>n.tag==='button'&&n.textContent===text)};}
test('pantalla sintética: controles recorren estados, muestran prueba sin respaldo y reintentan sin duplicar',async()=>{
 const {root,api,button}=await demo();assert.equal(root.attrs['data-state'],'inicio');
 for(const text of ['Solicitar actividad','Iniciar recorrido','Confirmar llegada'])button(text).click();
 assert.equal(api.leer().state,'llego');assert.match(root.textContent,/consulta todavía no está terminada/);
 button('Reintentar último evento').click();assert.equal(api.leer().events.length,3);assert.match(root.textContent,/ningún evento duplicado/);
 for(const text of ['Comenzar trabajo','Preparar entrega','Confirmar resultado'])button(text).click();
 assert.equal(api.leer().state,'terminado');assert.equal(api.leer().events.length,6);assert.match(root.textContent,/Sin respaldo del servidor/);
 button('Probar evento tardío').click();assert.equal(api.leer().events.length,6);assert.match(root.textContent,/Evento tardío rechazado/);
 const before=api.leer().activity.activity_id;button('Reiniciar prueba').click();assert.notEqual(api.leer().activity.activity_id,before);assert.equal(api.leer().state,null);
});
test('pantalla sintética: cancelación y fallo cierran controles, sin resultado falso',async()=>{
 for(const action of ['Cancelar actividad','Simular fallo']){
  const {api,button,root}=await demo();button('Solicitar actividad').click();button(action).click();
  assert.ok(button('Actividad finalizada').disabled);assert.equal(api.leer().result_ref,null);
  button('Probar evento tardío').click();assert.equal(api.leer().events.length,2);assert.match(root.textContent,/Evento tardío rechazado/);
 }
});
test('demostración aislada: sin transporte, permisos, secretos ni persistencia del navegador',()=>{
 for(const file of ['actividad.mjs','actividad-demo.mjs','actividad-demo.html']){
  const source=fs.readFileSync(path.join(__dirname,'../despacho3d',file),'utf8');
  assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|postMessage|innerHTML|CubefarmYOD/);
 }
});
