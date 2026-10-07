import {OFICINA_LEGIBLE} from './office-config.mjs?v=1';
import {createChinches3D} from './chinches3d.mjs?v=3';
// Install the authorized UI bridge before WebGL: an unavailable camera stays explicitly null.
const chinches=createChinches3D({readView:()=>({position:null,quaternion:null,fov:null,mode:'map'})});
let fallback=false;
try{await import('./office.js?v=21');}catch{fallback=true;}
if(OFICINA_LEGIBLE||fallback){
 document.body.classList.add('office-readable');
 const {startAccessibleOffice,mountAccessibleView}=await import('./office-accessible.mjs?v=5');
 if(fallback){
  const api=startAccessibleOffice({onPanelOpened:zone=>chinches.bindPanel(zone)});
  chinches.configure({readView:()=>({position:null,quaternion:null,fov:null,mode:'map'}),readZone:()=>api.getState().selected,closeSheets:api.closeSheets});
 }
 mountAccessibleView(window.despacho);
}
