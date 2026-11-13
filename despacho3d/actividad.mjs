// CTR-DESPACHO-ACTIVIDAD-V1: proyección pura, sin transporte ni autorización.
// Un adaptador de servidor debe validar actor y permisos antes de entregar eventos.
export const ACTIVITY_SCHEMA=1;
export const ESTADOS=Object.freeze(['solicitado','iniciado','llego','trabajando','esperando_revision','terminado','fallido','cancelado']);
export const ETIQUETAS=Object.freeze({solicitado:'Solicitado',iniciado:'Recorrido iniciado',llego:'Llegada confirmada',trabajando:'Trabajando',esperando_revision:'Esperando revisión',terminado:'Terminado',fallido:'Fallido',cancelado:'Cancelado'});
const terminal=new Set(['terminado','fallido','cancelado']);
const espacios=new Set(['juntas','comunicacion','biblioteca','navegacion','drive','edicion','direccion','usos','museo']);
const errores=new Set(['tool_failed','route_failed','permission_revoked','session_changed','invalid_result','cancelled']);
const plain=v=>v!==null&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype;
const keys=(v,required,optional=[])=>plain(v)&&required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
const iso=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const copy=v=>structuredClone(v);
const fail=code=>{throw Error(code);};

export function validarActividad(v){
 const fields=['schema','activity_id','case_id','request_id','actor_id','space_id','operation','requires_arrival','created_at','expected_revision','links'];
 if(!keys(v,fields)||v.schema!==ACTIVITY_SCHEMA||!['activity_id','case_id','request_id','actor_id','expected_revision'].every(k=>id(v[k]))||!espacios.has(v.space_id)||v.operation!=='consulta'||typeof v.requires_arrival!=='boolean'||!iso(v.created_at)||!keys(v.links,[],['job_id','message_id'])||!Object.values(v.links).every(id))fail('invalid_activity');
 return copy(v);
}
export function validarEvento(v){
 if(!keys(v,['schema','event_id','activity_id','case_id','sequence','kind','source','created_at','evidence'],['code'])||v.schema!==ACTIVITY_SCHEMA||!['event_id','activity_id','case_id'].every(k=>id(v[k]))||!Number.isSafeInteger(v.sequence)||v.sequence<1||!ESTADOS.includes(v.kind)||!['server','executor','pilot','simulator'].includes(v.source)||!iso(v.created_at)||!keys(v.evidence,['scope','kind','ref'])||!['server','local','synthetic'].includes(v.evidence.scope)||!['request','movement','work','result','error','cancel'].includes(v.evidence.kind)||!id(v.evidence.ref))fail('invalid_event');
 if(['fallido','cancelado'].includes(v.kind)?!errores.has(v.code):Object.hasOwn(v,'code'))fail('invalid_event');
 // Orden canónico: diferencias de orden de claves no crean conflictos falsos.
 return {schema:v.schema,event_id:v.event_id,activity_id:v.activity_id,case_id:v.case_id,sequence:v.sequence,kind:v.kind,source:v.source,created_at:v.created_at,evidence:{scope:v.evidence.scope,kind:v.evidence.kind,ref:v.evidence.ref},...(['fallido','cancelado'].includes(v.kind)?{code:v.code}:{})};
}
function procedencia(e,mode){
 if(mode==='synthetic')return e.source==='simulator'&&e.evidence.scope==='synthetic';
 if(e.kind==='llego')return e.source==='pilot'&&e.evidence.scope==='local';
 if(e.kind==='solicitado')return e.source==='server'&&e.evidence.scope==='server';
 return ['server','executor'].includes(e.source)&&e.evidence.scope==='server';
}
const evidencia={solicitado:'request',iniciado:'movement',llego:'movement',trabajando:'work',esperando_revision:'result',terminado:'result',fallido:'error',cancelado:'cancel'};

export function crearActividad({activity,mode='verified-input'}={}){
 const identity=validarActividad(activity);
 if(!['verified-input','synthetic'].includes(mode))fail('invalid_mode');
 const events=[],byId=new Map();let state=null,resultRef=null;
 function aplicar(value){
  const e=validarEvento(value);
  if(e.activity_id!==identity.activity_id||e.case_id!==identity.case_id)fail('activity_changed');
  const old=byId.get(e.event_id);
  if(old){if(JSON.stringify(old)!==JSON.stringify(e))fail('event_conflict');return recibo(true);}
  if(terminal.has(state))fail('activity_terminal');
  if(events.length>=64)fail('activity_limit');
  if(e.sequence!==events.length+1)fail('sequence_conflict');
  const since=events.at(-1)?.created_at||identity.created_at;
  if(e.created_at<since)fail('time_conflict');
  if(!procedencia(e,mode)||e.evidence.kind!==evidencia[e.kind])fail('invalid_evidence');
  const next={solicitado:['iniciado'],iniciado:identity.requires_arrival?['llego']:['llego','trabajando'],llego:['trabajando'],trabajando:['esperando_revision'],esperando_revision:['terminado']};
  const allowed=state===null?['solicitado']:[...(next[state]||[]),'fallido','cancelado'];
  if(!allowed.includes(e.kind))fail('invalid_transition');
  if(e.kind==='terminado'&&e.evidence.ref!==resultRef)fail('result_changed');
  if(e.kind==='esperando_revision')resultRef=e.evidence.ref;
  events.push(e);byId.set(e.event_id,e);state=e.kind;
  return recibo(false);
 }
 // Recibo del reductor. Nunca equivale a un ACK durable del servidor.
 function recibo(duplicate){return {ok:true,duplicate,activity_id:identity.activity_id,state,sequence:events.length,receipt_scope:mode==='synthetic'?'synthetic':'local-projection'};}
 function leer(){return {schema:ACTIVITY_SCHEMA,activity:copy(identity),events:copy(events),state,result_ref:resultRef,mode};}
 return Object.freeze({aplicar,leer});
}
export function reproducirActividad({activity,events},options={}){
 if(!Array.isArray(events)||events.length>64)fail('invalid_history');
 const ledger=crearActividad({activity,...options});
 for(const event of events)ledger.aplicar(event);
 return ledger.leer();
}
