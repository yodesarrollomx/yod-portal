// Run with PLAYWRIGHT_PATH=/.../playwright MEETINGS_PYTHON=/.../python node ...
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {spawn}=require('node:child_process');const http=require('node:http');const fs=require('node:fs');
const path=require('node:path');const os=require('node:os');const crypto=require('node:crypto');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'yod-meetings-test-'));
const token='synthetic-browser-device-token-not-a-secret';
const server=http.createServer((req,res)=>{
 let p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(req.url.split('?')[0].endsWith('/'))p=path.join(p,'index.html');
 fs.readFile(p,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',p.endsWith('.mjs')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(data);});
});
const python=spawn(process.env.MEETINGS_PYTHON||'python3',['-m','uvicorn','api:app','--host','127.0.0.1','--port','8791'],{
 cwd:path.join(root,'reuniones/service'),env:{...process.env,MEETINGS_DATA:path.join(temp,'private'),MEETINGS_ORIGINS:'http://127.0.0.1:8787',MEETINGS_GRANTS:JSON.stringify([{sha256:crypto.createHash('sha256').update(token).digest('hex'),owner:'synthetic-owner',projects:['demo']}])},stdio:'ignore'});
let browser;
(async()=>{
 await new Promise(r=>server.listen(8787,'127.0.0.1',r));
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:8791/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const context=await browser.newContext({permissions:['microphone'],viewport:{width:390,height:844}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8787/reuniones/?case_id=demo');
 await page.click('#start');await page.waitForFunction(()=>document.body.dataset.recording==='true');
 await page.waitForTimeout(5500);await page.click('#pause');await page.waitForTimeout(300);await page.click('#pause');
 await page.waitForTimeout(1200);await page.click('#stop');
 await page.waitForFunction(()=>document.querySelector('#start').disabled===false);
 const read=()=>page.evaluate(async()=>{const {Journal}=await import('./journal.mjs');const j=await new Journal().open();const s=(await j.sessions())[0];return {...s,fragments:(await j.chunks(s.id)).map(c=>({size:c.blob.size,seq:c.seq}))};});
 const stored=await read();assert(stored.fragments.length>=2);assert.equal(stored.state,'stopped');
 await page.reload();assert.equal((await read()).fragments.length,stored.fragments.length);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar audio',exact:true}).click();await (await download).saveAs(path.join(temp,'recording.webm'));
 // No-server flow: prepare a file, invoke the native sheet, never claim Drive success.
 await page.fill('#drive-folder','https://drive.google.com/drive/folders/synthetic-private-folder');await page.click('#save-drive');
 assert.equal(await page.evaluate(()=>localStorage.getItem('yod-meetings-drive')),'https://drive.google.com/drive/folders/synthetic-private-folder');
 await page.click('#copy-request');await page.waitForFunction(()=>document.querySelector('#request-text').value.includes('sin API de pago'));
 await page.evaluate(()=>{navigator.canShare=()=>true;navigator.share=async({files})=>{window.sharedFile={size:files[0].size,name:files[0].name};};});
 await page.getByRole('button',{name:'Preparar envío privado',exact:true}).click();await page.getByRole('button',{name:'Compartir audio…',exact:true}).click();
 assert.equal((await page.evaluate(()=>window.sharedFile)).size,stored.fragments.reduce((n,c)=>n+c.size,0));
 assert.match(await page.locator('#notice').textContent(),/todavía no hay un recibo/);
 await page.locator('summary').click();await page.fill('#server','http://127.0.0.1:8791');await page.fill('#token',token);
 await context.setOffline(true);await page.click('#connect');await page.waitForTimeout(500);assert.equal((await read()).fragments.length,stored.fragments.length);
 await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Audio recibido y verificado'),{},{timeout:15000});
 const response=await fetch('http://127.0.0.1:8791/meetings/'+stored.id,{headers:{Authorization:'Bearer '+token}});const receipt=await response.json();
 assert.equal(receipt.state,'sealed');assert.equal(receipt.chunks.length,stored.fragments.length);
 await page.screenshot({path:path.join(temp,'mobile.png'),fullPage:true});
 // Abrupt page destruction: previous complete fragments survive; reopen marks interruption.
 await page.click('#start');await page.waitForFunction(()=>document.body.dataset.recording==='true');await page.waitForTimeout(5500);await page.reload();await page.waitForTimeout(1500);
 const recovered=await page.evaluate(async()=>{const {Journal}=await import('./journal.mjs');return (await (await new Journal().open()).sessions()).filter(s=>s.interrupted);});
 assert.equal(recovered.length,1);
 assert.deepEqual(errors,[]);
 // Storage failure must stop capture and keep a downloadable emergency buffer.
 await page.evaluate(async()=>{const {Journal}=await import('./journal.mjs');Journal.prototype.append=async()=>{throw Error('synthetic quota exceeded');};});
 await page.click('#start');await page.waitForTimeout(5800);
 assert.match(await page.locator('#notice').textContent(),/emergencia/);assert.equal(await page.locator('#start').isDisabled(),false);
 console.log(JSON.stringify({passed:true,checks:['record_pause_stop','indexeddb_reload','download','offline_retry','verified_seal','crash_recovery','quota_failure','private_share_handoff'],artifacts:temp}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();python.kill();});
