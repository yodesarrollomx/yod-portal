import {createFrameTransport} from './conversation.mjs';
import {createLibraryClient} from './biblioteca.mjs?v=1';
const open=document.querySelector('[data-resident-library]');
if(open){
 const transport=createFrameTransport(window),client=createLibraryClient({mint:p=>transport.mintFastSession(p)});
 const dialog=document.createElement('dialog');dialog.className='library-dialog';dialog.setAttribute('aria-labelledby','library-title');
 dialog.innerHTML='<div class="library-top"><div><p class="library-eyebrow">Conocimiento del expediente</p><h1 id="library-title">Biblioteca</h1></div><button class="library-close" aria-label="Cerrar biblioteca">×</button></div>'+
 '<p class="library-intro">Busca en las fuentes de tu proyecto. Gastón puede consultar estos fragmentos al conversar contigo.</p>'+
 '<p class="library-status" role="status">Preparando las fuentes…</p>'+
 '<form class="library-search"><label for="library-query">¿Qué necesitas encontrar?</label><div><input id="library-query" maxlength="2000" placeholder="Escribe un tema o una frase" autocomplete="off"><button type="submit">Buscar</button></div></form>'+
 '<div class="library-body"><section><h2>Fuentes del expediente</h2><div class="library-sources"></div><button class="library-refresh">Actualizar fuentes</button></section>'+
 '<section class="library-results"><h2>Fragmentos encontrados</h2><p class="library-empty">Escribe una consulta para localizar la información.</p><div class="library-passages"></div></section></div>'+
 '<p class="library-note">Los fragmentos conservan su fuente y fecha. Las cifras vigentes se consultan en su hoja original; una lectura de texto no sustituye la interpretación visual de un plano.</p>';
 document.body.append(dialog);
 const node=s=>dialog.querySelector(s),h=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 const link=(name,url)=>{const a=h('a',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
 let resident=null,unsub=null,selection=null,generation=0,busy=false,poll=null;
 const notices={unauthorized:'El acceso cambió. Vuelve a abrir el despacho para recuperar tu expediente.',rate_limited:'Espera un momento antes de otra consulta.',knowledge_unavailable:'La biblioteca todavía no está disponible. Puedes consultar las fuentes con Gastón.',unavailable:'No pudimos actualizar la biblioteca. Vuelve a intentar.',cancelled:'',invalid_request:'Escribe al menos dos caracteres.'};
 const dates=v=>v?new Date(v).toLocaleString('es-MX'):'';
 function controls(){
  open.disabled=!selection?.can_enqueue||!selection?.agent_ready;
  node('button[type=submit]').disabled=busy||!selection;
  node('.library-refresh').disabled=busy||!selection;
 }
 function clear(){node('.library-sources').replaceChildren();node('.library-passages').replaceChildren();node('#library-query').value='';}
 function cancel(){generation++;client.reset();busy=false;clearTimeout(poll);poll=null;controls();}
 function paint(value,searching){
  const state=value.estado;
  node('.library-status').textContent=state.documents?state.indexed+' de '+state.documents+' fuentes preparadas'+(state.phase==='preparing'?'. La actualización continúa en segundo plano.':state.phase==='partial'?'. Algunas fuentes necesitan actualizarse.':'.'):
    state.phase==='unavailable'?'La biblioteca todavía no está disponible.':'Todavía no hay fuentes registradas en este expediente.';
  node('.library-sources').replaceChildren(...state.sources.map(s=>{
   const card=h('article','','library-source');card.append(link(s.nombre,s.enlace),h('p',s.papel));
   card.append(h('small',s.estado==='ready'?'Preparada · '+dates(s.indexado_en):['pending','checking','reading'].includes(s.estado)?'Preparando…':s.estado==='drive_forbidden'||s.estado==='drive_not_found'?'Fuente sin acceso':'Actualización pendiente'));
   if(s.rango)card.append(h('small','Rango: '+s.rango));
   if(s.truncado)card.append(h('small','Lectura parcial'));
   return card;
  }));
  if(searching){
   node('.library-empty').textContent=value.pasajes.length?'':'No encontramos fragmentos para esa consulta. Prueba con términos relacionados o pide a Gastón que revise la fuente.';
   node('.library-passages').replaceChildren(...value.pasajes.map(p=>{
    const card=h('article','','library-passage');card.append(link(p.fuente.nombre,p.fuente.enlace));
    const location=[p.pagina?'Página '+p.pagina:'',p.fuente.pestana?'Pestaña '+p.fuente.pestana:'',p.fuente.rango?'Rango '+p.fuente.rango:''].filter(Boolean).join(' · ');
    card.append(h('small',location||'Fragmento de texto'),h('p',p.texto),h('small','Fuente comprobada '+dates(p.fuente.consultado)));
    return card;
   }));
  }
  clearTimeout(poll);poll=null;
  if(state.phase==='preparing'&&dialog.open)poll=setTimeout(()=>{if(!busy&&dialog.open)void load(false);},10000);
 }
 async function load(searching){
  if(busy||!selection||!dialog.open)return;
  const own=++generation,id=selection.case_id,query=node('#library-query').value;
  clearTimeout(poll);poll=null;busy=true;controls();node('.library-status').textContent=searching?'Buscando y comprobando las fuentes…':'Actualizando las fuentes del expediente…';
  try{
   const value=searching?await client.search(id,query):await client.load(id);
   if(own!==generation||!dialog.open)return;paint(value,searching);
  }catch(e){
   if(own!==generation||!dialog.open)return;
   node('.library-status').textContent=notices[e.message]||notices.unavailable;
   if(e.message==='unauthorized'){clear();selection=null;client.reset();}
  }finally{if(own===generation){busy=false;controls();}}
 }
 function bind(){
  const fresh=window.YodResidentAgents;if(!fresh||fresh===resident)return;
  unsub?.();resident=fresh;
  unsub=resident.subscribe(()=>{
   const next=resident.getSelection(),changed=selection?.case_id!==next?.case_id;
   selection=next;
   if(changed){cancel();clear();if(dialog.open&&selection)void load(false);}
   if(!selection&&dialog.open)node('.library-status').textContent='Recuperando el acceso al expediente…';
   controls();
  });
 }
 window.addEventListener('yod-residents-ready',bind);bind();
 open.addEventListener('click',()=>{if(!selection||dialog.open)return;dialog.showModal();void load(false);});
 function close(){cancel();dialog.close();clear();node('#library-query').value='';node('.library-empty').textContent='Escribe una consulta para localizar la información.';open.focus();}
 node('.library-close').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 node('.library-search').addEventListener('submit',e=>{e.preventDefault();void load(true);});
 node('.library-refresh').addEventListener('click',()=>{void load(false);});
 window.addEventListener('pagehide',()=>{cancel();unsub?.();client.dispose();transport.dispose();dialog.remove();});
}
