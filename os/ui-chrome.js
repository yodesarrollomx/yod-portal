/* YOD OS visual language. No identity, routing or business requests. */
(function(){
 'use strict';
 if(window.YodChrome)return;
 var source=document.currentScript&&document.currentScript.src;
 var base=new URL('.',source||location.href),pref='yod_os_sidebar_v1',installed=new WeakSet();
 var shapes={
 home:'<path d="m4 11 8-7 8 7v10H4Z"/><path class="ui-detail" d="M9 21v-8h6v8"/>',
 office:'<path d="m3 8 9-5 9 5v10l-9 5-9-5Z"/><path class="ui-detail" d="m3 8 9 5 9-5M12 13v10"/>',
 plan:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/><path class="ui-detail" d="m5 13 5-4 5 5 4-3"/>',
 route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path class="ui-detail" d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h7"/>',
 buildings:'<path d="M3 21V9l6-4 6 4v12M15 12l6-3v12M2 21h20"/><path class="ui-detail" d="M6 11h3m-3 4h3m0 6v-3m9-4h1m-1 4h1"/>',
 tasks:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 3h6v3H9Z"/><path class="ui-detail" d="m7 11 2 2 3-4m2 3h3m-10 5h10"/>',
 wallet:'<path d="M4 7V5l14-2v4M4 7h16v14H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><path class="ui-detail" d="M20 11h-6v6h6m-3-3h.1"/>',
 chair:'<path d="M5 12V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6M5 19v3m14-3v3"/><path class="ui-detail" d="M3 11h3v5h12v-5h3v9H3Z"/>',
 present:'<path d="M3 3h18v14H3Zm9 14v5m-5 0h10"/><path class="ui-detail" d="m6 12 4-4 4 3 4-5"/>',
 funnel:'<path d="M3 4h18l-7 9v7l-4 2v-9Z"/><path class="ui-detail" d="M6 7h12"/>',
 tower:'<path d="M6 21V3h12v18M3 21h18"/><path class="ui-detail" d="M9 7h6m-6 4h6m-6 4h6m-3 6v-3"/>',
 people:'<circle cx="9" cy="7" r="3"/><path class="ui-detail" d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3"/>',
 edit:'<path d="M4 3h12v6M4 3v18h16v-8"/><path class="ui-detail" d="m10 16 1-4 8-8 3 3-8 8Z"/>',
 search:'<circle cx="10" cy="10" r="6"/><path class="ui-detail" d="m15 15 6 6"/>',
 grid:'<path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Z"/><path class="ui-detail" d="M14 14h7v7h-7Z"/>'
 };
 var ids={'SYS-DESPACHO':'office','SYS-POTENCIALES':'plan','SYS-TRACK':'route','SYS-MIRAMAR':'buildings','SYS-TAREAS':'tasks','SYS-FLUJO':'wallet','SYS-INTERIORES':'chair','SYS-INVERSION':'present','SYS-MARKETING':'funnel','SYS-OBRA':'tower','SYS-CONTROL':'grid'};
 var icons={'home-2':'home','layout-dashboard':'home','layout-grid':'office','map-2':'plan','route':'route','building-community':'buildings','checklist':'tasks','wallet':'wallet','armchair-2':'chair','presentation-analytics':'present','speakerphone':'funnel','chart-funnel':'funnel','filter':'funnel','building-skyscraper':'tower','users':'people','photo-edit':'edit','search':'search'};
 function svg(key){var e=document.createElementNS('http://www.w3.org/2000/svg','svg');e.setAttribute('viewBox','0 0 24 24');e.setAttribute('class','ui-glyph');e.setAttribute('aria-hidden','true');e.setAttribute('focusable','false');e.innerHTML=shapes[key]||shapes.grid;return e;}
 function decorate(root){
  root.querySelectorAll('.nav-item,.yod-nav-item,.module-icon,.pulse-icon,.quick-card,.emb-ico,.search-trigger,.yod-search').forEach(function(n){
   var old=n.querySelector('i.ti');if(!old||old.classList.contains('ui-icon-original'))return;
   var cls=Array.from(old.classList).find(function(c){return c.indexOf('ti-')===0;}),id=n.dataset.systemId||(n.closest('[data-system-id]')||{}).dataset?.systemId;
   var key=ids[id]||icons[(cls||'').slice(3)];if(!key)return;
   old.classList.add('ui-icon-original');old.setAttribute('aria-hidden','true');old.before(svg(key));n.classList.add('ui-icon-target');
   if(n.matches('.nav-item,.yod-nav-item')){
    var label=n.querySelector('span');if(label)n.setAttribute('aria-label',label.textContent.trim());
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
 var observer=new MutationObserver(function(records){if(!scheduled&&records.some(function(r){return Array.from(r.addedNodes).some(function(n){return n.nodeType===1&&!n.matches('.ui-glyph,.ui-nav-tip')&&!n.closest('svg');});})){scheduled=true;queueMicrotask(scan);}});
 function start(){scan();observer.observe(document.body,{childList:true,subtree:true});}
 window.YodChrome={refresh:scan};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
