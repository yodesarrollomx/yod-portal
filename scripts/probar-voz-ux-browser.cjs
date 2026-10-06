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
  const context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage(),errors=[];let sessions=0,retries=0;
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   if(!location.pathname.includes('__voice-child'))return;
   const selection={ok:true,case_id:'synthetic-voice-case',name:'Proyecto sintético',can_enqueue:true,agent_ready:true,goals:{ready:false}};
   window.YodResidentAgents={getSelection:()=>selection,subscribe:()=>()=>{}};
   window.blockAudio=true;window.failMic=false;window.streams=[];
   navigator.mediaDevices.getUserMedia=async()=>{
    if(window.failMic)throw new DOMException('denied','NotAllowedError');
    const ctx=new AudioContext(),dest=ctx.createMediaStreamDestination();window.streams.push(dest.stream);return dest.stream;
   };
   HTMLMediaElement.prototype.play=function(){return window.blockAudio?Promise.reject(new DOMException('blocked','NotAllowedError')):Promise.resolve();};
   window.RTCPeerConnection=class{
    constructor(){this.connectionState='connected';this.iceGatheringState='complete';window.voicePeer=this;this.channel={readyState:'open',close(){},send(){throw Error('No extra startup commands');}};}
    addTrack(){}createDataChannel(){return this.channel;}
    async createOffer(){return{type:'offer',sdp:'v=0\r\nsynthetic'};}
    async setLocalDescription(v){this.localDescription=v;}
    async setRemoteDescription(){setTimeout(()=>{this.ontrack({streams:[window.streams.at(-1)]});this.channel.onmessage({data:JSON.stringify({type:'session.started'})});},10);}
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
   if(u.pathname==='/voice/session'){sessions++;body={ok:true,mode:'operativo',session:{id:'opaque/test'},transport:{type:'webrtc',sdp:'v=0\r\nanswer'}};}
   else if(u.pathname==='/voice/status')body={ok:true,active:true,expires_at:Date.now()+600000,context_phase:'unavailable',tools_ready:false,tasks_ready:false,fragments:1,blocks:1,saved:0,pending:1};
   else if(u.pathname==='/voice/context-retry'){retries++;body={ok:true,retrying:true,context_phase:'retrying'};}
   else if(u.pathname==='/voice/close'){await page.frames().find(f=>f.url().includes('__voice-child')).evaluate(()=>window.voiceEvent({type:'session.closed'}));body={ok:true,active:false,finalized:true,fragments:1,blocks:1,saved:0,pending:1};}
   else if(u.pathname==='/computer/state')body={ok:true,phase:'idle',image:null,activity:[],links:[]};
   else if(u.pathname==='/board/state')body={ok:true,proposals:[]};
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(body)});
  });
  await page.goto(base+'/__voice-shell');const frame=page.frames().find(f=>f.url().includes('__voice-child'));
  await frame.locator('#voice-open').click();
  await frame.locator('[data-voice-phase="listening"]').waitFor();
  assert.equal(await frame.locator('#voice-start').isVisible(),false);
  await frame.locator('#voice-context').filter({hasText:'Expediente pendiente'}).waitFor();
  await frame.locator('#voice-play').waitFor();
  await frame.evaluate(()=>window.blockAudio=false);await frame.locator('#voice-play').click();
  await frame.locator('#voice-play').waitFor({state:'hidden'});assert.equal(sessions,1);
  await frame.locator('#voice-mute').click();assert.equal(await frame.locator('#voice-phase').innerText(),'Micrófono en pausa');
  await frame.locator('#voice-mute').click();
  await frame.locator('#voice-retry-context').click();assert.equal(retries,1);
  await frame.evaluate(()=>window.voiceEvent({type:'session.output_transcript.delta',event_id:'exact',delta:' Texto  exacto\n',start_ms:100,end_ms:900}));
  assert.equal(await frame.locator('#voice-transcript p').textContent(),' Texto  exacto\n');
  const downloadPromise=page.waitForEvent('download');await frame.locator('#voice-download').click();const download=await downloadPromise;
  assert.equal(fs.readFileSync(await download.path(),'utf8'),'Gastón [100–900 ms]\n Texto  exacto\n');
  await frame.locator('#voice-stop').click();await frame.locator('[data-voice-phase="idle"]').waitFor();
  assert.match(await frame.locator('#voice-save').innerText(),/Guardado pendiente/);
  await frame.evaluate(()=>window.failMic=true);await frame.locator('#voice-start').click();
  await frame.locator('[data-voice-phase="error"]').waitFor();
  assert.equal(await frame.locator('#voice-transcript p').textContent(),' Texto  exacto\n');assert.equal(sessions,1);
  assert.match(await frame.locator('#voice-status').innerText(),/Permite el micrófono/);
  assert.equal(await frame.locator('#voice-start').innerText(),'Volver a intentar');
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:path.join(out,'voice-ux-'+viewport.width+'.png'),fullPage:true});
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Voice UX: desktop/mobile, blocked audio retry, single session, mute, context retry, exact local copy, pending receipt and transcript retained after microphone denial passed.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
