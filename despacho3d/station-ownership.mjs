// Read-only projection of validated, authorized observations. Selected UI case is never an input.
export function observedStation(state,now=Date.now()){
 if(state?.phase!=='ready'||!state.case_id||state.work?.case_id!==state.case_id||!Number.isFinite(state.checked_at)||now<state.checked_at||now-state.checked_at>90000)return null;
 const w=state.work,r=state.runtime?.phase;
 if(r&&['starting','waiting_capacity','reconnecting','unavailable','disabled','stopped'].includes(r))return null;
 if(['prepared','awaiting_data'].includes(w.phase))return !r||r==='review_required'||r==='ready'?'meeting':null;
 if(!['working','tool'].includes(w.phase)||r&&r!=='working')return null;
 const tool=w.current_tool||'',last=w.events?.at(-1);
 if(/drive|document|biblioteca|hoja|pdf/i.test(tool))return 'library';
 if(/navegador|web|página|pantalla|browser/i.test(tool))return 'research';
 if(['drive_leer','drive_inspeccionar_pdf','drive_buscar','drive_listar'].includes(last?.tool))return 'library';
 if(['navegador_abrir','navegador_desplazar','navegador_consultar'].includes(last?.tool))return 'research';
 const source=w.sources?.at(-1);
 return source?.kind==='document'?'library':source?.kind==='web'?'research':null;
}
export function assignStationOwners(states,{now=Date.now(),profiles=[],occupants=null}={}){
 const names=new Map(profiles.filter(p=>p?.case_id===p?.id&&p.entity_kind==='case').map(p=>[p.case_id,p.name]));
 const result={library:null,research:null,meeting:null};
 const candidates=(states||[]).filter(s=>observedStation(s,now)).sort((a,b)=>Date.parse(b.work.updated_at)-Date.parse(a.work.updated_at)||a.case_id.localeCompare(b.case_id));
 for(const state of candidates){
  const station=observedStation(state,now);if(result[station])continue;
  // Optional physical occupancy prevents showing an arrival before a character gets there.
  if(occupants&& !occupants.some(p=>p.case_id===state.case_id&&p.station===station&&p.moving!==true))continue;
  result[station]={...state,surface:station,projectName:names.get(state.case_id)||'Autón',
   station_owner:{case_id:state.case_id,run_id:state.work.run_id,goal_id:state.work.goal_id,updated_at:state.work.updated_at}};
 }
 return result;
}
