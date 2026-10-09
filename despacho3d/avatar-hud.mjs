import * as T from 'three';
import {avatarPresence} from './avatar-presence.mjs?v=126';
const paths={
 analysis:'M4 14V9m4 5V5m4 9V2m4 12V7M2 17h16',
 library:'M3 3h5c2 0 2 1 2 2v12c0-1-1-2-3-2H3ZM17 3h-5c-2 0-2 1-2 2v12c0-1 1-2 3-2h4Z',
 research:'M17 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM14 13l4 5M8 2c-3 5-3 7 0 12M10 2c3 5 3 7 0 12M3 8h14',
 review:'M3 4h14v10H3ZM10 14v4m-3 0h6M6 8l2 2 5-4',
 blocked:'M10 2 1 17h18ZM10 7v5m0 2v.1',
 wait:'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM10 5v5l3 2',
 loading:'M3 9a7 7 0 0 1 13-4M16 2v4h-4M17 11a7 7 0 0 1-13 4M4 18v-4h4',
 offline:'M3 3l14 14M3 8a10 10 0 0 1 3-2m4-1a10 10 0 0 1 7 3M6 11a6 6 0 0 1 3-2m4 1 1 1M9 15l1-1 1 1'
};
// DOM labels add no WebGL renderer, textures, animation loop or network request.
export function createAvatarHUD({container,onSelect=()=>{},doc=document,now=Date.now}={}){
 if(!container)throw new TypeError('HUD container required');
 const layer=doc.createElement('div');layer.className='avatar-hud';container.append(layer);
 const entries=new Map(),point=new T.Vector3(),ray=new T.Raycaster(),origin=new T.Vector3(),direction=new T.Vector3();
 let disposed=false,lastSample=-Infinity;
 function remove(id){entries.get(id)?.button.remove();entries.delete(id);}
 function mount(id){
  const button=doc.createElement('button');button.type='button';button.className='avatar-presence';button.dataset.caseId=id;
  const icon=doc.createElement('span');icon.className='avatar-presence__icon';icon.setAttribute('aria-hidden','true');
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 20 20');const path=doc.createElementNS(svg.namespaceURI,'path');svg.append(path);icon.append(svg);
  const name=doc.createElement('strong'),label=doc.createElement('span'),milestones=doc.createElement('span');label.className='avatar-presence__label';milestones.className='avatar-presence__milestones';milestones.setAttribute('aria-hidden','true');
  button.append(icon,name,label,milestones);button.onclick=()=>{if(!disposed&&!button.hidden&&entries.has(id))onSelect(id);};
  const e={button,name,label,path,milestones,key:''};entries.set(id,e);layer.append(button);return e;
 }
 function update({residents=[],observations=[],camera,occluder=null,visibleHit=()=>true,hidden=false,selectedCaseId=null,time=now()}={}){
  if(disposed)return;layer.hidden=!!hidden;
  const allowed=new Set(residents.map(r=>r.profile?.case_id)),denied=new Set(observations.filter(s=>s.phase==='unauthorized').map(s=>s.case_id));for(const id of entries.keys())if(!allowed.has(id)||denied.has(id))remove(id);
  if(hidden||!camera)return;
  // Bound projection/occlusion work to 10 Hz; update authorization removal immediately.
  if(time-lastSample<100)return;lastSample=time;
  const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;
  const states=new Map(observations.map(s=>[s.case_id,s]));
  const projected=[];
  camera.updateMatrixWorld();camera.getWorldPosition(origin);
  for(const r of residents){
   const id=r.profile?.case_id,p=avatarPresence({profile:r.profile,observation:states.get(id),movement:r.movement,now:time});
   if(!p){remove(id);continue;}
   const e=entries.get(id)||mount(id);e.button.hidden=true;
   if(!Array.isArray(r.anchor)||r.anchor.length!==3||!r.anchor.every(Number.isFinite))continue;
   point.set(...r.anchor);direction.copy(point).sub(origin);const length=direction.length();
   if(occluder&&length>.1){ray.set(origin,direction.normalize());ray.far=length-.15;
    if(ray.intersectObject(occluder,true).some(h=>visibleHit(h)&&h.object?.visible!==false&&(Array.isArray(h.object.material)?h.object.material:[h.object.material]).some(m=>m?.visible!==false&&m&&(!m.transparent||m.opacity>=.95))))continue;
   }
   point.project(camera);if(Math.abs(point.x)>1||Math.abs(point.y)>1||Math.abs(point.z)>1)continue;
   const key=JSON.stringify(p);if(key!==e.key){e.key=key;e.name.textContent=p.name;e.label.textContent=p.label;e.path.setAttribute('d',paths[p.activity]||paths.wait);e.button.dataset.activity=p.activity;e.button.style.setProperty('--avatar-accent',p.color);e.milestones.replaceChildren();
    if(p.progress){for(const state of p.progress.states){const tick=doc.createElement('i');tick.dataset.state=state;e.milestones.append(tick);}const count=doc.createElement('span');count.className='avatar-presence__count';count.textContent=p.progress.ready+'/'+p.progress.total+' listas';e.milestones.append(count);}
    e.milestones.hidden=!p.progress;e.button.setAttribute('aria-label',p.name+' · '+p.label+(p.progress?' · '+p.progress.label:'')+' · Abrir opciones');e.button.title=e.button.getAttribute('aria-label');
   }
   e.button.dataset.selected=String(id===selectedCaseId);
   projected.push({e,id,x:(point.x+1)*width/2,y:(1-point.y)*height/2,distance:length});
  }
  // Prioritize the nearest marker; offset colliding labels without extending offscreen.
  const occupied=[];projected.sort((a,b)=>(a.id===selectedCaseId?-1:b.id===selectedCaseId?1:a.distance-b.distance));
  for(const p of projected){p.e.button.hidden=false;const w=p.e.button.offsetWidth||158,h=p.e.button.offsetHeight||55;let x=Math.max(6,Math.min(width-w-6,p.x-w/2)),y=Math.max(6,p.y-h-8);let placed=false;
   for(let attempt=0;attempt<4;attempt++){
    const rect={x,y,w,h};if(y+h<=height-6&&!occupied.some(o=>rect.x<o.x+o.w+4&&rect.x+rect.w+4>o.x&&rect.y<o.y+o.h+4&&rect.y+rect.h+4>o.y)){occupied.push(rect);placed=true;break;}y-=h+7;if(y<6)break;
   }
   p.e.button.hidden=!placed;if(placed)p.e.button.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';
  }
 }
 return{update,clear(){for(const id of entries.keys())remove(id);lastSample=-Infinity;},dispose(){if(disposed)return;disposed=true;entries.clear();layer.remove();}};
}
