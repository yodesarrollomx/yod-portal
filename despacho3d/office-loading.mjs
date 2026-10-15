// Presentation only: completion is driven by real runtime events, never a timer.
export function loadingView({scene=false,catalog={phase:'loading',cases:[]},workspace=false}={}){
 const authorized=catalog.phase==='current';
 const stages=[{label:'Oficina',done:scene},{label:'Proyectos autorizados',done:authorized},{label:'Controles',done:workspace}];
 const completed=stages.filter(s=>s.done).length;
 return {stages,completed,total:stages.length,ready:completed===stages.length,
  label:catalog.phase==='unauthorized'?'Valida tu acceso en YOD OS':catalog.phase==='reconnecting'?'Recuperando proyectos · la lectura aún no está confirmada':!scene?'Preparando la oficina':!authorized?'Consultando tus proyectos':!workspace?'Preparando controles':catalog.cases.length?'Tu oficina está lista':'Sin proyectos autorizados',
  blocked:['unauthorized','reconnecting'].includes(catalog.phase)};
}
export function mountOfficeLoading({win=window,doc=document}={}){
 const root=doc.createElement('aside');root.id='office-load-status';root.setAttribute('aria-label','Estado de carga de la oficina');
 const label=doc.createElement('span'),count=doc.createElement('small'),progress=doc.createElement('progress');progress.max=3;progress.setAttribute('aria-label','Etapas completadas');
 root.append(label,count,progress);doc.getElementById('workspace')?.append(root);
 let catalog={phase:'loading',cases:[]},off=null,bound=null;
 function paint(){const v=loadingView({scene:!!win.despacho,catalog,workspace:!!win.YodVoiceWorkspace});label.textContent=v.label;count.textContent=v.completed+' de '+v.total+' etapas · '+v.stages.filter(s=>!s.done).map(s=>s.label).join(' / ');progress.value=v.completed;root.dataset.blocked=String(v.blocked);root.hidden=v.ready;root.setAttribute('aria-busy',String(!v.ready&&!v.blocked));}
 function bind(){if(bound!==win.YodResidentAgents){off?.();bound=win.YodResidentAgents;off=bound?.subscribeCatalog?.(s=>{catalog=s;paint();});}paint();}
 const events=['yod-office-ready','yod-residents-ready','yod-voice-workspace-ready'];events.forEach(e=>win.addEventListener(e,bind));bind();
 const dispose=()=>{off?.();events.forEach(e=>win.removeEventListener(e,bind));root.remove();};win.addEventListener('pagehide',dispose,{once:true});return {paint,dispose};
}
if(typeof window!=='undefined')mountOfficeLoading();
