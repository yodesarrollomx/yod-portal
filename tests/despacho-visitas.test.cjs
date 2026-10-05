'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const context={};vm.runInNewContext(fs.readFileSync('despacho-runtime/source/server/visitas.gs','utf8'),context);
const copy=v=>JSON.parse(JSON.stringify(v));
test('Portero visits link resolves canonical book and reauthenticates; setup needs current editor',()=>{
 let actor={actor_id:'actor:synthetic'},active='editor:synthetic',calls=0,captured;
 const config={case_id:'CASE-SYNTHETIC',operational_book:'BOOK-SYNTHETIC',editors:[active]};
 const link={YOD_DESPACHO_CONFIG:config,Sheets:{},LockService:{getScriptLock:()=>({})},Utilities:{getUuid:()=> 'RECEIPT-SYNTHETIC'},
  Session:{getActiveUser:()=>({getEmail:()=>active})},yodDespachoHash_:()=> 'digest',yodDespachoActor_:()=>{calls++;return actor;},
  createOfficeVisitsBackend:deps=>{captured=deps;return {readVisits:p=>({ok:true,payload:p}),setup:()=>({ok:true,created:true})};},console:{log:()=>{}}};
 vm.runInNewContext(fs.readFileSync('despacho-runtime/source/server/visitas-portero.gs','utf8'),link);
 const request={operation:'readVisits',payload:{case_id:config.case_id},actor_id:'spoofed',spreadsheet_id:'spoofed'};
 assert.equal(link.yodDespachoVisits_({operation:'setupVisits'}).error,'invalid_operation');assert.equal(calls,0);
 assert.equal(link.yodDespachoVisits_(request).ok,true);assert.equal(captured.serverContext,request);
 assert.deepEqual(copy(captured.resolveCanonicalWorkbook()),{case_id:config.case_id,spreadsheet_id:config.operational_book});
 assert.equal(captured.authorize(request).actor_id,actor.actor_id);assert.equal(calls,2);
 actor=null;assert.equal(captured.authorize(request).allowed,false);assert.equal(link.yodDespachoVisits_(request).error,'unauthorized');
 link.YOD_verificarLecturaVisitas();assert.equal(captured.authorize({}).allowed,true);link.YOD_prepararVisitas();assert.equal(captured.authorize({}).can_setup,true);
 active='another:synthetic';assert.equal(captured.authorize({}).allowed,false);assert.throws(()=>link.YOD_prepararVisitas(),/unauthorized/);assert.throws(()=>link.YOD_verificarLecturaVisitas(),/unauthorized/);
});
function fixture(){
 const db={spreadsheetId:'BOOK-SYNTHETIC',sheets:[{properties:{sheetId:1,title:'Business untouched',gridProperties:{rowCount:10,columnCount:3}},rows:[['original']]}]};
 const f={db,allowed:true,actor:'actor:test',canSetup:true,locked:false,batches:0,authCalls:0,fail:null,afterLock:null,beforeCommit:null};
 const Sheets={Spreadsheets:{get:(book,options)=>{
  assert.equal(book,db.spreadsheetId);
  if(!options.includeGridData)return {spreadsheetId:book,sheets:db.sheets.map(s=>({properties:copy(s.properties)}))};
  return {sheets:options.ranges.map(r=>{const title=r.split("'")[1],s=db.sheets.find(s=>s.properties.title===title);return {properties:{sheetId:s.properties.sheetId,title},data:[{startRow:0,startColumn:0,rowData:s.rows.map(row=>({values:row.map(v=>({userEnteredValue:typeof v==='string'?{stringValue:v}:v}))}))}]};})};
 },batchUpdate:({requests},book)=>{
  assert.equal(book,db.spreadsheetId);f.batches++;if(f.beforeCommit)f.beforeCommit();if(f.fail==='before'){f.fail=null;throw Error('transport');}
  const draft=copy(db.sheets);
  for(const r of requests){
   if(r.addSheet){assert.ok(!draft.some(s=>s.properties.title===r.addSheet.properties.title));draft.push({properties:copy(r.addSheet.properties),rows:[]});}
   else if(r.updateSheetProperties){const p=r.updateSheetProperties.properties;draft.find(s=>s.properties.sheetId===p.sheetId).properties.gridProperties.rowCount=p.gridProperties.rowCount;}
   else {const u=r.updateCells,s=draft.find(s=>s.properties.sheetId===u.start.sheetId);assert.ok(u.start.rowIndex<s.properties.gridProperties.rowCount);s.rows[u.start.rowIndex]=u.rows[0].values.map(c=>{assert.deepEqual(Object.keys(c.userEnteredValue),['stringValue']);return c.userEnteredValue.stringValue;});}
  }
  db.sheets=draft;if(f.fail==='after'){f.fail=null;throw Error('lost ACK');}return {};
 }}};
 let counter=0;
 f.backend=()=>context.createOfficeVisitsBackend({case_id:'CASE-SYNTHETIC',serverContext:{},Sheets,scriptLock:{tryLock:()=>{if(f.locked)return false;f.locked=true;f.afterLock?.();return true;},releaseLock:()=>{f.locked=false;}},
  now:()=>Date.parse('2026-10-05T00:00:00.000Z'),newId:()=> 'RECEIPT-'+(++counter),digest:text=>crypto.createHash('sha256').update(text).digest('hex'),
  authorize:()=>{f.authCalls++;if(f.revokeAt===f.authCalls)f.allowed=false;return {allowed:f.allowed,case_id:'CASE-SYNTHETIC',actor_id:f.actor,can_setup:f.canSetup};},resolveCanonicalWorkbook:()=>({case_id:'CASE-SYNTHETIC',spreadsheet_id:db.spreadsheetId})});
 f.request=(n=1)=>({case_id:'CASE-SYNTHETIC',request_id:'REQUEST-'+n,visit_id:'VISIT-'+n,expected_revision:n-1,space_id:'juntas',visitor_kind:'agent',reason_code:'agent_arrived',arrival_ref:'ARRIVAL-'+n});
 f.setup=()=>{assert.equal(f.backend().setup({case_id:'CASE-SYNTHETIC'}).ok,true);};return f;
}
test('read never initializes; explicit setup preserves every business row and is idempotent',()=>{
 const f=fixture();assert.equal(f.backend().readVisits({case_id:'CASE-SYNTHETIC'}).error,'schema_not_initialized');assert.equal(f.batches,0);
 f.canSetup=false;assert.equal(f.backend().setup({case_id:'CASE-SYNTHETIC'}).error,'unauthorized');assert.equal(f.batches,0);
 f.canSetup=true;f.setup();assert.deepEqual(f.db.sheets[0].rows,[['original']]);assert.equal(f.backend().setup({case_id:'CASE-SYNTHETIC'}).created,false);assert.equal(f.batches,1);
});
test('one atomic batch persists visit, receipt and revision; fresh adapter recovers original ID',()=>{
 const f=fixture();f.setup();const ack=copy(f.backend().recordVisit(f.request()));assert.equal(ack.scope,'server-persisted');assert.equal(f.batches,2);
 const read=copy(f.backend().readVisits({case_id:'CASE-SYNTHETIC'}));assert.equal(read.revision,1);assert.equal(read.total,1);assert.equal(read.visits[0].visit_id,'VISIT-1');assert.deepEqual(read.visits[0].receipt,ack);
 assert.equal(read.visits[0].actor_id,'actor:test');assert.deepEqual(f.db.sheets[0].rows,[['original']]);
});
test('lost ACK retries identical IDs/content after revision advances without another write',()=>{
 const f=fixture();f.setup();f.fail='after';assert.equal(f.backend().recordVisit(f.request()).error,'backend_unavailable');assert.equal(f.backend().readVisits({case_id:'CASE-SYNTHETIC'}).total,1);
 f.backend().recordVisit(f.request(2));const count=f.batches;const ack=f.backend().recordVisit(f.request());assert.equal(ack.revision,1);assert.equal(f.batches,count);assert.equal(f.backend().readVisits({case_id:'CASE-SYNTHETIC'}).total,2);
});
test('CAS, content/actor conflicts, spoofed identity and reused visit IDs do not write',()=>{
 const f=fixture();f.setup();f.backend().recordVisit(f.request());const before=f.batches;
 for(const [p,error] of [[{...f.request(2),expected_revision:0},'stale_revision'],[{...f.request(),space_id:'edicion'},'request_id_reused'],[{...f.request(2),visit_id:'VISIT-1'},'visit_id_reused'],[{...f.request(2),actor_id:'spoof'},'invalid_request'],[{...f.request(2),space_id:'drive'},'invalid_request']])assert.equal(f.backend().recordVisit(p).error,error);
 f.actor='another:test';assert.equal(f.backend().recordVisit(f.request()).error,'request_id_reused');assert.equal(f.batches,before);
});
test('revocation while waiting for lock and before transaction both fail closed',()=>{
 const f=fixture();f.setup();const before=f.batches;f.afterLock=()=>{f.allowed=false;};assert.equal(f.backend().recordVisit(f.request()).error,'unauthorized');assert.equal(f.batches,before);assert.equal(f.locked,false);
 f.allowed=true;f.afterLock=null;f.authCalls=0;f.revokeAt=3;assert.equal(f.backend().recordVisit(f.request()).error,'unauthorized');assert.equal(f.batches,before);assert.equal(f.locked,false);
});
test('failure before commit leaves no partial row; corrupted formulas or receipts never acknowledged',()=>{
 const f=fixture();f.setup();f.fail='before';assert.equal(f.backend().recordVisit(f.request()).error,'backend_unavailable');assert.equal(f.backend().readVisits({case_id:'CASE-SYNTHETIC'}).total,0);
 f.backend().recordVisit(f.request());const table=f.db.sheets.find(s=>s.properties.title==='YOD Office Visits');table.rows[1][12]='{}';assert.equal(f.backend().readVisits({case_id:'CASE-SYNTHETIC'}).error,'invalid_persistence');
 table.rows[1][12]={formulaValue:'=1'};assert.equal(f.backend().readVisits({case_id:'CASE-SYNTHETIC'}).error,'nonliteral_persistence');
});
test('client reopens without another mutation and reconciles a lost ACK via read',async()=>{
 const {Visitas}=await import('../despacho3d/visitas.mjs');const f=fixture();f.setup();const b=f.backend();let n=0,writes=0;
 const t={readVisits:async p=>copy(b.readVisits(p)),recordVisit:async p=>{writes++;const ack=copy(b.recordVisit(p));if(writes===1)throw Error('lost');return ack;}};
 const c=new Visitas({transport:t,uuid:()=> 'ID-'+(++n)});assert.equal(await c.open('CASE-SYNTHETIC'),true);assert.equal(await c.record({espacio:'juntas',quien:'agente'}),false);const pending=copy(c.pending);
 assert.equal(await c.refresh(),true);assert.equal(c.pending,null);assert.equal(c.snapshot.visits[0].request_id,pending.request_id);assert.equal(writes,1);
 c.close();const reopened=new Visitas({transport:t});assert.equal(await reopened.open('CASE-SYNTHETIC'),true);assert.equal(reopened.snapshot.total,1);assert.equal(writes,1);
});
test('client retries the immutable original request and discards late replies on profile removal',async()=>{
 const {Visitas}=await import('../despacho3d/visitas.mjs');const f=fixture();f.setup();const b=f.backend();let n=0,attempts=[];
 const c=new Visitas({transport:{readVisits:async p=>copy(b.readVisits(p)),recordVisit:async p=>{attempts.push(copy(p));if(attempts.length===1)throw Error('offline');return copy(b.recordVisit(p));}},uuid:()=> 'ID-'+(++n)});
 await c.open('CASE-SYNTHETIC');await c.record({espacio:'juntas',quien:'agente'});await c.retry();assert.deepEqual(attempts[0],attempts[1]);assert.equal(c.snapshot.total,1);
 let done;const d=new Visitas({transport:{readVisits:()=>new Promise(r=>done=r)}});const opening=d.open('CASE-SYNTHETIC');d.close();done(copy(b.readVisits({case_id:'CASE-SYNTHETIC'})));assert.equal(await opening,false);assert.equal(d.snapshot,null);
});
test('arrivals during a pending request keep their IDs and drain serially after reconciliation',async()=>{
 const {Visitas}=await import('../despacho3d/visitas.mjs');const f=fixture();f.setup();const b=f.backend();let n=0,release;
 const c=new Visitas({transport:{readVisits:async p=>copy(b.readVisits(p)),recordVisit:p=>new Promise(r=>{release=()=>r(copy(b.recordVisit(p)));})},uuid:()=> 'Q-'+(++n)});
 await c.open('CASE-SYNTHETIC');const first=c.record({espacio:'juntas',quien:'agente'});const firstPending=copy(c.pending);
 await c.record({espacio:'edicion',quien:'agente'});assert.equal(c.queue.length,1);const secondId=c.queue[0].visit_id;
 release();await first;assert.equal(c.pending.visit_id,secondId);assert.equal(c.pending.expected_revision,1);release();
 for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));assert.equal(c.snapshot.total,2);assert.equal(c.snapshot.visits[0].visit_id,firstPending.visit_id);assert.equal(c.snapshot.visits[1].visit_id,secondId);assert.equal(c.queue.length,0);
});
test('bridge visit lane remains separate and rejects forged targets and stale-session replies',async()=>{
 const listeners={},posts=[],source={postMessage:m=>posts.push(copy(m))};let epoch=1,finish,called=0;
 const root={location:{origin:'https://synthetic.test'},addEventListener:(e,f)=>listeners[e]=f,removeEventListener:()=>{}};
 vm.runInNewContext(fs.readFileSync('os/despacho-conversation.js','utf8'),{globalThis:root,setTimeout,clearTimeout});
 const bound=root.YodDespachoConversation.bind({isAuthorized:()=>true,getIframeWindow:()=>source,getEpoch:()=>epoch,getTransport:()=>({readVisits:p=>{called++;return new Promise(r=>finish=r);},resolveCurrent:async()=>({ok:true})})});
 const send=(method,payload,id='BRIDGE-1')=>listeners.message({origin:root.location.origin,source,data:{type:'yod:case:request',version:1,id,method,payload}});
 await send('readVisits',{case_id:'CASE-SYNTHETIC',spreadsheet_id:'spoof'});assert.equal(called,0);
 const reading=send('readVisits',{case_id:'CASE-SYNTHETIC'});await send('resolveCurrent',{},'CHAT-1');assert.equal(posts[0].id,'CHAT-1');epoch=2;finish({ok:true});await reading;assert.equal(posts.length,1);bound.dispose();
});
test('forged receipt and revoked response never establish saved history or retain pending case data',async()=>{
 const {Visitas}=await import('../despacho3d/visitas.mjs');const f=fixture();f.setup();const b=f.backend();let n=0;
 const c=new Visitas({transport:{readVisits:async p=>copy(b.readVisits(p)),recordVisit:async()=>({ok:true,scope:'server-persisted'})},uuid:()=> 'F-'+(++n)});
 await c.open('CASE-SYNTHETIC');assert.equal(await c.record({espacio:'juntas',quien:'agente'}),false);assert.equal(c.status,'unconfirmed');assert.ok(c.pending);
 c.transport.readVisits=async()=>({ok:false,error:'unauthorized'});await c.refresh();assert.equal(c.pending,null);assert.equal(c.snapshot,null);assert.equal(c.caseId,null);assert.equal(c.queue.length,0);
});
test('explicit CAS recovery uses a new request after reading and preserves the visit and arrival IDs',async()=>{
 const {Visitas}=await import('../despacho3d/visitas.mjs');const f=fixture();f.setup();const b=f.backend();let n=0;
 const c=new Visitas({transport:{readVisits:async p=>copy(b.readVisits(p)),recordVisit:async p=>copy(b.recordVisit(p))},uuid:()=> 'CAS-'+(++n)});
 await c.open('CASE-SYNTHETIC');b.recordVisit(f.request());assert.equal(await c.record({espacio:'edicion',quien:'agente'}),false);const original=copy(c.pending);assert.equal(c.error,'stale_revision');
 assert.equal(await c.resolveConflict(),true);const saved=c.snapshot.visits[1];assert.equal(saved.visit_id,original.visit_id);assert.equal(saved.arrival_ref,original.arrival_ref);assert.notEqual(saved.request_id,original.request_id);assert.equal(c.snapshot.total,2);
});
