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
 const window={addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},despacho:{getAgentState:()=>({position:[7,-6.25]}),camera:{position:{x:7,z:-4.3}}}};
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const KeyboardEvent=function(type,options){Object.assign(this,{type},options);};
 vm.runInNewContext(code.slice(start,end),{window,Date:Clock,KeyboardEvent,setInterval(fn,ms){pulses.push({fn,ms});return pulses.length;}});
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
