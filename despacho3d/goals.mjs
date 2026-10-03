// Durable goals use the authenticated case transport. Reading never starts work.
// No credential, worker lease, browser persistence or business fixture belongs here.
export const GOAL_SCOPE='local_analysis_v1';
export const DEFAULT_DURABLE_GOAL={title:'Revisar el expediente y preparar los siguientes pasos',instruction:'Revisa el expediente disponible, identifica qué información está comprobada y qué falta. Divide el diagnóstico en tareas, guarda la evidencia y presenta los siguientes pasos para revisión. No inventes datos ni cambies decisiones del negocio.',criterion:'Un diagnóstico con evidencia del expediente, datos faltantes y próximos pasos claros, listo para mi revisión.'};
const statuses=new Set(['queued','running','ready_for_review','awaiting_data','stopped','completed']);
const taskStatuses=new Set(['pending','running','ready_for_review','blocked']);
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max,empty=false)=>typeof v==='string'&&(empty||v.trim().length>0)&&v.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
const id=v=>text(v,256);
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const fields=(v,allowed)=>plain(v)&&Object.keys(v).every(key=>allowed.includes(key));
const fail=()=>{throw Error('invalid_goals');};
export function validateGoal(value,caseId){
 if(!fields(value,['goal_id','case_id','title','instruction','criterion','scope','status','source_revision','revision','sequence','created_at','updated_at','tasks','evidence','summary','can_resume'])||value.case_id!==caseId||!id(value.goal_id)||!text(value.title,160)||!text(value.instruction,4000)||!text(value.criterion,1000)||value.scope!==GOAL_SCOPE||!statuses.has(value.status)||!id(value.source_revision)||!id(value.revision)||!Number.isSafeInteger(value.sequence)||value.sequence<0||!date(value.created_at)||!date(value.updated_at)||!text(value.summary,4000,true)||!Array.isArray(value.tasks)||value.tasks.length>8||!Array.isArray(value.evidence)||value.evidence.length>8||(value.can_resume!==undefined&&typeof value.can_resume!=='boolean'))fail();
 const taskIds=new Set(),evidenceIds=new Set();
 const tasks=value.tasks.map(task=>{
  if(!fields(task,['id','title','criterion','status','summary','evidence_ids'])||!/^task-[1-8]$/.test(task.id)||taskIds.has(task.id)||!text(task.title,240)||!text(task.criterion,800)||!taskStatuses.has(task.status)||!text(task.summary,1200,true)||!Array.isArray(task.evidence_ids)||task.evidence_ids.length>8||task.evidence_ids.some(e=>!id(e))||new Set(task.evidence_ids).size!==task.evidence_ids.length||(task.status==='ready_for_review'&&!task.evidence_ids.length))fail();
  taskIds.add(task.id);return structuredClone(task);
 });
 const evidence=value.evidence.map(item=>{
  if(!fields(item,['id','task_id','title','text','sha256','bytes'])||!id(item.id)||evidenceIds.has(item.id)||!taskIds.has(item.task_id)||!text(item.title,200)||!text(item.text,4000)||typeof item.sha256!=='string'||!/^([a-f0-9]{64})$/.test(item.sha256)||!Number.isSafeInteger(item.bytes)||item.bytes<1||item.bytes>12000||new TextEncoder().encode(item.text).length!==item.bytes)fail();
  evidenceIds.add(item.id);return structuredClone(item);
 });
 for(const task of tasks)for(const reference of task.evidence_ids)if(!evidence.some(item=>item.id===reference&&item.task_id===task.id))fail();
 if(JSON.stringify({tasks,evidence}).length>32000)fail();
 return {...structuredClone(value),tasks,evidence};
}
export function validateGoals(value,caseId){
 if(!fields(value,['ok','schema','source_revision','goals'])||value.ok!==true||value.schema!==1||!id(value.source_revision)||!Array.isArray(value.goals)||value.goals.length>100||JSON.stringify(value).length>524288)fail();
 const ids=new Set();
 const goals=value.goals.map(item=>{const goal=validateGoal(item,caseId);if(ids.has(goal.goal_id))fail();ids.add(goal.goal_id);return goal;});
 return {source_revision:value.source_revision,goals};
}
const notices={unavailable:'No pude consultar las metas. Puedes volver a actualizar.',timeout:'La conexión tardó demasiado. Puedes volver a actualizar.',invalid_goals:'La respuesta de metas no tiene el formato esperado. Actualiza para consultar su estado.',stale_revision:'El expediente o la meta cambió. Actualiza y revisa el estado antes de continuar.',goal_busy:'Ya hay una meta en curso. Actualiza para verla.',case_busy:'Ya hay trabajo en curso. Actualiza para consultar su estado.',request_id_reused:'El servidor rechazó ese identificador. Actualiza antes de intentar una nueva acción.',invalid_state:'La meta cambió de estado. Actualiza antes de continuar.',invalid_transition:'La meta cambió de estado. Actualiza antes de continuar.',goals_not_ready:'Todavía falta preparar el guardado de metas.',schema_not_initialized:'Todavía falta preparar el guardado de metas.',invalid_request:'El servidor rechazó la solicitud. Actualiza antes de continuar.',unauthorized:'Tu sesión ya no autoriza estas metas. Vuelve a entrar desde YOD OS.',session_changed:'La sesión cambió. Vuelve a entrar desde YOD OS.'};
const denied=code=>['unauthorized','session_changed'].includes(code);
const definitive=code=>['stale_revision','goal_busy','case_busy','request_id_reused','invalid_state','invalid_transition','goals_not_ready','schema_not_initialized','invalid_payload','invalid_request','goal_not_found'].includes(code);
export class DurableGoals {
 constructor({transport,getContext,notify=()=>{},onUnauthorized=()=>{},uuid=()=>crypto.randomUUID(),timeout=55000}){Object.assign(this,{transport,getContext,notify,onUnauthorized,uuid,timeout,epoch:0,caseId:null,model:null,pending:null,busy:false,status:'disconnected',notice:'',listeners:new Set()});}
 state(){return {model:this.model,pending:this.pending?{method:this.pending.method,action:this.pending.payload.action}:null,busy:this.busy,status:this.status,notice:this.notice};}
 subscribe(listener){this.listeners.add(listener);listener(this.state());return()=>this.listeners.delete(listener);}
 emit(){this.notify(this);for(const listener of this.listeners)listener(this.state());}
 context(){const c=this.getContext();return c?.selection?.goals?.ready===true&&c.selection.goals.schema===1&&id(c.selection.case_id)?c:null;}
 sync(){const current=this.context();if(!current)return false;if(this.caseId!==current.selection.case_id){this.reset();this.caseId=current.selection.case_id;}return true;}
 reset(){this.epoch++;this.caseId=null;this.model=null;this.pending=null;this.busy=false;this.status='disconnected';this.notice='';this.emit();}
 hide(){this.epoch++;this.model=null;this.busy=false;this.status=this.pending?'unconfirmed':'disconnected';this.emit();}
 async call(method,payload){const transport=typeof this.transport==='function'?this.transport():this.transport;if(typeof transport?.[method]!=='function')throw Error('unavailable');let timer;try{return await Promise.race([transport[method](structuredClone(payload)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),this.timeout);})]);}finally{clearTimeout(timer);}}
 current(epoch,caseId){return epoch===this.epoch&&this.context()?.selection.case_id===caseId;}
 async read(){
  if(this.busy||!this.sync()||this.context()?.busy)return false;
  const epoch=this.epoch,caseId=this.caseId;this.busy=true;this.status=this.pending?'unconfirmed':'loading';this.emit();
  try{const response=await this.call('readGoals',{case_id:caseId});if(!this.current(epoch,caseId))return false;if(response?.ok===false)throw Error(response.error);this.model=validateGoals(response,caseId);this.status=this.pending?'unconfirmed':'ready';this.notice=this.pending?'El último guardado no está confirmado. Puedes consultar lo que ya quedó guardado o reintentar la misma acción.':'';return true;}
  catch(error){if(this.current(epoch,caseId))this.failed(error,false);return false;}
  finally{if(epoch===this.epoch){this.busy=false;this.emit();}}
 }
 failed(error,writing){const code=error?.message;if(denied(code)){this.reset();this.status='unavailable';this.notice=notices[code];this.onUnauthorized(code);return;}if(writing&&!definitive(code)){this.status='unconfirmed';this.notice='No se confirmó el guardado. Reintentar conserva el mismo identificador y no crea una segunda meta.';return;}if(writing)this.pending=null;this.status=this.pending?'unconfirmed':writing?'conflict':'unavailable';this.notice=notices[code]||notices.unavailable;}
 async create(draft){
  if(this.busy||this.pending||!this.sync()||!this.model||this.context()?.busy||this.model.goals.some(goal=>!['stopped','completed'].includes(goal.status)))return false;
  if(!fields(draft,['title','instruction','criterion'])||!text(draft.title,160)||!text(draft.instruction,4000)||!text(draft.criterion,1000))return false;
  return this.write({method:'createGoal',payload:{case_id:this.caseId,request_id:this.uuid(),expected_revision:this.model.source_revision,title:draft.title.trim(),instruction:draft.instruction.trim(),criterion:draft.criterion.trim(),scope:GOAL_SCOPE}});
 }
 async review(goalId,action){
  if(this.busy||this.pending||!this.sync()||!this.model||this.context()?.busy)return false;
  const goal=this.model.goals.find(item=>item.goal_id===goalId);if(!goal)return false;
  if(action==='approve'?goal.status!=='ready_for_review':action==='resume'?!(['stopped','awaiting_data'].includes(goal.status)||goal.can_resume===true):action==='stop'?!['queued','running','ready_for_review','awaiting_data'].includes(goal.status):true)return false;
  return this.write({method:'reviewGoal',payload:{case_id:this.caseId,goal_id:goalId,request_id:this.uuid(),expected_revision:goal.revision,action}});
 }
 async retry(){if(this.busy||!this.pending||!this.sync()||this.context()?.busy)return false;return this.write(this.pending);}
 async write(operation){
  const epoch=this.epoch,caseId=this.caseId;this.pending=structuredClone(operation);this.busy=true;this.status='writing';this.notice='';this.emit();let success=false;
  try{const response=await this.call(operation.method,operation.payload);if(!this.current(epoch,caseId))return false;if(response?.ok===false)throw Error(response.error);if(response?.ok!==true||response.request_id!==operation.payload.request_id)throw Error('unconfirmed');const goal=validateGoal(response.goal,caseId);if(operation.method==='reviewGoal'&&(goal.goal_id!==operation.payload.goal_id||goal.status!=={approve:'completed',resume:'queued',stop:'stopped'}[operation.payload.action]))throw Error('unconfirmed');if(operation.method==='createGoal'&&(goal.source_revision!==operation.payload.expected_revision||goal.title!==operation.payload.title||goal.instruction!==operation.payload.instruction||goal.criterion!==operation.payload.criterion||goal.status!=='queued'))throw Error('unconfirmed');const observed=this.model?.goals.find(item=>item.goal_id===goal.goal_id),latest=observed&&(observed.sequence>goal.sequence||Date.parse(observed.updated_at)>Date.parse(goal.updated_at))?observed:goal;this.pending=null;this.model={source_revision:this.model?.source_revision||goal.source_revision,goals:[latest,...(this.model?.goals||[]).filter(item=>item.goal_id!==goal.goal_id)]};this.status='ready';success=true;}
  catch(error){if(this.current(epoch,caseId))this.failed(error,true);}
  finally{if(epoch===this.epoch){this.busy=false;this.emit();}}
  return success;
 }
}
// Polling only consults the canonical store. Hidden panels/tabs make no requests.
export function watchGoals(controller,{visible=()=>true,interval=8000,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 let stopped=false,timer;
 async function tick(){if(stopped)return;if(visible()&&!controller.busy)await controller.read();if(!stopped)timer=setTimer(tick,interval);}
 void tick();return()=>{stopped=true;clearTimer(timer);};
}
