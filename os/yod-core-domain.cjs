'use strict';
// Pure contract. Caller must derive actor/permissions from authenticated authority.
// A reference or passed:true is not an external verification performed by this module.
const STATES = Object.freeze(['proposed','assigned','running','verifying','done','blocked','cancelled']);
const NEXT = Object.freeze(Object.fromEntries(Object.entries({
  proposed:['assigned','blocked','cancelled'], assigned:['running','blocked','cancelled'],
  running:['verifying','blocked','cancelled'], verifying:['done','running','blocked','cancelled'],
  blocked:['assigned','verifying','cancelled'], done:[], cancelled:[]
}).map(([key,value])=>[key,Object.freeze(value)])));
function assert(ok,code){if(!ok)throw Object.assign(new Error(code),{code});}
function text(value,code='missing_field',max=2000){
  assert(typeof value==='string',code);const out=value.normalize('NFC').trim();
  assert(out.length>0&&out.length<=max&&!/[\u0000-\u001f\u007f]/.test(out),code);return out;
}
function stamp(value){
  assert(typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value)),'invalid_timestamp');
  const out=new Date(value).toISOString();assert(out===value||out.replace('.000Z','Z')===value,'invalid_timestamp');return out;
}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function detached(value){return structuredClone(value);}
function canonicalKey(value){return JSON.stringify([text(value.entityId),text(value.objective),text(value.scope)]);}
function artifact(value){assert(value&&typeof value==='object','missing_artifact');return {artifactRef:text(value.artifactRef,'missing_artifact',1000),artifactRevision:text(value.artifactRevision,'missing_artifact',256)};}
function createWork(input){
  assert(input&&typeof input==='object','missing_field');const kind=input.kind??'read';assert(['read','write'].includes(kind),'invalid_kind');
  assert(input.revision===undefined||input.revision===0,'invalid_revision');
  const at=stamp(input.at),actor=text(input.actor,'missing_audit',256),priority=input.priority??2;
  assert(Number.isInteger(priority)&&priority>=0&&priority<=3,'invalid_priority');
  const dependencies=input.dependencies??[];assert(Array.isArray(dependencies)&&dependencies.length<=100,'invalid_dependencies');
  const deps=dependencies.map(id=>text(id,'invalid_dependencies',256));assert(new Set(deps).size===deps.length,'invalid_dependencies');
  const id=text(input.id,'missing_field',256);assert(!deps.includes(id),'invalid_dependencies');
  return freeze({id,entityId:text(input.entityId),objective:text(input.objective),scope:text(input.scope),kind,
    acceptanceCriteria:text(input.acceptanceCriteria,'missing_acceptance'),priority,dependencies:deps,
    dueAt:input.dueAt?stamp(input.dueAt):null,owner:null,state:'proposed',revision:0,createdAt:at,updatedAt:at,
    evidence:null,verification:null,checkpoint:null,uncertainty:null,
    events:[{type:'created',at,actor,revision:0}]});
}
function audit(work,command){
  assert(work&&STATES.includes(work.state)&&Number.isSafeInteger(work.revision)&&work.revision>=0&&Array.isArray(work.events),'invalid_work');
  assert(command&&typeof command==='object','invalid_command');
  assert(Number.isSafeInteger(command.expectedRevision)&&command.expectedRevision===work.revision,'revision_conflict');
  assert(command&&typeof command==='object','invalid_command');
  const actor=text(command.actor,'missing_audit',256),at=stamp(command.at);assert(at>=stamp(work.updatedAt),'timestamp_regression');return {actor,at};
}
function append(work,patch,event){
  const revision=work.revision+1;
  return freeze({...detached(work),...detached(patch),revision,updatedAt:event.at,events:[...detached(work.events),{...detached(event),revision}]});
}
function transition(work,command){
  const {actor,at}=audit(work,command),to=command.to;assert((NEXT[work.state]||[]).includes(to),'invalid_transition');
  const patch={state:to};const event={type:'transition',from:work.state,to,actor,at};
  if(work.uncertainty){
    const rec=command.reconciliation;assert(rec&&rec.requestId===work.uncertainty.requestId&&rec.verifiedBy===actor&&actor!==work.owner,'reconciliation_required');
    assert(['applied','not_applied'].includes(rec.outcome),'reconciliation_required');
    const receiptRef=text(rec.receiptRef,'reconciliation_required',1000);
    assert(rec.outcome==='applied'?to==='verifying':['assigned','cancelled'].includes(to),'unsafe_write_retry');
    patch.uncertainty=null;event.reconciliation={requestId:rec.requestId,outcome:rec.outcome,receiptRef,verifiedBy:actor};
  }else if(work.state==='blocked'&&to==='verifying')assert(false,'reconciliation_required');
  if(to==='assigned'){
    patch.owner=text(command.owner,'missing_owner',256);event.owner=patch.owner;patch.evidence=null;patch.verification=null;
    if(work.state==='blocked')event.reason=text(command.reason,'missing_reason');
  }
  if(to==='running'){
    assert(work.owner&&actor===work.owner,'not_owner');patch.evidence=null;patch.verification=null;
  }
  if(to==='verifying'){
    assert(work.state==='blocked'||actor===work.owner,'not_owner');patch.evidence={...artifact(command.evidence),submittedAt:at,workRevision:work.revision+1};
    patch.verification=null;event.evidence=patch.evidence;
  }
  if(to==='done'){
    assert(work.owner&&actor!==work.owner,'independent_verifier_required');assert(work.evidence,'missing_artifact');
    const v=command.verification;assert(v&&v.passed===true&&v.verifiedBy===actor,'missing_verification');
    assert(v.artifactRef===work.evidence.artifactRef&&v.artifactRevision===work.evidence.artifactRevision&&v.workRevision===work.revision,'verification_mismatch');
    const checkedAt=stamp(v.checkedAt);assert(checkedAt>=work.evidence.submittedAt&&checkedAt<=at,'verification_time_mismatch');
    patch.verification={...artifact(v),passed:true,verifiedBy:actor,checkedAt,testRef:text(v.testRef,'missing_verification',1000),workRevision:work.revision};
    event.verification=patch.verification;
  }
  if(to==='blocked'||to==='cancelled'){
    const reason=text(command.reason,'missing_reason');event.reason=reason;
    if(reason==='write_outcome_unknown'){
      assert(to==='blocked'&&work.kind==='write'&&work.state==='running','invalid_uncertainty');
      patch.uncertainty={requestId:text(command.effectRequestId,'missing_effect_request',256),since:at};event.uncertainty=patch.uncertainty;
    }
  }
  return append(work,patch,event);
}
function checkpoint(work,command){
  const {actor,at}=audit(work,command);assert(work.state==='running'&&work.owner===actor,'not_running_owner');
  assert(command.checkpoint&&typeof command.checkpoint==='object','invalid_checkpoint');
  const value={step:text(command.checkpoint.step,'invalid_checkpoint',256),...artifact(command.checkpoint),at};
  return append(work,{checkpoint:value},{type:'checkpoint',actor,at,checkpoint:value});
}
function assertNoDuplicate(items,candidate){const key=canonicalKey(candidate);assert(!items.some(w=>!['done','cancelled'].includes(w.state)&&canonicalKey(w)===key),'duplicate_active_work');return true;}
module.exports=Object.freeze({STATES,NEXT,assert,text,stamp,canonicalKey,createWork,transition,checkpoint,assertNoDuplicate});
