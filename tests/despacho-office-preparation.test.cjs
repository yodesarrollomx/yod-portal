'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const token='A'.repeat(30)+'.'+'a'.repeat(64),endpoint='https://synthetic-engine.onrender.com';
const raw=(id,at=1000)=>({ok:true,case_id:id,token,endpoint,expires_at:at+600000});
const tick=()=>new Promise(r=>setImmediate(r));
test('credentials for all residents stay separate and concurrent mints are serialized',async()=>{
 const {createFastSessionPool}=await import('../despacho3d/office-preparation.mjs');
 const pool=createFastSessionPool({now:()=>1000}),calls=[];let release;
 const mint=async p=>{calls.push(p.case_id);if(p.case_id==='a')await new Promise(r=>release=r);return raw(p.case_id);};
 const a=pool.ensure('a',mint),b=pool.ensure('b',mint),a2=pool.ensure('a',mint);await tick();
 assert.deepEqual(calls,['a']);release();assert.equal((await a).case_id,'a');assert.equal((await a2).case_id,'a');assert.equal((await b).case_id,'b');
 assert.deepEqual(calls,['a','b']);await pool.ensure('a',mint);assert.equal(calls.length,2);
});
test('expired or revoked credentials cannot be restored by a late mint',async()=>{
 const {createFastSessionPool}=await import('../despacho3d/office-preparation.mjs');
 let at=1000,reads=0,release;const pool=createFastSessionPool({now:()=>at});
 const mint=async p=>{reads++;return raw(p.case_id,at);};
 await pool.ensure('a',mint);at+=480001;await pool.ensure('a',mint);assert.equal(reads,2);
 const p=pool.ensure('b',()=>new Promise(r=>release=r));const outcome=p.catch(e=>e.message);await tick();
 pool.retain(['a']);release(raw('b',at));assert.equal(await outcome,'session_changed');
 await pool.ensure('b',mint);assert.equal(reads,3);pool.forget();
});
test('warming all residents makes no voice-session, microphone, model or business request',async()=>{
 const {createFastSessionPool,createOfficePreparation}=await import('../despacho3d/office-preparation.mjs');
 const calls=[],results=[],pool=createFastSessionPool({now:()=>1000});
 const office=createOfficePreparation({sessions:pool,now:()=>1000,mint:async p=>{calls.push('mint:'+p.case_id);return raw(p.case_id);},
  fetchImpl:async url=>{calls.push(url);return{ok:true,status:200,json:async()=>({ok:true,available:true})};},onResult:(id,ok)=>results.push([id,ok])});
 await office.update([{case_id:'a',can_enqueue:true},{case_id:'b',can_enqueue:true},{case_id:'c',can_enqueue:false}]);
 assert.deepEqual(results,[['a',true],['b',true]]);assert.equal(calls.filter(x=>x.endsWith('/voice/ready')).length,2);
 assert.ok(calls.every(x=>x.startsWith('mint:')||x.endsWith('/voice/ready')));office.close();
});
test('hidden page does not mint; cleared preparation never publishes an old result',async()=>{
 const {createFastSessionPool,createOfficePreparation}=await import('../despacho3d/office-preparation.mjs');
 let visible=false,release;const results=[],pool=createFastSessionPool({now:()=>1000});
 const office=createOfficePreparation({sessions:pool,visible:()=>visible,mint:async p=>raw(p.case_id),
  fetchImpl:()=>new Promise(r=>release=r),onResult:(...v)=>results.push(v)});
 await office.update([{case_id:'a',can_enqueue:true}]);assert.equal(release,undefined);
 visible=true;const p=office.update([{case_id:'a',can_enqueue:true}]);await tick();office.clear();
 release({ok:true,status:200,json:async()=>({ok:true,available:true})});await p;assert.deepEqual(results,[]);office.close();
});
test('fresh validated catalog opens another resident without a second server read; stale catalog revalidates',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');
 let at=1000,reads=0;
 const selection=id=>({ok:true,case_id:id,name:'Synthetic',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true});
 const cases=createAuthorizedCases({reuseCatalog:true,now:()=>at,schedule:()=>1,cancel:()=>{},
  transport:{listAuthorized:async()=>({ok:true,schema:1,cases:[selection('a'),selection('b')]}),
   resolveCurrent:async p=>{reads++;return selection(p.case_id);}}});
 await cases.refresh();let handed;
 assert.equal((await cases.select('b',{onResolved:r=>handed=r})).case_id,'b');assert.equal(handed.case_id,'b');assert.equal(reads,0);
 at+=55001;assert.equal((await cases.select('a')).case_id,'a');assert.equal(reads,1);
 at+=120000;assert.equal(await cases.select('b'),null);assert.equal(reads,1);cases.dispose();
});

test('shared prepared credentials remain usable by the live voice connector',async()=>{
 const {createFastSessionPool}=await import('../despacho3d/office-preparation.mjs');
 const {createLiveVoice}=await import('../despacho3d/live-voice.mjs');
 const pool=createFastSessionPool({now:()=>1000}),requests=[];let mints=0;
 const mint=async p=>{mints++;return raw(p.case_id);};
 await pool.ensure('a',mint);await pool.ensure('b',mint);
 const voice=createLiveVoice({now:()=>1000,mint:p=>pool.ensure(p.case_id,mint),
  fetchImpl:async(url,opts)=>{requests.push(url);assert.equal(opts.headers.Authorization,'Bearer '+token);
   return{ok:true,status:200,json:async()=>({ok:true,available:true})};}});
 assert.equal(await voice.prepare('a'),true);
 assert.equal(await voice.prepare('b'),true);
 assert.equal(mints,2,'voice must consume the already prepared credential of each resident');
 assert.deepEqual(requests,[endpoint+'/voice/ready',endpoint+'/voice/ready']);
 voice.discardPreparation();
});

test('the selected resident promotes its queued credential without interrupting an active mint',async()=>{
 const {createFastSessionPool}=await import('../despacho3d/office-preparation.mjs');
 const pool=createFastSessionPool({now:()=>1000}),calls=[];let release,active=0,maxActive=0;
 const mint=async p=>{calls.push(p.case_id);active++;maxActive=Math.max(maxActive,active);
  if(p.case_id==='a')await new Promise(r=>release=r);active--;return raw(p.case_id);};
 const a=pool.ensure('a',mint);await tick();
 const b=pool.ensure('b',mint),c=pool.ensure('c',mint),d=pool.ensure('d',mint);
 const selected=pool.ensure('d',mint,{priority:true});
 await tick();assert.deepEqual(calls,['a'],'the active request is not preempted');
 release();await Promise.all([a,b,c,d,selected]);
 assert.deepEqual(calls,['a','d','b','c']);assert.equal(maxActive,1);
 assert.equal(calls.filter(id=>id==='d').length,1,'promotion shares the existing exact-case request');
});
test('a new selected resident starts before queued background preparation',async()=>{
 const {createFastSessionPool}=await import('../despacho3d/office-preparation.mjs');
 const pool=createFastSessionPool({now:()=>1000}),calls=[];let release;
 const mint=async p=>{calls.push(p.case_id);if(p.case_id==='a')await new Promise(r=>release=r);return raw(p.case_id);};
 const a=pool.ensure('a',mint);await tick();
 const b=pool.ensure('b',mint),c=pool.ensure('c',mint),selected=pool.ensure('d',mint,{priority:true});
 release();await Promise.all([a,b,c,selected]);assert.deepEqual(calls,['a','d','b','c']);
});
test('revoking queued preparation rejects it immediately and never mints that credential',async()=>{
 const {createFastSessionPool}=await import('../despacho3d/office-preparation.mjs');
 const pool=createFastSessionPool({now:()=>1000}),calls=[];let release;
 const mint=async p=>{calls.push(p.case_id);if(p.case_id==='a')await new Promise(r=>release=r);return raw(p.case_id);};
 const a=pool.ensure('a',mint);await tick();
 const b=pool.ensure('b',mint),outcome=b.catch(e=>e.message);
 pool.retain(['a']);assert.equal(await outcome,'session_changed');
 assert.deepEqual(calls,['a']);release();await a;assert.deepEqual(calls,['a']);
});
test('forgetting authority prevents a late old mint from replacing a fresh same-case request',async()=>{
 const {createFastSessionPool}=await import('../despacho3d/office-preparation.mjs');
 const pool=createFastSessionPool({now:()=>1000});let release;
 const old=pool.ensure('a',()=>new Promise(r=>release=r)),outcome=old.catch(e=>e.message);await tick();
 pool.forget();
 let freshCalls=0;
 const fresh=pool.ensure('a',async p=>{freshCalls++;return raw(p.case_id);},{priority:true});
 release(raw('a'));assert.equal(await outcome,'session_changed');
 assert.equal((await fresh).case_id,'a');assert.equal(freshCalls,1);
 await pool.ensure('a',()=>{throw Error('unexpected_remint');});assert.equal(freshCalls,1);
});
