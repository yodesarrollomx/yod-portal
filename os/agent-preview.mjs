import {CASES,createDemoCase,sourceFor,scenarioFor,irrLabel,viabilityFor,createProjectState,consultScenario,citeSource,CONNECTION_INVENTORY} from './agent-preview.data.mjs?v=2';
const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
function cardBody(key){
 const s=k=>model.id+':'+k,selected=scenarioFor(model,state.scenario_id),v=viabilityFor(model,state.scenario_id);
 if(key==='terreno')return '<button type="button" class="map-button" data-source="'+s('plot')+'" aria-label="Abrir mapa y ficha de Terreno">'+mapSVG()+'</button><p class="card-meta">Ficha + ubicación · <strong>ilustrativa</strong></p>';
 if(key==='documentos')return sourceLink(s('deed'),'Ficha del terreno','p. 2')+sourceLink(s('norm'),'Reglas del proyecto','art. 4')+sourceLink(s('model'),'Modelo · Escenarios','B3:F5');
 if(key==='normativa')return '<p class="norm-mini">Por comprobar: <mark>altura, uso y ocupación</mark>.</p>'+sourceLink(s('norm'),'Reglas · art. 4','p. 2')+sourceLink(s('norm-list'),'Colección y fuentes','3 temas');
 if(key==='mercado')return model.market.map(r=>'<button type="button" class="source-link market-link" data-source="'+escape(r.source_id)+'"><span>'+escape(r.label)+'</span><strong class="market-value">'+escape(r.display)+'</strong></button>').join('')+'<p class="card-meta">MXN ficticios · 12 oct · '+sourceLink(s('market-study'),'Ver estudio y referencias','↗')+'</p>';
 if(key==='escenarios')return model.scenarios.map(sc=>'<button type="button" class="scenario-row" data-scenario="'+sc.id+'" aria-pressed="'+(sc.id===state.scenario_id)+'" aria-label="Consultar '+sc.label+' '+sc.name+'"><b>'+sc.label+'</b><span>'+sc.name+'<small>'+((sc.id===model.defended_scenario_id)?'Defendida en ejemplo':'Consulta de versión')+'</small></span><strong>'+((irrLabel(model,sc)==='TIR no calculada')?'—':sc.irr_percent+'%')+'</strong></button>').join('')+'<p class="card-meta">TIR anual del proyecto · mismo periodo · '+model.revision+'</p>';
 if(key==='viabilidad')return '<div class="viability-title"><span class="viability-version">'+v.version+'</span><span class="viability-status'+(selected?.id==='v3'?' warning-state':'')+'">'+escape(v.status)+'</span></div><p><strong>'+escape(v.summary)+'</strong></p><p>'+escape(v.constraint)+'</p>'+sourceLink(v.source_id||s('model'),'Modelo, flujo y supuestos','↗');
 return'';
}
function paintCards(){
 $('mini-dashboards').innerHTML=Object.keys(headings).map(key=>'<article class="mini-card '+(key==='viabilidad'?'viability-card':'')+'" data-card="'+key+'"><header class="mini-card-header"><h2><span class="card-symbol" aria-hidden="true">'+symbols[key]+'</span>'+headings[key]+'</h2><button class="card-detail" type="button" data-detail="'+key+'" aria-label="Abrir detalle de '+headings[key]+'">↗</button></header>'+cardBody(key)+'</article>').join('');
 const selected=scenarioFor(model,state.scenario_id),defended=scenarioFor(model,model.defended_scenario_id);
 $('consulting-version').textContent=selected?.label||'—';$('defended-version').textContent=defended?.label||'—';$('different-version').hidden=state.scenario_id===model.defended_scenario_id;
 $('board-status').textContent='Sólo consulta de '+(selected?.label||'versión')+'. No modifica la defendida ni el libro.';
}
function syncDraft(){state.draft=$('message-input').value;}
function paintDraft(){
 $('message-input').value=state.draft;const ref=state.draft_ref;
 $('draft-reference').hidden=!ref;
 if(ref){const s=sourceFor(model,ref.source_id),sc=scenarioFor(model,ref.scenario_id);$('draft-reference').innerHTML='<button type="button" id="remove-reference" aria-label="Quitar referencia del borrador">×</button><strong>Comentando '+escape(headings[s?.card]||'fuente')+'</strong> · '+escape(sc?.label||'versión')+' · '+escape(s?.location||'fuente no disponible')+(ref.scenario_id!==state.scenario_id?'<br><strong>Tu comentario sigue referido a '+escape(sc?.label||'la versión original')+'.</strong>':'');}
}
function paintMessages(){
 const stream=$('chat-stream');stream.replaceChildren();
 for(const m of state.messages){const entry=document.createElement('div');entry.className='message'+(m.who==='user'?' message-user':'');entry.id=m.id;entry.dataset.caseId=model.id;const label=document.createElement('small');label.textContent=m.who==='user'?'Tú · mensaje local':'Autón · ejemplo';const p=document.createElement('p');p.textContent=m.text;entry.append(label,p);
  if(m.source_id){const source=sourceFor(model,m.source_id),b=document.createElement('button');b.type='button';b.className='message-cite';b.textContent=(source?.title||'Fuente faltante')+' · '+(scenarioFor(model,m.scenario_id)?.label||'versión');b.dataset.source=m.source_id;b.dataset.message=m.id;entry.appendChild(b);}
  stream.appendChild(entry);
 }
}
function highlight(original,term){if(!term||!original.includes(term))return escape(original);return original.split(term).map(escape).join('<mark>'+escape(term)+'</mark>');}
function sourceHTML(source){
 if(!source)return '<div class="source-warning" role="alert">Fuente no disponible para este proyecto.</div><p>La referencia no está registrada o pertenece a otro expediente. Falta un documento autorizado y verificable.</p><button type="button" class="quiet" data-prepare-missing>Preparar búsqueda de fuente</button><p>Prepara una petición en el borrador; no inicia una búsqueda ni amplía el acceso.</p>';
 const metadata='<dl class="source-meta"><dt>Tipo</dt><dd>Supuesto / fuente de ejemplo</dd><dt>Fecha</dt><dd>'+escape(source.date)+'</dd><dt>Revisión</dt><dd>'+escape(source.revision)+'</dd><dt>Ubicación</dt><dd>'+escape(source.location)+'</dd><dt>Proyecto</dt><dd>'+escape(model.name)+' · ejemplo separado</dd><dt>Consultada</dt><dd>'+escape(scenarioFor(model,state.scenario_id)?.label||'—')+'</dd><dt>Defendida</dt><dd>'+escape(scenarioFor(model,model.defended_scenario_id)?.label||'—')+'</dd>'+(source.issuer?'<dt>Emisor</dt><dd>'+escape(source.issuer)+'</dd><dt>Vigencia</dt><dd>'+escape(source.validity)+'</dd>':'')+'</dl>';
 let text='<div class="source-warning">Fuente ficticia · sin validez normativa ni financiera.</div><p class="source-quick-meta">'+escape(source.location)+' · '+escape(source.date)+'<br>Consultando '+escape(scenarioFor(model,state.scenario_id)?.label||'—')+' · Defendida '+escape(scenarioFor(model,model.defended_scenario_id)?.label||'—')+'</p>';
 if(source.card==='terreno')text+=mapSVG(true);
 text+='<h3>Pasaje de la fuente · texto original de ejemplo</h3><blockquote class="source-passage">'+highlight(source.original,source.highlight)+'</blockquote><h3>Lectura del autón · interpretación separada</h3><p class="source-interpretation">'+escape(source.analysis)+'</p>';
 text+='<details class="source-provenance"><summary>Ficha de fuente, emisor, vigencia y revisión</summary>'+metadata+'</details>';
 if(source.table)text+='<div class="source-table-wrap" tabindex="0" aria-label="Tabla de fuente, desliza si hace falta"><table class="source-table"><thead><tr>'+source.table.headers.map(x=>'<th scope="col">'+escape(x)+'</th>').join('')+'</tr></thead><tbody>'+source.table.rows.map(row=>'<tr>'+row.map(x=>'<td>'+escape(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 if(source.parent_id)text+=sourceLink(source.parent_id,'Ver estudio de mercado y su hoja','↗');
 for(const id of source.related||[])text+=sourceLink(id,sourceFor(model,id)?.title||'Fuente faltante','↗');
 return text;
}
function openSource(id,trigger=null,messageId=null){
 syncDraft();if(messageId){const cited=state.messages.find(m=>m.id===messageId);if(cited&&scenarioFor(model,cited.scenario_id)){consultScenario(model,state,cited.scenario_id);paintCards();}}state.source_id=id;state.detail=null;state.message_anchor=messageId||state.messages.find(m=>m.source_id===id)?.id||null;if(trigger)lastSourceTrigger=trigger;
 const src=sourceFor(model,id);$('source-title').textContent=src?.title||'Fuente no disponible';$('viewer-kind').textContent='Fuente de ejemplo · '+(headings[src?.card]||'referencia');$('source-body').innerHTML=sourceHTML(src);$('context-viewer').hidden=false;document.querySelector('.dialogue-column').classList.add('has-source');$('comment-source').hidden=false;$('comment-source').disabled=!src;$('back-message').hidden=!state.message_anchor;
 if(window.matchMedia('(max-width:900px)').matches){state.mobile_view='chat';paintMobile();}
 $('source-title').focus({preventScroll:true});paintDraft();
}
function detailHTML(key){
 const selected=scenarioFor(model,state.scenario_id),v=viabilityFor(model,state.scenario_id);
 if(key==='escenarios'||key==='viabilidad')return '<div class="source-warning">Consulta de ejemplo: no cambia la versión defendida ni guarda datos.</div><dl class="source-meta"><dt>Consultada</dt><dd>'+escape(selected?.label)+'</dd><dt>Defendida</dt><dd>'+escape(scenarioFor(model,model.defended_scenario_id)?.label)+'</dd><dt>TIR</dt><dd>'+escape(irrLabel(model,selected))+'</dd><dt>Horizonte</dt><dd>1 año · flujo normalizado</dd><dt>Revisión</dt><dd>'+escape(selected?.revision)+'</dd></dl><h3>Viabilidad de '+escape(v.version)+'</h3><p>'+escape(v.summary)+'</p><p>'+escape(v.constraint)+'</p><p>'+escape(v.risk)+'</p>'+sourceLink(selected?.source_id,'Ver flujo y supuestos de la versión','↗');
 return cardBody(key);
}
function resourceHTML(key){
 if(key==='connections')return '<div class="source-warning">Inventario leído en código; esta maqueta no establece ninguna conexión operativa.</div><ul class="resource-list">'+CONNECTION_INVENTORY.map(c=>'<li><strong>'+escape(c.name)+'</strong><p>'+escape(c.state)+'</p><p>'+escape(c.detail)+'</p></li>').join('')+'</ul>';
 if(key==='work')return '<ul class="resource-list"><li><strong>Ahora · verificar el terreno</strong><p>Fuente necesaria: documento registrado del expediente.</p></li><li><strong>Después · contrastar normativa y mercado</strong><p>Conservar artículos, registros, fechas y cobertura.</p></li><li><strong>Resultado · versión defendible</strong><p>Presentar fuentes, restricciones y razón de la recomendación.</p></li></ul>';
 if(key==='notes')return '<p>Nota de ejemplo: distinguir hechos, supuestos y decisión. La selección visual no autoriza modificar un dato.</p>';
 if(key==='history')return '<p>Historial de ejemplo: no hay cambios de negocio realizados. Toda entrega real deberá mostrar fecha, fuente, antes/después y recibo confirmado.</p>';
 if(key==='presentation')return '<h3>1 · Resultado y evidencia</h3><p>Una lámina con versión, fuentes y restricciones.</p><h3>2 · Decisión que sigue</h3><p>Otra lámina con incertidumbre y acción necesaria. La conversación sigue disponible durante la revisión.</p>';
 return'';
}
function openDetail(key){
 syncDraft();state.detail=key;state.source_id=null;state.message_anchor=null;
 const resourceNames={connections:'Conexiones encontradas',work:'Trabajo y próximos pasos',notes:'Notas y acuerdos',history:'Historial y evidencia',presentation:'Presentación'};
 $('source-title').textContent=resourceNames[key]||headings[key]||'Detalle';$('viewer-kind').textContent='Contexto del mismo proyecto';$('source-body').innerHTML=resourceNames[key]?resourceHTML(key):detailHTML(key);$('context-viewer').hidden=false;document.querySelector('.dialogue-column').classList.add('has-source');$('comment-source').hidden=true;$('back-message').hidden=true;
 if(window.matchMedia('(max-width:900px)').matches){state.mobile_view='chat';paintMobile();}$('source-title').focus({preventScroll:true});paintDraft();
}
function closeSource(){syncDraft();state.source_id=null;state.detail=null;$('context-viewer').hidden=true;document.querySelector('.dialogue-column').classList.remove('has-source');const trigger=lastSourceTrigger;lastSourceTrigger=null;if(trigger?.isConnected)trigger.focus({preventScroll:true});else $('message-input').focus({preventScroll:true});}
function paintMobile(){
 const view=state.mobile_view||'ppp';document.querySelector('.workspace-grid').dataset.mobileView=view;$('mobile-ppp').setAttribute('aria-pressed',String(view==='ppp'));$('mobile-chat').setAttribute('aria-pressed',String(view==='chat'));
 $('mobile-context-summary').hidden=false;
 const consulted=scenarioFor(model,state.scenario_id)?.label||'—',defended=scenarioFor(model,model.defended_scenario_id)?.label||'—';
 $('mobile-context-summary').textContent='PPP · Consultando '+consulted+' · Defendida '+defended+(state.source_id?' · Fuente: '+(sourceFor(model,state.source_id)?.title||'No disponible'):'');
}
function chooseScenario(id){
 syncDraft();consultScenario(model,state,id);paintCards();const focused=document.querySelector('[data-scenario="'+id+'"]');if(focused)focused.focus({preventScroll:true});if(state.source_id)$('source-body').innerHTML=sourceHTML(sourceFor(model,state.source_id));if(['escenarios','viabilidad'].includes(state.detail))$('source-body').innerHTML=detailHTML(state.detail);paintDraft();paintMobile();
}
function renderProject(){
 $('case-select').value=model.id;$('agent-badge').textContent=model.name.slice(0,1);$('case-kind').textContent='Plan de potencial · '+model.kind.toLowerCase();$('project-goal').textContent=model.goal;$('project-next').textContent='Siguiente: '+model.next;paintCards();paintMessages();paintDraft();$('context-viewer').hidden=true;document.querySelector('.dialogue-column').classList.remove('has-source');
 if(state.source_id)openSource(state.source_id);else if(state.detail)openDetail(state.detail);paintMobile();
}
$('case-select').onchange=e=>{syncDraft();model=createDemoCase(e.target.value);state=projects.get(model.id)||createProjectState(model);projects.set(model.id,state);lastSourceTrigger=null;$('context-viewer').hidden=true;renderProject();$('voice-status').textContent='Voz de ejemplo · proyecto '+model.name+'. Micrófono sin activar.';};
$('message-input').oninput=()=>syncDraft();
document.addEventListener('click',e=>{
 const source=e.target.closest('[data-source]');if(source){openSource(source.dataset.source,source,source.dataset.message);return;}
 const scenario=e.target.closest('[data-scenario]');if(scenario){chooseScenario(scenario.dataset.scenario);return;}
 const detail=e.target.closest('[data-detail]');if(detail){openDetail(detail.dataset.detail);return;}
 const resource=e.target.closest('[data-resource]');if(resource){$('work-popover').hidden=true;$('work-menu').setAttribute('aria-expanded','false');openDetail(resource.dataset.resource);return;}
 if(e.target.closest('[data-prepare-missing]')){syncDraft();state.draft+=(state.draft?'\n':'')+'Quiero localizar y comprobar la fuente de este dato en el expediente actual.';paintDraft();$('message-input').focus({preventScroll:true});return;}
 if(e.target.closest('#remove-reference')){state.draft_ref=null;paintDraft();return;}
});
$('close-source').onclick=closeSource;
$('comment-source').onclick=()=>{syncDraft();if(!sourceFor(model,state.source_id))return;citeSource(model,state,state.source_id);paintDraft();$('message-input').focus({preventScroll:true});};
$('back-message').onclick=()=>{const anchor=state.message_anchor;closeSource();const message=anchor?document.getElementById(anchor):null;if(message){message.setAttribute('tabindex','-1');message.scrollIntoView({block:'nearest'});message.focus({preventScroll:true});}};
$('work-menu').onclick=()=>{const open=$('work-popover').hidden;$('work-popover').hidden=!open;$('work-menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu(false);const open=!$('work-popover').hidden;$('work-popover').hidden=true;$('work-menu').setAttribute('aria-expanded','false');if(open)$('work-menu').focus({preventScroll:true});}});
$('mobile-ppp').onclick=()=>{syncDraft();state.mobile_view='ppp';paintMobile();};$('mobile-chat').onclick=()=>{syncDraft();state.mobile_view='chat';paintMobile();};
$('mic-button').onclick=()=>{$('voice-status').textContent='Demostración de escucha; no hay audio conectado. El mismo hilo conserva voz y texto.';};
$('stop-button').onclick=()=>{$('voice-status').textContent='Demostración interrumpida. Borrador y proyecto conservados; no hay una sesión real de audio.';};
$('message-form').onsubmit=e=>{
 e.preventDefault();syncDraft();const value=state.draft.trim();if(!value)return;
 const ref=state.draft_ref;
 state.messages.push({id:model.id+':message-'+state.messages.length,who:'user',text:value,...(ref?{source_id:ref.source_id,scenario_id:ref.scenario_id}:{scenario_id:state.scenario_id})});
 state.draft='';state.draft_ref=null;paintMessages();paintDraft();$('chat-stream').scrollTop=$('chat-stream').scrollHeight;$('voice-status').textContent='Mensaje local en la maqueta. No enviado a un agente ni a Sheets.';
};
const nav=$('preview-nav'),home=$('home-grid'),catalogue=window.YodCatalogo.filter(x=>!x.sinMarco&&!x.navParent);
for(const c of catalogue){const a=document.createElement('a');a.className='nav-item';a.dataset.systemId=c.id;a.href='#'+c.id;a.innerHTML='<i class="ti ti-'+escape(c.icono)+'">◇</i><span>'+escape(c.nombre)+'</span>';nav.appendChild(a);const button=document.createElement('button');button.type='button';button.className='home-tile';button.textContent=c.nombre;button.onclick=()=>{location.hash=c.id;};home.appendChild(button);}
const people=document.createElement('a');people.className='nav-item';people.href='#personas';people.innerHTML='<i class="ti ti-users">◇</i><span>Personas y accesos</span>';nav.appendChild(people);
function route(){const key=location.hash.slice(1)||'SYS-DESPACHO',board=catalogue.find(x=>x.id===key),workspace=key==='SYS-DESPACHO';$('workspace').hidden=!workspace;$('home-view').hidden=workspace;$('route-title').textContent=workspace?'El Despacho':board?.nombre||(key==='personas'?'Personas y accesos':'Inicio');$('home-title').textContent=board?.nombre||(key==='personas'?'Personas y accesos':'Tu espacio de trabajo');document.querySelectorAll('#preview-nav .nav-item').forEach(a=>a.classList.toggle('active',a.dataset.systemId===key));menu(false);}
renderProject();route();window.addEventListener('hashchange',route);
