// Adapted from Cubefarm 0.3.2 Phone/TerminalView/KanbanView. MIT © 2026 Leon van Zyl.
// Business records only come from the existing authorized Sheets transport.
import {useEffect, useState, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {MessageBox} from './vendor/cubefarm/MessageBox';
import {Markdown} from './vendor/cubefarm/Markdown';
import {validateDriveSelection} from '../despacho3d/drive-selection.mjs';

const CASE_ID='';

type Tab='chat'|'activity'|'plan';
let overlayOpen=false;
function inertWorld(value:boolean){const header=document.querySelector('header'),world=document.getElementById('workspace');if(header)header.inert=value;if(world)world.inert=value;}
type RecordRow={id:string,title:string,body:string,url?:string};
type Snapshot={case_id:string,revision:string,updated_at:string,events:RecordRow[],decisions:RecordRow[]};
type Reader={read:(input:{case_id:string})=>Promise<unknown>};
declare global {interface Window {YODCaseTransport?:Reader;CubefarmYOD?:{open:(tab?:Tab)=>void,close:()=>void,isOpen:()=>boolean}}}
function rows(v:unknown):v is RecordRow[]{return Array.isArray(v)&&v.length<=500&&v.every(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&typeof r.body==='string'&&r.id.length<=200&&r.title.length<=1000&&r.body.length<=12000);}
function validSnapshot(v:unknown):v is Snapshot{const s=v as Snapshot&{ok?:boolean};return !!s&&s.ok===true&&s.case_id===CASE_ID&&typeof s.revision==='string'&&s.revision.length>0&&typeof s.updated_at==='string'&&Number.isFinite(Date.parse(s.updated_at))&&rows(s.events)&&rows(s.decisions);}
const tabs:[Tab,string,string][]=[['chat','◉','Conversación'],['activity','⌨','Actividad'],['plan','▦','Plan']];
function App(){
 const [selection,setSelection]=useState<{name:string,url:string}|null>(null),[choosing,setChoosing]=useState(false),[selectionError,setSelectionError]=useState('');
 const links={chat:selection?.url||'terreno.html',activity:selection?.url||'terreno.html',plan:selection?.url||'terreno.html',decisions:selection?.url||'terreno.html'};
 const name=selection?.name||'Mi terreno';
 const [opened,setOpened]=useState(false),[tab,setTab]=useState<Tab>('chat'),[status,setStatus]=useState('Conexión pendiente'),[model,setModel]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false);
 const rootRef=useRef<HTMLDivElement>(null),generation=useRef(0),focusRef=useRef<HTMLElement|null>(null);
 const read=async()=>{
  const transport=window.YODCaseTransport;if(!CASE_ID||!transport||typeof transport.read!=='function')return;
  const own=++generation.current;setBusy(true);setStatus('Leyendo en Sheets…');
  try{const result=await transport.read({case_id:CASE_ID});if(own!==generation.current)return;if(!validSnapshot(result))throw Error('Unconfirmed snapshot');setModel(result);setStatus('Lectura confirmada');}
  catch{if(own===generation.current){setModel(null);setStatus('No se pudo confirmar la lectura');}}
  finally{if(own===generation.current)setBusy(false);}
 };
 const close=()=>{overlayOpen=false;inertWorld(false);generation.current++;setOpened(false);setChoosing(false);setModel(null);setBusy(false);setStatus('Conexión pendiente');window.dispatchEvent(new CustomEvent('yod-agents-visibility',{detail:false}));(focusRef.current?.isConnected&&focusRef.current.getClientRects().length?focusRef.current:document.getElementById('agents-open'))?.focus();};
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
    {tab==='chat'&&<div className="phone-chat"><div className="chat-head"><span className="avatar">T</span><div className="grow"><b>{name}</b><div className="muted small">Terreno · Plan de Potencial</div></div><span className="connection-label">Sheets</span></div><div className="chat-log"><div className="phone-empty"><p>Mi conversación y mi memoria se conservan en Drive.</p><p className="muted">Elige mi expediente privado para abrir la conversación de Sheets.</p><button className="btn" onClick={()=>setChoosing(true)}>Elegir expediente privado</button><a className="btn btn-good sheet-link" href={links.chat} target="_blank" rel="noopener noreferrer">Abrir mi conversación</a><p className="muted small">Este panel todavía no carga el historial ni envía mensajes directamente.</p></div></div><form className="chat-input" onSubmit={e=>e.preventDefault()}><MessageBox value="" onChange={()=>{}} disabled placeholder="Envío directo pendiente de conexión" aria-label="Mensaje directo al terreno"/><button className="btn btn-small" disabled>Enviar</button></form></div>}
    {tab==='activity'&&<><div className="term-meta"><span className="avatar">T</span><span>{name}</span><span className="chip">{status}</span></div><div className="term-split"><div className="term" role="log" aria-label="Actividad del expediente">{!model&&<div className="term-line term-system">La actividad se consulta en Sheets. No hay una terminal de ejecución conectada.</div>}{model&&model.events.length===0&&<div className="term-line">Sin eventos en la lectura recibida.</div>}{model?.events.map(r=><div className="term-line" key={r.id}><b>{r.title}</b><div>{r.body}</div></div>)}</div></div><div className="term-actions"><a className="btn" href={links.activity} target="_blank" rel="noopener noreferrer">Ver actividad en Sheets</a><button className="btn" disabled={!CASE_ID||!window.YODCaseTransport||busy} onClick={()=>void read()}>Releer expediente</button></div><p className="muted small">Revisión automática por hora pausada. La ejecución debe comprobarse antes de activarla.</p>{model&&<p className="muted small">Revisión {model.revision} · {model.updated_at}</p>}</>}
    {tab==='plan'&&<><div className="kanban-toolbar"><a className="btn btn-good" href={links.plan} target="_blank" rel="noopener noreferrer">Abrir control del caso en Sheets</a><span className="muted">{model?'Decisiones recibidas del expediente':'Estados pendientes de lectura directa'}</span></div><div className="kanban">{[['Por aclarar','backlog'],['Preparado','progress'],['En curso','qa'],['Tu revisión','review']].map(([title,style])=><div className={`kcol kcol-${style}`} key={title}><div className="kcol-head">{title} <span className="count">{title==='Tu revisión'&&model?model.decisions.length:'—'}</span></div><div className="kcol-body">{title==='Tu revisión'&&model?model.decisions.length?model.decisions.map(r=><div className="kcard" key={r.id}><div className="kcard-title">{r.title}</div><Markdown text={r.body}/></div>):<div className="muted kempty">Sin decisiones en la lectura recibida.</div>:<div className="muted kempty">Consulta el estado registrado en Sheets.</div>}</div></div>)}</div><p className="muted small">El panel muestra decisiones para revisión. No aprueba ni ejecuta acciones al abrirlas.</p></>}
   </div>
   <nav className="phone-tabs" aria-label="Paneles del terreno">{tabs.map(([key,icon,label])=><button key={key} className={`phone-tab ${tab===key?'phone-tab-on':''}`} aria-pressed={tab===key} onClick={()=>setTab(key)}><span className="phone-tab-icon" aria-hidden="true">{icon}</span><span>{label}</span></button>)}</nav>
   {choosing&&<form className="drive-choice" onSubmit={choose}><label>Nombre del terreno<input name="name" maxLength={120} defaultValue={selection?.name} required/></label><label>Enlace de Sheets o Drive<input name="url" type="url" defaultValue={selection?.url} required placeholder="https://docs.google.com/..."/></label><p className="muted small">La selección sólo dura mientras está abierta esta oficina. Los datos siguen en Drive.</p>{selectionError&&<p role="alert">{selectionError}</p>}<button className="btn btn-good">Elegir</button><button className="btn" type="button" onClick={()=>setChoosing(false)}>Cancelar</button></form>}<div className="phone-hint"><a href="third-party/cubefarm/LICENSE.txt" target="_blank" rel="noopener noreferrer">Interfaz basada en Cubefarm</a><span> · </span><button className="attribution-close" onClick={close}>Volver al Despacho</button></div>
  </div>
 </div>;
}
createRoot(document.getElementById('cubefarm-agents')!).render(<App/>);
