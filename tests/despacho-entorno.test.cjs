'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=n=>import('../despacho3d/'+n);
const leerArchivo=n=>fs.readFileSync(path.join(root,'despacho3d',n),'utf8');

// DOM mínimo (el mismo que usan las pruebas del círculo).
class Nodo{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.listeners={};this.parentNode=null;this.hidden=false;this.disabled=false;this._text='';}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k];}
 appendChild(n){n.parentNode=this;this.children.push(n);return n;}
 removeChild(n){this.children=this.children.filter(c=>c!==n);n.parentNode=null;return n;}
 get firstChild(){return this.children[0]||null;}
 addEventListener(ev,fn){(this.listeners[ev]||(this.listeners[ev]=[])).push(fn);}
 removeEventListener(ev,fn){this.listeners[ev]=(this.listeners[ev]||[]).filter(f=>f!==fn);}
 emit(ev,data={}){const r=[];for(const fn of this.listeners[ev]||[])r.push(fn(data));return Promise.all(r);}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 focus(){this.enfocado=true;}
 all(fn,out=[]){if(fn(this))out.push(this);for(const c of this.children)c.all(fn,out);return out;}
}
function crearDoc(){
 const doc=new Nodo('#doc');
 doc.createElement=t=>new Nodo(t);doc.createElementNS=(ns,t)=>new Nodo(t);
 doc.body=new Nodo('body');
 const boton=new Nodo('button');boton.attrs.id='entorno-open';boton.hidden=true;
 doc.getElementById=id=>id==='entorno-open'?boton:null;
 return {doc,boton};
}
function crearWin(search=''){const win=new Nodo('#win');win.location={search};win.CubefarmYOD=null;return win;}
function sesionFalsa(){
 const oyentes=new Set();let perfil=null;
 return {subscribeProfile(fn){oyentes.add(fn);fn(perfil);return()=>oyentes.delete(fn);},poner(p){perfil=p;for(const fn of oyentes)fn(p);}};
}
const PERFIL={case_id:'caso-sintetico',name:'Caso de prueba'};
const textos=n=>n.all(()=>true).map(x=>x._text).join(' ');

test('catálogo: nueve espacios, todos en solo observar y sin permisos de acción',async()=>{
 const {ESPACIOS,PERMISOS,puedeActuar,espacioDe}=await load('entorno.mjs');
 assert.equal(ESPACIOS.length,9);
 assert.equal(new Set(ESPACIOS.map(e=>e.id)).size,9);
 for(const e of ESPACIOS){
  assert.equal(e.permiso,'observar');
  assert.ok(Object.hasOwn(PERMISOS,e.tope));
  assert.equal(puedeActuar(e.id,'observar'),true);
  assert.equal(puedeActuar(e.id,'borrador'),false);
  assert.equal(puedeActuar(e.id,'accion'),false);
  assert.ok(Object.isFrozen(e));
 }
 assert.equal(puedeActuar('no-existe','observar'),false);
 assert.equal(puedeActuar('juntas','otro'),false);
 assert.equal(espacioDe('museo').nombre,'Museo de maquetas de Aurum');
 assert.equal(espacioDe('x'),null);
});

test('los espacios con lugar apuntan a lugares reales del Despacho',async()=>{
 const {ESPACIOS}=await load('entorno.mjs');
 const office=leerArchivo('office-layout.mjs');
 const lugares=[...office.slice(office.indexOf('export const places={'),office.indexOf('};',office.indexOf('export const places={'))).matchAll(/^\s*(\w+):\{label:/gm)].map(m=>m[1]);
 assert.ok(lugares.length>=10);
 const conLugar=ESPACIOS.filter(e=>e.lugar);
 assert.ok(conLugar.length>=3);
 for(const e of conLugar)assert.ok(lugares.includes(e.lugar),e.id+' -> '+e.lugar);
});

test('registro: guarda en memoria, valida y limita',async()=>{
 const {crearRegistro}=await load('entorno.mjs');
 let t=0;
 const r=crearRegistro({reloj:()=>'2026-10-04T10:0'+(t++)+':00Z',max:3});
 const v=r.registrar({espacio:'juntas',quien:'agente',motivo:'  Presentar\nentrega  '});
 assert.equal(v.motivo,'Presentar entrega');
 assert.equal(r.cuantas('juntas'),1);
 assert.throws(()=>r.registrar({espacio:'nada'}),/visita_invalida/);
 assert.throws(()=>r.registrar({espacio:'juntas',quien:'desconocido'}),/visita_invalida/);
 assert.throws(()=>r.registrar(),/visita_invalida/);
 for(let i=0;i<4;i++)r.registrar({espacio:'museo'});
 assert.equal(r.lista().length,3);
 assert.equal(r.cuantas('juntas'),0);
 const copia=r.lista();copia[0].espacio='juntas';
 assert.equal(r.cuantas('juntas'),0);
 assert.equal(r.registrar({espacio:'museo',motivo:'x'.repeat(500)}).motivo.length,120);
});

test('con el interruptor apagado: no monta nada ni toca el botón',async()=>{
 const {montarEntorno}=await load('entorno.mjs');
 const {doc,boton}=crearDoc();const win=crearWin();
 assert.equal(montarEntorno({win,doc,activo:false}),false);
 assert.equal(boton.hidden,true);
 assert.equal((boton.listeners.click||[]).length,0);
 const config=await load('entorno-config.mjs');
 assert.equal(config.ENTORNO_ACTIVO,true,'encendido por indicación de Dirección');
});

test('?entorno=1 muestra el botón solo con perfil autorizado y abre/cierra la hoja',async()=>{
 const {montarEntorno,crearRegistro}=await load('entorno.mjs');
 const {doc,boton}=crearDoc();const win=crearWin('?entorno=1');
 const sesion=sesionFalsa();win.CubefarmYOD=sesion;
 const registro=crearRegistro();
 assert.equal(montarEntorno({win,doc,registro}),true);
 assert.equal(boton.hidden,true);
 await boton.emit('click');
 assert.equal(doc.body.children.length,0,'sin perfil no abre');
 sesion.poner(PERFIL);
 assert.equal(boton.hidden,false);
 await boton.emit('click');await boton.emit('click');
 assert.equal(doc.body.children.length,1,'no se duplica');
 const hoja=doc.body.children[0];
 assert.match(textos(hoja),/Entorno del agente/);
 assert.equal(hoja.all(n=>n.attrs['data-espacio']).length,9);
 assert.match(textos(hoja),/Todavía no hay visitas/);
 doc.emit('keydown',{key:'Escape'});
 assert.equal(doc.body.children.length,0);
 await boton.emit('click');
 sesion.poner(null);
 assert.equal(boton.hidden,true);
 assert.equal(doc.body.children.length,0,'al retirar el perfil se cierra');
});

test('ir a un espacio registra solo después de confirmar la vista; sin lugar no hay botón',async()=>{
 const {montarEntorno,crearRegistro}=await load('entorno.mjs');
 const {doc,boton}=crearDoc();const win=crearWin('?entorno=1');
 const sesion=sesionFalsa();win.CubefarmYOD=sesion;sesion.poner(PERFIL);
 const idas=[];win.despacho={visit:id=>{idas.push(id);return true;}};
 const registro=crearRegistro();
 montarEntorno({win,doc,registro});
 await boton.emit('click');
 const hoja=doc.body.children[0];
 const botones=hoja.all(n=>n.tag==='button'&&n.attrs.class==='entorno-ir');
 const conLugar=(await load('entorno.mjs')).ESPACIOS.filter(e=>e.lugar).length;
 assert.equal(botones.length,conLugar);
 await botones[0].emit('click');
 assert.deepEqual(idas,['decisions']);
 assert.equal(registro.cuantas('juntas'),1);
 assert.equal(registro.lista()[0].quien,'direccion');
 assert.equal(doc.body.children.length,0,'la hoja se cierra al ir');
});

test('sin la oficina disponible no registra visitas falsas',async()=>{
 const {montarEntorno,crearRegistro}=await load('entorno.mjs');
 const {doc,boton}=crearDoc();const win=crearWin('?entorno=1');
 const sesion=sesionFalsa();win.CubefarmYOD=sesion;sesion.poner(PERFIL);
 const registro=crearRegistro();
 montarEntorno({win,doc,registro});
 await boton.emit('click');
 const b=doc.body.children[0].all(n=>n.attrs.class==='entorno-ir')[0];
 await b.emit('click');
 assert.equal(registro.lista().length,0);
 assert.equal(doc.body.children.length,1);
});

test('solo lectura: sin red, sin Sheets, sin almacenamiento y sin identificadores reales',()=>{
 for(const n of ['entorno.mjs','entorno-config.mjs','entorno-boot.mjs','entorno.css']){
  const s=leerArchivo(n);
  assert.doesNotMatch(s,/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|postMessage|eval\(|innerHTML/,n);
  assert.doesNotMatch(s,/script\.google|docs\.google|spreadsheets|@[a-z0-9-]+\.[a-z]{2,}|\+?\d{10,}/i,n);
 }
 const html=leerArchivo('index.html');
 assert.match(html,/id="entorno-open" hidden/);
 assert.match(html,/entorno-boot\.mjs/);
});

test('con movimiento disponible, Enviar inicia la ruta y solo la llegada registra la visita',async()=>{
 const {montarEntorno,crearRegistro,ESPACIOS}=await load('entorno.mjs');
 const {doc,boton}=crearDoc();const win=crearWin('?entorno=1');
 const sesion=sesionFalsa();win.CubefarmYOD=sesion;sesion.poner(PERFIL);
 const idas=[],modos=[];let acepta=true;
 win.despacho={visit(){},setMode:m=>modos.push(m),agenteIr:id=>{idas.push(id);return acepta;}};
 const registro=crearRegistro();
 montarEntorno({win,doc,registro});
 await boton.emit('click');
 let hoja=doc.body.children[0];
 const conLugar=ESPACIOS.filter(e=>e.lugar).length;
 assert.equal(hoja.all(n=>n.attrs.class==='entorno-enviar').length,conLugar);
 assert.equal(hoja.all(n=>n.attrs.class==='entorno-volver').length,1);
 // Si la ruta falla no se registra nada y la hoja sigue abierta.
 acepta=false;
 await hoja.all(n=>n.attrs.class==='entorno-enviar')[0].emit('click');
 assert.equal(registro.lista().length,0);assert.equal(doc.body.children.length,1);
 acepta=true;
 await hoja.all(n=>n.attrs.class==='entorno-enviar')[0].emit('click');
 assert.deepEqual(idas,['decisions','decisions']);
 assert.equal(registro.lista().length,0,'aceptar una orden no es llegar');
 await win.emit('yod-agent-arrived',{detail:{lugar:'decisions'}});
 assert.equal(registro.lista()[0].quien,'agente');assert.equal(registro.lista()[0].espacio,'juntas');
 assert.deepEqual(modos,['overview']);assert.equal(doc.body.children.length,0);
 await boton.emit('click');hoja=doc.body.children[0];
 await hoja.all(n=>n.attrs.class==='entorno-volver')[0].emit('click');
 assert.equal(idas.at(-1),'inicio');assert.equal(registro.lista().length,1,'volver no cuenta como visita');
});

test('sin el movimiento de la oficina no hay botones de enviar',async()=>{
 const {montarEntorno,crearRegistro}=await load('entorno.mjs');
 const {doc,boton}=crearDoc();const win=crearWin('?entorno=1');
 const sesion=sesionFalsa();win.CubefarmYOD=sesion;sesion.poner(PERFIL);win.despacho={visit(){}};
 montarEntorno({win,doc,registro:crearRegistro()});
 await boton.emit('click');
 const hoja=doc.body.children[0];
 assert.equal(hoja.all(n=>n.attrs.class==='entorno-enviar').length,0);
 assert.equal(hoja.all(n=>n.attrs.class==='entorno-volver').length,0);
});

// ---- Sala de juntas: entregas por aprobar (solo lectura) ----
const HASH64='a'.repeat(64);
function metaDe(tareas,extra={}){
 return {goal_id:'meta-1',case_id:PERFIL.case_id,title:'Meta sintética',instruction:'Instrucción',criterion:'Criterio',scope:'local_analysis_v1',status:'ready_for_review',
  source_revision:'rev-1',revision:'rev-1',sequence:1,created_at:'2026-10-01T10:00:00Z',updated_at:'2026-10-01T11:00:00Z',summary:'Resumen',tasks:tareas,evidence:[],...extra};
}
const tareaDe=(n,status)=>({id:'task-'+n,title:'Acción '+n,criterion:'Criterio '+n,status,summary:'Resumen '+n,evidence_ids:status==='ready_for_review'?['ev-'+n]:[]});
const evidenciaDe=n=>({id:'ev-'+n,task_id:'task-'+n,title:'Evidencia',text:'abc',sha256:HASH64,bytes:3});
async function montarJuntas({search='?entorno=1&juntas=1',leer,juntas}={}){
 const {montarEntorno,crearRegistro}=await load('entorno.mjs');
 const {doc,boton}=crearDoc();const win=crearWin(search);
 const sesion=sesionFalsa();win.CubefarmYOD=sesion;sesion.poner(PERFIL);
 montarEntorno({win,doc,registro:crearRegistro(),leer,juntas});
 await boton.emit('click');
 return {doc,boton,sesion,hoja:doc.body.children[0]};
}
const botonEntregas=h=>h.all(n=>n.attrs.class==='entorno-entregas-ver')[0];

test('juntas: sin el interruptor (?juntas=1 ausente y juntas:false) no hay botón de entregas ni lecturas',async()=>{
 let llamadas=0;
 const {hoja}=await montarJuntas({search:'?entorno=1',juntas:false,leer:async()=>{llamadas++;return null;}});
 assert.equal(botonEntregas(hoja),undefined);assert.equal(llamadas,0);
 const config=await load('entorno-config.mjs');
 assert.equal(config.ENTORNO_JUNTAS,true,'encendido por indicación de Dirección');
});

test('juntas: lee en solo lectura y muestra solo lo que espera aprobación o decisión',async()=>{
 const pedidos=[];
 const modelo={ok:true,schema:1,source_revision:'rev-1',goals:[metaDe([tareaDe(1,'ready_for_review'),tareaDe(2,'pending'),tareaDe(3,'blocked')],{evidence:[evidenciaDe(1)],summary:'Jev ordeno las 3 acciones. Seguras: 3 (listas para aprobar: task-1; esperan tu decision: task-2; bloqueadas por falta de datos: task-3). A revisar a mano: 0. Es solo una guia.'})]};
 const {hoja}=await montarJuntas({leer:async args=>{pedidos.push(args);return modelo.goals.length?{goals:modelo.goals}:null;}});
 const b=botonEntregas(hoja);assert.ok(b);
 await b.emit('click');
 assert.deepEqual(pedidos.map(p=>p.caseId),[PERFIL.case_id]);
 const texto=textos(hoja);
 assert.match(texto,/Acción 1/);assert.match(texto,/Acción 2/);
 assert.doesNotMatch(texto,/Acción 3/,'bloqueada por datos no espera aprobación');
 assert.match(texto,/Por aprobar/);assert.match(texto,/Por decidir/);
 assert.match(texto,/no se aprueba nada/);
});

test('juntas: vacío, error y lectura repetida con el botón ocupado',async()=>{
 let modo='vacio',n=0,liberar;
 const leer=async()=>{n++;if(modo==='error')return null;if(modo==='espera')await new Promise(r=>{liberar=r;});return {goals:[]};};
 const {hoja}=await montarJuntas({leer});
 await botonEntregas(hoja).emit('click');
 assert.match(textos(hoja),/No hay nada esperando/);
 modo='error';await botonEntregas(hoja).emit('click');
 assert.match(textos(hoja),/No pude leerlo ahora/);
 modo='espera';
 const p1=botonEntregas(hoja).emit('click');
 assert.match(textos(hoja),/Leyendo/);
 await botonEntregas(hoja).emit('click');
 assert.equal(n,3,'no lanza una segunda lectura mientras lee');
 liberar();await p1;
 assert.match(textos(hoja),/No hay nada esperando/);
});

test('juntas: si se retira el perfil mientras lee, no muestra nada del caso anterior',async()=>{
 let liberar;
 const leer=async()=>{await new Promise(r=>{liberar=r;});return {goals:[metaDe([tareaDe(1,'ready_for_review')],{evidence:[evidenciaDe(1)]})]};};
 const {hoja,sesion}=await montarJuntas({leer});
 const p=botonEntregas(hoja).emit('click');
 sesion.poner(null);liberar();await p;
 assert.doesNotMatch(textos(hoja),/Acción 1/);
});

test('juntas: la lectura es solo readGoals; no crea, aprueba ni detiene nada',()=>{
 const s=leerArchivo('entorno.mjs');
 assert.doesNotMatch(s,/createGoal|reviewGoal|enqueue|mintFastSession|stopGoal|approve\(/);
 const p=leerArchivo('circulo-pendientes.mjs');
 assert.match(p,/readGoals/);assert.doesNotMatch(p,/createGoal|reviewGoal|enqueue/);
});
