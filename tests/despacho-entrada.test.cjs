const test=require('node:test'),assert=require('node:assert/strict');
test('entry only describes the authorized case and clears late work from a previous one',async()=>{
 const {entryView}=await import('../despacho3d/office-entry.mjs');
 const a={case_id:'synthetic-a',name:'Proyecto A',avatar:{name:'Autón A'}},b={case_id:'synthetic-b',name:'Proyecto B',avatar:{name:'Autón B'}};
 const work={case_id:a.case_id,phase:'ready',work:{phase:'tool',current_tool:'Leyendo fuente',title:'Tarea A'}};
 assert.deepEqual(entryView(a,{},work),{ready:true,name:'Autón A',project:'Proyecto A',caseId:'synthetic-a',status:'Leyendo fuente',detail:'Tarea A'});
 const changed=entryView(b,{},work);
 assert.equal(changed.caseId,b.case_id);assert.equal(changed.detail,'');assert.equal(changed.status,'Consultando actividad…');
 for(const phase of ['loading','reconnecting','unauthorized']){
  const revoked=entryView(null,{phase},work);
  assert.equal(revoked.ready,false);assert.equal(revoked.caseId,null);assert.equal(revoked.detail,'');
  assert.doesNotMatch(JSON.stringify(revoked),/Tarea A|Autón A|Proyecto A/);
 }
 assert.equal(entryView(a,{}, {...work,phase:'unavailable'}).detail,'','offline work cannot be described as the current task');
 assert.equal(entryView(a,{}, {...work,work:null}).status,'En espera · sin ejecución registrada');
});

test('mounted entry distinguishes choosing a project from access validation and clears a revoked case',async()=>{
 const {mountOfficeEntry}=await import('../despacho3d/office-entry.mjs');
 const element=()=>({textContent:'',hidden:false,dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(){},removeEventListener(){}});
 const fields=Object.fromEntries(['name','project','status','detail'].map(k=>['[data-entry-'+k+']',element()]));
 const host={dataset:{},querySelector:s=>fields[s]},action=element(),number=element();
 const trigger={...element(),querySelector:s=>s==='.case-number'?number:action};
 let selection=null,phase='loading',notify,opened=[];
 const resident={getSelection:()=>selection,snapshot:()=>({phase}),subscribe:fn=>{notify=fn;return ()=>{};}};
 const observation={case_id:'synthetic-a',phase:'ready',work:{title:'Tarea privada anterior',phase:'tool',current_tool:'Leyendo fuente'}};
 const win={YodResidentAgents:resident,YodWorkObserver:{snapshot:()=>observation},YodAgentMenu:{showRadial:id=>{opened.push(id);return true;}},addEventListener(){},removeEventListener(){}};
 const entry=mountOfficeEntry({win,doc:{getElementById:id=>id==='office-entry'?host:trigger}});
 assert.equal(action.textContent,'Validando acceso');assert.equal(trigger.disabled,true);
 phase='selection_required';notify();
 assert.equal(fields['[data-entry-status]'].textContent,'Elige un proyecto');
 assert.equal(action.textContent,'Elige un proyecto');assert.match(trigger.attributes['aria-label'],/Elige un proyecto autorizado/);
 assert.equal(trigger.disabled,true);assert.equal(host.dataset.caseId,'');assert.equal(entry.open(),false);assert.deepEqual(opened,[]);
 selection={case_id:'synthetic-a',name:'Proyecto A',avatar:{name:'Autón A'}};phase='ready';notify();
 assert.equal(trigger.disabled,false);assert.equal(action.textContent,'Opciones del autón');assert.equal(entry.open(),true);assert.deepEqual(opened,['synthetic-a']);
 selection=null;phase='selection_required';notify();
 assert.equal(trigger.disabled,true);assert.equal(host.dataset.caseId,'');assert.equal(fields['[data-entry-detail]'].textContent,'');
 assert.equal(fields['[data-entry-project]'].textContent,'');assert.equal(number.textContent,'Proyecto');
 assert.equal(entry.open(),false);assert.deepEqual(opened,['synthetic-a']);
 phase='unauthorized';notify();assert.equal(action.textContent,'Acceso pendiente');assert.match(fields['[data-entry-status]'].textContent,/Entra a YOD OS/);
 phase='reconnecting';notify();assert.equal(fields['[data-entry-status]'].textContent,'Recuperando conexión…');
 entry.dispose();
});

test('entry requires authoritative status instead of rendering an unconfirmed tool as current activity',async()=>{
 const {entryView}=await import('../despacho3d/office-entry.mjs');
 const id='synthetic-a',selection={case_id:id,name:'Proyecto A',avatar:{id,case_id:id,entity_kind:'case',name:'Autón A'}};
 const observation={case_id:id,phase:'ready',checked_at:Date.now(),work:{case_id:id,goal_id:'goal-a',phase:'tool',current_tool:'navegador_abrir',title:'Consulta de una fuente',updated_at:new Date().toISOString()}};
 assert.equal(entryView(selection,{},observation).status,'Estado sin confirmar');
 assert.equal(entryView(selection,{}, {...observation,work:{...observation.work,current_tool:'drive_leer'}}).status,'Estado sin confirmar');
 const legacy={...selection,avatar:{name:'Autón A'}};
 assert.equal(entryView(legacy,{}, {...observation,work:{...observation.work,current_tool:'tool_unknown'}}).status,'Consultando herramienta');
 const queued=entryView(selection,{}, {...observation,runtime:{phase:'waiting_capacity'}});
 assert.equal(queued.status,'Estado sin confirmar');assert.equal(queued.detail,'','prior goal is not presented as the new queued task');
});
