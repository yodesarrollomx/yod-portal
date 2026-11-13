import {crearActividad,ETIQUETAS} from './actividad.mjs?v=1';

// Ejercicio independiente: siempre sintético, sin perfil, red ni respaldo.
const sequence=['solicitado','iniciado','llego','trabajando','esperando_revision','terminado'];
const actions=['Solicitar actividad','Iniciar recorrido','Confirmar llegada','Comenzar trabajo','Preparar entrega','Confirmar resultado'];
const kinds={solicitado:'request',iniciado:'movement',llego:'movement',trabajando:'work',esperando_revision:'result',terminado:'result',fallido:'error',cancelado:'cancel'};
const explanations={
 solicitado:'La solicitud de prueba tiene un ID. Todavía no empezó el recorrido.',
 iniciado:'Comenzó el recorrido de prueba. Llegar y trabajar son pasos distintos.',
 llego:'Llegó a Biblioteca en el ejemplo. La consulta todavía no está terminada.',
 trabajando:'La herramienta de prueba está preparando una respuesta.',
 esperando_revision:'La entrega RESULT-DEMO-001 está lista para revisión.',
 terminado:'La misma entrega tiene un resultado confirmado en este ejemplo.',
 fallido:'El intento terminó con un fallo de prueba. No hay resultado terminado.',
 cancelado:'La actividad de prueba fue cancelada. Un evento posterior no puede revivirla.'
};
function node(doc,tag,text,attrs={}){const n=doc.createElement(tag);n.textContent=text;for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
export function montarDemo({doc=document,root=doc.getElementById('activity-demo')}={}){
 let ledger,last=null,round=0,notice='Elige Solicitar actividad para comenzar.',backups=0;
 const status=node(doc,'section','',{class:'activity-status','aria-label':'Estado de la actividad'});
 const heading=node(doc,'h2',''),detail=node(doc,'p',''),identity=node(doc,'p','',{class:'activity-id'}),backup=node(doc,'p','',{class:'activity-backup'});
 status.appendChild(heading);status.appendChild(detail);status.appendChild(identity);status.appendChild(backup);
 const live=node(doc,'p','',{role:'status',class:'activity-notice'});
 const buttons=node(doc,'div','',{class:'activity-actions'});
 const next=node(doc,'button','',{type:'button'}),retry=node(doc,'button','Reintentar último evento',{type:'button'}),cancel=node(doc,'button','Cancelar actividad',{type:'button'}),fault=node(doc,'button','Simular fallo',{type:'button'}),late=node(doc,'button','Probar evento tardío',{type:'button'}),reset=node(doc,'button','Reiniciar prueba',{type:'button'});
 for(const b of [next,retry,cancel,fault,late,reset])buttons.appendChild(b);
 const list=node(doc,'ol','',{'aria-label':'Eventos de la prueba',class:'activity-events'});
 root.appendChild(status);root.appendChild(live);root.appendChild(buttons);root.appendChild(node(doc,'h2','Eventos de la prueba'));root.appendChild(list);
 function nuevo(){round++;ledger=crearActividad({mode:'synthetic',activity:{schema:1,activity_id:'ACT-DEMO-'+round,case_id:'CASE-DEMO',request_id:'REQ-DEMO-'+round,actor_id:'ACTOR-DEMO',space_id:'biblioteca',operation:'consulta',requires_arrival:true,created_at:'2026-01-01T00:00:00.000Z',expected_revision:'REV-DEMO',links:{job_id:'JOB-DEMO'}}});last=null;backups=0;}
 function event(kind){const s=ledger.leer();return {schema:1,event_id:'EVT-DEMO-'+round+'-'+(s.events.length+1),activity_id:s.activity.activity_id,case_id:s.activity.case_id,sequence:s.events.length+1,kind,source:'simulator',created_at:new Date(Date.UTC(2026,0,1,0,0,s.events.length+1)).toISOString(),evidence:{scope:'synthetic',kind:kinds[kind],ref:['esperando_revision','terminado'].includes(kind)?'RESULT-DEMO-001':'PROOF-DEMO-'+kind},...(['fallido','cancelado'].includes(kind)?{code:kind==='fallido'?'tool_failed':'cancelled'}:{})};}
 function avanzar(){const s=ledger.leer(),kind=sequence[s.events.length];if(!kind)return;last=event(kind);ledger.aplicar(last);notice=explanations[kind];pintar();}
 function pintar(){
  const s=ledger.leer(),terminal=['terminado','fallido','cancelado'].includes(s.state),pos=sequence.indexOf(s.state);
  root.setAttribute('data-state',s.state||'inicio');root.setAttribute('data-event-count',String(s.events.length));root.setAttribute('data-receipt-scope','synthetic');
  heading.textContent=s.state?ETIQUETAS[s.state]:'Actividad por iniciar';detail.textContent=explanations[s.state]||'Consulta de ejemplo en Biblioteca.';
  identity.textContent='Actividad '+s.activity.activity_id+' · '+s.events.length+(s.events.length===1?' evento':' eventos')+' · '+backups+' duplicados añadidos';
  backup.textContent='Datos de prueba · Sin respaldo del servidor';live.textContent=notice;
  next.textContent=terminal?'Actividad finalizada':actions[pos+1];next.disabled=terminal;retry.disabled=!last;cancel.disabled=!s.state||terminal;fault.disabled=!s.state||terminal;late.disabled=!terminal;
  while(list.firstChild)list.removeChild(list.firstChild);
  for(const e of s.events)list.appendChild(node(doc,'li',e.sequence+'. '+ETIQUETAS[e.kind]+' · '+e.event_id+' · Evidencia sintética'+(['esperando_revision','terminado'].includes(e.kind)?' · '+e.evidence.ref:'')));
 }
 next.addEventListener('click',avanzar);
 retry.addEventListener('click',()=>{const before=ledger.leer().events.length;const receipt=ledger.aplicar(last);backups+=ledger.leer().events.length-before;notice=receipt.duplicate?'Reintento reconocido: mismo ID, ningún evento duplicado.':'Evento añadido.';pintar();});
 for(const[b,kind]of [[cancel,'cancelado'],[fault,'fallido']])b.addEventListener('click',()=>{last=event(kind);ledger.aplicar(last);notice=explanations[kind];pintar();});
 late.addEventListener('click',()=>{try{ledger.aplicar(event('trabajando'));notice='Evento añadido.';}catch{notice='Evento tardío rechazado. Estado conservado: '+ETIQUETAS[ledger.leer().state]+'.';}pintar();});
 reset.addEventListener('click',()=>{nuevo();notice='Prueba reiniciada con otro ID. No ejecutó una actividad real.';pintar();});
 nuevo();pintar();return {leer:()=>ledger.leer()};
}
