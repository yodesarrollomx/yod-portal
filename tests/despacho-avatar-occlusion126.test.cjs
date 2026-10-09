const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../despacho3d'),vendor=pathToFileURL(path.join(base,'vendor/three.module.js')).href;
const cache=new Map();function url(file){if(cache.has(file))return cache.get(file);const source=fs.readFileSync(file,'utf8').replace(/from 'three'/g,`from '${vendor}'`).replace(/from '(\.\/[^']+)'/g,(_,r)=>`from '${url(path.resolve(path.dirname(file),r.split('?')[0]))}'`);const value='data:text/javascript;base64,'+Buffer.from(source).toString('base64');cache.set(file,value);return value;}
const modules=Promise.all([import(vendor),import(url(path.join(base,'avatar-hud.mjs')))]);
test('head marker occlusion follows parallel orthographic image rays at both edges',async()=>{const [T,{setAvatarOcclusionRay}]=await modules,camera=new T.OrthographicCamera(-10,10,8,-8,.1,100);camera.position.set(0,10,20);camera.lookAt(0,1,0);camera.updateMatrixWorld(true);const forward=camera.getWorldDirection(new T.Vector3());for(const x of [-8,0,8]){const head=new T.Vector3(x,1.8,0),ndc=head.clone().project(camera),ray=setAvatarOcclusionRay(new T.Raycaster(),camera,head,ndc);assert.ok(ray.ray.direction.dot(forward)>.999999);assert.ok(ray.ray.distanceToPoint(head)<1e-8);assert.ok(Math.abs(ray.far-(ray.ray.origin.distanceTo(head)-.15))<1e-8);}});
test('walking camera ray passes through the projected head and ends before its surface',async()=>{const [T,{setAvatarOcclusionRay}]=await modules,camera=new T.PerspectiveCamera(60,1.5,.1,100);camera.position.set(1,1.7,5);camera.lookAt(0,1.4,0);camera.updateMatrixWorld(true);const head=new T.Vector3(-1,1.8,0),ray=setAvatarOcclusionRay(new T.Raycaster(),camera,head,head.clone().project(camera));assert.ok(ray.ray.distanceToPoint(head)<1e-8);assert.ok(ray.far>0);assert.ok(ray.far<ray.ray.origin.distanceTo(head));});

function mockDocument(){
 const node=tag=>({tag,children:[],attributes:{},namespaceURI:'http://www.w3.org/2000/svg',hidden:false,offsetWidth:178,offsetHeight:69,style:{setProperty(){}},dataset:{},
  append(...values){for(const value of values){value.parent=this;this.children.push(value);}},
  replaceChildren(...values){this.children=[];this.append(...values);},
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);},
  setAttribute(k,v){this.attributes[k]=String(v);},getAttribute(k){return this.attributes[k];}
 });return {createElement:node,createElementNS:(_ns,tag)=>node(tag)};
}
test('HUD hides both displaced-label connector and card when their world anchor becomes occluded',async()=>{
 const [T,{createAvatarHUD}]=await modules,doc=mockDocument(),container=doc.createElement('div');container.clientWidth=1000;container.clientHeight=700;
 const camera=new T.OrthographicCamera(-5,5,3.5,-3.5,.1,50);camera.position.set(0,2,10);camera.lookAt(0,1.8,0);camera.updateMatrixWorld(true);
 const residents=['one','two'].map((id,i)=>({profile:{id,case_id:id,entity_kind:'case',name:id},anchor:[i*.1,1.8,0]}));
 const hud=createAvatarHUD({container,doc,now:()=>1000});hud.update({residents,camera,selectedCaseId:'one',time:1000});
 const layer=container.children[0],links=layer.children[0].children,buttons=layer.children.filter(n=>n.tag==='button');assert.equal(buttons.filter(b=>!b.hidden).length,2);assert.equal(links.filter(p=>p.getAttribute('visibility')==='visible').length,1);assert.equal(buttons.find(b=>b.dataset.caseId==='two').dataset.linked,'true');
 const wall=new T.Mesh(new T.BoxGeometry(30,30,.2),new T.MeshBasicMaterial());wall.position.z=5;wall.updateMatrixWorld(true);
 hud.update({residents,camera,occluder:wall,selectedCaseId:'one',time:1100});assert.ok(buttons.every(b=>b.hidden));assert.ok(links.every(p=>p.getAttribute('visibility')==='hidden'));
 hud.clear();assert.equal(layer.children.filter(n=>n.tag==='button').length,0);assert.equal(layer.children[0].children.length,0);hud.dispose();wall.geometry.dispose();wall.material.dispose();
});
