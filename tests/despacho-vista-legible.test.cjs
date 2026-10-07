const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../despacho3d'),vendor=pathToFileURL(path.join(base,'vendor/three.module.js')).href;
const cache=new Map();
function moduleURL(file){
 if(cache.has(file))return cache.get(file);
 const src=fs.readFileSync(file,'utf8').replace(/from 'three'/g,`from '${vendor}'`).replace(/from '(\.\.?\/[^']+)'/g,(_,relative)=>`from '${moduleURL(path.resolve(path.dirname(file),relative.split('?')[0]))}'`);
 const url='data:text/javascript;base64,'+Buffer.from(src).toString('base64');cache.set(file,url);return url;
}
const modules=Promise.all([import(vendor),import(moduleURL(path.join(base,'avatars/office-pilot.mjs'))),import(moduleURL(path.join(base,'entorno-ruta.mjs'))),import('../despacho3d/office-layout.mjs')]);
const profile={id:'CASE-EXAMPLE',case_id:'CASE-EXAMPLE',entity_kind:'case',name:'Caso de prueba',form:'child',color:'#547e75',visual:{}};
function session(){let current=profile,listener;return {getProfile:()=>current,subscribeProfile(fn){listener=fn;fn(current);return()=>{listener=null;};},openForCase(){},revoke(){current=null;listener?.(null);}};}

test('el plano y 3D usan exactamente los mismos límites y obstáculos, incluso el ala editorial',async()=>{
 const layout=(await modules)[3],previous=global.document;
 global.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='measureText'?()=>({width:100}):String(key).includes('Gradient')?()=>({addColorStop(){}}):()=>{}})}),createElementNS(){const listeners={};return {addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name],set src(v){queueMicrotask(()=>listeners.error?.call(this,{}));}};}};
 try{
  const {createOffice}=await import(moduleURL(path.join(base,'scene.js'))),office=await createOffice({pilotFigure:false});
  assert.deepEqual(layout.bounds,office.bounds);assert.deepEqual(layout.annex,office.annex);assert.deepEqual(layout.collisions,office.collisions);
  for(const[x,z]of [[0,-1],[-18,-3.1],[50,50],[NaN,0]])assert.equal(layout.allowed(x,z),false);
  assert.equal(layout.allowed(-18,.7),true);
  office.model.traverse(n=>{if(n.isMesh)n.geometry.dispose();});
 }finally{global.document=previous;}
});

test('llegada: inicia, se pausa, alcanza coordenadas reales y notifica una sola vez',async()=>{
 const[T,{createOfficePilot},{crearAgenteIr},layout]=await modules,pilot=createOfficePilot({scene:new T.Scene()}),api=session();pilot.bind(api);
 const events=[],ir=crearAgenteIr({lugares:layout.places,piloto:pilot,permitido:layout.allowed,limites:[layout.bounds,layout.annex],alLlegar:id=>events.push(id)});
 assert.equal(ir('decisions'),true);assert.equal(events.length,0);assert.equal(pilot.getMovementState().destination,'decisions');
 pilot.update(0);for(let t=70;t<1000;t+=70)pilot.update(t,{overlay:true});assert.deepEqual(pilot.posicion(),[7,-6.25]);
 for(let t=1000;t<30000;t+=70)pilot.update(t);
 assert.deepEqual(events,['decisions']);assert.equal(pilot.getMovementState().place,'decisions');assert.equal(pilot.getMovementState().destination,null);assert.equal(pilot.getMovementState().motion,'idle');
 assert.ok(layout.allowed(...pilot.posicion()));
 assert.equal(ir('__proto__'),false);assert.deepEqual(events,['decisions']);pilot.dispose();
});

test('retirar el perfil o reemplazar la ruta nunca confirma la llegada cancelada',async()=>{
 const[T,{createOfficePilot},{crearAgenteIr},layout]=await modules,pilot=createOfficePilot({scene:new T.Scene()}),api=session();pilot.bind(api);
 const events=[],ir=crearAgenteIr({lugares:layout.places,piloto:pilot,permitido:layout.allowed,limites:[layout.bounds,layout.annex],alLlegar:id=>events.push(id)});
 ir('editing');ir('lounge');for(let t=0;t<30000;t+=70)pilot.update(t);assert.deepEqual(events,['lounge']);
 ir('decisions');api.revoke();for(let t=30000;t<60000;t+=70)pilot.update(t);
 assert.deepEqual(events,['lounge']);assert.equal(pilot.getMovementState().position,null);assert.equal(pilot.getMovementState().place,null);assert.equal(ir('inicio'),false);pilot.dispose();
});

test('movimiento reducido confirma la llegada inmediata y registra la posición final',async()=>{
 const[T,{createOfficePilot},{crearAgenteIr},layout]=await modules,pilot=createOfficePilot({scene:new T.Scene()});pilot.bind(session());
 const events=[],ir=crearAgenteIr({lugares:layout.places,piloto:pilot,permitido:layout.allowed,limites:[layout.bounds,layout.annex],reducido:()=>true,alLlegar:id=>events.push(id)});
 assert.equal(ir('editing'),true);assert.deepEqual(events,['editing']);assert.equal(pilot.getMovementState().place,'editing');
 assert.equal(pilot.getMovementState().motion,'idle');assert.ok(layout.allowed(...pilot.posicion()));pilot.dispose();
});

// Prueba del componente DOM aislado; no abre navegador ni endpoints de negocio.
class Node {
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.style={};this.hidden=false;this.disabled=false;this.listeners={};this.classList={add:()=>{}};this._text='';}
 setAttribute(k,v){this.attrs[k]=String(v);} getAttribute(k){return this.attrs[k];} get id(){return this.attrs.id;}
 set textContent(v){this._text=String(v);this.children=[];} get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ');}
 append(...ns){ns.forEach(n=>this.appendChild(n));} appendChild(n){n.parentNode=this;this.children.push(n);return n;}
 prepend(n){n.parentNode=this;this.children.unshift(n);} focus(){}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);} removeEventListener(){}
 removeChild(n){this.children=this.children.filter(c=>c!==n);n.parentNode=null;} get firstChild(){return this.children[0];}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}
 querySelectorAll(selector){return this.all().filter(n=>selector.split(',').some(s=>s[0]==='#'?n.id===s.slice(1):s[0]==='.'?(n.attrs.class||'').split(' ').includes(s.slice(1)):s[0]==='['?Object.hasOwn(n.attrs,s.slice(1,-1)):n.tag===s));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
}
function dom(){
 const document=new Node('document');document.body=new Node('body');document.append(document.body);document.createElement=t=>new Node(t);document.createElementNS=(ns,t)=>new Node(t);
 const header=new Node('header'),workspace=new Node('main');workspace.setAttribute('id','workspace');document.body.append(header,workspace);
 for(const id of ['office-accessible-open','entorno-open','agents-open']){const n=new Node('button');n.setAttribute('id',id);header.append(n);}
 for(const id of ['loading','fallback','joystick','crosshair','walk-guide','nearby','scrim','areas-open','help-open','case-open','areas','help','panel','panel-tag','panel-title','panel-body']){
  const n=new Node(['areas','help','panel'].includes(id)?'section':'div');n.setAttribute('id',id);workspace.append(n);
  if(['areas','help','panel'].includes(id)){n.setAttribute('class','sheet');const b=new Node('button');b.setAttribute('class','close');n.append(b);}
 }
 document.getElementById=id=>document.all().find(n=>n.id===id);document.hidden=false;document.activeElement=null;
 const window=new Node('window');window.location={search:'',hash:''};window.dispatchEvent=e=>{for(const fn of window.listeners[e.type]||[])fn(e);};
 let value=null;const subscribers=new Set();window.CubefarmYOD={getProfile:()=>value,isOpen:()=>false,open(){},openForCase(){},subscribeProfile(fn){subscribers.add(fn);fn(value);return()=>subscribers.delete(fn);},publish(v){value=v;subscribers.forEach(fn=>fn(v));}};
 return {document,window};
}
test('componente sin GPU: controles bloqueados sin perfil, navegación observable, llegada y borrado al revocar',async()=>{
 const saved=new Map();for(const k of ['document','window','location','requestAnimationFrame','matchMedia','CustomEvent','setInterval','clearInterval'])saved.set(k,global[k]);
 const{document,window}=dom();let animation;
 Object.assign(global,{document,window,location:window.location,requestAnimationFrame:fn=>{animation=fn;},matchMedia:()=>({matches:false}),CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}},setInterval:()=>1,clearInterval:()=>{}});
 try{
  const{startAccessibleOffice,mountAccessibleView}=await import(moduleURL(path.join(base,'office-accessible.mjs')));
  const api=startAccessibleOffice(),view=mountAccessibleView(api);assert.equal(api.view,'map');assert.equal(view.root.hidden,false);
  const send=view.root.all().find(n=>n.attrs['data-agent-destination']==='decisions');
  assert.ok(send.disabled);assert.match(view.root.textContent,/sin perfil autorizado/);assert.equal(api.agenteIr('decisions'),false);
  await api.visit('decisions');view.paint();assert.equal(view.root.attrs['data-selected'],'decisions');assert.match(view.root.textContent,/Tu vista: Decisiones/);
  window.CubefarmYOD.publish(profile);view.paint();assert.equal(send.disabled,false);send.onclick();
  assert.equal(view.root.attrs['data-agent-motion'],'walk');assert.equal(view.root.attrs['data-agent-destination'],'decisions');
  for(let t=0;t<30000;t+=70)animation(t);view.paint();
  assert.equal(view.root.attrs['data-agent-motion'],'idle');assert.equal(view.root.attrs['data-agent-place'],'decisions');assert.match(view.root.textContent,/Llegada confirmada a Decisiones/);
  window.CubefarmYOD.publish(null);view.paint();assert.equal(send.disabled,true);assert.equal(view.root.attrs['data-agent-motion'],'unavailable');assert.doesNotMatch(view.root.textContent,/Caso de prueba/);
  assert.equal(view.root.attrs['data-agent-place'],'');assert.equal(api.agenteIr('inicio'),false);
 }finally{for(const[k,v]of saved){if(v===undefined)delete global[k];else global[k]=v;}}
});
