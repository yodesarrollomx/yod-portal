import {sha256} from './journal.mjs';
export async function importAudio(journal,file,project,onProgress=()=>{},context=null) {
  if(!/^[A-Za-z0-9_-]{1,100}$/.test(project))throw Error('Selecciona el identificador del proyecto.');
  const suffix=file.name.split('.').at(-1).toLowerCase();
  const mime={m4a:'audio/mp4',mp4:'audio/mp4',mp3:'audio/mpeg',wav:'audio/wav',webm:'audio/webm',ogg:'audio/ogg;codecs=opus'}[suffix];
  if(!mime||!file.size||file.size>2*1024**3)throw Error('Elige un audio M4A, MP3, WAV, WebM u OGG de hasta 2 GB.');
  const estimate=await navigator.storage?.estimate?.();
  if(estimate?.quota&&estimate.quota-estimate.usage<file.size*1.2)throw Error('No hay espacio suficiente para importar. Conserva el original en Archivos.');
  let session={id:crypto.randomUUID(),project,context,mime,created:Date.now(),state:'importing',count:0,duration:0,interrupted:false,imported:true};
  await journal.save(session);
  try {
    const block=1024*1024;
    for(let start=0;start<file.size;start+=block) {
      const blob=file.slice(start,Math.min(file.size,start+block));
      const next={...session,count:session.count+1};
      await journal.append(next,{meeting:session.id,seq:session.count,blob,hash:await sha256(blob),duration:0,remote:false});
      session=next;onProgress(Math.round(Math.min(file.size,start+block)/file.size*100));
    }
    session={...session,state:'stopped'};await journal.save(session);return session;
  }catch(error){
    await journal.save({...session,state:'import_incomplete'}).catch(()=>{});
    throw Error('Importación incompleta. El original de Archivos no se modificó; vuelve a seleccionarlo.');
  }
}
