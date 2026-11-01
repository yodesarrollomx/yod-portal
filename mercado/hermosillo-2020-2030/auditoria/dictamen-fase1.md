# Dictamen Fase 1 — auditoría independiente (Astra)

Hora de cierre: 2026-11-01T19:05Z (`date -u`). Muestreo propio ejecutado entre 18:25Z y 18:58Z con WebFetch (curl bloqueado por el proxy, igual que para los productores). Versión auditada: `01_base/*/series.csv` con fecha de modificación 11:07 (oferta), 11:16 (demanda), 11:19 (precios); `series-integradas.csv` 11:22; `luna-resultado-*.csv` 11:22 y 11:25.

Veredicto en una línea: **oferta APROBADO básico · demanda APROBADO básico · precios RECHAZADO básico (reentrega acotada)**. Ningún valor reabierto difiere del CSV; los problemas son de definición, estructura y cobertura, no de transcripción.

## A. Muestreo propio (valores reabiertos y lo que vi literalmente)

### Oferta (Terra 1) — 12 valores + 2 series completas, 0 discrepancias
| serie · periodo | CSV | Visto en la fuente (literal) |
|---|---|---|
| `prod-dtu-ruv` 2020–2025 | 1802, 2271, 1667, 1704, 1981, 2386 | `GetProduccion/2020,2026/26/030/anio`: `[{"año":2020,"viviendas":1802},…{"año":2025,"viviendas":2386},{"año":2026,"viviendas":1665}]` |
| `reg-ruv` 2020–2025 | 2069, 4080, 2252, 2211, 3045, 5657 | `GetRegistro/…/anio`: idéntico; 2026 = 4064 |
| `inv-ruv` 2024-12 / 2022-12 | 3186 / 7334 | `GetInventario/2024,12/26/030/municipio`: `{"año":0,"municipio":"Hermosillo","viviendas":3186,…}`; 2022,12 → 7334. El periodo solo viene de la URL (año=0), como anotó Luna |
| `inv-ruv-avance` 2026-07 (10 filas) | Sin reporte 2641 … Sin HBT 130 | `GetInventario/2026,7/…/avance_obra`: los 10 objetos coinciden; suma 8,227. 2025-12: suma 5,335, 10/10 coinciden |
| `prod-dtu-ruv-mensual` 2024 y 2025 (24 filas) y `-acum-ene-jul` | 919 (2024-07), 1165 (2025-07) | `GetProduccion/2024,2025/…/anio,mes`: ene–jul 2024 = 919; ene–jul 2025 = 1,165; ene–may 2025 = 104+190+166+219+113 = **792** |
| `costo-ceico-hermosillo-*` 2026-09 | 6.5 / 6.2 / 9.0 / 6.6 | CMIC Tabla 1 "(Periodo septiembre 2025 a septiembre 2026)": `16 Hermosillo, Son. 6.50% 6.2% 9.0% 6.6%` |
| `prod-hcv-canadevi` 2024/2025 | 792 / 2386 | HCV 2026 p. 46: "de acuerdo con estimaciones de CANADEVI, la producción de vivienda en Hermosillo pasó de 792 unidades en 2024 a 2,386 en 2025". Sin nota al pie ni tabla anual |
| `escrit-canadevi-nueva` 2025 | 4808 | El Imparcial 2-oct-2026 (Yesicka Ojeda, 09:50): "durante 2025 se escrituraron alrededor de 9 mil 500 viviendas nuevas en Sonora, de las cuales 4 mil 808 correspondieron a Hermosillo" |
| `escrit-canadevi-acum-2021-jun2026` | 23611 | **La nota dice "De 2021 a junio de 2026 se han construido 23 mil 611 viviendas"**: construidas, no escrituradas (ver H-O-01) |

### Demanda (Terra 2) — 60+ valores, 0 discrepancias
| serie · periodo | CSV | Visto en la fuente |
|---|---|---|
| `creditos-infonavit-nueva` 2020–2025 | 1863, 2521, 2242, 2106, 2553, 3529 | `GetInfonavit/…/anio,linea_credito,modalidad`: `{"linea_credito":"Linea II","año":2025,"modalidad":"Nueva","acciones":3529,"monto":2386835918.849192}` y los demás años idénticos; 2026 = 2375. `creditos-infonavit-usada`: 2515…3161 ✔ |
| `creditos-cnbv-nueva` 2023–2025 | 1666, 1368, 1035 | `GetCNBV/2023,2026/…/anio,linea_credito`: "Adquisición de Vivienda Nueva" 1666/1368/1035; 2026 = 568; monto 2023 = 3516123310.0 ✔ |
| `creditos-fovissste-nueva` 2020–2025 | 296…229 | `GetFOVISSSTE/…`: Adquisición · Vivienda Nueva: 296, 334, 247, 264, 274, 229 ✔ (montos ✔) |
| `financiamientos-sniiv-nueva-total` 2020–2025 | 3621…6636 | `GetFinanciamiento/…/anio,destino_credito`: idéntico; 2026 = 3108 |
| `financ-sniiv-nueva-conavi` 2025; cubo por organismo | 1823 | organismo CONAVI 2025 = 1823; INFONAVIT 2024 = 2526 (vs 2553 en GetInfonavit: contradicción real, <1.1%); BANCA 2022–2025 = 1878/1680/1380/1053 ✔ |
| esquemas INFONAVIT nueva (24 filas) | Cofinavit 226…172; Apoyo 52…261; Infonavit total 18…151 | `GetInfonavit/…/anio,modalidad,esquema`: todos coinciden; Apoyo infonavit monto = 0 |
| `creditos-infonavit-nueva-mensual` 2025 (12) | suma 3529 | mensual 249…348; ene–jul 2025 = 1,912; ene–jul 2024 = 1,355 |
| Censo 2020 | 936263 / 278550 | INEGI "Presentación de resultados Sonora", láminas "Municipios con mayor y menor población" / "…viviendas particulares habitadas". El documento NO da hogares por municipio: HCV llama "hogares" a viviendas habitadas (Terra 2 ya lo anotó) |
| `poblacion-conapo-coespo` 2025 / 2030 | 1028894 / 1099323 | COESPO Hermosillo.pdf, "Estimación de población 2025 a 2040", fuente "Reconstrucción y proyecciones… 1990-2040 (CONAPO)"; solo quinquenal |
| `empleo-imss-hermosillo-stock` | 260693 / 274098 | El Imparcial 7-ago-2026 (Eduardo López): "al sumar 13 mil 405 nuevos puestos de trabajo durante el semestre, pasando de 260 mil 693 a 274 mil 98 trabajadores". El IMSS solo se nombra como fuente del dato estatal |

### Precios-financiamiento (Terra 3) — 20 valores, 0 discrepancias de transcripción
| serie · periodo | CSV | Visto en la fuente |
|---|---|---|
| `precio-shf-var-acum-anual` 2023 (Hmo/Son/Nac) | 13.2 / 12.8 / 10.9 | Boletín SHF 4T2023, Tabla 3 "Son Hermosillo (Son) 13.2%", Tabla 2 "Sonora 12.8%", "Nacional 10.9%"; texto: 4T "apreciación de 10.1%", "en el acumulado anual… 10.9%". **No publica niveles del índice; no separa nueva/usada por municipio** |
| ídem 2022 | 7.7 / 7.5 / 8.9 | Boletín 4T2022: "Son Hermosillo 7.7%", "Sonora 7.5%", "Nacional 8.9%" (nueva 9.9 / usada 8.1 solo nacional) |
| `precio-shf-var-4t-anual` 2025-Q4 Hermosillo | 8.29 (por verificar) | Ficha IIEG 4T2025 p. 4: etiquetas ascendentes y valores descendentes en bloques separados; emparejamiento verificado con 4 anclas del texto (Guadalajara 12.08, Zapopan 11.57, Tlaquepaque 12.49, Tlajomulco 12.95) → "Hermosillo, SON" = **8.29**. Nacional 8.92 |
| ídem 2020-Q4 | 7.9 (por verificar) | Ficha IIEG 4T2020: 30 etiquetas / 30 valores; anclas Tlaquepaque 7.2, Tlajomulco 7.5, Zapopan 7.6 → Hermosillo (etiqueta 20) = **7.9**. Nacional 5.4 |
| 4T2021 Hermosillo | (no hay fila) | Ficha IIEG 4T2021: Hermosillo no está entre los 30 municipios mostrados; nacional 8.5. 4T2022 ficha: tampoco aparece |
| `tasa-hipotecaria-banxico-nuevos` (7 filas) | 9.03 … 10.13 | Cuadro "Tasa de interés anual del crédito a la vivienda": dic-20 9.03 · dic-21 9.07 · dic-22 10.08 · dic-23 10.35 · dic-24 10.42 · dic-25 10.21 · mar-26 10.13. Nota 1/: banca comercial, nueva y usada, ponderada por saldo |
| `fin-sniiv-nueva-monto-medio` 2025 | 836175 | `GetFinanciamiento/2025/…/destino_credito,valor_vivienda`: 5,548,860,419 / 6,636 = 836,175; sin Económica = 1,080,948 |
| `uma-valor-diario` 2020–2026 | 86.88 … 117.31 | INEGI comunicados; además la variación de la UMA reproduce el INPC dic/dic del año previo: 3.15, 7.36, 7.82, 4.66, 4.21, 3.69 (coincide con `inflacion-nacional-dic-dic`) |

Luna: 13/13 (oferta) y 13/13 (demanda) coinciden; sus dos observaciones (año=0 en inventario; "de acuerdo con" vs "Según" en HCV) son correctas y menores.

## B. Coherencia de unidades, cobertura y definiciones
1. Formato: 14 columnas, geografías y calidades dentro de catálogo, periodos bien formados, `fecha_consulta` uniforme en los tres frentes. Precios tiene **16 claves duplicadas** (serie_id + periodo + geografía + segmento) y **7 serie_id con más de una geografía**; oferta y demanda, 0 duplicados.
2. Esa mezcla de geografías rompe la integración: `integrar.py` pivota por serie_id (+segmento) sin geografía, así que `tabla-anual.csv` muestra para `precio-shf-var-acum-anual` 2022 = 8.9 y 2023 = 10.9 (**nacional**, no Hermosillo 7.7/13.2) y `canadevi-hermosillo-escrituradas-anual` 2025 = 9,500 (**Sonora**, no 4,808). Esto llegaría al eje de precio del diagrama.
3. Acciones ≠ viviendas. `GetInfonavit/…/anio,tipo_credito,modalidad` (reabierto hoy) separa Individual / Conyugal / "Unamos Creditos 2". Nueva 2020→2025: Individual 1293, 1687, 1454, 1292, 1257, 1163; Conyugal 202, 256, 174, 202, 420, 552; Unamos 316, 578, 614, 612, 876, 1814. Conyugal y Unamos son dos créditos para una sola vivienda (IDC, 9-dic-2021: "la unión de los créditos de dos trabajadores… nueva o usada"). El monto por acción lo confirma: Individual 866 mil, Conyugal 674 mil, Unamos 555 mil (2025): si fueran una acción por vivienda con dos créditos sumados, serían mayores que el individual, no menores. **En 2025 el 67% de las acciones INFONAVIT de vivienda nueva son de dos por vivienda.** La serie `estimado-compras-nueva-sin-doble-conteo-cofinanciamiento` no está libre de doble conteo.
4. DTU no es "la producción formal": el RUV es obligatorio para vivienda financiada por INFONAVIT/FOVISSSTE/CONAVI (CUV), no para la banca. Con los datos reabiertos: viviendas INFONAVIT (Individual + No disp. + (Conyugal+Unamos)/2) = 1604, 2104, 1848, 1699, 1905, 2346 → **0.89, 0.93, 1.11, 1.00, 0.96, 0.98 veces el DTU** de cada año. El universo RUV cierra casi 1:1 con su propio financiamiento; el "exceso" de créditos sobre DTU es, en esencia, la banca (1,035–1,861/año) financiando vivienda nueva fuera del RUV, más el rezago DTU→venta (ventana de 24 meses). No hay contradicción ni déficit: son universos distintos.
5. Inventario (metodología SNIIV, reabierta): "fotografía mensual de las viviendas registradas y no vendidas"; no vendida = "sin crédito ni subsidio"; "No es posible individualizar los financiamientos con crédito privado"; "No contabiliza la reventa". Por tanto el inventario puede seguir contando viviendas vendidas con banca o de contado (sesgo al alza en Media/Residencial). "HBT" no está definido en glosario, metodología ni página del cubo. Los picos de "Avance 0"/"Sin reporte" (dic-2022: 2,152; jul-2026: 2,641 + 1,055) coinciden con lotes de registro: abr-2026 registró 1,548 viviendas "Popular hasta 200" en un mes (`GetRegistro/2025,2026/…/anio,mes,segmento`), consistente con cartera Bienestar entrando al RUV.
6. Precio: ningún cubo SNIIV trae valor en MXN (solo bandas de segmento); el monto medio de financiamiento no es precio (2025 cae por 1,823 subsidios CONAVI y por los medios créditos de Unamos). Los boletines SHF solo publican variaciones; 2021 y 2024 no existen para Hermosillo en ninguna fuente abierta localizada; 2020 y 2025 solo por emparejamiento de gráficos IIEG.
7. 2026: los tres frentes lo llevan al corte (`2026-07`, `2026-06`, `2026-Q2`) sin filas `2026` de cierre, salvo parámetros anuales legítimos (UMA, tope INFONAVIT). Correcto.
8. Etiquetas menores: CEICO (dato por ciudad) va como `municipio Hermosillo` en oferta y Agua de Hermosillo como `ciudad Hermosillo (ENOE)`; `derrama-canadevi-hermosillo-acum-ene-jun` mezcla `MXN millones` y `MXN`; HCV heredadas duplicadas en oferta y demanda; `fin-sniiv-nueva-acciones` (T3) duplica `financiamientos-sniiv-nueva-total` (T2).

## C. `calidad`
- Bien asignada en lo sustantivo: SNIIV `observado`; HCV, IIEG, COESPO/DataMéxico `declarado`; prensa `prensa`; cálculos `estimado`. Las lecturas vía resumidor no cambian la calidad: las URLs del API son GET públicos y Luna y yo llegamos al número literal.
- Ajustes: (i) `precio-shf-var-4t-anual` 2020-Q4 (7.9) y 2025-Q4 (8.29) pueden pasar a `declarado` con nota "emparejado por posición, anclas: …" (verificado arriba); 2024-Q3, 2025-Q3, 2026-Q1 y 2026-Q2 siguen `por verificar` hasta documentar ≥3 anclas cada uno. (ii) `inflacion-nacional-dic-dic` 2020–2024 puede ser `observado` con los comunicados UMA de INEGI ya citados. (iii) `prod-hcv-canadevi` y `solicitudes-credito-hcv-canadevi` necesitan la nota "no independiente" (ver D1). (iv) `escrit-canadevi-acum-2021-jun2026` está mal definida (construidas), no mal calificada.

## D. Contradicciones: resolución o declaración
1. **HCV "producción 2024 = 792" vs DTU 1,981 — RESUELTA como etiqueta errónea.** 2,386 (HCV 2025) = DTU 2025 exacto; 792 = DTU ene–may 2025 exacto; las semillas HCV 2020–2022 = DTU exactas. La "estimación de CANADEVI" del HCV es el SNIIV reempaquetado y el "2024" es un corte parcial de 2025. HCV no cuenta como fuente independiente ni para producción ni para "solicitudes de crédito" (1,417/3,104: no identificables en SNIIV).
2. **Créditos 4–6 mil vs DTU 1.7–2.4 mil — RESUELTA como universos y unidades distintas** (B3–B4). Se declara en el tablero: Q = viviendas financiadas (deduplicadas), DTU = oferta registrada en RUV. Jamás en la misma barra.
3. **2025: 6,636 acciones vs 4,808 escrituradas CANADEVI** — 6,636 incluye 1,823 subsidios CONAVI cargados en dic-2025 (acciones de programa, no ventas de mercado). Sin CONAVI 4,813 ≈ CANADEVI 4,808 ≈ suma simple de organismos 4,793: la coincidencia sugiere que CANADEVI cita acciones SNIIV (dos por vivienda en Unamos/Conyugal). Queda **declarada**: CANADEVI entra como bigote superior, no como punto, hasta que explique su método.
4. **INFONAVIT 2024: 2,553 (GetInfonavit) vs 2,526 (cubo Financiamiento)**; CNBV y FOVISSSTE ±1% — declarada como ruido de corte; mandan los cubos por organismo.
5. **Inventario dic-2022 = 7,334** (nov 3,987; ene 4,072) — pico de un mes por lote de registro (Avance 0 = 2,152); se grafica el promedio nov–ene con nota, no el cierre.
6. **Sello H 20,861 / 10,824 / 10,500; CONAVI 2,400 en tres etapas; INFONAVIT 2,624 vs 5,634; metas 33.8k/57k/60k/65k** — no son contradicciones sino etapas y fechas distintas: se resuelven con la tabla programa × etapa × fecha (R8); nunca se suman.
7. **SHF 2023: 13.2 (acumulado) vs 14.21 (4T/4T)** — dos medidas; se elige una para toda la serie (R3). **1T2022 Hermosillo = Sonora = 6.2**: no pude reabrir el boletín (client_error); sigue como alerta.
8. **IMSS Hermosillo 1S2026: +13,405 (stock) vs 13,737 "generados"** — dos notas de prensa distintas (7-ago y 10-jul); se usa el stock y se declara.
9. **CANADEVI 23,611 "construidas" 2021–jun 2026 vs DTU 2021–jul 2026 = 11,674** — CANADEVI cuenta el doble que el RUV; sin definición, no se usa.

## E. Decisión final: P y Q del equilibrio 2020–2025 y 2026

**Q (cantidad) — `q-viviendas-financiadas-nueva-dedup` (estimado, municipio, año calendario):**
`Q = [Individual + No disponible + (Conyugal + Unamos Creditos 2)/2]_INFONAVIT nueva − Cofinavit − Apoyo Infonavit − Infonavit total + FOVISSSTE nueva (Adquisición) + CNBV "Adquisición de Vivienda Nueva"`.
Con los valores reabiertos hoy: **2020: 2,942 · 2021: 3,748 · 2022: 3,534 · 2023: 3,093 · 2024: 2,896 · 2025: 3,026** (supuesto explícito: Conyugal y Unamos = dos acciones por vivienda; Infonavit total pareado con banca). Bigote superior = `estimado-creditos-nueva-suma-infonavit-fovissste-cnbv` (3,497 · 4,585 · 4,350 · 4,036 · 4,195 · 4,793); CANADEVI 4,808 (2025) se dibuja como marca `prensa`. Excluidos: CONAVI (bloque aparte "precio administrado"), mejoramiento, suelo, construcción propia, usada. La lectura cambia: el "boom" 2025 de acciones INFONAVIT (+38%) es +23% en viviendas y la Q deduplicada sube solo +4%; eso es lo que debe contar el diagrama.
Desplazadores de oferta (no Q): DTU, registro RUV, inventario HBT (1,286 dic-2024; 1,476 dic-2025; 1,586 jul-2026, con el sesgo de B5), CEICO.

**P (precio) — provisional `p-indice-shf-hermosillo-encadenado` (estimado, 2019 = 100):** nivel_t = nivel_{t−1} × (1 + v_t/100) con v = 2020: 7.9 (IIEG 4T, declarado) · 2021: **hueco** · 2022: 7.7 (observado) · 2023: 13.2 (observado; 14.21 en 4T/4T) · 2024: **hueco** · 2025: 8.29 (IIEG 4T, declarado). Los huecos se rellenan provisionalmente con Sonora (4T2021 de la tabla estatal IIEG; 4T2024 = 11.0 prensa) como `estimado` con banda ±2 pp y texto "proxy estatal"; la mezcla acumulado/4T se declara en la banda. Ancla en MXN: `p-ancla-nueva-hermosillo-1S2026` = 1,206,599 (CANADEVI 1S2026, derrama/unidades, cota inferior, prensa→estimado), con la mediana SHF Sonora 2T26 (1,175,452) como contraste. Deflactor: INPC nacional dic/dic (observado vía comunicados UMA) hasta tener INPC Hermosillo. **Resolución definitiva**: el Excel del Índice SHF con niveles trimestrales 2005–2026 por municipio (base 2017) está en transparencia.shf.gob.mx/SitePages/IndicePV.aspx, bloqueado por robots para las herramientas pero público en navegador: un clic de Alejandro o Sol lo resuelve y elimina huecos, mezcla de medidas y `por verificar`. Monto medio SNIIV y valor RUV quedan descartados como P (no son precio).

**2026 al corte:** Q ene–jul 2026 con la misma fórmula y comparado solo con ene–jul 2025 (INFONAVIT 2,375 vs 1,912; CNBV 568 vs 678; FOVISSSTE 155 vs 129; falta extraer tipo_credito 2026). Cierre estimado = ene–jul ÷ participación histórica de ene–jul (INFONAVIT nueva: 0.53 en 2024, 0.54 en 2025 → rango 0.50–0.58), marcador hueco y banda. P 2026 = 2T2026 (8.93, por verificar hasta anclar). DTU 2026: 1,665 ene–jul; participación histórica 0.46–0.62, banda ancha.

## F. Reinstrucciones (orden de impacto en el diagrama)

```
R1 | bloqueante | responsable: terra-2
hallazgo:   Q cuenta acciones, no viviendas: Conyugal y Unamos Creditos 2 (2 créditos/vivienda) son 28% (2020) a 67% (2025) de INFONAVIT nueva.
evidencia:  GetInfonavit/2020,2026/26/030/anio,tipo_credito,modalidad (reabierto 18:5xZ): Nueva 2025 Individual 1163 / Conyugal 552 / Unamos 1814; monto por acción 866k / 674k / 555k. demanda/series.csv v11:16 no tiene la dimensión tipo_credito.
corrección: agregar series creditos-infonavit-nueva-tipo-{individual,conyugal,unamos,no-disponible} 2020–2026; crear q-viviendas-financiadas-nueva-dedup con la fórmula de §E y nota del supuesto; renombrar estimado-compras-nueva-sin-doble-conteo-cofinanciamiento → …-sin-cofinanciamiento.
resolución: filas con URL+localizador; recálculo del auditor coincide a ±1; nota pide confirmación a INFONAVIT/SNIIV del conteo por participante.

R2 | bloqueante | responsable: terra-3 (serie_id) y Sol Integración (integrar.py)
hallazgo:   tabla-anual.csv entrega al diagrama P nacional (8.9, 10.9) en vez de Hermosillo (7.7, 13.2) y CANADEVI Sonora (9,500) en vez de Hermosillo (4,808).
evidencia:  02_cruces/integrar.py: key = serie_id (+segmento), sin geografía; precios/series.csv v11:19 usa 7 serie_id multi-geografía; 16 claves duplicadas.
corrección: terra-3 separa por sufijo (-sonora, -nacional) como hacen oferta y demanda y da serie_id propio a cada concepto duplicado (prog-*, pronósticos min/max, precio-medio por fórmula); Sol añade geografía a la clave del pivote y valida 0 duplicados.
resolución: tabla-anual 2022 = 7.7, 2023 = 13.2, canadevi 2025 = 4,808; chequeo A del checklist en 0 duplicados.

R3 | bloqueante | responsable: terra-3 + paso humano (Alejandro/Sol)
hallazgo:   No hay niveles ni serie anual completa del índice SHF Hermosillo (faltan 2021 y 2024; 6 filas por verificar en P).
evidencia:  Boletines SHF 2022T4/2023T4 solo variaciones (reabiertos); fichas IIEG 4T2021/4T2022 no listan Hermosillo; transparencia.shf.gob.mx bloqueado por robots (WebFetch 18:4xZ); Alphacast confirma serie trimestral 2005–2026 base 2017 con esa fuente.
corrección: descargar en navegador el Excel del Índice SHF (municipios) a 05_descargas/precios/ y extraer niveles trimestrales Hermosillo 2019Q4–2026Q2 (nueva/usada si existe) → p-shf-indice-nivel; mientras, publicar p-indice-shf-hermosillo-encadenado con 2021 y 2024 como estimado (proxy Sonora, ±2 pp) y nota de mezcla acumulado/4T.
resolución: 6 valores anuales 2020–2025 con URL, 0 por verificar en P; o versión provisional con exactamente 2 filas estimado declaradas.

R4 | mayor | responsable: terra-3
hallazgo:   Valores IIEG emparejados por posición marcados por verificar cuando sí se pueden anclar.
evidencia:  4T2020: anclas Tlaquepaque 7.2 / Tlajomulco 7.5 / Zapopan 7.6 → Hermosillo 7.9; 4T2025: Guadalajara 12.08 / Zapopan 11.57 / Tlaquepaque 12.49 / Tlajomulco 12.95 → Hermosillo 8.29 (reabiertos 18:4xZ).
corrección: pasar 2020-Q4 y 2025-Q4 a declarado con las anclas en nota; para 2024-Q3, 2025-Q3, 2026-Q1, 2026-Q2 documentar ≥3 anclas o dejar por verificar; extraer Sonora 4T2021 de la tabla estatal IIEG.
resolución: cada fila declarado lista sus anclas; sin anclas no cambia la calidad.

R5 | mayor | responsable: terra-1 (y terra-3 por arrastre)
hallazgo:   23,611 "escrituradas" son "construidas" en la nota; 16,833 (2021–2024) y el precio 1,223,428 derivan de esa mezcla.
evidencia:  El Imparcial 2-oct-2026: "De 2021 a junio de 2026 se han construido 23 mil 611 viviendas en Hermosillo" (reabierto 18:3xZ); oferta/series.csv escrit-canadevi-acum-2021-jun2026 y escrit-canadevi-acum-2021-2024; precios precio-medio-canadevi-estimado 1223428.
corrección: renombrar a construidas-canadevi-acum-2021-jun2026; eliminar escrit-canadevi-acum-2021-2024 y la fila 1,223,428; nota: CANADEVI "construidas" = 2× DTU RUV del mismo lapso, definición desconocida.
resolución: ninguna serie mezcla construidas y escrituradas; notas §3/§4 actualizadas.

R6 | mayor | responsable: terra-1 (dueño) y terra-2 (duplicados)
hallazgo:   prod-hcv-canadevi no es fuente independiente; su "2024 = 792" es DTU ene–may 2025.
evidencia:  GetProduccion/2024,2025/…/anio,mes: 104+190+166+219+113 = 792; HCV 2025 = 2,386 = DTU 2025; semillas 2020–2022 = DTU.
corrección: nota "SNIIV reempaquetado; etiqueta 2024 errónea" en prod-hcv-canadevi y solicitudes-credito-hcv-canadevi; cerrar contradicción #1; dejar las 8+5 filas HCV heredadas en un solo frente (demanda) y excluirlas del diagrama.
resolución: notas cerradas; 0 filas HCV en series del diagrama.

R7 | mayor | responsable: terra-2
hallazgo:   Falta el desplazador de demanda principal: puestos IMSS Hermosillo 2019–2025 (solo 2 puntos de prensa 2025–26).
evidencia:  datos.imss.gob.mx error de servidor (checkpoint 17:39Z–18:16Z); DataMéxico y HCV publican la serie municipal (declarado).
corrección: extraer asegurados IMSS Hermosillo dic y promedio anual 2019–2025 de DataMéxico/HCV como declarado; reintentar IMSS para subir a observado.
resolución: ≥1 valor por año 2019–2025, municipio, URL; nota de registro patronal ≠ residencia.

R8 | mayor | responsable: terra-1 (cartera) con terra-3 (topes/reglas)
hallazgo:   La cartera de programas está dispersa en 30+ filas prensa con la misma unidad repetida en etapas distintas.
evidencia:  oferta cartera-conavi-hermosillo (2,400 ×3 etapas), cartera-infonavit-hermosillo (2,624 / 5,634), Sello H (20,861 / 10,824 / 10,500); precios prog-* con 11 claves duplicadas.
corrección: una tabla programa × etapa (anunciada / asignada / en construcción / entregada) × fecha × fuente, municipal, serie_id por programa-etapa; prohibida la suma; metas estatales en frente aparte.
resolución: 0 duplicados; cada programa aparece una vez por etapa; insumo listo para supuestos.csv (probabilidad por etapa).

R9 | mayor | responsable: terra-1
hallazgo:   El inventario no distingue terminada-sin-vender y puede incluir vivienda vendida con banca o de contado; HBT indefinido.
evidencia:  Metodología SNIIV (reabierta 18:5xZ): "No es posible individualizar los financiamientos con crédito privado"; glosario y Cubo/Inventario sin HBT; lotes de registro Popular (abr-2026: 1,548).
corrección: nota en todas las filas inv-ruv*; semáforo con HBT (3 categorías) como proxy "terminada" y banda; marcar dic-2022 y jul-2026 como lotes; pedir a RUV la definición de HBT.
resolución: notas presentes; tablero usa HBT con banda y no el total.

R10 | menor | responsable: terra-3
hallazgo:   INPC nacional 2020–2024 como declarado pudiendo ser observado; INPC Hermosillo 2020–2023 ausente.
evidencia:  Comunicados UMA INEGI ya citados dan la variación anual del INPC de diciembre (3.15…3.69 coincide).
corrección: 5 filas observado con el comunicado correspondiente; INPC Hermosillo vía INEGI/BIE cuando abra; deflactor rotulado "nacional".
resolución: 6 filas observado con URL.

R11 | menor | responsable: terra-2
hallazgo:   Unidad mixta en derrama-canadevi-hermosillo-acum-ene-jun; acumulados con periodo de mes de cierre sin convención en el contrato; 4,808 ≈ 4,813/4,793 sin nota.
corrección: una unidad por serie_id; nota "acumulado desde YYYY-MM"; nota de coincidencia con SNIIV en escrituras-canadevi-hermosillo. Sol decide la convención de acumulados en el contrato.
resolución: chequeo A sin series multi-unidad.

R12 | menor | responsable: terra-1, terra-3
hallazgo:   Geografía de datos por ciudad (CEICO = municipio; Agua = ciudad-ENOE) inconsistente; checkpoints de terra-3 escritos a posteriori (declarado por el propio frente).
corrección: nota "dato por ciudad (CMIC)" en costo-ceico-*; Sol valora añadir `ciudad Hermosillo (otra)` al catálogo; checkpoints en tiempo real en la reentrega.
resolución: notas presentes; checkpoints con horas coherentes con mtime.
```

## G. Veredicto por frente
- **Oferta (Terra 1): APROBADO básico funcional.** 12 valores y 2 series mensuales reabiertas coinciden; calidad correcta; `por verificar` solo fuera del diagrama; 2026 al corte; contradicciones documentadas con ambos valores. No alcanza medio por R5, R8 y R9.
- **Demanda (Terra 2): APROBADO básico funcional.** 60+ valores reabiertos coinciden; los cubos por organismo y mensuales cuadran; buen tratamiento de CONAVI y de "hogares" HCV. No alcanza medio por R1 (la Q que irá al diagrama aún no está construida) y R7.
- **Precios-financiamiento (Terra 3): RECHAZADO básico (reentrega acotada).** La transcripción es buena (20/20 valores reabiertos coinciden), pero: 16 claves duplicadas y 7 serie_id multi-geografía que meten el precio nacional en la tabla anual (R2); P con 6 `por verificar` y sin niveles ni ancla (R3, R4); cartera prog-* duplicada (R8). Con R2 y R4 la reentrega es de horas; R3 depende de un clic humano.
