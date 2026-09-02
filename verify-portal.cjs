'use strict';
const assert=require('node:assert/strict');
const core=require('./portal-core.js');
const base={visible:'SI',system_id:'SYS-POTENCIALES',orden:1,titulo_portal:'Prueba',descripcion_portal:'Descripción',audiencia:'Equipo',icono:'route',miniatura:'thumbs/track.svg',url:'https://alexpueblag.github.io/potenciales-yod/'};
for(const estado of ['Mantenimiento','Revisión','',null,'Desconocido']){
  const row={...base,estado};
  assert.equal(core.enabled(row),false,estado||'vacío');
  assert.equal((core.card(row).match(/<a\b/g)||[]).length,0,estado||'vacío');
}
const active={...base,estado:'Activo'};
assert.equal(core.enabled(active),true);
assert.equal((core.card(active).match(/<a\b/g)||[]).length,1);
assert.equal(core.safeUrl('javascript:alert(1)','SYS-TEST'),'');
assert.equal(core.safeUrl('https://evil.example/path','SYS-TEST'),'');
assert.equal(core.safeUrl('https://alexpueblag.github.io/prueba/','SYS-TEST'),'');
const badActive={...active,url:'https://evil.example/path'};
assert.equal(core.enabled(badActive),false);
assert.match(core.badge(badActive).text,/inválida/);
assert.equal(core.safeTrackUrl('javascript:alert(1)','PRJ-RM'),'');
// Durante la mudanza las DOS casas deben resolver: la vieja porque el cascaron
// sigue trayendo gente por ahi, la nueva porque es donde vive el tablero.
assert.equal(core.safeTrackUrl('https://alexpueblag.github.io/real-miramar-board/','PRJ-RM'),'https://alexpueblag.github.io/real-miramar-board/');
assert.equal(core.safeTrackUrl('https://yodesarrollomx.github.io/real-miramar-board/','PRJ-RM'),'https://yodesarrollomx.github.io/real-miramar-board/');
assert.equal(core.safeUrl('https://alexpueblag.github.io/potenciales-yod/','SYS-POTENCIALES'),'https://alexpueblag.github.io/potenciales-yod/');
assert.equal(core.safeUrl('https://yodesarrollomx.github.io/potenciales-yod/','SYS-POTENCIALES'),'https://yodesarrollomx.github.io/potenciales-yod/');
// y el allowlist sigue cerrado para todo lo demas
assert.equal(core.safeUrl('https://yodesarrollomx.github.io/otro-tablero/','SYS-POTENCIALES'),'');
assert.equal(core.cleanRows([{...base,visible:'NO'},active]).length,1);
console.log('Portal coherence and URL policy: passed');
