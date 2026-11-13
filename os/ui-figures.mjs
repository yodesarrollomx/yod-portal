// Existing Hairline engines, unmodified. Pointer coordinates belong to the whole control.
import {hub,drawer,terrain,branches,turntable,lockers,vault,stack,plot,sieve,elevator,format,loupe,exploded} from '../despacho3d/vendor/hairline/src/index.ts';
const engines={home:hub,office:drawer,plan:terrain,route:branches,buildings:turntable,tasks:lockers,wallet:vault,chair:stack,present:plot,funnel:sieve,tower:elevator,people:hub,edit:format,search:loupe,grid:exploded};
const entries=new Map();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const allowed=owner=>!owner.closest('[aria-disabled="true"],:disabled,.nav-item-off,.yod-nav-off')&&!document.hidden;
export function mount(host,key,owner){
 if(entries.has(host)||!host.isConnected)return;
 const figure=(engines[key]||exploded)(host,{theme:host.closest('.sidebar,.yod-sidebar')?'dark':'light',play:false,intensity:.65,label:''});
 host.removeAttribute('tabindex');host.removeAttribute('role');host.removeAttribute('aria-label');host.querySelectorAll('[data-hairline-live]').forEach(n=>n.remove());
 function leave(){host.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));}
 function point(x,y){
  if(reduced.matches||!allowed(owner))return;
  const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
  host.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:r.left+r.width*x,clientY:r.top+r.height*y}));
 }
 function move(e){const r=owner.getBoundingClientRect();point(.25+Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*.5,.25+Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*.5);}
 function focus(){point(.52,.44);}
 owner.addEventListener('pointerenter',move);owner.addEventListener('pointermove',move);owner.addEventListener('pointerleave',leave);owner.addEventListener('focusin',focus);owner.addEventListener('focusout',leave);
 entries.set(host,{leave,destroy(){leave();figure.destroy();owner.removeEventListener('pointerenter',move);owner.removeEventListener('pointermove',move);owner.removeEventListener('pointerleave',leave);owner.removeEventListener('focusin',focus);owner.removeEventListener('focusout',leave);}});
}
// Removed catalog rows must release the shared engine's observers and frame registration.
const observer=new MutationObserver(()=>{for(const [host,item] of entries)if(!host.isConnected){item.destroy();entries.delete(host);}});
observer.observe(document.body,{childList:true,subtree:true});
function rest(){for(const item of entries.values())item.leave();}
reduced.addEventListener('change',rest);document.addEventListener('visibilitychange',()=>{if(document.hidden)rest();});
window.addEventListener('pagehide',rest);
