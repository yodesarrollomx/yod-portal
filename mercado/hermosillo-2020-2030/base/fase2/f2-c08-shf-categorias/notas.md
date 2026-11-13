# C08 · Índice SHF por categoría (Luna-1)

Fecha de consulta: 2026-11-01. Herramienta: WebFetch (no curl, no Bash para red, no navegador del usuario, sin POST).

## Qué funcionó (A: nacional por categoría)

Las cinco URLs devolvieron datos. Cada una trae 30 trimestres, de 2019-Q1 a 2026-Q2:

| Categoría (API) | serie_id | Filas | 2019-Q1 | 2026-Q2 |
|---|---|---|---|---|
| Nacional | f2-shf-nacional-nacional | 30 | 115.04 | 205.87 |
| Nueva | f2-shf-nacional-nueva | 30 | 114.96 | 212.18 |
| Usada | f2-shf-nacional-usada | 30 | 115.13 | 198.12 |
| Económica - Social | f2-shf-nacional-economica-social | 30 | 112.57 | 213.41 |
| Media - Residencial | f2-shf-nacional-media-residencial | 30 | 116.43 | 201.61 |

- Ninguna categoría devolvió la misma serie que Nacional. Las cinco series son distintas en los 30 trimestres.
- Chequeo mecánico: en los 30 trimestres, el valor de Nacional queda entre Nueva y Usada. No hay contradicción interna.
- Total escrito en `series.csv`: 150 filas, 14 columnas.

## Qué no se pudo confirmar

- **Base y unidad.** Las respuestas JSON no declaran métrica, unidad ni base del índice. Corrección de auditoría (R-C08-1, Sol Integración 21:31Z): la base es **2017=100** — el promedio de 2017 da 100.00 en Nacional, Hermosillo y Sonora (dictamen-C08 §B); la página del SNIIV indica como año base 2018, lo que sus propios datos contradicen.
- **Lectura por WebFetch.** Los valores llegaron como tabla renderizada por WebFetch, no como bytes crudos del JSON. Un segundo WebFetch de la misma URL habría salido de caché (15 min), así que no hubo verificación independiente. Se recomienda contrastar al menos 2019-Q1 y 2026-Q2 de cada categoría con una lectura del JSON fuera de este chunk.
- **Ortografía.** La API escribe la categoría como `Económica - Social`. En `segmento` se usó minúscula, según la convención de CONTRATO.md.
- **fuente_id.** `INT-01` se usó tal cual. Este chunk no escribió `fuentes.csv`; falta confirmar que `INT-01` corresponda al SHF/SNIIV.

## Filtro territorial por categoría (B)

Resultado: no hay evidencia de que el filtro por categoría funcione.

- `GetTerritorialVariation` con `categories=Nueva` y con `categories=Usada` devolvió para Hermosillo (stateCode 26, municipalityCode 030) los mismos valores: `initialValue` 197.11, `finalValue` 214.71, `variationPercentage` 8.93. Coinciden con la referencia sin categoría.
- El objeto `filters` no muestra categoría. Solo contiene `baseYear` 2025, `baseQuarter` 2, `finalYear` 2026, `finalQuarter` 2.
- El campo `category` aparece únicamente en `metropolitanAreas`. No se sabe si esa categoría es la de precio o es otra clasificación.
- Limitación de la herramienta: WebFetch respondió que no podía reproducir el JSON completo de forma literal, porque el límite de citas de documento fuente es de 125 caracteres. Solo describió la estructura: 32 `states`, 74 `municipalities` y 8 `metropolitanAreas`.
- Conclusión (R-C08-4): con el parámetro `categories` el API no desagrega por categoría a nivel municipal (probado con Nueva y Usada; otros nombres de parámetro no probados). 0 filas territoriales por categoría.
- No se escribió ninguna fila territorial en `series.csv`.

## Qué no se obtuvo

- Ningún valor municipal por categoría. El filtro territorial no devolvió diferencias por categoría.
- Ningún valor `por verificar`. Todas las filas de `series.csv` son `observado` según la regla del encargo, con la salvedad de la lectura vía WebFetch anotada arriba.

## Hallazgos para el auditor

1. Las cinco series SHF por categoría son distintas y consistentes entre sí (Nacional entre Nueva y Usada en todos los trimestres).
2. El filtro territorial no muestra efecto de categoría en Hermosillo.
3. ~~Confirmar base~~ Resuelto: base 2017=100 (dictamen-C08). Uso permitido: contexto nacional y sensibilidad; prohibido convertir el índice de Hermosillo a vivienda nueva sin una fila `estimado`.


## Correcciones aplicadas tras el dictamen (Sol Integración, 2026-11-01T21:31Z)
- R-C08-1 unidad `índice 2017=100` en las 150 filas; R-C08-2 localizador `periods[i] year=… quarter=… ↔ series[0].values[i]; filterGroup=…`; R-C08-3 `serie_id` `shf-indice-{total,nueva,usada,economica-social,media-residencial}-nacional`, segmento `total` para Nacional y nota «clase de vivienda SHF (no banda de precio)»; R-C08-4 nota del filtro territorial. Ningún valor cambió (copia previa: `series.v1-luna.csv`).
