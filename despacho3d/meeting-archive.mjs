import {validateDelivery} from '../reuniones/delivery.mjs';
import {normalizeMeeting} from '../reuniones/archive-contract.mjs';
import {normalizeReview} from '../reuniones/results-contract.mjs';
import {mountResultsView} from '../reuniones/results-view.mjs';
export function mountMeetingArchive({container,request,getCase,doc=document}) {
 const el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const root=el('section'),notice=el('p','El archivo se consulta con tu acceso al expediente.'),list=el('div'),review=el('div');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 root.setAttribute('aria-label','Archivo de reuniones');root.append(el('h2','Historial de reuniones'),notice,list);
 const input=el('input');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','Ficha de reunión entregada por el asistente');
 const label=el('label','Incorporar ficha de reunión (.json)');label.append(input);root.append(label,review);container.append(root);
 let generation=0,fileGeneration=0,caseId=null,revision=null,busy=false,view=null;
 const current=own=>own===generation&&caseId&&getCase()===caseId;
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=()=>Promise.resolve(fn()).catch(e=>{notice.textContent=message(e);});return b;};
 const message=e=>e.message==='revision_conflict'?'La revisión cambió en otra ventana. Conserva tus notas y vuelve a abrir los resultados.':e.message==='request_id_reused'?'Este identificador ya tiene otros resultados. Conserva ambas fichas para revisarlas.':e.message==='limit_reached'?'El archivo alcanzó su límite. Conserva la ficha original; no se borró ninguna reunión.':e.message==='storage_unavailable'?'El guardado no está confirmado. Conserva la ficha y vuelve a intentar.':e.message;
 async function load(){
  const own=generation;if(!caseId)return;revision=null;
  try{const value=await request('/fast/knowledge/meetings',{});if(!current(own))return;
   if(value.ok!==true||value.case_id!==caseId||!/^\d+$/.test(value.revision)||!Array.isArray(value.meetings))throw Error('Archivo sin confirmar.');
   const meetings=value.meetings.map(item=>{const {schema,record_id,recorded_at,...raw}=item;return normalizeMeeting(raw,caseId);});revision=value.revision;list.replaceChildren();
   for(const m of meetings.reverse()){const card=el('article');card.className='workspace-card';card.append(el('h3',m.title),el('p',m.occurred_at||'Fecha de reunión sin confirmar'),el('p',m.summary));
    for(const [key,text]of [['archive_url','Archivo privado'],['minutes_url','Minuta'],['transcript_url','Transcripción']]){const a=el('a',text+' ↗');a.href=m[key];a.target='_blank';a.rel='noopener noreferrer';card.append(a,el('span',' · '));}
    card.append(button('Revisar resultados · '+m.title,async()=>{if(!current(own))return;if(view?.isDirty())throw Error('Guarda la revisión actual antes de abrir otra reunión.');const r=await request('/fast/knowledge/meeting-results',{meeting_id:m.meeting_id});if(!current(own))return;if(r.available===false){notice.textContent='Esta ficha anterior no incluye resultados guardados. Importa la ficha completa para incorporarlos.';return;}const entry=checked(r,m.meeting_id);show(entry.delivery,entry);}));list.append(card);
   }
   notice.textContent=meetings.length?'Reuniones archivadas en la memoria privada del proyecto.':'Todavía no hay reuniones archivadas en este proyecto.';
  }catch(e){if(current(own)){revision=null;list.replaceChildren();notice.textContent='No se pudo confirmar el archivo. Conserva la ficha y vuelve a intentar.';}}
 }
 function checked(value,id){if(value.ok!==true||value.case_id!==caseId||value.meeting_id!==id||value.storage!=='private_server'||!value.entry||!/^\d+$/.test(value.entry.revision))throw Error('No se confirmó el guardado de resultados.');const d=validateDelivery(value.entry.delivery,caseId);if(d.meeting.meeting_id!==id)throw Error('Ficha de otra reunión.');return {...value.entry,delivery:d,review:normalizeReview(value.entry.review,d.proposals)};}
 function show(d,saved=null){
  view?.destroy();review.replaceChildren();const own=generation;let entry=saved,pending=null;
  const save=button(d.initial?'Vincular y archivar en este proyecto':'Archivar en el expediente',async()=>{
   if(!current(own)||busy)return;busy=true;save.disabled=true;notice.textContent='Archivando reunión y resultados…';let metadataSaved=false;
   try{await load();if(!current(own)||revision===null)throw Error('Consulta el archivo antes de guardar.');
    const value=await request('/fast/knowledge/meeting',{meeting:d.meeting,expected_revision:revision});if(!current(own))return;
    if(value.ok!==true||value.case_id!==caseId||value.meeting_id!==d.meeting.meeting_id||value.status!=='archived'||value.storage!=='private_server'||!value.record_id)throw Error('Archivo sin confirmar. Reintenta con la misma ficha.');metadataSaved=true;
    const result=await request('/fast/knowledge/meeting-import',{delivery:{schema:d.schema,meeting:d.meeting,proposals:d.proposals}});if(!current(own))return;entry=checked(result,d.meeting.meeting_id);
    await load();if(current(own)){notice.textContent='Reunión archivada con el agente del proyecto. Resultados conservados; pendientes por autorizar.';show(d,entry);}
   }catch(e){if(current(own))notice.textContent=(metadataSaved?'Ficha archivada; resultados todavía sin confirmar. ':'')+message(e);}
   finally{if(current(own)){busy=false;save.disabled=false;}}
  });
  review.append(el('p',d.initial?'Plática inicial: al incorporarla la vincularás a este proyecto, conservando su identificador original.':'Proyecto de la ficha comprobado.'));if(!entry)review.append(save);
  view=mountResultsView({container:review,delivery:d,review:entry?.review,readOnly:!entry,doc,onReload:async()=>{try{const r=await request('/fast/knowledge/meeting-results',{meeting_id:d.meeting.meeting_id});if(current(own))show(d,checked(r,d.meeting.meeting_id));}catch(e){if(current(own))notice.textContent=message(e);}},onSave:async rows=>{
   if(!current(own))throw Error('Cambió el proyecto.');if(!entry)throw Error('Primero pulsa Archivar en el expediente para conservar los resultados.');
   const signature=JSON.stringify(rows);if(!pending||pending.signature!==signature)pending={signature,body:{meeting_id:d.meeting.meeting_id,expected_revision:entry.revision,request_id:crypto.randomUUID(),rows}};
   const result=await request('/fast/knowledge/meeting-review',pending.body);if(!current(own))throw Error('Cambió el proyecto.');const confirmed=checked(result,d.meeting.meeting_id);if(JSON.stringify(confirmed.review)!==JSON.stringify(rows))throw Error('La revisión cambió. Descarga tus notas y pulsa Descartar cambios y recargar para ver lo guardado.');entry=confirmed;pending=null;
  }});
 }
 input.onchange=async()=>{const own=generation,fileOwn=++fileGeneration;try{const file=input.files[0];if(!file)return;if(view?.isDirty())throw Error('Guarda la revisión actual antes de importar otra ficha.');if(file.size>200000)throw Error('La ficha supera el tamaño permitido.');const text=await file.text();if(!current(own)||fileOwn!==fileGeneration)return;show(validateDelivery(JSON.parse(text),caseId));}catch(e){if(current(own))notice.textContent=message(e);}finally{if(fileOwn===fileGeneration)input.value='';}};
 root.append(button('Actualizar historial',()=>load()));
 return {open(id){if(caseId!==id){this.clear();caseId=id;}void load();},clear(){generation++;fileGeneration++;caseId=null;revision=null;busy=false;view?.destroy();view=null;list.replaceChildren();review.replaceChildren();input.value='';notice.textContent='El archivo se consulta con tu acceso al expediente.';},destroy(){this.clear();root.remove();}};
}
