'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const profile=id=>({ok:true,case_id:id,name:'Caso de prueba',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true,
 avatar:{id,case_id:id,entity_kind:'case',name:'Caso de prueba',form:'child',color:'#547e75',visual:{hairStyle:'crop'}}});
function clock(){
 let time=0,next=0;const timers=new Map();
 return {now:()=>time,schedule:(fn,ms)=>{const id=++next;timers.set(id,{fn,at:time+ms});return id;},cancel:id=>timers.delete(id),
  async advance(ms){time+=ms;for(let i=0;i<30;i++){const due=[...timers].filter(([,t])=>t.at<=time);if(!due.length)break;for(const[id,t]of due){timers.delete(id);t.fn();}await tick();}},get size(){return timers.size;}};
}
test('catalog and resident keep figures during timeout but do not authorize new operations',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs'),{createResidentAgents}=await import('../despacho3d/resident-agents.mjs');
 const c=clock();let fail=false,selected=0;
 const transport={listAuthorized:async()=>{if(fail)throw Error('timeout');return {ok:true,schema:1,cases:[profile('a')]};},resolveCurrent:async()=>{selected++;if(fail)throw Error('timeout');return profile('a');}};
 const resident=createResidentAgents({...c,transport,isVisible:()=>false});
 const catalog=createAuthorizedCases({...c,transport,onChange:s=>resident.reconcileCatalog(s)});
 assert.equal(await catalog.refresh(),true);assert.equal(await resident.refresh(),true);fail=true;
 await c.advance(65000);await catalog.refresh();await resident.refresh();
 assert.equal(catalog.snapshot().phase,'reconnecting');assert.equal(catalog.snapshot().cases.length,1);
 assert.equal(resident.snapshot().phase,'reconnecting');assert.ok(resident.getProfile());assert.equal(resident.getSelection(),null);
 const before=selected;assert.equal(await catalog.select('a'),null);assert.equal(selected,before+1,'retry must revalidate on the server; a failed read grants no access');
 fail=false;await catalog.refresh();await resident.refresh();assert.equal(resident.getSelection().case_id,'a');
 catalog.dispose();resident.dispose();assert.equal(c.size,0);
});
test('catalog and resident expire at the same deadline even while refresh never answers',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs'),{createResidentAgents}=await import('../despacho3d/resident-agents.mjs');
 const c=clock();let pending=false;const notices=[];
 const transport={listAuthorized:async()=>pending?new Promise(()=>{}):{ok:true,schema:1,cases:[profile('a')]},resolveCurrent:async()=>pending?new Promise(()=>{}):profile('a')};
 const resident=createResidentAgents({...c,transport,isVisible:()=>false,onChange:s=>notices.push(s)});
 const catalog=createAuthorizedCases({...c,transport});
 assert.equal(await resident.refresh(),true);assert.equal(await catalog.refresh(),true);pending=true;void resident.refresh();void catalog.refresh();
 await c.advance(119999);assert.ok(resident.getProfile());assert.equal(catalog.snapshot().cases.length,1);
 await c.advance(1);assert.equal(resident.getProfile(),null);assert.equal(catalog.snapshot().cases.length,0);
 assert.equal(notices.at(-1).phase,'reconnecting');assert.equal(notices.at(-1).selection,null);
 resident.dispose();catalog.dispose();assert.equal(c.size,0);
});
test('a revoked catalog immediately invalidates selection and cannot be undone by an old response',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs'),{createResidentAgents}=await import('../despacho3d/resident-agents.mjs');
 const c=clock();let denied=false,done,hold=false;
 const transport={listAuthorized:async()=>denied?{ok:false,error:'unauthorized'}:{ok:true,schema:1,cases:[profile('a')]},resolveCurrent:()=>hold?new Promise(r=>done=r):Promise.resolve(profile('a'))};
 const resident=createResidentAgents({...c,transport}),catalog=createAuthorizedCases({...c,transport,onChange:s=>resident.reconcileCatalog(s)});
 assert.equal(await catalog.refresh(),true);assert.equal(await resident.refresh(),true);hold=true;const pending=resident.refresh();
 denied=true;await catalog.refresh();assert.equal(resident.getProfile(),null);assert.equal(resident.snapshot().phase,'unauthorized');
 done(profile('a'));assert.equal(await pending,false);assert.equal(resident.getSelection(),null);
 catalog.dispose();resident.dispose();
});
test('fresh catalog omission revokes the active case and restoration requires fresh exact resolution',async()=>{
 const {createResidentAgents}=await import('../despacho3d/resident-agents.mjs');
 const c=clock();let calls=0;const resident=createResidentAgents({...c,transport:{resolveCurrent:async p=>{calls++;return profile(p?.case_id||'a');}}});
 assert.equal(await resident.selectCase('a'),true);resident.reconcileCatalog({phase:'current',cases:[profile('b')]});
 assert.equal(resident.getProfile(),null);assert.equal(resident.getSelection(),null);
 resident.reconcileCatalog({phase:'current',cases:[profile('a'),profile('b')]});await tick();
 assert.equal(resident.getSelection().case_id,'a');assert.equal(calls,2);resident.dispose();
});
test('single-flight refresh does not cancel an exact selection and stale replies never switch cases',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');const c=clock();let hold=false,listDone,caseDone,calls=0;
 const catalog=createAuthorizedCases({...c,transport:{listAuthorized:()=>{calls++;return hold?new Promise(r=>listDone=r):Promise.resolve({ok:true,schema:1,cases:[profile('a'),profile('b')]});},resolveCurrent:()=>new Promise(r=>caseDone=r)}});
 assert.equal(await catalog.refresh(),true);hold=true;const p=catalog.refresh(),q=catalog.refresh();const chosen=catalog.select('b');await tick();
 assert.equal(calls,2);listDone({ok:true,schema:1,cases:[profile('a'),profile('b')]});await Promise.all([p,q]);caseDone(profile('b'));
 assert.equal((await chosen).case_id,'b');catalog.dispose();
});
test('synchronous transport failures remain retryable and clock rollback denies authority',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');let fail=true,time=10,calls=0;
 const c=createAuthorizedCases({now:()=>time,schedule:()=>1,cancel(){},transport:{listAuthorized:()=>{calls++;if(fail)throw Error('timeout');return {ok:true,schema:1,cases:[profile('a')]};},resolveCurrent:async()=>profile('a')}});
 assert.equal(await c.refresh(),false);fail=false;assert.equal(await c.refresh(),true);assert.equal(calls,2);
 time=0;assert.equal(c.snapshot().cases.length,0);assert.equal(await c.select('a'),null);c.dispose();
});

test('backend unavailability keeps the current display lease and retries without treating it as revocation',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs'),{createResidentAgents,residentAccessDecision}=await import('../despacho3d/resident-agents.mjs');
 const c=clock();let fail=false,reads=0;
 const transport={listAuthorized:async()=>{reads++;if(fail)throw Error('backend_unavailable');return {ok:true,schema:1,cases:[profile('a')]};},resolveCurrent:async()=>{if(fail)throw Error('backend_unavailable');return profile('a');}};
 const resident=createResidentAgents({...c,transport,isVisible:()=>true}),catalog=createAuthorizedCases({...c,transport,onChange:s=>resident.reconcileCatalog(s)});
 await catalog.refresh();await resident.refresh();const selected=resident.getSelection();fail=true;
 await catalog.refresh();await resident.refresh();
 assert.equal(catalog.snapshot().phase,'reconnecting');assert.equal(catalog.snapshot().cases.length,1);
 assert.equal(residentAccessDecision(resident.snapshot(),selected,c.now()),'recovering');assert.equal(resident.getSelection(),null);
 fail=false;await c.advance(2000);assert.equal(reads,3);assert.equal(catalog.snapshot().phase,'current');assert.equal(resident.getSelection().case_id,'a');
 catalog.dispose();resident.dispose();assert.equal(c.size,0);
});
test('catalog retries stop after explicit revocation and cannot restore an expired display lease',async()=>{
 const {createAuthorizedCases}=await import('../despacho3d/authorized-cases.mjs');const c=clock();let response='ok',reads=0;
 const catalog=createAuthorizedCases({...c,transport:{listAuthorized:async()=>{reads++;if(response!=='ok')throw Error(response);return {ok:true,schema:1,cases:[profile('a')]};}}});
 await catalog.refresh();response='backend_unavailable';await catalog.refresh();await c.advance(120000);
 assert.equal(catalog.snapshot().cases.length,0);assert.equal(catalog.snapshot().phase,'reconnecting');
 response='unauthorized';await c.advance(15000);assert.equal(catalog.snapshot().phase,'unauthorized');const stopped=reads;
 response='ok';await c.advance(60000);assert.equal(reads,stopped);assert.equal(catalog.snapshot().cases.length,0);catalog.dispose();assert.equal(c.size,0);
});
