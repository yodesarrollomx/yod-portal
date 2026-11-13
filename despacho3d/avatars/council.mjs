import {createAvatarLayer} from './adapter.mjs?v=126';
import {COUNCIL_ROLES} from '../council-model.mjs?v=1';
const seats=[[-1.8,5.08,0],[-.3,5.08,0],[1.2,5.08,0],[-1.8,7.57,Math.PI],[-.3,7.57,Math.PI]];
// Role avatars are visual representations of the council, not people or case identities.
export function createCouncilAvatars({scene,onSelect=()=>{},onChange=()=>{}}){
 const layer=createAvatarLayer({scene,onSelect});let enabled=false,last=-Infinity,active=null,observedAt=0;
 return {setAuthorized(value){if(enabled===!!value)return;enabled=!!value;active=null;
  layer.replaceAuthorizedProfiles(enabled?COUNCIL_ROLES.map((r,i)=>({id:'council:'+r.id,entity_kind:'role',name:r.name,form:'robot',color:r.color,visual:{role:'studio'},placement:{position:[seats[i][0],0,seats[i][1]],rotationY:seats[i][2]}})):[]);
  for(const r of COUNCIL_ROLES)layer.setMotion('council:'+r.id,'sit');layer.update(0);onChange();},
 observe(session){observedAt=Date.now();active=session?.state==='reviewing'&&COUNCIL_ROLES.some(r=>r.id===session.active_role)?session.active_role:null;for(const r of COUNCIL_ROLES)layer.setMotion('council:'+r.id,active===r.id?'sit-talk':'sit');onChange();},
 update(time,{hidden=false,overlay=false,reducedMotion=false}={}){if(Date.now()-observedAt>90000&&active){active=null;for(const r of COUNCIL_ROLES)layer.setMotion('council:'+r.id,'sit');layer.update(0);onChange();}
 if(!enabled||!active||hidden||overlay||reducedMotion||time-last<100)return false;last=time;layer.update(time/1000);return true;},
 pickables:()=>layer.pickables(),selectIntersection:hit=>layer.selectIntersection(hit),dispose:()=>layer.dispose()};
}
