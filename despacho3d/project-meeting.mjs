import {validateGoal} from './goals.mjs?v=2';
const status={ready_for_review:'Preparado para revisar',completed:'Revisado',awaiting_data:'Entrega parcial · faltan datos',running:'Trabajo en curso',queued:'En cola',stopped:'Detenido'};
export function buildMeeting(raw,caseId,name){
 const goal=validateGoal(raw,caseId);
 if(!['ready_for_review','completed','awaiting_data'].includes(goal.status))throw Error('meeting_not_ready');
 const topics=goal.tasks.length?goal.tasks:[{id:'summary',title:goal.title,status:'blocked',summary:goal.summary,criterion:goal.criterion,evidence_ids:[]}];
 const slides=topics.map((task,index)=>{
  const evidence=goal.evidence.filter(e=>e.task_id===task.id&&task.evidence_ids.includes(e.id));
  const result=task.summary||'Sin resultado registrado para este tema.';
  const checkpoint=task.status==='ready_for_review'?'Preparado; pendiente de tu revisión.':task.status==='blocked'?'Bloqueado; necesita datos o una decisión.':'Este tema todavía no está terminado.';
  const script=[String(name||'Autón')+'. '+task.title+'.',result,checkpoint,
   evidence.length?'La evidencia de este tema está disponible en la lámina.':'Este tema no tiene evidencia vinculada.',
   '¿Qué quieres aclarar o dejar como siguiente encargo?'].join(' ');
  return {id:task.id,number:index+1,title:task.title,result,criterion:task.criterion,checkpoint,
   evidence:evidence.map(e=>({id:e.id,title:e.title,text:e.text,sha256:e.sha256})),
   diagram:[{label:'Objetivo',text:task.criterion},{label:'Avance',text:result},{label:'Revisión',text:checkpoint}],script};
 });
 return {schema:1,case_id:caseId,goal_id:goal.goal_id,revision:goal.revision,source_revision:goal.source_revision,
  title:goal.title,project:String(name||'Autón'),status:status[goal.status],updated_at:goal.updated_at,slides};
}
export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function meetingDocument(deck){
 const e=escapeHTML;
 return '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+e(deck.project)+' · Avances</title><style>body{margin:0;background:#f3f0e9;color:#173538;font:20px system-ui}article{box-sizing:border-box;min-height:100vh;padding:6vw;break-after:page}small{color:#586866}h1{font-size:clamp(28px,4vw,56px);max-width:1000px}p{max-width:1000px;line-height:1.5}.flow{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.flow div{padding:20px;border-top:3px solid #9b8055;background:#fff}pre{white-space:pre-wrap;font:16px/1.5 system-ui}details{margin-top:24px}@media(max-width:650px){.flow{grid-template-columns:1fr}}@media print{article{min-height:0;height:auto}details{font-size:12px}}</style>'+
 deck.slides.map(s=>'<article><small>'+e(deck.project)+' · '+e(deck.status)+' · '+s.number+'/'+deck.slides.length+'</small><h1>'+e(s.title)+'</h1><p>'+e(s.result)+'</p><div class="flow">'+s.diagram.map(n=>'<div><b>'+e(n.label)+'</b><p>'+e(n.text)+'</p></div>').join('')+'</div><details><summary>Guion de presentación</summary><p>'+e(s.script)+'</p></details><details><summary>Evidencias completas ('+s.evidence.length+')</summary>'+s.evidence.map(v=>'<h3>'+e(v.title)+'</h3><pre>'+e(v.text)+'</pre>').join('')+'</details><p><small>Registro: '+e(deck.updated_at)+' · Revisión: '+e(deck.revision)+' · La entrega preparada requiere revisión humana.</small></p></article>').join('')+'</html>';
}
