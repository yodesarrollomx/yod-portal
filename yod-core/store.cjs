'use strict';
// Local/server-side ledger, NOT an HTTP authorization boundary or a business adapter.
const {DatabaseSync}=require('node:sqlite');
const {createHash}=require('node:crypto');
const {dirname,resolve}=require('node:path');
const {mkdirSync,chmodSync}=require('node:fs');
const domain=require('../os/yod-core-domain.cjs');
const {assert,text,stamp}=domain;
function stable(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
}
function requireJson(value,depth=0){
  assert(depth<=32,'invalid_json_command');
  if(value===null||typeof value==='string'||typeof value==='boolean')return;
  if(typeof value==='number'){assert(Number.isFinite(value),'invalid_json_command');return;}
  assert(value&&typeof value==='object'&&(Array.isArray(value)||Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null),'invalid_json_command');
  for(const item of Object.values(value))requireJson(item,depth+1);
}
function openStore(filename,{now=()=>new Date().toISOString(),verifyEvidence=null,verifyReconciliation=null}={}){
  assert(typeof filename==='string'&&filename!==':memory:'&&filename.trim(),'durable_path_required');
  filename=resolve(filename);mkdirSync(dirname(filename),{recursive:true,mode:0o700});
  const db=new DatabaseSync(filename);chmodSync(filename,0o600);
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;`);
  const version=db.prepare('PRAGMA user_version').get().user_version;if(version!==0&&version!==1){db.close();assert(false,'schema_mismatch');}
  db.exec(`BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS works(id TEXT PRIMARY KEY,identity_key TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL,owner TEXT,data TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_work ON works(identity_key) WHERE state NOT IN ('done','cancelled');
    CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,work_id TEXT NOT NULL REFERENCES works(id),revision INTEGER NOT NULL,data TEXT NOT NULL,UNIQUE(work_id,revision));
    CREATE TABLE IF NOT EXISTS receipts(request_id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,data TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'append_only_events'); END;
    CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'append_only_events'); END;
    CREATE TRIGGER IF NOT EXISTS receipts_no_update BEFORE UPDATE ON receipts BEGIN SELECT RAISE(ABORT,'immutable_receipt'); END;
    CREATE TRIGGER IF NOT EXISTS receipts_no_delete BEFORE DELETE ON receipts BEGIN SELECT RAISE(ABORT,'immutable_receipt'); END;
    PRAGMA user_version=1; COMMIT;`);
  let closed=false;
  function alive(){assert(!closed,'store_closed');}
  function get(id){alive();const row=db.prepare('SELECT data FROM works WHERE id=?').get(text(id,'invalid_id',256));return row?JSON.parse(row.data):null;}
  function dependencyGate(work){for(const id of work.dependencies){const dep=get(id);assert(dep,'dependency_not_found');assert(dep.state==='done','dependencies_incomplete');}}
  function execute(command){
    alive();assert(command&&typeof command==='object'&&!Array.isArray(command),'invalid_command');
    assert(['create','transition','checkpoint'].includes(command.type),'invalid_command');
    // Reject non-JSON values before fingerprinting (undefined/functions/NaN are ambiguous).
    requireJson(command);const serialized=JSON.stringify(command);assert(serialized&&serialized.length<=65536,'command_too_large');
    assert(stable(JSON.parse(serialized))===stable(command),'invalid_json_command');
    const clean=JSON.parse(serialized),requestId=text(clean.requestId,'missing_request_id',256);
    const fingerprint=createHash('sha256').update(stable(clean)).digest('hex');
    db.exec('BEGIN IMMEDIATE');
    try{
      const previous=db.prepare('SELECT fingerprint,data FROM receipts WHERE request_id=?').get(requestId);
      if(previous){assert(previous.fingerprint===fingerprint,'request_id_reused');db.exec('COMMIT');return {...JSON.parse(previous.data),replayed:true};}
      const at=stamp(now());let before=null,work;
      if(clean.type==='create'){
        assert(clean.work&&typeof clean.work==='object','missing_field');
        work=domain.createWork({...clean.work,actor:clean.actor,at});assert(!get(work.id),'work_id_exists');
        for(const id of work.dependencies)assert(get(id),'dependency_not_found');
        const duplicate=db.prepare("SELECT id FROM works WHERE identity_key=? AND state NOT IN ('done','cancelled')").get(domain.canonicalKey(work));assert(!duplicate,'duplicate_active_work');
        db.prepare('INSERT INTO works VALUES(?,?,?,?,?,?)').run(work.id,domain.canonicalKey(work),work.state,work.revision,work.owner,JSON.stringify(work));
      }else{
        before=get(clean.workId);assert(before,'work_not_found');
        // Only an injected trusted adapter may attest independent external evidence.
        // JSON passed:true and an invented receipt reference cannot open these gates.
        if(clean.type==='transition'&&clean.to==='done'){
          assert(typeof verifyEvidence==='function','verification_adapter_required');
          assert(verifyEvidence({work:structuredClone(before),command:structuredClone(clean)})===true,'verification_not_confirmed');
        }
        if(clean.type==='transition'&&before.uncertainty){
          assert(typeof verifyReconciliation==='function','reconciliation_adapter_required');
          assert(verifyReconciliation({work:structuredClone(before),command:structuredClone(clean)})===true,'reconciliation_not_confirmed');
        }
        if(clean.type==='transition'&&['assigned','running','done'].includes(clean.to))dependencyGate(before);
        // Persisted identity and audit time cannot be supplied by the caller's payload.
        work=domain[clean.type](before,{...clean,at});
        const changed=db.prepare('UPDATE works SET state=?,revision=?,owner=?,data=? WHERE id=? AND revision=?').run(work.state,work.revision,work.owner,JSON.stringify(work),work.id,before.revision);
        assert(changed.changes===1,'revision_conflict');
      }
      const event=work.events.at(-1);
      db.prepare('INSERT INTO events(work_id,revision,data) VALUES(?,?,?)').run(work.id,work.revision,JSON.stringify({...event,requestId}));
      const receipt={schema:1,requestId,workId:work.id,revision:work.revision,state:work.state,at,replayed:false};
      db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(requestId,fingerprint,JSON.stringify(receipt));
      db.exec('COMMIT');return receipt;
    }catch(error){try{db.exec('ROLLBACK');}catch{}throw error;}
  }
  function list({limit=100,offset=0}={}){alive();assert(Number.isInteger(limit)&&limit>=1&&limit<=500&&Number.isInteger(offset)&&offset>=0,'invalid_page');return db.prepare('SELECT data FROM works ORDER BY rowid LIMIT ? OFFSET ?').all(limit,offset).map(r=>JSON.parse(r.data));}
  function events(id){alive();return db.prepare('SELECT data FROM events WHERE work_id=? ORDER BY revision').all(text(id,'invalid_id',256)).map(r=>JSON.parse(r.data));}
  function receipt(id){alive();const row=db.prepare('SELECT data FROM receipts WHERE request_id=?').get(text(id,'missing_request_id',256));return row?JSON.parse(row.data):null;}
  function metrics(){alive();const byState=Object.fromEntries(domain.STATES.map(s=>[s,0]));for(const row of db.prepare('SELECT state,COUNT(*) n FROM works GROUP BY state').all())byState[row.state]=row.n;return {schema:1,byState,total:Object.values(byState).reduce((a,b)=>a+b,0),events:db.prepare('SELECT COUNT(*) n FROM events').get().n,receipts:db.prepare('SELECT COUNT(*) n FROM receipts').get().n};}
  function close(){if(!closed){db.close();closed=true;}}
  return Object.freeze({execute,get,list,events,receipt,metrics,close});
}
module.exports={openStore};
