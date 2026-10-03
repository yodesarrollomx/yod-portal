'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../despacho3d/conversation-voice.mjs');

async function fixture(overrides = {}) {
 const {createConversationVoice} = await load();
 const microphones = [], spoken = [], transcripts = [], states = [], timers = new Map();
 let cancelCount = 0, timerId = 0;
 class Recognition {
  constructor() { microphones.push(this); this.aborted = 0; this.started = 0; }
  start() { this.started++; }
  abort() { this.aborted++; }
 }
 class Utterance { constructor(text) { this.text = text; } }
 const voice = createConversationVoice({
  Recognition, Utterance,
  synthesis: {speak: value => spoken.push(value), cancel: () => cancelCount++},
  onTranscript: text => transcripts.push(text), onChange: state => states.push(state),
  schedule: (fn, ms) => { const id = ++timerId; timers.set(id, {fn, ms}); return id; },
  cancelTimer: id => timers.delete(id),
  ...overrides,
 });
 voice.setContext('session-1:case-synthetic', true);
 return {voice, microphones, spoken, transcripts, states, timers, get cancelled() { return cancelCount; }};
}
function results(...texts) {
 return {resultIndex: 0, results: texts.map(text => Object.assign([{transcript:text}], {isFinal:true}))};
}
const response = {id:'message-1', role:'assistant', body:'Esta respuesta ya está guardada.'};

test('dictation uses Spanish and only delivers final results once as a draft', async () => {
 const f = await fixture();
 assert.equal(f.voice.dictate(), true);
 const mic = f.microphones[0];
 assert.equal(mic.lang, 'es-MX');assert.equal(mic.continuous, false);assert.equal(mic.interimResults, false);
 assert.equal(f.voice.snapshot().phase, 'starting');
 mic.onstart();assert.equal(f.voice.snapshot().phase, 'listening');
 mic.onresult({results:[Object.assign([{transcript:'todavía no'}], {isFinal:false})]});
 assert.deepEqual(f.transcripts, []);
 const event = results('Hola,   agente.');
 mic.onresult(event);mic.onresult(event);
 assert.deepEqual(f.transcripts, ['Hola, agente.']);
 mic.onend();
 assert.equal(f.voice.snapshot().phase, 'idle');assert.equal(f.timers.size, 0);
 assert.match(f.voice.snapshot().notice, /Revisa el borrador/);
 assert.equal(f.spoken.length, 0);
});

test('cancelled microphone cannot deliver late callbacks to a new recording', async () => {
 const f = await fixture();f.voice.dictate();
 const mic = f.microphones[0], oldResult = mic.onresult, oldEnd = mic.onend, oldError = mic.onerror;
 f.voice.stop();f.voice.dictate();
 oldResult(results('mensaje cancelado'));oldEnd();oldError({error:'network'});
 assert.equal(mic.aborted, 1);assert.deepEqual(f.transcripts, []);
 assert.equal(f.voice.snapshot().phase, 'starting');
 f.microphones[1].onresult(results('mensaje vigente'));
 assert.deepEqual(f.transcripts, ['mensaje vigente']);f.voice.dispose();
});

test('context change and revoked authorization cancel microphone and block restarts', async () => {
 const f = await fixture();f.voice.dictate();
 const result = f.microphones[0].onresult;
 f.voice.setContext('session-2:case-other', false);
 result(results('dato del caso anterior'));
 assert.deepEqual(f.transcripts, []);assert.equal(f.voice.dictate(), false);assert.equal(f.voice.speak(response), false);
 assert.equal(f.voice.snapshot().phase, 'idle');assert.equal(f.timers.size, 0);
 f.voice.setContext('session-2:case-other', true);assert.equal(f.voice.dictate(), true);f.voice.dispose();
});

test('permission denial stops capture with an actionable notice, without retrying', async () => {
 const f = await fixture();f.voice.dictate();const mic = f.microphones[0];
 mic.onerror({error:'not-allowed'});
 assert.equal(mic.aborted, 1);assert.equal(f.microphones.length, 1);assert.equal(f.timers.size, 0);
 assert.match(f.voice.snapshot().notice, /permiso/);assert.equal(f.voice.snapshot().phase, 'idle');
});

test('recognition start failures and network errors leave usable text input', async () => {
 const first = await fixture({Recognition:class {start(){throw Error('private browser detail');} abort(){}}});
 assert.equal(first.voice.dictate(), false);assert.equal(first.voice.snapshot().phase, 'idle');
 assert.match(first.voice.snapshot().notice, /escribe tu mensaje/);assert.equal(first.timers.size, 0);
 const second = await fixture();second.voice.dictate();second.microphones[0].onerror({error:'network'});
 assert.match(second.voice.snapshot().notice, /Puedes escribir/);assert.equal(second.microphones.length, 1);
});

test('dictation and read-aloud feature detection are independent and do not start services', async () => {
 const f = await fixture({Recognition:null});
 assert.equal(f.voice.snapshot().supportedDictation, false);assert.equal(f.voice.snapshot().supportedPlayback, true);
 assert.equal(f.voice.dictate(), false);assert.match(f.voice.snapshot().notice, /no está disponible/);
 assert.equal(f.spoken.length, 0);assert.equal(f.voice.speak(response), true);f.voice.dispose();
 const noSpeech = await fixture({synthesis:null});
 assert.equal(noSpeech.voice.snapshot().supportedPlayback, false);assert.equal(noSpeech.voice.speak(response), false);
 assert.equal(noSpeech.voice.snapshot().supportedDictation, true);assert.equal(noSpeech.spoken.length, 0);
});

test('microphone and speech playback are mutually exclusive', async () => {
 const f = await fixture();f.voice.dictate();const lateResult = f.microphones[0].onresult;
 assert.equal(f.voice.speak(response), true);assert.equal(f.microphones[0].aborted, 1);
 lateResult(results('eco de la respuesta'));assert.deepEqual(f.transcripts, []);
 assert.equal(f.spoken[0].lang, 'es-MX');assert.equal(f.spoken[0].text, response.body);
 const lateEnd = f.spoken[0].onend;
 f.voice.dictate();assert.equal(f.cancelled, 1);lateEnd();
 assert.equal(f.voice.snapshot().phase, 'starting');assert.equal(f.spoken.length, 1);f.voice.dispose();
});

test('only valid saved assistant rows are eligible for read-aloud', async () => {
 const f = await fixture();
 for (const invalid of [null, {...response,id:''}, {...response,role:'user'}, {...response,body:''}, {...response,body:'x'.repeat(12001)}]) {
  assert.equal(f.voice.speak(invalid), false);
 }
 assert.equal(f.spoken.length, 0);assert.equal(f.timers.size, 0);
 assert.match(f.voice.snapshot().notice, /respuesta guardada/);
});

test('long saved answers use bounded speech chunks and ignore duplicate completion', async () => {
 const f = await fixture(), body = 'Una respuesta extensa. '.repeat(90).trim();
 assert.equal(f.voice.speak({...response,body}), true);
 const firstEnd = f.spoken[0].onend;
 firstEnd();assert.equal(f.spoken.length, 2);
 firstEnd();assert.equal(f.spoken.length, 2);
 let index = 1;
 while (f.voice.snapshot().phase === 'speaking') f.spoken[index++].onend();
 assert.ok(f.spoken.every(item => item.text.length <= 700));
 assert.equal(f.spoken.map(item => item.text).join(' '), body);
 assert.equal(f.timers.size, 0);assert.equal(f.voice.snapshot().phase, 'idle');
});

test('case change cancels speech and late completion cannot read remaining chunks', async () => {
 const f = await fixture();f.voice.speak({...response,body:'Dato privado. '.repeat(90)});
 const lateEnd = f.spoken[0].onend, lateError = f.spoken[0].onerror;
 f.voice.setContext('session-1:case-other', true);lateEnd();lateError();
 assert.equal(f.cancelled, 1);assert.equal(f.spoken.length, 1);
 assert.equal(f.voice.snapshot().phase, 'idle');assert.equal(f.voice.snapshot().notice, '');
});

test('bounded microphone and speech timers never restart after cancel', async () => {
 const f = await fixture();f.voice.dictate();
 const micTimer = [...f.timers.values()][0];assert.equal(micTimer.ms, 60000);
 micTimer.fn();assert.equal(f.voice.snapshot().phase, 'idle');assert.equal(f.microphones[0].aborted, 1);
 f.voice.speak(response);
 const speechTimer = [...f.timers.values()][0];assert.equal(speechTimer.ms, 180000);
 micTimer.fn();assert.equal(f.voice.snapshot().phase, 'speaking');
 speechTimer.fn();assert.equal(f.voice.snapshot().phase, 'idle');assert.equal(f.cancelled, 1);
});

test('dispose aborts pending work and ignores every late event', async () => {
 const f = await fixture();f.voice.dictate();
 const mic = f.microphones[0], lateResult = mic.onresult, lateStart = mic.onstart, lateEnd = mic.onend;
 const notifications = f.states.length;
 f.voice.dispose();lateResult(results('resultado después de cerrar'));lateStart();lateEnd();
 f.voice.setContext('new-session', true);
 assert.equal(f.voice.dictate(), false);assert.equal(f.voice.speak(response), false);
 assert.equal(f.states.length, notifications);assert.deepEqual(f.transcripts, []);assert.equal(f.timers.size, 0);
});

test('overlong recognition is truncated once and the microphone closes', async () => {
 const f = await fixture();f.voice.dictate();const result = f.microphones[0].onresult;
 result(results('x'.repeat(9000)));result(results('más contenido'));
 assert.equal(f.transcripts.length, 1);assert.equal(f.transcripts[0].length, 8000);
 assert.equal(f.microphones[0].aborted, 1);assert.equal(f.voice.snapshot().phase, 'idle');
});

test('appendDictation preserves editable text and enforces the existing message bound', async () => {
 const {appendDictation} = await load();
 assert.equal(appendDictation('Hola,', ' agente '), 'Hola, agente');
 assert.equal(appendDictation('Hola,\n', 'agente'), 'Hola,\nagente');
 assert.equal(appendDictation('', 'agente'), 'agente');
 assert.equal(appendDictation('texto', ''), 'texto');
 assert.equal(appendDictation('x'.repeat(7998), 'texto').length, 8000);
 assert.equal(appendDictation('x'.repeat(8000), 'texto'), 'x'.repeat(8000));
});
