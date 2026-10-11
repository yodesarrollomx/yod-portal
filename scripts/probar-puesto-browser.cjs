
'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),snapshots=new Map(),evidence=process.env.BROWSER_EVIDENCE_DIR;
if(evidence)fs.mkdirSync(evidence,{recursive:true});
const harness='<!doctype html><iframe title="Oficina" style="width:100%;height:900px;border:0" src="/despacho3d/index.html?puesto-test=1" allow="microphone"></iframe>';
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local');if(u.pathname==='/harness'){res.setHeader('Content-Type','text/html');res.end(harness);return;}
 const file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 let data=fs.readFileSync(file);if(u.searchParams.has('puesto-test'))data=Buffer.from(data.toString().replace(/<script type="module" src="[^"]+"><\/script>/g,'').replace('</body>','<script type="module" src="resident-boot.mjs?v=131"></script><script type="module" src="live-voice-boot.mjs?v=131"></script></body>').replace('<div id="loading">','<div id="loading" hidden>'));
 res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
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
    const id=u.searchParams.get('open');return route.fulfill({contentType:'text/html',body:'<!doctype html><h1>PPP sintético '+id+'</h1><article>Tarjeta de capacidad</article><script>addEventListener("message",e=>{const m=e.data;if(m.type!=="yod:ppp:hello"&&m.type!=="yod:ppp:read")return;if(m.case_id!=='+JSON.stringify(id)+')return;parent.postMessage({type:"yod:ppp:state",version:1,nonce:m.nonce,board:{case_id:'+JSON.stringify(id)+',scenario_id:"scenario-1",scenario_name:"Base",revision:"r1",confirmed:true,pending:false,observed_at:new Date().toISOString(),fields:[{id:"inArea",label:"Área de prueba",min:0,max:10,editable:true,nullable:false,kind:"number"}],inputs:{inArea:1},results:{}}},e.origin)});</script>'});
   }
   return route.abort();
  });
  await page.addInitScript(()=>{
   if(window.parent!==window)return;
   const cases=['case-a','case-b','case-c'].map((id,i)=>({ok:true,case_id:id,name:'Proyecto sintético '+i,url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit',can_enqueue:true,agent_ready:true,goals:{schema:1,ready:true,worker_ready:true},avatar:{id,case_id:id,entity_kind:'case',name:'Proyecto sintético '+i,display_name:'Personaje '+i,form:'child',color:'#547e75'},ppp:{case_id:id,board_case_id:'native-'+i,scenario_id:'scenario-1',url:'https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open=native-'+i}}));
   const goal=id=>({goal_id:'goal-'+id,case_id:id,title:'Meta '+id,instruction:'Leer fuente registrada',criterion:'Comparativa comprobable',scope:'local_analysis_v1',status:id==='case-a'?'running':'ready_for_review',source_revision:'r1',revision:'g1',sequence:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),summary:'Entrega para analizar',tasks:id==='case-a'?[{id:'task-1',title:'Consultar normativa',criterion:'Citar fuente y fecha',status:'pending',summary:'',evidence_ids:[]}]:[],evidence:[]});
   addEventListener('message',e=>{const m=e.data;if(m?.type!=='yod:case:request')return;const c=cases.find(c=>c.case_id===m.payload?.case_id)||cases[0];let result;
    if(m.method==='listAuthorized')result={ok:true,schema:1,cases};
    if(m.method==='resolveCurrent')result=c;
    if(m.method==='mintFastSession')result={ok:true,case_id:c.case_id,token:c.case_id.padEnd(20,'x')+'.'+'a'.repeat(64),endpoint:'https://synthetic.onrender.com',expires_at:Date.now()+600000};
    if(m.method==='readGoals')result={ok:true,schema:1,source_revision:'r1',goals:[goal(c.case_id)]};
    if(m.method==='read')result={ok:true,case_id:c.case_id,source_revision:'r1',context:{identity:{case_id:c.case_id,name:c.name},memory:[],documents:[['ppp','Plan de potencial',c.ppp.url,'Tablero registrado']]},state:{updated_at:new Date().toISOString()},conversation:[],jobs:[],events:[]};
    e.source.postMessage({type:'yod:case:result',version:1,id:m.id,result:result||{ok:false,error:'unavailable'}},e.origin);
   });
  });
  await page.goto(base+'/harness');const office=page.frameLocator('iframe[title="Oficina"]');
  await office.locator('#circulo-open').waitFor({state:'attached'});
  const frame=page.frames().find(f=>f.url().includes('puesto-test'));
  await frame.waitForFunction(()=>window.YodResidentAgents?.getAuthorizedProfiles().length===3&&window.YodVoiceWorkspace);
  for(const [i,id]of ['case-a','case-b','case-c','case-a'].entries()){
   assert.equal(await frame.evaluate(id=>window.YodResidentAgents.openForCase(id),id),true);
   await office.locator('.realtime-dialog').waitFor({state:'visible'});
   await office.locator('.workspace-brief h2').filter({hasText:'Meta '+id}).waitFor();
   await office.locator('.workspace-ppp-status').filter({hasText:'lectura confirmada'}).waitFor({timeout:15000});
   assert.equal(await office.locator('#voice-start').isEnabled(),true);
   assert.equal(await office.locator('.workspace-board iframe').count(),1);
   assert.equal(await office.locator('.agent-menu').isVisible(),false);
   assert.equal(snapshots.has(id),true);
   if(id==='case-a')assert.match(await office.locator('.workspace-brief').innerText(),/Consultar normativa/);
   else assert.match(await office.locator('.workspace-brief').innerText(),/Revisar la entrega contigo/);
   if(evidence&&i<3)await page.screenshot({path:path.join(evidence,'puesto-sintetico-'+id+'.png')});
   if(i<3){await office.locator('.voice-close').click();if(i===1){await frame.evaluate(id=>window.YodVoiceWorkspace.openForCase(id,'ppp',{compactOnly:true}),id);await office.locator('.voice-capsule').waitFor({state:'visible'});}}

  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await office.locator('.workspace-brief h2').isVisible(),true);
  assert.equal(await frame.evaluate(()=>document.querySelector('.voice-workspace').scrollWidth<=document.querySelector('.voice-workspace').clientWidth+1),true);
  if(evidence)await page.screenshot({path:path.join(evidence,'puesto-sintetico-movil.png')});
  assert.deepEqual(errors,[]);
  console.log('Actual resident and voice boot: four openings across three authorized cases; native PPP identity translated, one iframe, meta and next decision, same voice controls, mobile overflow checked. Synthetic transport; no physical microphone acceptance.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
