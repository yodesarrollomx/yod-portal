const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../despacho3d'),vendor=pathToFileURL(path.join(base,'vendor/three.module.js')).href;
const cache=new Map();
function moduleURL(file){if(cache.has(file))return cache.get(file);const src=fs.readFileSync(file,'utf8').replace(/from 'three'/g,`from '${vendor}'`).replace(/from '(\.\.?\/[^']+)'/g,(_,relative)=>`from '${moduleURL(path.resolve(path.dirname(file),relative.split('?')[0]))}'`);const url='data:text/javascript;base64,'+Buffer.from(src).toString('base64');cache.set(file,url);return url;}
const sample=(admission,activity,observed_at=100000)=>({case_id:'example-case',admission,activity,observed_at});
test('residence requires matching identity and fresh evidence; missing data never means baja',async()=>{
 const {autonResidence}=await import('../despacho3d/resident-motion.mjs');
 for(const value of [null,sample('alta','working',9999),sample('alta','working',100001),{...sample('baja'),case_id:'another-case'},sample('alta','invented')])assert.equal(autonResidence(value,'example-case',100000).admission,'unconfirmed');
 assert.equal(autonResidence(sample('baja'),'example-case',100000).destination,null);
 for(const [activity,destination]of [['working','inicio'],['waiting','waiting'],['presenting','presenting']])assert.equal(autonResidence(sample('alta',activity),'example-case',100000).destination,destination);
 assert.equal(autonResidence(sample('standby'),'example-case',100000).destination,'standby');
 assert.equal(autonResidence(sample('alta','waiting',new Date(100000).toISOString()),'example-case',100000).destination,'waiting');
});
test('all six residence slots are accessible with actual office furniture and separated by case',async()=>{
 const {residencePlacement}=await import('../despacho3d/resident-motion.mjs'),{allowed,bounds,annex,places}=await import('../despacho3d/office-layout.mjs'),{rutaEntre}=await import('../despacho3d/entorno-ruta.mjs'),{deskSeat}=await import('../despacho3d/office-station.mjs');
 for(const destination of ['inicio','waiting','standby','presenting','unconfirmed']){
  const unique=new Set();
  for(let slot=0;slot<6;slot++){
   const seat=deskSeat(slot%2?10.05:7,[-7.1,-.85,5.2][Math.floor(slot/2)]),p=residencePlacement(destination,slot,seat);
   assert.ok(allowed(...p.xz),`${destination} slot ${slot} must not be inside a wall or table`);
   const route=rutaEntre([places.entry.eye[0],places.entry.eye[2]],p.xz,allowed,[bounds,annex]);assert.ok(route?.length);
   assert.deepEqual(route.at(-1),p.xz.map(x=>+x.toFixed(3)));unique.add(p.xz.join(','));
   assert.equal(p.seated,['inicio','waiting'].includes(destination));
   if(['standby','waiting','unconfirmed'].includes(destination))assert.ok(p.xz[0]<0,'away from project desks');
  }
  assert.equal(unique.size,6);
 }
});
test('authoritative residence overrides old council and work hints and cancels an obsolete walk',async()=>{
 const {createResidentMotion}=await import('../despacho3d/resident-motion.mjs');let observedAt=100000,state={place:'inicio',motion:'idle'},calls=[];
 const motion=createResidentMotion({caseId:'example-case',authoritative:true,now:()=>observedAt,pilot:{getMovementState:()=>state},navigate:(id,opts)=>{calls.push({id,opts});return true;}});
 motion.observeCouncil({state:'reviewing'});motion.observe({auton_status:sample('alta','waiting'),phase:'ready',checked_at:observedAt,work:{phase:'prepared'}});
 assert.equal(motion.update(4000),true);assert.equal(calls.at(-1).id,'waiting');
 state={place:'inicio',destination:'waiting',motion:'walk'};assert.equal(motion.update(8000),false);
 motion.observe({auton_status:sample('alta','working')});assert.equal(motion.update(8000),true);assert.equal(calls.at(-1).id,'inicio','working must cancel a walk away from the original desk');
 motion.observe({auton_status:sample('alta','presenting')});assert.equal(motion.update(12000),true);assert.equal(calls.at(-1).id,'presenting');
 observedAt+=90001;assert.equal(motion.update(16000),true);assert.equal(calls.at(-1).id,'unconfirmed');
});
test('real residents sit to wait, stand before council, leave on baja and remain revocable',async()=>{
 const [T,{createOfficeResidents}]=await Promise.all([import(vendor),import(moduleURL(path.join(base,'avatars/office-residents.mjs')))]);let now=100000,list;
 const profile={id:'example-case',case_id:'example-case',entity_kind:'case',name:'Caso de prueba',form:'visitor',color:'#547e75'};
 const api={getProfile:()=>profile,subscribeProfile(fn){fn(profile);return()=>{};},subscribeAuthorizedProfiles(fn){list=fn;fn([profile]);return()=>{};},openForCase:()=>true};
 const scene=new T.Scene(),residents=createOfficeResidents({scene,authoritative:true,now:()=>now});residents.bind(api);
 assert.equal(residents.getMovementState().place,'unconfirmed');assert.equal(scene.children[0].userData.motion,'idle');
 const publish=(admission,activity,time)=>{residents.observeWork([{case_id:profile.id,auton_status:sample(admission,activity,now)}]);residents.update(time,{reducedMotion:true});};
 publish('alta','waiting',4000);assert.equal(residents.getMovementState().place,'waiting');assert.equal(scene.children[0].userData.motion,'sit');
 publish('alta','presenting',8000);assert.equal(residents.getMovementState().place,'presenting');assert.equal(scene.children[0].userData.motion,'idle');
 publish('alta','working',12000);assert.equal(residents.getMovementState().place,'inicio');assert.equal(scene.children[0].userData.motion,'sit');
 publish('baja',null,16000);assert.equal(scene.children.length,0);assert.equal(residents.presentations().length,0);
 now+=90001;residents.update(20000,{reducedMotion:true});assert.equal(residents.getMovementState().place,'unconfirmed');assert.equal(scene.children.length,1);
 list([]);residents.observeWork([{case_id:profile.id,auton_status:sample('alta','working',now)}]);residents.update(24000,{reducedMotion:true});assert.equal(scene.children.length,0);residents.dispose();
});
test('HUD and entry use admission rather than an earlier stored work record',async()=>{
 const {avatarPresence}=await import('../despacho3d/avatar-presence.mjs'),{entryView}=await import('../despacho3d/office-entry.mjs');
 const id='example-case',profile={id,case_id:id,entity_kind:'case',name:'Caso de prueba'},now=Date.now();
 const observation={case_id:id,phase:'ready',checked_at:now,work:{case_id:id,phase:'tool',goal_id:'prior-goal',title:'Previous task',current_tool:'drive_leer',progress:{progress:{tasks:[{status:'running'}]}}}};
 for(const [admission,activity,label]of [['alta','waiting','Alta · en espera'],['alta','working','Alta · trabajando'],['alta','presenting','Alta · presentando'],['standby',null,'Stand-by'],['baja',null,'Baja · biblioteca']]){
  const o={...observation,auton_status:sample(admission,activity,now)},p=avatarPresence({profile,observation:o,now});
  assert.equal(p.label,label);assert.equal(entryView({case_id:id,name:'Caso de prueba',avatar:profile},{},o).status,label);
  if(!['working','presenting'].includes(activity)){assert.equal(p.goal_id,null);assert.equal(p.progress,null);assert.equal(entryView({case_id:id,avatar:{name:'Caso de prueba'}},{},o).detail,'');}
 }
 for(const status of [null,{...sample('alta','working',now),case_id:'another-case'},sample('alta','working',now-90001)])assert.equal(avatarPresence({profile,observation:{...observation,auton_status:status},now}).label,'Estado sin confirmar');
 assert.equal(avatarPresence({profile,observation,now,authoritative:true}).label,'Estado sin confirmar');
});
test('mounted entry subscribes to all-case status without replacing current work or retaining a failed read',async()=>{
 const {mountOfficeEntry}=await import('../despacho3d/office-entry.mjs');const id='example-case',now=Date.now();
 const element=()=>({textContent:'',hidden:false,dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(){},removeEventListener(){}});
 const fields=Object.fromEntries(['name','project','status','detail'].map(k=>['[data-entry-'+k+']',element()])),host={dataset:{},querySelector:s=>fields[s]},trigger={...element(),querySelector:()=>element()};
 let publishRoom,unsubscribed=false;
 const selection={case_id:id,name:'Caso de prueba',avatar:{id,case_id:id,entity_kind:'case',name:'Autón de prueba'}},work={case_id:id,phase:'ready',checked_at:now,work:{case_id:id,phase:'tool',goal_id:'old-goal',title:'Previous task',current_tool:'drive_leer'}};
 const win={YodResidentAgents:{getSelection:()=>selection,snapshot:()=>({phase:'ready'}),subscribe:()=>()=>{}},YodWorkObserver:{snapshot:()=>work},YodRoomWork:{subscribe(fn){publishRoom=fn;fn([{case_id:id,auton_status:sample('alta','waiting',now)}]);return()=>{unsubscribed=true;};}},YodAgentMenu:{showRadial:()=>true},addEventListener(){},removeEventListener(){}};
 const entry=mountOfficeEntry({win,doc:{getElementById:id=>id==='office-entry'?host:trigger}});
 assert.equal(fields['[data-entry-status]'].textContent,'Alta · en espera');assert.equal(fields['[data-entry-detail]'].textContent,'');
 publishRoom([{case_id:id,auton_status:null}]);assert.equal(fields['[data-entry-status]'].textContent,'Estado sin confirmar');assert.equal(fields['[data-entry-detail]'].textContent,'');
 entry.dispose();assert.equal(unsubscribed,true);
});
