'use strict';
// UI/protocol doubles only. No provider, credentials or business data.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),CASE='synthetic-voice-case';
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 res.setHeader('Content-Type','text/html');
 if(pathname==='/__voice-shell'){res.end('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><iframe title="Despacho" src="/__voice-child" style="border:0;width:100%;height:95vh"></iframe><script>addEventListener("message",e=>{if(e.origin!==location.origin||e.data?.type!=="yod:case:request")return;const q=e.data;let result={ok:true};if(q.method==="mintFastSession")result={ok:true,case_id:"synthetic-voice-case",token:"A".repeat(40)+"."+"a".repeat(64),endpoint:"https://synthetic-cloud.onrender.com",expires_at:Date.now()+600000};else if(q.method==="read")result={ok:true,case_id:"synthetic-voice-case",source_revision:"r1",context:{identity:{case_id:"synthetic-voice-case"},documents:[]},state:{},conversation:[],jobs:[],events:[]};e.source.postMessage({type:"yod:case:result",version:1,id:q.id,result},e.origin);});</script></html>');return;}
 if(pathname==='/__voice-child'){res.end('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/despacho3d/live-voice.css"><link rel="stylesheet" href="/despacho3d/agent-workspace.css"><link rel="stylesheet" href="/despacho3d/knowledge-board.css"><body><button id="voice-open">Hablar con Gastón</button><script type="module" src="/despacho3d/live-voice-boot.mjs"></script></body></html>');return;}
 const filename=path.resolve(ROOT,'.'+pathname);
 if(!filename.startsWith(ROOT+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',filename.endsWith('.mjs')?'text/javascript':filename.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(filename));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const out=process.env.BROWSER_EVIDENCE_DIR||path.join(process.env.RUNNER_TEMP||'/tmp','voice-ux-evidence');fs.mkdirSync(out,{recursive:true});
 try{for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage(),errors=[];let sessions=0,retries=0,hello=0,releaseSession=null;
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   if(!location.pathname.includes('__voice-child'))return;
   const selection={ok:true,case_id:'synthetic-voice-case',name:'Proyecto sintético',can_enqueue:true,agent_ready:true,goals:{ready:false}};
   let access='standby';const listeners=new Set();const state=()=>({phase:access,prepared:true,checked_at:Date.now(),selection:access==='unauthorized'?null:selection});
   window.YodResidentAgents={getSelection:()=>access==='standby'?selection:null,subscribe(fn){listeners.add(fn);fn(state());return()=>listeners.delete(fn);},refresh:async()=>window.setAccess('standby')};
   window.setAccess=value=>{access=value;for(const fn of listeners)fn(state());};
   window.blockAudio=true;window.peerPreparations=0;window.failMic=false;window.streams=[];window.micPermission='prompt';
   navigator.permissions.query=async()=>({state:window.micPermission});
   navigator.mediaDevices.getUserMedia=async()=>{
    if(window.failMic)throw new DOMException('denied','NotAllowedError');
    const ctx=new AudioContext(),dest=ctx.createMediaStreamDestination(),tone=ctx.createOscillator(),gain=ctx.createGain();
    tone.frequency.value=420;gain.gain.value=0;tone.connect(gain);gain.connect(dest);tone.start();void ctx.resume();
    window.setInputLevel=value=>{void ctx.resume();gain.gain.value=value;};
    window.streams.push(dest.stream);return dest.stream;
   };
   HTMLMediaElement.prototype.play=function(){return window.blockAudio?Promise.reject(new DOMException('blocked','NotAllowedError')):Promise.resolve();};
   window.RTCPeerConnection=class{
    constructor(){window.peerPreparations++;this.connectionState='connected';this.iceGatheringState='complete';window.voicePeer=this;this.channel={readyState:'open',close(){},send(){throw Error('No extra startup commands');}};}
    addTransceiver(){return {sender:{replaceTrack:async()=>{}}};}addTrack(){}createDataChannel(){return this.channel;}
    async createOffer(){return{type:'offer',sdp:'v=0\r\nsynthetic'};}
    async setLocalDescription(v){this.localDescription=v;}
    async setRemoteDescription(){setTimeout(()=>{this.ontrack({streams:[window.streams.at(-1)]});/* Intentionally omit the primary start event; the server observer is authoritative. */},10);}
    close(){this.connectionState='closed';}
   };
   window.voiceEvent=e=>window.voicePeer.channel.onmessage({data:JSON.stringify(e)});
  });
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin===base)return route.continue();
   if(u.origin!=='https://synthetic-cloud.onrender.com')return route.abort();
   const headers={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'POST,GET'};
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
   let body={ok:true};
   if(u.pathname==='/fast/hello')hello++;
   if(u.pathname==='/voice/session'){sessions++;if(sessions===1)await new Promise(resolve=>{releaseSession=resolve;});body={ok:true,mode:'operativo',session:{id:'opaque/test'},transport:{type:'webrtc',sdp:'v=0\r\nanswer'}};}
   else if(u.pathname==='/voice/status')body={ok:true,active:true,started:true,expires_at:Date.now()+600000,context_phase:'unavailable',tools_ready:false,tasks_ready:false,fragments:1,blocks:1,saved:0,pending:1};
   else if(u.pathname==='/voice/context-retry'){retries++;body={ok:true,retrying:true,context_phase:'retrying'};}
   else if(u.pathname==='/voice/close'){await page.frames().find(f=>f.url().includes('__voice-child')).evaluate(()=>window.voiceEvent({type:'session.closed'}));body={ok:true,active:false,finalized:true,fragments:1,blocks:1,saved:0,pending:1};}
   else if(u.pathname==='/computer/state')body={ok:true,phase:'idle',image:null,activity:[],links:[]};
   else if(u.pathname==='/board/state')body={ok:true,proposals:[]};
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(body)});
  });
  await page.goto(base+'/__voice-shell');const frame=page.frames().find(f=>f.url().includes('__voice-child'));
  await frame.waitForFunction(()=>window.peerPreparations===1);
  await expectHello();
  async function expectHello(){for(let i=0;i<100&&!hello;i++)await page.waitForTimeout(20);assert.equal(hello,1,'entry prepares backend before approach');}
  await frame.evaluate(()=>window.YodVoiceWorkspace.prepareNearby('synthetic-voice-case'));
  assert.equal(await frame.evaluate(()=>window.streams.length),0);
  assert.equal(sessions,0);
  await frame.locator('#voice-open').click();
  await frame.locator('[data-voice-phase="starting"]').waitFor();
  await frame.locator('#compact-interrupt').click();
  assert.equal(await frame.locator('#voice-audio').evaluate(a=>a.muted),true);
  for(let i=0;i<100&&!releaseSession;i++)await page.waitForTimeout(20);
  assert.equal(typeof releaseSession,'function');releaseSession();
  await frame.locator('[data-voice-phase="listening"]').waitFor();
  assert.equal(await frame.locator('#voice-audio').evaluate(a=>a.muted),true,'late audio respects pause requested during connection');
  await frame.locator('#compact-interrupt').click();
  assert.equal(await frame.locator('#voice-audio').evaluate(a=>a.muted),false);
  assert.equal(await frame.locator('#voice-start').isVisible(),false);
  assert.equal(await frame.locator('.realtime-dialog').evaluate(e=>e.matches(':modal')),false);
  assert.equal(await frame.locator('.voice-workspace').isVisible(),false);
  await page.screenshot({path:path.join(out,'voz-compacta-'+viewport.width+'.png'),fullPage:true});
  console.log('COMPACT_VOICE_'+viewport.width+':'+(await page.screenshot({type:'jpeg',quality:80})).toString('base64'));
  await frame.locator('#compact-expand').click();
  assert.equal(await frame.locator('.realtime-dialog').evaluate(e=>e.matches(':modal')),true);
  assert.equal(await frame.locator('[data-tab="ppp"]').getAttribute('aria-pressed'),'true');
  assert.equal(sessions,1,'expanding the board preserves the call');
  await frame.locator('.voice-close').click();
  assert.equal(await frame.locator('.realtime-dialog').evaluate(e=>e.matches(':modal')),false);
  assert.equal(sessions,1,'minimizing does not end the call');
  await frame.locator('#compact-expand').click();
  assert.equal(await frame.evaluate(()=>window.streams.at(-1).getAudioTracks()[0].enabled),true);
  await frame.evaluate(()=>window.setAccess('reconnecting'));
  assert.equal(await frame.locator('.realtime-dialog').isVisible(),true);
  assert.match(await frame.locator('#station-access').innerText(),/Recuperando acceso/);
  assert.equal(await frame.locator('[data-voice-phase="listening"]').count(),1);
  await frame.evaluate(()=>window.setAccess('standby'));
  assert.equal(await frame.locator('#station-access').isVisible(),false);
  assert.equal(sessions,1,'access recovery keeps the same voice session');
  await frame.locator('.voice-options summary').click();
  await frame.locator('#voice-context').filter({hasText:'Expediente pendiente'}).waitFor();
  await frame.locator('#voice-play').waitFor();
  await frame.evaluate(()=>window.blockAudio=false);await frame.locator('#voice-play').click();
  await frame.locator('#voice-play').waitFor({state:'hidden'});assert.equal(sessions,1);
  await frame.evaluate(()=>window.setInputLevel(.18));
  await frame.waitForFunction(()=>document.querySelector('#voice-input').textContent==='Te escucho.');
  assert.equal(await frame.locator('#voice-audio').evaluate(a=>a.muted),true);
  assert.equal(await frame.evaluate(()=>window.streams.at(-1).getAudioTracks()[0].enabled),true);
  assert.equal(sessions,1,'local acoustic overlap neither restarts nor closes the call');
  await frame.evaluate(()=>window.setInputLevel(0));
  await frame.waitForFunction(()=>document.querySelector('#voice-audio').muted===false);
  assert.match(await frame.locator('#voice-timing').innerText(),/Tiempos acumulados/);
  console.log('Local acoustic attenuation and automatic recovery: real Web Audio with synthetic tone, not owner microphone latency.');

  await frame.locator('#voice-interrupt').click();assert.equal(await frame.locator('#voice-audio').evaluate(a=>a.muted),true);assert.equal(sessions,1);
  await frame.locator('#voice-interrupt').click();assert.equal(await frame.locator('#voice-audio').evaluate(a=>a.muted),false);
  await frame.locator('#voice-mute').click();assert.equal(await frame.locator('#voice-phase').innerText(),'Micrófono en pausa');
  await frame.locator('#voice-mute').click();
  await frame.locator('#voice-retry-context').click();assert.equal(retries,1);
  await frame.locator('.station-details>summary').click();
  await frame.locator('.voice-transcript-details summary').click();
  await frame.evaluate(()=>window.voiceEvent({type:'session.output_transcript.delta',event_id:'exact',delta:' Texto  exacto\n',start_ms:100,end_ms:900}));
  assert.equal(await frame.locator('#voice-transcript p').textContent(),' Texto  exacto\n');
  const downloadPromise=page.waitForEvent('download');await frame.locator('#voice-download').click();const download=await downloadPromise;
  assert.equal(fs.readFileSync(await download.path(),'utf8'),'Proyecto sintético [100–900 ms]\n Texto  exacto\n');
  await frame.locator('#voice-stop').click();await frame.locator('[data-voice-phase="idle"]').waitFor();
  assert.match(await frame.locator('#voice-save').innerText(),/Guardado pendiente/);
  await frame.evaluate(()=>window.failMic=true);await frame.locator('#voice-start').click();
  await frame.locator('[data-voice-phase="error"]').waitFor();
  assert.equal(await frame.locator('#voice-transcript p').textContent(),' Texto  exacto\n');assert.equal(sessions,1);
  assert.match(await frame.locator('#voice-status').innerText(),/Permite el micrófono/);
  assert.equal(await frame.locator('#voice-start').innerText(),'Volver a intentar');
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:path.join(out,'voice-ux-'+viewport.width+'.png'),fullPage:true});
  await frame.evaluate(()=>window.setAccess('unauthorized'));
  assert.equal(await frame.locator('.realtime-dialog').isVisible(),true);
  assert.match(await frame.locator('#station-access').innerText(),/dejó de ser válido/);
  assert.equal(await frame.locator('#voice-transcript p').count(),0);
  await frame.locator('#station-reconnect').click();
  await frame.locator('#station-access').waitFor({state:'hidden'});
  assert.equal(await frame.locator('.realtime-dialog').isVisible(),true);
  assert.equal(sessions,1,'explicit access recovery does not start another call');
  await frame.locator('.voice-close').click();
  await frame.evaluate(()=>{window.failMic=false;window.blockAudio=false;window.micPermission='prompt';});
  await frame.evaluate(()=>window.YodVoiceWorkspace.openForCase('synthetic-voice-case','ppp',{startVoice:true,encounter:true}));
  await frame.locator('#compact-notice').filter({hasText:'Pulsa el micrófono para permitir'}).waitFor();
  assert.equal(sessions,1,'proximity does not request permission without a user gesture');
  await frame.locator('#compact-stop').click();
  await frame.evaluate(()=>window.micPermission='granted');
  await frame.evaluate(()=>window.YodVoiceWorkspace.openForCase('synthetic-voice-case','ppp',{startVoice:true,encounter:true}));
  await frame.locator('[data-voice-phase="listening"]').waitFor();
  assert.equal(sessions,2);
  await frame.evaluate(()=>window.YodVoiceWorkspace.openForCase('synthetic-voice-case','ppp',{startVoice:true,encounter:true}));
  assert.equal(sessions,2);
  await frame.evaluate(()=>window.YodVoiceWorkspace.pauseEncounter('synthetic-voice-case'));
  assert.equal(await frame.evaluate(()=>window.streams.at(-1).getAudioTracks()[0].enabled),false);
  await frame.evaluate(()=>window.YodVoiceWorkspace.openForCase('synthetic-voice-case','ppp',{startVoice:true,encounter:true}));
  assert.equal(await frame.evaluate(()=>window.streams.at(-1).getAudioTracks()[0].enabled),true,'returning resumes only the proximity pause');
  assert.equal(sessions,2,'returning keeps the same call');
  await frame.locator('#compact-mic').click();
  await frame.evaluate(()=>window.YodVoiceWorkspace.openForCase('synthetic-voice-case','ppp',{startVoice:true,encounter:true}));
  assert.equal(await frame.evaluate(()=>window.streams.at(-1).getAudioTracks()[0].enabled),false,'manual microphone mute remains respected');
  await frame.locator('#compact-expand').click();
  await frame.locator('#voice-stop').click();await frame.locator('[data-voice-phase="idle"]').waitFor();
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Voice UX: desktop/mobile, blocked audio retry, single session, mute, context retry, exact local copy, pending receipt and transcript retained after microphone denial passed.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
