const test=require('node:test'),assert=require('node:assert/strict');
const fixture=async()=>{
 const {createEncounterGate}=await import('../despacho3d/agent-proximity.mjs');
 const gate=createEncounterGate(),p={caseId:'synthetic-a',distance:.35,enabled:true,visible:true,facing:true,canTalk:true};
 return{gate,p,sample:(now,extra={})=>gate.sample({...p,now,...extra})};
};
test('deliberate approach opens wheel then waits stationary facing before voice',async()=>{
 const {sample}=await fixture();
 assert.equal(sample(0),null);assert.equal(sample(2000),null,'teleport is not an approach');
 assert.equal(sample(2100,{distance:.55,moving:true}),'menu');
 assert.equal(sample(2200,{moving:true}),null);
 assert.equal(sample(2300),null);assert.equal(sample(3299),null);assert.equal(sample(3300),'voice');
 assert.equal(sample(9000),null,'one conversation per encounter');
});
test('passing, walls, looking away and moving autonomous character cannot start microphone',async()=>{
 for(const denied of [{facing:false},{visible:false},{agentMoving:true},{canTalk:false},{enabled:false},{distance:.5}]){
  const {sample}=await fixture();sample(0,{moving:true});
  sample(100,denied);assert.equal(sample(2000,denied),null);
 }
 const {sample}=await fixture();assert.equal(sample(0,{moving:true,agentMoving:true}),null);
 assert.equal(sample(2000),null);
});
test('dismissal, leave hysteresis, identity change and unavailable selection',async()=>{
 const {sample,gate}=await fixture();sample(0,{moving:true});gate.dismiss('synthetic-a');
 assert.equal(sample(1000),null);assert.equal(sample(3000),null);
 assert.equal(sample(3100,{distance:.91}),'leave');
 assert.equal(sample(3200,{moving:true}),'menu');sample(3300);assert.equal(sample(4300),'voice');
 assert.equal(sample(4400,{caseId:'synthetic-b'}),null);assert.equal(sample(6400,{caseId:'synthetic-b'}),null);
 assert.equal(sample(6500,{caseId:null}),null);
});
test('dwell resets on loss of focus or facing',async()=>{
 const {sample}=await fixture();sample(0,{moving:true});sample(100);sample(900,{enabled:false});
 assert.equal(sample(1100),null);assert.equal(sample(2099),null);assert.equal(sample(2100),'voice');
});
