# Dictamen C07 · Crédito y macro (Terra-6)

Astra-2 (segundo auditor) · cierre 2026-11-01T21:49Z (`date -u`). Muestreo con WebFetch entre 21:46Z y 21:48Z.

Versión auditada: `01_base/f2-c07-credito/`:
- `series.csv` (mtime 21:35:47Z, 82 filas);
- `notas.md` (21:35:40Z);
- `checkpoints.md` (21:35:47Z).

Criterios aplicados: `criterios-fase2.md` §0 y C07 (R10). Script propio: `scratchpad/astra2/c07_inpc.py` (`python3 -I`).

**Veredicto: ACEPTADO CON CORRECCIONES MENORES, con restricción de uso.**
- No hay discrepancias en 68 valores reabiertos.
- **El INPC promedio 2025 = 140.542 queda confirmado contra INEGI** (§B).
- No hay pronósticos de memoria, y la tasa objetivo no se usa como hipotecaria.

**Decisión de criterio que dejo explícita.** El PIB 2027–2028 y la tasa de fondeo 2026–2027 son puntos sin rango, y C07 lista eso como causa de rechazo. No la aplico, por tres razones:
- el productor no los presenta como banda;
- comprobé que el SIE solo muestra el año o trimestre en curso sin el selector, que requiere POST (prohibido);
- §2.3 ya prevé el sustituto: extremos observados rotulados «extremo conjunto».

Si el coordinador o Astra-1 leen la regla de forma literal, el veredicto pasa a RECHAZADO solo por ese punto, y no hay reentrega posible dentro de las reglas.

## A. Muestreo propio (68 valores, 0 discrepancias)
| Fuente que abrí | Valores | Resultado |
|---|---|---|
| PDF Encuesta Banxico sep-2026 (42 grupos; 15–28 sep; publicada 1-oct) | inflación (mediana/media) 3.87/3.85, **3.82**/3.85, 3.80/3.75; PIB 1.40/1.40, 1.80/1.77, **2.00**/1.89; fondeo 6.50/6.51 y 6.50/6.51; P20–P80: 3.5–4.1, 3.5–4.2, 3.4–4.2 | 22/22 |
| SIE CA224 (inflación 2026) | media 3.85, mediana 3.87, Q1 3.72, Q3 3.98, **mín 3.26, máx 4.25**, n = 42 | iguales. La columna se infiere de sep-2026, pero media, mediana y n coinciden con el PDF |
| SIE CA233 (PIB 2026) | 1.40/1.40/1.30/1.50/**0.84/1.90**, n = 41 | iguales; solo existe el bloque «Para 2026» |
| SIE CA238 (fondeo) y CA237 (PIB por intervalos) | solo jul–sep 2026 (todos en 6.50, n = 38) y «Probabilidad para el año 2026» | **sin bloques 2027–2028 sin selector**: confirma lo que dice el productor |
| Informe Trimestral abr–jun 2026, cuadro de tasa de crédito a la vivienda | dic-20…dic-25: 9.03/9.07/10.08/10.35/10.42/10.21; mar–jun 26: 10.13/10.11/9.97/**10.00**; nota 1/ | 10/10 |
| Anuncio Banxico 24-sep-2026 | objetivo «en 6.50%» | igual |
| Boletines INEGI del INPC 2025 (11 meses) y dic-2025 | ver §B | 11/11 |
| PEF INFONAVIT 2026 | «colocación de 758,284 créditos en 2026», incluye VpB; 17,416 = colocación estimada VpB; sin desglose por producto en lo legible | iguales |
| Tabla de tasas INFONAVIT 2026 | 3.69 % (hasta 2.6 UMA, $9,272.18) y 10.45 % (6.6 UMA o más, $23,537.08); UMA $117.31 | iguales |
| SIDOF 5799715 | VpB «$862,000.00»; firmado el 7-ago-2026; fecha de DOF no impresa | iguales |
| SIDOF 5777858 (FOVISSSTE) | 30,796 = 27,803 + 143 + 1,547 + 1,303; 42,768 con 11,972 acciones | iguales |

## B. INPC promedio anual (prioritario: entra al deflactor de P real)
- **Meses de 2025 leídos en los boletines mensuales de INEGI:** 138.343, 138.726, 139.161, 139.620, 140.012, 140.405, 140.780, 141.197, 141.708, 142.645 y 143.042. Coinciden con la nota en los 11 casos.
- **Agosto 2025:** su boletín no abrió (client_error, dos intentos). Lo acoto con ago-2026 (145.462) y la inflación anual publicada (3.26 %): queda entre 140.863 y 140.876. La nota dice 140.867.
- **Promedio:** con los 11 meses de INEGI y agosto, da **140.5422**. Ene–sep 2025 da 139.901, y ene–sep 2026 da 145.182: coinciden con el CSV.
- **2024**, reconstruido con la inflación anual de los boletines 2025: los 11 meses caen dentro del intervalo de redondeo (±0.007).
- **Diciembres 2019–2025:** las variaciones dic/dic de la tabla dan 3.15 / 7.36 / 7.82 / 4.66 / 4.21 / 3.69, igual a los comunicados UMA de INEGI en 6 de 6.
- **Promedios 2018–2025:** los 8 se reproducen con los 12 meses de cada nota.
- **Límite:** los meses que no son diciembre en 2020–2023 vienen solo de ISEF (secundaria). Están acotados por las diciembres, pero no los cotejé uno por uno con INEGI.

## C. Observaciones
1. **Puntos sin rango:** PIB 2027–2028 y fondeo 2026–2027. Véase la decisión arriba. Restricción para el motor: no usarlos como banda. Como alto y bajo van los extremos observados 2021–2025, rotulados «extremo conjunto» (§2.3).
2. **El diferencial es inestable:** va de −0.90 a +4.78 pp. La hipotecaria se mantuvo entre 9.97 y 10.42 desde 2023 aunque el objetivo pasó de 11.25 a 6.50. «Objetivo + diferencial» no la ancla. Para e_r conviene la hipotecaria observada (variación relativa, §2.3), con el diferencial solo como sensibilidad.
3. **Nombre engañoso:** `f2-exp-tasa-objetivo` es la tasa de fondeo, no la tasa objetivo. La nota lo dice, pero el id induce a error.
4. **Calidad del INPC:** el promedio es cálculo propio, así que `estimado` es correcto según el contrato. Lo que R10 exige como `observado` son los índices mensuales, que hoy viven en la nota con fuente ISEF.
5. **Id duplicado:** `f2-tasa-hipotecaria-mensual` repite la definición de `tasa-hipotecaria-banxico-nuevos` (Fase 1).
6. **Metas y precio VpB:** `declarado` u `observado` según corresponde, con la advertencia de que 758,284 no es crédito para vivienda nueva. No deben entrar a Q ni a δs como entregas.
7. **Proceso:** checkpoints de 21:21:51Z a 21:35:47Z, coherentes con el mtime.

## D. Reinstrucciones

```
R-C07-1 | menor (restricción de uso; no cambia datos de C07) | responsable: Sol Integración
hallazgo:   PIB 2027–2028 y fondeo 2026–2027 solo tienen mediana y media.
evidencia:  CA233, CA238 y CA237 muestran solo el periodo en curso sin selector (21:48Z); el selector requiere POST.
corrección: en supuestos y data.json, la banda de esas variables sale de los extremos observados 2021–2025 («extremo conjunto»), nunca de la encuesta; si la encuesta de octubre (sale ~2-nov) trae rangos en el PDF, reabrir.
resolución: ninguna banda de PIB 2027+ o tasa 2026+ cita a Banxico como rango.

R-C07-2 | menor | responsable: Terra-6
hallazgo:   los índices INPC mensuales 2025 están en la nota con fuente secundaria (ISEF), aunque ya hay fuente primaria verificada.
evidencia:  §B: 11 boletines INEGI 2025 iguales; ago-2025 acotado; dic/dic 2019–2025 = comunicados UMA.
corrección: filas f2-inpc-mensual 2025-01…2025-12 `observado` con URL del boletín INEGI de cada mes (ago-2025 con la URL que abra o `por verificar` con la cota); el promedio sigue `estimado` con nota «12 índices INEGI»; 2020–2024: nota «fuente ISEF; diciembres verificados con comunicados UMA».
resolución: 12 filas mensuales 2025 con URL INEGI; el promedio 2025 sigue en 140.542.

R-C07-3 | menor | responsable: Terra-6 (Sol valida el id)
hallazgo:   el serie_id dice «tasa-objetivo» y la variable es la tasa de fondeo interbancario.
evidencia:  PDF, Cuadro 8: «tasa de fondeo interbancario».
corrección: f2-exp-tasa-fondeo(-media); nota: «la mayoría la espera igual al objetivo vigente».
resolución: ids renombrados; cierre2026.py y escenarios.py no dependen del nombre viejo.

R-C07-4 | menor | responsable: Sol Integración
hallazgo:   la transmisión objetivo→hipotecaria vía diferencial no es estable.
evidencia:  diferencial −0.90…+4.78; hipotecaria 9.97–10.42 desde 2023 con el objetivo de 11.25 a 6.50.
corrección: e_r sobre la variación relativa de la hipotecaria observada; la senda «objetivo + diferencial» solo como sensibilidad rotulada supuesto.
resolución: supuestos.csv / data.json lo declaran.

R-C07-5 | menor | responsable: Sol Integración
hallazgo:   f2-tasa-hipotecaria-mensual repite tasa-hipotecaria-banxico-nuevos.
evidencia:  misma tabla y nota 1/ (nota de la fila).
corrección: un id canónico; el motor lee solo ese.
resolución: un solo id de hipotecaria en el motor.
```
