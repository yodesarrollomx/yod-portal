// Local prototype metrics only; no finance engine, network or business acceptance.
const STAGES=['research','review','ready'];
export function boardMetrics(model,state,interaction=null){
 if(!model||state?.case_id!==model.id)throw Error('metrics_case_mismatch');
 const own=s=>s?.case_id===model.id,source=id=>model.sources.find(s=>s.id===id&&own(s));
 const d=interaction?.case_id===model.id?interaction:null;
 const correction=d?.correction;
 const surfaceDone=Boolean(correction&&correction.case_id===model.id&&correction.source_id===model.id+':deed'&&source(correction.source_id)&&correction.after===d.surface_m2&&correction.scope==='dummy_local');
 const receipt=stage=>Boolean(d?.events.some(ev=>ev.kind==='local_receipt'&&ev.id===model.id+':stage-'+stage&&ev.stage===stage&&STAGES.includes(stage)));
 const results=[
 {id:'surface',name:'Terreno',title:'Alinear la superficie',source_id:model.id+':deed',done:surfaceDone},
 {id:'norm',name:'Reglas',title:'Reunir restricciones',source_id:model.id+':norm-list',done:receipt('review')},
 {id:'market',name:'Mercado',title:'Reunir referencias',source_id:model.id+':market-study',done:receipt('research')},
 {id:'decision',name:'Decisión',title:'Preparar la recomendación',source_id:model.id+':model',done:surfaceDone&&receipt('ready')}
 ];
 const next=results.find(r=>!r.done)||{id:'presentation',name:'Presentación',title:'Revisar la entrega',done:false};
 const normIds=source(model.id+':norm-list')?.related||[];
 const norms=normIds.map(source).filter(Boolean);
 const official=norms.filter(s=>s.kind==='official'&&s.status==='verified'&&s.validity&&s.validity!=='Sin vigencia legal').length;
 const selected=model.scenarios.find(s=>s.id===state.scenario_id&&own(s));
 const defended=model.scenarios.find(s=>s.id===model.defended_scenario_id&&own(s));
 return {case_id:model.id,scope:'demo_local',results,total:results.length,done:results.filter(r=>r.done).length,next,
  surface:d?.surface_m2??null,source_surface:d?.source_surface_m2??null,surfaceDone,
  documents:model.documents.filter(id=>source(id)).length,norms:norms.length,official,
  market:model.market.filter(r=>r.unit&&source(r.source_id)).length,
  selected,defended,versions:model.scenarios.filter(own).length,date:model.updated_at,revision:model.revision};
}
