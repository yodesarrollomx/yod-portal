/** Office visits v1. No live identifiers or credentials. Requires verified server dependencies.
 * read never creates storage. setup is explicit. All cells are literal strings.
 * Arrival is reported by the authorized client; this is not proof of tool execution.
 */
function createOfficeVisitsBackend(deps) {
  'use strict';
  var titles = ['YOD Office Visits', 'YOD Office State'];
  var columns = [
    ['visit_id','case_id','request_id','actor_id','space_id','visitor_kind','reason_code','arrival_ref','created_at','revision','request_digest','receipt_id','ack_json'],
    ['case_id','revision','updated_at']
  ];
  var spaces = ['juntas','biblioteca','edicion']; // Only physically implemented spaces.
  var max = 10000;
  function fail(code) { var e = Error(code); e.officeVisit = true; throw e; }
  function exact(v, keys) { return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).sort().join('|') === keys.slice().sort().join('|'); }
  function id(v) { return typeof v === 'string' && /^[A-Za-z0-9_.:@-]{1,256}$/.test(v); }
  function date(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)); }
  function canonical(v) { if(v && typeof v === 'object') return '{'+Object.keys(v).sort().map(function(k){return JSON.stringify(k)+':'+JSON.stringify(v[k]);}).join(',')+'}'; return JSON.stringify(v); }
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  if (!deps || !id(deps.case_id) || ['authorize','resolveCanonicalWorkbook','now','newId','digest'].some(function(k){return typeof deps[k] !== 'function';}) ||
      !deps.Sheets || !deps.Sheets.Spreadsheets || !deps.scriptLock || typeof deps.scriptLock.tryLock !== 'function' || typeof deps.scriptLock.releaseLock !== 'function') throw Error('missing_server_dependencies');
  function auth(action) {
    var a = deps.authorize(deps.serverContext,{case_id:deps.case_id,action:action});
    if (!a || a.allowed !== true || a.case_id !== deps.case_id || !id(a.actor_id)) fail('unauthorized');
    return a;
  }
  function scope(request, action, fn) {
    var locked = false;
    try {
      if (!request || request.case_id !== deps.case_id) fail('case_mismatch');
      var a = auth(action);
      if (deps.scriptLock.tryLock(5000) !== true) fail('lock_busy');
      locked = true;
      var fresh = auth(action); // No cached authorization after acquiring the lock.
      if (fresh.actor_id !== a.actor_id) fail('unauthorized');
      var target = deps.resolveCanonicalWorkbook(deps.serverContext,{case_id:deps.case_id,actor:fresh,action:action});
      if (!target || target.case_id !== deps.case_id || !id(target.spreadsheet_id)) fail('canonical_workbook_unavailable');
      return fn(target.spreadsheet_id,fresh);
    } catch(e) { return {ok:false,error:e && e.officeVisit === true ? e.message : 'backend_unavailable'}; }
    finally { if(locked) deps.scriptLock.releaseLock(); }
  }
  function literal(row) {
    return row.map(function(text){if(typeof text !== 'string' || text.length > 4096) fail('invalid_persistence'); return {userEnteredValue:{stringValue:text}};});
  }
  function cells(sheetId, rowIndex, row) { return {updateCells:{start:{sheetId:sheetId,rowIndex:rowIndex,columnIndex:0},rows:[{values:literal(row)}],fields:'userEnteredValue'}}; }
  function load(book, missing) {
    var metadata = deps.Sheets.Spreadsheets.get(book,{fields:'spreadsheetId,sheets(properties(sheetId,title,gridProperties))',includeGridData:false});
    if (!metadata || metadata.spreadsheetId !== book || !Array.isArray(metadata.sheets)) fail('invalid_persistence');
    var tables = titles.map(function(title,index){
      var found = metadata.sheets.filter(function(s){return s.properties.title === title;});
      if(found.length > 1) fail('invalid_persistence');
      if(!found.length) { if(!missing) fail('schema_not_initialized'); return null; }
      var p = found[0].properties;
      if(!Number.isSafeInteger(p.sheetId) || !Number.isSafeInteger(p.gridProperties && p.gridProperties.rowCount) || p.gridProperties.columnCount < columns[index].length) fail('invalid_persistence');
      return {id:p.sheetId,capacity:p.gridProperties.rowCount,rows:[]};
    });
    var present = tables.map(function(t,i){return t ? i : -1;}).filter(function(i){return i >= 0;});
    if(present.length) {
      var grid = deps.Sheets.Spreadsheets.get(book,{ranges:present.map(function(i){return "'"+titles[i]+"'!A1:"+(i === 0 ? 'M' : 'C')+Math.min(tables[i].capacity,max+2);}),includeGridData:true,
        fields:'sheets(properties(sheetId,title),data(startRow,startColumn,rowData(values(userEnteredValue))))'});
      if(!grid || !Array.isArray(grid.sheets) || grid.sheets.length !== present.length) fail('invalid_persistence');
      grid.sheets.forEach(function(s){
        var i = titles.indexOf(s.properties.title), t = tables[i], rows = [];
        if(!t || t.id !== s.properties.sheetId || !Array.isArray(s.data)) fail('invalid_persistence');
        s.data.forEach(function(part){
          if(part.startColumn) fail('invalid_persistence');
          (part.rowData || []).forEach(function(row, offset){
            var at = (part.startRow || 0)+offset;
            if(rows[at]) fail('invalid_persistence');
            rows[at] = (row.values || []).map(function(cell){var v = cell.userEnteredValue;
              if(!v) return ''; if(!exact(v,['stringValue']) || typeof v.stringValue !== 'string') fail('nonliteral_persistence'); return v.stringValue;});
          });
        });
        while(rows.length && (!rows[rows.length-1] || rows[rows.length-1].every(function(v){return v === '';}))) rows.pop();
        if(!rows[0] || JSON.stringify(rows[0]) !== JSON.stringify(columns[i]) || rows.length > max+1) fail('invalid_persistence');
        t.rows = rows.slice(1).map(function(row){
          if(!row || row.length !== columns[i].length || row.some(function(v){return typeof v !== 'string' || v.length > 4096;})) fail('invalid_persistence');
          var v={}; columns[i].forEach(function(k,j){v[k]=row[j];}); if(v.case_id !== deps.case_id) fail('invalid_persistence'); return v;
        });
      });
    }
    return {tables:tables,metadata:metadata.sheets};
  }
  function state(data) {
    var visits = data.tables[0].rows, rows = data.tables[1].rows;
    if(rows.length !== 1 || !/^(0|[1-9]\d*)$/.test(rows[0].revision) || Number(rows[0].revision) !== visits.length || !date(rows[0].updated_at)) fail('invalid_persistence');
    var requests = Object.create(null), ids = Object.create(null), receipts = Object.create(null);
    visits.forEach(function(v,index){
      if(!id(v.visit_id) || !id(v.request_id) || !id(v.actor_id) || !id(v.receipt_id) || !id(v.arrival_ref) ||
          requests[v.request_id] || ids[v.visit_id] || receipts[v.receipt_id] || Number(v.revision) !== index+1 ||
          v.revision !== String(index+1) || spaces.indexOf(v.space_id) < 0 || !date(v.created_at) ||
          !/^[a-f0-9]{64}$/.test(v.request_digest) || !validKind(v)) fail('invalid_persistence');
      requests[v.request_id]=true; ids[v.visit_id]=true; receipts[v.receipt_id]=true;
      var a; try{a=JSON.parse(v.ack_json);}catch(_){fail('invalid_persistence');}
      if(JSON.stringify(a) !== JSON.stringify(ack(v))) fail('invalid_persistence');
    });
    return rows[0];
  }
  function validKind(v) { return v.visitor_kind === 'agent' && v.reason_code === 'agent_arrived' || v.visitor_kind === 'direction' && v.reason_code === 'visitor_opened'; }
  function ack(v) { return {ok:true,schema:1,case_id:v.case_id,request_id:v.request_id,visit_id:v.visit_id,receipt_id:v.receipt_id,
    revision:Number(v.revision),created_at:v.created_at,scope:'server-persisted',arrival_evidence:'client_report'}; }
  function valid(request, write) {
    var keys = write ? ['case_id','request_id','visit_id','expected_revision','space_id','visitor_kind','reason_code','arrival_ref'] : ['case_id'];
    if(!exact(request,keys) || !id(request.case_id)) fail('invalid_request');
    if(write && (!id(request.request_id) || !id(request.visit_id) || !id(request.arrival_ref) || !Number.isSafeInteger(request.expected_revision) ||
      request.expected_revision < 0 || request.expected_revision >= max || spaces.indexOf(request.space_id) < 0 || !validKind(request))) fail('invalid_request');
  }
  function readVisits(request) { return scope(request,'readVisits',function(book){
    valid(request,false); var data=load(book,false), current=state(data), rows=data.tables[0].rows;
    return {ok:true,schema:1,case_id:deps.case_id,revision:Number(current.revision),updated_at:current.updated_at,total:rows.length,has_more:rows.length>200,
      visits:rows.slice(-200).map(function(v){return {visit_id:v.visit_id,case_id:v.case_id,request_id:v.request_id,actor_id:v.actor_id,
        space_id:v.space_id,visitor_kind:v.visitor_kind,reason_code:v.reason_code,arrival_ref:v.arrival_ref,created_at:v.created_at,
        revision:Number(v.revision),receipt:ack(v)};})};
  }); }
  function recordVisit(request) { return scope(request,'recordVisit',function(book,a){
    valid(request,true); var data=load(book,false), current=state(data), rows=data.tables[0].rows;
    var digest=deps.digest(canonical(request)); if(!/^[a-f0-9]{64}$/.test(digest)) fail('invalid_server_digest');
    var duplicate=rows.filter(function(v){return v.request_id === request.request_id;})[0];
    if(duplicate) { if(duplicate.actor_id !== a.actor_id || duplicate.request_digest !== digest) fail('request_id_reused'); return ack(duplicate); }
    if(rows.some(function(v){return v.visit_id === request.visit_id;})) fail('visit_id_reused');
    if(Number(current.revision) !== request.expected_revision) fail('stale_revision');
    if(rows.length >= max) fail('storage_capacity');
    var at=deps.now(); if(!Number.isSafeInteger(at) || at < Date.parse(current.updated_at)) fail('invalid_server_clock');
    var receipt=deps.newId(); if(!id(receipt) || rows.some(function(v){return v.receipt_id === receipt;})) fail('invalid_server_id');
    var row={visit_id:request.visit_id,case_id:deps.case_id,request_id:request.request_id,actor_id:a.actor_id,space_id:request.space_id,
      visitor_kind:request.visitor_kind,reason_code:request.reason_code,arrival_ref:request.arrival_ref,created_at:new Date(at).toISOString(),
      revision:String(rows.length+1),request_digest:digest,receipt_id:receipt}; row.ack_json=JSON.stringify(ack(row));
    var requests=[], t=data.tables[0], index=rows.length+1;
    if(index >= t.capacity) requests.push({updateSheetProperties:{properties:{sheetId:t.id,gridProperties:{rowCount:Math.min(max+1,Math.max(index+1,t.capacity+1000))}},fields:'gridProperties.rowCount'}});
    requests.push(cells(t.id,index,columns[0].map(function(k){return row[k];})));
    requests.push(cells(data.tables[1].id,1,[deps.case_id,row.revision,row.created_at]));
    // Recheck immediately before the one atomic transaction, after all reads.
    if(auth('recordVisit').actor_id !== a.actor_id) fail('unauthorized');
    deps.Sheets.Spreadsheets.batchUpdate({requests:requests},book);
    return ack(row);
  }); }
  function setup(request) { return scope(request,'setupVisits',function(book,a){
    valid(request,false); if(a.can_setup !== true) fail('unauthorized');
    var data=load(book,true);
    if(data.tables.some(Boolean)) { if(!data.tables.every(Boolean)) fail('invalid_persistence'); state(data); return {ok:true,created:false}; }
    var next=data.metadata.reduce(function(n,s){return Math.max(n,s.properties.sheetId);},0)+1, requests=[];
    var at=deps.now(); if(!Number.isSafeInteger(at) || at<0) fail('invalid_server_clock');
    titles.forEach(function(title,i){var sheetId=next+i;requests.push({addSheet:{properties:{sheetId:sheetId,title:title,gridProperties:{rowCount:1000,columnCount:columns[i].length}}}}); requests.push(cells(sheetId,0,columns[i]));
      if(i===1) requests.push(cells(sheetId,1,[deps.case_id,'0',new Date(at).toISOString()]));});
    var fresh=auth('setupVisits'); if(fresh.actor_id !== a.actor_id || fresh.can_setup !== true) fail('unauthorized');
    deps.Sheets.Spreadsheets.batchUpdate({requests:requests},book); return {ok:true,created:true};
  }); }
  return Object.freeze({readVisits:readVisits,recordVisit:recordVisit,setup:setup});
}
