// The consent window owns localhost HTTP/WebSocket. This page receives only a
// scoped MessagePort; it never receives the local cookie or a Codex credential.
export class TerminalLink {
 constructor({win=window,getProfile,notify=()=>{}}){
  Object.assign(this,{win,getProfile,notify,port:null,popup:null,nonce:null,caseId:null,status:'disconnected',runtime:null,error:'',timer:null,deadline:null,listeners:new Set(),lastPong:0});
  this.receive=e=>this.accept(e);win.addEventListener('message',this.receive);
 }
 state(){return {status:this.status,runtime:this.runtime,error:this.error};}
 emit(){this.notify(this.state());}
 valid(){return !!this.caseId&&this.getProfile()?.case_id===this.caseId;}
 connect(){
  this.disconnect();const profile=this.getProfile();if(!profile)return false;
  this.caseId=profile.case_id;this.nonce=this.win.crypto.randomUUID();this.status='connecting';this.error='';
  this.popup=this.win.open('http://127.0.0.1:4381/pair#'+this.nonce,'_blank','popup,width=570,height=610');
  if(!this.popup){this.disconnect('Permite abrir la ventana de conexión para continuar.');return false;}
  this.deadline=this.win.setTimeout(()=>{if(!this.port)this.disconnect('La terminal local no respondió. Usa la Chromebook con Linux abierto y la actualización del puesto instalada.');},12000);this.emit();return true;
 }
 accept(e){
  const m=e.data;
  if(!this.valid()||e.origin!=='http://127.0.0.1:4381'||e.source!==this.popup||!m||m.version!==1||m.nonce!==this.nonce)return false;
  if(m.type==='yod:terminal:ready'&&!this.port){
   this.win.clearTimeout(this.deadline);this.status='approving';this.emit();
   this.deadline=this.win.setTimeout(()=>{if(!this.port)this.disconnect('La conexión no se confirmó. Puedes volver a intentarlo.');},120000);
   this.popup.postMessage({type:'yod:terminal:hello',version:1,nonce:this.nonce,case_id:this.caseId},'http://127.0.0.1:4381');return true;
  }
  if(m.type!=='yod:terminal:approved'||this.port||m.case_id!==this.caseId||e.ports?.length!==1)return false;
  this.win.clearTimeout(this.deadline);this.port=e.ports[0];const granted=this.port;this.port.onmessage=event=>{if(this.port===granted)this.message(event.data);};this.port.start();this.status='connected';this.lastPong=Date.now();this.emit();
  this.timer=this.win.setInterval(()=>{if(!this.valid()||this.popup?.closed||Date.now()-this.lastPong>24000)this.disconnect('La conexión local se cerró. El trabajo en ejecución se conserva.');else this.post({type:'ping'});},4000);
  this.post({type:'ping'});return true;
 }
 message(m){
  if(!this.port||!this.valid()){this.disconnect();return;}
  if(!m||typeof m!=='object')return;
  if(m.type==='pong'){this.lastPong=Date.now();return;}
  if(m.type==='closed'){this.disconnect('La ventana local se desconectó.');return;}
  if(m.type==='status'){
   const s=m.status;if(!s||typeof s.live!=='boolean'||![null,'manual','room'].includes(s.mode))return;
   this.runtime={live:s.live,mode:s.mode,room:s.room===true,room_link:s.room_link===true,needs_review:s.needs_review===true};this.emit();return;
  }
  if(m.type==='control-result'){if(m.ok===false){this.error=typeof m.message==='string'?m.message.slice(0,200):'No se completó la operación.';this.emit();}return;}
  if(m.type==='terminal'){
   const t=m.message;if(!t||!['snapshot','data','size','live'].includes(t.t))return;
   if(['snapshot','data'].includes(t.t)&&(typeof t.data!=='string'||t.data.length>4194304))return;
   if(['snapshot','size'].includes(t.t)&&(!Number.isInteger(t.cols)||!Number.isInteger(t.rows)||t.cols<20||t.cols>400||t.rows<5||t.rows>200))return;
   for(const listener of this.listeners)listener(t);
  }
 }
 post(m){if(this.port&&this.valid())try{this.port.postMessage(m);}catch{this.disconnect('Se perdió la conexión local.');}}
 terminal(m){if(m.t==='input'&&this.runtime?.mode!=='manual')return;this.post({type:'terminal',message:m});}
 control(action){if(!['start','resume','stop','room'].includes(action)||!this.valid()||!this.port)return false;this.error='';this.post({type:'control',id:this.win.crypto.randomUUID(),action});this.emit();return true;}
 subscribeTerminal(fn){this.listeners.add(fn);if(this.port)this.post({type:'snapshot'});return()=>this.listeners.delete(fn);}
 revoke(){if(this.caseId&&!this.valid())this.disconnect();}
 disconnect(error=''){
  this.win.clearTimeout(this.deadline);this.win.clearInterval(this.timer);try{this.port?.postMessage({type:'disconnect'});}catch{}this.port?.close();this.port=null;
  this.popup=null;this.nonce=null;this.caseId=null;this.runtime=null;this.status='disconnected';this.error=error;
  for(const fn of this.listeners)fn({t:'clear'});this.emit();
 }
 dispose(){this.disconnect();this.listeners.clear();this.win.removeEventListener('message',this.receive);}
}
