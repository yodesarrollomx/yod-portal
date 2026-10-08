import {validateSelection} from './conversation.mjs?v=116';

// Presence belongs to the authorized room, independently of its conversation panel.
// This in-memory lease is refreshed in the foreground and never restores access from storage.
export function createResidentAgents({transport,onChange=()=>{},now=Date.now,schedule=setTimeout,cancel=clearTimeout,isVisible=()=>true}={}){
 let requestedCaseId=null;
 let selection=null,prepared=false,phase='loading',checkedAt=0,flight=null,epoch=0,disposed=false,timer=null,attempt=0;
 const profiles=new Set(),listeners=new Set();
 const clone=v=>v?structuredClone(v):null;
 const snapshot=()=>({phase,prepared,checked_at:checkedAt,selection:clone(selection)});
 function emit(){const s=snapshot();onChange(s);for(const fn of listeners)fn(s);}
 function profile(){return clone(selection?.avatar);}
 function publishProfile(){for(const fn of profiles)fn(profile());}
 function later(delay){if(timer!==null)cancel(timer);timer=schedule(()=>{timer=null;if(isVisible())void refresh();else later(60000);},delay);}
 async function refresh(){
  if(disposed)return false;
  if(flight)return flight;
  const own=epoch;
  flight=(async()=>{
   try{
    const raw=await transport.resolveCurrent(requestedCaseId?{case_id:requestedCaseId}:{});
    if(raw?.ok===false)throw Error(raw.error||'unavailable');
    const fresh=validateSelection(raw);
    if(requestedCaseId&&fresh.case_id!==requestedCaseId)throw Error('case_changed');
    if(disposed||own!==epoch)return false;
    const changed=JSON.stringify(selection?.avatar)!==JSON.stringify(fresh.avatar);
    const changedCase=selection?.case_id!==fresh.case_id;
    selection=fresh;checkedAt=now();attempt=0;
    if(changedCase)prepared=false;
    phase=!fresh.can_enqueue?'observe':!fresh.agent_ready?'offline':prepared?'standby':'preparing';
    if(changed)publishProfile();emit();later(60000);return true;
   }catch(error){
    if(disposed||own!==epoch)return false;
    const transient=['unavailable','timeout','transport_busy','session_pending'].includes(error?.message);
    prepared=false;
    // Preserve a recently authorized figure during a short outage, with operation disabled.
    if(!transient||now()-checkedAt>=120000){selection=null;publishProfile();}
    phase=transient?'reconnecting':'unauthorized';emit();
    if(transient)later(Math.min(15000,2000*2**Math.min(attempt++,3)));
    return false;
   }finally{if(own===epoch)flight=null;}
  })();
  return flight;
 }
 function markPrepared(caseId,ok){
  if(disposed||!selection||selection.case_id!==caseId||['unauthorized','reconnecting'].includes(phase))return;
  prepared=ok===true;phase=!selection.can_enqueue?'observe':!selection.agent_ready?'offline':prepared?'standby':'preparing';emit();
 }
 return {refresh,snapshot,getProfile:profile,
  async selectCase(caseId){if(disposed||typeof caseId!=='string'||!/^[A-Za-z0-9_.:-]{1,200}$/.test(caseId))return false;epoch++;flight=null;requestedCaseId=caseId;selection=null;prepared=false;phase='loading';publishProfile();emit();return refresh();},
  getSelection(){return !['loading','unauthorized','reconnecting'].includes(phase)&&now()-checkedAt<120000?clone(selection):null;},
  subscribeProfile(fn){profiles.add(fn);fn(profile());return()=>profiles.delete(fn);},
  subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},markPrepared,
  dispose(){if(disposed)return;disposed=true;epoch++;if(timer!==null)cancel(timer);timer=null;selection=null;prepared=false;phase='unauthorized';publishProfile();emit();profiles.clear();listeners.clear();}
 };
}

// A failed refresh is not a revocation. Existing sessions may finish within the current lease;
// getSelection() still blocks new operations until authority is validated again.
export function residentAccessDecision(state,current,now=Date.now()){
 if(!current)return 'none';
 if(state?.phase==='reconnecting'&&state.selection?.case_id===current.case_id&&
    Number.isFinite(state.checked_at)&&now>=state.checked_at&&now-state.checked_at<120000)return 'recovering';
 if(!state?.selection||state.selection.case_id!==current.case_id||
    ['loading','unauthorized','reconnecting'].includes(state.phase)||!Number.isFinite(state.checked_at)||now-state.checked_at>=120000)return 'lost';
 return 'current';
}
