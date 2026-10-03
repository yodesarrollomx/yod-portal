// Browser voice is an explicit input/output aid. It never sends a conversation
// request, stores audio, or restores authorization.
const MAX_TEXT = 8000;
const MAX_RESPONSE = 12000;
const ERROR_NOTICES = {
  'not-allowed': 'El navegador no permitió el micrófono. Revisa su permiso y vuelve a dictar.',
  'service-not-allowed': 'El servicio de dictado no está permitido en este navegador.',
  'audio-capture': 'No se encontró un micrófono disponible.',
  'no-speech': 'No se detectó voz. Puedes volver a dictar.',
  'network': 'El servicio de dictado perdió la conexión. Puedes escribir o volver a dictar.',
  'language-not-supported': 'El navegador no admite el dictado en español.',
};

function chunks(text) {
  const result = [];
  let rest = text;
  while (rest.length > 700) {
    let end = rest.lastIndexOf(' ', 700);
    if (end < 200) end = 700;
    result.push(rest.slice(0, end));
    rest = rest.slice(end).trimStart();
  }
  if (rest) result.push(rest);
  return result;
}

export function createConversationVoice({
  Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition,
  synthesis = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  onTranscript = () => {},
  onChange = () => {},
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancelTimer = timer => clearTimeout(timer),
} = {}) {
  const supportedDictation = typeof Recognition === 'function';
  const supportedPlayback = typeof Utterance === 'function' &&
    typeof synthesis?.speak === 'function' && typeof synthesis?.cancel === 'function';
  let state = { supportedDictation, supportedPlayback, phase: 'idle', notice: '' };
  let context = '', enabled = false, disposed = false, generation = 0;
  let recognition = null, utterance = null, timer = null;

  const snapshot = () => ({ ...state });
  function publish(phase, notice = '') {
    state = { ...state, phase, notice };
    if (!disposed) onChange(snapshot());
  }
  function release() {
    generation++;
    if (timer !== null) cancelTimer(timer);
    timer = null;
    const previous = recognition;
    const speaking = utterance !== null;
    recognition = null;
    utterance = null;
    if (previous) {
      previous.onstart = previous.onresult = previous.onerror = previous.onend = null;
      try { previous.abort(); } catch { /* Already ended. */ }
    }
    if (speaking) {
      try { synthesis.cancel(); } catch { /* Already ended. */ }
    }
  }
  function stop(notice = '') {
    release();
    publish('idle', typeof notice === 'string' ? notice : '');
  }
  const live = token => !disposed && enabled && generation === token;

  function setContext(nextContext, nextEnabled = true) {
    const next = typeof nextContext === 'string' ? nextContext : '';
    const allowed = nextEnabled === true && !!next;
    if (next !== context || allowed !== enabled) stop();
    context = next;
    enabled = allowed;
  }

  function dictate() {
    if (disposed || !enabled) return false;
    stop();
    if (!supportedDictation) {
      publish('idle', 'El dictado no está disponible en este navegador. Puedes escribir el mensaje.');
      return false;
    }
    const token = generation;
    let total = 0;
    const delivered = new Set();
    try {
      const current = new Recognition();
      recognition = current;
      current.lang = 'es-MX';
      current.continuous = false;
      current.interimResults = false;
      current.maxAlternatives = 1;
      current.onstart = () => {
        if (live(token)) publish('listening', 'Escuchando…');
      };
      current.onresult = event => {
        if (!live(token)) return;
        const parts = [];
        const start = Number.isInteger(event?.resultIndex) && event.resultIndex >= 0 ? event.resultIndex : 0;
        const end = Math.min(Number(event?.results?.length) || 0, 100);
        for (let index = start; index < end && total < MAX_TEXT; index++) {
          const result = event.results[index];
          if (delivered.has(index) || !result?.isFinal || typeof result[0]?.transcript !== 'string') continue;
          delivered.add(index);
          const text = result[0].transcript.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT - total);
          if (text) { parts.push(text); total += text.length; }
        }
        if (parts.length) onTranscript(parts.join(' ').slice(0, MAX_TEXT));
        if (live(token) && total >= MAX_TEXT) stop('Se alcanzó el límite del dictado. Revisa el borrador antes de enviar.');
      };
      current.onerror = event => {
        if (live(token)) stop(ERROR_NOTICES[event?.error] || 'El dictado se interrumpió. Puedes escribir o volver a dictar.');
      };
      current.onend = () => {
        if (live(token)) stop(total ? 'Dictado añadido. Revisa el borrador antes de enviar.' : ERROR_NOTICES['no-speech']);
      };
      publish('starting', 'Abriendo el micrófono…');
      timer = schedule(() => {
        if (live(token)) stop('El dictado terminó después de un minuto. Puedes continuar escribiendo o volver a dictar.');
      }, 60000);
      current.start();
      return true;
    } catch {
      if (live(token)) stop('No se pudo abrir el micrófono. Revisa el permiso del navegador o escribe tu mensaje.');
      return false;
    }
  }

  // Callers provide an assistant row from the already-read Sheets snapshot.
  // Neither draft text nor pending/streaming results belong here.
  function speak(response) {
    if (disposed || !enabled) return false;
    stop();
    if (!supportedPlayback) {
      publish('idle', 'La lectura en voz alta no está disponible en este navegador.');
      return false;
    }
    if (!response || response.role !== 'assistant' || typeof response.id !== 'string' || !response.id ||
      typeof response.body !== 'string' || !response.body.trim() || response.body.length > MAX_RESPONSE) {
      publish('idle', 'Elige una respuesta guardada para escucharla.');
      return false;
    }
    const text = chunks(response.body.trim());
    const token = generation;
    let index = 0;
    const next = () => {
      if (!live(token)) return;
      if (index >= text.length) { stop('Lectura terminada.'); return; }
      try {
        const current = new Utterance(text[index++]);
        utterance = current;
        current.lang = 'es-MX';
        current.rate = 1;
        current.onend = () => { if (live(token) && utterance === current) next(); };
        current.onerror = () => {
          if (live(token) && utterance === current) stop('La lectura se interrumpió. Puedes volver a escuchar la respuesta.');
        };
        synthesis.speak(current);
      } catch {
        if (live(token)) stop('No se pudo iniciar la lectura en este navegador.');
      }
    };
    publish('speaking', 'Leyendo la respuesta guardada…');
    timer = schedule(() => {
      if (live(token)) stop('La lectura se detuvo. Puedes volver a escuchar la respuesta.');
    }, 180000);
    next();
    return state.phase === 'speaking';
  }

  function dispose() {
    if (disposed) return;
    release();
    enabled = false;
    context = '';
    disposed = true;
    state = { ...state, phase: 'idle', notice: '' };
  }

  return { snapshot, setContext, dictate, speak, stop, dispose };
}

export function appendDictation(draft, transcript, limit = MAX_TEXT) {
  const current = typeof draft === 'string' ? draft : '';
  const added = typeof transcript === 'string' ? transcript.trim() : '';
  if (!added || current.length >= limit) return current;
  const separator = current && !/\s$/.test(current) ? ' ' : '';
  return (current + separator + added).slice(0, limit);
}
