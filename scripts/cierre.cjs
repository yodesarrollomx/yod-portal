'use strict';
// Cierre de YOD OS: cuenta, desde el modelo del atlas, qué está propuesto, hecho sin
// publicar, publicado y verificado, y reescribe el bloque generado de docs/CIERRE.md.
//   node scripts/cierre.cjs            reescribe el bloque
//   node scripts/cierre.cjs --ver      sólo lo imprime
// No llama a ningún backend: lee docs/arquitectura/modelo.json y nada más.
const fs = require('node:fs');
const path = require('node:path');

const INICIO = '<!-- cierre:inicio (generado por scripts/cierre.cjs; no editar a mano) -->';
const FIN = '<!-- cierre:fin -->';
const TOPE = 3; // cambios hechos sin publicar que admite un componente antes de frenar lo nuevo
const ESTADOS = ['propuesto', 'implementado_local', 'pendiente_acceso', 'publicado', 'verificado'];
const NOMBRE = {
  propuesto: 'Propuesto (sin hacer)',
  implementado_local: 'Hecho, sin acreditar publicación',
  pendiente_acceso: 'Detenido por acceso',
  publicado: 'Publicado',
  verificado: 'Verificado en producción',
};

function resumen(model) {
  const cambios = model.changes || [];
  const porEstado = Object.fromEntries(ESTADOS.map(e => [e, 0]));
  for (const c of cambios) porEstado[c.status] = (porEstado[c.status] || 0) + 1;

  const abiertos = cambios.filter(c => c.status === 'implementado_local');
  const porComponente = new Map();
  for (const c of abiertos) for (const id of c.components || []) {
    if (!porComponente.has(id)) porComponente.set(id, []);
    porComponente.get(id).push(c.id);
  }
  const sobreTope = [...porComponente].filter(([, ids]) => ids.length > TOPE)
    .map(([id, ids]) => ({ id, abiertos: ids.length }))
    .sort((a, b) => b.abiertos - a.abiertos || a.id.localeCompare(b.id));

  const conexiones = model.connections || [];
  const decisiones = (model.proposals || []).filter(p => p.decision === 'pendiente')
    .map(p => ({ id: p.id, titulo: p.titulo, esfuerzo: p.effort, depende: p.dependencies || [] }));

  return {
    revision: model.revision,
    total: cambios.length,
    porEstado,
    abiertos: abiertos.map(c => c.id),
    sobreTope,
    conexiones: { total: conexiones.length, verificadas: conexiones.filter(c => c.runtime_verified === true).length },
    decisiones,
  };
}

function bloque(r) {
  const l = [INICIO, '', `Foto de la revisión \`${r.revision}\` del modelo. Para refrescarla: \`node scripts/cierre.cjs\`.`, ''];
  l.push('| Estado de los cambios registrados | Cuántos |', '|---|---|');
  for (const e of ESTADOS) if (r.porEstado[e]) l.push(`| ${NOMBRE[e]} | ${r.porEstado[e]} |`);
  l.push(`| **Total** | **${r.total}** |`, '');
  l.push(`Conexiones comprobadas en ejecución: **${r.conexiones.verificadas} de ${r.conexiones.total}**.`, '');
  l.push(`### Componentes sobre el tope (más de ${TOPE} cambios hechos sin acreditar publicación)`, '');
  if (!r.sobreTope.length) l.push('Ninguno.', '');
  else {
    l.push('| Componente | Hechos sin publicar |', '|---|---|');
    for (const c of r.sobreTope) l.push(`| \`${c.id}\` | ${c.abiertos} |`);
    l.push('');
  }
  l.push('### Decisiones de negocio que esperan respuesta', '');
  if (!r.decisiones.length) l.push('Ninguna.', '');
  else {
    l.push('| Letra | Propuesta | Esfuerzo | Depende de |', '|---|---|---|---|');
    for (const d of r.decisiones) l.push(`| ${d.id} | ${d.titulo} | ${d.esfuerzo} | ${d.depende.length ? d.depende.join(', ') : '—'} |`);
    l.push('');
  }
  l.push(`### Los ${r.abiertos.length} cambios hechos sin acreditar publicación`, '');
  l.push(r.abiertos.length ? r.abiertos.map(id => '`' + id + '`').join(' · ') : 'Ninguno.', '', FIN);
  return l.join('\n');
}

function aplicar(texto, nuevo) {
  const a = texto.indexOf(INICIO), b = texto.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('docs/CIERRE.md no tiene el bloque generado (marcas cierre:inicio / cierre:fin)');
  return texto.slice(0, a) + nuevo + texto.slice(b + FIN.length);
}

function main() {
  const root = path.resolve(__dirname, '..');
  const model = JSON.parse(fs.readFileSync(path.join(root, 'docs/arquitectura/modelo.json'), 'utf8'));
  const nuevo = bloque(resumen(model));
  if (process.argv.includes('--ver')) { console.log(nuevo); return; }
  const archivo = path.join(root, 'docs/CIERRE.md');
  const antes = fs.readFileSync(archivo, 'utf8');
  const despues = aplicar(antes, nuevo);
  if (despues !== antes) fs.writeFileSync(archivo, despues);
  console.log('Cierre: bloque ' + (despues === antes ? 'sin cambios' : 'actualizado') + ' para la revisión ' + model.revision);
}

if (require.main === module) { try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; } }
module.exports = { resumen, bloque, aplicar, TOPE, INICIO, FIN };
