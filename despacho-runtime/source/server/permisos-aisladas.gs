// Editor-only runtime proof. Synthetic identities; no network, Sheets or credentials.
function YOD_verificarPermisosAislados() {
  var editor=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(YOD_DESPACHO_CONFIG.editors.indexOf(editor)<0)throw Error('unauthorized');
  var results=[],specs=[['permitido',1,true],['denegado',0,false],['ajeno',0,false],['revocado',1,false],['actor',1,false],['nivel',0,false]];
  specs.forEach(function(spec){
    var actor='ACTOR-SINTETICO',allowed=true,count=0;
    var backend=createOfficePermissions({case_id:'CASO-SINTETICO',serverContext:{},now:function(){return Date.UTC(2026,9,4);},
      authenticate:function(){return {allowed:allowed,actor_id:actor,case_id:'CASO-SINTETICO'};}});
    var p={case_id:spec[0]==='ajeno'?'CASO-AJENO':'CASO-SINTETICO',space_id:spec[0]==='denegado'?'comunicacion':'juntas',operation:spec[0]==='denegado'?'sendDraft':'readPending'};
    if(spec[0]==='nivel')p.level='accion';
    var r=backend.executeRead(p,function(){count++;if(spec[0]==='revocado')allowed=false;if(spec[0]==='actor')actor='OTRO-ACTOR';return {ok:true,items:['ENTREGA-SINTETICA']};});
    if(count!==spec[1] || r.ok!==spec[2] || (!r.ok && r.items))throw Error('synthetic_proof_failed');
    results.push({scenario:spec[0],ok:r.ok,error:r.error||null,reads:count,delivered:r.ok?1:0});
  });
  var current=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(current!==editor || YOD_DESPACHO_CONFIG.editors.indexOf(current)<0)throw Error('unauthorized');
  var result={ok:true,policy_version:'office-observe-v1',scope:'synthetic-memory-only',checks:results.length,results:results};
  console.log(JSON.stringify(result));return result;
}
