import {createAvatarLayer} from './adapter.mjs';

// This controller consumes the panel's authorized profile, never a public roster.
// Placement is local to this room and cannot be supplied by a case record.
const POSITION=[6.65,0,-4.42], FRAME_MS=1000/15, HOME_ROT=Math.PI/2, WALK_SPEED=1.4;
export function createOfficePilot({scene,beforeOpen=()=>{},onChange=()=>{}}){
 let api=null,unsubscribe=null,profile=null,fingerprint='',lastFrame=null,time=0,poseTicks=0,disposed=false,route=null,lastPlace='inicio';
 const layer=createAvatarLayer({scene,onSelect(selection){
  if(!api||!profile||selection.id!==profile.id)return;
  // Recheck the current authority immediately before opening the panel.
  const current=api.getProfile();
  if(!current||current.id!==selection.id||current.case_id!==selection.case_id){replace(null);return;}
  beforeOpen();api.openForCase(selection.case_id);
 }});
 function replace(value){
  if(disposed)return;
  let next=null;
  if(value&&typeof value.id==='string'&&value.id&&value.id===value.case_id&&value.entity_kind==='case'){
   next={id:value.id,case_id:value.case_id,entity_kind:'case',name:value.name,form:value.form,color:value.color,visual:value.visual||{},placement:{position:[...POSITION],rotationY:Math.PI/2}};
  }
  const key=next?JSON.stringify(next):'';
  if(key===fingerprint)return;
  profile=null;fingerprint='';lastFrame=null;time=0;poseTicks=0;route=null;lastPlace='inicio';
  try{layer.replaceAuthorizedProfiles(next?[next]:[]);if(next){layer.update(0);profile=next;fingerprint=key;}}
  catch{layer.clear();}
  onChange();
 }
 function disconnect(){
  const stop=unsubscribe;unsubscribe=null;api=null;
  if(typeof stop==='function')stop();
  replace(null);
 }
 function bind(nextApi){
  if(disposed||nextApi===api)return;
  disconnect();
  if(!nextApi||!['getProfile','subscribeProfile','openForCase'].every(k=>typeof nextApi[k]==='function'))return;
  api=nextApi;
  try{
   unsubscribe=api.subscribeProfile(value=>{if(api===nextApi)replace(value);});
   replace(api.getProfile());
  }catch{disconnect();}
 }
 function update(now,{hidden=false,overlay=false,reducedMotion=false}={}){
  if(disposed||!profile||hidden||overlay){lastFrame=null;return false;}
  if(reducedMotion){if(route){finish();onChange();}lastFrame=null;return false;}
  if(lastFrame===null){lastFrame=now;return false;}
  if(now-lastFrame<FRAME_MS)return false;
  const dt=Math.min((now-lastFrame)/1000,.1);
  time+=dt;lastFrame=now;
  if(route)advance(dt);
  layer.update(time);poseTicks++;return true;
 }
 // Movimiento visual del agente entre espacios. Solo mueve la figura: no abre paneles, no envía nada.
 const model=()=>profile?layer.get(profile.id):null;
 function finish(){
  const m=model();
  if(m&&route){m.position.set(route.end[0],0,route.end[1]);m.rotation.y=route.rot;}
  const done=route;route=null;
  if(profile)layer.setMotion(profile.id,'idle');
  if(done){lastPlace=done.destino||null;try{done.onArrival?.();}catch{}}
 }
 function advance(dt){
  const m=model();if(!m){route=null;return;}
  let left=WALK_SPEED*dt;
  while(route&&left>0){
   const target=route.points[route.next],dx=target[0]-m.position.x,dz=target[1]-m.position.z,d=Math.hypot(dx,dz);
   if(d>1e-6)m.rotation.y=Math.atan2(dx,dz);
   if(d<=left){m.position.set(target[0],0,target[1]);left-=d;route.next++;if(route.next>=route.points.length){finish();return;}}
   else{m.position.x+=dx/d*left;m.position.z+=dz/d*left;left=0;}
  }
 }
 function walk(points,rot,{inmediato=false,onArrival=null,destino=null}={}){
  if(disposed||!profile||!Array.isArray(points)||points.length<2||!Number.isFinite(rot))return false;
  if(!points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))return false;
  const m=model();if(!m)return false;
  route={points:points.slice(1).map(p=>[...p]),next:0,end:[...points[points.length-1]],rot,onArrival:typeof onArrival==='function'?onArrival:null,destino};
  if(inmediato){finish();onChange();return true;}
  layer.setMotion(profile.id,'walk');onChange();return true;
 }
 return {bind,disconnect,update,pickables:()=>layer.pickables(),selectIntersection:hit=>!disposed&&layer.selectIntersection(hit),
  recorrer:walk,
  posicion:()=>{const m=model();return m?[m.position.x,m.position.z]:null;},
  inicio:{xz:[POSITION[0],POSITION[2]],rot:HOME_ROT},
  getMovementState:()=>({place:profile?lastPlace:null,destination:route?.destino||null,motion:profile?(route?'walk':'idle'):null,position:profile?(()=>{const m=model();return m?[m.position.x,m.position.z]:null;})():null}),
  getState:()=>({count:layer.size(),motion:profile?(route?'walk':'idle'):null,poseTicks}),
  dispose(){if(!disposed){disconnect();layer.dispose();disposed=true;}}
 };
}

// A character cannot be selected through a wall or a nearer room control.
// The old case box surrounds its figure and must not intercept its own mesh.
export function chooseOfficeHit({avatarHit=null,boxHits=[],sceneHits=[]}={}){
 const solid=sceneHits.find(hit=>{
  if(hit.object?.visible===false)return false;
  const materials=Array.isArray(hit.object?.material)?hit.object.material:[hit.object?.material];
  return materials.some(m=>m&&m.visible!==false&&!(m.transparent&&m.opacity<.95));
 });
 const depth=solid?.distance??Infinity;
 const boxes=boxHits.filter(hit=>Number.isFinite(hit.d)&&hit.d<=depth+.02).sort((a,b)=>a.d-b.d);
 const nearerBox=boxes.find(hit=>hit.id!=='case');
 if(avatarHit&&avatarHit.distance<=depth+.02&&(!nearerBox||avatarHit.distance<=nearerBox.d+.02))return {type:'avatar',hit:avatarHit};
 return boxes[0]?{type:'panel',id:boxes[0].id}:null;
}
