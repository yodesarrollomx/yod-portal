const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../despacho3d'),vendor=pathToFileURL(path.join(base,'vendor/three.module.js')).href;
const cache=new Map();
function moduleURL(file){
 if(cache.has(file))return cache.get(file);
 let src=fs.readFileSync(file,'utf8').replace(/from 'three'/g,`from '${vendor}'`).replace(/from '(\.\.?\/[^']+)'/g,(_,relative)=>`from '${moduleURL(path.resolve(path.dirname(file),relative.split('?')[0]))}'`);
 const url='data:text/javascript;base64,'+Buffer.from(src).toString('base64');cache.set(file,url);return url;
}
const modules=Promise.all([import(vendor),import(moduleURL(path.join(base,'avatars/office-pilot.mjs')))]);
const profile={id:'CASE-EXAMPLE',case_id:'CASE-EXAMPLE',entity_kind:'case',name:'Caso de ejemplo',form:'child',color:'#547e75',visual:{hairStyle:'crop'}};
function panel(initial=profile){
 let value=initial,listener=null;const opened=[];let stops=0;
 return {opened,get stops(){return stops;},getProfile:()=>value,openForCase:id=>{if(id===value?.case_id)opened.push(id);},subscribeProfile(fn){listener=fn;fn(value);return()=>{stops++;listener=null;};},publish(next){value=next;listener?.(next);},callback:()=>listener,revokeSilently(){value=null;}};
}
test('the pilot stays empty until authorized and ignores placement supplied by a profile',async()=>{
 const[T,{createOfficePilot}]=await modules,scene=new T.Scene(),p=createOfficePilot({scene});
 p.bind(panel(null));assert.equal(p.getState().count,0);
 const api=panel({...profile,placement:{position:[100,100,100],scale:999,rotationY:0}});p.bind(api);
 assert.deepEqual(p.getState(),{count:1,motion:'sit',poseTicks:0});assert.deepEqual(scene.children[0].position.toArray(),[7,0,-6.25]);assert.equal(scene.children[0].rotation.y,Math.PI);
 const first=scene.children[0];api.publish({...profile});assert.equal(scene.children[0],first,'unchanged profile must not allocate another model');
 api.publish({...profile,id:'DIFFERENT'});assert.equal(scene.children.length,0,'mismatched identity fails closed');p.dispose();
});
test('mesh selection uses the current authorization and releases the figure when revoked',async()=>{
 const[T,{createOfficePilot}]=await modules,scene=new T.Scene(),api=panel();let before=0;
 const p=createOfficePilot({scene,beforeOpen:()=>before++});p.bind(api);
 let mesh;scene.children[0].traverse(o=>{if(!mesh&&o.isMesh)mesh=o;});
 p.selectIntersection({object:mesh});assert.deepEqual(api.opened,['CASE-EXAMPLE']);assert.equal(before,1);
 api.revokeSilently();p.selectIntersection({object:mesh});assert.equal(api.opened.length,1);assert.equal(scene.children.length,0);
 assert.equal(p.selectIntersection({object:mesh}),false);assert.deepEqual(mesh.userData,{});p.dispose();
});
test('disconnect drops subscription and geometry, and late callbacks cannot restore a profile',async()=>{
 const[T,{createOfficePilot}]=await modules,scene=new T.Scene(),api=panel(),p=createOfficePilot({scene});p.bind(api);
 const stale=api.callback();let released=0;scene.children[0].traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>released++);});
 p.disconnect();assert.equal(api.stops,1);assert.equal(scene.children.length,0);assert.ok(released>20);
 stale(profile);assert.equal(scene.children.length,0);
 const next=panel({...profile,id:'OTHER-CASE',case_id:'OTHER-CASE'});p.bind(next);stale(profile);
 assert.equal(scene.children[0].userData.caseId,'OTHER-CASE');p.dispose();assert.equal(next.stops,1);
});
test('idle animation is capped at fifteen updates and pauses for overlays, visibility and motion preference',async()=>{
 const[T,{createOfficePilot}]=await modules,scene=new T.Scene(),p=createOfficePilot({scene});p.bind(panel());let updates=0;
 for(let t=0;t<=1000;t+=10)if(p.update(t))updates++;
 assert.ok(updates>=12&&updates<=15,`expected 12–15 updates, got ${updates}`);
 const pose=scene.children[0].userData.body.position.y;
 for(const flags of [{overlay:true},{hidden:true},{reducedMotion:true}])for(const t of [1100,2100,3100])assert.equal(p.update(t,flags),false);
 assert.equal(scene.children[0].userData.body.position.y,pose);
 assert.equal(p.update(50000),false,'resume rebases time instead of making a large jump');assert.equal(p.update(50080),true);
 assert.deepEqual(p.getState(),{count:1,motion:'sit',poseTicks:updates+1});p.dispose();
});
test('office picking respects opaque geometry and nearer controls while its case box cannot swallow the avatar',async()=>{
 const[,{chooseOfficeHit}]=await modules;
 const avatarHit={distance:5,object:{}},solid=distance=>({distance,object:{material:{transparent:false,visible:true}}});
 assert.equal(chooseOfficeHit({avatarHit,boxHits:[{id:'case',d:4}],sceneHits:[solid(8)]}).type,'avatar');
 assert.equal(chooseOfficeHit({avatarHit,sceneHits:[solid(3)]}),null);
 assert.deepEqual(chooseOfficeHit({avatarHit,boxHits:[{id:'patio',d:3}],sceneHits:[solid(8)]}),{type:'panel',id:'patio'});
 assert.equal(chooseOfficeHit({avatarHit,sceneHits:[{distance:2,object:{material:{transparent:true,opacity:.1}}},solid(8)]}).type,'avatar');
 assert.equal(chooseOfficeHit({boxHits:[{id:'case',d:7}],sceneHits:[solid(3)]}),null);
});
test('omitting the provisional figure before static merging retains the office layout and removes its geometry',async()=>{
 const[T]=await modules;const previous=global.document;
 global.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='measureText'?()=>({width:100}):String(key).includes('Gradient')?()=>({addColorStop(){}}):()=>{}})}),createElementNS(){const listeners={};return {addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name],set src(value){queueMicrotask(()=>listeners.error?.call(this,{}));}};}};
 try{
  const {createOffice}=await import(moduleURL(path.join(base,'scene.js')));
  const inspect=async options=>{
   const office=await createOffice(options);office.model.updateMatrixWorld(true);
   const ray=new T.Raycaster(new T.Vector3(6.65,1.41,-4.1),new T.Vector3(0,0,-1));
   const hit=ray.intersectObject(office.model,true)[0];let triangles=0;
   office.model.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.geometry.dispose();}});
   return {triangles,distance:hit?.distance??Infinity,collisions:office.collisions,pickBoxes:office.pickBoxes,bounds:office.bounds};
  };
  const prior=await inspect({pilotFigure:true}),current=await inspect({pilotFigure:false});
  assert.ok(current.triangles<prior.triangles,'the omitted body must not remain inside merged geometry');
  assert.ok(current.distance>prior.distance+.2,`the original head must no longer intercept its location (${prior.distance} vs ${current.distance})`);
  assert.deepEqual(current.collisions,prior.collisions);assert.deepEqual(current.pickBoxes,prior.pickBoxes);assert.deepEqual(current.bounds,prior.bounds);
 }finally{global.document=previous;}
});

test('seated figure faces the visible monitor and returns to its shared chair position',async()=>{
 const[T,{createOfficePilot}]=await modules,scene=new T.Scene(),p=createOfficePilot({scene});p.bind(panel());
 const figure=scene.children[0],screen=new T.Vector3(7,1.23,-7.2);
 assert.ok(figure.position.z>screen.z,'chair must be on the visible side of the monitor');
 const facing=new T.Vector3(0,0,1).applyQuaternion(figure.quaternion);
 const toward=screen.clone().sub(figure.position);toward.y=0;toward.normalize();
 assert.ok(facing.dot(toward)>.99,'face, knees and gaze point toward the monitor');
 p.recorrer([[7,-6.25],[8,-5]],0,{inmediato:true,destino:'other'});
 p.recorrer([[8,-5],p.inicio.xz],p.inicio.rot,{inmediato:true,destino:'inicio'});
 assert.deepEqual(figure.position.toArray(),[7,0,-6.25]);assert.equal(figure.rotation.y,Math.PI);
 p.dispose();
});

test('scaled figures contact the chair and remain seated while talking',async()=>{
 const [T,{createOfficePilot}]=await modules;
 for(const form of ['child','young','adult','robot']){
  const scene=new T.Scene(),p=createOfficePilot({scene});p.bind(panel({...profile,form}));
  const root=scene.children[0],body=root.userData.body,leg=root.userData.legs[0];
  assert.ok(Math.abs(body.position.y+.50*body.scale.y-.62)<.001,'seat contact '+form);
  assert.equal(leg.rotation.x,-Math.PI/2);
  const seatedY=body.position.y,rotation=root.rotation.y;
  p.setActivity('talk');p.update(0);p.update(100);
  assert.equal(body.position.y,seatedY);assert.equal(leg.rotation.x,-Math.PI/2);
  assert.equal(root.rotation.y,rotation);assert.equal(root.userData.base.visible,false);
  p.dispose();
 }
});
