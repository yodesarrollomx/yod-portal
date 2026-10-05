// Círculo de seis sectores del caso, en primera persona.
// Solo lectura: no hace peticiones de red ni escribe en Sheets. Sale a la vista únicamente
// si el interruptor está encendido (o ?circulo=1) y el servidor autorizó el perfil del caso.
import {CIRCULO_ACTIVO,CIRCULO_PENDIENTES_REALES} from './circulo-config.mjs';
import {CATEGORIAS,datosDeEjemplo,validarDatos} from './circulo-datos.mjs';
import {datosReales,leerMetas} from './circulo-pendientes.mjs';

export const SECTORES=[
 {id:'pendientes',etiqueta:'Pendientes',voz:'Esto es lo que me falta resolver y con quién está.'},
 {id:'ppp',etiqueta:'Tablero PPP',voz:'Trabajo en mi versión y propongo cambios. La vigente es la que Dirección aprobó.'},
 {id:'historial',etiqueta:'Historial',voz:'Así he ido cambiando desde mi primer registro.'},
 {id:'moac',etiqueta:'MOAC interno',voz:'Mis trabajos y lo que tengo que resolver.'},
 {id:'documentos',etiqueta:'Documentos',voz:'Mis versiones definitivas, con lo recibido y lo comprobado por separado.'},
 {id:'conversaciones',etiqueta:'Conversaciones',voz:'Con quién hablo, qué me piden y de dónde viene.'}
];
const NS='http://www.w3.org/2000/svg';
const C=200,R=192,r=96,HUECO=0.035;
const punto=(radio,a)=>[+(C+radio*Math.sin(a)).toFixed(2),+(C-radio*Math.cos(a)).toFixed(2)];
// Trayecto de un sector: anillo entre r y R, el primero empieza arriba y avanza a la derecha.
export function trayecto(i){
 const a0=i*Math.PI/3+HUECO,a1=(i+1)*Math.PI/3-HUECO;
 const p0=punto(R,a0),p1=punto(R,a1),p2=punto(r,a1),p3=punto(r,a0);
 return 'M'+p0.join(' ')+' A'+R+' '+R+' 0 0 1 '+p1.join(' ')+' L'+p2.join(' ')+' A'+r+' '+r+' 0 0 0 '+p3.join(' ')+' Z';
}
export const centro=i=>punto((R+r)/2,(i*Math.PI/3+(i+1)*Math.PI/3)/2);
export function cuentas(datos,estado={}){
 const pendientes=String(datos.pendientes.length);
 if(datos.parcial)return {pendientes,ppp:'—',historial:'—',moac:'—',documentos:'—',conversaciones:'—'};
 return {
  pendientes,
  ppp:datos.ppp.borrador?'1 propuesta':'al día',
  historial:String(datos.historial.length),
  moac:String(datos.moac.filter(m=>m[2]!=='ok').length),
  documentos:String(datos.documentos.length),
  conversaciones:String(datos.conversaciones.length)
 };
}

function crear(doc,tag,props={},hijos=[],ns=false){
 const e=ns?doc.createElementNS(NS,tag):doc.createElement(tag);
 for(const [k,v] of Object.entries(props)){
  if(k==='texto')e.textContent=v;
  else if(k==='on')for(const [ev,fn] of Object.entries(v))e.addEventListener(ev,fn);
  else if(v===false||v===null||v===undefined)continue;
  else e.setAttribute(k,String(v));
 }
 for(const h of hijos)e.appendChild(h);
 return e;
}

export function crearCirculo({doc=document,datos=datosDeEjemplo(),perfil={name:'Caso'},alCerrar=()=>{}}={}){
 const model=validarDatos(datos);
 const nombre=typeof perfil?.name==='string'&&perfil.name.trim()?perfil.name.trim().slice(0,120):'Caso';
 const estado={sector:'pendientes',filtro:'todos',chat:0};
 const h=(tag,props,hijos)=>crear(doc,tag,props,hijos);
 const raiz=h('section',{class:'circulo-hoja',role:'dialog','aria-modal':'true','aria-labelledby':'circulo-titulo'});
 const cerrar=h('button',{type:'button',class:'circulo-cerrar','aria-label':'Cerrar el círculo',texto:'×',on:{click:()=>alCerrar()}});
 const svg=crear(doc,'svg',{viewBox:'0 0 400 400',role:'group','aria-label':'Sectores del círculo'},[],true);
 const nucleo=h('div',{class:'circulo-nucleo'},[h('b',{texto:nombre}),h('span',{texto:model.ejemplo?'Datos de ejemplo':model.parcial?'Pendientes reales':'Datos del expediente'})]);
 const voz=h('p',{class:'circulo-voz'});
 const panel=h('div',{class:'circulo-panel','aria-live':'polite'});
 raiz.appendChild(cerrar);
 raiz.appendChild(h('h1',{id:'circulo-titulo',texto:'Círculo de '+nombre}));
 if(model.ejemplo)raiz.appendChild(h('p',{class:'circulo-aviso',texto:'Vista de ejemplo. Los datos reales se conectan en una etapa posterior; nada de aquí escribe en Sheets.'}));
 if(model.parcial)raiz.appendChild(h('p',{class:'circulo-aviso',texto:'Datos reales: por ahora solo Pendientes está conectado, en solo lectura. Los demás sectores se conectan por etapas y nada de aquí escribe en Sheets.'}));
 raiz.appendChild(h('div',{class:'circulo-cuerpo'},[h('div',{class:'circulo-anillo'},[h('div',{class:'circulo-figura'},[svg,nucleo]),voz]),panel]));

 const limpiar=n=>{while(n.firstChild)n.removeChild(n.firstChild);};
 const elegir=id=>{estado.sector=id;pintar();};
 function dibujarAnillo(){
  limpiar(svg);
  const n=cuentas(model);
  SECTORES.forEach((s,i)=>{
   const activo=estado.sector===s.id,c=centro(i);
   const g=crear(doc,'g',{class:activo?'on':''},[
    crear(doc,'path',{d:trayecto(i),class:'circulo-gajo',role:'button',tabindex:'0','aria-label':s.etiqueta,'aria-pressed':String(activo),on:{click:()=>elegir(s.id),keydown:e=>{if(e.key==='Enter'||e.key===' '){if(e.preventDefault)e.preventDefault();elegir(s.id);}}}},[],true),
    crear(doc,'text',{class:'circulo-et',x:c[0],y:c[1]-2,texto:s.etiqueta},[],true),
    crear(doc,'text',{class:'circulo-n',x:c[0],y:c[1]+14,texto:n[s.id]},[],true)
   ],true);
   svg.appendChild(g);
  });
 }
 const encabezado=(t,sub)=>{panel.appendChild(h('h2',{texto:t}));panel.appendChild(h('p',{class:'circulo-sub',texto:sub}));};
 const chip=(t,clase)=>h('span',{class:'circulo-chip '+clase,texto:t});
 const tarjeta=(titulo,detalle,pie)=>h('div',{class:'circulo-tarjeta'},[h('h3',{texto:titulo}),detalle?h('p',{texto:detalle}):h('span'),h('div',{class:'circulo-pie'},pie)]);
 const lista=hijos=>h('div',{class:'circulo-lista'},hijos);
 const sinConectar='Este sector todavía no está conectado a datos reales.';
 const vacio=t=>h('p',{class:'circulo-nota',texto:t});
 const segmentos=(opciones,actual,fn)=>h('div',{class:'circulo-seg'},opciones.map(([v,t])=>h('button',{type:'button',texto:t,'aria-pressed':String(actual===v),on:{click:()=>fn(v)}})));
 const dl=filasDatos=>{
  const d=h('dl');
  for(const [k,v,t] of filasDatos){d.appendChild(h('dt',{texto:k}));d.appendChild(h('dd',{class:t?'t-'+t:'',texto:v}));}
  return d;
 };
 const vistas={
  pendientes(){
   encabezado('Pendientes','Mensajes y resultados por resolver, con Dirección o con otros integrantes. Cada tarjeta lleva la categoría de Jev.');
   panel.appendChild(segmentos([['todos','Todos'],['dir','Con Dirección'],['otros','Con otros']],estado.filtro,v=>{estado.filtro=v;pintar();}));
   const visibles=model.pendientes.filter(p=>estado.filtro==='todos'||p.con===estado.filtro);
   if(!visibles.length)panel.appendChild(vacio(model.avisoPendientes||'No hay pendientes en este filtro.'));
   panel.appendChild(lista(visibles.map(p=>tarjeta(p.titulo,p.detalle,[chip(CATEGORIAS[p.categoria],'c-'+p.categoria),h('span',{texto:p.de}),h('span',{texto:'· '+p.origen})]))));
  },
  ppp(){
   encabezado('Tablero PPP','El mismo tablero del portal. Lo editan Dirección y el caso: el caso trabaja en su versión y propone cambios; la vigente es siempre la última aprobada por Dirección.');
   const col=[h('div',{class:'circulo-version'},[h('h3',{texto:model.ppp.vigente?.titulo||'Sin versión vigente'}),model.ppp.vigente?dl(model.ppp.vigente.filas):h('span')])];
   if(model.ppp.borrador){
    col.push(h('div',{class:'circulo-version borrador'},[h('h3',{texto:model.ppp.borrador.titulo}),dl(model.ppp.borrador.filas),
     h('div',{class:'circulo-seg'},[h('button',{type:'button',disabled:'disabled',texto:'Aprobar como vigente'}),h('button',{type:'button',disabled:'disabled',texto:'Devolver con comentarios'})])]));
   }
   panel.appendChild(h('div',{class:'circulo-cols'},col));
   panel.appendChild(h('p',{class:'circulo-nota',texto:model.ppp.nota}));
  },
  historial(){
   encabezado('Historial','Línea de tiempo desde el primer registro.');
   if(!model.historial.length)panel.appendChild(vacio(sinConectar));
   panel.appendChild(h('ul',{class:'circulo-linea'},model.historial.map(([f,t])=>h('li',{},[h('time',{texto:f}),h('p',{texto:t})]))));
  },
  moac(){
   encabezado('MOAC interno','Mis trabajos y lo que tengo que resolver.');
   if(!model.moac.length)panel.appendChild(vacio(sinConectar));
   panel.appendChild(lista(model.moac.map(([t,e,tono])=>tarjeta(t,'',[chip(e,'t-'+tono)]))));
  },
  documentos(){
   encabezado('Documentos','Versiones definitivas, actualizadas. Lo recibido no se confunde con lo comprobado.');
   if(!model.documentos.length)panel.appendChild(vacio(sinConectar));
   panel.appendChild(lista(model.documentos.map(([t,e,tono,nota])=>tarjeta(t,nota,[chip(e,'t-'+tono)]))));
  },
  conversaciones(){
   encabezado('Conversaciones','Con quién hablo, qué me piden y de dónde viene.');
   if(!model.conversaciones.length){panel.appendChild(vacio(sinConectar));return;}
   const sel=Math.min(estado.chat,model.conversaciones.length-1);
   const botones=model.conversaciones.map((c,i)=>h('button',{type:'button','aria-pressed':String(i===sel),on:{click:()=>{estado.chat=i;pintar();}}},[h('span',{texto:c.nombre}),h('small',{texto:c.detalle})]));
   const msgs=h('div',{class:'circulo-msgs'},(model.conversaciones[sel]?.mensajes||[]).map(([q,t,hora])=>h('div',{class:'circulo-burbuja '+q},[h('span',{texto:t}),hora?h('small',{texto:hora}):h('span')])));
   panel.appendChild(h('div',{class:'circulo-chat'},[h('div',{class:'circulo-chats'},botones),msgs]));
   panel.appendChild(h('p',{class:'circulo-nota',texto:'Las pruebas de WhatsApp o Gmail salen solo al número de Dirección y con su confirmación; lo importante pasa primero por borrador.'}));
  }
 };
 function pintar(){
  limpiar(panel);
  vistas[estado.sector]();
  voz.textContent='“'+SECTORES.find(s=>s.id===estado.sector).voz+'”';
  dibujarAnillo();
 }
 pintar();
 return {raiz,estado,elegir,model};
}

// Monta el botón y la hoja. Devuelve false si el círculo no debe aparecer.
export function montarCirculo({win=globalThis.window,doc=globalThis.document,activo=CIRCULO_ACTIVO,pendientesReales=CIRCULO_PENDIENTES_REALES,leer=leerMetas}={}){
 if(!win||!doc)return false;
 const vistaPrevia=/(?:^|[?&])circulo=1(?:&|$)/.test(String(win.location?.search||''));
 if(!activo&&!vistaPrevia)return false;
 const reales=pendientesReales||/(?:^|[?&])pendientes=1(?:&|$)/.test(String(win.location?.search||''));
 const boton=doc.getElementById('circulo-open');
 if(!boton)return false;
 let hoja=null,desuscribir=null,perfil=null,abriendo=false;
 const cerrar=()=>{
  if(!hoja)return;
  hoja.raiz.parentNode?.removeChild(hoja.raiz);hoja=null;
  doc.removeEventListener?.('keydown',alTeclear);
  boton.focus?.();
 };
 function alTeclear(e){if(e.key==='Escape')cerrar();}
 const abrir=async()=>{
  if(hoja||abriendo||!perfil)return;
  const actual=perfil;
  let datos;
  if(reales){
   const etiqueta=boton.textContent;
   abriendo=true;boton.disabled=true;boton.textContent='Leyendo…';
   const metas=await leer({win,caseId:actual.case_id});
   abriendo=false;boton.disabled=false;boton.textContent=etiqueta;
   if(hoja||perfil!==actual)return;
   datos=datosReales(actual,metas);
  }
  hoja=crearCirculo({doc,perfil:actual,datos,alCerrar:cerrar});
  doc.body.appendChild(hoja.raiz);
  doc.addEventListener?.('keydown',alTeclear);
 };
 const alPerfil=p=>{
  perfil=p&&typeof p==='object'?p:null;
  boton.hidden=!perfil;
  if(!perfil)cerrar();
 };
 const conectar=()=>{
  const sesion=win.YodResidentAgents||win.CubefarmYOD;
  if(!sesion||desuscribir||typeof sesion.subscribeProfile!=='function')return;
  desuscribir=sesion.subscribeProfile(alPerfil);
 };
 boton.hidden=true;
 boton.addEventListener('click',abrir);
 win.addEventListener('yod-residents-ready',()=>{desuscribir?.();desuscribir=null;conectar();});
 win.addEventListener('yod-agents-ready',conectar);
 conectar();
 return true;
}
