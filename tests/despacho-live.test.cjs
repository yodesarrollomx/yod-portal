'use strict';
// Synthetic protocol fixtures: no external API, real case or credentials.
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/live-voice.mjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(createLiveVoice,{closed=true,closeTimeout=50,disconnectGrace=12000,maxStatusFailures=3,mode='expediente',failStatus=false,Stream,startTimeout=60000,signallingTimeout=90000,mintOverride,sessionOverride,statusOverride,monitorFactory,now,messageOverride}={}){
 const calls=[],captions=[],track={enabled:true,stops:0,stop(){this.stops++;}},
   stream={getTracks:()=>[track],getAudioTracks:()=>[track]},
   audio={srcObject:null,pause(){},play:async()=>{}};
 let peer,captures=0;
 class Peer{
  constructor(){peer=this;this.connectionState='connected';this.iceGatheringState='complete';this.closed=false;
   this.channel={readyState:'open',sent:[],send(raw){this.sent.push(JSON.parse(raw));},close(){this.closed=true;}};}
  createDataChannel(name){this.channelName=name;return this.channel;}
  addTrack(){} addTransceiver(){this.sender={track:null,replaceTrack:async track=>{this.sender.track=track;}};return {sender:this.sender};} createOffer(){this.offers=(this.offers||0)+1;return Promise.resolve({type:'offer',sdp:'v=0\r\noffer'});}
  setLocalDescription(value){this.localDescription=value;return Promise.resolve();}
  setRemoteDescription(value){this.remoteDescription=value;return Promise.resolve();}
  close(){this.closed=true;}
 }
 const base={ok:true,active:true,started:false,context_ready:true,finalized:false,expires_at:Date.now()+600000,
  fragments:0,blocks:0,saved:0,pending:0,incomplete:false};
 const voice=createLiveVoice({audio,Peer,Stream,monitorFactory,now,closeTimeout,disconnectGrace,maxStatusFailures,startTimeout,signallingTimeout,media:{getUserMedia:async()=>{captures++;return stream;}},
  schedule:()=>1,cancel:()=>{},onTranscript:f=>captions.push(f),
  mint:mintOverride||(async({case_id})=>({ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),
   endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000})),
  fetchImpl:async(url,options)=>{
   calls.push({url,options});
   if(url.endsWith('/voice/message')&&messageOverride)return {ok:true,json:async()=>messageOverride(JSON.parse(options.body))};
   if(failStatus && url.endsWith('/status'))throw Error('record unavailable');
   if(url.endsWith('/status')&&statusOverride)return {ok:true,json:async()=>({...base,...statusOverride()})};
   if(url.endsWith('/session')&&sessionOverride){const override=await sessionOverride(url,options);if(override)return override;}
   const value=url.endsWith('/voice/ready')?{ok:true,available:true}:url.endsWith('/session')?{ok:true,mode,session:{id:'live:opaque/session'},transport:{type:'webrtc',sdp:'v=0\r\nanswer'}}:
    url.endsWith('/close')?{...base,active:false,finalized:closed,fragments:1,blocks:1,saved:closed?1:0,pending:closed?0:1,incomplete:!closed}:base;
   return {ok:true,json:async()=>value};
  }});
 const event=value=>peer.channel.onmessage({data:JSON.stringify(value)});
 return {voice,calls,captions,track,audio,event,get captures(){return captures;},get peer(){return peer;}};
}
test('WebRTC uses remote audio and oai-events, and never enables microphone before session.started',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 assert.equal(await f.voice.start('synthetic-case'),true);await tick();
 assert.equal(f.peer.channelName,'oai-events');assert.equal(f.track.enabled,false);
 assert.equal(f.voice.snapshot().phase,'starting');assert.equal(f.peer.channel.sent.length,0);
 const remote={};f.peer.ontrack({streams:[remote]});
 f.event({type:'session.started'});await tick();
 assert.equal(f.track.enabled,true);assert.equal(f.voice.snapshot().phase,'listening');
 assert.equal(f.calls[0].options.headers.Authorization.startsWith('Bearer '),true);
 assert.deepEqual(JSON.parse(f.calls[0].options.body),{sdp:'v=0\r\noffer'});
 assert.equal(f.peer.remoteDescription.sdp,'v=0\r\nanswer');
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});
test('close preserves audio/transport for late exact captions until session.closed arrives',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 const stopping=f.voice.stop();await tick();
 assert.equal(f.peer.closed,false);assert.equal(f.peer.channel.closed,undefined);assert.equal(f.track.stops,0);
 assert.equal(f.voice.snapshot().phase,'closing');
 const caption={type:'session.output_transcript.delta',event_id:'late',delta:' palabra palabra  \n',start_ms:100,end_ms:400};
 f.event(caption);f.event(caption);assert.equal(f.captions.length,1);
 assert.equal(f.captions[0].delta,' palabra palabra  \n');
 f.event({type:'session.closed'});await stopping;
 assert.equal(f.peer.closed,true);assert.equal(f.track.stops,1);
 assert.equal(f.voice.snapshot().finalized,true);assert.equal(f.voice.snapshot().incomplete,false);
 const data=JSON.parse(f.calls.find(c=>c.url.endsWith('/close')).options.body);
 assert.equal(data.session_id,'live:opaque/session');
});
test('timeout/disconnect remains incomplete even if the server acknowledged a final event',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{closeTimeout:5});
 await f.voice.start('synthetic-case');await f.voice.stop();
 assert.equal(f.voice.snapshot().incomplete,true);assert.equal(f.voice.snapshot().finalized,false);
 assert.match(f.voice.snapshot().notice,/Finalización incompleta/);assert.equal(f.track.stops,1);
 const g=fixture(createLiveVoice,{closeTimeout:5});await g.voice.start('synthetic-case');
 g.peer.connectionState='failed';g.peer.onconnectionstatechange();await tick();
 assert.equal(g.voice.snapshot().incomplete,true);assert.equal(g.voice.snapshot().finalized,false);
});
test('cancel before microphone permission resolves releases a late stream and can start again',async()=>{
 const {createLiveVoice}=await load();let resolveMedia;
 const track={enabled:true,stops:0,stop(){this.stops++;}};
 const voice=createLiveVoice({audio:{},media:{getUserMedia:()=>new Promise(resolve=>{resolveMedia=resolve;})},Peer:class {}});
 const starting=voice.start('synthetic-case');await voice.stop();
 resolveMedia({getTracks:()=>[track]});await starting;
 assert.equal(track.stops,1);assert.equal(voice.snapshot().phase,'idle');
 const second=voice.start('synthetic-case');assert.equal(voice.snapshot().phase,'starting');
 await voice.stop();resolveMedia({getTracks:()=>[track]});await second;
 assert.equal(track.stops,2);
});
test('timing groups permit overlap and late fragments without fabricating turns or trimming text',async()=>{
 const {groupTranscriptFragments,transcriptFragment}=await import('../despacho3d/live-transcript.mjs');
 const fragments=[
  transcriptFragment({type:'session.input_transcript.delta',delta:' palabra',start_ms:1000,end_ms:1200},0),
  transcriptFragment({type:'session.output_transcript.delta',delta:' Sí  ',start_ms:950,end_ms:1300},1),
  transcriptFragment({type:'session.input_transcript.delta',delta:' palabra',start_ms:800,end_ms:1000},2)];
 assert.deepEqual(groupTranscriptFragments(fragments).map(g=>[g.role,g.start_ms,g.end_ms,g.text]),
  [['user',800,1200,' palabra palabra'],['assistant',950,1300,' Sí  ']]);
});

test('temporary peer disconnection recovers without closing or losing transcript',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{disconnectGrace:20});
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.peer.connectionState='disconnected';f.peer.onconnectionstatechange();
 assert.equal(f.voice.snapshot().phase,'reconnecting');assert.equal(f.track.stops,0);
 f.event({type:'session.input_transcript.delta',event_id:'recover',delta:' todavía aquí ',start_ms:1,end_ms:20});
 f.peer.connectionState='connected';f.peer.onconnectionstatechange();
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.voice.snapshot().incomplete,false);
 assert.equal(f.track.stops,0);assert.equal(f.calls.some(c=>c.url.endsWith('/close')),false);
 assert.equal(f.captions[0].delta,' todavía aquí ');
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});
test('persistent peer disconnection is still finalized as incomplete',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{disconnectGrace:5,closeTimeout:5});
 await f.voice.start('synthetic-case');f.peer.connectionState='disconnected';f.peer.onconnectionstatechange();
 await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(f.voice.snapshot().incomplete,true);assert.equal(f.track.stops,1);
});
test('rejected commands do not hang up an otherwise live session',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.event({type:'error',error:{type:'invalid_request_error',code:'immutable_field_update',message:'synthetic rejection'}});
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.track.stops,0);
 assert.equal(f.calls.some(c=>c.url.endsWith('/close')),false);
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});
test('background preparation never captures a microphone or creates a Live session and reuses its credential',async()=>{
 const {createLiveVoice}=await load();let captures=0,mints=0;const calls=[];
 const voice=createLiveVoice({audio:{},media:{getUserMedia:async()=>{captures++;}},Peer:class{},
  mint:async({case_id})=>{mints++;return {ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000};},
  fetchImpl:async(url)=>{calls.push(url);return {ok:true,status:200,json:async()=>({ok:true,available:true})};}});
 assert.equal(await voice.prepare('synthetic-case'),true);assert.equal(await voice.prepare('synthetic-case'),true);
 assert.equal(mints,1);assert.equal(captures,0);assert.deepEqual(calls,['https://synthetic-engine.onrender.com/voice/ready']);
 assert.equal(voice.snapshot().phase,'idle');
});
test('a single status read failure preserves live audio and a later check recovers',async()=>{
 const {createLiveVoice}=await load();let failStatus=false,checks=0,peer;
 const track={enabled:true,stops:0,stop(){this.stops++;}},stream={getTracks:()=>[track],getAudioTracks:()=>[track]};
 class Peer{constructor(){peer=this;this.iceGatheringState='complete';this.connectionState='connected';this.channel={readyState:'open',close(){},send(){}};}
  createDataChannel(){return this.channel;}addTrack(){}async createOffer(){return {sdp:'v=0'};}async setLocalDescription(v){this.localDescription=v;}async setRemoteDescription(){}close(){}}
 const voice=createLiveVoice({audio:{play:async()=>{},pause(){}},media:{getUserMedia:async()=>stream},Peer,schedule:()=>1,cancel(){},
  mint:async({case_id})=>({ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000}),
  fetchImpl:async(url)=>{if(url.endsWith('/status')){checks++;if(failStatus)throw Error('temporary network');}
   return {ok:true,json:async()=>url.endsWith('/session')?{ok:true,session:{id:'opaque'},transport:{sdp:'v=0'}}:{ok:true,active:true,started:true,context_ready:true,expires_at:Date.now()+600000,fragments:0,blocks:0,saved:0,pending:0}};}});
 await voice.start('synthetic-case');await tick();peer.channel.onmessage({data:JSON.stringify({type:'session.started'})});await tick();
 failStatus=true;await voice.refresh();assert.equal(track.stops,0);assert.equal(voice.snapshot().phase,'listening');
 failStatus=false;await voice.refresh();assert.equal(track.stops,0);assert.ok(checks>=3);
 const stopping=voice.stop();await tick();peer.channel.onmessage({data:JSON.stringify({type:'session.closed'})});await stopping;
});

test('basic voice enables microphone on session.started even if every history status request fails',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{mode:'basic',failStatus:true});
 await f.voice.start('synthetic-case');await tick();assert.equal(f.track.enabled,false);
 f.event({type:'session.started'});await tick();assert.equal(f.track.enabled,true);assert.equal(f.voice.snapshot().phase,'listening');
 for(let i=0;i<6;i++)await f.voice.refresh();
 assert.equal(f.track.stops,0);assert.equal(f.voice.snapshot().status_pending,true);
 assert.equal(f.calls.some(c=>c.url.endsWith('/close')),false);assert.equal(f.peer.channel.sent.length,0);
 f.voice.interrupt();assert.equal(f.peer.channel.sent.length,1);assert.equal(f.peer.channel.sent[0].type,'session.instructions.append');
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});
test('remote audio without streams is attached from the actual incoming track',async()=>{
 class Stream{constructor(tracks){this.tracks=tracks;}}
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{mode:'basic',Stream});
 await f.voice.start('synthetic-case');const incoming={kind:'audio'};f.peer.ontrack({streams:[],track:incoming});
 assert.deepEqual(f.audio.srcObject.tracks,[incoming]);assert.equal(f.audio.playsInline,true);
 f.event({type:'session.started'});await tick();assert.equal(f.track.enabled,true);assert.equal(f.voice.snapshot().mode,'basic');
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});

test('operative voice starts on session.started while context is unavailable and status is failing',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{mode:'operativo',failStatus:true});
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 assert.equal(f.track.enabled,true);assert.equal(f.voice.snapshot().phase,'listening');
 for(let i=0;i<5;i++)await f.voice.refresh();
 assert.equal(f.track.stops,0);assert.equal(f.calls.some(c=>c.url.endsWith('/close')),false);
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});

test('recovering the case uses the original authenticated voice session and leaves the microphone active',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{mode:'operativo'});
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 await f.voice.retryContext();const call=f.calls.find(c=>c.url.endsWith('/context-retry'));
 assert.deepEqual(JSON.parse(call.options.body),{session_id:'live:opaque/session'});assert.ok(call.options.headers.Authorization);
 assert.equal(f.track.enabled,true);assert.equal(f.track.stops,0);assert.equal(f.peer.channel.sent.length,0);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});

test('blocked playback can be resumed by a gesture without another Live session',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.audio.play=async()=>{throw Object.assign(Error('blocked'),{name:'NotAllowedError'});};
 f.peer.ontrack({streams:[{}]});await tick();
 assert.equal(f.voice.snapshot().playback_blocked,true);assert.equal(f.track.enabled,true);
 f.audio.play=async()=>{};assert.equal(await f.voice.playAudio(),true);
 assert.equal(f.voice.snapshot().playback_blocked,false);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});
test('late playback rejection cannot change a subsequent session',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);let reject;
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.audio.play=()=>new Promise((_,r)=>{reject=r;});f.peer.ontrack({streams:[{}]});
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
 await f.voice.start('synthetic-case');reject(Error('old rejection'));await tick();
 assert.equal(f.voice.snapshot().playback_blocked,false);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});
test('startup is bounded even when all status requests fail before session.started',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{failStatus:true,startTimeout:5,closeTimeout:5});
 await f.voice.start('synthetic-case');
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(f.voice.snapshot().phase,'idle');assert.equal(f.voice.snapshot().finalized,false);
 assert.equal(f.voice.snapshot().incomplete,true);assert.equal(f.track.stops,1);
});
test('double start and context retry do not create duplicate sessions or concurrent requests',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 const first=f.voice.start('synthetic-case');assert.equal(await f.voice.start('synthetic-case'),false);await first;
 f.event({type:'session.started'});await tick();
 const retry=f.voice.retryContext();assert.equal(await f.voice.retryContext(),false);await retry;
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/context-retry')).length,1);
 assert.equal(f.voice.snapshot().context_retry_pending,false);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});
test('explicit Escúchame activates the microphone while pausing remote playback',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.voice.mute();f.voice.interrupt();
 assert.equal(f.track.enabled,true);assert.equal(f.audio.muted,true);assert.match(f.voice.snapshot().notice,/sonido está pausado/);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});
test('UX keeps voice, authorized tools and durable history independent',async()=>{
 const {voiceView}=await import('../despacho3d/voice-view.mjs');
 let v=voiceView({phase:'starting',context_phase:'preparing'});
 assert.equal(v.title,'Conectando voz');assert.doesNotMatch(v.context,/Puedes hablar/);
 v=voiceView({phase:'listening',context_phase:'unavailable',pending:2,blocks:2,saved:0});
 assert.equal(v.title,'Listo para hablar');assert.match(v.context,/aún no/);assert.match(v.history,/pendiente/);
 v=voiceView({phase:'idle',finalized:true,blocks:2,saved:1,pending:1});
 assert.doesNotMatch(v.history,/Conversación respaldada/);
 v=voiceView({phase:'idle',finalized:true,blocks:2,saved:2,pending:0,incomplete:true});
 assert.doesNotMatch(v.history,/Conversación respaldada/);
 v=voiceView({phase:'idle',finalized:true,blocks:2,saved:2,pending:0});
 assert.match(v.history,/Conversación respaldada/);
 v=voiceView({phase:'listening',context_phase:'ready',tools_ready:false});
 assert.doesNotMatch(v.context,/Expediente conectado/);
});

test('Escúchame silences output immediately, keeps input and work alive, correlates acknowledgement and resumes',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');
 f.event({type:'session.started'});await tick();f.voice.mute();assert.equal(f.track.enabled,false);
 assert.equal(f.voice.interrupt(),true);assert.equal(f.audio.muted,true);assert.equal(f.track.enabled,true);
 assert.equal(f.voice.snapshot().output_paused,true);assert.equal(f.peer.closed,false);
 const command=f.peer.channel.sent.at(-1);
 assert.equal(command.type,'session.instructions.append');assert.equal(command.delegation_id,null);
 assert.equal(f.calls.some(c=>c.url.endsWith('/close')),false);
 assert.equal(f.voice.interrupt(),false,'double click cannot duplicate the instruction');
 f.event({type:'session.instructions.appended',client_event_id:'another'});assert.equal(f.voice.snapshot().interruption_pending,true);
 f.event({type:'session.instructions.appended',client_event_id:command.event_id});assert.equal(f.voice.snapshot().interruption_pending,false);
 assert.equal(f.audio.muted,true,'instruction acceptance never claims playback completion');
 assert.equal(f.voice.resumeAudio(),true);assert.equal(f.audio.muted,false);
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
 assert.equal(f.voice.snapshot().output_paused,false);
});

test('missing audio reports a recoverable error before asking for microphone or credentials',async()=>{
 const {createLiveVoice}=await load();let captures=0,mints=0;
 const voice=createLiveVoice({Peer:class{},media:{getUserMedia:async()=>{captures++;}},mint:async()=>{mints++;}});
 assert.equal(await voice.start('synthetic-case'),false);
 assert.equal(voice.snapshot().phase,'error');
 assert.match(voice.snapshot().notice,/no admite voz/);
 assert.equal(captures,0);assert.equal(mints,0);
 assert.equal(await voice.start('synthetic-case'),false,'retry also reports a handled error');
});
test('correlated interruption rejection stays visible without unmuting output or hanging up',async()=>{
 const {createLiveVoice}=await load();
 for(const format of ['nested-client','top-client','nested-event']){
  const f=fixture(createLiveVoice);await f.voice.start('synthetic-case');
  f.event({type:'session.started'});await tick();f.voice.interrupt();
  const id=f.peer.channel.sent.at(-1).event_id;
  f.event({type:'error',error:{client_event_id:'another-command'}});
  assert.equal(f.voice.snapshot().interruption_pending,true,'an unrelated rejection cannot settle Escúchame');
  f.event(format==='nested-client'?{type:'error',error:{client_event_id:id}}:
   format==='top-client'?{type:'error',client_event_id:id}:{type:'error',error:{event_id:id}});
  assert.equal(f.voice.snapshot().interruption_pending,false,format);
  assert.match(f.voice.snapshot().notice,/No se confirmó la instrucción de escuchar/,format);
  assert.equal(f.voice.snapshot().output_paused,true);assert.equal(f.audio.muted,true);
  assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.track.enabled,true);
  assert.equal(f.calls.some(c=>c.url.endsWith('/close')),false);
  assert.equal(f.voice.resumeAudio(),true);assert.equal(f.audio.muted,false);
  const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
 }
});

test('session.started received during reconnection enables input when the same peer reconnects',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');
 assert.equal(f.track.enabled,false);
 f.peer.connectionState='disconnected';f.peer.onconnectionstatechange();
 f.event({type:'session.started'});
 assert.equal(f.voice.snapshot().phase,'reconnecting');assert.equal(f.track.enabled,false);
 f.peer.connectionState='connected';f.peer.onconnectionstatechange();
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.track.enabled,true);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1,'recovery never creates a second session');
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});

test('peer reconnection preserves the microphone mute chosen by the user',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();f.voice.mute();
 f.peer.connectionState='disconnected';f.peer.onconnectionstatechange();
 f.peer.connectionState='connected';f.peer.onconnectionstatechange();
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.voice.snapshot().muted,true);
 assert.equal(f.track.enabled,false);assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});

test('peer reconnect events during finalization cannot reactivate input or leave closing',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 const end=f.voice.stop();await tick();
 f.peer.connectionState='disconnected';f.peer.onconnectionstatechange();
 f.peer.connectionState='connected';f.peer.onconnectionstatechange();
 assert.equal(f.voice.snapshot().phase,'closing');assert.equal(f.track.enabled,false);
 assert.equal(f.peer.closed,false);assert.equal(f.track.stops,0);
 f.event({type:'session.closed'});await end;
 assert.equal(f.voice.snapshot().finalized,true);assert.equal(f.track.stops,1);
});

test('rejected temporary voice credential is minted again only on an explicit retry',async()=>{
 const {createLiveVoice}=await load();let mints=0,attempts=0;
 const f=fixture(createLiveVoice,{
  mintOverride:async({case_id})=>({ok:true,case_id,token:'A'.repeat(29)+(++mints)+'.'+'a'.repeat(64),
   endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000}),
  sessionOverride:async()=>++attempts===1?{ok:false,status:401,json:async()=>({ok:false,error:'unauthorized'})}:null
 });
 assert.equal(await f.voice.start('synthetic-case'),false);await tick();
 assert.equal(f.voice.snapshot().phase,'error');assert.equal(mints,1);assert.equal(attempts,1);
 assert.equal(await f.voice.start('synthetic-case'),true);assert.equal(mints,2);assert.equal(attempts,2);
 const requests=f.calls.filter(c=>c.url.endsWith('/session'));
 assert.notEqual(requests[0].options.headers.Authorization,requests[1].options.headers.Authorization);
 f.event({type:'session.started'});const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});

test('late rejection from a cancelled case cannot discard the new case temporary credential',async()=>{
 const {createLiveVoice}=await load();let rejectOld;const minted=[];
 const f=fixture(createLiveVoice,{
  mintOverride:async({case_id})=>{minted.push(case_id);return {ok:true,case_id,token:'A'.repeat(29)+minted.length+'.'+'a'.repeat(64),
   endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000};},
  sessionOverride:async()=>minted.length===1?new Promise(resolve=>{rejectOld=resolve;}):null
 });
 const old=f.voice.start('case-a');await tick();await f.voice.stop();
 assert.equal(await f.voice.prepare('case-b'),true);
 rejectOld({ok:false,status:401,json:async()=>({ok:false,error:'unauthorized'})});assert.equal(await old,false);
 assert.equal(f.voice.snapshot().phase,'idle');
 assert.equal(await f.voice.start('case-b'),true);assert.deepEqual(minted,['case-a','case-b']);
 f.event({type:'session.started'});const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});

test('a stalled signalling request expires visibly without creating another Live session',async()=>{
 const {createLiveVoice}=await load();let signals=0;
 const f=fixture(createLiveVoice,{signallingTimeout:5,sessionOverride:async(_url,options)=>
  new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{
   signals++;reject(Object.assign(Error('aborted'),{name:'AbortError'}));
  },{once:true}))
 });
 assert.equal(await f.voice.start('synthetic-case'),false);
 assert.equal(f.voice.snapshot().phase,'error');assert.match(f.voice.snapshot().notice,/no respondió a tiempo/);
 assert.equal(signals,1);assert.equal(f.track.stops,1);assert.equal(f.peer.closed,true);
 await new Promise(resolve=>setTimeout(resolve,15));
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 assert.equal(f.calls.some(c=>c.url.endsWith('/close')),false,'no opaque session ID was received');
});

test('explicit cancellation of signalling retains its outcome after the connection deadline',async()=>{
 const {createLiveVoice}=await load();let signals=0;
 const f=fixture(createLiveVoice,{signallingTimeout:50,sessionOverride:async(_url,options)=>
  new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{
   signals++;reject(Object.assign(Error('aborted'),{name:'AbortError'}));
  },{once:true}))
 });
 const starting=f.voice.start('synthetic-case');await tick();await f.voice.stop();
 assert.equal(await starting,false);const notice=f.voice.snapshot().notice;
 await new Promise(resolve=>setTimeout(resolve,70));
 assert.equal(f.voice.snapshot().phase,'idle');assert.equal(f.voice.snapshot().notice,notice);
 assert.equal(signals,1);assert.equal(f.track.stops,1);assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
});

test('observer-confirmed session.started reconciles primary event loss without resending startup',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice,{statusOverride:()=>({started:true})});
 await f.voice.start('synthetic-case');await tick();
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.track.enabled,true);
 assert.equal(f.peer.channel.sent.length,0);assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 f.voice.mute();await f.voice.refresh();assert.equal(f.track.enabled,false,'observer confirmation cannot undo manual mute');
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});
test('observer confirmation waits for an open connected transport and rejects expired state',async()=>{
 const {createLiveVoice}=await load();let status={started:false};const f=fixture(createLiveVoice,{statusOverride:()=>status});
 await f.voice.start('synthetic-case');await tick();
 f.peer.connectionState='connecting';status={started:true};await f.voice.refresh();
 assert.equal(f.track.enabled,false);f.peer.connectionState='connected';f.peer.channel.readyState='connecting';await f.voice.refresh();
 assert.equal(f.track.enabled,false);f.peer.channel.readyState='open';await f.voice.refresh();
 assert.equal(f.track.enabled,true);const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
 const g=fixture(createLiveVoice,{closeTimeout:5,statusOverride:()=>({started:true,expires_at:1})});
 await g.voice.start('synthetic-case');await tick();assert.equal(g.track.enabled,false);await g.voice.stop();
});
test('a late observer confirmation while closing cannot re-enable the microphone',async()=>{
 const {createLiveVoice}=await load();let confirmed=false;
 const f=fixture(createLiveVoice,{statusOverride:()=>({started:confirmed})});await f.voice.start('synthetic-case');await tick();
 const end=f.voice.stop();confirmed=true;await f.voice.refresh();assert.equal(f.track.enabled,false);assert.equal(f.voice.snapshot().phase,'closing');
 f.event({type:'session.closed'});await end;
});

test('nearby preparation reuses ICE and offer without capture or a provider session',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.prepare('case-a',{connection:true});await tick();
 const prepared=f.peer;
 assert.equal(f.captures,0);assert.equal(f.calls.filter(c=>c.url.endsWith('/voice/session')).length,0);
 assert.equal(prepared.offers,1);assert.equal(prepared.sender.track,null);
 await f.voice.start('case-a');assert.equal(f.peer,prepared);assert.equal(f.peer.offers,1);
 assert.equal(f.peer.sender.track,f.track);assert.equal(f.track.enabled,false);
 f.event({type:'session.started'});assert.equal(f.track.enabled,true);
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
});
test('nearby preparation is discarded before using a different project',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.prepare('case-a',{connection:true});await tick();const first=f.peer;
 await f.voice.prepare('case-b',{connection:true});await tick();assert.equal(first.closed,true);
 const second=f.peer;f.voice.discardPreparation();assert.equal(second.closed,true);assert.equal(f.captures,0);
});

test('local overlap preserves the same session, manual pause and final audio transport',async()=>{
 const {createLiveVoice}=await load();let options,disposed=0;
 const f=fixture(createLiveVoice,{monitorFactory:o=>{options=o;return{resume(){},close(){disposed++;o.onActivity(false);}};}});
 await f.voice.start('synthetic-case');assert.equal(options,undefined);
 f.event({type:'session.started'});await tick();assert.equal(options.enabled(),true);
 options.onActivity(true);assert.equal(f.audio.muted,true);assert.equal(f.track.enabled,true);
 assert.equal(f.peer.channel.sent.length,0);assert.equal(f.voice.snapshot().local_speaking,true);
 f.voice.interrupt();options.onActivity(false);assert.equal(f.audio.muted,true,'manual pause wins');
 options.onActivity(true);f.voice.resumeAudio();assert.equal(f.audio.muted,true,'resuming manual pause keeps current overlap protection');
 options.onActivity(false);assert.equal(f.audio.muted,false);
 f.voice.mute();assert.equal(options.enabled(),false);f.voice.mute();
 const stopping=f.voice.stop();await tick();assert.equal(disposed,1);assert.equal(f.audio.muted,true);
 assert.equal(f.track.stops,0);assert.equal(f.peer.closed,false);
 f.event({type:'session.closed'});await stopping;assert.equal(f.track.stops,1);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
});
test('connection milestones are cumulative, reset per call and do not contain case or credential data',async()=>{
 const {createLiveVoice}=await load();let clock=1000;
 const f=fixture(createLiveVoice,{now:()=>clock});
 await f.voice.start('synthetic-case');clock=1500;f.event({type:'session.started'});await tick();
 const times=f.voice.snapshot().timings;
 assert.equal(times.microphone_ms,0);assert.equal(times.access_ms,0);
 assert.equal(times.offer_ms,0);assert.equal(times.signalling_ms,0);assert.equal(times.listening_ms,500);
 assert.ok(Object.values(times).every(v=>typeof v==='number'));
 const stopping=f.voice.stop();await tick();f.event({type:'session.closed'});await stopping;
 clock=2000;await f.voice.start('synthetic-case');assert.equal(f.voice.snapshot().timings.listening_ms,undefined);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});

test('Escuchame works before signalling resolves and the late remote track stays silent',async()=>{
 const {createLiveVoice}=await load();let resolveSession;
 const f=fixture(createLiveVoice,{sessionOverride:()=>new Promise(resolve=>{resolveSession=resolve;})});
 const starting=f.voice.start('synthetic-case');await tick();
 assert.equal(f.voice.interrupt(),true);assert.equal(f.audio.muted,true);
 assert.equal(f.track.enabled,false,'do not transmit input before session.started');
 assert.equal(f.peer.channel.sent.length,0,'defer runtime instruction until session.started');
 resolveSession({ok:true,json:async()=>({ok:true,session:{id:'opaque'},transport:{sdp:'v=0\r\nanswer'}})});
 await starting;f.peer.ontrack({streams:[{}]});
 assert.equal(f.audio.muted,true);f.event({type:'session.started'});await tick();
 assert.equal(f.track.enabled,true);assert.equal(f.audio.muted,true);assert.equal(f.peer.channel.sent.length,1);
 f.peer.connectionState='disconnected';f.peer.onconnectionstatechange();
 f.voice.resumeAudio();assert.equal(f.voice.interrupt(),true);assert.equal(f.audio.muted,true);
 f.peer.connectionState='connected';f.peer.onconnectionstatechange();assert.equal(f.audio.muted,true);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});
test('stop silences immediately but keeps final transcripts and remote transport until closed',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 const end=f.voice.stop();assert.equal(f.audio.muted,true);assert.equal(f.peer.closed,false);
 f.peer.ontrack({streams:[{}]});assert.equal(f.audio.muted,true);
 f.event({type:'session.output_transcript.delta',delta:'final',start_ms:1,end_ms:2});
 assert.equal(f.captions.at(-1).delta,'final');await tick();f.event({type:'session.closed'});await end;
});
test('concurrent preparation shares readiness and expired authorization cannot return from a discarded flight',async()=>{
 const {createLiveVoice}=await load();let resolveMint;const f=fixture(createLiveVoice,{
  mintOverride:({case_id})=>new Promise(resolve=>{resolveMint=()=>resolve({ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000});})
 });
 const a=f.voice.prepare('case-a',{connection:true}),b=f.voice.prepare('case-a',{connection:true});await tick();
 f.voice.discardPreparation();resolveMint();assert.equal(await a,false);assert.equal(await b,false);
 assert.equal(f.calls.length,0,'discarded access never warms the backend');assert.equal(f.captures,0);
 const g=fixture(createLiveVoice);await Promise.all([g.voice.prepare('case-a'),g.voice.prepare('case-a')]);
 assert.equal(g.calls.filter(c=>c.url.endsWith('/voice/ready')).length,1);g.voice.discardPreparation();
});
test('a PPP loaded before voice is sent once when context becomes ready, with case isolation',async()=>{
 const {createLiveVoice}=await load();let contextReady=false;
 const f=fixture(createLiveVoice,{statusOverride:()=>({context_ready:contextReady})});
 assert.equal(await f.voice.notifyBoard('r1','case-a'),false);
 await f.voice.start('case-a');f.event({type:'session.started'});await tick();
 assert.equal(f.calls.filter(c=>c.url.endsWith('/board-change')).length,0);
 contextReady=true;await f.voice.refresh();await tick();
 assert.equal(f.calls.filter(c=>c.url.endsWith('/board-change')).length,1);
 await f.voice.refresh();await tick();assert.equal(f.calls.filter(c=>c.url.endsWith('/board-change')).length,1);
 await f.voice.notifyBoard('other-revision','case-b');await f.voice.refresh();
 assert.equal(f.calls.filter(c=>c.url.endsWith('/board-change')).length,1);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});

test('PPP confirmation changes at the same revision reach voice without replaying an acknowledged notification',async()=>{
 const {createLiveVoice}=await load();let clock=1000;
 const f=fixture(createLiveVoice,{now:()=>clock,statusOverride:()=>({context_ready:true})});
 await f.voice.start('case-a');f.event({type:'session.started'});await tick();
 await f.voice.notifyBoard('r1','case-a');await tick();
 assert.equal(f.calls.filter(c=>c.url.endsWith('/board-change')).length,1);
 // Workspace emits again when confirmed/pending changes even without a new revision.
 await f.voice.notifyBoard('r1','case-a');clock+=5001;await f.voice.refresh();await tick();
 assert.equal(f.calls.filter(c=>c.url.endsWith('/board-change')).length,2);
 clock+=5001;await f.voice.refresh();await tick();
 assert.equal(f.calls.filter(c=>c.url.endsWith('/board-change')).length,2);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});

test('local intervention after agent output sends one listening instruction without another session or startup configuration',async()=>{
 const {createLiveVoice}=await load();let monitor;
 const f=fixture(createLiveVoice,{monitorFactory:o=>{monitor=o;return{resume(){},close(){o.onActivity(false);}};}});
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 monitor.onActivity(true);assert.equal(f.peer.channel.sent.length,0,'ordinary input does not invent agent speech');
 monitor.onActivity(false);
 f.event({type:'session.output_transcript.delta',delta:' respuesta ',start_ms:10,end_ms:30,event_id:'out-overlap'});
 monitor.onActivity(true);
 assert.equal(f.audio.muted,true,'local silence precedes the provider acknowledgement');
 assert.equal(f.track.enabled,true);
 const sent=f.peer.channel.sent;assert.equal(sent.length,1);assert.equal(sent[0].type,'session.instructions.append');
 assert.match(sent[0].event_id,/^overlap-/);assert.match(sent[0].content,/no es una transcripción/);
 monitor.onActivity(true);monitor.onActivity(false);monitor.onActivity(true);
 assert.equal(sent.length,1,'one acoustic onset does not repeatedly interrupt the same output');
 f.event({type:'session.instructions.appended',client_event_id:sent[0].event_id});
 assert.equal(f.voice.snapshot().interruption_error,false);
 f.event({type:'session.input_transcript.delta',delta:'espera',start_ms:40,end_ms:50,event_id:'user-overlap'});
 monitor.onActivity(false);assert.equal(f.audio.muted,false);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});
test('a rejected automatic listening instruction stays explainable and never ends the call',async()=>{
 const {createLiveVoice}=await load();let monitor;
 const f=fixture(createLiveVoice,{monitorFactory:o=>{monitor=o;return{resume(){},close(){}};}});
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.event({type:'session.output_transcript.delta',delta:'respuesta',start_ms:0,end_ms:20,event_id:'output'});
 monitor.onActivity(true);const id=f.peer.channel.sent[0].event_id;
 f.event({type:'error',error:{client_event_id:id}});
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.voice.snapshot().interruption_error,true);
 assert.match(f.voice.snapshot().notice,/Escúchame/);assert.equal(f.audio.muted,true);assert.equal(f.peer.closed,false);
 f.voice.interrupt();const manual=f.peer.channel.sent.at(-1).event_id;
 f.event({type:'session.instructions.appended',client_event_id:manual});
 assert.equal(f.voice.snapshot().interruption_error,false);
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});
test('a newly connected peer immediately reconciles a missing primary start event',async()=>{
 const {createLiveVoice}=await load();let reads=0;
 const f=fixture(createLiveVoice,{statusOverride:()=>({started:++reads>1})});
 await f.voice.start('synthetic-case');await tick();
 assert.equal(reads,1);assert.equal(f.track.enabled,false);
 f.peer.onconnectionstatechange();await tick();
 assert.equal(reads,2,'does not wait for the next periodic status check');
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.track.enabled,true);
 assert.equal(f.peer.channel.sent.length,0,'no startup configuration is repeated');
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});
test('a provider-initiated confirmed close retains captions and explains why voice ended',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.event({type:'session.input_transcript.delta',delta:'texto exacto  ',start_ms:1,end_ms:9,event_id:'kept'});
 f.event({type:'session.closed'});await tick();await tick();
 assert.equal(f.voice.snapshot().phase,'idle');assert.equal(f.voice.snapshot().ended_remotely,true);
 assert.match(f.voice.snapshot().notice,/terminó desde el servicio/);assert.equal(f.captions[0].delta,'texto exacto  ');
 assert.equal(f.voice.snapshot().finalized,true);
 await f.voice.start('synthetic-case');assert.equal(f.voice.snapshot().ended_remotely,false);
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});

test('late acoustic acknowledgement cannot hide a rejected newer manual listening instruction',async()=>{
 const {createLiveVoice}=await load();let monitor;
 const f=fixture(createLiveVoice,{monitorFactory:o=>{monitor=o;return{resume(){},close(){}};}});
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.event({type:'session.output_transcript.delta',delta:'respuesta',start_ms:0,end_ms:20,event_id:'old-output'});
 monitor.onActivity(true);const acoustic=f.peer.channel.sent[0].event_id;
 f.voice.interrupt();const manual=f.peer.channel.sent.at(-1).event_id;
 f.event({type:'error',error:{client_event_id:manual}});
 assert.equal(f.voice.snapshot().interruption_error,true);
 f.event({type:'session.instructions.appended',client_event_id:acoustic});
 assert.equal(f.voice.snapshot().interruption_error,true,'older receipt cannot certify a newer rejected instruction');
 assert.equal(f.audio.muted,true);assert.equal(f.voice.snapshot().phase,'listening');
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});

test('a local send failure leaves a visible listening error while audio stays paused and the call remains open',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.peer.channel.send=()=>{throw Error('synthetic send failure');};
 assert.equal(f.voice.interrupt(),true);
 assert.equal(f.voice.snapshot().interruption_error,true);
 assert.match(f.voice.snapshot().notice,/No se pudo enviar/);
 assert.equal(f.audio.muted,true);assert.equal(f.track.enabled,true);assert.equal(f.voice.snapshot().phase,'listening');
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});

test('presentation narration is bounded to the active case and connected session',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice),slide={case_id:'synthetic-case',title:'Tema',script:'Resultado con fuente. Falta revisar.',goal_id:'g1',revision:'r1'};
 assert.equal(f.voice.presentSlide(slide),false);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 assert.equal(f.voice.presentSlide({...slide,case_id:'other'}),false);
 assert.equal(f.voice.presentSlide({...slide,script:'x'.repeat(5001)}),false);
 assert.equal(f.voice.presentSlide(slide),true);
 const sent=f.peer.channel.sent.at(-1);assert.equal(sent.type,'session.instructions.append');assert.match(sent.content,/no como instrucciones/);assert.match(sent.content,/Resultado con fuente/);
 assert.equal(f.voice.interrupt(),true);assert.equal(f.audio.muted,true);
 const stopping=f.voice.stop();await tick();assert.equal(f.voice.presentSlide(slide),false);f.event({type:'session.closed'});await stopping;
});


function renewableToken(caseId,time,index=1){return {ok:true,case_id:caseId,token:'R'.repeat(29)+index+'.'+'a'.repeat(64),endpoint:'https://synthetic-engine.onrender.com',expires_at:time+600000};}
test('a long prewarm cannot start a new voice conversation with only seventy seconds of access',async()=>{
 const {createLiveVoice}=await load();let time=1000000,mints=0;
 const f=fixture(createLiveVoice,{now:()=>time,mintOverride:async({case_id})=>renewableToken(case_id,time,++mints),
  statusOverride:()=>({expires_at:time+600000})});
 assert.equal(await f.voice.prepare('case-a'),true);time+=530000;
 assert.equal(await f.voice.start('case-a'),true);assert.equal(mints,2);
 assert.equal(f.captures,1);assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});
test('voice renews a case-bound credential before expiry without replacing its session or microphone',async()=>{
 const {createLiveVoice}=await load();let time=1000000,mints=0;
 const f=fixture(createLiveVoice,{now:()=>time,mintOverride:async({case_id})=>renewableToken(case_id,time,++mints),
  statusOverride:()=>({started:true,expires_at:time+600000,max_expires_at:1900000})});
 await f.voice.start('case-a');await tick();const peer=f.peer,initial=f.calls.find(c=>c.url.endsWith('/session')).options.headers.Authorization;
 time+=481000;await Promise.all([f.voice.refresh(),f.voice.refresh()]);await tick();await f.voice.refresh();
 assert.equal(mints,2);assert.equal(f.voice.snapshot().phase,'listening');
 assert.equal(f.peer,peer);assert.equal(f.captures,1);assert.equal(f.track.stops,0);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 const latest=f.calls.filter(c=>c.url.endsWith('/status')).at(-1);
 assert.notEqual(latest.options.headers.Authorization,initial);
 assert.equal(JSON.parse(latest.options.body).session_id,'live:opaque/session');
 assert.equal(f.voice.snapshot().credential_pending,false);
 time=1850000;await f.voice.refresh();assert.equal(f.voice.snapshot().session_ending,true);
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});
test('a slow or temporarily failed credential renewal is coalesced and leaves healthy audio connected',async()=>{
 const {createLiveVoice}=await load();let time=1000000,mints=0,rejectMint;
 const f=fixture(createLiveVoice,{now:()=>time,mintOverride:({case_id})=>{
  mints++;return mints===2?new Promise((_resolve,reject)=>{rejectMint=reject;}):Promise.resolve(renewableToken(case_id,time,mints));
 },statusOverride:()=>({started:true,expires_at:1600000})});
 await f.voice.start('case-a');await tick();time=1481000;
 await f.voice.refresh();await tick();await f.voice.refresh();assert.equal(mints,2);
 rejectMint(Error('timeout'));await tick();
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.voice.snapshot().credential_pending,true);
 assert.equal(f.track.stops,0);await f.voice.refresh();assert.equal(mints,2,'backoff avoids repeated authorization calls');
 time+=10001;await f.voice.refresh();await tick();await f.voice.refresh();
 assert.equal(mints,3);assert.equal(f.voice.snapshot().credential_pending,false);
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});
test('an authoritative renewal denial stops voice and cannot be hidden as a transient outage',async()=>{
 const {createLiveVoice}=await load();let time=1000000,mints=0;
 const f=fixture(createLiveVoice,{now:()=>time,mintOverride:async({case_id})=>++mints===1?renewableToken(case_id,time):{ok:false,error:'unauthorized'},
  statusOverride:()=>({started:true,expires_at:1600000})});
 await f.voice.start('case-a');await tick();time=1481000;await f.voice.refresh();await tick();
 assert.equal(f.voice.snapshot().phase,'closing');assert.equal(f.track.enabled,false);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/session')).length,1);
 f.event({type:'session.closed'});await tick();await tick();
 assert.equal(f.voice.snapshot().phase,'idle');assert.match(f.voice.snapshot().notice,/Tu acceso cambió/);
});
test('a malformed renewal for another case never reaches the current voice session',async()=>{
 const {createLiveVoice}=await load();let time=1000000,mints=0;
 const f=fixture(createLiveVoice,{now:()=>time,mintOverride:async({case_id})=>renewableToken(++mints===1?case_id:'case-b',time,mints),
  statusOverride:()=>({started:true,expires_at:1600000})});
 await f.voice.start('case-a');await tick();const first=f.calls[0].options.headers.Authorization;
 time=1481000;await f.voice.refresh();await tick();await f.voice.refresh();
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.voice.snapshot().credential_pending,true);
 assert.ok(f.calls.every(c=>c.options.headers.Authorization===first));
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});
test('a late credential renewal cannot attach to a later conversation for another case',async()=>{
 const {createLiveVoice}=await load();let time=1000000,mints=0,finishOld;
 const f=fixture(createLiveVoice,{now:()=>time,mintOverride:({case_id})=>{
  const n=++mints;return n===2?new Promise(resolve=>{finishOld=()=>resolve(renewableToken(case_id,time,n));}):Promise.resolve(renewableToken(case_id,time,n));
 },statusOverride:()=>({started:true,expires_at:time+600000})});
 await f.voice.start('case-a');await tick();time=1481000;await f.voice.refresh();await tick();
 const oldClose=f.voice.stop();await tick();f.event({type:'session.closed'});await oldClose;
 await f.voice.start('case-b');await tick();const latest=f.calls.filter(c=>c.url.endsWith('/session')).at(-1).options.headers.Authorization;
 finishOld();await tick();await f.voice.refresh();
 assert.equal(f.calls.filter(c=>c.url.endsWith('/status')).at(-1).options.headers.Authorization,latest);
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.captures,2);
 await f.voice.prepare('case-b');assert.equal(mints,3,'a late old-case mint cannot replace the new preparation');
 const close=f.voice.stop();await tick();f.event({type:'session.closed'});await close;
});

test('all residents prepare independently of blocked document routes and readiness requires its explicit receipt',async()=>{
 const {createLiveVoice}=await load();let captures=0,allow=true;const calls=[],mints=[];
 const voice=createLiveVoice({Peer:class{},media:{getUserMedia:async()=>{captures++;}},
  mint:async({case_id})=>{mints.push(case_id);return {ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000};},
  fetchImpl:async(url)=>{calls.push(url);assert.ok(url.endsWith('/voice/ready'),'preparation must never block on /fast/hello or document loading');return {ok:true,status:200,json:async()=>allow?{ok:true,available:true}:{ok:true}};}});
 for(const id of ['case-g','case-l','case-r']){voice.discardPreparation();assert.equal(await voice.prepare(id),true);}
 assert.deepEqual(mints,['case-g','case-l','case-r']);assert.equal(calls.length,3);assert.equal(captures,0);assert.equal(voice.snapshot().phase,'idle');
 voice.discardPreparation();allow=false;assert.equal(await voice.prepare('case-r'),false);
 voice.discardPreparation();
});

test('typed text uses the current Live session and checks uncertain delivery with the same request',async()=>{
 const {createLiveVoice}=await load();let accepted=false;
 const f=fixture(createLiveVoice,{messageOverride:data=>({ok:true,request_id:data.request_id,status:accepted?'accepted':'pending'})});
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 assert.equal(await f.voice.sendText('un dato escrito'),false);assert.equal(f.voice.snapshot().text_pending,true);
 assert.equal(await f.voice.sendText('otro texto'),false);
 accepted=true;assert.equal(await f.voice.sendText('un dato escrito'),true);
 const messages=f.calls.filter(c=>c.url.endsWith('/voice/message')).map(c=>JSON.parse(c.options.body));
 assert.equal(messages.length,2);assert.equal(messages[0].session_id,'live:opaque/session');assert.deepEqual(messages[0],messages[1]);
 assert.equal(f.voice.snapshot().phase,'listening');assert.equal(f.track.stops,0);assert.equal(f.voice.snapshot().text_pending,false);
 const p=f.voice.stop();await tick();f.event({type:'session.closed'});await p;
});
