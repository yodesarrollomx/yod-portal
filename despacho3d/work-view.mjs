import {workHeadline,safeWorkURL} from './work-observer.mjs?v=1';
// The next step describes a human decision, never an automatic execution.
export function recoveryNextStep(state){
 if(state.phase!=='ready')return 'Actualiza la conexión antes de decidir. El último registro puede haber cambiado.';
 const w=state.work;
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
 let stop=null,latest=null,lastPaint=null;
 function paint(state){
  latest=state;const valid=getCase()&&state.case_id===getCase(),w=valid?state.work:null;
  const key=JSON.stringify({case_id:getCase(),phase:state.phase,work:w});if(lastPaint===key)return;lastPaint=key;
  status.textContent=valid?workHeadline(state):'Sin actividad de este proyecto';title.textContent=w?.title||'Tu trabajo en este puesto';body.replaceChildren();step.textContent='';result.textContent='';stamp.textContent='';details.hidden=!w;
  root.dataset.workId=w?.run_id||'';root.dataset.goalId=w?.goal_id||'';
  resultBlock.hidden=!w;nextBlock.hidden=!valid||state.phase==='unauthorized'||state.phase==='loading';
  next.textContent=valid?recoveryNextStep(state):'';
  if(!w)return;
  const live=['working','tool'].includes(w.phase)&&state.phase==='ready',current=w.progress.progress.tasks.find(t=>t.status==='running');
  step.textContent=current?(live?'Ahora: ':'Última tarea: ')+current.title:'';
  stamp.textContent='Último registro · '+new Date(w.updated_at).toLocaleString();
  result.textContent=w.result?.summary||'Todavía no hay un resultado registrado.';
  if(w.phase==='prepared')result.textContent+=' El análisis preparado todavía no es una aprobación del PPP.';
  if(state.phase!=='ready')body.append(el('p','Conexión pendiente. Estos son los últimos registros recibidos.'));
  if(w.phase==='interrupted')body.append(el('p','La ejecución se interrumpió. Observar esta pantalla no la reanuda.'));
  const list=el('ol');body.append(el('h4','Avance'));for(const t of w.progress.progress.tasks){const item=el('li'),name=el('strong',t.title),phase=t.status==='running'&&!live?'Sin ejecución confirmada':{pending:'Pendiente',running:'Trabajando',ready_for_review:'Para revisión',blocked:'Faltan datos'}[t.status];item.append(name,el('p',phase+(t.summary?' · '+t.summary:'')));list.append(item);}body.append(list,el('h4','Fuentes consultadas'));
  if(!w.sources.length)body.append(el('p','No hay fuentes consultadas registradas para esta ejecución.'));
  for(const source of w.sources){const row=el('p'),url=safeWorkURL(source.url);if(url){const a=el('a',source.title||'Abrir fuente');a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);}else row.append(el('span',source.title||'Documento'));row.append(el('small',' · '+(source.task_id||'Expediente')+' · '+new Date(source.consulted_at).toLocaleString()));body.append(row);}
  for(const evidence of w.progress.progress.evidence){const card=el('details');card.append(el('summary',evidence.title),el('pre',evidence.text));body.append(card);}
  const identity=el('details');identity.append(el('summary','Identificadores del registro'),el('p','Ejecución: '+w.run_id+' · Objetivo: '+w.goal_id+' · Revisión fuente: '+w.source_revision));body.append(identity);
  const events=el('ol');for(const e of w.events.slice(-8)){events.append(el('li',e.label+' · '+({working:'inicio',completed:'terminado',failed:'sin completar'}[e.status])+' · '+new Date(e.at).toLocaleTimeString()));}body.append(events);
 }
 function bind(){stop?.();stop=win.YodWorkObserver?.subscribe(paint)||null;}
 win.addEventListener('yod-work-observer-ready',bind);bind();
 return{refresh(){const fresh=win.YodWorkObserver?.snapshot?.()||latest;if(fresh)paint(fresh);},clear(){latest=null;paint({phase:'unauthorized',case_id:null,work:null});},dispose(){stop?.();win.removeEventListener('yod-work-observer-ready',bind);root.remove();}};
}
