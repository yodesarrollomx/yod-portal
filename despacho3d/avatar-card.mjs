// Render the exact authorized appearance used in the room, never a generated stand-in.
export function mountAvatarCard({container,doc=document,win=window}){
 let epoch=0;const el=(t,text)=>{const n=doc.createElement(t);if(text)n.textContent=text;return n;};
 function clear(){epoch++;container.replaceChildren();}
 async function open(selection){
  clear();const own=epoch,p=selection?.avatar;if(!p||p.case_id!==selection.case_id)return;
  const heading=el('h2',p.name||selection.name),portrait=el('div'),description=el('p','Represento este plan de potencial. Mi expediente, objetivos y evidencias pertenecen a este proyecto; comparto herramientas con los otros autónomos.');
  portrait.className='avatar-portrait';container.append(heading,portrait,el('p',selection.name),description,
   el('p','Mi color y apariencia permiten reconocerme en la oficina. Mi avance se comprueba en Trabajo y mis entregas se presentan desde Pendientes.'));
  let renderer,model;
  try{
   const [T,avatar]=await Promise.all([import('three'),import('./avatars/avatar.mjs?v=2')]);if(own!==epoch)return;
   renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:true});renderer.setSize(280,320);renderer.setPixelRatio(Math.min(win.devicePixelRatio||1,2));
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,280/320,.1,20);camera.position.set(0,1.35,5.1);camera.lookAt(0,1.18,0);
   scene.add(new T.HemisphereLight('#fff7e9','#8d9b8a',2.5));const light=new T.DirectionalLight('#fff3d8',3);light.position.set(2,5,4);scene.add(light);
   model=avatar.createAvatar(p.form,p.color,p.name,{...p.visual,seed:p.id,quality:'office'});model.rotation.y=-.25;scene.add(model);avatar.animateAvatar(model,0,false,false);
   renderer.render(scene,camera);const canvas=el('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;canvas.getContext('2d').drawImage(renderer.domElement,0,0);canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Avatar de '+(p.name||selection.name));
   if(own===epoch)portrait.append(canvas);avatar.disposeAvatar(model);model=null;
  }catch{if(own===epoch)portrait.append(el('p','La vista del avatar no pudo renderizarse en este equipo.'));}
  finally{renderer?.dispose();renderer?.forceContextLoss();}
 }
 return{open,clear};
}
