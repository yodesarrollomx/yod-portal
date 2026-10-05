import {validateFastSession} from './fast-lane.mjs';
import {transcriptFragment} from './live-transcript.mjs';

const NOTICES = {
  unauthorized: 'La sesión cambió. Vuelve a abrir el despacho.',
  busy: 'Gastón tiene una conversación en curso. Espera un momento.',
  rate_limited: 'Espera unos minutos antes de iniciar otra conversación.',
  auth_unavailable: 'OpenAI no aceptó la conexión de voz.',
  provider_busy: 'OpenAI está ocupado. Vuelve a intentar en un momento.',
  observer_unavailable: 'No pudimos conectar el registro de conversación. Vuelve a intentar.',
  voice_unavailable: 'La voz no está disponible en el servidor. Puedes usar Agentes para escribir.',
  context_unavailable: 'No pudimos recuperar el expediente de Gastón.',
};
export function createLiveVoice({mint, fetchImpl = (...args) => fetch(...args),
  media = globalThis.navigator?.mediaDevices, Peer = globalThis.RTCPeerConnection,
  audio, onChange = () => {}, onTranscript = () => {}, now = Date.now,
  schedule = setInterval, cancel = clearInterval, closeTimeout = 20000} = {}) {
  let epoch = 0, stream = null, peer = null, channel = null, credential = null, sessionId = null,
    poll = null, controller = null, polling = false, closing = null, began = 0, started = false,
    contextReady = false, finalSeen = false, disconnected = false, closedResolve = null, sequence = 0;
  let state = {phase: 'idle', notice: '', muted: false, fragments: 0, blocks: 0, saved: 0, pending: 0,
    incomplete: false, finalized: false};
  const seen = new Set();
  const publish = patch => {state = {...state, ...patch}; onChange({...state});};
  async function post(path, data, current = credential, signal) {
    const response = await fetchImpl(current.endpoint + path, {method: 'POST', cache: 'no-store', credentials: 'omit', signal,
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + current.token}, body: JSON.stringify(data)});
    const value = await response.json();
    if (!response.ok || value?.ok !== true) throw Error(NOTICES[value?.error] || 'La conexión de voz se interrumpió.');
    return value;
  }
  function release() {
    if (poll !== null) cancel(poll); poll = null;
    if (channel) {channel.onmessage = channel.onopen = channel.onclose = null; channel.close?.();} channel = null;
    if (peer) {peer.ontrack = peer.onconnectionstatechange = null; peer.close();} peer = null;
    stream?.getTracks().forEach(track => track.stop()); stream = null;
    if (audio) {audio.pause?.(); audio.srcObject = null;}
  }
  const report = result => publish({fragments: result.fragments, blocks: result.blocks, saved: result.saved,
    pending: result.pending, incomplete: state.incomplete || result.incomplete === true});
  const ready = () => {
    if (!started || !contextReady || state.phase !== 'starting') return;
    stream?.getAudioTracks().forEach(track => {track.enabled = true;});
    publish({phase: 'listening', notice: 'Habla con Gastón. Puedes interrumpirlo al hablar.'});
  };
  function stop(notice = 'Conversación finalizada.') {
    if (closing) return closing;
    if (!stream && !sessionId && state.phase !== 'starting') return Promise.resolve(state);
    publish({phase: 'closing', notice: 'Finalizando conversación y comprobando el historial…'});
    stream?.getAudioTracks().forEach(track => {track.enabled = false;}); // Silence; retain tracks and playback until final event.
    controller?.abort(); controller = null;
    const current = credential, id = sessionId;
    closing = Promise.resolve().then(async () => {
      let timer, confirmed = false, result = null;
      try {
        if (id && current) {
          const finalized = finalSeen ? Promise.resolve(true) : disconnected ? Promise.resolve(false) :
            new Promise(resolve => {closedResolve = resolve; timer = setTimeout(() => resolve(false), closeTimeout);});
          // The server owns session.close. The primary channel keeps receiving final transcripts and audio.
          const saved = post('/voice/close', {session_id: id}, current, AbortSignal.timeout(closeTimeout))
            .catch(() => null);
          [confirmed, result] = await Promise.all([finalized, saved]);
          if (result) report(result);
          confirmed = confirmed && result?.finalized === true;
          publish({finalized: confirmed, incomplete: state.incomplete || !confirmed});
          notice = !confirmed ? 'Finalización incompleta: no se confirmó el cierre. Revisa el historial en Agentes.' :
            state.incomplete ? 'Conversación finalizada. Hay fragmentos del historial por revisar.' :
            result.pending ? 'Conversación finalizada. El envío al historial sigue pendiente.' : notice;
        }
      } finally {
        clearTimeout(timer); closedResolve = null; epoch++; release(); credential = null; sessionId = null;
        closing = null; publish({phase: 'idle', muted: false, notice});
      }
      return {...state};
    });
    return closing;
  }
  async function status(token) {
    if (token !== epoch || !sessionId || polling || closing) return;
    polling = true;
    try {
      const result = await post('/voice/status', {session_id: sessionId}, credential, AbortSignal.timeout(12000));
      if (token !== epoch || closing) return;
      report(result); contextReady = result.started === true && result.context_ready === true; ready();
      if (!result.active || now() >= result.expires_at) void stop('La sesión terminó. Puedes iniciar otra.');
      else if (state.phase === 'starting' && now() - began > 30000) void stop('No se confirmó el inicio. Vuelve a intentar.');
    } catch {if (token === epoch && !closing) void stop('La conexión se interrumpió. Puedes volver a hablar.');}
    finally {polling = false;}
  }
  async function gather(current) {
    if (current.iceGatheringState === 'complete' || !current.addEventListener) return;
    await new Promise(resolve => {
      const done = () => {clearTimeout(timer); current.removeEventListener('icegatheringstatechange', changed); resolve();};
      const changed = () => {if (current.iceGatheringState === 'complete') done();};
      const timer = setTimeout(done, 8000);
      current.addEventListener('icegatheringstatechange', changed);
    });
  }
  async function start(caseId) {
    if (closing || !['idle','error'].includes(state.phase)) return false;
    const token = ++epoch; controller = new AbortController(); began = now();
    started = contextReady = finalSeen = disconnected = false; seen.clear(); sequence = 0;
    publish({phase: 'starting', notice: 'Abriendo micrófono y expediente…', fragments: 0, blocks: 0, saved: 0,
      pending: 0, incomplete: false, finalized: false});
    try {
      if (typeof media?.getUserMedia !== 'function' || typeof Peer !== 'function' || !audio)
        throw Error('Este navegador no admite voz en tiempo real.');
      const captured = await media.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}, video: false});
      if (token !== epoch || closing) {captured.getTracks().forEach(track => track.stop()); return false;}
      stream = captured;
      const raw = await mint({case_id: caseId});
      if (token !== epoch || closing) return false;
      credential = validateFastSession(raw, caseId, now()); peer = new Peer();
      peer.ontrack = event => {
        if (token !== epoch) return;
        audio.srcObject = event.streams[0];
        Promise.resolve(audio.play?.()).catch(() => publish({notice: 'Pulsa reproducir en el audio para escuchar a Gastón.'}));
      };
      for (const track of stream.getAudioTracks()) {track.enabled = false; peer.addTrack(track, stream);}
      channel = peer.createDataChannel('oai-events');
      channel.onmessage = event => {
        if (token !== epoch) return;
        let value; try {value = JSON.parse(event.data);} catch {return;}
        if (value.type === 'session.started') {started = true; ready(); void status(token);}
        const fragment = transcriptFragment(value, sequence++);
        if (fragment && (!fragment.event_id || !seen.has(fragment.event_id))) {
          if (fragment.event_id) seen.add(fragment.event_id);
          onTranscript(fragment);
        }
        if (value.type === 'session.closed') {
          finalSeen = true; closedResolve?.(true);
          if (!closing) void stop('Conversación finalizada.');
        }
        if (value.type === 'error' && !closing) void stop('La voz se interrumpió. Comprueba el historial antes de continuar.');
      };
      const lost = () => {if (token !== epoch || finalSeen) return;
        disconnected = true; closedResolve?.(false); publish({incomplete: true});
        void stop('Finalización incompleta: la conexión se interrumpió.');};
      channel.onclose = lost; channel.onopen = () => {if (token === epoch) void status(token);};
      peer.onconnectionstatechange = () => {
        if (['failed','disconnected','closed'].includes(peer?.connectionState)) lost();
      };
      await peer.setLocalDescription(await peer.createOffer()); await gather(peer);
      if (token !== epoch || closing) return false;
      const current = credential;
      const result = await post('/voice/session', {sdp: peer.localDescription.sdp}, current, controller.signal);
      const id = result.session?.id, sdp = result.transport?.sdp;
      if (typeof id !== 'string' || !id || typeof sdp !== 'string' || !sdp.startsWith('v=0'))
        throw Error('La conexión de voz no es válida.');
      if (token !== epoch || closing) {
        await post('/voice/close', {session_id: id}, current, AbortSignal.timeout(closeTimeout)).catch(() => {});
        return false;
      }
      sessionId = id; // Opaque; never parse or rebuild.
      await peer.setRemoteDescription({type: 'answer', sdp});
      poll = schedule(() => {void status(token);}, 2000); void status(token);
      return true;
    } catch (error) {
      if (token === epoch && !closing) {
        if (sessionId) await stop();
        else {epoch++; release(); credential = null; publish({phase: 'error', notice: error?.name === 'NotAllowedError'
          ? 'Permite el micrófono en el navegador para hablar con Gastón.' : error?.message || 'No pudimos iniciar la voz.'});}
      }
      return false;
    }
  }
  function mute() {
    if (!stream || state.phase !== 'listening') return;
    const muted = !state.muted; stream.getAudioTracks().forEach(track => {track.enabled = !muted;});
    publish({muted, notice: muted ? 'Micrófono silenciado.' : 'Micrófono activo.'});
  }
  function interrupt() {
    if (channel?.readyState !== 'open' || state.phase !== 'listening') return;
    channel.send(JSON.stringify({type: 'session.instructions.append', event_id: 'interrupt-' + now(),
      delegation_id: null, content: 'Deja de hablar ahora y escucha al usuario.'}));
    publish({notice: 'Puedes continuar hablando.'});
  }
  function abandon() {
    // Navigation cannot guarantee a final event. Never report it as a confirmed close.
    disconnected = true; closedResolve?.(false); publish({incomplete: true});
    void stop('Finalización incompleta al salir de esta pantalla.');
  }
  return {start, stop, mute, interrupt, abandon, snapshot: () => ({...state})};
}
