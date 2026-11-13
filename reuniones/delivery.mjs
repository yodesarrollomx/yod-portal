import {normalizeDelivery} from './results-contract.mjs';
export function validateDelivery(raw,caseId=null){try{return {...normalizeDelivery(raw,caseId),initial:raw.meeting.case_id===null};}catch(e){throw Error(e.message==='case_mismatch'?'Esta reunión pertenece a otro proyecto.':e.message==='limit_reached'?'La ficha supera 32 KB. Divide los resultados conservando el original.':'Ficha inválida: revisa fechas, evidencias y estados; no se permite aprobación importada.');}}
const cell=value=>'"'+String(value??'').replace(/^[\s=+@\-]/,"'$&").replaceAll('"','""')+'"';
export function proposalsCSV(delivery,selected) {
 const ids=new Set(selected),rows=delivery.proposals.filter(p=>ids.has(p.id));
 if(!rows.length)throw Error('Selecciona al menos un pendiente para revisar en MOAC.');
 return '\ufeff'+[['Reunión','Proyecto','Acción propuesta','Responsable por confirmar','Fecha por confirmar','Minuto','Cita','Estado'],...rows.map(p=>[delivery.meeting.meeting_id,delivery.meeting.case_id||'Sin PPP',p.action,p.owner||'Sin asignar',p.due_date||'Sin fecha acordada',Math.floor(p.start/60)+':'+String(Math.floor(p.start%60)).padStart(2,'0'),p.quote,'Para autorizar en MOAC; no creado'])].map(r=>r.map(cell).join(',')).join('\r\n');
}
