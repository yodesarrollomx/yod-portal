import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPorteroTransport} from '../../runtime/portero-http.mjs';
import {CodexCliExecutor} from '../../runtime/codex-cli-executor.mjs';
import {ContinuousRoomHost} from '../../runtime/continuous-room-host.mjs';
import {canResumeClaim} from '../../runtime/claim-recovery.mjs';
import {diagnosticCode} from '../../runtime/errors.mjs';

process.umask(0o077);
const root=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Falta la carpeta privada.');
const link=JSON.parse(await fs.readFile(path.join(root,'room-connection.json'),'utf8'));
const statePath=path.join(root,'room-state.json');
const statusPath=path.join(root,'room-status.json');
async function readState(){try{return JSON.parse(await fs.readFile(statePath,'utf8'));}catch(e){if((e as any).code==='ENOENT')return null;throw e;}}
async function atomic(file:string,value:unknown){
 const temp=file+'.'+randomUUID()+'.tmp';
 const handle=await fs.open(temp,'wx',0o600);
 try{await handle.writeFile(JSON.stringify(value));await handle.sync();}finally{await handle.close();}
 await fs.rename(temp,file);
 const directory=await fs.open(path.dirname(file),'r');try{await directory.sync();}finally{await directory.close();}
}
const log=(s:string)=>console.log(new Date().toLocaleTimeString('es-MX',{timeZone:'America/Hermosillo'})+' · '+s);
let stopping=false;
const cancellation=new AbortController();
for(const sig of ['SIGINT','SIGTERM','SIGHUP'] as const)process.on(sig,()=>{stopping=true;cancellation.abort();});
const pause=(ms:number)=>new Promise<void>(resolve=>{if(stopping){resolve();return;}const t=setTimeout(done,ms);function done(){clearTimeout(t);cancellation.signal.removeEventListener('abort',done);resolve();}cancellation.signal.addEventListener('abort',done,{once:true});});
const transport=createPorteroTransport({...link,timeout:25000});
const model=new CodexCliExecutor();
const host=new ContinuousRoomHost({backend:transport.backend,executor:{execute:(input:unknown)=>model.execute(input as any,{signal:cancellation.signal})},worker_id:link.worker_id,readState,saveState:(s:unknown)=>atomic(statePath,s),log,
 onSnapshot:async(snapshot:any)=>{
  await atomic(path.join(root,'workspace','expediente.json'),snapshot);
 }});
let heartbeat:NodeJS.Timeout|undefined,beating=false,proof:any;
async function beat(){
 if(beating||stopping)return;beating=true;
 try{
  const r=await transport.heartbeat(proof);
  if(!r.ok)throw Error('heartbeat_rejected');
  await atomic(statusPath,{connected:true,at:Date.now(),phase:'ready'});
 }catch{await atomic(statusPath,{connected:false,at:Date.now(),phase:'reconnecting'}).catch(()=>{});}
 finally{beating=false;}
}
async function main(){
 if(!await host.checkStartup()){
  await atomic(statusPath,{connected:false,at:Date.now(),phase:'review_required'});
  log('Hay un turno previo sin confirmar. Se necesita revisión antes de continuar.');return;
 }
 log('Comprobando la sesión de Codex de esta Chromebook…');
 const probe=await model.execute({timeout_ms:60000,snapshot:{job_id:'probe-'+randomUUID(),case_id:'synthetic-probe',source_revision:'probe-v1',source_refs:[],context:{identity:{case_id:'synthetic-probe',name:'Comprobación de conexión'},mandate:'Verificar acceso sin acciones externas.',instruction:'Confirma brevemente en español que puedes responder.'}}},{signal:cancellation.signal});
 proof={authenticated:probe.authenticated,execution_id:probe.execution_id};
 await beat();heartbeat=setInterval(()=>void beat(),25000);
 log('Motor iniciado. Escribe al agente desde Agentes en YOD OS.');
 while(!stopping){
  const result=await host.step();
  if(result.state==='blocked'||(result.state==='unconfirmed'&&!canResumeClaim(result,(await readState())?.claim_request_id))||result.diagnostic?.code==='auth_unavailable')break;
  await pause(result.state==='idle'?15000:10000);
 }
}
main().catch(e=>log('Conexión detenida: '+diagnosticCode(e))).finally(async()=>{
 stopping=true;if(heartbeat)clearInterval(heartbeat);
 while(beating)await new Promise(r=>setTimeout(r,50));
 await atomic(statusPath,{connected:false,at:Date.now(),phase:'stopped'}).catch(()=>{});
 log('Motor detenido. El expediente y la conversación permanecen en Sheets.');
});
