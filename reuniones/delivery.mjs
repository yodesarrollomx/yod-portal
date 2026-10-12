import {normalizeMeeting} from './archive-contract.mjs';
export function validateDelivery(raw,caseId=null) {
 if(!raw||raw.schema!=='yod-meeting-delivery/v1'||!raw.meeting||!Array.isArray(raw.proposals)||raw.proposals.length>100)throw Error('Ficha de reunión inválida.');
 const initial=raw.meeting.case_id===null;
 if(initial&&raw.meeting.origin!=='initial')throw Error('Falta el proyecto de la reunión.');
 if(caseId&&!initial&&raw.meeting.case_id!==caseId)throw Error('Esta reunión pertenece a otro proyecto.');
 const bound=caseId||raw.meeting.case_id||'initial-validation';
 const {schema,...meeting}=normalizeMeeting({...raw.meeting,case_id:bound},bound);
 if(initial&&!caseId)meeting.case_id=null;
 const ids=new Set(),text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
 const proposals=raw.proposals.map(p=>{
  if(!p||!text(p.id,100)||ids.has(p.id)||!text(p.action,1000)||!(p.owner===null||text(p.owner,160))||!(p.due_date===null||/^\d{4}-\d{2}-\d{2}$/.test(p.due_date))||!text(p.quote,1800)||!Number.isFinite(p.start)||p.start<0||p.status!=='proposed')throw Error('Pendiente sin evidencia o con aprobación no permitida.');
  ids.add(p.id);return {id:p.id,action:p.action,owner:p.owner,due_date:p.due_date,quote:p.quote,start:p.start,status:'proposed'};
 });
 return {schema:raw.schema,meeting,proposals,initial};
}
const cell=value=>'"'+String(value??'').replace(/^[\s=+@\-]/,"'$&").replaceAll('"','""')+'"';
export function proposalsCSV(delivery,selected) {
 const ids=new Set(selected),rows=delivery.proposals.filter(p=>ids.has(p.id));
 if(!rows.length)throw Error('Selecciona al menos un pendiente para revisar en MOAC.');
 return '\ufeff'+[['Reunión','Proyecto','Acción propuesta','Responsable por confirmar','Fecha por confirmar','Minuto','Cita','Estado'],...rows.map(p=>[delivery.meeting.meeting_id,delivery.meeting.case_id||'Sin PPP',p.action,p.owner||'Sin asignar',p.due_date||'Sin fecha acordada',Math.floor(p.start/60)+':'+String(Math.floor(p.start%60)).padStart(2,'0'),p.quote,'Para autorizar en MOAC; no creado'])].map(r=>r.map(cell).join(',')).join('\r\n');
}
