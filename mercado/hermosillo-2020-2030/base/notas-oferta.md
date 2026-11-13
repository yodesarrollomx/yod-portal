# Notas del frente OFERTA (Terra 1) — corte de consulta 2026-11-01

## 1. Qué se obtuvo
`series.csv` (485 filas, 72 `serie_id`) y `fuentes.csv` (35 fuentes). Cada fila lleva URL exacta y localizador.

| Serie | Qué es | Calidad |
|---|---|---|
| `prod-dtu-ruv` (+ `-mensual`, `-segmento`, `-tipo`, `-acum-ene-jul`) | Viviendas con DTU (terminadas) en RUV, municipio, 2020–2025 y ene–jul 2026 | observado |
| `reg-ruv` (+ mensual, segmento, acum) | Viviendas registradas en RUV (oferta que ingresa, antes de construirse) | observado |
| `verif-ruv` | Viviendas en verificación de obra (definición parcial; ver §3) | observado |
| `inv-ruv` (+ `-avance`, `-segmento`) | Inventario RUV (stock): cierres dic-2020…dic-2025, 31-jul-2026 y snapshots de contraste | observado |
| `prod-hcv-canadevi`, `solicitudes-credito-hcv-canadevi` | Lo que HCV imprime citando "estimaciones de CANADEVI" | declarado / por verificar |
| `escrit-canadevi-*` | Viviendas nuevas ESCRITURADAS (CANADEVI Sonora vía El Imparcial): 2025 = 4,808; ene–jun 2026 = 1,970; 2021–2024 solo como acumulado derivado (16,833) | prensa / estimado |
| `cartera-*` | Sello H, "20 mil", CONAVI, INFONAVIT, plan privado CANADEVI (insumo 2027–2030) | prensa / declarado |
| `costo-ceico-*`, `inpp-*` | Variación anual del costo de construcción (3 cortes CEICO; INPP ago-2026) | observado |
| `restr-*` | Agua (indicadores 2020–2023), electricidad (2 subestaciones) | observado / prensa / por verificar |

## 2. Método y límite de lectura (importante para el auditor)
- `curl` y Playwright quedaron bloqueados: el proxy de la sesión devuelve 403 en el CONNECT para TODOS los hosts (incluido example.com); no se intentó rodear la política. No se descargó ningún PDF/CSV a `05_descargas/oferta/` (carpeta vacía).
- Todo se leyó con **WebFetch**, que entrega el JSON literal o una tabla reformateada por un modelo. Control aplicado: en cada consulta por dimensión (mes, segmento, tipo, avance de obra) la suma coincide con el total leído en una llamada independiente.
- `fecha_corte`: SNIIV = 2026-07-31 (corte del cubo; el snapshot de inventario está en `periodo`). En filas de prensa es la fecha de publicación o el fin del periodo reportado; `n/d` si la fuente no lo indica (HCV 2026, Sello H sep-2026).
- Las URLs del API SNIIV son GET públicos: el auditor puede pegarlas en el navegador y ver el JSON en segundos.
- El diccionario de datos (XLSX) no es legible por WebFetch; las etiquetas `HBT - 5m`, `HBT + 5m`, `Sin HBT` NO están definidas en las páginas leídas.

## 3. Definiciones (no fusionar)
- **Producción SNIIV** = viviendas que obtuvieron el Dictamen Técnico Único (DTU) en el periodo (texto de Datos abiertos). Solo vivienda registrada en RUV.
- **Registro** = viviendas que ingresan al RUV. Según Días de inventario el orden es registro → verificación (inicio) → DTU → venta.
- **Inventario** (página Cubo/Inventario "Al 31 de julio de 2026" + Metodología SNIIV, OF-32) = "fotografía mensual de las viviendas registradas y no vendidas": vigentes en RUV, NO individualizadas (sin crédito ni subsidio) y dentro de una ventana de 24 meses desde el DTU; excluye Cancelado, En trámite, CUV no válida, Sin orden de verificación y reventa. Es stock y MEZCLA obra no iniciada, en proceso y terminada sin vender; una vivienda terminada sin vender con más de 24 meses sale del inventario, y la vendida de contado podría seguir contando (inferencia no confirmada). Tampoco la metodología define HBT.
- **Segmentos** SNIIV en veces UMA (glosario): Económica ~118; Popular 118.1–200; Tradicional 200.1–350; Media 350.1–750; Residencial 750.1–1,500. No se convirtió a MXN.
- **CANADEVI/El Imparcial**: "viviendas escrituradas" (la semilla decía "operaciones", no es lo que dice el texto).
- **HCV**: no define "producción" ni "solicitudes de crédito"; cita a CANADEVI sin nota al pie.

## 4. Contradicciones (ambos valores)
1. **Producción 2024**: HCV 2026 p. ~46 = **792** vs SNIIV DTU = **1,981**. En 2025 coinciden (2,386). Además **792 = suma SNIIV de DTU ene–may 2025** (104+190+166+219+113): posible etiqueta equivocada o coincidencia; no resuelto.
2. **Producción 2023** (semilla HCV 2025, no reabierta) **1,882** vs SNIIV **1,704**. 2020–2022 de la semilla (1,802; 2,271; 1,667) coinciden exactamente con SNIIV.
3. **2025, tres cifras con definiciones distintas**: DTU 2,386; registro 5,657; escrituradas CANADEVI 4,808. No se concilian con los datos disponibles (no hay altas comercializables ni retiros); no se intentó balance.
4. **Inventario dic-2022 = 7,334** vs nov-2022 3,987 y ene-2023 4,072: pico de un solo mes (Avance 0 = 2,152 vs ~400–565 en otros cierres); no usar como cierre sin contraste.
5. **Sello H**: 16,000 (alcalde, ene-2026) vs 20,861 inscritas (sep-2026) vs 10,824 (20 empresas certificadas) vs ~10,500 (CANADEVI, oct-2026). La nota de sep-2026 NO dice "privadas" (la semilla sí).
6. **INFONAVIT en Hermosillo**: 2,624 (31-ene-2026) vs 5,634 (22-abr-2026). **CONAVI 2,400**: "se construyen" (ene), "por iniciar" (abr), "inicia obra" (17-jun): es una sola cartera.
7. **Estado**: 17,700 "en construcción" (ene) vs 9,694 (25-mar, más 18,126 en proyecto). Meta 60,000 (ene) vs 65,000 (feb–mar). "20 mil": meta de Hermosillo (abr) vs 20 mil concluidas en 2027 en todo Sonora (feb).
8. **Plan privado CANADEVI 2026 (3,545)**: "en Hermosillo" (14-ene-2025) vs "en diferentes puntos" (mar/abr-2025).

## 5. Mapa de duplicidades (NO sumar entre programas)
- Sello H (20,861) incluye "Viviendas del Bienestar" (según la nota) → solapa con CONAVI 2,400 e INFONAVIT 2,624/5,634.
- "3,108 en construcción" (abr-2026) ≈ 3,110 "arrancaron" (CANADEVI, abr-2025): probable misma cartera privada repetida; a su vez posible subconjunto de Sello H privado (10,824/10,500).
- Las 11,142 de la nota de abr-2026 mezclan "en construcción" y "por iniciar"; no se sabe si están dentro de las 20 mil.
- Registros RUV "Popular" 2025 (2,444) y 2026 ene–jul (1,915) y el salto de inventario 2026 pueden incluir unidades Bienestar (no confirmado): riesgo de contarlas en RUV y en cartera.

## 6. Restricciones de oferta (cualitativo, con fuente; 10 filas máx.)
| # | Restricción | Fuente y localizador |
|---|---|---|
| 1 | Agua operador: eficiencia física 42.71% (2020) y 44.90% (2023), pérdidas ~55% (derivado); dotación 402 L/hab/día (2023) | OF-26, pág. "Seguimiento de indicadores de gestión" |
| 2 | Acuífero: extracción 349 Hm³/año vs recarga ~250; el agua "no ha sido restricción vinculante" en 2014-2019 pero amenaza el crecimiento futuro | OF-34 pp. 9, 12 |
| 3 | Menor disponibilidad de agua encarece construcción residencial y vincula permisos a agua | OF-35 p. 44; OF-34 p. 17 |
| 4 | Suelo: el PMDU estima 8,701 ha residenciales a 2051 (tendencial) vs 4,645 ha ideal; PMDUH 2023 NO se pudo abrir | OF-34 pp. 14-15; OF-29 |
| 5 | Trámites: 62 trámites; desarrollo urbano 2-3.5 años; permisos de 3% a 12% del costo | OF-34 p. 15 |
| 6 | Infraestructura: ~13% del costo por obras que exceden el proyecto (CANADEVI); topes de altura y estacionamiento | OF-34 p. 16 |
| 7 | Financiamiento: cambios de política INFONAVIT limitaron dónde construir; "restricciones del Infonavit limitaron nuevos proyectos sociales" | OF-35 pp. 44-45; OF-28 p. 20 |
| 8 | Electricidad: ≥2 subestaciones CFE (Pueblitos y Surponiente); CFE pide donar 2 terrenos de 1 ha | OF-25 (CANADEVI vía prensa, 30-jun-2026) |
| 9 | Costos CEICO Hermosillo: +1.33% (sep-25), +2.83% (ene-26), +6.50% (sep-26); mano de obra +9.0% en ene-26 y sep-26 | OF-19/20/21 |
| 10 | Precios: subieron más que ciudades comparables 2023-2024 y el inventario "disminuyó drásticamente" (contrasta con inventario RUV creciente 2025-26) | OF-34 p. 14 |

## 7. Valores `por verificar` (10 filas)
- 8 filas HCV 2025 (producción y créditos 2020–2023, heredadas): WebFetch extrajo 79,734 caracteres del PDF, que terminan a mitad de una nota al pie en la p. ~46; la sección Vivienda (pp. 44–46) es narrativa y no contiene esas cifras. El índice del informe llega a "Proyectos especiales: Vivienda y Medio ambiente" (páginas posteriores, NO extraídas): ahí podrían estar las tablas. El Informe 2026 (80,963 caracteres) corta igual en la p. ~46.
- 2 filas `restr-agua-tomas` (2020, 2023): tabla numerada sin etiquetas legibles.

## 8. No obtenido
Fuente oficial sonora.gob.mx (y copias Milenio/OEM): client_error. PMDUH 2023: no abre (client_error); de los PDFs del Growth Lab solo se leyeron los primeros 100,000 caracteres. CEICO por ciudad 2020–2024 y niveles de índice: no localizados. INPP residencial anual: solo variación nacional de construcción (+5.91% ago-2026). Licencias municipales (búsqueda sin resultados para Hermosillo), Softec (de pago, OF-33), Tinsa/4S (no consultados), Días de inventario (tablero dinámico sin datos en el texto) y páginas oficiales de CONAVI/INFONAVIT (gob.mx/conavi: client_error): sin datos accesibles.

## Hallazgos para el auditor
1. Abrir en navegador 5 URLs del API (`GetProduccion…/anio`, `GetRegistro…/anio`, `GetInventario/2025,12`, `/2022,12`, `/2026,7`) y confirmar que WebFetch no alteró cifras.
2. HCV 2026 p. 46: confirmar si "792 en 2024" es literal y si coincide con ene–may 2025; abrir las tablas completas del HCV 2025 (p. 46 en adelante).
3. Pedir a CANADEVI la definición de 4,808 escrituradas y su cobertura (¿incluye usada, preventa, no-RUV?).
4. Obtener `diccionario_inventario.xlsx` para definir HBT y separar "terminada sin vender" de obra no iniciada.
5. Revisar el pico dic-2022 y el salto jul-2026 del inventario antes de usarlos como desplazadores.
6. No sumar programas de cartera; usar el §5.
