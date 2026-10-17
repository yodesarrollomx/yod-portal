// Render the exact authorized appearance used in the room, never a generated stand-in.
export function mountAvatarCard({container,doc=document,win=window,compact=false,onNavigate=null}){
 let epoch=0,fingerprint='';const el=(t,text)=>{const n=doc.createElement(t);if(text)n.textContent=text;return n;};
 function clear(){fingerprint='';epoch++;container.replaceChildren();}
 async function open(selection){
  const p=selection?.avatar,key=p?JSON.stringify([p,selection.can_enqueue,selection.agent_ready,selection.goals]):'';if(key&&key===fingerprint)return;
  clear();const own=epoch;if(!p||p.case_id!==selection.case_id)return;fingerprint=key;
  const heading=el('h2',p.name||selection.name),portrait=el('div');
  portrait.className='avatar-portrait'+(compact?'':' avatar-portrait-actions');if(compact)container.append(portrait);else{
   container.append(heading,portrait,el('p',selection.name),el('h3','Qué puedes hacer aquí'));
   const capabilities=el('ul');
   for(const label of [selection.can_enqueue&&selection.agent_ready?'Conversación habilitada para tu sesión.':'Conversación en consulta; el envío no está habilitado.',selection.goals?.ready?(selection.goals.worker_ready?'Seguimiento de encargos habilitado; consulta Trabajo para ver el avance real.':'Puedes consultar encargos; el ejecutor está pendiente de conexión.'):'El seguimiento de encargos todavía no está conectado.'])capabilities.append(el('li',label));
   container.append(capabilities,el('p','El expediente muestra las fuentes de este proyecto. El PPP conserva sus decisiones y sólo cambia con una propuesta confirmada.'));
   if(typeof onNavigate==='function'){
    const actions=el('nav');actions.setAttribute('aria-label','Acciones del autón');
    for(const [id,label]of [['activity','Ver trabajo y siguiente paso'],['sources','Consultar fuentes'],['ppp','Abrir plan de potencial']]){const b=el('button',label);b.type='button';b.addEventListener('click',()=>onNavigate(id));actions.append(b);}
    container.append(actions);
   }
  }
  let renderer,model;
  try{
   const [T,avatar]=await Promise.all([import('three'),import('./avatars/avatar.mjs?v=126')]);if(own!==epoch)return;
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
