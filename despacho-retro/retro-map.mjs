import {places,bounds,annex,collisions,allowed} from '../despacho3d/office-layout.mjs';

// Las conversiones son independientes del DOM y usan píxeles CSS.
export function worldToScreen({x,z},{scale,offsetX,offsetY}){
 return {x:offsetX+x*scale,y:offsetY+z*scale};
}
export function screenToWorld({x,y},{scale,offsetX,offsetY}){
 return {x:(x-offsetX)/scale,z:(y-offsetY)/scale};
}

export function createRetroMap({canvas,onSelect=()=>{},onMove=()=>{},onResidentSelect=()=>{},host}={}){
 const ctx=canvas?.getContext?.('2d');
 if(!ctx)throw new Error('Canvas 2D no disponible');
 const container=host||canvas;
 let selected='entry',position={x:places.entry.eye[0],z:places.entry.eye[2]},zoom=1;
 let width=1,height=1,dpr=1,panX=0,panY=0,frame=null,dead=false,drag=null,residents=[];
 const win=canvas.ownerDocument?.defaultView||globalThis;
 const doc=canvas.ownerDocument;
 const listeners=[];
 const listen=(node,type,fn,options)=>{node?.addEventListener?.(type,fn,options);listeners.push(()=>node?.removeEventListener?.(type,fn,options));};
 const schedule=()=>{if(dead||doc?.hidden||frame!==null)return;frame=win.requestAnimationFrame(()=>{frame=null;if(!dead&&!doc?.hidden)draw();});};
 const transform=()=>{
  const scale=Math.min(width/40,height/23)*zoom;
  return {scale,offsetX:width/2+6*scale+panX,offsetY:height/2+panY};
 };
 const clampPan=()=>{const t=transform();panX=Math.max(-width*.4,Math.min(width*.4,panX));panY=Math.max(-height*.4,Math.min(height*.4,panY));return t;};
 function resize(){
  if(dead)return;
  const rect=container.getBoundingClientRect();width=Math.max(1,rect.width||canvas.clientWidth||1);height=Math.max(1,rect.height||canvas.clientHeight||1);
  dpr=Math.max(1,Math.min(2,win.devicePixelRatio||1));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);schedule();
 }
 function draw(){
  const t=transform(),s=t.scale;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#243c3a';ctx.fillRect(0,0,width,height);
  ctx.save();ctx.translate(t.offsetX,t.offsetY);ctx.scale(s,s);
  const rect=(x,z,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,z,w,h);};
  const outline=(x,z,w,h,color='#42544a',line=.10)=>{ctx.strokeStyle=color;ctx.lineWidth=line;ctx.strokeRect(x,z,w,h);};
  function floor(b){rect(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ,'#ddd29c');ctx.strokeStyle='#c6b983';ctx.lineWidth=.035;ctx.beginPath();for(let x=Math.ceil(b.minX);x<b.maxX;x++) {ctx.moveTo(x,b.minZ);ctx.lineTo(x,b.maxZ);}for(let z=Math.ceil(b.minZ);z<b.maxZ;z++){ctx.moveTo(b.minX,z);ctx.lineTo(b.maxX,z);}ctx.stroke();outline(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ,'#708373',.13);}
  floor(bounds);floor(annex);
  // El muro y las aberturas siguen el catálogo de colisiones compartido.
  for(const c of collisions){rect(c.minX,c.minZ,c.maxX-c.minX,c.maxZ-c.minZ,'#a9946e');outline(c.minX,c.minZ,c.maxX-c.minX,c.maxZ-c.minZ,'#715d4b',.055);}
  function rug(x,z,w,h){rect(x-w/2,z-h/2,w,h,'#b9c399');outline(x-w/2,z-h/2,w,h,'#8fa083',.08);}
  function desk(x,z){rect(x-.95,z-.44,1.9,.88,'#a56f4a');rect(x-.83,z-.36,1.66,.58,'#d0a66c');rect(x-.35,z-.30,.7,.18,'#253f42');rect(x-.25,z-.26,.5,.10,'#91c9a6');rect(x-.30,z+.08,.6,.12,'#e6dcb5');chair(x,z+.72);}
  function chair(x,z){rect(x-.25,z-.23,.5,.46,'#7c8e72');rect(x-.20,z-.18,.4,.30,'#dcd4ad');}
  function plant(x,z){rect(x-.23,z-.20,.46,.40,'#8b7053');rect(x-.35,z-.48,.7,.32,'#65875e');rect(x-.18,z-.68,.35,.34,'#8ba66b');}
  // Patio central: zona no transitable, pasillos a ambos lados.
  rect(-3.05,-4.05,6.1,6.1,'#91a16e');outline(-3.05,-4.05,6.1,6.1,'#567660',.16);
  rect(-.18,-1.4,.36,1.3,'#806449');rect(-1.25,-2.15,2.5,1.55,'#557e55');rect(-.85,-2.55,1.7,2.15,'#719862');
  for(const [x,z] of [[-2,-3],[1.8,-2.7],[-1.8,.7],[1.7,.6]])plant(x,z);
  // Tres estudios, con pantallas y puestos idénticos a la distribución fuente.
  for(const z of [-6.45,-.2,5.85]){rug(8.65,z,6.1,4.8);desk(7,z-.65);desk(10.05,z-.65);rect(5.35,z-2.27,.2,3.84,'#9a7757');}
  // Recepción, biblioteca y sala de encuentro.
  rect(-10.65,-8.12,4.8,1.32,'#ae8053');rect(-10.35,-7.95,4.2,.45,'#e8d9ad');
  rect(-10.8,-2.8,4.9,.6,'#674e3d');for(let x=-10.65;x<-6.1;x+=.32)rect(x,-2.76,.17,.48,x%2?'#e7dbb4':'#729078');
  rug(-8.4,3.2,5.7,4.4);rect(-10.2,1.37,3.3,1.26,'#d9d2ad');rect(-9.5,2.9,2.1,1.0,'#ba986f');chair(-9.9,4.3);chair(-7,4.3);
  rug(-.25,6.4,6.4,4.4);rect(-2.65,5.55,4.7,1.5,'#d2c49c');for(const x of [-1.8,-.3,1.2]){chair(x,5.08);chair(x,7.57);}
  rect(-3.1,8.65,5.6,.3,'#35595a');
  // Ala editorial: mesa, pantallas y las tres estaciones de trabajo.
  rug(-18,-3.25,6.5,4.45);rect(-20.35,-3.88,4.7,1.55,'#b8895b');for(const x of [-19.2,-16.8]){chair(x,-1.87);chair(x,-4.34);}
  for(const x of [-21.6,-18,-14.4])desk(x,3.7);
  for(const x of [-20.7,-15.25]){rect(x-2.32,-7.95,4.64,.30,'#294b4b');rect(x-2.12,-7.9,4.24,.14,'#a5c496');}
  for(const [x,z] of [[-23,-6.5],[-23,5.8],[-12.7,5.9],[-11,-5],[-4.5,-8.5],[4.5,-8.5],[11.3,2.7]])plant(x,z);
  // Señales compactas y marcas para identificar todos los destinos sin inventar datos.
  const names={editing:'EDICIÓN',editorial:'EDITORIAL',funnel:'EMBUDO',entry:'ENTRADA',library:'BIBLIOTECA',reception:'RECEPCIÓN',patio:'PATIO',potential:'POTENCIALES',case:'PUESTO',projects:'PROYECTOS',delivery:'OBRA / VENTAS',decisions:'DECISIONES',lounge:'ENCUENTRO'};
  ctx.font='bold .40px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const [id,p] of Object.entries(places)){const x=p.eye[0],z=p.eye[2];ctx.fillStyle=id===selected?'#f4e293':'#334f48';ctx.fillRect(x-.13,z-.13,.26,.26);if(s>=15){ctx.fillStyle='#263d37';ctx.fillText(names[id],x,z+.48);}}
  // Sólo posiciones suministradas por el adaptador de perfiles autorizados.
  for(const r of residents){rect(r.x-.22,r.z-.32,.44,.55,'#aa764f');rect(r.x-.16,r.z-.46,.32,.24,'#e4bc8b');if(s>=15){ctx.fillStyle='#263d37';ctx.fillText(r.name,r.x,r.z-.7);}}
  // Visitante sintético, sin atribuir identidad o actividad de negocio.
  rect(position.x-.20,position.z-.27,.40,.48,'#2b5261');rect(position.x-.15,position.z-.40,.30,.22,'#e6be88');rect(position.x-.20,position.z+.20,.14,.16,'#263d43');rect(position.x+.06,position.z+.20,.14,.16,'#263d43');
  ctx.restore();
 }
 function visit(id){if(dead||!Object.hasOwn(places,id))return false;const same=selected===id&&position.x===places[id].eye[0]&&position.z===places[id].eye[2];selected=id;position={x:places[id].eye[0],z:places[id].eye[2]};if(same){schedule();return true;}const scale=Math.min(width/40,height/23)*zoom;panX=-(position.x+6)*scale;panY=-position.z*scale;clampPan();schedule();onMove({...position});return true;}
 function move(dx,dz){
  if(dead||!Number.isFinite(dx)||!Number.isFinite(dz))return false;
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.1));if(steps>10000)return false;
  const before={...position};for(let i=0;i<steps;i++){if(allowed(position.x+dx/steps,position.z))position.x+=dx/steps;if(allowed(position.x,position.z+dz/steps))position.z+=dz/steps;}
  if(before.x===position.x&&before.z===position.z)return false;schedule();onMove({...position});return true;
 }
 function zoomBy(factor){if(dead||!Number.isFinite(factor)||factor<=0)return false;const next=Math.max(.8,Math.min(3,zoom*factor));if(next===zoom)return false;zoom=next;clampPan();schedule();return true;}
 function point(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 listen(canvas,'pointerdown',e=>{if(dead||drag)return;drag={id:e.pointerId,start:point(e),last:point(e),moved:false};canvas.setPointerCapture?.(e.pointerId);});
 listen(canvas,'pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const p=point(e);if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>5)drag.moved=true;if(drag.moved){panX+=p.x-drag.last.x;panY+=p.y-drag.last.y;clampPan();schedule();}drag.last=p;});
 const end=e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(e.type!=='pointerup'||d.moved)return;const w=screenToWorld(point(e),transform());const resident=residents.find(r=>Math.hypot(w.x-r.x,w.z-r.z)<.55);if(resident){onResidentSelect(resident.case_id);return;}let best=null,distance=1.35;for(const [id,p] of Object.entries(places)){const n=Math.hypot(w.x-p.eye[0],w.z-p.eye[2]);if(n<distance){best=id;distance=n;}}if(best){selected=best;schedule();onSelect(best);}};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,type,end);
 listen(canvas,'wheel',e=>{e.preventDefault();zoomBy(e.deltaY<0?1.15:1/1.15);},{passive:false});
 listen(doc,'visibilitychange',()=>{if(doc.hidden&&frame!==null){win.cancelAnimationFrame(frame);frame=null;}else schedule();});
 let observer=null;if(typeof win.ResizeObserver==='function'){observer=new win.ResizeObserver(resize);observer.observe(container);}else listen(win,'resize',resize);
 resize();
 function setResidents(items){if(dead||!Array.isArray(items))return false;residents=items.filter(r=>r&&typeof r.case_id==='string'&&typeof r.name==='string'&&Number.isFinite(r.x)&&Number.isFinite(r.z)).map(r=>({case_id:r.case_id,name:r.name.slice(0,48),x:r.x,z:r.z}));schedule();return true;}
 function fit(){if(dead)return false;zoom=1;panX=0;panY=0;schedule();return true;}
 return {visit,move,zoomBy,fit,setResidents,getState:()=>({selected,position:{...position},zoom}),destroy(){if(dead)return;dead=true;if(frame!==null)win.cancelAnimationFrame(frame);frame=null;observer?.disconnect();listeners.forEach(fn=>fn());drag=null;}};
}
