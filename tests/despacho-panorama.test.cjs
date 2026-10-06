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
