'use strict';
// Entirely synthetic transport. Network to business services is blocked.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),evidence=process.env.BROWSER_EVIDENCE_DIR||path.join(require('node:os').tmpdir(),'team-evidence');
fs.mkdirSync(evidence,{recursive:true});
const html='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/despacho3d/equipo.css"><body><div id="team"></div><script type="module">import {mountTeamDesk} from "/despacho3d/equipo.mjs";window.authorized=true;window.epoch=1;window.desk=mountTeamDesk({container:document.querySelector("#team"),transport:{read:()=>fixtureCall("read"),write:x=>fixtureCall("write",x),lookupReceipt:id=>fixtureCall("lookup",id)},isAuthorized:()=>window.authorized,identityEpoch:()=>window.epoch});</script></body></html>';
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(!/^\/despacho3d\/equipo(?:-model|-dictation|-kanban)?\.(?:mjs|css)$/.test(pathname)){res.statusCode=404;res.end();return;}
 res.setHeader('Content-Type',pathname.endsWith('.css')?'text/css':'text/javascript');res.end(fs.readFileSync(path.join(root,pathname)));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const name=process.env.CHINCHE_BROWSER||'chromium',engine=name==='webkit'?webkit:chromium,browser=await engine.launch({headless:true});
 try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const snap={version:1,revision:'r1',read_at:'2026-01-02T12:00:00Z',members:[{id:'director',label:'Dirección',kind:'human'},{id:'chatgpt',label:'ChatGPT',kind:'agent'},{id:'claude',label:'Claude',kind:'agent'}],tasks:[{id:'task-synthetic',title:'Revisar propuesta sintética',status:'Pendiente',owner:'Ambos',next_action:'Detalle sintético extenso. '.repeat(80)}],events:[]};
  let receipt=null,writes=0;
  await page.exposeBinding('fixtureCall',async(_,operation,value)=>{
   if(operation==='read')return structuredClone(snap);
   if(operation==='lookup')return receipt||{status:'not_found',request_id:value};
   if(operation==='write'){writes++;receipt={...value,status:'saved',id:'synthetic-note',revision:'r2',recorded_at:'2026-01-02T12:01:00Z'};snap.revision='r2';snap.events.push({id:'synthetic-event',kind:'request',actor:'Dirección',at:receipt.recorded_at,text:value.text});throw new Error('Synthetic lost response');}
   throw new Error('unexpected fixture call');
  });
  await page.goto(base);await page.getByRole('button',{name:'Equipo',exact:true}).click();
  await page.getByText('Bitácora actualizada.',{exact:true}).waitFor();
  await page.getByText('ChatGPT y Claude · compartido',{exact:true}).waitFor();
  await page.getByRole('tab',{name:'Relevos',exact:true}).click();
  await page.getByRole('heading',{name:'Pendiente · 1',exact:true}).waitFor();
  assert.equal(await page.locator('.team-kanban-columns').count(),1);
  await page.getByLabel('Filtrar relevos por responsable',{exact:true}).selectOption('claude');
  await page.getByRole('heading',{name:'Pendiente · 0',exact:true}).waitFor();
  await page.getByLabel('Filtrar relevos por responsable',{exact:true}).selectOption('Ambos');
  await page.getByRole('heading',{name:'Pendiente · 1',exact:true}).waitFor();
  assert.equal(writes,0);
  assert.equal(await page.evaluate(()=>document.querySelector('.team-desk').scrollWidth<=document.querySelector('.team-desk').clientWidth+1),true);
  await page.screenshot({path:path.join(evidence,'relevos-'+name+'-'+width+'.png'),fullPage:true});
  await page.getByRole('tab',{name:'Hoy',exact:true}).click();
  assert.equal(await page.locator('.team-details').getAttribute('open'),null);
  await page.getByText('Ver encargo y seguimiento completo',{exact:true}).click();
  assert.notEqual(await page.locator('.team-details').getAttribute('open'),null);
  await page.getByText('Ver encargo y seguimiento completo',{exact:true}).click();
  await page.getByLabel('Tu instrucción',{exact:true}).fill('Instrucción sintética conservada\npara el siguiente agente.');
  await page.getByRole('button',{name:'Guardar instrucción',exact:true}).click();
  await page.getByText('Envío sin confirmar.',{exact:false}).waitFor();
  assert.equal(await page.getByLabel('Tu instrucción',{exact:true}).inputValue(),'Instrucción sintética conservada\npara el siguiente agente.');
  await page.getByRole('button',{name:'Comprobar envío',exact:true}).click();
  await page.getByText('Guardado · synthetic-note',{exact:false}).waitFor();assert.equal(writes,1);
  await page.reload();await page.getByRole('button',{name:'Equipo',exact:true}).click();await page.getByText('Bitácora actualizada.',{exact:true}).waitFor();
  await page.getByRole('tab',{name:'← Historia',exact:true}).click();await page.getByText('Instrucción sintética conservada',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>document.querySelector('.team-desk').scrollWidth<=document.querySelector('.team-desk').clientWidth+1),true);
  await page.screenshot({path:path.join(evidence,'equipo-'+name+'-'+width+'.png'),fullPage:true});
  await page.getByRole('tab',{name:'← Historia',exact:true}).focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab',{name:'Hoy',exact:true}).getAttribute('aria-selected'),'true');
  await page.evaluate(()=>{window.authorized=false;window.epoch++;window.desk.revoke();});
  assert.equal(await page.getByRole('button',{name:'Equipo',exact:true}).count(),0);
  assert.deepEqual(errors,[]);await context.close();console.log('Equipo '+name+' '+width+': passed; fixture only');
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
