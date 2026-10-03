// Read-only follower shared by every conversation panel. Scheduling starts
// after each read settles, so slow Sheets calls cannot pile up or spend retries.
export function watchConversation(conversation,{visible=()=>true,now=()=>Date.now(),schedule=setTimeout,cancel=clearTimeout,onLimit=()=>{},limit=180000}={}){
 let stopped=false,timer;const started=now();
 const stop=()=>{stopped=true;cancel(timer);};
 const delay=()=>now()-started<30000?5000:10000;
 const queue=()=>{if(!stopped)timer=schedule(tick,delay());};
 const tick=async()=>{
  if(stopped||!conversation.model?.processing)return;
  if(now()-started>=limit){stopped=true;onLimit();return;}
  if(!visible()||conversation.busy){queue();return;}
  await conversation.refresh();
  if(!stopped&&conversation.model?.processing)queue();
 };
 queue();return stop;
}
