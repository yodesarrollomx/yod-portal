const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function(browser,out,root){
 for(const width of [1366,390]){
 const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fixture.test/**',route=>{
 const u=new URL(route.request().url());if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:`<html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/despacho3d/office.css"><body><main id="workspace" style="height:100vh"><div id="scene"></div></main><script type="module">
 import {mountResidentDock} from '/despacho3d/resident-dock.mjs';
 const profiles=['A','B','C','D'].map(x=>({id:x,case_id:x,entity_kind:'case',name:'Agente '+x}));let selection=null,catalog={phase:'loading',cases:[]},obs=[],states=[],cats=[],works=[];
 window.__talks=[];window.__setCatalog=phase=>{catalog={phase,cases:phase==='current'?profiles:[]};cats.forEach(f=>f(catalog));states.forEach(f=>f());};
 window.__works=()=>{obs=profiles.map(p=>({case_id:p.id,phase:'ready',checked_at:Date.now(),auton_status:{case_id:p.id,admission:'alta',activity:'working',observed_at:new Date().toISOString()},work:{case_id:p.id,phase:'working',goal_id:'synthetic',progress:{progress:{tasks:[{status:'ready_for_review'},{status:'pending'}]}}}}));works.forEach(f=>f());};
 window.YodResidentAgents={getAuthorizedProfiles:()=>catalog.cases,getSelection:()=>selection,snapshot:()=>({phase:selection?'standby':'selection_required'}),subscribe:f=>{states.push(f);return()=>{};},subscribeAuthorizedProfiles:f=>{cats.push(()=>f(catalog.cases));f(catalog.cases);return()=>{};},subscribeCatalog:f=>{cats.push(f);f(catalog);return()=>{};},openForCase:async id=>{selection={case_id:id,can_enqueue:id!=='B'};return true;}};
 window.YodRoomWork={snapshot:()=>obs,subscribe:f=>{works.push(f);return()=>{};}};
 window.YodAgentMenu={openForCase:async(id,target)=>{window.__talks.push({id,target});return true;}};
 mountResidentDock();await import('/despacho3d/office-loading.mjs');window.__ready=()=>{window.despacho={};window.YodVoiceWorkspace={};dispatchEvent(new Event('yod-office-ready'));};
 </script></body></html>`});
 const f=path.join(root,u.pathname);if(!fs.existsSync(f))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.css')?'text/css':'text/javascript'});
 });
 await page.goto('https://fixture.test/');await page.locator('#office-load-status').waitFor();
 assert.equal(await page.locator('progress').getAttribute('value'),'0');
 await page.evaluate(()=>window.__ready());assert.equal(await page.locator('progress').getAttribute('value'),'2');
 await page.evaluate(()=>window.__setCatalog('reconnecting'));assert.match(await page.locator('#office-load-status').innerText(),/Recuperando/);
 await page.evaluate(()=>{window.__setCatalog('current');window.__works();});assert.equal(await page.locator('#office-load-status').isVisible(),false);
 assert.equal(await page.locator('.resident-dock-card').count(),4);assert.match(await page.locator('.resident-dock-card').first().innerText(),/1\/2 para revisar/);
 assert.deepEqual(await page.evaluate(()=>window.__talks),[]);
 await page.getByRole('button',{name:'Hablar con Agente A',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.__talks),[{id:'A',target:'conversaciones'}]);
 await page.getByRole('button',{name:'Hablar con Agente B',exact:true}).click();assert.equal((await page.evaluate(()=>window.__talks)).length,1);assert.match(await page.locator('.resident-dock-notice').innerText(),/no está autorizada/);
 const box=await page.locator('#resident-dock').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);assert.ok(box.height<130);
 await page.screenshot({path:path.join(out,'oficina283-dock-'+width+'.png')});
 await page.evaluate(()=>window.__setCatalog('unauthorized'));assert.equal(await page.locator('#resident-dock').isVisible(),false);assert.match(await page.locator('#office-load-status').innerText(),/Valida tu acceso/);
 assert.deepEqual(errors,[]);await context.close();
 }
 console.log('283 carga real/dock/voz explícita/consulta/revocación desktop+móvil PASS');
};
