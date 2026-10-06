const test=require('node:test'),assert=require('node:assert/strict');
const knowledge=()=>import('../despacho3d/knowledge-board.mjs');
const CASE='synthetic-case',STAMP='2026-10-05T12:00:00Z';
const record=(id='version-1')=>({id,title:'Estudio guardado',kind:'version',status:'confirmed',summary:'Lectura del modelo',source_ids:['source-1'],updated_at:STAMP,scenario_id:'scenario-test',source_revision:'ppp-1',parent_id:null,modality:null});
const board=(revision='0')=>({ok:true,schema:1,case_id:CASE,revision,updated_at:STAMP,capabilities:{jev:'available',obsidian:'unavailable',obsidian_export:'available'},facts:[{id:'fact-1',title:'Medida declarada',value:12,unit:'m',status:'declared',source_ids:['source-1'],updated_at:STAMP}],versions:[record()],decisions:[],next_steps:[],sources:[{id:'source-1',title:'Documento',url:'https://example.test/source',consulted_at:STAMP}]});
const receipt=p=>({ok:true,request_id:p.request_id,revision:'1',version:{...record('version-2'),title:p.title,kind:p.kind,parent_id:p.parent_id},duplicate:false});
test('knowledge validates authority, provenance, explicit capability and distinct modality/variant',async()=>{
 const {validateKnowledgeBoard,knowledgeSourceURL}=await knowledge();
 const value=validateKnowledgeBoard(board(),CASE);assert.equal(value.facts[0].status,'declared');assert.equal(value.capabilities.obsidian,'unavailable');assert.equal(value.versions[0].modality,undefined);
 for(const mutate of [v=>v.case_id='another-case',v=>v.sources[0].url='javascript:alert(1)',v=>v.sources[0].url='https://user:secret@example.test',v=>v.sources[0].url='https://example.test\n/path',v=>v.facts[0].source_ids=['unknown'],v=>v.versions[0].status='approved',v=>v.capabilities.obsidian=true,v=>v.revision=4]){
  const raw=board();mutate(raw);assert.throws(()=>validateKnowledgeBoard(raw,CASE),/invalid_knowledge/);
 }
 assert.equal(knowledgeSourceURL('http://example.test/source'),'http://example.test/source');
});
test('capture sends only metadata and retries the identical intent after uncertain persistence',async()=>{
 const {KnowledgeBoard}=await knowledge();const calls=[];let captures=0;
 const client=new KnowledgeBoard({getCase:()=>CASE,uuid:()=> 'request-test',request:async(path,data)=>{
  calls.push({path,data:structuredClone(data)});if(path.endsWith('/board'))return board();
  captures++;if(captures===1)throw Error('storage_unavailable');return receipt(data);
 }});
 client.open(CASE);await client.load();assert.equal(await client.capture({title:'Alternativa A',kind:'variant',parent_id:'version-1'}),false);
 assert.equal(client.state().status,'unconfirmed');assert.equal(client.state().pending.request_id,'request-test');
 assert.equal(await client.capture({title:'Nueva',kind:'version'}),false);
 assert.equal(await client.retry(),true);assert.equal(client.state().pending,null);
 assert.deepEqual(calls[1].data,calls[2].data);
 assert.deepEqual(Object.keys(calls[1].data).sort(),['expected_revision','kind','parent_id','request_id','title']);
 assert.equal(calls[1].data.expected_revision,'0');assert.equal(calls.length,3);
});
test('malformed receipts stay unconfirmed and definitive conflict requires fresh read/new user action',async()=>{
 const {KnowledgeBoard}=await knowledge();let code='malformed';
 const client=new KnowledgeBoard({getCase:()=>CASE,uuid:()=> 'request-test',request:async(path,p)=>{
  if(path.endsWith('/board'))return board();if(code==='malformed')return {...receipt(p),request_id:'wrong'};throw Error(code);
 }});
 client.open(CASE);await client.load();await client.capture({title:'Lectura',kind:'version'});assert.equal(client.state().status,'unconfirmed');
 code='stale_revision';await client.retry();assert.equal(client.state().status,'conflict');assert.equal(client.state().pending,null);
});
test('capture response after case change is ignored; revoked model and sources are cleared',async()=>{
 const {KnowledgeBoard}=await knowledge();let current=CASE,release;
 const client=new KnowledgeBoard({getCase:()=>current,request:async(path,p)=>path.endsWith('/board')?board():new Promise(resolve=>{release=()=>resolve(receipt(p));})});
 client.open(CASE);await client.load();const flight=client.capture({title:'Lectura',kind:'version'});current='other-case';client.open(current);release();assert.equal(await flight,false);assert.equal(client.state().model,null);assert.equal(client.state().pending,null);
 current=CASE;const revoked=new KnowledgeBoard({getCase:()=>current,request:async()=>{throw Error('unauthorized');}});revoked.open(CASE);await revoked.load();assert.equal(revoked.state().model,null);assert.equal(revoked.state().notice.includes('acceso'),true);
});
test('hiding a panel drops visible data but preserves uncertain request for explicit retry',async()=>{
 const {KnowledgeBoard}=await knowledge();let p;
 const client=new KnowledgeBoard({getCase:()=>CASE,request:async(path,payload)=>{if(path.endsWith('/board'))return board();p=payload;throw Error('unavailable');}});
 client.open(CASE);await client.load();await client.capture({title:'Lectura',kind:'version'});client.hide();
 assert.equal(client.state().model,null);assert.deepEqual(client.state().pending,p);client.reset();assert.equal(client.state().pending,null);
});
test('export requires explicit availability, keeps errors visible and validates names and relative vault paths',async()=>{
 const {KnowledgeBoard,validateMarkdownExport,validateVaultFiles}=await knowledge();let exports=0;
 const client=new KnowledgeBoard({getCase:()=>CASE,request:async(path)=>{if(path.endsWith('/board'))return board();exports++;throw Error('storage_unavailable');}});
 client.open(CASE);await client.load();assert.equal(await client.exportMarkdown(),null);assert.equal(exports,1);assert.match(client.state().notice,/registro/);
 assert.throws(()=>validateMarkdownExport({ok:true,revision:'0',filename:'../private.md',markdown:'text'}),/invalid_export/);
 for(const path of ['../escape.md','/absolute.md','folder\\escape.md','folder/../escape.md','C:escape.md','a//b.md'])assert.throws(()=>validateVaultFiles([{path,content:'text'}]),/invalid_export/);
 assert.throws(()=>validateVaultFiles([{path:'README.md',content:'a'},{path:'readme.md',content:'b'}]),/invalid_export/);
 assert.throws(()=>validateVaultFiles([{path:'large.md',content:'á'.repeat(1100000)}]),/invalid_export/);
 const raw=board();raw.capabilities.obsidian_export='unavailable';const disabled=new KnowledgeBoard({getCase:()=>CASE,request:async()=>raw});disabled.open(CASE);await disabled.load();assert.equal(await disabled.exportMarkdown(),null);
});
test('portable ZIP contains original UTF-8 bytes, safe paths, correct sizes and CRC without compression',async()=>{
 const {createVaultZip}=await knowledge(),files=[{path:'README.md',content:'# Expediente\n[[Versiones/Alternativa]]\n'},{path:'Versiones/Alternativa.md',content:'# Alternativa\nÁrea pendiente.\n'}];
 const zip=new Uint8Array(await createVaultZip(files).arrayBuffer()),view=new DataView(zip.buffer);let offset=0;const decoder=new TextDecoder(),crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=c&1?(c>>>1)^0xedb88320:c>>>1;}return(c^0xffffffff)>>>0;};
 for(const file of files){assert.equal(view.getUint32(offset,true),0x04034b50);const size=view.getUint32(offset+18,true),n=view.getUint16(offset+26,true),name=decoder.decode(zip.slice(offset+30,offset+30+n)),data=zip.slice(offset+30+n,offset+30+n+size);assert.equal(name,file.path);assert.equal(decoder.decode(data),file.content);assert.equal(view.getUint32(offset+14,true),crc(data));assert.equal(view.getUint16(offset+8,true),0);offset+=30+n+size;}
 assert.equal(view.getUint32(offset,true),0x02014b50);assert.equal(view.getUint32(zip.length-22,true),0x06054b50);assert.equal(view.getUint16(zip.length-14,true),2);
});
test('comparison describes recorded values, gaps and units without inferring a winner',async()=>{
 const {validateKnowledgeComparison,KnowledgeBoard}=await knowledge();
 const raw={ok:true,case_id:CASE,revision:'0',left_id:'version-1',right_id:'version-2',source_revisions:['ppp-1','ppp-2'],observed_at:[STAMP,STAMP],changes:[{section:'inputs',field:'area',before:10,after:12,before_present:true,after_present:true,before_unit:'m2',after_unit:'m2',delta:2}],evaluations:[],gaps:[{code:'criteria_required_for_evaluation'}],recommendation:null,scope:'recorded_snapshots',warning:'Comparación registrada.'};
 assert.equal(validateKnowledgeComparison(raw,'version-1','version-2',CASE).changes[0].delta,2);
 assert.throws(()=>validateKnowledgeComparison({...raw,recommendation:'right'},'version-1','version-2',CASE),/invalid_comparison/);
 const b=board();b.versions.push(record('version-2'));let payload;
 const client=new KnowledgeBoard({getCase:()=>CASE,request:async(path,p)=>{if(path.endsWith('/board'))return b;payload=p;return raw;}});
 client.open(CASE);await client.load();assert.ok(await client.compare('version-1','version-2'));assert.deepEqual(payload,{left_id:'version-1',right_id:'version-2',criteria:[]});
});
test('stopped parent never presents an old running task as ongoing execution',async()=>{
 const {taskDisplay}=await import('../despacho3d/agent-workspace.mjs');const task={status:'running'};
 for(const parent of ['stopped','awaiting_data','ready_for_review','completed'])assert.equal(taskDisplay(task,parent),'Interrumpida · pendiente de conciliación');
 assert.equal(taskDisplay(task,'running'),'Trabajando');assert.equal(task.status,'running');
});

test('empty case has no invented update time; real model metadata remains distinct from variant kind',async()=>{
 const {validateKnowledgeBoard}=await knowledge(),raw=board();
 raw.updated_at=null;raw.versions[0].kind='variant';raw.versions[0].modality='Patrimonial';raw.versions[0].model_revision='model-r3';raw.versions[0].horizon={value:8,unit:'year'};
 const value=validateKnowledgeBoard(raw,CASE);assert.equal(value.updated_at,null);assert.equal(value.versions[0].kind,'variant');assert.equal(value.versions[0].modality,'Patrimonial');assert.deepEqual(value.versions[0].horizon,{value:8,unit:'year'});
 raw.versions[0].horizon={value:8,unit:'guessed'};assert.throws(()=>validateKnowledgeBoard(raw,CASE),/invalid_knowledge/);
});
