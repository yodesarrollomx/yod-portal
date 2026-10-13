# Equipo del Despacho

Estado: implementación frontend en rama; **sin montaje productivo ni adaptador de negocio**.
No reemplaza los expedientes ni el Buzón existente. No modifica Masterbrokers.

## Comportamiento

El diálogo presenta responsables, historia, pendientes de hoy y próximos pasos. La historia
se filtra por fecha del evento; no reconstruye el estado pasado desde el estado actual.
Planeación conserva el estado guardado aunque una fecha prevista ya haya pasado.
Las señales de agentes miden edad de lectura, no disponibilidad continua. Dirección muestra
actividad registrada, sin heartbeat ficticio. Todos los tiempos se muestran en Hermosillo.

El usuario puede crear un encargo o añadir una nota sin reasignar ni cerrar tareas ajenas.
El texto se conserva exactamente. Dictar requiere clic, permite edición posterior y tiene
alternativa de teclado. No se guarda audio. El motor de reconocimiento disponible puede
usar el servicio del navegador; este módulo no promete procesamiento local.

Un envío incierto conserva texto, destino y request_id. «Comprobar envío» consulta primero
su recibo; sólo una ausencia explícita correlacionada permite reintentar el mismo intent.
Un recibo debe coincidir en ID de solicitud, tipo, texto y tarea. Guardado no significa leído
por otro agente ni terminado. Al cerrar el diálogo, el borrador sigue en memoria de la
misma sesión. **Un borrador no confirmado no se conserva tras recargar o cerrar la página**;
la recuperación tras recarga exige recibo y lectura del servidor.

## Montaje en la cabina autorizada

Cargar equipo.css e importar mountTeamDesk desde despacho3d/equipo.mjs.
Invocar una vez desde el host de sesión confirmada, con container, transport,
isAuthorized e identityEpoch. Guardar el controlador y llamar a revoke() antes de cambiar
identidad, revocar acceso o destruir la sección. No montar por un valor de localStorage,
parámetro de URL, mensaje arbitrario o estado de menú. No hay montaje automático en esta
entrega: no se muestra un botón de producción que prometa una conexión inexistente.

No sustituir los mecanismos de autenticación actuales. Las callbacks del cliente impiden
mostrar resultados tardíos, pero **el servidor verifica por sí mismo autoridad vigente,
lectura y escritura**. La identidad del autor debe venir de la sesión del servidor.

## Contrato de transporte v1

- read(): snapshot autorizado con version=1, revision opaca y read_at ISO.
  members: id, label, kind human/agent; last_activity_at o last_review_at y cadence_minutes.
  tasks: id, title, owner, status canónico, updated_at, next_action, due_at, blocker, source_url.
  events: id, at, text, actor, kind, task_id y source_url. Acuses son eventos kind=ack
  emitidos por el agente que efectivamente leyó la instrucción.
- write(intent): version=1, kind request/note, text exacto, task_id o null,
  request_id estable y expected_revision. No aceptar identidad reclamada por el cliente.
- lookupReceipt(request_id): devolver recibo previamente confirmado, o
  {status:"not_found",request_id} sólo si se comprobó ausencia en el almacén autorizado.
  Error o resultado desconocido jamás equivale a ausencia.
- Recibo: version=1, status=saved, id, request_id, revision, recorded_at ISO, kind, text,
  task_id. Debe acreditar escritura durable; no fabricarlo desde el frontend.

El adaptador pendiente debe proyectar Buzón, Intercom y señales existentes, sin otra base.
La escritura valida revisión, serializa operaciones, asegura idempotencia durable y
conserva historial. La revisión no puede ser sólo un contador local si existen escritores
externos. Un conflicto o una sesión revocada no autoriza sobreescribir datos.
No elevar scopes del lector Drive ni reutilizar un escritor de otro dominio como autorización.

## Verificación y activación

Pruebas puras en tests/despacho-equipo.test.cjs. Prueba de navegador aislada en
scripts/probar-equipo-browser.cjs con transporte sintético y red externa bloqueada:
escritorio/móvil, teclado, texto, respuesta perdida, recuperación por recibo sin segundo
write, recarga desde fixture y revocación. Las capturas no acreditan persistencia productiva.

Antes de activar: instalar y comprobar el adaptador, montar desde la cabina autorizada,
revisar la interfaz real en escritorio/móvil y verificar una instrucción autorizada,
su recuperación y el acuse real del siguiente agente. No usar datos de negocio para tests.
Registrar por separado commit, checks, backend desplegado y aceptación real.

Reversión: retirar el montaje y estos módulos. Conservar notas, recibos y fuentes.
