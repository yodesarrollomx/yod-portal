import {mountMeetingArchive} from './meeting-archive.mjs?v=1';
import {mountDocumentTray} from './document-tray.mjs?v=1';
import {officeFastSessions} from './office-preparation.mjs?v=2';
import {mountMeeting} from './meeting-view.mjs?v=132';
import {mountAvatarCard} from './avatar-card.mjs?v=126';
import {mountWorkView} from './work-view.mjs?v=129';
import {PROFILE_WORK_LANES,profileWorkView,nextRecordedTask} from './profile-work.mjs?v=140';
import {registeredBoard,resolveBoard,stationIdentity,nativeBoardState} from './project-station.mjs?v=140';
import {mountKnowledgeBoard} from './knowledge-board.mjs?v=128';
import {createFrameTransport,validateWorkspaceSources} from './conversation.mjs?v=140';
import {validateFastSession} from './fast-lane.mjs';
import {DurableGoals,goalDisplay,taskDisplay,goalReviewActions,goalRoadmap,orderedGoals,goalReadView} from './goals.mjs?v=132';
export {taskDisplay} from './goals.mjs?v=132';
export const WORKSPACE_TABS=[['ppp','Plan de potencial'],['activity','Trabajo'],['tasks','Encargos'],['sources','Expediente'],['browser','Navegador'],['knowledge','Notas y versiones'],['meeting','Entregas'],['avatar','Conocer al autón']];
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

export function createWorkspace({container,getSelection,transport=createFrameTransport(window),win=window,doc=document,onBoard=()=>{},onPresent=async()=>false,onDiscuss=()=>{}}){
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(label,click)=>{const b=el('button',label);b.type='button';b.addEventListener('click',click);return b;};
 let documentTray=null;
 let selected=null,credential=null,disposed=false,timer=null,busy=false,tab='ppp',frame=null,nonce=null,board=null,boardRevision=null,conversation=null,proposals=[],generation=0,fetching=false,active=true,lastTaskRead=0,application=null,applyTimer=null,boardHandshakeTimer=null,boardHandshakeTimedOut=false,boardLink=null,readingSources=null,sourceAttempts=0,sourceRetryAt=0,goalDraft={title:'',instruction:'',criterion:''},goalSnapshot=null,goalState={model:null,status:'disconnected',notice:'',pending:null},taskModelKey=null,focusedGoal=null;
 const root=el('section',undefined,'agent-workspace');root.setAttribute('aria-label','Puesto del proyecto');
 const nav=el('nav'),notice=el('p','Preparando el puesto…','workspace-status'),body=el('div',undefined,'workspace-body');
 notice.setAttribute('role','status');const subnav=el('nav',undefined,'workspace-subnav');subnav.setAttribute('aria-label','Opciones de la sección');nav.className='workspace-primary';nav.setAttribute('aria-label','Tablero del proyecto');const brief=el('section',undefined,'workspace-brief');brief.setAttribute('aria-label','Meta y siguiente paso');root.append(nav,notice,brief,body);container.append(root);
 const inspector=el('aside',undefined,'workspace-inspector'),inspectorHeading=el('div',undefined,'workspace-inspector-heading'),inspectorTitle=el('h2','Trabajo'),inspectorBody=el('div',undefined,'workspace-inspector-body');
 inspector.setAttribute('aria-label','Detalle del proyecto');inspector.hidden=true;inspectorHeading.append(inspectorTitle,button('Volver al PPP',()=>setTab('ppp')));inspector.append(inspectorHeading,subnav,inspectorBody);
 const sections=Object.fromEntries(WORKSPACE_TABS.map(([id,label])=>{const b=button(label,()=>setTab(id));b.dataset.tab=id;(Object.hasOwn(WORKSPACE_GROUPS,id)?nav:subnav).append(b);const section=el('section');section.dataset.panel=id;(id==='ppp'?body:inspectorBody).append(section);return[id,section];}));body.append(inspector);


 function rememberReading(host){
  const opened=new Map([...host.querySelectorAll('details[data-disclosure]')].map(d=>[d.dataset.disclosure,d.open]));
  const focused=host.contains(doc.activeElement)?doc.activeElement.closest?.('[data-focus-key]')?.dataset.focusKey:null;
  return ()=>{for(const d of host.querySelectorAll('details[data-disclosure]'))if(opened.has(d.dataset.disclosure))d.open=opened.get(d.dataset.disclosure);
   if(focused)for(const n of host.querySelectorAll('[data-focus-key]'))if(n.dataset.focusKey===focused&&!n.disabled)n.focus?.({preventScroll:true});};
 }
 function disclosure(node,key){node.dataset.disclosure=key;const summary=node.querySelector('summary');if(summary)summary.dataset.focusKey=key;return node;}

 // Open the recorder separately so changing stations cannot destroy a capture.
 const openRecorder=()=>{const caseId=selected?.case_id;if(!caseId||getSelection()?.case_id!==caseId)return;const url=new URL('../reuniones/',win.location.href);url.searchParams.set('case_id',caseId);win.open(url.href,'_blank','noopener,noreferrer');};
 sections.ppp.append(button('Grabar reunión del proyecto',openRecorder));
 sections.meeting.append(button('Grabar reunión del proyecto',openRecorder));
 const archive=mountMeetingArchive({container:sections.meeting,request,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,doc});
 const avatarCard=mountAvatarCard({container:sections.avatar,doc,win});
 const presentationHost=el('div');sections.meeting.append(presentationHost);
 const meeting=mountMeeting({container:presentationHost,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,doc,win,onPresent,
  onSlide:slide=>win.dispatchEvent(new CustomEvent('yod-meeting-slide',{detail:slide})),
  canReview:()=>!!selected?.can_enqueue&&getSelection()?.case_id===selected.case_id,
  onReview:async value=>{const own=generation;const goal=await reviewPresentedGoal(tasks,value,()=>own===generation&&selected?.case_id===value.case_id&&getSelection()?.case_id===value.case_id);if(goal)win.dispatchEvent(new CustomEvent('yod-goals-changed'));return goal;},
  onNext:value=>{if(selected?.case_id!==value.case_id)return;setTab('tasks');newGoal.open=true;goalInputs.title.focus();}});
 const knowledge=mountKnowledgeBoard({container:sections.knowledge,request,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,onUnauthorized:()=>clear(),doc,win});
 const browser=sections.browser,form=el('form',undefined,'workspace-address'),address=el('input');address.type='url';address.placeholder='https://…';address.setAttribute('aria-label','Dirección del navegador');address.required=true;
 const go=el('button','Abrir');go.type='submit';form.append(address,go);
 const workBoard=el('section',undefined,'workspace-work-board');workBoard.setAttribute('aria-label','Bandeja de encargos');sections.activity.append(workBoard);
 const liveDetail=el('details',undefined,'workspace-live-detail'),liveHost=el('div');liveDetail.append(el('summary','Ver ejecución observada'),liveHost);sections.activity.append(liveDetail);
 const workView=mountWorkView({container:liveHost,getCase:()=>selected&&getSelection()?.case_id===selected.case_id?selected.case_id:null,win,doc,onTasks:()=>setTab('tasks')});
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
 const pppToolbar=el('div',undefined,'workspace-ppp-toolbar');const boardRetry=button('Recuperar PPP',async()=>{await readSources();if(boardLink?.bridge&&!board){startBoardHandshake(true);postBoard('yod:ppp:hello');}void refresh();});boardRetry.className='workspace-board-retry';boardRetry.hidden=true;pppToolbar.append(pppNote,boardRetry,pppActions);pppActions.append(boardSummary);ppp.append(pppToolbar,applyNotice,receiptRetry,proposalHost,pppHost);
 const tasks=new DurableGoals({transport,getContext:()=>selected&&getSelection()?.case_id===selected.case_id?{selection:getSelection(),busy:false}:null,onUnauthorized:()=>clear()});
 const taskList=el('div'),newGoal=el('details',undefined,'workspace-new-goal'),goalForm=el('form'),goalNotice=el('p');
 newGoal.append(el('summary','Nuevo objetivo'),goalForm);const goalInputs={};
 for(const [key,label,max]of [['title','Qué quieres resolver',160],['instruction','Instrucciones',4000],['criterion','Qué debe entregar',1000]]){const row=el('label',label),input=el(key==='title'?'input':'textarea');input.required=true;input.maxLength=max;input.name=key;input.addEventListener('input',()=>{goalDraft[key]=input.value;});row.append(input);goalForm.append(row);goalInputs[key]=input;}
 const submit=el('button','Encargar análisis');submit.type='submit';goalForm.append(submit);goalNotice.className='workspace-goal-notice';goalNotice.setAttribute('role','status');
 const retryGoal=button('Comprobar la misma solicitud',()=>void tasks.retry());retryGoal.hidden=true;
 const routeDetail=el('section',undefined,'workspace-route-detail');sections.tasks.append(goalNotice,retryGoal,routeDetail,taskList,newGoal);
 goalForm.addEventListener('submit',async event=>{event.preventDefault();const own=generation;if(await tasks.read()&&own===generation&&await tasks.create({...goalDraft})){goalDraft={title:'',instruction:'',criterion:''};for(const input of Object.values(goalInputs))input.value='';newGoal.open=false;win.dispatchEvent(new CustomEvent('yod-goals-changed'));}});
 const actionLabels={approve:'Aceptar la entrega',resume:'Retomar',stop:'Detener'};
 tasks.subscribe(s=>{if(disposed)return;goalState=s;goalSnapshot=s.model;paintBrief();paintWorkBoard();goalNotice.textContent=s.notice||'';retryGoal.hidden=!s.pending;retryGoal.disabled=s.busy;submit.disabled=!selected?.can_enqueue||!selected?.goals?.ready||s.busy||!!s.pending||!s.model||s.model.goals.some(g=>!['stopped','completed'].includes(g.status));for(const b of taskList.querySelectorAll('[data-goal-action]'))b.disabled=!selected?.can_enqueue||s.busy||!!s.pending;
  const modelKey=JSON.stringify(s.model);if(modelKey===taskModelKey)return;taskModelKey=modelKey;const restore=rememberReading(taskList);taskList.replaceChildren();
  if(!s.model){const view=goalReadView(s,!!selected?.goals?.ready);taskList.append(el('p',view.why));return;}
  const history=el('details',undefined,'workspace-goal-history');history.append(el('summary','Historial de encargos detenidos y revisados'));disclosure(history,'goal-history');
  for(const g of orderedGoals(s.model.goals)){const display=goalDisplay(g),card=el('article',undefined,'workspace-card');card.dataset.goalId=g.goal_id;card.tabIndex=-1;card.classList.toggle('workspace-focused-goal',focusedGoal===g.goal_id);card.append(el('h3',g.title),el('p',display.label),el('p','Entregable: '+g.criterion),el('p',g.summary||'Sin avance registrado todavía.'),el('small','Último registro · '+new Date(g.updated_at).toLocaleString()));if(display.notice)card.append(el('p',display.notice));
   const instruction=el('details',undefined,'workspace-goal-instruction');instruction.append(el('summary','Propósito y método registrado'),el('p',g.instruction));disclosure(instruction,g.goal_id+':instruction');card.append(instruction);const steps=el('ol',undefined,'workspace-task-route');
   for(const t of [...g.tasks].sort((a,b)=>Number(a.id.slice(5))-Number(b.id.slice(5)))){const step=el('li');step.append(el('b',t.title),el('small',taskDisplay(t,g)));const detail=el('details');detail.append(el('summary','Criterio y avance'),el('p','Debe entregar: '+t.criterion),el('p',t.summary||'Sin resultado registrado todavía.'));disclosure(detail,g.goal_id+':task:'+t.id);for(const e of g.evidence.filter(e=>e.task_id===t.id&&t.evidence_ids.includes(e.id))){const evidence=el('details');evidence.append(el('summary',e.title),el('pre',e.text));disclosure(evidence,g.goal_id+':evidence:'+e.id);detail.append(evidence);}step.append(detail);steps.append(step);}card.append(steps);
   for(const e of g.evidence.filter(e=>!g.tasks.some(t=>t.id===e.task_id&&t.evidence_ids.includes(e.id)))){const d=el('details');d.append(el('summary',e.title),el('pre',e.text));disclosure(d,g.goal_id+':evidence:'+e.id);card.append(d);}
   if(['ready_for_review','completed','awaiting_data'].includes(g.status))card.append(button('Presentar avances',()=>{setTab('meeting');meeting.open(g,selected.case_id,selected.avatar?.name||selected.name);}));
   if(g.status==='ready_for_review')card.append(button('Discutir o pedir corrección',()=>{if(selected?.case_id!==g.case_id||getSelection()?.case_id!==g.case_id)return;onDiscuss({case_id:g.case_id,goal_id:g.goal_id,revision:g.revision,title:g.title});}));for(const action of goalReviewActions(g)){const label=actionLabels[action];
    const b=button(label,async()=>{const own=generation,current=()=>own===generation&&selected?.case_id===g.case_id&&getSelection()?.case_id===g.case_id;
    try{
     if(action==='approve'){const reviewed=await reviewPresentedGoal(tasks,{case_id:g.case_id,goal_id:g.goal_id,revision:g.revision},current);if(reviewed)win.dispatchEvent(new CustomEvent('yod-goals-changed'));}
     else if(await tasks.read()&&current()){const fresh=tasks.model?.goals.find(value=>value.goal_id===g.goal_id);if(fresh?.revision!==g.revision)throw Error('stale_revision');if(await tasks.review(g.goal_id,action))win.dispatchEvent(new CustomEvent('yod-goals-changed'));}
    }catch(error){if(current())goalNotice.textContent=error.message==='stale_revision'?'La entrega cambió. Revisa el registro actualizado antes de decidir.':'No se confirmó la decisión. Consulta su estado antes de repetir.';}});b.dataset.goalAction=action;b.dataset.focusKey=g.goal_id+':'+action;b.disabled=!selected?.can_enqueue||s.busy||!!s.pending;card.append(b);}
   if(['stopped','completed'].includes(g.status))history.append(card);else taskList.append(card);}
  if(history.childElementCount>1)taskList.append(history);
  if(!s.model.goals.length)taskList.append(el('p','No hay encargos registrados.'));restore();
 });

 function focusGoal(goalId){
  focusedGoal=goalId;setTab('tasks');
  for(const card of taskList.querySelectorAll('[data-goal-id]')){
   const selectedCard=card.dataset.goalId===goalId;card.classList.toggle('workspace-focused-goal',selectedCard);
   if(selectedCard){const history=card.closest?.('.workspace-goal-history');if(history)history.open=true;card.scrollIntoView?.({block:'start',behavior:'auto'});card.focus?.({preventScroll:true});}
  }
 }
 function paintWorkBoard(){
  const restore=rememberReading(workBoard),view=profileWorkView(goalState,selected?.case_id,!!selected?.goals?.ready);
  workBoard.replaceChildren();workBoard.dataset.readPhase=view.phase;
  const top=el('div',undefined,'workspace-work-intro');top.append(el('h2','Encargos del autón'),el('p','Qué está pendiente, qué necesita un dato y qué puedes revisar. Las metas y acciones de empresa se conservan en MOAC.'));
  workBoard.append(top);
  if(view.notice)workBoard.append(el('p',view.notice,'workspace-work-notice'));
  if(!goalState.model||view.phase==='unavailable'&&!selected?.goals?.ready){workBoard.append(el('p','No hay una lectura disponible para ordenar los encargos.'));return;}
  const lanes=el('div',undefined,'workspace-work-lanes');
  for(const [key,label]of PROFILE_WORK_LANES){
   const lane=el('section',undefined,'workspace-work-lane');lane.dataset.workLane=key;
   const heading=el('h3',label);heading.append(el('span',String(view.groups[key].length),'workspace-lane-count'));lane.append(heading);
   for(const goal of view.groups[key]){
    const task=nextRecordedTask(goal),open=button('',()=>focusGoal(goal.goal_id));open.className='workspace-work-item';open.dataset.goalFocus=goal.goal_id;open.dataset.focusKey='work:'+goal.goal_id;
    open.append(el('strong',goal.title),el('span',goalDisplay(goal).label));
    if(key==='blocked')open.append(el('small',task?.summary||goal.summary||task?.criterion||goal.criterion));
    else if(key==='review')open.append(el('small',goal.criterion));
    else if(task)open.append(el('small','Siguiente paso registrado: '+task.title));
    else open.append(el('small','Preparar la ruta del encargo'));
    if(view.historical)open.append(el('small','Registro anterior · conexión pendiente'));
    lane.append(open);
   }
   if(!view.groups[key].length)lane.append(el('p',view.phase==='ready'?'Sin encargos en esta categoría.':'Sin registro recibido para esta categoría.','workspace-lane-empty'));
   lanes.append(lane);
  }
  workBoard.append(lanes);
  if(view.groups.history.length)workBoard.append(button('Ver historial de encargos ('+view.groups.history.length+')',()=>setTab('tasks')));
  if(view.confirmedEmpty)workBoard.append(button('Definir un encargo',()=>{setTab('tasks');newGoal.open=true;goalInputs.title.focus();}));
  restore();
 }
 function paintBrief(){
  const restoreBrief=rememberReading(brief),restoreRoute=rememberReading(routeDetail);brief.replaceChildren();routeDetail.replaceChildren();if(!selected)return;
  const view=goalReadView(goalState,!!selected.goals?.ready),profile=profileWorkView(goalState,selected.case_id,!!selected.goals?.ready),goal=profile.selected;
  const route=goal?goalRoadmap([goal]):null;
  brief.dataset.readPhase=view.phase;
  const meta=el('div',undefined,'workspace-brief-meta');meta.append(el('small','ENCARGO DEL AUTÓN · '+view.label),el('h2',goal?.title||(profile.confirmedEmpty?'Sin encargo activo':view.title)));
  const next=el('div',undefined,'workspace-brief-next');next.append(el('small','SIGUIENTE DECISIÓN'),el('h3',route?.next||(profile.confirmedEmpty?'Definir un encargo o consultar el historial':view.next)));
  const inspect=button(view.phase==='unavailable'?'Recuperar lectura':'Ver trabajo',()=>{if(view.phase==='unavailable')void tasks.read();else setTab('activity');});
  inspect.dataset.focusKey='route-inspect';inspect.disabled=!selected.goals?.ready||goalState.busy;
  brief.append(meta,next,inspect);
  if(route){const routeCard=el('article',undefined,'workspace-card workspace-route-card');routeCard.append(el('small',goalDisplay(goal).label),el('h2',route.next),el('p',route.why),el('small','Último registro: '+new Date(goal.updated_at).toLocaleString()));
   if(profile.historical)routeCard.append(el('p','Este registro puede haber cambiado; recupera la lectura antes de decidir.'));
   routeDetail.append(routeCard);
  }
  routeDetail.append(button('Consultar fuentes del expediente',()=>setTab('sources')));restoreBrief();restoreRoute();
 }
 async function session(){
  const current=getSelection(),own=generation;if(!current||!selected||current.case_id!==selected.case_id)throw Error('unauthorized');
  if(credential?.case_id===current.case_id&&credential.expires_at-Date.now()>45000)return credential;
  const id=current.case_id,raw=await officeFastSessions.ensure(id,p=>transport.mintFastSession(p));
  if(disposed||own!==generation||getSelection()?.case_id!==id)throw Error('session_changed');
  return credential=validateFastSession(raw,id);
 }
 async function request(path,data={}){
  const own=generation,c=await session();
  if(disposed||own!==generation||getSelection()?.case_id!==selected?.case_id)throw Error('session_changed');
  const r=await fetch(c.endpoint+path,{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(55000),body:JSON.stringify(data)});
  if(own!==generation||disposed)throw Error('session_changed');
  if(r.status===401||r.status===403){officeFastSessions.forget(selected?.case_id);credential=null;clear();throw Error('unauthorized');}
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
 function postBoard(type,extra={}){if(frame&&selected&&boardLink?.bridge)frame.contentWindow?.postMessage({type,version:1,nonce,case_id:boardLink.board_case_id,...{board_case_id:boardLink.board_case_id,...(selected.ppp?.scenario_id?{scenario_id:selected.ppp.scenario_id}:{})},...extra},boardLink.origin);}
 function applyProposal(p){

    if(receipts.size>=8||receipts.has(p.request_id)||!getSelection()?.can_enqueue||getSelection()?.case_id!==selected?.case_id||proposalState(board,p,application)!=='ready')return;
    application={request_id:p.request_id,status:'sending'};
    applyNotice.textContent='Ajuste enviado. Esperando guardado y recálculo; no repitas la solicitud.';
    paintProposals();postBoard('yod:ppp:apply',{proposal:{...p,case_id:boardLink.board_case_id}});
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
   pppNote.textContent='El PPP todavía no compartió su lectura. Recupera su conexión aquí; el tablero y la conversación se conservan.';boardRetry.hidden=false;
  },15000);
 }
 function mountBoard(){
  if(frame||!selected)return;
  boardLink=resolveBoard(selected,conversation?.documents||[]);
  if(!boardLink){pppNote.textContent=conversation?'No se encontró un vínculo único del PPP para este proyecto. Revisa sus fuentes registradas.':'Buscando el PPP registrado…';boardRetry.hidden=!conversation;return;}
  frame=el('iframe');frame.title='Plan de potencial · '+selected.name;frame.referrerPolicy=boardLink.bridge?'same-origin':'no-referrer';frame.src=boardLink.url;frame.allow='';nonce=win.crypto.randomUUID();
  frame.addEventListener('load',()=>postBoard('yod:ppp:hello'));pppHost.append(frame);startBoardHandshake();
  pppNote.textContent=boardLink.bridge?'Abriendo el modelo registrado…':boardLink.surface==='ppp'?'PPP registrado abierto. Este modelo todavía no comparte su lectura ni admite ajustes del autón. Puedes consultar el tablero; no se enviarán cambios desde el puesto.':'Hoja registrada del PPP. Su sesión de Google puede ser necesaria. La edición compartida todavía no está conectada para esta fuente.';
  const a=el('a','Abrir el PPP en otra pestaña ↗');a.href=boardLink.external;a.target='_blank';a.rel='noopener noreferrer';a.className='workspace-external-board';pppActions.append(a);
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
    const shared=nativeBoardState(data.board,selected,boardLink);
    if(shared){
     const r=await request('/board/snapshot',shared);if(own!==generation||!selected)return;board=r.tablero;clearBoardHandshake();boardHandshakeTimedOut=false;boardRetry.hidden=true;
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
  const promise=(async()=>{try{const raw=await transport.read({case_id:id});if(own!==generation||disposed||getSelection()?.case_id!==id)return;conversation=validateWorkspaceSources(raw,id);
   documentTray?.destroy();documentTray=mountDocumentTray({container:sections.sources,documents:conversation.documents,doc});
   paintBrief();mountBoard();
  }catch{if(own!==generation||disposed)return;documentTray?.destroy();documentTray=null;sections.sources.replaceChildren(el('p','No se pudieron recuperar las fuentes. La conversación puede continuar.'),button('Volver a cargar fuentes',()=>void readSources()));if(!frame){pppNote.textContent='No se pudo recuperar el vínculo del PPP. Puedes recuperar su conexión sin cerrar el puesto.';boardRetry.hidden=false;}}})();
  readingSources={generation:own,promise};try{await promise;}finally{if(readingSources?.promise===promise)readingSources=null;}
 }
 async function refresh(){
  if(disposed||!active||fetching||doc.hidden||!selected)return;const own=generation,token={generation:own};fetching=token;
  if(selected.goals?.ready&&Date.now()-lastTaskRead>=12000){lastTaskRead=Date.now();void tasks.read();}
  try{
   if(getSelection()?.case_id!==selected.case_id){clear();return;}
   if(!frame&&!readingSources&&sourceAttempts<3&&Date.now()>=sourceRetryAt)void readSources();
   if(tab==='browser')paintBrowser(await request('/computer/state'));
   if(boardLink?.bridge){startBoardHandshake();postBoard(board?'yod:ppp:read':'yod:ppp:hello');const r=await request('/board/state');proposals=r.proposals||[];paintProposals();dispatchRequested();}
  }catch{if(own===generation)notice.textContent='El puesto no respondió. Reintentando; la conversación puede continuar.';}
  finally{if(fetching===token)fetching=null;}
 }
 function setTab(id){if(!WORKSPACE_TABS.some(([k])=>k===id))return;if(tab==='meeting'&&id!=='meeting')meeting.hide();if(tab==='knowledge'&&id!=='knowledge')knowledge.hide();tab=id;root.dataset.workspaceGroup=workspaceGroup(id);root.dataset.workspaceView=id;inspector.hidden=id==='ppp';body.dataset.inspectorOpen=String(id!=='ppp');inspectorTitle.textContent=WORKSPACE_TABS.find(([key])=>key===id)?.[1]||'Detalle';subnav.hidden=id==='ppp';
  for(const [key,section]of Object.entries(sections)){section.hidden=key!=='ppp'&&key!==id;const b=root.querySelector('[data-tab="'+key+'"]');b.setAttribute('aria-pressed',String(Object.hasOwn(WORKSPACE_GROUPS,key)?workspaceGroup(id)===key:key===id));if(b.parentElement===subnav)b.hidden=workspaceGroup(key)!==workspaceGroup(id);}

  if(id==='avatar'&&selected)void avatarCard.open(selected);if(id==='meeting'&&!meeting.snapshot()){presentationHost.replaceChildren(el('p','Buscando la última entrega preparada…'));void openLatestMeeting();}
  if(id==='meeting'&&selected)archive.open(selected.case_id);
  mountBoard();if(id==='activity'){notice.textContent='';paintWorkBoard();workView.refresh();}if(id==='browser')workView.refresh();if(id==='ppp'){notice.textContent='';mountBoard();}if(id==='knowledge'&&selected){notice.textContent='';void knowledge.open(selected.case_id);}void refresh();}
 async function openLatestMeeting(){
  const own=generation,id=selected?.case_id;if(!id)return;
  await tasks.read();if(own!==generation||getSelection()?.case_id!==id||tab!=='meeting')return;
  const goal=(tasks.model?.goals||[]).filter(g=>['ready_for_review','completed','awaiting_data'].includes(g.status)).sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at))[0];
  if(goal)meeting.open(goal,id,selected.avatar?.name||selected.name);
  else presentationHost.replaceChildren(el('p','Todavía no hay una entrega preparada para presentar.'),button('Ver pendientes',()=>setTab('tasks')));
 }
 function clear(){archive.clear();documentTray?.destroy();documentTray=null;meeting.clear();avatarCard.clear();workView.clear();generation++;fetching=null;clearBoardHandshake();boardHandshakeTimedOut=false;clearTimeout(applyTimer);applyTimer=null;application=null;receipts.clear();receiptRetry.hidden=true;receiptRetry.disabled=false;applyNotice.textContent='';boardSummary.textContent='Todavía no hay una lectura compartida.';boardRetry.hidden=true;focusedGoal=null;workBoard.replaceChildren();knowledge.reset();lastTaskRead=0;goalSnapshot=null;taskModelKey=null;brief.replaceChildren();credential=null;selected=null;board=null;boardRevision=null;conversation=null;readingSources=null;sourceAttempts=0;sourceRetryAt=0;boardLink=null;proposals=[];goalDraft={title:'',instruction:'',criterion:''};for(const input of Object.values(goalInputs))input.value='';newGoal.open=false;frame?.remove();frame=null;image.removeAttribute('src');image.hidden=true;activity.replaceChildren();links.replaceChildren();taskList.replaceChildren();sections.sources.replaceChildren();proposalHost.replaceChildren();pppHost.replaceChildren();pppActions.querySelector('.workspace-external-board')?.remove();goalState={model:null,status:'disconnected',notice:'',pending:null};tasks.hide();notice.textContent='El acceso cambió. Vuelve a abrir tu despacho.';}
 function open(selection,target='ppp'){if(selected?.case_id===selection.case_id){active=true;setTab(target);void readSources();return;}clear();selected=selection;if(!selection.goals?.ready)taskList.append(el('p','El seguimiento de objetivos aún no está conectado para este proyecto.'));root.setAttribute('aria-label','Puesto de '+stationIdentity(selection).name);active=true;generation++;notice.textContent='Preparando el puesto de '+selection.name+'…';paintBrief();setTab(target);void readSources();if(!timer)timer=setInterval(()=>void refresh(),tab==='tasks'?12000:4000);}
 win.addEventListener('message',receive);
 return{open,setTab,getTab:()=>tab,reset:clear,setActive(value){if(active===value)return;active=value;if(!value){meeting.hide();knowledge.hide();clearBoardHandshake();}if(value)void refresh();},dispose(){disposed=true;clear();workView.dispose();knowledge.dispose();clearInterval(timer);win.removeEventListener('message',receive);root.remove();transport.dispose?.();},root};
}
