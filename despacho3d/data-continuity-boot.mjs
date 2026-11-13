// Parent emits only with P4 enabled and current authorization. No payload or session crosses this message.
let queued=false;
window.addEventListener('message',event=>{
 const m=event.data;
 if(event.origin!==location.origin||event.source!==window.parent||window.parent===window||!m||
  Object.keys(m).sort().join(',')!=='type,version'||m.type!=='yod:data:changed'||m.version!==1||queued)return;
 queued=true;setTimeout(()=>{queued=false;if(document.hidden)return;
  if(window.CubefarmYOD?.isOpen())void window.CubefarmYOD.read();
  window.dispatchEvent(new Event('yod-data-invalidated'));},200);
});
