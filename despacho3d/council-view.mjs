import {COUNCIL_ROLES,AUTON_STAGES,STAGE_LABELS,COUNCIL_STATES,validateCouncil} from './council-model.mjs?v=2';
export function mountCouncil({container,request,getCase,canWrite=()=>false,onState=()=>{},doc=document,uuid=()=>crypto.randomUUID()}){
 let epoch=0,caseId=null,model=null,selected=null,pending=null,busy=false,notice='',draft='';
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
 const current=()=>caseId&&caseId===getCase();
 function paint(){
  container.replaceChildren();if(!current())return;
  const title=el('header');title.append(el('small','SALA DE JUNTAS'),el('h2','Consejo del autón'),el('p','El mismo proyecto, su historia y el siguiente entregable.'));
  const roster=el('div',undefined,'council-roster');
  for(const role of COUNCIL_ROLES){const card=el('div',undefined,'council-member');card.style.setProperty('--council-color',role.color);card.append(el('span','◉','council-portrait'),el('strong',role.name),el('small',role.question));roster.append(card);}
  container.append(title,roster);
  const status=el('p',notice,'council-notice');status.setAttribute('role','status');container.append(status);
  const refresh=button(busy?'Consultando…':'Actualizar consejo',()=>void read());refresh.disabled=busy;container.append(refresh);
  if(!model)return;
  const life=model.lifecycle;
  const timeline=el('section',undefined,'council-lifecycle');timeline.setAttribute('aria-label','Historia del autón');
  timeline.append(el('h3','Un autón · una historia'),el('small','Expediente: '+model.case_id),el('p','Etapa registrada en el consejo: '+STAGE_LABELS[life?.stage||'unconfirmed']));
  const stages=el('ol',undefined,'council-stages');stages.setAttribute('aria-label','Etapa actual registrada del autón');
  for(const stage of AUTON_STAGES){const n=el('li',STAGE_LABELS[stage]);if(life?.stage===stage)n.setAttribute('aria-current','step');stages.append(n);}timeline.append(stages);
  timeline.append(el('p','La etapa comercial del PPP todavía no está vinculada a este registro.','council-note'));
  if(life?.events.length){
   const details=el('details'),summary=el('summary','Historial de etapas · '+life.events.length);details.append(summary);
   const history=el('ol',undefined,'council-history');
   for(const event of [...life.events].reverse()){
    const item=el('li');item.append(el('strong',event.kind==='initial_registration'?'Registro inicial: '+STAGE_LABELS[event.to]:STAGE_LABELS[event.from]+' → '+STAGE_LABELS[event.to]));
    const date=el('time',new Intl.DateTimeFormat('es-MX',{timeZone:'America/Hermosillo',dateStyle:'medium',timeStyle:'short'}).format(new Date(event.at))+' · Hermosillo');date.setAttribute('datetime',event.at);
    item.append(date,el('small','Registró: '+event.actor),el('p',event.reason),el('small','Referencia declarada: '+event.source_ref));history.append(item);
   }
   details.append(history);timeline.append(details);
  }else timeline.append(el('p','Aún no hay cambios de etapa registrados.'));
  container.append(timeline);
  const s=model.sessions.find(x=>x.id===selected)||model.sessions.at(-1);if(!s){container.append(el('p','Todavía no hay una entrega recibida por el consejo. Las nuevas entregas aparecerán cuando el motor esté conectado.'));return;}
  selected=s.id;
  const selector=el('select');selector.setAttribute('aria-label','Reunión del consejo');for(const x of [...model.sessions].reverse()){const o=el('option',x.title+' · '+COUNCIL_STATES[x.state]);o.value=x.id;o.selected=x.id===s.id;selector.append(o);}selector.onchange=()=>{selected=selector.value;draft='';paint();};container.append(selector);
  container.append(el('small','Etapa al presentar: '+STAGE_LABELS[s.stage]+' · Revisión '+s.revision),el('h3',s.title),el('strong',COUNCIL_STATES[s.state]),el('p',s.summary||'Esperando revisión con evidencia.'));
  const reviews=el('div',undefined,'council-reviews');for(const r of s.reviews){const c=el('article');c.append(el('strong',COUNCIL_ROLES.find(x=>x.id===r.role).name+' · ronda '+r.round),el('small',{pass:'Conforme',revise:'Solicita corrección',needs_input:'Falta información'}[r.verdict]),el('p',r.comment),el('small',r.evidence_ids.length?'Evidencia: '+r.evidence_ids.join(', '):'Sin evidencia citada'));reviews.append(c);}container.append(reviews);
  if(s.tasks.length){container.append(el('h3','Tareas devueltas al autón'));const list=el('ul');for(const t of s.tasks)list.append(el('li',t.title+' — '+t.criterion+' · '+({pending:'pendiente',resolved:'resuelta',needs_input:'necesita información'}[t.state])));container.append(list);}
  for(const f of s.feedback)container.append(el('blockquote',f.text));
  const form=el('form'),label=el('label','Tus observaciones'),input=el('textarea');input.maxLength=4000;input.required=true;input.value=draft;input.setAttribute('aria-label','Tus observaciones al consejo');input.oninput=()=>{draft=input.value;};label.append(input);
  const send=el('button',pending?'Comprobar el mismo envío':'Devolver al consejo');send.type='submit';send.disabled=busy||!canWrite();input.disabled=!!pending||busy;
  form.append(label,send);form.onsubmit=e=>{e.preventDefault();void mutate('feedback',draft);};container.append(form);
  const accept=button('Aceptar esta entrega',()=>void mutate('accept',''));accept.disabled=busy||!!pending||!canWrite()||s.state!=='ready';container.append(accept);
  container.append(el('p','Aceptar esta entrega conserva el expediente y no cambia su etapa comercial.','council-note'),el('small','Correo: '+({not_configured:'conexión pendiente',pending:'por enviar',sent:'envío confirmado',uncertain:'envío sin confirmar'}[s.notification.state])));
 }
 async function read(){
  if(busy||!current())return false;const own=epoch;busy=true;notice='Consultando el registro del consejo…';paint();
  try{const v=validateCouncil(await request('/council/read',{}),caseId);if(own!==epoch||!current())return false;model=v;notice=pending?'Hay un envío sin confirmar. Comprueba la misma solicitud.':'';onState(model.sessions.at(-1)||null);return true;}
  catch{if(own===epoch){model=null;notice='El consejo todavía no responde. La entrega y el trabajo del autón se conservan.';onState(null);}return false;}
  finally{if(own===epoch){busy=false;paint();}}
 }
 async function mutate(action,text){
  if(busy||!current()||!canWrite())return false;const s=model?.sessions.find(x=>x.id===selected);if(!s)return false;
  if(!pending&&action==='feedback'&&!text.trim())return false;
  const own=epoch;pending??={request_id:uuid(),session_id:s.id,expected_revision:s.revision,action,text:text.trim()};busy=true;notice='Guardando la misma solicitud…';paint();
  try{const out=await request('/council/respond',pending);if(own!==epoch||!current())return false;if(out.request_id!==pending.request_id)throw Error('uncertain');model=validateCouncil(out,caseId);pending=null;draft='';notice='Observaciones guardadas.';onState(model.sessions.at(-1)||null);return true;}
  catch(e){if(own===epoch){if(['stale_revision','invalid_state','invalid_request','forbidden','new_delivery_required','request_id_reused'].includes(e.message)){pending=null;notice='La reunión cambió o no admite esta acción. Actualiza antes de responder.';}else notice='Guardado sin confirmar. Comprobar conserva el mismo envío.';}return false;}
  finally{if(own===epoch){busy=false;paint();}}
 }
 return {open(id){if(id!==getCase())return false;if(caseId!==id){this.clear();caseId=id;}paint();void read();return true;},refresh:()=>container.contains(doc.activeElement)?Promise.resolve(false):read(),clear(){epoch++;caseId=null;model=null;selected=null;pending=null;busy=false;draft='';container.replaceChildren();onState(null);}};
}
