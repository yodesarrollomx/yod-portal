// One read-only presentation contract for 3D, accessible map and a future light view.
const clean=(v,n=80)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n):'';
// Display name is authorized server metadata. Never infer identity from a similar title.
export function shortAvatarName(profile){return clean(profile?.name,80)||'Autón';}
const phases={working:['analysis','Analizando'],tool:['analysis','Consultando'],prepared:['review','Entrega preparada'],awaiting_data:['blocked','Necesita datos'],interrupted:['blocked','Trabajo interrumpido'],error:['blocked','Necesita atención']};
function activity(w){
 const label=clean(w.current_tool),last=w.events?.at(-1),tool=label||clean(last?.tool);
 if(['prepared','awaiting_data','interrupted','error'].includes(w.phase))return phases[w.phase];
 if(/drive|document|biblioteca|hoja|pdf|archivo/i.test(tool))return['library','Consultando documentos'];
 if(/web|browser|internet|investiga|navega|página|pantalla/i.test(tool))return['research','Investigando en internet'];
 return phases[w.phase]||['wait','En espera'];
}
export function avatarPresence({profile,observation,movement,now=Date.now()}={}){
 if(!profile||profile.entity_kind!=='case'||!profile.case_id||profile.case_id!==profile.id)return null;
 const out={case_id:profile.case_id,name:shortAvatarName(profile),color:/^#[a-f\d]{6}$/i.test(profile.color||'')?profile.color:'#57827d',activity:'wait',label:'Sin actividad confirmada',fresh:false,progress:null,observed_at:null,updated_at:null,goal_id:null};
 const o=observation;
 if(o?.phase==='unauthorized')return null;
 if(!o||o.case_id!==profile.case_id)return {...out,activity:'loading',label:'Consultando actividad'};
 if(o.phase!=='ready')return {...out,activity:o.phase==='loading'?'loading':'offline',label:o.phase==='loading'?'Consultando actividad':'Sin conexión con la actividad'};
 const checked=Number(o.checked_at),age=now-checked;
 if(!Number.isFinite(checked)||age<0||age>90000)return {...out,activity:'offline',label:'Actualización pendiente'};
 out.fresh=true;out.observed_at=checked;
 const w=o.work,runtime=o.runtime?.phase;
 if(runtime==='waiting_capacity')return {...out,label:'Encargo en cola'};
 if(['starting','reconnecting','unavailable','disabled','stopped'].includes(runtime))return {...out,activity:runtime==='starting'?'loading':'offline',label:({starting:'Preparando motor',reconnecting:'Reconectando con el motor',unavailable:'Motor no disponible',disabled:'Motor desactivado',stopped:'Motor detenido'})[runtime]};
 if(runtime==='working'&&(!w||['prepared','awaiting_data','interrupted','error'].includes(w.phase)))return {...out,activity:'loading',label:'Preparando encargo'};
 if(!w)return {...out,label:'Disponible · sin encargo activo'};
 if(w.case_id!==profile.case_id)return {...out,activity:'offline',label:'Actividad no disponible',fresh:false};
 out.goal_id=clean(w.goal_id,200);out.updated_at=Number.isFinite(Date.parse(w.updated_at))?Date.parse(w.updated_at):null;[out.activity,out.label]=activity(w);
 const tasks=w.progress?.progress?.tasks;
 if(Array.isArray(tasks)&&tasks.length&&tasks.length<=8&&tasks.every(t=>['pending','running','ready_for_review','blocked'].includes(t?.status))){
  const ready=tasks.filter(t=>t.status==='ready_for_review').length,blocked=tasks.filter(t=>t.status==='blocked').length;
  out.progress={ready,total:tasks.length,blocked,states:tasks.map(t=>t.status),label:ready+' de '+tasks.length+' tareas con entrega preparada; requieren revisión'};
 }
 if(movement?.motion==='walk'&&['analysis','library','research'].includes(out.activity))out.label='En camino · '+(out.activity==='library'?'documentos':out.activity==='research'?'investigación':'su puesto');
 return out;
}
