
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const data=import(pathToFileURL(path.resolve(__dirname,'../os/agent-dummy.data.mjs')).href);
test('surface correction requires its exact case source and keeps one receipt',async()=>{
 const {createInteraction,correctSurface}=await data,d=createInteraction('demo-gaston');
 assert.equal(correctSurface(d,644,'demo-luis:deed').ok,false);assert.equal(d.surface_m2,500);
 assert.equal(correctSurface(d,500,'demo-gaston:deed').ok,false);
 const one=correctSurface(d,644,'demo-gaston:deed'),two=correctSurface(d,644,'demo-gaston:deed');
 assert.equal(one.receipt,two.receipt);assert.equal(two.repeated,true);assert.equal(d.surface_m2,644);assert.equal(d.events.length,1);
 assert.equal(createInteraction('demo-luis').surface_m2,500);
});
test('a local delivery stays blocked until its surface evidence is reconciled',async()=>{
 const {createInteraction,advanceLocalWork,correctSurface}=await data,d=createInteraction('demo-ruisenor');
 assert(advanceLocalWork(d));assert(advanceLocalWork(d));assert.equal(advanceLocalWork(d),false);assert.equal(d.workflow_stage,'review');assert.equal(d.tasks[3].complete,false);
 correctSurface(d,644,'demo-ruisenor:deed');assert(advanceLocalWork(d));assert.equal(d.workflow_stage,'ready');assert.equal(d.tasks.filter(x=>x.complete).length,4);
 assert.equal(advanceLocalWork(d),false);
});
test('annual didactic IRR and NPV use one matching period; absence is not zero',async()=>{
 const {onePeriodResult}=await data;
 for(const [terminal,irr,npv]of [[115,.15,4.54545454545],[118,.18,7.27272727272],[120,.20,9.09090909090]]){
 const r=onePeriodResult(-100,terminal,.10);assert(Math.abs(r.irr-irr)<1e-12);assert(Math.abs(r.npv-npv)<1e-8);}
 assert.equal(onePeriodResult(undefined,118,.10),null);assert.equal(onePeriodResult(100,118,.10),null);assert.equal(onePeriodResult(-100,118,-1),null);
 assert.equal(onePeriodResult(-100,100,0).irr,0);
});
test('tour visits do not count as deliverables and unknown scenes cannot change context',async()=>{
 const {createInteraction,visitScene}=await data,d=createInteraction('demo-luis');
 assert.equal(visitScene(d,'norm'),true);visitScene(d,'norm');assert.equal(d.visited.length,2);
 assert.equal(visitScene(d,'other-case'),false);assert.equal(d.scene,'norm');assert.equal(d.tasks.filter(t=>t.complete).length,0);
});
