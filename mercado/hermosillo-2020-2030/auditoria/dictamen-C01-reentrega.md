# Dictamen C01 · reentrega · Pipeline RUV (Terra-11)

Astra-4 (tercer auditor, independiente) · cierre 2026-11-01T22:08Z (`date -u` 22:08:51Z). Muestreo con WebFetch entre 22:00:43Z y 22:02:08Z. Versión auditada: `01_base/f2-c01-pipeline/`:
- `series.csv` (mtime 21:59:37Z, 1,372 filas) y `notas.md` (21:59:52Z);
- `checkpoints.md` (22:00:06Z) y `fuentes.csv` (22:00:06Z);
- `build_series.py` (21:59:36Z), `valida_segmentos.py` (21:53:23Z) y `verifica_entrega.py` (21:58:42Z);
- `calculo_rezago3.py` (21:56:38Z), `resultados_rezago3.json` (21:56:40Z) y `segmento_mensual_raw.txt` (21:53:13Z);
- versión anterior: `04_auditoria/c01-series-antes-reentrega.csv` (21:51:40Z, 378 filas).

Criterios aplicados:
- `criterios-fase2.md` §0, C01 y §2.4–2.5;
- `dictamen-C01.md`, reinstrucciones R-C01-1 a R-C01-5 (R-C01-6 es de Sol y no se evalúa aquí);
- `dictamen-C10.md`, R-C10-3: C01 se juzga como **dato y contexto**, no como insumo de δs.

Scripts propios: `scratchpad/astra4/c01r_propio.py` y `c01r_boot400.py`, con `python3 -I`. Solo leen `series.csv` y mis transcripciones; no usan los insumos ni el código del productor. La convolución está reimplementada con `scipy.special.gammainc`.

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.**

Las reinstrucciones R-C01-1 a R-C01-5 están cumplidas:
- Reabrí 508 valores mensuales por segmento y no hay ninguna discrepancia.
- Todas las sumas cuadran con diferencia 0.
- Mi script reproduce cada cifra derivada sin diferencia.
- Ningún valor de la versión anterior cambió.

Quedan tres correcciones de calidad y de nota que no cambian ningún número:
1. Dos filas que descansan en un supuesto van rotuladas `estimado`.
2. Las notas no recogen R-C10-3 y todavía dicen que Sol decide qué entra a δs.
3. La frase «mismo lote» sobre la verificación de may–jun 2026 no cuadra con la aritmética. Además, la banda de entregas esperadas omite la sensibilidad por ventana.

**Por qué es corrección menor y no rechazo:**
- El rótulo `estimado` de las dos filas está un nivel por encima de lo que corresponde. Pero su propia nota dice «Supuesto… No es observado», así que el lector no queda engañado.
- Por R-C10-3, ninguna cifra de C01 llega a δs. Aplica entonces la cláusula de §0: «calidad que no cambia ningún número que llegue al motor».
- **Si alguien vuelve a derivar `s_pipeline` de estas filas, este dictamen deja de valer.**

## A. Muestreo propio (508 valores, 0 discrepancias)
Pedí rangos de dos años; el productor pidió `{año},{año}`, así que no pude leer de su caché. En cada año abierto comprobé además que el CSV no tenga pares (mes, segmento) de más ni de menos.

| URL que abrí (SNIIV CuboAPI, `26/030/anio,mes,segmento`) | Contra `f2-*-segmento-mensual` | Resultado |
|---|---|---|
| `GetRegistro/2022,2023` (71 objetos) | 24 meses; 2022-12 = Media 30 + Residencial 11 = **41** | 71/71 |
| `GetRegistro/2025,2026` (60) | los 5 lotes de 2025–26: 2025-08 Popular hasta 200 = 928, 2025-10 = 902, **2025-12 Media = 587**, 2026-04 Popular hasta 200 = 1,548, **2026-07 Tradicional = 507** | 60/60 |
| `GetVerificacion/2021,2022` (85) | 2021-08: Tradicional 786 y Popular hasta 200 590 | 85/85 |
| `GetVerificacion/2024,2025` (85) | 2025-12: Popular hasta 200 = 864 | 85/85 |
| `GetProduccion/2020,2021` (99) | 2020-04 trae 5 segmentos (el DTU sí existe ese mes) | 99/99 |
| `GetProduccion/2023,2024` (108) | 24 meses | 108/108 |

La muestra cubre:
- cada etapa en 4 años distintos;
- todos los años de 2020 a 2026;
- las 7 etiquetas del API: Popular hasta 158, Popular hasta 200, Tradicional, Económica, Media, Residencial y Residencial plus.

## B. R-C01-1 · mensual por segmento (cumple)
- **Cobertura.** Las 3 series tienen 79 meses (2020-01…2026-07) y ningún hueco; tampoco hay huecos en 2022-01…2026-07. En abril de 2020, registro y verificación llevan una fila `n/a` = 0 `estimado`: el API omite ese mes, y los 11 meses presentes suman el anual.
- **Segmentos contra total.** La suma de los segmentos es igual a `f2-*-mensual` en 79 de 79 meses en las 3 etapas (±0).
- **Meses contra anual.**
  - Los 12 meses de cada segmento suman `f2-*-segmento` (±0).
  - Ene–jul 2026 suma `-segmento-acum` (±0).
  - Los segmentos que aparecen en el anual y en el mensual son los mismos.
- **Cubo anual 2022–2025** (valores reabiertos por Astra-2):

  | Etapa | 2022 | 2023 | 2024 | 2025 |
  |---|---|---|---|---|
  | Registro | 2,252 | 2,211 | 3,045 | 5,657 |
  | Verificación | 1,477 | 1,688 | 2,295 | 4,590 |
  | DTU | 1,667 | 1,704 | 1,981 | 2,386 |

  La suma de los meses y la suma de las series por segmento coinciden con el cubo, **±0 en 12 de 12** casos.

## C. R-C01-2 · lotes (cumple; la regla es aceptable)
- **La regla reproduce los seis meses.** Con ≥500 viviendas de un segmento en un mes, mi script marca exactamente los mismos meses de registro:

  | Mes | Lote | Total del mes |
  |---|---|---|
  | 2021-08 | 569 Popular hasta 200 y 681 Tradicional | 1,348 |
  | 2025-08 | 928 Popular hasta 200 | 1,144 |
  | 2025-10 | 902 Popular hasta 200 | 945 |
  | 2025-12 | 587 Media | 659 |
  | 2026-04 | 1,548 Popular hasta 200 | 1,676 |
  | 2026-07 | 507 Tradicional | 925 |

  Para 2022-12, el indicador vale 0 y la frase pedida está en `notas.md` y en la fila. Hay 28 filas con «LOTE». Con ≥800 quedan 2025-08, 2025-10 y 2026-04, como dice la nota.
- **Dictamen sobre la regla: aceptable**, incluidas las marcas de 2025-12 (Media) y 2026-07 (Tradicional).
  - Es escrita y reproducible, incluye los tres lotes obligatorios y declara la alternativa ≥800.
  - **No es arbitraria en el margen.**
    - En las 254 celdas mes×segmento de registro no hay ningún valor entre 372 y 506. Los mayores no marcados son 371 (Media 2024-12), 328, 322 y 314.
    - Por eso, cualquier umbral entre 372 y 507 marca los mismos 6 meses.
    - En verificación, el hueco va de 381 a 589.
  - Las dos marcas nuevas son concentraciones atípicas para su segmento:
    - Media en 2025–26 no pasa de 275 en ningún otro mes.
    - Tradicional en ene–jun 2026 no pasa de 257.
  - 2026-07 queda solo 1.4 % sobre el umbral, así que es la marca más frágil. La nota ya da la sensibilidad.
  - La marca es una nota más un indicador 0/1 `estimado`: no cambia ningún valor.
- **Error de contexto heredado de Astra-2.**
  - `notas.md` dice: «El lote de abr-2026 entra a verificación en may-2026 (1,552) y jun-2026 (912): mismo lote, dos meses».
  - Pero 1,552 + 912 = **2,464** verificaciones Popular hasta 200, contra 1,548 registradas en abr-2026.
  - El saldo Popular registrado y no verificado era 983 al cierre de mar-2026. Ese saldo incluye el lote de ago-2025 (928), que no muestra verificación grande antes. En jun-2026 el saldo baja a 71.
  - Es decir, may–jun absorben el lote de abril **y** unos 900 registros Popular anteriores.
  - La frase viene de mi predecesor (R-C01-2, «mismo lote»). Es una nota y no un número, pero hay que corregirla (R-C01R-3a).

## D. R-C01-3 · tubería (cumple; falta un rótulo)
**Cifras reproducidas sin diferencia** (gammainc propio, ecuaciones 2022-07…2026-07):
- **12 meses.**
  - Registradas: 7,623 = Popular 4,140 + resto 3,483. DTU: 2,886 = 105 + 2,781.
  - Sin DTU, que **no** son entregas esperadas:

    | Caso | Total | Popular | Resto |
    |---|---|---|---|
    | central | 6,091 | 3,134 | 2,957 |
    | bajo | 5,445 | 2,696 | 2,749 |
    | alto | 6,268 | 3,274 | 2,994 |

    Diferencia entre Popular + resto y el total: 0.
  - **Entregas esperadas con a común: 4,132** (a = 0.678); banda 3,446 (a = 0.633) – 4,561 (a = 0.728).
  - Resto: 2,341 (2,134–2,501).
  - Popular: 331 / 1,364 / 2,481.
- **24 meses.**
  - Sin DTU: 7,051 = 3,247 + 3,804.
  - Esperadas: 4,784 (3,592–5,770).
  - Popular: 343 / 1,413 / 2,571.
  - En el caso bajo, 2,730 + 2,945 = 5,675: la diferencia de 1 viene del redondeo y entra en ±1.
- **Conversión Popular:** 0.106 con la ventana completa, 0.435 con ecuaciones hasta 2025-07 (437 DTU Popular), y 0.792, que es la a del resto. El DTU Popular es el 6.4 % del DTU de las ecuaciones.

**Rótulos:**
- 0.106 y 0.435 salen de un ajuste a datos, así que `estimado` es correcto. El 0.106 está rotulado «piso, no conversión medida».
- 0.792 es `estimado` correcto **como a del resto**. Aplicado a Popular es un supuesto; la propia nota lo dice: «Supuesto: Popular convierte como el resto… No es observado».
  - Aun así, las filas `-dtu-esperado-popular-cota-max` (2,481 y 2,571) llevan `estimado`.
  - CONTRATO-F2 pide `supuesto` para los supuestos propios (R-C01R-1).
- La nota de `-dtu-esperado-popular` se contradice: dice «Es la única conversión Popular observada» y, unas líneas después, «Popular: conversión no observada».

**Banda:**
- La banda de 3,446–4,561 solo varía la forma.
- Con forma 3 y μ = 18 salen 4,734 (12 m) y 5,803 (24 m), fuera de la banda. Astra-2 ya había citado el 4,734.
- La sensibilidad por ventana de la propia entrega lleva la forma 3 hasta μ = 21 (R-C01R-3b).

**Frases obligatorias y R-C10-3:**
- Las frases de R-C01-3(c) están: «sin DTU no son entregas esperadas», «posible cartera Bienestar», «posible duplicado con C03/C04 (cuenta el conjunto mayor)» y ningún lote atribuido a un programa.
- **Falta alinear las notas con R-C10-3.**
  - `notas.md` dice «Sol decide cuál entra a δs».
  - Las filas `-dtu-esperado` dicen «Es la cifra a comparar con "entregas esperadas"».
  - Ni `notas.md` ni `series.csv` mencionan el backtest C10 (R-C01R-2).

## E. R-C01-4 · rezago (cumple)
**Gamma, por ventana.**
- Mi reimplementación da, con forma 3: μ = 21 / 14 / 16 / 20 en registro→DTU y 22 / 12 / 15 / 19 en verificación→DTU, con ventanas que empiezan en 2022-01 / 2022-07 / 2023-01 / 2024-01.
- Mejor ajuste: forma 1.5, μ = 24, a = 0.728, media efectiva 18.9 y mediana 16. La forma 3 tiene 1.228 veces ese SSE.
- El conjunto a menos de 5 % del mínimo tiene μ de 15 a 36 y solo forma 1.5.

**Acumulados.**
- Registro→DTU: L = 8 (7–9), con a = 0.712 y S0 = 981.
- Verificación→DTU: L = 7 (6–8).
- Todo coincide con las filas y con `notas.md`.

**Rótulos y métodos.**
- Rango 8–24 (verificación 7–23).
- El central va rotulado «convencional, forma 3» en `variable` y «CONVENCIÓN» en la nota.
- Están reportados la gamma por forma y por ventana, el mejor ajuste, los acumulados, el bootstrap de 4 formas, el bootstrap restringido y la correlación cruzada, esta última como no identificante.

**Bootstrap: 17.1 frente a 16.6. Los dos son correctos; la causa no es solo la semilla.**
- Con la semilla del productor (20261101) y B = 400, mi implementación da **17.1 (9.0–22.3)**, exacto.
- Con la misma semilla y B = 600 o B = 2,000 da **16.6** (9.0–22.3). Con las semillas 7 y 11 también da 16.6.
- La mediana cae justo en el salto entre forma 1.5 con μ = 19 (media efectiva 16.6) y con μ = 20 (17.1). El acumulado en 16.7 es 0.488 con B = 400 y 0.507 con B = 2,000.
- La diferencia es ruido de Monte Carlo sobre una distribución discreta y queda dentro de ±1 mes. La nota la atribuye solo a la semilla (R-C01R-3c).
- Verificación→DTU: con B = 400 reproduzco 13.9 (7.0–22.3); con B = 2,000 da 14.1 (8.0–22.3).
- Bootstrap restringido a las formas 3 y 6: 13.0 (7.0–27.1), frente a 13.0 (6.9–27.1) del productor.

**Observación sin reinstrucción.**
- El extremo 24 es el μ nominal; su media efectiva es 18.9, y la fila lo dice.
- Con ventanas que empiezan en 2022-01 o en 2024-01, el mejor μ es 25. El extremo depende de la ventana, pero la diferencia queda dentro de ±1 mes.

## F. R-C01-5 y comparación con la versión anterior (cumple)
- No quedan filas `-sonora` ni con `geografia = Sonora`, y ninguna está `por verificar`. El intento de lectura queda en «No se obtuvo».
- Hay 375 filas comunes con la versión anterior (clave `serie_id` + `segmento` + `periodo`):
  - **0 valores cambiados**, 0 cambios de calidad y 0 de unidad o geografía.
  - Solo cambian 6 `variable`, todos rótulos del rezago: «central / bajo / alto» pasan a «convencional, forma 3 / extremo estrecho, forma 6 / mejor ajuste global, forma 1.5». Es lo que pedía R-C01-4.
- Se quitaron las 3 filas `-sonora` y se agregaron 997 filas nuevas.

## G. Contrato y proceso
- **Contrato.**
  - 14 columnas y ninguna clave duplicada.
  - Calidades: 1,207 `observado`, 162 `estimado` y 3 `declarado`, como declara `notas.md`.
  - Ningún archivo compara DTU con Q en niveles.
- **Checkpoints** de 21:51:28Z a 22:00:06Z, coherentes con el mtime de los archivos:

  | Archivo | mtime | Checkpoint |
  |---|---|---|
  | `segmento_mensual_raw.txt` | 21:53:13Z | 8 |
  | `resultados_rezago3.json` | 21:56:40Z | 10 |
  | `notas.md` | 21:59:52Z | 12 |
  | `checkpoints.md` | 22:00:06Z | cierre |

- **Fuentes.** `F2C01-99` lista los scripts nuevos.
- **Extensión.** `notas.md` tiene 1,103 palabras (tope ~800). Eso solo no amerita corrección, pero las correcciones de abajo deben hacerse sin alargarla.

## H. Reinstrucciones

```
R-C01R-1 | menor (calidad; no llega al motor por R-C10-3) | responsable: Terra-11
hallazgo:   dos filas que dependen de un supuesto van como `estimado`; una nota se contradice sobre si la conversión Popular está observada.
evidencia:  f2-pipeline-registradas-12m-dtu-esperado-popular-cota-max = 2,481 y -24m- = 2,571, calidad estimado; su nota: «Supuesto: Popular convierte como el resto, a=0.792. No es observado». CONTRATO-F2: supuestos propios → `supuesto`. f2-pipeline-registradas-{12m,24m}-dtu-esperado-popular: «Es la única conversión Popular observada» junto a «Popular: conversión no observada». Versión: series.csv 21:59:37Z.
corrección: calidad `supuesto` en las 2 filas -popular-cota-max. En las filas -dtu-esperado-popular, en f2-conversion-a-registro-dtu-popular-cohortes-previas y en notas.md: «conversión Popular observada solo en cohortes 2020–2024 (437 DTU); no observada en los lotes 2025–26».
resolución: las 2 filas en `supuesto`; grep "única conversión Popular observada" = 0; valores sin cambio.

R-C01R-2 | menor (nota; evita que la tubería vuelva a δs) | responsable: Terra-11
hallazgo:   las notas no recogen R-C10-3: dicen que Sol decide qué a Popular entra a δs y presentan -dtu-esperado como «la cifra a comparar con "entregas esperadas"».
evidencia:  notas.md, «Hallazgos para el auditor», punto 3 («Sol decide cuál entra a δs»); notas de las 6 filas f2-pipeline-*-dtu-esperado{,-bajo,-alto}; grep "C10|backtest" = 0 en notas.md y series.csv. dictamen-C10, R-C10-3: s_pipeline no se deriva de registro→DTU con rezago fijo.
corrección: en notas.md y en las filas f2-pipeline-* y f2-conversion-a-*: «Contexto, no insumo de δs: la tubería registro→DTU con rezago fijo no pasó el backtest C10 (R-C10-3)». Quitar «Sol decide cuál entra a δs».
resolución: grep "R-C10-3" en notas.md y en esas filas; grep "cuál entra a δs" = 0.

R-C01R-3 | menor (nota) | responsable: Terra-11
hallazgo:   (a) «mismo lote, dos meses» no cuadra para la verificación de may–jun 2026; (b) la banda de entregas esperadas omite la sensibilidad por ventana; (c) la diferencia 17.1/16.6 se atribuye solo a la semilla.
evidencia:  (a) verificación Popular hasta 200: may-2026 1,552 + jun-2026 912 = 2,464, contra 1,548 registradas en abr-2026; el saldo Popular registrado sin verificar era 983 al cierre de mar-2026 (incluye el lote de ago-2025, 928) y baja a 71 en jun-2026. (b) forma 3 con μ = 18: 4,734 (12 m) y 5,803 (24 m), fuera de 3,446–4,561 y de 3,592–5,770; la forma 3 por ventana llega a μ = 21. (c) con la semilla 20261101: 17.1 con B = 400 y 16.6 con B = 600 y B = 2,000; la mediana cae en el salto entre forma 1.5 μ = 19 (16.6) y μ = 20 (17.1).
corrección: (a) «may–jun 2026 suman 2,464 verificaciones Popular hasta 200: absorben el lote de abr-2026 y ~900 registros Popular anteriores (del orden del lote de ago-2025); sin datos individualizados no se asigna una verificación a un lote». (b) En notas.md y en las filas -dtu-esperado: «la banda solo varía la forma; con forma 3 y μ = 18 serían 4,734 (12 m) y 5,803 (24 m)». (c) «17.1 con B = 400; 16.6 con B ≥ 600; es ruido de Monte Carlo sobre una distribución discreta». Sin alargar notas.md.
resolución: grep "mismo lote" = 0 en notas.md; las tres frases presentes; valores sin cambio.
```

R-C01-6 (ids canónicos en `series-integradas.csv`) sigue a cargo de Sol y no forma parte de esta reentrega.
