import * as T from 'three';
import {screenStatus} from './office-screen-status.mjs?v=1';
import {workHeadline,observationCaptureKey} from './work-observer.mjs?v=126';
// A dated, owned projection. A texture is never a claim of continuous video.
export function createOfficeScreen(mesh,onChange=()=>{}){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=400;const ctx=canvas.getContext('2d');
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;mesh.material.map?.dispose();mesh.material.map=texture;
 mesh.userData.agentComputer=true;let generation=0,latest=null,disposed=false,lastPaint=null,decoded=null,decodedKey=null,pending=null;
 const labels={library:'Biblioteca',research:'Investigación',meeting:'Sala de juntas'},stamp=v=>v?new Date(v).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'';
 const line=(s,y,size=24,color='#183d3b')=>{ctx.fillStyle=color;ctx.font='500 '+size+'px Arial';ctx.fillText(String(s||''),28,y,710);};
 const wrap=(s,y,maxY,size=24)=>{ctx.font='500 '+size+'px Arial';let row='';for(const word of String(s||'').replace(/\\s+/g,' ').split(' ')){if(ctx.measureText(row+' '+word).width>710){line(row,y,size);y+=size+7;row='';if(y>maxY)return;}row+=(row?' ':'')+word;}if(y<=maxY)line(row,y,size);};
 function base(state){
  ctx.fillStyle='#f2f1eb';ctx.fillRect(0,0,768,400);ctx.fillStyle='#173f3c';ctx.fillRect(0,0,768,60);
  line((labels[state.surface]||'Puesto de trabajo')+' · '+(state.projectName||'Autón'),38,22,'#f2f1eb');
  ctx.fillStyle='#d9dfd7';ctx.fillRect(28,346,710,1);
 }
 function footer(label){line(label,379,20,'#65766b');texture.needsUpdate=true;onChange();}
 function draw(state,picture=null){
  base(state);
  if(state.phase!=='ready'||!state.case_id){
   line(state.phase==='unauthorized'?'Estación disponible':workHeadline(state),116,32);
   wrap(state.phase==='unauthorized'?'El trabajo aparecerá con su responsable y su fuente.':'La actividad se mostrará al recuperar una lectura autorizada.',170,275);
   footer('Sin actividad confirmada en esta pantalla');return;
  }
  if(state.slide&&state.slide.case_id===state.case_id){
   line(state.slide.title,108,32);wrap(state.slide.result,155,275,25);
   footer(state.slide.checkpoint||'Resultado para revisar');return;
  }
  const queued=['starting','waiting_capacity','reconnecting','unavailable','disabled','stopped'].includes(state.runtime?.phase)||state.runtime?.phase==='working'&&!['working','tool'].includes(state.work?.phase);
  if(queued){
   line(state.runtime?.phase==='working'?'Preparando encargo':workHeadline(state),115,32);
   wrap(state.runtime?.phase==='waiting_capacity'?'El encargo espera su turno en el servidor.':state.runtime?.continues_without_viewer?'El motor del servidor está conectado a este expediente.':'La ejecución requiere recuperar el motor.',172,272);
   footer('Estado del servidor · '+stamp(state.runtime?.updated_at));return;
  }
  if(state.surface==='library'&&state.work?.document){
   const d=state.work.document;line(d.title,105,30);wrap(d.content,150,300,22);
   footer('Extracto consultado · '+stamp(d.read_at)+(d.truncated?' · texto parcial':''));return;
  }
  if(picture){ctx.drawImage(picture,24,76,720,257);footer('Última captura del encargo · '+stamp(state.screen.captured_at));return;}
  const status=screenStatus(state);line(state.work?.title||'Disponible para un encargo',110,31);
  line(workHeadline(state),152,23,'#65766b');wrap(status.detail,198,245,24);
  const tasks=state.work?.progress?.progress?.tasks||[];
  if(tasks.length){const gap=7,w=(710-gap*(tasks.length-1))/tasks.length;
   tasks.forEach((task,i)=>{ctx.fillStyle=({ready_for_review:'#318678',running:'#c79d50',blocked:'#bd7766',pending:'#d7ddd3'})[task.status]||'#d7ddd3';ctx.fillRect(28+i*(w+gap),279,w,9);});
   line(status.counts,322,22,'#65766b');
  }
  footer(state.work?'Registro · '+stamp(state.work.updated_at):'Sin ejecución registrada');
 }
 function dropImage(){if(pending){pending.onload=null;pending.onerror=null;pending.src='';pending=null;}decoded=null;decodedKey=null;}
 function update(state){
  if(disposed)return;latest=state;
  const key=JSON.stringify([state.surface,state.work?.document,state.slide,state.case_id,state.phase,state.work?.run_id,state.work?.updated_at,state.work?.phase,state.work?.current_tool,state.work?.progress,state.work?.result,state.projectName,state.screen,!!state.image,state.runtime?.phase,state.runtime?.updated_at]);
  if(lastPaint===key)return;lastPaint=key;const own=++generation,captureKey=observationCaptureKey(state);
  if(state.phase!=='ready'||!state.image||!captureKey){dropImage();draw(state);return;}
  if(decoded&&decodedKey===captureKey){draw(state,decoded);return;}
  dropImage();draw(state);const image=new Image();pending=image;
  image.onload=()=>{if(!disposed&&own===generation){pending=null;decoded=image;decodedKey=captureKey;draw(state,image);}};
  image.onerror=()=>{if(own===generation)pending=null;};image.src=state.image;
 }
 update({phase:'unauthorized',case_id:null,work:null});
 return{update,snapshot:()=>latest?{case_id:latest.case_id,phase:latest.phase,run_id:latest.work?.run_id||null,headline:workHeadline(latest),capture:!!latest.image,station_owner:latest.station_owner||null,progress:screenStatus(latest)}:null,
 dispose(){disposed=true;generation++;dropImage();texture.dispose();}};
}
