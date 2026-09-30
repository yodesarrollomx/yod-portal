'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'docs/arquitectura');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const label = s => String(s ?? '').replace(/["<>\[\]{}\\`]/g, '').replace(/\|/g, '¦').replace(/\r?\n/g, ' ');
const nodeId = s => 'n_' + String(s).replace(/[^A-Za-z0-9_]/g, '_');

function checkSchema(value, schema, at = '$') {
  if (schema.type) {
    const ok = schema.type === 'array' ? Array.isArray(value) : schema.type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : schema.type === 'integer' ? Number.isInteger(value) : typeof value === schema.type;
    if (!ok) throw new Error(at + ': tipo ' + schema.type + ' requerido');
  }
  if (schema.enum && !schema.enum.includes(value)) throw new Error(at + ': valor fuera del vocabulario');
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) throw new Error(at + ': texto vacío');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) throw new Error(at + ': formato inválido');
  }
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) throw new Error(at + ': lista vacía');
    if (schema.items) value.forEach((v, i) => checkSchema(v, schema.items, at + '[' + i + ']'));
  } else if (value && typeof value === 'object') {
    for (const key of schema.required || []) if (!(key in value)) throw new Error(at + ': falta ' + key);
    for (const [key, rule] of Object.entries(schema.properties || {})) if (key in value) checkSchema(value[key], rule, at + '.' + key);
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) if (!(key in (schema.properties || {}))) throw new Error(at + ': campo desconocido ' + key);
  }
}

function validate(model, schema) {
  checkSchema(model, schema);
  const sets = {};
  for (const list of ['components', 'connections', 'processes', 'proposals', 'changes']) {
    const ids = (model[list] || []).map(x => x.id);
    if (new Set(ids).size !== ids.length) throw new Error(list + ': identificadores duplicados');
    sets[list] = new Set(ids);
  }
  const repos = new Set(model.repositories.map(x => x.repo));
  if (repos.size !== model.repositories.length) throw new Error('Repositorios duplicados');
  const ownership = new Set();
  for (const rule of model.path_ownership || []) {
    if (!repos.has(rule.repo)) throw new Error('Propiedad: repositorio desconocido '+rule.repo);
    if (rule.prefix.startsWith('/') || rule.prefix.includes('\\') || rule.prefix.split('/').some(p=>p==='..'||p==='.')) throw new Error('Propiedad: prefijo inseguro');
    const key=rule.repo+'\n'+rule.prefix;
    if (ownership.has(key)) throw new Error('Propiedad: prefijo duplicado '+rule.prefix);
    ownership.add(key);
    if (!rule.components.length) throw new Error('Propiedad: componentes vacíos');
    for (const id of rule.components) if (!sets.components.has(id)) throw new Error('Propiedad: componente desconocido '+id);
  }
  if (new Set(model.components.map(c => nodeId(c.id))).size !== model.components.length) throw new Error('IDs colisionan al generar diagramas');
  function checkEvidence(item) {
    if (!item.evidence.length) throw new Error(item.id + ': falta evidencia');
    for (const e of item.evidence) {
      if (e.repo && !repos.has(e.repo)) throw new Error(item.id + ': repositorio de evidencia desconocido');
      if (e.path && (e.path.startsWith('/') || e.path.split('/').includes('..') || e.path.includes('\\'))) throw new Error(item.id + ': ruta insegura');
      if (e.lines && !/^\d+$/.test(e.lines)) throw new Error(item.id + ': línea de evidencia inválida');
    }
    if (item.status === 'codigo' && !item.evidence.some(e => e.status === 'codigo')) throw new Error(item.id + ': estado código sin evidencia de código');
    if (item.status === 'ejecucion' && !item.evidence.some(e => e.status === 'ejecucion')) throw new Error(item.id + ': ejecución sin evidencia');
  }
  for (const c of model.components) {
    if (c.repo && !repos.has(c.repo)) throw new Error(c.id + ': repositorio sin inventariar');
    checkEvidence(c);
  }
  for (const e of model.connections) {
    if (!sets.components.has(e.from) || !sets.components.has(e.to)) throw new Error(e.id + ': conexión huérfana');
    checkEvidence(e);
  }
  for (const p of model.processes) { checkEvidence(p); for (const s of p.steps) for (const id of s.components || []) if (!sets.components.has(id)) throw new Error(p.id + ': paso con componente desconocido ' + id); }
  for (const c of model.data_contracts || []) for (const id of c.components) if (!sets.components.has(id)) throw new Error(c.id + ': contrato con componente desconocido');
  for (const p of model.proposals) {
    for (const id of p.boards) if (!sets.components.has(id)) throw new Error(p.id + ': propuesta con componente desconocido ' + id);
    for (const id of p.dependencies) if (!sets.proposals.has(id)||id===p.id) throw new Error(p.id+': dependencia de propuesta inválida '+id);
  }
  for (const c of model.changes) for (const id of c.components) if (!sets.components.has(id)) throw new Error(c.id + ': cambio con componente desconocido ' + id);
  const serialized = JSON.stringify(model);
  const forbidden = [/AKfy[A-Za-z0-9_-]{15,}/, /AIza[A-Za-z0-9_-]{20,}/, /gh[pousr]_[A-Za-z0-9_]{15,}/, /github_pat_[A-Za-z0-9_]+/, /-----BEGIN [^-]*PRIVATE KEY-----/, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, /docs\.google\.com\/spreadsheets\/d\//, /(?:token|clave|password|secret)=[^\s&"<>]{5,}/i];
  if (forbidden.some(re => re.test(serialized))) throw new Error('El modelo público contiene identificadores de acceso, datos privados o secretos; usar referencias lógicas');
  return true;
}

function evidenceText(items, model) {
  return items.map(e => {
    const r = model.repositories.find(r => r.repo === e.repo);
    if (e.repo && e.path && r && r.visibility === 'public') {
      const url = 'https://github.com/' + e.repo + '/blob/' + r.commit + '/' + e.path.split('/').map(encodeURIComponent).join('/') + (e.lines ? '#L' + String(e.lines).split(/[-–:]/)[0] : '');
      return '[' + cell(e.repo.split('/')[1] + '/' + e.path) + '](' + url + ') — ' + cell(e.claim);
    }
    return cell(e.claim || 'Evidencia restringida; ver registro interno');
  }).join('; ');
}

function diagram(model, components, edges) {
  const lines = ['flowchart LR'];
  for (const c of components) lines.push('  ' + nodeId(c.id) + '["' + label(c.nombre) + '"]');
  for (const e of edges) lines.push('  ' + nodeId(e.from) + (['pendiente','propuesto','declarado'].includes(e.status) || e.kind === 'manual' ? ' -.->|' : ' -->|') + label(e.label) + '| ' + nodeId(e.to));
  lines.push('  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;');
  for (const c of components.filter(x => x.status === 'pendiente' || x.status === 'declarado')) lines.push('  class ' + nodeId(c.id) + ' pendiente;');
  return '```mermaid\n' + lines.join('\n') + '\n```';
}

function render(model) {
  const intro = '> Generado desde modelo.json. No editar a mano. Revisión ' + model.revision + ' · ' + model.checked_at + '.\n\n';
  let maps = '# Conexiones de YOD OS\n\n' + intro + 'Línea continua: conexión observada en código o ejecución. Discontinua: manual, declarada, propuesta o pendiente. Una conexión observada en código no acredita el despliegue.\n\n';
  const domains = [...new Set(model.components.map(c => c.dominio))];
  for (const domain of domains) {
    const center = new Set(model.components.filter(c => c.dominio === domain).map(c => c.id));
    const edges = model.connections.filter(e => center.has(e.from) || center.has(e.to));
    const ids = new Set([...center, ...edges.flatMap(e => [e.from, e.to])]);
    maps += '## ' + domain + '\n\n' + diagram(model, model.components.filter(c => ids.has(c.id)), edges) + '\n\n';
  }
  maps += '## Contratos y evidencia de cada conexión\n\n| ID | Origen → destino | Mecanismo y datos | Estado | Evidencia |\n|---|---|---|---|---|\n';
  for (const e of model.connections) maps += '| ' + e.id + ' | ' + e.from + ' → ' + e.to + ' | ' + cell(e.kind + ': ' + e.label + (e.contract ? '. ' + e.contract : '')) + ' | ' + e.status + ' | ' + evidenceText(e.evidence, model) + ' |\n';
  let cards = '# Fichas de los componentes\n\n' + intro;
  for (const c of model.components) {
    cards += '## ' + c.id + ' · ' + c.nombre + '\n\n' + c.proposito + '\n\n';
    cards += '- Tipo: ' + c.tipo + '. Dominio: ' + c.dominio + '. Responsable: ' + c.owner_role + '.\n- Evidencia: ' + c.status + '. Producción: ' + c.runtime_status + '.\n- Entidades: ' + c.data_entities.join(', ') + '.\n- Fuente de verdad: ' + (c.source_of_truth || 'Ver relaciones de persistencia; confirmar deployment y esquema') + '.\n- Evidencia: ' + evidenceText(c.evidence, model) + '.\n';
    const rel = model.connections.filter(e => e.from === c.id || e.to === c.id);
    cards += '- Conexiones: ' + (rel.map(e => e.id + ' (' + e.from + ' → ' + e.to + ')').join('; ') || 'Ninguna integración comprobada') + '.\n';
    cards += '- Mejoras: ' + (model.proposals.filter(p => p.boards.includes(c.id)).map(p => p.id + ' · ' + p.titulo).join('; ') || 'Conservar y verificar alcance antes de ampliar') + '.\n';
    if (c.risks_sanitized.length) cards += '- Pendientes: ' + c.risks_sanitized.join('; ') + '.\n';
    cards += '\n';
  }
  let processes = '# Procesos y decisiones\n\n' + intro;
  for (const p of model.processes) {
    processes += '## ' + p.id + ' · ' + p.nombre + '\n\nEstado: ' + p.status + '.\n\n```mermaid\nflowchart TD\n';
    p.steps.forEach((s, i) => { processes += '  p' + i + '["' + label(s.label + ' · ' + s.role) + '"]\n'; if (i) processes += '  p' + (i - 1) + (s.mode === 'pendiente' || s.mode === 'manual' ? ' -.-> ' : ' --> ') + 'p' + i + '\n'; });
    processes += '```\n\n| Paso | Responsable | Componentes | Entrada → salida | Ejecución |\n|---|---|---|---|---|\n';
    p.steps.forEach((s, i) => { processes += '| ' + (i + 1) + '. ' + cell(s.label) + ' | ' + cell(s.role) + ' | ' + s.components.join(', ') + ' | ' + cell(s.input + ' → ' + s.output) + ' | ' + s.mode + ' |\n'; });
    processes += '\nVacíos: ' + (p.manual_gaps.join('; ') || 'Sin vacíos adicionales identificados en esta revisión') + '.\n\nEvidencia: ' + evidenceText(p.evidence, model) + '.\n\n';
  }
  let proposals = '# Propuestas para decidir\n\n' + intro + 'Prioridad: vender más → margen y control → cobrar antes. Son hipótesis de mejora: no se activan por aparecer en este archivo. Responde por ID: «A sí», «B con estos cambios», «C no».\n\n';
  for (const p of model.proposals) {
    proposals += '## ' + p.id + ' · ' + p.titulo + '\n\n- Tableros: ' + p.boards.join(', ') + '.\n- Problema: ' + p.problem + '\n- Beneficio esperado: ' + p.benefit + '\n- Medición: ' + p.metric + '\n- Dependencias: ' + (p.dependencies.join('; ') || 'Sin dependencias previas') + '.\n- Esfuerzo: ' + p.effort + '. Decisión: **' + p.decision + '**.\n\n';
    for (const [key,title] of [['prerequisites','Requisitos previos'],['tasks','Tareas'],['acceptance','Criterios de aceptación']]) {
      if(p[key]&&p[key].length) proposals += '### '+title+'\n\n'+p[key].map((x,i)=>key==='tasks'?(i+1)+'. '+cell(x):'- '+cell(x)).join('\n')+'\n\n';
    }
  }
  const html = fs.readFileSync(path.join(__dirname, 'templates/arquitectura.html'), 'utf8').replace('/*__MODEL__*/null', JSON.stringify(model).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'));
  let contracts = '# Contratos de datos e identidad\n\n' + intro + 'Estos contratos no contienen registros reales. Su alcance de evidencia se indica individualmente.\n\n';
  for (const c of model.data_contracts || []) contracts += '## ' + c.id + '\n\n- Componentes: ' + c.components.join(', ') + '.\n- Evidencia: ' + c.source + '.\n- Entrada/campos: ' + c.input.map(x=>'`'+x+'`').join(', ') + '.\n- Salida: ' + c.output.join(', ') + '.\n\n' + c.invariants.map(x=>'- '+x).join('\n') + '\n\n';
  return Object.fromEntries(Object.entries({'mapas.md':maps, 'fichas.md':cards, 'procesos.md':processes, 'propuestas.md':proposals, 'contratos.md':contracts, 'index.html':html}).map(([name, content]) => [name, content.replace(/\n+$/, '') + '\n']));
}

function main() {
  const model = JSON.parse(fs.readFileSync(path.join(DIR, 'modelo.json'), 'utf8'));
  const schema = JSON.parse(fs.readFileSync(path.join(DIR, 'modelo.schema.json'), 'utf8'));
  validate(model, schema);
  if (!process.argv.includes('--validate')) for (const [name, content] of Object.entries(render(model))) {
    const file = path.join(DIR, name);
    if (process.argv.includes('--check')) { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) throw new Error(name + ' desactualizado: ejecutar node scripts/arquitectura.cjs'); }
    else fs.writeFileSync(file, content);
  }
  console.log('Arquitectura: ' + model.components.length + ' componentes, ' + model.connections.length + ' conexiones, ' + model.processes.length + ' procesos; modelo válido' + (process.argv.includes('--check') ? ' y vistas sincronizadas' : ''));
}
if (require.main === module) { try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; } }
module.exports = {validate, checkSchema, render, diagram, esc};
