import {sha256} from './journal.mjs';

export class MeetingRecorder {
  constructor(journal,onChange=()=>{}) {this.journal=journal;this.change=onChange;this.queue=Promise.resolve();this.active=false;this.error=null;}
  async start(project) {
    if(this.active)throw Error('Ya hay una reunión grabándose.');
    if(!globalThis.isSecureContext||!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder)throw Error('Este navegador no permite grabar. Usa HTTPS y un navegador compatible.');
    if(!/^[A-Za-z0-9_-]{1,100}$/.test(project))throw Error('Selecciona el identificador del proyecto.');
    if(!navigator.locks)throw Error('Usa un navegador con bloqueo de grabación entre pestañas.');
    await new Promise((resolve,reject)=>{
      navigator.locks.request('yod-meeting-microphone',{ifAvailable:true},async lock=>{
        if(!lock){reject(Error('Ya hay otra pestaña usando la grabadora.'));return;}
        await new Promise(release=>{this.release=release;resolve();});
      }).catch(reject);
    });
    try {
      const estimate=await navigator.storage?.estimate();
      if(estimate?.quota&&estimate.quota-estimate.usage<100*1024*1024)throw Error('Libera espacio antes de grabar: quedan menos de 100 MB para este sitio.');
      this.persistent=await navigator.storage?.persist?.();
      this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m));
      if(!mime)throw Error('No hay un formato de grabación compatible.');
      this.recorder=new MediaRecorder(this.stream,{mimeType:mime,audioBitsPerSecond:64000});
      this.session={id:crypto.randomUUID(),project,mime,created:Date.now(),state:'recording',count:0,duration:0,interrupted:false};
      this.error=null;this.queue=Promise.resolve();this.unsaved=[];
      await this.journal.save(this.session);
      this.last=performance.now();this.active=true;
      this.recorder.ondataavailable=e=>{
        const now=performance.now(),duration=Math.min(3600,(now-this.last)/1000);this.last=now;
        if(!e.data.size)return;
        this.unsaved.push(e.data);
        this.queue=this.queue.then(async()=>{
          if(this.error)return;
          const chunk={meeting:this.session.id,seq:this.session.count,blob:e.data,hash:await sha256(e.data),duration,remote:false};
          const next={...this.session,count:this.session.count+1,duration:this.session.duration+duration};
          await this.journal.append(next,chunk);this.session=next;this.unsaved.shift();this.change();
        }).catch(err=>{this.error=err;this.interrupt('No se pudo guardar. Descarga la copia de emergencia antes de cerrar.');});
      };
      this.stopped=new Promise(resolve=>{this.recorder.onstop=()=>{
        this.queue.then(async()=>{
          this.active=false;this.session.state=this.session.interrupted?'interrupted':'stopped';
          try{await this.journal.save(this.session);}catch(err){this.error=err;}
          this.cleanup();this.change();resolve();
        });
      };});
      this.recorder.onerror=()=>this.interrupt('La grabación se interrumpió. Revisa y descarga lo conservado.');
      for(const track of this.stream.getTracks())track.onended=()=>this.interrupt('Se perdió el micrófono.');
      this.recorder.start(5000); // at most ~5s uncommitted in normal operation; not a hard platform guarantee
      this.wake=await navigator.wakeLock?.request('screen').catch(()=>null);
      this.meter();this.change();
    } catch(error) {this.cleanup();throw error;}
  }
  meter() {
    try {
      this.context=new AudioContext();const source=this.context.createMediaStreamSource(this.stream);
      const analyser=this.context.createAnalyser();analyser.fftSize=1024;source.connect(analyser);
      const samples=new Float32Array(analyser.fftSize);let silent=Date.now();
      this.meterTimer=setInterval(()=>{
        analyser.getFloatTimeDomainData(samples);this.level=Math.sqrt(samples.reduce((n,x)=>n+x*x,0)/samples.length);
        if(this.level>.005)silent=Date.now();
        this.silent=Date.now()-silent>20000;this.change();
      },500);
    }catch{} // recording still works; meter availability isn't evidence of saved audio
  }
  pause() {if(this.recorder?.state==='recording'){this.recorder.requestData();this.recorder.pause();this.change();}}
  resume() {if(this.recorder?.state==='paused'){this.last=performance.now();this.recorder.resume();this.change();}}
  interrupt(message) {if(!this.active)return;this.session.interrupted=true;this.notice=message;void this.stop();}
  async stop() {if(this.recorder&&this.recorder.state!=='inactive')this.recorder.stop();return this.stopped;}
  cleanup() {clearInterval(this.meterTimer);this.stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});this.context?.close().catch(()=>{});this.wake?.release().catch(()=>{});this.release?.();this.release=null;}
}
