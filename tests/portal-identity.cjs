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
  const names = ['tokenActual','rechazoAcceso','mismaSesion','purgarDatosSensibles','bloquearSesion','pulseCacheRead','pulseCacheWrite','loadIdentity','loadIdentityOnce','coordinatedPortalLoad','loadFinance','loadMarketing','loadOperations','catalogoSinAcceso'];
  vm.runInContext(names.map(n => fn(appSource, n)).join('\n'), c);
  function authorize() { state.profileReady = true;state.sessionToken = localStorage.getItem('pyod_clave_v1');state.role = 'admin';state.boards = '*';state.verifiedAt=Date.now(); }
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

test('App: error servidor transitorio reintenta sin borrar la credencial',async()=>{
  const h=appHarness();h.c.canjearConRelevo_=async()=>({ok:false,error:'servidor'});
  await h.c.loadIdentity();assert.equal(h.state.profileReady,false);
  assert.equal(h.localStorage.getItem('pyod_clave_v1'),'prefix-shared--A');
  assert.equal(h.timers.length,1);
  h.c.canjearConRelevo_=async t=>({ok:true,token:t,rol:'vista',boards:'TA',nombre:'Current'});
  h.timers[0]();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.state.profileReady,true);
});

test('App: red caída conserva vista validada cinco minutos, luego la oculta y reintenta',async()=>{
  const h=appHarness();h.authorize();h.c.canjearConRelevo_=async()=>null;
  await h.c.loadIdentity();assert.equal(h.state.profileReady,true);assert.equal(h.timers.length,1);
  h.state.verifiedAt=Date.now()-6*60000;
  await h.c.loadIdentity();assert.equal(h.state.profileReady,false);
  assert.equal(h.localStorage.getItem('pyod_clave_v1'),'prefix-shared--A');
  assert.equal(h.timers.length,2);
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
      PORTERO_ORIGINAL: 'original', PORTERO_RESPALDO: 'respaldo', AbortController:name==='app'?AbortController:undefined,conLimite_: p => p,
      fetch: async url => { calls.push(url);return { ok: true, status: 200, text: async () => JSON.stringify(response), json: async () => response }; }
    });vm.runInContext(fn(source,'rechazoAcceso')+'\n'+fn(source,functionName),c);
    assert.equal((await c[functionName]('synthetic')).error,'revocado');assert.equal(calls.length,1);
  });
  // T-105 (30-oct-2026): el marco ya no salta al respaldo (404 desde el 23-sep); su versión de esta prueba es la de abajo.
  if (name === 'app') test(name + ': caída de transporte sí permite el respaldo', async () => {
    const calls = [], response = { ok: true, rol: 'vista', boards: 'TA' };
    const c = vm.createContext({
      ACCESO_LISTO: Promise.resolve(), window: { YOD_PORTERO: { original: 'original', respaldo: 'respaldo' } },
      PORTERO_ORIGINAL: 'original', PORTERO_RESPALDO: 'respaldo', AbortController:name==='app'?AbortController:undefined,conLimite_: p => p,
      fetch: async url => { calls.push(url);if(url.startsWith('original'))throw new Error('offline');return { ok: true, text: async () => JSON.stringify(response), json: async () => response }; }
    });vm.runInContext(fn(source,'rechazoAcceso')+'\n'+fn(source,functionName),c);
    assert.equal((await c[functionName]('synthetic')).ok,true);assert.equal(calls.length,2);
  });
}
// T-105: en el marco (shell.js) el segundo intento vuelve al ORIGINAL tras 1.5 s, como potenciales-yod/portero.js.
function shellCanje(respuestas) {
  const urls = [], esperas = [];
  const c = vm.createContext({
    ACCESO_LISTO: Promise.resolve(), window: { YOD_PORTERO: { original: 'original', respaldo: 'respaldo' } },
    setTimeout: (f, ms) => { esperas.push(ms);if (ms === 1500) f();return 0; }, clearTimeout() {},
    fetch: async url => { urls.push(url);const r = respuestas[urls.length - 1] || respuestas.at(-1);if (r instanceof Error) throw r;return { ok: true, status: 200, json: async () => r }; }
  });
  vm.runInContext(fn(shellSource, 'rechazoAcceso') + '\n' + fn(shellSource, 'canjeConRelevo'), c);
  return { c, urls, esperas };
}
test('shell (T-105): caída de transporte → el segundo intento es el ORIGINAL tras 1.5 s y nunca el respaldo', async () => {
  const h = shellCanje([new Error('offline'), { ok: true, rol: 'vista', boards: 'TA' }]);
  assert.equal((await h.c.canjeConRelevo('synthetic')).ok, true);
  assert.deepEqual(h.urls.map(u => u.split('?')[0]), ['original', 'original']);assert.deepEqual(h.esperas, [1500]);
});
test('shell (T-105): respuesta no concluyente del original también se repite contra el ORIGINAL', async () => {
  const h = shellCanje([{ ok: false, error: 'servidor' }, { ok: true, rol: 'vista', boards: 'TA' }]);
  assert.equal((await h.c.canjeConRelevo('synthetic')).ok, true);
  assert.ok(h.urls.every(u => u.startsWith('original?')));assert.equal(h.urls.length, 2);
});
test('shell (T-105): un rechazo del ORIGINAL en el segundo intento es concluyente; dos fallos son null; el respaldo no se toca', async () => {
  const rechazo = shellCanje([new Error('offline'), { ok: false, error: 'revocado' }]);
  assert.equal((await rechazo.c.canjeConRelevo('synthetic')).error, 'revocado');
  const caido = shellCanje([new Error('offline'), { ok: false, error: 'servidor' }]);
  assert.equal(await caido.c.canjeConRelevo('synthetic'), null);
  for (const h of [rechazo, caido]) {assert.equal(h.urls.length, 2);assert.ok(h.urls.every(u => !u.startsWith('respaldo')));}
});

function shellHarness(token = 'A') {
  const nodes = new Map(), canvas = element(), main = element(), applied = [], reloads = [], timers = [];
  const node = id => { if(!nodes.has(id))nodes.set(id,element());return nodes.get(id); };
  const localStorage=store({pyod_clave_v1:token}),sessionStorage=store({yod_id_v1:'{"rol":"admin","boards":"*"}'});
  const state={role:'',boards:'',modules:[],identity:'pending',catalogRows:null,catalogIds:null,identityRequest:0,sessionToken:'',sessionIdentity:'',verifiedAt:0,reconnectAttempts:0,retryTimer:null};
  const c=vm.createContext({
    state,localStorage,sessionStorage,LSC:'pyod_clave_v1',CATCACHE:'yod_portal_cat_v1',CATIDS:'yod_portal_cat_ids_v1',DATA_CACHES:{'SYS-TAREAS':['aurum-cache-v5']},
    NAME:{'SYS-TAREAS':'MOAC'},OS:'https://example.invalid/os',currentSys:()=> 'SYS-TAREAS',
    document:{getElementById:node,querySelector:s=>s==='.yod-canvas'?canvas:main},el:()=>element(),esc:String,
    set:(id,value)=>{node(id).textContent=value;},pastilla(){},applyNav(){},
    canOpen:()=>state.identity==='ok'&&(state.boards==='TA'||state.role==='admin'),
    location:{reload(){reloads.push(true);}},
    aplicaIdentidad(j){state.role=j.rol;state.boards=j.boards;state.identity='ok';applied.push(j.nombre);c.maybeLock();},
    setTimeout(f,ms){timers.push({f,ms});return timers.length;},clearTimeout(){},
    loadCatalog:async()=>{},canjeConRelevo:async t=>({ok:true,token:t,rol:'vista',boards:'TA',nombre:'Current'})
  });
  vm.runInContext(['tok','rechazoAcceso','purgeCaches','purgeAll','maybeLock','loadIdentity'].map(n=>fn(shellSource,n)).join('\n'),c);
  return {c,state,localStorage,sessionStorage,applied,canvas,reloads,timers};
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

test('Shell: error temporal en sesión ya confirmada mantiene vista y reintenta',async()=>{
  const h=shellHarness();await h.c.loadIdentity();
  assert.equal(h.state.identity,'ok');assert.equal(h.canvas.style.display,'');
  h.c.canjeConRelevo=async()=>null;
  await h.c.loadIdentity();
  assert.equal(h.state.identity,'ok');assert.equal(h.canvas.style.display,'');
  assert.equal(h.localStorage.getItem('pyod_clave_v1'),'A');
  assert.equal(h.timers.length,1);assert.equal(h.timers[0].ms,15000);
  h.c.canjeConRelevo=async t=>({ok:true,token:t,rol:'vista',boards:'TA',nombre:'Current'});
  h.timers[0].f();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.state.identity,'ok');assert.equal(h.state.reconnectAttempts,0);
});

test('Shell: sesión nueva sin conexión permanece cerrada pero reintenta sin borrar token',async()=>{
  const h=shellHarness();h.c.canjeConRelevo=async()=>null;await h.c.loadIdentity();
  assert.equal(h.state.identity,'pending');assert.equal(h.canvas.style.display,'none');
  assert.equal(h.timers.length,1);assert.equal(h.localStorage.getItem('pyod_clave_v1'),'A');
  h.c.canjeConRelevo=async t=>({ok:true,token:t,rol:'vista',boards:'TA',nombre:'Current'});
  h.timers[0].f();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.state.identity,'ok');assert.equal(h.canvas.style.display,'');
});

test('Shell: tras cinco minutos sin validación esconde datos, conserva token y sigue reintentando',async()=>{
  const h=shellHarness();await h.c.loadIdentity();
  h.state.verifiedAt=Date.now()-6*60000;
  h.c.canjeConRelevo=async()=>null;await h.c.loadIdentity();
  assert.equal(h.state.identity,'pending');assert.equal(h.canvas.style.display,'none');
  assert.equal(h.localStorage.getItem('pyod_clave_v1'),'A');assert.equal(h.timers.length,1);
});

test('Shell: revocación explícita nunca obtiene gracia ni reintento',async()=>{
  const h=shellHarness();await h.c.loadIdentity();
  h.c.canjeConRelevo=async()=>({ok:false,error:'revocado'});
  await h.c.loadIdentity();assert.equal(h.state.identity,'fail');
  assert.equal(h.canvas.style.display,'none');assert.equal(h.timers.length,0);
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
  assert.notEqual(sh.state.identity,'ok');assert.equal(sh.canvas.style.display,'none');
 }
});

test('Shell: respuesta de Portero no concluyente no elimina token y reintenta con permisos cerrados',async()=>{
  const h=shellHarness();h.c.canjeConRelevo=async()=>({ok:false,error:'error_interno'});
  await h.c.loadIdentity();
  assert.equal(h.localStorage.getItem('pyod_clave_v1'),'A');
  assert.equal(h.state.identity,'pending');assert.equal(h.canvas.style.display,'none');
  assert.equal(h.timers.length,1);assert.equal(h.timers[0].ms,15000);
});

// T-105: antes el segundo intento era el respaldo (y se vigilaba que su «liga» no revocara al primario inaccesible);
// ahora el respaldo ni se consulta — el segundo intento es el ORIGINAL — y la garantía de fondo es la misma:
// un primario que no contesta jamás revoca la credencial.
test('Shell: con el primario inaccesible nunca se consulta el respaldo (T-105) y la credencial no se revoca',async()=>{
  const urls=[];
  const c=vm.createContext({
    window:{YOD_PORTERO:{original:'https://original.invalid',respaldo:'https://backup.invalid'}},
    ACCESO_LISTO:Promise.resolve(),AbortController,setTimeout:(f,ms)=>{if(ms===1500)f();return 0;},clearTimeout,encodeURIComponent,
    fetch:async url=>{urls.push(url);return url.startsWith('https://original.invalid')?Promise.reject(Error('sin conexion')):{
      ok:true,status:200,json:async()=>({ok:false,error:'liga'})
    };}
  });
  vm.runInContext(fn(shellSource,'rechazoAcceso')+'\n'+fn(shellSource,'canjeConRelevo'),c);
  assert.equal(await c.canjeConRelevo('A'),null);
  assert.equal(urls.length,2);assert.ok(urls.every(u=>u.startsWith('https://original.invalid')),'ambos intentos van al original');
});

test('App: distingue fallos del canje con diagnóstico seguro y conserva autoridad del primario',async()=>{
  for(const kind of ['red','http','formato','timeout']){
    const logs=[],calls=[];
    const c=vm.createContext({Date,console:{warn:(...x)=>logs.push(x)},PORTERO_ORIGINAL:'original',PORTERO_RESPALDO:'backup',
      AbortController,conLimite_:p=>p,fetch:async(url)=>{calls.push(url);if(kind==='red')throw Error('private-token-in-exception');if(kind==='timeout')throw Error('timeout');return {ok:kind!=='http',status:kind==='http'?503:200,text:async()=>'<html>private-body</html>'};}});
    vm.runInContext(fn(appSource,'rechazoAcceso')+'\n'+fn(appSource,'canjearConRelevo_'),c);
    const r=await c.canjearConRelevo_('private-token');assert.equal(r.error,kind);assert.equal(calls.length,2);
    assert.equal(logs[0][1].length,2);assert.equal(logs[0][1][0].codigo,kind);
    assert.doesNotMatch(JSON.stringify(logs),/private-token|private-body|https:|\?recurso/);
    assert.deepEqual(Object.keys(logs[0][1][0]),['origen','fase','codigo','http','duracion_ms']);
    const h=appHarness();h.c.canjearConRelevo_=async()=>({ok:false,error:kind});await h.c.loadIdentity();
    assert.equal(h.timers.length,1);assert.equal(h.state.profileReady,false);assert.ok(h.localStorage.getItem('pyod_clave_v1'));
  }
});
test('App: fallo primario conserva diagnóstico aunque respaldo rechace y puede recuperar sin aviso falso',async()=>{
  for(const backupOk of [false,true]){
    let n=0;const logs=[];const c=vm.createContext({Date,console:{warn:(...a)=>logs.push(a)},PORTERO_ORIGINAL:'original',PORTERO_RESPALDO:'backup',AbortController,conLimite_:p=>p,
      fetch:async()=>{if(!n++)throw Error('network');return {ok:true,status:200,text:async()=>JSON.stringify(backupOk?{ok:true,token:'synthetic',rol:'vista',boards:'TA'}:{ok:false,error:'revocado'})};}});
    vm.runInContext(fn(appSource,'rechazoAcceso')+'\n'+fn(appSource,'canjearConRelevo_'),c);
    const r=await c.canjearConRelevo_('synthetic');assert.equal(r.ok,backupOk);assert.equal(logs.length,backupOk?0:1);if(!backupOk)assert.equal(r.error,'red');
  }
});

function abortCanjeHarness(source=appSource){
  const timers=new Map(),calls=[],logs=[];let serial=0,active=0,peak=0;
  const c=vm.createContext({AbortController,Date,Promise,Error,LIMITE_MS:25000,
    PORTERO_ORIGINAL:'original',PORTERO_RESPALDO:'backup',console:{warn:(...a)=>logs.push(a)},
    setTimeout(f,ms){const id=++serial;timers.set(id,{f,ms});return id;},clearTimeout(id){timers.delete(id);},
    fetch(url,options){
      const d=deferred();active++;peak=Math.max(peak,active);
      let done=false;const finish=f=>v=>{if(!done){done=true;active--;}f(v);};
      const call={url,signal:options.signal,resolve:finish(d.resolve),reject:finish(d.reject)};calls.push(call);
      if(options.signal)options.signal.addEventListener('abort',()=>call.reject(Object.assign(new Error('aborted'),{name:'AbortError'})),{once:true});
      return d.promise;
    }
  });
  vm.runInContext(fn(source,'conLimite_')+'\n'+fn(source,'rechazoAcceso')+'\n'+fn(source,'canjearConRelevo_'),c);
  return {c,timers,calls,logs,get active(){return active;},get peak(){return peak;},expire(){const [id,t]=timers.entries().next().value;timers.delete(id);assert.equal(t.ms,25000);t.f();}};
}
const flushCanje=()=>new Promise(resolve=>setImmediate(resolve));
test('App: canje vencido cancela original antes del respaldo, sin acumulación en 20 rondas',async()=>{
  const h=abortCanjeHarness();
  for(let round=0;round<20;round++){
    const p=h.c.canjearConRelevo_('synthetic');
    h.expire();await flushCanje();
    assert.equal(h.calls.at(-2).signal.aborted,true);
    assert.equal(h.active,1);assert.equal(h.timers.size,1);
    h.expire();const r=await p;
    assert.equal(r.error,'timeout');assert.equal(h.active,0);assert.equal(h.timers.size,0);
    assert.equal(h.calls.at(-1).signal.aborted,true);
    assert.deepEqual(h.logs.at(-1)[1].map(x=>x.codigo).join(','),'timeout,timeout');
  }
  assert.equal(h.peak,1);assert.equal(new Set(h.calls.map(x=>x.signal)).size,40);
});
test('App: éxito/error de red limpia temporizador y no aborta respuesta válida después',async()=>{
  for(const primaryFails of [false,true]){
    const h=abortCanjeHarness(),p=h.c.canjearConRelevo_('synthetic');
    if(primaryFails){h.calls[0].reject(new Error('network'));await flushCanje();assert.equal(h.timers.size,1);}
    h.calls.at(-1).resolve({ok:true,status:200,text:async()=>JSON.stringify({ok:true,rol:'vista',boards:'TA'})});
    assert.equal((await p).ok,true);assert.equal(h.timers.size,0);assert.equal(h.active,0);
    assert.ok(h.calls.every(x=>!x.signal.aborted));assert.equal(h.logs.length,0);
  }
});
test('App: timeout primario puede recuperar con respaldo fresco sin revocar identidad',async()=>{
  const h=abortCanjeHarness(),p=h.c.canjearConRelevo_('synthetic');
  h.expire();await flushCanje();
  h.calls[1].resolve({ok:true,status:200,text:async()=>JSON.stringify({ok:true,rol:'vista',boards:'TA'})});
  assert.equal((await p).ok,true);assert.equal(h.active,0);assert.equal(h.timers.size,0);assert.equal(h.logs.length,0);
  assert.equal(h.calls[0].signal.aborted,true);assert.equal(h.calls[1].signal.aborted,false);
});

test('App: un único plazo cubre cuerpo atascado y cancela ambos intentos en20 rondas',async()=>{
  for(let round=0;round<20;round++){
    const h=abortCanjeHarness();let bodies=0,aborted=0;
    const p=h.c.canjearConRelevo_('synthetic');
    for(let i=0;i<2;i++){
      const call=h.calls[i],timerId=[...h.timers.keys()][0];
      call.resolve({ok:true,status:200,text:()=>new Promise((_,reject)=>{
        bodies++;call.signal.addEventListener('abort',()=>{bodies--;aborted++;reject(Object.assign(Error('aborted'),{name:'AbortError'}));},{once:true});
      })});
      await flushCanje();
      assert.equal(h.timers.size,1);assert.equal([...h.timers.keys()][0],timerId,'recibir headers no reinicia ni limpia plazo');
      h.expire();await flushCanje();assert.equal(bodies,0);
    }
    assert.equal((await p).error,'timeout');assert.equal(aborted,2);assert.equal(h.timers.size,0);
    assert.equal(h.logs[0][1].map(x=>x.fase).join(','),'cuerpo,cuerpo');
    assert.equal(h.logs[0][1].map(x=>x.codigo).join(','),'timeout,timeout');
  }
});
test('App: cuerpo tardío que ignora abort no sustituye éxito del respaldo ni altera diagnóstico',async()=>{
  const h=abortCanjeHarness(),late=deferred(),p=h.c.canjearConRelevo_('synthetic');
  h.calls[0].resolve({ok:true,status:200,text:()=>late.promise});await flushCanje();h.expire();await flushCanje();
  h.calls[1].resolve({ok:true,status:200,text:async()=>JSON.stringify({ok:true,token:'synthetic',nombre:'backup',rol:'vista',boards:'TA'})});
  const result=await p;assert.equal(result.nombre,'backup');assert.equal(h.timers.size,0);
  late.resolve(JSON.stringify({ok:true,nombre:'late-original',rol:'admin',boards:'*'}));await flushCanje();
  assert.equal(result.nombre,'backup');assert.equal(h.logs.length,0);
});
test('App: fallo al leer cuerpo conserva diagnóstico red y recupera respaldo',async()=>{
  const h=abortCanjeHarness(),p=h.c.canjearConRelevo_('synthetic');
  h.calls[0].resolve({ok:true,status:200,text:async()=>{throw Error('network-body');}});await flushCanje();
  h.calls[1].resolve({ok:true,status:200,text:async()=>JSON.stringify({ok:false,error:'revocado'})});
  assert.equal((await p).error,'red');assert.equal(h.logs[0][1][0].fase,'cuerpo');assert.equal(h.timers.size,0);
});

test('283 conjunto: avisos simultáneos de la misma identidad comparten canje y carga',async()=>{
 const h=appHarness('A'),pending=deferred();let calls=0;
 h.c.canjearConRelevo_=()=>{calls++;return pending.promise;};
 const one=h.c.loadIdentity(),two=h.c.loadIdentity(),three=h.c.loadIdentity();
 assert.equal(one,two);assert.equal(two,three);assert.equal(calls,1);
 pending.resolve({ok:true,token:'A',rol:'vista',boards:'TA',nombre:'Current'});
 await Promise.all([one,two,three]);assert.deepEqual(h.loads,['catalog','A']);assert.equal(h.state.identityFlight,null);
 h.c.canjearConRelevo_=async()=>{calls++;return {ok:true,token:'A',rol:'vista',boards:'TA',nombre:'Current'};};
 await h.c.loadIdentity();assert.equal(calls,2,'una nueva revisión sigue validando al servidor');
});
test('283 conjunto: volver de B a A no reutiliza el canje antiguo de A',async()=>{
 const h=appHarness('A'),pending=[deferred(),deferred(),deferred()];let calls=0;
 h.c.canjearConRelevo_=()=>pending[calls++].promise;
 const a=h.c.loadIdentity();h.localStorage.setItem('pyod_clave_v1','B');const b=h.c.loadIdentity();
 h.localStorage.setItem('pyod_clave_v1','A');const fresh=h.c.loadIdentity();assert.equal(calls,3);
 pending[2].resolve({ok:true,token:'A',rol:'vista',boards:'TA',nombre:'Fresh'});await fresh;
 pending[0].resolve({ok:true,token:'A',rol:'admin',boards:'*',nombre:'Old'});
 pending[1].resolve({ok:true,token:'B',rol:'admin',boards:'*',nombre:'B'});await Promise.all([a,b]);
 assert.deepEqual(h.applied,['Fresh']);assert.equal(h.state.role,'vista');
});
test('283 conjunto: Despacho difiere Inicio y al volver lo carga una sola vez por época',async()=>{
 const h=appHarness('A');h.authorize();h.c.location.hash='#/despacho';let board=0,pulse=0,ops=0;
 h.c.montarTablero=()=>board++;h.c.loadPulse=async()=>pulse++;h.c.loadOperations=async()=>ops++;
 h.c.window.YodAccessPolicy={hasCode:()=>true};
 vm.runInContext(['enDespacho','iniciarInicioDiferido','startData'].map(n=>fn(appSource,n)).join('\n'),h.c);
 await h.c.startData('A');h.c.iniciarInicioDiferido();assert.deepEqual([board,pulse,ops],[0,0,0]);
 h.c.location.hash='#pulso';h.c.iniciarInicioDiferido();h.c.iniciarInicioDiferido();
 assert.deepEqual([pulse,ops],[1,1]);h.state.sesionEpoch++;h.c.iniciarInicioDiferido();assert.deepEqual([pulse,ops],[2,2]);
 h.localStorage.removeItem('pyod_clave_v1');h.c.iniciarInicioDiferido();assert.deepEqual([pulse,ops],[2,2]);
});

test('P3 App: enabled coordinator reuses catalog work and rejects a session changed during boot',async()=>{
  const {createPortalLoadPlan}=await import('../os/load-plan.mjs');
  const h=appHarness();h.authorize();const p=createPortalLoadPlan(),boot=deferred();
  h.c.window.YodLoadConfig={enabled:true};h.c.window.YodLoadPlanReady=boot.promise;
  let calls=0;const a=h.c.coordinatedPortalLoad('catalog',()=>{calls++;},1,'catalog');
  h.state.sesionEpoch++;boot.resolve(p);await a;assert.equal(calls,0);
  const d=deferred(),run=()=>{calls++;return d.promise;};
  const b=h.c.coordinatedPortalLoad('catalog',run,1,'catalog'),c=h.c.coordinatedPortalLoad('catalog',run,1,'catalog');
  await new Promise(r=>setImmediate(r));assert.equal(calls,1);d.resolve();await Promise.all([b,c]);p.revoke();
});

test('P4: identity completes while a follower tab defers background data',async()=>{
 const h=appHarness(),d=deferred();h.c.window.YodLoadConfig={enabled:true};
 const {createPortalLoadPlan}=await import('../os/load-plan.mjs');const plan=createPortalLoadPlan();
 h.c.window.YodLoadPlanReady=Promise.resolve(plan);h.c.startData=()=>d.promise;
 await h.c.loadIdentity();assert.equal(h.state.profileReady,true);assert.equal(h.state.identityFlight,null);
 d.resolve();plan.revoke();
});
test('P4: expired deferred Home work remains eligible on return, rather than marked complete',async()=>{
 const h=appHarness();h.authorize();h.c.window.YodLoadConfig={enabled:true};h.c.enDespacho=()=>false;h.c.loadPulse=async()=>{};
 h.c.window.YodAccessPolicy={hasCode:()=>true};h.c.coordinatedPortalLoad=async()=>{throw Error('timeout');};
 vm.runInContext(fn(appSource,'startData'),h.c);await h.c.startData(h.state.sessionToken);
 assert.equal(h.state.homeDataEpoch,null);
});

 test('P4: invalidated Home responses cannot render or populate caches in the same session',async()=>{
 for(const [method,adapter] of [['loadFinance','YodFinance'],['loadMarketing','YodMarketing'],['loadOperations','YodOperations']]){
  const h=appHarness(),d=deferred();h.authorize();let revision=0;h.state.loadPlan={revision:()=>revision};
  h.c.window[adapter]={load:()=>d.promise};const pending=h.c[method](h.state.sessionToken);revision++;
  d.resolve({summary:{balance:99},tasks:[{id:'obsolete'}],source:'live'});await pending;
  assert.equal(h.renders.length,0);assert.equal(Object.keys(h.state.pulseCache).length,0);assert.equal(h.state.opsCache,null);
 }
});
