'use strict';
/* Etapa 1 del análisis «YOD OS tablero por tablero» (13-nov-2026): la cartera del folio.
   Reglas de os/proyectos.js y el cableado de tablero.html, sin red. */
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('fs'), path=require('path');
const P=require('../os/proyectos.js');
const HDR=['project_id','proyecto','código','ubicación','tipo','etapa_actual','estado','responsable_id','sheet_url','drive_folder_url','actualizado','notas','admision','admision_desde','admision_fuente','etapa_folio'];
const fila=(f,n,etapa,adm='',extra={})=>{const r=HDR.map(()=> '');r[0]=f;r[1]=n;r[5]=extra.etapa_actual||'';r[6]='Activo';r[7]='PER-X';r[8]='https://privado';r[11]='nota privada';r[12]=adm;r[15]=etapa;return r;};

test('las siete etapas del folio, en orden y con su número',()=>{
  assert.deepEqual(P.etapasFolio,['Captado','Evaluado','Acordado','Fondeado','En obra','En venta y cobro','Repartido']);
  assert.deepEqual(P.etapaFolio('2 · Evaluado'),{n:2,nombre:'Evaluado'});
  assert.deepEqual(P.etapaFolio('6 · En venta y cobro'),{n:6,nombre:'En venta y cobro'});
  assert.deepEqual(P.etapaFolio(''),{n:0,nombre:''});
  assert.deepEqual(P.etapaFolio('9 · Otra'),{n:0,nombre:''});
  assert.deepEqual(P.etapaFolio(null),{n:0,nombre:''});
});

test('desde la pestaña del Control Maestro sólo salen columnas sin riesgo',()=>{
  const l=P.desdeControlMaestro([HDR,fila('prj-rm','Real de Miramar','6 · En venta y cobro','',{etapa_actual:'Preventa I'}),fila('','sin folio','2 · Evaluado'),fila('PRJ-ADMIN','Admin','')]);
  assert.equal(l.length,2);
  assert.equal(l[0].folio,'PRJ-RM'); assert.equal(l[0].etapa_n,6); assert.equal(l[0].etapa,'En venta y cobro'); assert.equal(l[0].etapa_actual,'Preventa I');
  const txt=JSON.stringify(l);
  assert.ok(!txt.includes('nota privada')&&!txt.includes('https://privado')&&!txt.includes('PER-X'),'no salen notas, ligas ni responsables');
  assert.deepEqual(P.desdeControlMaestro([]),[]);
  assert.deepEqual(P.desdeControlMaestro([['otra','cosa'],['a','b']]),[],'sin project_id no se inventa nada');
});

test('los carriles: baja va fuera y lo que no tiene etapa no entra',()=>{
  const l=P.desdeControlMaestro([HDR,fila('PRJ-RM','RM','6 · En venta y cobro'),fila('PRJ-ALYSA','Alysa','5 · En obra','standby'),fila('PRJ-CERCADA','Cercada','2 · Evaluado','baja'),fila('PRJ-ADMIN','Admin',''),fila('PRJ-Q','Quintas','2 · Evaluado','alta')]);
  const g=P.porEtapaFolio(l);
  assert.equal(g.carriles.length,7);
  assert.deepEqual(g.carriles.map(c=>c.proyectos.length),[0,1,0,0,1,1,0]);
  assert.deepEqual(g.fuera.map(p=>p.folio),['PRJ-CERCADA']);
  assert.deepEqual(g.sinEtapa.map(p=>p.folio),['PRJ-ADMIN']);
  assert.equal(g.carriles[4].proyectos[0].admision,'standby','en pausa se queda en su carril');
});

test('la respuesta del Portero (?recurso=cartera) se agrupa igual',()=>{
  const g=P.porEtapaFolio([{folio:'PRJ-A',etapa_n:1},{folio:'PRJ-B',etapa_n:7},{folio:'PRJ-C',etapa_n:0},{folio:'',etapa_n:2}]);
  assert.deepEqual(g.carriles.map(c=>c.proyectos.length),[1,0,0,0,0,0,1]);
  assert.equal(g.sinEtapa.length,1);
});

test('tablero.html lee la cartera en vivo, cae a la pestaña sólo para admin y no toca la sesión',()=>{
  const s=fs.readFileSync(path.join(__dirname,'..','tablero.html'),'utf8');
  const i=s.indexOf('async function cargarCartera'), j=s.indexOf('/* ═══ EL CANDADO');
  assert.ok(i>0&&j>i,'cargarCartera vive antes del candado');
  const bloque=s.slice(s.indexOf('ETAPA 1 DEL ANÁLISIS'),j);
  assert.match(bloque,/recurso=cartera/);
  assert.match(bloque,/j\.error==="recurso"&&rol==="admin"[\s\S]*recurso=cm&hoja=Proyectos/,'la pestaña sólo para admin y sólo si el Portero aún no tiene cartera');
  assert.ok(!/removeItem/.test(bloque),'nunca borra pyod_clave_v1');
  assert.match(bloque,/credentials:"omit"/);
  assert.match(bloque,/AbortController/,'el plazo corta la petición');
  assert.match(s,/sondaFinance\(\);\n  cargarCartera\(\);/,'abrir() pide la cartera');
  assert.match(s,/#etapas\.folio7\{grid-template-columns:repeat\(7,/);
});
