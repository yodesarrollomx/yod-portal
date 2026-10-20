'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/workspace-navigation.mjs');
const turn=()=>new Promise(resolve=>setImmediate(resolve));

async function setup(options={}){
 const {createWorkspaceNavigation}=await load(),listeners=new Map(),posts=[];
 let context={authorized:true,pilot:true,case_id:'synthetic-pilot',board_case_id:'synthetic-board',scenario_id:'scenario-a',revision:'revision-7',confirmed:true,pending:false};
 let style={display:'block',visibility:'visible'},rect={top:20,left:20,right:300,bottom:220,width:280,height:200};
 const effects={scroll:0,input:0,change:0,focus:0,blur:0,click:0,write:0},values={departments:20,volumes:1};
 const input=(id,key)=>({id,tagName:'INPUT',get value(){return values[key];},set value(value){effects.write++;values[key]=value;},
  dispatchEvent(event){if(event?.type in effects)effects[event.type]++;},focus(){effects.focus++;},blur(){effects.blur++;},click(){effects.click++;}});
 const inputs=[input('inDepartments','departments'),input('inVolumenes','volumes')];
 const target={id:'dVolumenes',tagName:'DETAILS',open:false,hidden:false,
  scrollIntoView(){effects.scroll++;},getBoundingClientRect:()=>({...rect}),
  dispatchEvent(event){if(event?.type in effects)effects[event.type]++;},
  focus(){effects.focus++;},blur(){effects.blur++;},click(){effects.click++;},querySelectorAll:()=>inputs};
 const doc={activeElement:{tagName:'BUTTON'},getElementById:id=>id===target.id?target:inputs.find(node=>node.id===id)||null,querySelectorAll:()=>inputs};
 const frameWindow={location:{origin:'https://portal.invalid'},innerWidth:390,innerHeight:844,
  getComputedStyle:()=>({...style}),postMessage:(message,origin)=>posts.push({message,origin})};
 let frame={contentWindow:frameWindow,contentDocument:doc};
 let binding={bridge:true,origin:frameWindow.location.origin,nonce:'synthetic-nonce',board_case_id:'synthetic-board'};
 const win={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name);}};
 const nav=createWorkspaceNavigation({win,getFrame:()=>frame,getBinding:()=>binding,getContext:()=>context,onContext:options.onContext||(()=>{}),timeoutMs:options.timeoutMs||30});
 const payload=(action_id='navigation-1',extra={})=>({action_id,section_id:'dVolumenes',context:{...context},...extra});
 const event=(data={},overrides={})=>({origin:binding.origin,source:frame?.contentWindow,
  data:{version:1,nonce:binding.nonce,case_id:binding.board_case_id,...data},...overrides});
 const emit=(data,overrides)=>listeners.get('message')?.(event(data,overrides));
 const advertise=()=>emit({type:'yod:ppp:state',board:{case_id:binding.board_case_id},capabilities:{navigate:true}});
 const navigationContext=value=>emit({type:'yod:ppp:state',board:{case_id:binding.board_case_id},capabilities:{navigate:true},navigation_context:value});
 const ack=(request_id='navigation-1',extra={},overrides={})=>emit({type:'yod:ppp:navigation',request_id,status:'confirmed',
  observed:{section_id:'dVolumenes',board_case_id:binding.board_case_id,scenario_id:'scenario-a',revision:'revision-7'},...extra},overrides);
 return {nav,posts,listeners,target,doc,frameWindow,effects,values,payload,event,emit,advertise,navigationContext,ack,
  context:()=>context,setContext:next=>{context=next;},patchContext:extra=>{context={...context,...extra};},
  setBinding:extra=>{binding={...binding,...extra};},setFrame:next=>{frame=next;},
  setStyle:extra=>{style={...style,...extra};},setRect:extra=>{rect={...rect,...extra};}};
}

test('native navigation capability is accepted only from the bound origin, frame, nonce and board',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());
 assert.equal(s.nav.context().capabilities.navigate,false);
 assert.deepEqual(await s.nav.navigate(s.payload()),{status:'unsupported'});
 const capability={type:'yod:ppp:state',board:{case_id:'synthetic-board'},capabilities:{navigate:true}};
 const attacks=[
  [{...capability},{origin:'https://foreign.invalid'}],
  [{...capability},{source:{postMessage(){}}}],
  [{...capability,nonce:'other-nonce'}],
  [{...capability,board:{case_id:'another-board'}}],
  [{...capability,version:2}],
  [{...capability,type:'yod:ppp:navigation'}],
  [{...capability,capabilities:{navigate:'true'}}]
 ];
 for(const [data,overrides]of attacks){s.emit(data,overrides);assert.equal(s.nav.context().capabilities.navigate,false);}
 assert.equal(s.posts.length,0);
 s.advertise();assert.equal(s.nav.context().capabilities.navigate,true);
 s.setBinding({nonce:'renewed-nonce'});assert.equal(s.nav.context().capabilities.navigate,false,'a renewed frame binding must negotiate its own capability');
});

test('native ACK binds request, target, board, scenario and revision before confirming',async t=>{
 const s=await setup({timeoutMs:300});t.after(()=>s.nav.dispose());s.advertise();
 const pending=s.nav.navigate(s.payload()),request=s.posts[0];let settled=false;pending.then(()=>{settled=true;});
 assert.deepEqual(request,{origin:'https://portal.invalid',message:{type:'yod:ppp:navigate',version:1,nonce:'synthetic-nonce',case_id:'synthetic-board',board_case_id:'synthetic-board',request_id:'navigation-1',scenario_id:'scenario-a',revision:'revision-7',target:'dVolumenes'}});
 const observed={section_id:'dVolumenes',board_case_id:'synthetic-board',scenario_id:'scenario-a',revision:'revision-7'};
 const invalid=[
  ['other-request',{},{}],
  ['navigation-1',{}, {origin:'https://foreign.invalid'}],
  ['navigation-1',{}, {source:{}}],
  ['navigation-1',{nonce:'other-nonce'},{}],
  ['navigation-1',{case_id:'another-board'},{}],
  ['navigation-1',{version:2},{}],
  ['navigation-1',{observed:null},{}],
  ['navigation-1',{observed:{...observed,section_id:'dCostos'}},{}],
  ['navigation-1',{observed:{...observed,board_case_id:'another-board'}},{}],
  ['navigation-1',{observed:{...observed,scenario_id:'scenario-b'}},{}],
  ['navigation-1',{observed:{...observed,revision:'revision-8'}},{}]
 ];
 for(const [id,data,event]of invalid){s.ack(id,data,event);await turn();assert.equal(settled,false,'an unrelated or stale ACK must leave the intent unconfirmed');}
 s.ack();assert.deepEqual(await pending,{status:'confirmed',observed:{case_id:'synthetic-pilot',tab:'ppp',section_id:'dVolumenes',board_case_id:'synthetic-board',scenario_id:'scenario-a',revision:'revision-7'}});
});

test('repeated pending navigation shares one promise and one outbound request',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.advertise();
 const first=s.nav.navigate(s.payload()),duplicate=s.nav.navigate(s.payload());
 assert.equal(first,duplicate);assert.equal(s.posts.length,1);s.ack();
 assert.equal((await first).status,'confirmed');assert.equal((await duplicate).status,'confirmed');
});

test('native timeout and late ACK cannot confirm another intent',async t=>{
 const s=await setup({timeoutMs:10});t.after(()=>s.nav.dispose());s.advertise();
 const expired=await s.nav.navigate(s.payload('expired'));
 assert.deepEqual(expired,{status:'unavailable',reason:'navigation_ack_timeout'});
 const next=s.nav.navigate(s.payload('next'));let settled=false;next.then(()=>{settled=true;});
 s.ack('expired');await turn();assert.equal(settled,false);
 s.ack('next');assert.equal((await next).status,'confirmed');assert.equal(s.posts.length,2);
});

test('context changes and a replaced frame never promote stale ACKs',async t=>{
 for(const change of [{case_id:'other-pilot'},{board_case_id:'other-board'},{scenario_id:'scenario-b'},{revision:'revision-8'}]){
  const s=await setup();t.after(()=>s.nav.dispose());s.advertise();const pending=s.nav.navigate(s.payload());s.patchContext(change);s.ack();
  assert.deepEqual(await pending,{status:'unavailable',reason:'context_changed'});
 }
 const s=await setup({timeoutMs:10});t.after(()=>s.nav.dispose());s.advertise();const pending=s.nav.navigate(s.payload()),old=s.event({type:'yod:ppp:navigation',request_id:'navigation-1',status:'confirmed',observed:{section_id:'dVolumenes',board_case_id:'synthetic-board',scenario_id:'scenario-a',revision:'revision-7'}});
 s.setFrame({contentWindow:{postMessage(){}},contentDocument:s.doc});s.listeners.get('message')(old);
 assert.deepEqual(await pending,{status:'unavailable',reason:'navigation_ack_timeout'});
});

test('navigation requires current authorization, pilot, confirmed revision and a supported target',async t=>{
 for(const change of [{authorized:false},{pilot:false},{case_id:'not a valid case'},{confirmed:false},{pending:true}]){
  const s=await setup();t.after(()=>s.nav.dispose());s.advertise();s.patchContext(change);
  assert.equal((await s.nav.navigate(s.payload())).status,'unavailable');
  assert.equal((await s.nav.assisted(s.payload())).status,'unavailable');
  assert.equal(s.posts.length,0);assert.equal(s.target.open,false);assert.equal(s.effects.scroll,0);
 }
 const s=await setup();t.after(()=>s.nav.dispose());s.advertise();
 assert.equal((await s.nav.navigate(s.payload('outside',{section_id:'unknown-section'}))).status,'unavailable');
 assert.equal((await s.nav.navigate(s.payload('bad context',{context:{...s.context(),revision:'older'}}))).status,'unavailable');
 assert.equal(s.posts.length,0);
});

test('assisted navigation only opens and scrolls a details section without editing or moving focus',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());const active=s.doc.activeElement,before={...s.values};
 s.navigationContext({...s.context()});
 assert.deepEqual(await s.nav.assisted(s.payload()),{status:'confirmed',observed:{case_id:'synthetic-pilot',tab:'ppp',section_id:'dVolumenes',board_case_id:'synthetic-board',scenario_id:'scenario-a',revision:'revision-7'}});
 assert.equal(s.target.open,true);assert.equal(s.effects.scroll,1);assert.equal(s.doc.activeElement,active);
 assert.deepEqual(s.values,before);assert.deepEqual(s.effects,{scroll:1,input:0,change:0,focus:0,blur:0,click:0,write:0});assert.equal(s.posts.length,0);
});

test('assisted navigation blocks editing focus and pending data before touching the section',async t=>{
 for(const active of [{tagName:'INPUT'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{tagName:'DIV',isContentEditable:true}]){
  const s=await setup();t.after(()=>s.nav.dispose());s.doc.activeElement=active;
  assert.deepEqual(await s.nav.assisted(s.payload()),{status:'blocked',reason:'editing_in_progress'});
  assert.equal(s.target.open,false);assert.equal(s.effects.scroll,0);assert.equal(s.doc.activeElement,active);
 }
 const s=await setup();t.after(()=>s.nav.dispose());s.patchContext({pending:true});
 assert.equal((await s.nav.assisted(s.payload())).status,'unavailable');assert.equal(s.target.open,false);assert.equal(s.effects.scroll,0);
});

test('assisted navigation cannot confirm hidden, zero-size or unsupported content',async t=>{
 const variants=[s=>{s.target.hidden=true;},s=>s.setStyle({display:'none'}),s=>s.setStyle({visibility:'hidden'}),s=>s.setRect({width:0}),s=>s.setRect({height:0})];
 for(const alter of variants){const s=await setup();t.after(()=>s.nav.dispose());alter(s);assert.deepEqual(await s.nav.assisted(s.payload()),{status:'unavailable',reason:'section_not_visible'});}
 const s=await setup();t.after(()=>s.nav.dispose());s.target.tagName='DIV';assert.equal((await s.nav.assisted(s.payload())).status,'unsupported');assert.equal(s.effects.scroll,0);
});

test('assisted navigation detects context changed during the observed scroll',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.target.scrollIntoView=()=>s.patchContext({revision:'revision-8'});
 assert.deepEqual(await s.nav.assisted(s.payload()),{status:'unavailable',reason:'context_changed'});
});

test('reset and disposal settle pending promises and withdraw the capability/listener',async()=>{
 const s=await setup({timeoutMs:300});s.advertise();const first=s.nav.navigate(s.payload('first'));s.nav.reset();
 assert.deepEqual(await first,{status:'unavailable',reason:'context_changed'});assert.equal(s.nav.context().capabilities.navigate,false);
 s.advertise();const second=s.nav.navigate(s.payload('second'));s.nav.dispose();
 assert.deepEqual(await second,{status:'unavailable',reason:'context_changed'});assert.equal(s.listeners.size,0);
 s.ack('second');await turn();assert.equal(s.posts.length,2);
});

test('a stale board binding cannot navigate or report success under the current board context',async t=>{
 const s=await setup({timeoutMs:10});t.after(()=>s.nav.dispose());s.setBinding({board_case_id:'stale-board'});s.advertise();
 const result=s.nav.navigate(s.payload());assert.equal(s.posts.length,0,'a binding from another board must emit no navigation');
 assert.equal((await result).status,'unavailable');
 assert.equal((await s.nav.assisted(s.payload())).status,'unavailable');assert.equal(s.target.open,false);
});

test('an assisted section remaining outside the iframe viewport is not confirmed',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.setRect({top:10000,bottom:10200});
 assert.deepEqual(await s.nav.assisted(s.payload()),{status:'unavailable',reason:'section_not_visible'});
});

test('disposed navigation cannot perform subsequent assisted DOM changes',async()=>{
 const s=await setup();s.nav.dispose();const result=await s.nav.assisted(s.payload());
 assert.equal(result.status,'unavailable');assert.equal(s.target.open,false);assert.equal(s.effects.scroll,0);assert.equal(s.nav.context(),null);
});

test('verified visible scenario B drives navigation while defended host scenario A stays untouched',async t=>{
 let notices=0;const s=await setup({onContext:()=>notices++});t.after(()=>s.nav.dispose());const defended={...s.context()};
 s.navigationContext({case_id:'synthetic-pilot',board_case_id:'synthetic-board',scenario_id:'scenario-b',revision:'visible-revision-2',confirmed:true,pending:false,
  authorized:false,pilot:false,capabilities:{destructive:true}});
 const visible=s.nav.context();assert.equal(visible.scenario_id,'scenario-b');assert.equal(visible.revision,'visible-revision-2');
 assert.equal(visible.authorized,true);assert.equal(visible.pilot,true);assert.deepEqual(visible.capabilities,{navigate:true});assert.equal(notices,1);
 assert.deepEqual(s.context(),defended,'the host financial/defended context is never rewritten by a view message');
 const pending=s.nav.navigate(s.payload('visible-b',{context:visible}));
 assert.equal(s.posts[0].message.scenario_id,'scenario-b');assert.equal(s.posts[0].message.revision,'visible-revision-2');
 s.ack('visible-b',{observed:{section_id:'dVolumenes',board_case_id:'synthetic-board',scenario_id:'scenario-b',revision:'visible-revision-2'}});
 assert.equal((await pending).observed.scenario_id,'scenario-b');assert.deepEqual(s.context(),defended);
});

test('foreign, malformed or pending navigation contexts are not merged into the trusted host',async t=>{
 const valid={case_id:'synthetic-pilot',board_case_id:'synthetic-board',scenario_id:'scenario-b',revision:'visible-revision-2',confirmed:true,pending:false};
 for(const invalid of [{case_id:'other-pilot'},{board_case_id:'other-board'},{scenario_id:'bad scenario'},{scenario_id:''},{revision:'bad revision'},{confirmed:false},{pending:true}]){
  const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext(valid);assert.equal(s.nav.context().scenario_id,'scenario-b');
  s.navigationContext({...valid,...invalid});const result=s.nav.context();
  assert.equal(result.case_id,'synthetic-pilot');assert.equal(result.board_case_id,'synthetic-board');assert.equal(result.scenario_id,'scenario-a');assert.equal(result.revision,'revision-7');
  assert.equal(result.authorized,true);assert.equal(result.pilot,true);assert.equal(s.posts.length,0);
 }
});

test('reset and revoked authority withdraw visible context until a new trusted state arrives',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());const visible={case_id:'synthetic-pilot',board_case_id:'synthetic-board',scenario_id:'scenario-b',revision:'visible-revision-2',confirmed:true,pending:false};
 s.navigationContext(visible);assert.equal(s.nav.context().scenario_id,'scenario-b');
 s.nav.reset();assert.equal(s.nav.context().scenario_id,'scenario-a');assert.equal(s.nav.context().capabilities.navigate,false);
 s.navigationContext(visible);s.patchContext({authorized:false});assert.equal(s.nav.context(),null);
 s.navigationContext(visible);s.patchContext({authorized:true});
 assert.equal(s.nav.context().scenario_id,'scenario-a','authority recovery must not resurrect a prior view context');
 assert.equal(s.nav.context().capabilities.navigate,false,'a revoked navigation capability must also be renegotiated');
 s.navigationContext(visible);assert.equal(s.nav.context().scenario_id,'scenario-b');
 s.patchContext({case_id:'other-authorized-pilot'});assert.equal(s.nav.context().scenario_id,'scenario-a','a view context is scoped to the exact host case');
});

test('reusing a pending action ID for another section is unavailable and emits no second action',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.advertise();const first=s.nav.navigate(s.payload('one-intent'));
 assert.deepEqual(await s.nav.navigate(s.payload('one-intent',{section_id:'dCostos'})),{status:'unavailable',reason:'request_id_reused'});
 assert.equal(s.posts.length,1);assert.equal(s.posts[0].message.target,'dVolumenes');assert.equal(s.target.open,false);
 s.ack('one-intent');assert.equal((await first).observed.section_id,'dVolumenes');
});

test('an explicitly unavailable native context blocks both routes while a stale host snapshot remains confirmed',async t=>{
 const valid={case_id:'synthetic-pilot',board_case_id:'synthetic-board',scenario_id:'scenario-b',revision:'visible-revision-2',confirmed:true,pending:false};
 for(const announced of [null,{...valid,pending:true},{...valid,confirmed:false},{...valid,error:'reading_failed'}]){
  const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext(announced);
  assert.equal(s.context().confirmed,true,'the independent host snapshot remains unchanged');
  assert.equal(s.nav.context().confirmed,false);assert.equal(s.nav.context().pending,true);
  assert.deepEqual(await s.nav.navigate(s.payload()),{status:'unavailable',reason:'board_not_ready'});
  assert.deepEqual(await s.nav.assisted(s.payload()),{status:'unavailable',reason:'board_not_ready'});
  assert.equal(s.posts.length,0);assert.equal(s.target.open,false);assert.equal(s.effects.scroll,0);
 }
});

test('legacy fallback reveals a section without claiming the host snapshot is a verified visible version',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.advertise();
 assert.equal(s.nav.context().confirmed,true);assert.deepEqual(await s.nav.assisted(s.payload()),{status:'pending',reason:'visible_version_unconfirmed'});
 assert.equal(s.target.open,true);assert.equal(s.effects.scroll,1);
 s.target.open=false;s.navigationContext(null);s.advertise();
 assert.equal(s.nav.context().confirmed,false,'omitting the new field later cannot resurrect a legacy snapshot');
 assert.equal((await s.nav.assisted(s.payload())).status,'unavailable');assert.equal(s.target.open,false);
 s.nav.reset();s.advertise();assert.equal(s.nav.context().confirmed,true);assert.deepEqual(await s.nav.assisted(s.payload()),{status:'pending',reason:'visible_version_unconfirmed'});
});

test('a newly unavailable child context invalidates an ACK even when host case, scenario and revision are unchanged',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext({...s.context()});
 const pending=s.nav.navigate(s.payload());s.navigationContext(null);s.ack();
 assert.deepEqual(await pending,{status:'unavailable',reason:'context_changed'});
});

test('assisted scroll cannot confirm after the child marks its same scenario as pending',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext({...s.context()});
 s.target.scrollIntoView=()=>s.navigationContext({...s.context(),pending:true});
 assert.deepEqual(await s.nav.assisted(s.payload()),{status:'unavailable',reason:'context_changed'});
 assert.equal(s.posts.length,0);assert.equal(s.effects.input,0);assert.equal(s.effects.change,0);assert.equal(s.effects.write,0);
});

test('native blocking codes stop assisted fallback even when child labels the refusal unavailable',async t=>{
 const {createAgentInteraction}=await import('../despacho3d/agent-interaction.mjs');
 for(const code of ['revision_changed','scenario_changed','case_changed','reading_unconfirmed','editing_in_progress','pending_write','unauthorized','session_changed']){
  const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext({...s.context()});let assisted=0;
  const controller=createAgentInteraction({getContext:()=>s.nav.context(),uuid:()=>code,
   openWorkspace:p=>({status:'confirmed',observed:{...p.context,tab:'ppp'}}),
   navigateBridge:p=>s.nav.navigate(p),navigateAssisted:p=>{assisted++;return s.nav.assisted(p);}});
  t.after(()=>controller.dispose());
  const work=controller.receive({role:'user',source:'text',text:'Abre volúmenes',complete:true});await turn();
  assert.equal(s.posts.length,1);
  const request_id=s.posts[0].message.request_id;
  s.ack(request_id,{status:'unavailable',code});await work;
  assert.equal(assisted,0,code+' must never retry through B');assert.equal(s.effects.scroll,0);assert.equal(s.target.open,false);
  assert.equal(controller.snapshot()[0].state,'pending');assert.equal(controller.snapshot()[0].reason,code);assert.deepEqual(controller.snapshot()[0].evidence,[]);
 }
});

test('a legacy visible section remains pending in the interaction controller until child version is verified',async t=>{
 const {createAgentInteraction}=await import('../despacho3d/agent-interaction.mjs');
 const s=await setup();t.after(()=>s.nav.dispose());
 const controller=createAgentInteraction({getContext:()=>s.nav.context(),uuid:()=>1,
  openWorkspace:p=>({status:'confirmed',observed:{...p.context,tab:'ppp'}}),navigateAssisted:p=>s.nav.assisted(p)});
 t.after(()=>controller.dispose());
 await controller.receive({role:'user',source:'text',text:'Abre volúmenes',complete:true});
 const [record]=controller.snapshot();assert.equal(s.target.open,true);assert.equal(s.effects.scroll,1);
 assert.equal(record.state,'pending');assert.equal(record.reason,'visible_version_unconfirmed');assert.deepEqual(record.evidence,[]);
 s.navigationContext({...s.context()});
 assert.equal(await controller.retry(record.action_id),true);assert.equal(controller.snapshot()[0].state,'confirmed');
 assert.equal(controller.snapshot()[0].evidence[0].observed.revision,'revision-7');
});

test('the local PPP presentation API opens modern sections once and verifies their visible readback',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext({...s.context()});
 const calls=[],volumes={...s.target,id:'pppVolumes',tagName:'SECTION'};let opened=false;
 const legacyGet=s.doc.getElementById;s.doc.getElementById=id=>id==='pppVolumes'?volumes:legacyGet(id);
 s.frameWindow.PPPView={
  navigationState(section){calls.push(['state',section]);return opened?{status:'confirmed',section_id:section}:{status:'unavailable',code:'view_not_confirmed'};},
  navigate(section){calls.push(['navigate',section]);opened=true;volumes.scrollIntoView();return{status:'confirmed',section_id:section};},
  adjust(){throw Error('the editor must never be invoked');}};
 const before={...s.values},active=s.doc.activeElement;
 const result=await s.nav.assisted(s.payload());assert.equal(result.status,'confirmed');assert.equal(result.observed.section_id,'dVolumenes');
 assert.deepEqual(calls,[['state','dVolumenes'],['navigate','dVolumenes'],['state','dVolumenes']]);
 assert.equal(s.target.open,false,'modern sections do not use the legacy details');assert.equal(s.doc.activeElement,active);assert.deepEqual(s.values,before);
 assert.deepEqual(s.effects,{scroll:1,input:0,change:0,focus:0,blur:0,click:0,write:0});assert.equal(s.posts.length,0);
});

test('an already visible local card is read twice without another navigation or postMessage recursion',async t=>{
 const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext({...s.context()});const calls=[];
 const card={...s.target,tagName:'ARTICLE'};s.doc.querySelector=selector=>selector==='[data-card="dCostos"]'?card:null;
 s.frameWindow.PPPView={navigationState(section){calls.push(section);return{status:'confirmed',section_id:section};},navigate(){throw Error('already visible navigation must not repeat');}};
 assert.equal((await s.nav.assisted(s.payload('card',{section_id:'dCostos'}))).status,'confirmed');
 assert.deepEqual(calls,['dCostos','dCostos']);assert.equal(s.effects.scroll,0);assert.equal(s.posts.length,0);assert.equal(s.target.open,false);
});

test('local presentation errors, pending reads and invisible results cannot confirm or edit fields',async t=>{
 for(const mode of ['throw','blocked','wrong-section','invisible','context-changed']){
  const s=await setup();t.after(()=>s.nav.dispose());s.navigationContext({...s.context()});let reads=0,navigations=0;
  const volumes={...s.target,id:'pppVolumes',tagName:'SECTION'};s.doc.getElementById=id=>id==='pppVolumes'?volumes:null;
  s.frameWindow.PPPView={navigationState(section){reads++;if(mode==='throw')throw Error('presentation failure');
   if(mode==='blocked')return{status:'unavailable',code:'reading_or_editing'};
   return reads===1?{status:'unavailable'}:{status:'confirmed',section_id:mode==='wrong-section'?'dArq':section};},
   navigate(){navigations++;if(mode==='invisible')s.setRect({top:10000,bottom:10200});if(mode==='context-changed')s.navigationContext(null);}};
  const result=await s.nav.assisted(s.payload());assert.notEqual(result.status,'confirmed',mode);assert.equal(result.observed,undefined);
  if(mode==='blocked'){assert.equal(result.status,'blocked');assert.equal(navigations,0);}
  if(mode==='throw')assert.equal(navigations,0);
  assert.equal(s.target.open,false);assert.deepEqual(s.effects,{scroll:0,input:0,change:0,focus:0,blur:0,click:0,write:0});assert.deepEqual(s.values,{departments:20,volumes:1});assert.equal(s.posts.length,0);
 }
});
