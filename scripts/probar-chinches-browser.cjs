'use strict';
// Local synthetic harness; every non-local request is fulfilled by a test double.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
let playwright;
try{playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;playwright=require('/tmp/ppp47-browser/node_modules/playwright');}
const browserName=process.env.CHINCHE_BROWSER||'chromium';
if(!['chromium','webkit'].includes(browserName))throw Error('Unsupported CHINCHE_BROWSER');
const root=path.resolve(__dirname,'..');
const parentHTML=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}iframe{border:0;width:100%;height:100vh}</style></head><body>
<script src="/chinche.js"></script><script src="/os/despacho-chinches.js"></script><script>
localStorage.setItem('pyod_clave_v1','SYNTHETIC-AUTH');window.calls=[];window.pins=[];window.authorized=!location.search.includes('denied');window.epoch=1;
const original=YODChinche.anotar;YODChinche.anotar=op=>{calls.push(op);return original(op)};
YODChinche.init({repo:'yod-portal',pantalla:'os'});
const frame=document.createElement('iframe');window.frame=frame;
window.binding=YodDespachoChinches.bindDespachoChinches({isAuthorized:()=>authorized,getIframeWindow:()=>frame.contentWindow,getSessionEpoch:()=>epoch});
addEventListener('message',e=>{if(e.source===frame.contentWindow&&e.data?.type==='yod:despacho:pin')pins.push(e.data)});
frame.src=location.search.includes('office')?'/despacho3d/index.html':'/synthetic';document.body.append(frame);
</script></body></html>`;
const childHTML=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/despacho3d/office.css"><style>body{overflow:auto;background:white}body>header{height:auto;min-height:70px;padding:8px}main#workspace{height:auto}article{border:1px solid #aaa;padding:8px;margin:8px}dialog{max-width:90vw;width:750px;padding:12px}dialog header{height:auto;color:black;background:white;padding:6px}button{min-height:44px}</style></head><body>
<header><button id="normal">Normal</button></header><main id="workspace"><div id="scene" tabindex="0"><canvas width="160" height="80"></canvas></div><section id="panel" hidden><div id="panel-body"></div></section></main>
<dialog class="workspace-dialog" id="review"><header>Revisión</header><section class="agent-workspace"><section data-panel="tasks"><article id="private-card" data-case-id="PRIVATE-ID"><h2>PRIVATE-NAME</h2><p>PRIVATE-CONVERSATION</p><button id="approve">Aprobar</button><button id="disabled" disabled>Bloqueado</button><a id="private-link" href="https://private.invalid/PRIVATE-URL">Fuente</a><input value="PRIVATE-TOKEN"></article></section></section></dialog>
<script type="module">
import {createChinches3D} from '/despacho3d/chinches3d.mjs?v=2';
window.YODChinche={sentinel:42};window.effects=0;window.cardEffects=0;window.view={position:[8,1.65,-4.45],quaternion:[0,0,0,1],fov:70,mode:'walk'};
window.helper=createChinches3D({readView:()=>view,readZone:()=> 'case'});
for(const t of ['pointerdown','pointerup','mousedown','mouseup','click','keydown','keyup','submit'])addEventListener(t,e=>{if(e.target.matches('#approve,#private-link,#disabled'))effects++},true);
document.addEventListener('click',e=>{if(e.target.closest('#private-card')&&e.target.closest('[data-chinche-ui]'))cardEffects++},true);
window.loaded=true;
</script></body></html>`;
const nestedHTML=`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:12px}button,input{min-height:44px;max-width:90%}</style></head><body><form><input id="private-input" value="PRIVATE-PPP-TOKEN"><button id="save">Guardar PPP</button></form><script>window.effects=0;for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','keydown','keyup','submit'])document.addEventListener(type,e=>{effects++;if(type==='submit')e.preventDefault()},true);</script></body></html>`;
function serverFor(){return http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/parent'||pathname==='/synthetic'){res.setHeader('Content-Type','text/html');res.end(pathname==='/parent'?parentHTML:childHTML);return;}
 if(pathname==='/nested'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(nestedHTML);return;}
 const file=path.resolve(root,'.'+decodeURIComponent(pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'application/octet-stream');res.end(fs.readFileSync(file));
});}
async function pointTo(child,selector){await child.evaluate(()=>YODChinche.senalar());await child.locator('.chinche-ui-hint').waitFor();await child.locator(selector).dispatchEvent('click');}
async function cancelComposer(page){await page.locator('.chn-hoja [data-x]').click();await page.locator('.chn-velo').waitFor({state:'detached'});}
async function run(){
 const server=serverFor();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await playwright[browserName].launch({headless:true});
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile});
   const page=await context.newPage(),network=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>{
    const request=route.request();if(request.url().startsWith(base))return route.continue();
    if(request.url().startsWith('https://synthetic-cross.invalid/'))return route.fulfill({status:200,contentType:'text/html',body:nestedHTML});
    network.push({method:request.method(),body:request.postData()});return route.fulfill({status:200,json:{ok:true}});
   });
   const load=async query=>{await page.goto(base+'/parent'+query,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>frame.contentWindow?.loaded);const child=page.frames().find(f=>f.url().includes('/synthetic'));assert.ok(child);await child.waitForFunction(()=>window.loaded);return child;};
   let child=await load('?denied');
   assert.equal(await child.locator('body>header [data-chinche-ui="select"]').isDisabled(),true);
   await child.evaluate(()=>{
    for(const [origin,source]of [['https://forged.invalid',parent],[location.origin,window]])dispatchEvent(new MessageEvent('message',{origin,source,data:{type:'yod:despacho:ready',version:1}}));
    dispatchEvent(new MessageEvent('message',{origin:location.origin,source:parent,data:{type:'yod:despacho:ready',version:1,token:'FORGED'}}));
   });
   assert.equal(await child.evaluate(()=>YODChinche.senalar()),false);assert.equal(await page.evaluate(()=>calls.length),0);
   child=await load('?token=PRIVATE-PARENT-TOKEN');
   await child.waitForFunction(()=>!document.querySelector('[data-chinche-ui="select"]').disabled);
   assert.equal(await child.evaluate(()=>YODChinche.sentinel),42);
   await child.locator('body>header [data-chinche-ui="select"]').click();
   await page.keyboard.press('Escape');assert.equal(await child.locator('.chinche-ui-hint').isVisible(),false,'Escape cancels even when the selector button has focus');assert.equal(await page.evaluate(()=>calls.length),0);assert.equal(network.length,0);
   await child.evaluate(()=>{const nested=document.createElement('div');nested.className='voice-workspace';document.querySelector('#review').append(nested);document.querySelector('#review').showModal()});
   assert.equal(await child.locator('#review [data-chinche-ui="select"]').count(),1,'Nested workspace shares the surface selector');
   await pointTo(child,'#private-card');await page.locator('.chn-txt').waitFor();
   assert.equal(await child.evaluate(()=>effects),0);assert.equal(await child.evaluate(()=>cardEffects),0,'Card actions suppress application document capture');assert.equal(network.length,0);
   let pin=await page.evaluate(()=>pins.at(-1));assert.equal(pin.version,2);assert.equal(pin.target.ui.surface,'tasks');assert.equal(pin.target.ui.item,0);
   assert.equal(await child.evaluate(path=>document.querySelector(path)===document.querySelector('#private-card'),pin.target.ui.path),true);
   assert.equal(await page.evaluate(()=>YodDespachoChinches.validPin(pins.at(-1))),true);
   await cancelComposer(page);
   // Exact control, pointer/touch and key activation are all intercepted before application capture.
   for(const target of ['#approve','#disabled','#private-link']){
    if(target==='#approve')await page.evaluate(()=>YODChinche.senalar());else await child.evaluate(()=>YODChinche.senalar());
    if(mobile&&target!=='#disabled')await child.locator(target).tap();
    else if(target==='#disabled'){const box=await child.locator(target).boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);}
    else await child.locator(target).click();
    await page.locator('.chn-txt').waitFor();pin=await page.evaluate(()=>pins.at(-1));
    assert.equal(await child.evaluate(({path,target})=>document.querySelector(path)===document.querySelector(target),{path:pin.target.ui.path,target}),true);
    assert.equal(await child.evaluate(()=>effects),0);assert.equal(network.length,0);
    assert.equal(await child.locator('.chinche-ui-hint').isVisible(),false);assert.equal(await page.locator('.chn-pista').count(),0,'Parent delegated selector must also stop');
    await cancelComposer(page);await page.waitForTimeout(710);
   }
   await child.evaluate(()=>{YODChinche.senalar();document.querySelector('#approve').focus()});await page.keyboard.press('Enter');await page.locator('.chn-txt').waitFor();assert.equal(await child.evaluate(()=>effects),0);await cancelComposer(page);
   await child.evaluate(()=>YODChinche.senalar());await child.locator('#approve').hover();
   if(process.env.BROWSER_EVIDENCE_DIR){fs.mkdirSync(process.env.BROWSER_EVIDENCE_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.BROWSER_EVIDENCE_DIR,`chinches-selection-${browserName}-${mobile?'touch':'desktop'}.png`),fullPage:true});}
   await page.keyboard.press('Escape');
   await child.evaluate(()=>{const card=document.createElement('article');card.id='dynamic';card.innerHTML='<h2>PRIVATE-DYNAMIC</h2><button>Resolver</button>';document.querySelector('[data-panel="tasks"]').append(card)});
   assert.equal(await child.locator('[data-chinche-ui="card"]').count(),0);await pointTo(child,'#dynamic');await page.locator('.chn-txt').waitFor();assert.equal(await page.evaluate(()=>pins.at(-1).target.ui.item),1);await cancelComposer(page);
   // Independent local surfaces; no application identifiers are copied into references.
   const surfaces=[['knowledge','workspace-dialog','<section class="knowledge-board"><article class="knowledge-card">PRIVATE-KNOWLEDGE</article></section>'],['goals','dossier-overlay','<section class="durable-goals"><article class="durable-goal">PRIVATE-GOAL</article></section>'],['permissions','entorno-hoja','<section class="entorno-permisos" data-permissions-status="ready"><article>PRIVATE-POLICY</article></section>'],['visits','entorno-hoja','<section class="entorno-respaldo"><article>PRIVATE-VISIT</article></section>'],['library','library-dialog','<article class="library-source">PRIVATE-SOURCE</article>'],['chat','dossier-overlay','<article class="case-message">PRIVATE-CHAT</article>'],['activity','dossier-overlay','<div class="term"><div class="term-line">PRIVATE-EVENT</div></div>'],['evidence','workspace-dialog','<details open><summary>PRIVATE-EVIDENCE</summary><pre>PRIVATE-TEXT</pre></details>'],['circle','circulo-hoja','<div class="circulo-tarjeta">PRIVATE-CIRCLE</div>'],['voice','realtime-dialog has-workspace','<article>PRIVATE-VOICE</article>']];
   for(const [surface,cls,html]of surfaces){
    await child.evaluate(({cls,html})=>{document.querySelector('#review').close();document.querySelector('#extra')?.remove();const dialog=document.createElement('dialog');dialog.id='extra';dialog.className=cls;dialog.innerHTML=html;document.body.append(dialog);dialog.showModal()},{cls,html});
    await child.locator('#extra [data-chinche-ui="select"]').waitFor();assert.equal(await child.locator('#extra [data-chinche-ui="select"]').count(),1);await pointTo(child,'#extra article,#extra .term-line,#extra details,#extra .circulo-tarjeta');await page.locator('.chn-txt').waitFor();assert.equal(await page.evaluate(()=>pins.at(-1).target.ui.surface),surface);await cancelComposer(page);
   }
   await child.evaluate(()=>{document.querySelector('#extra').close();document.querySelector('#review').showModal();const panel=document.createElement('section');panel.dataset.panel='ppp';panel.innerHTML='<div class="workspace-board"><iframe title="PPP sintético" src="/nested?token=PRIVATE-IFRAME-TOKEN" style="width:100%;height:190px"></iframe></div>';document.querySelector('.agent-workspace').append(panel)});
   await child.locator('.workspace-board iframe').waitFor();await child.waitForFunction(()=>typeof document.querySelector('.workspace-board iframe').contentWindow.effects==='number');const nested=page.frames().find(f=>f.url().includes('/nested'));assert.ok(nested);await nested.waitForFunction(()=>typeof window.effects==='number');
   for(const target of ['#save','#private-input']){
    await child.evaluate(()=>YODChinche.senalar());await child.locator('.chinche-iframe-shield').waitFor();
    const box=await nested.locator(target).boundingBox();if(mobile)await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);else await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await page.locator('.chn-txt').waitFor();const nestedPin=await page.evaluate(()=>pins.at(-1));assert.equal(nestedPin.target.ui.surface,'ppp');assert.equal(await nested.evaluate(()=>effects),0);
    const boundary=nestedPin.target.ui.path.indexOf(' > html:nth-of-type(1)');assert.ok(boundary>0);
    assert.equal(await child.evaluate(path=>document.querySelector(path)===document.querySelector('.workspace-board iframe'),nestedPin.target.ui.path.slice(0,boundary)),true);
    assert.equal(await nested.evaluate(({path,target})=>document.querySelector(path)===document.querySelector(target),{path:nestedPin.target.ui.path.slice(boundary+3),target}),true);
    assert.equal(await page.evaluate(()=>YodDespachoChinches.validPin(pins.at(-1))),true);await cancelComposer(page);await page.waitForTimeout(710);
   }
   await child.evaluate(()=>YODChinche.senalar());await nested.locator('#save').focus();await page.keyboard.press('Enter');await page.locator('.chn-txt').waitFor();assert.equal(await nested.evaluate(()=>effects),0);await cancelComposer(page);
   await child.evaluate(()=>document.querySelector('.workspace-board iframe').src='https://synthetic-cross.invalid/nested');
   await page.waitForFunction(()=>frame.contentWindow.document.querySelector('.workspace-board iframe').src.startsWith('https://synthetic-cross.invalid/'));
   await child.waitForFunction(()=>{try{return document.querySelector('.workspace-board iframe').contentWindow.document===null}catch{return true}});
   await page.waitForTimeout(710);await child.evaluate(()=>YODChinche.senalar());
   assert.match(await child.locator('.chinche-ui-hint').innerText(),/otro origen/);
   const outerFrame=await child.locator('.workspace-board iframe').boundingBox();await page.mouse.click(outerFrame.x+outerFrame.width/2,outerFrame.y+outerFrame.height/2);await page.locator('.chn-txt').waitFor();
   const outerPin=await page.evaluate(()=>pins.at(-1));assert.equal(outerPin.target.ui.surface,'ppp');assert.equal(outerPin.target.ui.path.includes(' > html:nth-of-type(1)'),false);assert.match(outerPin.target.ui.path,/iframe:nth-of-type\(1\)$/);await cancelComposer(page);
   assert.doesNotMatch(await page.evaluate(()=>JSON.stringify(pins)),/PRIVATE-|private\.invalid/);
   assert.equal(network.length,0);assert.deepEqual(errors,[]);
   if(process.env.BROWSER_EVIDENCE_DIR){fs.mkdirSync(process.env.BROWSER_EVIDENCE_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.BROWSER_EVIDENCE_DIR,`chinches-ui-${browserName}-${mobile?'touch':'desktop'}.png`),fullPage:true});}
   await child.evaluate(()=>{document.querySelector('#extra').close();document.querySelector('#review').showModal()});
   await pointTo(child,'#dynamic');await page.locator('.chn-txt').fill('Solicitud humana sintética');await page.locator('.chn-hoja [data-ok]').click();
   await page.waitForFunction(()=>!document.querySelector('.chn-velo'));await page.waitForTimeout(100);
   assert.equal(network.length,1);assert.equal(network[0].method,'POST');assert.doesNotMatch(network[0].body,/PRIVATE-/);
   await page.evaluate(()=>{authorized=false;epoch++;binding.clear()});await child.waitForFunction(()=>document.querySelector('[data-chinche-ui="select"]').disabled);
   assert.equal(await child.evaluate(()=>YODChinche.senalar()),false);
   await child.evaluate(()=>{const a=document.createElement('article');a.id='late';document.querySelector('[data-panel="tasks"]').append(a)});assert.equal(await child.locator('#late [data-chinche-ui="card"]').count(),0);assert.equal(await child.locator('#review [data-chinche-ui="select"]').isDisabled(),true);
   await context.close();
   console.log('UI '+(mobile?'touch':'desktop')+': auth, exact controls, keyboard, disabled control, dynamic cards, voice + 9 surfaces, nested PPP, privacy, session and Clavar PASS');
  }
  // Load the real office with WebGL deliberately unavailable, never a business endpoint.
  for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile}),page=await context.newPage(),blocked=[];
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():(blocked.push(route.request().url()),route.fulfill({status:403,json:{ok:false}})));
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args)}});
  await page.goto(base+'/parent?office');const office=page.frames().find(f=>f.url().includes('/despacho3d/index.html'));
  await office.waitForFunction(()=>window.officeReady&&window.despacho?.view==='map');await office.locator('#office-accessible').waitFor();
  const layout=await office.evaluate(()=>{
    const button=document.querySelector('body>header [data-chinche-ui="select"]'),r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {width:document.documentElement.scrollWidth,viewport:innerWidth,inView:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,hit:hit===button||button.contains(hit)};
  });
  assert.ok(layout.width<=layout.viewport+1,'Fallback must not overflow horizontally');assert.equal(layout.inView,true,'Global toolbar stays in the mobile viewport');assert.equal(layout.hit,true,'Global toolbar is reachable');
  const initial=await office.evaluate(()=>despacho.getState().selected);
  await office.locator('body>header [data-chinche-ui="select"]').click();
  const go=office.locator('[data-place-card="decisions"] button').first();if(mobile)await go.tap();else await go.click();
  await page.locator('.chn-txt').waitFor();assert.equal(await office.evaluate(()=>despacho.getState().selected),initial,'Selection must not navigate the office');
  await cancelComposer(page);await page.waitForTimeout(710);
  await pointTo(office,'[data-place-card="decisions"]');
  await page.waitForFunction(()=>pins.length>0);const mapPin=await page.evaluate(()=>pins.at(-1));
  assert.deepEqual(mapPin.view,{position:null,quaternion:null,fov:null,mode:'map'});assert.equal(mapPin.target.zone,'decisions');assert.equal(mapPin.target.point,null);
  assert.equal(await page.evaluate(()=>YodDespachoChinches.validPin(pins.at(-1))),true,'Parent accepts a truthful camera-free UI reference');await page.locator('.chn-txt').waitFor();await cancelComposer(page);
  assert.equal(blocked.length,0);await page.locator('.chn-velo').waitFor({state:'detached'});if(process.env.BROWSER_EVIDENCE_DIR){fs.mkdirSync(process.env.BROWSER_EVIDENCE_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.BROWSER_EVIDENCE_DIR,`chinches-fallback-${browserName}-${mobile?'touch':'desktop'}.png`),fullPage:true});}await context.close();console.log('Real office without WebGL '+(mobile?'touch':'desktop')+': accessible map, authorized UI composer, null camera and toolbar bounds PASS');
  }
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1});
module.exports={run};
