const groups=[
 ['Entrada y encuentro',[
  ['entry','Entrada al Despacho','Bienvenida y acceso a los espacios de la oficina.'],
  ['reception','Recepción','Un espacio de bienvenida y orientación.'],
  ['patio','Patio central','El punto de encuentro y referencia para recorrer la oficina.'],
  ['lounge','Sala de encuentro','Un espacio para conversaciones y revisión conjunta.']]],
 ['Estudios de proyecto',[
  ['potential','Potenciales','Un área para entender el terreno y preparar su plan de potencial.'],
  ['case','Puesto del proyecto','El lugar del caso y su autón.'],
  ['projects','Proyectos y permisos','Área preparada para diseño, normativa y trámites.'],
  ['delivery','Obra y ventas','Área preparada para ejecución y comercialización.']]],
 ['Trabajo compartido',[
  ['library','Biblioteca del proyecto','Un lugar para consultar las fuentes del proyecto.'],
  ['decisions','Decisiones','Una mesa para revisar propuestas.'],
  ['editing','Sala de edición','El ala de producción y seguimiento comercial.'],
  ['editorial','Mesa editorial','Un espacio para revisar propuestas y correcciones.'],
  ['funnel','Embudo comercial','Un espacio para consultar el recorrido comercial.']]]
];
const all=new Map(groups.flatMap(([,items])=>items).map(item=>[item[0],item]));
const descriptions={case:'La selección de casos y la apertura del puesto aún no están conectadas en esta vista.',library:'La actividad del proyecto aún no está conectada en esta vista.',decisions:'La reunión del proyecto aún no está conectada en esta vista.',potential:'El PPP aún no está conectado en esta vista.',projects:'Esta área está preparada; aquí no se muestran tareas reales.',delivery:'Esta área está preparada; aquí no se muestran tareas reales.',editing:'La mesa de trabajo aún no está conectada en esta vista.',editorial:'La revisión editorial aún no está conectada en esta vista.',funnel:'El tablero comercial aún no está conectado en esta vista.'};
const $=id=>document.getElementById(id),list=$('place-list'),status=$('map-status'),fallback=$('map-fallback');
let selected='entry',map=null,generation=0,returnFocus=null;
for(const [name,items] of groups){
 const section=document.createElement('section');section.className='place-group';
 const title=document.createElement('h3');title.textContent=name;section.append(title);
 const controls=document.createElement('div');controls.className='place-buttons';
 for(const [id,label] of items){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.place=id;b.dataset.placeCard=id;if(id==='library'){b.dataset.chincheUi='unsupported-library';b.title='Señalamiento de esta zona pendiente';}b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>select(id,true));controls.append(b);}
 section.append(controls);list.append(section);
}
function select(id,moveView=false){
 const item=all.get(id);if(!item)return;
 selected=id;const card=document.querySelector('.selection');card.dataset.placeCard=id;if(id==='library')card.dataset.chincheUi='unsupported-library';else delete card.dataset.chincheUi;$('selection-title').textContent=item[1];$('selection-description').textContent=item[2];
 $('selection-detail').textContent=window.despacho?(id==='library'?'El señalamiento con chinche de esta zona está pendiente. Abrir usa el proyecto autorizado actual.':'Abrir usa el proyecto autorizado actual cuando corresponde. Su disponibilidad se verifica al entrar.'):descriptions[id]||'Vista de ejemplo. Los servicios aún no están conectados.';
 list.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===id)));
 if(moveView){if(window.despacho)window.despacho.visit(id);else map?.visit(id);}
}
select(selected);
function controlsEnabled(enabled){document.querySelectorAll('[data-move],#zoom-in,#zoom-out,#map-fit').forEach(b=>{b.disabled=!enabled;});}
controlsEnabled(false);
async function start(){
 const own=++generation;map?.destroy();map=null;controlsEnabled(false);fallback.hidden=true;$('office-map').hidden=false;status.textContent='Preparando el plano…';
 try{
  const {createRetroMap}=await import('./retro-map.mjs');if(own!==generation)return;
  const instance=createRetroMap({canvas:$('office-map'),host:$('map-host'),onSelect:id=>select(id,true),onResidentSelect:id=>void window.despacho?.selectResident?.(id),onMove:()=>{}});
  if(own!==generation){instance.destroy();return;}map=instance;window.despacho?.refreshResidents?.();if(selected!=='entry')map.visit(selected);controlsEnabled(true);status.textContent='Plano listo. Selecciona un lugar.';
 }catch{if(own!==generation)return;fallback.hidden=false;$('office-map').hidden=true;status.textContent='Plano no disponible; usa la lista de lugares.';}
}
function move(dx,dz){map?.move(dx,dz);}
const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>move(...directions[b.dataset.move])));
$('map-fit').addEventListener('click',()=>map?.fit?.());
$('zoom-in').addEventListener('click',()=>map?.zoomBy(1.2));$('zoom-out').addEventListener('click',()=>map?.zoomBy(1/1.2));
const help=$('help');$('help-open').addEventListener('click',()=>{returnFocus=document.activeElement;help.showModal();$('help-open').setAttribute('aria-expanded','true');$('help-close').focus();});
$('help-close').addEventListener('click',()=>help.close());help.addEventListener('close',()=>{$('help-open').setAttribute('aria-expanded','false');returnFocus?.focus();});
document.addEventListener('keydown',event=>{
 if(document.querySelector('dialog[open]')||document.getElementById('workspace').inert||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;
 const keys={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};const dir=keys[event.key]||keys[event.key.toLowerCase()];
 if(dir&&map){event.preventDefault();move(...directions[dir]);}
});
window.addEventListener('pagehide',()=>{generation++;map?.destroy();map=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)start();});
start();

// La vista directa permanece sintética; el host real conserva sus puentes de autorización.
import('./retro-runtime.mjs').then(async ({isRetroHost,mountRetroRuntime})=>{
 if(!isRetroHost())return;
 const panel=$('panel');let panelFocus=null,pins=null;
 const api=await mountRetroRuntime({getMap:()=>map,onPanel:({id,tag,title,body})=>{
  panelFocus=document.activeElement;$('panel-tag').textContent=tag;$('panel-title').textContent=title;
  $('panel-body').innerHTML=body;if(!panel.open)panel.showModal();if(pins&&!pins.bindPanel(id)&&id==='library'){const note=document.createElement('p');note.className='notice';note.textContent='El señalamiento de esta ficha todavía no está disponible.';$('panel-body').append(note);}$('panel-close').focus();
 },hidePanel:()=>{if(panel.open)panel.close();},onPlaceReady:office=>{
  select(selected);$('help-demo').textContent='Los servicios del puesto requieren una sesión y un proyecto autorizados.';
  $('open-place').hidden=false;$('open-place').addEventListener('click',()=>{if(!office.openPanel(selected))$('selection-detail').textContent='Este puesto necesita un proyecto autorizado o aún no está disponible.';});
  $('case-open').addEventListener('click',()=>select('case',true));
 }});
 if(!api)return;
 $('panel-close').addEventListener('click',()=>api.closeSheets());panel.addEventListener('close',()=>panelFocus?.focus());
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
 const {mountRetroChinches}=await import('./retro-chinches.mjs');
 const button=$('retro-pin-control');pins=mountRetroChinches({onAvailability:available=>{button.hidden=!available;button.disabled=!available;},readZone:()=>api.getState().selected,closeSheets:()=>api.closeSheets()});
 button.addEventListener('click',()=>pins.start());
 document.addEventListener('click',event=>{if(pins?.isSelecting?.()&&event.target.closest?.('[data-chinche-ui="unsupported-library"]')){event.preventDefault();event.stopImmediatePropagation();}},true);
}).catch(()=>{if(new URL(location.href).searchParams.get('office')==='retro')$('map-status').textContent='No se pudo preparar el acceso. Vuelve a abrir el despacho desde YOD OS.';});
