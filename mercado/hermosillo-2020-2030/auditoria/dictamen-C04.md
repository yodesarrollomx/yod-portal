# Dictamen C04 · Cartera privada por etapa — Terra-4

Astra · cierre 2026-11-01T21:38Z (`date -u`). Muestreo con WebFetch entre 21:36Z y 21:38Z; a cada URL le agregué `?aud=astra1` para no leer la caché del productor.

Versión auditada: `01_base/f2-c04-cartera-privada/` — `cartera.csv`, `series.csv` y `fuentes.csv` (los tres con mtime 21:33:35Z; 20, 13 y 18 filas), `notas.md` (21:34:10Z) y `checkpoints.md` (7 líneas de 21:19Z a 21:34Z, coherentes con el mtime). Criterios aplicados: `criterios-fase2.md` §0, C03/C04, §2.4–2.5 y la regla de `dictamen-C03.md` §E.

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.**
- 10 fuentes reabiertas, que cubren 15 de 20 filas de cartera y 9 de 13 de series: 0 discrepancias de cifra, fecha o cita.
- No hay sumas. El acumulado estatal 10,115 es una cifra publicada, no una suma propia. Las coberturas ambiguas se cargaron como Sonora, como corresponde.
- Antes de que C09 use el archivo hay que corregir dos cosas: la etapa de la base de Sello H (R-C04-1) y el residual de Bienestar dentro de `cartera.csv` (R-C04-2).

## A. Muestreo propio (literal)

| Fuente reabierta | Visto | Filas |
|---|---|---|
| Gaceta Municipal (PDF transparenciaproactiva, Gaceta del 30-ene-2025, Acuerdos Acta 8) | «con veintiún votos a favor»; tope «1’000,000 pesos» ajustable por el Índice SHF de Hermosillo; «hasta el 90%»; «hasta 40%» del ITD del lote; convenios CANADEVI «vigentes hasta el 15 de septiembre de 2027»; página ≈ 11. El número de acuerdo aparece intercalado (18–23) y el texto extraído **no liga el punto a la sesión del 18-dic** (la gaceta cita sesiones del 11 y del 18 de diciembre) | 3 filas `declarado` ✔ (ver R-C04-6) |
| Proyecto Puente 10-sep-2026 | «cuenta actualmente con 20 mil 861 viviendas inscritas en Hermosillo»; «El resto de las viviendas inscritas al programa corresponden a Viviendas del Bienestar»; «20 empresas cuentan con el certificado»; «10 mil 824 viviendas destinadas a las familias de la ciudad»; «25 fraccionamientos». Sin fecha de corte; nunca dice «privadas» | inscritas, certificadas, 20 empresas, 25 fracc. ✔ |
| El Imparcial 2-oct-2026 09:50 (Yánez Navarro, CANADEVI) | «inscribimos alrededor de 18 ó 20 fraccionamientos… donde se construirán alrededor de 10 mil 500 casas»; narración: «corresponden a proyectos por construir»; «Este año va muy similar el 2025»; venta de «mil 970» en el 1S2026 | canadevi-oct2026 ✔ |
| El Congresista 21-oct-2026 16:19 | L. E. Nieves (Promotora): «10 mil 500 viviendas ya proyectadas en nuestra ciudad», «de un monto de un millón 300 para abajo»; redacción: «Dieciocho desarrolladores», «90% en 38 trámites», «para el resto de 2023 y el año 2027» (error de año de la redacción, no de la cita) | promotora-oct2026, 18 desarrolladores, 38 trámites ✔ |
| El Imparcial 28-mar-2025 09:58 | Bajada: «Sólo este año se edificarán 3 mil 110 viviendas en diferentes municipios»; cuerpo: «arrancó en Hermosillo con 3 mil 110 unidades»; Larrinaga: «tenemos 3 mil 110 viviendas en proceso»; «10 mil 115… en los diferentes municipios de la entidad»; tabla «Total: 10,115»; discurso «3 mil 100» | plan-2025-hmo, -sonora, 2025-2027 ✔ |
| El Imparcial 14-ene-2025 (Y. Ojeda) | «construirá en Hermosillo 6 mil 655 viviendas»; «estimado de 3 mil 110 para este año»; «para el 2026 se prevé edificar 3 mil 545»; «catorce empresas»; «podría bajar el pronóstico en un 35%… poco más de 2 mil casas» | plan-2025-2026-hmo ✔ |
| El Imparcial 8-ene-2026 11:43 | «23 desarrollos ya registrados bajo el esquema de Sello H»; «al rededor de 16 mil viviendas ya en proyectos»; «hasta un millón 300 mil»; no menciona Bienestar | proyectos-ene2026, 23 desarrollos, tope del alcalde ✔ |
| El Imparcial 21-ago-2026 09:24 | «dio el banderazo de inicio del proyecto»; «contará con 314 lotes habitacionales para construir viviendas»; «No se informaron… las fechas de venta o entrega» | la-campina ✔ (ver R-C04-3) |
| Uniradio 14-sep-2026 18:56 | «inició… la novena etapa del Desarrollo Quinta Esmeralda, Sección Diamante»; «se edificarán 109 hogares incorporados al programa Sello H 2.0»; «tenemos 502 viviendas en todo el fraccionamiento»; «no rebase los 1.3 millones» | quinta-esmeralda ✔ |
| El Imparcial 14-oct-2026 | «fue inaugurado al sur de Hermosillo»; «El proyecto contempla 200 viviendas»; «inversión estimada de 170 millones»; no dice si las casas están terminadas o entregadas | solhara 14-oct ✔ (ver R-C04-4) |

## B. Respuestas a las dudas del productor
1. **CANADEVI 2025 (28-mar).** La contradicción interna es real: la bajada dice «diferentes municipios» y el cuerpo «arrancó en Hermosillo». Además, la fila del 28-mar trae etapa `en_construccion` («en proceso») y la del 16-abr, con el mismo id, `meta`. Para un plan anual cuya bajada dice «se edificarán», lo que corresponde es `meta` (R-C04-5). Es historia de 2025: no entra a los escenarios 2027–2030.
2. **`sello-h-bienestar` (10,037).** No es una cifra de la fuente: es una resta propia que supone que 10,824 es exactamente la parte no Bienestar, cosa que la nota no dice. No puede quedar como fila de cartera (R-C04-2).
3. **Inscritas, sep-2026.** Confirmado: incluye Bienestar y no trae corte.
4. **Promotora, oct-2026.** La cita de 10,500 es de Nieves y está correcta; el error de año es de la redacción.
5. **La Campiña.** Son 314 lotes y el banderazo es «del proyecto». No hay evidencia de viviendas en obra (R-C04-3).

## C. Solape C03↔C04 y regla para C09
- **20,861 inscritas contienen Bienestar.** Además, son casi iguales a la «meta» de «20 mil viviendas proyectadas para Hermosillo» del gobernador (El Imparcial 22-abr, C03: `sonora-hmo-meta-20000`). Los dos son agregados público + privado. Hay que marcarlos como posibles duplicados entre archivos, y ninguno entra a δs.
- **La partición que sí se puede usar** es privada (Sello H, una sola base de 10,500–10,824 en tres fechas, `en_proyecto`) más pública (C03). La comprobación de coherencia, que no es una suma de oferta, sale bien: el residual implícito (~10,000) es del mismo orden que la cartera pública de C03. No se usan nunca ni 20,861 ni el residual.
- **Los tres desarrollos con nombre** (La Campiña, Quinta Esmeralda, SolHara) están probablemente dentro de los 10,824. Son la única evidencia privada de obra con nombre, y solo sirven para el ritmo, no como unidades adicionales.
- **Los 3,108 de C03** («se construyen actualmente», sin promotor) pueden incluir obra privada de Sello H. Que coincidan con los 3,110 de CANADEVI 2025 es numérico, no prueba identidad.
- **El convenio CANADEVI vence el 15-sep-2027** (Gaceta). Es una fecha que C09 debe tomar en cuenta para el ritmo de la base de Sello H; no es una probabilidad.

## D. Reinstrucciones

```
R-C04-1 | mayor (condición para C09) | responsable: Terra-4
hallazgo:   la misma base privada de Sello H aparece con tres cartera_id y dos etapas (asignada_o_registrada en sep; en_proyecto en oct); la inscripción en un programa municipal no es registro RUV ni asignación.
evidencia:  cartera.csv 21:33:35Z; 2-oct «proyectos por construir»; 21-oct «ya proyectadas»; 10-sep sin verbo de obra.
corrección: un solo id (p. ej. sello-h-privada) para 10,824 (sep), 10,500 (2-oct) y 10,500 (21-oct), con etapa en_proyecto; sello-h-inscritas-sep2026 (20,861) también en_proyecto, con nota «agregado público+privado; no usar en δs».
resolución: 0 filas Sello H en asignada_o_registrada; 1 id para la base privada.

R-C04-2 | menor | responsable: Terra-4
hallazgo:   sello-h-bienestar = 20,861 − 10,824 = 10,037 es una resta propia dentro de cartera.csv; la fuente no la publica y supone una partición que no afirma.
evidencia:  Proyecto Puente 10-sep: «El resto… corresponden a Viviendas del Bienestar», sin cifra; CONTRATO-F2 §2 (cartera = dato de fuente; sin operaciones entre filas).
corrección: quitar la fila de cartera.csv; si se conserva, en series.csv como estimado (sello-h-residual-bienestar-estimado) con la fórmula y el supuesto; en sello-h-inscritas-sep2026, posible_duplicado_de con los ids de C03 (Arboledas/programa-2400, infonavit-bienestar-hmo-programa, infonavit-bienestar-hmo-altares) y sonora-hmo-meta-20000.
resolución: 0 filas estimado en cartera.csv; referencias cruzadas presentes.

R-C04-3 | menor | responsable: Terra-4
hallazgo:   la-campina-etapa-3 = en_construccion con 314 lotes; el banderazo es del proyecto, no hay viviendas en obra.
evidencia:  El Imparcial 21-ago-2026: «banderazo de inicio del proyecto», «314 lotes habitacionales para construir viviendas».
corrección: etapa en_proyecto (viviendas por construir), nota «unidad = lotes; obra del fraccionamiento».
resolución: etapa y nota corregidas.

R-C04-4 | menor | responsable: Terra-4
hallazgo:   solhara-derex 14-oct-2026 = terminada sin evidencia de casas terminadas.
evidencia:  la nota: «fue inaugurado», «El proyecto contempla 200 viviendas»; no precisa si están terminadas o entregadas.
corrección: etapa en_construccion (última evidencia firme: obra desde ago-2025), nota «inaugurado el desarrollo; estado de las casas no publicado».
resolución: 0 filas terminada sin texto que lo diga.

R-C04-5 | menor | responsable: Terra-4
hallazgo:   canadevi-plan-2025-hmo: en_construccion (28-mar) y meta (16-abr) para el mismo plan anual.
evidencia:  28-mar, bajada «se edificarán 3 mil 110 viviendas en diferentes municipios»; cuerpo «arrancó en Hermosillo», «en proceso».
corrección: etapa meta en ambas fechas; nota con las tres frases y «cobertura ambigua (posible estatal)».
resolución: un solo tipo de etapa para el plan.

R-C04-6 | menor | responsable: Terra-4
hallazgo:   el localizador de la Gaceta afirma «sesión extraordinaria 18-dic-2024, ACUERDO 18», pero el texto que reabrí no liga el punto a esa sesión y la numeración aparece intercalada.
evidencia:  Gaceta 30-ene-2025 (Acuerdos Acta 8), pág. ≈11: «veintiún votos a favor», «1’000,000 pesos», «15 de septiembre de 2027»; cita sesiones del 11 y del 18 de diciembre.
corrección: localizador «Gaceta Municipal 30-ene-2025, Acuerdos Acta 8, pág. ≈11, Programa Sello H (Acuerdo 18 según encabezado; sesión de dic-2024)», o la cita textual que pruebe el 18-dic; la calidad puede subir a observado (texto oficial primario).
resolución: localizador verificable en <2 min.
```
