'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const appSource = fs.readFileSync(require.resolve('../os/app.js'), 'utf8');
const shellSource = fs.readFileSync(require.resolve('../os/shell.js'), 'utf8');

// Ejecutar funciones de producción con dependencias simuladas: ninguna petición real.
function fn(source, name) {
  const re = new RegExp('^  (?:async )?function ' + name + '\\(', 'm');
  const match = re.exec(source);assert.ok(match, name + ' existe');
  const rest = source.slice(match.index), line = rest.slice(0, rest.indexOf('\n'));
  if (line.endsWith('}')) return line;
  const end = /^  }\s*$/m.exec(rest);
  assert.ok(end, name + ' tiene cierre');
  return rest.slice(0, end.index + end[0].length);
}
function store(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: k => data.get(k) || null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k) };
}
function deferred() { let resolve, reject;const promise = new Promise((a, b) => { resolve = a;reject = b; });return { promise, resolve, reject }; }
function element() {
  return { textContent: '', innerHTML: '', hidden: false, style: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    replaceChildren() { this.children = [];this.innerHTML = ''; },
    setAttribute() {}, removeAttribute() {}, appendChild(x) { this.children.push(x); }, querySelector() { return null; } };
}
function appHarness(token = 'prefix-shared--A') {
  const nodes = new Map(), applied = [], loads = [], renders = [], timers = [];
  const node = id => { if (!nodes.has(id)) nodes.set(id, element());return nodes.get(id); };
  const localStorage = store({ pyod_clave_v1: token, yod_pulse_v1: JSON.stringify({ finance: { summary: { balance: 98765 } } }), 'aurum-cache-v5': '[{"nombre":"synthetic previous person"}]' });
  const sessionStorage = store({ yod_id_v1: JSON.stringify({ ok: true, rol: 'admin', boards: '*', f: token.slice(0, 14), nombre: 'Previous' }) });
  const state = { modules: [], rawRows: [], role: 'vista', boards: '', profileReady: false, allTasks: [], sesionEpoch: 0, sessionToken: '', identityRequest: 0, pulseCache: {}, opsCache: null };
  const c = vm.createContext({
    state, localStorage, sessionStorage, TOKEN_KEY: 'pyod_clave_v1', SENSITIVE_CACHES: ['aurum-cache-v5','yod_ops_me','yod_pulse_v1','yod_portal_cat_v1','codeyod-cache-v1'],
    $: node, document: { querySelectorAll: () => [], createElement: () => element() }, window: {},
    console: { warn() {}, log() {}, info() {} }, location: { reload() { loads.push('reload'); } },
    REINTENTOS_MAX: 3, REINTENTO_MS: 15000, setTimeout(f) { timers.push(f); },
    renderOperationsSinSesion() { node('operation-panel').replaceChildren(); }, tableroSinSesion() {}, renderModules() {},
    setConnection() {}, frasePendiente: x => x,
    applyIdentity(data) { state.profileReady = true;state.role = data.rol;state.boards = data.boards;applied.push(data.nombre); },
    loadCatalog: async () => { loads.push('catalog'); }, startData: async t => { loads.push(t); },
    canjearConRelevo_: async t => ({ ok: true, token:t, rol: 'vista', boards: 'TA', nombre: 'Current' }),
    renderFinance: x => renders.push(['finance', x]), renderMarketing: x => renders.push(['marketing', x]),
    renderPulseError: id => renders.push(['error', id]), marcaNuevo() {}, marcarCache() {}, marcarCacheFallo: id => renders.push(['offline', id]),
    sinSaldo: () => false, sinKpis: () => false,
    renderOpsScoped: (...args) => renders.push(['operations', ...args]), renderDecisions: (...args) => renders.push(['decisions', ...args]), loadReconcile() {}
  });
  const names = ['tokenActual','rechazoAcceso','mismaSesion','purgarDatosSensibles','bloquearSesion','pulseCacheRead','pulseCacheWrite','loadIdentity','loadFinance','loadMarketing','loadOperations','catalogoSinAcceso'];
  vm.runInContext(names.map(n => fn(appSource, n)).join('\n'), c);
  function authorize() { state.profileReady = true;state.sessionToken = localStorage.getItem('pyod_clave_v1');state.role = 'admin';state.boards = '*'; }
  return { c, state, applied, loads, renders, timers, nodes, node, localStorage, sessionStorage, authorize };
}

test('App no aplica admin legacy ni inicia datos antes del canje fresco', async () => {
  const h = appHarness(), pending = deferred();h.c.canjearConRelevo_ = () => pending.promise;
  const loading = h.c.loadIdentity();
  assert.equal(h.state.profileReady, false);
  assert.equal(h.applied.length, 0);assert.equal(h.loads.length, 0);
  assert.equal(h.sessionStorage.getItem('yod_id_v1'), null);
  pending.resolve({ ok: true, token:'prefix-shared--A', rol: 'vista', boards: 'TA', nombre: 'New person' });await loading;
  assert.deepEqual(h.applied, ['New person']);assert.equal(h.state.role, 'vista');
});

test('Dos credenciales con los primeros 14 caracteres iguales no comparten identidad', async () => {
  const h = appHarness('prefix-shared--B');
  await h.c.loadIdentity();
  assert.deepEqual(h.applied, ['Current']);assert.equal(h.state.role, 'vista');
  assert.equal(h.sessionStorage.getItem('yod_id_v1'), null);
});

test('App ignora canje tardío de A después de validar B', async () => {
  const h = appHarness('A'), a = deferred(), b = deferred();
  h.c.canjearConRelevo_ = token => token === 'A' ? a.promise : b.promise;
  const first = h.c.loadIdentity();h.localStorage.setItem('pyod_clave_v1','B');const second = h.c.loadIdentity();
  b.resolve({ ok: true, token:'B', rol: 'vista', boards: 'TA', nombre: 'B' });await second;
  a.resolve({ ok: true, token:'A', rol: 'admin', boards: '*', nombre: 'A' });await first;
  assert.deepEqual(h.applied, ['B']);assert.equal(h.state.sessionToken, 'B');
});

test('App ignora canje después de quitar credencial, aun sin evento storage', async () => {
  const h = appHarness(), pending = deferred();h.c.canjearConRelevo_ = () => pending.promise;
  const loading = h.c.loadIdentity();h.localStorage.removeItem('pyod_clave_v1');
  pending.resolve({ ok: true, rol: 'admin', boards: '*', nombre: 'Old' });await loading;
  assert.equal(h.state.profileReady, false);assert.deepEqual(h.applied, []);
});

test('Revocación limpia paneles y memoria desde el primer rechazo', async () => {
  const h = appHarness();h.authorize();h.state.pulseCache.finance = { summary: { balance: 100 }, ep: 0 };h.node('finance-panel').innerHTML = 'previous';
  h.c.canjearConRelevo_ = async () => ({ ok: false, error: 'revocado' });
  await h.c.loadIdentity();
  assert.equal(h.state.profileReady, false);assert.equal(h.node('finance-panel').innerHTML, '');
  assert.equal(Object.keys(h.state.pulseCache).length, 0);assert.deepEqual(h.loads, []);
  assert.ok(h.localStorage.getItem('pyod_clave_v1'), 'no altera política del token tras primer rechazo');
});

test('Sin conexión al Portero no se autoriza mediante identidad legacy', async () => {
  const h = appHarness();h.c.canjearConRelevo_ = async () => null;
  await h.c.loadIdentity();assert.equal(h.state.profileReady, false);assert.equal(h.loads.length, 0);assert.equal(h.timers.length, 1);
});

test('Finanzas ignora respuesta tardía de una credencial anterior sin cachearla', async () => {
  const h = appHarness('A'), pending = deferred();h.authorize();h.c.window.YodFinance = { load: () => pending.promise };
  const loading = h.c.loadFinance('A');h.localStorage.setItem('pyod_clave_v1','B');
  pending.resolve({ summary: { balance: 100 } });await loading;
  assert.equal(h.renders.length, 0);assert.equal(Object.keys(h.state.pulseCache).length, 0);
});

for (const [name, api] of [['Finance','YodFinance'],['Marketing','YodMarketing']]) {
  test(name + ': offline conserva solo memoria de la misma sesión; rechazo la descarta', async () => {
    const h = appHarness();h.authorize();const key = name.toLowerCase();
    h.c.pulseCacheWrite(key, { value: 100 }, h.state.sessionToken);
    h.c.window[api] = { load: async () => { throw new Error('offline'); } };
    await h.c['load' + name](h.state.sessionToken);
    assert.ok(h.renders.some(r => r[0] === 'offline'));
    h.c.window[api].load = async () => { throw new Error('liga'); };
    await h.c['load' + name](h.state.sessionToken);
    assert.equal(h.state.pulseCache[key], undefined);assert.equal(h.renders.at(-1)[0], 'error');
  });
}

test('Operación rechaza resultado cache de adaptador legacy y borra datos tras rechazo', async () => {
  const h = appHarness();h.authorize();h.c.window.YodOperations = { load: async () => ({ source: 'cache', diag: 'liga', tasks: [{ nombre: 'Previous' }] }) };
  h.state.opsCache = { tasks: [{ nombre: 'Current' }], ep: h.state.sesionEpoch, updatedAt: new Date() };
  await h.c.loadOperations(h.state.sessionToken);
  assert.equal(h.state.allTasks.length, 0);assert.equal(h.state.opsCache, null);
  assert.equal(h.renders.at(-1)[0], 'error');
});

test('Adaptador Operations no lee ni escribe almacenamiento y propaga rechazo', async () => {
  const source = fs.readFileSync(require.resolve('../os/adapters/operations.js'),'utf8');let accesses = 0;
  const c = vm.createContext({
    localStorage: { getItem() { accesses++;return '[{"responsable":"Previous"}]'; }, setItem() { accesses++; } },
    fetch: async () => ({ ok: true, text: async () => JSON.stringify({ ok: false, error: 'revocado' }) })
  });vm.runInContext(source,c);
  await assert.rejects(c.YodOperations.load('synthetic'), /revocado/);assert.equal(accesses,0);
  c.fetch = async () => ({ ok: true, text: async () => JSON.stringify({ ok: true, tasks: [] }) });
  assert.equal((await c.YodOperations.load('synthetic')).source,'live');assert.equal(accesses,0);
});

for (const [name, source, functionName] of [['app',appSource,'canjearConRelevo_'],['shell',shellSource,'canjeConRelevo']]) {
  test(name + ': un rechazo explícito no se reintenta con el respaldo', async () => {
    const calls = [], response = { ok: false, error: 'revocado' };
    const c = vm.createContext({
      ACCESO_LISTO: Promise.resolve(), window: { YOD_PORTERO: { original: 'original', respaldo: 'respaldo' } },
      PORTERO_ORIGINAL: 'original', PORTERO_RESPALDO: 'respaldo', conLimite_: p => p,
      fetch: async url => { calls.push(url);return { ok: true, status: 200, text: async () => JSON.stringify(response), json: async () => response }; }
    });vm.runInContext(fn(source,'rechazoAcceso')+'\n'+fn(source,functionName),c);
    assert.equal((await c[functionName]('synthetic')).error,'revocado');assert.equal(calls.length,1);
  });
  test(name + ': caída de transporte sí permite el respaldo', async () => {
    const calls = [], response = { ok: true, rol: 'vista', boards: 'TA' };
    const c = vm.createContext({
      ACCESO_LISTO: Promise.resolve(), window: { YOD_PORTERO: { original: 'original', respaldo: 'respaldo' } },
      PORTERO_ORIGINAL: 'original', PORTERO_RESPALDO: 'respaldo', conLimite_: p => p,
      fetch: async url => { calls.push(url);if(url.startsWith('original'))throw new Error('offline');return { ok: true, text: async () => JSON.stringify(response), json: async () => response }; }
    });vm.runInContext(fn(source,'rechazoAcceso')+'\n'+fn(source,functionName),c);
    assert.equal((await c[functionName]('synthetic')).ok,true);assert.equal(calls.length,2);
  });
}

function shellHarness(token = 'A') {
  const nodes = new Map(), canvas = element(), main = element(), applied = [], reloads = [];
  const node = id => { if(!nodes.has(id))nodes.set(id,element());return nodes.get(id); };
  const localStorage=store({pyod_clave_v1:token}),sessionStorage=store({yod_id_v1:'{"rol":"admin","boards":"*"}'});
  const state={role:'',boards:'',modules:[],identity:'pending',catalogRows:null,catalogIds:null,identityRequest:0,sessionToken:'',sessionIdentity:''};
  const c=vm.createContext({
    state,localStorage,sessionStorage,LSC:'pyod_clave_v1',CATCACHE:'yod_portal_cat_v1',CATIDS:'yod_portal_cat_ids_v1',DATA_CACHES:{'SYS-TAREAS':['aurum-cache-v5']},
    NAME:{'SYS-TAREAS':'MOAC'},OS:'https://example.invalid/os',currentSys:()=> 'SYS-TAREAS',
    document:{getElementById:node,querySelector:s=>s==='.yod-canvas'?canvas:main},el:()=>element(),esc:String,
    set:(id,value)=>{node(id).textContent=value;},pastilla(){},applyNav(){},
    canOpen:()=>state.identity==='ok'&&(state.boards==='TA'||state.role==='admin'),
    location:{reload(){reloads.push(true);}},
    aplicaIdentidad(j){state.role=j.rol;state.boards=j.boards;state.identity='ok';applied.push(j.nombre);c.maybeLock();},
    loadCatalog:async()=>{},canjeConRelevo:async t=>({ok:true,token:t,rol:'vista',boards:'TA',nombre:'Current'})
  });
  vm.runInContext(['tok','purgeCaches','purgeAll','maybeLock','loadIdentity'].map(n=>fn(shellSource,n)).join('\n'),c);
  return {c,state,localStorage,sessionStorage,applied,canvas,reloads};
}

test('Shell oculta lienzo mientras valida y no toma rol de yod_id_v1',async()=>{
  const h=shellHarness(),pending=deferred();h.c.canjeConRelevo=()=>pending.promise;
  const loading=h.c.loadIdentity();assert.equal(h.canvas.style.display,'none');assert.equal(h.applied.length,0);
  assert.equal(h.sessionStorage.getItem('yod_id_v1'),null);
  pending.resolve({ok:true,token:'A',rol:'vista',boards:'TA',nombre:'Current'});await loading;
  assert.equal(h.state.role,'vista');assert.equal(h.canvas.style.display,'');
});

test('Shell conserva lienzo oculto después de revocación y sin token',async()=>{
  const h=shellHarness();h.c.canjeConRelevo=async()=>({ok:false,error:'revocado'});
  await h.c.loadIdentity();assert.equal(h.canvas.style.display,'none');assert.equal(h.state.identity,'fail');
  h.localStorage.removeItem('pyod_clave_v1');await h.c.loadIdentity();assert.equal(h.canvas.style.display,'none');
});

test('Shell ignora canje de A recibido después de validar B',async()=>{
  const h=shellHarness(),a=deferred(),b=deferred();h.c.canjeConRelevo=t=>t==='A'?a.promise:b.promise;
  const first=h.c.loadIdentity();h.localStorage.setItem('pyod_clave_v1','B');const second=h.c.loadIdentity();
  b.resolve({ok:true,token:'B',rol:'vista',boards:'TA',nombre:'B'});await second;
  a.resolve({ok:true,token:'A',rol:'admin',boards:'*',nombre:'A'});await first;
  assert.deepEqual(h.applied,['B']);assert.equal(h.state.role,'vista');
});

test('Shell recarga board con estado propio tras cambiar persona o permisos',async()=>{
  const h=shellHarness();await h.c.loadIdentity();h.localStorage.setItem('pyod_clave_v1','B');
  await h.c.loadIdentity();assert.equal(h.reloads.length,1);assert.equal(h.canvas.style.display,'none');
  const same=shellHarness();await same.c.loadIdentity();
  same.c.canjeConRelevo=async()=>({ok:true,token:'A',rol:'vista',boards:'TA,IN',nombre:'Changed'});
  await same.c.loadIdentity();assert.equal(same.reloads.length,1);assert.equal(same.canvas.style.display,'none');
});

test('Catálogo del app ignora respuesta tardía y no persiste filas de otra credencial',async()=>{
  const h=appHarness('A'),pending=deferred(),rows=[];h.authorize();
  Object.assign(h.c,{AbortController,clearTimeout(){},LIMITE_MS:25000,LIMITE_FRIO_MS:75000,CATALOG_ENDPOINT:'https://example.invalid/catalog',CAT_RESPALDO:[],
    fetch:()=>pending.promise,renderModules:r=>rows.push(r),nombrarAccionesRapidas(){},selloDato:()=>''});
  vm.runInContext(fn(appSource,'loadCatalog'),h.c);
  const loading=h.c.loadCatalog();h.localStorage.setItem('pyod_clave_v1','B');
  pending.resolve({ok:true,json:async()=>({ok:true,actor:'SESSION',rows:[{system_id:'SYNTH-OLD'}]})});await loading;
  assert.equal(rows.length,0);assert.equal(h.localStorage.getItem('yod_portal_cat_v1'),null);
});

test('Catálogo PUBLIC/403 del app descarta filas de esa fuente y conserva sesión Portero y otros datos',async()=>{
  for(const response of [
    {ok:true,status:200,json:async()=>({ok:true,actor:'PUBLIC',rows:[]})},
    {ok:true,status:200,json:async()=>({ok:true,rows:[{system_id:'SYNTH-UNVERIFIED'}]})},
    {ok:true,status:200,json:async()=>({ok:true,actor:'UNKNOWN',rows:[{system_id:'SYNTH-UNVERIFIED'}]})},
    {ok:false,status:403,json:async()=>{throw new Error('no debe interpretar cuerpo 403');}},
    {ok:true,status:200,json:async()=>({ok:false,error:'liga'})}
  ]){
    const h=appHarness(),rows=[];h.authorize();
    h.state.rawRows=[{system_id:'SYNTH-PREVIOUS'}];h.state.pulseCache.finance={summary:{balance:100},ep:0};
    h.node('finance-panel').innerHTML='dato actual independiente';
    const fallback=[{system_id:'SYNTH-STATIC'}];
    Object.assign(h.c,{AbortController,clearTimeout(){},LIMITE_MS:25000,LIMITE_FRIO_MS:75000,CATALOG_ENDPOINT:'https://example.invalid/catalog',CAT_RESPALDO:fallback,
      fetch:async()=>response,renderModules:r=>rows.push(r),nombrarAccionesRapidas(){}});
    vm.runInContext(fn(appSource,'loadCatalog'),h.c);await h.c.loadCatalog();
    assert.equal(h.state.profileReady,true);assert.equal(h.state.sessionToken,h.localStorage.getItem('pyod_clave_v1'));
    assert.equal(h.state.pulseCache.finance.summary.balance,100);assert.equal(h.node('finance-panel').innerHTML,'dato actual independiente');
    assert.equal(h.state.rawRows.length,0);assert.equal(rows.at(-1),fallback);
  }
});

test('Operación ignora resultado de la sesión anterior después de nueva validación',async()=>{
  const h=appHarness('A'),pending=deferred();h.authorize();h.c.window.YodOperations={load:()=>pending.promise};
  const loading=h.c.loadOperations('A');h.localStorage.setItem('pyod_clave_v1','B');
  await h.c.loadIdentity();pending.resolve({source:'live',tasks:[{nombre:'A'}]});await loading;
  assert.equal(h.state.allTasks.length,0);assert.equal(h.state.opsCache,null);
  assert.equal(h.renders.length,0);
});

test('Eventos storage del app revalidan también al borrar token y con sesión ya abierta',async()=>{
  const h=appHarness(),listeners={};h.authorize();
  h.c.addEventListener=(name,callback)=>{listeners[name]=callback;};
  const start=appSource.indexOf("  addEventListener('storage',function(e){");
  const end=appSource.indexOf("  document.addEventListener('click',function(e){",start);
  vm.runInContext(appSource.slice(start,end),h.c);
  h.localStorage.removeItem('pyod_clave_v1');listeners.storage({key:'pyod_clave_v1',newValue:null});
  assert.equal(h.state.profileReady,false);assert.equal(h.state.sessionToken,'');
  h.localStorage.setItem('pyod_clave_v1','B');listeners.storage({key:'pyod_clave_v1',newValue:'B'});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(h.state.sessionToken,'B');
});

test('Catálogo del shell ignora respuesta de identidad invalidada',async()=>{
  const h=shellHarness(),pending=deferred();h.state.identity='ok';
  Object.assign(h.c,{PORTAL:'https://example.invalid/catalog',DEST:{'SYS-TAREAS':'https://example.invalid'},fetch:()=>pending.promise,
    writeCatIds:ids=>{h.state.catalogIds=ids;},writeCatCache:rows=>{h.state.catalogRows=rows;}});
  vm.runInContext(fn(shellSource,'rechazoAcceso')+'\n'+fn(shellSource,'loadCatalog'),h.c);
  const loading=h.c.loadCatalog();h.state.identityRequest++;
  pending.resolve({json:async()=>({ok:true,actor:'SESSION',rows:[{visible:'SI',system_id:'SYS-TAREAS'}]})});await loading;
  assert.equal(h.state.catalogRows,null);assert.equal(h.state.catalogIds,null);
});

test('Catálogo PUBLIC/403 del shell conserva identidad y elimina únicamente su catálogo anterior',async()=>{
  for(const response of [
    {ok:true,status:200,json:async()=>({ok:true,actor:'PUBLIC',rows:[]})},
    {ok:true,status:200,json:async()=>({ok:true,rows:[{system_id:'SYNTH-UNVERIFIED'}]})},
    {ok:true,status:200,json:async()=>({ok:true,actor:'UNKNOWN',rows:[{system_id:'SYNTH-UNVERIFIED'}]})},
    {ok:false,status:403,json:async()=>{throw new Error('no debe interpretar cuerpo 403');}},
    {ok:true,status:200,json:async()=>({ok:false,error:'revocado'})}
  ]){
    const h=shellHarness();h.state.identity='ok';h.state.role='vista';h.state.boards='TA';h.state.sessionToken='A';
    h.state.catalogRows=[{system_id:'SYNTH-PREVIOUS'}];h.state.catalogIds=['SYNTH-PREVIOUS'];h.canvas.style.display='';
    Object.assign(h.c,{PORTAL:'https://example.invalid/catalog',fetch:async()=>response});
    vm.runInContext(fn(shellSource,'rechazoAcceso')+'\n'+fn(shellSource,'loadCatalog'),h.c);await h.c.loadCatalog();
    assert.equal(h.state.identity,'ok');assert.equal(h.state.sessionToken,'A');assert.equal(h.state.boards,'TA');
    assert.equal(h.state.catalogRows,null);assert.equal(h.state.catalogIds,null);assert.equal(h.state.catalogUnavailable,true);
    assert.equal(h.canvas.style.display,'');assert.equal(h.localStorage.getItem('pyod_clave_v1'),'A');
  }
});

test('La cola pendiente de Interiores se conserva al limpiar datos visibles',()=>{
  const data=/  var DATA_CACHES = \{[\s\S]*?\n  \};/.exec(shellSource)[0];
  const h=shellHarness();h.localStorage.setItem('aurum_postq_v1','synthetic pending write');
  vm.runInContext(data,h.c);h.c.purgeAll();
  assert.equal(h.localStorage.getItem('aurum_postq_v1'),'synthetic pending write');
});
test('Canje incompleto o de otra credencial no habilita cabina ni marco',async()=>{
 for(const patch of [{ok:'true'},{token:'B'},{token:null},{rol:''},{rol:null},{boards:null},{boards:undefined}]){
  const reply={ok:true,token:'A',rol:'admin',boards:'*',nombre:'Synthetic',...patch};
  const app=appHarness('A');app.c.canjearConRelevo_=async()=>reply;await app.c.loadIdentity();
  assert.equal(app.state.profileReady,false);assert.equal(app.loads.length,0);
  const sh=shellHarness();sh.c.canjeConRelevo=async()=>reply;await sh.c.loadIdentity();
  assert.equal(sh.state.identity,'fail');assert.equal(sh.canvas.style.display,'none');
 }
});
