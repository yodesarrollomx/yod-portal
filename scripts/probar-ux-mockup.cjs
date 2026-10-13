'use strict';
// Isolated static UX fixtures. External requests are blocked; no production session or microphone.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const actualCommit=require('node:child_process').execFileSync('git',['-c','safe.directory='+root,'-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(process.env.EXPECTED_UX_COMMIT)assert.equal(actualCommit,process.env.EXPECTED_UX_COMMIT,'exact reviewed checkout');
const out=process.env.UX_EVIDENCE_DIR||'/tmp/yod-ux-evidence';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b);});});
let browser;
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('yod_os_sidebar_v1','compact'));
 const pages=[],errors=[],blocked=[];
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base))route.continue();else{blocked.push(url);route.abort();}});
 const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+'/os/agent-preview.html',{waitUntil:'networkidle'});await page.locator('[data-card="escenarios"]').waitFor();
 await page.waitForFunction(()=>document.querySelector('.ui-sidebar-toggle')&&document.querySelector('.ui-glyph svg'));
 assert.equal(await page.locator('aside[aria-label="Navegación global"]').count(),1);
 assert.equal(await page.locator('.ui-sidebar-toggle').count(),1);assert.equal(await page.locator('[data-card]').count(),6);
 assert.equal(await page.locator('.ppp-column').isVisible(),true);
 const navNames=await page.locator('#preview-nav a').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('aria-label')||a.textContent.trim()));
 assert.ok(!navNames.some(t=>/^Inicio/.test(t)));assert.equal(new Set(navNames).size,navNames.length);
 async function overflow(label){const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(geometry.scroll<=geometry.width+1,label+' horizontal overflow '+JSON.stringify(geometry));}
 async function composer(label){assert.equal(await page.locator('#message-input').isVisible(),true);const box=await page.locator('#message-input').boundingBox(),size=page.viewportSize();assert.ok(box.y+box.height<=size.height+1,label+' composer clipped '+JSON.stringify(box));}
 async function snapshot(name){await overflow(name);await composer(name);const file=path.join(out,name+'.png');await page.screenshot({path:file,fullPage:false});console.log('MOCKUP_SCREENSHOT:'+name+':'+fs.readFileSync(file).toString('base64'));}
 await snapshot('v2-desktop');
 await page.locator('#message-input').fill('Borrador que debe conservarse');
 await page.locator('[data-card="normativa"] [data-source$=":norm"]').click();
 await page.locator('#source-title').filter({hasText:'Reglas del proyecto'}).waitFor();
 assert.equal(await page.locator('#context-viewer .source-passage mark').count(),1);
 assert.equal(await page.locator('#ppp-title').isVisible(),true);assert.equal(await page.locator('#message-input').inputValue(),'Borrador que debe conservarse');
 await page.locator('#comment-source').click();assert.equal(await page.locator('#message-input').inputValue(),'Borrador que debe conservarse');assert.ok((await page.locator('#draft-reference').innerText()).includes('V2'));
 await snapshot('v2-fuente');
 await page.locator('#close-source').click();
 await page.locator('[data-scenario="v1"]').click();assert.equal(await page.locator('#consulting-version').innerText(),'V1');assert.equal(await page.locator('[data-card="viabilidad"] .viability-version').innerText(),'V1');assert.equal(await page.locator('#defended-version').innerText(),'V2');
 await page.locator('[data-card="mercado"] [data-source$=":rent"]').click();assert.ok((await page.locator('#source-body').innerText()).includes('MXN/mes por unidad'));await page.locator('#source-body [data-source$=":market-study"]').click();assert.equal(await page.locator('#source-body .source-table tbody tr').count(),3);
 await page.locator('#close-source').click();await page.locator('[data-scenario="v3"]').click();assert.ok((await page.locator('[data-card="viabilidad"]').innerText()).includes('No defendible aún'));
 await page.locator('#case-select').selectOption('demo-luis');assert.equal(await page.locator('#message-input').inputValue(),'');assert.equal(await page.locator('#draft-reference').isVisible(),false);assert.ok((await page.locator('#case-kind').innerText()).includes('departamentos'));
 assert.ok((await page.locator('#chat-stream .message').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId))).every(id=>id==='demo-luis'));
 await page.locator('#case-select').selectOption('demo-gaston');assert.equal(await page.locator('#message-input').inputValue(),'Borrador que debe conservarse');assert.equal(await page.locator('#consulting-version').innerText(),'V3');
 await page.locator('#message-input').fill('<script>unsafe</script>');await page.locator('.send-button').click();assert.ok((await page.locator('#chat-stream').innerText()).includes('<script>unsafe</script>'));assert.equal(await page.locator('#chat-stream script').count(),0);
 await page.locator('[data-card="documentos"] [data-source$=":deed"]').evaluate(e=>e.dataset.source='demo-luis:deed');await page.locator('[data-card="documentos"] [data-source$=":deed"]').click();assert.ok((await page.locator('#source-body').innerText()).includes('Fuente no disponible'));assert.equal(await page.locator('#comment-source').isEnabled(),false);await page.locator('[data-prepare-missing]').click();assert.ok((await page.locator('#message-input').inputValue()).includes('expediente actual'));await page.locator('#close-source').click();
 await page.setViewportSize({width:1366,height:768});await snapshot('v2-chromebook');
 await page.locator('.ui-sidebar-toggle').click();await overflow('expanded');await page.locator('.ui-sidebar-toggle').click();
 await page.setViewportSize({width:390,height:844});await page.locator('#mobile-ppp').click();await snapshot('v2-mobile-ppp');
 await page.locator('[data-scenario="v1"]').click();await page.locator('#message-input').fill('Borrador móvil');
 await page.locator('#mobile-chat').click();assert.equal(await page.locator('#message-input').inputValue(),'Borrador móvil');await snapshot('v2-mobile-chat');
 await page.locator('#mobile-ppp').click();await page.locator('[data-card="normativa"] [data-source$=":norm"]').click();assert.equal(await page.locator('#mobile-chat').getAttribute('aria-pressed'),'true');assert.ok((await page.locator('#source-body').innerText()).includes('V1'));await composer('mobile-source');await page.locator('#comment-source').click();await snapshot('v2-mobile-source');
 await page.locator('#mobile-ppp').click();assert.equal(await page.locator('#message-input').inputValue(),'Borrador móvil');assert.equal(await page.locator('[data-card="viabilidad"] .viability-version').innerText(),'V1');
 await page.locator('#mic-button').click();assert.ok((await page.locator('#voice-status').innerText()).includes('no hay audio conectado'));await page.locator('#stop-button').click();assert.ok((await page.locator('#voice-status').innerText()).includes('interrumpida'));
 await page.locator('#menu-toggle').click();await page.locator('.brand').click();assert.equal(await page.locator('#home-view').isVisible(),true);assert.equal(await page.locator('#route-title').innerText(),'Inicio');
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({commit:actualCommit,scope:'UX mockup; fictional data; no business API or microphone',screens:['1440x900','1366x768','390x844'],errors,blocked,checks:['one sidebar','PPP persistent','source passage/interpretation','citation preserves draft','market trace','scenario/viability','defended unchanged','case isolation','unsafe text escaped','missing source action','mobile continuity','composer visible','no overflow','logo home']},null,2));
 console.log('UX_MOCKUP_RESULT:PASS');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();await new Promise(r=>server.close(r));});
