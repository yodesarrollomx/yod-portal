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
