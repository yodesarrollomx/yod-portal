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
