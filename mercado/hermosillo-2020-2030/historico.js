'use strict';

(() => {
  const maxOptions = 160;
  const required = ['indicador', 'valor', 'unidad', 'periodo', 'frecuencia', 'geografia', 'nivel_geo', 'segmento', 'naturaleza', 'fuente', 'url', 'referencia', 'estado'];
  const number = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 6 });
  const chartNumber = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 3 });
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let closed = false;
    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      if (quoted) {
        if (character !== '"') field += character;
        else if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else if (character === ',' || character === '\n' || character === '\r') {
        row.push(field);
        field = '';
        closed = false;
        if (character !== ',') {
          if (character === '\r' && text[i + 1] === '\n') i++;
          if (row.some(value => value.trim())) rows.push(row);
          row = [];
        }
      } else if (character === '"' && !field && !closed) {
        quoted = true;
      } else {
        if (closed || character === '"') throw new Error('Hay comillas fuera de lugar en el CSV.');
        field += character;
      }
    }
    if (quoted) throw new Error('El CSV termina dentro de un campo entre comillas.');
    row.push(field);
    if (row.some(value => value.trim())) rows.push(row);
    return rows;
  }

  function periodDate(period) {
    const interval = /^(\d{4}-\d{2})\/(\d{4}-\d{2})$/.exec(period);
    if (interval) {
      const start = periodDate(interval[1]);
      const end = periodDate(interval[2]);
      if (start === null || end === null || start > end) return null;
      const month = new Date(end);
      return Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0);
    }
    const parsed = /^(\d{4})(?:-(?:[QT]([1-4])|(\d{2})(?:-(\d{2}))?))?$/i.exec(period);
    if (!parsed) return null;
    const [, year, quarter, month, day] = parsed;
    const m = quarter ? Number(quarter) * 3 - 2 : Number(month ?? 1);
    const d = Number(day ?? 1);
    const date = new Date(Date.UTC(Number(year), m - 1, d));
    return date.getUTCFullYear() === Number(year) && date.getUTCMonth() + 1 === m && date.getUTCDate() === d
      ? +date : null;
  }

  function readSeries(csv) {
    const [header = [], ...rows] = parseCSV(csv);
    const positions = new Map(header.map((name, index) => [name.trim().toLowerCase(), index]));
    const missing = required.filter(name => !positions.has(name));
    if (missing.length) throw new Error('Exporta la pestaña Datos. Faltan: ' + missing.join(', '));
    if (positions.size !== header.length) throw new Error('Hay columnas repetidas.');
    const groups = new Map();
    let accepted = 0;
    let omitted = 0;
    for (const row of rows) {
      if (row.length !== header.length) throw new Error('Hay filas con una cantidad incorrecta de columnas.');
      const field = name => (row[positions.get(name)] ?? '').trim();
      const label = field('indicador');
      const period = field('periodo');
      const raw = field('valor');
      const unit = field('unidad');
      const date = periodDate(period);
      const value = Number(raw.replaceAll(',', ''));
      if (!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(raw)
          || !Number.isFinite(value) || date === null || !label || !unit) {
        omitted++;
        continue;
      }
      const evidence = field('estado');
      const level = field('nivel_geo');
      const place = [field('geografia'), level].filter(Boolean).join(' · ');
      const nature = field('naturaleza');
      const segment = field('segmento');
      const frequency = field('frecuencia');
      const source = field('fuente');
      const series = field('serie_id');
      const dimensions = [place, unit, frequency, segment, nature, source, evidence];
      const meta = dimensions.filter(Boolean);
      const key = JSON.stringify([series || label, ...dimensions]);
      if (!groups.has(key)) groups.set(key, { label, series, unit, place, level, meta, search: normalize([label, series, ...meta].join(' ')), points: [] });
      groups.get(key).points.push({ period, date, value, source, url: field('url'), reference: field('referencia'), evidence });
      accepted++;
    }
    if (!accepted) throw new Error('El CSV no tiene filas con valor numérico y periodo reconocible.');
    const series = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, 'es-MX') || a.place.localeCompare(b.place, 'es-MX'));
    for (const group of series) group.points.sort((a, b) => a.date - b.date);
    return { series, accepted, omitted };
  }

  function sourceLink(value) {
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch {
      return '';
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseCSV, readSeries, periodDate, sourceLink };
    return;
  }

  const panel = document.getElementById('historico');
  if (!panel) return;
  const search = panel.querySelector('#hist-buscar');
  const geography = panel.querySelector('#hist-geografia');
  const filterCount = panel.querySelector('#hist-filtro');
  const namedSeries = panel.querySelector('#hist-serie');
  const status = panel.querySelector('#hist-estado');
  const metadata = panel.querySelector('#hist-meta');
  const chart = panel.querySelector('#hist-grafica');
  const table = panel.querySelector('#hist-valores');
  const fileInput = panel.querySelector('#hist-importar');
  const reset = panel.querySelector('#hist-publico');
  let base;
  let current;
  let request = 0;

  function svg(name, attributes, label) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (label !== undefined) element.textContent = label;
    return element;
  }

  function render() {
    const group = namedSeries.value ? current.series[Number(namedSeries.value)] : undefined;
    chart.replaceChildren();
    table.replaceChildren();
    chart.toggleAttribute('hidden', !group);
    panel.querySelector('#hist-tabla').hidden = !group;
    if (!group) {
      metadata.textContent = 'No hay series para ese filtro.';
      return;
    }
    const { points } = group;
    metadata.textContent = group.meta.join(' · ') + ' · ' + number.format(points.length) + ' registros';
    chart.append(svg('title', {}, group.label + ' — ' + group.unit));
    let minimum = points[0].value;
    let maximum = minimum;
    for (const { value } of points) {
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    let range = maximum - minimum;
    if (!range) {
      range = Math.abs(maximum) / 10 || 1;
      minimum -= range / 2;
      maximum += range / 2;
    }
    const start = points[0].date;
    const end = points.at(-1).date;
    const left = 55, right = 414, top = 12, bottom = 154;
    const x = date => start === end ? (left + right) / 2 : left + (date - start) * (right - left) / (end - start);
    const y = value => bottom - (value - minimum) * (bottom - top) / range;
    for (const value of [minimum, minimum + range / 2, maximum]) {
      const position = y(value);
      chart.append(svg('line', { x1: left, x2: right, y1: position, y2: position, class: 'hist-linea' }));
      chart.append(svg('text', { x: left - 7, y: position + 4, 'text-anchor': 'end' }, chartNumber.format(value)));
    }
    for (const point of start === end ? [points[0]] : [points[0], points.at(-1)]) {
      const anchor = start === end ? 'middle' : point.date === start ? 'start' : 'end';
      chart.append(svg('text', { x: x(point.date), y: 176, 'text-anchor': anchor }, point.period));
    }
    const marks = new Map();
    for (const point of points) {
      if (!marks.has(point.date)) marks.set(point.date, new Map());
      marks.get(point.date).set(point.value, point);
    }
    let previous;
    for (const values of marks.values()) {
      const point = values.values().next().value;
      // Un periodo con cifras distintas conserva sus marcas sin trazar una trayectoria arbitraria.
      if (values.size === 1 && previous) {
        chart.append(svg('line', { x1: x(previous.date), y1: y(previous.value), x2: x(point.date), y2: y(point.value), class: 'hist-trazo' }));
      }
      previous = values.size === 1 ? point : undefined;
      for (const item of values.values()) {
        const circle = svg('circle', { cx: x(item.date), cy: y(item.value), r: 3.6, class: 'hist-punto' });
        circle.append(svg('title', {}, item.period + ' · ' + number.format(item.value)));
        chart.append(circle);
      }
    }
    const fragment = document.createDocumentFragment();
    for (const point of points) {
      const row = document.createElement('tr');
      row.insertCell().textContent = point.period;
      row.insertCell().textContent = number.format(point.value);
      const evidence = row.insertCell();
      evidence.textContent = point.evidence;
      const source = row.insertCell();
      source.className = 'izq';
      const url = sourceLink(point.url);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = point.source || 'Abrir fuente';
        source.append(link);
      } else {
        source.textContent = point.source;
      }
      if (point.reference) {
        const ref = document.createElement('small');
        ref.textContent = point.reference;
        source.append(ref);
      }
      fragment.append(row);
    }
    table.append(fragment);
  }

  function options(preferred = namedSeries.value) {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    namedSeries.replaceChildren();
    if (!current) return;
    const matching = [...current.series.entries()].filter(([, group]) =>
      (!geography.value || geography.value === group.level) && terms.every(term => group.search.includes(term)));
    const visible = matching.slice(0, maxOptions);
    const selected = matching.find(([id]) => String(id) === String(preferred));
    if (selected && !visible.includes(selected)) visible[visible.length - 1] = selected;
    for (const [id, group] of visible) {
      namedSeries.add(new Option([group.label, ...group.meta].join(' · '), String(id)));
    }
    if (selected) namedSeries.value = String(preferred);
    filterCount.textContent = matching.length > maxOptions
      ? 'Mostrando ' + number.format(maxOptions) + ' de ' + number.format(matching.length) + '. Acota la búsqueda.'
      : '';
    namedSeries.disabled = !namedSeries.length;
    render();
  }

  function show(dataset, label) {
    current = dataset;
    search.value = '';
    status.textContent = label + ' · ' + number.format(dataset.accepted) + ' registros en ' + number.format(dataset.series.length) + ' series'
      + (dataset.omitted ? ' · ' + number.format(dataset.omitted) + ' filas sin valor o periodo graficable' : '');
    search.disabled = false;
    geography.disabled = false;
    geography.replaceChildren(new Option('Todos los niveles', ''));
    const levels = [...new Set(dataset.series.map(group => group.level).filter(Boolean))].sort();
    for (const level of levels) geography.add(new Option(level, level));
    if (levels.includes('municipio')) geography.value = 'municipio';
    reset.hidden = dataset === base || !base;
    const preferred = dataset.series.findIndex(group => group.series === 'shf-indice-hermosillo');
    options(preferred);
  }

  search.addEventListener('input', () => options());
  geography.addEventListener('change', () => options());
  namedSeries.addEventListener('change', render);
  reset.addEventListener('click', () => {
    request++;
    if (base) show(base, 'Corte público');
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileInput.value = '';
    const sequence = ++request;
    try {
      if (file.size > 75 * 1024 * 1024) throw new Error('El CSV rebasa 75 MB.');
      const dataset = readSeries(await file.text());
      if (sequence === request) show(dataset, 'CSV de Datos · en este navegador');
    } catch (error) {
      if (sequence === request) status.textContent = error.message + (current ? ' La serie anterior sigue disponible.' : '');
    }
  });

  fetch('historico-publico.csv.gz', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('corte no disponible');
    return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text();
  }).then(csv => {
    base = readSeries(csv);
    if (!current && !request) show(base, 'Corte público');
    else if (current !== base) reset.hidden = false;
  }).catch(() => {
    if (!current && !request) status.textContent = 'El corte público no está disponible. Puedes abrir un CSV de Datos.';
  });
})();
