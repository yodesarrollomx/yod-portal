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
