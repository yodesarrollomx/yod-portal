import {createOfficePilot} from './office-pilot.mjs?v=8';
import {deskSeat,PROJECT_SEAT} from '../office-station.mjs?v=1';
const SEATS=[PROJECT_SEAT,deskSeat(10.05,-7.1),deskSeat(7,-.85),deskSeat(10.05,-.85),deskSeat(7,5.2),deskSeat(10.05,5.2)];
// Profiles come exclusively from listAuthorized after server authorization.
export function createOfficeResidents({scene,beforeOpen=()=>{},onChange=()=>{}}){
 let api=null,stopCurrent=null,stopList=null,current=null,profiles=[],disposed=false;
 const residents=new Map();
 const selected=()=>residents.get(current?.case_id)?.pilot;
 function reconcile(){
  const allowed=new Map(profiles.map(p=>[p.case_id,p]));
  // A resident refresh cannot restore a profile removed from the authorized catalog.
  if(current&&allowed.has(current.case_id))allowed.set(current.case_id,current);
  for(const [id,entry]of residents)if(!allowed.has(id)){entry.pilot.dispose();residents.delete(id);}
  for(const p of allowed.values()){
   if(residents.has(p.case_id)){residents.get(p.case_id).profile=p;residents.get(p.case_id).notify?.(p);continue;}
   const used=new Set([...residents.values()].map(e=>e.slot)),slot=SEATS.findIndex((_,i)=>!used.has(i));if(slot<0)continue;
   const entry={profile:p,slot,pilot:null,notify:null};
   entry.pilot=createOfficePilot({scene,seat:SEATS[slot],beforeOpen,onChange});
   entry.pilot.bind({getProfile:()=>entry.profile,subscribeProfile(fn){entry.notify=fn;fn(entry.profile);return()=>{entry.notify=null;};},async openForCase(id){
    if(!api||!await api.selectCase?.(id))return false;return api.openForCase(id);
   }});residents.set(p.case_id,entry);
  }
  onChange();
 }
 function disconnect(){stopCurrent?.();stopList?.();stopCurrent=stopList=null;api=null;current=null;profiles=[];reconcile();}
 return {bind(next){if(disposed||api===next)return;disconnect();if(!next?.subscribeProfile||!next?.subscribeAuthorizedProfiles)return;api=next;
  stopCurrent=next.subscribeProfile(p=>{current=p;reconcile();});stopList=next.subscribeAuthorizedProfiles(p=>{profiles=p;reconcile();});
 },disconnect,update(now,options){let changed=false;for(const e of residents.values())changed=e.pilot.update(now,options)||changed;return changed;},
 pickables:()=>[...residents.values()].flatMap(e=>e.pilot.pickables()),selectIntersection(hit){for(const e of residents.values())if(e.pilot.selectIntersection(hit))return true;return false;},
 setActivity:v=>selected()?.setActivity(v)||false,recorrer:(...args)=>selected()?.recorrer(...args)||false,posicion:()=>selected()?.posicion()||null,
 get inicio(){return selected()?.inicio||{xz:[PROJECT_SEAT.position[0],PROJECT_SEAT.position[2]],rot:PROJECT_SEAT.rotationY};},
 getMovementState:()=>selected()?.getMovementState()||{place:null,destination:null,motion:null,position:null},
 getState:()=>({count:residents.size,motion:selected()?.getState().motion||null,poseTicks:[...residents.values()].reduce((n,e)=>n+e.pilot.getState().poseTicks,0)}),
 dispose(){if(disposed)return;disconnect();disposed=true;}
 };
}
