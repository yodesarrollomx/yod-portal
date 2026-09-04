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
| 1 | **Dominio propio `tableros.yodesarrollo.mx`** no existe en el DNS (bloqueado en cPanel / Miguel Reina). Mientras tanto la casa buena es `yodesarrollomx.github.io`. | abierto | Alejandro + Miguel Reina | `curl` a `https://tableros.yodesarrollo.mx/yod-portal/os/` devolviendo 200 |
| 2 | **CroKiss: el backend sigue con la dirección vieja.** El `Code.gs` del repo ya dice `yodesarrollomx` (commit `6779c77`), pero el Apps Script vivo NO se pudo re-desplegar: ese script no está compartido con la cuenta que opera desde la Mac. | abierto | Alejandro (un clic) | El `/exec` respondiendo con la liga nueva, o el `scriptId` compartido para hacerlo desde aquí |
| 3 | **`yod-obra` no existe en la organización** (`yodesarrollomx.github.io/yod-obra/` → 404). Por eso su documentación sigue nombrando la casa vieja. | abierto | Alejandro | El repo publicado en la org y respondiendo 200 |
| 4 | **El Portero le dice `TA` a dos tableros distintos** (Operación semanal y el track de Casa Alysa) en su `Code.gs`. Riesgo: dar un acceso abre el otro. | abierto | Alejandro (es backend) | El `Code.gs` con códigos separados y la prueba de humo por rol |
| 5 | **`boards` vacío = «todo» en el Portero**, mientras el tablero lo trata como «nada». Una fila de ACCESOS a medio llenar abre de más. | abierto | Alejandro (es backend) | El `Code.gs` tratando vacío como «nada» + prueba con una cuenta de prueba |
| 6 | **La firma en Obra se sigue confiando al cuerpo de la petición.** La pantalla ya exige identidad del canje, el backend no. | abierto | Alejandro (es backend) | El `Code.gs` de obra validando la credencial, no el campo `persona` |
| 7 | **140 hallazgos medio/bajo** del barrido del 2-sep quedaron sin verificar ni ejecutar (los 66 confirmados sí se hicieron). | abierto | Claude, por lotes | Lote verificado + commits + las 3 pantallas auditadas |
| 8 | **Dos restos del barrido sin hacer:** el encabezado pegajoso que se esconde bajo la barra del marco (`SHELL-10`) y el mini-tablero ilegible en iPhone (`TABLERO-48`). | abierto | Claude | Captura en 375 px mostrando el arreglo |
| 10 | **El backend del catálogo se quedó con la dirección vieja.** El 4-sep se corrigieron las 10 filas del Control Maestro (pestaña `Sistemas`) a la casa nueva, pero el Apps Script del portal solo deja pasar URLs que empiecen con `alexpueblag.github.io` (`allowedPublicUrl_`), así que ahora sirve la URL **vacía**. No se rompe nada: el front cae a su destino canónico, que ya es el nuevo. Pero el Sheet dejó de mandar. | abierto | Alejandro (es backend) | El GET del catálogo devolviendo `url` con `yodesarrollomx` |
| 9 | **Repos duplicados vivos.** `alexpueblag/aurum-board` quedó como cascarón de redirección; el trabajo de métricas apuntaba ahí (corregido hoy en `refresh_board.sh`). Falta barrer los demás duplicados. | abierto | Alejandro | Un solo repo vivo por tablero, listado y comprobado |

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
