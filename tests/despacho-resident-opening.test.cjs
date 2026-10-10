'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const tick=()=>new Promise(r=>setImmediate(r));
function rig(){
 let selected='a',ticket=0,pending=null,can=true;
 const reads=[],opened=[],notices=[],profiles=['a','b','c'].map(id=>({id,case_id:id,entity_kind:'case',name:id}));
 const api={getSelection:()=>selected?{case_id:selected}:null,getAuthorizedProfiles:()=>profiles,selectCase:async(id,{isCurrent})=>{reads.push(id);await tick();if(!isCurrent())return false;selected=id;return true;}};
 const menu={showPending(id,options={}){pending={id,ticket:++ticket};notices.push({id,...options});return ticket;},isPending:(id,n)=>pending?.id===id&&pending.ticket===n,showRadial:id=>{pending=null;opened.push(id);return true;}};
 return{api,menu,reads,opened,notices,setAllowed:value=>can=value,canSelect:()=>can,cancel:()=>{pending=null;},current:()=>selected};
}
test('all authorized residents use identical selection and menu; current resident opens without another round trip',async()=>{
 const {createResidentOpening}=await import('../despacho3d/resident-opening.mjs'),r=rig(),open=createResidentOpening({getResidents:()=>r.api,getMenu:()=>r.menu,canSelect:r.canSelect});
 for(const id of ['a','b','c','a'])assert.equal(await open(id),true);
 assert.deepEqual(r.opened,['a','b','c','a']);assert.deepEqual(r.reads,['b','c','a']);
 assert.equal(await open('outside'),false);assert.equal(r.notices.length,3);
});
test('slow selection is acknowledged before resolution and a cancelled pending menu never reopens',async()=>{
 const {createResidentOpening}=await import('../despacho3d/resident-opening.mjs'),r=rig();let finish;
 r.api.selectCase=(id,{isCurrent})=>new Promise(resolve=>{finish=()=>resolve(isCurrent());});
 const open=createResidentOpening({getResidents:()=>r.api,getMenu:()=>r.menu,canSelect:r.canSelect}),pending=open('b');
 assert.deepEqual(r.notices,[{id:'b'}]);r.cancel();finish();assert.equal(await pending,false);assert.deepEqual(r.opened,[]);assert.equal(r.current(),'a');
});
test('active voice blocks switching with a visible explanation, without changing the selected project',async()=>{
 const {createResidentOpening}=await import('../despacho3d/resident-opening.mjs'),r=rig();r.setAllowed(false);
 const open=createResidentOpening({getResidents:()=>r.api,getMenu:()=>r.menu,canSelect:r.canSelect});
 assert.equal(await open('b'),false);assert.equal(r.current(),'a');assert.equal(r.reads.length,0);assert.match(r.notices[0].message,/voz en curso/);
 assert.equal(await open('a'),true);
});
test('failed authorization remains visible and retryable; mismatched selections never open',async()=>{
 const {createResidentOpening}=await import('../despacho3d/resident-opening.mjs');
 for(const result of [false,true]){const r=rig();r.api.selectCase=async()=>result;const open=createResidentOpening({getResidents:()=>r.api,getMenu:()=>r.menu});
 assert.equal(await open('b'),false);assert.deepEqual(r.opened,[]);assert.equal(r.notices.at(-1).retry,true);}
});
test('voice that starts during revalidation or a superseding request cannot redirect an existing conversation',async()=>{
 const {createResidentOpening}=await import('../despacho3d/resident-opening.mjs'),r=rig();let finish;
 r.api.selectCase=(id,{isCurrent})=>new Promise(resolve=>{finish=()=>resolve(isCurrent());});
 const open=createResidentOpening({getResidents:()=>r.api,getMenu:()=>r.menu,canSelect:r.canSelect}),p=open('b');
 r.setAllowed(false);finish();assert.equal(await p,false);assert.equal(r.current(),'a');assert.equal(r.opened.length,0);
});
