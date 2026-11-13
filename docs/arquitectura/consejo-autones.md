# Consejo en el despacho

CHG-CONSEJO-AUTONES-20261027. Implementación en rama, no producción.

Un autón representa un expediente (terreno, potencial, desarrollo o vivienda), no una persona. Conserva `case_id`, fuentes e historial mientras recorre Potencial → Codesarrollo → Proyecto → Obra → Ventas. La apariencia no determina la etapa. El consejo representa cinco perspectivas de IA: Desarrollo, Mercado, Capital, Operación y Contraste. Son evaluaciones secuenciales con el proveedor existente; no cinco personas ni cinco proveedores independientes.

## Circuito

1. El worker entrega un resultado y confirma su guardado canónico.
2. Antes de liberar su outbox, registra una recepción idempotente en el consejo privado.
3. Cada perspectiva revisa el mismo entregable y cita sus evidencias. Las objeciones originan tareas con criterio de aceptación.
4. El autón corrige el análisis con las fuentes disponibles. El consejo vuelve a revisar. Máximo tres rondas por ciclo, seis por entrega; datos o capacidades faltantes detienen el ciclo.
5. El resultado preparado aparece para Dirección. Sus observaciones se guardan con revisión e identificador; una respuesta repetida no genera otra tarea.
6. Aceptar la entrega conserva la historia y no autoriza automáticamente la siguiente etapa de negocio.

La interfaz está dentro del tab `meeting` del puesto existente. Los cinco avatares ocupan cinco asientos de juntas y los proyectos presentan desde el lateral sin compartir las sillas. El mismo renderer y la geometría actual se conservan. La animación no escribe ni demuestra una inferencia. Los movimientos consumen estados observados, caducan y respetan reducción de movimiento. La superficie reutiliza las chinches existentes del despacho; no instala otro grabador ni modifica su paquete.

## Contrato

`POST /council/read {}` devuelve `{ok,schema:1,case_id,sessions}` con autorización actual. `POST /council/respond` recibe `{request_id,session_id,expected_revision,action,text}`; acciones `feedback` y `accept`. Respuesta incluye el mismo `request_id`. El servicio verifica sesión firmada, origen, caso y propietario configurado. La selección visual nunca concede permiso.

Estados: queued, reviewing, correcting, ready, needs_input, interrupted, accepted. El frontend distingue ausencia de conexión, falta de información y guardado incierto. Un reintento usa la misma operación. El servidor registra revisiones, tareas, observaciones, historial de resúmenes y recibos en almacenamiento privado. Las fuentes originales y PPP no cambian.

## Validación y límites

- 1048 pruebas de portal aprobadas, incluidas cuatro nuevas sobre límites de caso, identidad, respuesta tardía y reintento estable.
- Arquitectura, OS, portal, accesos y obra aprobados. Matriz de accesos consultada en main durante la comprobación.
- Prueba aislada `qa/consejo-preview.html` usa los módulos reales y datos sintéticos; no llama modelos ni envía correo.
- El navegador de QA no crea contexto WebGL. No se acredita apariencia 3D final ni aceptación en dispositivo. La oficina conserva su mapa accesible.
- Motor complementario en el repositorio privado: pruebas de consenso, corrección, permisos, persistencia/reapertura, ACK e incertidumbre de notificación. No equivale a despliegue ni a inferencia real.
- El conector de notificación aún no está conectado. `not_configured` es visible; no se promete envío, recepción ni lectura de respuestas por correo. El adaptador futuro debe emitir recibo y vincular la reunión exacta.
- La etapa comercial necesita una fuente canónica por expediente. Hasta conectarla, `unconfirmed`; no se deduce de nombres ni aspecto.
- Las correcciones de esta versión son análisis del entregable. Ejecutar obra, ventas, cambios PPP o tareas externas requiere sus contratos vigentes; no se agregan permisos por consenso.

## Activación y reversión

Revisar y probar primero el backend y sus rutas, identidad de Dirección y estado privado. Conectar el envío y retorno autenticado del correo, la etapa canónica y aceptación WebGL antes de declarar completado el encargo. Conservar la implementación y dominio actuales. El frontend muestra conexión pendiente cuando el backend no está activado.

Revertir los PR y apagar `YOD_COUNCIL_ENABLED`; conservar expedientes, metas, recepción privada y recibos. No borrar historial para volver a la versión anterior.

## Bloque de historial visible

La sala recibe `lifecycle` del motor privado y valida caso, revisiones, IDs únicos y continuidad de hitos antes de mostrarlo. Presenta etapa actual registrada, recorrido e historial plegable con actor, fecha en Hermosillo, motivo y referencia declarada como texto. Las reuniones conservan la etiqueta de su etapa histórica. Si falta `lifecycle`, no deduce la etapa actual de una reunión antigua. La vista funciona aun sin reuniones.

Fuente comercial PPP pendiente de integración: el journal del consejo no prueba una transición del PPP. No se añadieron botones que cambien la etapa ni se hicieron escrituras a casos reales. La vista lo indica expresamente. Prueba sintética con etapa actual Codesarrollo y entrega anterior Potencial en `qa/consejo-preview.html`.


## Recuperar una ronda interrumpida

CHG-CONSEJO-RECUPERACION-20261029. Preparado y probado localmente; integración y recorrido productivo pendientes.

La interfaz ofrece **Reanudar revisión** sólo si el backend devuelve `resume_available: true` para una sesión `interrupted`. Envía `action: resume`, texto vacío, la revisión esperada y un identificador estable. Una respuesta perdida conserva exactamente la misma operación; actualizar y reabrir sólo leen. La reanudación conserva la sesión, ronda, revisiones y observaciones. Un conflicto de revisión exige releer antes de otra acción.

`blocked_reason: task_limit` y `next_action: new_delivery_required` muestran el mensaje acotado del servicio y retiran controles de observaciones, aceptación y reanudación. Se mantiene el historial y la revisión que excedió el límite permanece en el journal privado del motor. No se amplían presupuestos ni se convierten bloqueos deterministas en reintentos. El frontend no autoriza cambios de etapa ni escribe al PPP.

Trece pruebas de interfaz/modelo incluyen apertura sin mutaciones, doble clic, acuse perdido seguido de lectura de la cola, idempotencia de solicitud, conflicto, falta de permiso, señales incoherentes y bloqueo visible sin escrituras. Las pruebas sintéticas no acreditan recuperación de una sesión real.


## Controles de encargos durante la recuperación

CHG-ENCARGOS-RECUPERACION-20261029. Implementado localmente; publicación y comprobación productiva pendientes. El puesto mantiene el sondeo mientras un encargo está en cola o ejecución y permite una consulta explícita con Actualizar encargos. Las metas detenidas, entregadas o en espera de datos dejan libres los controles; cualquier acción vuelve a leer antes de escribir con CAS y el identificador durable existente. Un acuse incierto conserva su misma operación y pausa la lectura pasiva. Reabrir el mismo caso actualiza sus capacidades desde la selección autorizada recibida sin borrar el trabajo ni cambiar de proyecto.


## Identificadores y notificación no solicitada

CHG-COUNCIL-TRACE-NOTIFICATION-20261029. Implementado localmente; publicación y comprobación productiva pendientes. La lista muestra el ID literal que devuelve el servicio junto al título, criterio y estado. No deduce perspectiva, ronda ni procedencia de un corte histórico por el orden de las filas; el identificador visible no reemplaza esa evidencia.

El consumidor admite `notification.state=suppressed` y muestra «Correo: no solicitado». Este recibo describe una nueva publicación automática sin autorización estructurada de envío. No reinterpreta estados históricos `pending`, `uncertain` o `sent`, y abrir o actualizar la vista no envía ni reintenta mensajes. La política se ejecuta en el backend privado; la interfaz no concede permisos. Publicar y comprobar este consumidor antes del backend que emita el nuevo estado.


## Consultar el historial sin sondeo continuo

CHG-COUNCIL-REFRESH-20261029. Implementado localmente; publicación pendiente. El sondeo automático sólo continúa si existe una sesión queued, reviewing o correcting. Para reuniones terminales se conserva Actualizar consejo. Seleccionar una reunión ya recibida es una operación local disponible durante una lectura; las mutaciones permanecen bloqueadas mientras esa lectura termina y durante un acuse incierto. La lectura coalescida y el veto de respuestas tardías por caso se conservan.
