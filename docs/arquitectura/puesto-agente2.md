# Puesto del agente 2.0 · piloto

CHG-PUESTO-AGENTE-2-20261020 · 20-oct-2026. Dirección autoriza implementar y publicar el cambio de interfaz. Implementación local y verificaciones locales realizadas; PR, Pages y recorrido Chromium HTTP pendientes de recibos. La habilitación se limita al agente del piloto; extenderla a otros agentes requiere decisión de Dirección.

La conversación es la entrada: el avatar existente permanece visible con acercamiento CSS al abrir, historial a la vista, caja amplia y micrófono que comienza sólo al tocarlo. En celular, conversación y avatar conservan prioridad y el resumen se puede plegar. No se añadieron sincronización de labios ni animaciones del personaje.

## Implementación y contratos

| Superficie | Comportamiento implementado | Contrato conservado |
| --- | --- | --- |
| Entrada del agente | Apertura directa sin anillo sólo cuando coinciden perfil, avatar y caso del piloto | Selección autorizada del mismo caso; no modifica el plano de la oficina |
| Cabecera y conversación | Un estado, hilo visible, sugerencias, escritura amplia y voz explícita; conserva los nodos y handlers originales | Envío, deltas, tiempos, cierre, historial, outbox y recibos actuales |
| Lo esencial del caso | Cuatro cifras del mismo snapshot confirmado, versión/revisión/fecha de consulta, siguiente paso y hasta tres pendientes | Mismo Store del PPP; ausente no equivale a cero y una versión en consulta no equivale a aprobada |
| Plan, Trabajo y Expediente | Vistas propias con retorno; avatar visible al consultar el plan | Mismos tableros, fuentes, permisos y operaciones existentes |
| Carga y recuperación | Reutiliza el estado autorizado ya retenido en memoria mientras se actualiza | Sin caché durable nueva; la copia no restaura autorización; retirar datos al revocar o cambiar caso |
| Vista anterior | `?puesto=clasico`, también heredado de la cabina del mismo origen | Restaura nodos y presentación anterior; conserva borrador y controles originales |

La capa vive en `despacho3d/puesto-agente.mjs` y `puesto-agente.css`; se integra mediante `agent-menu.mjs`, `live-voice-boot.mjs`, `agent-workspace.mjs`, `index.html` y la revisión de carga de `circulo-boot.mjs`. El módulo proyecta el estado observado del workspace y mueve los elementos originales de conversación y retrato; no crea otra sesión ni otro avatar.

No cambia Render, Apps Script, las hojas de negocio ni sus datos, la geometría del Despacho, hairline-access, llaves, roles, endpoints, JSON Live, fórmulas, revisión o semántica de guardado. El registro operativo privado conserva la bitácora del encargo.

## Conversar mientras se trabaja en el PPP

El contrato existente `CTR-PPP-AJUSTE-CONVERSADO` distingue una propuesta de una aplicación confirmada. `project-station.mjs` resuelve el tablero original y `agent-workspace.mjs` intercambia su lectura mediante el puente del mismo caso. El servidor conserva la autoridad de las propuestas; aplicar exige autorización vigente, escenario y revisión coincidentes. El recibo se concilia antes de afirmar guardado.

Este cambio de interfaz abre el plan y mantiene el avatar visible, pero no incorpora navegación o edición automática a partir de la conversación. El PPP vertical actual conserva su modalidad de consulta. No se interpreta por cuenta de la interfaz una frase para alterar cantidades, no se crea un motor financiero paralelo y no se afirma aplicación porque los valores coincidan visualmente. Una revisión compartida no se etiqueta como última aprobada sin una referencia de aprobación recibida.

La futura petición «cambiar el número de departamentos» deberá usar herramientas reales del agente y del PPP con sus límites y recibos. Este alcance no despliega esas herramientas ni prueba una escritura financiera. Audio físico, interpretación del encargo, guardado real y aceptación en dispositivo son comprobaciones independientes.

## Verificaciones y evidencia pendiente

Las comprobaciones locales obligatorias del portal y la suite Node completa pasaron en la rama: 864 pruebas aprobadas. `tests/despacho-puesto2.test.cjs` contiene ocho pruebas de comportamiento con `tests/helpers/puesto-dom.cjs`: restricción al piloto, reversión clásica, métricas del mismo snapshot confirmado, rechazo de otro caso/escenario o lectura pendiente, máximo tres pendientes, reutilización de nodos y handlers, ausencia de micrófono automático y bloqueo al retirar el caso.

`tests/fixtures/puesto2.html` es una superficie explícitamente sintética que importa el módulo y CSS reales. Su política CSP bloquea conexiones, medios y envíos de formulario; no tiene transportes de negocio. Permite el recorrido Chromium por HTTP en escritorio1280 y celular390. El navegador no alcanzó el servidor local y rechazó una URL data:; no se intentó eludir esa restricción. La prueba DOM no sustituye al recorrido visual.

Pendiente para cerrar publicación: PR y recibo de Pages, cotejo de archivos servidos con la versión integrada y recorrido Chromium HTTP de la fixture. El recibo de la fixture acredita presentación con datos sintéticos, no datos privados ni audio físico. El recorrido autenticado del piloto y la aceptación de Dirección se registran por separado.

Reversión: usar `?puesto=clasico` o revertir la capa y sus inclusiones mediante PR. Conservar conversaciones, borradores, outbox, recibos, versiones, datos y permisos. No revertir ni limpiar hojas para deshacer una interfaz.

## Ajuste tras recorrido HTTP

Pages del PR297 sirvió los ocho recursos idénticos a los probados. Chromium detectó que el contenedor nativo details dejaba el compositor fuera de la zona visible en móvil y separado del fondo en ventanas altas. El ajuste conserva el disclosure para el ciclo existente, con un contenedor flex real para conversación y controles; el modo clásico restaura sus padres y orden originales. Prueba de regresión de identidad y restauración completa aprobada. Revalidación visual del ajuste pendiente de publicación.
