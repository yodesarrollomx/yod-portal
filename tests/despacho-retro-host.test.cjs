'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../os/despacho-section.js'),'utf8');
function node(){const attrs=new Map(),listeners={};return {hidden:false,children:[],contentWindow:{},classList:{toggle(){},contains(){return false;}},getAttribute:k=>attrs.get(k)||null,setAttribute(k,v){attrs.set(k,v);},removeAttribute(k){attrs.delete(k);},addEventListener(k,f){listeners[k]=f;},appendChild(n){n.parent=this;this.children.push(n);},remove(){this.parent.children=this.parent.children.filter(x=>x!==this);}};}
function harness(search){
 const nodes=new Map(['seccionDespacho','despachoCanvas','despachoEstado','despachoAbrir','despachoBandeja'].map(k=>[k,node()])),frames=[],events={};
 const win={location:{hash:'#/despacho',search},addEventListener(k,f){(events[k]||=([])).push(f);}};
 const doc={body:node(),getElementById:k=>nodes.get(k),querySelector:()=>node(),querySelectorAll:()=>[],createElement(){const n=node();frames.push(n);return n;}};
 const identity={ready:false,allowed:true,epoch:1},ctx=vm.createContext({});vm.runInContext(source,ctx);
 const section=ctx.YodDespachoSection.create({window:win,document:doc,readAccess:()=>({...identity}),onTeardown(){},revalidate(){identity.ready=false;}});
 return {frames,identity,section,event:(k,e)=>{for(const fn of events[k]||[])fn(e);}};
}
test('retro es opt-in exacto y conserva puerta de acceso y revocación del host',()=>{
 for(const [query,retro] of [['',false],['?office=retro',true],['?x=1&office=retro&v=1',true],['?office=retro2',false],['?office=Retro',false]]){
  const h=harness(query);h.section.refresh();assert.equal(h.frames.length,0);
  h.identity.ready=true;h.section.refresh();assert.equal(h.frames.length,1);
  assert.equal(h.frames[0].getAttribute('src'),retro?'../despacho-retro/index.html?office=retro&v=retro1':'../despacho3d/index.html?v=council-trace5');
  h.identity.allowed=false;h.section.refresh();assert.equal(h.section.getIframeWindow(),null);assert.equal(h.frames[0].getAttribute('src'),null);
 }
});
test('recuperación retro descarta iframe anterior y exige revalidar sesión',()=>{
 const h=harness('?office=retro');h.identity.ready=true;h.section.refresh();const old=h.frames[0];
 h.event('pagehide',{persisted:true});h.event('pageshow',{persisted:true});h.section.refresh();
 assert.equal(old.getAttribute('src'),null);assert.equal(h.section.getIframeWindow(),null);
 h.identity.ready=true;h.identity.epoch++;h.section.refresh();
 assert.equal(h.frames[1].getAttribute('src'),'../despacho-retro/index.html?office=retro&v=retro1&office_recovery=history');
 assert.notEqual(h.section.getIframeWindow(),old.contentWindow);
});

test('adaptador de chinches reutiliza selector, limita zonas y exige handshake del host',async()=>{
 let src=fs.readFileSync(require.resolve('../despacho-retro/retro-chinches.mjs'),'utf8').replace(/^import .*?;\s*/m,'').replace('export function ','function ');
 const events={},availability=[],bound=[],stops=[];let options,starts=0;
 const parent={};const win={parent,YODChinche:{senalar(){starts++;return true;}},addEventListener(type,fn){events[type]=fn;}};
 const context=vm.createContext({window:win,location:{origin:'https://example.test'},createChinches3D:o=>(options=o,{bindPanel:id=>bound.push(id),stop:()=>stops.push(true)})});
 vm.runInContext(src+'\nthis.mount=mountRetroChinches;',context);
 const adapter=context.mount({onAvailability:v=>availability.push(v),readZone:()=> 'projects',closeSheets(){}});
 assert.equal(adapter.start(),false);assert.equal(options.readZone(),'projects');
 assert.equal(adapter.isSelecting(),false);options.onChange(true);assert.equal(adapter.isSelecting(),true);options.onChange(false);assert.equal(adapter.isSelecting(),false);
 assert.deepEqual(JSON.parse(JSON.stringify(options.readView())),{position:null,quaternion:null,fov:null,mode:'map'});
 events.message({source:{},origin:'https://example.test',data:{type:'yod:despacho:ready',version:1}});assert.equal(adapter.start(),false);
 events.message({source:parent,origin:'https://example.test',data:{type:'yod:despacho:ready',version:1}});assert.equal(adapter.start(),true);assert.equal(starts,1);
 assert.equal(adapter.bindPanel('projects'),true);assert.equal(adapter.bindPanel('library'),false);assert.deepEqual(bound,['projects']);
 events.message({source:parent,origin:'https://example.test',data:{type:'yod:despacho:disabled',version:1}});assert.equal(adapter.start(),false);
 adapter.stop();assert.equal(stops.length,1);assert.deepEqual(availability,[false,true,false]);
});
