// Adapted from Cubefarm 0.3.2 Phone/TerminalView/KanbanView. MIT © 2026 Leon van Zyl.
// Business records only come from the existing authorized Sheets transport.
import {useEffect, useState, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {MessageBox} from './vendor/cubefarm/MessageBox';
import {Conversation,createFrameTransport} from '../despacho3d/conversation.mjs';
import {createProfileSession} from '../despacho3d/profile-session.mjs';
import {TerminalLink} from '../despacho3d/terminal-link.mjs';
import {TerminalPanel} from './TerminalPanel';
import {DurableGoalsPanel} from './DurableGoalsPanel';
import {DurableGoals} from '../despacho3d/goals.mjs';
import {VoiceControls} from './VoiceControls';
import {appendDictation} from '../despacho3d/conversation-voice.mjs';
import {watchConversation} from '../despacho3d/conversation-watch.mjs';

const labels:Record<string,string>={disconnected:'Conexión pendiente',loading:'Cargando expediente…',ready:'Conversación respaldada en Sheets',reconnecting:'Reconectando · conservamos el historial visible',processing:'Mensaje guardado · esperando respuesta',sending:'Guardando mensaje…',unconfirmed:'Guardado sin confirmar',conflict:'El expediente cambió · vuelve a leerlo',unavailable:'No se pudo conectar con el expediente',streaming:'Respondiendo en vivo…'};
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
type Snapshot={case_id:string,revision:string,updated_at:string,events:RecordRow[],memory:MemoryRow[],documents:DocumentRow[],jobs:{id:string,request_id:string,status:string}[],messages:{id:string,role:string,body:string,created_at:string}[],processing:boolean};
type FastTurn={id:string,message:string,reply:string,phase:'thinking'|'streaming'|'done',saved:boolean,created_at:string,meta:{model?:string,tier?:string,total_ms?:number,ttft_ms?:number}|null};
function fastCaption(t:FastTurn){
 if(t.phase==='thinking')return 'Pensando…';
 if(t.phase==='streaming')return 'Escribiendo…';
 const seconds=typeof t.meta?.total_ms==='number'?` · ${(t.meta.total_ms/1000).toFixed(1)} s`:'';
 return `${t.meta?.model||'Respuesta'}${seconds} · ${t.saved?'guardado en Sheets':'guardando respaldo en Sheets…'}`;
}
type AgentAPI={open:(tab?:Tab)=>boolean,close:()=>void,isOpen:()=>boolean,getProfile:()=>Profile|null,subscribeProfile:(fn:(profile:Profile|null)=>void)=>()=>void,openForCase:(id:string)=>boolean};
declare global {interface Window {CubefarmYOD?:AgentAPI}}
const tabs:[Tab,string,string][]=[['chat','◉','Conversación'],['dossier','▤','Expediente'],['plan','▦','Tareas'],['activity','⌨','Actividad']];
let overlayOpen=false;
function inertWorld(value:boolean){const header=document.querySelector('header'),world=document.getElementById('workspace');if(header)header.inert=value;if(world)world.inert=value;}
function App(){
 const [selection,setSelection]=useState<any>(null);
 const [opened,setOpened]=useState(false),[tab,setTab]=useState<Tab>('chat'),[status,setStatus]=useState('disconnected'),[model,setModel]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[fastTurns,setFastTurns]=useState<FastTurn[]>([]),[fastNotice,setFastNotice]=useState('');
 const [terminalState,setTerminalState]=useState<any>({status:'disconnected',runtime:null,error:''});
 const terminalLink=useRef<any>(null);
 const goals=useRef<any>(null),profileCase=useRef<string|null>(null);
 const [message,setMessage]=useState(''),[waitingLong,setWaitingLong]=useState(false);
 const submittedDraft=useRef<{message:string,request_id:string}|null>(null);
 const chatRef=useRef<HTMLDivElement>(null),rootRef=useRef<HTMLDivElement>(null),focusRef=useRef<HTMLElement|null>(null),transportRef=useRef<any>(null),conversation=useRef<any>(null),session=useRef<any>(null);
 if(!conversation.current)conversation.current=new Conversation({transport:()=>transportRef.current,notify:(c:any)=>{setModel(c.model);setFastTurns(c.fastTurns.map((t:any)=>({...t,meta:t.meta?{...t.meta}:null})));setFastNotice(c.fastNotice||'');setBusy(c.busy);setStatus(c.status);setSelection(c.selection);if(['unauthorized','session_changed','case_changed'].includes(c.diagnostic?.code)){setMessage('');submittedDraft.current=null;}}});
 const resetGoal=()=>{goals.current?.reset();};
 if(!terminalLink.current)terminalLink.current=new TerminalLink({getProfile:()=>conversation.current.getProfile(),notify:setTerminalState});
 if(!goals.current)goals.current=new DurableGoals({transport:()=>transportRef.current,getContext:()=>({selection:conversation.current.selection,busy:conversation.current.busy||conversation.current.stale}),onUnauthorized:()=>{conversation.current.forgetProfile();conversation.current.close();}});
 const read=()=>session.current?.read();
 const send=async(e:React.FormEvent)=>{e.preventDefault();const submitted=message,request=conversation.current.send(submitted);if(conversation.current.pending)submittedDraft.current={message:submitted,request_id:conversation.current.pending.request_id};if(await request){setMessage(current=>current===submitted?'':current);submittedDraft.current=null;}};
 const close=()=>session.current?.close();
 useEffect(()=>{
  transportRef.current=createFrameTransport(window);
  const current=createProfileSession(conversation.current,{
   show:(next:Tab)=>{if(!overlayOpen)focusRef.current=document.activeElement as HTMLElement;overlayOpen=true;inertWorld(true);setTab(tabs.some(([key])=>key===next)?next:'chat');setOpened(true);window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:true}));},
   hide:()=>{const wasOpen=overlayOpen;overlayOpen=false;inertWorld(false);setOpened(false);setSelection(null);setMessage('');goals.current.hide();window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:false}));if(wasOpen)(focusRef.current?.isConnected&&focusRef.current.getClientRects().length?focusRef.current:document.getElementById('agents-open'))?.focus();}
  });
  session.current=current;window.CubefarmYOD=current;
  const stopProfile=current.subscribeProfile((profile:Profile|null)=>{terminalLink.current.revoke();if(profileCase.current!==(profile?.case_id||null)){profileCase.current=profile?.case_id||null;resetGoal();}});
  const trigger=document.getElementById('agents-open') as HTMLButtonElement|null;
  if(trigger){trigger.disabled=false;trigger.onclick=()=>current.open();}
  window.dispatchEvent(new CustomEvent('yod-agents-ready'));
  void current.hydrate();
  const stop=()=>{current.dispose();terminalLink.current.dispose();};
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',restore);
  return()=>{stopProfile();terminalLink.current.dispose();window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',restore);current.dispose();transportRef.current?.dispose();delete window.CubefarmYOD;if(trigger){trigger.disabled=true;trigger.onclick=null;}};
 },[]);
 useEffect(()=>{const sent=submittedDraft.current;if(sent&&model?.jobs.some(job=>job.request_id===sent.request_id)){setMessage(value=>value===sent.message?'':value);submittedDraft.current=null;}},[model]);
 useEffect(()=>{if(opened&&tab==='chat')chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:'auto'});},[opened,tab,model?.messages.length,conversation.current.pending?.request_id,fastTurns.length,fastTurns.at(-1)?.reply.length]);
 const needsRecovery=conversation.current.recoverable;
 useEffect(()=>{if(!opened)return;return watchConversation(conversation.current,{visible:()=>document.visibilityState!=='hidden',onLimit:()=>setWaitingLong(true)});},[opened,model?.processing,needsRecovery,selection?.agent_ready,status==='processing',status==='unconfirmed',status==='conflict']);
 useEffect(()=>{if(!model?.processing)setWaitingLong(false);},[model?.processing]);
 useEffect(()=>{if(!opened)return;const recover=()=>{if(document.visibilityState!=='hidden'&&(conversation.current.recoverable||conversation.current.model?.processing))void read();};window.addEventListener('online',recover);document.addEventListener('visibilitychange',recover);return()=>{window.removeEventListener('online',recover);document.removeEventListener('visibilitychange',recover);};},[opened]);
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
   <div className="conversation-status" role="status">{status==='ready'&&fastTurns.some(t=>!t.saved)?'Respaldando la conversación en Sheets…':labels[status]||status}</div>
   {status==='reconnecting'&&<p className="conversation-notice" role="status">La actualización se interrumpió. Estamos recuperando la conexión automáticamente; no necesitas volver a enviar el mensaje.</p>}
   {status==='unavailable'&&<p className="conversation-notice" role="alert">{connectionNotice(conversation.current.diagnostic)} <span className="muted small">Paso: {conversation.current.diagnostic?.step||'conexión'}.</span></p>}
   <div className={`panel-body dossier-body ${tab==='chat'?'dossier-chat':''}`}>
    {tab==='chat'&&<div className="phone-chat">
     <div ref={chatRef} className="chat-log" role="log" aria-label="Conversación del expediente">
      {model?.messages.map(row=><article className={`case-message case-message-${row.role}`} key={row.id}><b>{row.role==='user'?'Tú':name}</b><p>{row.body}</p><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('es-MX')}</time></article>)}
      {fastTurns.map(t=><div key={t.id}><article className="case-message case-message-user"><b>Tú</b><p>{t.message}</p></article><article className="case-message case-message-assistant" aria-live="polite"><b>{name}</b><p>{t.reply||'…'}</p><span className="muted small">{fastCaption(t)}</span></article></div>)}
      {(conversation.current.pending||conversation.current.accepted)&&<article className="case-message case-message-user"><b>Tú</b><p>{(conversation.current.pending||conversation.current.accepted).message}</p><span className="muted small">{conversation.current.accepted?'Guardado en Sheets':status==='sending'?'Guardando…':'Guardado por confirmar'}</span></article>}
      {model&&!model.messages.length&&!fastTurns.length&&<p className="phone-empty">Todavía no hay mensajes guardados en este expediente.</p>}
      {!model&&<div className="phone-empty"><p>{busy?'Estoy cargando el expediente privado y su conversación.':'La conexión privada del expediente todavía no está disponible.'}</p><p className="muted">Al conectarse, la conversación se recuperará aquí desde Sheets.</p></div>}
     </div>
     {status==='ready'&&conversation.current.stoppedMessage&&<div className="conversation-notice" role="alert"><p>Tu último mensaje se detuvo y quedó sin respuesta.</p><button type="button" className="btn" disabled={busy||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue} onClick={()=>void conversation.current.retryStopped()}>Volver a enviar</button></div>}
     {waitingLong&&status==='processing'&&<p className="conversation-notice" role="alert">La respuesta tarda más de lo esperado. Tu mensaje está guardado y seguimos consultando su estado automáticamente.</p>}
     {fastNotice&&<p className="conversation-notice" role="alert">{fastNotice}</p>}
     {status==='unconfirmed'&&<p className="conversation-notice" role="alert">No se ha confirmado el guardado. Reintentar conserva el mismo mensaje y su identificador.</p>}
     {model&&!conversation.current.selection?.agent_ready&&<p className="conversation-notice">El motor está desconectado. El historial sigue en Sheets; el envío se habilitará cuando vuelva a estar disponible.</p>}
     <form className="chat-input" onSubmit={send}><MessageBox value={message} onChange={setMessage} maxLength={8000} disabled={!selection||['loading','unavailable','disconnected'].includes(status)} placeholder={status==='processing'?'Puedes preparar tu siguiente mensaje…':'Escribe un mensaje'} aria-label="Mensaje directo al agente"/><button className="btn btn-small" disabled={busy||conversation.current.stale||(!conversation.current.pending&&(!message.trim()||status!=='ready'))||!conversation.current.selection?.agent_ready||!conversation.current.selection?.can_enqueue}>{status==='unconfirmed'?'Reintentar':'Enviar'}</button></form>
     <VoiceControls active={opened&&tab==='chat'} contextKey={`${conversation.current.epoch}:${selection?.case_id||''}`} disabled={!selection||conversation.current.stale||status==='unavailable'} response={model?.messages.filter(row=>row.role==='assistant').at(-1)||null} onTranscript={text=>setMessage(value=>appendDictation(value,text))}/>
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
    {tab==='activity'&&<><div className="term" role="log" aria-label="Actividad del expediente">{!model&&<div className="term-line term-system">Conecta el expediente para consultar su actividad.</div>}{model&&model.events.length===0&&<div className="term-line">Sin eventos en la lectura recibida.</div>}{model?.events.map(r=><div className="term-line" key={r.id}><b>{r.title}</b><div>{r.body}</div></div>)}</div><p className="muted small">Eventos registrados en Sheets. El diagnóstico técnico está separado de la conversación.</p></>}
    {tab==='terminal'&&<TerminalPanel link={terminalLink.current} state={terminalState} authorized={!!conversation.current.getProfile()&&!!selection&&!busy}/>}
    {tab==='plan'&&(selection?.goals?.ready===true?<DurableGoalsPanel controller={goals.current} active={opened&&tab==='plan'} workerReady={selection.goals.worker_ready}/>:<section className="dossier-section"><h2>Tareas del agente</h2><p>El seguimiento automático de metas y evidencias en Sheets todavía no está activado en el motor.</p><p className="muted">La conversación y su historial están en la pestaña Conversación.</p></section>)}
   </div>
   <div className="conversation-tools"><button type="button" className="btn" disabled={busy} onClick={()=>void read()}>{model?'Actualizar':'Reintentar conexión'}</button>{sheetLink&&<a className="btn" href={sheetLink} target="_blank" rel="noopener noreferrer">Ver en Sheets</a>}</div>
   <div className="phone-hint"><button className="attribution-close" onClick={()=>setTab(tab==='terminal'?'chat':'terminal')}>{tab==='terminal'?'Volver a la conversación':'Diagnóstico'}</button><span> · </span><a href="third-party/cubefarm/LICENSE.txt" target="_blank" rel="noopener noreferrer">Interfaz basada en Cubefarm</a><span> · </span><button className="attribution-close" onClick={close}>Volver al Despacho</button></div>
  </div>
 </div>;
}
createRoot(document.getElementById('cubefarm-agents')!).render(<App/>);
