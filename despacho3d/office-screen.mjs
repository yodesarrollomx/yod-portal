import * as T from 'three';
import {screenStatus} from './office-screen-status.mjs?v=1';
import {workHeadline} from './work-observer.mjs?v=124';
// A dated texture, never a claim of live video or an invented tool operation.
export function createOfficeScreen(mesh,onChange=()=>{}){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=400;const ctx=canvas.getContext('2d');
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;mesh.material.map?.dispose();mesh.material.map=texture;
 mesh.userData.agentComputer=true;let generation=0,latest=null,disposed=false,lastPaint=null;
 const line=(s,y,size=27)=>{ctx.font='500 '+size+'px Arial';ctx.fillText(String(s||''),24,y,720);};
 function draw(state,picture=null){
  if(state.surface==='library'&&state.phase==='ready'&&state.work?.document){
   const d=state.work.document;ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,768,400);ctx.fillStyle='#193c3d';
   line('BIBLIOTECA · '+(state.projectName||''),35,20);line(d.title,78,30);
   const words=d.content.replace(/\s+/g,' ').split(' ');let row='',y=126;ctx.font='500 21px Arial';
   for(const word of words){if(ctx.measureText(row+' '+word).width>708){line(row,y,21);y+=28;row='';if(y>304)break;}row+=(row?' ':'')+word;}if(y<=304)line(row,y,21);
   ctx.fillStyle='#806e4e';line('Extracto de lectura · '+new Date(d.read_at).toLocaleTimeString(),369,20);
   texture.needsUpdate=true;onChange();return;
  }
  if(state.slide){
   ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,768,400);ctx.fillStyle='#193c3d';
   line(state.slide.project,38,20);line(state.slide.title,95,32);
   const words=String(state.slide.result||'').split(/\s+/);let row='',y=146;ctx.font='500 23px Arial';
   for(const word of words){if(ctx.measureText(row+' '+word).width>708){line(row,y,23);y+=31;row='';if(y>270)break;}row+=(row?' ':'')+word;}if(y<=270)line(row,y,23);
   ctx.fillStyle='#806e4e';line('OBJETIVO  →  EVIDENCIA  →  REVISIÓN',322,24);line(state.slide.checkpoint,368,20);
   texture.needsUpdate=true;onChange();return;
  }
  ctx.fillStyle='#162a30';ctx.fillRect(0,0,768,400);ctx.fillStyle='#ded6ba';line('COMPUTADORA · '+workHeadline(state),42,22);
  if(picture){ctx.drawImage(picture,0,68,768,270);ctx.fillStyle='#162a30';ctx.fillRect(0,338,768,62);ctx.fillStyle='#ded6ba';line('Última captura · '+new Date(state.screen.captured_at).toLocaleTimeString(),376,22);}
  else{const status=screenStatus(state);ctx.fillStyle='#eef1e8';line(status.title,103,34);line(status.objective,151,25);ctx.fillStyle='#ded6ba';line(status.counts,204,27);ctx.fillStyle='#eef1e8';line(status.detail,259,25);ctx.fillStyle='#c1cbb9';line(status.note,350,23);}
  texture.needsUpdate=true;onChange();
 }
 function update(state){if(disposed)return;latest=state;const key=JSON.stringify([state.surface,state.work?.document,state.slide,state.case_id,state.phase,state.work?.run_id,state.work?.updated_at,state.work?.phase,state.work?.current_tool,state.work?.progress,state.work?.result,state.projectName,state.screen,!!state.image]);if(lastPaint===key)return;lastPaint=key;const own=++generation;draw(state);
  if(state.phase==='ready'&&state.image&&state.screen?.owner?.run_id===state.work?.run_id){const image=new Image();image.onload=()=>{if(!disposed&&own===generation)draw(state,image);};image.src=state.image;}
 }
 update({phase:'unauthorized',case_id:null,work:null});
 return{update,snapshot:()=>latest?{case_id:latest.case_id,phase:latest.phase,run_id:latest.work?.run_id||null,headline:workHeadline(latest),capture:!!latest.image,progress:screenStatus(latest)}:null,dispose(){disposed=true;generation++;texture.dispose();}};
}
