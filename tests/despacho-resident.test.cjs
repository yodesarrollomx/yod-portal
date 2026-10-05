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
