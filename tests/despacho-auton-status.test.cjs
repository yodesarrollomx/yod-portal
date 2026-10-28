const test=require('node:test'),assert=require('node:assert/strict');
const stamp='2026-10-28T17:00:00.000Z',now=Date.parse(stamp);
const status=(id='case-a')=>({ok:true,schema:1,case_id:id,admission:'alta',activity:'waiting',reason:'recorded_wait_not_live',source_ref:'Proyectos!2',source_revision:'2026-10-28',observed_at:stamp,library_only:false});
const work=id=>({ok:true,available:false,case_id:id,work:null,screen:null});
const profile=id=>({id,case_id:id,entity_kind:'case'});
const settle=()=>new Promise(r=>setImmediate(r));
test('documentary case shows source status without calling or claiming an execution engine',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let time=now,calls=0;
 const r=createRoomWork({observeAutonStatus:true,now:()=>time,schedule:()=>1,cancel:()=>{},request:async()=>{calls++;throw Error('must_not_request');}});
 r.reconcile([{...profile('case-a'),record_only:true,auton_status:status()}]);await settle();assert.equal(calls,0);assert.equal(r.snapshot()[0].auton_status.activity,'waiting');assert.equal(r.snapshot()[0].available,false);
 time+=90001;await r.refresh();assert.equal(r.snapshot()[0].auton_status,undefined);assert.equal(r.snapshot()[0].phase,'unavailable');assert.equal(calls,0);r.dispose();
});
test('seven authorized cases are observed without dropping the last one',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');const seen=[];
 const r=createRoomWork({now:()=>now,schedule:()=>1,cancel:()=>{},request:async(_,__,id)=>{seen.push(id);return work(id);}});
 r.reconcile(Array.from({length:7},(_,i)=>profile('case-'+i)));await settle();assert.equal(seen.length,7);assert.equal(r.snapshot().length,7);r.dispose();
});
test('status validates case, freshness, semantic pairs and strips private extras',async()=>{
 const {validateAutonStatus:v}=await import('../despacho3d/auton-status.mjs');
 assert.equal(v({...status(),notes:'private'},'case-a',now).notes,undefined);
 for(const mutate of [s=>s.case_id='case-b',s=>s.observed_at='invalid',s=>s.observed_at=new Date(now-90001).toISOString(),s=>s.observed_at=new Date(now+5001).toISOString(),s=>s.admission='manual',s=>s.library_only=true,s=>s.activity=null,s=>s.source_ref='a\nb']){
  const s=status();mutate(s);assert.throws(()=>v(s,'case-a',now),/invalid_auton_status/);
 }
 for(const admission of ['standby','baja','unconfirmed'])assert.equal(v({...status(),admission,activity:null,library_only:admission==='baja'},'case-a',now).admission,admission);
});
test('disabled flag makes no extra requests; enabled observes exact cases with empty body',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');
 for(const enabled of [false,true]){
  const calls=[];const r=createRoomWork({observeAutonStatus:enabled,now:()=>now,schedule:()=>1,cancel:()=>{},request:async(path,data,id)=>{calls.push([path,data,id]);return path==='/computer/work'?work(id):status(id);}});
  r.reconcile(['case-a','case-b'].map(profile));await settle();
  assert.equal(calls.filter(x=>x[0]==='/fast/auton-status').length,enabled?2:0);
  if(enabled){assert.ok(calls.every(x=>Object.keys(x[1]).length===0));assert.deepEqual(r.snapshot().map(x=>x.auton_status.case_id),['case-a','case-b']);}r.dispose();
 }
});
test('optional source outage clears old status without hiding work; forbidden clears whole view',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let error=null;
 const r=createRoomWork({observeAutonStatus:true,now:()=>now,schedule:()=>1,cancel:()=>{},request:async(path,_,id)=>{if(path==='/computer/work')return work(id);if(error)throw Error(error);return status(id);}});
 r.reconcile([profile('case-a')]);await settle();assert.equal(r.snapshot()[0].auton_status.activity,'waiting');
 error='unavailable';await r.refresh();assert.equal(r.snapshot()[0].auton_status,null);
 error='forbidden';await r.refresh();assert.equal(r.snapshot()[0].phase,'unauthorized');assert.equal(r.snapshot()[0].auton_status,undefined);r.dispose();
});
test('revoked case cannot return a pending status to the office',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let resolve;
 const r=createRoomWork({observeAutonStatus:true,now:()=>now,schedule:()=>1,cancel:()=>{},request:async(path,_,id)=>path==='/computer/work'?work(id):new Promise(r=>resolve=r)});
 r.reconcile([profile('case-a')]);await settle();r.reconcile([]);resolve(status());await settle();assert.deepEqual(r.snapshot(),[]);r.dispose();
});
test('computer outage still reads independent source status; access revocation does not',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let error='unavailable';const calls=[];
 const r=createRoomWork({observeAutonStatus:true,now:()=>now,schedule:()=>1,cancel:()=>{},request:async(path,_,id)=>{calls.push(path);if(path==='/computer/work')throw Error(error);return status(id);}});
 r.reconcile([profile('case-a')]);await settle();assert.equal(r.snapshot()[0].auton_status.activity,'waiting');assert.equal(r.snapshot()[0].available,false);
 calls.length=0;error='forbidden';await r.refresh();assert.deepEqual(calls,['/computer/work']);assert.equal(r.snapshot()[0].phase,'unauthorized');assert.equal(r.snapshot()[0].auton_status,undefined);r.dispose();
});
