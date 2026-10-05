// Entorno del agente: los espacios donde trabaja, qué puede hacer en cada uno y quién los ha visitado.
// Etapas 1 y 2: catálogo, permisos, registro en memoria y (con su propio interruptor) mover la figura del agente. No hace peticiones de red,
// no envía mensajes, no crea documentos y no escribe en Sheets. Todo espacio está en "solo observar".
// El repositorio es público: aquí no hay nombres de casos, clientes ni contactos.
import {ENTORNO_ACTIVO,ENTORNO_JUNTAS} from './entorno-config.mjs';
import {leerMetas,pendientesDeMetas} from './circulo-pendientes.mjs';

export const PERMISOS={
 observar:'Solo observar',
 borrador:'Borradores, con visto bueno de Dirección',
 accion:'Acción aprobada por Dirección'
};
// Nada se concede por defecto: cada espacio arranca en "observar". Subir de nivel es una etapa
// aparte y la autoriza Dirección (matriz de Accesos, código DP).
const NIVELES=Object.keys(PERMISOS);

export const ESPACIOS=Object.freeze([
 {id:'juntas',nombre:'Sala de juntas',funcion:'Entregas y aprobaciones. Avisa por WhatsApp y presenta lo que espera una decisión.',lugar:'decisions',permiso:'observar',tope:'borrador',etapa:'D'},
 {id:'comunicacion',nombre:'Centro de comunicación',funcion:'WhatsApp con número de prueba y Gmail, solo con contactos autorizados y siempre borrador primero.',lugar:null,permiso:'observar',tope:'borrador',etapa:'D'},
 {id:'biblioteca',nombre:'Biblioteca',funcion:'Consulta de conocimiento (NotebookLM). Falta verificar si solo puede abrirse.',lugar:'lounge',permiso:'observar',tope:'observar',etapa:'E'},
 {id:'navegacion',nombre:'Sala de navegación',funcion:'Pantallas que muestran lo que consulta el agente.',lugar:null,permiso:'observar',tope:'observar',etapa:'E'},
 {id:'drive',nombre:'Suite de Drive',funcion:'Crear documentos, presentaciones y hojas.',lugar:null,permiso:'observar',tope:'borrador',etapa:'E'},
 {id:'edicion',nombre:'Sala de edición y embudo comercial',funcion:'Producción de contenido y seguimiento comercial con los tableros de YOD OS.',lugar:'editing',permiso:'observar',tope:'borrador',etapa:'F'},
 {id:'direccion',nombre:'Oficina de Dirección',funcion:'Control, datos, programaciones y clientes.',lugar:null,permiso:'observar',tope:'observar',etapa:'F'},
 {id:'usos',nombre:'Salón de usos múltiples',funcion:'Espacio flexible para reuniones y presentaciones.',lugar:null,permiso:'observar',tope:'observar',etapa:'F'},
 {id:'museo',nombre:'Museo de maquetas de Aurum',funcion:'Recorrido y cuestionario sobre las maquetas.',lugar:null,permiso:'observar',tope:'observar',etapa:'F'}
].map(e=>Object.freeze(e)));

const POR_ID=new Map(ESPACIOS.map(e=>[e.id,e]));
export const espacioDe=id=>POR_ID.get(id)||null;

// En esta etapa nada puede ejecutar acciones: solo se pregunta, nunca se concede.
export function puedeActuar(espacioId,nivel='accion'){
 const e=POR_ID.get(espacioId);
 if(!e||!NIVELES.includes(nivel))return false;
 return NIVELES.indexOf(e.permiso)>=NIVELES.indexOf(nivel);
}

const QUIENES={direccion:'Dirección (recorrido)',agente:'El agente'};
// Registro en memoria de esta sesión. Pasar a Sheets es una etapa posterior.
export function crearRegistro({reloj=()=>new Date().toISOString(),max=200}={}){
 const visitas=[];
 return {
  registrar({espacio,quien='direccion',motivo=''}={}){
   if(!POR_ID.has(espacio)||!Object.hasOwn(QUIENES,quien))throw Error('visita_invalida');
   const nota=typeof motivo==='string'?motivo.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,120):'';
   const visita={espacio,quien,motivo:nota,en:String(reloj())};
   visitas.push(visita);
   if(visitas.length>max)visitas.shift();
   return {...visita};
  },
  lista:()=>visitas.map(v=>({...v})),
  cuantas:id=>visitas.filter(v=>v.espacio===id).length
 };
}

function crear(doc,tag,props={},hijos=[]){
 const e=doc.createElement(tag);
 for(const [k,v] of Object.entries(props)){
  if(k==='texto')e.textContent=v;
  else if(k==='on')for(const [ev,fn] of Object.entries(v))e.addEventListener(ev,fn);
  else if(v===false||v===null||v===undefined)continue;
  else e.setAttribute(k,String(v));
 }
 for(const h of hijos)e.appendChild(h);
 return e;
}
const hora=iso=>{const d=new Date(iso);return Number.isNaN(d.getTime())?'':d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});};

export function crearEntorno({doc=document,registro,ir=()=>false,enviar=null,volver=null,entregas=null,alCerrar=()=>{}}={}){
 const h=(tag,props,hijos)=>crear(doc,tag,props,hijos);
 const raiz=h('section',{class:'entorno-hoja',role:'dialog','aria-modal':'true','aria-labelledby':'entorno-titulo'});
 raiz.appendChild(h('button',{type:'button',class:'entorno-cerrar','aria-label':'Cerrar el entorno',texto:'×',on:{click:()=>alCerrar()}}));
 raiz.appendChild(h('h1',{id:'entorno-titulo',texto:'Entorno del agente'}));
 raiz.appendChild(h('p',{class:'entorno-aviso',texto:'Etapas 1 y 2: aquí se ven los espacios, lo que el agente puede hacer en cada uno y quién los ha visitado en esta sesión. Todo está en solo observar: no se envía nada, no se crea nada y no se escribe en Sheets.'}));
 const lista=h('div',{class:'entorno-lista'});
 const bitacora=h('ol',{class:'entorno-bitacora','aria-live':'polite'});
 const limpiar=n=>{while(n.firstChild)n.removeChild(n.firstChild);};
 // Entregas por aprobar de la sala de juntas (solo lectura).
 let porAprobar={fase:'inicio',tarjetas:[]};
 async function verEntregas(){
  if(porAprobar.fase==='leyendo'||typeof entregas!=='function')return;
  porAprobar={fase:'leyendo',tarjetas:[]};pintar();
  let r;
  try{r=await entregas();}catch{r=null;}
  if(!r||r.estado==='error')porAprobar={fase:'error',tarjetas:[]};
  else porAprobar={fase:r.tarjetas.length?'ok':'vacio',tarjetas:r.tarjetas};
  pintar();
 }
 function pintarEntregas(){
  const caja=h('div',{class:'entorno-entregas','aria-live':'polite'});
  const f=porAprobar.fase;
  if(f==='leyendo')caja.appendChild(h('p',{texto:'Leyendo lo que espera tu decisión…'}));
  else if(f==='vacio')caja.appendChild(h('p',{texto:'No hay nada esperando tu aprobación o decisión ahora.'}));
  else if(f==='error')caja.appendChild(h('p',{texto:'No pude leerlo ahora. Vuelve a intentarlo; no se cambió nada.'}));
  else if(f==='ok'){
   const ul=h('ul',{class:'entorno-entregas-lista'});
   for(const t of porAprobar.tarjetas.slice(0,10))ul.appendChild(h('li',{},[h('b',{texto:t.titulo}),h('span',{texto:' · '+(t.categoria==='aprobar'?'Por aprobar':'Por decidir')+' · '+t.origen}),h('p',{texto:t.detalle})]));
   caja.appendChild(ul);
   if(porAprobar.tarjetas.length>10)caja.appendChild(h('p',{texto:'y '+(porAprobar.tarjetas.length-10)+' más'}));
   caja.appendChild(h('p',{class:'entorno-nota',texto:'Aquí no se aprueba nada: la aprobación se hace en YOD OS.'}));
  }
  return caja;
 }
 function pintar(){
  limpiar(lista);limpiar(bitacora);
  for(const e of ESPACIOS){
   const hay=e.lugar!==null;
   const n=registro.cuantas(e.id);
   const pie=[h('span',{class:'entorno-chip '+(hay?'ok':'espera'),texto:hay?'Con lugar en el Despacho':'Por construir · etapa '+e.etapa}),
    h('span',{class:'entorno-chip',texto:PERMISOS[e.permiso]}),
    h('span',{class:'entorno-chip',texto:'Visitas: '+n})];
   const hijos=[h('h2',{texto:e.nombre}),h('p',{texto:e.funcion}),h('div',{class:'entorno-chips'},pie)];
   if(hay){
    const acciones=[h('button',{type:'button',class:'entorno-ir',texto:'Ir a este espacio',on:{click:async()=>{
     if(await ir(e)!==false)pintar();
    }}})];
    if(typeof enviar==='function')acciones.push(h('button',{type:'button',class:'entorno-enviar',texto:'Enviar al agente',on:{click:()=>{
     if(enviar(e)!==false)pintar();
    }}}));
    if(e.id==='juntas'&&typeof entregas==='function')acciones.push(h('button',{type:'button',class:'entorno-entregas-ver',texto:'Ver entregas por aprobar',on:{click:()=>verEntregas()}}));
    hijos.push(h('div',{class:'entorno-acciones'},acciones));
    if(e.id==='juntas'&&porAprobar.fase!=='inicio')hijos.push(pintarEntregas());
   }
   lista.appendChild(h('article',{class:'entorno-espacio','data-espacio':e.id},hijos));
  }
  const recientes=registro.lista().slice(-8).reverse();
  if(!recientes.length)bitacora.appendChild(h('li',{texto:'Todavía no hay visitas en esta sesión.'}));
  for(const v of recientes)bitacora.appendChild(h('li',{texto:[hora(v.en),QUIENES[v.quien],espacioDe(v.espacio)?.nombre].filter(Boolean).join(' · ')}));
 }
 if(typeof volver==='function')raiz.appendChild(h('button',{type:'button',class:'entorno-volver',texto:'Que el agente vuelva a su lugar',on:{click:()=>{volver();}}}));
 raiz.appendChild(lista);
 raiz.appendChild(h('h2',{class:'entorno-sub',texto:'Visitas de esta sesión'}));
 raiz.appendChild(bitacora);
 pintar();
 return {raiz,pintar};
}

// Monta el botón y la hoja. Devuelve false si el entorno no debe aparecer.
export function montarEntorno({win=globalThis.window,doc=globalThis.document,activo=ENTORNO_ACTIVO,juntas=ENTORNO_JUNTAS,leer=leerMetas,registro=crearRegistro()}={}){
 if(!win||!doc)return false;
 const vistaPrevia=/(?:^|[?&])entorno=1(?:&|$)/.test(String(win.location?.search||''));
 if(!activo&&!vistaPrevia)return false;
 const boton=doc.getElementById('entorno-open');
 if(!boton)return false;
 let hoja=null,desuscribir=null,perfil=null;
 const cerrar=()=>{
  if(!hoja)return;
  hoja.raiz.parentNode?.removeChild(hoja.raiz);hoja=null;
  doc.removeEventListener?.('keydown',alTeclear);
  boton.focus?.();
 };
 function alTeclear(e){if(e.key==='Escape')cerrar();}
 const ir=async espacio=>{
  const oficina=win.despacho;
  if(!espacio.lugar||typeof oficina?.visit!=='function')return false;
  const actual=perfil;cerrar();
  const llegada=await oficina.visit(espacio.lugar);
  if(llegada===true&&perfil===actual)registro.registrar({espacio:espacio.id,quien:'direccion',motivo:'Vista situada desde el entorno'});
  return false;
 };
 // Solo si la oficina ofrece el movimiento del agente (interruptor de caminar o ?camina=1).
 const caminar=()=>typeof win.despacho?.agenteIr==='function';
 const enviar=espacio=>{
  if(!espacio.lugar||!caminar())return false;
  if(!win.despacho.agenteIr(espacio.lugar))return false;
  cerrar();
  win.despacho.setMode?.('overview');
  return false;
 };
 const volver=()=>{
  if(!caminar()||!win.despacho.agenteIr('inicio'))return false;
  cerrar();
  win.despacho.setMode?.('overview');
  return false;
 };
 win.addEventListener('yod-agent-arrived',e=>{
  if(!perfil)return;
  const espacio=ESPACIOS.find(s=>s.lugar&&s.lugar===e.detail?.lugar);
  if(espacio){registro.registrar({espacio:espacio.id,quien:'agente',motivo:'Llegada confirmada'});hoja?.pintar();}
 });
 const conJuntas=juntas||/(?:^|[?&])juntas=1(?:&|$)/.test(String(win.location?.search||''));
 const entregas=async()=>{
  const actual=perfil;
  if(!actual?.case_id)return {estado:'error'};
  const metas=await leer({win,caseId:actual.case_id});
  if(!metas||perfil!==actual)return {estado:'error'};
  const tarjetas=pendientesDeMetas(metas,{de:typeof actual.name==='string'?actual.name:'Caso'}).filter(t=>t.categoria==='aprobar'||t.categoria==='decidir');
  return {estado:'ok',tarjetas};
 };
 const abrir=()=>{
  if(hoja||!perfil)return;
  hoja=crearEntorno({doc,registro,ir,enviar:caminar()?enviar:null,volver:caminar()?volver:null,entregas:conJuntas?entregas:null,alCerrar:cerrar});
  doc.body.appendChild(hoja.raiz);
  doc.addEventListener?.('keydown',alTeclear);
 };
 const alPerfil=p=>{
  perfil=p&&typeof p==='object'?p:null;
  boton.hidden=!perfil;
  if(!perfil)cerrar();
 };
 const conectar=()=>{
  const sesion=win.CubefarmYOD;
  if(!sesion||desuscribir||typeof sesion.subscribeProfile!=='function')return;
  desuscribir=sesion.subscribeProfile(alPerfil);
 };
 boton.hidden=true;
 boton.addEventListener('click',abrir);
 win.addEventListener('yod-agents-ready',conectar);
 conectar();
 return true;
}
