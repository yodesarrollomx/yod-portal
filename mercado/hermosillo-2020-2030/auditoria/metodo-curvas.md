# Método de curvas honestas — Hermosillo 2020–2030

Astra · v1 · 2026-11-01. Para Sol Integración (construye el tablero) y para Alejandro (debe poder explicarlo en dos minutos).

## 1. El problema
Por año solo vemos un punto: cuánto se vendió (Q) y a qué precio (P). Las curvas no se observan; son una forma de contar por qué el punto se movió. Si se dibujan, hay que decir qué es dato y qué es supuesto.

## 2. Método recomendado: curvas de elasticidad constante ancladas al punto
Cada año t, ambas curvas pasan exactamente por (P_t, Q_t):
- Demanda: `Q_D(P) = Q_t × (P / P_t)^(−e_d)`
- Oferta: `Q_S(P) = Q_t × (P / P_t)^(+e_s)`

`e_d` y `e_s` (elasticidades-precio: % que cambia la cantidad si el precio cambia 1%) son el único parámetro no observado. Van en el tablero como deslizador rotulado "SUPUESTO, no dato", con base y rango. En ±30% alrededor de P_t se ven casi rectas, como en el video.

Por qué: un parámetro por curva con significado claro; nunca da cantidades negativas; el desplazamiento anual sale de los datos con aritmética visible:
- demanda (a precio constante): `d_t ≈ %ΔQ + e_d × %ΔP`
- oferta: `s_t ≈ %ΔQ − e_s × %ΔP`

Ejemplo ilustrativo (no es Hermosillo): P +10%, Q +5%; con e_d = 0.7 la demanda se movió +12%; con e_s = 1.5 la oferta −10%. Mover el deslizador cambia magnitudes, no la lectura cualitativa:

| Punto | Robusto | Depende del supuesto |
|---|---|---|
| P↑ Q↑ | demanda a la derecha | cuánto se movió la oferta |
| P↑ Q↓ | oferta a la izquierda | cuánto la demanda |
| P↓ Q↑ | oferta a la derecha | cuánto la demanda |
| P↓ Q↓ | demanda a la izquierda | cuánto la oferta |
| P o Q estables | ambas se movieron | el reparto completo |

Rechazado: estimar las pendientes con los datos de Hermosillo. Con 7 puntos no se identifica nada; sería un supuesto disfrazado.

## 3. Elasticidades: literatura citable y rangos
No encontré estimaciones para Hermosillo ni para municipios mexicanos. Citable:

**Demanda**
- México, microdatos hipotecarios 2002–2004, 21 ZM: elasticidad-precio −0.3; ingreso permanente 0.8; tasa hipotecaria (25 años) −0.39. Fontenla y González (2009), *J. Housing Economics* 18(1): https://ideas.repec.org/a/eee/jhouse/v18y2009i1p1-12.html
- México, hogares: gasto en vivienda inelástico (sin cifra en resumen). Adamuz y González (2016), *El Trimestre Económico* 83(330): https://ideas.repec.org/a/elt/journl/v83y2016i330p311-337.html
- Internacional: resumen de Mayo −0.6 a −0.7; Goodman y Kawai −0.24 a −0.31 propietarios: https://allengoodman.wayne.edu/Research/PUBS/gk_sej.pdf

Esas cifras miden demanda de *servicios de vivienda* (stock). Comprar vivienda *nueva en un año* es un flujo: se puede esperar, ir a usada o rentar, así que es plausiblemente más elástica. **Supuesto: e_d base 0.7, rango 0.3–1.5.**

**Oferta**
- OCDE largo plazo: flexible en Norteamérica y nórdicos, rígida en Europa continental y RU. Caldera y Johansson (2013): https://econpapers.repec.org/RePEc:eee:jhouse:v:22:y:2013:i:3:p:231-249 . Valores por país (Swank et al. vía ESRI 2015): Alemania 2.05, EUA 1.40, Francia 1.09, Dinamarca 0.66, RU 0.45, Países Bajos 0.30: https://www.esri.ie/system/files/publications/QEC2015WIN_SA_Morley.pdf ; España 0.45–0.58: https://www.housingfinance.org/wp-content/uploads/2020/04/4_5_Asa_Johansson_English.pdf
- Emergente, corto plazo con permisos: Bogotá 4.7–9.9, Armenia 14.8–22.4 (López y Sarmiento 2025, Banrep 1330): https://ideas.repec.org/p/bdr/borrec/1330.html ; promedio internacional de permisos ≈4 en los 2000 (BIS 2024): https://bis.org/publ/qtrpdf/r_qt2412c.htm

Las cifras de permisos son altas porque reaccionan rápido; terminadas y vendidas en el mismo año reaccionan con 12–24 meses de rezago, y en Hermosillo pesan agua y suelo servido. **Supuesto: e_s base 1.5, rango 0.5–3.0.** Bases y límites van en `supuestos.csv` (parámetro, base, rango, justificación, URL), editables sin tocar datos.

## 4. Rotulado e incertidumbre
- **Observado**: el punto y los desplazadores, con fuente al tocarlos. P real a calidad constante y Q deduplicada llevan `estimado` con fórmula visible.
- **Supuesto**: pendientes, probabilidades de ejecución de cartera, sendas de empleo y tasa en escenarios. Texto gris con la palabra "supuesto".
- **Bigote del punto**: Q entre mínimo y máximo de las fuentes conciliadas (créditos deduplicados, CANADEVI, RUV vendida); P entre promedio simple y calidad constante. Si el bigote supera el movimiento anual: "movimiento no distinguible del ruido de fuentes".
- **Abanico de curvas**: entre e mínimo y máximo; base en trazo firme.
- **2026**: marcador hueco al corte + cierre estimado con rango; nunca curva "2026 completo" sin esa marca.
- **Inventario** terminado sin vender (SNIIV): semáforo junto al punto. Única evidencia admitida de exceso de oferta; jamás DTU − créditos.
- **Precio administrado** (Vivienda para el Bienestar): bloque aparte en el eje Q, fuera de la curva de mercado.

## 5. Escenarios 2027–2030 (base / alto / bajo)
Cada escenario es un desplazamiento anual de cada curva; el cruce da el punto:
- `%ΔP ≈ (d − s) / (e_d + e_s)`
- `%ΔQ ≈ (e_s × d + e_d × s) / (e_d + e_s)`

Insumos, todos de `series.csv` o `supuestos.csv`:
1. **Oferta (s)**: cartera deduplicada por etapa (entregada / en construcción / asignada / anunciada) × probabilidad de ejecución por etapa y año (rango, supuesto, justificado en `supuestos.csv`); público y privado separados; metas nunca como entregas. s_t = oferta esperada_t / Q último año observado − 1.
2. **Demanda (d)**: empleo IMSS (%Δ) + ingreso real (%Δ × 0.8) + tasa hipotecaria (%Δ × −0.39) + hogares CONAPO. Alto/bajo = máximo y mínimo observados 2021–2025 de cada serie; base = mediana. Nada fuera de lo observado o citado.
3. **Techo de absorción**: ningún Q supera el máximo anual observado 2020–2025 × (1 + crecimiento de empleo del escenario) sin justificación escrita.
4. **Salida**: tres puntos por año con curvas punteadas y tabla "qué tendría que pasar" con los insumos.

## 6. Prueba de honestidad: lo que el tablero NO podrá afirmar
1. Que hay déficit o superávit. Solo muestra ventas, precio e inventario.
2. Que un desplazador causó el movimiento; solo que la dirección es coherente. Con 7 años no hay prueba estadística.
3. Que las pendientes son de Hermosillo: son literatura de otros mercados.
4. Que el punto es "el mercado": excluye contado no financiado, informal y usada.
5. Que 2026 cerró en X mientras la fuente esté al corte.
6. Que los programas entregarán lo anunciado: se usan probabilidades, no promesas.
7. Qué curva se movió cuando P o Q quedaron estables.
8. Que el precio "debería" valer algo: los escenarios son rangos condicionados.
9. Que la vivienda es más o menos accesible, salvo ingreso en la misma cobertura y con elegibilidad ≠ compra.
10. Que segmentos de precio de distintos años son comparables sin armonizar bandas e inflación.
