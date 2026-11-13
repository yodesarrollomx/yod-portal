// Local acoustic overlap control; the provider still owns semantic interruption.
// Uses only the already authorized stream. No recording, new capture or network.
export function createActivityGate({attackMs=120,releaseMs=480,maxHoldMs=8000}={}) {
  let candidate=null,lastLoud=null,active=false,heldAt=0,cooldown=false,quietAt=null,previous=null,floor=.003;
  function reset(){candidate=lastLoud=quietAt=previous=null;active=cooldown=false;floor=.003;return false;}
  function sample(level,at){
    if(!Number.isFinite(level)||!Number.isFinite(at))return reset();
    if(previous!==null&&(at<previous||at-previous>250)){reset();}
    previous=at;
    const loud=level>=Math.max(.018,floor*3);
    if(!loud)floor=.95*floor+.05*Math.min(level,.012);
    if(cooldown){
      if(loud)quietAt=null;else if(quietAt===null)quietAt=at;
      if(quietAt!==null&&at-quietAt>=releaseMs)cooldown=false;
      return false;
    }
    if(loud){
      quietAt=null;lastLoud=at;
      if(candidate===null)candidate=at;
      if(!active&&at-candidate>=attackMs){active=true;heldAt=at;}
    }else if(!active)candidate=null;
    if(active&&lastLoud!==null&&at-lastLoud>=releaseMs){active=false;candidate=null;}
    // Continuous background noise must not silence the assistant indefinitely.
    if(active&&at-heldAt>=maxHoldMs){active=false;candidate=null;cooldown=true;quietAt=null;}
    return active;
  }
  return {sample,reset};
}

export function createLocalInputMonitor({stream,onActivity=()=>{},AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext,
  enabled=()=>true,now=()=>globalThis.performance?.now?.()??Date.now(),schedule=setInterval,cancel=clearInterval}={}) {
  let context,source,analyser,timer=null,disposed=false,active=false;
  const gate=createActivityGate();
  const notify=value=>{if(value!==active){active=value;onActivity(value);}};
  const reset=()=>{gate.reset();notify(false);};
  function close(){
    if(disposed)return;disposed=true;if(timer!==null)cancel(timer);timer=null;
    if(context)context.onstatechange=null;
    source?.disconnect();analyser?.disconnect();
    try{Promise.resolve(context?.close()).catch(()=>{});}catch{}
    reset();
  }
  function resume(){
    if(disposed||context?.state!=='suspended')return;
    try{Promise.resolve(context.resume()).catch(()=>reset());}catch{reset();}
  }
  try{
    const track=stream?.getAudioTracks?.()[0];
    if(typeof AudioContext!=='function'||!track||track.getSettings?.().echoCancellation===false)return {close,resume};
    context=new AudioContext();source=context.createMediaStreamSource(stream);analyser=context.createAnalyser();
    analyser.fftSize=1024;source.connect(analyser);
    const samples=new Float32Array(analyser.fftSize);
    context.onstatechange=()=>{if(context.state!=='running')reset();};
    timer=schedule(()=>{
      if(disposed)return;
      if(context.state!=='running'||!enabled()){reset();return;}
      try{
        analyser.getFloatTimeDomainData(samples);
        let power=0;for(const value of samples)power+=value*value;
        notify(gate.sample(Math.sqrt(power/samples.length),now()));
      }catch{close();}
    },40);
    resume();
  }catch{close();}
  return {close,resume};
}
