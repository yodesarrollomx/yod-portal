// Choose only among the already authorized visible residents. This grants no access.
export function nearbyResident({residents=[],point,currentCaseId=null,range=10,margin=.75}={}){
 if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite))return null;
 const candidates=residents.flatMap(r=>{
  const p=r.profile,a=r.anchor;
  if(!p||p.id!==p.case_id||p.entity_kind!=='case'||!Array.isArray(a)||a.length!==3||!a.every(Number.isFinite))return [];
  const distance=Math.hypot(point[0]-a[0],point[1]-a[2]);
  return distance<=range?[{case_id:p.case_id,distance}]:[];
 }).sort((a,b)=>a.distance-b.distance);
 const nearest=candidates[0],current=candidates.find(p=>p.case_id===currentCaseId);
 return current&&nearest&&current.distance<=nearest.distance+margin?current:nearest||null;
}
