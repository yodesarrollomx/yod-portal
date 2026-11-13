# Dictamen C01 · Pipeline RUV (Terra-1)

Astra-2 (segundo auditor) · cierre 2026-11-01T21:40Z (`date -u`). Muestreo con WebFetch entre 21:32Z y 21:39Z. Versión auditada: `01_base/f2-c01-pipeline/`:
- `series.csv` (mtime 21:28:29Z, 378 filas) y `notas.md` (21:29:36Z);
- `checkpoints.md` (21:29:40Z) y `fuentes.csv` (21:28:59Z);
- `datos_mensuales.csv` (21:23:30Z) y `datos_api.py` / `build_series.py` (21:28:29Z);
- `calculo_rezago.py` (21:24:08Z) y `calculo_rezago2.py` (21:25:51Z);
- `resultados_rezago.json` (21:24:41Z) y `resultados_rezago2.json` (21:25:52Z).

Criterios aplicados: `criterios-fase2.md` §0 y C01. Scripts propios: `scratchpad/astra2/c01_propio.py`, `c01_segmentos.py` y `c01_boot.py`, todos con `python3 -I`.

**Veredicto: RECHAZADO, con reentrega acotada.**

La transcripción no tiene fallas. Reabrí más de 150 valores y no hay ninguna discrepancia. Los meses suman el cubo anual con diferencia 0, y mi script reproduce el rezago y la tubería del productor sin diferencia.

El rechazo se debe a dos condiciones explícitas del criterio C01:
1. **Faltan las marcas de lote y el mensual por segmento.** Los lotes de registro no están marcados. El de abr-2026 son 1,548 viviendas «Popular hasta 200» de un total de 1,676; también hay lotes en ago-2025 (928) y oct-2025 (902). Tampoco se entregó el mensual por segmento que exige el criterio, aunque el API lo publica.
2. **La tubería que llega al motor está mal rotulada.** Las 6,091 viviendas mezclan segmentos: 54 % son registros Popular cuyo paso a DTU no se ha observado. Además, la cifra supone que toda vivienda registrada llega a DTU, cuando el mismo modelo estima que llega una fracción a = 0.68. Esto cambia números que entran a δs, así que no califica como corrección menor.

## A. Muestreo propio (0 discrepancias)
Para no leer la caché del productor, usé rangos y dimensiones distintos a los suyos.

| URL que abrí (SNIIV CuboAPI, 26/030) | Contra el CSV | Resultado |
|---|---|---|
| `GetRegistro/2026,2026/…/anio,mes,segmento` (20 objetos) | 7 meses de 2026 y los 4 `-segmento-acum` | iguales; **abr-2026: Popular hasta 200 = 1,548** de 1,676 |
| `GetVerificacion/2026,2026/…/anio,mes,segmento` (20) | 2026-05 = 1,701, 2026-06 = 1,260, Popular acum. = 2,983 y los otros 3 segmentos | iguales; may-2026: Popular = 1,552; jun-2026: 912 |
| `GetRegistro/2021,2022/…/anio,mes` (24) | 24 meses, incluidos 2021-08 = 1,348 y 2022-12 = 41 | 24/24 |
| `GetRegistro/2020,2020/…/anio,mes` y `GetVerificacion/2020,2020/…/anio,mes` | 11 meses cada una | 22/22; **abril ausente** en ambas |
| `GetProduccion/2025,2026/…/anio,mes` (19) | DTU mensual | 19/19 |
| `GetProduccion/2024,2025/…/anio,segmento` y `GetVerificacion/2023,2024/…/anio,segmento` | 20 filas de segmento | 20/20 |
| `Get{Registro,Verificacion,Produccion}/2022,2025/…/anio` | cubo anual: registro 2,252/2,211/3,045/5,657; verificación 1,477/1,688/2,295/4,590; DTU 1,667/1,704/1,981/2,386 | suma de meses = cubo, **±0** en 12 de 12 |
| `GetRegistro/{2021, 2024, 2025}/…/anio,mes,segmento` (42+37+40) | meses 2021, 2024 y 2025 y segmentos anuales 2021, 2024 y 2025 | cada mes suma el total del CSV; los 18 segmentos anuales, iguales |
| `GetProduccion/2025,2026/…/anio,mes,segmento` (79) | DTU mensual y los 5 `f2-dtu-segmento-acum` | iguales |
| PDF Informe RUV mar-2023 | 16/302/150 | literal: «(16díaspreparación,302construccióny150absorción)»; la fila de Sonora **no es legible** (los bloques de nombres y de números no se alinean) |

Abril de 2020 falta en registro y en verificación. Los 11 meses presentes suman el anual por segmento (2,069 y 2,047), así que el 0 `estimado` es correcto.

Hay además dos cruces independientes dentro de `series-integradas.csv`:
- `f2-dtu-mensual` es igual a `prod-dtu-ruv-mensual` (Fase 1, URL 2020,2026) en 79 de 79 meses, y a `f2-inv-dtu-mensual-ruv` (C02) en 43 de 43.
- `f2-registro-mensual` es igual a `reg-ruv-mensual` en 78 de 78 meses.

## B. Recálculo del rezago con script propio
- **Convolución gamma reimplementada** (CDF por `scipy.special.gammainc`, matriz de rezagos propia, ecuaciones 2022-07…2026-07). Reproduce al productor sin diferencia: forma 3 → μ = 14 con a = 0.678; formas 6 y 12 → μ = 10; forma 1.5 → μ = 24 con a = 0.728. Para verificación→DTU, 12, 9 y 23; para registro→verificación, μ = 2. Cumple ±1 mes y cociente ±5 %.
- **El valor «central» es una convención, no el mejor ajuste:**
  - El mínimo global es la forma 1.5 con μ = 24, y su SSE es 23 % menor que el de la forma 3 con μ = 14.
  - Los modelos a menos de 5 % del mínimo tienen todos forma 1.5 y μ de 15 a 36. **El 14 queda fuera de ese conjunto.**
  - Con el núcleo truncado a 48 meses, el mejor ajuste tiene media efectiva de 18.9 meses y mediana de 16.
- **Ventana:** con forma 3, el μ es 21 si la ventana empieza en 2022-01, 14 desde 2022-07, 16 desde 2023-01 y 20 desde 2024-01. El 14 es el extremo bajo.
- **Bootstrap:**
  - El del productor solo usa las formas 3 y 6, y excluye así la forma de mejor ajuste. `notas.md` no lo dice; la nota del CSV sí.
  - Mi bootstrap con las 4 formas (bloques de 6 meses, B = 400) da un rezago efectivo con mediana de **16.6 meses** (5–95 %: 9.9–22.3).
- **Método distinto** (acumulados con deserción y stock inicial, `CD_t = S0 + a·CR_{t−L}`, t = 2022-01…2026-07): L = **8 meses** (7–9), con a = 0.71 y S0 = 981. Para verificación→DTU, L = 7.
- **Lectura:** el rezago está poco identificado; según el método va de 8 a 24 meses. El rango 10–24 del productor deja fuera el 8, y su central de 14 queda abajo del mejor ajuste (16–19).

## C. Tubería y lotes (lo que llega a δs)
- Las cifras se reproducen: 12 m central/bajo/alto = 6,091 / 5,445 / 6,268, y cotas 4,737–7,623; 24 m = 7,051 / 5,675 / 7,929, y cotas 6,083–11,196.
- **Fracción que llega a DTU.** «Sin DTU» supone a = 1, pero el modelo estima a = 0.63–0.73. Las entregas esperadas de lo registrado en 12 meses serían a·pendiente = **4,132** (central), con 3,446–4,734 según el caso. Usar 6,091 como «entregas esperadas» infla δs en 47 %.
- **Peso de los lotes Popular** (según mis lecturas por mes y segmento):
  - Registros de los últimos 12 meses: 7,623, de los cuales 4,140 son Popular (158 + 200), es decir **54.3 %**, y 3,483 son del resto.
  - En 24 meses: 4,499 de 11,196 (40.2 %).
  - DTU Popular en los mismos 12 meses: **105 de 2,886 (3.6 %)**.
  - Las `a` y μ salen de un periodo con poco registro Popular. Aplicarlas a una tubería que es mayoritariamente Popular es extrapolar.
- **Lotes sin marcar:**
  - Registro: 2026-04 (1,548 Popular hasta 200), 2025-08 (928) y 2025-10 (902). Hay un lote mixto en 2021-08: 569 Popular y 681 Tradicional de un total de 1,348.
  - El lote de abr-2026 entra a verificación en may-2026 (1,552) y jun-2026 (912). Esos meses de verificación son el mismo lote.
  - **dic-2022 no es lote de registro:** ese mes solo hubo 41 registros. El pico de inventario de dic-2022 que menciona la Fase 1 no viene del registro, y el criterio debe leerse así.
- No se compara DTU con Q en niveles en ningún archivo: cumple.

## D. Contrato y proceso
- 14 columnas; ningún `serie_id` mezcla geografía ni unidad; los `-acum` llevan «Acumulado ene–07»; los nacionales y de Sonora tienen sufijo.
- Checkpoints de 21:19:20Z a 21:29:40Z, coherentes con el mtime de los archivos.
- `notas.md` tiene 888 palabras (tope ~800): no amerita corrección.
- Los valores de Sonora 13/254/66 son `por verificar` y provienen de un «primer pase» del lector que mi lectura tampoco pudo alinear. No deben quedar como número.

## E. Reinstrucciones

```
R-C01-1 | mayor (criterio C01: mensual por segmento) | responsable: Terra-1
hallazgo:   no hay series mensuales por segmento; el mensual entregado es el total.
evidencia:  GetRegistro/{2021,2024,2025,2026}/…/anio,mes,segmento y GetProduccion/2025,2026/…/anio,mes,segmento responden (21:32–21:39Z); en todos los meses los segmentos suman el total del CSV. Versión: series.csv 21:28:29Z.
corrección: f2-{registro,verificacion,dtu}-segmento-mensual 2020-01…2026-07 (etiqueta literal del API), validando que cada mes sume el total.
resolución: 3 series × 79 meses; la suma por mes = f2-*-mensual (±0).

R-C01-2 | mayor (criterio C01: lotes sin marcar) | responsable: Terra-1
hallazgo:   los lotes de registro no están marcados en las filas.
evidencia:  registro 2026-04 Popular hasta 200 = 1,548/1,676; 2025-08 = 928/1,144; 2025-10 = 902/945; 2021-08 = 569 Popular + 681 Tradicional /1,348. Verificación 2026-05 Popular = 1,552/1,701 y 2026-06 = 912/1,260 (mismo lote). Registro 2022-12 = 41.
corrección: nota «LOTE: n viviendas <segmento> en un mes» en esas filas (regla escrita, p. ej. ≥500 de un segmento en un mes); en notas.md: «dic-2022 no es lote de registro (41); el pico de inventario de dic-2022 no se explica por el registro».
resolución: grep "LOTE" ≥ 6 filas; la frase de dic-2022 en notas.md.

R-C01-3 | mayor (cifra que entra a δs) | responsable: Terra-1 (Sol decide qué entra al motor)
hallazgo:   la tubería «sin DTU» supone a = 1 y mezcla segmentos; 54 % es Popular, cuyo paso a DTU no se ha observado.
evidencia:  §C. 12 m: Popular 4,140 / resto 3,483 de 7,623; DTU Popular 105 de 2,886; a = 0.633 / 0.678 / 0.728; a·pendiente = 3,446 / 4,132 / 4,561 (con μ = 18 y forma 3: 4,734).
corrección: (a) filas f2-pipeline-*-sin-dtu-{popular,resto} para 12 y 24 m; (b) filas f2-pipeline-*-dtu-esperado = a·pendiente con su banda; (c) en la nota: «"sin DTU" no son entregas esperadas»; «Popular: conversión no observada; posible cartera Bienestar; posible duplicado con C03/C04 (cuenta el conjunto mayor)». No atribuir el lote a ningún programa.
resolución: popular + resto = total (±1) en cada ventana; existen las filas -dtu-esperado.

R-C01-4 | mayor (rótulo de una cifra que entra al motor) | responsable: Terra-1
hallazgo:   «central 14» no es el mejor ajuste y su sensibilidad está incompleta.
evidencia:  §B. Mejor ajuste forma 1.5 μ = 24 (media efectiva 18.9, mediana 16; SSE −23 % frente a forma 3); el 5 % cercano tiene μ 15–36; con forma 3 y otras ventanas, μ 14–21; método acumulado L = 8 (7–9); bootstrap con 4 formas: mediana 16.6 (9.9–22.3); el bootstrap del productor solo usa formas 3 y 6.
corrección: rango registro→DTU 8–24 meses; central rotulado «convencional (forma 3)», con el mejor ajuste (16–19) al lado; tabla de sensibilidad por ventana; bootstrap con las 4 formas o, si no, declarar la restricción en notas.md; lo mismo para verificación→DTU.
resolución: las filas f2-rezago-* y notas.md muestran el rango, la convención y la sensibilidad.

R-C01-5 | menor | responsable: Terra-1
hallazgo:   f2-ruv-lapso-*-sonora llevan números (13/254/66) que nadie pudo alinear con Sonora.
evidencia:  mi WebFetch del PDF (21:35Z): los bloques de nombres y de números no se alinean.
corrección: quitar las 3 filas y dejar el intento en notas.md, o dejar el valor vacío en las notas con «no legible».
resolución: 0 filas -sonora con valor no confirmado.

R-C01-6 | menor | responsable: Sol Integración
hallazgo:   la misma serie aparece con varios serie_id en series-integradas.csv.
evidencia:  f2-dtu-mensual = prod-dtu-ruv-mensual (79/79) = f2-inv-dtu-mensual-ruv (43/43); f2-registro-mensual = reg-ruv-mensual (78/78; la de Fase 1 no trae abr-2020). Versión: series-integradas.csv 21:38:32Z.
corrección: elegir un id canónico por etapa y que el motor lea solo ese (misma precondición que las claves prog-* duplicadas).
resolución: escenarios.py y construir_data.py leen un solo id por etapa.
```
