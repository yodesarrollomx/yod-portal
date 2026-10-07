import {createFrameTransport} from './conversation.mjs';
import {createResidentAgents} from './resident-agents.mjs?v=2';
const host=document.getElementById('resident-agent');
if(host){
 const transport=createFrameTransport(window);
 const label=host.querySelector('[data-resident-status]'),caseName=host.querySelector('[data-resident-case]'),
  talk=host.querySelector('[data-resident-talk]'),write=host.querySelector('[data-resident-write]'),visit=host.querySelector('[data-resident-visit]');
 const notices={loading:'Preparando tu despacho…',preparing:'Preparando conversación…',standby:'En espera · disponible',observe:'Disponible para consultar',offline:'Presente · sin conexión',reconnecting:'Recuperando conexión…',unauthorized:'Valida tu acceso a YOD OS'};
 let voicePhase='idle',panel=false;
 const resident=createResidentAgents({transport,onChange:paint,isVisible:()=>!document.hidden});
 function paint(state){
  const active=!['idle','error'].includes(voicePhase),sel=state.selection;
  host.hidden=true;if(host.querySelector('h2'))host.querySelector('h2').textContent=sel?.avatar?.name||sel?.name||'Autón';
  host.dataset.state=active?'talking':state.phase;
  label.textContent=active?(voicePhase==='listening'?'Conversando contigo':voicePhase==='reconnecting'?'Recuperando voz…':voicePhase==='closing'?'Guardando conversación…':'Conectando voz…'):notices[state.phase];
  caseName.textContent=sel?.name||'Tu expediente autorizado se prepara al entrar.';
  const operable=!!resident?.getSelection?.();
  talk.disabled=!(operable&&sel.can_enqueue)||active;
  write.disabled=!operable;visit.disabled=!sel?.avatar||!window.despacho;
 }
 // Use the same canonical profile contract as the scene's pilot.
 const api={...resident,openForCase(id){
  const selection=resident.getSelection();
  if(!selection||selection.case_id!==id)return false;
  if(window.YodAgentMenu)return window.YodAgentMenu.showRadial(id);
  const panel=window.CubefarmYOD;if(!panel)return false;
  const current=panel.getProfile?.();
  if(current&&current.case_id!==id){void resident.refresh();return false;}
  return panel.open('chat');
 }};
 window.YodResidentAgents=api;
 window.dispatchEvent(new CustomEvent('yod-residents-ready',{detail:null}));
 talk.onclick=()=>document.getElementById('voice-open')?.click();
 write.onclick=()=>window.CubefarmYOD?.open('chat');
 visit.onclick=async()=>{if(resident.getSelection()?.avatar&&window.despacho)await window.despacho.visit('case');};
 window.addEventListener('yod-voice-state',e=>{
  voicePhase=e.detail?.phase||'idle';paint(resident.snapshot());
  window.despacho?.setAgentActivity?.(voicePhase==='listening'?'talk':'sit');
 });
 window.addEventListener('yod-agents-visibility',e=>{panel=e.detail===true;host.hidden=true;});
 window.addEventListener('yod-agents-ready',()=>paint(resident.snapshot()));
 window.addEventListener('yod-office-ready',()=>paint(resident.snapshot()));
 window.addEventListener('online',()=>{void resident.refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void resident.refresh();});
 window.addEventListener('pagehide',()=>{resident.dispose();transport.dispose();delete window.YodResidentAgents;});
 void resident.refresh();
}
