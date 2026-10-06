'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),CASE='synthetic-case',STAMP='2026-10-05T12:00:00Z';
const HTML='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/despacho3d/agent-workspace.css"><link rel="stylesheet" href="/despacho3d/knowledge-board.css"><body style="margin:12px;font-family:system-ui"><div class="voice-layout"><aside class="voice-sidebar"><h1>Conversación sintética</h1><p id="voice-status">La conversación sigue activa</p><audio id="voice-audio" autoplay></audio></aside><main id="panel" class="voice-workspace"></main></div></body></html>';
const version=(id,title)=>({id,title,kind:'version',status:'confirmed',summary:'Lectura del caso sintético',source_ids:['source-1'],updated_at:STAMP,scenario_id:'scenario-test',source_revision:id,parent_id:null,modality:null});
function fixture(){return {ok:true,schema:1,case_id:CASE,revision:'2',updated_at:STAMP,capabilities:{jev:'available',obsidian:'unavailable',obsidian_export:'available'},facts:[{id:'fact-1',title:'Medida declarada',value:12,unit:'m',status:'declared',source_ids:['source-1'],updated_at:STAMP}],versions:[version('version-1','Primera lectura'),version('version-2','Segunda lectura')],decisions:[],next_steps:[],sources:[{id:'source-1',title:'Fuente sintética <img src=x onerror=alert(1)>',url:'https://example.test/document',consulted_at:STAMP}]};}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(pathname==='/__knowledge-test'){res.setHeader('Content-Type','text/html');res.end(HTML);return;}
 const filename=path.resolve(ROOT,'.'+pathname);
 if(!filename.startsWith(ROOT+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',filename.endsWith('.mjs')||filename.endsWith('.js')?'text/javascript':filename.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(filename));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const output=process.env.BROWSER_EVIDENCE_DIR||path.join(process.env.RUNNER_TEMP||'/tmp','yod-knowledge-browser-evidence');fs.mkdirSync(output,{recursive:true});
 try{
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   const context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage(),errors=[],captures=[];let state=fixture(),exportFail=false,revoked=false,captureAttempts=0;
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>{errors.push('Unexpected dialog');dialog.dismiss();});
   await page.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin===base)return route.continue();
    if(url.origin==='https://yodesarrollomx.github.io'&&url.pathname==='/potenciales-yod/patrimonial.html'&&url.searchParams.get('open')===CASE)return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="es"><p>PPP sintético aislado</p></html>'});
    if(url.origin!=='https://synthetic-cloud.onrender.com')return route.abort('blockedbyclient');
    let payload={};try{payload=JSON.parse(request.postData()||'{}');}catch{}
    let body={ok:true},status=200;
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'POST'}});
    if(revoked){body={ok:false,error:'unauthorized'};status=401;}
    else if(url.pathname==='/fast/knowledge/board')body=state;
    else if(url.pathname==='/fast/knowledge/capture'){
     captures.push(payload);captureAttempts++;
     if(captureAttempts===1){status=503;body={ok:false,error:'storage_unavailable'};}
     else{const item={...version('version-3',payload.title),kind:payload.kind,parent_id:payload.parent_id};state={...state,revision:'3',versions:[...state.versions,item]};body={ok:true,request_id:payload.request_id,revision:'3',version:item,duplicate:true};}
    }else if(url.pathname==='/fast/knowledge/export'){
     if(exportFail){status=503;body={ok:false,error:'storage_unavailable'};}else body={ok:true,revision:state.revision,filename:'expediente-sintetico.md',markdown:'# Expediente sintético\n',files:[{path:'README.md',content:'# Expediente\n[[Versiones/Alternativa]]\n'},{path:'Versiones/Alternativa.md',content:'# Alternativa\n'}]};
    }else if(url.pathname==='/fast/knowledge/compare')body={ok:true,case_id:CASE,revision:state.revision,left_id:payload.left_id,right_id:payload.right_id,source_revisions:['ppp-1','ppp-2'],observed_at:[STAMP,STAMP],changes:[{section:'inputs',field:'area',before:10,after:12,before_present:true,after_present:true,before_unit:'m2',after_unit:'m2',delta:2}],evaluations:[],gaps:[{code:'criteria_required_for_evaluation'}],recommendation:null,scope:'recorded_snapshots',warning:'Lecturas guardadas; no determinan una alternativa ganadora.'};
    else if(url.pathname==='/computer/state')body={ok:true,phase:'idle',image:null,activity:[],links:[]};
    else if(url.pathname==='/board/state')body={ok:true,proposals:[]};
    else{status=404;body={ok:false,error:'unavailable'};}
    return route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Authorization,Content-Type'},body:JSON.stringify(body)});
   });
   await page.goto(base+'/__knowledge-test');
   await page.evaluate(async()=>{
    const {createWorkspace}=await import('/despacho3d/agent-workspace.mjs');
    const selection={ok:true,case_id:'synthetic-case',name:'Expediente sintético',can_enqueue:true,agent_ready:true,goals:{ready:false}};
    window.selection=selection;window.mediaRequests=0;window.sourceReads=0;
    navigator.mediaDevices.getUserMedia=async()=>{window.mediaRequests++;throw Error('Panel must not request a microphone');};
    const audioContext=new AudioContext(),oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),destination=audioContext.createMediaStreamDestination();
    gain.gain.value=.01;oscillator.connect(gain);gain.connect(destination);oscillator.start();await audioContext.resume();
    const audio=document.getElementById('voice-audio');audio.srcObject=destination.stream;await audio.play();window.voiceTrack=destination.stream.getAudioTracks()[0];window.voiceTrackId=window.voiceTrack.id;
    window.workspace=createWorkspace({container:document.getElementById('panel'),getSelection:()=>window.selection,transport:{mintFastSession:async()=>({ok:true,case_id:selection.case_id,token:'A'.repeat(40)+'.'+'a'.repeat(64),endpoint:'https://synthetic-cloud.onrender.com',expires_at:Date.now()+600000}),read:async()=>{window.sourceReads++;if(window.sourceReads===1)throw Error('transient-source-failure');return {ok:true,case_id:selection.case_id,source_revision:'rev-1',context:{identity:{case_id:selection.case_id,name:selection.name},documents:[['source-ppp','PPP registrado','https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit','PPP']]},state:{updated_at:'2026-10-05T12:00:00Z'},conversation:[],jobs:[],events:[]};},dispose(){}}});
    window.workspace.open(selection,'knowledge');
   });
   await page.locator('.knowledge-board[data-state="ready"]').waitFor();
   assert.match(await page.locator('.knowledge-capabilities').innerText(),/Obsidian: sin conexión/);
   assert.match(await page.locator('[data-knowledge-section=facts]').innerText(),/Declarado por el cliente/);
   assert.equal(await page.locator('.knowledge-board img').count(),0);
   await page.getByLabel('Nombre de versión o variante').fill('Alternativa nueva');
   await page.getByLabel('Tipo de registro').selectOption('variant');await page.getByLabel('Versión de origen').selectOption('version-1');
   await page.getByRole('button',{name:'Guardar versión',exact:true}).click();
   await page.locator('.knowledge-board[data-state="unconfirmed"]').waitFor();assert.equal(await page.getByLabel('Nombre de versión o variante').isDisabled(),true);
   await page.getByRole('button',{name:'Comprobar guardado pendiente'}).click();
   await page.locator('[data-knowledge-section=versions] h4').filter({hasText:'Alternativa nueva'}).waitFor();
   assert.equal(captures.length,2);assert.deepEqual(captures[0],captures[1]);assert.deepEqual(Object.keys(captures[0]).sort(),['expected_revision','kind','parent_id','request_id','title']);
   await page.getByRole('button',{name:'Comparar versiones',exact:true}).click();await page.locator('.knowledge-comparison table').waitFor();
   assert.match(await page.locator('.knowledge-comparison').innerText(),/Sin criterios para evaluar preferencia/);
   const downloadWait=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar bóveda',exact:true}).click();const download=await downloadWait;assert.match(download.suggestedFilename(),/\.zip$/);const downloaded=await download.path();assert.equal(fs.readFileSync(downloaded).readUInt32LE(0),0x04034b50);
   exportFail=true;await page.getByRole('button',{name:'Descargar Markdown',exact:true}).click();await page.locator('.knowledge-notice').filter({hasText:'registro no está disponible'}).waitFor();
   await page.evaluate(()=>{window.workspace.setActive(false);window.workspace.open(window.selection,'ppp');});
   await page.locator('.workspace-board iframe').waitFor();assert.equal(await page.evaluate(()=>window.sourceReads),2);
   for(const tab of ['browser','ppp','tasks','knowledge'])await page.locator('[data-tab="'+tab+'"]').click();
   await page.locator('.knowledge-board[data-state="ready"]').waitFor();
   assert.deepEqual(await page.evaluate(()=>({track:window.voiceTrack.readyState,same:window.voiceTrack.id===window.voiceTrackId,paused:document.getElementById('voice-audio').paused,requests:window.mediaRequests})),{track:'live',same:true,paused:false,requests:0});
   assert.equal(await page.locator('#voice-status').innerText(),'La conversación sigue activa');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.screenshot({path:path.join(output,'knowledge-'+viewport.width+'.png'),fullPage:true});
   revoked=true;await page.getByRole('button',{name:'Actualizar',exact:true}).click();
   await page.waitForFunction(()=>!document.querySelector('.knowledge-board').textContent.includes('Medida declarada'));
   assert.equal(await page.locator('.knowledge-card').count(),0);assert.equal(errors.length,0,errors.join('\n'));
   await context.close();
  }
  console.log('Knowledge browser: desktop/mobile, capture receipt recovery, comparison, vault, export failure, revocation and preserved synthetic audio passed.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
