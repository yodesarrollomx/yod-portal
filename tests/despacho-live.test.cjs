'use strict';
// Synthetic protocol fixtures: no external API, real case or credentials.
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/live-voice.mjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(createLiveVoice,{closed=true,closeTimeout=50,disconnectGrace=12000,maxStatusFailures=3,mode='expediente',failStatus=false,Stream,startTimeout=60000}={}){
 const calls=[],captions=[],track={enabled:true,stops:0,stop(){this.stops++;}},
   stream={getTracks:()=>[track],getAudioTracks:()=>[track]},
   audio={srcObject:null,pause(){},play:async()=>{}};
 let peer;
 class Peer{
  constructor(){peer=this;this.connectionState='connected';this.iceGatheringState='complete';this.closed=false;
   this.channel={readyState:'open',sent:[],send(raw){this.sent.push(JSON.parse(raw));},close(){this.closed=true;}};}
  createDataChannel(name){this.channelName=name;return this.channel;}
  addTrack(){} createOffer(){return Promise.resolve({type:'offer',sdp:'v=0\r\noffer'});}
  setLocalDescription(value){this.localDescription=value;return Promise.resolve();}
  setRemoteDescription(value){this.remoteDescription=value;return Promise.resolve();}
  close(){this.closed=true;}
 }
 const base={ok:true,active:true,started:true,context_ready:true,finalized:false,expires_at:Date.now()+600000,
  fragments:0,blocks:0,saved:0,pending:0,incomplete:false};
 const voice=createLiveVoice({audio,Peer,Stream,closeTimeout,disconnectGrace,maxStatusFailures,startTimeout,media:{getUserMedia:async()=>stream},
  schedule:()=>1,cancel:()=>{},onTranscript:f=>captions.push(f),
  mint:async({case_id})=>({ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),
   endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000}),
  fetchImpl:async(url,options)=>{
   calls.push({url,options});
   if(failStatus && url.endsWith('/status'))throw Error('record unavailable');
   const value=url.endsWith('/session')?{ok:true,mode,session:{id:'live:opaque/session'},transport:{type:'webrtc',sdp:'v=0\r\nanswer'}}:
    url.endsWith('/close')?{...base,active:false,finalized:closed,fragments:1,blocks:1,saved:closed?1:0,pending:closed?0:1,incomplete:!closed}:base;
   return {ok:true,json:async()=>value};
  }});
 const event=value=>peer.channel.onmessage({data:JSON.stringify(value)});
 return {voice,calls,captions,track,audio,event,get peer(){return peer;}};
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
  fetchImpl:async(url)=>{calls.push(url);return {ok:true,status:200};}});
 assert.equal(await voice.prepare('synthetic-case'),true);assert.equal(await voice.prepare('synthetic-case'),true);
 assert.equal(mints,1);assert.equal(captures,0);assert.deepEqual(calls,['https://synthetic-engine.onrender.com/fast/hello','https://synthetic-engine.onrender.com/fast/hello']);
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
 f.voice.interrupt();assert.equal(f.peer.channel.sent.length,0);
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
test('interruption guidance respects a muted microphone',async()=>{
 const {createLiveVoice}=await load(),f=fixture(createLiveVoice);
 await f.voice.start('synthetic-case');f.event({type:'session.started'});await tick();
 f.voice.mute();f.voice.interrupt();
 assert.equal(f.track.enabled,false);assert.match(f.voice.snapshot().notice,/Activa el micrófono/);
 const end=f.voice.stop();await tick();f.event({type:'session.closed'});await end;
});
test('UX keeps voice, authorized tools and durable history independent',async()=>{
 const {voiceView}=await import('../despacho3d/voice-view.mjs');
 let v=voiceView({phase:'starting',context_phase:'preparing'});
 assert.equal(v.title,'Conectando con Gastón');assert.doesNotMatch(v.context,/Puedes hablar/);
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
