'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCSV, readSeries, periodDate, sourceLink, defaultSeries } = require('../historico.js');

const header = 'serie_id,indicador,valor,unidad,periodo,frecuencia,geografia,nivel_geo,segmento,naturaleza,fuente,url,referencia,estado';

test('lee CSV de Sheets con BOM, CRLF, comillas duplicadas y saltos en celdas', () => {
  assert.deepEqual(parseCSV('\uFEFFa,b\r\nx,"fila 4, ""cita""\r\nsegunda"\r\n'), [['a','b'], ['x','fila 4, "cita"\r\nsegunda']]);
  assert.throws(() => parseCSV('a,b\nx,"interrumpido'), /termina dentro/);
  assert.throws(() => parseCSV('a,b\nx,"valor"resto'), /comillas fuera/);
});

test('preserva cero, separa geografía y unidad, y distingue estados', () => {
  const csv = [
    header,
    's,Producción,0,viviendas,2023,anual,Hermosillo,municipio,nueva,observación,INEGI,,Celda A4,verificado',
    's,Producción,"1,220.35",viviendas,2024,anual,Hermosillo,municipio,nueva,observación,INEGI,,,verificado',
    's,Producción,5,viviendas,2024,anual,Hermosillo,ciudad,nueva,observación,INEGI,,,verificado',
    's,Producción,7,créditos,2024,anual,Hermosillo,municipio,nueva,observación,INEGI,,,verificado',
    's,Producción,5,viviendas,2024,anual,Hermosillo,municipio,nueva,observación,INEGI,,,declarado',
    's,Producción,,viviendas,2022,anual,Hermosillo,municipio,nueva,observación,INEGI,,,por verificar',
    's,Producción,1,viviendas,2023 especial,anual,Hermosillo,municipio,nueva,observación,INEGI,,,verificado',
  ].join('\n');
  const data = readSeries(csv);
  assert.equal(data.accepted, 6);
  assert.equal(data.omitted, 1);
  assert.equal(data.undated, 1);
  assert.equal(data.series.length, 4);
  const group = data.series.find(series => series.points.length === 3);
  assert.deepEqual(group.points.map(point => point.value), [0, 1220.35, 1]);
  assert.equal(group.points[2].period, '2023 especial');
  assert.equal(group.points[2].date, null);
  assert.equal(group.points[0].reference, 'Celda A4');
});

test('rechaza formato mal formado y listas sin observaciones utilizables', () => {
  assert.throws(() => readSeries('id,nombre\n1,Hermosillo'), /pestaña Datos/);
  assert.throws(() => readSeries(`${header}\n1,2,3`), /cantidad incorrecta/);
  assert.throws(() => readSeries(header + ',' + 'serie_id'), /repetidas/);
  assert.throws(() => readSeries(header), /valor numérico/);
});

test('fechas comparables válidas y enlaces sin ejecución ni credenciales', () => {
  assert.equal(periodDate('2026-Q3'), periodDate('2026-07-01'));
  assert.equal(periodDate('2026-T3'), periodDate('2026-07-01'));
  assert.equal(periodDate('2026-01/2026-08'), periodDate('2026-08-31'));
  assert.equal(periodDate('2026-09/2026-08'), null);
  assert.equal(periodDate('2026-00/2026-08'), null);
  assert.equal(periodDate('2026 especial'), null);
  assert.equal(periodDate('2025-02-29'), null);
  assert.equal(sourceLink('javascript:alert(1)'), '');
  assert.equal(sourceLink('https://clave:secreto@example.com'), '');
  assert.equal(sourceLink('https://www.inegi.org.mx/punto'), 'https://www.inegi.org.mx/punto');
});

test('elige el índice SHF municipal de la Hoja con identificador generado', () => {
  const data = readSeries([
    header,
    'otro,Índice SHF de precios de vivienda,100,índice,2024,anual,Sonora,estado,nueva,índice hipotecario,SHF,,,verificado',
    'serie-generada,Índice SHF de precios de la vivienda con crédito hipotecario,100,índice,2024,anual,Hermosillo,municipio,total,índice hipotecario,SHF,,,verificado',
    'variacion,Variación anual del índice SHF,10,%,2024,anual,Hermosillo,municipio,nueva,variación,SHF,,,verificado',
  ].join('\n'));
  assert.equal(data.series[defaultSeries(data.series)].series, 'serie-generada');
});
