import {validateSelection} from './conversation.mjs?v=116';
// Private, short-lived server list. No hard-coded case names, IDs or browser persistence.
export function createAuthorizedCases({transport,onChange=()=>{},beforeSelect=()=>true,now=Date.now}){
 let items=[],selected=null,epoch=0,disposed=false,checkedAt=0;
 const snapshot=()=>({cases:structuredClone(items),selected:structuredClone(selected),checked_at:checkedAt});
 const emit=()=>onChange(snapshot());
 function clear(){epoch++;items=[];selected=null;checkedAt=0;emit();}
 async function refresh(){
  const own=++epoch;items=[];selected=null;checkedAt=0;emit();
  try{const r=await transport.listAuthorized({});if(disposed||own!==epoch)return false;
   if(r?.ok!==true||r.schema!==1||!Array.isArray(r.cases)||r.cases.length>6)throw Error('invalid_catalog');
   const next=r.cases.map(validateSelection);if(new Set(next.map(x=>x.case_id)).size!==next.length)throw Error('invalid_catalog');
   items=next;checkedAt=now();emit();return true;
  }catch{if(own===epoch)clear();return false;}
 }
 async function select(caseId){
  if(disposed||now()-checkedAt>=60000||!items.some(x=>x.case_id===caseId)||!await beforeSelect(caseId))return null;
  const own=++epoch;selected=null;emit();
  try{const r=validateSelection(await transport.resolveCurrent({case_id:caseId}));
   if(disposed||own!==epoch)return null;if(r.case_id!==caseId)throw Error('case_changed');selected=r;emit();return structuredClone(r);
  }catch{if(own===epoch)clear();return null;}
 }
 return {refresh,select,snapshot,clear,dispose(){disposed=true;clear();}};
}
