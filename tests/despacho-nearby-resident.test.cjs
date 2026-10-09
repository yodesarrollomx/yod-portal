const test=require('node:test'),assert=require('node:assert/strict');
const loaded=import('../despacho3d/nearby-resident.mjs');
const row=(id,x,z)=>({profile:{id,case_id:id,entity_kind:'case'},anchor:[x,1.8,z]});
test('approach follows nearest authorized resident with selection hysteresis',async()=>{
 const {nearbyResident}=await loaded,residents=[row('one',0,0),row('two',3,0),row('three',9,0)];
 assert.equal(nearbyResident({residents,point:[2.8,0],currentCaseId:'one'}).case_id,'two');
 assert.equal(nearbyResident({residents,point:[1.6,0],currentCaseId:'one'}).case_id,'one');
 assert.equal(nearbyResident({residents,point:[8.8,0],currentCaseId:'two'}).case_id,'three');
 assert.equal(nearbyResident({residents,point:[30,0]}),null);
});
test('invalid identity, missing catalog and nonfinite coordinates never select a resident',async()=>{
 const {nearbyResident}=await loaded;
 assert.equal(nearbyResident({residents:[{...row('x',0,0),profile:{id:'x',case_id:'other',entity_kind:'case'}}],point:[0,0]}),null);
 assert.equal(nearbyResident({residents:[row('x',0,0)],point:[NaN,0]}),null);
 assert.equal(nearbyResident({point:[0,0]}),null);
});
