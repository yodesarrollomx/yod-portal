const test=require('node:test'),assert=require('node:assert/strict');

async function setup(){
 const {GoalHandoff}=await import('../despacho3d/goal-handoff.mjs');
 const {TerminalLink}=await import('../despacho3d/terminal-link.mjs');
 const context={opened:true,profile:{case_id:'synthetic-case'},selection:{case_id:'synthetic-case'},snapshot:{case_id:'synthetic-case',revision:'revision-1',processing:false,memory:['PRIVATE MEMORY MUST NOT BE SENT'],messages:['PRIVATE CHAT MUST NOT BE SENT']},busy:false,status:'ready'};
 const popup={closed:false,postMessage(){}};
 const win={crypto:{randomUUID:()=> 'grant-1'},addEventListener(){},removeEventListener(){},open:()=>popup,setTimeout:()=>1,clearTimeout(){},setInterval:()=>2,clearInterval(){}};
 const link=new TerminalLink({win,getProfile:()=>context.profile});
 const port={sent:[],start(){},postMessage(message){this.sent.push(message);},close(){}};
 link.connect();link.accept({origin:'http://127.0.0.1:4381',source:popup,data:{type:'yod:terminal:approved',version:1,nonce:link.nonce,case_id:'synthetic-case'},ports:[port]});
 link.message({type:'status',status:{live:true,mode:'manual'}});
 let serial=0;
 const handoff=new GoalHandoff({link,getContext:()=>context,uuid:()=> 'test-'+ ++serial});
 const fields={goal:'Revisar la copia del expediente.',criterion:'Informe con evidencia.',confirmed:true};
 const inputs=()=>port.sent.filter(message=>message.type==='terminal'&&message.message.t==='input');
 return {context,link,port,handoff,fields,inputs};
}

test('goal handoff uses the granted terminal for one bracketed paste, without Enter or process controls',async()=>{
 const s=await setup(),result=s.handoff.prepare(s.fields);
 assert.deepEqual(result,{ok:true,id:'meta-test-1',state:'prepared'});
 assert.equal(s.inputs().length,1);
 const data=s.inputs()[0].message.data;
 assert.ok(data.startsWith('\x1b[200~Encargo local de YOD'));
 assert.ok(data.endsWith('\x1b[201~'));
 assert.equal(/[\r\n]/.test(data),false);
 assert.equal((data.match(/\x1b/g)||[]).length,2);
 assert.equal(s.port.sent.some(message=>message.type==='control'),false);
 assert.ok(data.includes('synthetic-case'));
 assert.ok(data.includes('revision-1'));
 assert.ok(data.includes('metas/meta-test-1/plan.json'));
 assert.ok(data.includes('metas/meta-test-1/informe.md'));
 assert.equal(data.includes('PRIVATE MEMORY'),false);
 assert.equal(data.includes('PRIVATE CHAT'),false);
 s.link.dispose();
});

test('native prompt confirmation and live authorized case are mandatory',async()=>{
 const invalid=[
  s=>s.context.opened=false,
  s=>s.context.profile=null,
  s=>s.context.selection.case_id='other-case',
  s=>s.context.snapshot.case_id='other-case',
  s=>s.context.snapshot.revision='bad\x1brevision',
  s=>s.context.busy=true,
  s=>s.context.snapshot.processing=true,
  s=>s.context.status='unconfirmed',
  s=>s.link.status='approving',
  s=>s.link.caseId='other-case',
  s=>s.link.port=null,
  s=>s.link.runtime.live=false,
  s=>s.link.runtime.mode='room',
  s=>s.link.runtime.needs_review=true
 ];
 for(const mutate of invalid){const s=await setup();mutate(s);assert.equal(s.handoff.prepare(s.fields).ok,false,mutate.toString());assert.equal(s.inputs().length,0);s.link.dispose();}
 const s=await setup();assert.equal(s.handoff.prepare({...s.fields,confirmed:false}).code,'confirm');assert.equal(s.inputs().length,0);s.link.dispose();
});

test('all form control bytes are removed and cannot terminate paste or submit commands',async()=>{
 const s=await setup();
 const injected='A'+Array.from({length:32},(_,n)=>String.fromCharCode(n)).join('')+'\x1b[201~\r\ncommand'+Array.from({length:33},(_,n)=>String.fromCharCode(127+n)).join('')+'Z';
 assert.equal(s.handoff.prepare({...s.fields,goal:injected,criterion:injected}).ok,true);
 const data=s.inputs()[0].message.data,body=data.slice(6,-6);
 assert.equal(/[\u0000-\u001f\u007f-\u009f]/.test(body),false);
 assert.equal((data.match(/\x1b\[201~/g)||[]).length,1);
 assert.equal(data.endsWith('\n')||data.endsWith('\r'),false);
 assert.equal(s.inputs().length,1);s.link.dispose();
});

test('UTF-8 size bounds the entire terminal packet and empty/control-only inputs are rejected',async()=>{
 const {buildGoalPrompt,MAX_HANDOFF_BYTES}=await import('../despacho3d/goal-handoff.mjs');
 const base={case_id:'synthetic-case',revision:'revision-1',id:'meta-test',criterion:'Comprobar.'};
 assert.equal(buildGoalPrompt({...base,goal:'\x00\t\n\x1b\x9f'}).code,'invalid');
 assert.equal(buildGoalPrompt({...base,goal:'a',id:'meta-../../outside'}).code,'invalid');
 const overhead=Buffer.byteLength(buildGoalPrompt({...base,goal:'x'}).data)-1;
 const exact=buildGoalPrompt({...base,goal:'x'.repeat(MAX_HANDOFF_BYTES-overhead)});
 assert.equal(exact.ok,true);assert.equal(Buffer.byteLength(exact.data),MAX_HANDOFF_BYTES);
 assert.equal(buildGoalPrompt({...base,goal:'x'.repeat(MAX_HANDOFF_BYTES-overhead+1)}).code,'too_large');
 assert.equal(buildGoalPrompt({...base,goal:'界'.repeat(17000)}).code,'too_large');
 const s=await setup();assert.equal(s.handoff.prepare({...s.fields,goal:'界'.repeat(17000)}).code,'too_large');assert.equal(s.inputs().length,0);s.link.dispose();
});

test('a prepared or uncertain handoff cannot be repeated by a second click or edited text',async()=>{
 const s=await setup();assert.equal(s.handoff.prepare(s.fields).ok,true);
 assert.equal(s.handoff.prepare(s.fields).code,'repeated');
 assert.equal(s.handoff.prepare({...s.fields,goal:'Otra meta.'}).code,'repeated');
 assert.equal(s.inputs().length,1);s.link.dispose();
 const broken=await setup();broken.link.terminal=()=>{throw Error('closed');};
 assert.equal(broken.handoff.prepare(broken.fields).code,'unconfirmed');
 assert.equal(broken.handoff.prepare(broken.fields).code,'repeated');
 assert.equal(broken.inputs().length,0);broken.link.dispose();
});

test('revocation and a changed snapshot between validation and paste cannot send an instruction',async()=>{
 for(const change of ['revoke','revision']){
  const s=await setup();let reads=0;
  s.handoff.getContext=()=>{if(++reads===3){if(change==='revoke'){s.context.profile=null;s.link.revoke();}else s.context.snapshot.revision='revision-2';}return s.context;};
  assert.equal(s.handoff.prepare(s.fields).code,'changed');assert.equal(s.inputs().length,0);s.link.dispose();
 }
});

test('a replacement grant cannot receive a paste prepared for the former port',async()=>{
 const s=await setup(),other={postMessage(){throw Error('unexpected');}};
 s.handoff.uuid=()=>{s.link.port=other;s.link.nonce='grant-2';return 'new-id';};
 assert.equal(s.handoff.prepare(s.fields).code,'changed');assert.equal(s.inputs().length,0);
 s.link.port=s.port;s.link.dispose();
});

test('closing or disconnecting keeps the duplicate guard until a deliberate new-encargo confirmation',async()=>{
 const s=await setup();assert.equal(s.handoff.prepare(s.fields).id,'meta-test-1');
 s.context.opened=false;assert.equal(s.handoff.prepare(s.fields).code,'repeated');assert.equal(s.handoff.newGoal(true).code,'unauthorized');
 s.context.opened=true;s.link.status='disconnected';assert.equal(s.handoff.newGoal(true).code,'disconnected');
 s.link.status='connected';assert.equal(s.handoff.prepare(s.fields).code,'repeated');assert.equal(s.handoff.newGoal(false).code,'confirm');
 assert.equal(s.handoff.newGoal(true).ok,true);assert.equal(s.handoff.id,null);assert.equal(s.handoff.attempted,false);
 assert.equal(s.handoff.prepare(s.fields).id,'meta-test-2');
 assert.equal(s.inputs().length,2);s.link.dispose();
});

test('revoked profile clears only through the owner lifecycle and cannot reuse the prepared draft',async()=>{
 const s=await setup();assert.equal(s.handoff.prepare(s.fields).ok,true);
 s.context.profile=null;s.handoff.reset();assert.equal(s.handoff.id,null);assert.equal(s.handoff.attempted,false);
 assert.equal(s.handoff.prepare(s.fields).code,'unauthorized');assert.equal(s.inputs().length,1);s.link.dispose();
});
