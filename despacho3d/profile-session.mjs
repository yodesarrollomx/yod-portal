// One shared authenticated read for initial hydration and opening the panel.
// Conversation memory is discarded on close; only its authorized visual profile remains.
export function createProfileSession(conversation,{show=()=>{},hide=()=>{},getCaseId=()=>null}={}){
 let opening=null,opened=false,disposed=false,hydrated=false;
 function read(){
  if(disposed)return Promise.resolve(false);
  if(opening)return opening;
  const id=getCaseId();
  const request=conversation.selection&&(!id||conversation.selection.case_id===id)?conversation.refresh():conversation.open(id);
  const pending=Promise.resolve(request).finally(()=>{if(opening===pending)opening=null;});
  opening=pending;return pending;
 }
 function close(){opened=false;opening=null;conversation.close();hide();}
 function open(tab='chat'){
  if(disposed)return false;
  const wasOpen=opened;opened=true;show(tab);
  if(!wasOpen)void read();
  return true;
 }
 return {
  hydrate(){if(disposed||hydrated)return Promise.resolve(false);hydrated=true;return read().then(ok=>{if(!opened&&!disposed)conversation.close();return ok;});},
  read,open,close,isOpen:()=>opened,
  getProfile:()=>conversation.getProfile(),
  subscribeProfile:fn=>conversation.subscribeProfile(fn),
  openForCase(id){const profile=conversation.getProfile();return typeof id==='string'&&profile?.case_id===id?open('chat'):false;},
  dispose(){if(disposed)return;disposed=true;close();conversation.forgetProfile();}
 };
}
