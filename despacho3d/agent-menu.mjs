import {stationIdentity} from './project-station.mjs';
export const MENU_SECTORS=[['ppp','Plan de potencial'],['conversaciones','Hablar'],['pendientes','Pendientes'],['notas','Notas']];
export const STATUS={queued:'En cola',running:'Trabajando',ready_for_review:'Para tu revisión',awaiting_data:'Faltan datos',stopped:'Detenido',completed:'Revisado'};
export function projectMenu(conversation,goals){return {documents:conversation?.documents||[],history:conversation?.events||[],messages:conversation?.messages||[],goals:goals?.goals||[],ppp:(conversation?.documents||[]).filter(d=>/\bppp\b|plan de potencial/i.test(d.title+' '+d.role))};}
export const RADIAL_OPTIONS={
 ppp:[['ppp','Abrir tablero','El mismo plan de potencial'],['knowledge','Versiones y variantes','Comparar lo registrado']],
 conversaciones:[['conversaciones','Hablar por voz','Activa el micrófono'],['chat','Escribir','Conversación e historial']],
 pendientes:[['pendientes','Ver pendientes','Objetivos y próximos pasos'],['activity','Ver trabajo actual','Actividad del autón']],
 notas:[['notas','Notas y decisiones','Conocimiento del expediente'],['documentos','Ver fuentes','Documentos del proyecto']]
};
export function sectorPath(index){
 const point=(r,a)=>[200+r*Math.sin(a),200-r*Math.cos(a)];
 const a=index*Math.PI/2-Math.PI/4+.025,b=a+Math.PI/2-.05;
 const p=point(184,a),q=point(184,b),s=point(80,b),t=point(80,a);
 return 'M'+p+' A184 184 0 0 1 '+q+' L'+s+' A80 80 0 0 0 '+t+' Z';
}
export function mountAgentMenu({win=window,doc=document}={}){
 const open=doc.getElementById('circulo-open');if(!open)return false;
 const dialog=doc.createElement('dialog');dialog.className='agent-menu station-radial';dialog.setAttribute('aria-labelledby','agent-menu-title');doc.body.append(dialog);
 let selection=null,previousFocus=null,unsubscribe=null,bound=null,sector='ppp',selectSector=()=>{};
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,click)=>{const n=el('button',text);n.type='button';n.addEventListener('click',click);return n;};
 const visible=()=>win.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:dialog.open||!!win.YodVoiceWorkspace?.isOpen()}));
 function close(){selection=null;if(dialog.open)dialog.close();dialog.replaceChildren();visible();if(previousFocus?.isConnected)previousFocus.focus?.({preventScroll:true});}
 async function openForCase(caseId,target='ppp'){
  const fresh=win.YodResidentAgents?.getSelection?.();
  if(!fresh||fresh.case_id!==caseId)return false;
  if(target==='conversaciones'&&!fresh.can_enqueue)return false;
  const tabs={ppp:'ppp',pendientes:'tasks',documentos:'sources',conversaciones:'ppp',chat:'activity',notas:'knowledge',moac:'tasks',historial:'knowledge'};
  if(dialog.open)close();
  const ok=await win.YodVoiceWorkspace?.openForCase(caseId,tabs[target]||target,{startVoice:target==='conversaciones'});
  if(ok&&target==='chat'&&win.YodResidentAgents?.getSelection?.()?.case_id===caseId){
   const chat=doc.querySelector('.realtime-dialog .station-chat');if(chat){chat.open=true;chat.querySelector('textarea')?.focus();}
  }
  return ok||false;
 }
 function showRadial(caseId){
  const fresh=win.YodResidentAgents?.getSelection?.();if(!fresh||fresh.case_id!==caseId||!fresh.avatar)return false;
  if(dialog.open&&selection?.case_id===caseId)return true;
  selection=fresh;sector='ppp';const identity=stationIdentity(fresh);previousFocus=doc.activeElement;
  dialog.replaceChildren();const closeButton=button('×',close);closeButton.className='radial-close';closeButton.setAttribute('aria-label','Cerrar opciones');dialog.append(closeButton);
  const title=el('h1',identity.name);title.id='agent-menu-title';
  dialog.append(el('p','PUESTO DEL PROYECTO','radial-eyebrow'),title,el('p',identity.project,'radial-project'));
  const wheel=el('div',undefined,'station-wheel'),svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 400 400');svg.setAttribute('aria-hidden','true');wheel.append(svg);
  const center=el('div',undefined,'station-wheel-center');center.append(el('span',identity.name.slice(0,1).toUpperCase(),'station-avatar'),el('span','Elige una dirección'));wheel.append(center);
  const submenu=el('section',undefined,'radial-submenu');submenu.setAttribute('aria-label','Opciones del sector');
  const subtitle=el('h2'),choices=el('div',undefined,'radial-options');submenu.append(subtitle,choices);
  const buttons=[],paths=[],icons=['▤','◉','✓','▧'];
  function select(id){
   sector=id;const label=MENU_SECTORS.find(([k])=>k===id)[1];subtitle.textContent=label;
   buttons.forEach((b,i)=>{const on=MENU_SECTORS[i][0]===id;b.setAttribute('aria-pressed',String(on));paths[i].classList.toggle('selected',on);});
   choices.replaceChildren(...RADIAL_OPTIONS[id].map(([target,label,detail])=>{
    const b=button('',()=>void openForCase(caseId,target));b.dataset.action=target;
    b.append(el('b',label),el('small',detail));
    if(target==='conversaciones'&&!selection.can_enqueue){b.disabled=true;b.querySelector('small').textContent='Acceso de consulta';}
    return b;
   }));
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
  select(sector);if(!dialog.open)dialog.showModal();visible();
  win.dispatchEvent(new CustomEvent('yod-agent-menu-open',{detail:{case_id:caseId}}));
  buttons[0].focus({preventScroll:true});return true;
 }
 open.textContent='Opciones del autón';open.hidden=true;open.addEventListener('click',()=>showRadial(win.YodResidentAgents?.getSelection?.()?.case_id));
 function bind(){const resident=win.YodResidentAgents;if(!resident||bound===resident)return;unsubscribe?.();bound=resident;unsubscribe=resident.subscribe(()=>{
  const fresh=resident.getSelection();open.hidden=!fresh?.avatar;
  if(selection&&(selection.case_id!==fresh?.case_id||selection.can_enqueue!==fresh.can_enqueue))close();
 });}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('keydown',e=>{
  const directions={ArrowUp:'ppp',ArrowRight:'conversaciones',ArrowDown:'pendientes',ArrowLeft:'notas'};
  if(directions[e.key]){e.preventDefault();selectSector(directions[e.key]);dialog.querySelector('[data-sector="'+directions[e.key]+'"]').focus();}
 });
 win.addEventListener('yod-residents-ready',bind);bind();
 win.addEventListener('pagehide',()=>{unsubscribe?.();dialog.remove();delete win.YodAgentMenu;});
 win.YodAgentMenu={openForCase,showRadial,isOpen:()=>dialog.open,close};win.dispatchEvent(new CustomEvent('yod-agent-menu-ready'));return true;
}
