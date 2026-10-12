import {newEngines} from './hairline-approved.mjs';
import {terrain,keyboard,riffle,drawer,stack,branches,lockers,format,cabinet,laptop} from './vendor/hairline/src/index.ts';
// Decorative layer only: labels, handlers, permissions and business state stay with their owners.
export const HAIRLINE_ENABLED=true;
const rules=[
 ['.entorno-espacio[data-espacio="museo"]>h2',newEngines.gallery,'maquetas'],
 ['.workspace-subnav [data-tab="meeting"],.entorno-espacio[data-espacio="juntas"]>h2',newEngines.easel,'reunion'],
 ['.entorno-espacio[data-espacio="comunicacion"]>h2,.entorno-espacio[data-espacio="drive"]>h2',newEngines.dock,'conectores'],
 ['.station-wheel [data-sector="ppp"],.workspace-primary [data-tab="ppp"]',terrain,'ppp'],
 ['.station-wheel [data-sector="conversaciones"],.station-chat>summary',keyboard,'hablar'],
 ['.station-wheel [data-sector="pendientes"],.workspace-primary [data-tab="activity"]',riffle,'trabajo'],
 ['.station-wheel [data-sector="notas"],.workspace-primary [data-tab="sources"]',drawer,'expediente'],
 ['.radial-options [data-action="knowledge"],.knowledge-capture h3,.knowledge-compare h3',stack,'versiones'],
 ['.work-history>button,#station-refresh',branches,'historial'],
 ['.workspace-subnav [data-tab="tasks"],.radial-options [data-action="pendientes"]',lockers,'pendientes'],
 ['.radial-options [data-action="documentos"]',riffle,'documentos'],
 ['.workspace-subnav [data-tab="knowledge"],.radial-options [data-action="notas"]',format,'notas'],
 ['[data-resident-library],#library-title',cabinet,'biblioteca'],
 ['.workspace-subnav [data-tab="browser"]',laptop,'navegador']
];
export function installHairline(doc=document){
 if(!HAIRLINE_ENABLED)return ()=>{};
 const entries=new Map();let queued=false,stopped=false;
 const scan=()=>{
  queued=false;if(stopped)return;
  for(const [node,item]of entries)if(!node.isConnected||!node.contains(item.host)){item.dispose();entries.delete(node);}
  for(const [selector,engine,key]of rules)for(const node of doc.querySelectorAll(selector)){
   if(entries.has(node))continue;
   const host=doc.createElement('span');host.className='hairline-access';host.dataset.choice=key;host.setAttribute('aria-hidden','true');node.prepend(host);node.classList.add('has-hairline');
   const figure=engine(host,{theme:node.closest('.station-wheel')?'dark':'light',play:false,intensity:.5,label:''});
   host.removeAttribute('tabindex');host.querySelectorAll('[tabindex]').forEach(n=>n.removeAttribute('tabindex'));
   const play=()=>{if(!node.disabled)figure.update({play:true});},pause=()=>figure.update({play:false});
   node.addEventListener('pointerenter',play);node.addEventListener('pointerleave',pause);node.addEventListener('focus',play);node.addEventListener('blur',pause);
   const visibility=new IntersectionObserver(rows=>{if(!rows[0].isIntersecting)pause();});visibility.observe(node);
   entries.set(node,{host,dispose(){visibility.disconnect();figure.destroy();host.remove();node.classList.remove('has-hairline');node.removeEventListener('pointerenter',play);node.removeEventListener('pointerleave',pause);node.removeEventListener('focus',play);node.removeEventListener('blur',pause);}});
  }
 };
 const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.closest?.('.hairline-access')))&&!queued){queued=true;queueMicrotask(scan);}});
 scan();observer.observe(doc.body,{childList:true,subtree:true});
 return ()=>{stopped=true;observer.disconnect();for(const e of entries.values())e.dispose();entries.clear();};
}
let stop=null;
if(typeof document!=='undefined'){stop=installHairline();window.addEventListener('pagehide',()=>stop?.());window.addEventListener('pageshow',e=>{if(e.persisted)stop=installHairline();});}
