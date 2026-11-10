'use strict';
/* YOD OS dice cuántas publicaciones hay listas para lanzar. El número lo deja la Sala de Edición en el
   almacenamiento del navegador (mismo origen); aquí se comprueba que YOD OS sólo lo lee, lo valida y,
   ante cualquier duda, muestra el texto fijo. Datos sintéticos; sin red. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=fs.readFileSync(path.join(__dirname,'..','os','app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','os','index.html'),'utf8');
const AHORA=Date.UTC(2026,10,10,2,0,0), DIA=24*60*60*1000;
function cabina(guardado){
  const block=app.match(/  \/\* SALA-LISTAS-BEGIN \*\/[\s\S]*?\/\* SALA-LISTAS-END \*\//);
  assert.ok(block,'bloque de lectura marcado');
  const lecturas=[],escrituras=[];
  const ctx=vm.createContext({JSON,Number,Array,
    Date:{now:()=>AHORA},
    localStorage:{getItem:k=>{lecturas.push(k);if(guardado instanceof Error)throw guardado;return guardado===undefined?null:guardado;},
      setItem:(k,v)=>escrituras.push([k,v]),removeItem:k=>escrituras.push([k])}});
  vm.runInContext(block[0]+'\nthis.salaListas=salaListas;this.texto=textoSalaListas;',ctx);
  return {ctx,lecturas,escrituras};
}
const dato=(listas,haceMs=0,extra={})=>JSON.stringify({listas,cuando:AHORA-haceMs,...extra});

test('con el número que dejó la Sala, YOD OS dice cuántas hay listas',()=>{
  for(const [n,esperado] of [[24,'24 listas para lanzar'],[1,'1 lista para lanzar'],[0,'Nada listo todavía'],[999,'999 listas para lanzar']]){
    const c=cabina(dato(n,5*60*1000));
    assert.equal(c.ctx.texto('Texto fijo'),esperado);
    assert.deepEqual(JSON.parse(JSON.stringify(c.ctx.salaListas())),{listas:n,cuando:AHORA-5*60*1000});
    assert.deepEqual(c.lecturas.filter((k,i,a)=>a.indexOf(k)===i),['sala_resumen_v1'],'sólo lee su llave');
    assert.deepEqual(c.escrituras,[],'YOD OS no escribe ni borra al leer');
  }
});

test('sin dato, con dato roto, viejo o del futuro se muestra el texto fijo',()=>{
  const malos=[undefined,'','null','[]','"24"','{"listas":24}','{"cuando":1}','{no es json',
    dato(-1),dato(1000),dato(2.5),dato('24'),dato(null),dato(NaN),dato(true),
    dato(24,7*DIA+1),dato(24,-61*1000),JSON.stringify({listas:24,cuando:'ayer'}),JSON.stringify({listas:24,cuando:null}),
    JSON.stringify([{listas:24,cuando:AHORA}]),new Error('almacenamiento bloqueado')];
  for(const m of malos){
    const c=cabina(m);
    assert.equal(c.ctx.salaListas(),null,String(m));
    assert.equal(c.ctx.texto('Texto fijo'),'Texto fijo',String(m));
  }
  assert.equal(cabina(dato(24,7*DIA-1000)).ctx.texto('x'),'24 listas para lanzar','hasta siete días sí vale');
  assert.equal(cabina(dato(24,-30*1000)).ctx.texto('x'),'24 listas para lanzar','un reloj medio minuto adelantado no lo invalida');
  // lo demás que la Sala pudiera dejar en la llave no viaja a la pantalla
  assert.deepEqual(Object.keys(cabina(dato(3,0,{titulos:['secreto'],clave:'k'})).ctx.salaListas()).sort(),['cuando','listas']);
});

test('las tarjetas y la puerta llevan al montón, y el número sólo se pinta con sesión validada',()=>{
  assert.match(app,/tSala\('send','Publicaciones','Tu montón listo para lanzar'\)/,'tarjeta de Dirección');
  assert.match(app,/tSala\('movie','Sala de Edición','Lo que se produce hoy'\)/,'tarjeta de Sayri');
  assert.match(app,/function tSala\(ic,h,fijo\)\{return '<a class="mi-card" href="#\/embudo\/sala">/);
  assert.match(html,/<a class="emb-card destacada" href="#\/embudo\/sala">[\s\S]{0,260}<p class="emb-s" data-sala-listas="Tu montón listo para lanzar y lo que espera tu palabra">Tu montón listo para lanzar y lo que espera tu palabra<\/p>/);
  const pintar=app.match(/function pintarSalaListas\(\)\{[\s\S]*?\n  \}/);assert.ok(pintar);
  assert.match(pintar[0],/el\.textContent=state\.profileReady\?textoSalaListas\(fijo\):fijo/,'sin sesión, texto fijo');
  assert.match(pintar[0],/var r=state\.profileReady\?salaListas\(\):null;/);
  assert.match(pintar[0],/el\.title=r\?'Lo que la Sala vio en este aparato '\+edadTexto\(Date\.now\(\)-r\.cuando\):'';/,'dice de cuándo es el número');
  assert.doesNotMatch(pintar[0],/innerHTML/,'el número entra como texto, nunca como HTML');
  assert.match(app,/function bloquearSesion\(validando\)\{\s*purgarDatosSensibles\(\);state\.profileReady=false;[^\n]*\n\s*document\.querySelectorAll\('\[data-sala-listas\]'\)\.forEach\(function\(el\)\{el\.textContent=el\.getAttribute\('data-sala-listas'\);\}\);/,'al bloquear la sesión vuelve el texto fijo');
  assert.match(app,/function pintarMiInicio\(data,persona\)\{\s*pintarSalaListas\(\);/,'al validar la sesión se pinta el número');
  assert.match(app,/window\.addEventListener\('storage',function\(e\)\{if\(e\.key===SALA_RESUMEN\|\|e\.key===null\)pintarSalaListas\(\);\}\);/,'se actualiza cuando la Sala cambia su número');
});

test('la lectura no toca la red ni las llaves, y cerrar sesión borra lo que la Sala guarda de su montón',()=>{
  const block=app.match(/  \/\* SALA-LISTAS-BEGIN \*\/[\s\S]*?\/\* SALA-LISTAS-END \*\//)[0];
  assert.doesNotMatch(block,/fetch\(|XMLHttpRequest|sendBeacon|TOKEN_KEY|pyod_clave|sala_clave|setItem|removeItem/);
  const llaves=app.match(/var LLAVES_SALA=\[([^\]]+)\]/);assert.ok(llaves);
  for(const k of ['sala_clave','sala_gas','sala_rol','sala_resumen_v1','sala_salida_local_v1','sala_salida_plan_v1'])assert.ok(llaves[1].includes("'"+k+"'"),k);
  assert.match(app,/function cerrarSesion\(\)\{[^\n]*LLAVES_SALA\.forEach\(function\(k\)\{localStorage\.removeItem\(k\);\}\)/);
});
