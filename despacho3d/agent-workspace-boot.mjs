import {createWorkspace} from './agent-workspace.mjs?v=3';
const button=document.getElementById('computer-open');
if(button){
 const dialog=document.createElement('dialog');dialog.className='workspace-dialog';dialog.setAttribute('aria-label','Puesto de Gastón');
 const header=document.createElement('header'),title=document.createElement('h1'),close=document.createElement('button'),talk=document.createElement('button');
 title.textContent='Puesto de Gastón';close.textContent='Cerrar';close.type='button';talk.textContent='Hablar aquí';talk.type='button';header.append(title,talk,close);dialog.append(header);document.body.append(dialog);
 const workspace=createWorkspace({container:dialog,getSelection:()=>window.YodResidentAgents?.getSelection?.()});
 function dismiss(){workspace.setActive(false);dialog.close();button.focus();}
 close.onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
 talk.onclick=()=>{const id=window.YodResidentAgents?.getSelection?.()?.case_id,tab=workspace.getTab();dismiss();if(window.YodVoiceWorkspace?.openForCase)void window.YodVoiceWorkspace.openForCase(id,tab,{startVoice:true});else document.getElementById('voice-open')?.click();};
 function openForCase(id,tab='browser'){
  const selection=window.YodResidentAgents?.getSelection?.();if(!selection||selection.case_id!==id)return false;
  if(window.YodVoiceWorkspace?.openForCase){void window.YodVoiceWorkspace.openForCase(id,tab);return true;}
  if(window.YodVoiceWorkspace?.isOpen()){window.YodVoiceWorkspace.show(tab);return true;}
  if(!dialog.open)dialog.showModal();workspace.open(selection,tab);return true;
 }
 button.onclick=()=>openForCase(window.YodResidentAgents?.getSelection?.()?.case_id);
 const bind=()=>window.YodResidentAgents?.subscribe(()=>{button.disabled=!window.YodResidentAgents?.getSelection?.();if(dialog.open&&!window.YodResidentAgents?.getSelection?.())dismiss();});
 button.disabled=true;window.addEventListener('yod-residents-ready',bind);bind();
 window.YodAgentWorkspace={openForCase};window.addEventListener('pagehide',()=>{workspace.dispose();delete window.YodAgentWorkspace;});
}
