const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/agent-interaction.mjs');
const context=()=>({authorized:true,ppp_enabled:true,pilot:true,case_id:'synthetic-case',board_case_id:'synthetic-board',scenario_id:'scenario-1',revision:'r1',capabilities:{navigate:false}});
const text=value=>({role:'user',source:'text',text:value,complete:true});
const navigationReceipt=(payload,section=payload.section_id)=>({status:'confirmed',observed:{...payload.context,tab:payload.tab,...(section?{section_id:section}:{})}});
test('closed commands accept direct user navigation and preserve changes without inventing quantities',async()=>{
 const {parseDirectUserCommand}=await load();
 assert.deepEqual(parseDirectUserCommand(text('Muéstrame la arquitectura del PPP')),{kind:'navigate_plan',tab:'ppp',section_id:'dArq',subject:'arquitectura'});
 assert.equal(parseDirectUserCommand(text('Cambia a 17 departamentos')).kind,'change_request');
 for(const input of [{...text('Abre el plan'),role:'assistant'},text('Ruiseñor: abre el plan'),text('No abras el plan'),text('Dijo abre el plan'),text('Abre "el plan"'),text('> Abre el plan'),text("Cambia 'precio' a 58 mil")])assert.equal(parseDirectUserCommand(input),null);
});
test('a partial voice command waits for explicit confirmation and records a real view readback',async()=>{
 const {createAgentInteraction}=await load();let opens=0;
 const controller=createAgentInteraction({getContext:context,uuid:()=>1,openWorkspace:async payload=>{opens++;return navigationReceipt(payload);}});
 const received=await controller.receive({...text('Abre el plan de potencial'),source:'voice',complete:false,event_id:'utterance-1'});
 assert.equal(opens,0);assert.equal(controller.snapshot()[0].state,'awaiting_confirmation');
 assert.equal(await controller.confirm(received.action_id),true);assert.equal(opens,1);
 assert.equal(controller.snapshot()[0].evidence[0].kind,'navigation');assert.doesNotMatch(controller.snapshot()[0].summary,/guardad/i);
 await controller.receive({...text('Abre el plan de potencial'),source:'voice',complete:false,event_id:'utterance-1'});assert.equal(opens,1);
});
test('late voice corrections withdraw an earlier preview rather than execute an incomplete command',async()=>{
 const {createAgentInteraction}=await load();let opens=0;
 const controller=createAgentInteraction({getContext:context,uuid:()=>1,openWorkspace:()=>{opens++;}});
 const first=await controller.receive({role:'user',source:'voice',text:'Abre el plan',complete:false,event_id:'utterance-1'});
 await controller.receive({role:'user',source:'voice',text:'No abre el plan, todavía no',complete:false,event_id:'utterance-1'});
 assert.equal(controller.snapshot()[0].state,'superseded');assert.equal(await controller.confirm(first.action_id),false);assert.equal(opens,0);
});
test('bridge capabilities select A and unsupported navigation uses assisted B with exact evidence',async()=>{
 const {createAgentInteraction}=await load();const ctx={...context(),capabilities:{navigate:true}},calls=[];
 const controller=createAgentInteraction({getContext:()=>ctx,uuid:()=>1,openWorkspace:async p=>{calls.push('open');return navigationReceipt({...p,section_id:null});},navigateBridge:async()=>{calls.push('A');return{status:'unsupported'};},navigateAssisted:async p=>{calls.push('B');return navigationReceipt(p);}});
 await controller.receive(text('Abre costos'));assert.deepEqual(calls,['open','A','B']);assert.equal(controller.snapshot()[0].route,'assisted');
 assert.equal(controller.snapshot()[0].evidence[0].observed.section_id,'dCostos');
});
test('unknown capability never invokes bridge and wrong case readback never becomes confirmed',async()=>{
 const {createAgentInteraction}=await load();let bridgeCalls=0;
 const controller=createAgentInteraction({getContext:context,uuid:()=>1,openWorkspace:async p=>navigationReceipt({...p,section_id:null}),navigateBridge:()=>{bridgeCalls++;},navigateAssisted:async p=>({status:'confirmed',observed:{...p.context,case_id:'foreign',tab:'ppp',section_id:p.section_id}})});
 await controller.receive(text('Abre ventas'));assert.equal(bridgeCalls,0);assert.equal(controller.snapshot()[0].state,'pending');assert.deepEqual(controller.snapshot()[0].evidence,[]);
});
test('revision drift during an awaited navigation stops fallback; revocation removes private intent',async()=>{
 const {createAgentInteraction}=await load();let ctx=context(),release,assists=0;
 const controller=createAgentInteraction({getContext:()=>ctx,uuid:()=>1,openWorkspace:p=>new Promise(r=>{release=()=>r(navigationReceipt(p));}),navigateAssisted:()=>{assists++;}});
 const work=controller.receive(text('Abre arquitectura'));await new Promise(r=>setImmediate(r));ctx={...ctx,revision:'r2'};release();await work;
 assert.equal(controller.snapshot()[0].state,'stale');assert.equal(assists,0);ctx={...ctx,authorized:false};assert.deepEqual(controller.snapshot(),[]);
});
test('changes are preserved as C and an uncertain canonical mutation only reconciles its original request',async()=>{
 const {createAgentInteraction}=await load();let ctx=context(),opens=0,assists=0,reconciles=[];
 const controller=createAgentInteraction({getContext:()=>ctx,uuid:()=>1,openWorkspace:p=>{opens++;return navigationReceipt({...p,section_id:null});},navigateAssisted:p=>{assists++;return navigationReceipt(p);},reconcile:async p=>{reconciles.push(p);return{status:'uncertain'};}});
 const intent=await controller.receive(text('Cambia el precio a 58 mil'));assert.equal(controller.snapshot()[0].state,'pending');assert.equal(opens,1);
 assert.equal(controller.bindMutation(intent.action_id,{request_id:'existing-request',status:'uncertain'}),true);
 ctx={...ctx,revision:'r2'};assert.equal(await controller.retry(intent.action_id),false);
 assert.equal(reconciles.length,1);assert.equal(reconciles[0].request_id,'existing-request');assert.equal(reconciles[0].context.revision,'r1');assert.equal(assists,1);assert.equal(opens,1);assert.equal(controller.snapshot()[0].state,'uncertain');
});
test('a matching mutation receipt can advance revision; a malformed receipt cannot assert saved',async()=>{
 const {createAgentInteraction}=await load();const controller=createAgentInteraction({getContext:context,uuid:()=>1});
 const {action_id}=await controller.receive(text('Prepara tres torres'));
 controller.bindMutation(action_id,{status:'confirmed',request_id:'request-1',observed:{case_id:'foreign',revision:'r2'}});assert.equal(controller.snapshot()[0].state,'uncertain');
 assert.equal(controller.bindMutation(action_id,{status:'confirmed',request_id:'request-2',observed:{...context(),revision:'r2'}}),false);
 controller.bindMutation(action_id,{status:'confirmed',request_id:'request-1',observed:{...context(),revision:'r2'}});assert.equal(controller.snapshot()[0].state,'confirmed');assert.equal(controller.snapshot()[0].evidence[0].observed.revision,'r2');
});
test('a case without an authorized PPP capability never creates an intention',async()=>{
 const {createAgentInteraction}=await load();let opens=0;const controller=createAgentInteraction({getContext:()=>({...context(),ppp_enabled:false}),openWorkspace:()=>opens++});
 assert.deepEqual(await controller.receive(text('Abre el plan')),{handled:false});assert.equal(opens,0);assert.deepEqual(controller.snapshot(),[]);
});
test('an agent reply with a colliding event cannot replace the user intention',async()=>{
 const {createAgentInteraction}=await load();const controller=createAgentInteraction({getContext:context,uuid:()=>1});
 await controller.receive({role:'user',source:'voice',text:'Abre el plan',complete:false,event_id:'same'});
 await controller.receive({role:'assistant',source:'voice',text:'No abras el plan',complete:false,event_id:'same'});
 assert.equal(controller.snapshot()[0].state,'awaiting_confirmation');assert.equal(controller.snapshot()[0].text,'Abre el plan');
});
test('an authorization rejection cannot trigger assisted fallback',async()=>{
 const {createAgentInteraction}=await load();let assisted=0;
 const controller=createAgentInteraction({getContext:()=>({...context(),capabilities:{navigate:true}}),uuid:()=>1,openWorkspace:p=>navigationReceipt({...p,section_id:null}),navigateBridge:()=>{throw Error('unauthorized');},navigateAssisted:()=>assisted++});
 await controller.receive(text('Abre ventas'));assert.equal(assisted,0);assert.equal(controller.snapshot()[0].state,'pending');assert.equal(controller.snapshot()[0].reason,'unauthorized');
});
