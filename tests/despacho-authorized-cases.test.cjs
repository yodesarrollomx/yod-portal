const test=require('node:test'),assert=require('node:assert/strict');
const profile=id=>({ok:true,case_id:id,name:'Proyecto sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:false,agent_ready:false});
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
