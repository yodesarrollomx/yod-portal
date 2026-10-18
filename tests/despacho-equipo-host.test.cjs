const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../os/despacho-equipo-host.js'),'utf8');
function harness(){const c=vm.createContext({Promise});vm.runInContext(source,c);let access={allowed:false,epoch:1},loads=0,mounts=0,revokes=0,captured;
 const host=c.YodDespachoEquipoHost.create({container:{},getAccess:()=>access,transport:{},loadMount:async()=>{loads++;return options=>{captured=options;mounts++;return {revoke(){revokes++;}}};}});
 return {host,access:a=>{access=a;},stats:()=>({loads,mounts,revokes}),captured:()=>captured};
}
test('host does not import before authority, mounts once and revokes on route/permission loss',async()=>{
 const h=harness();assert.equal(await h.host.refresh(),false);assert.deepEqual(h.stats(),{loads:0,mounts:0,revokes:0});
 h.access({allowed:true,epoch:1});assert.equal(await h.host.refresh(),true);await h.host.refresh();assert.equal(h.stats().mounts,1);assert.equal(h.captured().isAuthorized(),true);
 h.access({allowed:false,epoch:1});await h.host.refresh();assert.equal(h.stats().revokes,1);assert.equal(h.captured().isAuthorized(),false);
 h.access({allowed:true,epoch:2});await h.host.refresh();assert.equal(h.stats().mounts,2);h.host.dispose();assert.equal(h.stats().revokes,2);
});
test('epoch change during module load cannot resurrect an old session',async()=>{
 const c=vm.createContext({Promise});vm.runInContext(source,c);let a={allowed:true,epoch:1},release,mounts=0;
 const host=c.YodDespachoEquipoHost.create({container:{},transport:{},getAccess:()=>a,loadMount:()=>new Promise(r=>release=r)});
 const p=host.refresh();await Promise.resolve();a={allowed:true,epoch:2};host.teardown();release(()=>{mounts++;return {revoke(){}}});assert.equal(await p,false);assert.equal(mounts,0);
});
test('captured mount authority remains revoked after a new authorized identity is mounted',async()=>{const h=harness();h.access({allowed:true,epoch:1});await h.host.refresh();const first=h.captured();h.host.teardown();h.access({allowed:true,epoch:2});await h.host.refresh();assert.equal(first.isAuthorized(),false);assert.equal(h.captured().isAuthorized(),true);});
