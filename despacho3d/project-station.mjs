// A station belongs to the currently authorized case. A title is never a board identifier.
const id = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(value);
const pages = new Set(['patrimonial.html','vertical.html','mixto.html','macrolotes.html','unifamiliar.html','residencial.html']);
// VERTICAL is served by mixto.html. Only the native patrimonial Store speaks the shared-board protocol.
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
   if(bridge)clean.searchParams.set('agent','1');
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
