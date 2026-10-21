'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const schema=require('../docs/arquitectura/ppp-volumenes-nativos.schema.json');
const load=()=>import('../despacho3d/project-station.mjs');
const workspace=()=>import('../despacho3d/agent-workspace.mjs');
const now=Date.parse('2026-10-20T20:00:00Z'),clone=structuredClone;
function fixture(){
 const capability={schema:2,read:true,write:true,max_volumes:16,allocation_modes:['preserve','built_area'],shared_resources:[{id:'shared-parking',label:'Estacionamiento compartido'},{id:'shared-circulation',label:'Circulaciones comunes'}],fields:clone(schema['x-native-fields'])};
 const rows=Array.from({length:3},(_,i)=>({id:'synthetic-volume-'+i,values:Object.fromEntries(capability.fields.map(f=>[f.id,f.type==='text'?'Volumen '+(i+1):f.derived?null:Math.max(f.min||0,1)]))}));
 const before={schema:2,count:3,shared_allocation_mode:'preserve',volumes:rows};
 const volumes={schema:2,count:2,shared_allocation_mode:'preserve',volumes:rows.map(row=>({id:row.id,values:Object.fromEntries(capability.fields.filter(f=>f.writable).map(f=>[f.id,row.values[f.id]]))}))};
 volumes.volumes[1].values.units_per_level=7;
 const board={case_id:'synthetic-agent',scenario_id:'synthetic-scenario',revision:'revision-before',confirmed:true,pending:false,metadata:{model_type:'vertical'},version_context:{read_only:true},capabilities:{volumes:capability},volumes:before};
 const link={board_case_id:'synthetic-board'};
 const proposal={kind:'native_volumes',request_id:'same-request',case_id:board.case_id,board_case_id:link.board_case_id,scenario_id:board.scenario_id,revision:board.revision,base_revision:board.revision,before_volumes:clone(before),volumes:clone(volumes),user_confirmed:true,apply_requested_at:new Date(now-1000).toISOString(),apply_expires_at:new Date(now+119000).toISOString()};
 return{board,link,proposal,capability};
}
function saved(f){
 const collection={schema:2,count:f.proposal.volumes.count,shared_allocation_mode:f.proposal.volumes.shared_allocation_mode,volumes:f.proposal.volumes.volumes.map(row=>({id:row.id,values:{...f.board.volumes.volumes.find(v=>v.id===row.id).values,...row.values}}))};
 const board={...f.board,revision:'revision-after',volumes:collection};
 const ack={ok:true,request_id:f.proposal.request_id,case_id:f.proposal.case_id,scenario_id:f.proposal.scenario_id,base_revision:f.proposal.revision,revision:board.revision,native_collection:clone(collection),calculated:false};
 return{board,ack};
}
function resolved(r){return{ok:true,request_id:r.request_id,estado:'applied',status:'applied',kind:r.kind,case_id:r.case_id,board_case_id:r.board_case_id,scenario_id:r.scenario_id,base_revision:r.base_revision,revision:r.revision,receipt:{request_id:r.request_id,case_id:r.case_id,board_case_id:r.board_case_id,scenario_id:r.scenario_id,base_revision:r.base_revision,result_revision:r.revision,native_collection:clone(r.native_collection),calculated:r.calculated}};}

test('native proposals use the exact schema2 drivers and preserve all inactive rows independently of Puesto2',async()=>{
 const {nativeVolumeProposal}=await load(),{proposalState}=await workspace();
 for(const case_id of ['synthetic-agent','another-authorized-vertical']){
  const f=fixture();f.board.case_id=case_id;f.proposal.case_id=case_id;
  const p=nativeVolumeProposal(f.board,f.proposal,f.link,{now});
  assert.equal(proposalState(f.board,f.proposal,null,f.link,now),'ready');
  assert.equal(p.case_id,case_id);assert.notEqual(p.case_id,p.board_case_id);assert.equal(p.before_volumes.volumes.length,3);assert.equal(p.volumes.count,2);assert.equal(p.volumes.volumes.length,3);
  assert.equal(Object.keys(p.volumes.volumes[0].values).length,14);
  for(const key of ['units','direct_cost','gross_area_m2','construction_end_month'])assert.equal(Object.hasOwn(p.volumes.volumes[0].values,key),false);
  assert.notEqual(p.before_volumes,f.proposal.before_volumes);assert.notEqual(p.volumes,f.proposal.volumes);
 }
});

test('a native UI click cannot invent tool confirmation or extend the explicit two minute authority',async()=>{
 const {nativeVolumeProposal}=await load();
 for(const change of [{user_confirmed:false},{apply_requested_at:null},{apply_expires_at:null}]){
  const f=fixture();assert.throws(()=>nativeVolumeProposal(f.board,{...f.proposal,...change},f.link,{now}),/confirmation_required/);
 }
 for(const change of [{apply_expires_at:new Date(now).toISOString()},{apply_requested_at:new Date(now+5001).toISOString()},{apply_expires_at:new Date(now+120000).toISOString()}]){
  const f=fixture();assert.throws(()=>nativeVolumeProposal(f.board,{...f.proposal,...change},f.link,{now}),/confirmation_expired/);
 }
});

test('proposal authority requires a writable native vertical capability and current exact context',async()=>{
 const {nativeVolumeProposal}=await load();
 for(const mutate of [f=>f.board.capabilities.volumes.write=false,f=>f.board.capabilities.volumes.schema=1,f=>delete f.board.capabilities.volumes,f=>f.board.metadata.model_type='patrimonial']){
  const f=fixture();mutate(f);assert.throws(()=>nativeVolumeProposal(f.board,f.proposal,f.link,{now}),/unsupported/);
 }
 for(const change of [{case_id:'foreign'},{board_case_id:'foreign'},{scenario_id:'foreign'},{revision:'foreign'},{base_revision:'foreign'}]){
  const f=fixture();assert.throws(()=>nativeVolumeProposal(f.board,{...f.proposal,...change},f.link,{now}),/stale/);
 }
 const f=fixture();f.proposal.before_volumes.volumes[0].values.name='Changed elsewhere';assert.throws(()=>nativeVolumeProposal(f.board,f.proposal,f.link,{now}),/stale/);
 for(const change of [{pending:true},{confirmed:false}]){const f=fixture();assert.throws(()=>nativeVolumeProposal({...f.board,...change},f.proposal,f.link,{now}),/board_pending/);}
});

test('native transport refuses derived writes, DTO1, unknown fields, missing drivers and invalid row identities',async()=>{
 const {nativeVolumeProposal}=await load();
 for(const mutate of [p=>p.volumes.schema=1,p=>p.volumes.volumes[0].values.units=17,p=>delete p.volumes.volumes[0].values.footprint_m2,p=>p.volumes.volumes[0].values.extra=1,p=>p.volumes.volumes[1].id=p.volumes.volumes[0].id,p=>p.volumes.volumes[0].values.residential_levels=1.5,p=>p.volumes.volumes[0].values.name='=formula()',p=>p.volumes.count=17]){
  const f=fixture();mutate(f.proposal);assert.throws(()=>nativeVolumeProposal(f.board,f.proposal,f.link,{now}),/invalid_volumes/);
 }
});

test('native receipt preserves logical case, canonical board and calculated false only after full readback',async()=>{
 const {nativeVolumeReceipt}=await load(),f=fixture(),s=saved(f);
 const receipt=nativeVolumeReceipt(s.ack,f.proposal,s.board,f.link);
 assert.equal(receipt.case_id,'synthetic-agent');assert.equal(receipt.board_case_id,'synthetic-board');assert.equal(receipt.base_revision,'revision-before');assert.equal(receipt.revision,'revision-after');assert.equal(receipt.calculated,false);
 assert.equal(Object.keys(receipt.native_collection.volumes[0].values).length,21);assert.deepEqual(receipt.native_collection,s.board.volumes);
});

test('native readback rejects unrelated receipt identity, partial collections and an unchanged host snapshot',async()=>{
 const {nativeVolumeReceipt}=await load(),f=fixture(),s=saved(f);
 for(const patch of [{ok:false},{request_id:'another-request'},{case_id:'synthetic-board'},{board_case_id:'another-board'},{scenario_id:'another-scenario'},{base_revision:'another-base'},{revision:'another-result'},{calculated:undefined},{native_collection:f.proposal.volumes}])assert.throws(()=>nativeVolumeReceipt({...s.ack,...patch},f.proposal,s.board,f.link),/receipt_response_mismatch|invalid_volumes/);
 assert.throws(()=>nativeVolumeReceipt(s.ack,f.proposal,f.board,f.link),/receipt_response_mismatch/);
 const mismatched=clone(s);mismatched.ack.native_collection.volumes[0].values.direct_cost=9;assert.throws(()=>nativeVolumeReceipt(mismatched.ack,f.proposal,s.board,f.link),/receipt_response_mismatch/);
 const incorrect=clone(s);incorrect.ack.native_collection.volumes[0].values.units_per_level=99;incorrect.board.volumes=clone(incorrect.ack.native_collection);assert.throws(()=>nativeVolumeReceipt(incorrect.ack,f.proposal,incorrect.board,f.link),/receipt_response_mismatch/);
});

test('native receipt queue sends the complete original receipt and acknowledges only a complete server readback',async()=>{
 const {nativeVolumeReceipt}=await load(),{createReceiptQueue}=await workspace(),f=fixture(),s=saved(f),receipt=nativeVolumeReceipt(s.ack,f.proposal,s.board,f.link),sent=[],acks=[];
 let response={ok:true,request_id:receipt.request_id,status:'applied'};
 const queue=createReceiptQueue({resolve:async r=>{sent.push(clone(r));return response;},ack:r=>acks.push(clone(r))});
 const missingMode=clone(receipt);delete missingMode.native_collection.shared_allocation_mode;assert.equal(queue.enqueue(missingMode),false);
 assert.equal(queue.enqueue(receipt),true);assert.equal(queue.enqueue({...receipt,native_collection:{...receipt.native_collection,count:1}}),false);
 assert.equal(await queue.drain(),false);assert.equal(queue.size,1);assert.deepEqual(acks,[]);assert.deepEqual(sent,[receipt]);
 for(const mutate of [r=>r.case_id='foreign',r=>r.receipt.scenario_id='foreign',r=>r.receipt.base_revision='foreign',r=>r.receipt.result_revision='old',r=>r.receipt.calculated=true,r=>r.receipt.native_collection.volumes[0].values.units_per_level=19,r=>r.receipt.native_collection.shared_allocation_mode='built_area',r=>delete r.receipt.native_collection.shared_allocation_mode]){
  response=resolved(receipt);mutate(response);assert.equal(await queue.drain(),false);assert.equal(acks.length,0);assert.equal(queue.size,1);
 }
 response=resolved(receipt);response.receipt.native_collection={volumes:response.receipt.native_collection.volumes,count:response.receipt.native_collection.count,shared_allocation_mode:response.receipt.native_collection.shared_allocation_mode,schema:2};
 assert.equal(await queue.drain(),true);assert.deepEqual(acks,[receipt]);assert.equal(queue.size,0);
});

test('a superseded receipt reconciles the original write while verifying and retaining the newer live collection',async()=>{
 const {nativeVolumeReceipt}=await load(),f=fixture(),s=saved(f),current=clone(s.board);
 current.revision='revision-newer';current.volumes.volumes[0].values.units_per_level=11;
 const ack={...s.ack,status:'confirmed_superseded',current_revision:current.revision,current_collection:clone(current.volumes)};
 const receipt=nativeVolumeReceipt(ack,f.proposal,current,f.link);
 assert.equal(receipt.revision,'revision-after');assert.equal(receipt.current_revision,'revision-newer');assert.equal(receipt.status,'confirmed_superseded');assert.deepEqual(receipt.native_collection,s.board.volumes);assert.deepEqual(receipt.current_collection,current.volumes);
 assert.notEqual(receipt.current_collection.volumes[0].values.units_per_level,receipt.native_collection.volumes[0].values.units_per_level);
 for(const change of [{current_revision:'another-current'},{current_collection:s.board.volumes},{native_collection:current.volumes}])assert.throws(()=>nativeVolumeReceipt({...ack,...change},f.proposal,current,f.link),/receipt_response_mismatch/);
});

test('superseded queue resolution keeps the original receipt and requires the separate current revision readback',async()=>{
 const {nativeVolumeReceipt}=await load(),{createReceiptQueue}=await workspace(),f=fixture(),s=saved(f),current=clone(s.board);
 current.revision='revision-newer';current.volumes.volumes[0].values.units_per_level=11;
 const ack={...s.ack,status:'confirmed_superseded',current_revision:current.revision,current_collection:clone(current.volumes)},receipt=nativeVolumeReceipt(ack,f.proposal,current,f.link),calls=[],acks=[];
 let response=resolved(receipt);
 const queue=createReceiptQueue({resolve:r=>{calls.push(clone(r));return response;},ack:r=>acks.push(clone(r))});queue.enqueue(receipt);
 assert.equal(await queue.drain(),false,'an ordinary applied response cannot close a superseded operation');assert.equal(acks.length,0);
 response={...resolved(receipt),status:'confirmed_superseded',receipt_status:'superseded',current_revision:receipt.current_revision,current_collection:clone(receipt.current_collection)};
 response.current_collection.volumes[0].values.name='Wrong newer collection';assert.equal(await queue.drain(),false);assert.equal(acks.length,0);
 response.current_collection=clone(receipt.current_collection);assert.equal(await queue.drain(),true);assert.deepEqual(acks,[receipt]);
 assert.equal(calls.every(r=>r.status==='confirmed_superseded'&&r.revision==='revision-after'&&r.current_revision==='revision-newer'),true);
});

test('a different proposal cannot replace an in-flight or uncertain native application',async()=>{
 const {proposalState}=await workspace(),f=fixture();
 for(const status of ['sending','confirming','unconfirmed'])assert.equal(proposalState(f.board,f.proposal,{request_id:'another-original-request',status},f.link,now),'board_pending');
});

test('receipt-only reconciliation tolerates an expired intent, own pending state and read-only capability without authorizing a write',async()=>{
 const {nativeVolumeReconciliation,nativeVolumeProposal}=await load(),f=fixture();
 f.board.pending=true;f.board.confirmed=false;f.board.revision='revision-after-timeout';f.board.capabilities.volumes.write=false;
 f.proposal.apply_expires_at='2026-10-19T00:00:00Z';f.board.version_context.viewed_scenario_id=f.proposal.scenario_id;
 const request=nativeVolumeReconciliation(f.board,f.proposal,f.link);
 assert.equal(request.reconcile_only,true);assert.equal(request.request_id,f.proposal.request_id);assert.equal(request.revision,'revision-before');
 assert.equal(request.before_volumes.volumes.length,3);assert.equal(Object.keys(request.volumes.volumes[0].values).length,14);
 assert.throws(()=>nativeVolumeProposal(f.board,f.proposal,f.link,{now}),/board_pending/);
});

test('receipt-only reconciliation retains authorization scope and original journal intent',async()=>{
 const {nativeVolumeReconciliation}=await load();
 for(const mutate of [f=>f.proposal.case_id='foreign',f=>f.proposal.board_case_id='foreign',f=>f.proposal.scenario_id='foreign',f=>f.board.version_context.viewed_scenario_id='another-visible-scenario',f=>f.proposal.base_revision='foreign']){
  const f=fixture();mutate(f);assert.throws(()=>nativeVolumeReconciliation(f.board,f.proposal,f.link),/stale/);
 }
 for(const mutate of [f=>f.proposal.user_confirmed=false,f=>delete f.proposal.apply_requested_at]){const f=fixture();mutate(f);assert.throws(()=>nativeVolumeReconciliation(f.board,f.proposal,f.link),/confirmation_required/);}
 const f=fixture();f.board.capabilities.volumes.read=false;assert.throws(()=>nativeVolumeReconciliation(f.board,f.proposal,f.link),/unsupported/);
});

test('a journal intent first seen after reload can only query its original receipt, once automatically then explicitly',async()=>{
 const {createNativeVolumeRecovery}=await workspace(),{nativeVolumeReconciliation}=await load(),f=fixture(),recovery=createNativeVolumeRecovery(),calls=[];
 recovery.observe([f.proposal]);assert.equal(recovery.writeAllowed(f.proposal),false);assert.equal(recovery.takeWrite(f.proposal),false);assert.equal(recovery.lookupNeeded(f.proposal),true);
 const lookup=automatic=>{if(recovery.takeLookup(f.proposal,{automatic}))calls.push({type:'yod:ppp:volumes-receipt',proposal:nativeVolumeReconciliation(f.board,f.proposal,f.link)});};
 lookup(true);lookup(true);assert.equal(calls.length,1);
 for(const childError of ['receipt_not_found','operation_pending']){assert.ok(childError);assert.equal(recovery.takeWrite(f.proposal),false);lookup(true);assert.equal(calls.length,1);}
 lookup(false);assert.equal(calls.length,2);assert.equal(calls.every(c=>c.type==='yod:ppp:volumes-receipt'&&c.proposal.reconcile_only===true&&c.proposal.request_id==='same-request'),true);
 assert.equal(recovery.takeWrite(f.proposal),false);recovery.resolve(f.proposal.request_id);assert.equal(recovery.takeLookup(f.proposal),false);assert.equal(recovery.lookupNeeded(f.proposal),false);
});

test('only a witnessed draft-to-confirmed transition can send its first write and uncertainty never re-enables it',async()=>{
 const {createNativeVolumeRecovery}=await workspace(),f=fixture(),recovery=createNativeVolumeRecovery(),draft={...f.proposal,user_confirmed:false};delete draft.apply_requested_at;delete draft.apply_expires_at;
 recovery.observe([draft]);recovery.observe([f.proposal]);assert.equal(recovery.writeAllowed(f.proposal),true);assert.equal(recovery.takeWrite(f.proposal),true);assert.equal(recovery.takeWrite(f.proposal),false);
 assert.equal(recovery.takeLookup(f.proposal,{automatic:true}),true);assert.equal(recovery.takeWrite(f.proposal),false);
 recovery.clear();recovery.observe([f.proposal]);assert.equal(recovery.writeAllowed(f.proposal),false,'reset/reload cannot restore first-write authority');
});

test('a reused journal request with another payload loses both first-write and receipt lookup eligibility',async()=>{
 const {createNativeVolumeRecovery}=await workspace(),f=fixture(),recovery=createNativeVolumeRecovery(),draft={...f.proposal};delete draft.apply_requested_at;
 recovery.observe([draft]);const changed=clone(f.proposal);changed.volumes.volumes[0].values.units_per_level=99;recovery.observe([changed]);
 assert.equal(recovery.takeWrite(changed),false);assert.equal(recovery.takeLookup(changed),false);assert.equal(recovery.takeWrite(f.proposal),false);assert.equal(recovery.takeLookup(f.proposal),false);
});

test('native discard carries logical scope and refuses every already-confirmed intent including expired ones',async()=>{
 const {proposalDiscardPayload}=await load(),f=fixture(),draft={...f.proposal};delete draft.apply_requested_at;draft.user_confirmed=false;
 assert.deepEqual(proposalDiscardPayload(draft),{request_id:'same-request',status:'discarded',case_id:'synthetic-agent',scenario_id:'synthetic-scenario',base_revision:'revision-before'});
 assert.deepEqual(proposalDiscardPayload({request_id:'legacy-request'}),{request_id:'legacy-request',status:'discarded'});
 assert.throws(()=>proposalDiscardPayload({...f.proposal,apply_expires_at:'2026-10-19T00:00:00Z'}),/confirmation_pending/);
});

test('a server-created proposal confirmed between polls may write once after the initial server baseline',async()=>{
 const {createNativeVolumeRecovery}=await workspace(),f=fixture(),recovery=createNativeVolumeRecovery();
 recovery.observe([],{serverAt:new Date(now-3000).toISOString()});f.proposal.created_at=new Date(now-2000).toISOString();
 recovery.observe([f.proposal],{serverAt:new Date(now).toISOString()});
 assert.equal(recovery.writeAllowed(f.proposal),true);assert.equal(recovery.takeWrite(f.proposal),true);assert.equal(recovery.takeWrite(f.proposal),false);
 recovery.clear();recovery.observe([f.proposal],{serverAt:new Date(now+1000).toISOString()});assert.equal(recovery.takeWrite(f.proposal),false,'the same intent at reload must never write');assert.equal(recovery.takeLookup(f.proposal,{automatic:true}),true);
});

test('missing or old server creation evidence cannot turn a journal lookup into a first write',async()=>{
 const {createNativeVolumeRecovery}=await workspace();
 for(const created_at of [undefined,'invalid',new Date(now-10000).toISOString(),new Date(now).toISOString()]){
  const f=fixture(),recovery=createNativeVolumeRecovery();recovery.observe([],{serverAt:new Date(now).toISOString()});f.proposal.created_at=created_at;recovery.observe([f.proposal],{serverAt:new Date(now+1000).toISOString()});assert.equal(recovery.takeWrite(f.proposal),false);assert.equal(recovery.takeLookup(f.proposal,{automatic:true}),true);assert.equal(recovery.takeWrite(f.proposal),false);
 }
 const f=fixture(),recovery=createNativeVolumeRecovery();recovery.observe([]);f.proposal.created_at=new Date(now+1000).toISOString();recovery.observe([f.proposal]);assert.equal(recovery.takeWrite(f.proposal),false,'a missing server clock preserves the read-only route');
});

function rejected(f,error='revision_conflict'){
 return{ok:false,status:'rejected',request_id:f.proposal.request_id,case_id:f.proposal.case_id,board_case_id:f.link.board_case_id,scenario_id:f.proposal.scenario_id,base_revision:f.proposal.revision,prewrite_rejection:{request_id:f.proposal.request_id,caso_id:f.link.board_case_id,escenario_id:f.proposal.scenario_id,base_revision:f.proposal.revision,actor:'synthetic-authorized-actor',payload_hash:'a'.repeat(64),stage:'prewrite',write_attempted:false,error,rejected_at:new Date(now).toISOString()}};
}
function rejectedResult(receipt){return{ok:true,request_id:receipt.request_id,estado:'rejected',status:'rejected',revision:null,kind:'native_volumes',case_id:receipt.case_id,board_case_id:receipt.board_case_id,scenario_id:receipt.scenario_id,base_revision:receipt.base_revision,prewrite_rejection:clone(receipt.prewrite_rejection)};}

test('canonical durable prewrite rejections retain their exact scope without pretending a calculation or write occurred',async()=>{
 const {nativeVolumeRejection}=await load(),f=fixture();
 for(const error of ['revision_conflict','active_driver_missing','protected_native_driver','native_formula_missing','native_formula_manifest_changed','native_geometry_conflict','native_horizon_conflict','shared_allocation_requires_reconciliation','volume_identity_conflict']){
  const ack=rejected(f,error),receipt=nativeVolumeRejection(ack,f.proposal,f.board.case_id,f.link);
  assert.equal(receipt.status,'rejected');assert.equal(receipt.revision,null);assert.deepEqual(receipt.prewrite_rejection,ack.prewrite_rejection);assert.equal(Object.hasOwn(receipt,'native_collection'),false);assert.equal(Object.hasOwn(receipt,'calculated'),false);
 }
});

test('timeouts, missing receipts, noncanonical proofs and any possibly attempted write cannot become a terminal rejection',async()=>{
 const {nativeVolumeRejection}=await load(),f=fixture();
 for(const mutate of [r=>delete r.prewrite_rejection,r=>r.status='operation_pending',r=>r.prewrite_rejection.write_attempted=true,r=>r.prewrite_rejection.stage='write',r=>r.prewrite_rejection.error='receipt_not_found',r=>r.prewrite_rejection.actor='',r=>r.prewrite_rejection.payload_hash='invalid',r=>r.prewrite_rejection.request_id='foreign',r=>r.prewrite_rejection.caso_id=f.proposal.case_id,r=>r.prewrite_rejection.escenario_id='foreign',r=>r.prewrite_rejection.base_revision='foreign',r=>r.case_id=f.link.board_case_id,r=>r.board_case_id='foreign',r=>r.base_revision='foreign']){
  const ack=rejected(f);mutate(ack);assert.throws(()=>nativeVolumeRejection(ack,f.proposal,f.board.case_id,f.link),/rejection_response_mismatch/);
 }
 for(const error of ['receipt_not_found','operation_pending','timeout'])assert.throws(()=>nativeVolumeRejection({ok:false,request_id:f.proposal.request_id,error},f.proposal,f.board.case_id,f.link),/rejection_response_mismatch/);
});

test('terminal rejection queue resolves only the immutable canonical proof and never sends an applied status',async()=>{
 const {nativeVolumeRejection}=await load(),{createReceiptQueue}=await workspace(),f=fixture(),receipt=nativeVolumeRejection(rejected(f),f.proposal,f.board.case_id,f.link),calls=[],acks=[];
 let result={ok:true,request_id:receipt.request_id,status:'applied'};
 const queue=createReceiptQueue({resolve:r=>{calls.push(clone(r));return result;},ack:r=>acks.push(clone(r))});
 assert.equal(queue.enqueue(receipt),true);const reused=clone(receipt);reused.prewrite_rejection.error='active_driver_missing';assert.equal(queue.enqueue(reused),false);
 assert.equal(await queue.drain(),false);assert.equal(acks.length,0);assert.equal(queue.size,1);
 for(const mutate of [r=>r.revision='revision-before',r=>r.case_id='foreign',r=>r.prewrite_rejection.actor='foreign',r=>r.prewrite_rejection.payload_hash='b'.repeat(64),r=>r.prewrite_rejection.error='active_driver_missing']){result=rejectedResult(receipt);mutate(result);assert.equal(await queue.drain(),false);assert.equal(acks.length,0);}
 result=rejectedResult(receipt);assert.equal(await queue.drain(),true);assert.deepEqual(acks,[receipt]);assert.equal(calls.every(r=>r.status==='rejected'&&r.revision===null&&r.prewrite_rejection.write_attempted===false),true);
});

test('only a server-confirmed terminal proof releases recovery while ordinary lookup failures preserve uncertainty',async()=>{
 const {nativeVolumeRejection}=await load(),{createNativeVolumeRecovery,createReceiptQueue}=await workspace(),f=fixture(),recovery=createNativeVolumeRecovery(),receipt=nativeVolumeRejection(rejected(f),f.proposal,f.board.case_id,f.link);
 recovery.observe([f.proposal]);assert.equal(recovery.takeLookup(f.proposal,{automatic:true}),true);
 const queue=createReceiptQueue({resolve:r=>rejectedResult(r),ack:()=>{},onResult:(r,ok)=>{if(ok)recovery.resolve(r.request_id);}});
 assert.equal(queue.enqueue({kind:'native_volumes',status:'rejected',request_id:f.proposal.request_id,revision:null}),false);assert.equal(recovery.lookupNeeded(f.proposal),true);assert.equal(recovery.takeWrite(f.proposal),false);
 queue.enqueue(receipt);assert.equal(await queue.drain(),true);assert.equal(recovery.lookupNeeded(f.proposal),false);assert.equal(recovery.takeWrite(f.proposal),false);assert.equal(recovery.takeLookup(f.proposal),false);
});


test('native field authority preserves the fractional units-per-level contract through repeated normalization',async()=>{
 const {nativeVolumeCapability}=await load(),f=fixture(),cap=nativeVolumeCapability(f.capability);
 assert.ok(cap);assert.deepEqual(nativeVolumeCapability(cap),cap);
 const average=cap.fields.find(field=>field.id==='units_per_level'),units=cap.fields.find(field=>field.id==='units');
 assert.equal(average.label,'Viviendas por planta · promedio');assert.equal(average.type,'number');assert.equal(average.step,0.000001);assert.equal(average.writable,true);
 assert.equal(units.type,'integer');assert.equal(units.step,1);assert.equal(units.writable,false);assert.equal(units.derived,true);
 for(const patch of [{type:'integer'},{step:1},{step:undefined},{label:'Viviendas por planta'}]){const changed=clone(f.capability);Object.assign(changed.fields.find(field=>field.id==='units_per_level'),patch);assert.equal(nativeVolumeCapability(changed),null);}
 for(const [field,patch]of [['residential_levels',{type:'number'}],['units',{type:'number'}],['units',{writable:true,derived:false}],['footprint_m2',{step:-1}]]){const changed=clone(f.capability);Object.assign(changed.fields.find(f=>f.id===field),patch);assert.equal(nativeVolumeCapability(changed),null);}
});

test('17 units across three levels preserves the explicit fractional driver and accepts only the canonical Sheets integer receipt',async()=>{
 const {nativeVolumeProposal,nativeVolumeReceipt,nativeVolumeCollection}=await load(),f=fixture();
 f.proposal.volumes.volumes[0].values.residential_levels=3;f.proposal.volumes.volumes[0].values.units_per_level=5.666667;
 const proposal=nativeVolumeProposal(f.board,f.proposal,f.link,{now});
 assert.equal(proposal.volumes.volumes[0].values.units_per_level,5.666667);assert.equal(Object.hasOwn(proposal.volumes.volumes[0].values,'units'),false);
 const s=saved(f);s.board.volumes.volumes[0].values.units=17;s.ack.native_collection=clone(s.board.volumes);
 const receipt=nativeVolumeReceipt(s.ack,proposal,s.board,f.link);
 assert.equal(receipt.native_collection.volumes[0].values.units,17);assert.equal(receipt.native_collection.volumes[0].values.units_per_level,5.666667);assert.equal(receipt.calculated,false,'quantity readback does not imply typology reconciliation or complete financial results');
 const fractionalDerived=clone(s.ack.native_collection);fractionalDerived.volumes[0].values.units=17.000001;assert.throws(()=>nativeVolumeCollection(fractionalDerived,f.capability),/invalid_volumes/);
 const derivedWrite=clone(f.proposal);derivedWrite.volumes.volumes[0].values.units=17;assert.throws(()=>nativeVolumeProposal(f.board,derivedWrite,f.link,{now}),/invalid_volumes/);
});


test('shared allocation capability preserves every authorized resource without permitting amounts or an implicit mode',async()=>{
 const {nativeVolumeCapability,nativeVolumeCollection}=await load(),f=fixture();
 for(const length of [0,128]){const raw=clone(f.capability);raw.shared_resources=Array.from({length},(_,i)=>({id:'resource-'+i,label:'Recurso compartido '+i}));const cap=nativeVolumeCapability(raw);assert.equal(cap.shared_resources.length,length);assert.deepEqual(nativeVolumeCapability(cap),cap);assert.deepEqual(cap.allocation_modes,['preserve','built_area']);}
 for(const mutate of [c=>delete c.allocation_modes,c=>c.allocation_modes.reverse(),c=>c.allocation_modes.push('automatic'),c=>delete c.shared_resources,c=>c.shared_resources.push({...c.shared_resources[0]}),c=>c.shared_resources[0].amount=10,c=>c.shared_resources[0].label=' hidden ',c=>c.shared_resources[0].label='two\nlines',c=>c.shared_resources=Array.from({length:129},(_,i)=>({id:'resource-'+i,label:'Resource '+i}))]){const cap=clone(f.capability);mutate(cap);assert.equal(nativeVolumeCapability(cap),null);}
 for(const write of [false,true])for(const mode of [undefined,null,'automatic']){const value=clone(write?f.proposal.volumes:f.board.volumes);if(mode===undefined)delete value.shared_allocation_mode;else value.shared_allocation_mode=mode;assert.throws(()=>nativeVolumeCollection(value,f.capability,{write}),/invalid_volumes/);}
});

test('a shared-cost mode-only change is bound to before, original request, canonical receipt and recovery identity',async()=>{
 const {nativeVolumeProposal,nativeVolumeReceipt}=await load(),{createNativeVolumeRecovery}=await workspace(),f=fixture();
 f.proposal.volumes=clone(f.proposal.before_volumes);for(const row of f.proposal.volumes.volumes)for(const field of f.capability.fields.filter(field=>!field.writable))delete row.values[field.id];
 f.proposal.volumes.shared_allocation_mode='built_area';const proposal=nativeVolumeProposal(f.board,f.proposal,f.link,{now});assert.equal(proposal.volumes.shared_allocation_mode,'built_area');
 const changedBefore=clone(f.proposal);changedBefore.before_volumes.shared_allocation_mode='built_area';assert.throws(()=>nativeVolumeProposal(f.board,changedBefore,f.link,{now}),/stale/);
 const s=saved(f),receipt=nativeVolumeReceipt(s.ack,proposal,s.board,f.link);assert.equal(receipt.native_collection.shared_allocation_mode,'built_area');
 const wrong=clone(s);wrong.ack.native_collection.shared_allocation_mode='preserve';wrong.board.volumes=clone(wrong.ack.native_collection);assert.throws(()=>nativeVolumeReceipt(wrong.ack,proposal,wrong.board,f.link),/receipt_response_mismatch/);
 const recovery=createNativeVolumeRecovery(),draft=clone(f.proposal);delete draft.apply_requested_at;recovery.observe([draft]);const reused=clone(f.proposal);reused.volumes.shared_allocation_mode='preserve';recovery.observe([reused]);assert.equal(recovery.takeWrite(reused),false);assert.equal(recovery.takeLookup(reused),false);
});
