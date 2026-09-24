'use strict';
// Tercera tabla de códigos (CODIGOS-BOARDS.md, regla 3): la matriz de
// potenciales-yod/accesos.html vive en otro repo y se revisaba "a ojo".
// Se baja de GitHub (rama ACCESOS_REF, main por omisión) y se compara con
// SYSTEM_CODES: cada tablero ofrece su código principal, y nada más.
const assert=require('node:assert/strict');
require('./os/access-policy.js');
const sys=globalThis.YodAccessPolicy.systemCodes;
const ref=process.env.ACCESOS_REF||'main';
const url='https://raw.githubusercontent.com/yodesarrollomx/potenciales-yod/'+ref+'/accesos.html';
fetch(url).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.text();}).then(src=>{
  const m=/const CODES=(\[\[.*?\]\]);/.exec(src);
  assert.ok(m,'no se encontró CODES en accesos.html');
  const matriz=JSON.parse(m[1].replace(/'/g,'"')).map(c=>c[0]).filter(c=>c!=='*').sort();
  const esperado=Object.keys(sys).filter(k=>k!=='SYS-CONTROL').map(k=>sys[k][0]).sort();
  assert.deepEqual(matriz,esperado,'accesos.html y access-policy.js no dicen lo mismo');
  console.log('Matriz de accesos = SYSTEM_CODES ('+ref+'): passed');
}).catch(e=>{console.error(e.message);process.exit(1);});
