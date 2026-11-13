const test=require('node:test'),assert=require('node:assert/strict');
const library=()=>import('../despacho3d/biblioteca.mjs');
const CASE='SYNTHETIC_CASE',LINK='https://drive.google.com/file/d/SYNTHETIC_FILE_1234/view';
const source={id:'synthetic-source',nombre:'Fuente de ejemplo',papel:'Documento registrado',enlace:LINK,estado:'ready',indexado_en:'2026-10-05T00:00:00Z'};
const response=()=>({ok:true,estado:{phase:'ready',documents:1,indexed:1,sources:[source]},pasajes:[{id:'synthetic-source:0',texto:'Texto  exacto',pagina:2,fuente:{nombre:'Fuente de ejemplo',enlace:LINK,modificado:'2026-10-05T00:00:00Z',consultado:'2026-10-05T01:00:00Z'}}]});
const credential=id=>({ok:true,case_id:id,token:'A'.repeat(40)+'.'+'a'.repeat(64),endpoint:'https://synthetic-cloud.onrender.com',expires_at:Date.now()+600000});
test('biblioteca valida fuentes/títulos y conserva texto y páginas exactos',async()=>{
 const {validateLibrary}=await library(),raw=response();
 const value=validateLibrary(raw);assert.equal(value.pasajes[0].texto,'Texto  exacto');assert.equal(value.pasajes[0].pagina,2);
 for(const change of [
  r=>r.estado.sources[0].enlace='https://evil.test/private',
  r=>r.estado.indexed=2,
  r=>r.pasajes[0].pagina=-1,
  r=>r.pasajes[0].texto='x'.repeat(1001),
  r=>r.estado.sources[0].indexado_en='forged'
 ]){const r=structuredClone(raw);change(r);assert.throws(()=>validateLibrary(r),/unavailable/);}
});
test('consulta usa credencial temporal; pregunta en cuerpo, sin selección de actor/caso, URL ni storage',async()=>{
 const {createLibraryClient}=await library();let mints=0;const calls=[];
 const client=createLibraryClient({mint:async p=>{mints++;return credential(p.case_id);},fetchImpl:async(url,opts)=>{
  calls.push({url,opts});return {ok:true,status:200,json:async()=>response()};}});
 await client.load(CASE);await client.search(CASE,'clave del proyecto');
 assert.equal(mints,1);assert.equal(calls[0].opts.credentials,'omit');
 assert.equal(calls[1].url,'https://synthetic-cloud.onrender.com/fast/knowledge/search');
 assert.deepEqual(JSON.parse(calls[1].opts.body),{consulta:'clave del proyecto'});
 assert.equal(calls[1].opts.headers.Authorization,'Bearer '+credential(CASE).token);client.dispose();
});
test('cambio de expediente descarta credencial y respuestas tardías de la sesión anterior',async()=>{
 const {createLibraryClient}=await library();let release;
 const client=createLibraryClient({mint:async p=>credential(p.case_id),fetchImpl:()=>new Promise(r=>{release=r;})});
 const first=client.load(CASE);
 while(!release)await new Promise(r=>setTimeout(r,1));
 client.reset();release({ok:true,status:200,json:async()=>response()});
 await assert.rejects(first,/cancelled/);client.dispose();
});
test('revocación borra credencial y no reintenta la consulta automáticamente',async()=>{
 const {createLibraryClient}=await library();let requests=0,mints=0;
 const client=createLibraryClient({mint:async p=>{mints++;return credential(p.case_id);},fetchImpl:async()=>{requests++;return{ok:false,status:401};}});
 await assert.rejects(client.load(CASE),/unauthorized/);assert.equal(requests,1);
 await assert.rejects(client.load(CASE),/unauthorized/);assert.equal(mints,2);client.dispose();
});
test('errores de proveedor no exponen detalles y consulta inválida no usa la API',async()=>{
 const {createLibraryClient}=await library();let calls=0;
 const client=createLibraryClient({mint:async p=>credential(p.case_id),fetchImpl:async()=>{calls++;return{ok:false,status:500,json:async()=>({error:'secret-provider-details'})};}});
 await assert.rejects(client.search(CASE,'x'),/invalid_request/);assert.equal(calls,0);
 await assert.rejects(client.load(CASE),/^Error: unavailable$/);client.dispose();
});
