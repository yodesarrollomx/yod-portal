/* Same policy in Apps Script and the synthetic proof page. No credentials or storage.
 * Only server authentication grants scope. A returned matrix is informational.
 */
function createOfficePermissions(deps) {
  'use strict';
  var rooms = ['juntas','comunicacion','biblioteca','navegacion','drive','edicion','direccion','usos','museo'];
  var built = ['juntas','biblioteca','edicion'], version = 'office-observe-v1';
  var rules = {
    readVisits:{spaces:['oficina'],level:'observar'},
    recordVisit:{spaces:built,level:'observar'},
    readPending:{spaces:['juntas'],level:'observar'},
    createDraft:{spaces:['comunicacion','drive','edicion'],level:'borrador'},
    sendDraft:{spaces:['comunicacion'],level:'accion'},
    approveDelivery:{spaces:['juntas'],level:'accion'}
  };
  function id(v){return typeof v==='string' && /^[A-Za-z0-9_.:@-]{1,256}$/.test(v);}
  function exact(v,keys){return !!v && typeof v==='object' && !Array.isArray(v) && Object.keys(v).sort().join('|')===keys.slice().sort().join('|');}
  function denied(error){return {ok:false,error:error};}
  if(!deps || !id(deps.case_id) || typeof deps.authenticate!=='function' || typeof deps.now!=='function')throw Error('missing_server_dependencies');
  function auth(){
    var a=deps.authenticate(deps.serverContext);
    return a && a.allowed===true && a.case_id===deps.case_id && id(a.actor_id) ? a : null;
  }
  function decide(request,a){
    if(!a)return denied('unauthorized');
    if(!exact(request,['case_id','space_id','operation']) || !id(request.case_id))return denied('invalid_request');
    if(request.case_id!==deps.case_id)return denied('case_mismatch');
    if(!Object.prototype.hasOwnProperty.call(rules,request.operation))return denied('permission_denied');
    var r=rules[request.operation];
    // No draft or action grant exists in this version, even for an OS administrator.
    if(r.level!=='observar' || r.spaces.indexOf(request.space_id)<0)return denied('permission_denied');
    return {ok:true,case_id:deps.case_id,space_id:request.space_id,operation:request.operation,
      level:'observar',policy_version:version,actor_id:a.actor_id};
  }
  function authorize(request){try{return decide(request,auth());}catch(_){return denied('backend_unavailable');}}
  function inspect(request){
    try{
      var a=auth();if(!a)return denied('unauthorized');
      if(!exact(request,['case_id']))return denied('invalid_request');
      if(request.case_id!==deps.case_id)return denied('case_mismatch');
      var result={ok:true,schema:1,case_id:deps.case_id,policy_version:version,issued_at:new Date(deps.now()).toISOString(),
        scope:'informational',office_operations:['readVisits'],spaces:rooms.map(function(s){var connected=built.indexOf(s)>=0;
          return {space_id:s,connected:connected,level:connected?'observar':null,
            operations:connected ? (s==='juntas'?['recordVisit','readPending']:['recordVisit']) : []};})};
      var fresh=auth();if(!fresh || fresh.actor_id!==a.actor_id)return denied('unauthorized');
      return result;
    }catch(_){return denied('backend_unavailable');}
  }
  function executeRead(request,read){
    try{
      var first=authorize(request);if(!first.ok)return first;
      if(['readVisits','readPending'].indexOf(request.operation)<0 || typeof read!=='function')return denied('invalid_operation');
      var result=read(first);
      var last=authorize(request);if(!last.ok)return last;
      if(last.actor_id!==first.actor_id)return denied('unauthorized');
      return result;
    }catch(_){return denied('backend_unavailable');}
  }
  return Object.freeze({authorize:authorize,inspect:inspect,executeRead:executeRead});
}
