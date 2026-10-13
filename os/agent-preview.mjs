import {CASES,createDemoCase,sourceFor,scenarioFor,irrLabel,viabilityFor,createProjectState,consultScenario,citeSource,CONNECTION_INVENTORY} from './agent-preview.data.mjs?v=3';
import {updateTurn} from './agent-preview.conversation.mjs?v=1';
import {boardMetrics} from './agent-board.metrics.mjs?v=1';
const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const previewExtensions={};
const shell=document.querySelector('.app-shell'),projects=new Map();
let model=createDemoCase(CASES[0].id),state=createProjectState(model),lastSourceTrigger=null;
projects.set(model.id,state);
const mobileQuery=window.matchMedia('(max-width:900px)'),sidebar=document.querySelector('.sidebar'),main=document.querySelector('.main');let drawerReturnFocus=null;
function drawerFocusable(){return Array.from(sidebar.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')).filter(e=>e.getClientRects().length);}
function menu(open){
 const wasOpen=shell.classList.contains('nav-open'),active=mobileQuery.matches&&open;
 if(active&&!wasOpen)drawerReturnFocus=document.activeElement;
 shell.classList.toggle('nav-open',active);$('menu-toggle').setAttribute('aria-expanded',String(active));sidebar.inert=mobileQuery.matches&&!active;main.inert=active;
 if(sidebar.inert)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');
 if(active&&!wasOpen)drawerFocusable()[0]?.focus({preventScroll:true});
 else if(wasOpen&&!active){const restore=drawerReturnFocus?.isConnected&&drawerReturnFocus.getClientRects().length?drawerReturnFocus:$('menu-toggle');restore.focus({preventScroll:true});drawerReturnFocus=null;}
}
mobileQuery.addEventListener('change',()=>{menu(false);paintMobile();});
document.addEventListener('keydown',e=>{
 if(e.key!=='Tab'||!shell.classList.contains('nav-open'))return;
 const list=drawerFocusable(),first=list[0],last=list.at(-1);if(!first)return;
 if(e.shiftKey&&(document.activeElement===first||!sidebar.contains(document.activeElement))){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&(document.activeElement===last||!sidebar.contains(document.activeElement))){e.preventDefault();first.focus();}
},true);
$('menu-toggle').onclick=()=>menu(!shell.classList.contains('nav-open'));$('nav-scrim').onclick=()=>menu(false);
function sourceLink(id,label,extra=''){return '<button class="source-link" type="button" data-source="'+escape(id)+'"><span>'+escape(label)+'</span><span>'+escape(extra||'↗')+'</span></button>';}
const headings={terreno:'Terreno',documentos:'Documentos',normativa:'Normativa',mercado:'Mercado',escenarios:'Escenarios',viabilidad:'Viabilidad'};
const symbols={terreno:'⌖',documentos:'▤',normativa:'§',mercado:'↗',escenarios:'▱',viabilidad:'◎'};
function mapSVG(large=false){return '<svg class="mini-map'+(large?' map-large':'')+'" viewBox="0 0 300 100" role="img" aria-label="Mapa ilustrativo, sin ubicación real"><rect width="300" height="100" fill="#e9f0e3"/><path d="M-10 25H310M-10 79H310M57-10V110M212-10V110" stroke="#fffdf6" stroke-width="11"/><path d="M-10 25H310M-10 79H310M57-10V110M212-10V110" stroke="#cbd8c4" stroke-width="1"/><rect x="100" y="37" width="73" height="32" rx="3" fill="#b3c9a8" stroke="#547550" stroke-width="2"/><path d="M138 32c-10 0-15 7-15 13s15 20 15 20 15-14 15-20-5-13-15-13z" fill="#375c4c"/><circle cx="138" cy="44" r="4" fill="#f7f9f1"/><text x="9" y="95" fill="#426043" font-size="10">Ubicación ilustrativa</text></svg>';}
function metrics(){return boardMetrics(model,state,previewExtensions.interaction?.({model,state})||null);}
function statePill(text,kind='neutral'){return '<span class="signal '+kind+'"><span aria-hidden="true"></span>'+escape(text)+'</span>';}
function cardBody(key){
 const b=metrics(),s=k=>model.id+':'+k;
 if(key==='terreno')return '<div class="land-telemetry"><div><strong class="big-number">'+(b.surface??'—')+'<small> m²</small></strong><span class="metric-caption">Superficie del borrador</span></div><button type="button" class="map-button" data-source="'+s('plot')+'" aria-label="Abrir mapa ilustrativo">'+mapSVG()+'</button></div>'+statePill(b.surfaceDone?'Alineada en el ejemplo':'Diferencia por resolver',b.surfaceDone?'done':'attention')+'<button class="metric-footer" type="button" data-source="'+s('deed')+'"><span>Ficha: '+(b.source_surface??'sin dato')+' m²</span><span>Ver fuente ↗</span></button>';
 if(key==='documentos')return '<strong class="big-number">'+b.documents+'<small> referencias</small></strong><span class="metric-caption">Terreno · reglas · modelo</span><div class="document-stack" aria-hidden="true"><span>Ficha</span><span>Reglas</span><span>Modelo</span></div><button class="metric-footer" type="button" data-detail="documentos"><span>Lista y pasajes</span><span>Abrir ↗</span></button>';
 if(key==='normativa')return '<strong class="big-number">'+b.official+'<small> de '+b.norms+'</small></strong><span class="metric-caption">Materias con fuente oficial comprobada</span><div class="coverage-dots" aria-label="'+b.norms+' materias por comprobar">'+['Uso','Altura','Seguridad'].map(x=>'<span>'+x+'</span>').join('')+'</div>'+statePill('Fuentes de ejemplo · sin validez','attention')+'<button class="metric-footer" type="button" data-source="'+s('norm-list')+'"><span>Pasajes y restricciones</span><span>Revisar ↗</span></button>';
 if(key==='mercado')return '<div class="metric-topline"><strong class="big-number">'+b.market+'</strong><span class="metric-caption">registros · 12 oct<br>MXN ficticios</span></div><div class="market-telemetry">'+model.market.map(r=>'<button type="button" data-source="'+escape(r.source_id)+'"><span>'+escape(r.label)+'</span><b>'+escape(r.display)+'</b></button>').join('')+'</div>';
 if(key==='escenarios')return '<div class="scenario-telemetry">'+model.scenarios.map(sc=>'<button type="button" data-scenario="'+sc.id+'" aria-pressed="'+(sc.id===state.scenario_id)+'" aria-label="Consultar '+sc.label+' '+sc.name+'"><span>'+sc.label+'</span><svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="8" rx="4" class="bar-track"/><rect width="'+(Number.isFinite(sc.irr_percent)?Math.max(0,Math.min(100,sc.irr_percent*4)):0)+'" height="8" rx="4" class="bar-fill"/></svg><b>'+(Number.isFinite(sc.irr_percent)?sc.irr_percent+'%':'—')+'</b></button>').join('')+'</div><span class="metric-caption">TIR anual · proyecto · '+b.versions+' versiones</span><button class="metric-footer" type="button" data-detail="escenarios"><span>'+escape(b.defended?.label||'—')+' defendida · '+escape(b.selected?.label||'—')+' consultada</span><span>Comparar ↗</span></button>';
 if(key==='viabilidad')return '<div class="decision-status"><span class="version-token">'+escape(b.selected?.label||'—')+'</span><strong>'+(b.selected?.id==='v3'?'Condicionada':'Por validar')+'</strong></div><p class="decision-line">'+(b.selected?.id==='v3'?'La altura frena defender esta opción.':'La recomendación requiere datos y normas vigentes.')+'</p>'+statePill('Sin factibilidad real acreditada','attention')+'<button class="metric-footer" type="button" data-detail="viabilidad"><span>Condición y siguiente decisión</span><span>Ver ↗</span></button>';
 return '';
}
function paintMission(){
 const node=$('mission-control');if(!node)return;
 const b=metrics(),pending=b.next.id==='surface',delivered=b.done===b.total;if(pending&&b.surface===null)b.next={...b.next,title:'Comprobar el terreno'};
 const hints={surface:'El borrador y la ficha no coinciden. Resolvamos ese dato primero.',norm:'Localizar los pasajes es el primer paso. Su vigencia oficial sigue pendiente.',market:'Venta, renta y construcción: conservar unidad, fecha y fuente.',decision:'Comparar retorno y restricciones antes de recomendar.',presentation:'La entrega local está lista para revisar. No acredita viabilidad real.'};
 const labels={surface:b.surface===null?'Revisar documento':'Revisar diferencia',norm:'Abrir restricciones',market:'Abrir referencias',decision:'Comparar escenarios',presentation:'Ver presentación'};
 const action=delivered?'data-resource="presentation"':'data-source="'+escape(b.next.source_id)+'"';
 node.innerHTML='<div class="mission-lead"><div class="mission-copy"><span class="eyebrow">'+(delivered?'Entrega del ejemplo':'Siguiente movimiento')+'</span><h2>'+escape(b.next.title)+'</h2>'+(pending&&b.surface!==null?'<div class="surface-delta"><span>'+b.surface+'<small>m² · borrador</small></span><i aria-hidden="true">→</i><span>'+b.source_surface+'<small>m² · ficha</small></span></div>':'')+'<p>'+escape(pending&&b.surface===null?'Hace falta comprobar el documento y sus datos antes de comparar.':hints[b.next.id])+'</p><button type="button" class="mission-action" '+action+'>'+escape(labels[b.next.id])+' <span aria-hidden="true">↗</span></button></div><div class="mission-progress"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="33" class="ring-track"/><circle cx="40" cy="40" r="33" class="ring-fill" pathLength="100" stroke-dasharray="'+(b.done/b.total*100)+' 100"/></svg><strong>'+b.done+'<span>/'+b.total+'</span></strong><p>Resultados<br>del ejemplo</p></div></div><div class="result-route" aria-label="Ruta de resultados locales">'+b.results.map((r,i)=>'<button type="button" data-source="'+escape(r.source_id)+'" data-result="'+r.id+'" data-complete="'+r.done+'" '+(r.id===b.next.id?'aria-current="step"':'')+'><span class="route-token" aria-hidden="true">'+(r.done?'✓':i+1)+'</span><span>'+escape(r.name)+'<small>'+(r.done?'Recibo local':r.id===b.next.id?'Ahora':'Pendiente')+'</small></span></button>').join('')+'</div>';
 node.dataset.done=String(b.done);node.dataset.next=b.next.id;
}
function paintCards(){
 paintMission();
 const active=state.detail||sourceFor(model,state.source_id)?.card,priority={surface:'terreno',norm:'normativa',market:'mercado',decision:'escenarios'}[metrics().next.id];
 $('mini-dashboards').innerHTML=Object.keys(headings).map(key=>'<article class="mini-card '+(key==='viabilidad'?'viability-card':'')+'" data-card="'+key+'" data-priority="'+(priority===key)+'" data-active="'+(active===key)+'"><header class="mini-card-header"><h2 class="card-title"><button class="card-heading" type="button" data-detail="'+key+'" aria-expanded="'+(active===key)+'" aria-controls="context-viewer"><span class="card-symbol" aria-hidden="true">'+symbols[key]+'</span><span class="card-label">'+headings[key]+'</span></button></h2></header><div class="card-body">'+cardBody(key)+'</div></article>').join('');
 const selected=scenarioFor(model,state.scenario_id),defended=scenarioFor(model,model.defended_scenario_id);
 $('consulting-version').textContent=selected?.label||'—';$('defended-version').textContent=defended?.label||'—';$('different-version').hidden=state.scenario_id===model.defended_scenario_id;
 $('board-status').textContent='Ejemplo local · fuentes: '+model.updated_at+' · '+model.revision+' · libro sin modificar.';
}
function syncDraft(){state.draft=$('message-input').value;}
function paintDraft(){
 $('message-input').value=state.draft;const ref=state.draft_ref;
 $('draft-reference').hidden=!ref;
 if(ref){const s=sourceFor(model,ref.source_id),sc=scenarioFor(model,ref.scenario_id);$('draft-reference').innerHTML='<div class="reference-copy"><strong>'+escape(headings[s?.card]||'Fuente')+'</strong> · '+escape(sc?.label||'versión')+' · '+escape(s?.location||'fuente no disponible')+(ref.scenario_id!==state.scenario_id?'<br><strong>Tu comentario sigue referido a '+escape(sc?.label||'la versión original')+'.</strong>':'')+'</div><button type="button" id="remove-reference" aria-label="Quitar referencia del borrador">×</button>';}
}
function paintMessages(){
 const stream=$('chat-stream'),stick=stream.scrollHeight-stream.clientHeight-stream.scrollTop<40,saved=stream.scrollTop,valid=new Set(state.messages.map(m=>m.id));
 for(const node of Array.from(stream.children))if(!valid.has(node.id))node.remove();
 for(const m of state.messages){
  let entry=document.getElementById(m.id);
  if(!entry||entry.parentElement!==stream){entry=document.createElement('div');entry.id=m.id;entry.append(document.createElement('small'),document.createElement('p'));stream.appendChild(entry);}
  entry.className='message '+(m.who==='user'?'message-user':'message-agent');entry.dataset.caseId=model.id;entry.dataset.phase=m.phase||'final';entry.dataset.inputKind=m.input_kind||'text';
  entry.children[0].textContent=m.who==='user'?'Tú':model.name;entry.children[1].textContent=m.text;
  let phase=entry.querySelector('.message-phase');if(['partial','cancelled'].includes(m.phase)){if(!phase){phase=document.createElement('div');phase.className='message-phase';entry.appendChild(phase);}phase.textContent=m.phase==='cancelled'?'Interrumpido':m.input_kind==='voice'?'Transcribiendo…':'Escribiendo…';}else phase?.remove();
  let cite=entry.querySelector('.message-cite');if(m.source_id){const source=sourceFor(model,m.source_id);if(!cite){cite=document.createElement('button');cite.type='button';cite.className='message-cite';entry.appendChild(cite);}cite.textContent=(source?.title||'Fuente faltante')+' · '+(scenarioFor(model,m.scenario_id)?.label||'versión');cite.dataset.source=m.source_id;cite.dataset.message=m.id;}else cite?.remove();
 }
 stream.scrollTop=stick?stream.scrollHeight:saved;
}
function highlight(original,term){if(!term||!original.includes(term))return escape(original);return original.split(term).map(escape).join('<mark>'+escape(term)+'</mark>');}
function sourceHTML(source){
 const custom=previewExtensions.source?.(source,{model,state});if(typeof custom==='string')return custom;
 if(!source)return '<div class="source-warning" role="alert">Esta fuente no está disponible en el expediente actual.</div><section class="detail-block"><h3>Qué falta</h3><p>Un documento registrado y verificable para este dato. No se muestra contenido de otro proyecto.</p></section><button type="button" class="primary" data-prepare-missing>Preparar búsqueda de fuente</button>';
 const summary={terreno:'Ubicación y dato del terreno',documentos:'Identificación y respaldo',normativa:'Restricción que hay que comprobar',mercado:'Referencia de precio y alcance',escenarios:'Flujos y supuestos de la versión'}[source.card]||'Evidencia del proyecto';
 let text='<div class="source-warning">Fuente de ejemplo · sin validez normativa ni financiera.</div><div class="detail-hero"><span class="eyebrow">'+summary+'</span><strong>'+escape(source.location)+'</strong><p>'+escape(source.date)+' · '+escape(source.revision)+' · '+escape(model.name)+'</p></div>';
 if(source.card==='terreno')text+=mapSVG(true);
 text+='<section class="detail-block"><h3>Pasaje de la fuente</h3><blockquote class="source-passage">'+highlight(source.original,source.highlight)+'</blockquote></section><details class="source-analysis"><summary>Lectura del autón · interpretación</summary><p class="source-interpretation">'+escape(source.analysis)+'</p></details>';
 if(source.table)text+='<section class="detail-block"><h3>Datos del registro</h3><div class="source-table-wrap" tabindex="0" aria-label="Tabla de fuente"><table class="source-table"><thead><tr>'+source.table.headers.map(x=>'<th scope="col">'+escape(x)+'</th>').join('')+'</tr></thead><tbody>'+source.table.rows.map(row=>'<tr>'+row.map(x=>'<td>'+escape(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></section>';
 if(source.parent_id)text+=sourceLink(source.parent_id,'Abrir estudio que reúne esta referencia','↗');
 if(source.related?.length)text+='<section class="detail-block"><h3>Fuentes relacionadas</h3>'+source.related.map(id=>sourceLink(id,sourceFor(model,id)?.title||'Fuente faltante',sourceFor(model,id)?.location||'↗')).join('')+'</section>';
 text+='<details class="source-provenance"><summary>Ver procedencia y vigencia</summary><dl class="source-meta"><dt>Expediente</dt><dd>'+escape(model.name)+'</dd><dt>Revisión</dt><dd>'+escape(source.revision)+'</dd><dt>Emisor</dt><dd>'+escape(source.issuer||'Fuente de ejemplo')+'</dd><dt>Vigencia</dt><dd>'+escape(source.validity||'Por comprobar en el documento real')+'</dd><dt>Consultada</dt><dd>'+escape(scenarioFor(model,state.scenario_id)?.label)+'</dd><dt>Defendida</dt><dd>'+escape(scenarioFor(model,model.defended_scenario_id)?.label)+'</dd></dl></details>';
 return text;
}
function activateViewer(){
 $('work-popover').hidden=true;$('work-menu').setAttribute('aria-expanded','false');
 $('context-viewer').hidden=false;document.querySelector('.project-column').classList.add('has-detail');
 if(mobileQuery.matches)state.mobile_view='ppp';
 paintCards();paintMobile();paintDraft();$('source-title').focus({preventScroll:true});
 const body=$('source-body');void body.clientHeight;body.scrollTop=0;
}
function openSource(id,trigger=null,messageId=null){
 syncDraft();if(messageId){const cited=state.messages.find(m=>m.id===messageId);if(cited&&scenarioFor(model,cited.scenario_id)){consultScenario(model,state,cited.scenario_id);paintCards();}}state.source_id=id;state.detail=null;state.message_anchor=messageId||state.messages.find(m=>m.source_id===id)?.id||null;if(trigger)lastSourceTrigger=trigger;
 const src=sourceFor(model,id);$('source-title').textContent=src?.title||'Fuente no disponible';$('viewer-kind').textContent='Fuente de ejemplo · '+(headings[src?.card]||'referencia');$('source-body').innerHTML=sourceHTML(src);$('comment-source').hidden=false;$('comment-source').disabled=!src;$('back-message').hidden=!state.message_anchor;
 
 activateViewer();
}
function detailHTML(key){
 const selected=scenarioFor(model,state.scenario_id),v=viabilityFor(model,state.scenario_id);
 if(key==='terreno')return '<div class="detail-hero"><span class="eyebrow">Terreno</span><strong>Dato y ubicación, antes de calcular</strong><p>La superficie debe coincidir con el documento del expediente.</p></div>'+mapSVG(true)+'<section class="detail-block"><h3>Qué revisar</h3><p>Superficie, identificación y colindancias. El mapa es ilustrativo; no acredita un predio real.</p>'+sourceLink(model.id+':deed','Contrastar el dato con su documento','p. 2')+sourceLink(model.id+':plot','Abrir ficha y ubicación','↗')+'</section>';
 if(key==='documentos')return '<div class="detail-hero"><span class="eyebrow">Documentos del expediente</span><strong>'+model.documents.length+' referencias</strong><p>Cada documento abre su contenido y ubicación, conservando la conversación.</p></div><section class="detail-block"><h3>Documentos usados en el PPP</h3>'+model.documents.map(id=>sourceLink(id,sourceFor(model,id)?.title||'Fuente faltante',sourceFor(model,id)?.location)).join('')+'</section>';
 if(key==='normativa')return '<div class="detail-hero"><span class="eyebrow">Normativa</span><strong>Restricciones por comprobar</strong><p>Organizar una colección no significa que el proyecto cumpla la regulación.</p></div><section class="detail-block"><h3>Uso, altura y seguridad</h3>'+sourceLink(model.id+':norm-urban','Uso y ocupación','art. 2')+sourceLink(model.id+':norm','Altura y construcción','art. 4')+sourceLink(model.id+':norm-civil','Seguridad y evacuación','art. 6')+'</section><div class="detail-next"><strong>Siguiente con esta evidencia</strong><p>Abrir el artículo, verificar su vigencia y marcar qué restricción condiciona cada escenario.</p></div>';
 if(key==='mercado')return '<div class="detail-hero"><span class="eyebrow">Mercado de ejemplo</span><strong>Precio, unidad y alcance</strong><p>Un anuncio aislado no confirma el precio de cierre.</p></div><section class="detail-block"><h3>Registros de comparación</h3>'+model.market.map(r=>sourceLink(r.source_id,r.label,r.display)).join('')+'</section>'+sourceLink(model.id+':market-study','Abrir estudio y referencias','3 registros');
 if(key==='escenarios')return '<div class="source-warning">Comparación de ejemplo · TIR anual del proyecto · mismo horizonte.</div><div class="comparison-grid">'+model.scenarios.map(sc=>'<section class="comparison-option" data-selected="'+(sc.id===state.scenario_id)+'"><span class="eyebrow">'+escape(sc.label)+' · '+(sc.id===model.defended_scenario_id?'defendida':'consulta')+'</span><h3>'+escape(sc.name)+'</h3><strong>'+escape(irrLabel(model,sc))+'</strong><p>'+escape(sc.viability.constraint)+'</p><button class="quiet" type="button" data-scenario="'+sc.id+'">Consultar '+sc.label+'</button></section>').join('')+'</div>'+sourceLink(selected.source_id,'Abrir flujo y supuestos de '+selected.label,'↗');
 if(key==='viabilidad')return '<div class="detail-hero"><span class="eyebrow">'+escape(v.version)+' · viabilidad</span><strong>'+escape(v.status)+'</strong><p>'+escape(irrLabel(model,selected))+' · revisión '+escape(selected.revision)+'</p></div><section class="detail-block"><h3>Por qué</h3><p>'+escape(v.summary)+'</p></section><div class="detail-split"><section class="detail-block"><h3>Qué condiciona la decisión</h3><p>'+escape(v.constraint)+'</p></section><section class="detail-block"><h3>Riesgo que conservar</h3><p>'+escape(v.risk)+'</p></section></div><div class="detail-next"><strong>Siguiente antes de defender</strong><p>Resolver la restricción con fuente y contrastarla con el flujo de la misma versión.</p>'+sourceLink(v.source_id,'Abrir evidencia y supuestos','↗')+'</div>';
 return '';
}
function resourceHTML(key){
 const custom=previewExtensions.resource?.(key,{model,state});if(typeof custom==='string')return custom;
 if(key==='connections')return '<div class="source-warning">Inventario leído en código; esta maqueta no establece ninguna conexión operativa.</div><ul class="resource-list">'+CONNECTION_INVENTORY.map(c=>'<li><strong>'+escape(c.name)+'</strong><p>'+escape(c.state)+'</p><p>'+escape(c.detail)+'</p></li>').join('')+'</ul>';
 if(key==='work')return '<ul class="resource-list"><li><strong>Ahora · verificar el terreno</strong><p>Fuente necesaria: documento registrado del expediente.</p></li><li><strong>Después · contrastar normativa y mercado</strong><p>Conservar artículos, registros, fechas y cobertura.</p></li><li><strong>Resultado · versión defendible</strong><p>Presentar fuentes, restricciones y razón de la recomendación.</p></li></ul>';
 if(key==='notes')return '<p>Nota de ejemplo: distinguir hechos, supuestos y decisión. La selección visual no autoriza modificar un dato.</p>';
 if(key==='history')return '<p>Historial de ejemplo: no hay cambios de negocio realizados. Toda entrega real deberá mostrar fecha, fuente, antes/después y recibo confirmado.</p>';
 if(key==='presentation')return '<h3>1 · Resultado y evidencia</h3><p>Una lámina con versión, fuentes y restricciones.</p><h3>2 · Decisión que sigue</h3><p>Otra lámina con incertidumbre y acción necesaria. La conversación sigue disponible durante la revisión.</p>';
 return'';
}
function openDetail(key,trigger=null){
 syncDraft();if(trigger)lastSourceTrigger=trigger;state.detail=key;state.source_id=null;state.message_anchor=null;
 const resourceNames={overview:'Conjunto de la interacción',formula:'Fórmulas y supuestos',method:'Método y decisiones',connections:'Conexiones encontradas',work:'Trabajo y próximos pasos',notes:'Notas y acuerdos',history:'Historial y evidencia',presentation:'Presentación'};
 $('source-title').textContent=resourceNames[key]||headings[key]||'Detalle';$('viewer-kind').textContent='Contexto del mismo proyecto';$('source-body').innerHTML=resourceNames[key]?resourceHTML(key):detailHTML(key);$('comment-source').hidden=true;$('back-message').hidden=true;
 activateViewer();
}
function closeSource(){
 syncDraft();const key=state.detail||sourceFor(model,state.source_id)?.card||'documentos',trigger=lastSourceTrigger;state.source_id=null;state.detail=null;
 $('context-viewer').hidden=true;document.querySelector('.project-column').classList.remove('has-detail');paintCards();paintMobile();lastSourceTrigger=null;
 if(trigger?.isConnected&&!trigger.closest('[inert]'))trigger.focus({preventScroll:true});else{const target=document.querySelector('[data-detail="'+key+'"]')||$('work-menu');target?.focus({preventScroll:true});}
}
function paintMobile(){
 const view=state.mobile_view||'ppp',grid=$('workspace-grid')||document.querySelector('.workspace-grid'),project=document.querySelector('.project-column'),chat=document.querySelector('.dialogue-column');
 grid.dataset.mobileView=view;$('mobile-ppp').setAttribute('aria-pressed',String(view==='ppp'));$('mobile-chat').setAttribute('aria-pressed',String(view==='chat'));
 $('mobile-context-summary').hidden=!mobileQuery.matches;$('mobile-context-summary').textContent='Consultando '+(scenarioFor(model,state.scenario_id)?.label||'—')+' · Defendida '+(scenarioFor(model,model.defended_scenario_id)?.label||'—');
 if(mobileQuery.matches){project.inert=view==='chat';chat.inert=view!=='chat';grid.scrollLeft=view==='chat'?grid.clientWidth:0;}else{project.inert=false;chat.inert=false;grid.scrollLeft=0;}
}
function chooseScenario(id){
 syncDraft();consultScenario(model,state,id);paintCards();const focused=document.querySelector('[data-scenario="'+id+'"]');if(focused)focused.focus({preventScroll:true});if(state.source_id)$('source-body').innerHTML=sourceHTML(sourceFor(model,state.source_id));if(['escenarios','viabilidad'].includes(state.detail))$('source-body').innerHTML=detailHTML(state.detail);paintDraft();paintMobile();document.dispatchEvent(new CustomEvent('preview:scenario'));
}
function renderProject(){
 $('case-select').value=model.id;$('conversation-name').textContent=model.name;$('chat-avatar').textContent=model.name.slice(0,1);$('agent-badge').textContent=model.name.slice(0,1);$('case-kind').textContent='Plan de potencial · '+model.kind.toLowerCase();$('project-goal').textContent=model.goal;$('project-goal').title=model.goal;$('project-next').textContent='Siguiente: '+model.next;$('project-next').title='Siguiente: '+model.next;paintCards();paintMessages();paintDraft();$('context-viewer').hidden=true;document.querySelector('.project-column').classList.remove('has-detail');
 if(state.source_id)openSource(state.source_id);else if(state.detail)openDetail(state.detail);paintMobile();document.dispatchEvent(new CustomEvent('preview:project'));
}
$('case-select').onchange=e=>{stopDemoVoice();syncDraft();model=createDemoCase(e.target.value);state=projects.get(model.id)||createProjectState(model);projects.set(model.id,state);lastSourceTrigger=null;$('context-viewer').hidden=true;renderProject();$('voice-status').textContent='Voz de ejemplo · proyecto '+model.name+'. Micrófono sin activar.';};
$('message-input').oninput=()=>syncDraft();
document.addEventListener('click',e=>{
 const source=e.target.closest('[data-source]');if(source){openSource(source.dataset.source,source,source.dataset.message);return;}
 const scenario=e.target.closest('[data-scenario]');if(scenario){chooseScenario(scenario.dataset.scenario);return;}
 const detail=e.target.closest('[data-detail]');if(detail){openDetail(detail.dataset.detail,detail);return;}
 const resource=e.target.closest('[data-resource]');if(resource){$('work-popover').hidden=true;$('work-menu').setAttribute('aria-expanded','false');openDetail(resource.dataset.resource,$('work-menu'));return;}
 if(e.target.closest('[data-prepare-missing]')){syncDraft();state.draft+=(state.draft?'\n':'')+'Quiero localizar y comprobar la fuente de este dato en el expediente actual.';paintDraft();$('message-input').focus({preventScroll:true});return;}
 if(e.target.closest('#remove-reference')){state.draft_ref=null;paintDraft();return;}
});
$('close-source').onclick=closeSource;
$('comment-source').onclick=()=>{syncDraft();if(!sourceFor(model,state.source_id))return;citeSource(model,state,state.source_id);paintDraft();state.mobile_view='chat';paintMobile();$('message-input').focus({preventScroll:true});};
$('back-message').onclick=()=>{const anchor=state.message_anchor;state.mobile_view='chat';paintMobile();const message=anchor?document.getElementById(anchor):null;if(message){message.setAttribute('tabindex','-1');const stream=$('chat-stream');stream.scrollTop+=message.getBoundingClientRect().top-stream.getBoundingClientRect().top;message.focus({preventScroll:true});}};
$('work-menu').onclick=()=>{const open=$('work-popover').hidden;$('work-popover').hidden=!open;$('work-menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const hadMenu=shell.classList.contains('nav-open')||!$('work-popover').hidden;menu(false);if(!hadMenu&&!$('context-viewer').hidden&&e.target!==$('message-input'))closeSource();const open=!$('work-popover').hidden;$('work-popover').hidden=true;$('work-menu').setAttribute('aria-expanded','false');if(open)$('work-menu').focus({preventScroll:true});}});
$('mobile-ppp').onclick=()=>{syncDraft();state.mobile_view='ppp';paintMobile();};$('mobile-chat').onclick=()=>{syncDraft();state.mobile_view='chat';paintMobile();};
let voiceGeneration=0,voiceActive=false;
function stopDemoVoice(){
 voiceGeneration++;voiceActive=false;$('stop-button').hidden=true;$('channel-state').textContent='Demo';$('voice-status').textContent='Demostración detenida. El hilo y borrador permanecen.';
 const pending=state.messages.filter(m=>m.phase==='partial'&&m.input_kind==='voice');for(const m of pending)updateTurn(state,{...m,case_id:model.id,seq:(m.seq||0)+1,phase:'cancelled'});paintMessages();
}
function playDemoVoice(){
 if(voiceActive){stopDemoVoice();return;}
 const token=++voiceGeneration,caseId=model.id,turnId=caseId+':speech-'+Date.now();voiceActive=true;$('stop-button').hidden=false;$('channel-state').textContent='Transcribiendo';$('voice-status').textContent='Voz de ejemplo · sin micrófono ni audio conectado.';
 const emit=(id,who,seq,phase,text)=>{if(token!==voiceGeneration||caseId!==model.id)return false;const result=updateTurn(state,{id,case_id:caseId,who,seq,phase,text,input_kind:'voice',scenario_id:state.scenario_id});if(result)paintMessages();return result;};
 emit(turnId,'user',1,'partial','Comparemos V2');
 setTimeout(()=>emit(turnId,'user',2,'partial','Comparemos V2 y V3 con sus'),230);
 setTimeout(()=>{if(!emit(turnId,'user',3,'final','Comparemos V2 y V3 con sus restricciones.'))return;
  const prior=new Set(state.messages.map(m=>m.id));previewExtensions.reply?.('Comparemos V2 y V3 con sus restricciones.',null,{model,state});
  let response=state.messages.find(m=>!prior.has(m.id)&&m.who==='agent');if(!response){response={id:caseId+':speech-answer-'+Date.now(),who:'agent',text:'V3 tiene mayor TIR de ejemplo, pero mantiene una restricción normativa. La consulta no cambia la defendida V2.',scenario_id:state.scenario_id};state.messages.push(response);}
  const full=response.text;emit(response.id,'agent',1,'partial',full.slice(0,Math.max(12,Math.floor(full.length*.45))));$('channel-state').textContent='Respondiendo';
  setTimeout(()=>{if(emit(response.id,'agent',2,'final',full)){voiceActive=false;$('stop-button').hidden=true;$('channel-state').textContent='Demo';$('voice-status').textContent='Un turno, un mensaje · ejemplo local.';}},320);
 },550);
}
$('mic-button').onclick=playDemoVoice;$('stop-button').onclick=stopDemoVoice;$('stop-button').hidden=true;
$('message-form').onsubmit=e=>{
 e.preventDefault();if(voiceActive)stopDemoVoice();syncDraft();const value=state.draft.trim();if(!value)return;
 const ref=state.draft_ref;
 updateTurn(state,{id:model.id+':message-'+state.messages.length,case_id:model.id,who:'user',seq:0,phase:'final',input_kind:'text',text:value,scenario_id:ref?.scenario_id||state.scenario_id,...(ref?{source_id:ref.source_id}:{})});
 previewExtensions.reply?.(value,ref,{model,state});
 state.draft='';state.draft_ref=null;paintCards();paintMessages();paintDraft();$('chat-stream').scrollTop=$('chat-stream').scrollHeight;$('voice-status').textContent='Mensaje local en la maqueta. No enviado a un agente ni a Sheets.';
};
const nav=$('preview-nav'),home=$('home-grid'),catalogue=window.YodCatalogo.filter(x=>!x.sinMarco&&!x.navParent);
for(const c of catalogue){const a=document.createElement('a');a.className='nav-item';a.dataset.systemId=c.id;a.href='#'+c.id;a.innerHTML='<i class="ti ti-'+escape(c.icono)+'">◇</i><span>'+escape(c.nombre)+'</span>';nav.appendChild(a);const button=document.createElement('button');button.type='button';button.className='home-tile';button.textContent=c.nombre;button.onclick=()=>{location.hash=c.id;};home.appendChild(button);}
const people=document.createElement('a');people.className='nav-item';people.dataset.systemId='personas';people.href='#personas';people.innerHTML='<i class="ti ti-users">◇</i><span>Personas y accesos</span>';nav.appendChild(people);
function route(){const key=location.hash.slice(1)||'SYS-DESPACHO',board=catalogue.find(x=>x.id===key),workspace=key==='SYS-DESPACHO';$('workspace').hidden=!workspace;$('home-view').hidden=workspace;$('route-title').textContent=workspace?'El Despacho':board?.nombre||(key==='personas'?'Personas y accesos':'Inicio');$('home-title').textContent=board?.nombre||(key==='personas'?'Personas y accesos':'Tu espacio de trabajo');document.querySelectorAll('#preview-nav .nav-item').forEach(a=>a.classList.toggle('active',a.dataset.systemId===key));menu(false);}
renderProject();route();window.addEventListener('hashchange',route);

export const demoWorkspace={
 get current(){return {model,state};},
 setExtensions(extensions){Object.assign(previewExtensions,extensions);},
 refresh({cards=true,messages=true}={}){if(cards)paintCards();if(messages)paintMessages();paintDraft();if(state.source_id)$('source-body').innerHTML=sourceHTML(sourceFor(model,state.source_id));else if(state.detail)$('source-body').innerHTML=resourceHTML(state.detail)||detailHTML(state.detail);paintMobile();},
 openSource,openDetail,closeSource,chooseScenario,mapSVG,sourceLink,escape,
 showConversation(){state.mobile_view='chat';paintMobile();$('message-input').focus({preventScroll:true});}
};

const paneGrid=$('workspace-grid');paneGrid.addEventListener('scroll',()=>{if(!mobileQuery.matches||!paneGrid.clientWidth)return;const view=paneGrid.scrollLeft>paneGrid.clientWidth*.5?'chat':'ppp';if(view!==state.mobile_view){state.mobile_view=view;paintMobile();}},{passive:true});
