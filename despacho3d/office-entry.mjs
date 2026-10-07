import {stationIdentity} from './project-station.mjs';
import {workHeadline} from './work-observer.mjs?v=1';

// A view of the authorized selection, never a second registry or a source of permission.
export function entryView(selection,presence={},observation={}){
 if(!selection)return {ready:false,name:'Tu despacho',project:'',status:presence.phase==='reconnecting'?'Recuperando conexión…':presence.phase==='unauthorized'?'Entra a YOD OS para ver tus proyectos.':'Preparando tus proyectos…',detail:'',caseId:null};
 const identity=stationIdentity(selection),same=observation.case_id===selection.case_id;
 return {ready:true,name:identity.name,project:identity.project,caseId:identity.case_id,
  status:same?workHeadline(observation):'Consultando actividad…',
  detail:same&&observation.phase==='ready'?observation.work?.title||'':''};
}
export function mountOfficeEntry({win=window,doc=document}={}){
 const host=doc.getElementById('office-entry'),trigger=doc.getElementById('case-open');
 if(!host||!trigger)return null;
 const name=host.querySelector('[data-entry-name]'),project=host.querySelector('[data-entry-project]'),status=host.querySelector('[data-entry-status]'),detail=host.querySelector('[data-entry-detail]');
 let resident=null,observer=null,stopResident=null,stopObserver=null,disposed=false;
 function paint(){
  if(disposed)return;
  const selection=resident?.getSelection?.(),view=entryView(selection,resident?.snapshot?.(),observer?.snapshot?.());
  const operable=view.ready&&typeof win.YodVoiceWorkspace?.openForCase==='function';
  name.textContent=view.name;project.textContent=view.project===view.name?'':view.project;project.hidden=!project.textContent;
  status.textContent=view.ready&&!operable?'Abriendo puesto…':view.status;detail.textContent=view.detail;detail.hidden=!view.detail;
  host.dataset.caseId=view.caseId||'';host.dataset.ready=String(view.ready);
  trigger.disabled=!operable;trigger.querySelector('.case-number').textContent=view.ready?view.name:'Proyecto';
  trigger.querySelector('[data-entry-action]').textContent=view.ready?'Abrir puesto':resident?.snapshot?.()?.phase==='unauthorized'?'Acceso pendiente':'Validando acceso';
  trigger.setAttribute('aria-label',view.ready?'Abrir puesto de '+view.name:'Proyecto no disponible mientras se valida el acceso');
 }
 function open(){
  const selection=resident?.getSelection?.();if(!selection)return false;
  win.despacho?.closeSheets?.(false);
  return win.YodVoiceWorkspace?.openForCase(selection.case_id,'ppp')||false;
 }
 function bind(){
  if(resident!==win.YodResidentAgents){stopResident?.();resident=win.YodResidentAgents;stopResident=resident?.subscribe?.(paint);}
  if(observer!==win.YodWorkObserver){stopObserver?.();observer=win.YodWorkObserver;stopObserver=observer?.subscribe?.(paint);}
  paint();
 }
 // Capture keeps the same route in both renderers; the old walking shortcut must not fire.
 function click(e){e.preventDefault();e.stopImmediatePropagation();void open();}
 trigger.addEventListener('click',click,true);
 win.addEventListener('yod-voice-workspace-ready',bind);win.addEventListener('yod-residents-ready',bind);win.addEventListener('yod-work-observer-ready',bind);bind();
 const api={open,paint,dispose(){disposed=true;stopResident?.();stopObserver?.();trigger.removeEventListener('click',click,true);win.removeEventListener('yod-voice-workspace-ready',bind);win.removeEventListener('yod-residents-ready',bind);win.removeEventListener('yod-work-observer-ready',bind);}};
 return api;
}
