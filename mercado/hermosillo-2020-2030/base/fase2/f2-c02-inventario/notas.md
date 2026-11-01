# C02 · Inventario terminado (SNIIV/RUV, municipio 26/030) — notas

Consulta: 2026-11-01. Archivos: `series.csv` (653 filas: 396 observado, 245 estimado, 12 por verificar; tras el dictamen, ver la sección final), `fuentes.csv`, `checkpoints.md`.

## Qué se obtuvo
- **Inventario por avance de obra**, 28 cortes mensuales 2024-03..2026-07, más 2022-12 y 2023-12 como contexto de los picos. En los 30 cortes la suma de las 10 categorías es igual al total municipal (`/municipio`) leído por separado. Los totales de 2022-12 (7,334), 2024-12 (3,186), 2025-12 (5,335) y 2026-07 (8,227) coinciden con el dictamen de la Fase 1.
- **Segmento** en dic-2022, dic-2023, dic-2024, dic-2025, jul-2026 (más sep y nov-2025 como control). Cada corte suma su total.
- **DTU mensual** 2023-01..2026-07 (43 meses). Las sumas anuales 2023–2025 (1,704 / 1,981 / 2,386) coinciden con `prod-dtu-ruv` de la Fase 1.
- Cuando una categoría falta en el JSON (p. ej. "Sin reporte" en 2024-03) se escribió 0 con `calidad=estimado`, porque las demás ya suman el total. No es un 0 leído.

## Definición de HBT: NO está documentada literalmente
Revisados sin encontrar "HBT": glosario SNIIV (dos lecturas), páginas Cubo/Inventario, Dashboard/Oferta, Días de inventario y Datos abiertos (primeros 100,000 de 135,356 caracteres; el tramo final lo leyó el auditor Astra y tampoco trae HBT), manual RUV "Registro de oferta en conjunto sembrado", manual del verificador RUV, y varias búsquedas web.

Lo que sí dice el SNIIV (https://sniiv.sedatu.gob.mx/Cubo/Inventario, citado en fragmentos de ≤100 caracteres):
> "El inventario de vivienda es el conjunto de viviendas con estatus vigente en el Registro Único de Vivienda (RUV) o que obtuvieron su Dictamen Técnico Único los últimos 24 meses y cumplen otras características de avance." / "Los criterios que se utilizan para considerar que una vivienda se encuentra en inventario es haber iniciado su proceso de verificación u obtener su dictamen de habitabilidad y no haber sido vendida."

Glosario p. 2: "Avance de obra: Es el grado de progreso en una meta de construcción para algún producto de vivienda."

**Lectura propuesta (INFERENCIA):** HBT = dictamen (técnico) de habitabilidad en el RUV, es decir obra terminada y dictaminada. "−5m" y "+5m" serían emitido hace menos o más de 5 meses (el umbral no está documentado). "Sin HBT" queda ambiguo (¿sin dictamen aún?). Prueba de compatibilidad: en los 28 meses, HBT total ≤ DTU de los últimos 24 meses, y desde 2024-12 (ventana completa) el cociente es 0.28–0.34. Es condición necesaria, no prueba.

## Series derivadas (estimado)
- `f2-inv-terminado-proxy` = HBT−5m + HBT+5m (cota inferior). `-amplio` suma "Sin HBT" (cota superior).
- `...-meses-dtu12` = «meses de dictaminación (stock HBT ÷ DTU mensual prom. 12 m)»: proxy ÷ (DTU de los 12 meses que terminan en el corte, inclusive, ÷ 12). Es cobertura de **producción**, no de ventas ni de absorción; no es el semáforo.
- `...-meses-ventas-ruv12` (nuevas, R-C02-1) = proxy ÷ (ventas RUV de 12 m ÷ 12), con ventas = viviendas INFONAVIT deduplicadas (Individual + (Conyugal + Unamos)/2) + FOVISSSTE vivienda nueva. **Es la serie del semáforo de exceso de oferta**; cota superior.

| Corte | Total | Proxy | % del total | Amplio | Meses de dictaminación (proxy / amplio) | Meses a ritmo de ventas RUV (proxy / amplio) | Sin reporte + Avance 0 |
|---|---|---|---|---|---|---|---|
| 2024-12 | 3,186 | 1,241 | 39.0% | 1,286 | 7.5 / 7.8 | 6.83 / 7.08 | 397 |
| 2025-06 | 4,196 | 1,260 | 30.0% | 1,319 | 7.0 / 7.3 | no calculado (ventana sin meses 2024 en esta construcción) | 625 |
| 2025-12 | 5,335 | 1,373 | 25.7% | 1,476 | 6.9 / 7.4 | 6.40 / 6.88 | 1,586 |
| 2026-07 | 8,227 | 1,456 | 17.7% | 1,586 | 6.1 / 6.6 | 6.13 / 6.68 | 3,696 |

El proxy se mueve entre 864 (2024-03) y 1,479 (2026-05). El crecimiento del total a 8,227 viene de obra sin avance reportado, no de vivienda con dictamen.

## Lotes de registro
Regla propia: Δ(Sin reporte + Avance 0) ≥ +500 mes contra mes. Marcados: **2025-12** (+1,013; "Sin reporte" 157→1,069 y se vacía en 2026-01 a 210), **2026-05** (+1,347; 1,824) y **2026-06** (+1,052; 2,665). En 2026-07 "Sin reporte" sigue en 2,641 (32% del total): ese lote no se ha reclasificado. Saltos moderados no marcados: 2024-08 (+349), 2026-02 (+280). Contexto: dic-2022 (7,334) tenía 2,152 en "Avance 0" (29%), frente a 463 en dic-2023.

## Contradicciones y anomalías
1. **2025-11 es copia exacta de 2025-09** en avance_obra, total (4,400) y segmento; 2025-10 es distinto (4,536). Las filas leídas de 2025-11 siguen `observado` con la nota «idéntico a 2025-09 en la fuente»; las derivadas (proxy, meses, sin-avance, delta, flag, más el control de suma y el cero implícito de «Económica») pasaron a `por verificar` (R-C02-2).
2. **2024-01, 2024-02 y 2024-04 devuelven `[]`** en municipio, avance_obra y estado (dos intentos). Hueco del cubo; filas `por verificar` sin valor solo en `f2-inv-total`.
3. 2026-08 devuelve `[]` (corte más reciente: 2026-07).
4. El campo `año` viene en 0; el periodo solo viene de la URL.
5. La herramienta de lectura (WebFetch) pasa por un modelo intermedio que a veces parafrasea. 2024-06 se releyó limpio. El cierre suma=total en 30/30 cortes protege contra errores de transcripción.

## Límites
- "No vendida" depende del registro RUV: una vivienda vendida fuera de él puede seguir en inventario. Esto no se verificó. Metodología SNIIV (cita reabierta por el auditor, dictamen-fase1 §5): «No es posible individualizar los financiamientos con crédito privado»; por eso el inventario puede seguir contando viviendas vendidas con banca o de contado (sesgo al alza, sobre todo en Media y Residencial).
- El inventario excluye DTU de más de 24 meses.
- Los rangos de segmento (glosario pp. 19–20) están en veces UMA, no en MXN.

## Hallazgos para el auditor (reabrir primero)
1. `GetInventario/2026,7/26/030/avance_obra`: "Sin reporte" 2,641, HBT−5m 510, HBT+5m 946, Sin HBT 130.
2. `GetInventario/2025,11/...` contra `2025,9/...`: ¿copia en la fuente?
3. `GetInventario/2025,12/26/030/avance_obra`: "Sin reporte" 1,069 (lote).
4. `GetInventario/2024,4/26/030/avance_obra` (también 2024,1 y 2024,2): ¿realmente vacío?
5. Texto de https://sniiv.sedatu.gob.mx/Cubo/Inventario, para decidir si "dictamen de habitabilidad" equivale a HBT.

## Correcciones tras el dictamen
Dictamen de Astra (`04_auditoria/dictamen-C02.md`); copia previa en `04_auditoria/c02-series-antes-correcciones.csv`; script `correcciones_dictamen.py` (se corre con `python3 -I`; parte siempre de esa copia). No cambió ningún valor leído.
- **R-C02-1.** Las series `...-meses-dtu12` se renombran «meses de dictaminación (stock HBT ÷ DTU mensual prom. 12 m)» y su nota las declara cobertura de producción. Nuevas: `f2-inv-terminado-proxy{,-amplio}-meses-ventas-ruv12` = proxy ÷ (ventas RUV 12 m ÷ 12), `estimado`, cota superior (fuente derivada F2C02-08). Cortes: dic-2024 (con el anual 2024) y dic-2025..jul-2026 (con los meses); 9 cortes × 2 series. Insumos de `series-integradas.csv`; comprobaciones: el anual 2024 y el dedup publicado 2024/2025 cuadran, y la suma de los 12 meses a dic-2025 es el anual 2025. Recálculo (proxy / amplio), idéntico al del auditor ±0.01:

| Corte | Ventas RUV 12 m | Proxy | Amplio |
|---|---|---|---|
| dic-2024 | 2,179 (1,905 + 274) | 6.83 | 7.08 |
| dic-2025 | 2,575 (2,346 + 229) | 6.40 | 6.88 |
| jul-2026 | 2,850 (2,595 + 255) | 6.13 | 6.68 |

  Es cota superior: lo vendido con banca sigue como «no vendido» en RUV mientras el denominador excluye la banca. El denominador Q (con CNBV) sigue prohibido. 2025-01..2025-10 no se calculan por decisión del dictamen (el 2024 mensual solo se usó para comprobar el anual).
- **R-C02-2.** 2025-11 duplica 2025-09 en la fuente. Las filas leídas siguen `observado` con la nota «idéntico a 2025-09 en la fuente»; las 9 filas derivadas de 2025-11 (proxy, amplio, 2 de meses, sin-avance, delta, flag, y por extensión el control `f2-inv-avance-suma` y el cero implícito de `f2-inv-segmento-economica`) pasan a `por verificar` y quedan fuera de tendencias y semáforo: 0 `estimado` en 2025-11. El delta de 2025-12 se reporta también contra 2025-10 (+998) en su nota y localizador; la marca de lote de 2025-12 se mantiene.
- **R-C02-3.** `f2-inv-lote-registro-flag`: unidad «indicador 0/1». F2C02-05 pasa a «leída» (el tramo final lo leyó el auditor; `avance_obra` = «Indica el progreso de construcción de la vivienda al momento del reporte», sin HBT). Cita de la metodología SNIIV «No es posible individualizar los financiamientos con crédito privado» en las notas de proxy y proxy-amplio (56 filas), de las series ventas-ruv12 y en Límites.
- R-C02-4 (definición de HBT) no es de este chunk: el rótulo sigue siendo «inferencia».
