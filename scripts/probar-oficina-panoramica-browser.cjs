'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const filename=path.resolve(ROOT,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!filename.startsWith(ROOT+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);res.end();return;}
 let data=fs.readFileSync(filename);
 if(pathname==='/despacho3d/')data=Buffer.from(data.toString().replace(/<script type="module" src="(?!(?:office-boot|circulo-boot))[^"]+"><\/script>/g,''));
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
    window.__prepares=[];window.__voiceStarts=[];window.YodVoiceWorkspace={isOpen:()=>false,prepareNearby:id=>window.__prepares.push(id),releaseNearby:()=>{},openForCase:async(id,tab,options)=>{window.__voiceStarts.push({id,tab,options});return true;}};
    window.addEventListener('yod-agent-menu-open',e=>window.__opened.push(e.detail.case_id));
    window.YodResidentAgents={getSelection:()=>profile?{case_id:profile.case_id,name:profile.name,avatar:profile,can_enqueue:true}:null,subscribe(fn){fn();return()=>{};},getProfile:()=>profile,subscribeProfile(fn){listeners.add(fn);fn(profile);return()=>listeners.delete(fn);},openForCase(id){if(id===profile?.case_id)window.YodAgentMenu.showRadial(id);}};
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
   const residentLabel=page.locator('.avatar-presence[data-case-id="synthetic-office"]');
   await residentLabel.waitFor({state:'visible'});
   assert.equal(await residentLabel.getAttribute('data-selected'),'true');
   assert.match(await residentLabel.getAttribute('aria-label'),/Proyecto de prueba.*Abrir opciones/);
   const marker=await page.locator('.avatar-presence[data-case-id="synthetic-office"]').boundingBox();assert.ok(marker.width>=44&&marker.height>=44);
   assert.ok(marker.x>=0&&marker.x+marker.width<=(mobile?390:1366));
   await page.screenshot({path:path.join(out,'oficina-panorama-'+(mobile?'movil':'escritorio')+'.png')});
   console.log('OFFICE_SCREENSHOT_'+(mobile?'MOBILE':'DESKTOP')+':'+(await page.screenshot({type:'jpeg',quality:55})).toString('base64'));
   await page.locator('.avatar-presence[data-case-id="synthetic-office"]').click();assert.deepEqual(await page.evaluate(()=>window.__opened),['synthetic-office']);
   await page.locator('.radial-close').click();
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
   await page.locator('.radial-close').click();
   // Zoom and pan remain available without changing the oblique viewing angle.
   const r=await page.locator('#scene canvas').boundingBox();
   await page.mouse.move(r.x+r.width*.35,r.y+r.height*.55);await page.mouse.wheel(0,-200);
   await page.waitForFunction(()=>window.despacho.getState().zoom>1);
   await page.mouse.move(r.x+r.width*.4,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.4+40,r.y+r.height*.5+20,{steps:5});await page.mouse.up();
   await page.locator('#overview').click();assert.equal((await page.evaluate(()=>window.despacho.getState())).zoom,1);
   await page.locator('#walk').click();
   state=await page.evaluate(()=>window.despacho.getState());assert.equal(state.projection,'perspective');assert.equal(state.cutaway,false);assert.equal((await materialState()).clipped,0);
   // Labels now work in both camera modes; a resident behind the camera must remain hidden.
   await page.evaluate(async()=>{const T=await import('/despacho3d/vendor/three.module.js'),camera=window.despacho.camera;
    const avatar=window.despacho.scene.children.find(o=>o.userData.caseId==='synthetic-office'),target=new T.Box3().setFromObject(avatar).getCenter(new T.Vector3());
    window.__savedCameraQuaternion=camera.quaternion.clone();camera.lookAt(camera.position.clone().multiplyScalar(2).sub(target));
   });
   await residentLabel.waitFor({state:'hidden'});
   await page.evaluate(()=>{window.despacho.camera.quaternion.copy(window.__savedCameraQuaternion);delete window.__savedCameraQuaternion;});
   if(mobile)assert.equal(await page.locator('#joystick').isVisible(),true);
   // Actual renderer and nonmodal radial: enter by walking, then keep walking closer.
   await page.evaluate(()=>window.despacho.camera.position.set(7,1.65,3.5));
   await page.waitForFunction(()=>window.__prepares.length>0);
   assert.equal(await page.evaluate(()=>window.__voiceStarts.length),0,'preparation does not open voice');
   const viewYaw=await page.evaluate(()=>window.despacho.camera.rotation.y);
   await page.mouse.move(180,220);await page.mouse.down();await page.mouse.move(180+viewYaw/.0036,220,{steps:3});await page.mouse.up();
   await page.evaluate(()=>window.despacho.camera.position.set(7,1.65,-4.15));
   await page.keyboard.down('w');
   await page.waitForFunction(()=>document.querySelector('.station-radial')?.open);
   await page.keyboard.up('w');
   assert.equal(await page.locator('.station-radial').evaluate(e=>e.matches(':modal')),false);
   assert.equal(await page.evaluate(()=>document.getElementById('workspace').inert),false);
   assert.equal(await page.evaluate(()=>window.__voiceStarts.length),0);
   await page.screenshot({path:path.join(out,'encuentro-circulo-'+(mobile?'movil':'escritorio')+'.png')});
   console.log('ENCOUNTER_'+(mobile?'MOBILE':'DESKTOP')+':'+(await page.screenshot({type:'jpeg',quality:70})).toString('base64'));
   // Hold for a bounded movement interval and then face the actual figure.
   await page.evaluate(()=>window.despacho.camera.position.set(7,1.65,-4.30));
   await page.waitForFunction(()=>window.__voiceStarts.length===1);
   const encounterDistance=await page.evaluate(()=>{const p=window.despacho.getAgentState().position,c=window.despacho.camera.position;return Math.hypot(c.x-p[0],c.z-p[1]);});
   assert.ok(encounterDistance>=1.9&&encounterDistance<=2,'encounter must happen at two metres, not centimetres');
   assert.equal(await page.evaluate(()=>window.__voiceStarts[0].options.encounter),true);
   assert.equal(await page.evaluate(()=>window.__voiceStarts[0].options.compactOnly),true);
   await page.waitForTimeout(1200);
   assert.equal(await page.evaluate(()=>window.__voiceStarts.length),1,'no repeated automatic start');
   // Inspect the actual seated model and the physical computer texture, not an HTML substitute.
   await page.evaluate(()=>window.despacho.setAgentActivity('talk'));
   await page.waitForTimeout(150);
   const seat=await page.evaluate(()=>{const a=window.despacho.scene.children.find(o=>o.userData.caseId==='synthetic-office');return {bodyY:a.userData.body.position.y,scale:a.userData.body.scale.y,leg:a.userData.legs[0].rotation.x};});
   assert.ok(Math.abs(seat.bodyY+.50*seat.scale-.62)<.001);assert.equal(seat.leg,-Math.PI/2);
   await page.evaluate(async()=>{const T=await import('/despacho3d/vendor/three.module.js');const w=window.despacho;
    w.layout.computerScreen.update({phase:'ready',case_id:'synthetic-office',checked_at:Date.now(),projectName:'Proyecto de prueba',work:{case_id:'synthetic-office',goal_id:'synthetic-goal',run_id:'synthetic-run',title:'Comparar variantes',phase:'working',updated_at:new Date().toISOString(),progress:{sequence:2,progress:{tasks:[{title:'Verificar superficie',status:'running'},{title:'Fuente preparada',status:'ready_for_review'}],summary:''}}}});
    w.camera.position.set(8.8,2.1,-4.8);w.camera.lookAt(new T.Vector3(7,1.2,-6.8));
   });
   await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>window.despacho.getState().computer.progress.counts),'1/2 para revisar');
   console.log('SEATED_SCREEN_'+(mobile?'MOBILE':'DESKTOP')+':'+(await page.screenshot({type:'jpeg',quality:80})).toString('base64'));
   await page.locator('#overview').click();
   const start=await page.evaluate(()=>window.despacho.getAgentState().position);
   assert.equal(await page.evaluate(()=>window.despacho.agenteIr('decisions')),true);
   await page.waitForFunction(()=>window.despacho.getAgentState().motion==='walk');
   await page.waitForFunction(p=>Math.hypot(...window.despacho.getAgentState().position.map((v,i)=>v-p[i]))>.2,start);
   await residentLabel.waitFor({state:'visible'});
   // Reduced motion completes the accepted route without a long animated wait.
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>window.despacho.getAgentState().place==='decisions');
   assert.deepEqual(await page.evaluate(()=>window.__arrivals),['decisions']);
   await page.evaluate(()=>window.__revoke());
   await page.waitForFunction(()=>window.despacho.getState().avatar.count===0&&!document.querySelector('.avatar-presence[data-case-id="synthetic-office"]'));
   await page.setViewportSize(mobile?{width:844,height:390}:{width:1000,height:700});
   assert.equal((await page.evaluate(()=>window.despacho.getState())).projection,'orthographic');
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({viewport:mobile?'mobile':'desktop',overview:true,cutaway:true,meshSelection:true,marker:true,route:true,revocation:true,errors}));
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
