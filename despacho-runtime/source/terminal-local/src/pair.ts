// Local, explicit consent. No cross-origin HTTP or public terminal endpoint.
const OFFICE='https://yodesarrollomx.github.io';
const openerWindow=window.opener;
const nonce=location.hash.slice(1);
const status=document.getElementById('status')!;
const approve=document.getElementById('approve') as HTMLButtonElement;
const disconnect=document.getElementById('disconnect') as HTMLButtonElement;
let scope:any=null,requested=false,port:MessagePort|null=null,ws:WebSocket|null=null,mode:string|null=null;
let lastPing=0,polling=false,timer:ReturnType<typeof setInterval>|undefined,active=false;
const uuid=(s:unknown)=>typeof s==='string'&&/^[a-f0-9-]{36}$/i.test(s);
function emit(value:unknown){try{port?.postMessage(value);}catch{close();}}
function close(){active=false;clearInterval(timer);emitClosed();port?.close();port=null;ws?.close();ws=null;approve.disabled=true;disconnect.hidden=true;status.textContent='Sala desconectada. El proceso de Codex se conserva. Vuelve a conectar desde la sala.';}
function emitClosed(){try{port?.postMessage({type:'closed'});}catch{}}
async function state(){
 if(!active||polling)return;polling=true;
 try{const r=await fetch('/status');if(!r.ok)throw Error();const s=await r.json();mode=s.mode;emit({type:'status',status:s});}catch{close();}finally{polling=false;}
}
async function receive(event:MessageEvent){
 const m=event.data;if(!active||!m||typeof m!=='object')return;
 if(m.type==='ping'){lastPing=Date.now();emit({type:'pong'});return;}
 if(m.type==='disconnect'){close();return;}
 if(m.type==='snapshot'){openSocket();return;}
 if(m.type==='terminal'){
  const t=m.message;
  if(ws?.readyState!==WebSocket.OPEN||!t)return;
  if(t.t==='input'&&mode==='manual'&&typeof t.data==='string'&&t.data.length<=65536)ws.send(JSON.stringify({t:'input',data:t.data}));
  if(t.t==='resize'&&Number.isInteger(t.cols)&&Number.isInteger(t.rows)&&t.cols>=20&&t.cols<=400&&t.rows>=5&&t.rows<=200)ws.send(JSON.stringify({t:'resize',cols:t.cols,rows:t.rows}));
  return;
 }
 if(m.type==='control'&&uuid(m.id)&&['start','resume','stop','room'].includes(m.action)){
  try{const r=await fetch('/'+m.action,{method:'POST'});emit({type:'control-result',id:m.id,ok:r.ok,message:r.ok?'':(await r.text()).slice(0,200)});await state();}catch{emit({type:'control-result',id:m.id,ok:false,message:'No se pudo contactar con la terminal.'});}
 }
}
window.addEventListener('message',event=>{
 if(event.source!==openerWindow||event.origin!==OFFICE||event.data?.type!=='yod:terminal:hello'||event.data.version!==1||event.data.nonce!==nonce||!scope||event.data.case_id!==scope.case_id||active)return;
 requested=true;approve.disabled=false;document.getElementById('description')!.hidden=false;status.textContent=`Puesto: ${scope.name}. YOD OS solicita usar la terminal de esta Chromebook.`;
});
function openSocket(){
 if(ws){ws.onclose=null;ws.onmessage=null;ws.onerror=null;ws.close();}
 ws=new WebSocket(`ws://${location.host}/terminal`);
 ws.onmessage=event=>{if(active)try{const m=JSON.parse(event.data);if(['snapshot','data','size','live'].includes(m.t))emit({type:'terminal',message:m});}catch{}};
 ws.onclose=()=>{if(active)close();};ws.onerror=()=>close();
}
approve.onclick=()=>{
 if(!requested||!scope||active||!openerWindow)return;
 active=true;approve.disabled=true;disconnect.hidden=false;lastPing=Date.now();
 const channel=new MessageChannel();port=channel.port1;port.onmessage=receive;port.start();
 openerWindow.postMessage({type:'yod:terminal:approved',version:1,nonce,case_id:scope.case_id},OFFICE,[channel.port2]);
 openSocket();
 status.textContent='Conexión activa. Vuelve a la sala; conserva esta ventana abierta.';
 void state();timer=setInterval(()=>{if(openerWindow.closed||Date.now()-lastPing>20000)close();else void state();},4000);
};
disconnect.onclick=close;window.addEventListener('pagehide',close);
async function init(){
 if(!openerWindow||!uuid(nonce)){status.textContent='Abre esta conexión desde Terminal dentro de Agentes en YOD OS.';return;}
 try{const r=await fetch('/bridge-context');if(!r.ok)throw Error();scope=await r.json();status.textContent='Esperando la solicitud de la sala…';openerWindow.postMessage({type:'yod:terminal:ready',version:1,nonce},OFFICE);}catch{status.textContent='Este puesto necesita la actualización local de YOD. No se cambió ninguna sesión.';}
}
void init();
