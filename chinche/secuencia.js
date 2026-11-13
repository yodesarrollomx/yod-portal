/* Shared recorded annotations. Private device drafts; network delivery belongs to the host. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.YodChincheSecuencia=api;})(globalThis,function(root){
'use strict';
const VERSION=1, MAX_MS=600000, MAX_BYTES=12000000;
const clone=x=>JSON.parse(JSON.stringify(x));
const el=(tag,text)=>{const n=root.document.createElement(tag);if(text)n.textContent=text;return n;};
function timeline(clock=()=>performance.now(),elapsed=0,events=[]){
 const start=clock();let last=elapsed;
 return {events,time:()=>Math.max(last,Math.min(MAX_MS,elapsed+Math.round(clock()-start))),add(type,data){const t=Math.max(last,Math.min(MAX_MS,elapsed+Math.round(clock()-start)));last=t;const event={t,type,...clone(data)};events.push(event);return event;}};
}
// MIME parameters may contain spaces or quoted codec lists (including Safari).
// Canonicalize the header only, never the encoded bytes or the container.
function audioType(mime){
 if(typeof mime!=='string'||mime.length>256)return null;
 const m=/^\s*(audio\/(?:webm|mp4|ogg))\s*(?:;\s*codecs\s*=\s*(?:"([a-z0-9., -]+)"|([a-z0-9., -]+))\s*)?$/i.exec(mime);
 return m?m[1].toLowerCase():null;
}
function audioParts(audio){
 const type=audioType(audio?.mime),m=typeof audio?.data==='string'&&/^data:([^\r\n]+);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(audio.data);
 if(!type||!m||audioType(m[1])!==type)throw Error('Audio inválido');
 return {type,header:m[1],payload:m[2]};
}
function normalizeAudio(audio){if(!audio)return null;const p=audioParts(audio);return {...audio,mime:p.type,data:'data:'+p.type+';base64,'+p.payload,originalMime:audio.originalMime||audio.mime,originalDataHeader:audio.originalDataHeader||p.header};}
function draftStore(){
 let opening;
 function database(){if(!opening)opening=new Promise((ok,no)=>{if(!root.indexedDB){no(Error('Almacenamiento local no disponible'));return;}let expired=false;const timer=setTimeout(()=>{expired=true;opening=null;no(Error('El respaldo no respondió'));},5000),r=root.indexedDB.open('yodChincheBorradores',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('drafts'))r.result.createObjectStore('drafts',{keyPath:'id'});};r.onsuccess=()=>{clearTimeout(timer);if(expired){r.result.close();return;}ok(r.result);};r.onerror=r.onblocked=()=>{clearTimeout(timer);opening=null;no(r.error||Error('No abrió el respaldo'));};});return opening;}
 async function run(mode,action){const db=await database();return new Promise((ok,no)=>{let value;const tx=db.transaction('drafts',mode),timer=setTimeout(()=>{try{tx.abort();}catch(e){}no(Error('El respaldo no respondió'));},5000);const r=action(tx.objectStore('drafts'));r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>{clearTimeout(timer);ok(value);};tx.onerror=tx.onabort=()=>{clearTimeout(timer);no(tx.error||r.error||Error('No se guardó el respaldo'));};});}
 return {put:d=>run('readwrite',s=>s.put(d)),get:id=>run('readonly',s=>s.get(id)),remove:id=>run('readwrite',s=>s.delete(id)),async list(scope){const all=await run('readonly',s=>s.getAll());return all.filter(d=>d.scope===scope).map(d=>({id:d.id,updated:d.updated,complete:d.complete})).sort((a,b)=>b.updated-a.updated);}};
}
function visibleStrokes(events,time){const strokes=[];for(const e of events){if(e.t>time)break;if(e.type==='stroke')strokes.push(e);if(e.type==='undo')strokes.pop();}return strokes;}
function draw(ctx,events,time){
 for(const s of visibleStrokes(events,time)){
  const pts=s.points.filter(p=>p[2]<=time);if(!pts.length)continue;
  const first=pts[0],last=pts[pts.length-1];ctx.save();ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=s.width;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=s.tool==='marker'?.28:1;ctx.beginPath();
  if(s.tool==='rect')ctx.rect(first[0],first[1],last[0]-first[0],last[1]-first[1]);
  else if(s.tool==='ellipse')ctx.ellipse((first[0]+last[0])/2,(first[1]+last[1])/2,Math.max(.1,Math.abs(last[0]-first[0])/2),Math.max(.1,Math.abs(last[1]-first[1])/2),0,0,Math.PI*2);
  else{ctx.moveTo(first[0],first[1]);if(['line','arrow'].includes(s.tool)){ctx.lineTo(last[0],last[1]);if(s.tool==='arrow'){const a=Math.atan2(last[1]-first[1],last[0]-first[0]);ctx.moveTo(last[0]-18*Math.cos(a-.5),last[1]-18*Math.sin(a-.5));ctx.lineTo(last[0],last[1]);ctx.lineTo(last[0]-18*Math.cos(a+.5),last[1]-18*Math.sin(a+.5));}}else{if(pts.length===1)ctx.lineTo(first[0]+.1,first[1]+.1);else for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);}}
  ctx.stroke();ctx.restore();
 }
}
function validate(s){
 if(!s||s.v!==VERSION||!Number.isFinite(s.duration)||s.duration<0||s.duration>MAX_MS+10000||!Number.isInteger(s.width)||!Number.isInteger(s.height)||s.width<1||s.width>2560||s.height<1||s.height>2560||!Array.isArray(s.events)||s.events.length>10000||!Array.isArray(s.frames)||s.frames.length>240)throw Error('Secuencia inválida');
 if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(s.base))throw Error('Base visual inválida');
 let last=-1,points=0;
 for(const e of s.events){if(!Number.isFinite(e.t)||e.t<last||e.t>s.duration||!['stroke','undo','audio-start','audio-end'].includes(e.type))throw Error('Reloj inválido');last=e.t;
  if(e.type==='stroke'){if(!['pen','marker','line','arrow','rect','ellipse'].includes(e.tool)||!/^#[a-f0-9]{6}$/i.test(e.color)||!Number.isFinite(e.width)||e.width<1||e.width>80||!Array.isArray(e.points)||!e.points.length)throw Error('Trazo inválido');let pt=e.t;for(const p of e.points){if(!Array.isArray(p)||p.length!==4||p.some(n=>!Number.isFinite(n))||p[0]<0||p[0]>s.width||p[1]<0||p[1]>s.height||p[2]<pt||p[2]>s.duration||p[3]<0||p[3]>1)throw Error('Punto inválido');pt=p[2];}points+=e.points.length;}}
 if(points>120000)throw Error('Demasiados puntos');
 let ft=-1;for(const f of s.frames){if(!Number.isFinite(f.t)||f.t<ft||f.t>s.duration||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(f.image))throw Error('Captura inválida');ft=f.t;}
 if(s.audio){if(!Number.isFinite(s.audio.offset)||s.audio.offset<0||s.audio.offset>s.duration)throw Error('Audio inválido');audioParts(s.audio);}
 if(new TextEncoder().encode(JSON.stringify(s)).length>MAX_BYTES)throw Error('La grabación supera 12 MB; conserva el original');return s;
}
function dataURL(blob){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(Error('No se pudo preparar el audio'));r.readAsDataURL(blob);});}
function style(){if(root.document.getElementById('chn-seq-style'))return;const s=el('style');s.id='chn-seq-style';s.textContent=`.chn-seq{background:#f7f5ed;color:#283d32;border:1px solid #bbc4b8;border-radius:12px;padding:12px;margin:12px 0;font:14px system-ui}.chn-seq canvas{display:block;width:100%;height:auto;touch-action:none;background:#fff;border:1px solid #c9cfc4}.chn-seq-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0}.chn-seq button,.chn-seq select{font:14px system-ui;min-height:44px;padding:8px 12px;border:1px solid #b5c1b5;border-radius:8px;background:#fff;color:#263c30}.chn-seq input[type=color]{height:44px;width:44px}.chn-seq input[type=range]{max-width:120px}.chn-seq-status{min-height:22px}.chn-seq audio{width:100%}.chn-seq-big{position:fixed;inset:8px;z-index:2147483647;overflow:auto;margin:0}.chn-seq-big canvas{max-height:70vh;width:auto;max-width:100%;margin:auto}.chn-seq [hidden]{display:none!important}`;root.document.head.append(s);}
// Apps Script's outer frame may deny microphone. Audio stays in the browser:
// a top-level recorder returns it only to its opener, with a per-session nonce.
function microphoneBridge(onstart,onend,onerror){
 const origin='https://yodesarrollomx.github.io',nonce=Array.from(root.crypto.getRandomValues(new Uint8Array(24))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const popup=root.open(origin+'/yod-portal/chinche/microfono.html','_blank','popup,width=430,height=360');
 if(!popup)throw Error('Permite abrir la ventana de grabación y vuelve a intentar.');
 let done=false,started=false,ready=false,resolve;const openedAt=Date.now();const finish=new Promise(r=>resolve=r);
 function cleanup(){root.removeEventListener('message',receive);clearInterval(watch);}
 function fail(message){if(done)return;done=true;cleanup();resolve();onerror(Error(message));}
 function receive(e){if(e.source!==popup||e.origin!==origin||!e.data||e.data.type!=='yod:chinche:microphone')return;const m=e.data;
  if(m.action==='ready'){ready=true;popup.postMessage({type:m.type,action:'init',nonce},origin);return;}
  if(m.nonce!==nonce||done)return;
  if(m.action==='started'&&!started){started=true;onstart();}
  if(m.action==='error')fail(m.message==='denied'?'No se concedió permiso al micrófono.':'No se pudo conservar el audio; grábalo de nuevo.');
  if(m.action==='complete'){
   if(!started||typeof m.data!=='string'||m.data.length>7000000){fail('La grabación no se pudo verificar. Conserva el original en la ventana de voz.');return;}
   done=true;cleanup();Promise.resolve(onend({mime:m.mime,data:m.data})).then(saved=>{if(saved!==false)popup.postMessage({type:m.type,action:'received',nonce},origin);}).finally(resolve);
  }
 }
 root.addEventListener('message',receive);const watch=setInterval(()=>{if(popup.closed)fail('Se cerró la ventana antes de conservar el audio.');else if(!ready&&Date.now()-openedAt>20000)fail('No cargó la ventana de voz. Vuelve a intentar.');},500);
 return {finish,stop(){if(!done)popup.postMessage({type:'yod:chinche:microphone',action:'stop',nonce},origin);return finish;},dispose(){if(!done){done=true;cleanup();popup.close();resolve();}}};
}
function mount(host,base,opts={}){
 style();const box=el('section');box.className='chn-seq';box.setAttribute('aria-label','Dibujo y explicación grabada');const canvas=el('canvas');canvas.width=base.width;canvas.height=base.height;canvas.setAttribute('aria-label','Dibuja sobre la captura');
 const tools=el('div');tools.className='chn-seq-tools';const select=el('select');select.setAttribute('aria-label','Herramienta');for(const [value,name] of [['pen','Lápiz'],['marker','Marcador'],['line','Línea'],['arrow','Flecha'],['rect','Rectángulo'],['ellipse','Óvalo']]){const o=el('option',name);o.value=value;select.append(o);}
 const color=el('input');color.type='color';color.value='#cc5b36';color.setAttribute('aria-label','Color');const width=el('input');width.type='range';width.min='1';width.max='14';width.value='3';width.setAttribute('aria-label','Grosor');const undo=el('button','Deshacer'),expand=el('button','Ampliar'),record=el('button','Grabar explicación'),stop=el('button','Detener'),preview=el('button','Reproducir');[undo,expand,record,stop,preview].forEach(b=>b.type='button');stop.hidden=true;
 const status=el('div','Dibuja y explica con tu voz.');status.className='chn-seq-status';status.setAttribute('role','status');tools.append(select,color,width,undo,expand,record,stop,preview);box.append(canvas,tools,status);host.append(box);
 const ctx=canvas.getContext('2d');let line=timeline(),active=null,recorder=null,stream=null,blob=null,offset=0,chunks=[],finish=null,disposed=false,pending=false,timer=null,busy=false,audioBytes=0,frames=[],frameBytes=0,lastFrame=-5000,player=null,previewing=false,ended=false,external=null,externalAudio=null,externalError=null;
 let baseData=base.toDataURL('image/jpeg',.75),baseImage=base;const paint=(t=line.time())=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(baseImage,0,0);draw(ctx,line.events,t);};paint();
 const store=opts.draftStore||draftStore(),scope=(root.location?.origin||'')+(root.location?.pathname||'')+(opts.draftScope||'');
 let draftId='draft-'+(root.crypto.randomUUID?root.crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)),write=Promise.resolve(),draftTimer=null,saved=false,writing=false,dirty=false;
 const backup=el('button','Descargar respaldo'),drafts=el('button','Recuperar borrador'),importButton=el('button','Importar respaldo'),importFile=el('input'),draftStatus=el('div','El respaldo se guarda en este aparato mientras trabajas.');backup.type=drafts.type=importButton.type='button';importFile.type='file';importFile.accept='.json,application/json';importFile.hidden=true;draftStatus.className='chn-seq-status';draftStatus.setAttribute('role','status');tools.append(backup,drafts,importButton,importFile);box.append(draftStatus);
 const hasContent=()=>line.events.length>0||!!blob||!!recorder||!!external||!!externalAudio;
 async function raw(){const partial=blob||(chunks.length?new Blob(chunks,{type:chunks.find(c=>c.type)?.type||recorder?.mimeType||''}):null);return {v:VERSION,width:canvas.width,height:canvas.height,duration:line.time(),base:baseData,events:clone(line.events),frames:clone(frames),audio:externalAudio||(partial?.size?{mime:partial.type,offset,data:await dataURL(partial)}:null),baseKind:opts.baseKind||'capture'};}
 function checkpoint(){if(saved||!hasContent())return write;dirty=true;if(writing)return write;writing=true;write=(async()=>{let draft;do{dirty=false;const sequence=await raw();draft={v:1,id:draftId,scope,updated:Date.now(),complete:!pending&&(!recorder||recorder.state==='inactive')&&(!external||!!externalAudio),sequence,context:opts.draftContext?clone(opts.draftContext()):null};await store.put(draft);draftStatus.textContent=draft.complete?'Borrador conservado en este aparato.':'Respaldo local actualizado · grabación en curso.';}while(dirty&&!saved);return draft;})().catch(error=>{draftStatus.textContent='No se pudo guardar el respaldo local. Descarga el respaldo antes de cerrar.';throw error;}).finally(()=>{writing=false;});return write;}
 function schedule(){if(!draftTimer)draftTimer=setTimeout(()=>{draftTimer=null;checkpoint().catch(()=>{});},1000);}
 async function download(){await halt().catch(()=>{});const sequence=await raw(),packet={format:'yod-chinche-borrador-v1',version:1,created:new Date().toISOString(),scope,complete:!pending&&(!recorder||recorder.state==='inactive')&&(!external||!!externalAudio),sequence,context:opts.draftContext?clone(opts.draftContext()):null};const url=URL.createObjectURL(new Blob([JSON.stringify(packet)],{type:'application/json'})),a=el('a');a.href=url;a.download='chinche-respaldo-'+Date.now()+'.json';box.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);draftStatus.textContent='Respaldo preparado para descargar. Comprueba el archivo antes de cerrar.';return packet;}
 backup.onclick=()=>download().catch(()=>{draftStatus.textContent='No se pudo preparar el archivo. Mantén esta ventana abierta.';});
 async function restore(draft){if(!draft||draft.v!==1||draft.scope!==scope)throw Error('Este borrador no pertenece a esta pantalla');const s=draft.sequence;validate({...s,audio:null});if(s.audio&&(typeof s.audio.data!=='string'||s.audio.data.length>7000000))throw Error('Borrador de audio inválido');await halt().catch(()=>{});if(hasContent())await checkpoint();const image=new Image();image.src=s.base;await image.decode();draftId=draft.id;saved=false;line=timeline(undefined,s.duration,clone(s.events));baseData=s.base;baseImage=image;canvas.width=s.width;canvas.height=s.height;frames=clone(s.frames);frameBytes=frames.reduce((n,f)=>n+f.image.length,0);lastFrame=frames.at(-1)?.t??-5000;recorder=null;chunks=[];blob=null;external=null;externalError=null;externalAudio=s.audio;offset=s.audio?.offset||0;ended=!!s.audio;record.hidden=!!s.audio;record.disabled=false;stop.hidden=true;player?.remove();player=null;previewing=false;preview.textContent='Reproducir';paint();opts.restoreContext?.(draft.context);status.textContent=draft.complete?'Borrador recuperado. Revisa la explicación y clava cuando esté lista.':'Borrador recuperado de una grabación interrumpida. Conserva también el respaldo original.';}
 drafts.onclick=async()=>{try{box.querySelector('[data-draft-list]')?.remove();const list=el('div');list.setAttribute('data-draft-list','');const records=await store.list(scope);if(!records.length)list.append(el('p','No hay borradores en esta pantalla.'));for(const d of records){const row=el('div'),b=el('button','Recuperar · '+new Date(d.updated).toLocaleString());b.type='button';b.onclick=async()=>{try{await restore(await store.get(d.id));list.remove();}catch(e){draftStatus.textContent=e.message;}};row.append(b);list.append(row);}box.append(list);}catch(e){draftStatus.textContent='No se pudieron leer los borradores. Mantén abierta tu explicación actual.';}};
 importButton.onclick=()=>importFile.click();importFile.onchange=async()=>{try{const file=importFile.files[0];if(!file)return;if(file.size>24000000)throw Error('Respaldo demasiado grande');const packet=JSON.parse(await file.text());if(packet.format!=='yod-chinche-borrador-v1'||packet.scope!==scope)throw Error('El respaldo pertenece a otra pantalla');await restore({v:1,id:'draft-'+root.crypto.randomUUID(),scope,sequence:packet.sequence,complete:packet.complete,context:packet.context});await checkpoint();}catch(e){draftStatus.textContent='No se importó: '+e.message;}finally{importFile.value='';}};
 function frame(force=false){const t=line.time();if(!force&&t-lastFrame<5000)return;if(frames.length>=240||frameBytes>4000000)return;const c=el('canvas'),scale=Math.min(1,800/canvas.width);c.width=Math.round(canvas.width*scale);c.height=Math.round(canvas.height*scale);c.getContext('2d').drawImage(canvas,0,0,c.width,c.height);const image=c.toDataURL('image/jpeg',.55);frames.push({t,image});frameBytes+=image.length;lastFrame=t;}
 function point(e,time){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height)),time===undefined?line.time():time,e.pressure||.5];}
 canvas.addEventListener('pointerdown',e=>{if(disposed||previewing||e.button!==0||!e.isPrimary||active||line.time()>MAX_MS)return;e.preventDefault();const event=line.add('stroke',{tool:select.value,color:color.value,width:Number(width.value)*(select.value==='marker'?4:1),points:[]});event.points.push(point(e,event.t));active={id:e.pointerId,event};canvas.setPointerCapture(e.pointerId);paint();});
 canvas.addEventListener('pointermove',e=>{if(!active||active.id!==e.pointerId)return;e.preventDefault();const p=point(e),a=active.event.points;if(p[2]-a[a.length-1][2]>=12&&a.length<15000){a.push(p);paint();}});
 function end(e){if(active&&active.id===e.pointerId){active.event.points.push(point(e));active=null;paint();frame(true);schedule();}}
 canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 undo.onclick=()=>{if(active||previewing)return;line.add('undo',{});paint();frame(true);schedule();};expand.onclick=()=>{const on=box.classList.toggle('chn-seq-big');expand.textContent=on?'Reducir':'Ampliar';};
 function release(){clearInterval(timer);timer=null;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;}
 async function halt(){if(externalError)throw externalError;if(external){await external.stop();if(externalError)throw externalError;}if(pending)throw Error('Espera la respuesta del micrófono');if(recorder&&recorder.state!=='inactive'){recorder.stop();await finish;}release();}
 record.onclick=async()=>{
  if(disposed||pending||recorder||blob||externalAudio||external||previewing)return;
  const policy=root.document.permissionsPolicy||root.document.featurePolicy;
  if(policy&&policy.allowsFeature&&!policy.allowsFeature('microphone')){
   try{externalError=null;record.disabled=true;status.textContent='Abre la ventana de voz, pulsa Grabar y vuelve aquí para dibujar.';
    external=microphoneBridge(()=>{offset=line.time();line.add('audio-start',{});record.hidden=true;stop.hidden=false;status.textContent='Grabando voz y dibujo…';frame(true);timer=setInterval(()=>{frame();schedule();if(line.time()>=MAX_MS)halt().catch(()=>{});},5000);},audio=>{externalAudio={...audio,offset};line.add('audio-end',{});release();stop.hidden=true;record.hidden=true;status.textContent='Audio conservado · puedes reproducirlo con el dibujo.';frame(true);return checkpoint().then(()=>true,()=>false);},error=>{externalError=error;external=null;release();stop.hidden=true;record.hidden=false;record.disabled=false;status.textContent=error.message;checkpoint().catch(()=>{});});
   }catch(e){external=null;record.disabled=false;status.textContent=e.message;}return;
  }if(!root.navigator?.mediaDevices?.getUserMedia||!root.MediaRecorder){status.textContent='Este navegador no permite grabar aquí. El dibujo se conserva.';return;}
  pending=true;record.disabled=true;status.textContent='Esperando permiso del micrófono…';
  try{const opened=await root.navigator.mediaDevices.getUserMedia({audio:true});if(disposed){opened.getTracks().forEach(t=>t.stop());return;}stream=opened;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:48000});
   finish=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data?.size){chunks.push(e.data);audioBytes+=e.data.size;schedule();if(audioBytes>5000000&&recorder.state!=='inactive')recorder.stop();}};recorder.onstop=()=>{if(ended)return;blob=new Blob(chunks,{type:chunks.find(c=>c.type)?.type||recorder.mimeType||mime});line.add('audio-end',{});ended=true;release();stop.hidden=true;record.hidden=true;status.textContent=blob.size?'Audio detenido · puedes reproducirlo con el dibujo.':'La grabación quedó vacía. El dibujo se conserva; puedes descargar su respaldo.';frame(true);resolve();checkpoint().catch(()=>{});};});
   recorder.onerror=()=>{status.textContent='La grabación se interrumpió; revisa el audio conservado.';if(recorder.state!=='inactive')recorder.stop();else recorder.onstop();};
   offset=line.time();line.add('audio-start',{});recorder.start(1000);record.hidden=true;stop.hidden=false;status.textContent='Grabando voz y dibujo…';frame(true);timer=setInterval(()=>{frame();const seconds=Math.floor((line.time()-offset)/1000);status.textContent='Grabando · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(line.time()>=MAX_MS)halt().catch(()=>{});},1000);
  }catch(e){release();recorder=null;record.disabled=false;status.textContent='No se abrió el micrófono. Tu dibujo sigue disponible.';}finally{pending=false;}
 };
 stop.onclick=()=>halt().catch(e=>status.textContent=e.message);
 async function value(){await halt();active=null;paint();frame(true);await checkpoint().catch(()=>{});const s=await raw();if(line.events.some(e=>e.type==='audio-start')&&!s.audio)throw Error('La grabación no contiene audio. Descarga el respaldo; tu dibujo sigue aquí.');s.audio=normalizeAudio(s.audio);return validate(s);}
 preview.onclick=async()=>{if(busy)return;if(player){player.querySelectorAll('audio').forEach(a=>a.pause());player.remove();player=null;previewing=false;preview.textContent='Reproducir';paint();return;}busy=true;try{const s=await value();player=el('div');box.append(player);await replay(player,s);previewing=true;preview.textContent='Volver a dibujar';}catch(e){status.textContent=e.message;}finally{busy=false;}};
 const visibility=()=>{if(root.document.hidden)halt().catch(()=>{}).finally(()=>checkpoint().catch(()=>{}));},unload=e=>{if(!saved&&hasContent()){e.preventDefault();e.returnValue='';}};root.document.addEventListener('visibilitychange',visibility);root.addEventListener('beforeunload',unload);
 store.list(scope).then(records=>{if(records.length)drafts.textContent='Recuperar borrador ('+records.length+')';}).catch(()=>{draftStatus.textContent='Respaldo local no disponible. Descarga el respaldo antes de cerrar.';});
 return {box,canvas,hasContent,get pending(){return pending;},value,checkpoint,download,restore,async preserve(){await halt().catch(()=>{});return checkpoint();},async markSaved(){saved=true;clearTimeout(draftTimer);await write.catch(()=>{});await store.remove(draftId);},dispose(){disposed=true;clearTimeout(draftTimer);halt().catch(()=>{}).finally(()=>{checkpoint().catch(()=>{});external?.dispose();release();});root.document.removeEventListener('visibilitychange',visibility);root.removeEventListener('beforeunload',unload);player?.querySelectorAll('audio').forEach(a=>a.pause());player?.remove();},get events(){return line.events;}};
}
async function replay(host,s){
 validate(s);style();const box=el('section');box.className='chn-seq';const canvas=el('canvas');canvas.width=s.width;canvas.height=s.height;const ctx=canvas.getContext('2d'),base=new Image();base.src=s.base;await base.decode();const audio=el('audio');audio.controls=false;audio.hidden=true;if(s.audio)audio.src=s.audio.data;const seek=el('input');seek.type='range';seek.min='0';seek.max=String(s.duration);seek.value='0';seek.style.maxWidth='none';seek.style.width='100%';seek.setAttribute('aria-label','Momento de la explicación');const play=el('button','Reproducir secuencia'),label=el('div','0:00');play.type='button';box.append(canvas,seek,play,label);if(s.audio)box.append(audio);host.append(box);let raf=0,playing=false,wall=0,start=0;
 function show(t){t=Math.max(0,Math.min(s.duration,t));seek.value=String(t);ctx.clearRect(0,0,s.width,s.height);ctx.drawImage(base,0,0);draw(ctx,s.events,t);label.textContent=(t/1000).toFixed(1)+' s / '+(s.duration/1000).toFixed(1)+' s';}
 const audioEnd=s.audio?(s.events.find(e=>e.type==='audio-end')?.t??s.duration):0;
 function pause(){playing=false;cancelAnimationFrame(raf);audio.pause();play.textContent='Continuar';}
 function tick(){if(!box.isConnected){pause();return;}let t=start+performance.now()-wall;
  if(s.audio&&t>=s.audio.offset&&t<audioEnd){if(audio.paused&&!audio.ended){audio.currentTime=Math.max(0,(t-s.audio.offset)/1000);audio.play().catch(()=>pause());}if(!audio.paused){t=s.audio.offset+audio.currentTime*1000;start=t;wall=performance.now();}}
  show(t);if(t>=s.duration){pause();play.textContent='Reproducir secuencia';return;}if(playing)raf=requestAnimationFrame(tick);
 }
 play.onclick=()=>{if(playing){pause();return;}start=Number(seek.value);if(start>=s.duration)start=0;wall=performance.now();if(s.audio)audio.currentTime=Math.max(0,(start-s.audio.offset)/1000);playing=true;play.textContent='Pausar';tick();};
 seek.oninput=()=>{pause();show(Number(seek.value));if(s.audio)audio.currentTime=Math.max(0,(Number(seek.value)-s.audio.offset)/1000);};
 audio.onplay=()=>{if(!playing){start=s.audio.offset+audio.currentTime*1000;wall=performance.now();playing=true;play.textContent='Pausar';tick();}};
 audio.onended=()=>{if(playing){start=audioEnd;wall=performance.now();}};
 show(0);return box;
}
return {VERSION,MAX_BYTES,timeline,visibleStrokes,draw,validate,normalizeAudio,audioType,draftStore,mount,replay};
});
