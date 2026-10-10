import {mountModelSettings} from './model-settings.mjs?v=129';
import {mountMeeting} from './meeting-view.mjs?v=126';
import {mountAvatarCard} from './avatar-card.mjs?v=126';
import {mountWorkView} from './work-view.mjs?v=126';
import {registeredBoard,resolveBoard,stationIdentity} from './project-station.mjs?v=121';
import {mountKnowledgeBoard} from './knowledge-board.mjs?v=128';
import {createFrameTransport,validateConversation} from './conversation.mjs?v=129';
import {validateFastSession} from './fast-lane.mjs';
import {DurableGoals,goalDisplay,taskDisplay,goalReviewActions} from './goals.mjs?v=2';
export {taskDisplay} from './goals.mjs?v=2';
export const WORKSPACE_TABS=[['ppp','Plan de potencial'],['activity','Trabajo'],['tasks','Pendientes'],['sources','Expediente'],['browser','Navegador'],['knowledge','Notas y versiones'],['meeting','Reunión'],['avatar','Conocer al autón']];
export const WORKSPACE_GROUPS={ppp:['ppp'],activity:['activity','tasks','browser','meeting'],sources:['sources','knowledge','avatar']};
export const workspaceGroup=id=>Object.keys(WORKSPACE_GROUPS).find(key=>WORKSPACE_GROUPS[key].includes(id))||'ppp';
// A review belongs to the exact delivery shown. An uncertain receipt retries its original request.
export async function reviewPresentedGoal(controller,value,isCurrent=()=>true){
 if(!isCurrent())return null;
 if(controller.pending){
  const p=controller.pending;
  if(p.method!=='reviewGoal'||p.payload.case_id!==value.case_id||p.payload.goal_id!==value.goal_id||p.payload.action!=='approve')return null;
  if(!await controller.retry()||!isCurrent())return null;
 }else{
  if(!await controller.read()||!isCurrent())return null;
  const goal=controller.model?.goals.find(g=>g.goal_id===value.goal_id);
  if(goal?.case_id!==value.case_id||goal.revision!==value.revision||goal.status!=='ready_for_review')throw Error('stale_revision');
  if(!await controller.review(value.goal_id,'approve')||!isCurrent())return null;
 }
 const goal=controller.model?.goals.find(g=>g.goal_id===value.goal_id);
 return goal?.case_id===value.case_id&&goal.status==='completed'?goal:null;
}
export function proposalState(board,proposal,application=null){
 if(application?.request_id===proposal.request_id)return application.status;
 if(!board?.confirmed||board.pending)return 'board_pending';
 if(board.case_id!==proposal.case_id||board.scenario_id!==proposal.scenario_id||board.revision!==proposal.revision)return 'stale';
 return 'ready';
}
export function boardURL(caseId,source){const board=registeredBoard(source,caseId);if(!board)throw Error('unregistered_board');return board.url;}

export function createReceiptQueue({resolve,ack,eligible=()=>true,onAttempt=()=>{},onResult=()=>{}}){
 const pending=new Map();let epoch=0,running=null;
 function enqueue(value){
  if(!value||typeof value.request_id!=='string'||!/^[A-Za-z0-9_.:-]{1,256}$/.test(value.request_id)||typeof value.revision!=='string'||!value.revision||value.revision.length>256)return false;
  const prior=pending.get(value.request_id);
  if(prior)return prior.revision===value.revision;
  if(pending.size>=8)return false;
  pending.set(value.request_id,{request_id:value.request_id,revision:value.revision});return true;
 }
 function drain(){
  if(running)return running;
  const own=epoch,attempted=new Set();
  const work=(async()=>{
   while(own===epoch){
    const receipt=[...pending.values()].find(r=>!attempted.has(r.request_id)&&eligible(r));
    if(!receipt)break;
    attempted.add(receipt.request_id);onAttempt(receipt);
    try{
     const result=await resolve(receipt);
     if(own!==epoch)return false;
     if(!eligible(receipt))continue;
     if(result?.ok!==true||result.request_id!==receipt.request_id||result.status!=='applied')throw Error('receipt_response_mismatch');
     ack(receipt);pending.delete(receipt.request_id);onResult(receipt,true);
    }catch(error){if(own!==epoch)return false;onResult(receipt,false);}
   }
   return own===epoch&&pending.size===0;
  })();
  const token=work.finally(()=>{if(running===token)running=null;});running=token;return token;
 }
 return{enqueue,drain,get size(){return pending.size;},get busy(){return !!running;},
  has:id=>pending.has(id),clear(){epoch++;pending.clear();running=null;}};
}

export function createWorkspace({container,getSelection,transport=createFrameTransport(window),win=window,doc=document,onBoard=()=>{},onPresent=async()=>false}){
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(label,click)=>{const b=el('button',label);b.type='button';b.addEventListener('click',click);return b;};
 let selected=null,credential=null,minting=null,disposed=false,timer=null,busy=false,tab='ppp',frame=null,nonce=null,board=null,boardRevision=null,conversation=null,proposals=[],generation=0,fetching=false,active=true,lastTaskRead=0,application=null,applyTimer=null,boardHandshakeTimer=null,boardHandshakeTimedOut=false,boardLink=null,readingSources=null,sourceAttempts=0,sourceRetryAt=0,goalDraft={title:'',instruction:'',criterion:''};
 const root=el('section',undefined,'agent-workspace');root.setAttribute('aria-label','Puesto del proyecto');
 const nav=el('nav'),notice=el('p','Preparando el puesto…','workspace-status'),body=el('div',undefined,'workspace-body');
 notice.setAttribute('role','status');const subnav=el('nav',undefined,'workspace-subnav');subnav.setAttribute('aria-label','Opciones de la sección');nav.className='workspace-primary';nav.setAttribute('aria-label','Tablero del proyecto');root.append(nav,subnav,notice,body);container.append(root);
 const sections=Object.fromEntries(WORKSPACE_TABS.map(([id,label])=>{const b=button(label,()=>setTab(id));b.dataset.tab=id;(Object.hasOwn(WORKSPACE_GROUPS,id)?nav:subnav).append(b);const section=el('section');section.dataset.panel=id;body.append(section);return[id,section];}));

 const portraitHost=el('div'),settingsHost=el('div');sections.avatar.append(portraitHost,settingsHost);
 const avatarCard=mountAvatarCard({container:portraitHost,doc,win});
 const modelSettings=mountModelSettings({container:settingsHost,transport,doc,applyLive:async()=>{const r=await request('/voice/models-refresh');return r.applied===true;}});
 const meeting=mountMeeting({container:sections.meeting,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,doc,win,onPresent,
  onSlide:slide=>win.dispatchEvent(new CustomEvent('yod-meeting-slide',{detail:slide})),
  canReview:()=>!!selected?.can_enqueue&&getSelection()?.case_id===selected.case_id,
  onReview:async value=>{const own=generation;const goal=await reviewPresentedGoal(tasks,value,()=>own===generation&&selected?.case_id===value.case_id&&getSelection()?.case_id===value.case_id);if(goal)win.dispatchEvent(new CustomEvent('yod-goals-changed'));return goal;},
  onNext:value=>{if(selected?.case_id!==value.case_id)return;setTab('tasks');newGoal.open=true;goalInputs.title.focus();}});
 const knowledge=mountKnowledgeBoard({container:sections.knowledge,request,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,onUnauthorized:()=>clear(),doc,win});
 const browser=sections.browser,form=el('form',undefined,'workspace-address'),address=el('input');address.type='url';address.placeholder='https://…';address.setAttribute('aria-label','Dirección del navegador');address.required=true;
 const go=el('button','Abrir');go.type='submit';form.append(address,go);
 const workView=mountWorkView({container:sections.activity,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,win,doc,onTasks:()=>setTab('tasks')});
 const location=el('p','Ninguna página abierta.','workspace-location'),image=el('img');image.alt='Última captura del navegador del autón';image.hidden=true;
 const caption=el('p','Pide al autón que abra una página o escribe su dirección.','workspace-caption'),controls=el('div',undefined,'workspace-controls');
 controls.append(button('Subir',()=>void command('navegador_desplazar',{direccion:'arriba'})),button('Bajar',()=>void command('navegador_desplazar',{direccion:'abajo'})),button('Actualizar vista',()=>void refresh()));
 const activity=el('ol',undefined,'workspace-activity'),links=el('div',undefined,'workspace-links');const manual=el('details',undefined,'workspace-manual');manual.append(el('summary','Navegación manual'),form,controls,links,activity);browser.append(location,image,caption,manual);
 form.addEventListener('submit',e=>{e.preventDefault();void command('navegador_abrir',{url:address.value});});
 const ppp=sections.ppp,pppNote=el('p','Conectando el mismo tablero de Plan de Potencial.','workspace-ppp-status'),pppHost=el('div',undefined,'workspace-board'),proposalHost=el('div',undefined,'workspace-proposals');
 const boardSummary=el('p','Todavía no hay una lectura compartida.','workspace-ppp-summary'),applyNotice=el('p','','workspace-apply-status');
 pppNote.setAttribute('role','status');applyNotice.setAttribute('role','status');
 const pppActions=el('details',undefined,'workspace-board-options');pppActions.append(el('summary','Conexión y variantes'));
 pppActions.append(button('Actualizar conexión',async()=>{await readSources();if(boardLink?.bridge&&!board){startBoardHandshake(true);postBoard('yod:ppp:hello');}void refresh();}),button('Conservar y comparar variantes',()=>setTab('knowledge')));
 const receipts=createReceiptQueue({
  resolve:r=>request('/board/resolve',{request_id:r.request_id,status:'applied',revision:r.revision}),
  ack:r=>postBoard('yod:ppp:receipt-ack',r),
  eligible:r=>!!selected&&getSelection()?.case_id===selected.case_id&&(active||application?.request_id===r.request_id),
  onAttempt:r=>{if(application?.request_id===r.request_id)application.status='confirming';paintProposals();},
  onResult:(r,ok)=>{if(application?.request_id===r.request_id){if(ok)application=null;else application.status='unconfirmed';}}
 });
 const receiptRetry=button('Comprobar confirmación',()=>void confirmReceipt());receiptRetry.hidden=true;
 ppp.append(pppNote,applyNotice,receiptRetry,proposalHost,pppHost,boardSummary,pppActions);
 const tasks=new DurableGoals({transport,getContext:()=>selected&&getSelection()?.case_id===selected.case_id?{selection:getSelection(),busy:false}:null,onUnauthorized:()=>clear()});
 const taskList=el('div'),newGoal=el('details',undefined,'workspace-new-goal'),goalForm=el('form'),goalNotice=el('p');
 newGoal.append(el('summary','Nuevo objetivo'),goalForm);const goalInputs={};
 for(const [key,label,max]of [['title','Qué quieres resolver',160],['instruction','Instrucciones',4000],['criterion','Qué debe entregar',1000]]){const row=el('label',label),input=el(key==='title'?'input':'textarea');input.required=true;input.maxLength=max;input.name=key;input.addEventListener('input',()=>{goalDraft[key]=input.value;});row.append(input);goalForm.append(row);goalInputs[key]=input;}
 const submit=el('button','Encargar análisis');submit.type='submit';goalForm.append(submit,goalNotice);
 const retryGoal=button('Comprobar la misma solicitud',()=>void tasks.retry());retryGoal.hidden=true;
 sections.tasks.append(newGoal,retryGoal,taskList);
 goalForm.addEventListener('submit',async event=>{event.preventDefault();const own=generation;if(await tasks.read()&&own===generation&&await tasks.create({...goalDraft})){goalDraft={title:'',instruction:'',criterion:''};for(const input of Object.values(goalInputs))input.value='';newGoal.open=false;win.dispatchEvent(new CustomEvent('yod-goals-changed'));}});
 const actionLabels={approve:'Marcar revisado',resume:'Retomar',stop:'Detener'};
 tasks.subscribe(s=>{if(disposed)return;taskList.replaceChildren();goalNotice.textContent=s.notice||'';retryGoal.hidden=!s.pending;retryGoal.disabled=s.busy;submit.disabled=!selected?.can_enqueue||!selected?.goals?.ready||s.busy||!!s.pending||!s.model||s.model.goals.some(g=>!['stopped','completed'].includes(g.status));if(!s.model){taskList.append(el('p',s.notice||'Consultando pendientes…'));return;}
  for(const g of s.model.goals){const display=goalDisplay(g),card=el('article',undefined,'workspace-card');card.append(el('h3',g.title),el('p',display.label),el('p',g.summary||g.criterion),el('small','Último registro · '+new Date(g.updated_at).toLocaleString()));if(display.notice)card.append(el('p',display.notice));
   for(const t of g.tasks){card.append(el('p',t.title+' · '+taskDisplay(t,g)));if(t.summary)card.append(el('p',t.summary));}
   for(const e of g.evidence){const d=el('details');d.append(el('summary',e.title),el('pre',e.text));card.append(d);}
   if(['ready_for_review','completed','awaiting_data'].includes(g.status))card.append(button('Presentar avances',()=>{setTab('meeting');meeting.open(g,selected.case_id,selected.avatar?.name||selected.name);}));
   for(const action of goalReviewActions(g)){const label=actionLabels[action];
    const b=button(label,async()=>{if(await tasks.read())await tasks.review(g.goal_id,action);win.dispatchEvent(new CustomEvent('yod-goals-changed'));});b.disabled=!selected?.can_enqueue||s.busy||!!s.pending;card.append(b);}
   taskList.append(card);}
  if(!s.model.goals.length)taskList.append(el('p','No hay objetivos registrados.'));
 });
 async function session(){
  const current=getSelection();if(!current||!selected||current.case_id!==selected.case_id)throw Error('unauthorized');
  if(credential&&credential.expires_at-Date.now()>45000)return credential;
  if(!minting){const id=current.case_id;minting=transport.mintFastSession({case_id:id}).then(raw=>{if(getSelection()?.case_id!==id)throw Error('unauthorized');return credential=validateFastSession(raw,id);}).finally(()=>{minting=null;});}
  return minting;
 }
 async function request(path,data={}){
  const own=generation,c=await session();
  const r=await fetch(c.endpoint+path,{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(55000),body:JSON.stringify(data)});
  if(own!==generation||disposed)throw Error('session_changed');
  if(r.status===401||r.status===403){credential=null;clear();throw Error('unauthorized');}
  const out=await r.json();if(own!==generation||disposed)throw Error('session_changed');if(!r.ok||out.ok!==true)throw Error(out.error||'unavailable');return out;
 }
 async function command(name,args){
  if(busy||!selected)return;busy=true;go.disabled=true;notice.textContent='El autón está abriendo la página…';
  try{await request('/computer/action',{name,args});}
  catch(e){notice.textContent=e.message==='address_blocked'?'Esta dirección no está disponible en el navegador de lectura.':'No se pudo completar la navegación. Puedes volver a intentarlo.';}
  finally{busy=false;go.disabled=false;void refresh();}
 }
 function paintBrowser(s){
  location.textContent=s.url||'Ninguna página abierta.';
  const phases={preparing:'Preparando navegador…',disabled:'Navegador pendiente de conexión.',unavailable:'No se pudo preparar el navegador.',working:'El autón está consultando una página…',idle:'Puesto disponible',error:'La última navegación no se completó.'};
  notice.textContent=phases[s.phase]||'Consultando puesto…';
  if(typeof s.image==='string'&&s.image.startsWith('data:image/jpeg;base64,')&&s.image.length<=900100){if(image.src!==s.image)image.src=s.image;image.hidden=false;}else{image.removeAttribute('src');image.hidden=true;}
  caption.textContent=s.captured_at?'Última captura · '+new Date(s.captured_at).toLocaleString()+' · '+(s.title||'Página')+(s.phase==='error'?' · Conservada de la última lectura correcta.':''):'Todavía no hay una captura. Abre una página para comenzar.';
  links.replaceChildren(...(s.links||[]).slice(0,10).map(l=>button(l.title,()=>void command('navegador_abrir',{url:l.url}))));
  activity.replaceChildren(...(s.activity||[]).slice(0,8).map(a=>el('li',a.action+' · '+({working:'en curso',completed:'completado',failed:'sin completar'}[a.status]||a.status)+' · '+new Date(a.at).toLocaleTimeString())));
 }
 function postBoard(type,extra={}){if(frame&&selected&&boardLink?.bridge)frame.contentWindow?.postMessage({type,version:1,nonce,case_id:selected.case_id,...{board_case_id:boardLink.board_case_id,...(selected.ppp?.scenario_id?{scenario_id:selected.ppp.scenario_id}:{})},...extra},boardLink.origin);}
 function applyProposal(p){

    if(receipts.size>=8||receipts.has(p.request_id)||!getSelection()?.can_enqueue||getSelection()?.case_id!==selected?.case_id||proposalState(board,p,application)!=='ready')return;
    application={request_id:p.request_id,status:'sending'};
    applyNotice.textContent='Ajuste enviado. Esperando guardado y recálculo; no repitas la solicitud.';
    paintProposals();postBoard('yod:ppp:apply',{proposal:p});
    clearTimeout(applyTimer);const own=generation;
    applyTimer=setTimeout(()=>{if(own!==generation||application?.request_id!==p.request_id)return;
     application.status='unconfirmed';applyNotice.textContent='El guardado no se confirmó. Revisa los pendientes del tablero; conserva la misma solicitud.';paintProposals();},35000);
   
 }
 async function confirmReceipt(){
  if(!receipts.size||!selected)return false;
  const own=generation;receiptRetry.disabled=true;
  const complete=await receipts.drain();
  if(own!==generation||disposed)return false;
  receiptRetry.hidden=!receipts.size;receiptRetry.disabled=receipts.busy;
  if(complete){
   applyNotice.textContent=application?'Confirmaciones registradas. El ajuste en curso todavía espera su recibo.':'Ajuste guardado y confirmado. Los recibos se registraron sin reenviar cantidades.';
   pppNote.textContent=application?'El ajuste en curso conserva su estado pendiente.':'Seguimiento confirmado por el servidor del autón.';
   void refresh();
  }else{
   applyNotice.textContent=receipts.size+' confirmación(es) pendientes de registrar. Comprobar confirmación no vuelve a escribir cantidades.';
   pppNote.textContent='El tablero conserva los recibos hasta recibir un acuse exacto del servidor.';
  }
  paintProposals();return complete;
 }
 function dispatchRequested(){
  if(!active||tab!=='ppp'||application||receipts.size>=8)return;
  const p=proposals.find(p=>!receipts.has(p.request_id)&&p.apply_requested_at&&Number.isFinite(Date.parse(p.apply_expires_at))&&Date.parse(p.apply_expires_at)>Date.now()&&proposalState(board,p)==='ready');
  if(p)applyProposal(p);
 }
 function paintProposals(){
  proposalHost.replaceChildren();
  for(const p of proposals){
   const article=el('article',undefined,'workspace-card');article.append(el('h3','Ajuste propuesto por el autón'),el('p',p.motivo));
   for(const c of p.cambios)article.append(el('p',c.label+': '+(c.antes??'pendiente')+' → '+(c.valor??'pendiente')));
   const eligibility=proposalState(board,p,application);
   const apply=button(eligibility==='sending'?'Aplicando…':eligibility==='confirming'?'Confirmando…':eligibility==='unconfirmed'?'Confirmación pendiente':'Aplicar en el tablero',()=>applyProposal(p));
   apply.disabled=eligibility!=='ready'||receipts.size>=8||receipts.has(p.request_id)||!getSelection()?.can_enqueue;
   const discard=button('Retirar propuesta',async()=>{try{await request('/board/resolve',{request_id:p.request_id,status:'discarded'});if(application?.request_id===p.request_id){clearTimeout(applyTimer);applyTimer=null;application=null;}applyNotice.textContent='Propuesta retirada. Los cambios ya guardados, si los hay, se conservan.';await refresh();}catch{pppNote.textContent='No se confirmó el descarte. La propuesta sigue pendiente.';}});
   discard.disabled=eligibility==='sending'||eligibility==='confirming'||receipts.has(p.request_id)||!getSelection()?.can_enqueue;
   article.append(apply,discard,el('small','Retirar una propuesta no deshace cambios ya guardados.'));
   if(eligibility==='stale')article.append(el('p','Cambió el escenario o su revisión. Pide a el autón un ajuste sobre la lectura vigente.'));
   if(eligibility==='board_pending')article.append(el('p','Primero confirma o recupera los cambios pendientes del tablero.'));
   proposalHost.append(article);
  }
 }
 function clearBoardHandshake(){clearTimeout(boardHandshakeTimer);boardHandshakeTimer=null;}
 function startBoardHandshake(retry=false){
  if(!boardLink?.bridge||board)return;
  if(retry){clearBoardHandshake();boardHandshakeTimedOut=false;pppNote.textContent='Comprobando de nuevo la lectura compartida del PPP…';}
  if(boardHandshakeTimer||boardHandshakeTimedOut)return;
  const own=generation;
  boardHandshakeTimer=setTimeout(()=>{
   boardHandshakeTimer=null;
   if(own!==generation||disposed||!active||board||!boardLink?.bridge)return;
   boardHandshakeTimedOut=true;
   pppNote.textContent='El puesto todavía no recibió una lectura compartida del PPP. Abre Conexión y variantes y pulsa Actualizar conexión para comprobarla de nuevo; el tablero se conserva.';
  },15000);
 }
 function mountBoard(){
  if(frame||!selected)return;
  boardLink=resolveBoard(selected,conversation?.documents||[]);
  if(!boardLink){pppNote.textContent=conversation?'No se encontró un vínculo único del PPP para este proyecto. Revisa sus fuentes registradas.':'Buscando el PPP registrado…';return;}
  frame=el('iframe');frame.title='Plan de potencial · '+selected.name;frame.referrerPolicy=boardLink.bridge?'same-origin':'no-referrer';frame.src=boardLink.url;frame.allow='';nonce=win.crypto.randomUUID();
  frame.addEventListener('load',()=>postBoard('yod:ppp:hello'));pppHost.append(frame);startBoardHandshake();
  pppNote.textContent=boardLink.bridge?'Abriendo el modelo registrado…':boardLink.surface==='ppp'?'PPP registrado abierto. Este modelo todavía no comparte su lectura ni admite ajustes del autón. Puedes consultar el tablero; no se enviarán cambios desde el puesto.':'Hoja registrada del PPP. Su sesión de Google puede ser necesaria. La edición compartida todavía no está conectada para esta fuente.';
  const a=el('a','Abrir el PPP en otra pestaña ↗');a.href=boardLink.external;a.target='_blank';a.rel='noopener noreferrer';pppHost.append(a);
  boardSummary.hidden=!boardLink.bridge;
 }

 // Closing a panel must not discard the receipt of a write already sent.
 // Selection and transport validation still apply; this never dispatches a new write.
 function acceptsBoardState(data){
  if(!selected||getSelection()?.case_id!==selected.case_id)return false;
  if(active)return true;
  const requestId=application?.request_id;
  return !!requestId&&(!data.receipt||data.receipt.request_id===requestId);
 }
 let boardQueue=Promise.resolve();
 function receive(e){
  if(disposed||!acceptsBoardState(e.data||{})||!boardLink?.bridge||e.origin!==boardLink.origin||e.source!==frame?.contentWindow||e.data?.type!=='yod:ppp:state'||e.data?.version!==1||e.data.nonce!==nonce)return;
  const data=e.data,own=generation;
  boardQueue=boardQueue.catch(()=>{}).then(async()=>{
   if(own!==generation||disposed||!acceptsBoardState(data))return;
   try{
    if(data.board?.case_id===selected.case_id){
     const r=await request('/board/snapshot',data.board);if(own!==generation||!selected)return;board=r.tablero;clearBoardHandshake();boardHandshakeTimedOut=false;
     boardSummary.textContent='Escenario: '+(board.scenario_name||board.scenario_id)+' · Revisión: '+board.revision+(board.confirmed&&!board.pending?' · Lectura confirmada':' · Cambios o lectura pendientes');
     pppNote.textContent=board.version_context?.read_only?'Versiones compartidas en consulta. Los ajustes se hacen en el tablero original.':board.confirmed&&!board.pending?'PPP compartido con el autón · lectura confirmada del tablero.':'El tablero tiene una lectura o cambios por confirmar.';
     if(board.version_context)boardSummary.textContent='Defiende: '+(board.scenario_name||board.scenario_id)+' · Estás viendo: '+(board.version_context.viewed_scenario_name||board.version_context.viewed_scenario_id)+' · Revisión: '+board.revision+(board.pending?' · Cambios pendientes':'');
     const signature=JSON.stringify([board.revision,board.scenario_id,board.confirmed,board.pending]);
     if(signature!==boardRevision){boardRevision=signature;onBoard(board.revision);win.dispatchEvent(new CustomEvent('yod-shared-board',{detail:{revision:board.revision}}));}
     paintProposals();dispatchRequested();
    }
    if(data.receipt){
     const r=data.receipt;
     if(application?.request_id===r.request_id){clearTimeout(applyTimer);applyTimer=null;}
     if(r.ok===true){
      if(receipts.enqueue(r))await confirmReceipt();
      else{if(application?.request_id===r.request_id)application.status='unconfirmed';applyNotice.textContent='No se pudo incorporar esta confirmación. El tablero conserva su recibo; comprueba los pendientes antes de otro ajuste.';receiptRetry.hidden=!receipts.size;paintProposals();}
     }
     else{if(application?.request_id===r.request_id)application.status='unconfirmed';applyNotice.textContent='Ajuste sin confirmar. El resultado no se marca como aplicado.';pppNote.textContent=r.error==='recibos_pendientes'?'Hay confirmaciones anteriores pendientes. Comprueba su registro antes de pedir otro ajuste; no se escribió de nuevo.':r.error==='conflicto_revision'?'El tablero cambió. La propuesta no se aplicó.':'El ajuste quedó sin confirmación. Revisa Reintentar pendientes en el tablero; conserva la misma solicitud.';paintProposals();}
    }
   }catch{pppNote.textContent='El tablero sigue abierto; el autón no recibió todavía su última lectura.';}
  });
 }
 async function readSources(){
  if(!selected)return;if(readingSources?.generation===generation)return readingSources.promise;
  const own=generation,id=selected.case_id;sourceAttempts++;sourceRetryAt=Date.now()+8000;
  const promise=(async()=>{try{const raw=await transport.read({case_id:id});if(own!==generation||disposed||getSelection()?.case_id!==id)return;conversation=validateConversation(raw,id);
   sections.sources.replaceChildren(...conversation.documents.map(d=>{const c=el('article',undefined,'workspace-card');c.append(el('h3',d.title),el('p',d.role||''));if(d.url){const a=el('a','Abrir fuente ↗');a.href=d.url;a.target='_blank';a.rel='noopener noreferrer';c.append(a);}return c;}));
   if(!conversation.documents.length)sections.sources.append(el('p','No hay fuentes registradas para este proyecto.'));
   if(tab==='ppp')mountBoard();
  }catch{if(own!==generation||disposed)return;sections.sources.replaceChildren(el('p','No se pudieron recuperar las fuentes. La conversación puede continuar.'),button('Volver a cargar fuentes',()=>void readSources()));if(tab==='ppp'&&!frame)pppNote.textContent='No se pudo recuperar el vínculo del PPP. Pulsa Actualizar conexión para reintentar.';}})();
  readingSources={generation:own,promise};try{await promise;}finally{if(readingSources?.promise===promise)readingSources=null;}
 }
 async function refresh(){
  if(disposed||!active||fetching||doc.hidden||!selected)return;fetching=true;
  try{
   if(getSelection()?.case_id!==selected.case_id){clear();return;}
   if(tab==='ppp'&&!frame&&!readingSources&&sourceAttempts<3&&Date.now()>=sourceRetryAt)void readSources();
   if(tab==='browser')paintBrowser(await request('/computer/state'));
   if(tab==='ppp'&&boardLink?.bridge){startBoardHandshake();postBoard(board?'yod:ppp:read':'yod:ppp:hello');const r=await request('/board/state');proposals=r.proposals||[];paintProposals();dispatchRequested();}
   if(tab==='tasks'&&Date.now()-lastTaskRead>=12000){lastTaskRead=Date.now();await tasks.read();}
  }catch{notice.textContent='El puesto no respondió. Reintentando; la conversación puede continuar.';}
  finally{fetching=false;}
 }
 function setTab(id){if(!WORKSPACE_TABS.some(([k])=>k===id))return;if(tab==='meeting'&&id!=='meeting')meeting.hide();if(tab==='knowledge'&&id!=='knowledge')knowledge.hide();tab=id;root.dataset.workspaceGroup=workspaceGroup(id);subnav.hidden=id==='ppp';
  for(const [key,section]of Object.entries(sections)){section.hidden=key!==id;const b=root.querySelector('[data-tab="'+key+'"]');b.setAttribute('aria-pressed',String(Object.hasOwn(WORKSPACE_GROUPS,key)?workspaceGroup(id)===key:key===id));if(b.parentElement===subnav)b.hidden=workspaceGroup(key)!==workspaceGroup(id);}

  if(id==='avatar'&&selected){void avatarCard.open(selected);void modelSettings.open(selected.case_id);}if(id==='meeting'&&!meeting.snapshot()){sections.meeting.replaceChildren(el('p','Buscando la última entrega preparada…'));void openLatestMeeting();}
  if(id==='activity'){notice.textContent='';workView.refresh();}if(id==='browser')workView.refresh();if(id==='ppp'){notice.textContent='';mountBoard();}if(id==='knowledge'&&selected){notice.textContent='';void knowledge.open(selected.case_id);}void refresh();}
 async function openLatestMeeting(){
  const own=generation,id=selected?.case_id;if(!id)return;
  await tasks.read();if(own!==generation||getSelection()?.case_id!==id||tab!=='meeting')return;
  const goal=(tasks.model?.goals||[]).filter(g=>['ready_for_review','completed','awaiting_data'].includes(g.status)).sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at))[0];
  if(goal)meeting.open(goal,id,selected.avatar?.name||selected.name);
  else sections.meeting.replaceChildren(el('p','Todavía no hay una entrega preparada para presentar.'),button('Ver pendientes',()=>setTab('tasks')));
 }
 function clear(){meeting.clear();avatarCard.clear();modelSettings.clear();workView.clear();generation++;clearBoardHandshake();boardHandshakeTimedOut=false;clearTimeout(applyTimer);applyTimer=null;application=null;receipts.clear();receiptRetry.hidden=true;receiptRetry.disabled=false;applyNotice.textContent='';boardSummary.textContent='Todavía no hay una lectura compartida.';knowledge.reset();lastTaskRead=0;credential=null;selected=null;board=null;boardRevision=null;conversation=null;readingSources=null;sourceAttempts=0;sourceRetryAt=0;boardLink=null;proposals=[];goalDraft={title:'',instruction:'',criterion:''};for(const input of Object.values(goalInputs))input.value='';newGoal.open=false;frame?.remove();frame=null;image.removeAttribute('src');image.hidden=true;activity.replaceChildren();links.replaceChildren();taskList.replaceChildren();sections.sources.replaceChildren();proposalHost.replaceChildren();pppHost.replaceChildren();tasks.hide();notice.textContent='El acceso cambió. Vuelve a abrir tu despacho.';}
 function open(selection,target='ppp'){if(selected?.case_id===selection.case_id){active=true;setTab(target);void readSources();return;}clear();selected=selection;if(!selection.goals?.ready)taskList.append(el('p','El seguimiento de objetivos aún no está conectado para este proyecto.'));root.setAttribute('aria-label','Puesto de '+stationIdentity(selection).name);active=true;generation++;notice.textContent='Preparando el puesto de '+selection.name+'…';setTab(target);void readSources();if(!timer)timer=setInterval(()=>void refresh(),tab==='tasks'?12000:4000);}
 win.addEventListener('message',receive);
 return{open,setTab,getTab:()=>tab,reset:clear,setActive(value){if(active===value)return;active=value;if(!value){meeting.hide();knowledge.hide();clearBoardHandshake();}if(value)void refresh();},dispose(){disposed=true;clear();modelSettings.dispose();workView.dispose();knowledge.dispose();clearInterval(timer);win.removeEventListener('message',receive);root.remove();transport.dispose?.();},root};
}
