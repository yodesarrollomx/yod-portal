import {createHmac} from 'node:crypto';
import {canonicalJson} from './validation.mjs';
import {REQUIRED_OPERATIONS} from './backend-adapter.mjs';
import {RuntimeError} from './errors.mjs';

// Credentials are supplied by the trusted launcher, never embedded in source/URLs.
export function createPorteroTransport({endpoint,worker_id,key,fetch:fetcher=fetch,now=Date.now,timeout=15000}) {
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)||
    !/^[A-Za-z0-9_.:-]{1,200}$/.test(worker_id)||!/^[a-f0-9]{64}$/.test(key)||typeof fetcher!=='function')
    throw new RuntimeError('invalid_configuration');
  async function call(operation,payload,{signal}={}) {
    const at=now();
    const signature=createHmac('sha256',key).update(canonicalJson({operation,payload,at,worker_id})).digest('hex');
    const controller=new AbortController();
    const abort=()=>controller.abort();
    if(signal?.aborted)abort(); else signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(abort,timeout);
    try {
      const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},
        body:JSON.stringify({tipo:'despacho-v1',operation,payload,worker:{id:worker_id,at,signature}}),
        credentials:'omit',redirect:'follow',signal:controller.signal});
      if(!response.ok)throw new RuntimeError('backend_unavailable');
      const raw=await response.text();
      if(raw.length>524288)throw new RuntimeError('invalid_result');
      return JSON.parse(raw);
    } catch(error) {
      if(error instanceof RuntimeError)throw error;
      throw new RuntimeError(controller.signal.aborted?'backend_timeout':'backend_unavailable');
    } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  const backend=Object.fromEntries(REQUIRED_OPERATIONS.map(name=>[name,(payload,controls)=>call(name,payload,controls)]));
  return Object.freeze({backend:Object.freeze(backend),heartbeat:proof=>call('heartbeat',proof)});
}
