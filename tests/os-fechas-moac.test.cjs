'use strict';
/* Barrido 10-nov-2026 (CHG-OS-BARRIDO-20261110): MOAC guarda el día de compromiso con su nombre
   («Miércoles 7») y el mes aparte («Octubre»). El Inicio de YOD OS sólo aceptaba el número al
   principio del texto, así que TODAS las tareas salían «Sin fecha» y el resumen decía 0 vencidas
   mientras MOAC marcaba 25 atrasadas. Aquí se comprueba que el adaptador lee las fechas igual que
   board-aurum (getDayNumber + mesCompromiso). Datos sintéticos; sin red. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','os','adapters','operations.js'),'utf8');
const HOY=new Date(2026,10,10,9,0,0); // 10-nov-2026, 9:00 de la mañana
function adaptador(){
  class FakeDate extends Date{constructor(...a){if(a.length)super(...a);else super(HOY.getTime());}static now(){return HOY.getTime();}}
  const ctx=vm.createContext({Date:FakeDate,Math,Number,String,Array,parseInt,isFinite,JSON});
  vm.runInContext(src,ctx);
  return ctx.YodOperations;
}
const tarea=(fecha,mes,extra={})=>({fecha,mesCompromiso:mes,mes,anio:2026,estado:'Pendiente',responsable:'Persona A',...extra});

test('el día con su nombre («Miércoles 7») se lee como fecha, igual que en MOAC',()=>{
  const op=adaptador();
  assert.equal(op.daysUntil(tarea('Miércoles 7','Octubre')),-34);
  assert.equal(op.daysUntil(tarea('Domingo 30','Noviembre')),20);
  assert.equal(op.daysUntil(tarea('Martes 10','Noviembre')),0);
});

test('los formatos que ya funcionaban se conservan',()=>{
  const op=adaptador();
  assert.equal(op.daysUntil(tarea('7','Octubre')),-34,'sólo el número');
  assert.equal(op.daysUntil(tarea('2026-11-14','Noviembre')),4,'fecha completa: el día real, no los dígitos del año');
  assert.equal(op.daysUntil(tarea('  12 ','noviembre ')),2,'espacios y minúsculas');
});

test('sin día o sin mes sigue diciendo «sin fecha» (null), sin inventar',()=>{
  const op=adaptador();
  assert.equal(op.daysUntil(tarea('','Octubre')),null);
  assert.equal(op.daysUntil(tarea('Miércoles','Octubre')),null);
  assert.equal(op.daysUntil(tarea('Miércoles 7','')),null);
  assert.equal(op.daysUntil(tarea('Miércoles 7','Brumario')),null);
  assert.equal(op.daysUntil(tarea('Semana 2026','Octubre')),null,'un año suelto no es un día');
});

test('el resumen del Inicio cuenta las vencidas que antes salían «sin fecha»',()=>{
  const op=adaptador();
  const tareas=[
    tarea('Miércoles 7','Octubre'),
    tarea('Domingo 4','Octubre'),
    tarea('Viernes 13','Noviembre'),
    tarea('Lunes 1','Diciembre'),
    tarea('Martes 3','Noviembre',{estado:'Terminado'}),
    tarea('Jueves 2','Octubre',{archivada:true}),
    tarea('Jueves 2','Octubre',{borrada:'true'}),
    tarea('','')
  ];
  const r=op.summarize(tareas);
  assert.equal(r.total,6,'archivadas y borradas fuera');
  assert.equal(r.open,5,'terminadas fuera');
  assert.equal(r.overdue,2,'las dos de octubre');
  assert.equal(r.dueSoon,1,'la del viernes 13');
  assert.equal(r.priority[0].fecha,'Domingo 4','la más vencida primero (4-oct)');
  assert.equal(r.priority[r.priority.length-1].fecha,'','la que no tiene fecha va al último');
});
