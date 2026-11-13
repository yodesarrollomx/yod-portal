# Dictamen C02 · Inventario terminado (R9) — Terra-2

Astra · cierre 2026-11-01T21:32Z (`date -u`). Muestreo con WebFetch entre 21:29Z y 21:31Z. A cada URL le agregué `?aud=astra1` para no leer la caché del productor, que había consultado esas mismas URLs hacia las 21:20Z.

Versión auditada: `01_base/f2-c02-inventario/` — `series.csv` (21:26:57Z; 635 filas), `notas.md` (21:27:48Z), `fuentes.csv` (21:27:20Z), `checkpoints.md` (21:27:55Z; 8 líneas de 21:19Z a 21:27Z, coherentes con el mtime).

Criterios aplicados: `criterios-fase2.md` §0 y C02.

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.**
- 82 valores reabiertos, 0 discrepancias.
- Todo lo derivado se recalcula exacto.
- La inferencia sobre HBT está bien declarada.
- Antes de que el tablero use el proxy hay que corregir dos cosas: el rótulo de los «meses» y el tratamiento de 2025-11 (R-C02-1 y R-C02-2).

## A. Muestreo propio (literal)

| URL (`GetInventario/…/26/030/…`) | Visto | CSV |
|---|---|---|
| `2026,7/avance_obra` | Sin reporte 2641 · Avance 0 1055 · 1-19 329 · 20-39 845 · 40-59 473 · 60-79 544 · 80-99 754 · HBT - 5m 510 · HBT + 5m 946 · Sin HBT 130; suma 8227 | 10/10 |
| `2025,12/avance_obra` | 1069 · 517 · 338 · 516 · 531 · 374 · 514 · 464 · 909 · 103; suma 5335 | 10/10 |
| `2025,11` y `2025,9/avance_obra` | **idénticos**: 157 · 416 · 580 · 547 · 458 · 396 · 534 · 301 · 917 · 94; suma 4400 | 20/20 |
| `2025,4/avance_obra` (elegido por mí) | 9 objetos, sin «Sin reporte»; HBT - 5m 427 · HBT + 5m 895 · Sin HBT 38; suma 3748 | 9/9 (el «Sin reporte» = 0 es `estimado`, correcto) |
| `2024,8/avance_obra` (elegido por mí) | 158 · 444 · 186 · 424 · 301 · 290 · 377 · 378 · 625 · 83; suma 3266 | 10/10 |
| `2026,7/segmento` | Popular 4343 · Tradicional 2083 · Media 1744 · Residencial 57; sin Económica; suma 8227 | 4/4 (+ Económica = 0 `estimado`) |
| `GetProduccion/2025,2026/26/030/anio,mes` | DTU 104 … 279 (2025); 171, 197, 312, 160, 382, 264, 179 (2026) | 19/19 |
| `2024,4/municipio` y `2024,1/avance_obra` | `[]` (arreglo vacío) | confirmado |

Texto de la página `Cubo/Inventario` («Al 31 de julio de 2026»):
- dice «…haber iniciado su proceso de verificación u obtener su dictamen de habitabilidad y no haber sido vendida»;
- **la sigla HBT no aparece**.

Leí también el tramo final de `Reporte/Datos_abiertos` que el productor no había leído (desde el carácter 95,000). Tampoco trae HBT. La columna `avance_obra` se describe como «Indica el progreso de construcción de la vivienda al momento del reporte». Ese pendiente queda cerrado.

## B. Recálculos (script propio, 0 diferencias)
- En los 30 cortes, la suma de las 10 categorías es igual al total.
- El proxy (HBT−5m + HBT+5m) y el amplio (+ Sin HBT) coinciden en los 28 meses.
- `meses-dtu12` coincide (±0.01) con la ventana de t−11 a t. Ejemplo jul-2026: 1456 / (2886/12) = 6.05.
- La prueba de compatibilidad HBT ≤ DTU de 24 meses se cumple: el cociente va de 0.283 a 0.340 desde dic-2024.
- La bandera de lote (Δ ≥ +500) reproduce los valores 2025-12, 2026-05 y 2026-06.

## C. Dictamen sobre «meses de DTU»
El DTU es una entrada de obra terminada, no una venta. Un cociente stock ÷ DTU mide cobertura al ritmo de dictaminación: baja cuando se acelera la producción aunque no se venda más. Entre dic-2024 y jul-2026, el DTU de 12 meses subió 46% (1,981 → 2,886) y el proxy solo 17%.

- **Es aceptable como indicador de oferta** si se rotula **«meses de dictaminación (stock terminado ÷ DTU mensual, promedio 12 m)»**. Nunca debe llamarse «meses de inventario» ni «de absorción».
- **El semáforo de exceso de oferta del tablero** debe usar ventas del universo RUV: viviendas INFONAVIT deduplicadas (Individual + No disp. + (Conyugal + Unamos)/2) + FOVISSSTE nueva. Las dos están obligadas a pasar por RUV.
- Recalculado por mí:

  | Corte | Ventas RUV 12 m | Proxy | Amplio |
  |---|---|---|---|
  | dic-2024 | 2,179 | 6.83 meses | 7.08 meses |
  | dic-2025 | 2,575 | 6.40 meses | 6.88 meses |
  | jul-2026 | 2,850 | 6.13 meses | 6.68 meses |

- Es una cota superior. Lo vendido con banca sigue contando como «no vendido» en RUV (R9), mientras que el denominador excluye la banca.
- El denominador Q (que incluye CNBV) sigue prohibido, porque mezcla universos.

## D. Otros hallazgos
- **2025-11 es copia de 2025-09 en la fuente.** Lo confirmé con una lectura independiente: avance, total 4,400 y segmento son idénticos, y 2025-10 = 4,536 es distinto. Las filas leídas pueden seguir como `observado` con su nota. Las derivadas de 2025-11 no son un dato del mes.
- **HBT**: la inferencia «dictamen de habitabilidad» es coherente con el texto de la página y con la prueba frente al DTU, pero no es una definición. Debe seguir rotulada como inferencia hasta que el RUV la confirme (pendiente R9).
- Señal útil para el tablero: **HBT+5m** (terminada hace más de 5 meses sin vender) sube de 772 (dic-2024) a 946 (jul-2026). Es el componente más limpio del freno de oferta. El crecimiento del total a 8,227 viene de «Sin reporte» y «Avance 0», es decir, de lotes de registro.
- La unidad de `f2-inv-lote-registro-flag` es «índice» y debe ser «indicador 0/1».
- La nota de R9 está, pero sin la cita metodológica.
- En `fuentes.csv`, F2C02-05 todavía dice «leída parcialmente».

## E. Reinstrucciones

```
R-C02-1 | mayor (condición de uso en el tablero) | responsable: Terra-2 (rótulo) y Sol Integración (semáforo en C11/C12)
hallazgo:   «meses-dtu12» divide entre producción, no entre ventas; leído como absorción, confunde oferta con demanda.
evidencia:  series.csv 21:26:57Z, f2-inv-terminado-proxy*-meses-dtu12; DTU de 12 m +46% vs proxy +17% (dic-2024→jul-2026); recálculo del auditor con ventas RUV: 6.83 / 6.40 / 6.13.
corrección: renombrar variable a «meses de dictaminación (stock HBT ÷ DTU mensual prom. 12 m)»; agregar f2-inv-terminado-proxy{,-amplio}-meses-ventas-ruv12 = proxy ÷ (viviendas INFONAVIT dedup + FOVISSSTE nueva, 12 m ÷ 12), estimado, cota superior, para los cortes con ventana completa (dic-2024 con el anual 2024; de dic-2025 en adelante con los meses).
resolución: el semáforo del tablero usa la serie de ventas RUV; la de DTU aparece solo como «cobertura de producción»; el recálculo del auditor coincide ±0.01.

R-C02-2 | menor | responsable: Terra-2
hallazgo:   2025-11 duplica 2025-09 en la fuente; las derivadas de 2025-11 aparentan ser un dato del mes.
evidencia:  GetInventario/2025,11 y 2025,9 (avance, municipio, segmento) idénticos, releídos por el auditor a las 21:30Z.
corrección: filas leídas de 2025-11 conservan `observado` con la nota «idéntico a 2025-09 en la fuente»; proxy, meses, sin-avance, delta y flag de 2025-11 pasan a `por verificar` y quedan fuera de tendencias y semáforo; el delta de 2025-12 se reporta también contra 2025-10 (+998).
resolución: 0 derivadas `estimado` en 2025-11.

R-C02-3 | menor | responsable: Terra-2
hallazgo:   detalles de rótulo y fuente.
evidencia:  unidad «índice» en f2-inv-lote-registro-flag; F2C02-05 «leída parcialmente»; nota R9 sin cita.
corrección: unidad «indicador 0/1»; F2C02-05 «leída» con la descripción de avance_obra citada en §A (sin HBT); en las notas del proxy, la cita de la metodología SNIIV «No es posible individualizar los financiamientos con crédito privado».
resolución: integrar.py en 0 errores; notas presentes.

R-C02-4 | menor | responsable: Sol Integración / Dirección (fuera del chunk)
hallazgo:   HBT sin definición publicada en el glosario, la página del cubo, Datos abiertos ni los manuales RUV.
evidencia:  §A; notas.md §HBT.
corrección: el tablero dice «terminada (proxy: categorías HBT; sigla sin definición publicada)»; pedir la definición a RUV/SNIIV.
resolución: rótulo visible; respuesta del RUV archivada, o pendiente con fecha.
```

## F. R-C08, comprobado en la misma pasada
`grep "2018=100|2018 = 100"` da 0 en C08 (salvo la bitácora histórica `checkpoints.md`, que es aceptable), en `integracion`, `series-integradas.csv`, `data.json`, `index.html` y `02_cruces/*.py`.
- `data.json` trae 75 veces «índice 2017=100».
- `index.html` muestra «2017 = 100» con la nota sobre la página del SNIIV.
- El CSV de C08 tiene los ids `shf-indice-*-nacional`, segmento `total` y el localizador posicional; sus 150 valores son idénticos a `c08-series-v1-luna.csv`.
- La conclusión territorial está corregida.

**R-C08-1 a -4: RESUELTAS.**
