import {createFrameTransport,validateConversation} from './conversation.mjs';
import {DurableGoals} from './goals.mjs';
import {trayecto,centro} from './circulo.mjs';
export const MENU_SECTORS=[['pendientes','Pendientes'],['ppp','Tablero PPP'],['historial','Historial'],['moac','Trabajo interno'],['documentos','Documentos'],['conversaciones','Conversaciones']];
export const STATUS={queued:'En cola',running:'Trabajando',ready_for_review:'Para tu revisión',awaiting_data:'Faltan datos',stopped:'Detenido',completed:'Revisado'};
export function projectMenu(conversation,goals){
 return {
  documents:conversation?.documents||[],history:conversation?.events||[],messages:conversation?.messages||[],
  goals:goals?.goals||[],ppp:(conversation?.documents||[]).filter(d=>d.url&&/\bppp\b|plan de potencial/i.test(d.title+' '+d.role))
 };
}
export function mountAgentMenu({win=window,doc=document,transport=createFrameTransport(win)}={}){
 const open=doc.getElementById('circulo-open');if(!open)return false;
 const dialog=doc.createElement('dialog');dialog.className='agent-menu';dialog.setAttribute('aria-labelledby','agent-menu-title');doc.body.append(dialog);
 let selection=null,conversation=null,section='pendientes',generation=0,loading=false,interval=null,previousFocus=null,draft={title:'',instruction:'',criterion:''};
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,click,disabled=false)=>{const n=el('button',text);n.type='button';n.disabled=disabled;n.addEventListener('click',click);return n;};
 const goals=new DurableGoals({transport,getContext:()=>selection?{selection,busy:false}:null,onUnauthorized:()=>close()});
 function close(){generation++;selection=null;conversation=null;clearInterval(interval);interval=null;goals.hide();dialog.close();previousFocus?.focus?.();}
 function outside(tab){close();win.CubefarmYOD?.open(tab);}
 function talk(){close();doc.getElementById('voice-open')?.click();}
 async function refresh(){
  if(loading||!selection||!dialog.open)return;
  loading=true;const own=generation,id=selection.case_id;
  render();
  const results=await Promise.allSettled([transport.read({case_id:id}),goals.read()]);
  if(own!==generation||!dialog.open)return;
  const r=results[0];
  if(r.status==='fulfilled')try{conversation=validateConversation(r.value,id);}catch{conversation=null;}
  else conversation=null;
  loading=false;render();
 }
 async function review(id,action){
  const own=generation;
  const ok=await goals.read();
  if(own!==generation||!ok||!dialog.open)return;
  await goals.review(id,action);
  if(own===generation&&dialog.open){render();win.dispatchEvent(new CustomEvent('yod-goals-changed',{detail:null}));}
 }
 function sourceLink(d){
  const a=el('a','Abrir fuente ↗');a.href=d.url;a.target='_blank';a.rel='noopener noreferrer';return a;
 }
 function render(){
  if(!selection||!dialog.open)return;
  const focused=doc.activeElement?.dataset?.menuFocus;
  const model=projectMenu(conversation,goals.model),frame=el('div',undefined,'agent-menu-layout'),wheel=el('div',undefined,'agent-menu-wheel'),panel=el('div',undefined,'agent-menu-panel');
  const header=el('header');header.append(el('div','Gastón · '+selection.name),button('Cerrar',close));dialog.replaceChildren(header);
  const title=el('h1','Tu agente en el despacho');title.id='agent-menu-title';dialog.append(title);
  const sub=el('p',loading?'Actualizando fuentes y pendientes…':'Consulta el expediente y el avance real.');sub.setAttribute('role','status');dialog.append(sub);
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 400 400');svg.setAttribute('role','group');svg.setAttribute('aria-label','Menú de Gastón');
  const counts={pendientes:goals.model?String(model.goals.filter(g=>g.status!=='completed').length):'…',ppp:model.ppp.length?'↗':'—',historial:conversation?String(model.history.length):'…',moac:goals.model?String(model.goals.reduce((n,g)=>n+g.tasks.length,0)):'…',documentos:conversation?String(model.documents.length):'…',conversaciones:conversation?String(model.messages.length):'…'};
  MENU_SECTORS.forEach(([id,label],i)=>{
   const group=doc.createElementNS(svg.namespaceURI,'g'),path=doc.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',trayecto(i));path.setAttribute('class','circulo-gajo'+(id===section?' selected':''));path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',label);path.setAttribute('aria-pressed',String(id===section));path.dataset.menuFocus=id;
   const choose=()=>{section=id;render();};path.addEventListener('click',choose);path.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();choose();}});
   const point=centro(i);
   for(const [value,y,cls]of [[label,point[1]-2,'circulo-et'],[counts[id],point[1]+16,'circulo-n']]){const t=doc.createElementNS(svg.namespaceURI,'text');t.setAttribute('x',point[0]);t.setAttribute('y',y);t.setAttribute('class',cls);t.textContent=value;group.append(t);}
   group.prepend(path);svg.append(group);
  });
  wheel.append(svg);const nucleus=el('div',undefined,'agent-menu-center');nucleus.append(el('b','Gastón'),button('Hablar',talk,!selection.can_enqueue));wheel.append(nucleus);
  const shortcuts=el('div',undefined,'agent-menu-shortcuts');shortcuts.append(button('Escribir',()=>outside('chat')),button('Biblioteca',()=>{close();doc.querySelector('[data-resident-library]')?.click();}),button('Actualizar',()=>void refresh(),loading));wheel.append(shortcuts);frame.append(wheel,panel);dialog.append(frame);
  panel.append(el('h2',MENU_SECTORS.find(([id])=>id===section)[1]));
  const card=(title,body)=>{const n=el('article',undefined,'circulo-tarjeta');n.append(el('h3',title));if(body)n.append(el('p',body));panel.append(n);return n;};
  if(section==='pendientes'){
   if(!goals.model)panel.append(el('p',goals.notice||'Preparando el registro de pendientes…'));
   if(goals.model&&!model.goals.some(g=>g.status!=='completed'))panel.append(el('p','No hay objetivos abiertos.'));
   if(goals.pending)panel.append(el('p',goals.notice||'Solicitud pendiente de confirmación.'),button('Comprobar la misma solicitud',()=>void goals.retry(),goals.busy));
   for(const g of model.goals.filter(g=>g.status!=='completed')){
    const c=card(g.title,g.summary||g.criterion);c.append(el('small',STATUS[g.status]+' · '+g.updated_at));
    const controls=el('div',undefined,'agent-menu-controls'),disabled=goals.busy||!!goals.pending||loading;
    if(g.status==='ready_for_review')controls.append(button('Marcar como revisado',()=>void review(g.goal_id,'approve'),disabled));
    if(['stopped','awaiting_data'].includes(g.status)||g.can_resume)controls.append(button('Retomar',()=>void review(g.goal_id,'resume'),disabled));
    if(['queued','running','ready_for_review','awaiting_data'].includes(g.status))controls.append(button('Detener tarea',()=>void review(g.goal_id,'stop'),disabled));
    c.append(controls);
    for(const evidence of g.evidence){const d=el('details'),s=el('summary',evidence.title),p=el('pre',evidence.text);d.append(s,p);c.append(d);}
   }
   const form=el('form',undefined,'agent-menu-goal-form');form.append(el('h3','Nuevo objetivo'));
   const inputs={};
   for(const [key,label,max]of [['title','Qué quieres resolver',160],['instruction','Instrucciones para analizar',4000],['criterion','Qué debe entregar',1000]]){const l=el('label',label),input=el(key==='title'?'input':'textarea');input.required=true;input.maxLength=max;input.name=key;input.value=draft[key];input.addEventListener('input',()=>{draft[key]=input.value;});l.append(input);form.append(l);inputs[key]=input;}
   const submit=el('button','Encargar análisis');submit.type='submit';submit.disabled=!selection.can_enqueue||!selection.goals?.ready||goals.busy||!!goals.pending||model.goals.some(g=>!['stopped','completed'].includes(g.status));form.append(submit);
   form.addEventListener('submit',async e=>{e.preventDefault();const request=Object.fromEntries(Object.entries(inputs).map(([k,n])=>[k,n.value]));if(await goals.read()){if(await goals.create(request))draft={title:'',instruction:'',criterion:''};render();}});
   panel.append(form,el('p','El motor lee, analiza y guarda evidencia. Los resultados quedan para tu revisión; terminar la voz no detiene el objetivo.'));
  }else if(section==='moac'){
   panel.append(el('p','Acciones del motor de objetivos de este expediente. Cada resultado conserva su evidencia.'));
   if(!goals.model)panel.append(el('p',goals.notice||'Consultando trabajo…'));
   for(const g of model.goals){const c=card(g.title,STATUS[g.status]);for(const t of g.tasks)c.append(el('p',t.title+' · '+({pending:'Pendiente',running:'Trabajando',ready_for_review:'Con evidencia',blocked:'Faltan datos'}[t.status])),el('small',t.summary||t.criterion));}
   if(goals.model&&!model.goals.length)panel.append(el('p','Todavía no hay objetivos registrados.'));
  }else if(section==='historial'){
   if(!conversation)panel.append(el('p','El historial no está disponible. Puedes actualizar.'));
   for(const event of [...model.history].reverse().slice(0,100))card(event.title,event.body);
   if(conversation&&!model.history.length)panel.append(el('p','No hay eventos registrados.'));
  }else if(section==='documentos'||section==='ppp'){
   const docs=section==='ppp'?model.ppp:model.documents;
   panel.append(el('p',section==='ppp'?'El PPP se consulta en su fuente registrada. La versión vigente y sus cifras se leen allí.':'Fuentes registradas del expediente, con su función original.'));
   if(!conversation)panel.append(el('p','No se pudieron consultar las fuentes. Puedes actualizar.'));
   for(const d of docs){const c=card(d.title,d.role||'Fuente registrada');if(d.url)c.append(sourceLink(d));else c.append(el('p',d.source||'Sin enlace válido registrado.'));}
   if(conversation&&!docs.length)panel.append(el('p',section==='ppp'?'No hay una fuente del PPP identificada en el registro documental.':'No hay documentos registrados.'));
  }else{
   if(!conversation)panel.append(el('p','El historial de conversaciones no está disponible. Puedes actualizar.'));
   for(const m of model.messages.slice(-100)){const c=card(m.role==='user'?'Tú':'Gastón',m.body);c.append(el('small',m.created_at));}
   if(conversation&&!model.messages.length)panel.append(el('p','Todavía no hay mensajes en el historial.'));
   panel.append(button('Continuar por escrito',()=>outside('chat')));
  }
  if(focused)dialog.querySelector('[data-menu-focus="'+focused+'"]')?.focus();
 }
 async function openMenu(caseId){
  const resident=win.YodResidentAgents,fresh=resident?.getSelection?.();
  if(!fresh||fresh.case_id!==caseId)return false;
  if(dialog.open)return true;
  selection=fresh;conversation=null;loading=false;generation++;previousFocus=doc.activeElement;dialog.showModal();render();void refresh();
  interval=setInterval(()=>{if(!doc.hidden&&!dialog.querySelector('.agent-menu-goal-form')?.contains(doc.activeElement))void refresh();},8000);return true;
 }
 goals.subscribe(()=>{if(dialog.open&&!loading)render();});
 open.hidden=true;open.textContent='Menú de Gastón';
 const bind=()=>{const resident=win.YodResidentAgents;if(!resident)return;resident.subscribe(s=>{const fresh=resident.getSelection();open.hidden=!fresh?.avatar;if(selection&&(!fresh||fresh.case_id!==selection.case_id))close();});};
 open.addEventListener('click',()=>void openMenu(win.YodResidentAgents?.getSelection?.()?.case_id));
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 win.addEventListener('yod-residents-ready',bind);bind();
 win.addEventListener('yod-goals-changed',()=>{if(dialog.open)void refresh();});
 win.addEventListener('pagehide',()=>{close();transport.dispose();delete win.YodAgentMenu;});
 win.YodAgentMenu={openForCase:openMenu};return true;
}
