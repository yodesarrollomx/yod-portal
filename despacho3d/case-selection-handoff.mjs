// Raw server response handoff scoped to one selection attempt. Never cached in storage.
export function createCaseSelectionHandoff({now=Date.now,maxAge=1000}={}){
 let epoch=0,active=null;
 return {
  begin(caseId){active={ticket:++epoch,caseId,raw:null,capturedAt:null,captured:false};return active.ticket;},
  current(ticket){return active?.ticket===ticket;},
  capture(ticket,raw){
   if(active?.ticket!==ticket||active.captured||raw?.case_id!==active.caseId)return false;
   active.raw=structuredClone(raw);active.capturedAt=now();active.captured=true;return true;
  },
  consume(caseId){
   if(!active||active.caseId!==caseId||!active.raw)return null;
   const value=active.raw;active.raw=null;
   return now()>=active.capturedAt&&now()-active.capturedAt<=maxAge?value:null;
  },
  reconcile(state){
   if(active&&(state?.phase==='unauthorized'||state?.phase==='current'&&!state.cases?.some(c=>c.case_id===active.caseId))){epoch++;active=null;}
  },
  finish(ticket){if(active?.ticket===ticket)active=null;},
  invalidate(){epoch++;active=null;}
 };
}
