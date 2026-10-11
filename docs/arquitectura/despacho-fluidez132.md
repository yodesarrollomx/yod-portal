# Fluidez del despacho · versión 132

Fecha de propuesta: 11 de octubre de 2026. Estado inicial al registrar la propuesta: implementación en rama; producción pendiente de CI y revisión. El cierre y su evidencia se registran al final.

## Propósito

Elegir un autón, reconocer su siguiente decisión y conversar mirando el PPP nativo. La oficina conserva sus modos 3D y plano sin GPU. La reorganización mantiene todos los contratos de datos, acciones, permisos y recibos.

## Antes y cambio

- La cabecera ocupaba altura que necesitaba el tablero. El resumen pasa a dos renglones compactos y el PPP llena la superficie restante; tareas y fuentes se leen en su sección.
- Carga y error podían parecer un proyecto vacío. Ahora sólo una lectura correcta puede acreditar ausencia de encargos. Un registro conservado muestra su condición histórica.
- Pendientes releía y podía aceptar una revisión distinta. Ahora compara la entrega mostrada; ante conflicto exige leerla de nuevo.
- La rueda desplegaba otra lista fuera del círculo. Las cuatro direcciones permanecen estables y sus dos opciones aparecen en el centro, sin enviar comandos por señalar.
- La oficina tenía selección dispersa. La bandeja reúne nombres del catálogo autorizado y utiliza exactamente la misma apertura del avatar; no concede acceso ni promete trabajo continuo.
- El plano mostraba muchos movimientos manuales simultáneos. Se mantienen bajo un desplegable; elegir autón sigue visible.

## Capacidades conservadas

PPP y sus ajustes con confirmación; voz y escucha/interrupción/cápsula; chat e historial; encargo explícito, criterios, tareas, evidencias, retomar y detener; revisión y reuniones con narración y descarga; fuentes, navegador, notas y versiones; avatar; chinches; plano, navegación y movimiento manual. Abrir, volver o recuperar nunca inicia o reanuda objetivos.

## Comprobación y límites

Los ensayos de navegador usan módulos reales con transporte sintético e incluyen capturas, tres casos aislados, estados, conflicto de revisión, teclado, tamaño de controles y espacio del PPP en escritorio, Chromebook y móvil. No acreditan datos financieros privados, micrófono físico ni autonomía 24/7. No se crean tareas de negocio, no se escribe en Sheets y no se reinicia Render por esta versión de cliente.

## Reversión

Revertir el PR de interfaz. No borrar datos, recibos, expedientes ni disco persistente. Las automatizaciones canceladas permanecen canceladas.

## Bitácora de ejecución

Todas las horas de esta tabla son UTC del 11 de octubre de 2026, tomadas de los commits; no representan mediciones de tokens ni porcentaje de éxito.

| Hora UTC | Cambio | Motivo y resultado | Commit |
|---|---|---|---|
| 18:28:23 | Propuesta y límites | Registrar el cambio antes de programar: selección, rueda y puesto; conservar identidad, permisos y contratos. La propuesta separa UI de autonomía y de permisos. | [4f436d6](https://github.com/yodesarrollomx/yod-portal/commit/4f436d6dbdb36c524edc4bd32a8a079a28432073) |
| 18:35:56 | Implementación | El PPP ocupa la superficie principal y la conversación queda junto a él. Las cuatro direcciones y la bandeja comparten la apertura autorizada del personaje. Ruta completa, fuentes y controles manuales siguen disponibles bajo sus secciones. | [ef1e9c7](https://github.com/yodesarrollomx/yod-portal/commit/ef1e9c7fb693f42bb3eb3f34afa0c39f8009141d) |
| 18:39:45 | Continuidad de lectura | Las actualizaciones conservan desplegables y foco; un fallo de lectura se distingue de ausencia confirmada de metas. La entrega se compara por proyecto, ID y revisión antes de aceptarla. | [e609e86](https://github.com/yodesarrollomx/yod-portal/commit/e609e86b3b9e6a50694dcb879d83a3ab10ffa6c6) |
| 18:50:03 | Correcciones tras pruebas | Conservar avatar móvil y separar título y menú; completar el DOM de prueba del plano. Corregir las expectativas de versión y el recorrido del control manual plegado sin retirar sus comprobaciones. | [4359715](https://github.com/yodesarrollomx/yod-portal/commit/435971589809209b05c51a287bc908f4fbb5cd9c) |
| 18:55:44 | Borrador de corrección | El historial borraba el aviso del borrador al abrir el chat. El marcador ahora persiste dentro del proyecto; se retira al intentar enviar, cambiar caso o revocar, para distinguir borrador de envío incierto. | [0855078](https://github.com/yodesarrollomx/yod-portal/commit/0855078c4a06fbf9378006b62fd1cf105864aee1) |
| 19:02:24 | Recorrido PPP actualizado | La prueba abre y cierra Conexión y variantes por clic normal. Mantiene los asserts de iframe, borrador, sesiones, nonce, aislamiento, aplicación y recibos, evitando interactuar a través del desplegable móvil. | [b8df8c2](https://github.com/yodesarrollomx/yod-portal/commit/b8df8c2823726b184a01405e63c8d67acf6b0d76) |

## Cierre comprobado

- **19:12:32 UTC**: los cuatro workflows del commit exacto `b8df8c2823726b184a01405e63c8d67acf6b0d76` estaban completados con éxito; revisión separada aprobada antes de integrar. [Arquitectura y 618/618](https://github.com/yodesarrollomx/yod-portal/actions/runs/38166340212), [OS/Portal/Accesos](https://github.com/yodesarrollomx/yod-portal/actions/runs/38166340153), [Chinches y capturas](https://github.com/yodesarrollomx/yod-portal/actions/runs/38166340131), [Entrada/Voz/PPP](https://github.com/yodesarrollomx/yod-portal/actions/runs/38166340113).
- **19:13:08 UTC**: [PR168](https://github.com/yodesarrollomx/yod-portal/pull/168) integrado; commit de publicación `1959af900210d0c697c9f88abcfafcf5eff6f4fa`. El árbol de runtime es exactamente el revisado y probado.
- **19:13:35 UTC**: [Pages build and deployment](https://github.com/yodesarrollomx/yod-portal/actions/runs/38167078699) finalizó con éxito para ese commit.
- **19:14:45 UTC, hora de observación**: el paso «Comprobar entrada publicada sin sesión privada» del [workflow de publicación](https://github.com/yodesarrollomx/yod-portal/actions/runs/38167079475) constaba como completado y aprobado. Ese script navega a Pages sin interceptar la red, verifica los módulos actuales y abre la oficina pública en escritorio y móvil. La prueba de entrada real no equivale a probar un expediente privado; las demás etapas de ese workflow de push aún continuaban al registrar esta observación.

**Resultado entregado:** reorganización del cliente publicada en [Despacho fluido132](https://yodesarrollomx.github.io/yod-portal/os/?v=fluido132#/despacho). Selección por nombre o avatar, cuatro direcciones con opciones dentro de la rueda, PPP junto a conversación, ruta y fuentes legibles, estados comprobables y revisión de la entrega exacta. Los controles agrupados conservan sus acciones y protocolos; ninguna escritura se acredita por haber abierto una pantalla.

**Correcciones verificadas:** se distinguió carga/fallo de ausencia confirmada; se mantuvieron foco y desplegables al actualizar; el aviso de borrador se conserva y se diferencia del envío incierto; el avatar móvil queda visible sin tapar nombre o menú. La regresión del recorrido PPP se corrigió usando sus controles visibles, conservando todas sus comprobaciones de recibos, aislamiento y no duplicación.

**Límite de aceptación:** se cierra esta reorganización de interfaz. El micrófono físico del equipo, la estética de las tarjetas privadas y el trabajo autónomo 24/7 no quedan acreditados por los expedientes sintéticos. Las capturas de pruebas son del contenedor real con un PPP mínimo de prueba; no se presentan como fotografías del expediente del propietario. Esta entrega no reactiva el supervisor ni las automatizaciones canceladas y no modifica datos de negocio.
