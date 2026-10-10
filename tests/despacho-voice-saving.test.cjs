const test=require('node:test'),assert=require('node:assert/strict');
test('acoustic telemetry requires real output samples, drains tail, treats suspended or blocked playback as pending',async()=>{
 const {createVoiceActivityMonitor}=await import('../despacho3d/voice-activity.mjs');
 let at=0,sample,input=0,output=0,graphs=0;
 class Context{
  constructor(){this.state='running';this.destination={};this.n=0;graphs++;}
  createMediaElementSource(){return {connect(){}};}
  createMediaStreamSource(){return {connect(){},disconnect(){}};}
  createAnalyser(){const index=this.n++;return {fftSize:0,connect(){},disconnect(){},getFloatTimeDomainData(b){b.fill(index===0?output:input);}};}
  async resume(){this.state='running';}async suspend(){this.state='suspended';}
 }
 const audio={srcObject:{},paused:false,seeking:false};
 const make=()=>createVoiceActivityMonitor({audio,stream:{},AudioContext:Context,now:()=>at,schedule:f=>(sample=f,1),cancel(){}});
 const m=make();assert.equal(m.snapshot().playback_pending,true);
 at=3000;sample();assert.deepEqual(m.snapshot(),{input_active:false,output_active:false,playback_pending:false});
 input=.1;output=.1;sample();assert.deepEqual(m.snapshot(),{input_active:true,output_active:true,playback_pending:true});
 input=output=0;at+=1000;sample();assert.equal(m.snapshot().playback_pending,true);at+=1100;sample();assert.equal(m.snapshot().playback_pending,false);
 assert.equal(m.snapshot({blocked:true}).playback_pending,true);audio.paused=true;assert.equal(m.snapshot().playback_pending,true);audio.paused=false;
 at+=2000;assert.equal(m.snapshot().playback_pending,true);assert.equal(m.snapshot({muted:true}).input_active,false);
 m.close();assert.equal(m.snapshot().playback_pending,true);const next=make();assert.equal(graphs,1);next.close();
});
test('unsupported acoustic monitor never reports unknown media as silent',async()=>{
 const {createVoiceActivityMonitor}=await import('../despacho3d/voice-activity.mjs');
 const m=createVoiceActivityMonitor({audio:{},stream:{},AudioContext:null});assert.equal(m.snapshot().playback_pending,true);m.close();
});
test('workspace presents call, pause with explicit resume and independent goal states',async()=>{
 const {voiceView}=await import('../despacho3d/voice-view.mjs');
 assert.equal(voiceView({phase:'listening'}).title,'En llamada');
 const paused=voiceView({phase:'idle',paused:true});assert.equal(paused.title,'En pausa (toca para seguir)');assert.equal(paused.live,false);assert.equal(paused.startLabel,'Toca para seguir');
 assert.equal(voiceView({phase:'idle',paused:true,working_without_voice:true}).title,'Trabajando sin voz');
});

test('canonical goal completion notifies once without opening voice; state resets per case',async()=>{
 const {createVoiceGoalView}=await import('../despacho3d/voice-view.mjs'),view=createVoiceGoalView();
 assert.deepEqual(view.update([{goal_id:'g',status:'running'}]),{working:true,notice:''});
 const done=view.update([{goal_id:'g',status:'ready_for_review'}]);assert.equal(done.working,false);assert.match(done.notice,/resultado disponible/);
 assert.equal(view.update([{goal_id:'g',status:'ready_for_review'}]).notice,'');view.reset();assert.equal(view.update([{goal_id:'g',status:'ready_for_review'}]).notice,'');
});
