'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),out=process.env.BROWSER_EVIDENCE_DIR||'/tmp/yod-meeting';
const server=http.createServer((req,res)=>{
 const file=path.resolve(ROOT,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();
 res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.mjs')?'text/javascript':'text/html');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});fs.mkdirSync(out,{recursive:true});
 try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1366,height:900}});
  await page.goto(base+'/docs/arquitectura/mapa.md'); // establish origin without starting application services
  await page.setContent('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="'+base+'/despacho3d/agent-workspace.css"><body style="margin:0;background:#f3f0e9"><p>PRUEBA AUTOMÁTICA · datos sintéticos</p><main class="agent-workspace"><section data-panel="meeting"></section></main></body></html>');
  await page.evaluate(async base=>{
   const {mountMeeting}=await import(base+'/despacho3d/meeting-view.mjs?v=124');
   const task=(n)=>({id:'task-'+n,title:n===1?'Diagnóstico del proyecto de prueba':'Decisión pendiente',criterion:'Fuente registrada y verificable',status:n===1?'ready_for_review':'blocked',summary:n===1?'El registro contiene la fuente inicial. Falta contrastar las variantes antes de decidir.':'Falta una medida en la fuente; no se ha calculado un resultado.',evidence_ids:n===1?['e1']:[]});
   const goal={goal_id:'goal-synthetic',case_id:'case-synthetic',title:'Avances de prueba',instruction:'Revisar fuente',criterion:'Diagnóstico',scope:'local_analysis_v1',status:'awaiting_data',source_revision:'s1',revision:'r1',sequence:1,created_at:'2026-10-09T00:00:00Z',updated_at:'2026-10-09T00:01:00Z',tasks:[task(1),task(2)],evidence:[{id:'e1',task_id:'task-1',title:'Documento sintético',text:'Evidencia',sha256:'a'.repeat(64),bytes:9}],summary:'Entrega parcial'};
   window.caseId='case-synthetic';window.narrations=[];window.slides=[];
   window.meeting=mountMeeting({container:document.querySelector('[data-panel]'),getCase:()=>window.caseId,onPresent:async s=>{window.narrations.push(s);return true;},onSlide:s=>window.slides.push(s)});
   window.meeting.open(goal,window.caseId,'Autón de prueba');
  },base);
  assert.equal(await page.locator('.meeting-slide h2').textContent(),'Diagnóstico del proyecto de prueba');
  await page.getByRole('button',{name:'Presentar esta lámina',exact:true}).click();
  await page.waitForFunction(()=>window.narrations.length===1);
  assert.equal(await page.evaluate(()=>window.narrations[0].case_id),'case-synthetic');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar presentación'}).click();const d=await download;await d.saveAs(path.join(out,'presentacion-sintetica-'+(mobile?'movil':'escritorio')+'.html'));
  await page.screenshot({path:path.join(out,'reunion-'+(mobile?'movil':'escritorio')+'.png'),fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow');
  await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  assert.match(await page.locator('.meeting-slide').textContent(),/Bloqueado/);
  await page.evaluate(()=>window.caseId='other');
  await page.getByRole('button',{name:'Presentar esta lámina',exact:true}).click();
  assert.equal(await page.locator('.meeting-slide').count(),0);assert.equal(await page.evaluate(()=>window.narrations.length),1);
  await page.close();
 }
 console.log('Reunión: escritorio y móvil, documento, guion, tema bloqueado y retiro por cambio de caso OK. No prueba un micrófono real.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
