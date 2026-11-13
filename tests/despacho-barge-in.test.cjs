const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/voice-input-monitor.mjs');
test('local overlap gate ignores clicks, ducks sustained input and releases after quiet',async()=>{
 const {createActivityGate}=await load(),g=createActivityGate();
 assert.equal(g.sample(.1,0),false);assert.equal(g.sample(0,40),false);
 for(const t of [80,120,160])assert.equal(g.sample(.08,t),false);
 assert.equal(g.sample(.08,200),true);
 assert.equal(g.sample(0,240),true);
 for(const t of [280,320,360,400,440,480,520,560,600,640])g.sample(0,t);
 assert.equal(g.sample(0,680),false);
});
test('continuous noise cannot hold output muted forever and a scheduling gap resets detection',async()=>{
 const {createActivityGate}=await load(),g=createActivityGate({maxHoldMs:400});
 for(let t=0;t<=480;t+=40)g.sample(.09,t);
 assert.equal(g.sample(.09,520),false);assert.equal(g.sample(.09,560),false);
 for(let t=600;t<=1080;t+=40)g.sample(0,t);
 for(const t of [1120,1160,1200])assert.equal(g.sample(.09,t),false);
 assert.equal(g.sample(.09,1240),true);
 assert.equal(g.sample(.09,2000),false);assert.equal(g.sample(NaN,2040),false);
});
test('quiet background stays audible and disabled monitor never opens a capture or touches tracks',async()=>{
 const {createActivityGate,createLocalInputMonitor}=await load(),g=createActivityGate();
 for(let t=0;t<20000;t+=40)assert.equal(g.sample(.009,t),false);
 let creates=0;
 const noop=createLocalInputMonitor({stream:{getAudioTracks:()=>[{getSettings:()=>({echoCancellation:false})}]},AudioContext:class{constructor(){creates++;}}});
 noop.close();assert.equal(creates,0);
});
test('monitor releases local attenuation on mute, suspension, failure and disposal without stopping input',async()=>{
 const {createLocalInputMonitor}=await load();let clock=0,level=.08,tick,enabled=true,closed=0,disconnected=0,context;
 const values=[],track={stop(){assert.fail('monitor must not stop the authorized track');}};
 class Context{
  constructor(){context=this;this.state='running';}
  createMediaStreamSource(){return{connect(){},disconnect(){disconnected++;}};}
  createAnalyser(){return{fftSize:0,getFloatTimeDomainData(a){a.fill(level);},disconnect(){disconnected++;}};}
  close(){closed++;return Promise.resolve();}
 }
 const m=createLocalInputMonitor({stream:{getAudioTracks:()=>[track]},AudioContext:Context,now:()=>clock,enabled:()=>enabled,
  schedule:fn=>{tick=fn;return 1;},cancel:id=>assert.equal(id,1),onActivity:v=>values.push(v)});
 const advance=()=>{tick();clock+=40;};
 for(let i=0;i<4;i++)advance();assert.deepEqual(values,[true]);
 enabled=false;advance();assert.deepEqual(values,[true,false]);
 enabled=true;for(let i=0;i<4;i++)advance();assert.equal(values.at(-1),true);
 context.state='suspended';context.onstatechange();assert.equal(values.at(-1),false);
 context.state='running';for(let i=0;i<4;i++)advance();assert.equal(values.at(-1),true);
 m.close();m.close();assert.equal(values.at(-1),false);assert.equal(closed,1);assert.equal(disconnected,2);
 tick();assert.equal(values.at(-1),false);
});
test('unsupported or blocked audio analysis leaves the existing provider interruption available',async()=>{
 const {createLocalInputMonitor}=await load();
 for(const AudioContext of [null,class{constructor(){throw Error('blocked');}}]){
  const values=[];const m=createLocalInputMonitor({stream:{getAudioTracks:()=>[{}]},AudioContext,onActivity:v=>values.push(v)});
  m.resume();m.close();assert.deepEqual(values,[]);
 }
});
