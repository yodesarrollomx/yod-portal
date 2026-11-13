# Preregistro del backtest (C10) · Hermosillo 2020–2030

Terra-8 · 2026-11-01 · escrito ANTES de calcular cualquier resultado del backtest. La hora real y el hash SHA-256 de este archivo se anotan en `checkpoints.md` justo después de guardarlo. Lo que se corra después de esa hora y cambie algo de lo escrito aquí es **sensibilidad** y se rotula así; el titular es lo preregistrado.

## 0. Qué información tenía el autor al registrar (declaración)
- No se había calculado ningún Δln, δ, proyección ni error de Q, P, empleo, ingreso o tasa.
- Sí se habían leído, sin calcular nada con ellos: (a) los totales anuales de C01 (registro, verificación y DTU 2022–2025) en `f2-c01-pipeline/notas.md`; (b) los valores de control P nominal 2020 = 124.40 y 2025 = 198.43 en `criterios-fase2.md` §4; (c) el texto de los checkpoints de C05 y C07. El diseño de abajo no se ajustó a esos valores.
- **Vintage:** los datos son los vigentes al 2026-11-01 (SNIIV con revisiones posteriores, Q deduplicada hoy). No existe vintage de 2023. Es un ejercicio **pseudo-fuera de muestra**: favorece al método. Las elasticidades (0.7 / 1.5, etc.) las fijó Astra el 2026-11-01 con la serie 2020–2025 ya disponible; aunque salen de literatura, no son ex ante en sentido estricto.

## 1. Objetivo y diseño
Proyectar (Q, P real) de **2024 (h=1)** y **2025 (h=2)** desde el punto observado de **2023** con la aritmética de `02_cruces/escenarios.py` (`cruce()` importada, no reescrita), usando solo información ≤ 2023 en la variante A y desplazadores realizados 2024–2025 en la B. La trayectoria de 2025 es **acumulada desde 2023** (no se rebasa en el 2024 observado).

## 2. Elasticidades (fijas; se leen de `02_cruces/supuestos.csv` con los nombres vigentes)
| Parámetro | Base | Mín | Máx |
|---|---|---|---|
| e_d | 0.7 | 0.3 | 1.5 |
| e_s | 1.5 | 0.5 | 3.0 |
| e_y | 0.8 | 0.5 | 1.0 |
| e_r (elasticidad sobre el cambio **relativo** de la tasa) | −0.39 | −0.6 | −0.2 |
| e_ext (margen extensivo: Q ∝ puestos IMSS) | 1.0 | 0.5 | 1.5 |

`e_ext` **no está** en `supuestos.csv` hoy: se fija aquí en 1.0 como `supuesto` (Q es crédito formal, proporcional a la población con empleo formal) y se teclea en `backtest.py` con esta nota. Si C09 publica otro valor, ese valor es sensibilidad. La malla de elasticidades de la banda es e_d × e_s ∈ {mín, base, máx}² (9 pares), como en `escenarios.py`.

## 3. Reglas de honestidad de `criterios-fase2.md` §2 que se aplican
1. **Logaritmos:** ΔlnP = (δd − δs)/(e_d + e_s); ΔlnQ = (e_s·δd + e_d·δs)/(e_d + e_s). Historia: δd = ΔlnQ + e_d·ΔlnP_real; δs = ΔlnQ − e_s·ΔlnP_real. Porcentajes mostrados = eˣ − 1.
2. **P real:** P_real_t = P_nominal_t / INPC_promedio_anual_t (índice SHF anual con INPC anual del mismo periodo). Solo se calculan errores en P real; no hace falta pronosticar inflación.
3. **Un solo margen extensivo:** empleo IMSS (nunca empleo y hogares a la vez).
4. **Tasa:** e_r × Δln(tasa) = e_r × ln(r_t / r_{t−1}); es elasticidad sobre el cambio relativo, no «por punto porcentual».
5. **Oferta dentro del universo RUV:** entregas esperadas (DTU) ÷ entregas observadas comparables (DTU del año previo). Nunca se divide entre Q ni se compara DTU con créditos en niveles.
6. Sin parámetro sin fuente: lo no sustentado es `supuesto` o «no disponible». No se inventa nada. No se mezcla Sonora con Hermosillo: toda serie estatal lleva `-sonora` y solo entra como sensibilidad rotulada.

## 4. Insumos y su definición
Todos de `01_base/series-integradas.csv` o de la carpeta del chunk correspondiente (solo lectura). Un `serie_id` = una definición.
- **Q** = `q-viviendas-financiadas-nueva-dedup`, 2020–2025 (viviendas).
- **P nominal** = `p-shf-indice-hermosillo-anual`, 2020–2025 (índice SHF 2017=100, promedio anual; mide toda la vivienda con avalúo, no solo nueva).
- **Deflactor titular** = `f2-inpc-promedio-anual` (C07, 2020–2025). **Si C07 no lo entrega** antes del plazo (sección 9) se usa `inflacion-nacional-dic-dic` encadenada (Π(1+π)) y **todo P queda rotulado «deflactor provisional dic–dic»**; en ese caso el titular de P es provisional.
- **Tasa** = `tasa-hipotecaria-banxico-nuevos`, diciembre de cada año, nacional, 2020-12…2025-12; Δ = diciembre/diciembre. Es nacional (la tasa no tiene versión municipal); se declara. Si C07 añade una serie de promedio anual completa 2020–2025, se corre como sensibilidad.
- **Empleo (margen extensivo)** = IMSS puestos, municipio Hermosillo, diciembre de cada año 2019–2025 (C05), **una sola definición**. Solo entran valores con `calidad` ∈ {observado, declarado, prensa, estimado derivado de esos}. Los valores `por verificar` **no entran al titular**.
- **Ingreso real por trabajador** = salario de cotización diario IMSS, Hermosillo, diciembre (C05), deflactado con la variación dic/dic del INPC (`inpc-nacional-var-dic` de C05; respaldo `inflacion-nacional-dic-dic`) para casar periodos (stock de diciembre ÷ deflactor de diciembre). Mismo criterio de calidad que el empleo. Si solo hay salario de Sonora: sufijo `-sonora`, solo sensibilidad.
- **Oferta (C01)**: `f2-registro-mensual` y `f2-dtu-mensual` (municipio Hermosillo, nueva), 2020-01…2025-12. Rezago registro→DTU **L = 14 meses** (central; 10–24 de C01; la banda usa L ∈ {10, 14, 24}).

## 5. Historia 2021–2025 (insumo de A y del diagnóstico)
Para cada t = 2021…2025 y cada par (e_d, e_s) de la malla: ΔlnQ_t, ΔlnP_real_t, δd_t, δs_t. El δd implícito «de referencia» usa e_d = 0.7 y e_s = 1.5.

## 6. Variante A (incondicional)
Información ≤ 2023 únicamente (δ de 2021, 2022 y 2023).
- Para cada par (e_d, e_s) de la malla (coherente: las mismas elasticidades que descomponen la historia se usan en la proyección):
  - escenario **base**: δd = mediana de δd₂₀₂₁₋₂₃, δs = mediana de δs₂₀₂₁₋₂₃;
  - escenario **bajo**: δd y δs en su mínimo 2021–2023 (extremo conjunto); escenario **alto**: ambos en su máximo.
- Se aplica el mismo δ en 2024 y en 2025 (acumulado) con `cruce(δd, δs, e_d, e_s)` sobre (ln Q₂₀₂₃, ln P_real₂₀₂₃).
- **Punto titular de A** = escenario base con (e_d, e_s) = (0.7, 1.5).
- **Banda titular de A** = envolvente (mín, máx) de ln Q y ln P sobre {bajo, base, alto} × 9 pares.
- **Banda ancha de A (secundaria, preregistrada)**: δd y δs de forma independiente en {mín, mediana, máx} (9 combinaciones) × 9 pares. Se reporta, pero el veredicto usa la banda titular.

## 7. Variante B (condicional: desplazadores realizados 2024 y 2025)
- **Demanda:** δd_t = e_ext·Δln(empleo_t) + e_y·Δln(ingreso_real_t) + e_r·Δln(tasa_t), con elasticidades base.
  - **B-completa** requiere empleo e ingreso de **Hermosillo** (calidad admitida, sección 4). Si falta cualquiera de los dos para 2019/2020–2025, B-completa = **«no disponible»**: no se completa con Sonora ni con valores `por verificar`.
  - Cuando B-completa no esté disponible se corren y se rotulan como **sensibilidad**: **B-sonora** (empleo y salario `-sonora`; no es Hermosillo), **B-por-verificar** (valores `por verificar` de C05 Hermosillo, si existen) y **B-parcial** (solo el término de tasa y/o los términos disponibles; no es el δd completo).
- **Oferta:** δs_t = ln(E_t / DTU_{t−1}) con E_t = a·R_t^L, R_t^L = Σ registros de los 12 meses (ene–dic del año t) desplazados L meses hacia atrás, y a = ΣDTU_{2022,2023} / ΣR^L_{2022,2023} (calibrada solo con ≤ 2023). Para t = 2024, DTU_{t−1} es el de 2023; para t = 2025, el DTU 2024 observado (B es condicional). `s_cartera` = 0 y `s_inventario` = 0 por **no existir vintage de cartera ni inventario de 2023** (el inventario C02 empieza en 2024-01): se declara que la oferta de B es pipeline solamente.
- Se proyecta con `cruce()`, acumulado desde 2023.
- **Punto titular de B** = (e_d, e_s, L) = (0.7, 1.5, 14). **Banda titular de B** = envolvente sobre los 9 pares × L ∈ {10, 14, 24}.
- Si B-completa no está disponible, el **titular de B** es «no disponible» y lo que se calcule con proxies se reporta aparte como sensibilidad.

## 8. Comparadores ingenuos y métricas
**Ingenuos:** Q_t = Q₂₀₂₃ (t = 2024, 2025). P real: ln P_t = ln P₂₀₂₃ + (t − 2023)·ḡ, con ḡ = promedio de ΔlnP_real 2021–2023 = (ln P₂₀₂₃ − ln P₂₀₂₀)/3.

**Métricas** (Q y P real, 2024 y 2025):
1. Error logarítmico con signo = ln(proyectado) − ln(observado); absoluto; y su equivalente porcentual eˣ − 1.
2. Acierto de signo: signo de (ln proy_t − ln obs₂₀₂₃) = signo de (ln obs_t − ln obs₂₀₂₃).
3. Observado dentro de la banda titular (por variable y año), y dentro de la banda ancha (A).
4. Error absoluto vs. ingenuo: por año y variable, y promedio 2024–2025 (MAE log) del método y del ingenuo.
5. Correlación de Pearson (y Spearman, y aciertos de signo) entre δd implícito (base) y δd construido con desplazadores, 2021–2025 (n = 5). Con n = 5 no es prueba. Diagnóstico adicional: correlación entre δs implícito y δs de pipeline, 2022–2025 (n = 4; 2022–2023 son in-sample por la calibración de a).
6. Ensanche mínimo exigido por §3: máx |error log| de h=2 (2025) entre variables y variantes disponibles.

## 9. Reglas de veredicto (se aplican al pie de la letra)
- **R1.** Si en la variante A **o** en la B (titular disponible) el observado de **Q o P** de un año queda fuera de la banda titular → frase literal «el método no contuvo 2024» y/o «el método no contuvo 2025», con la variante y la variable que falló.
- **R2.** Si en A **o** en B (titular disponible) el MAE log 2024–2025 del método supera al del ingenuo en **Q o P** → frase literal «en 2024–2025 el método no superó a la inercia», con variante y variable. Se reporta también por año.
- **R3.** Si R1 se activa: la banda 2027–2030 se ensancha al menos en el error absoluto máximo de h=2 (valor de la métrica 6).
- **R4.** El texto siempre incluye: pseudo-fuera de muestra, dos puntos no prueban exactitud, B-completa/proxy según corresponda, y lo «no disponible».
- Prohibido reajustar elasticidades, la regla de mediana, L o la banda tras ver el ajuste. Lo posterior se rotula «sensibilidad (posterior al preregistro)».

## 10. Dependencias y plazo
Arranque 21:32Z. Se revisan C07 (INPC promedio anual) y C05 (empleo/salario municipal 2019–2025) cada ~3 min. **A los ~15 min (21:47Z)** se corre con lo disponible; los componentes faltantes se declaran «no disponible». Se hace primero lo que no depende de ellos (oferta, ingenuo de Q, historia de Q).

## 11. Sensibilidades previstas (todas posteriores y rotuladas; no cambian el titular)
S1 deflactor dic–dic (si el titular es INPC promedio anual); S2 oferta con verificación→DTU (L = 12; 9–23); S3 δ de A fijos al valor implícito con elasticidades base y malla solo en `cruce()`; S4 A con media en lugar de mediana; S5 B con variantes proxy (Sonora / por verificar / parcial); S6 e_ext, e_y, e_r en sus extremos.
