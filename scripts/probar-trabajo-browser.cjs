'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),fixture={"ok":true,"available":true,"case_id":"case-synthetic","work":{"schema":1,"case_id":"case-synthetic","run_id":"run-synthetic","goal_id":"goal-synthetic","source_revision":"r1","title":"Revisar la fuente del proyecto","criterion":"Resultado con procedencia","phase":"tool","started_at":"2026-10-06T10:00:00Z","updated_at":"2026-10-06T10:01:00Z","current_tool":"Leyendo documento","progress":{"sequence":1,"progress":{"tasks":[{"id":"task-1","title":"Leer la fuente","criterion":"Documento verificable","status":"running","summary":"","evidence_ids":[]}],"evidence":[],"summary":""}},"sources":[{"case_id":"case-synthetic","run_id":"run-synthetic","goal_id":"goal-synthetic","task_id":"task-1","id":"source-synthetic","title":"Fuente de prueba","url":"https://example.com/source","kind":"web","consulted_at":"2026-10-06T10:01:00Z"}],"events":[],"result":null},"screen":{"captured_at":null,"revision":0,"owner":null}};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),file=path.resolve(ROOT,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 let body=fs.readFileSync(file);if(u.pathname==='/despacho3d/')body=Buffer.from(body.toString().replace(/<script type="module" src="(?!office-boot)[^"]+"><\/script>/g,''));
 res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(body);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const out=process.env.BROWSER_EVIDENCE_DIR||'/tmp/yod-work';fs.mkdirSync(out,{recursive:true});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async r=>{
   const u=new URL(r.request().url());if(u.origin===base)return r.continue();
   if(u.origin==='https://synthetic-cloud.onrender.com'){
    const headers={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'POST,OPTIONS'};
    if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers});
    const body=await page.evaluate(()=>({ok:true,phase:'idle',url:'https://example.com/source',title:'Fuente sintética',image:window.__image,captured_at:window.__data.screen.captured_at,capture_work:window.__data.screen.owner,links:[],activity:[]}));
    return r.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(body)});
   }
   return r.abort();
  });
  await page.addInitScript(()=>{
   let selection={case_id:'case-synthetic',name:'Proyecto de prueba',can_enqueue:false,agent_ready:true,goals:{ready:false}};
   const profile={id:selection.case_id,case_id:selection.case_id,entity_kind:'case',name:'Autón de prueba',form:'child',color:'#547e75',visual:{hairStyle:'crop'}},listeners=new Set();
   window.YodResidentAgents={getSelection:()=>selection,getProfile:()=>selection?profile:null,subscribeProfile(fn){listeners.add(fn);fn(profile);return()=>listeners.delete(fn);},openForCase(){}};
   window.__revoke=()=>{selection=null;for(const fn of listeners)fn(null);window.YodWorkObserver.select();};
  });
  await page.goto(base+'/despacho3d/');await page.waitForFunction(()=>window.despacho?.view==='3d'&&window.despacho.getState().frames>1,{},{timeout:60000});
  await page.evaluate(async fixture=>{
   const {createWorkObserver}=await import('/despacho3d/work-observer.mjs?v=1'),{createWorkspace}=await import('/despacho3d/agent-workspace.mjs?v=5');
   window.__data=fixture;window.__requests=[];window.__networkFailure=false;
   const imageCanvas=document.createElement('canvas');imageCanvas.width=1120;imageCanvas.height=700;const c=imageCanvas.getContext('2d');c.fillStyle='#e8e5d9';c.fillRect(0,0,1120,700);c.fillStyle='#20343c';c.font='40px Arial';c.fillText('Fuente sintética consultada',60,120);c.font='26px Arial';c.fillText('Resultado vinculado a task-1',60,190);window.__image=imageCanvas.toDataURL('image/jpeg');
   const owner={case_id:fixture.case_id,run_id:fixture.work.run_id,goal_id:fixture.work.goal_id,task_id:'task-1'};
   window.__data.screen={captured_at:'2026-10-06T10:02:00Z',revision:2,owner};
   const observer=createWorkObserver({getSelection:()=>window.YodResidentAgents.getSelection(),schedule:()=>1,cancel:()=>{},request:async path=>{window.__requests.push(path);if(window.__networkFailure)throw Error('unavailable');return path==='/computer/work'?structuredClone(window.__data):{ok:true,capture_work:owner,captured_at:window.__data.screen.captured_at,image:window.__image};}});
   window.YodWorkObserver=observer;window.dispatchEvent(new CustomEvent('yod-work-observer-ready'));observer.select();
   const host=document.createElement('div');host.id='test-workspace';host.hidden=true;host.style.cssText='position:fixed;inset:8px;z-index:3000;background:#f6f4ee;padding:16px;overflow:auto';document.body.append(host);
   const transport={mintFastSession:async({case_id})=>({ok:true,case_id,endpoint:'https://synthetic-cloud.onrender.com',token:'A'.repeat(40)+'.'+'a'.repeat(64),expires_at:Date.now()+600000}),read:async({case_id})=>({ok:true,case_id,source_revision:'r1',context:{identity:{case_id,name:'Proyecto sintético'},documents:[]},state:{updated_at:'2026-10-06T10:00:00Z'},conversation:[],jobs:[],events:[]}),dispose(){}};
   const workspace=createWorkspace({container:host,getSelection:()=>window.YodResidentAgents.getSelection(),transport});
   window.YodVoiceWorkspace={openForCase(id,tab){window.__opened={id,tab};host.hidden=false;workspace.open(window.YodResidentAgents.getSelection(),tab);}};
   window.__workspace=workspace;
  },fixture);
  await page.waitForFunction(()=>window.despacho.getState().computer?.run_id==='run-synthetic'&&window.despacho.getState().computer.capture);
  // Select the physical computer's mesh, through the production canvas raycaster.
  await page.evaluate(()=>window.despacho.visit('case'));
  const point=await page.evaluate(async()=>{
   const T=await import('/despacho3d/vendor/three.module.js'),p=new T.Vector3(7,1.23,-7.221).project(window.despacho.camera),r=document.querySelector('#scene canvas').getBoundingClientRect();
   return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};
  });
  assert.ok(point.x>=0&&point.y>=0&&point.x<=(mobile?390:1366)&&point.y<=(mobile?844:900),'computer is framed on arrival');
  await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>window.__opened?.tab==='browser');
  assert.equal((await page.evaluate(()=>window.__opened)).id,'case-synthetic');
  const panel=page.locator('.workspace-live-work');
  assert.equal(await page.locator('.workspace-manual').evaluate(e=>e.open),false);
  await panel.getByRole('heading',{name:'Leyendo documento'}).waitFor();
  await panel.getByText('Pasos, fuentes y resultado',{exact:true}).click();await panel.getByRole('link',{name:'Fuente de prueba'}).waitFor();
  assert.ok(await panel.getByText('Ahora: Leer la fuente',{exact:true}).isVisible());
  await page.evaluate(async()=>{window.__data.work.phase='prepared';window.__data.work.current_tool=null;window.__data.work.progress.progress.tasks[0].status='ready_for_review';window.__data.work.result={state:'ready_for_review',summary:'La lectura dejó un resultado verificable.'};await window.YodWorkObserver.refresh();});
  await panel.getByRole('heading',{name:'Análisis preparado'}).waitFor();assert.ok(await panel.getByText(/todavía no es una aprobación/).isVisible());
  await page.screenshot({path:path.join(out,'trabajo-'+(mobile?'movil':'escritorio')+'.png')});
  console.log('WORK_SCREENSHOT_'+(mobile?'MOBILE':'DESKTOP')+':'+(await page.screenshot({type:'jpeg',quality:55})).toString('base64'));
  await page.evaluate(async()=>{window.__networkFailure=true;await window.YodWorkObserver.refresh();});await panel.getByRole('heading',{name:'Sin conexión con la actividad'}).waitFor();
  assert.equal(await page.evaluate(()=>window.despacho.getState().computer.capture),false);
  await page.evaluate(()=>window.__revoke());await page.waitForFunction(()=>window.despacho.getState().computer.case_id===null);
  assert.equal(await panel.getByText('La lectura dejó un resultado verificable.',{exact:true}).count(),0);
  assert.ok((await page.evaluate(()=>window.__requests)).every(p=>['/computer/work','/computer/state'].includes(p)));
  assert.deepEqual(errors,[]);console.log('Observable work '+(mobile?'mobile':'desktop')+': physical screen, same workspace, source, prepared result, disconnect and revoke passed.');
  await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
