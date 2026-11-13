import {useEffect,useState} from 'react';
import {DEFAULT_DURABLE_GOAL,watchGoals,goalDisplay,taskDisplay,goalReviewActions} from '../despacho3d/goals.mjs';

const intentions:Record<string,string>={approve:'Acepto el resultado y sus evidencias. Esta meta quedará cerrada; esto no aprueba el Plan de Potencial ni una decisión de negocio.',resume:'Quiero reanudar esta meta con la lectura actual del expediente. El agente conservará las evidencias ya guardadas.',stop:'Quiero detener esta meta. Se conservará lo guardado y se cancelará el trabajo que siga en ejecución.'};
type Controller={state:()=>any,subscribe:(fn:(value:any)=>void)=>()=>void,read:()=>Promise<boolean>,create:(draft:any)=>Promise<boolean>,review:(id:string,action:string)=>Promise<boolean>,retry:()=>Promise<boolean>,hide:()=>void};
export function DurableGoalsPanel({controller,active,workerReady}:{controller:Controller,active:boolean,workerReady:boolean}){
 const [state,setState]=useState(()=>controller.state());
 const [draft,setDraft]=useState({...DEFAULT_DURABLE_GOAL}),[review,setReview]=useState<{id:string,revision:string,action:string}|null>(null);
 useEffect(()=>controller.subscribe(setState),[controller]);
 useEffect(()=>{if(!active){controller.hide();return;}const stop=watchGoals(controller,{visible:()=>document.visibilityState!=='hidden'});return()=>{stop();controller.hide();};},[controller,active]);
 useEffect(()=>{if(review&&!state.model?.goals.some((goal:any)=>goal.goal_id===review.id&&goal.revision===review.revision))setReview(null);},[state.model,review]);
 const goals=state.model?.goals||[];
 const activeGoal=goals.some((goal:any)=>!['stopped','completed'].includes(goal.status));
 const disabled=state.busy||!!state.pending;
 const act=async()=>{if(!review)return;const accepted=await controller.review(review.id,review.action);if(accepted)setReview(null);};
 const create=async(event:React.FormEvent)=>{event.preventDefault();await controller.create(draft);};
 return <section className="dossier-section durable-goals" aria-labelledby="durable-goals-title">
  <div className="durable-goals-head"><h2 id="durable-goals-title">Metas y tareas</h2><button type="button" className="btn" disabled={state.busy} onClick={()=>void controller.read()}>{state.busy?'Actualizando…':'Actualizar tareas'}</button></div>
  <p>El agente organiza el trabajo en tareas y guarda aquí sus resultados con evidencia. Las metas y sus avances se recuperan de Sheets.</p>
  <p className="durable-tools">Herramientas de esta fase: consultar el expediente, planificar tareas y guardar evidencias.</p>
  {!workerReady&&<p className="conversation-notice" role="status">La última comprobación no encontró el motor disponible. Las metas guardadas quedarán en espera hasta que se conecte.</p>}
  {state.notice&&<p className="conversation-notice" role="status">{state.notice}</p>}
  {state.pending&&<div className="durable-pending"><p>Hay un guardado sin confirmar. Puedes consultar el estado o reintentar exactamente la misma acción.</p><button type="button" className="btn" disabled={state.busy} onClick={()=>void controller.retry()}>Reintentar guardado</button></div>}
  {!state.model&&<p className="muted">{state.busy?'Consultando las metas guardadas…':'Actualiza para consultar las metas del expediente.'}</p>}
  {state.model&&!goals.length&&<p className="muted">Todavía no hay metas guardadas.</p>}
  <div className="durable-goal-list">{goals.map((goal:any)=><article className="dossier-record durable-goal" key={goal.goal_id}>
   <div className="durable-goal-heading"><h3>{goal.title}</h3><span className={`durable-state durable-state-${goal.status}`}>{goalDisplay(goal).label}</span></div>
   <p>{goal.instruction}</p><p className="dossier-meta"><b>Resultado esperado: </b>{goal.criterion}</p>
   {goal.status==='queued'&&<p className="durable-progress-note">Meta guardada. {workerReady?'El agente la tomará cuando esté libre.':'Esperando a que se conecte el motor.'}</p>}
   {goal.status==='running'&&<p className="durable-progress-note">{goalDisplay(goal).notice}</p>}
   {goal.status==='ready_for_review'&&<p className="durable-progress-note">Revisa el resultado y sus evidencias antes de aceptarlo.</p>}
   {goal.status==='awaiting_data'&&<p className="durable-progress-note">Revisa los datos faltantes en el resumen. Puedes reanudar cuando el expediente tenga lo necesario.</p>}
   {goal.summary&&<div className="durable-summary"><h4>Resultado y siguientes pasos</h4><p>{goal.summary}</p></div>}
   <ol className="durable-tasks">{goal.tasks.map((task:any)=><li key={task.id}>
    <div className="durable-goal-heading"><h4>{task.title}</h4><span className="durable-state">{taskDisplay(task,goal)}</span></div>
    <p className="dossier-meta"><b>Comprobación: </b>{task.criterion}</p>{task.summary&&<p>{task.summary}</p>}
    {goal.evidence.filter((item:any)=>item.task_id===task.id).map((item:any)=><details className="durable-evidence" key={item.id}><summary>Evidencia: {item.title}</summary><pre>{item.text}</pre></details>)}
   </li>)}</ol>
   {!goal.tasks.length&&<p className="muted small">Todavía no hay tareas guardadas para esta meta.</p>}
   <div className="durable-actions">
    {goalReviewActions(goal).includes('approve')&&<button type="button" className="btn btn-good" disabled={disabled} onClick={()=>setReview({id:goal.goal_id,revision:goal.revision,action:'approve'})}>Aceptar resultado</button>}
    {goalReviewActions(goal).includes('resume')&&<button type="button" className="btn" disabled={disabled||activeGoal&&goal.status==='stopped'} onClick={()=>setReview({id:goal.goal_id,revision:goal.revision,action:'resume'})}>Reanudar meta</button>}
    {goalReviewActions(goal).includes('stop')&&<button type="button" className="btn" disabled={disabled} onClick={()=>setReview({id:goal.goal_id,revision:goal.revision,action:'stop'})}>Detener meta</button>}
   </div>
   {review?.id===goal.goal_id&&<div className="durable-review" role="group" aria-label="Confirmar revisión de la meta"><p>{intentions[review.action]}</p><div className="durable-actions"><button type="button" className="btn btn-good" disabled={disabled} onClick={()=>void act()}>{review.action==='approve'?'Sí, aceptar resultado':review.action==='resume'?'Sí, reanudar':'Sí, detener'}</button><button type="button" className="btn" disabled={state.busy} onClick={()=>setReview(null)}>Cancelar</button></div></div>}
   <p className="dossier-meta">Último registro: <time dateTime={goal.updated_at}>{new Date(goal.updated_at).toLocaleString('es-MX')}</time></p>
  </article>)}</div>
  <details className="durable-create"><summary>Definir una meta manualmente</summary><form className="goal-form" onSubmit={create}>
   <label htmlFor="durable-goal-name">Nombre<input id="durable-goal-name" value={draft.title} maxLength={160} required onChange={event=>setDraft({...draft,title:event.target.value})}/></label>
   <label htmlFor="durable-goal-instruction">Qué quieres lograr<textarea id="durable-goal-instruction" value={draft.instruction} maxLength={4000} rows={4} required onChange={event=>setDraft({...draft,instruction:event.target.value})}/></label>
   <label htmlFor="durable-goal-criterion">Cómo sabrás que está listo<textarea id="durable-goal-criterion" value={draft.criterion} maxLength={1000} rows={3} required onChange={event=>setDraft({...draft,criterion:event.target.value})}/></label>
   <p className="goal-scope">Este encargo permite analizar el expediente y guardar tareas y evidencias. No envía mensajes externos ni modifica decisiones del negocio. Al guardarlo, el agente podrá empezar cuando esté conectado.</p>
   {activeGoal&&<p className="goal-notice">Primero revisa o detén la meta en curso.</p>}
   <button className="btn btn-good" disabled={disabled||!state.model||activeGoal||!draft.title.trim()||!draft.instruction.trim()||!draft.criterion.trim()}>Guardar meta y poner en cola</button>
  </form></details>
 </section>;
}
