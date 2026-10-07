import {stationIdentity} from './project-station.mjs';
export const MENU_SECTORS=[['ppp','Plan de potencial'],['conversaciones','Conversar'],['pendientes','Pendientes'],['documentos','Fuentes']];
export const STATUS={queued:'En cola',running:'Trabajando',ready_for_review:'Para tu revisión',awaiting_data:'Faltan datos',stopped:'Detenido',completed:'Revisado'};
export function projectMenu(conversation,goals){return {documents:conversation?.documents||[],history:conversation?.events||[],messages:conversation?.messages||[],goals:goals?.goals||[],ppp:(conversation?.documents||[]).filter(d=>/\bppp\b|plan de potencial/i.test(d.title+' '+d.role))};}
export function mountAgentMenu({win=window,doc=document}={}){
 const open=doc.getElementById('circulo-open');if(!open)return false;
 const dialog=doc.createElement('dialog');dialog.className='agent-menu station-radial';dialog.setAttribute('aria-labelledby','agent-menu-title');doc.body.append(dialog);
 let selection=null,previousFocus=null,unsubscribe=null,bound=null;
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,click)=>{const n=el('button',text);n.type='button';n.addEventListener('click',click);return n;};
 const visible=()=>win.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:dialog.open||!!win.YodVoiceWorkspace?.isOpen()}));
 function close(){selection=null;dialog.close();visible();previousFocus?.focus?.();}
 function openForCase(caseId,target='activity'){
  const fresh=win.YodResidentAgents?.getSelection?.();
  if(!fresh||fresh.case_id!==caseId)return false;
  const tabs={ppp:'ppp',pendientes:'tasks',documentos:'sources',conversaciones:'activity',moac:'tasks',historial:'sources'};
  if(dialog.open)close();
  return win.YodVoiceWorkspace?.openForCase(caseId,tabs[target]||target,{startVoice:target==='conversaciones'})||false;
 }
 function showRadial(caseId){
  const fresh=win.YodResidentAgents?.getSelection?.();if(!fresh||fresh.case_id!==caseId)return false;
  selection=fresh;const identity=stationIdentity(fresh);previousFocus=doc.activeElement;
  dialog.replaceChildren();const closeButton=button('×',close);closeButton.className='radial-close';closeButton.setAttribute('aria-label','Cerrar opciones');dialog.append(closeButton);
  const title=el('h1',identity.project);title.id='agent-menu-title';dialog.append(el('p','ELIGE CÓMO TRABAJAR','radial-eyebrow'),title);
  const wheel=el('div',undefined,'station-wheel'),center=el('div',undefined,'station-wheel-center');
  const symbol=el('span',identity.name.slice(0,1).toUpperCase(),'station-avatar');center.append(symbol,el('b',identity.name));wheel.append(center);
  const icons=['▤','◌','✓','▱'];
  MENU_SECTORS.forEach(([id,label],i)=>{const b=button('',()=>openForCase(caseId,id));b.dataset.sector=id;b.append(el('span',icons[i],'radial-icon'),el('span',label));wheel.append(b);});
  dialog.append(wheel,el('p','Un proyecto · un puesto · el mismo historial','radial-footnote'));
  if(!dialog.open)dialog.showModal();visible();return true;
 }
 open.textContent='Mi puesto';open.hidden=true;open.addEventListener('click',()=>void openForCase(win.YodResidentAgents?.getSelection?.()?.case_id));
 function bind(){const resident=win.YodResidentAgents;if(!resident||bound===resident)return;unsubscribe?.();bound=resident;unsubscribe=resident.subscribe(()=>{const fresh=resident.getSelection();open.hidden=!fresh?.avatar;if(selection&&selection.case_id!==fresh?.case_id)close();});}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key))return;const buttons=[...dialog.querySelectorAll('[data-sector]')],index=buttons.indexOf(doc.activeElement);e.preventDefault();buttons[(index+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:3)+4)%4].focus();});
 win.addEventListener('yod-residents-ready',bind);bind();
 win.addEventListener('pagehide',()=>{unsubscribe?.();dialog.remove();delete win.YodAgentMenu;});
 win.YodAgentMenu={openForCase,showRadial};return true;
}
