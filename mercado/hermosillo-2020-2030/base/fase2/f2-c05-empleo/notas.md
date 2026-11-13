# Notas C05 · Empleo formal e ingreso (Terra-5, 2026-11-01)

## Resultado en una línea
La serie municipal de Hermosillo 2019–2024 **no se pudo obtener**: las fuentes primarias (IMSS datos abiertos, API de DataMéxico, cubos IMSS) no son accesibles desde esta sesión. De Hermosillo sólo hay stock en dic-2025 (260,693) y jun-2026 (274,098), ambos de prensa. Para cubrir 2019–2025 se agregó la serie **estatal de Sonora** (y su salario) y flujos acumulados de Hermosillo; ninguna sustituye al municipio.

## Qué se intentó (todo 2026-11-01)
- `datos.imss.gob.mx`: WebFetch devuelve robots_disallowed o error de servidor; curl recibe 403 del proxy.
- `api.datamexico.org/tesseract`: robots_disallowed (no se eludió). `economia.gob.mx/datamexico/api/...` y el perfil por id 26030: permiso de WebFetch no concedido (no se reintentó).
- Perfil `economia.gob.mx/datamexico/es/profile/geo/hermosillo`: leído; trae población 2020 (936,263) pero empleo/salario son **ENOE de Sonora**, sin IMSS municipal (se guardaron 5 filas ENOE como contexto).
- Búsquedas de informes (Hermosillo ¿Cómo Vamos?, Sonora en cifras, Plan Municipal, IMCO, STPS/Observatorio Laboral, CEFP, MCV): ninguno publica stock IMSS municipal por año. Sólo notas de prensa con flujos.

## Qué se obtuvo
1. **Hermosillo, stock**: 260,693 (dic-2025) y 274,098 (jun-2026), El Imparcial 7-ago-2026 (reabierta; coincide con Fase 1). +13,405 (+5.14%) verificado con python.
2. **Hermosillo, flujos acumulados** (8 filas, prensa/AMDE con datos IMSS): ene–jun 2024 7,319; ene–sep 2024 8,216; ene–jun 2025 7,418; ene–feb/mar/jun/ago/sep 2026: 9,255 / 15,947 / 13,737 / 11,644 / 12,601.
3. **Sonora, stock dic** (Gobierno de Sonora citando IMSS, `declarado`): 2021 626,610; 2022 640,492; 2023 655,910; 2024 648,960; dic-2025 633,106 (prensa); jun-2026 649,918. Cruce: 648,960 − 15,854 = 633,106 (dos fuentes independientes).
4. **Sonora 2019–2023, otra base** (fichas IIEG, `declarado` las variaciones, `estimado` los niveles): variación anual dic-2020 −1.87%, 2021 +3.64%, 2022 +1.88%, 2023 +2.10%; acumulados −10,940 / +20,966 / +11,199 / +12,793. Los niveles se derivaron encadenando % y absolutos (intervalo de ±40 personas por redondeo): dic-2019 ≈ 586.6 mil, 2020 ≈ 575.6 mil, 2021 ≈ 596.6 mil, 2022 ≈ 607.8 mil, 2023 ≈ 620.6 mil.
5. **Salario base de cotización diario**: Sonora 393.0 (2021), 441.3, 492.3, 544.3 (2024) [Gob. Sonora]; 544.28 (dic-2024), 589.05 (dic-2025), 626.74 (jun-2026) [prensa]. Nacional 438.6 / 486.7 / 537.9 / 587.4 y 627.87 (dic-2025, CEFP). **Hermosillo: no existe en ninguna fuente abierta localizada.**
6. **Salario real Sonora (estimado)**: 2022 +4.15%, 2023 +6.59%, 2024 +6.10%, 2025 +4.37%. Deflactor: INPC dic–dic leído hoy en los 6 comunicados UMA del INEGI (3.15, 7.36, 7.82, 4.66, 4.21, 3.69; URLs en la serie `inpc-nacional-var-dic`). Validación: el mismo cálculo para el salario nacional 2025 da +3.09%, y el CEFP reporta +3.1% real.
7. **Empleo Sonora estimado en variación (base Gob. Sonora)**: 2022 +2.22%, 2023 +2.41%, 2024 −1.06%, 2025 −2.44%.

## Definiciones
- "Trabajadores asegurados" (Gob. Sonora; su nota 1/ dice «Incluye a trabajadores permanentes y eventuales urbanos»; que la brecha se deba a eventuales del campo es una hipótesis no citada) ≠ "empleo formal/puestos" de las fichas IIEG: la base IIEG es ~30–35 mil menor en Sonora (2021: 596.6 vs 626.6 mil). **Nunca fusionar** (series separadas). Para Hermosillo la nota de agosto dice sólo "trabajadores".
- Registro patronal ≠ residencia: parte de los puestos de Hermosillo los ocupan residentes de otros municipios, y viceversa. No se debe leer como empleo de los hogares del municipio.
- El salario base de cotización sólo cubre afiliados al IMSS; no es ingreso del hogar ni salario de la economía informal.

## Contradicciones (con ambos valores)
- **Flujo vs diferencia de stocks, ene–jun 2026**: 13,737 (AMDE) vs 274,098 − 260,693 = 13,405 (−332).
- **Acumulado no monótono**: 15,947 (mar) > 13,737 (jun) > 11,644 (ago) < 12,601 (sep). Hay pérdidas netas estacionales (jul–ago); un "acumulado a la fecha" no es comparable entre meses distintos.
- **El Imparcial 22-sep-2026**: dice que 11,644 son "82%" de 16,812 de Sonora; 11,644/16,812 = 69%. El 82% corresponde a 13,737 (junio).
- **Dos bases de Sonora**: variación 2022 +2.22% (Gob. Sonora) vs +1.88% (IIEG); 2023 +2.41% vs +2.10%.
- **Los 260,693 y 274,098 de Fase 1** no se pueden contrastar con otra fuente: no hay otra cifra municipal. Su proporción contra Sonora (41.2% y 42.2%) es plausible; el "274 mil 98" de la nota es un error de dedo.
- Salario Sonora 2024: 544.3 (Gob. Sonora, año) vs 544.28 (El Imparcial, dic): consistente, pero la gráfica del Gobierno no rotula el mes.

## Por verificar (13 filas)
Hermosillo puestos dic-2019…dic-2024 (6) y salario diario dic-2019…dic-2025 (7): sin fuente abierta alcanzable.

## Hallazgos para el auditor
1. 260,693 y 274,098 (Hermosillo): sólo prensa; reabrir con IMSS cubos o `asegurados_*.csv` (cve_mpio 030) o API DataMéxico.
2. Serie Hermosillo dic-2019…2024: obtener de IMSS; es lo que R7 pide.
3. 648,960 (Sonora dic-2024) y 626,610 (dic-2021): validar contra IMSS; la gráfica del Gobierno no rotula el mes.
4. Niveles derivados de IIEG (2019–2023): sólo `estimado`; verificar con IMSS.
5. Salario Hermosillo: confirmar si IMSS lo publica por municipio (589.05 y 626.74 son de Sonora).

## Correcciones tras el dictamen (Terra-12, 2026-11-01, copia previa en 04_auditoria/c05-series-antes-correcciones.csv)
- **R-C05-3 hecho.** La fila 273,294 (stock dic-2025 + flujo ene–sep 2026) salió de `f2-imss-puestos-mensual`; vive en `f2-imss-puestos-desde-flujo-estimado`, `estimado`, con banda mínima ±332 (intervalo de referencia 272,962–273,626) y la leyenda «no utilizable como stock». `f2-imss-puestos-mensual` solo trae stock publicado (jun-2026).
- **R-C05-4 hecho.** Unidad y variable siguen la palabra de la fuente: `trabajadores` (Hermosillo, El Imparcial), `trabajadores asegurados` (Sonora, Gob. Sonora y El Imparcial), `puestos` solo en IIEG («empleo formal», «puestos de trabajo») y en los flujos de prensa («empleos»). Reabrí el PDF del Gobierno de Sonora: su nota 1/ dice «Incluye a trabajadores permanentes y eventuales urbanos» y no menciona eventuales del campo; la explicación de la brecha de ~30 mil frente al IIEG queda como hipótesis no citada. Los `serie_id` no se renombraron (Sol valida los ids).
- **R-C05-5 hecho.** El diciembre-2025 queda solo en `f2-imss-puestos-dic` (260,693) y en `f2-imss-puestos-dic-sonora` (633,106); se quitaron las copias de las dos series `-mensual`. Ningún par (serie_id, periodo) se repite.
- **R-C05-6 hecho.** Las filas de salario 2021–2024 del Gob. Sonora (Sonora y nacional) dicen «mes no indicado; se asume diciembre por coincidencia de 2024 (544.3 vs 544.28)». Banda del salario real si fuera promedio anual (deflactor: promedio anual del INPC de C07, `estimado`): 2022 = 4.07 % (base 4.15 %); 2023 = 5.71 % (base 6.59 %). Van en la nota y en la serie nueva `f2-imss-salario-real-var-sonora-alt-prom-anual`. La base 2023 hereda la duda para 2024; no calculé banda 2024.
- **No hecho:** R-C05-1 (stock IMSS municipal 2019–2024; sin acceso desde esta sesión) y R-C05-2 (es de Sol). Las 13 filas `por verificar` siguen sin valor.
- Ningún valor leído de una fuente cambió (verificado por script contra la copia previa).

