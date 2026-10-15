import {avatarPresence} from './avatar-presence.mjs?v=129';

// Compact selection uses the same authorized catalog and opening path as avatar clicks.
export function mountResidentDock({win=window,doc=document}={}){
 const api=win.YodResidentAgents;if(!api||typeof api.getAuthorizedProfiles!=='function'||typeof api.subscribeAuthorizedProfiles!=='function'||doc.getElementById('resident-dock'))return null;
 const root=doc.createElement('nav');root.id='resident-dock';root.setAttribute('aria-label','Elegir autón del despacho');
 const cards=doc.createElement('div');cards.className='resident-dock-cards';
 const notice=doc.createElement('p');notice.className='resident-dock-notice';notice.setAttribute('role','status');
 root.append(cards,notice);doc.getElementById('workspace')?.append(root);
 let room=null,offRoom=null;
 let disposed=false,busy=null,epoch=0,voicePhase='idle',key='',overlay=false,catalogIds='';
 const profiles=()=>api.getAuthorizedProfiles().filter(p=>p&&p.entity_kind==='case'&&p.id===p.case_id);
 function paint(){
  if(disposed)return;
  const catalog=profiles(),selection=api.getSelection(),state=api.snapshot(),focused=doc.activeElement?.dataset?.dockCase;
  const observations=room?.snapshot?.()||[];
  const signature=JSON.stringify([catalog.map(p=>[p.case_id,p.name]),selection?.case_id,state.phase,busy,voicePhase,observations.map(o=>[o.case_id,o.phase,o.checked_at,o.work?.progress])]);
  root.hidden=overlay||!catalog.length;
  if(signature===key)return;key=signature;cards.replaceChildren();
  for(const p of catalog){const card=doc.createElement('div');card.className='resident-dock-card';const b=doc.createElement('button');b.type='button';b.dataset.dockCase=p.case_id;b.setAttribute('aria-pressed',String(p.case_id===selection?.case_id));
   const symbol=doc.createElement('span');symbol.className='resident-dock-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent=p.name.slice(0,1).toUpperCase();
   const info=doc.createElement('span'),name=doc.createElement('b'),status=doc.createElement('small');name.textContent=p.name;
   status.textContent=busy===p.case_id?'Abriendo…':selection?.case_id===p.case_id?(voicePhase==='listening'?'Conversando':state.phase==='standby'?'Voz preparada':state.phase==='observe'?'Consulta':'Puesto seleccionado'):'Abrir puesto';
   const observation=observations.find(o=>o.case_id===p.case_id),presence=avatarPresence({profile:p,observation});
   if(presence){status.textContent=busy===p.case_id?'Abriendo…':presence.progress?presence.progress.ready+'/'+presence.progress.total+' para revisar':presence.label;card.dataset.activity=presence.activity;status.title=presence.label+(presence.observed_at?' · Consultado '+new Date(presence.observed_at).toLocaleTimeString('es-MX'): '');}
   info.append(name,status);b.append(symbol,info);b.disabled=!!busy;
   b.addEventListener('click',()=>void pick(p.case_id));card.append(b);
   const speak=doc.createElement('button');speak.type='button';speak.className='resident-dock-talk';speak.textContent='Hablar';speak.setAttribute('aria-label','Hablar con '+p.name);speak.disabled=!!busy||!['idle','error'].includes(voicePhase);speak.addEventListener('click',()=>void pick(p.case_id,true));card.append(speak);cards.append(card);
  }
  if(focused)cards.querySelectorAll('button').forEach(b=>{if(b.dataset.dockCase===focused)b.focus({preventScroll:true});});
 }
 async function pick(id,startVoice=false){
  if(disposed||busy||!profiles().some(p=>p.case_id===id))return false;
  if(!['idle','error'].includes(voicePhase)&&api.getSelection()?.case_id!==id){notice.textContent='Finaliza la conversación actual antes de cambiar de proyecto.';return false;}
  const own=++epoch;busy=id;notice.textContent='';paint();
  try{const ok=await api.openForCase(id);if(disposed||own!==epoch||!profiles().some(p=>p.case_id===id))return false;if(ok&&startVoice){const fresh=api.getSelection();if(fresh?.case_id===id&&fresh.can_enqueue&&['idle','error'].includes(voicePhase))return await win.YodAgentMenu?.openForCase(id,'conversaciones')||false;notice.textContent='Este puesto permite consulta; la voz no está autorizada.';return false;}if(!ok)notice.textContent='El puesto no se abrió. Reintenta desde su nombre; tu conversación se conserva.';return ok;}
  finally{if(own===epoch){busy=null;paint();}}
 }
 const offCatalog=api.subscribeAuthorizedProfiles(()=>{const ids=JSON.stringify(profiles().map(p=>p.case_id));if(ids!==catalogIds){catalogIds=ids;epoch++;busy=null;}paint();}),offState=api.subscribe(paint);
 const visibility=e=>{overlay=e.detail===true;root.hidden=overlay||!profiles().length;};
 const voice=e=>{voicePhase=e.detail?.phase||'idle';paint();};
 const bindRoom=()=>{if(room===win.YodRoomWork)return;offRoom?.();room=win.YodRoomWork;offRoom=room?.subscribe?.(paint);paint();};win.addEventListener('yod-room-work-ready',bindRoom);bindRoom();
 win.addEventListener('yod-agents-visibility',visibility);win.addEventListener('yod-voice-state',voice);paint();
 function dispose(){if(disposed)return;disposed=true;epoch++;offRoom?.();win.removeEventListener('yod-room-work-ready',bindRoom);offCatalog?.();offState?.();win.removeEventListener('yod-agents-visibility',visibility);win.removeEventListener('yod-voice-state',voice);root.remove();}
 win.addEventListener('pagehide',dispose,{once:true});return {root,pick,dispose};
}
