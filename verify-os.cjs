'use strict';
const assert=require('node:assert/strict');
require('./os/adapters/operations.js');
require('./os/adapters/finance.js');
require('./os/adapters/marketing.js');
require('./os/access-policy.js');
const api=globalThis.YodOperations;
const finance=globalThis.YodFinance;
const marketing=globalThis.YodMarketing;
const access=globalThis.YodAccessPolicy;
const portal=require('./portal-core.js');
const fs=require('node:fs');

// --- Paridad de las tres fuentes (ver CODIGOS-BOARDS.md) ---
// shell.js vive embebido en tableros de OTROS repos, así que no puede importar
// access-policy.js: mantiene su copia. Aquí se comprueba que digan LO MISMO.
const shellSrc=fs.readFileSync(require.resolve('./os/shell.js'),'utf8');
function bloque(src,nombre){
  const ini=src.indexOf('var '+nombre+' = {');
  assert.ok(ini>-1,'no se encontró '+nombre+' en shell.js');
  const fin=src.indexOf('\n  };',ini);
  assert.ok(fin>-1,'no se encontró el cierre de '+nombre);
  return new Function('return '+src.slice(ini+('var '+nombre+' =').length,fin+4).trim().replace(/;$/,''))();
}
const shellCodes=bloque(shellSrc,'CODES');
assert.deepEqual(shellCodes,JSON.parse(JSON.stringify(access.systemCodes)));
// shell.js tiene su propia tabla de destinos; la canónica es portal-core.js.
const shellDest=bloque(shellSrc,'DEST');
Object.keys(portal.destinations).forEach(function(id){
  if(id==='SYS-CONTROL')return; // el Sheet maestro no es un tablero con shell
  assert.equal(shellDest[id],portal.destinations[id][0],'DEST desalineado: '+id);
});
assert.equal(Object.keys(shellDest).length,Object.keys(portal.destinations).length-1);

assert.equal(access.canOpen('TA','SYS-TAREAS','vista'),true);
assert.equal(access.canOpen('FL','SYS-TAREAS','vista'),false);
assert.equal(access.canOpen('MK','SYS-MARKETING','vista'),true);
assert.equal(access.canOpen('TA','SYS-INVERSION','vista'),false);
assert.equal(access.canOpen('*','SYS-INVERSION','vista'),true);
assert.equal(access.canOpen('','SYS-INVERSION','admin'),true);
assert.equal(access.canOpen('TC','SYS-TRACK','vista'),true);
assert.equal(access.canOpen('OB','SYS-OBRA','vista'),true);
assert.equal(access.canOpen('OB','SYS-FLUJO','vista'),false);
assert.equal(access.canOpen(' ta ','SYS-TAREAS','vista'),true);
assert.equal(access.canOpen('ta','SYS-TAREAS','vista'),true);
assert.equal(access.canOpen('','SYS-TAREAS','Admin'),true);
// AC no abre el Control Maestro: es Sheet de Dirección (rol admin).
assert.equal(access.canOpen('AC','SYS-CONTROL','vista'),false);
assert.equal(access.canOpen('','SYS-CONTROL','admin'),true);

// --- portal-core: allowlist, estado y limpieza de filas ---
assert.equal(portal.safeUrl('https://evil.com/x','SYS-POTENCIALES'),'');
assert.equal(portal.resolveUrl({system_id:'SYS-POTENCIALES'}),portal.destinations['SYS-POTENCIALES'][0]);
assert.equal(portal.enabled({system_id:'SYS-POTENCIALES',estado:'mantenimiento'}),false);
assert.equal(portal.enabled({system_id:'SYS-POTENCIALES',estado:' Activo '}),true);
assert.equal(portal.badge({system_id:'SYS-POTENCIALES',estado:'activo',url:'https://evil.com/x'}).text,'URL inválida');
assert.deepEqual(portal.cleanRows([{visible:'NO',system_id:'A'},{visible:'SI'},{visible:'SI',system_id:'B',orden:1}]).map(r=>r.system_id),['B']);
// El Sheet manda: 'Si', 'sí ' o 'SI ' también cuentan como visible.
assert.deepEqual(portal.cleanRows([{visible:' Si ',system_id:'C',orden:2},{visible:'si',system_id:'D',orden:1}]).map(r=>r.system_id),['D','C']);
assert.equal(api.normalizeStatus('Subido'),'En standby');
assert.equal(api.normalizeStatus('Completado'),'Terminado');
const month=new Intl.DateTimeFormat('es-MX',{month:'long'}).format(new Date());
const day=new Date().getDate();
const result=api.summarize([
  {actividad:'Hoy',mes:month,fecha:String(day),estado:'Pendiente'},
  {actividad:'Terminada',mes:month,fecha:String(day),estado:'Terminado'},
  {actividad:'Revisión',mes:month,fecha:String(day),estado:'Subido'},
  {actividad:'Archivada',mes:month,fecha:String(day),estado:'Pendiente',archivada:true}
]);
assert.equal(result.total,3);
assert.equal(result.open,2);
assert.equal(result.dueSoon,2);
assert.equal(result.review,1);
assert.equal(result.priority.length,2);
// Casos límite de fecha: mes con espacios, fecha ISO completa y basura.
assert.equal(api.daysUntil({mes:' Enero ',fecha:'15',anio:2026}),api.daysUntil({mes:'Enero',fecha:'15',anio:2026}));
assert.notEqual(api.daysUntil({mes:'Enero',fecha:'15',anio:2026}),null);
assert.equal(api.daysUntil({mes:'Marzo',fecha:'2026-03-15',anio:2026}),api.daysUntil({mes:'Marzo',fecha:'15',anio:2026}));
assert.equal(api.daysUntil({mes:'Marzo',fecha:'',anio:2026}),null);
assert.equal(api.daysUntil({mes:'',fecha:'15',anio:2026}),null);
assert.equal(api.daysUntil({mes:'Marzo',fecha:'sin fecha',anio:2026}),null);
const financeSummary=finance.summarize({saldo:{monto:1000,fecha:'2026-07-13'},pagos:[{monto:300,estatus:'Pendiente'},{monto:50,estatus:'Pagado'}],ingresosEsperados:[{monto:500,estatus:'Esperado'}]});
assert.equal(financeSummary.balance,1000);
assert.equal(financeSummary.payments,300);
assert.equal(financeSummary.income,500);
assert.equal(financeSummary.projected,1200);
const marketingSummary=marketing.summarize({meta:{periodo:'Semana'},kpis:{leads:10,citas:4,clientes:1,nuevos_sin_tocar_24h:2},gasto:{semana_actual:5000}});
assert.equal(marketingSummary.appointmentRate,.4);
assert.equal(marketingSummary.clientRate,.1);
assert.equal(marketingSummary.costPerLead,500);
// El Sheet puede entregar los números con coma de miles: no deben perderse.
const marketingMiles=marketing.summarize({kpis:{leads:'1,200',citas:'400',clientes:'100'},gasto:{semana_actual:'50,000'}});
assert.equal(marketingMiles.leads,1200);
assert.equal(marketingMiles.spend,50000);
assert.equal(Math.round(marketingMiles.costPerLead*100)/100,41.67);
const financeMiles=finance.summarize({saldo:{monto:'$1,000.50'},pagos:[{monto:'300',estatus:'Pendiente'}],ingresosEsperados:[]});
assert.equal(financeMiles.balance,1000.5);
assert.equal(financeMiles.payments,300);
console.log('YOD OS adapters + portal-core + paridad de códigos: passed');

// --- La máscara de la Sala (4-sep-2026): el OS valida la credencial contra el Sheet de la
// Sala ANTES de montar el iframe (esa validación tarda 60-86 s y la Sala se rinde a los 10 s).
const appSrc=fs.readFileSync(require.resolve('./os/app.js'),'utf8');
assert.ok(appSrc.includes('function llaveSalaLista_('),'app.js: falta llaveSalaLista_ (la Sala volvería a caer al respaldo)');
assert.ok(/SALA_LIMITE_MS=(\d+)/.test(appSrc)&&Number(RegExp.$1)>=90000,'app.js: SALA_LIMITE_MS debe cubrir los 60-86 s del Portero');
assert.ok(!/canje_os/.test(appSrc),'app.js: canje_os se retiró el 4-sep; no debe volver');
const osHtml=fs.readFileSync(require.resolve('./os/index.html'),'utf8');
assert.ok(/app\.js\?v=motor9/.test(osHtml),'os/index.html: el ?v= de app.js no coincide con este motor');
console.log('Máscara de la Sala: passed');
