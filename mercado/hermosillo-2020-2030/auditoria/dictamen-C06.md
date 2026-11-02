# Dictamen C06 · Población y hogares (Terra-7)

Astra-3 · cierre 2026-11-01T21:47Z (`date -u`). Muestreo con WebFetch entre 21:40Z y 21:45Z. Versión auditada: `01_base/f2-c06-hogares/`, con `series.csv` (mtime 21:37:03Z; 212 filas), `fuentes.csv` (21:37:03Z), `checkpoints.md` (21:37:31Z) y `notas.md` (21:37:36Z). Criterios aplicados: `criterios-fase2.md` §0 y C06. Recálculo propio con `python3 -I` en el scratchpad de Astra-3 (`astra3/c06_audit.py`), que lee el CSV como dato.

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.**
- Transcripción: 25 valores reabiertos, 0 discrepancias.
- Recálculo: 186 de 186 valores derivados coinciden.
- Contrato: 14 columnas, sin claves duplicadas, una unidad y una geografía por `serie_id`.
- Las seis correcciones son de rótulo, calidad o nota; ninguna cambia un número.
- Dos de ellas (R-C06-1 y R-C06-3) condicionan la integración, porque el tablero muestra la calidad como «dato/supuesto». La recomendación de ruta (§F) es una decisión de Sol, no un defecto del chunk.

## A. Muestreo propio: 25 valores, 0 discrepancias de transcripción

| Fuente que reabrí (WebFetch) | Visto literal | CSV |
|---|---|---|
| INEGI `eic2025_presentacion_26.pdf`, lámina «POBLACIÓN POR MUNICIPIO» | Hermosillo 962 020 (31.76 %); Sonora 3 049 889 en total, 3 028 969 en viviendas particulares y 20 920 en colectivas o sin vivienda | 962020 ✔ · 3028969 ✔ |
| INEGI EIC 2025, lámina «PERSONAS» | «En 2020, en Sonora vivíamos 2 944 840» | 2944840: dígitos ✔, **concepto ✘** (ver R-C06-2) |
| COESPO `Hermosillo.pdf` | 1,028,894 · 1,099,323 · 1,162,905 · 1,220,389. «Fuente: Reconstrucción y proyecciones de la población de los municipios de México 1990-2040 (CONAPO)». Solo cuatro años | 4/4 ✔ |
| COESPO `Proyecciones2025-2040-Estatal.pdf` | 3,140,762 · 3,266,041; cita **el mismo** producto municipal 1990-2040 | 2/2 ✔ |
| INEGI `cpv2020_pres_res_son.pdf` | Hermosillo 936 263 (población) y 278 550 (viviendas particulares habitadas, VPH). Sonora: hogares censales 876 333, población en hogares censales 2 924 641, VPH 529 937 · 712 108 · 876 333, ocupantes 4.1 · 3.7 · 3.3, población total **2 944 840** | 12/12 ✔ |
| INEGI `EIC2025-def_Son.pdf` (comunicado 80/26, 22-sep-2026) | 981 430 VPH; «de 3.3 en 2020 a 3.1 en 2025»; levantamiento del 6-oct al 14-nov-2025 | 2/2 ✔ |
| COESPO AVGM 2023, p. 5 | Hermosillo, total: 768,060 (2010) y 927,042 (2020); «Fuente: Censo de Población y Vivienda 2020» | 2/2 ✔ |
| INEGI México en Cifras 26030 | «una población total de 784 342 habitantes» (censo 2010) | ✔ |
| municipiodata (demografía) | «Total households 278,550» (Census households); 3.3 personas por hogar | ✔ |

Hallazgos laterales del muestreo:
- La versión CONAPO está citada y es una sola. El PDF estatal y el municipal de COESPO citan el mismo producto («municipios 1990-2040»), así que no hay versiones CONAPO/COESPO mezcladas.
- Ningún PDF de COESPO dice «a mitad de año», aunque la variable y la nota lo afirman (R-C06-6).
- La cifra 260,719 que las notas atribuyen a municipiodata no aparece en la página citada.

## B. Recálculo propio (`python3 -I`)

**186 comparaciones, 0 fuera de tolerancia, |dif| máxima = 0.** Cubre:
- el puente de 2021 a 2024;
- la interpolación CONAPO de 2026 a 2029;
- las dos rutas de población en hogares;
- las tres trayectorias del tamaño;
- los seis juegos de hogares;
- los seis juegos de hogares nuevos.

Cifras de las notas, verificadas:

| Cifra | Valor recalculado |
|---|---|
| CONAPO frente a EIC 2025 | +6.95 % (EIC −6.50 %) |
| CONAPO × fracción en hogares frente a EIC | +5.90 % |
| Sonora, EIC frente a CONAPO | −2.89 % |
| Tasa anual del puente | 1.905 % |
| Tasa anual CONAPO 2025–2030 | 1.333 % |
| Tasa anual de la población en hogares (EIC) | 0.743 % |
| Tasa anual total frente a viviendas particulares | 0.544 % |
| Hogares 2030, ruta EIC frente a ruta CONAPO | −8.28 % |

Las notas dicen «10,123» y «8,616», y el CSV 10,122 y 8,617. La diferencia es ±1 por redondear antes o después de restar, dentro de tolerancia.

**Numerador del tamaño medio: 927,042 es el correcto.**
- En la misma fuente, 927,042 es también el total de los cuadros de servicios de la vivienda: 921,858 + 2,393 + 2,021 + 770 = 927,042, con una fila «local no construido para habitación». Es decir, son **ocupantes de viviendas particulares habitadas**, el mismo universo que el denominador (278,550 VPH).
- 936,263 incluye viviendas colectivas, personas sin vivienda y, probablemente, la población estimada en viviendas sin información de ocupantes.
- Con 936,263 el tamaño sería 3.3612, un 0.99 % más alto y con universos mezclados.
- El método reproduce el de INEGI para Sonora: 2,924,641 ÷ 876,333 = 3.3374, que INEGI publica como 3.3.
- Residuo: INEGI excluye de sus promedios los locales no construidos, las viviendas móviles y los refugios (770 personas). El efecto es menor a 0.03 %.

## C. Viviendas habitadas como hogares (criterio C06)

- **No es el error de HCV**, en el que una cifra de viviendas se rebautiza como «hogares» en sentido amplio. En el Censo 2020 de INEGI, el *hogar censal* son los residentes habituales de **una** vivienda particular, así que hogares censales = VPH por definición.
- La misma presentación de INEGI lo comprueba en Sonora: 876,333 hogares censales y 876,333 VPH.
- Por tanto, la base de 2020 (278,550) es defendible **como hogar censal**.
- El rotulado del chunk se contradice:
  - `f2-viv-part-habitadas-hermosillo` dice «no usar como hogares»;
  - `f2-hogares-censales` dice «universos distintos» y se apoya en un agregador (`por verificar`);
  - aun así, el tamaño (localizador «municipiodata, hogares») y todos los hogares de 2020 usan ese número.
- Corrección en R-C06-1.
- Consecuencia de método para Sol: con esta definición, «hogares» es el parque de vivienda ocupada proyectado. Las trayectorias con tamaño decreciente incorporan un supuesto de formación de hogares que en parte responde a la oferta. Por eso sirven solo como sensibilidad.

## D. Puente 2021–2024 y ruta CONAPO

- **En su propia serie está bien rotulado.** `f2-poblacion-conapo-puente` dice «no es serie CONAPO» y «HÍBRIDO», y trae la fórmula.
- **Aguas abajo se presenta como CONAPO:**
  - la variable de las seis series de hogares de la ruta A dice «(población CONAPO; …)» en 2021–2024;
  - sus `serie_id` (`f2-hogares-estimados`, `-bajo`, `-alto`) no llevan sufijo de ruta, mientras que la ruta EIC sí lo lleva;
  - las notas de 2021–2024 no mencionan el puente.
- El puente mezcla dos versiones: el conteo censal y el nivel conciliado de CONAPO. Si CONAPO 2020–2025 creciera como en 2025–2030, su nivel de 2020 sería de unos 962,977 habitantes, un 2.85 % sobre el Censo. Entonces unos 0.57 de los 1.905 puntos anuales del puente serían cambio de nivel entre versiones, no crecimiento. Es un orden de magnitud: el valor CONAPO de 2020 no se obtuvo.
- Además, la EIC 2025 lo contradice:
  - la población en hogares observada creció 0.74 % anual (0.665 % con fechas reales), contra 1.9 % del puente;
  - los hogares nuevos centrales acumulados 2021–2025 son 47,130 en la ruta A frente a 28,991 en la ruta B.

## E. Calidad, contrato y proceso
- Los hogares de 2021 a 2030 y sus diferencias van como `estimado`, pero cada valor depende del tamaño `supuesto`. En la ruta EIC de 2026 a 2030 dependen además de una población `supuesto`. Son sendas de escenario (CONTRATO-F2 §1): R-C06-3.
- `f2-poblacion-viv-part-sonora` mezcla definiciones en un mismo `serie_id`:
  - 2025 = población en viviendas particulares (3,028,969);
  - 2020 = **población total** (2,944,840, en la lámina «PERSONAS» y en «Población total en Sonora» del Censo); el comparable es 2,924,641;
  - la lámina que cita el localizador no permitió confirmar ese valor.
  - No entra al motor: R-C06-2.
- Tamaño medio: «Censo 2020 observado» (C06) no se cumple al pie de la letra. El valor es un cociente `estimado`; el promedio municipal publicado por INEGI (Panorama p. 76) no abrió, tampoco en mi intento. Se espera ≈3.33. Pendiente en R-C06-1.
- Trayectorias del tamaño:
  - La única pendiente reciente **sin redondear** es la de Sonora 2020–2025, −0.0502. El productor la rotula «rápida».
  - La «central» (−0.040) sale de cifras redondeadas: 3.3 → 3.1 admite entre −0.02 y −0.06.
  - El productor dice que 2020 y 2025 son «universos no idénticos», pero por la definición del §C son el mismo concepto (ocupantes ÷ VPH). Lo que puede haber es un quiebre entre censo y encuesta, que debería decirse así.
  - Es un supuesto: lo decide C09 (R-C06-5).
- Anualización de la ruta EIC: los anclajes son el 15-mar-2020 y el 15-oct-2025 (5.59 años), no 5. La tasa real es **0.665 %**, no 0.743 %. Con 0.665 % la ruta EIC central da g_hogares ≈ 1.97–2.04 % anual en 2026–2030, frente a 2.07–2.12 %. Los niveles de 2021 a 2025 no cambian (los dos anclajes se respetan); solo cambia la extrapolación, que ya es `supuesto` (R-C06-4).
- `f2-tamano-hogar-sonora` tiene la unidad «personas por hogar», pero la variable es ocupantes por vivienda (R-C06-1).
- Checkpoints: 5 líneas, de 21:21:54Z a 21:37:31Z, con pausas de 2 a 7 minutos. La última coincide con el mtime de `checkpoints.md`; `notas.md` es de 5 s después. Coherentes.
- Notas: unas 700 palabras, con sección de hallazgos.

## F. Recomendación para el escenario (decisión de Sol)
1. **Hogares solo como sensibilidad (§2.3).** La base sigue siendo el empleo IMSS. `escenarios.py` ya impide usar `g_empleo` y `g_hogares` a la vez.
2. **Ruta EIC como centro de la sensibilidad.** Es la única anclada en un nivel observado de 2025 del mismo universo. CONAPO 2025 queda contradicho por la EIC (−6.5 %; −2.9 % en Sonora). La ruta CONAPO va solo como **cota alta**, rotulada «proyección CONAPO 1990-2040, contradicha en nivel por la EIC 2025».
3. **Al motor entra %Δ, no niveles**, para que la brecha de nivel no pase.
4. **Nunca usar el puente**, ni la ruta A de 2021–2025, como historia. El método dice «máx./mín. observados 2021–2025» (metodo-curvas §5), pero no hay serie anual observada de hogares: la variación de 2021 a 2024 es constante por construcción. La banda debe salir de la matriz ruta × tamaño, rotulada `supuesto`.
5. Banda de referencia de g_hogares para 2027–2030, con los números de C06:
   - centro: EIC con tendencia central, ≈2.1 % anual (≈2.0 % con la tasa de R-C06-4);
   - piso: EIC con tamaño constante, 0.74 % (0.665 %), que es crecimiento demográfico puro;
   - techo: CONAPO con tendencia rápida, ≈3.1 %.

## G. Reinstrucciones

```
R-C06-1 | mayor (condición de integración; no cambia números) | responsable: Terra-7
hallazgo:   VPH 278,550 se usa como hogares 2020 con rótulos contradictorios: «no usar como hogares», «universos distintos», denominador citado de un agregador.
evidencia:  cpv2020_pres_res_son: hogares censales Sonora 876 333 = VPH 876 333; Hermosillo VPH 278 550; municipiodata «Census households 278,550»; f2-tamano-hogar localizador «municipiodata». series.csv 21:37:03Z.
corrección: f2-hogares-censales con fuente INEGI (VPH 278 550) y nota «hogar censal = residentes de una vivienda particular (INEGI, Censo 2020): hogares censales = VPH por definición; comprobado en Sonora 876 333 = 876 333; municipiodata solo corrobora»; calidad estimado (identidad), no por verificar. El localizador de f2-tamano-hogar cita INEGI. Nota de f2-viv-part-habitadas-hermosillo: «= hogares censales por definición; no equivale a hogares por gasto común». Unidad de f2-tamano-hogar-sonora: «personas por vivienda». Pendiente: leer el promedio municipal publicado por INEGI (Panorama p. 76 o ITER) y registrar ambos valores (tolerancia ±0.5 %).
resolución: grep «universos distintos|no usar como hogares» = 0 en f2-c06; 0 filas por verificar en la base del tamaño.

R-C06-2 | menor | responsable: Terra-7
hallazgo:   f2-poblacion-viv-part-sonora 2020 = 2,944,840 es población total, no población en viviendas particulares.
evidencia:  EIC 2025, lámina «PERSONAS»; Censo 2020, lámina «Población total en Sonora» 2 944 840 (WebFetch, 21:41Z).
corrección: mover el valor a f2-poblacion-total-sonora 2020 (observado, cpv2020); en viv-part-sonora 2020 poner el valor de la lámina «Población en viviendas particulares habitadas por entidad federativa, 2020 y 2025» o no poner fila.
resolución: un solo concepto por serie_id.

R-C06-3 | mayor (condición de integración; no cambia números) | responsable: Terra-7
hallazgo:   los hogares y hogares nuevos de 2021 a 2030 van como estimado aunque dependen del tamaño supuesto; en la ruta EIC de 2026 a 2030, también de una población supuesto.
evidencia:  notas de las filas «DEPENDE DEL SUPUESTO»; f2-poblacion-hogares-eic-ruta 2026–2030 = supuesto; CONTRATO-F2 §1.
corrección: calidad supuesto en las 6 series de hogares y las 6 de hogares nuevos (al menos 2026–2030; preferible 2021–2030). Nota: «senda de escenario; no es dato».
resolución: integrar.py sin errores; el tablero las muestra como «supuesto».

R-C06-4 | menor (nota; el valor de la senda lo decide C09) | responsable: Terra-7 → Terra-9 (C09)
hallazgo:   la tasa de la ruta EIC (0.743 %) supone 5 años entre los anclajes; el intervalo real es de 5.59 años.
evidencia:  Censo 15-mar-2020; EIC con levantamiento del 6-oct al 14-nov-2025 y referencia 15-oct-2025; mi recálculo da 0.665 % anual.
corrección: nota «tasa por año calendario nominal; con fechas de referencia, 0.665 %»; C09 elige la tasa de continuación (0.665 % recomendado).
resolución: las dos tasas registradas; supuestos.csv cita la elegida.

R-C06-5 | menor | responsable: Terra-7 (justifica) / Terra-9 (decide la senda)
hallazgo:   la trayectoria «central» (−0.040) sale de cifras redondeadas; la única pendiente observada sin redondear (−0.0502, Sonora 2020–2025) va como «rápida»; «universos no idénticos» describe mal un posible quiebre entre censo y encuesta.
evidencia:  2 924 641/876 333 = 3.3374 y 3 028 969/981 430 = 3.0863 (recálculo propio).
corrección: justificar la central o cambiar el orden; describir el quiebre entre censo y encuesta.
resolución: nota de f2-tamano-hogar-* y supuestos.csv con la justificación.

R-C06-6 | menor | responsable: Terra-7
hallazgo:   puente presentado como CONAPO aguas abajo, y localizadores o afirmaciones sin respaldo en la fuente citada.
evidencia:  variable «(población CONAPO; …)» en las series de la ruta A 2021–2024, sin sufijo -conapo; «a mitad de año» ausente en los PDF de COESPO; lámina «Municipios con más y menos población» = «POBLACIÓN POR MUNICIPIO»; 260,719 no aparece en la página de municipiodata citada.
corrección: serie_id f2-hogares-estimados-conapo{,-bajo,-alto} (y los de hogares nuevos); en 2021–2024, variable y nota «población: puente híbrido Censo 2020→CONAPO 2025, no CONAPO; contradicho por la EIC 2025»; citar dónde se lee «mitad de año» (página de CONAPO) o quitarlo; corregir el título de la lámina; quitar 260,719 o citar su página.
resolución: grep «población CONAPO» = 0 en las filas 2021–2024; integrar.py sin errores con los ids nuevos.
```
