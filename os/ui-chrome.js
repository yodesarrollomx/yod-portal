/* YOD OS visual language. No identity, routing or business requests. */
(function(){
 'use strict';
 if(window.YodChrome)return;
 var source=document.currentScript&&document.currentScript.src;
 var base=new URL('.',source||location.href),pref='yod_os_sidebar_v1',installed=new WeakSet();
 var figures=import(new URL('ui-figures.bundle.mjs?v=20261030-fase0',base).href);
 figures.catch(function(){/* Existing accessible labels remain available if a visual asset fails. */});
 var ids={'SYS-DESPACHO':'office','SYS-POTENCIALES':'plan','SYS-TRACK':'route','SYS-MIRAMAR':'buildings','SYS-TAREAS':'tasks','SYS-FLUJO':'wallet','SYS-INTERIORES':'chair','SYS-INVERSION':'present','SYS-MARKETING':'funnel','SYS-OBRA':'tower','SYS-CONTROL':'grid'};
 var icons={'home-2':'home','layout-dashboard':'home','layout-grid':'office','map-2':'plan','route':'route','building-community':'buildings','checklist':'tasks','wallet':'wallet','armchair-2':'chair','presentation-analytics':'present','speakerphone':'funnel','chart-funnel':'funnel','filter':'funnel','building-skyscraper':'tower','users':'people','photo-edit':'edit','search':'search'};
 function svg(key,owner){var e=document.createElement('span');e.className='ui-glyph';e.dataset.figure=key;e.setAttribute('aria-hidden','true');figures.then(function(f){if(e.isConnected)f.mount(e,key,owner);}).catch(function(){owner.classList.add('ui-figure-fallback');});return e;}
 function decorate(root){
  root.querySelectorAll('.nav-item,.yod-nav-item,.module-icon,.pulse-icon,.quick-card,.emb-ico,.search-trigger,.yod-search').forEach(function(n){
   var old=n.querySelector('i.ti');if(!old||old.classList.contains('ui-icon-original'))return;
   var cls=Array.from(old.classList).find(function(c){return c.indexOf('ti-')===0;}),id=n.dataset.systemId||(n.closest('[data-system-id]')||{}).dataset?.systemId;
   var key=ids[id]||icons[(cls||'').slice(3)];if(!key)return;
   old.classList.add('ui-icon-original');old.setAttribute('aria-hidden','true');old.before(svg(key,n.closest('.module-card,.pulse-card,a,button')||n));n.classList.add('ui-icon-target');
   if(n.matches('.nav-item,.yod-nav-item')){
    var label=n.querySelector('span:not(.ui-glyph)');if(label)n.setAttribute('aria-label',label.textContent.trim());
   }
  });
 }
 function mount(shell){
  if(installed.has(shell))return;
  var shared=shell.classList.contains('yod-shell');if(!shared&&!shell.querySelector('#nav-modules,#preview-nav'))return;
  var side=shell.querySelector(shared?'.yod-sidebar':'.sidebar');if(!side)return;var brand=side.querySelector(shared?'.yod-brand':'.brand');if(!brand)return;
  installed.add(shell);shell.classList.add('yod-ui-chrome');
  var mobile=window.matchMedia('(max-width:900px)'),compact=false;try{compact=localStorage.getItem(pref)==='compact';}catch(e){}
  var header=document.createElement('div');header.className='ui-brand-row';brand.before(header);header.append(brand);
  var logo=document.createElement('img');logo.src=new URL('../marca/yod-oscuro.png',base).href;logo.alt='YoDesarrollo';logo.className='ui-brand-full';
  var mark=document.createElement('img');mark.src=new URL('../marca/yod-mono-oscuro.png',base).href;mark.alt='YoDesarrollo';mark.className='ui-brand-mark';brand.replaceChildren(logo,mark);
  var mobileBrand=shell.querySelector(shared?'.yod-topbrand':'.topbar-brand');if(mobileBrand){var mobileLogo=document.createElement('img');mobileLogo.src=new URL('../marca/yod-claro.png',base).href;mobileLogo.alt='YoDesarrollo';mobileLogo.className='ui-mobile-brand';mobileBrand.replaceChildren(mobileLogo);}
  side.id=shared?'yod-ui-sidebar':'os-ui-sidebar';var toggle=document.createElement('button');toggle.type='button';toggle.className='ui-sidebar-toggle';toggle.setAttribute('aria-controls',side.id);toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m7-12-3 4 3 4"/></svg>';header.append(toggle);
  var tip=document.createElement('div');tip.className='ui-nav-tip';tip.id=side.id+'-tip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);var owner=null;
  function hideTip(){tip.hidden=true;if(owner)owner.removeAttribute('aria-describedby');owner=null;}
  function update(){shell.classList.toggle('ui-compact',compact&&!mobile.matches);toggle.setAttribute('aria-expanded',String(mobile.matches||!compact));var title=mobile.matches?'Cerrar menú':compact?'Expandir barra lateral':'Contraer barra lateral';toggle.setAttribute('aria-label',title);toggle.title=title;hideTip();}
  toggle.addEventListener('click',function(){if(mobile.matches){var burger=document.getElementById(shared?'yodBurger':'menu-toggle');if(burger)burger.click();return;}compact=!compact;try{localStorage.setItem(pref,compact?'compact':'expanded');}catch(e){}update();window.dispatchEvent(new Event('resize'));});
  mobile.addEventListener('change',update);window.addEventListener('storage',function(e){if(e.key===pref){compact=e.newValue==='compact';update();}});
  function showTip(e){var n=e.target.closest('.nav-item,.yod-nav-item');if(!n||!shell.classList.contains('ui-compact'))return;hideTip();owner=n;tip.textContent=n.getAttribute('aria-label')||n.textContent.trim();tip.hidden=false;n.setAttribute('aria-describedby',tip.id);var r=n.getBoundingClientRect();tip.style.left=(r.right+12)+'px';tip.style.top=Math.max(8,Math.min(innerHeight-tip.offsetHeight-8,r.top+(r.height-tip.offsetHeight)/2))+'px';}
  side.addEventListener('pointerover',showTip);side.addEventListener('focusin',showTip);side.addEventListener('pointerleave',hideTip);side.addEventListener('focusout',hideTip);side.addEventListener('scroll',hideTip,true);window.addEventListener('resize',hideTip);document.addEventListener('keydown',function(e){if(e.key==='Escape')hideTip();});
  update();decorate(shell);
 }
 var scheduled=false;
 function scan(){scheduled=false;document.querySelectorAll('.app-shell,.yod-shell').forEach(function(s){mount(s);if(installed.has(s))decorate(s);});}
 var observer=new MutationObserver(function(records){if(!scheduled&&records.some(function(r){return Array.from(r.addedNodes).some(function(n){return n.nodeType===1&&!n.matches('.ui-glyph,.ui-nav-tip')&&!n.closest('svg,.ui-glyph');});})){scheduled=true;queueMicrotask(scan);}});
 function start(){scan();observer.observe(document.body,{childList:true,subtree:true});}
 window.YodChrome={refresh:scan};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
