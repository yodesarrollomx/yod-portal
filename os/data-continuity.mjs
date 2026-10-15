// Ephemeral data only. Authority, leases, credentials and writes are never cached as reads.
export const FRESHNESS_MS=Object.freeze({read:1000,readGoals:2500,readVisits:3000});
const canonical=v=>JSON.stringify(Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))));
export function createDataContinuity({now=()=>Date.now(),onChange=()=>{},maxEntries=32,maxWrites=500,writeTimeout=50000,schedule=setTimeout,cancel=clearTimeout}={}){
 let epoch=null,revision=0;
 const cache=new Map(),writes=new Map();
 const current=e=>epoch!==null&&epoch===e;
 function invalidate(notify=false){revision++;cache.clear();if(notify)onChange();}
 function setSession(e){if(epoch===e)return;epoch=e;invalidate();writes.clear();}
 async function read(method,payload,run,isCurrent){
  const e=epoch,r=revision,key=method+':'+canonical(payload),ttl=FRESHNESS_MS[method]||0;
  if(!current(e)||!isCurrent())throw Error('session_changed');
  const old=cache.get(key);
  if(ttl&&old&&now()>=old.at&&now()-old.at<ttl)return structuredClone(old.value);
  const value=await run(r);
  if(!current(e)||!isCurrent())throw Error('session_changed');
  if(r!==revision)throw Error('stale_revision');
  if(ttl&&value?.error===null&&value.result?.ok===true){
   cache.delete(key);cache.set(key,{at:now(),value:structuredClone(value)});
   while(cache.size>maxEntries)cache.delete(cache.keys().next().value);
  }
  return value;
 }
 async function write(method,payload,run,isCurrent,reconcile=async()=>{}){
  const e=epoch,key=method+':'+payload.case_id+':'+payload.request_id,signature=canonical(payload);
  if(!current(e)||!isCurrent())throw Error('session_changed');
  let entry=writes.get(key);
  if(entry){
   if(entry.signature!==signature)return {result:{ok:false,error:'request_id_reused'},error:null};
   // Unknown outcome is a read/reconciliation operation, never another POST.
   if(entry.unknown){await reconcile();if(!current(e)||!isCurrent())throw Error('session_changed');}
   const value=entry.value||await entry.promise;
   if(!current(e)||!isCurrent())throw Error('session_changed');
   return structuredClone(value);
  }
  if(writes.size>=maxWrites)throw Error('unavailable');
  invalidate();entry={signature,unknown:false,promise:null};writes.set(key,entry);
  let timer;
  const actual=Promise.resolve().then(run).catch(()=>({result:null,error:'unavailable'})).then(value=>{
   cancel(timer);
   if(current(e)){
    if(['transport_busy','session_pending'].includes(value.error))writes.delete(key);
    entry.value=value;entry.unknown=!!value.error||!value.result||value.result.ok!==true&&value.result.ok!==false;
    invalidate(true);
   }
   return value;
  });
  entry.promise=Promise.race([actual,new Promise(resolve=>{timer=schedule(()=>{
   entry.unknown=true;if(current(e))invalidate(true);resolve({result:null,error:'timeout'});
  },writeTimeout);})]);
  const value=entry.value||await entry.promise;
  if(!current(e)||!isCurrent())throw Error('session_changed');
  return structuredClone(value);
 }
 return Object.freeze({setSession,read,write,invalidate,revoke(){epoch=null;invalidate();writes.clear();},revision:()=>revision,
  snapshot:()=>({cached:cache.size,writes:writes.size,revision})});
}
