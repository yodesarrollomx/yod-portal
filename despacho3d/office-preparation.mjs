import {validateFastSession} from './fast-lane.mjs';
// Temporary credentials only, scoped to this document's current authorized catalog.
export function createFastSessionPool({now=Date.now,margin=120000,maxCases=6}={}){
 const entries=new Map(),queue=[];let running=false,scheduled=false;
 const changed=()=>Error('session_changed');
 function promote(entry){
  const index=queue.indexOf(entry);if(index>0){queue.splice(index,1);queue.unshift(entry);}
 }
 function drop(id){
  const entry=entries.get(id);if(!entry)return;
  entries.delete(id);
  const index=queue.indexOf(entry);
  if(index>=0){queue.splice(index,1);entry.reject(changed());}
 }
 function forget(id){if(id===undefined){for(const key of [...entries.keys()])drop(key);}else drop(id);}
 function requestPump(){
  if(running||scheduled||!queue.length)return;scheduled=true;
  void Promise.resolve().then(()=>{scheduled=false;void pump();});
 }
 async function pump(){
  if(running)return;
  const entry=queue.shift();if(!entry)return;
  running=true;
  try{
   if(entries.get(entry.id)!==entry)throw changed();
   const raw=await entry.mint({case_id:entry.id});
   if(raw?.ok===false)throw Error(raw.error||'unavailable');
   const value={ok:true,...validateFastSession(raw,entry.id,now())};
   if(entries.get(entry.id)!==entry)throw changed();
   entry.value=value;entry.resolve(value);
  }catch(error){
   if(entries.get(entry.id)===entry)entries.delete(entry.id);
   entry.reject(error);
  }finally{entry.flight=null;running=false;requestPump();}
 }
 async function ensure(id,mint,{priority=false}={}){
  const old=entries.get(id);
  if(old?.value&&old.value.expires_at-now()>margin)return old.value;
  if(old?.flight){if(priority)promote(old);return old.flight;}
  if(!old&&entries.size>=maxCases)throw Error('preparation_limit');
  const entry={id,mint,value:null,flight:null};
  entry.flight=new Promise((resolve,reject)=>{entry.resolve=resolve;entry.reject=reject;});
  entries.set(id,entry);queue.push(entry);if(priority)promote(entry);requestPump();
  return entry.flight;
 }
 function retain(ids){const allowed=new Set(ids);for(const id of [...entries.keys()])if(!allowed.has(id))drop(id);}
 return {ensure,forget,retain};
}
export const officeFastSessions=createFastSessionPool();

export function createOfficePreparation({sessions=officeFastSessions,mint,fetchImpl=(...args)=>fetch(...args),now=Date.now,
 visible=()=>true,onResult=()=>{}}={}){
 let generation=0,items=[],flight=null,closed=false;
 const checked=new Map();
 function clear(){generation++;items=[];checked.clear();sessions.forget();}
 function update(next){
  if(closed)return Promise.resolve(false);
  items=next.filter(c=>c.can_enqueue);sessions.retain(items.map(c=>c.case_id));
  for(const id of checked.keys())if(!items.some(c=>c.case_id===id))checked.delete(id);
  if(flight||!visible())return flight||Promise.resolve(false);
  const own=generation;
  const run=(async()=>{
   for(const c of [...items]){
    if(closed||own!==generation||!visible())return false;
    if(!items.some(item=>item.case_id===c.case_id))continue;
    if(now()-(checked.get(c.case_id)??-Infinity)<60000)continue;
    let ok=false;
    try{
     const auth=await sessions.ensure(c.case_id,mint);
     if(closed||own!==generation||!items.some(item=>item.case_id===c.case_id))continue;
     const response=await fetchImpl(auth.endpoint+'/voice/ready',{headers:{Authorization:'Bearer '+auth.token},
      cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
     if(response.status===401||response.status===403)sessions.forget(c.case_id);
     const data=response.ok?await response.json():null;ok=data?.ok===true&&data.available===true;
    }catch{}
    if(closed||own!==generation)return false;
    if(ok)checked.set(c.case_id,now());
    if(items.some(item=>item.case_id===c.case_id))onResult(c.case_id,ok);
   }
   return true;
  })();flight=run;
  void run.finally(()=>{if(flight===run)flight=null;});return run;
 }
 return {update,clear,close(){closed=true;clear();}};
}
