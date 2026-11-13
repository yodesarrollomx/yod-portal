# C06 · Población y hogares 2020–2030 · Hermosillo (Terra-7, 2026-11-01)

Archivos: `series.csv` (212 filas), `fuentes.csv`, `checkpoints.md`. Cálculos con `python3 -I` (script en el scratchpad de la sesión: `c06_calc.py` y `c06_write.py`).

## Qué se obtuvo
1. **Proyección CONAPO municipal (declarado).** Hermosillo: 2025 = 1,028,894; 2030 = 1,099,323; 2035 = 1,162,905; 2040 = 1,220,389. Se leyó en el resumen de COESPO Sonora, que cita «Reconstrucción y proyecciones de la población de los municipios de México 1990-2040 (CONAPO)», la fuente no indica la fecha de referencia dentro del año (la convención de mitad de año no está impresa en los PDF de COESPO y no se verificó; edición no indicada). La página de CONAPO describe esa serie como reconstrucción 1990-2020 más proyección con base en las proyecciones nacionales y estatales 2020-2070.
2. **Observado INEGI.** Censo 2020: población 936,263 y viviendas particulares habitadas 278,550. **Encuesta Intercensal 2025 (INEGI, 22-sep-2026, referencia 15-oct-2025): Hermosillo 962,020** personas en viviendas particulares (31.76% de Sonora). Sonora: 3,028,969 en viviendas particulares + 20,920 en colectivas/sin vivienda = 3,049,889; 981,430 viviendas habitadas; 3.1 ocupantes por vivienda (3.3 en 2020; 3.7 en 2010; 4.1 en 2000).
3. **Hogares censales.** Sonora 2020 = 876,333 (INEGI) = viviendas particulares habitadas. Hermosillo 2020 = 278,550 por identidad (hogar censal = vivienda particular habitada, INEGI), `estimado`; municipiodata solo corrobora. Población en hogares de Hermosillo (COESPO, cita Censo): 927,042 (2020) y 768,060 (2010).

## Método de los hogares estimados
- Tamaño 2020 de Hermosillo = 927,042 ÷ 278,550 = **3.3281** (`estimado`, cociente de dos cifras censales).
- Trayectoria 2021–2030, siempre `supuesto`: constante (3.3281); tendencia central −0.040/año (pendiente de Sonora 2010–2020, y 2020–2025 con cifras redondeadas); tendencia rápida −0.050/año (Sonora 2020–2025 sin redondear: 3.3374 → 3.0863). Se aplica la pendiente de Sonora a Hermosillo porque no hay serie municipal de ocupantes.
- Hogares(t) = población en hogares(t) ÷ tamaño(t). Banda: **bajo** = tamaño constante; **alto** = tendencia rápida; **central** = −0.040. Todo hogar estimado depende de ese supuesto.
- Dos rutas de población: (A) CONAPO (total × 0.99015, fracción en hogares de 2020; 2026–2029 interpolado geométrico; 2021–2024 puente híbrido Censo 2020→CONAPO 2025); (B) **anclada en la EIC 2025** (tasa 2020–2025 de población en hogares = 0.743% anual, extrapolada a 2030 como supuesto). Series `…-eic`.
- Hogares nuevos = diferencia anual. No es demanda de vivienda nueva ni déficit.

## Contradicciones (ambos valores)
- **CONAPO 2025 = 1,028,894 vs INEGI EIC 2025 = 962,020** (el conteo EIC es 6.5% menor; CONAPO queda 6.9% por encima, o 5.9% si se ajusta CONAPO a población en hogares). A nivel Sonora: CONAPO 3,140,762 vs EIC 3,049,889 (−2.9%). Crecimiento 2020–2025: CONAPO implica 1.90% anual desde el Censo; INEGI da 0.74% (población en hogares) o 0.54% (población total del Censo contra población en viviendas particulares de la EIC: conceptos distintos, no comparable). El crecimiento de CONAPO 2025–2030 es 1.33% anual.
- Efecto en hogares 2030 (central): ruta CONAPO 371,742 vs ruta EIC 340,944 (−8.3%).
- Artefacto: la ruta CONAPO tiene un salto en hogares nuevos entre 2025 (10,123) y 2026 (8,616) porque el puente 2021–2025 crece 1.9% y CONAPO 2026–2030 crece 1.3%.

## Qué NO se obtuvo
- Serie anual CONAPO 2020–2040 por municipio (XLSX por entidad en gob.mx/conapo): la página no expone enlaces; conapo.segob.gob.mx, datos.gob.mx, el visor de Sonora y la API de DataMéxico (robots_disallowed) no abrieron; DataMéxico no trae proyecciones. Por eso 2021–2024 es puente y 2026–2029 interpolación.
- Proyección oficial de hogares de CONAPO para Sonora: no se halló (COESPO no la publica en los PDF leídos).
- Tabulado municipal de hogares censales de INEGI (se usa la identidad con las viviendas particulares habitadas); promedio municipal de ocupantes por vivienda publicado por INEGI (ficha de Hermosillo, p. 76 del Panorama sociodemográfico de Sonora 2020: no llega por WebFetch); ocupantes por vivienda de Hermosillo 2010, 2015, 2020 y 2025 (el Panorama sociodemográfico de Sonora 2020, p. 76, no abrió completo; la EIC 2025 solo da población municipal en las láminas leídas). No hay tendencia municipal del tamaño; se usa la de Sonora.
- 2015 (Encuesta Intercensal) municipal: no abierto.

## Hallazgos para el auditor
1. Reabrir `eic2025_presentacion_26.pdf`, lámina «POBLACIÓN POR MUNICIPIO»: Hermosillo 962,020.
2. Reabrir COESPO `Hermosillo.pdf`: 1,028,894 (2025) y 1,099,323 (2030) y la cita CONAPO.
3. Reabrir `cpv2020_pres_res_son.pdf`: 278,550 (viviendas), 936,263, hogares censales Sonora 876,333, ocupantes 3.7 → 3.3.
4. Reabrir COESPO AVGM p. 5: 927,042 (¿es población en hogares?) y municipiodata 278,550 (¿hogares censales municipales en tabulado INEGI?).
5. Comprobar `EIC2025-def_Son.pdf`: 981,430 viviendas y 3.1 ocupantes. Verificar la fórmula del tamaño 2020 (3.3281) y que la banda alta/baja use los tamaños correctos.

## Correcciones tras el dictamen (Terra-12, 2026-11-01; copia previa en 04_auditoria/c06-series-antes-correcciones.csv)
- **R-C06-1 hecho, con un pendiente.** `f2-hogares-censales` (Hermosillo 2020, 278,550) pasa de `por verificar` a `estimado` (identidad) con fuente INEGI: hogares censales = viviendas particulares habitadas por definición, comprobado en Sonora (876,333 = 876,333); municipiodata solo corrobora. `f2-viv-part-habitadas-hermosillo` dice «= hogares censales por definición; no equivale a hogares por gasto común». El localizador de `f2-tamano-hogar` cita INEGI y justifica el numerador (927,042 = ocupantes de viviendas particulares habitadas). `f2-tamano-hogar-sonora` pasa a «personas por vivienda». Ya no quedan los rótulos contradictorios de antes sobre viviendas y hogares, ni filas `por verificar`. **Pendiente:** el promedio municipal publicado por INEGI (ficha de Hermosillo, p. 76 del Panorama sociodemográfico de Sonora 2020) no se pudo leer; fuente nueva F2C06-11 con estado «no abre».
- **R-C06-2 hecho.** El 2,944,840 de 2020 es población total: vive en `f2-poblacion-total-sonora` (observado, Censo 2020). `f2-poblacion-viv-part-sonora` queda solo con 2025 (3,028,969): la lámina por entidad no permitió confirmar el 2020 comparable y no puse fila.
- **R-C06-3 hecho.** Las 6 series de hogares y las 6 de hogares nuevos pasan a `supuesto` de 2021 a 2030 (nota «Senda de escenario; no es dato»). Los 2020 siguen `estimado` (identidad con las viviendas habitadas).
- **R-C06-4 hecho (registro).** `f2-poblacion-hogares-eic-ruta` y las series de hogares de la ruta EIC registran las dos tasas: 0.743 % por año calendario nominal (5 años) y 0.665 % con fechas de referencia (15-mar-2020 a 15-oct-2025, 5.59 años; recalculado). La elección es de C09; `supuestos.csv` no es de este chunk y no se tocó.
- **R-C06-5 hecho (justificación; sin reordenar).** La central (−0.040) se justifica como la pendiente decenal de Sonora en 2000→2010 y 2010→2020 (4.1→3.7→3.3, cada una admite ±0.010); la reciente sin redondear (−0.0502 por año nominal, −0.0450 con fechas) queda como «rápida» porque mezcla tendencia y un posible quiebre entre censo (conteo) y encuesta (EIC, levantamiento 6-oct a 14-nov-2025). «Universos no idénticos» se reemplazó por esa descripción. Terra-9 decide la senda.
- **R-C06-6 hecho.** Ruta A renombrada: `f2-hogares-estimados-conapo{,-bajo,-alto}` y `f2-hogares-nuevos-anuales-conapo{,-bajo,-alto}`; en 2021–2024 variable y nota dicen «población: puente híbrido Censo 2020→CONAPO 2025, no CONAPO; contradicho por la EIC 2025» (cero «población CONAPO» en esas filas). «A mitad de año» se quitó (no está en los PDF de COESPO). La lámina se llama «POBLACIÓN POR MUNICIPIO». Se retiró la cifra alterna de viviendas atribuida a municipiodata (no figura en la página citada).
- Ningún valor cambió (comparado por script contra la copia previa). Nadie en 02_cruces ni 03_visual lee los ids viejos (grep).

