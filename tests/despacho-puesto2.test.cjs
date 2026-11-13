'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createDOM}=require('./helpers/puesto-dom.cjs');
const load=()=>import('../despacho3d/puesto-agente.mjs');
const pilot=()=>({case_id:'synthetic-pilot',name:'Torre Ruiseñor',avatar:{case_id:'synthetic-pilot',name:'Ruiseñor'},goals:{ready:false}});
function station(){
 const {doc,win}=createDOM(),make=(tag,cls,id)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(id)n.id=id;return n;};
 const dialog=make('dialog','realtime-dialog has-workspace'),layout=make('div','voice-layout'),sidebar=make('div','voice-sidebar'),workspaceHost=make('div','voice-workspace'),root=make('section','agent-workspace');
 doc.body.append(dialog);dialog.append(layout);layout.append(sidebar,workspaceHost);workspaceHost.append(root);
 const heading=make('div','station-heading'),close=make('button','voice-close'),menu=make('button',null,'station-menu');heading.append(close,menu);sidebar.append(heading);
 for(const id of ['station-access','voice-title','voice-case','station-message-status'])sidebar.append(make('p',null,id));
 doc.getElementById('station-access').hidden=true;
 sidebar.append(make('div','station-profile-portrait'));
 const voiceCard=make('section','voice-state-card'),options=make('details','voice-options');voiceCard.append(options);sidebar.append(voiceCard);
 for(const id of ['voice-start','voice-stop','voice-interrupt','voice-play','voice-save','voice-previous'])voiceCard.append(make(id==='voice-save'?'p':'button',null,id));
 const chat=make('details','station-chat'),summary=make('summary'),messages=make('div',null,'station-messages'),transcript=make('section','voice-transcript-details'),form=make('form',null,'station-message-form'),textarea=make('textarea',null,'station-message'),send=make('button',null,'station-send'),refresh=make('button',null,'station-refresh'),activity=make('details','station-details');
 chat.append(summary,messages,transcript,form,refresh,activity);transcript.append(make('div',null,'voice-transcript'),make('button',null,'voice-download'));form.append(textarea,send);sidebar.append(chat);
 const ppp=make('section');ppp.dataset.panel='ppp';root.append(ppp);
 let selection=pilot(),mic=0,sends=0,tab='ppp';const visited=[];
 doc.getElementById('voice-start').addEventListener('click',()=>mic++);form.addEventListener('submit',()=>sends++);
 const workspace={root,getTab:()=>tab,setTab(id){tab=id;visited.push(id);win.dispatchEvent({type:'yod-workspace-view',detail:{case_id:selection?.case_id,tab:id}});},presentationSnapshot:()=>({case_id:selection?.case_id,selected:selection,goalState:{}})};
 return {doc,win,dialog,sidebar,workspaceHost,workspace,getSelection:()=>selection,setSelection:s=>selection=s,chat,form,textarea,send,messages,visited,counters:()=>({mic,sends,tab})};
}

test('Puesto2 pilot requires the exact authorized avatar/project pair and the classic switch wins',async()=>{
 const {isPuesto2}=await load();
 const selection={case_id:'synthetic-pilot',name:'Torre Ruiseñor',avatar:{case_id:'synthetic-pilot',name:'Ruiseñor'}};
 assert.equal(isPuesto2(selection,{search:''}),true);
 assert.equal(isPuesto2(selection,{search:'?puesto=clasico'}),false);
 assert.equal(isPuesto2(selection,{search:'?x=1&puesto=clasico'}),false);
 for(const change of [{name:'Otro proyecto'},{name:'Torre Ruiseñor II'},{avatar:{case_id:'other',name:'Ruiseñor'}},{avatar:{case_id:'synthetic-pilot',name:'Otro autón'}},{avatar:null}])
  assert.equal(isPuesto2({...selection,...change},{search:'?puesto=2'}),false,'another project or avatar cannot inherit the pilot');
 assert.equal(isPuesto2({case_id:'synthetic-other',name:'Ruiseñor'},{search:'?puesto=2'}),false,'display name or query cannot enable a case');
 assert.equal(isPuesto2(null,{search:''}),false);
});

test('case essentials never display another project or invent an approved revision',async()=>{
 const {essentialCase}=await load();
 const foreign=essentialCase({case_id:'synthetic-a',selected:{case_id:'synthetic-a'},board:{case_id:'synthetic-b',confirmed:true,pending:false,revision:'foreign-private-revision',scenario_name:'Foreign private scenario',results:{utilidad:99999999,margen_pct:88,tir_dev_pct:77,pico_deuda:6666666}}});
 assert.doesNotMatch(JSON.stringify(foreign),/foreign-private|Foreign private|99999999|6666666/);
 const pending=essentialCase({case_id:'synthetic-a',selected:{case_id:'synthetic-a'},board:{case_id:'synthetic-a',confirmed:false,pending:true,revision:'unconfirmed-revision',scenario_name:'Synthetic current',results:{utilidad:100,margen_pct:10,tir_dev_pct:20,pico_deuda:200}}});
 assert.doesNotMatch(pending.version,/aprobada|vigente/i,'an unconfirmed board cannot be described as owner approved');
 assert.equal(pending.metrics.length,4);
});

test('four figures come from the same confirmed defended snapshot with finite values and explicit version',async()=>{
 const {essentialCase}=await load(),selected=pilot(),id=selected.case_id;
 const board={case_id:id,scenario_id:'defended-a',scenario_name:'Synthetic A',revision:'r17',confirmed:true,pending:false,observed_at:'2026-10-20T12:00:00Z',results:{utilidad:12500000,margen_pct:24.3,tir_dev_pct:28.4,pico_deuda:8200000},version_context:{defended_scenario_id:'defended-a',viewed_scenario_id:'viewed-b',viewed_scenario_name:'Synthetic B',read_only:true}};
 const view=essentialCase({case_id:id,selected,board});
 assert.deepEqual(view.metrics.map(m=>m.label),['Utilidad','Margen','TIR','Pico de deuda']);
 assert.match(view.metrics[0].value,/12\.5.*M/);assert.equal(view.metrics[1].value,'24.3 %');assert.equal(view.metrics[2].value,'28.4 %');assert.match(view.metrics[3].value,/8\.2.*M/);
 assert.match(view.version,/Synthetic A.*r17/);assert.match(view.version,/en el plan: Synthetic B/);assert.match(view.version,/Consulta:/);assert.doesNotMatch(view.version,/aprobad/i);assert.equal(view.readOnly,true);
 const other=essentialCase({case_id:id,selected,board:{...board,scenario_id:'wrong-scenario'}});assert.deepEqual(other.metrics.map(m=>m.value),['—','—','—','—'],'another scenario cannot borrow the defended version label');
 const stale=essentialCase({case_id:id,selected:{...selected,ppp:{scenario_id:'new-defended-scenario'}},board});assert.deepEqual(stale.metrics.map(m=>m.value),['—','—','—','—'],'cached figures cannot contradict the current registered scenario');
 for(const invalid of [undefined,null,NaN,Infinity,'24.3']){
  const missing=essentialCase({case_id:id,selected,board:{...board,results:{...board.results,margen_pct:invalid}}});assert.equal(missing.metrics[1].value,'—');
 }
 for(const patch of [{pending:true},{confirmed:false}])assert.deepEqual(essentialCase({case_id:id,selected,board:{...board,...patch}}).metrics.map(m=>m.value),['—','—','—','—']);
});

test('essential pending work is bounded to three items from the selected case',async()=>{
 const {essentialCase}=await load(),selected={...pilot(),goals:{ready:true}},id=selected.case_id;
 const goals=Array.from({length:5},(_,i)=>({case_id:id,goal_id:'g'+i,title:'Synthetic task '+i,status:'running',updated_at:'2026-10-20T12:00:00Z',tasks:[]}));goals.unshift({...goals[0],case_id:'foreign',title:'Foreign private goal'});
 const view=essentialCase({case_id:id,selected,goalState:{status:'ready',model:{goals}}});
 assert.equal(view.pending.length,3);assert.doesNotMatch(JSON.stringify(view),/Foreign private/);
});

test('classic mode is inherited from the same-origin OS shell without crossing an origin boundary',async()=>{
 const {presentationLocation}=await load(),location={origin:'https://example.test',search:''},parentLocation={origin:location.origin,search:'?puesto=clasico'},win={location,parent:{location:parentLocation}};
 assert.equal(presentationLocation(win),parentLocation);
 win.parent={location:{origin:'https://other.test',search:'?puesto=clasico'}};assert.equal(presentationLocation(win),location);
 Object.defineProperty(win,'parent',{get(){throw Error('cross_origin');}});assert.equal(presentationLocation(win),location);
});

test('Puesto2 reuses the original message and microphone handlers without starting either on entry',async()=>{
 const {mountPuestoAgente}=await load(),s=station();
 const originalTree=new Map([s.dialog,...s.dialog.all()].map(node=>[node,{parent:node.parentNode,children:[...node.children]}]));
 const sendParent=s.send.parentNode,mic=s.doc.getElementById('voice-start'),micParent=mic.parentNode;
 const ui=mountPuestoAgente(s);assert.equal(ui.setSelection(s.getSelection()),true);
 assert.equal(s.dialog.querySelector('#station-send'),s.send);
 assert.equal(s.dialog.querySelector('#station-message-form'),s.form);
 assert.equal(s.dialog.querySelector('#station-messages'),s.messages);
 assert.equal(s.dialog.querySelector('#voice-start'),mic);
 assert.equal(s.chat.open,true,'history is visible on entry');
 assert.equal(s.chat.contains(s.form),false,'the composer is outside the native disclosure so its intrinsic layout cannot strand the input in the middle');
 assert.deepEqual(s.counters(),{mic:0,sends:0,tab:'ppp'});
 s.textarea.value='Synthetic message';s.form.emit('submit');assert.equal(s.counters().sends,1);
 mic.click();assert.equal(s.counters().mic,1,'only the original explicit mic action requests media');
 ui.showView('ppp');ui.showView('activity');ui.showView('sources');assert.deepEqual(s.visited,['activity','sources'],'view notifications cannot recursively dispatch another navigation');
 assert.equal(s.dialog.dataset.puestoScreen,'sources');ui.showView('conversation');assert.equal(s.dialog.dataset.puestoScreen,'conversation');
 s.win.location.search='?puesto=clasico';assert.equal(ui.setSelection(s.getSelection()),false);
 assert.equal(s.send.parentNode,sendParent,'classic mode restores the existing composer');
 assert.equal(mic.parentNode,micParent,'classic mode restores the original voice controls');
 assert.equal(s.chat.open,false,'classic disclosure state is restored');
 assert.equal(s.dialog.classList.contains('puesto2'),false);
 assert.equal(s.textarea.value,'Synthetic message','mode changes preserve drafts');
 assert.equal(s.dialog.all().length,originalTree.size-1,'classic mode removes all adapter-only wrappers');
 for(const [node,before]of originalTree){assert.equal(node.parentNode,before.parent,'classic restores each original parent');assert.deepEqual(node.children,before.children,'classic restores the original child order');}
 assert.equal(s.counters().mic,1,'restoring classic does not start media');ui.dispose();
});

test('withdrawing the selected case disables every Puesto2 navigation path',async()=>{
 const {mountPuestoAgente}=await load(),s=station(),ui=mountPuestoAgente(s);
 ui.setSelection(s.getSelection());s.setSelection(null);
 assert.equal(ui.showView('ppp'),false);assert.deepEqual(s.visited,[]);
 assert.equal(ui.isActive(),false);ui.setSelection(null);
 assert.equal(s.dialog.querySelector('.puesto-essential'),null);
 assert.equal(s.dialog.classList.contains('puesto2'),false);assert.equal(s.counters().mic,0);ui.dispose();
});

test('the pilot bypasses the ring for clicks and proximity without requesting automatic voice',async()=>{
 const {mountAgentMenu}=await import('../despacho3d/agent-menu.mjs'),{doc,win}=createDOM(),selection={...pilot(),can_enqueue:true},calls=[];
 const button=doc.createElement('button');button.id='circulo-open';doc.body.append(button);
 win.YodResidentAgents={getSelection:()=>selection,subscribe:()=>()=>{},subscribeAuthorizedProfiles:()=>()=>{}};
 win.YodVoiceWorkspace={openForCase:async(...args)=>{calls.push(args);return true;},isOpen:()=>true};
 const previous=global.CustomEvent;global.CustomEvent=win.CustomEvent;
 try{
  assert.equal(mountAgentMenu({doc,win}),true);
  assert.equal(await win.YodAgentMenu.showRadial(selection.case_id),true);
  assert.equal(await win.YodAgentMenu.showRadial(selection.case_id,{proximity:true}),true);
  assert.equal(calls.length,2);
  for(const call of calls){assert.equal(call[0],selection.case_id);assert.deepEqual(call[2],{startVoice:false,compactOnly:false});}
  assert.equal(win.YodAgentMenu.isOpen(),false,'the circle remains closed');
  win.location.search='?puesto=clasico';await win.YodAgentMenu.openForCase(selection.case_id,'conversaciones');
  assert.deepEqual(calls.at(-1)[2],{startVoice:true,compactOnly:true},'classic explicit voice action retains its original behavior');
 }finally{if(previous===undefined)delete global.CustomEvent;else global.CustomEvent=previous;}
});

// Run the actual closed boot functions with isolated collaborators. This avoids
// a media-capable browser and checks the extra entry paths, not a second implementation.
function bootFunction(name,environment){
 const source=fs.readFileSync(path.join(__dirname,'../despacho3d/live-voice-core.mjs'),'utf8');
 const start=source.indexOf('  async function '+name+'(');assert.ok(start>=0);
 const remainder=source.slice(start),end=remainder.search(/\n  (?:async function|function|const workspace|open\.addEventListener)/);
 assert.ok(end>0);return new vm.Script(remainder.slice(0,end)+'\n'+name).runInNewContext(environment);
}
function visibilityRuntime(win,extra={}){
 const source=fs.readFileSync(path.join(__dirname,'../despacho3d/live-voice-core.mjs'),'utf8');
 const functions=['setParentTeamHidden','visibility','dismiss'].map(name=>{
  const start=[source.indexOf('  function '+name+'('),source.indexOf('  async function '+name+'(')].find(index=>index>=0);
  assert.ok(start>=0,name+' exists');const end=source.indexOf('\n  }\n',start);assert.ok(end>start);
  return source.slice(start,end+5);
 }).join('\n');
 return new vm.Script(functions+'\n({visibility,dismiss})').runInNewContext({window:win,CustomEvent:win.CustomEvent,parentTeam:null,...extra});
}

test('full stations hide the parent Equipo launcher and restore its prior state after compacting',()=>{
 const {win}=createDOM(),parent=createDOM(),pill=parent.doc.createElement('div');pill.id='despachoEquipo';parent.doc.body.append(pill);
 win.location.origin='https://example.test';win.parent={location:{origin:win.location.origin},document:parent.doc};
 const runtime=visibilityRuntime(win);
 runtime.visibility(true);assert.equal(pill.hidden,true,'the parent launcher cannot intercept the station back button');
 runtime.visibility(true);runtime.visibility(false);assert.equal(pill.hidden,false,'repeated presentation does not replace the original state');
 pill.hidden=true;runtime.visibility(true);runtime.visibility(false);assert.equal(pill.hidden,true,'a launcher hidden by its owner stays hidden');
});

test('closing the pilot restores Equipo after its own nested visibility lifecycle',async()=>{
 const {mountPuestoAgente}=await load(),s=station(),parent=createDOM(),pill=parent.doc.createElement('div');pill.id='despachoEquipo';parent.doc.body.append(pill);
 s.win.location.origin='https://example.test';s.win.parent={location:{origin:s.win.location.origin},document:parent.doc};
 const ui=mountPuestoAgente(s);let closed=0,deactivated=0;
 const runtime=visibilityRuntime(s.win,{dismissing:false,suppressEncounter(){},active:()=>false,voice:{snapshot:()=>({phase:'idle'}),stop:async()=>({phase:'idle'})},generation:1,selection:s.getSelection(),puesto:ui,interaction:null,stopWatching:null,goalReader:{hide(){}},workspace:{setActive:value=>{assert.equal(value,false);deactivated++;}},dialog:{close(){closed++;}},previousFocus:null});
 runtime.visibility(true);ui.setSelection(s.getSelection());assert.equal(pill.hidden,true);
 await runtime.dismiss();assert.equal(closed,1);assert.equal(deactivated,1);assert.equal(pill.hidden,false,'pilot cleanup restores its nested state before the common owner restores the launcher');
 ui.dispose();
});

test('standalone and cross-origin stations do not touch a parent launcher',()=>{
 for(const crossOrigin of [false,true]){
  const {win}=createDOM();win.location.origin='https://example.test';
  win.parent=crossOrigin?{get location(){throw Error('cross-origin');}}:win;
  const runtime=visibilityRuntime(win);assert.doesNotThrow(()=>{runtime.visibility(true);runtime.visibility(false);});
 }
});
test('pilot reopening suppresses a caller asking for automatic voice and proximity cannot request a microphone',async()=>{
 const selected=pilot();let requests=0,opened=0,started=0;
 const voice={snapshot:()=>({phase:'idle'})},base={selection:selected,pilot:()=>true,voice,active:()=>false,accessPaused:false,window:{YodResidentAgents:{getSelection:()=>selected}}};
 const open=bootFunction('openForCase',{...base,voiceCaseId:null,dialog:{open:true},openBoard:()=>opened++,requestBegin:()=>requests++});
 assert.equal(await open(selected.case_id,'ppp',{startVoice:true,encounter:true,compactOnly:true}),true);assert.equal(requests,0);assert.equal(opened,1);
 const request=bootFunction('requestBegin',{...base,encounterNeedsMic:false,renderVoiceState(){},begin:()=>started++});
 await request(true);assert.equal(started,0,'approaching the pilot cannot start media');
});

test('freshly resolved pilot access also suppresses automatic voice before opening its station',async()=>{
 const selected={...pilot(),can_enqueue:true},dialog={open:false,querySelector:()=>({open:false})},fields=new Map(),modes=[];let reads=0,requests=0,workspaceOpens=0,selectedUI=0;
 const node=id=>{if(!fields.has(id))fields.set(id,{hidden:false,disabled:false,textContent:''});return fields.get(id);};
 const environment={interaction:null,selection:null,pilot:value=>value?.case_id===selected.case_id,voice:{snapshot:()=>({phase:'idle'}),stateForCase:()=>({creation_uncertain:false})},active:()=>false,voiceCaseId:null,dialog,window:{YodResidentAgents:{getSelection:()=>++reads===1?null:selected}},document:{activeElement:null},previousFocus:null,accessPaused:false,node,generation:0,transcriptCase:selected.case_id,compactVoice:true,puesto:{setSelection:()=>selectedUI++},workspace:{open:()=>workspaceOpens++},portrait:{open(){}},setText(){},agentName:()=>selected.avatar.name,renderVoiceState(){},requestBegin:()=>requests++};
 environment.present=value=>{modes.push(value);environment.compactVoice=value;dialog.open=true;};
 const open=bootFunction('openForCase',environment);
 assert.equal(await open(undefined,'ppp',{startVoice:true,encounter:true,compactOnly:true}),true);
 assert.equal(requests,0);assert.equal(workspaceOpens,1);assert.equal(selectedUI,1);assert.deepEqual(modes,[true,false],'fresh validation replaces compact encounter with the full pilot station');
});

test('presenting a delivery does not implicitly activate the pilot microphone',async()=>{
 const selected=pilot();let starts=0;
 const present=bootFunction('presentMeetingSlide',{selection:selected,accessPaused:false,pilot:()=>true,active:()=>false,voice:{snapshot:()=>({phase:'idle'}),presentSlide:()=>false},begin:()=>starts++,window:{YodResidentAgents:{getSelection:()=>selected}},dialog:{open:true},workspace:{getTab:()=>'meeting'},setText(){},node:()=>({textContent:''}),Date,setTimeout});
 assert.equal(await present({case_id:selected.case_id}),false);assert.equal(starts,0,'a delivery is a view action; only the mic button may start pilot voice');
});
