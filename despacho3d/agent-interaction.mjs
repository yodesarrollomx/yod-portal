// Presentation commands only. Business mutations keep their existing writer and
// receipt; a transport fallback is never permission to send a second mutation.
const id=value=>typeof value==='string'&&/^[A-Za-z0-9_.:-]{1,256}$/.test(value);
const revision=value=>typeof value==='string'&&value.length>0&&value.length<=256&&!/[\x00-\x1f\x7f]/.test(value);
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[.!?¿¡]+$/g,'').replace(/\s+/g,' ');
const sections=Object.freeze({arquitectura:'dArq',distribucion:'dArq',terreno:'dArq',volumenes:'dVolumenes',torres:'dVolumenes',ventas:'dVentas','ventas e ingresos':'dVentas',costos:'dCostos',costes:'dCostos',macrolotes:'dMacro',dotacion:'dDota'});
const commandPrefix='(?:abre|abrir|muestra|mostrar|muestrame|ensename|ver|quiero ver|quiero que abras|vamos a|ve a|ponme|llevame a)';
const navigation=new RegExp('^'+commandPrefix+' (?:el |la |los |las |mi )?(plan de potencial|plan|ppp|trabajo|expediente|versiones|arquitectura|distribucion|volumenes|torres|terreno|ventas e ingresos|ventas|costos|costes|macrolotes|dotacion)(?: completo)?(?: del (?:ppp|plan(?: de potencial)?))?(?: por favor)?$');
export function parseDirectUserCommand(input){
 if(input?.role!=='user'||!['voice','text'].includes(input.source)||typeof input.text!=='string'||!input.text.trim()||input.text.length>6000||input.quoted===true)return null;
 // Neither quoted examples nor agent prose are executable user commands.
 if(/["'“”«»`\n\r>]/.test(input.text)||/^\s*(?:agente|assistant|claude|ruiseñor|ruisenor)\s*:/i.test(input.text))return null;
 const text=normalize(input.text).replace(/^(?:oye,? |a ver,? |por favor,? )/,'');
 if(/\b(?:no|nunca|jamas|tampoco)\b/.test(text))return null;
 const match=navigation.exec(text);
 if(match){
  const target=match[1];
  if(sections[target])return{kind:'navigate_plan',tab:'ppp',section_id:sections[target],subject:target};
  return{kind:'open_workspace',tab:({trabajo:'activity',expediente:'sources',versiones:'knowledge'})[target]||'ppp',subject:target};
 }
 // Preserve a requested edit as an intention. There is deliberately no parser
 // that turns numbers, prices or tower descriptions into a canonical write.
 if(/^(?:cambia|cambiar|ajusta|ajustar|modifica|modificar|quiero cambiar|quiero modificar|pon|poner|prepara|preparar|haz|hacer)\s+/.test(text)&&
    /\b(?:departamentos?|unidades?|precio|precios|terreno|viviendas?|vendible|torres?|volumenes?|edificios?|niveles?|mezcla|etapas?|lofts?|recamaras?|metros?|m2|m²)\b/.test(text)){
  const volumes=/\b(?:torres?|volumenes?|edificios?)\b/.test(text),sales=/\b(?:precio|precios)\b/.test(text);
  return{kind:'change_request',tab:'ppp',section_id:volumes?'dVolumenes':sales?'dVentas':'dArq',subject:volumes?'volumenes':sales?'precio':'supuestos'};
 }
 return null;
}

const copy=value=>structuredClone(value);
function contextOf(raw){
 if(raw?.authorized!==true||raw.ppp_enabled!==true||!id(raw.case_id))return null;
 const context={case_id:raw.case_id};
 for(const key of ['board_case_id','scenario_id'])if(id(raw[key]))context[key]=raw[key];
 if(revision(raw.revision))context.revision=raw.revision;
 context.capabilities={navigate:raw.capabilities?.navigate===true,...(raw.capabilities?.volumes?.schema===2?{volumes:{schema:2,read:raw.capabilities.volumes.read===true,write:raw.capabilities.volumes.write===true}}:{})};
 return context;
}
export function nativeVolumeWrite(context){return context?.authorized===true&&context.ppp_enabled===true&&context.capabilities?.volumes?.schema===2&&context.capabilities.volumes.read===true&&context.capabilities.volumes.write===true;}
function canonicalChange(context,command){return command?.kind==='change_request'&&context?.capabilities?.volumes?.schema===2&&context.capabilities.volumes.read===true&&context.capabilities.volumes.write===true;}
function sameContext(a,b,includeBoard=true){
 if(!a||!b||a.case_id!==b.case_id)return false;
 return !includeBoard||['board_case_id','scenario_id','revision'].every(key=>!a[key]||a[key]===b[key]);
}
function sameMutationContext(a,b){return !!a&&!!b&&a.case_id===b.case_id&&['board_case_id','scenario_id'].every(key=>!a[key]||a[key]===b[key]);}
function rejectionReadback(record,result){return result?.status==='rejected'&&result.request_id===record.request_id&&sameMutationContext(record.context,result.observed);}
function validReadback(record,result){
 if(result?.status!=='confirmed'||!result.observed||result.observed.case_id!==record.context.case_id||result.observed.tab!==record.tab||!sameContext(record.context,result.observed))return false;
 if(record.section_id){
  if(result.observed.section_id!==record.section_id)return false;
  if(!['board_case_id','scenario_id','revision'].every(key=>!record.context[key]||result.observed[key]===record.context[key]))return false;
 }
 return true;
}
function mutationReadback(record,result){
 return result?.status==='confirmed'&&result.request_id===record.request_id&&result.observed?.case_id===record.context.case_id&&
  ['board_case_id','scenario_id'].every(key=>!record.context[key]||result.observed[key]===record.context[key])&&revision(result.observed.revision);
}

export function createAgentInteraction({getContext,openWorkspace,navigateBridge,navigateAssisted,reconcile,onChange=()=>{},now=Date.now,uuid=()=>crypto.randomUUID(),timeoutMs=8000}={}){
 let records=[],caseId=null,epoch=0,disposed=false;
 const listeners=new Set(),flights=new Map(),events=new Map();
 const stamp=()=>new Date(now()).toISOString();
 function current(){
  const context=!disposed&&contextOf(getContext?.());
  if((context?.case_id||null)!==caseId){caseId=context?.case_id||null;epoch++;records=[];events.clear();flights.clear();}
  return context||null;
 }
 function snapshot(){current();return copy(records);}
 function emit(){const value=snapshot();try{onChange(value);}catch{}for(const fn of listeners)try{fn(copy(value));}catch{}}
 function patch(record,change){if(!records.includes(record))return false;Object.assign(record,change,{updated_at:stamp()});emit();return true;}
 function pending(record,reason='unavailable'){
  patch(record,{state:'pending',reason,summary:record.kind==='change_request'?'Intención conservada; la vista sigue pendiente.':'La navegación sigue pendiente.',next:'Puedes reintentar o abrir esta sección con sus controles. No se guardaron cambios.'});return false;
 }
 function bound(record,own){
  const context=current();if(own!==epoch||!records.includes(record)||!context)return false;
  if(!(record.request_id?sameMutationContext(record.context,context):sameContext(record.context,context))){
   patch(record,{state:'stale',summary:'Cambió el caso o la versión de referencia.',next:'Revisa la versión visible antes de continuar.'});return false;
  }
  return true;
 }
 async function invoke(fn,payload){
  if(typeof fn!=='function')return{status:'unsupported'};
  let timer;
  try{return await Promise.race([Promise.resolve().then(()=>fn(copy(payload))),new Promise(resolve=>{timer=setTimeout(()=>resolve({status:'uncertain',reason:'timeout'}),timeoutMs);})]);}
  catch(error){const reason=error?.code||error?.message;return ['unauthorized','session_changed','stale_revision','editing_in_progress','pending_write'].includes(reason)?{status:'blocked',reason}:{status:'unavailable'};}
  finally{clearTimeout(timer);}
 }
 function acknowledge(record,result,route){
  if(!validReadback(record,result))return false;
  const observed=copy(result.observed);
  if(record.kind==='change_request'){
   patch(record,{state:'pending',route,reason:'requires_supported_editor',summary:'Intención conservada; sección abierta y comprobada, cambio todavía no aplicado.',next:record.section_id==='dVolumenes'?'El editor de volúmenes está abierto. Revisa el borrador por torres; todavía no hay guardado ni resultado financiero confirmado.':'Revisa el supuesto en esta sección antes de preparar su cambio; las cantidades activas se conservan.',evidence:[{kind:'navigation',action_id:record.action_id,route,observed,observed_at:stamp()}]});return true;
  }
  patch(record,{state:'confirmed',route,reason:null,summary:record.kind==='navigate_plan'?'Sección del plan abierta y comprobada.':'Vista abierta y comprobada.',
   next:record.subject==='volumenes'||record.subject==='torres'?'El editor de volúmenes está abierto. Puedes revisar el borrador por torres; no se aplicaron cambios ni se calcularon nuevos resultados financieros.':'Puedes seguir conversando sobre esta vista.',
   evidence:[{kind:'navigation',action_id:record.action_id,route,observed,observed_at:stamp()}]});return true;
 }
 async function execute(record){
  const context=current(),own=epoch;if(!context||!records.includes(record)||!bound(record,own))return false;
  if(!record.request_id&&canonicalChange(context,record)){patch(record,{state:'superseded',summary:'Esta petición se atiende en la conversación del agente.',next:'El cambio conserva su circuito de propuesta y recibo.'});return false;}
  if(record.request_id){
   patch(record,{state:'running',summary:'Comprobando la solicitud original.',next:'Se conserva el mismo identificador; no se vuelve a enviar el cambio.'});
   const result=await invoke(reconcile,{action_id:record.action_id,request_id:record.request_id,context:record.context});
   if(!bound(record,own))return false;
   if(mutationReadback(record,result)){
    patch(record,{state:'confirmed',route:'reconcile',summary:'El recibo original confirmó el cambio.',next:'Revisa el resultado de la versión confirmada.',evidence:[{kind:'mutation_receipt',request_id:record.request_id,observed:copy(result.observed),observed_at:stamp()}]});return true;
   }
   if(rejectionReadback(record,result)){patch(record,{state:'rejected',summary:'La solicitud original fue rechazada.',next:'Revisa la causa antes de preparar otro cambio.'});return false;}
   patch(record,{state:'uncertain',reason:'confirmation_pending',summary:'El cambio sigue sin confirmar.',next:'Comprueba el mismo recibo. No se reenviará por otra vía.'});return false;
  }
  patch(record,{state:'running',summary:'Abriendo la vista solicitada.',next:'Comprobando qué quedó visible.'});
  const payload={action_id:record.action_id,context:record.context,tab:record.tab,...(record.section_id?{section_id:record.section_id}:{})};
  const opened=await invoke(openWorkspace,payload);
  if(!bound(record,own))return false;
  if(record.kind==='open_workspace')return acknowledge(record,opened,'workspace')||pending(record,opened?.reason||'view_not_confirmed');
  if(opened?.status!=='confirmed'||opened.observed?.case_id!==record.context.case_id||opened.observed.tab!=='ppp')return pending(record,'plan_not_confirmed');
  if(record.context.capabilities.navigate){
   const result=await invoke(navigateBridge,payload);if(!bound(record,own))return false;
   if(acknowledge(record,result,'bridge'))return record.kind!=='change_request';
   if(result?.status==='blocked')return pending(record,result.reason||'editing_in_progress');
  }
  // Assisted navigation may only reveal/highlight controls. Its implementation
  // must refuse editable focus, pending writes and any input/change events.
  const assisted=await invoke(navigateAssisted,payload);if(!bound(record,own))return false;
  if(acknowledge(record,assisted,'assisted'))return record.kind!=='change_request';
  return pending(record,assisted?.reason||'navigation_not_confirmed');
 }
 function run(record){
  if(flights.has(record.action_id))return flights.get(record.action_id);
  const promise=execute(record).finally(()=>{if(flights.get(record.action_id)===promise)flights.delete(record.action_id);});flights.set(record.action_id,promise);return promise;
 }
 async function receive(input){
  if(input?.role!=='user'||!['voice','text'].includes(input.source))return{handled:false};
  const context=current(),command=parseDirectUserCommand(input);if(!context)return{handled:false};
  const eventId=typeof input?.event_id==='string'&&input.event_id.length<=256?input.event_id:null,key=eventId?input.source+':'+eventId:null;
  const prior=key&&events.has(key)?records.find(item=>item.action_id===events.get(key)):null;
  if(canonicalChange(context,command)){if(prior&&prior.state==='awaiting_confirmation')patch(prior,{state:'superseded',summary:'Esta petición se atiende en la conversación del agente.',next:'El cambio conserva su circuito de propuesta y recibo.'});return{handled:false,canonical:true,tab:'ppp'};}
  if(prior){
   if(input.source==='voice'&&prior.state==='awaiting_confirmation'&&input.text!==prior.text){
    if(!command){patch(prior,{state:'superseded',summary:'La transcripción cambió; esta intención necesita revisarse.',next:'Confirma el texto completo antes de continuar.'});return{handled:false,action_id:prior.action_id};}
    patch(prior,{...command,text:input.text.trim(),context:copy(context)});if(input.complete===true)await run(prior);return{handled:true,action_id:prior.action_id,updated:true};
   }
   return{handled:!!command,action_id:prior.action_id,duplicate:true};
  }
  if(!command)return{handled:false};
  const record={...command,action_id:'interaction-'+uuid(),request_id:null,text:input.text.trim(),source:input.source,source_id:eventId,context:copy(context),
   state:'awaiting_confirmation',route:null,reason:null,summary:'Confirma la intención antes de ejecutarla.',next:'Revisa el texto reconocido.',evidence:[],created_at:stamp(),updated_at:stamp()};
  if(records.length>=40){const removable=records.findIndex(item=>!item.request_id&&['confirmed','rejected','superseded','stale'].includes(item.state));if(removable<0)return{handled:false,reason:'interaction_limit'};records.splice(removable,1);}
  records.push(record);if(key)events.set(key,record.action_id);emit();
  if(input.complete===true){await run(record);}
  return{handled:true,action_id:record.action_id};
 }
 function find(actionId){current();return records.find(record=>record.action_id===actionId);}
 return{
  receive,
  confirm(actionId){const record=find(actionId);if(!record||record.state!=='awaiting_confirmation')return Promise.resolve(false);return run(record);},
  retry(actionId){const record=find(actionId);if(!record||!['pending','uncertain'].includes(record.state))return Promise.resolve(false);return run(record);},
  bindMutation(actionId,receipt){
   const record=find(actionId);if(!record||record.kind!=='change_request'||!id(receipt?.request_id)||!['pending','uncertain','confirmed','rejected'].includes(receipt.status)||!sameMutationContext(record.context,current()))return false;
   if(record.request_id&&record.request_id!==receipt.request_id)return false;
   record.request_id=receipt.request_id;
   if(mutationReadback(record,receipt))return patch(record,{state:'confirmed',summary:'El recibo original confirmó el cambio.',next:'Revisa la versión confirmada.',evidence:[{kind:'mutation_receipt',request_id:record.request_id,observed:copy(receipt.observed),observed_at:stamp()}]});
   const rejected=rejectionReadback(record,receipt);
   return patch(record,{state:rejected?'rejected':'uncertain',summary:rejected?'La solicitud original fue rechazada.':'El cambio sigue sin confirmar.',next:'Comprueba el mismo recibo; no se vuelve a enviar el cambio.'});
  },
  snapshot,
  observe(){current();emit();return snapshot();},
  reset(){epoch++;records=[];events.clear();flights.clear();caseId=contextOf(getContext?.())?.case_id||null;emit();},
  subscribe(fn){if(typeof fn!=='function')throw TypeError('listener_required');listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},
  dispose(){disposed=true;current();listeners.clear();records=[];events.clear();flights.clear();}
 };
}

// Confirm the rendered view, independently of the Puesto2 presentation.
export function workspacePresentationVisible({dialog,workspace,tab,win}){
 if(!dialog?.open||dialog.classList?.contains('voice-compact')||workspace?.getTab?.()!==tab)return false;
 const root=workspace.root,panel=root?.querySelector?.('[data-panel="'+tab+'"]');
 if(!root?.isConnected||!panel)return false;
 for(let node=panel;node;node=node.parentElement){
  if(node.hidden||node.getAttribute?.('aria-hidden')==='true')return false;
  const style=win.getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;
  if(node===dialog)break;
 }
 const rect=panel.getBoundingClientRect();
 return rect.width>0&&rect.height>0&&rect.bottom>0&&rect.right>0&&rect.top<win.innerHeight&&rect.left<win.innerWidth;
}
export function renderInteractionCards({host,records=[],caseId,handlers={},isCurrent=()=>true,doc=host?.ownerDocument}){
 if(!host)return;
 const current=isCurrent()?records.filter(record=>record.context?.case_id===caseId).slice(-3):[];
 host.replaceChildren();host.hidden=!current.length;
 const node=(tag,text)=>{const value=doc.createElement(tag);value.textContent=text;return value;};
 for(const record of current){
  const card=doc.createElement('article');card.dataset.actionState=record.state;
  card.append(node('small','Acción en esta pantalla'),node('p',record.text),node('strong',record.summary),node('p',record.next));
  if(record.context.scenario_id)card.append(node('small','Versión '+record.context.scenario_id));
  const action=(label,fn)=>{const b=node('button',label);b.type='button';b.addEventListener('click',()=>{if(isCurrent())void fn(record.action_id);});card.append(b);};
  if(record.state==='awaiting_confirmation')action('Confirmar esta intención',id=>handlers.confirm?.(id));
  if(['pending','uncertain'].includes(record.state))action(record.request_id?'Comprobar el mismo recibo':'Volver a abrir la sección',id=>handlers.retry?.(id));
  host.append(card);
 }
}
