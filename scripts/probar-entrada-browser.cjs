'use strict';
// Real production HTML/modules, synthetic authorization and board; no business writes.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),ORIGIN='https://yodesarrollomx.github.io';
const parentHTML='<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><iframe title="Despacho" src="/yod-portal/despacho3d/index.html" style="width:100%;height:100vh;border:0"></iframe><script>addEventListener("message",e=>{if(e.origin!==location.origin||e.data?.type!=="yod:case:request")return;const q=e.data;let result={ok:true};if(q.method==="mintFastSession")result={ok:true,case_id:q.payload.case_id,token:"A".repeat(40)+"."+"a".repeat(64),endpoint:"https://synthetic-cloud.onrender.com",expires_at:Date.now()+600000};else if(q.method==="read")result={ok:true,case_id:q.payload.case_id,source_revision:"r1",context:{identity:{case_id:q.payload.case_id,name:"Proyecto sintético"},documents:[["source-ppp","PPP registrado","https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open="+q.payload.case_id,"PPP"]]},state:{updated_at:"2026-10-05T12:00:00Z"},conversation:[],jobs:[],events:[]};e.source.postMessage({type:"yod:case:result",version:1,id:q.id,result},e.origin);});</script></body></html>';
const boardHTML="<!doctype html><html lang=\"es\"><body><h1>PPP sintético</h1><label>Superficie <input id=\"area\" value=\"120\" type=\"number\"></label><output id=\"result\">100</output><script>\nconst CASE=new URL(location.href).searchParams.get('open');let nonce=null,proposal=null;window.applies=0;\nwindow.board={case_id:CASE,scenario_id:'scenario-1',scenario_name:'Base',revision:'r1',confirmed:true,pending:false,observed_at:new Date().toISOString(),fields:[{id:'inTerrenoM2',label:'Superficie',min:1,max:9999,editable:true,nullable:false,kind:'number'}],inputs:{inTerrenoM2:120},results:{noi:100}};\nwindow.publish=()=>{if(nonce)parent.postMessage({type:'yod:ppp:state',version:1,nonce,board:window.board},location.origin);};\narea.oninput=()=>{board.pending=true;board.confirmed=false;publish();};\nwindow.confirmDraft=()=>{board.pending=false;board.confirmed=true;area.value=120;publish();};\nwindow.confirmApply=()=>{board.revision='r2';board.inputs.inTerrenoM2=proposal.cambios[0].valor;board.results.noi=130;board.pending=false;board.confirmed=true;area.value=board.inputs.inTerrenoM2;result.textContent=130;publish();parent.postMessage({type:'yod:ppp:state',version:1,nonce,receipt:{request_id:proposal.request_id,ok:true,revision:'r2'}},location.origin);};\naddEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data.case_id!==CASE||e.data.version!==1)return;const m=e.data;\nif(m.type==='yod:ppp:hello'){nonce=m.nonce;publish();return;}if(m.nonce!==nonce)return;\nif(m.type==='yod:ppp:read')publish();\nif(m.type==='yod:ppp:apply'){window.applies++;proposal=m.proposal;board.pending=true;board.confirmed=false;publish();}\n});</script></body></html>";
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const out=process.env.BROWSER_EVIDENCE_DIR||'/tmp/yod-entry';fs.mkdirSync(out,{recursive:true});
 try{for(const variant of ['desktop','mobile','fallback']){
  const context=await browser.newContext({viewport:variant==='mobile'?{width:390,height:844}:{width:1366,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   if(!location.pathname.endsWith('/despacho3d/index.html'))return;
   let selection=null,observation={phase:'unauthorized',case_id:null,work:null};
   const states=new Set(),profiles=new Set(),works=new Set();
   const state=()=>({phase:selection?'observe':'unauthorized',prepared:true,checked_at:Date.now(),selection});
   window.YodResidentAgents={getSelection:()=>selection,getProfile:()=>selection?.avatar||null,snapshot:state,subscribe(fn){states.add(fn);fn(state());return()=>states.delete(fn);},subscribeProfile(fn){profiles.add(fn);fn(selection?.avatar||null);return()=>profiles.delete(fn);},openForCase(id){return window.YodAgentMenu.showRadial(id);}};
   window.YodWorkObserver={snapshot:()=>observation,subscribe(fn){works.add(fn);fn(observation);return()=>works.delete(fn);},refresh:async()=>{}};
   window.__observe=value=>{observation=value;for(const fn of works)fn(value);};
   window.__select=key=>{
    selection=key?{ok:true,case_id:'synthetic-'+key,name:'Proyecto '+key+' · prueba',can_enqueue:false,agent_ready:true,goals:{ready:false},avatar:{id:'synthetic-'+key,case_id:'synthetic-'+key,entity_kind:'case',name:'Autón '+key+' · prueba',form:'child',color:'#547e75',visual:{hairStyle:'crop'}},ppp:{case_id:'synthetic-'+key,url:'https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=synthetic-'+key}}:null;
    for(const fn of states)fn(state());for(const fn of profiles)fn(selection?.avatar||null);
   };
   window.__captures=0;
   navigator.mediaDevices.getUserMedia=async()=>{window.__captures++;throw Error('Entry must not request a microphone');};
  });
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin===ORIGIN){
    if(u.pathname==='/__entry-shell')return route.fulfill({contentType:'text/html',body:parentHTML});
    if(u.pathname==='/potenciales-yod/patrimonial.html')return route.fulfill({contentType:'text/html',body:boardHTML});
    if(variant==='fallback'&&u.pathname.endsWith('/office.js'))return route.abort();
    const file=path.resolve(ROOT,'.'+u.pathname.replace(/^\/yod-portal/,''));
    if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
    let body=fs.readFileSync(file);
    if(u.pathname.endsWith('/despacho3d/index.html'))body=Buffer.from(body.toString().replace(/<script type="module" src="(?!office-boot|office-entry-boot|live-voice-boot|agent-workspace-boot|circulo-boot)[^"]+"><\/script>/g,''));
    return route.fulfill({contentType:({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream',body});
   }
   if(u.origin==='https://synthetic-cloud.onrender.com'){
    assert.notEqual(u.pathname,'/voice/session','entry must not create a voice session');
    const headers={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'POST,GET'};
    if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
    const payload=JSON.parse(route.request().postData()||'{}');
    return route.fulfill({headers,contentType:'application/json',body:JSON.stringify(u.pathname==='/board/snapshot'?{ok:true,tablero:payload}:{ok:true,proposals:[]})});
   }
   return route.abort();
  });
  await page.goto(ORIGIN+'/__entry-shell');const frame=page.frames().find(f=>f.url().endsWith('/despacho3d/index.html'));
  await frame.waitForFunction(()=>window.despacho&&window.YodVoiceWorkspace&&document.querySelector('#case-open').disabled);
  assert.equal(await frame.locator('[data-entry-status]').innerText(),'Entra a YOD OS para ver tus proyectos.');
  await page.screenshot({path:path.join(out,'entrada-'+variant+'-sin-acceso.png')});
  await frame.evaluate(()=>{window.__select('A');window.__observe({case_id:'synthetic-A',phase:'ready',work:{title:'Revisando fuentes · prueba',phase:'tool',current_tool:'Leyendo documento'}});});
  await frame.locator('#case-open').waitFor({state:'visible'});
  assert.equal(await frame.locator('#case-open').isEnabled(),true);
  const chrome=await frame.evaluate(()=>{
   const header=document.querySelector('body>header').getBoundingClientRect(),entry=document.getElementById('office-entry').getBoundingClientRect(),button=document.getElementById('case-open').getBoundingClientRect();
   return {header:header.height,inside:button.x>=entry.x&&button.right<=entry.right+1&&button.y>=entry.y&&button.bottom<=entry.bottom+1};
  });
  assert.ok(chrome.header<=61,'the office header must stay on one compact row');
  if(variant!=='fallback')assert.equal(chrome.inside,true,'project identity and primary action must share one card');
  assert.equal(await frame.locator('[data-entry-detail]').textContent(),'Revisando fuentes · prueba');
  if(variant!=='fallback'){
   const alignment=await frame.evaluate(()=>{
    const avatar=window.despacho.scene.children.find(o=>o.name==='avatar');
    return {position:avatar.position.toArray(),rotation:avatar.rotation.y};
   });
   assert.deepEqual(alignment.position,[7,0,-6.25]);assert.equal(alignment.rotation,Math.PI);
   await frame.evaluate(async()=>{await window.despacho.visit('case');window.despacho.camera.position.set(9,2.8,-4.4);window.despacho.camera.lookAt(7,1,-7.1);});
   await page.waitForTimeout(300);
   await page.screenshot({path:path.join(out,'puesto-alineado-'+variant+'.png')});
   console.log('STATION_ALIGNMENT_'+variant+':'+(await page.screenshot({type:'jpeg',quality:80})).toString('base64'));
   await frame.evaluate(()=>window.despacho.setMode('overview'));
  }
  if(variant!=='fallback'){
   await frame.evaluate(()=>window.despacho.visit('case'));
   await frame.locator('.station-radial').waitFor();
   assert.equal(await frame.evaluate(()=>window.__captures),0,'proximity does not request audio');
   assert.match(await frame.locator('#agent-menu-title').innerText(),/Autón A/);
   await page.keyboard.press('Escape');await page.waitForTimeout(700);
   assert.equal(await frame.locator('.station-radial').isVisible(),false,'closing near the character must not immediately reopen');
   await frame.evaluate(async()=>{window.despacho.camera.position.set(9.8,1.65,-4.4);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   await frame.evaluate(()=>window.despacho.camera.position.set(8,1.65,-5.6));
   await frame.locator('.station-radial').waitFor();
   await page.keyboard.press('ArrowLeft');
   assert.equal(await frame.locator('.radial-submenu h2').innerText(),'Notas');
   assert.equal(await frame.locator('[data-sector="notas"]').getAttribute('aria-pressed'),'true');
   await page.screenshot({path:path.join(out,'radial-proximidad-'+variant+'.png')});
   console.log('RADIAL_'+variant+':'+(await page.screenshot({type:'jpeg',quality:80})).toString('base64'));
   await frame.locator('.radial-options [data-action="notas"]').click();
   await frame.locator('[data-panel="knowledge"]').waitFor();assert.equal(await frame.locator('[data-tab="knowledge"]').getAttribute('aria-pressed'),'true');
   assert.equal(await frame.evaluate(()=>window.__captures),0);
   await frame.locator('.voice-close').click();await frame.evaluate(()=>window.despacho.setMode('overview'));
  }
  await frame.locator('#case-open').focus();await page.keyboard.press('Enter');
  await frame.locator('.station-radial').waitFor();
  await frame.evaluate(()=>{window.__workspaceReady=window.YodVoiceWorkspace;delete window.YodVoiceWorkspace;});
  await frame.locator('.radial-options [data-action="ppp"]').click();
  assert.equal(await frame.locator('.station-radial').isVisible(),true,'a delayed workspace must not silently dismiss the menu');
  assert.match(await frame.locator('.radial-status').textContent(),/cargando/);
  await frame.evaluate(()=>{window.YodVoiceWorkspace=window.__workspaceReady;delete window.__workspaceReady;});
  await frame.locator('[data-sector="conversaciones"]').hover();
  assert.equal(await frame.locator('.radial-submenu h2').innerText(),'Hablar');
  assert.equal(await frame.locator('[data-action="conversaciones"]').isDisabled(),true,'read-only profiles cannot start audio');
  await page.keyboard.press('ArrowUp');
  await frame.locator('.radial-options [data-action="ppp"]').click();
  await frame.locator('.workspace-board iframe[src*="open=synthetic-A"]').waitFor();
  assert.equal(await frame.locator('[data-tab="ppp"]').getAttribute('aria-pressed'),'true');
  assert.match(await frame.locator('#voice-title').textContent(),/Autón A/);
  const board=await frame.locator('.workspace-board iframe').elementHandle(),boardFrame=await board.contentFrame();
  if(variant==='mobile'){const box=await board.boundingBox();assert.ok(box.y<644,'the PPP must show at least 200px in the first mobile screen');}
  await boardFrame.locator('#area').fill('135');
  await frame.locator('.voice-close').click();
  assert.equal(await frame.evaluate(()=>document.activeElement.id),'case-open');
  await page.screenshot({path:path.join(out,'entrada-'+variant+'-oficina-prueba.png')});
  console.log('ENTRY_OFFICE_'+variant+':'+(await page.screenshot({type:'jpeg',quality:75})).toString('base64'));
  if(variant!=='fallback'){
   await frame.locator('#office-agent-marker').click();await frame.locator('.station-radial').waitFor();await frame.locator('.radial-options [data-action="ppp"]').click();await frame.locator('.realtime-dialog').waitFor();
   assert.equal(await frame.locator('[data-tab="ppp"]').getAttribute('aria-pressed'),'true');
   await frame.locator('.voice-close').click();
  }
  // The physical computer and case route must open the same PPP and preserve drafts.
  await frame.evaluate(()=>window.despacho.openPanel('computer'));
  await frame.locator('.realtime-dialog').waitFor();
  assert.equal(await frame.locator('[data-tab="ppp"]').getAttribute('aria-pressed'),'true');
  assert.equal(await board.evaluate(el=>el.isConnected),true);
  assert.equal(await boardFrame.locator('#area').inputValue(),'135');
  await frame.locator('.voice-close').click();
  await frame.evaluate(()=>window.despacho.openPanel('case'));
  await frame.locator('.station-radial').waitFor();await frame.locator('.radial-options [data-action="ppp"]').click();
  await frame.locator('.realtime-dialog').waitFor();
  assert.equal(await board.evaluate(el=>el.isConnected),true);
  await page.screenshot({path:path.join(out,'entrada-'+variant+'-puesto-prueba.png')});
  console.log('ENTRY_STATION_'+variant+':'+(await page.screenshot({type:'jpeg',quality:75})).toString('base64'));
  await frame.evaluate(()=>window.__select('B'));
  await frame.locator('#station-reconnect').waitFor();
  assert.equal(await frame.locator('.realtime-dialog').isVisible(),true);
  assert.equal(await board.evaluate(el=>el.isConnected),false);
  assert.equal(await frame.locator('[data-entry-detail]').textContent(),'','late work from A cannot appear for B');
  await frame.locator('#station-reconnect').click();await frame.locator('.workspace-board iframe[src*="open=synthetic-B"]').waitFor();
  assert.match(await frame.locator('#voice-title').textContent(),/Autón B/);
  await frame.evaluate(()=>window.__select(null));await frame.locator('#station-reconnect').waitFor();assert.equal(await frame.locator('.realtime-dialog').isVisible(),true);
  assert.equal(await frame.locator('#case-open').isDisabled(),true);
  assert.equal(await frame.locator('.workspace-board iframe').count(),0);
  assert.equal(await frame.locator('[data-entry-detail]').textContent(),'');
  assert.equal(await frame.evaluate(()=>window.__captures),0);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await frame.locator('.voice-close').click();
  await frame.evaluate(()=>{window.__select('B');window.YodAgentMenu.showRadial('synthetic-B');});
  assert.match(await frame.locator('#agent-menu-title').innerText(),/Autón B/);
  await frame.evaluate(()=>window.__select('A'));assert.equal(await frame.locator('.station-radial').isVisible(),false);
  assert.equal(await frame.locator('#agent-menu-title').count(),0,'old project identity removed');
  await frame.evaluate(()=>{window.YodAgentMenu.showRadial('synthetic-A');window.__select(null);});
  assert.equal(await frame.locator('.station-radial').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('Entry '+variant+': access, keyboard, one PPP, draft retained, identity switch, late activity discarded and revocation passed; synthetic authorization.');
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
