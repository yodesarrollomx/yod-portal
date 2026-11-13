# Dictamen C08 · Índice SHF por categoría (Luna-1)

Astra · cierre 2026-11-01T21:26Z (`date -u`). Muestreo con WebFetch entre 21:24Z y 21:26Z. Versión auditada: `01_base/f2-c08-shf-categorias/` — `series.csv` (mtime 21:20:34Z; 150 filas), `notas.md` (21:20:47Z), `checkpoints.md` (21:20:51Z). Criterios aplicados: `criterios-fase2.md` §0 y C08.

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.** No hay discrepancias de transcripción. La unidad está mal rotulada (la base es 2017=100, no 2018=100), pero eso no cambia ningún número ni ninguna variación. El mismo rótulo erróneo está en el tablero: es una corrección transversal para Sol Integración (R-C08-1).

## A. Muestreo propio (58 valores, 0 discrepancias)
Para no leer de la caché del productor, pedí rangos de fechas distintos a los suyos.

| URL que abrí (`GetNationalPrices`, `metric=index`) | Visto literal (`series[0].values` emparejado por posición con `periods`) | CSV |
|---|---|---|
| `startYear=2017…endYear=2019`, `categories=Nacional` | 2019-I…IV: 115.04, 117.58, 119.4, 121.02 (filterGroup «nacional») | igual |
| `2022-1…2026-2`, `Nueva` | 141.58 … 197.10 (2025-II) … 212.18 (2026-II), 18 valores (filterGroup «tipo_uso») | 18/18 iguales |
| `2023-1…2026-2`, `Usada` | 154.04 … 191.66 (2025-IV) … 198.12, 14 valores | 14/14 iguales |
| `2019-1…2021-4`, `Económica - Social` | 112.57 … 125.8 (2020-IV) … 136.42, 12 valores (filterGroup «clase») | 12/12 iguales |
| `2024-1…2026-2`, `Media - Residencial` | 173.44 … 195.74 (2025-IV) … 201.61, 10 valores | 10/10 iguales |

Recálculos propios:
- Nacional queda entre Nueva y Usada en **30 de 30** trimestres.
- Promedios anuales 2025: Nacional 193.39, Nueva 198.84, Usada 186.70, Económica-Social 197.45, Media-Residencial 191.10.
- Sin claves duplicadas; 14 columnas en el orden del contrato.

## B. Base del índice: los datos dicen 2017=100
- Nacional 2017-I…IV = 97.15, 99.11, 101.0, 102.74, con promedio **100.00**. El promedio de 2018 es 108.88.
- Hermosillo (`GetTerritorialVariation`, pares 2017-1→2017-3 y 2017-2→2017-4): 97.89, 99.36, 100.79, 101.96, con promedio **100.00**. Sonora: 98.11, 99.49, 100.69, 101.72, con promedio 100.00.
- La página `sniiv.sedatu.gob.mx/Inicio/Precios_de_vivienda` dice literalmente «Año base 2018 = 100». Eso contradice sus propios datos. Tres series promediando 100.00 en 2017 no es coincidencia; además, el dictamen de la Fase 1 ya mencionaba la «base 2017» del Excel de la SHF.
- **El rótulo «2018=100» es incorrecto** en C08 (150 filas) y en el resto del sistema:
  - `series-integradas.csv`: 218 apariciones;
  - `data.json`: 144;
  - `integracion/series.csv`: 68;
  - `construir_data.py`: 3;
  - `index.html`, de forma visible: «base 2018 = 100», «2018 = 100» bajo el valor de P y el título «Índice SHF Hermosillo por trimestre (2018 = 100)».
- La base no altera ninguna razón, variación ni desplazamiento del método. Solo el rótulo es falso.

## C. Filtro territorial por categoría: confirmado que se ignora
- Con `categories=Nueva` y con `categories=Usada` (2017-1→2017-3), Hermosillo devuelve los mismos valores, 97.89 → 100.79 (2.96 %). En los dos casos el objeto `filters` omite la categoría. Si el filtro funcionara, Nueva y Usada darían valores distintos, como ocurre en el índice nacional.
- La lectura del productor (2025-2→2026-2: 197.11 → 214.71) coincide con la serie total de Hermosillo de `data.json`.
- Conclusión: con el parámetro `categories`, este API no publica un índice municipal por categoría. El P del tablero sigue siendo **toda la vivienda con avalúo**, y debe decirlo.
- No se probaron otros nombres de parámetro. La página tiene un filtro «Por tipología» que nadie ha extraído.

## D. Calidad, contrato y proceso
- `observado` es correcto: es un API oficial, y mis 58 lecturas independientes coinciden. La salvedad del productor sobre el resumidor de WebFetch queda resuelta con este muestreo.
- `INT-01` existe en `01_base/integracion/fuentes.csv`, con el límite «toda la vivienda con avalúo (nueva+usada)». Para las categorías conviene precisar en la nota que el mismo API las publica solo a nivel nacional.
- Los checkpoints (21:19:14Z y 21:20:47Z) cuadran con el mtime. El chunk duró unos 2 minutos, así que dos líneas bastan.
- Uso permitido de estas series: contexto nacional y sensibilidad. En 2025 la nueva supera a la usada en 6.5 % (198.84 frente a 186.70). Prohibido «convertir» el índice de Hermosillo a vivienda nueva sin una fila `estimado` con su fórmula y su banda.

## E. Reinstrucciones

```
R-C08-1 | mayor (rótulo visible en el tablero) | responsable: Sol Integración (+ Luna-1 en su CSV)
hallazgo:   la base del índice SHF es 2017=100 según los datos; todo el sistema rotula 2018=100.
evidencia:  GetNationalPrices 2017-2019 Nacional: promedio 2017 = 100.00; GetTerritorialVariation 2017 (2 pares): Hermosillo 100.00, Sonora 100.00; página SNIIV «Año base 2018 = 100» (21:25Z). Versiones: C08 series.csv 21:20:34Z; series-integradas.csv 218 menciones, data.json 144, index.html (3 rótulos visibles).
corrección: unidad «índice 2017=100» en las 150 filas de C08 y en shf-indice-*, p-shf-indice-hermosillo-anual y data.json (ejes.P); nota: «promedio 2017 = 100 verificado en los datos; la página SNIIV rotula 2018 = 100»; corregir los 3 rótulos de index.html.
resolución: grep "2018=100|2018 = 100" = 0 en 01_base/f2-c08*, series-integradas.csv, data.json e index.html; los valores no cambian.

R-C08-2 | menor | responsable: Luna-1
hallazgo:   el localizador «JSON, objeto año=2019, trimestre=1» no describe la estructura real.
evidencia:  la respuesta trae periods[i] (year, quarter) y series[0].values[i] por posición; no hay objeto por año con valor.
corrección: localizador «periods[i] year=AAAA quarter=Q ↔ series[0].values[i]; filterGroup=<nacional|tipo_uso|clase>».
resolución: localizador corregido en las 150 filas.

R-C08-3 | menor | responsable: Luna-1 (Sol valida el nombre)
hallazgo:   segmento «nacional» para la categoría total; serie_id sin el sufijo de geografía de CONTRATO-F2 §1.
evidencia:  series.csv: segmento=nacional en f2-shf-nacional-nacional; las clases SHF no son bandas de precio.
corrección: segmento=total para Nacional; nota «clase de vivienda SHF (no banda de precio)» en las dos clases; serie_id del tipo shf-indice-{total,nueva,usada,economica-social,media-residencial}-nacional.
resolución: integrar.py valida 0 errores con los ids nuevos.

R-C08-4 | menor | responsable: Luna-1
hallazgo:   la prueba territorial queda como «no concluyente» cuando ya es concluyente.
evidencia:  §C: Nueva = Usada = total en Hermosillo con dos pares de trimestres; filters omite categories.
corrección: en notas.md, «con el parámetro categories el API no desagrega por categoría a nivel municipal (probado con Nueva y Usada; otros nombres de parámetro no probados)».
resolución: nota actualizada; 0 filas territoriales por categoría.
```
