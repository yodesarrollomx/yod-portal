const test=require('node:test'),assert=require('node:assert/strict');
const fixture=async()=>{
 const {createEncounterGate}=await import('../despacho3d/agent-proximity.mjs');
 const gate=createEncounterGate(),p={caseId:'synthetic-a',distance:1.95,enabled:true,visible:true,facing:true,canTalk:true};
 return{gate,p,sample:(now,extra={})=>gate.sample({...p,now,...extra})};
};
test('deliberate approach opens wheel at 2.6 m and greets at 2 m after a short pause',async()=>{
 const {sample}=await fixture();
 assert.equal(sample(0),null);assert.equal(sample(2000),null,'teleport is not an approach');
 assert.equal(sample(2100,{distance:2.5,moving:true}),'menu');
 assert.equal(sample(2200,{moving:true}),null);
 assert.equal(sample(2300),null);assert.equal(sample(2749),null);assert.equal(sample(2750),'voice');
 assert.equal(sample(9000),null,'one conversation per encounter');
});
test('passing, walls, looking away, missing access and moving autonomous character block voice',async()=>{
 for(const denied of [{facing:false},{visible:false},{agentMoving:true},{canTalk:false},{enabled:false},{distance:2.01},{moving:true}]){
  const {sample}=await fixture();sample(0,{moving:true});
  sample(100,denied);assert.equal(sample(2000,denied),null);
 }
 const {sample}=await fixture();assert.equal(sample(0,{moving:true,agentMoving:true}),null);assert.equal(sample(2000),null);
});
test('dismissal, leave hysteresis, identity change and unavailable selection',async()=>{
 const {sample,gate}=await fixture();sample(0,{moving:true});gate.dismiss('synthetic-a');
 gate.approach('synthetic-a');assert.equal(sample(1000),null);assert.equal(sample(3000),null);
 assert.equal(sample(3100,{distance:3.21}),'leave');
 assert.equal(sample(3200,{moving:true}),'menu');sample(3300);assert.equal(sample(3750),'voice');
 assert.equal(sample(4400,{caseId:'synthetic-b'}),null);assert.equal(sample(6400,{caseId:'synthetic-b'}),null);
 assert.equal(sample(6500,{caseId:null}),null);
});
test('dwell resets on loss of focus or facing',async()=>{
 const {sample}=await fixture();sample(0,{moving:true});sample(100);sample(400,{enabled:false});
 assert.equal(sample(1100),null);assert.equal(sample(1549),null);assert.equal(sample(1550),'voice');
});
test('remembered approach can resume after slow authority but never bypasses permission or dismissal',async()=>{
 const {sample,gate}=await fixture();gate.approach('synthetic-a');
 assert.equal(sample(0,{enabled:false}),null);
 assert.equal(sample(100),'menu');sample(200,{canTalk:false});
 assert.equal(sample(300),null);assert.equal(sample(750),'voice');
 gate.dismiss('synthetic-a');gate.approach('synthetic-a');assert.equal(sample(1200),null);
});
