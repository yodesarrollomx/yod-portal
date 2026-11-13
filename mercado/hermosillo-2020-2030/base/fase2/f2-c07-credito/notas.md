# C07 · Crédito y macro hacia adelante · notas (Terra-6, 2026-11-01)

Lectura del 2026-11-01 con WebFetch (curl a hosts oficiales da 403). 82 filas en `series.csv`; los `fuente_id` `C07-*` son etiquetas propias. Las páginas del PDF son aproximadas (dos lecturas dieron paginación distinta): localizar por número de Cuadro.

## 1. Encuesta Banxico, septiembre 2026
La más reciente: 42 grupos, levantamiento 15–28 sep, publicada 2026-10-01 (la de octubre sale después).

| Nacional | 2026 | 2027 | 2028 |
|---|---|---|---|
| Inflación dic-dic, mediana / media | 3.87 / 3.85 | 3.82 / 3.85 | 3.80 / 3.75 |
| Banda P20–P80 (prob. agregada) | 3.5–4.1 | 3.5–4.2 | 3.4–4.2 |
| Tasa de fondeo ≈ objetivo, mediana / media | 6.50 / 6.51 | 6.50 / 6.51 | no publicada |
| PIB real, mediana / media | 1.40 / 1.40 | 1.80 / 1.77 | 2.00 / 1.89 |

- **Rango 2026** (cuadros analíticos SIE CA224 y CA233, última columna): inflación Q1 3.72, Q3 3.98, mín 3.26, máx 4.25 (n=42); PIB Q1 1.30, Q3 1.50, mín 0.84, máx 1.90 (n=41). La columna se identificó como sep-2026 porque media y mediana coinciden con el PDF; la alineación la infirió el lector.
- **Inflación 2027–2028**: el único rango numérico es la banda P20–P80 del texto de la Gráfica 3a (nota 5), de la distribución de probabilidad agregada. No es mínimo/máximo ni dispersión de pronósticos puntuales; por eso va en `-p20/-p80`, no en `-min/-max`.
- Largo plazo (solo aquí): inflación 2027–2030 mediana 3.80, 2031–2034 mediana 3.70 (Cuadro 5); PIB 2027–2036 mediana 1.80 (Cuadro 6).
- Revisión vs agosto (medianas): PIB 2026 1.30→1.40; inflación 2026 3.90→3.87; PIB 2028 1.92→2.00.
- **No obtenido**: mín/máx/cuartiles de PIB 2027–2028, inflación 2027–2028 y tasa de fondeo 2026–2027; tasa cierre 2028 (Banxico no la publica; la Gráfica 14 es trimestral sin valores). El SIE elige el horizonte con un formulario (POST, prohibido), un GET con parámetro falló y los Microdatos dieron error.
- La variable de la encuesta es "tasa de fondeo interbancario"; el texto dice que la mayoría la espera igual al objetivo vigente. Los ids son `f2-exp-tasa-fondeo` y `f2-exp-tasa-fondeo-media` (antes `-tasa-objetivo`).

## 2. Hipotecaria, objetivo y diferencial
- Cuadro Banxico "Tasa de interés anual del crédito a la vivienda" (Informe Trimestral abr–jun 2026): abr-26 10.11, may-26 9.97, **jun-26 10.00**, último mes disponible. Nacional, nuevos créditos de la banca, vivienda nueva y usada. Reproduce los dic-2020…dic-2025 y mar-26 de la Fase 1.
- Objetivo al cierre (anuncio de diciembre de Banxico, uno por uno): 2020 4.25; 2021 5.50; 2022 10.50; 2023 11.25; 2024 10.00; 2025 7.00. Vigente tras el 24-sep-2026: **6.50** (recortes de 25 pb el 26-mar y 7-may-2026, sin cambio después).
- Diferencial hipotecaria−objetivo (`supuesto`): 4.78; 3.57; −0.42; −0.90; 0.42; 3.21; jun-26 3.50.
- **Advertencia**: no es estable (rango 5.7 pp). Cálculo propio (`estimado`, no en el CSV): por cada pp de cambio del objetivo, la hipotecaria se movió 0.03, 0.20, 0.36, −0.06, 0.07 y 0.42 pp (tramos 2020→21 … dic-25→jun-26). "Objetivo 6.50 + diferencial" no ancla la hipotecaria; el rango observado ene-2023–jun-2026 es 9.97–10.42.

## 3. INPC (base 2Q jul-2018=100)
- Promedio anual: 2018 100.255; 2019 103.901; 2020 107.430; 2021 113.542; 2022 122.507; 2023 129.280; 2024 135.385; 2025 140.542. Ene–sep 2026: **145.182** contra 139.901 en ene–sep 2025 (+3.77%, mismo periodo).
- Los 12 índices de cada año van en la `nota`. Los de 2018–2025 vienen de una reproducción de INEGI en ISEF (fuente secundaria). Se contrastó con INEGI: dic-2025 = 143.042 (boletín 6/26) y las variaciones anuales de los boletines ene–sep 2026 reproducen los índices 2025 de la tabla. Ene–sep 2026: cada mes leído en su boletín INEGI (74/26 … 619/26), en `f2-inpc-mensual`.
- **Calidad `estimado`, no `observado`** como se pidió: el promedio es cálculo propio y no se localizó el publicado por INEGI. Si el auditor lo acepta, reclasificar.

## 4. INFONAVIT 2026
- **PEF 2026** (Asamblea General, 2025-12-08): POA 2026 = **758,284 créditos** (p.6 y 37), incluye los de adquisición de Vivienda para el Bienestar (VPB); línea aparte de 17,416 créditos VPB (p.37). No se pudo desglosar: el lector llegó a ~p.51 de 135 y el Plan de Financiamientos (p.53) y el Anexo 4 (p.123) quedaron fuera. **No equivale a crédito para vivienda nueva** (probablemente incluye mejoramiento, >1.25 millones 2025–2030, p.4). Sin meta para Sonora.
- **Tasas** (tabla oficial "Tasas de interés diferenciadas por nivel salarial", UMA 2026 = $117.31): mínima **3.69%** (hasta 2.6 UMA, $9,272.18/mes), máxima **10.45%** (6.6 UMA o más, $23,537.08/mes), fijas.
- **Precio máximo VPB** (disposiciones de carácter general, SIDOF): $630,000 en 2025 → **$862,000** (firmadas 7-ago-2026; el texto no imprime la fecha de publicación en DOF, por verificar).
- **Reforma a la Ley** (DOF 2025-02-21 según PEF p.7): el PEF contempla "Unamos Créditos" (p.35, sin condiciones) y arrendamiento social (p.33). "Crédito en pesos": no aparece en los textos oficiales que abrí; no lo afirmo.
- Prensa, no cargada como serie: VPB 319,467 viviendas contratadas al 9-ene-2026 y meta de unas 700 mil a fin de 2026 (Publimetro 14-ene-2026, cita al instituto); son viviendas contratadas a constructores, no créditos.

## 5. FOVISSSTE 2026
Programa de Crédito 2026 (Acuerdo 15.1391.2025, SIDOF): **30,796 préstamos hipotecarios** (Tradicional 27,803 + Pensionados 143 + Banca Comercial 1,303 + coparticipación INFONAVIT 1,547); con 11,972 Acciones de Vivienda son 42,768 financiamientos (serie aparte). Sin desglose por entidad.

## 6. Omitido
Remesas (punto 5): la Fase 1 ya tiene la serie municipal.

## Hallazgos para el auditor (reabrir primero)
1. `f2-exp-pib` 2028 mediana 2.00 y `f2-exp-inflacion` 2027 mediana 3.82 (Cuadros 6 y 2).
2. `f2-exp-inflacion-min/-max` 2026 (3.26/4.25) y PIB 2026 (0.84/1.90), SIE CA224 y CA233.
3. `f2-tasa-hipotecaria-mensual` 2026-06 = 10.00.
4. `f2-infonavit-meta-creditos` = 758,284 y su alcance.
5. `f2-inpc-promedio-anual` 2025 = 140.542 (contrastar los 12 índices con INEGI).

## Correcciones tras el dictamen (Terra-12, 2026-11-01, copia previa en 04_auditoria/c07-series-antes-correcciones.csv)
- **R-C07-2 hecho.** `f2-inpc-mensual` trae ahora los 12 meses de 2025 como `observado`, cada uno con la URL del boletín mensual de INEGI (`.../boletines/2025/inpc/inpc_2q2025_02.pdf` para enero, … `_12.pdf` para noviembre; diciembre ya estaba en el boletín 6/26). Reabrí los 11 con WebFetch el 2026-11-01 y los valores coinciden con la nota. **Agosto-2025 sí abrió** (boletín 514/25, 9-sep-2025: «En agosto de 2025, el INPC presentó un nivel de 140.867»), así que no hace falta la cota 140.863–140.876. El promedio 2025 sigue en 140.542 (media de los 12 = 140.5422), `estimado`, con nota «12 índices INEGI». Para 2020–2024 la nota dice «fuente ISEF; diciembres verificados con comunicados UMA».
- **R-C07-3 hecho.** `f2-exp-tasa-objetivo` → `f2-exp-tasa-fondeo` y `-media`; la nota dice que la mayoría la espera igual al objetivo vigente. `02_cruces/cierre2026.py` y `02_cruces/escenarios.py` no contienen el nombre viejo (grep). `f2-tasa-objetivo-cierre` es otra serie y no cambia.
- **No hecho (no son de Terra):** R-C07-1, R-C07-4 y R-C07-5 son de Sol.
- Ningún valor cambió (comparado por script contra la copia previa); se añadieron 11 filas.

