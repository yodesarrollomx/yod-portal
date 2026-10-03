import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
const term=new Terminal({cursorBlink:true,screenReaderMode:true,scrollback:2500,fontSize:14,theme:{background:'#101b20',foreground:'#f1f0e9'}});
const fit=new FitAddon();term.loadAddon(fit);term.open(document.getElementById('terminal')!);fit.fit();
const status=document.getElementById('status')!;
let socket:WebSocket|null=null,connected=false,live=false,roomLink=false,needsReview=false,mode:string|null=null;
function controls(){for(const id of ['start','resume'])(document.getElementById(id) as HTMLButtonElement).disabled=!connected||live;(document.getElementById('stop') as HTMLButtonElement).disabled=!connected||!live;(document.getElementById('room') as HTMLButtonElement).disabled=!connected||live||!roomLink||needsReview;}
async function roomStatus(){
 try{
  const r=await fetch('/status');if(!r.ok)return;const s=await r.json();roomLink=s.room_link;mode=s.mode;needsReview=s.needs_review;
  document.getElementById('connection')!.textContent=needsReview?'Hay un turno sin confirmar. Hace falta revisar su guardado antes de continuar.':s.room?'Despacho conectado. Escribe al agente desde Agentes en YOD OS.':mode==='room'?'Motor del Despacho abierto · comprobando conexión.':roomLink?'Vínculo privado instalado. Pulsa Atender Despacho para conectar.':'El vínculo con el expediente aún no está instalado.';
  if(mode==='room')status.textContent=s.room?'Agente · atendiendo el Despacho':'Agente · revisando conexión';
  controls();
 }catch{}
}
function send(v:unknown){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(v));}
term.onData(data=>send({t:'input',data}));term.onResize(({cols,rows})=>send({t:'resize',cols,rows}));
new ResizeObserver(()=>fit.fit()).observe(document.getElementById('terminal')!);
function connect(){
 socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/terminal`);
 socket.onopen=()=>{connected=true;controls();};
 socket.onmessage=e=>{
  const m=JSON.parse(e.data);
  if(m.t==='snapshot'){term.reset();term.resize(m.cols,m.rows);term.write(m.data,()=>fit.fit());live=m.live;}
  if(m.t==='data')term.write(m.data);
  if(m.t==='size')term.resize(m.cols,m.rows);
  if(m.t==='live')live=m.live;
  status.textContent=live?(mode==='room'?'Agente · motor del Despacho':'Terminal de Codex abierta'):'Terminal lista · inicia o reabre una sesión';controls();
 };
 socket.onclose=()=>{connected=false;controls();status.textContent='Conexión cerrada. Vuelve a abrir la página cuando el servicio esté activo.';};
 socket.onerror=()=>{status.textContent='No se pudo conectar. Recarga esta página.';};
}
for(const id of ['start','resume','stop','room'])document.getElementById(id)!.onclick=async()=>{
 const r=await fetch('/'+id,{method:'POST'}).catch(()=>null);
 if(!r?.ok)status.textContent=r?await r.text():'No se pudo contactar con la terminal.';
 else {term.focus();void roomStatus();}
};
controls();connect();void roomStatus();setInterval(()=>void roomStatus(),4000);
