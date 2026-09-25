// Pruebas de YOD Obra (obra-app): cálculos, plantillas y amarres con YOD OS. `node verify-obra-app.cjs`
const assert=require('assert'),fs=require('fs');
const C=require('./obra-app/calculo.js'),T=require('./obra-app/tipos.js'),R=require('./obra-app/obras.js'),P=require('./os/proyectos.js');
// avance ponderado por importe, no promedio
const D={conceptos:[
  {frente:'C1',descripcion:'Cimentación',cantidad:1,cant_ejecutada:1,precio_unitario:100,importe:100},
  {frente:'C1',descripcion:'Acabados',cantidad:1,cant_ejecutada:0,precio_unitario:300,importe:300},
  {frente:'C2',descripcion:'Cimentación',cantidad:10,cant_ejecutada:5,precio_unitario:10,importe:100}],
  restricciones:[{frente:'C2',titulo:'Falta varilla',estado:'ABIERTA',fecha:'2026-09-20'},{frente:'C1',titulo:'x',estado:'CERRADA'}],
  avances:[{id:'A1',estado:'PROPUESTO',propuesto_por:'Ana',frente:'C1',fecha_propuesta:'2026-09-21'},{id:'A2',estado:'VERIFICADO',frente:'C2'}]};
const g=C.global(D); assert.ok(Math.abs(g.avance-150/500)<1e-9,'global ponderado'); assert.ok(g.costeado);
const us=C.unidades(D); assert.deepStrictEqual(us.map(u=>u.unidad),['C1','C2']);
assert.ok(Math.abs(us[0].avance-0.25)<1e-9); assert.strictEqual(us[1].frenos,1); assert.strictEqual(us[0].frenos,0);
assert.strictEqual(C.estado(us[1]),'freno');
// sin precios: promedio simple
assert.ok(Math.abs(C.avanceDe([{cantidad:2,cant_ejecutada:1},{cantidad:1,cant_ejecutada:1}]).avance-0.75)<1e-9);
// pendientes por rol: quien capturó no verifica
const hoy=new Date(2026,8,25).getTime();
assert.strictEqual(C.pendientes(D,'VERIFICA','Ana',hoy).filter(x=>x.tipo==='firma').length,0);
assert.strictEqual(C.pendientes(D,'VERIFICA','Beto',hoy).filter(x=>x.tipo==='firma').length,1);
assert.strictEqual(C.pendientes(D,'AUTORIZA','Beto',hoy).filter(x=>x.tipo==='firma').length,2);
assert.strictEqual(C.pendientes(D,'VERIFICA','Beto',hoy)[0].dias,5);
const cola=C.colaFirma(D,hoy); assert.strictEqual(cola.verificar.n,1); assert.strictEqual(cola.autorizar.n,1);
// folios y unidades
assert.strictEqual(C.folioUnidad('prj-alysa','Depto 302'),'PRJ-ALYSA·DEPTO-302');
assert.deepStrictEqual(C.expandeUnidades('C1..C3, D-101..D-102, A, A'),['C1','C2','C3','D-101','D-102','A']);
assert.deepStrictEqual(C.expandeUnidades('C01..C03'),['C01','C02','C03']);
assert.strictEqual(C.plantilla('serie',['C1','C2'],['Losa','Muros']).length,4);
// duplicados de gasto
const movs=[{factura:'F-1',importe:10,fecha:'2026-09-01',concepto:'Cemento'}];
assert.ok(C.gastoDuplicado(movs,{factura:'f-1 ',importe:99}));
assert.ok(C.gastoDuplicado(movs,{importe:10,fecha:'2026-09-01',concepto:'cemento'}));
assert.ok(!C.gastoDuplicado(movs,{importe:10,fecha:'2026-09-02',concepto:'cemento'}));
// vista cliente: solo su unidad, sin importes
const v=C.vistaCliente(D,'C2'); assert.strictEqual(v.unidad.partidas.length,1); assert.ok(!('importe' in v.unidad.partidas[0]));
// tipos y registro
['casa','remodelacion','serie','departamentos','comercial','lotificacion','urbano','otra'].forEach(k=>assert.ok(T.tipos[k],k));
R.obras.forEach(o=>{assert.ok(P.lista.some(p=>p.folio===o.folio),o.folio+' no está en os/proyectos.js');assert.ok(T.tipos[o.tipo],o.tipo);
  assert.ok(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(o.motor),'motor');});
const obra=fs.readFileSync('obra.html','utf8'); const m=obra.match(/const GAS="([^"]+)"/);
assert.strictEqual(R.porFolio('PRJ-ALYSA').motor,m[1],'obras.js y obra.html deben usar el mismo motor');
// el cliente nunca ve YOD OS: la app no carga shell.js ni la chinche
const html=fs.readFileSync('obra-app/index.html','utf8');
assert.ok(!/shell\.js|chinche\.js/.test(html),'obra-app no carga shell ni chinche');
assert.ok(html.includes('../os/yod-acceso.js')&&html.includes('noindex'));
['obra-app/app.js','obra-app/calculo.js'].forEach(f=>new Function(fs.readFileSync(f,'utf8')));
const gs=fs.readFileSync('obra-app/motor/ObraCliente.gs','utf8');
assert.ok(!/AKfycb/.test(gs),'el .gs no lleva direcciones');
console.log('verify-obra-app OK');
