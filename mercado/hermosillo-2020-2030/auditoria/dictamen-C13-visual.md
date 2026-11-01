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
