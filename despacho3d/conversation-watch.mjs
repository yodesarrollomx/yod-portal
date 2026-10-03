// Read-only follower shared by every conversation panel. Scheduling starts
// after each read settles, so slow Sheets calls cannot pile up or spend retries.
export function watchConversation(conversation,{visible=()=>true,now=()=>Date.now(),schedule=setTimeout,cancel=clearTimeout,onLimit=()=>{},limit=180000}={}){
 let stopped=false,timer,notified=false;const started=now();
 const stop=()=>{stopped=true;cancel(timer);};
 const delay=()=>now()-started>=limit?30000:now()-started<30000?5000:10000;
 const needsRead=()=>conversation.model?.processing||conversation.status==='processing'||conversation.recoverable||conversation.status==='unconfirmed'||conversation.status==='conflict'||(conversation.status==='ready'&&conversation.selection?.agent_ready===false);
 const queue=()=>{if(!stopped)timer=schedule(tick,delay());};
 const tick=async()=>{
  if(stopped||!needsRead())return;
  if(now()-started>=limit&&!notified){notified=true;onLimit();}
  if(!visible()||conversation.busy){queue();return;}
  if(conversation.selection||!conversation.open)await conversation.refresh();else await conversation.open();
  if(!stopped&&needsRead())queue();
 };
 queue();return stop;
}
