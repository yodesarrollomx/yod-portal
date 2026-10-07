const test=require('node:test'),assert=require('node:assert/strict');
test('preparation radius has hysteresis, bounded retries and no close-range voice action',async()=>{
 const {createPreparationGate}=await import('../despacho3d/agent-proximity.mjs');
 const gate=createPreparationGate(),sample=(distance,now=0,enabled=true)=>gate.sample({caseId:'a',distance,now,enabled});
 assert.equal(sample(8),null);assert.equal(sample(5),'prepare');assert.equal(sample(4,1000),null);
 assert.equal(sample(.4,2000),null);assert.equal(sample(6,31000),null);assert.equal(sample(4,31000),'prepare');
 assert.equal(sample(7,32000),'release');assert.equal(sample(8,33000),null);
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
