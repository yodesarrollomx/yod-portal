# C04 · Cartera privada por etapa (municipio de Hermosillo) · notas

Consulta: 2026-11-01. Todo reabierto en origen con WebFetch; nada de memoria. Archivos: `cartera.csv` (19 filas, 14 `cartera_id` tras el dictamen), `series.csv` (14), `fuentes.csv` (18). Calidad: `observado` solo para la Gaceta Municipal (texto oficial primario, R-C04-6); el resto `prensa`; una fila `estimado` en `series.csv` (el residual, R-C04-2) y ninguna en `cartera.csv`.

## 1. Conciliación de Sello H (cifra → fecha → definición → ¿incluye Bienestar?)

| Cifra | Fecha | Definición que da la fuente | ¿Bienestar? | `cartera_id` |
|---|---|---|---|---|
| 3,000 | 21-ene-2025 | Meta de incentivo 2025, tope ≤1.0 mdp ("incentivar la construcción de 3 mil viviendas") | No mencionado | sello-h-meta-2025 |
| ~16,000 (23 desarrollos) | 8-ene-2026 | "viviendas ya en proyectos" (alcalde) | No especificado | sello-h-proyectos-ene2026 |
| 20,861 | 10-sep-2026 | "viviendas inscritas"; sin corte, sin definición | **Sí**: "el resto … Viviendas del Bienestar" | sello-h-inscritas-sep2026 (en_proyecto; agregado público+privado, no usar en δs) |
| 10,824 (20 empresas, 25 fracc.) | 10-sep-2026 | Viviendas de empresas con certificado | Se lee que no (contraste con "el resto") | sello-h-privada (etapa en_proyecto; antes sello-h-empresas-certificadas-sep2026) |
| ~10,500 (18–20 fracc.) | 2-oct-2026 | CANADEVI: fraccionamientos inscritos, "proyectos por construir" | No (cámara privada) | sello-h-privada (antes sello-h-canadevi-oct2026) |
| 10,500 (18 desarrolladores) | 21-oct-2026 | "ya proyectadas" (director de Promotora Inmobiliaria) | No mencionado | sello-h-privada (antes sello-h-promotora-oct2026) |

Lectura: 10,824 (sep) y 10,500 (oct) describen casi la misma base privada (diferencia 324, 3%); el residual 20,861 − 10,824 = 10,037 sería Bienestar (ya no es fila de cartera: está en `series.csv` como `sello-h-residual-bienestar-estimado`, `estimado`, la nota NO publica ese número). Los 16,000 de enero no se concilian con nada: no se sabe qué incluían. El titular "20 mil" no es cartera privada. En ningún caso la fuente dice "en construcción": todo es inscrito/proyectado.

## 2. Reglas de Sello H (fuente oficial)
Gaceta Municipal 30-ene-2025, Acuerdos Acta 8 (carátula: sesión extraordinaria del 18-dic-2024), Acuerdo 18 según encabezado, aprobado por unanimidad (21 votos). Tope: "valor máximo de 1'000,000 pesos", ajustable por el Índice SHF para Hermosillo. Descuento "de hasta el 90%" en conceptos enumerados y "hasta 40%" en el Impuesto por Traslado de Dominio del lote. Convenios con CANADEVI Sonora "vigentes hasta el 15 de septiembre de 2027". Inspecciones a desarrollos inscritos; ventanilla única; Vale H (paneles solares) vía Hogar Solar.
- **Sello H 2.0 (2ª edición)**: tope 1.3 mdp. Convenio Ayuntamiento-CANADEVI del 12-dic-2025 ("incrementa el rango máximo de precio de hasta un millón 300 mil"); alcalde, 7-ene-2026: "la siguiente versión que ya se aprobó por Cabildo se aumenta hasta 1 millón 300". No hallé la Gaceta de esa modificación. Kit de paneles hasta 1.1 mdp; medidor ultrasónico de 1.1 a 1.3 mdp (Proyecto Puente).
- Prensa cuenta distinto el descuento: "más de 30 conceptos" (ene-2025) y "38 trámites" (oct-2026).

## 3. CANADEVI Sonora: "Hermosillo" vs "Sonora" (frases exactas)
- 14-ene-2025: "construirá en Hermosillo 6 mil 655 viviendas" (3,110 + 3,545, 2025–2026; 14 desarrolladoras).
- 28-mar-2025: "Canadevi arrancó en Hermosillo con 3 mil 110 unidades…" **y**, en la misma nota, "Sólo este año se edificarán 3 mil 110 viviendas en diferentes municipios"; tabla "Total: 10,115" (= 3,110+3,545+3,460) estatal.
- 16-abr-2025: "En el 2025 serán 3 mil 110 en Hermosillo, en 2026 3 mil 545 en diferentes puntos y en 2027 3 mil 460" (2027 sin ubicación; total en "los diferentes municipios del Estado").
- Conclusión: solo 2025 se llama "Hermosillo", y como 3,110 forma parte de un total estatal, **puede ser estatal**. 2026 y 2027 no son Hermosillo (cargadas como Sonora). No hay arranques 2026–2027 propios de Hermosillo ni actualización: jul-2026 "más de 4 mil 800" (Sonora, ambigua) y 2-oct-2026 "Este año va muy similar el 2025" sin cifra.

## 4. Desarrollos (solo 3 con unidades; ninguno ≥300 viviendas terminadas)
La Campiña 3ª etapa (Construvisión, 314 **lotes**, banderazo 21-ago-2026, Sello H 2.0); Quinta Esmeralda Sección Diamante 9ª etapa (109 de 502 viviendas, 14-sep-2026, tope 1.3 mdp); SolHara (Derex): >200 anunciadas (21-ene-2025), obra de 204 a ~750 mil (15-ago-2025), inaugurado 200 viviendas, 170 mdp (14-oct-2026). Primeras 3 casas Sello H entregadas el 16-may-2025 (Viveconsa, Ruba, Derex; Cantabria Residencial, Valle Natura, Praga Residencial), sin cartera. Derex (ahora 100% Vinte) "construye más de 600 viviendas al año en Hermosillo, Tijuana y Nogales": geografía mezclada, no es fila.

## 5. Duplicidades con la cartera pública (no sumar)
1. 20,861 incluye Bienestar: solapa con CONAVI (2,400 Hermosillo) e INFONAVIT (2,624 / 5,634) de C03 (cifras heredadas de la Fase 1, no reabiertas aquí).
2. 16,000 (ene): composición desconocida, posible solape igual.
3. 10,824 ⊂ 20,861; 10,500 CANADEVI ≈ 10,500 Promotora ≈ 10,824: una sola base en tres fechas.
4. 3,110 CANADEVI (2025) ≈ 3,000 meta Sello H (2025) y casi igual a "se construyen actualmente 3 mil 108" (gobernador, 22-abr-2026, sin decir quién): coincidencia numérica, sin evidencia de identidad.
5. 3,545 ⊂ 6,655; 10,115 ⊃ 3,110+3,545+3,460.
6. Los tres desarrollos están, probablemente, dentro de las 10,824 de Sello H.
7. Demanda: las primeras casas Sello H se vendieron con crédito Infonavit; la misma vivienda puede aparecer como cartera y como crédito.

## 6. No se obtuvo
Página oficial de Sello H en hermosillo.gob.mx (robots la bloquea); Gaceta de Sello H 2.0; lista oficial de empresas/fraccionamientos certificados; cifras Sello H "en construcción"; comunicados de Ruba, Javer, Vertex, Casas GEO o Sadasi sobre Hermosillo 2025–26 (nada); sonora.gob.mx y Milenio no abrieron. Faltan hasta nueve desarrollos de la lista pedida.

## Hallazgos para el auditor (reabrir primero)
1. `canadevi-plan-2025-hmo` (28-mar-2025): confirmar la contradicción "arrancó en Hermosillo" vs "diferentes municipios".
2. `sello-h-bienestar`: residual propio (resuelto: retirado de cartera.csv, ahora en series.csv).
3. `sello-h-inscritas-sep2026`: confirmar en el texto la frase de Bienestar y la ausencia de corte.
4. `sello-h-promotora-oct2026`: nota con error de año; confirmar la cita de 10,500.
5. `la-campina-etapa-3`: etapa frente a 314 lotes (banderazo, no vivienda; resuelto: en_proyecto).

## Correcciones tras el dictamen
Dictamen de Astra (`04_auditoria/dictamen-C04.md`); copias previas en `04_auditoria/c04-{cartera,series,fuentes}-antes-correcciones.csv`; script `correcciones_dictamen.py` (`python3 -I`; parte siempre de esas copias). Ninguna cifra, fecha ni URL leída cambió.
- **R-C04-1.** La base privada de Sello H queda en un solo id, `sello-h-privada` (10,824 el 10-sep, 10,500 el 2-oct, 10,500 el 21-oct), etapa `en_proyecto` en las tres. `sello-h-inscritas-sep2026` (20,861) también `en_proyecto`, con la nota «agregado público+privado; NO usar en δs». 0 filas Sello H en `asignada_o_registrada`. Para C09 vale el último dato con etapa explícita (10,500 del 21-oct); los otros amplían la banda.
- **R-C04-2.** `sello-h-bienestar` (10,037) sale de `cartera.csv` (0 filas `estimado`). Se conserva en `series.csv` como `sello-h-residual-bienestar-estimado` (`estimado`): 20,861 − 10,824, con el supuesto de que las 10,824 son exactamente la parte no Bienestar (la nota no lo afirma); solo comprobación de coherencia, no se suma ni entra a δs. `sello-h-inscritas-sep2026` apunta como posible duplicado a los ids de C03: `conavi-bienestar-hmo-arboledas` (id único tras R-C03-2; antes `programa-2400`/`sur-arboledas`), `infonavit-bienestar-hmo-programa`, `infonavit-bienestar-hmo-altares` y `sonora-hmo-meta-20000`. En sentido inverso, la cartera de C03 (`sonora-hmo-en-construccion-3108`) apunta a `sello-h-inscritas-sep2026` y `sello-h-privada`.
- **R-C04-3.** `la-campina-etapa-3`: `en_proyecto`; nota «unidad = lotes; obra del fraccionamiento»; sin viviendas en obra.
- **R-C04-4.** `solhara-derex` 14-oct-2026: `en_construccion`; nota «inaugurado el desarrollo; estado de las casas no publicado»; última evidencia firme de obra: ago-2025. 0 filas `terminada`.
- **R-C04-5.** `canadevi-plan-2025-hmo`: `meta` en 28-mar y 16-abr; la nota del 28-mar cita las tres frases («arrancó en Hermosillo con 3 mil 110 unidades», «tenemos 3 mil 110 viviendas en proceso», «Sólo este año se edificarán 3 mil 110 viviendas en diferentes municipios») y marca cobertura ambigua (posible estatal).
- **R-C04-6.** Localizador de las tres filas de la Gaceta: «Gaceta Municipal 30-ene-2025, Acuerdos Acta 8, pág. ≈11, Programa Sello H (Acuerdo 18 según encabezado; sesión de dic-2024)», con la cita de la carátula («EN SESIÓN EXTRAORDINARIA CELEBRADA EL 18 DE DICIEMBRE DE 2024») y la del punto. Calidad subida a `observado` (texto oficial primario, releído el 2026-11-01); `fuentes.csv` C04-F01 ajustado.
