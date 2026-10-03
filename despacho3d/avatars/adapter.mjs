import {createAvatar,animateAvatar,disposeAvatar} from './avatar.mjs';
import {createIdentityIndex} from './identity.mjs';

/** Visual layer only. Receive profiles AFTER server authorization; never use a selected ID as access control. */
export function createAvatarLayer({scene,onSelect=()=>{}}={}){
 if(!scene?.add)throw new TypeError('A Three scene/group is required');
 let index=createIdentityIndex([]),profiles=[],entities=new Map(),disposed=false;
 const requireLive=()=>{if(disposed)throw new Error('Avatar layer disposed');};
 function clear(){for(const model of entities.values())disposeAvatar(model);entities.clear();profiles=[];index=createIdentityIndex([]);}
 function mount(profile){
  const {id,name='',form='visitor',color,visual={},placement={}}=profile;
  const root=createAvatar(form,color,name,{...visual,seed:id,quality:'office'});
  root.userData.canonicalId=id;root.userData.caseId=profile.case_id||null;
  root.traverse(o=>{if(o.isMesh)o.userData.canonicalId=id;});
  const pos=placement.position||[0,0,0];root.position.set(...pos);root.rotation.y=placement.rotationY||0;root.visible=placement.visible!==false;
  const scale=Math.min(1.35,Math.max(.7,Number(placement.scale)||1));root.scale.setScalar(scale);root.userData.motion='idle';scene.add(root);entities.set(id,root);return root;
 }
 function replaceAuthorizedProfiles(nextProfiles,aliases={}){
  requireLive();clear(); // Revocation is fail-closed, including malformed new input.
  nextProfiles=JSON.parse(JSON.stringify(nextProfiles));const nextIndex=createIdentityIndex(nextProfiles,aliases);
  for(const p of nextProfiles){const pos=p.placement?.position;if(pos&&(!Array.isArray(pos)||pos.length!==3||!pos.every(Number.isFinite)))throw new Error('Invalid placement');}
  try{for(const p of nextProfiles)mount(p);index=nextIndex;profiles=nextProfiles.map(p=>({...p}));}catch(error){clear();throw error;}
  return entities.size;
 }
 function select(id){requireLive();const canonical=index.resolve(id);if(!canonical||!entities.get(canonical)?.visible)return false;const p=index.get(canonical);onSelect({id:canonical,case_id:p.case_id||null,entity_kind:p.entity_kind||null});return true;}
 function selectIntersection(hit){return hit?.object?select(hit.object.userData.canonicalId):false;}
 function setAppearance(id,look){requireLive();const canonical=index.resolve(id),prior=entities.get(canonical);if(!prior)return null;const p=profiles.find(p=>p.id===canonical);const placement={position:prior.position.toArray(),rotationY:prior.rotation.y,scale:prior.scale.x,visible:prior.visible};const motion=prior.userData.motion;disposeAvatar(prior);const updated={...p,form:look.form||p.form,color:look.color||p.color,visual:{...p.visual,...look},placement};profiles=profiles.map(p=>p.id===canonical?updated:p);const root=mount(updated);root.userData.motion=motion;return root;}
 function setMotion(id,motion='idle'){requireLive();const model=entities.get(index.resolve(id));if(!model)return false;if(!['idle','walk','sit','talk','wave','deliver'].includes(motion))throw new Error('Unknown animation');model.userData.motion=motion;return true;}
 function update(seconds,{reducedMotion=false}={}){requireLive();for(const root of entities.values()){if(!root.visible)continue;const motion=root.userData.motion;animateAvatar(root,reducedMotion?0:seconds,motion==='walk',motion==='sit',motion);}}
 function dispose(){if(!disposed){clear();disposed=true;}}
 return {replaceAuthorizedProfiles,select,selectIntersection,setAppearance,setMotion,update,clear,dispose,get:id=>entities.get(index.resolve(id))||null,pickables:()=>[...entities.values()].filter(x=>x.visible),size:()=>entities.size};
}
