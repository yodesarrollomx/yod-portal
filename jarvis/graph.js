'use strict';
const $=id=>document.getElementById(id);
const STATUS='https://raw.githubusercontent.com/yodesarrollomx/potenciales-yod/grafo-datos/jarvis-estado.json';
let manifest,current,network,changes=new Map(),selected='',generation=0;
const cache=new Map();
const clean=s=>String(s||'');
function original(path){return path.replace(/\.inline-\d+\.js$/,'');}
function statusInfo(s,baseline,now=Date.now()){
  const time=Date.parse(s&&s.checked_at);
  if(!s||s.baseline!==baseline||!Number.isFinite(time)||now-time>15*60*1000||time>now+60000)return {fresh:false,text:'Sin comprobación reciente del equipo. El grafo conserva el corte publicado; el estado actual es desconocido.'};
  const n=Array.isArray(s.changes)?s.changes.length:0;
  return {fresh:true,text:(n?n+' archivos con cambios posteriores.':'Los archivos comprobados coinciden con el corte.')+' Revisado: '+new Date(time).toLocaleString('es-MX')};
}
async function json(url){const r=await fetch(url,{cache:'no-store',credentials:'omit'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
function fileList(){return manifest.files.filter(f=>f.group===$('area').value&&!f.html_source);}
function symbols(path){return Object.entries(current.files).filter(([p])=>original(p)===path).flatMap(([,a])=>a);}
function select(path){
 selected=path;const f=manifest.files.find(x=>x.path===path);if(!f)return;
 const box=$('detail');box.replaceChildren();const title=document.createElement('h2');title.textContent=path.split('/').pop();box.append(title);
 for(const text of [path,'SHA-256: '+f.sha256,'Estado: '+(changes.get(path)?.status||'En el corte publicado')]){const p=document.createElement('p');p.textContent=text;box.append(p);}
 if(path.endsWith('.html')){const p=document.createElement('p');p.textContent='Ancla del HTML original: las funciones siguientes conservan su línea dentro de este archivo. La huella identifica exactamente los bytes analizados.';box.append(p);}
 const a=document.createElement('a');a.href='data/'+f.group+'.json.gz';a.textContent='Descargar grafo nativo de esta área';box.append(a);
 const h=document.createElement('h3');h.textContent='Funciones y líneas de origen';box.append(h);const list=document.createElement('ul');
 const all=symbols(path);for(const n of all.slice(0,150)){const li=document.createElement('li');li.textContent=n.label+' · '+(n.line||'sin línea');li.id='node-'+n.id;list.append(li);}box.append(list);
 const p=document.createElement('p');p.textContent=all.length?all.length+' nodos nativos en este archivo'+(all.length>150?' (primeros 150; todos en el JSON).':'.'):'Archivo inventariado por huella; sin símbolos extraídos.';box.append(p);
 history.replaceState(null,'','#'+encodeURIComponent(path));network?.selectNodes([path]);
}
function draw(){
 if(!current)return;const query=$('search').value.trim().toLowerCase();let files=fileList();
 if(query)files=files.filter(f=>f.path.toLowerCase().includes(query)||symbols(f.path).some(n=>n.label.toLowerCase().includes(query)));
 const visible=files.slice(0,350),ids=new Set(visible.map(f=>f.path));const nodes=visible.map(f=>({id:f.path,label:f.path.split('/').pop(),title:f.path,color:changes.has(f.path)?(changes.get(f.path).status==='deleted'?'#b54b4b':'#d49c24'):'#377c91',font:{color:getComputedStyle(document.body).color},shape:'dot',size:9}));
 const edges=current.file_edges.map(([a,b,w])=>({from:original(a),to:original(b),value:Math.min(w,8)})).filter(e=>e.from!==e.to&&ids.has(e.from)&&ids.has(e.to));
 network?.destroy();network=new vis.Network($('graph'),{nodes,edges},{physics:{stabilization:{iterations:90}},interaction:{hideEdgesOnDrag:true},edges:{color:{opacity:.2},smooth:false},layout:{randomSeed:13}});
 network.on('click',e=>{if(e.nodes.length)select(e.nodes[0]);});const results=$('results');results.replaceChildren();for(const f of files.slice(0,100)){const b=document.createElement('button');b.type='button';b.textContent=f.path;b.onclick=()=>select(f.path);results.append(b);}
 const p=document.createElement('p');p.textContent=files.length+' archivos coinciden · '+visible.length+' en pantalla';results.prepend(p);
 if(selected&&ids.has(selected))select(selected);
}
async function area(){const turn=++generation,id=$('area').value;try{if(!cache.has(id))cache.set(id,await json('data/'+id+'-sources.json'));if(turn!==generation)return;current=cache.get(id);$('native').href='data/'+id+'.html';$('download').href='data/'+id+'.json.gz';draw();const hash=decodeURIComponent(location.hash.slice(1));if(hash&&fileList().some(f=>f.path===hash))select(hash);}catch(e){$('status').textContent='No se pudo cargar el grafo de esta área. Recarga para reintentar.';}}
async function check(){try{const s=await json(STATUS+'?t='+Math.floor(Date.now()/60000)),info=statusInfo(s,manifest.observed_at);$('status').textContent=info.text;changes=new Map(info.fresh?s.changes.map(c=>[c.file,c]):[]);draw();}catch(e){$('status').textContent=statusInfo(null,manifest.observed_at).text;changes.clear();draw();}}
async function start(){try{manifest=await json('manifest.json');$('cut').textContent='Corte: '+new Date(manifest.observed_at).toLocaleString('es-MX')+' · '+manifest.files.filter(f=>!f.html_source).length+' archivos · '+manifest.nodes.toLocaleString('es-MX')+' nodos nativos · '+manifest.edges.toLocaleString('es-MX')+' conexiones.';
 for(const g of manifest.groups){const o=document.createElement('option');o.value=g.id;o.textContent=g.name;$('area').append(o);}const hash=decodeURIComponent(location.hash.slice(1));$('area').value=manifest.files.find(f=>f.path===hash)?.group||'06_yod';$('coverage').textContent=manifest.coverage;$('area').onchange=area;let t;$('search').oninput=()=>{clearTimeout(t);t=setTimeout(draw,180);};await area();await check();setInterval(check,60000);}catch(e){$('cut').textContent='No se pudo cargar el manifiesto. Recarga para reintentar.';}}
if(typeof document!=='undefined')start();
