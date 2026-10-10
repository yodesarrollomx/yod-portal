const test=require('node:test'),assert=require('node:assert/strict');
const base={model:'gpt-6.1-sol',effort:'low'},astra={model:'gpt-6-astra',effort:'high'};
const reply=(id='case1')=>({ok:true,case_id:id,can_edit:true,revision:0,preference:null,tasks:[]});
test('model UI constrains effort by chosen model and rejects mismatched authorization',async()=>{
 const {MODEL_OPTIONS,validateModelSettings}=await import('../despacho3d/model-settings.mjs');assert(MODEL_OPTIONS[0].efforts.includes('none'));assert(!MODEL_OPTIONS[1].efforts.includes('none'));assert(!MODEL_OPTIONS[2].efforts.includes('minimal'));
 assert.throws(()=>validateModelSettings(reply('other'),'case1'));assert.throws(()=>validateModelSettings({...reply(),can_edit:false},'case1'));assert.throws(()=>validateModelSettings({...reply(),preference:{model:base.model,effort:'none'}},'case1'));
});
test('lost receipt retries identical request, successful change reports live ACK separately',async()=>{
 const {createModelSettings}=await import('../despacho3d/model-settings.mjs');const calls=[];let n=0,apply=0;
 const c=createModelSettings({uuid:()=> 'req1',transport:{readModelPreferences:async()=>reply(),setModelPreferences:async p=>{calls.push(p);if(++n===1)throw Error('lost');return {...reply(),revision:1,preference:astra,receipt:{id:'receipt1',case_id:'case1',request_id:p.request_id,at:new Date().toISOString()}};}},applyLive:async()=>{apply++;return false;}});
 await c.read('case1');assert.equal(await c.save('agent',null,astra),false);assert(c.snapshot.pending);assert.equal(await c.save('agent',null,base),true);assert.deepEqual(calls[0],calls[1]);assert.equal(c.snapshot.pending,null);assert.equal(apply,1);assert.match(c.snapshot.notice,/falta confirmar/);
});
test('stale and finished task changes cannot be presented as saved; late response after case switch discarded',async()=>{
 const {createModelSettings}=await import('../despacho3d/model-settings.mjs');let release;const c=createModelSettings({transport:{readModelPreferences:async p=>p.case_id==='slow'?new Promise(r=>release=r):reply(p.case_id),setModelPreferences:async()=>({ok:false,error:'stale_revision'})}});
 const old=c.read('slow');await c.read('case1');release(reply('slow'));await old;assert.equal(c.snapshot.caseId,'case1');assert.equal(c.snapshot.value.case_id,'case1');assert.equal(await c.save('task','nonexistent',astra),false);assert.equal(await c.save('agent',null,astra),false);assert.match(c.snapshot.notice,/Otro cambio/);assert.equal(c.snapshot.value.preference,null);
});
test('unauthorized profile never enables editing or sends a save request',async()=>{
 const {createModelSettings}=await import('../despacho3d/model-settings.mjs');let writes=0;const c=createModelSettings({transport:{readModelPreferences:async()=>({ok:false,error:'unauthorized'}),setModelPreferences:async()=>writes++}});await c.read('case1');await c.save('agent',null,base);assert.equal(writes,0);assert.equal(c.snapshot.value,null);
});
