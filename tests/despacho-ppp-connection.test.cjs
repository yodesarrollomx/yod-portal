const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../despacho3d/agent-workspace-core.mjs'), 'utf8');
// Execute the production connection block, with only DOM labels, clock and network replaced.
// Keep the message/source/nonce checks and native case/scenario validator real.
const section = (start, end) => {
 const from=source.indexOf(start),to=source.indexOf(end,from);
 assert.ok(from>=0&&to>from,'production connection block exists');
 return source.slice(from,to);
};
async function fixture({recordOnly=false,slow=true,pinScenario=true}={}) {
 const {nativeBoardState}=await import('../despacho3d/project-station.mjs');
 let now=0,nextTimer=0;
 const timers=new Map(),calls=[],pending=[];
 const labels={note:{textContent:''},summary:{textContent:''},retry:{hidden:true}};
 const frame={contentWindow:{}},win={location:{origin:'https://yodesarrollomx.github.io'},dispatchEvent(){}};
 const selection={case_id:'case-a',name:'Proyecto sintético',record_only:recordOnly,goals:{ready:false},ppp:pinScenario?{scenario_id:'scenario-a'}:{}};
 const bindings={
  nativeBoardState,win,labels,frame,selection,
  setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,at:now+ms});return id;},
  clearTimeout(id){timers.delete(id);},
  request:async (route,value)=>{calls.push({route,value});if(!slow)return {tablero:value,proposals:[]};return new Promise((resolve,reject)=>{const done=()=>resolve({tablero:value,proposals:[]});done.reject=()=>reject(Error('unavailable'));pending.push(done);});},
  CustomEvent:function(type,options){this.type=type;this.detail=options?.detail;},
  nativeVolumeCapability:()=>null,paintProposals(){},dispatchRequested(){},onPresentation(){},onBoard(){},postBoard(){},
  doc:{hidden:false},Date
 };
 const declarations=`
 let selected=selection, generation=1, disposed=false, active=true, board=null, boardRevision=null,
 boardHandshakeTimer=null, boardHandshakeTimedOut=false, boardReadingReceived=false,
 boardLink={bridge:true,origin:win.location.origin,board_case_id:'native-a'}, nonce='nonce-a',
 application=null, boardSummary=labels.summary, pppNote=labels.note, boardRetry=labels.retry,
 fetching=null, lastTaskRead=0, tab='ppp', readingSources=null, sourceAttempts=0, sourceRetryAt=0,
 proposals=[],notice={textContent:''};
 const getSelection=()=>selected;
 const nativeRecovery={observe(){}},tasks={read(){}},council={refresh(){}};
 function readSources(){} function clear(){} function paintBrowser(){}
 `;
 const production=section(' function clearBoardHandshake()', ' async function readSources()')+
 section(' async function refresh()', ' function setTab(');
 const api=vm.runInNewContext('(function(){'+declarations+production+`
 return {
  start:startBoardHandshake,receive,refresh,
  snapshot:()=>({board,received:boardReadingReceived,note:pppNote.textContent,summary:boardSummary.textContent,retry:boardRetry.hidden}),
  switchCase(){generation++;selected={case_id:'case-b',record_only:false,goals:{ready:false}};clearBoardHandshake();boardReadingReceived=false;board=null;pppNote.textContent='Caso B';}
 };
 })()`,bindings);
 const snapshot={case_id:'native-a',scenario_id:'scenario-a',scenario_name:'Base',revision:'r1',confirmed:true,pending:false};
 const event=(patch={})=>({origin:win.location.origin,source:frame.contentWindow,data:{type:'yod:ppp:state',version:1,nonce:'nonce-a',board:snapshot},...patch});
 const settle=()=>new Promise(resolve=>setImmediate(resolve));
 async function advance(ms){now+=ms;for(const [id,timer]of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}await settle();}
 return {api,event,calls,pending,labels,advance,settle,timers};
}
test('received PPP waits for motor confirmation without claiming the iframe stayed silent',async()=>{
 const f=await fixture();f.api.start();f.api.receive(f.event());await f.settle();
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].route,'/board/snapshot');
 await f.advance(15001);
 assert.match(f.api.snapshot().note,/Lectura recibida.*confirm/i);
 assert.doesNotMatch(f.api.snapshot().note,/todavía no compartió/);
 assert.equal(f.api.snapshot().board,null,'receiving the iframe does not confirm server sharing');
 f.pending.shift()();await f.settle();
 assert.equal(f.api.snapshot().board.revision,'r1');
 assert.match(f.api.snapshot().note,/lectura confirmada/);
});
test('foreign origin, window, nonce, case and scenario do not cancel the waiting timer',async()=>{
 for(const mutate of [
  e=>({...e,origin:'https://untrusted.test'}),
  e=>({...e,source:{}}),
  e=>({...e,data:{...e.data,nonce:'other'}}),
  e=>({...e,data:{...e.data,board:{...e.data.board,case_id:'other'}}}),
  e=>({...e,data:{...e.data,board:{...e.data.board,scenario_id:'other'}}})
 ]){
  const f=await fixture();f.api.start();f.api.receive(mutate(f.event()));await f.settle();await f.advance(15001);
  assert.equal(f.calls.length,0);
  assert.match(f.api.snapshot().note,/todavía no compartió/);
 }
});
test('a delayed acknowledgement cannot change a new case',async()=>{
 const f=await fixture();f.api.start();f.api.receive(f.event());await f.settle();
 f.api.switchCase();f.pending.shift()();await f.settle();await f.advance(15001);
 assert.equal(f.api.snapshot().board,null);
 assert.equal(f.api.snapshot().note,'Caso B');
});
test('a delayed failure cannot replace the new case with an old connection warning',async()=>{
 const f=await fixture();f.api.start();f.api.receive(f.event());await f.settle();
 f.api.switchCase();f.pending.shift().reject();await f.settle();
 assert.equal(f.api.snapshot().note,'Caso B');
 assert.equal(f.api.snapshot().board,null);
});
test('an unconfirmed motor connection remains recoverable without the silence warning',async()=>{
 const f=await fixture();f.api.start();f.api.receive(f.event());await f.settle();f.pending.shift().reject();await f.settle();
 await f.advance(15001);
 assert.match(f.api.snapshot().note,/motor no confirmó/);
 assert.equal(f.api.snapshot().retry,false);
 assert.equal(f.api.snapshot().board,null);
 f.api.start(true);await f.advance(15001);
 assert.match(f.api.snapshot().note,/todavía no compartió/,'explicit recovery waits for a new iframe reply');
});
test('documentary PPP displays a local reading without minting or sharing to a worker',async()=>{
 const f=await fixture({recordOnly:true,slow:false});f.api.start();f.api.receive(f.event());await f.settle();await f.advance(15001);
 assert.equal(f.calls.length,0,'no request() call, which is the only mint/session entry');
 assert.equal(f.api.snapshot().board,null,'documentary reading is never stored as motor-shared state');
 assert.match(f.api.snapshot().note,/consulta.*no tiene un motor/i);
 assert.match(f.api.snapshot().summary,/r1/);
 assert.doesNotMatch(f.api.snapshot().note,/lectura confirmada.*autón/);
 await f.api.refresh();
 assert.equal(f.calls.length,0,'polling documentary PPP must not request /board/state');
 for(const board of [null,{case_id:'other'}]){
  const e=f.event();e.data.board=board;e.data.receipt={ok:true,request_id:'foreign',revision:'r2'};
  f.api.receive(e);await f.settle();
 }
 assert.equal(f.calls.length,0,'documentary cases never submit worker receipts either');
});
test('partial or malformed documentary readings cannot clear the waiting timer or claim a usable revision',async()=>{
 for(const patch of [
  {revision:undefined},{revision:''},{revision:'   '},{revision:123},{revision:'r'.repeat(257)},
  {scenario_id:undefined},{scenario_id:''},{scenario_id:'   '},{scenario_id:123},{scenario_id:'s'.repeat(257)},
  {confirmed:undefined},{confirmed:'true'},{confirmed:1},{pending:undefined},{pending:'false'},{pending:0}
 ]){
  const f=await fixture({recordOnly:true,slow:false,pinScenario:false});f.api.start();
  const e=f.event();e.data.board={...e.data.board,...patch};f.api.receive(e);await f.settle();
  assert.equal(f.api.snapshot().received,false,JSON.stringify(patch));
  assert.equal(f.api.snapshot().summary,'');
  assert.equal(f.calls.length,0);
  await f.advance(15001);
  assert.match(f.api.snapshot().note,/todavía no compartió/);
  assert.doesNotMatch(f.api.snapshot().note,/PPP disponible/);
 }
});

