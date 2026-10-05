import {validateSelection} from './conversation.mjs';
import {validateGoal,validateGoals,GOAL_SCOPE} from './goals.mjs';
const definitive=new Set(['stale_revision','goal_busy','case_busy','request_id_reused','invalid_state','invalid_transition','goals_not_ready','schema_not_initialized','invalid_request','goal_not_found','unauthorized','session_changed','action_cancelled']);
const names=new Set(['pendientes_consultar','objetivo_crear','objetivo_reanudar','objetivo_detener']);
export function summarizeGoals(model){
 const sorted=[...model.goals].sort((a,b)=>Number(a.status==='completed')-Number(b.status==='completed')||b.sequence-a.sequence);
 return {ok:true,source_revision:model.source_revision,total:model.goals.length,goals:sorted.slice(0,12).map(g=>({goal_id:g.goal_id,title:g.title,status:g.status,summary:g.summary.slice(0,1200),tasks:g.tasks.map(t=>({id:t.id,title:t.title,status:t.status})),updated_at:g.updated_at}))};
}
// The cloud owns durable intents; the authenticated OS owns every canonical write.
// Retries use the already prepared payload and never mint a new request ID.
export function createVoiceActionExecutor({transport,onChange=()=>{},now=Date.now}){
 const flights=new Map(),attempts=new Map(),done=new Set();
 let queue=Promise.resolve();
 const checked=raw=>{if(raw?.ok===false)throw Error(raw.error||'unavailable');return raw;};
 function validAction(a,caseId){
  if(!a||a.case_id!==caseId||typeof a.request_id!=='string'||!/^voice-action-[a-f0-9]{48}$/.test(a.request_id)||!names.has(a.name)||!a.args||typeof a.args!=='object'||!['pending','prepared'].includes(a.state))throw Error('invalid_request');
 }
 async function execute(a,ctx){
  validAction(a,ctx.caseId);
  const fresh=validateSelection(checked(await transport.resolveCurrent({})));
  if(fresh.case_id!==ctx.caseId)throw Error('action_cancelled');
  if(!ctx.active())return;
  if(a.name!=='pendientes_consultar'&&(!fresh.can_enqueue||!fresh.goals?.ready))throw Error(fresh.can_enqueue?'goals_not_ready':'unauthorized');
  let payload=a.prepared,method=a.name==='objetivo_crear'?'createGoal':'reviewGoal';
  if(a.name==='pendientes_consultar'){
   const model=validateGoals(checked(await transport.readGoals({case_id:ctx.caseId})),ctx.caseId);
   await ctx.post('/voice/action-result',{request_id:a.request_id,result:summarizeGoals(model)});
   return;
  }
  if(!payload){
   const model=validateGoals(checked(await transport.readGoals({case_id:ctx.caseId})),ctx.caseId);
   if(!ctx.active())return;
   if(a.name==='objetivo_crear'){
    if(model.goals.some(g=>!['stopped','completed'].includes(g.status)))throw Error('goal_busy');
    payload={case_id:ctx.caseId,request_id:a.request_id,expected_revision:model.source_revision,...a.args,scope:GOAL_SCOPE};
   }else{
    const goal=model.goals.find(g=>g.goal_id===a.args.goal_id);
    if(!goal)throw Error('goal_not_found');
    const resume=a.name==='objetivo_reanudar';
    if(resume?!(['stopped','awaiting_data'].includes(goal.status)||goal.can_resume===true):!['queued','running','ready_for_review','awaiting_data'].includes(goal.status))throw Error('invalid_state');
    payload={case_id:ctx.caseId,request_id:a.request_id,expected_revision:goal.revision,goal_id:goal.goal_id,action:resume?'resume':'stop'};
   }
   const prepared=await ctx.post('/voice/action-prepare',{request_id:a.request_id,payload});
   if(prepared.receipt?.completed)return;
   // The server persisted the exact payload before any write.
   if(JSON.stringify(prepared.receipt?.payload)!==JSON.stringify(payload))throw Error('invalid_request');
  }
  if(!ctx.active())return;
  const receipt=checked(await transport[method](structuredClone(payload)));
  const g=validateGoal(receipt.goal,ctx.caseId);
  if(receipt.request_id!==a.request_id)throw Error('invalid_goals');
  if(method==='createGoal'){
   if(g.status!=='queued'||g.source_revision!==payload.expected_revision||['title','instruction','criterion','scope'].some(k=>g[k]!==payload[k]))throw Error('invalid_goals');
  }else if(g.goal_id!==payload.goal_id||g.status!==(payload.action==='resume'?'queued':'stopped'))throw Error('invalid_goals');
  // A started canonical write may finish after the user ends voice; retain its receipt.
  await ctx.post('/voice/action-result',{request_id:a.request_id,result:{ok:true,request_id:a.request_id,goal:g}});
 }
 function consume(actions,ctx){
  if(!Array.isArray(actions)||actions.length>12||!ctx.active())return;
  for(const a of actions){
   if(done.has(a.request_id)||flights.has(a.request_id))continue;
   const last=attempts.get(a.request_id);
   if(last&&(last.count>=3||now()-last.at<10000))continue;
   const run=queue.then(async()=>{
    if(!ctx.active())return;
    attempts.set(a.request_id,{count:(attempts.get(a.request_id)?.count||0)+1,at:now()});
    onChange({request_id:a.request_id,name:a.name,phase:'running'});
    try{await execute(a,ctx);if(ctx.active()){done.add(a.request_id);onChange({request_id:a.request_id,name:a.name,phase:'confirmed'});}}
    catch(error){
     const code=error?.message;
     if(definitive.has(code)){
      try{await ctx.post('/voice/action-result',{request_id:a.request_id,result:{ok:false,error:code}});done.add(a.request_id);}catch{}
     }
     onChange({request_id:a.request_id,name:a.name,phase:definitive.has(code)?'rejected':'unconfirmed',code:definitive.has(code)?code:'confirmation_pending'});
    }
   }).finally(()=>flights.delete(a.request_id));
   flights.set(a.request_id,run);queue=run.catch(()=>{});
  }
 }
 return {consume,retry(){attempts.clear();},settled:()=>queue};
}

// Coalesce only concurrent reads in this authorized frame; never cache or merge writes.
export function coalesceGoalReads(transport){
 const flights=new Map();
 return {...transport,readGoals(payload){
  const key=payload.case_id;
  if(flights.has(key))return flights.get(key);
  const promise=Promise.resolve().then(()=>transport.readGoals(payload)).finally(()=>{if(flights.get(key)===promise)flights.delete(key);});
  flights.set(key,promise);return promise;
 }};
}
