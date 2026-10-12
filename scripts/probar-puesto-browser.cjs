
'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),snapshots=new Map(),evidence=process.env.BROWSER_EVIDENCE_DIR;
if(evidence)fs.mkdirSync(evidence,{recursive:true});
const harness='<!doctype html><style>body{margin:0}</style><iframe title="Oficina" style="width:100%;height:100dvh;border:0" src="/despacho3d/index.html?puesto-test=1" allow="microphone"></iframe>';
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local');if(u.pathname==='/harness'){res.setHeader('Content-Type','text/html');res.end(harness);return;}
 const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 let data=fs.readFileSync(file);if(u.searchParams.has('puesto-test'))data=Buffer.from(data.toString().replace(/<script type="module" src="[^"]+"><\/script>/g,'').replace('</body>','<script type="module" src="resident-boot.mjs?v=132"></script><script type="module" src="live-voice-boot.mjs?v=132"></script></body>').replace('<div id="loading">','<div id="loading" hidden>'));
 res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[],pppIntercepts=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());if(u.origin===base)return route.continue();
   if(u.hostname==='synthetic.onrender.com'){
    const body=req.postDataJSON()||{},token=(req.headers().authorization||'').slice(7),id=token.split('.')[0].replace(/x+$/,'');let data={ok:true,available:true};
    if(u.pathname==='/board/snapshot'){assert.equal(body.case_id,id);snapshots.set(id,body);data={ok:true,tablero:body};}
    if(u.pathname==='/board/state')data={ok:true,tablero:snapshots.get(id)||null,proposals:[]};
    if(u.pathname==='/voice/ready')data={ok:true,available:true};
    return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'Authorization,Content-Type'},json:data});
   }
   if(u.hostname==='yodesarrollomx.github.io'&&u.pathname.includes('/potenciales-yod/')){
    const id=u.searchParams.get('open'),body='<!doctype html><h1>PPP sintético '+id+'</h1><article>Tarjeta de capacidad</article><script>addEventListener("message",e=>{const m=e.data;if(m.type!=="yod:ppp:hello"&&m.type!=="yod:ppp:read")return;if(m.case_id!=='+JSON.stringify(id)+')return;parent.postMessage({type:"yod:ppp:state",version:1,nonce:m.nonce,board:{case_id:'+JSON.stringify(id)+',scenario_id:"scenario-1",scenario_name:"Base",revision:"r1",confirmed:true,pending:false,observed_at:new Date().toISOString(),fields:[{id:"inArea",label:"Área de prueba",min:0,max:10,editable:true,nullable:false,kind:"number"}],inputs:{inArea:1},results:{}}},e.origin)});</script>';pppIntercepts.push({url:req.url(),body,via:'page'});return route.fulfill({contentType:'text/html',body});
   }
   return route.abort();
  });
  await page.addInitScript(()=>{
   if(window.parent!==window)return;window.__goalMode='delay';window.__goalRevision='g1';window.__heldGoals=[];window.__releaseGoals=()=>{window.__goalMode='ready';for(const reply of window.__heldGoals.splice(0))reply();};
   const cases=['case-a','case-b','case-c'].map((id,i)=>({ok:true,case_id:id,name:'Proyecto sintético '+i,url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true,goals:{schema:1,ready:true,worker_ready:true},avatar:{id,case_id:id,entity_kind:'case',name:'Proyecto sintético '+i,display_name:'Personaje '+i,form:'child',color:'#547e75'},ppp:{case_id:id,board_case_id:'native-'+i,scenario_id:'scenario-1',url:'https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=native-'+i}}));
   const goal=id=>({goal_id:'goal-'+id,case_id:id,title:'Meta '+id,instruction:'Leer fuente registrada',criterion:'Comparativa comprobable',scope:'local_analysis_v1',status:id==='case-a'?'running':'ready_for_review',source_revision:'r1',revision:window.__goalRevision,sequence:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),summary:'Entrega para analizar',tasks:id==='case-a'?[{id:'task-1',title:'Consultar normativa',criterion:'Citar fuente y fecha',status:'pending',summary:'',evidence_ids:[]}]:[],evidence:[]});
   addEventListener('message',e=>{const m=e.data;if(m?.type!=='yod:case:request')return;const c=cases.find(c=>c.case_id===m.payload?.case_id)||cases[0];let result;
    if(m.method==='listAuthorized')result={ok:true,schema:1,cases};
    if(m.method==='resolveCurrent')result=c;
    if(m.method==='mintFastSession')result={ok:true,case_id:c.case_id,token:c.case_id.padEnd(20,'x')+'.'+'a'.repeat(64),endpoint:'https://synthetic.onrender.com',expires_at:Date.now()+600000};
    if(m.method==='readGoals'){if(window.__goalMode==='fail')result={ok:false,error:'unavailable'};else if(window.__goalMode==='delay'){window.__heldGoals.push(()=>e.source.postMessage({type:'yod:case:result',version:1,id:m.id,result:{ok:true,schema:1,source_revision:'r1',goals:[goal(c.case_id)]}},e.origin));return;}else result={ok:true,schema:1,source_revision:'r1',goals:[goal(c.case_id)]};}
    if(m.method==='read')result={ok:true,case_id:c.case_id,source_revision:'r1',context:{identity:{case_id:c.case_id,name:c.name},memory:[],documents:[['ppp','Plan de potencial',c.ppp.url,'Tablero registrado']]},state:{updated_at:new Date().toISOString()},conversation:[],jobs:[],events:[]};
    e.source.postMessage({type:'yod:case:result',version:1,id:m.id,result:result||{ok:false,error:'unavailable'}},e.origin);
   });
  });
  await page.goto(base+'/harness');const office=page.frameLocator('iframe[title="Oficina"]');
  await office.locator('#circulo-open').waitFor({state:'attached'});
  const frame=page.frames().find(f=>f.url().includes('puesto-test'));
  await frame.waitForFunction(()=>window.YodResidentAgents?.getAuthorizedProfiles().length===3&&window.YodVoiceWorkspace);
  for(const [i,id]of ['case-a','case-b','case-c','case-a'].entries()){
   await office.locator('[data-dock-case="'+id+'"]').click();
   await office.locator('.realtime-dialog').waitFor({state:'visible'});
   
   if(i===0){await office.locator('.workspace-brief[data-read-phase=loading]').waitFor();assert.doesNotMatch(await office.locator('.workspace-brief').innerText(),/Definir el siguiente encargo|Sin encargo registrado/);await page.evaluate(()=>window.__releaseGoals());}
   if(i===1){await office.locator('.workspace-brief[data-read-phase=unavailable]').waitFor();assert.doesNotMatch(await office.locator('.workspace-brief').innerText(),/Sin encargo registrado/);await page.evaluate(()=>window.__goalMode='ready');await office.locator('.workspace-brief button').click();}
   await office.locator('.workspace-brief h2').filter({hasText:'Meta '+id}).waitFor();
   const boardBox=await office.locator('.workspace-board iframe').boundingBox();assert.ok(boardBox.height>=400,'PPP occupies the first desktop surface: '+boardBox.height);

   await office.locator('.workspace-ppp-status').filter({hasText:'lectura confirmada'}).waitFor({timeout:15000});
   assert.equal(await office.locator('#voice-start').isEnabled(),true);
   assert.equal(await office.locator('.workspace-board iframe').count(),1);
   assert.equal(await office.locator('.agent-menu').isVisible(),false);
   assert.equal(snapshots.has(id),true);
   if(id==='case-a')assert.match(await office.locator('.workspace-brief').innerText(),/Consultar normativa/);
   else assert.match(await office.locator('.workspace-brief').innerText(),/Revisar la entrega contigo/);
   if(evidence&&i<3)await page.screenshot({path:path.join(evidence,'puesto-sintetico-'+id+'.png')});
   if(i<3){await office.locator('.voice-close').click();if(i===0)await page.evaluate(()=>window.__goalMode='fail');if(i===1){await frame.evaluate(id=>window.YodVoiceWorkspace.openForCase(id,'ppp',{compactOnly:true}),id);await office.locator('.voice-capsule').waitFor({state:'visible'});}}

  }

  // A failed refresh keeps the old record and the iframe; recovery does not reopen it.
  const nativeFrame=await office.locator('.workspace-board iframe').elementHandle();
  await office.locator('.workspace-brief button').click();await office.locator('.workspace-subnav [data-tab=tasks]').click();
  const taskDisclosure=office.locator('.workspace-task-route details').first();await taskDisclosure.locator('summary').click();
  const sourceDisclosure=office.locator('.workspace-goal-instruction').first();await sourceDisclosure.locator('summary').click();
  assert.match(await sourceDisclosure.innerText(),/Leer fuente registrada/);
  assert.match(await taskDisclosure.innerText(),/Citar fuente y fecha/);
  // The contextual source control replaces the duplicated research box. Exercise its actual tray.
  await office.locator('.workspace-route-detail button').filter({hasText:'Consultar fuentes del expediente'}).click();
  await office.locator('.document-tray-detail h3').filter({hasText:'Plan de potencial'}).waitFor();
  // DocumentTray admits Drive/Sheets only; the case-bound web PPP opens through its own registered link.
  assert.equal(await office.locator('.document-tray-detail a').isHidden(),true);
  assert.equal(await office.locator('.document-tray-detail a').getAttribute('href'),null);
  const sourceURL='https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=native-0',sourceLink=office.locator('.workspace-external-board');
  assert.equal(await sourceLink.getAttribute('href'),sourceURL);
  const sourcePopupRoute=async route=>{
   if(route.request().url()!==sourceURL)return route.abort();
   const body='<!doctype html><h1>Fuente PPP sintética registrada</h1>';
   pppIntercepts.push({url:route.request().url(),body,via:'context'});
   return route.fulfill({contentType:'text/html',body});
  };
  // Context routing also catches the popup's first request; no real board or business GET is contacted.
  await page.context().route('https://yodesarrollomx.github.io/**',sourcePopupRoute);
  const boardOptions=office.locator('.workspace-board-options');if(await boardOptions.getAttribute('open')===null)await boardOptions.locator('summary').click();
  const sourceOffset=pppIntercepts.length,sourcePopupWait=page.waitForEvent('popup');await sourceLink.click();const sourcePopup=await sourcePopupWait;
  await sourcePopup.waitForURL(sourceURL);assert.equal(sourcePopup.url(),sourceURL);
  const sourceRequests=pppIntercepts.slice(sourceOffset).filter(r=>r.url===sourceURL);
  assert.equal(sourceRequests.length,1,'one exact canonical source navigation was served by the isolated harness');
  assert.equal(sourceRequests[0].url,sourceURL);assert.match(sourceRequests[0].body,/^<!doctype html>/i);
  assert.ok(['page','context'].includes(sourceRequests[0].via),'the source response came from an installed route, never from business networking');
  console.log('SOURCE_POPUP_INTERCEPTED '+JSON.stringify({url:sourceRequests[0].url,via:sourceRequests[0].via,bytes:Buffer.byteLength(sourceRequests[0].body)}));
  await sourcePopup.close();await page.context().unroute('https://yodesarrollomx.github.io/**',sourcePopupRoute);
  await boardOptions.locator('summary').click();
  assert.match(await office.locator('.document-tray-note').first().innerText(),/Su presencia no confirma que el autón las haya leído/);
  const sourceTray=await office.locator('.document-tray').elementHandle();
  await office.locator('.workspace-primary [data-tab=activity]').click();await office.locator('.workspace-subnav [data-tab=tasks]').click();
  await taskDisclosure.locator('summary').focus();
  await page.evaluate(()=>window.__goalMode='fail');
  await office.locator('.workspace-brief[data-read-phase=unavailable]').waitFor({timeout:16000});
  assert.match(await office.locator('.workspace-brief').innerText(),/Último registro/);
  assert.equal(await taskDisclosure.getAttribute('open')!==null,true);assert.equal(await sourceDisclosure.getAttribute('open')!==null,true);assert.equal(await taskDisclosure.locator('summary').evaluate(n=>n===document.activeElement),true);
  assert.equal(await sourceTray.evaluate(n=>n.isConnected),true);assert.equal(await sourceLink.getAttribute('href'),sourceURL);
  await page.evaluate(()=>window.__goalMode='ready');await office.locator('.workspace-brief button').click();
  await office.locator('.workspace-brief[data-read-phase=ready]').waitFor();await office.locator('.workspace-primary [data-tab=ppp]').click();
  assert.equal(await nativeFrame.evaluate(n=>n.isConnected),true);
  // A stale delivery is refused before any write. This is a read-only transport fixture.
  await frame.evaluate(id=>window.YodResidentAgents.openForCase(id),'case-b');
  await office.locator('.workspace-brief h2').filter({hasText:'Meta case-b'}).waitFor();
  await office.locator('.workspace-brief button').click();await office.locator('.workspace-subnav [data-tab=tasks]').click();
  await page.evaluate(()=>window.__goalRevision='g2');
  await office.locator('.workspace-card button').filter({hasText:'Aceptar la entrega'}).click();
  await office.locator('.workspace-goal-notice').filter({hasText:'La entrega cambió'}).waitFor();
  await office.locator('.workspace-card button').filter({hasText:'Discutir o pedir corrección'}).click();
  assert.equal(await office.locator('.station-chat').getAttribute('open')!==null,true);
  assert.match(await office.locator('#station-message').inputValue(),/revisión g2/);
  assert.match(await office.locator('#station-message-status').innerText(),/Todavía no se envió/);
  await office.locator('.station-chat summary').first().click();
  await office.locator('.workspace-primary [data-tab=ppp]').click();
  // Keyboard and pointer choose directions; the submenu stays inside the wheel.
  await office.locator('#station-menu').click();
  await office.locator('.station-wheel [data-sector=ppp]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await office.locator('.station-wheel [data-sector=conversaciones]').getAttribute('aria-pressed'),'true');
  assert.equal(await office.locator('.station-wheel .radial-submenu').count(),1);
  await page.keyboard.press('Enter');assert.equal(await office.locator('.radial-options [data-action=conversaciones]').evaluate(n=>n===document.activeElement),true);
  await page.keyboard.press('Tab');assert.equal(await office.locator('.radial-options [data-action=chat]').evaluate(n=>n===document.activeElement),true);
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:1024,height:768});
  const chromebookBox=await office.locator('.workspace-board iframe').boundingBox();assert.ok(chromebookBox.height>=400);
  if(evidence)await page.screenshot({path:path.join(evidence,'puesto-sintetico-chromebook.png')});
  console.log('UX132_IMAGE_CHROMEBOOK '+(await page.screenshot({type:'jpeg',quality:62})).toString('base64'));
  await page.setViewportSize({width:390,height:844});
  assert.equal(await office.locator('.workspace-brief h2').isVisible(),true);
  assert.equal(await frame.evaluate(()=>document.querySelector('.voice-workspace').scrollWidth<=document.querySelector('.voice-workspace').clientWidth+1),true);
  const mobileBox=await office.locator('.workspace-board iframe').boundingBox();assert.ok(mobileBox.height>=330,'PPP mobile first surface: '+mobileBox.height);
  if(evidence)await page.screenshot({path:path.join(evidence,'puesto-sintetico-movil.png')});
  console.log('UX132_IMAGE_MOBILE '+(await page.screenshot({type:'jpeg',quality:65})).toString('base64'));
  assert.equal(await office.locator('#station-menu').isVisible(),true);await office.locator('#station-menu').click();
  await office.locator('.station-wheel [data-sector=pendientes]').click();
  for(const box of await office.locator('.radial-options button').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))))assert.ok(box.height>=44&&box.width>=44);
  assert.equal(await office.locator('.station-wheel .radial-submenu').count(),1);
  if(evidence)await page.screenshot({path:path.join(evidence,'rueda-sintetica-movil.png')});
  console.log('UX132_IMAGE_WHEEL '+(await page.screenshot({type:'jpeg',quality:65})).toString('base64'));
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log('UX132: actual modules; loading/error/retained observation/retry; exact delivery conflict prevents write; correction draft only; one native PPP iframe, three isolated cases, four-direction wheel, keyboard, desktop 1366, Chromebook 1024, mobile 390, preserved voice controls. Synthetic transport does not accredit private records or physical microphone.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
