import {normalizeMeeting} from './archive-contract.mjs';
export const ROUTES=Object.freeze({moac:'MOAC · operación',ppp:'PPP · escenarios',comercial:'Comercial · prospectos',tesoreria:'Tesorería · verificar',obra:'Obra · verificar avance',documentos:'Documentos · expediente',agenda:'Agenda · preparar',decision:'Decisiones · revisar',pregunta:'Preguntas · aclarar'});
export const REVIEW=Object.freeze({pending:'Por revisar',selected:'Seleccionado para revisión',clarify:'Falta aclarar',dismissed:'Descartado de la propuesta'});
const text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
export function validDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
export function normalizeDelivery(raw,caseId=null){
 if(!raw||raw.schema!=='yod-meeting-delivery/v1'||!raw.meeting||!Array.isArray(raw.proposals)||raw.proposals.length>100)throw Error('invalid_request');
 const initial=raw.meeting.case_id===null;if(initial&&raw.meeting.origin!=='initial'||caseId&&!initial&&raw.meeting.case_id!==caseId)throw Error('case_mismatch');
 const bound=caseId||raw.meeting.case_id||'initial-validation';const {schema,...meeting}=normalizeMeeting({...raw.meeting,case_id:bound},bound);
 if(meeting.occurred_at!==null&&!validDate(meeting.occurred_at.slice(0,10)))throw Error('invalid_request');
 if(initial&&!caseId)meeting.case_id=null;
 const ids=new Set();const proposals=raw.proposals.map(p=>{
  if(!p||!text(p.id,100)||ids.has(p.id)||!text(p.action,1000)||!(p.owner===null||text(p.owner,160))||!(p.due_date===null||validDate(p.due_date))||!text(p.quote,1800)||!Number.isFinite(p.start)||p.start<0||p.start>604800||p.status!=='proposed'||p.destination!==undefined&&!Object.hasOwn(ROUTES,p.destination))throw Error('invalid_request');
  ids.add(p.id);return {id:p.id,action:p.action,owner:p.owner,due_date:p.due_date,quote:p.quote,start:p.start,status:'proposed',destination:p.destination||'moac'};
 });
 const result={schema:raw.schema,meeting,proposals};if(new TextEncoder().encode(JSON.stringify(result)).length>32000)throw Error('limit_reached');return result;
}
export function normalizeReview(rows,proposals){
 if(!Array.isArray(rows)||rows.length!==proposals.length)throw Error('invalid_request');const ids=new Set(proposals.map(p=>p.id));
 const out=rows.map(r=>{if(!r||Object.keys(r).sort().join('|')!=='destination|id|note|status'||!ids.delete(r.id)||!Object.hasOwn(REVIEW,r.status)||!Object.hasOwn(ROUTES,r.destination)||typeof r.note!=='string'||r.note.length>500||/[\x00-\x1f]/.test(r.note))throw Error('invalid_request');return {id:r.id,status:r.status,destination:r.destination,note:r.note};});
 if(ids.size)throw Error('invalid_request');if(new TextEncoder().encode(JSON.stringify(out)).length>32000)throw Error('limit_reached');return out.sort((a,b)=>a.id.localeCompare(b.id));
}
export const initialReview=d=>normalizeReview(d.proposals.map(p=>({id:p.id,status:'pending',destination:p.destination,note:''})),d.proposals);
