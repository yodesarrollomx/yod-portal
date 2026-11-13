# Notas C10 · Backtest del método (Terra-8, 2026-11-01)

Preregistro guardado a las **21:35:23Z** (sha256 en `checkpoints.md`); primeros resultados válidos ~21:39Z. Pseudo-fuera de muestra: datos con el vintage del 2026-11-01 y elasticidades (0.7 / 1.5) fijadas por Astra con la serie 2020–2025 ya vista; **favorece al método**. Antes de registrar vi los totales anuales de C01 y P nominal 2020/2025 (valores de control); no había calculado ningún error. Después del registro cambié código (lectura de filas sin valor, escala de P a precios de 2025, autochequeo y texto), nunca parámetros.

## Qué salió (variante A, titular: incondicional, mediana de δ 2021–2023, acumulado desde 2023)
| | Proyectado | Observado | Error | Ingenuo (error) |
|---|---|---|---|---|
| Q 2024 | 2,916 | 2,896 | +0.7 % | 3,093 (+6.8 %) |
| Q 2025 | 2,750 | 3,026 | −9.1 % | 3,093 (+2.2 %) |
| P real 2024 | 176.8 | 187.9 | −5.9 % | 182.4 (−3.0 %) |
| P real 2025 | 176.4 | 198.4 | −11.1 % | 187.6 (−5.4 %) |

- **Banda titular** (escenarios bajo/base/alto × malla e_d×e_s): los cuatro observados cayeron dentro. Pero la banda de Q mide 0.39 y 0.78 en log (2,662–3,940 y 2,291–5,020), y P real 2024 y 2025 quedaron en 0.92 y 0.89 de su ancho (cerca del borde superior, que viene del rebote de 2021). Contener no es acertar.
- **Signo** (cambio vs 2023): Q acertó ambos años; P falló ambos (el método proyectó P real plano; subió +6.0 % y +12.0 % acumulado).
- **Frente a la inercia:** MAE log 2024–2025: Q 0.051 vs 0.044; P 0.089 vs 0.043. **Se activa «en 2024–2025 el método no superó a la inercia»** (Q y P). No se activa «el método no contuvo 2024/2025».
- **Ensanche (R3):** no aplica por regla (nada fuera de banda). Como referencia, el error de h=2 es 0.118 en log (12.5 %): equivale a 0.89 del ancho de la banda de P a h=2.
- Identidad verificada: con las mismas elasticidades, `cruce()` reproduce exactamente ΔlnP y ΔlnQ de la historia (aserción en el script). Dos corridas dan el mismo hash.

## Variante B: titular «no disponible»
B-completa exige empleo IMSS e ingreso **de Hermosillo** con calidad admitida. C05 no obtuvo la serie municipal 2019–2024 (fuentes primarias bloqueadas); esas filas están `por verificar` y **sin valor**. No se completó con Sonora ni se inventó. Lo que sigue es **sensibilidad rotulada**, no titular:
- **B-parcial** (δd = sólo término de tasa nacional) y **B-sonora** (empleo y salario de Sonora, distinta definición cada uno; 2021 sin δd): P real 2024–2025 quedó **fuera de banda** (proyectó +22 %/+39 % y +24 %/+42 % de más); Q 2025 también en B-parcial. MAE Q 0.20 y 0.17 vs ingenuo 0.044.
- **Correlación δd implícito vs construido:** B-parcial Pearson 0.49, Spearman 0.80 (n=5; sólo mide la tasa); B-sonora Pearson −0.57, Spearman −0.40 (n=4). No apoya que los desplazadores elegidos expliquen δd; con n=4–5 tampoco lo descarta.
- **Causa principal del fallo de B: la oferta.** El pipeline registro→DTU (L=14, a calibrada en 2022–2023) anunciaba δs de −43 % (2024) y −33 % (2025); el DTU real creció +16 % y +20 %. Correlación con δs implícito Pearson 0.29, Spearman 0.00 (n=4). Con verificación→DTU (L=12) mejora algo (Q 2024 −5.9 %, Q 2025 −17.5 % en B-sonora) sin resolverlo. Consistente con C01: el rezago no está identificado. Sin cartera ni inventario por no existir vintage 2023.

## Sensibilidades de A (posteriores al registro, rotuladas)
S1 deflactor dic–dic: mismas conclusiones (MAE P 0.094 vs 0.052). S3 δ fijos a elasticidades base: mismo punto, banda de P más ancha (175–252 en 2025). S4 media en vez de mediana: el P proyectado coincide con la inercia por identidad algebraica y Q empeora (+8.6 %, +5.7 %); la mediana de 3 años, dominada por 2022, fue la que movió el resultado. S6 (e_ext, e_y, e_r en extremos, B-sonora): errores de 2025 de −20 % a −25 % en Q y de +39 % a +45 % en P: el resultado no depende de esos tres parámetros.

## Límites
Dos puntos no prueban exactitud (ni su falta). Q es crédito formal deduplicado; P (SHF) es toda la vivienda con avalúo; la tasa es nacional y de diciembre; abr-2020 de registro es 0 imputado por C01 (afecta sólo L=24 en 2022). `e_ext` = 1.0 es supuesto de este preregistro (no está en `supuestos.csv`).

## Hallazgos para el auditor
1. Reabrir Q 2023–2025 (3,093 / 2,896 / 3,026) y P nominal 2023–2025 (163.04 / 181.01 / 198.43) contra `series-integradas.csv`.
2. Recalcular INPC promedio anual 2023–2025 (129.28 / 135.385 / 140.542, de C07).
3. Confirmar que B-completa «no disponible» es la lectura correcta de C05.
4. Revisar la regla R2 (cualquier variable): es la lectura más estricta.

## Texto obligatorio para el panel (R-C10-2, dictamen C10 §D)
Titular, literal (el que manda el preregistro): «en 2024–2025 el método no superó a la inercia». No se promueve «no contuvo» a titular: R1 no se activó en la variante A. Debe ir acompañado, en el cuerpo del panel, de estas cinco frases:
1. (i) pseudo-fuera de muestra, con elasticidades fijadas viendo 2020–2025;
2. (ii) dos años no prueban exactitud;
3. (iii) la variante condicional no pudo correrse con datos de Hermosillo, y con proxies no contuvo P;
4. (iv) el signo de P falló en los dos años;
5. (v) la banda de Q a dos años abarca un factor de 2.2: contener no es acertar.

Respaldo en `series.csv` y `resultados.json`: (iii) error log de P real en B-parcial +0.20 (2024) y +0.33 (2025), es decir +22 % y +39 %; en B-sonora +0.22 y +0.35, es decir +24 % y +42 %; `p-real-dentro-banda` = 0 en las dos sensibilidades, y Q 2025 también fuera en B-parcial. (iv) `f2-c10-a-p-real-signo-ok` = 0 en 2024 y 2025. (v) banda de Q 2025: 2,291–5,020 (5,020/2,291 = 2.19). Prohibido presentar «los cuatro observados dentro de la banda» como validación.

## Correcciones tras el dictamen (Terra-12, 2026-11-01)
Copias previas en `04_auditoria/c10-series-antes-correcciones.csv` y `04_auditoria/c10-backtest-py-antes-correcciones.py`.
- **R-C10-1 hecho.** Las 7 filas con periodo fuera de contrato pasan a `2025` y la nota dice «Métrica sobre 2024–2025» (MAE, 4 filas) o «Métrica sobre 2021–2025 / 2022–2025» (2 correlaciones). `f2-c10-a-ensanche-minimo-h2` se llama ahora `f2-c10-a-error-abs-max-h2`, con la nota «referencia; R3 no se activó, no ensanchar». Se quitó `f2-c10-b-titular-estado`: **la variante B titular está NO DISPONIBLE** (C05 no obtuvo empleo ni salario de Hermosillo 2019–2024 con calidad admitida); el estado queda aquí y en `resultados.json → variante_B.titular.estado`. Las 59 filas llevan `url` http de la fuente del dato comparado (Q: SNIIV Infonavit; P: SHF del año; correlaciones y mixtas: Q) y `localizador` = `resultados.json → <ruta de la clave>`; un script comprobó que las 59 rutas resuelven y dan el valor de la fila. La lista de insumos que estaba en `url` pasó a la nota.
- **Cómo se hizo sin cambiar números.** Se parchó solo el bloque de emisión de `series.csv` en `backtest.py` (misma salida, nuevos ids/periodos/url/localizador). Una corrida de prueba en el scratchpad regeneró `resultados.json` **byte a byte idéntico** y los mismos 59 valores; `resultados.json` de esta carpeta no se tocó.
- **R-C10-2 hecho** (sección anterior). El panel lo arma Sol.
- **No son de este chunk:** R-C10-3 (Astra, C09 y Sol) y R-C10-4 (C09).

