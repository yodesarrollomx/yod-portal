// Presentation scheduling only: never owns audio, credentials or remote work.
export function createFrameBudget({draw,request=requestAnimationFrame,cancel=cancelAnimationFrame,compact=false}={}){
 let hidden=false,lost=false,overlay=false,disposed=false,handle=null,last=null,frames=0;
 function schedule(){if(!disposed&&!hidden&&!lost&&handle===null)handle=request(tick);}
 function tick(at){
  handle=null;if(disposed||hidden||lost)return;
  const interval=1000/(overlay?15:compact?30:60);
  if(last===null||at<last||at-last>=interval-.5){last=at;draw(at);frames++;}
  schedule();
 }
 return Object.freeze({
  state(next={}){const paused=hidden||lost;hidden=next.hidden??hidden;lost=next.lost??lost;overlay=next.overlay??overlay;
   if(hidden||lost){if(handle!==null)cancel(handle);handle=null;last=null;}
   else{if(paused)last=null;schedule();}},
  snapshot:()=>({hidden,lost,overlay,frames,fps:overlay?15:compact?30:60}),
  dispose(){disposed=true;if(handle!==null)cancel(handle);handle=null;}
 });
}
