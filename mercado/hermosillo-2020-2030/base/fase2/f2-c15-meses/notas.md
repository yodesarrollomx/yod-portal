# Notas C15 · Meses 2021–2024 para el cierre 2026 (vivienda nueva, municipio Hermosillo)

Fecha de consulta: 2026-11-01. Geografía: municipio Hermosillo (SNIIV 26/030). Modalidad o línea: Nueva.

## Qué se obtuvo
- `series.csv`: 466 filas, 10 series, periodo 2021-01 a 2024-12, calidad `observado`.
- Series escritas: INFONAVIT por tipo (Conyugal, Individual, Unamos), INFONAVIT por esquema (Apoyo infonavit, Cofinavit, Tradicional, Infonavit total, Segundo crédito), FOVISSSTE nueva y CNBV "Adquisición de Vivienda Nueva".
- Campo leído en todas las fuentes: `acciones`. Se trata como créditos (unidad `créditos`). Confirmar que es la unidad que quiere Sol.

## Cómo se leyó
- Las consultas de 2021–2024 completas de INFONAVIT (tipo y esquema) y CNBV no devolvieron el JSON completo: WebFetch se negó a reproducir las filas o devolvió solo una muestra. Se pidió **año por año** (2021, 2022, 2023 y 2024 por cada URL), como indica el contrato, y en CSV. Son 12 consultas.
- FOVISSSTE: la consulta 2021–2024 sí devolvió la tabla completa (96 filas, Nueva y Existente). Se usó solo Vivienda Nueva.
- La variante FOVISSSTE con `linea_credito` no fue necesaria: la modalidad sola cuadra los cuatro años.
- Solo se usaron las filas Nueva / Vivienda Nueva / Adquisición de Vivienda Nueva. Existente, Usada, Ampliación, Mejoravit, Pago de pasivos, etc. no se extraen.
- Campo `monto` de CNBV no se extrae (fuera del encargo).

## Control de sumas (suma de 12 meses vs total anual validado)

| Año | Categoría | Suma de meses | Total anual | Diferencia | Resultado |
|---|---|---:|---:|---:|---|
| 2021 | FOVISSSTE nueva | 334 | 334 | 0 | cuadra |
| 2022 | FOVISSSTE nueva | 247 | 247 | 0 | cuadra |
| 2023 | FOVISSSTE nueva | 264 | 264 | 0 | cuadra |
| 2024 | FOVISSSTE nueva | 274 | 274 | 0 | cuadra |
| 2021 | CNBV nueva | 1730 | 1730 | 0 | cuadra |
| 2022 | CNBV nueva | 1861 | 1861 | 0 | cuadra |
| 2023 | CNBV nueva | 1666 | 1666 | 0 | cuadra |
| 2024 | CNBV nueva | 1368 | 1368 | 0 | cuadra |
| 2021 | INFONAVIT cofinavit | 278 | 278 | 0 | cuadra |
| 2022 | INFONAVIT cofinavit | 172 | 172 | 0 | cuadra |
| 2023 | INFONAVIT cofinavit | 215 | 215 | 0 | cuadra |
| 2024 | INFONAVIT cofinavit | 225 | 225 | 0 | cuadra |
| 2021 | INFONAVIT apoyo infonavit | 109 | 109 | 0 | cuadra |
| 2022 | INFONAVIT apoyo infonavit | 200 | 200 | 0 | cuadra |
| 2023 | INFONAVIT apoyo infonavit | 251 | 251 | 0 | cuadra |
| 2024 | INFONAVIT apoyo infonavit | 299 | 299 | 0 | cuadra |
| 2021 | INFONAVIT infonavit total | 33 | 33 | 0 | cuadra |
| 2022 | INFONAVIT infonavit total | 50 | 50 | 0 | cuadra |
| 2023 | INFONAVIT infonavit total | 70 | 70 | 0 | cuadra |
| 2024 | INFONAVIT infonavit total | 127 | 127 | 0 | cuadra |

Resultado: 20 de 20 celdas cuadran.

Cruce interno adicional (no es control validado): INFONAVIT Nueva por tipo_credito contra INFONAVIT Nueva por esquema. Suman igual cada año: 2021 = 2521, 2022 = 2242, 2023 = 2106, 2024 = 2553.

## Hallazgos
1. **Confirmación del orden de cofinavit y apoyo.** El encargo tenía una duda ("(109, 278, 33)?") y después dio el orden cofinavit, apoyo, total. Las sumas confirman ese orden: cofinavit 2021 = 278 y apoyo 2021 = 109.
2. **Tipo "No disponible" no aparece** en INFONAVIT Nueva 2021–2024. No se escribieron filas para `creditos-infonavit-nueva-tipo-no-disponible-mensual`.
3. **Segundo crédito (esquema)** no estaba en la lista del encargo; se incluye por la regla "cualquier otro que aparezca". Tiene filas en 2021–2023 (36 filas). En 2024 no aparece ninguna fila. El cruce tipo–esquema de 2024 (2553 = 2553) indica que no hay registros de esta categoría ese año, no una lectura fallida.
4. **Infonavit total sin fila en 2021-04 y 2021-07.** La API no devuelve esas filas. No se rellenan con cero porque la fila no tendría localizador. La suma anual de 2021 (33) cuadra con las filas presentes.
5. **Unidad.** El encargo pide "créditos", pero la API llama al campo `acciones`. Se usó `créditos`.
6. **fecha_corte 2026-07-31** viene del encargo. No se confirmó en las respuestas de la API.

## Limitaciones de lectura
- Los números llegan a través de una transcripción de WebFetch, no del JSON directo. El control de sumas valida totales anuales y el cruce tipo–esquema, pero no cada celda por separado.
- La extracción no se reabrió en otra herramienta (curl y Playwright dan 403 al proxy).

## Hallazgos para el auditor
- Cualquier fila se puede localizar con `url` + `localizador` (campos de la fila en `series.csv`).
- Para rehacer la extracción: `01_base/f2-c15-meses/extraer.py` (ejecutar con `python3 -I`). Imprime el control de sumas y escribe `series.csv`.
