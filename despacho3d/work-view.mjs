import {workHeadline,safeWorkURL} from './work-observer.mjs?v=1';
export function mountWorkView({container,getCase,win=window,doc=document,onTasks=()=>{}}){
 const el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const root=el('section');root.className='workspace-live-work';root.setAttribute('aria-label','Trabajo observable');
 const label=el('small','COMPUTADORA DEL AUTÓN'),status=el('h3','Consultando actividad…'),title=el('p'),step=el('p'),stamp=el('small'),result=el('p'),details=el('details'),summary=el('summary','Pasos, fuentes y resultado'),body=el('div'),tasks=el('button','Ver pendientes');
 tasks.type='button';tasks.onclick=onTasks;status.setAttribute('aria-live','polite');details.append(summary,body);root.append(label,status,title,step,stamp,result,details,tasks);container.append(root);
 let stop=null,latest=null,lastPaint=null;
 function paint(state){
  latest=state;const valid=getCase()&&state.case_id===getCase(),w=valid?state.work:null;
  const key=JSON.stringify({case_id:getCase(),phase:state.phase,work:w});if(lastPaint===key)return;lastPaint=key;
  status.textContent=valid?workHeadline(state):'Sin actividad de este proyecto';title.textContent=w?.title||'';body.replaceChildren();step.textContent='';result.textContent='';stamp.textContent='';details.hidden=!w;tasks.hidden=!w;
  if(!w)return;
  const live=['working','tool'].includes(w.phase)&&state.phase==='ready',current=w.progress.progress.tasks.find(t=>t.status==='running');
  step.textContent=current?(live?'Ahora: ':'Última tarea: ')+current.title:'';
  stamp.textContent='Último registro · '+new Date(w.updated_at).toLocaleString();
  if(w.result)result.textContent=w.result.summary;
  if(w.phase==='prepared')body.append(el('p','Análisis preparado. Consulta Pendientes para comprobar su registro y revisarlo; todavía no es una aprobación del PPP.'));
  if(state.phase!=='ready')body.append(el('p','Conexión pendiente. Estos son los últimos registros recibidos.'));
  if(w.phase==='interrupted')body.append(el('p','La ejecución se interrumpió. Observar esta pantalla no la reanuda.'));
  const list=el('ol');for(const t of w.progress.progress.tasks){const item=el('li'),name=el('strong',t.title),phase=t.status==='running'&&!live?'Sin ejecución confirmada':{pending:'Pendiente',running:'Trabajando',ready_for_review:'Para revisión',blocked:'Faltan datos'}[t.status];item.append(name,el('p',phase+(t.summary?' · '+t.summary:'')));list.append(item);}body.append(list);
  for(const source of w.sources){const row=el('p'),url=safeWorkURL(source.url);if(url){const a=el('a',source.title||'Abrir fuente');a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);}else row.append(el('span',source.title||'Documento'));row.append(el('small',' · '+(source.task_id||'Expediente')+' · '+new Date(source.consulted_at).toLocaleString()));body.append(row);}
  for(const evidence of w.progress.progress.evidence){const card=el('details');card.append(el('summary',evidence.title),el('pre',evidence.text));body.append(card);}
  const events=el('ol');for(const e of w.events.slice(-8)){events.append(el('li',e.label+' · '+({working:'inicio',completed:'terminado',failed:'sin completar'}[e.status])+' · '+new Date(e.at).toLocaleTimeString()));}body.append(events);
 }
 function bind(){stop?.();stop=win.YodWorkObserver?.subscribe(paint)||null;}
 win.addEventListener('yod-work-observer-ready',bind);bind();
 return{refresh(){const fresh=win.YodWorkObserver?.snapshot?.()||latest;if(fresh)paint(fresh);},clear(){latest=null;paint({phase:'unauthorized',case_id:null,work:null});},dispose(){stop?.();win.removeEventListener('yod-work-observer-ready',bind);root.remove();}};
}
