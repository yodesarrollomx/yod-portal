// Knowledge belongs to the authorized case. No browser persistence or financial writes.
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max=4000,empty=false)=>typeof v==='string'&&(empty||v.trim().length>0)&&v.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
const id=v=>text(v,200);
const revision=v=>typeof v==='string'&&/^(0|[1-9]\d{0,19})$/.test(v);
const date=v=>text(v,100)&&Number.isFinite(Date.parse(v));
const invalid=()=>{throw Error('invalid_knowledge');};
const phases={declared:'Declarado por el cliente',documented:'Respaldado por documento',hypothesis:'Hipótesis',verified:'Comprobado',superseded:'Sustituido',draft:'Borrador',proposed:'Propuesto',confirmed:'Confirmado',pending:'Pendiente',running:'En curso',blocked:'Bloqueado',ready_for_review:'Para revisión',completed:'Completado'};
export function knowledgeSourceURL(value){
 if(!text(value,4096)||/[\x00-\x20\x7f]/.test(value))return null;
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validateKnowledgeBoard(raw,caseId){
 if(!plain(raw)||raw.ok!==true||raw.schema!==1||raw.case_id!==caseId||!revision(raw.revision)||raw.updated_at!==null&&!date(raw.updated_at)||!plain(raw.capabilities))invalid();
 const caps={};
 for(const key of ['jev','obsidian']){if(!['available','unavailable','pending'].includes(raw.capabilities[key]))invalid();caps[key]=raw.capabilities[key];}
 caps.obsidian_export=raw.capabilities.obsidian_export??'unavailable';
 if(!['available','unavailable'].includes(caps.obsidian_export))invalid();
 const array=(key,max)=>{if(!Array.isArray(raw[key])||raw[key].length>max)invalid();return raw[key];};
 const sourceIds=new Set();
 const sources=array('sources',200).map(s=>{
  if(!plain(s)||!id(s.id)||sourceIds.has(s.id)||!text(s.title,300))invalid();
  sourceIds.add(s.id);const item={id:s.id,title:s.title};
  if(s.url!==undefined&&s.url!==null){item.url=knowledgeSourceURL(s.url);if(!item.url)invalid();}
  if(s.revision!==undefined){if(!text(s.revision,200,true))invalid();item.revision=s.revision;}
  if(s.consulted_at!==undefined&&s.consulted_at!==null){if(!date(s.consulted_at))invalid();item.consulted_at=s.consulted_at;}
  return item;
 });
 const records=(key,allowed,max=100)=>{const seen=new Set();return array(key,max).map(s=>{
  if(!plain(s)||!id(s.id)||seen.has(s.id)||!text(s.title,300)||!allowed.includes(s.status)||!Array.isArray(s.source_ids)||s.source_ids.length>30||new Set(s.source_ids).size!==s.source_ids.length||s.source_ids.some(x=>!sourceIds.has(x)))invalid();
  seen.add(s.id);const item={id:s.id,title:s.title,status:s.status,source_ids:[...s.source_ids]};
  if(key==='facts'){
   if(!(s.value===null||typeof s.value==='boolean'||typeof s.value==='number'&&Number.isFinite(s.value)||text(s.value,8000,true)))invalid();
   item.value=s.value;if(s.unit!==undefined&&s.unit!==null){if(!text(s.unit,100,true))invalid();item.unit=s.unit;}
  }else{if(!text(s.summary,8000,true))invalid();item.summary=s.summary;}
  if(key!=='next_steps'||s.updated_at!==undefined){if(!date(s.updated_at))invalid();item.updated_at=s.updated_at;}
  if(key==='versions'){
   if(!['version','variant'].includes(s.kind))invalid();item.kind=s.kind;
   for(const k of ['scenario_id','source_revision','revision','modality','model_revision'])if(s[k]!==undefined&&s[k]!==null){if(!text(s[k],200,true))invalid();item[k]=s[k];}
   if(s.horizon!==undefined&&s.horizon!==null){if(!plain(s.horizon)||!Number.isFinite(s.horizon.value)||s.horizon.value<0||s.horizon.unit!=='year')invalid();item.horizon={value:s.horizon.value,unit:s.horizon.unit};}
   if(s.parent_id!==undefined&&s.parent_id!==null){if(!id(s.parent_id))invalid();item.parent_id=s.parent_id;}
  }
  return item;
 });};
 const out={ok:true,schema:1,case_id:caseId,revision:raw.revision,updated_at:raw.updated_at,capabilities:caps,sources,
  facts:records('facts',['declared','documented','hypothesis','verified','superseded'],200),
  versions:records('versions',['draft','proposed','confirmed','superseded']),
  decisions:records('decisions',['pending','confirmed','superseded']),
  next_steps:records('next_steps',['pending','running','blocked','ready_for_review','completed'])};
 if(raw.modality!==undefined&&raw.modality!==null){if(!text(raw.modality,200))invalid();out.modality=raw.modality;}
 return out;
}
export function validateCaptureReceipt(raw,pending){
 if(!plain(raw)||raw.ok!==true||raw.request_id!==pending.request_id||!revision(raw.revision)||typeof raw.duplicate!=='boolean'||!plain(raw.version))throw Error('unconfirmed');
 const v=raw.version;
 if(!id(v.id)||v.title!==pending.title||v.kind!==pending.kind||!['draft','proposed','confirmed','superseded'].includes(v.status)||!text(v.summary,8000,true)||!date(v.updated_at)||!Array.isArray(v.source_ids)||v.source_ids.length>30||v.source_ids.some(x=>!id(x))||(v.parent_id??null)!==pending.parent_id)throw Error('unconfirmed');
 if(BigInt(raw.revision)<=BigInt(pending.expected_revision))throw Error('unconfirmed');
 return {revision:raw.revision,version:structuredClone(v),duplicate:raw.duplicate,request_id:raw.request_id};
}
export function validateMarkdownExport(raw){
 if(!plain(raw)||raw.ok!==true||!revision(raw.revision)||!text(raw.filename,180)||!/^[^/\\:*?"<>|\x00-\x1f]+\.md$/i.test(raw.filename)||raw.filename.startsWith('.')||!text(raw.markdown,2000000,true))throw Error('invalid_export');
 const out={filename:raw.filename,markdown:raw.markdown,revision:raw.revision};
 if(raw.files!==undefined)out.files=validateVaultFiles(raw.files).map(({path,content})=>({path,content}));
 return out;
}

export function validateKnowledgeComparison(raw,left,right,caseId){
 const val=v=>v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||text(v,8000,true);
 if(!plain(raw)||raw.ok!==true||raw.case_id!==caseId||!revision(raw.revision)||raw.left_id!==left||raw.right_id!==right||raw.scope!=='recorded_snapshots'||raw.recommendation!==null||!Array.isArray(raw.changes)||raw.changes.length>400||!Array.isArray(raw.gaps)||raw.gaps.length>400||!Array.isArray(raw.source_revisions)||raw.source_revisions.length!==2||raw.source_revisions.some(v=>!text(v,200))||!Array.isArray(raw.observed_at)||raw.observed_at.length!==2||raw.observed_at.some(v=>!date(v))||!text(raw.warning,4000,true))throw Error('invalid_comparison');
 const changes=raw.changes.map(c=>{
  if(!plain(c)||!['inputs','outputs'].includes(c.section)||!text(c.field,300)||!val(c.before)||!val(c.after)||typeof c.before_present!=='boolean'||typeof c.after_present!=='boolean'||!([null,undefined].includes(c.before_unit)||text(c.before_unit,100,true))||!([null,undefined].includes(c.after_unit)||text(c.after_unit,100,true))||!(c.delta===null||typeof c.delta==='number'&&Number.isFinite(c.delta)))throw Error('invalid_comparison');
  return {section:c.section,field:c.field,before:c.before,after:c.after,before_present:c.before_present,after_present:c.after_present,before_unit:c.before_unit||'',after_unit:c.after_unit||'',delta:c.delta};
 });
 const gaps=raw.gaps.map(g=>{if(!plain(g)||!text(g.code,100)||g.field!==undefined&&!text(g.field,300)||g.section!==undefined&&!['inputs','outputs'].includes(g.section))throw Error('invalid_comparison');return{code:g.code,field:g.field||'',section:g.section||''};});
 return {revision:raw.revision,left_id:left,right_id:right,source_revisions:[...raw.source_revisions],observed_at:[...raw.observed_at],changes,gaps,warning:raw.warning};
}
export function validateVaultFiles(files){
 if(!Array.isArray(files)||!files.length||files.length>500)throw Error('invalid_export');
 const seen=new Set(),encoder=new TextEncoder();let total=0;
 return files.map(file=>{
  if(!plain(file)||!text(file.path,240)||file.path.startsWith('/')||file.path.includes('\\')||/[\x00-\x1f\x7f:*?"<>|]/.test(file.path)||file.path.split('/').some(p=>!p||p==='.'||p==='..')||typeof file.content!=='string')throw Error('invalid_export');
  const key=file.path.normalize('NFC').toLowerCase();if(seen.has(key))throw Error('invalid_export');seen.add(key);
  const name=encoder.encode(file.path),data=encoder.encode(file.content);total+=name.length+data.length;if(total>2000000)throw Error('invalid_export');
  return {path:file.path,content:file.content,name,data};
 });
}
// ZIP STORE, UTF-8 filenames, no external code or network; standard CRC-32.
export function createVaultZip(files){
 const entries=validateVaultFiles(files),parts=[],directory=[];let offset=0,directorySize=0;
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xedb88320:c>>>1;}return(c^0xffffffff)>>>0;};
 const header=(size)=>{const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};};
 for(const entry of entries){
  const checksum=crc(entry.data),local=header(30),lv=local.view;
  lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,33,true);
  lv.setUint32(14,checksum,true);lv.setUint32(18,entry.data.length,true);lv.setUint32(22,entry.data.length,true);lv.setUint16(26,entry.name.length,true);
  parts.push(local.bytes,entry.name,entry.data);
  const central=header(46),cv=central.view;cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,checksum,true);cv.setUint32(20,entry.data.length,true);cv.setUint32(24,entry.data.length,true);cv.setUint16(28,entry.name.length,true);cv.setUint32(42,offset,true);
  directory.push(central.bytes,entry.name);directorySize+=46+entry.name.length;offset+=30+entry.name.length+entry.data.length;
 }
 const end=header(22),ev=end.view;ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,directorySize,true);ev.setUint32(16,offset,true);
 return new Blob([...parts,...directory,end.bytes],{type:'application/zip'});
}

const definitive=new Set(['stale_revision','request_id_reused','board_not_ready','board_not_open','board_stale','parent_not_found','invalid_request']);
const notices={unavailable:'No se pudo consultar el conocimiento. Vuelve a intentar.',knowledge_unavailable:'El conocimiento todavía no está conectado a este expediente.',context_unavailable:'El expediente sigue preparándose. Puedes continuar hablando y volver a consultar.',storage_unavailable:'El registro no está disponible; el guardado sigue sin confirmar.',invalid_knowledge:'La respuesta no tiene el formato esperado. No se muestran datos sin validar.',invalid_export:'No se pudo validar el archivo exportado. No se descargó.',invalid_comparison:'No se pudo validar la comparación. Actualiza las versiones.',unauthorized:'El acceso cambió. Vuelve a abrir el expediente.',stale_revision:'El conocimiento cambió. Actualiza y revisa antes de guardar otra versión.',request_id_reused:'La solicitud entró en conflicto. Actualiza antes de crear otra versión.',board_not_ready:'Abre el PPP y espera una lectura confirmada, sin cambios pendientes.',board_not_open:'Abre el PPP compartido antes de guardar una versión.',board_stale:'Actualiza el PPP compartido antes de guardar su versión.',parent_not_found:'La versión de origen ya no está disponible. Actualiza antes de continuar.',rate_limited:'Espera un momento y vuelve a consultar.',invalid_request:'Revisa el nombre y la versión de origen.'};
export class KnowledgeBoard{
 constructor({request,getCase,uuid=()=>crypto.randomUUID(),onUnauthorized=()=>{}}){Object.assign(this,{request,getCase,uuid,onUnauthorized,caseId:null,epoch:0,model:null,pending:null,busy:false,status:'idle',notice:'',listeners:new Set()});}
 state(){return {model:this.model,pending:this.pending?structuredClone(this.pending):null,busy:this.busy,status:this.status,notice:this.notice};}
 subscribe(fn){this.listeners.add(fn);fn(this.state());return()=>this.listeners.delete(fn);}
 emit(){for(const fn of this.listeners)fn(this.state());}
 open(caseId){if(this.caseId!==caseId){this.reset();this.caseId=caseId;}}
 reset(){this.epoch++;this.caseId=null;this.model=null;this.pending=null;this.busy=false;this.status='idle';this.notice='';this.emit();}
 hide(){this.epoch++;this.model=null;this.busy=false;this.status=this.pending?'unconfirmed':'idle';this.emit();}
 current(own,caseId){return own===this.epoch&&caseId===this.caseId&&this.getCase()===caseId;}
 fail(error,writing=false){
  const code=error?.message;
  if(code==='unauthorized'||code==='session_changed'){this.reset();this.status='unavailable';this.notice=notices.unauthorized;this.onUnauthorized();return;}
  if(writing&&!definitive.has(code)){this.status='unconfirmed';this.notice='No se confirmó el guardado. Comprobar de nuevo conserva la misma solicitud y no crea otra versión.';return;}
  if(writing){this.pending=null;this.model=null;}
  this.status=this.pending?'unconfirmed':writing?'conflict':'unavailable';
  this.notice=notices[code]||notices.unavailable;
 }
 async load(){
  if(this.busy||!this.caseId||this.getCase()!==this.caseId)return false;
  const own=this.epoch,caseId=this.caseId;this.busy=true;this.status='loading';this.notice='Consultando conocimiento…';this.emit();
  try{const raw=await this.request('/fast/knowledge/board',{});if(!this.current(own,caseId))return false;this.model=validateKnowledgeBoard(raw,caseId);this.status=this.pending?'unconfirmed':'ready';this.notice=this.pending?'Hay un guardado sin confirmar. Comprobar de nuevo usa su misma solicitud.':'';return true;}
  catch(error){if(this.current(own,caseId)){this.model=null;this.fail(error);}return false;}
  finally{if(this.current(own,caseId)){this.busy=false;this.emit();}}
 }
 async capture({title,kind,parent_id=null}){
  if(this.busy||this.pending||!this.model||this.getCase()!==this.caseId)return false;
  if(!text(title,200)||!['version','variant'].includes(kind)||parent_id!==null&&!this.model.versions.some(v=>v.id===parent_id))return false;
  this.pending={title:title.trim(),kind,parent_id,request_id:this.uuid(),expected_revision:this.model.revision};return this.write();
 }
 async retry(){if(this.busy||!this.pending||this.getCase()!==this.caseId)return false;return this.write();}
 async write(){
  const own=this.epoch,caseId=this.caseId,intent=structuredClone(this.pending);this.busy=true;this.status='writing';this.notice='Guardando la lectura confirmada del PPP…';this.emit();
  try{
   const raw=await this.request('/fast/knowledge/capture',intent);if(!this.current(own,caseId))return false;
   const receipt=validateCaptureReceipt(raw,intent);this.pending=null;this.status='ready';this.notice='Versión guardada · revisión '+receipt.revision+'.';
   // A receipt confirms persistence; only a fresh authorized board paints the complete view.
   this.model=null;return true;
  }catch(error){if(this.current(own,caseId))this.fail(error,true);return false;}
  finally{if(this.current(own,caseId)){this.busy=false;this.emit();}}
 }
 async compare(left_id,right_id){
  if(this.busy||!this.model||left_id===right_id||![left_id,right_id].every(id=>this.model.versions.some(v=>v.id===id))||this.getCase()!==this.caseId)return null;
  const own=this.epoch,caseId=this.caseId;this.busy=true;this.notice='Comparando lecturas guardadas…';this.emit();
  try{const raw=await this.request('/fast/knowledge/compare',{left_id,right_id,criteria:[]});if(!this.current(own,caseId))return null;const out=validateKnowledgeComparison(raw,left_id,right_id,caseId);this.notice='Comparación descriptiva de versiones guardadas; no evalúa aprobación ni viabilidad.';return out;}
  catch(error){if(this.current(own,caseId))this.fail(error);return null;}
  finally{if(this.current(own,caseId)){this.busy=false;this.emit();}}
 }
 async exportMarkdown(){
  if(this.busy||!this.model||this.model.capabilities.obsidian_export!=='available'||this.getCase()!==this.caseId)return null;
  const own=this.epoch,caseId=this.caseId;this.busy=true;this.notice='Preparando Markdown…';this.emit();
  try{const raw=await this.request('/fast/knowledge/export',{});if(!this.current(own,caseId))return null;const out=validateMarkdownExport(raw);this.notice='Archivo preparado · revisión '+out.revision+'.';return out;}
  catch(error){if(this.current(own,caseId))this.fail(error);return null;}
  finally{if(this.current(own,caseId)){this.busy=false;this.emit();}}
 }
}
// The caller also checks authority after awaiting the controller: a case change
// can occur in the microtask between its validated return and a download/render.
export async function withCurrentKnowledge(controller,operation,consume,isAlive=()=>true){
 const own=controller.epoch,caseId=controller.caseId,value=await operation();
 if(!value||!isAlive()||!controller.current(own,caseId))return false;
 consume(value);return true;
}
export function mountKnowledgeBoard({container,request,getCase,onUnauthorized=()=>{},doc=document,win=window}){
 const controller=new KnowledgeBoard({request,getCase,onUnauthorized});
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(label,action)=>{const b=el('button',label);b.type='button';b.addEventListener('click',action);return b;};
 const root=el('div',undefined,'knowledge-board'),intro=el('div',undefined,'knowledge-intro'),heading=el('h2','Conocimiento del proyecto'),meta=el('p','Hechos, versiones y decisiones con sus fuentes.','knowledge-meta');
 const actions=el('div',undefined,'knowledge-actions'),refresh=button('Actualizar',()=>void controller.load()),exportButton=button('Descargar Markdown',()=>void download(false)),vaultButton=button('Descargar bóveda',()=>void download(true)),notice=el('p','','knowledge-notice'),retry=button('Comprobar guardado pendiente',()=>void retryCapture());
 notice.setAttribute('role','status');retry.hidden=true;actions.append(refresh,exportButton,vaultButton);intro.append(heading,meta,actions);root.append(intro,notice,retry);
 const caps=el('p','','knowledge-capabilities');root.append(caps);
 const form=el('form',undefined,'knowledge-capture'),formTitle=el('h3','Guardar lectura del PPP'),title=el('input'),kind=el('select'),parent=el('select'),submit=el('button','Guardar versión');
 title.maxLength=200;title.required=true;title.placeholder='Nombre que permita reconocer esta alternativa';title.setAttribute('aria-label','Nombre de versión o variante');
 for(const [value,label]of [['version','Versión'],['variant','Variante']]){const option=el('option',label);option.value=value;kind.append(option);}
 kind.setAttribute('aria-label','Tipo de registro');parent.setAttribute('aria-label','Versión de origen');
 const parentLabel=el('label','Versión de origen (opcional)');parentLabel.append(parent);
 submit.type='submit';form.append(formTitle,el('p','Conserva la lectura confirmada del tablero. No aprueba una versión ni modifica sus cantidades.'),title,kind,parentLabel,submit);root.append(form);
 const compareForm=el('form',undefined,'knowledge-compare'),left=el('select'),right=el('select'),compareButton=el('button','Comparar versiones'),comparison=el('div',undefined,'knowledge-comparison');
 left.setAttribute('aria-label','Primera versión');right.setAttribute('aria-label','Segunda versión');compareButton.type='submit';
 compareForm.append(el('h3','Comparar dos lecturas guardadas'),left,right,compareButton);root.append(compareForm,comparison);
 compareForm.addEventListener('submit',async e=>{e.preventDefault();comparison.replaceChildren();await withCurrentKnowledge(controller,()=>controller.compare(left.value,right.value),paintComparison,()=>!disposed);});
 const grid=el('div',undefined,'knowledge-grid');root.append(grid);container.append(root);
 let downloadURL=null,disposed=false,comparisonRevision=null;
 function revoke(){if(downloadURL){win.URL.revokeObjectURL(downloadURL);downloadURL=null;}}
 async function download(vault){
  await withCurrentKnowledge(controller,()=>controller.exportMarkdown(),out=>{
   let blob;try{blob=vault?createVaultZip(out.files):new Blob([out.markdown],{type:'text/markdown;charset=utf-8'});}catch{notice.textContent='La bóveda no se confirmó; no se descargó un archivo incompleto.';return;}
   revoke();downloadURL=win.URL.createObjectURL(blob);const a=el('a');a.href=downloadURL;a.download=vault?out.filename.replace(/\.md$/i,'.zip'):out.filename;root.append(a);a.click();a.remove();win.setTimeout(revoke,1000);
   if(vault)notice.textContent='Bóveda preparada para abrir en Obsidian; sincronización no conectada.';
  },()=>!disposed);
 }
 function paintComparison(value){
  comparisonRevision=value.revision;comparison.replaceChildren();comparison.append(el('h3','Cambios entre las lecturas'),el('p',value.warning||'Comparación de lecturas guardadas. No determina una alternativa ganadora.'),el('p','Revisiones PPP: '+value.source_revisions.join(' / ')+' · Lecturas: '+value.observed_at.map(d=>new Date(d).toLocaleString('es-MX')).join(' / ')));
  if(!value.changes.length)comparison.append(el('p','No hay diferencias registradas entre estas lecturas.'));
  else{
   const table=el('table'),head=el('tr');for(const label of ['Campo','Primera lectura','Segunda lectura','Diferencia'])head.append(el('th',label));const thead=el('thead');thead.append(head);table.append(thead);
   const body=el('tbody');
   for(const c of value.changes){const row=el('tr'),format=(present,v,unit)=>!present?'No registrado':v===null?'Pendiente':String(v)+(unit?' '+unit:'');row.append(el('th',(c.section==='inputs'?'Entrada: ':'Resultado: ')+c.field),el('td',format(c.before_present,c.before,c.before_unit)),el('td',format(c.after_present,c.after,c.after_unit)),el('td',c.delta===null?'No comparable':String(c.delta)));body.append(row);}
   table.append(body);comparison.append(table);
  }
  const gapLabels={missing_model_revision:'Falta la revisión del modelo',different_model_revision:'Revisiones de modelo distintas',missing_horizon:'Falta el horizonte',different_horizon:'Horizontes distintos',missing_modality:'Falta la modalidad del modelo',different_modalities:'Modalidades distintas',missing_value:'Falta un valor',missing_unit:'Falta una unidad',unit_mismatch:'Unidades distintas',different_scenarios:'Escenarios diferentes',criteria_required_for_evaluation:'Sin criterios para evaluar preferencia',feasibility_and_business_approval_not_evaluated:'Viabilidad y aprobación de negocio no evaluadas'};
  if(value.gaps.length){comparison.append(el('h4','Faltantes y límites'));const list=el('ul');for(const gap of value.gaps)list.append(el('li',(gapLabels[gap.code]||'Comprobación pendiente')+(gap.field?' · '+gap.field:'')));comparison.append(list);}
 }

 async function retryCapture(){if(await controller.retry())await controller.load();}
 form.addEventListener('submit',async e=>{e.preventDefault();if(await controller.capture({title:title.value,kind:kind.value,parent_id:parent.value||null})){title.value='';await controller.load();}});
 function references(card,ids,sources){
  const refs=el('div',undefined,'knowledge-references');
  if(!ids.length){refs.append(el('small','Sin fuente vinculada.'));card.append(refs);return;}
  for(const id of ids){const source=sources.find(s=>s.id===id);if(!source)continue;const ref=el(source.url?'a':'span',source.title);if(source.url){ref.href=source.url;ref.target='_blank';ref.rel='noopener noreferrer';}refs.append(ref);}
  card.append(refs);
 }
 function paint(state){
  if(disposed)return;
  notice.textContent=state.notice;root.dataset.state=state.status;
  refresh.disabled=state.busy||!getCase();exportButton.disabled=vaultButton.disabled=state.busy||state.model?.capabilities.obsidian_export!=='available';
  compareButton.disabled=state.busy||!state.model||state.model.versions.length<2;left.disabled=right.disabled=compareButton.disabled;
  retry.hidden=!state.pending;retry.disabled=state.busy;submit.disabled=state.busy||!!state.pending||!state.model;
  title.disabled=kind.disabled=parent.disabled=state.busy||!!state.pending||!state.model;
  if(state.pending){title.value=state.pending.title;kind.value=state.pending.kind;}
  const previous=state.pending?.parent_id??parent.value;parent.replaceChildren();const none=el('option','Sin versión de origen');none.value='';parent.append(none);
  grid.replaceChildren();
  if(!state.model){comparison.replaceChildren();left.replaceChildren();right.replaceChildren();meta.textContent=state.status==='loading'?'Consultando el registro del expediente…':'No hay una lectura confirmada disponible.';caps.textContent='Las capacidades se muestran al confirmar el acceso.';return;}
  const m=state.model;if(comparisonRevision!==null&&comparisonRevision!==m.revision){comparison.replaceChildren();comparisonRevision=null;}
  const oldLeft=left.value,oldRight=right.value;left.replaceChildren();right.replaceChildren();
  for(const version of m.versions){for(const select of [left,right]){const option=el('option',version.title);option.value=version.id;select.append(option);}}
  if(m.versions.some(v=>v.id===oldLeft))left.value=oldLeft;
  if(m.versions.some(v=>v.id===oldRight))right.value=oldRight;else if(m.versions.length>1)right.selectedIndex=1;
  meta.textContent=(m.modality?'Modalidad: '+m.modality+' · ':'')+'Revisión '+m.revision+' · '+(m.updated_at?new Date(m.updated_at).toLocaleString('es-MX'):'Sin registros todavía');
  const capability=(name,status)=>name+': '+({available:'disponible',pending:'pendiente',unavailable:'sin conexión'}[status]||'no disponible');
  caps.textContent=capability('Jev',m.capabilities.jev)+' · '+capability('Obsidian',m.capabilities.obsidian)+' · '+(m.capabilities.obsidian_export==='available'?'Markdown portable disponible; descargar no sincroniza un vault.':'Exportación Markdown no disponible.');
  for(const v of m.versions){const option=el('option',v.title);option.value=v.id;parent.append(option);}if([...parent.options].some(o=>o.value===previous))parent.value=previous;
  for(const [key,label,empty]of [['facts','Hechos','Todavía no hay hechos registrados.'],['versions','Versiones y variantes','Todavía no hay versiones guardadas.'],['decisions','Decisiones','Todavía no hay decisiones registradas.'],['next_steps','Próximos pasos','Todavía no hay próximos pasos registrados.']]){
   const section=el('section',undefined,'knowledge-section');section.dataset.knowledgeSection=key;section.append(el('h3',label));
   if(!m[key].length)section.append(el('p',empty,'knowledge-empty'));
   for(const item of m[key]){
    const card=el('article',undefined,'knowledge-card'),top=el('div',undefined,'knowledge-card-heading');
    top.append(el('h4',item.title),el('span',key==='versions'&&item.status==='confirmed'?'Lectura guardada':phases[item.status],'knowledge-badge'));card.append(top);
    if(key==='facts')card.append(el('p',item.value===null?'Dato pendiente':String(item.value)+(item.unit?' '+item.unit:'')));
    else card.append(el('p',item.summary||'Sin resumen registrado.'));
    if(key==='versions'){const info=[item.kind==='variant'?'Variante':'Versión',item.modality?'Modalidad: '+item.modality:'',item.scenario_id?'Escenario: '+item.scenario_id:'',item.source_revision?'PPP: '+item.source_revision:'',item.model_revision?'Modelo: '+item.model_revision:'',item.horizon?'Horizonte: '+item.horizon.value+' años':''];card.append(el('small',info.filter(Boolean).join(' · ')));if(item.parent_id)card.append(el('small','Origen: '+(m.versions.find(v=>v.id===item.parent_id)?.title||item.parent_id)));}
    if(item.updated_at)card.append(el('small',new Date(item.updated_at).toLocaleString('es-MX')));references(card,item.source_ids,m.sources);section.append(card);
   }grid.append(section);
  }
 }
 const unsubscribe=controller.subscribe(paint);
 return {controller,open(caseId){controller.open(caseId);return controller.load();},hide(){controller.hide();revoke();},reset(){controller.reset();title.value='';revoke();},dispose(){disposed=true;unsubscribe();controller.reset();revoke();root.remove();},root};
}
