const test=require('node:test'),assert=require('node:assert/strict');
const {createDOM}=require('./helpers/puesto-dom.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
const fixture=()=>({ok:true,schema:1,case_id:'test-case',sessions:[{id:'session-1',case_id:'test-case',goal_id:'goal-1',title:'Prueba <script>',revision:1,state:'ready',stage:'potential',reviews:[],feedback:[],tasks:[],summary:'Resultado sintético',updated_at:new Date().toISOString(),notification:{state:'not_configured'}}]});
test('returned tasks show literal IDs safely and retain tasks with an empty ID',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),data=fixture();
 data.sessions[0].tasks=[{id:'task-synthetic-1',title:'Revisar',criterion:'Criterio',state:'pending'},{id:'<img src=x onerror=alert(1)>',title:'Otra',criterion:'Texto',state:'resolved'},{id:'',title:'Sin identificador',criterion:'Conservar',state:'needs_input'}];
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',request:async()=>data});view.open('test-case');await tick();
 assert.match(host.textContent,/ID: task-synthetic-1 · Revisar/);assert.match(host.textContent,/ID: <img src=x onerror=alert\(1\)> · Otra/);assert.match(host.textContent,/Sin identificador — Conservar · necesita información/);
 assert.equal(host.querySelector('img'),null);assert.equal(host.querySelector('script'),null);view.clear();
});
test('tasks without an ID property remain invalid under the existing DTO contract',async()=>{const {validateCouncil}=await import('../despacho3d/council-model.mjs');const data=fixture();data.sessions[0].tasks=[{title:'Legado',criterion:'Lectura',state:'pending'}];assert.throws(()=>validateCouncil(data,'test-case'),/invalid_council/);});
test('notification status is displayed without sending or replaying mail',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {validateCouncil}=await import('../despacho3d/council-model.mjs');
 for(const [state,label] of [['not_configured','conexión pendiente'],['pending','por enviar'],['sent','envío confirmado'],['uncertain','envío sin confirmar'],['suppressed','no solicitado']]){
  const {doc}=createDOM(),host=doc.createElement('section'),data=fixture(),calls=[];data.sessions[0].notification={state};if(state==='suppressed')data.sessions[0].notification_policy='suppressed_unspecified';
  const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>false,request:async(path,body)=>{calls.push({path,body});return data;}});
  view.open('test-case');await tick();assert.ok(host.textContent.includes('Correo: '+label));assert.deepEqual(calls.map(c=>c.path),['/council/read']);
  assert.equal(host.querySelectorAll('button').find(b=>b.textContent==='Aceptar esta entrega').disabled,true);
  assert.throws(()=>validateCouncil(data,'other-case'),/invalid_council/);view.clear();
 }
 const unknown=fixture();unknown.sessions[0].notification.state='unknown';assert.throws(()=>validateCouncil(unknown,'test-case'),/invalid_council/);
});
test('suppressed mail remains visible when a task limit prevents actions',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const data=fixture(),{doc}=createDOM(),host=doc.createElement('section'),calls=[];
 Object.assign(data.sessions[0],{state:'needs_input',blocked_reason:'task_limit',next_action:'new_delivery_required',blocked_message:'Nueva entrega requerida',notification:{state:'suppressed'}});
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',request:async path=>{calls.push(path);return data;}});view.open('test-case');await tick();
 assert.match(host.textContent,/Correo: no solicitado/);assert.deepEqual(calls,['/council/read']);view.clear();
});
test('council validates case boundaries and uses persisted state for location',async()=>{const {validateCouncil,councilLocation,AUTON_STAGES}=await import('../despacho3d/council-model.mjs');assert.equal(validateCouncil(fixture(),'test-case').sessions.length,1);assert.throws(()=>validateCouncil(fixture(),'other'));assert.throws(()=>validateCouncil({...fixture(),sessions:[{...fixture().sessions[0],state:'fake'}]},'test-case'));assert.equal(councilLocation({state:'reviewing'}),'decisions');assert.equal(councilLocation({state:'correcting'}),'inicio');assert.equal(councilLocation({state:'interrupted'}),null);assert.deepEqual(AUTON_STAGES,['potential','codevelopment','project','construction','sales']);});
test('late council read cannot restore a revoked case',async()=>{const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section');let id='test-case',resolve;const view=mountCouncil({container:host,doc,getCase:()=>id,request:()=>new Promise(r=>resolve=r)});view.open(id);id=null;view.clear();resolve(fixture());await tick();assert.equal(host.children.length,0);});
test('uncertain feedback retries same id and text; accept disabled until confirmed',async()=>{const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),writes=[];let lost=true;const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,uuid:()=>'stable-id',request:async(path,body)=>{if(path.endsWith('read'))return fixture();writes.push(structuredClone(body));if(lost){lost=false;throw Error('timeout');}return {...fixture(),request_id:body.request_id};}});view.open('test-case');await tick();assert.match(host.textContent,/Prueba <script>/);const input=host.querySelector('textarea');input.value='Mi observación';input.oninput();host.querySelector('form').onsubmit({preventDefault(){}});await tick();assert.equal(host.querySelector('textarea').disabled,true);assert.equal(host.querySelectorAll('button').find(x=>x.textContent==='Aceptar esta entrega').disabled,true);host.querySelector('form').onsubmit({preventDefault(){}});await tick();assert.deepEqual(writes[0],writes[1]);assert.equal(writes[0].text,'Mi observación');assert.match(host.textContent,/Observaciones guardadas/);view.clear();});
test('stage and review changes do not create a replacement identity',async()=>{const {validateCouncil}=await import('../despacho3d/council-model.mjs');const original=fixture();for(const stage of ['potential','codevelopment','project','construction','sales']){original.sessions[0].stage=stage;assert.equal(validateCouncil(original,'test-case').sessions[0].case_id,'test-case');}});
const lifecycle=()=>({case_id:'test-case',revision:2,stage:'codevelopment',events:[{id:'initial',case_id:'test-case',revision:1,from:'unconfirmed',to:'potential',kind:'initial_registration',actor:'Dirección sintética',reason:'Potencial documentado',source_ref:'synthetic:1',at:'2026-10-26T16:00:00Z'},{id:'next',case_id:'test-case',revision:2,from:'potential',to:'codevelopment',kind:'transition',actor:'Dirección sintética',reason:'Acuerdo sintético',source_ref:'synthetic:2',at:'2026-10-27T16:00:00Z'}]});
test('lifecycle rejects a foreign case, broken chain, duplicate event and invented current stage',async()=>{const {validateCouncil}=await import('../despacho3d/council-model.mjs');const good={...fixture(),lifecycle:lifecycle()};assert.equal(validateCouncil(good,'test-case').lifecycle.stage,'codevelopment');for(const edit of [x=>x.case_id='other',x=>x.events[1].case_id='other',x=>x.events[1].from='sales',x=>x.events[1].id='initial',x=>x.stage='sales',x=>x.revision=3,x=>x.events[0].source_ref='',x=>x.events[0].actor=null]){const bad=structuredClone(good);edit(bad.lifecycle);assert.throws(()=>validateCouncil(bad,'test-case'));}});
test('current stage and historical presentation remain separate in the room',async()=>{const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section');const view=mountCouncil({container:host,doc,getCase:()=>'test-case',request:async()=>({...fixture(),lifecycle:lifecycle()})});view.open('test-case');await tick();assert.match(host.textContent,/Etapa registrada en el consejo: Codesarrollo/);assert.match(host.textContent,/Etapa al presentar: Potencial/);assert.match(host.textContent,/Potencial → Codesarrollo/);assert.match(host.textContent,/Hermosillo/);assert.match(host.textContent,/Referencia declarada: synthetic:2/);assert.match(host.textContent,/PPP todavía no está vinculada/);view.clear();assert.equal(host.children.length,0);});
test('history remains visible without sessions and legacy responses do not invent a current stage',async()=>{const {mountCouncil}=await import('../despacho3d/council-view.mjs');for(const data of [{...fixture(),sessions:[],lifecycle:lifecycle()},fixture()]){const {doc}=createDOM(),host=doc.createElement('section');const view=mountCouncil({container:host,doc,getCase:()=>'test-case',request:async()=>data});view.open('test-case');await tick();assert.match(host.textContent,/Un autón · una historia/);assert.match(host.textContent,data.lifecycle?/Historial de etapas · 2/:/Etapa registrada en el consejo: Etapa por confirmar/);view.clear();}});

const partial=()=>{const value=fixture();Object.assign(value.sessions[0],{state:'interrupted',revision:26,round:2,resume_available:true});return value;};
const findButton=(host,label)=>host.querySelectorAll('button').find(x=>x.textContent===label);
test('resume is an explicit capability: opening and reopening only read the same session',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),calls=[];
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,request:async(path,body)=>{calls.push({path,body});return partial();}});
 view.open('test-case');await tick();assert.equal(findButton(host,'Reanudar revisión').disabled,false);assert.equal(findButton(host,'Devolver al consejo').disabled,true);assert.equal(host.querySelector('textarea').disabled,true);
 view.clear();view.open('test-case');await tick();assert.equal(calls.length,2);assert.ok(calls.every(x=>x.path==='/council/read'));assert.equal(findButton(host,'Reanudar revisión').disabled,false);view.clear();
});
test('resume keeps the exact id and revision after a lost acknowledgement and does not send feedback',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),writes=[];let server=partial(),lost=true,ids=0,reads=0;
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,uuid:()=>{ids++;return 'resume-id';},request:async(path,body)=>{
  if(path==='/council/read'){reads++;return server;}writes.push(structuredClone(body));server=partial();Object.assign(server.sessions[0],{state:'queued',revision:27,resume_available:false});
  if(lost){lost=false;throw Error('timeout');}return {...server,request_id:body.request_id};
 }});
 view.open('test-case');await tick();const control=findButton(host,'Reanudar revisión');control.onclick();control.onclick();await tick();assert.equal(writes.length,1);assert.equal(ids,1);
 assert.deepEqual(writes[0],{request_id:'resume-id',session_id:'session-1',expected_revision:26,action:'resume',text:''});
 host.querySelector('form').onsubmit({preventDefault(){}});await tick();assert.equal(writes.length,1);assert.equal(host.querySelector('select').disabled,true);
 for(let i=0;i<5;i++)assert.equal(await view.refresh(),false);assert.equal(reads,1);assert.equal(writes.length,1);assert.equal(findButton(host,'Comprobar la misma reanudación').disabled,false);
 findButton(host,'Actualizar consejo').onclick();await tick();assert.equal(reads,2);assert.equal(writes.length,1);assert.match(host.textContent,/Comprobar la misma reanudación/);
 findButton(host,'Comprobar la misma reanudación').onclick();await tick();assert.deepEqual(writes[1],writes[0]);assert.equal(ids,1);assert.equal(server.sessions[0].feedback.length,0);assert.match(host.textContent,/Reanudación guardada/);assert.equal(findButton(host,'Reanudar revisión'),undefined);view.clear();
});
test('resume requires a fresh read after a stale revision without silently issuing another request',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section');let writes=0;
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,request:async(path)=>{if(path==='/council/read')return partial();writes++;throw Error('stale_revision');}});
 view.open('test-case');await tick();findButton(host,'Reanudar revisión').onclick();await tick();assert.match(host.textContent,/Actualiza antes de responder/);assert.equal(findButton(host,'Reanudar revisión').disabled,true);
 findButton(host,'Reanudar revisión').onclick();await tick();assert.equal(writes,1);assert.equal(await view.refresh(),false);assert.equal(findButton(host,'Reanudar revisión').disabled,true);findButton(host,'Actualizar consejo').onclick();await tick();assert.equal(findButton(host,'Reanudar revisión').disabled,false);view.clear();
});
test('background polling leaves the selected resumable session actionable while manual refresh still reads',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),calls=[],value=partial();
 value.sessions.push({...fixture().sessions[0],id:'session-2'});
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,request:async(path,body)=>{calls.push({path,body});return value;}});
 view.open('test-case');await tick();assert.equal(calls.length,1);assert.equal(await view.refresh(),false);assert.equal(calls.length,1);findButton(host,'Actualizar consejo').onclick();await tick();assert.equal(calls.length,2);
 const selector=host.querySelector('select');selector.value='session-1';selector.onchange();
 for(let i=0;i<8;i++){assert.equal(await view.refresh(),false);assert.equal(findButton(host,'Reanudar revisión').disabled,false);}
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c.path==='/council/read'));
 findButton(host,'Actualizar consejo').onclick();await tick();assert.equal(calls.length,3);assert.equal(findButton(host,'Reanudar revisión').disabled,false);assert.ok(calls.every(c=>c.path==='/council/read'));view.clear();
});
test('polling follows active states while terminal and empty histories require manual refresh',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');
 for(const state of ['queued','reviewing','correcting','ready','accepted','empty']){
  const {doc}=createDOM(),host=doc.createElement('section'),data=fixture(),calls=[];
  if(state==='empty')data.sessions=[];else data.sessions[0].state=state;
  const view=mountCouncil({container:host,doc,getCase:()=>'test-case',request:async(path)=>{calls.push(path);return data;}});
  view.open('test-case');await tick();const active=['queued','reviewing','correcting'].includes(state);
  assert.equal(await view.refresh(),active,state);assert.equal(calls.length,active?2:1,state);
  findButton(host,'Actualizar consejo').onclick();await tick();assert.equal(calls.length,active?3:2,state);
  view.clear();view.open('test-case');await tick();assert.equal(calls.length,active?4:3,state);
  assert.ok(calls.every(path=>path==='/council/read'));view.clear();
 }
});
test('slow active read permits selection, coalesces polling, and never writes',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),data=fixture(),calls=[];let release;
 data.sessions[0].state='reviewing';data.sessions.push({...fixture().sessions[0],id:'session-2',title:'Segunda'});
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,request:async path=>{calls.push(path);return calls.length===1?data:new Promise(resolve=>{release=resolve;});}});
 view.open('test-case');await tick();const reading=view.refresh();await tick();assert.equal(calls.length,2);
 for(let i=0;i<5;i++)assert.equal(await view.refresh(),false);assert.equal(calls.length,2);
 let selector=host.querySelector('select');assert.equal(selector.disabled,false);selector.value='session-1';selector.onchange();assert.match(host.textContent,/Prueba <script>/);
 assert.equal(findButton(host,'Aceptar esta entrega').disabled,true);release(data);assert.equal(await reading,true);assert.match(host.textContent,/Prueba <script>/);
 assert.deepEqual(calls,['/council/read','/council/read']);view.clear();
});
test('a deferred mutation blocks polling, selection, and duplicate submission',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),data=fixture(),calls=[];let release;
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,uuid:()=>'request-test',request:async(path,body)=>{calls.push({path,body});if(path==='/council/read')return data;return new Promise(resolve=>{release=resolve;});}});
 view.open('test-case');await tick();const input=host.querySelector('textarea');input.value='Observación';input.oninput();const form=host.querySelector('form');form.onsubmit({preventDefault(){}});form.onsubmit({preventDefault(){}});await tick();
 assert.equal(host.querySelector('select').disabled,true);assert.equal(await view.refresh(),false);assert.equal(calls.length,2);
 release({...data,request_id:'request-test'});await tick();assert.equal(calls.length,2);assert.match(host.textContent,/Observaciones guardadas/);view.clear();
});
test('deterministic task limit explains the next step and offers no feedback, acceptance or resume',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');const {doc}=createDOM(),host=doc.createElement('section'),value=partial();let writes=0;
 Object.assign(value.sessions[0],{state:'needs_input',resume_available:false,blocked_reason:'task_limit',blocked_message:'La observación quedó guardada. Hace falta una nueva entrega.',next_action:'new_delivery_required'});
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>true,request:async(path)=>{if(path!=='/council/read')writes++;return value;}});
 view.open('test-case');await tick();assert.match(host.textContent,/Hace falta una nueva entrega/);assert.match(host.textContent,/La sesión y su historial se conservan/);assert.equal(host.querySelector('form'),null);assert.equal(host.querySelector('textarea'),null);
 for(const label of ['Reanudar revisión','Aceptar esta entrega','Devolver al consejo'])assert.equal(findButton(host,label),undefined);await view.refresh();assert.equal(writes,0);view.clear();
});
test('resume is unavailable without the server capability or current write permission',async()=>{
 const {mountCouncil}=await import('../despacho3d/council-view.mjs');for(const mode of ['legacy','readonly']){const {doc}=createDOM(),host=doc.createElement('section'),value=partial();let writes=0;if(mode==='legacy')delete value.sessions[0].resume_available;
 const view=mountCouncil({container:host,doc,getCase:()=>'test-case',canWrite:()=>mode!=='readonly',request:async(path)=>{if(path!=='/council/read')writes++;return value;}});view.open('test-case');await tick();const control=findButton(host,'Reanudar revisión');if(mode==='legacy')assert.equal(control,undefined);else{assert.equal(control.disabled,true);control.onclick();await tick();}assert.equal(writes,0);view.clear();}
});
test('council rejects inconsistent resume and blocked markers',async()=>{
 const {validateCouncil}=await import('../despacho3d/council-model.mjs');const valid=partial();assert.equal(validateCouncil(valid,'test-case').sessions[0].resume_available,true);
 for(const edit of [s=>s.resume_available='yes',s=>s.state='ready',s=>{s.blocked_reason='task_limit';s.blocked_message='Falta entrega';s.next_action='new_delivery_required';},s=>{s.state='needs_input';s.resume_available=false;s.blocked_reason='unknown';s.blocked_message='Falta entrega';s.next_action='new_delivery_required';},s=>{s.state='needs_input';s.resume_available=false;s.blocked_reason='task_limit';s.blocked_message='';s.next_action='new_delivery_required';}]){const bad=structuredClone(valid);edit(bad.sessions[0]);assert.throws(()=>validateCouncil(bad,'test-case'),/invalid_council/);}
});

