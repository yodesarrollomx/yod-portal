'use strict';
// Ejecución opt-in: node tests/despacho-retro-browser.cjs --run. Ningún endpoint real.
async function run(){
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');if(u.pathname==='/harness'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><iframe title="Oficina" src="/despacho-retro/index.html?office=retro" style="width:100%;height:95vh"></iframe>');}const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-webgl']});
  const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===base)return route.continue();if(u.hostname==='synthetic.onrender.com')return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type'},json:{ok:true,available:true}});if(u.hostname==='yodesarrollomx.github.io'&&u.pathname.includes('/potenciales-yod/'))return route.fulfill({contentType:'text/html',body:'<!doctype html><p>PPP sintético</p>'});return route.abort();});
  await page.addInitScript(()=>{if(parent!==window)return;window.__authorized=true;window.__pins=[];addEventListener('message',e=>{if(e.data?.type==='yod:despacho:pin'){window.__pins.push(e.data);e.source.postMessage({type:'yod:despacho:pin-ack',version:1,requestId:e.data.requestId,status:'composer_opened'},e.origin);}});const id='synthetic-case';const c={ok:true,case_id:id,name:'Caso sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true,goals:{schema:1,ready:true,worker_ready:true},avatar:{id,case_id:id,entity_kind:'case',name:'Caso sintético',display_name:'Autón sintético',form:'child',color:'#547e75'},ppp:{case_id:id,board_case_id:'native-synthetic',scenario_id:'scenario-1',url:'https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=native-synthetic'}};
   addEventListener('message',e=>{const m=e.data;if(m?.type!=='yod:case:request')return;let result={ok:false,error:'unauthorized'};if(window.__authorized){if(m.method==='listAuthorized')result={ok:true,schema:1,cases:[c]};if(m.method==='resolveCurrent')result=c;if(m.method==='mintFastSession')result={ok:true,case_id:id,token:id.padEnd(20,'x')+'.'+'a'.repeat(64),endpoint:'https://synthetic.onrender.com',expires_at:Date.now()+600000};if(m.method==='readGoals')result={ok:true,schema:1,source_revision:'r1',goals:[]};if(m.method==='read')result={ok:true,case_id:id,source_revision:'r1',context:{identity:{case_id:id,name:c.name},memory:[],documents:[]},state:{updated_at:new Date().toISOString()},conversation:[],jobs:[],events:[]};}e.source.postMessage({type:'yod:case:result',version:1,id:m.id,result},e.origin);});
  });
  await page.goto(base+'/harness');const frame=page.frames().find(f=>f.url().includes('office=retro'));await frame.waitForFunction(()=>window.YodResidentAgents?.getAuthorizedProfiles().length===1&&window.YodVoiceWorkspace,{timeout:15000});
  await frame.waitForFunction(()=>document.getElementById('retro-pin-control').disabled);
  if(process.env.RETRO_SCREENSHOT)await page.screenshot({path:process.env.RETRO_SCREENSHOT,fullPage:true});
  await page.evaluate(()=>document.querySelector('iframe').contentWindow.postMessage({type:'yod:despacho:ready',version:1},location.origin));
  await frame.locator('#retro-pin-control').waitFor({state:'visible'});await frame.locator('button[data-place-card=library]').click();await frame.locator('#retro-pin-control').click();
  await frame.locator('button[data-place-card=library]').click();await frame.locator('#open-place').click();await frame.locator('#selection-title').click();assert.equal(await page.evaluate(()=>window.__pins.length),0);assert.equal(await frame.locator('.realtime-dialog').isVisible(),false,'no acción subyacente en biblioteca');
  await frame.locator('[data-place-card=entry]').click();await page.waitForFunction(()=>window.__pins.length===1);
  const pin=await page.evaluate(()=>window.__pins[0]);assert.equal(pin.type,'yod:despacho:pin');assert.equal(pin.version,2);assert.equal(pin.target.zone,'entry');assert.equal(pin.view.mode,'map');assert.equal(pin.view.position,null);assert.equal(pin.view.quaternion,null);assert.equal(pin.view.fov,null);await frame.locator('#pin-selection').getByText('Chinche abierta en tu tablero.',{exact:false}).waitFor();
  // El selector canónico protege 700 ms contra clickthrough tras el ACK.
  await frame.waitForTimeout(800);await frame.locator('button[data-place-card=library]').click();assert.equal(await frame.locator('#selection-title').innerText(),'Biblioteca del proyecto');
  await frame.locator('#open-place').click();await frame.locator('.realtime-dialog').waitFor({state:'visible'});await frame.locator('.voice-close').click();await frame.locator('.realtime-dialog').waitFor({state:'hidden',timeout:5000});
  assert.equal(await frame.evaluate(()=>window.despacho.openPanel('computer')),true);await frame.locator('.realtime-dialog').waitFor({state:'visible'});await frame.locator('.voice-close').click();await frame.locator('.realtime-dialog').waitFor({state:'hidden',timeout:5000});
  await frame.evaluate(()=>window.despacho.openPanel('projects'));const pos=await frame.evaluate(()=>window.despacho.getState().position);await frame.locator('#panel-close').press('ArrowLeft');assert.deepEqual(await frame.evaluate(()=>window.despacho.getState().position),pos);await frame.locator('#panel-close').click();
  assert.equal(await frame.evaluate(()=>window.YodResidentAgents.selectCase('synthetic-case')),true);
  assert.equal(await frame.evaluate(()=>window.despacho.openPanel('computer')),true);
  await frame.locator('.realtime-dialog').waitFor({state:'visible'});const p2=await frame.evaluate(()=>window.despacho.getState().position);await frame.locator('#station-message').press('ArrowLeft');assert.deepEqual(await frame.evaluate(()=>window.despacho.getState().position),p2);
  await frame.locator('.voice-close').click();await frame.locator('.realtime-dialog').waitFor({state:'hidden',timeout:5000});assert.equal(await frame.evaluate(()=>window.despacho.openPanel('computer')),true);await frame.locator('.realtime-dialog').waitFor({state:'visible'});
  for(const tab of ['activity','meeting','avatar','ppp']){const result=await frame.evaluate(tab=>window.YodVoiceWorkspace.openForCase('synthetic-case',tab),tab);assert.equal(result,true,tab);}
  assert.ok(await frame.locator('.workspace-board').count(),'workspace DOM real');
  assert.equal(await frame.evaluate(()=>window.YodVoiceWorkspace.openForCase('synthetic-case','avatar')),true);
  assert.match(await frame.locator('[data-panel=avatar]').innerText(),/Autón sintético/);
  await frame.locator('.station-chat').evaluate(n=>{n.open=true;});assert.equal(await frame.locator('.station-chat').evaluate(n=>n.open),true);
  await page.evaluate(()=>window.__authorized=false);await frame.evaluate(()=>dispatchEvent(new Event('yod-data-invalidated')));
  await frame.waitForFunction(()=>!window.YodResidentAgents.getSelection(),{timeout:10000});
  assert.equal(await frame.evaluate(()=>window.despacho.openPanel('computer')),false);
  const hasThree=requests.filter(u=>/three(?:\.module|\.core)|avatar-card\.mjs/i.test(u));assert.deepEqual(hasThree,[]);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({case:'synthetic-case',destinations:['ppp','activity','meeting','avatar','chat'],revoked:true,errors,three:hasThree,requests:requests.length}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
module.exports={run};
if(require.main===module&&process.argv.includes('--run'))run().catch(e=>{console.error(e);process.exitCode=1;});
