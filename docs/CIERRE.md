# Cierre de YOD OS

> Este documento conduce el cierre: qué está abierto, quién lo destraba y qué evidencia lo cierra.
> Sustituye como tablero vivo a `EXPEDIENTE.md`, que queda como historia del 4-sep-2026.

**Última pasada:** 11-nov-2026 · Claude, a petición de Dirección.

## Cómo se usa

1. **Una pasada por semana.** Se corre `node scripts/cierre.cjs`, se revisan las tres listas de abajo y se actualiza la fecha.
2. **Tope de trabajo abierto.** Un componente con más de 3 cambios «hechos sin acreditar publicación» no recibe cambios nuevos hasta bajar de ahí, salvo defecto reproducido o instrucción de Dirección.
3. **Nada se cierra sin evidencia:** commit, respuesta HTTP, versión activa leída o captura. «Publicado» exige haber leído lo que sirve Pages o la versión activa del motor; «verificado» exige además el recorrido real.
4. **Lo que no se pudo comprobar se dice así.** No se mueve de columna por inferencia.

## 1 · Ventanilla de Dirección (lo que sólo destraba Alejandro)

Ordenado por la prioridad acordada: vender más, luego margen y control, luego cobro. La seguridad no espera turno.

| # | Qué | Estado al 11-nov-2026 | Lo que toca hacer | Evidencia de cierre |
|---|---|---|---|---|
| 1 | Decidir las propuestas A–L | Las 12 siguen «pendiente» (ver bloque generado). A no depende de nada | Contestar por letra: «A sí», «B después de…», «C no» | La decisión literal y fechada en `modelo.json` |
| 2 | Sesión de 10 días sin falso «Sesión por validar» (issue #124) | Portal integrado (PR #125). El PR #20 de `potenciales-yod` quedó sin fusionar el 7-oct; no se volvió a comprobar | Fusionar ese PR y usar una cuenta real 10 días | Issue #124 cerrado con la prueba de uso y de revocación |
| 3 | Identidad del publicador de GitHub (Sala y Marketing) | Diseño y pruebas listos; registro e instalación pendientes (`arquitectura/publicador-github.md`) | Crear e instalar la App en `sala-edicion` y `aurum-board` | Una publicación real con PR creado por la App y checks aprobados |
| 4 | Imágenes de la Sala | Según el modelo: 6 de 27 reemplazos hechos, 21 detenidos por saldo agotado | Recargar el saldo o cancelar los 21 | Los 21 producidos o dados de baja por escrito |
| 5 | Firma de Obra tomada del cuerpo de la petición | Abierto el 4-sep (`BACKENDS-PENDIENTES.md` §4); la versión activa no se volvió a leer | Compartir el script o pegar el cambio y publicar versión nueva | Una escritura con nombre inventado queda registrada con el nombre de la sesión |
| 6 | 13 claves de Interiores en la historia de git | Abierto el 24-sep (`BACKENDS-PENDIENTES.md` §6); sin comprobar | Rotar cada clave en la hoja y avisar a cada cliente | Ninguna clave vieja abre |
| 7 | CroKiss con la dirección vieja | Abierto el 4-sep (`BACKENDS-PENDIENTES.md` §2); sin comprobar | Cambiar `SITE_BASE` y publicar versión nueva | El `/exec` responde con la liga nueva |
| 8 | DNS `tableros.yodesarrollo.mx` | No resuelve (comprobado el 11-nov) | Decidir: crear el CNAME o retirar el tema | HTTP 200, o la decisión de retirarlo |

## 2 · Dictamen de los PR abiertos

Ninguno se cerró ni se fusionó en esta pasada; es la recomendación para decidir.

| PR | Qué es | Fecha | Dictamen |
|---|---|---|---|
| #345 | Búsqueda del marco y menú móvil | 6-nov, borrador | **Retomar primero.** Es el único que corrige uso diario. Hay que ponerlo al día con `main` (el marco cambió el 10-nov) y verlo en iPhone |
| #333 | Despacho retro en Canvas2D, tras `?office=retro` | 30-oct, borrador | **Decide Dirección.** Pesa 61 % menos en su muestra local, pero falta aceptación visual. Si no se va a usar, cerrar |
| #332 | PPP 4.0: propuesta de semillas | 29-oct, borrador | **Cerrar.** Sólo registra una propuesta sobre una revisión del modelo ya superada; se vuelve a registrar el día que se implemente |
| #284 | Herramientas del Reel para agentes | 18-oct, borrador | **Cerrar junto con #283**, o fusionar una sola política. El propio PR pide no integrar las dos |
| #283 | Política de eficiencia para agentes | 18-oct | **Cerrar** (ver #284) |
| #282 | Integración del portal Master Brokers | 18-oct | **Comprobar y cerrar.** El modelo ya trae Masterbrokers Mini CRM; falta confirmar que lo cubre |
| #66 | Cotejo del Despacho con Cubefarm | 3-oct, borrador | **Cerrar.** Documental, sobre un corte de hace cinco semanas |
| #64 | Consultas PPP y uso de suelo con Jev | 3-oct, borrador | **Cerrar.** Los adaptadores privados nunca se instalaron |
| #62 | Recomendaciones de Claude a Codex | 3-oct | **Cerrar.** Describe bloqueos de octubre que ya cambiaron |

Issues: **#124** sigue vivo (renglón 2 de la ventanilla). **#56** mezcla el relevo de avatares con una ampliación grande (biblioteca, Notion, Obsidian, NotebookLM): conviene partirlo y dejar abierto sólo lo que se vaya a hacer. **#2** (Vigía diario) pertenece a una automatización cancelada y puede cerrarse.

## 3 · Lo que falta y nadie tiene asignado

| Qué | Por qué importa | Primer paso |
|---|---|---|
| Entorno de prueba con cuentas por rol | Casi ningún recorrido real por rol está acreditado, porque en producción no se debe escribir | Copia de las hojas, implementación de prueba de Portero y dos cuentas ficticias |
| Registro de errores del navegador | El monitor de salud sólo comprueba que las páginas respondan; el falso cierre de sesión lo reportó una persona | Contar rechazos y fallos del canje sin datos personales |
| Simulacro de restauración de las hojas | Son la fuente de verdad; en esta pasada no se encontró una restauración probada | Restaurar una copia de Control Maestro y medir el tiempo |
| Uso por tablero | Sin saber qué se abre no se puede retirar nada | Conteo anónimo de aperturas por `system_id` |
| 140 hallazgos medio/bajo del barrido del 2-sep | Siguen sin verificar según el expediente | Revisar por lotes o darlos de baja por antigüedad |

## 4 · Estado de los cambios

<!-- cierre:inicio (generado por scripts/cierre.cjs; no editar a mano) -->

Foto de la revisión `2026-11-11.cierre.1` del modelo. Para refrescarla: `node scripts/cierre.cjs`.

| Estado de los cambios registrados | Cuántos |
|---|---|
| Propuesto (sin hacer) | 124 |
| Hecho, sin acreditar publicación | 67 |
| Publicado | 57 |
| Verificado en producción | 7 |
| **Total** | **255** |

Conexiones comprobadas en ejecución: **10 de 151**.

### Componentes sobre el tope (más de 3 cambios hechos sin acreditar publicación)

| Componente | Hechos sin publicar |
|---|---|
| `SYS-YOD-OS` | 64 |
| `SYS-DESPACHO` | 49 |
| `GAS-PORTERO` | 37 |
| `SYS-DESPACHO-3D` | 31 |
| `EXT-DRIVE` | 20 |
| `SYS-POTENCIALES` | 19 |
| `SVC-AUTON-CLOUD` | 12 |
| `SYS-CONTROL` | 11 |
| `SYS-OBRA` | 10 |
| `SYS-OBRA-CLIENTE` | 9 |
| `SYS-SALA` | 9 |
| `SYS-TRACK` | 9 |
| `SHEET-PORTERO` | 8 |
| `GAS-SALA` | 5 |
| `SHEET-PPP-MODELOS` | 5 |

### Decisiones de negocio que esperan respuesta

| Letra | Propuesta | Esfuerzo | Depende de |
|---|---|---|---|
| A | Atención comercial sin leads olvidados | M | — |
| B | Atribución desde campaña hasta venta | L | A |
| C | Cotización, plan y siguiente paso comercial | M | A |
| D | Referidos y reactivación con control humano | M | A, B |
| E | Folio común de proyecto y datos conciliados | L | — |
| F | Margen por proyecto y compromisos | L | E |
| G | Bloqueos y decisiones que frenan ventas y obra | M | E |
| H | Autorizaciones y evidencia antes de afectar dinero | M | E |
| I | Calendario único de cobros y aportaciones | L | E, H |
| J | Conciliación de recibido, banco y Tesorería | L | I |
| K | Indicadores confiables y rendimiento medido | M | — |
| L | Mapa vivo, contratos y cambios verificables | L | — |

### Los 67 cambios hechos sin acreditar publicación

`CHG-PPP-SHEETS-001` · `CHG-EMD-UI-001` · `CHG-PUBLICADORES-APP-001` · `CHG-BACKENDS-AUTORIZACION-001` · `CHG-PPP-UI-001` · `CHG-PPP-MAPA-001` · `CHG-PPP-LECTURA-002` · `CHG-PPP-TERRENO-003` · `CHG-PPP-VERSIONES-004` · `CHG-DESPACHO-GITHUB-DIRECTO-001` · `CHG-DESPACHO-CONVERSACION-001` · `CHG-DESPACHO-TERMINAL-PUESTO-001` · `CHG-DESPACHO-META-TERMINAL-001` · `CHG-DESPACHO-METAS-DURABLES-001` · `CHG-DESPACHO-PRESENCIA-VOZ-072` · `CHG-DESPACHO-VOZ-UX-079` · `CHG-DESPACHO-PPP-COLABORATIVO-093` · `CHG-SALA-ACCESOS-SESION-172-094` · `CHG-YOD-INTEGRACIONES-OAUTH-094` · `CHG-PUESTO-AUTON-096` · `CHG-OFICINA-PANORAMICA-097` · `CHG-TRABAJO-OBSERVABLE-098` · `CHG-PUESTO-TRABAJO-CLARO-099` · `CHG-DESPACHO-ENTRADA-100` · `CHG-DESPACHO-COMPOSICION-101` · `CHG-DESPACHO-VOZ-105` · `CHG-DESPACHO-VOZ-PUESTO-106` · `CHG-DESPACHO-RADIAL-PROXIMIDAD-107` · `CHG-DESPACHO-ENCUENTRO-108` · `CHG-YOD-OS-SESION-PERSISTENTE-108` · `CHG-DESPACHO-PPP-INMEDIATO-110` · `CHG-DESPACHO-VOZ-DISCRETA-111` · `CHG-DESPACHO-ESCUCHA-LOCAL-112` · `CHG-DESPACHO-ESCUCHA-115` · `CHG-DESPACHO-AUTONES-116` · `CHG-DESPACHO-CARGA-117` · `CHG-DESPACHO-RECOVERY-WAIT-C5` · `CHG-CANCELAR-VIGIA-20261011` · `CHG-DESPACHO-PRECARGA-20261011` · `CHG-DESPACHO-HAIRLINE-20261011` · `CHG-DESPACHO-HAIRLINE-ATRIL-MUELLE-20261012` · `CHG-OS-MARCA-NAVEGACION-20261012` · `CHG-OS-FIGURAS-VOLUMEN-20261012` · `CHG-REUNIONES-EXPEDIENTE-20261012` · `CHG-DESPACHO-PERFIL-ORDEN-20261012` · `CHG-REUNIONES-SEGUIMIENTO-20261012` · `CHG-DESPACHO-GOALS-HYDRATION-20261015` · `CHG-SALA-EJEMPLO-20261015` · `CHG-CHINCHES-ENTREGAS-20261017` · `CHG-PUESTO-AGENTE-2-20261020` · `CHG-RUISENOR-INTERACCION-VOLUMENES-20261020` · `CHG-CHINCHES-AUDIO-IPAD-20261020` · `CHG-VOICE-CLOSE-RECEIPT-20261021` · `CHG-SINGLE-CHROME-371` · `CHG-CONSEJO-AUTONES-20261027` · `CHG-DESPACHO-PPP-CONNECTION-20261028` · `CHG-PPP-READ-VALIDATION-20261029` · `CHG-CONSEJO-RECUPERACION-20261029` · `CHG-ENCARGOS-RECUPERACION-20261029` · `CHG-COUNCIL-TRACE-NOTIFICATION-20261029` · `CHG-COUNCIL-REFRESH-20261029` · `CHG-CHINCHES-STROKE-CLOCK-20261031` · `CHG-MERCADO-HMO-20261101` · `CHG-MERCADO-HMO-F2-20261101` · `CHG-MERCADO-ANCLAS-20261101` · `CHG-SALA-ROAST-ROOM-20261107` · `CHG-CIERRE-20261111`

<!-- cierre:fin -->

## Bitácora de pasadas

- **11-nov-2026.** Primera pasada. Pasaron a «publicado» cuatro cambios de noviembre de este repositorio, comprobados por HTTP en Pages: `CHG-OS-MONTON-20261109`, `CHG-OS-BARRIDO-20261110`, `CHG-OS-BARRIDO-MAPA-20261110` y `CHG-DESPACHO-RUTA-20261110`. Se tacharon en `CLAUDE.md` cinco pendientes ya resueltos. Los demás cambios «hechos sin acreditar publicación» no se movieron: muchos viven en otros repositorios o en motores que no se leyeron en esta pasada.
