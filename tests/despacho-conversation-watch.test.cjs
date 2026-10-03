'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../despacho3d/conversation-watch.mjs');
function clock(){let time=0,timer;return {now:()=>time,schedule:(fn,ms)=>{assert.equal(timer,undefined);timer={fn,ms};return fn;},cancel:()=>{timer=undefined;},get delay(){return timer?.ms;},advance:ms=>{time+=ms;},async fire(){const t=timer;timer=undefined;time+=t.ms;return t.fn();}};}
test('slow reads settle before the next timer; stopped jobs end following',async()=>{
 const {watchConversation}=await load(),c=clock();let release,reads=0;
 const conversation={model:{processing:true},busy:false,refresh:()=>{reads++;return new Promise(r=>release=r);}};
 const stop=watchConversation(conversation,c),reading=c.fire();assert.equal(reads,1);assert.equal(c.delay,undefined);
 c.advance(31000);release();await reading;assert.equal(c.delay,10000);
 conversation.refresh=async()=>{reads++;conversation.model.processing=false;};await c.fire();assert.equal(c.delay,undefined);assert.equal(reads,2);stop();
});
test('hidden pages and busy panels do not issue reads or overlapping requests',async()=>{
 const {watchConversation}=await load(),c=clock();let visible=false,reads=0;
 const conversation={model:{processing:true},busy:false,refresh:async()=>{reads++;}};
 const stop=watchConversation(conversation,{...c,visible:()=>visible});await c.fire();assert.equal(reads,0);
 visible=true;conversation.busy=true;await c.fire();assert.equal(reads,0);conversation.busy=false;await c.fire();assert.equal(reads,1);stop();
});
test('the wait limit reports an explicit notice without sending or reading again',async()=>{
 const {watchConversation}=await load(),c=clock();let notices=0,reads=0;
 const conversation={model:{processing:true},busy:false,refresh:async()=>{reads++;}};
 watchConversation(conversation,{...c,onLimit:()=>notices++});c.advance(180000);await c.fire();assert.equal(notices,1);assert.equal(reads,0);assert.equal(c.delay,undefined);
});
test('closing during a read cancels every future read and late notice',async()=>{
 const {watchConversation}=await load(),c=clock();let release;
 const conversation={model:{processing:true},busy:false,refresh:()=>new Promise(r=>release=r)};
 const stop=watchConversation(conversation,{...c,onLimit:()=>assert.fail('closed panel')});const reading=c.fire();stop();c.advance(200000);release();await reading;assert.equal(c.delay,undefined);
});
