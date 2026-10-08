const test=require('node:test'),assert=require('node:assert/strict');
test('independent residents move and return without affecting selected or hidden interactions',async()=>{
 const {createResidentMotion}=await import('../despacho3d/resident-motion.mjs');let place='inicio',motion='idle',calls=[];const p=createResidentMotion({slot:1,pilot:{getMovementState:()=>({place,motion})},navigate:id=>{calls.push(id);return true;}});
 p.update(0);assert.equal(p.update(19000),true);assert.equal(calls.length,1);motion='walk';assert.equal(p.update(50000),false);motion='idle';place='projects';assert.equal(p.update(51000),true);assert.equal(calls.at(-1),'inicio');for(const flag of ['hidden','overlay','reducedMotion','selected'])assert.equal(p.update(100000,{[flag]:true}),false);assert.equal(calls.length,2);
});
