
import {demoWorkspace as work} from './agent-preview.mjs?v=4';
import {SCENES,FORMULAS,METHOD,createInteraction,correctSurface,advanceLocalWork,visitScene,onePeriodResult,CORRECTION_REQUEST,isCorrectionRequest} from './agent-dummy.data.mjs?v=1';
const $=id=>document.getElementById(id),e=work.escape,interactions=new Map(),sid=key=>work.current.model.id+':'+key;
function current(){const {model}=work.current;if(!interactions.has(model.id))interactions.set(model.id,createInteraction(model.id));return interactions.get(model.id);}
function button(action,label,primary=false){return '<button type="button" class="'+(primary?'primary':'quiet')+' dummy-cta" data-dummy-action="'+action+'">'+e(label)+'</button>';}
function localAgent(text,sourceKey=null){const {model,state}=work.current;state.messages.push({id:model.id+':dummy-message-'+state.messages.length,who:'agent',text,scenario_id:state.scenario_id,...(sourceKey?{source_id:sid(sourceKey)}:{})});}
function updateNext(){const d=current(),t=d.tasks.find(t=>!t.complete);work.current.model.next=t?t.title+' · '+t.next:'Revisar la presentación de ejemplo y decidir el siguiente encargo.';$('project-next').textContent='Siguiente: '+work.current.model.next;$('project-next').title=$('project-next').textContent;}
function patchSources(){
 updateNext();
 const {model,state}=work.current,d=current(),deed=model.sources.find(x=>x.id===sid('deed')),plot=model.sources.find(x=>x.id===sid('plot'));
 deed.original='Documento FICTICIO de '+model.name+': superficie declarada 644 m². No es una escritura real ni un dato de tu empresa.';deed.highlight='644 m²';deed.analysis='La ficha de ejemplo permite detectar una discrepancia con los 500 m² del borrador local. La escritura real, permiso y recibo se exigirían en el sistema auténtico.';
 plot.original='Borrador local del dummy: '+d.surface_m2+' m² de terreno. La ubicación es ilustrativa y no identifica un predio.';plot.highlight=d.surface_m2+' m²';plot.analysis=d.correction?'Corrección de ejemplo confirmada en memoria: 500 → 644 m², con referencia al documento ficticio. No se modificó Sheets.':'El borrador tiene 500 m²; la ficha ficticia señala 644. Antes de cambiarlo hay que comprobar la fuente.';
 if(d.correction&&!model.sources.some(s=>s.id===sid('local-change')))model.sources.push({id:sid('local-change'),case_id:model.id,kind:'example',card:'documentos',title:'Recibo de corrección · DUMMY',location:'Antes/después local',date:'2026-10-13',revision:'dummy-r1',original:'Superficie de ejemplo 500 → 644 m².',analysis:'Recibo en memoria. No hay escritura en Sheets.'});
 if(!state.dummy_initialized){state.dummy_initialized=true;state.messages=[{id:model.id+':dummy-welcome',who:'agent',text:'Estoy comparando alternativas. Antes de seguir encontré una diferencia: el borrador dice 500 m² y la ficha de ejemplo 644 m². ¿Revisamos esa fuente?',source_id:sid('deed'),scenario_id:state.scenario_id}];}
}
function formulaHTML(){
 const {state}=work.current,sc=work.current.model.scenarios.find(s=>s.id===state.scenario_id),cash={v1:115,v2:118,v3:120}[sc.id],r=onePeriodResult(-100,cash,.10);
 return '<div class="source-warning">Cálculos de demostración aislados. No reemplazan ni recalculan tu modelo de Sheets.</div><p>Consulta '+e(sc.label)+' · proyecto · un periodo anual · flujo normalizado −100 / '+cash+'. Tasa de descuento de ejemplo: 10% anual.</p><table class="formula-table"><thead><tr><th>Métrica</th><th>Ejemplo '+e(sc.label)+'</th></tr></thead><tbody><tr><td>TIR precargada / comprobación didáctica</td><td>'+sc.irr_percent+'% / '+(r.irr*100).toFixed(0)+'% anual</td></tr><tr><td>VPN del flujo normalizado</td><td>'+r.npv.toFixed(2)+' unidades</td></tr></tbody></table>'+FORMULAS.map(f=>'<section class="dummy-formula"><h3>'+e(f.name)+'</h3><code class="formula-expression">'+e(f.expression)+'</code><p>'+e(f.unit)+'</p><p class="formula-basis">'+e(f.basis)+'</p><p class="formula-warning">'+e(f.limit)+'</p></section>').join('')+work.sourceLink(sid('model'),'Ver flujo y fuente del escenario','↗');
}
function workHTML(){
 const d=current(),done=d.tasks.filter(t=>t.complete).length;
 const stage={pending:'Pendiente',research:'Registros reunidos',review:'Revisión de fuentes',ready:'Entrega de ejemplo lista'}[d.workflow_stage];
 const action=d.workflow_stage==='ready'?button('presentation','Ver la presentación de ejemplo',true):d.workflow_stage==='review'&&!d.correction?'<p class="formula-warning">La superficie sigue discrepante. La entrega no se cierra.</p>'+button('correction','Volver al dato pendiente',true):button('advance-work','Avanzar simulación un paso',true);
 const tasks=d.tasks.map(t=>'<section class="dummy-task"><h3>'+e(t.title)+' <span class="demo-status'+(t.complete?'':' pending')+'">'+(t.complete?'Recibo local':'Pendiente')+'</span></h3><dl><dt>Para qué</dt><dd>'+e(t.purpose)+'</dd><dt>Siguiente</dt><dd>'+e(t.complete?'Revisar el resultado y su referencia.':t.next)+'</dd><dt>Herramienta</dt><dd>'+e(t.station)+'</dd><dt>Entrega</dt><dd>'+e(t.result)+'</dd></dl>'+work.sourceLink(sid(t.source_key),'Abrir fuente de este entregable','↗')+'</section>').join('');
 return '<div class="source-warning">Trabajo SIMULADO y local. Sólo el botón avanza; no hay agente ejecutándose en un servidor ni 24/7.</div><div class="dummy-kicker"><span class="demo-status">'+e(stage)+'</span><span>Estación · '+e(d.station)+'</span></div><div class="dummy-metric-row"><strong>'+done+' de '+d.tasks.length+' entregables simulados</strong><span>Recibos locales simulados</span></div><div class="dummy-meter" role="progressbar" aria-label="Entregables de ejemplo" aria-valuemin="0" aria-valuemax="4" aria-valuenow="'+done+'" data-done="'+done+'"><span></span></div><div class="dummy-process">'+['Puesto','Investigación','Biblioteca','Juntas'].map(s=>'<span aria-current="'+(s===d.station)+'">'+s+'</span>').join(' → ')+'</div>'+action+tasks;
}
function presentationHTML(){
 const d=current(),first=d.presentation_page===1,ready=d.workflow_stage==='ready';
 return '<div class="dummy-kicker"><span class="demo-status'+(ready?'':' pending')+'">'+(ready?'Entrega de ejemplo lista':'Borrador; aún hay pendientes')+'</span><span>Lámina '+d.presentation_page+' de 2 · presentación V2 · consulta '+e(work.current.state.scenario_id.toUpperCase())+'</span></div><div class="slide-controls"><button class="quiet" type="button" data-dummy-action="slide-'+(first?'2':'1')+'">'+(first?'Siguiente lámina →':'← Lámina anterior')+'</button><span>Presentación local</span></div><section class="dummy-slide"><span class="eyebrow">PPP · '+e(work.current.model.name)+' · datos ficticios</span>'+(first?'<h3>La opción equilibrada requiere fuentes defendibles</h3><p class="formula-basis">TIR anual del proyecto · flujo ficticio normalizado</p><div class="slide-versions"><div><small>V1 · base</small><strong>15%</strong></div><div><small>V2 · defendida</small><strong>18%</strong></div><div><small>V3 · condicionada</small><strong>20%</strong></div></div><p>Mayor TIR no elimina la restricción de altura. V2 conserva la condición de defendida en este ejemplo.</p><p>Terreno: '+d.surface_m2+' m² '+(d.correction?'con recibo local de corrección.':'con discrepancia aún pendiente.')+'</p>':'<h3>La decisión siguiente es validar, no adivinar</h3><p><strong>Bloqueo:</strong> la condición normativa de V3 necesita un documento vigente aplicable.</p><p><strong>Encargo:</strong> reunir el artículo y su vigencia, cotejar altura/uso/ocupación y explicar el efecto sobre las alternativas.</p><p><strong>Criterio de cierre:</strong> fuente oficial, pasaje identificado, escenario y revisión correspondientes; recibo del resultado.</p>')+'</section><h3>Guion breve del autón</h3><p>'+e(first?'Con estos supuestos, V2 equilibra retorno y restricciones. V3 tiene más retorno ilustrativo, pero su normativa está pendiente. Abre cualquier dato para revisar su fuente.':'Para continuar necesitamos la restricción normativa comprobada. ¿Quieres que preparemos ese encargo con una entrega y una fuente concretas?')+'</p>'+work.sourceLink(sid(first?'model':'norm'),'Ver fuente que sostiene esta lámina','↗')+button('ask-presentation','Preparar pregunta en la conversación')+(!first?button('next-goal','Preparar el siguiente encargo',true):'');
}
function historyHTML(){
 const d=current();return '<p>Historial sólo del expediente '+e(work.current.model.name)+'. Ningún recibo equivale a guardado real.</p>'+(d.events.length?d.events.map((ev,i)=>'<div class="dummy-receipt"><strong>Evento local '+(i+1)+'</strong><p>'+e(ev.kind==='correction'?'Superficie: '+ev.receipt.before+' → '+ev.receipt.after+' '+ev.receipt.unit+' · '+ev.receipt.id:ev.id+' · '+ev.station)+'</p>'+(ev.kind==='correction'?work.sourceLink(ev.receipt.source_id,'Fuente del antes/después','↗'):'')+'</div>').join(''):'<p>No hay cambios ni avances de ejemplo registrados todavía.</p>');
}
function overviewHTML(){const d=current();return '<div class="source-warning">Todas las escenas pertenecen al mismo puesto. Un único PPP y una conversación; sólo cambia el contexto que estás revisando.</div><ul class="dummy-overview-list">'+SCENES.map((s,i)=>'<li><button type="button" data-dummy-scene="'+s.id+'"><b>'+(i+1)+'</b><span><strong>'+e(s.title)+'</strong><small>'+e(s.guide)+'</small></span></button></li>').join('')+'</ul><h3>Lo que conservamos</h3><p>Una barra izquierda; seis mini dashboards; fuentes, unidades y fechas; consulta separada de versión defendida; borrador y expediente conservados; ninguna escritura implícita.</p>'+button('method','Ver método y criterios')+button('formula','Ver fórmulas y supuestos')+'<p>'+d.visited.length+' de '+SCENES.length+' escenas exploradas. Esto mide el recorrido, no el avance del negocio.</p>';}
function methodHTML(){return '<p>La fórmula de trabajo reúne los hallazgos del diseño: <strong>objetivo → fuente → plan → comprobación → decisión → continuidad</strong>.</p>'+METHOD.map(x=>'<section class="dummy-task"><h3>'+e(x.title)+'</h3><p>'+e(x.text)+'</p></section>').join('')+'<h3>Capas de carga propuestas</h3><p>Estado ligero del puesto primero; snapshot por expediente con fecha/revisión; refresco autorizado en segundo plano; documentos pesados sólo al abrirlos. Una respuesta tardía de otro caso no debe reemplazar el actual.</p><p>Esta página está precargada con fixtures locales. No demuestra velocidad de Google Sheets, disponibilidad del servidor ni autonomía 24/7.</p>';}
function renderResource(key){
 if(key==='work')return workHTML();if(key==='presentation')return presentationHTML();if(key==='history')return historyHTML();if(key==='formula')return formulaHTML();if(key==='method')return methodHTML();if(key==='overview')return overviewHTML();
 if(key==='notes')return '<h3>Acuerdos del ejemplo</h3><p>Conservar la defendida V2. Consultar V3 para contrastar, sin cambiar la decisión.</p><p>La superficie sólo se corrige con petición explícita y la ficha de ese expediente.</p><p>La normativa ficticia organiza dudas; nunca autoriza construcción.</p>'+historyHTML();
 return undefined;
}
function renderSource(source){
 if(!source)return undefined;
 if(source.id===sid('deed'))return '<div class="source-warning">Documento ficticio. No es una escritura real.</div><p class="source-quick-meta">Página 2 · '+e(source.date)+' · '+e(source.revision)+'</p><h3>Texto original del ejemplo</h3><blockquote class="source-passage">Documento FICTICIO de '+e(work.current.model.name)+': superficie declarada <mark>644 m²</mark>.</blockquote><h3>Interpretación del autón</h3><p>El borrador muestra '+current().surface_m2+' m². '+(current().correction?'La corrección tiene recibo local.':'Hay una discrepancia que requiere tu petición para corregirse.')+'</p>'+(current().correction?'<div class="dummy-receipt">Antes: 500 m² · después: 644 m²<br>Recibo: '+e(current().correction.id)+'<br>Alcance: memoria del dummy; no Sheets.</div>':(work.current.state.draft.trim()?button('apply-correction','Aplicar propuesta local sin borrar mi borrador',true):button('prepare-correction','Preparar «corrige la superficie a 644 m²»',true)));
 if(source.id===sid('local-change'))return '<div class="source-warning">Recibo ficticio en memoria; no una escritura de negocio.</div><div class="dummy-summary"><div><span>Antes · terreno</span><strong>500 m²</strong></div><div><span>Después · terreno</span><strong>644 m²</strong></div></div><p>'+e(current().correction?.id||'Sin recibo')+'</p>'+work.sourceLink(sid('deed'),'Abrir documento de respaldo','p. 2')+'<p>El libro real sólo mostraría un cambio después del acuse y la relectura autorizada.</p>';
 return undefined;
}
function paintToolbar(){
 const d=current(),i=SCENES.findIndex(s=>s.id===d.scene);$('dummy-scene').value=d.scene;$('dummy-guide').textContent=SCENES[i].guide;$('dummy-prev').disabled=i===0;$('dummy-next').disabled=i===SCENES.length-1;
}
function scene(id,focus=false){
 if(!visitScene(current(),id))return;
 if(id==='conversation'){work.showConversation();}
 else if(id==='correction'){work.openSource(sid('deed'));}
 else if(id==='norm'){work.openSource(sid('norm'));}
 else if(id==='market'){work.openSource(sid('market-study'));}
 else if(id==='compare'){work.openDetail('formula');}
 else work.openDetail(id);
 const u=new URL(location.href);u.searchParams.set('scene',id);u.searchParams.set('case',work.current.model.id);history.replaceState(null,'',u);paintToolbar();if(focus)$('source-title').focus({preventScroll:true});
}
function prepare(text,sourceKey=null){
 const {model,state}=work.current;state.draft=$('message-input').value;
 const hadDraft=Boolean(state.draft.trim()),hadRef=Boolean(state.draft_ref);
 if(hadDraft)state.draft+='\n\nPropuesta del ejemplo:\n'+text;else state.draft=text;
 if(sourceKey&&hadRef&&state.draft_ref.source_id!==sid(sourceKey)){const source=model.sources.find(x=>x.id===sid(sourceKey));state.draft+='\nFuente de la propuesta: '+(source?.title||'Fuente de ejemplo')+' · '+(source?.location||'referencia')+'.';}
 if(!hadRef&&sourceKey)state.draft_ref={case_id:model.id,source_id:sid(sourceKey),scenario_id:state.scenario_id};
 work.refresh();state.mobile_view='chat';work.showConversation();$('message-input').focus({preventScroll:true});
}
function reply(value,ref){
 const {model,state}=work.current,d=current(),explicit=isCorrectionRequest(value);
 if(explicit){
  const result=correctSurface(d,644,sid('deed'));
  if(result.ok){patchSources();
   localAgent(result.repeated?'La corrección local ya tiene el mismo recibo: no la repito. Sigue en 644 m².':'Corregí el dato del dummy: 500 → 644 m², según la ficha ficticia. Aquí está el antes/después. No se escribió en Sheets.','local-change');}
  else localAgent(result.reason);
  }else if(/superficie/i.test(value)){localAgent('No apliqué una corrección. Este dummy admite sólo la petición exacta mostrada al abrir la ficha; si incluye una condición, negación o un valor diferente conserva el dato. Podemos revisar la propuesta con su fuente.','deed');}
 else if(/(encargo|investiga|investigar|altura)/i.test(value)){localAgent('Preparé el encargo de ejemplo: validar altura, uso y ocupación. Fuente requerida: reglamento oficial vigente. Entrega: artículos, restricciones por versión y su efecto. Queda como borrador; no se ejecuta desde esta maqueta.','norm-list');d.events.push({kind:'local_receipt',id:model.id+':draft-'+d.events.length,station:'Puesto',stage:'draft'});}
 else if(/(tir|v3|escenario|viabilidad)/i.test(value))localAgent('V3 muestra 20% de TIR anual ficticia, pero la altura sigue pendiente. V2 permanece defendida. Las fórmulas usan flujo anual comparable y la recomendación conserva las restricciones.','model');
 else if(/(documento|fuente|norma)/i.test(value))localAgent('Podemos abrir el pasaje y su revisión, distinguirlo de la interpretación y comentar ese mismo dato. La colección normativa es ficticia; una decisión real exige fuente oficial vigente.','norm-list');
 else localAgent('En este dummy puedo mostrar la fuente, comparar versiones o preparar un encargo con criterio de cierre. Las respuestas son guion local, sin modelo de IA conectado.',ref?.source_id?ref.source_id.split(':').slice(1).join(':'):null);
 patchSources();
}
work.setExtensions({
 card(key){if(key!=='terreno')return undefined;const d=current();return '<button type="button" class="map-button" data-source="'+sid('plot')+'" aria-label="Abrir mapa y superficie de ejemplo">'+work.mapSVG()+'</button><div class="dummy-stat"><strong>'+d.surface_m2+' m²</strong><span>Terreno · '+(d.correction?'corregido local':'borrador')+'</span></div>'+work.sourceLink(sid('deed'),d.correction?'Ver fuente y recibo':'Contrastar con ficha','644 m²');},
 resource:renderResource,source:renderSource,reply
});
document.addEventListener('preview:scenario',()=>work.refresh({cards:false,messages:false}));
document.addEventListener('preview:project',()=>{patchSources();paintToolbar();work.refresh();scene(current().scene);});
document.addEventListener('click',ev=>{
 const target=ev.target.closest('[data-dummy-scene]');if(target){scene(target.dataset.dummyScene,true);return;}
 const action=ev.target.closest('[data-dummy-action]')?.dataset.dummyAction;if(!action)return;
 if(action==='prepare-correction')prepare(CORRECTION_REQUEST,'deed');
 else if(action==='apply-correction'){const {model,state}=work.current;state.draft=$('message-input').value;state.messages.push({id:model.id+':dummy-command-'+state.messages.length,who:'user',text:CORRECTION_REQUEST,source_id:sid('deed'),scenario_id:state.scenario_id});reply(CORRECTION_REQUEST,{source_id:sid('deed')});work.refresh();$('source-title').focus({preventScroll:true});}
 else if(action==='advance-work'){advanceLocalWork(current());updateNext();work.refresh();($('source-body').querySelector('[data-dummy-action="advance-work"],[data-dummy-action="presentation"],[data-dummy-action="correction"]')||$('source-title')).focus({preventScroll:true});}
 else if(action==='slide-1'||action==='slide-2'){current().presentation_page=Number(action.at(-1));work.refresh();$('source-body').querySelector('.slide-controls button')?.focus({preventScroll:true});}
 else if(action==='ask-presentation')prepare('¿Por qué V3 tiene mayor TIR y no es todavía defendible?','model');
 else if(action==='next-goal')prepare('Prepara un encargo para investigar altura, uso y ocupación con fuentes vigentes.','norm-list');
 else if(action==='formula'||action==='method')work.openDetail(action);
 else scene(action,true);
});
$('dummy-scene').innerHTML=SCENES.map((s,i)=>'<option value="'+s.id+'">'+(i+1)+'/'+SCENES.length+' · '+e(s.title)+'</option>').join('');
$('dummy-scene').onchange=ev=>scene(ev.target.value,true);
$('dummy-prev').onclick=()=>scene(SCENES[Math.max(0,SCENES.findIndex(s=>s.id===current().scene)-1)].id);
$('dummy-next').onclick=()=>scene(SCENES[Math.min(SCENES.length-1,SCENES.findIndex(s=>s.id===current().scene)+1)].id);
$('dummy-overview').onclick=()=>work.openDetail('overview');
const params=new URLSearchParams(location.search),caseId=params.get('case');if(caseId&&Array.from($('case-select').options).some(x=>x.value===caseId)){$('case-select').value=caseId;$('case-select').dispatchEvent(new Event('change'));}
patchSources();paintToolbar();work.refresh();scene(params.get('scene')||'conversation');

function syncRoute(){document.querySelector('.dummy-toolbar').hidden=$('workspace').hidden;}
window.addEventListener('hashchange',syncRoute);syncRoute();
