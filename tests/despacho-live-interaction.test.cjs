'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({contextReady=true}={}){
 const {createLiveVoice}=await import('../despacho3d/live-voice.mjs');
 let peer,allowed=true,session=0;const calls=[],track={enabled:true,stop(){}},stream={getTracks:()=>[track],getAudioTracks:()=>[track]};
 class Peer{
  constructor(){peer=this;this.connectionState='connected';this.iceGatheringState='complete';this.channel={readyState:'open',sent:[],send(raw){this.sent.push(JSON.parse(raw));},close(){this.readyState='closed';}};}
  createDataChannel(){return this.channel;}addTrack(){}createOffer(){return Promise.resolve({type:'offer',sdp:'v=0\r\noffer'});}setLocalDescription(value){this.localDescription=value;return Promise.resolve();}setRemoteDescription(){return Promise.resolve();}close(){}
 }
 const voice=createLiveVoice({audio:{play:async()=>{},pause(){}},Peer,media:{getUserMedia:async()=>stream},schedule:()=>1,cancel(){},closeTimeout:5,canOperate:()=>allowed,
  mint:async({case_id})=>({ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000}),
  fetchImpl:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});const base={ok:true,active:true,started:false,context_ready:contextReady,finalized:false,expires_at:Date.now()+600000,fragments:0,blocks:0,saved:0,pending:0,incomplete:false};
   return{ok:true,json:async()=>url.endsWith('/voice/ready')?{ok:true,available:true}:url.endsWith('/session')?{ok:true,mode:'expediente',session:{id:'synthetic-session-'+(++session)},transport:{type:'webrtc',sdp:'v=0\r\nanswer'}}:url.endsWith('/close')?{...base,active:false,finalized:true}:base};}});
 return{voice,calls,get peer(){return peer;},revoke(){allowed=false;},event(value){peer.channel.onmessage({data:JSON.stringify(value)});},async start(){await voice.start('synthetic-case');await tick();this.event({type:'session.started'});await tick();}};
}
function action({kind='navigate_plan',state='confirmed',section_id='dVentas'}={}){
 const context={case_id:'synthetic-case',board_case_id:'synthetic-board',scenario_id:'scenario-1',revision:'r1'};
 const value={action_id:'interaction-1',kind,state,tab:'ppp',section_id,context,source:'voice',request_id:null,evidence:[]};
 if(state==='confirmed'||kind==='change_request')value.evidence=[{kind:'navigation',action_id:value.action_id,observed:{...context,tab:'ppp',section_id}}];
 return value;
}
const interactionMessages=f=>f.peer.channel.sent.filter(item=>item.event_id?.startsWith('interaction-'));
const projection=message=>JSON.parse(message.content.split('Datos de interfaz: ')[1]);
test('feedback requires a live authorized session with ready context and matching case',async()=>{
 const f=await fixture();assert.equal(f.voice.notifyInteraction(action()),false);
 await f.voice.start('synthetic-case');assert.equal(f.voice.notifyInteraction(action()),false);f.event({type:'session.started'});await tick();
 const foreign=action();foreign.context.case_id='other';assert.equal(f.voice.notifyInteraction(foreign),false);
 f.revoke();assert.equal(f.voice.notifyInteraction(action()),false);assert.equal(interactionMessages(f).length,0);await f.voice.stop();
 const g=await fixture({contextReady:false});await g.start();assert.equal(g.voice.notifyInteraction(action()),false);await g.voice.stop();
});
test('feedback uses only the existing data channel and strips source prose and injected fields',async()=>{
 const f=await fixture();await f.start();const value=action();value.text='RAW_USER_SECRET';value.summary='RAW_SUMMARY_SECRET';value.next='RAW_NEXT_SECRET';value.context.token='SECRET_TOKEN';value.evidence[0].observed.instructions='RAW_DOCUMENT_ORDER';
 const requests=f.calls.length;assert.equal(f.voice.notifyInteraction(value),true);assert.equal(f.calls.length,requests);
 const message=interactionMessages(f)[0];assert.equal(message.type,'session.instructions.append');assert.equal(message.delegation_id,null);
 assert.doesNotMatch(message.content,/RAW_|SECRET_TOKEN/);assert.match(message.content,/no determina cuántas recámaras/);assert.match(message.content,/no es un acuse de guardado/);
 const data=projection(message);assert.equal(data.navigation_confirmed,true);assert.equal(data.mutation_confirmed,false);assert.equal(data.evidence[0].observed.section_id,'dVentas');await f.voice.stop();
});
test('identical feedback is deduplicated per session, while new states and new sessions can send',async()=>{
 const f=await fixture();await f.start();const value=action();assert.equal(f.voice.notifyInteraction(value),true);assert.equal(f.voice.notifyInteraction(structuredClone(value)),false);
 assert.equal(f.voice.notifyInteraction({...value,state:'uncertain'}),true);assert.equal(interactionMessages(f).length,2);await f.voice.stop();
 await f.start();assert.equal(f.voice.notifyInteraction(value),true);assert.equal(interactionMessages(f).length,1);await f.voice.stop();
});
test('navigation cannot certify a mutation, and pending volume editors remain drafts',async()=>{
 const f=await fixture();await f.start();assert.equal(f.voice.notifyInteraction(action({kind:'change_request'})),false);
 assert.equal(f.voice.notifyInteraction(action({kind:'change_request',state:'pending',section_id:'dVolumenes'})),true);
 const message=interactionMessages(f)[0],data=projection(message);assert.equal(data.draft_only,true);assert.equal(data.navigation_confirmed,true);assert.equal(data.mutation_confirmed,false);assert.match(message.content,/no cambia las cantidades/);await f.voice.stop();
});
test('a mutation claim requires the original request and matching case board scenario plus a new revision',async()=>{
 const f=await fixture();await f.start();const value=action({kind:'change_request'});value.request_id='canonical-request';value.evidence=[{kind:'mutation_receipt',request_id:value.request_id,observed:{...value.context,revision:'r2'}}];
 const wrong=structuredClone(value);wrong.evidence[0].request_id='different-request';assert.equal(f.voice.notifyInteraction(wrong),false);
 for(const key of ['case_id','board_case_id','scenario_id']){const invalid=structuredClone(value);invalid.evidence[0].observed[key]='foreign';assert.equal(f.voice.notifyInteraction(invalid),false);}
 assert.equal(f.voice.notifyInteraction(value),true);const data=projection(interactionMessages(f)[0]);assert.equal(data.mutation_confirmed,true);assert.equal(data.evidence[0].observed.revision,'r2');await f.voice.stop();
});
test('awaiting confirmation is described as a card and uncertainty never claims no effect',async()=>{
 const f=await fixture();await f.start();assert.equal(f.voice.notifyInteraction(action({state:'awaiting_confirmation'})),true);assert.match(interactionMessages(f)[0].content,/tarjeta de intención por confirmar/);
 const value=action({kind:'change_request',state:'uncertain'});value.request_id='pending-request';assert.equal(f.voice.notifyInteraction(value),true);
 const message=interactionMessages(f)[1];assert.match(message.content,/ni que no tuvo efecto/);assert.equal(projection(message).draft_only,false);await f.voice.stop();
});
test('a failed channel send is not remembered as sent and can be tried again',async()=>{
 const f=await fixture();await f.start();const original=f.peer.channel.send;f.peer.channel.send=()=>{throw Error('closed');};assert.equal(f.voice.notifyInteraction(action()),false);f.peer.channel.send=original;
 assert.equal(f.voice.notifyInteraction(action()),true);assert.equal(interactionMessages(f).length,1);await f.voice.stop();
});
