import {validateSnapshot,time} from './equipo-model.mjs?v=1';

export const KANBAN_STATES=Object.freeze(['Pendiente','En proceso','Espera OK de Alejandro','Hecho']);
export function taskAge(value,now=Date.now()){
  const at=time(value);
  if(!Number.isFinite(at)||at>now)return 'Antigüedad sin comprobar';
  const minutes=Math.floor((now-at)/60000);
  return minutes<1?'Actualizado hace menos de 1 min':minutes<60?`Actualizado hace ${minutes} min`:
    minutes<1440?`Actualizado hace ${Math.floor(minutes/60)} h`:`Actualizado hace ${Math.floor(minutes/1440)} días`;
}
export function kanban(snapshot,owner='*',now=Date.now()){
  validateSnapshot(snapshot);
  if(!Number.isFinite(now))throw new Error('now_invalid');
  const rank=t=>{const at=time(t.updated_at);return Number.isFinite(at)&&at<=now?at:Infinity;};
  const tasks=snapshot.tasks.filter(t=>owner==='*'||t.owner===owner).slice()
    .sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id));
  return {blocked:tasks.filter(t=>t.status==='Bloqueado'),columns:KANBAN_STATES.map(status=>({status,tasks:tasks.filter(t=>t.status===status)}))};
}
export function ownerTone(owner,members){
  const label=members.find(m=>m.id===owner)?.label||owner;
  return label==='ChatGPT'?'chatgpt':label==='Claude'?'claude':
    ['Alejandro','Dirección'].includes(label)?'human':label==='Ambos'?'shared':'unknown';
}
