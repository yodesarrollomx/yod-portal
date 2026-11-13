# Dictamen C05 · Empleo e ingreso (Terra-5)

Astra-2 (segundo auditor) · cierre 2026-11-01T21:49Z (`date -u`). Muestreo con WebFetch entre 21:42Z y 21:45Z.

Versión auditada: `01_base/f2-c05-empleo/`:
- `series.csv` (mtime 21:33:46Z, 77 filas);
- `fuentes.csv` (21:33:46Z);
- `notas.md` (21:34:08Z);
- `checkpoints.md` (21:34:10Z).

Criterios aplicados: `criterios-fase2.md` §0 y C05 (R7). Script propio: `scratchpad/astra2` (recálculos en línea con `python3 -I`).

**Veredicto: RECHAZADO**, por hueco en la serie municipal 2019–2024, que es condición explícita de C05.
- Lo que está transcrito es correcto: 40 valores reabiertos y 0 discrepancias.
- Todos los derivados se reproducen.
- La parte utilizable se separa en §D, cada pieza con su rótulo.
- El productor documentó bien los intentos. Busqué por mi cuenta (WebSearch «Hermosillo trabajadores asegurados IMSS diciembre 2023») y no encontré otra fuente abierta con el stock municipal anual.

## A. Muestreo propio (47 valores, 0 discrepancias)
| Fuente que abrí | Valores | Resultado |
|---|---|---|
| El Imparcial 7-ago-2026 | Hermosillo 260,693 → 274,098 (+5.14 %, 13,405); Sonora 649,918 (+16,812, 2.66 %); salario de Sonora 589.05 → 626.74 | iguales. La nota llama «trabajadores» al stock y «puestos/empleos» al flujo |
| El Imparcial 29-ene-2026 | Sonora 633,106 (dic-2025), −15,854; salario 544.28 → 589.05 | iguales |
| Gobierno de Sonora, «Agenda de indicadores cierre 2024» | 2021 = 54,249 + 266,730 + 305,631 = 626,610; 2022 = 640,492; 2023 = 655,910; 2024 = 52,672 + 267,208 + 329,080 = 648,960 (tabla «A diciembre», −1.1 %); salario de Sonora 393.0/441.3/492.3/544.3; salario nacional 438.6/486.7/537.9/587.4 | iguales. La gráfica de salario **no dice el mes ni si es promedio** |
| Ficha IIEG dic-2021 | Sonora +20,966 y +3.64 % («empleo formal», «puestos de trabajo») | iguales. **No menciona a los eventuales del campo** |
| El Imparcial 22-sep-2026; El Congresista | 11,644 (ene–ago; dice «82 % de 16,812»); 12,601 (ene–sep, cita al IMSS) | iguales; la contradicción del 82 % es real |
| El Imparcial 10-jul-2025 | 7,418 (ene–jun 2025) y 7,319 (ene–jun 2024) | iguales |
| INEGI, comunicado UMA 2026 | INPC dic/dic 2025 = 3.69 % | igual |
| CEFP, 9-ene-2026 | salario nacional dic-2025 = 627.87; +3.1 % real | iguales |
| Perfil DataMéxico de Hermosillo | ENOE 9.5k / 8.76k / 11.3k formal / 57.3 % / 1,405,467, «corresponden a la entidad federativa de Sonora» | iguales |

## B. Recálculos (todos coinciden)
- Niveles IIEG por intersección de intervalos de redondeo: dic-2020 queda entre 575,579 y 575,655, con punto medio 575,617. De ahí, 586,557 (2019), 596,583 (2021), 607,782 (2022) y 620,575 (2023): coinciden con el CSV.
- Variaciones Gob. Sonora: +2.22 / +2.41 / −1.06 / −2.44 %. El +5.14 % es semestral, no anual.
- Salario real de Sonora: 4.15 / 6.59 / 6.10 / 4.37 %. El nacional 2025 da 3.09 %, frente al +3.1 % del CEFP.
- Peso de Hermosillo en Sonora: 41.2 % (dic-2025) y 42.2 % (jun-2026).
- Crecimiento de Hermosillo en el semestre: 79.7 % del de Sonora. **El criterio «%Δ coherente con 260,693» se cumple solo para el primer semestre de 2026**; no hay con qué contrastar años anteriores.

## C. Problemas
1. **Hueco municipal** (causa del rechazo): las 13 filas `por verificar` (puestos dic-2019…2024 y salario 2019–2025) no tienen valor. El techo (§2.6) pide E_2021 y `escenarios.py` lee `g_empleo`. Ninguno de los dos tiene base municipal.
2. **Riesgo de signo del proxy estatal:**
   - Sonora baja en 2024 (−1.06 %) y en 2025 (−2.44 %).
   - Hermosillo, en cambio, publica flujos positivos en los mismos años (prensa): +7,319 en ene–jun 2024, +8,216 en ene–sep 2024 y +7,418 en ene–jun 2025.
   - Son acumulados parciales con estacionalidad (ejemplo: «en junio de 2024 se habían perdido 4,180»), así que no prueban el signo anual. Pero impiden suponer que Sonora replica a Hermosillo.
3. **Flujo mezclado con stock:** `f2-imss-puestos-mensual` 2026-09 = 273,294 se calcula como stock dic-2025 más el flujo acumulado de otra nota. Esto cae en la condición de rechazo de C05, aunque esté rotulado `estimado`. La misma nota reconoce que el flujo de junio (13,737) no es igual a la diferencia de stocks (13,405).
4. **Rótulo de unidad:** todo dice `puestos`, pero las fuentes de stock dicen «trabajadores (asegurados)» y el IIEG dice «empleo formal» o «puestos de trabajo». La explicación de la brecha de ~30 mil entre bases («incluye eventuales del campo») no aparece en lo que leí, y debe ir como hipótesis.
5. **Duplicados:** 2025-12 está en `f2-imss-puestos-dic` y en `f2-imss-puestos-mensual` (Hermosillo), y otra vez en `-dic-sonora` y `-mensual-sonora`.
6. **Salario 2021–2023 del Gobierno de Sonora:** no dice el mes. Se supone diciembre porque el de 2024 coincide con dic-2024 (544.3 frente a 544.28). El deflactor dic/dic solo es correcto si en efecto es diciembre.

## D. Qué es utilizable y con qué rótulo
| Pieza | Uso permitido | Rótulo obligatorio |
|---|---|---|
| Hermosillo 260,693 (dic-2025) y 274,098 (jun-2026) | ancla de nivel; %Δ semestral 2026 | `prensa`; «semestral, no dic/dic»; «registro patronal ≠ residencia» |
| Flujos acumulados de Hermosillo (8 filas) | contraste de **signo y orden de magnitud**; nunca como stock ni como variación anual | `prensa`; «acumulado ene–MM, no monótono» |
| Sonora dic 2021–2025 (Gob. Sonora + El Imparcial, una sola base, cruce 648,960 − 15,854 = 633,106) | **proxy** de g_empleo y del cociente E_t/E_2021 del techo | al usarse para Hermosillo: fila `estimado` con sufijo `-sonora` y nota «proxy estatal; signo 2024–2025 no verificado para Hermosillo»; banda que incluya g = 0 en 2024–2025 |
| Variaciones IIEG 2020 (−1.87 %) y 2021 (+3.64 %) | proxy de variación de Sonora 2020–2021, solo como % | `declarado`; **no empalmar** niveles IIEG con niveles del Gob. Sonora (difieren ~30 mil) |
| Salario de Sonora 2021–2026 e INPC dic/dic | g_ingreso_real (−sonora, permitido por C05) | `-sonora`; deflactor declarado; «mes 2021–2023 asumido diciembre» |
| ENOE de Sonora | solo contexto | no entra al motor |
| 273,294 (sep-2026) | **no utilizable** | ver R-C05-3 |

## E. Reinstrucciones

```
R-C05-1 | mayor (criterio C05: hueco 2019–2025) | responsable: Terra-5; Sol escala si hace falta acceso fuera de la sesión
hallazgo:   no hay stock IMSS municipal de Hermosillo dic-2019…dic-2024.
evidencia:  13 filas por verificar sin valor; datos.imss.gob.mx y api.datamexico.org bloqueados (robots/403), confirmado por el coordinador; mi búsqueda abierta no halló otra fuente (21:46Z). Versión: series.csv 21:33:46Z.
corrección: extraer de IMSS datos abiertos (archivos de asegurados por mes) o del cubo dinámico, fuera de esta sesión si es necesario. OJO: verificar el catálogo de municipios del IMSS, que no necesariamente usa la clave INEGI 030. Una definición por serie_id (diciembre; puestos o trabajadores).
resolución: f2-imss-puestos-dic con 7 valores 2019–2025 de fuente primaria; dic-2025 contrastado con 260,693 (±0 o diferencia explicada).

R-C05-2 | mayor (uso en motor mientras no exista R-C05-1) | responsable: Sol Integración
hallazgo:   el motor necesita g_empleo y E_t/E_2021; solo hay proxy estatal, y su signo puede diferir del de Hermosillo.
evidencia:  §C.2: Sonora −1.06 % y −2.44 % (2024–2025) frente a flujos de Hermosillo positivos en ene–jun 2024 y 2025.
corrección: usar solo la base Gob. Sonora (2021–2025) como proxy estimado -sonora, con banda que incluya 0 en 2024–2025; techo con E_t/E_2021 de Sonora rotulado «proxy estatal»; en el panel: «empleo municipal no disponible; se usa Sonora».
resolución: supuestos/data.json con g_empleo rotulado estimado-sonora y su banda; texto visible en el tablero.

R-C05-3 | mayor (criterio C05: flujo mezclado con stock) | responsable: Terra-5
hallazgo:   la serie de stock incluye un valor armado con un flujo (273,294).
evidencia:  nota de la fila: 260,693 + 12,601 (El Congresista); el flujo de junio no es igual a la diferencia de stocks (13,737 frente a 13,405).
corrección: sacar la fila de f2-imss-puestos-mensual; si se conserva, en un serie_id propio (…-desde-flujo-estimado) con banda de ±332 o más.
resolución: f2-imss-puestos-mensual solo con stocks publicados.

R-C05-4 | menor | responsable: Terra-5
hallazgo:   la unidad «puestos» no coincide con la palabra de la fuente, y la brecha entre bases se explica con una hipótesis no citada.
evidencia:  §A: El Imparcial y Gob. Sonora dicen «trabajadores (asegurados)»; IIEG dice «empleo formal» o «puestos de trabajo» y no menciona eventuales del campo.
corrección: unidad y variable según la fuente de cada serie_id; «incluye eventuales del campo» como hipótesis, salvo que la nota 1/ del PDF del Gobierno lo diga (citarla).
resolución: notas y unidades corregidas.

R-C05-5 | menor | responsable: Terra-5
hallazgo:   2025-12 está duplicado en -dic y -mensual (Hermosillo y Sonora).
evidencia:  §C.5.
corrección: un solo serie_id por definición.
resolución: 0 pares (serie_id, periodo) con la misma definición y fuente en dos ids.

R-C05-6 | menor | responsable: Terra-5
hallazgo:   el mes del salario 2021–2023 del Gob. Sonora es supuesto.
evidencia:  la gráfica dice solo «Promedio del Salario Diario» (21:43Z).
corrección: nota «mes no indicado; se asume diciembre por coincidencia de 2024»; banda en el salario real 2022–2023 por si fuera promedio anual.
resolución: nota y banda en f2-imss-salario-real-var-sonora.
```
