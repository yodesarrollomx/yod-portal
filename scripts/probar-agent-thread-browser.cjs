
'use strict';
// Isolated visual prototype verification; no provider, microphone or business network.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),actual=require('node:child_process').execFileSync('git',['-c','safe.directory='+root,'-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(actual,process.env.EXPECTED_UX_COMMIT||actual);console.log('EXPECTED_THREAD_COMMIT:'+actual);
const out=process.env.UX_EVIDENCE_DIR||'/tmp/yod-thread-evidence';fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b);});});
let browser;
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});await context.addInitScript(()=>localStorage.setItem('yod_os_sidebar_v1','compact'));
 const blocked=[],errors=[];await context.route('**/*',r=>{if(r.request().url().startsWith(base))r.continue();else{blocked.push(r.request().url());r.abort();}});
 const modes=process.env.AGENT_THREAD_MODE?[process.env.AGENT_THREAD_MODE]:['preview','dummy'];
 for(const mode of modes){
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 async function shot(name){const b=await page.screenshot({path:path.join(out,name+'.png')});console.log('THREAD_SCREENSHOT:'+name+':'+b.toString('base64'));}
 async function composer(){const b=await page.locator('#message-input').boundingBox();assert(b&&b.y+b.height<=page.viewportSize().height+1,'composer within height');}
 async function stableChat(prior){
 const chat=await page.locator('.dialogue-column').boundingBox(),project=await page.locator('.project-column').boundingBox();
 assert(chat.x>=project.x+project.width-1,'conversation always to the right');assert(Math.abs(chat.y-project.y)<2,'conversation starts at project top');assert(chat.height>=page.viewportSize().height-chat.y-24,'conversation full remaining height');
 if(prior)for(const k of ['x','y','width','height'])assert(Math.abs(chat[k]-prior[k])<2,'chat '+k+' unchanged by detail');
 const detail=await page.locator('#context-viewer').boundingBox();if(detail)assert(detail.x+detail.width<=chat.x,'detail contained at left');await composer();return chat;
 }
 async function panel(which){await page.locator(which==='chat'?'#mobile-chat':'#mobile-ppp').click();await page.waitForTimeout(40);}
 await page.goto(base+'/os/agent-'+(mode==='dummy'?'dummy':'preview')+'.html',{waitUntil:'networkidle'});await page.locator('[data-card="terreno"]').waitFor();await page.locator('.ui-sidebar-toggle').waitFor();
 assert.equal(await page.locator('aside[aria-label="Navegación global"]').count(),1);assert.equal(await page.locator('[data-card]').count(),6);
 assert.equal(await page.locator('#menu-toggle').isVisible(),false,'no second desktop navigation button');assert.equal(await page.locator('.dialogue-column #context-viewer').count(),0);const original=await stableChat();const cardBoxes=await page.locator('[data-card]').evaluateAll(cards=>cards.map(e=>({h:e.clientHeight,body:e.scrollHeight})));assert(cardBoxes.every(b=>b.h>=b.body-2),'overview card content is not internally clipped');await shot(mode+'-01-entrada');
 assert.equal(await page.locator('#mission-control').getAttribute('data-done'),'0');assert.equal(await page.locator('.result-route [data-result]').count(),4);assert.equal(await page.locator('.mission-action').isVisible(),true);assert.match(await page.locator('[data-card="normativa"]').innerText(),/0.*de 3/s);
 await page.locator('#message-input').fill('Mi borrador se conserva.');
 for(const key of ['terreno','documentos','normativa','mercado','escenarios','viabilidad']){
 await page.locator('.card-heading[data-detail="'+key+'"]').click();await page.locator('#source-title').waitFor({state:'visible'});await stableChat(original);
 assert.equal(await page.locator('#message-input').inputValue(),'Mi borrador se conserva.');assert.equal(await page.locator('.context-viewer').count(),1);for(const b of await page.locator('.mini-card').all()){const box=await b.boundingBox();assert(box.height<=46,'compact cards fit44px');}
 await shot(mode+'-detail-'+key);
 }
 await page.locator('.card-heading[data-detail="escenarios"]').click();await page.locator('#source-body [data-scenario="v3"]').click();assert.equal(await page.locator('#consulting-version').innerText(),'V3');assert.equal(await page.locator('#defended-version').innerText(),'V2');
 await page.locator('.card-heading[data-detail="normativa"]').click();await page.locator('#source-body [data-source$=":norm"]').click();assert.match(await page.locator('#source-body').innerText(),/fuente|fuente/i);await page.locator('#comment-source').click();assert.equal(await page.locator('#message-input').inputValue(),'Mi borrador se conserva.');
 assert.match(await page.locator('#draft-reference').innerText(),/V3/);await stableChat(original);await shot(mode+'-02-evidencia-hilo');
 await page.locator('#mic-button').click();await page.waitForTimeout(100);assert.equal(await page.locator('.message-user[data-input-kind="voice"]').count(),1);assert.equal(await page.locator('.message-user[data-input-kind="voice"][data-phase="partial"]').count(),1);
 await page.waitForTimeout(1100);assert.equal(await page.locator('.message-user[data-input-kind="voice"]').count(),1);assert.equal(await page.locator('.message-agent[data-input-kind="voice"]').count(),1);
 assert.equal(await page.locator('.message[data-phase="partial"]').count(),0);assert.match(await page.locator('.message-user[data-input-kind="voice"]').innerText(),/Comparemos V2 y V3 con sus restricciones/);
 await shot(mode+'-03-voz-un-hilo');await page.locator('#mic-button').click();await page.waitForTimeout(80);await page.locator('#stop-button').click();await page.waitForTimeout(700);assert.equal(await page.locator('.message[data-phase="cancelled"]').count(),1);
 assert.equal(await page.locator('#message-input').inputValue(),'Mi borrador se conserva.');
 await page.locator('#case-select').selectOption('demo-luis');assert.equal(await page.locator('.message-user[data-input-kind="voice"]').count(),0);await page.locator('#case-select').selectOption('demo-gaston');assert.equal(await page.locator('.message-user[data-input-kind="voice"]').count(),2);assert.equal(await page.locator('.message[data-phase="cancelled"] .message-phase').count(),1);
 if(mode==='dummy'){
 await page.locator('.card-heading[data-detail="documentos"]').click();await page.locator('#source-body [data-source$=":deed"]').click();await page.locator('[data-dummy-action="apply-correction"]').click();assert.match(await page.locator('#source-body').innerText(),/644 m²/);assert.equal(await page.locator('#message-input').inputValue(),'Mi borrador se conserva.');await shot('dummy-04-correccion');await page.locator('#close-source').click();assert.match(await page.locator('[data-card="terreno"]').innerText(),/644/);assert.equal(await page.locator('#mission-control').getAttribute('data-done'),'1');assert.equal(await page.locator('#mission-control').getAttribute('data-next'),'norm');await shot('dummy-09-siguiente');
 await page.locator('#work-menu').click();await page.locator('[data-resource="work"]').click();for(let i=0;i<3;i++)await page.locator('[data-dummy-action="advance-work"]').click();assert.match(await page.locator('#source-body').innerText(),/4 de 4/);assert.equal(await page.locator('#mission-control').getAttribute('data-done'),'4');await page.locator('#close-source').click();assert.match(await page.locator('[data-card="normativa"]').innerText(),/0.*de 3/s);await shot('dummy-10-entrega-local');
 await page.locator('#work-menu').click();await page.locator('#work-popover [data-resource="presentation"]').click();await page.locator('[data-dummy-action="slide-2"]').click();await page.locator('[data-dummy-action="ask-presentation"]').click();assert.match(await page.locator('#message-input').inputValue(),/^Mi borrador se conserva/);assert.equal(await page.locator('#context-viewer').isVisible(),true,'presentation remains alongside conversation');await stableChat(original);await shot('dummy-05-presentacion-chat');
 }
 await page.locator('#close-source').click();await page.setViewportSize({width:1366,height:768});await stableChat();await shot(mode+'-06-chromebook');console.log('BOARD_BOUNDS:'+JSON.stringify(await page.locator('[data-card]').evaluateAll(cards=>cards.map(e=>({card:e.dataset.card,root:e.getBoundingClientRect().toJSON(),body:e.querySelector('.card-body').getBoundingClientRect().toJSON()})))));for(const key of ['terreno','documentos','normativa','mercado','escenarios','viabilidad']){const b=await page.locator('[data-card="'+key+'"] .card-body').boundingBox();assert(b&&b.y+b.height<=page.viewportSize().height-24,'six summaries visible on Chromebook: '+key);}
 await page.setViewportSize({width:390,height:844});await panel('project');await page.locator('.card-heading[data-detail="normativa"]').click();await page.locator('#source-body [data-source$=":norm"]').click();
 assert.equal(await page.locator('.project-column').evaluate(e=>e.inert),false);assert.equal(await page.locator('.dialogue-column').evaluate(e=>e.inert),true);await shot(mode+'-07-movil-detalle');
 await page.locator('#comment-source').click();await page.waitForTimeout(70);assert.equal(await page.locator('.dialogue-column').evaluate(e=>e.inert),false);const box=await page.locator('#message-input').boundingBox();assert(box.x>=0&&box.x+box.width<=390&&box.width>=180);await composer();
 assert.equal(await page.locator('.chat-stream').count(),1);assert.match(await page.locator('#draft-reference').innerText(),/Normativa/);await shot(mode+'-08-movil-hilo');
 await panel('project');await page.locator('#close-source').click();assert.equal(await page.locator('#context-viewer').isHidden(),true);
 await page.locator('#menu-toggle').click();assert.equal(await page.locator('.main').evaluate(e=>e.inert),true);await page.keyboard.press('Escape');assert.equal(await page.locator('.main').evaluate(e=>e.inert),false);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'root does not overflow');await page.close();
 }
 assert.equal(blocked.length,0,'no external business requests');assert.deepEqual(errors,[],'no JS or CSP errors');console.log('AGENT_THREAD_RESULT:PASS');await context.close();
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
