// Read-only navigation. This adapter never emits input/change, calls a business
// endpoint, switches scenarios or supplies authority to the embedded board.
import {nativeVolumeCapability} from './project-station.mjs?v=native-volumes3';
const sections=new Set(['dArq','dVentas','dCostos','dMacro','dDota','dVolumenes']);
const blockingCodes=new Set(['revision_changed','scenario_changed','case_changed','reading_unconfirmed','editing_in_progress','pending_write','unauthorized','session_changed']);
const identifier=value=>typeof value==='string'&&/^[A-Za-z0-9_.:-]{1,256}$/.test(value);
export function createWorkspaceNavigation({win,getFrame,getBinding,getContext,onContext=()=>{},timeoutMs=1800}){
 let capability=null,volumeCapability=null,verifiedContext=null,nativeContextAnnounced=null,authorizedCase=null,disposed=false;const pending=new Map();
 const binding=()=>{const frame=getFrame(),b=getBinding();return frame&&b?.bridge&&b.origin&&b.nonce&&b.board_case_id?{frame,...b}:null;};
 const same=(a,b)=>!!a&&!!b&&a.frame===b.frame&&a.nonce===b.nonce&&a.board_case_id===b.board_case_id&&a.origin===b.origin;
 const current=()=>{const c=!disposed&&getContext?.(),valid=c?.authorized===true&&identifier(c.case_id);if(!valid||authorizedCase&&authorizedCase!==c.case_id){capability=null;volumeCapability=null;verifiedContext=null;nativeContextAnnounced=null;}authorizedCase=valid?c.case_id:null;return valid?c:null;};
 function trusted(event,b){const caseId=event.data?.type==='yod:ppp:state'?event.data.board?.case_id:event.data?.case_id;return !!b&&event.origin===b.origin&&event.source===b.frame.contentWindow&&event.data?.version===1&&event.data.nonce===b.nonce&&caseId===b.board_case_id;}
 function contextMatches(a,b){return !!a&&!!b&&['case_id','board_case_id','scenario_id','revision'].every(k=>!a[k]||a[k]===b[k]);}
 function receive(event){
  const b=binding();if(disposed||!current()||!trusted(event,b))return;
  const d=event.data;
  if(d.type==='yod:ppp:state'){
   if(d.capabilities?.navigate===true)capability=b;
   else if(d.capabilities&&Object.hasOwn(d.capabilities,'navigate'))capability=null;
   const volumes=d.board?.metadata?.model_type==='vertical'&&nativeVolumeCapability(d.board.capabilities?.volumes);
   volumeCapability=volumes?{binding:b,value:volumes}:null;
   if(Object.hasOwn(d,'navigation_context'))nativeContextAnnounced=b;
   const c=d.navigation_context,host=current();
   verifiedContext=same(b,nativeContextAnnounced)&&c&&c.case_id===host.case_id&&c.board_case_id===b.board_case_id&&identifier(c.scenario_id)&&identifier(c.revision)&&c.confirmed===true&&c.pending===false&&!c.error&&!d.error?{binding:b,case_id:host.case_id,scenario_id:c.scenario_id,revision:c.revision,confirmed:true,pending:false}:null;
   onContext();
  }
  if(d.type!=='yod:ppp:navigation'||!identifier(d.request_id))return;
  const job=pending.get(d.request_id);if(!job||!same(b,job.binding))return;
  const blockingCode=[d.code,d.reason].find(code=>blockingCodes.has(code));
  if(blockingCode){job.finish({status:'blocked',reason:blockingCode});return;}
  const now=context();
  if(!now?.confirmed||now.pending||!contextMatches(job.context,now)){job.finish({status:'unavailable',reason:'context_changed'});return;}
  if(d.status!=='confirmed'){
   job.finish({status:['unsupported','unavailable','blocked'].includes(d.status)?d.status:'unavailable',reason:d.reason||d.code||'navigation_not_confirmed'});return;
  }
  const observed=d.observed;
  if(!observed||observed.section_id!==job.section_id||observed.board_case_id!==b.board_case_id||
     ['scenario_id','revision'].some(k=>job.context[k]&&observed[k]!==job.context[k]))return;
  job.finish({status:'confirmed',observed:{case_id:job.context.case_id,tab:'ppp',section_id:job.section_id,
   board_case_id:b.board_case_id,scenario_id:observed.scenario_id,revision:observed.revision}});
 }
 win.addEventListener('message',receive);
 function context(){const c=current(),b=binding(),n=verifiedContext,announced=same(b,nativeContextAnnounced),volumes=same(b,volumeCapability?.binding)?volumeCapability.value:null,navigate=same(b,capability);return c?{...c,...(n&&n.case_id===c.case_id&&same(b,n.binding)?{scenario_id:n.scenario_id,revision:n.revision,confirmed:n.confirmed,pending:n.pending}:announced?{confirmed:false,pending:true}:{}),...(c.local_pending===true?{pending:true}:{}),ppp_enabled:navigate||!!volumes?.read,capabilities:{navigate,...(volumes?{volumes}:{})}}:null;}
 function eligible(payload){const c=context(),b=binding();return c&&b&&c.board_case_id===b.board_case_id&&contextMatches(payload.context,c)&&
   c.confirmed===true&&!c.pending&&sections.has(payload.section_id)?{context:c,binding:b}:null;}
 function navigate(payload){
  const selected=eligible(payload);if(!selected)return Promise.resolve({status:'unavailable',reason:'board_not_ready'});
  if(!same(selected.binding,capability))return Promise.resolve({status:'unsupported'});
  if(!identifier(payload.action_id))return Promise.resolve({status:'unavailable'});
  if(pending.has(payload.action_id)){const prior=pending.get(payload.action_id);return prior.section_id===payload.section_id&&contextMatches(prior.context,selected.context)?prior.promise:Promise.resolve({status:'unavailable',reason:'request_id_reused'});}
  let finish;const promise=new Promise(resolve=>{finish=resolve;});
  const job={promise,context:{...selected.context},binding:selected.binding,section_id:payload.section_id,timer:null,finish(result){
   if(pending.get(payload.action_id)!==job)return;clearTimeout(job.timer);pending.delete(payload.action_id);finish(result);
  }};pending.set(payload.action_id,job);
  job.timer=setTimeout(()=>job.finish({status:'unavailable',reason:'navigation_ack_timeout'}),timeoutMs);
  try{selected.binding.frame.contentWindow.postMessage({type:'yod:ppp:navigate',version:1,nonce:selected.binding.nonce,
   case_id:selected.binding.board_case_id,board_case_id:selected.binding.board_case_id,request_id:payload.action_id,
   scenario_id:selected.context.scenario_id,revision:selected.context.revision,target:payload.section_id},selected.binding.origin);}
  catch{job.finish({status:'unavailable',reason:'frame_unavailable'});}
  return promise;
 }
 async function assisted(payload){
  const selected=eligible(payload);if(!selected)return{status:'unavailable',reason:'board_not_ready'};
  try{
   const frame=selected.binding.frame,doc=frame.contentDocument;
   if(!doc||frame.contentWindow.location.origin!==selected.binding.origin)return{status:'unavailable'};
   const focused=doc.activeElement;
   if(focused&&(focused.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)))return{status:'blocked',reason:'editing_in_progress'};
   const verified=verifiedContext&&verifiedContext.case_id===selected.context.case_id&&same(selected.binding,verifiedContext.binding);
   const view=frame.contentWindow.PPPView,modern=verified&&typeof view?.navigate==='function'&&typeof view?.navigationState==='function';
   let target;
   if(modern){
    const before=view.navigationState(payload.section_id);
    if(before?.status!=='confirmed'){
     if(before?.code==='reading_or_editing'||blockingCodes.has(before?.code))return{status:'blocked',reason:before.code};
     // The closed presentation API toggles/scrolls cards without editing fields.
     view.navigate(payload.section_id);
    }
    const observed=view.navigationState(payload.section_id);
    if(observed?.status!=='confirmed'||observed.section_id!==payload.section_id)return{status:observed?.code==='reading_or_editing'||blockingCodes.has(observed?.code)?'blocked':'unavailable',reason:observed?.code||'section_not_confirmed'};
    target=payload.section_id==='dVolumenes'?doc.getElementById('pppVolumes'):doc.querySelector?.('[data-card="'+payload.section_id+'"]');
   }else{
    target=doc.getElementById(payload.section_id);
    if(!target||target.tagName!=='DETAILS')return{status:'unsupported'};
    // No focus(), blur(), click(), input/change events or native adjust() call.
    target.open=true;target.scrollIntoView?.({block:'nearest',behavior:'instant'});
   }
   const now=context();
   if(!now?.confirmed||now.pending||!contextMatches(selected.context,now)||!same(selected.binding,binding()))return{status:'unavailable',reason:'context_changed'};
   if(!target)return{status:'unavailable',reason:'section_not_visible'};
   const rect=target.getBoundingClientRect(),style=frame.contentWindow.getComputedStyle(target);
   const width=frame.contentWindow.innerWidth,height=frame.contentWindow.innerHeight;
   if(!modern&&!target.open||target.hidden||target.inert||style.display==='none'||style.visibility==='hidden'||!rect.width||!rect.height||
      !(width>0&&height>0&&rect.bottom>0&&rect.right>0&&rect.top<height&&rect.left<width))return{status:'unavailable',reason:'section_not_visible'};
   // Legacy DOM visibility proves only that the section opened. A host snapshot
   // cannot establish which child scenario/revision is currently on screen.
   if(!verifiedContext||verifiedContext.case_id!==now.case_id||!same(selected.binding,verifiedContext.binding))return{status:'pending',reason:'visible_version_unconfirmed'};
   return{status:'confirmed',observed:{case_id:selected.context.case_id,tab:'ppp',section_id:payload.section_id,
    board_case_id:selected.binding.board_case_id,scenario_id:selected.context.scenario_id,revision:selected.context.revision}};
  }catch{return{status:'unavailable',reason:'assisted_navigation_unavailable'};}
 }
 function reset(){capability=null;volumeCapability=null;verifiedContext=null;nativeContextAnnounced=null;for(const job of [...pending.values()])job.finish({status:'unavailable',reason:'context_changed'});}
 return{context,navigate,assisted,reset,dispose(){disposed=true;reset();win.removeEventListener('message',receive);}};
}
