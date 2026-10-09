import {createFrameTransport} from './conversation.mjs?v=126';
import {validateFastSession} from './fast-lane.mjs';
import {createWorkObserver} from './work-observer.mjs?v=126';
const transport=createFrameTransport(window);
let credential=null,minting=null,stop=null,bound=null;
const current=()=>window.YodResidentAgents?.getSelection?.();
async function request(path,data,caseId){
 if(current()?.case_id!==caseId)throw Error('unauthorized');
 if(!credential||credential.case_id!==caseId||credential.expires_at-Date.now()<45000){
  if(!minting||minting.caseId!==caseId){const promise=transport.mintFastSession({case_id:caseId}).then(raw=>validateFastSession(raw,caseId));minting={caseId,promise};}
  const pending=minting;try{const next=await pending.promise;if(current()?.case_id!==caseId)throw Error('unauthorized');credential={...next,case_id:caseId};}finally{if(minting===pending)minting=null;}
 }
 const c=credential;
 const response=await fetch(c.endpoint+path,{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
 if(current()?.case_id!==caseId)throw Error('unauthorized');
 if(response.status===401||response.status===403){credential=null;throw Error('unauthorized');}
 if(!response.ok)throw Error('unavailable');return response.json();
}
const observer=createWorkObserver({request,getSelection:current,isVisible:()=>!document.hidden});
window.YodWorkObserver=observer;
function bind(){const api=window.YodResidentAgents;if(api===bound)return;stop?.();bound=api;stop=api?.subscribe?.(()=>{if(credential?.case_id!==current()?.case_id)credential=null;observer.select();});observer.select();}
window.addEventListener('yod-residents-ready',bind);
window.addEventListener('online',()=>void observer.refresh());
window.addEventListener('yod-goals-changed',()=>void observer.refresh());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void observer.refresh();});
window.addEventListener('pagehide',()=>{stop?.();observer.dispose();transport.dispose();credential=null;delete window.YodWorkObserver;});
bind();window.dispatchEvent(new CustomEvent('yod-work-observer-ready'));
