'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../os/data-continuity.mjs');
const yes=()=>true,ok=value=>({result:{ok:true,value},error:null});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const tick=()=>new Promise(r=>setImmediate(r));
const payload={case_id:'synthetic-A',request_id:'r1',expected_revision:'v1',message:'draft'};
async function fixture(options={}){const {createDataContinuity}=await load();const c=createDataContinuity(options);c.setSession('e1');return c;}
test('P4: resource TTLs, clones and explicit invalidation; authority never cached',async()=>{
 let time=0,calls=0;const c=await fixture({now:()=>time}),run=async()=>ok(++calls);
 const a=await c.read('read',payload,run,yes);a.result.value=99;
 assert.equal((await c.read('read',payload,run,yes)).result.value,1);
 time=1000;assert.equal((await c.read('read',payload,run,yes)).result.value,2);
 c.invalidate();assert.equal((await c.read('read',payload,run,yes)).result.value,3);
 for(const method of ['listAuthorized','resolveCurrent','readOfficePermissions','readOfficePending']){
  await c.read(method,payload,run,yes);await c.read(method,payload,run,yes);
 }assert.equal(calls,11);
});
test('P4: invalidation fences a response already in flight',async()=>{
 const c=await fixture(),d=deferred(),p=c.read('read',payload,()=>d.promise,yes);c.invalidate();d.resolve(ok('old'));
 await assert.rejects(p,/stale_revision/);assert.equal(c.snapshot().cached,0);
});
test('P4: session change and revoke cannot expose previous cached data or receipts',async()=>{
 const c=await fixture();await c.read('read',payload,()=>ok('old'),yes);await c.write('enqueue',payload,()=>ok('receipt'),yes);
 c.setSession('e2');assert.deepEqual(c.snapshot(),{cached:0,writes:0,revision:4});
 assert.equal((await c.read('read',payload,()=>ok('new'),yes)).result.value,'new');c.revoke();
 await assert.rejects(c.read('read',payload,()=>ok('bad'),yes),/session_changed/);
});
test('P4: same ID preserves exact receipt and rejects changed payload without second write',async()=>{
 const c=await fixture();let calls=0;const run=()=>{calls++;return ok('receipt');};
 await c.write('enqueue',payload,run,yes);assert.equal((await c.write('enqueue',payload,run,yes)).result.value,'receipt');
 assert.equal((await c.write('enqueue',{...payload,message:'changed'},run,yes)).result.error,'request_id_reused');assert.equal(calls,1);
});
test('P4: timeout does not repeat mutation, reads for reconciliation and accepts actual late receipt',async()=>{
 let expire,changes=0,reads=0,calls=0;const c=await fixture({schedule:fn=>{expire=fn;return 1;},cancel:()=>{},onChange:()=>changes++}),d=deferred();
 const run=()=>{calls++;return d.promise;},first=c.write('enqueue',payload,run,yes);await tick();expire();
 assert.equal((await first).error,'timeout');
 assert.equal((await c.write('enqueue',payload,run,yes,async()=>{reads++;})).error,'timeout');assert.equal(calls,1);assert.equal(reads,1);
 d.resolve(ok('actual ack'));await tick();assert.equal((await c.write('enqueue',payload,run,yes)).result.value,'actual ack');assert.equal(calls,1);assert.ok(changes>=2);
});
test('P4: permanent lost ACK stays unconfirmed even after successful read, never invented',async()=>{
 const c=await fixture();let calls=0,reads=0;const run=()=>{calls++;throw Error('lost');};
 await c.write('createGoal',payload,run,yes);const r=await c.write('createGoal',payload,run,yes,async()=>{reads++;});
 assert.equal(r.error,'unavailable');assert.equal(r.result,null);assert.equal(calls,1);assert.equal(reads,1);
});
test('P4: conflict returns exact rejection and leaves supplied draft untouched',async()=>{
 const c=await fixture(),draft=structuredClone(payload),rejection={result:{ok:false,error:'stale_revision'},error:null};
 assert.deepEqual(await c.write('enqueue',draft,()=>rejection,yes),rejection);assert.deepEqual(draft,payload);
});
test('P4: bounded memory evicts data but never forgets uncertain writes to admit another',async()=>{
 const c=await fixture({maxEntries:2,maxWrites:1});for(let i=0;i<3;i++)await c.read('read',{case_id:'A'+i},()=>ok(i),yes);
 assert.equal(c.snapshot().cached,2);await c.write('enqueue',payload,()=>({error:'timeout',result:null}),yes);
 await assert.rejects(c.write('enqueue',{...payload,request_id:'r2'},()=>assert.fail('no call'),yes),/unavailable/);
});
test('P4: change of selection does not cancel an admitted write; session change suppresses its reply',async()=>{
 const c=await fixture(),d=deferred();let current=true;const p=c.write('enqueue',payload,()=>d.promise,()=>current);await tick();current=false;d.resolve(ok('saved'));
 await assert.rejects(p,/session_changed/);current=true;assert.equal((await c.write('enqueue',payload,()=>assert.fail('duplicate'),yes)).result.value,'saved');
});
test('P4: rejection before lane admission does not prevent later explicit retry',async()=>{
 const c=await fixture();await c.write('enqueue',payload,()=>({result:null,error:'transport_busy'}),yes);
 assert.equal((await c.write('enqueue',payload,()=>ok('saved'),yes)).result.value,'saved');
});
test('P4: fresh hit still requires current authority; denied/error responses never enter cache',async()=>{
 const c=await fixture();await c.read('read',payload,()=>ok('data'),yes);
 await assert.rejects(c.read('read',payload,()=>assert.fail('no call'),()=>false),/session_changed/);
 c.invalidate();let calls=0;const denied=()=>{calls++;return {result:{ok:false,error:'unauthorized'},error:null};};
 await c.read('read',payload,denied,yes);await c.read('read',payload,denied,yes);assert.equal(calls,2);assert.equal(c.snapshot().cached,0);
});
test('P4: frame invalidation requires exact parent/origin and preserves draft without opening panels',()=>{
 const fs=require('node:fs'),vm=require('node:vm');let receive,flush,reads=0,events=0;
 const parent={},win={parent,addEventListener:(type,fn)=>{receive=fn;},dispatchEvent:()=>events++,CubefarmYOD:{isOpen:()=>true,read:()=>reads++}};
 const draft='Unsent synthetic draft';const c=vm.createContext({window:win,location:{origin:'https://synthetic.invalid'},document:{hidden:false},Event:class{},setTimeout:fn=>{flush=fn;}});
 vm.runInContext(fs.readFileSync('despacho3d/data-continuity-boot.mjs','utf8'),c);
 const send=(source,origin,data)=>receive({source,origin,data});const data={type:'yod:data:changed',version:1};
 send({},'https://synthetic.invalid',data);send(parent,'https://foreign.invalid',data);send(parent,'https://synthetic.invalid',{...data,payload:'not allowed'});assert.equal(flush,undefined);
 send(parent,'https://synthetic.invalid',data);send(parent,'https://synthetic.invalid',data);flush();assert.equal(reads,1);assert.equal(events,1);assert.equal(draft,'Unsent synthetic draft');
 win.CubefarmYOD.isOpen=()=>false;send(parent,'https://synthetic.invalid',data);flush();assert.equal(reads,1);
});
