const test=require('node:test');const assert=require('node:assert/strict');
test('meeting manifest refuses gaps and uses actual stored blob sizes',async()=>{
 const {manifest}=await import('../reuniones/journal.mjs');
 assert.deepEqual(manifest([{seq:0,hash:'abc',blob:new Blob(['123'])}]),[{seq:0,sha256:'abc',size:3}]);
 assert.throws(()=>manifest([{seq:1,hash:'abc',blob:new Blob(['123'])}]));
});
test('upload never marks an unverified receipt as backed up',async()=>{
 const {synchronize}=await import('../reuniones/journal.mjs');let saved=false;
 const journal={chunks:async()=>[{seq:0,hash:'correct',blob:new Blob(['abc']),duration:5}],tx:async()=>{saved=true;}};
 let calls=0;const fetcher=async()=>({ok:true,json:async()=>++calls===1?{}:{seq:0,sha256:'wrong',size:3,durable:true}});
 await assert.rejects(synchronize(journal,{id:'one',project:'demo',mime:'audio/webm',state:'stopped'},{server:'https://example.com',token:'synthetic'},fetcher),/integridad/);
 assert.equal(saved,false);
});
test('server URL refuses credentials, cleartext remote, and query tokens',async()=>{
 const {endpoint}=await import('../reuniones/journal.mjs');
 for(const url of ['http://example.com','https://user:secret@example.com','https://example.com?token=x','javascript:alert(1)'])assert.throws(()=>endpoint(url));
 assert.equal(endpoint('http://localhost:8787/'),'http://localhost:8787');
});
test('iPhone file import preserves every byte and never seals a failed import',async()=>{
 const {importAudio}=await import('../reuniones/import.mjs');
 const old=Object.getOwnPropertyDescriptor(globalThis,'navigator');Object.defineProperty(globalThis,'navigator',{configurable:true,value:{storage:{estimate:async()=>({quota:100e6,usage:0})}}});
 try {
  const original=new Uint8Array(1048576+17).fill(42),file=new Blob([original]);file.name='notas-de-voz.m4a';
  let session,rows=[];const journal={save:async s=>{session=s;},append:async(s,c)=>{session=s;rows.push(c);}};
  await importAudio(journal,file,'demo');assert.equal(session.state,'stopped');assert.equal(rows.length,2);
  assert.deepEqual(new Uint8Array(await new Blob(rows.map(c=>c.blob)).arrayBuffer()),original);
  journal.append=async()=>{throw Error('disk_full');};
  await assert.rejects(importAudio(journal,file,'demo'),/incompleta/);assert.equal(session.state,'import_incomplete');assert.equal(file.size,original.length);
 }finally{if(old)Object.defineProperty(globalThis,'navigator',old);else delete globalThis.navigator;}
});

test('private handoff validates Drive destinations and does not certify share-sheet upload',async()=>{
  const {driveFolder,audioExtension,handoffText,shareFile}=await import('../reuniones/handoff.mjs');
  assert.equal(driveFolder('https://drive.google.com/drive/folders/demo?usp=sharing'),'https://drive.google.com/drive/folders/demo');
  for(const url of ['javascript:alert(1)','https://drive.google.com.evil.test/drive/folders/demo','https://user@drive.google.com/drive/folders/demo','https://drive.google.com/file/d/demo/view'])assert.throws(()=>driveFolder(url));
  assert.equal(audioExtension('audio/wav'),'wav');
  assert.match(handoffText('demo'),/sin API de pago/);
  assert.throws(()=>handoffText('invalid project'));
  const file=new Blob(['synthetic']);let called=false;
  const receipt=await shareFile(file,{canShare:()=>true,share:async({files})=>{assert.equal(files[0],file);called=true;}});
  assert(called);assert.match(receipt,/todavía no hay un recibo/);
  await assert.rejects(()=>shareFile(file,{canShare:()=>false}),/Descargar audio/);
});
