const names={juntas:'Sala de juntas',comunicacion:'Centro de comunicación',biblioteca:'Biblioteca',navegacion:'Sala de navegación',drive:'Suite de Drive',edicion:'Sala de edición',direccion:'Dirección',usos:'Salón de usos múltiples',museo:'Museo de maquetas'};
const labels={readPending:'Ver pendientes',recordVisit:'Registrar llegada'};
const scenarios=[
 ['permitido','Lectura permitida','Sesión vigente, expediente propio, Juntas y lectura de pendientes.'],
 ['denegado','Envío denegado','Pedir un envío requiere acción aprobada; ese nivel no está concedido.'],
 ['ajeno','Expediente ajeno','La sesión de prueba no puede elegir otro expediente.'],
 ['revocado','Retirar acceso durante lectura','Se retira el acceso después de consultar; la respuesta no se entrega.'],
 ['suplantado','Cambiar actor durante lectura','La identidad al terminar debe ser la misma que inició.'],
 ['url','Nivel inventado por URL','Un parámetro adicional no puede elevar el nivel de permiso.']
];
export function montarPruebaPermisos({doc=document,create=globalThis.createOfficePermissions}={}){
 const root=doc.getElementById('permissions-demo'),add=(tag,text,parent=root)=>{const n=doc.createElement(tag);n.textContent=text;parent.appendChild(n);return n;};
 const panel=add('section','');panel.className='activity-state';const state=add('h2','Elige una comprobación',panel),detail=add('p','Cada botón comienza con una sesión sintética nueva.',panel),counts=add('p','Lecturas ejecutadas: 0 · Datos entregados: 0',panel),out=add('pre','',panel);out.setAttribute('aria-label','Respuesta de política');
 const actions=add('div','');actions.className='activity-actions';
 const matrix=add('section','');add('h2','Matriz inicial',matrix);const table=add('table','',matrix);table.setAttribute('style','width:100%');const head=add('thead','',table),hr=add('tr','',head);for(const t of ['Espacio','Nivel','Operaciones'])add('th',t,hr);const body=add('tbody','',table);
 const fixture=()=>{let actor='ACTOR-SINTETICO',allowed=true;const backend=create({case_id:'CASO-SINTETICO',serverContext:{},now:()=>Date.UTC(2026,9,4),authenticate:()=>({allowed,actor_id:actor,case_id:'CASO-SINTETICO'})});return {backend,revoke:()=>{allowed=false;},swap:()=>{actor='OTRO-ACTOR-SINTETICO';}};};
 const snapshot=fixture().backend.inspect({case_id:'CASO-SINTETICO'});for(const s of snapshot.spaces){const tr=add('tr','',body);add('td',names[s.space_id],tr);add('td',s.level?'Observar':'Sin conexión',tr);add('td',s.operations.map(x=>labels[x]).join(' · ')||'Ninguna',tr);}
 for(const [id,label,explanation] of scenarios){const button=add('button',label,actions);button.type='button';button.addEventListener('click',()=>{
  const f=fixture();let executed=0;const request={case_id:id==='ajeno'?'CASO-AJENO-SINTETICO':'CASO-SINTETICO',space_id:id==='denegado'?'comunicacion':'juntas',operation:id==='denegado'?'sendDraft':'readPending'};if(id==='url')request.level='accion';
  const r=f.backend.executeRead(request,()=>{executed++;if(id==='revocado')f.revoke();if(id==='suplantado')f.swap();return {ok:true,items:['ENTREGA-SINTETICA']};});
  root.setAttribute('data-scenario',id);root.setAttribute('data-result',r.ok?'allowed':'denied');root.setAttribute('data-read-count',String(executed));root.setAttribute('data-delivered-count',String(r.ok?1:0));
  state.textContent=r.ok?'Lectura permitida':'Operación denegada';detail.textContent=explanation+' '+(r.ok?'La lectura de prueba se entregó.':'No se entregaron datos.');counts.textContent='Lecturas ejecutadas: '+executed+' · Datos entregados: '+(r.ok?1:0);out.textContent=JSON.stringify(r,null,2);
 });}
 return {root};
}
