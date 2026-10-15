import {createLoadCoordinator} from './load-coordinator.mjs?v=v2p2';

const READS=new Set(['listAuthorized','resolveCurrent','read','readGoals','readVisits','readOfficePermissions','readOfficePending']);
export function createPortalLoadPlan({createCoordinator=createLoadCoordinator}={}) {
  let epoch=null,caseId='',generation=0,serial=0;
  const core=createCoordinator({context:{sessionEpoch:'boot',caseId:'',selectionGeneration:0}});
  const home=new Map(),cases=new Set();
  const context=()=>({sessionEpoch:epoch,caseId,selectionGeneration:generation});
  function setSession(value) {
    const next=String(value);
    if(epoch===next)return;
    epoch=next;caseId='';generation++;home.clear();core.setContext(context());
  }
  function select(id) {
    if(epoch===null)return;
    // Every explicit intent gets a generation, including A→B→A.
    caseId=id;generation++;core.setContext(context());
    for(const entry of cases){
      if(entry.selectedAt!==null)entry.handle.cancel();
      else if(entry.caseId===id)entry.handle.promote(1);
    }
  }
  async function execute(spec,run,isCurrent) {
    const handle=core.submit({...spec,taskId:`load-${++serial}`,revision:'v2p3',
      run:()=>{if(!isCurrent())throw Error('session_changed');return run();}});
    if(spec.homeKey)home.set(spec.homeKey,handle);
    const entry=spec.caseId?{handle,caseId:spec.caseId,selectedAt:spec.selectedAt}:null;
    if(entry)cases.add(entry);
    const outcome=await handle.promise;
    if(entry)cases.delete(entry);
    if(spec.homeKey&&home.get(spec.homeKey)===handle)home.delete(spec.homeKey);
    if(!isCurrent()||!handle.status().current||outcome.state==='cancelled'||(entry&&entry.selectedAt!==null&&entry.selectedAt!==generation))throw Error('session_changed');
    if(outcome.state!=='succeeded')throw Error(outcome.reason==='deadline_exceeded'?'timeout':'unavailable');
    return outcome.value;
  }
  return Object.freeze({
    setSession,select,
    clearSelection(){select('');},
    revoke(){epoch=null;caseId='';generation++;home.clear();core.revoke();},
    readPortal(key,run,isCurrent,priority=1,origin='portal') {
      return execute({resourceKey:`portal:${key}`,scopeType:'session',priority,origin,lane:key,
        timeoutMs:60000,homeKey:priority>=2?key:null},run,isCurrent);
    },
    prioritizeHome(){for(const h of home.values())h.promote(1);},
    readCase(method,payload,lane,run,isCurrent) {
      // Mint/session issuance and all writes stay on their established path.
      if(!READS.has(method))return run();
      const selected=!!caseId&&payload.case_id===caseId;
      const foreground=['listAuthorized','resolveCurrent','readOfficePending'].includes(method)||selected;
      return execute({resourceKey:`case:${method}:${JSON.stringify(payload)}`,scopeType:'session',caseId:payload.case_id,selectedAt:selected?generation:null,
        priority:foreground?1:3,origin:'portero',lane,timeoutMs:50000},run,isCurrent);
    },
    snapshot:()=>core.snapshot(),
  });
}
