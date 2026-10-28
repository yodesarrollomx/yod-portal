import {HL} from './vendor/hairline/kernel.mjs';
import {drawDocuments} from './document-drawing.mjs';
import {safeDocumentUrl} from './conversation.mjs?v=records2';

// Only a view of the caller's already-authorized documents. No storage or API calls.
export function mountDocumentTray({container,documents,doc=container.ownerDocument}) {
 const make=(tag,text,cls)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const root=make('section',undefined,'document-tray');root.setAttribute('aria-label','Documentos del expediente');
 const title=make('h2','Documentos del expediente'),note=make('p','Fuentes registradas. Su presencia no confirma que el autón las haya leído.','document-tray-note');root.append(title,note);container.replaceChildren(root);
 let drawing=null,page=0,selected=0,dead=false;
 if(!documents.length){root.append(make('p','No hay fuentes registradas para este proyecto.'));return {destroy:()=>root.remove()};}
 const layout=make('div',undefined,'document-tray-layout'),visual=make('div',undefined,'document-tray-visual'),stage=make('div',undefined,'document-tray-stage'),list=make('div',undefined,'document-tray-list');
 stage.dataset.hairline='documents';stage.dataset.hairlineTheme='light';stage.tabIndex=0;stage.setAttribute('role','group');stage.setAttribute('aria-label','Bandeja de documentos. Usa las flechas para seleccionar.');
 visual.append(stage,make('p','Pasa el cursor o toca una ficha. También puedes elegir por nombre.','document-tray-hint'));layout.append(visual,list);root.append(layout);
 const detail=make('section',undefined,'document-tray-detail'),name=make('h3'),role=make('p'),status=make('p','Versión y lectura: sin información en este registro.','document-tray-note'),link=make('a','Abrir documento ↗');link.target='_blank';link.rel='noopener noreferrer';
 detail.setAttribute('aria-live','polite');detail.append(name,role,status,link);root.append(detail);
 const nav=make('nav',undefined,'document-tray-pagination'),prev=make('button','← Anteriores'),range=make('span'),next=make('button','Siguientes →');nav.setAttribute('aria-label','Páginas de documentos');prev.type=next.type='button';nav.append(prev,range,next);root.append(nav);
 let buttons=[];
 function select(index,fromDrawing=false){
  if(dead||index<page*8||index>=Math.min(documents.length,page*8+8))return;
  selected=index;const item=documents[index];name.textContent=item.title||'Documento sin título';role.textContent=item.role||'Fuente registrada';
  const url=safeDocumentUrl(item.url);link.hidden=!url;if(url)link.href=url;else link.removeAttribute('href');
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(page*8+i===index)));
  if(!fromDrawing)drawing?.select(index-page*8);
 }
 function render(){
  drawing?.destroy();drawing=null;stage.replaceChildren();list.replaceChildren();
  const start=page*8,items=documents.slice(start,start+8);buttons=items.map((item,i)=>{const b=make('button',String(start+i+1).padStart(2,'0')+' · '+(item.title||'Documento sin título'));b.type='button';b.addEventListener('click',()=>select(start+i));list.append(b);return b;});
  HL.inject(doc);const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 400 320');svg.setAttribute('aria-hidden','true');stage.append(svg);
  drawing=drawDocuments({stage,svg,count:items.length,onSelect:i=>select(start+i,true)});
  prev.disabled=page===0;next.disabled=start+8>=documents.length;nav.hidden=documents.length<=8;range.textContent=`${start+1}–${start+items.length} de ${documents.length}`;select(start);
 }
 const key=e=>{const delta=['ArrowRight','ArrowDown'].includes(e.key)?1:['ArrowLeft','ArrowUp'].includes(e.key)?-1:0;if(delta){e.preventDefault();select(Math.max(page*8,Math.min(page*8+7,documents.length-1,selected+delta)));}};
 stage.addEventListener('keydown',key);prev.addEventListener('click',()=>{page--;render();(prev.disabled?next:prev).focus();});next.addEventListener('click',()=>{page++;render();(next.disabled?prev:next).focus();});
 render();return {destroy(){dead=true;drawing?.destroy();stage.removeEventListener('keydown',key);root.remove();}};
}
