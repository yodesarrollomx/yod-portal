'use strict';
(function (root) {
  const original = path => String(path || '').replace(/\.inline-\d+\.js$/, '');
  const line = value => Number(String(value || '').match(/(?:^|:)L?(\d+)/)?.[1] || 1);
  const basename = path => original(path).split('/').pop();
  function component(path) {
    const parts = original(path).split('/');
    const names = {'yod-voz':'Voz de Jarvis','advanced-delegation':'Reparto de tareas','yod-mayordomo-regla':'Reglas del mayordomo','yod-red':'Mapa de relaciones','yod-visor-observer':'Observador del visor','obsidian-memory':'Memoria en Obsidian','tablero':'Tablero y tareas','visor':'Visor del mundo','motor':'Motor del mundo','gateway':'Conexión y mensajes','agent':'Ejecución del agente','tools':'Herramientas','hermes_cli':'Consola de Hermes','hermes_ui':'Panel de Hermes'};
    const key = parts.find(p => Object.hasOwn(names,p));
    return key ? names[key] : (parts.slice(1,-1).join(' / ') || basename(path));
  }
  function index(graph) {
    const nodes = new Map(), files = new Map(), communities = new Map(), incoming = new Map(), outgoing = new Map();
    for (const n of graph.nodes) {
      nodes.set(n.id, n);
      const path = original(n.source_file);
      if (path) { if (!files.has(path)) files.set(path, []); files.get(path).push(n); }
      if (!communities.has(n.community)) communities.set(n.community, []);
      communities.get(n.community).push(n);
    }
    const edges = (graph.links || graph.edges).filter(e => nodes.has(e.source) && nodes.has(e.target));
    for (const e of edges) {
      if (!incoming.has(e.target)) incoming.set(e.target, []);
      if (!outgoing.has(e.source)) outgoing.set(e.source, []);
      incoming.get(e.target).push(e); outgoing.get(e.source).push(e);
    }
    return {nodes, files, communities, edges, incoming, outgoing};
  }
  function communityName(members) {
    const counts = new Map();
    for (const n of members) { const path = original(n.source_file); if (path) counts.set(path, (counts.get(path) || 0) + 1); }
    const paths = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const main = paths[0]?.[0];
    const symbol = members.find(n => n._callable_class && original(n.source_file) === main) || members.find(n => n._callable && original(n.source_file) === main);
    return {title: main ? component(main) : 'Símbolos sin archivo', subtitle: symbol?.label || basename(main) || 'Grupo del código', source: main ? basename(main) : '', paths: paths.map(x => x[0])};
  }
  function aggregate(idx, key) {
    const groups = new Map();
    for (const edge of idx.edges) {
      const from = key(idx.nodes.get(edge.source)), to = key(idx.nodes.get(edge.target));
      if (!from || !to || from === to) continue;
      const id = JSON.stringify([from, to]);
      if (!groups.has(id)) groups.set(id, {from, to, count: 0});
      groups.get(id).count++;
    }
    return [...groups.values()];
  }
  function statusInfo(status, baseline, now = Date.now()) {
    const time = Date.parse(status?.checked_at);
    const fresh = status?.baseline === baseline && Array.isArray(status.changes) && Number.isFinite(time) && now - time <= 900000 && time <= now + 60000;
    return {fresh, changes: fresh ? status.changes : [], text: fresh ? (status.changes.length ? `${status.changes.length} archivos con cambios` : 'Sin cambios en los archivos comprobados') + ' · Revisado ' + new Date(time).toLocaleString('es-MX') : 'Sin reporte reciente · Estado actual desconocido'};
  }
  function safeParts(path) {
    const parts = original(path).split('/');
    if (!parts.length || parts.some(p => !p || p === '.' || p === '..' || p.includes('\\') || p.includes('\0') || /^\.(env|secrets|ssh|aws|pki)(?:\.|$)/i.test(p)) || !/\.(py|js|mjs|cjs|ts|tsx|jsx|html|css|sh|gs)$/i.test(parts.at(-1))) throw Error('Ruta de código no permitida');
    return parts;
  }
  const api = {original, line, basename, component, index, communityName, aggregate, statusInfo, safeParts};
  if (typeof module !== 'undefined') module.exports = api; else root.JarvisGraph = api;
})(globalThis);
