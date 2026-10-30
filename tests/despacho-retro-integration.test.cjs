'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,'../despacho-retro/retro-office.mjs')).href);

test('destinos sensibles requieren selección actual y revalidan antes de abrir',async()=>{
 const {createRetroOffice}=await load();let current=null;const opened=[];
 const env={YodResidentAgents:{getSelection:()=>current},YodVoiceWorkspace:{openForCase:(id,tab)=>{opened.push([id,tab]);return true;}},YodAgentMenu:{showRadial:id=>{opened.push([id,'menu']);return true;}}};
 const office=createRetroOffice({environment:env,hidePanel(){}});
 for(const id of ['case','computer','library','decisions'])assert.equal(office.openPanel(id),false);
 assert.deepEqual(opened,[]);
 current={case_id:'CASE-SYNTHETIC-A'};
 assert.equal(office.openPanel('computer'),true);assert.equal(office.openPanel('library'),true);
 assert.equal(office.openPanel('decisions'),true);assert.equal(office.openPanel('case'),true);
 assert.deepEqual(opened,[['CASE-SYNTHETIC-A','ppp'],['CASE-SYNTHETIC-A','activity'],['CASE-SYNTHETIC-A','meeting'],['CASE-SYNTHETIC-A','menu']]);
 env.YodVoiceWorkspace.openForCase=async()=>true;assert.equal(await office.openPanel('computer'),true);
 let calls=0;env.YodResidentAgents.getSelection=()=>++calls===1?{case_id:'CASE-SYNTHETIC-A'}:{case_id:'CASE-SYNTHETIC-B'};
 assert.equal(office.openPanel('case'),false);assert.equal(opened.length,4);
 office.destroy();assert.equal(office.openPanel('case'),false);
});

test('visitar sin renderer conserva navegación sin inventar actividad',async()=>{
 const {createRetroOffice}=await load();const office=createRetroOffice({environment:{},hidePanel(){}});
 assert.equal(office.visit('library'),true);assert.equal(office.getState().selected,'library');
 assert.equal(office.visit('unknown'),false);assert.equal(office.getState().selected,'library');
 assert.equal(office.getAgentState().position,null);assert.equal(office.setAgentActivity('talk'),false);
 office.destroy();office.destroy();assert.equal(office.visit('entry'),false);
});

test('revocar durante selección asincrónica retira figura y evita abrir el puesto',async()=>{
 const {createRetroOffice}=await load();let catalog=[{id:'CASE-SYNTHETIC-A',case_id:'CASE-SYNTHETIC-A',entity_kind:'case',name:'Caso de prueba'}],selection=null,notify,finish,opened=0,shown=[];
 const residents={getAuthorizedProfiles:()=>catalog,subscribeAuthorizedProfiles(fn){notify=fn;return()=>{notify=null;}},getSelection:()=>selection,selectCase:()=>new Promise(resolve=>{finish=resolve;})};
 const map={setResidents:items=>{shown=items;}};
 const env={YodResidentAgents:residents,YodAgentMenu:{showRadial(){opened++;return true;}}};
 const office=createRetroOffice({environment:env,getMap:()=>map});assert.equal(shown.length,1);
 const pending=office.selectResident('CASE-SYNTHETIC-A');
 catalog=[];notify();assert.equal(shown.length,0);selection={case_id:'CASE-SYNTHETIC-A'};finish(true);
 assert.equal(await pending,false);assert.equal(opened,0);
 assert.equal(office.setResidentSnapshots([{case_id:'CASE-SYNTHETIC-A',x:1,z:1}]),true);assert.equal(shown.length,0);
 office.destroy();assert.equal(notify,null);
});

test('selector sobre emisiones reales conserva vigencia al seleccionar y la pierde al revocar',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 let source=fs.readFileSync(path.resolve(__dirname,'../despacho-retro/retro-runtime.mjs'),'utf8');
 source=source.replaceAll('export function ','function ').replaceAll('export async function ','async function ')
  .replace("await import('./retro-office.mjs')","await Promise.resolve({createRetroOffice:()=>({visit(){},openPanel(){},destroy(){}})})")
  .replace(/await Promise\.all\(\['office-lifecycle\.mjs'[\s\S]*?\.map\(name=>import\(`\.\.\/despacho3d\/\$\{name\}`\)\)\);/, 'await Promise.resolve();')
  .replace("await import('../despacho3d/live-voice-core.mjs?v=retro1')","await Promise.resolve({mountLiveVoice(){}})");
 const nodes=new Map();function node(){return {children:[],hidden:false,disabled:false,textContent:'',setAttribute(){},append(n){this.children.push(n);},after(){},replaceChildren(){this.children=[];},addEventListener(type,fn){this[type]=fn;}};}
 const doc={head:node(),querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},getElementById(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},createElement:()=>node()};
 let callback,selection=null,finish,guard;
 const resident={subscribe:()=>()=>{},subscribeCatalog(fn){callback=fn;return()=>{};},getSelection:()=>selection,selectCase(id,opts){guard=opts.isCurrent;callback({phase:'current',cases:[{case_id:id,name:'Caso sintético'}]});return new Promise(r=>finish=()=>{if(guard())selection={case_id:id};r(guard());});}};
 const events={};const win={YodResidentAgents:resident,addEventListener(type,fn){events[type]=fn;},removeEventListener(type){delete events[type];},dispatchEvent(){}};
 const context=vm.createContext({window:win,document:doc,URL,CustomEvent:class{}});
 vm.runInContext(source+'\nthis.mount=mountRetroRuntime;',context);
 await context.mount({getMap:()=>null,onPanel(){},hidePanel(){},onPlaceReady(){}});
 const catalog=[{case_id:'CASE-SYNTHETIC',name:'Caso sintético'}];callback({phase:'current',cases:catalog});
 let button=doc.getElementById('retro-cases').children[0];const first=button.click();assert.equal(guard(),true,'emisión de selección conserva catálogo');finish();await first;assert.equal(selection.case_id,'CASE-SYNTHETIC');
 selection=null;callback({phase:'current',cases:catalog});button=doc.getElementById('retro-cases').children[0];const second=button.click();callback({phase:'unauthorized',cases:[]});assert.equal(guard(),false,'revocación invalida petición');finish();await second;assert.equal(selection,null);
 callback({phase:'current',cases:catalog});button=doc.getElementById('retro-cases').children[0];const third=button.click();const oldGuard=guard;const oldFinish=finish;
 win.YodResidentAgents={...resident,subscribeCatalog(fn){fn({phase:'current',cases:catalog});return()=>{};}};events['yod-residents-ready']();
 assert.equal(oldGuard(),false,'reemplazo del proveedor invalida solicitud anterior');oldFinish();await third;assert.equal(selection,null);
});

test('seleccionar otro autón abre su puesto tras emisión idéntica del catálogo',async()=>{
 const {createRetroOffice}=await load();const catalog=['A','B'].map(id=>({id:'CASE-SYNTHETIC-'+id,case_id:'CASE-SYNTHETIC-'+id,entity_kind:'case',name:'Caso '+id}));
 let selection={case_id:catalog[0].case_id},notify,finish;const opened=[];
 const resident={getAuthorizedProfiles:()=>catalog,subscribeAuthorizedProfiles(fn){notify=fn;return()=>{};},getSelection:()=>selection,selectCase(id){notify();return new Promise(resolve=>{finish=()=>{selection={case_id:id};notify();resolve(true);};});}};
 const env={YodResidentAgents:resident,YodAgentMenu:{showRadial:id=>(opened.push(id),true)}};
 const office=createRetroOffice({environment:env,getMap:()=>({setResidents(){}})});
 const pending=office.selectResident(catalog[1].case_id);finish();
 assert.equal(await pending,true);assert.deepEqual(opened,[catalog[1].case_id]);office.destroy();
});
