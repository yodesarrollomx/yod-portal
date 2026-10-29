const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../despacho3d'),vendor=pathToFileURL(path.join(base,'vendor/three.module.js')).href;
const source=fs.readFileSync(path.join(base,'office-overview.mjs'),'utf8').replace("from 'three'","from '"+vendor+"'");
const modules=Promise.all([import(vendor),import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))]);
test('all office corners fit the elevated camera on desktop, portrait and narrow screens',async()=>{
 const [T,{fitOfficeOverview,OFFICE_EXTENTS}]=await modules;
 for(const aspect of [1.8,1,.45,.3]){
  const camera=new T.OrthographicCamera(),controls={target:new T.Vector3(),update(){}};
  fitOfficeOverview(camera,controls,aspect);
  for(const x of [OFFICE_EXTENTS.min[0],OFFICE_EXTENTS.max[0]])for(const y of [OFFICE_EXTENTS.min[1],OFFICE_EXTENTS.max[1]])for(const z of [OFFICE_EXTENTS.min[2],OFFICE_EXTENTS.max[2]]){
   const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.82&&Math.abs(p.y)<.82,'corners leave room for interface');assert.ok(Math.abs(p.z)<=1);
  }
  const a=new T.Vector3(0,1,0).project(camera),b=new T.Vector3(1,1,0).project(camera),c=new T.Vector3(0,1,-8).project(camera),d=new T.Vector3(1,1,-8).project(camera);
  assert.ok(Math.abs(a.distanceTo(b)-c.distanceTo(d))<1e-8,'distant characters keep their scale');
 }
});
test('cutaway picking removes clipped walls, keeps furniture and restores walls for walking',async()=>{
 const [,{visibleOfficeHit}]=await modules;
 const wall={object:{material:{userData:{officePartition:true}}},point:{y:2}};
 assert.equal(visibleOfficeHit(wall,true),false);assert.equal(visibleOfficeHit(wall,false),true);
 assert.equal(visibleOfficeHit({...wall,point:{y:.5}},true),true);
 assert.equal(visibleOfficeHit({object:{material:{}},point:{y:2}},true),true);
});
function panoramaFixture(){
 const vm=require('node:vm'),code=fs.readFileSync(path.join(__dirname,'../scripts/probar-oficina-panoramica-browser.cjs'),'utf8');
 const marker='await page.addInitScript(()=>{',start=code.indexOf(marker)+marker.length,end=code.indexOf('\n   });',start);
 assert.ok(start>=marker.length&&end>start);
 let now=0;const listeners=new Map(),pulses=[];
 const window={addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},despacho:{getAgentState:()=>({position:[7,-6.25]}),camera:{position:{x:7,y:1.65,z:-4.3,set(x,y,z){Object.assign(this,{x,y,z});}}}}};
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const KeyboardEvent=function(type,options){Object.assign(this,{type},options);};
 vm.runInNewContext(code.slice(start,end),{window,Date:Clock,KeyboardEvent,document:{hidden:false,activeElement:{id:'scene'}},performance:{now:()=>now},setInterval(fn,ms){pulses.push({fn,ms});return pulses.length;}});
 return {window,pulses,advance(ms){now+=ms;for(const pulse of pulses)pulse.fn();}};
}
test('panorama fixture records encounter distance at callback time, before later camera movement',async()=>{
 const f=panoramaFixture(),w=f.window;
 await w.YodVoiceWorkspace.openForCase('synthetic-office','ppp',{encounter:true});
 w.despacho.camera.position.z=10;
 assert.ok(Math.abs(w.__voiceStarts[0].distance-1.95)<1e-10,'the recorded encounter does not reread a later camera position');
 assert.deepEqual(Array.from(w.__voiceStarts[0].agent_position),[7,-6.25]);
});
test('geometry fixture maintains its synthetic observation beyond the real expiry without changing production TTL',async()=>{
 const {autonResidence}=await import('../despacho3d/resident-motion.mjs');
 const f=panoramaFixture();let reading;
 f.window.YodRoomWork.subscribe(value=>reading=value[0]);
 const initial=reading;
 assert.equal(autonResidence(initial.auton_status,'synthetic-office',90001).destination,'unconfirmed','the real expiry remains enforced');
 f.advance(90001);
 assert.equal(autonResidence(reading.auton_status,'synthetic-office',90001).destination,'inicio','the fixture emits a fresh observation for its unchanged working state');
 assert.ok(f.pulses.some(p=>p.ms<=5000));
});
test('radial appearance releases the fixture walking key synchronously instead of waiting for a driver roundtrip',()=>{
 const f=panoramaFixture(),events=[];f.window.addEventListener('keyup',event=>events.push(event.key));
 f.window.__stopAtRadial=true;
 f.window.dispatchEvent({type:'yod-agent-menu-open',detail:{case_id:'synthetic-office'}});
 assert.deepEqual(events,['w']);assert.equal(f.window.__stopAtRadial,false);
 f.window.dispatchEvent({type:'yod-agent-menu-open',detail:{case_id:'synthetic-office'}});
 assert.deepEqual(events,['w'],'ordinary later opens do not release unrelated input');
});

function actualWalking(camera,yaw,allowed){
 const vm=require('node:vm'),code=fs.readFileSync(path.join(base,'office.js'),'utf8');
 const start=code.indexOf('function movement(dt){'),end=code.indexOf('\nlet nearbyFlight=',start);
 assert.ok(start>=0&&end>start);
 return vm.runInNewContext(code.slice(start,end)+';movement',{camera,yaw,allowed,keys:new Set(['w']),stick:{x:0,y:0}});
}
test('panorama approach follows a collision-free lateral corridor using production walking',async()=>{
 const {allowed}=await import('../despacho3d/office-layout.mjs');
 const {createEncounterGate}=await import('../despacho3d/agent-proximity.mjs');
 const trapped={position:{x:7,z:-6.25+2.7}},blockedWalk=actualWalking(trapped,0,allowed);
 assert.equal(allowed(trapped.position.x,trapped.position.z),false,'the former approach starts inside the partition');
 for(let frame=0;frame<100;frame++)blockedWalk(.1);
 assert.equal(trapped.position.z,-6.25+2.7,'production collision checks reproduce the immobile camera');
 const f=panoramaFixture(),[T]=await modules,camera=new T.PerspectiveCamera();f.window.despacho.camera=camera;f.window.__placeApproach(2.7);
 // Execute the real pointer handler and movement together: the gesture must turn
 // private yaw as well as the visible camera before W can follow this corridor.
 const vm=require('node:vm'),code=fs.readFileSync(path.join(base,'office.js'),'utf8'),handlers={};
 const moveStart=code.indexOf('function movement(dt){'),moveEnd=code.indexOf('\nlet nearbyFlight=',moveStart);
 const turnStart=code.indexOf("renderer.domElement.addEventListener('pointermove',"),turnEnd=code.indexOf('\nfunction release',turnStart);
 const walk=vm.runInNewContext(code.slice(moveStart,moveEnd)+';'+code.slice(turnStart,turnEnd)+';movement',{camera,yaw:0,pitch:0,allowed,T,keys:new Set(['w']),stick:{x:0,y:0},mode:'walk',look:{id:1,x:0,y:0},sheet:null,dirty:false,renderer:{domElement:{addEventListener(type,fn){handlers[type]=fn;}}}});
 handlers.pointermove({pointerId:1,clientX:-Math.PI/2/.0036,clientY:0});
 assert.ok(Math.abs(camera.rotation.y-Math.PI/2)<1e-10);
 const gate=createEncounterGate();
 assert.equal(allowed(camera.position.x,camera.position.z),true);
 let menuDistance=null;
 for(let frame=0;frame<20;frame++){
  const distance=Math.hypot(camera.position.x-7,camera.position.z+6.25);
  const hit=gate.sample({caseId:'synthetic-office',distance,enabled:true,visible:true,facing:true,moving:frame>0,approaching:true,now:frame*100});
  if(hit==='menu'){menuDistance=distance;break;}
  walk(.1);assert.equal(allowed(camera.position.x,camera.position.z),true);
 }
 assert.ok(menuDistance>2&&menuDistance<=2.6,'real W movement enters the radial zone before the voice zone: '+menuDistance);
 f.window.__placeApproach(1.95);
 assert.equal(allowed(camera.position.x,camera.position.z),true);
 assert.ok(Math.abs(Math.hypot(camera.position.x-7,camera.position.z+6.25)-1.95)<1e-10);
});
test('fixture preparation records the real release and fresh preparation used to reset a dismissed encounter',async()=>{
 const {createPreparationGate,createEncounterGate}=await import('../despacho3d/agent-proximity.mjs');
 const f=panoramaFixture(),voice=f.window.YodVoiceWorkspace,preparation=createPreparationGate(),encounter=createEncounterGate();
 const sample=(distance,now)=>{
  const params={caseId:'synthetic-office',distance,enabled:true,now};
  const hit=preparation.sample(params);
  if(hit==='prepare')voice.prepareNearby(params.caseId);if(hit==='release')voice.releaseNearby();
  return encounter.sample({...params,visible:true,moving:true});
 };
 assert.equal(sample(2.5,0),'menu');encounter.dismiss('synthetic-office');
 assert.equal(sample(2.5,100),null,'reapproaching inside the leave radius is still suppressed');
 sample(13,200);assert.equal(f.window.__nearbyPrepared,false);
 sample(9.75,300);assert.equal(f.window.__nearbyPrepared,true);
 assert.equal(sample(2.5,400),'menu','the fresh preparation follows a real sample outside the leave radius');
});
