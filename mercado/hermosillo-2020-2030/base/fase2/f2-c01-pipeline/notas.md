# Notas C01 · Pipeline RUV (registro → verificación → DTU), municipio Hermosillo (26/030)

Terra-1, reentrega Terra-11 · 2026-11-01 · corte de fuente 2026-07-31 · `series.csv` = 1,372 filas (1,207 observado, 160 estimado, 2 supuesto, 3 declarado, 0 por verificar).

## Qué se obtuvo
- **Mensual 2020-01 a 2026-07** (79 meses) de registro, verificación y DTU (`anio,mes`), y **mensual por segmento** (`anio,mes,segmento`, etiqueta literal del API: Popular hasta 158, Popular hasta 200, Tradicional, Económica, Residencial, Residencial plus, Media), leído con WebFetch año por año (21 URLs, 856 objetos, `segmento_mensual_raw.txt`). Un segmento ausente en un mes = 0 (el API omite combinaciones sin viviendas).
- Anual 2020–2026 por segmento; 2026 va como `-segmento-acum` (ene–jul).
- **Controles (`valida_segmentos.py`, `verifica_entrega.py`):** en las 3 etapas, la suma de segmentos de cada mes = total mensual (±0, 79/79) y la de los 12 meses de cada año = segmento anual (±0). Abril 2020 no existe en registro ni verificación (el API omite meses sin registros): 0 `estimado`.

| Año | Registro | Verificación | DTU |
|---|---|---|---|
| 2022 | 2,252 | 1,477 | 1,667 |
| 2023 | 2,211 | 1,688 | 1,704 |
| 2024 | 3,045 | 2,295 | 1,981 |
| 2025 | 5,657 | 4,590 | 2,386 |
| 2026 ene–jul | 4,064 | 4,516 | 1,665 |

## Definiciones (citas cortas)
- **Verificación** (SNIIV, corte 31-jul-2026): «indican el año y mes en que las viviendas comenzaron su proceso de verificación»; es **inicio de verificación (≈ inicio de obra)**.
- **Producción:** «Las viviendas en etapa de Producción son las que obtuvieron el Dictamen Técnico Único (DTU) durante el mes de referencia.»
- Informe Estratégico RUV mar-2023: medianas **nacionales** de 16 días de preparación, 302 de construcción y 150 de absorción (`declarado`); ninguna cifra es municipal.

## Lotes de registro (regla escrita)
Lote = ≥500 viviendas de un mismo segmento en un mes. Marcados con «LOTE» en la nota y en `f2-registro-lote-indicador` (0/1, 79 meses): 2021-08 (569 Popular hasta 200 y 681 Tradicional de 1,348), 2025-08 (928 de 1,144), 2025-10 (902 de 945), 2025-12 (587 Media de 659), **2026-04 (1,548 «Popular hasta 200» de 1,676)** y 2026-07 (507 Tradicional de 925). El umbral es convencional: con ≥800 quedan solo 2025-08, 2025-10 y 2026-04. **dic-2022 no es lote de registro (41); el pico de inventario de dic-2022 no se explica por el registro.** may–jun 2026 suman 2,464 verificaciones Popular hasta 200: absorben el lote de abr-2026 y ~900 registros Popular anteriores (del orden del lote de ago-2025); sin datos individualizados no se asigna una verificación a un lote. La regla también marca verificación 2025-12 (864 Popular) y 2021-08. No se atribuye ningún lote a un programa.

## Rezago (rango 8–24 meses; el central es una convención)
Registro→DTU, ecuaciones 2022-07…2026-07 salvo donde se indica:

| Método | Resultado |
|---|---|
| Convolución gamma, forma 3 (**convención**) | μ = 14 (a = 0.678) |
| Gamma, mejor ajuste global (forma 1.5) | μ = 24; media efectiva 18.9 (mediana 16), núcleo truncado a 48 meses; forma 3 tiene 1.23× su SSE |
| Forma 3 según inicio de ventana | 2022-01: 21 · 2022-07: 14 · 2023-01: 16 · 2024-01: 20 |
| Acumulados con deserción y stock inicial, CD = S0 + a·CR(t−L) | L = 8 (7–9), a = 0.71, S0 = 981 |
| Bootstrap, bloques de 6 meses, B = 400, **4 formas** | rezago efectivo mediana 17.1 (5–95 %: 9.0–22.3) |
| Bootstrap restringido a formas 3 y 6 (el del productor anterior), misma medida | mediana 13.0 (6.9–27.1); excluye la forma de mejor ajuste |

Verificación→DTU: forma 3 μ = 22/12/15/19 por ventana; mejor ajuste forma 1.5 μ = 23 (media efectiva 18.5); acumulados L = 7 (6–8); bootstrap 4 formas mediana 13.9 (7.0–22.3); rango 7–23. Registro→verificación ≈ 2 meses. La correlación cruzada no identifica pico estable. El rezago está poco identificado: registro irregular, DTU casi de capacidad (140–280 al mes), nada observado antes de 2020 y registros que quizá nunca se construyen.

## Tubería al corte (2026-07): «sin DTU» no son entregas esperadas
«Sin DTU» supone que toda vivienda registrada llega a DTU (a = 1). Las entregas esperadas son a(segmento) × pendiente. Últimos 12 meses, caso central (μ = 14, forma 3); bajo–alto entre paréntesis:

| | Registradas | DTU en la ventana | Sin DTU (a = 1) | a | Entregas esperadas |
|---|---|---|---|---|---|
| Total | 7,623 | 2,886 | 6,091 (5,445–6,268) | 0.678 (0.633–0.728) | **4,132** (3,446–4,561) |
| Popular | 4,140 | 105 | 3,134 | 0.106 / 0.435 / 0.792 | 331 / 1,364 / 2,481 |
| Resto | 3,483 | 2,781 | 2,957 | 0.792 | 2,341 (2,134–2,501) |

Popular + resto = total (±1) en cada caso y ventana. **4,132 reproduce la cifra del auditor** (6,091 × 0.678). La suma por segmento (2,672 a 4,822, según la conversión Popular) contiene al 4,132, que usa una a común calibrada con un DTU 94 % no Popular (2022-07…2026-07). Conversión Popular: observada solo en cohortes 2020–2024 (437 DTU); no observada en los lotes 2025–26; las tres a son (i) ventana completa, que es piso porque los lotes recientes aún no son exigibles, (ii) ecuaciones hasta 2025-07 (437 DTU) y (iii) supuesto de igualdad con el resto. 24 meses: sin DTU 7,051 (Popular 3,247, resto 3,804); esperadas 4,784 (3,592–5,770). Posible cartera Bienestar; posible duplicado con C03/C04 (cuenta el conjunto mayor). La banda no incluye la forma 3 con μ = 18: con ella serían 4,734 (12 m) y 5,803 (24 m).

## No se obtuvo
Días promedio SNIIV (carga dinámica); DTU→venta; registros y DTU 2013–2019; **fila de Sonora del Informe RUV**: la extracción del PDF separa nombres y números en bloques que no se alinean, y un primer pase dio tres números que ningún segundo pase confirmó (no legible; sin valor ni fila en `series.csv`).

## Hallazgos para el auditor
1. Reabrir `f2-registro-segmento-mensual` 2026-04 (1,548), 2025-08 (928), 2025-10 (902) y verificación 2026-05 (1,552).
2. Recalcular `f2-pipeline-registradas-12m-dtu-esperado` (4,132) y las filas `-popular`/`-resto`.
3. Las tres a Popular son un rango, no una medición. Por R-C10-3 (dictamen-C10), la tubería no alimenta al motor de escenarios: es dato y contexto. Si alguien vuelve a derivar s_pipeline de estas filas, el dictamen de reentrega deja de valer.

## Reentrega tras el dictamen
- **R-C01-1 hecha.** `f2-{registro,verificacion,dtu}-segmento-mensual`, 2020-01…2026-07, 79 meses cada una (858 filas; 2020-04 de registro y verificación con una fila `n/a` = 0). Suma por mes = `f2-*-mensual` (±0, 79/79 × 3) y suma anual = `f2-*-segmento`: `verifica_entrega.py`, 0 fallas.
- **R-C01-2 hecha.** 28 filas con «LOTE» (grep); `f2-registro-lote-indicador` (6 meses = 1; 2022-12 = 0); frase de dic-2022 en esta nota.
- **R-C01-3 hecha.** Filas `-sin-dtu-{popular,resto}` y `-dtu-esperado` (+ `-resto`, `-popular`, `-popular-cota-min/max`, `f2-conversion-a-*`) para 12 y 24 m; popular + resto = total (±1); nota «sin DTU no son entregas esperadas».
- **R-C01-4 hecha.** Rango 8–24, convención rotulada, mejor ajuste (18.9 / 16), sensibilidad por ventana y bootstrap de 4 formas: filas `f2-rezago-*` (`-rango-min/-max`, `-mejor-ajuste-*`, `-bootstrap4-*`, `-forma3-ventana-*`) y tabla anterior. Mi bootstrap da mediana 17.1 con B = 400 (9.0–22.3) y 16.6 con B ≥ 600, frente al 16.6 (9.9–22.3) del auditor: es ruido de Monte Carlo sobre una distribución discreta; la mediana cae entre dos valores discretos, ±1 mes.
- **R-C01-5 hecha.** 0 filas `-sonora`; el intento queda arriba. Respaldo previo: `04_auditoria/c01-series-antes-reentrega.csv`.
