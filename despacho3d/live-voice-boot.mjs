import {isPuesto2,mountPuestoAgente,presentationLocation} from './puesto-agente.mjs?v=ruisenor1';
import {createAgentInteraction,parseDirectUserCommand,nativeVolumeWrite,workspacePresentationVisible,renderInteractionCards} from './agent-interaction.mjs?v=multivolumen3';
import {officeFastSessions} from './office-preparation.mjs?v=unified283';
import {mountAvatarCard} from './avatar-card.mjs?v=126';
import {AUTONES_MULTIPLES} from './office-config.mjs?v=3';
import {createEntryPreparation} from './voice-preparation.mjs?v=2';
import {residentAccessDecision} from './resident-agents.mjs?v=unified283';
import {createFrameTransport, validateSelection, Conversation} from './conversation.mjs?v=first292';
import {stationIdentity} from './project-station.mjs?v=native-volumes3';
import {createLiveVoice} from './live-voice.mjs?v=close-receipt1';
import {voiceView} from './voice-view.mjs?v=141';
import {createWorkspace} from './agent-workspace.mjs?v=council1';
import {DurableGoals,watchGoals,goalRoadmap,goalDisplay} from './goals.mjs?v=entregas291';
import {createVoiceActionExecutor,coalesceGoalReads} from './voice-actions.mjs?v=132';
import {groupTranscriptFragments} from './live-transcript.mjs';

const open = document.getElementById('voice-open');
if (open) {
  const transport = coalesceGoalReads(createFrameTransport(window)), dialog = document.createElement('dialog');
  dialog.className = 'realtime-dialog has-workspace'; dialog.setAttribute('aria-labelledby','voice-title');
  // Private dynamic text always uses textContent.
  dialog.innerHTML = '<div class="station-heading"><button class="voice-close" aria-label="Volver al despacho">← Despacho</button><button id="station-menu" aria-label="Opciones del personaje">◉</button></div>' +
    '<p id="station-access" role="status" hidden></p><button id="station-reconnect" hidden>Reconectar puesto</button>' +
    '<p class="voice-eyebrow">Puesto del proyecto</p><h1 id="voice-title">Tu autón</h1><p id="voice-case">Comprobando proyecto…</p>' +
    '<section class="station-activity" aria-label="Trabajo actual"><small>AHORA</small><div id="voice-work">Consultando actividad…</div><p id="voice-task" role="status"></p><button id="voice-view-tasks">Ver pendientes</button><button id="voice-retry-actions" hidden>Comprobar acción pendiente</button></section>' +
    '<section class="voice-state-card" aria-labelledby="voice-connection-label"><h2 id="voice-connection-label">Conversación</h2><strong id="voice-phase">Disponible</strong><p id="voice-status" role="status">Habla cuando quieras.</p>' +
    '<p id="voice-input" role="status"></p><audio id="voice-audio" autoplay aria-label="Voz del autón"></audio><button id="voice-play" hidden>Activar sonido</button>' +
    '<div class="voice-actions"><button id="voice-start" disabled>Hablar</button><button id="voice-interrupt" hidden>Escúchame</button><button id="voice-stop" hidden disabled>Finalizar</button></div>' +
    '<details class="voice-options"><summary>Audio y conexión</summary><button id="voice-mute" disabled>Silenciar micrófono</button><p class="voice-note">Voz generada por IA.</p>' +
    '<p id="voice-timing" class="voice-note"></p><p id="voice-context" role="status">El expediente se comprueba al conectar.</p><button id="voice-retry-context" hidden>Recuperar expediente</button></details></section>' +
    '<details class="station-chat"><summary>Conversación</summary><div id="station-messages" role="log" aria-live="off"></div><form id="station-message-form"><label for="station-message">Mensaje</label><textarea id="station-message" maxlength="6000" required placeholder="Qué resolvemos ahora…"></textarea><button id="station-send" disabled>Enviar</button></form><p id="station-message-status" role="status"></p><button id="station-write" hidden>Terminar voz y escribir</button><button id="station-refresh">Actualizar historial</button></details>' +
    '<p id="voice-save" role="status">Sin conversación nueva.</p><p id="voice-previous" class="voice-note" hidden></p>' +
    '<section class="voice-transcript-details"><h3 id="voice-transcript-label">Conversación de voz</h3><div id="voice-transcript" role="log" aria-label="Transcripción de voz" aria-live="off"></div><button id="voice-download" disabled>Descargar transcripción</button><p class="voice-note">Copia local; el estado de guardado aparece arriba.</p></section>';
  const layout=document.createElement('div'),sidebar=document.createElement('div'),workspaceHost=document.createElement('div');
  layout.className='voice-layout';sidebar.className='voice-sidebar';workspaceHost.className='voice-workspace';
  while(dialog.firstChild)sidebar.append(dialog.firstChild);layout.append(sidebar,workspaceHost);dialog.append(layout);
  const capsule=document.createElement('div');capsule.className='voice-capsule';
  capsule.innerHTML='<button id="compact-mic" aria-label="Hablar"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg></button><button id="compact-expand" aria-label="Abrir plan de potencial"><b id="compact-name">Tu autón</b><small id="compact-phase">Preparando voz…</small><span aria-hidden="true">↗</span></button><button id="compact-interrupt" hidden aria-label="Escúchame">Escúchame</button><button id="compact-stop" aria-label="Finalizar conversación">×</button><p id="compact-notice" role="status" hidden></p>';
  dialog.append(capsule);document.body.append(dialog);
  let compactVoice=false,puesto=null;
  const pilot=value=>isPuesto2(value,presentationLocation(window));
  function present(compactOnly){
    if(pilot(selection||window.YodResidentAgents?.getSelection?.()))compactOnly=false;
    const switching=dialog.open&&compactVoice!==compactOnly;
    if(switching)dialog.close();
    compactVoice=compactOnly;dialog.classList.toggle('voice-compact',compactVoice);
    if(!dialog.open){if(compactVoice)dialog.show();else dialog.showModal();}
    workspace.setActive(!compactVoice);visibility(!compactVoice);
  }
  function openBoard(tab='ppp'){
    if(!selection||accessPaused)return false;
    present(false);workspace.open(selection,tab);puesto?.showView(tab);void portrait.open(selection);
    renderVoiceState(voice.snapshot());return true;
  }
  // Conversation stays beside the original board. Secondary information is disclosed once.
  const activityCard=sidebar.querySelector('.station-activity'),voiceCard=sidebar.querySelector('.voice-state-card');
  sidebar.insertBefore(voiceCard,activityCard);
  const activityDetails=document.createElement('details');activityDetails.className='station-details';
  const activitySummary=document.createElement('summary');activitySummary.textContent='Actividad y registro';
  activityDetails.append(activitySummary,activityCard);
  const chatPanel=sidebar.querySelector('.station-chat'),chatForm=sidebar.querySelector('#station-message-form');
  chatPanel.insertBefore(sidebar.querySelector('.voice-transcript-details'),chatForm);
  chatPanel.open=false;
  chatPanel.append(activityDetails);
  voiceCard.append(sidebar.querySelector('#voice-save'),sidebar.querySelector('#voice-previous'));
  const node = id => dialog.querySelector('#' + id);
  const portraitHost=document.createElement('div');portraitHost.className='station-profile-portrait';sidebar.insertBefore(portraitHost,node('voice-title'));const portrait=mountAvatarCard({container:portraitHost,compact:true});
  const fragments = []; let selection = null, discussionDraftCase = null, generation = 0, dismissing = false, transcriptCase = null, freshTranscript = false, previousFocus = null, voiceCaseId = null, accessPaused = false;
  let interaction=null,voiceInteractionEpoch=window.crypto.randomUUID();
  const classicInteractions=document.createElement('section');classicInteractions.className='station-interactions';classicInteractions.setAttribute('aria-label','Acciones en esta pantalla');classicInteractions.hidden=true;chatPanel.append(classicInteractions);
  const agentName=()=>selection?stationIdentity(selection).name:'Autón';
  const visibility=value=>window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:value}));
  const setText = (id,text) => {if(node(id).textContent!==text)node(id).textContent=text;};
  const active = state => !['idle','error'].includes(state.phase);
  const actionExecutor=createVoiceActionExecutor({transport,onChange:event=>{
    node('voice-task').textContent=event.phase==='running'?'Consultando o guardando el pendiente…':event.phase==='confirmed'?'Solicitud confirmada. Puedes consultar su avance en Pendientes.':event.phase==='rejected'?(event.code==='goal_busy'?'No se creó el encargo: hay una entrega pendiente. Abre Pendientes para revisarla o detenerla.':'La solicitud no se ejecutó. Consulta los pendientes antes de continuar.'):'El guardado está pendiente de confirmación. Comprobar conserva la misma solicitud.';
    node('voice-retry-actions').hidden=event.phase!=='unconfirmed';
    if(event.phase==='confirmed')window.dispatchEvent(new CustomEvent('yod-goals-changed',{detail:null}));
  }});
  async function presentMeetingSlide(value){
    if(accessPaused||selection?.case_id!==value.case_id||window.YodResidentAgents?.getSelection?.()?.case_id!==value.case_id)return false;
    if(!active(voice.snapshot())){
      if(pilot(selection)){setText('station-message-status','Activa el micrófono para escuchar la presentación.');return false;}
      begin();
    }
    const deadline=Date.now()+25000;
    while(Date.now()<deadline){
      if(accessPaused||selection?.case_id!==value.case_id||!dialog.open||workspace.getTab()!=='meeting')return false;
      if(voice.presentSlide(value))return true;
      if(['idle','error','closing'].includes(voice.snapshot().phase))return false;
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    return false;
  }
  const workspace=createWorkspace({container:workspaceHost,transport,onDiscuss:value=>{if(accessPaused||selection?.case_id!==value.case_id)return;discussionDraftCase=value.case_id;chatPanel.open=true;const field=node('station-message');const draft='Sobre la entrega «'+value.title+'» (revisión '+value.revision+'): ';field.value=field.value?field.value+'\n'+draft:draft;field.focus();field.setSelectionRange(field.value.length,field.value.length);node('station-message-status').textContent='Borrador para discutir la entrega. Todavía no se envió ni se creó un encargo.';},getSelection:()=>window.YodResidentAgents?.getSelection?.(),onBoard:revision=>{void voice.notifyBoard(revision,selection?.case_id);},onPresent:presentMeetingSlide,onPresentation:()=>{puesto?.updateWorkspace();interaction?.observe();}});
  const interactionContext=()=>{const c=workspace.interactionContext();return c?{...c,authorized:c.authorized&&!accessPaused&&dialog.open&&selection?.case_id===window.YodResidentAgents?.getSelection?.()?.case_id,pilot:pilot(selection)}:null;};
  function renderInteractions(records){
    const handlers={confirm:id=>interaction.confirm(id),retry:id=>interaction.retry(id)};
    puesto?.renderInteractions(records,handlers);
    const current=()=>!accessPaused&&dialog.open&&selection?.case_id===window.YodResidentAgents?.getSelection?.()?.case_id&&interactionContext()?.authorized===true&&interactionContext()?.ppp_enabled===true;
    renderInteractionCards({host:classicInteractions,records:puesto?.isActive()?[]:records,caseId:selection?.case_id,handlers,isCurrent:current,doc:document});
    if(!classicInteractions.hidden){chatPanel.open=true;if(compactVoice)present(false);}
  }
  function openInteractionWorkspace(value){
    const before=interactionContext();if(!before?.authorized||before.case_id!==value.context.case_id||!['ppp','activity','sources','knowledge'].includes(value.tab))return{status:'unavailable'};
    if(!openBoard(value.tab))return{status:'unavailable'};
    workspace.root.querySelector('[data-panel="'+value.tab+'"]')?.scrollIntoView?.({block:'nearest',behavior:'instant'});
    const after=interactionContext();
    if(!after?.authorized||after.case_id!==value.context.case_id||!workspacePresentationVisible({dialog,workspace,tab:value.tab,win:window}))return{status:'unavailable'};
    return{status:'confirmed',observed:{...after,tab:value.tab}};
  }
  interaction=createAgentInteraction({getContext:interactionContext,
    openWorkspace:openInteractionWorkspace,navigateBridge:value=>workspace.navigateInteraction(value),navigateAssisted:value=>workspace.navigateAssisted(value),
    // Existing business writes keep their own proposal/receipt circuit. This
    // presentation controller cannot create a replacement write on a timeout.
    reconcile:async()=>({status:'unavailable'}),
    onChange:records=>{renderInteractions(records);const last=records.at(-1);if(last&&['awaiting_confirmation','confirmed','pending','uncertain'].includes(last.state))voice?.notifyInteraction?.(last);}
  });
  window.YodVoiceWorkspace={isOpen:()=>dialog.open&&!compactVoice,openForCase,prepareNearby:caseId=>{const s=window.YodResidentAgents?.getSelection?.();if(s?.case_id===caseId&&s.can_enqueue&&!active(voice.snapshot()))void voice.prepare(caseId,{connection:true});},releaseNearby:()=>{/* Entry preparation remains warm outside the approach radius. */},pauseEncounter:caseId=>{if(encounterCase===caseId&&voice.snapshot().phase==='listening'&&!voice.snapshot().muted){encounterPaused=true;voice.mute();}},show:tab=>{openBoard(tab);workspaceHost.scrollIntoView({block:'nearest'});}};
  window.dispatchEvent(new CustomEvent('yod-voice-workspace-ready'));
  let stopWatching=null,encounterCase=null,encounterPaused=false,micGrantedInPage=false,encounterNeedsMic=false;
  const micConsentNotice='Pulsa el micrófono para permitir la voz. Después podrás conversar al acercarte.';
  const goalReader=new DurableGoals({transport,getContext:()=>{
    const current=window.YodResidentAgents?.getSelection?.();
    return current&&selection?.case_id===current.case_id&&dialog.open?{selection:current,busy:false}:null;
  }});
  goalReader.subscribe(state=>{
    if(!state.model){node('voice-work').textContent=state.notice||'Consultando actividad…';return;}
    const route=goalRoadmap(state.model.goals);
    node('voice-work').textContent=route.goal?route.goal.title+' · '+goalDisplay(route.goal).label+' · '+route.next:'En espera · listo para el siguiente objetivo.';
  });
  const chat=new Conversation({transport,notify:renderChat});
  let chatTimer=null,lastChatVoicePhase='idle',stationSubmission=null;const typedTurns=[];
  function renderChat(state){
    if(!selection||state.selection&&state.selection.case_id!==selection.case_id)return;
    const host=node('station-messages'),messages=state.model?.messages||[];
    host.replaceChildren(...messages.slice(-30).map(m=>{const p=document.createElement('p'),b=document.createElement('b'),text=document.createElement('span');b.textContent=m.role==='user'?'Tú':agentName();text.textContent=m.body;p.append(b,text);return p;}));
    for(const turn of state.fastTurns||[]){for(const [label,text]of [['Tú',turn.message],[agentName(),turn.reply]])if(text){const p=document.createElement('p'),b=document.createElement('b'),body=document.createElement('span');b.textContent=label;body.textContent=text;p.append(b,body);host.append(p);}}
    for(const turn of typedTurns.filter(t=>t.caseId===selection.case_id)){const p=document.createElement('p'),b=document.createElement('b'),body=document.createElement('span');b.textContent='Tú · texto durante voz';body.textContent=turn.text;p.append(b,body);host.append(p);}
    const voiceState=voice.snapshot();
    const live=dialog.dataset.voicePhase&&!['idle','error'].includes(dialog.dataset.voicePhase);
    node('station-send').disabled=accessPaused||!selection?.can_enqueue||(voiceState.text_pending?voiceState.text_sending:live?voiceState.phase!=='listening'||voiceState.text_sending:!state.canSend);
    node('station-send').textContent=voiceState.text_pending?'Comprobar envío':state.pending?'Reintentar mismo mensaje':'Enviar';
    node('station-write').hidden=!live;node('station-write').disabled=dialog.dataset.voicePhase==='closing';
    const messageStatus=voiceState.text_notice||(live?'Puedes escribir mientras conversas. El mensaje llegará a esta misma voz.':state.fastNotice||(state.pending?'Guardado pendiente. Actualizar comprobará la misma solicitud.':state.busy?'Consultando…':state.status==='unavailable'?'No se pudo cargar el historial. Puedes actualizar.':state.status==='processing'&&state.canSend?'Puedes conversar mientras continúa el trabajo anterior.':''));
    const draftNotice=discussionDraftCase===selection.case_id&&node('station-message').value.trim()?'Borrador para discutir la entrega. Todavía no se envió ni se creó un encargo.':'';
    node('station-message-status').textContent=[messageStatus,draftNotice].filter(Boolean).join(' ');
  }
  dialog.querySelector('.station-chat').addEventListener('toggle',()=>{if(dialog.querySelector('.station-chat').open&&selection&&!chat.selection&&!chat.busy)void chat.open(AUTONES_MULTIPLES?selection.case_id:null);});
  node('station-message').addEventListener('input',()=>{if(discussionDraftCase)renderChat(chat);});
  function stationMessageContext(own,id){
    const resident=window.YodResidentAgents,current=resident?.getSelection?.();
    return own===generation&&!accessPaused&&dialog.open&&selection?.case_id===id&&selection?.can_enqueue===true&&(!resident||current?.case_id===id&&current?.can_enqueue===true);
  }
  async function sendStationMessage(event){
    event.preventDefault();if(node('station-send').disabled)return false;
    const text=node('station-message').value,own=generation,id=selection?.case_id;
    if(!stationMessageContext(own,id))return false;
    if(stationSubmission&&!stationMessageContext(stationSubmission.own,stationSubmission.id))stationSubmission=null;
    if(stationSubmission)return stationSubmission.text===text?stationSubmission.promise:false;
    discussionDraftCase=null;
    const submission={text,own,id,event_id:'text-'+window.crypto.randomUUID(),promise:null};stationSubmission=submission;
    submission.promise=(async()=>{
      const initialVoice=voice.snapshot(),inVoice=active(initialVoice)||initialVoice.text_pending;
      if(!chat.pending&&!initialVoice.text_pending){
        // Opening an explicitly requested view never starts voice or writes quantities.
        const command=parseDirectUserCommand({role:'user',source:'text',text});
        if(command)openBoard(command.tab);
        if(!(command?.kind==='change_request'&&nativeVolumeWrite(interactionContext()))){
          let local;
          try{local=await interaction.receive({role:'user',source:'text',complete:true,text,event_id:submission.event_id});}
          catch{return false;}
          if(!stationMessageContext(own,id))return false;
          if(local.handled){if(node('station-message').value===text)node('station-message').value='';return true;}
        }
      }
      if(!stationMessageContext(own,id))return false;
      const sentText=inVoice?text:chat.pending?.message||text;
      const sent=await(inVoice?voice.sendText(text):chat.send(text));
      if(sent&&stationMessageContext(own,id)){
        if(inVoice)typedTurns.push({caseId:id,text});
        if(node('station-message').value===sentText)node('station-message').value='';renderChat(chat);
      }
      return !!sent;
    })().finally(()=>{if(stationSubmission===submission)stationSubmission=null;});
    return submission.promise;
  }
  node('station-message-form').addEventListener('submit',sendStationMessage);
  node('station-refresh').addEventListener('click',()=>{void voice.refresh();void(chat.selection?chat.refresh():chat.open(AUTONES_MULTIPLES?selection?.case_id:null));});
  node('station-write').addEventListener('click',async()=>{
    if(!selection||accessPaused)return;const own=generation;suppressEncounter();node('station-write').disabled=true;
    const result=await voice.stop();if(own!==generation||!selection)return;
    if(result?.incomplete||result?.pending){node('station-message-status').textContent='El cierre de voz quedó sin confirmar. El borrador se conserva; revisa el estado de guardado.';return;}
    if(!chat.selection)await chat.open(AUTONES_MULTIPLES?selection.case_id:null);
    if(own===generation)node('station-message').focus();
  });
  chatTimer=setInterval(()=>{if(dialog.open&&!document.hidden&&dialog.querySelector('.station-chat').open&&chat.selection&&!chat.busy&&!active(voice.snapshot())&&!(node('station-message').value.trim()&&chat.canSend))void chat.refresh();},12000);
  window.addEventListener('pagehide',()=>{clearInterval(chatTimer);interaction?.dispose();chat.close();stopWatching?.();});
  function receiveStationTranscript(fragment){
      if(selection?.case_id===voiceCaseId){renderTranscript(fragment);
        if(interactionContext()?.ppp_enabled===true&&fragment.role==='user'){
          const group=groupTranscriptFragments(fragments).find(g=>g.role==='user'&&g.fragments.includes(fragment));
          if(group)void interaction.receive({role:'user',source:'voice',complete:false,text:group.text,event_id:'voice-'+voiceInteractionEpoch+'-'+group.start_ms});
        }
      }
  }
  const voice = createLiveVoice({canOperate:()=>!accessPaused&&!!selection,actions:actionExecutor,audio: node('voice-audio'), forgetCredential:id=>officeFastSessions.forget(id), mint: value => officeFastSessions.ensure(value.case_id,p=>transport.mintFastSession(p),{priority:true}),
    onChange: renderVoiceState,
    onTranscript: receiveStationTranscript});
  puesto=mountPuestoAgente({dialog,sidebar,workspaceHost,workspace,getSelection:()=>selection,doc:document,win:window});
  function renderVoiceState(state) {
      if(selection)state=voice.stateForCase(selection.case_id);
      window.dispatchEvent(new CustomEvent('yod-voice-state',{detail:{phase:state.phase}}));
      const view = voiceView(state), live = view.live;
      const wasLive=!['idle','error'].includes(lastChatVoicePhase);lastChatVoicePhase=state.phase;
      dialog.dataset.voicePhase=state.phase;
      if(wasLive&&['idle','error'].includes(state.phase)&&selection&&!accessPaused&&!chat.busy)void(chat.selection?chat.refresh():chat.open(AUTONES_MULTIPLES?selection.case_id:null));
      if(state.phase==='listening')micGrantedInPage=true;
      if(state.phase==='listening'&&freshTranscript){fragments.length=0;voiceInteractionEpoch=window.crypto.randomUUID();node('voice-transcript').replaceChildren();freshTranscript=false;node('voice-download').disabled=true;}
      setText('voice-transcript-label',freshTranscript&&fragments.length?'Transcripción anterior · se conserva mientras conectas':'Transcripción de esta conversación');
      setText('voice-phase',view.title);
      if(dialog.open&&!compactVoice&&selection?.goals?.ready&&!stopWatching)stopWatching=watchGoals(goalReader,{visible:()=>dialog.open&&!document.hidden&&!voice.snapshot().actions_pending});
      const connectionNotice=state.credential_pending?'La voz continúa. Recuperando la autorización antes de que venza.':state.session_ending?'Esta conversación se acerca al límite de duración. El puesto seguirá abierto para continuar.':state.notice;
      setText('voice-status',connectionNotice);
      setText('voice-input',state.phase!=='listening'?'':state.muted?'Micrófono en pausa.':state.local_speaking?'Te escucho.':state.input_received?'Tu voz está llegando a la conversación.':state.input_detected?'Tu micrófono detecta sonido. Aún no recibimos palabras.':'Micrófono abierto. Aún no recibimos palabras.');
      setText('voice-context',view.context);
      const stages=[['microphone_ms','micrófono'],['access_ms','acceso'],['offer_ms','WebRTC'],['signalling_ms','servidor'],['listening_ms','escucha'],['playback_ms','reproducción habilitada'],['context_ms','expediente']];
      const timings=stages.filter(([key])=>Number.isFinite(state.timings?.[key])).map(([key,label])=>label+' '+(state.timings[key]/1000).toFixed(1)+' s');
      setText('voice-timing',timings.length?'Desde que iniciaste: '+timings.join(' · ')+'. Tiempos acumulados; no se suman.':'');
      if(state.context_phase==='ready'&&dialog.open&&!compactVoice&&!accessPaused)workspace.setActive(true);
      node('voice-retry-context').hidden=!view.retryContext;
      node('voice-retry-context').disabled=state.context_retry_pending===true;
      node('voice-play').hidden=!view.audioBlocked;
      node('voice-start').hidden=live;
      node('voice-start').disabled=live||accessPaused||!selection?.can_enqueue||view.startDisabled;
      setText('voice-start',view.startDisabled?view.startLabel:state.phase==='error'?'Volver a intentar':'Hablar');
      const canInterrupt=['starting','listening','reconnecting'].includes(state.phase);
      node('voice-interrupt').hidden=!canInterrupt;
      node('compact-interrupt').hidden=!canInterrupt;
      setText('compact-interrupt',state.output_paused?'Escuchar':'Escúchame');
      node('compact-interrupt').setAttribute('aria-label',state.output_paused?'Volver a escuchar':'Escúchame');
      node('compact-interrupt').setAttribute('aria-pressed',String(!!state.output_paused));
      setText('voice-interrupt',state.output_paused?'Volver a escuchar':'Escúchame');
      node('voice-interrupt').setAttribute('aria-pressed',String(!!state.output_paused));
      renderChat(chat);
      node('voice-stop').hidden=!live;
      node('voice-stop').disabled=!live||state.phase==='closing';
      setText('voice-stop',state.phase==='closing'?'Guardando…':state.phase==='starting'?'Cancelar conexión':'Finalizar');
      node('voice-mute').hidden=!live;
      node('voice-mute').disabled=!view.listening;
      setText('voice-mute',state.muted?'Activar micrófono':'Silenciar micrófono');
      node('voice-mute').setAttribute('aria-pressed',String(state.muted));
      setText('voice-save',view.history);
      setText('compact-name',agentName());setText('compact-phase',encounterNeedsMic?'Pulsa para hablar':state.output_paused?'Sonido pausado':state.local_speaking?'Te escucho':view.title);
      node('compact-mic').disabled=accessPaused||state.phase==='closing'||state.phase==='starting'||state.phase==='reconnecting'||!selection?.can_enqueue||(!view.listening&&view.startDisabled);
      node('compact-mic').setAttribute('aria-label',view.listening?(state.muted?'Activar micrófono':'Silenciar micrófono'):'Hablar');
      node('compact-mic').setAttribute('aria-pressed',String(view.listening&&!state.muted));
      node('compact-stop').disabled=state.phase==='closing';
      node('compact-stop').setAttribute('aria-label',state.phase==='starting'?'Cancelar conexión':'Finalizar conversación');
      const warning=encounterNeedsMic||state.credential_pending||state.session_ending||state.phase==='error'||state.ended_remotely||state.interruption_error||state.playback_blocked||state.incomplete||state.pending||accessPaused;
      node('compact-notice').hidden=!warning;
      setText('compact-notice',accessPaused?node('station-access').textContent:encounterNeedsMic?micConsentNotice:state.playback_blocked?'Pulsa el micrófono para activar el sonido.':state.incomplete||state.pending?view.history:connectionNotice);
      puesto?.renderState({...state,accessPaused});
      interaction?.observe();
  }
  function renderTranscript(fragment) {
      if(!selection)return;
      const transcript=node('voice-transcript');
      const following=transcript.scrollHeight-transcript.scrollTop-transcript.clientHeight<64;
      fragments.push(fragment);node('voice-download').disabled=false;
      const articles = groupTranscriptFragments(fragments).map(group => {
        const article = document.createElement('article'), title = document.createElement('b'),
          time = document.createElement('small'), content = document.createElement('p');
        title.textContent = group.role === 'user' ? 'Tú' : agentName();
        time.textContent = ' · ' + (group.start_ms / 1000).toFixed(1) + '–' + (group.end_ms / 1000).toFixed(1) + ' s';
        content.textContent = group.text; article.append(title, time, content); return article;
      });
      node('voice-transcript').replaceChildren(...articles);
      if(following)node('voice-transcript').scrollTop = node('voice-transcript').scrollHeight;
  }
  async function openForCase(caseId,tab='ppp',{startVoice=false,encounter=false,compactOnly=encounter}={}) {
    const currentSelection=window.YodResidentAgents?.getSelection?.();
    if(pilot(currentSelection)){startVoice=false;compactOnly=false;encounter=false;}
    if(active(voice.snapshot())&&voiceCaseId!==currentSelection?.case_id)return false;
    if(caseId&&(!currentSelection||currentSelection.case_id!==caseId))return false;
    if(dialog.open&&selection){
      if(caseId&&selection?.case_id!==caseId)return false;
      if(!compactOnly)openBoard(tab);
      if(startVoice)void requestBegin(encounter);
      return true;
    }
    if(!dialog.open)previousFocus=document.activeElement;present(compactOnly);accessPaused=false;node('station-access').hidden=true;node('station-reconnect').hidden=true;dialog.querySelector('.voice-transcript-details').hidden=true;node('voice-previous').hidden=true;
    const current = ++generation; selection = null; node('voice-start').disabled = true;
    node('voice-status').textContent = 'Validando tu acceso a la voz…';
    try {
      const resident = window.YodResidentAgents;
      const fresh = resident?.getSelection?.() || validateSelection(await transport.resolveCurrent(caseId?{case_id:caseId}:{}));
      if (current !== generation || !dialog.open || caseId&&fresh.case_id!==caseId) return false;
      if(pilot(fresh)){startVoice=false;compactOnly=false;encounter=false;present(false);}
      selection = fresh;puesto?.setSelection(fresh);interaction?.observe();node('voice-audio').muted=false; node('voice-case').textContent = fresh.name;
      if(transcriptCase!==fresh.case_id){discussionDraftCase=null;fragments.length=0;node('voice-transcript').replaceChildren();node('voice-download').disabled=true;node('voice-previous').hidden=true;node('station-message').value='';node('station-messages').replaceChildren();chat.close();transcriptCase=fresh.case_id;}
      dialog.querySelector('.voice-transcript-details').hidden=false;
      if(!compactVoice){workspace.open(fresh,tab);if(pilot(fresh)&&tab!=='ppp')puesto?.showView(tab);void portrait.open(fresh);}else workspace.setActive(false);
      if(!fresh.goals?.ready)node('voice-work').textContent='El seguimiento de objetivos aún no está conectado para este proyecto.';
      if(dialog.querySelector('.station-chat').open&&!chat.selection)void chat.open(AUTONES_MULTIPLES?selection.case_id:null);
      setText('voice-title',agentName());
      renderVoiceState(voice.snapshot());
      node('voice-start').disabled = !fresh.can_enqueue||voice.stateForCase(fresh.case_id).creation_uncertain;
      if(!voice.stateForCase(fresh.case_id).creation_uncertain)node('voice-status').textContent = fresh.can_enqueue ?
        startVoice?'Preparando conversación de voz…':'Listo para hablar contigo.' : 'La conversación no está habilitada en este puesto. Puedes seguir consultando el tablero.';
      if (fresh.can_enqueue&&startVoice) void requestBegin(encounter);
      return true;
    } catch {
      if (current === generation) node('voice-status').textContent = 'No pudimos validar tu acceso. Vuelve a abrir el despacho.';
      return false;
    }
  }
  open.addEventListener('click',()=>void openForCase(window.YodResidentAgents?.getSelection?.()?.case_id,'ppp',{startVoice:true,compactOnly:true}));
  async function requestBegin(encounter){
    if(encounter&&pilot(selection)){encounterNeedsMic=true;renderVoiceState(voice.snapshot());return;}
    const own=generation,id=selection?.case_id;
    if(!encounter){encounterCase=null;begin();return;}
    encounterCase=id;
    if(voiceCaseId===id&&voice.snapshot().phase==='listening'){if(encounterPaused&&voice.snapshot().muted)voice.mute();encounterPaused=false;return;}
    if(window.YodOfficeLifecycle?.automaticVoiceAllowed()===false){encounterNeedsMic=true;renderVoiceState(voice.snapshot());setText('voice-status','Volviste al despacho. Pulsa Hablar para iniciar otra conversación.');return;}
    let granted=micGrantedInPage;
    try{granted=(await navigator.permissions.query({name:'microphone'})).state==='granted';}catch{}
    if(dismissing||own!==generation||!dialog.open||id!==selection?.case_id||id!==window.YodResidentAgents?.getSelection?.()?.case_id)return;
    if(!granted){encounterNeedsMic=true;renderVoiceState(voice.snapshot());setText('voice-status',micConsentNotice);return;}
    begin();
  }
  function suppressEncounter(){
    if(selection?.case_id)window.dispatchEvent(new CustomEvent('yod-agent-encounter-dismiss',{detail:{case_id:selection.case_id}}));
    encounterCase=null;encounterPaused=false;encounterNeedsMic=false;
  }
  function begin() {
    if(dismissing||accessPaused||!selection?.can_enqueue||active(voice.snapshot()))return;
    if(window.YodOfficeLifecycle?.allowVoiceFromGesture()===false)return;
    encounterNeedsMic=false;
    const previous=voice.snapshot();
    if(previous.pending||previous.incomplete||previous.status_pending){
      setText('voice-previous','Al cerrar la conversación anterior quedó un guardado sin confirmar. Revisa el historial antes de repetir sus encargos.');
      node('voice-previous').hidden=false;
    }
    // Voice is a modality of this station, never a navigation action.
    encounterPaused=false;freshTranscript=true;voiceCaseId=selection.case_id;
    void voice.start(selection.case_id,{encounter:encounterCase===selection.case_id});
  }
  node('compact-mic').addEventListener('click',()=>{
    if(voice.snapshot().playback_blocked){void voice.playAudio();return;}
    if(voice.snapshot().phase==='listening')voice.mute();else begin();
  });
  node('compact-expand').addEventListener('click',()=>openBoard('ppp'));
  node('compact-stop').addEventListener('click',()=>{void dismiss();});
  node('voice-start').addEventListener('click',begin);
  const listen=()=>voice.snapshot().output_paused?voice.resumeAudio():voice.interrupt();
  node('voice-interrupt').addEventListener('click',listen);
  node('compact-interrupt').addEventListener('click',listen);
  node('station-menu').addEventListener('click',()=>window.YodAgentMenu?.showRadial(selection?.case_id));
  node('voice-play').addEventListener('click',()=>{void voice.playAudio();});
  node('voice-download').addEventListener('click',()=>{
    if(!fragments.length)return;
    const content=groupTranscriptFragments(fragments).map(g=>
      (g.role==='user'?'Tú':agentName())+' ['+g.start_ms+'–'+g.end_ms+' ms]\n'+g.text).join('\n\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='conversacion-proyecto.txt';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  node('voice-view-tasks').addEventListener('click',()=>{workspace.setTab('tasks');puesto?.showView('tasks');});
  window.addEventListener('yod-goals-changed',()=>{if(stopWatching)void goalReader.read();});
  node('voice-retry-context').addEventListener('click',()=>{void voice.retryContext();});
  node('voice-retry-actions').addEventListener('click',()=>voice.retryActions());
  node('voice-mute').addEventListener('click', voice.mute);
  node('voice-stop').addEventListener('click', () => {suppressEncounter();void voice.stop();});
  async function dismiss() {
    if (dismissing) return; dismissing = true;suppressEncounter();
    const wasLive = active(voice.snapshot()), result = await voice.stop();
    if (wasLive && (result?.incomplete || result?.pending)) {dismissing = false; return;}
    generation++; selection = null;puesto?.setSelection(null);interaction?.observe();stopWatching?.();stopWatching=null;goalReader.hide();workspace.setActive(false);dialog.close();visibility(false);previousFocus?.focus?.(); dismissing = false;
  }
  dialog.querySelector('.voice-close').addEventListener('click', () => {if(active(voice.snapshot())&&!pilot(selection)){present(true);stopWatching?.();stopWatching=null;}else void dismiss();});
  dialog.addEventListener('cancel', event => {event.preventDefault();if(!compactVoice&&active(voice.snapshot())&&!pilot(selection))present(true);else void dismiss();});
  window.addEventListener('pagehide', () => {generation++;voice.abandon();puesto?.dispose();workspace.dispose();delete window.YodVoiceWorkspace;});
  // Visibility alone is not a hangup; mobile permission prompts and app switching can hide the page.
  document.addEventListener('visibilitychange', () => {if (!document.hidden) void voice.refresh();});
  window.addEventListener('yod-data-invalidated',()=>{
    if(!dialog.open||document.hidden||active(voice.snapshot()))return;
    if(chat.selection&&!chat.busy)void chat.refresh();
    if(selection?.goals?.ready&&!goalReader.busy)void goalReader.read();
  });
  node('station-reconnect').addEventListener('click',async()=>{
    node('station-reconnect').disabled=true;
    try{
      const resident=window.YodResidentAgents;await resident?.refresh?.();
      const fresh=resident?.getSelection?.();
      if(fresh)await openForCase(fresh.case_id,workspace.getTab());
      else setText('station-access','Todavía no se pudo validar el acceso. Puedes volver a intentar desde este puesto.');
    }finally{node('station-reconnect').disabled=false;}
  });
  let boundResident=null,unbind=null;
  const entrance=createEntryPreparation({prepare:(...args)=>voice.prepare(...args),discard:()=>voice.discardPreparation(),
    onResult:(id,ok)=>{const resident=window.YodResidentAgents;if(resident?.getSelection?.()?.case_id===id)resident.markPrepared?.(id,ok);}});
  function prepareEntry(){
    const s=window.YodResidentAgents?.getSelection?.();
    return entrance.update(s?.can_enqueue?s.case_id:null,{visible:!document.hidden,idle:!active(voice.snapshot())});
  }
  const preparationTimer=setInterval(()=>void prepareEntry(),15000);
  document.addEventListener('visibilitychange',()=>void prepareEntry());
  function bindResident() {
    const resident=window.YodResidentAgents;
    if(!resident||resident===boundResident)return;
    unbind?.();boundResident=resident;
    unbind=resident.subscribe(state=>{
      const s=resident.getSelection();
      const access=residentAccessDecision(state,selection);
      if(access==='recovering'){
        accessPaused=true;workspace.setActive(false);renderChat(chat);
        setText('station-access','Recuperando acceso al proyecto. El puesto permanece abierto; las operaciones nuevas están en pausa.');
        node('station-access').hidden=false;node('voice-start').disabled=true;renderVoiceState(voice.snapshot());
        return;
      }
      if(access==='current'&&accessPaused){
        accessPaused=false;selection=s;puesto?.setSelection(s);node('station-access').hidden=true;node('station-reconnect').hidden=true;
        workspace.setActive(dialog.open&&!compactVoice);renderVoiceState(voice.snapshot());
      }
      if(access==='lost'){
        entrance.clear();generation++;selection=null;puesto?.setSelection(null);interaction?.observe();encounterNeedsMic=false;stopWatching?.();stopWatching=null;goalReader.hide();chat.close();workspace.reset();portrait.clear();workspace.setActive(false);
        fragments.length=0;freshTranscript=false;node('voice-transcript').replaceChildren();node('voice-work').replaceChildren();node('voice-task').textContent='';
        node('voice-download').disabled=true;node('voice-start').disabled=true;node('voice-previous').hidden=true;node('voice-audio').muted=true;
        setText('voice-case','El acceso al expediente cambió.');setText('voice-title','Tu autón');discussionDraftCase=null;node('station-message').value='';node('station-messages').replaceChildren();
        accessPaused=true;
        setText('station-access',state.phase==='unauthorized'?'Tu acceso al proyecto dejó de ser válido. El contenido privado se retiró. Reconecta el puesto para continuar.':'No pudimos renovar el acceso al proyecto. La voz se detuvo y el contenido privado se retiró; puedes reconectar aquí.');
        node('station-access').hidden=false;node('station-reconnect').hidden=false;
        void voice.stop();
      }
      void prepareEntry();
    });
  }
  window.addEventListener('yod-residents-ready',bindResident);bindResident();
  window.addEventListener('pagehide',()=>{clearInterval(preparationTimer);entrance.clear();unbind?.();transport.dispose();});
}
