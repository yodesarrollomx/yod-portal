# Conversación del expediente en el Despacho

Estado: cliente, puente y servidor publicados. Dos turnos auténticos desde la sala, respuesta autenticada, memoria recuperada desde el historial, persistencia en la misma hoja y coincidencia visual comprobados. El propietario confirmó que la respuesta sigue presente al cerrar y volver a abrir, sin enviar otro mensaje. El servicio permanente sigue pendiente.

Al abrir Agentes, el cliente pide el expediente autorizado al OS. Con un adaptador conectado, recupera nombre, enlace, conversación y actividad desde el servidor. El envío explícito conserva un identificador durante reintentos y sólo confirma recepción después del recibo persistido. La respuesta aparece mediante una lectura posterior; reabrir no ejecuta otra inferencia.

## Transporte y servidor

El OS instala `window.YODCaseTransport` mediante `os/despacho-transport.js`. Envía POST al Portero original ya configurado con `tipo=despacho-v1`, `operation`, `payload` y la sesión en el cuerpo. No conmuta al servidor de respaldo al enviar. El servidor requiere el adaptador privado preparado para instalación manual; la presencia de este cliente no acredita que esa ruta ya esté publicada. Cada operación debe autorizar la sesión vigente y resolver las fuentes canónicas en servidor. El puente verifica origen, ventana y época de sesión, pero no reemplaza la autorización del servidor.

| Operación | Entrada | Salida |
| --- | --- | --- |
| `resolveCurrent` | `{}` | `ok`, `case_id`, `name`, `url`, `can_enqueue`, `agent_ready` |
| `read` | `case_id` | `ok`, `case_id`, `source_revision`, `context.identity`, `state.updated_at`, `conversation`, `jobs`, `events` |
| `enqueue` | `case_id`, `expected_revision`, `request_id`, `message` | Recibo durable con `ok`, `state=queued`, `case_id`, `source_revision`, `request_id`, `job_id` |

`resolveCurrent` no recibe nombres, libros o rangos desde el navegador. Los permisos provienen del servidor y `agent_ready` requiere señal reciente de un worker vinculado que haya comprobado ejecución autenticada real. Un estado de sesión guardada no es evidencia suficiente. Actualizar relee también la disponibilidad y no cambia silenciosamente de caso.

El formato de `read` y `enqueue` corresponde al módulo privado de cola. El adaptador preparado combina el historial anterior con las nuevas conversaciones conservando IDs y la hoja operacional. Las filas previas no se reencolan y un mensaje previo pendiente impide avanzar hasta resolverlo. El despliegue sigue siendo manual. Un mensaje explícito puede reanudar una espera de datos; una aprobación no se infiere del texto.

Las filas de conversación usan `message_id`, `case_id`, `job_id`, `role`, `body_json` y `created_at`; el cuerpo conserva texto literal (`message` para usuario, `reply` para agente). Los trabajos incluyen `job_id`, `case_id`, `enqueue_request_id` y `status`. Los eventos usan `event_id`, `case_id`, `kind` y `created_at`.

Un conflicto de revisión exige releer. Un recibo perdido conserva el mismo mensaje e identificador. El servidor debe ofrecer idempotencia durable y rechazar la reutilización con otro contenido. Leer el trabajo por `enqueue_request_id` también permite reconciliar el guardado sin reenviar. Mientras el trabajo está activo, el panel programa la siguiente lectura después de terminar la anterior: espera cinco segundos durante los primeros 30 segundos y diez después. Omite consultas mientras la pestaña está oculta o existe otra operación. A los tres minutos muestra un aviso explícito para consultar con Actualizar; no vuelve a enviar el mensaje. Estas lecturas nunca ejecutan inferencia.

## Privacidad y cierre

Los datos y credenciales no se incluyen en la publicación. El puente no añade tokens a mensajes, URLs o código. Cerrar el panel elimina selección, historial y borrador de su memoria. Cambiar sesión o desmontar el iframe descarta respuestas tardías. Toda reapertura lee de nuevo; no usa almacenamiento del navegador como historial.

El cliente no activa horarios, voz, contactos, cálculos ni acciones de negocio. Sin adaptador verificado, mantiene el envío deshabilitado y muestra el fallo de conexión.

## Validación y entrega

Las pruebas cubren recuperación en una nueva instancia, respuesta tardía, recibo perdido, conflicto, límites de datos, origen, ventana y sesión. Las pruebas de navegador usan transporte sintético y bloquean conexiones externas. No acreditan persistencia en Sheets productivo.

La instrucción real desde la sala, dos respuestas autenticadas, memoria entre turnos y lectura posterior de sus registros en la misma hoja ya fueron comprobadas. La segunda respuesta visible coincide con la guardada. El propietario confirmó el último cierre/reapertura sin enviar otro turno: el mensaje sigue presente. Dos intentos intermedios quedaron detenidos por espera agotada; se conservan en el historial. El servidor r2 con lecturas agrupadas está publicado: etiqueta, código exacto y lecturas del motor comprobados. La latencia de un nuevo turno sigue pendiente de medición. El launcher atiende bloques optativos de30minutos y no acredita disponibilidad permanente.

Reversión: revertir el PR del cliente. Conservar hojas, historial, identificadores, permisos y despliegues del servidor.

El panel distingue autorización denegada, cambio de sesión, espera agotada, formato inválido y apertura fuera de YOD OS. Solo propaga códigos permitidos y el paso fallido; descarta mensajes crudos del proveedor. El propietario reportó un fallo inicial de carga que se recuperó; su causa no se confirmó. La memoria entre turnos ya se comprobó; el último cierre/reapertura fue confirmado por el propietario.

Cuando el último mensaje aparece detenido en el servidor, el panel muestra que quedó sin respuesta y ofrece «Volver a enviar». Solo ese clic explícito crea un turno nuevo con el mismo texto y un identificador nuevo; la recuperación de un recibo perdido conserva el identificador anterior. Ninguna lectura reencola mensajes. Las esperas acotadas son 45 segundos en HTTP, 50 en el puente y 55 en el cliente; cerrar o cambiar sesión sigue descartando respuestas tardías.

## Carril rápido (propuesto: CHG-DESPACHO-FAST-049)

Estado: backend Apps Script r6-fast y motor en la nube comprobados con el piloto; este cambio de interfaz sigue en revisión. Al abrir la conversación el panel pide al Portero, por el puente existente, una credencial corta ligada al expediente (`mintFastSession`, solo `{case_id}`, carril propio del puente). La credencial no es la sesión del OS ni una clave del motor: caduca en minutos, solo sirve para conversar con ese expediente y se descarta al cerrar o cambiar de sesión.

Con ella el panel conversa por streaming con el motor en la nube, que elige modelo y esfuerzo según la pregunta, contesta con la evidencia del expediente y guarda el turno en Sheets en segundo plano con un recibo idempotente. El panel muestra el texto mientras llega, conserva el turno como «guardando respaldo» hasta que Sheets lo refleja (el seguidor común sigue leyendo) y nunca duplica mensajes. Si el carril no existe o falla antes de aceptar el turno, el envío usa la cola de Sheets sin cambios. Un fallo posterior no reenvía por la cola: el borrador se conserva y se avisa que no se guardó.

Pruebas: `tests/despacho-fast-lane.test.cjs` (sintético, sin red). Reversión: revertir el PR; backend y motor conservan ambos caminos.
