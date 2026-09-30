'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

function verify({model, impact, changed, repository}) {
  if (!impact || typeof impact !== 'object') throw new Error('Falta architecture-impact.json');
  for (const key of ['model_revision','proposal_id','summary','rollback']) if (typeof impact[key] !== 'string' || !impact[key].trim()) throw new Error('Impacto: falta ' + key);
  for (const key of ['components','tests']) if (!Array.isArray(impact[key]) || !impact[key].length || impact[key].some(x=>typeof x!=='string'||!x.trim())) throw new Error('Impacto: falta ' + key);
  if (impact.model_revision !== model.revision) throw new Error('El registro no corresponde a la revisión del modelo consultado');
  const ids = new Set(model.components.map(c=>c.id));
  for (const id of impact.components) if (!ids.has(id)) throw new Error('Componente desconocido: '+id);
  const proposal = model.changes.find(c=>c.id===impact.proposal_id);
  if (!proposal) throw new Error('La propuesta debe existir primero en el modelo: '+impact.proposal_id);
  for (const id of impact.components) if (!proposal.components.includes(id)) throw new Error('La propuesta no incluye '+id);
  if (repository && !impact.components.some(id=>model.components.some(c=>c.id===id&&c.repo===repository))) throw new Error('Declarar al menos un componente de este repositorio');
  const behavioral = changed.filter(p=>!p.startsWith('docs/arquitectura/') && (p.startsWith('.github/workflows/') || /\.(?:[cm]?[jt]sx?|gs|py|html|css|sql|sh|json)$/i.test(p)) && p!=='architecture-impact.json');
  if (behavioral.length && !changed.includes('architecture-impact.json')) throw new Error('Cambió código o automatización sin actualizar architecture-impact.json: '+behavioral.join(', '));
  if (repository) for (const file of behavioral) {
    const rules=(model.path_ownership||[]).filter(r=>r.repo===repository&&(r.prefix===''||file===r.prefix||(r.prefix.endsWith('/')&&file.startsWith(r.prefix)))).sort((a,b)=>b.prefix.length-a.prefix.length);
    if(!rules.length) throw new Error('Archivo sin propietario en el modelo: '+file);
    for(const id of rules[0].components) if(!impact.components.includes(id)) throw new Error(file+': falta declarar impacto en '+id);
  }
  return {behavioral, proposal:proposal.id};
}

function verifyCheckout(expected,actual) {
  if(expected!==actual) throw new Error('HEAD_SHA no coincide con el checkout verificado');
}

function main() {
  const args=process.argv.slice(2); const arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const root=path.resolve(arg('--root',process.cwd()));
  const modelPath=path.resolve(arg('--model',path.join(root,'docs/arquitectura/modelo.json')));
  const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
  const impact=JSON.parse(fs.readFileSync(path.join(root,'architecture-impact.json'),'utf8'));
  const base=arg('--base',process.env.BASE_SHA); const head=arg('--head',process.env.HEAD_SHA||'HEAD');
  if (!base || /^0+$/.test(base)) throw new Error('Se requiere una revisión base real para comprobar impacto');
  for(const ref of [base,head]) if(!/^[A-Za-z0-9_./~^-]+$/.test(ref)||ref.startsWith('-'))throw new Error('Referencia git inválida');
  const commit=ref=>cp.execFileSync('git',['-C',root,'rev-parse','--verify',ref+'^{commit}'],{encoding:'utf8'}).trim();
  verifyCheckout(commit(head),commit('HEAD'));
  const changed=cp.execFileSync('git',['-C',root,'diff','--no-renames','--name-only','-z',base+'...'+head,'--'],{encoding:'utf8'}).split('\0').filter(Boolean);
  const result=verify({model,impact,changed,repository:arg('--repo',process.env.GITHUB_REPOSITORY)});
  console.log('Impacto válido: '+result.proposal+'; '+result.behavioral.length+' archivos de comportamiento. Lectura y revisión humana/agente documentadas en el PR.');
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={verify,verifyCheckout};
