// Isolated browser evidence; no production requests or client data.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {createServer}=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const meeting={meeting_id:'synthetic-meeting-001',case_id:'CASE-SYNTHETIC',title:'Reunión sintética',occurred_at:null,summary:'Revisar alternativas.',source_sha256:'a'.repeat(64),archive_url:'https://drive.google.com/drive/folders/synthetic',minutes_url:'https://drive.google.com/file/d/synthetic_minutes/view',transcript_url:'https://drive.google.com/file/d/synthetic_text/view',origin:'project'};
const delivery={schema:'yod-meeting-delivery/v1',meeting,proposals:[{id:'pending-1',action:'Revisar alternativa',owner:null,due_date:null,quote:'Podemos revisar la alternativa.',start:65,status:'proposed'}]};
const server=createServer((req,res)=>{
 if(req.url==='/harness'){res.setHeader('Content-Type','text/html');res.end('<main></main>');return;}
 let p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(req.url.split('?')[0].endsWith('/'))p=path.join(p,'index.html');
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',p.endsWith('.mjs')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(b);});
});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const page=await browser.newPage({viewport:{width:390,height:844},permissions:['microphone']});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/reuniones/?mode=initial');assert.equal(await page.locator('#meeting-kind').inputValue(),'initial');assert.equal(await page.locator('#project').isDisabled(),true);
 await page.fill('#meeting-title','Plática inicial sintética');await page.click('#start');await page.waitForFunction(()=>document.body.dataset.recording==='true');await page.waitForTimeout(1200);await page.click('#stop');
 await page.getByRole('button',{name:'Descargar ficha de captura',exact:true}).waitFor();
 const capture=await page.evaluate(async()=>{const {Journal}=await import('/reuniones/journal.mjs');return (await(await new Journal().open()).sessions())[0];});assert.equal(capture.context.case_id,null);assert.equal(capture.context.kind,'initial');assert.match(capture.project,/^initial-/);
 const initial={...delivery,meeting:{...meeting,case_id:null,origin:'initial'}};
 const file=d=>({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});
 await page.getByLabel('Importar ficha de resultados de la reunión').setInputFiles(file(initial));await page.getByText('Revisar alternativa',{exact:true}).waitFor();await page.locator('#proposal-review input[type=checkbox]').check();
 const csvEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar seleccionados para autorizar en MOAC'}).click();assert.match((await csvEvent).suggestedFilename(),/para-moac.csv$/);
 await page.goto(base+'/harness');
 await page.evaluate(async()=>{
  const {mountMeetingArchive}=await import('/despacho3d/meeting-archive.mjs');window.selected='CASE-SYNTHETIC';window.calls=[];window.archived=[];
  window.archive=mountMeetingArchive({container:document.querySelector('main'),getCase:()=>window.selected,request:async(route,data)=>{
   window.calls.push({route,data});if(route.endsWith('/meeting')){if(!window.archived.length)window.archived.push({schema:'yod-meeting-archive/v1',...data.meeting,record_id:'fact-1',recorded_at:'2026-10-12T12:00:00Z'});return {ok:true,case_id:window.selected,meeting_id:data.meeting.meeting_id,status:'archived',storage:'private_server',record_id:'fact-1'};}
   return {ok:true,case_id:window.selected,revision:String(window.archived.length),meetings:window.archived};
  }});window.archive.open(window.selected);
 });
 const input=page.getByLabel('Ficha de reunión entregada por el asistente');
 await input.setInputFiles(file({...delivery,meeting:{...meeting,case_id:'OTHER'}}));await page.getByText('Esta reunión pertenece a otro proyecto.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.calls.filter(x=>x.route.endsWith('/meeting')).length),0);
 await input.setInputFiles(file(initial));await page.getByRole('button',{name:'Vincular y archivar en este proyecto'}).click();await page.getByText('Reunión archivada con el agente del proyecto.',{exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>window.archived[0].case_id),'CASE-SYNTHETIC');await page.getByRole('link',{name:'Minuta ↗'}).waitFor();
 await page.getByRole('button',{name:'Vincular y archivar en este proyecto'}).click();await page.getByText('Reunión archivada con el agente del proyecto.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>window.archived.length),1);
 assert.equal(await page.evaluate(()=>window.calls.some(c=>!/\/fast\/knowledge\/meetings?$/.test(c.route))),false);
 await page.evaluate(()=>{window.selected='OTHER';window.archive.clear();});assert.equal(await page.getByRole('link',{name:'Minuta ↗'}).count(),0);
 await page.goto(base+'/harness');
 await page.evaluate(async()=>{
  const {createWorkspace}=await import('/despacho3d/agent-workspace.mjs');
  window.selection={case_id:'CASE-SYNTHETIC',name:'Proyecto sintético',goals:{ready:false}};
  window.workspace=createWorkspace({container:document.querySelector('main'),getSelection:()=>window.selection,transport:{mintFastSession:async()=>{throw Error('synthetic offline');},read:async()=>{throw Error('synthetic offline');},dispose(){}}});
  window.workspace.open(window.selection,'meeting');
 });
 await page.getByRole('heading',{name:'Historial de reuniones'}).waitFor();
 assert.equal(await page.locator('[data-panel="meeting"]').getByRole('button',{name:'Grabar reunión del proyecto'}).isVisible(),true);
 await page.evaluate(()=>{window.workspace.reset();window.workspace.open(window.selection,'meeting');});
 await page.getByRole('heading',{name:'Historial de reuniones'}).waitFor();
 await page.evaluate(()=>window.workspace.dispose());
 assert.deepEqual(errors,[]);console.log('PASS: initial capture, no PPP, proposal selection/export, foreign case rejection, project archival, retry, case reset; no MOAC writes.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
