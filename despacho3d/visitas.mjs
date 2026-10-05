// Authorized server transport only. No browser persistence or invented receipts.
const spaces=new Set(['juntas','biblioteca','edicion']);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_.:@-]{1,256}$/.test(v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v));
const integer=v=>Number.isSafeInteger(v)&&v>=0&&v<=10000;
const clone=v=>structuredClone(v);
export function validarRecibo(v,p){
 if(!v||v.ok!==true||v.schema!==1||v.case_id!==p.case_id||v.request_id!==p.request_id||v.visit_id!==p.visit_id||!id(v.receipt_id)||!integer(v.revision)||v.revision<1||!date(v.created_at)||v.scope!=='server-persisted'||v.arrival_evidence!=='client_report')throw Error('unconfirmed');
 return clone(v);
}
export function validarVisitas(v,caseId){
 if(!v||v.ok!==true||v.schema!==1||v.case_id!==caseId||!integer(v.revision)||v.total!==v.revision||!date(v.updated_at)||!Array.isArray(v.visits)||v.visits.length!==Math.min(v.total,200)||v.has_more!==(v.total>200))throw Error('invalid_snapshot');
 const seen=new Set(),requests=new Set(),receipts=new Set();
 v.visits.forEach((row,i)=>{
  if(!id(row.visit_id)||!id(row.request_id)||!id(row.actor_id)||!id(row.arrival_ref)||row.case_id!==caseId||!spaces.has(row.space_id)||!date(row.created_at)||row.revision!==v.total-v.visits.length+i+1||seen.has(row.visit_id)||requests.has(row.request_id)||!(row.visitor_kind==='agent'&&row.reason_code==='agent_arrived'||row.visitor_kind==='direction'&&row.reason_code==='visitor_opened'))throw Error('invalid_snapshot');
  const ack=validarRecibo(row.receipt,row);if(ack.created_at!==row.created_at||ack.revision!==row.revision||receipts.has(ack.receipt_id))throw Error('invalid_snapshot');
  seen.add(row.visit_id);requests.add(row.request_id);receipts.add(ack.receipt_id);
 });
 return clone(v);
}
const codes=new Set(['backend_unavailable','invalid_snapshot','transport_busy','timeout','session_pending','unauthorized','session_changed','case_mismatch','schema_not_initialized','stale_revision','request_id_reused','visit_id_reused','lock_busy','storage_capacity','invalid_persistence']);
export class Visitas {
 constructor({transport,uuid=()=>crypto.randomUUID(),notify=()=>{}}){Object.assign(this,{transport,uuid,notify,caseId:null,epoch:0,snapshot:null,pending:null,queue:[],busy:false,status:'off',error:null});}
 state(){return {status:this.status,error:this.error,queued:this.queue.length,snapshot:this.snapshot?clone(this.snapshot):null,pending:this.pending?clone(this.pending):null};}
 emit(){this.notify(this.state());}
 close(){this.epoch++;this.caseId=null;this.snapshot=null;this.pending=null;this.queue=[];this.busy=false;this.status='off';this.error=null;this.emit();}
 async open(caseId){this.close();if(!id(caseId))return false;this.caseId=caseId;return this.refresh();}
 async refresh(){
  if(!this.caseId||this.busy)return false;
  const epoch=this.epoch,caseId=this.caseId;this.busy=true;this.status='reading';this.emit();
  try{
   const r=await this.transport.readVisits({case_id:caseId});if(epoch!==this.epoch)return false;
   if(r?.ok!==true)throw Error(codes.has(r?.error)?r.error:'unavailable');
   this.snapshot=validarVisitas(r,caseId);
   if(this.pending){const row=this.snapshot.visits.find(v=>v.request_id===this.pending.request_id);if(row){validarRecibo(row.receipt,this.pending);if(row.space_id!==this.pending.space_id||row.visitor_kind!==this.pending.visitor_kind||row.reason_code!==this.pending.reason_code||row.arrival_ref!==this.pending.arrival_ref)throw Error('invalid_snapshot');this.pending=null;}}
   this.status=this.pending?'unconfirmed':'ready';this.error=null;return true;
  }catch(e){if(epoch!==this.epoch)return false;this.status='error';this.error=codes.has(e.message)?e.message:'unavailable';if(this.error==='unauthorized'||this.error==='session_changed'){this.close();this.status='error';this.error='unauthorized';this.emit();}return false;}
  finally{if(epoch===this.epoch){this.busy=false;this.emit();if(this.status==='ready'&&this.queue.length)void this.drain();}}
 }
 async record({espacio,quien}){
  if(!this.caseId||this.status==='off'||this.queue.length>=50||!spaces.has(espacio)||!['agente','direccion'].includes(quien))return false;
  this.queue.push({case_id:this.caseId,request_id:this.uuid(),visit_id:this.uuid(),space_id:espacio,
   visitor_kind:quien==='agente'?'agent':'direction',reason_code:quien==='agente'?'agent_arrived':'visitor_opened',arrival_ref:this.uuid()});this.emit();
  return this.drain();
 }
 async drain(){
  if(this.busy||this.pending||this.status!=='ready'||!this.snapshot||!this.queue.length)return false;
  this.pending={...this.queue.shift(),expected_revision:this.snapshot.revision};
  return this.retry();
 }
 async retry(){
  if(!this.caseId||!this.pending||this.busy)return false;
  const epoch=this.epoch,p=clone(this.pending);this.busy=true;this.status='saving';this.emit();let saved=false;
  try{
   const r=await this.transport.recordVisit(p);if(epoch!==this.epoch)return false;
   if(r?.ok!==true)throw Error(codes.has(r?.error)?r.error:'unavailable');
   validarRecibo(r,p);this.pending=null;this.status='saved';this.error=null;saved=true;
  }catch(e){if(epoch!==this.epoch)return false;this.status='unconfirmed';this.error=codes.has(e.message)?e.message:'unavailable';
   if(this.error==='unauthorized'||this.error==='session_changed'){this.close();this.status='error';this.error='unauthorized';this.emit();}return false;
  }finally{if(epoch===this.epoch){this.busy=false;this.emit();}}
  if(saved&&epoch===this.epoch){await this.refresh();return epoch===this.epoch;}return false;
 }
 // A definite CAS rejection may be discarded explicitly; an ambiguous outcome cannot.
 discardConflict(){if(this.busy||!this.pending||this.error!=='stale_revision')return false;this.pending=null;this.status='ready';this.error=null;this.emit();return true;}
 async resolveConflict(){
  if(this.busy||!this.pending||this.error!=='stale_revision')return false;
  const epoch=this.epoch,old=clone(this.pending),queue=this.queue;this.queue=[];this.discardConflict();
  const read=await this.refresh();if(epoch!==this.epoch)return false;this.queue=queue;
  if(!read){this.pending=old;this.status='unconfirmed';this.error='stale_revision';this.emit();return false;}
  // A definitive rejection is not an ambiguous write: keep visit/arrival IDs,
  // issue a new request explicitly, after a fresh read of the CAS revision.
  this.pending={...old,request_id:this.uuid(),expected_revision:this.snapshot.revision};return this.retry();
 }
}
