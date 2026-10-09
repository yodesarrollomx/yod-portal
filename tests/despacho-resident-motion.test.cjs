const test=require('node:test'),assert=require('node:assert/strict');
test('residents move only from fresh observations, not a timer or selected identity',async()=>{
 const {createResidentMotion,workDestination}=await import('../despacho3d/resident-motion.mjs');
 let place='inicio',motion='idle',now=100000,calls=[];
 const p=createResidentMotion({pilot:{getMovementState:()=>({place,motion})},now:()=>now,navigate:id=>{calls.push(id);return true;}});
 assert.equal(p.update(100000),false);
 p.observe({phase:'ready',case_id:'synthetic',checked_at:now,work:{case_id:'synthetic',phase:'tool',current_tool:'Leer Drive'}});
 assert.equal(p.update(100001,{selected:true}),true);assert.equal(calls.at(-1),'library');
 motion='walk';assert.equal(p.update(104000),false);motion='idle';place='library';
 assert.equal(p.update(104001),false);
 p.observe({phase:'ready',case_id:'synthetic',checked_at:now,work:{case_id:'synthetic',phase:'prepared'}});
 for(const flag of ['hidden','overlay'])assert.equal(p.update(110000,{[flag]:true}),false);
 assert.equal(p.update(110001),true);assert.equal(calls.at(-1),'decisions');
 now+=90001;assert.equal(p.update(220000),false);
 assert.equal(workDestination({phase:'unauthorized',checked_at:now,work:{case_id:'synthetic',phase:'prepared'}},now),null);
 assert.equal(workDestination({phase:'ready',case_id:'synthetic',checked_at:now,work:null},now),'inicio');
});
