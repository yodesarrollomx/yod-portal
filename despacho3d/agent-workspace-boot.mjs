// Compatibility entry: all routes open the same station and preserve its draft.
const button=document.getElementById('computer-open');
function openForCase(id,tab='ppp'){
 const selection=window.YodResidentAgents?.getSelection?.();
 if(!selection||selection.case_id!==id)return false;
 return window.YodVoiceWorkspace?.openForCase(id,tab)||false;
}
if(button){button.onclick=()=>openForCase(window.YodResidentAgents?.getSelection?.()?.case_id);button.hidden=true;}
window.YodAgentWorkspace={openForCase};
window.addEventListener('pagehide',()=>{delete window.YodAgentWorkspace;});
