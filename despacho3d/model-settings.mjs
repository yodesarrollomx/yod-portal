export const MODEL_OPTIONS=Object.freeze([
 {model:'gpt-6-luna',label:'Luna · 0.05× base',efforts:['none','low','medium','high','xhigh','max']},
 {model:'gpt-6.1-sol',label:'Sol · base 1×',efforts:['low','medium','high','xhigh','max']},
 {model:'gpt-6-astra',label:'Astra · 5× base',efforts:['low','medium','high','xhigh','max']}
]);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,200}$/.test(v);
const valid=p=>!!p&&Object.keys(p).sort().join('|')==='effort|model'&&MODEL_OPTIONS.some(m=>m.model===p.model&&m.efforts.includes(p.effort));
export function validateModelSettings(v,caseId){
 if(v?.ok!==true||v.case_id!==caseId||!Number.isSafeInteger(v.revision)||v.revision<0||v.can_edit!==true||!(v.preference===null||valid(v.preference))||!Array.isArray(v.tasks)||v.tasks.length>16||v.tasks.some(t=>!id(t.id)||!['room','goal','voice'].includes(t.kind)||!Number.isFinite(t.expires_at)||!(t.preference===null||valid(t.preference))))throw Error(v?.error==='unauthorized'?'unauthorized':'preferences_unavailable');
 return structuredClone(v);
}
export function createModelSettings({transport,notify=()=>{},applyLive=async()=>true,uuid=()=>crypto.randomUUID(),now=Date.now}){
 let caseId=null,epoch=0,value=null,pending=null,busy=false,notice='';
 const emit=()=>notify({caseId,value,pending,busy,notice});
 function clear(){epoch++;caseId=null;value=null;pending=null;busy=false;notice='';emit();}
 async function read(id=caseId){if(!id)return false;if(caseId!==id){clear();caseId=id;}const own=epoch;busy=true;emit();
  try{const v=await transport.readModelPreferences({case_id:id});if(own!==epoch)return false;value=validateModelSettings(v,id);notice=value.preference?'Elige cuánto razonamiento necesita este autón.':'Sin ajuste propio: se hereda el entorno o la base de cada ruta. Guarda una elección para fijarlo.';return true;}
  catch(e){if(own===epoch){value=null;notice=e.message==='unauthorized'?'Tu perfil no puede cambiar esta configuración.':'Configuración no disponible. No se ha cambiado el modelo.';}return false;}
  finally{if(own===epoch){busy=false;emit();}}
 }
 async function save(scope,taskId,preference){
  if(busy||!value||!caseId)return false;
  if(!pending){if(!['agent','task'].includes(scope)||!(preference===null||valid(preference))||(scope==='task'&&!value.tasks.some(t=>t.id===taskId&&t.expires_at>now())))return false;
   pending={case_id:caseId,request_id:uuid(),expected_revision:value.revision,scope,task_id:scope==='agent'?null:taskId,preference};}
  const own=epoch,p=structuredClone(pending);busy=true;notice='Guardando…';emit();
  try{const raw=await transport.setModelPreferences(p);if(own!==epoch)return false;
   if(raw?.ok===false){pending=null;notice=raw.error==='stale_revision'?'Otro cambio llegó antes. Actualiza y elige de nuevo.':raw.error==='task_finished'?'Esta tarea ya terminó; conserva el predeterminado.':'Cambio rechazado. Se conserva la configuración confirmada.';return false;}
   const next=validateModelSettings(raw,caseId),r=raw.receipt;
   if(!r||r.request_id!==p.request_id||r.case_id!==caseId||!id(r.id)||!Number.isFinite(Date.parse(r.at)))throw Error('receipt_missing');
   value=next;pending=null;notice='Guardado · recibo '+r.id+' · '+new Date(r.at).toLocaleString('es-MX');emit();
   let applied=false;try{applied=await applyLive();}catch{}
   if(own===epoch)notice+=' · '+(applied?'Voz actualizada para el siguiente turno delegado.':'Guardado; falta confirmar el cambio en la voz abierta.');return true;
  }catch{if(own===epoch)notice='No llegó el recibo. Reintenta la misma solicitud para confirmar, sin duplicar el cambio.';return false;}
  finally{if(own===epoch){busy=false;emit();}}
 }
 async function syncLive(){const own=epoch;if(!value)return false;let applied=false;try{applied=await applyLive();}catch{}if(own!==epoch)return false;notice=applied?'Configuración confirmada para el siguiente turno de voz.':'Las preferencias están guardadas; la voz todavía no confirma el cambio.';emit();return applied;}
 return {read,save,clear,syncLive,get snapshot(){return {caseId,value,pending,busy,notice};}};
}
export function mountModelSettings({container,transport,applyLive,doc=document}){
 const el=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
 const root=el('section'),heading=el('h3','Modelo y razonamiento'),model=el('select'),effort=el('select'),scope=el('select'),task=el('select'),save=el('button','Guardar elección'),reset=el('button','Heredar configuración'),refresh=el('button','Actualizar'),notice=el('p');
 root.className='model-settings';root.setAttribute('aria-label','Modelo y razonamiento del autón');notice.setAttribute('role','status');save.type=reset.type=refresh.type='button';
 const field=(name,input)=>{input.setAttribute('aria-label',name);const l=el('label',name);l.append(input);return l;};
 const option=(input,value,label)=>{const o=el('option',label);o.value=value;input.append(o);};
 MODEL_OPTIONS.forEach(m=>option(model,m.model,m.label));option(scope,'agent','Predeterminado del agente');option(scope,'task','Solo esta tarea');
 const labels={none:'Sin razonamiento · menos tokens',low:'Bajo · referencia',medium:'Medio · consumo variable ↑',high:'Alto · consumo variable ↑',xhigh:'Extra alto · consumo variable ↑',max:'Máximo · consumo variable ↑'};
 function efforts(wanted){effort.replaceChildren();MODEL_OPTIONS.find(m=>m.model===model.value).efforts.forEach(e=>option(effort,e,labels[e]));effort.value=MODEL_OPTIONS.find(m=>m.model===model.value).efforts.includes(wanted)?wanted:'low';}
 let signature='';
 const controller=createModelSettings({transport,applyLive,notify:s=>{
  notice.textContent=s.notice;const tasks=(s.value?.tasks||[]).filter(t=>t.expires_at>Date.now());
  const sig=JSON.stringify([s.caseId,s.value?.revision,tasks]);if(sig!==signature){signature=sig;const current=task.value;task.replaceChildren();tasks.forEach(t=>option(task,t.id,({voice:'Sesión de voz',goal:'Objetivo en ejecución',room:'Conversación en ejecución'})[t.kind]+' · '+t.id.slice(0,8)));if(tasks.some(t=>t.id===current))task.value=current;paint(s.value);}
  for(const input of [model,effort,scope,task,save,reset])input.disabled=s.busy||!s.value||!!s.pending;save.disabled=s.busy||!s.value||(scope.value==='task'&&!task.value);save.textContent=s.pending?'Confirmar la misma solicitud':'Guardar elección';refresh.disabled=s.busy||!!s.pending;if(task.parentElement)task.parentElement.hidden=scope.value!=='task';
 }});
 function paint(value=controller.snapshot.value){const p=(scope.value==='task'?value?.tasks.find(t=>t.id===task.value)?.preference:null)||value?.preference||{model:'gpt-6.1-sol',effort:'low'};model.value=p.model;efforts(p.effort);if(task.parentElement)task.parentElement.hidden=scope.value!=='task';save.disabled=!value||(scope.value==='task'&&!task.value);}
 model.addEventListener('change',()=>efforts(effort.value));scope.addEventListener('change',()=>paint());task.addEventListener('change',()=>paint());
 save.addEventListener('click',()=>void controller.save(scope.value,task.value,{model:model.value,effort:effort.value}));reset.addEventListener('click',()=>void controller.save(scope.value,task.value,null));refresh.addEventListener('click',()=>void controller.read().then(ok=>ok&&controller.syncLive()));
 root.append(heading,field('Modelo',model),field('Esfuerzo',effort),field('Aplicar a',scope),field('Tarea activa',task),el('p','Costo relativo por igual cantidad de tokens de entrada sin caché y salida, frente a Sol. Standard, hasta 272k de entrada. No incluye voz, herramientas ni caché. El esfuerzo cambia la cantidad de tokens; no tiene multiplicador fijo.'),el('p','Solo esta tarea vuelve al predeterminado al terminar. Heredar elimina el ajuste de este alcance; se usa la siguiente capa disponible.'),save,reset,refresh,notice);container.append(root);
 return {open:id=>controller.read(id),clear:()=>controller.clear(),dispose(){controller.clear();root.remove();},root};
}
