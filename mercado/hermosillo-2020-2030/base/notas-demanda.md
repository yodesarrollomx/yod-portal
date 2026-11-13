# Notas — frente DEMANDA (Terra 2), consulta 2026-11-01

## 1. Qué se encontró
**Serie 1 (compras/créditos).** El SNIIV tiene una API pública (`/api/CuboAPI/Get{Infonavit|CNBV|FOVISSSTE|Financiamiento|CONAVI}/{años}/26/030/{dimensiones}`, documentada en Reporte/Datos_abiertos). Se leyó para Hermosillo (26/030) con WebFetch, porque `curl` recibe 403 en el CONNECT del proxy de egreso para todos los hosts oficiales (Playwright y Chrome usan el mismo proxy; no se probaron para no rodear la política). **Corte: julio 2026** (último mes con datos en las cuatro APIs). Verificación: los cortes por mes, esquema, valor de vivienda, rango salarial, modalidad y organismo suman los mismos totales anuales (p.ej. INFONAVIT nueva 2025 = 3,529 en seis cortes) y los 12 meses de 2025 suman el anual en las ocho series mensuales.

| Series anuales (créditos) | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|
| INFONAVIT nueva (Línea II, mod. Nueva) | 1,863 | 2,521 | 2,242 | 2,106 | 2,553 | 3,529 |
| INFONAVIT usada (Línea II, Existente) | 2,515 | 2,810 | 2,199 | 2,545 | 3,013 | 3,161 |
| FOVISSSTE nueva | 296 | 334 | 247 | 264 | 274 | 229 |
| CNBV nueva | 1,338 | 1,730 | 1,861 | 1,666 | 1,368 | 1,035 |
| Cubo Financiamiento, nueva, todos los organismos | 3,621 | 4,599 | 4,368 | 4,078 | 4,183 | 6,636 |
| ídem sin CONAVI (estimado) | 3,591 | 4,585 | 4,368 | 4,052 | 4,183 | 4,813 |

2026 solo existe al corte: ene–jul 2026 vs ene–jul 2025 (mismos meses) — INFONAVIT nueva 2,375 vs 1,912; INFONAVIT usada 1,781 vs 1,703; FOVISSSTE nueva 155 vs 129; CNBV nueva 568 vs 678; cubo Financiamiento nueva 3,108 vs 2,734. Series con sufijo `-mensual` (2025-01 a 2026-07) permiten cualquier rango; no sumarlas con las anuales.

**Cofinanciamiento (cómo lo trata la fuente).** Cada cubo cuenta "acciones" (créditos o subsidios) por institución; el cubo Financiamiento las suma entre organismos y no se halló regla anti doble conteo (el glosario define cofinanciamiento en p.3 pero no Cofinavit ni Apoyo Infonavit). El esquema INFONAVIT de vivienda nueva muestra Cofinavit 226/278/172/215/225/172 y Apoyo Infonavit 52/109/200/251/299/261 (monto=0) para 2020-2025: por su naturaleza (inferencia, no está en la fuente) la misma vivienda puede aparecer también como crédito bancario en CNBV. Se calcularon dos series `estimado`: suma simple INFONAVIT+FOVISSSTE+CNBV nueva (3,497; 4,585; 4,350; 4,036; 4,195; 4,793) y un límite inferior que resta Cofinavit y Apoyo (3,219; 4,198; 3,978; 3,570; 3,671; 4,360), con el supuesto de pareo 1 a 1 sin verificar.

**Serie 2 (CANADEVI).** Solo 2025 Hermosillo = 4,808 escrituradas y ene–jun 2026 = 1,970 (1,330 ≤1.05 mdp; 138 entre 2.4 y 3.2 mdp; derrama "más de 2,377" mdp), todo `prensa` (El Imparcial 2-oct-2026 citando al presidente de CANADEVI Sonora). 2020-2024 no se localizaron: las notas de CANADEVI de 2025-2026 solo traen proyecciones de construcción o producción RUV estatal. Se conservan como `por verificar` las cinco cifras heredadas del HCV ("demanda de créditos" 2,890; 3,717; 3,346; 4,079; 1,417).

**Serie 3 (solo aproximación).** La demanda potencial INFONAVIT no se obtuvo (ver §5). Como referencia estatal, la SHF publica estimaciones de modelo de créditos por entidad (`declarado`, no observado): vivienda nueva en Sonora 7,242 en 2023 (banca 2,409; FOVISSSTE 443; INFONAVIT 4,385; otros 5) y 7,108 en 2024 (1,993; 436; 4,676; 3); existente 5,731 y 7,056. Son proyecciones de febrero de cada año, estatales y no comparables con el SNIIV de Hermosillo; las sumas por organismo cuadran. La edición 2025 no abrió (client_error) y la 2026 no apareció en la búsqueda.

**Serie 4.** Censo 2020 (INEGI, PDF Sonora): población 936,263; viviendas particulares habitadas 278,550. CONAPO vía COESPO: 1,028,894 (2025) y 1,099,323 (2030), solo años quinquenales. Rezago habitacional SEDATU 2020: 18,053 con y 261,653 sin (contexto, no demanda).
**Serie 5.** IMSS Hermosillo: 260,693 (dic-2025) y 274,098 (jun-2026) por prensa; Sonora 633,106 (dic-2025) y salario base 589.05 MXN/día. ENOE Sonora 2T-2025 (INEGI, boletín 459/25, `observado`): informalidad TIL1 43.7 % (42.5 % en 2T-2024), ocupados 1,462,445 (1,428,133), desocupación 2.5 % (3.6 %); el boletín no trae la ciudad de Hermosillo. **Serie 6.** Remesas Hermosillo: 2021-2024 y T1-T3 2025 por prensa; T2-2026 = 56.3 M USD (DataMéxico). **Serie 7.** Nacidos en otro país 9,263 (INEGI); CONEVAL y migrantes recientes vía DataMéxico (`declarado`).
**Extra útil:** INFONAVIT vivienda nueva por valor de vivienda y por rango salarial (series `-valor-` y `-salario-`): los créditos "Popular" caen de 638 (2020) a 34 (2025) y "Tradicional+Media" suben de 1,103 a 3,254.

## 2. Definiciones (no fusionar)
`acciones` = créditos o subsidios, no hogares. En INFONAVIT "Existente" = usada. La trampa de filtro: "Adquisición de suelo" (Línea II) y "Construcción" (Línea III) vienen marcadas `vivienda=Nueva`; aquí van aparte. Las series `-acum-` (CANADEVI, flujo IMSS) son acumulados cuyo periodo `2026-06`/`2025-10` marca solo el mes de cierre.

## 3. Contradicciones entre fuentes
- INFONAVIT nueva 2024: 2,553 (GetInfonavit, concilia con sus cortes) vs 2,526 (cubo Financiamiento).
- CNBV nueva: GetCNBV 1,861/1,666/1,368/1,035 vs cubo Financiamiento 1,878/1,680/1,380/1,053 (2022-2025); usada 2022: 466 vs 471.
- FOVISSSTE nueva 2023: 264 vs 265.
- 2025: cubo Financiamiento 6,636 incluye 1,823 acciones CONAVI cargadas todas en dic-2025 (el mes pasa de ~400 a 2,284); sin ellas 4,813, casi igual a los 4,808 de CANADEVI. Para ene–jun 2026 no coincide: CANADEVI 1,970 vs cubo 2,623 (INFONAVIT solo: 2,024).
- Población 2025: HCV 992,625 vs CONAPO/COESPO 1,028,894.
- 278,550: INEGI lo llama viviendas particulares habitadas; HCV lo llama hogares; SEDATU con+sin = 279,706.
- IMSS H1 2026: variación de stock +13,405 vs "13,737 empleos generados".
- Pobreza laboral: HCV 24.6% (2024) vs 18.1% (4T-2025, nota AMDE).
- HCV créditos 2024 = 1,417 vs INFONAVIT nueva 2,553.
- INFONAVIT 2025: SNIIV Hermosillo, todas las líneas = 9,325 (+32.9 % vs 7,015 en 2024) vs prensa (delegado INFONAVIT, nota de 6-feb-2026): 26 mil créditos en Sonora, 90 % más que en 2024, y "50 % en la ciudad de Hermosillo" (≈13,000, fila `estimado` solo de contraste). La nota no define el conteo; la diferencia no se explica.
- Remesas: la nota atribuye T1-T3 "al Estado" pero suman los 164.58 que atribuye a Hermosillo; 2023 y 2024 idénticos (204.53).

## 4. Valores por verificar
`demanda-creditos-hcv-nueva` 2020-2024 (5 filas): el PDF HCV no trae la sección de vivienda en el texto extraíble (p.45 se corta).

## 5. No obtenido
Demanda potencial INFONAVIT (página SNIIV = cascarón; sin endpoint). IMSS Hermosillo dic-2019 a dic-2024 y salario municipal (datos.imss.gob.mx: error de servidor; página de dataset bloqueada por robots). ENOE ciudad Hermosillo (ingreso, informalidad): el boletín estatal no la desglosa. Banxico CE166 histórico (Sonora ausente del HTML). Hogares censales y tenencia municipales. CONAPO anual 2020-2030 y proyección de hogares. Población nacida en otra entidad. ENVI 2020, ENIGH 2024 por decil, portales de vivienda usada: sin tiempo.

## Hallazgos para el auditor
1. Todas las filas SNIIV pasaron por WebFetch (un modelo intermedio convierte JSON a tabla). Reabrir en un navegador tres URLs de la API y comparar: INFONAVIT nueva 2025 = 3,529; cubo Financiamiento nueva 2025-12 = 2,284; CNBV nueva 2024 = 1,368.
2. Comprobar qué son las 1,823 acciones CONAVI de dic-2025 (registro único; el cubo CONAVI no se pudo desglosar).
3. Confirmar que Cofinavit y Apoyo Infonavit se parean con créditos de banca (supuesto del límite inferior).
4. Las filas `-acum-` usan `periodo` de mes de cierre; el contrato no prevé acumulados.
5. Geografía de prensa ("Hermosillo") no distingue ciudad de municipio; DataMéxico/HCV son secundarias (`declarado`).
6. El rango salarial INFONAVIT no declara si son VSM o UMA.
7. INFONAVIT 2025 (9,325 SNIIV vs ≈13,000 implícito en prensa): pedir a INFONAVIT cómo cuenta y si el SNIIV ("sujeto a modificaciones") ya refleja todo 2025.
8. Las filas SHF (Sonora, `declarado`) y ENOE Sonora 2T-2025 también pasaron por WebFetch; las sumas por organismo y la tasa de desocupación cuadran, pero conviene reabrir los dos PDF SHF (el de 2023 no numera páginas) y el boletín 459/25.
