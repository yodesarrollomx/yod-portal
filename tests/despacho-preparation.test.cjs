const test=require('node:test'),assert=require('node:assert/strict');
test('preparation radius has hysteresis, bounded retries and no close-range voice action',async()=>{
 const {createPreparationGate}=await import('../despacho3d/agent-proximity.mjs');
 const gate=createPreparationGate(),sample=(distance,now=0,enabled=true)=>gate.sample({caseId:'a',distance,now,enabled});
 assert.equal(sample(13),null);assert.equal(sample(10),'prepare');assert.equal(sample(4,1000),null);
 assert.equal(sample(.4,2000),null);assert.equal(sample(11,31000),null);assert.equal(sample(4,31000),'prepare');
 assert.equal(sample(12,32000),'release');assert.equal(sample(13,33000),null);
 assert.equal(sample(5,34000),'prepare');assert.equal(sample(4,35000,false),'release');
});
test('prepared peers expire and late offers cannot revive discarded preparation',async()=>{
 const {createVoicePreparation}=await import('../despacho3d/voice-preparation.mjs');
 let now=0,release;const peers=[];
 class Peer{constructor(){this.closed=false;peers.push(this);}addTransceiver(){return {sender:{}};}createDataChannel(){return {close(){}};}async createOffer(){return {type:'offer',sdp:'v=0'};}async setLocalDescription(v){this.localDescription=v;}close(){this.closed=true;}}
 const preparation=createVoicePreparation({Peer,gather:async()=>{},now:()=>now,ttl:1000});
 await preparation.warm('a');now=1001;assert.equal(await preparation.take('a'),null);assert.equal(peers[0].closed,true);
 const delayed=createVoicePreparation({Peer,gather:()=>new Promise(r=>{release=r;}),now:()=>now});
 const pending=delayed.warm('a');await new Promise(r=>setImmediate(r));delayed.discard();release();
 assert.equal(await pending,null);assert.equal(await delayed.take('a'),null);assert.equal(peers[1].closed,true);
});

test('office entry warms once, retries failures after a delay, and never retries recursively',async()=>{
 const {createEntryPreparation}=await import('../despacho3d/voice-preparation.mjs');
 let now=0,calls=0,controller;const results=[];
 controller=createEntryPreparation({now:()=>now,prepare:async(id,options)=>{calls++;assert.equal(options.connection,true);return false;},
  onResult:(id,ok)=>{results.push(ok);void controller.update(id);}});
 await controller.update('case-a');assert.equal(calls,1);
 await controller.update('case-a');assert.equal(calls,1);
 now=30000;await controller.update('case-a');assert.equal(calls,2);
 await controller.update('case-b');assert.equal(calls,3);
 now=60000;await controller.update('case-b',{idle:false});assert.equal(calls,3);
 await controller.update(null);assert.deepEqual(results,[false,false,false]);
});
test('late preparations cannot mark a different or hidden resident ready',async()=>{
 const {createEntryPreparation}=await import('../despacho3d/voice-preparation.mjs');
 const waiting=[],results=[];let discarded=0;
 const c=createEntryPreparation({prepare:id=>new Promise(resolve=>waiting.push({id,resolve})),discard:()=>discarded++,onResult:(...r)=>results.push(r)});
 const a=c.update('a');await new Promise(r=>setImmediate(r));
 const b=c.update('b');await new Promise(r=>setImmediate(r));
 waiting[0].resolve(true);await a;assert.deepEqual(results,[]);
 await c.update('b',{visible:false});waiting[1].resolve(true);await b;assert.deepEqual(results,[]);
 assert.ok(discarded>=3);
});
