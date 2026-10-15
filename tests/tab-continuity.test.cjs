'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../os/tab-continuity.mjs');
function harness(){let time=0,serial=0;const timers=new Map(),channels=[],messages=[];
 const channel=()=>{const c={onmessage:null,postMessage(m){messages.push(m);for(const other of channels)if(other!==c)other.onmessage?.({data:structuredClone(m)});},close(){channels.splice(channels.indexOf(c),1);}};channels.push(c);return c;};
 const schedule=(f,ms)=>{const id=++serial;timers.set(id,{f,at:time+ms});return id;};
 return{channel,messages,now:()=>time,schedule,cancel:id=>timers.delete(id),advance(ms){time+=ms;const due=[...timers].filter(([,t])=>t.at<=time);for(const[id,t]of due){timers.delete(id);t.f();}}};
}
test('P4: two tabs elect background leader; expiry recovers frozen leader without blocking foreground',async()=>{
 const {createTabContinuity}=await load(),h=harness();let pauseA,pauseB;
 const a=createTabContinuity({...h,id:'A',channel:h.channel(),onPause:v=>pauseA=v});
 const b=createTabContinuity({...h,id:'B',channel:h.channel(),onPause:v=>pauseB=v});h.advance(5000);
 assert.equal(pauseA,false);assert.equal(pauseB,true);
 a.close();assert.equal(pauseB,false);b.close();
 const c=createTabContinuity({...h,id:'C',channel:h.channel(),onPause:v=>pauseB=v}),ghost=h.channel();ghost.postMessage({version:1,type:'pulse',id:'A'});assert.equal(pauseB,true);
 h.advance(15001);assert.equal(pauseB,false);c.close();
});
test('P4: hidden/offline pauses only background; simultaneous wake signals coalesce',async()=>{
 const {createTabContinuity}=await load(),h=harness();let pause,wakes=0;
 const t=createTabContinuity({...h,channel:null,id:'A',onPause:v=>pause=v,onWake:()=>wakes++});
 t.state({visible:false,online:true});assert.equal(pause,true);
 t.state({visible:true,online:false});assert.equal(pause,true);
 t.state({visible:true,online:true});t.changed();t.changed();h.advance(200);assert.equal(wakes,1);assert.equal(pause,false);t.close();
});
test('P4: channel accepts only non-sensitive fixed schema; no rebroadcast loop',async()=>{
 const {createTabContinuity}=await load(),h=harness(),channel=h.channel(),peer=h.channel();let dirty=0,wakes=0;
 const t=createTabContinuity({...h,id:'B',channel,onDirty:()=>dirty++,onWake:()=>wakes++});
 peer.postMessage({version:1,type:'dirty',id:'A',token:'synthetic-secret'});assert.equal(dirty,0);
 peer.postMessage({version:1,type:'dirty',id:'A'});peer.postMessage({version:1,type:'dirty',id:'A'});h.advance(200);assert.equal(dirty,1);assert.equal(wakes,1);
 t.changed();const sent=h.messages.at(-1);assert.deepEqual(Object.keys(sent).sort(),['id','type','version']);t.close();
});
test('P4: absent channel works independently; close releases timers and sends no later wake',async()=>{
 const {createTabContinuity}=await load(),h=harness();let wakes=0;const t=createTabContinuity({...h,channel:null,id:'A',onWake:()=>wakes++});
 assert.equal(t.snapshot().leader,true);t.changed();t.close();h.advance(20000);assert.equal(wakes,0);
});
