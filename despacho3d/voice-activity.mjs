// Observe the actual HTML audio playback path, not transcript arrival or inbound
// packet count. No recording or audio leaves this module. Unknown = pending.
const outputs=new WeakMap();
export function createVoiceActivityMonitor({audio,stream,AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext,
 now=Date.now,schedule=setInterval,cancel=clearInterval}={}){
 let graph,input,source,timer,disposed=false,observed=0,lastOutput=now(),outputActive=false,inputActive=false;
 let sampled=false;
 try{
  graph=outputs.get(audio);
  if(!graph){
   const context=new AudioContext(),media=context.createMediaElementSource(audio),analyser=context.createAnalyser();
   analyser.fftSize=2048;media.connect(analyser);analyser.connect(context.destination);
   graph={context,analyser};outputs.set(audio,graph);
  }
  input=graph.context.createAnalyser();input.fftSize=2048;
  source=graph.context.createMediaStreamSource(stream);source.connect(input);
  const incoming=new Float32Array(input.fftSize),outgoing=new Float32Array(graph.analyser.fftSize);
  const loud=(analyser,buffer)=>{analyser.getFloatTimeDomainData(buffer);let power=0;for(const x of buffer)power+=x*x;return Math.sqrt(power/buffer.length)>.003;};
  timer=schedule(()=>{
   if(disposed||graph.context.state!=='running')return;
   try{inputActive=loud(input,incoming);outputActive=loud(graph.analyser,outgoing);observed=now();sampled=true;if(outputActive)lastOutput=observed;}
   catch{sampled=false;}
  },100);
  void graph.context.resume().catch(()=>{});
 }catch{/* Unsupported monitoring must not manufacture proof of silence. */}
 return {
  resume(){try{void graph?.context.resume().catch(()=>{});}catch{}},
  snapshot({muted=false,blocked=false}={}){
   const known=sampled&&graph?.context.state==='running'&&now()-observed<1000;
   return {input_active:muted?false:!known||inputActive,output_active:!known||outputActive,
    playback_pending:!known||blocked||!audio?.srcObject||audio.paused!==false||audio.seeking===true||now()-lastOutput<2000};
  },
  close(){disposed=true;if(timer!==undefined)cancel(timer);source?.disconnect();input?.disconnect();
   // A MediaElementSource can only be created once for this element. Keep its
   // output graph for the next explicit call; suspend while the element is idle.
   try{void graph?.context.suspend().catch(()=>{});}catch{}
  }
 };
}
