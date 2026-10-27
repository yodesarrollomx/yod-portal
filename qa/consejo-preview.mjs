import * as T from 'three';
import {createOffice} from '../despacho3d/scene.js';
import {createCouncilAvatars} from '../despacho3d/avatars/council.mjs';
import {createAvatar,animateAvatar} from '../despacho3d/avatars/avatar.mjs';
import {mountCouncil} from '../despacho3d/council-view.mjs';
import {COUNCIL_ROLES} from '../despacho3d/council-model.mjs';
const session={id:'synthetic-session',case_id:'synthetic-case',goal_id:'synthetic-goal',title:'Proyecto de prueba · viabilidad',stage:'potential',revision:1,state:'ready',summary:'La propuesta está lista para revisión de Dirección, con condiciones y fuentes identificadas.',round:1,active_role:null,reviews:COUNCIL_ROLES.map(r=>({role:r.id,round:1,verdict:'pass',comment:'Revisión sintética de '+r.name.toLowerCase()+': criterio respaldado; comprobar la fuente antes de decidir.',evidence_ids:['evidence-example']})),tasks:[{id:'task-example',title:'Conciliar el programa',criterion:'Una sola versión y su fuente',state:'resolved'}],feedback:[],notification:{state:'not_configured'},updated_at:new Date().toISOString()};
const request=async(path,body)=>{if(path==='/council/respond'){if(body.action==='feedback'){session.feedback.push({text:body.text,at:new Date().toISOString()});session.state='queued';}else session.state='accepted';session.revision++;}return {ok:true,schema:1,case_id:session.case_id,sessions:[structuredClone(session)],request_id:body.request_id};};
mountCouncil({container:document.querySelector('#panel'),request,getCase:()=>session.case_id,canWrite:()=>true,uuid:()=>'synthetic-request-'+Date.now()}).open(session.case_id);
document.querySelector('#small').onclick=()=>document.querySelector('#panel').classList.toggle('mobile');
const host=document.querySelector('#scene');
try {
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth,host.clientHeight);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.localClippingEnabled=true;host.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e9e6d9');scene.add(new T.HemisphereLight('#fff7e9','#8c9a8b',2.5));const light=new T.DirectionalLight('#fff8df',3);light.position.set(3,10,3);scene.add(light);
const office=await createOffice({pilotFigure:false});scene.add(office.model);office.setCutaway('roof');
const council=createCouncilAvatars({scene});council.setAuthorized(true);
const auton=createAvatar('spirit','#4b9891','Autón de prueba',{seed:'synthetic-case',quality:'office'});auton.position.set(3.25,0,6);auton.rotation.y=-Math.PI/2;animateAvatar(auton,0,false,false,'idle');scene.add(auton);
const camera=new T.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,100);camera.position.set(8,7,12);camera.lookAt(-.2,.6,6.3);
function paint(){renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.render(scene,camera);}paint();addEventListener('resize',paint);

}catch{host.style.height='auto';host.style.padding='24px';host.textContent='Vista 3D no disponible en este navegador. El consejo sigue accesible en la vista de abajo.';}
