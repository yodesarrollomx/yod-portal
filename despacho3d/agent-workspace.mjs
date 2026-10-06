import {mountKnowledgeBoard} from './knowledge-board.mjs?v=1';
import {createFrameTransport,validateConversation} from './conversation.mjs';
import {validateFastSession} from './fast-lane.mjs';
import {DurableGoals} from './goals.mjs';
export const WORKSPACE_TABS=[['browser','Navegador'],['ppp','PPP compartido'],['tasks','Pendientes'],['sources','Fuentes'],['knowledge','Conocimiento']];
export function taskDisplay(task,parentStatus){
 if(task.status==='running'&&parentStatus==='queued')return 'Pendiente de reanudación';
 if(task.status==='running'&&['stopped','awaiting_data','ready_for_review','completed'].includes(parentStatus))return 'Interrumpida · pendiente de conciliación';
 return {pending:'Pendiente',running:'Trabajando',ready_for_review:'Para revisión',blocked:'Bloqueada'}[task.status]||task.status;
}
export function proposalState(board,proposal,application=null){
 if(application?.request_id===proposal.request_id)return application.status;
 if(!board?.confirmed||board.pending)return 'board_pending';
 if(board.case_id!==proposal.case_id||board.scenario_id!==proposal.scenario_id||board.revision!==proposal.revision)return 'stale';
 return 'ready';
}
export function boardURL(caseId){if(typeof caseId!=='string'||!/^[A-Za-z0-9_.:-]{1,200}$/.test(caseId))throw Error('invalid_case');return 'https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open='+encodeURIComponent(caseId)+'&embed=1&agent=1';}
export function createWorkspace({container,getSelection,transport=createFrameTransport(window),win=window,doc=document,onBoard=()=>{}}){
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(label,click)=>{const b=el('button',label);b.type='button';b.addEventListener('click',click);return b;};
 let selected=null,credential=null,minting=null,disposed=false,timer=null,busy=false,tab='browser',frame=null,nonce=null,board=null,boardRevision=null,conversation=null,proposals=[],generation=0,fetching=false,active=true,lastTaskRead=0,application=null,applyTimer=null;
 const root=el('section',undefined,'agent-workspace');root.setAttribute('aria-label','Puesto de Gastón');
 const nav=el('nav'),notice=el('p','Preparando el puesto…','workspace-status'),body=el('div',undefined,'workspace-body');
 notice.setAttribute('role','status');root.append(nav,notice,body);container.append(root);
 const sections=Object.fromEntries(WORKSPACE_TABS.map(([id,label])=>{const b=button(label,()=>setTab(id));b.dataset.tab=id;nav.append(b);const section=el('section');section.dataset.panel=id;body.append(section);return[id,section];}));
 const knowledge=mountKnowledgeBoard({container:sections.knowledge,request,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,onUnauthorized:()=>clear(),doc,win});
 const browser=sections.browser,form=el('form',undefined,'workspace-address'),address=el('input');address.type='url';address.placeholder='https://…';address.setAttribute('aria-label','Dirección para el navegador de Gastón');address.required=true;
 const go=el('button','Abrir');go.type='submit';form.append(address,go);
 const location=el('p','Ninguna página abierta.','workspace-location'),image=el('img');image.alt='Última captura del navegador de Gastón';image.hidden=true;
 const caption=el('p','Pide a Gastón que abra una página o escribe su dirección.','workspace-caption'),controls=el('div',undefined,'workspace-controls');
 controls.append(button('Subir',()=>void command('navegador_desplazar',{direccion:'arriba'})),button('Bajar',()=>void command('navegador_desplazar',{direccion:'abajo'})),button('Actualizar vista',()=>void refresh()));
 const activity=el('ol',undefined,'workspace-activity'),links=el('div',undefined,'workspace-links');browser.append(form,location,image,caption,controls,links,activity);
 form.addEventListener('submit',e=>{e.preventDefault();void command('navegador_abrir',{url:address.value});});
 const ppp=sections.ppp,pppNote=el('p','Conectando el PPP registrado. Sus resultados se calculan en Sheets.','workspace-ppp-status'),pppHost=el('div',undefined,'workspace-board'),proposalHost=el('div',undefined,'workspace-proposals');
 const boardSummary=el('p','Todavía no hay una lectura compartida.','workspace-ppp-summary'),applyNotice=el('p','','workspace-apply-status');
 pppNote.setAttribute('role','status');applyNotice.setAttribute('role','status');
 const pppActions=el('div',undefined,'workspace-controls');
 pppActions.append(button('Actualizar conexión',async()=>{if(!conversation)await readSources();void refresh();}),button('Conservar y comparar variantes',()=>setTab('knowledge')));
 ppp.append(el('h2','Plan de potencial compartido'),el('p','Completa los datos del tablero o pide un ajuste a Gastón. Revisa el antes y después; al aplicar, el modelo original guarda y recalcula.','workspace-ppp-guide'),boardSummary,pppNote,pppActions,applyNotice,proposalHost,pppHost);
 const tasks=new DurableGoals({transport,getContext:()=>selected&&getSelection()?.case_id===selected.case_id?{selection:getSelection(),busy:false}:null,onUnauthorized:()=>clear()});
 const states={queued:'En cola',running:'Trabajando',ready_for_review:'Para tu revisión',awaiting_data:'Faltan datos',stopped:'Detenido',completed:'Revisado'};
 tasks.subscribe(s=>{if(disposed)return;sections.tasks.replaceChildren();if(!s.model){sections.tasks.append(el('p',s.notice||'Consultando pendientes…'));return;}
  for(const g of s.model.goals){const card=el('article',undefined,'workspace-card');card.append(el('h3',g.title),el('p',states[g.status]),el('p',g.summary||g.criterion));
   for(const t of g.tasks){card.append(el('p',t.title+' · '+taskDisplay(t,g.status)));if(t.summary)card.append(el('p',t.summary));}
   for(const e of g.evidence){const d=el('details');d.append(el('summary',e.title),el('pre',e.text));card.append(d);}
   for(const [action,label]of g.status==='ready_for_review'?[['approve','Marcar revisado'],['stop','Detener']]:['stopped','awaiting_data'].includes(g.status)?[['resume','Retomar']]:['queued','running'].includes(g.status)?[['stop','Detener']]:[]){
    const b=button(label,async()=>{if(await tasks.read())await tasks.review(g.goal_id,action);win.dispatchEvent(new CustomEvent('yod-goals-changed'));});b.disabled=s.busy||!!s.pending;card.append(b);}
   sections.tasks.append(card);}
  if(!s.model.goals.length)sections.tasks.append(el('p','No hay objetivos registrados.'));
 });
 async function session(){
  const current=getSelection();if(!current||!selected||current.case_id!==selected.case_id)throw Error('unauthorized');
  if(credential&&credential.expires_at-Date.now()>45000)return credential;
  if(!minting){const id=current.case_id;minting=transport.mintFastSession({case_id:id}).then(raw=>{if(getSelection()?.case_id!==id)throw Error('unauthorized');return credential=validateFastSession(raw,id);}).finally(()=>{minting=null;});}
  return minting;
 }
 async function request(path,data={}){
  const own=generation,c=await session();
  const r=await fetch(c.endpoint+path,{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000),body:JSON.stringify(data)});
  if(own!==generation||disposed)throw Error('session_changed');
  if(r.status===401||r.status===403){credential=null;clear();throw Error('unauthorized');}
  const out=await r.json();if(own!==generation||disposed)throw Error('session_changed');if(!r.ok||out.ok!==true)throw Error(out.error||'unavailable');return out;
 }
 async function command(name,args){
  if(busy||!selected)return;busy=true;go.disabled=true;notice.textContent='Gastón está abriendo la página…';
  try{await request('/computer/action',{name,args});}
  catch(e){notice.textContent=e.message==='address_blocked'?'Esta dirección no está disponible en el navegador de lectura.':'No se pudo completar la navegación. Puedes volver a intentarlo.';}
  finally{busy=false;go.disabled=false;void refresh();}
 }
 function paintBrowser(s){
  location.textContent=s.url||'Ninguna página abierta.';
  const phases={preparing:'Preparando navegador…',disabled:'Navegador pendiente de conexión.',unavailable:'No se pudo preparar el navegador.',working:'Gastón está consultando una página…',idle:'Puesto disponible',error:'La última navegación no se completó.'};
  notice.textContent=phases[s.phase]||'Consultando puesto…';
  if(typeof s.image==='string'&&s.image.startsWith('data:image/jpeg;base64,')&&s.image.length<=900100){if(image.src!==s.image)image.src=s.image;image.hidden=false;}else{image.removeAttribute('src');image.hidden=true;}
  caption.textContent=s.captured_at?'Última captura · '+new Date(s.captured_at).toLocaleString()+' · '+(s.title||'Página')+(s.phase==='error'?' · Conservada de la última lectura correcta.':''):'Todavía no hay una captura. Abre una página para comenzar.';
  links.replaceChildren(...(s.links||[]).slice(0,10).map(l=>button(l.title,()=>void command('navegador_abrir',{url:l.url}))));
  activity.replaceChildren(...(s.activity||[]).slice(0,8).map(a=>el('li',a.action+' · '+({working:'en curso',completed:'completado',failed:'sin completar'}[a.status]||a.status)+' · '+new Date(a.at).toLocaleTimeString())));
 }
 function postBoard(type,extra={}){if(frame&&selected)frame.contentWindow?.postMessage({type,version:1,nonce,case_id:selected.case_id,...extra},win.location.origin);}
 function paintProposals(){
  proposalHost.replaceChildren();
  for(const p of proposals){
   const article=el('article',undefined,'workspace-card');article.append(el('h3','Ajuste propuesto por Gastón'),el('p',p.motivo));
   for(const c of p.cambios)article.append(el('p',c.label+': '+(c.antes??'pendiente')+' → '+(c.valor??'pendiente')));
   const eligibility=proposalState(board,p,application);
   const apply=button(eligibility==='sending'?'Aplicando…':eligibility==='unconfirmed'?'Confirmación pendiente':'Aplicar en el tablero',()=>{
    if(!getSelection()?.can_enqueue||getSelection()?.case_id!==selected?.case_id||proposalState(board,p,application)!=='ready')return;
    application={request_id:p.request_id,status:'sending'};
    applyNotice.textContent='Ajuste enviado. Esperando guardado y recálculo; no repitas la solicitud.';
    paintProposals();postBoard('yod:ppp:apply',{proposal:p});
    clearTimeout(applyTimer);const own=generation;
    applyTimer=setTimeout(()=>{if(own!==generation||application?.request_id!==p.request_id)return;
     application.status='unconfirmed';applyNotice.textContent='El guardado no se confirmó. Revisa los pendientes del tablero; conserva la misma solicitud.';paintProposals();},35000);
   });
   apply.disabled=eligibility!=='ready'||!getSelection()?.can_enqueue;
   const discard=button('Retirar propuesta',async()=>{try{await request('/board/resolve',{request_id:p.request_id,status:'discarded'});if(application?.request_id===p.request_id){clearTimeout(applyTimer);applyTimer=null;application=null;}applyNotice.textContent='Propuesta retirada. Los cambios ya guardados, si los hay, se conservan.';await refresh();}catch{pppNote.textContent='No se confirmó el descarte. La propuesta sigue pendiente.';}});
   discard.disabled=eligibility==='sending'||!getSelection()?.can_enqueue;
   article.append(apply,discard,el('small','Retirar una propuesta no deshace cambios ya guardados.'));
   if(eligibility==='stale')article.append(el('p','Cambió el escenario o su revisión. Pide a Gastón un ajuste sobre la lectura vigente.'));
   if(eligibility==='board_pending')article.append(el('p','Primero confirma o recupera los cambios pendientes del tablero.'));
   proposalHost.append(article);
  }
 }
 function mountBoard(){
  if(frame||!selected||!conversation)return;
  if(!(conversation.documents||[]).some(d=>/PPP|plan de potencial|patrimonial/i.test(d.title+' '+d.role))){pppNote.textContent='No hay un PPP registrado en las fuentes de este expediente.';return;}
  frame=el('iframe');frame.title='PPP del expediente · tablero original';frame.referrerPolicy='same-origin';frame.src=boardURL(selected.case_id);frame.allow='';nonce=win.crypto.randomUUID();
  frame.addEventListener('load',()=>postBoard('yod:ppp:hello'));pppHost.append(frame);
  const a=el('a','Abrir el tablero en otra pestaña ↗');a.href=boardURL(selected.case_id).replace('&embed=1&agent=1','');a.target='_blank';a.rel='noopener noreferrer';pppHost.append(a);
 }
 let boardQueue=Promise.resolve();
 function receive(e){
  if(disposed||!active||e.origin!==win.location.origin||e.source!==frame?.contentWindow||e.data?.type!=='yod:ppp:state'||e.data?.version!==1||e.data.nonce!==nonce)return;
  const data=e.data,own=generation;
  boardQueue=boardQueue.catch(()=>{}).then(async()=>{
   if(own!==generation||!selected)return;
   try{
    if(data.board?.case_id===selected.case_id){
     const r=await request('/board/snapshot',data.board);if(own!==generation||!selected)return;board=r.tablero;
     boardSummary.textContent='Escenario: '+(board.scenario_name||board.scenario_id)+' · Revisión: '+board.revision+(board.confirmed&&!board.pending?' · Lectura confirmada':' · Cambios o lectura pendientes');
     pppNote.textContent=board.confirmed&&!board.pending?'PPP compartido con Gastón · lectura confirmada del tablero.':'El tablero tiene una lectura o cambios por confirmar.';
     const signature=JSON.stringify([board.revision,board.scenario_id,board.confirmed,board.pending]);
     if(signature!==boardRevision){boardRevision=signature;onBoard(board.revision);win.dispatchEvent(new CustomEvent('yod-shared-board',{detail:{revision:board.revision}}));}
     paintProposals();
    }
    if(data.receipt){
     const r=data.receipt;
     if(application?.request_id===r.request_id){clearTimeout(applyTimer);applyTimer=null;}
     if(r.ok){await request('/board/resolve',{request_id:r.request_id,status:'applied',revision:r.revision});if(own!==generation)return;application=null;applyNotice.textContent='Ajuste guardado y confirmado. Puedes comparar esta revisión o conservarla como variante.';pppNote.textContent='Ajuste confirmado por el tablero y recalculado en Sheets.';void refresh();}
     else{if(application?.request_id===r.request_id)application.status='unconfirmed';applyNotice.textContent='Ajuste sin confirmar. El resultado no se marca como aplicado.';pppNote.textContent=r.error==='conflicto_revision'?'El tablero cambió. La propuesta no se aplicó.':'El ajuste quedó sin confirmación. Revisa Reintentar pendientes en el tablero; conserva la misma solicitud.';paintProposals();}
    }
   }catch{pppNote.textContent='El tablero sigue abierto; Gastón no recibió todavía su última lectura.';}
  });
 }
 async function readSources(){
  const own=generation;
  try{const raw=await transport.read({case_id:selected.case_id});if(own!==generation||disposed)return;conversation=validateConversation(raw,selected.case_id);
   sections.sources.replaceChildren(...conversation.documents.map(d=>{const c=el('article',undefined,'workspace-card');c.append(el('h3',d.title),el('p',d.role||''));if(d.url){const a=el('a','Abrir fuente ↗');a.href=d.url;a.target='_blank';a.rel='noopener noreferrer';c.append(a);}return c;}));
   if(tab==='ppp')mountBoard();
  }catch{if(own!==generation||disposed)return;sections.sources.replaceChildren(el('p','No se pudieron recuperar las fuentes. Puedes actualizar la conexión.'));if(tab==='ppp')pppNote.textContent='No se pudo comprobar la fuente del PPP. Pulsa Actualizar conexión; tu conversación puede continuar.';}
 }
 async function refresh(){
  if(disposed||!active||fetching||doc.hidden||!selected)return;fetching=true;
  try{
   if(getSelection()?.case_id!==selected.case_id){clear();return;}
   if(tab==='browser')paintBrowser(await request('/computer/state'));
   if(tab==='ppp'){postBoard(board?'yod:ppp:read':'yod:ppp:hello');const r=await request('/board/state');proposals=r.proposals||[];paintProposals();}
   if(tab==='tasks'&&Date.now()-lastTaskRead>=12000){lastTaskRead=Date.now();await tasks.read();}
  }catch{notice.textContent='El puesto no respondió. Reintentando; la conversación puede continuar.';}
  finally{fetching=false;}
 }
 function setTab(id){if(!WORKSPACE_TABS.some(([k])=>k===id))return;if(tab==='knowledge'&&id!=='knowledge')knowledge.hide();tab=id;for(const [key,section]of Object.entries(sections)){section.hidden=key!==id;nav.querySelector('[data-tab="'+key+'"]').setAttribute('aria-pressed',String(key===id));}
  if(id==='ppp'){notice.textContent='Trabaja con Gastón sobre el mismo tablero y escenario.';mountBoard();}if(id==='knowledge'&&selected){notice.textContent='Conocimiento y versiones del expediente.';void knowledge.open(selected.case_id);}void refresh();}
 function clear(){generation++;clearTimeout(applyTimer);applyTimer=null;application=null;applyNotice.textContent='';boardSummary.textContent='Todavía no hay una lectura compartida.';knowledge.reset();lastTaskRead=0;credential=null;selected=null;board=null;boardRevision=null;conversation=null;proposals=[];frame?.remove();frame=null;image.removeAttribute('src');image.hidden=true;activity.replaceChildren();links.replaceChildren();sections.tasks.replaceChildren();sections.sources.replaceChildren();proposalHost.replaceChildren();pppHost.replaceChildren();tasks.hide();notice.textContent='El acceso cambió. Vuelve a abrir tu despacho.';}
 function open(selection,target='browser'){if(selected?.case_id===selection.case_id){active=true;setTab(target);void readSources();return;}clear();selected=selection;active=true;generation++;notice.textContent='Preparando el puesto de '+selection.name+'…';setTab(target);void readSources();if(!timer)timer=setInterval(()=>void refresh(),tab==='tasks'?12000:4000);}
 win.addEventListener('message',receive);
 return{open,setTab,getTab:()=>tab,reset:clear,setActive(value){if(active===value)return;active=value;if(!value)knowledge.hide();if(value)void refresh();},dispose(){disposed=true;clear();knowledge.dispose();clearInterval(timer);win.removeEventListener('message',receive);root.remove();transport.dispose?.();},root};
}
