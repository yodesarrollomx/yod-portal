'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCSV, readSeries, periodDate, sourceLink } = require('../historico.js');

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
    's,Producción,1,viviendas,2021-13,mensual,Hermosillo,municipio,nueva,observación,INEGI,,,observado',
  ].join('\n');
  const data = readSeries(csv);
  assert.equal(data.accepted, 5);
  assert.equal(data.omitted, 2);
  assert.equal(data.series.length, 4);
  const group = data.series.find(series => series.points.length === 2);
  assert.deepEqual(group.points.map(point => point.value), [0, 1220.35]);
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
