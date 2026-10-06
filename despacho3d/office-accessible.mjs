import {places,bounds,annex,collisions,allowed} from './office-layout.mjs?v=1';
import {ENTORNO_AGENTE_CAMINA} from './entorno-config.mjs';
import {crearAgenteIr} from './entorno-ruta.mjs?v=4';
import {createOfficePilot} from './avatars/office-pilot.mjs?v=5';
import * as T from 'three';
import {panels} from './office-panels.mjs?v=1';
import {ESPACIOS} from './entorno.mjs?v=11';

const el=(tag,text='',attrs={})=>{
 const node=document.createElement(tag);node.textContent=text;
 for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
 return node;
};
const label=id=>id==='inicio'?'Puesto del caso':places[id]?.label||'Sin ubicación confirmada';
const authorized=p=>p&&typeof p.case_id==='string'&&p.id===p.case_id&&p.entity_kind==='case';
const coords=p=>Array.isArray(p)&&p.every(Number.isFinite)?p.map(n=>n.toFixed(2)).join(', '):'—';
const svgEl=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};

// Alternativa de navegación de la misma oficina. El piloto y A* no necesitan una GPU.
export function startAccessibleOffice({onPanelOpened=()=>{}}={}){
 const scene=new T.Scene();
 let selected='entry',sheet=null,agentOverlay=false,lastFocus=null;
 const pilot=createOfficePilot({scene,beforeOpen:()=>closeSheets()});
 const bind=()=>pilot.bind(window.YodResidentAgents||window.CubefarmYOD);
 window.addEventListener('yod-agents-ready',bind);window.addEventListener('yod-residents-ready',bind);window.addEventListener('pagehide',()=>pilot.disconnect());window.addEventListener('pageshow',bind);bind();
 const closeSheets=()=>{
  document.querySelectorAll('.sheet').forEach(n=>n.hidden=true);document.getElementById('scrim').hidden=true;
  document.querySelector('header').inert=agentOverlay;
  for(const n of document.getElementById('workspace').children)n.inert=false;
  sheet=null;lastFocus?.focus?.({preventScroll:true});
 };
 const showSheet=id=>{
  closeSheets();lastFocus=document.activeElement;sheet=id;
  document.querySelector('header').inert=true;
  for(const n of document.getElementById('workspace').children)if(!n.classList.contains('sheet')&&n.id!=='scrim')n.inert=true;
  const n=document.getElementById(id);n.hidden=false;n.scrollTop=0;document.getElementById('scrim').hidden=false;
  n.querySelector('.close')?.focus();
 };
 const visit=async id=>{if(!Object.hasOwn(places,id))return false;closeSheets();selected=id;return true;};
 const openPanel=id=>{
  if(!Object.hasOwn(places,id))return false;
  const p=panels[id]||{tag:places[id].label,title:places[id].label,body:'<p>Espacio del Despacho. Sus herramientas se conectan por etapas desde Entorno.</p>'};
  document.getElementById('panel-tag').textContent=p.tag;document.getElementById('panel-title').textContent=p.title;
  // Contenido de fichas del código local, nunca de un perfil o un expediente.
  document.getElementById('panel-body').innerHTML=p.body;
  if(id==='case'){
   const b=el('button','Abrir panel de agentes');b.onclick=()=>{closeSheets();window.CubefarmYOD?.open('chat');};
   document.getElementById('panel-body').prepend(b);
  }
  showSheet('panel');onPanelOpened(id);return true;
 };
 const api={setAgentActivity:pilot.setActivity,view:'map',layout:{bounds,annex,collisions},visit,setMode:()=>closeSheets(),openPanel,closeSheets,allowed,
  getAgentState:()=>pilot.getMovementState(),
  getState:()=>({mode:'map',selected,sheet,position:[places[selected].eye[0],1.65,places[selected].eye[2]],avatar:pilot.getState()})};
 if(ENTORNO_AGENTE_CAMINA||/(?:^|[?&])camina=1(?:&|$)/.test(location.search))api.agenteIr=crearAgenteIr({lugares:places,piloto:pilot,permitido:allowed,limites:[bounds,annex],reducido:()=>matchMedia('(prefers-reduced-motion:reduce)').matches,alLlegar:lugar=>window.dispatchEvent(new CustomEvent('yod-agent-arrived',{detail:{lugar}}))});
 window.despacho=api;
 document.body.classList.add('office-map-fallback');
 for(const id of ['loading','fallback','joystick','crosshair','walk-guide','nearby'])document.getElementById(id).hidden=true;
 document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>visit(b.dataset.place));
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeSheets);
 document.getElementById('scrim').onclick=closeSheets;document.getElementById('areas-open').onclick=()=>showSheet('areas');
 document.getElementById('help-open').onclick=()=>showSheet('help');document.getElementById('case-open').onclick=async()=>{await visit('case');openPanel('case');};
 window.addEventListener('keydown',e=>{
  if(agentOverlay)return;if(e.key==='Escape')closeSheets();
  if(sheet&&e.key==='Tab'){
   const nodes=[...document.getElementById(sheet).querySelectorAll('button,a[href]')];const first=nodes[0],last=nodes.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
 });
 window.addEventListener('yod-agents-visibility',e=>{agentOverlay=e.detail===true;closeSheets();document.getElementById('workspace').inert=agentOverlay;});
 agentOverlay=!!window.CubefarmYOD?.isOpen?.();document.getElementById('workspace').inert=agentOverlay;
 const animate=now=>{pilot.update(now,{hidden:document.hidden,overlay:agentOverlay,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches});requestAnimationFrame(animate);};requestAnimationFrame(animate);
 const route=()=>{const id=location.hash.slice(1);if(Object.hasOwn(places,id)){visit(id);openPanel(id);}};window.addEventListener('hashchange',route);route();
 window.officeReady=true;window.dispatchEvent(new CustomEvent('yod-office-ready',{detail:null}));return api;
}

// DOM visible: el agente lee lo mismo que una persona ve. No expone credenciales ni inventa actividad.
export function mountAccessibleView(api){
 const button=document.getElementById('office-accessible-open');button.disabled=false;button.hidden=false;
 const root=el('section','',{id:'office-accessible','aria-label':'Plano y estado del Despacho'});
 root.hidden=api.view!=='map';if(api.view==='map')document.body.classList.add('office-map-fallback');
 const heading=el('div','',{class:'office-map-heading'});
 const title=el('div');title.append(el('span','El Despacho · Vista accesible',{class:'eyebrow'}),el('h1','Plano de la oficina'));
 const close=el('button','Volver al 3D',{type:'button'});close.hidden=api.view==='map';close.onclick=()=>{root.hidden=true;button.setAttribute('aria-expanded','false');button.focus();};
 heading.append(title,close);root.append(heading);
 const reason=el('p',api.view==='map'?'El recorrido 3D no está disponible aquí. Puedes recorrer esta misma oficina en el plano.':'Este plano muestra los mismos lugares y obstáculos del recorrido 3D.',{class:'office-map-note'});root.append(reason);
 const status=el('div','',{class:'office-map-status','aria-live':'polite',role:'status'});
 const visitorText=el('p'),agentText=el('p'),result=el('p','Solo movimiento en la oficina. Las herramientas conservan sus permisos.',{class:'office-map-note'});
 status.append(visitorText,agentText);root.append(status,result);
 const svg=svgEl('svg',{viewBox:'-25 -11 39 23',role:'img','aria-label':'Plano del Despacho: obstáculos, lugares, tu vista y agente autorizado',class:'office-map'});
 for(const b of [api.layout.bounds,api.layout.annex])svg.append(svgEl('rect',{x:b.minX,y:b.minZ,width:b.maxX-b.minX,height:b.maxZ-b.minZ,class:'office-floor'}));
 for(const b of api.layout.collisions)svg.append(svgEl('rect',{x:b.minX,y:b.minZ,width:b.maxX-b.minX,height:b.maxZ-b.minZ,class:'office-obstacle'}));
 for(const id of ['editing','reception','potential','projects','delivery','decisions','lounge']){
  const names={editing:'Edición',reception:'Recepción',potential:'Potenciales',projects:'Proyectos',delivery:'Obra / ventas',decisions:'Juntas',lounge:'Biblioteca'};
  const p=places[id],text=svgEl('text',{x:p.eye[0],y:p.eye[2]+.85,'text-anchor':'middle'});text.textContent=names[id];svg.append(text);
 }
 const visitor=svgEl('circle',{r:'.24',class:'office-visitor'}),agent=svgEl('circle',{r:'.3',class:'office-agent'});svg.append(visitor,agent);root.append(svg);
 root.append(el('p','Azul: tu vista · Dorado: agente · Gris: muebles y paredes',{class:'office-map-legend'}));
 const controls=el('div','',{class:'office-map-controls'});
 for(const [id,p]of Object.entries(places)){
  const card=el('article','',{'data-place-card':id});card.append(el('h2',p.label));
  const go=el('button','Ir a '+p.label,{type:'button'});go.onclick=async()=>{const ok=await api.visit(id);result.textContent=ok===true?'Vista situada en '+p.label+'.':'No se confirmó el cambio de vista.';paint();};card.append(go);
  const info=el('button','Abrir ficha de '+p.label,{type:'button'});info.onclick=()=>api.openPanel(id);card.append(info);
  const space=ESPACIOS.find(e=>e.lugar===id);
  if(space){const send=el('button','Enviar agente a '+space.nombre,{type:'button','data-agent-destination':id});send.onclick=()=>{
   if(!authorized((window.YodResidentAgents||window.CubefarmYOD)?.getProfile?.()))return;
   result.textContent=api.agenteIr?.(id)?'Ruta aceptada hacia '+space.nombre+'. Esperando llegada.':'No se pudo iniciar la ruta.';paint();
  };card.append(send);}
  controls.append(card);
 }
 const home=el('button','Que el agente vuelva a su puesto',{type:'button','data-agent-destination':'inicio'});home.onclick=()=>{
  if(!authorized((window.YodResidentAgents||window.CubefarmYOD)?.getProfile?.()))return;
  result.textContent=api.agenteIr?.('inicio')?'Regreso iniciado. Esperando llegada.':'No se pudo iniciar el regreso.';paint();
 };root.append(home,controls);document.getElementById('workspace').append(root);
 button.setAttribute('aria-controls',root.id);button.setAttribute('aria-expanded',String(!root.hidden));
 button.onclick=()=>{api.closeSheets(false);root.hidden=false;button.setAttribute('aria-expanded','true');paint();};
 const mark=(node,p)=>{node.style.display=p?'':'none';if(p){node.setAttribute('cx',p[0]);node.setAttribute('cy',p[1]);}};
 let fingerprint='';
 function paint(){
  const s=api.getState(),a=api.getAgentState(),p=(window.YodResidentAgents||window.CubefarmYOD)?.getProfile?.(),has=authorized(p)&&!!a.position;
  const camera=s.mode==='overview'?null:[s.position[0],s.position[2]];
  mark(visitor,camera);mark(agent,has?a.position:null);
  root.setAttribute('data-renderer',api.view);root.setAttribute('data-selected',s.selected);
  root.setAttribute('data-agent-motion',has?a.motion:'unavailable');root.setAttribute('data-agent-place',has?(a.place||''):'');root.setAttribute('data-agent-destination',has?(a.destination||''):'');
  const v='Tu vista: '+(s.mode==='overview'?'Vista general':label(s.selected))+(camera?' · x, z: '+coords(camera):'');
  const name=typeof p?.name==='string'?p.name:'Agente del caso';
  const t=!has?'Agente: sin perfil autorizado cargado. Abre Agentes para cargar el expediente.':name+': '+(a.motion==='walk'?'En camino a '+label(a.destination):'Llegada confirmada · '+label(a.place))+' · x, z: '+coords(a.position);
  const key=v+'\n'+t;if(key!==fingerprint){visitorText.textContent=v;agentText.textContent=t;fingerprint=key;}
  root.querySelectorAll('[data-agent-destination]').forEach(n=>{n.disabled=!has||typeof api.agenteIr!=='function';});
 }
 function arrived(e){if(!authorized((window.YodResidentAgents||window.CubefarmYOD)?.getProfile?.()))return;result.textContent='Llegada confirmada a '+label(e.detail?.lugar)+'.';paint();}
 window.addEventListener('yod-agent-arrived',arrived);
 window.addEventListener('yod-office-view-unavailable',()=>{api.view='map';reason.textContent='El recorrido 3D perdió su conexión gráfica. Puedes seguir en el plano.';close.hidden=true;root.hidden=false;document.body.classList.add('office-map-fallback');document.getElementById('fallback').hidden=true;button.setAttribute('aria-expanded','true');paint();});
 let unsubscribe=null;
 const bind=()=>{if(!unsubscribe&&(window.YodResidentAgents||window.CubefarmYOD)?.subscribeProfile)unsubscribe=(window.YodResidentAgents||window.CubefarmYOD).subscribeProfile(()=>paint());};
 window.addEventListener('yod-agents-ready',bind);bind();paint();
 let timer=setInterval(()=>{if(!document.hidden)paint();},250);
 window.addEventListener('pagehide',()=>{clearInterval(timer);unsubscribe?.();unsubscribe=null;});
 window.addEventListener('pageshow',()=>{clearInterval(timer);timer=setInterval(()=>{if(!document.hidden)paint();},250);bind();paint();});
 return {root,paint};
}
