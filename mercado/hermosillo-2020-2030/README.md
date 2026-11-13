# Hermosillo 2020–2030 · Oferta y demanda de vivienda nueva

Tablero estático: `index.html` + `data.json`, sin backend, sin sesión y sin datos privados.
Publicado en `https://yodesarrollomx.github.io/yod-portal/mercado/hermosillo-2020-2030/`.

Encargo de Dirección del 1-nov-2026 (Buzón Claude ↔ ChatGPT, fila 505, ID `CG-HMO-OFERTA-DEMANDA-20261101`): el diagrama clásico de oferta y demanda del municipio de Hermosillo, con el precio en el eje vertical y las viviendas en el horizontal, año por año y con las curvas desplazándose en el tiempo. Cada número debe poder rastrearse a su fuente y la pendiente se declara como supuesto.

- **Fase 1:** historia 2020–2025.
- **Fase 2:** cierre estimado de 2026 y escenarios 2027–2030.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `index.html` | El tablero. Lee `data.json` por `fetch`, así que hay que abrirlo desde el servidor y no como archivo. |
| `data.json` | Lo genera `base/construir_data.py`. Contiene: equilibrio por año (P nominal y real, Q, rango); cierre 2026; escenarios 2027–2030 con sus cruces y la sensibilidad de hogares; prueba del método; cartera por etapa; desplazadores con fuente; supuestos y fuentes citadas. |
| `base/series-integradas.csv` | La base completa en formato largo (ver `base/CONTRATO.md` y `base/fase2/CONTRATO-F2.md`): frentes de la Fase 1 más un folder por chunk de la Fase 2. |
| `base/fase2/f2-*/` | Un folder por chunk de la Fase 2: tubería RUV, inventario terminado, cartera pública y privada, empleo, hogares, crédito y macro, índice SHF por categoría, supuestos de escenario, prueba del método y meses 2021–2024. |
| `base/motor/` | `cierre2026.py` y `escenarios.py` (motor de escenarios), con sus salidas y pruebas (`tests/test_escenarios.py`). |
| `auditoria/` | Criterios de aceptación de las fases 1 y 2, método de las curvas y un dictamen independiente por chunk (`dictamen-*.md`). |

## Definiciones que no se mezclan

- **Q** = viviendas **nuevas** financiadas en el municipio por año (SNIIV/SEDATU). Se compone de INFONAVIT deduplicado, FOVISSSTE y la banca (CNBV). En INFONAVIT, Conyugal y Unamos Créditos son dos créditos para una sola vivienda, y se descuentan los esquemas que también pasan por un banco. El bigote del punto llega hasta la suma simple de acciones.
- **P** = índice SHF de precios de la vivienda para Hermosillo: promedio anual, **base 2017 = 100**. La página del SNIIV indica 2018, pero el promedio de 2017 en sus propios datos es 100.00. El índice cubre toda la vivienda con avalúo, nueva y usada.
  - **Real**: precios de 2025, deflactados con el INPC nacional promedio anual. Es la escala por omisión, la de los desplazamientos y la única de los escenarios.
- Producción (DTU), inventario, créditos, escrituras y metas de programas son cosas distintas. Nunca se restan entre sí para hablar de déficit.
- **2026** es un cierre **estimado**, no un dato. Se calcula como enero–julio dividido entre la participación que tuvo enero–julio en el año completo de 2021 a 2025: el centro es la mediana y el rango va del mínimo al máximo.
- **2027–2030** son escenarios condicionados a supuestos, no pronósticos, y no se les atribuye probabilidad:
  - «más demanda y más oferta», «base» y «menos demanda y menos oferta» son extremos de la **cantidad**;
  - los dos **cruces** (más demanda con menos oferta, y al revés) muestran hasta dónde podría llegar el precio.
- **Prueba del método** (`base/fase2/f2-c10-backtest/`, preregistrada): con información hasta 2023, en 2024–2025 el método no superó a la inercia. El tablero lo dice en el cuerpo del panel, con cinco precisiones.
- **Empleo formal municipal 2019–2024**: no está disponible en fuentes abiertas. Los escenarios usan el empleo de Sonora como aproximación, rotulada como tal.

## Cómo se actualiza

Los scripts corren en el expediente de trabajo (estructura `01_base/`, `02_cruces/`, `03_visual/`, `04_auditoria/`); aquí se publican copias para consulta y reproducción.

1. Reabrir las fuentes y editar los `series.csv` de cada chunk respetando los contratos.
2. Correr `python3 -I integrar.py` → `python3 -I cierre2026.py` → `python3 -I escenarios.py` → `python3 -I construir_data.py`. Las pruebas del motor: `python3 -I tests/test_escenarios.py`.
3. Revisar el tablero en iPhone y en escritorio, y publicar por PR.

Calidad de cada cifra: `observado`, `estimado` (cálculo propio con fórmula visible), `declarado`, `prensa`, `supuesto` (decisión propia justificada) o `por verificar`.

El tablero está en el menú de YOD OS justo debajo de PPP (`os/catalogo.js`, `SYS-MERCADO`, código `MH`) y carga el marco `shell.js` como cualquier tablero de la casa. Con `?embed=1` se ve sin marco.
