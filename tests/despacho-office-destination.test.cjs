'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const tick=()=>new Promise(r=>setImmediate(r));
test('map and 3D share live project destinations without a private fallback route',async()=>{
 const {openOfficeDestination}=await import('../despacho3d/office-destination.mjs');
 const calls=[],residents={getSelection:()=>({case_id:'SYNTHETIC-B'})},workspace={openForCase:async(...args)=>{calls.push(args);return true;}},menu={showRadial:id=>{calls.push([id,'radial']);return true;}};
 for(const [id,target]of [['computer','ppp'],['library','activity'],['decisions','meeting']]){
  const result=openOfficeDestination(id,{residents,workspace,menu});assert.equal(result.handled,true);assert.equal(await result.opened,true);assert.deepEqual(calls.at(-1),['SYNTHETIC-B',target]);
 }
 assert.equal(openOfficeDestination('case',{residents,workspace,menu}).opened,true);
 assert.deepEqual(calls.at(-1),['SYNTHETIC-B','radial']);
 assert.deepEqual(openOfficeDestination('reception',{residents,workspace,menu}),{handled:false,opened:false});
 assert.deepEqual(openOfficeDestination('computer',{residents:{getSelection:()=>null},workspace}),{handled:true,opened:false});assert.equal(calls.length,4);
});
test('expired selection or revocation while closing a sheet cannot open a destination',async()=>{
 const {openOfficeDestination}=await import('../despacho3d/office-destination.mjs');let current={case_id:'SYNTHETIC-A'},calls=0;
 const r=openOfficeDestination('decisions',{residents:{getSelection:()=>current},workspace:{openForCase:()=>calls++},beforeOpen:()=>{current=null;}});
 assert.equal(r.opened,false);assert.equal(calls,0);
});
function residents(){
 let current={case_id:'a'},profiles=[{id:'a',case_id:'a',entity_kind:'case',name:'A'},{id:'b',case_id:'b',entity_kind:'case',name:'B'}],watch;
 return {getSelection:()=>current,getAuthorizedProfiles:()=>profiles,selectCase:async id=>{current={case_id:id};return true;},
 subscribeAuthorizedProfiles(fn){watch=fn;fn(profiles);return()=>{watch=null;};},
 update(p){profiles=p;watch?.(p);},select(p){current=p;},notify(){watch?.(profiles);}};
}
test('picker revalidates another authorized case and tolerates a catalog repaint during selection',async()=>{
 const {createOfficeCasePicker}=await import('../despacho3d/office-destination.mjs');const api=residents(),opened=[];
 api.selectCase=async id=>{api.notify();await tick();api.select({case_id:id});return true;};
 const picker=createOfficeCasePicker({getResidents:()=>api,openCase:id=>{opened.push(id);return true;}});picker.bind();
 assert.equal(await picker.pick('outside'),false);assert.equal(await picker.pick('b'),true);assert.deepEqual(opened,['b']);assert.equal(picker.snapshot().selected,'b');picker.dispose();
});
test('picker cannot open a revoked, disposed or changed case after an in-flight selection',async()=>{
 const {createOfficeCasePicker}=await import('../despacho3d/office-destination.mjs');
 for(const reason of ['revoked','disposed','changed']){
  const api=residents();let done,calls=0;api.selectCase=()=>new Promise(r=>done=r);
  const picker=createOfficeCasePicker({getResidents:()=>api,openCase:()=>{calls++;return true;}});picker.bind();
  const pending=picker.pick('b');await tick();
  if(reason==='revoked')api.update([]);
  if(reason==='disposed')picker.dispose();
  api.select({case_id:reason==='changed'?'a':'b'});done(true);assert.equal(await pending,false);assert.equal(calls,0);picker.dispose();
 }
});
test('a failed same-case lease keeps picker operable for a later fresh retry',async()=>{
 const {createOfficeCasePicker}=await import('../despacho3d/office-destination.mjs');const api=residents();let calls=0;
 api.select(null);api.selectCase=async()=>false;
 const picker=createOfficeCasePicker({getResidents:()=>api,openCase:()=>{calls++;return true;}});picker.bind();
 assert.equal(await picker.pick('b'),false);assert.equal(picker.snapshot().busy,null);assert.equal(calls,0);
 api.selectCase=async id=>{api.select({case_id:id});return true;};assert.equal(await picker.pick('b'),true);assert.equal(calls,1);picker.dispose();
});
