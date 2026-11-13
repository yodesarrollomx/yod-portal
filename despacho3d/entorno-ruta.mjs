// Ruta del agente entre los espacios del Despacho. Solo geometría: busca un camino que no
// atraviese muebles ni paredes usando la misma función de colisiones con la que camina la persona.
// No hace peticiones de red, no escribe en Sheets y no cambia permisos de nadie.

const DISTANCIA_AL_PUESTO=1.8;

// Dónde se para el agente para atender a quien llega a un lugar: delante de la cámara, mirando hacia ella.
export function puestoDe(lugar){
 const eye=lugar?.eye,target=lugar?.target;
 if(!Array.isArray(eye)||!Array.isArray(target)||![...eye,...target].every(Number.isFinite))return null;
 const dx=target[0]-eye[0],dz=target[2]-eye[2],largo=Math.hypot(dx,dz);
 if(largo<.01)return {xz:[eye[0],eye[2]],rot:0};
 const ux=dx/largo,uz=dz/largo,paso=Math.min(DISTANCIA_AL_PUESTO,largo*.7);
 return {xz:[+(eye[0]+ux*paso).toFixed(3),+(eye[2]+uz*paso).toFixed(3)],rot:+Math.atan2(-ux,-uz).toFixed(4)};
}

class Monton{
 constructor(){this.a=[];}
 get largo(){return this.a.length;}
 poner(clave,valor){
  const a=this.a;a.push([clave,valor]);let i=a.length-1;
  while(i>0){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;[a[p],a[i]]=[a[i],a[p]];i=p;}
 }
 sacar(){
  const a=this.a,cima=a[0],ultimo=a.pop();
  if(a.length){a[0]=ultimo;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];i=m;}}
  return cima[1];
 }
}

const dentro=(limites,x,z)=>limites.some(b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ);

// permitido(x,z) -> boolean. limites: lista de {minX,maxX,minZ,maxZ}. Devuelve [[x,z],...] o null.
export function rutaEntre(a,b,permitido,limites,{celda=.3,radio=2.5}={}){
 const ok=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
 if(!ok(a)||!ok(b)||typeof permitido!=='function'||!Array.isArray(limites)||!limites.length)return null;
 const minX=Math.min(...limites.map(l=>l.minX)),maxX=Math.max(...limites.map(l=>l.maxX));
 const minZ=Math.min(...limites.map(l=>l.minZ)),maxZ=Math.max(...limites.map(l=>l.maxZ));
 const nx=Math.ceil((maxX-minX)/celda)+1,nz=Math.ceil((maxZ-minZ)/celda)+1;
 if(nx*nz>60000)return null;
 const libre=new Map();
 const sitio=(i,j)=>{
  if(i<0||j<0||i>=nx||j>=nz)return false;
  const k=j*nx+i;let v=libre.get(k);
  if(v===undefined){const x=minX+i*celda,z=minZ+j*celda;v=dentro(limites,x,z)&&!!permitido(x,z);libre.set(k,v);}
  return v;
 };
 const celdaDe=p=>[Math.round((p[0]-minX)/celda),Math.round((p[1]-minZ)/celda)];
 // Si el punto cae sobre un mueble, usa la celda libre más cercana.
 function ajustar(p){
  const [ci,cj]=celdaDe(p),n=Math.ceil(radio/celda);
  let mejor=null,d2=Infinity;
  for(let j=cj-n;j<=cj+n;j++)for(let i=ci-n;i<=ci+n;i++){
   if(!sitio(i,j))continue;
   const d=(i-ci)**2+(j-cj)**2;
   if(d<d2){d2=d;mejor=[i,j];}
  }
  return d2<=n*n?mejor:null;
 }
 const inicio=ajustar(a),fin=ajustar(b);
 if(!inicio||!fin)return null;
 const id=(i,j)=>j*nx+i,meta=id(...fin);
 const costo=new Map([[id(...inicio),0]]),venia=new Map();
 const h=(i,j)=>Math.hypot(i-fin[0],j-fin[1]);
 const abierto=new Monton();abierto.poner(h(...inicio),inicio);
 const cerrado=new Set();
 let hallado=false;
 while(abierto.largo){
  const [i,j]=abierto.sacar(),k=id(i,j);
  if(cerrado.has(k))continue;
  cerrado.add(k);
  if(k===meta){hallado=true;break;}
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
   if(!di&&!dj)continue;
   const ni=i+di,nj=j+dj;
   if(!sitio(ni,nj))continue;
   if(di&&dj&&(!sitio(i+di,j)||!sitio(i,j+dj)))continue; // no cortar esquinas
   if(!permitido(minX+(i+ni)/2*celda,minZ+(j+nj)/2*celda))continue; // ni el punto medio del paso
   const nk=id(ni,nj),c=costo.get(k)+(di&&dj?1.4142:1);
   if(c<(costo.get(nk)??Infinity)){costo.set(nk,c);venia.set(nk,k);abierto.poner(c+h(ni,nj),[ni,nj]);}
  }
 }
 if(!hallado)return null;
 const celdas=[];
 for(let k=meta;k!==undefined;k=venia.get(k))celdas.push([k%nx,Math.floor(k/nx)]);
 celdas.reverse();
 const puntos=celdas.map(([i,j])=>[minX+i*celda,minZ+j*celda]);
 const redondo=p=>[+p[0].toFixed(3),+p[1].toFixed(3)];
 // Extremos exactos si están libres; si no, el centro de la celda libre más cercana.
 if(permitido(a[0],a[1])&&dentro(limites,a[0],a[1]))puntos[0]=[a[0],a[1]];
 if(permitido(b[0],b[1])&&dentro(limites,b[0],b[1]))puntos[puntos.length-1]=[b[0],b[1]];
 // Suaviza: salta de punto en punto cuando la línea recta está libre (se comprueba con la función real).
 const libreRecta=(p,q)=>{
  const pasos=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/(celda/3)));
  for(let s=1;s<pasos;s++){const t=s/pasos;const x=p[0]+(q[0]-p[0])*t,z=p[1]+(q[1]-p[1])*t;if(!dentro(limites,x,z)||!permitido(x,z))return false;}
  return true;
 };
 const lisa=[puntos[0]];
 let desde=0;
 while(desde<puntos.length-1){
  let hasta=puntos.length-1;
  while(hasta>desde+1&&!libreRecta(puntos[desde],puntos[hasta]))hasta--;
  lisa.push(puntos[hasta]);desde=hasta;
 }
 return lisa.map(redondo);
}

// Arma la función que usa la oficina: agenteIr('decisions') o agenteIr('inicio').
export function crearAgenteIr({lugares,piloto,permitido,limites,reducido=()=>false,alLlegar=()=>{}}){
 return function agenteIr(id){
  if(typeof id!=='string'||!piloto||typeof piloto.posicion!=='function')return false;
  const desde=piloto.posicion();
  if(!desde)return false;
  let puesto;
  if(id==='inicio')puesto=piloto.inicio;
  else if(Object.hasOwn(lugares||{},id))puesto=puestoDe(lugares[id]);
  if(!puesto)return false;
  const ruta=rutaEntre(desde,puesto.xz,permitido,limites);
  if(!ruta)return false;
  return piloto.recorrer(ruta,puesto.rot,{inmediato:!!reducido(),destino:id,onArrival:()=>alLlegar(id)});
 };
}
