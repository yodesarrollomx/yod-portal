import {councilLocation} from './council-model.mjs?v=1';
import {observedStation} from './station-ownership.mjs?v=126';
// The shared station projection drives both motion and screens. Research uses the existing desk.
export function workDestination(state,now=Date.now()){
 if(state?.phase!=='ready'||!Number.isFinite(state.checked_at)||now-state.checked_at>90000||now<state.checked_at)return null;
 const station=observedStation(state,now);
 return station==='library'?'library':station==='meeting'?'decisions':'inicio';
}
export function createResidentMotion({pilot,navigate,now=Date.now,caseId=null,authoritative=false}){
 let observation=null,council=null,councilAt=0,lastAttempt=-Infinity;
 return {observe(value){observation=value;},observeCouncil(value){council=value;councilAt=now();},
 update(time,{hidden=false,overlay=false,reducedMotion=false,force=false}={}){
  if(hidden||overlay)return false;
  const freshCouncil=council&&now()-councilAt<=90000?councilLocation(council):null;
  const residence=authoritative?autonResidence(observation?.auton_status,caseId,now()):null;
  const destination=authoritative?(residence.admission==='baja'?null:residence.destination):freshCouncil||workDestination(observation,now()),p=pilot.getMovementState();
  if(!destination||(p.place===destination&&p.motion!=='walk')||p.destination===destination||(!authoritative&&p.motion==='walk')||(!force&&time-lastAttempt<3000))return false;
  lastAttempt=time;return navigate(destination,{immediate:reducedMotion})===true;
 }};
}

// Geometry is public; case identities, admission and activity come only from private observations.
export const WAITING_SEATS=Object.freeze(Array.from({length:6},(_,i)=>Object.freeze([-10.3+(i%3)*1.65,5.65+Math.floor(i/3)*1.65])));
export function autonResidence(value,caseId,now=Date.now()){
 const unknown={admission:'unconfirmed',activity:'unconfirmed',destination:'unconfirmed'};
 const at=typeof value?.observed_at==='number'?value.observed_at:Date.parse(value?.observed_at);
 if(!caseId||value?.case_id!==caseId||!Number.isFinite(at)||now-at>90000||now<at)return unknown;
 if(value.admission==='baja')return {admission:'baja',activity:null,destination:null};
 if(value.admission==='standby')return {admission:'standby',activity:null,destination:'standby'};
 if(value.admission!=='alta'||!['working','waiting','presenting'].includes(value.activity))return unknown;
 return {admission:'alta',activity:value.activity,destination:value.activity==='working'?'inicio':value.activity};
}
export function residencePlacement(destination,slot,seat){
 if(!Number.isInteger(slot)||slot<0||slot>=6)return null;
 if(destination==='inicio')return {xz:[seat.position[0],seat.position[2]],rot:seat.rotationY,seated:true};
 if(destination==='waiting')return {xz:[...WAITING_SEATS[slot]],rot:0,seated:true};
 if(destination==='presenting')return {xz:[slot<3?3.25:-3.8,5+slot%3],rot:slot<3?-Math.PI/2:Math.PI/2,seated:false};
 if(destination==='standby')return {xz:[-10.6+slot*1.1,.5],rot:Math.PI/2,seated:false};
 if(destination==='unconfirmed')return {xz:[-10.6+slot*1.1,-4.3],rot:Math.PI/2,seated:false};
 return null;
}
