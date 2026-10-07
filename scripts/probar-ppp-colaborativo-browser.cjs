'use strict';
// Entirely synthetic: all requests fulfilled locally; no business writes or provider.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),ORIGIN='https://yodesarrollomx.github.io',CASE='synthetic-collaboration';
const parentHTML='<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><iframe title="Despacho" src="/yod-portal/despacho3d/__collab" style="width:100%;height:100vh;border:0"></iframe><script>window.sourceReads=0;window.sourcesReady=false;addEventListener("message",e=>{if(e.origin!==location.origin||e.data?.type!=="yod:case:request")return;const q=e.data;let result={ok:true};if(q.method==="mintFastSession")result={ok:true,case_id:q.payload.case_id,token:"A".repeat(40)+"."+"a".repeat(64),endpoint:"https://synthetic-cloud.onrender.com",expires_at:Date.now()+600000};else if(q.method==="read"){window.sourceReads++;result={ok:true,case_id:q.payload.case_id,source_revision:"r1",context:{identity:{case_id:q.payload.case_id,name:"Proyecto sintético"},documents:window.sourcesReady?[["source-ppp","PPP registrado","https://yodesarrollomx.github.io/potenciales-yod/patrimonial.html?open="+q.payload.case_id,"PPP"]]:[]},state:{updated_at:"2026-10-05T12:00:00Z"},conversation:[],jobs:[],events:[]};}e.source.postMessage({type:"yod:case:result",version:1,id:q.id,result},e.origin);});</script></body></html>';
const childHTML='<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/yod-portal/despacho3d/live-voice.css"><link rel="stylesheet" href="/yod-portal/despacho3d/agent-workspace.css"><link rel="stylesheet" href="/yod-portal/despacho3d/knowledge-board.css"><link rel="stylesheet" href="/yod-portal/despacho3d/circulo.css"><body><button id="circulo-open">Menú de Gastón</button><button id="voice-open">Hablar con Gastón</button><button id="computer-open">Ver puesto</button><script type="module" src="/yod-portal/despacho3d/agent-workspace-boot.mjs"></script><script type="module" src="/yod-portal/despacho3d/live-voice-boot.mjs"></script><script type="module" src="/yod-portal/despacho3d/circulo-boot.mjs"></script></body></html>';
const boardHTML="<!doctype html><html lang=\"es\"><body><h1>PPP sintético</h1><label>Superficie <input id=\"area\" value=\"120\" type=\"number\"></label><output id=\"result\">100</output><script>\nconst CASE=new URL(location.href).searchParams.get('open');let nonce=null,proposal=null;window.applies=0;window.boardSilent=true;\nwindow.board={case_id:CASE,scenario_id:'scenario-1',scenario_name:'Base',revision:'r1',confirmed:true,pending:false,observed_at:new Date().toISOString(),fields:[{id:'inTerrenoM2',label:'Superficie',min:1,max:9999,editable:true,nullable:false,kind:'number'}],inputs:{inTerrenoM2:120},results:{noi:100}};\nwindow.publish=()=>{if(nonce)parent.postMessage({type:'yod:ppp:state',version:1,nonce,board:window.board},location.origin);};\narea.oninput=()=>{board.pending=true;board.confirmed=false;publish();};\nwindow.confirmDraft=()=>{board.pending=false;board.confirmed=true;area.value=120;publish();};\nwindow.confirmApply=()=>{board.revision='r'+(window.applies+1);board.inputs.inTerrenoM2=proposal.cambios[0].valor;board.results.noi=130;board.pending=false;board.confirmed=true;area.value=board.inputs.inTerrenoM2;result.textContent=130;publish();parent.postMessage({type:'yod:ppp:state',version:1,nonce,receipt:{request_id:proposal.request_id,ok:true,revision:board.revision}},location.origin);};\naddEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data.case_id!==CASE||e.data.version!==1)return;const m=e.data;\nif(m.type==='yod:ppp:hello'){if(window.boardSilent)return;nonce=m.nonce;publish();return;}if(m.nonce!==nonce)return;\nif(m.type==='yod:ppp:read')publish();\nif(m.type==='yod:ppp:apply'){window.applies++;proposal=m.proposal;board.pending=true;board.confirmed=false;publish();}\n});</script></body></html>";
(async()=>{
 const browser=await chromium.launch({headless:true}),out=process.env.BROWSER_EVIDENCE_DIR||'/tmp/ppp-collab-evidence';fs.mkdirSync(out,{recursive:true});
 try{for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];let sessions=0,board=null,proposals=[],resolved=[],resolveAttempts=[],failNextResolve=false;
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   if(!location.pathname.endsWith('/__collab'))return;
   let selection={ok:true,case_id:'synthetic-collaboration',name:'Proyecto sintético',can_enqueue:true,agent_ready:true,avatar:true,goals:{ready:false}};
   window.captures=0;const listeners=new Set();window.switchProject=()=>{selection={...selection,case_id:'synthetic-second',name:'Torre sintética',avatar:{name:'Ruiseñor de prueba'},ppp:{case_id:'synthetic-second',url:'https://yodesarrollomx.github.io/potenciales-yod/vertical.html?open=synthetic-second'}};for(const cb of listeners)cb({prepared:true});};window.YodResidentAgents={getSelection:()=>selection,subscribe:cb=>{listeners.add(cb);cb({prepared:true});return()=>listeners.delete(cb);}};
   const track={enabled:true,stop(){}},stream={getTracks:()=>[track],getAudioTracks:()=>[track]};
   navigator.mediaDevices.getUserMedia=async()=>{window.captures++;return stream;};
   HTMLMediaElement.prototype.play=()=>Promise.resolve();
   window.RTCPeerConnection=class{
    constructor(){this.connectionState='connected';this.iceGatheringState='complete';window.voicePeer=this;this.channel={readyState:'open',close(){},send(){throw Error('No extra startup commands');}};}
    addTrack(){}createDataChannel(){return this.channel;}async createOffer(){return{type:'offer',sdp:'v=0\r\nsynthetic'};}
    async setLocalDescription(v){this.localDescription=v;}async setRemoteDescription(){setTimeout(()=>this.channel.onmessage({data:JSON.stringify({type:'session.started'})}),10);}close(){}
   };
  });
  await page.route('**/*',async route=>{
   const request=route.request(),u=new URL(request.url());
   if(u.origin===ORIGIN){
    let content,type='text/html';
    if(u.pathname==='/__collab-shell')content=parentHTML;
    else if(u.pathname.endsWith('/despacho3d/__collab'))content=childHTML;
    else if(u.pathname==='/potenciales-yod/patrimonial.html')content=boardHTML;
    else if(u.pathname.endsWith('/__old-goals-consumer.mjs')){content="import {goalDisplay,taskDisplay,goalReviewActions} from './goals.mjs'; export const loaded=true;";type='text/javascript';}
    // Simulate an existing browser cache whose module predates the new exports.
    else if(u.pathname.endsWith('/goals.mjs')&&!u.searchParams.has('v')){content=fs.readFileSync(path.join(ROOT,'despacho3d/goals.mjs'),'utf8').replace(/export function (goalDisplay|taskDisplay|goalReviewActions)\(/g,'function $1(');type='text/javascript';}
    else if(u.pathname==='/potenciales-yod/mixto.html')content='<!doctype html><h1>Modelo lector sintético</h1>';
    else{const file=path.resolve(ROOT,'.'+u.pathname.replace(/^\/yod-portal/,''));if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});content=fs.readFileSync(file);type=file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/plain';}
    return route.fulfill({status:200,contentType:type,body:content});
   }
   if(u.origin!=='https://synthetic-cloud.onrender.com')return route.abort();
   const headers={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'POST,GET'};
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   const payload=JSON.parse(request.postData()||'{}');let body={ok:true};
   if(u.pathname==='/voice/session'){sessions++;body={ok:true,mode:'operativo',session:{id:'opaque/collab'},transport:{type:'webrtc',sdp:'v=0\r\nanswer'}};}
   else if(u.pathname==='/voice/status')body={ok:true,active:true,expires_at:Date.now()+600000,context_phase:'ready',context_ready:true,tools_ready:true,tasks_ready:false,fragments:0,blocks:0,saved:0,pending:0};
   else if(u.pathname==='/voice/close'){await page.frames().find(f=>f.url().endsWith('/__collab')).evaluate(()=>window.voicePeer.channel.onmessage({data:JSON.stringify({type:'session.closed'})}));body={ok:true,active:false,finalized:true,fragments:0,blocks:0,saved:0,pending:0};}
   else if(u.pathname==='/board/snapshot'){board=payload;body={ok:true,tablero:board};}
   else if(u.pathname==='/board/state')body={ok:true,tablero:board,proposals};
   else if(u.pathname==='/board/resolve'){resolveAttempts.push(payload);if(failNextResolve){failNextResolve=false;return route.fulfill({status:503,contentType:'application/json',headers,body:JSON.stringify({ok:false,error:'temporary'})});}resolved.push(payload);assert.equal(board.confirmed,true);assert.equal(board.pending,false);assert.equal(board.revision,payload.revision);assert.equal(board.inputs.inTerrenoM2,payload.request_id==='board-voice-2'?644:150);proposals=[];body={ok:true};}
   else if(u.pathname==='/computer/state')body={ok:true,phase:'idle',image:null,activity:[],links:[]};
   else if(u.pathname==='/fast/knowledge/board')body={ok:true,schema:1,case_id:CASE,revision:'1',capabilities:{},facts:[],versions:[],decisions:[],next_steps:[],sources:[]};
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(body)});
  });
  await page.goto(ORIGIN+'/__collab-shell');const frame=page.frames().find(f=>f.url().endsWith('/__collab'));
  const cachedModule=await frame.evaluate(async()=>{try{await import('./__old-goals-consumer.mjs');return {failed:false};}catch(error){return {failed:true,message:error.message};}});
  assert.equal(cachedModule.failed,true,'the unversioned cache fixture must reject the new exports');
  assert.match(cachedModule.message,/does not provide an export|not exported/);
  await frame.locator('#circulo-open').click();await frame.getByRole('button',{name:'Plan de potencial',exact:true}).click();
  await frame.locator('.workspace-ppp-status').filter({hasText:'No se encontró un vínculo único'}).waitFor();
  assert.equal(await frame.locator('.workspace-board iframe').count(),0);
  await page.evaluate(()=>{window.sourcesReady=true;});
  await frame.locator('.workspace-board-options summary').click();
  await frame.getByRole('button',{name:'Actualizar conexión',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.sourceReads),2);
  await frame.locator('.workspace-board-options summary').click();
  await frame.locator('.workspace-board iframe').waitFor();
  await frame.locator('.workspace-ppp-status').filter({hasText:'todavía no recibió una lectura compartida'}).waitFor();
  const waitingFrame=await (await frame.locator('.workspace-board iframe').elementHandle()).contentFrame();
  await waitingFrame.evaluate(()=>{window.boardSilent=false;});
  await frame.locator('.workspace-board-options summary').click();
  await frame.getByRole('button',{name:'Actualizar conexión',exact:true}).click();
  await frame.locator('.workspace-board-options summary').click();
  await frame.locator('.workspace-ppp-summary').filter({hasText:'Lectura confirmada'}).waitFor();
  assert.equal(sessions,0);assert.equal(await frame.evaluate(()=>window.captures),0);
  const iframe=await frame.locator('.workspace-board iframe').elementHandle(),ppp=await iframe.contentFrame();
  await ppp.locator('#area').fill('135');
  await frame.locator('#voice-start').click();await frame.locator('[data-voice-phase="listening"]').waitFor();
  assert.equal(sessions,1);assert.equal(await frame.evaluate(()=>window.captures),1);
  assert.equal(await iframe.evaluate(el=>el.isConnected),true);assert.equal(await ppp.locator('#area').inputValue(),'135');
  await ppp.evaluate(()=>window.confirmDraft());await frame.locator('.workspace-ppp-summary').filter({hasText:'Lectura confirmada'}).waitFor();
  proposals=[{request_id:'board-synthetic-1',case_id:CASE,scenario_id:'scenario-1',revision:'r1',motivo:'Comparar superficie alternativa',cambios:[{campo:'inTerrenoM2',label:'Superficie',antes:120,valor:150}]}];
  await frame.locator('.workspace-board-options summary').click();
  await frame.getByRole('button',{name:'Actualizar conexión',exact:true}).click();
  await frame.getByRole('button',{name:'Aplicar en el tablero',exact:true}).waitFor();
  await frame.getByRole('button',{name:'Aplicar en el tablero',exact:true}).click();
  await frame.getByRole('button',{name:'Aplicando…',exact:true}).waitFor();
  assert.equal(await frame.getByRole('button',{name:'Aplicando…',exact:true}).isDisabled(),true);
  assert.equal(await ppp.evaluate(()=>window.applies),1);
  assert.equal(resolved.length,0);
  failNextResolve=true;
  await ppp.evaluate(()=>window.confirmApply());
  await frame.getByRole('button',{name:'Comprobar confirmación',exact:true}).waitFor();
  assert.equal(await frame.getByRole('button',{name:'Aplicando…',exact:true}).count(),0);
  assert.equal(await ppp.evaluate(()=>window.applies),1);assert.equal(resolved.length,0);
  await frame.getByRole('button',{name:'Comprobar confirmación',exact:true}).click();
  await frame.locator('.workspace-apply-status').filter({hasText:'guardado y confirmado'}).waitFor();
  assert.deepEqual(resolveAttempts[0],resolveAttempts[1]);assert.equal(await ppp.evaluate(()=>window.applies),1,'receipt retry never writes PPP twice');
  assert.equal(resolved.length,1);assert.equal(await ppp.locator('#result').innerText(),'130');
  // Explicit conversation intent dispatches without the user clicking Apply.
  proposals=[{request_id:'board-voice-2',case_id:CASE,scenario_id:'scenario-1',revision:'r2',motivo:'Corrige superficie',apply_requested_at:new Date().toISOString(),apply_expires_at:new Date(Date.now()+120000).toISOString(),cambios:[{campo:'inTerrenoM2',label:'Superficie',antes:150,valor:644}]}];
  await frame.getByRole('button',{name:'Actualizar conexión',exact:true}).click();
  await frame.getByRole('button',{name:'Aplicando…',exact:true}).waitFor();
  assert.equal(await ppp.evaluate(()=>window.applies),2);
  assert.equal(resolved.length,1,'dispatch is not a receipt');
  // Hiding the station must keep the pending write and accept only its trusted receipt.
  await frame.locator('#voice-stop').click();await frame.locator('[data-voice-phase="idle"]').waitFor();
  await frame.locator('.voice-close').click();await frame.locator('.realtime-dialog').waitFor({state:'hidden'});
  assert.equal(await iframe.evaluate(el=>el.isConnected),true);
  await ppp.evaluate(()=>{parent.postMessage({type:'yod:ppp:state',version:1,nonce,receipt:{request_id:'unrelated-receipt',ok:true,revision:'r999'}},location.origin);});
  await ppp.evaluate(()=>window.confirmApply());
  await frame.locator('.workspace-apply-status').filter({hasText:'guardado y confirmado'}).waitFor({state:'attached'});
  assert.equal(resolved.length,2);assert.equal(resolveAttempts.some(r=>r.request_id==='unrelated-receipt'),false);
  assert.equal(await frame.locator('.realtime-dialog').isVisible(),false);
  assert.equal(await ppp.evaluate(()=>window.applies),2,'finalization while hidden never dispatches another write');
  await frame.locator('#circulo-open').click();await frame.getByRole('button',{name:'Plan de potencial',exact:true}).click();
  assert.equal(await iframe.evaluate(el=>el.isConnected),true);
  assert.equal(await ppp.evaluate(()=>window.applies),2,'reopening does not replay the completed write');
  await frame.getByRole('button',{name:'Conservar y comparar variantes'}).click();
  await frame.locator('.realtime-dialog [data-tab="ppp"]').click();
  assert.equal(await iframe.evaluate(el=>el.isConnected),true);assert.equal(await ppp.locator('#area').inputValue(),'644');
  await frame.locator('#station-menu').click();await frame.locator('.station-radial').waitFor();
  assert.equal(await frame.locator('.station-wheel [data-sector]').count(),4);
  await page.screenshot({path:path.join(out,'selector-auton-'+viewport.width+'.png'),fullPage:true});
  await frame.locator('.station-radial [data-sector="ppp"]').click();assert.equal(await iframe.evaluate(el=>el.isConnected),true);
  assert.equal(await iframe.evaluate(el=>el.isConnected),true);
  await frame.locator('.voice-close').click();await frame.locator('#circulo-open').click();await frame.getByRole('button',{name:'Plan de potencial',exact:true}).click();
  assert.equal(await iframe.evaluate(el=>el.isConnected),true);assert.equal(sessions,1);
  if(viewport.width>850){const left=await frame.locator('.voice-sidebar').boundingBox(),right=await frame.locator('.voice-workspace').boundingBox();assert.ok(right.x>=left.x+left.width);}
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:path.join(out,'ppp-compartido-'+viewport.width+'.png'),fullPage:true});
  if(viewport.width>850)console.log('STATION_PREVIEW='+ (await page.screenshot({type:'jpeg',quality:45})).toString('base64'));
  await frame.locator('#voice-start').click();await frame.locator('[data-voice-phase="listening"]').waitFor();
  const reopened=await frame.evaluate(async()=>{window.switchProject();const attempt=window.YodVoiceWorkspace.openForCase('synthetic-second');window.voicePeer.channel.onmessage?.({data:JSON.stringify({type:'session.output_transcript.delta',event_id:'old-case-late',delta:'late fragment from previous project',start_ms:1,end_ms:2})});return attempt;});
  assert.equal(reopened,false,'another project cannot enter an unfinished voice session');
  await frame.locator('.realtime-dialog').waitFor({state:'hidden'});
  await frame.locator('#circulo-open').click();
  await frame.locator('#voice-title').filter({hasText:'Ruiseñor de prueba'}).waitFor();
  await frame.locator('.workspace-board iframe[src*="mixto.html?open=synthetic-second"]').waitFor();
  assert.equal(await iframe.evaluate(el=>el.isConnected),false,'previous project frame is removed');
  await frame.locator('.workspace-ppp-status').filter({hasText:'todavía no comparte su lectura ni admite ajustes'}).waitFor();
  assert.equal(await frame.locator('.workspace-board iframe').getAttribute('src').then(s=>s.includes('agent=1')),false);
  assert.equal(await frame.locator('.workspace-ppp-summary').isVisible(),false);
  assert.equal(await frame.locator('#voice-transcript article').count(),0);
  assert.equal(await frame.locator('#station-message').inputValue(),'');
  assert.equal(sessions,2,'switching projects does not activate another microphone session');
  await page.screenshot({path:path.join(out,'segundo-proyecto-'+viewport.width+'.png'),fullPage:true});
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Shared PPP: stale ESM cache counterproof, circle entry without microphone, same iframe/draft through voice and tabs, explicit apply, receipt-only confirmation while hidden, desktop/mobile and no business writes passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
