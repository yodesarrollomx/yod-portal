import {registeredBoard} from './project-station.mjs';
// Local transport contract. The authenticated server chooses the private case.
// No endpoint, credential, business record or browser persistence lives here.
import {validateDriveSelection} from './drive-selection.mjs';
import {validateAvatarProfile} from './avatar-profile.mjs';
import {createFastLaneClient} from './fast-lane.mjs';

const text=(v,max=256)=>typeof v==='string'&&v.length>0&&v.length<=max;
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const active=new Set(['queued','running','claimed']);
const FAST_FALLBACK=new Set(['unavailable','unauthorized','fast_lane_unavailable','model_unavailable','context_unavailable']);
const FAST_NOTICES={busy:'Gastón sigue respondiendo el mensaje anterior. Espera un momento y vuelve a enviar.',rate_limited:'Demasiados mensajes seguidos. Espera unos minutos.',model_failed:'La respuesta no se completó. Tu mensaje no se guardó; puedes volver a enviarlo.',auth_unavailable:'El servicio del modelo rechazó la conexión. Tu mensaje no se guardó.',provider_busy:'El modelo está saturado. Tu mensaje no se guardó; vuelve a intentarlo.',cancelled:'',invalid_request:'No se pudo enviar ese mensaje.'};
const diagnosticCodes=new Set(['unauthorized','session_changed','timeout','unavailable','despacho_not_ready','invalid_selection','invalid_snapshot','invalid_message','invalid_job','invalid_event','seleccion_invalida','enlace_invalido','outside_os','case_changed','session_pending','transport_busy']);
const transientCodes=new Set(['timeout','unavailable','transport_busy','session_pending']);
const diagnosticCode=e=>diagnosticCodes.has(e?.message)?e.message:'unavailable';
function checked(v){if(v?.ok===false)throw Error(diagnosticCodes.has(v.error)?v.error:'unavailable');return v;}
export function validateSelection(v){
 if(!v||v.ok!==true||!text(v.case_id)||!text(v.name,120)||typeof v.can_enqueue!=='boolean'||typeof v.agent_ready!=='boolean')throw Error('invalid_selection');
 const selection={...validateDriveSelection(v),case_id:v.case_id,can_enqueue:v.can_enqueue,agent_ready:v.agent_ready};
 const goals=v.goals?.schema===1&&typeof v.goals.ready==='boolean'&&typeof v.goals.worker_ready==='boolean'?{schema:1,ready:v.goals.ready,worker_ready:v.goals.worker_ready}:null;
 const ppp=v.ppp?.case_id===v.case_id&&registeredBoard(v.ppp.url,v.case_id)?{case_id:v.case_id,url:v.ppp.url}:null;
 return {...selection,avatar:validateAvatarProfile(v.avatar,selection),goals,ppp};
}
export function safeDocumentUrl(value){
 try{return validateDriveSelection({name:'Documento',url:value}).url;}catch{return null;}
}
function sourceRows(value){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>100)throw Error('invalid_snapshot');
 return value.map(row=>{
  if(!Array.isArray(row)||row.length!==4||row.some(cell=>typeof cell!=='string'||cell.length>8000))throw Error('invalid_snapshot');
  return row.map(cell=>cell.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,''));
 }).filter(row=>row.some(cell=>cell.trim()));
}
export function validateConversation(v,id){
 if(!v||v.ok!==true||v.case_id!==id||!text(v.source_revision)||!v.context||v.context.identity?.case_id!==id||!text(v.context.identity.name,200)||!date(v.state?.updated_at)||!Array.isArray(v.conversation)||v.conversation.length>1000||!Array.isArray(v.jobs)||v.jobs.length>1000||!Array.isArray(v.events)||v.events.length>1000||JSON.stringify(v).length>524288)throw Error('invalid_snapshot');
 const ids=new Set();
 const messages=v.conversation.map(row=>{
  if(row.case_id!==id||!text(row.message_id)||ids.has(row.message_id)||!['user','assistant'].includes(row.role)||!text(row.body_json,16000)||!date(row.created_at))throw Error('invalid_message');
  ids.add(row.message_id);const body=JSON.parse(row.body_json),content=row.role==='user'?body.message:body.reply;
  if(!text(content,12000))throw Error('invalid_message');
  return {id:row.message_id,job_id:text(row.job_id)?row.job_id:undefined,role:row.role,body:content,created_at:row.created_at};
 });
 const jobs=v.jobs.map(j=>{
  if(j.case_id!==id||!text(j.job_id)||!text(j.enqueue_request_id)||!text(j.status))throw Error('invalid_job');
  return {id:j.job_id,request_id:j.enqueue_request_id,status:j.status};
 });
 const events=v.events.map(e=>{
  if(e.case_id!==id||!text(e.event_id)||!text(e.kind)||!date(e.created_at))throw Error('invalid_event');
  return {id:e.event_id,title:e.kind,body:e.created_at};
 });
 const memory=sourceRows(v.context.memory).map(([title,body,evidence,next],index)=>({id:'memory-'+index,title,body,evidence,next,url:safeDocumentUrl(evidence)}));
 const documents=sourceRows(v.context.documents).map(([source_id,title,source,role],index)=>({id:'document-'+index,source_id,title,source,role,url:safeDocumentUrl(source)}));
 return {case_id:id,revision:v.source_revision,updated_at:v.state.updated_at,messages,jobs,events,memory,documents,decisions:[],processing:jobs.some(j=>active.has(j.status))};
}
export class Conversation {
 constructor({transport,notify=()=>{},uuid=()=>crypto.randomUUID(),timeout=55000,fast=null,now=()=>Date.now()}){Object.assign(this,{transport,notify,uuid,timeout,now,fastOverride:fast,fastClientRef:null,fastTurns:[],fastNotice:'',fastDownUntil:0,fastAbort:null,selection:null,model:null,pending:null,accepted:null,status:'disconnected',busy:false,epoch:0,profile:null,stale:false,profileListeners:new Set()});}
 getProfile(){return this.profile?structuredClone(this.profile):null;}
 subscribeProfile(fn){if(typeof fn!=='function')throw TypeError('A listener is required');this.profileListeners.add(fn);fn(this.getProfile());return()=>this.profileListeners.delete(fn);}
 setProfile(profile){if(JSON.stringify(this.profile)===JSON.stringify(profile))return;this.profile=profile?structuredClone(profile):null;for(const fn of this.profileListeners){try{fn(this.getProfile());}catch{/* A renderer failure must not alter server authorization. */}}}
 forgetProfile(){this.setProfile(null);}
 fastClient(){
  if(this.fastOverride)return this.fastOverride;
  const transport=typeof this.transport==='function'?this.transport():this.transport;
  if(!transport||typeof transport.mintFastSession!=='function')return null;
  if(!this.fastClientRef||this.fastClientRef.transport!==transport)this.fastClientRef={transport,client:createFastLaneClient({mint:p=>transport.mintFastSession(p)})};
  return this.fastClientRef.client;
 }
 get fastPending(){return this.fastTurns.some(t=>t.phase==='done');}
 reconcileFast(){
  const messages=this.model?.messages||[],cutoff=this.now()-10*60000;
  this.fastTurns=this.fastTurns.filter(t=>{
   if(t.phase!=='done')return true;
   const at=messages.findIndex((m,i)=>m.role==='user'&&m.body===t.message&&messages[i+1]?.role==='assistant'&&messages[i+1].body===t.reply);
   return at===-1&&!(t.saved&&t.finished<cutoff);
  });
 }
 get recoverable(){return this.status==='reconnecting'||(this.status==='unavailable'&&transientCodes.has(this.diagnostic?.code));}
 get stoppedMessage(){
  const job=this.model?.jobs.at(-1);
  return job?.status==='stopped'?this.model.messages.filter(m=>m.role==='user'&&m.job_id===job.id).at(-1)?.body||null:null;
 }
 async retryStopped(){const message=this.stoppedMessage;return message?this.send(message):false;}
 emit(){this.notify(this);}
 async call(method,payload){
  const transport=typeof this.transport==='function'?this.transport():this.transport;
  if(!transport||typeof transport[method]!=='function')throw Error('unavailable');
  let timer;try{return await Promise.race([transport[method](structuredClone(payload)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),this.timeout);})]);}finally{clearTimeout(timer);}
 }
 close(){this.epoch++;this.fastAbort?.abort();this.fastAbort=null;this.fastTurns=[];this.fastNotice='';this.fastClientRef=null;this.selection=null;this.model=null;this.pending=null;this.accepted=null;this.diagnostic=null;this.stale=false;this.status='disconnected';this.busy=false;this.emit();}
 async open(){
  this.close();const epoch=this.epoch;this.busy=true;this.status='loading';this.emit();
  let step='expediente';
  try{
   const selection=validateSelection(checked(await this.call('resolveCurrent',{})));
   if(epoch!==this.epoch)return false;
   step='historial';
   const model=validateConversation(checked(await this.call('read',{case_id:selection.case_id})),selection.case_id);
   if(epoch!==this.epoch)return false;
   this.selection=selection;this.model=model;this.stale=false;this.setProfile(selection.avatar);this.status=model.processing?'processing':'ready';this.reconcileFast();
   if(selection.can_enqueue&&selection.agent_ready)void this.fastClient()?.warm(selection.case_id);return true;
  }catch(error){if(epoch===this.epoch){this.selection=null;this.model=null;if(!transientCodes.has(diagnosticCode(error)))this.forgetProfile();this.diagnostic={step,code:diagnosticCode(error)};this.status='unavailable';}return false;}
  finally{if(epoch===this.epoch){this.busy=false;this.emit();}}
 }
 async refresh(){
  if(this.busy||!this.selection)return false;
  const epoch=this.epoch;this.busy=true;this.emit();
  try{
   const selection=validateSelection(checked(await this.call('resolveCurrent',{})));
   if(epoch!==this.epoch)return false;
   if(selection.case_id!==this.selection.case_id)throw Error('case_changed');
   const model=validateConversation(checked(await this.call('read',{case_id:this.selection.case_id})),this.selection.case_id);
   if(epoch!==this.epoch)return false;
   this.selection=selection;this.setProfile(selection.avatar);this.diagnostic=null;this.stale=false;
   this.model=model;this.reconcileFast();
   if(this.pending&&model.jobs.some(j=>j.request_id===this.pending.request_id))this.pending=null;
   if(this.accepted&&model.messages.some(m=>m.job_id===this.accepted.job_id))this.accepted=null;
   this.status=this.pending?'unconfirmed':this.accepted||model.processing?'processing':'ready';return true;
  }catch(error){if(epoch===this.epoch){
   const code=diagnosticCode(error);
   if(transientCodes.has(code)){
    // This is the last authorized view, not permission to send while offline.
    this.stale=true;this.status='reconnecting';
   }else{
    this.model=null;this.forgetProfile();this.selection=null;this.pending=null;this.accepted=null;this.stale=false;this.status='unavailable';
   }
   this.diagnostic={step:'actualización',code};
  }return false;}
  finally{if(epoch===this.epoch){this.busy=false;this.emit();}}
 }
 async sendFast(message){
  const client=this.fastClient(),text=message.trim(),epoch=this.epoch,caseId=this.selection.case_id;
  const turn={id:'fast-'+this.uuid(),message:text,reply:'',phase:'thinking',saved:false,meta:null,created_at:new Date(this.now()).toISOString(),finished:0};
  turn.request_id=turn.id;
  const controller=new AbortController();this.fastAbort=controller;
  this.fastTurns.push(turn);this.fastNotice='';this.busy=true;this.status='streaming';this.emit();
  try{
   const result=await client.turn({case_id:caseId,message:text,request_id:turn.request_id,signal:controller.signal,onEvent:(name,data)=>{
    if(epoch!==this.epoch)return;
    if(name==='route')turn.meta={model:data.model,tier:data.tier,effort:data.effort,router:data.router};
    else if(name==='delta'&&typeof data?.text==='string'){turn.reply+=data.text;turn.phase='streaming';}
    else return;
    this.emit();
   }});
   if(epoch!==this.epoch)return false;
   turn.reply=result.final.reply;turn.phase='done';turn.finished=this.now();turn.saved=result.saved===true;
   turn.meta={...turn.meta,model:result.final.model,tier:result.final.tier,ttft_ms:result.final.ttft_ms,total_ms:result.final.total_ms};
   this.status='ready';return true;
  }catch(error){
   if(epoch!==this.epoch)return false;
   this.fastTurns=this.fastTurns.filter(t=>t!==turn);this.status='ready';
   if(FAST_FALLBACK.has(error?.code)&&!error.started){this.fastDownUntil=this.now()+60000;return 'fallback';}
   this.fastNotice=FAST_NOTICES[error?.code]??'No se pudo completar la respuesta. Tu mensaje no se guardó.';return false;
  }finally{
   if(this.fastAbort===controller)this.fastAbort=null;
   if(epoch===this.epoch){this.busy=false;this.emit();if(turn.phase==='done'&&turn.saved)setTimeout(()=>{if(epoch===this.epoch)void this.refresh();},0);}
  }
 }
 async send(message){
  if(!this.pending&&this.status==='ready'&&!this.busy&&!this.stale&&this.selection?.can_enqueue&&this.selection?.agent_ready&&this.model&&!this.model.processing&&typeof message==='string'&&message.trim()&&message.length<=8000&&this.now()>=this.fastDownUntil&&this.fastClient()){
   const outcome=await this.sendFast(message);
   if(outcome!=='fallback')return outcome;
  }
  if(this.busy||this.stale||!['ready','unconfirmed'].includes(this.status)||!this.selection?.can_enqueue||!this.selection?.agent_ready)return false;
  if(!this.pending){
   if(this.status!=='ready'||!this.model||this.model.processing||typeof message!=='string'||!message.trim()||message.length>8000)return false;
   this.pending={case_id:this.selection.case_id,expected_revision:this.model.revision,request_id:this.uuid(),message:message.trim()};
  }
  const epoch=this.epoch;this.busy=true;this.status='sending';this.emit();
  let confirmed=false;
  try{
   const ack=await this.call('enqueue',this.pending);
   if(ack?.ok===false&&['unauthorized','session_changed'].includes(ack.error))throw Error(ack.error);
   if(epoch!==this.epoch)return false;
   if(ack?.ok===false&&['stale_revision','case_busy','request_id_reused'].includes(ack.error)){this.pending=null;this.status='conflict';return false;}
   if(ack?.ok!==true||ack.case_id!==this.pending.case_id||ack.request_id!==this.pending.request_id||ack.source_revision!==this.pending.expected_revision||!text(ack.job_id)||ack.state!=='queued')throw Error('unconfirmed');
   this.accepted={job_id:ack.job_id,message:this.pending.message};this.pending=null;this.status='processing';confirmed=true;
  }catch(error){if(epoch===this.epoch){
   if(['unauthorized','session_changed'].includes(error?.message)){this.forgetProfile();this.selection=null;this.model=null;this.pending=null;this.accepted=null;this.diagnostic={step:'envío',code:error.message};this.status='unavailable';}
   else this.status='unconfirmed';
  }}
  finally{if(epoch===this.epoch){this.busy=false;this.emit();}}
  if(confirmed)await this.refresh();return confirmed&&epoch===this.epoch;
 }
}

export function createFrameTransport(win,timeout=55000){
 let alive=true;const waiting=new Map();
 const receive=e=>{
  if(e.origin!==win.location.origin||e.source!==win.parent||e.data?.type!=='yod:case:result'||e.data.version!==1)return;
  const item=waiting.get(e.data.id);if(!item)return;waiting.delete(e.data.id);clearTimeout(item.timer);
  if(e.data.error)item.reject(Error(diagnosticCodes.has(e.data.error)?e.data.error:'unavailable'));else item.resolve(e.data.result);
 };
 win.addEventListener('message',receive);
 const request=(method,payload)=>new Promise((resolve,reject)=>{
  if(!alive||win.parent===win){reject(Error('outside_os'));return;}
  const id=win.crypto.randomUUID();const timer=setTimeout(()=>{waiting.delete(id);reject(Error('timeout'));},timeout);
  waiting.set(id,{resolve,reject,timer});win.parent.postMessage({type:'yod:case:request',version:1,id,method,payload},win.location.origin);
 });
 return {readOfficePermissions:p=>request('readOfficePermissions',p),readOfficePending:p=>request('readOfficePending',p),readVisits:p=>request('readVisits',p),recordVisit:p=>request('recordVisit',p),mintFastSession:p=>request('mintFastSession',p),resolveCurrent:p=>request('resolveCurrent',p),read:p=>request('read',p),enqueue:p=>request('enqueue',p),readGoals:p=>request('readGoals',p),createGoal:p=>request('createGoal',p),reviewGoal:p=>request('reviewGoal',p),dispose(){alive=false;win.removeEventListener('message',receive);for(const item of waiting.values()){clearTimeout(item.timer);item.reject(Error('closed'));}waiting.clear();}};
}
