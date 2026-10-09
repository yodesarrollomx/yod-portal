import * as T from 'three';

// Procedural office representation. Nothing here authorizes or executes a task.
export const OFFICE_HUMAN_FORMS=new Set(['child','child_female','young_female','young_male','woman','man','tool','visitor']);
export const OFFICE_AVATAR_BUDGET=Object.freeze({maxMeshes:40,maxTriangles:5000,textureBytes:0});
const skins=['#ce9672','#e8b78c','#b77c58','#f1c7a5','#a56b4b'],hairs=['#29262a','#473326','#634936','#302b35','#79604d'];
const hash=s=>[...String(s)].reduce((h,c)=>((h*31+c.charCodeAt(0))>>>0),17);
const safe=(v,f)=>/^#[\da-f]{6}$/i.test(v||'')?v:f;
export function createOfficeHuman(form,color,name,options={}){
 const seed=hash(options.seed||name||form),root=new T.Group(),body=new T.Group();root.add(body);root.name='avatar';body.name='body';
 const sphere=new T.SphereGeometry(1,12,8),box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,12);
 const materials=new Map(),mat=(c,roughness=.86)=>{const key=c+':'+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness,metalness:0}));return materials.get(key);};
 const skin=mat(safe(options.skin,skins[seed%skins.length])),hair=mat(safe(options.hair,hairs[(seed>>>3)%hairs.length]));
 const cloth=mat(safe(color,'#57827d')),trouser=mat('#29373b'),shirt=mat('#e8e5db'),shoe=mat('#282d2b'),ink=mat('#303032');
 const accent=mat(safe(options.accent,'#c4a777')),arms=[],legs=[],eyes=[],joints={};let serial=0;
 function mesh(geometry,material,scale,position,parent=body){const o=new T.Mesh(geometry,material);o.scale.set(...scale);o.position.set(...position);o.castShadow=true;o.receiveShadow=true;o.name='office_part_'+serial++;parent.add(o);return o;}
 const oval=(m,s,p,parent)=>mesh(sphere,m,s,p,parent),block=(m,s,p,parent)=>mesh(box,m,s,p,parent);
 function joint(key,position,parent=body){const o=new T.Group();o.name=key;o.position.set(...position);parent.add(o);joints[key]=o;return o;}
 // Height 1.80 m, head about one seventh of the figure; clothes carry the identity color.
 const torso=mesh(new T.CylinderGeometry(.178,.205,.48,12),cloth,[1,1,.68],[0,1.185,0]);
 oval(trouser,[.183,.11,.125],[0,.91,0]);
 block(shirt,[.126,.395,.016],[0,1.21,.128]);
 for(const side of [-1,1]){const lapel=block(cloth,[.072,.30,.023],[side*.083,1.255,.146]);lapel.rotation.z=side*-.20;const collar=block(shirt,[.065,.045,.025],[side*.044,1.397,.098]);collar.rotation.z=side*.4;}
 mesh(cylinder,skin,[.061,.104,.060],[0,1.44,0]);
 const head=joint('head',[0,1.602,0]);oval(skin,[.149,.187,.141],[0,0,0],head);
 const style=options.hairStyle||'swept';
 oval(hair,[.156,.106,.149],[0,.102,-.016],head);
 if(['bob','waves','bun'].includes(style))oval(hair,[.157,.159,.092],[0,.008,-.104],head);
 if(style==='bun')oval(hair,[.075,.079,.073],[0,.131,-.162],head);
 else {const sweep=oval(hair,[.123,.047,.097],[-.026,.156,.071],head);sweep.rotation.z=-.18;}
 for(const side of [-1,1]){
  const eye=joint('eye_'+(side<0?'left':'right'),[side*.052,.019,.132],head);eyes.push(eye);oval(ink,[.010,.008,.004],[0,0,0],eye);
  const brow=block(hair,[.036,.007,.007],[side*.052,.042,.133],head);brow.rotation.z=side*-.08;
 }
 oval(skin,[.019,.031,.025],[0,-.023,.138],head);
 joints.mouth=block(ink,[.044,.006,.007],[0,-.076,.124],head);
 // Working clothes have clean sleeves and straight trousers. No decorative tool implies real activity.
 for(const side of [-1,1]){
  const arm=joint('arm_'+(side<0?'left':'right'),[side*.229,1.369,0]);arms.push(arm);arm.rotation.z=-side*.06;
  oval(cloth,[.078,.155,.076],[0,-.14,0],arm);
  const elbow=joint('elbow_'+side,[0,-.278,0],arm);oval(cloth,[.062,.135,.063],[0,-.12,0],elbow);
  const hand=joint('hand_'+side,[0,-.27,.014],elbow);oval(skin,[.048,.076,.028],[0,-.018,0],hand);
  const leg=joint('leg_'+(side<0?'left':'right'),[side*.098,.92,0]);legs.push(leg);oval(trouser,[.09,.228,.10],[0,-.20,0],leg);
  const knee=joint('knee_'+side,[0,-.42,0],leg);oval(trouser,[.074,.20,.079],[0,-.178,0],knee);
  oval(shoe,[.083,.060,.153],[0,-.429,.071],knee);
 }
 // A small lapel mark is a visual identity cue, never a rank or performance score.
 block(accent,[.018,.043,.012],[.121,1.315,.139]);
 const base=mesh(cylinder,mat('#c7c6b5'),[.28,.013,.28],[0,.005,0],root);base.castShadow=false;
 const child=form.startsWith('child'),young=form.startsWith('young');body.scale.setScalar(child?.78:young?.96:1);
 root.userData={form,body,arms,legs,eyes,joints,base,version:'4.0.0',seed,options:{...options},officeHuman:true,seatContact:.82,headClearance:.27,female:['woman','young_female','child_female'].includes(form)||options.presentation==='feminine'};
 root.userData.baseTransforms=new Map();body.traverse(o=>{if(o.isGroup)root.userData.baseTransforms.set(o,{position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()});});
 root.updateMatrixWorld(true);return root;
}
export function animateOfficeHuman(root,time,walking=false,seated=false,action='idle'){
 const {body,arms,legs,eyes,joints,base,seed,baseTransforms,seatContact}=root.userData;
 baseTransforms.forEach((v,o)=>{o.position.copy(v.position);o.rotation.copy(v.rotation);o.scale.copy(v.scale);});joints.mouth.scale.y=1;base.visible=false;
 const phase=time*7.5;
 if(seated){
  // Rotated thigh underside: hip 0.92 minus radius 0.10; chair top remains 0.62 m.
  body.position.y=.62-seatContact*body.scale.y;legs.forEach(l=>l.rotation.x=-Math.PI/2);
  for(const key of ['knee_-1','knee_1'])joints[key].rotation.x=Math.PI/2;
  arms.forEach(a=>a.rotation.x=-.45);for(const key of ['elbow_-1','elbow_1'])joints[key].rotation.x=-1.15;
 }else if(walking){
  body.position.y=Math.abs(Math.sin(phase))*.012;legs.forEach((l,i)=>l.rotation.x=Math.sin(phase+i*Math.PI)*.36);arms.forEach((a,i)=>a.rotation.x=-Math.sin(phase+i*Math.PI)*.24);
  for(const [i,key]of ['knee_-1','knee_1'].entries())joints[key].rotation.x=Math.max(0,-Math.sin(phase+i*Math.PI))*.40;
 }else{body.position.y=Math.sin(time*1.4)*.002;joints.head.rotation.y=Math.sin(time*.4)*.015;}
 const b=(time+(seed%71)/17)%4.6;eyes.forEach(e=>e.scale.y=b<.12?Math.max(.15,Math.abs(b-.06)/.06):1);
 if(action==='talk'){joints.mouth.scale.y=1+Math.abs(Math.sin(time*8))*.8;joints.head.rotation.x=Math.sin(time*2.2)*.018;}
 if(action==='wave'){arms[1].rotation.z=-2.1;arms[1].rotation.x=Math.sin(time*5)*.13;}
 if(action==='deliver')arms[1].rotation.x=-1.05;root.updateMatrixWorld(true);
}
