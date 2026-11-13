// Reutiliza el puente y selector canónicos de la oficina; no instala otro grabador.
import {createChinches3D} from '../despacho3d/chinches3d.mjs?v=126';

let mounted=null;
export function mountRetroChinches({onAvailability=()=>{},readZone=()=>'entry',closeSheets=()=>{}}={}){
 if(mounted)return mounted;
 let selecting=false;
 const chinches=createChinches3D({readView:()=>({position:null,quaternion:null,fov:null,mode:'map'}),readZone,closeSheets,onChange:value=>{selecting=value===true;}});
 let ready=false;
 function availability(value){ready=value;onAvailability(value);}
 function receive(event){
  if(window.parent===window||event.source!==window.parent||event.origin!==location.origin)return;
  const data=event.data;
  if(!data||data.version!==1||Object.keys(data).length!==2)return;
  if(data.type==='yod:despacho:ready')availability(true);
  else if(data.type==='yod:despacho:disabled')availability(false);
 }
 window.addEventListener('message',receive);
 window.addEventListener('pagehide',()=>availability(false));
 availability(false);
 const zones=new Set(['editing','editorial','funnel','entry','reception','patio','potential','case','projects','delivery','decisions','lounge']);
 mounted={isSelecting:()=>selecting,start:()=>ready?window.YODChinche?.senalar?.()===true:false,stop:()=>chinches.stop(),bindPanel:id=>{if(!zones.has(id))return false;chinches.bindPanel(id);return true;}};
 return mounted;
}
