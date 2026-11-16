'use strict';

(() => {
  const shf = 'Índice SHF de precios de la vivienda con crédito hipotecario';
  const inpc = 'Índice de precios al consumidor';
  const acciones = 'Acciones de financiamiento de vivienda por modalidad';
  const labels = {
    shf: 'Vivienda · precio registrado', real: 'Vivienda · sin inflación', ipc: 'Precios al consumidor',
    nueva: 'Financiamientos · vivienda nueva', usada: 'Financiamientos · vivienda usada',
    registros: 'Viviendas registradas', produccion: 'Viviendas producidas',
    inventario: 'Inventario registrado', fiscal: 'Valor catastral de suelo',
  };
  const colors = ['#087c6a', '#a44821', '#584ca3'];
  const format = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
  const f = n => format.format(n);
  const pct = n => (n > 0 ? '+' : '') + f(n) + '%';
  const market = 'Hermosillo · municipio';

  function unique(groups, label, { place = market, segment, frequency, unit, source } = {}) {
    const values = new Map();
    for (const group of groups) {
      if (group.label !== label || group.place !== place || group.evidence !== 'verificado'
          || (segment && group.segment !== segment) || (frequency && group.frequency !== frequency)
          || (unit && group.unit !== unit) || (source && group.source !== source)) continue;
      for (const p of group.points) {
        const old = values.get(p.period);
        if (!old && !values.has(p.period)) values.set(p.period, { ...p, metric: label, unit: group.unit });
        else if (old && old.value !== p.value) values.set(p.period, null);
      }
    }
    return new Map([...values].filter(([, point]) => point));
  }

  const key = (year, quarter) => `${year}-T${quarter}`;
  const quarterIndex = period => Number(period.slice(0, 4)) * 4 + Number(period.slice(-1)) - 1;
  const quarterKey = i => key(Math.floor(i / 4), i % 4 + 1);
  const value = points => points.reduce((sum, p) => sum + p.value, 0);
  function quarterly(monthly, method) {
    const grouped = new Map();
    for (const [period, p] of monthly) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) continue;
      const month = Number(period.slice(-2));
      const q = key(period.slice(0, 4), Math.ceil(month / 3));
      if (!grouped.has(q)) grouped.set(q, []);
      grouped.get(q).push(p);
    }
    const output = new Map();
    for (const [q, rows] of grouped) {
      rows.sort((a, b) => a.period.localeCompare(b.period));
      if (method === 'close') {
        const end = Number(q.slice(-1)) * 3;
        if (Number(rows.at(-1).period.slice(-2)) === end) output.set(q, { value: rows.at(-1).value, rows: [rows.at(-1)] });
      } else if (rows.length === 3) {
        output.set(q, { value: value(rows) / (method === 'mean' ? 3 : 1), rows });
      }
    }
    return output;
  }

  function build(groups) {
    const named = (indicator, segment, unit, source) => unique(groups, indicator, { segment, unit, source, frequency: 'mensual' });
    const aggregate = (indicator, segment, unit, source, how = 'sum') => quarterly(named(indicator, segment, unit, source), how);
    const ipcOpts = { frequency: 'mensual', segment: 'general', source: 'INEGI · INPC por ciudades', unit: 'índice base 2.ª quincena de julio de 2018=100' };
    const prices = unique(groups, shf, { frequency: 'trimestral', segment: 'Vivienda con crédito hipotecario', unit: 'índice 2017=100', source: 'Sociedad Hipotecaria Federal / SNIIV–SEDATU' });
    const ipcMunicipal = unique(groups, inpc, ipcOpts);
    const ipcCity = unique(groups, inpc, { ...ipcOpts, place: 'Hermosillo · ciudad' });
    const ipc = quarterly(ipcCity.size ? ipcCity : ipcMunicipal, 'mean');
    const price = new Map();
    for (const [q, p] of prices) {
      const c = ipc.get(q);
      if (/^\d{4}-T[1-4]$/.test(q) && p.value > 0 && c?.value > 0) price.set(q, {
        shf: { value: p.value, rows: [p] }, ipc: c, real: { value: p.value / c.value, rows: [p, ...c.rows] },
      });
    }
    return {
      price, nueva: aggregate(acciones, 'Viviendas nuevas', 'acciones', 'SNIIV–SEDATU'), usada: aggregate(acciones, 'Viviendas existentes', 'acciones', 'SNIIV–SEDATU'),
      registros: aggregate('Viviendas registradas', 'Total', 'viviendas', 'RUV / SNIIV–SEDATU'),
      produccion: aggregate('Viviendas producidas', 'Total', 'viviendas', 'RUV / SNIIV–SEDATU'),
      inventario: aggregate('Viviendas en inventario RUV', 'Total', 'viviendas', 'RUV / SNIIV–SEDATU', 'close'),
      zones: groups.filter(g => g.evidence === 'verificado' && g.label === 'Valor catastral unitario de suelo urbano por zona homogénea' && g.unit === 'MXN/m²' && g.place === 'Hermosillo · zona catastral' && g.source === 'Dirección de Catastro Municipal de Hermosillo'),
      ads: groups.filter(g => g.evidence === 'verificado' && g.place === market && g.source === 'Lamudi México' && g.frequency === 'mensual'
        && ['MXN/m²', 'MXN/m²/mes'].includes(g.unit) && /precio|renta/i.test(g.label)),
    };
  }

  function changes(series) {
    const points = new Map();
    for (const [q, current] of series) {
      const prior = series.get(quarterKey(quarterIndex(q) - 4));
      if (prior?.value > 0) points.set(q, { value: 100 * (current.value / prior.value - 1), rows: [...current.rows, ...prior.rows] });
    }
    return points;
  }

  function join(series, from, lag = 0) {
    const [first, ...rest] = series;
    return [...first.keys()].sort().filter(q => q >= from).flatMap(q => {
      const t = quarterKey(quarterIndex(q) - lag);
      const points = [first.get(q), ...rest.map((s, index) => s.get(index === 0 ? t : q))];
      return points.every(Boolean) ? [{ period: q, i: quarterIndex(q), points }] : [];
    });
  }

  function correlation(rows) {
    if (rows.length < 8) return null;
    const avg = j => rows.reduce((sum, row) => sum + row.points[j].value, 0) / rows.length;
    const a = avg(0), b = avg(1);
    let xx = 0, yy = 0, xy = 0;
    for (const row of rows) {
      const x = row.points[0].value - a, y = row.points[1].value - b;
      xx += x*x; yy += y*y; xy += x*y;
    }
    return xx && yy ? xy / Math.sqrt(xx * yy) : null;
  }

  function rankCorrelation(rows) {
    function ranks(column) {
      const ordered = rows.map((row, index) => [row.points[column].value, index]).sort(([a],[b]) => a-b);
      const result = [];
      for (let start = 0; start < ordered.length;) {
        let end = start + 1;
        while (end < ordered.length && ordered[end][0] === ordered[start][0]) end++;
        for (let i = start; i < end; i++) result[ordered[i][1]] = (start + end - 1) / 2;
        start = end;
      }
      return result;
    }
    const a = ranks(0), b = ranks(1);
    return correlation(rows.map((row,i) => ({ points: [{value:a[i]}, {value:b[i]}] })));
  }

  function quantile(n, p) {
    const values = [...n].sort((a,b) => a-b);
    const i = (values.length - 1) * p;
    return values[Math.floor(i)] + (values[Math.ceil(i)] - values[Math.floor(i)]) * (i % 1);
  }

  function fiscal(zones, start, end, region = '') {
    const matches = new Map();
    for (const group of zones) {
      if (region && group.segment.split(' | ')[0] !== region) continue;
      if (!matches.has(group.segment)) matches.set(group.segment, new Map());
      const values = matches.get(group.segment);
      for (const point of group.points) {
        const old = values.get(point.period);
        if (!values.has(point.period)) values.set(point.period, point);
        else if (old && old.value !== point.value) values.set(point.period, null);
      }
    }
    return [...matches].flatMap(([zone, values]) => {
      const a = values.get(start), b = values.get(end);
      if (!(a?.value > 0 && b?.value > 0)) return [];
      return [{ zone, value: 100 * (b.value / a.value - 1), a, b }];
    }).sort((a,b) => b.value - a.value || a.zone.localeCompare(b.zone, 'es-MX'));
  }

  function scenarios(price, from) {
    const complete = [...price].filter(([q]) => q >= from && q.endsWith('T4')).sort(([a],[b]) => a.localeCompare(b));
    const rates = [];
    for (let i = 1; i < complete.length; i++) {
      const [q, p] = complete[i], [prev, base] = complete[i-1];
      if (quarterIndex(q) - quarterIndex(prev) === 4) rates.push(p.real.value / base.real.value - 1);
    }
    let error = 0, baseline = 0, evaluations = 0;
    for (let i = 8; i < rates.length; i++) {
      error += Math.abs(rates[i] - quantile(rates.slice(i-8,i), .5));
      baseline += Math.abs(rates[i]);
      evaluations++;
    }
    return { rates, complete, error: evaluations ? error / evaluations : null, baseline: evaluations ? baseline / evaluations : null, evaluations };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { build, unique, quarterly, changes, join, correlation, rankCorrelation, fiscal, scenarios };
    return;
  }

  const $ = id => document.getElementById('lec-' + id);
  const controls = ['vista', 'desde', 'extra', 'horizonte', 'tasa'];
  let data, year, mode, current = [], currentNames = [], currentUnit = "";
  const set = (id, text) => { $(id).textContent = text; };
  function opts(el, choices, previous) {
    el.replaceChildren(...choices.map(([id, label]) => new Option(label, id)));
    if (choices.some(([id]) => id === previous)) el.value = previous;
  }
  function subtitle(text, result, limit) {
    set('nota', text); set('resultado', result); set('limite', limit);
  }
  function svg(tag, attrs, text) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
    if (text != null) e.textContent = text;
    return e;
  }
  function plot(rows, names, unit, bars = false) {
    const g = $('grafica');
    g.replaceChildren(svg('title', {}, names.join(' / ') + ' · ' + unit));
    $('leyenda').replaceChildren(...names.map((name,i) => {
      const e = document.createElement('span');
      e.textContent = '● ' + name; e.style.color = colors[i]; return e;
    }));
    if (!rows.length) return;
    const values = rows.flatMap(row => row.points.map(p => p.value));
    let min = Math.min(...values, ...(bars ? [0] : [])), max = Math.max(...values, ...(bars ? [0] : []));
    if (min === max) { min -= 1; max += 1; }
    const left = 54, right = 484, bottom = 176, top = 17;
    const first = rows[0].i, last = rows.at(-1).i;
    const x = i => first === last ? (left + right)/2 : left + (bars ? (i-first+.5)/(last-first+1) : (i-first)/(last-first))*(right-left);
    const y = n => bottom - (n-min)/(max-min)*(bottom-top);
    for (const n of [min,(min+max)/2,max]) g.append(
      svg('line',{x1:left,x2:right,y1:y(n),y2:y(n),stroke:'#b6beb6','stroke-width':.7}),
      svg('text',{x:left-5,y:y(n)+4,'text-anchor':'end'}, f(n) + (unit === '%' ? '%' : '')));
    const ticks = bars ? rows : [...new Set([rows[0], rows[Math.floor(rows.length/2)], rows.at(-1)])];
    for (const row of ticks) g.append(svg('text',{x:x(row.i),y:197,'text-anchor':bars || first === last ? 'middle' : row.i===first ? 'start' : row.i===last ? 'end' : 'middle'},row.period.replace('-T', ' · T')));
    rows.forEach((row,j) => row.points.forEach((p,i) => {
      const prev = rows[j-1];
      if (!bars && prev && row.i-prev.i===1) g.append(svg('line',{x1:x(prev.i),x2:x(row.i),y1:y(prev.points[i].value),y2:y(p.value),stroke:colors[i],'stroke-width':2,...(p.scenario?{'stroke-dasharray':'5 4'}:{})}));
      const mark = bars
        ? svg('rect',{x:x(row.i)-9,y:Math.min(y(0),y(p.value)),width:18,height:Math.max(1,Math.abs(y(0)-y(p.value))),fill:colors[i]})
        : svg('circle',{cx:x(row.i),cy:y(p.value),r:p.scenario?3:2.4,fill:p.scenario?'white':colors[i],stroke:colors[i]});
      mark.append(svg('title',{},(row.name || row.period) + ' · ' + names[i] + ' · ' + f(p.value) + ' ' + unit));
      mark.dataset.row = String(j);
      mark.setAttribute('tabindex', '-1');
      mark.addEventListener('click', () => selectObservation(j));
      g.append(mark);
    }));
  }
  function evidence() {
    const row = current[Number($('evidencia').value)];
    $('fuentes').replaceChildren();
    if (!row) return;
    const seen = new Set();
    for (const p of row.points.flatMap(p => p.rows || [])) {
      const id = JSON.stringify([p.metric,p.period,p.value,p.url,p.reference]);
      if (seen.has(id)) continue;
      seen.add(id);
      const tr = $('fuentes').insertRow();
      tr.insertCell().textContent = p.metric;
      tr.insertCell().textContent = p.period;
      tr.insertCell().textContent = f(p.value) + ' ' + p.unit;
      const cell = tr.insertCell();
      if (/^https:\/\//i.test(p.url)) {
        const a = document.createElement('a');
        a.href=p.url; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=p.source; cell.append(a);
      } else cell.textContent=p.source;
      if (p.reference) cell.append(document.createElement('br'), p.reference);
    }
  }
  const extremes = (rows, col) => {
    const points = rows.filter(row => !row.points[col].scenario);
    const max = points.reduce((a,b) => b.points[col].value > a.points[col].value ? b : a);
    const min = points.reduce((a,b) => b.points[col].value < a.points[col].value ? b : a);
    return `Máximo ${f(max.points[col].value)} en ${max.period}. Mínimo ${f(min.points[col].value)} en ${min.period}.`;
  };
  const split = (rows, j) => new Map(rows.map(([q,r]) => [q,r[j]]));

  const questions = {
    precio: ['¿La vivienda sube más que el costo de vida?', 'Una subida de precio puede venir, en parte, de que todo cuesta más. Descontar la inflación ayuda a ver cuánto cambió la vivienda más allá de esa subida general.', 'El índice representa vivienda comprada con crédito hipotecario. No describe el precio de cada casa ni mide si los sueldos alcanzan para comprarla.', 'SHF / SNIIV · vivienda con crédito del municipio + INEGI · precios de la ciudad'],
    credito: ['¿Los precios y los créditos se mueven juntos?', 'El financiamiento ayuda a seguir la actividad de compra. Mueve la comparación 3, 6 o 12 meses para explorar si sus cambios aparecen antes que los del precio.', 'Moverse juntos no prueba que uno cause al otro. Se cuentan financiamientos reportados, no familias únicas; los universos de las dos fuentes son distintos.', 'SNIIV · financiamientos reportados + SHF e INEGI · precio sin inflación'],
    ruv: ['¿Se está construyendo más vivienda?', 'Un registro anuncia una vivienda al sistema; la producción mide otra etapa. Ver ambas junto al inventario ayuda a distinguir intención, avance y existencias registradas.', 'El inventario RUV no demuestra cuántas casas están sin vender. Un registro puede cambiar, cancelarse o tardar en convertirse en vivienda producida.', 'RUV / SNIIV · municipio de Hermosillo'],
    suelo: ['¿En qué zonas cambió más el valor fiscal del suelo?', 'El valor fiscal sirve como referencia para impuestos. Comparar una misma zona entre años permite ubicar revisiones grandes y pedir una explicación específica.', 'Un aumento fiscal puede deberse a una actualización administrativa. No demuestra que esa zona se venda más cara ni que sea la mejor inversión.', 'Catastro Municipal · zonas con región, clave y nombre coincidentes'],
    oferta: ['¿Cuánto están pidiendo por vender o rentar?', 'El precio por metro cuadrado ayuda a comparar anuncios de tamaños distintos. Elige un solo tipo de inmueble y una sola operación para seguir su movimiento.', 'Son precios anunciados, no precios de cierre. Si cambia la mezcla de propiedades publicadas, también puede cambiar el dato, aunque una casa concreta no cambie de precio.', 'Lamudi México · muestra mensual de anuncios de Hermosillo'],
    escenario: ['¿Qué pasaría si los precios siguieran este ritmo?', 'Mueve el cambio anual y observa cómo se acumula. Las dos referencias usan ritmos bajos y altos del historial; tu escenario puede quedar fuera de ellas.', 'Es una simulación, sin probabilidad asignada. Supone el mismo ritmo todos los años y descuenta la inflación; no es una promesa de precio ni de rentabilidad.', 'Cálculo a partir de SHF + INEGI · años completos; futuro supuesto'],
  };
  function periodName(period) {
    const q = /^(\d{4})-T([1-4])$/.exec(period);
    if (q) return ['ene–mar','abr–jun','jul–sep','oct–dic'][Number(q[2])-1] + ' ' + q[1];
    const m = /^(\d{4})-(\d{2})$/.exec(period);
    return m ? ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][Number(m[2])-1] + ' ' + m[1] : period;
  }
  function cards(items) {
    $('resumen').replaceChildren(...items.map(([name,number,note],i)=>{
      const e=document.createElement('div'); e.className='claro-cifra'; e.style.setProperty('--acento',colors[i%3]);
      for(const [tag,text] of [['span',name],['b',number],['small',note]]) { const part=document.createElement(tag);part.textContent=text;e.append(part); }
      return e;
    }));
  }
  function selectObservation(index) {
    const row=current[index]; if(!row) return;
    $('punto').value=String(index); $('evidencia').value=String(index);
    set('fecha',periodName(row.period)+(row.points[0].scenario?' · escenario':''));
    $('detalle').replaceChildren(...row.points.map((p,i)=>{
      const e=document.createElement('span');e.style.setProperty('--acento',colors[i]);
      e.textContent=currentNames[i]+': '+(currentUnit==='%'?pct(p.value):f(p.value)+' '+(currentUnit==='índice'?'puntos':currentUnit));
      return e;
    }));
    document.querySelectorAll('.claro-zona').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));
    $('grafica').querySelectorAll('.lec-seleccion').forEach(n=>n.remove());
    const marks=$('grafica').querySelectorAll('[data-row="'+index+'"]');
    if(marks.length && marks[0].hasAttribute('cx')) {
      const x=marks[0].getAttribute('cx');
      $('grafica').append(svg('line',{x1:x,x2:x,y1:17,y2:176,stroke:'#233f36','stroke-width':1,'stroke-dasharray':'2 3',class:'lec-seleccion'}));
      marks.forEach(mark=>$('grafica').append(svg('circle',{cx:mark.getAttribute('cx'),cy:mark.getAttribute('cy'),r:4.6,fill:'white',stroke:mark.getAttribute('stroke'),'stroke-width':2,class:'lec-seleccion'})));
    }
    evidence();
  }
  function readable(view,rows,names,unit) {
    const index=Object.keys(questions).indexOf(view), [title,why,limit,source]=questions[view];
    document.getElementById('lecturas-titulo').textContent=title;
    set('paso',String(index+1).padStart(2,'0')+' / 06'); set('porque',why);set('cautela',limit);set('origen',source);
    document.querySelectorAll('[data-vista]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vista===view)));
    $('grafica').toggleAttribute('hidden',view==='suelo');$('zonas').hidden=view!=='suelo';$('recorrido').hidden=!rows.length || view==='suelo';
    $('resumen').replaceChildren();$('zonas').replaceChildren();
    $('punto').max=String(Math.max(0,rows.length-1));
    if(!rows.length) { set('resultado','No hay suficientes datos comparables con este filtro. Prueba con un periodo más amplio.');set('fecha','');$('detalle').replaceChildren();return; }
    const first=rows[0], last=rows.at(-1);
    const span=periodName(first.period)+' → '+periodName(last.period);
    const number=p=>unit==='%'?pct(p.value):f(p.value);
    if(view==='precio') {
      const growth=last.points.map(p=>p.value-100);
      cards([['Vivienda · precio registrado',pct(growth[0]),span],['Vivienda · sin inflación',pct(growth[1]),'Descontando la subida general de precios'],['Precios al consumidor',pct(growth[2]),'En la ciudad de Hermosillo']]);
      const direction=growth[1]>=0?'subió':'bajó';
      set('resultado',`Después de descontar la inflación, la vivienda ${direction} ${f(Math.abs(growth[1]))}% en el periodo elegido.`);
      set('nota','Las tres líneas empiezan en 100. Llegar a 150 significa subir 50% desde ese inicio. No son pesos.');
    }
    if(view==='credito'||view==='ruv') {
      cards(last.points.map((p,i)=>[names[i],pct(p.value),periodName(last.period)+' · frente a un año antes']));
      set('nota','Arriba de 0% = más que en los mismos meses del año anterior. Abajo de 0% = menos. Cada línea mide un registro distinto.');
      if(view==='credito') {
        const r=correlation(rows);
        set('resultado',r===null?'El periodo es corto para resumir la relación entre precio y financiamiento.':`En los ${rows.length} periodos comparados, precio y financiamiento de vivienda nueva ${Math.abs(r)<.3?'se mueven poco juntos en esta comparación':r>0?'tienden a cambiar en el mismo sentido':'tienden a cambiar en sentidos opuestos'}.`);
      } else set('resultado',`En ${periodName(last.period)}, la producción ${last.points[0].value>=0?'aumentó':'disminuyó'} ${f(Math.abs(last.points[0].value))}% frente a los mismos meses de un año antes.`);
    }
    if(view==='suelo') {
      const years=[...new Set(data.zones.flatMap(g=>g.points.map(p=>p.period)).filter(q=>/^\d{4}$/.test(q)))].sort();
      const all=fiscal(data.zones,$('desde').value,years.at(-1),$('extra').value);
      const mid=quantile(all.map(r=>r.value),.5);
      cards([['Zonas comparables',f(all.length),$('desde').value+' → '+years.at(-1)],['Cambio central',pct(mid),'La mitad quedó abajo; la mitad, arriba'],['Cambio más alto',pct(all[0].value),'Valor fiscal del suelo']]);
      set('resultado',`La mitad de las zonas comparables cambió ${f(mid)}% o menos. Las barras muestran los cinco cambios mayores y los cinco menores.`);
      set('nota','Cambios del valor fiscal por m². La longitud representa el tamaño del cambio; el signo + o − indica la dirección. Toca una zona para revisar sus valores.');
      const max=Math.max(...rows.map(r=>Math.abs(r.points[0].value)),1);
      rows.forEach((r,i)=>{
        const e=document.createElement('button');e.type='button';e.className='claro-zona';e.setAttribute('aria-pressed','false');
        const parts=r.name.split(' | '), name=parts.at(-1), where=parts.slice(0,-1).join(' · ');
        const head=document.createElement('span'),label=document.createElement('span'),n=document.createElement('strong'),small=document.createElement('small'),bar=document.createElement('i');
        label.textContent=name;n.textContent=pct(r.points[0].value);small.textContent=where+' · '+r.points[0].rows.map(p=>p.period+': $'+f(p.value)+'/m²').join(' → ');bar.className='barra';
        e.style.setProperty('--acento',r.points[0].value>=0?colors[0]:colors[1]);e.style.setProperty('--ancho',(100*Math.abs(r.points[0].value)/max)+'%');head.append(label,n);e.append(head,small,bar);
        e.addEventListener('click',()=>{selectObservation(i);$('evidencia-panel').open=true;});$('zonas').append(e);
      });
    }
    if(view==='oferta') {
      const vals=rows.map(r=>r.points[0].value),lo=rows[vals.indexOf(Math.min(...vals))],hi=rows[vals.indexOf(Math.max(...vals))];
      const suffix=unit.includes('/mes')?'/m² al mes':'/m²';
      cards([['Último precio anunciado','$'+f(last.points[0].value),suffix+' · '+periodName(last.period)],['Más alto en esta muestra','$'+f(hi.points[0].value),suffix+' · '+periodName(hi.period)],['Más bajo en esta muestra','$'+f(lo.points[0].value),suffix+' · '+periodName(lo.period)]]);
      set('resultado',names[0]+`: la muestra pasa de $${f(first.points[0].value)} a $${f(last.points[0].value)} ${suffix} entre ${periodName(first.period)} y ${periodName(last.period)}.`);
      set('nota','Pesos por metro cuadrado'+(unit.includes('/mes')?', cada mes de renta':' de venta')+'. Recorre las fechas para ver cómo cambia lo anunciado.');
    }
    if(view==='escenario') {
      const chosen=Number($('tasa').value);$('deslizador').value=String(chosen);
      const observed=rows.filter(r=>!r.points[0].scenario),anchor=observed.at(-1);
      cards([['Tu ritmo anual',pct(chosen),'Después de descontar inflación'],['Al cierre de '+last.period,f(last.points[1].value),'Índice · '+anchor.period+' = 100'],['Cambio acumulado',pct(last.points[1].value-100),'En '+$('horizonte').value+' años · supuesto']]);
      set('resultado',`Si el precio ${chosen>=0?'subiera':'bajara'} ${f(Math.abs(chosen))}% al año después de inflación, cada 100 puntos de ${anchor.period} serían ${f(last.points[1].value)} al cierre de ${last.period}.`);
      set('nota','Línea continua = historia. Línea punteada = futuro supuesto. Las referencias baja y alta son ritmos del pasado, no un rango probable.');
      const x=54+(Number(anchor.period)-first.i)/(last.i-first.i)*(484-54);
      const boundary=svg('line',{x1:x,x2:x,y1:17,y2:176,stroke:'#6c7970','stroke-dasharray':'3 4'});$('grafica').append(boundary);
    }
    set('origen',source+' · '+(view==='suelo'?$('desde').value+' → '+rows[0].points[0].rows.at(-1).period:span));
  }

  function display() {
    if (!data) return;
    const view = $('vista').value;
    const switching = mode !== view;
    mode = view;
    $('desde-label').hidden = view === 'oferta';
    $('extra-label').hidden = view === 'precio' || view === 'escenario';
    $('controles-escenario').hidden = view !== 'escenario';
    let rows = [], names = [], unit = '%', bars = false;
    const complete = [...data.price].sort(([a],[b]) => a.localeCompare(b));
    const from = $('desde').value;
    const start = from + '-T1';
    const updateExtra = (label, choices, fallback) => {
      set('extra-titulo', label);
      opts($('extra'), choices, switching ? fallback : $('extra').value);
      return $('extra').value;
    };

    if (view === 'precio') {
      const window = complete.filter(([q]) => q >= start);
      if (window.length) {
        const [q0, baseline] = window[0], [q1,last] = window.at(-1);
        const keys = ['shf','real','ipc'];
        rows = window.map(([q,r]) => ({ period:q, i:quarterIndex(q), points:keys.map(k => ({...r[k], value:r[k].value / baseline[k].value * 100, rows:[...r[k].rows,...baseline[k].rows]})) }));
        names = keys.map(k => labels[k]); unit='índice';
        subtitle('Cada serie arranca en 100 en el primer trimestre del filtro.', `Entre ${q0} y ${q1} el índice SHF cambió ${pct(100*(last.shf.value/baseline.shf.value-1))} nominal y ${pct(100*(last.real.value/baseline.real.value-1))} después de inflación.`, extremes(rows, 1) + ' El SHF mide vivienda con crédito hipotecario. Para deflactar se usa el promedio trimestral del INPC de la ciudad.');
      }
    }
    if (view === 'credito' || view === 'ruv') {
      const credit = view === 'credito';
      const choices = [[0,'Mismos 3 meses'],[1,'3 meses antes'],[2,'6 meses antes'],[3,'9 meses antes'],[4,'12 meses antes']];
      const lag = Number(updateExtra(credit ? 'Financiamiento de' : 'Registros de', choices.map(([k,v]) => [String(k),v.replace('Crédito o registro',credit?'Crédito':'Registro')]), '0'));
      const m = credit ? [split(complete,'real'),data.nueva,data.usada] : [data.produccion,data.registros,data.inventario];
      rows = join(m.map(changes), start, lag);
      names = (credit ? ['real','nueva','usada'] : ['produccion','registros','inventario']).map(k => labels[k]);
      if (lag) names[1] += ' · ' + (lag*3) + ' meses antes';
      const middle = Math.floor(rows.length * .65);
      const total = correlation(rows), early = correlation(rows.slice(0,middle)), late = correlation(rows.slice(middle));
      const explain = r => r === null ? 'muestra insuficiente' : f(r);
      const latest = rows.at(-1);
      const latestText = latest ? `Último trimestre común ${latest.period}. ${latest.points.map((p,i)=>names[i]+' '+pct(p.value)).join(' · ')}.` : '';
      subtitle('Variaciones contra el mismo trimestre del año anterior. Se usan sólo periodos comunes.', latestText || 'Sin periodos comunes con ese filtro.', `Correlación descriptiva entre las primeras dos series, r = ${explain(total)} (n=${rows.length}). Por rangos (Spearman), ${explain(rankCorrelation(rows))}. Tramo inicial ${explain(early)} (n=${middle}) y final ${explain(late)} (n=${rows.length-middle}). La dependencia entre observaciones en el tiempo y la prueba de varios rezagos pueden inflar asociaciones aparentes. ` +
        (credit ? 'Créditos son acciones reportadas. El índice hipotecario tiene un universo distinto.' : 'Registro y producción son flujos trimestrales. Inventario usa sólo el mes de cierre. Una vivienda registrada puede cambiar, cancelarse o tardar en producirse.'));
    }
    if (view === 'suelo') {
      const years = [...new Set(data.zones.flatMap(g => g.points.map(p=>p.period)).filter(q=>/^\d{4}$/.test(q)))].sort();
      opts($('desde'),years.slice(0,-1).map(y=>[y,y]),switching?'2024':from);
      const a=$('desde').value, b=years.at(-1);
      const regions = [...new Set(data.zones.map(g=>g.segment.split(' | ')[0]))].sort();
      const region = updateExtra('Región', [['','Todas'],...regions.map(r=>[r,r])], '');
      const all = fiscal(data.zones,a,b,region);
      if (all.length) {
        const top = [...new Set([...all.slice(0,5),...all.slice(-5)])];
        rows = top.map(({zone,value,a,b},i)=>({ period:String(i+1), name:zone, i, points:[{value, rows:[{...a,metric:labels.fiscal,unit:'MXN/m²'},{...b,metric:labels.fiscal,unit:'MXN/m²'}]}]}));
        names=['Cambio en valor fiscal']; bars=true;
        subtitle(`Misma región, clave y nombre en ${a} y ${b}. Cada barra corresponde a una zona del selector de observaciones.`, `${all.length} zonas comparables. Cambio mediano ${pct(quantile(all.map(r=>r.value),.5))}. Máximo ${pct(all[0].value)} en ${all[0].zone}.`, `Se muestran los cinco cambios mayores y los cinco menores. Mínimo ${pct(all.at(-1).value)} en ${all.at(-1).zone}. La variación fiscal puede reflejar una actualización administrativa. Zonas con claves distintas requieren homologación cartográfica.`);
      }
    }
    if (view === 'oferta') {
      const selected = Number(updateExtra('Segmento',data.ads.map((g,i)=>[String(i),g.segment]),String(data.ads.findIndex(g=>g.segment==='Casa · venta'))));
      const group = data.ads[selected];
      if (group) {
        const uniquePoints = unique([group], group.label);
        rows = [...uniquePoints.values()].filter(p=>/^\d{4}-\d{2}$/.test(p.period))
          .sort((a,b)=>a.period.localeCompare(b.period)).map(p=>({period:p.period,i:Number(p.period.slice(0,4))*12+Number(p.period.slice(-2)),points:[{value:p.value,rows:[p]}]}));
        names=[group.segment]; unit=group.unit;
        subtitle('Precio publicado por m² de la muestra del portal.', rows.length ? extremes(rows,0) : 'Sin periodos comparables.', 'La composición de los anuncios puede variar cada mes. La muestra no acredita cuánto se pagó al firmar.');
      } else subtitle('Precios anunciados del portal Lamudi por segmento.', 'Abre el CSV de Datos para cargar esta muestra.', 'Usa un solo segmento y unidad para evaluar cambios en el tiempo.');
    }
    if (view === 'escenario') {
      const s = scenarios(data.price,start);
      if (s.rates.length >= 8) {
        const p = [.25,.5,.75].map(q=>100*quantile(s.rates,q));
        const [anchor,last] = s.complete.at(-1);
        if (switching || !$('tasa').value) $('tasa').value=p[1].toFixed(1);
        const manual = $('tasa').valueAsNumber;
        const chosen = Number.isFinite(manual) ? Math.min(30,Math.max(-30,manual)) : p[1];
        $('tasa').value=String(chosen);
        const h = Number($('horizonte').value);
        const year = Number(anchor.slice(0,4));
        rows = s.complete.slice(-6).map(([q,n])=>({period:q.slice(0,4),i:Number(q.slice(0,4)),points:[0,1,2].map(()=>({value:100*n.real.value/last.real.value,rows:n.real.rows}))}));
        for(let t=1;t<=h;t++) rows.push({period:String(year+t),i:year+t,points:[p[0],chosen,p[2]].map(rate=>({value:100*(1+rate/100)**t,scenario:true,rows:last.real.rows}))});
        names=['Referencia histórica baja','Tu escenario','Referencia histórica alta']; unit='índice';
        subtitle(`Índice real ${anchor} = 100. Tasas históricas Q4 a Q4 de ${s.complete[0][0]} a ${anchor} (n=${s.rates.length}).`, `Con ${pct(chosen)} real anual, el índice llegaría a ${f(rows.at(-1).points[1].value)} al cierre de ${year+h}.`, `Los percentiles son tasas retrospectivas, sin probabilidad asignada. ${s.evaluations ? `Prueba a un año con mediana de los ocho cambios previos, error medio ${f(100*s.error)} puntos porcentuales vs. ${f(100*s.baseline)} manteniendo el precio real fijo (n=${s.evaluations}). ` : ''} El escenario usa variación compuesta constante y termina en un índice. Para años parciales, la referencia sigue siendo el último cuarto trimestre completo.`);
      } else subtitle('Escenarios con años completos y el último Q4 común.', 'Amplía el periodo para reunir ocho cambios anuales consecutivos por par.', 'Un historial corto hace inestable una tasa de referencia.');
    }
    if (!rows.length && ['suelo','precio'].includes(view)) subtitle('Comparación con registros verificados.', 'Sin observaciones comparables en el corte elegido.', '');
    current=rows;currentNames=names;currentUnit=unit;
    plot(rows,names,unit,bars);
    readable(view,rows,names,unit);
    opts($('evidencia'), rows.map((r,i)=>[String(i),r.name || r.period+(r.points[0].scenario?' · ancla del escenario':'')]),String(rows.length-1));
    if(rows.length) selectObservation(rows.length-1); else evidence();
  }

  function dateOptions() {
    const yearChoices = [...new Set([...data.price.keys()].sort().map(q=>q.slice(0,4)))].map(y=>[y,y]);
    opts($('desde'),yearChoices,year || '2014');
  }
  document.getElementById('historico').addEventListener('mercado:datos', event => {
    data=build(event.detail.series);
    mode=null;
    dateOptions();
    display();
  });
  for (const id of controls) $(id).addEventListener('change',()=>{
    if (id==='vista' && mode==='suelo') dateOptions();
    if (id==='desde' && mode!=='suelo') { year=$('desde').value; $('tasa').value=''; }
    display();
  });
  $('evidencia').addEventListener('change',()=>selectObservation(Number($('evidencia').value)));
  $('punto').addEventListener('input',()=>selectObservation(Number($('punto').value)));
  $('deslizador').addEventListener('input',()=>{ $('tasa').value=$('deslizador').value; display(); });
  $('tasa').addEventListener('input',()=>{ if($('tasa').value!=='' && $('tasa').validity.valid) display(); });
  $('ver-fuentes').addEventListener('click',()=>{ $('evidencia-panel').open=true; $('evidencia-panel').scrollIntoView({block:'nearest'}); });
  document.querySelectorAll('[data-vista]').forEach(button=>button.addEventListener('click',()=>{
    $('vista').value=button.dataset.vista;$('vista').dispatchEvent(new Event('change'));
  }));
  document.querySelectorAll('a[href="#explorar-datos"],a[href="#historico"]').forEach(a=>a.addEventListener('click',()=>{document.getElementById('explorar-datos').open=true;}));
  if(location.hash==='#historico') document.getElementById('explorar-datos').open=true;

  $('restablecer').addEventListener('click',()=>{ $('tasa').value=''; display(); });
})();
