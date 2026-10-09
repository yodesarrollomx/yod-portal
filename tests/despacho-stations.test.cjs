const test=require('node:test'),assert=require('node:assert/strict');
const stamp='2026-10-09T05:00:00.000Z',now=Date.parse(stamp);
const profile=id=>({id,case_id:id,entity_kind:'case',name:'Autón '+id});
const fixture=(caseId='case-a',tool='Leyendo documento')=>({ok:true,available:true,case_id:caseId,screen:null,
 observed_at:stamp,history_available:true,runtime:{phase:'working',updated_at:stamp,continues_without_viewer:true,goal_poll_ms:60000,concurrency:1},
 work:{schema:1,case_id:caseId,run_id:'run-'+caseId,goal_id:'goal-'+caseId,source_revision:'s1',title:'Encargo sintético',criterion:'Evidencia',phase:'tool',started_at:stamp,updated_at:stamp,current_tool:tool,
 progress:{sequence:1,progress:{tasks:[{id:'task-1',title:'Consultar',status:'running',summary:''}],evidence:[],summary:''}},sources:[],events:[],result:null,
 metrics:{total:1,ready_for_review:0,blocked:0,running:1,pending:0,evidence_count:0,review_required:true},event_count:0}});
const view=(id,tool)=>({...fixture(id,tool),phase:'ready',checked_at:now});
const settle=()=>new Promise(r=>setImmediate(r));
function screened(id='case-a',revision=1){const f=fixture(id,'Abriendo fuente web');f.screen={captured_at:stamp,revision,owner:{case_id:id,run_id:f.work.run_id,goal_id:f.work.goal_id,task_id:'task-1'}};return f;}
const capture=f=>({image:'data:image/jpeg;base64,YQ==',captured_at:f.screen.captured_at,revision:f.screen.revision,capture_work:{...f.screen.owner}});
test('runtime and metrics are additive for old deployments and fail closed when malformed',async()=>{
 const {validateObservation}=await import('../despacho3d/work-observer.mjs');const f=fixture();
 const r=validateObservation(f,'case-a');assert.equal(r.runtime.concurrency,1);assert.equal(r.work.metrics.running,1);
 const old=structuredClone(f);delete old.runtime;delete old.observed_at;delete old.history_available;delete old.work.metrics;delete old.work.event_count;
 assert.equal(validateObservation(old,'case-a').runtime,undefined);
 for(const mutate of [v=>delete v.observed_at,v=>v.runtime.concurrency=2,v=>v.runtime.phase='invented',v=>v.work.metrics.running=0,v=>v.work.metrics.total=2,v=>v.work.event_count=-1]){
  const bad=structuredClone(f);mutate(bad);assert.throws(()=>validateObservation(bad,'case-a'),/invalid_observation/);
 }
 const many=structuredClone(f);many.work.events=Array.from({length:200},()=>({case_id:'case-a',run_id:f.work.run_id,goal_id:f.work.goal_id,label:'Hecho',at:stamp,status:'completed'}));many.work.event_count=230;
 assert.equal(validateObservation(many,'case-a').work.events.length,200);many.work.event_count=199;assert.throws(()=>validateObservation(many,'case-a'));
 many.work.event_count=201;many.work.events.push(many.work.events[0]);assert.throws(()=>validateObservation(many,'case-a'));
});
test('JPEG key checks exact case, run, goal, task, timestamp and revision',async()=>{
 const {observationCaptureKey,validatedCapture}=await import('../despacho3d/work-observer.mjs');const f=screened(),c=capture(f);
 assert.ok(observationCaptureKey(f));assert.equal(validatedCapture(c,f),c.image);
 for(const key of ['case_id','run_id','goal_id','task_id']){const bad=structuredClone(c);bad.capture_work[key]='other';assert.equal(validatedCapture(bad,f),null);}
 assert.equal(validatedCapture({...c,revision:2},f),null);assert.equal(validatedCapture({...c,image:'data:image/svg+xml,unsafe'},f),null);
 assert.equal(observationCaptureKey({...f,screen:{...f.screen,owner:{...f.screen.owner,goal_id:'other'}}}),null);
});
test('one serial round observes all members before the pause; an unavailable member does not stop others',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let active=0,peak=0;const calls=[],timers=[];
 const room=createRoomWork({now:()=>now,schedule:(fn,ms)=>{timers.push(ms);return 1;},cancel:()=>{},request:async(path,data,id)=>{active++;peak=Math.max(peak,active);calls.push([path,id]);await Promise.resolve();active--;if(id==='case-b')throw Error('offline');return fixture(id);}});
 room.reconcile(['case-a','case-b','case-c'].map(profile));await settle();
 assert.equal(peak,1);assert.deepEqual(calls.map(v=>v[1]),['case-a','case-b','case-c']);assert.deepEqual(timers,[5000]);assert.equal(room.snapshot().find(s=>s.case_id==='case-b').phase,'unavailable');room.dispose();
});
test('JPEG is reused until its revision changes and total room cache is bounded',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let revision=1;const calls=[];
 const room=createRoomWork({now:()=>now,schedule:()=>1,cancel:()=>{},maxImageBytes:30,request:async(path,data,id)=>{calls.push(path);const f=screened(id,revision);return path==='/computer/work'?f:capture(f);}});
 room.reconcile([profile('case-a'),profile('case-b')]);await settle();assert.equal(room.snapshot().filter(s=>s.image).length,1);
 await room.refresh();assert.equal(calls.filter(p=>p==='/computer/state').length,2,'same evicted capture does not churn every poll');
 revision++;await room.refresh();assert.equal(calls.filter(p=>p==='/computer/state').length,4);assert.equal(room.snapshot().filter(s=>s.image).length,1);
 room.reconcile([]);assert.deepEqual(room.snapshot(),[]);room.dispose();
});
test('remove and re-add while reading discards the old authorization generation',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let resolve;const room=createRoomWork({schedule:()=>1,cancel:()=>{},request:()=>new Promise(r=>resolve=r)});
 room.reconcile([profile('case-a')]);room.reconcile([]);room.reconcile([profile('case-a')]);resolve(fixture());await settle();assert.deepEqual(room.snapshot(),[]);room.dispose();
});
test('forbidden capture clears observations, image and progress immediately',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');const room=createRoomWork({now:()=>now,schedule:()=>1,cancel:()=>{},request:async(path)=>{if(path==='/computer/state')throw Error('forbidden');return screened();}});
 room.reconcile([profile('case-a')]);await settle();const s=room.snapshot()[0];assert.equal(s.phase,'unauthorized');assert.equal(s.work,null);assert.equal(s.image,null);room.dispose();
});
test('station ownership follows actual work and is independent of UI selection and input order',async()=>{
 const {assignStationOwners,observedStation}=await import('../despacho3d/station-ownership.mjs');
 const a=view('case-a'),b=view('case-b','Abriendo fuente web'),opts={now,profiles:[profile('case-a'),profile('case-b')]};
 assert.equal(observedStation(a,now),'library');assert.equal(observedStation(b,now),'research');
 const owners=assignStationOwners([b,a],opts);assert.equal(owners.library.case_id,'case-a');assert.equal(owners.research.case_id,'case-b');assert.equal(owners.research.station_owner.goal_id,b.work.goal_id);
 assert.deepEqual(assignStationOwners([a,b],opts),owners);
 assert.equal(assignStationOwners([a],{...opts,occupants:[]}).library,null);
 assert.equal(assignStationOwners([a],{...opts,occupants:[{case_id:'case-a',station:'library',moving:false}]}).library.case_id,'case-a');
 assert.equal(observedStation({...a,phase:'unavailable'},now),null);assert.equal(observedStation(a,now+90001),null);
});
test('waiting capacity never displays previous progress as current station work',async()=>{
 const {assignStationOwners,observedStation}=await import('../despacho3d/station-ownership.mjs');const a=view('case-a');a.work.phase='prepared';a.runtime.phase='review_required';
 assert.equal(observedStation(a,now),'meeting');a.runtime.phase='waiting_capacity';assert.equal(observedStation(a,now),null);
 assert.deepEqual(assignStationOwners([a],{now}),{library:null,research:null,meeting:null});a.runtime.phase='working';assert.equal(observedStation(a,now),null);
});
test('motion shares the station projection, including queued work and desk research',async()=>{
 const {workDestination}=await import('../despacho3d/resident-motion.mjs');const a=view('case-a');assert.equal(workDestination(a,now),'library');a.work.current_tool='Abriendo fuente web';assert.equal(workDestination(a,now),'inicio');a.runtime.phase='waiting_capacity';assert.equal(workDestination(a,now),'inicio');
});
test('screen reuses one decoded image until capture changes and cancels it on release',async()=>{
 const fs=require('node:fs'),{screenStatus}=await import('../despacho3d/office-screen-status.mjs'),{workHeadline,observationCaptureKey}=await import('../despacho3d/work-observer.mjs');
 const source=fs.readFileSync(require.resolve('../despacho3d/office-screen.mjs'),'utf8').replace(/^import.*\n/gm,'').replace(/^export /gm,'');
 let images=0,disposed=0;const painted=[];const ctx={fillRect(){},fillText(value){painted.push(String(value));},drawImage(){},measureText:t=>({width:t.length*10})};
 const document={createElement:()=>({getContext:()=>ctx})};class Image{set src(value){if(value){images++;this.onload?.();}}}
 const T={SRGBColorSpace:'s',CanvasTexture:class{dispose(){disposed++;}}};
 const createOfficeScreen=new Function('T','screenStatus','workHeadline','observationCaptureKey','document','Image',source+';return createOfficeScreen;')(T,screenStatus,workHeadline,observationCaptureKey,document,Image);
 const screen=createOfficeScreen({material:{},userData:{}}),f={...screened(),phase:'ready',image:capture(screened()).image};
 f.work.progress.progress.tasks[0].title='Texto\ncon\tespacios';screen.update(f);assert.ok(painted.includes('Texto con espacios'));assert.equal(images,1);screen.update({...f,work:{...f.work,updated_at:'2026-10-09T05:00:01.000Z'}});assert.equal(images,1);
 screen.update({...f,screen:{...f.screen,revision:2}});assert.equal(images,2);screen.update({phase:'unauthorized',case_id:null,work:null});screen.dispose();assert.equal(disposed,1);
});
