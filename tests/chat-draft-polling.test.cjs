const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('despacho3d/live-voice-core.mjs','utf8');
// Execute the production interval, with controlled UI and conversation state.
function harness(){
 let tick,reads=0;
 const draft={value:'Mi consulta'},chat={selection:{case_id:'synthetic'},busy:false,canSend:true,refresh(){reads++;}};
 const dialog={open:true,querySelector:()=>({open:true})},document={hidden:false},state={phase:'idle'};
 vm.runInNewContext(source.match(/chatTimer=setInterval\([^\n]+/)[0],{chatTimer:null,chat,dialog,document,node:()=>draft,voice:{snapshot:()=>state},active:s=>s.phase!=='idle',setInterval:fn=>{tick=fn;return 1;}});
 return {tick,chat,draft,dialog,document,state,reads:()=>reads};
}
test('validated draft remains sendable across repeated background intervals',()=>{
 const h=harness();for(let i=0;i<8;i++)h.tick();assert.equal(h.reads(),0);
 h.draft.value='';h.tick();assert.equal(h.reads(),1,'history resumes after send or clearing draft');
});
test('draft does not suppress recovery when stale or missing permission prevents sending',()=>{
 const h=harness();h.chat.canSend=false;h.tick();assert.equal(h.reads(),1);
});
test('poll retains closed, hidden, busy and voice gates',()=>{
 for(const block of [h=>h.dialog.open=false,h=>h.document.hidden=true,h=>h.chat.busy=true,h=>h.state.phase='listening',h=>h.chat.selection=null]){
  const h=harness();h.draft.value='';block(h);h.tick();assert.equal(h.reads(),0);
 }
});
