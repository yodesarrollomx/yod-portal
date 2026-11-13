# Consulta común de la empresa y evaluación con Jev

Requisito del propietario, 3 de octubre de 2026: los agentes pueden obtener
información de las hojas interconectadas del diagrama y usarla para decidir qué
alternativa encaja con el proyecto. Toda respuesta conserva fuentes directas.
Propuesta `CHG-JEV-CONSULTAS-001`.

## Prueba inicial: PPP y Gastón Madrid

El primer flujo cubre dos preguntas reales: comparar casos PPP y consultar el
uso de suelo del expediente Gastón Madrid / A-161. La política de esta prueba
rechaza elecciones de Jev con confianza menor a `0.92`; el host informa el
pendiente en vez de rebajar el umbral o repetir la pregunta para elevarlo.
En una pregunta `Choice`, `confidence` resume la concentración de la distribución
entre alternativas: `0.92` no significa que se haya medido una exactitud de 92%
en la oficina ni garantiza que la decisión sea verdadera. El respaldo `Noul` es
la probabilidad de que la evidencia apoye esa alternativa; tampoco reemplaza la
validación de la fuente y la cita ni la evaluación con casos etiquetados.

PPP consulta `SHEET-PORTERO` y `SHEET-PPP-MODELOS`. Gastón consulta esas fuentes
y `EXT-DRIVE` para recuperar documentos pertinentes. El lector privado de Drive
entrega texto extraído junto con el ID, MIME, título, revisión y enlace original;
PDFs sin texto recuperable o fuentes oficiales no identificadas cuentan como
evidencia faltante. No se confunde un escenario financiero con un permiso.

Las hojas se leen nuevamente por consulta. Los documentos se buscan en Drive y
se recuperan en el mismo turno; no hay una copia que prometa sincronía que aún
no se haya instalado. Cada fragmento conserva hora, revisión y huella. La
instalación debe conectar los dos flujos con IDs físicos privados. El catálogo
completo de veinte fuentes Sheets sigue disponible para habilitar otras áreas
después de validar su correspondencia, permisos y contrato.

Aceptación del piloto: (1) ranking numérico de PPP reproduce los campos nativos
de utilidad, margen y TIR, con Jev eligiendo la alternativa financiera cuando la
pregunta sea de criterio; (2) Gastón devuelve la clasificación oficial sólo si
una fuente vigente se vincula al predio. Si falta, Jev selecciona evidencia
insuficiente aunque una versión del modelo tenga nombre de escenario.

El catálogo se obtiene del modelo actual, no de una lista mantenida aparte.
Incluye los veinte almacenes lógicos `SHEET-*` de esta revisión. El número no
equivale a veinte archivos distintos ni a veinte conexiones operativas.

El [skill compartido](../../despacho-runtime/skills/yod-jev/SKILL.md) describe las
lecturas y selección de fuentes. El [módulo de consulta](../../despacho-runtime/source/jev/company-knowledge.mjs)
se ejecuta en el host privado del agente con sus adaptadores existentes.
El [piloto](../../despacho-runtime/source/jev/office-pilot.mjs) fija los dos flujos
iniciales y la política de 92%. No se carga como script del navegador ni altera el
modo acotado de Conversación.

## Contrato del adaptador privado

`loadAtlas()` obtiene el modelo actual; `authorize({actor_id, source_id})`
resuelve permisos vigentes y devuelve `allowed`, `actor_id`, `source_id`,
`scope_revision` y `bindings`. Cada binding contiene `workbook_id`, `sheet_id`,
`sheet_title`, `range` A1 acotado y `allow_jev`. La identidad la proporciona el
host autenticado, no un parámetro elegido por el modelo ni una fila pública.

`readSource({source_id, grant, query})` hace lecturas nuevas de todos los bindings
y devuelve fragmentos con los mismos identificadores, `revision` y `read_at` ISO
capturado al completar la lectura. Una hoja devuelve `rows`; un binding
`drive_document` devuelve `text`, `file_id`, `mime_type` y `title`. El adaptador
privado extrae texto con las herramientas autorizadas de Drive y conserva su
revisión. El adaptador debe verificar revisión antes/después del lote; un libro
con múltiples pestañas no debe mezclar revisiones. Un registro de familia, como
los libros PPP, resuelve sólo los casos autorizados. Cambios de archivo, alcance
o permisos cambian `scope_revision`.

`verifySource({source_id, grant, expected})` comprueba la revisión nativa o relee
el rango/documento y devuelve `source_id` y `current`, los identificadores,
`revision` y `data_digest` en el orden recibido. Se compara antes de inferencia y
al devolver el resultado. No implementar este adaptador devolviendo simplemente
`expected`: eso sólo sirve como doble de test.

La consulta contiene `query` y `source_ids`. La decisión añade `context` y entre
dos y dieciséis `options`, cada una con `id`, `description` y `source_ids`.
Los cálculos y restricciones obligatorias se resuelven en el motor del dominio.
`createOfficePilot` sólo admite `ppp_comparison` y `gaston_land_use`: el primero
lee `SHEET-PORTERO` y `SHEET-PPP-MODELOS`; el segundo añade `EXT-DRIVE`. El piloto
fija `maxAgeMs` en cinco minutos y tanto `minConfidence` como `minSupport` en
`0.92`. Una elección por debajo del umbral vuelve como revisión sin candidato
seleccionado. No se puede bajar el umbral pasando otra política al constructor.

Los datos y bindings se mantienen privados. Jev recibe únicamente contexto y
celdas autorizadas para procesamiento externo. La salida conserva enlaces a
rango, fecha, revisión y huella del contenido. Las referencias de la alternativa
son procedencia, no una certificación automática de que cada afirmación está
respaldada. Para Drive, la referencia conserva el archivo y el extracto textual;
verificar las citas concretas contra ese extracto.

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
