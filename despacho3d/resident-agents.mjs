import {validateSelection} from './conversation.mjs?v=116';
import {AUTHORITY_LEASE_MS,AUTHORITY_REFRESH_MS,authorityIsCurrent,isTransientAuthorityError} from './authority-lease.mjs?v=126';

// Presence belongs to the authorized room, independently of its conversation panel.
// This in-memory lease is refreshed in the foreground and never restores access from storage.
export function createResidentAgents({transport,onChange=()=>{},now=Date.now,schedule=setTimeout,cancel=clearTimeout,isVisible=()=>true}={}){
 let requestedCaseId=null,catalogAllowed=null,catalogDenied=false;
 let selection=null,prepared=false,phase='loading',checkedAt=null,flight=null,epoch=0,disposed=false,timer=null,leaseTimer=null,attempt=0;
 const profiles=new Set(),listeners=new Set();
 const clone=v=>v?structuredClone(v):null;
 const current=()=>checkedAt!==null&&authorityIsCurrent(checkedAt,now());
 const snapshot=()=>({phase,prepared,checked_at:checkedAt,selection:clone(current()?selection:null)});
 function emit(){const s=snapshot();onChange(s);for(const fn of listeners)fn(s);}
 function profile(){return clone(current()?selection?.avatar:null);}
 function publishProfile(){for(const fn of profiles)fn(profile());}
 function stopLease(){if(leaseTimer!==null)cancel(leaseTimer);leaseTimer=null;}
 function expire(){if(disposed||!selection)return;if(current()){armLease();return;}selection=null;prepared=false;phase='reconnecting';stopLease();publishProfile();emit();}
 function armLease(){stopLease();if(checkedAt!==null)leaseTimer=schedule(expire,Math.max(0,AUTHORITY_LEASE_MS-(now()-checkedAt)));}
 function invalidate(){epoch++;flight=null;selection=null;prepared=false;checkedAt=null;phase='unauthorized';if(timer!==null)cancel(timer);timer=null;stopLease();publishProfile();emit();}
 function reconcileCatalog(state){
  if(disposed)return;
  if(state?.phase==='unauthorized'){catalogDenied=true;catalogAllowed=null;invalidate();return;}
  if(state?.phase!=='current'||!Array.isArray(state.cases))return;
  const wasBlocked=catalogDenied||phase==='unauthorized',id=selection?.case_id||requestedCaseId;
  catalogDenied=false;catalogAllowed=new Set(state.cases.map(c=>c.case_id));
  if(id&&!catalogAllowed.has(id)){invalidate();return;}
  if(wasBlocked&&catalogAllowed.size)void refresh();
 }
 function later(delay){if(timer!==null)cancel(timer);timer=schedule(()=>{timer=null;if(isVisible())void refresh();else later(60000);},delay);}
 async function refresh(){
  if(disposed)return false;
  if(selection&&!current())expire();
  if(flight)return flight;
  const own=epoch;
  flight=(async()=>{
   try{
    const raw=await transport.resolveCurrent(requestedCaseId?{case_id:requestedCaseId}:{});
    if(raw?.ok===false)throw Error(raw.error||'unavailable');
    const fresh=validateSelection(raw);
    if(requestedCaseId&&fresh.case_id!==requestedCaseId)throw Error('case_changed');
    if(catalogDenied||(catalogAllowed&&!catalogAllowed.has(fresh.case_id)))throw Error('unauthorized');
    if(disposed||own!==epoch)return false;
    const changed=JSON.stringify(selection?.avatar)!==JSON.stringify(fresh.avatar);
    const changedCase=selection?.case_id!==fresh.case_id;
    selection=fresh;checkedAt=now();attempt=0;armLease();
    if(changedCase)prepared=false;
    phase=!fresh.can_enqueue?'observe':!fresh.agent_ready?'offline':prepared?'standby':'preparing';
    if(changed)publishProfile();emit();later(AUTHORITY_REFRESH_MS);return true;
   }catch(error){
    if(disposed||own!==epoch)return false;
    const transient=isTransientAuthorityError(error);
    prepared=false;
    // Preserve a recently authorized figure during a short outage, with operation disabled.
    if(!transient||!current()){selection=null;stopLease();publishProfile();}
    phase=transient?'reconnecting':'unauthorized';emit();
    if(transient)later(Math.min(15000,2000*2**Math.min(attempt++,3)));
    return false;
   }
  })();
  const active=flight;void active.then(()=>{if(flight===active)flight=null;},()=>{if(flight===active)flight=null;});
  return active;
 }
 function markPrepared(caseId,ok){
  if(disposed||!selection||selection.case_id!==caseId||['unauthorized','reconnecting'].includes(phase))return;
  prepared=ok===true;phase=!selection.can_enqueue?'observe':!selection.agent_ready?'offline':prepared?'standby':'preparing';emit();
 }
 return {refresh,snapshot,getProfile:profile,reconcileCatalog,
  async selectCase(caseId){if(disposed||typeof caseId!=='string'||!/^[A-Za-z0-9_.:-]{1,200}$/.test(caseId))return false;epoch++;flight=null;requestedCaseId=caseId;selection=null;prepared=false;checkedAt=null;stopLease();phase='loading';publishProfile();emit();return refresh();},
  getSelection(){return !['loading','unauthorized','reconnecting'].includes(phase)&&current()?clone(selection):null;},
  subscribeProfile(fn){profiles.add(fn);fn(profile());return()=>profiles.delete(fn);},
  subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},markPrepared,
  dispose(){if(disposed)return;disposed=true;epoch++;if(timer!==null)cancel(timer);timer=null;stopLease();selection=null;prepared=false;phase='unauthorized';publishProfile();emit();profiles.clear();listeners.clear();}
 };
}

// A failed refresh is not a revocation. Existing sessions may finish within the current lease;
// getSelection() still blocks new operations until authority is validated again.
export function residentAccessDecision(state,current,now=Date.now()){
 if(!current)return 'none';
 if(state?.phase==='reconnecting'&&state.selection?.case_id===current.case_id&&
    authorityIsCurrent(state.checked_at,now))return 'recovering';
 if(!state?.selection||state.selection.case_id!==current.case_id||
    ['loading','unauthorized','reconnecting'].includes(state.phase)||!authorityIsCurrent(state.checked_at,now))return 'lost';
 return 'current';
}
