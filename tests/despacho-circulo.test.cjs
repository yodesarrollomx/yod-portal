'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=n=>import('../despacho3d/'+n);

// DOM mínimo: lo justo para montar y pintar sin navegador.
class Nodo{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.listeners={};this.parentNode=null;this.hidden=false;this._text='';}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k];}
 appendChild(n){n.parentNode=this;this.children.push(n);return n;}
 removeChild(n){this.children=this.children.filter(c=>c!==n);n.parentNode=null;return n;}
 get firstChild(){return this.children[0]||null;}
 addEventListener(ev,fn){(this.listeners[ev]||(this.listeners[ev]=[])).push(fn);}
 removeEventListener(ev,fn){this.listeners[ev]=(this.listeners[ev]||[]).filter(f=>f!==fn);}
 emit(ev,data={}){for(const fn of this.listeners[ev]||[])fn(data);}
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
function crearWin(search=''){
 const win=new Nodo('#win');win.location={search};win.CubefarmYOD=null;
 return win;
}
function sesionFalsa(){
 const oyentes=new Set();let perfil=null;
 return {subscribeProfile(fn){oyentes.add(fn);fn(perfil);return()=>oyentes.delete(fn);},poner(p){perfil=p;for(const fn of oyentes)fn(p);},conteo:()=>oyentes.size};
}

test('el interruptor viene apagado y sin él el círculo no aparece ni conecta nada',async()=>{
 const {CIRCULO_ACTIVO}=await load('circulo-config.mjs');
 assert.equal(CIRCULO_ACTIVO,false);
 const {montarCirculo}=await load('circulo.mjs');
 const {doc,boton}=crearDoc(),win=crearWin(),s=sesionFalsa();win.CubefarmYOD=s;
 assert.equal(montarCirculo({win,doc,activo:false}),false);
 assert.equal(s.conteo(),0);assert.deepEqual(boton.listeners,{});
 assert.equal(montarCirculo({win:crearWin('?circulo=0'),doc,activo:false}),false);
});

test('encendido, el botón solo se ve con perfil autorizado por el servidor y se oculta al perderlo',async()=>{
 const {montarCirculo}=await load('circulo.mjs');
 const {doc,boton}=crearDoc(),win=crearWin(),s=sesionFalsa();win.CubefarmYOD=s;
 assert.equal(montarCirculo({win,doc,activo:true}),true);
 assert.equal(boton.hidden,true);
 s.poner({case_id:'caso-sintetico',name:'Caso de prueba'});assert.equal(boton.hidden,false);
 s.poner(null);assert.equal(boton.hidden,true);
});

test('la vista previa ?circulo=1 también exige perfil autorizado y espera a que el panel de agentes esté listo',async()=>{
 const {montarCirculo}=await load('circulo.mjs');
 const {doc,boton}=crearDoc(),win=crearWin('?x=1&circulo=1');
 assert.equal(montarCirculo({win,doc,activo:false}),true);
 assert.equal(boton.hidden,true);
 const s=sesionFalsa();win.CubefarmYOD=s;win.emit('yod-agents-ready');
 assert.equal(s.conteo(),1);assert.equal(boton.hidden,true);
 s.poner({case_id:'caso-sintetico',name:'Caso de prueba'});assert.equal(boton.hidden,false);
 win.emit('yod-agents-ready');assert.equal(s.conteo(),1);
});

test('abrir pinta la hoja con el nombre del perfil; Escape y × la cierran y devuelven el foco',async()=>{
 const {montarCirculo}=await load('circulo.mjs');
 const {doc,boton}=crearDoc(),win=crearWin(),s=sesionFalsa();win.CubefarmYOD=s;
 montarCirculo({win,doc,activo:true});
 boton.emit('click');assert.equal(doc.body.children.length,0,'sin perfil no abre');
 s.poner({case_id:'c',name:'Caso de prueba'});
 boton.emit('click');boton.emit('click');
 assert.equal(doc.body.children.length,1);
 const hoja=doc.body.children[0];
 assert.match(hoja.textContent,/Círculo de Caso de prueba/);assert.match(hoja.textContent,/Vista de ejemplo/);
 doc.emit('keydown',{key:'Escape'});
 assert.equal(doc.body.children.length,0);assert.equal(boton.enfocado,true);
 boton.emit('click');
 const hoja2=doc.body.children[0];
 hoja2.all(n=>n.attrs.class==='circulo-cerrar')[0].emit('click');
 assert.equal(doc.body.children.length,0);
 boton.emit('click');s.poner(null);assert.equal(doc.body.children.length,0,'perder el perfil cierra la hoja');
});


test('seis sectores distintos, clicables y con teclado; cada uno muestra su contenido',async()=>{
 const {crearCirculo,SECTORES,trayecto,centro}=await load('circulo.mjs');
 assert.deepEqual(SECTORES.map(s=>s.id),['pendientes','ppp','historial','moac','documentos','conversaciones']);
 assert.equal(new Set(SECTORES.map((s,i)=>trayecto(i))).size,6);
 assert.equal(new Set(SECTORES.map((s,i)=>centro(i).join())).size,6);
 const {doc}=crearDoc();
 const c=crearCirculo({doc,perfil:{name:'Caso de prueba'}});
 const gajos=()=>c.raiz.all(n=>n.attrs.role==='button'&&n.tag==='path');
 assert.equal(gajos().length,6);
 assert.deepEqual(gajos().map(g=>g.attrs['aria-label']),SECTORES.map(s=>s.etiqueta));
 const esperado={ppp:/Mi borrador|propuesta/i,historial:/Primer registro/,moac:/catastrales/,documentos:/no acredita/,conversaciones:/WhatsApp/,pendientes:/Aprobar la versión 2/};
 for(const [i,s] of SECTORES.entries()){
  gajos()[i].emit('click');
  assert.equal(c.estado.sector,s.id);
  assert.equal(gajos()[i].attrs['aria-pressed'],'true');
  assert.match(c.raiz.textContent,esperado[s.id]);
 }
 gajos()[0].emit('keydown',{key:'Enter'});assert.equal(c.estado.sector,'pendientes');
 gajos()[1].emit('keydown',{key:' ',preventDefault(){}});assert.equal(c.estado.sector,'ppp');
});

test('los pendientes se filtran y llevan la categoría; en PPP los botones de aprobar están desactivados',async()=>{
 const {crearCirculo}=await load('circulo.mjs');
 const {doc}=crearDoc(),c=crearCirculo({doc});
 const tarjetas=()=>c.raiz.all(n=>n.attrs.class==='circulo-tarjeta');
 assert.equal(tarjetas().length,5);
 c.raiz.all(n=>n.tag==='button'&&n.textContent==='Con Dirección')[0].emit('click');
 assert.equal(tarjetas().length,3);
 c.raiz.all(n=>n.tag==='button'&&n.textContent==='Con otros')[0].emit('click');
 assert.equal(tarjetas().length,2);
 c.elegir('ppp');
 const aprobar=c.raiz.all(n=>n.tag==='button'&&/Aprobar como vigente|Devolver/.test(n.textContent));
 assert.equal(aprobar.length,2);for(const b of aprobar)assert.equal(b.attrs.disabled,'disabled');
});

test('los datos se validan: textos acotados, categorías y tonos cerrados, nada desconocido pasa',async()=>{
 const {validarDatos,datosDeEjemplo,CATEGORIAS}=await load('circulo-datos.mjs');
 assert.equal(validarDatos(datosDeEjemplo()).ejemplo,true);
 assert.deepEqual(Object.keys(CATEGORIAS),['aprobar','decidir','cifras','datos','borrador']);
 const base=()=>JSON.parse(JSON.stringify(datosDeEjemplo()));
 const malos=[
  d=>{d.pendientes[0].categoria='otra';},
  d=>{d.pendientes[0].con='todos';},
  d=>{d.pendientes[0].titulo='x'.repeat(161);},
  d=>{d.pendientes[0].detalle='';},
  d=>{d.moac[0][2]='rojo';},
  d=>{d.documentos[0].pop();},
  d=>{d.historial=new Array(51).fill(['a','b']);},
  d=>{d.conversaciones[0].mensajes[0][0]='sistema';},
  d=>{d.ppp.vigente.filas[0]=['solo'];},
  d=>{d.ppp=null;},
  d=>{d.pendientes[0].titulo='con\u0000control';}
 ];
 for(const m of malos){const d=base();m(d);assert.throws(()=>validarDatos(d),/circulo_datos_invalidos/);}
 assert.throws(()=>validarDatos(null),/circulo_datos_invalidos/);
 const limpio=validarDatos({...base(),extra:'no pasa',pendientes:[{...base().pendientes[0],secreto:'no pasa'}]});
 assert.equal(Object.hasOwn(limpio,'extra'),false);assert.equal(Object.hasOwn(limpio.pendientes[0],'secreto'),false);
});

test('el texto del contenido nunca se interpreta como HTML',async()=>{
 const {crearCirculo}=await load('circulo.mjs');
 const {datosDeEjemplo}=await load('circulo-datos.mjs');
 const d=datosDeEjemplo();d.pendientes[0].titulo='<img src=x onerror=alert(1)>';
 const {doc}=crearDoc(),c=crearCirculo({doc,datos:d,perfil:{name:'<b>Caso</b>'}});
 assert.match(c.raiz.textContent,/<img src=x onerror=alert\(1\)>/);
 assert.match(c.raiz.textContent,/<b>Caso<\/b>/);
 assert.equal(c.raiz.all(n=>n.tag==='img'||n.tag==='script').length,0);
});

test('el módulo es de solo lectura: sin red, sin almacenamiento, sin innerHTML y sin identidades reales',()=>{
 for(const f of ['circulo.mjs','circulo-datos.mjs','circulo-boot.mjs','circulo-config.mjs']){
  const t=fs.readFileSync(path.join(root,'despacho3d',f),'utf8');
  assert.doesNotMatch(t,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(|new Function/,f);
  assert.doesNotMatch(t,/Gast[oó]n\s+Madrid|A-161|ptmuaik6hq4px6g|docs\.google\.com\/spreadsheets\/d\//,f);
 }
});

test('index.html carga el círculo, con el botón oculto de origen',()=>{
 const html=fs.readFileSync(path.join(root,'despacho3d/index.html'),'utf8');
 assert.match(html,/<button id="circulo-open" hidden>Círculo<\/button>/);
 assert.match(html,/circulo\.css\?v=1/);assert.match(html,/circulo-boot\.mjs\?v=1/);
 for(const f of ['circulo.css','circulo-boot.mjs','circulo.mjs','circulo-datos.mjs','circulo-config.mjs'])assert.ok(fs.existsSync(path.join(root,'despacho3d',f)),f);
});
