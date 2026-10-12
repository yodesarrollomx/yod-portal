import {validateDelivery,proposalsCSV} from '../reuniones/delivery.mjs';
import {normalizeMeeting} from '../reuniones/archive-contract.mjs';
export function mountMeetingArchive({container,request,getCase,doc=document}) {
 const el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const root=el('section'),notice=el('p','El archivo se consulta con tu acceso al expediente.'),list=el('div'),review=el('div');
 root.setAttribute('aria-label','Archivo de reuniones');root.append(el('h2','Historial de reuniones'),notice,list);
 const input=el('input');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','Ficha de reunión entregada por el asistente');
 const label=el('label','Incorporar ficha de reunión (.json)');label.append(input);root.append(label,review);container.append(root);
 let generation=0,caseId=null,revision=null,delivery=null,busy=false;
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=()=>Promise.resolve(fn()).catch(e=>{notice.textContent=e.message;});return b;};
 const current=own=>own===generation&&caseId&&getCase()===caseId;
 async function load(){
  const own=generation;if(!caseId)return;revision=null;
  try{const value=await request('/fast/knowledge/meetings',{});if(!current(own))return;
   if(value.ok!==true||value.case_id!==caseId||!/^\d+$/.test(value.revision)||!Array.isArray(value.meetings))throw Error('No se confirmó el archivo del proyecto.');
   revision=value.revision;list.replaceChildren();
   for(const item of value.meetings){const {schema,record_id,recorded_at,...raw}=item;const m=normalizeMeeting(raw,caseId),card=el('article');card.className='workspace-card';card.append(el('h3',m.title),el('p',m.occurred_at||'Fecha de reunión sin confirmar'),el('p',m.summary));
    for(const [key,text]of [['archive_url','Archivo privado'],['minutes_url','Minuta'],['transcript_url','Transcripción']]){const a=el('a',text+' ↗');a.href=m[key];a.target='_blank';a.rel='noopener noreferrer';card.append(a,el('span',' · '));}list.append(card);
   }
   notice.textContent=value.meetings.length?'Reuniones archivadas en la memoria privada del proyecto.':'Todavía no hay reuniones archivadas en este proyecto.';
  }catch(e){if(current(own))notice.textContent='No se pudo confirmar el archivo. Conserva la ficha y vuelve a intentar.';}
 }
 function paintReview(){
  review.replaceChildren();if(!delivery)return;
  const own=generation,d=delivery,selected=new Set();review.append(el('h3',d.meeting.title),el('p',d.initial?'Plática inicial: al incorporarla la vincularás a este proyecto, conservando su identificador original.':'Proyecto de la ficha comprobado.'));
  const save=button(d.initial?'Vincular y archivar en este proyecto':'Archivar en el expediente',async()=>{
   if(!current(own)||busy)return;busy=true;save.disabled=true;
   try{await load();if(!current(own)||revision===null)throw Error('Consulta el archivo antes de guardar.');
    const value=await request('/fast/knowledge/meeting',{meeting:d.meeting,expected_revision:revision});if(!current(own))return;
    if(value.ok!==true||value.case_id!==caseId||value.meeting_id!==d.meeting.meeting_id||value.status!=='archived'||value.storage!=='private_server'||!value.record_id)throw Error('Archivo sin confirmar. Reintenta con la misma ficha.');
    await load();if(current(own))notice.textContent='Reunión archivada con el agente del proyecto. Los pendientes siguen por autorizar en MOAC.';
   }finally{busy=false;if(current(own))save.disabled=false;}
  });review.append(save,el('h3','Pendientes propuestos · revisar antes de MOAC'));
  for(const p of d.proposals){const label=el('label'),check=el('input');check.type='checkbox';check.onchange=()=>check.checked?selected.add(p.id):selected.delete(p.id);label.append(check,el('span',p.action+' · '+(p.owner||'Sin asignar')+' · '+(p.due_date||'Sin fecha acordada')),el('blockquote','['+Math.floor(p.start/60)+':'+String(Math.floor(p.start%60)).padStart(2,'0')+'] '+p.quote));review.append(label);}
  review.append(button('Descargar lista para autorizar en MOAC',()=>{if(!current(own))return;const csv=proposalsCSV(d,[...selected]);const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=el('a');a.href=url;a.download=d.meeting.meeting_id+'-para-moac.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);notice.textContent='Lista preparada. No se han creado ni autorizado acciones en MOAC.';}));
 }
 input.onchange=async()=>{const own=generation;try{const file=input.files[0];if(!file)return;if(file.size>200000)throw Error('La ficha supera el tamaño permitido.');const text=await file.text();if(!current(own))return;delivery=validateDelivery(JSON.parse(text),caseId);paintReview();}catch(e){if(current(own)){delivery=null;review.replaceChildren();notice.textContent=e.message;}}finally{input.value='';}};
 return {open(id){if(caseId!==id){this.clear();caseId=id;}void load();},clear(){generation++;caseId=null;revision=null;delivery=null;busy=false;list.replaceChildren();review.replaceChildren();input.value='';notice.textContent='El archivo se consulta con tu acceso al expediente.';},destroy(){this.clear();root.remove();}};
}
