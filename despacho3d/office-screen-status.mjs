// Projection of already authorized observations. Counts are review states, not approvals.
export function screenStatus(state){
 const work=state.work,progress=work?.progress?.progress,tasks=progress?.tasks||[];
 const review=tasks.filter(t=>t.status==='ready_for_review').length;
 const blocked=tasks.filter(t=>t.status==='blocked').length;
 const running=tasks.find(t=>t.status==='running'),pending=tasks.find(t=>t.status==='pending');
 const current=running||tasks.find(t=>t.status==='blocked')||pending;
 return {title:state.projectName||work?.title||'Puesto del proyecto',
  objective:work?.title|| (state.phase==='ready'?'Sin ejecución registrada':'Consultando el registro de trabajo'),
  counts:tasks.length?review+'/'+tasks.length+' para revisar'+(blocked?' · '+blocked+' bloqueadas':''):'',
  detail:current?.title||work?.result?.summary||progress?.summary||(work?'Revisa el resultado con el autón':''),
  note:work?'Registro · '+new Date(work.updated_at).toLocaleTimeString():'Sin actividad confirmada todavía',
  review,total:tasks.length,blocked};
}
