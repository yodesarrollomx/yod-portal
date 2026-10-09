import {validateObservation} from './work-observer.mjs?v=124';
// One request at a time for the authorized roster. No execution or selection side effects.
export function createRoomWork({request,now=Date.now,schedule=setTimeout,cancel=clearTimeout,isVisible=()=>true}){
 const profiles=new Map(),states=new Map(),listeners=new Set();let cursor=0,timer=null,flight=false,disposed=false,epoch=0;
 const snapshot=()=>[...states.values()].map(s=>structuredClone(s));
 function emit(){for(const fn of listeners)fn(snapshot());}
 function later(){cancel(timer);if(!disposed&&profiles.size)timer=schedule(()=>{timer=null;void refresh();},5000);}
 function reconcile(list){
  const incoming=new Map((list||[]).filter(p=>p?.case_id===p?.id&&p.entity_kind==='case').slice(0,6).map(p=>[p.case_id,p]));
  for(const id of profiles.keys())if(!incoming.has(id)){states.delete(id);profiles.delete(id);}
  for(const [id,p]of incoming)profiles.set(id,p);
  emit();if(!flight)void refresh();
 }
 async function refresh(){
  if(disposed||flight)return;if(!isVisible()){later();return;}
  const ids=[...profiles.keys()];if(!ids.length)return;
  const id=ids[cursor++%ids.length],profile=profiles.get(id),own=epoch;flight=true;
  const valid=()=>!disposed&&own===epoch&&profiles.get(id)===profile;
  try{
   const value=validateObservation(await request('/computer/work',{},id),id);
   if(!valid())return;
   const prior=states.get(id);
   const keep=prior?.work?.run_id===value.work?.run_id&&prior?.screen?.captured_at===value.screen?.captured_at;
   const state={...value,image:keep?prior.image||null:null,phase:value.available?'ready':'unavailable',checked_at:now()};
   states.set(id,state);emit();
   if(value.available&&value.work&&value.screen?.owner?.run_id===value.work.run_id&&value.screen.captured_at&&!state.image){
    try{
     const capture=await request('/computer/state',{},id);if(!valid())return;
     if(capture.capture_work?.case_id===id&&capture.capture_work?.run_id===value.work.run_id&&capture.captured_at===value.screen.captured_at&&typeof capture.image==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(capture.image)&&capture.image.length<=900100)state.image=capture.image;
     emit();
    }catch(error){if(error.message==='unauthorized')throw error;}
   }
  }catch(e){if(valid()){states.set(id,{phase:e.message==='unauthorized'?'unauthorized':'unavailable',case_id:id,work:null,screen:null,image:null,checked_at:now()});emit();}}
  finally{flight=false;later();}
 }
 return {reconcile,refresh,snapshot,has:id=>profiles.has(id),subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},
 dispose(){disposed=true;epoch++;cancel(timer);profiles.clear();states.clear();emit();listeners.clear();}};
}
