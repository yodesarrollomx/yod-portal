'use strict';
(async function () {
  const M = window.JarvisGraph, S = window.JarvisSource, $ = id => document.getElementById(id);
  const base = new URL('.', document.currentScript.src);
  const STATUS = 'https://raw.githubusercontent.com/yodesarrollomx/potenciales-yod/grafo-datos/jarvis-estado.json';
  const purpose = {'01_motor':'Coordina conversaciones, sesiones y la ejecución de los agentes.','02_herramientas':'Conecta a Jarvis con herramientas y proveedores.','03_cli_panel':'Permite operar y configurar Jarvis desde el panel y la consola.','04_web':'Reúne las interfaces web y de terminal de Hermes.','05_raiz':'Contiene las piezas centrales de Hermes y su arranque.','06_yod':'Voz, delegación, mayordomo, observador y extensiones propias de YOD.','07_memoria':'Conecta la memoria con Obsidian y sus pantallas.','08_mundo':'Organiza el mundo visual, el tablero y sus servicios.'};
  const colors = ['#72c9c0','#8eaff1','#b9a7ed','#8cc8e5','#8fc8ab','#a4b8d0','#8bb5bf','#c0b5e5'];
  const relations = {calls:'llama a',imports:'importa',contains:'contiene',inherits:'hereda de',uses:'usa',references:'referencia',defines:'define',belongs_to:'pertenece a'};
  let manifest, idx = null, loaded = '', map = null, route = {}, request = 0, choices = [], shown = 24;
  let status = {fresh:false,changes:[]}, changes = new Map(), onlyChanges = false, codeTarget = null, codeRequest = 0;
  const el = (tag,text,cls) => {const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
  const button = (text,fn,cls) => {const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
  const group = () => manifest.groups.find(g=>g.id===route.area);
  const fileMeta = path => manifest.files.find(f=>f.path===path&&!f.html_source);
  const counted = n => n.toLocaleString('es-MX');
  const color = item => {const paths=item.paths||[item.path];const states=paths.map(p=>changes.get(p)?.status);if(states.includes('deleted'))return '#db7384';if(states.some(Boolean))return '#c99138';const seed=[...M.component(paths[0]||item.id)].reduce((n,c)=>n+c.charCodeAt(0),0);return item.color||colors[seed%colors.length];};
  function stateText(path) {return !status.fresh?'Estado actual desconocido':changes.has(path)?({modified:'Modificado después del corte',deleted:'Eliminado después del corte',added:'Añadido después del corte'}[changes.get(path).status]||'Cambió después del corte'):'Coincide con el corte';}
  function readRoute() {
    const raw=location.hash.slice(1), params=new URLSearchParams(raw.includes('=')?raw:'');
    let file=params.get('file')||'';
    if(raw&&!raw.includes('=')){try{file=decodeURIComponent(raw);}catch{file='';}}
    const area=params.get('area')||file.split('/')[0]||document.documentElement.dataset.area||'';
    return {area:manifest.groups.some(g=>g.id===area)?area:'',community:params.get('community'),file,node:params.get('node')||''};
  }
  function go(next) {
    const p=new URLSearchParams();for(const key of ['area','community','file','node'])if(next[key]!==undefined&&next[key]!==null&&next[key]!=='')p.set(key,next[key]);
    if(!next.area&&!next.file)p.set('area','all');
    const hash=p.toString();if(location.hash.slice(1)===hash){route=next;render();}else location.hash=hash;
  }
  async function fetchJSON(path) {const response=await fetch(new URL(path,base),{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('No se pudo cargar '+path);return response.json();}
  async function loadArea() {
    route=readRoute();const turn=++request;$('area').value=route.area;$('search').value='';shown=24;
    if(route.area&&(loaded!==route.area||!idx)){
      const requestedGroup=group();
      $('notice').textContent='Cargando el grafo original de esta área…';idx=null;map?.destroy();map=null;$('graph').replaceChildren();$('results').replaceChildren();
      try {
        const response=await fetch(new URL('data/'+requestedGroup.id+'.json.gz',base),{credentials:'omit'});
        if(!response.ok)throw Error('La descarga del grafo no está disponible.');
        const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        if(await S.digest(bytes)!==requestedGroup.sha256)throw Error('La huella del grafo no coincide con el manifiesto.');
        if(turn!==request)return;
        idx=M.index(JSON.parse(new TextDecoder().decode(bytes)));loaded=route.area;$('notice').textContent='';
      }catch(error){if(turn!==request)return;$('notice').textContent=error.message+' Recarga para reintentar.';$('detail').replaceChildren(el('h2','No se pudo cargar esta área'),el('p','Elige otra área o recarga. No se muestran datos anteriores como si fueran actuales.'));return;}
    }
    if(turn===request)render();
  }
  function crumbs() {
    const box=$('breadcrumbs');box.replaceChildren(button('Todo Jarvis',()=>go({})));
    const parts=[];if(group())parts.push([group().name,{area:route.area}]);
    if(route.community!==null&&route.community!==undefined&&idx?.communities.has(Number(route.community)))parts.push(['Grupo '+route.community,{area:route.area,community:route.community}]);
    if(route.file)parts.push([M.basename(route.file),{area:route.area,file:route.file}]);
    for(const [name,target]of parts){box.append(el('span','›'),button(name,()=>go(target)));}
    $('full').href=new URL('index.html'+location.hash,base).href;
  }
  function fileChoice(path,members) {const f=fileMeta(path);return {id:'file:'+path,path,paths:[path],kind:'file',title:M.basename(path),subtitle:path.split('/').slice(1,-1).join('/')||'Raíz del área',meta:counted(members.length)+' símbolos · '+(f?.lines||'?')+' líneas',open:()=>go({area:route.area,file:path})};}
  function symbolChoice(n) {return {id:n.id,path:M.original(n.source_file),paths:[M.original(n.source_file)],kind:'symbol',title:n.label,subtitle:M.basename(n.source_file)+' · línea '+M.line(n.source_location),meta:n._callable_class?'Clase':n._callable?'Función':'Símbolo del código',open:()=>go({area:route.area,file:M.original(n.source_file),node:n.id})};}
  function getChoices() {
    if(!route.area)return manifest.groups.map((g,i)=>({id:g.id,kind:'area',paths:manifest.files.filter(f=>f.group===g.id).map(f=>f.path),title:g.name,subtitle:purpose[g.id],meta:counted(g.nodes)+' piezas · '+counted(g.edges)+' conexiones',color:colors[i],open:()=>go({area:g.id})}));
    if(!idx)return [];
    const q=$('search').value.trim().toLowerCase();
    if(q){const files=[...idx.files].filter(([p])=>p.toLowerCase().includes(q)).map(([p,ns])=>fileChoice(p,ns));const nodes=[...idx.nodes.values()].filter(n=>String(n.label).toLowerCase().includes(q)&&n.source_file).map(symbolChoice);return files.concat(nodes);}
    if(onlyChanges){return status.changes.filter(c=>c.file.startsWith(route.area+'/')).map(c=>({...fileChoice(c.file,idx.files.get(c.file)||[]),meta:stateText(c.file)}));}
    if(route.file){const members=idx.files.get(route.file)||[];const functions=members.filter(n=>n._callable||n._callable_class);return (functions.length?functions:members).slice().sort((a,b)=>M.line(a.source_location)-M.line(b.source_location)).map(symbolChoice);}
    if(route.community!==null&&route.community!==undefined){const members=idx.communities.get(Number(route.community))||[];const paths=[...new Set(members.map(n=>M.original(n.source_file)).filter(Boolean))];return paths.map(path=>fileChoice(path,idx.files.get(path)||[]));}
    return [...idx.communities].sort((a,b)=>b[1].length-a[1].length).map(([id,members])=>{const name=M.communityName(members);return {id:'community:'+id,paths:name.paths,kind:'community',title:name.title,subtitle:name.subtitle,meta:name.source+' · '+counted(members.length)+' piezas · '+name.paths.length+' archivos · grupo '+id,open:()=>go({area:route.area,community:String(id)})};});
  }
  function drawMap() {
    map?.destroy();map=null;$('graph').replaceChildren();
    if(!choices.length){$('graph').append(el('p',onlyChanges&&!status.fresh?'Sin reporte reciente; no se puede confirmar si hay cambios.':'No hay piezas para esta búsqueda o vista.','empty-map'));$('map-count').textContent='0 piezas';return;}
    const mobile=innerWidth<=720,columns=mobile?2:3;
    const visible=choices.slice(0,mobile?6:12), ids=new Set(visible.map(c=>c.id)), byId=new Map(visible.map(c=>[c.id,c]));
    let edges=[];
    if(route.area&&idx){
      const kind=visible[0].kind;
      if(kind==='community')edges=M.aggregate(idx,n=>'community:'+n.community);
      else if(kind==='file')edges=M.aggregate(idx,n=>'file:'+M.original(n.source_file));
      else edges=idx.edges.map(e=>({from:e.source,to:e.target,count:1,relation:e.relation}));
    }
    edges=edges.filter(e=>ids.has(e.from)&&ids.has(e.to));
    const nodes=visible.map((c,i)=>{
      const title=el('div',c.title+' · '+c.subtitle+' · '+c.meta);
      const short=s=>String(s).length>28?String(s).slice(0,26)+'…':String(s);
      return {id:c.id,label:short(c.title)+'\n'+short(c.kind==='area'?counted(manifest.groups.find(g=>g.id===c.id).nodes)+' piezas':c.subtitle),title,shape:'box',margin:13,widthConstraint:{minimum:mobile?140:170,maximum:mobile?150:190},heightConstraint:{minimum:52},color:{background:color(c),border:'#b6c8da',highlight:{background:'#f6d49c',border:'#fff'}},font:{color:'#081321',size:14,face:'system-ui'},x:(i%columns)*(mobile?210:245),y:Math.floor(i/columns)*(mobile?120:145)};
    });
    map=new vis.Network($('graph'),{nodes,edges:edges.map((e,i)=>({id:i,from:e.from,to:e.to,arrows:'to',color:{color:'#97acc6',opacity:.45},width:Math.min(1+Math.log2(e.count),4),title:el('div',e.relation?(relations[e.relation]||e.relation):e.count+' relaciones nativas agregadas'),smooth:{type:'curvedCW',roundness:.1}}))},{physics:false,interaction:{hover:true,tooltipDelay:150},layout:{improvedLayout:false},edges:{font:{size:11}}});
    map.on('click',event=>{if(event.nodes.length)byId.get(event.nodes[0])?.open();else if(event.edges.length)showEdge(edges[event.edges[0]]);});
    map.fit({animation:false,padding:25});
    if(route.node&&ids.has(route.node))map.selectNodes([route.node]);
    $('map-count').textContent=visible.length+' de '+choices.length+' piezas dibujadas · '+edges.length+' conexiones visibles. Todas las piezas están en la lista.';
  }
  function listChoices() {
    $('results').replaceChildren();$('result-count').textContent=counted(choices.length)+' resultados';
    for(const c of choices.slice(0,shown)){
      const b=button('',c.open);b.dataset.item=c.id;b.append(el('strong',c.title),el('small',c.subtitle),el('small',c.meta,'result-meta'));
      if(c.paths?.some(p=>changes.has(p)))b.append(el('small','● '+(c.paths.some(p=>changes.get(p)?.status==='deleted')?'Incluye archivo eliminado':'Cambió después del corte'),'amber'));
      $('results').append(b);
    }
    $('more').hidden=shown>=choices.length;
  }
  function render() {
    crumbs();const g=group();$('heading').textContent=g?g.name:'Jarvis, por dentro';$('purpose').textContent=g?purpose[g.id]:'Ocho áreas. Entra a un grupo, elige un archivo y consulta sus funciones y su código.';
    $('native').hidden=$('download').hidden=!g;
    if(g){$('native').href=new URL('data/'+g.id+'-original.html',base);$('download').href=new URL('data/'+g.id+'.json.gz',base);}
    $('map-title').textContent=route.file?'Funciones y símbolos de '+M.basename(route.file):route.community!==null&&route.community!==undefined?'Archivos del grupo '+route.community:g?'Grupos del código':'Áreas de Jarvis';
    if(onlyChanges)$('map-title').textContent='Archivos con cambios posteriores';
    if($('search').value)$('map-title').textContent='Resultados en '+(g?.name||'Jarvis');
    choices=getChoices();drawMap();listChoices();showDetail();
  }
  function detailStart(title,subtitle) {const box=$('detail');box.replaceChildren(el('p','PIEZA SELECCIONADA','eyebrow'),el('h2',title));if(subtitle)box.append(el('p',subtitle,'path'));return box;}
  function reference(path,node) {return path+(node?' · '+node.label+' · L'+M.line(node.source_location):'')+' · corte '+manifest.observed_at;}
  function showDetail() {
    const g=group();
    if(!g){const b=detailStart('¿Qué quieres entender?');b.append(el('p','Cada tarjeta representa un área de Jarvis. Sus cifras provienen del corte original de Graphify.'),el('h3','Un recorrido útil'),button('Voz y extensiones de YOD →',()=>go({area:'06_yod'}),'action primary'),button('Memoria y Obsidian →',()=>go({area:'07_memoria'}),'action'),button('Mundo y tablero →',()=>go({area:'08_mundo'}),'action'));return;}
    if(route.file){showFile();return;}
    if(route.community!==null&&route.community!==undefined){
      const members=idx?.communities.get(Number(route.community));
      if(!members){detailStart('Grupo no disponible','Vuelve al área para elegir un grupo del corte.');return;}
      const name=M.communityName(members),b=detailStart(name.title,name.subtitle);
      b.append(el('span',members.length+' piezas','badge'),el('span',name.paths.length+' archivos','badge'),el('p','Graphify agrupó estos símbolos por sus conexiones. El nombre corresponde al archivo dominante y a una función o clase del grupo.'),el('h3','Abrir un archivo'));
      const list=el('div',undefined,'detail-list');for(const path of name.paths.slice(0,20))list.append(button(M.basename(path),()=>go({area:route.area,file:path,community:route.community})));b.append(list);return;
    }
    const b=detailStart(g.name,purpose[g.id]);b.append(el('span',counted(g.nodes)+' nodos','badge'),el('span',counted(g.edges)+' relaciones','badge'),el('p','Abre un grupo del mapa o de la lista para ver los archivos que lo forman. La búsqueda encuentra archivos y símbolos de toda esta área.'),el('h3','Cómo leer las flechas'),el('p','La punta indica el destino. Al abrir una función verás qué llama y quién la utiliza. La ausencia de una línea no demuestra que dos piezas sean independientes: la resolución entre lotes es parcial.'));
  }
  function showFile() {
    const path=route.file,f=fileMeta(path),candidate=idx?.nodes.get(route.node),node=candidate&&M.original(candidate.source_file)===path?candidate:null,members=idx?.files.get(path)||[],b=detailStart(node?.label||M.basename(path),path);
    b.append(el('span',stateText(path),'badge'),el('span',f?f.lines+' líneas':'Fuera del corte','badge'));
    if(!f){b.append(el('p','Este archivo no está en el corte publicado. Si es nuevo, debe incorporarse en la siguiente regeneración.'));return;}
    if(node)b.append(el('p','Línea '+M.line(node.source_location)+' del archivo original.'));
    b.append(button(node?'Ver código · línea '+M.line(node.source_location):'Ver código del archivo',()=>openCode(f,node),'action primary'),button('Copiar referencia',()=>copy(reference(path,node)),'action'));
    const sha=el('details');sha.append(el('summary','Huella del corte'),el('p',f.sha256,'path'));b.append(sha);
    if(!node){b.append(el('p',members.length+' nodos nativos en este archivo. Elige una función de la lista para consultar su línea y relaciones.'));showFileRelations(b,path);}
    else {b.append(button('Volver a todas las funciones',()=>go({area:route.area,file:path}),'action'));showNodeRelations(b,node);}
  }
  function relationList(box,title,entries,format,open) {
    box.append(el('h3',title+' · '+entries.length));
    if(!entries.length){box.append(el('p','No hay relaciones resueltas de este tipo en el corte.'));return;}
    const list=el('div',undefined,'detail-list');let limit=0;
    const more=button('Ver más conexiones',()=>append());
    function append(){for(const entry of entries.slice(limit,limit+15))list.append(button(format(entry),()=>open(entry)));limit+=15;more.hidden=limit>=entries.length;}
    append();box.append(list,more);
  }
  function showFileRelations(box,path) {
    const edges=M.aggregate(idx,n=>M.original(n.source_file));
    relationList(box,'Este archivo se relaciona con',edges.filter(e=>e.from===path),e=>M.basename(e.to)+' · '+e.count+' conexiones',e=>go({area:route.area,file:e.to}));
    relationList(box,'Archivos que apuntan aquí',edges.filter(e=>e.to===path),e=>M.basename(e.from)+' · '+e.count+' conexiones',e=>go({area:route.area,file:e.from}));
  }
  function showNodeRelations(box,node) {
    for(const [key,title,endpoint]of [['outgoing','Desde esta función','target'],['incoming','Hacia esta función','source']])relationList(box,title,idx[key].get(node.id)||[],e=>(relations[e.relation]||e.relation||'relación')+' · '+idx.nodes.get(e[endpoint]).label,e=>{const n=idx.nodes.get(e[endpoint]);go({area:route.area,file:M.original(n.source_file),node:n.id});});
  }
  function showEdge(edge) {
    const b=detailStart('Conexión del código');
    const a=choices.find(c=>c.id===edge.from),z=choices.find(c=>c.id===edge.to);
    b.append(el('p',(a?.title||edge.from)+' → '+(z?.title||edge.to)),el('p',edge.relation?(relations[edge.relation]||edge.relation):edge.count+' relaciones nativas entre estas piezas.'));
    if(a)b.append(button('Abrir origen: '+a.title,a.open,'action'));if(z)b.append(button('Abrir destino: '+z.title,z.open,'action'));
  }
  async function copy(value) {try{await navigator.clipboard.writeText(value);$('notice').textContent='Referencia copiada.';}catch{$('notice').textContent='Referencia: '+value;}}
  function codeHelp(message) {$('code-status').textContent=message;$('code').replaceChildren(el('span','Elige el archivo original o conecta su carpeta. El contenido se lee aquí, sin subirlo a internet.','help'));}
  function showCode(result,target) {
    if(result?.error){codeHelp(result.error);return;}
    if(!result){codeHelp('El archivo todavía no está conectado.');return;}
    $('code-status').textContent=result.matches?'Huella verificada: este es el código exacto del corte.':'Archivo diferente al corte. Estás leyendo su versión local actual; las líneas del grafo pueden haber cambiado.';
    $('code-status').className=result.matches?'':'amber';
    const line=M.line(target.node?.source_location),lines=result.text.split('\n');
    // Render a bounded window, while letting the user explicitly reveal the whole text.
    if(line>lines.length)$('code-status').textContent+=' La línea del grafo ya no existe en este archivo; se muestra el final.';
    function paint(all=false){const focus=Math.min(line,lines.length),start=all?0:Math.max(0,focus-41),end=all?lines.length:Math.min(lines.length,focus+80),fragment=document.createDocumentFragment();
      if(!all&&(start>0||end<lines.length))fragment.append(button('Mostrar el archivo completo ('+lines.length+' líneas)',()=>paint(true),'help'));
      for(let i=start;i<end;i++){const span=el('span',lines[i]||' ','code-line'+(i+1===line?' target':''));span.dataset.line=String(i+1);fragment.append(span);}
      $('code').replaceChildren(fragment);$('code').querySelector('.target')?.scrollIntoView({block:'center'});
    }
    paint();
  }
  async function openCode(file,node) {
    codeTarget={file,node};const turn=++codeRequest;$('code-title').textContent=M.basename(file.path)+(node?' · '+node.label:'');codeHelp('Buscando en los archivos que conectaste…');$('code-dialog').showModal();
    try{const result=await S.read(file);if(turn===codeRequest&&$('code-dialog').open)showCode(result,codeTarget);}catch(error){if(turn===codeRequest)codeHelp(error.message);}
  }
  async function checkStatus() {
    try{const r=await fetch(STATUS+'?t='+Math.floor(Date.now()/60000),{credentials:'omit',cache:'no-store'});if(!r.ok)throw Error();status=M.statusInfo(await r.json(),manifest.observed_at);}
    catch{status=M.statusInfo(null,manifest.observed_at);}
    changes=new Map(status.changes.map(c=>[c.file,c]));$('status').textContent=status.text;$('status').className=status.fresh?(changes.size?'changed':'fresh'):'';
    if(idx||!route.area)render();
  }
  try {
    manifest=await fetchJSON('manifest.json');
    $('cut').textContent='CORTE · '+new Date(manifest.observed_at).toLocaleString('es-MX')+'\n'+counted(manifest.files.filter(f=>!f.html_source).length)+' archivos · '+counted(manifest.nodes)+' nodos · '+counted(manifest.edges)+' conexiones';
    $('coverage').textContent=manifest.coverage;
    for(const g of manifest.groups){const o=el('option',g.name);o.value=g.id;$('area').append(o);}
    $('area').onchange=()=>{onlyChanges=false;$('changes').setAttribute('aria-pressed','false');go({area:$('area').value});};
    $('changes').onclick=()=>{onlyChanges=!onlyChanges;$('changes').setAttribute('aria-pressed',String(onlyChanges));shown=24;if(!route.area&&onlyChanges){$('notice').textContent='Elige un área para ver sus archivos modificados.';}render();};
    let debounce;$('search').oninput=()=>{clearTimeout(debounce);debounce=setTimeout(()=>{shown=24;render();},180);};
    $('more').onclick=()=>{shown+=24;listChoices();};$('fit').onclick=()=>map?.fit({animation:{duration:250}});
    $('connect').onclick=async()=>{try{const name=await S.connect();$('notice').textContent='Carpeta conectada: '+name+'. Abre una función y pulsa Ver código.';$('connect').textContent='Cambiar carpeta de código';}catch(error){if(error.name!=='AbortError')$('notice').textContent=error.message;}};
    $('close-code').onclick=()=>$('code-dialog').close();$('code-dialog').onclose=()=>{codeRequest++;$('code').replaceChildren();};
    $('pick-code').onclick=async()=>{const target=codeTarget,turn=++codeRequest;const result=await S.pick(target.file);if(result&&turn===codeRequest&&$('code-dialog').open)showCode(result,target);};
    $('copy-reference').onclick=()=>copy(reference(codeTarget.file.path,codeTarget.node));
    let resize;window.addEventListener('resize',()=>{clearTimeout(resize);resize=setTimeout(()=>{if(idx||!route.area)drawMap();},150);});
    window.addEventListener('hashchange',loadArea);await loadArea();await checkStatus();setInterval(checkStatus,60000);
  }catch(error){$('notice').textContent='No se pudo abrir el visor: '+error.message+'. Recarga para reintentar.';}
})();
