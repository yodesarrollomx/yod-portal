import {councilLocation} from './council-model.mjs?v=1';
import {observedStation} from './station-ownership.mjs?v=126';
// The shared station projection drives both motion and screens. Research uses the existing desk.
export function workDestination(state,now=Date.now()){
 if(state?.phase!=='ready'||!Number.isFinite(state.checked_at)||now-state.checked_at>90000||now<state.checked_at)return null;
 const station=observedStation(state,now);
 return station==='library'?'library':station==='meeting'?'decisions':'inicio';
}
export function createResidentMotion({pilot,navigate,now=Date.now}){
 let observation=null,council=null,councilAt=0,lastAttempt=-Infinity;
 return {observe(value){observation=value;},observeCouncil(value){council=value;councilAt=now();},
 update(time,{hidden=false,overlay=false,reducedMotion=false}={}){
  if(hidden||overlay)return false;
  const freshCouncil=council&&now()-councilAt<=90000?councilLocation(council):null;
  const destination=freshCouncil||workDestination(observation,now()),p=pilot.getMovementState();
  if(!destination||p.motion==='walk'||p.place===destination||time-lastAttempt<3000)return false;
  lastAttempt=time;return navigate(destination,{immediate:reducedMotion})===true;
 }};
}
