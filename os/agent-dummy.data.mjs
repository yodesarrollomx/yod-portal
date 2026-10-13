
// Fictional local interaction only. No fetch, writes, schedules, credentials or production finance.
export const SCENES=[
 {id:'conversation',title:'Conversar',guide:'Partimos del objetivo y del siguiente pendiente. Voz y texto usan el mismo hilo.'},
 {id:'correction',title:'Corregir con evidencia',guide:'La ficha dice 644 m² y el borrador 500. Pide la corrección; el autón muestra el antes/después.'},
 {id:'norm',title:'Normativa y fuentes',guide:'Lee el pasaje resaltado. Coméntalo sin perder tu borrador ni la versión.'},
 {id:'market',title:'Mercado',guide:'Cada precio abre su registro, su unidad y el estudio que lo reúne.'},
 {id:'compare',title:'Escenarios y fórmulas',guide:'Consulta V1, V2 o V3. La viabilidad y las fórmulas siguen esa consulta; la defendida permanece V2.'},
 {id:'work',title:'Trabajo y entregables',guide:'Objetivo, siguiente acción, fuente, impedimento y criterio de cierre. Avance por resultados comprobados.'},
 {id:'presentation',title:'Presentación y siguiente encargo',guide:'Dos láminas de ejemplo, conversación al lado y una decisión concreta para continuar.'}
];
export const FORMULAS=[
 {id:'irr',name:'TIR del proyecto',expression:'Σ Fₜ / (1 + r)ᵗ = 0',unit:'Tasa por periodo del flujo',basis:'En este ejemplo anual de un periodo: r = F₁ / −F₀ − 1.',limit:'La TIR real se lee del libro canónico. Flujos de fechas irregulares requieren la convención correspondiente; múltiples cambios de signo pueden dar varias TIR.'},
 {id:'npv',name:'VPN',expression:'VPN = Σ Fₜ / (1 + k)ᵗ',unit:'Mismas unidades monetarias del flujo',basis:'k = 10% anual, sólo supuesto del dummy. Incluye F₀ negativo.',limit:'No comparar periodos, monedas o tasas diferentes. Sin flujo/tasa no hay resultado.'},
 {id:'build',name:'Costo directo de construcción',expression:'Superficie construida × costo por m²',unit:'MXN',basis:'1,000 m² construidos × $14,200 MXN/m² = $14,200,000 MXN.',limit:'Los 1,000 m² construidos son un supuesto independiente de los 644 m² del terreno. Excluye terreno, impuestos, indirectos y financiación; no es un presupuesto.'},
 {id:'rent',name:'Ingreso bruto anual por renta',expression:'Renta mensual × unidades × 12 × ocupación',unit:'MXN/año',basis:'$9,600 × 8 × 12 × 90% = $829,440 MXN/año.',limit:'Supuestos ficticios. Excluye gastos operativos, morosidad, impuestos y financiación.'},
 {id:'margin',name:'Margen sobre ingresos',expression:'(Ingresos − costos) / ingresos × 100',unit:'%',basis:'Con ingresos/costos comparables del mismo horizonte. No se calcula aquí sin esos datos.',limit:'No equivale a TIR ni rendimiento del capital. Ingresos nulos o ausentes: no calculado.'}
];
export function onePeriodResult(initial,terminal,discount){
 if(![initial,terminal,discount].every(Number.isFinite)||initial>=0||terminal<0||discount<=-1)return null;
 return {irr:terminal/(-initial)-1,npv:initial+terminal/(1+discount)};
}
export function createInteraction(caseId){
 return {case_id:caseId,scene:'conversation',visited:['conversation'],surface_m2:500,source_surface_m2:644,correction:null,events:[],presentation_page:1,station:'Puesto',workflow_stage:'pending',tasks:[
 {id:caseId+':surface',title:'Superficie trazable',purpose:'Que todas las alternativas partan del mismo terreno.',next:'Contrastar 500 m² con la ficha de 644 m².',source_key:'deed',station:'Biblioteca',result:'Dato corregido con antes/después y referencia.',complete:false},
 {id:caseId+':norm',title:'Restricciones comprobables',purpose:'Evitar defender una alternativa que no cumpla.',next:'Reunir altura, uso, ocupación y seguridad con artículos.',source_key:'norm-list',station:'Biblioteca',result:'Lista de restricciones y fuentes; V3 sigue condicionada.',complete:false},
 {id:caseId+':market',title:'Mercado comparable',purpose:'Separar precios, unidades, fechas y cobertura.',next:'Leer venta, renta y construcción en su estudio.',source_key:'market-study',station:'Investigación',result:'Tres registros de ejemplo con unidad y estudio.',complete:false},
 {id:caseId+':decision',title:'Síntesis defendible',purpose:'Explicar la recomendación y la decisión que sigue.',next:'Comparar V2/V3 sin ocultar el riesgo normativo.',source_key:'model',station:'Juntas',result:'Dos láminas, versión y restricciones.',complete:false}
 ]};
}
export function correctSurface(interaction,target,sourceId){
 if(target!==interaction.source_surface_m2||sourceId!==interaction.case_id+':deed')return{ok:false,reason:'Falta la fuente de superficie del mismo expediente.'};
 if(interaction.correction)return{ok:true,repeated:true,receipt:interaction.correction};
 const before=interaction.surface_m2;
 interaction.surface_m2=target;
 interaction.correction={id:interaction.case_id+':local-change-1',case_id:interaction.case_id,before,after:target,unit:'m²',source_id:sourceId,scope:'dummy_local'};
 interaction.events.push({kind:'correction',receipt:interaction.correction});
 interaction.tasks[0].complete=true;
 return{ok:true,repeated:false,receipt:interaction.correction};
}
export function visitScene(interaction,id){
 if(!SCENES.some(s=>s.id===id))return false;
 interaction.scene=id;if(!interaction.visited.includes(id))interaction.visited.push(id);return true;
}
export function advanceLocalWork(interaction){
 // Explicit button advances one fictional receipt. No clock-driven / autonomous activity.
 const stages=['pending','research','review','ready'];
 const index=stages.indexOf(interaction.workflow_stage);if(index>=stages.length-1||(index===2&&!interaction.correction))return false;
 interaction.workflow_stage=stages[index+1];interaction.station=['Puesto','Investigación','Biblioteca','Juntas'][index+1];
 if(interaction.workflow_stage==='research')interaction.tasks[2].complete=true;
 if(interaction.workflow_stage==='review')interaction.tasks[1].complete=true;
 if(interaction.workflow_stage==='ready')interaction.tasks[3].complete=true;
 interaction.events.push({kind:'local_receipt',id:interaction.case_id+':stage-'+interaction.workflow_stage,station:interaction.station,stage:interaction.workflow_stage});
 return true;
}
export const METHOD=[
 {title:'Objetivo',text:'Un resultado concreto y para quién sirve. No una lista de herramientas.'},
 {title:'Fuente',text:'Documento o rango, caso, fecha, revisión y unidad. Si falta, se declara la incertidumbre.'},
 {title:'Plan',text:'Próxima acción, herramienta, impedimento y criterio para cerrar el resultado.'},
 {title:'Comprobación',text:'Antes/después y recibo; la afirmación del agente no sustituye la evidencia.'},
 {title:'Decisión',text:'Alternativa, retorno, restricciones y por qué se recomienda. Consulta separada de decisión guardada.'},
 {title:'Continuidad',text:'Pendiente y entrega registrados; el visor reconstruye estado. La operación 24/7 exige servidor real, no animación.'}
];
