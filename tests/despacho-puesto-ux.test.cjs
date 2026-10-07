const test=require('node:test'),assert=require('node:assert/strict');
const stamp='2026-10-07T10:00:00Z';
const fixture=()=>({ok:true,available:true,case_id:'synthetic',screen:null,work:{schema:1,case_id:'synthetic',run_id:'run-1',goal_id:'goal-1',source_revision:'r1',title:'Diagnóstico del proyecto',criterion:'Resultado con evidencia',phase:'prepared',started_at:stamp,updated_at:stamp,current_tool:null,progress:{sequence:1,progress:{tasks:[],evidence:[],summary:''}},sources:[],events:[],result:{state:'ready_for_review',summary:'Diagnóstico recuperado'}}});
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this.attributes[k]=v;}
 remove(){}
}
const text=n=>[n.textContent,...n.children.map(text)].join(' ');
test('reopening recovers the same execution through reads and never resumes a goal',async()=>{
 const {createWorkObserver}=await import('../despacho3d/work-observer.mjs');
 const {mountWorkView}=await import('../despacho3d/work-view.mjs');
 const calls=[],doc={createElement:t=>new Node(t)},selection={case_id:'synthetic'};
 const observer=createWorkObserver({getSelection:()=>selection,schedule:()=>1,cancel:()=>{},request:async path=>{calls.push(path);return fixture();}});
 const win={YodWorkObserver:observer,addEventListener(){},removeEventListener(){}};
 observer.select();await new Promise(r=>setImmediate(r));
 const first=new Node('main'),a=mountWorkView({container:first,getCase:()=>selection.case_id,doc,win});
 assert.equal(first.children[0].dataset.workId,'run-1');a.dispose();
 const second=new Node('main');mountWorkView({container:second,getCase:()=>selection.case_id,doc,win});await observer.refresh();
 assert.equal(second.children[0].dataset.workId,'run-1');assert.equal(second.children[0].dataset.goalId,'goal-1');
 assert.match(text(second),/Diagnóstico recuperado/);assert.match(text(second),/todavía no es una aprobación/);
 assert.deepEqual(calls,['/computer/work','/computer/work']);observer.dispose();
});
test('cached result becomes historical on disconnect and is removed on selection withdrawal',async()=>{
 const {createWorkObserver}=await import('../despacho3d/work-observer.mjs');
 const {mountWorkView}=await import('../despacho3d/work-view.mjs');
 let selection={case_id:'synthetic'},fail=false;
 const observer=createWorkObserver({getSelection:()=>selection,schedule:()=>1,cancel:()=>{},request:async()=>{if(fail)throw Error('unavailable');return fixture();}});
 observer.select();await new Promise(r=>setImmediate(r));
 const host=new Node('main'),view=mountWorkView({container:host,getCase:()=>selection?.case_id,doc:{createElement:t=>new Node(t)},win:{YodWorkObserver:observer,addEventListener(){},removeEventListener(){}}});
 fail=true;await observer.refresh();assert.match(text(host),/Sin conexión/);assert.match(text(host),/último registro puede haber cambiado/);
 selection=null;observer.select();assert.doesNotMatch(text(host),/Diagnóstico recuperado/);assert.equal(host.children[0].dataset.workId,'');
 view.dispose();observer.dispose();
});
test('interrupted and missing-data states require a human decision; empty observation has a useful next step',async()=>{
 const {recoveryNextStep}=await import('../despacho3d/work-view.mjs');
 assert.match(recoveryNextStep({phase:'ready',work:{phase:'interrupted'}}),/acción tuya/);
 assert.match(recoveryNextStep({phase:'ready',work:{phase:'awaiting_data'}}),/datos faltan/);
 assert.match(recoveryNextStep({phase:'ready',work:null}),/siguiente objetivo/);
 assert.match(recoveryNextStep({phase:'unavailable',work:fixture().work}),/antes de decidir/);
});
