const test=require('node:test'),assert=require('node:assert/strict');
const stamp='2026-10-18T16:00:00.000Z';
const work=()=>({run_id:'run-test',goal_id:'goal-test',source_revision:'r1',updated_at:stamp,progress:{sequence:1,progress:{tasks:[]}}});
const fixture=()=>({schema:1,case_id:'case-test',run_id:'run-test',goal_id:'goal-test',source_revision:'r1',sequence:1,checkpoint_at:stamp,checkpoint_key:'a'.repeat(64),observed_at:stamp,phase:'attention',integrity:'consistent',automatic_retry:false,canonical_write:false,acceptance:'not_verified',owner:{kind:'runtime_worker',id:'private-worker'},counts:{total:0,pending:0,running:0,blocked:0,ready_for_review:0},alerts:[{code:'work_interrupted',severity:'warning',label:'Ejecución interrumpida',next_step:'Revisa el último resultado.'}]});
test('Core binds case, attempt, revision, sequence and task counts; excludes private metadata',async()=>{
 const {validateCoreObservation:v}=await import('../despacho3d/core-observation.mjs');
 const good=v({...fixture(),secret:'private'},'case-test',work());assert.equal(good.alerts.length,1);assert.equal(good.owner,undefined);assert.equal(good.secret,undefined);
 for(const mutate of [x=>x.case_id='foreign',x=>x.run_id='other',x=>x.source_revision='r2',x=>x.sequence=2,x=>x.checkpoint_at='2020-01-01',x=>x.automatic_retry=true,x=>x.canonical_write=true,x=>x.acceptance='approved',x=>x.counts.total=1,x=>x.alerts[0].code='unknown',x=>x.alerts.push(x.alerts[0])]){const bad=fixture();mutate(bad);assert.throws(()=>v(bad,'case-test',work()),/invalid_core/);}
});
class Node{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent='';}append(...n){this.children.push(...n);}replaceChildren(...n){this.children=n;}setAttribute(k,v){this.attributes[k]=v;}remove(){}}
const all=n=>[n,...n.children.flatMap(all)],text=n=>all(n).map(x=>x.textContent).join(' ');
test('existing work view displays control transitions and clears details on case change or revoke',async()=>{
 const {mountWorkView}=await import('../despacho3d/work-view.mjs');let emit,id='case-test';const state={case_id:id,phase:'ready',work:null,core:fixture()};
 const host=new Node('main'),ui=mountWorkView({container:host,getCase:()=>id,doc:{createElement:t=>new Node(t)},win:{YodWorkObserver:{subscribe:fn=>{emit=fn;fn(state);return()=>{};}},addEventListener(){},removeEventListener(){}}});
 assert.match(text(host),/Ejecución interrumpida/);assert.match(text(host),/Revisa el último resultado/);
 emit({...state,core:{...fixture(),checkpoint_key:'b'.repeat(64),phase:'decision',alerts:[]}});assert.match(text(host),/Pendiente de revisión/);assert.doesNotMatch(text(host),/Ejecución interrumpida/);
 emit({...state,core:null,core_error:true});assert.match(text(host),/No se pudo verificar/);
 id='other';emit(state);assert.doesNotMatch(text(host),/Ejecución interrumpida|No se pudo verificar/);
 id='case-test';emit(state);ui.clear();assert.doesNotMatch(text(host),/Ejecución interrumpida/);ui.dispose();
});
