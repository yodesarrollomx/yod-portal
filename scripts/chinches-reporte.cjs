#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
function summarize(registry,pkg){
 const rows=registry.integrations.map(i=>({id:i.id,repository:i.repository,mode:i.mode,targetVersion:i.targetVersion,integrationConfirmed:i.integrationConfirmed===true,surfaces:i.surfaces||[],capturePolicy:i.capturePolicy,sourceCommit:i.source?.commit||null,runtimeVersion:i.runtime?.version||null,receiptVerified:i.runtime?.receiptVerified===true,replayVerified:i.runtime?.replayVerified===true,backendVersion:i.backend?.publishedVersion||null}));
 return {schemaVersion:1,version:pkg.version,sequenceProtocol:pkg.sequenceProtocol,registered:rows.length,sourceConfirmed:rows.filter(i=>i.integrationConfirmed).length,unknown:rows.filter(i=>!i.integrationConfirmed).map(i=>i.id),pendingReceipt:rows.filter(i=>!i.receiptVerified).map(i=>i.id),pendingReplay:rows.filter(i=>!i.replayVerified).map(i=>i.id),integrations:rows,scope:'Public source inventory only; runtime and private review require independent evidence.'};
}
function compatibility(registry){return registry.integrations.map(i=>({repo:i.repository.split('/')[1],files:(i.surfaces||[]).map(p=>'HEAD:'+p),commit:i.source?.auditedCommit||i.source?.commit||null,capturador:i.mode,secuencia:i.integrationConfirmed===true?'Paquete objetivo '+i.targetVersion+'; publicación, recibo y reproducción se acreditan por separado.':'Integración pendiente de verificar; no equivale a ausencia de chinches.',revision:'Registro canónico chinche/registro.json; plan incremental privado por ID/huella, corte de observación separado de revisión.',implementacion:i.source?.commit||null,canonicalRegistry:'chinche/registro.json',targetVersion:i.targetVersion}));}
function validate(registry,pkg){
 if(registry.schemaVersion!==1||!Array.isArray(registry.integrations))throw Error('Registro inválido');
 const ids=new Set(),surfaces=new Set();
 for(const i of registry.integrations){
  if(ids.has(i.id))throw Error('ID duplicado');ids.add(i.id);
  if(typeof i.integrationConfirmed!=='boolean'||!['dom-guarded','technical-card','none'].includes(i.capturePolicy)||!i.review?.source)throw Error('Falta estado de integración, captura o revisión: '+i.id);
  if(i.targetVersion!==pkg.version)throw Error('Versión objetivo fuera de control: '+i.id);
  for(const s of i.surfaces||[]){const key=i.repository+'#'+s;if(surfaces.has(key))throw Error('Superficie duplicada: '+key);surfaces.add(key);}
 }
 const text=JSON.stringify(registry);
 if(/data:(?:audio|image)|script\.google\.com\/macros\/s\/|spreadsheets\/d\/|\"(?:access_token|api_key|password|secret)\"/i.test(text))throw Error('El registro público no admite contenido privado ni credenciales');
 return true;
}
function scan(directory,repository,registry){
 const confirmed=registry.integrations.filter(i=>i.repository===repository),files=[];let inspected=0;
 const excluded=new Set(['.git','node_modules','dist','build','vendor','releases','.next','.venv','tests','test','scripts','.github']);
 function walk(dir,depth=0){if(depth>20)throw Error('Límite de profundidad');for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink())continue;const absolute=path.join(dir,entry.name);
  if(entry.isDirectory()){if(!excluded.has(entry.name))walk(absolute,depth+1);continue;}
  if(!/\.(?:html|js|mjs|cjs|jsx|ts|tsx|gs)$/i.test(entry.name))continue;
  if(++inspected>20000)throw Error('Límite de archivos');const stat=fs.statSync(absolute);if(stat.size>4000000)continue;
  const data=fs.readFileSync(absolute),text=data.toString('utf8');
  if(!/YODChinche\.(?:init|anotar|anotarElemento|senalar|pila)|YodChincheSecuencia\.(?:mount|replay)|EMDpins\.|(?:src|import)[^\n]{0,200}chinche\.js/.test(text))continue;
  const relative=path.relative(directory,absolute).split(path.sep).join('/');
  const matches=confirmed.filter(i=>(i.surfaces||[]).some(p=>p===relative||p.endsWith('/')&&relative.startsWith(p))||(i.targets||[]).some(t=>t.path===relative));
  // Documentation may quote runtime calls; it remains a candidate rather than a proven surface.
  const role=relative.startsWith('docs/')?'documentation-candidate':'runtime-candidate';
  files.push({path:relative,sha256:hash(data),registeredAs:matches.map(i=>i.id),role,status:matches.length?'covered-source':role==='documentation-candidate'?'candidate-only':'unregistered-source'});
 }}walk(directory);
 return {schemaVersion:1,repository,inspected,files,unregistered:files.filter(f=>f.status==='unregistered-source').map(f=>f.path),candidates:files.filter(f=>f.status==='candidate-only').map(f=>f.path),absenceMeans:'No matching code is not evidence that an integration does not exist.'};
}
function immutableReleases(root,base){
 if(!/^[a-f0-9]{40}$/.test(base||'')||/^0+$/.test(base))throw Error('Commit base requerido para proteger releases');
 const names=execFileSync('git',['-C',root,'diff','--name-status','-z',base,'HEAD','--','chinche/releases/'],{encoding:'utf8'}).split('\0').filter(Boolean);
 for(let n=0;n<names.length;n+=2){const status=names[n],name=names[n+1];if(status!=='A')throw Error('No modificar un release publicado: '+name);const parts=name.split('/'),version=parts[2];try{execFileSync('git',['-C',root,'cat-file','-e',base+':chinche/releases/'+version],{stdio:'ignore'});throw Error('No añadir archivos a un release publicado: '+version);}catch(e){if(e.message?.startsWith('No añadir'))throw e;if(typeof e.status!=='number')throw e;}}
 return true;
}
function main(args=process.argv.slice(2)){
 const registry=JSON.parse(fs.readFileSync(path.join(ROOT,'chinche/registro.json'))),pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'chinche/paquete.json')));validate(registry,pkg);
 if(args.includes('--base-ref'))immutableReleases(ROOT,args[args.indexOf('--base-ref')+1]);
 if(args.includes('--scan')){const n=args.indexOf('--scan'),r=args.indexOf('--repository');if(r<0||!args[n+1]||!args[r+1])throw Error('Usar --scan DIR --repository owner/repo');console.log(JSON.stringify(scan(path.resolve(args[n+1]),args[r+1],registry),null,2));return;}
 const outputs={'chinche/cobertura.json':summarize(registry,pkg),'docs/arquitectura/chinches-inventario.json':compatibility(registry)};
 for(const [name,value]of Object.entries(outputs)){const desired=JSON.stringify(value,null,2)+'\n',file=path.join(ROOT,name);if(args.includes('--check')){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==desired)throw Error('Regenerar reporte: '+name);}else fs.writeFileSync(file,desired);}
 console.log(JSON.stringify({ok:true,registered:registry.integrations.length,check:args.includes('--check')}));
}
if(require.main===module)try{main();}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={summarize,compatibility,validate,scan,immutableReleases};
