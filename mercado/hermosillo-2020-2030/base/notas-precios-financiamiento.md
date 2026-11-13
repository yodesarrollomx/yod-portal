# Notas Terra 3: precios, financiamiento y programas (Hermosillo 2020-2030)

Consulta: 2026-11-01. `series.csv`: 341 filas (observado 181, prensa 108, declarado 31, estimado 11, por verificar 10). `fuentes.csv`: 89 fuentes.

## 1. Método y límite de acceso
- curl a todos los hosts objetivo (SHF, gob.mx, Banxico, INEGI, SNIIV, Infonavit, El Imparcial) devolvió "CONNECT tunnel failed 403": política de egreso. No se reintentó ni se rodeó. Todo se leyó con WebFetch y WebSearch, es decir, a través de un modelo resumidor y no por parseo directo. Por eso `05_descargas/precios/` quedó vacía.
- Controles contra errores de transcripción: segmentos SNIIV = subtotal (tolerancia 0.06), reparto municipal CONAVI = 6,200 e Infonavit = 11,528. Un error de transcripción mío (SNIIV 2022 Residencial) se detectó y corrigió así.
- Los checkpoints intermedios no se escribieron a su hora (omisión mía); se consolidaron después con la hora real del registro.

## 2. Qué se encontró
**Índice SHF (serie 1).** Solo variaciones, ningún nivel: el portal del índice no abrió (gob.mx client_error, shf.gob.mx robots). Hermosillo, medida "acumulado del año": 2022 = 7.7 (Sonora 7.5, nacional 8.9) y 2023 = 13.2 (12.8; 10.9), observado. Parciales enero-trimestre, no comparables con cierres: 2020-T3 7.8, 2022-T1 6.2, 2022-T3 7.1, 2023-T2 12.5, 2023-T3 12.9. Medida "trimestral a tasa anual": 2023-T4 14.21 (declarado, ficha IIEG), 2025-T1 9.0 (prensa) y seis puntos por verificar. No hay cierre anual de Hermosillo para 2020, 2021, 2024 ni 2025.

**Precio SHF en MXN.** Serie aparte y sin fila de Hermosillo. Sonora, media: 1,602,501 (3T24), 1,654,409 (3T25), 1,660,495 (4T25), 1,775,864 (1T26), 1,767,242 (2T26); mediana 1,175,452 (2T26). Nacional 2022-2026 en el CSV.

**Precio de vivienda nueva en Hermosillo (serie 2).** No hay precio medio anual publicado por fuente primaria. Hay tres aproximaciones con definiciones distintas, que no se mezclan:
- CANADEVI (prensa), 1S2026: 1,970 escrituras; 1,330 (67.5%) hasta 1.05 mdp y 138 de 2.4 a 3.2 mdp. Mi `estimado` derrama/unidades da 653,076 y 2,794,169 por banda, y 1,206,599 total (cota inferior porque la derrama total es "más de 2,377 mdp"). Acumulado 2021 a jun-2026: 1,223,428.
- Monto medio SNIIV por acción de vivienda nueva (es financiamiento, no valor de la vivienda): 897 mil (2020), 950 mil, 1.099 mdp, 1.267 mdp, 1.241 mdp, 836 mil (2025) y 1.089 mdp (ene-jul 2026, corte parcial).
- Precio objetivo del plan CANADEVI: unos 800 mil (declarado, abr-2025).
Softec, Tinsa y 4S: sin datos públicos de Hermosillo (una búsqueda web no devolvió páginas con cifras).

**Crédito (serie 3).** Tasa ponderada Banxico de nuevos créditos hipotecarios (nacional): dic-2020 9.03; 2021 9.07; 2022 10.08; 2023 10.35; 2024 10.42; 2025 10.21; mar-2026 10.13 (último dato abierto). Tasa objetivo en diciembre: 5.50 (2021), 10.50, 11.25, 10.00, 7.00 (2025); dic-2020 no localizada. Infonavit, tasa: 1.9-10.45 (2022 y 2023), 4.15-10.45 (2025), 3.69-10.45 (2026). Monto máximo: 2,217,700 (2021), 2,595,491 (2023), 2,716,334 (2024), 2,830,000 (2025), 2,935,002 (2026). Tope de la Vivienda del Bienestar: 630 mil (sep-2025) y 862 mil (sep-2026). UMA diaria 2020-2026: 86.88, 89.62, 96.22, 103.74, 108.57, 113.14, 117.31 (observado, INEGI). Salario mínimo, resto del país: 141.70 (2021) a 315.04 (2026).

**Inflación (serie 4).** Nacional dic/dic 2020-2025: 2025 = 3.69 observado; 2020-2024 declarado y redondeado. Hermosillo (ciudad del INPC, geografía `ciudad Hermosillo (ENOE)`): solo 2024 = 2.6 y 2025 = 3.0 (prensa, CODESIN). Sin promedios anuales ni niveles.

**SNIIV (apoyo a la demanda).** Acciones de vivienda nueva en Hermosillo: 3,621 (2020), 4,599, 4,368, 4,078, 4,183, 6,636 (2025) y 3,108 (ene-jul 2026). Por segmento de valor y por organismo en el CSV.

**Programas (serie 5).** Metas y avances son declaraciones de autoridad recogidas por prensa; `periodo` es el mes del anuncio. Hermosillo: 20,000 de meta sin año (abr-2026); 3,108 en construcción; CONAVI 2,400; Infonavit 2,624 (ene-2026) o 5,634 (abr-2026); Sello H 20,861 inscritas. Plan privado CANADEVI Sonora: 3,110 (2025), 3,545 (2026), 3,460 (2027), 10,115 en total.

**Macro (serie 6, parcial).** ITAEE Sonora 4T/4T: 2.3 (2022), 4.4 (2023), -0.2 (2024), 1.8 (2025). Inversión: solo GE Aerospace, 725 mdp (mayo-2026, prensa). ENEC no se abrió.

## 3. Definiciones que no se mezclan
- Índice SHF "acumulado del año", índice SHF "trimestral a tasa anual", precio medio SHF (MXN) y monto medio SNIIV son cuatro series distintas.
- SNIIV `acciones` mezcla créditos y subsidios CONAVI. Los segmentos (Económica a Residencial plus) son "valor económico estimado" y no tienen umbrales en MXN publicados.
- Sello H: inscripción no es construcción, entrega ni inventario. No se sumó ni restó producción con créditos.

## 4. Contradicciones (ambos valores)
1. SHF Hermosillo 2023: 13.2 (acumulado, boletín) contra 14.21 (4T/4T, IIEG). Nacional: 10.9 contra 10.1. Son medidas distintas, no un error.
2. 2025: la tasa objetivo bajó 300 pb (10.00 a 7.00) y la hipotecaria solo 21 pb (10.42 a 10.21); el diferencial pasó de 0.42 a 3.21 puntos.
3. Créditos 2025 en Hermosillo: SNIIV 6,636 acciones de vivienda nueva (el salto coincide con CONAVI: 1,823 acciones, casi igual a las 1,824 del segmento Económica; son subsidios) contra 4,808 escrituradas (CANADEVI). Infonavit dice más de 26,000 créditos en Sonora, 50% en Hermosillo (unos 13,000), contra 9,325 acciones Infonavit de todos los destinos en el SNIIV.
4. CONAVI Hermosillo 2,400: "en construcción" (31-ene-2026), "por iniciar" (22-abr) e "inicio de obra" (17-jun); la nota del 14-feb no incluía Hermosillo. Infonavit Hermosillo: 2,624 (31-ene) contra 5,634 (22-abr).
5. Meta estatal: 13.8 mil, 33.8 mil, 57 mil, 60 mil, 65 mil. Primera etapa: 12 mil (sep-2025) contra 37 mil (ene-2026). Hito: 20 mil concluidas en 2027 contra 30 mil entregadas (gobernador, jun-2026).
6. Paquetes CONAVI nacionales (24,047 + 20,637 + 45,456 = 90,140) contra 86,000 de la primera etapa.
7. Sello H: 20,861 inscritas (10,824 privadas) contra unas 10,500 que CANADEVI llama planeadas y no vendidas.
8. Precio: 67.5% de las escrituras de Hermosillo fue de hasta 1.05 mdp, mientras la media SHF de Sonora es 1.77 mdp. El tope Bienestar subió 37%; el monto máximo de Infonavit, 3.7% (2,830,000 a 2,935,002; la UMA subió 3.69%); el índice SHF de Hermosillo, 9.0 en 1T2025 (prensa).
9. Menores: INPC Hermosillo, 1a quincena de ene-2026, 2.59 (texto) contra 2.55 (recuadro); tope Infonavit 2024, 2,716,334 contra 2,716,335; nacional 2025, 8.7 (acumulado, prensa) contra 8.92 (4T/4T); precio medio nacional SHF, 1,863,965 (4T25), 2,024,337 (1T26) y 1,960,032 (2T26); pronóstico CANADEVI 2025, 4-9% (titular) contra 4-8% (metadescripción).

## 5. Valores `por verificar` (10 filas)
- SHF Hermosillo trimestral 2020-T4 (7.9), 2024-T3 (10.43), 2025-T3 (9.33), 2026-T1 (9.40), 2026-T2 (8.93): en los PDF de IIEG las etiquetas y los valores del gráfico vienen en bloques separados y el lector los emparejó por posición. 2025-T4 (8.29) se heredó de la semilla y no se pudo emparejar.
- Infonavit tasa mínima 2022-06 (1.91): solo título de un resultado de búsqueda; Expansión da 1.9.
- Salario mínimo 2020 (123.22): la nota fuente lo rotula como 2019.
- Expectativa de alza de precio 2027 (10 y 12%): solo el titular de un enlace relacionado; la nota no abrió.

## 6. No se obtuvo
- Niveles del Índice SHF; Hermosillo 2021 y 2024 anual; un precio medio anual de vivienda nueva por fuente primaria.
- INPC Hermosillo 2020-2023, promedios anuales y niveles (INEGI bloqueado).
- Tasa Banxico posterior a mar-2026; tasa objetivo de dic-2020; tasas Infonavit 2020, 2021 y la general de 2024 (solo el rango de conversión VSM a pesos, 1.00-10.45).
- Reporte original de CANADEVI y nota original de sonora.gob.mx; series de Hermosillo Cómo Vamos (el PDF se leyó solo en las pp. 44-45); lista de inversiones nearshoring; ENEC.

## Hallazgos para el auditor
1. Toda lectura pasó por un resumidor. Recomiendo repetir con acceso directo las cifras que sostienen el eje de precio: boletines SHF, JSON del SNIIV, tabla Banxico.
2. Alerta: 1T2022 sale idéntico para Hermosillo y Sonora (6.2); puede ser error del lector.
3. El salto de 2025 en el SNIIV (+59%) coincide con CONAVI (subsidio); no debe leerse como demanda de crédito.
4. Los 2,400 de CONAVI figuran en tres etapas distintas y el dato de Infonavit en Hermosillo cambia de 2,624 a 5,634; no deben sumarse.
5. Varios títulos de notas de prensa son paráfrasis del titular; fechas y cifras sí se verificaron en el texto leído.
6. No se reutilizó ninguna cifra de producción ni de crédito de la semilla (Hermosillo Cómo Vamos) por no poder reabrirla.
