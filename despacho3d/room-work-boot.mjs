import {createFrameTransport} from './conversation.mjs?v=116';
import {validateFastSession} from './fast-lane.mjs';
import {createRoomWork} from './room-work.mjs?v=124';
const transport=createFrameTransport(window),credentials=new Map();let stop=null,bound=null;
async function request(path,data,caseId){
 if(!room.has(caseId))throw Error('unauthorized');
 let c=credentials.get(caseId);
 if(!c||c.expires_at-Date.now()<45000){
  c=validateFastSession(await transport.mintFastSession({case_id:caseId}),caseId);
  if(!room.has(caseId))throw Error('unauthorized');credentials.set(caseId,c);
 }
 const response=await fetch(c.endpoint+path,{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)});
 if(!room.has(caseId)||response.status===401||response.status===403){credentials.delete(caseId);throw Error('unauthorized');}
 if(!response.ok)throw Error('unavailable');return response.json();
}
const room=createRoomWork({request,isVisible:()=>!document.hidden});
window.YodRoomWork=room;
function bind(){
 const api=window.YodResidentAgents;if(api===bound)return;stop?.();credentials.clear();bound=api;
 const receive=profiles=>{room.reconcile(profiles);for(const id of credentials.keys())if(!room.has(id))credentials.delete(id);};
 stop=api?.subscribeAuthorizedProfiles?api.subscribeAuthorizedProfiles(receive):api?.subscribeProfile(p=>receive(p?[p]:[]));
}
window.addEventListener('yod-residents-ready',bind);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void room.refresh();});
window.addEventListener('yod-goals-changed',()=>void room.refresh());
window.addEventListener('pagehide',()=>{stop?.();room.dispose();credentials.clear();transport.dispose();delete window.YodRoomWork;});
bind();window.dispatchEvent(new CustomEvent('yod-room-work-ready'));
