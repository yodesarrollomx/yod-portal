'use strict';
// Synthetic protocol fixtures: no external API, real case or credentials.
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/live-voice.mjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(createLiveVoice,{closed=true,closeTimeout=50}={}){
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
 const voice=createLiveVoice({audio,Peer,closeTimeout,media:{getUserMedia:async()=>stream},
  schedule:()=>1,cancel:()=>{},onTranscript:f=>captions.push(f),
  mint:async({case_id})=>({ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),
   endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000}),
  fetchImpl:async(url,options)=>{
   calls.push({url,options});
   const value=url.endsWith('/session')?{ok:true,session:{id:'live:opaque/session'},transport:{type:'webrtc',sdp:'v=0\r\nanswer'}}:
    url.endsWith('/close')?{...base,active:false,finalized:closed,fragments:1,blocks:1,saved:closed?1:0,pending:closed?0:1,incomplete:!closed}:base;
   return {ok:true,json:async()=>value};
  }});
 const event=value=>peer.channel.onmessage({data:JSON.stringify(value)});
 return {voice,calls,captions,track,event,get peer(){return peer;}};
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
 g.peer.connectionState='disconnected';g.peer.onconnectionstatechange();await tick();
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
