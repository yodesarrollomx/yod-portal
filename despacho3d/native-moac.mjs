// Read-only projection of the canonical, server-authorized MOAC. Never infer bindings.
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const string=(v,max=200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const label=(v,max=2000)=>typeof v==='string'?v.slice(0,max):'';
const rows=v=>Array.isArray(v)&&v.length<=100;
const unavailable={phase:'unavailable',notice:'No se pudo comprobar el MOAC de este proyecto. Esto no significa que no tenga pendientes.'};
export function nativeMoac(raw,caseId){
 if(!raw||raw.ok!==true||raw.case_id!==caseId||raw.context?.identity?.case_id!==caseId)return {...unavailable};
 const m=raw.context.moac;
 if(m===undefined)return {phase:'missing',notice:'El expediente todavía no entrega su conexión con MOAC.'};
 if(!object(m)||m.schema!==1||m.source!=='native_moac'||m.case_id!==caseId||m.status==='unavailable')return {...unavailable};
 if(!date(m.observed_at)||!string(m.source_revision,256)||!['linked','unlinked'].includes(m.binding)||![m.metas,m.objetivos,m.tareas,m.deliveries,m.warnings].every(rows))return {...unavailable};
 if(JSON.stringify(m).length>262144)return {...unavailable};
 const metas=new Map(),objectives=new Map(),tasks=new Map();
 for(const meta of m.metas){
  if(!object(meta)||!string(meta.meta_id)||metas.has(meta.meta_id))return {...unavailable};
  const title=meta.meta||Object.entries(meta).find(([k])=>k.startsWith('meta ('))?.[1]||meta.principal;
  metas.set(meta.meta_id,{id:meta.meta_id,title:label(title)||meta.meta_id});
 }
 for(const o of m.objetivos){
  if(!object(o)||!string(o.objetivo_id)||objectives.has(o.objetivo_id)||!metas.has(o.meta_id))return {...unavailable};
  objectives.set(o.objetivo_id,{id:o.objetivo_id,meta_id:o.meta_id,title:label(o['objetivo / hito']||o.objetivo)||o.objetivo_id});
 }
 for(const t of m.tareas){
  if(!object(t)||!string(t.tarea_id)||tasks.has(t.tarea_id)||!objectives.has(t.objetivo_id)||objectives.get(t.objetivo_id).meta_id!==t.meta_id||!string(t.revision,256))return {...unavailable};
  tasks.set(t.tarea_id,{id:t.tarea_id,objective_id:t.objetivo_id,meta_id:t.meta_id,title:label(t.actividad)||t.tarea_id,state:label(t.estado,120)||'Sin estado registrado',owner:label(t.responsable,200)||'Sin responsable registrado',deliverable:label(t.entregable),date:label(t.fecha,100),revision:t.revision});
 }
 if(m.binding==='unlinked'&&(metas.size||objectives.size||tasks.size||m.deliveries.length))return {...unavailable};
 if(m.binding==='linked'&&!tasks.size)return {...unavailable};
 const receiptIds=new Set(),deliveries=[];
 for(const d of m.deliveries){
  if(!object(d)||!string(d.request_id)||receiptIds.has(d.request_id)||!tasks.has(d.tarea_id)||!date(d.at)||!string(d.status,80)||!string(d.summary,2000))return {...unavailable};
  if(d.case_id!==undefined&&d.case_id!==caseId)return {...unavailable};
  receiptIds.add(d.request_id);deliveries.push({id:d.request_id,task_id:d.tarea_id,at:d.at,status:d.status,summary:d.summary});
 }
 return {phase:m.binding==='unlinked'?'unlinked':'ready',case_id:caseId,observed_at:m.observed_at,revision:m.source_revision,metas:[...metas.values()],objectives:[...objectives.values()],tasks:[...tasks.values()],deliveries,warnings:m.warnings.filter(w=>object(w)&&w.code==='derived_meta_mismatch'&&tasks.has(w.task_id)).map(w=>w.task_id),notice:m.binding==='unlinked'?'Este proyecto no tiene una acción vinculada en el MOAC. La asignación debe registrarse en el tablero original; no se deduce por nombre.':''};
}
export function paintNativeMoac({container,model,refresh,doc=document}){
 const el=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
 container.replaceChildren();container.dataset.moacPhase=model.phase;
 container.append(el('h2','Metas, objetivos y acciones'),el('p','El MOAC original del proyecto. Sus estados y responsables se conservan; consultar una entrega no la aprueba.'));
 const actions=el('nav'),retry=el('button','Actualizar MOAC');retry.type='button';retry.addEventListener('click',refresh);actions.append(retry);
 const link=el('a','Abrir MOAC original');link.href='https://yodesarrollomx.github.io/board-aurum/';link.target='_blank';link.rel='noopener noreferrer';actions.append(link);container.append(actions);
 if(model.notice)container.append(el('p',model.notice));
 if(!['ready','unlinked'].includes(model.phase))return;
 container.append(el('small','Lectura del servidor: '+new Date(model.observed_at).toLocaleString('es-MX',{timeZone:'America/Hermosillo'})+' · Hermosillo'));
 for(const meta of model.metas){
  const group=el('section');group.className='workspace-card';group.append(el('small','META · '+meta.id),el('h3',meta.title));
  for(const objective of model.objectives.filter(o=>o.meta_id===meta.id)){
   group.append(el('h4',objective.id+' · '+objective.title));
   for(const task of model.tasks.filter(t=>t.objective_id===objective.id)){
    const card=el('article');card.className='workspace-card';card.dataset.nativeTask=task.id;
    card.append(el('h4',task.id+' · '+task.title),el('p',task.state+' · '+task.owner));
    if(task.deliverable)card.append(el('p','Entregable: '+task.deliverable));if(task.date)card.append(el('p','Fecha registrada: '+task.date));
    if(model.warnings.includes(task.id))card.append(el('p','La fórmula de meta no coincide con su objetivo. Se muestra la relación del objetivo; la hoja no fue modificada.'));
    for(const d of model.deliveries.filter(d=>d.task_id===task.id)){const receipt=el('details');receipt.append(el('summary','Entrega registrada · '+new Date(d.at).toLocaleString('es-MX',{timeZone:'America/Hermosillo'})),el('p',d.summary),el('small','Recibo '+d.id+' · '+d.status+' · No cambia el estado de la acción.'));card.append(receipt);}
    group.append(card);
   }
  }
  container.append(group);
 }
 if(model.tasks.length)container.append(el('p','Se muestran las acciones vinculadas a este proyecto y los últimos resúmenes de entrega incluidos en su expediente. El historial completo permanece en MOAC.'));
}
