const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),url=require('node:url');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('workspace keeps same case in board URL and rejects arbitrary identifiers',async()=>{
 const m=await import(url.pathToFileURL(path.join(__dirname,'../despacho3d/agent-workspace.mjs')));
 assert.match(m.boardURL('case-synthetic','https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=case-synthetic'),/open=case-synthetic&embed=1&agent=1$/);
 assert.throws(()=>m.boardURL('../other'));assert.equal(m.WORKSPACE_TABS[0][0],'activity');
});
test('workspace and voice are mounted together without a second media request',()=>{
 const s=read('despacho3d/live-voice-boot.mjs');
 assert.match(s,/voice-layout/);assert.match(s,/workspace\.open\(fresh,tab\)/);
 assert.match(s,/voice-view-tasks.*workspace.setTab/);
 assert.doesNotMatch(read('despacho3d/agent-workspace.mjs'),/getUserMedia|sessionStorage|localStorage|innerHTML/);
 assert.match(read('despacho3d/agent-workspace.mjs'),/e\.source!==frame\?\.contentWindow/);
 assert.match(read('despacho3d/index.html'),/agent-workspace-boot\.mjs\?v=6/);
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

test('station resolves the registered PPP type, rejects another case and distinguishes Sheets without a bridge',async()=>{
 const {resolveBoard,registeredBoard,stationIdentity}=await import('../despacho3d/project-station.mjs');
 const selection={case_id:'synthetic-a',name:'Proyecto A',avatar:{name:'Autón A'}};
 const source='https://yodesarrollomx.github.io/potenciales-yod/vertical.html?open=synthetic-a';
 assert.match(resolveBoard(selection,[{title:'PPP',source}]).url,/mixto.html/);
 assert.equal(registeredBoard(source,'synthetic-b'),null);
 assert.equal(registeredBoard(source+'&open=synthetic-b','synthetic-a'),null);
 for(const url of ['javascript:alert(1)','https://evil.test/potenciales-yod/vertical.html?open=synthetic-a','https://yodesarrollomx.github.io/potenciales-yod/../other.html?open=synthetic-a'])
  assert.equal(registeredBoard(url,selection.case_id),null);
 const sheet=registeredBoard('https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit#gid=123',selection.case_id);
 assert.equal(sheet.bridge,false);assert.equal(sheet.url.endsWith('#gid=123'),true);
 assert.equal(resolveBoard(selection,[{title:'PPP',source},{title:'PPP',source:source.replace('vertical','patrimonial')}]),null);
 assert.equal(stationIdentity(selection).name,'Autón A');
 assert.equal(stationIdentity({case_id:'b',name:'Proyecto B'}).name,'Proyecto B');
 assert.equal(resolveBoard({...selection,ppp:{case_id:'wrong',url:source}},[]),null);
});

test('PPP capability follows installed adapter and vertical resolves to the real mixto page',async()=>{
 const {registeredBoard,resolveBoard}=await import('../despacho3d/project-station.mjs');
 const id='synthetic-a',base='https://yodesarrollomx.github.io/potenciales-yod/';
 for(const page of ['vertical.html','mixto.html','macrolotes.html','unifamiliar.html','residencial.html']){
  const board=registeredBoard(base+page+'?open='+id,id);
  assert.equal(board.bridge,false);assert.equal(board.surface,'ppp');
  const url=new URL(board.url);assert.equal(url.pathname,'/potenciales-yod/'+(page==='vertical.html'?'mixto.html':page));
  assert.equal(url.searchParams.get('open'),id);assert.equal(url.searchParams.get('embed'),'1');assert.equal(url.searchParams.has('agent'),false);
 }
 const patrimonial=registeredBoard(base+'patrimonial.html?open='+id,id);
 assert.equal(patrimonial.bridge,true);assert.equal(patrimonial.surface,'ppp');assert.equal(new URL(patrimonial.url).searchParams.get('agent'),'1');
 const sheet='https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit';
 assert.equal(registeredBoard(sheet,id).surface,'sheet');
 assert.equal(resolveBoard({case_id:id},[{title:'PPP',source:base+'mixto.html?open='+id},{title:'PPP',source:sheet}]).surface,'ppp');
 assert.equal(resolveBoard({case_id:id},[{title:'PPP',source:base+'mixto.html?open='+id},{title:'PPP',source:base+'patrimonial.html?open='+id}]),null);
 assert.equal(resolveBoard({case_id:id},[{title:'PPP',source:base+'vertical.html?open='+id},{title:'PPP',source:base+'mixto.html?open='+id}]).bridge,false);
});
