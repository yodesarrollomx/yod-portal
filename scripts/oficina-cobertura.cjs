'use strict';

// Cobertura documental: no concede permisos, consulta servicios ni modifica el modelo.
const text = value => value == null ? '' : String(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const utcDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
const list = value => Array.isArray(value) ? value : [];
const h = value => text(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md = value => text(value).replace(/\r?\n/g, ' ').replace(/[\\[\]*_#|]/g, '\\$&').split(String.fromCharCode(96)).join('\\' + String.fromCharCode(96)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
const normalized = (symbols, id) => symbols.get(id);
const object = value => value && typeof value === 'object' && !Array.isArray(value);

function collectSymbols(model, errors) {
  const symbols = new Map();
  const components = list(model && model.components);
  for (const c of components) {
    if (!object(c) || !nonempty(c.id)) { errors.push('Componente sin ID válido.'); continue; }
    if (symbols.has(c.id)) errors.push('ID de componente repetido: ' + c.id);
    else symbols.set(c.id, c.id);
  }
  for (const c of components) {
    if (!object(c) || !nonempty(c.id)) continue;
    if (c.aliases !== undefined && !Array.isArray(c.aliases)) {
      errors.push('Aliases inválidos: ' + c.id); continue;
    }
    for (const alias of list(c.aliases)) {
      if (!nonempty(alias)) { errors.push('Alias vacío: ' + c.id); continue; }
      if (symbols.has(alias)) errors.push('Alias en colisión o repetido: ' + alias);
      else symbols.set(alias, c.id);
    }
  }
  return symbols;
}

function validateOfficeCoverage(model) {
  const errors = [];
  if (!object(model) || !Array.isArray(model.components)) return ['Modelo sin componentes.'];
  const symbols = collectSymbols(model, errors);
  const cover = model.office_coverage;
  if (!object(cover)) return errors.concat('Falta office_coverage.');
  if (!utcDate(cover.observed_at)) errors.push('office_coverage.observed_at debe ser una fecha UTC ISO.');
  if (!nonempty(cover.scope)) errors.push('Falta el alcance de office_coverage.');
  if (!nonempty(cover.verification_owner)) errors.push('Falta el encargado de verificación.');
  const catalog = cover.catalog_snapshot;
  if (!object(catalog)) errors.push('Falta catalog_snapshot.');
  else if (!utcDate(catalog.observed_at)) errors.push('catalog_snapshot.observed_at debe ser una fecha UTC ISO.');

  function ids(values, label) {
    const result = new Set();
    if (!Array.isArray(values) || values.length === 0) {
      errors.push(label + ' debe contener IDs.'); return result;
    }
    for (const value of values) {
      const canonical = normalized(symbols, value);
      if (!canonical) { errors.push(label + ': ID desconocido ' + text(value)); continue; }
      if (!canonical.startsWith('SYS-')) errors.push(label + ': no es un sistema ' + text(value));
      if (result.has(canonical)) errors.push(label + ': ID normalizado repetido ' + text(value));
      result.add(canonical);
    }
    return result;
  }
  const canonical = ids(catalog && catalog.canonical_ids, 'Catálogo operativo');
  const technical = ids(catalog && catalog.technical_ids, 'Catálogo técnico');
  for (const id of technical) if (!canonical.has(id)) errors.push('Sistema técnico ausente del catálogo operativo: ' + id);

  const surfaceKeys = new Set();
  if (!Array.isArray(cover.surfaces) || cover.surfaces.length === 0) errors.push('Faltan superficies.');
  for (const surface of list(cover.surfaces)) {
    if (!object(surface)) { errors.push('Superficie inválida.'); continue; }
    const component = normalized(symbols, surface.component);
    if (!component) errors.push('Superficie con componente desconocido: ' + text(surface.component));
    if (!nonempty(surface.entry)) errors.push('Superficie sin entrada: ' + text(surface.component));
    if (!nonempty(surface.description)) errors.push('Superficie sin descripción: ' + text(surface.component));
    const key = component + '\n' + text(surface.entry);
    if (surfaceKeys.has(key)) errors.push('Superficie repetida: ' + text(surface.component) + ' / ' + text(surface.entry));
    surfaceKeys.add(key);
  }

  const areaIds = new Set();
  const assignments = new Map();
  if (!Array.isArray(cover.areas) || cover.areas.length === 0) errors.push('Faltan áreas.');
  for (const area of list(cover.areas)) {
    if (!object(area)) { errors.push('Área inválida.'); continue; }
    if (!nonempty(area.id) || !/^[a-z][a-z0-9-]*$/.test(area.id)) errors.push('ID de área inválido: ' + text(area.id));
    if (areaIds.has(area.id)) errors.push('Área repetida: ' + text(area.id));
    areaIds.add(area.id);
    if (!nonempty(area.nombre)) errors.push('Área sin nombre: ' + text(area.id));
    if (!nonempty(area.place) || !/^[a-z][a-z0-9-]*$/.test(area.place)) errors.push('Lugar inválido: ' + text(area.id));
    if (area.placement !== 'propuesto') errors.push('La ubicación debe conservar placement propuesto: ' + text(area.id));
    if (!Array.isArray(area.components) || area.components.length === 0) errors.push('Área sin componentes: ' + text(area.id));
    for (const rawId of list(area.components)) {
      const id = normalized(symbols, rawId);
      if (!id) { errors.push('Componente desconocido en área ' + text(area.id) + ': ' + text(rawId)); continue; }
      if (assignments.has(id)) errors.push('Componente asignado más de una vez: ' + id);
      else assignments.set(id, area.id);
    }
  }
  for (const c of model.components) if (object(c) && nonempty(c.id) && !assignments.has(c.id)) errors.push('Componente sin área: ' + c.id);
  // Se leen estados y conexiones originales, sin crear permisos ni estados operativos.
  return errors;
}

function evidenceUrl(evidence) {
  if (!object(evidence)) return null;
  const sha = [evidence.commit, evidence.source_revision].find(v => typeof v === 'string' && /^[a-f0-9]{40}$/i.test(v));
  if (!sha || typeof evidence.repo !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(evidence.repo)) return null;
  const base = 'https://github.com/' + evidence.repo;
  if (!evidence.path) return base + '/commit/' + sha;
  if (typeof evidence.path !== 'string' || evidence.path.startsWith('/') || evidence.path.includes('\\') || evidence.path.split('/').some(p => !p || p === '.' || p === '..')) return null;
  const line = text(evidence.lines).match(/^\s*(\d+)/);
  return base + '/blob/' + sha + '/' + evidence.path.split('/').map(encodeURIComponent).join('/') + (line && Number(line[1]) > 0 ? '#L' + line[1] : '');
}

function evidenceLabel(e) {
  return [e.claim || 'Referencia registrada', e.status ? 'Estado: ' + e.status : '', e.repo, e.path,
    e.commit || e.source_revision ? 'Revisión: ' + (e.commit || e.source_revision) : 'Sin revisión inmutable en esta referencia'].filter(Boolean).join(' · ');
}

function prepare(model) {
  const errors = validateOfficeCoverage(model);
  if (errors.length) throw new Error('Cobertura de oficina inválida:\n' + errors.join('\n'));
  const symbols = collectSymbols(model, []);
  const byId = new Map(model.components.map(c => [c.id, c]));
  const connections = list(model.connections);
  const surfaces = model.office_coverage.surfaces;
  return {
    model, cover: model.office_coverage,
    systems: model.components.filter(c => c.id.startsWith('SYS-')).length,
    verified: connections.filter(c => c.runtime_verified === true).length,
    components: model.components.length,
    connections: connections.length,
    area(area) {
      return area.components.map(raw => {
        const c = byId.get(symbols.get(raw));
        const edges = connections.filter(e => symbols.get(e.from) === c.id || symbols.get(e.to) === c.id);
        const pending = [];
        if (!nonempty(c.owner_role) || /por confirmar/i.test(c.owner_role)) pending.push('Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.');
        if (!nonempty(c.source_of_truth)) pending.push('Fuente oficial pendiente de identificar en la ficha.');
        if (!edges.length) pending.push('No hay conexiones registradas para este componente.');
        const unverified = edges.filter(e => e.runtime_verified !== true).length;
        if (unverified) pending.push(unverified + ' conexiones sin verificación de ejecución registrada.');
        if (!list(c.evidence).length) pending.push('Evidencia de la ficha pendiente de registrar.');
        for (const risk of list(c.risks_sanitized)) if (nonempty(risk)) pending.push(risk);
        return {c, edges, pending, surfaces:surfaces.filter(s => symbols.get(s.component) === c.id)};
      });
    }
  };
}

function edgeDescription(edge) {
  return [edge.id, edge.from + ' → ' + edge.to, edge.kind, edge.label,
    'Estado: ' + (edge.status || 'sin declarar'),
    edge.runtime_verified === true ? 'Ejecución marcada como verificada en el atlas; revisar evidencia.' : 'Ejecución no verificada en el atlas.'].filter(Boolean).join(' · ');
}

function renderMarkdown(data) {
  const {cover, model} = data;
  const out = [
    '# YOD OS · Cobertura de la oficina', '',
    '**Observación:** ' + md(cover.observed_at) + ' · **Revisión:** ' + md(model.revision || 'sin registrar'), '',
    '**Encargado de verificación:** ' + md(cover.verification_owner), '',
    md(cover.scope), '',
    'La ubicación es propuesta. Este documento no concede permisos, no activa herramientas y no certifica integración operativa.', '',
    '- ' + data.systems + ' sistemas y ' + data.components + ' componentes distribuidos exactamente una vez.',
    '- ' + cover.areas.length + ' áreas; ' + data.connections + ' conexiones registradas, ' + data.verified + ' marcadas como verificadas en el atlas.', '',
    '## Conciliación del catálogo', '',
    '**Observado:** ' + md(cover.catalog_snapshot.observed_at), '',
    '**Operativo:** ' + cover.catalog_snapshot.canonical_ids.map(md).join(', '), '',
    '**Técnico:** ' + cover.catalog_snapshot.technical_ids.map(md).join(', '), ''
  ];
  const aliases = model.components.flatMap(c => list(c.aliases).map(a => a + ' → ' + c.id));
  out.push('**Equivalencias declaradas:** ' + (aliases.length ? aliases.map(md).join('; ') : 'No hay aliases.'), '',
    'Los IDs originales se conservan; resolver un alias no modifica permisos.', '');
  for (const area of cover.areas) {
    out.push('## ' + md(area.nombre), '', '**Ubicación propuesta:** ' + md(area.place) + ' · ' + area.components.length + ' componentes.', '');
    for (const item of data.area(area)) {
      const {c, edges, pending, surfaces} = item;
      out.push('### ' + md(c.nombre || c.id) + ' · ' + md(c.id), '',
        '**Función:** ' + md(c.proposito || 'Pendiente en ficha.'), '',
        '**Fuente oficial:** ' + md(c.source_of_truth || 'Pendiente en ficha.'), '',
        '**Responsable operativo:** ' + md(c.owner_role || 'No asignado en ficha.'), '',
        '**Estado registrado:** ' + md(c.status || 'Sin declarar') + '. ' + md(c.runtime_status || 'Ejecución no descrita en ficha.'), '');
      if (surfaces.length) out.push('**Entradas registradas:**', '', ...surfaces.map(s => '- ' + md(s.entry) + ' — ' + md(s.description)), '');
      out.push('**Conexiones registradas; no habilitan operaciones:**', '');
      out.push(...(edges.length ? edges.map(e => '- ' + md(edgeDescription(e))) : ['- Sin conexiones registradas.']), '');
      out.push('**Evidencia de la ficha:**', '');
      out.push(...(list(c.evidence).length ? c.evidence.map(e => {
        const url = evidenceUrl(e), label = md(evidenceLabel(e));
        return '- ' + (url ? '[' + label + '](' + url + ')' : label);
      }) : ['- Pendiente.']), '');
      if (edges.some(e => list(e.evidence).length)) {
        out.push('**Evidencia de conexiones:**', '');
        for (const edge of edges) for (const evidence of list(edge.evidence)) {
          const url = evidenceUrl(evidence), label = md(edge.id + ' · ' + evidenceLabel(evidence));
          out.push('- ' + (url ? '[' + label + '](' + url + ')' : label));
        }
        out.push('');
      }
      out.push('**Pendientes y límites:**', '',
        ...(pending.length ? pending.map(p => '- ' + md(p)) : ['- No se registran pendientes adicionales en esta ficha; esto no equivale a aceptación integral.']), '');
    }
  }
  return out.join('\n') + '\n';
}

const CSS = [
  ':root{color-scheme:light;--ink:#18302c;--muted:#546963;--line:#dbe4df;--paper:#f4f6f2;--card:#fff;--accent:#245b48}',
  '*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,sans-serif}',
  'main{max-width:1080px;margin:auto;padding:clamp(18px,4vw,52px)}h1{font-size:clamp(27px,4vw,44px);line-height:1.12;margin:8px 0 20px}',
  'h2{font-size:22px}h3{font-size:19px;margin:0 0 16px}h4{font-size:15px;margin:22px 0 8px}p,ul{margin:10px 0}a{color:var(--accent);overflow-wrap:anywhere}',
  '.eyebrow{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.muted,.meta{color:var(--muted);font-size:14px}',
  '.notice,.catalog{background:#e9efea;border:1px solid var(--line);border-radius:14px;padding:18px;margin:20px 0}',
  '.totals{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.totals p{flex:1 1 145px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px;margin:0}',
  '.totals strong{font-size:27px;display:block}.nav{display:flex;flex-wrap:wrap;gap:8px 18px;padding:0;list-style:none;margin:24px 0}',
  'details{background:var(--card);border:1px solid var(--line);border-radius:16px;margin:14px 0;overflow:hidden}summary{padding:20px;cursor:pointer;font-size:19px;font-weight:650}summary:focus-visible,a:focus-visible{outline:3px solid #bd793c;outline-offset:4px}',
  'summary .meta{display:block;font-weight:400;padding-left:21px}.area-body{padding:0 20px 20px}.component{border-top:1px solid var(--line);padding:24px 0;overflow-wrap:anywhere}',
  'dl{display:grid;grid-template-columns:minmax(120px,180px) 1fr;gap:7px 18px;margin:12px 0}dt{font-weight:650}dd{margin:0}li{margin:8px 0}.evidence,.edges{font-size:14px}.pending{background:#faf5e9;border-left:3px solid #b48b4e;padding:10px 16px}',
  'code{font-family:ui-monospace,monospace;font-size:.87em;overflow-wrap:anywhere}.component-id{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}',
  '@media(max-width:540px){dl{display:block}dt{margin-top:12px}summary{padding:16px}.area-body{padding:0 16px 16px}ul{padding-left:20px}}',
  '@media print{body{background:white}main{padding:0;max-width:none}.nav{display:none}details{break-inside:auto}details::details-content{display:block;content-visibility:visible}.component{break-inside:avoid}a{color:inherit}}'
].join('\n');

function evidenceHtml(e, prefix) {
  const url = evidenceUrl(e), label = h((prefix ? prefix + ' · ' : '') + evidenceLabel(e));
  return '<li>' + (url ? '<a href="' + h(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' : label) + '</li>';
}

function renderHtml(data) {
  const {cover, model} = data;
  const aliases = model.components.flatMap(c => list(c.aliases).map(a => a + ' → ' + c.id));
  const blocks = cover.areas.map(area => {
    const cards = data.area(area).map(({c, edges, pending, surfaces}) => {
      const edgeEvidence = edges.flatMap(e => list(e.evidence).map(ev => evidenceHtml(ev, e.id)));
      return '<article class="component"><h3><span class="component-id">' + h(c.id) + '</span>' + h(c.nombre || c.id) + '</h3>' +
        '<dl><dt>Función</dt><dd>' + h(c.proposito || 'Pendiente en ficha.') + '</dd>' +
        '<dt>Fuente oficial</dt><dd>' + h(c.source_of_truth || 'Pendiente en ficha.') + '</dd>' +
        '<dt>Responsable operativo</dt><dd>' + h(c.owner_role || 'No asignado en ficha.') + '</dd>' +
        '<dt>Estado registrado</dt><dd>' + h(c.status || 'Sin declarar') + '</dd></dl>' +
        '<p>' + h(c.runtime_status || 'Ejecución no descrita en ficha.') + '</p>' +
        (surfaces.length ? '<h4>Entradas registradas</h4><ul>' + surfaces.map(s => '<li><code>' + h(s.entry) + '</code><br>' + h(s.description) + '</li>').join('') + '</ul>' : '') +
        '<h4>Conexiones registradas; no habilitan operaciones</h4><ul class="edges">' +
        (edges.length ? edges.map(e => '<li>' + h(edgeDescription(e)) + '</li>').join('') : '<li>Sin conexiones registradas.</li>') + '</ul>' +
        '<h4>Evidencia de la ficha</h4><ul class="evidence">' + (list(c.evidence).length ? c.evidence.map(e => evidenceHtml(e)).join('') : '<li>Pendiente.</li>') + '</ul>' +
        (edgeEvidence.length ? '<h4>Evidencia de conexiones</h4><ul class="evidence">' + edgeEvidence.join('') + '</ul>' : '') +
        '<div class="pending"><h4>Pendientes y límites</h4><ul>' +
        (pending.length ? pending.map(p => '<li>' + h(p) + '</li>').join('') : '<li>No se registran pendientes adicionales en esta ficha; esto no equivale a aceptación integral.</li>') +
        '</ul></div></article>';
    }).join('');
    return '<details id="area-' + h(area.id) + '"><summary>' + h(area.nombre) +
      '<span class="meta">Ubicación propuesta: ' + h(area.place) + ' · ' + area.components.length + ' componentes</span></summary><div class="area-body">' + cards + '</div></details>';
  }).join('\n');
  return '<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>YOD OS · Cobertura de la oficina</title><style>' + CSS + '</style></head><body><main>' +
    '<header><p class="eyebrow">YOD OS · Registro de cobertura</p><h1>Todo tiene un lugar.<br>Cada conexión conserva su evidencia.</h1>' +
    '<p class="meta">Observación: <time datetime="' + h(cover.observed_at) + '">' + h(cover.observed_at) + '</time> · Revisión: ' + h(model.revision || 'sin registrar') + '</p>' +
    '<p class="meta">Encargado de verificación: ' + h(cover.verification_owner) + '</p><p>' + h(cover.scope) + '</p></header>' +
    '<aside class="notice">La ubicación es propuesta. Este documento no concede permisos, no activa herramientas y no certifica integración operativa.</aside>' +
    '<section class="totals" aria-label="Cobertura calculada"><p><strong>' + data.systems + '</strong>sistemas</p><p><strong>' + data.components + '</strong>componentes</p><p><strong>' + cover.areas.length + '</strong>áreas</p><p><strong>' + data.verified + ' / ' + data.connections + '</strong>conexiones marcadas como verificadas en el atlas</p></section>' +
    '<section class="catalog"><h2>Conciliación del catálogo</h2><p class="meta">Observado: ' + h(cover.catalog_snapshot.observed_at) + '</p>' +
    '<p><b>Operativo:</b> ' + cover.catalog_snapshot.canonical_ids.map(h).join(', ') + '</p><p><b>Técnico:</b> ' + cover.catalog_snapshot.technical_ids.map(h).join(', ') + '</p>' +
    '<p><b>Equivalencias declaradas:</b> ' + (aliases.length ? aliases.map(h).join('; ') : 'No hay aliases.') + '</p>' +
    '<p class="meta">Los IDs originales se conservan; resolver un alias no modifica permisos.</p></section>' +
    '<nav aria-label="Áreas de la oficina"><ul class="nav">' + cover.areas.map(a => '<li><a href="#area-' + h(a.id) + '">' + h(a.nombre) + '</a></li>').join('') + '</ul></nav>' +
    blocks + '</main></body></html>\n';
}

function renderOfficeCoverage(model) {
  const data = prepare(model);
  return {'oficina-cobertura.md': renderMarkdown(data), 'oficina-cobertura.html': renderHtml(data)};
}

module.exports = {validateOfficeCoverage, renderOfficeCoverage};
