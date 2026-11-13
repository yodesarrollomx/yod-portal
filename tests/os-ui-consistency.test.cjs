'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const app=fs.readFileSync(require.resolve('../os/app.js'),'utf8');
const shell=fs.readFileSync(require.resolve('../os/shell.js'),'utf8');
function env(){
 const elements={},document={activeElement:null,handlers:{},modal:null};
 class Element {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.handlers={};this.attrs={};this.value='';this.open=false;this.offsetParent={};this.isConnected=true;const classes=new Set();this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){(this.handlers[k]??=[]).push(fn);}
  fire(k,e={}){e.target??=this;e.preventDefault??=()=>{e.prevented=true;};for(const fn of this.handlers[k]||[])fn(e);return e;}
  append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parent=this;}
  appendChild(n){this.append(n);}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  set innerHTML(value){this.html=value;this.children=[];}
  get innerHTML(){return this.html;}
  querySelector(s){if(this.select?.[s])return this.select[s];if(s==='a[href]'||s==='#yodRes a')return this.walk().find(n=>n.tagName==='a'&&n.href)||null;return null;}
  querySelectorAll(){return this.children;}
  walk(){return this.children.flatMap(n=>[n,...n.walk()]);}
  contains(n){return n===this||this.walk().includes(n);}
  closest(s){if(s==='#yodRes a'&&this.tagName==='a')return this;if(s==='.yod-nav-item'&&this.tagName==='a')return this;return null;}
  focus(){document.activeElement=this;}
  click(){this.clicked=(this.clicked||0)+1;this.fire('click');for(let p=this.parent;p;p=p.parent)p.fire('click',{target:this});}
  showModal(){if(this.open)throw Error('already open');this.open=true;document.modal=this;}
  close(){this.open=false;document.modal=null;}
 }
 document.getElementById=id=>elements[id];document.createElement=tag=>new Element(tag);document.body=new Element('body');
 document.addEventListener=(k,f)=>(document.handlers[k]??=[]).push(f);
 document.querySelector=s=>s==='dialog[open]'?document.modal:null;
 const add=(id,tag)=>elements[id]=new Element(tag);
 const run=(src,extra={})=>{const c=vm.createContext({document,window:{},setTimeout:f=>f(),...extra});vm.runInContext(src,c);return c;};
 return {elements,document,Element,add,run};
}
function shellSearch(){
 const e=env(),trigger=e.add('yodSearch','button'),input=e.add('yodQ','input'),box=e.add('yodRes'),close=e.add('yodSearchClose','button'),form=new e.Element('form');let dialog;
 const rows=[{system_id:'SYS-INVERSION',titulo_portal:'Inversión',url:'https://example.test/board'},{system_id:'SYS-OBRA',titulo_portal:'Obra',url:'https://example.test/obra'}];
 const c=e.run(shell.slice(shell.indexOf('  function searchText('),shell.indexOf("  if (document.readyState === 'loading')")),{
  state:{modules:rows,identity:'ok'},NAME:{},CODES:{'SYS-INVERSION':['IV'],'SYS-OBRA':['OB']},ICON:{},
  moduleTitle:r=>r.system_id==='SYS-INVERSION'?'Master Developer':r.titulo_portal,vivo:()=>true,enlace:r=>r.url,esPropioShell:()=>false,esc:String,canOpenProject:()=>false,
  el:tag=>{const n=new e.Element(tag);if(tag==='dialog'){dialog=n;n.select={form,'#yodRes a':null};n.querySelector=s=>s==='form'?form:s==='#yodRes a'?box.children.find(x=>x.tagName==='a'):null;}return n;}
 });c.wireSearch();box.parent=dialog;return {...e,trigger,input,box,close,form,dialog,c};
}
test('marco: consulta visible y lista coinciden al reabrir; atajo repetido no lanza excepción',()=>{
 const e=shellSearch();e.trigger.click();e.input.value='inversion';e.dialog.fire('input',{target:e.input});assert.equal(e.box.children.length,1);
 e.close.click();assert.equal(e.dialog.open,false);e.trigger.click();assert.equal(e.input.value,'');assert.equal(e.box.children.length,2);assert.doesNotThrow(()=>e.trigger.click());
});
test('marco: Enter abre el primer enlace con su target; cerrar no navega y cero resultados conserva diálogo',()=>{
 const e=shellSearch();e.trigger.click();const first=e.box.children[0];assert.equal(first.attrs.target,'_blank');const event=e.form.fire('submit');assert.equal(event.prevented,true);assert.equal(first.clicked,1);assert.equal(e.dialog.open,false);
 e.trigger.click();const untouched=e.box.children[0];e.close.click();assert.equal(untouched.clicked,undefined);
 e.trigger.click();e.input.value='no-existe';e.dialog.fire('input',{target:e.input});e.form.fire('submit');assert.equal(e.dialog.open,true);
});
test('ambos buscadores normalizan espacios, mayúsculas y acentos sin depender de permisos',()=>{
 for(const source of [app,shell]){const c=vm.createContext({safeText:v=>String(v||'')});vm.runInContext(source.match(/  function searchText\(value\)[^\n]+/)[0],c);assert.equal(c.searchText('  INVERSIÓN  '),'inversion');assert.equal(c.searchText(null),'');}
});
test('cabina: busca el nombre de rol visible y códigos; mantenimiento conserva resultado sin enlace',()=>{
 const e=env();const box=e.add('search-results');e.add('search-count');
 const rows=[{system_id:'SYS-INVERSION',titulo_portal:'Inversión'},{system_id:'SYS-OBRA',titulo_portal:'Obra',off:true}];
 const c=e.run(app.slice(app.indexOf('  function searchText('),app.indexOf('  function openSearch(')),{$:id=>e.elements[id],safeText:v=>String(v||''),state:{modules:rows},ICONS:{},hrefDe:v=>v,moduleTitle:r=>r.system_id==='SYS-INVERSION'?'Master Developer':r.titulo_portal,window:{YodAccessPolicy:{systemCodes:{'SYS-INVERSION':['IV'],'SYS-OBRA':['OB']}},PortalCore:{enabled:r=>!r.off,badge:()=>({text:'Mantenimiento'}),resolveUrl:()=>'/board'}}});
 for(const query of ['Developer',' IV ','inversion']){c.buildSearch(query);assert.equal(box.children.length,1);assert.equal(box.children[0].tagName,'a');assert.equal(box.children[0].children[0].children[0].textContent,'Master Developer');}
 c.buildSearch('OB');assert.equal(box.children[0].tagName,'div');assert.equal(box.children[0].attrs['aria-disabled'],'true');assert.equal(box.children[0].href,undefined);
});
test('cabina: Enter usa enlace habilitado; sin resultados no cierra y botón cerrar es independiente',()=>{
 const e=env(),dlg=e.add('search-dialog'),form=new e.Element('form'),box=e.add('search-results'),close=e.add('search-close');dlg.select={form};
 e.run(app.slice(app.indexOf("  $('search-dialog').querySelector('form').addEventListener"),app.indexOf("  $('welcome-title').firstChild")),{$:id=>e.elements[id]});
 dlg.open=true;const noResult=form.fire('submit');assert.equal(noResult.prevented,true);assert.equal(dlg.open,true);
 const link=new e.Element('a');link.href='/allowed';box.append(link);form.fire('submit');assert.equal(link.clicked,1);close.click();assert.equal(dlg.open,false);
 const html=fs.readFileSync(require.resolve('../os/index.html'),'utf8');assert.match(html,/<button type="button" id="search-close"/);
});
test('menú móvil compartido: fuera de pantalla no recibe foco; Tab circular, Escape y escritorio coherentes',()=>{
 const e=env(),side=new e.Element('aside'),first=new e.Element('a'),last=new e.Element('button'),burger=e.add('yodBurger','button'),nav=e.add('yodNav'),scrim=new e.Element(),root=new e.Element();
 side.append(first,last);root.select={'.yod-sidebar':side};const mq={matches:true,addEventListener:(k,f)=>mq.change=f};
 const c=e.run(shell.slice(shell.indexOf('  function wireDrawer('),shell.indexOf('  function loadCatalog(')),{window:{matchMedia:()=>mq},sessionStorage:{getItem:()=> '1'}});c.wireDrawer(root,scrim);
 assert.equal(side.inert,true);assert.equal(burger.attrs['aria-expanded'],'false');burger.focus();burger.click();assert.equal(side.inert,false);assert.equal(burger.attrs['aria-expanded'],'true');assert.equal(e.document.activeElement,first);
 const key=event=>{event.preventDefault=()=>event.prevented=true;e.document.handlers.keydown.forEach(fn=>fn(event));return event;};
 last.focus();assert.equal(key({key:'Tab'}).prevented,true);assert.equal(e.document.activeElement,first);
 key({key:'Tab',shiftKey:true});assert.equal(e.document.activeElement,last);
 e.document.modal={};key({key:'Escape'});assert.equal(burger.attrs['aria-expanded'],'true');e.document.modal=null;
 key({key:'Escape'});assert.equal(e.document.activeElement,burger);assert.equal(side.inert,true);assert.equal(burger.attrs['aria-expanded'],'false');
 mq.matches=false;mq.change();assert.equal(side.inert,false);burger.focus();burger.click();mq.matches=true;mq.change();assert.equal(side.inert,true);assert.equal(burger.attrs['aria-expanded'],'false');
});
