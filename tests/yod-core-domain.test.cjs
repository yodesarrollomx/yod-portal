'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../os/yod-core-domain.cjs');
const base={id:'synthetic-1',entityId:'PRJ-DEMO',objective:'Verificar entrega',scope:'demo-v1',acceptanceCriteria:'Archivo comprobado y revisado',actor:'coordinator',at:'2026-10-18T06:00:00Z'};
const move=(w,to,extra={})=>D.transition(w,{to,expectedRevision:w.revision,actor:'worker',at:'2026-10-18T06:01:00Z',...extra});
function running(extra={}){let w=D.createWork({...base,...extra});w=move(w,'assigned',{owner:'worker',actor:'coordinator'});return move(w,'running');}
function submitted(){return move(running(),'verifying',{evidence:{artifactRef:'artifact:demo',artifactRevision:'sha256:demo'}});}
function proof(w){return {passed:true,verifiedBy:'reviewer',artifactRef:w.evidence.artifactRef,artifactRevision:w.evidence.artifactRevision,workRevision:w.revision,checkedAt:'2026-10-18T06:01:00Z',testRef:'test:synthetic'};}
test('requires acceptance criteria and zero initial revision',()=>{
 assert.throws(()=>D.createWork({...base,acceptanceCriteria:''}),{code:'missing_acceptance'});
 assert.throws(()=>D.createWork({...base,revision:2}),{code:'invalid_revision'});
});
test('validates timestamps including nonexistent calendar dates',()=>{
 for(const at of ['now','2026-02-30T00:00:00Z','2026-10-18'])assert.throws(()=>D.createWork({...base,at}),{code:'invalid_timestamp'});
});
test('requires one owner to assign and owner to execute',()=>{
 const w=D.createWork(base);assert.throws(()=>move(w,'assigned'),{code:'missing_owner'});
 const a=move(w,'assigned',{owner:'worker'});assert.throws(()=>move(a,'running',{actor:'other'}),{code:'not_owner'});
 assert.equal(a.events.at(-1).owner,'worker');
});
test('rejects stale revisions, shortcuts and terminal mutations',()=>{
 const w=D.createWork(base);assert.throws(()=>move(w,'done'),{code:'invalid_transition'});
 assert.throws(()=>move(w,'assigned',{owner:'worker',expectedRevision:5}),{code:'revision_conflict'});
 const c=move(w,'cancelled',{reason:'No requerido'});assert.throws(()=>move(c,'assigned',{owner:'worker'}),{code:'invalid_transition'});
});
test('execution cannot declare its own verification',()=>{
 const w=submitted();assert.throws(()=>move(w,'done',{verification:proof(w)}),{code:'independent_verifier_required'});
});
test('cannot submit without immutable artifact revision',()=>{
 assert.throws(()=>move(running(),'verifying'),{code:'missing_artifact'});
 assert.throws(()=>move(running(),'verifying',{evidence:{artifactRef:'artifact:demo'}}),{code:'missing_artifact'});
});
test('closure binds verified identity, work revision and artifact',()=>{
 const w=submitted(),v=proof(w);
 for(const patch of [{artifactRef:'other'},{artifactRevision:'other'},{workRevision:0}])assert.throws(()=>move(w,'done',{actor:'reviewer',verification:{...v,...patch}}),{code:'verification_mismatch'});
 assert.throws(()=>move(w,'done',{actor:'reviewer',verification:{...v,passed:false}}),{code:'missing_verification'});
 assert.throws(()=>move(w,'done',{actor:'reviewer',verification:{...v,verifiedBy:'someone'}}),{code:'missing_verification'});
 const done=move(w,'done',{actor:'reviewer',verification:v});assert.equal(done.state,'done');assert.equal(done.events.length,5);
});
test('verification cannot precede submission or be from the future',()=>{
 const w=submitted();for(const checkedAt of ['2026-10-18T06:00:00Z','2026-10-18T06:02:00Z'])assert.throws(()=>move(w,'done',{actor:'reviewer',verification:{...proof(w),checkedAt}}),{code:'verification_time_mismatch'});
});
test('rework invalidates old evidence and verification',()=>{
 const w=move(submitted(),'running');assert.equal(w.evidence,null);assert.equal(w.verification,null);
});
test('unknown write cannot be resumed or cancelled without reconciliation',()=>{
 const w=move(running({kind:'write'}),'blocked',{reason:'write_outcome_unknown',effectRequestId:'effect-1'});
 assert.throws(()=>move(w,'assigned',{owner:'worker',reason:'Resume'}),{code:'reconciliation_required'});
 assert.throws(()=>move(w,'cancelled',{reason:'Stop'}),{code:'reconciliation_required'});
 assert.equal(w.events.at(-1).uncertainty.requestId,'effect-1');
});
test('applied receipt never authorizes repeating the write',()=>{
 const w=move(running({kind:'write'}),'blocked',{reason:'write_outcome_unknown',effectRequestId:'effect-1'});
 const reconciliation={requestId:'effect-1',verifiedBy:'reviewer',receiptRef:'receipt:1',outcome:'applied'};
 assert.throws(()=>move(w,'assigned',{actor:'reviewer',owner:'worker',reason:'Retry',reconciliation}),{code:'unsafe_write_retry'});
 const next=move(w,'verifying',{actor:'reviewer',reconciliation,evidence:{artifactRef:'artifact:1',artifactRevision:'rev:1'}});
 assert.equal(next.uncertainty,null);assert.equal(next.state,'verifying');
});
test('only confirmed not-applied outcome permits reassignment',()=>{
 const w=move(running({kind:'write'}),'blocked',{reason:'write_outcome_unknown',effectRequestId:'effect-1'});
 const reconciliation={requestId:'effect-1',verifiedBy:'reviewer',receiptRef:'receipt:1',outcome:'not_applied'};
 const next=move(w,'assigned',{actor:'reviewer',owner:'worker-b',reason:'Confirmed safe retry',reconciliation});assert.equal(next.owner,'worker-b');
 assert.throws(()=>move(w,'assigned',{actor:'reviewer',owner:'worker-b',reason:'Retry',reconciliation:{...reconciliation,requestId:'wrong'}}),{code:'reconciliation_required'});
});
test('checkpoint requires running owner and preserves artifact reference',()=>{
 const w=running(),checkpoint={step:'step-1',artifactRef:'artifact:1',artifactRevision:'rev:1'};
 const next=D.checkpoint(w,{checkpoint,actor:'worker',at:'2026-10-18T06:01:00Z',expectedRevision:w.revision});
 assert.equal(next.state,'running');assert.equal(next.revision,w.revision+1);assert.equal(next.checkpoint.step,'step-1');
 assert.throws(()=>D.checkpoint(w,{checkpoint,actor:'other',at:'2026-10-18T06:01:00Z',expectedRevision:w.revision}),{code:'not_running_owner'});
});
test('returned structures and transition graph cannot be mutated',()=>{
 const w=submitted();assert.throws(()=>{w.events.at(-1).evidence.artifactRef='changed';},TypeError);
 assert.throws(()=>D.NEXT.proposed.push('done'),TypeError);assert.equal(w.evidence.artifactRef,'artifact:demo');
});
test('active duplicate canonicalization matches persisted identity',()=>{
 const w=D.createWork(base);assert.throws(()=>D.assertNoDuplicate([w],{...base,entityId:' PRJ-DEMO '}),{code:'duplicate_active_work'});
 assert.equal(D.assertNoDuplicate([w],{...base,scope:'v2'}),true);
 assert.equal(D.assertNoDuplicate([move(w,'cancelled',{reason:'Stopped'})],base),true);
});
test('timestamps never regress and malformed dependency graphs fail',()=>{
 assert.throws(()=>move(running(),'blocked',{reason:'stop',at:'2026-10-18T05:00:00Z'}),{code:'timestamp_regression'});
 assert.throws(()=>D.createWork({...base,dependencies:[base.id]}),{code:'invalid_dependencies'});
 assert.throws(()=>D.createWork({...base,dependencies:['one','one']}),{code:'invalid_dependencies'});
});
