// Adapted from Cubefarm 0.3.2 Phone/TerminalView/KanbanView. MIT © 2026 Leon van Zyl.
// Business records only come from the existing authorized Sheets transport.
import {useEffect, useState, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {MessageBox} from './vendor/cubefarm/MessageBox';
import {Conversation,createFrameTransport} from '../despacho3d/conversation.mjs';
import {createProfileSession} from '../despacho3d/profile-session.mjs';
import {TerminalLink} from '../despacho3d/terminal-link.mjs';
import {TerminalPanel} from './TerminalPanel';
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

type Tab='chat'|'dossier'|'activity'|'plan'|'terminal';
type Profile={id:string,case_id:string,entity_kind:'case',name:string,form:string,color:string,visual:Record<string,string>};
type RecordRow={id:string,title:string,body:string};
type MemoryRow={id:string,title:string,body:string,evidence:string,next:string,url:string|null};
type DocumentRow={id:string,source_id:string,title:string,source:string,role:string,url:string|null};
type Snapshot={case_id:string,revision:string,updated_at:string,events:RecordRow[],memory:MemoryRow[],documents:DocumentRow[],messages:{id:string,role:string,body:string,created_at:string}[],processing:boolean};
type AgentAPI={open:(tab?:Tab)=>boolean,close:()=>void,isOpen:()=>boolean,getProfile:()=>Profile|null,subscribeProfile:(fn:(profile:Profile|null)=>void)=>()=>void,openForCase:(id:string)=>boolean};
declare global {interface Window {CubefarmYOD?:AgentAPI}}
const tabs:[Tab,string,string][]=[['chat','◉','Conversación'],['dossier','▤','Expediente'],['activity','⌨','Actividad'],['terminal','>_','Terminal'],['plan','▦','Plan']];
let overlayOpen=false;
function inertWorld(value:boolean){const header=document.querySelector('header'),world=document.getElementById('workspace');if(header)header.inert=value;if(world)world.inert=value;}
function App(){
 const [selection,setSelection]=useState<{name:string,url:string}|null>(null);
 const [opened,setOpened]=useState(false),[tab,setTab]=useState<Tab>('chat'),[status,setStatus]=useState('disconnected'),[model,setModel]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false);
 const [terminalState,setTerminalState]=useState<any>({status:'disconnected',runtime:null,error:''});
 const terminalLink=useRef<any>(null);
 const [message,setMessage]=useState(''),[waitingLong,setWaitingLong]=useState(false);
 const rootRef=useRef<HTMLDivElement>(null),focusRef=useRef<HTMLElement|null>(null),transportRef=useRef<any>(null),conversation=useRef<any>(null),session=useRef<any>(null);
 if(!conversation.current)conversation.current=new Conversation({transport:()=>transportRef.current,notify:(c:any)=>{setModel(c.model);setBusy(c.busy);setStatus(c.status);setSelection(c.selection);}});
 if(!terminalLink.current)terminalLink.current=new TerminalLink({getProfile:()=>conversation.current.getProfile(),notify:setTerminalState});
 const read=()=>session.current?.read();
 const send=async(e:React.FormEvent)=>{e.preventDefault();if(await conversation.current.send(message))setMessage('');};
 const close=()=>session.current?.close();
 useEffect(()=>{
  transportRef.current=createFrameTransport(window);
  const current=createProfileSession(conversation.current,{
   show:(next:Tab)=>{if(!overlayOpen)focusRef.current=document.activeElement as HTMLElement;overlayOpen=true;inertWorld(true);setTab(tabs.some(([key])=>key===next)?next:'chat');setOpened(true);window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:true}));},
   hide:()=>{const wasOpen=overlayOpen;overlayOpen=false;inertWorld(false);setOpened(false);setSelection(null);setMessage('');window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:false}));if(wasOpen)(focusRef.current?.isConnected&&focusRef.current.getClientRects().length?focusRef.current:document.getElementById('agents-open'))?.focus();}
  });
  session.current=current;window.CubefarmYOD=current;
  const stopProfile=current.subscribeProfile(()=>terminalLink.current.revoke());
  const trigger=document.getElementById('agents-open') as HTMLButtonElement|null;
  if(trigger){trigger.disabled=false;trigger.onclick=()=>current.open();}
  window.dispatchEvent(new CustomEvent('yod-agents-ready'));
  void current.hydrate();
  const stop=()=>{current.dispose();terminalLink.current.dispose();};
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',restore);
  return()=>{stopProfile();terminalLink.current.dispose();window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',restore);current.dispose();transportRef.current?.dispose();delete window.CubefarmYOD;if(trigger){trigger.disabled=true;trigger.onclick=null;}};
 },[]);
 useEffect(()=>{setWaitingLong(false);if(!opened||!model?.processing)return;return watchConversation(conversation.current,{visible:()=>document.visibilityState!=='hidden',onLimit:()=>setWaitingLong(true)});},[opened,model?.processing]);
 useEffect(()=>{
  if(!opened)return;rootRef.current?.querySelector<HTMLButtonElement>('.panel-x')?.focus();
  const key=(e:KeyboardEvent)=>{
   if(tab==='terminal'&&(e.target as HTMLElement)?.closest('.xterm')){if(e.ctrlKey&&e.shiftKey&&e.code==='KeyX'){e.preventDefault();close();}return;}
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
   if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key.toLowerCase().startsWith('arrow')?e.key:e.key.toLowerCase()))e.stopImmediatePropagation();
   if(e.key!=='Tab')return;
   const nodes=[...rootRef.current!.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled)')].filter(node=>node.getClientRects().length);
   const first=nodes[0],last=nodes.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  };
  window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
 },[opened,tab]);
 if(!opened)return null;
 const name=selection?.name||conversation.current.getProfile()?.name||'Expediente del caso';
 const sheetLink=selection?.url;
 return <div ref={rootRef} className="overlay dossier-overlay" role="dialog" aria-modal="true" aria-label="Agentes del Despacho" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}>
  <div className={`panel dossier-panel ${tab==='terminal'?'terminal-wide':''}`}>
   <div className="panel-head"><div className="panel-title"><span className="muted small">YoDesarrollo · Despacho</span><strong>{name}</strong></div><button className="panel-x" aria-label="Cerrar agentes" onClick={close}>×</button></div>
   <nav className="phone-tabs" aria-label="Paneles del caso">{tabs.map(([key,icon,label])=><button key={key} className={`phone-tab ${tab===key?'phone-tab-on':''}`} aria-pressed={tab===key} onClick={()=>setTab(key)}><span className="phone-tab-icon" aria-hidden="true">{icon}</span><span>{label}</span></button>)}</nav>
   <div className="conversation-status" role="status">{labels[status]||status}</div>
   {status==='unavailable'&&<p className="conversation-notice" role="alert">{connectionNotice(conversation.current.diagnostic)} <span className="muted small">Paso: {conversation.current.diagnostic?.step||'conexión'}.</span></p>}
   <div className={`panel-body dossier-body ${tab==='chat'?'dossier-chat':''}`}>
    {tab==='chat'&&<div className="phone-chat">
     <div className="chat-log" role="log" aria-label="Conversación del expediente">
      {model?.messages.map(row=><article className={`case-message case-message-${row.role}`} key={row.id}><b>{row.role==='user'?'Tú':name}</b><p>{row.body}</p><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('es-MX')}</time></article>)}
      {model&&!model.messages.length&&<p className="phone-empty">Todavía no hay mensajes guardados en este expediente.</p>}
      {!model&&<div className="phone-empty"><p>{busy?'Estoy cargando el expediente privado y su conversación.':'La conexión privada del expediente todavía no está disponible.'}</p><p className="muted">Al conectarse, la conversación se recuperará aquí desde Sheets.</p></div>}
     </div>
     {status==='ready'&&conversation.current.stoppedMessage&&<div className="conversation-notice" role="alert"><p>Tu último mensaje se detuvo y quedó sin respuesta.</p><button type="button" className="btn" disabled={busy||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue} onClick={()=>void conversation.current.retryStopped()}>Volver a enviar</button></div>}
     {waitingLong&&status==='processing'&&<p className="conversation-notice" role="alert">La respuesta tarda más de lo esperado. Tu mensaje está guardado. Pulsa Actualizar para consultar su estado; no hace falta enviarlo otra vez.</p>}
     {status==='unconfirmed'&&<p className="conversation-notice" role="alert">No se ha confirmado el guardado. Reintentar conserva el mismo mensaje y su identificador.</p>}
     {model&&!conversation.current.selection?.agent_ready&&<p className="conversation-notice">El motor necesita conectarse antes de enviar mensajes.</p>}
     <form className="chat-input" onSubmit={send}><MessageBox value={message} onChange={setMessage} maxLength={8000} disabled={busy||status!=='ready'||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue} placeholder={status==='processing'?'Esperando la respuesta…':'Escribe al agente'} aria-label="Mensaje directo al agente"/><button className="btn btn-small" disabled={busy||(!conversation.current.pending&&(!message.trim()||status!=='ready'))||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue}>{status==='unconfirmed'?'Reintentar':'Enviar'}</button></form>
    </div>}
    {tab==='dossier'&&<>
     <p className="muted small">Lectura del expediente privado en Sheets. Los recuerdos y documentos conservan la evidencia registrada por el equipo.</p>
     <section className="dossier-section" aria-labelledby="case-memory"><h2 id="case-memory">Memoria</h2>
      {!model&&<p>{busy?'Cargando memoria…':'Conecta el expediente para consultar su memoria.'}</p>}
      {model&&!model.memory.length&&<p className="muted">No hay recuerdos en la lectura recibida.</p>}
      {model?.memory.map(row=><article className="dossier-record" key={row.id}><h3>{row.title||'Recuerdo sin tema'}</h3><p>{row.body||'Sin contenido registrado.'}</p>{row.evidence&&<p className="dossier-meta"><b>Evidencia / condición: </b>{row.url?<a href={row.url} target="_blank" rel="noopener noreferrer">Ver fuente en Google</a>:row.evidence}</p>}{row.next&&<p className="dossier-meta"><b>Siguiente acción registrada: </b>{row.next}</p>}</article>)}
     </section>
     <section className="dossier-section" aria-labelledby="case-documents"><h2 id="case-documents">Documentos</h2>
      {!model&&<p>{busy?'Cargando documentos…':'Conecta el expediente para consultar sus documentos.'}</p>}
      {model&&!model.documents.length&&<p className="muted">No hay documentos en la lectura recibida.</p>}
      {model?.documents.map(row=><article className="dossier-record" key={row.id}><h3>{row.title||'Documento sin nombre'}</h3>{row.role&&<p>{row.role}</p>}{row.url?<a className="btn" href={row.url} target="_blank" rel="noopener noreferrer">Abrir documento</a>:<p className="dossier-meta"><b>Fuente registrada: </b>{row.source||'Sin enlace registrado.'}</p>}</article>)}
     </section>
    </>}
    {tab==='activity'&&<><div className="term" role="log" aria-label="Actividad del expediente">{!model&&<div className="term-line term-system">Conecta el expediente para consultar su actividad.</div>}{model&&model.events.length===0&&<div className="term-line">Sin eventos en la lectura recibida.</div>}{model?.events.map(r=><div className="term-line" key={r.id}><b>{r.title}</b><div>{r.body}</div></div>)}</div><p className="muted small">Eventos registrados en Sheets. La pestaña Terminal permite conectar la sesión local de la Chromebook.</p></>}
    {tab==='terminal'&&<TerminalPanel link={terminalLink.current} state={terminalState} authorized={!!conversation.current.getProfile()&&!!selection&&!busy}/>}
    {tab==='plan'&&<section className="dossier-section"><h2>Plan y tareas</h2><p>El tablero de tareas del caso todavía no está conectado a este panel.</p><p className="muted">Consulta el control vigente en Sheets. Las siguientes acciones de la pestaña Expediente son referencias registradas; abrirlas no ejecuta ni aprueba trabajo.</p><p className="muted small">La conversación por voz y la edición de apariencia siguen pendientes de integración.</p></section>}
   </div>
   <div className="conversation-tools"><button type="button" className="btn" disabled={busy} onClick={()=>void read()}>{model?'Actualizar':'Reintentar conexión'}</button>{sheetLink&&<a className="btn" href={sheetLink} target="_blank" rel="noopener noreferrer">Ver en Sheets</a>}</div>
   <div className="phone-hint"><a href="third-party/cubefarm/LICENSE.txt" target="_blank" rel="noopener noreferrer">Interfaz basada en Cubefarm</a><span> · </span><button className="attribution-close" onClick={close}>Volver al Despacho</button></div>
  </div>
 </div>;
}
createRoot(document.getElementById('cubefarm-agents')!).render(<App/>);
