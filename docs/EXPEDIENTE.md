# Expediente del tablero YOD — el documento que guía

> Este archivo NO cuenta la historia: **conduce el trabajo**. Cada tema abierto vive aquí
> hasta que se cierra con evidencia. Si un tema no está aquí, para el sistema no existe.
> Mecánica copiada del documento del Cuestionario de Experiencia Aurum
> (`~/aurum-experiencia/CLAUDE.md`), que es la que a Alejandro le funciona.

**Última pasada:** 4-sep-2026 · **Quien la corrió:** Claude (sesión «YOD OS a nivel Fable»).

---

## Cómo se usa (la mecánica, en 5 reglas)

1. **Un tema = un renglón** con: qué es, en qué estado está, quién decide, y **qué evidencia
   hace falta para darlo por cerrado**. Sin esa última columna, el tema no se puede cerrar.
2. **Nada se marca cerrado sin evidencia física**: un commit, un código HTTP, una captura de
   pantalla o una línea de log. La narración no cuenta (regla del auditor de pantallas, 29-ago).
3. **Toda decisión se escribe fechada y con autor.** Lo que deja de valer no se borra: se
   ~~tacha~~ y se marca **OBSOLETO desde <fecha>**, para que nadie lo reviva por error.
4. **Lo que no se pudo verificar va a «Por confirmar»**, nunca al cuerpo del documento como
   si fuera cierto. Un dato de relleno que se lee como real ya nos costó caro una vez.
5. **Cada repo del tablero tiene su propio `CLAUDE.md`** con la misma estructura (qué es ·
   reglas inviolables · archivos · arquitectura de datos · decisiones · pendientes). Este
   expediente es el índice que los amarra.

---

## Los tableros y su documento

| Tablero | Repo (org `yodesarrollomx`) | Para qué | Documento |
|---|---|---|---|
| YOD OS | `yod-portal` | la cabina: menú, tablero cenital, embudo, obra | `CLAUDE.md` |
| Sala de Edición | `sala-edicion` | producción diaria: propones, él decide | `CLAUDE.md` |
| Potenciales + Portero | `potenciales-yod` | dónde construir · **la cerradura de todo** | `CLAUDE.md` |
| MOAC / Operación | `board-aurum` | metas, tareas y decisiones de la semana | `CLAUDE.md` |
| Embudo comercial | `aurum-board` | métricas de publicaciones y leads | `CLAUDE.md` |
| Tesorería | `board-flujo-yod` | flujo de efectivo | `CLAUDE.md` |
| Interiores | `interiores-aurum` | Llave Maestra de interiores | `CLAUDE.md` |
| Inversionistas | `yodesarrollo-board` | presentación a inversionistas | `CLAUDE.md` |
| Plan de Potencial | `plan-potencial` | el imán de leads | `CLAUDE.md` |
| Codesarrolladores | `Co-desarrolladores-Yod` | portal de inversionistas | `CLAUDE.md` |
| Alquimia Urbana | `alquimia-urbana` | board grupal PG + Aurum + YoD | `CLAUDE.md` |
| CroKiss | `crokiss` | editor de planos, imán de leads | `CLAUDE.md` |
| Real de Miramar | `real-miramar-board` | tramitología y lotes | pendiente (no hay clon local con git) |
| Obra La Pluma | `obra-board` | cliente EXTERNO, fuera del portal | `CLAUDE.md` |
| Obra San Francisco | `yod-obra` | congelado | `CLAUDE.md` |

**Fuera del tablero a propósito:** *Experiencia Aurum* (`aurum-experiencia`, el Cuestionario de
Arquitectura de Autor). Su casa es `aurumarquitectos.github.io`, no se muda con el tablero y no
se documenta aquí. Decisión de Alejandro, 4-sep-2026.

---

## Temas abiertos (lo que hay que resolver)

| # | Tema | Estado | Quién decide | Evidencia para cerrarlo |
|---|---|---|---|---|
| 1 | ~~**Dominio propio `tableros.yodesarrollo.mx`**~~ **DECIDIDO 4-sep-2026 (Alejandro): se queda así.** La casa buena sigue siendo `yodesarrollomx.github.io` y nadie escribe el dominio propio en el código hasta que exista el DNS. | cerrado | — | — |
| 2 | **CroKiss: el backend sigue con la dirección vieja.** El `Code.gs` del repo ya dice `yodesarrollomx` (commit `6779c77`), pero el Apps Script vivo NO se pudo re-desplegar: ese script no está compartido con la cuenta que opera desde la Mac. | abierto | Alejandro (un clic) | El `/exec` respondiendo con la liga nueva, o el `scriptId` compartido para hacerlo desde aquí |
| 3 | ~~**`yod-obra` no existe en la organización**~~ **DECIDIDO 4-sep-2026 (Alejandro): se queda fuera.** Obra San Francisco no se muda; por eso su documentación nombra la casa vieja a propósito. | cerrado | — | — |
| 4 | ~~**`TA` nombraba dos tableros distintos**~~ **CERRADO 4-sep-2026.** Portero **v47 implementado** (verificado por API: implementación activa = versión 47, 19:08 UTC). Cada track con su código propio (`AL`, `TM`, `TC`); `AL` concedido antes a las 4 cuentas que tenían `TA`. Comprobado en la pantalla de Alejandro: sesión viva, el candado del tablero cenital (que se valida con `track=alysa`) abre, menú completo. | cerrado | — | — |
| 5 | ~~**`boards` vacío abría todo**~~ **CERRADO 4-sep-2026.** Va en la misma v47 implementada: blanco = sin acceso, en `boardPermitido_` y en la copia rápida del canje. Ninguna cuenta activa tiene ese campo vacío. | cerrado | — | — |
| 6 | **La firma en Obra se confía al cuerpo de la petición.** La pantalla ya exige identidad del canje y sin nombre no deja firmar; el backend todavía cree el nombre que le mandan. El cambio está escrito en [`BACKENDS-PENDIENTES.md`](BACKENDS-PENDIENTES.md); **su script no está compartido, así que no puedo pegarlo yo.** | esperando acceso | Alejandro | Una escritura con nombre inventado que quede registrada con el nombre real de la sesión |
| 7 | **140 hallazgos medio/bajo** del barrido del 2-sep quedaron sin verificar ni ejecutar (los 66 confirmados sí se hicieron). | abierto | Claude, por lotes | Lote verificado + commits + las 3 pantallas auditadas |
| 8 | ~~**Dos restos del barrido sin hacer**~~ **CERRADO 4-sep-2026.** `TABLERO-48`: el lienzo del tablero ya pasea en horizontal a 375 px en vez de encogerse (media query de 560 px en `tablero.html`). `SHELL-10`: los encabezados pegajosos de los tableros arrancan bajo la barra del marco (`os/shell.css`). Verificado en vivo en el Embudo comercial dentro del marco: tras bajar 800 px, su barra de pestañas queda en y=64, justo debajo de la del marco, completa. | cerrado | — | — |
| 9 | **Repos duplicados vivos.** `alexpueblag/aurum-board` quedó como cascarón de redirección; el trabajo de métricas apuntaba ahí (corregido hoy en `refresh_board.sh`). Falta barrer los demás duplicados. | abierto | Alejandro | Un solo repo vivo por tablero, listado y comprobado |
| 10 | **El backend del catálogo se quedó con la dirección vieja.** Sustitución de texto escrita en [`BACKENDS-PENDIENTES.md`](BACKENDS-PENDIENTES.md). El 4-sep se corrigieron las 10 filas del Control Maestro (pestaña `Sistemas`) a la casa nueva, pero el Apps Script del portal solo deja pasar URLs que empiecen con `alexpueblag.github.io` (`allowedPublicUrl_`), así que ahora sirve la URL **vacía**. No se rompe nada: el front cae a su destino canónico, que ya es el nuevo. Pero el Sheet dejó de mandar. | abierto | Alejandro (es backend) | El GET del catálogo devolviendo `url` con `yodesarrollomx` |
| 11 | ~~**La Sala arranca en «editor» para quien no ha entrado**~~ **DECIDIDO 4-sep-2026 (Alejandro): se queda.** El acceso ya lo filtra YOD OS: quien no tenga la Sala seleccionada en sus accesos no la ve. | cerrado | — | — |
| 12 | **El catálogo no logra autenticar: su comprobación de credencial tarda 60–86 s.** Medido en el registro de ejecuciones del propio Apps Script (4-sep, 12:12–12:14): `credencialValida_` llama al Portero desde el servidor y esas corridas duran 62.4 s, 73.4 s y 86.6 s, mientras el navegador se rinde a los 25 s; un rechazo se cachea 60 s. Resultado: el menú se caía a los 2 tableros públicos con la sesión abierta. **El front ya no se deja:** si el catálogo llega más corto teniendo sesión, se pinta el mejor conocido (el último bueno, o una lista de respaldo curada con los mismos títulos del Sheet) y lo dice en la barra. Falta arreglarlo del lado del servidor: darle tiempo límite a esa llamada y no cachear el rechazo. | abierto | Alejandro (es backend) | El catálogo devolviendo los 8 tableros con credencial, en menos de 10 s |

| 13 | **La Sala puede firmar como Alejandro una decisión de Sayri.** La Sala usa dos definiciones de «quién soy»: para saber qué firmas son tuyas lee el nombre que manda el Sheet, pero para decidir usa el rol guardado en el teléfono, y si ese rol se pierde el valor por omisión es «editor» → firma «Alejandro». Cazado por el revisor de contradicciones el 4-sep. **No lo toqué**: cambiar ROL() o los nombres del código altera quién puede decidir, y eso lo decides tú. | abierto | Alejandro | Que el Sheet mande el nombre junto con el rol, y que la firma salga de ahí |

---

## Decisiones (fechadas, con autor)

- **4-sep-2026 · Alejandro:** todo el tablero YOD se escribe con la dirección nueva
  (`yodesarrollomx.github.io`), **menos Experiencia Aurum**, que vive fuera del OS.
  Hecho ese día: 9 celdas del Sheet del sitio (pestaña `WEBPAGE`), el portero de Real de
  Miramar y de Obra La Pluma, el `SITE_BASE` de CroKiss, la liga mágica de la Sala y la
  documentación de 5 repos. Comprobado: 0 ligas viejas en las 11 pestañas del Sheet.
- **4-sep-2026 · Alejandro:** el tablero adopta **la mecánica del documento del Cuestionario**:
  un `CLAUDE.md` que guía y documenta en cada repo, más este expediente como índice.
- **4-sep-2026 · Claude (hallazgo):** el trabajo que refresca las métricas empujaba al
  cascarón (`alexpueblag/aurum-board`) mientras el menú del OS abre el de la organización.
  Llevaban sin verse los refrescos locales. Corregido en `~/yod_audit/refresh_board.sh`.
- **4-sep-2026 · Claude (la mecánica funcionando en los dos sentidos):** dos críticos revisaron a
  mano los 14 documentos escritos ese día y cazaron **50 afirmaciones sin prueba, 11 graves** — la
  peor, que el documento de MOAC describía archivos que no existen en su clon (esa carpeta está en
  la rama del cascarón de redirección; el código vivo está en el repo de la organización). Todas
  corregidas, **y dos veces el documento tenía razón y el crítico no**: se comprobó con `grep` y no
  se tocó. Regla que salió de ahí: **citar por nombre de función o constante, nunca por número de
  línea ni por conteo** — eso envejece en el siguiente commit.
- **4-sep-2026 · Claude:** un tercer revisor cazó **10 contradicciones que se ven de una sola
  mirada**. Arregladas: el tablero se llamaba de tres formas (ahora se llama como lo llama el
  Sheet), el dinero era «Flujo» en el menú y «Tesorería» en la tarjeta de al lado, el pie prometía
  ficha en canicas que no la abren, y explicaba los hexágonos con dos colores cuando el tablero
  muestra cuatro. El pie ya no nombra a nadie en la cadena de firmas: manda a la hoja de roles.
- **2-sep-2026 · Alejandro:** el análisis y la estrategia los lleva el modelo grande; la
  ejecución va en órdenes cerradas por grupos de archivos que no se pisan. Así cupo el
  trabajo dentro de los límites de una sesión.
- **1-sep-2026 · Alejandro:** los tableros se mudan a la organización `yodesarrollomx`;
  la cuenta personal queda de bóveda y su dirección reenvía.
- **29-ago-2026 · Alejandro (regla permanente):** nada se reporta hecho sin abrir la pantalla
  y verificarlo. La evidencia que él acepta es física.
- ~~Los tableros viven en `alexpueblag.github.io`~~ **OBSOLETO desde 1-sep-2026.**
- ~~El dominio propio `tableros.yodesarrollo.mx` ya es la dirección canónica~~
  **OBSOLETO hasta que el DNS exista** (tema 1). Escribirlo hoy en el código rompe ligas.

---

## Por confirmar

- Si `real-miramar-board` tiene un clon con git en alguna otra máquina: en esta el folder es
  una copia sin `.git`, así que lo que se edite ahí **no llega a producción**.
- Qué otros repos duplicados siguen vivos además de `aurum-board` (tema 9).
- ~~Si la puerta vieja conserva el `#` de las ligas mágicas~~ **RESUELTO 4-sep-2026.** Sí lo
  conserva, y además rescata las llaves guardadas en el origen viejo: la función `yodPuente`
  del cascarón reenvía con `location.replace` copiando `search` + `hash` y, si el navegador
  guardaba `sala_gas`/`sala_clave`, las agrega al fragmento (código descargado y leído ese
  día). El `<meta refresh>` que sí perdería el `#` solo entra si no hay JavaScript, y sin
  JavaScript ningún tablero funciona. **No hay que hacer nada.**
