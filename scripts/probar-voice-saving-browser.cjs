'use strict';
// Loopback only: real Web Audio with synthetic oscillators, fake signalling.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;margin:24px;max-width:640px"><h1>Puesto sintético</h1><strong id="state">Disponible para conversar</strong><p id="notice" role="status"></p><button id="talk" style="min-height:44px">Hablar</button><audio id="audio" autoplay></audio><script type="module">
import {createLiveVoice} from '/despacho3d/live-voice.mjs';
import {createVoiceActivityMonitor} from '/despacho3d/voice-activity.mjs';
import {voiceView,createVoiceGoalView} from '/despacho3d/voice-view.mjs';
let peer,ended=false,working=false;const goalView=createVoiceGoalView();
const ctx=new AudioContext(),osc=ctx.createOscillator(),gain=ctx.createGain(),out=ctx.createMediaStreamDestination(),quiet=ctx.createMediaStreamDestination();gain.gain.value=.08;osc.connect(gain).connect(out);osc.start();
window.calls=[];
class Peer{constructor(){peer=this;this.connectionState='connected';this.iceGatheringState='complete';this.channel={readyState:'open',send(){},close(){}};}createDataChannel(){return this.channel;}addTrack(t){window.inputTrack=t;}createOffer(){return Promise.resolve({type:'offer',sdp:'v=0 synthetic'});}async setLocalDescription(d){this.localDescription=d;}async setRemoteDescription(){this.ontrack({streams:[out.stream]});}close(){}}
const status=()=>({ok:true,active:!ended,started:false,finalized:ended,reason:ended?'inactivity':null,mode:'basic',expires_at:Date.now()+600000,fragments:0,blocks:0,saved:0,pending:0});
const render=s=>{const view=voiceView({...s,working_without_voice:working});document.querySelector('#state').textContent=view.title;document.querySelector('#talk').hidden=view.live;document.querySelector('#talk').textContent=s.paused?'Toca para seguir':'Hablar';};
window.voice=createLiveVoice({audio:document.querySelector('#audio'),Peer,media:{getUserMedia:async()=>quiet.stream.clone()},monitorFactory:()=>({close(){}}),activityFactory:o=>(window.monitor=createVoiceActivityMonitor(o)),onChange:render,
 mint:async({case_id})=>({ok:true,case_id,token:'A'.repeat(30)+'.'+'a'.repeat(64),endpoint:'https://synthetic-engine.onrender.com',expires_at:Date.now()+600000}),
 fetchImpl:async(url,options)=>{calls.push(url.split('/').pop());const v=url.endsWith('/ready')?{ok:true,available:true}:url.endsWith('/session')?{ok:true,mode:'basic',session:{id:'synthetic-'+calls.length},transport:{sdp:'v=0 answer'}}:status();return {ok:true,json:async()=>v};}});
document.querySelector('#talk').onclick=async()=>{ended=false;await ctx.resume();await voice.start('synthetic');};
window.started=()=>peer.channel.onmessage({data:JSON.stringify({type:'session.started'})});
window.silence=()=>{gain.gain.value=0;};
window.pause=async()=>{ended=true;await voice.refresh();};
window.goal=()=>{working=goalView.update([{goal_id:'g',status:'running'}]).working;render(voice.snapshot());};
window.result=()=>{const result=goalView.update([{goal_id:'g',status:'ready_for_review'}]);working=result.working;document.querySelector('#notice').textContent=result.notice;render(voice.snapshot());};
await voice.prepare('synthetic');window.ready=true;
</script></body></html>`;
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404).end();return;}res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(f));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const base='http://127.0.0.1:'+server.address().port;
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  await page.goto(base);await page.waitForFunction(()=>window.ready);assert.equal(await page.evaluate(()=>calls.includes('session')),false);
  await page.getByRole('button',{name:'Hablar',exact:true}).click();await page.waitForFunction(()=>window.inputTrack);assert.equal(await page.evaluate(()=>inputTrack.enabled),false);
  await page.evaluate(()=>started());await page.waitForFunction(()=>monitor.snapshot().output_active===true&&voice.snapshot().phase==='listening');assert.equal(await page.evaluate(()=>inputTrack.enabled),true);
  // A real played oscillator is activity; after switching it off the renderer drains.
  await page.waitForFunction(()=>calls.includes('activity'));assert.equal(await page.evaluate(()=>monitor.snapshot().playback_pending),true);
  await page.evaluate(()=>silence());await page.waitForFunction(()=>monitor.snapshot().playback_pending===false,{},{timeout:8000});
  await page.evaluate(()=>pause());await page.getByRole('button',{name:'Toca para seguir'}).waitFor();assert.equal(await page.locator('#state').innerText(),'En pausa (toca para seguir)');assert.equal(await page.evaluate(()=>inputTrack.readyState),'ended');assert.equal(await page.evaluate(()=>calls.filter(x=>x==='session').length),1);
  await page.evaluate(()=>goal());assert.equal(await page.locator('#state').innerText(),'Trabajando sin voz');await page.evaluate(()=>result());await page.getByRole('status').filter({hasText:'resultado disponible'}).waitFor();
  await page.getByRole('button',{name:'Toca para seguir'}).click();await page.waitForFunction(()=>calls.filter(x=>x==='session').length===2);assert.equal(await page.evaluate(()=>inputTrack.enabled),false);
  await page.evaluate(()=>started());await page.waitForFunction(()=>voice.snapshot().phase==='listening');assert.equal(await page.locator('#state').innerText(),'En llamada');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Voice browser: 1280/390px; no preopening, started gate twice, real synthetic audio/tail, reports, pause/device release, goal state/result, explicit resume. No external calls.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
