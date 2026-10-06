'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const bridgeSource = fs.readFileSync(require.resolve('../os/despacho-chinches.js'),'utf8');
const chincheSource = fs.readFileSync(require.resolve('../chinche.js'),'utf8');
const CHILD = 'https://yodesarrollomx.github.io';
const ID = '84a1d4c3-b1a2-4f67-85dc-5d941f3ca900';
function pin(index = 0) {
  return { type:'yod:despacho:pin', version:1, requestId:ID.slice(0,-3)+index.toString(16).padStart(3,'0'),
    target:{ id:'zone:case', zone:'case', kind:'zone', point:[6.1,0.7,-4.2] },
    view:{ position:[8,1.65,-4.45], quaternion:[0,0,0,1], fov:70, mode:'walk' },
    modelVersion:'despacho-v2', viewport:{ width:390, height:844 } };
}
function metadata(message = pin()) { const {target,view,modelVersion,viewport}=message;return {target,view,modelVersion,viewport}; }
function deferred() { let resolve;const promise = new Promise(r=>{resolve=r;});return {promise,resolve}; }
function harness() {
  const listeners = new Map(), posts=[], calls=[], cancelled=[];
  let enabled=true, epoch=1, frame={ postMessage:(payload,origin)=>posts.push({payload,origin}) };
  const window={ location:{origin:CHILD}, addEventListener:(type,fn)=>listeners.set(type,fn), removeEventListener:(type,fn)=>{if(listeners.get(type)===fn)listeners.delete(type);},
    YODChinche:{ anotar:async options=>{calls.push(options);return {cancel:()=>cancelled.push(true)};} } };
  const context=vm.createContext({window});vm.runInContext(bridgeSource,context);
  const api=window.YodDespachoChinches;
  const binding=api.bindDespachoChinches({isAuthorized:()=>enabled,getIframeWindow:()=>frame,getSessionEpoch:()=>epoch});
  const emit=(data,options={})=>listeners.get('message')?.({data,origin:options.origin||CHILD,source:Object.hasOwn(options,'source')?options.source:frame});
  const hello=()=>emit({type:'yod:despacho:hello',version:1});
  return {window,context,api,binding,emit,hello,posts,calls,cancelled,setEnabled:v=>{enabled=v;},setEpoch:v=>{epoch=v;},getFrame:()=>frame,setFrame:v=>{frame=v;}};
}
test('Trusted hello returns only protocol metadata; other origin/window/auth receives no ready',async()=>{
  const h=harness();await h.hello();assert.deepEqual(JSON.parse(JSON.stringify(h.posts)),[{payload:{type:'yod:despacho:ready',version:1},origin:CHILD}]);
  h.posts.length=0;
  await h.emit({type:'yod:despacho:hello',version:1},{origin:'https://forged.invalid'});
  await h.emit({type:'yod:despacho:hello',version:1},{origin:'https://yod-despacho-revision-bloque-1.sayri-fraijo.chatgpt.site'});
  await h.emit({type:'yod:despacho:hello',version:1},{source:{postMessage(){throw Error('forged');}}});
  await h.emit({type:'yod:despacho:hello',version:1,token:'synthetic-secret'});
  h.setEnabled(false);await h.hello();assert.equal(h.posts.length,0);
});
test('Bridge follows the portal origin without a wildcard or a remote ChatGPT site',async()=>{
  const listeners=new Map(),posts=[],frame={postMessage:(payload,origin)=>posts.push({payload,origin})};
  const window={location:{origin:'http://localhost:8787'},addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener(){}};
  vm.runInContext(bridgeSource,vm.createContext({window}));
  window.YodDespachoChinches.bindDespachoChinches({isAuthorized:()=>true,getIframeWindow:()=>frame});
  await listeners.get('message')({data:{type:'yod:despacho:hello',version:1},origin:'http://localhost:8787',source:frame});
  assert.equal(posts.length,1);assert.equal(posts[0].origin,'http://localhost:8787');
  assert.doesNotMatch(bridgeSource,/chatgpt\.site|postMessage\([^\n]*['"]\*['"]/);
});
test('Strict schema rejects private fields, mismatched IDs, malformed geometry and oversized values',()=>{
  const h=harness();assert.equal(h.api.validPin(pin()),true);
  const variations=[
    p=>{p.case_id='synthetic-private';},p=>{p.token='synthetic-secret';},p=>{p.text='human text';},p=>{p.url='https://private.invalid';},p=>{p.screenshot='data:private';},
    p=>{p.target.name='synthetic-person';},p=>{p.target.id='zone:editing';},p=>{p.target.zone='unknown';},p=>{p.target.point[0]=251;},p=>{p.target.point[0]=NaN;},p=>{p.target.point=new Array(3);},
    p=>{p.target.kind='interface';},p=>{p.view.extra=true;},p=>{p.view.position[2]=Infinity;},p=>{p.view.quaternion=[0,0,0,0];},p=>{p.view.quaternion[3]=1.1;},p=>{p.view.fov=179;},p=>{p.view.mode='script';},
    p=>{p.modelVersion='https://private.invalid';},p=>{p.viewport.width=10001;},p=>{p.viewport.height=0;},p=>{p.viewport.width=390.5;},p=>{p.viewport.device='private';},p=>{p.version=2;},p=>{p.requestId='not-a-uuid';}
  ];
  for(const mutate of variations){const value=pin();mutate(value);assert.equal(h.api.validPin(value),false,mutate.toString());}
  const ui=pin();ui.target={id:'panel:case',zone:'case',kind:'interface',point:null};assert.equal(h.api.validPin(ui),true);
});
test('Pin opens the existing composer without submission; duplicate ACK never reopens',async()=>{
  const h=harness();await h.hello();await h.emit(pin());
  assert.equal(h.calls.length,1);const op=h.calls[0];assert.equal(op.sinCaptura,true);assert.equal(op.puedeGuardar(),true);assert.equal(op.clase,'despacho3d');
  assert.equal(op.objeto.id,'zone:case');assert.equal(op.objeto.tipo,'despacho3d');assert.equal(op.objeto.despacho3d.target.point[0],6.1);
  assert.equal(h.posts.at(-1).payload.status,'composer_opened');
  assert.deepEqual(Object.keys(h.posts.at(-1).payload).sort(),['requestId','status','type','version']);
  await h.emit(pin());assert.equal(h.calls.length,1);assert.equal(h.posts.at(-1).payload.status,'composer_opened');
  const upper=pin();upper.requestId=upper.requestId.toUpperCase();await h.emit(upper);assert.equal(h.calls.length,1);
  assert.equal(JSON.stringify(h.posts).includes('private'),false);
});
test('UI v2 pin identifies a card/control without copying its private text and preserves v1 geometry',async()=>{
  const h=harness(),p=pin();p.version=2;
  p.target={id:'panel:case',zone:'case',kind:'interface',point:null,ui:{surface:'tasks',path:'html:nth-of-type(1) > body:nth-of-type(1) > article:nth-of-type(2) > button:nth-of-type(1)',item:1}};
  assert.equal(h.api.validPin(p),true);await h.hello();await h.emit(p);
  const op=h.calls[0];assert.equal(op.sinCaptura,true);assert.equal(op.sinFolio,true);assert.equal(op.sinUrlParams,true);
  assert.match(op.valores.referencia,/superficie=tasks/);assert.match(op.valores.referencia,/tarjeta=1/);
  assert.equal(op.objeto.despacho3d.target.ui.path,p.target.ui.path);
  for(const mutate of [x=>x.target.ui.text='private',x=>x.target.ui.case_id='private',x=>x.target.ui.surface='unknown',x=>x.target.ui.path='article#private-person',x=>x.target.ui.path='https://private.invalid',x=>x.target.ui.item=-1,x=>x.target.ui.item=10000,x=>x.version=1,x=>x.target.kind='zone']){
    const bad=JSON.parse(JSON.stringify(p));mutate(bad);assert.equal(h.api.validPin(bad),false,mutate.toString());
  }
  const clean=pin(2);assert.equal(h.api.validPin(clean),true);
  const fallback=JSON.parse(JSON.stringify(p));fallback.view={position:null,quaternion:null,fov:null,mode:'map'};
  assert.equal(h.api.validPin(fallback),true);assert.match(h.api.formatContext(metadata(fallback)),/camara=null/);
  fallback.view.position=[0,0,0];assert.equal(h.api.validPin(fallback),false,'No fictitious camera in fallback');
  const badWorld=pin();badWorld.view={position:null,quaternion:null,fov:null,mode:'map'};assert.equal(h.api.validPin(badWorld),false);
});
test('Forged, unready, unauthorized, invalid and old-frame pins never open a composer',async()=>{
  const h=harness();await h.emit(pin());assert.equal(h.posts.at(-1).payload.status,'rejected');assert.equal(h.calls.length,0);
  await h.hello();const old=h.getFrame();h.setFrame({postMessage(){}});await h.emit(pin(),{source:old});assert.equal(h.calls.length,0);
  h.setFrame(old);h.setEnabled(false);await h.emit(pin());assert.equal(h.calls.length,0);
  h.setEnabled(true);const invalid=pin();invalid.target.token='synthetic';await h.emit(invalid);assert.equal(h.calls.length,0);
});
test('Clear closes own composers and invalidates old guards; epoch changes also fail closed',async()=>{
  const h=harness();await h.hello();await h.emit(pin());const guard=h.calls[0].puedeGuardar;
  h.setEpoch(2);assert.equal(guard(),false);await h.emit(pin(1));assert.equal(h.calls.length,1);
  h.binding.clear();assert.equal(h.cancelled.length,1);assert.equal(h.posts.at(-1).payload.type,'yod:despacho:disabled');
  await h.emit(pin(2));assert.equal(h.calls.length,1);
  await h.hello();await h.emit(pin(2));assert.equal(h.calls.length,2);assert.equal(guard(),false);
  h.binding.dispose();assert.equal(await h.emit(pin(3)),undefined);
});
test('Composer resolving after teardown is cancelled and not acknowledged as opened',async()=>{
  const h=harness(), wait=deferred();let cancelled=0;h.window.YODChinche.anotar=()=>wait.promise;
  await h.hello();const request=h.emit(pin());h.binding.clear();wait.resolve({cancel(){cancelled++;}});await request;
  assert.equal(cancelled,1);assert.equal(h.posts.some(p=>p.payload.status==='composer_opened'),false);
});
test('Unavailable composer and bounded dedupe do not accumulate unlimited requests',async()=>{
  const h=harness();await h.hello();h.window.YODChinche=null;await h.emit(pin());assert.equal(h.posts.at(-1).payload.status,'unavailable');
  h.window.YODChinche={anotar:async op=>{h.calls.push(op);return {cancel(){}};}};
  await h.emit(pin());assert.equal(h.calls.length,0);
  for(let index=1;index<=200;index++)await h.emit(pin(index));assert.equal(h.calls.length,199);assert.equal(h.posts.at(-1).payload.status,'rejected');
});
function chincheHarness() {
  const h=harness(), nodes=new Map(), saved=[], notices=[], requests=[], marked=[], closed=[];
  delete h.window.YODChinche;
  let authorized=true, databaseWait=null;
  function node(key){if(!nodes.has(key))nodes.set(key,{value:'',disabled:false,textContent:'',placeholder:'',remove(){this.removed=true;},focus(){},classList:{add(){},remove(){}}});return nodes.get(key);}
  const composer={_urls:[],querySelector:node,querySelectorAll:()=>[]};
  h.context.console=console;h.context.AbortController=AbortController;
  h.context.localStorage={getItem:()=>null};h.context.sessionStorage={getItem:()=>null};
  h.context.location={href:'https://example.invalid/os/#/despacho'};h.context.navigator={userAgent:'synthetic'};
  h.context.setTimeout=()=>1;h.context.clearTimeout=()=>{};
  h.context.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,text:async()=>'{}'};};
  const injected=`
  window.__chincheTest={
    codigoDespacho,guardDespacho,enviarDirecto,guardar,armarTexto,
    register:(id,guard)=>despachoGuards.set(id,guard),
    setDatabaseWait:fn=>{abrirBD=fn;},
    setTransaction:fn=>{tx=fn;},
    setRows:rows=>{todas=async()=>rows;foto=async()=>null;},
    setup:hooks=>{
      hoja=()=>hooks.composer;cerrar=v=>hooks.closed.push(v);aviso=t=>hooks.notices.push(t);dictado=()=>{};
      tarjetaContexto=()=>{throw Error('3D must not generate a context image');};
      quien=()=>"Synthetic user";aparato=()=>"synthetic";folioActual=()=>"";repoActual=()=>"yod-portal";
      llaveOS=()=>"synthetic-secret";leerN=()=>0;marcar=async(...args)=>hooks.marked.push(args);
      db={};guardar=async ch=>{if(!guardDespacho(ch))throw Error('expired');hooks.saved.push(ch);if(hooks.wait)await hooks.wait;};
    }
  };
`;
  const position=chincheSource.lastIndexOf('})();');
  vm.runInContext(chincheSource.slice(0,position)+injected+chincheSource.slice(position),h.context);
  const hooks={composer,saved,notices,closed,marked};h.window.__chincheTest.setup(hooks);
  function options(){return {clase:'despacho3d',seccion:'Despacho3D',texto:'Zona case',vista:'3D',sinCaptura:true,
    puedeGuardar:()=>authorized,objeto:{id:'zone:case',tipo:'despacho3d',zona:'case',despacho3d:metadata()},valores:{referencia:'technical'},codigo:'https://must-not-copy.invalid'};}
  return {...h,nodes,node,composer,saved,notices,requests,marked,closed,hooks,options,setAuthorized:v=>{authorized=v;},helper:h.window.__chincheTest};
}
test('Real composer has no POST when opened; human Clavar alone persists validated code then sends',async()=>{
  const h=chincheHarness();const controller=await h.window.YODChinche.anotar(h.options());assert.equal(typeof controller.cancel,'function');
  assert.equal(h.requests.length,0);assert.equal(h.saved.length,0);assert.equal(h.node('.chn-foto').removed,true);
  h.node('.chn-txt').value='Synthetic human request';await h.node('[data-ok]').onclick();await Promise.resolve();
  assert.equal(h.saved.length,1);assert.equal(h.requests.length,1);assert.equal(h.requests[0].options.method,'POST');
  assert.ok(h.saved[0].codigo.includes('punto=[6.1,0.7,-4.2]'));assert.ok(h.saved[0].codigo.includes('quaternion=[0,0,0,1]'));
  assert.equal(h.saved[0].codigo.includes('must-not-copy'),false);assert.equal(Object.values(h.saved[0]).some(v=>typeof v==='function'),false);
  const payload=JSON.parse(h.requests[0].options.body), detail=JSON.parse(payload.detalle);
  assert.equal(payload.accion,'produccion');assert.equal(detail.codigo,h.saved[0].codigo);assert.equal(detail.objeto.despacho3d.modelVersion,'despacho-v2');
});
test('Stale composer cannot Clavar and stale awaits cannot POST under a new session',async()=>{
  const h=chincheHarness();await h.window.YODChinche.anotar(h.options());h.setAuthorized(false);h.node('.chn-txt').value='Old draft';await h.node('[data-ok]').onclick();
  assert.equal(h.saved.length,0);assert.equal(h.requests.length,0);
  const later=chincheHarness(),wait=deferred();later.hooks.wait=wait.promise;await later.window.YODChinche.anotar(later.options());later.node('.chn-txt').value='Draft submitted before session change';
  const submit=later.node('[data-ok]').onclick();later.setAuthorized(false);wait.resolve();await submit;assert.equal(later.requests.length,0);
});
test('Reloaded or cancelled 3D drafts never auto-POST; legacy drafts retain their existing send path',async()=>{
  const h=chincheHarness(),draft={id:'synthetic-pin',estado:'nueva',objeto:{despacho3d:metadata()}};
  assert.equal(await h.helper.enviarDirecto(draft),false);assert.equal(h.requests.length,0);
  h.helper.register(draft.id,()=>false);assert.equal(await h.helper.enviarDirecto(draft),false);
  const legacy={id:'synthetic-legacy',estado:'nueva',texto:'legacy',repo:'yod-portal',pantalla:'os'};
  assert.equal(await h.helper.enviarDirecto(legacy),true);assert.equal(h.requests.length,1);
});
test('Local database guard rechecks after the database opens, before starting the write transaction',async()=>{
  const h=chincheHarness(),wait=deferred();let permitted=true,transactions=0;
  h.helper.setDatabaseWait(()=>wait.promise);h.helper.setTransaction(()=>{transactions++;throw Error('must not write');});
  h.helper.register('synthetic-pin',()=>permitted);
  const pending=h.helper.guardar({id:'synthetic-pin',objeto:{despacho3d:metadata()}},null,null);
  permitted=false;wait.resolve();await assert.rejects(pending,/sesión/);assert.equal(transactions,0);
});
test('Manual export preserves validated 3D context for non-canvas notes and rejects arbitrary geometry strings',async()=>{
  const h=chincheHarness();const geometry=h.helper.codigoDespacho(h.options().objeto);assert.ok(geometry.includes('objeto=zone:case'));
  const poisoned=h.options().objeto;poisoned.despacho3d.token='synthetic-secret';assert.equal(h.helper.codigoDespacho(poisoned),'');
  h.helper.setRows([{id:'synthetic-export',modo:'contexto',pantalla:'os',repo:'yod-portal',url:'https://example.invalid/os/',texto:'Human request',objeto:h.options().objeto,
    elemento:{seccion:'Despacho3D',texto:'Zona case'},codigo:geometry,aparato:'synthetic',sello:'synthetic',creado:'2026-01-01'}]);
  const result=await h.helper.armarTexto(['synthetic-export'],'');assert.ok(result.texto.includes('Contexto geométrico del Despacho'));assert.ok(result.texto.includes('camara=[8,1.65,-4.45]'));assert.ok(result.texto.includes('viewport=390x844'));
});
