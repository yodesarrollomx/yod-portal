import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {WebSocketServer} from 'ws';
import {AgentTerminal} from './vendor/terminal.ts';
import {startKeeper,keeperPid,adoptPty,spawnPty,hooksReady,leaveKeeper,terminalsAvailable,type Pty} from './vendor/ptyClient.ts';

process.umask(0o077);
const port=Number(process.env.YOD_TERMINAL_PORT||4381);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Puerto inválido');
const origin=`http://127.0.0.1:${port}`;
const root=path.resolve(process.env.YOD_TERMINAL_HOME||path.join(os.homedir(),'.local/share/yod-terminal'));
const workspace=path.join(root,'workspace');
const keeper=path.join(root,'keeper');
const screen=path.join(root,'screen.txt');
await fs.mkdir(workspace,{recursive:true,mode:0o700});
await fs.mkdir(keeper,{recursive:true,mode:0o700});
const instructions=`# Agente local de YOD\nTrabaja en español dentro de esta carpeta. Esta es la instalación local de la terminal; el expediente privado y el avatar del caso aún no están conectados. No afirmes que puedes leer Sheets, gestionar tareas o publicar cambios sin comprobar la conexión correspondiente. Prepara, prueba y guarda los cambios de código y configuración que el usuario te encargue. Mantén la memoria de decisiones en esta carpeta. No cambies tus propios permisos ni copies credenciales. No uses otros agentes ni ejecutes tareas del negocio sin instrucciones del usuario.\n`;
await fs.writeFile(path.join(workspace,'AGENTS.md'),instructions,{flag:'wx',mode:0o600}).catch(e=>{if(e.code!=='EEXIST')throw e;});
const terminal=new AgentTerminal();
await terminal.load(screen).catch(e=>{if(e.code!=='ENOENT')throw e;});
let proc:Pty|null=null,closing=false,mode:'manual'|'room'|null=null;
function bind(p:Pty,nextMode:'manual'|'room'='manual'){
 proc=p;mode=nextMode;terminal.bind(p);
 p.onData(data=>terminal.write(data));
 p.onExit(code=>{if(proc===p){proc=null;mode=null;terminal.bind(null);terminal.note(`Sesión terminada (${code}). Puedes reabrirla.`);}});
}
const held=await startKeeper(keeper,()=>({}));
if(!terminalsAvailable||!keeperPid())throw Error('No se pudo iniciar el servicio de terminales.');
const own=held.filter(h=>(h.meta as any)?.agentId==='yod-local');
if(own.length>1)throw Error('Hay varias sesiones; se requiere revisión antes de iniciar otra.');
if(own.length)bind(adoptPty(own[0]),(own[0].meta as any)?.mode==='room'?'room':'manual');
hooksReady();
const roomLink=path.join(root,'room-connection.json');
const roomEnabled=path.join(root,'room-enabled');
const hasLink=()=>fs.access(roomLink).then(()=>true,()=>false);
async function startRoom(){
 if(proc)throw Error('Ya hay una sesión abierta.');
 if(!await hasLink())throw Error('Falta el vínculo privado del Despacho.');
 await fs.writeFile(roomEnabled,'enabled',{mode:0o600});
 const env=Object.fromEntries(Object.entries(process.env).filter(([k,v])=>v!==undefined&&!/^(OPENAI_API_KEY|ANTHROPIC_API_KEY|YOD_)/.test(k))) as Record<string,string>;
 bind(spawnPty(process.execPath,[path.join(import.meta.dirname,'room.js'),root],{cols:terminal.cols,rows:terminal.rows,cwd:workspace,env},{agentId:'yod-local',mode:'room'}),'room');
}
let controlling=false;
let saving=Promise.resolve();
const save=()=>saving=saving.then(()=>terminal.save(screen)).catch(()=>console.error('No se pudo guardar la pantalla de la terminal.'));
const interval=setInterval(()=>{if(terminal.dirty)void save();},5000);
const session=crypto.randomBytes(32).toString('hex');
const cookie=`yod_terminal=${session}`;
const authorized=(req:http.IncomingMessage)=>(req.headers.cookie||'').split(';').some(c=>c.trim()===cookie);
const validHost=(req:http.IncomingMessage)=>req.headers.host===`127.0.0.1:${port}`||req.headers.host===`localhost:${port}`;
const validOrigin=(req:http.IncomingMessage)=>req.headers.origin===origin||req.headers.origin===`http://localhost:${port}`;
const publicDir=path.resolve(import.meta.dirname,'../public');
const assets=new Map([['/','index.html'],['/client.js','client.js'],['/client.css','client.css'],['/pair','pair.html'],['/pair.js','pair.js']]);
const server=http.createServer(async(req,res)=>{
 try{
  if(!validHost(req)){res.writeHead(403).end();return;}
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'");
  if(req.method==='GET'&&assets.has(req.url||'')){
   // Cross-site subresources cannot obtain a session. Local top-level navigation can.
   if(req.headers['sec-fetch-site']==='cross-site'&&req.headers['sec-fetch-mode']!=='navigate'){res.writeHead(403).end();return;}
   if(req.url==='/'||req.url==='/pair')res.setHeader('Set-Cookie',`${cookie}; HttpOnly; SameSite=Strict; Path=/`);
   res.setHeader('Content-Type',req.url==='/'||req.url==='/pair'?'text/html; charset=utf-8':req.url?.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');
   res.end(await fs.readFile(path.join(publicDir,assets.get(req.url!)!)));return;
  }
  if(!authorized(req)){res.writeHead(401).end();return;}
  if(req.method==='GET'&&req.url==='/bridge-context'){
   let scope:any=null;try{scope=JSON.parse(await fs.readFile(path.join(root,'terminal-scope.json'),'utf8'));}catch{}
   if(!scope||typeof scope.case_id!=='string'||!scope.case_id||scope.case_id.length>256||typeof scope.name!=='string'||scope.name.length>120){res.writeHead(409).end('Falta configurar el puesto.');return;}
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({case_id:scope.case_id,name:scope.name,version:'0.3.0'}));return;
  }
  if(req.method==='GET'&&req.url==='/status'){
   let state:any=null;try{state=JSON.parse(await fs.readFile(path.join(root,'room-status.json'),'utf8'));}catch{}
   let checkpoint:any=null;try{checkpoint=JSON.parse(await fs.readFile(path.join(root,'room-state.json'),'utf8'));}catch{}
   const needsReview=!proc&&checkpoint&&!['idle','claiming'].includes(checkpoint.phase);
   const connected=!!proc&&mode==='room'&&state?.connected===true&&Number.isFinite(state.at)&&state.at<=Date.now()&&state.at>Date.now()-90000;
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({live:!!proc,keeper:true,agent:'yod-local',mode,room_link:await hasLink(),room:connected,sheets:connected,needs_review:!!needsReview,phase:state?.phase||'pending'}));return;
  }
  if(req.method!=='POST'||!validOrigin(req)){res.writeHead(403).end();return;}
  if(controlling){res.writeHead(409).end('Hay una operación de sesión en curso.');return;}
  controlling=true;try{
  if(req.url==='/room'){
   if(proc){res.writeHead(409).end('Primero detén la sesión abierta.');return;}
   await startRoom();res.writeHead(204).end();return;
  }
  if(req.url==='/start'||req.url==='/resume'){
   if(proc){res.writeHead(409).end('Ya hay una sesión abierta.');return;}
   const args=['--no-alt-screen','--sandbox','workspace-write','--ask-for-approval','on-request','-C',workspace];
   if(req.url==='/resume')args.push('resume','--last');
   // No raw shell, model override, approval bypass or automatic prompt.
   const env=Object.fromEntries(Object.entries(process.env).filter(([k,v])=>v!==undefined&&!/^(OPENAI_API_KEY|ANTHROPIC_API_KEY|YOD_)/.test(k))) as Record<string,string>;
   bind(spawnPty('codex',args,{cols:terminal.cols,rows:terminal.rows,cwd:workspace,env},{agentId:'yod-local'}));
   res.writeHead(204).end();return;
  }
  if(req.url==='/stop'){await fs.unlink(roomEnabled).catch((e:any)=>{if(e.code!=='ENOENT')throw e;});proc?.kill();res.writeHead(204).end();return;}
  res.writeHead(404).end();
  }finally{controlling=false;}
 }catch{res.writeHead(500).end('No se pudo completar la operación.');}
});
const sockets=new WebSocketServer({noServer:true,maxPayload:65536});
server.on('upgrade',(req,socket,head)=>{
 if(req.url!=='/terminal'||!validHost(req)||!validOrigin(req)||!authorized(req)){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
 sockets.handleUpgrade(req,socket,head,ws=>terminal.attach(ws));
});
server.listen(port,'127.0.0.1',async()=>{
 console.log(`YOD · Terminal local: ${origin}\nUna sesión a la vez.`);
 if(!proc&&await fs.access(roomEnabled).then(()=>true,()=>false))await startRoom().catch(()=>console.error('No se pudo reabrir el motor del Despacho.'));
});
server.on('error',e=>{console.error(e.message);void shutdown();});
async function shutdown(){
 if(closing)return;closing=true;clearInterval(interval);
 await terminal.flush();await save();leaveKeeper();terminal.dispose();server.close();
 setTimeout(()=>process.exit(0),150).unref();
}
process.on('SIGTERM',()=>void shutdown());process.on('SIGINT',()=>void shutdown());
