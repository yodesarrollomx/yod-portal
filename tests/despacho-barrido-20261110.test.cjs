'use strict';
/* Recorrido del Despacho (10-nov-2026, CHG-DESPACHO-RUTA-20261110). Cada prueba fija un conflicto visto
   en el navegador de Dirección. Sólo lectura de archivos; sin red. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('Equipo no se monta mientras su bitácora no tenga adaptador (readTeam contesta «unavailable»)',()=>{
  const app=leer('os/app.js');
  assert.match(app,/var EQUIPO_CONECTADO=false;/);
  assert.match(app,/if\(EQUIPO_CONECTADO&&window\.YodDespachoEquipoHost&&window\.YODCaseTransport&&\$\('despachoEquipo'\)\)\{/);
  assert.match(leer('os/index.html'),/<div id="despachoEquipo">/,'el contenedor sigue: el puesto del autón lo oculta y lo restaura');
});

test('Equipo: si la lectura falla ya no dice «Conservamos tu texto» ni se queda en «Consultando…»',()=>{
  const src=leer('despacho3d/equipo.mjs');
  assert.match(src,/function errorMessage\(error,during\)\{/);
  assert.match(src,/catch\(error\)\{errorMessage\(error,'read'\);\}/);
  assert.match(src,/if\(!snapshot\)freshness\.textContent='Sin lectura de la bitácora';/);
});

test('Entorno: la «×» queda fija al hacer scroll y las demos sintéticas no se ven en la vista de Dirección',()=>{
  const css=leer('despacho3d/entorno.css');
  assert.match(css,/\.entorno-cerrar\{position:fixed;z-index:61;/);
  assert.match(css,/\.entorno-hoja p:has\(> a\[href="actividad-demo\.html"\]\),\.entorno-hoja p:has\(> a\[href="permisos-demo\.html"\]\)\{display:none\}/);
  assert.match(leer('despacho3d/index.html'),/entorno\.css\?v=4"/);
});

test('Plano y estado: la barra de autones no queda encima del plano',()=>{
  assert.match(leer('despacho3d/office-accessible.css'),/body:has\(#office-accessible:not\(\[hidden\]\)\) #resident-dock\{display:none\}/);
  assert.match(leer('despacho3d/index.html'),/office-accessible\.css\?v=133"/);
});

test('Mesa de trabajo: Sala y Embudo se abren dentro de YOD OS y MOAC en la misma pestaña',()=>{
  const html=leer('despacho3d/sala.html');
  assert.doesNotMatch(html,/target="_blank"/,'ninguna pestaña nueva');
  assert.equal((html.match(/href="https:\/\/yodesarrollomx\.github\.io\/yod-portal\/os\/#\/embudo\/sala" target="_top"/g)||[]).length,2);
  assert.match(html,/href="https:\/\/yodesarrollomx\.github\.io\/yod-portal\/os\/#\/embudo\/metricas" target="_top"/);
  assert.match(html,/href="https:\/\/yodesarrollomx\.github\.io\/board-aurum\/" target="_top"/);
});

test('En el Despacho los botones flotantes del OS ya no tapan «Ayuda», «Cancelar señalamiento» ni la barra',()=>{
  const css=leer('os/styles.css');
  assert.match(css,/body\[data-workspace-route="despacho"\] #temaBtn,body\[data-workspace-route="despacho"\] #engraneBtn\{display:none!important\}/);
  assert.match(css,/body\[data-workspace-route="despacho"\] \.chn-pastilla\{bottom:calc\(196px \+ env\(safe-area-inset-bottom,0px\)\)!important\}/);
});

test('La Bandeja anterior sigue a un clic, con nombre claro',()=>{
  assert.match(leer('os/index.html'),/id="despachoBandeja" href="https:\/\/yodesarrollomx\.github\.io\/yod-despacho\/"[^>]*>.*Bandeja anterior y Corcho<\/a>/);
});
