// Only local, known surfaces are inspected. References never read business attributes or text.
export const UI_SURFACES=Object.freeze(['office','areas','help','agent','chat','tasks','evidence','sources','browser','ppp','knowledge','library','activity','goals','permissions','visits','environment','circle','residents','profile','voice','terminal']);
const ROOTS='body > dialog,body > header,#areas,#help,#panel,#office-accessible,#resident-agent,.dossier-overlay,.workspace-dialog,.voice-workspace,.library-dialog,.agent-menu,.circulo-hoja,.entorno-hoja';
const CARDS='article,details,.workspace-card,.dossier-record,.dossier-section,.durable-goal,.durable-review,.goal-prepared,.knowledge-card,.knowledge-comparison,.circulo-tarjeta,.circulo-version,.entorno-espacio,[data-permissions-status],.entorno-respaldo,.entorno-entregas-lista li,[data-permission-space],.entorno-bitacora li,.workspace-activity li,.term-line,.voice-task,[data-place-card]';
const ZONES=new Set(['editing','editorial','funnel','entry','reception','patio','potential','case','projects','delivery','decisions','lounge']);
const MENU={pendientes:'goals',ppp:'ppp',historial:'activity',moac:'tasks',documentos:'sources',conversaciones:'chat'};
const visible=n=>n?.isConnected&&!n.closest('[hidden],[inert]')&&n.getClientRects().length>0&&getComputedStyle(n).visibility!=='hidden';

export function structuralPath(node){
  const parts=[];
  for(let n=node;n&&n.nodeType===1;n=n.parentElement){
    const tag=n.localName;
    // Custom tags may encode private identifiers: fail closed instead of serializing them.
    if(!/^[a-z][a-z0-9]*$/.test(tag))return null;
    let index=1;
    for(let p=n.previousElementSibling;p;p=p.previousElementSibling)if(p.localName===tag)index++;
    if(index>9999)return null;
    parts.unshift(`${tag}:nth-of-type(${index})`);
  }
  const path=parts.join(' > ');
  return path.length<=600?path:null;
}

export function surfaceOf(node){
  if(node.closest('[data-permissions-status],.entorno-permisos'))return 'permissions';
  if(node.closest('.entorno-respaldo,.entorno-bitacora'))return 'visits';
  if(node.closest('.durable-evidence,details'))return 'evidence';
  if(node.closest('.knowledge-board'))return 'knowledge';
  if(node.closest('.terminal-puesto,.xterm,.terminal-screen'))return 'terminal';
  if(node.closest('.durable-goals,.durable-goal'))return 'goals';
  const panel=node.closest('.agent-workspace [data-panel]');
  if(panel){const value=panel.dataset.panel;if(['browser','ppp','tasks','sources','knowledge'].includes(value))return value;}
  if(node.closest('.library-dialog'))return 'library';
  if(node.closest('.realtime-dialog,.voice-workspace'))return 'voice';
  const menu=node.closest('.agent-menu');
  if(menu)return MENU[menu.querySelector('[data-menu-focus][aria-pressed="true"]')?.dataset.menuFocus]||'agent';
  if(node.closest('.dossier-overlay')){
    if(node.closest('.phone-chat,.case-message'))return 'chat';
    if(node.closest('.term'))return 'activity';
    if(node.closest('.dossier-section'))return 'sources';
    return 'agent';
  }
  if(node.closest('.entorno-hoja'))return 'environment';
  if(node.closest('.circulo-hoja'))return 'circle';
  if(node.closest('#resident-agent'))return 'residents';
  if(node.closest('#areas'))return 'areas';
  if(node.closest('#help'))return 'help';
  if(node.closest('.workspace-dialog,body > dialog'))return 'agent';
  return 'office';
}

export function mountChincheUI({send,onSelecting,onSceneStart,bar}){
  let ready=false,selecting=false,selectionRoot=null,highlight=null,highlightFrame=null,swallowUntil=0,swallowKey=null;
  const toolbars=new WeakMap(),panelZones=new WeakMap(),buttonActions=new WeakMap();
  const frameBindings=new Map(),frameShields=new Map(),loadedFrames=new WeakSet();
  const outline=document.createElement('div');outline.className='chinche-ui-outline';outline.hidden=true;outline.setAttribute('aria-hidden','true');
  const hint=document.createElement('div');hint.className='chinche-ui-hint';hint.hidden=true;
  hint.setAttribute('role','status');
  const hintText=document.createElement('span');hintText.textContent='Selecciona el control exacto. Tab para recorrer; Enter para señalar; Escape para cancelar.';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar señalamiento';cancel.dataset.chincheUi='cancel';
  hint.append(hintText,cancel);cancel.onclick=stop;
  buttonActions.set(cancel,stop);
  function hostFor(root){return root?.closest('dialog,.dossier-overlay,.sheet')||document.body;}
  function zoneOf(node){
    const place=node.closest('[data-place-card]')?.dataset.placeCard;
    if(ZONES.has(place))return place;
    if(node.closest('#panel'))return panelZones.get(document.getElementById('panel'))||'entry';
    return surfaceOf(node)==='office'||['areas','help'].includes(surfaceOf(node))?'entry':'case';
  }
  function itemOf(node,root){
    const card=node.closest(CARDS);
    if(!card||!root.contains(card))return null;
    const cards=[...root.querySelectorAll(CARDS)].filter(visible),index=cards.indexOf(card);
    return index>=0&&index<=9999?index:null;
  }
  function request(node,root){
    if(!ready||!visible(node)||!root.contains(node))return false;
    const path=structuralPath(node);if(!path)return false;
    hostFor(root).append(bar);bar.inert=false;
    return send(zoneOf(node),{surface:surfaceOf(node),path,item:itemOf(node,root)});
  }
  function paint(node){
    if(!visible(node)||node.closest('[data-chinche-ui],.chinche-ui-hint')){outline.hidden=true;return;}
    highlight=node;highlightFrame=null;const r=node.getBoundingClientRect();
    Object.assign(outline.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});outline.hidden=false;
  }
  function stop(){
    const was=selecting;selecting=false;selectionRoot=null;highlight=null;highlightFrame=null;outline.hidden=true;hint.hidden=true;
    document.querySelectorAll('[data-chinche-ui="select"]').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(was)onSelecting(false);
    frameShields.forEach(shield=>shield.remove());frameShields.clear();
  }
  function start(root,button){
    if(!ready)return false;
    if(selecting){stop();return;}
    onSelecting(true);selecting=true;selectionRoot=root;
    hintText.textContent='Selecciona el control exacto. Tab para recorrer; Enter para señalar; Escape para cancelar.';
    hostFor(root).append(hint,outline);hint.hidden=false;button.setAttribute('aria-pressed','true');
    syncFrames();
  }
  function makeButton(label,kind,action){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.chincheUi=kind;
    b.className='chinche-ui-button';b.disabled=!ready;
    buttonActions.set(b,action);
    b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();action(b);},true);
    // Parent card handlers may listen to pointer/mouse events as well as clicks.
    for(const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','keydown','keyup'])b.addEventListener(type,e=>e.stopPropagation());
    return b;
  }
  function scan(){
    if(selecting&&(!visible(selectionRoot)||!selectionRoot.contains(hint)&&hostFor(selectionRoot)!==hint.parentElement))stop();
    document.querySelectorAll(ROOTS).forEach(root=>{
      // A nested workspace shares its enclosing surface's selector.
      if(root.parentElement?.closest(ROOTS))return;
      let toolbar=toolbars.get(root);
      if(!toolbar||!root.contains(toolbar)){
        toolbar=document.createElement('div');toolbar.className='chinche-ui-tools';toolbar.dataset.chincheUi='tools';
        const b=makeButton('Señalar control con chinche','select',button=>start(root.matches('body > header')?document.body:root,button));b.setAttribute('aria-pressed','false');
        toolbar.append(b);root.append(toolbar);toolbars.set(root,toolbar);
      }

    });
    syncFrames();
  }
  function block(e){e.preventDefault();e.stopImmediatePropagation();}
  function detachFrame(binding){binding?.forEach(([win,type,fn])=>{try{win.removeEventListener(type,fn,true);}catch{}});}
  function frameDocument(frame){try{return frame.contentWindow.document;}catch{return null;}}
  function frameTarget(frame,e){
    const doc=frameDocument(frame),r=frame.getBoundingClientRect();
    if(!doc)return null;
    return doc.elementFromPoint((e.clientX-r.left)*frame.offsetWidth/r.width-frame.clientLeft,(e.clientY-r.top)*frame.offsetHeight/r.height-frame.clientTop);
  }
  function chooseFrame(frame,node){
    if(!ready||!selecting||!visible(frame))return;
    const outer=structuralPath(frame),inner=node?structuralPath(node):null;
    // The repeated html segment is a same-origin iframe boundary, never a selector to execute.
    const path=outer&&(inner?outer+' > '+inner:outer);
    if(!path||path.length>600){hintText.textContent='La ruta de este control es demasiado larga. Señala el marco del PPP.';return;}
    hostFor(selectionRoot).append(bar);bar.inert=false;
    send(zoneOf(frame),{surface:'ppp',path,item:itemOf(frame,selectionRoot)});stop();
  }
  function paintFrame(frame,node){
    if(!node){paint(frame);return;}
    const outer=frame.getBoundingClientRect(),inner=node.getBoundingClientRect(),scaleX=outer.width/frame.offsetWidth,scaleY=outer.height/frame.offsetHeight;
    highlight=node;highlightFrame=frame;
    Object.assign(outline.style,{left:outer.left+(frame.clientLeft+inner.left)*scaleX+'px',top:outer.top+(frame.clientTop+inner.top)*scaleY+'px',width:inner.width*scaleX+'px',height:inner.height*scaleY+'px'});outline.hidden=false;
  }
  function syncFrames(){
    const frames=[...document.querySelectorAll('.workspace-board iframe')];
    for(const [frame,binding]of frameBindings)if(!frames.includes(frame)){
      detachFrame(binding);frameBindings.delete(frame);
    }
    for(const frame of frames){
      const doc=frameDocument(frame);
      if(doc&&!frameBindings.has(frame)){
        const win=frame.contentWindow,list=[];
        for(const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click','keydown','keyup','focusin']){
          const fn=e=>{
            if(type==='focusin'){if(selecting)paintFrame(frame,e.target);return;}
            if(type==='keyup'&&e.key===swallowKey){block(e);swallowKey=null;return;}
            if(!selecting){if(Date.now()<swallowUntil)block(e);return;}
            if(!selectionRoot.contains(frame))return;
            if(type==='keydown'&&e.key==='Tab')return;
            block(e);
            if(type==='keydown'&&e.key==='Escape'){stop();return;}
            if(type==='pointerdown'||type==='click'||type==='keydown'&&['Enter',' '].includes(e.key)){
              swallowUntil=Date.now()+700;if(type==='keydown')swallowKey=e.key;chooseFrame(frame,e.target);
            }
          };
          win.addEventListener(type,fn,{capture:true,passive:false});list.push([win,type,fn]);
        }
        frameBindings.set(frame,list);
      }
      if(!loadedFrames.has(frame)){
        loadedFrames.add(frame);frame.addEventListener('load',()=>{
          const binding=frameBindings.get(frame);detachFrame(binding);frameBindings.delete(frame);syncFrames();
        });
      }
      if(!selecting||!selectionRoot.contains(frame)||!visible(frame))continue;
      const crossNotice='El PPP está en otro origen. La chinche señalará el marco; sus controles internos no se pueden leer aquí.';
      if(!doc&&hintText.textContent!==crossNotice)hintText.textContent=crossNotice;
      let shield=frameShields.get(frame);
      if(!shield){shield=document.createElement('div');shield.className='chinche-iframe-shield';shield.setAttribute('aria-hidden','true');hostFor(selectionRoot).append(shield);frameShields.set(frame,shield);}
      const r=frame.getBoundingClientRect();Object.assign(shield.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
    }
    for(const [frame,shield]of frameShields)if(!selecting||!visible(frame)||!frames.includes(frame)){shield.remove();frameShields.delete(frame);}
  }
  function choose(e,node){
    block(e);if(!selectionRoot||node.closest('[data-chinche-ui],.chinche-ui-hint'))return;
    request(node,selectionRoot);stop();
  }
  // Window capture runs before native controls and application listeners, including React.
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click','dblclick','contextmenu']){
    window.addEventListener(type,e=>{
      const control=e.target instanceof Element?e.target.closest('[data-chinche-ui="card"],[data-chinche-ui="select"],[data-chinche-ui="cancel"]'):null;
      if(control&&buttonActions.has(control)){block(e);if(type==='click'&&!control.disabled)buttonActions.get(control)(control);return;}
      if(!selecting){if(Date.now()<swallowUntil&&!(e.target instanceof Element&&e.target.closest('[data-chinche-ui],.chinche-ui-hint,#pin-selection')))block(e);return;}
      const node=e.target instanceof Element?e.target:null;
      if(node?.classList.contains('chinche-iframe-shield')){
        block(e);const frame=[...frameShields].find(([,shield])=>shield===node)?.[0];
        if(frame&&(type==='pointerdown'||type==='click')){swallowUntil=Date.now()+700;chooseFrame(frame,frameTarget(frame,e));}return;
      }
      if(node?.closest('#scene')&&node.localName==='canvas'){stop();if(onSceneStart())return;}
      if(!node||node.closest('[data-chinche-ui],.chinche-ui-hint'))return;
      block(e);
      if(type==='pointerdown'||type==='click'){
        swallowUntil=Date.now()+700;choose(e,node);
      }
    },{capture:true,passive:false});
  }
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&selecting){block(e);stop();return;}
    const control=e.target instanceof Element?e.target.closest('[data-chinche-ui="card"],[data-chinche-ui="select"],[data-chinche-ui="cancel"]'):null;
    if(control&&buttonActions.has(control)&&e.key!=='Tab'){block(e);swallowKey=e.key;if(['Enter',' '].includes(e.key)&&!control.disabled)buttonActions.get(control)(control);return;}
    if(!selecting)return;
    if(e.key==='Escape'){block(e);stop();return;}
    if(e.key==='Tab')return;
    const node=e.target instanceof Element?e.target:null;
    if(node?.closest('[data-chinche-ui],.chinche-ui-hint'))return;
    block(e);
    if(node&&(e.key==='Enter'||e.key===' ')){swallowKey=e.key;choose(e,node);}
  },true);
  window.addEventListener('keyup',e=>{if(e.key===swallowKey){block(e);swallowKey=null;}else if(selecting&&e.key!=='Tab')block(e);},true);
  window.addEventListener('pointermove',e=>{if(selecting){block(e);const frame=[...frameShields].find(([,shield])=>shield===e.target)?.[0];if(frame)paintFrame(frame,frameTarget(frame,e));else paint(e.target);}},true);
  window.addEventListener('focusin',e=>{if(selecting)paint(e.target);},true);
  const repaint=()=>{if(selecting){syncFrames();if(highlightFrame)paintFrame(highlightFrame,highlight);else if(highlight)paint(highlight);}};
  window.addEventListener('scroll',repaint,true);
  window.addEventListener('resize',repaint);
  window.addEventListener('pagehide',()=>{stop();frameBindings.forEach(detachFrame);frameBindings.clear();});
  const observer=new MutationObserver(scan);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','inert','class']});scan();
  return {stop,startGlobal:()=>{const modal=[...document.querySelectorAll('dialog[open],.dossier-overlay,.sheet:not([hidden]),.entorno-hoja,.circulo-hoja')].filter(visible).at(-1);
    const root=modal||document.body;if(!ready)return false;start(root,root.querySelector('[data-chinche-ui="select"]')||document.createElement('button'));return true;
  },pinNode:node=>request(node,node.closest(ROOTS)||document.body),setPanelZone:zone=>{if(ZONES.has(zone))panelZones.set(document.getElementById('panel'),zone);},setReady:value=>{
    ready=value;if(!ready)stop();document.querySelectorAll('[data-chinche-ui="select"],[data-chinche-ui="card"]').forEach(b=>b.disabled=!ready);
  }};
}
