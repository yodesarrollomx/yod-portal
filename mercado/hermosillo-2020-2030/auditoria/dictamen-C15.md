# Dictamen C15 · Meses 2021–2024 de crédito a vivienda nueva (Luna-2)

Astra-2 (segundo auditor) · cierre 2026-11-01T21:41Z (`date -u`). Muestreo con WebFetch entre 21:35Z y 21:37Z.

Versión auditada: `01_base/f2-c15-meses/`:
- `series.csv` (mtime 21:29:24Z, 466 filas);
- `notas.md` (21:29:48Z);
- `checkpoints.md` (21:29:49Z);
- `extraer.py` (21:29:22Z).

Recálculo sobre `02_cruces/cierre2026.py` (mtime 21:32:47Z) y `01_base/series-integradas.csv`. Corrí primero sobre la versión de 21:34:51Z y repetí sobre la de 21:38:32Z, con el mismo resultado. Criterios aplicados: `criterios-fase2.md` §0 y el «Cierre 2026» de C11 → C12.

**Veredicto: ACEPTADO.**
- No hay discrepancias en 96 valores reabiertos.
- Las participaciones ene–jul se reproducen por dos vías y coinciden en los cuatro decimales.
- El contrato está completo.

## A. Muestreo propio (96 valores, 0 discrepancias)
Pedí rangos de dos años. El productor había pedido un año por consulta (INFONAVIT y CNBV) o el rango 2021–2024 (FOVISSSTE).

| URL que abrí (SNIIV CuboAPI, 26/030) | Valores | Resultado |
|---|---|---|
| `GetInfonavit/2021,2022/…/anio,mes,tipo_credito,modalidad` (Nueva; marzo y octubre) | 12: Conyugal 30/22/2/14, Individual 140/183/126/107, Unamos 58/78/30/46 | 12/12 |
| `GetInfonavit/2023,2024/…/anio,mes,modalidad,esquema` (Nueva; junio y noviembre) | 18: Apoyo 28/23/9/16, Cofinavit 23/23/17/11, Tradicional 131/197/175/186, Infonavit total 9/11/11/9, Segundo crédito 19/2 (no aparece en 2024) | 18/18 |
| `GetInfonavit/2020,2021/…/anio,mes,modalidad,esquema` (2021, Nueva) | 10 meses de «Infonavit total» y 8 de los otros esquemas en abril y julio | 18/18; **abril y julio no tienen objeto «Infonavit total»**, aunque los otros esquemas sí están en esos meses |
| `GetFOVISSSTE/2022,2023/…/anio,mes,modalidad` («Vivienda Nueva») | 24 meses | 24/24 |
| `GetCNBV/2023,2024/…/anio,mes,linea_credito` («Adquisición de Vivienda Nueva») | 24 meses | 24/24 |

Las 10 series quedan cubiertas. La estructura real coincide con el localizador: un arreglo de objetos {año, mes, …, acciones, monto}.

## B. Recálculo de las participaciones ene–jul
Hice dos recálculos:
1. **Con `cierre2026.py`.** Importé `leer` y `q_meses` (vía `sys.path`, con `python3 -I`).
2. **Con un script propio** (`scratchpad/astra2/c15_propio.py`). No importa nada del integrador: lee los meses 2021–2024 directo del `series.csv` de C15 y aplica la fórmula de deduplicación escrita en la nota de `q-viviendas-financiadas-nueva-dedup`.

| Año | Q ene–jul | Suma de 12 meses | Q anual (dedup) | Q anual desde las series anuales | Participación |
|---|---:|---:|---:|---:|---:|
| 2021 | 2,020 | 3,748 | 3,748 | 3,748 | **0.5390** |
| 2022 | 2,067 | 3,534 | 3,534 | 3,534 | **0.5849** |
| 2023 | 1,649 | 3,093 | 3,093 | 3,093 | **0.5331** |
| 2024 | 1,588 | 2,896 | 2,896 | 2,896 | **0.5483** |
| 2025 | 1,760 | 3,026 | 3,026 | 3,026 | **0.5816** |

- Las dos vías dan lo mismo, y coinciden con las cifras del integrador.
- Q ene–jul 2026 = 1,979. Con la mediana 0.5483, el centro es **3,609**; el rango es 3,384–3,712.
- Las 466 filas de C15 están copiadas sin cambios en `series-integradas.csv`.
- Los dos ceros que imputa `cierre2026.py` (`CEROS`) son exactamente Infonavit total 2021-04 y 2021-07. Los meses presentes suman el anual (33), y el API confirma que esas combinaciones no existen.
- Sensibilidad, solo informativa:
  - sin 2021, la mediana es 0.565 y el centro 3,503;
  - con la media de los 5 años, 0.5574 y 3,551.
  - Ambos quedan dentro del rango mín–máx.

## C. Contrato y proceso
- **Formato y rótulos:**
  - 14 columnas en orden, 0 claves duplicadas, sufijo `-mensual` y geografía municipal.
  - Unidad `créditos` sobre el campo `acciones`, igual que las series anuales de la Fase 1.
  - `fuente_id` DEM-01/02/03, presentes en `01_base/demanda/fuentes.csv`.
- **`fecha_corte` 2026-07-31.** El productor no la confirmó en la respuesta, pero coincide con las series anuales y mensuales 2025–2026 ya integradas y con DEM-01…03 («2015–jul 2026»).
- **Exclusiones bien declaradas:**
  - «Segundo crédito» se extrajo, pero la fórmula Q no lo usa: es un esquema solo INFONAVIT, ya contado en el tipo Individual.
  - «No disponible» no aparece en 2021–2024.
- **Proceso:**
  - Checkpoints de 21:25:20Z a 21:29:49Z, coherentes con el mtime.
  - `notas.md` tiene 846 palabras (tope ~800): no amerita corrección.

## D. Reinstrucciones
No hay reinstrucciones obligatorias. Hay una recomendación que no condiciona la aceptación:

```
R-C15-1 | recomendación (no condiciona la aceptación) | responsable: Sol Integración
hallazgo:   en el panel, el cierre 2026 descansa en 5 años: 2021 lleva 2 meses ausentes tomados como cero y 2025 viene de otro chunk.
evidencia:  §B; cierre2026.json → meses_ausentes_como_cero; sensibilidad sin 2021: centro 3,503.
corrección: en la nota del cierre 2026, citar los años usados, los 2 meses ausentes (Infonavit total 2021-04 y 2021-07, combinaciones inexistentes en el API) y que el centro es la mediana, no un pronóstico.
resolución: nota visible junto al cierre 2026 del tablero.
```
