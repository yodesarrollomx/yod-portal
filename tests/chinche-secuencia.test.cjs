const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../chinche/secuencia.js'),D=require('../chinche/entrega.js');
global.crypto=require('node:crypto').webcrypto;
const sample=()=>({v:1,width:800,height:600,duration:1000,base:'data:image/jpeg;base64,AA==',frames:[{t:500,image:'data:image/jpeg;base64,AA=='}],events:[{type:'stroke',t:0,tool:'pen',color:'#cc5533',width:3,points:[[1,2,0,.5],[5,6,400,.6]]},{type:'undo',t:600}],audio:{mime:'audio/webm;codecs=opus',offset:0,data:'data:audio/webm;codecs=opus;base64,AA=='}});
test('replay preserves intermediate drawing and later undo',()=>{const s=sample();S.validate(s);assert.equal(S.visibleStrokes(s.events,500).length,1);assert.equal(S.visibleStrokes(s.events,700).length,0);});
test('reject corrupt chronology, coordinates, media and excess length',()=>{for(const mutate of [s=>s.events[0].points[1][2]=-2,s=>s.events[0].points[0][0]=9999,s=>s.audio.data='javascript:alert(1)',s=>s.frames[0].t=2000,s=>s.duration=700000]){const s=sample();mutate(s);assert.throws(()=>S.validate(s));}});
test('monotonic timestamps even if clock reverses',()=>{let t=100;const a=S.timeline(()=>t);t=110;a.add('undo',{});t=105;a.add('undo',{});assert.deepEqual(a.events.map(e=>e.t),[10,10]);});
function note(){return {id:'CHN-20261020-0802-abcd',creado:'2026-10-20T15:02:00Z',texto:'Prueba sintética',repo:'yod-portal',pantalla:'test',url:'https://yodesarrollomx.github.io/yod-portal/',secuencia:sample()};}
test('receipt requires full immutable package hash and post-read',async()=>{let saved,posts=0;const c=D.client({key:()=> 'synthetic',request:async b=>{if(b.accion==='chinche_secuencia_guardar'){posts++;saved=b;return {ok:true,contrato:D.CONTRACT,id:b.id,hash:b.hash};}return {ok:true,contrato:D.CONTRACT,id:b.id,hash:saved?.hash||null};}});assert.equal((await c.send(note())).state,'received');assert.equal((await c.send(note())).state,'received');assert.equal(posts,1);});
test('lost response reconciles without second upload',async()=>{let saved,posts=0;const c=D.client({key:()=> 'synthetic',request:async b=>{if(b.accion.endsWith('_guardar')){posts++;saved=b;throw Error('lost');}return {ok:true,contrato:D.CONTRACT,id:b.id,hash:saved?.hash||null};}});await assert.rejects(c.send(note()));assert.equal((await c.send(note())).state,'received');assert.equal(posts,1);});
test('old backend and changed session never report received or upload',async()=>{let calls=0;const c=D.client({key:()=> 'synthetic',request:async()=>{calls++;return {error:'acción desconocida'};}});assert.equal((await c.send(note())).reason,'backend');assert.equal(calls,1);let key='a';const changed=D.client({key:()=>key,request:async()=>{key='b';return {ok:true,contrato:D.CONTRACT};}});assert.equal((await changed.send(note())).state,'auth-required');});
test('same ID with changed content remains conflict',async()=>{const c=D.client({key:()=> 'synthetic',request:async b=>({ok:true,contrato:D.CONTRACT,id:b.id,hash:'f'.repeat(64)})});assert.equal((await c.send(note())).state,'conflict');});
test('Safari MIME spacing/quotes normalize only headers and preserve original audio bytes',()=>{
 for(const mime of ['audio/mp4; codecs="mp4a.40.2"','audio/mp4; codecs=mp4a.40.2','Audio/WebM; codecs="opus"',' audio/ogg ; codecs=opus ']){const s=sample();s.audio={mime,offset:0,data:'data:'+mime.trim()+';base64,AA=='};S.validate(s);const normalized=S.normalizeAudio(s.audio);assert.equal(normalized.data.split(',').at(-1),'AA==');assert.equal(normalized.originalMime,mime);assert.equal(normalized.originalDataHeader,mime.trim());assert.ok(['audio/mp4','audio/webm','audio/ogg'].includes(normalized.mime));S.validate({...s,audio:normalized});}
});
test('normalization rejects MIME/container mismatch, empty payload and unsupported types without altering original',()=>{
 for(const audio of [{mime:'audio/mp4',data:'data:audio/webm;base64,AA=='},{mime:'audio/mp4; codecs="x";evil=1',data:'data:audio/mp4;base64,AA=='},{mime:'video/mp4',data:'data:video/mp4;base64,AA=='},{mime:'audio/mp4',data:'data:audio/mp4;base64,'}]){const before=JSON.stringify(audio);assert.throws(()=>S.normalizeAudio(audio));assert.equal(JSON.stringify(audio),before);}
});
test('restored timeline continues the original clock and strokes',()=>{let now=100;const line=S.timeline(()=>now,500,[{t:400,type:'undo'}]);now=150;line.add('undo',{});assert.equal(line.time(),550);assert.deepEqual(line.events.map(e=>e.t),[400,550]);});

// Exercise the real pointer callbacks across a rounding boundary, without DOM,
// microphone or network dependencies. The same packet must be valid when
// checkpointed, returned to the host and restored later.
function strokeHarness(){
 const fs=require('node:fs'),vm=require('node:vm');let now=100,times=[],drafts=[];
 const clock=()=>{if(times.length)now=times.shift();return now;},noop=()=>{};
 const drawing=new Proxy({},{get:()=>noop,set:()=>true});
 class Element{
  constructor(tag){this.children=[];this.listeners={};this.style={};this.value=tag==='select'?'pen':'';this.width=100;this.height=100;this.classList={toggle:()=>false};}
  append(...items){this.children.push(...items);}setAttribute(){}remove(){}
  addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
  getContext(){return drawing;}getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}
  setPointerCapture(){}toDataURL(){return 'data:image/jpeg;base64,AA==';}querySelectorAll(){return [];}
 }
 const document={head:new Element('head'),createElement:tag=>new Element(tag),getElementById:()=>null,addEventListener:noop,removeEventListener:noop};
 const context={module:{exports:{}},document,location:{origin:'https://synthetic.invalid',pathname:'/test'},performance:{now:clock},crypto:{randomUUID:()=> 'synthetic-draft'},setTimeout:()=>1,clearTimeout:noop,setInterval:()=>1,clearInterval:noop,addEventListener:noop,removeEventListener:noop,TextEncoder,Promise};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../chinche/secuencia.js'),'utf8'),context);
 const api=context.module.exports,mounted=api.mount(new Element('div'),new Element('canvas'),{draftStore:{put:async d=>drafts.push(JSON.parse(JSON.stringify(d))),list:async()=>[],remove:async()=>{},get:async()=>null}});
 return {api,mounted,drafts,dispatch(type,readings,x,y){times=readings.slice();const event={button:0,isPrimary:true,pointerId:1,clientX:x,clientY:y,pressure:.5,preventDefault:noop};for(const fn of mounted.canvas.listeners[type]||[])fn(event);},at(value){times=[];now=value;}};
}
for(const [label,first,next] of [['rounding boundary',100.49,100.51],['same rounding bucket',100.2,100.25],['clock gap',101,117]]){
 test('stroke starts with one timestamp: '+label,async()=>{
  const h=strokeHarness();h.dispatch('pointerdown',[100.1,first,next,next+.1],20,20);
  const event=h.mounted.events[0];assert.equal(event.points[0][2],event.t,'first point cannot precede its stroke event');
  h.dispatch('pointermove',[130,130],50,35);h.dispatch('pointerup',[140,140,140],70,50);
  assert.deepEqual(Array.from(event.points.slice(1),p=>p[2]),[30,40],'later points preserve their own clock');
  h.at(150);const draft=await h.mounted.checkpoint();assert.equal(draft.complete,true);h.api.validate(draft.sequence);
  h.at(160);const value=await h.mounted.value();h.api.validate(value);h.api.validate(h.drafts.at(-1).sequence);
  const invalid=JSON.parse(JSON.stringify(value));invalid.events[0].t=2;invalid.events[0].points[0][2]=1;
  assert.throws(()=>h.api.validate(invalid),/Punto inválido/,'strict chronology is unchanged');
 });
}
