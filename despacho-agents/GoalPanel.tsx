import {useEffect,useState} from 'react';
import {DEFAULT_GOAL,DEFAULT_CRITERION} from '../despacho3d/goal-handoff.mjs';

export function GoalPanel({handoff,revision,connectionKey,onTerminal,onPrepared,onNew}:{handoff:any,revision:string|undefined,connectionKey:string,onTerminal:()=>void,onPrepared:(id:string)=>void,onNew:()=>void}){
 const [goal,setGoal]=useState(DEFAULT_GOAL),[criterion,setCriterion]=useState(DEFAULT_CRITERION),[confirmed,setConfirmed]=useState(false),[newConfirmed,setNewConfirmed]=useState(false),[error,setError]=useState('');
 const available=handoff.availability(),preview=handoff.preview({goal,criterion});
 useEffect(()=>{setConfirmed(false);setNewConfirmed(false);setError('');},[revision,connectionKey]);
 function prepare(event:React.FormEvent){
  event.preventDefault();const result=handoff.prepare({goal,criterion,confirmed});
  if(!result.ok){setError(result.message);setConfirmed(false);return;}
  setError('');setConfirmed(false);onPrepared(result.id);
 }
 function startNew(){
  const result=handoff.newGoal(newConfirmed);
  if(!result.ok){setError(result.message);return;}
  setGoal(DEFAULT_GOAL);setCriterion(DEFAULT_CRITERION);setConfirmed(false);setNewConfirmed(false);setError('');onNew();
 }
 if(handoff.attempted){
  const next=handoff.contextAvailability();
  return <section className="dossier-section goal-panel" aria-labelledby="goal-title">
   <h2 id="goal-title">Encargo preparado</h2>
   <p>Ya se intentó colocar un encargo en la terminal. Comprueba que aparece completo antes de pulsar Enter. El panel no confirma su inicio ni sus resultados.</p>
   <div className="goal-form">
    <button type="button" className="btn goal-open-terminal" onClick={onTerminal}>Ver terminal</button>
    <p>Para preparar otro, atiende o retira primero el texto anterior en Codex.</p>
    {!next.ok&&<p className="goal-notice" role="status">{next.message}</p>}
    <label className="goal-confirm"><input type="checkbox" checked={newConfirmed} disabled={!next.ok} onChange={event=>setNewConfirmed(event.target.checked)}/><span>Confirmo que el encargo anterior se atendió o se retiró, y que «Ask Codex» está vacío, sin aprobaciones pendientes.</span></label>
    {error&&<p className="conversation-notice" role="alert">{error}</p>}
    <button type="button" className="btn" disabled={!next.ok||!newConfirmed} onClick={startNew}>Nuevo encargo</button>
    <p className="muted small">Cerrar este panel o desconectar la ventana no borra el texto de la terminal.</p>
   </div>
  </section>;
 }
 return <section className="dossier-section goal-panel" aria-labelledby="goal-title">
  <h2 id="goal-title">Una meta para el agente</h2>
  <p>Describe el resultado. Codex podrá dividirlo en tareas, trabajar con sus herramientas locales y guardar las comprobaciones.</p>
  <form className="goal-form" onSubmit={prepare}>
   <label htmlFor="goal-objective">Qué quieres lograr<textarea id="goal-objective" value={goal} maxLength={8000} rows={3} onChange={event=>{setGoal(event.target.value);setConfirmed(false);setError('');}}/></label>
   <label htmlFor="goal-criterion">Cómo sabrás que está listo<textarea id="goal-criterion" value={criterion} maxLength={2000} rows={2} onChange={event=>{setCriterion(event.target.value);setConfirmed(false);setError('');}}/></label>
   <p className="goal-scope">Trabajará con la copia local del expediente y archivos de la Chromebook. Las tareas y evidencias quedarán allí; no se guardan automáticamente en Sheets. Este encargo no cambia datos de negocio ni envía mensajes externos.</p>
   <button type="button" className="btn goal-open-terminal" onClick={onTerminal}>Ver terminal</button>
   {!available.ok&&<p className="goal-notice" role="status">{available.message}</p>}
   <label className="goal-confirm"><input type="checkbox" checked={confirmed} disabled={!available.ok} onChange={event=>setConfirmed(event.target.checked)}/><span>Confirmo que Terminal muestra la entrada «Ask Codex» vacía, sin una aprobación ni contraseña pendientes.</span></label>
   <details className="goal-preview"><summary>Ver encargo completo</summary>{preview.ok?<pre>{preview.prompt}</pre>:<p>{preview.message}</p>}</details>
   {error&&<p className="conversation-notice" role="alert">{error}</p>}
   <button className="btn goal-prepare" disabled={!available.ok||!confirmed||!preview.ok}>Preparar en terminal</button>
   <p className="muted small">Se colocará el texto sin pulsar Enter. Revísalo en Terminal y pulsa Enter para que Codex empiece. Este panel todavía no sigue automáticamente sus tareas.</p>
  </form>
 </section>;
}
