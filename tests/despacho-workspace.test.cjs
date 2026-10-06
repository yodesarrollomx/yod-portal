const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),url=require('node:url');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('workspace keeps same case in board URL and rejects arbitrary identifiers',async()=>{
 const m=await import(url.pathToFileURL(path.join(__dirname,'../despacho3d/agent-workspace.mjs')));
 assert.match(m.boardURL('case-synthetic'),/open=case-synthetic&embed=1&agent=1$/);
 assert.throws(()=>m.boardURL('../other'));assert.equal(m.WORKSPACE_TABS.length,5);
});
test('workspace and voice are mounted together without a second media request',()=>{
 const s=read('despacho3d/live-voice-boot.mjs');
 assert.match(s,/voice-layout/);assert.match(s,/workspace\.open\(fresh,tab\)/);
 assert.match(s,/voice-view-tasks.*workspace.setTab/);
 assert.doesNotMatch(read('despacho3d/agent-workspace.mjs'),/getUserMedia|sessionStorage|localStorage|innerHTML/);
 assert.match(read('despacho3d/agent-workspace.mjs'),/e\.source!==frame\?\.contentWindow/);
 assert.match(read('despacho3d/index.html'),/agent-workspace-boot\.mjs\?v=3/);
});

test('PPP proposals require the exact case, scenario and confirmed revision and cannot repeat while pending',async()=>{
 const {proposalState}=await import('../despacho3d/agent-workspace.mjs');
 const board={case_id:'case-synthetic',scenario_id:'scenario-1',revision:'r1',confirmed:true,pending:false};
 const proposal={case_id:board.case_id,scenario_id:board.scenario_id,revision:board.revision,request_id:'proposal-1'};
 assert.equal(proposalState(board,proposal),'ready');
 for(const patch of [{case_id:'other'},{scenario_id:'scenario-2'},{revision:'r2'}])
  assert.equal(proposalState({...board,...patch},proposal),'stale');
 assert.equal(proposalState({...board,pending:true},proposal),'board_pending');
 assert.equal(proposalState({...board,confirmed:false},proposal),'board_pending');
 assert.equal(proposalState(board,proposal,{request_id:'proposal-1',status:'sending'}),'sending');
 assert.equal(proposalState(board,proposal,{request_id:'proposal-1',status:'unconfirmed'}),'unconfirmed');
});
