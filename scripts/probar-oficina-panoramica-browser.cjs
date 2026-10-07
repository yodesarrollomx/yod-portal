'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const filename=path.resolve(ROOT,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!filename.startsWith(ROOT+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);res.end();return;}
 let data=fs.readFileSync(filename);
 if(pathname==='/despacho3d/')data=Buffer.from(data.toString().replace(/<script type="module" src="(?!office-boot)[^"]+"><\/script>/g,''));
 const ext=path.extname(filename);
 res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg'})[ext]||'application/octet-stream');res.end(data);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const out=process.env.BROWSER_EVIDENCE_DIR||'/tmp/yod-panorama';fs.mkdirSync(out,{recursive:true});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   await page.addInitScript(()=>{
    let profile={id:'synthetic-office',case_id:'synthetic-office',entity_kind:'case',name:'Proyecto de prueba',form:'child',color:'#547e75',visual:{hairStyle:'crop'}};
    const listeners=new Set();window.__opened=[];window.__arrivals=[];
    // This geometry fixture strips the UI boots; observe the radial route used by the marker.
    window.YodAgentMenu={showRadial(id){if(id===profile?.case_id)window.__opened.push(id);}};
    window.YodResidentAgents={getProfile:()=>profile,subscribeProfile(fn){listeners.add(fn);fn(profile);return()=>listeners.delete(fn);},openForCase(id){if(id===profile?.case_id)window.__opened.push(id);}};
    window.__revoke=()=>{profile=null;for(const fn of listeners)fn(null);};
    window.addEventListener('yod-agent-arrived',e=>window.__arrivals.push(e.detail.lugar));
   });
   await page.goto(base+'/despacho3d/');
   await page.waitForFunction(()=>window.despacho?.view==='3d'&&window.despacho.getState().frames>1,{},{timeout:60000});
   let state=await page.evaluate(()=>window.despacho.getState());
   assert.equal(state.mode,'overview');assert.equal(state.projection,'orthographic');assert.equal(state.cutaway,true);
   assert.equal(state.avatar.count,1);
   assert.equal(await page.locator('#joystick').isVisible(),false);
   const materialState=()=>page.evaluate(()=>{
    const walls=new Set(),furniture=new Set();
    window.despacho.model.traverse(o=>{if(o.isMesh)for(const m of (Array.isArray(o.material)?o.material:[o.material]))(m.userData.officePartition?walls:furniture).add(m);});
    return {walls:walls.size,clipped:[...walls].filter(m=>m.clippingPlanes?.length===1).length,furnitureClipped:[...furniture].filter(m=>m.clippingPlanes?.length).length};
   });
   const cut=await materialState();assert.ok(cut.walls>0);assert.equal(cut.clipped,cut.walls);assert.equal(cut.furnitureClipped,0);
   await page.locator('#office-agent-marker').waitFor({state:'visible'});
   const marker=await page.locator('#office-agent-marker').boundingBox();assert.ok(marker.width>=44&&marker.height>=44);
   assert.ok(marker.x>=0&&marker.x+marker.width<=(mobile?390:1366));
   await page.screenshot({path:path.join(out,'oficina-panorama-'+(mobile?'movil':'escritorio')+'.png')});
   console.log('OFFICE_SCREENSHOT_'+(mobile?'MOBILE':'DESKTOP')+':'+(await page.screenshot({type:'jpeg',quality:55})).toString('base64'));
   await page.locator('#office-agent-marker').click();assert.deepEqual(await page.evaluate(()=>window.__opened),['synthetic-office']);
   // Select the actual mesh through the same canvas raycaster, without the label.
   const hit=await page.evaluate(async()=>{
    const T=await import('/despacho3d/vendor/three.module.js');
    const a=window.despacho.scene.children.find(o=>o.userData.caseId==='synthetic-office');if(!a)throw Error('missing mesh');
    const b=new T.Box3().setFromObject(a),v=b.getCenter(new T.Vector3());v.y=b.max.y-.08;
    v.project(window.despacho.camera);const r=document.querySelector('#scene canvas').getBoundingClientRect();
    return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};
   });
   await page.mouse.click(hit.x,hit.y);
   assert.equal(await page.evaluate(()=>window.__opened.length),2,'canvas selects visible avatar');
   // Zoom and pan remain available without changing the oblique viewing angle.
   const r=await page.locator('#scene canvas').boundingBox();
   await page.mouse.move(r.x+r.width*.35,r.y+r.height*.55);await page.mouse.wheel(0,-200);
   await page.waitForFunction(()=>window.despacho.getState().zoom>1);
   await page.mouse.move(r.x+r.width*.4,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.4+40,r.y+r.height*.5+20,{steps:5});await page.mouse.up();
   await page.locator('#overview').click();assert.equal((await page.evaluate(()=>window.despacho.getState())).zoom,1);
   await page.locator('#walk').click();
   state=await page.evaluate(()=>window.despacho.getState());assert.equal(state.projection,'perspective');assert.equal(state.cutaway,false);assert.equal((await materialState()).clipped,0);
   assert.equal(await page.locator('#office-agent-marker').isVisible(),false);
   if(mobile)assert.equal(await page.locator('#joystick').isVisible(),true);
   await page.locator('#overview').click();
   const start=await page.evaluate(()=>window.despacho.getAgentState().position);
   assert.equal(await page.evaluate(()=>window.despacho.agenteIr('decisions')),true);
   await page.waitForFunction(()=>window.despacho.getAgentState().motion==='walk');
   await page.waitForFunction(p=>Math.hypot(...window.despacho.getAgentState().position.map((v,i)=>v-p[i]))>.2,start);
   assert.equal(await page.locator('#office-agent-marker').isVisible(),true);
   // Reduced motion completes the accepted route without a long animated wait.
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>window.despacho.getAgentState().place==='decisions');
   assert.deepEqual(await page.evaluate(()=>window.__arrivals),['decisions']);
   await page.evaluate(()=>window.__revoke());
   await page.waitForFunction(()=>window.despacho.getState().avatar.count===0&&document.querySelector('#office-agent-marker').hidden);
   await page.setViewportSize(mobile?{width:844,height:390}:{width:1000,height:700});
   assert.equal((await page.evaluate(()=>window.despacho.getState())).projection,'orthographic');
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({viewport:mobile?'mobile':'desktop',overview:true,cutaway:true,meshSelection:true,marker:true,route:true,revocation:true,errors}));
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
