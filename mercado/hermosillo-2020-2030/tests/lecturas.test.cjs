const test = require('node:test');
const assert = require('node:assert/strict');
const market = require('../lecturas.js');

const point = (period, value) => ({ period, value });
test('Los flujos y la inflación exigen los tres meses, el stock usa el cierre', () => {
  const partial = new Map([['2025-01',point('2025-01',5)],['2025-03',point('2025-03',10)]]);
  assert.equal(market.quarterly(partial,'sum').size,0);
  assert.equal(market.quarterly(partial,'close').get('2025-T1').value,10);
  partial.set('2025-02',point('2025-02',6));
  assert.equal(market.quarterly(partial,'sum').get('2025-T1').value,21);
  assert.equal(market.quarterly(partial,'mean').get('2025-T1').value,7);
});

test('Los conflictos de fuente no se resuelven seleccionando el mayor valor', () => {
  const group = { label:'Valor', place:'Hermosillo · municipio', evidence:'verificado', points:[point('2020',5),point('2020',8),point('2021',6),point('2021',6)] };
  assert.deepEqual([...market.unique([group],'Valor').keys()],['2021']);
  const zones = ['Región 01 | 1A | CENTRO','Región 01 | 1B | CENTRO'].map((segment,i) => ({
    segment,points:[point('2024',100+i*100),...(i === 0 ? [point('2026',120)] : [])],
  }));
  const matched = market.fiscal(zones,'2024','2026','Región 01');
  assert.equal(matched.length,1);
  assert.ok(Math.abs(matched[0].value-20)<1e-10);
});

test('Las tasas interanuales y el rezago guardan las observaciones de origen', () => {
  const series = new Map([['2024-T1',{value:100,rows:[point('2024-03',100)]}],['2025-T1',{value:120,rows:[point('2025-03',120)]}],['2025-T2',{value:80,rows:[]}]]);
  const change=market.changes(series);
  assert.deepEqual([...change.keys()],['2025-T1']);
  assert.equal(change.get('2025-T1').rows.length,2);
  const earlier=new Map([['2024-T4',{value:5,rows:[]}]]);
  assert.equal(market.join([change,earlier],'2025-T1',1)[0].points[1].value,5);
  assert.equal(market.join([change,earlier],'2025-T1').length,0);
});
