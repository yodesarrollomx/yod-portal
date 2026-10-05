import {validateFastSession} from './fast-lane.mjs';
import {safeDocumentUrl} from './conversation.mjs';
const PHASES=new Set(['empty','preparing','ready','partial','unavailable']);
const ERRORS=new Set(['unauthorized','unavailable','rate_limited','knowledge_unavailable','invalid_request','cancelled']);
const short=(v,n)=>typeof v==='string'&&v.length<=n;
export function validateLibrary(value){
 if(!value||value.ok!==true||!PHASES.has(value.estado?.phase)||!Number.isInteger(value.estado.documents)||
 value.estado.documents<0||value.estado.documents>100||!Number.isInteger(value.estado.indexed)||
 value.estado.indexed<0||value.estado.indexed>value.estado.documents||!Array.isArray(value.estado.sources)||
 value.estado.sources.length!==value.estado.documents)throw Error('unavailable');
 const ids=new Set(),sources=value.estado.sources.map(s=>{
  if(!short(s.id,200)||ids.has(s.id)||!short(s.nombre,200)||!short(s.papel,500)||!short(s.estado,100)||!safeDocumentUrl(s.enlace)||
    s.indexado_en!==null&&(!short(s.indexado_en,100)||!Number.isFinite(Date.parse(s.indexado_en))))throw Error('unavailable');
  ids.add(s.id);return {...s,enlace:safeDocumentUrl(s.enlace)};
 });
 const passages=value.pasajes===undefined?[]:value.pasajes;
 if(!Array.isArray(passages)||passages.length>8)throw Error('unavailable');
 for(const p of passages){
  if(!short(p.id,250)||!short(p.texto,1000)||!short(p.fuente?.nombre,200)||!safeDocumentUrl(p.fuente.enlace)||
   !short(p.fuente.modificado,100)||!Number.isFinite(Date.parse(p.fuente.consultado))||
   p.pagina!==null&&(!Number.isInteger(p.pagina)||p.pagina<1||p.pagina>99999))throw Error('unavailable');
 }
 return {estado:{...value.estado,sources},pasajes:structuredClone(passages),limite:short(value.limite,1000)?value.limite:''};
}
export function createLibraryClient({mint,fetchImpl=(...args)=>fetch(...args),now=Date.now}={}){
 let credential=null,flight=null,caseId=null,epoch=0;const pending=new Set();
 function reset(){epoch++;caseId=null;credential=null;flight=null;for(const c of pending)c.abort();pending.clear();}
 async function ensure(id,own){
  if(credential&&credential.case_id===id&&credential.expires_at-now()>60000)return credential;
  if(!flight){
   const p=Promise.resolve().then(()=>mint({case_id:id})).then(raw=>{
    if(own!==epoch)throw Error('cancelled');
    if(raw?.ok===false)throw Error(raw.error==='unauthorized'?'unauthorized':'unavailable');
    return credential=validateFastSession(raw,id,now());
   });flight=p;p.finally(()=>{if(flight===p)flight=null;}).catch(()=>{});
  }return flight;
 }
 async function request(id,consulta){
  if(id!==caseId){reset();caseId=id;}const own=epoch;
  const controller=new AbortController();pending.add(controller);const timer=setTimeout(()=>controller.abort(),120000);
  try{
   const current=await ensure(id,own);
   if(own!==epoch)throw Error('cancelled');
   const searching=consulta!==undefined;
   const r=await fetchImpl(current.endpoint+(searching?'/fast/knowledge/search':'/fast/knowledge'),{
    method:searching?'POST':'GET',cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal,
    headers:{Authorization:'Bearer '+current.token,...(searching?{'Content-Type':'application/json'}:{})},
    ...(searching?{body:JSON.stringify({consulta})}:{})
   });
   if(r.status===401){credential=null;throw Error('unauthorized');}
   const data=await r.json();if(own!==epoch)throw Error('cancelled');
   if(!r.ok||data.ok!==true)throw Error(ERRORS.has(data?.error)?data.error:'unavailable');
   return validateLibrary(data);
  }catch(e){throw Error(controller.signal.aborted||own!==epoch?'cancelled':ERRORS.has(e.message)?e.message:'unavailable');}
  finally{clearTimeout(timer);pending.delete(controller);}
 }
 return {load:id=>request(id),search:(id,consulta)=>{
  if(typeof consulta!=='string'||consulta.trim().length<2||consulta.length>2000)return Promise.reject(Error('invalid_request'));
  return request(id,consulta.trim());
 },reset,dispose:reset};
}
