import {randomUUID} from 'node:crypto';
import {BoundedAgentWorker} from './worker.mjs';
import {canResumeClaim} from './claim-recovery.mjs';

// Durable checkpoint precedes every model invocation. A crash after this point
// must be reviewed, never interpreted as permission to repeat an uncertain turn.
export class ContinuousRoomHost {
 constructor({backend,executor,worker_id,readState,saveState,onSnapshot=async()=>{},log=()=>{},workerFactory=o=>new BoundedAgentWorker(o)}){
  Object.assign(this,{backend,executor,worker_id,readState,saveState,onSnapshot,log,workerFactory});
 }
 async checkStartup(){
  const state=await this.readState();
  return !state||['idle','claiming'].includes(state.phase);
 }
 async step(){
  let state=await this.readState();
  if(state&&!['idle','claiming'].includes(state.phase))return {state:'blocked',diagnostic:{code:'review_required'}};
  const claim=state?.claim_request_id||randomUUID();
  let reply=null;
  await this.saveState({phase:'claiming',claim_request_id:claim});
  const executor={execute:async(input,controls)=>{
   await this.saveState({phase:'executing',claim_request_id:claim,job_id:input.snapshot.job_id});
   await this.onSnapshot(input.snapshot);
   this.log('Mensaje recibido desde el Despacho. El agente está respondiendo…');
   const execution=await this.executor.execute(input,controls);
   reply=typeof execution?.result?.reply==='string'?execution.result.reply:null;
   return execution;
  }};
  const result=await this.workerFactory({backend:this.backend,executor,worker_id:this.worker_id,claim_request_id:claim,operation_timeout_ms:10000,read_timeout_ms:25000}).runOnce();
  if(canResumeClaim(result,claim)){
   this.log('La conexión con Sheets tardó. Se recuperará la misma solicitud.');
   return result;
  }
  if(result.state==='idle'||result.confirmed===true){
   await this.saveState({phase:'idle',claim_request_id:randomUUID()});
   if(result.confirmed){
    this.log(result.state==='stopped'?'El turno se detuvo. El diagnóstico quedó guardado en Sheets.':'Respuesta guardada en Sheets y disponible en el Despacho.');
    if(result.state!=='stopped'&&reply)this.log('Agente: '+reply.replace(/[\x00-\x1f\x7f-\x9f]/g,' ').slice(0,12000));
   }
  }else{
   await this.saveState({phase:'blocked',claim_request_id:claim,job_id:result.job_id,code:result.diagnostic?.code||'review_required'});
   this.log('El estado necesita revisión. No se repetirá automáticamente la respuesta.');
  }
  return result;
 }
}
