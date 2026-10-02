'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../os/access-policy.js');
const source=fs.readFileSync(require.resolve('../os/despacho-section.js'),'utf8');
const app=fs.readFileSync(require.resolve('../os/app.js'),'utf8');
const PRIVATE_URL='https://yod-despacho-revision-bloque-1.sayri-fraijo.chatgpt.site/';
function node(){
  const attrs=new Map(),listeners={},classes=new Set();
  return {hidden:false,children:[],textContent:'',contentWindow:{},
    classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);},contains:k=>classes.has(k)},
    getAttribute:k=>attrs.get(k)||null,setAttribute(k,v){attrs.set(k,v);},removeAttribute(k){attrs.delete(k);},
    addEventListener(k,f){listeners[k]=f;},emit(k,e={}){if(listeners[k])listeners[k](e);},
    appendChild(n){n.parent=this;this.children.push(n);},remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  };
}
function harness(hash='#/despacho'){
  const nodes=new Map(['seccionDespacho','despachoCanvas','despachoEstado','despachoAbrir','despachoBandeja'].map(k=>[k,node()]));
  const home=node(),nav=node(),body=node(),frames=[],events={};nav.setAttribute('href','#/despacho');
  let clear=0,revalidations=0;
  const identity={token:'synthetic-A',currentToken:'synthetic-A',epoch:1,ready:false,boards:'DP',role:'vista'};
  const win={location:{hash},addEventListener(k,f){(events[k]||=([])).push(f);}};
  const doc={body,getElementById:k=>nodes.get(k),querySelector:()=>home,querySelectorAll:()=>[nav],createElement(k){assert.equal(k,'iframe');const n=node();frames.push(n);return n;}};
  const c=vm.createContext({});vm.runInContext(source,c);
  const section=c.YodDespachoSection.create({window:win,document:doc,
    readAccess:()=>({ready:identity.ready&&identity.token===identity.currentToken,allowed:globalThis.YodAccessPolicy.canOpen(identity.boards,'SYS-DESPACHO',identity.role),epoch:identity.epoch}),
    onTeardown(){clear++;},revalidate(){identity.ready=false;revalidations++;section.refresh();}
  });
  function event(k,e={}){for(const f of events[k]||[])f(e);}
  function route(hash){win.location.hash=hash;event('hashchange');}
  return {section,identity,nodes,body,home,nav,frames,event,route,get clear(){return clear;},get revalidations(){return revalidations;}};
}
test('Cold Despacho route and unconfirmed cached DP never load a private frame',()=>{
  const h=harness();assert.equal(h.frames.length,0);assert.equal(h.section.getIframeWindow(),null);
  h.section.refresh();assert.equal(h.frames.length,0);assert.equal(h.nodes.get('despachoAbrir').hidden,true);
  h.identity.ready=true;h.section.refresh();assert.equal(h.frames.length,1);
  assert.equal(h.frames[0].getAttribute('src'),PRIVATE_URL);
  assert.equal(h.frames[0].getAttribute('referrerpolicy'),'no-referrer');
  assert.equal(h.nodes.get('despachoAbrir').href,PRIVATE_URL);
});
test('DP policy matches the existing contract; absent DP denied, admin and star preserved',()=>{
  for(const [boards,role,allowed] of [['TA','vista',false],['','vista',false],['DP','vista',true],['*','vista',true],['','admin',true]]){
    const h=harness();Object.assign(h.identity,{ready:true,boards,role});h.section.refresh();
    assert.equal(h.frames.length,allowed?1:0);assert.equal(h.section.isAuthorized(),allowed);
  }
});
test('Exact route only; leaving and re-entering replaces WindowProxy and preserves home state',()=>{
  const h=harness();h.identity.ready=true;h.section.refresh();const first=h.frames[0];
  assert.equal(h.nav.classList.contains('activo'),true);
  h.route('#/embudo/sala');assert.equal(h.section.getIframeWindow(),null);assert.equal(first.getAttribute('src'),null);
  assert.equal(h.nodes.get('despachoCanvas').children.length,0);assert.equal(h.body.getAttribute('data-workspace-route'),null);
  h.route('#/despacho');assert.equal(h.frames.length,2);assert.notEqual(h.section.getIframeWindow(),first.contentWindow);
  for(const route of ['#/despacho/','#/despacho?token=synthetic','#inicio']){h.route(route);assert.equal(h.section.getIframeWindow(),null);}
});
test('Despacho repaint preserves Embudo navigation and Inicio authorization visibility',()=>{
  const h=harness('#/embudo/sala');h.nav.setAttribute('href','#/embudo/sala');h.nav.classList.toggle('activo',true);
  h.home.hidden=true;h.home.classList.toggle('activo-no',true);h.section.refresh();
  assert.equal(h.nav.classList.contains('activo'),true);assert.equal(h.home.classList.contains('activo-no'),true);assert.equal(h.home.hidden,true);
});
test('Session change and DP revocation immediately invalidate getter and tear down loaded frame',()=>{
  const h=harness();h.identity.ready=true;h.section.refresh();const first=h.frames[0];
  h.identity.currentToken='synthetic-B';assert.equal(h.section.isAuthorized(),false);assert.equal(h.section.getIframeWindow(),null);
  h.section.refresh();assert.equal(first.getAttribute('src'),null);assert.equal(h.nodes.get('despachoCanvas').children.length,0);
  Object.assign(h.identity,{token:'synthetic-B',ready:true,epoch:2});h.section.refresh();const second=h.frames[1];
  h.identity.boards='TA';h.section.refresh();assert.equal(second.getAttribute('src'),null);assert.equal(h.section.getIframeWindow(),null);
  assert.equal(h.nodes.get('despachoBandeja').hidden,true);assert.equal(h.nodes.get('despachoAbrir').getAttribute('href'),null);
});
test('Revalidation and epoch changes retire frames; old load event cannot affect new mount',()=>{
  const h=harness();h.identity.ready=true;h.section.refresh();const first=h.frames[0];
  h.identity.epoch++;h.section.refresh();assert.equal(h.frames.length,2);assert.equal(first.getAttribute('src'),null);
  first.emit('load');assert.equal(h.nodes.get('despachoEstado').hidden,false);
  h.frames[1].emit('load');assert.equal(h.nodes.get('despachoEstado').hidden,true);
  h.identity.ready=false;h.section.refresh();assert.equal(h.nodes.get('despachoCanvas').children.length,0);
});
test('A visible outbound action checks current access again at the human click',()=>{
  const h=harness();h.identity.ready=true;h.section.refresh();h.identity.currentToken='synthetic-B';let blocked=0;
  h.nodes.get('despachoAbrir').emit('click',{preventDefault(){blocked++;}});
  assert.equal(blocked,1);assert.equal(h.nodes.get('despachoCanvas').children.length,0);assert.equal(h.nodes.get('despachoAbrir').hidden,true);
});
test('bfcache freezes with no private frame, and restoration requires a fresh identity check',()=>{
  const h=harness();h.identity.ready=true;h.section.refresh();h.event('pagehide');
  assert.equal(h.section.isAuthorized(),false);assert.equal(h.section.getIframeWindow(),null);
  h.event('pageshow',{persisted:true});assert.equal(h.revalidations,1);assert.equal(h.frames.length,1);
  h.identity.ready=true;h.section.refresh();assert.equal(h.frames.length,2);
});
test('Production session purge invokes teardown before reload and blocking invokes fresh access painter',()=>{
  function fn(name){const start=app.indexOf('  function '+name+'('),tail=app.slice(start);assert.ok(start>=0);if(tail.split('\n')[0].endsWith('}'))return tail.split('\n')[0];const end=/^  }\s*$/m.exec(tail);return tail.slice(0,end.index+end[0].length);}
  const order=[],state={sesionEpoch:0},c=vm.createContext({state,SENSITIVE_CACHES:[],LLAVES_SALA:[],TOKEN_KEY:'pyod_clave_v1',
    window:{cerrarDespachoPrivado:()=>order.push('teardown')},localStorage:{removeItem(){}},sessionStorage:{removeItem(){}},location:{reload:()=>order.push('reload')}});
  vm.runInContext(fn('purgarDatosSensibles')+'\n'+fn('cerrarSesion'),c);c.cerrarSesion();assert.deepEqual(order,['teardown','reload']);
  assert.match(app,/if\(window\.revisarPuertaDespacho\)window\.revisarPuertaDespacho\(\);/);
});
test('Private section transports no credentials; CSS hides Inicio without mutating authorization state',()=>{
  assert.doesNotMatch(source,/localStorage|sessionStorage|postMessage|encodeURIComponent|URLSearchParams|tokenActual/);
  assert.equal((source.match(/https:\/\//g)||[]).length,1);assert.doesNotMatch(source,/PRIVATE_URL\s*\+/);
  const html=fs.readFileSync(require.resolve('../os/index.html'),'utf8'),css=fs.readFileSync(require.resolve('../os/styles.css'),'utf8');
  assert.match(css,/body\[data-workspace-route="despacho"\] \.content > :not\(#seccionDespacho\)/);
  assert.match(html,/id="despachoBandeja" href="https:\/\/yodesarrollomx\.github\.io\/yod-despacho\/"/);
  assert.match(html,/despacho:'El Despacho'/);
});
