// Read-only observation. No tool or goal execution is triggered here.
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,200}$/.test(v);
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const txt=(v,n)=>typeof v==='string'&&v.length<=n;
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const runtimePhases=new Set(['starting','ready','working','waiting_capacity','reconnecting','review_required','unavailable','disabled','stopped']);
const count=v=>Number.isSafeInteger(v)&&v>=0;
const phases=new Set(['working','tool','prepared','awaiting_data','interrupted','error']);
export function safeWorkURL(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function validateObservation(raw,caseId){
 const bad=()=>{throw Error('invalid_observation');};
 if(!plain(raw)||raw.ok!==true||raw.case_id!==caseId||typeof raw.available!=='boolean'||JSON.stringify(raw).length>524288)bad();
 if(!raw.available)return{available:false,case_id:caseId,work:null,screen:null};
 const extended=['observed_at','runtime','history_available'].some(k=>Object.hasOwn(raw,k));
 if(extended){const r=raw.runtime;
  if(!stamp(raw.observed_at)||typeof raw.history_available!=='boolean'||!plain(r)||!runtimePhases.has(r.phase)||!stamp(r.updated_at)||typeof r.continues_without_viewer!=='boolean'||r.concurrency!==1||!Number.isSafeInteger(r.goal_poll_ms)||r.goal_poll_ms<1000||r.goal_poll_ms>3600000)bad();
  if(r.diagnostic!==undefined&&r.diagnostic!==null&&(!plain(r.diagnostic)||!/^[_a-z]{3,60}$/.test(r.diagnostic.code)))bad();
 }
 const w=raw.work;
 if(w!==null){
  if(!plain(w)||w.schema!==1||w.case_id!==caseId||!id(w.run_id)||!id(w.goal_id)||!id(w.source_revision)||!txt(w.title,160)||!txt(w.criterion,1000)||!phases.has(w.phase)||!stamp(w.started_at)||!stamp(w.updated_at)||!(w.current_tool===null||txt(w.current_tool,240)))bad();
  const p=w.progress;
  if(!plain(p)||!Number.isSafeInteger(p.sequence)||p.sequence<0||!plain(p.progress))bad();
  const {tasks,evidence,summary}=p.progress;
  if(!Array.isArray(tasks)||tasks.length>8||!Array.isArray(evidence)||evidence.length>8||!txt(summary,2000))bad();
  const ids=new Set();
  for(const t of tasks){if(!/^task-[1-8]$/.test(t.id)||ids.has(t.id)||!txt(t.title,240)||!txt(t.summary,1200)||!['pending','running','ready_for_review','blocked'].includes(t.status))bad();ids.add(t.id);}
  for(const e of evidence)if(!id(e.id)||!ids.has(e.task_id)||!txt(e.title,200)||!txt(e.text,4000))bad();
  if(w.metrics!==undefined){const m=w.metrics;
   if(!plain(m)||m.review_required!==true||m.total!==tasks.length||m.evidence_count!==evidence.length)bad();
   for(const status of ['ready_for_review','blocked','running','pending'])if(!count(m[status])||m[status]!==tasks.filter(t=>t.status===status).length)bad();
  }
  if(!Array.isArray(w.sources)||w.sources.length>40||!Array.isArray(w.events)||w.events.length>200)bad();
  if(w.event_count!==undefined&&(!count(w.event_count)||w.event_count<w.events.length))bad();
  for(const s of w.sources)if(s.case_id!==caseId||s.run_id!==w.run_id||s.goal_id!==w.goal_id||!(s.task_id===null||ids.has(s.task_id))||!txt(s.title,240)||!(s.url===null||txt(s.url,2048)&&safeWorkURL(s.url))||!stamp(s.consulted_at))bad();
  for(const e of w.events)if(e.case_id!==caseId||e.run_id!==w.run_id||e.goal_id!==w.goal_id||!txt(e.label,240)||!stamp(e.at)||!['working','completed','failed'].includes(e.status))bad();
  if(w.result!==null&&(!plain(w.result)||!txt(w.result.summary,4000)||!['ready_for_review','awaiting_data'].includes(w.result.state)))bad();
 }
 const d=w?.document;
 if(d!==undefined&&d!==null&&(!plain(d)||d.case_id!==caseId||d.run_id!==w.run_id||d.goal_id!==w.goal_id||!(d.task_id===null||w.progress.progress.tasks.some(t=>t.id===d.task_id))||!id(d.id)||!txt(d.title,240)||!txt(d.content,8000)||!txt(d.tab,240)||!txt(d.range,80)||typeof d.truncated!=='boolean'||!stamp(d.read_at)||!(d.url===null||txt(d.url,2048)&&safeWorkURL(d.url))))bad();
 const s=raw.screen;
 if(s&&(!plain(s)||!(s.captured_at===null||stamp(s.captured_at))||!Number.isSafeInteger(s.revision)||s.revision<0))bad();
 if(s?.owner&&(!id(s.owner.run_id)||s.owner.case_id!==caseId||!id(s.owner.goal_id)||!(s.owner.task_id===null||/^task-[1-8]$/.test(s.owner.task_id))))bad();
 return structuredClone({available:true,case_id:caseId,work:w,screen:s||null,...(extended?{observed_at:raw.observed_at,runtime:raw.runtime,history_available:raw.history_available}:{})});
}
export function workHeadline(state){
 if(state.phase==='unauthorized'||!state.case_id)return 'Puesto sin seleccionar';
 if(state.phase==='loading')return 'Consultando actividad…';
 if(state.phase!=='ready')return 'Sin conexión con la actividad';
 const runtime=state.runtime?.phase;
 if(runtime==='waiting_capacity')return 'Encargo en cola';
 if(runtime==='reconnecting')return 'Recuperando conexión del servidor';
 if(runtime==='unavailable')return 'Servidor sin disponibilidad';
 if(runtime==='disabled'||runtime==='stopped')return 'Motor detenido';
 if(runtime==='starting')return 'Preparando motor';
 const w=state.work;if(!w)return 'En espera · sin ejecución registrada';
 return ({working:'Analizando',tool:w.current_tool||'Consultando',prepared:'Análisis preparado',awaiting_data:'Faltan datos',interrupted:'Ejecución interrumpida',error:'Ejecución sin completar'})[w.phase];
}
// A capture belongs to one exact execution and task, not merely to a timestamp.
export function observationCaptureKey(value){
 const s=value?.screen,w=value?.work,o=s?.owner;
 if(!value?.available||!w||!s?.captured_at||o?.case_id!==value.case_id||o.run_id!==w.run_id||o.goal_id!==w.goal_id)return null;
 return JSON.stringify([value.case_id,w.run_id,w.goal_id,o.task_id,s.captured_at,s.revision]);
}
export function validatedCapture(capture,value){
 const key=observationCaptureKey(value),owner=value?.screen?.owner,b=capture?.capture_work;
 if(!key||!b||b.case_id!==owner.case_id||b.run_id!==owner.run_id||b.goal_id!==owner.goal_id||b.task_id!==owner.task_id||capture.captured_at!==value.screen.captured_at||capture.revision!==value.screen.revision)return null;
 return typeof capture.image==='string'&&capture.image.length<=900100&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(capture.image)?capture.image:null;
}
export function createWorkObserver({request,getSelection,onChange=()=>{},now=Date.now,schedule=setTimeout,cancel=clearTimeout,isVisible=()=>true}){
 let state={phase:'unauthorized',case_id:null,work:null,screen:null,image:null},generation=0,disposed=false,flight=null,timer=null;
 const listeners=new Set(),copy=()=>structuredClone(state);
 function emit(){onChange(copy());for(const fn of listeners)fn(copy());}
 function clear(){cachedImage=null;generation++;cancel(timer);timer=null;flight=null;state={phase:'unauthorized',case_id:null,work:null,screen:null,image:null};emit();}
 function select(){const id=getSelection()?.case_id;if(id===state.case_id)return;if(!id){clear();return;}clear();state={...state,phase:'loading',case_id:id};emit();void refresh();}
 function later(){cancel(timer);if(!disposed&&state.case_id)timer=schedule(()=>{timer=null;void refresh();},['working','tool'].includes(state.work?.phase)?5000:12000);}
 async function refresh(){
  if(disposed||flight)return;if(!isVisible()){later();return;}
  const caseId=getSelection()?.case_id;if(caseId!==state.case_id){select();return;}if(!caseId)return;
  const own=generation;flight={generation:own};
  const valid=()=>!disposed&&own===generation&&getSelection()?.case_id===caseId;
  try{
   const value=validateObservation(await request('/computer/work',{},caseId),caseId);if(!valid())return;
   const oldKey=observationCaptureKey(state),key=observationCaptureKey(value);
   state={...value,phase:value.available?'ready':'unavailable',checked_at:now(),image:key&&oldKey===key?cachedImage:null};
   emit();
   if(key&&!state.image){try{
    const snap=await request('/computer/state',{},caseId);if(!valid())return;
    state.image=validatedCapture(snap,value);
   }catch(error){if(['unauthorized','forbidden'].includes(error?.message))throw error;if(!valid())return;state.image=null;}}
   cachedImage=state.image;emit();
  }catch(error){if(valid()){const denied=['unauthorized','forbidden'].includes(error?.message);state={phase:denied?'unauthorized':'unavailable',case_id:caseId,work:denied?null:state.work,screen:null,image:null};cachedImage=null;emit();}}
  finally{if(flight?.generation===own){flight=null;later();}}
 }
 let cachedImage=null;
 return{select,refresh,snapshot:copy,subscribe(fn){listeners.add(fn);fn(copy());return()=>listeners.delete(fn);},dispose(){disposed=true;clear();cachedImage=null;listeners.clear();}};
}
