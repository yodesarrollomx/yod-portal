'use strict';

// Small DOM double for node-only presentation tests. It cannot open media or a network.
class Element {
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.parentNode=null;this.attributes={};this.dataset={};this.listeners={};this.hidden=false;this.disabled=false;this.open=false;this.value='';this._text='';this.style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};const list=new Set();this.classList={add:(...xs)=>xs.forEach(x=>list.add(x)),remove:(...xs)=>xs.forEach(x=>list.delete(x)),contains:x=>list.has(x),toggle:(x,on)=>{const next=on===undefined?!list.has(x):on;if(next)list.add(x);else list.delete(x);return next;},toString:()=>[...list].join(' ')};}
 get className(){return this.classList.toString();}set className(v){for(const c of this.classList.toString().split(' '))this.classList.remove(c);this.classList.add(...String(v).split(/\s+/).filter(Boolean));}
 get id(){return this.attributes.id||'';}set id(v){this.attributes.id=String(v);}
 setAttribute(k,v){this.attributes[k]=String(v);if(k==='class')this.className=v;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
 getAttribute(k){if(k==='class')return this.className;return Object.hasOwn(this.attributes,k)?this.attributes[k]:null;}
 hasAttribute(k){return this.getAttribute(k)!==null;}removeAttribute(k){delete this.attributes[k];}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}set textContent(v){this.replaceChildren();this._text=String(v);}
 append(...nodes){for(let n of nodes){if(typeof n==='string'){const t=new Element('#text',this.ownerDocument);t._text=n;n=t;}n.parentNode?.removeChild(n);n.parentNode=this;this.children.push(n);}}
 appendChild(n){this.append(n);return n;}prepend(...ns){for(const n of ns.reverse())this.insertBefore(n,this.firstChild);}
 insertBefore(n,reference){if(!reference){this.append(n);return n;}if(reference.parentNode!==this)throw Error('foreign_reference');n.parentNode?.removeChild(n);n.parentNode=this;this.children.splice(this.children.indexOf(reference),0,n);return n;}
 replaceChildren(...ns){for(const n of this.children)n.parentNode=null;this.children=[];this._text='';this.append(...ns);}
 removeChild(n){const i=this.children.indexOf(n);if(i<0)throw Error('not_child');this.children.splice(i,1);n.parentNode=null;return n;}remove(){this.parentNode?.removeChild(this);}
 get parentElement(){return this.parentNode;}get firstChild(){return this.children[0]||null;}get lastChild(){return this.children.at(-1)||null;}get firstElementChild(){return this.firstChild;}get childNodes(){return this.children;}get childElementCount(){return this.children.length;}
 get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}get nextElementSibling(){return this.nextSibling;}
 get isConnected(){return !!this.parentNode;}replaceWith(n){const p=this.parentNode;if(!p)return;p.insertBefore(n,this);this.remove();}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}
 matches(selector){if(selector==='*')return true;const tag=selector.match(/^[a-zA-Z][\w-]*/)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;for(const m of selector.matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){if(m[1]&&this.id!==m[1])return false;if(m[2]&&!this.classList.contains(m[2]))return false;if(m[3]){const key=m[3],value=key.startsWith('data-')?this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:this.getAttribute(key);if(value==null||m[4]!==undefined&&String(value)!==m[4])return false;}}return true;}
 querySelectorAll(selector){return this.all().filter(n=>selector.split(',').some(s=>{const parts=s.trim().split(/\s+/);if(!n.matches(parts.pop()))return false;let p=n.parentNode;while(parts.length){const part=parts.pop();while(p&&!p.matches(part))p=p.parentNode;if(!p)return false;p=p.parentNode;}return true;}));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){return this.matches(s)?this:this.parentNode?.closest(s)||null;}contains(n){return n===this||this.all().includes(n);}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}removeEventListener(k,fn){this.listeners[k]=(this.listeners[k]||[]).filter(f=>f!==fn);}
 emit(type,data={}){const event={type,target:this,preventDefault(){},stopPropagation(){},...data};for(const fn of this.listeners[type]||[])fn(event);}
 dispatchEvent(e){this.emit(e.type,e);return true;}click(){if(!this.disabled)this.emit('click');}focus(){this.ownerDocument.activeElement=this;}scrollIntoView(){}setSelectionRange(){}
 getBoundingClientRect(){return {x:0,y:0,width:280,height:320,left:0,top:0,right:280,bottom:320};}animate(){return {finished:Promise.resolve(),cancel(){}};}
}

function createDOM(){
 const doc={activeElement:null,hidden:false};doc.createElement=tag=>new Element(tag,doc);doc.createTextNode=text=>{const n=doc.createElement('#text');n.textContent=text;return n;};doc.createComment=()=>doc.createElement('#comment');doc.body=doc.createElement('body');doc.documentElement=doc.createElement('html');doc.documentElement.append(doc.body);doc.querySelector=s=>doc.documentElement.querySelector(s);doc.querySelectorAll=s=>doc.documentElement.querySelectorAll(s);doc.getElementById=id=>doc.querySelector('#'+id);
 const win=new Element('window',doc);win.location={href:'https://example.test/despacho3d/',search:''};win.matchMedia=()=>({matches:false});win.requestAnimationFrame=fn=>{fn();return 1;};win.cancelAnimationFrame=()=>{};win.CustomEvent=class {constructor(type,o={}){this.type=type;this.detail=o.detail;}};win.MutationObserver=class {observe(){}disconnect(){}};win.innerWidth=1280;
 return {doc,win};
}
module.exports={Element,createDOM};
