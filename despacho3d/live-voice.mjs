import {validateFastSession} from './fast-lane.mjs';
import {transcriptFragment} from './live-transcript.mjs';

const NOTICES = {
  unauthorized: 'La sesión cambió. Vuelve a abrir el despacho.',
  busy: 'El autón tiene una conversación en curso. Espera un momento.',
  rate_limited: 'Vuelve a intentar en un momento.',
  auth_unavailable: 'OpenAI no aceptó la conexión de voz.',
  provider_busy: 'OpenAI está ocupado. Vuelve a intentar en un momento.',
  observer_unavailable: 'No pudimos conectar el registro de conversación. Vuelve a intentar.',
  voice_unavailable: 'La voz no está disponible en el servidor. Puedes continuar por escrito en este puesto.',
  context_unavailable: 'No pudimos recuperar el expediente del proyecto.',
};
export function createLiveVoice({mint, fetchImpl = (...args) => fetch(...args),
  media = globalThis.navigator?.mediaDevices, Peer = globalThis.RTCPeerConnection, Stream = globalThis.MediaStream,
  audio, onChange = () => {}, actions = null, onTranscript = () => {}, now = Date.now,
  schedule = setInterval, cancel = clearInterval, closeTimeout = 20000, disconnectGrace = 12000, maxStatusFailures = 3, startTimeout = 60000} = {}) {
  let epoch = 0, stream = null, peer = null, channel = null, credential = null, sessionId = null,
    poll = null, controller = null, polling = false, closing = null, began = 0, started = false,
    contextReady = false, finalSeen = false, disconnected = false, closedResolve = null, sequence = 0,
    disconnectTimer = null, statusFailures = 0, connectedAt = 0, prepared = null, preparing = null, mode = null, startTimer = null, retryingContext = false, interruptionId = null;
  let state = {phase: 'idle', notice: '', muted: false, fragments: 0, blocks: 0, saved: 0, pending: 0,
    incomplete: false, finalized: false, status_pending: false, playback_blocked: false, context_retry_pending: false, mode: null, output_paused:false, interruption_pending:false};
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
    clearTimeout(startTimer); startTimer = null;
    clearTimeout(disconnectTimer); disconnectTimer = null;
    if (channel) {channel.onmessage = channel.onopen = channel.onclose = null; channel.close?.();} channel = null;
    if (peer) {peer.ontrack = peer.onconnectionstatechange = null; peer.close();} peer = null;
    stream?.getTracks().forEach(track => track.stop()); stream = null;
    if (audio) {audio.pause?.(); audio.srcObject = null;audio.muted=false;}
    interruptionId=null;
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
  const ready = (notice = 'Habla con el autón. Puedes interrumpirlo al hablar.') => {
    if (closing || !started || state.phase !== 'starting') return;
    clearTimeout(startTimer); startTimer = null;
    stream?.getAudioTracks().forEach(track => {track.enabled = !state.muted;});
    publish({phase: 'listening', notice});
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
        closing = null; retryingContext = false; publish({phase: 'idle', muted: false, playback_blocked: false, output_paused:false,interruption_pending:false, context_retry_pending: false, notice});
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
  async function playAudio() {
    const token = epoch, remote = audio?.srcObject;
    if (!remote || !audio?.play || !peer) return false;
    try {
      await audio.play();
      if (token !== epoch || audio.srcObject !== remote) return false;
      publish({playback_blocked: false});
      return true;
    } catch {
      if (token === epoch && audio.srcObject === remote)
        publish({playback_blocked: true});
      return false;
    }
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
    interruptionId=null;
    mode = null; started = contextReady = finalSeen = disconnected = false; seen.clear(); sequence = 0; polling = false; statusFailures = 0; connectedAt = 0;
    publish({phase: 'starting', notice: 'Abriendo el micrófono…', fragments: 0, blocks: 0, saved: 0,
      pending: 0, incomplete: false, finalized: false, status_pending: false, playback_blocked: false, context_retry_pending: false, output_paused:false,interruption_pending:false, mode: null,context_phase:'preparing',context_attempts:0,context_error:null,tools_ready:false,documents_ready:false,tasks_ready:false,actions_pending:0});
    try {
      if (typeof media?.getUserMedia !== 'function' || typeof Peer !== 'function' || !audio)
        throw Error('Este navegador no admite voz en tiempo real.');
      audio.muted=false;
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
        if (!remote) {publish({notice: 'Esperando el audio del proyecto…'});return;}
        audio.srcObject = remote;
        void playAudio();
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
        if(value.type==='session.instructions.appended'&&value.client_event_id===interruptionId){interruptionId=null;publish({interruption_pending:false});}
        const interruptRejected = value.type === 'error' && interruptionId !== null &&
          [value.client_event_id, value.error?.client_event_id, value.error?.event_id].includes(interruptionId);
        if (interruptRejected) {interruptionId=null;publish({interruption_pending:false,notice:'El sonido sigue pausado. No se confirmó la instrucción de escuchar.'});}
        if (value.type === 'session.closed') {
          finalSeen = true; closedResolve?.(true);
          if (!closing) void stop('Conversación finalizada.');
        }
        // A rejected command is not a closed session. Keep consuming audio and final events.
        if (value.type === 'error' && !closing && !interruptRejected) publish({notice: 'No se pudo completar una instrucción. La conversación sigue abierta.'});
      };
      const lost = () => {if (token !== epoch || finalSeen) return;
        disconnected = true; closedResolve?.(false); publish({incomplete: true});
        void stop('Finalización incompleta: la conexión se interrumpió.');};
      channel.onclose = lost; channel.onopen = () => {if (token === epoch) void status(token);};
      peer.onconnectionstatechange = () => {
        if (token !== epoch || closing || finalSeen) return;
        const connection = peer?.connectionState;
        if (connection === 'disconnected') {
          if (disconnectTimer === null) {
            publish({phase: 'reconnecting', notice: 'Recuperando la conexión de voz…'});
            disconnectTimer = setTimeout(() => {disconnectTimer = null; if (token === epoch && peer?.connectionState === 'disconnected') lost();}, disconnectGrace);
          }
        } else if (connection === 'connected') {
          clearTimeout(disconnectTimer); disconnectTimer = null;
          if (state.phase === 'reconnecting') {
            // Run the same microphone transition even when session.started arrived while disconnected.
            publish({phase: 'starting', notice: 'Preparando conversación…'});
            ready('Conexión recuperada. Sigue hablando con el autón.');
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
      if (token !== epoch || closing) return false;
      if (!started) startTimer = setTimeout(() => {
        startTimer = null;
        if (token === epoch && !started && !closing) void stop('No se confirmó el inicio de voz. Puedes volver a intentar.');
      }, startTimeout);
      poll = schedule(() => {void status(token);}, 2000); void status(token);
      return true;
    } catch (error) {
      if (token === epoch && !closing) {
        // Forget only the temporary credential rejected by this attempt. A newer preparation must survive.
        if (error?.code === 'unauthorized' && prepared === credential) prepared = null;
        if (sessionId) await stop();
        else {epoch++; release(); credential = null; publish({phase: 'error', notice: error?.name === 'NotAllowedError'
          ? 'Permite el micrófono en el navegador y pulsa Volver a intentar.' : error?.name === 'NotFoundError'
          ? 'No encontramos un micrófono. Conecta uno y vuelve a intentar.' : error?.name === 'NotReadableError'
          ? 'No pudimos abrir el micrófono. Revisa si otra aplicación lo está usando.' : error?.message || 'No pudimos iniciar la voz.'});}
      }
      return false;
    }
  }
  async function retryContext() {
    if (!credential || !sessionId || closing || retryingContext || state.phase !== 'listening') return false;
    const token=epoch; retryingContext=true; publish({context_retry_pending:true});
    try {
      const result=await post('/voice/context-retry',{session_id:sessionId},credential,AbortSignal.timeout(12000));
      if(token!==epoch||closing)return false;
      publish({context_phase:result.context_phase,context_attempts:result.context_attempts||0,context_error:result.context_error||null});
      void status(token);return result.retrying===true;
    } catch {
      if(token===epoch&&!closing)publish({notice:'La voz sigue activa. No se pudo recuperar el expediente; vuelve a intentar.'});
      return false;
    } finally {
      if (token === epoch) {retryingContext=false;publish({context_retry_pending:false});}
    }
  }
  async function notifyBoard(revision){
    if(!credential||!sessionId||closing||!state.context_ready&&state.context_phase!=='ready')return false;
    try{await post('/voice/board-change',{session_id:sessionId,revision},credential,AbortSignal.timeout(8000));return true;}catch{return false;}
  }
  function mute() {
    if (!stream || state.phase !== 'listening') return;
    const muted = !state.muted; stream.getAudioTracks().forEach(track => {track.enabled = !muted;});
    publish({muted, notice: muted ? 'Micrófono silenciado.' : 'Micrófono activo.'});
  }
  function interrupt() {
    if (channel?.readyState !== 'open' || state.phase !== 'listening' || state.output_paused) return false;
    // Muting the live remote track stops playback immediately without stopping input or work.
    audio.muted=true;
    stream?.getAudioTracks().forEach(track=>{track.enabled=true;});
    interruptionId='listen-'+epoch+'-'+(++sequence);
    publish({muted:false,output_paused:true,interruption_pending:true,notice:'Te escucho. El sonido está pausado; pulsa Volver a escuchar cuando termines.'});
    try{channel.send(JSON.stringify({type:'session.instructions.append',event_id:interruptionId,delegation_id:null,
      content:'El usuario pulsó Escúchame. Deja de hablar y escucha su intervención. No continúes el discurso anterior. Responde brevemente cuando termine. No canceles tareas ni cierres la sesión.'}));}
    catch{interruptionId=null;publish({interruption_pending:false,notice:'Sonido pausado. No se pudo enviar la instrucción de escuchar.'});}
    return true;
  }
  function resumeAudio(){
    if(state.phase!=='listening'||!state.output_paused)return false;
    // Media continues advancing while muted; no recorded monologue is replayed.
    audio.muted=false;publish({output_paused:false,notice:'Sonido activo. Puedes seguir conversando.'});
    void playAudio();return true;
  }
  function abandon() {
    // Navigation cannot guarantee a final event. Never report it as a confirmed close.
    prepared = null; preparing = null;
    disconnected = true; closedResolve?.(false); publish({incomplete: true});
    void stop('Finalización incompleta al salir de esta pantalla.');
  }
  return {prepare, start, stop, mute, playAudio, retryContext, notifyBoard, interrupt, resumeAudio, abandon, refresh: () => status(epoch), retryActions:()=>{actions?.retry();void status(epoch);}, snapshot: () => ({...state})};
}
