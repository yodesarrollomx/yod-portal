'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const load=()=>import('../despacho3d/conversation.mjs');
const sessionModule=()=>import('../despacho3d/profile-session.mjs');
const current={ok:true,case_id:'synthetic-case',name:'Caso de prueba',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true};
const profile={id:current.case_id,case_id:current.case_id,entity_kind:'case',name:current.name,form:'child',color:'#467a89',visual:{hairStyle:'curly',skin:'#edc6a5',seed:'synthetic'}};
function snapshot(){return {ok:true,case_id:current.case_id,source_revision:'rev-1',context:{identity:{case_id:current.case_id,name:current.name},memory:[['Tema sintético','Memoria sintética','Revisión pendiente','Confirmar dato']],documents:[['doc-1','Documento sintético','https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit','Referencia']]},state:{updated_at:'2026-10-03T00:00:00Z'},conversation:[],jobs:[],events:[]};}
function backend(){let resolves=0,reads=0;return {resolveCurrent:async()=>{resolves++;return {...current,avatar:profile};},read:async()=>{reads++;return snapshot();},counts:()=>({resolves,reads})};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('profile must match the server-selected case, name and explicit visual types; arbitrary fields never propagate',async()=>{
 const {validateSelection}=await load();
 const result=validateSelection({...current,avatar:{...profile,token:'private',placement:{position:[9,9,9]},visual:{...profile.visual,secret:'private',quality:'expensive'}}});
 assert.deepEqual(result.avatar,profile);
 for(const avatar of [{...profile,id:'other'},{...profile,case_id:'other'},{...profile,name:'Impostor'},{...profile,entity_kind:'user'},{...profile,form:'unknown'},{...profile,color:'url(secret)'},{...profile,visual:{hairStyle:'unknown'}},{...profile,visual:{skin:{hex:'#ffffff'}}},{...profile,visual:{seed:'a'.repeat(257)}}])assert.throws(()=>validateSelection({...current,avatar}),/invalid_selection/);
 assert.equal(validateSelection(current).avatar,null);assert.equal(validateSelection({...current,avatar:null}).avatar,null);
});
test('authorized source rows retain exact schema with bounded plain text and allowlisted Google links only',async()=>{
 const {validateConversation}=await load(),value=snapshot();
 value.context.memory[0][2]='https://drive.google.com/file/d/SYNTHETIC_ONLY/view';
 value.context.documents.push(['doc-2','<img src=x onerror=alert(1)>','javascript:alert(1)','Referencia externa']);
 const model=validateConversation(value,current.case_id);
 assert.equal(model.memory[0].url,value.context.memory[0][2]);assert.equal(model.memory[0].next,'Confirmar dato');
 assert.equal(model.documents[1].url,null);assert.equal(model.documents[1].title,'<img src=x onerror=alert(1)>');assert.equal(model.documents[1].role,'Referencia externa');
 for(const invalid of [{},[['Only one']],[[{},'','','']],Array.from({length:101},()=>['','','','']),[['a'.repeat(8001),'','','']]]){
  const bad=snapshot();bad.context.memory=invalid;assert.throws(()=>validateConversation(bad,current.case_id),/invalid_snapshot/);
 }
 delete value.context.memory;delete value.context.documents;
 assert.deepEqual(validateConversation(value,current.case_id).memory,[]);
});
test('legacy server without avatar still opens, sends and rereads the conversation',async()=>{
 const {Conversation}=await load(),server=backend();server.resolveCurrent=async()=>current;
 server.enqueue=async p=>({ok:true,state:'queued',case_id:p.case_id,request_id:p.request_id,job_id:'job-1',source_revision:p.expected_revision});
 const c=new Conversation({transport:server,uuid:()=> 'request-1'});assert.equal(await c.open(),true);assert.equal(c.getProfile(),null);assert.equal(await c.send('Mensaje sintético'),true);
});
test('initial hydration and a click share one read, closing discards history and reopening reauthorizes',async()=>{
 const {Conversation}=await load(),{createProfileSession}=await sessionModule(),server=backend();let release,reads=0,shows=0;
 server.read=()=>{reads++;return new Promise(resolve=>release=resolve);};
 const c=new Conversation({transport:server}),s=createProfileSession(c,{show:()=>shows++});
 const hydrated=s.hydrate();assert.equal(s.openForCase(current.case_id),false);s.open();await tick();assert.equal(reads,1);release(snapshot());assert.equal(await hydrated,true);assert.equal(shows,1);assert.equal(s.isOpen(),true);
 const notifications=[];const unsubscribe=s.subscribeProfile(p=>notifications.push(p));assert.deepEqual(notifications,[profile]);
 const copy=s.getProfile();copy.name='mutated';assert.equal(s.getProfile().name,current.name);
 s.close();assert.equal(c.model,null);assert.equal(c.selection,null);assert.deepEqual(s.getProfile(),profile);
 assert.equal(s.openForCase('wrong-case'),false);assert.equal(shows,1);assert.equal(s.openForCase(current.case_id),true);await tick();assert.equal(reads,2);release(snapshot());await tick();assert.equal(c.status,'ready');
 unsubscribe();s.dispose();assert.equal(s.getProfile(),null);assert.equal(s.isOpen(),false);assert.equal(s.openForCase(current.case_id),false);
});
test('background hydration keeps only a minimal profile; no queue or polling starts',async()=>{
 const {Conversation}=await load(),{createProfileSession}=await sessionModule(),server=backend();let shows=0;
 const c=new Conversation({transport:server}),s=createProfileSession(c,{show:()=>shows++});
 assert.equal(await s.hydrate(),true);assert.equal(shows,0);assert.equal(c.model,null);assert.equal(c.selection,null);assert.deepEqual(s.getProfile(),profile);
 assert.equal(await s.hydrate(),false);assert.deepEqual(server.counts(),{resolves:1,reads:1});s.dispose();
});
test('every failed resolve/read revokes the avatar, including a malformed optional profile',async()=>{
 const {Conversation}=await load();
 for(const failure of ['resolve-denied','read-denied','read-malformed','profile-malformed']){
  const server=backend(),c=new Conversation({transport:server});await c.open();const observed=[];c.subscribeProfile(p=>observed.push(p));
  if(failure==='resolve-denied')server.resolveCurrent=async()=>({ok:false,error:'unauthorized'});
  if(failure==='read-denied')server.read=async()=>({ok:false,error:'session_changed'});
  if(failure==='read-malformed')server.read=async()=>({...snapshot(),context:{}});
  if(failure==='profile-malformed')server.resolveCurrent=async()=>({...current,avatar:{...profile,case_id:'wrong'}});
  assert.equal(await c.refresh(),false,failure);assert.equal(c.getProfile(),null,failure);assert.equal(observed.at(-1),null);assert.equal(c.model,null);
 }
});
test('refresh revocation clears the previous identity and pending write; network failures preserve retry identity',async()=>{
 const {Conversation}=await load();
 for(const code of ['unauthorized','session_changed','case_changed']){
  const server=backend(),c=new Conversation({transport:server,uuid:()=> 'request-1'});
  server.enqueue=async()=>{throw Error('network unavailable');};await c.open();await c.send('Mensaje');assert.ok(c.pending);
  server.resolveCurrent=async()=>code==='case_changed'?{...current,case_id:'another-case'}:{ok:false,error:code};
  assert.equal(await c.refresh(),false);assert.equal(c.selection,null,code);assert.equal(c.pending,null,code);assert.equal(c.getProfile(),null,code);assert.equal(c.model,null,code);
 }
 const server=backend(),c=new Conversation({transport:server,uuid:()=> 'request-1'});
 server.enqueue=async()=>{throw Error('network unavailable');};await c.open();await c.send('Mensaje');
 const pending=structuredClone(c.pending);server.read=async()=>{throw Error('network unavailable');};assert.equal(await c.refresh(),false);assert.deepEqual(c.pending,pending);assert.equal(c.selection.case_id,current.case_id);assert.equal(c.getProfile(),null);
});
test('an enqueue authorization rejection revokes profile while uncertain ACKs keep the original request',async()=>{
 const {Conversation}=await load();
 for(const code of ['unauthorized','session_changed']){
  const server=backend(),c=new Conversation({transport:server,uuid:()=> 'request-1'});server.enqueue=async()=>({ok:false,error:code});await c.open();assert.equal(await c.send('Mensaje'),false);assert.equal(c.getProfile(),null);assert.equal(c.selection,null);assert.equal(c.status,'unavailable');
 }
 const server=backend(),c=new Conversation({transport:server,uuid:()=> 'request-1'});server.enqueue=async()=>{throw Error('network unavailable');};await c.open();await c.send('Mensaje');assert.equal(c.pending.request_id,'request-1');assert.equal(c.getProfile().id,current.case_id);
});
test('closing or disposing during pending hydration prevents late reads from restoring a profile',async()=>{
 const {Conversation}=await load(),{createProfileSession}=await sessionModule();
 for(const dispose of [false,true]){
  const server=backend();let release;server.read=()=>new Promise(resolve=>release=resolve);
  const c=new Conversation({transport:server}),s=createProfileSession(c);const pending=s.hydrate();await tick();dispose?s.dispose():s.close();release(snapshot());assert.equal(await pending,false);assert.equal(s.getProfile(),null);assert.equal(c.model,null);s.dispose();
 }
});
