// A destination is a projection of observed work, never a task executor.
export function workDestination(state,now=Date.now()){
 if(state?.phase!=='ready'||!Number.isFinite(state.checked_at)||now-state.checked_at>90000||now<state.checked_at)return null;
 const w=state.work;if(!w)return 'inicio';
 if(['prepared','awaiting_data'].includes(w.phase))return 'decisions';
 if(!['working','tool'].includes(w.phase))return 'inicio';
 const last=w.events?.at(-1);const activity=w.current_tool||(['drive_leer','drive_inspeccionar_pdf','drive_buscar','drive_listar'].includes(last?.tool)?'documento':'');
 if(/drive|document|biblioteca|hoja/i.test(activity))return 'library';
 return 'inicio';
}
export function createResidentMotion({pilot,navigate,now=Date.now}){
 let observation=null,lastAttempt=-Infinity;
 return {observe(value){observation=value;},
 update(time,{hidden=false,overlay=false,reducedMotion=false}={}){
  if(hidden||overlay)return false;
  const destination=workDestination(observation,now()),p=pilot.getMovementState();
  if(!destination||p.motion==='walk'||p.place===destination||time-lastAttempt<3000)return false;
  lastAttempt=time;return navigate(destination,{immediate:reducedMotion})===true;
 }};
}
