# C09 · Supuestos de escenarios 2027–2030 · notas (Terra-9; reentrega Terra-13, 2026-11-01)

`calculos.py` (`python3 -I`) genera `parametros.csv`, `supuestos.csv`, `probabilidades.csv` y `parametros-sensibilidad-hogares.csv` (corrida aparte: el motor rechaza `g_empleo` con `g_hogares`) desde `series-integradas.csv` (22:13Z, con las series mensuales por segmento de la C01 aceptada) y los dos `cartera.csv`; mismo sha256 en dos corridas. Cada valor es una **variación anual contra el año previo**. No se asigna probabilidad a ningún escenario.

**Nombres (R-C09-4, §2.3 v3).** Los ids `bajo/base/alto` no cambian porque el motor los exige; lo que muestran es lo que combinan:
- `alto` = **«más demanda y más oferta»**: todos los desplazadores que suben Q.
- `bajo` = **«menos demanda y menos oferta»**: todos los que la bajan.
- Son extremos de **Q**, no de **P**: **estos escenarios no acotan el precio.** P real cae en el «más demanda y más oferta» y sube en el «menos demanda y menos oferta». El rango de P lo dan los dos cruces que arma el motor (demanda de un extremo con oferta del otro), no estos tres puntos.

## 1. Cómo se arma cada escenario

**Demanda**
- `g_empleo` (Sonora, proxy estatal, R-C05-2): Δ dic/dic 2022–2025 = +2.22, +2.41, −1.06, −2.44. Base = mediana (+0.58); bajo −2.44; alto +2.41; la banda incluye 0. 2027–2030 tienen calidad **`supuesto`**: son una senda de escenario (R-C09-6). 2026 (sólo alimenta el techo) sigue como `estimado`: −0.69 a +2.66 %, base 0.97 %.
- `g_ingreso_real` = **ingreso por trabajador** = (1+actividad)/(1+empleo) − 1, el mismo concepto en los tres escenarios (R-C09-7). El PIB agregado ya trae el crecimiento del empleo, que entra aparte por e_ext.
  - Base = (1 + PIB mediana Banxico) ÷ (1 + 0.58 %) − 1 = **1.22 %** en 2027 y **1.41 %** en 2028–2030; antes era 1.80/2.00.
  - Bajo y alto = extremos 2022–2025 de ITAEE Sonora ÷ empleo Sonora (+0.08, +1.95, +0.87, +4.35): **+0.08 %** y **+4.35 %**. Ya no se mezclan ITAEE y salario real.
- `g_tasa_hip_rel`: sin cambio. Base 0; alto −2.02 %/año; bajo +4.2 % en 2027 (hasta el máximo observado de 10.42) y luego 0.
- Elasticidades: sin cambio. e_ext 1.0 [0.5–1.5]; e_y 0.8 [0.5–1.0]; e_r −0.39 [−0.6, −0.2]. En e_s, el rango «OCDE 0.30–2.05» queda rotulado **«atribuido al texto completo; no verificado»** (R-C09-8).

**Oferta** (universo DTU RUV; nunca ÷ Q)
- **Rango del DTU 2026e** (ene–jul ÷ participación ene–jul mín/mediana/máx 2021–2025):
  - total 2,674 / **3,013** / 3,589;
  - mercado 2,603 / **2,933** / 3,494.
- `s_pipeline` = **supuesto**, «la tubería no pasó el backtest C10».
  - **Universo** (R-C09-2): DTU de **mercado**, es decir, todos los segmentos menos las dos etiquetas Popular. «Económica» (≈1 vivienda/año) cuenta como mercado.
  - Variación observada: 2021 +55.0, 2022 −20.5, 2023 +8.7, 2024 +14.5, 2025 +26.3.
  - **Se excluye 2021 en los dos extremos.** Es el rebote sobre 2020, año del cierre COVID (sin registro ni verificación en abr-2020). Con 2021 incluido, el alto sería +55.0 y el bajo no cambiaría.
  - Rango de la tasa: **−20.5 % a +26.3 %**.
  - **Piso y tope son niveles observados** (R-C09-3, §2.4 v3 d):
    - piso = 1,450, el DTU de mercado de 2022;
    - tope = 3,494, el extremo alto del rango 2026e;
    - se retira el 3,806, que era producto de extremos.
  - Bajo: −20.5 %/año hasta el piso.
  - Alto: la tasa +26.3 % llevaría el nivel a 3,704, por encima del tope; **manda el nivel**, así que el alto queda en **+19.1 %** en 2027 y en 0 después. Sin el tope (es decir, con un «nivel no observado») sería +26.3 %.
  - Base = **referencia** con μ = 12, rotulado **«convención»** (el central de C01, extremo bajo de la sensibilidad por ventana): +5.5 % en 2027 y ≈0 después.
    - Con μ = 16: +10.8 %. Con μ = 18.5 (media efectiva del mejor ajuste): +13.5 % (2027).
    - Contraste en muestra, que no es validación: falla el signo de 2024 (−1.1 frente a +14.5).
- `s_cartera` = **incremental sobre pipeline**: el segmento Popular/Bienestar (§2).
- `s_inventario`:
  - base y alto: 0 (los meses de ventas RUV bajan 6.83 → 6.40 → 6.13);
  - bajo: −5.55 %, una vez, en 2027.
  - Se apila sobre la peor variación de mercado **sólo porque** el δs total de 2027 (−24.4 %) queda dentro del mínimo observado del DTU total (−26.6 %). La regla se declaró antes de correr.
  - No se puede descartar que la caída de 2022 ya trajera un ajuste de inventario: C02 no tiene 2022.
- **Techo (R-C09-5).** Usa el empleo de Sonora (proxy estatal), así que **su sesgo probable es a la baja**. Con el empleo de Hermosillo, el techo del base probablemente no se activa. En el escenario «más demanda y más oferta», **la Q de este escenario es el techo**: está activo los cuatro años.

**Probabilidades por etapa.** Sin cambio de método: registro→DTU 0.32 a 12 m y 0.60 a 24 m; inicio→DTU 0.51 y 0.83; meta = 0; las cifras son monótonas.

## 2. Cartera: qué entra y cómo se calibra (R-C09-1)
- **Entra sólo INFONAVIT Bienestar**, con las unidades de la versión anterior:
  - Altares: 1,400 en construcción, dentro de las 5,634 del programa (el conjunto mayor fija el valor);
  - 4,234 en proyecto;
  - parte vendida: 1.0.
- **No entran** (sin cambio): CONAVI, las 3,108, las 320, las metas, 20,861/20,000, la base privada de Sello H, CANADEVI, La Campiña y SolHara.
- **Calendario = fracción final con rezago**: entregas = a_c·F(h), con F = gamma verificación→DTU «mejor ajuste global» de C01 (μ = 23, forma 1.5). En proyecto: 0.5·a_c·F(h − 2 m).
  - Se quitó el cociente de flujo 0.374 multiplicado por otro rezago, que contaba el rezago dos veces.
- **Calibración**:
  - a_c = **0.0950** hace que el calendario, aplicado a todas las cohortes mensuales de verificación Popular observadas (2020-01…2026-07), dé **44.0 DTU Popular en ene–jul 2026 contra 44 observados** (diferencia 0 %; tolerancia ±10 %).
  - Prueba del auditor reproducida: el calendario anterior daba **106.6** sólo de la cohorte 2025, con cohorte uniforme en el año (101.9 con sus meses reales).
  - Con el calendario calibrado, la cohorte 2025 da 25.9.
- **Lo que no reproduce:** el DTU Popular de 2024 (24 contra 176) y de 2025 (21 contra 107).
  - El calendario describe a las cohortes 2025–26, que dominan. El flujo viejo venía de cohortes anteriores a 2020 o convertía más rápido.
  - Por eso el Popular 2026e (80/año) se conserva como nivel, y la cartera es incremental.
- **Resultado y amplitud:**

  | Caso | Entregas Popular 2027 | s_cartera 2027 |
  |---|---|---|
  | base (calibrado) | 199 | **+3.6 %** |
  | «menos demanda y menos oferta» (0 entregas de cartera) | 80 | +0.7 % |
  | «más demanda y más oferta» (cociente sin rezago, a 2021–2025 = 0.630, llena la cota de 625) | 625 | +14.8 % |

  - Sensibilidad del base 2027, que no entra al motor: de **+1.9 % a +14.7 %** según el rezago (μ 7/12/23 × forma 6/3/1.5, recalibrado cada vez), el a_pop sin calibrar o si las 5,634 fueran todas «en construcción». **El mínimo de la sensibilidad de la cartera es el escenario bajo (+0.7 %), no +1.9 %:** el +1.9 % sólo es el mínimo dentro del base (R-C09-11).
  - Dictamen: +2.1 % con a 2026 y +17.0 % con a 2021–2025, sobre la senda de mercado del base. Esa cifra corresponde al mismo nivel Popular de 625 del alto.
  - **Esta incertidumbre la cubre el par bajo–alto, no la banda del motor del base**, que sólo recorre elasticidades y arranque.
  - Lectura alternativa, no adoptada (R-C01-3 no permite atribuir las cohortes RUV al programa): si las cohortes RUV Popular 2025–26 fueran el programa, el calendario calibrado daría 137 entregas Popular en 2027 en vez de 199 (tabla), y s_cartera ≈ **+1.7 %** en vez de +3.6 %, todavía dentro del par bajo–alto (+0.7 a +14.8 %).
- **Riesgo de doble conteo.** El precio tope de VpB (862,000; ≈242 UMA) rebasa el límite Popular de 200 UMA. Si una parte de Bienestar se registra como «Tradicional», estaría en s_pipeline y en s_cartera a la vez.
- **Cota.** El DTU Popular anual no pasa del máximo observado (625, en 2020); el exceso se pasa al año siguiente.

## 3. Autoverificación (motor en memoria, sin escribir en `02_cruces`)
| Escenario | Año | δd | s_pipeline | s_cartera | s_inventario | δs total | P real / Q | Techo |
|---|---|---|---|---|---|---|---|---|
| menos d. y menos o. (bajo) | 2027 | −3.9 | −20.5 | +0.7 | −5.5 | −24.4 | 232.9 / 3,213 | no |
| | 2028 | −2.4 | −20.5 | +0.9 | 0 | −19.8 | 254.7 / 2,946 | no |
| | 2029 | −2.4 | −20.5 | +1.1 | 0 | −19.7 | 278.2 / 2,703 | no |
| | 2030 | −2.4 | −1.6 | +0.1 | 0 | −1.5 | 277.1 / 2,646 | no |
| base | 2027 | +1.6 | +5.5 | +3.6 | 0 | +9.3 | 201.9 / 3,752 | no (3,846) |
| | 2028 | +1.7 | +0.5 | −1.1 | 0 | −0.6 | 204.0 / 3,789 | no |
| | 2029 | +1.7 | +0.0 | −1.1 | 0 | −1.1 | 206.6 / 3,820 | no |
| | 2030 | +1.7 | +0.0 | −0.7 | 0 | −0.7 | 208.9 / 3,856 | no |
| más d. y más o. (alto) | 2027 | +6.8 | +19.1 | +14.8 | 0 | +36.7 | 181.0 / 3,981 | **sí** |
| | 2028 | +6.8 | 0 | 0 | 0 | 0 | 183.9 / 4,077 | **sí** |
| | 2029 | +6.8 | 0 | 0 | 0 | 0 | 186.8 / 4,175 | **sí** |
| | 2030 | +6.8 | 0 | 0 | 0 | 0 | 189.8 / 4,276 | **sí** |

Arranque 2026: P 208.8 y Q 3,609. La banda del base 2027 es P 186–207, que no contiene el arranque, y Q 3,439–3,846. **No son pronósticos ni rangos de P.**

**Prueba R-C09-3** (DTU total observado 2021–2025: −26.6 a +26.0):
- Bajo y base quedan dentro todos los años.
- **«Más demanda y más oferta» 2027: +36.7 %, 10.7 pp sobre el máximo.** Es el único excedente y se debe al Popular: pasa de 80 a 625, su máximo observado.
  - La novedad está documentada: verificación Popular (inicio de obra) de 1,384 en 2025 y 2,983 en ene–jul 2026, frente a un máximo anual de 904 en 2020–2024 (RUV), además del programa INFONAVIT de 5,634 (prensa).
- **Bienio** del «menos demanda y menos oferta» (2026→2028): −39.4 %, frente al peor bienio observado de −25.0 % (excede 14.4 pp).
  - La regla v3 c es anual, y lo acota el piso de nivel observado. Se declara, no se corrige.

## 4. Riesgos y lo que no se sostiene
- **No hay empleo municipal.** El proxy de Sonora cayó mientras Hermosillo crecía, así que el techo y δd probablemente quedan bajos.
- **Rezago y conversión no identificados.**
  - La referencia falla el signo de 2024.
  - La calibración Popular fija un solo momento: a y μ no se separan, de ahí la sensibilidad de +1.9 a +14.7 %.
- **El calendario de Bienestar es supuesto.** Sólo hay prensa, ninguna fecha de entrega, y no se sabe qué parte va a renta.
- **La cota Popular de 625 es un nivel observado, no una capacidad medida.**
- **El convenio de Sello H vence el 15-sep-2027.** Empuja hacia el bajo; no está cuantificado.

## Reentrega tras el dictamen (Terra-13, 22:19Z–22:33Z)
| R | Estado | Evidencia |
|---|---|---|
| R-C09-1 | **hecho** | a_c = 0.0950 reproduce 44.0 / 44 (0 %); prueba del auditor 106.6; ya no se multiplica un cociente por un rezago; base 2027 +3.6 % (antes +14.6); amplitud en notas y filas: bajo +0.7, alto +14.8, sensibilidad +1.9/+14.7; riesgo de las 200 UMA en las 12 filas de s_cartera. Regla declarada en checkpoints a las 22:25:56Z, antes de correr el motor. |
| R-C09-2 | **hecho** | Universo DTU de mercado; 2021 excluido en los dos extremos, con razón escrita; rango −20.5/+26.3; μ = 12 «convención»; μ 12/16/18.5 = +5.5/+10.8/+13.5 % en la nota del base. |
| R-C09-3 | **hecho, con un excedente anotado** | δs del bajo y del base dentro de −26.6/+26.0; alto 2027 +36.7 % con nota (10.7 pp, novedad Popular cuantificada); tope 3,494 y piso 1,450 = niveles observados; 3,806 retirado; rango 2026e declarado; freno justificado por la regla. Bienio del bajo declarado (−39.4 frente a −25.0). |
| R-C09-4 (notas) | **hecho** | «más demanda y más oferta» y «menos demanda y menos oferta», con «NO acota el precio», en las 50 filas de bajo y alto y en notas; ids sin cambio; grep «escenario alto|escenario bajo» = 0. El panel lo hace Sol. |
| R-C09-5 (notas y supuestos) | **hecho** | Rótulo del techo en q_max_hist, e_ref y e_ultimo de supuestos.csv y en las 15 filas de g_empleo; «la Q de este escenario es el techo» en el alto, comprobado con el motor (techo activo 2027–2030). Base: el techo ya no se activa. |
| R-C09-6 | **hecho** | Calidad de g_empleo 2027–2030 = `supuesto` (12); 2026 = `estimado`. |
| R-C09-7 | **hecho** | Ingreso por trabajador = (1+PIB)/(1+g_empleo) − 1; bajo y alto del mismo concepto (ITAEE ÷ empleo). |
| R-C09-8 | **hecho (rótulo)** | e_s: «rango del texto completo, no verificado»; valores sin cambio, porque vienen de `02_cruces/supuestos.csv`. |
| R-C09-9 | no es de C09 | Sol. `escenarios.py` y sus salidas cambiaron a las 22:19:22Z, fuera de esta entrega. |
