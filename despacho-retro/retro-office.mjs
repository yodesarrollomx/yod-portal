import {places,bounds,annex,collisions,allowed} from '../despacho3d/office-layout.mjs';
import {openOfficeDestination} from '../despacho3d/office-destination.mjs';
import {panels} from '../despacho3d/office-panels.mjs';

// Adaptador de la oficina: visualización y fichas locales; la autoridad sigue
// siendo la selección vigente y las superficies existentes del Despacho.
export function createRetroOffice({getMap=()=>null,showPanel=()=>{},hidePanel=()=>{},environment=globalThis,document:doc=environment.document}={}){
 let selected='entry',sheet=null,disposed=false,residentAPI=null,unsubscribe=null,snapshots=[],epoch=0,catalogKey="";
 const profiles=()=>residentAPI?.getAuthorizedProfiles?.().filter(p=>p&&p.entity_kind==='case'&&p.id===p.case_id&&typeof p.name==='string')||[];
 function paintResidents(){const seats=[[6.65,-4.42],[10.05,-5.8],[7,.45],[10.05,.45],[7,6.5],[10.05,6.5]];const positions=new Map(snapshots.map(s=>[s.case_id,s]));const items=profiles().slice(0,seats.length).map((p,i)=>{const position=positions.get(p.case_id)||{x:seats[i][0],z:seats[i][1]};return {case_id:p.case_id,name:p.name,x:position.x,z:position.z};});getMap()?.setResidents?.(items);}
 function bindResidents(){const next=environment.YodResidentAgents;if(next===residentAPI)return;unsubscribe?.();unsubscribe=null;residentAPI=next||null;epoch++;snapshots=[];catalogKey=JSON.stringify(profiles().map(p=>p.case_id).sort());paintResidents();if(next?.subscribeAuthorizedProfiles)unsubscribe=next.subscribeAuthorizedProfiles(()=>{const key=JSON.stringify(profiles().map(p=>p.case_id).sort());if(key!==catalogKey){catalogKey=key;epoch++;}const ids=new Set(profiles().map(p=>p.case_id));snapshots=snapshots.filter(s=>ids.has(s.case_id));paintResidents();});}
 function setResidentSnapshots(items){if(disposed||!Array.isArray(items))return false;const ids=new Set(profiles().map(p=>p.case_id));snapshots=items.filter(s=>s&&ids.has(s.case_id)&&Number.isFinite(s.x)&&Number.isFinite(s.z)).map(s=>({case_id:s.case_id,x:s.x,z:s.z}));paintResidents();return true;}
 async function selectResident(id){if(disposed||!profiles().some(p=>p.case_id===id)||!residentAPI?.selectCase)return false;const own=epoch,api=residentAPI;try{if(api.getSelection?.()?.case_id!==id&&!await api.selectCase(id))return false;}catch{return false;}if(disposed||own!==epoch||api!==residentAPI||!profiles().some(p=>p.case_id===id)||api.getSelection?.()?.case_id!==id)return false;return openPanel('case');}
 const onReady=()=>bindResidents();environment.addEventListener?.('yod-residents-ready',onReady);bindResidents();
 const layout={bounds,annex,collisions};
 function closeSheets(){if(disposed)return false;sheet=null;hidePanel();return true;}
 function visit(id){
  if(disposed||!Object.hasOwn(places,id))return false;
  closeSheets();selected=id;
  const map=getMap();if(map&&!map.visit(id))return false;
  return true;
 }
 function localBody(body){
  // Sólo procesar HTML de office-panels, nunca contenido de expediente.
  const template=doc.createElement('template');template.innerHTML=body;
  const base=new URL('../despacho3d/',doc.baseURI);
  template.content.querySelectorAll('a[href]').forEach(a=>{
   const href=a.getAttribute('href');
   if(href&&!/^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i.test(href))a.setAttribute('href',new URL(href,base).href);
  });
  return template.innerHTML;
 }
 function openPanel(id){
  if(disposed||!(id==='computer'||Object.hasOwn(places,id)))return false;
  const result=openOfficeDestination(id,{residents:environment.YodResidentAgents,workspace:environment.YodVoiceWorkspace,menu:environment.YodAgentMenu,beforeOpen:closeSheets});
  if(result.handled)return result.opened;
  const p=panels[id]||{tag:places[id].label,title:places[id].label,body:'<p>Espacio del Despacho. Sus herramientas se conectan por etapas desde Entorno.</p>'};
  if(!doc?.createElement)return false;
  sheet='panel';showPanel({id,tag:p.tag,title:p.title,body:localBody(p.body)});return true;
 }
 const api={view:'map',layout,allowed,visit,openPanel,closeSheets,setResidentSnapshots,selectResident,refreshResidents:paintResidents,
  // Sin un proveedor real no se inventa ubicación ni actividad del agente.
  getAgentState:()=>({position:null,motion:'unavailable',place:null,destination:null}),
  setAgentActivity:()=>false,
  getState:()=>{const state=getMap()?.getState();const pos=state?.position||{x:places[selected].eye[0],z:places[selected].eye[2]};return {mode:'map',selected,sheet,position:[pos.x,1.65,pos.z],zoom:state?.zoom??1};},
  destroy(){if(disposed)return;closeSheets();disposed=true;epoch++;unsubscribe?.();environment.removeEventListener?.('yod-residents-ready',onReady);getMap()?.setResidents?.([]);if(environment.despacho===api)delete environment.despacho;}
 };
 return api;
}
