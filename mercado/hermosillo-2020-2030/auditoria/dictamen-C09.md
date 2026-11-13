# Dictamen C09 · Supuestos de escenarios (Terra-9)

Astra-5 (auditor independiente) · inicio 22:05:41Z, cierre 2026-11-01T22:18Z (`date -u`). Muestreo con WebFetch entre 22:09Z y 22:13Z.

Versión auditada: `01_base/f2-c09-supuestos/`:

| Archivo | mtime | sha256 (16) |
|---|---|---|
| `parametros.csv` (75 filas) | 22:04:37Z | `3307865a8f352ee8` |
| `supuestos.csv` (12) | 22:04:37Z | `bd6bc0021d25b329` |
| `probabilidades.csv` (28) | 22:04:37Z | `f9f44b384938ec1f` |
| `parametros-sensibilidad-hogares.csv` (75) | 22:04:37Z | `e572ac835ce1374c` |
| `calculos.py` · `notas.md` | 22:04:37Z | |
| `checkpoints.md` | 22:04:44Z | |

Insumos: `series-integradas.csv` (22:01:04Z), los dos `cartera.csv` (21:48Z), `cierre2026.json` (22:01:04Z). Ningún archivo auditado cambió durante la auditoría (hashes iguales a las 22:15Z).

Criterios aplicados: `criterios-fase2.md` §0, C09 y §2, más R-C10-3/-4, R-C05-2, R-C07-1/-4/-5, §F de C06, C02, C03 §E, C04 §C, C01 §C y M3 de C11.

Scripts propios (no escriben en el estudio), en el scratchpad de Astra-5:
- `astra5/audit_c09.py`: recálculo independiente con `scipy.special.gammainc` e integración numérica;
- `astra5/rep/`: réplica para correr `calculos.py` fuera de la carpeta del productor.

El motor lo corrí en memoria, con `python3 -I -B`, sin escribir en `02_cruces`.

**Veredicto: RECHAZADO, con reentrega acotada** (reglas de `calculos.py`; sin datos nuevos).

Lo que está bien:
- la reproducibilidad es exacta;
- la aritmética coincide con mi recálculo en todos los puntos;
- 12 fuentes reabiertas sin discrepancia de transcripción;
- se cumplen R-C10-4, R-C05-2, R-C07-1/-4/-5, el §F de C06 y las exclusiones de C03/C04;
- las probabilidades son monótonas y la meta vale 0.

El rechazo se debe a tres condiciones de C09 y §2.4 que cambian números que entran al motor, y que por eso no califican como menores (§0; mismo criterio que en C01):
1. **R-C09-1.** La cartera Bienestar del base no está calibrada con la única evidencia de su segmento. Ella sola produce la mayor parte del +20.9 % de δs y de la caída de P real de −8.1 % en 2027.
2. **R-C09-2.** El rango de `s_pipeline` sale de otro universo, el DTU total, y se aplica al DTU de mercado.
3. **R-C09-3.** Los extremos de δs (+43.4 % y −29.9 % en un año) y el tope del alto están fuera de lo observado, y la combinación no está justificada.

Además hay dos condiciones de publicación que no cambian números de C09:
- **R-C09-4.** Los nombres «alto» y «bajo» inducen a error sobre P.
- **R-C09-5.** El rótulo del techo debe decir hacia dónde sesga el proxy.

## A. Reproducibilidad y recálculo

**`calculos.py`, dos corridas en la réplica.** Los cuatro CSV quedan con el mismo sha256 entre corridas, y ese sha256 es **idéntico al de los archivos entregados**. El control interno (monotonía y meta = 0) pasa.

**Motor (`escenarios.correr`, en memoria; P real / Q; banda; techo):**

| | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|
| bajo | 240.8 / 3,131 [P 221–320; Q 2,551–3,524] | 271.7 / 2,803 | 278.8 / 2,681 | 275.7 / 2,632 [P 234–487] |
| base | 192.0 / 3,846 **techo** [P 152–203; Q 3,480–3,846] | 197.2 / 3,857 | 202.7 / 3,865 | 207.1 / 3,891 |
| alto | 175.3 / 3,981 **techo** [P 116–197] | 175.1 / 4,077 techo | 177.9 / 4,175 techo | 180.8 / 4,276 techo |

- Los 12 puntos coinciden con la autoverificación del productor.
- δd y δs también coinciden: bajo −4.1 → −2.6 y −29.9 / −25.3 / −8.0 / −0.2; base +2.0 → +2.2 y +20.9 / −3.6 / −3.9 / −2.5; alto +8.6 y +43.4 / +2.6 / 0 / 0.

**Recálculo independiente (`audit_c09.py`).** Todo coincide con lo que entra al motor:
- DTU y verificación por universo: mercado DTU 2020–2025 = 1,177 / 1,824 / 1,450 / 1,576 / 1,805 / 2,279; Popular 625 / 447 / 217 / 128 / 176 / 107; verificación Popular 2025 = 1,384; 2026 acumulado = 2,983 Popular y 1,533 de mercado;
- DTU 2026e = 1,665 ÷ 0.5526 = 3,013, del que 2,933 es de mercado;
- referencia de tubería +5.51 / +0.53 / +0.04 / 0.00;
- piso 1,450 y tope 3,807;
- a_pop = 0.3735;
- entregas Popular del base 80 → 547 → 398 → 261 → 176;
- s_cartera del base +14.57 / −4.14 / −3.92 / −2.52;
- meses de ventas RUV 6.834 / 6.398 / 6.131 (iguales a los de C02) y freno −5.548 %;
- E Sonora 2021→2025 = +1.04 %;
- techo del base 2027 = 3,845.6;
- variaciones de empleo +2.22 / +2.41 / −1.06 / −2.44;
- tasa hipotecaria +11.14 % (2022) y −2.02 % (2025).

**Probabilidades (lectura propia de `probabilidades.csv`):**
- son monótonas por etapa en los cuatro horizontes y en p_base, p_min y p_max;
- min ≤ base ≤ max en las 28 filas;
- meta = 0;
- en_proyecto y anunciada tienen mínimo 0 (§2.5 d).

## B. Muestreo propio (12 fuentes, más de 150 valores; 0 discrepancias de transcripción)

| Fuente reabierta | Visto | Resultado |
|---|---|---|
| SNIIV `GetProduccion/2020,2025/26/030/anio,segmento` (rango distinto al del productor) | 35 filas; por ejemplo, 2020: Popular 17 + 608 y Tradicional 798; 2025: 15 + 92 · 1,527 · 41 · 711 | DM y DP de los 6 años ✔ |
| SNIIV `GetVerificacion/2024,2026/…/anio,segmento` | 2025: 251 + 1,133 Popular, 2,041 / 43 / 1,122; 2026: 2,983 / 896 / 15 / 622 | VP 2025 = 1,384, VM 2025 = 3,206 y 2026 ✔ |
| SNIIV `GetProduccion/2025,2026/…/anio,mes,segmento` (79 filas) | Popular ene–jul 2026: 6 + 8 + 11 + 4 + 5 + 10 + 0 = **44**; mercado ene–jul = 1,621 | ✔ |
| El Imparcial, 7-ago-2026 | Hermosillo 260,693 → 274,098 (+5.14 %); Sonora 649,918 (+2.66 %) | ✔ |
| El Imparcial, 14-nov-2025 | «Sonora cerró con 654 mil 436 **empleos formales**» (oct-2025) | ✔ (la palabra no es «trabajadores»: ver R-C05-4) |
| El Imparcial, 29-ene-2026 | «633 mil 106 trabajadores afiliados al IMSS»; −15,854 | ✔ |
| Banxico, Informe Trimestral abr–jun 2026, cuadro de tasa de vivienda | 9.03 / 9.07 / 10.08 / 10.35 / 10.42 / 10.21; 10.13 / 10.11 / 9.97 / 10.00 | 10/10 ✔ |
| Encuesta Banxico sep-2026 (PDF) | PIB, mediana: 2027 = 1.80 y 2028 = 2.00; fondeo 6.50 / 6.50 | ✔ |
| IDEAS, Fontenla y González (2009) | precio −0.3; «permanent income… elasticity of 0.8»; «mortgage rate elasticity… −0.39» | ✔ |
| El Imparcial, 22-abr-2026 | «está por iniciar… 2 mil 400… CONAVI y 5 mil 634 por el Infonavit»; 3,108; «20 mil» | ✔. No da precio ni segmento |
| El Imparcial, 14-oct-2025 | delegado: «mil 400 viviendas» en Altares; infografía: «1 mil 450… contempladas»; población de 1 a 2 salarios mínimos; sin fecha de entrega | ✔ |
| Econpapers, Caldera y Johansson (2013) | el resumen **no trae** el rango «0.30–2.05» que cita la justificación de e_s | no verificable (R-C09-8) |

## C. Respuestas a los puntos del coordinador

**1. ¿El base 2027 con δs ≈ +21 % es compatible con R-C10-3, con §2.4 y con M3?**

*R-C10-3: sí, en lo formal.*
- Las 12 filas de `s_pipeline` dicen «La tubería no pasó el backtest C10» (`grep` = 12).
- El rango de bajo a alto (−26.6 a +26.0) contiene la variación del DTU total 2021–2025.
- La referencia usa la forma ln(E_t/E_2026) con E_2026 = DTU de 2026, que es la que pide R-C10-3.

*Pero hay dos defectos en la referencia del base.*
- Usa μ = 12 por convención, que es el extremo bajo de la sensibilidad por ventana (12–22). Con el mejor ajuste da otra cosa: con μ = 16, +10.8 % en 2027; con μ = 18.5, +13.5 %, y P 2027 = 182.8. Con cualquier μ falla el signo de 2024: −1.1, −8.4 y −8.9 frente a +14.5 observado.
- El rango sale de otro universo (R-C09-2).

*§2.4: no.* El +20.9 % se descompone así: tubería +5.5 % (referencia no validada) y cartera Bienestar +14.6 %. La cartera:
- **no tiene línea base observada**;
- tiene una conversión de flujo (a_pop = 0.374) que depende de la ventana elegida:

  | a_pop | s_cartera 2027 |
  |---|---|
  | 0.058 (solo 2026) | +2.1 % |
  | 0.374 (base) | +14.6 % |
  | 0.63 (2021–2025) | +17.0 % |

- **falla la calibración contra su propio segmento.** Con el calendario del base, la cohorte Popular verificada en 2025 (1,384 viviendas) habría generado 107 DTU en ene–jul 2026. El RUV registra **44 DTU Popular en ese periodo, sumando todas las cohortes**: 2.4 veces menos.
- además aplica a_pop, que es un cociente DTU(Y)/inicios(Y−1) y por tanto ya contiene el rezago, como fracción final, y le suma un rezago lento. El rezago queda contado dos veces, y la dirección del error es ambigua.

*Lo que significa para P.* El −8.1 % de P real del base en 2027 se debe casi todo a la cartera:

| Variante del base | P real 2027 | Variación |
|---|---|---|
| Tal como se entregó | 192.0 | −8.1 % |
| Sin cartera | 205.7 | −1.5 % |
| Con a_pop = 0.058 | 203.7 | −2.5 % |

En las dos variantes el techo deja de activarse. Como la banda del motor solo recorre elasticidades y arranque, esa incertidumbre **no aparece** en la banda del base (152–203, que excluye el nivel de 2026).

*M3: sí, por construcción.*
- `s_pipeline` excluye todo el segmento Popular (las dos etiquetas del API) y `s_cartera` solo contiene Popular/Bienestar.
- El lote Popular de abr-2026 (1,548 registradas y 2,983 verificadas en 2026) no está en `s_pipeline` y no se cuenta en ninguna parte del motor. CONAVI tampoco. Así se evita el doble conteo sin atribuir el lote a un programa, como pide R-C01-3.
- La frase «incremental sobre pipeline» está en las 12 filas.
- Riesgo residual sin probar: el precio tope de VpB (862,000, SIDOF; C07) equivale a unas 242 UMA mensuales, por encima del límite Popular de 200. Si una parte de Bienestar se registra como «Tradicional», estaría en `s_pipeline` y en `s_cartera` a la vez. La nota de Altares («de uno a dos salarios mínimos») apunta a Popular. Hay que decirlo en la nota.

**2. «Alto» y «bajo».**
- El productor define «extremo conjunto» como *todos los desplazadores del lado que mueve Q*. Es una lectura válida de §2.3, que es ambiguo; la ambigüedad es responsabilidad de Astra.
- Esos escenarios son extremos de **Q**, no de **P**. Lo comprobé con los cruces:
  - demanda alta con oferta baja: P 2030 = **338.7**, +62 % (banda hasta 920);
  - demanda baja con oferta alta: P 2030 = **155.3**, −26 %;
  - los tres escenarios solo cubren 181–276.
- Un lector no técnico leerá «alto» como «mercado al alza» o «precio alto», cuando en ese escenario P real cae 16 % y en el «bajo» sube 32 %. **Los nombres inducen a error** (R-C09-4).

**3. Extremos de δs.**
- Observado en el DTU total 2021–2025: de −26.6 % a +26.0 %; 2026e = +26.3 %.
- El alto de 2027 (+43.4 %) excede en 17 puntos: suma la variación máxima a la entrada de Bienestar.
- El bajo de 2027 (−29.9 %) suma el freno de inventario al peor año observado, y 2027–2028 acumulan −47.7 % en dos años (el peor bienio observado es −25.0 %).
- El tope del alto, 3,807, es el máximo de inicios (2025) por el máximo de un cociente mayor que 1 (2024). No es una conversión ni un nivel observado: está 67 % arriba del DTU de mercado máximo (2,279).
- Cada componente trae justificación; **la combinación no** (C09: rechazo). Ver R-C09-3.

**4. Techo con el proxy de Sonora.**
- El rótulo «proxy estatal» es correcto, pero no basta: el sesgo probable es **a la baja**. Hermosillo creció +5.14 % frente a +2.66 % de Sonora en el 1S2026, y tuvo flujos positivos en 2024–2025 cuando Sonora caía.
- En el base, el techo recorta Q 1 % y P 0.7 %, y **deja de activarse** con g_empleo 2026 = +5.14 %.
- En el alto, la Q de los cuatro años **es** el techo. Sin techo, Q 2027 sube +7.6 % y P +5.0 %; en 2030, Q es de 5,114 en vez de 4,276.
- Es coherente como restricción rotulada. No lo es como afirmación sobre Hermosillo (R-C09-5).

**5. Puntos que el productor pidió reabrir.**
- **Cohorte Popular (44 / 1,384):** confirmada en la fuente. Es justo la prueba que el base no pasa (R-C09-1).
- **DTU de mercado 2026e = 2,933:** aritmética ✔. Con la participación mínima o máxima observada, el DTU total va de 2,674 a 3,589. Ese rango debe declararse, porque fija los niveles a los que se refieren el tope, el piso y la cartera.
- **Meses de inventario 6.13 y freno −5.55 %:** ✔. El freno solo es objetable como apilamiento (R-C09-3).
- **Tope 3,806:** aritmética ✔, concepto ✘ (R-C09-3).
- **E_2025 = 633,106 y techo 3,846:** ✔. El valor es de fuente; la cifra del techo coincide con el motor.

## D. Otros hallazgos
- **Ingreso.** El base usa el PIB agregado como «ingreso real por trabajador» (§2.3). Como el PIB incluye el crecimiento del empleo, cuenta en parte dos veces el margen extensivo: unos 0.46 pp de δd en el base. El bajo usa ITAEE (actividad) y el alto usa salario real (por trabajador): son conceptos distintos entre escenarios (R-C09-7).
- **Calidad.** `g_empleo` 2027–2030 está como `estimado` (12 filas). Es una senda de escenario (mediana, mínimo o máximo aplicados al futuro), así que va como `supuesto`; el precedente es R-C06-3. 2026 puede quedarse como `estimado` (R-C09-6).
- **«Económica» cuenta como mercado.** Es 1 vivienda por año, sin efecto; solo hay que mencionarlo en la nota.
- **Integración adelantada.**
  - `02_cruces/escenarios.py` cambió a las 22:05:50Z: `main()` ahora lee `parametros-sensibilidad-hogares.csv`. `correr()` no cambió.
  - `escenarios.csv` y `escenarios.json` se escribieron a las 22:05:50Z con los insumos de C09 antes de esta auditoría: son **provisionales** (R-C09-9).
  - No escribí nada en `02_cruces`: el `.pyc` conserva el mtime 22:05:50Z.
- **Bien resuelto:**
  - e_ext 1.0 [0.5–1.5] (R-C10-4);
  - tasa como variación relativa, con id canónico `f2-tasa-hipotecaria-mensual` (R-C07-4/-5);
  - bandas de ingreso y tasa tomadas de extremos observados (R-C07-1);
  - empleo con banda que incluye 0 (R-C05-2);
  - hogares solo como sensibilidad, con la ruta EIC al 0.665 %, piso 0.67 y techo CONAPO 3.0–3.1 (C06);
  - fuera: CONAVI, las 3,108, las 320, las metas, 20,861/20,000 y Sello H privada (C03/C04);
  - INFONAVIT solo en la parte vendida;
  - la primera corrida (+137 %) se corrigió con evidencia y quedó documentada en los checkpoints, que van de 21:38Z a 22:04Z y son coherentes con el mtime.

## E. Qué puede afirmar el tablero (hoy, antes de la reentrega)
**Puede afirmar:**
- que hay tres escenarios condicionados a supuestos, no pronósticos;
- que la oferta terminada estimada de 2026 (DTU RUV) ya está alrededor de 26 % arriba de 2025, en un rango de 12–50 % según la estacionalidad;
- que el resultado de P en 2027 depende sobre todo de dos supuestos no validados: cuánto y cuándo entrega Vivienda para el Bienestar, y la tubería, que «no pasó el backtest C10»;
- que el empleo usado es de Sonora;
- que en 2024–2025 el método no superó a la inercia y erró el signo de P.

**No puede afirmar:**
- ninguna cifra de P o Q 2027–2030 mientras no se acepte la reentrega;
- «en el base el precio real baja 8 %»;
- que «alto» o «bajo» acotan P;
- que el techo limita las ventas de Hermosillo;
- que Bienestar entregará una cantidad dada;
- nada de §2.8.

## F. Reinstrucciones

```
R-C09-1 | mayor (valor que entra al motor; §2.4 cartera sin línea base) | responsable: Terra-9
hallazgo:   s_cartera del base (+14.6 % en 2027) no está calibrada: su calendario predice 107 DTU Popular de la cohorte 2025 en ene–jul 2026, contra 44 observados de todas las cohortes; a_pop es un cociente de flujo usado como fracción final, con un rezago lento encima; según la ventana, s_cartera 2027 va de +2.1 % a +17.0 %, y el base queda cerca del extremo alto.
evidencia:  SNIIV GetProduccion anio,mes,segmento (22:10Z): Popular ene–jul 2026 = 44; verificación Popular 2025 = 1,384; audit_c09.py; motor en memoria: P 2027 = 192.0 / 205.7 (sin cartera) / 203.7 (a = 0.058). parametros.csv 22:04:37Z.
corrección: calibrar el calendario Popular para que reproduzca los DTU Popular ene–jul 2026 (±10 %), el mismo principio de R-C10-3 (nivel ajustado = observado en t0), y usar «a» y rezago de forma coherente (fracción final con rezago, o cociente sin rezago, no las dos cosas); o, si no se puede, s_cartera del base = valor que implica la conversión observada 2026, y el rango (bajo/alto) cubre de 0 a la conversión 2021–2025. Regla declarada en checkpoints ANTES de correr el motor; nota con la prueba de calibración y la amplitud del rango; agregar el riesgo «Bienestar sobre 200 UMA ⇒ podría estar en Tradicional (s_pipeline)».
resolución: nota de s_cartera con la cifra de calibración; recálculo del auditor ±0.5 %.

R-C09-2 | mayor (valor que entra al motor; §2.4 «mismo universo») | responsable: Terra-9
hallazgo:   el rango de s_pipeline (−26.6/+26.0) es del DTU total y se aplica al DTU de mercado, cuyo observado 2021–2025 es −20.5/+55.0 (2021 = rebote de 2020); la referencia del base usa μ = 12 (convención), y con μ 16–18.5 daría +10.8/+13.5 %.
evidencia:  SNIIV GetProduccion anio,segmento (22:09Z); audit_c09.py (referencia con μ 12/16/18.5; en muestra 2024: −1.1/−8.4/−8.9 frente a +14.5).
corrección: rango del mismo universo (DTU de mercado 2021–2025; el rebote de 2021 incluido o excluido con razón escrita, la misma regla en bajo y alto); base: referencia con su μ declarado y el resultado para μ 12–18.5 en la nota (y en «qué tendría que pasar»), o 0 = «DTU de mercado sostenido al nivel 2026e», a elección del productor, declarada antes de correr.
resolución: notas con el universo y el rango; recálculo del auditor.

R-C09-3 | mayor (C09: insumo fuera de lo observado sin justificación) | responsable: Terra-9
hallazgo:   δs alto 2027 = +43.4 % y bajo 2027 = −29.9 % (−47.7 % en 2027–2028) frente al observado −26.6/+26.0 (2026e +26.3; peor bienio −25.0 %); tope 3,807 = máx. de inicios 2025 × cociente 1.188 de 2024 (>1, no es conversión), 67 % sobre el DTU de mercado máximo.
evidencia:  motor en memoria (pct_S); audit_c09.py.
corrección: δs total de cada año dentro del observado del DTU total, salvo nota que cuantifique el excedente y la novedad que lo justifica (p. ej. Bienestar, con la cifra); no apilar el freno de inventario sobre el peor año sin justificarlo; tope = nivel observado (máx. 2021–2025 o 2026e con su rango 2,674–3,589) o rotulado «nivel no observado». Declarar el rango del DTU 2026e.
resolución: |δs| ≤ observado o nota con su cuantía; recálculo del auditor.

R-C09-4 | mayor (condición de publicación; no cambia números de C09) | responsable: Sol (panel) + Terra-9 (notas) + Astra (§2.3)
hallazgo:   «alto/bajo» son extremos de Q; P cae 16 % en el alto y sube 32 % en el bajo; los cruces dan P 2030 de 155 a 339 frente a 181–276 de los 3 escenarios.
evidencia:  motor en memoria con demanda y oferta de escenarios cruzados.
corrección: nombres visibles por lo que combinan («más demanda y más oferta», «menos demanda y menos oferta», «base»); P de los escenarios nunca presentado como rango de P; los dos cruces como sensibilidad de P rotulada, o la frase «estos escenarios no acotan el precio».
resolución: grep «escenario alto|escenario bajo» = 0 en index.html sin su descripción; leyenda presente.

R-C09-5 | mayor (rótulo; no cambia números) | responsable: Terra-9 (notas/supuestos) + Sol (panel)
hallazgo:   el techo con el proxy de Sonora probablemente está sesgado a la baja; su activación en el base es marginal y desaparece con el empleo de Hermosillo; en el alto, Q = techo los cuatro años.
evidencia:  El Imparcial 7-ago-2026 (+5.14 % frente a +2.66 %); motor: base con g_empleo 2026 = 5.14 sin techo activo; alto sin techo Q +7.6 % y P +5.0 % (2027).
corrección: rótulo «techo con empleo de Sonora (proxy estatal); sesgo probable a la baja; con el empleo de Hermosillo el techo del base probablemente no se activa»; en el alto: «la Q de este escenario es el techo».
resolución: texto en supuestos.csv, data.json y en el panel.

R-C09-6 | menor | responsable: Terra-9
hallazgo:   g_empleo 2027–2030 con calidad estimado, siendo una senda de escenario.
corrección: calidad supuesto en las 12 filas 2027–2030 (precedente R-C06-3); 2026 sigue como estimado.
resolución: Counter de calidad: g_empleo 2027–2030 = supuesto.

R-C09-7 | menor en cuantía (cambia un número) | responsable: Terra-9
hallazgo:   g_ingreso_real del base = PIB agregado (incluye empleo), usado como ingreso por trabajador (§2.3); bajo y alto mezclan actividad (ITAEE) y salario real.
corrección: base = (1+PIB)/(1+g_empleo) − 1 o justificación escrita; bajo y alto del mismo concepto que la base.
resolución: nota y recálculo.

R-C09-8 | menor | responsable: Astra/Sol (origen: 02_cruces/supuestos.csv)
hallazgo:   «OCDE 0.30–2.05 (Caldera y Johansson 2013)» no aparece en la página citada (el resumen no da rango).
corrección: localizador con cuadro y página del texto, o «rango del texto completo, no verificado».
resolución: justificación de e_s verificable.

R-C09-9 | menor (proceso) | responsable: Sol Integración
hallazgo:   escenarios.csv/.json escritos a las 22:05:50Z con C09 sin auditar; escenarios.py modificado a esa hora (lectura de la sensibilidad de hogares).
corrección: marcar como provisionales; volver a correr tras la reentrega aceptada; nota del cambio en el motor.
resolución: data.json sin escenarios 2027–2030 publicados hasta la aceptación.
```

## Apéndice para Sol · precisiones propuestas a `criterios-fase2.md` (no las escribí allí)

Hallazgo previo: `criterios-fase2.md` (mtime 21:40Z) es anterior a R-C10-3 (21:52Z). Su §2.4 **todavía no** incluye la precisión de C10.

**§2.4 (v2, propuesta):**
- (a) **Tubería.** δs de tubería = ln(E_t/E_t0), con E calibrada de modo que E_t0 = DTU_t0 en el mismo universo. Nunca un nivel ajustado contra uno observado. En 2027–2030, un modelo de rezago solo entra como `supuesto`, rotulado «la tubería no pasó el backtest C10». Su rango debe contener la variación observada del DTU **del mismo universo** que cubre: si la tubería cubre un subconjunto de segmentos, el rango sale de ese subconjunto. Un año de rebote se incluye o se excluye con razón escrita, con la misma regla en los dos extremos.
- (b) **Calendario de cartera.** Todo calendario de entregas de cartera debe reproducir el DTU observado de su segmento al corte (±10 %), o declarar la diferencia. El valor del base no puede pasar de lo que da esa calibración.
- (c) **Suma de componentes.** El δs total de un año queda dentro de la variación observada del DTU total 2021–2025, salvo nota que cuantifique el excedente y la novedad documentada que lo justifica. No se apila un freno sobre el peor año observado sin justificarlo.
- (d) **Topes y pisos de nivel.** Deben ser niveles observados. El producto de extremos de años distintos no es un nivel observado.

**§2.3 (precisión):**
- «Extremo conjunto» = todos los desplazadores del lado que mueve Q en la misma dirección.
- El nombre visible describe la combinación («más demanda y más oferta» / «menos demanda y menos oferta»).
- Estos escenarios no acotan P. Si el panel muestra un rango de P, debe incluir los cruces (demanda alta con oferta baja, y al revés) o decir que no los cubre.

---

## Re-auditoría · reentrega de Terra-13

Astra-5 · inicio 22:33:37Z, cierre 2026-11-01T22:38Z (`date -u`).

Versión re-auditada:
- `01_base/f2-c09-supuestos/`:
  - `calculos.py` y los cuatro CSV: 22:32:28Z;
  - `checkpoints.md`: 22:32:40Z;
  - `notas.md`: 22:32:44Z;
  - sha256: `parametros` a0f1f6c4…, `supuestos` e30af14c…, `probabilidades` 9ac6a0cb…, `sensibilidad` 10b540f8…;
- insumo: `series-integradas.csv`, 22:13:37Z, con la C01 aceptada;
- copia previa: `04_auditoria/c09-antes-reentrega/`, con los mismos hashes que audité.

Motor y panel:
- `02_cruces/escenarios.py`: 22:19:22Z;
- `escenarios.json` y `03_visual/data.json`: 22:33:07Z. El coordinador dice 22:36Z; vale el mtime;
- `03_visual/index.html`: 22:34:40Z, sha256 `b5406ea5…`. Lo releí después de ese cambio.

**Veredicto: ACEPTADO CON CORRECCIONES MENORES.** Las tres causas de rechazo están resueltas con reglas declaradas antes de correr el motor. Quedan dos notas que no cambian ningún número. El motor y `data.json` pueden usar C09.

### 1. Proceso y reproducibilidad
- **Orden temporal.** Las reglas están en el checkpoint de las 22:25:56Z. La implementación es de las 22:30:49Z y el cierre de las 22:32:40Z. El checkpoint dice «sin cambio después de ver resultados», y los resultados aplican esas reglas al pie de la letra, sin ajustes posteriores.
- **`calculos.py`.** Lo corrí dos veces en una réplica del scratchpad (`astra5/rep2`). Los cuatro CSV quedan con el mismo sha256 entre corridas, idéntico al entregado.
- **`escenarios.py` completo.** Lo corrí en la réplica, no en `02_cruces`, dos veces. El `escenarios.json` sale con sha `68dd131b…`, igual al del coordinador.
- **`data.json`.** Sus `filas` son iguales a las del motor.

### 2. Recálculo propio
- **Calibración de la cartera.** Uso las cohortes mensuales de verificación Popular, a mitad de mes, y una gamma con μ = 23 y forma 1.5.
  - Mi `brentq` da **a_c = 0.0950** y reproduce **44.0** DTU en ene–jul 2026, contra 44 observados.
  - Predice 23.9 para 2024 y 21.0 para 2025, contra 176 y 107 observados. El productor lo declara.
  - Las cohortes de 2026 en la fuente son 175 / 156 / 1,552 / 912 / 188 = 2,983 (WebFetch `GetVerificacion/2026,2026/…/anio,mes,segmento`, 22:36Z), y el mercado suma 1,533 ✔.
  - Las entregas de cartera del base son +119.8 / 85.2 / 49.0 / 26.2. El Popular queda en 200 en 2027 y s_cartera en **+3.6 %** ✔.
- **Tubería.**
  - Variación del DTU de mercado 2022–2025: −20.5 / +8.7 / +14.5 / +26.3. La regla de excluir 2021 se aplica igual en los dos extremos ✔.
  - El alto queda en 3,494 / 2,933 − 1 = **+19.1 %** ✔. El piso es 1,450 y el tope 3,494, el máximo del rango de 2026e: los dos son niveles permitidos por v3 d ✔.
- **Ingreso por trabajador.** Base: 1.018 / 1.00578 − 1 = 1.215 % y 1.414 %. Bajo y alto: +0.08 y +4.35, igual a ITAEE ÷ empleo de Sonora ✔.
- **Motor en memoria, P real / Q y techo:**

  | Escenario | 2027 | 2030 | Techo |
  |---|---|---|---|
  | bajo | 232.9 / 3,213 | 277.1 / 2,646 | no |
  | base | 201.9 / 3,752 | 208.9 / 3,856 | no |
  | alto | 181.0 / 3,981 | 189.8 / 4,276 | sí, los cuatro años |

  δs: bajo −24.4, base +9.3, alto +36.7.
- **Cruces, armados con mi propio código** (demanda de un escenario y oferta del otro, con `correr`):
  - presión: 244.3 / 278.4 / 316.8 / **328.7**;
  - alivio: 171.4 / 168.6 / 165.8 / **163.1**;
  - coinciden con `cruces_precio` en los 8 puntos, P_max incluido.
- **`correr()` no cambió.** Los cruces se arman en `main()` con parámetros existentes, sin números nuevos ✔.

### 3. Estado de cada reinstrucción
| R | Estado | Comprobación |
|---|---|---|
| R-C09-1 | **resuelta** | Calibración ±0 %. Ya no se multiplica un cociente por un rezago. El base queda dentro del par: bajo +0.7, base +3.6, alto +14.8. El riesgo de las 200 UMA está en las 12 filas. El base no supera la calibración (v3 b) |
| R-C09-2 | **resuelta** | Universo de mercado; 2021 excluido con la razón escrita. μ = 12 rotulado «convención», con 12/16/18.5 en la nota |
| R-C09-3 | **resuelta, con un excedente anotado** | Bajo y base dentro de −26.6/+26.0. El alto de 2027, +36.7 %, lleva nota con la cuantía (+10.7 pp) y con la novedad comprobable en el RUV: verificación Popular de 1,384 y 2,983 contra un máximo de 904. El tope de 3,806 se retiró. El freno del bajo se apila solo porque −24.4 queda dentro de −26.6. El bienio del bajo (−39.4) está declarado y acotado por el piso observado; v3 c es anual |
| R-C09-4 | **resuelta** | En notas, 50 de 50 filas dicen «más/menos demanda y oferta» y «no acota el precio». En `index.html`: `NOMBRE_ESC` con los nombres completos y botones Menos / Base / Más; la leyenda dice «son extremos de la **cantidad**, no del precio» y explica qué cubre el recuadro; cruces en tabla y marcas; «el rango continúa ↑». `grep "escenario alto\|escenario bajo"` = 0 en html y json |
| R-C09-5 | **resuelta** | En `supuestos.csv`, q_max_hist, e_ref y e_ultimo traen el sesgo. En el panel, `TECHO_PROXY` dice «probablemente lo sesga a la baja… no se activaría» y, en el alto, «la cantidad de todos los años es el propio techo». El base ya no activa el techo |
| R-C09-6 | **resuelta** | g_empleo 2027–2030 es `supuesto` (12 filas) y 2026 es `estimado` (3) |
| R-C09-7 | **resuelta** | Mismo concepto en los tres escenarios |
| R-C09-8 | **resuelta (rótulo)** | La justificación de e_s dice «NO está verificado» |
| R-C09-9 | **resuelta** | La corrida del motor es posterior a la reentrega y reproducible. Nota del cambio en `main()`: cruces armados ahí |
| §2.4/§2.3 | **integradas** | El «Anexo v3» de `criterios-fase2.md` (22:18:59Z) reproduce el apéndice sin cambios |

Sin cambios en el panel: `grep` de números de escenario escritos a mano en `index.html` = 0, y las frases de §2.8 = 0. La única aparición de «pronóstico» en `data.json` es una cita de prensa de CANADEVI dentro de una nota de cartera.

### 4. Correcciones menores (no cambian ningún número; no requieren re-auditoría)
```
R-C09-10 | menor (nota) | responsable: Terra-13
hallazgo:   en los extremos de demanda se combinan empleo e ingreso por trabajador de años distintos; la actividad implícita es (1.0241)(1.0435) − 1 = +6.9 %/año en el alto y −2.4 %/año en el bajo, fuera del ITAEE Sonora observado 2022–2025 (−0.2 a +4.4). El δd resultante (+6.8 / −3.9 %) sí queda dentro del δd implícito 2021–2023 (C10: +25.9 / −6.1 / −8.9).
corrección: una frase en la nota de g_ingreso_real (alto y bajo) con esa cifra y «extremo conjunto: la combinación no se observó».
resolución: grep en parametros.csv.

R-C09-11 | menor (nota) | responsable: Terra-13
hallazgo:   el nivel Popular 2026e (80) se mantiene y la cartera se suma desde el corte; si las cohortes RUV Popular 2025–26 fueran el programa (atribución que R-C01-3 no permite), el calendario calibrado daría 137 entregas Popular en 2027 en vez de 200, y s_cartera ≈ +1.7 % en vez de +3.6 %, todavía dentro del par bajo–alto. El mínimo de la sensibilidad no es +1.9 %: es el bajo, +0.7 %.
corrección: una frase en notas §2 con esa lectura alternativa y su cifra.
resolución: grep en notas.md.
```

### 5. Qué puede afirmar el tablero
**Puede afirmar, con los rótulos ya presentes:**
- tres escenarios y dos cruces condicionados a supuestos, con «no es intervalo de confianza»;
- que «más/menos» son extremos de la cantidad, no del precio, y que el precio lo acotan los cruces;
- que en el base P real cae en 2027 (≈202; rango 186–207) y en 2030 vuelve a ≈209, cerca del cierre de 2026, *condicionado* a una oferta que crece +9 % en 2027 por supuestos no validados por el backtest;
- que el techo usa empleo de Sonora con sesgo probable a la baja, y que en «más demanda y más oferta» la cantidad es el techo;
- que el método no superó a la inercia en 2024–2025 y erró el signo de P.

**No puede afirmar:**
- «pronóstico», «escenario más probable», «el precio bajará o llegará a…»;
- que un programa entregará una cantidad dada;
- que el techo limita las ventas de Hermosillo;
- el rango de P solo con los tres escenarios;
- precisión mayor que Q a múltiplos de 50 y P a 1 punto;
- P en MXN para 2027–2030.

**Alcance de esta aceptación.** Cubre C09 y la comprobación en el código de R-C09-4 y R-C09-5. **No sustituye** las pruebas de C11→C12 que no hice: capturas reales a 390 y 1440 px sin desborde y revisión visual del recuadro y el eje acotado.
