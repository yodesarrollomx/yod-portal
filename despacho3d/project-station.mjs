// A station belongs to the currently authorized case. A title is never a board identifier.
const id = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(value);
const pages = new Set(['patrimonial.html','vertical.html','mixto.html','macrolotes.html','unifamiliar.html','residencial.html']);
// URL registration supplies a bridge, never write authority. Native volume
// editing is negotiated from the current VERTICAL board's schema2 capability.
const nativePages = new Set(['patrimonial.html']);
const observationPages = new Set(['mixto.html','macrolotes.html']);
export function stationIdentity(selection) {
 return {case_id:selection.case_id,name:selection.avatar?.name||selection.name,project:selection.name};
}
export function registeredBoard(source,caseId,boardCaseId=caseId) {
 if(!id(caseId)||!id(boardCaseId)||typeof source!=='string')return null;
 try {
  const u=new URL(source);
  if(u.protocol!=='https:'||u.username||u.password)return null;
  if(u.hostname==='yodesarrollomx.github.io'&&u.pathname.startsWith('/potenciales-yod/')&&pages.has(u.pathname.slice('/potenciales-yod/'.length))){
   // Only exact case bindings support editable snapshots and proposals.
   if(u.searchParams.getAll('open').length!==1||u.searchParams.get('open')!==boardCaseId)return null;
   const page=u.pathname.slice('/potenciales-yod/'.length)==='vertical.html'?'mixto.html':u.pathname.slice('/potenciales-yod/'.length);
   const clean=new URL(u.origin+'/potenciales-yod/'+page);clean.searchParams.set('open',boardCaseId);
   const external=clean.href,bridge=nativePages.has(page)||observationPages.has(page);clean.searchParams.set('embed','1');
   if(bridge){clean.searchParams.set('agent','1');clean.searchParams.set('view',nativePages.has(page)?'cards':'board');}
   return {url:clean.href,external,origin:clean.origin,bridge,readOnly:observationPages.has(page),board_case_id:boardCaseId,surface:'ppp'};
  }
  if(u.hostname==='docs.google.com'&&/^\/spreadsheets\/d\/[A-Za-z0-9_-]+\/(edit|preview)$/.test(u.pathname)){
   const clean=new URL(u.origin+u.pathname);const gid=u.searchParams.get('gid');
   if(gid&&/^\d+$/.test(gid))clean.searchParams.set('gid',gid);
   if(/^#gid=\d+$/.test(u.hash))clean.hash=u.hash;
   return {url:clean.href,external:clean.href,origin:clean.origin,bridge:false,surface:'sheet'};
  }
 }catch{}
 return null;
}
export function resolveBoard(selection,documents=[]) {
 // A descriptor, if supplied, must come from resolveCurrent and match this case.
 const direct=selection.ppp?.case_id===selection.case_id?registeredBoard(selection.ppp.url,selection.case_id,selection.ppp.board_case_id||selection.case_id):null;
 if(direct)return direct;
 const candidates=documents.filter(d=>/\bppp\b|plan de potencial|patrimonial/i.test(d.title+' '+d.role))
  .map(d=>registeredBoard(d.source||d.url,selection.case_id)).filter(Boolean);
 const unique=[...new Map(candidates.map(d=>[d.url,d])).values()];
 const ppp=unique.filter(d=>d.surface==='ppp');
 return ppp.length===1?ppp[0]:ppp.length===0&&unique.length===1?unique[0]:null;
}

export function nativeBoardState(value,selection,link){
 if(!selection||!link?.bridge||!value)return null;
 // Map only identities from the exact registered descriptor, after the frame/nonce checks.
 if(value.case_id!==selection.case_id&&value.case_id!==link.board_case_id)return null;
 if(value.version_context&&value.version_context.board_case_id!==link.board_case_id)return null;
 if(selection.ppp?.scenario_id&&value.scenario_id!==selection.ppp.scenario_id)return null;
 return {...value,case_id:selection.case_id};
}

const volumeIds=['name','footprint_m2','open_courtyard_m2','residential_levels','units_per_level','units','private_area_per_unit_m2','private_residential_area_m2','built_residential_area_m2','commercial_ground_m2','ground_services_m2','covered_ground_m2','gross_area_m2','basement_area_m2','direct_cost','construction_start_month','construction_duration_months','construction_end_month','sales_start_month','presale_months','delivery_months'];
const volumeDerived=new Set(['units','private_residential_area_m2','built_residential_area_m2','covered_ground_m2','gross_area_m2','direct_cost','construction_end_month']);
const volumeIntegers=new Set(['residential_levels','units','construction_start_month','construction_duration_months','construction_end_month','sales_start_month','presale_months','delivery_months']);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const revision=value=>typeof value==='string'&&value.length>0&&value.length<=256&&!/[\x00-\x1f\x7f]/.test(value);
const text=value=>typeof value==='string'&&value===value.trim()&&value.length>0&&value.length<=80&&!/[\x00-\x1f]/.test(value)&&!/^[-=+@]/.test(value);
export function nativeVolumeCapability(value){
 if(!object(value)||value.schema!==2||value.read!==true||typeof value.write!=='boolean'||!Number.isInteger(value.max_volumes)||value.max_volumes<1||value.max_volumes>16||!Array.isArray(value.fields)||value.fields.length!==21)return null;
 if(!Array.isArray(value.allocation_modes)||value.allocation_modes.length!==2||value.allocation_modes[0]!=='preserve'||value.allocation_modes[1]!=='built_area'||!Array.isArray(value.shared_resources)||value.shared_resources.length>128)return null;
 const resources=[],resourceIds=new Set();
 for(const resource of value.shared_resources){if(!object(resource)||Object.keys(resource).length!==2||!id(resource.id)||resourceIds.has(resource.id)||typeof resource.label!=='string'||resource.label!==resource.label.trim()||!resource.label||resource.label.length>160||/[\x00-\x1f\x7f]/.test(resource.label))return null;resourceIds.add(resource.id);resources.push({id:resource.id,label:resource.label});}
 const byId=new Map();
 for(const f of value.fields){
  if(!object(f)||!volumeIds.includes(f.id)||byId.has(f.id)||f.derived!==volumeDerived.has(f.id)||f.writable===f.derived||typeof f.writable!=='boolean'||f.nullable!==(f.id!=='name')||typeof f.label!=='string'||!f.label.trim()||f.label.length>160)return null;
  const type=f.id==='name'?'text':volumeIntegers.has(f.id)?'integer':'number';
  if(f.type!==type||f.id==='units_per_level'&&f.label!=='Viviendas por planta · promedio')return null;
  const step=f.id==='units_per_level'?0.000001:type==='integer'?1:0.01;
  if(type!=='text'&&(f.step!==step||f.min!==undefined&&!Number.isFinite(f.min)||f.max!==undefined&&!Number.isFinite(f.max)||f.min!==undefined&&f.max!==undefined&&f.min>f.max))return null;
  if(f.writable&&type!=='text'&&(!Number.isFinite(f.min)||!Number.isFinite(f.max)))return null;
  byId.set(f.id,{id:f.id,label:f.label,type,nullable:f.nullable,writable:f.writable,derived:f.derived,...(type!=='text'?{step,...(f.min!==undefined?{min:f.min}:{}),...(f.max!==undefined?{max:f.max}:{})}:{})});
 }
 return{schema:2,read:true,write:value.write,max_volumes:value.max_volumes,allocation_modes:['preserve','built_area'],shared_resources:resources,fields:volumeIds.map(key=>byId.get(key))};
}
export function nativeVolumeCollection(value,capability,{write=false}={}){
 const cap=nativeVolumeCapability(capability);
 if(!cap||!object(value)||Object.keys(value).length!==4||Object.keys(value).some(k=>!['schema','count','shared_allocation_mode','volumes'].includes(k))||value.schema!==2||!cap.allocation_modes.includes(value.shared_allocation_mode)||!Number.isInteger(value.count)||value.count<1||value.count>cap.max_volumes||!Array.isArray(value.volumes)||value.volumes.length<value.count||value.volumes.length>cap.max_volumes)throw Error('invalid_volumes');
 const fields=cap.fields.filter(f=>!write||f.writable),seen=new Set();
 return{schema:2,count:value.count,shared_allocation_mode:value.shared_allocation_mode,volumes:value.volumes.map(row=>{
  if(!object(row)||Object.keys(row).length!==2||!id(row.id)||seen.has(row.id)||!object(row.values)||Object.keys(row.values).length!==fields.length||Object.keys(row.values).some(k=>!fields.some(f=>f.id===k)))throw Error('invalid_volumes');
  seen.add(row.id);const values={};
  for(const f of fields){const v=row.values[f.id];if(f.type==='text'?!text(v):v!==null&&(typeof v!=='number'||!Number.isFinite(v)||f.type==='integer'&&!Number.isInteger(v)||f.writable&&(v<f.min||v>f.max)))throw Error('invalid_volumes');values[f.id]=v;}
  return{id:row.id,values};
 })};
}
const sameCollection=(a,b,cap,write=false)=>{try{return JSON.stringify(nativeVolumeCollection(a,cap,{write}))===JSON.stringify(nativeVolumeCollection(b,cap,{write}));}catch{return false;}};
const drivers=(full,cap)=>{const c=nativeVolumeCollection(full,cap),keys=new Set(cap.fields.filter(f=>f.writable).map(f=>f.id));return{schema:2,count:c.count,shared_allocation_mode:c.shared_allocation_mode,volumes:c.volumes.map(row=>({id:row.id,values:Object.fromEntries(Object.entries(row.values).filter(([key])=>keys.has(key)))}))};};
export function nativeVolumeProposal(board,proposal,link,{now=Date.now(),confirm=true}={}){
 if(!board?.confirmed||board.pending)throw Error('board_pending');
 const cap=nativeVolumeCapability(board.capabilities?.volumes);
 if(!cap?.write||board.metadata?.model_type!=='vertical')throw Error('unsupported');
 if(proposal?.kind!=='native_volumes'||!id(proposal.request_id)||proposal.case_id!==board.case_id||proposal.board_case_id!==link?.board_case_id||proposal.scenario_id!==board.scenario_id||proposal.revision!==board.revision||proposal.base_revision&&proposal.base_revision!==proposal.revision)throw Error('stale');
 const before=nativeVolumeCollection(proposal.before_volumes,cap),volumes=nativeVolumeCollection(proposal.volumes,cap,{write:true});
 if(!sameCollection(before,board.volumes,cap))throw Error('stale');
 if(confirm){
  const requested=Date.parse(proposal.apply_requested_at),expires=Date.parse(proposal.apply_expires_at);
  if(proposal.user_confirmed!==true||!Number.isFinite(requested)||!Number.isFinite(expires))throw Error('confirmation_required');
  if(requested>now+5000||expires<=now||expires<=requested||expires-requested>120000)throw Error('confirmation_expired');
 }
 return{...proposal,before_volumes:before,volumes};
}
// Receipt lookup is a separate read-only route. It never reuses write eligibility.
export function nativeVolumeReconciliation(board,proposal,link){
 const cap=nativeVolumeCapability(board?.capabilities?.volumes);
 if(!cap?.read||board.metadata?.model_type!=='vertical')throw Error('unsupported');
 if(proposal?.kind!=='native_volumes'||!id(proposal.request_id)||proposal.case_id!==board.case_id||proposal.board_case_id!==link?.board_case_id||proposal.scenario_id!==board.scenario_id||board.version_context?.viewed_scenario_id&&board.version_context.viewed_scenario_id!==proposal.scenario_id||!revision(proposal.revision)||proposal.base_revision&&proposal.base_revision!==proposal.revision)throw Error('stale');
 if(proposal.user_confirmed!==true||!Number.isFinite(Date.parse(proposal.apply_requested_at)))throw Error('confirmation_required');
 return{...proposal,before_volumes:nativeVolumeCollection(proposal.before_volumes,cap),volumes:nativeVolumeCollection(proposal.volumes,cap,{write:true}),reconcile_only:true};
}
export function proposalDiscardPayload(proposal){
 if(!id(proposal?.request_id))throw Error('invalid_proposal');
 if(proposal.kind!=='native_volumes')return{request_id:proposal.request_id,status:'discarded'};
 if(proposal.apply_requested_at)throw Error('confirmation_pending');
 if(!id(proposal.case_id)||!id(proposal.scenario_id)||!revision(proposal.revision)||proposal.base_revision&&proposal.base_revision!==proposal.revision)throw Error('invalid_proposal');
 return{request_id:proposal.request_id,status:'discarded',case_id:proposal.case_id,scenario_id:proposal.scenario_id,base_revision:proposal.revision};
}
const prewriteErrors=new Set(['revision_conflict','active_driver_missing','protected_native_driver','native_formula_missing','native_formula_manifest_changed','native_geometry_conflict','native_horizon_conflict','shared_allocation_requires_reconciliation','volume_identity_conflict']);
export function nativeVolumeRejection(value,proposal,caseId,link){
 const proof=value?.prewrite_rejection,keys=['request_id','caso_id','escenario_id','base_revision','actor','payload_hash','stage','write_attempted','error','rejected_at'];
 if(value?.ok!==false||value.status!=='rejected'||proposal?.kind!=='native_volumes'||!id(proposal.request_id)||proposal.case_id!==caseId||proposal.board_case_id!==link?.board_case_id||value.request_id!==proposal.request_id||value.case_id!==caseId||value.board_case_id!==proposal.board_case_id||value.scenario_id!==proposal.scenario_id||value.base_revision!==proposal.revision||!object(proof)||Object.keys(proof).length!==keys.length||Object.keys(proof).some(k=>!keys.includes(k))||proof.request_id!==proposal.request_id||proof.caso_id!==proposal.board_case_id||proof.escenario_id!==proposal.scenario_id||proof.base_revision!==proposal.revision||typeof proof.actor!=='string'||!proof.actor.trim()||proof.actor.length>320||/[\x00-\x1f\x7f]/.test(proof.actor)||!/^[a-f0-9]{64}$/.test(proof.payload_hash)||proof.stage!=='prewrite'||proof.write_attempted!==false||!prewriteErrors.has(proof.error)||!Number.isFinite(Date.parse(proof.rejected_at)))throw Error('rejection_response_mismatch');
 return{kind:'native_volumes',status:'rejected',request_id:value.request_id,case_id:caseId,board_case_id:proposal.board_case_id,scenario_id:proposal.scenario_id,base_revision:proposal.revision,revision:null,prewrite_rejection:Object.fromEntries(keys.map(key=>[key,proof[key]]))};
}
export function nativeVolumeReceipt(value,proposal,board,link){
 const cap=nativeVolumeCapability(board?.capabilities?.volumes),superseded=value?.status==='confirmed_superseded';
 if(!cap||proposal?.kind!=='native_volumes'||!id(value?.request_id)||value.ok!==true||value.status!==undefined&&!['confirmed','applied','confirmed_superseded'].includes(value.status)||value.request_id!==proposal.request_id||value.case_id!==proposal.case_id||value.scenario_id!==proposal.scenario_id||value.board_case_id!==undefined&&value.board_case_id!==proposal.board_case_id||value.base_revision!==proposal.revision||!revision(value.revision)||typeof value.calculated!=='boolean'||proposal.board_case_id!==link?.board_case_id||board.case_id!==proposal.case_id||board.scenario_id!==proposal.scenario_id||board.confirmed!==true||board.pending)throw Error('receipt_response_mismatch');
 const collection=nativeVolumeCollection(value.native_collection,cap);
 if(!sameCollection(drivers(collection,cap),proposal.volumes,cap,true))throw Error('receipt_response_mismatch');
 let current;
 if(superseded){
  if(!revision(value.current_revision)||value.current_revision!==board.revision||value.current_revision===value.revision)throw Error('receipt_response_mismatch');
  current=nativeVolumeCollection(value.current_collection,cap);
  if(!sameCollection(current,board.volumes,cap))throw Error('receipt_response_mismatch');
 }else if(board.revision!==value.revision||!sameCollection(collection,board.volumes,cap))throw Error('receipt_response_mismatch');
 return{kind:'native_volumes',request_id:value.request_id,case_id:value.case_id,board_case_id:proposal.board_case_id,scenario_id:value.scenario_id,base_revision:value.base_revision,revision:value.revision,native_collection:collection,calculated:value.calculated,...(superseded?{status:'confirmed_superseded',current_revision:value.current_revision,current_collection:current}:{})};
}
