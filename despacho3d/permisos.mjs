// A matrix describes the current server policy; it never authorizes an RPC itself.
const rooms=['juntas','comunicacion','biblioteca','navegacion','drive','edicion','direccion','usos','museo'];
const built=new Set(['juntas','biblioteca','edicion']);
const same=(a,b)=>Array.isArray(a)&&JSON.stringify(a)===JSON.stringify(b);
export function validarPermisos(v,caseId){
 if(!v||v.ok!==true||v.schema!==1||v.case_id!==caseId||v.policy_version!=='office-observe-v1'||v.scope!=='informational'||typeof v.issued_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v.issued_at)||!Number.isFinite(Date.parse(v.issued_at))||!same(v.office_operations,['readVisits'])||!Array.isArray(v.spaces)||v.spaces.length!==rooms.length)throw Error('invalid_permissions');
 v.spaces.forEach((s,i)=>{const connected=built.has(rooms[i]);if(!s||s.space_id!==rooms[i]||s.connected!==connected||s.level!==(connected?'observar':null)||!same(s.operations,connected?(s.space_id==='juntas'?['recordVisit','readPending']:['recordVisit']):[]))throw Error('invalid_permissions');});
 return structuredClone(v);
}
const errors=new Set(['unauthorized','session_changed','session_pending','timeout','transport_busy','case_mismatch','permission_denied','invalid_permissions']);
export class Permisos {
 constructor({transport,notify=()=>{}}){Object.assign(this,{transport,notify,epoch:0,caseId:null,status:'off',error:null,matrix:null,busy:false});}
 state(){return {status:this.status,error:this.error,matrix:this.matrix?structuredClone(this.matrix):null};}
 emit(){this.notify(this.state());}
 close(){this.epoch++;this.caseId=null;this.matrix=null;this.busy=false;this.status='off';this.error=null;this.emit();}
 async open(id){this.close();if(typeof id!=='string'||!id)return false;this.caseId=id;return this.refresh();}
 async refresh(){
  if(!this.caseId||this.busy)return false;const epoch=this.epoch,id=this.caseId;this.busy=true;this.status='reading';this.matrix=null;this.emit();
  try{const r=await this.transport.readOfficePermissions({case_id:id});if(epoch!==this.epoch)return false;if(r?.ok!==true)throw Error(r?.error||'unavailable');this.matrix=validarPermisos(r,id);this.status='ready';this.error=null;return true;}
  catch(e){if(epoch!==this.epoch)return false;this.matrix=null;this.status='error';this.error=errors.has(e.message)?e.message:'unavailable';return false;}
  finally{if(epoch===this.epoch){this.busy=false;this.emit();}}
 }
 permits(space,operation){return this.status==='ready'&&!!this.matrix?.spaces.find(s=>s.space_id===space)?.operations.includes(operation);}
 async readPending(){
  if(!this.permits('juntas','readPending'))throw Error('permission_denied');const epoch=this.epoch,id=this.caseId;
  let r;try{r=await this.transport.readOfficePending({case_id:id,space_id:'juntas'});}catch(e){if(epoch===this.epoch&&['unauthorized','session_changed','permission_denied'].includes(e.message)){this.matrix=null;this.status='error';this.error=e.message;this.emit();}throw e;}
  if(epoch!==this.epoch)throw Error('session_changed');
  if(r?.ok!==true){if(['unauthorized','session_changed','permission_denied'].includes(r?.error)){this.matrix=null;this.status='error';this.error=r.error;this.emit();}throw Error(r?.error||'unavailable');}
  return r;
 }
}
