'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../despacho3d'),vendor=pathToFileURL(path.join(base,'vendor/three.module.js')).href;
const cache=new Map();
function moduleURL(file){
 if(cache.has(file))return cache.get(file);
 let src=fs.readFileSync(file,'utf8').replace(/from 'three'/g,`from '${vendor}'`).replace(/from '(\.\/[^']+)'/g,(_,relative)=>`from '${moduleURL(path.resolve(path.dirname(file),relative))}'`);
 const url='data:text/javascript;base64,'+Buffer.from(src).toString('base64');cache.set(file,url);return url;
}

const modules=Promise.all([import(vendor),import(moduleURL(path.join(base,'avatars/office-pilot.mjs'))),import(moduleURL(path.join(base,'entorno-ruta.mjs')))]);
const profile={id:'CASE-EXAMPLE',case_id:'CASE-EXAMPLE',entity_kind:'case',name:'Caso de ejemplo',form:'robot',color:'#547e75',visual:{}};
const panel=value=>({getProfile:()=>value,openForCase(){},subscribeProfile(fn){fn(value);return()=>{};}});
const libre=muros=>(x,z)=>!muros.some(m=>x>m.minX&&x<m.maxX&&z>m.minZ&&z<m.maxZ);
const L=[{minX:0,maxX:10,minZ:0,maxZ:10}];
const recto=(p,q,ok)=>{const n=40;for(let i=0;i<=n;i++){const t=i/n;if(!ok(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t))return false;}return true;};

test('puestoDe: delante de la cámara y mirando hacia ella',async()=>{
 const [,,{puestoDe}]=await modules;
 const p=puestoDe({eye:[8,1.65,-4.45],target:[6.65,1.3,-4.42]});
 assert.ok(Math.abs(p.xz[0]-7.055)<.01&&Math.abs(p.xz[1]+4.43)<.05);
 assert.ok(Math.abs(p.rot-Math.PI/2)<.05,'mira hacia quien llega');
 assert.equal(puestoDe(null),null);
 assert.equal(puestoDe({eye:[0,1,0],target:[NaN,1,1]}),null);
 assert.deepEqual(puestoDe({eye:[1,1,1],target:[1,1,1]}),{xz:[1,1],rot:0});
});

test('rutaEntre rodea un muro con hueco y nunca pisa un obstáculo',async()=>{
 const [,,{rutaEntre}]=await modules;
 const muro=[{minX:4.5,maxX:5.5,minZ:0,maxZ:7}];
 const ok=libre(muro);
 const r=rutaEntre([1,1],[9,1],ok,L);
 assert.ok(r&&r.length>=3,'tiene que dar la vuelta');
 assert.deepEqual(r[0],[1,1]);assert.deepEqual(r[r.length-1],[9,1]);
 for(let i=1;i<r.length;i++)assert.ok(recto(r[i-1],r[i],ok),'tramo '+i);
 const directa=rutaEntre([1,8.5],[9,8.5],ok,L);
 assert.equal(directa.length,2,'sin obstáculo va en línea recta');
});

test('rutaEntre: sin camino, entradas raras o destino sobre un mueble',async()=>{
 const [,,{rutaEntre}]=await modules;
 const cerrado=libre([{minX:4.5,maxX:5.5,minZ:-1,maxZ:11}]);
 assert.equal(rutaEntre([1,1],[9,1],cerrado,L),null);
 assert.equal(rutaEntre([1,1],[9,1],'no',L),null);
 assert.equal(rutaEntre([NaN,1],[9,1],cerrado,L),null);
 assert.equal(rutaEntre([1,1],[9,1],cerrado,[]),null);
 assert.equal(rutaEntre([1,1],[100,100],libre([]),L),null,'fuera del Despacho');
 const mesa=libre([{minX:6,maxX:8,minZ:6,maxZ:8}]);
 const r=rutaEntre([1,1],[7,7],mesa,L);
 assert.ok(r&&mesa(...r[r.length-1]),'el puesto se corre a un lugar libre');
});

test('con los muebles reales: todos los espacios se alcanzan sin atravesar nada',async()=>{
 const [T,,{rutaEntre,puestoDe}]=await modules;const previous=global.document;
 global.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='measureText'?()=>({width:100}):String(key).includes('Gradient')?()=>({addColorStop(){}}):()=>{}})}),createElementNS(){const listeners={};return {addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name],set src(value){queueMicrotask(()=>listeners.error?.call(this,{}));}};}};
 try{
  const {createOffice}=await import(moduleURL(path.join(base,'scene.js')));
  const office=await createOffice({pilotFigure:false});
  const dentro=(b,x,z)=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ;
  const ok=(x,z)=>(dentro(office.bounds,x,z)||dentro(office.annex,x,z))&&!office.collisions.some(c=>x>c.minX-.22&&x<c.maxX+.22&&z>c.minZ-.22&&z<c.maxZ+.22);
  const src=fs.readFileSync(path.join(base,'office.js'),'utf8');
  const bloque=src.slice(src.indexOf('const places={'),src.indexOf('};',src.indexOf('const places={')));
  const lugares=Object.fromEntries([...bloque.matchAll(/^\s*(\w+):\{label:'[^']*',eye:\[([^\]]+)\],target:\[([^\]]+)\]/gm)].map(m=>[m[1],{eye:m[2].split(',').map(Number),target:m[3].split(',').map(Number)}]));
  const ids=Object.keys(lugares);
  assert.ok(ids.length>=10);
  const inicio=[6.65,-4.42];
  for(const id of ids){
   const puesto=puestoDe(lugares[id]);
   const ruta=rutaEntre(inicio,puesto.xz,ok,[office.bounds,office.annex]);
   assert.ok(ruta,'sin ruta a '+id);
   for(let i=1;i<ruta.length;i++)assert.ok(recto(ruta[i-1],ruta[i],ok),id+' tramo '+i);
   assert.ok(ok(...ruta[ruta.length-1]),id+' termina en lugar libre');
   const vuelta=rutaEntre(ruta[ruta.length-1],inicio,ok,[office.bounds,office.annex]);
   assert.ok(vuelta,'sin vuelta desde '+id);
  }
  office.model.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
 }finally{global.document=previous;}
});

test('el piloto camina por la ruta, pasa a caminar y termina quieto mirando al frente',async()=>{
 const [T,{createOfficePilot}]=await modules,scene=new T.Scene(),p=createOfficePilot({scene});
 assert.equal(p.recorrer([[0,0],[1,1]],0),false,'sin perfil no se mueve');
 p.bind(panel(profile));
 assert.deepEqual(p.posicion(),[6.65,-4.42]);
 assert.deepEqual(p.inicio,{xz:[6.65,-4.42],rot:Math.PI/2});
 assert.equal(p.recorrer([[6.65,-4.42]],0),false);
 assert.equal(p.recorrer([[6.65,-4.42],[NaN,1]],0),false);
 assert.equal(p.recorrer([[6.65,-4.42],[4.65,-4.42]],'x'),false);
 assert.equal(p.recorrer([[6.65,-4.42],[4.65,-4.42]],1.5),true);
 assert.equal(p.getState().motion,'walk');
 let t=0;p.update(t);
 for(;t<=800;t+=70)p.update(t);
 const [x]=p.posicion();assert.ok(x<6.65&&x>4.65,'va a medio camino: '+x);
 assert.ok(Math.abs(scene.children[0].rotation.y-(-Math.PI/2))<.01,'mira hacia donde camina');
 for(;t<=3000;t+=70)p.update(t);
 assert.deepEqual(p.posicion().map(v=>+v.toFixed(2)),[4.65,-4.42]);
 assert.equal(p.getState().motion,'idle');
 assert.equal(scene.children[0].rotation.y,1.5);
 p.dispose();
});

test('movimiento inmediato (movimiento reducido), pausa por overlay y fallo cerrado al retirar el perfil',async()=>{
 const [T,{createOfficePilot}]=await modules,scene=new T.Scene(),p=createOfficePilot({scene});
 let valor=profile,oyente=null;
 p.bind({getProfile:()=>valor,openForCase(){},subscribeProfile(fn){oyente=fn;fn(valor);return()=>{};}});
 assert.equal(p.recorrer([[6.65,-4.42],[2,2]],0.5,{inmediato:true}),true);
 assert.deepEqual(p.posicion(),[2,2]);assert.equal(p.getState().motion,'idle');
 p.recorrer([[2,2],[0,0]],0);p.update(0);
 for(let t=70;t<=700;t+=70)p.update(t,{overlay:true});
 assert.deepEqual(p.posicion(),[2,2],'en pausa no avanza');
 oyente(null);
 assert.equal(p.posicion(),null);assert.equal(p.recorrer([[0,0],[1,1]],0),false);
 oyente(profile);
 assert.deepEqual(p.posicion(),[6.65,-4.42],'un perfil nuevo vuelve a su lugar');
 p.dispose();
});

test('crearAgenteIr valida el espacio, calcula la ruta y avisa si no puede',async()=>{
 const [,,{crearAgenteIr}]=await modules;
 const llamadas=[];
 const piloto={posicion:()=>[1,1],inicio:{xz:[9,9],rot:2},recorrer:(r,rot,o)=>{llamadas.push({r,rot,o});return true;}};
 const lugares={sala:{eye:[2,1.6,5],target:[2,1.2,8]}};
 const ir=crearAgenteIr({lugares,piloto,permitido:()=>true,limites:L,reducido:()=>true});
 assert.equal(ir('sala'),true);
 assert.ok(llamadas[0].o.inmediato);assert.deepEqual(llamadas[0].r[0],[1,1]);
 assert.equal(ir('inicio'),true);assert.equal(llamadas[1].rot,2);
 assert.equal(ir('no-existe'),false);assert.equal(ir('__proto__'),false);assert.equal(ir(5),false);
 assert.equal(crearAgenteIr({lugares,piloto:{posicion:()=>null},permitido:()=>true,limites:L})('sala'),false);
 assert.equal(crearAgenteIr({lugares,piloto,permitido:()=>false,limites:L})('sala'),false);
 assert.equal(llamadas.length,2);
});

test('la oficina solo ofrece caminar con su interruptor y la hoja muestra los botones solo entonces',async()=>{
 const config=fs.readFileSync(path.join(base,'entorno-config.mjs'),'utf8');
 assert.match(config,/ENTORNO_AGENTE_CAMINA=false/);
 const office=fs.readFileSync(path.join(base,'office.js'),'utf8');
 assert.match(office,/ENTORNO_AGENTE_CAMINA\|\|\/\(\?:\^\|\[\?&\]\)camina=1/);
 for(const f of ['entorno-ruta.mjs','entorno.mjs']){
  const s=fs.readFileSync(path.join(base,f),'utf8');
  assert.doesNotMatch(s,/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|postMessage|eval\(|innerHTML/,f);
 }
});
