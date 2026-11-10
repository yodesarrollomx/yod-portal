'use strict';
/* Barrido de uso real de YOD OS (10-nov-2026, CHG-OS-BARRIDO-20261110). Cada prueba fija una falla
   vista en el navegador de Dirección para que no regrese. Sólo lectura de archivos; sin red. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const leer=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('Codesarrollos: espera 30 s, reintenta una vez y ya no dice «ningún destino habilitado»',()=>{
  const html=leer('track-codesarrollos.html');
  assert.doesNotMatch(html,/controller\.abort\(\),8000\)/,'el plazo de 8 s cortaba al Control Maestro (tarda 5–24 s)');
  assert.match(html,/PLAZO_MS=30000/);
  assert.match(html,/INTENTOS=2/);
  assert.doesNotMatch(html,/ningún destino habilitado/,'el mensaje era falso: sí había destinos, sólo tardaba');
  assert.match(html,/className='reintentar'/,'botón para volver a pedir');
  assert.match(html,/if\(!pintado\)\{pintado=true;inicia\(/,'el mapa se crea una sola vez aunque se reintente');
  assert.match(html,/data\.ok===false\)\{src\.textContent='Codesarrollos no aceptó la sesión/,'un rechazo de sesión no se reintenta');
});

test('Codesarrollos: el mapa usa teselas de OpenStreetMap (CARTO ahora pide API key)',()=>{
  const html=leer('track-codesarrollos.html');
  assert.doesNotMatch(html,/basemaps\.cartocdn\.com/,'CARTO tapizaba el mapa con «API KEY REQUIRED»');
  assert.match(html,/L\.tileLayer\('https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png'/);
});

test('Obra en vivo abre con el marco de YOD OS (menú y «Atrás»), sin tocar la app del cliente',()=>{
  const html=leer('obra.html');
  const shell=html.indexOf('<script src="os/shell.js?v=');
  assert.ok(shell>0,'obra.html carga os/shell.js');
  assert.ok(shell>html.indexOf('YODChinche.init({pantalla:"obra"'),'después de su chinche: el marco no la carga dos veces');
  assert.ok(html.indexOf('</body>')>shell);
  assert.match(html,/<link rel="stylesheet" href="os\/shell\.css\?v=/);
  assert.match(html,/body\.yod-on \.yod-canvas\{background:var\(--ground\);color:var\(--ink\)\}/,'dentro del marco conserva su fondo oscuro y tinta clara');
  const app=leer('obra-app/index.html');
  assert.doesNotMatch(app,/shell\.js/,'el cliente nunca ve YOD OS');
});

test('El Despacho: en «Ver todo» la tarjeta «Tu despacho» ya no queda bajo la barra de autones',()=>{
  const css=leer('despacho3d/office-entry.css');
  assert.match(css,/@media\(min-width:701px\)\{body:has\(#resident-dock:not\(\[hidden\]\)\) #office-entry\{top:104px;bottom:auto\}\}/);
  const html=leer('despacho3d/index.html');
  assert.match(html,/office-entry\.css\?v=127/,'nueva etiqueta para que el navegador no sirva la hoja vieja');
});

test('Personas y accesos se ilumina en el menú (antes se iluminaba PPP)',()=>{
  const js=leer('os/shell.js');
  assert.match(js,/var enAccesos = \/\\\/potenciales-yod\\\/accesos\\\.html\$\/\.test\(location\.pathname\);/);
  assert.match(js,/var n = navItem\(r, navCur\);/,'en Accesos ningún tablero del catálogo queda activo');
  assert.match(js,/'yod-nav-item' \+ \(enAccesos \? ' active' : ''\)/);
  assert.match(js,/if \(enAccesos\) set\('yodCrumbHere', 'Personas y accesos'\);/);
  assert.match(js,/var cur = currentSys\(\);if \(!cur\) return;/,'el candado sigue usando el tablero real (PPP)');
});
