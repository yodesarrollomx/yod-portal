import {validateObservation,observationCaptureKey,validatedCapture} from './work-observer.mjs?v=126';
// One serial round refreshes the whole authorized roster; the pause is between rounds.
// This observes persisted work. It never starts execution or changes selected project.
export function createRoomWork({request,now=Date.now,schedule=setTimeout,cancel=clearTimeout,isVisible=()=>true,intervalMs=5000,maxImageBytes=1800200}){
 const profiles=new Map(),states=new Map(),listeners=new Set(),attempts=new Map();let timer=null,flight=false,disposed=false,epoch=0;
 const snapshot=()=>[...states.values()].map(s=>structuredClone(s));
 function emit(){for(const fn of listeners)fn(snapshot());}
 function later(){cancel(timer);if(!disposed&&profiles.size)timer=schedule(()=>{timer=null;void refresh();},Math.max(1000,intervalMs));}
 function trimImages(preferred){
  let used=0;const list=[...states.entries()].filter(([,s])=>s.image).sort((a,b)=>(b[0]===preferred)-(a[0]===preferred)||(b[1].checked_at||0)-(a[1].checked_at||0)||a[0].localeCompare(b[0]));
  for(const [,s] of list){if(used+s.image.length<=maxImageBytes)used+=s.image.length;else s.image=null;}
 }
 function reconcile(list){
  if(disposed)return;
  const incoming=new Map((list||[]).filter(p=>p?.case_id===p?.id&&p.entity_kind==='case').slice(0,6).map(p=>[p.case_id,p]));
  for(const id of profiles.keys())if(!incoming.has(id)){states.delete(id);profiles.delete(id);attempts.delete(id);}
  // Keep the lease identity across metadata refreshes; a remove/re-add gets a new one.
  for(const [id,p]of incoming){const prior=profiles.get(id);profiles.set(id,prior?{...prior,profile:p}:{profile:p,lease:{}});}
  emit();if(!flight)void refresh();
 }
 async function observe(id,lease,own){
  const valid=()=>!disposed&&own===epoch&&profiles.get(id)?.lease===lease;
  try{
   const value=validateObservation(await request('/computer/work',{},id),id);if(!valid())return;
   const prior=states.get(id),key=observationCaptureKey(value);
   const state={...value,image:key&&key===observationCaptureKey(prior)?prior.image||null:null,phase:value.available?'ready':'unavailable',checked_at:now()};
   states.set(id,state);emit();
   const attempted=attempts.get(id);
   if(key&&!state.image&&(!attempted||attempted.key!==key||now()-attempted.at>=30000)){
    attempts.set(id,{key,at:now()});
    try{
     const capture=await request('/computer/state',{},id);if(!valid())return;
     state.image=validatedCapture(capture,value);trimImages(id);emit();
    }catch(error){if(['unauthorized','forbidden'].includes(error?.message))throw error;}
   }else if(!key)attempts.delete(id);
  }catch(e){if(valid()){states.set(id,{phase:['unauthorized','forbidden'].includes(e?.message)?'unauthorized':'unavailable',case_id:id,work:null,screen:null,image:null,checked_at:now()});attempts.delete(id);emit();}}
 }
 async function refresh(){
  if(disposed||flight)return;if(!isVisible()){later();return;}
  if(!profiles.size)return;cancel(timer);timer=null;flight=true;const own=epoch,visited=new Set();
  try{
   // Reconciliation may add members during a request. Include them in this same round.
   while(!disposed&&own===epoch&&isVisible()){
    const next=[...profiles.entries()].find(([id])=>!visited.has(id));if(!next)break;
    const [id,p]=next;visited.add(id);await observe(id,p.lease,own);
   }
  }finally{flight=false;later();}
 }
 return{reconcile,refresh,snapshot,has:id=>profiles.has(id),subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},
 dispose(){disposed=true;epoch++;cancel(timer);profiles.clear();states.clear();attempts.clear();emit();listeners.clear();}};
}
