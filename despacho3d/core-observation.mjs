// Optional, read-only control from the already authenticated work response.
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,200}$/.test(v);
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const codes=new Set(['storage_unavailable','history_unavailable','invalid_binding','invalid_progress','owner_unconfirmed','receipt_unconfirmed','recovery_pending','observation_stale','runtime_unavailable','work_interrupted','data_required','review_required','clock_unconfirmed']);
export function validateCoreObservation(raw,caseId,work){
 const bad=()=>{throw Error('invalid_core_observation');};
 if(!plain(raw)||raw.schema!==1||raw.case_id!==caseId||raw.automatic_retry!==false||raw.canonical_write!==false||raw.acceptance!=='not_verified'||!date(raw.observed_at)||!['idle','in_progress','blocked','attention','decision'].includes(raw.phase)||!['not_observed','consistent','invalid','unavailable'].includes(raw.integrity)||!/^[a-f0-9]{64}$/.test(raw.checkpoint_key))bad();
 if(!Array.isArray(raw.alerts)||raw.alerts.length>codes.size)bad();
 const seen=new Set();
 const alerts=raw.alerts.map(a=>{
  if(!plain(a)||!codes.has(a.code)||seen.has(a.code)||!['critical','warning','decision'].includes(a.severity)||typeof a.label!=='string'||!a.label.trim()||a.label.length>240||typeof a.next_step!=='string'||!a.next_step.trim()||a.next_step.length>500)bad();
  seen.add(a.code);return {code:a.code,severity:a.severity,label:a.label,next_step:a.next_step};
 });
 if(raw.sequence!==null&&(!Number.isSafeInteger(raw.sequence)||raw.sequence<0))bad();
 const unbound=raw.run_id===null&&raw.goal_id===null&&raw.source_revision===null;
 if(work){
  if(unbound){if(raw.integrity!=='invalid'||!seen.has('invalid_binding'))bad();}
  else if(raw.run_id!==work.run_id||raw.goal_id!==work.goal_id||raw.source_revision!==work.source_revision||raw.checkpoint_at!==work.updated_at)bad();
  if(raw.integrity==='consistent'&&raw.sequence!==work.progress.sequence)bad();
 }else if(!unbound||raw.sequence!==null||raw.checkpoint_at!==null)bad();
 if(raw.owner!==null&&(!plain(raw.owner)||raw.owner.kind!=='runtime_worker'||!id(raw.owner.id)))bad();
 if(!plain(raw.counts))bad();
 const counts={};for(const k of ['total','pending','running','blocked','ready_for_review']){if(!Number.isSafeInteger(raw.counts[k])||raw.counts[k]<0||raw.counts[k]>8)bad();counts[k]=raw.counts[k];}
 if(counts.total!==counts.pending+counts.running+counts.blocked+counts.ready_for_review)bad();
 if(raw.integrity==='consistent'){
  const tasks=work?.progress.progress.tasks;if(!tasks||tasks.length!==counts.total)bad();
  for(const k of ['pending','running','blocked','ready_for_review'])if(tasks.filter(t=>t.status===k).length!==counts[k])bad();
 }
 return {case_id:caseId,run_id:raw.run_id,goal_id:raw.goal_id,source_revision:raw.source_revision,sequence:raw.sequence,checkpoint_key:raw.checkpoint_key,observed_at:raw.observed_at,phase:raw.phase,integrity:raw.integrity,alerts,counts};
}
export const coreHeadline=core=>({idle:'Sin ejecución registrada',in_progress:'Trabajo en curso',blocked:'Hay un resultado por comprobar',attention:'Requiere atención',decision:'Pendiente de revisión'})[core.phase];
