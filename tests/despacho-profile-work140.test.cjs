'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const stamp='2026-10-12T12:00:00Z';
const goal=(goal_id,status,patch={})=>({case_id:'synthetic-a',goal_id,title:goal_id,status,updated_at:stamp,tasks:[],...patch});
test('profile work separates real review, data blockers and history without leaking another case',async()=>{
 const {classifyProfileWork}=await import('../despacho3d/profile-work.mjs');
 const values=[goal('current','running'),goal('review','ready_for_review'),goal('needs-data','awaiting_data'),
  goal('old','completed'),goal('stopped','stopped'),goal('foreign','running',{case_id:'synthetic-b'})],before=JSON.stringify(values);
 const lanes=classifyProfileWork(values,'synthetic-a');
 assert.deepEqual(lanes.now.map(g=>g.goal_id),['current']);assert.deepEqual(lanes.review.map(g=>g.goal_id),['review']);
 assert.deepEqual(lanes.blocked.map(g=>g.goal_id),['needs-data']);assert.equal(lanes.history.length,2);
 assert.equal(JSON.stringify(values),before);assert.deepEqual(classifyProfileWork(values,null),{now:[],blocked:[],review:[],history:[]});
});
test('only the next recorded task determines a data blocker; a later blocker does not invent business priority',async()=>{
 const {classifyProfileWork,nextRecordedTask}=await import('../despacho3d/profile-work.mjs');
 const tasks=[{id:'task-3',status:'blocked'},{id:'task-1',status:'ready_for_review'},{id:'task-2',status:'pending'}];
 const current=goal('ordered','running',{tasks}),before=JSON.stringify(tasks);
 assert.equal(nextRecordedTask(current).id,'task-2');assert.equal(classifyProfileWork([current],'synthetic-a').now.length,1);
 const blocked=goal('blocked','running',{tasks:[{id:'task-1',status:'blocked'}]});
 assert.equal(classifyProfileWork([blocked],'synthetic-a').blocked.length,1);assert.equal(JSON.stringify(tasks),before);
});
test('an unavailable or still-loading read is never called empty, and previous deliveries never become an active goal',async()=>{
 const {profileWorkView}=await import('../despacho3d/profile-work.mjs');
 for(const status of ['disconnected','loading','unavailable','conflict']){
  const missing=profileWorkView({status},'synthetic-a');assert.equal(missing.confirmedEmpty,false);
  const previous=profileWorkView({status,model:{goals:[goal('old','completed')]}},'synthetic-a');assert.equal(previous.selected,null);
  if(['loading','unavailable','conflict'].includes(status))assert.equal(previous.historical,true);
 }
 const ready=profileWorkView({status:'ready',model:{goals:[goal('old','completed'),goal('paused','stopped')]}},'synthetic-a');
 assert.equal(ready.confirmedEmpty,true);assert.equal(ready.active,0);assert.equal(ready.selected,null);assert.equal(ready.groups.history.length,2);
});
test('review and blocked decisions precede current work in the summary without changing stored order or assigning jobs',async()=>{
 const {profileWorkView}=await import('../despacho3d/profile-work.mjs');
 const goals=[goal('current','running',{updated_at:'2026-10-12T13:00:00Z'}),goal('review','ready_for_review'),goal('block','awaiting_data')];
 const before=JSON.stringify(goals),view=profileWorkView({status:'ready',model:{goals}},'synthetic-a');
 assert.equal(view.selected.goal_id,'review');assert.equal(view.active,3);assert.equal(view.percent,undefined);assert.equal(view.runtime,undefined);
 assert.equal(JSON.stringify(goals),before);
 const writing=profileWorkView({status:'writing',model:{goals},pending:{method:'reviewGoal'}},'synthetic-a');
 assert.equal(writing.phase,'unconfirmed');assert.equal(writing.confirmedEmpty,false);
 const disabled=profileWorkView({status:'ready',model:{goals}},'synthetic-a',false);
 assert.equal(disabled.selected,null);assert.equal(disabled.active,0);assert.equal(disabled.confirmedEmpty,false);
});

test('contextual inspector stacks before the desktop minima exceed Chromebook room width',()=>{
 const fs=require('node:fs'),path=require('node:path'),css=fs.readFileSync(path.join(__dirname,'../despacho3d/agent-workspace.css'),'utf8');
 const profile=css.slice(css.indexOf('/* Profile140:'));
 const columns=profile.match(/grid-template-columns:minmax\((\d+)px,1fr\) minmax\((\d+)px,36%\)/);
 const gap=profile.match(/\.workspace-body\{[^}]*gap:(\d+)px/);
 const stack=profile.match(/@media\(max-width:(\d+)px\)\{\s*\.workspace-body\[data-inspector-open=true\]\{grid-template-columns:minmax\(0,1fr\);grid-template-rows/);
 assert.ok(columns&&gap&&stack,'The persistent PPP and inspector declare desktop minima and their stack boundary');
 const minimum=Number(columns[1])+Number(columns[2])+Number(gap[1]),stackAt=Number(stack[1]);
 // Read geometry of the existing desktop shell, whose sidebar remains 232px through 1050px.
 for(let viewport=851;viewport<=879;viewport++){
  const room=viewport-24-232-32;
  assert.ok(room>=minimum||viewport<=stackAt,'Inspector would crop at '+viewport+'px');
 }
 assert.match(profile,/\.workspace-inspector\{grid-column:1;grid-row:2/);
});
