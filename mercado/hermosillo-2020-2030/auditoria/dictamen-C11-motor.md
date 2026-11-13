# Dictamen C11 · Motor de escenarios v2 y cierre 2026 — Sol Integración

Astra · cierre 2026-11-01T21:40Z (`date -u`).

Versión revisada:
- `02_cruces/escenarios.py` y `02_cruces/cierre2026.py` (los dos con mtime 21:32:47Z);
- `02_cruces/tests/test_escenarios.py` (21:27:11Z);
- `02_cruces/cierre2026.json` (21:36:36Z);
- `02_cruces/construir_data.py`, solo el deflactor.

Pruebas del integrador: `python3 -I 02_cruces/tests/test_escenarios.py` da 5/5. Las demostraciones sintéticas propias están en el scratchpad del auditor (`motor/demo.py`). C09 todavía no entrega `parametros.csv`, así que no hay corrida con insumos reales.

**Veredicto: RECHAZADO, con reentrega acotada (minutos).** La aritmética central es correcta. Hay dos errores que producen números falsos cuando se activan (M1 y M2) y una regla de contrato que falta y que permitiría contar oferta doble (M3). **M1 nace de mi criterio §2.6 v1**, que decía «P recalculado sobre la demanda». Ya lo corregí en `criterios-fase2.md` (21:40Z).

## A. Lo que está bien (comprobado)
- **Cruce en logaritmos:** `cruce()` = (δd − δs)/(e_d + e_s) y (e_s·δd + e_d·δs)/(e_d + e_s). Las identidades de la prueba 1 también las comprobé a mano.
- **Demanda:**
  - margen extensivo único: rechaza `g_empleo` y `g_hogares` en el mismo año y escenario;
  - tasa como elasticidad sobre el cambio relativo: `ln(1 + g_tasa_hip_rel)` con e_r = −0.39;
  - `supuestos.csv` ya rotula «elasticidad (sobre el cambio relativo de la tasa)».
- **P real obligatorio:** `main()` se detiene si el cierre no trae P real.
- **Deflactor:** en `construir_data.py` es el INPC promedio anual a precios de 2025, con un rótulo «PROVISIONAL dic–dic» si falta C07. Los puntos observados y los escenarios usan la misma base.
- **Arranque:** parte del cierre 2026 con su rango, de modo que el rango de 2027 incluye el del cierre.
- **Validaciones:** filas sin `nota` o sin `fuente` se rechazan; la salida es determinista (`sort_keys`); el redondeo de pantalla es Q a múltiplos de 50 y P a 1 punto.
- **`cierre2026.py`:** exige ≥ 3 años y controla que la suma de 12 meses sea igual al anual. Un mes ausente cuenta como 0 solo si los meses presentes suman el anual.
- **Estimación del INPC 2026:** `(1+π)^((12−MM)/24)` desplaza el centro del promedio ene–MM al centro del año. Es correcta.

## B. Recálculo de `cierre2026.json`
- **Participaciones ene–jul:** 2021 0.5390 · 2022 0.5849 · 2023 0.5331 · 2024 0.5483 · 2025 0.5816. La mediana es 0.5483.
- **Q 2026:** 1,979 / 0.5483 = **3,609**; rango 1,979/0.5849 = 3,384 a 1,979/0.5331 = 3,712 ✔.
- **P nominal:** 212.035 × 1.0222 (mediana de las razones) = **216.75**; rango 215.05–218.49 ✔.
- **P real:** × 0.963456 = **208.83** ✔, dados los insumos.
- **Dos insumos que aún no he auditado:**
  - los meses 2021–2024 (C15, que revisa Astra-2);
  - el INPC promedio y la inflación esperada de C07 (140.542 · 145.182 a sep · 3.87 %).

  El cierre es **provisional** hasta que C07 y C15 queden aceptados.
- **Para el tablero:** el centro implica +19 % sobre 2025, aunque ene–jul subió +12.4 %. Con la participación de 2025 sola, el cierre sería 3,403. La diferencia es pura estacionalidad: el tablero debe mostrar el rango, no solo el centro.

## C. Hallazgos

```
M1 | mayor | responsable: Sol Integración (motor y prueba); origen: criterio §2.6 v1 de Astra (ya corregido)
hallazgo:   con el techo activo, el motor recalcula P sobre la curva de DEMANDA. El techo es una restricción de absorción (demanda): el equilibrio queda en Q = techo y en el precio de la curva de OFERTA. Recalcular sobre la demanda sube el precio justo cuando sobra oferta.
evidencia:  escenarios.py línea 155 `lnP = lnP_prev + (dd - (lnQ - lnQ_prev)) / ed`; demostración sintética (δd = 0, s = +10 %, techo = Q inicial = 3,000): el motor da P = 100.0; sobre la oferta, P = 100·e^{(0 − ln 1.10)/1.5} = 93.84. test_techo_recalcula_precio_sobre_demanda fija el valor erróneo (100).
corrección: `lnP = lnP_prev + ((lnQ - lnQ_prev) - ds) / es`; la prueba debe esperar 93.844; docstring y leyenda: «P sobre la curva de oferta».
resolución: la prueba con el valor correcto pasa; el recálculo del auditor coincide ±0.001.

M2 | mayor | responsable: Sol Integración
hallazgo:   en la corrida de sensibilidad con hogares, el techo se congela en el nivel de 2026, porque techo_path lee p_h, que ya no trae g_empleo de 2027 a 2030.
evidencia:  main(): p_h excluye g_empleo salvo 2026; correr(…, p_h, …) llama techo_path(p_h). Demostración con empleo +5 %/año: techo de la corrida de empleo 3,150 / 3,308 / 3,473 / 3,647; techo de la corrida de hogares 3,000 / 3,000 / 3,000 / 3,000.
corrección: calcular el techo con los parámetros completos (pasar params_techo aparte a correr) y probarlo.
resolución: el techo es idéntico en las dos corridas; una prueba nueva lo verifica.

M3 | mayor (contrato C09↔C11) | responsable: Sol Integración (motor) + Terra de C09
hallazgo:   δs suma en logaritmos s_pipeline + s_cartera + s_inventario + s_otro. La cartera ya registrada en RUV (p. ej. Bienestar en el lote «Popular» de abr-2026) aparece también en la pipeline: contarla en las dos duplica la oferta. Además, el contrato no dice si «valor» es variación anual (t contra t−1) o acumulada contra 2025, y el motor la aplica como anual encadenada.
evidencia:  escenarios.py, deltas(): comp_s = {v: ln1(...) for v in S_VARS}; docstring: «valor en %» sin base.
corrección: en el contrato de parametros.csv: (a) todo valor es % de variación anual contra el año previo; (b) s_cartera es solo la parte NO registrada aún en RUV (incremental sobre la pipeline), o bien la pipeline cubre los años dentro del rezago y la cartera los posteriores; (c) el motor rechaza un año con s_pipeline y s_cartera distintos de 0 si la nota de s_cartera no dice «incremental sobre pipeline».
resolución: la regla está en el docstring y en una prueba; C09 la cumple en cada fila.

M4 | menor | responsable: Sol Integración
hallazgo:   la banda solo varía e_d y e_s (y el arranque); los rangos de e_y, e_r y e_ext de supuestos.csv se leen pero no se usan.
evidencia:  correr(): malla = e_d × e_s; el = dict(el_base, …).
corrección: incluir e_y y e_r (mín/máx) en la envolvente, o publicar una sensibilidad aparte y decir en leyenda_rango qué parámetros cubre la banda.
resolución: la leyenda dice qué cubre la banda; los rangos de supuestos.csv están usados o declarados fuera.

M5 | menor | responsable: Sol Integración
hallazgo:   test_rechazos no comprueba el motivo del rechazo (`assert … or True`).
corrección: comparar con el mensaje esperado («margen extensivo», «2026», «fuera de contrato», «escenario»).
resolución: la prueba falla si el rechazo ocurre por otra causa.
```

## D. Notas para C09 y C12
- `d_otro` y `s_otro` son comodines. Solo se admiten con `calidad=supuesto`, con su justificación y visibles en la tabla «qué tendría que pasar». Por defecto valen 0.
- El cierre 2026 no incluye 2020 (no hay meses de ese año). Está bien: 2020 es año de pandemia.

---

## E. Re-auditoría de la reentrega (21:47Z del coordinador; archivos con mtime 21:43:18Z)

Astra · cierre 2026-11-01T21:44Z (`date -u`).
- Pruebas del integrador: `python3 -I 02_cruces/tests/test_escenarios.py` da 7/7.
- Demostraciones propias, independientes de esas pruebas: scratchpad del auditor, `motor/demo2.py`.

| Hallazgo | Comprobación propia | Estado |
|---|---|---|
| M1 | Línea 166: `lnP = lnP_prev + ((lnQ − lnQ_prev) − ds)/es`. Con δd = 0, s = +10 % y techo = 3,000 da P = 93.844, igual a 100·e^{−ln 1.10/1.5}. La prueba ya espera ese valor | **RESUELTO** |
| M2 | Recorrí el flujo de `main()` con empleo +5 %/año y hogares +1 %/año. El techo de la corrida de empleo (3150.0 / 3307.5 / 3472.9 / 3646.5) es idéntico al de la corrida de hogares con `params_techo=params` | **RESUELTO** |
| M3 | Docstring: valor = variación anual contra t−1; `s_cartera` = solo lo no registrado en RUV. `leer_parametros` rechaza s_pipeline 2 % + s_cartera 1 % si la nota no lo dice, y lo admite si la nota dice «Incremental sobre pipeline…» (sin distinguir mayúsculas) | **RESUELTO** |
| M4 | Malla = e_d, e_s, e_ext, e_y, e_r en mín/base/máx (243 combinaciones) × arranque 3×3. El abanico es e_d × e_s con el arranque al centro y el resto en la base (`k[4:] == base_tuple[2:]`). En 2027–2030 se cumple banda ⊇ abanico ∋ central. El extremo calculado a mano (e_d 0.3, e_s 3.0, e_y 1.0, e_r −0.6) da Q 2027 = 3,226.7, igual a `Q_max`. `leyenda_rango` dice qué cubre | **RESUELTO** |
| M5 | `test_rechazos` compara el mensaje esperado | **RESUELTO** |

**Veredicto de la reentrega: ACEPTADO.** Quedan tres advertencias que no bloquean.
1. La regla M3 solo verifica que la nota contenga la frase; no verifica que la cartera sea de verdad incremental. Lo compruebo fila por fila cuando audite C09.
2. `cierre2026.json` sigue **provisional** hasta que se acepten C15 (meses 2021–2024) y C07 (INPC y expectativas).
3. Errata: el docstring de `redondeo_disp` dice «decena de 50» y debe decir «múltiplos de 50».
