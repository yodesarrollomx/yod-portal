import {deskSeat} from './office-station.mjs?v=1';
import {createOfficeScreen} from './office-screen.mjs?v=124';
import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
export async function createOffice({pilotFigure=true}={}){
 const root=new T.Group();root.name='YoDesarrollo Despacho V2';const collisions=[];let seed=751,computerScreen=null;const deskScreens=[];let libraryScreen=null,meetingScreen=null;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const material=(color,roughness=.7,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  if(kind==='wood'){ctx.fillStyle='#a68560';ctx.fillRect(0,0,512,512);for(let j=0;j<8;j++){ctx.fillStyle=`hsl(29 27% ${43+random()*9}%)`;ctx.fillRect(0,j*64,512,63);for(let i=0;i<170;i++){const y=j*64+random()*63;ctx.strokeStyle=i%2?'#553b2219':'#edcea21a';ctx.lineWidth=random()+.25;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(180,y+random()*5,300,y-random()*5,512,y);ctx.stroke();}ctx.fillStyle='#32241938';const off=j%2?256:125;ctx.fillRect(off,j*64,1,64);}}
  if(kind==='stone'){ctx.fillStyle='#c9bfab';ctx.fillRect(0,0,512,512);for(let i=0;i<24000;i++){ctx.fillStyle=i%2?'#64564213':'#fff9e617';ctx.fillRect(random()*512,random()*512,random()*4,random()*2);}for(let i=0;i<80;i++){const y=random()*512;ctx.strokeStyle='#8e816809';ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(160,y-15,380,y+10,512,y);ctx.stroke();}}
  if(kind==='fabric'){ctx.fillStyle='#c0b6a3';ctx.fillRect(0,0,512,512);for(let i=0;i<512;i+=2){ctx.strokeStyle=i%4?'#ffffff15':'#40392e16';ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.stroke();}}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex;
 }
 const floorMap=texture('wood');floorMap.repeat.set(5,4);const verticalMap=floorMap.clone();verticalMap.repeat.set(.45,1.5);verticalMap.rotation=Math.PI/2;const stoneMap=texture('stone'),weave=texture('fabric');
 const m={floor:material('#ffffff',.66,{map:floorMap}),oak:material('#cab18c',.55,{map:verticalMap}),oakPlain:material('#a27d51',.64),stone:material('#f1ebdb',.82,{map:stoneMap,bumpMap:stoneMap,bumpScale:.035}),plaster:material('#e5e1d7',.94),navy:material('#20343c',.72),steel:material('#263735',.4,{metalness:.45}),brass:material('#bca275',.32,{metalness:.75}),fabric:material('#f2e9d9',.94,{map:weave}),rug:material('#d9d1bc',1,{map:weave}),leaves:material('#748065',.95),bark:material('#7c725c',1),soil:material('#c8bfab',1),glass:new T.MeshPhysicalMaterial({color:'#c4d9ce',metalness:.12,roughness:.09,transparent:true,opacity:.10,depthWrite:false,side:T.DoubleSide}),tableGlass:new T.MeshPhysicalMaterial({color:'#bbd0c4',metalness:.15,roughness:.12,transparent:true,opacity:.46,side:T.DoubleSide}),light:material('#ffedc6',.5,{emissive:'#ffd898',emissiveIntensity:1.5}),black:material('#202825',.6)};
 function mesh(geometry,mat,x=0,y=0,z=0,parent=root){const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,x,y,z,mat,parent=root)=>mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent);
 // Separate wall materials survive static batching, so cutaway never clips furniture.
 const partitionMaterials=new Map(),cutPlane=new T.Plane(new T.Vector3(0,-1,0),.95);
 let cutaway=false;
 function wall(w,h,d,x,y,z,mat){
  if(!partitionMaterials.has(mat)){
   const copy=mat.clone();copy.userData={...copy.userData,officePartition:true};copy.clipShadows=true;
   partitionMaterials.set(mat,copy);
  }
  return box(w,h,d,x,y,z,partitionMaterials.get(mat));
 }
 function setCutaway(value){cutaway=!!value;for(const mat of partitionMaterials.values()){mat.clippingPlanes=cutaway?[cutPlane]:null;mat.needsUpdate=true;}root.userData.needsRender=true;}
 const cylinder=(rt,rb,h,x,y,z,mat,parent=root)=>mesh(new T.CylinderGeometry(rt,rb,h,24),mat,x,y,z,parent);
 function rounded(w,d,h,r,x,y,z,mat,parent=root){const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const g=new T.ExtrudeGeometry(s,{depth:h-.025,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:12});g.rotateX(-Math.PI/2);return mesh(g,mat,x,y-h/2,z,parent);}
 const block=(x,z,w,d)=>collisions.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
 function branch(a,b,r,mat=m.bark,parent=root){const v=new T.Vector3().subVectors(b,a);const o=mesh(new T.CylinderGeometry(r*.58,r,v.length(),9),mat,0,0,0,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
 function label(text,w,h,x,y,z,{color='#eae0cb',bg=null,size=90,parent=root}={}){const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);}ctx.fillStyle=color;ctx.font=`500 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,c.height/2,960);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide}),x,y,z,parent);o.castShadow=false;return o;}
 function vase(x,y,z,scale=1,parent=root){const points=[new T.Vector2(.1,0),new T.Vector2(.14,.06),new T.Vector2(.17,.20),new T.Vector2(.11,.33),new T.Vector2(.09,.38)];const o=mesh(new T.LatheGeometry(points,20),m.stone,x,y,z,parent);o.scale.setScalar(scale);return o;}
 const leafGeometry=new T.SphereGeometry(1,6,4),dummy=new T.Object3D();
 function foliage(x,y,z,rx,ry,rz,count,parent=root){const inst=new T.InstancedMesh(leafGeometry,m.leaves,count);for(let i=0;i<count;i++){const u=random()*Math.PI*2,v=Math.acos(random()*2-1),r=Math.cbrt(random());dummy.position.set(x+Math.cos(u)*Math.sin(v)*r*rx,y+Math.cos(v)*r*ry,z+Math.sin(u)*Math.sin(v)*r*rz);dummy.scale.set(.07+random()*.025,.018,.15+random()*.075);dummy.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);inst.setColorAt(i,new T.Color().setHSL(.21+random()*.035,.12+random()*.15,.28+random()*.16));}inst.castShadow=true;parent.add(inst);}
 function potted(x,z,scale=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);root.add(g);cylinder(.28,.22,.62,0,.31,0,m.stone,g);cylinder(.25,.25,.022,0,.628,0,m.bark,g);for(let i=0;i<5;i++){const a=i*2.4;branch(new T.Vector3(0,.6,0),new T.Vector3(Math.cos(a)*.22,1.55+random()*.25,Math.sin(a)*.22),.013,m.bark,g);}foliage(0,1.55,0,.48,.65,.48,170,g);}
 // A larger connected floorplate: 24 x 19 metres, clear central circulation.
 box(24.4,.35,19.4,0,-.22,0,m.stone);box(24,.06,19,0,-.015,0,m.floor);
 const ground=box(140,.15,140,0,-.51,0,material('#20353a'));ground.name='Presentation ground';
 wall(24.1,3.7,.18,0,1.85,-9.5,m.plaster);wall(7.3,3.7,.09,-8.22,1.85,-9.35,m.navy);
 for(const side of [-1,1]){wall(.075,.065,19,side*12,3.45,0,m.steel);if(side===1){wall(.16,.45,19,12,.225,0,m.stone);wall(.012,2.96,18.95,12,1.96,0,m.glass);for(let z=-9.5;z<=9.6;z+=3.8)wall(.06,3.45,.06,12,1.725,z,m.steel);}else{for(const [z,d]of [[-5.75,7.5],[5.35,8.3]]){wall(.16,.45,d,-12,.225,z,m.stone);wall(.012,2.96,d,-12,1.96,z,m.glass);block(-12,z,.16,d);}for(const z of [-9.5,-5.7,-2,1.2,5.7,9.5])wall(.06,3.45,.06,-12,1.725,z,m.steel);}}
 for(const side of [-1,1]){wall(8.4,.36,.14,side*7.8,.18,9.5,m.stone);wall(8.4,2.8,.01,side*7.8,1.78,9.5,m.glass);wall(8.4,.06,.06,side*7.8,3.2,9.5,m.steel);for(const x of [3.6,7.8,12])wall(.055,3.2,.055,side*x,1.6,9.5,m.steel);}
 wall(24,.09,.12,0,.1,-9.35,m.oakPlain);wall(24,.07,.10,0,3.53,-9.34,m.oakPlain);
 // Curved reception counter and layered patterned timber wall.
 for(let i=0;i<6;i++){const x=-11.22+i*1.15;box(1.1,1.55,.12,x,2.74,-9.25,m.oak);const disk=cylinder(.55,.55,.12,x,1.98,-9.25,m.oak);disk.rotation.x=Math.PI/2;}
 box(6.6,1.03,.10,-8.23,2.07,-9.13,m.navy);box(6.3,.02,.06,-8.2,3.46,-9.14,m.light);
 // Decoration must never hold the office's first frame behind an image request.
 new T.TextureLoader().load('assets/yod.png',logo=>{logo.colorSpace=T.SRGBColorSpace;const sign=mesh(new T.PlaneGeometry(5.3,.77),new T.MeshBasicMaterial({map:logo,transparent:true}),-8.2,2.1,-9.05);sign.castShadow=false;root.userData.needsRender=true;},undefined,()=>{});
 rounded(4.8,1.42,1.0,.64,-8.25,.53,-7.45,m.oak);rounded(4.93,1.54,.095,.66,-8.25,1.09,-7.45,m.stone);box(3.65,.045,.025,-8.25,.12,-6.72,m.brass);
 for(let i=0;i<74;i++){const x=-10.13+i*.052;box(.022,.85,.045,x,.55,-6.73,m.oakPlain);}block(-8.25,-7.45,5.0,1.65);vase(-9.8,1.145,-7.35,.65);box(.52,.32,.055,-7.25,1.35,-7.5,m.black);box(.25,.03,.2,-7.25,1.17,-7.4,m.steel);
 // Patio and stone promenade, enough width to walk around both sides.
 box(7.8,.025,7.8,0,.027,-1,m.stone);box(5.85,.15,5.85,0,.1,-1,m.soil);block(0,-1,6.1,6.1);
 for(const x of [-3.02,3.02]){wall(.02,3.5,6.02,x,1.85,-1,m.glass);wall(.07,.075,6.1,x,3.6,-1,m.steel);for(const z of [-4.02,2.02])wall(.07,3.6,.07,x,1.82,z,m.steel);}
 for(const z of [-4.02,2.02]){wall(6.04,3.5,.02,0,1.85,z,m.glass);wall(6.1,.075,.07,0,3.6,z,m.steel);wall(.05,3.5,.05,0,1.85,z,m.steel);}
 const curve=new T.CatmullRomCurve3([new T.Vector3(.1,.2,-1.1),new T.Vector3(-.12,1.5,-1.0),new T.Vector3(.15,2.6,-1.0),new T.Vector3(.3,3.2,-1.3)]);mesh(new T.TubeGeometry(curve,14,.085,9,false),m.bark);
 for(let i=0;i<12;i++){const a=i*2.4,top=new T.Vector3(Math.cos(a)*1.5,2.8+random()*.65,-1+Math.sin(a)*1.2);branch(new T.Vector3(.05,1.45+i*.1,-1),top,.035);foliage(top.x,top.y,top.z,.64,.49,.65,130);}
 for(const [x,z,r] of [[1.5,.6,.58],[-1.6,-2.6,.32],[.8,-2.8,.22]]){const o=mesh(new T.DodecahedronGeometry(r,1),m.stone,x,r*.65,z);o.scale.set(1.2,.72,1);}
 for(let i=0;i<12;i++){const x=(random()-.5)*5.3,z=-1+(random()-.5)*5.2;foliage(x,.30,z,.28,.17,.28,35);}
 for(let i=0;i<100;i++){const x=(random()-.5)*5.7,z=-1+(random()-.5)*5.7;const p=mesh(new T.IcosahedronGeometry(.025+random()*.025),m.stone,x,.2,z);p.scale.y=.6;}
 // Comfortable chairs with curved upholstered backs and proper bases.
 function chair(x,z,angle=0,office=false,parent=root){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;parent.add(g);rounded(.68,.65,.16,.18,0,.54,0,m.fabric,g);const back=new T.Shape();back.absarc(0,0,.37,Math.PI,Math.PI*2,false);back.absarc(0,0,.29,Math.PI*2,Math.PI,true);const geo=new T.ExtrudeGeometry(back,{depth:.48,bevelEnabled:true,bevelThickness:.018,bevelSize:.012,bevelSegments:2,curveSegments:14});geo.rotateX(-Math.PI/2);geo.rotateY(Math.PI);mesh(geo,m.fabric,0,.56,-.1,g);
 if(office){cylinder(.035,.035,.36,0,.25,0,m.steel,g);for(let i=0;i<5;i++){const a=i*2*Math.PI/5;branch(new T.Vector3(0,.13,0),new T.Vector3(Math.cos(a)*.33,.08,Math.sin(a)*.33),.022,m.steel,g);mesh(new T.SphereGeometry(.048,8,6),m.black,Math.cos(a)*.33,.05,Math.sin(a)*.33,g);}}else{for(const sx of [-1,1])for(const sz of [-1,1])branch(new T.Vector3(sx*.26,.48,sz*.23),new T.Vector3(sx*.29,.04,sz*.27),.028,m.oakPlain,g);}return g;}
 function desk(x,z,{pilot=false}={}){rounded(1.9,.88,.08,.055,x,.82,z,m.oak);box(1.82,.018,.8,x,.769,z,m.brass);for(const sx of [-.77,.77])box(.045,.75,.62,x+sx,.38,z,m.steel);block(x,z,2.03,1.0);box(.026,.27,.04,x,.985,z-.14,m.steel);box(.27,.025,.2,x,.884,z-.10,m.steel);rounded(.74,.048,.43,.027,x,1.22,z-.15,m.steel);const display=label(pilot?'Caso':'YO DESARROLLO',.68,.355,x,1.23,z-.10,{size:pilot?130:61,color:'#d4c8a7',bg:'#20343c'});const screen=createOfficeScreen(display,()=>{root.userData.needsRender=true;});if(x>0){deskScreens.push(screen);if(pilot)computerScreen=screen;}rounded(.40,.14,.02,.025,x,.881,z+.17,m.steel);for(let i=0;i<3;i++)for(let j=0;j<10;j++)box(.024,.004,.017,x-.16+j*.035,.895,z+.13+i*.035,m.plaster);box(.19,.018,.26,x-.63,.88,z+.05,m.plaster);box(.018,.012,.20,x-.49,.899,z+.03,m.brass);const seat=deskSeat(x,z);chair(seat.position[0],seat.position[2],seat.rotationY,true);}
 // Three studios share a wide gallery; only the selected tasks will occupy their seats.
 for(const [z,title,num] of [[-6.45,'POTENCIALES','01'],[-.2,'PROYECTOS Y PERMISOS','02'],[5.85,'OBRA Y VENTAS','03']]){
   box(6.1,.023,4.8,8.65,.045,z,m.rug);wall(.10,1.25,3.8,5.45,.64,z-.35,m.oak);wall(.14,.07,3.85,5.45,1.30,z-.35,m.stone);for(let k=0;k<35;k++)wall(.018,1.14,.025,5.385,.63,z-2.03+k*.098,m.oakPlain);
   // Large readable signs over the open entry, facing the gallery.
   const sign=label(title,3.8,.36,5.35,2.53,z+.05,{size:72,color:'#263c40'});sign.rotation.y=-Math.PI/2;
   const id=label(num,.55,.42,5.35,2.94,z+.05,{size:180,color:'#9a7b4d'});id.rotation.y=-Math.PI/2;
   desk(7.0,z-.65,{pilot:num==='01'});desk(10.05,z-.65);chair(7,z-1.5,0);chair(10.05,z-1.5,0);
   box(5.9,.68,.42,8.8,.37,z-2.35,m.oak);box(6,.05,.47,8.8,.735,z-2.35,m.stone);vase(10.4,.76,z-2.35,.5);
   if(num!=='03'){wall(6.55,1.25,.10,8.72,.65,z+2.62,m.plaster);wall(6.55,1.3,.015,8.72,1.96,z+2.62,m.glass);wall(6.55,.045,.045,8.72,2.62,z+2.62,m.steel);block(8.72,z+2.62,6.55,.15);}
   block(5.45,z-.35,.16,3.85);
 }
 // Individual identity for the pilot: one character, no invented active tasks.
 if(pilotFigure){const avatar=new T.Group();avatar.position.set(6.65,0,-4.42);root.add(avatar);cylinder(.18,.22,.62,0,.90,0,m.navy,avatar);const skin=material('#bc9474',.85);mesh(new T.SphereGeometry(.16,16,12),skin,0,1.41,0,avatar);mesh(new T.SphereGeometry(.16,16,8,0,Math.PI*2,0,Math.PI*.42),m.bark,0,1.44,0,avatar);for(const x of [-.105,.105]){rounded(.135,.15,.47,.035,x,.34,0,m.steel,avatar);rounded(.15,.28,.08,.05,x,.07,.06,m.black,avatar);}branch(new T.Vector3(-.19,1.1,0),new T.Vector3(-.25,.72,.07),.06,m.navy,avatar);branch(new T.Vector3(.19,1.1,0),new T.Vector3(.27,.85,.2),.06,m.navy,avatar);box(.27,.35,.035,.15,.89,.25,m.oakPlain,avatar);}cylinder(.36,.36,.025,6.65,.04,-4.42,m.brass);
 // A soft reception lounge, low cabinetry and a project library.
 function sofa(x,z){rounded(3.25,1.2,.4,.20,x,.4,z,m.oakPlain);for(const dx of [-1,0,1]){rounded(.97,1.04,.25,.17,x+dx,.7,z+.04,m.fabric);rounded(.97,.28,.55,.12,x+dx,.98,z-.42,m.fabric);}for(const dx of [-1.55,1.55])rounded(.20,1.23,.54,.09,x+dx,.8,z,m.fabric);block(x,z,3.45,1.3);}
 box(5.7,.022,4.4,-8.4,.04,3.2,m.rug);sofa(-8.55,2.0);chair(-9.9,4.3,Math.PI);chair(-7.0,4.3,Math.PI);rounded(2.0,1.0,.07,.48,-8.45,.51,3.4,m.stone);for(const x of [-9,-7.9])cylinder(.07,.07,.43,x,.26,3.4,m.brass);vase(-8.35,.55,3.4,.45);block(-8.45,3.4,2.15,1.15);
 box(4.8,.8,.50,-8.35,.43,-2.5,m.oak);box(4.9,.065,.57,-8.35,.86,-2.5,m.stone);for(const y of [1.55,2.3]){box(4.8,.055,.30,-8.35,y,-2.65,m.oak);for(let j=0;j<15;j++){const h=.19+random()*.20;box(.07,h,.16,-10.3+j*.12,y+.04+h/2,-2.67,j%3?m.plaster:m.navy);}vase(-7.2,y+.035,-2.66,.62);}
 // Shared projections display only the selected authorized work, dated like desk screens.
 const libraryDisplay=label('Biblioteca',3.6,1.88,-8.35,2.1,-2.38,{bg:'#162a30'});libraryScreen=createOfficeScreen(libraryDisplay,()=>{root.userData.needsRender=true;});
 const meetingDisplay=label('Avances',5.6,2.92,-.3,2.35,8.85,{bg:'#162a30'});meetingDisplay.rotation.y=Math.PI;meetingScreen=createOfficeScreen(meetingDisplay,()=>{root.userData.needsRender=true;});
 // Coffee counter on the rear wall; pendant details in bronze.
 box(6.4,.91,.56,.1,.46,-9.05,m.oak);box(6.5,.07,.67,.1,.96,-9.01,m.stone);for(const y of [1.9,2.65]){box(6.2,.055,.31,.1,y,-9.28,m.oak);for(let i=0;i<6;i++)vase(-1.8+i*.65,y+.03,-9.25,.37+random()*.15);}box(.35,.48,.37,.3,1.24,-9.05,m.steel);for(const x of [1,1.35])cylinder(.06,.05,.11,x,1.05,-8.92,m.stone);
 // Decision room around a stone-and-glass table with generous circulation.
 box(6.4,.025,4.4,-.25,.042,6.4,m.rug);for(const x of [-1.45,.85])rounded(.58,.72,.82,.05,x,.46,6.3,m.stone);rounded(4.7,1.53,.055,.72,-.3,.94,6.3,m.tableGlass);for(const x of [-1.8,-.3,1.2]){chair(x,5.08,0);chair(x,7.57,Math.PI);}block(-.3,6.3,4.86,1.66);vase(.45,.975,6.3,.55);box(.32,.02,.28,-1.6,.983,6.25,m.plaster);
 function pendant(x,y,z){branch(new T.Vector3(x,y+.24,z),new T.Vector3(x,3.8,z),.008,m.steel);const geo=new T.CylinderGeometry(.14,.39,.4,32,1,true);mesh(geo,m.oakPlain,x,y,z);for(let i=0;i<32;i++){const a=i/32*Math.PI*2;branch(new T.Vector3(x+Math.cos(a)*.14,y+.20,z+Math.sin(a)*.14),new T.Vector3(x+Math.cos(a)*.39,y-.20,z+Math.sin(a)*.39),.008,m.brass);}for(const yy of [-.18,-.08,.02,.12]){const r=.14+(.2-yy)/.4*.25;const ring=mesh(new T.TorusGeometry(r,.007,5,32),m.brass,x,y+yy,z);ring.rotation.x=Math.PI/2;}mesh(new T.SphereGeometry(.055,12,8),m.light,x,y-.05,z);}
 for(const x of [-1.5,-.3,.9])pendant(x,2.85+Math.abs(x)*.05,6.3);
 // Lighting rails and plants give rhythm without closing the circulation.
 for(const x of [-4.45,4.45]){box(.038,.038,16.6,x,3.65,-.55,m.brass);box(.019,.015,16.1,x,3.62,-.55,m.light);}
 for(const [x,z,s] of [[-11,-5.0,1.1],[-4.5,-8.5,1.3],[4.5,-8.5,1.2],[-11.0,6.6,1.4],[11.3,-3.75,.9],[11.3,2.7,1],[4.5,8.4,1.1]])potted(x,z,s);
 label('DECISIONES',2.2,.32,-.4,1.5,8.53,{size:120,color:'#42554b'});
 // Grounding gradients approximate contact shadows under furnishings.
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,32);gradient.addColorStop(0,'#30241446');gradient.addColorStop(1,'#30241400');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const tex=new T.CanvasTexture(c),shadowMat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});
 for(const [x,z,w,d] of [[-8.25,-7.45,6,2.8],[0,-1,8,8],[-.3,6.3,6.8,4.5],[-8.5,2,4.7,2.5],[-8.4,3.4,3,2],...[[-6.45],[-.2],[5.85]].flatMap(([z])=>[[7,z-.65,2.9,2.0],[10.05,z-.65,2.9,2]])]){const o=mesh(new T.PlaneGeometry(w,d),shadowMat,x,.066,z);o.rotation.x=-Math.PI/2;o.castShadow=false;}

 // Dedicated editing and commercial wing, connected by a broad glazed opening.
 box(12.15,.35,15.5,-18,-.22,-.45,m.stone);box(12,.06,15.3,-18,-.015,-.45,m.floor);
 wall(12,3.7,.16,-18,1.85,-8.1,m.navy);wall(.16,.40,15.4,-24,.2,-.45,m.stone);wall(.015,3.2,15.35,-24,1.94,-.45,m.glass);wall(.065,.065,15.4,-24,3.5,-.45,m.steel);
 for(const z of [-8.1,-4.3,-.45,3.35,7.2])wall(.06,3.5,.06,-24,1.75,z,m.steel);
 wall(12,.4,.16,-18,.2,7.2,m.stone);wall(11.9,3.1,.015,-18,1.95,7.2,m.glass);wall(12,.07,.07,-18,3.5,7.2,m.steel);for(const x of [-24,-20,-16,-12])wall(.06,3.5,.06,x,1.75,7.2,m.steel);
 for(const x of [-23.7,-12.3]){box(.12,3.7,.22,x,1.85,-7.91,m.oak);box(.035,3.35,.04,x,1.78,-7.74,m.light);}
 label('SALA DE EDICIÓN  /  EMBUDO COMERCIAL',10.4,.5,-18,3.16,-7.99,{size:67,color:'#d8c29b'});
 function screen(x,title,lines){rounded(4.65,.12,1.91,.06,x,1.82,-7.91,m.steel);label(title,4.3,.27,x,2.48,-7.82,{size:68,color:'#d5bb86',bg:'#20343c'});lines.forEach((line,i)=>label(line,4.3,.20,x,2.12-i*.32,-7.815,{size:48,color:'#eef0e5',bg:'#20343c'}));label('DISTRIBUCIÓN PROPUESTA · SIN DATOS EN VIVO',4.3,.15,x,1.13,-7.815,{size:34,color:'#b7c2b3',bg:'#20343c'});}
 screen(-20.7,'MESA EDITORIAL',['Propuesta  /  Decisión  /  Producción','Guion  ·  Láminas  ·  Voz  ·  Video','Correcciones  /  Aprobación final']);
 screen(-15.25,'EMBUDO COMERCIAL',['Arquitectura de Autor  /  Plan de Potencial','Inicio  /  Leads  /  Citas  /  Seguimiento','Publicaciones  ·  Pauta  ·  Resultados']);
 box(10.3,.75,.55,-18,.4,-7.65,m.oak);box(10.4,.06,.6,-18,.81,-7.62,m.stone);vase(-22.4,.85,-7.6,.7);vase(-13.5,.85,-7.6,.5);
 box(6.5,.025,4.45,-18,.05,-3.25,m.rug);rounded(4.7,1.55,.10,.66,-18,.92,-3.1,m.oak);for(const x of [-19.4,-16.6])rounded(.40,1.07,.83,.08,x,.44,-3.1,m.stone);block(-18,-3.1,4.86,1.7);
 for(const x of [-19.2,-16.8]){chair(x,-1.87,Math.PI,true);chair(x,-4.34,0);box(.43,.016,.32,x,.99,-2.9,m.plaster);}
 const ale=label('ALEJANDRO',1.05,.14,-19.2,1.14,-2.82,{size:105,color:'#d8c299',bg:'#20343c'});const say=label('SAYRI',1.05,.14,-16.8,1.14,-2.82,{size:110,color:'#d8c299',bg:'#20343c'});
 vase(-18,.985,-3.1,.6);for(const x of [-19.2,-18,-16.8])pendant(x,2.9,-3.1);
 for(const [x,title]of [[-21.6,'GUION Y PROPUESTA'],[-18,'PRODUCCIÓN'],[-14.4,'COMERCIAL Y MEDICIÓN']]){desk(x,3.7);label(title,2.3,.30,x,1.80,3.36,{size:76,color:'#273d41',bg:'#ede8dc'});block(x,3.7,2.03,1.05);}
 wall(10.25,1.25,.12,-18,.65,5.7,m.oak);wall(10.35,.07,.18,-18,1.31,5.7,m.stone);
 label('Proponer · Revisar · Producir · Medir',8,.25,-18,2.7,5.65,{size:80,color:'#394a43'}).rotation.y=Math.PI;
 potted(-23.0,-6.5,1.2);potted(-23,5.8,1.2);potted(-12.7,5.9,.95);
 const entrance=label('SALA DE EDICIÓN',3,.35,-12,2.8,-.45,{size:86,color:'#34483e'});entrance.rotation.y=Math.PI/2;
 block(-8.35,-2.5,4.9,.60);
 
 // Static meshes batched by material to keep touch navigation responsive.
 root.updateMatrixWorld(true);const groups=new Map(),remove=[];root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.material.transparent||Array.isArray(o.material))return;const key=o.material.uuid+o.castShadow+o.receiveShadow;if(!groups.has(key))groups.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,list:[]});let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrixWorld);groups.get(key).list.push(g);remove.push(o);});for(const group of groups.values()){const g=mergeGeometries(group.list);if(!g)throw Error('No se pudo preparar la geometría');const o=mesh(g,group.material);o.castShadow=group.cast;o.receiveShadow=group.receive;group.list.forEach(g=>g.dispose());}remove.forEach(o=>o.removeFromParent());
 return {computerScreen,deskScreens,libraryScreen,meetingScreen,setCutaway,getCutaway:()=>cutaway,model:root,collisions,bounds:{minX:-11.65,maxX:11.65,minZ:-9.14,maxZ:9.12},annex:{minX:-23.65,maxX:-11.5,minZ:-7.75,maxZ:6.85},pickBoxes:[{id:'computer',min:[6.58,.92,-7.38],max:[7.42,1.52,-6.9]},{id:'editing',min:[-20.6,0,-4],max:[-15.4,1.4,-2.2]},{id:'editorial',min:[-23.1,1,-8],max:[-18.3,2.8,-7.7]},{id:'funnel',min:[-17.7,1,-8],max:[-12.8,2.8,-7.7]},{id:'case',min:[6.1,0,-4.95],max:[7.2,2.1,-3.8]},{id:'reception',min:[-10.75,0,-8.3],max:[-5.75,1.25,-6.6]},{id:'patio',min:[-3,.1,-4],max:[3,3.5,2]},{id:'decisions',min:[-2.7,0,5.45],max:[2.2,1.2,7.15]}]};
}
