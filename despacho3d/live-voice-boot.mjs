import {createFrameTransport, validateSelection} from './conversation.mjs';
import {createLiveVoice} from './live-voice.mjs?v=5';
import {DurableGoals,watchGoals} from './goals.mjs';
import {createVoiceActionExecutor,coalesceGoalReads} from './voice-actions.mjs?v=1';
import {groupTranscriptFragments} from './live-transcript.mjs';

const open = document.getElementById('voice-open');
if (open) {
  const transport = coalesceGoalReads(createFrameTransport(window)), dialog = document.createElement('dialog');
  dialog.className = 'realtime-dialog'; dialog.setAttribute('aria-labelledby','voice-title');
  // Private dynamic text always uses textContent.
  dialog.innerHTML = '<button class="voice-close" aria-label="Cerrar conversación de voz">×</button>' +
    '<p class="voice-eyebrow">Tu agente · OpenAI</p><h1 id="voice-title">Hablar con Gastón</h1>' +
    '<p id="voice-case">Preparando voz…</p><p id="voice-status" role="status">Preparando conversación.</p>' +
    '<audio id="voice-audio" autoplay controls></audio><div class="voice-actions">' +
    '<button id="voice-start" disabled>Iniciar conversación</button><button id="voice-mute" disabled>Silenciar micrófono</button>' +
    '<button id="voice-stop" disabled>Finalizar</button></div>' +
    '<p id="voice-context" role="status">Preparando expediente y herramientas…</p><button id="voice-retry-context" hidden>Recuperar expediente</button><p id="voice-task" role="status"></p><div id="voice-work" role="status"></div><button id="voice-view-tasks">Ver pendientes y evidencia</button><button id="voice-retry-actions" hidden>Comprobar acción pendiente</button><p class="voice-note">Escuchas una voz generada por IA. Los resultados de las tareas quedan para tu revisión.</p>' +
    '<p id="voice-save" role="status">Sin conversación nueva.</p><div id="voice-transcript" role="log" aria-label="Transcripción de voz"></div>' +
    '<p class="voice-note">Puedes interrumpirlo hablando. La transcripción se respalda al finalizar; aquí verás si queda pendiente.</p>';
  document.body.append(dialog);
  const node = id => dialog.querySelector('#' + id);
  const fragments = []; let selection = null, generation = 0, dismissing = false;
  const active = state => !['idle','error'].includes(state.phase);
  const actionExecutor=createVoiceActionExecutor({transport,onChange:event=>{
    node('voice-task').textContent=event.phase==='running'?'Consultando o guardando el pendiente…':event.phase==='confirmed'?'Solicitud confirmada. Puedes consultar su avance en Pendientes.':event.phase==='rejected'?'La solicitud no se ejecutó. Consulta los pendientes antes de continuar.':'El guardado está pendiente de confirmación. Comprobar conserva la misma solicitud.';
    node('voice-retry-actions').hidden=event.phase!=='unconfirmed';
    if(event.phase==='confirmed')window.dispatchEvent(new CustomEvent('yod-goals-changed',{detail:null}));
  }});
  let stopWatching=null;
  const goalReader=new DurableGoals({transport,getContext:()=>{
    const current=window.YodResidentAgents?.getSelection?.();
    return current&&selection?.case_id===current.case_id&&active(voice.snapshot())?{selection:current,busy:false}:null;
  }});
  goalReader.subscribe(state=>{
    if(!state.model)return;
    const labels={queued:'En cola',running:'Trabajando',ready_for_review:'Para tu revisión',awaiting_data:'Faltan datos',stopped:'Detenido',completed:'Revisado'};
    node('voice-work').replaceChildren(...state.model.goals.filter(g=>g.status!=='completed').slice(0,8).map(g=>{const p=document.createElement('p');p.textContent=g.title+' · '+labels[g.status];return p;}));
  });
  const voice = createLiveVoice({actions:actionExecutor,audio: node('voice-audio'), mint: value => transport.mintFastSession(value),
    onChange: state => {
      window.dispatchEvent(new CustomEvent('yod-voice-state',{detail:{phase:state.phase}}));
      const live = active(state);
      if(live&&state.tasks_ready&&!stopWatching)stopWatching=watchGoals(goalReader,{visible:()=>dialog.open&&!document.hidden&&active(voice.snapshot())&&!voice.snapshot().actions_pending});
      else if(!live&&stopWatching){stopWatching();stopWatching=null;goalReader.hide();}
      node('voice-status').textContent = state.notice;
      node('voice-context').textContent=state.mode==='basic'?'Conversación básica. Las herramientas del expediente están desactivadas.':
        state.context_phase==='unavailable'?'El expediente no se confirmó. Puedes seguir hablando y recuperar su acceso aquí.':
        state.context_phase==='ready'?'Expediente recibido y listo para revisar · '+(state.documents_ready?'Biblioteca y Jev disponibles':'Lector documental no disponible')+' · '+(state.tasks_ready?'Pendientes conectados':'Pendientes no disponibles'):
        state.context_phase==='retrying'?'La carga del expediente falló. Reintentando automáticamente; la voz sigue activa…':
        state.context_phase==='installing'?'Expediente recibido. Confirmando que Gastón pueda consultarlo…':
        'Puedes hablar. Cargando expediente y herramientas en segundo plano…'+(state.context_attempts>1?' Intento '+state.context_attempts+'.':'');
      node('voice-retry-context').hidden=state.context_phase!=='unavailable'||state.phase!=='listening';
      node('voice-start').disabled = live || !selection?.can_enqueue;
      node('voice-stop').disabled = !live || state.phase === 'closing';
      node('voice-mute').disabled = state.phase !== 'listening';
      node('voice-mute').textContent = state.muted ? 'Activar micrófono' : 'Silenciar micrófono';
      node('voice-mute').setAttribute('aria-pressed', String(state.muted));
      node('voice-save').textContent = state.status_pending && !state.incomplete ? 'Consultando el estado del respaldo. La voz puede continuar.' : state.incomplete ? 'Finalización o respaldo incompleto. Revisa el historial en Agentes.' :
        state.blocks ? state.saved + ' de ' + state.blocks + ' bloques de transcripción guardados en el historial.' +
          (state.pending ? ' Envío pendiente de ' + state.pending + '.' : '') :
          state.fragments ? state.fragments + ' fragmentos recibidos; historial pendiente de finalizar.' : 'Sin fragmentos recibidos todavía.';
    },
    onTranscript: fragment => {
      fragments.push(fragment);
      const articles = groupTranscriptFragments(fragments).map(group => {
        const article = document.createElement('article'), title = document.createElement('b'),
          time = document.createElement('small'), content = document.createElement('p');
        title.textContent = group.role === 'user' ? 'Tú' : 'Gastón';
        time.textContent = ' · ' + (group.start_ms / 1000).toFixed(1) + '–' + (group.end_ms / 1000).toFixed(1) + ' s';
        content.textContent = group.text; article.append(title, time, content); return article;
      });
      node('voice-transcript').replaceChildren(...articles);
      node('voice-transcript').scrollTop = node('voice-transcript').scrollHeight;
    }});
  open.addEventListener('click', async () => {
    if (dialog.open) return;
    dialog.showModal();
    const current = ++generation; selection = null; node('voice-start').disabled = true;
    node('voice-status').textContent = 'Validando tu acceso a la voz…';
    try {
      const resident = window.YodResidentAgents;
      const fresh = resident?.getSelection?.() || validateSelection(await transport.resolveCurrent({}));
      if (current !== generation || !dialog.open) return;
      selection = fresh; node('voice-case').textContent = fresh.name;
      node('voice-start').disabled = !fresh.can_enqueue;
      node('voice-status').textContent = fresh.can_enqueue ?
        'Preparando conversación de voz…' : 'Tu acceso permite consultar; hablar requiere permiso de conversación.';
      if (fresh.can_enqueue) {fragments.length=0;node('voice-transcript').replaceChildren();void voice.start(fresh.case_id);}
    } catch {
      if (current === generation) node('voice-status').textContent = 'No pudimos validar tu acceso. Vuelve a abrir el despacho.';
    }
  });
  node('voice-start').addEventListener('click', () => {
    if (!selection) return;
    fragments.length = 0; node('voice-transcript').replaceChildren(); void voice.start(selection.case_id);
  });
  node('voice-view-tasks').addEventListener('click',()=>{if(selection)void window.YodAgentMenu?.openForCase(selection.case_id,'pendientes');});
  window.addEventListener('yod-goals-changed',()=>{if(stopWatching)void goalReader.read();});
  node('voice-retry-context').addEventListener('click',()=>{void voice.retryContext();});
  node('voice-retry-actions').addEventListener('click',()=>voice.retryActions());
  node('voice-mute').addEventListener('click', voice.mute);
  node('voice-stop').addEventListener('click', () => {void voice.stop();});
  async function dismiss() {
    if (dismissing) return; dismissing = true;
    const wasLive = active(voice.snapshot()), result = await voice.stop();
    if (wasLive && (result?.incomplete || result?.pending)) {dismissing = false; return;}
    generation++; selection = null; dialog.close(); open.focus(); dismissing = false;
  }
  dialog.querySelector('.voice-close').addEventListener('click', () => {void dismiss();});
  dialog.addEventListener('cancel', event => {event.preventDefault(); void dismiss();});
  window.addEventListener('pagehide', () => {generation++; voice.abandon();});
  // Visibility alone is not a hangup; mobile permission prompts and app switching can hide the page.
  document.addEventListener('visibilitychange', () => {if (!document.hidden) void voice.refresh();});
  let boundResident=null,unbind=null,warming=null;
  function bindResident() {
    const resident=window.YodResidentAgents;
    if(!resident||resident===boundResident)return;
    unbind?.();boundResident=resident;
    unbind=resident.subscribe(state=>{
      const s=resident.getSelection();
      if(!s?.can_enqueue||state.prepared||warming===s.case_id)return;
      warming=s.case_id;
      void voice.prepare(s.case_id).then(ok=>resident.markPrepared(s.case_id,ok)).finally(()=>{warming=null;});
    });
  }
  window.addEventListener('yod-residents-ready',bindResident);bindResident();
  window.addEventListener('pagehide',()=>{unbind?.();transport.dispose();});
}
