# Registro de visitas del Despacho

Acción 1.2 · CHG-DESPACHO-VISITAS-067 · CTR-DESPACHO-VISITAS-V1.

Estado: implementación candidata, 334 pruebas locales y 14 comprobaciones conectadas aprobadas en archivo sintético; guardado productivo apagado mediante `ENTORNO_VISITAS_PERSISTENTES=false`. Portero v63 y build `despacho-20261003-r6-fast` contrastados en su editor e implementación activa el 4-oct-2026. La fuente actual de Code.gs coincide con esa versión. El adaptador publicado todavía no incluye operaciones de visitas. El respaldo de preflight queda en el plan privado, nunca en este repositorio.

## Operaciones y fuente de verdad

`readVisits({case_id})` lee el historial; no crea pestañas. `recordVisit` recibe `case_id`, `request_id`, `visit_id`, `expected_revision`, `space_id`, `visitor_kind`, `reason_code` y `arrival_ref`. Actor, permiso DP y libro se resuelven y revalidan en el servidor. Solo juntas, biblioteca y edición tienen espacio implementado. No se envían nombres o identificadores de libro desde el navegador.

El registro utiliza dos pestañas nuevas del libro operacional canónico: `YOD Office Visits` y `YOD Office State`. No modifica conversación, trabajos, metas o sus revisiones. Cada visita guarda su solicitud digerida y su recibo en la misma fila. El estado conserva una revisión consecutiva. Hasta diez mil visitas; lectura de las últimas doscientas con aviso de historial anterior, sin borrarlo. Ampliar ese límite o paginar todo el archivo es una entrega posterior.

## Ruta de guardado

1. Autenticar sesión vigente, caso y DP; adquirir ScriptLock y volver a comprobar el actor.
2. Resolver el libro en servidor; comprobar encabezados, literales, IDs, correlación de recibos y revisión.
3. Reconocer una solicitud ya guardada antes del CAS. Exigir actor y contenido originales; devolver el mismo recibo aunque la revisión haya avanzado.
4. Rechazar otra visita con el mismo ID o una revisión obsoleta. Revalidar autorización inmediatamente antes de escribir.
5. Una transacción `Sheets.Spreadsheets.batchUpdate` conserva visita, recibo y revisión. Usar `stringValue` para toda celda. Un fallo de transporte no asegura que el servidor dejó de escribir.
6. El cliente conserva la solicitud original y reintenta explícitamente o concilia mediante lectura. Las siguientes llegadas esperan en una cola de memoria con IDs propios y se guardan en serie. No cambiar automáticamente la revisión de una solicitud que pudo haberse escrito.

El recibo `scope=server-persisted` identifica caso, solicitud, visita, recibo, hora de servidor y revisión. `arrival_evidence=client_report` significa que el cliente informó una llegada. Guardar el registro no acredita que el servidor verificó una posición física, ejecutó una herramienta o aprobó una entrega.

El historial guardado se recupera con lectura al abrir el perfil; reabrir por sí solo no registra otra visita. La cola sin recibo vive en la sesión: cerrar, recargar o retirar el perfil la descarta. Después de recargar solo se muestran registros que ya devolvió el servidor. No hay almacenamiento de identidad, credenciales o recibos inventados en el navegador. Un conflicto CAS queda por resolver; la acción explícita de recuperación conserva visit_id y arrival_ref, lee de nuevo y emite otro request_id para la visita definitivamente rechazada. No activar la interfaz hasta comprobar ese recorrido.

## Archivos e instalación

- `despacho-runtime/source/server/visitas.gs`: adaptador genérico, sin configuración privada.
- `visitas-portero.gs`: enlace al Portero r6-fast existente y preparación explícita de dos pestañas vacías.
- `visitas-aisladas.gs`: comprobación conectada que crea un archivo privado sintético NUEVO; no resuelve el libro de negocio.
- `despacho3d/visitas.mjs`: validación de recibos, recuperación, reintento y descarte de respuestas tardías.
- `os/despacho-conversation.js` y `despacho-transport.js`: carril de visitas con origen, ventana, época y esquema estrictos; conversación conserva su carril.

Primero comprobar la fuente actual contra la versión activa y conservar respaldo privado. Instalar los módulos sin publicar otra implementación. Ejecutar `YOD_verificarVisitasAisladas` y verificar las filas sintéticas por lectura directa. En el router privado, despachar exclusivamente `readVisits` y `recordVisit` a `yodDespachoVisits_(request)` dentro de su try, después de validar payload y antes del allowlist existente. Verificar que ninguna otra operación cambió. Ejecutar `YOD_prepararVisitas` una vez para crear solo las pestañas vacías. Publicar una versión nueva de la implementación EXISTENTE, conservando URL y permisos. Contrastar versión, fuentes y lectura autenticada antes de encender el interruptor en un PR posterior.

## Evidencia de aceptación

Las pruebas Node usan dobles de Sheets: atomicidad, reinicio de adaptador, pérdida de ACK, reintento después de otro registro, conflicto por actor/contenido/revisión, revocación tras bloqueo y antes de commit, corrupción y fórmulas, cola de llegadas, respuestas tardías y separación de carriles. No acreditan despliegue.

El 4-oct-2026 se ejecutó la comprobación conectada: 14 checks aprobados. La lectura independiente por conector confirmó exactamente dos visitas, dos recibos correlacionados y revisión 2; la pestaña original conserva su marcador. La captura y el archivo sintético quedan en el plan privado. No se instaló el router ni se actualizó la versión activa de Apps Script. Esta prueba acredita una visita y recibo idénticos después de crear otro adaptador, reintento sin duplicado, pérdida de ACK recuperable, CAS y actor ajeno rechazados y revocación sin escritura. Resultado capturado y filas cotejadas por el conector de Sheets. No llamar endpoints de negocio para probar escrituras ni usar clientes reales como datos de prueba.

Reversión: apagar el interruptor y volver a la versión previa de Portero. Conservar archivo, pestañas, visitas, recibos e historial.
