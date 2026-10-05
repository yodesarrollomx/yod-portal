import {createFrameTransport, validateSelection, validateConversation} from './conversation.mjs';
import {createLiveVoice} from './live-voice.mjs?v=1';
import {groupTranscriptFragments} from './live-transcript.mjs';

const open = document.getElementById('voice-open');
if (open) {
  const transport = createFrameTransport(window), dialog = document.createElement('dialog');
  dialog.className = 'realtime-dialog';
  // Private dynamic text always uses textContent.
  dialog.innerHTML = '<button class="voice-close" aria-label="Cerrar conversación de voz">×</button>' +
    '<p class="voice-eyebrow">Tu agente · OpenAI</p><h1>Hablar con Gastón</h1>' +
    '<p id="voice-case">Conectando expediente…</p><p id="voice-status" role="status">Preparando conversación.</p>' +
    '<audio id="voice-audio" autoplay controls></audio><div class="voice-actions">' +
    '<button id="voice-start" disabled>Iniciar conversación</button><button id="voice-mute" disabled>Silenciar micrófono</button>' +
    '<button id="voice-interrupt" disabled>Interrumpir</button><button id="voice-stop" disabled>Finalizar</button></div>' +
    '<p class="voice-note">Escuchas una voz generada por IA. La transcripción se envía al historial del expediente al finalizar.</p>' +
    '<p id="voice-save" role="status">Sin conversación nueva.</p><div id="voice-transcript" role="log" aria-label="Transcripción de voz"></div>' +
    '<p class="voice-note">Los tiempos agrupan fragmentos de voz. Puedes hablar mientras Gastón responde y revisar la conversación en Agentes.</p>';
  document.body.append(dialog);
  const node = id => dialog.querySelector('#' + id);
  const fragments = []; let selection = null, generation = 0, dismissing = false;
  const active = state => !['idle','error'].includes(state.phase);
  const voice = createLiveVoice({audio: node('voice-audio'), mint: value => transport.mintFastSession(value),
    onChange: state => {
      const live = active(state);
      node('voice-status').textContent = state.notice;
      node('voice-start').disabled = live || !selection?.can_enqueue || !selection?.agent_ready;
      node('voice-stop').disabled = !live || state.phase === 'closing';
      node('voice-mute').disabled = state.phase !== 'listening';
      node('voice-interrupt').disabled = state.phase !== 'listening';
      node('voice-mute').textContent = state.muted ? 'Activar micrófono' : 'Silenciar micrófono';
      node('voice-mute').setAttribute('aria-pressed', String(state.muted));
      node('voice-save').textContent = state.incomplete ? 'Finalización o respaldo incompleto. Revisa el historial en Agentes.' :
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
    node('voice-status').textContent = 'Recuperando el expediente autorizado…';
    try {
      const fresh = validateSelection(await transport.resolveCurrent({}));
      validateConversation(await transport.read({case_id: fresh.case_id}), fresh.case_id);
      if (current !== generation || !dialog.open) return;
      selection = fresh; node('voice-case').textContent = fresh.name;
      node('voice-start').disabled = !fresh.can_enqueue || !fresh.agent_ready;
      node('voice-status').textContent = fresh.can_enqueue && fresh.agent_ready ?
        'Pulsa Iniciar conversación para abrir el micrófono.' : 'El agente no está listo para conversar. Puedes revisar Agentes.';
    } catch {
      if (current === generation) node('voice-status').textContent = 'No pudimos conectar el expediente. Abre Agentes y vuelve a intentar.';
    }
  });
  node('voice-start').addEventListener('click', () => {
    if (!selection) return;
    fragments.length = 0; node('voice-transcript').replaceChildren(); void voice.start(selection.case_id);
  });
  node('voice-mute').addEventListener('click', voice.mute);
  node('voice-interrupt').addEventListener('click', voice.interrupt);
  node('voice-stop').addEventListener('click', () => {void voice.stop();});
  async function dismiss() {
    if (dismissing) return; dismissing = true;
    await voice.stop(); generation++; selection = null; dialog.close(); open.focus(); dismissing = false;
  }
  dialog.querySelector('.voice-close').addEventListener('click', () => {void dismiss();});
  dialog.addEventListener('cancel', event => {event.preventDefault(); void dismiss();});
  window.addEventListener('pagehide', () => {generation++; voice.abandon();});
  document.addEventListener('visibilitychange', () => {if (document.hidden && active(voice.snapshot())) void voice.stop('La conversación terminó al salir de esta pantalla.');});
}
