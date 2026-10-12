import {validateDelivery,proposalsCSV} from './delivery.mjs';
export function mountReview(container,getCase=()=>null){
 const el=(t,text)=>{const n=document.createElement(t);if(text!==undefined)n.textContent=text;return n;};
 const heading=el('h2','Pendientes de la reunión · para revisar en MOAC'),input=el('input'),notice=el('p'),list=el('div');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','Importar ficha de resultados de la reunión');
 container.append(heading,el('p','Al procesar el audio, el asistente entrega una ficha JSON con la minuta y los pendientes propuestos. Ábrela aquí; no necesitas crear un PPP.'),input,notice,list);
 input.onchange=async()=>{list.replaceChildren();try{const f=input.files[0];if(!f)return;if(f.size>200000)throw Error('La ficha es demasiado grande.');const d=validateDelivery(JSON.parse(await f.text()),getCase()),selected=new Set();notice.textContent=d.meeting.title+' · '+(d.meeting.case_id||'Sin PPP');
  for(const p of d.proposals){const row=el('label'),check=el('input');check.type='checkbox';check.style.width='auto';check.onchange=()=>check.checked?selected.add(p.id):selected.delete(p.id);row.append(check,el('strong',p.action),el('p',(p.owner||'Sin asignar')+' · '+(p.due_date||'Sin fecha acordada')),el('blockquote','['+Math.floor(p.start/60)+':'+String(Math.floor(p.start%60)).padStart(2,'0')+'] '+p.quote));list.append(row);}
  if(!d.proposals.length)list.append(el('p','No se identificaron pendientes propuestos en esta ficha.'));
  const b=el('button','Descargar seleccionados para autorizar en MOAC');b.onclick=()=>{try{const data=proposalsCSV(d,[...selected]);const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'})),a=el('a');a.href=url;a.download=d.meeting.meeting_id+'-para-moac.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);notice.textContent='Lista preparada para revisión. Ninguna acción ha sido creada o aprobada en MOAC.';}catch(e){notice.textContent=e.message;}};list.append(b);
 }catch(e){notice.textContent=e.message;}finally{input.value='';}};
}
