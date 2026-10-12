import {normalizeDelivery,normalizeReview,initialReview} from './results-contract.mjs';
export async function openLocalResults(){
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('yod-meeting-results-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('results',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Cierra otras ventanas y vuelve a intentar.'));});
 function tx(mode,fn){return new Promise((resolve,reject)=>{const t=db.transaction('results',mode),store=t.objectStore('results');let result;t.oncomplete=()=>resolve(result);t.onabort=()=>reject(result instanceof Error?result:t.error||Error('No se confirmó la copia local.'));t.onerror=()=>{};try{fn(store,v=>result=v,e=>{result=e;t.abort();});}catch(e){result=e;t.abort();}});}
 return {
  list:()=>tx('readonly',(s,done)=>{const r=s.getAll();r.onsuccess=()=>done(r.result);}),
  import(raw){const d=normalizeDelivery(raw),id=d.meeting.meeting_id;return tx('readwrite',(s,done,fail)=>{const r=s.get(id);r.onsuccess=()=>{const old=r.result;if(old){if(JSON.stringify(old.delivery)!==JSON.stringify(d))return fail(Error('Ya hay otra ficha con este identificador. Conserva las dos; no se reemplazó la anterior.'));done(old);return;}const row={id,delivery:d,review:initialReview(d),revision:0};s.add(row);done(row);};});},
  save(id,expected,rows){return tx('readwrite',(s,done,fail)=>{const r=s.get(id);r.onsuccess=()=>{try{const old=r.result;if(!old||old.revision!==expected)return fail(Error('La revisión cambió en otra ventana. Vuelve a abrir la reunión.'));const row={...old,review:normalizeReview(rows,old.delivery.proposals),revision:old.revision+1};s.put(row);done(row);}catch(e){fail(e);}};});}
 };
}
