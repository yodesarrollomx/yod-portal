# Hermosillo 2020–2030 · Oferta y demanda de vivienda nueva

Tablero estático (sin backend, sin sesión, sin datos privados): `index.html` + `data.json`.
Publicado en `https://yodesarrollomx.github.io/yod-portal/mercado/hermosillo-2020-2030/`.

Encargo de Dirección (1-nov-2026, Buzón Claude ↔ ChatGPT fila 505, ID `CG-HMO-OFERTA-DEMANDA-20261101`):
el diagrama clásico de oferta y demanda (precio arriba, viviendas abajo) del municipio de Hermosillo, año por año,
con las curvas desplazándose en el tiempo, cada número rastreable a su fuente y la pendiente declarada como supuesto.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `index.html` | El tablero. Lee `data.json` por `fetch` (abrir desde el servidor, no como archivo). |
| `data.json` | Puntos de equilibrio por año (P, Q, rango), oferta (DTU, registro, inventario RUV), desplazadores con fuente, supuestos y enlaces citados. Lo genera `base/construir_data.py`. |
| `base/series-integradas.csv` | La base completa: 1,331 valores de tres frentes (oferta, demanda, precios-financiamiento), formato largo del `base/CONTRATO.md`: serie, unidad, geografía, segmento, periodo, valor, fuente, URL, localizador, corte, calidad, nota. |
| `base/fuentes-*.csv`, `base/notas-*.md` | Fuentes y notas de cada frente (definiciones, contradicciones entre fuentes, qué no se obtuvo). |
| `base/supuestos.csv` | Elasticidades y parámetros de escenario: base, rango, justificación y referencia. Son supuestos, no datos. |
| `auditoria/` | Criterios de aceptación, método de las curvas, lista de comprobación y re-extracción independiente de 26 cifras (26/26 coinciden). |

## Definiciones que no se mezclan

- **Q** = créditos de adquisición de vivienda **nueva** colocados en el municipio (INFONAVIT + FOVISSSTE + banca CNBV, SNIIV/SEDATU). Rango: mínimo sin cofinanciamientos, máximo con todos los organismos (incluye CONAVI).
- **P** = proxy: crédito promedio INFONAVIT (o banca) para vivienda nueva en el municipio. No es precio de vivienda. Pendiente: niveles del índice SHF para Hermosillo y precio medio de vivienda nueva vendida.
- Producción (DTU) ≠ inventario ≠ créditos ≠ escrituras ≠ metas de programas. Nunca se restan para hablar de déficit.
- 2026 está **al corte** (SNIIV 31-jul-2026): el punto hueco es una proyección simple del semestre, no un cierre.
- 2027–2030: escenarios base/alto/bajo pendientes (Fase 2), construidos con cartera deduplicada y rangos.

## Cómo se actualiza

1. Reabrir las fuentes y editar los `series.csv` de cada frente (en el expediente de trabajo), respetando `base/CONTRATO.md`.
2. `python3 -I integrar.py` → `series-integradas.csv`; `python3 -I construir_data.py` → `data.json`.
3. Revisar en iPhone y escritorio; publicar por PR.

Calidad de cada cifra: `observado` (leída en fuente oficial), `estimado` (cálculo propio con fórmula visible), `declarado` (lo dijo un actor), `prensa`, `por verificar` (no se pudo reabrir la fuente).

Entra al menú de YOD OS justo debajo de PPP (`os/catalogo.js`, `SYS-MERCADO`, código `MH`) y carga el marco `shell.js` (menú, identidad, chinche) como cualquier tablero de la casa; con `?embed=1` se ve sin marco. Los datos (`data.json`, `base/`) siguen siendo públicos en el repositorio.
