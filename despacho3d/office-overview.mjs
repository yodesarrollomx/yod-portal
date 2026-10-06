import * as T from 'three';

// Fixed oblique view: world sizes stay legible across the office.
export const OFFICE_EXTENTS={min:[-24.5,-.35,-9.8],max:[12.5,4,9.8]};
export function fitOfficeOverview(camera,controls,aspect){
 const target=new T.Vector3(-6,.8,0),direction=new T.Vector3(.65,1.3,1).normalize();
 const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize();
 const up=new T.Vector3().crossVectors(direction,right);
 let width=0,height=0;
 for(const x of [OFFICE_EXTENTS.min[0],OFFICE_EXTENTS.max[0]])
 for(const y of [OFFICE_EXTENTS.min[1],OFFICE_EXTENTS.max[1]])
 for(const z of [OFFICE_EXTENTS.min[2],OFFICE_EXTENTS.max[2]]){
  const delta=new T.Vector3(x,y,z).sub(target);
  width=Math.max(width,Math.abs(delta.dot(right))*2);
  height=Math.max(height,Math.abs(delta.dot(up))*2);
 }
 const safeAspect=Math.max(.1,Number.isFinite(aspect)?aspect:1);
 const halfHeight=Math.max(height,width/safeAspect)*.62;
 Object.assign(camera,{left:-halfHeight*safeAspect,right:halfHeight*safeAspect,top:halfHeight,bottom:-halfHeight,zoom:1});
 camera.position.copy(target).addScaledVector(direction,65);camera.lookAt(target);
 camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 controls.target.copy(target);controls.update();
 return camera;
}
export function visibleOfficeHit(hit,cutaway,height=.95){
 const materials=Array.isArray(hit.object?.material)?hit.object.material:[hit.object?.material];
 return !(cutaway&&materials.some(m=>m?.userData?.officePartition)&&hit.point?.y>height);
}
