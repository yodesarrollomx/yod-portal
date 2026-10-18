#!/usr/bin/env node
'use strict';
// Intended for a trusted operator/server identity. No network or external writes.
const {readFileSync,mkdirSync,realpathSync,existsSync}=require('node:fs');const {resolve,relative,dirname,basename,sep,isAbsolute}=require('node:path');
function main(){
  const filename=process.env.YOD_CORE_DB;
  if(!filename)throw Object.assign(Error('YOD_CORE_DB_required'),{code:'YOD_CORE_DB_required'});
  // Do not accidentally create real operational data in a published source tree.
  const root=realpathSync(resolve(__dirname,'..')),candidate=resolve(filename);
  mkdirSync(dirname(candidate),{recursive:true,mode:0o700});
  const target=existsSync(candidate)?realpathSync(candidate):resolve(realpathSync(dirname(candidate)),basename(candidate));
  const rel=relative(root,target);
  if(!(rel==='..'||rel.startsWith('..'+sep))&&!isAbsolute(rel))throw Object.assign(Error('private_path_required'),{code:'private_path_required'});
  const store=require('./store.cjs').openStore(target);
  try{
    const raw=readFileSync(0,'utf8');if(raw.length>65536)throw Object.assign(Error('command_too_large'),{code:'command_too_large'});
    const command=JSON.parse(raw);let result;
    if(command.type==='get')result=store.get(command.workId);
    else if(command.type==='list')result=store.list(command);
    else if(command.type==='events')result=store.events(command.workId);
    else if(command.type==='receipt')result=store.receipt(command.requestId);
    else if(command.type==='metrics')result=store.metrics();
    else result=store.execute(command);
    process.stdout.write(JSON.stringify({ok:true,result})+'\n');
  }finally{store.close();}
}
if(require.main===module){try{main();}catch(error){process.stderr.write(JSON.stringify({ok:false,error:error.code||'invalid_request'})+'\n');process.exitCode=1;}}
module.exports={main};
