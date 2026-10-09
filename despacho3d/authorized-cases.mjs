import {validateSelection} from './conversation.mjs?v=126';
import {AUTHORITY_LEASE_MS,authorityIsCurrent,isTransientAuthorityError} from './authority-lease.mjs?v=126';
// Private server catalog, kept only in memory. Selecting always revalidates the exact case.
export function createAuthorizedCases({transport,onChange=()=>{},beforeSelect=()=>true,now=Date.now,schedule=setTimeout,cancel=clearTimeout}){
 let items=[],selected=null,epoch=0,selectionEpoch=0,disposed=false,checkedAt=null,phase='loading',error=null,flight=null,leaseTimer=null;
 const valid=()=>checkedAt!==null&&authorityIsCurrent(checkedAt,now());
 const snapshot=()=>({cases:structuredClone(valid()?items:[]),selected:structuredClone(valid()?selected:null),checked_at:checkedAt,phase:checkedAt===null?phase:valid()?phase:phase==='unauthorized'?'unauthorized':'reconnecting',error});
 const emit=()=>onChange(snapshot());
 function stopLease(){if(leaseTimer!==null)cancel(leaseTimer);leaseTimer=null;}
 function expire(){if(disposed||checkedAt===null)return;if(valid()){armLease();return;}items=[];selected=null;selectionEpoch++;phase='reconnecting';error='lease_expired';stopLease();emit();}
 function armLease(){stopLease();if(checkedAt!==null)leaseTimer=schedule(expire,Math.max(0,AUTHORITY_LEASE_MS-(now()-checkedAt)));}
 function clear(reason='unauthorized'){epoch++;selectionEpoch++;flight=null;stopLease();items=[];selected=null;checkedAt=null;phase='unauthorized';error=reason;emit();}
 async function refresh(){
  if(disposed)return false;if(flight)return flight;
  if(checkedAt!==null&&!valid())expire();
  const own=epoch;
  flight=(async()=>{
   try{
    const r=await transport.listAuthorized({});if(disposed||own!==epoch)return false;
    if(r?.ok===false)throw Error(r.error||'unavailable');
    if(r?.ok!==true||r.schema!==1||!Array.isArray(r.cases)||r.cases.length>6)throw Error('invalid_catalog');
    const next=r.cases.map(validateSelection);if(new Set(next.map(x=>x.case_id)).size!==next.length)throw Error('invalid_catalog');
    items=next;if(selected&&!next.some(x=>x.case_id===selected.case_id)){selected=null;selectionEpoch++;}
    checkedAt=now();phase='current';error=null;armLease();emit();return true;
   }catch(e){
    if(disposed||own!==epoch)return false;
    if(isTransientAuthorityError(e)){phase='reconnecting';error=e.message;if(!valid()){items=[];selected=null;selectionEpoch++;}emit();}
    else clear(e.message||'invalid_catalog');
    return false;
   }
  })();const active=flight;void active.then(()=>{if(flight===active)flight=null;},()=>{if(flight===active)flight=null;});return active;
 }
 async function select(caseId,{onResolved=()=>{}}={}){
  if(disposed||phase!=='current'||!valid()||!items.some(x=>x.case_id===caseId)||!await beforeSelect(caseId))return null;
  if(disposed||phase!=='current'||!valid()||!items.some(x=>x.case_id===caseId))return null;
  const own=epoch,selectionOwn=++selectionEpoch;selected=null;emit();
  try{
   const r=await transport.resolveCurrent({case_id:caseId});
   if(disposed||own!==epoch||selectionOwn!==selectionEpoch)return null;
   if(r?.ok===false)throw Error(r.error||'unavailable');
   const fresh=validateSelection(r);
   if(fresh.case_id!==caseId)throw Error('case_changed');
   if(!valid()||phase!=='current'||!items.some(x=>x.case_id===caseId))return null;
   selected=fresh;emit();
   if(disposed||own!==epoch||selectionOwn!==selectionEpoch||!valid()||phase!=='current')return null;
   onResolved(structuredClone(r));return structuredClone(fresh);
  }catch(e){
   if(own===epoch&&selectionOwn===selectionEpoch){
    if(isTransientAuthorityError(e)){phase='reconnecting';error=e.message;emit();}
    else clear(e.message||'invalid_selection');
   }return null;
  }
 }
 return {refresh,select,snapshot,clear,dispose(){if(disposed)return;disposed=true;clear('closed');}};
}
