# Contrato de actividad del Despacho

Acción 1.1 · CHG-DESPACHO-ACTIVIDAD-065 · CTR-DESPACHO-ACTIVIDAD-V1.

Estado: contrato y demostración sintética implementados en rama. No añade operaciones RPC ni persistencia. La versión activa del servidor privado sigue por contrastar; el acceso al repositorio del motor no estuvo disponible en esta revisión. La compatibilidad se prepara contra el cliente vigente y el contrato de conversación documentado, sin atribuir al servidor una API nueva.

## Identidad y eventos

Una actividad identifica `schema=1`, `activity_id`, `case_id`, `request_id`, `actor_id`, `space_id`, `operation=consulta`, `requires_arrival`, `created_at`, `expected_revision` y `links` (IDs opcionales `job_id` y `message_id`). Es una primera operación acotada; otros tipos necesitan ampliar explícitamente el contrato. El actor y el caso los resolverá el servidor, nunca un selector de figuras. `expected_revision` se conserva como precondición para el adaptador futuro; el reductor local no implementa CAS contra un servidor.

Cada evento contiene `schema`, `event_id`, `activity_id`, `case_id`, `sequence`, `kind`, `source`, `created_at`, `evidence` y, para fallo/cancelación, `code`. La evidencia identifica `scope`, `kind` y `ref`. Horas UTC con milisegundos, secuencia consecutiva e IDs acotados. Hasta 64 eventos por actividad. Un evento rechazado no modifica estado ni historial.

| Evento | Fuente admitida fuera de la demostración | Evidencia |
|---|---|---|
| solicitado | servidor | recibo de solicitud |
| iniciado | servidor o ejecutor | inicio de recorrido |
| llego | piloto | llegada local, sin afirmar respaldo |
| trabajando | servidor o ejecutor | ejecución de herramienta |
| esperando_revision | servidor o ejecutor | referencia de entrega |
| terminado | servidor o ejecutor | misma referencia de entrega |
| fallido o cancelado | servidor o ejecutor | código acotado y referencia |

Estas etiquetas describen eventos suministrados por un adaptador confiable; escribir `source=server` desde el navegador no autentica a nadie. El modo `verified-input` es una proyección de entradas previamente comprobadas, no una comprobación criptográfica. Su recibo dice `local-projection`. El modo `synthetic` exige siempre fuente `simulator` y evidencia `synthetic`.

## Ruta lógica

`solicitado → iniciado → llego → trabajando → esperando_revision → terminado`. Una consulta sin desplazamiento puede pasar de iniciado a trabajando. Fallido/cancelado cierran cualquier intento que ya haya sido solicitado. Después de un estado terminal se rechazan eventos nuevos; un reintento idéntico del evento original sigue reconocido como duplicado.

Llegar no completa una consulta. Terminado exige la referencia presentada para revisión, sin sustituirla. Este estado tampoco concede aprobación de negocio: el adaptador de cada herramienta deberá aplicar su permiso y criterio de terminación. No hay ejecución de herramientas ni aprobación en este módulo.

Los eventos con mismo ID y contenido canónico no se duplican. Reutilizar el ID con otro contenido se rechaza; la secuencia incorrecta, hora anterior, procedencia inválida o identidad distinta también. Una recuperación reproduce el historial sin pedir ni ejecutar otra actividad. No deducir estado final solo de una animación, temporizador o texto de chat.

## Compatibilidad y siguiente entrega

El cliente de conversación ya conserva `request_id`, `job_id`, `message_id`, `event_id` y `case_id` (ver `conversation.mjs` y `despacho-conversacion.md`). Esta propuesta añade vínculos; no cambia esos IDs ni el formato de `read`/`enqueue`. No migra historial.

En 1.2 se revisará el servidor efectivo y se propondrá el adaptador autorizado y su recibo durable, idempotencia por actor/caso/contenido, CAS, recuperación y revocación. Una visita requiere un contrato propio de movimiento/registro, separado de la consulta demostrada. No afirmar que un `request_id` por sí solo implementa idempotencia durable: aquí se comprueba solo el reintento de eventos en memoria.

## Demostración y aceptación

`despacho3d/actividad-demo.html` usa únicamente datos sintéticos. Botones explícitos avanzan los pasos, reintentan, cancelan, simulan fallo y prueban un evento tardío. Siempre muestra «Sin respaldo del servidor». Reiniciar crea otro ID de prueba y no toca el expediente ni la sala.

1. Capturar actividad solicitada con ID y un evento.
2. Confirmar llegada y capturar que la consulta aún no está terminada.
3. Preparar entrega, confirmar resultado y capturar seis eventos con una referencia común.
4. Reintentar: mismo ID y mismo número de eventos. Probar evento tardío: rechazado, estado terminal conservado.
5. Reiniciar; cancelar o fallar y comprobar cierre sin resultado. Capturar vista móvil cuando haya superficie móvil disponible.

`tests/despacho-actividad.test.cjs` comprueba el reductor y los controles DOM aislados. Pruebas y capturas sintéticas no acreditan escritura en Sheets ni autorización efectiva del servidor. Reversión: revertir el PR; no hay almacén o despliegue de motor que revertir.
