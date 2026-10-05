import {validateFastSession} from './fast-lane.mjs';
import {transcriptFragment} from './live-transcript.mjs';

const NOTICES = {
  unauthorized: 'La sesión cambió. Vuelve a abrir el despacho.',
  busy: 'Gastón tiene una conversación en curso. Espera un momento.',
  rate_limited: 'Vuelve a intentar en un momento.',
  auth_unavailable: 'OpenAI no aceptó la conexión de voz.',
  provider_busy: 'OpenAI está ocupado. Vuelve a intentar en un momento.',
  observer_unavailable: 'No pudimos conectar el registro de conversación. Vuelve a intentar.',
  voice_unavailable: 'La voz no está disponible en el servidor. Puedes usar Agentes para escribir.',
  context_unavailable: 'No pudimos recuperar el expediente de Gastón.',
};
export function createLiveVoice({mint, fetchImpl = (...args) => fetch(...args),
  media = globalThis.navigator?.mediaDevices, Peer = globalThis.RTCPeerConnection, Stream = globalThis.MediaStream,
  audio, onChange = () => {}, actions = null, onTranscript = () => {}, now = Date.now,
  schedule = setInterval, cancel = clearInterval, closeTimeout = 20000, disconnectGrace = 12000, maxStatusFailures = 3} = {}) {
  let epoch = 0, stream = null, peer = null, channel = null, credential = null, sessionId = null,
    poll = null, controller = null, polling = false, closing = null, began = 0, started = false,
    contextReady = false, finalSeen = false, disconnected = false, closedResolve = null, sequence = 0,
    disconnectTimer = null, statusFailures = 0, connectedAt = 0, prepared = null, preparing = null, mode = null;
  let state = {phase: 'idle', notice: '', muted: false, fragments: 0, blocks: 0, saved: 0, pending: 0,
    incomplete: false, finalized: false, status_pending: false, mode: null};
  const seen = new Set();
  const publish = patch => {state = {...state, ...patch}; onChange({...state});};
  async function post(path, data, current = credential, signal) {
    const response = await fetchImpl(current.endpoint + path, {method: 'POST', cache: 'no-store', credentials: 'omit', signal,
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + current.token}, body: JSON.stringify(data)});
    let value;
    try{value=await response.json();}catch{const error=Error(response.status===401||response.status===403?NOTICES.unauthorized:NOTICES.voice_unavailable);error.code=response.status===401||response.status===403?'unauthorized':'unavailable';throw error;}
    if (!response.ok || value?.ok !== true) {
      const error = Error(NOTICES[value?.error] || 'La conexión de voz se interrumpió.');
      error.code = value?.error; throw error;
    }
    return value;
  }
  function release() {
    if (poll !== null) cancel(poll); poll = null;
    clearTimeout(disconnectTimer); disconnectTimer = null;
    if (channel) {channel.onmessage = channel.onopen = channel.onclose = null; channel.close?.();} channel = null;
    if (peer) {peer.ontrack = peer.onconnectionstatechange = null; peer.close();} peer = null;
    stream?.getTracks().forEach(track => track.stop()); stream = null;
    if (audio) {audio.pause?.(); audio.srcObject = null;}
  }
  async function ensureCredential(caseId) {
    if (prepared?.case_id === caseId && prepared.expires_at - now() > 60000) return prepared;
    if (preparing?.caseId === caseId) return preparing.promise;
    const promise = Promise.resolve().then(() => mint({case_id: caseId}))
      .then(raw => validateFastSession(raw, caseId, now()));
    preparing = {caseId, promise};
    try {const value = await promise; prepared = value; return value;}
    finally {if (preparing?.promise === promise) preparing = null;}
  }
  async function prepare(caseId) {
    try {
      const value = await ensureCredential(caseId);
      const response = await fetchImpl(value.endpoint + '/fast/hello', {headers: {Authorization: 'Bearer ' + value.token},
        cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000)});
      if (response.status === 401) {prepared = null; return false;}
      return response.ok;
    } catch {return false;}
  }
  const report = result => publish({fragments: result.fragments, blocks: result.blocks, saved: result.saved,
    pending: result.pending, incomplete: state.incomplete || result.incomplete === true});
  const ready = () => {
    if (!started || state.phase !== 'starting') return;
    stream?.getAudioTracks().forEach(track => {track.enabled = true;});
    publish({phase: 'listening', notice: 'Habla con Gastón. Puedes interrumpirlo al hablar.'});
  };
  function stop(notice = 'Conversación finalizada.') {
    if (closing) return closing;
    if (!stream && !sessionId && state.phase !== 'starting') return Promise.resolve(state);
    publish({phase: 'closing', notice: 'Finalizando conversación y comprobando el historial…'});
    stream?.getAudioTracks().forEach(track => {track.enabled = false;}); // Silence; retain tracks and playback until final event.
    clearTimeout(disconnectTimer); disconnectTimer = null;
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
          // A primary session.closed confirms finalization even if history status could not be read.
          publish({finalized: confirmed, incomplete: state.incomplete || !confirmed || !result});
          notice = !confirmed ? 'Finalización incompleta: no se confirmó el cierre. Revisa el historial en Agentes.' :
            !result ? 'Conversación finalizada. No se confirmó el respaldo; revisa Agentes.' :
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
      statusFailures = 0; publish({status_pending: false});
      report(result); contextReady = result.context_ready === true; ready();
      publish({context_phase:result.context_phase||'preparing',context_attempts:result.context_attempts||0,context_error:result.context_error||null,tools_ready:result.tools_ready===true,documents_ready:result.documents_ready===true,tasks_ready:result.tasks_ready===true,actions_pending:result.actions?.length||0});
      if(result.tools_ready&&actions&&credential){const auth=credential,id=sessionId,own=epoch;
        actions.consume(result.actions,{caseId:auth.case_id,active:()=>epoch===own&&!closing&&started&&['listening','reconnecting','starting'].includes(state.phase),post:(path,data)=>post(path,{session_id:id,...data},auth,AbortSignal.timeout(15000))});
      }
      if (!result.active || now() >= result.expires_at) void stop('La sesión terminó. Puedes iniciar otra.');
      else if (state.phase === 'starting' && connectedAt && now() - connectedAt > 60000) void stop('No se confirmó el inicio. Vuelve a intentar.');
    } catch (error) {
      if (token === epoch && !closing) {
        if (error?.code === 'unauthorized') {prepared = null; void stop('La sesión venció. Vuelve a abrir el despacho.');}
        else if (error?.code === 'session_unavailable') void stop('La sesión de voz terminó. Puedes volver a intentar.');
        else {statusFailures++;publish({status_pending: true, notice: statusFailures >= maxStatusFailures ?
          'La voz sigue conectada. El estado del respaldo está pendiente.' : 'La voz continúa. Recuperando conexión con el registro…'});}
      }
    }
    finally {if (token === epoch) polling = false;}
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
    mode = null; started = contextReady = finalSeen = disconnected = false; seen.clear(); sequence = 0; polling = false; statusFailures = 0; connectedAt = 0;
    publish({phase: 'starting', notice: 'Abriendo el micrófono…', fragments: 0, blocks: 0, saved: 0,
      pending: 0, incomplete: false, finalized: false, status_pending: false, mode: null,context_phase:'preparing',context_attempts:0,context_error:null,tools_ready:false,documents_ready:false,tasks_ready:false,actions_pending:0});
    try {
      if (typeof media?.getUserMedia !== 'function' || typeof Peer !== 'function' || !audio)
        throw Error('Este navegador no admite voz en tiempo real.');
      // Prepare authentication in parallel with the browser's microphone permission.
      const auth = ensureCredential(caseId).then(value => ({value}), error => ({error}));
      const captured = await media.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}, video: false});
      if (token !== epoch || closing) {captured.getTracks().forEach(track => track.stop()); return false;}
      stream = captured;
      const minted = await auth;
      if (token !== epoch || closing) return false;
      if (minted.error) throw minted.error;
      credential = minted.value; peer = new Peer();
      audio.autoplay = true; audio.playsInline = true; audio.setAttribute?.('playsinline','');
      publish({notice: 'Conectando voz…'});
      peer.ontrack = event => {
        if (token !== epoch) return;
        const remote = event.streams?.[0] || (typeof Stream === 'function' && event.track ? new Stream([event.track]) : null);
        if (!remote) {publish({notice: 'Esperando el audio de Gastón…'});return;}
        audio.srcObject = remote;
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
        // A rejected command is not a closed session. Keep consuming audio and final events.
        if (value.type === 'error' && !closing) publish({notice: 'No se pudo completar una instrucción. La conversación sigue abierta.'});
      };
      const lost = () => {if (token !== epoch || finalSeen) return;
        disconnected = true; closedResolve?.(false); publish({incomplete: true});
        void stop('Finalización incompleta: la conexión se interrumpió.');};
      channel.onclose = lost; channel.onopen = () => {if (token === epoch) void status(token);};
      peer.onconnectionstatechange = () => {
        const connection = peer?.connectionState;
        if (connection === 'disconnected') {
          if (disconnectTimer === null) {
            publish({phase: 'reconnecting', notice: 'Recuperando la conexión de voz…'});
            disconnectTimer = setTimeout(() => {disconnectTimer = null; if (token === epoch && peer?.connectionState === 'disconnected') lost();}, disconnectGrace);
          }
        } else if (connection === 'connected') {
          clearTimeout(disconnectTimer); disconnectTimer = null;
          if (state.phase === 'reconnecting') {
            publish({phase: started ? 'listening' : 'starting', notice: started ?
              'Conexión recuperada. Sigue hablando con Gastón.' : 'Preparando conversación…'});
            ready();
          }
        } else if (['failed','closed'].includes(connection)) lost();
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
      mode = ['basic','operativo','expediente'].includes(result.mode)?result.mode:'basic'; contextReady = mode === 'basic';
      publish({mode});
      sessionId = id; // Opaque; never parse or rebuild.
      await peer.setRemoteDescription({type: 'answer', sdp}); connectedAt = now();
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
  async function retryContext() {
    if (!credential || !sessionId || closing || state.phase !== 'listening') return false;
    const token=epoch;
    try {
      const result=await post('/voice/context-retry',{session_id:sessionId},credential,AbortSignal.timeout(12000));
      if(token!==epoch||closing)return false;
      publish({context_phase:result.context_phase,context_attempts:result.context_attempts||0,context_error:result.context_error||null});
      void status(token);return result.retrying===true;
    } catch {
      if(token===epoch&&!closing)publish({notice:'La voz sigue activa. No se pudo recuperar el expediente; vuelve a intentar.'});
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
    // GPT-Live handles interruption from incoming speech; do not send extra setup/command messages.
    publish({notice: 'Interrúmpelo hablando. El micrófono sigue activo.'});
  }
  function abandon() {
    // Navigation cannot guarantee a final event. Never report it as a confirmed close.
    prepared = null; preparing = null;
    disconnected = true; closedResolve?.(false); publish({incomplete: true});
    void stop('Finalización incompleta al salir de esta pantalla.');
  }
  return {prepare, start, stop, mute, retryContext, interrupt, abandon, refresh: () => status(epoch), retryActions:()=>{actions?.retry();void status(epoch);}, snapshot: () => ({...state})};
}
