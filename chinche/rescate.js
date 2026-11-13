/* Local emergency recovery for an already-open v1 composer. No upload or automatic delivery. */
(async function(){'use strict';
 const modal=Array.from(document.querySelectorAll('.chn-velo')).find(e=>e._secuencia),seq=modal?._secuencia;
 if(!seq){alert('Vuelve a la pestaña donde sigue abierta tu explicación y ejecuta el rescate allí. No recargues esa pestaña.');return;}
 if(modal.querySelector('[data-chinche-rescue]'))return;
 const box=document.createElement('section');box.dataset.chincheRescue='';box.style.cssText='padding:16px;border:2px solid #265a45;border-radius:12px;background:#fff;color:#183b2d';
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Conservando tu explicación. Mantén esta pestaña abierta…';box.append(status);modal.querySelector('.chn-pie')?.before(box);
 const canonical=m=>{const match=typeof m==='string'&&/^\s*(audio\/(?:mp4|webm|ogg))\s*(?:;\s*codecs\s*=\s*(?:"[a-z0-9., -]+"|[a-z0-9., -]+)\s*)?$/i.exec(m);return match?match[1].toLowerCase():null;};
 const blobType=Object.getOwnPropertyDescriptor(Blob.prototype,'type'),readerResult=Object.getOwnPropertyDescriptor(FileReader.prototype,'result'),read=FileReader.prototype.readAsDataURL,original=seq.value.bind(seq);let job=null,lastOriginal=null;
 async function compatible(){if(job)return job;job=(async()=>{let captured=null;
  if(!blobType?.configurable||!readerResult?.configurable)throw Error('El navegador no permite preparar el audio aquí. Mantén abierta esta pestaña.');
  try{
   Object.defineProperty(Blob.prototype,'type',{...blobType,get(){const raw=blobType.get.call(this);return canonical(raw)||raw;}});
   Object.defineProperty(FileReader.prototype,'result',{...readerResult,get(){const raw=readerResult.get.call(this);if(typeof raw!=='string')return raw;const marker=raw.indexOf(';base64,');if(marker<0)return raw;const header=raw.slice(5,marker),mime=canonical(header);if(!mime)return raw;if(captured)captured.header=header;return 'data:'+mime+raw.slice(marker);}});
   FileReader.prototype.readAsDataURL=function(blob){const mime=blobType.get.call(blob);if(canonical(mime))captured={blob,mime};return read.call(this,blob);};
   const sequence=await original();if(sequence.audio&&captured){sequence.audio.originalMime=captured.mime;sequence.audio.originalDataHeader=captured.header||captured.mime;lastOriginal=captured;}return sequence;
  }finally{Object.defineProperty(Blob.prototype,'type',blobType);Object.defineProperty(FileReader.prototype,'result',readerResult);FileReader.prototype.readAsDataURL=read;}
 })();try{return await job;}finally{job=null;}}
 seq.value=compatible;
 const links=[];function link(blob,name,label){const a=document.createElement('a'),url=URL.createObjectURL(blob);links.push(url);a.href=url;a.download=name;a.textContent=label;a.style.cssText='display:block;padding:14px;margin:8px 0;border:1px solid #265a45;border-radius:8px';box.append(a);}
 try{const sequence=await compatible(),packet={format:'yod-chinche-borrador-v1',version:1,created:new Date().toISOString(),scope:location.origin+location.pathname,complete:true,sequence,context:{texto:modal.querySelector('.chn-txt')?.value||''}};
 link(new Blob([JSON.stringify(packet)],{type:'application/json'}),'chinche-rescatada-'+Date.now()+'.json','1. Descargar respaldo completo');
 if(lastOriginal)link(lastOriginal.blob,'chinche-voz-original-'+Date.now()+({'audio/mp4':'.m4a','audio/webm':'.webm','audio/ogg':'.ogg'}[canonical(lastOriginal.mime)]||'.bin'),'2. Descargar audio original');
 status.textContent='Respaldo listo con voz, trazos y capturas. Descárgalo y comprueba el archivo. Luego puedes pulsar Clavar aquí mismo. No se ha enviado ninguna chinche automáticamente.';
 }catch(error){status.textContent='El rescate completo no pudo terminar: '+error.message+' No canceles ni recargues. El dibujo sigue abierto.';}
 addEventListener('pagehide',()=>links.forEach(url=>URL.revokeObjectURL(url)),{once:true});
})();
