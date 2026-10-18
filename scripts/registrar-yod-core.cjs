'use strict';
// Deterministic architecture registration; refuses a concurrently changed model.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),file=path.join(root,'docs/arquitectura/modelo.json');
const model=JSON.parse(fs.readFileSync(file,'utf8'));
const expected='2026-10-18.equipo-relevo.4',revision='2026-10-18.yod-core.1';
if(![expected,revision].includes(model.revision))throw Error('model_changed_reconcile_before_registration');
const change=JSON.parse(fs.readFileSync(path.join(root,'yod-core/change.json'),'utf8'));
if(change.id!=='CHG-YOD-CORE-20261017'||JSON.stringify(change.components)!=='["SYS-YOD-OS"]')throw Error('unexpected_core_change');
model.changes=model.changes.filter(item=>item.id!==change.id).concat([change]);
model.revision=revision;model.checked_at='2026-10-18';
const prefixes=['os/yod-core-domain.cjs','tests/yod-core-domain.test.cjs','yod-core/','.github/workflows/yod-core.yml','scripts/registrar-yod-core.cjs','.github/workflows/yod-core-register.yml'];
for(const prefix of prefixes){
 const existing=model.path_ownership.find(item=>item.repo==='yodesarrollomx/yod-portal'&&item.prefix===prefix);
 if(existing&&JSON.stringify(existing.components)!=='["SYS-YOD-OS"]')throw Error('ownership_conflict');
 if(!existing)model.path_ownership.push({repo:'yodesarrollomx/yod-portal',prefix,components:['SYS-YOD-OS']});
}
fs.writeFileSync(file,JSON.stringify(model,null,2)+'\n');
fs.writeFileSync(path.join(root,'architecture-impact.json'),JSON.stringify({model_revision:revision,proposal_id:change.id,summary:change.proposal,components:change.components,tests:change.tests,rollback:change.rollback},null,2)+'\n');
cp.execFileSync(process.execPath,[path.join(root,'scripts/arquitectura.cjs')],{cwd:root,stdio:'inherit'});
