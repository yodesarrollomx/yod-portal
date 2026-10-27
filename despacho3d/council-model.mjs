export const COUNCIL_ROLES=Object.freeze([
 {id:'development',name:'Desarrollo',color:'#4c8e90',question:'¿El proyecto resuelve el objetivo con evidencia suficiente?'},
 {id:'market',name:'Mercado',color:'#b78a53',question:'¿La propuesta responde a una demanda comprobada?'},
 {id:'capital',name:'Capital',color:'#637baf',question:'¿Los recursos, supuestos y cobros sostienen el siguiente paso?'},
 {id:'operations',name:'Operación',color:'#8f779f',question:'¿Qué debe resolverse, quién lo hace y cómo se comprueba?'},
 {id:'critic',name:'Contraste',color:'#b36b61',question:'¿Qué contradicción, dependencia o supuesto puede invalidar la entrega?'}
]);
export const AUTON_STAGES=Object.freeze(['potential','codevelopment','project','construction','sales']);
export const STAGE_LABELS=Object.freeze({unconfirmed:'Etapa por confirmar',potential:'Potencial',codevelopment:'Codesarrollo',project:'Proyecto',construction:'Obra',sales:'Ventas'});
export const COUNCIL_STATES=Object.freeze({queued:'Esperando consejo',reviewing:'En consejo',correcting:'Resolviendo observaciones',ready:'Lista para tu revisión',needs_input:'Necesita tu decisión',interrupted:'Revisión interrumpida',accepted:'Entrega aceptada'});
const text=(v,n)=>typeof v==='string'&&v.length<=n;
export function validateCouncil(value,caseId){
 if(value?.schema!==1||value.case_id!==caseId||!Array.isArray(value.sessions)||value.sessions.length>100)throw Error('invalid_council');
 for(const s of value.sessions){
  if(s.case_id!==caseId||!text(s.id,200)||!s.id||!text(s.goal_id,200)||!text(s.title,200)||!Number.isSafeInteger(s.revision)||s.revision<1||!Object.hasOwn(COUNCIL_STATES,s.state)||!Object.hasOwn(STAGE_LABELS,s.stage)||!Array.isArray(s.reviews)||s.reviews.length>30||!Array.isArray(s.feedback)||s.feedback.length>50||!Array.isArray(s.tasks)||s.tasks.length>50||!text(s.summary,8000)||!Number.isFinite(Date.parse(s.updated_at)))throw Error('invalid_council');
  for(const r of s.reviews)if(!COUNCIL_ROLES.some(x=>x.id===r.role)||!['pass','revise','needs_input'].includes(r.verdict)||!text(r.comment,2500)||!Array.isArray(r.evidence_ids)||r.evidence_ids.length>8||!Number.isInteger(r.round))throw Error('invalid_council');
  for(const t of s.tasks)if(!text(t.id,200)||!text(t.title,600)||!text(t.criterion,1000)||!['pending','resolved','needs_input'].includes(t.state))throw Error('invalid_council');
  for(const f of s.feedback)if(!text(f.text,4000)||!Number.isFinite(Date.parse(f.at)))throw Error('invalid_council');
  if(!['not_configured','pending','sent','uncertain'].includes(s.notification?.state))throw Error('invalid_council');
 }
 return structuredClone(value);
}
// State comes from the private service, never from a timer or an avatar animation.
export function councilLocation(session){return ['queued','reviewing','ready','needs_input'].includes(session?.state)?'decisions':session?.state==='correcting'?'inicio':null;}
