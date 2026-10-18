'use strict';
const {test}=require('node:test'); const assert=require('node:assert/strict');
const {createWork,transition,assertNoDuplicate}=require('../os/yod-core-domain.cjs');
const args={id:'synthetic-1',entityId:'PRJ-DEMO',objective:'Verificar entrega',scope:'demo',actor:'agent',at:'2026-10-17T00:00:00Z'};
const move=(w,to,more={})=>transition(w,{to,expectedRevision:w.revision,actor:'agent',at:'2026-10-17T01:00:00Z',...more});
test('requires verified evidence before closure',()=>{
 let w=createWork(args);w=move(w,'assigned');w=move(w,'running');w=move(w,'verifying');
 assert.throws(()=>move(w,'done'),{code:'missing_artifact'});
 assert.throws(()=>move(w,'done',{evidence:{artifactRef:'commit:demo'}}),{code:'missing_verification'});
 w=move(w,'done',{evidence:{artifactRef:'commit:demo'},verification:{passed:true,testRef:'test:demo'}});
 assert.equal(w.state,'done');assert.equal(w.events.length,5);
});
test('rejects stale revision and invalid skips',()=>{
 let w=createWork(args);
 assert.throws(()=>move(w,'done'),{code:'invalid_transition'});
 assert.throws(()=>transition(w,{to:'assigned',expectedRevision:2,actor:'agent',at:'now'}),{code:'revision_conflict'});
});
test('blocked execution needs reason and can resume',()=>{
 let w=createWork(args);
 assert.throws(()=>move(w,'blocked'),{code:'missing_reason'});
 w=move(w,'blocked',{reason:'write_outcome_unknown'});assert.equal(w.state,'blocked');
 w=move(w,'assigned');assert.equal(w.state,'assigned');
});
test('active duplicate is not admitted',()=>{
 const w=createWork(args);
 assert.throws(()=>assertNoDuplicate([w],args),{code:'duplicate_active_work'});
 assert.equal(assertNoDuplicate([w],{...args,scope:'independent'}),true);
});
