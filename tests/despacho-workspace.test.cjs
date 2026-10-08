const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),url=require('node:url');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('workspace keeps same case in board URL and rejects arbitrary identifiers',async()=>{
 const m=await import(url.pathToFileURL(path.join(__dirname,'../despacho3d/agent-workspace.mjs')));
 assert.match(m.boardURL('case-synthetic','https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=case-synthetic'),/open=case-synthetic&embed=1&agent=1$/);
 assert.throws(()=>m.boardURL('../other'));assert.equal(m.WORKSPACE_TABS[0][0],'ppp');
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
  assert.equal(board.bridge,!['unifamiliar.html','residencial.html'].includes(page));assert.equal(board.surface,'ppp');
  const url=new URL(board.url);assert.equal(url.pathname,'/potenciales-yod/'+(page==='vertical.html'?'mixto.html':page));
  assert.equal(url.searchParams.get('open'),id);assert.equal(url.searchParams.get('embed'),'1');assert.equal(url.searchParams.has('agent'),board.bridge);
 }
 const patrimonial=registeredBoard(base+'patrimonial.html?open='+id,id);
 assert.equal(patrimonial.bridge,true);assert.equal(patrimonial.surface,'ppp');assert.equal(new URL(patrimonial.url).searchParams.get('agent'),'1');
 const sheet='https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit';
 assert.equal(registeredBoard(sheet,id).surface,'sheet');
 assert.equal(resolveBoard({case_id:id},[{title:'PPP',source:base+'mixto.html?open='+id},{title:'PPP',source:sheet}]).surface,'ppp');
 assert.equal(resolveBoard({case_id:id},[{title:'PPP',source:base+'mixto.html?open='+id},{title:'PPP',source:base+'patrimonial.html?open='+id}]),null);
 assert.equal(resolveBoard({case_id:id},[{title:'PPP',source:base+'vertical.html?open='+id},{title:'PPP',source:base+'mixto.html?open='+id}]).bridge,true);
});

test('receipt queue retains failures, validates identity and drains siblings during concurrent retry',async()=>{
 const {createReceiptQueue}=await import('../despacho3d/agent-workspace.mjs');
 const acked=[],calls=[];let release,retrying=false;
 const waiting=new Promise(resolve=>{release=resolve;});
 const queue=createReceiptQueue({resolve:async r=>{
  calls.push(r.request_id);if(!retrying&&r.request_id==='first'){await waiting;throw Error('503');}
  if(!retrying&&r.request_id==='second')return{ok:true,request_id:'foreign',status:'applied'};
  return{ok:true,request_id:r.request_id,status:'applied'};
 },ack:r=>acked.push(r.request_id)});
 queue.enqueue({request_id:'first',revision:'r1'});queue.enqueue({request_id:'second',revision:'r2'});
 const inFlight=queue.drain();assert.equal(queue.drain(),inFlight,'retry joins the existing operation');
 queue.enqueue({request_id:'third',revision:'r3'});release();
 assert.equal(await inFlight,false);assert.deepEqual(calls,['first','second','third']);assert.deepEqual(acked,['third']);
 assert.equal(queue.size,2);assert.equal(queue.has('first'),true);assert.equal(queue.has('second'),true);
 retrying=true;assert.equal(await queue.drain(),true);assert.equal(queue.size,0);assert.deepEqual(acked,['third','first','second']);
});
test('receipt queue is bounded without replacement and never acknowledges incomplete server responses',async()=>{
 const {createReceiptQueue}=await import('../despacho3d/agent-workspace.mjs');
 let response={ok:true},acks=0;
 const queue=createReceiptQueue({resolve:async()=>response,ack:()=>{acks++;}});
 for(let i=0;i<8;i++)assert.equal(queue.enqueue({request_id:'receipt-'+i,revision:'r'+i}),true);
 assert.equal(queue.enqueue({request_id:'overflow',revision:'r9'}),false);
 assert.equal(queue.enqueue({request_id:'receipt-0',revision:'other'}),false);
 assert.equal(queue.enqueue({request_id:'receipt-0',revision:'r0'}),true);
 assert.equal(queue.size,8);assert.equal(await queue.drain(),false);assert.equal(acks,0);assert.equal(queue.size,8);
 queue.clear();queue.enqueue({request_id:'one',revision:'r1'});
 for(const bad of [{ok:true,request_id:'other',status:'applied'},{ok:true,request_id:'one',status:'discarded'},{ok:false,request_id:'one',status:'applied'}]){
  response=bad;assert.equal(await queue.drain(),false);assert.equal(acks,0);assert.equal(queue.size,1);
 }
 response={ok:true,request_id:'one',status:'applied'};assert.equal(await queue.drain(),true);assert.equal(acks,1);
});
test('closing retains unacknowledged history and changing project invalidates an in-flight response',async()=>{
 const {createReceiptQueue}=await import('../despacho3d/agent-workspace.mjs');
 let visible=true,release;const acks=[];
 const queue=createReceiptQueue({eligible:()=>visible,resolve:r=>new Promise(resolve=>{release=()=>resolve({ok:true,request_id:r.request_id,status:'applied'});}),ack:r=>acks.push(r.request_id)});
 queue.enqueue({request_id:'historical',revision:'r1'});const old=queue.drain();visible=false;release();
 assert.equal(await old,false);assert.equal(queue.size,1);assert.deepEqual(acks,[]);
 visible=true;const retry=queue.drain(),releaseOld=release;queue.clear();queue.enqueue({request_id:'new-case',revision:'r2'});
 const fresh=queue.drain(),releaseNew=release;releaseOld();assert.equal(await retry,false);assert.equal(queue.size,1);assert.deepEqual(acks,[]);
 releaseNew();assert.equal(await fresh,true);assert.deepEqual(acks,['new-case']);assert.equal(queue.size,0);
});
