# Dictamen C03 · Cartera pública por etapa — Terra-3

Astra · cierre 2026-11-01T21:36Z (`date -u`). Muestreo con WebFetch entre 21:33Z y 21:34Z; a cada URL le agregué `?aud=astra1` para no leer la caché del productor.

Versión auditada: `01_base/f2-c03-cartera-publica/` — `cartera.csv` (21:29:41Z; 26 filas, 13 `cartera_id`), `notas.md` (21:30:12Z), `checkpoints.md` (6 líneas de 21:19Z a 21:30Z, coherentes con el mtime). Criterios aplicados: `criterios-fase2.md` §0, C03/C04 y §2.4–2.5.

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.**
- Reabrí 10 fuentes, que cubren 19 de las 26 filas: 0 discrepancias en cifras, fechas, verbos o etapas.
- No hay sumas. La cifra 11,142 quedó fuera, como debía. Las filas de Sonora están separadas y la calidad `prensa` es correcta (ninguna fuente oficial abrió).
- Antes de que C09 use la cartera hay que añadir el campo «entra a Q» (R-C03-1) y unificar el `cartera_id` de Arboledas (R-C03-2).

## A. Muestreo propio (literal)

| Fuente reabierta | Visto | Filas |
|---|---|---|
| Proyecto Puente 29-sep-2026 | «el pasado 16 de junio se comenzó con la construcción de 2 mil 400 viviendas», «inversión de mil 300 millones», «gran avance en el predio Arboledas, al sur»; no nombra a CONAVI; mensualidad ≈ 1,800; sin fecha de entrega | 2400 · 29-sep ✔ |
| El Imparcial 22-abr-2026 10:37 | «20 mil viviendas proyectadas para Hermosillo»; «65 mil hogares hacia 2030»; «se construyen actualmente 3 mil 108»; «está por iniciar la edificación de 2 mil 400 más… y 5 mil 634 por el Infonavit»; «11 mil 142» y el subtítulo «MÁS DE 11 MIL EN PROCESO» | 2400, 5634, 3108, meta 20000, meta 65000 ✔ |
| Proyecto Puente 23-ene-2026 | «alrededor de 2 mil 600», «los trabajos ya iniciaron», «550 mil pesos», «terminados en un año», «Conavi, no de Infonavit» (Rojo de la Vega) | sur-arboledas 23-ene ✔ |
| Proyecto Puente 16-ene-2026 | «En una primera etapa, el desarrollo contempla la construcción de 2 mil 700»; «segunda etapa»; «zona sur»; registro de aspirantes | sur-arboledas 16-ene ✔ |
| El Imparcial 14-oct-2025 09:58 | «se está construyendo en Altares un desarrollo de mil 400 viviendas» (delegado del Infonavit); recuadro: «1 mil 450 viviendas. Contempladas en Hermosillo, dentro de un área de nueve hectáreas»; otro desarrollo «que se está ajustando… está en proyecto» | altares 14-oct ✔ (ver R-C03-4) |
| El Imparcial 31-ene-2026 11:44 | «Actualmente se construyen 6 mil 200 hogares», «2 mil 400 en Hermosillo»; «el Infonavit impulsa la edificación de 11 mil 528 viviendas adicionales», «Se contempla 2 mil 624 viviendas en Hermosillo»; además «contempla la edificación de las primeras 17 mil 700» **y**, más adelante, «registra avances tangibles con la construcción de 17 mil 700» | 2400 · 31-ene ✔, 2624 ✔ |
| El Imparcial 17-jun-2026 09:07 | «construcción de 2 mil 400 viviendas en Hermosillo», «predio de 32 hectáreas», «mil 300 millones», «Con este inicio de obra»; «tener en construcción en el Estado de Sonora 13 mil viviendas»; no nombra a CONAVI ni a INFONAVIT | 2400 · 17-jun ✔ |
| N+ 14-jul-2025 20:32 (actualizada 20:33) | «En la colonia Altares se construyen las primeras casas… del Infonavit»; «un total de 912»; lista: «Altares 900 viviendas», «Predio 1,102 viviendas», «Predio 864» (sin la palabra «viviendas») | altares 14-jul, 1102, 864 ✔; fecha 2025 confirmada |
| Proyecto Puente 29-oct-2026 | Titular: «Construirá Gobierno 14 mil viviendas económicas en Hermosillo…»; «están en construcción 14 mil 800 y tantos»; «nada más del Infonavit, 8 mil», «las que son de Conavi son 6 mil»; la oración anterior habla de Sonora (65 mil) | estatal 14,800 ✔ |
| El Imparcial 14-abr-2026 21:12 | «Vamos a adquirir 320 viviendas abandonadas a través de un convenio con el Infonavit», «renta o venta», «cerca de 700 familias» | 320 ✔ |

## B. Respuestas a las dudas del productor
1. **CONAVI 2,400.** El arranque es el 16 de junio de 2026, con dos fuentes (17-jun y 29-sep). La nota del 29-sep liga los 2,400 con el **predio Arboledas**, el mismo de la fila del 23-ene. El estado vigente es 2,400 `en_construccion` desde 2026-06-16. Las cifras de 2,600 y 2,700 son anteriores y solo amplían la banda.
2. **El 22-abr ata los 5,634 al mismo «está por iniciar» que los 2,400.** Confirmado: `en_proyecto` es correcto.
3. **Arboledas 23-ene.** «Ya iniciaron» es literal y la codificación «tal como lo dice la nota» es válida, siempre que la contradicción quede anotada (y lo está).
4. **Altares, 1,400 contra 1,450.** Son dos valores de la misma nota: el delegado dice 1,400 y el recuadro dice 1,450 «contempladas». Hay que conservar los dos. El dato de obra tiene ya 12 meses, así que en C09 su etapa vigente es incierta.
5. **14,800.** Es correcto cargarlo como Sonora y no usarlo para Hermosillo. Evidencia adicional: los «6 mil» de CONAVI de esa cita igualan a CONAVI Sonora del 31-ene (6,200) y son 2.5 veces CONAVI Hermosillo (2,400). Su escala es estatal.
6. **Los 17,700 de la Fase 1.** La nota trae las dos formulaciones («contempla la edificación» y «registra avances… con la construcción»), así que el reetiquetado se justifica, pero no por la razón que dio el productor. El motivo de fondo es que 17,700 ≈ 6,200 de CONAVI («se construyen») + 11,528 de INFONAVIT («impulsa la edificación… adicionales»), que suman 17,728. Es un agregado de dos etapas distintas (R-C03-6).

## C. Otros hallazgos
- Ninguna fila trae **«entra a Q»**, que mi criterio C03 exige.
  - Los textos ya permiten clasificar CONAVI: la nota del 29-sep dice «dirigidas a población no derechohabiente», con «esquema de financiamiento recuperable a tasa cero». Por tanto, CONAVI **no** entra a Q: va al bloque de precio administrado.
  - INFONAVIT entra a Q en la parte que se venda con crédito INFONAVIT; la parte en renta no.
  - Los 3,108 sin atribuir: incierto.
  - Las 320 abandonadas: no (es vivienda usada).
- `entrega_esperada = 2027` en Arboledas es una derivación. El contrato pide dejar el campo vacío si la fuente no da el año.
- Coherencia (no suma) con C02: el inventario «Popular» pasó de 2,001 (dic-2025) a 4,343 (jul-2026), y en abr-2026 hubo un lote de registro de 1,548 «Popular». Es del mismo orden que la cartera Bienestar que entró en obra, lo cual es compatible pero no lo prueba.
- La serie de la Fase 1 queda superada por este archivo: `cartera-conavi-hermosillo`, `cartera-infonavit-hermosillo`, `cartera-estatal-en-construccion` (3,108; la nota no lo atribuye al Estado) y `cartera-meta-hermosillo`.

## D. Reinstrucciones

```
R-C03-1 | mayor (condición para C09) | responsable: Terra-3
hallazgo:   falta «entra a Q: sí/no/incierto» en las 20 filas de Hermosillo.
evidencia:  grep "entra a Q" = 0 (cartera.csv 21:29:41Z); Proyecto Puente 29-sep: «población no derechohabiente», «recuperable a tasa cero».
corrección: anotar en nota: CONAVI (cadam, dos-complejos, sur-arboledas, programa-2400) = no (bloque precio administrado); INFONAVIT (altares, 9ha, predios, programa) = sí en la parte vendida con crédito INFONAVIT, no en la de renta; 3108 = incierto; 320 = no (usada); metas = n/a.
resolución: 20/20 filas municipales con el campo y su frase de soporte.

R-C03-2 | menor | responsable: Terra-3
hallazgo:   la misma cartera CONAVI sur está en dos cartera_id (sur-arboledas y programa-2400).
evidencia:  29-sep: los 2,400 iniciados el 16-jun con «gran avance en el predio Arboledas, al sur»; 23-ene: Arboledas ≈ 2,600; CONTRATO-F2 §2: mismo programa = mismo cartera_id.
corrección: un solo id (p. ej. conavi-bienestar-hmo-arboledas) para las 6 filas; cadam y dos-complejos siguen como posible_duplicado_de.
resolución: 0 programas con dos ids; nota con la evidencia del 29-sep.

R-C03-3 | menor | responsable: Terra-3
hallazgo:   entrega_esperada=2027 derivada en sur-arboledas (23-ene).
evidencia:  la fuente dice «terminados en un año», no da año; CONTRATO-F2 §2: si la fuente no lo dice, vacío.
corrección: vaciar el campo; dejar la frase en nota.
resolución: 0 entrega_esperada derivadas.

R-C03-4 | menor | responsable: Terra-3
hallazgo:   el localizador de altares 14-oct pone «segundo desarrollo» junto a la cita; no es texto literal.
evidencia:  la nota dice «otro que se está ajustando… está en proyecto».
corrección: localizador con el texto literal.
resolución: cita literal.

R-C03-5 | menor | responsable: Terra-3 (y Terra-4 al entregar C04)
hallazgo:   3,108 «en construcción» sin atribuir, tipo publico como supuesto; puede incluir Sello H o privada.
evidencia:  El Imparcial 22-abr: «se construyen actualmente 3 mil 108 viviendas» sin promotor.
corrección: nota «tipo supuesto; no entra como oferta pública en C09»; cuando C04 entregue, posible_duplicado_de con Sello H.
resolución: nota presente; referencia cruzada con C04.

R-C03-6 | menor | responsable: Sol Integración (dueño de series-integradas)
hallazgo:   cartera-bienestar-sonora-en-construccion 2026-01 = 17,700 es un agregado de dos etapas, no obra.
evidencia:  El Imparcial 31-ene (11:44): «contempla la edificación de las primeras 17 mil 700» y «registra avances tangibles con la construcción de 17 mil 700»; desglose «se construyen 6 mil 200» (CONAVI) + «impulsa la edificación de 11 mil 528 viviendas adicionales» (INFONAVIT) = 17,728.
corrección: sustituir por dos filas Sonora (CONAVI 6,200 en_construccion «según la nota»; INFONAVIT 11,528 en_proyecto) o renombrar a …-programa-mixto con etapa «mixta»; marcar cartera-conavi-hermosillo, cartera-infonavit-hermosillo, cartera-estatal-en-construccion y cartera-meta-hermosillo como superadas por f2-c03 cartera.csv.
resolución: 0 series «en construcción» con 17,700; el motor lee solo cartera.csv.
```

## E. Regla para C09 (precisión al criterio §2.4)
- **Misma cartera en fechas distintas:** vale el último dato con etapa explícita. Los anteriores solo amplían la banda.
- **Programas distintos que pueden solaparse** (Altares ↔ 9 ha ↔ 3,108; INFONAVIT 5,634 ↔ predios 1,102/864 ↔ Altares; Sello H ⊃ Bienestar): se cuenta una sola vez. El conjunto mayor fija el valor y el menor amplía la banda.
- **Estado vigente en Hermosillo:**
  - CONAVI: 2,400 `en_construccion` desde jun-2026, en el bloque aparte (fuera de δs).
  - INFONAVIT Altares: alrededor de 1,400 `en_construccion` (dato de oct-2025; etapa vigente incierta).
  - INFONAVIT: 5,634 `en_proyecto` desde abr-2026; no se sabe si incluye Altares.
  - Meta de 20,000: probabilidad 0.
