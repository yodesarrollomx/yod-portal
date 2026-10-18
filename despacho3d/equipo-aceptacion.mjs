import {createTeamSession, time} from './equipo-model.mjs?v=1';
const KEY='yod-equipo-aceptacion-v1';
async function fingerprint(text){return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),x=>x.toString(16).padStart(2,'0')).join('');}
export function createAcceptance({transport,isAuthorized,identityEpoch,storage,storageScope,requestId,digest=fingerprint}){
 if(!/^[a-f0-9]{64}$/.test(storageScope||''))throw Error('identity_missing');
 const storageKey=KEY+':'+storageScope;
 const session=createTeamSession({transport,isAuthorized,identityEpoch,requestId});
 const epoch=identityEpoch();let closed=false,busy=false,receipt=null;
 function authority(){if(closed||!isAuthorized()||identityEpoch()!==epoch)throw Error('session_changed');}
 function pending(){const raw=storage.getItem(storageKey);if(!raw)return null;const p=JSON.parse(raw);if(!/^[a-zA-Z0-9_-]{16,100}$/.test(p.id)||typeof p.task_id!=='string'||!/^[a-f0-9]{64}$/.test(p.text_sha256))throw Error('pending_invalid');return p;}
 async function check(value,p){authority();if(!value||value.version!==1||value.status!=='saved'||value.kind!=='note'||value.request_id!==p.id||value.task_id!==p.task_id||typeof value.text!=='string'||!value.id||!value.revision||!Number.isFinite(time(value.recorded_at))||await digest(value.text)!==p.text_sha256)throw Error('receipt_unconfirmed');authority();receipt=value;return value;}
 async function locked(fn){authority();if(busy)throw Error('busy');busy=true;try{return await fn();}finally{busy=false;}}
 return {
  read:()=>locked(()=>session.read()),
  pending:()=>{authority();return pending();},
  send:(task_id,text)=>locked(async()=>{if(pending())throw Error('pending_receipt');const intent=session.prepare({kind:'note',task_id,text});const p={id:intent.request_id,task_id,text_sha256:await digest(text)};authority();storage.setItem(storageKey,JSON.stringify(p));return check(await session.send(),p);}),
  recover:()=>locked(async()=>{const p=pending();if(!p)throw Error('no_pending');const result=await transport.lookupReceipt(p.id);authority();if(result?.status==='not_found'&&result.request_id===p.id)return {status:'not_found',request_id:p.id};return check(result,p);}),
  revoke(){closed=true;receipt=null;session.revoke();},
 };
}
export function mountAcceptance({container,transport,isAuthorized,identityEpoch,storageScope,host=globalThis}){
 const section=document.createElement('section');section.setAttribute('aria-label','Aceptación de nota del equipo');
 section.innerHTML='<h2>Comprobar la nota del equipo</h2><p>La nota y su tarea se revisan aquí antes de guardarlas. El compositor general continúa pendiente de aceptación.</p><button data-read>Leer bitácora</button><p role="status" data-status></p><label>ID de la tarea existente<input data-task autocomplete="off"></label><label>Nota exacta del paquete privado<textarea data-text rows="5"></textarea></label><button data-send disabled>Guardar esta nota</button><button data-recover>Consultar recibo guardado</button><pre data-receipt></pre>';
 section.style.cssText='background:#fff;color:#24382e;padding:20px;border:1px solid #c6d2c9;border-radius:12px;max-width:760px;margin:16px;overflow-wrap:anywhere';
 section.querySelectorAll('label,input,textarea').forEach(el=>el.style.cssText='display:block;width:100%;box-sizing:border-box;margin:10px 0;');
 section.querySelector('pre').style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';container.append(section);
 const find=q=>section.querySelector(q),status=find('[data-status]'),send=find('[data-send]');let revoked=false;
 const api=createAcceptance({transport,isAuthorized,identityEpoch,storage:host.sessionStorage,storageScope,requestId:()=>host.crypto.randomUUID()});
 async function run(fn){send.disabled=true;try{const result=await fn();if(revoked)return;if(result?.status==='saved'){find('[data-receipt]').textContent='Guardado · '+result.id+'\n'+result.task_id+'\n'+result.text;status.textContent='Recibo recuperado del servidor. El acuse de otro agente sigue pendiente.';}else if(result?.status==='not_found')status.textContent='El servidor no encontró este recibo. No se reenvió ninguna nota; conserva el identificador para conciliar.';else{status.textContent='Bitácora leída. Revisa ID y texto antes de guardar.';send.disabled=!!api.pending();}}catch(error){if(!revoked)status.textContent=error.message==='session_changed'?'La sesión cambió. Vuelve a validar tu acceso.':'Sin confirmación. Consulta el recibo antes de cualquier nuevo envío.';}}
 find('[data-read]').onclick=()=>run(()=>api.read());
 send.onclick=()=>run(()=>api.send(find('[data-task]').value,find('[data-text]').value));
 find('[data-recover]').onclick=()=>run(()=>api.recover());
 if(api.pending())void run(()=>api.recover());
 return {revoke(){revoked=true;api.revoke();section.remove();}};
}
