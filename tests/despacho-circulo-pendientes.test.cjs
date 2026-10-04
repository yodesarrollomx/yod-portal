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
 const boton=new Nodo('button');boton.attrs.id='circulo-open';boton.hidden=true;
 doc.getElementById=id=>id==='circulo-open'?boton:null;
 return {doc,boton};
}
function crearWin(search=''){const win=new Nodo('#win');win.location={search};win.CubefarmYOD=null;return win;}
function sesionFalsa(){
 const oyentes=new Set();let perfil=null;
 return {subscribeProfile(fn){oyentes.add(fn);fn(perfil);return()=>oyentes.delete(fn);},poner(p){perfil=p;for(const fn of oyentes)fn(p);}};
}
const PERFIL={case_id:'caso-sintetico',name:'Caso de prueba'};
const HASH='a'.repeat(64);
function tarea(n,status,extra={}){
 const ev=status==='ready_for_review'?['ev-'+n]:[];
 return {id:'task-'+n,title:'Acción '+n,criterion:'Criterio '+n,status,summary:'Resumen '+n,evidence_ids:ev,...extra};
}
function meta(extra={}){
 return {goal_id:'meta-1',case_id:PERFIL.case_id,title:'Meta sintética',instruction:'Instrucción',criterion:'Criterio',scope:'local_analysis_v1',status:'ready_for_review',
  source_revision:'rev-1',revision:'rev-1',sequence:1,created_at:'2026-10-01T10:00:00Z',updated_at:'2026-10-01T11:00:00Z',summary:'Resumen de la meta',
  tasks:[],evidence:[],...extra};
}
function evidencia(n){return {id:'ev-'+n,task_id:'task-'+n,title:'Evidencia',text:'abc',sha256:HASH,bytes:3};}
function respuesta(goals){return {ok:true,schema:1,source_revision:'rev-1',goals};}

test('lee la línea de tarjetas que deja el motor y reconoce las acciones seguras y las de revisar a mano',async()=>{
 const {categoriasDeJev}=await load('circulo-pendientes.mjs');
 const linea='Resumen.\n\nJev ordeno las 4 acciones. Seguras: 3 (listas para aprobar: task-1, task-2; bloqueadas por falta de datos: task-3). A revisar a mano: 1 (task-4). Es solo una guia: la aprobacion es tuya.';
 const {porAccion,aRevisar}=categoriasDeJev(linea);
 assert.equal(porAccion.get('task-1'),'aprobar');assert.equal(porAccion.get('task-2'),'aprobar');assert.equal(porAccion.get('task-3'),'datos');
 assert.equal(porAccion.has('task-4'),false);assert.deepEqual([...aRevisar],['task-4']);
 for(const raro of [undefined,null,42,'',{},'Jev ordeno las x acciones. Seguras: 1 (inventadas: task-1; listas para aprobar: task-9).']){
  const r=categoriasDeJev(raro);assert.equal(r.porAccion.size,0);assert.equal(r.aRevisar.size,0);
 }
});

test('cada acción abierta se vuelve una tarjeta: la categoría de Jev manda y, sin ella, el estado de la acción',async()=>{
 const {pendientesDeMetas}=await load('circulo-pendientes.mjs');
 const {validateGoals}=await load('goals.mjs');
 const m=validateGoals(respuesta([
  meta({summary:'Entrega.\n\nJev ordeno las 3 acciones. Seguras: 2 (con cifras por verificar: task-1; esperan tu decision: task-2). A revisar a mano: 1 (task-3). Es solo una guia: la aprobacion es tuya.',
   tasks:[tarea(1,'ready_for_review'),tarea(2,'running'),tarea(3,'blocked')],evidence:[evidencia(1)]}),
  meta({goal_id:'meta-2',title:'Otra meta',status:'running',summary:'',tasks:[tarea(1,'pending',{title:'Acción de otra meta'})]}),
  meta({goal_id:'meta-3',title:'Meta lista',status:'completed',tasks:[]})
 ]),PERFIL.case_id);
 const p=pendientesDeMetas(m,{de:'Caso de prueba'});
 assert.equal(p.length,4);
 // Orden: lo que pide a Dirección primero (decidir, cifras, datos) y los borradores al final.
 assert.deepEqual(p.map(x=>x.categoria),['decidir','cifras','datos','borrador']);
 const origenes=Object.fromEntries(p.map(x=>[x.titulo,x.origen]));
 assert.equal(origenes['Acción 1'],'Jev · Meta sintética');
 assert.equal(origenes['Acción 3'],'A revisar a mano · Meta sintética');
 assert.equal(p.find(x=>x.titulo==='Acción 3').categoria,'datos');
 assert.equal(p.find(x=>x.titulo==='Acción 3').con,'dir');
 assert.equal(p.find(x=>x.origen.includes('Otra meta')).con,'otros');
 assert.ok(p.every(x=>x.de==='Caso de prueba'));
 assert.ok(!p.some(x=>x.origen.includes('Meta lista')));
});

test('una meta sin acciones se resume por su estado, y los textos largos se acotan para el círculo',async()=>{
 const {pendientesDeMetas}=await load('circulo-pendientes.mjs');
 const {validarDatos}=await load('circulo-datos.mjs');
 const largo='x'.repeat(3000);
 const p=pendientesDeMetas({goals:[
  meta({status:'awaiting_data',summary:largo,title:'T'.repeat(150)}),
  meta({goal_id:'m2',status:'stopped',summary:''}),
  meta({goal_id:'m3',status:'queued',summary:'En cola'})
 ]},{de:'D'.repeat(500)});
 assert.deepEqual(p.map(x=>x.categoria),['decidir','datos','borrador']);
 assert.ok(p.every(x=>x.detalle.length<=600&&x.titulo.length<=160&&x.de.length<=120&&x.origen.length<=120));
 // Lo que sale del adaptador siempre pasa la validación de datos del círculo.
 assert.doesNotThrow(()=>validarDatos({ejemplo:false,parcial:true,pendientes:p,ppp:{vigente:null,borrador:null,nota:'n'},historial:[],moac:[],documentos:[],conversaciones:[]}));
 assert.deepEqual(pendientesDeMetas(null),[]);assert.deepEqual(pendientesDeMetas({goals:'no'}),[]);
});

test('leer metas pide solo readGoals, valida la respuesta y siempre cierra el transporte; ante cualquier falla devuelve null',async()=>{
 const {leerMetas}=await load('circulo-pendientes.mjs');
 const llamadas=[];let cerrado=0;
 const crear=impl=>()=>new Proxy({dispose(){cerrado++;}},{get(t,k){if(k in t)return t[k];return(...a)=>{llamadas.push(String(k));return k==='readGoals'?impl(...a):Promise.reject(Error('no permitido'));};}});
 const bien=await leerMetas({win:{},caseId:PERFIL.case_id,crearTransporte:crear(async p=>{assert.deepEqual(p,{case_id:PERFIL.case_id});return respuesta([meta()]);})});
 assert.equal(bien.goals.length,1);assert.deepEqual(llamadas,['readGoals']);assert.equal(cerrado,1);
 assert.equal(await leerMetas({win:{},caseId:PERFIL.case_id,crearTransporte:crear(async()=>({ok:false,error:'unauthorized'}))}),null);
 assert.equal(await leerMetas({win:{},caseId:PERFIL.case_id,crearTransporte:crear(async()=>{throw Error('outside_os');})}),null);
 assert.equal(await leerMetas({win:{},caseId:PERFIL.case_id,crearTransporte:crear(async()=>respuesta([meta({case_id:'otro-caso'})]))}),null);
 assert.equal(await leerMetas({win:{},caseId:PERFIL.case_id,crearTransporte:crear(async()=>({ok:true,schema:1,source_revision:'r',goals:[],extra:1}))}),null);
 assert.equal(await leerMetas({win:{},caseId:PERFIL.case_id,tiempoMs:10,crearTransporte:crear(()=>new Promise(()=>{}))}),null);
 assert.equal(await leerMetas({win:{},caseId:'',crearTransporte:crear(async()=>respuesta([]))}),null);
 assert.equal(await leerMetas({win:{},crearTransporte:()=>{throw Error('x');}}),null);
 assert.equal(cerrado,6);
 assert.ok(llamadas.every(x=>x==='readGoals'));
});

test('con los datos reales el círculo declara qué está conectado: Pendientes sí, los demás sectores todavía no',async()=>{
 const {datosReales}=await load('circulo-pendientes.mjs');
 const {crearCirculo,cuentas}=await load('circulo.mjs');
 const {validateGoals}=await load('goals.mjs');
 const {doc}=crearDoc();
 const metas=validateGoals(respuesta([meta({summary:'Resumen',tasks:[tarea(1,'ready_for_review')],evidence:[evidencia(1)]})]),PERFIL.case_id);
 const hoja=crearCirculo({doc,perfil:PERFIL,datos:datosReales(PERFIL,metas)});
 const texto=hoja.raiz.textContent;
 assert.match(texto,/Pendientes reales/);assert.match(texto,/solo Pendientes está conectado/);assert.match(texto,/Acción 1/);
 assert.doesNotMatch(texto,/Datos de ejemplo|Vista de ejemplo/);
 assert.deepEqual(Object.values(cuentas(hoja.model)),['1','—','—','—','—','—']);
 hoja.elegir('historial');assert.match(hoja.raiz.textContent,/todavía no está conectado a datos reales/);
 hoja.elegir('conversaciones');assert.match(hoja.raiz.textContent,/todavía no está conectado a datos reales/);
 // Sin metas legibles se avisa, no se inventa nada.
 const vacia=crearCirculo({doc,perfil:PERFIL,datos:datosReales(PERFIL,null)});
 assert.match(vacia.raiz.textContent,/No pude leer las metas ahora/);assert.equal(vacia.model.pendientes.length,0);
 const sinAcciones=crearCirculo({doc,perfil:PERFIL,datos:datosReales(PERFIL,{goals:[]})});
 assert.match(sinAcciones.raiz.textContent,/No hay acciones abiertas/);
});

test('el interruptor de pendientes reales viene apagado: sin él el círculo sigue con datos de ejemplo y no lee nada',async()=>{
 const {CIRCULO_PENDIENTES_REALES}=await load('circulo-config.mjs');
 assert.equal(CIRCULO_PENDIENTES_REALES,false);
 const {montarCirculo}=await load('circulo.mjs');
 const {doc,boton}=crearDoc(),win=crearWin('?circulo=1'),s=sesionFalsa();win.CubefarmYOD=s;
 let lecturas=0;
 montarCirculo({win,doc,activo:false,leer:async()=>{lecturas++;return null;}});
 s.poner(PERFIL);
 await boton.emit('click');
 assert.equal(lecturas,0);
 assert.match(doc.body.children[0].textContent,/Datos de ejemplo/);
});

test('con ?pendientes=1 abrir lee las metas del caso autorizado, muestra la hoja una vez y no abre doble',async()=>{
 const {montarCirculo}=await load('circulo.mjs');
 const {validateGoals}=await load('goals.mjs');
 const {doc,boton}=crearDoc(),win=crearWin('?circulo=1&pendientes=1'),s=sesionFalsa();win.CubefarmYOD=s;
 const pedidos=[];let soltar;
 const leer=async a=>{pedidos.push(a.caseId);await new Promise(r=>{soltar=r;});return validateGoals(respuesta([meta({tasks:[tarea(1,'blocked')]})]),PERFIL.case_id);};
 montarCirculo({win,doc,activo:false,leer});
 s.poner(PERFIL);
 const p1=boton.emit('click'),p2=boton.emit('click');
 assert.equal(boton.disabled,true);assert.equal(doc.body.children.length,0);
 soltar();await p1;await p2;
 assert.deepEqual(pedidos,[PERFIL.case_id]);
 assert.equal(doc.body.children.length,1);assert.equal(boton.disabled,false);
 assert.match(doc.body.children[0].textContent,/Acción 1/);assert.match(doc.body.children[0].textContent,/Pendientes reales/);
});

test('si el servidor retira el perfil mientras se leen las metas, la hoja no se abre',async()=>{
 const {montarCirculo}=await load('circulo.mjs');
 const {doc,boton}=crearDoc(),win=crearWin('?circulo=1&pendientes=1'),s=sesionFalsa();win.CubefarmYOD=s;
 let soltar;
 montarCirculo({win,doc,activo:false,leer:()=>new Promise(r=>{soltar=()=>r(null);})});
 s.poner(PERFIL);
 const abierto=boton.emit('click');
 s.poner(null);
 soltar();await abierto;
 assert.equal(doc.body.children.length,0);assert.equal(boton.hidden,true);
});

test('el lector es de solo lectura: ninguna escritura, ninguna red propia, ningún innerHTML y ninguna identidad real',()=>{
 const fuente=leerArchivo('circulo-pendientes.mjs');
 for(const prohibido of ['createGoal','reviewGoal','enqueue','mintFastSession','resolveCurrent','fetch(','XMLHttpRequest','WebSocket','localStorage','sessionStorage','innerHTML','insertAdjacentHTML','eval(','Function('])
  assert.equal(fuente.includes(prohibido),false,prohibido);
 assert.equal((fuente.match(/\.readGoals\(/g)||[]).length,1);
 for(const archivo of ['circulo-pendientes.mjs','circulo.mjs','circulo-config.mjs','circulo-datos.mjs'])
  assert.doesNotMatch(leerArchivo(archivo),/Gast[oó]n Madrid|A-161|ptmuaik6hq4px6g|docs\.google\.com\/spreadsheets|script\.google\.com/);
});
