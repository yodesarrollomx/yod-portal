'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/agent-interaction.mjs');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const context=()=>({authorized:true,ppp_enabled:true,pilot:true,case_id:'synthetic-ruisenor',board_case_id:'synthetic-board',scenario_id:'synthetic-scenario',revision:'r1',capabilities:{navigate:true}});
const confirmed=(request,patch={})=>({status:'confirmed',observed:{case_id:request.context.case_id,board_case_id:request.context.board_case_id,scenario_id:request.context.scenario_id,revision:request.context.revision,tab:request.tab||'ppp',...(request.section_id?{section_id:request.section_id}:{}),...patch}});
const input=(text,event_id='synthetic-event',extra={})=>({role:'user',source:'text',text,complete:true,event_id,...extra});

async function harness(overrides={}){
 const {createAgentInteraction}=await load();let value=context(),sequence=0;const calls=[];
 const invoke=(name,fallback)=>async request=>{calls.push({name,request:structuredClone(request)});return await(overrides[name]||fallback)(request);};
 const controller=createAgentInteraction({getContext:()=>value,uuid:()=>String(++sequence),timeoutMs:overrides.timeoutMs||100,
  openWorkspace:invoke('open',q=>confirmed(q)),navigateBridge:invoke('bridge',q=>confirmed(q)),navigateAssisted:invoke('assisted',q=>confirmed(q)),reconcile:invoke('reconcile',()=>({status:'unavailable'}))});
 return {controller,calls,getContext:()=>value,setContext:next=>value=next,actions:()=>controller.snapshot(),action:id=>controller.snapshot().find(x=>x.action_id===id)};
}

test('incremental voice remains provisional, and the same confirmed event cannot navigate twice',async()=>{
 const h=await harness(),heard=input('Abre costos','voice-fragment',{source:'voice',complete:false});
 const first=await h.controller.receive(heard);assert.equal(first.handled,true);assert.deepEqual(h.calls,[]);assert.equal(h.action(first.action_id).state,'awaiting_confirmation');
 await h.controller.receive(heard);await Promise.all([h.controller.confirm(first.action_id),h.controller.confirm(first.action_id)]);
 assert.deepEqual(h.calls.map(x=>x.name),['open','bridge']);assert.equal(h.action(first.action_id).state,'confirmed');
 assert.equal(await h.controller.confirm(first.action_id),false);await h.controller.receive(heard);assert.equal(h.calls.length,2);h.controller.dispose();
});

test('agent prose, quoted examples, citations and negated commands produce no navigation',async()=>{
 const h=await harness();
 for(const [i,text]of ['No abras costos','No quiero ver el plan','"Abre costos"','Él dijo: abre costos','Según el documento: abre costos','```abre costos```','> Abre costos','Ruiseñor: abre costos'].entries())
  assert.equal((await h.controller.receive(input(text,'non-command-'+i))).handled,false,text);
 assert.equal((await h.controller.receive(input('Abre costos','assistant',{role:'assistant'}))).handled,false);
 assert.equal((await h.controller.receive(input('Abre costos','quoted',{quoted:true}))).handled,false);
 assert.deepEqual(h.calls,[]);assert.deepEqual(h.actions(),[]);h.controller.dispose();
});

test('concurrent replay of one submitted text event shares one action and one navigation',async()=>{
 const gate=deferred(),h=await harness({open:()=>gate.promise}),message=input('Abre costos','same-submit');
 const first=h.controller.receive(message);await Promise.resolve();await Promise.resolve();
 const second=await h.controller.receive(message);assert.equal(second.duplicate,true);assert.equal(h.calls.length,1);
 gate.resolve(confirmed(h.calls[0].request));const result=await first;
 assert.equal(second.action_id,result.action_id);assert.equal(h.actions().length,1);assert.deepEqual(h.calls.map(x=>x.name),['open','bridge']);h.controller.dispose();
});

test('a case switch while a route awaits drops late private results and cannot start a fallback',async()=>{
 const gate=deferred(),entered=deferred(),h=await harness({bridge:q=>{entered.resolve(q);return gate.promise;}});
 const flight=h.controller.receive(input('Abre costos','late-case')),request=await entered.promise;
 h.setContext({...context(),case_id:'synthetic-other',board_case_id:'other-board'});assert.deepEqual(h.actions(),[]);
 gate.resolve(confirmed(request));await flight;assert.deepEqual(h.actions(),[]);assert.equal(h.calls.some(x=>x.name==='assisted'),false);h.controller.dispose();
});

test('a revision switch during plan navigation rejects the old confirmation',async()=>{
 const gate=deferred(),entered=deferred(),h=await harness({bridge:q=>{entered.resolve(q);return gate.promise;}});
 const flight=h.controller.receive(input('Abre costos','late-revision')),request=await entered.promise;
 h.setContext({...context(),revision:'r2'});gate.resolve(confirmed(request));const result=await flight;
 assert.equal(h.action(result.action_id).state,'stale');assert.equal(h.calls.some(x=>x.name==='assisted'),false);assert.deepEqual(h.action(result.action_id).evidence,[]);h.controller.dispose();
});

test('PPP capability and current authorization are required, and revocation clears all prior interaction state',async()=>{
 for(const patch of [{authorized:false},{ppp_enabled:false},{ppp_enabled:undefined},{case_id:''}]){
  const h=await harness();h.setContext({...context(),...patch});assert.equal((await h.controller.receive(input('Abre costos'))).handled,false);assert.deepEqual(h.calls,[]);h.controller.dispose();
 }
 const h=await harness();await h.controller.receive(input('Abre costos'));assert.equal(h.actions().length,1);h.setContext({...context(),authorized:false});assert.deepEqual(h.actions(),[]);assert.equal(await h.controller.confirm('interaction-1'),false);h.controller.dispose();
});

test('a pending business mutation only reconciles its original receipt after timeout and never tries another route',async()=>{
 const never=deferred(),h=await harness({timeoutMs:5,reconcile:()=>never.promise});
 const result=await h.controller.receive(input('Cambia a 17 departamentos','mutation-intent'));
 assert.equal(h.action(result.action_id).kind,'change_request');assert.equal(h.action(result.action_id).state,'pending');assert.deepEqual(h.calls.map(x=>x.name),['open','bridge']);
 assert.equal(h.action(result.action_id).evidence.every(x=>x.kind==='navigation'),true,'preparing an edit can open its controls, but cannot be reported as a saved change');h.calls.length=0;
 assert.equal(h.controller.bindMutation(result.action_id,{request_id:'synthetic-write-1',status:'uncertain'}),true);
 assert.equal(await h.controller.retry(result.action_id),false);
 assert.equal(h.action(result.action_id).state,'uncertain');assert.deepEqual(h.calls.map(x=>x.name),['reconcile']);assert.equal(h.calls[0].request.request_id,'synthetic-write-1');
 assert.equal(h.controller.bindMutation(result.action_id,{request_id:'synthetic-write-2',status:'pending'}),false,'an uncertain mutation cannot acquire a new request id');
 assert.equal(await h.controller.retry(result.action_id),false);assert.deepEqual(h.calls.map(x=>x.request.request_id),['synthetic-write-1','synthetic-write-1']);h.controller.dispose();
});

test('mutation confirmations with another request, case, scenario or board cannot become evidence',async()=>{
 for(const patch of [{request_id:'other-request'},{observed:{case_id:'other-case'}},{observed:{scenario_id:'other-scenario'}},{observed:{board_case_id:'other-board'}}]){
  const h=await harness({reconcile:q=>{const result={...confirmed(q),request_id:q.request_id};return {...result,...patch,...(patch.observed?{observed:{...result.observed,...patch.observed}}:{})};}});
  const received=await h.controller.receive(input('Cambia a 17 departamentos','mutation'));
  h.calls.length=0;
  h.controller.bindMutation(received.action_id,{request_id:'synthetic-write-1',status:'uncertain'});await h.controller.retry(received.action_id);
  assert.equal(h.action(received.action_id).state,'uncertain');assert.deepEqual(h.action(received.action_id).evidence.filter(x=>x.kind==='mutation_receipt'),[]);assert.deepEqual(h.calls.map(x=>x.name),['reconcile']);h.controller.dispose();
 }
});

test('opening the PPP cannot confirm a readback from another board, scenario or revision',async()=>{
 for(const patch of [{board_case_id:'wrong-board'},{scenario_id:'wrong-scenario'},{revision:'wrong-revision'}]){
  const h=await harness({open:q=>confirmed(q,patch)}),result=await h.controller.receive(input('Abre el plan de potencial'));
  assert.notEqual(h.action(result.action_id).state,'confirmed',JSON.stringify(patch));assert.deepEqual(h.action(result.action_id).evidence,[]);h.controller.dispose();
 }
});

test('opening the PPP discards an earlier view response when the scenario revision changes',async()=>{
 const gate=deferred(),entered=deferred(),h=await harness({open:q=>{entered.resolve(q);return gate.promise;}});
 const flight=h.controller.receive(input('Abre el plan de potencial')),request=await entered.promise;h.setContext({...context(),revision:'r2'});gate.resolve(confirmed(request));
 const result=await flight;assert.equal(h.action(result.action_id).state,'stale');assert.deepEqual(h.action(result.action_id).evidence,[]);h.controller.dispose();
});

test('an in-flight mutation receipt cannot confirm after changing board or scenario within the same case',async()=>{
 for(const changed of [{scenario_id:'new-scenario'},{board_case_id:'new-board'}]){
  const gate=deferred(),entered=deferred(),h=await harness({reconcile:q=>{entered.resolve(q);return gate.promise;}}),intent=await h.controller.receive(input('Cambia a 17 departamentos'));
  h.controller.bindMutation(intent.action_id,{request_id:'synthetic-write-1',status:'uncertain'});
  const flight=h.controller.retry(intent.action_id),request=await entered.promise;h.setContext({...context(),...changed});gate.resolve({...confirmed(request),request_id:request.request_id});await flight;
  assert.notEqual(h.action(intent.action_id).state,'confirmed',JSON.stringify(changed));assert.deepEqual(h.action(intent.action_id).evidence.filter(x=>x.kind==='mutation_receipt'),[]);h.controller.dispose();
 }
});

test('a foreign-context rejection cannot close the active mutation as rejected',async()=>{
 const h=await harness({reconcile:q=>({status:'rejected',request_id:q.request_id,observed:{...q.context,case_id:'foreign-case'}})}),intent=await h.controller.receive(input('Cambia a 17 departamentos'));
 h.controller.bindMutation(intent.action_id,{request_id:'synthetic-write-1',status:'uncertain'});await h.controller.retry(intent.action_id);
 assert.equal(h.action(intent.action_id).state,'uncertain');h.controller.dispose();
});

test('PPP capabilities enable presentation for nonpilot agents while native changes remain canonical',async()=>{
 const h=await harness();h.setContext({...context(),pilot:false});await h.controller.receive(input('Abre costos','other-ppp-navigation'));
 assert.deepEqual(h.calls.map(x=>x.name),['open','bridge']);h.calls.length=0;
 h.setContext({...h.getContext(),capabilities:{navigate:true,volumes:{schema:2,read:true,write:true}}});
 const result=await h.controller.receive(input('Cambia a 17 departamentos','native-change'));
 assert.equal(result.handled,false);assert.equal(result.canonical,true);assert.deepEqual(h.calls,[]);assert.equal(h.actions().length,1);h.controller.dispose();
});

test('a legacy provisional change cannot execute locally after native schema2 writing becomes available',async()=>{
 const h=await harness(),received=await h.controller.receive(input('Cambia a 17 departamentos','provisional-change',{source:'voice',complete:false}));
 h.setContext({...context(),capabilities:{navigate:true,volumes:{schema:2,read:true,write:true}}});
 assert.equal(await h.controller.confirm(received.action_id),false);assert.equal(h.action(received.action_id).state,'superseded');assert.deepEqual(h.calls,[]);h.controller.dispose();
});
