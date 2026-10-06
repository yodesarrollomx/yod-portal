import * as T from 'three';
import {workHeadline} from './work-observer.mjs?v=1';
// A dated texture, never a claim of live video or an invented tool operation.
export function createOfficeScreen(mesh,onChange=()=>{}){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=400;const ctx=canvas.getContext('2d');
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;mesh.material.map?.dispose();mesh.material.map=texture;
 mesh.userData.agentComputer=true;let generation=0,latest=null,disposed=false;
 const line=(s,y,size=27)=>{ctx.font='500 '+size+'px Arial';ctx.fillText(String(s||''),24,y,720);};
 function draw(state,picture=null){
  ctx.fillStyle='#162a30';ctx.fillRect(0,0,768,400);ctx.fillStyle='#ded6ba';line('COMPUTADORA',42,22);
  if(picture){ctx.drawImage(picture,0,68,768,270);ctx.fillStyle='#162a30';ctx.fillRect(0,338,768,62);ctx.fillStyle='#ded6ba';line('Última captura · '+new Date(state.screen.captured_at).toLocaleTimeString(),376,22);}
  else{ctx.fillStyle='#eef1e8';line(workHeadline(state),130,34);line(state.work?.title||'Selecciona el puesto para consultar',194,27);line(state.work?.progress?.progress?.tasks?.find(t=>t.status==='running')?.title||'',250,25);ctx.fillStyle='#c1cbb9';line(state.work?'Registro · '+new Date(state.work.updated_at).toLocaleTimeString():'',350,23);}
  texture.needsUpdate=true;onChange();
 }
 function update(state){if(disposed)return;latest=state;const own=++generation;draw(state);
  if(state.phase==='ready'&&state.image&&state.screen?.owner?.run_id===state.work?.run_id){const image=new Image();image.onload=()=>{if(!disposed&&own===generation)draw(state,image);};image.src=state.image;}
 }
 update({phase:'unauthorized',case_id:null,work:null});
 return{update,snapshot:()=>latest?{case_id:latest.case_id,phase:latest.phase,run_id:latest.work?.run_id||null,headline:workHeadline(latest),capture:!!latest.image}:null,dispose(){disposed=true;generation++;texture.dispose();}};
}
