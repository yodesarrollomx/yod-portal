# Consulta común de la empresa y evaluación con Jev

Requisito del propietario, 3 de octubre de 2026: los agentes pueden obtener
información de las hojas interconectadas del diagrama y usarla para decidir qué
alternativa encaja con el proyecto. Toda respuesta conserva fuentes directas.
Propuesta `CHG-JEV-CONSULTAS-001`.

El catálogo se obtiene del modelo actual, no de una lista mantenida aparte.
Incluye los veinte almacenes lógicos `SHEET-*` de esta revisión. El número no
equivale a veinte archivos distintos ni a veinte conexiones operativas.

El [skill compartido](../../despacho-runtime/skills/yod-jev/SKILL.md) describe las
lecturas y selección de fuentes. El [módulo de consulta](../../despacho-runtime/source/jev/company-knowledge.mjs)
se ejecuta en el host privado del agente con sus adaptadores existentes.
No se carga como script del navegador y no altera el modo acotado de Conversación.

## Contrato del adaptador privado

`loadAtlas()` obtiene el modelo actual; `authorize({actor_id, source_id})`
resuelve permisos vigentes y devuelve `allowed`, `actor_id`, `source_id`,
`scope_revision` y `bindings`. Cada binding contiene `workbook_id`, `sheet_id`,
`sheet_title`, `range` A1 acotado y `allow_jev`. La identidad la proporciona el
host autenticado, no un parámetro elegido por el modelo ni una fila pública.

`readSource({source_id, grant, query})` hace lecturas nuevas de todos los bindings
y devuelve fragmentos con los mismos identificadores, `rows`, `revision` y
`read_at` ISO capturado al completar la lectura. El adaptador debe verificar
revisión antes/después del lote; un libro con múltiples pestañas no debe mezclar
revisiones. Un registro de familia, como los libros PPP, resuelve sólo los casos
autorizados. Cambios de archivo, alcance o permisos cambian `scope_revision`.

`verifySource({source_id, grant, expected})` comprueba la revisión nativa o relee
los rangos acotados y devuelve `source_id` y `current`, la lista actual de
`workbook_id`, `sheet_id`, `range`, `revision` y `data_digest` en el orden recibido.
Se compara antes de inferencia y al devolver el resultado. No implementar este
adaptador devolviendo simplemente `expected`: eso sólo sirve como doble de test.

La consulta contiene `query` y `source_ids`. La decisión añade `context` y entre
dos y dieciséis `options`, cada una con `id`, `description` y `source_ids`.
Los cálculos y restricciones obligatorias se resuelven en el motor del dominio.
La política del puesto fija `maxAgeMs` (máximo cinco minutos), `minConfidence` y
`minSupport`; los umbrales de los tests son ejemplos sintéticos, no una política
aprobada para la oficina.

Los datos y bindings se mantienen privados. Jev recibe únicamente contexto y
celdas autorizadas para procesamiento externo. La salida conserva enlaces a
rango, fecha, revisión y huella del contenido. Las referencias de la alternativa
son procedencia, no una certificación automática de que cada afirmación está
respaldada. Verificar las citas concretas contra sus fragmentos.

Una fuente requerida inaccesible o antigua detiene la inferencia. La revocación
o el cambio de alcance durante la llamada descarta el resultado. No existe
fallback a snapshots históricos, otra hoja o una decisión inventada.

## Activación pendiente

El módulo y el skill son preparación local. La instalación requiere adaptadores
privados para resolver y leer cada fuente, permisos por agente y política por
dominio. Los conectores de esta sesión no se transfieren a otros puestos.
La API key de este entorno tampoco acredita configuración en la Chromebook.

No se creó sincronizador, horario ni disponibilidad 24/7. La actualización
consiste en lectura al consultar; si el dato cambia después, la decisión conserva
su revisión y debe reevaluarse. El adaptador debe comprobar las revisiones antes
de aplicar una decisión a un estado posterior. Las fórmulas dependientes de
`IMPORTRANGE` y fuentes externas pueden seguir pendientes aunque la lectura sea
nueva: su vigencia se valida en el contrato del dominio.

Aceptar cada puesto con una consulta real autorizada, sus referencias y decisión,
persistencia y recuperación mediante la cola existente. No activar simultáneamente
todos los agentes ni ampliar permisos por instalar el paquete. Reversión: retirar
esta capacidad opcional; conservar datos, permisos, sesiones y tareas.
