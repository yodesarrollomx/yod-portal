const test=require('node:test'),assert=require('node:assert/strict');
async function setup(){
 const {TerminalLink}=await import('../despacho3d/terminal-link.mjs');let profile={case_id:'synthetic-case'},next=0;const timers=new Map(),sent=[],states=[];
 const popup={closed:false,postMessage:(...args)=>sent.push(args)};
 const win={crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'},addEventListener(){},removeEventListener(){},open:()=>popup,setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),setInterval:fn=>{timers.set(++next,fn);return next;},clearInterval:id=>timers.delete(id)};
 const link=new TerminalLink({win,getProfile:()=>profile,notify:s=>states.push(s)});
 function port(){return {sent:[],start(){},postMessage(m){this.sent.push(m);},close(){this.closed=true;}};}
 function event(type,p){return {origin:'http://127.0.0.1:4381',source:popup,data:{type,version:1,nonce:link.nonce,case_id:'synthetic-case'},ports:p?[p]:[]};}
 return {link,popup,win,timers,states,sent,port,event,revoke:()=>profile=null};
}
test('terminal connection requires profile and local consent, and performs no control on approval',async()=>{
 const s=await setup();assert.equal(s.link.control('start'),false);s.link.connect();assert.equal(s.link.status,'connecting');assert.equal(s.link.control('start'),false);const p=s.port();assert.equal(s.link.accept(s.event('yod:terminal:approved',p)),true);assert.equal(p.sent.some(m=>m.type==='control'),false);s.link.dispose();s.revoke();assert.equal(s.link.connect(),false);
});
test('spoofed origins, windows, nonce, case and multiple ports cannot bind a terminal',async()=>{
 const s=await setup();s.link.connect();const good=s.event('yod:terminal:approved',s.port());
 for(const bad of [{...good,origin:'https://untrusted.invalid'},{...good,source:{}},{...good,data:{...good.data,nonce:'other'}},{...good,data:{...good.data,case_id:'other'}},{...good,ports:[s.port(),s.port()]}])assert.equal(s.link.accept(bad),false);
 assert.equal(s.link.port,null);s.link.dispose();
});
test('local ready only sends canonical hello to exact origin; revocation closes stream and clears views',async()=>{
 const s=await setup();s.link.connect();s.link.accept(s.event('yod:terminal:ready'));assert.equal(s.sent[0][0].case_id,'synthetic-case');assert.equal(s.sent[0][1],'http://127.0.0.1:4381');const p=s.port();s.link.accept(s.event('yod:terminal:approved',p));const received=[];s.link.subscribeTerminal(m=>received.push(m));s.revoke();s.link.revoke();assert.equal(p.closed,true);assert.equal(s.link.status,'disconnected');assert.equal(received.at(-1).t,'clear');assert.equal(p.sent.some(m=>m.type==='control'),false);
});
test('room keyboard is read-only and control actions are bounded',async()=>{
 const s=await setup();s.link.connect();const p=s.port();s.link.accept(s.event('yod:terminal:approved',p));s.link.message({type:'status',status:{live:true,mode:'room'}});s.link.terminal({t:'input',data:'unsafe'});assert.equal(p.sent.some(m=>m.message?.t==='input'),false);assert.equal(s.link.control('shell'),false);s.link.message({type:'status',status:{live:true,mode:'manual'}});s.link.terminal({t:'input',data:'hola'});assert.equal(p.sent.at(-1).message.data,'hola');s.link.dispose();
});
test('late messages from a previous grant cannot write into a new terminal',async()=>{
 const s=await setup();s.link.connect();const a=s.port();s.link.accept(s.event('yod:terminal:approved',a));const late=a.onmessage;s.link.disconnect();s.link.connect();const b=s.port();s.link.accept(s.event('yod:terminal:approved',b));const seen=[];s.link.subscribeTerminal(m=>seen.push(m));late({data:{type:'terminal',message:{t:'data',data:'OLD SECRET'}}});assert.deepEqual(seen,[]);s.link.dispose();
});
test('oversized output, malformed size and unresponsive pairing fail visibly',async()=>{
 const s=await setup();s.link.connect();[...s.timers.values()][0]();assert.equal(s.link.status,'disconnected');assert.ok(s.link.error);s.link.connect();const p=s.port();s.link.accept(s.event('yod:terminal:approved',p));let calls=0;s.link.subscribeTerminal(()=>calls++);s.link.message({type:'terminal',message:{t:'data',data:'x'.repeat(4194305)}});s.link.message({type:'terminal',message:{t:'snapshot',data:'hi',cols:10000,rows:20}});assert.equal(calls,0);s.link.dispose();
});
