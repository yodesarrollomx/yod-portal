# Criterios de aceptación — Fase 2 (escenarios 2027–2030 y cierre 2026)

Astra · v1 · 2026-11-01T21:22Z. Base: CONTRATO, CONTRATO-F2, metodo-curvas, dictamen-fase1, TABLERO, `series-integradas.csv` (1,566 filas), `data.json` v2.

## 0. Reglas comunes
- Formato del contrato (14 columnas; `cartera.csv` 16). Un `serie_id` = una geografía y una unidad. `calidad` del catálogo + `supuesto`; proyecciones de terceros = `declarado`/`prensa`.
- Muestreo: reabro con WebFetch **≥8 valores por chunk de datos** (≥1 por serie, elegidos por mí). Tolerancia: transcrito 0; suma de enteros ±1; cociente ±0.5 %. Una revisión de la fuente no es error si la entrega fecha su corte (registro ambos valores). Recalculo con script propio toda cifra derivada.
- Checkpoints en tiempo real (horas coherentes con mtime, R12).
- **ACEPTADO**: 0 discrepancias, recálculo coincide, contrato completo. **CON CORRECCIONES MENORES**: nota/rótulo/calidad que no cambia ningún número que llegue al motor. **RECHAZADO**: discrepancia no explicada en un valor que entra al motor; mezcla de geografía o unidad; suma prohibida; número sin fuente no rotulado `supuesto`; calidad inflada; parcial como año; dato de memoria.

## 1. Por chunk (existe · compruebo · rechazo)

**C01 Pipeline RUV.** Registro, verificación y DTU mensuales 2022-01…2026-07 por segmento, sin huecos; rezago registro→DTU como distribución o rango, con método escrito (cohortes o correlación cruzada, ventana, sensibilidad). · Meses suman el cubo anual 2022–2025 (±0); recalculo el rezago (±1 mes; cociente ±5 %). · Rechazo: mes faltante, segmentos fusionados, rezago sin método, lotes de registro sin marcar (dic-2022; abr-2026 = 1,548 «Popular»), DTU comparado con Q en niveles.

**C02 Inventario terminado (R9).** Mensual 2024-01…2026-07 por avance y segmento; definición HBT citada o «no localizada» con intentos; proxy «terminada sin vender» (3 categorías HBT) con banda; nota R9 (crédito privado no individualizado → sesgo al alza Media/Residencial). · Categorías suman el total municipal de cada mes. · Rechazo: inventario total como exceso de oferta; DTU − créditos; «meses de inventario» con denominador Q (debe ser venta del universo RUV); HBT de memoria.

**C03/C04 Cartera pública/privada (R8).** `cartera.csv` con etapa de vocabulario cerrado, fecha, localizador que **cite las palabras de la etapa** y `posible_duplicado_de` resuelto (Sello H ⊃ Bienestar). En `nota`: **«entra a Q: sí/no/incierto»** (crédito INFONAVIT → Q; subsidio CONAVI → bloque precio administrado). · Reabro ≥8 filas (unidades, etapa, fecha); mismo programa = mismo `cartera_id`; contraste de coherencia (no suma) con registro RUV. · Rechazo: sumas; etapa inferida sin texto; Sonora asignado a Hermosillo sin fila `estimado`; `meta` como entrega; usar `cartera-suma-programas-hermosillo` como insumo.

**C05 Empleo e ingreso (R7).** Asegurados IMSS municipio ≥1 valor/año 2019–2025 + último 2026; una definición por `serie_id` (dic **o** promedio; trabajadores **o** puestos); nota «registro patronal ≠ residencia»; salario municipal o `-sonora`; deflactor declarado. · %Δ coherente con 260,693 (dic-2025, prensa). · Rechazo: flujo mezclado con stock; estatal como municipal; hueco 2019–2025.

**C06 Población y hogares.** Serie anual 2020–2030 con versión CONAPO citada; interpolación = `estimado` con fórmula; hogares = población ÷ tamaño medio (Censo 2020 observado; trayectoria `supuesto`) salvo fuente directa. · Rechazo: proyección `observado`; «viviendas habitadas» HCV como hogares; versiones CONAPO/COESPO mezcladas.

**C07 Crédito y macro.** Encuesta Banxico (inflación, PIB, tasa objetivo 2026–2028) con **rango publicado** y fecha; tasa hipotecaria más reciente; política INFONAVIT 2026 oficial; objetivo→hipotecaria vía diferencial observado 2020–2026 (`supuesto`); INPC 2020–2024 `observado` (R10). · Rechazo: pronóstico de memoria; punto sin rango; tasa objetivo usada como hipotecaria.

**C08 SHF por categoría.** Niveles trimestrales por categoría con URL exacta, base declarada y resultado de cada filtro territorial (URL probada + respuesta). · ≥8 niveles; promedios anuales. · Rechazo: categoría nacional como municipal; bases mezcladas; valor no reproducible; «convertir» Hermosillo a nueva sin fila `estimado`. El P del tablero es **toda la vivienda con avalúo**: debe decirlo.

**C09 Supuestos.** `supuestos.csv` (parámetro, base, mín, máx, unidad, tipo, justificación, URL); probabilidades por etapa y año; sendas base/alto/bajo por desplazador 2026–2030. · Reabro ≥8 fuentes; recalculo cada senda. · Rechazo: probabilidades no monótonas; meta con probabilidad >0; cartera duplicada; insumo fuera de lo observado/citado sin justificación; tasa «por punto porcentual» (§2.3).

**C10 Backtest.** Ver §3.

**C11→C12 Tablero.** Precondiciones del motor: `escenarios.py` reproducible (dos corridas = mismo hash de `data.json`); no lee las 6 series multi-geografía (`precio-shf-var-*`, `precio-shf-medi*-mxn`, `canadevi-hermosillo-escrituradas-anual`, `prog-canadevi-plan-privado`), las 2 multi-unidad (`*derrama*`) ni las 15 claves duplicadas `prog-*` aún presentes en `series-integradas.csv`. Debe existir: 3 escenarios 2027–2030 punteados; abanico de elasticidades; 2026 hueco al corte + cierre con rango; tabla «qué tendría que pasar» con cada insumo rotulado (dato/supuesto + fuente); resultado del backtest visible; techo marcado si activo. Cierre 2026: Q = ene–jul ÷ participación ene–jul (misma fórmula) en **≥3 años** — hoy solo 2025 tiene meses por tipo: extraer 2021–2024 de `GetInfonavit/…/anio,mes,tipo_credito,modalidad`; centro = mediana, rango = mín–máx; P = promedio 1S + rango de estacionalidad 2S 2021–2025. · Recalculo ≥6 puntos de escenario; grep de números tecleados en el HTML; capturas reales 390 y 1440 px sin desborde. · Rechazo: números a mano; escenario con aspecto de observado; CONAVI dentro de la curva; P nominal y real mezclados; frases de §2.8; 2026 como año completo.

## 2. Honestidad de los escenarios (precisiones obligatorias al método §5)
1. **Logaritmos** (exacto con elasticidad constante): `ΔlnP = (δd − δs)/(e_d + e_s)`, `ΔlnQ = (e_s·δd + e_d·δs)/(e_d + e_s)`; historia: `δd = ΔlnQ + e_d·ΔlnP`, `δs = ΔlnQ − e_s·ΔlnP`. Mostrar % = eˣ − 1.
2. **P real** en desplazamientos y escenarios, con deflactor del mismo periodo (INPC promedio anual para índice promedio anual; hoy `data.json` usa dic/dic: corregir o declarar). Nominal solo para mostrar, con inflación esperada de C07.
3. **Demanda δd** = un solo término de margen extensivo — empleo IMSS (base: Q es crédito formal) **o** hogares (sensibilidad); sumar ambos es doble conteo — + e_y·%Δ ingreso real por trabajador (0.8; 0.5–1.0 `supuesto`) + e_r·%Δ **relativo** de la tasa hipotecaria: Fontenla y González, «mortgage rate elasticity… −0.39» (reabierto hoy) es elasticidad, no «por punto porcentual» como rotulan `supuestos.csv` y `data.json`. Base = mediana 2021–2025 o centro de la encuesta Banxico; alto/bajo = extremos observados o rango de la encuesta, rotulados «extremo conjunto».
4. **Oferta δs** = pipeline RUV con rezago C01 + cartera × probabilidad + inventario terminado como freno, calculada **dentro del mismo universo**: entregas esperadas ÷ entregas observadas comparables (DTU para lo registrado en RUV); nunca unidades de cartera ÷ Q. Cartera sin línea base observada: solo `supuesto` de rango amplio. Fuera de δs: CONAVI/subsidio (bloque aparte) y metas (texto). Duplicados posibles entre programas: cuenta el conjunto mayor; el menor solo amplía la banda. Misma cartera en fechas distintas: vale el último dato con etapa explícita; los previos solo amplían la banda.
5. **Probabilidades por etapa**, por jerarquía de evidencia: (a) conversión observada en Hermosillo (registro→DTU a 12/24 meses, C01); (b) avance oficial del mismo programa; (c) literatura citada; (d) `supuesto`, con rango que incluya 0 para anunciada/en_proyecto sin evidencia local. Monótonas por etapa. Año de entrega por el rezago medido; la fecha prometida solo acota la velocidad.
6. **Techo**: `techo_t = 3,748 (máx. 2021) × E_t^esc / E_2021` (E = empleo IMSS). Si se activa: Q = techo y P recalculado **sobre la curva de oferta** (`ΔlnP = (ΔlnQ − δs)/e_s`; el techo es una restricción de absorción, es decir, de demanda; corregido el 21:40Z, la v1 decía «sobre la demanda» y era un error), «techo activo» en la tabla.
7. **Rango**: 3 puntos + abanico de elasticidades + su envolvente; el rango 2027 incluye el del cierre 2026 (punto de partida estimado); leyenda «rango condicionado a supuestos; no es intervalo de confianza»; sin probabilidad por escenario; Q en múltiplos de 50, P a 1 punto de índice; sin P en MXN para 2027–2030 mientras no haya ancla validada.
8. **No puede afirmar** sobre 2027–2030: «pronóstico», «se venderán», «el precio llegará a», «escenario más probable»; déficit/superávit; que un programa entregará; que un desplazador causará; precisión mayor que el rango; ni nada de §6 del método.
9. Parámetro sin fuente = `supuesto` con rango amplio y justificación; nunca dato.

## 3. Backtest mínimo (C10)
- **Preregistro**: checkpoint con elasticidades (0.7/1.5), reglas de §2 e insumos, con hora anterior a los resultados.
- Información ≤2023; declarar vintage actual (pseudo-fuera de muestra, favorece al método). Proyectar 2024 (h=1) y 2025 (h=2) en dos variantes: (A) incondicional, reglas de escenario con datos ≤2023; (B) condicional, desplazadores realizados 2024–2025, oferta por pipeline RUV (sin vintage de cartera 2023: declararlo).
- Comparadores ingenuos: Q_t = Q_2023; P real al crecimiento promedio 2021–2023.
- Métricas: error log de Q y P por año; acierto de signo; observado dentro de la banda (escenarios × abanico); error vs. ingenuo; correlación δd implícito vs. δd construido con desplazadores 2021–2025.
- **Mal resultado**: año fuera de banda → la banda 2027–2030 se ensancha al menos en el error absoluto máximo de h=2 y el panel dice «el método no contuvo 2024/2025»; error mayor que el ingenuo → en el cuerpo del panel, no al pie: «en 2024–2025 el método no superó a la inercia». Prohibido reajustar parámetros tras ver el ajuste: lo posterior es sensibilidad; el titular es lo preregistrado. Dos puntos no prueban exactitud.

## 4. Valores de control (recalculados hoy)
Q ene–jul 2025 = **1,760** (712 + (332+868)/2 − 101 − 183 − 75 + 129 + 678; el encargo dice 1,761: usar 1,760 o justificar). Q ene–jul 2026 = 1,979. Participación ene–jul 2025 = 0.5816 (único año). P promedio 2020 = 124.40; 2025 = 198.43; 1S2026 = 212.04 ✔. Base del índice SHF = **2017=100** según los datos, no 2018 (ver `dictamen-C08.md`).


## Anexo v3 · precisiones integradas por Sol (2026-11-01T22:20Z), propuestas por la auditoría

Origen: R-C10-3 (dictamen-C10.md, Astra-3) y el apéndice de dictamen-C09.md (Astra-5). Texto tal como lo propuso el auditor; prevalece sobre §2.3 y §2.4 donde choque.

**§2.4 (v3)**
- (a) **Tubería.** δs de tubería = ln(E_t/E_t0), con E calibrada de modo que E_t0 = DTU_t0 en el mismo universo. Nunca un nivel ajustado contra uno observado. En 2027–2030 un modelo de rezago sólo entra como `supuesto`, rotulado «la tubería no pasó el backtest C10». Su rango debe contener la variación observada del DTU **del mismo universo** que cubre: si la tubería cubre un subconjunto de segmentos, el rango sale de ese subconjunto. Un año de rebote se incluye o se excluye con razón escrita, con la misma regla en los dos extremos.
- (b) **Calendario de cartera.** Todo calendario de entregas de cartera debe reproducir el DTU observado de su segmento al corte (±10 %), o declarar la diferencia. El valor del base no puede pasar de lo que da esa calibración.
- (c) **Suma de componentes.** El δs total de un año queda dentro de la variación observada del DTU total 2021–2025, salvo nota que cuantifique el excedente y la novedad documentada que lo justifica. No se apila un freno sobre el peor año observado sin justificarlo.
- (d) **Topes y pisos de nivel.** Deben ser niveles observados. El producto de extremos de años distintos no es un nivel observado.

**§2.3 (precisión)**
- «Extremo conjunto» = todos los desplazadores del lado que mueve Q en la misma dirección.
- El nombre visible describe la combinación («más demanda y más oferta» / «menos demanda y menos oferta»).
- Estos escenarios no acotan P. Si el panel muestra un rango de P, debe incluir los cruces (demanda alta con oferta baja, y al revés) o decir que no los cubre.
