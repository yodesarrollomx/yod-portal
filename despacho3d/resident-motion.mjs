// Visual office presence only. Movement does not claim that a business task ran.
export function createResidentMotion({slot,pilot,navigate}){
 const destinations=['potential','projects','decisions','delivery','lounge'];let next=null,step=slot;
 return {update(now,{hidden=false,overlay=false,reducedMotion=false,selected=false}={}){
  if(next===null)next=now+12000+slot*7000;
  if(hidden||overlay||reducedMotion||selected){next=now+12000+slot*1000;return false;}
  if(now<next||pilot.getMovementState().motion==='walk')return false;
  const destination=pilot.getMovementState().place==='inicio'?destinations[step++%destinations.length]:'inicio';
  next=now+25000+slot*3000;return navigate(destination)===true;
 }};
}
