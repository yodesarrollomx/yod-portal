const test=require('node:test'),assert=require('node:assert/strict');
const profile=id=>({ok:true,case_id:id,name:'Proyecto sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:false,agent_ready:false});
test('catalog retains seven identities including a documentary case without execution capabilities',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');const {validateSelection}=await import('../despacho3d/conversation.mjs');
 const cases=Array.from({length:7},(_,i)=>profile('case-'+i)),p=cases[6];Object.assign(p,{record_only:true,goals:{schema:1,ready:false,worker_ready:false},avatar:{id:p.case_id,case_id:p.case_id,entity_kind:'case',name:p.name,form:'woman',color:'#abcdef'},auton_status:{ok:true,schema:1,case_id:p.case_id,admission:'standby',activity:null,reason:'recorded_standby',observed_at:new Date().toISOString(),source_ref:'Proyectos!3',source_revision:'test',library_only:false}});
 const c=createAuthorizedCases({transport:{listAuthorized:async()=>({ok:true,schema:1,cases}),resolveCurrent:async()=>p}});assert.equal(await c.refresh(),true);assert.equal(c.snapshot().cases.length,7);assert.equal((await c.select(p.case_id)).avatar.record_only,true);assert.throws(()=>validateSelection({...p,can_enqueue:true}),/invalid_selection/);assert.throws(()=>validateSelection({...p,auton_status:{...p.auton_status,admission:'alta',activity:'working'}}),/invalid_selection/);c.dispose();
});
test('catalog alone does not select or grant access; selection revalidates the exact case',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');let calls=[];
 const c=createAuthorizedCases({transport:{listAuthorized:async()=>({ok:true,schema:1,cases:[profile('a'),profile('b')]}),resolveCurrent:async p=>{calls.push(p);return profile(p.case_id);}}});
 await c.refresh();assert.equal(c.snapshot().selected,null);assert.equal(await c.select('outside'),null);assert.equal(calls.length,0);assert.equal((await c.select('b')).case_id,'b');assert.deepEqual(calls,[{case_id:'b'}]);c.dispose();
});
test('stale selection response cannot restore a revoked or disposed catalog',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');let done;
 const c=createAuthorizedCases({transport:{listAuthorized:async()=>({ok:true,schema:1,cases:[profile('a')]}),resolveCurrent:()=>new Promise(r=>done=r)}});
 await c.refresh();const pending=c.select('a');await new Promise(r=>setImmediate(r));c.dispose();done(profile('a'));assert.equal(await pending,null);assert.equal(c.snapshot().selected,null);
});
test('an unexpected default response is rejected and credentials are not reused after switching',async()=>{
 const {Conversation}=await import('../despacho3d/conversation.mjs');let reads=0;
 const c=new Conversation({transport:{resolveCurrent:async()=>profile('a'),read:async()=>{reads++;}},fast:null});
 assert.equal(await c.open('b'),false);assert.equal(reads,0);assert.equal(c.selection,null);assert.equal(c.profile,null);
});
test('server descriptor explicitly maps canonical agent ID to board ID',async()=>{
 const {validateSelection}=await import('../despacho3d/conversation.mjs');const {resolveBoard}=await import('../despacho3d/project-station.mjs');
 const selected=validateSelection({...profile('agent-a'),ppp:{case_id:'agent-a',board_case_id:'board-a',scenario_id:'version-2',url:'https://yodesarrollomx.github.io/potenciales-yod/macrolotes.html?open=board-a'}});
 assert.equal(resolveBoard(selected).board_case_id,'board-a');assert.equal(selected.ppp.scenario_id,'version-2');assert.equal(resolveBoard(selected).readOnly,true);
 assert.equal(validateSelection({...profile('agent-a'),ppp:{case_id:'agent-a',url:'https://yodesarrollomx.github.io/potenciales-yod/macrolotes.html?open=board-a'}}).ppp,null);
});

test('refresh keeps authorized figures stable until response and removes revoked profiles',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');let pending=null,clock=100;
 const c=createAuthorizedCases({now:()=>clock,transport:{listAuthorized:()=>pending?new Promise(r=>pending.resolve=r):Promise.resolve({ok:true,schema:1,cases:[profile('a'),profile('b')]}),resolveCurrent:async p=>profile(p.case_id)}});
 await c.refresh();await c.select('b');pending={};clock=55000;const refresh=c.refresh();assert.equal(c.snapshot().cases.length,2);assert.equal(c.snapshot().selected.case_id,'b');pending.resolve({ok:true,schema:1,cases:[profile('a')]});await refresh;assert.equal(c.snapshot().cases.length,1);assert.equal(c.snapshot().selected,null);
 pending={};clock=175000;const expired=c.refresh();assert.equal(c.snapshot().cases.length,0);pending.resolve({ok:false});await expired;assert.equal(c.snapshot().cases.length,0);c.dispose();
});

test('a transient selection failure is immediately retryable within the catalog lease',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');let calls=0,lists=0;
 const c=createAuthorizedCases({schedule:()=>1,cancel(){},transport:{listAuthorized:async()=>{lists++;return{ok:true,schema:1,cases:[profile('a'),profile('b')]};},resolveCurrent:async p=>{if(++calls===1)throw Error('unavailable');return profile(p.case_id);}}});
 await c.refresh();assert.equal(await c.select('b'),null);assert.equal(c.snapshot().phase,'reconnecting');
 assert.equal((await c.select('b')).case_id,'b');assert.equal(calls,2);assert.equal(lists,1);c.dispose();
});
test('retry cannot extend an expired lease or restore a revoked case',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');let clock=0,calls=0;
 const c=createAuthorizedCases({now:()=>clock,schedule:()=>1,cancel(){},transport:{listAuthorized:async()=>({ok:true,schema:1,cases:[profile('a')]}),resolveCurrent:async()=>{calls++;throw Error('timeout');}}});
 await c.refresh();await c.select('a');clock=500000;assert.equal(await c.select('a'),null);assert.equal(calls,1);c.clear();assert.equal(await c.select('a'),null);c.dispose();
});

test('brief catalogs hydrate only the selected case and pass its actual goals capability',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');
 for(const descriptor of [undefined,{schema:2,ready:true,worker_ready:true},{schema:1,ready:'yes',worker_ready:true}]){
  const calls=[],goals={schema:1,ready:true,worker_ready:false};let handed;
  const c=createAuthorizedCases({reuseCatalog:true,schedule:()=>1,cancel(){},transport:{
   listAuthorized:async()=>({ok:true,schema:1,cases:['a','b'].map(id=>({...profile(id),goals:descriptor}))}),
   resolveCurrent:async p=>{calls.push(p);return {...profile(p.case_id),goals};}}});
  await c.refresh();assert.equal(calls.length,0);
  assert.deepEqual((await c.select('b',{onResolved:r=>handed=r})).goals,goals);
  assert.deepEqual(calls,[{case_id:'b'}]);assert.deepEqual(handed.goals,goals);c.dispose();
 }
});
test('an explicit disabled capability is reused without treating enqueue as goals permission',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');
 const goals={schema:1,ready:false,worker_ready:false};
 const c=createAuthorizedCases({reuseCatalog:true,schedule:()=>1,cancel(){},transport:{
  listAuthorized:async()=>({ok:true,schema:1,cases:[{...profile('a'),can_enqueue:true,goals}]}),
  resolveCurrent:async()=>{throw Error('must_not_probe');}}});
 await c.refresh();assert.deepEqual((await c.select('a')).goals,goals);c.dispose();
});
test('hydration never invents goals on a legacy profile or accepts a different case',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');
 for(const returned of ['a','other']){
  const c=createAuthorizedCases({reuseCatalog:true,schedule:()=>1,cancel(){},transport:{
   listAuthorized:async()=>({ok:true,schema:1,cases:[profile('a')]}),resolveCurrent:async()=>({...profile(returned),can_enqueue:true})}});
  await c.refresh();const selected=await c.select('a');
  if(returned==='a')assert.equal(selected.goals,null);else assert.equal(selected,null);c.dispose();
 }
});
test('late brief-profile hydration cannot replace a newer selection or restore revoked authority',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');
 for(const revoke of [false,true]){
  let release;const goals={schema:1,ready:true,worker_ready:true};
  const c=createAuthorizedCases({reuseCatalog:true,schedule:()=>1,cancel(){},transport:{
   listAuthorized:async()=>({ok:true,schema:1,cases:[profile('a'),profile('b')]}),
   resolveCurrent:p=>p.case_id==='a'?new Promise(r=>release=r):Promise.resolve({...profile('b'),goals})}});
  await c.refresh();let handed=false;const first=c.select('a',{onResolved:()=>handed=true});await new Promise(r=>setImmediate(r));
  if(revoke)c.clear();else await c.select('b');
  release({...profile('a'),goals});assert.equal(await first,null);assert.equal(handed,false);
  assert.equal(c.snapshot().selected?.case_id,revoke?undefined:'b');c.dispose();
 }
});
