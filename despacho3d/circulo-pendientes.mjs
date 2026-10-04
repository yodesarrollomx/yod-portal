// Pendientes reales del círculo. Solo lectura: pide al OS las metas del caso (readGoals) y las
// convierte en tarjetas. No crea, aprueba ni detiene metas, y no escribe en Sheets.
// La categoría la pone Jev cuando el motor la dejó en el resumen de la meta (JEV_GASTON_CARDS=on);
// si no está, se usa el estado de la acción. Nunca se guarda ni se muestra nada fuera de esta hoja.
import {createFrameTransport} from './conversation.mjs';
import {validateGoals} from './goals.mjs';

// Textos exactos con los que el motor resume las tarjetas (cloud/cards-jev.mjs).
const ETIQUETAS={'listas para aprobar':'aprobar','esperan tu decision':'decidir','con cifras por verificar':'cifras','bloqueadas por falta de datos':'datos','borradores':'borrador'};
const ORDEN=['aprobar','decidir','cifras','datos','borrador'];
const POR_ESTADO_ACCION={ready_for_review:'aprobar',blocked:'datos',pending:'borrador',running:'borrador'};
const POR_ESTADO_META={ready_for_review:'aprobar',awaiting_data:'datos',stopped:'decidir',queued:'borrador',running:'borrador'};
const MAX_TARJETAS=50;

const cortar=(valor,max,vacio)=>{
 const t=typeof valor==='string'?valor.trim():'';
 if(!t)return vacio;
 return t.length>max?t.slice(0,max-1)+'…':t;
};

// Lee la línea "Jev ordeno las N acciones. Seguras: ... (etiqueta: task-1, task-2; ...). A revisar a mano: ..."
export function categoriasDeJev(resumen){
 const porAccion=new Map(),aRevisar=new Set();
 if(typeof resumen!=='string')return {porAccion,aRevisar};
 const seguras=/Jev ordeno las \d+ acciones\. Seguras: \d+(?: \(([^)]*)\))?\./.exec(resumen);
 if(seguras?.[1]){
  for(const grupo of seguras[1].split('; ')){
   const corte=grupo.indexOf(': ');
   if(corte<0)continue;
   const categoria=ETIQUETAS[grupo.slice(0,corte).trim()];
   if(!categoria)continue;
   for(const id of grupo.slice(corte+2).split(',').map(s=>s.trim()))if(/^task-[1-8]$/.test(id))porAccion.set(id,categoria);
  }
 }
 const dudosas=/A revisar a mano: \d+(?: \(([^)]*)\))?/.exec(resumen);
 if(dudosas?.[1])for(const id of dudosas[1].split(',').map(s=>s.trim()))if(/^task-[1-8]$/.test(id))aRevisar.add(id);
 return {porAccion,aRevisar};
}

export function pendientesDeMetas(modelo,{de='Caso'}={}){
 const quien=cortar(de,120,'Caso'),salida=[];
 for(const meta of Array.isArray(modelo?.goals)?modelo.goals:[]){
  if(meta.status==='completed')continue;
  const jev=categoriasDeJev(meta.summary);
  const contexto=cortar(meta.title,100,'Meta');
  if(!meta.tasks?.length){
   const categoria=POR_ESTADO_META[meta.status];
   if(!categoria)continue;
   salida.push({titulo:cortar(meta.title,160,'Meta sin título'),detalle:cortar(meta.summary||meta.criterion,600,'Sin detalle'),categoria,con:categoria==='borrador'?'otros':'dir',de:quien,origen:'Estado de la meta'});
   continue;
  }
  for(const tarea of meta.tasks){
   const deJev=jev.porAccion.get(tarea.id);
   const categoria=deJev||POR_ESTADO_ACCION[tarea.status];
   if(!categoria)continue;
   const origen=deJev?'Jev · '+contexto:(jev.aRevisar.has(tarea.id)?'A revisar a mano · ':'Estado de la acción · ')+contexto;
   salida.push({titulo:cortar(tarea.title,160,'Acción sin título'),detalle:cortar(tarea.summary||tarea.criterion,600,'Sin detalle'),categoria,con:categoria==='borrador'?'otros':'dir',de:quien,origen:cortar(origen,120,'Meta')});
  }
 }
 return salida.map((p,i)=>[p,i]).sort((a,b)=>ORDEN.indexOf(a[0].categoria)-ORDEN.indexOf(b[0].categoria)||a[1]-b[1]).map(x=>x[0]).slice(0,MAX_TARJETAS);
}

// Devuelve las metas validadas, o null ante cualquier falla (sin sesión, sin permiso, tiempo, datos raros).
export async function leerMetas({win,caseId,crearTransporte=createFrameTransport,tiempoMs=12000}={}){
 if(typeof caseId!=='string'||!caseId)return null;
 let transporte,reloj;
 try{
  transporte=crearTransporte(win);
  const respuesta=await Promise.race([
   transporte.readGoals({case_id:caseId}),
   new Promise((_,rechazar)=>{reloj=setTimeout(()=>rechazar(Error('timeout')),tiempoMs);})
  ]);
  if(respuesta?.ok===false)return null;
  return validateGoals(respuesta,caseId);
 }catch{
  return null;
 }finally{
  clearTimeout(reloj);
  try{transporte?.dispose?.();}catch{}
 }
}

// Arma los datos del círculo con Pendientes reales; los demás sectores se declaran sin conectar.
export function datosReales(perfil,metas){
 const de=cortar(perfil?.name,120,'Caso');
 const pendientes=metas?pendientesDeMetas(metas,{de}):[];
 return {
  ejemplo:false,
  parcial:true,
  avisoPendientes:metas?(pendientes.length?'':'No hay acciones abiertas en las metas de este caso.'):'No pude leer las metas ahora. Cierra y vuelve a abrir el círculo; no se cambió nada.',
  pendientes,
  ppp:{vigente:null,borrador:null,nota:'El tablero PPP real se conecta en una etapa posterior; aquí no se aprueba nada.'},
  historial:[],
  moac:[],
  documentos:[],
  conversaciones:[]
 };
}
