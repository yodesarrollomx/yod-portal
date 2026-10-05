import {OFICINA_LEGIBLE} from './office-config.mjs?v=1';
if(!OFICINA_LEGIBLE){await import('./office.js?v=13');}
else{
 document.body.classList.add('office-readable');
 const {startAccessibleOffice,mountAccessibleView}=await import('./office-accessible.mjs?v=1');
 try{await import('./office.js?v=13');}
 catch{startAccessibleOffice();}
 mountAccessibleView(window.despacho);
}
