import {stationIdentity} from './project-station.mjs';
export const MENU_SECTORS=[['ppp','PPP'],['conversaciones','Hablar'],['pendientes','Trabajo'],['notas','Expediente']];
export const STATUS={queued:'En cola',running:'Trabajando',ready_for_review:'Para tu revisión',awaiting_data:'Faltan datos',stopped:'Detenido',completed:'Revisado'};
export function projectMenu(conversation,goals){return {documents:conversation?.documents||[],history:conversation?.events||[],messages:conversation?.messages||[],goals:goals?.goals||[],ppp:(conversation?.documents||[]).filter(d=>/\bppp\b|plan de potencial/i.test(d.title+' '+d.role))};}
export const RADIAL_OPTIONS={
 ppp:[['ppp','Abrir tablero','El mismo plan de potencial'],['knowledge','Versiones y variantes','Comparar lo registrado']],
 conversaciones:[['conversaciones','Hablar por voz','Activa el micrófono'],['chat','Escribir','Conversación e historial']],
 pendientes:[['pendientes','Ver pendientes','Objetivos y próximos pasos'],['activity','Trabajo actual','Avance y siguiente paso']],
 notas:[['documentos','Fuentes del expediente','Documentos del proyecto'],['notas','Notas y versiones','Decisiones y conocimiento']]
};
export function sectorPath(index){
 const point=(r,a)=>[200+r*Math.sin(a),200-r*Math.cos(a)];
 const a=index*Math.PI/2-Math.PI/4+.025,b=a+Math.PI/2-.05;
 const p=point(184,a),q=point(184,b),s=point(80,b),t=point(80,a);
 return 'M'+p+' A184 184 0 0 1 '+q+' L'+s+' A80 80 0 0 0 '+t+' Z';
}
export function mountAgentMenu({win=window,doc=document}={}){
 if(win.YodAgentMenu)return true;
 const open=doc.getElementById('circulo-open');if(!open)return false;
 const dialog=doc.createElement('dialog');dialog.className='agent-menu station-radial';dialog.setAttribute('aria-labelledby','agent-menu-title');doc.body.append(dialog);
 let proximityMode=false;
 let selection=null,previousFocus=null,unsubscribe=null,unsubscribeCatalog=null,bound=null,sector='ppp',selectSector=()=>{},pendingCase=null,pendingEpoch=0;
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,click)=>{const n=el('button',text);n.type='button';n.addEventListener('click',click);return n;};
 const visible=()=>win.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:(dialog.open&&!proximityMode)||!!win.YodVoiceWorkspace?.isOpen()}));
 function close(reason='dismiss'){const id=selection?.case_id||pendingCase;pendingCase=null;pendingEpoch++;if(id&&reason==='dismiss')win.dispatchEvent(new CustomEvent('yod-agent-encounter-dismiss',{detail:{case_id:id}}));selection=null;proximityMode=false;if(dialog.open)dialog.close();dialog.replaceChildren();visible();if(previousFocus?.isConnected)previousFocus.focus?.({preventScroll:true});}

 // A click acknowledges the chosen resident immediately; it never grants project access.
 function pendingProfile(caseId){return win.YodResidentAgents?.getAuthorizedProfiles?.().find(p=>p.case_id===caseId&&p.id===caseId&&p.entity_kind==='case');}
 function showPending(caseId,{message=null,retry=false}={}){
  const profile=pendingProfile(caseId);if(!profile)return false;
  const ticket=++pendingEpoch;pendingCase=caseId;selection=null;selectSector=()=>{};proximityMode=false;dialog.classList.remove('proximity-radial');
  if(!dialog.open)previousFocus=doc.activeElement;dialog.replaceChildren();
  const exit=button('×',()=>close());exit.className='radial-close';exit.setAttribute('aria-label','Cerrar opciones');
  const title=el('h1',profile.name);title.id='agent-menu-title';
  const status=el('p',message||'Preparando su puesto…','radial-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  dialog.append(exit,el('p','PUESTO DEL PROYECTO','radial-eyebrow'),title,status);
  if(retry){const again=button('Volver a intentar',()=>void win.YodResidentAgents?.openForCase(caseId));again.className='radial-retry';dialog.append(again);}
  else if(message){dialog.append(button('Volver a la conversación',()=>close('transition')));}
  else{
   const wheel=el('div',undefined,'station-wheel');wheel.setAttribute('aria-busy','true');
   const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 400 400');svg.setAttribute('aria-hidden','true');wheel.append(svg);
   for(const [i,[id,label]]of MENU_SECTORS.entries()){const path=doc.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',sectorPath(i));path.setAttribute('class','radial-sector');svg.append(path);const option=button(label,()=>{});option.dataset.sector=id;option.disabled=true;wheel.append(option);}
   const center=el('div',undefined,'station-wheel-center');center.append(el('span',profile.name.slice(0,1).toUpperCase(),'station-avatar'),el('span','Conectando…'));wheel.append(center);dialog.append(wheel);
  }
  if(!message)dialog.append(el('p','Puedes cerrar esta ventana mientras se prepara el acceso.','radial-footnote'));
  if(!dialog.open)dialog.showModal();visible();exit.focus({preventScroll:true});
  win.dispatchEvent(new CustomEvent('yod-agent-menu-open',{detail:{case_id:caseId,proximity:false,pending:true}}));
  return ticket;
 }
 function pending(caseId,ticket){return dialog.open&&pendingCase===caseId&&pendingEpoch===ticket;}

 async function openForCase(caseId,target='ppp'){
  const fresh=win.YodResidentAgents?.getSelection?.();
  if(!fresh||fresh.case_id!==caseId)return false;
  if(target==='conversaciones'&&!fresh.can_enqueue)return false;
  if(typeof win.YodVoiceWorkspace?.openForCase!=='function'){
   if(dialog.open){let notice=dialog.querySelector('.radial-status');if(!notice){notice=el('p','','radial-status');notice.setAttribute('role','status');dialog.append(notice);}notice.textContent='El puesto se está cargando. Vuelve a elegir la opción en un momento.';}
   return false;
  }
  const tabs={ppp:'ppp',pendientes:'tasks',documentos:'sources',conversaciones:'ppp',chat:'ppp',notas:'knowledge',moac:'tasks',historial:'knowledge'};
  if(dialog.open)close('transition');
  const ok=await win.YodVoiceWorkspace?.openForCase(caseId,tabs[target]||target,{startVoice:target==='conversaciones',compactOnly:target==='conversaciones'});
  if(ok&&target==='chat'&&win.YodResidentAgents?.getSelection?.()?.case_id===caseId){
   const chat=doc.querySelector('.realtime-dialog .station-chat');if(chat){chat.open=true;chat.querySelector('textarea')?.focus();}
  }
  return ok||false;
 }
 function showRadial(caseId,{proximity=false}={}){
  const fresh=win.YodResidentAgents?.getSelection?.();if(!fresh||fresh.case_id!==caseId||!fresh.avatar)return false;
  if(dialog.open&&selection?.case_id===caseId)return true;
  proximityMode=proximity;dialog.classList.toggle('proximity-radial',proximityMode);
  if(!dialog.open)previousFocus=doc.activeElement;pendingCase=null;pendingEpoch++;selection=fresh;sector='ppp';const identity=stationIdentity(fresh);
  dialog.replaceChildren();const closeButton=button('×',()=>close());closeButton.className='radial-close';closeButton.setAttribute('aria-label','Cerrar opciones');dialog.append(closeButton);
  const title=el('h1',identity.name);title.id='agent-menu-title';
  dialog.append(el('p','PUESTO DEL PROYECTO','radial-eyebrow'),title,el('p',identity.project,'radial-project'));
  const wheel=el('div',undefined,'station-wheel'),svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 400 400');svg.setAttribute('aria-hidden','true');wheel.append(svg);
  const center=el('div',undefined,'station-wheel-center');center.append(el('span',identity.name.slice(0,1).toUpperCase(),'station-avatar'),el('span','Elige una dirección'));wheel.append(center);
  const submenu=el('section',undefined,'radial-submenu');submenu.setAttribute('aria-label','Opciones del sector');
  const subtitle=el('h2'),choices=el('div',undefined,'radial-options');submenu.append(subtitle,choices);
  const buttons=[],paths=[],icons=['▤','◉','✓','▧'];
  function select(id){
   if(id===sector&&choices.childElementCount)return;
   const restoreFocus=choices.contains(doc.activeElement);
   sector=id;const label=MENU_SECTORS.find(([k])=>k===id)[1];subtitle.textContent=label;
   buttons.forEach((b,i)=>{const on=MENU_SECTORS[i][0]===id;b.setAttribute('aria-pressed',String(on));paths[i].classList.toggle('selected',on);});
   choices.replaceChildren(...RADIAL_OPTIONS[id].map(([target,label,detail])=>{
    const b=button('',()=>void openForCase(caseId,target));b.dataset.action=target;
    b.append(el('b',label),el('small',detail));
    if(target==='conversaciones'&&!selection.can_enqueue){b.disabled=true;b.querySelector('small').textContent='Acceso de consulta';}
    return b;
   }));
   if(restoreFocus)buttons[MENU_SECTORS.findIndex(([key])=>key===id)].focus({preventScroll:true});
  }
  selectSector=select;
  MENU_SECTORS.forEach(([id,label],i)=>{
   const path=doc.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',sectorPath(i));path.setAttribute('class','radial-sector');svg.append(path);paths.push(path);
   path.addEventListener('pointerenter',()=>select(id));path.addEventListener('click',()=>{select(id);choices.querySelector('button')?.focus();});
   const b=button('',()=>{select(id);choices.querySelector('button')?.focus();});b.dataset.sector=id;b.setAttribute('aria-label',label);b.setAttribute('aria-controls','radial-options');
   b.append(el('span',icons[i],'radial-icon'),el('span',label));b.addEventListener('pointerenter',()=>select(id));b.addEventListener('focus',()=>select(id));buttons.push(b);wheel.append(b);
  });
  choices.id='radial-options';
  dialog.append(wheel,submenu,el('p','Apunta o usa las flechas · Elige una opción para abrir · Esc para salir','radial-footnote'));
  select(sector);if(!dialog.open){if(proximityMode)dialog.show();else dialog.showModal();}visible();
  if(proximityMode)dialog.querySelector('.radial-footnote').textContent='Acércate un poco más y detente para hablar · WASD para caminar';
  win.dispatchEvent(new CustomEvent('yod-agent-menu-open',{detail:{case_id:caseId,proximity:proximityMode}}));
  if(proximityMode){previousFocus?.focus?.({preventScroll:true});}else buttons[0].focus({preventScroll:true});return true;
 }
 open.textContent='Opciones del autón';open.hidden=true;open.addEventListener('click',()=>showRadial(win.YodResidentAgents?.getSelection?.()?.case_id));
 function bind(){const resident=win.YodResidentAgents;if(!resident||bound===resident)return;unsubscribe?.();unsubscribeCatalog?.();bound=resident;unsubscribeCatalog=resident.subscribeAuthorizedProfiles?.(()=>{if(pendingCase&&!pendingProfile(pendingCase))close('revoked');});unsubscribe=resident.subscribe(()=>{
  const fresh=resident.getSelection();open.hidden=!fresh?.avatar;
  if(selection&&(selection.case_id!==fresh?.case_id||selection.can_enqueue!==fresh.can_enqueue))close();
 });}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('keydown',e=>{
  const directions={ArrowUp:'ppp',ArrowRight:'conversaciones',ArrowDown:'pendientes',ArrowLeft:'notas'};
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
  if(proximityMode&&['w','a','s','d','W','A','S','D'].includes(e.key))return;
  if(directions[e.key]){e.preventDefault();selectSector(directions[e.key]);dialog.querySelector('[data-sector="'+directions[e.key]+'"]').focus();}
 });
 win.addEventListener('yod-residents-ready',bind);bind();
 win.addEventListener('pagehide',()=>{unsubscribe?.();unsubscribeCatalog?.();dialog.remove();delete win.YodAgentMenu;});
 win.YodAgentMenu={openForCase,showRadial,showPending,isPending:pending,isOpen:()=>dialog.open,isProximity:()=>dialog.open&&proximityMode,close};win.dispatchEvent(new CustomEvent('yod-agent-menu-ready'));return true;
}
