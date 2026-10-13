
'use strict';
// Dummy only: no external business access, microphone or production data.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),actual=require('node:child_process').execFileSync('git',['-c','safe.directory='+root,'-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(actual,process.env.EXPECTED_UX_COMMIT||actual);console.log('EXPECTED_DUMMY_COMMIT:'+actual);
const out=process.env.UX_EVIDENCE_DIR||'/tmp/yod-dummy-evidence';fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b);});});
let browser;
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('yod_os_sidebar_v1','compact'));
 const blocked=[],errors=[],page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await context.route('**/*',r=>{if(r.request().url().startsWith(base))r.continue();else{blocked.push(r.request().url());r.abort();}});
 async function shot(name){const b=await page.screenshot({path:path.join(out,name+'.png')});console.log('DUMMY_SCREENSHOT:'+name+':'+b.toString('base64'));}
 async function scene(name){await page.locator('#dummy-scene').selectOption(name);await page.waitForTimeout(70);}
 async function visibleComposer(){const a=await page.locator('#message-input').boundingBox();assert(a&&a.width>=180&&a.y+a.height<=page.viewportSize().height,'composer available');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow');}
 await page.goto(base+'/os/agent-dummy.html',{waitUntil:'networkidle'});await page.locator('#dummy-scene option').first().waitFor({state:'attached'});await page.locator('.ui-sidebar-toggle').waitFor();
 assert.equal(await page.locator('aside[aria-label="Navegación global"]').count(),1);assert.equal(await page.locator('[data-card]').count(),6);assert.match(await page.locator('[data-card="terreno"]').innerText(),/500/);await visibleComposer();await shot('dummy-01-conversacion');
 await scene('correction');await page.locator('[data-dummy-action="prepare-correction"]').click();assert.match(await page.locator('#message-input').inputValue(),/644/);assert.match(await page.locator('[data-card="terreno"]').innerText(),/500/,'draft does not apply');
 await page.locator('[aria-label="Enviar mensaje local de ejemplo"]').click();assert.match(await page.locator('[data-card="terreno"]').innerText(),/644/);
 await page.locator('.message-cite[data-source$=":local-change"]').last().click();await visibleComposer();await shot('dummy-02-correccion');
 await page.locator('#message-input').fill('Corrige la superficie de 500 a 644 m² con la ficha del terreno.');await page.locator('[aria-label="Enviar mensaje local de ejemplo"]').click();
 await page.locator('#work-menu').click();await page.locator('[data-resource="history"]').click();assert.equal(await page.locator('.dummy-receipt').count(),1,'one correction receipt');
 await page.locator('#case-select').selectOption('demo-luis');assert.match(await page.locator('[data-card="terreno"]').innerText(),/500/);await page.locator('#case-select').selectOption('demo-gaston');assert.match(await page.locator('[data-card="terreno"]').innerText(),/644/);
 await page.locator('#message-input').fill('Este borrador debe conservarse.');await scene('norm');await page.locator('#comment-source').click();assert.equal(await page.locator('#message-input').inputValue(),'Este borrador debe conservarse.');await visibleComposer();await shot('dummy-03-normativa');
 await scene('market');assert.match(await page.locator('#source-body').innerText(),/MXN\/mes/);await page.locator('#source-body [data-source$=":rent"]').click();assert.match(await page.locator('#source-body').innerText(),/mes por unidad/);await visibleComposer();await shot('dummy-04-mercado');
 await scene('compare');await page.locator('[data-scenario="v3"]').click();assert.match(await page.locator('#source-body').innerText(),/Consulta V3/);assert.match(await page.locator('#source-body').innerText(),/9.09 unidades/);assert.match(await page.locator('[data-card="viabilidad"]').innerText(),/No defendible/);assert.equal(await page.locator('#defended-version').innerText(),'V2');assert.equal(await page.locator('#message-input').inputValue(),'Este borrador debe conservarse.');await visibleComposer();await shot('dummy-05-formulas');
 await scene('work');assert.match(await page.locator('#source-body').innerText(),/SIMULADO/);for(let i=0;i<3;i++)await page.locator('[data-dummy-action="advance-work"]').click();
 assert.match(await page.locator('#source-body').innerText(),/4 de 4/);await visibleComposer();await shot('dummy-06-trabajo');
 await scene('presentation');assert.match(await page.locator('#source-body').innerText(),/presentación V2 · consulta V3/);await page.locator('[data-dummy-action="slide-2"]').click();assert.match(await page.locator('#source-body').innerText(),/Criterio de cierre/);await page.locator('[data-dummy-action="ask-presentation"]').click();assert.match(await page.locator('#message-input').inputValue(),/mayor TIR/);assert(await page.locator('#context-viewer').isHidden());
 await scene('presentation');await visibleComposer();await shot('dummy-07-presentacion');
 await page.locator('#dummy-overview').click();assert.equal(await page.locator('[data-dummy-scene]').count(),7);assert.match(await page.locator('#source-body').innerText(),/mide el recorrido/);
 await page.setViewportSize({width:1366,height:768});await scene('conversation');await visibleComposer();await shot('dummy-08-chromebook');
 await page.setViewportSize({width:390,height:844});await scene('norm');await visibleComposer();const mark=await page.locator('#source-body mark').first().boundingBox(),box=await page.locator('#source-body').boundingBox();assert(mark&&box&&Math.max(0,Math.min(mark.y+mark.height,box.y+box.height)-Math.max(mark.y,box.y))>=mark.height*.5,'highlight visible at entry');
 await page.locator('#comment-source').click();await visibleComposer();await shot('dummy-09-movil');
 await scene('compare');assert.match(await page.locator('#source-body').innerText(),/Consulta V3/);await visibleComposer();await shot('dummy-10-movil-formulas');
 await page.locator('#case-select').selectOption('demo-ruisenor');assert.match(await page.locator('#project-goal').innerText(),/Comparar/);await scene('work');await page.locator('[data-dummy-action="advance-work"]').click();await page.locator('[data-dummy-action="advance-work"]').click();assert.match(await page.locator('#source-body').innerText(),/La entrega no se cierra/);assert.equal(await page.locator('[data-dummy-action="advance-work"]').count(),0);
 assert.equal(blocked.length,0,'no external requests');assert.deepEqual(errors,[],'no JS/CSP errors');console.log('DUMMY_RESULT:PASS');
 await context.close();
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
