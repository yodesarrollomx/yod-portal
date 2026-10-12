// A save resolves only after the IndexedDB transaction commits, never on request success.
export class Journal {
  async open() {
    this.db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('yod-meetings-v1', 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('sessions', {keyPath:'id'});
        const chunks = r.result.createObjectStore('chunks', {keyPath:['meeting','seq']});
        chunks.createIndex('meeting', 'meeting');
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(Error('Cierra otras ventanas de la grabadora y vuelve a abrir.'));
    });
    return this;
  }
  tx(names, mode, run) {
    return new Promise((resolve,reject) => {
      const tx = this.db.transaction(names,mode); let result;
      tx.oncomplete = () => resolve(typeof result==='function'?result():result);
      tx.onabort = () => reject(tx.error||Error('No se confirmó el guardado local.'));
      tx.onerror = () => {}; // onabort is authoritative
      try {result = run(tx);} catch(e) {tx.abort();reject(e);}
    });
  }
  save(session) {return this.tx(['sessions'],'readwrite',tx=>{tx.objectStore('sessions').put(session);});}
  sessions() {return this.tx(['sessions'],'readonly',tx=>{const r=tx.objectStore('sessions').getAll();return()=>r.result;});}
  chunks(id) {return this.tx(['chunks'],'readonly',tx=>{const r=tx.objectStore('chunks').index('meeting').getAll(id);return()=>r.result.sort((a,b)=>a.seq-b.seq);});}
  append(session, chunk) {
    return this.tx(['sessions','chunks'],'readwrite',tx=>{
      tx.objectStore('chunks').add(chunk);tx.objectStore('sessions').put(session);
    });
  }
}
export async function sha256(blob) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function manifest(chunks) {
  return chunks.map((c,i)=>{if(c.seq!==i)throw Error('Faltan fragmentos: conservar la copia y revisar.');return {seq:c.seq,sha256:c.hash,size:c.blob.size};});
}
export function endpoint(value) {
  const url=new URL(value);
  if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))))throw Error('El servidor requiere HTTPS.');
  return url.href.replace(/\/$/,'');
}
export async function synchronize(journal,session,config,fetcher=fetch) {
  const base=endpoint(config.server),headers={Authorization:'Bearer '+config.token};
  const request=async(path,options={})=>{
    const response=await fetcher(base+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(45000)});
    if(!response.ok)throw Error(response.status===401?'Vuelve a conectar este dispositivo.':response.status===403?'Este dispositivo no tiene permiso para el proyecto.':'Respaldo pendiente ('+response.status+').');
    return response.json();
  };
  const path='/meetings/'+encodeURIComponent(session.id);
  await request(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:session.project,mime:session.mime,format:'stream'})});
  const chunks=await journal.chunks(session.id);
  for(const c of chunks) {
    if(c.remote)continue;
    const ack=await request(path+'/chunks/'+c.seq,{method:'PUT',headers:{'Content-Type':'application/octet-stream','X-SHA256':c.hash,'X-Duration':String(c.duration)},body:c.blob});
    if(ack.seq!==c.seq||ack.sha256!==c.hash||ack.size!==c.blob.size||ack.durable!==true)throw Error('El servidor no confirmó la integridad del fragmento.');
    await journal.tx(['chunks'],'readwrite',tx=>{tx.objectStore('chunks').put({...c,remote:true});});
  }
  // Finalization only after final ondataavailable and onstop have committed locally.
  if(['stopped','interrupted','sealed'].includes(session.state)&&chunks.length) {
    const ack=await request(path+'/finalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({manifest:manifest(chunks),interrupted:!!session.interrupted})});
    if(ack.state!=='sealed')throw Error('Cierre remoto pendiente.');
  }
  return request(path);
}
