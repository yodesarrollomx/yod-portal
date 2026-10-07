import {createFrameTransport, validateSelection, Conversation} from './conversation.mjs?v=2';
import {stationIdentity} from './project-station.mjs';
import {createLiveVoice} from './live-voice.mjs?v=8';
import {voiceView} from './voice-view.mjs?v=2';
import {createWorkspace} from './agent-workspace.mjs?v=6';
import {DurableGoals,watchGoals} from './goals.mjs';
import {createVoiceActionExecutor,coalesceGoalReads} from './voice-actions.mjs?v=1';
import {groupTranscriptFragments} from './live-transcript.mjs';

const open = document.getElementById('voice-open');
if (open) {
  const transport = coalesceGoalReads(createFrameTransport(window)), dialog = document.createElement('dialog');
  dialog.className = 'realtime-dialog has-workspace'; dialog.setAttribute('aria-labelledby','voice-title');
  // Private dynamic text always uses textContent.
  dialog.innerHTML = '<div class="station-heading"><button class="voice-close" aria-label="Volver al despacho">← Despacho</button><button id="station-menu" aria-label="Opciones del personaje">◉</button></div>' +
    '<p class="voice-eyebrow">Puesto del proyecto</p><h1 id="voice-title">Tu autón</h1><p id="voice-case">Comprobando proyecto…</p>' +
    '<section class="station-activity" aria-label="Trabajo actual"><small>AHORA</small><div id="voice-work">Consultando actividad…</div><p id="voice-task" role="status"></p><button id="voice-view-tasks">Ver pendientes</button><button id="voice-retry-actions" hidden>Comprobar acción pendiente</button></section>' +
    '<section class="voice-state-card" aria-labelledby="voice-connection-label"><h2 id="voice-connection-label">Conversación</h2><strong id="voice-phase">Disponible</strong><p id="voice-status" role="status">Habla cuando quieras.</p>' +
    '<audio id="voice-audio" autoplay aria-label="Voz del autón"></audio><button id="voice-play" hidden>Activar sonido</button>' +
    '<div class="voice-actions"><button id="voice-start" disabled>Hablar</button><button id="voice-interrupt" hidden>Escúchame</button><button id="voice-stop" hidden disabled>Finalizar</button></div>' +
    '<details class="voice-options"><summary>Audio y conexión</summary><button id="voice-mute" disabled>Silenciar micrófono</button><p class="voice-note">Voz generada por IA.</p>' +
    '<p id="voice-context" role="status">El expediente se comprueba al conectar.</p><button id="voice-retry-context" hidden>Recuperar expediente</button></details></section>' +
    '<details class="station-chat"><summary>Escribir y consultar historial</summary><div id="station-messages" role="log" aria-live="off"></div><form id="station-message-form"><label for="station-message">Mensaje</label><textarea id="station-message" maxlength="12000" required placeholder="Qué resolvemos ahora…"></textarea><button id="station-send" disabled>Enviar</button></form><p id="station-message-status" role="status"></p><button id="station-refresh">Actualizar historial</button></details>' +
    '<p id="voice-save" role="status">Sin conversación nueva.</p><p id="voice-previous" class="voice-note" hidden></p>' +
    '<details class="voice-transcript-details"><summary id="voice-transcript-label">Transcripción de voz</summary><div id="voice-transcript" role="log" aria-label="Transcripción de voz" aria-live="off"></div><button id="voice-download" disabled>Descargar transcripción</button><p class="voice-note">Copia local; el estado de guardado aparece arriba.</p></details>';
  const layout=document.createElement('div'),sidebar=document.createElement('div'),workspaceHost=document.createElement('div');
  layout.className='voice-layout';sidebar.className='voice-sidebar';workspaceHost.className='voice-workspace';
  while(dialog.firstChild)sidebar.append(dialog.firstChild);layout.append(sidebar,workspaceHost);dialog.append(layout);
  document.body.append(dialog);
  const node = id => dialog.querySelector('#' + id);
  const fragments = []; let selection = null, generation = 0, dismissing = false, transcriptCase = null, freshTranscript = false, previousFocus = null, voiceCaseId = null;
  const agentName=()=>selection?stationIdentity(selection).name:'Autón';
  const visibility=value=>window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:value}));
  const setText = (id,text) => {if(node(id).textContent!==text)node(id).textContent=text;};
  const active = state => !['idle','error'].includes(state.phase);
  const actionExecutor=createVoiceActionExecutor({transport,onChange:event=>{
    node('voice-task').textContent=event.phase==='running'?'Consultando o guardando el pendiente…':event.phase==='confirmed'?'Solicitud confirmada. Puedes consultar su avance en Pendientes.':event.phase==='rejected'?'La solicitud no se ejecutó. Consulta los pendientes antes de continuar.':'El guardado está pendiente de confirmación. Comprobar conserva la misma solicitud.';
    node('voice-retry-actions').hidden=event.phase!=='unconfirmed';
    if(event.phase==='confirmed')window.dispatchEvent(new CustomEvent('yod-goals-changed',{detail:null}));
  }});
  const workspace=createWorkspace({container:workspaceHost,transport,getSelection:()=>window.YodResidentAgents?.getSelection?.(),onBoard:revision=>{void voice.notifyBoard(revision);}});
  window.YodVoiceWorkspace={isOpen:()=>dialog.open,openForCase,show:tab=>{workspace.setTab(tab);workspaceHost.scrollIntoView({block:'nearest'});}};
  let stopWatching=null;
  const goalReader=new DurableGoals({transport,getContext:()=>{
    const current=window.YodResidentAgents?.getSelection?.();
    return current&&selection?.case_id===current.case_id&&dialog.open?{selection:current,busy:false}:null;
  }});
  goalReader.subscribe(state=>{
    if(!state.model){node('voice-work').textContent=state.notice||'Consultando actividad…';return;}
    const labels={queued:'En cola',running:'Trabajando',ready_for_review:'Para tu revisión',awaiting_data:'Faltan datos',stopped:'Detenido',completed:'Revisado'};
    node('voice-work').replaceChildren(...state.model.goals.filter(g=>g.status!=='completed').slice(0,1).map(g=>{const p=document.createElement('p');p.textContent=g.title+' · '+labels[g.status];return p;}));
    if(!state.model.goals.some(g=>g.status!=='completed'))node('voice-work').textContent='En espera · listo para el siguiente objetivo.';
  });
  const chat=new Conversation({transport,notify:renderChat});
  let chatTimer=null;
  function renderChat(state){
    if(!selection||state.selection&&state.selection.case_id!==selection.case_id)return;
    const host=node('station-messages'),messages=state.model?.messages||[];
    host.replaceChildren(...messages.slice(-30).map(m=>{const p=document.createElement('p'),b=document.createElement('b'),text=document.createElement('span');b.textContent=m.role==='user'?'Tú':agentName();text.textContent=m.body;p.append(b,text);return p;}));
    for(const turn of state.fastTurns||[]){for(const [label,text]of [['Tú',turn.message],[agentName(),turn.reply]])if(text){const p=document.createElement('p'),b=document.createElement('b'),body=document.createElement('span');b.textContent=label;body.textContent=text;p.append(b,body);host.append(p);}}
    const live=dialog.dataset.voicePhase&&!['idle','error'].includes(dialog.dataset.voicePhase);
    node('station-send').disabled=live||state.busy||!!state.pending||!!state.accepted||!state.selection?.can_enqueue||state.stale;
    node('station-message-status').textContent=live?'Finaliza la voz para continuar por escrito.':state.fastNotice||(state.pending?'Guardado pendiente. Actualizar comprobará la misma solicitud.':state.busy?'Consultando…':state.status==='unavailable'?'No se pudo cargar el historial. Puedes actualizar.':'');
  }
  dialog.querySelector('.station-chat').addEventListener('toggle',()=>{if(dialog.querySelector('.station-chat').open&&selection&&!chat.selection&&!chat.busy)void chat.open();});
  node('station-message-form').addEventListener('submit',async event=>{event.preventDefault();if(node('station-send').disabled)return;const text=node('station-message').value;if(await chat.send(text))node('station-message').value='';});
  node('station-refresh').addEventListener('click',()=>void(chat.selection?chat.refresh():chat.open()));
  chatTimer=setInterval(()=>{if(dialog.open&&!document.hidden&&dialog.querySelector('.station-chat').open&&chat.selection&&!chat.busy&&!active(voice.snapshot()))void chat.refresh();},12000);
  window.addEventListener('pagehide',()=>{clearInterval(chatTimer);chat.close();stopWatching?.();});
  const voice = createLiveVoice({actions:actionExecutor,audio: node('voice-audio'), mint: value => transport.mintFastSession(value),
    onChange: renderVoiceState,
    onTranscript: fragment => {
      if(selection?.case_id===voiceCaseId)renderTranscript(fragment);
    }});
  function renderVoiceState(state) {
      window.dispatchEvent(new CustomEvent('yod-voice-state',{detail:{phase:state.phase}}));
      const view = voiceView(state), live = view.live;
      dialog.dataset.voicePhase=state.phase;
      if(state.phase==='listening'&&freshTranscript){fragments.length=0;node('voice-transcript').replaceChildren();freshTranscript=false;node('voice-download').disabled=true;}
      setText('voice-transcript-label',freshTranscript&&fragments.length?'Transcripción anterior · se conserva mientras conectas':'Transcripción de esta conversación');
      setText('voice-phase',view.title);
      if(dialog.open&&selection?.goals?.ready&&!stopWatching)stopWatching=watchGoals(goalReader,{visible:()=>dialog.open&&!document.hidden&&!voice.snapshot().actions_pending});
      setText('voice-status',state.notice);
      setText('voice-context',view.context);
      if(state.context_phase==='ready'&&dialog.open)workspace.setActive(true);
      node('voice-retry-context').hidden=!view.retryContext;
      node('voice-retry-context').disabled=state.context_retry_pending===true;
      node('voice-play').hidden=!view.audioBlocked;
      node('voice-start').hidden=live;
      node('voice-start').disabled=live||!selection?.can_enqueue;
      setText('voice-start',state.phase==='error'?'Volver a intentar':'Hablar');
      node('voice-interrupt').hidden=!view.listening;
      setText('voice-interrupt',state.output_paused?'Volver a escuchar':'Escúchame');
      node('voice-interrupt').setAttribute('aria-pressed',String(!!state.output_paused));
      renderChat(chat);
      node('voice-stop').hidden=!live;
      node('voice-stop').disabled=!live||state.phase==='closing';
      setText('voice-stop',state.phase==='closing'?'Guardando…':'Finalizar');
      node('voice-mute').hidden=!live;
      node('voice-mute').disabled=!view.listening;
      setText('voice-mute',state.muted?'Activar micrófono':'Silenciar micrófono');
      node('voice-mute').setAttribute('aria-pressed',String(state.muted));
      setText('voice-save',view.history);
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
  async function openForCase(caseId,tab='activity',{startVoice=false}={}) {
    const currentSelection=window.YodResidentAgents?.getSelection?.();
    if(active(voice.snapshot())&&voiceCaseId!==currentSelection?.case_id)return false;
    if(caseId&&(!currentSelection||currentSelection.case_id!==caseId))return false;
    if(dialog.open){
      if(caseId&&selection?.case_id!==caseId)return false;
      workspace.setTab(tab);
      if(startVoice)begin();
      return true;
    }
    previousFocus=document.activeElement;dialog.showModal();visibility(true);dialog.querySelector('.voice-transcript-details').hidden=true;node('voice-previous').hidden=true;
    const current = ++generation; selection = null; node('voice-start').disabled = true;
    node('voice-status').textContent = 'Validando tu acceso a la voz…';
    try {
      const resident = window.YodResidentAgents;
      const fresh = resident?.getSelection?.() || validateSelection(await transport.resolveCurrent({}));
      if (current !== generation || !dialog.open || caseId&&fresh.case_id!==caseId) return false;
      selection = fresh; node('voice-audio').muted=false; node('voice-case').textContent = fresh.name;
      if(transcriptCase!==fresh.case_id){fragments.length=0;node('voice-transcript').replaceChildren();node('voice-download').disabled=true;node('voice-previous').hidden=true;node('station-message').value='';node('station-messages').replaceChildren();chat.close();transcriptCase=fresh.case_id;}
      dialog.querySelector('.voice-transcript-details').hidden=false;
      workspace.open(fresh,tab);
      if(!fresh.goals?.ready)node('voice-work').textContent='El seguimiento de objetivos aún no está conectado para este proyecto.';
      if(dialog.querySelector('.station-chat').open&&!chat.selection)void chat.open();
      setText('voice-title',agentName());
      renderVoiceState(voice.snapshot());
      node('voice-start').disabled = !fresh.can_enqueue;
      node('voice-status').textContent = fresh.can_enqueue ?
        startVoice?'Preparando conversación de voz…':'Listo para hablar contigo.' : 'Tu acceso permite consultar; hablar requiere permiso de conversación.';
      if (fresh.can_enqueue&&startVoice) begin();
      return true;
    } catch {
      if (current === generation) node('voice-status').textContent = 'No pudimos validar tu acceso. Vuelve a abrir el despacho.';
      return false;
    }
  }
  open.addEventListener('click',()=>void openForCase(window.YodResidentAgents?.getSelection?.()?.case_id,workspace.getTab(),{startVoice:true}));
  function begin() {
    if(!selection?.can_enqueue||active(voice.snapshot()))return;
    const previous=voice.snapshot();
    if(previous.pending||previous.incomplete||previous.status_pending){
      setText('voice-previous','Al cerrar la conversación anterior quedó un guardado sin confirmar. Revisa el historial antes de repetir sus encargos.');
      node('voice-previous').hidden=false;
    }
    freshTranscript=true;voiceCaseId=selection.case_id;
    void voice.start(selection.case_id);
  }
  node('voice-start').addEventListener('click',begin);
  node('voice-interrupt').addEventListener('click',()=>voice.snapshot().output_paused?voice.resumeAudio():voice.interrupt());
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
  node('voice-view-tasks').addEventListener('click',()=>workspace.setTab('tasks'));
  window.addEventListener('yod-goals-changed',()=>{if(stopWatching)void goalReader.read();});
  node('voice-retry-context').addEventListener('click',()=>{void voice.retryContext();});
  node('voice-retry-actions').addEventListener('click',()=>voice.retryActions());
  node('voice-mute').addEventListener('click', voice.mute);
  node('voice-stop').addEventListener('click', () => {void voice.stop();});
  async function dismiss() {
    if (dismissing) return; dismissing = true;
    const wasLive = active(voice.snapshot()), result = await voice.stop();
    if (wasLive && (result?.incomplete || result?.pending)) {dismissing = false; return;}
    generation++; selection = null; stopWatching?.();stopWatching=null;goalReader.hide();workspace.setActive(false);dialog.close();visibility(false);previousFocus?.focus?.(); dismissing = false;
  }
  dialog.querySelector('.voice-close').addEventListener('click', () => {void dismiss();});
  dialog.addEventListener('cancel', event => {event.preventDefault(); void dismiss();});
  window.addEventListener('pagehide', () => {generation++; voice.abandon();workspace.dispose();delete window.YodVoiceWorkspace;});
  // Visibility alone is not a hangup; mobile permission prompts and app switching can hide the page.
  document.addEventListener('visibilitychange', () => {if (!document.hidden) void voice.refresh();});
  let boundResident=null,unbind=null,warming=null;
  function bindResident() {
    const resident=window.YodResidentAgents;
    if(!resident||resident===boundResident)return;
    unbind?.();boundResident=resident;
    unbind=resident.subscribe(state=>{
      const s=resident.getSelection();
      if(selection&&(!s||s.case_id!==selection.case_id)){
        generation++;selection=null;stopWatching?.();stopWatching=null;goalReader.hide();chat.close();workspace.reset();workspace.setActive(false);
        fragments.length=0;freshTranscript=false;node('voice-transcript').replaceChildren();node('voice-work').replaceChildren();node('voice-task').textContent='';
        node('voice-download').disabled=true;node('voice-start').disabled=true;node('voice-previous').hidden=true;node('voice-audio').muted=true;
        setText('voice-case','El acceso al expediente cambió.');
        void voice.stop().finally(()=>{if(!selection&&dialog.open){dialog.close();visibility(false);}});
      }
      if(!s?.can_enqueue||state.prepared||warming===s.case_id)return;
      warming=s.case_id;
      void voice.prepare(s.case_id).then(ok=>resident.markPrepared(s.case_id,ok)).finally(()=>{warming=null;});
    });
  }
  window.addEventListener('yod-residents-ready',bindResident);bindResident();
  window.addEventListener('pagehide',()=>{unbind?.();transport.dispose();});
}
