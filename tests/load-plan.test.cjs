'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(r=>setImmediate(r));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function plan(){const {createPortalLoadPlan}=await import('../os/load-plan.mjs');const p=createPortalLoadPlan();p.setSession('synthetic-epoch');return p;}
const current=()=>true;
test('P3: triple catalog request shares one transport and returns to every consumer',async()=>{
 const p=await plan(),d=deferred();let calls=0;
 const run=()=>{calls++;return d.promise;};
 const reads=Array.from({length:3},()=>p.readCase('listAuthorized',{},'catalog',run,current));
 await tick();assert.equal(calls,1);d.resolve({ok:true});assert.deepEqual(await Promise.all(reads),[{ok:true},{ok:true},{ok:true}]);p.revoke();
});
test('P3: foreground selection overtakes queued background without starving it',async()=>{
 const p=await plan(),d=deferred(),order=[];
 const first=p.readPortal('finance',()=>{order.push('finance');return d.promise;},current,3);
 await tick();const bg=p.readPortal('marketing',()=>order.push('marketing'),current,3);
 p.select('B');const selected=p.readCase('read',{case_id:'B'},'conversation',()=>order.push('B'),current);
 await selected;assert.deepEqual(order,['finance','B']);d.resolve();await Promise.all([first,bg]);assert.deepEqual(order,['finance','B','marketing']);p.revoke();
});
test('P3: selecting a case promotes and reuses its background flight',async()=>{
 const p=await plan(),d=deferred();let calls=0;
 const run=()=>{calls++;return d.promise;};
 const bg=p.readCase('readGoals',{case_id:'B'},'goals',run,current);await tick();
 p.select('B');const fg=p.readCase('readGoals',{case_id:'B'},'goals',run,current);await tick();assert.equal(calls,1);
 d.resolve('same');assert.deepEqual(await Promise.all([bg,fg]),['same','same']);p.revoke();
});
test('P3: A→B discards selected A but preserves the independent background consumer',async()=>{
 const p=await plan(),d=deferred();
 const bg=p.readCase('readGoals',{case_id:'A'},'goals',()=>d.promise,current);await tick();p.select('A');
 const fg=p.readCase('readGoals',{case_id:'A'},'goals',()=>assert.fail('duplicate'),current);
 const rejected=assert.rejects(fg,/session_changed/);p.select('B');await rejected;d.resolve('A');assert.equal(await bg,'A');p.revoke();
});
test('P3: selection cancellation retains physical lane until old adapter settles',async()=>{
 const p=await plan(),d=deferred();let b=0;p.select('A');
 const a=p.readCase('read',{case_id:'A'},'conversation',()=>d.promise,current);await tick();const rejected=assert.rejects(a,/session_changed/);
 p.select('B');const next=p.readCase('read',{case_id:'B'},'conversation',()=>++b,current);await tick();assert.equal(b,0);await rejected;
 d.resolve('stale');assert.equal(await next,1);p.revoke();
});
test('P3: opening Home promotes pending sections even while background is occupied',async()=>{
 const p=await plan(),d=deferred();let started=false;
 const first=p.readPortal('finance',()=>d.promise,current,3,'finance');await tick();
 const next=p.readPortal('marketing',()=>{started=true;},current,3,'marketing');await tick();assert.equal(started,false);
 p.prioritizeHome();await next;assert.equal(started,true);d.resolve();await first;p.revoke();
});
test('P3: epoch replacement suppresses old results and allows fresh catalog',async()=>{
 const p=await plan(),d=deferred();const old=p.readPortal('catalog',()=>d.promise,current);await tick();
 const rejected=assert.rejects(old,/session_changed/);p.setSession('new-epoch');await rejected;d.resolve('old');await tick();
 assert.equal(await p.readPortal('catalog',()=> 'new',current),'new');p.revoke();
});
test('P3: revocation after transport completion still prevents publication',async()=>{
 const p=await plan();let allowed=true;
 await assert.rejects(p.readCase('read', {case_id:'A'},'conversation',()=>{allowed=false;return 'private';},()=>allowed),/session_changed/);p.revoke();
});
test('P3: mutations and session minting remain outside the coordinator, without retry or dedupe',async()=>{
 const p=await plan();let calls=0;const payload={request_id:'original',expected_revision:'r1'};
 for(const method of ['enqueue','createGoal','reviewGoal','recordVisit','mintFastSession'])await p.readCase(method,payload,'send',()=>{calls++;},current);
 assert.equal(calls,5);assert.equal(p.snapshot().active,0);p.revoke();
});
test('P5: activation is static and rollback does not import or start the runtime',async()=>{
 const c=vm.createContext({});vm.runInContext(fs.readFileSync('os/load-config.js','utf8'),c);assert.equal(c.YodLoadConfig.enabled,true);assert.equal(Object.isFrozen(c.YodLoadConfig),true);c.YodLoadConfig={enabled:false};vm.runInContext(fs.readFileSync('os/load-plan-boot.js','utf8'),c);
 assert.equal(c.YodLoadConfig.enabled,false);assert.equal(await c.YodLoadPlanReady,null);
});
function bridge(p,{fallback=false}={}){
 let receive;const replies=[],selected=[],frame={postMessage:m=>replies.push(m)},transport={};
 const c=vm.createContext({location:{origin:'https://synthetic.invalid'},setTimeout,clearTimeout,addEventListener:(n,f)=>{receive=f;},removeEventListener(){}});
 vm.runInContext(fs.readFileSync('os/despacho-conversation.js','utf8'),c);
 c.YodDespachoConversation.bind({isAuthorized:()=>true,getEpoch:()=>1,getIframeWindow:()=>frame,getTransport:()=>transport,onSelection:id=>{selected.push(id);p.select(id);},scheduleRead:(m,v,l,r,check)=>fallback?Promise.resolve(null):p.readCase(m,v,l,r,check)});
 const send=(id,method,payload)=>receive({origin:c.location.origin,source:frame,data:{type:'yod:case:request',version:1,id,method,payload}});
 return{send,transport,replies,selected,selection:(origin,source)=>receive({origin,source,data:{type:'yod:case:selection',version:1,case_id:'A'}}),frame};
}
test('P3: real bridge deduplicates reads while sending a mutation on its existing lane',async()=>{
 const p=await plan(),h=bridge(p),d=deferred();let reads=0,writes=0;
 h.transport.read=()=>{reads++;return d.promise;};h.transport.enqueue=async v=>{writes++;return{request_id:v.request_id};};
 const a=h.send('a','read',{case_id:'A'}),b=h.send('b','read',{case_id:'A'});await tick();
 await h.send('w','enqueue',{case_id:'A',request_id:'original',expected_revision:'r1',message:'synthetic'});
 assert.equal(reads,1);assert.equal(writes,1);assert.equal(h.replies[0].result.request_id,'original');d.resolve({ok:true});await Promise.all([a,b]);assert.equal(h.replies.length,3);p.revoke();
});
test('P3: real bridge falls back when module unavailable and rejects foreign selection hints',async()=>{
 const p=await plan(),h=bridge(p,{fallback:true});h.transport.read=async()=>({ok:true});
 await h.selection('https://foreign.invalid',h.frame);await h.selection('https://synthetic.invalid',{});assert.equal(h.selected.length,0);
 await h.selection('https://synthetic.invalid',h.frame);assert.deepEqual(h.selected,['A']);
 await h.send('a','read',{case_id:'A'});assert.equal(h.replies[0].result.ok,true);p.revoke();
});

test('P4: bridge guard retains IDs and runs read reconciliation before any uncertain retry',async()=>{
 const p=await plan();let receive,posts=0,reads=0;const replies=[],frame={postMessage:m=>replies.push(m)};
 const c=vm.createContext({location:{origin:'https://synthetic.invalid'},setTimeout,clearTimeout,addEventListener:(n,f)=>{receive=f;},removeEventListener(){}});
 vm.runInContext(fs.readFileSync('os/despacho-conversation.js','utf8'),c);
 const transport={enqueue:async()=>{posts++;throw Error('timeout');}};
 c.YodDespachoConversation.bind({isAuthorized:()=>true,getEpoch:()=>1,getIframeWindow:()=>frame,getTransport:()=>transport,
  scheduleWrite:(m,v,run,current)=>p.writeCase(m,v,run,current,async()=>{reads++;})});
 const send=id=>receive({origin:c.location.origin,source:frame,data:{type:'yod:case:request',version:1,id,method:'enqueue',payload:{case_id:'A',request_id:'original',expected_revision:'r1',message:'draft'}}});
 await send('first');await send('second');assert.equal(posts,1);assert.equal(reads,1);assert.equal(replies.length,2);assert.equal(replies[1].error,'timeout');p.revoke();
});
test('P4: invalidation does not reuse a pending pre-write flight',async()=>{
 const p=await plan(),d=deferred();let calls=0;p.select('A');
 const old=p.readCase('read',{case_id:'A'},'conversation',()=>d.promise,current);await tick();const rejected=assert.rejects(old,/stale_revision/);
 p.invalidate();const fresh=p.readCase('read',{case_id:'A'},'conversation',()=>{calls++;return {result:{ok:true,revision:'new'},error:null};},current);
 d.resolve({result:{ok:true,revision:'old'},error:null});await rejected;assert.equal((await fresh).result.revision,'new');assert.equal(calls,1);p.revoke();
});
