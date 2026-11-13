// Read-only projection of validated case goals. It assigns no priority or business approval.
export const PROFILE_WORK_LANES=Object.freeze([['now','Ahora'],['blocked','Bloqueado'],['review','Para revisar']]);
const terminal=new Set(['completed','stopped']);
const states=new Set(['queued','running','ready_for_review','awaiting_data','stopped','completed']);
const time=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
export function nextRecordedTask(goal){
 return [...(goal.tasks||[])].sort((a,b)=>Number(a.id?.slice(5))-Number(b.id?.slice(5))).find(task=>task.status!=='ready_for_review')||null;
}
export function classifyProfileWork(goals=[],caseId){
 const groups={now:[],blocked:[],review:[],history:[]};
 if(typeof caseId!=='string'||!caseId)return groups;
 const same=goals.filter(goal=>goal?.case_id===caseId&&states.has(goal.status))
  .sort((a,b)=>time(b.updated_at)-time(a.updated_at)||String(a.goal_id).localeCompare(String(b.goal_id)));
 for(const goal of same){
  const lane=terminal.has(goal.status)?'history':goal.status==='ready_for_review'?'review':
   goal.status==='awaiting_data'||nextRecordedTask(goal)?.status==='blocked'?'blocked':'now';
  groups[lane].push(goal);
 }
 return groups;
}
export function profileWorkView(state={},caseId,enabled=true){
 const model=enabled&&state.model,groups=classifyProfileWork(model?.goals||[],caseId);
 const phase=!enabled?'unavailable':state.status==='writing'||state.pending?'unconfirmed':
  state.status==='loading'?'loading':['unavailable','conflict'].includes(state.status)?'unavailable':model?'ready':'loading';
 const historical=!!model&&['loading','unavailable'].includes(phase);
 const selected=groups.review[0]||groups.blocked[0]||groups.now[0]||null;
 return {phase,historical,groups,selected,
  active:groups.now.length+groups.blocked.length+groups.review.length,
  confirmedEmpty:phase==='ready'&&!!model&&!groups.now.length&&!groups.blocked.length&&!groups.review.length,
  notice:state.notice||(!model?'Consultando los encargos de este autón…':historical?'Último registro; recupera la lectura antes de decidir.':'')};
}
