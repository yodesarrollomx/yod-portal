import * as T from 'three';
import {FORMS,createAvatar,animateAvatar,disposeAvatar} from './avatar.mjs';
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(300,350);renderer.toneMapping=T.ACESFilmicToneMapping;
const camera=new T.PerspectiveCamera(32,300/350,.1,25);camera.position.set(0,1.35,5.1);camera.lookAt(0,1.18,0);let n=0;
for(const [form,title] of Object.entries(FORMS)){
 const scene=new T.Scene();scene.background=new T.Color('#e8ebe2');scene.add(new T.HemisphereLight('#fff7e9','#8d9b8a',2.5));const light=new T.DirectionalLight('#fff3d8',3);light.position.set(2,5,4);scene.add(light);const model=createAvatar(form,['#42887d','#8f81a7','#ab825c','#698baa'][n%4],'Ejemplo '+n,{seed:'synthetic-'+n,myth:form==='deity'?'huitzilopochtli':'guardian',role:'messenger'});model.rotation.y=-.25;scene.add(model);animateAvatar(model,1,false,false);renderer.render(scene,camera);const card=document.createElement('article');card.className='card';const canvas=document.createElement('canvas');canvas.width=300;canvas.height=350;canvas.getContext('2d').drawImage(renderer.domElement,0,0);canvas.setAttribute('aria-label',title);const label=document.createElement('b');label.textContent=title;card.append(canvas,label);document.getElementById('grid').append(card);disposeAvatar(model);n++;
}
renderer.dispose();renderer.forceContextLoss();document.getElementById('status').textContent=n+' familias renderizadas · v3';window.avatarDemoReady=true;
