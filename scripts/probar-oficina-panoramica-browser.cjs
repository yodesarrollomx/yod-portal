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
    const roomListeners=new Set();let activity='working';const roomState=()=>[{case_id:profile?.case_id,phase:'ready',checked_at:Date.now(),work:null,auton_status:{ok:true,schema:1,case_id:profile?.case_id,admission:'alta',activity,reason:activity==='presenting'?'live_presentation':'live_execution',source_ref:'Proyectos!2',source_revision:'fixture',observed_at:new Date().toISOString(),library_only:false}}];
    window.YodRoomWork={subscribe(fn){roomListeners.add(fn);fn(roomState());return()=>roomListeners.delete(fn);}};window.__publishResidence=value=>{activity=value;for(const fn of roomListeners)fn(roomState());};
    // This geometry test models a connected worker. Keep its synthetic observations fresh;
    // otherwise a slow screenshot run legitimately sends the resident away after 90 seconds.
    setInterval(()=>{if(profile)window.__publishResidence(activity);},5000);
    // This geometry fixture strips the UI boots; observe the radial route used by the marker.
    window.__prepares=[];window.__voiceStarts=[];window.__nearbyPrepared=false;window.YodVoiceWorkspace={isOpen:()=>false,prepareNearby:id=>{window.__prepares.push(id);window.__nearbyPrepared=true;},releaseNearby:()=>{window.__nearbyPrepared=false;},openForCase:async(id,tab,options)=>{
     const p=window.despacho.getAgentState().position,c=window.despacho.camera.position;
     window.__voiceStarts.push({id,tab,options,distance:Math.hypot(c.x-p[0],c.z-p[1]),agent_position:[...p],camera_position:[c.x,c.z]});return true;
    }};
    window.__menuStops=[];window.__stopAtRadial=false;
    // The lateral corridor in front of the desks is clear; the old northward start
    // at z=-3.55 was inside the partition's collision margin.
    window.__placeApproach=distance=>{const p=window.despacho.getAgentState().position;window.despacho.camera.position.set(p[0]+distance,1.65,p[1]);};
    const walkKeys=new Set();window.__walkEvents=[];window.__watchWalk=false;
    window.__walkSnapshot=()=>({state:window.despacho.getState?.(),agent:window.despacho.getAgentState(),camera:[window.despacho.camera.position.x,window.despacho.camera.position.y,window.despacho.camera.position.z],focus:document.activeElement?.id,hidden:document.hidden,observedKeys:[...walkKeys],prepared:window.__nearbyPrepared,menuStops:window.__menuStops,voiceStarts:window.__voiceStarts});
    window.__recordWalk=(type,key)=>{if(window.__watchWalk){window.__walkEvents.push({type,key,at:performance.now(),...window.__walkSnapshot()});if(window.__walkEvents.length>24)window.__walkEvents.shift();}};
    for(const type of ['keydown','keyup','blur'])window.addEventListener(type,event=>{if(type==='keydown')walkKeys.add(event.key);else if(type==='keyup')walkKeys.delete(event.key);else walkKeys.clear();window.__recordWalk(type,event.key);});
    document.addEventListener?.('visibilitychange',()=>{walkKeys.clear();window.__recordWalk('visibilitychange');});
    window.addEventListener('yod-agent-menu-open',e=>{
     window.__opened.push(e.detail.case_id);
     if(window.__stopAtRadial){
      window.__stopAtRadial=false;window.dispatchEvent(new KeyboardEvent('keyup',{key:'w',bubbles:true}));
      const p=window.despacho.getAgentState().position,c=window.despacho.camera.position;
      window.__menuStops.push({distance:Math.hypot(c.x-p[0],c.z-p[1]),agent_position:[...p],camera_position:[c.x,c.z]});
     }
    });
    window.YodResidentAgents={getSelection:()=>profile?{case_id:profile.case_id,name:profile.name,avatar:profile,can_enqueue:true}:null,subscribe(fn){fn();return()=>{};},getProfile:()=>profile,subscribeProfile(fn){listeners.add(fn);fn(profile);return()=>listeners.delete(fn);},openForCase(id){if(id===profile?.case_id)window.YodAgentMenu.showRadial(id);}};
    window.__revoke=()=>{profile=null;for(const fn of listeners)fn(null);};
    window.addEventListener('yod-agent-arrived',e=>window.__arrivals.push(e.detail.lugar));
   });
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.goto(base+'/despacho3d/');
   await page.waitForFunction(()=>window.despacho?.view==='3d'&&window.despacho.getState().frames>1,{},{timeout:60000});
   await page.waitForFunction(()=>window.despacho.getAgentState().place==='inicio'&&window.despacho.getAgentState().motion!=='walk',{},{timeout:45000});
   await page.emulateMedia({reducedMotion:'no-preference'});
   let state=await page.evaluate(()=>window.despacho.getState());
   assert.equal(state.mode,'walk');assert.equal(state.projection,'perspective');assert.equal(state.cutaway,false);
   if(mobile)assert.equal(await page.locator('#joystick').isVisible(),true);
   await page.locator('#overview').click();
   state=await page.evaluate(()=>window.despacho.getState());
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
   // Observe a release and fresh preparation, so prior manual dismissals have
   // passed through the production leave radius before this new approach.
   await page.evaluate(()=>window.__placeApproach(-13));
   await page.waitForFunction(()=>window.__nearbyPrepared===false);
   await page.evaluate(()=>window.__placeApproach(-9.75));
   await page.waitForFunction(()=>window.__nearbyPrepared===true);
   assert.equal(await page.evaluate(()=>window.__voiceStarts.length),0,'preparation does not open voice');
   // Pointer gestures must start on the renderer, not the overlaid entry card.
   // The production pointer handler updates both private yaw and camera rotation.
   for(let turn=0;turn<8;turn++){
    const gesture=await page.evaluate(()=>{
     const canvas=document.querySelector('#scene canvas'),r=canvas.getBoundingClientRect(),delta=(window.despacho.camera.rotation.y-Math.PI/2)/.0036;
     if(Math.abs(delta)<.01)return null;
     const dx=Math.max(-r.width*.6,Math.min(r.width*.6,delta));
     for(const fy of [.5,.7,.4])for(const fx of [.8,.2,.5]){const x=r.x+r.width*fx,y=r.y+r.height*fy,end=x+dx;
      if(end>r.left+8&&end<r.right-8&&document.elementFromPoint(x,y)===canvas&&document.elementFromPoint(end,y)===canvas)return {x,y,dx};
     }
     throw Error('No clear canvas gesture for approach orientation');
    });
    if(!gesture)break;
    await page.mouse.move(gesture.x,gesture.y);await page.mouse.down();await page.mouse.move(gesture.x+gesture.dx,gesture.y,{steps:3});await page.mouse.up();
   }
   const approachYaw=await page.evaluate(()=>window.despacho.camera.rotation.y);
   assert.ok(Math.abs(approachYaw-Math.PI/2)<.001,'W must point left along the clear corridor: '+approachYaw);
   // Walk with real input into the radial zone and stop in the same event turn.
   // A delayed automation roundtrip must not leave W held through the voice zone.
   await page.evaluate(()=>{window.__placeApproach(2.7);window.__stopAtRadial=true;window.__watchWalk=true;window.__recordWalk('start');});
   assert.equal(await page.evaluate(()=>{const c=window.despacho.camera.position;return window.despacho.allowed(c.x,c.z);}),true,'the approach must start outside every collision');
   await page.keyboard.down('w');
   try{await page.waitForFunction(()=>document.querySelector('.station-radial')?.open);}catch(error){
    console.log('PANORAMA_RADIAL_TIMEOUT',JSON.stringify(await page.evaluate(()=>({...window.__walkSnapshot(),events:window.__walkEvents}))));
    await page.screenshot({path:path.join(out,'radial-timeout-'+(mobile?'movil':'escritorio')+'.png')}).catch(()=>{});throw error;
   }finally{await page.keyboard.up('w');await page.evaluate(()=>{window.__watchWalk=false;});}
   const menuStop=await page.evaluate(()=>window.__menuStops.at(-1));
   assert.ok(menuStop?.distance>2&&menuStop.distance<=2.6,'walking stops in the radial zone before voice: '+JSON.stringify(menuStop));
   assert.equal(await page.locator('.station-radial').evaluate(e=>e.matches(':modal')),false);
   assert.equal(await page.evaluate(()=>document.getElementById('workspace').inert),false);
   assert.equal(await page.evaluate(()=>window.__voiceStarts.length),0);
   await page.screenshot({path:path.join(out,'encuentro-circulo-'+(mobile?'movil':'escritorio')+'.png')});
   assert.equal(await page.evaluate(()=>window.__voiceStarts.length),0,'no encounter before approaching within two metres');
   // Stop 1.95 m from the actual seated figure, then let the production dwell gate run.
   await page.evaluate(()=>window.__placeApproach(1.95));
   await page.waitForFunction(()=>window.__voiceStarts.length===1);
   const encounter=await page.evaluate(()=>window.__voiceStarts[0]),encounterDistance=encounter.distance;
   assert.ok(encounterDistance>=1.9&&encounterDistance<=2,'encounter must happen at two metres, not centimetres: '+JSON.stringify(encounter));
   assert.equal(await page.evaluate(()=>window.__voiceStarts[0].options.encounter),true);
   assert.equal(await page.evaluate(()=>window.__voiceStarts[0].options.compactOnly),true);
   await page.waitForTimeout(1200);
   assert.equal(await page.evaluate(()=>window.__voiceStarts.length),1,'no repeated automatic start');
   // Inspect the actual seated model and the physical computer texture, not an HTML substitute.
   await page.evaluate(()=>window.despacho.setAgentActivity('talk'));
   await page.waitForTimeout(150);
   const seat=await page.evaluate(async()=>{const T=await import('/despacho3d/vendor/three.module.js');
    const avatar=window.despacho.scene.children.find(o=>o.userData.caseId==='synthetic-office');avatar.updateMatrixWorld(true);
    return avatar.userData.legs.map(leg=>{const thigh=leg.children.find(o=>o.isMesh);if(!thigh)throw Error('missing upper thigh mesh');return {contactY:new T.Box3().setFromObject(thigh).min.y,leg:leg.rotation.x};});
   });
   // Measure the rendered thighs against the actual 0.62 m chair top, independent of either rig's hip offset.
   assert.equal(seat.length,2);for(const side of seat){assert.ok(Math.abs(side.contactY-.62)<.001,JSON.stringify(side));assert.equal(side.leg,-Math.PI/2);}
   await page.evaluate(async()=>{const T=await import('/despacho3d/vendor/three.module.js');const w=window.despacho;
    w.layout.computerScreen.update({phase:'ready',case_id:'synthetic-office',checked_at:Date.now(),projectName:'Proyecto de prueba',work:{case_id:'synthetic-office',goal_id:'synthetic-goal',run_id:'synthetic-run',title:'Comparar variantes',phase:'working',updated_at:new Date().toISOString(),progress:{sequence:2,progress:{tasks:[{title:'Verificar superficie',status:'running'},{title:'Fuente preparada',status:'ready_for_review'}],summary:''}}}});
    w.camera.position.set(8.8,2.1,-4.8);w.camera.lookAt(new T.Vector3(7,1.2,-6.8));
   });
   await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>window.despacho.getState().computer.progress.counts),'1/2 para revisar');
   await page.screenshot({path:path.join(out,'puesto-sentado-'+(mobile?'movil':'escritorio')+'.png')});
   await page.locator('#overview').click();
   const start=await page.evaluate(()=>window.despacho.getAgentState().position);
   await page.evaluate(()=>window.__publishResidence('presenting'));
   await page.waitForFunction(()=>window.despacho.getAgentState().motion==='walk');
   await page.waitForFunction(p=>Math.hypot(...window.despacho.getAgentState().position.map((v,i)=>v-p[i]))>.2,start);
   await residentLabel.waitFor({state:'visible'});
   // Reduced motion completes the accepted route without a long animated wait.
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>window.despacho.getAgentState().place==='presenting');
   const arrival=await page.evaluate(()=>window.despacho.getAgentState());
   assert.equal(arrival.destination,null);assert.equal(arrival.motion,'idle');
   assert.deepEqual(arrival.position,[3.25,5],'the source-driven route ends at the council presentation spot');
   await page.evaluate(()=>window.__revoke());
   await page.waitForFunction(()=>window.despacho.getState().avatar.count===0&&!document.querySelector('.avatar-presence[data-case-id="synthetic-office"]'));
   await page.setViewportSize(mobile?{width:844,height:390}:{width:1000,height:700});
   assert.equal((await page.evaluate(()=>window.despacho.getState())).projection,'orthographic');
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({viewport:mobile?'mobile':'desktop',overview:true,cutaway:true,meshSelection:true,marker:true,route:true,revocation:true,menu_distance_m:menuStop.distance,encounter_distance_m:encounterDistance,errors}));
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
