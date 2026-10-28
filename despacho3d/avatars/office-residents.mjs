import {crearAgenteIr,rutaEntre} from '../entorno-ruta.mjs?v=4';
import {places,allowed as walkable,bounds,annex} from '../office-layout.mjs?v=124';
import {createResidentMotion,autonResidence,residencePlacement} from '../resident-motion.mjs?v=status1';
import {OFICINA_ESTADOS_REALES} from '../office-config.mjs?v=4';
import {createOfficePilot} from './office-pilot.mjs?v=126';
import {deskSeat,PROJECT_SEAT} from '../office-station.mjs?v=1';
const MEETING=[[3.25,5.0],[3.25,6.0],[3.25,7.0],[-3.8,5.0],[-3.8,6.0],[-3.8,7.0]];
const SEATS=[PROJECT_SEAT,deskSeat(10.05,-7.1),deskSeat(7,-.85),deskSeat(10.05,-.85),deskSeat(7,5.2),deskSeat(10.05,5.2)];
// Profiles come exclusively from listAuthorized after server authorization.
export function createOfficeResidents({scene,beforeOpen=()=>{},onChange=()=>{},authoritative=OFICINA_ESTADOS_REALES,now=Date.now}){
 let api=null,stopCurrent=null,stopList=null,current=null,profiles=[],disposed=false;
 const residents=new Map();let observations=new Map();
 function syncResidence(entry){
  if(!authoritative)return;
  const status=autonResidence(observations.get(entry.profile.case_id)?.auton_status,entry.profile.case_id,now());
  entry.residence=status;
  if(status.admission==='baja'){if(entry.active){entry.pilot.disconnect();entry.active=false;onChange();}}
  else if(!entry.active){entry.active=true;entry.pilot.bind(entry.binding);entry.motion.observe(observations.get(entry.profile.case_id)||null);entry.motion.update(0,{reducedMotion:true,force:true});}
 }
 const selected=()=>residents.get(current?.case_id)?.pilot;
 function reconcile(){
  const allowed=new Map(profiles.map(p=>[p.case_id,p]));
  // A resident refresh cannot restore a profile removed from the authorized catalog.
  if(current&&allowed.has(current.case_id))allowed.set(current.case_id,current);
  for(const [id,entry]of residents)if(!allowed.has(id)){entry.pilot.dispose();residents.delete(id);}
  for(const p of allowed.values()){
   if(residents.has(p.case_id)){residents.get(p.case_id).profile=p;residents.get(p.case_id).notify?.(p);continue;}
   const used=new Set([...residents.values()].map(e=>e.slot)),slot=SEATS.findIndex((_,i)=>!used.has(i));if(slot<0)continue;
   const entry={profile:p,slot,pilot:null,notify:null,motion:null,active:true,binding:null,residence:null};
   entry.pilot=createOfficePilot({scene,seat:SEATS[slot],beforeOpen,onChange});
   entry.binding={getProfile:()=>entry.profile,subscribeProfile(fn){entry.notify=fn;fn(entry.profile);return()=>{entry.notify=null;};},async openForCase(id){
    if(!api)return false;
    return api.openForCase(id);
   }};
   entry.pilot.bind(entry.binding);
   const route=crearAgenteIr({lugares:places,piloto:entry.pilot,permitido:walkable,limites:[bounds,annex]});
   const navigate=(destination,options={})=>{
    const placement=authoritative?residencePlacement(destination,slot,SEATS[slot]):null;
    if(placement){const points=rutaEntre(entry.pilot.posicion(),placement.xz,walkable,[bounds,annex]);if(!points)return false;if(points.length===1)points.push([...points[0]]);return entry.pilot.recorrer(points,placement.rot,{inmediato:options.immediate===true,destino:destination,seated:placement.seated});}
    if(!['library','decisions'].includes(destination))return route(destination);
    const target=destination==='decisions'?MEETING[slot]:[-10.15+(slot%3)*1.3,-1.7+Math.floor(slot/3)*.65];
    const points=rutaEntre(entry.pilot.posicion(),target,walkable,[bounds,annex]);if(!points)return false;
    if(points.length===1)points.push([...points[0]]);
    return entry.pilot.recorrer(points,destination==='decisions'?(slot<3?-Math.PI/2:Math.PI/2):Math.PI,{inmediato:options.immediate===true,destino:destination,seated:false});
   };
   entry.motion=createResidentMotion({caseId:p.case_id,authoritative,pilot:entry.pilot,navigate,now});
   entry.motion.observe(observations.get(p.case_id)||null);
   residents.set(p.case_id,entry);
   if(authoritative){syncResidence(entry);if(entry.active)entry.motion.update(0,{reducedMotion:true});}
  }
  onChange();
 }
 function disconnect(){stopCurrent?.();stopList?.();stopCurrent=stopList=null;api=null;current=null;profiles=[];observations=new Map();reconcile();}
 return {bind(next){if(disposed||api===next)return;disconnect();if(!next?.subscribeProfile)return;api=next;
  const hasCatalog=typeof next.subscribeAuthorizedProfiles==='function';
  stopCurrent=next.subscribeProfile(p=>{current=p;if(!hasCatalog)profiles=p?[p]:[];reconcile();});
  if(hasCatalog)stopList=next.subscribeAuthorizedProfiles(p=>{profiles=p;reconcile();});
 },disconnect,update(now,options){let changed=false;for(const [id,e]of residents){syncResidence(e);e.motion?.update(now,{...options,selected:current?.case_id===id});changed=e.pilot.update(now,options)||changed;}return changed;},
 observeCouncil(session){for(const [id,e]of residents)e.motion.observeCouncil(session?.case_id===id?session:null);},
 observeWork(states){observations=new Map((states||[]).map(s=>[s.case_id,s]));for(const[id,e]of residents){e.motion.observe(observations.get(id)||null);syncResidence(e);}},
 presentations:()=>[...residents.values()].flatMap(e=>e.pilot.presentations()),
 seatProfiles:()=>[...residents.values()].filter(e=>e.active).map(e=>({slot:e.slot,case_id:e.profile.case_id,name:e.profile.name})),
 pickables:()=>[...residents.values()].flatMap(e=>e.pilot.pickables()),selectIntersection(hit){for(const e of residents.values())if(e.pilot.selectIntersection(hit))return true;return false;},
 setActivity:v=>selected()?.setActivity(v)||false,recorrer:(...args)=>selected()?.recorrer(...args)||false,posicion:()=>selected()?.posicion()||null,
 get inicio(){return selected()?.inicio||{xz:[PROJECT_SEAT.position[0],PROJECT_SEAT.position[2]],rot:PROJECT_SEAT.rotationY};},
 getMovementState:()=>selected()?.getMovementState()||{place:null,destination:null,motion:null,position:null},
 getState:()=>({count:[...residents.values()].filter(e=>e.active).length,walking:[...residents.values()].filter(e=>e.pilot.getMovementState().motion==='walk').length,motion:selected()?.getState().motion||null,poseTicks:[...residents.values()].reduce((n,e)=>n+e.pilot.getState().poseTicks,0)}),
 dispose(){if(disposed)return;disconnect();disposed=true;}
 };
}
