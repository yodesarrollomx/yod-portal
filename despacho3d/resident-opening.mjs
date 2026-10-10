// One opening path for the character body, its label and other authorized entry points.
// The menu is visual feedback only: private controls wait for the exact server selection.
export function createResidentOpening({getResidents,getMenu,beforeOpen=()=>{},canSelect=()=>true}){
 return async function openForCase(caseId){
  const api=getResidents(),menu=getMenu();if(!api||!menu)return false;
  const current=api.getSelection?.();
  if(current?.case_id===caseId){beforeOpen();const opened=menu.showRadial(caseId);if(!opened)menu.showPending(caseId,{message:'El puesto aún no está disponible. Vuelve a intentarlo.',retry:true});return opened;}
  if(!api.getAuthorizedProfiles?.().some(p=>p.id===caseId&&p.case_id===caseId&&p.entity_kind==='case'))return false;
  beforeOpen();
  if(!canSelect()){
   menu.showPending(caseId,{message:'Hay una conversación de voz en curso. Finalízala desde el micrófono antes de cambiar de autón.'});
   return false;
  }
  const ticket=menu.showPending(caseId);if(ticket===false)return false;
  const shown=()=>getResidents()===api&&getMenu()===menu&&menu.isPending(caseId,ticket);
  const stillCurrent=()=>shown()&&canSelect();
  try{
   const selected=await api.selectCase(caseId,{isCurrent:stillCurrent});
   if(!shown())return false;
   if(!canSelect()){menu.showPending(caseId,{message:'Hay una conversación de voz en curso. Finalízala desde el micrófono antes de cambiar de autón.'});return false;}
   if(selected&&api.getSelection?.()?.case_id===caseId&&menu.showRadial(caseId))return true;
  }catch{if(!stillCurrent())return false;}
  menu.showPending(caseId,{message:'No se pudo conectar con este proyecto. Vuelve a intentarlo sin salir de la oficina.',retry:true});
  return false;
 };
}
