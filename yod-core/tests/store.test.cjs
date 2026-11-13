'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {mkdtempSync,rmSync,statSync}=require('node:fs'),{tmpdir}=require('node:os'),{join,resolve}=require('node:path');
const {spawn,spawnSync}=require('node:child_process');const {DatabaseSync}=require('node:sqlite');
const {openStore}=require('../store.cjs');
function fixture(t,options={}){const dir=mkdtempSync(join(tmpdir(),'yod-core-test-')),path=join(dir,'state.sqlite');const store=openStore(path,{verifyEvidence:()=>true,...options});t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});return {dir,path,store};}
const create=(id='work-1',extra={})=>({type:'create',requestId:'create-'+id,actor:'coordinator',work:{id,entityId:'PRJ-SYNTHETIC',objective:'Synthetic acceptance',scope:'test',acceptanceCriteria:'Verified artifact',...extra}});
function move(store,id,to,extra={}){const w=store.get(id);return store.execute({type:'transition',requestId:`${id}-${w.revision}-${to}`,actor:'worker',workId:id,expectedRevision:w.revision,to,...extra});}
function complete(store,id){move(store,id,'assigned',{actor:'coordinator',owner:'worker'});move(store,id,'running');move(store,id,'verifying',{evidence:{artifactRef:'synthetic:artifact',artifactRevision:'rev:1'}});const w=store.get(id);return move(store,id,'done',{actor:'reviewer',verification:{passed:true,verifiedBy:'reviewer',artifactRef:w.evidence.artifactRef,artifactRevision:w.evidence.artifactRevision,workRevision:w.revision,checkedAt:w.updatedAt,testRef:'synthetic:test'}});}
test('create, durable receipt, restart and exact replay',t=>{
 const {path,store}=fixture(t),cmd=create();const receipt=store.execute(cmd);store.close();const reopened=openStore(path);
 try{assert.equal(reopened.get('work-1').state,'proposed');assert.deepEqual(reopened.receipt(cmd.requestId),receipt);assert.equal(reopened.execute(cmd).replayed,true);assert.equal(reopened.metrics().events,1);}finally{reopened.close();}
});
test('same request id with different payload is rejected',t=>{
 const {store}=fixture(t),cmd=create();store.execute(cmd);assert.throws(()=>store.execute({...cmd,actor:'other'}),{code:'request_id_reused'});assert.equal(store.metrics().total,1);
});
test('keys reordered retain the same idempotency fingerprint',t=>{
 const {store}=fixture(t),cmd=create();store.execute(cmd);assert.equal(store.execute({work:cmd.work,actor:cmd.actor,requestId:cmd.requestId,type:cmd.type}).replayed,true);
});
test('active duplicates and stale updates are rejected without side effects',t=>{
 const {store}=fixture(t);store.execute(create());assert.throws(()=>store.execute(create('work-2')),{code:'duplicate_active_work'});
 assert.throws(()=>store.execute({type:'transition',requestId:'stale',actor:'coordinator',workId:'work-1',expectedRevision:2,to:'assigned',owner:'worker'}),{code:'revision_conflict'});
 assert.equal(store.metrics().events,1);assert.equal(store.receipt('stale'),null);
});
test('completed scope can be deliberately admitted again with new identity',t=>{
 const {store}=fixture(t);store.execute(create());complete(store,'work-1');store.execute(create('work-2'));assert.equal(store.metrics().byState.done,1);assert.equal(store.metrics().byState.proposed,1);
});
test('checkpoint survives process restart but never automatically restarts execution',t=>{
 const {store,path}=fixture(t);store.execute(create());move(store,'work-1','assigned',{owner:'worker'});move(store,'work-1','running');
 const w=store.get('work-1');store.execute({type:'checkpoint',requestId:'checkpoint-1',actor:'worker',workId:w.id,expectedRevision:w.revision,checkpoint:{step:'one',artifactRef:'synthetic:step',artifactRevision:'sha:1'}});
 store.close();const reopened=openStore(path);try{const saved=reopened.get(w.id);assert.equal(saved.checkpoint.step,'one');assert.equal(saved.state,'running');assert.equal(reopened.events(w.id).length,4);}finally{reopened.close();}
});
test('unknown effect survives restart and blocks automatic retries',t=>{
 const {store,path}=fixture(t);store.execute(create('write-1',{kind:'write'}));move(store,'write-1','assigned',{owner:'worker'});move(store,'write-1','running');move(store,'write-1','blocked',{reason:'write_outcome_unknown',effectRequestId:'effect-1'});
 store.close();const reopened=openStore(path);try{assert.equal(reopened.get('write-1').uncertainty.requestId,'effect-1');assert.throws(()=>move(reopened,'write-1','assigned',{owner:'worker',reason:'Retry'}),{code:'reconciliation_adapter_required'});}finally{reopened.close();}
});
test('dependencies must exist and be completed before assignment',t=>{
 const {store}=fixture(t);assert.throws(()=>store.execute(create('child',{dependencies:['parent']})),{code:'dependency_not_found'});
 store.execute(create('parent',{scope:'parent'}));store.execute(create('child',{scope:'child',dependencies:['parent']}));
 assert.throws(()=>move(store,'child','assigned',{owner:'worker'}),{code:'dependencies_incomplete'});complete(store,'parent');assert.equal(move(store,'child','assigned',{owner:'worker'}).state,'assigned');
});
test('ledger and receipts cannot be updated/deleted by normal SQL operations',t=>{
 const {store,path}=fixture(t);store.execute(create());const db=new DatabaseSync(path);
 try{assert.throws(()=>db.exec("UPDATE events SET data='{}'"),/append_only_events/);assert.throws(()=>db.exec('DELETE FROM events'),/append_only_events/);assert.throws(()=>db.exec('DELETE FROM receipts'),/immutable_receipt/);}finally{db.close();}
});
test('failure writing receipt rolls back task and event atomically',t=>{
 const {store,path}=fixture(t);const db=new DatabaseSync(path);db.exec("CREATE TRIGGER simulate_disk_failure BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'synthetic_io_failure'); END;");db.close();
 assert.throws(()=>store.execute(create()),/synthetic_io_failure/);assert.equal(store.get('work-1'),null);assert.equal(store.metrics().events,0);assert.equal(store.metrics().receipts,0);
});
test('database created with private permissions',t=>{const {path}=fixture(t);assert.equal(statSync(path).mode&0o777,0o600);});
test('two independent processes cannot admit the same active identity',async t=>{
 const {path,store}=fixture(t);store.close();const modulePath=resolve(__dirname,'../store.cjs');
 const script=`const s=require(process.argv[1]).openStore(process.argv[2]);try{console.log(JSON.stringify({ok:true,receipt:s.execute(JSON.parse(process.argv[3]))}));}catch(e){console.log(JSON.stringify({ok:false,code:e.code}));}finally{s.close();}`;
 function run(cmd){return new Promise((res,rej)=>{const p=spawn(process.execPath,['-e',script,modulePath,path,JSON.stringify(cmd)]);let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',rej);p.on('close',code=>code?rej(Error(err)):res(JSON.parse(out)));});}
 const results=await Promise.all([run(create('race-1')),run(create('race-2'))]);assert.equal(results.filter(r=>r.ok).length,1);assert.equal(results.find(r=>!r.ok).code,'duplicate_active_work');
 const reopened=openStore(path);try{assert.equal(reopened.metrics().total,1);assert.equal(reopened.metrics().events,1);}finally{reopened.close();}
});
test('process death before commit rolls back uncommitted changes',t=>{
 const {path,store}=fixture(t);store.execute(create());store.close();
 const script=`const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.argv[1]);db.exec("BEGIN IMMEDIATE; UPDATE works SET data='{}' WHERE id='work-1';");process.kill(process.pid,'SIGKILL');`;
 const child=spawnSync(process.execPath,['-e',script,path]);assert.equal(child.signal,'SIGKILL');
 const reopened=openStore(path);try{assert.equal(reopened.get('work-1').id,'work-1');assert.equal(reopened.metrics().events,1);}finally{reopened.close();}
});
test('CLI persists receipt and retrieves it from a fresh process',t=>{
 const {path,store}=fixture(t);store.close();const cli=resolve(__dirname,'../cli.cjs');
 const first=spawnSync(process.execPath,[cli],{input:JSON.stringify(create()),encoding:'utf8',env:{...process.env,YOD_CORE_DB:path}});assert.equal(first.status,0,first.stderr);
 const second=spawnSync(process.execPath,[cli],{input:JSON.stringify({type:'get',workId:'work-1'}),encoding:'utf8',env:{...process.env,YOD_CORE_DB:path}});assert.equal(second.status,0,second.stderr);assert.equal(JSON.parse(second.stdout).result.state,'proposed');
});
test('CLI refuses operational database inside published repository',()=>{
 const cli=resolve(__dirname,'../cli.cjs');const run=spawnSync(process.execPath,[cli],{input:'{"type":"metrics"}',encoding:'utf8',env:{...process.env,YOD_CORE_DB:resolve(__dirname,'forbidden.sqlite')}});assert.equal(run.status,1);assert.equal(JSON.parse(run.stderr).error,'private_path_required');
});
test('read APIs detach data and require bounded pagination',t=>{
 const {store}=fixture(t);store.execute(create());const row=store.get('work-1');row.state='done';assert.equal(store.get('work-1').state,'proposed');assert.throws(()=>store.list({limit:10000}),{code:'invalid_page'});assert.equal(store.get('none'),null);
});

test('JSON cannot fabricate a verified closure without trusted adapter',t=>{
 const {store}=fixture(t,{verifyEvidence:null});store.execute(create());move(store,'work-1','assigned',{owner:'worker'});move(store,'work-1','running');move(store,'work-1','verifying',{evidence:{artifactRef:'synthetic:artifact',artifactRevision:'rev:1'}});
 const w=store.get('work-1');assert.throws(()=>move(store,'work-1','done',{actor:'reviewer',verification:{passed:true,verifiedBy:'reviewer',artifactRef:w.evidence.artifactRef,artifactRevision:w.evidence.artifactRevision,workRevision:w.revision,checkedAt:w.updatedAt,testRef:'made-up'}}),{code:'verification_adapter_required'});assert.equal(store.get('work-1').state,'verifying');
});
test('trusted adapter rejection leaves task, ledger and receipt unchanged',t=>{
 const {store}=fixture(t,{verifyEvidence:()=>false});store.execute(create());move(store,'work-1','assigned',{owner:'worker'});move(store,'work-1','running');move(store,'work-1','verifying',{evidence:{artifactRef:'synthetic:artifact',artifactRevision:'rev:1'}});
 const before=store.metrics();assert.throws(()=>move(store,'work-1','done',{actor:'reviewer'}),{code:'verification_not_confirmed'});assert.deepEqual(store.metrics(),before);
});

test('non-finite values, undefined and cyclic commands fail before any write',t=>{
 const {store}=fixture(t);for(const value of [NaN,Infinity,undefined,()=>{}])assert.throws(()=>store.execute({...create(),extra:value}),{code:'invalid_json_command'});
 const cyclic=create();cyclic.extra=cyclic;assert.throws(()=>store.execute(cyclic),{code:'invalid_json_command'});assert.equal(store.metrics().total,0);
});
test('CLI resolves directory symlinks before enforcing private storage',t=>{
 const {dir,store}=fixture(t);store.close();const alias=join(dir,'public-alias');require('node:fs').symlinkSync(resolve(__dirname,'..'),alias,'dir');
 const run=spawnSync(process.execPath,[resolve(__dirname,'../cli.cjs')],{input:'{"type":"metrics"}',encoding:'utf8',env:{...process.env,YOD_CORE_DB:join(alias,'forbidden.sqlite')}});assert.equal(run.status,1);assert.equal(JSON.parse(run.stderr).error,'private_path_required');
});
