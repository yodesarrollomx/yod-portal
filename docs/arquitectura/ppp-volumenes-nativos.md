# PPP de departamentos · volúmenes nativos

CHG-PPP-VOLUMENES-NATIVOS-20261020 · contrato previo actualizado el20-oct-2026, revisión `2026-10-20.ppp-volumenes-nativos.7`. Dirección autorizó volúmenes en todos los PPP de departamentos, no por agente ni sólo para un proyecto; permite modificar Apps Script, Sheets, backend/Render y publicar dentro de este encargo. La restricción inicial quedó sustituida.

El contrato reducido de siete campos era un borrador preliminar. La inspección del programa nativo confirmó21columnas, edificios diferentes, fórmulas ya conectadas y asignaciones explícitas de recursos comunes. Ese programa es la fuente de verdad: se conservan sus drivers completos y fórmulas protegidas. Unidades y superficie total derivadas no se convierten en capturas editables. La propuesta se registró antes de implementar el producto corregido. Hay fuentes locales de los consumidores y del servidor; migración, paridad numérica, backend activo y publicación requieren evidencia propia.

## Modelo y compatibilidad

Los volúmenes pertenecen a cada caso y escenario/versión nativa. Los existentes se leen con su número real: un programa de tres edificios sigue mostrando sus tres edificios y sus asignaciones originales. No se fuerza1 al abrir ni se transforma un programa de tres en una plantilla de uno.

La fábrica de un escenario nuevo comienza con un cuerpo desde una plantilla monovolumen nativa validada. Mantiene entradas, fórmulas y recursos comunes y comprueba paridad de resultados y flujos contra su baseline. Duplicar una versión conserva su programa, cuerpos, IDs, asignaciones y vínculo financiero por escenario; no reutiliza un programa global mutable. La versión base y los históricos se conservan inmutables. La entrega completa exige habilitar esta fábrica y la clonación para todos los PPP del alcance: dejar una capability desactivada por falta de plantilla es un estado pendiente, no la aceptación final.

Hasta16 cuerpos se soportan mediante una plantilla nativa generalizada y fórmulas de Sheets. Los accesos rápidos1/2/3 no sustituyen el límite anunciado por capability. Cuerpos inactivos conservan sus datos y no entran al cálculo. La tipología y el inventario se mantienen como información nativa separada; no se infieren de un nombre, promedio o cantidad total.

La superficie `mixto.html` conserva el tipo real `VERTICAL` del transporte. La capability depende del modelo y caso autorizados, no del nombre del proyecto, query o flag del agente.

## Alta de un proyecto

Antes de crear un proyecto, el consumidor lee la plantilla por el Portero autenticado con GET `recurso:"sheet-volume-template"`. La respuesta `kind:"native_factory_preview"`, `persisted:false` contiene `template_revision`, `inputs`, colección FULL de un cuerpo y `capability` schema2 con los 21 metadatos. Es una vista de plantilla sin proyecto creado y sin resultado financiero confirmado.

La pantalla exige revisar los 14 drivers del cuerpo y conserva los supuestos que el usuario ya capturó. El POST `guardar` existente lleva esos `inputs` originales, el seed WRITE de 14 drivers, `template_revision` y `native_body_reviewed:true`; no envía resumen ni flujo calculados en cliente. Si hay varias variantes locales, conserva todas y bloquea el alta hasta contar con el programa de cada una; no las colapsa a una variante. Una creación incierta se comprueba con su identidad original sin enviarla automáticamente otra vez. Esta sección describe el contrato y la fuente local preparada; ejecución del servidor y alta real se acreditan aparte.

## Los21 campos del programa

El esquema JSON compartido está en [ppp-volumenes-nativos.schema.json](ppp-volumenes-nativos.schema.json). Los IDs son estables. El servidor anuncia los metadatos de campo; el cliente nunca envía fórmulas ni declara qué puede editar.

| Columna nativa | ID del contrato | Tratamiento |
| --- | --- | --- |
| A | `name` | Driver: nombre |
| B | `footprint_m2` | Driver: huella |
| C | `open_courtyard_m2` | Driver: patio abierto |
| D | `residential_levels` | Driver: plantas residenciales |
| E | `units_per_level` | Driver: departamentos por nivel, promedio decimal |
| F | `units` | Derivado de Sheets, sólo lectura |
| G | `private_area_per_unit_m2` | Driver: área privada por vivienda |
| H | `private_residential_area_m2` | Derivado de Sheets, sólo lectura |
| I | `built_residential_area_m2` | Derivado de Sheets, sólo lectura |
| J | `commercial_ground_m2` | Driver: comercio en PB |
| K | `ground_services_m2` | Driver: servicios en PB |
| L | `covered_ground_m2` | Derivado de Sheets, sólo lectura |
| M | `gross_area_m2` | Derivado de Sheets, sólo lectura |
| N | `basement_area_m2` | Driver: sótano |
| O | `direct_cost` | Derivado de Sheets y recursos comunes, sólo lectura |
| P | `construction_start_month` | Driver: inicio de obra |
| Q | `construction_duration_months` | Driver: duración de obra |
| R | `construction_end_month` | Derivado de Sheets, sólo lectura |
| S | `sales_start_month` | Driver: inicio de ventas |
| T | `presale_months` | Driver: duración de preventa |
| U | `delivery_months` | Driver: duración de entregas |

Son14 drivers y7 derivados. `units_per_level` es `number` y su etiqueta es «Viviendas por planta · promedio», con paso `0.000001`. `residential_levels` sigue entero y `units` sigue entero de sólo lectura. La fórmula nativa de F es `ROUND(D*E;0)`; no se redondea el promedio a dos decimales. Esto conserva el resultado de los programas existentes con promedios enteros y permite totales que no son múltiplos de los niveles. El promedio es un supuesto de potencial, no un reparto uniforme ni un inventario por tipología. La comprobación de geometría debe usar el total redondeado nativo, y el cálculo confirmado sigue exigiendo la reconciliación del inventario real.

Ejemplo de instrucción al agente: «Pon 17 departamentos en este cuerpo y conserva sus tres niveles». Se propone `residential_levels:3` y `units_per_level:5.666667`; sólo la relectura de Sheets con `units:17` acredita el total. El agente muestra ese promedio, no afirma cuántos departamentos tiene cada piso ni inventa tipologías. Si falta identificar el cuerpo o la revisión, recupera ese contexto antes de preparar la propuesta.

 La etapa no se inventa como una columna adicional: calendario, etapas, tipología e inventario conservan su definición nativa. Los valores sin información permanecen ausentes; no se sustituyen por cero.

La inspección no encontró validación de datos en estas21columnas. Los límites técnicos propuestos son propios del transporte y se declaran como tales: texto hasta80caracteres; áreas0..1e9; plantas1..500; promedio de departamentos por nivel 0..1e6 con paso 0.000001; inicios0..1200 y duraciones1..1200. No se presentan como norma, restricción de mercado ni validación observada del libro. El servidor también comprueba las relaciones y coherencia del modelo nativo; pasar un límite técnico no acredita viabilidad. El flujo financiero heredado cubre los meses 1–120, con 120 filas en las 26 columnas de su calendario. Los límites del transporte hasta 1200 no amplían ese horizonte. Antes del lote de escritura se comprueban las ventanas de obra, preventa y entrega; un calendario incompatible se rechaza con `native_horizon_conflict`. Ampliar el horizonte exigiría extender y validar toda la cadena nativa de deuda, TIR y distribuciones.

## Wire compartido schema2

| Superficie | Estructura |
| --- | --- |
| Colección canónica | `{schema:2,count,shared_allocation_mode,volumes:[{id,values:{los21IDs}}]}` |
| Modelo leído | `volumes_by_scenario[escenario_id]` contiene la colección canónica |
| Capability | `capabilities.volumes = {schema:2,read,write,max_volumes:16,fields:[metadata21],allocation_modes:["preserve","built_area"],shared_resources:[{id,label}]}` |
| Metadata de campo | `{id,label,type,nullable,min,max,step,writable,derived}`; tipo es `text`, `integer` o `number`; límites sólo cuando correspondan |
| Colección enviada | `{schema:2,count,shared_allocation_mode,volumes:[{id,values:{sólo14drivers}}]}`; sin derivados ni metadata del cliente |
| Escritura | POST al mismo Portero: `tipo:"sheet-volumes"`, `caso_id`, `tipo_desarrollo:"VERTICAL"`, `escenario_id`, `revision_esperada`, `request_id` y `volumes` |
| Recibo | Modelo completo y `volume_receipt = {request_id,caso_id,escenario_id,base_revision,result_revision,volumes,calculated}`; colección FULL canónica releída |
| Conciliación | GET `recurso:"sheet-volumes-receipt"`, `caso_id`, `escenario_id`, `request_id`; devuelve modelo+recibo, rechazo prewrite acreditado o `operation_pending`/`receipt_not_found` |
| ACK normalizado | `{ok,request_id,case_id,scenario_id,revision,native_collection,calculated}` |

Se verifica `count <= volumes.length <= max_volumes <= 16` e IDs únicos y estables. En una confirmación vigente, el recibo FULL coincide exactamente con la colección del modelo; su proyección de 14 drivers, count, IDs y modo coincide exactamente con la solicitud. Un recibo histórico conserva el resultado original: si la revisión actual es posterior, GAS añade `volume_receipt_status:"superseded"` y devuelve el modelo actual por separado. El ACK es `status:"confirmed_superseded"`, con `revision` y `native_collection` originales, más `current_revision` y `current_collection`; no se compara el histórico contra las cifras actuales ni se reaplica la operación. Los derivados sólo llegan de Sheets. El cliente rechaza metadata inconsistente y sólo ofrece guardado con schema/capability de escritura y contexto confirmados.

La autenticación conserva el adaptador del Portero. El servidor resuelve actor, libro y destinos desde el registro: el payload no elige actor, permisos, nombre de hoja o fórmulas. Bajo el bloqueo y autorización vigentes, consulta el ledger de operación antes de CAS. El ledger durable reserva el estado `pending` antes de escribir cantidades. El lote atómico de Sheets escribe los bloques de drivers, IDs, count y el marcador de la misma operación `applied`, ligado a actor, contexto y huella del payload. La confirmación exige ese marcador y la colección nativa releída; después el ledger pasa a `confirmed`. Una coincidencia de cifras por sí sola no es un recibo. El mismo `request_id` con otro actor, contexto o payload se rechaza; una repetición sólo consulta su operación existente y nunca vuelve a aplicarla.

El GET es de sólo lectura para el negocio: no modifica drivers, fórmulas, count ni versiones. Sí puede reconciliar el ledger y escribir su auditoría para convertir una operación `applied` en un recibo `confirmed`. Esos metadatos se excluyen de la revisión de negocio. Un timeout o respuesta perdida conserva la solicitud para ese GET; no genera otro ID, eleva la revisión ni hace rollback automático. `operation_pending` no significa error ni éxito. La UI sólo afirma guardado después de recibo y relectura válidos. `calculated:true` exige manifiesto de fórmulas nativas validado y paridad comprobada; persistir cantidades y confirmar cálculo son estados distintos.

Un rechazo terminal antes de intentar el lote devuelve `error:"operation_rejected"`, `volume_operation_status:"rejected"` y `volume_rejection`. La prueba incluye request, caso, escenario, revisión base, actor, huella del payload, `stage:"prewrite"`, `write_attempted:false`, error y fecha. El consumidor valida todos esos vínculos y normaliza `status:"rejected"` con `prewrite_rejection`; sólo entonces puede cerrar la solicitud pendiente y permitir una propuesta nueva. No basta un timeout, `receipt_not_found`, texto de error ni un fallo después de intentar el lote. Los nueve códigos admitidos son `revision_conflict`, `active_driver_missing`, `protected_native_driver`, `native_formula_missing`, `native_formula_manifest_changed`, `native_geometry_conflict`, `native_horizon_conflict`, `shared_allocation_requires_reconciliation` y `volume_identity_conflict`.

## Programa, recursos comunes y cálculo

La extensión menos disruptiva lee y edita el programa nativo por versión; conserva sus21columnas y las fórmulas protegidas. No reemplaza la hoja de programa con el DTO preliminar ni corta el vínculo del Cuerpos global que hoy la consulta. El lector distingue el caso, escenario, hoja/plantilla nativa, revisión y huella de fórmulas. Los nombres concretos de hojas y registro se resuelven desde el backend, sin IDs privados en este documento.

Núcleos, elevadores, terreno y áreas comunes tienen alcance y asignación explícitos. Se mantienen las asignaciones existentes y cada recurso se cuenta una sola vez. No copiar el recurso íntegro a cada cuerpo ni normalizar sus pesos por elegir1/2/3. Una plantilla nueva necesita reglas nativas validadas. El manifiesto conserva la asignación explícita y la reconciliación de inventario original antes de sustituir agregados. La falta de una regla o de paridad deja la habilitación pendiente y se resuelve antes de dar la entrega por completa.

La revisión .7 incorpora `shared_allocation_mode:"preserve"|"built_area"` por escenario. `preserve` conserva los pesos nativos de PA y sigue exigiendo que la asignación activa sea válida. `built_area` permite conservar los mismos recursos del proyecto y redistribuir su costo entre los cuerpos activos por **área construida sobre rasante**: la fórmula de Sheets usa el área M de cada activo dividida por la suma M de los activos; el sótano N se excluye de esa base. Cada recurso se sigue contando una sola vez. Se conservan intactos los pesos PA originales para volver a `preserve`.

La pantalla y la propuesta del agente muestran el método y la lista de TODOS los recursos afectados, sin introducir precios en el DTO de política. Activar `built_area` exige selección y confirmación explícitas; cambiar de uno a dos o tres cuerpos no lo activa ocultamente. La capability plana anuncia `allocation_modes` y `shared_resources:[{id,label}]`, con IDs únicos y etiquetas legibles. No hay un objeto alternativo `shared_allocation`. Si faltan modo, áreas activas completas o una suma positiva, no se intenta el lote. La autoridad para admitir el método sigue siendo del servidor.

El modo se guarda por versión en la columna K del índice nativo y participa en la revisión de negocio, hash del payload, before/after, misma transacción de drivers/count/marcador y recibo FULL. Las fórmulas protegidas referencian el modo; no se reinstalan al alternar la política. El recibo superseded conserva también el método original separado del actual. Las nuevas fábricas y migraciones declaran `preserve` explícito. Un cliente no supone ese valor si el modelo lo omite.

Sheets es el único motor financiero. Sus fórmulas producen áreas derivadas, viviendas, costo directo, ingresos, deuda, utilidad y flujos por calendario/etapas. Navegador y servidor validan los drivers y transportan los resultados; no crean un motor JavaScript, promedio de edificios ni multiplicación del costo total por count. Los costos globales y sus drivers siguen en el modelo canónico.

## Puente y herramientas del agente

GAS devuelve las colecciones de los escenarios. El iframe comparte `volumes` del escenario observado y la capability schema2, con el mismo caso y revisión. El backend privado valida y usa el journal existente para leer, proponer y solicitar aplicación de `native_volumes`; el escritor sigue siendo iframe/GAS. Las herramientas no conceden acceso ni calculan finanzas.

El boot/controller de Portal está implementado localmente con navegación para todos los PPP autorizados por `ppp_enabled` y capabilities reales. El piloto sólo define la presentación Puesto2. Un `change_request` con escritura schema2 vigente pasa al chat o voz canónicos; la capa local no lo consume. Un mensaje humano enviado puede abrir el plan como presentación, sin iniciar micrófono. En classic se verifica el panel DOM visible y las tarjetas de confirmación/reintento viven en el chat; los deltas de voz siguen provisionales y no aplican cifras.

La propuesta conserva actor, caso, escenario, revisión base, `request_id` y14drivers. Sólo una lectura actual y confirmada con capability de escritura permite solicitar aplicación. El servidor espera un ACK de la colección FULL releída. La voz exige encargo humano explícito y los mismos controles; código integrado no acredita despliegue ni conversación física aceptada.

## Verificación y reversión

La fuente local de `PPPVolumesProgram` reserva la migración antes de copiar y religa programa y escenario. Exige las comprobaciones nativas de programa/inventario/asignaciones (`Y1`), conciliación de flujos (`Y2`) y comparación del baseline (`Y5`) antes de marcar el registro `ready`; un fallo queda `validation_failed`. Esto describe el código preparado, no acredita una ejecución en el libro activo.

Antes de habilitar: paridad de1 cuerpo con su baseline nativo y de3 cuerpos distintos con el programa vigente; comparación de los21campos, fórmulas y flujos; recursos compartidos una vez; plantilla nueva1 y ampliación hasta16 sin alterar históricos. Probar también campos ausentes, permisos, metadata adulterada, derivados enviados, CAS, duplicado de ID, marcador atómico, ACK perdido, igualdad externa sin marcador, reload, GET de conciliación y recibos superseded. El rechazo prewrite requiere prueba durable actor/contexto/payload; tras un intento incierto se mantiene pendiente. Verificar el horizonte nativo completo de 120 meses y las referencias de resumen después de ampliar el programa a 16 filas. La paridad de un cuerpo y de los tres existentes se demuestra con resultados numéricos y flujos aislados; una comparación de texto de fórmulas no la sustituye.

Portal .7 integrado sobre `7796d27`, conservando Sala y Chinches 1.1.0: **1,033/1,033 pruebas Node aprobadas**, verificadores de arquitectura, impacto, OS, portal y obra aprobados, accesos coordinados con PPP `c8691031cdb6305325b5d7a8981fdd7934993b37` y diff aprobados. Chromium completó el recorrido PPP colaborativo en 1280/860/390 px con servicios sintéticos, sin escrituras reales. El test se actualizó al texto vigente del botón de conciliación. Los imports de comportamiento usan `native-volumes3`/`multivolumen3` para evitar módulos anteriores en caché.

La fuente GAS .7 preparada sella las fórmulas del programa, escenario y PA; la revisión incluye valores y fórmulas de índice y esas tres hojas. El modo se escribe junto con drivers, IDs, count y marcador atómico. Estas comprobaciones de fuente y consumidor no sustituyen los recibos de ejecución financiera y publicación.

Publicar los consumidores y herramientas compatibles antes de habilitar el modelo .7 en el servidor/libro. La colección exige el modo explícito: un cliente anterior puede rechazarla y un consumidor nuevo no infiere una política ausente. Ese cierre seguro no sustituye la habilitación final del caso.

Las pruebas usan fuentes/libros aislados. El coordinador comprueba la fuente activa y el libro real fuera del repositorio; código, migración de modelo, backend, Pages y lectura final se acreditan por separado. Una fuente GAS preparada no demuestra que ya corra ni que un libro sea compatible.

Reversión: deshabilitar capabilities nuevas y volver a consumidores/handlers anteriores en las mismas implementaciones, conservando datos, IDs, recibos, ACL y versiones. No borrar cuerpos ni restaurar hojas o históricos a ciegas.
