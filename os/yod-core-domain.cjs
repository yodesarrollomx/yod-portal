'use strict';
// Pure YOD Core contract. No network, storage, auth or production writes.
const STATES = Object.freeze(['proposed','assigned','running','verifying','done','blocked','cancelled']);
const NEXT = Object.freeze({
 proposed:['assigned','blocked','cancelled'],
 assigned:['running','blocked','cancelled'],
 running:['verifying','blocked','cancelled'],
 verifying:['done','running','blocked','cancelled'],
 blocked:['assigned','cancelled'],
 done:[], cancelled:[]
});
function assert(condition, code) { if (!condition) throw Object.assign(new Error(code), { code }); }
function createWork({id,entityId,objective,scope,revision=0,at,actor}) {
 for (const value of [id,entityId,objective,scope,at,actor]) assert(typeof value==='string' && value.trim(), 'missing_field');
 assert(Number.isSafeInteger(revision) && revision>=0,'invalid_revision');
 return {id,entityId,objective,scope,state:'proposed',revision,events:[{type:'created',at,actor,revision}]};
}
function transition(work,{to,expectedRevision,actor,at,reason,evidence,verification}) {
 assert(work && STATES.includes(work.state),'invalid_work');
 assert(Number.isSafeInteger(expectedRevision) && expectedRevision===work.revision,'revision_conflict');
 assert(typeof actor==='string' && !!actor.trim() && typeof at==='string' && !!at.trim(),'missing_audit');
 assert((NEXT[work.state]||[]).includes(to),'invalid_transition');
 if(to==='done') {
  assert(work.state==='verifying','invalid_transition');
  assert(evidence && typeof evidence.artifactRef==='string' && !!evidence.artifactRef.trim(),'missing_artifact');
  assert(verification && verification.passed===true && typeof verification.testRef==='string' && !!verification.testRef.trim(),'missing_verification');
 }
 if(to==='blocked'||to==='cancelled') assert(typeof reason==='string'&&!!reason.trim(),'missing_reason');
 const revision=work.revision+1;
 const event={type:'transition',from:work.state,to,at,actor,revision,...(reason?{reason}:{}),...(evidence?{evidence}:{}),...(verification?{verification}:{})};
 return {...work,state:to,revision,events:[...work.events,event]};
}
function assertNoDuplicate(workItems,candidate) {
 assert(candidate && typeof candidate.entityId==='string' && typeof candidate.objective==='string' && typeof candidate.scope==='string','missing_field');
 assert(!workItems.some(w=>w.entityId===candidate.entityId && w.objective===candidate.objective && w.scope===candidate.scope && !['done','cancelled'].includes(w.state)),'duplicate_active_work');
 return true;
}
module.exports={STATES,NEXT,createWork,transition,assertNoDuplicate};
