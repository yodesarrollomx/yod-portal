import {workHeadline,safeWorkURL} from './work-observer.mjs?v=126';
// The next step describes a human decision, never an automatic execution.
export function recoveryNextStep(state){
 if(state.phase!=='ready')return 'Actualiza la conexión antes de decidir. El último registro puede haber cambiado.';
 const runtime=state.runtime?.phase;
 if(runtime==='waiting_capacity')return 'El encargo espera su turno en el servidor. No hace falta mantener esta vista abierta.';
 if(['starting','reconnecting','unavailable','disabled','stopped'].includes(runtime))return 'Revisa el estado del motor antes de dar por iniciada una ejecución.';
 const w=state.work;
 if(runtime==='working'&&w&&!['working','tool'].includes(w.phase))return 'El servidor está preparando el siguiente encargo; el registro anterior se conserva debajo.';
 if(!w)return 'Consulta Pendientes para elegir o encargar el siguiente objetivo.';
 return ({prepared:'Abre Pendientes para comprobar el registro y revisar el análisis.',awaiting_data:'Consulta qué datos faltan en Pendientes antes de retomar.',interrupted:'Revisa el último avance en Pendientes. Retomar requiere una acción tuya.',error:'Revisa el intento y su evidencia en Pendientes antes de repetir.',working:'Puedes consultar el avance y las fuentes mientras continúa el análisis.',tool:'Puedes consultar el avance y las fuentes mientras continúa la consulta.'})[w.phase];
}
export function mountWorkView({container,getCase,win=window,doc=document,onTasks=()=>{}}){
 const el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const root=el('section');root.className='workspace-live-work';root.setAttribute('aria-label','Trabajo observable');
 const label=el('small','TRABAJO DEL PROYECTO'),status=el('h3','Consultando actividad…'),title=el('h2'),step=el('p'),stamp=el('small'),result=el('p'),next=el('p'),resultBlock=el('section'),nextBlock=el('section'),details=el('details'),summary=el('summary','Avance, fuentes y evidencia'),body=el('div'),tasks=el('button','Abrir pendientes');
 title.className='work-title';status.className='work-state';resultBlock.className='work-result';nextBlock.className='work-next';stamp.className='work-stamp';
 resultBlock.append(el('h4','Resultado'),result);nextBlock.append(el('h4','Siguiente paso'),next,tasks);
 tasks.type='button';tasks.onclick=onTasks;status.setAttribute('aria-live','polite');details.append(summary,body);root.append(label,title,status,step,stamp,resultBlock,nextBlock,details);container.append(root);
 const historySection=el('section'),historyButton=el('button','Ver historial de ejecuciones'),historyStatus=el('p'),historyBody=el('div');
 historySection.className='work-history';historySection.append(el('h4','Historial del proyecto'),historyButton,historyStatus,historyBody);root.append(historySection);
 historyButton.type='button';historyStatus.setAttribute('aria-live','polite');
 let stop=null,latest=null,lastPaint=null,disposed=false,historyGeneration=0,historyCase=null,historyPage=null;
 function resetHistory(){historyGeneration++;historyCase=null;historyPage=null;historyBody.replaceChildren();historyStatus.textContent='';historyButton.disabled=false;}
 const isCurrentHistory=(id,own)=>!disposed&&own===historyGeneration&&getCase()===id&&latest?.case_id===id&&latest.phase!=='unauthorized'&&latest.history_available===true;
 function historySummary(work){
  const card=el('article');card.append(el('h4',work.title),el('small',new Date(work.updated_at).toLocaleString()),el('p',workHeadline({phase:'ready',case_id:work.case_id,work})));
  return card;
 }
 function renderHistoryPage(){
  historyBody.replaceChildren();if(!historyPage)return;
  for(const entry of historyPage.entries){
   const card=historySummary(entry),open=el('button','Ver registro');open.type='button';open.dataset.historyEntry=entry.entry_id;open.onclick=()=>void loadHistory({entry_id:entry.entry_id});
   card.append(el('p',entry.metrics.ready_for_review+'/'+entry.metrics.total+' tareas para revisar · '+entry.metrics.evidence_count+' evidencias'),open);historyBody.append(card);
  }
  if(!historyPage.entries.length)historyBody.append(el('p','Todavía no hay ejecuciones guardadas para este proyecto.'));
  if(historyPage.next){const more=el('button','Ejecuciones anteriores');more.type='button';more.onclick=()=>void loadHistory({limit:12,before:historyPage.next});historyBody.append(more);}
 }
 function renderHistoricalWork(work){
  historyBody.replaceChildren();const back=el('button','Volver a la lista');back.type='button';back.onclick=()=>{historyGeneration++;renderHistoryPage();historyStatus.textContent='Registros guardados; esta consulta no reanuda tareas.';};historyBody.append(back);
  if(!work){historyBody.append(el('p','Este registro ya no está disponible.'));return;}
  const card=historySummary(work);card.append(el('p','Registro histórico · consultar no ejecuta ni aprueba el PPP.'),el('p',work.result?.summary||work.progress.progress.summary||'Sin resultado registrado.'));
  const list=el('ol');for(const task of work.progress.progress.tasks)list.append(el('li',task.title+' · '+({pending:'Pendiente',running:'Ejecución registrada',ready_for_review:'Para revisión',blocked:'Faltan datos'}[task.status])+(task.summary?' · '+task.summary:'')));card.append(list);
  for(const source of work.sources){const row=el('p'),url=safeWorkURL(source.url);if(url){const a=el('a',source.title||'Abrir fuente');a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);}else row.append(el('span',source.title||'Documento'));row.append(el('small',' · '+new Date(source.consulted_at).toLocaleString()));card.append(row);}
  for(const evidence of work.progress.progress.evidence){const note=el('details');note.append(el('summary',evidence.title),el('pre',evidence.text));card.append(note);}
  if(work.document){const note=el('details');note.append(el('summary','Lectura guardada · '+work.document.title),el('small',new Date(work.document.read_at).toLocaleString()),el('pre',work.document.content));card.append(note);}
  const events=el('details'),rows=el('ol');events.append(el('summary','Registro de actividad · '+(work.event_count??work.events.length)));for(const event of work.events)rows.append(el('li',event.label+' · '+new Date(event.at).toLocaleString()));events.append(rows);card.append(events);historyBody.append(card);
 }
 async function loadHistory(options={limit:12}){
  const id=getCase();if(!id||latest?.case_id!==id||latest.phase==='unauthorized'||latest.history_available!==true||!win.YodWorkObserver?.history)return;
  const own=++historyGeneration;historyCase=id;historyButton.disabled=true;historyStatus.textContent='Consultando registros guardados…';
  try{
   const page=await win.YodWorkObserver.history(options);if(!isCurrentHistory(id,own))return;
   if(!page.available){historyBody.replaceChildren();historyStatus.textContent='El historial no está disponible en este momento.';return;}
   if(options.entry_id)renderHistoricalWork(page.work);else{historyPage=page;renderHistoryPage();}
   historyStatus.textContent='Registros guardados; esta consulta no reanuda tareas.';
  }catch(error){if(isCurrentHistory(id,own)){historyBody.replaceChildren();historyStatus.textContent='No se pudo recuperar el historial. Vuelve a intentarlo.';}}
  finally{if(isCurrentHistory(id,own))historyButton.disabled=false;}
 }
 historyButton.onclick=()=>void loadHistory();
 function paint(state){
  latest=state;const valid=getCase()&&state.case_id===getCase(),w=valid&&state.phase!=='unauthorized'?state.work:null;
  if(!valid||state.phase==='unauthorized'||historyCase&&historyCase!==getCase())resetHistory();
  historySection.hidden=!valid||state.phase==='unauthorized';historyButton.hidden=state.history_available!==true;
  if(valid&&state.history_available!==true){resetHistory();historyStatus.textContent='El historial aún no está disponible en esta conexión.';historyBody.replaceChildren();}
  const key=JSON.stringify({case_id:getCase(),phase:state.phase,work:w,runtime:state.runtime,history_available:state.history_available});if(lastPaint===key)return;lastPaint=key;
  status.textContent=valid?workHeadline(state):'Sin actividad de este proyecto';title.textContent=w?.title||'Tu trabajo en este puesto';body.replaceChildren();step.textContent='';result.textContent='';stamp.textContent='';details.hidden=!w;
  root.dataset.workId=w?.run_id||'';root.dataset.goalId=w?.goal_id||'';
  resultBlock.hidden=!w;nextBlock.hidden=!valid||state.phase==='unauthorized'||state.phase==='loading';
  next.textContent=valid?recoveryNextStep(state):'';
  if(!w)return;
  const live=['working','tool'].includes(w.phase)&&state.phase==='ready'&&(!state.runtime||state.runtime.phase==='working'),current=w.progress.progress.tasks.find(t=>t.status==='running');
  const prior=state.runtime&&(['waiting_capacity','starting','reconnecting','unavailable','disabled','stopped'].includes(state.runtime.phase)||state.runtime.phase==='working'&&!['working','tool'].includes(w.phase));
  label.textContent=prior?'REGISTRO ANTERIOR DEL PROYECTO':'TRABAJO DEL PROYECTO';
  step.textContent=current?(live?'Ahora: ':'Última tarea: ')+current.title:'';
  stamp.textContent='Último registro · '+new Date(w.updated_at).toLocaleString();
  result.textContent=w.result?.summary||'Todavía no hay un resultado registrado.';
  if(w.phase==='prepared')result.textContent+=' El análisis preparado todavía no es una aprobación del PPP.';
  if(state.phase!=='ready')body.append(el('p','Conexión pendiente. Estos son los últimos registros recibidos.'));
  if(w.phase==='interrupted')body.append(el('p','La ejecución se interrumpió. Observar esta pantalla no la reanuda.'));
  if(w.document){const document=el('details');document.className='work-document';document.open=true;document.append(el('summary','Última lectura · '+w.document.title),el('small',new Date(w.document.read_at).toLocaleString()+(w.document.tab?' · '+w.document.tab:'')+(w.document.range?' · '+w.document.range:'')),el('pre',w.document.content),el('p',w.document.truncated?'Extracto limitado a 8.000 caracteres; consulta la fuente completa.':'Texto recibido en esta lectura.'));body.append(document);}
  const list=el('ol');body.append(el('h4','Avance'));for(const t of w.progress.progress.tasks){const item=el('li'),name=el('strong',t.title),phase=t.status==='running'&&!live?'Sin ejecución confirmada':{pending:'Pendiente',running:'Trabajando',ready_for_review:'Para revisión',blocked:'Faltan datos'}[t.status];item.append(name,el('p',phase+(t.summary?' · '+t.summary:'')));list.append(item);}body.append(list,el('h4','Fuentes consultadas'));
  if(!w.sources.length)body.append(el('p','No hay fuentes consultadas registradas para esta ejecución.'));
  for(const source of w.sources){const row=el('p'),url=safeWorkURL(source.url);if(url){const a=el('a',source.title||'Abrir fuente');a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);}else row.append(el('span',source.title||'Documento'));row.append(el('small',' · '+(source.task_id||'Expediente')+' · '+new Date(source.consulted_at).toLocaleString()));body.append(row);}
  for(const evidence of w.progress.progress.evidence){const card=el('details');card.append(el('summary',evidence.title),el('pre',evidence.text));body.append(card);}
  const identity=el('details');identity.append(el('summary','Identificadores del registro'),el('p','Ejecución: '+w.run_id+' · Objetivo: '+w.goal_id+' · Revisión fuente: '+w.source_revision));body.append(identity);
  const events=el('ol');for(const e of w.events.slice(-8)){events.append(el('li',e.label+' · '+({working:'inicio',completed:'terminado',failed:'sin completar'}[e.status])+' · '+new Date(e.at).toLocaleTimeString()));}body.append(events);
 }
 function bind(){stop?.();stop=win.YodWorkObserver?.subscribe(paint)||null;}
 win.addEventListener('yod-work-observer-ready',bind);bind();
 return{refresh(){const fresh=win.YodWorkObserver?.snapshot?.()||latest;if(fresh)paint(fresh);},clear(){latest=null;paint({phase:'unauthorized',case_id:null,work:null});},dispose(){disposed=true;resetHistory();stop?.();win.removeEventListener('yod-work-observer-ready',bind);root.remove();}};
}
