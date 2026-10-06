const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),url=require('node:url');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('workspace keeps same case in board URL and rejects arbitrary identifiers',async()=>{
 const m=await import(url.pathToFileURL(path.join(__dirname,'../despacho3d/agent-workspace.mjs')));
 assert.match(m.boardURL('case-synthetic'),/open=case-synthetic&embed=1&agent=1$/);
 assert.throws(()=>m.boardURL('../other'));assert.equal(m.WORKSPACE_TABS.length,5);
});
test('workspace and voice are mounted together without a second media request',()=>{
 const s=read('despacho3d/live-voice-boot.mjs');
 assert.match(s,/voice-layout/);assert.match(s,/workspace\.open\(fresh,'browser'\)/);
 assert.match(s,/voice-view-tasks.*workspace.setTab/);
 assert.doesNotMatch(read('despacho3d/agent-workspace.mjs'),/getUserMedia|sessionStorage|localStorage|innerHTML/);
 assert.match(read('despacho3d/agent-workspace.mjs'),/e\.source!==frame\?\.contentWindow/);
 assert.match(read('despacho3d/index.html'),/agent-workspace-boot\.mjs\?v=2/);
});
