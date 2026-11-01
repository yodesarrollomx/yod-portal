# Dictamen C13 · Revisión visual del panel (capturas reales)

Astra-5 · inicio 22:41:08Z, cierre 2026-11-01T22:47Z (`date -u`; index.html y data.json sin cambio durante la revisión).

## Versión revisada

| Archivo | mtime | sha256 |
|---|---|---|
| `03_visual/index.html` | 22:39:32Z | `1364f17b…` |
| `03_visual/data.json` | 22:40:20Z | `048af1b8…` |
| `02_cruces/escenarios.json` | 22:40:20Z | `adf3b80d…` |

- **Capturas.** 18 PNG en `scratchpad/c13/`, con mtime de 22:40:22Z a 22:40:40Z. El coordinador dice 22:44Z; vale el mtime. Las 18 son posteriores a `data.json`.
- **Re-corrida tras R-C09-10/11.** Comparé contra mi réplica de la versión re-auditada:
  - los valores de `parametros`, `sensibilidad-hogares` y `supuestos` son iguales;
  - solo cambiaron 8 notas en cada uno de los dos CSV de parámetros;
  - los números de `escenarios.json` (filas, cruces y sensibilidad) son iguales;
  - las `filas` de `data.json` son iguales a las del motor.

**Veredicto: RECHAZADO, con reentrega de minutos.** Las correcciones son de código; ninguna cambia datos.

Las cifras de las tablas y las tarjetas coinciden con el motor, y los rótulos de R-C09-4/-5 y de C10 están. Pero hay dos defectos que hacen que el panel **muestre números equivocados**, así que no califican como menores:

1. **R-C13-1.** La gráfica puede dibujar el punto de otro escenario bajo la etiqueta del escenario elegido. Le pasó a la propia captura `2030-menos`, en los dos tamaños, y lo reproduje.
2. **R-C13-2.** En la vista nominal, los desplazamientos y la «lectura robusta» se calculan con P nominal. §2.2 lo prohíbe, y C12 lo lista como causa de rechazo: «P nominal y real mezclados».

## A. Lo que está bien (comprobado en las 18 capturas y en el código)

- **Sin desborde de página.** Ninguna captura muestra desborde, y el script del coordinador reporta scrollWidth ≤ ancho. Las tablas se desplazan dentro de `.scroll`; ver R-C13-3.
- **Cifras de la tabla de escenarios (1440) iguales a mi corrida del motor** (redondeo §2.7):
  - menos: 3,200 [2,700–3,550] / 233 [217–291] … 2,650 [1,850–3,300] / 277 [235–493];
  - base: 3,750 / 202 [186–207] … 3,850 / 209 [191–217];
  - más: 4,000 [3,600–4,000] / 181 [127–200] … 4,300 / 190 [135–205];
  - cruces: 244 [222–334] … 329 [252–829] y 171 … 163 [93–190], con las Q correspondientes.
- **Tarjeta de 2030 menos:** 277, 2,650, D −2.4 %, S −1.5 %, ✔.
- **Nombres y leyendas (R-C09-4):**
  - botones Menos / Base / Más y la leyenda «extremos de la **cantidad**, no del precio»;
  - en la tarjeta: «Este escenario es un extremo de la cantidad, no del precio» y «el precio real de 2030 iría de ≈163 a ≈329»;
  - marcas de los cruces y aviso «el rango continúa ↑»;
  - `grep "escenario alto|escenario bajo"` = 0.
- **Techo (R-C09-5):** la línea «techo de absorción» y el texto `TECHO_PROXY` (sesgo a la baja; «propio techo» en el alto) están en el código. En las capturas se ve la línea.
- **Prueba del método (C10 §D):** el titular «no superó a la inercia» y las cinco frases, en el panel y dentro de la tarjeta del escenario.
- **2026:** se presenta como «cierre estimado; todavía no es un año completo». En la vista nominal, 2027–2030 y el selector de escenarios quedan deshabilitados, con «sólo se dibujan en precio real».
- **Revisión de texto en `index.html`:**
  - 0 números de escenario escritos a mano; todo sale de `data.json` vía `filaEsc`/`filaCruce`;
  - las frases de §2.8 (déficit, «entregarán», «causará», «qué va a pasar») solo aparecen dentro de «Lo que este tablero no puede afirmar», como prohibiciones;
  - «pronóstico» no aparece en el html. En `data.json` sale una vez, como cita de prensa de CANADEVI.

## B. Defectos

**1. Carrera entre el cambio de año y el de escenario (R-C13-1).**
- **Qué se ve.** En `390-2030-menos.png` y `1440-2030-menos.png`, el punto y las curvas en negrita están en Q ≈ 4,280 y P ≈ 190, que es «más» 2030, pero llevan la etiqueta «2030 · menos». El círculo hueco «más» cae encima del punto principal. La tarjeta, en cambio, dice bien 277 / 2,650.
- **Causa.** En `irA()`, la rama sin animación (`if(!animar || !origen){ render(destino); tween=null; return; }`) no cancela el `requestAnimationFrame` pendiente de la animación de año. Ese cuadro sigue interpolando hacia el destino anterior (más 2030) y lo pinta con la etiqueta del escenario global nuevo.
- **Reproducción** (headless sobre una **copia** en el scratchpad, `astra5/race_test.py`):
  - con 50 ms entre «2030» y «Menos», el punto queda en la posición de «más» (242.3, 221.8);
  - con 1,000 ms, queda en (135.7, 128.0), que es lo correcto;
  - con `cancelAnimationFrame(tween && tween.raf)` en esa rama, sale (135.7, 128.0) con las dos esperas;
  - 0 errores de página.
- Cualquier usuario que toque un año y enseguida un escenario ve un equilibrio falso que no se corrige hasta la siguiente interacción.

**2. Desplazamientos en nominal (R-C13-2).**
- `celdasMovimiento()` usa `p.P` del modo activo. En `1440-nominal.png`, el movimiento 2025 → cierre 2026 dice «Demanda se desplazó +26.9 %» y «Oferta +4.5 %». En real (`data.json`) es **+23.6 %** y **+10.5 %**: la oferta cambia 2.3 veces según el botón.
- `lecturaRobusta()` también usa ese ΔlnP. En 2022, ΔlnP real = −0.002 («casi estables»), pero el nominal es +0.074, así que la vista nominal afirma «la oferta se movió a la izquierda (**robusto**)», algo que el dato real no sostiene.
- §2.2 dice: «P real en desplazamientos… Nominal solo para mostrar».

**3. Tablas a 390 px (R-C13-3).**
- En `390-seccion-escenarios.png`, la columna de etiquetas ocupa el ancho y las cifras quedan cortadas en el borde: «3», «2,700–3», «217», «186-». No hay ninguna señal de que la tabla se desplace (la barra está oculta en iOS).
- En `390-seccion-prueba.png` no se ven las columnas «Inercia», «Error inercia %» ni «Dentro del rango», justo las que sostienen el titular «no superó a la inercia».

**4. Menores de lectura** (no cambian cifras):
- **(a) Etiquetas encimadas.** «el rango continúa ↑» se monta con «techo de absorción» en 2030-menos (los dos tamaños: «el rango contlecho de absorción»). Las etiquetas del rastro chocan con los marcadores en los años de escenario: «○más» con «2029», «cruce ↓» con «2021», y «2026» queda tapado por el punto de 2027.
- **(b) Separador decimal mezclado.** `pct`/`pctN` usan coma decimal («−2,4%», «+12,4%»), mientras `fmt` (es-MX) usa punto decimal y coma de miles («2,650», «208.8», «+1.4 %»). En la misma tarjeta, «2,650» y «−2,4%» se leen con reglas opuestas.
- **(c) Precisión falsa en la prueba del método.** Aparecen «2,896.000», «2,916.399», «187.905» y «−5.902». Además, el mismo cierre aparece como «≈3,610» y como «3,609».

## C. Reinstrucciones

```
R-C13-1 | mayor (cifra mostrada equivocada) | responsable: Sol (index.html)
hallazgo:   cambiar de escenario durante la animación de año deja dibujado el equilibrio del escenario anterior con la etiqueta del nuevo.
evidencia:  390-2030-menos.png y 1440-2030-menos.png (22:40:26Z / 22:40:36Z); race_test.py: 50 ms → punto = «más» (242.3, 221.8); 1,000 ms → (135.7, 128.0).
corrección: en irA(), cancelAnimationFrame(tween && tween.raf) antes de render(destino) en la rama sin animación (probado en copia: corrige); o recalcular destino dentro de step con el escenario vigente.
resolución: la prueba de 50 ms da el punto de «menos» (o el escenario pulsado); recaptura de 2030-menos en 390 y 1440.

R-C13-2 | mayor (§2.2; C12: P nominal y real mezclados) | responsable: Sol (index.html)
hallazgo:   en la vista nominal, «Demanda/Oferta se desplazó» y la lectura «robusto» se calculan con P nominal.
evidencia:  1440-nominal.png: +26.9 % / +4.5 % (real: +23.6 % / +10.5 %); 2022: ΔlnP real −0.002 frente a nominal +0.074 → «robusto» solo en nominal.
corrección: desplazamientos y lecturaRobusta siempre con P real (mostrar P nominal solo como cifra), o en nominal ocultar esas celdas con «los desplazamientos se miden en precio real; cambia a Real»; si las curvas se dibujan en nominal, nota «ilustrativas».
resolución: en nominal, las celdas de desplazamiento coinciden con las de real o no aparecen; recaptura de nominal en 390 y 1440.

R-C13-3 | mayor de presentación (no cambia cifras) | responsable: Sol
hallazgo:   a 390 px, las tablas de escenarios y de la prueba muestran cifras cortadas y ocultan las columnas de la inercia, sin señal de desplazamiento.
evidencia:  390-seccion-escenarios.png («3», «217», «186-»); 390-seccion-prueba.png (sin Inercia/Error inercia/Dentro del rango).
corrección: a ≤ 480 px, tabla traspuesta (años en filas) o etiqueta en una fila propia sobre las cifras; o primera columna fija y angosta con indicador visible de desplazamiento; en la prueba, mostrar Error método y Error inercia juntos sin desplazar.
resolución: capturas a 390 donde se lean completas las cifras de 2027 a 2030 y las dos columnas de error.

R-C13-4 | menor | responsable: Sol
hallazgo:   etiquetas encimadas, separador decimal mezclado, precisión falsa en la prueba y redondeo dispar del cierre.
evidencia:  §B.4 (a)–(c).
corrección: (a) separar «el rango continúa ↑» de «techo de absorción» (otra altura o el otro lado) y ocultar las etiquetas del rastro que chocan en los años de escenario; (b) un solo formato es-MX (punto decimal) en pct/pctN; (c) en la prueba, Q entero, P y % con 1 decimal; el cierre con la misma regla en todas las tarjetas.
resolución: recaptura de 2027-base y 2030-menos; grep de «replace('.',',')» = 0.
```

**Protocolo de recaptura.** Además de los 18 estados, hay que capturar uno que toque un año y un escenario con menos de 100 ms entre los dos. Hace falta el mtime de cada PNG y el sha256 del `index.html` capturado.

## D. Qué puede publicarse

Hoy no, hasta resolver R-C13-1 a -3. Los datos (`data.json` adf3b80d…/048af1b8…) no tienen que cambiar: la reentrega es solo de `index.html` y de las capturas. Una vez corregido, el contenido aceptado en C09 (§E de la re-auditoría) puede publicarse tal cual. R-C13-4 puede quedar pendiente si Sol lo decide, porque no cambia cifras.

## Re-auditoría

Astra-6 · inicio 2026-11-01T22:49:22Z, cierre 2026-11-01T22:56:22Z (`date -u`). Ningún archivo cambió durante la revisión.

**Versión revisada.**

| Archivo | mtime | sha256 |
|---|---|---|
| `03_visual/index.html` | 22:48:18Z | `3285691b…` |
| `03_visual/data.json` | 22:40:20Z | `048af1b8…` (igual al revisado arriba) |
| `02_cruces/escenarios.json` | 22:40:20Z | `adf3b80d…` (igual) |

Las 18 capturas de `scratchpad/c13/` tienen mtime de 22:48:30Z a 22:48:48Z, después del `index.html` corregido. Mis pruebas (Playwright, sin POST, servidor local de solo lectura) están en `scratchpad/astra6/` (`reaudit.js`, `errores.js` y 13 PNG). Hubo 0 errores de página.

**Veredicto: CON CORRECCIONES MENORES. Puede publicarse.** R-C13-1, -2 y -3 están resueltas. De R-C13-4 se aplicaron (b), (c) y la primera mitad de (a); queda la segunda mitad de (a), que es cosmética. Ninguna cifra cambió: los datos tienen el mismo hash y las cifras de las capturas son las de §A (2030 menos: 277 [235–493] / 2,650 [1,850–3,300], D −2.4 %, S −1.5 %, cruces ≈163 a ≈329).

**R-C13-1 · resuelta.**
- **Código.** La rama sin animación de `irA()` llama a `cancelAnimationFrame(tween.raf)` antes de `render(destino)`.
- **Capturas.** `390-2030-menos` y `1440-2030-menos` muestran el punto en ≈2,650 / 277 con la etiqueta «2030 · menos», y los huecos «base» y «más» en su sitio.
- **Prueba propia.** Del clic de año al de escenario: 0, 10, 40, 100, 250, 450 y 640 ms, más 1,000 ms de control, a 390 y a 1440. Las 16 corridas dan (135.72, 128.00) «2030 · menos», igual al valor correcto del dictamen.
- **Carrera año → Nominal.** Con 30 ms entre clics, el punto es igual al del clic lento.

**R-C13-2 · resuelta.**
- `celdasMovimiento()` toma ΔlnP de `precioReal()`, y `lecturaRobusta()` recibe ese ΔlnP. La celda de precio sigue mostrando el % nominal, solo como cifra.
- **Real frente a nominal, 2021–2026, en los dos tamaños.** D y S coinciden en todos los años; por ejemplo, 2026 da +23.6 % / +10.5 % en las dos vistas.
- **Lectura.** Es idéntica en las dos vistas. En 2022 nominal dice «casi estables», ya no «robusto».
- **Nota.** «se calculan con el precio real» aparece solo en nominal (`1440-nominal.png` y `astra6/390-nominal-2026-tarjeta.png`).
- *Observación, sin reinstrucción:* las curvas siguen dibujándose en nominal sin la nota «ilustrativas». Esa nota era opcional en la corrección, y el criterio de resolución (celdas iguales a las de real) se cumple.

**R-C13-3 · resuelta** con la opción «primera columna fija y angosta + indicador».
- **Columna fija.** A 390 mide 118 px y el área desplazable visible, 210 px. Al desplazar, la columna sigue a 0 px del borde.
- **Aviso.** «Desliza la tabla →» se ve a 390 y está oculto a 1440.
- **Escenarios.** Cada columna de año mide ≤ 84 px. Desplazada, la tabla muestra completas 2028–2030 con sus etiquetas (`astra6/390-escenarios-desplazada.png`).
- **Prueba del método.** Las dos columnas de error, con «Inercia» en medio, necesitan 187 px de los 210 disponibles. Con un solo deslizamiento se leen juntas: −5.9 % / −3.0 %, −11.1 % / −5.4 %, 0.7 % / 6.8 % y −9.1 % / 2.2 % (`astra6/390-prueba-dos-errores.png`). No es «sin desplazar», como pedía la corrección, pero cumple el criterio de resolución.
- **Desborde.** No hay desborde de página: scrollWidth = ancho de la ventana en los dos tamaños.

**R-C13-4 · aplicada en parte (menor).**
- **(b)** `pct` y `pctN` usan `toFixed(1)`, con punto decimal. `grep "replace('.',',')"` = 0.
- **(c)** En la prueba: Q entero (2,896 / 2,916), P con 1 decimal y % con 1 decimal en las columnas de error. El cierre sale «≈3,610» en la tarjeta, en el movimiento, en escenarios y en la tabla.
- **(a), primera mitad: hecha.** En 2028 y 2030 «más», que son los únicos estados con las dos etiquetas, «techo de absorción» queda en y 22–34 y «el rango continúa ↑», en y 36–48: ya no se enciman.
- **(a), segunda mitad: pendiente.** Las etiquetas del rastro siguen chocando con los marcadores de escenario: «2029» sobre «○más» y «2026» tapado en `390-2027-base`; «cruce ↓» sobre «2022» o «2021» en 2027 y 2030.

**Grep propio de `index.html`.**
- **Números tecleados.** Solo hay años, constantes de geometría y animación, umbrales (0.005), los valores iniciales ed=0.7 y es=1.5 (iguales al `base` de `supuestos`) y el texto de la base del índice («2017 = 100», «100.00»), que C08 ya validó. No hay ninguna cifra de escenario, cierre ni prueba.
- **Frases de §2.8.** «déficit», «superávit», «entregarán», «qué va a pasar» y «causará» aparecen solo en las líneas 216–223, dentro de «Lo que este tablero no puede afirmar», como prohibiciones. «pronóstico», «se venderán», «llegará a», «más probable» y «escenario alto/bajo» dan 0. En los textos que el panel toma de `data.json` (`escenarios`, `backtest` y `meta`), las búsquedas dan 0.

**Pendiente (no impide publicar):**

```
R-C13-5 | menor (presentación; no cambia cifras) | responsable: Sol
hallazgo:   (1) las etiquetas del rastro chocan con los marcadores de escenario («2029»/«○más», «cruce ↓»/«2022», «2026» bajo el punto de 2027); (2) el bigote de precio del punto sale del área de la gráfica cuando Pmax > dom.Pmax (2030 menos: 493) y cruza el título del eje y «el rango continúa ↑».
evidencia:  390-2027-base.png, 1440-2027-mas.png, 390-2030-menos.png, 1440-2030-menos.png.
corrección: (1) meter en `puestas` las cajas de las etiquetas de `pto-otro` y del punto de cruce antes de colocar las del rastro; (2) recortar y2 a sy(min(cur.Pmax, dom.Pmax)), porque «continúa ↑» ya avisa.
resolución: recaptura de 2027-base y 2030-menos sin textos encimados.
```

Cosmético, opcional: el % lleva espacio en unos textos («+1.4 %») y no en otros («+12.4%»).
