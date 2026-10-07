import * as T from 'three';

export const AVATAR_VERSION='3.0.0';
export const FORMS={child:'Infancia · primer acercamiento',child_female:'Infancia · vivienda',young_female:'Joven · línea femenina',young_male:'Joven · línea masculina',woman:'Mujer · casa en obra',man:'Hombre · desarrollo / torre',robot:'Robot · codesarrollo',spirit:'Alma · proyecto',deity:'Deidad · equipo',tool:'Agente · herramienta',visitor:'Colaborador · visitante'};
const skins=['#ce9672','#e8b78c','#b77c58','#f1c7a5','#a56b4b'],hairs=['#2b2225','#473326','#6b4934','#302b35','#966743'];
const hash=s=>[...String(s)].reduce((h,c)=>((h*31+c.charCodeAt(0))>>>0),17);
const col=(s,f=1)=>new T.Color(s).multiplyScalar(f);
const colorOr=(x,fallback)=>/^#[\da-f]{6}$/i.test(x||'')?x:fallback;

// Drawing only: identity, permissions and memory remain with the caller.
export function createAvatar(form,color='#57827d',name='',options={}){
 form=Object.hasOwn(FORMS,form)?form:'visitor';color=colorOr(color,'#57827d');
 const seed=hash(options.seed||name||form),detail=options.quality==='office'?16:24;
 const root=new T.Group(),body=new T.Group();root.add(body);root.name='avatar';body.name='body';
 const female=['woman','young_female','child_female'].includes(form)||options.presentation==='feminine';
 const child=form.startsWith('child'),young=form.startsWith('young'),robot=form==='robot',spirit=form==='spirit',deity=form==='deity',tool=form==='tool';
 const myth=options.myth||'guardian',role=options.role||'studio',hairStyle=options.hairStyle||(female?['bob','waves','bun'][seed%3]:['swept','curly','crop'][seed%3]);
 const eyes=[],arms=[],legs=[],joints={};let serial=0;
 const material=(c,props={})=>new T.MeshStandardMaterial({color:c,roughness:.62,metalness:0,...props});
 const skin=material(colorOr(options.skin,skins[seed%skins.length])),hair=material(colorOr(options.hair,hairs[(seed>>>3)%hairs.length]),{roughness:.8});
 const cloth=material(color),clothShade=material(col(color,.73)),trim=material(colorOr(options.accent,'#f3dca7'));
 const cream=material('#fff2d8'),dark=material('#293d46'),white=material('#fffef3',{roughness:.24}),pupil=material('#142733',{roughness:.23});
 const iris=material(colorOr(options.iris,['#56726a','#617c93','#936437'][seed%3]),{roughness:.25});
 const blush=material('#d98779',{transparent:true,opacity:.22,depthWrite:false});
 const gold=material('#d3a857',{metalness:.58,roughness:.3}),lightGold=material('#f3cb7e',{metalness:.32,roughness:.4});
 const glowColor=colorOr(options.glow,'#7bded4'),glow=material(glowColor,{emissive:glowColor,emissiveIntensity:.5,roughness:.23});
 function mesh(g,m,x=0,y=0,z=0,parent=body){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;o.name='part_'+serial++;parent.add(o);return o;}
 function orb(rx,ry,rz,m,x,y,z,parent=body){const o=mesh(new T.SphereGeometry(1,detail,Math.max(10,detail*.65|0)),m,x,y,z,parent);o.scale.set(rx,ry,rz);return o;}
 function round(w,h,d,r,m,x,y,z,parent=body){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const iw=w-2*r,ih=h-2*r;const shape=new T.Shape();shape.moveTo(-iw/2,-ih/2);shape.lineTo(iw/2,-ih/2);shape.lineTo(iw/2,ih/2);shape.lineTo(-iw/2,ih/2);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:8});g.translate(0,0,-(d-2*r)/2);g.computeVertexNormals();return mesh(g,m,x,y,z,parent);}
 function tube(points,r,m,parent=body,segments=20){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,6,false),m,0,0,0,parent);}
 function cyl(rt,rb,h,m,x,y,z,parent=body,n=detail){return mesh(new T.CylinderGeometry(rt,rb,h,n),m,x,y,z,parent);}
 function ring(radius,t,m,x,y,z,parent=body){return mesh(new T.TorusGeometry(radius,t,8,detail*2),m,x,y,z,parent);}
 function group(key,x,y,z,parent=body){const g=new T.Group();g.position.set(x,y,z);g.name=key;parent.add(g);joints[key]=g;return g;}
 function emblem(m,x,y,z,style='star',parent=body,size=.055){const plate=cyl(size,size,.018,gold,x,y,z,parent);plate.rotation.x=Math.PI/2;if(style==='star'){for(let i=0;i<4;i++){const o=round(.014,size*1.6,.016,.004,m,x,y,z+.015,parent);o.rotation.z=i*Math.PI/4;}}else if(style==='bars'){for(let i=-1;i<=1;i++)round(.014,size*(1+i*.22),.014,.003,m,x+i*.025,y,z+.015,parent);}else ring(size*.6,.008,m,x,y,z+.015,parent);}
 function face(head,{y=0,z=.27,width=.122,robotic=false}={}){
  for(const side of [-1,1]){
   const e=group('eye_'+(side<0?'left':'right'),side*width,y+.018,z,head);eyes.push(e);
   orb(.092,.115,.052,robotic?glow:white,0,0,0,e);orb(.052,.072,.033,iris,side*.009,-.008,.037,e);orb(.029,.044,.025,pupil,side*.009,-.004,.060,e);
   orb(.017,.021,.012,white,side*.009-.015,.029,.079,e);orb(.007,.009,.009,white,side*.009+.019,-.023,.078,e);
   tube([[side*width-.08,y+.155,z-.01],[side*width,y+.179,z+.015],[side*width+.08,y+.147,z-.005]],.018,robotic?dark:hair,head,12);
   if(!robotic){orb(.054,.03,.008,blush,side*.214,y-.072,z-.025,head);orb(.062,.075,.045,skin,side*.31,y,.008,head);orb(.031,.044,.012,blush,side*.34,y,.043,head);}
  }
  if(!robotic)orb(.046,.054,.053,skin,0,y-.045,z+.032,head);
  const mouth=tube([[-.062,y-.122,z-.002],[0,y-.140,z+.018],[.062,y-.115,z+.005]],.012,robotic?glow:dark,head,14);mouth.name='smile';joints.mouth=mouth;
  if(!robotic)orb(.038,.011,.011,white,0,y-.127,z+.021,head);
 }
 function humanHead(){
  const head=group('head',0,1.68,0);orb(.305,.335,.277,skin,0,0,0,head);face(head);
  if(['bob','waves','bun'].includes(hairStyle)){
   orb(.318,.265,.255,hair,0,.085,-.075,head);for(const side of [-1,1])orb(.105,hairStyle==='waves'?.30:.24,.15,hair,side*.256,-.02,-.024,head);
   if(hairStyle==='bun')orb(.135,.14,.13,hair,.03,.25,-.225,head);
   if(hairStyle==='waves')for(const side of [-1,1])for(let i=0;i<3;i++)orb(.10,.115,.085,hair,side*(.255+i*.009),.04-i*.12,-.035,head);
  }else orb(.305,.168,.265,hair,0,.203,-.027,head);
  if(hairStyle==='curly')for(let i=0;i<9;i++){const a=i/9*Math.PI*2;orb(.095,.09,.097,hair,Math.cos(a)*.22,.245+(i%3)*.02,Math.sin(a)*.13-.015,head);}
  else for(let i=0;i<5;i++){const o=orb(.107,.065,.085,hair,-.208+i*.091,.217+(4-i)*.014,.175-i*.008,head);o.rotation.z=-.23;}
  if(options.beard){orb(.20,.09,.045,hair,0,-.218,.15,head);for(const side of [-1,1])orb(.04,.065,.05,hair,side*.182,-.148,.184,head);}
  if(options.glasses){for(const side of [-1,1])ring(.108,.013,gold,side*.125,.012,.329,head).scale.y=.88;tube([[-.018,.014,.337],[0,.035,.342],[.018,.014,.337]],.01,gold,head,8);}
  return head;
 }
 function limbs(robotic=false){
  for(const side of [-1,1]){
   const arm=group('arm_'+(side<0?'left':'right'),side*.287,1.25,0);arms.push(arm);arm.rotation.z=-side*.06;orb(.111,.17,.112,robotic?cream:cloth,0,-.09,0,arm);
   const elbow=group('elbow_'+side,0,-.235,0,arm);orb(.077,.144,.082,robotic?dark:skin,0,-.08,.007,elbow);
   if(robotic)ring(.07,.015,gold,0,-.21,.018,elbow).rotation.x=Math.PI/2;else cyl(.075,.077,.047,trim,0,-.04,.007,elbow);
   const hand=group('hand_'+side,0,-.219,.019,elbow);orb(.079,.084,.052,robotic?gold:skin,0,-.014,0,hand);orb(.031,.05,.028,robotic?gold:skin,-side*.07,.002,.012,hand);
   for(let i=0;i<3;i++)tube([[-.043+i*.031,-.045,.047],[-.04+i*.031,-.062,.043]],.004,robotic?dark:blush,hand,2);
   const leg=group('leg_'+(side<0?'left':'right'),side*.13,.615,0);legs.push(leg);if(robotic)round(.178,.30,.21,.06,cream,0,-.125,0,leg);else orb(.103,.187,.112,dark,0,-.125,0,leg);
   const knee=group('knee_'+side,0,-.282,0,leg);if(robotic)round(.16,.255,.185,.045,cloth,0,-.109,0,knee);else orb(.09,.15,.102,dark,0,-.109,0,knee);if(robotic)orb(.077,.078,.035,gold,0,.005,.116,knee);
   orb(.108,.077,.173,robotic?dark:clothShade,0,-.267,.053,knee);round(.221,.038,.33,.014,cream,0,-.312,.050,knee);
   for(let i=0;i<3;i++)round(.10,.012,.01,.003,trim,0,-.237-i*.011,.188,knee);
  }
 }
 function tablet(parent,side=1){const pad=round(.24,.31,.033,.025,dark,side*.10,-.03,.05,parent);pad.rotation.z=-side*.14;round(.196,.245,.01,.009,glow,side*.10,-.025,.072,parent);for(let i=0;i<3;i++)round(.14,.012,.012,.004,cream,side*.10,.05-i*.035,.08,parent);}
 function feather(angle,radius,height,parent){const shape=new T.Shape();shape.moveTo(-.036,0);shape.quadraticCurveTo(-.09,height*.65,0,height);shape.quadraticCurveTo(.10,height*.58,.036,0);shape.closePath();const f=mesh(new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelThickness:.009,bevelSize:.009,bevelSegments:2,curveSegments:10}),Math.abs(angle)>.6?gold:cloth,Math.sin(angle)*radius,Math.cos(angle)*radius,0,parent);f.rotation.z=-angle;tube([[0,.04,.052],[0,height*.75,.052]],.006,lightGold,f,4);}
 if(spirit){
  const translucent=material(colorOr(options.glow,'#acdacf'),{roughness:.2,metalness:.08,transparent:true,opacity:.93});
  const pts=[[0,.42],[.045,.49],[.14,.60],[.235,.83],[.25,1],[.18,1.16],[0,1.20]].map(([x,y])=>new T.Vector2(x,y));mesh(new T.LatheGeometry(pts,detail*2),translucent);
  const head=group('head',0,1.40,0);orb(.27,.265,.25,cream,0,0,0,head);face(head,{width:.098,z:.237});
  for(const s of [-1,1]){const a=group('arm_'+s,s*.25,1,0);arms.push(a);orb(.078,.085,.13,translucent,0,0,0,a);}
  const halo=ring(.19,.019,gold,0,1.78,0);halo.rotation.x=Math.PI/2;halo.rotation.z=.2;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;orb(.018,.026,.018,glow,Math.cos(a)*.34,.7+i*.15,Math.sin(a)*.19);}emblem(glow,0,1.08,.23,'star',body,.052);
 }else if(robot){
  round(.51,.58,.32,.12,cream,0,1.03,0);round(.40,.37,.042,.055,cloth,0,1.07,.183);emblem(glow,0,1.085,.218,'star',body,.089);round(.37,.08,.035,.02,dark,0,.80,.181);
  const head=group('head',0,1.67,0);round(.65,.53,.43,.13,cream,0,0,0,head);round(.55,.315,.036,.07,dark,0,-.005,.238,head);face(head,{z:.27,width:.132,robotic:true,y:.015});
  for(const s of [-1,1]){cyl(.095,.095,.047,gold,s*.346,.015,0,head).rotation.z=Math.PI/2;orb(.03,.048,.047,glow,s*.371,.013,0,head);}
  cyl(.02,.02,.14,gold,0,.325,0,head);orb(.048,.055,.048,glow,0,.425,0,head);limbs(true);round(.39,.14,.27,.046,clothShade,0,.72,0);cyl(.08,.10,.115,dark,0,1.38,0);
  for(const s of [-1,1])for(let i=0;i<2;i++)orb(.017,.017,.01,gold,s*.215,.88+i*.30,.168);
 }else{
  const pts=[[0,.66],[.20,.69],[.245,.89],[.225,1.17],[.17,1.28],[.075,1.31],[0,1.31]].map(([x,y])=>new T.Vector2(x,y));mesh(new T.LatheGeometry(pts,detail*2),cloth).scale.z=.78;
  round(.35,.14,.265,.055,dark,0,.70,0);cyl(.085,.08,.17,skin,0,1.37,0);const collar=ring(.113,.029,cream,0,1.30,0);collar.rotation.x=Math.PI/2;collar.scale.y=.8;
  if(female){const skirt=mesh(new T.LatheGeometry([[.19,.82],[.23,.75],[.29,.64],[.30,.59]].map(([x,y])=>new T.Vector2(x,y)),detail*2),cloth);skirt.scale.z=.87;const edge=ring(.292,.016,trim,0,.606,0);edge.rotation.x=Math.PI/2;edge.scale.y=.88;}
  limbs();const head=humanHead();tube([[0,.78,.184],[0,1,.188],[0,1.24,.148]],.006,clothShade);if(!deity)for(let i=0;i<3;i++)orb(.014,.014,.009,gold,0,1.18-i*.105,.19);
  round(.093,.10,.017,.011,clothShade,.125,1.075,.177);tube([[.085,1.12,.192],[.164,1.12,.185]],.008,trim,body,8);
  if(tool){
   orb(.323,.162,.285,cloth,0,.239,-.025,head);cyl(.319,.315,.055,cloth,0,.19,-.022,head);orb(.27,.03,.18,clothShade,0,.185,.217,head);emblem(cream,0,.18,.242,'bars',head,.052);
   const strap=round(.055,.56,.033,.014,clothShade,-.17,1.04,.202);strap.rotation.z=-.26;round(.28,.26,.11,.035,clothShade,.265,.76,-.045);round(.23,.10,.12,.025,trim,.266,.86,-.044);emblem(cream,0,1.08,.211,options.icon||'bars',body,.065);
   if(role==='messenger'){const hand=joints['hand_1'],envelope=round(.30,.20,.025,.018,cream,.11,0,.06,hand);envelope.rotation.z=-.17;tube([[-.135,.075,.019],[0,-.015,.02],[.135,.075,.019]],.007,clothShade,envelope,10);}else tablet(joints['hand_1']);
  }else if(deity){
   const capeShape=new T.Shape();capeShape.moveTo(-.22,1.26);capeShape.bezierCurveTo(-.28,1,-.39,.64,-.32,.42);capeShape.quadraticCurveTo(0,.33,.32,.42);capeShape.bezierCurveTo(.39,.64,.28,1,.22,1.26);capeShape.closePath();
   mesh(new T.ExtrudeGeometry(capeShape,{depth:.023,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:16}),clothShade,0,0,-.17).rotation.x=.055;
   for(const s of [-1,1])orb(.138,.075,.133,gold,s*.24,1.26,0);const necklace=ring(.16,.031,gold,0,1.245,.009);necklace.rotation.x=Math.PI/2;necklace.scale.y=.84;emblem(glow,0,1.08,.219,'star',body,.073);cyl(.313,.303,.08,gold,0,.26,-.02,head);
   if(myth==='huitzilopochtli'){
    const crest=group('crest',0,.27,-.035,head);for(let i=-4;i<=4;i++)feather(i*.205,.085,.41-Math.abs(i)*.028,crest);
    orb(.054,.037,.028,glow,0,.295,.292,head);const beak=mesh(new T.ConeGeometry(.017,.16,10),gold,.074,.298,.291,head);beak.rotation.z=-Math.PI/2;orb(.085,.025,.019,glow,-.047,.328,.285,head).rotation.z=-.7;
    const shield=group('shield',0,-.025,.07,joints['hand_-1']);cyl(.155,.155,.038,gold,0,0,0,shield).rotation.x=Math.PI/2;emblem(cloth,0,0,.03,'star',shield,.105);
   }else{
    for(let i=0;i<7;i++){const a=(i-3)*.20;mesh(new T.ConeGeometry(.035,.09+(i%2)*.045,8),lightGold,Math.sin(a)*.29,.33,Math.cos(a)*.23-.02,head);}
    if(['athena','seshat'].includes(myth))emblem(glow,0,.39,.21,'star',head,.073);
    if(['themis','thoth','hermes'].includes(myth))tablet(joints['hand_1']);
    if(myth==='hephaestus'){const hand=joints['hand_1'];cyl(.022,.022,.29,gold,.05,.05,.06,hand);round(.20,.10,.11,.02,dark,.05,.20,.06,hand);}
   }
   for(const s of [-1,1]){cyl(.092,.092,.075,gold,0,-.16,.01,joints['elbow_'+s]);ring(.081,.008,trim,0,-.126,.01,joints['elbow_'+s]).rotation.x=Math.PI/2;}
  }else if(role==='architect'||role==='site'){
   orb(.327,.18,.287,trim,0,.205,-.014,head);orb(.36,.023,.30,trim,0,.15,.02,head);tube([[0,.26,-.25],[0,.39,-.04],[0,.27,.23]],.015,cream,head,15);cyl(.038,.038,.34,cream,.08,-.08,.10,joints['hand_1']).rotation.z=-.2;
  }else if(role==='legal'||role==='finance')tablet(joints['hand_1']);
  if(child){round(.26,.31,.125,.06,clothShade,0,.99,-.24);for(const s of [-1,1])tube([[s*.10,1.18,-.22],[s*.205,1.20,.07],[s*.16,.84,.168]],.025,trim);}
 }
 body.scale.setScalar(child?.74:young?.89:1);
 const base=mesh(new T.CylinderGeometry(.44,.46,.022,48),material('#c7c6b5',{roughness:.95}),0,0,0,root);base.castShadow=false;
 root.userData={form,body,arms,legs,eyes,joints,base,version:AVATAR_VERSION,seed,options:{...options},female};
 root.userData.baseTransforms=new Map();body.traverse(o=>{if(o.isGroup)root.userData.baseTransforms.set(o,{position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()});});root.updateMatrixWorld(true);return root;
}
export function animateAvatar(root,time,walking=false,seated=false,action='idle'){
 const u=root.userData;if(!u?.body)return;const {body,arms,legs,eyes,joints,base,seed,baseTransforms}=u;
 baseTransforms.forEach((v,o)=>{o.position.copy(v.position);o.rotation.copy(v.rotation);o.scale.copy(v.scale);});
 if(joints.mouth)joints.mouth.scale.y=1;base.visible=!walking&&!seated;const phase=time*7.5;
 if(u.form==='spirit'){body.position.y=Math.sin(time*1.7)*.06;arms.forEach((a,i)=>a.rotation.z=Math.sin(time*2+i)*.20);}
 else if(seated){// Thigh underside is ~0.50 in model coordinates; chair top is 0.62 m.
  // Scale belongs to the character, so the seat contact must be solved after scaling.
  body.position.y=.62-.50*body.scale.y;legs.forEach(l=>l.rotation.x=-Math.PI/2);for(const key of ['knee_-1','knee_1'])if(joints[key])joints[key].rotation.x=Math.PI/2;arms.forEach(a=>a.rotation.x=-.65);for(const key of ['elbow_-1','elbow_1'])if(joints[key])joints[key].rotation.x=-.48;}
 else if(walking){body.position.y=Math.abs(Math.sin(phase))*.032;legs.forEach((l,i)=>l.rotation.x=Math.sin(phase+i*Math.PI)*.5);arms.forEach((a,i)=>a.rotation.x=-Math.sin(phase+i*Math.PI)*.34);for(const [i,key]of ['knee_-1','knee_1'].entries())if(joints[key])joints[key].rotation.x=Math.max(0,-Math.sin(phase+i*Math.PI))*.45;}
 else{body.position.y=Math.sin(time*1.8)*.006;if(joints.head)joints.head.rotation.z=Math.sin(time*.7)*.018;arms.forEach((a,i)=>a.rotation.z+=Math.sin(time*1.6+i)*.028);}
 const blinkPhase=(time+(seed%71)/17)%4.6,blink=blinkPhase<.13?Math.max(.10,Math.abs(blinkPhase-.065)/.065):1;eyes.forEach(e=>e.scale.y=blink);
 if(action==='talk'&&joints.mouth)joints.mouth.scale.y=1+Math.abs(Math.sin(time*10))*.75;
 if(action==='wave'&&arms[1]){arms[1].rotation.z=-2.1;arms[1].rotation.x=Math.sin(time*8)*.25;}
 if(action==='deliver'&&arms[1])arms[1].rotation.x=-1.15;root.updateMatrixWorld(true);
}
export function disposeAvatar(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.isMesh||o.isSprite){if(o.isMesh)geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});root.removeFromParent();root.traverse(o=>{o.userData={};});root.userData={disposed:true};}
