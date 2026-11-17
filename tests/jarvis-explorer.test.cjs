const test = require('node:test'), assert = require('node:assert/strict');
const M = require('../jarvis/explorer-model.js');
const nodes = [{id:'a',source_file:'06_yod/voz/jarvis.html.inline-0.js',source_location:'L25',community:1,label:'hablar()',_callable:true},{id:'b',source_file:'06_yod/voz/motor.py',community:2,label:'Motor',_callable_class:true}];
test('consulta conserva IDs, línea HTML, miembros y dirección de aristas nativas', () => {
  const idx=M.index({nodes,links:[{source:'a',target:'b',relation:'calls'}]});
  assert.equal(M.line(nodes[0].source_location),25);
  assert.equal(idx.files.get('06_yod/voz/jarvis.html')[0].id,'a');
  assert.equal(idx.incoming.get('b')[0].source,'a');
  assert.equal(M.communityName(idx.communities.get(1)).subtitle,'hablar()');
  assert.deepEqual(M.aggregate(idx,n=>M.original(n.source_file)),[{from:'06_yod/voz/jarvis.html',to:'06_yod/voz/motor.py',count:1}]);
});
test('rutas locales sólo relativas de código, sin traversal ni secretos',()=>{
  for(const p of ['/etc/test.py','a/../test.py','a/.env.js','a/.ssh/test.py','a/secret.json','a\\x.py','a/\0.py'])assert.throws(()=>M.safeParts(p));
  assert.deepEqual(M.safeParts('06_yod/voz/jarvis.html.inline-0.js'),['06_yod','voz','jarvis.html']);
});
test('reporte inválido nunca implica sin cambios',()=>{
  const now=Date.now();
  for(const s of [null,{baseline:'other',changes:[],checked_at:new Date(now).toISOString()},{baseline:'cut',changes:[],checked_at:new Date(now-900001).toISOString()}])assert.equal(M.statusInfo(s,'cut',now).fresh,false);
  assert.equal(M.statusInfo({baseline:'cut',changes:[],checked_at:new Date(now).toISOString()},'cut',now).fresh,true);
});
test('lector de fuentes sólo inspecciona bytes locales y diferencia huellas',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
 const scope={JarvisGraph:M,crypto:crypto.webcrypto,TextDecoder,Uint8Array,Map,document:{},window:{}};
 vm.runInNewContext(fs.readFileSync('jarvis/source-reader.js','utf8'),scope);
 const bytes=Buffer.from('<script>unsafe()</script>'), expected={path:'06_yod/voz/jarvis.html',sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 const file={name:'jarvis.html',size:bytes.length,arrayBuffer:async()=>bytes};
 const result=await scope.JarvisSource.inspect(file,expected);assert.equal(result.matches,true);assert.equal(result.text,bytes.toString());
 assert.equal((await scope.JarvisSource.inspect(file,{...expected,sha256:'different'})).matches,false);
 await assert.rejects(scope.JarvisSource.inspect({...file,name:'otro.html'},expected),/Elige el archivo/);
 await assert.rejects(scope.JarvisSource.inspect({...file,size:6*1024*1024},expected),/5 MB/);
});
test('las rutas nativas e índice cargan un solo visor y conservan el export original',()=>{
 const fs=require('node:fs'),manifest=JSON.parse(fs.readFileSync('jarvis/manifest.json'));
 for(const group of manifest.groups){assert.match(fs.readFileSync('jarvis/data/'+group.id+'.html','utf8'),/source-reader.js/);assert.match(fs.readFileSync('jarvis/data/'+group.id+'-original.html','utf8'),/const RAW_NODES/);}
});
