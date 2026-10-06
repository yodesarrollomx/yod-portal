// Geometría de navegación compartida; las pruebas la comparan con los muebles de scene.js.
export const places={
 editing:{label:'Sala de edición',eye:[-18,1.65,.7],target:[-18,1.7,-6.9]},
 editorial:{label:'Mesa editorial',eye:[-21,1.65,-5.8],target:[-20.7,1.9,-7.9]},
 funnel:{label:'Embudo comercial',eye:[-15.1,1.65,-5.8],target:[-15.25,1.9,-7.9]},
 entry:{label:'Entrada al Despacho',eye:[-4.8,1.65,7.7],target:[-1,1.5,-3.5]},
 reception:{label:'Recepción',eye:[-8.3,1.65,-4.5],target:[-8.2,1.8,-8.5]},
 patio:{label:'Patio central',eye:[-4.45,1.65,.7],target:[0,1.6,-1]},
 potential:{label:'Potenciales',eye:[8.65,1.65,-4.55],target:[8.3,1.1,-7.2]},
 case:{label:'Puesto del proyecto',eye:[8.0,1.65,-5.6],target:[7,1.23,-7.22]},
 projects:{label:'Proyectos y permisos',eye:[8.5,1.65,1.65],target:[8.5,1.1,-1.6]},
 delivery:{label:'Obra y ventas',eye:[8.5,1.65,7.7],target:[8.5,1.1,4.8]},
 decisions:{label:'Decisiones',eye:[3.4,1.65,6.5],target:[-.2,1.1,6.3]},
 lounge:{label:'Sala de encuentro',eye:[-5.65,1.65,4.1],target:[-8.5,1.1,2.9]}
};
export const bounds={minX:-11.65,maxX:11.65,minZ:-9.14,maxZ:9.12};
export const annex={minX:-23.65,maxX:-11.5,minZ:-7.75,maxZ:6.85};
export const collisions=[];
const block=(x,z,w,d)=>collisions.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
for(const [z,d] of [[-5.75,7.5],[5.35,8.3]])block(-12,z,.16,d);
block(-8.25,-7.45,5,1.65);block(0,-1,6.1,6.1);
for(const z of [-6.45,-.2,5.85]){
 block(7,z-.65,2.03,1);block(10.05,z-.65,2.03,1);
 if(z!==5.85)block(8.72,z+2.62,6.55,.15);
 block(5.45,z-.35,.16,3.85);
}
block(-8.55,2,3.45,1.3);block(-8.45,3.4,2.15,1.15);block(-.3,6.3,4.86,1.66);
block(-18,-3.1,4.86,1.7);
for(const x of [-21.6,-18,-14.4]){block(x,3.7,2.03,1);block(x,3.7,2.03,1.05);}
block(-8.35,-2.5,4.9,.60);
for(const p of Object.values(places)){Object.freeze(p.eye);Object.freeze(p.target);Object.freeze(p);}
Object.freeze(places);Object.freeze(bounds);Object.freeze(annex);
collisions.forEach(Object.freeze);Object.freeze(collisions);
export function allowed(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 const inside=b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ;
 return (inside(bounds)||inside(annex))&&!collisions.some(c=>x>c.minX-.22&&x<c.maxX+.22&&z>c.minZ-.22&&z<c.maxZ+.22);
}
