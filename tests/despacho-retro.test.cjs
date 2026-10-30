'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const moduleAt=p=>import(pathToFileURL(path.join(root,p)).href);
const renderer=()=>moduleAt('despacho-retro/retro-map.mjs');
const layout=()=>moduleAt('despacho3d/office-layout.mjs');

// El canvas es un doble de transporte y dibujo, sin GPU ni datos de negocio.
function canvasDouble(){
 const listeners=new Map();
 const context=new Proxy({}, {get:(target,key)=>key==='measureText'?()=>({width:20}):target[key]||(()=>{}),set:(target,key,value)=>(target[key]=value,true)});
 const frames=new Map();let frameId=0;
 const win={requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId;},cancelAnimationFrame(id){frames.delete(id);},addEventListener(){},removeEventListener(){}};
 const canvas={ownerDocument:{defaultView:win},width:800,height:500,clientWidth:800,clientHeight:500,style:{},
  getContext(type){assert.equal(type,'2d');return context;},
  getBoundingClientRect(){return {left:0,top:0,width:800,height:500};},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
  setAttribute(){},setPointerCapture(){},releasePointerCapture(){},
  listeners,frames,dispatch(type,event){for(const fn of listeners.get(type)||[])fn({...event,type});}};
 return canvas;
}

test('transformaciones de mapa conservan coordenadas en ambos sentidos',async()=>{
 const {worldToScreen,screenToWorld}=await renderer();
 for(const transform of [{scale:1,offsetX:0,offsetY:0},{scale:12.4,offsetX:217,offsetY:-11}]){
  for(const point of [{x:0,z:0},{x:-23.2,z:6.3},{x:11,z:-9}]){
   const result=screenToWorld(worldToScreen(point,transform),transform);
   assert.ok(Math.abs(result.x-point.x)<1e-9);assert.ok(Math.abs(result.z-point.z)<1e-9);
  }
 }
});

test('13 lugares canónicos se seleccionan, sin aceptar IDs desconocidos',async()=>{
 const {createRetroMap}=await renderer(),{places,allowed}=await layout();
 const selected=[],moved=[],canvas=canvasDouble();
 const map=createRetroMap({canvas,onSelect:id=>selected.push(id),onMove:p=>moved.push(p)});
 assert.equal(Object.keys(places).length,13);
 for(const id of Object.keys(places)){
  assert.equal(map.visit(id),true,id);
  const state=map.getState();assert.equal(state.selected,id);
  assert.ok(allowed(state.position.x,state.position.z),id);
 }
 assert.deepEqual(selected,[], 'visit navega; la selección se emite al pulsar el mapa');
 map.destroy();
 const clicks=[],input=canvasDouble(),interactive=createRetroMap({canvas:input,onSelect:id=>clicks.push(id)});
 // Al iniciar, la transformación ajusta un área 40×23 al canvas de 800×500.
 const event={pointerId:1,clientX:424,clientY:404};
 input.dispatch('pointerdown',event);input.dispatch('pointerup',event);
 assert.deepEqual(clicks,['entry']);interactive.destroy();
 const before=map.getState();assert.equal(map.visit('synthetic-missing'),false);assert.deepEqual(map.getState(),before);
 assert.ok(moved.every(p=>allowed(p.x,p.z)));
 map.destroy();
});

test('movimiento respeta muebles y límites, incluso con pasos grandes',async()=>{
 const {createRetroMap}=await renderer(),{allowed}=await layout();
 const canvas=canvasDouble(),map=createRetroMap({canvas});
 map.visit('patio');
 map.move(10,0);assert.ok(map.getState().position.x < -3,'no atraviesa el patio central');
 for(const [dx,dz] of [[100,0],[-100,0],[0,100],[0,-100],[1e4,1e4]]){
  map.move(dx,dz);const p=map.getState().position;
  assert.ok(allowed(p.x,p.z),JSON.stringify(p));
 }
 const state=map.getState();
 for(const [dx,dz] of [[NaN,0],[0,Infinity],['1',0],[null,0]])assert.equal(map.move(dx,dz),false);
 assert.deepEqual(map.getState(),state);
 map.destroy();
});

test('zoom inválido no altera estado; destroy es idempotente y retira listeners',async()=>{
 const {createRetroMap}=await renderer();const canvas=canvasDouble();
 const map=createRetroMap({canvas});const initial=map.getState();
 for(const value of [NaN,Infinity,0,-1,'2'])assert.equal(map.zoomBy(value),false);
 assert.deepEqual(map.getState(),initial);
 assert.equal(map.zoomBy(1.2),true);assert.notEqual(map.getState().zoom,initial.zoom);
 map.destroy();map.destroy();
 for(const [event,handlers] of canvas.listeners)assert.equal(handlers.size,0,event);
 assert.equal(canvas.frames.size,0,'sin fotogramas pendientes');
 assert.equal(map.visit('entry'),false);assert.equal(map.move(1,0),false);assert.equal(map.zoomBy(1.2),false);
});

test('el grafo de módulos 2D no incorpora Three ni servicios de negocio',()=>{
 const visited=new Set();
 function walk(file){
  file=path.resolve(file);if(visited.has(file))return;visited.add(file);
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(source,/\b(?:WebGLRenderer|WebGLRenderingContext|fetch\s*\(|XMLHttpRequest|sendBeacon)\b/,file);
  for(const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\()\s*['"]([^'"]+)['"]/g)){
   const spec=match[1];assert.ok(!/three|OrbitControls|scene\.js|office\.js|avatars\//i.test(spec),`${file}: ${spec}`);
   if(spec.startsWith('.'))walk(path.resolve(path.dirname(file),spec.split('?')[0]));
   else assert.fail(`Dependencia no local: ${spec}`);
  }
 }
 walk(path.join(root,'despacho-retro/retro-map.mjs'));
});

test('el runtime retro completo y sus boots no importan Three ni módulos gráficos 3D',()=>{
 const visited=new Set();
 function walk(file){
  file=path.resolve(file);if(visited.has(file))return;visited.add(file);
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\()\s*['"]([^'"]+)['"]/g)){
   const spec=match[1];assert.ok(!/three|OrbitControls|scene\.js|office\.js|avatars\//i.test(spec),`${path.relative(root,file)}: ${spec}`);
   if(spec.startsWith('.'))walk(path.resolve(path.dirname(file),spec.split('?')[0]));else assert.fail(`Dependencia externa ${spec}`);
  }
 }
 const runtime=fs.readFileSync(path.join(root,'despacho-retro/retro-runtime.mjs'),'utf8');
 const list=runtime.match(/\[('office-lifecycle\.mjs'[\s\S]*?)\]\.map\(name=>import/);
 assert.ok(list,'no omitir la lista de boots dinámicos');
 const boots=[...list[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.ok(boots.length>=10);
 walk(path.join(root,'despacho-retro/retro-runtime.mjs'));
 for(const file of boots)walk(path.join(root,'despacho3d',file));
});
