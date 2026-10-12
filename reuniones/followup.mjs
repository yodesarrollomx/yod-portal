import {ROUTES,REVIEW,normalizeReview} from './results-contract.mjs';
const escape=v=>String(v??'').replace(/[\\`*_{}\[\]<>#|]/g,c=>'\\'+c);
export const minute=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
export function meetingNote(delivery,rows,{agenda=false}={}){
 const review=normalizeReview(rows,delivery.proposals),map=new Map(review.map(r=>[r.id,r]));
 const m=delivery.meeting,lines=['---','tipo: '+(agenda?'preparacion':'reunion'),'meeting_id: '+JSON.stringify(m.meeting_id),'case_id: '+JSON.stringify(m.case_id),'estado: propuesta_para_revision','---','','# '+(agenda?'Próxima conversación · ':'')+escape(m.title),'',escape(m.summary),'', 'Proyecto: '+escape(m.case_id||'Sin PPP; no crear proyecto automáticamente'), '', '[Archivo privado]('+m.archive_url+') · [Minuta]('+m.minutes_url+') · [Transcripción]('+m.transcript_url+')','','No acredita tareas creadas, acuerdos aprobados ni sincronización de Obsidian.',''];
 for(const p of delivery.proposals){const r=map.get(p.id);if(agenda&&r.status==='dismissed')continue;lines.push('## '+escape(p.action),'- Revisión: '+REVIEW[r.status],'- Destino para revisión: '+ROUTES[r.destination],'- Responsable: '+escape(p.owner||'Por confirmar'),'- Fecha: '+escape(p.due_date||'Por confirmar'),'- Evidencia ['+minute(p.start)+']: '+escape(p.quote));if(r.note)lines.push('- Nota de revisión: '+escape(r.note));if(agenda)lines.push('- Pregunta de seguimiento: ¿Qué evidencia o dato falta para resolver este punto?');lines.push('');}
 return lines.join('\n');
}
export function reviewWarnings(p){return [!p.owner&&'Responsable por confirmar',!p.due_date&&'Fecha por confirmar'].filter(Boolean);}
