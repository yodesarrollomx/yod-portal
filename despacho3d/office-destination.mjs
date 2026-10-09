// Shared intent mapping for the 3D office and its accessible map.
// Only an already-authorized current selection can open a project surface.
export const OFFICE_WORKSPACE_DESTINATIONS=Object.freeze({computer:'ppp',library:'activity',decisions:'meeting'});
export function openOfficeDestination(id,{residents,workspace,menu,beforeOpen=()=>{}}={}){
 if(id!=='case'&&!Object.hasOwn(OFFICE_WORKSPACE_DESTINATIONS,id))return {handled:false,opened:false};
 const selected=residents?.getSelection?.();
 if(!selected?.case_id)return {handled:true,opened:false};
 const destination=id==='case'?menu?.showRadial:workspace?.openForCase;
 if(typeof destination!=='function')return {handled:true,opened:false};
 beforeOpen();
 if(residents?.getSelection?.()?.case_id!==selected.case_id)return {handled:true,opened:false};
 return {handled:true,opened:id==='case'?menu.showRadial(selected.case_id):workspace.openForCase(selected.case_id,OFFICE_WORKSPACE_DESTINATIONS[id])};
}

// A small controller reused by the map: names and IDs only come from the current catalog.
// Rechecks selection after every await, so a removed case or old request cannot open a panel.
export function createOfficeCasePicker({getResidents,onChange=()=>{},openCase=()=>false}){
 let disposed=false,busy=null,notice='',bound=null,unsubscribe=null,epoch=0,catalogKey='';
 const authorized=()=>getResidents()?.getAuthorizedProfiles?.()||[];
 const cases=()=>authorized().filter(p=>p&&p.entity_kind==='case'&&p.id===p.case_id&&typeof p.name==='string').map(p=>({id:p.case_id,name:p.name}));
 const snapshot=()=>({cases:cases(),selected:getResidents()?.getSelection?.()?.case_id||null,busy,notice});
 const emit=()=>{if(!disposed)onChange(snapshot());};
 function bind(){
  if(disposed)return;
  const next=getResidents();if(next!==bound){unsubscribe?.();bound=next;epoch++;busy=null;unsubscribe=bound?.subscribeAuthorizedProfiles?.(()=>{const key=JSON.stringify(cases());if(key!==catalogKey){catalogKey=key;epoch++;busy=null;}emit();});}
  emit();
 }
 async function pick(id){
  const api=getResidents();if(disposed||busy||!cases().some(c=>c.id===id)||!api)return false;
  const own=epoch;busy=id;notice='Validando el proyecto…';emit();
  try{
   if(api.getSelection?.()?.case_id!==id&&!await api.selectCase?.(id))throw Error('not_current');
   if(disposed||own!==epoch||getResidents()!==api||!cases().some(c=>c.id===id)||api.getSelection?.()?.case_id!==id)return false;
   const opened=await openCase(id);
   if(disposed||own!==epoch)return false;
   notice=opened===true?'':'El puesto todavía no está disponible. Puedes volver a intentarlo.';
   return opened===true;
  }catch{if(own===epoch)notice='No se confirmó el acceso a ese proyecto. Vuelve a validar tu sesión.';return false;}
  finally{if(own===epoch){busy=null;emit();}}
 }
 return {bind,pick,snapshot,dispose(){if(disposed)return;disposed=true;epoch++;unsubscribe?.();unsubscribe=null;bound=null;busy=null;}};
}
