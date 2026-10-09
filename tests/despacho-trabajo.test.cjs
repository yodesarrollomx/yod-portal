const test=require('node:test'),assert=require('node:assert/strict');
const fixture=()=>({"ok":true,"available":true,"case_id":"case-synthetic","work":{"schema":1,"case_id":"case-synthetic","run_id":"run-synthetic","goal_id":"goal-synthetic","source_revision":"r1","title":"Revisar la fuente del proyecto","criterion":"Resultado con procedencia","phase":"tool","started_at":"2026-10-06T10:00:00Z","updated_at":"2026-10-06T10:01:00Z","current_tool":"Leyendo documento","progress":{"sequence":1,"progress":{"tasks":[{"id":"task-1","title":"Leer la fuente","criterion":"Documento verificable","status":"running","summary":"","evidence_ids":[]}],"evidence":[],"summary":""}},"sources":[{"case_id":"case-synthetic","run_id":"run-synthetic","goal_id":"goal-synthetic","task_id":"task-1","id":"source-synthetic","title":"Fuente de prueba","url":"https://example.com/source","kind":"web","consulted_at":"2026-10-06T10:01:00Z"}],"events":[],"result":null},"screen":{"captured_at":null,"revision":0,"owner":null}});
const mod=()=>import('../despacho3d/work-observer.mjs');
test('observation binds case, run and sources and rejects mismatched or unbounded data',async()=>{
 const {validateObservation,workHeadline}=await mod(),f=fixture();
 assert.equal(validateObservation(f,f.case_id).work.goal_id,'goal-synthetic');
 assert.equal(workHeadline({phase:'ready',...validateObservation(f,f.case_id)}),'Leyendo documento');
 for(const mutate of [x=>x.case_id='other',x=>x.work.case_id='other',x=>x.work.sources[0].run_id='other',x=>x.work.sources[0].url='javascript:alert(1)',x=>x.work.progress.progress.tasks[0].status='invented',x=>x.work.title='x'.repeat(161)]){
  const x=fixture();mutate(x);assert.throws(()=>validateObservation(x,f.case_id));
 }
 assert.equal(workHeadline({phase:'unavailable',case_id:f.case_id,work:f.work}),'Sin conexión con la actividad');
});
test('read-only polling never navigates, caches matching capture, stops on revoke and rejects late responses',async()=>{
 const {createWorkObserver}=await mod();let selection={case_id:'case-synthetic'},data=fixture(),resolve,requests=[];
 const o=createWorkObserver({getSelection:()=>selection,schedule:()=>1,cancel:()=>{},request:async path=>{requests.push(path);if(resolve===true)return new Promise(r=>{resolve=r;});return data;}});
 o.select();await new Promise(r=>setImmediate(r));assert.equal(o.snapshot().phase,'ready');assert.deepEqual(requests,['/computer/work']);
 resolve=true;const p=o.refresh();await new Promise(r=>setImmediate(r));selection=null;o.select();resolve(data);await p;
 assert.equal(o.snapshot().case_id,null);assert.equal(o.snapshot().work,null);
 o.dispose();assert.ok(requests.every(p=>p==='/computer/work'));
});
test('capture is retrieved once and never reused for another execution',async()=>{
 const {createWorkObserver}=await mod();let f=fixture(),calls=[];
 f.screen={captured_at:'2026-10-06T10:02:00Z',revision:2,owner:{case_id:f.case_id,run_id:f.work.run_id,goal_id:f.work.goal_id,task_id:'task-1'}};
 const o=createWorkObserver({getSelection:()=>({case_id:f.case_id}),schedule:()=>1,cancel:()=>{},request:async path=>{calls.push(path);return path==='/computer/work'?structuredClone(f):{ok:true,capture_work:f.screen.owner,captured_at:f.screen.captured_at,revision:f.screen.revision,image:'data:image/jpeg;base64,YQ=='};}});
 o.select();await new Promise(r=>setImmediate(r));await o.refresh();assert.equal(calls.filter(p=>p==='/computer/state').length,1);assert.ok(o.snapshot().image);
 f.work.run_id='new-run';f.work.sources=[];await o.refresh();assert.equal(o.snapshot().image,null);assert.equal(calls.filter(p=>p==='/computer/state').length,1);o.dispose();
});

test('slow or failed screenshot does not delay or erase confirmed activity; retry stays read only',async()=>{
 const {createWorkObserver}=await mod();let f=fixture(),release;
 f.screen={captured_at:'2026-10-06T10:02:00Z',revision:2,owner:{case_id:f.case_id,run_id:f.work.run_id,goal_id:f.work.goal_id,task_id:'task-1'}};
 const o=createWorkObserver({getSelection:()=>({case_id:f.case_id}),schedule:()=>1,cancel:()=>{},request:async path=>path==='/computer/work'?f:new Promise((_resolve,reject)=>{release=()=>reject(Error('timeout'));})});
 o.select();await new Promise(r=>setImmediate(r));assert.equal(o.snapshot().phase,'ready');assert.equal(o.snapshot().work.goal_id,f.work.goal_id);release();await new Promise(r=>setImmediate(r));
 assert.equal(o.snapshot().phase,'ready');assert.equal(o.snapshot().image,null);o.dispose();
});

test('bounded long source links fit the observation payload without dropping a valid long investigation',async()=>{
 const {validateObservation}=await mod(),f=fixture(),s=f.work.sources[0];
 f.work.sources=Array.from({length:40},(_,i)=>({...s,id:'https://example.com/'+i+'x'.repeat(1900),url:'https://example.com/'+i+'x'.repeat(1900)}));
 assert.ok(JSON.stringify(f).length>120000);assert.equal(validateObservation(f,f.case_id).work.sources.length,40);
});
