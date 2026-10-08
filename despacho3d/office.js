import {AUTONES_MULTIPLES} from './office-config.mjs?v=2';
import {createOfficeResidents} from './avatars/office-residents.mjs?v=1';
import * as T from 'three';
import {createEncounterGate,createPreparationGate,ENCOUNTER_RANGE} from './agent-proximity.mjs?v=4';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {createOffice} from './scene.js?v=9';
import {panels} from './office-panels.mjs?v=2';
import {createChinches3D} from './chinches3d.mjs?v=3';
import {createOfficePilot,chooseOfficeHit} from './avatars/office-pilot.mjs?v=8';
import {ENTORNO_AGENTE_CAMINA} from './entorno-config.mjs';
import {crearAgenteIr} from './entorno-ruta.mjs?v=4';
import {fitOfficeOverview,visibleOfficeHit} from './office-overview.mjs?v=1';
import {places,allowed} from './office-layout.mjs?v=2';
const $=s=>document.querySelector(s),mount=$('#scene'),coarse=matchMedia('(pointer:coarse)').matches;
let renderer;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('#loading').hidden=true;$('#fallback').hidden=false;throw e;}
renderer.localClippingEnabled=true;
renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.25:1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;mount.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#223b3f');scene.fog=new T.Fog('#223b3f',60,180);
const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.23;room.dispose();pmrem.dispose();
const walkCamera=new T.PerspectiveCamera(43,1,.08,240),overviewCamera=new T.OrthographicCamera(-30,30,20,-20,.08,240);
let camera=overviewCamera;
const orbit=new OrbitControls(overviewCamera,renderer.domElement);
orbit.enableDamping=true;orbit.dampingFactor=.11;orbit.enableRotate=false;orbit.enablePan=true;orbit.screenSpacePanning=true;orbit.minZoom=.75;orbit.maxZoom=4;orbit.zoomSpeed=.7;
orbit.mouseButtons={LEFT:T.MOUSE.PAN,MIDDLE:T.MOUSE.DOLLY,RIGHT:T.MOUSE.PAN};
orbit.touches={ONE:T.TOUCH.PAN,TWO:T.TOUCH.DOLLY_PAN};
scene.add(new T.HemisphereLight('#f5f2e9','#98968a',1.45));const sun=new T.DirectionalLight('#fff1d9',2.4);sun.position.set(-10,22,10);sun.castShadow=true;sun.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);Object.assign(sun.shadow.camera,{left:-31,right:25,top:25,bottom:-25,near:1,far:60});sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun);const fill=new T.DirectionalLight('#dce8ec',.8);fill.position.set(10,10,-9);scene.add(fill);
let office;try{office=await createOffice({pilotFigure:false});scene.add(office.model);}catch(e){$('#loading').hidden=true;$('#fallback').hidden=false;throw e;}

let chinches=null;
let agentOverlay=false;
const proximity=createEncounterGate(),preparationGate=createPreparationGate(),sight=new T.Raycaster();
let lastApproachPosition=null,recentApproach=null,lastProximitySample=-Infinity;
window.addEventListener('yod-agent-menu-open',e=>{if(!e.detail?.proximity)proximity.dismiss(e.detail?.case_id);});
window.addEventListener('yod-agent-encounter-dismiss',e=>proximity.dismiss(e.detail?.case_id));
let mode='overview',selected='entry',yaw=0,pitch=0,near=null,sheet=null,look=null,stickId=null,stick={x:0,y:0},keys=new Set(),last=performance.now(),frames=0,transitionToken=0,dirty=true,lastFocus=null;
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
let avatarShadowAt=0;
const pilot=(AUTONES_MULTIPLES?createOfficeResidents:createOfficePilot)({scene,beforeOpen:()=>closeSheets(false),onChange:()=>{dirty=true;renderer.shadowMap.needsUpdate=true;avatarShadowAt=performance.now();}});
const bindPilot=()=>pilot.bind(window.YodResidentAgents||window.CubefarmYOD);
window.addEventListener('yod-agents-ready',bindPilot);
window.addEventListener('yod-residents-ready',bindPilot);
window.addEventListener('pagehide',()=>pilot.disconnect());
window.addEventListener('pageshow',bindPilot);
bindPilot();
let unwatchWork=null;
function bindWork(){unwatchWork?.();unwatchWork=window.YodWorkObserver?.subscribe(s=>{
 const id=window.YodResidentAgents?.getSelection?.()?.case_id;
 office.computerScreen?.update(id&&s.case_id===id?{...s,projectName:window.YodResidentAgents.getSelection().name}:{phase:'unauthorized',case_id:null,work:null,image:null});
 dirty=true;
});}
window.addEventListener('yod-work-observer-ready',bindWork);bindWork();
window.addEventListener('pagehide',()=>{unwatchWork?.();office.computerScreen?.dispose();});


const agentMarker=document.createElement('button'),markerName=document.createElement('strong'),markerStatus=document.createElement('span');agentMarker.append(markerName,markerStatus);agentMarker.id='office-agent-marker';agentMarker.type='button';agentMarker.hidden=true;mount.append(agentMarker);
let markerCase=null;
agentMarker.onclick=()=>{
 const api=window.YodResidentAgents||window.CubefarmYOD,p=api?.getProfile?.();
 if(!p||p.id!==markerCase||p.case_id!==markerCase||p.entity_kind!=='case')return;
 closeSheets(false);window.YodAgentMenu?.showRadial(markerCase);
};
function paintAgentMarker(){
 const api=window.YodResidentAgents||window.CubefarmYOD,p=api?.getProfile?.(),a=pilot.getMovementState();
 const show=mode==='overview'&&!sheet&&!agentOverlay&&p?.id===p?.case_id&&p?.entity_kind==='case'&&!!a.position;
 agentMarker.hidden=!show;markerCase=show?p.case_id:null;if(!show)return;
 const point=new T.Vector3(a.position[0],1.9,a.position[1]).project(camera);
 if(Math.abs(point.x)>1||Math.abs(point.y)>1||Math.abs(point.z)>1){agentMarker.hidden=true;return;}

 const state=a.motion==='walk'?'En camino':a.place==='inicio'?'En su puesto':'En '+(places[a.place]?.label||'la oficina');
 const text=(p.name||'Autón')+' · '+state;
 if(agentMarker.dataset.label!==text){agentMarker.dataset.label=text;markerName.textContent=p.name||'Autón';markerStatus.textContent=state;agentMarker.setAttribute('aria-label','Abrir puesto de '+(p.name||'autón')+'. '+state);}
 const half=agentMarker.offsetWidth/2+8;
 agentMarker.style.left=T.MathUtils.clamp((point.x+1)*.5*mount.clientWidth,half,mount.clientWidth-half)+'px';
 agentMarker.style.top=((-point.y+1)*.5*mount.clientHeight)+'px';
}

function isMobile(){return innerWidth<=700||coarse;}
function updateAngles(target){const d=new T.Vector3().subVectors(target,camera.position);yaw=Math.atan2(-d.x,-d.z);pitch=T.MathUtils.clamp(Math.atan2(d.y,Math.hypot(d.x,d.z)),-.75,.75);camera.rotation.set(pitch,yaw,0,'YXZ');}
function fitOverview(){fitOfficeOverview(overviewCamera,orbit,mount.clientWidth/Math.max(1,mount.clientHeight));dirty=true;}
function resetStick(){stickId=null;stick={x:0,y:0};$('#stick-knob').style.transform='translate(0px,0px)';}
function clearMovement(){keys.clear();resetStick();look=null;}
function updateChrome(){const walk=mode==='walk';$('#overview').setAttribute('aria-pressed',String(!walk));$('#walk').setAttribute('aria-pressed',String(walk));$('#joystick').hidden=!walk||!isMobile()||!!sheet;$('#walk-guide').hidden=!walk||!isMobile()||!!sheet;$('#crosshair').hidden=!walk||isMobile()||!!sheet;$('#hint').hidden=walk&&isMobile();$('#hint').textContent=walk?'WASD o flechas para caminar · Arrastra para mirar':isMobile()?'Arrastra para desplazar · Dos dedos para acercar':'Arrastra para desplazar · Rueda para acercar';$('#location').textContent=walk?places[selected].label:'Vista general';paintAgentMarker();}
function setMode(next){chinches?.stop();transitionToken++;$('#fade').classList.remove('visible');closeSheets(false);clearMovement();mode=next;camera=next==='overview'?overviewCamera:walkCamera;office.setCutaway(next==='overview');renderer.shadowMap.needsUpdate=true;orbit.enabled=next==='overview';if(next==='overview')fitOverview();else{camera.fov=isMobile()?70:72;camera.updateProjectionMatrix();const d=places[selected]||places.entry;camera.position.fromArray(d.eye);updateAngles(new T.Vector3(...d.target));}updateChrome();dirty=true;if(!isMobile())mount.focus({preventScroll:true});}
async function visit(id){if(!Object.hasOwn(places,id))return false;chinches?.stop();closeSheets(false);clearMovement();const token=++transitionToken;$('#fade').classList.add('visible');await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion:reduce)').matches?0:130));if(token!==transitionToken)return false;selected=id;mode='walk';camera=walkCamera;office.setCutaway(false);renderer.shadowMap.needsUpdate=true;orbit.enabled=false;camera.fov=isMobile()?70:72;camera.updateProjectionMatrix();camera.position.fromArray(places[id].eye);updateAngles(new T.Vector3(...places[id].target));updateChrome();dirty=true;$('#fade').classList.remove('visible');if(!isMobile())mount.focus({preventScroll:true});return true;}
function showSheet(id){chinches?.stop();closeSheets(false);lastFocus=document.activeElement;clearMovement();sheet=id;document.querySelector('header').inert=true;for(const e of mount.parentElement.children)if(!e.classList.contains('sheet')&&e.id!=='scrim')e.inert=true;$('#'+id).hidden=false;$('#scrim').hidden=false;$('#'+id).scrollTop=0;orbit.enabled=false;$('#nearby').hidden=true;updateChrome();$('#'+id+' .close').focus({preventScroll:true});}
function closeSheets(focus=true){document.querySelectorAll('.sheet').forEach(e=>e.hidden=true);$('#scrim').hidden=true;document.querySelector('header').inert=false;for(const e of mount.parentElement.children)e.inert=false;const restore=lastFocus;sheet=null;clearMovement();orbit.enabled=mode==='overview';updateChrome();if(focus&&restore?.isConnected)restore.focus({preventScroll:true});dirty=true;}
function openPanel(id){if(id==='computer'){const selected=window.YodResidentAgents?.getSelection?.();if(selected){closeSheets(false);void window.YodVoiceWorkspace?.openForCase(selected.case_id,'ppp');}return;}if(id==='case'&&window.YodResidentAgents?.getSelection?.()){closeSheets(false);void window.YodAgentMenu?.showRadial(window.YodResidentAgents.getSelection().case_id);return;}const d=panels[id];if(!d)return;$('#panel-tag').textContent=d.tag;$('#panel-title').innerHTML=d.title;$('#panel-body').innerHTML=d.body;showSheet('panel');chinches.bindPanel(id);if(id==='case'&&window.CubefarmYOD){const button=document.createElement('button');button.className='open-agent-panel';button.textContent='Abrir panel de agentes';button.onclick=()=>window.CubefarmYOD.open('chat');$('#panel-body').prepend(button);}}
$('#overview').onclick=()=>setMode('overview');$('#walk').onclick=()=>setMode('walk');$('#areas-open').onclick=()=>showSheet('areas');$('#help-open').onclick=()=>showSheet('help');$('#case-open').onclick=async()=>{await visit('case');openPanel('case');};document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>visit(b.dataset.place));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeSheets());$('#scrim').onclick=()=>closeSheets();$('#nearby').onclick=()=>near&&openPanel(near);

function movement(dt){let forward=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0)-stick.y,sideways=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0)+stick.x;const length=Math.hypot(forward,sideways);if(length<.05)return false;const speed=2.1*dt/Math.max(1,length),dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*sideways)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*sideways)*speed;const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.1)||1;for(let i=0;i<steps;i++){if(allowed(camera.position.x+dx/steps,camera.position.z))camera.position.x+=dx/steps;if(allowed(camera.position.x,camera.position.z+dz/steps))camera.position.z+=dz/steps;}return true;}
function updateAgentProximity(now){
 const fresh=window.YodResidentAgents?.getSelection?.(),position=pilot.posicion();
 const id=fresh?.avatar?.case_id===fresh?.case_id?fresh?.case_id:null;
 const distance=position?Math.hypot(camera.position.x-position[0],camera.position.z-position[1]):Infinity;
 const manual=keys.size>0||Math.hypot(stick.x,stick.y)>.05;
 const previous=lastApproachPosition;
 const moved=previous&&Math.hypot(camera.position.x-previous.x,camera.position.z-previous.z)>.0005;
 lastApproachPosition={x:camera.position.x,z:camera.position.z};
 const enabled=mode==='walk'&&!sheet&&!agentOverlay&&!document.hidden&&!chinches?.isSelecting()&&
  document.getElementById('office-accessible')?.hidden!==false&&!!window.YodAgentMenu;
 // Remember only a local approach, never an authorization. A slow lease refresh
 // must not require the person already standing here to walk away and back.
 const shownId=window.YodResidentAgents?.getProfile?.()?.case_id;
 if(recentApproach&&recentApproach.id!==shownId)recentApproach=null;
 if(enabled&&manual&&moved&&shownId)recentApproach={id:shownId,at:now};
 if(enabled&&id&&recentApproach?.id===id&&now-recentApproach.at<60000&&distance<ENCOUNTER_RANGE.leave)proximity.approach(id);
 // Keep movement intent above this bound; raycasting the entire furnished room
 // on every animation frame competes with input and voice on modest devices.
 if(now-lastProximitySample<100)return;
 lastProximitySample=now;
 const preparation=preparationGate.sample({caseId:id,distance,enabled:enabled&&!!fresh?.can_enqueue,now});
 if(preparation==='prepare')window.YodVoiceWorkspace?.prepareNearby?.(id);
 if(preparation==='release')window.YodVoiceWorkspace?.releaseNearby?.();
 let visible=false,facing=false;
 if(enabled&&id&&distance<=ENCOUNTER_RANGE.menu){
  const target=new T.Vector3(position[0],1.4,position[1]),direction=target.clone().sub(camera.position),length=direction.length();
  const horizontal=new T.Vector3(direction.x,0,direction.z).normalize(),forward=camera.getWorldDirection(new T.Vector3());forward.y=0;forward.normalize();
  facing=forward.dot(horizontal)>=Math.cos(Math.PI/3);
  sight.set(camera.position,direction.normalize());sight.far=Math.max(0,length-.2);
  visible=!sight.intersectObject(office.model,true).some(hit=>{
   const materials=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
   return hit.object.visible&&materials.some(m=>m?.visible&&(!m.transparent||m.opacity>=.95));
  });
 }
 const approaching=!!(previous&&position&&distance<Math.hypot(previous.x-position[0],previous.z-position[1])-.0005);
 const hit=proximity.sample({caseId:id,distance,enabled,visible,facing,moving:!!(manual&&moved),approaching,agentMoving:pilot.getMovementState().motion==='walk',canTalk:!!fresh?.can_enqueue&&typeof window.YodVoiceWorkspace?.openForCase==='function',now});
 if(hit==='menu')window.YodAgentMenu.showRadial(id,{proximity:true});
 if(hit==='voice'){
  window.YodAgentMenu.close('transition');
  void window.YodVoiceWorkspace?.openForCase(id,'ppp',{startVoice:true,encounter:true,compactOnly:true});
 }
 if(hit==='leave'){
  if(window.YodAgentMenu?.isProximity?.())window.YodAgentMenu.close('leave');
  window.YodVoiceWorkspace?.pauseEncounter?.(id);
 }
}

function updateNear(){near=null;let distance=2.3;for(const [id,p] of Object.entries(places)){if(id==='entry')continue;const d=camera.position.distanceTo(new T.Vector3(...p.eye));if(d<distance){distance=d;near=id;}}if(selected==='case'&&camera.position.distanceTo(new T.Vector3(...places.case.eye))<2)near='case';const show=!!near&&mode==='walk'&&!sheet;$('#nearby').hidden=!show;if(show)$('#nearby').textContent=near==='case'?'Abrir puesto del proyecto':'Ver '+places[near].label;}
window.addEventListener('keydown',e=>{if(agentOverlay)return;if(!sheet&&document.getElementById('office-accessible')?.hidden===false)return;if(e.key==='Escape'){if(window.YodAgentMenu?.isProximity?.())window.YodAgentMenu.close();closeSheets();return;}if(sheet){if(e.key==='Tab'){const nodes=[...$('#'+sheet).querySelectorAll('button,a[href]')],first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}const k=e.key.length===1?e.key.toLowerCase():e.key;if(mode==='walk'&&['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)){e.preventDefault();keys.add(k);}if(k==='e'&&near)openPanel(near);});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',clearMovement);document.addEventListener('visibilitychange',()=>{clearMovement();last=performance.now();});
const base=$('#stick-base');function updateStick(e){const rect=base.getBoundingClientRect(),dx=e.clientX-(rect.x+rect.width/2),dy=e.clientY-(rect.y+rect.height/2),length=Math.hypot(dx,dy),limit=35*rect.width/112,factor=Math.min(1,limit/(length||1));const x=dx*factor,y=dy*factor;stick={x:Math.abs(x)<3?0:x/limit,y:Math.abs(y)<3?0:y/limit};$('#stick-knob').style.transform=`translate(${x*112/rect.width}px,${y*112/rect.width}px)`;}
base.addEventListener('pointerdown',e=>{if(stickId!==null)return;e.preventDefault();e.stopPropagation();stickId=e.pointerId;base.setPointerCapture(e.pointerId);updateStick(e);});base.addEventListener('pointermove',e=>{if(e.pointerId===stickId){e.preventDefault();updateStick(e);}});for(const name of ['pointerup','pointercancel','lostpointercapture'])base.addEventListener(name,e=>{if(e.pointerId===stickId)resetStick();});
const raycaster=new T.Raycaster();let press=null;const pointers=new Set();renderer.domElement.addEventListener('pointerdown',e=>{if(sheet)return;pointers.add(e.pointerId);press={x:e.clientX,y:e.clientY,id:e.pointerId,multiple:pointers.size>1};if(mode==='walk'&&look===null){look={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}if(!isMobile())mount.focus({preventScroll:true});});
renderer.domElement.addEventListener('pointermove',e=>{if(mode==='walk'&&look?.id===e.pointerId&&!sheet){const dx=e.clientX-look.x,dy=e.clientY-look.y;yaw-=dx*.0036;pitch=T.MathUtils.clamp(pitch-dy*.0036,-.75,.75);camera.rotation.set(pitch,yaw,0,'YXZ');look.x=e.clientX;look.y=e.clientY;dirty=true;}});
function release(e,cancel=false){pointers.delete(e.pointerId);if(look?.id===e.pointerId)look=null;if(!cancel&&press&&press.id===e.pointerId&&!press.multiple&&pointers.size===0&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<7&&!sheet){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hits=[];for(const pick of office.pickBoxes){const p=raycaster.ray.intersectBox(new T.Box3(new T.Vector3(...pick.min),new T.Vector3(...pick.max)),new T.Vector3());if(p)hits.push({id:pick.id,d:p.distanceTo(camera.position)});}hits.sort((a,b)=>a.d-b.d);if(chinches.isSelecting()){const surface=raycaster.intersectObject(office.model,true).filter(hit=>visibleOfficeHit(hit,office.getCutaway())).find(hit=>{const {x,y,z}=hit.point;const within=b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ;return y>=-.35&&y<=5&&(within(office.bounds)||within(office.annex));});if(surface){const p=surface.point;const hitZone=office.pickBoxes.find(box=>p.x>=box.min[0]&&p.x<=box.max[0]&&p.y>=box.min[1]&&p.y<=box.max[1]&&p.z>=box.min[2]&&p.z<=box.max[2])?.id;
// The model intersection wins; outside a known pick volume, use the current visited location.
chinches.selectPoint(p.toArray(),hitZone==='computer'?'case':hitZone||selected);}}else{const selection=chooseOfficeHit({avatarHit:raycaster.intersectObjects(pilot.pickables(),true)[0],boxHits:hits,sceneHits:raycaster.intersectObject(office.model,true).filter(hit=>visibleOfficeHit(hit,office.getCutaway()))});if(selection?.type==='avatar')pilot.selectIntersection(selection.hit);else if(selection?.type==='panel')openPanel(selection.id);}}press=null;}
renderer.domElement.addEventListener('pointerup',e=>release(e));renderer.domElement.addEventListener('pointercancel',e=>release(e,true));renderer.domElement.addEventListener('lostpointercapture',e=>{if(look?.id===e.pointerId)look=null;});
orbit.addEventListener('change',()=>{dirty=true;});
function resize(){const width=mount.clientWidth,height=mount.clientHeight;renderer.setSize(width,height);walkCamera.aspect=width/Math.max(1,height);walkCamera.updateProjectionMatrix();if(mode==='overview')fitOverview();else updateChrome();dirty=true;}new ResizeObserver(resize).observe(mount);resize();setMode('overview');
let rendererLost=false;let shadowBaked=false;function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.1);last=now;const avatarChanged=pilot.update(now,{hidden:document.hidden,overlay:agentOverlay,reducedMotion:reducedMotion.matches});if(avatarChanged){dirty=true;if(now-avatarShadowAt>=400){renderer.shadowMap.needsUpdate=true;avatarShadowAt=now;}}if(document.hidden)return;updateAgentProximity(now);if(mode==='walk'&&!sheet&&!agentOverlay){dirty=movement(dt)||dirty;updateNear();}else if(mode==='overview'&&!sheet&&!agentOverlay)orbit.update();if(office.model.userData.needsRender){dirty=true;office.model.userData.needsRender=false;}if(dirty&&!rendererLost){renderer.render(scene,camera);paintAgentMarker();frames++;dirty=false;if(!shadowBaked){renderer.shadowMap.autoUpdate=false;shadowBaked=true;}}}
requestAnimationFrame(animate);$('#loading').hidden=true;window.officeReady=true;renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();rendererLost=true;clearMovement();$('#fallback').hidden=false;if(window.despacho)window.despacho.view='map';window.dispatchEvent(new CustomEvent('yod-office-view-unavailable'));});
window.despacho={setAgentActivity:pilot.setActivity,view:'3d',layout:office,get camera(){return camera;},getAgentState:()=>pilot.getMovementState(),model:office.model,scene,visit,setMode,openPanel,closeSheets,getState:()=>({computer:office.computerScreen?.snapshot(),projection:camera.isOrthographicCamera?'orthographic':'perspective',cutaway:office.getCutaway(),zoom:camera.zoom,mode,selected,near,sheet,position:camera.position.toArray(),rotation:camera.rotation.toArray(),frames,stick:{...stick},triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,allowed:allowed(camera.position.x,camera.position.z),mobile:isMobile(),colliders:office.collisions.length,avatar:pilot.getState()}),allowed};
if(ENTORNO_AGENTE_CAMINA||/(?:^|[?&])camina=1(?:&|$)/.test(location.search))window.despacho.agenteIr=crearAgenteIr({lugares:places,piloto:pilot,permitido:allowed,limites:[office.bounds,office.annex],reducido:()=>reducedMotion.matches,alLlegar:lugar=>window.dispatchEvent(new CustomEvent('yod-agent-arrived',{detail:{lugar}}))});

chinches=createChinches3D({readZone:()=>selected,readView:()=>document.getElementById('office-accessible')?.hidden===false||window.despacho?.view==='map'?{position:null,quaternion:null,fov:null,mode:'map'}:({position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.isPerspectiveCamera?camera.fov:null,mode,...(camera.isOrthographicCamera?{orthographic:{left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom,zoom:camera.zoom}}:{})}),closeSheets:()=>closeSheets(),onChange:active=>{clearMovement();$('#scene').classList.toggle('pin-selecting',active);}});

// URL contains navigation only; all business state remains in Sheets.
async function routeOffice(){const place=location.hash.slice(1);if(!Object.hasOwn(places,place))return;await visit(place);if(panels[place])openPanel(place);}
window.addEventListener('hashchange',routeOffice);
await routeOffice();
window.dispatchEvent(new CustomEvent('yod-office-ready',{detail:null}));

function agentsVisibility(open){if(agentOverlay===open)return;agentOverlay=open;chinches?.stop();closeSheets(false);clearMovement();document.querySelector('header').inert=agentOverlay;document.getElementById('workspace').inert=agentOverlay;orbit.enabled=!agentOverlay&&mode==='overview';dirty=true;}
window.addEventListener('yod-agents-visibility',e=>agentsVisibility(e.detail===true));
if(window.CubefarmYOD?.isOpen())agentsVisibility(true);
