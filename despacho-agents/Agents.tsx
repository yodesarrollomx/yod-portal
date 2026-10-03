// Adapted from Cubefarm 0.3.2 Phone/TerminalView/KanbanView. MIT © 2026 Leon van Zyl.
// Business records only come from the existing authorized Sheets transport.
import {useEffect, useState, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {MessageBox} from './vendor/cubefarm/MessageBox';
import {Markdown} from './vendor/cubefarm/Markdown';
import {validateDriveSelection} from '../despacho3d/drive-selection.mjs';
import {Conversation,createFrameTransport} from '../despacho3d/conversation.mjs';
import {watchConversation} from '../despacho3d/conversation-watch.mjs';

const labels:Record<string,string>={disconnected:'Conexión pendiente',loading:'Cargando expediente…',ready:'Historial recuperado',processing:'Mensaje guardado · esperando respuesta',sending:'Guardando mensaje…',unconfirmed:'Guardado sin confirmar',conflict:'El expediente cambió · vuelve a leerlo',unavailable:'No se pudo conectar con el expediente'};
function connectionNotice(d:any){
 if(!d)return '';
 if(d.code==='unauthorized')return 'Tu sesión no autoriza este expediente. Revisa la cuenta con la que entraste a YOD OS.';
 if(d.code==='outside_os')return 'Abre la oficina dentro de YOD OS para usar su sesión.';
 if(d.code==='session_changed')return 'La sesión cambió. Vuelve a entrar a la oficina desde YOD OS.';
 if(d.code==='timeout')return 'La conexión tardó demasiado. Pulsa Reintentar conexión.';
 if(d.code==='despacho_not_ready')return 'El servidor aún no puede cargar el expediente. Falta revisar su preparación.';
 if(['invalid_selection','invalid_snapshot','invalid_message','invalid_job','invalid_event','seleccion_invalida','enlace_invalido'].includes(d.code))return 'El servidor respondió, pero el expediente o historial no tiene el formato esperado.';
 return 'La conexión con YOD OS no respondió. Pulsa Reintentar conexión.';
}

type Tab='chat'|'activity'|'plan';
let overlayOpen=false;
function inertWorld(value:boolean){const header=document.querySelector('header'),world=document.getElementById('workspace');if(header)header.inert=value;if(world)world.inert=value;}
type RecordRow={id:string,title:string,body:string,url?:string};
type Snapshot={case_id:string,revision:string,updated_at:string,events:RecordRow[],decisions:RecordRow[],messages:{id:string,role:string,body:string,created_at:string}[],processing:boolean};
declare global {interface Window {CubefarmYOD?:{open:(tab?:Tab)=>void,close:()=>void,isOpen:()=>boolean}}}
const tabs:[Tab,string,string][]=[['chat','◉','Conversación'],['activity','⌨','Actividad'],['plan','▦','Plan']];
function App(){
 const [selection,setSelection]=useState<{name:string,url:string}|null>(null),[choosing,setChoosing]=useState(false),[selectionError,setSelectionError]=useState('');
 const links={chat:selection?.url||'terreno.html',activity:selection?.url||'terreno.html',plan:selection?.url||'terreno.html',decisions:selection?.url||'terreno.html'};
 const name=selection?.name||'Mi terreno';
 const [opened,setOpened]=useState(false),[tab,setTab]=useState<Tab>('chat'),[status,setStatus]=useState('disconnected'),[model,setModel]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [waitingLong,setWaitingLong]=useState(false);
 const rootRef=useRef<HTMLDivElement>(null),focusRef=useRef<HTMLElement|null>(null),transportRef=useRef<any>(null),conversation=useRef<any>(null);
 if(!conversation.current)conversation.current=new Conversation({transport:()=>transportRef.current,notify:(c:any)=>{setModel(c.model);setBusy(c.busy);setStatus(c.status);if(c.selection)setSelection(c.selection);}});
 const read=()=>conversation.current.selection?conversation.current.refresh():conversation.current.open();
 const send=async(e:React.FormEvent)=>{e.preventDefault();if(await conversation.current.send(message))setMessage('');};
 const close=()=>{overlayOpen=false;inertWorld(false);conversation.current.close();setOpened(false);setChoosing(false);setSelection(null);setMessage('');window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:false}));(focusRef.current?.isConnected&&focusRef.current.getClientRects().length?focusRef.current:document.getElementById('agents-open'))?.focus();};
 useEffect(()=>{transportRef.current=createFrameTransport(window);return()=>{conversation.current.close();transportRef.current?.dispose();};},[]);
 useEffect(()=>{setWaitingLong(false);if(!opened||!model?.processing)return;return watchConversation(conversation.current,{visible:()=>document.visibilityState!=='hidden',onLimit:()=>setWaitingLong(true)});},[opened,model?.processing]);
 useEffect(()=>{
  window.CubefarmYOD={open:(next='chat')=>{focusRef.current=document.activeElement as HTMLElement;overlayOpen=true;inertWorld(true);setTab(next);setOpened(true);window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:true}));void read();},close,isOpen:()=>overlayOpen};
  const trigger=document.getElementById('agents-open') as HTMLButtonElement|null;if(trigger){trigger.disabled=false;trigger.onclick=()=>window.CubefarmYOD?.open();}
  return()=>{delete window.CubefarmYOD;if(trigger){trigger.disabled=true;trigger.onclick=null;}};
 },[]);
 useEffect(()=>{
  if(!opened)return;if(choosing)rootRef.current?.querySelector<HTMLInputElement>('.drive-choice input')?.focus();else rootRef.current?.querySelector<HTMLButtonElement>('.panel-x')?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key.toLowerCase().startsWith('arrow')?e.key:e.key.toLowerCase()))e.stopImmediatePropagation();if(e.key!=='Tab')return;const nodes=[...rootRef.current!.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled)')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}};
  window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
 },[opened,tab,choosing]);
 useEffect(()=>{const stop=()=>close();window.addEventListener('pagehide',stop);return()=>window.removeEventListener('pagehide',stop);},[]);
 if(!opened)return null;
 const choose=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const data=new FormData(e.currentTarget);try{setSelection(validateDriveSelection({name:data.get('name'),url:data.get('url')}));setChoosing(false);setSelectionError('');}catch{setSelectionError('Usa un enlace válido de Google Sheets o Drive y un nombre de hasta 120 caracteres.');}};
 return <div ref={rootRef} className={`overlay ${tab==='chat'?'phone-overlay':''}`} role="dialog" aria-modal="true" aria-label="Agentes del Despacho" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}>
  <div className={tab==='chat'?'phone':'panel panel-wide'}>
   {tab==='chat'?<div className="phone-status"><span>YoDesarrollo</span><span className="phone-notch"/><button className="panel-x" aria-label="Cerrar agentes" onClick={close}>×</button></div>:<div className="panel-head"><div className="panel-title">{name}</div><button className="panel-x" aria-label="Cerrar agentes" onClick={close}>×</button></div>}
   <div className={tab==='chat'?'phone-screen':'panel-body'}>
    {tab==='chat'&&<div className="phone-chat">
     <div className="chat-head"><span className="avatar">T</span><div className="grow"><b>{name}</b><div className="muted small">Terreno · Plan de Potencial</div></div><span className="connection-label">Sheets</span></div>
     <div className="conversation-status" role="status">{labels[status]||status}</div>
     {status==='unavailable'&&<p className="conversation-notice" role="alert">{connectionNotice(conversation.current.diagnostic)} <span className="muted small">Paso: {conversation.current.diagnostic?.step||'conexión'}.</span></p>}
     <div className="chat-log" role="log" aria-label="Conversación del expediente">
      {model?.messages.map(row=><article className={`case-message case-message-${row.role}`} key={row.id}><b>{row.role==='user'?'Tú':name}</b><p>{row.body}</p><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('es-MX')}</time></article>)}
      {model&&!model.messages.length&&<p className="phone-empty">Todavía no hay mensajes guardados en este expediente.</p>}
      {!model&&<div className="phone-empty"><p>{busy?'Estoy cargando el expediente privado y su conversación.':'La conexión privada del expediente todavía no está disponible.'}</p><p className="muted">Al conectarse, la conversación se recuperará aquí desde Sheets.</p><button className="btn" disabled={busy} onClick={()=>void read()}>Reintentar conexión</button><button className="btn" onClick={()=>setChoosing(true)}>Abrir expediente manualmente</button>{selection&&<a className="btn sheet-link" href={links.chat} target="_blank" rel="noopener noreferrer">Abrir en Sheets</a>}</div>}
     </div>
     {model&&<div className="conversation-tools"><button type="button" className="btn" disabled={busy} onClick={()=>void read()}>Actualizar</button><a className="btn" href={links.chat} target="_blank" rel="noopener noreferrer">Ver en Sheets</a></div>}
     {status==='ready'&&conversation.current.stoppedMessage&&<div className="conversation-notice" role="alert"><p>Tu último mensaje se detuvo y quedó sin respuesta.</p><button type="button" className="btn" disabled={busy||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue} onClick={()=>void conversation.current.retryStopped()}>Volver a enviar</button></div>}
     {waitingLong&&status==='processing'&&<p className="conversation-notice" role="alert">La respuesta tarda más de lo esperado. Tu mensaje está guardado. Pulsa Actualizar para consultar su estado; no hace falta enviarlo otra vez.</p>}
     {status==='unconfirmed'&&<p className="conversation-notice" role="alert">No se ha confirmado el guardado. Reintentar conserva el mismo mensaje y su identificador.</p>}
     {model&&!conversation.current.selection?.agent_ready&&<p className="conversation-notice">El motor necesita conectarse antes de enviar mensajes.</p>}
     <form className="chat-input" onSubmit={send}><MessageBox value={message} onChange={setMessage} maxLength={8000} disabled={busy||status!=='ready'||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue} placeholder={status==='processing'?'Esperando la respuesta…':'Escribe al terreno'} aria-label="Mensaje directo al terreno"/><button className="btn btn-small" disabled={busy||(!conversation.current.pending&&(!message.trim()||status!=='ready'))||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue}>{status==='unconfirmed'?'Reintentar':'Enviar'}</button></form>
    </div>}
    {tab==='activity'&&<><div className="term-meta"><span className="avatar">T</span><span>{name}</span><span className="chip">{labels[status]||status}</span></div><div className="term-split"><div className="term" role="log" aria-label="Actividad del expediente">{!model&&<div className="term-line term-system">La actividad se consulta en Sheets. No hay una terminal de ejecución conectada.</div>}{model&&model.events.length===0&&<div className="term-line">Sin eventos en la lectura recibida.</div>}{model?.events.map(r=><div className="term-line" key={r.id}><b>{r.title}</b><div>{r.body}</div></div>)}</div></div><div className="term-actions"><a className="btn" href={links.activity} target="_blank" rel="noopener noreferrer">Ver actividad en Sheets</a><button className="btn" disabled={busy} onClick={()=>void read()}>Releer expediente</button></div><p className="muted small">Revisión automática por hora pausada. La ejecución debe comprobarse antes de activarla.</p>{model&&<p className="muted small">Revisión {model.revision} · {model.updated_at}</p>}</>}
    {tab==='plan'&&<><div className="kanban-toolbar"><a className="btn btn-good" href={links.plan} target="_blank" rel="noopener noreferrer">Abrir control del caso en Sheets</a><span className="muted">{model?'Decisiones recibidas del expediente':'Estados pendientes de lectura directa'}</span></div><div className="kanban">{[['Por aclarar','backlog'],['Preparado','progress'],['En curso','qa'],['Tu revisión','review']].map(([title,style])=><div className={`kcol kcol-${style}`} key={title}><div className="kcol-head">{title} <span className="count">{title==='Tu revisión'&&model?model.decisions.length:'—'}</span></div><div className="kcol-body">{title==='Tu revisión'&&model?model.decisions.length?model.decisions.map(r=><div className="kcard" key={r.id}><div className="kcard-title">{r.title}</div><Markdown text={r.body}/></div>):<div className="muted kempty">Sin decisiones en la lectura recibida.</div>:<div className="muted kempty">Consulta el estado registrado en Sheets.</div>}</div></div>)}</div><p className="muted small">El panel muestra decisiones para revisión. No aprueba ni ejecuta acciones al abrirlas.</p></>}
   </div>
   <nav className="phone-tabs" aria-label="Paneles del terreno">{tabs.map(([key,icon,label])=><button key={key} className={`phone-tab ${tab===key?'phone-tab-on':''}`} aria-pressed={tab===key} onClick={()=>setTab(key)}><span className="phone-tab-icon" aria-hidden="true">{icon}</span><span>{label}</span></button>)}</nav>
   {choosing&&<form className="drive-choice" onSubmit={choose}><label>Nombre del terreno<input name="name" maxLength={120} defaultValue={selection?.name} required/></label><label>Enlace de Sheets o Drive<input name="url" type="url" defaultValue={selection?.url} required placeholder="https://docs.google.com/..."/></label><p className="muted small">La selección sólo dura mientras está abierta esta oficina. Los datos siguen en Drive.</p>{selectionError&&<p role="alert">{selectionError}</p>}<button className="btn btn-good">Elegir</button><button className="btn" type="button" onClick={()=>setChoosing(false)}>Cancelar</button></form>}<div className="phone-hint"><a href="third-party/cubefarm/LICENSE.txt" target="_blank" rel="noopener noreferrer">Interfaz basada en Cubefarm</a><span> · </span><button className="attribution-close" onClick={close}>Volver al Despacho</button></div>
  </div>
 </div>;
}
createRoot(document.getElementById('cubefarm-agents')!).render(<App/>);
