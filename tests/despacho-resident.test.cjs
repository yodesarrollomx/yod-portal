'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const selection={ok:true,case_id:'SYNTHETIC-CASE',name:'Expediente de ejemplo',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true,
 avatar:{id:'SYNTHETIC-CASE',case_id:'SYNTHETIC-CASE',entity_kind:'case',name:'Expediente de ejemplo',form:'child',color:'#547e75',visual:{hairStyle:'crop'}}};
const load=()=>import('../despacho3d/resident-agents.mjs');
test('authorized resident appears without reading conversation history or opening its panel',async()=>{
 const {createResidentAgents}=await load();let resolves=0,reads=0;const states=[];
 const room=createResidentAgents({transport:{resolveCurrent:async()=>{resolves++;return selection;},read(){reads++;throw Error('history must not block presence');}},schedule:()=>1,cancel(){},onChange:s=>states.push(s)});
 const a=room.refresh(),b=room.refresh();assert.equal(await a,true);assert.equal(await b,true);
 assert.equal(resolves,1);assert.equal(reads,0);assert.deepEqual(room.getProfile(),selection.avatar);
 assert.equal(room.snapshot().phase,'preparing');room.markPrepared(selection.case_id,true);assert.equal(room.snapshot().phase,'standby');
 const copy=room.getSelection();copy.name='mutated';assert.equal(room.getSelection().name,selection.name);room.dispose();
});
test('revocation removes the resident immediately and late preparation cannot restore it',async()=>{
 const {createResidentAgents}=await load();let denied=false;const notices=[];
 const room=createResidentAgents({transport:{resolveCurrent:async()=>denied?{ok:false,error:'unauthorized'}:selection},schedule:()=>1,cancel(){}});
 room.subscribeProfile(p=>notices.push(p));await room.refresh();room.markPrepared(selection.case_id,true);
 denied=true;assert.equal(await room.refresh(),false);assert.equal(room.getSelection(),null);assert.equal(room.getProfile(),null);
 room.markPrepared(selection.case_id,true);assert.equal(room.snapshot().phase,'unauthorized');assert.equal(notices.at(-1),null);room.dispose();
});
test('temporary outage shows an inactive resident; expired authority removes its figure',async()=>{
 const {createResidentAgents}=await load();let time=1,failed=false;
 const room=createResidentAgents({transport:{resolveCurrent:async()=>{if(failed)throw Error('timeout');return selection;}},now:()=>time,schedule:()=>1,cancel(){}});
 await room.refresh();failed=true;time=50000;await room.refresh();assert.equal(room.snapshot().phase,'reconnecting');
 assert.deepEqual(room.getProfile(),selection.avatar);assert.equal(room.getSelection(),null);
 time=130000;await room.refresh();assert.equal(room.getProfile(),null);room.dispose();
});
test('disposal and invalid identities cannot restore a profile from a pending request',async()=>{
 const {createResidentAgents}=await load();let resolve;
 const room=createResidentAgents({transport:{resolveCurrent:()=>new Promise(r=>resolve=r)},schedule:()=>1,cancel(){}});
 const pending=room.refresh();room.dispose();resolve(selection);assert.equal(await pending,false);assert.equal(room.getProfile(),null);
 const bad=createResidentAgents({transport:{resolveCurrent:async()=>({...selection,avatar:{...selection.avatar,case_id:'OTHER'}})},schedule:()=>1,cancel(){}});
 assert.equal(await bad.refresh(),false);assert.equal(bad.getProfile(),null);bad.dispose();
});
test('OS shares identical in-flight reads without sharing results across session epochs',async()=>{
 const source=fs.readFileSync(require.resolve('../os/despacho-conversation.js'),'utf8');
 let receive,epoch=1,allowed=true,calls=0,resolve;const results=[];
 const frame={postMessage:value=>results.push(value)},root={location:{origin:'https://synthetic.invalid'},addEventListener:(name,fn)=>receive=fn,removeEventListener(){}};
 vm.runInNewContext(source,{globalThis:root,Map,JSON,setTimeout,clearTimeout});
 const bridge=root.YodDespachoConversation.bind({getEpoch:()=>epoch,isAuthorized:()=>allowed,getIframeWindow:()=>frame,
  getTransport:()=>({resolveCurrent:()=>{calls++;return new Promise(r=>resolve=r);}})});
 const event=id=>({origin:root.location.origin,source:frame,data:{type:'yod:case:request',version:1,id,method:'resolveCurrent',payload:{}}});
 const a=receive(event('one')),b=receive(event('two'));assert.equal(calls,1);resolve(selection);await Promise.all([a,b]);
 assert.deepEqual(results.map(v=>v.id).sort(),['one','two']);assert.ok(results.every(v=>v.result.case_id===selection.case_id));
 const c=receive(event('three')),d=receive(event('four'));epoch++;allowed=false;bridge.clear();resolve(selection);await Promise.all([c,d]);
 assert.equal(results.length,2);bridge.dispose();
});

test('station distinguishes a short access outage from revocation, expiry and case change',async()=>{
 const {residentAccessDecision}=await load(),current={case_id:'SYNTHETIC-CASE'},state={phase:'reconnecting',checked_at:1000,selection};
 assert.equal(residentAccessDecision(state,current,50000),'recovering');
 assert.equal(residentAccessDecision(state,current,121000),'lost');
 assert.equal(residentAccessDecision({...state,phase:'unauthorized'},current,50000),'lost');
 assert.equal(residentAccessDecision({...state,selection:null},current,50000),'lost');
 assert.equal(residentAccessDecision({...state,selection:{case_id:'OTHER'}},current,50000),'lost');
 assert.equal(residentAccessDecision({...state,phase:'standby'},current,50000),'current');
 assert.equal(residentAccessDecision(state,null,50000),'none');
});

test('lock_busy preserves a current voice lease and recovers without treating contention as revocation',async()=>{
 const {createResidentAgents,residentAccessDecision}=await load();let time=1000,busy=false,delay;
 const room=createResidentAgents({transport:{resolveCurrent:async()=>busy?{ok:false,error:'lock_busy'}:selection},
  now:()=>time,schedule:(_fn,ms)=>{delay=ms;return 1;},cancel(){}});
 await room.refresh();const current=room.getSelection();room.markPrepared(current.case_id,true);
 busy=true;time=61000;assert.equal(await room.refresh(),false);
 assert.equal(room.snapshot().phase,'reconnecting');
 assert.equal(residentAccessDecision(room.snapshot(),current,time),'recovering');
 assert.equal(room.getSelection(),null);assert.deepEqual(room.getProfile(),selection.avatar);
 assert.equal(room.snapshot().checked_at,1000);assert.equal(delay,2000);
 busy=false;time=63000;assert.equal(await room.refresh(),true);
 assert.equal(residentAccessDecision(room.snapshot(),current,time),'current');
 assert.equal(room.getSelection().case_id,current.case_id);room.dispose();
});
test('lock_busy grants no first access and cannot extend an expired authorization',async()=>{
 const {createResidentAgents,residentAccessDecision}=await load();let time=1000,busy=true;
 const room=createResidentAgents({transport:{resolveCurrent:async()=>busy?{ok:false,error:'lock_busy'}:selection},
  now:()=>time,schedule:()=>1,cancel(){}});
 await room.refresh();assert.equal(room.getProfile(),null);assert.equal(room.getSelection(),null);
 busy=false;await room.refresh();const current=room.getSelection();
 busy=true;time=121000;await room.refresh();
 assert.equal(room.getProfile(),null);assert.equal(residentAccessDecision(room.snapshot(),current,time),'lost');
 assert.equal(room.snapshot().checked_at,1000);room.dispose();
});
test('missing current project requires explicit selection without granting or revoking a session',async()=>{
 const {createResidentAgents}=await load();const requested=[];
 const room=createResidentAgents({transport:{resolveCurrent:async p=>{requested.push(p);return p.case_id?selection:{ok:false,error:'despacho_not_ready'};}},schedule:()=>1,cancel(){}});
 assert.equal(await room.refresh(),false);assert.equal(room.snapshot().phase,'selection_required');
 assert.equal(room.snapshot().checked_at,null);assert.equal(room.getSelection(),null);assert.equal(room.getProfile(),null);
 room.reconcileCatalog({phase:'current',cases:[selection]});await tick();assert.equal(requested.length,1,'no automatic project choice');
 assert.equal(await room.selectCase(selection.case_id),true);assert.deepEqual(requested[1],{case_id:selection.case_id});
 assert.equal(room.getSelection().case_id,selection.case_id);room.dispose();
 const denied=createResidentAgents({transport:{resolveCurrent:async()=>({ok:false,error:'despacho_not_ready'})},schedule:()=>1,cancel(){}});
 denied.reconcileCatalog({phase:'unauthorized'});await denied.refresh();assert.equal(denied.snapshot().phase,'unauthorized');assert.equal(denied.getSelection(),null);denied.dispose();
});
test('slow authorized catalog neither blocks exact project reads nor survives a session clear',async()=>{
 const source=fs.readFileSync(require.resolve('../os/despacho-conversation.js'),'utf8');let receive,epoch=1,catalogDone,catalogCalls=0,caseCalls=0;const replies=[];
 const frame={postMessage:x=>replies.push(x)},root={location:{origin:'https://synthetic.invalid'},addEventListener:(_n,fn)=>receive=fn,removeEventListener(){}};
 vm.runInNewContext(source,{globalThis:root,Map,JSON,setTimeout,clearTimeout});
 const bridge=root.YodDespachoConversation.bind({getEpoch:()=>epoch,isAuthorized:()=>true,getIframeWindow:()=>frame,getTransport:()=>({
  listAuthorized:()=>{catalogCalls++;return new Promise(r=>catalogDone=r);},resolveCurrent:async()=>{caseCalls++;return selection;}})});
 const event=(id,method,payload)=>({origin:root.location.origin,source:frame,data:{type:'yod:case:request',version:1,id,method,payload}});
 const p=receive(event('catalog','listAuthorized',{})),shared=receive(event('same','listAuthorized',{}));
 await receive(event('case','resolveCurrent',{case_id:selection.case_id}));
 assert.equal(catalogCalls,1);assert.equal(caseCalls,1);assert.equal(replies.length,1);assert.equal(replies[0].id,'case');assert.equal(replies[0].error,null);
 epoch++;bridge.clear();catalogDone({ok:true,schema:1,cases:[selection]});await Promise.all([p,shared]);assert.equal(replies.length,1,'late catalog discarded after session change');
 bridge.dispose();
});
