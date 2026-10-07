import {createLocalInputMonitor} from './voice-input-monitor.mjs?v=1';
import {createVoicePreparation} from './voice-preparation.mjs?v=2';
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
  audio, monitorFactory = createLocalInputMonitor, onChange = () => {}, canOperate = () => true, actions = null, onTranscript = () => {}, now = Date.now,
  schedule = setInterval, cancel = clearInterval, closeTimeout = 20000, disconnectGrace = 12000, maxStatusFailures = 3, startTimeout = 60000, signallingTimeout = 90000} = {}) {
  let inputMonitor = null, remoteSpeechObserved = false, automaticInterruptionId = null;
  let epoch = 0, stream = null, peer = null, channel = null, credential = null, sessionId = null,
    poll = null, controller = null, polling = false, closing = null, began = 0, started = false,
    contextReady = false, finalSeen = false, disconnected = false, closedResolve = null, sequence = 0,
    disconnectTimer = null, statusFailures = 0, connectedAt = 0, prepared = null, preparing = null, mode = null, startTimer = null, retryingContext = false, interruptionId = null, helloFlight = null, helloReady = null, preparationEpoch = 0, activeCaseId = null, pendingBoard = null, boardFlight = null, boardSent = null, boardRetryAt = 0;
  let state = {phase: 'idle', notice: '', muted: false, fragments: 0, blocks: 0, saved: 0, pending: 0,
    incomplete: false, finalized: false, status_pending: false, playback_blocked: false, context_retry_pending: false, input_detected:false, input_received:false, mode: null, output_paused:false, interruption_pending:false, local_speaking:false, ended_remotely:false, interruption_error:false, timings:{}};
  const timing = key => {if(!Object.hasOwn(state.timings,key))publish({timings:{...state.timings,[key]:Math.max(0,now()-began)}});};
  const preparation=createVoicePreparation({Peer,gather,now});
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
    inputMonitor?.close();inputMonitor=null;
    if (poll !== null) cancel(poll); poll = null;
    clearTimeout(startTimer); startTimer = null;
    clearTimeout(disconnectTimer); disconnectTimer = null;
    boardFlight=null;
    if (channel) {channel.onmessage = channel.onopen = channel.onclose = null; channel.close?.();} channel = null;
    if (peer) {peer.ontrack = peer.onconnectionstatechange = null; peer.close();} peer = null;
    stream?.getTracks().forEach(track => {track.onended=null;track.stop();}); stream = null;
    if (audio) {audio.pause?.(); audio.srcObject = null;audio.muted=false;}
    interruptionId=null;automaticInterruptionId=null;remoteSpeechObserved=false;
  }
  async function ensureCredential(caseId) {
    if (prepared?.case_id === caseId && prepared.expires_at - now() > 60000) return prepared;
    if (preparing?.caseId === caseId) return preparing.promise;
    const own = preparationEpoch;
    const promise = Promise.resolve().then(() => mint({case_id: caseId}))
      .then(raw => validateFastSession(raw, caseId, now()));
    preparing = {caseId, promise};
    try {const value = await promise; if (own === preparationEpoch) prepared = value; return value;}
    finally {if (preparing?.promise === promise) preparing = null;}
  }
  async function prepare(caseId,{connection=false}={}) {
    if(connection&&!closing&&['idle','error'].includes(state.phase))void preparation.warm(caseId);
    if(helloFlight?.caseId===caseId)return helloFlight.promise;
    if(helloReady?.caseId===caseId&&now()-helloReady.at<30000)return true;
    const own=preparationEpoch;
    const promise=(async()=>{
      try{
        const value=await ensureCredential(caseId);
        if(own!==preparationEpoch)return false;
        const response=await fetchImpl(value.endpoint+'/fast/hello',{headers:{Authorization:'Bearer '+value.token},
          cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
        if(own!==preparationEpoch)return false;
        if(response.status===401||response.status===403){if(prepared===value)prepared=null;return false;}
        if(response.ok)helloReady={caseId,at:now()};
        return response.ok;
      }catch{return false;}
    })();
    helloFlight={caseId,promise};
    try{return await promise;}finally{if(helloFlight?.promise===promise)helloFlight=null;}
  }
  function discardPreparation(){
    preparationEpoch++;preparation.discard();prepared=null;preparing=null;helloReady=null;helloFlight=null;
  }
  const report = result => publish({fragments: result.fragments, blocks: result.blocks, saved: result.saved,
    pending: result.pending, incomplete: state.incomplete || result.incomplete === true});
  const ready = (notice = 'Conexión lista. Puedes hablar.') => {
    if (closing || !started || state.phase !== 'starting') return;
    clearTimeout(startTimer); startTimer = null;
    stream?.getAudioTracks().forEach(track => {track.enabled = !state.muted;});
    timing('listening_ms');
    publish({phase: 'listening', notice:state.output_paused?'Sonido pausado. Te escucho.':notice});
    sendListeningIntent();
    if(!inputMonitor)inputMonitor=monitorFactory({stream,enabled:()=>state.phase==='listening'&&!state.muted&&canOperate(),onActivity:value=>{
      if(state.phase!=='listening'||closing||state.muted||!canOperate())value=false;
      const begins=value&&!state.local_speaking;
      audio.muted=state.output_paused||value;
      publish({local_speaking:value,...(value?{input_detected:true}:{})});
      // Silence locally first; ask the same Live session to listen only after observed agent output.
      if(begins&&remoteSpeechObserved)sendAutomaticListeningIntent();
    }});
  };
  function stop(notice = 'Conversación finalizada.') {
    if (closing) return closing;
    if (!stream && !sessionId && state.phase !== 'starting') return Promise.resolve(state);
    inputMonitor?.close();inputMonitor=null;
    publish({phase: 'closing', local_speaking:false, notice: 'Finalizando conversación y comprobando el historial…'});
    // Silence immediately; keep transport and transcripts alive until finalization.
    if(audio)audio.muted=true;
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
      // The observer can receive session.started before the browser attaches its primary channel.
      // Only this authenticated response for the current opaque session may reconcile that event.
      if (result.active === true && result.started === true && Number.isFinite(result.expires_at) &&
          now() < result.expires_at && peer?.connectionState === 'connected' && channel?.readyState === 'open')
        started = true;
      report(result); contextReady = result.context_ready === true; ready();
      if(contextReady){timing('context_ms');void flushBoard();}
      publish({context_phase:result.context_phase||'preparing',context_attempts:result.context_attempts||0,context_error:result.context_error||null,tools_ready:result.tools_ready===true,documents_ready:result.documents_ready===true,tasks_ready:result.tasks_ready===true,actions_pending:result.actions?.length||0});
      if(result.tools_ready&&actions&&credential&&canOperate()){const auth=credential,id=sessionId,own=epoch;
        actions.consume(result.actions,{caseId:auth.case_id,active:()=>epoch===own&&!closing&&started&&canOperate()&&['listening','reconnecting','starting'].includes(state.phase),post:(path,data)=>post(path,{session_id:id,...data},auth,AbortSignal.timeout(15000))});
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
  async function sampleInput(token) {
    if(token!==epoch||closing||state.phase!=='listening'||state.muted||!peer?.getStats)return;
    try{
      const reports=await peer.getStats();
      if(token!==epoch||closing)return;
      let detected=false;
      reports.forEach(report=>{if(report.type==='media-source'&&report.kind==='audio'&&report.audioLevel>.01)detected=true;});
      if(detected&&!state.input_detected)publish({input_detected:true});
    }catch{/* Missing browser statistics do not interrupt the call. */}
  }
  async function playAudio() {
    inputMonitor?.resume();
    const token = epoch, remote = audio?.srcObject;
    if (!remote || !audio?.play || !peer) return false;
    try {
      await audio.play();
      if (token !== epoch || audio.srcObject !== remote) return false;
      timing('playback_ms');
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
  async function start(caseId,{encounter=false}={}) {
    if (closing || !['idle','error'].includes(state.phase)) return false;
    const token = ++epoch; controller = new AbortController(); began = now();activeCaseId=caseId;boardSent=null;boardRetryAt=0;
    interruptionId=null;automaticInterruptionId=null;remoteSpeechObserved=false;
    mode = null; started = contextReady = finalSeen = disconnected = false; seen.clear(); sequence = 0; polling = false; statusFailures = 0; connectedAt = 0;
    publish({phase: 'starting', notice: 'Abriendo el micrófono…', fragments: 0, blocks: 0, saved: 0,
      pending: 0, incomplete: false, finalized: false, status_pending: false, playback_blocked: false, context_retry_pending: false, output_paused:false,interruption_pending:false, mode: null,local_speaking:false,timings:{},input_detected:false,input_received:false,context_phase:'preparing',context_attempts:0,context_error:null,tools_ready:false,documents_ready:false,tasks_ready:false,actions_pending:0,ended_remotely:false,interruption_error:false});
    try {
      if (typeof media?.getUserMedia !== 'function' || typeof Peer !== 'function' || !audio)
        throw Error('Este navegador no admite voz en tiempo real.');
      audio.muted=false;
      // Prepare authentication in parallel with the browser's microphone permission.
      const auth = ensureCredential(caseId).then(value => ({value}), error => ({error}));
      const captured = await media.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}, video: false});
      if (token !== epoch || closing) {captured.getTracks().forEach(track => track.stop()); return false;}
      stream = captured;timing('microphone_ms');publish({notice:'Micrófono disponible. Preparando acceso al proyecto…'});
      const minted = await auth;
      if (token !== epoch || closing) return false;
      if (minted.error) throw minted.error;
      timing('access_ms');
      const warmed=await preparation.take(caseId);
      if(token!==epoch||closing){warmed?.channel.close?.();warmed?.peer.close();return false;}
      credential = minted.value; peer = warmed?.peer || new Peer();
      audio.autoplay = true; audio.playsInline = true; audio.setAttribute?.('playsinline','');
      publish({notice: 'Conectando voz…'});
      peer.ontrack = event => {
        if (token !== epoch) return;
        const remote = event.streams?.[0] || (typeof Stream === 'function' && event.track ? new Stream([event.track]) : null);
        if (!remote) {publish({notice: 'Esperando el audio del proyecto…'});return;}
        audio.srcObject = remote;audio.muted=state.output_paused||state.phase==='closing'||state.local_speaking;
        void playAudio();
      };
      for (const track of stream.getAudioTracks()) {
        track.enabled = false;
        track.onended=()=>{if(token===epoch&&!closing)void stop('El micrófono dejó de estar disponible. Revisa el dispositivo y vuelve a intentar.');};
        if(warmed)await warmed.sender.replaceTrack(track);else peer.addTrack(track, stream);
      }
      channel = warmed?.channel || peer.createDataChannel('oai-events');
      channel.onmessage = event => {
        if (token !== epoch) return;
        let value; try {value = JSON.parse(event.data);} catch {return;}
        if (value.type === 'session.started') {started = true; ready(); void status(token);}
        const fragment = transcriptFragment(value, sequence++);
        if (fragment && (!fragment.event_id || !seen.has(fragment.event_id))) {
          if (fragment.event_id) seen.add(fragment.event_id);
          if(fragment.role==='assistant')remoteSpeechObserved=true;
          if(fragment.role==='user'){remoteSpeechObserved=false;if(!state.input_received)publish({input_received:true});}
          onTranscript(fragment);
        }
        if(value.type==='session.instructions.appended'&&value.client_event_id===interruptionId){interruptionId=null;publish({interruption_pending:false,interruption_error:false});}
        if(value.type==='session.instructions.appended'&&value.client_event_id===automaticInterruptionId){automaticInterruptionId=null;publish({interruption_error:false});}
        const automaticRejected=value.type==='error'&&automaticInterruptionId!==null&&
          [value.client_event_id,value.error?.client_event_id,value.error?.event_id].includes(automaticInterruptionId);
        if(automaticRejected){automaticInterruptionId=null;publish({interruption_error:true,notice:'Tu micrófono detecta sonido. No se confirmó la orden de escuchar; puedes usar Escúchame.'});}
        const interruptRejected = value.type === 'error' && interruptionId !== null &&
          [value.client_event_id, value.error?.client_event_id, value.error?.event_id].includes(interruptionId);
        if (interruptRejected) {interruptionId=null;publish({interruption_pending:false,interruption_error:true,notice:'El sonido sigue pausado. No se confirmó la instrucción de escuchar.'});}
        if (value.type === 'session.closed') {
          finalSeen = true; closedResolve?.(true);
          if (!closing) {publish({ended_remotely:true});void stop('La sesión de voz terminó desde el servicio. Tu conversación sigue en este puesto; puedes volver a hablar.');}
        }
        // A rejected command is not a closed session. Keep consuming audio and final events.
        if (value.type === 'error' && !closing && !interruptRejected && !automaticRejected) publish({notice: 'No se pudo completar una instrucción. La conversación sigue abierta.'});
      };
      const lost = () => {if (token !== epoch || finalSeen) return;
        disconnected = true; closedResolve?.(false); publish({incomplete: true});
        void stop('Finalización incompleta: la conexión se interrumpió.');};
      channel.onclose = lost; channel.onopen = () => {if (token === epoch){sendListeningIntent();void status(token);}};
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
        if(!started)void status(token);
        } else if (['failed','closed'].includes(connection)) lost();
      };
      if(!warmed){await peer.setLocalDescription(await peer.createOffer()); await gather(peer);}
      if (token !== epoch || closing) return false;
      timing('offer_ms');
      const current = credential;
      // Bound signalling, not the user's microphone permission prompt.
      const signallingController = controller;
      let signallingTimedOut = false, result;
      const signallingTimer = setTimeout(() => {
        if (token !== epoch || closing) return;
        signallingTimedOut = true; signallingController.abort();
      }, signallingTimeout);
      try {
        result = await post('/voice/session', {sdp: peer.localDescription.sdp,...(encounter?{encounter:true}:{})}, current, signallingController.signal);
      } catch (error) {
        if (signallingTimedOut) throw Error('La conexión de voz no respondió a tiempo. Puedes volver a intentar.');
        throw error;
      } finally {clearTimeout(signallingTimer);}
      timing('signalling_ms');
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
      poll = schedule(() => {void status(token);void sampleInput(token);}, 2000); void status(token);
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
  async function notifyBoard(revision,caseId=activeCaseId){
    if(typeof revision!=='string'||!revision||revision.length>256||!caseId)return false;
    pendingBoard={caseId,revision};return flushBoard();
  }
  async function flushBoard(){
    const pending=pendingBoard;
    if(!pending||pending.caseId!==activeCaseId||!credential||!sessionId||closing||!contextReady||
       boardSent===pending||boardFlight||now()<boardRetryAt||!canOperate())return false;
    const own=epoch,flight={};boardFlight=flight;boardRetryAt=now()+5000;
    try{
      await post('/voice/board-change',{session_id:sessionId,revision:pending.revision},credential,AbortSignal.timeout(8000));
      if(own!==epoch)return false;
      boardSent=pending;return true;
    }catch{return false;}
    finally{if(boardFlight===flight)boardFlight=null;}
  }
  function mute() {
    if (!stream || state.phase !== 'listening') return;
    const muted = !state.muted; stream.getAudioTracks().forEach(track => {track.enabled = !muted;});
    publish({muted, notice: muted ? 'Micrófono silenciado.' : 'Micrófono activo.'});
  }
  function sendAutomaticListeningIntent(){
    if(!started||closing||state.phase!=='listening'||state.muted||!canOperate()||channel?.readyState!=='open')return;
    remoteSpeechObserved=false;
    const id='overlap-'+epoch+'-'+(++sequence);automaticInterruptionId=id;
    try{channel.send(JSON.stringify({type:'session.instructions.append',event_id:id,delegation_id:null,
      content:'El micrófono local detectó que el usuario interviene mientras respondes. Deja de hablar y escucha su intervención completa. No retomes el discurso interrumpido. La detección acústica no es una transcripción: espera sus palabras antes de responder. No canceles tareas ni cierres la sesión.'}));}
    catch{if(automaticInterruptionId===id)automaticInterruptionId=null;publish({interruption_error:true,notice:'El sonido se pausa mientras hablas. No se pudo enviar la orden de escuchar; puedes usar Escúchame.'});}
  }
  function sendListeningIntent(){
    if(!state.output_paused||!state.interruption_pending||interruptionId||!started||
       closing||channel?.readyState!=='open')return;
    interruptionId='listen-'+epoch+'-'+(++sequence);
    try{channel.send(JSON.stringify({type:'session.instructions.append',event_id:interruptionId,delegation_id:null,
      content:'El usuario pulsó Escúchame. Deja de hablar y escucha su intervención. No continúes el discurso anterior. Responde brevemente cuando termine. No canceles tareas ni cierres la sesión.'}));}
    catch{interruptionId=null;publish({interruption_pending:false,notice:'Sonido pausado. No se pudo enviar la instrucción de escuchar.'});}
  }
  function interrupt() {
    if(!['starting','listening','reconnecting'].includes(state.phase)||state.output_paused)return false;
    // Local control must work even before signalling or session.started completes.
    audio.muted=true;
    if(started)stream?.getAudioTracks().forEach(track=>{track.enabled=true;});
    publish({muted:false,output_paused:true,interruption_pending:true,notice:started?
      'Te escucho. El sonido está pausado; pulsa Volver a escuchar cuando termines.':
      'Sonido pausado. El micrófono se activará cuando termine la conexión.'});
    sendListeningIntent();return true;
  }
  function resumeAudio(){
    if(!['starting','listening','reconnecting'].includes(state.phase)||!state.output_paused)return false;
    // Media continues advancing while muted; no recorded monologue is replayed.
    audio.muted=state.local_speaking;publish({output_paused:false,interruption_pending:!!interruptionId,notice:started?'Sonido activo. Puedes seguir conversando.':'Sonido habilitado. Conectando voz…'});
    void playAudio();return true;
  }
  function abandon() {
    // Navigation cannot guarantee a final event. Never report it as a confirmed close.
    discardPreparation();
    disconnected = true; closedResolve?.(false); publish({incomplete: true});
    void stop('Finalización incompleta al salir de esta pantalla.');
  }
  return {prepare, discardPreparation, start, stop, mute, playAudio, retryContext, notifyBoard, interrupt, resumeAudio, abandon, refresh: () => status(epoch), retryActions:()=>{actions?.retry();void status(epoch);}, snapshot: () => ({...state})};
}
