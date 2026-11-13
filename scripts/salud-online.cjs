'use strict';
// Sólo GET públicos allowlisted; publicación técnica en rama separada de main.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Health=require('../os/yod-salud.js');
const REPO='yodesarrollomx/yod-portal',BRANCH='estado-online',FILE='estado-online.json';
const SALA='https://yodesarrollomx.github.io/sala-edicion/';
const catalog=require('../os/salud-catalogo.json');
const FRONTS=[
 ['SYS-YOD-OS','YOD OS','yod-portal/os/'],
 ['SYS-POTENCIALES','PPP','potenciales-yod/'],
 ['SYS-DESPACHO','Despacho','yod-despacho/'],
 ['SYS-TRACK','Codesarrollos','yod-portal/track-codesarrollos.html'],
 ['SYS-MIRAMAR','Real de Miramar','real-miramar-board/'],
 ['SYS-TAREAS','MOAC','board-aurum/'],
 ['SYS-FLUJO','Flujo','board-flujo-yod/'],
 ['SYS-INTERIORES','AURUM','interiores-aurum/'],
 ['SYS-INVERSION','Masterbrokers','yodesarrollo-board/brokers.html'],
 ['SYS-MARKETING','Embudo comercial','aurum-board/'],
 ['SYS-OBRA','Obra en vivo','yod-portal/obra.html'],
 ['SYS-SALA','Sala de Edición','sala-edicion/'],
 ['SYS-PLAN-POTENCIAL','Plan de Potencial','plan-potencial/'],
 ['SYS-CROKISS','CroKiss','crokiss/'],
 ['SYS-CODES-PORTAL','Portal de codesarrolladores','Co-desarrolladores-Yod/'],
 ['SYS-ALQUIMIA','Alquimia Urbana','alquimia-urbana/'],
 ['SYS-OBRA-CLIENTE','Obra · cliente','yod-portal/obra-app/'],
 ['SYS-AURUM-EXPERIENCIA','Experiencia Aurum','aurum-experiencia/'],
 ['SYS-EMD','Evaluación de personas · entrada','emd-evaluacion-360/'],
 ['SYS-PINTARRON','Pintarrón','pintarron/'],
 ['SYS-SITIO-ORG','Sitio de organización',''],
 ['SYS-PRUEBA-DOMINIO','Prueba de dominio','prueba-dominio/']
];
const ROUTINES=[
 ['plan','Plan · lectura agregada','Cada hora, minuto25',4,['SYS-PLAN-POTENCIAL']],
 ['productor','Sala · Productor','Cada hora, minutos10,30,50',3,['SVC-SALA-PRODUCTOR']],
 ['ejecutor','Sala · Ejecutor','Horas impares de Hermosillo, minuto20; también al recibir trabajo',6,['SVC-SALA-EJECUTOR']],
 ['mesa','Sala · Mesa','Cada hora, minuto35; diario05:40Hermosillo',3,['SYS-SALA']],
 ['arranque','Sala · Arranque','Cada hora, minuto05; semillero diario05:50Hermosillo',3,['SYS-SALA']],
 ['chinches','Sala · Encargos','Cada hora, minuto45',3,['SYS-SALA']],
 ['maquinas','Sala · Semáforo','Horas impares de Hermosillo, minuto15',6,['SYS-SALA']],
 ['relevo','Sala · Respaldo','06:00,09:00,12:00,15:00,18:00Hermosillo',12,['SYS-SALA']]
];
function fresh(s,now,ms){const t=Date.parse(s);return Number.isFinite(t)&&t<=Date.parse(now)&&Date.parse(now)-t<=ms;}
function record(id,nombre,components,estado,now,detail,scope='Prueba técnica',extra={}){
 return {id,nombre,components,estado,revisado_en:now,vence_en:new Date(Date.parse(now)+45*60000).toISOString(),
   detalle:detail,alcance:scope,...extra};
}
function validateRevision(r){return !!r&&r.schema===1&&Array.isArray(r.rutinas)&&
 ['confirmada','sin_confirmar'].includes(r.cola_estado)&&Array.isArray(r.errores);}
function allowed(url){
 const u=new URL(url);
 return u.protocol==='https:'&&!u.username&&!u.password&&
 (['yodesarrollomx.github.io','raw.githubusercontent.com','api.github.com'].includes(u.hostname)||
  (u.hostname==='script.google.com'&&u.searchParams.get('recurso')==='meta')||
  u.hostname.endsWith('.googleusercontent.com'));
}
async function read(url,{api=false,json=false,redirects=0}={}){
 if(!allowed(url))throw Error('destino_fuera_de_allowlist');
 const headers=api?{Accept:'application/vnd.github+json','User-Agent':'yod-salud',
   ...(process.env.GH_TOKEN?{Authorization:'Bearer '+process.env.GH_TOKEN}:{})}:{'User-Agent':'yod-salud'};
 const r=await fetch(url,{headers,redirect:'manual',signal:AbortSignal.timeout(18000)});
 if([301,302,303,307,308].includes(r.status)){
   if(api||redirects>=3)throw Error('redireccion_sin_confirmar');
   const target=new URL(r.headers.get('location'),url).href;
   if(!allowed(target))throw Error('destino_fuera_de_allowlist');
   return read(target,{json,redirects:redirects+1});
 }
 if(!r.ok){const e=Error('lectura_http_'+r.status);e.status=r.status;throw e;}
 const data=await r.text();if(data.length>2*1024*1024)throw Error('respuesta_demasiado_grande');
 return json?JSON.parse(data):data;
}
function apiRead(repo,p){return read('https://api.github.com/repos/'+repo+'/'+p,{api:true,json:true});}
async function page(def,now,reader=read){
 const [id,name,relative]=def,url='https://yodesarrollomx.github.io/'+relative;
 try{
   const text=await reader(url+'?salud='+Date.parse(now));
   if(!/<html\b/i.test(text)||!/<(?:title|body)\b/i.test(text))throw Error('html_sin_contrato');
   return record('pagina:'+id,name+' · página',[id],'ok',now,
     'HTML publicado disponible; operaciones y permisos requieren sus propias pruebas',
     'Disponibilidad de la página',{evidencia_url:url});
 }catch(e){
   return record('pagina:'+id,name+' · página',[id],[401,403].includes(e.status)?'sin_confirmar':'fallo',now,
     [401,403].includes(e.status)?'Página requiere acceso; lectura pública no acredita disponibilidad':'La página o su contrato HTML no se pudo comprobar',
     'Disponibilidad de la página',{evidencia_url:url});
 }
}
function revisionChecks(r,now){
 const out=[];
 if(!validateRevision(r)||!fresh(r.revisado_en,now,45*60000)){
   return [record('sala-lectura','Sala · cola y reglas',['SYS-SALA','GAS-SALA'],'sin_confirmar',now,
     'Revisión no vigente o sin contrato; no se acredita lectura actual','Lectura autorizada')];
 }
 out.push(record('sala-lectura','Sala · cola y reglas',['SYS-SALA','GAS-SALA'],
   r.cola_estado==='confirmada'&&r.reglas_estado==='confirmada'&&fresh(r.cola_leida_en,now,45*60000)?'ok':'sin_confirmar',
   r.revisado_en,'Lectura agregada del backend; no certifica escrituras editoriales','Lectura autorizada',
   {evidencia_url:SALA}));
 out.push(record('sala-etapas','Sala · etapas en nube',['SVC-SALA-EJECUTOR'],
   r.reglas_estado==='confirmada'&&['voz','escena','corte','prospecto'].every(x=>(r.etapas||[]).includes(x))?'ok':'sin_confirmar',
   r.revisado_en,'Comprueba las cuatro etapas habilitadas; cada motor conserva su prueba independiente','Configuración leída'));
 if(r.rutinas_estado!=='confirmada'){
   out.push(record('sala-rutinas','Sala · lectura de rutinas',['EXT-ACTIONS'],'sin_confirmar',now,
     'La API no confirmó las rutinas; el estado previo no acredita salud actual','Lectura de Actions'));
 }else for(const[id,name,freq,hours,components]of ROUTINES){
   const row=r.rutinas.find(x=>x.id===id),job=row&&row.ultima;
   let state='sin_confirmar',detail='No hay ejecución reciente confirmada';
   if(job){
     if(['failure','timed_out','startup_failure'].includes(job.conclusion)){state='fallo';detail='La última ejecución de producción falló';}
     else if(job.status!=='completed'){state='ejecutando';detail='Hay una ejecución pendiente o en curso';}
     else if(job.conclusion==='success'&&fresh(job.termino,now,hours*3600000)){state='ok';detail='Última ejecución de producción completada correctamente';}
     else if(job.conclusion==='success')detail='Última ejecución correcta, fuera del plazo esperado';
     else detail='La última ejecución no terminó correctamente o fue cancelada';
   }
   out.push(record('rutina:'+id,name,components,state,now,detail,'Ejecución de la rutina',
     {frecuencia:freq,ultima_ejecucion:job&&job.termino||null,
      evidencia_url:job&&/^\d+$/.test(String(job.run_id))?
       'https://github.com/yodesarrollomx/sala-edicion/actions/runs/'+job.run_id:''}));
 }
 const active=r.disparadores_nube;
 out.push(record('sala-horarios','Sala · puertas programadas',['EXT-ACTIONS'],
   Array.isArray(active)&&active.length===4&&active.every(x=>x.activo===true)&&!r.errores.some(x=>x.startsWith('disparadores_'))?'ok':'sin_confirmar',
   r.revisado_en,'Comprueba el estado activo de las puertas; el horario declarado puede retrasarse','Estado de workflows'));
 const mail=r.correo;
 const mailDate=mail&&Date.parse(mail.ultimo_envio_registrado);
 const mailWhen=Number.isFinite(mailDate)?new Intl.DateTimeFormat('es-MX',{timeZone:'America/Hermosillo',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(mailDate)+' Hermosillo':'sin confirmar';
 out.push(record('correo-registro','Sala · registro de correo',['EXT-GMAIL'],
   mail&&mail.estado==='envio_registrado'&&fresh(mail.ultimo_envio_registrado,now,36*3600000)?'ok':'sin_confirmar',
   r.revisado_en,'Último envío registrado por el backend: '+mailWhen+
   '. Entrega y recepción se comprueban aparte','Registro del backend',
   {frecuencia:'Diario07:00Hermosillo; registro observado separado'}));
 out.push(record('correo-recepcion','Sala · recepción del correo',['EXT-GMAIL'],'sin_confirmar',now,
   'Aún no hay una prueba independiente de entrega y recepción','Recepción independiente'));
 return out;
}
function canaryChecks(r,now,lastAttempt){
 const names={'canario-reglas':['Canario · configuración',['GAS-SALA']],
   'motor-voz':['Sala · voz Kokoro',['EXT-MOTORES-MEDIA']],
   'motor-escena':['Sala · escena parallax',['EXT-MOTORES-MEDIA']],
   'motor-corte':['Sala · montaje de corte',['SVC-SALA-EJECUTOR']],
   'drive-transferencia':['Sala · transferencia Drive',['EXT-DRIVE']]};
 let valid=r&&r.schema===1&&Array.isArray(r.checks)&&/^[0-9a-f]{40}$/.test(r.code_sha||'')&&/^\d+$/.test(r.run_id||'');
 const newerFailed=lastAttempt&&lastAttempt.status==='completed'&&
   ['failure','timed_out','startup_failure'].includes(lastAttempt.conclusion)&&
   (!r||String(lastAttempt.id)!==String(r.run_id))&&(!r||Date.parse(lastAttempt.updated_at)>Date.parse(r.generado_en));
 return Object.entries(names).map(([id,[name,components]])=>{
   const c=valid&&r.checks.find(c=>c.id===id);
   let state=c&&['ok','fallo'].includes(c.estado)?c.estado:'sin_confirmar';
   if(newerFailed)state='sin_confirmar';
   return record(id,name,components,state,c&&c.revisado_en||now,
     newerFailed?'Una prueba posterior falló antes de publicar; requiere nueva comprobación':
       c&&typeof c.detalle==='string'?c.detalle:'Sin canario real publicado',
     'Prueba sintética aislada; no modifica el negocio',
     {vence_en:c&&c.vence_en||new Date(Date.parse(now)+45*60000).toISOString(),
      frecuencia:'Diario05:20Hermosillo',evidencia_url:valid?
       'https://github.com/yodesarrollomx/sala-edicion/actions/runs/'+r.run_id:''});
 });
}
async function collect(now=new Date().toISOString()){
 const checks=await Promise.all(FRONTS.map(d=>page(d,now)));
 for(const[file,id,name]of [['os/yod-salud.js','cliente-publicado','Accesos · cliente publicado'],['os/salud-catalogo.json','catalogo-publicado','Accesos · inventario publicado']]){
  try{
   const local=fs.readFileSync(path.join(__dirname,'../'+file),'utf8');
   const url='https://yodesarrollomx.github.io/yod-portal/'+file;
   const served=await read(url+'?salud='+Date.parse(now));
   checks.push(record(id,name,['SYS-YOD-OS','SYS-CONTROL'],served===local?'ok':'sin_confirmar',now,
    served===local?'Bytes servidos coinciden con el código aprobado de esta corrida':'La publicación aún no coincide con esta versión',
    'Publicación byte exacta',{evidencia_url:url}));
  }catch(e){checks.push(record(id,name,['SYS-YOD-OS','SYS-CONTROL'],'sin_confirmar',now,
   'No se pudo confirmar la publicación exacta','Publicación byte exacta'));}
 }
 try{
   const source=fs.readFileSync(path.join(__dirname,'../os/yod-acceso.js'),'utf8');
   const match=source.match(/(?:ORIGINAL|original)\s*[:=]\s*['"]([^'"]+)['"]/);
   if(!match)throw Error('portero_no_identificado');
   const data=await read(match[1]+'?recurso=meta',{json:true});
   checks.push(record('portero-meta','Portero · conexión',['GAS-PORTERO'],
    data&&data.ok===true&&data.pong===true?'ok':'fallo',now,
    'Contrato público meta/pong; el canje de sesión y los permisos se validan en Accesos','Respuesta del backend'));
 }catch(e){checks.push(record('portero-meta','Portero · conexión',['GAS-PORTERO'],'sin_confirmar',now,
   'No se pudo acreditar la respuesta del Portero original','Respuesta del backend'));}
 try{
   const [receipt,head,revision]=await Promise.all([
     read(SALA+'version-online.json?salud='+Date.parse(now),{json:true}),
     apiRead('yodesarrollomx/sala-edicion','branches/main'),
     read(SALA+'datos/revision.json?salud='+Date.parse(now),{json:true})]);
   const confirmed=receipt&&receipt.schema===1&&receipt.code_sha===head.commit.sha&&receipt.snapshot_id;
   checks.push(record('sala-publicacion','Sala · versión publicada',['SYS-SALA'],confirmed?'ok':'sin_confirmar',now,
     confirmed?'Recibo publicado corresponde al código vigente de main':'Código publicado y main todavía no coinciden','Versión publicada',
     {evidencia_url:SALA+'version-online.json'}));
   checks.push(...revisionChecks(revision,now));
 }catch(e){checks.push(record('sala-publicacion','Sala · revisión publicada',['SYS-SALA','GAS-SALA'],'sin_confirmar',now,
   'La revisión o su recibo no pudo comprobarse','Lectura agregada publicada'));}
 let canary=null,lastAttempt=null;
 try{canary=await read('https://raw.githubusercontent.com/yodesarrollomx/sala-edicion/salud-canario/estado-canario.json',{json:true});}catch(e){}
 try{
  const runs=await apiRead('yodesarrollomx/sala-edicion','actions/workflows/sala-salud-canario.yml/runs?branch=main&per_page=5');
  lastAttempt=(runs.workflow_runs||[]).find(r=>['push','schedule','workflow_dispatch'].includes(r.event));
 }catch(e){}
 checks.push(...canaryChecks(canary,now,lastAttempt));
 checks.push(record('motor-otros','Sala · motores alternativos',['EXT-MOTORES-MEDIA'],'sin_confirmar',now,
   'Este canario comprueba Kokoro, parallax y corte; imagen generativa y otros motores requieren una prueba propia','Cobertura pendiente'));
 // El inventario nunca desaparece por falta de sonda.
 const covered=new Set(checks.flatMap(c=>c.components));
 for(const comp of catalog.components.filter(c=>!covered.has(c.id))){
   checks.push(record('pendiente:'+comp.id,comp.nombre+' · prueba funcional',[comp.id],'sin_confirmar',now,
     'No hay una comprobación segura conectada para esta facultad','Cobertura pendiente'));
 }
 return {schema:1,generado_en:now,zona_horaria:'America/Hermosillo',code_sha:process.env.GITHUB_SHA||'0'.repeat(40),
   run_id:process.env.GITHUB_RUN_ID||'0',model_revision:catalog.model_revision,checks};
}
async function apiWrite(p,body,method){
 const r=await fetch('https://api.github.com/repos/'+REPO+'/'+p,{method,headers:{
  Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'yod-salud',
  Authorization:'Bearer '+process.env.GH_TOKEN},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('publicacion_http_'+r.status);return r.json();
}
async function publish(report){
 let previous=null;
 try{previous=await apiRead(REPO,'contents/'+FILE+'?ref='+BRANCH);}catch(e){if(e.status!==404)throw e;}
 if(!previous){
  try{await apiRead(REPO,'git/ref/heads/'+BRANCH);}catch(e){
   if(e.status!==404)throw e;
   const main=await apiRead(REPO,'git/ref/heads/main');
   await apiWrite('git/refs',{ref:'refs/heads/'+BRANCH,sha:main.object.sha},'POST');
  }
 }else{
  try{
   const old=JSON.parse(Buffer.from(previous.content,'base64').toString('utf8'));
   if(Health.validReport(old)){
    report.historial=[...(Array.isArray(old.historial)?old.historial:[]).slice(-5),
      {generado_en:old.generado_en,run_id:old.run_id,checks:old.checks.map(c=>({id:c.id,estado:c.estado,revisado_en:c.revisado_en}))}];
   }
  }catch(e){}
 }
 if(!Health.validReport(report))throw Error('informe_sin_contrato');
 const raw=Buffer.from(JSON.stringify(report,null,2)+'\n');
 const out=await apiWrite('contents/'+FILE,{message:'Actualizar pruebas técnicas por proceso',branch:BRANCH,
   content:raw.toString('base64'),...(previous?{sha:previous.sha}:{})},'PUT');
 const proof=await apiRead(REPO,'contents/'+FILE+'?ref='+BRANCH);
 if(!Buffer.from(proof.content,'base64').equals(raw))throw Error('recibo_no_confirmado');
 return {commit:out.commit.sha,sha256:crypto.createHash('sha256').update(raw).digest('hex')};
}
async function main(){
 const report=await collect(),receipt=await publish(report);
 fs.writeFileSync(path.join(process.env.RUNNER_TEMP||'/tmp','yod-salud.json'),JSON.stringify(report,null,2)+'\n');
 const colors=report.checks.map(c=>Health.color(c,report,Date.now(),true));
 console.log(JSON.stringify({monitor:'publicado',checks:report.checks.length,verde:colors.filter(c=>c==='verde').length,
   fallo:colors.filter(c=>c==='rojo').length,pendientes:colors.filter(c=>c!=='verde'&&c!=='rojo').length,...receipt}));
}
if(require.main===module)main().catch(()=>{console.error('No se pudo acreditar la publicación del monitor; revisar la corrida.');process.exitCode=1;});
module.exports={FRONTS,ROUTINES,allowed,page,record,fresh,validateRevision,revisionChecks,canaryChecks,collect,publish};
