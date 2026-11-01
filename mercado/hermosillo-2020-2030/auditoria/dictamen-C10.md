# Dictamen C10 · Backtest (Terra-8)

Astra-3 · cierre 2026-11-01T21:52Z (`date -u`). Versión auditada: `01_base/f2-c10-backtest/`:

| Archivo | mtime | Nota |
|---|---|---|
| `preregistro.md` | 21:35:19Z | sha256 `f2b13136…40a4dc1`, recalculado a las 21:48Z, **idéntico** al del checkpoint de 21:35:23Z |
| `backtest.py` | 21:39:46Z | |
| `resultados.json` | 21:40:40Z | |
| `series.csv` | 21:40:40Z | 60 filas |
| `fuentes.csv` | 21:40:16Z | |
| `notas.md` | 21:40:40Z | |
| `checkpoints.md` | 21:40:40Z | |

Criterios aplicados: `criterios-fase2.md` §0, §2 y §3. No ejecuté `backtest.py`, porque escribe en la carpeta del productor. Recalculé con scripts propios (`python3 -I`, scratchpad de Astra-3: `astra3/c10_audit.py` y `astra3/c10_oferta.py`) a partir de:
- `series-integradas.csv` (Q, P);
- C07 (`f2-inpc-promedio-anual`);
- C01 (`f2-registro-mensual`, `f2-dtu-mensual`).

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.**
- El preregistro es anterior a los resultados y no se alteró.
- Mi recálculo reproduce todas las cifras titulares.
- Las frases se activan como manda la regla preregistrada.
- Las correcciones son de formato (7 filas que `integrar.py` rechaza) y de texto del panel.
- El hallazgo de fondo (punto d) no es defecto del chunk: es del método de oferta, y lo dirijo a Astra, a Sol y a C09.

## A. Recálculo propio (información ≤2023; e_d = 0.7, e_s = 1.5; P real = SHF ÷ INPC promedio anual)

| | Mío | Productor |
|---|---|---|
| Historia δd / δs 2021, 2022, 2023 | 0.2588/0.2064 · −0.0605/−0.0552 · −0.0885/−0.2292 | (sin publicar; la mediana coincide) |
| Mediana δd / δs (ambas = 2022) | −0.0605 / −0.0552, que dan ΔlnQ = −0.0588 y ΔlnP = −0.0024 por año | igual |
| A: error log de Q 2024 / 2025 | +0.0070 (+0.7 %) / −0.0957 (−9.1 %) | +0.007019 / −0.095684 |
| A: error log de P real 2024 / 2025 | −0.0608 (−5.9 %) / −0.1178 (−11.1 %) | −0.060838 / −0.117762 |
| Ingenuo: error de Q 2024 / 2025 | +0.0658 / +0.0219 | +0.065811 / +0.0219 |
| Ingenuo: error de P 2024 / 2025 | −0.0300 / −0.0560 | −0.029964 / −0.056014 |
| MAE log Q: A frente a ingenuo | 0.0514 frente a 0.0439 | 0.051352 frente a 0.043855 |
| MAE log P: A frente a ingenuo | 0.0893 frente a 0.0430 | 0.0893 frente a 0.042989 |
| Banda titular de Q, 2024 / 2025 | 2,662–3,940 / 2,291–5,020 (ancho log 0.39 / 0.78) | igual |
| Banda de P real, 2024 / 2025 (precios de 2025) | 176.8–188.9 / 176.4–201.4; observado en 0.92 / 0.89 del ancho | igual |
| Signo | Q acierta los dos años; P falla los dos (proyectado −0.2 %/año; observado +5.8 % y +11.3 % en log, acumulado) | igual |

Todas las cifras coinciden dentro de la tolerancia. Insumos contrastados con `series-integradas.csv` (mtime 21:45:04Z; posterior a la corrida, sin cambio en Q ni en P):
- Q: 3,093 / 2,896 / 3,026;
- P: 163.04 / 181.01 / 198.43;
- INPC: 129.280 / 135.385 / 140.542.

El punto base de P queda en el **borde inferior** de su banda: todo el resto de la malla da un P mayor. Dentro de la banda no significa acierto.

## B. Respuesta a los puntos del coordinador

**(a) Hora del preregistro.**
- El orden se cumple: preregistro 21:35:19Z, checkpoint con hash 21:35:23Z, script 21:39:46Z, resultados 21:40:40Z. El hash está intacto.
- Antes de registrar, el productor había visto los totales anuales de C01 y P nominal 2020 y 2025. Lo declara en §0.
- Valoro que no hubo ajuste al resultado, por tres razones:
  - el diseño (mediana 2021–2023, ingenuos, bandas, ≤2023) está dictado por `criterios-fase2.md` §3;
  - L = 14 es el central de C01;
  - el componente que el productor podía «ver» (la tubería) es justo el que falló de forma estrepitosa, y un ajuste al resultado habría ido en sentido contrario.
- Los cambios posteriores al registro (lectura de filas vacías, escala de P a precios de 2025, autochequeo) no alteran errores en logaritmo.
- Queda una contaminación inevitable que debe decirse: las elasticidades se fijaron con 2020–2025 a la vista. «Pseudo-fuera de muestra» ya está escrito en las notas.

**(b) B titular «no disponible»: correcto.**
- En C05 (`series.csv`, mtime 21:33:46Z), `f2-imss-puestos-dic` y `f2-imss-salario-diario` de Hermosillo tienen 2019–2024 `por verificar` **sin valor**. Solo hay 2025-12 = 260,693 (prensa), y los flujos acumulados de 2024–2025 no cubren el año.
- Completar con Sonora habría sido mezclar geografías.
- B-parcial y B-sonora son sensibilidad, como fija el preregistro §7.

**(c) Frases: correctas por regla.**
- R2 se activa en las dos variables (MAE Q 0.051 > 0.044; P 0.089 > 0.043).
- R1 no se activa: los cuatro observados de A están en la banda y B titular no existe.
- Falta, para que el panel sea honesto, decir en el cuerpo:
  - que con proxies (sensibilidad) el método **no contuvo P real** en 2024–2025 (error log de +0.20 y +0.33 en B-parcial y de +0.22 y +0.35 en B-sonora, es decir, +22 %/+39 % y +24 %/+42 %; Q 2025 también fuera en B-parcial);
  - que el signo de P falló en los dos años.
- Eso no cambia el titular preregistrado (R-C10-2).

**(d) Tubería −43 % / −33 % con el DTU al alza: error de método, no de código.**
- Lo reproduje de forma independiente, con L = 14:

| Año | Registros rezagados R^L | E = a·R^L (a = 0.509) | DTU observado | δs del productor |
|---|---|---|---|---|
| 2022 | 4,202 | 2,139 | 1,667 | |
| 2023 | 2,420 | 1,231 | 1,704 | |
| 2024 | 1,896 | 965 | 1,981 | ln(965/1,704) = **−43.4 %** |
| 2025 | 2,607 | 1,327 | 2,386 | ln(1,327/1,981) = **−33.0 %** |

- El código hace exactamente lo preregistrado (`ds_pipeline`, líneas 141-144).
- Primera falla de método: δs compara un nivel **ajustado** (E_t) con un nivel **observado** (DTU_{t−1}). El ajuste ni siquiera reproduce los años de calibración (E/DTU = +28 % en 2022 y −28 % en 2023), así que el error de nivel de 2023 se cuela en el δs de 2024.
- Segunda falla: la conversión registro→DTU no es estable.
  - Los registros oscilan entre 2,069 y 5,657 al año y el DTU entre 1,667 y 2,386.
  - El pico de registros de 2021 (4,080) fija a ≈ 0.51.
  - Los registros bajos de 2022–2023 anuncian entonces un desplome que no ocurrió.
  - Aun con la forma coherente ln(E_t/E_{t−1}), 2024 da −21.7 %: el signo sigue mal.
  - Con L = 10 da −6.2 %; con L = 24, −44.8 %.
- Conclusión: con estos datos, una tubería registro→DTU de rezago fijo **no pasa el backtest**, y C01 ya advierte que el rezago no está identificado.
- La redacción de `criterios-fase2.md` §2.4 («entregas esperadas ÷ entregas observadas comparables») permite esta mezcla de nivel ajustado con nivel observado. Esa imprecisión es responsabilidad de Astra (R-C10-3).

**(e) e_ext = 1.0.**
- El supuesto es del productor, pero es el mismo coeficiente implícito del motor: `escenarios.py` suma ln(1+g_empleo) con coeficiente 1 (línea 10, «g_margen = g_empleo»), y metodo-curvas §5 hace lo mismo.
- No está en `supuestos.csv`. No afecta al titular, porque B no existe.
- La sensibilidad S6 (0.5–1.5) no cambia las conclusiones de B-sonora.
- Hay que registrarlo como supuesto (R-C10-4).

## C. Contrato y proceso
- `series.csv`: 14 columnas, sin claves duplicadas, una unidad y geografía por serie, `estimado` en las 60 filas (correcto: cálculo propio).
- **7 filas con `periodo` inválido** (`2024-2025`, `2021-2025`, `2022-2025`): cuatro MAE, dos correlaciones y `b-titular-estado`. La expresión regular de `integrar.py` (`^\d{4}(-(0[1-9]|1[0-2])|-Q[1-4])?$`) las rechaza (R-C10-1).
- `f2-c10-a-ensanche-minimo-h2` = 0.1178 publica un «ensanche» que R3 **no** manda aplicar. La nota dice «R3 aplica = False», pero el nombre invita a usarlo (R-C10-1).
- `f2-c10-b-titular-estado` = 0 «binario» para «no disponible» es ambiguo (R-C10-1).
- Checkpoints: 4 líneas (21:34:43Z, 21:35:23Z y dos a las 21:40:40Z), coherentes con los mtime.
  - El preregistro dice «arranque 21:32Z» y preveía correr «a las ~21:47Z». Corrió a las 21:39Z, cuando C07 ya estaba (21:35:47Z).
  - El adelanto no cambia nada preregistrado.
  - El primer `resultados.json` de las 21:39Z que cita el checkpoint fue sobrescrito: no puedo verificar su hora, pero toda versión es posterior al preregistro.

## D. Qué puede decir el panel (C11/C12)
- Titular, literal: «en 2024–2025 el método no superó a la inercia».
- Acompañado de:
  - (i) pseudo-fuera de muestra, con elasticidades fijadas viendo 2020–2025;
  - (ii) dos años no prueban exactitud;
  - (iii) la variante condicional no pudo correrse con datos de Hermosillo, y con proxies no contuvo P;
  - (iv) el signo de P falló en los dos años;
  - (v) la banda de Q a dos años abarca un factor de 2.2: contener no es acertar.
- Prohibido presentar «los cuatro observados dentro de la banda» como validación.

## E. Reinstrucciones

```
R-C10-1 | menor (formato; no cambia números) | responsable: Terra-8
hallazgo:   7 filas con periodo fuera del contrato; fila de «ensanche» que R3 no aplica; estado «no disponible» codificado como 0.
evidencia:  series.csv 21:40:40Z: f2-c10-{a,ingenuo}-{q,p-real}-mae-log «2024-2025», f2-c10-b-*-corr-delta-d «2021-2025»/«2022-2025», f2-c10-b-titular-estado «2024-2025»; PERIODO de integrar.py línea 22.
corrección: periodo = 2025 con nota «métrica sobre 2024–2025» (o sacar esas métricas a resultados.json); renombrar a f2-c10-a-error-abs-max-h2 con nota «referencia; R3 no se activó, no ensanchar»; quitar la fila b-titular-estado (el estado va en nota y JSON).
resolución: integrar.py sin errores en f2-c10.

R-C10-2 | menor (texto del panel) | responsable: Terra-8 (notas) → Sol (panel C11/C12)
hallazgo:   el titular es correcto, pero el texto no obliga a mostrar que con proxies B no contuvo P real y que el signo de P falló en los dos años.
evidencia:  series.csv: b-parcial y b-sonora p-real-dentro-banda = 0 (2024 y 2025); a-p-real-signo-ok = 0 (2024 y 2025).
corrección: en notas.md y en el cuerpo del panel, las 5 frases del §D, sin activar «no contuvo» como titular (lo preregistrado manda).
resolución: grep de las frases en notas.md e index.html.

R-C10-3 | mayor (sistema de escenarios; no es defecto de C10) | responsable: Astra (criterios §2.4) + Terra-9/C09 (s_pipeline) + Sol (escenarios.py)
hallazgo:   la tubería registro→DTU de rezago fijo no pasa el backtest; además, la forma ln(E_t/DTU_{t−1}) mezcla un nivel ajustado con uno observado.
evidencia:  recálculo propio: a = 0.509; E 2022/2023 = 2,139/1,231 frente a DTU 1,667/1,704; δs 2024/2025 = −43.4 %/−33.0 % frente a DTU +16.3 %/+20.4 %; con ln(E_t/E_{t−1}), 2024 = −21.7 %.
corrección: §2.4 precisado: «δs de tubería = ln(E_t/E_{t0}) con E calibrada de modo que E_{t0} = DTU_{t0}; nunca un nivel ajustado contra uno observado». Para 2027–2030, s_pipeline no se deriva de registro→DTU con rezago fijo; solo como supuesto de rango amplio, que incluya el DTU observado 2021–2025, rotulado «la tubería no pasó el backtest C10».
resolución: supuestos.csv y data.json sin s_pipeline derivado de rezago fijo; criterios §2.4 v2.

R-C10-4 | menor | responsable: Terra-9 (C09)
hallazgo:   e_ext = 1.0 (coeficiente del margen extensivo) es implícito en escenarios.py y no está en supuestos.csv.
evidencia:  escenarios.py línea 10 (ln(1+g_empleo), coeficiente 1); preregistro §2.
corrección: fila e_ext en supuestos.csv: base 1.0, mín 0.5, máx 1.5, tipo supuesto, justificación «Q crédito formal ∝ empleo formal; sin estimación local».
resolución: supuestos.csv con e_ext; escenarios.py lo lee o lo documenta.
```
