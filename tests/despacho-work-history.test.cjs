const test=require('node:test'),assert=require('node:assert/strict');
const stamp='2026-10-09T05:00:00.000Z',run='11111111-1111-4111-8111-111111111111',entry='20261009050000000-'+run;
const fixture=()=>({ok:true,available:true,case_id:'case-synthetic',history_available:true,observed_at:stamp,runtime:{phase:'working',updated_at:stamp,continues_without_viewer:true,concurrency:1,goal_poll_ms:60000},screen:null,work:{schema:1,case_id:'case-synthetic',run_id:run,goal_id:'goal-synthetic',source_revision:'r1',title:'Trabajo sintético',criterion:'Con fuente',phase:'working',started_at:stamp,updated_at:stamp,current_tool:null,progress:{sequence:1,progress:{tasks:[],evidence:[],summary:''}},sources:[],events:[],event_count:0,metrics:{total:0,ready_for_review:0,blocked:0,running:0,pending:0,evidence_count:0,review_required:true},result:null}});
const list=()=>{const w=fixture().work;return{ok:true,available:true,case_id:w.case_id,entries:[{entry_id:entry,case_id:w.case_id,run_id:w.run_id,goal_id:w.goal_id,source_revision:w.source_revision,title:w.title,phase:w.phase,started_at:w.started_at,updated_at:w.updated_at,metrics:w.metrics,event_count:0}],next:null};};
class Node{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent='';}append(...n){this.children.push(...n);}replaceChildren(...n){this.children=n;}setAttribute(k,v){this.attributes[k]=v;}remove(){}}
const all=n=>[n,...n.children.flatMap(all)],text=n=>all(n).map(x=>x.textContent).join(' '),button=(n,label)=>all(n).find(x=>x.tag==='button'&&x.textContent===label),tick=()=>new Promise(r=>setImmediate(r));
test('history validates exact identity, cursor, metrics and selected entry binding',async()=>{
 const {validateWorkHistory}=await import('../despacho3d/work-observer.mjs');const l=list();assert.equal(validateWorkHistory(l,l.case_id).entries.length,1);
 for(const mutate of [x=>x.entries[0].case_id='other',x=>x.next='bad',x=>x.entries[0].metrics.total=1,x=>x.entries.push(x.entries[0])]){const bad=structuredClone(l);mutate(bad);assert.throws(()=>validateWorkHistory(bad,l.case_id));}
 assert.equal(validateWorkHistory(fixture(),'case-synthetic',{entry_id:entry}).work.run_id,run);
 assert.throws(()=>validateWorkHistory(fixture(),'case-synthetic',{entry_id:'20261009050100000-'+run}));
});
test('history reads do not replace live observation and reject responses after case change',async()=>{
 const {createWorkObserver}=await import('../despacho3d/work-observer.mjs');let selection={case_id:'case-synthetic'},resolve=null,wait=false;const calls=[];
 const o=createWorkObserver({getSelection:()=>selection,schedule:()=>1,cancel:()=>{},request:async(path,data,id)=>{calls.push([path,data,id]);if(path==='/computer/work')return fixture();if(wait)return new Promise(r=>resolve=r);return list();}});
 o.select();await tick();const before=o.snapshot();await o.history({limit:12});assert.deepEqual(o.snapshot(),before);assert.equal(calls[1][2],selection.case_id);
 wait=true;const pending=o.history({limit:12});await tick();selection=null;o.select();resolve(list());await assert.rejects(pending,/unauthorized/);assert.equal(o.snapshot().work,null);o.dispose();
});
test('history UI loads only on demand, leaves live work intact, and clears private data on revoke',async()=>{
 const {createWorkObserver}=await import('../despacho3d/work-observer.mjs'),{mountWorkView}=await import('../despacho3d/work-view.mjs');let selection={case_id:'case-synthetic'};const calls=[];
 const o=createWorkObserver({getSelection:()=>selection,schedule:()=>1,cancel:()=>{},request:async(path,data)=>{calls.push([path,data]);if(path==='/computer/work')return fixture();return data.entry_id?fixture():list();}});o.select();await tick();
 const host=new Node('main'),ui=mountWorkView({container:host,getCase:()=>selection?.case_id,doc:{createElement:t=>new Node(t)},win:{YodWorkObserver:o,addEventListener(){},removeEventListener(){}}});assert.equal(calls.length,1);
 button(host,'Ver historial de ejecuciones').onclick();await tick();assert.equal(calls.length,2);button(host,'Ver registro').onclick();await tick();assert.equal(calls.length,3);assert.match(text(host),/Registro histórico/);assert.equal(o.snapshot().work.run_id,run);
 selection=null;o.select();assert.doesNotMatch(text(host),/Trabajo sintético/);assert.doesNotMatch(text(host),/Registro histórico/);ui.dispose();o.dispose();
});
test('runtime-only transition repaints work state without claiming the previous task is current',async()=>{
 const {mountWorkView}=await import('../despacho3d/work-view.mjs');let emit;const s={...fixture(),phase:'ready'};s.work.progress.progress.tasks=[{id:'task-1',title:'Tarea anterior',status:'running',summary:''}];
 const host=new Node('main'),ui=mountWorkView({container:host,getCase:()=>s.case_id,doc:{createElement:t=>new Node(t)},win:{YodWorkObserver:{subscribe:fn=>{emit=fn;fn(s);return()=>{};}},addEventListener(){},removeEventListener(){}}});assert.match(text(host),/Ahora: Tarea anterior/);
 emit({...s,runtime:{...s.runtime,phase:'waiting_capacity'}});assert.match(text(host),/Encargo en cola/);assert.doesNotMatch(text(host),/Ahora: Tarea anterior/);assert.match(text(host),/REGISTRO ANTERIOR/);ui.dispose();
});

test('recovery wait remains readable for three isolated projects and preserves history until work resumes',async()=>{
 const {createWorkObserver,validateObservation,workHeadline}=await import('../despacho3d/work-observer.mjs'),{mountWorkView}=await import('../despacho3d/work-view.mjs');
 for(const caseId of ['case-synthetic-a','case-synthetic-b','case-synthetic-c']){
  let current=fixture(),selection={case_id:caseId};current.case_id=caseId;current.work.case_id=caseId;
  current.work.progress.progress.tasks=[{id:'task-1',title:'Consulta anterior',status:'running',summary:'Registro previo'}];current.work.metrics.total=1;current.work.metrics.running=1;
  current.work.sources=[{case_id:caseId,run_id:run,goal_id:current.work.goal_id,task_id:'task-1',title:'Fuente guardada',url:'https://example.com/document',consulted_at:stamp}];
  const original=structuredClone(current.work),calls=[],page=list();page.case_id=caseId;page.entries[0]={...page.entries[0],case_id:caseId,metrics:current.work.metrics};
  const observer=createWorkObserver({getSelection:()=>selection,schedule:()=>1,cancel:()=>{},request:async(path,args,id)=>{calls.push([path,id]);assert.equal(id,caseId);return structuredClone(path==='/computer/work'?current:page);}});
  observer.select();await tick();
  const host=new Node('main'),ui=mountWorkView({container:host,getCase:()=>selection?.case_id,doc:{createElement:t=>new Node(t)},win:{YodWorkObserver:observer,addEventListener(){},removeEventListener(){}}});
  assert.match(text(host),/Ahora: Consulta anterior/);
  current.runtime={...current.runtime,phase:'waiting_recovery',diagnostic:{code:'recovery_lease_wait'}};
  await observer.refresh();const waiting=observer.snapshot();
  assert.equal(waiting.phase,'ready');assert.equal(waiting.runtime.diagnostic.code,'recovery_lease_wait');assert.deepEqual(waiting.work,original);
  assert.equal(workHeadline(waiting),'Esperando recuperación segura');assert.match(text(host),/REGISTRO ANTERIOR/);assert.match(text(host),/Última tarea: Consulta anterior/);assert.match(text(host),/Fuente guardada/);assert.match(text(host),/Último registro/);assert.match(text(host),/vence|venza/);assert.doesNotMatch(text(host),/Ahora:|Sin conexión con la actividad|Retomar requiere una acción tuya/);
  const history=await observer.history({limit:12});assert.equal(history.entries[0].case_id,caseId);assert.deepEqual(observer.snapshot(),waiting);
  assert.throws(()=>validateObservation({...current,case_id:'another-case'},caseId),/invalid_observation/);
  assert.throws(()=>validateObservation({...current,runtime:{...current.runtime,phase:'unknown_recovery'}},caseId),/invalid_observation/);
  current.runtime={...current.runtime,phase:'working'};delete current.runtime.diagnostic;
  await observer.refresh();assert.equal(observer.snapshot().runtime.diagnostic,undefined);assert.match(text(host),/Ahora: Consulta anterior/);assert.doesNotMatch(text(host),/Esperando recuperación segura|REGISTRO ANTERIOR/);
  assert.ok(calls.every(([path])=>['/computer/work','/computer/work-history'].includes(path)),'observation never submits or resumes a goal');
  selection=null;observer.select();assert.equal(observer.snapshot().work,null);assert.doesNotMatch(text(host),/Fuente guardada|Consulta anterior/);ui.dispose();observer.dispose();
 }
});
