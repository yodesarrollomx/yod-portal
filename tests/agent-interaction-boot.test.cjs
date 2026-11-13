'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../despacho3d/live-voice-boot.mjs'),'utf8');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function bootSource(name){
 const candidates=['  async function '+name+'(','  function '+name+'('],start=candidates.map(prefix=>source.indexOf(prefix)).find(index=>index>=0);assert.ok(start>=0,name+' exists');
 const end=source.indexOf('\n  }\n',start);assert.ok(end>start);return source.slice(start,end+5);
}
async function harness(options={}){
 const {createAgentInteraction,parseDirectUserCommand,nativeVolumeWrite}=await import('../despacho3d/agent-interaction.mjs'),{groupTranscriptFragments}=await import('../despacho3d/live-transcript.mjs');
 const fields=new Map(),calls=[],local=[],navigation=[],presentation=[];let voiceState={phase:'idle'},serial=0,prevented=0;
 const node=id=>{if(!fields.has(id))fields.set(id,{disabled:false,value:'',textContent:''});return fields.get(id);};
 const selection={case_id:'synthetic-pilot',can_enqueue:true,pilot:true},environment={selection,currentSelection:selection,accessPaused:false,generation:1,discussionDraftCase:null,dialog:{open:true},pppEnabled:true,nativeWrite:false,stationSubmission:null,typedTurns:[],fragments:[],voiceCaseId:selection.case_id,voiceInteractionEpoch:'synthetic-session',node,
  parseDirectUserCommand,nativeVolumeWrite,openBoard:tab=>{presentation.push(tab);return true;},window:{crypto:{randomUUID:()=>String(++serial)}},pilot:value=>value?.pilot===true,active:state=>!['idle','error'].includes(state.phase),groupTranscriptFragments,
  renderChat:()=>calls.push({kind:'render'}),renderTranscript:fragment=>environment.fragments.push(fragment)};
 environment.window.YodResidentAgents={getSelection:()=>environment.currentSelection};
 const interactionContext=()=>({authorized:!environment.accessPaused&&environment.dialog.open&&environment.selection?.case_id===environment.currentSelection?.case_id,ppp_enabled:environment.pppEnabled,pilot:environment.selection?.pilot===true,case_id:environment.selection?.case_id,board_case_id:'synthetic-board',scenario_id:'scenario-a',revision:'r1',capabilities:{navigate:true,...(environment.nativeWrite?{volumes:{schema:2,read:true,write:true}}:{})}});environment.interactionContext=interactionContext;
 const controller=createAgentInteraction({getContext:interactionContext,uuid:()=>String(++serial),timeoutMs:30,
  openWorkspace:async payload=>{navigation.push({kind:'open',payload});return{status:'confirmed',observed:{...payload.context,tab:payload.tab}};},navigateBridge:async payload=>{navigation.push({kind:'bridge',payload});return{status:'confirmed',observed:{...payload.context,tab:payload.tab,section_id:payload.section_id}};}});
 environment.interaction={receive:async value=>{local.push(structuredClone(value));return options.receive?options.receive(value):controller.receive(value);}};
 environment.chat={pending:null,send:async text=>{calls.push({kind:'chat',text,pending:environment.chat.pending});return true;}};
 environment.voice={snapshot:()=>voiceState,sendText:async text=>{calls.push({kind:'voice',text,pending:voiceState.text_pending});return true;}};
 const functions=new vm.Script(['stationMessageContext','sendStationMessage','receiveStationTranscript'].map(bootSource).join('\n')+'\n({sendStationMessage,receiveStationTranscript})').runInNewContext(environment);
 return {environment,node,calls,local,navigation,presentation,controller,send:text=>{node('station-message').value=text;return functions.sendStationMessage({preventDefault(){prevented++;}});},submit:()=>functions.sendStationMessage({preventDefault(){prevented++;}}),transcript:functions.receiveStationTranscript,setVoice:state=>voiceState={...voiceState,...state},prevented:()=>prevented,dispose:()=>controller.dispose()};
}
const business=h=>h.calls.filter(call=>['chat','voice'].includes(call.kind));

test('the real submit handler routes recognized pilot navigation locally with no chat or voice business send',async()=>{
 for(const voice of [false,true]){
  const h=await harness();if(voice)h.setVoice({phase:'listening'});
  assert.equal(await h.send('Abre costos'),true);assert.deepEqual(business(h),[]);assert.equal(h.local.length,1);assert.equal(h.local[0].complete,true);
  assert.deepEqual(h.navigation.map(x=>x.kind),['open','bridge']);assert.equal(h.node('station-message').value,'');assert.equal(h.controller.snapshot()[0].state,'confirmed');h.dispose();
 }
});

test('ordinary chat and classic mode retain their original text and live voice routes',async()=>{
 const chat=await harness();await chat.send('Hola, revisemos los acuerdos');assert.deepEqual(business(chat).map(x=>x.kind),['chat']);assert.equal(chat.node('station-message').value,'');chat.dispose();
 const voice=await harness();voice.setVoice({phase:'listening'});await voice.send('Hola, revisemos los acuerdos');assert.deepEqual(business(voice).map(x=>x.kind),['voice']);assert.equal(voice.environment.typedTurns.length,1);voice.dispose();
 const classic=await harness();classic.environment.selection.pilot=false;await classic.send('Abre costos');assert.equal(classic.local.length,1);assert.deepEqual(business(classic),[]);assert.deepEqual(classic.presentation,['ppp']);classic.dispose();
 const notPPP=await harness();notPPP.environment.pppEnabled=false;await notPPP.send('Hola');assert.deepEqual(business(notPPP).map(x=>x.kind),['chat']);notPPP.dispose();
});

test('an original pending chat or voice retry bypasses the local command parser and retains its draft',async()=>{
 const chat=await harness();const pending={request_id:'canonical-chat-request',message:'Mensaje original sin confirmar'};chat.environment.chat.pending=pending;
 await chat.send('Abre costos');assert.equal(chat.local.length,0);assert.equal(business(chat)[0].kind,'chat');assert.equal(business(chat)[0].pending,pending);assert.equal(chat.node('station-message').value,'Abre costos','a different draft cannot be cleared by checking an older request');chat.dispose();
 const voice=await harness();voice.setVoice({phase:'listening',text_pending:true});await voice.send('Abre costos');assert.equal(voice.local.length,0);assert.deepEqual(business(voice).map(x=>x.kind),['voice']);assert.equal(business(voice)[0].pending,true);voice.dispose();
});

test('duplicate submits while local navigation waits share the same text event and one flight',async()=>{
 const entered=deferred(),finish=deferred(),h=await harness({receive:value=>{entered.resolve(value);return finish.promise;}});
 const first=h.send('Abre costos'),value=await entered.promise,second=h.submit();assert.equal(h.local.length,1);assert.equal(h.environment.stationSubmission.event_id,value.event_id);
 finish.resolve({handled:true,action_id:'synthetic-action'});assert.equal(await first,true);assert.equal(await second,true);assert.equal(h.local.length,1);assert.deepEqual(business(h),[]);assert.equal(h.prevented(),2);assert.equal(h.environment.stationSubmission,null);h.dispose();
});

test('a newer draft typed during an in-flight submit is preserved and does not become a second send',async()=>{
 const entered=deferred(),finish=deferred(),h=await harness({receive:value=>{entered.resolve(value);return finish.promise;}});
 const first=h.send('Abre costos');await entered.promise;assert.equal(await h.send('Texto nuevo para después'),false);finish.resolve({handled:true});await first;
 assert.equal(h.local.length,1);assert.equal(h.node('station-message').value,'Texto nuevo para después');assert.deepEqual(business(h),[]);h.dispose();
});

test('missing, paused or withdrawn current context never falls through to a business send',async()=>{
 for(const change of [h=>h.environment.selection=null,h=>h.environment.currentSelection=null,h=>h.environment.accessPaused=true,h=>h.environment.dialog.open=false,h=>h.environment.currentSelection={case_id:'other',can_enqueue:true},h=>h.environment.currentSelection={case_id:'synthetic-pilot',can_enqueue:false}]){
  const h=await harness();change(h);assert.equal(await h.send('Hola'),false);assert.equal(h.local.length,0);assert.deepEqual(business(h),[]);assert.equal(h.node('station-message').value,'Hola');h.dispose();
 }
});

test('case, generation or access withdrawal while local parsing awaits prevents a later fallback send',async()=>{
 for(const change of [h=>{h.environment.generation++;},h=>{h.environment.selection={case_id:'other',can_enqueue:true,pilot:true};h.environment.currentSelection=h.environment.selection;},h=>{h.environment.accessPaused=true;}]){
  const entered=deferred(),finish=deferred(),h=await harness({receive:value=>{entered.resolve(value);return finish.promise;}}),flight=h.send('Un mensaje normal');await entered.promise;change(h);finish.resolve({handled:false});await flight;
  assert.deepEqual(business(h),[]);assert.equal(h.node('station-message').value,'Un mensaje normal');h.dispose();
 }
});

test('an uncertain local failure preserves the draft and cannot create a replacement chat mutation',async()=>{
 const h=await harness({receive:async()=>{throw Error('uncertain_local_result');}});assert.equal(await h.send('Cambia a 17 departamentos'),false);assert.deepEqual(business(h),[]);assert.equal(h.node('station-message').value,'Cambia a 17 departamentos');h.dispose();
});

test('the real transcript callback groups only user deltas and always marks voice as incomplete',async()=>{
 const h=await harness(),first={role:'user',delta:'Abre ',start_ms:0,end_ms:300,event_id:'delta-a',sequence:0},second={role:'user',delta:'costos',start_ms:350,end_ms:700,event_id:'delta-b',sequence:1};
 h.transcript(first);h.transcript(second);await Promise.resolve();
 assert.equal(h.local.length,2);assert.equal(h.local[0].event_id,h.local[1].event_id);assert.equal(h.local[1].text,'Abre costos');assert.equal(h.local.every(value=>value.role==='user'&&value.source==='voice'&&value.complete===false),true);
 assert.deepEqual(h.navigation,[]);assert.deepEqual(business(h),[]);assert.equal(h.controller.snapshot()[0].state,'awaiting_confirmation');
 h.transcript({role:'assistant',delta:'Abre ventas',start_ms:800,end_ms:1000,event_id:'assistant-delta',sequence:2});assert.equal(h.local.length,2,'agent prose is rendered but never executed as a user intention');
 await h.controller.confirm(h.controller.snapshot()[0].action_id);assert.deepEqual(h.navigation.map(x=>x.kind),['open','bridge']);assert.deepEqual(business(h),[]);h.dispose();
});

test('the real transcript callback ignores another voice case and clears provisional commands on revocation',async()=>{
 const h=await harness();h.environment.voiceCaseId='other';h.transcript({role:'user',delta:'Abre costos',start_ms:0,end_ms:300,sequence:0});assert.equal(h.local.length,0);assert.equal(h.environment.fragments.length,0);
 h.environment.voiceCaseId='synthetic-pilot';h.transcript({role:'user',delta:'Abre costos',start_ms:400,end_ms:700,sequence:1});assert.equal(h.controller.snapshot().length,1);
 h.environment.selection=null;h.environment.currentSelection=null;assert.deepEqual(h.controller.snapshot(),[]);h.transcript({role:'user',delta:'Abre ventas',start_ms:800,end_ms:1000,sequence:2});assert.equal(h.local.length,1);assert.deepEqual(h.navigation,[]);assert.deepEqual(business(h),[]);h.dispose();
});


test('native schema2 change requests use the original canonical send in text and live voice for every PPP agent',async()=>{
 for(const inVoice of [false,true])for(const pilot of [false,true]){
  const h=await harness();h.environment.selection.pilot=pilot;h.environment.nativeWrite=true;if(inVoice)h.setVoice({phase:'listening'});
  assert.equal(await h.send('Cambia a 17 departamentos'),true);
  assert.deepEqual(business(h).map(x=>[x.kind,x.text]),[[inVoice?'voice':'chat','Cambia a 17 departamentos']]);
  assert.deepEqual(h.presentation,['ppp']);assert.deepEqual(h.navigation,[]);assert.deepEqual(h.controller.snapshot(),[]);
  assert.equal(h.node('station-message').value,'');h.dispose();
 }
});

test('native change voice deltas never become local writes or provisional financial actions',async()=>{
 const h=await harness();h.environment.nativeWrite=true;h.environment.selection.pilot=false;
 h.transcript({role:'user',delta:'Cambia a 17 departamentos',start_ms:0,end_ms:400,sequence:0});await Promise.resolve();
 assert.equal(h.local[0].complete,false);assert.deepEqual(h.controller.snapshot(),[]);assert.deepEqual(h.navigation,[]);assert.deepEqual(h.presentation,[]);assert.deepEqual(business(h),[]);h.dispose();
});

test('a native change preserves the draft if its original canonical send is not confirmed',async()=>{
 const h=await harness();h.environment.nativeWrite=true;h.environment.chat.send=async text=>{h.calls.push({kind:'chat',text});return false;};
 assert.equal(await h.send('Cambia a 17 departamentos'),false);assert.equal(h.node('station-message').value,'Cambia a 17 departamentos');assert.equal(business(h).length,1);assert.deepEqual(h.navigation,[]);h.dispose();
});


test('a native change bypasses the local intention parser even if that presentation subsystem fails',async()=>{
 const h=await harness({receive:async()=>{throw Error('presentation_unavailable');}});h.environment.nativeWrite=true;
 assert.equal(await h.send('Cambia a 17 departamentos'),true);assert.equal(h.local.length,0);assert.deepEqual(business(h).map(x=>x.text),['Cambia a 17 departamentos']);h.dispose();
});

test('the real workspace opener confirms classic DOM visibility without a Puesto2 skin and never starts media',async()=>{
 const {createDOM}=require('./helpers/puesto-dom.cjs'),{workspacePresentationVisible}=await import('../despacho3d/agent-interaction.mjs'),{doc,win}=createDOM();
 win.innerHeight=900;win.getComputedStyle=n=>({display:n.style.display||'block',visibility:n.style.visibility||'visible'});
 const dialog=doc.createElement('dialog'),root=doc.createElement('section'),panel=doc.createElement('section');doc.body.append(dialog);dialog.append(root);root.append(panel);panel.dataset.panel='ppp';dialog.open=true;dialog.classList.add('voice-compact');
 let tab='activity',context={authorized:true,ppp_enabled:true,case_id:'synthetic-nonpilot',scenario_id:'s',revision:'r'},opens=0,media=0;
 const focus=doc.createElement('button');doc.body.append(focus);focus.focus();
 const workspace={root,getTab:()=>tab},env={dialog,workspace,window:win,workspacePresentationVisible,interactionContext:()=>context,openBoard:value=>{opens++;tab=value;dialog.classList.remove('voice-compact');return true;},begin:()=>media++};
 const opener=new vm.Script(bootSource('openInteractionWorkspace')+'\nopenInteractionWorkspace').runInNewContext(env);
 assert.equal(opener({tab:'ppp',context:{case_id:context.case_id}}).status,'confirmed');assert.equal(opens,1);assert.equal(media,0);assert.equal(doc.activeElement,focus);assert.equal(dialog.dataset.puestoScreen,undefined);
 panel.hidden=true;assert.equal(opener({tab:'ppp',context:{case_id:context.case_id}}).status,'unavailable');panel.hidden=false;
 root.style.display='none';assert.equal(opener({tab:'ppp',context:{case_id:context.case_id}}).status,'unavailable');root.style.display='block';
 panel.getBoundingClientRect=()=>({width:300,height:200,top:1000,left:0,bottom:1200,right:300});assert.equal(opener({tab:'ppp',context:{case_id:context.case_id}}).status,'unavailable');
 context={...context,authorized:false};assert.equal(opener({tab:'ppp',context:{case_id:context.case_id}}).status,'unavailable');
});

test('classic confirmation and retry cards stay in the chat and stale controls cannot act after access withdrawal',async()=>{
 const {createDOM}=require('./helpers/puesto-dom.cjs'),{renderInteractionCards}=await import('../despacho3d/agent-interaction.mjs'),{doc}=createDOM();
 const chat=doc.createElement('details'),host=doc.createElement('section');doc.body.append(chat);chat.append(host);let current=true;const calls=[];
 const records=[{action_id:'nav-1',context:{case_id:'a',scenario_id:'s'},state:'awaiting_confirmation',text:'Abre el plan',summary:'Confirma el texto',next:'Revisar'},{action_id:'write-1',request_id:'same-request',context:{case_id:'a'},state:'uncertain',text:'Cambio pendiente',summary:'Sin confirmar',next:'Consultar recibo'},{action_id:'foreign',context:{case_id:'b'},state:'awaiting_confirmation',text:'Private foreign'}];
 renderInteractionCards({host,records,caseId:'a',isCurrent:()=>current,handlers:{confirm:id=>calls.push(['confirm',id]),retry:id=>calls.push(['retry',id])}});
 assert.equal(host.parentNode,chat);assert.equal(host.hidden,false);assert.doesNotMatch(host.textContent,/Private foreign/);
 const buttons=host.querySelectorAll('button');assert.equal(buttons.length,2);assert.match(buttons[0].textContent,/Confirmar/);assert.match(buttons[1].textContent,/mismo recibo/);buttons[0].click();buttons[1].click();assert.deepEqual(calls,[['confirm','nav-1'],['retry','write-1']]);
 current=false;buttons[0].click();buttons[1].click();assert.equal(calls.length,2);renderInteractionCards({host,records,caseId:'a',isCurrent:()=>current});assert.equal(host.hidden,true);assert.equal(host.textContent,'');
});
