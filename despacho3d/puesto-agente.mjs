import {profileWorkView,nextRecordedTask} from './profile-work.mjs?v=140';

// Exact case bindings only. This switch changes presentation, never authorization.
export const PUESTO2_AGENT_IDS=Object.freeze([]);
export const PUESTO2_PILOT=Object.freeze({project:'torre ruisenor',avatar:'ruisenor'});
const identity=value=>typeof value==='string'?value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es'):'';
export function presentationLocation(win=window){
 try{if(win.parent!==win&&win.parent.location.origin===win.location.origin&&new URLSearchParams(win.parent.location.search).get('puesto')==='clasico')return win.parent.location;}catch{}
 return win.location;
}
export function isPuesto2(selection,location={search:''},enabledIds=PUESTO2_AGENT_IDS){
 const query=new URLSearchParams(typeof location==='string'?new URL(location,'https://example.invalid').search:location?.search||'');
 if(query.get('puesto')==='clasico'||typeof selection?.case_id!=='string'||!selection.case_id)return false;
 if(enabledIds.includes(selection.case_id))return true;
 return selection.avatar?.case_id===selection.case_id&&identity(selection.name)===PUESTO2_PILOT.project&&identity(selection.avatar.name)===PUESTO2_PILOT.avatar;
}
const labels=['Utilidad','Margen','TIR','Pico de deuda'];
const emptyMetrics=()=>labels.map(label=>({label,value:'—'}));
const number=value=>typeof value==='number'&&Number.isFinite(value);
const money=value=>Math.abs(value)>=1000000?new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(value/1000000)+' M':new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
const percent=value=>new Intl.NumberFormat('es-MX',{maximumFractionDigits:2}).format(value)+' %';
const dateLabel=value=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('es-MX',{timeZone:'America/Hermosillo',day:'numeric',month:'short',year:'numeric'}):'';

// A summary is a projection of one authorized, confirmed snapshot. Never combine
// figures from an alternate scenario, an unconfirmed edit or another case.
export function essentialCase(snapshot={}){
 const id=snapshot.case_id,selection=snapshot.selected;
 const view={case_id:id||null,version:'Sin versión confirmada',metrics:emptyMetrics(),next:'Consulta el trabajo registrado para elegir el siguiente paso.',pending:[],phase:'loading',workPhase:'loading',confirmedEmpty:false,readOnly:false};
 if(!id||selection?.case_id!==id)return view;
 const work=profileWorkView(snapshot.goalState||{},id,selection.goals?.ready===true);
 const pending=[...work.groups.review,...work.groups.blocked,...work.groups.now];
 view.pending=pending.slice(0,3).map(goal=>({title:goal.title,status:goal.status,label:({queued:'Por iniciar',running:'En curso',awaiting_data:'Falta información',ready_for_review:'Para revisar'})[goal.status]||goal.status}));
 const first=work.selected,task=first&&nextRecordedTask(first);
 if(first)view.next=task?.title||first.summary||first.criterion||first.title;
 else if(work.confirmedEmpty)view.next='No hay encargos activos. Puedes conversar o definir el siguiente.';
 view.phase=work.phase;view.workPhase=work.phase;view.confirmedEmpty=work.confirmedEmpty;
 const board=snapshot.board;
 if(!board||board.case_id!==id||board.confirmed!==true||board.pending||typeof board.revision!=='string'||!board.revision)return view;
 const version=board.scenario_name||board.scenario_id,context=board.version_context;
 if(selection.ppp?.scenario_id&&selection.ppp.scenario_id!==board.scenario_id)return view;
 if(!version||context?.defended_scenario_id&&context.defended_scenario_id!==board.scenario_id)return view;
 view.version='Versión '+version+' · revisión '+board.revision;
 const viewed=context?.viewed_scenario_name||context?.viewed_scenario_id;
 if(viewed&&context?.viewed_scenario_id!==board.scenario_id)view.version+=' · en el plan: '+viewed;
 const date=dateLabel(board.observed_at);if(date)view.version+=' · Consulta: '+date;
 const results=board.results||{};
 view.metrics=[['Utilidad','utilidad',money],['Margen','margen_pct',percent],['TIR','tir_dev_pct',percent],['Pico de deuda','pico_deuda',money]].map(([label,key,format])=>({label,value:number(results[key])?format(results[key]):'—'}));
 view.readOnly=board.version_context?.read_only===true;
 view.phase='ready';
 return view;
}

export function mountPuestoAgente({dialog,sidebar,workspaceHost,workspace,getSelection,doc=document,win=window}){
 let selection=null,active=false,voiceState={},nodes=null,positions=[],previousChatOpen=false,observer=null,screen='conversation',parentPill=null;
 const element=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls)=>{const n=element('button',text,cls);n.type='button';n.addEventListener('click',fn);return n;};
 const byId=id=>dialog.querySelector('#'+id);
 function move(node,parent){if(!node||!parent)return;const marker=doc.createComment('puesto2-position');node.parentNode.insertBefore(marker,node);positions.push({node,marker});parent.append(node);}
 function valid(){const current=getSelection?.();return active&&selection?.case_id===current?.case_id&&isPuesto2(current,presentationLocation(win));}
 function showView(tab,apply=true){
  if(!valid())return false;
  if(tab==='conversation'){screen='conversation';dialog.dataset.puestoScreen=screen;nodes.back.hidden=true;nodes.presenceLabel.textContent='Conversemos';nodes.essential.open=win.innerWidth>760;return true;}
  if(!['ppp','activity','sources','tasks','moac','browser','knowledge','meeting','avatar'].includes(tab))return false;
  screen=tab;dialog.dataset.puestoScreen=tab;nodes.back.hidden=false;nodes.presenceLabel.textContent=tab==='ppp'?'Revisemos el plan juntos':tab==='sources'?'Expediente del caso':'Trabajo del caso';if(apply&&workspace.getTab?.()!==tab)workspace.setTab(tab);return true;
 }
 function build(){
  const layout=dialog.querySelector('.voice-layout'),chat=dialog.querySelector('.station-chat'),form=byId('station-message-form');
  if(!layout||!chat||!form)return false;
  const head=element('header',undefined,'puesto-header'),identity=element('div',undefined,'puesto-heading-identity'),name=element('strong'),project=element('span'),status=element('span','Actualizando…','puesto-state');status.setAttribute('role','status');
  identity.append(name,project);head.append(identity,status);dialog.insertBefore(head,layout);move(dialog.querySelector('.voice-close'),head);head.insertBefore(head.lastChild,identity);
  const back=button('← Volver a la conversación',()=>showView('conversation'),'puesto-back');back.hidden=true;head.append(back);
  const record=button('Grabar reunión',()=>{if(!valid())return;const original=[...workspace.root.querySelectorAll('[data-panel="ppp"] button')].find(n=>n.textContent==='Grabar reunión del proyecto');original?.click();},'puesto-record');head.append(record);
  const settings=element('details',undefined,'puesto-settings'),settingsTitle=element('summary','•••');settingsTitle.setAttribute('aria-label','Ajustes y detalles');settings.append(settingsTitle);const settingsBody=element('div',undefined,'puesto-settings-body');settings.append(settingsBody);head.append(settings);
  for(const node of [dialog.querySelector('.station-details'),dialog.querySelector('.voice-options'),byId('station-refresh'),byId('voice-save'),byId('voice-previous'),byId('voice-download'),byId('station-menu')])move(node,settingsBody);
  const technical=element('details'),technicalTitle=element('summary','Detalles de conexión');technical.append(technicalTitle);move(dialog.querySelector('.voice-state-card'),technical);settingsBody.append(technical);
  const presence=element('section',undefined,'puesto-presence'),presenceLabel=element('small','Conversemos','puesto-presence-label'),presenceWords=element('div',undefined,'puesto-presence-words');presenceWords.append(presenceLabel);move(byId('voice-title'),presenceWords);move(byId('voice-case'),presenceWords);presence.append(presenceWords);move(dialog.querySelector('.station-profile-portrait'),presence);presence.insertBefore(presence.lastChild,presenceWords);sidebar.insertBefore(presence,sidebar.firstChild);
  // Native details keeps an anonymous content box; a real sibling owns flex
  // sizing so the composer stays at the bottom on every supported browser.
  // The original disclosure remains open for the existing history lifecycle.
  const chatContent=element('div',undefined,'puesto-chat-content');sidebar.append(chatContent);
  const thread=element('div',undefined,'puesto-thread');thread.setAttribute('aria-label','Conversación e historial');chatContent.append(thread);move(byId('station-messages'),thread);move(dialog.querySelector('.voice-transcript-details'),thread);
  move(form,chatContent);move(byId('station-message-status'),chatContent);move(byId('station-write'),chatContent);
  const composerTools=element('div',undefined,'puesto-composer-tools');form.append(composerTools);for(const id of ['voice-start','voice-interrupt','voice-stop','voice-play','station-send'])move(byId(id),composerTools);
  const prompts=element('div',undefined,'puesto-prompts');prompts.setAttribute('aria-label','Ideas para conversar');for(const label of ['¿Qué sigue?','Resumen del caso','¿Qué cambió?'])prompts.append(button(label,()=>{if(!valid())return;byId('station-message').value=label;byId('station-message').focus();}));chatContent.insertBefore(prompts,form);
  previousChatOpen=chat.open;chat.open=true;
  const essential=element('details',undefined,'puesto-essential');essential.open=win.innerWidth>760;essential.append(element('summary','Lo esencial del caso'));const essentialBody=element('div',undefined,'puesto-essential-body'),version=element('p','Sin versión confirmada','puesto-version'),metrics=element('dl',undefined,'puesto-metrics'),nextTitle=element('small','QUÉ SIGUE','puesto-section-label'),next=element('p',undefined,'puesto-next'),decide=button('Ver siguiente decisión',()=>showView('activity'),'puesto-decide'),pendingHeading=element('h3','Pendientes'),pending=element('ul',undefined,'puesto-pending'),access=element('nav',undefined,'puesto-access');access.setAttribute('aria-label','Accesos del caso');
  for(const [tab,label]of [['ppp','Ver plan completo'],['activity','Trabajo'],['sources','Expediente']])access.append(button(label,()=>showView(tab)));
  const versionAction=button('Consultar versiones',()=>showView('knowledge'),'puesto-version-action');
  essentialBody.append(version,metrics,nextTitle,next,decide,pendingHeading,pending,access,versionAction);essential.append(essentialBody);layout.append(essential);
  const onTab=e=>{if(valid()&&e.detail?.case_id===selection.case_id&&e.detail?.tab)showView(e.detail.tab,false);};win.addEventListener('yod-workspace-view',onTab);
  let following=true;thread.addEventListener('scroll',()=>{following=thread.scrollHeight-thread.clientHeight-thread.scrollTop<80;});
  observer=new win.MutationObserver(()=>{if(!valid())return;updateWorkspace();updateStatus();if(following)thread.scrollTop=thread.scrollHeight;});
  observer.observe(byId('station-messages'),{childList:true,subtree:true});observer.observe(byId('voice-transcript'),{childList:true,subtree:true,characterData:true});observer.observe(workspace.root,{childList:true,subtree:true});
  nodes={head,name,project,status,back,presence,presenceLabel,thread,composerTools,prompts,essential,version,metrics,next,pending,settings,settingsBody,technical,onTab,chat,chatContent};return true;
 }
 function updateWorkspace(){
  if(!valid()||!nodes)return;
  const snapshot=workspace.presentationSnapshot?.()||{case_id:selection.case_id};
  const value=essentialCase({...snapshot,selected:getSelection?.()});
  if(value.case_id!==selection.case_id)return;
  if(nodes.version.textContent!==value.version)nodes.version.textContent=value.version;
  const signature=JSON.stringify(value.metrics);if(nodes.metrics.dataset.value!==signature){nodes.metrics.replaceChildren();for(const metric of value.metrics){const box=element('div'),term=element('dt',metric.label),amount=element('dd',metric.value);box.append(term,amount);nodes.metrics.append(box);}nodes.metrics.dataset.value=signature;}
  if(nodes.next.textContent!==value.next)nodes.next.textContent=value.next;
  const tasks=JSON.stringify(value.pending);if(nodes.pending.dataset.value!==tasks){nodes.pending.replaceChildren();for(const task of value.pending){const item=element('li');item.append(element('span',task.title),element('small',task.label));nodes.pending.append(item);}if(!value.pending.length)nodes.pending.append(element('li',value.confirmedEmpty?'Sin pendientes activos registrados.':'Esperando el registro de pendientes.'));nodes.pending.dataset.value=tasks;}
 }
 function updateStatus(){
  if(!valid()||!nodes)return;
  for(const node of [...byId('station-messages').querySelectorAll('p'),...byId('voice-transcript').querySelectorAll('article')]){const label=node.querySelector('b')?.textContent||'';node.dataset.speaker=label==='Tú'||label.startsWith('Tú ·')?'user':'agent';}
  const access=byId('station-access'),message=byId('station-message-status')?.textContent||'',snapshot=workspace.presentationSnapshot?.();let label='Disponible para conversar';
  if(access&&!access.hidden)label=access.textContent||'Reconecta el puesto';
  else if(!selection.can_enqueue)label='Modo consulta';
  else if(voiceState.incomplete||voiceState.pending||voiceState.text_pending)label='Guardado por confirmar';
  else if(voiceState.phase==='listening')label=voiceState.muted?'Micrófono en pausa':'Escuchando…';
  else if(voiceState.phase==='starting')label='Conectando voz…';
  else if(voiceState.phase==='closing')label='Cerrando conversación…';
  else if(voiceState.phase==='error')label='La voz necesita reconectarse';
  else if(message==='Consultando…')label='Actualizando conversación…';
  else if(/no se pudo|no pudimos|no se confirmó|no se completó/i.test(message))label='Revisa el mensaje de la conversación';
  else if(snapshot?.board?.pending)label='Cambios por confirmar';
  else if(snapshot?.board?.confirmed===true&&(!getSelection?.()?.ppp?.scenario_id||getSelection?.()?.ppp?.scenario_id===snapshot.board.scenario_id))label='Lectura confirmada';
  if(nodes.status.textContent!==label)nodes.status.textContent=label;
  byId('voice-start')?.setAttribute('aria-label','Activar micrófono y hablar');
  const stop=byId('voice-stop');if(stop&&!stop.hidden&&voiceState.phase!=='closing')stop.textContent='Detener';
 }
 function deactivate(){
  observer?.disconnect();observer=null;
  if(nodes){win.removeEventListener('yod-workspace-view',nodes.onTab);for(const {node,marker}of positions.reverse()){marker.replaceWith(node);}nodes.chat.open=previousChatOpen;for(const node of [nodes.head,nodes.presence,nodes.thread,nodes.composerTools,nodes.prompts,nodes.essential,nodes.chatContent])node.remove();}
  if(parentPill){parentPill.node.hidden=parentPill.hidden;parentPill=null;}
  positions=[];nodes=null;active=false;selection=null;voiceState={};delete dialog.dataset.puestoScreen;dialog.classList.remove('puesto2');doc.documentElement.classList.remove('puesto2-open');
 }
 function setSelection(value){
  if(!isPuesto2(value,presentationLocation(win))||getSelection?.()?.case_id!==value.case_id){deactivate();return false;}
  if(active&&selection?.case_id===value.case_id){selection=value;updateWorkspace();return true;}
  deactivate();selection=value;active=true;if(!build()){deactivate();return false;}
  dialog.classList.add('puesto2');doc.documentElement.classList.add('puesto2-open');
  try{if(win.parent!==win&&win.parent.location.origin===win.location.origin){const pill=win.parent.document.getElementById('despachoEquipo');if(pill){parentPill={node:pill,hidden:pill.hidden};pill.hidden=true;}}}catch{}nodes.name.textContent=value.avatar?.name||value.name;nodes.project.textContent=value.name;showView('conversation');updateWorkspace();updateStatus();return true;
 }
 return{setSelection,renderState(state={}){voiceState=state;updateStatus();},updateWorkspace,showView,isActive:()=>valid(),dispose:deactivate};
}
