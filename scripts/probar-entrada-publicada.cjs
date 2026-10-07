'use strict';
// Actual public Pages deployment, no fixtures or interception. Private PPP needs the owner's session.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const out=process.env.BROWSER_EVIDENCE_DIR||'/tmp/yod-entry';fs.mkdirSync(out,{recursive:true});
 try{
  const context=await browser.newContext(),url='https://yodesarrollomx.github.io/yod-portal/despacho3d/index.html';
  const entry=fs.readFileSync(path.resolve(__dirname,'../despacho3d/index.html'),'utf8');
  const expectedAssets=entry.match(/(?:live-voice-boot\.mjs|agents\.js)\?v=[\w-]+/g)||[];
  assert.equal(expectedAssets.length,2,'the publication gate must identify both current entry assets');
  let ready=false;
  for(let attempt=0;attempt<36;attempt++){
   const response=await context.request.get(url+'?verify=puesto106-'+Date.now());
   if(response.ok()){const html=await response.text();if(expectedAssets.every(asset=>html.includes(asset))){ready=true;break;}}
   await new Promise(resolve=>setTimeout(resolve,5000));
  }
  assert.equal(ready,true,'Pages must serve the changed entry before reporting publication');
  for(const viewport of [{width:1366,height:900},{width:390,height:844}]){
   const page=await context.newPage();await page.setViewportSize(viewport);await page.goto(url+'?v=puesto106',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.despacho&&window.YodVoiceWorkspace,{},{timeout:60000});
   await page.locator('[data-entry-status]').filter({hasText:'Entra a YOD OS'}).waitFor({timeout:20000});
   assert.equal(await page.locator('#case-open').isDisabled(),true);
   await page.screenshot({path:path.join(out,'publicado-sin-sesion-'+viewport.width+'.png')});
   console.log('PUBLISHED_ENTRY_'+viewport.width+':'+(await page.screenshot({type:'jpeg',quality:75})).toString('base64'));
   console.log('Published Pages '+viewport.width+': real public scene, unavailable private project, no synthetic data.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
