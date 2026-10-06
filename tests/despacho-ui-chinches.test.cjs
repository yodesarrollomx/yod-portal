'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const uiModule=import('../despacho3d/chinches-ui.mjs');
const origin='https://synthetic.invalid';
function element(tag,parent=null,previous=null){return {nodeType:1,localName:tag,parentElement:parent,previousElementSibling:previous,
 get id(){throw Error('Do not inspect business IDs');},get className(){throw Error('Do not inspect classes for paths');},get textContent(){throw Error('Do not inspect conversations');},get dataset(){throw Error('Do not inspect arbitrary data paths');},get value(){throw Error('Do not inspect credentials');}};}
test('DOM references identify the actual tag position and never read private content',async()=>{
 const {structuralPath}=await uiModule,html=element('html'),body=element('body',html),card=element('article',body),a=element('button',card),input=element('input',card,a),button=element('button',card,input);
 assert.equal(structuralPath(button),'html:nth-of-type(1) > body:nth-of-type(1) > article:nth-of-type(1) > button:nth-of-type(2)');
 assert.equal(structuralPath(card),'html:nth-of-type(1) > body:nth-of-type(1) > article:nth-of-type(1)');
});
test('Paths fail closed on excessive depth, nth index and custom identifier tags',async()=>{
 const {structuralPath}=await uiModule;let deep=element('html');for(let i=0;i<40;i++)deep=element('section',deep);
 assert.equal(structuralPath(deep),null);assert.equal(structuralPath(element('private-case-123')),null);
 let sibling=null;for(let i=0;i<10000;i++)sibling=element('button',null,sibling);
 assert.equal(structuralPath(sibling),null);
});
test('Virtual UI uses the exact allowlist agreed with the authorized parent',async()=>{
 const {UI_SURFACES}=await uiModule;
 assert.deepEqual(UI_SURFACES,['office','areas','help','agent','chat','tasks','evidence','sources','browser','ppp','knowledge','library','activity','goals','permissions','visits','environment','circle','residents','profile','voice','terminal']);
 assert.equal(Object.isFrozen(UI_SURFACES),true);
});
function harness(view={position:[8,1.65,-4.45],quaternion:[0,0,0,1],fov:70,mode:'walk'}){
 const events=new Map(),posts=[],buttons=[],ui={stop(){},setReady(value){this.ready=value;},setPanelZone(){},pinNode(){},startGlobal(){return true;}};
 function node(){return {hidden:false,disabled:false,dataset:{},setAttribute(){},append(...nodes){buttons.push(...nodes);}};}
 const officeButtons=[{dataset:{officePin:'zone'},disabled:true},{dataset:{officePin:'interface'},disabled:true}];
 const parent={postMessage:(data,targetOrigin)=>posts.push({data:JSON.parse(JSON.stringify(data)),targetOrigin})};
 const window={parent,YODChinche:{sentinel:42},addEventListener:(type,fn)=>{const handlers=events.get(type)||[];handlers.push(fn);events.set(type,handlers);}};
 const context=vm.createContext({window,location:{origin},document:{createElement:node,querySelector:()=>node(),querySelectorAll:selector=>selector==='[data-office-pin]'?officeButtons:[]},crypto:{randomUUID:()=> '84a1d4c3-b1a2-4f67-85dc-5d941f3ca900'},innerWidth:390,innerHeight:844,setTimeout:()=>1,clearTimeout(){},testHooks:{mountChincheUI(options){ui.options=options;return ui;}}});
 const source=fs.readFileSync(require.resolve('../despacho3d/chinches3d.mjs'),'utf8').replace(/^import .*;\n/,'const {mountChincheUI}=testHooks;\n').replace('export function createChinches3D','function createChinches3D');
 vm.runInContext(source+'\nwindow.createChinches3D=createChinches3D;',context);
 const helper=window.createChinches3D({readView:()=>view,readZone:()=> 'case'});
 function emit(data,source=parent,eventOrigin=origin){for(const fn of events.get('message')||[])fn({data,source,origin:eventOrigin});}
 const ready=()=>emit({type:'yod:despacho:ready',version:1});
 return {helper,window,posts,ui,emit,ready,events,parent,officeButtons};
}
test('Auth, adapter namespace, exact v2 message and session suspension remain bounded',()=>{
 const h=harness();assert.deepEqual(h.posts,[{data:{type:'yod:despacho:hello',version:1},targetOrigin:origin}]);
 assert.equal(h.window.YODChinche.sentinel,42);assert.equal(h.window.YODChinche.senalar(),false);
 const payload={surface:'tasks',path:'html:nth-of-type(1) > body:nth-of-type(1) > button:nth-of-type(2)',item:0};
 assert.equal(h.ui.options.send('case',payload),false);
 h.emit({type:'yod:despacho:ready',version:1},{},origin);h.emit({type:'yod:despacho:ready',version:1},h.parent,'https://forged.invalid');h.emit({type:'yod:despacho:ready',version:1,token:'private'});
 assert.equal(h.window.YODChinche.senalar(),false);h.ready();assert.equal(h.window.YODChinche.senalar(),true);
 h.ui.options.send('case',payload);const request=h.posts.at(-1).data;
 assert.deepEqual(Object.keys(request).sort(),['type','version','requestId','target','view','modelVersion','viewport'].sort());
 assert.equal(request.version,2);assert.deepEqual(request.target,{id:'panel:case',zone:'case',kind:'interface',point:null,ui:payload});assert.deepEqual(request.viewport,{width:390,height:844});
 h.emit({type:'yod:despacho:disabled',version:1});assert.equal(h.ui.ready,false);assert.equal(h.window.YODChinche.senalar(),false);assert.equal(h.ui.options.send('case',payload),false);
 h.ready();for(const fn of h.events.get('pagehide'))fn();assert.equal(h.window.YODChinche.senalar(),false);
});
test('Fallback sends v2 null-camera UI only; canvas still uses the original v1 geometry',()=>{
 const map=harness({position:null,quaternion:null,fov:null,mode:'map'});map.ready();assert.equal(map.ui.options.onSceneStart(),false);
 map.ui.options.send('decisions',{surface:'office',path:'html:nth-of-type(1) > body:nth-of-type(1)',item:null});assert.deepEqual(map.posts.at(-1).data.view,{position:null,quaternion:null,fov:null,mode:'map'});assert.equal(map.posts.at(-1).data.version,2);
 const scene=harness();scene.ready();assert.equal(scene.ui.options.onSceneStart(),true);scene.helper.selectPoint([1.23456,.7,-4],'editing');const pin=scene.posts.at(-1).data;
 assert.equal(pin.version,1);assert.deepEqual(pin.target,{id:'zone:editing',zone:'editing',kind:'zone',point:[1.235,.7,-4]});assert.equal(scene.helper.isSelecting(),false);
});

test('configure refreshes existing world buttons when fallback switches to a real camera',()=>{
 const h=harness({position:null,quaternion:null,fov:null,mode:'map'});h.ready();assert.equal(h.officeButtons[0].disabled,true);assert.equal(h.officeButtons[1].disabled,false);
 h.helper.configure({readView:()=>({position:[0,1,0],quaternion:[0,0,0,1],fov:43,mode:'overview'})});assert.equal(h.officeButtons[0].disabled,false);
 h.helper.configure({readView:()=>({position:null,quaternion:null,fov:null,mode:'map'})});assert.equal(h.officeButtons[0].disabled,true);
});
