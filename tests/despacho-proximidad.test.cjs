const test=require('node:test'),assert=require('node:assert/strict');
test('proximity requires current identity, visibility and dwell; dismissal stays latched until leaving',async()=>{
 const {createProximityGate}=await import('../despacho3d/agent-proximity.mjs'),g=createProximityGate();
 const sample=(now,over={})=>g.sample({caseId:'synthetic-a',distance:1.2,visible:true,enabled:true,now,...over});
 assert.equal(sample(0,{visible:false}),null);assert.equal(sample(500,{enabled:false}),null);
 assert.equal(sample(600),null);assert.equal(sample(1049),null);assert.equal(sample(1050),'synthetic-a');
 assert.equal(sample(3000),null);assert.equal(sample(3100,{enabled:false}),null);assert.equal(sample(5000),null);
 sample(5100,{distance:2.6});assert.equal(sample(5200),null);assert.equal(sample(5650),'synthetic-a');
});
test('explicit wheel opening suppresses automatic repeat; changing or revoking case resets identity',async()=>{
 const {createProximityGate}=await import('../despacho3d/agent-proximity.mjs'),g=createProximityGate();
 const p={caseId:'synthetic-a',distance:1,visible:true,enabled:true};g.suppress(p.caseId);
 assert.equal(g.sample({...p,now:1000}),null);
 assert.equal(g.sample({...p,caseId:'synthetic-b',now:1200}),null);
 assert.equal(g.sample({...p,caseId:'synthetic-b',now:1650}),'synthetic-b');
 assert.equal(g.sample({...p,caseId:null,now:2000}),null);
 assert.equal(g.sample({...p,distance:NaN,now:3000}),null);
});
test('leaving line of sight resets dwell instead of accumulating through walls',async()=>{
 const {createProximityGate}=await import('../despacho3d/agent-proximity.mjs'),g=createProximityGate();
 const p={caseId:'synthetic-a',distance:1,visible:true,enabled:true};
 g.sample({...p,now:0});g.sample({...p,visible:false,now:400});
 assert.equal(g.sample({...p,now:800}),null);assert.equal(g.sample({...p,now:1249}),null);assert.equal(g.sample({...p,now:1250}),p.caseId);
});
