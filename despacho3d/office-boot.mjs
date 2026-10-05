import {OFICINA_LEGIBLE} from './office-config.mjs?v=1';
if(!OFICINA_LEGIBLE){await import('./office.js?v=14');}
else{
 document.body.classList.add('office-readable');
 const {startAccessibleOffice,mountAccessibleView}=await import('./office-accessible.mjs?v=2');
 try{await import('./office.js?v=14');}
 catch{startAccessibleOffice();}
 mountAccessibleView(window.despacho);
}
