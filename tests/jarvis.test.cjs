'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const scope=require('../jarvis/explorer-model.js');
test('latido ausente, viejo o de otro corte no equivale a sin cambios',()=>{
 const now=Date.now(),baseline='cut';
 for(const s of [null,{baseline:'old',checked_at:new Date(now).toISOString()},{baseline,checked_at:new Date(now-16*60e3).toISOString()}])assert.equal(scope.statusInfo(s,baseline,now).fresh,false);
 assert.equal(scope.statusInfo({baseline,checked_at:new Date(now).toISOString(),changes:[{file:'a',status:'modified'}]},baseline,now).fresh,true);
});
test('salidas nativas completas, anclas HTML y procedencia oficial',()=>{
 const m=JSON.parse(fs.readFileSync('jarvis/manifest.json'));let nodes=0,edges=0;
 assert.equal(m.groups.length,8);assert.ok(m.files.some(f=>f.html_source?.endsWith('jarvis.html')));
 for(const g of m.groups){const bytes=zlib.gunzipSync(fs.readFileSync('jarvis/data/'+g.id+'.json.gz'));const data=JSON.parse(bytes);nodes+=data.nodes.length;edges+=(data.edges||data.links).length;assert.equal(require('crypto').createHash('sha256').update(bytes).digest('hex'),g.sha256);}
 assert.equal(nodes,m.nodes);assert.equal(edges,m.edges);
 const p=JSON.parse(fs.readFileSync('jarvis/provenance.json'));assert.equal(p.checked_files,233);assert.deepEqual(p.different_files,[]);
});
