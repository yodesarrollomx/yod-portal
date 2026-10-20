# Ruiseñor · interacción y volúmenes

CHG-RUISENOR-INTERACCION-VOLUMENES-20261020 · 20-oct-2026. El frontend está implementado localmente; QA final, PR y Pages siguen pendientes de sus recibos. El piloto mantiene el PPP original, sus fórmulas, permisos y datos. Este cambio no instala Apps Script ni modifica hojas de negocio.

## Hablar y ver la acción

`despacho3d/agent-interaction.mjs` reconoce órdenes directas y acotadas del humano para abrir Plan, Trabajo, Expediente, versiones o una sección del PPP. Un texto cerrado puede ejecutar navegación. Los deltas de voz generan una tarjeta que exige confirmar el texto antes de navegar. Citas, documentos y prosa del agente no otorgan autoridad para ejecutar.

El controlador conserva una intención identificada y el contexto del caso. Agrupa eventos repetidos y conserva el límite real de una acción. `notifyInteraction` comunica al canal de voz una proyección acotada de la acción y evidencia, sin convertir una vista abierta en una escritura confirmada. El puesto muestra lo pedido, su estado, evidencia y siguiente paso; el avatar permanece visible.

| Ruta | Qué hace | Cuándo queda confirmada |
| --- | --- | --- |
| A · puente del PPP | Envía una solicitud de navegación al tablero original, que abre su sección mediante su controlador | ACK del mismo origen, ventana, nonce, caso, escenario, revisión y sección; el tablero comprueba la visibilidad |
| B · apertura visual asistida | Usa el controlador local de presentación `PPPView` y comprueba su sección; en legacy revela el `details` permitido. No roba foco ni dispara `click`, `input` o `change` | Sólo con contexto nativo fresco de la misma versión y una sección visible; en legacy permanece pendiente |
| C · intención recuperable | Conserva una tarjeta con confirmación o reintento y el límite encontrado | No certifica una acción no comprobada ni cambia cifras |

`workspace-navigation.mjs` rechaza respuestas ajenas o tardías y bloquea la navegación durante edición o cambios pendientes. Un timeout de A sólo permite intentar B porque ambas rutas son de presentación. No autoriza reenviar una mutación. Si existe una solicitud de cambio con resultado incierto, el controlador conserva su `request_id` y sólo consulta la conciliación del recibo original.

Una frase que pide cambiar viviendas, precio, torres u otro supuesto conserva la intención y puede abrir su sección. No convierte por sí sola los números reconocidos en una escritura. El editor nativo y su recibo siguen siendo la autoridad del cambio. Tampoco se añade un controlador general para operar Google Workspace u otras aplicaciones.

## Borrador de uno, dos o tres volúmenes

`ppp-volumes.js` ofrece un selector 1/2/3, inicialmente 1, limitado al contexto verificado del piloto. Cada borrador pertenece a `case_id`, `scenario_id` y `base_revision`; cambiar la revisión base no mezcla sus cantidades con otra versión. La captura vive sólo en memoria, se retira al revocar o salir y se puede descargar manualmente como borrador sin aplicar. Si cambia la revisión, ofrece revisar y continuar la propuesta anterior del mismo caso y escenario; sólo un clic explícito copia sus cantidades a la nueva base.

Cada volumen conserva campos independientes: nombre, niveles, viviendas, superficie construida, etapa, inicio y duración. Los campos sin información permanecen vacíos. Reducir el número visible conserva lo capturado para recuperarlo al volver a seleccionar ese volumen durante la misma sesión. Las sumas mostradas son únicamente cantidades capturadas y señalan información incompleta.

El borrador no cambia el Store del PPP, no activa autosave y no calcula utilidad, deuda, TIR o presupuesto. Elegir tres volúmenes no multiplica el resultado financiero vigente. La navegación del puente es de consulta y no concede permiso de escritura.

## Segunda etapa para decisión de Alejandro

La propuesta `VOLUMENESCANONICOS` está pendiente. Para que los cuerpos y sus etapas formen parte del plan financiero guardado, se necesita ampliar expresamente la restricción original «No tocar Apps Script ni Sheets». Publicar esta interfaz no autoriza esa ampliación.

El diseño a revisar es concreto:

1. **Modelo por versión.** Registrar `case_id`, `version_id`, revisión base, esquema y cuerpos con IDs estables. Cada versión conserva sus cuerpos, sus cantidades y sus etapas; el borrador de pantalla no sustituye ese registro. Guardar una alternativa crea la relación con su versión de origen y conserva la base inmutable.
2. **Compatibilidad con un cuerpo.** Representar el modelo anterior como un único cuerpo compatible, manteniendo entradas, fórmulas y resultados antes/después. Migrar por revisión con una comprobación explícita; no sobrescribir históricos ni crear copias ambiguas. Revertir código conserva las versiones y registros existentes.
3. **Etapas y consolidación.** Asociar cantidades, costos, ingresos, inicio y duración al cuerpo y etapa correspondientes. El libro canónico calcula y consolida los flujos con fórmulas nativas. El frontend presenta los resultados recibidos, sin otro motor financiero ni multiplicación por el número de cuerpos.
4. **Recursos compartidos.** Dar identidad y alcance explícitos a núcleos, elevadores y áreas comunes: propios de un cuerpo, compartidos entre cuerpos o generales. Guardar la asignación o regla aprobada, contar cada recurso una sola vez y mostrar el criterio de reparto. No inferir un elevador adicional por cada volumen ni repetir toda el área común automáticamente.
5. **Contrato de lectura y escritura.** Revisar primero las capacidades y endpoints existentes. Una extensión deberá declarar esquema y campos admitidos y verificar capability, actor, caso, versión y revisión dentro del servidor antes de escribir. El `request_id` estable conserva payload y resultado. Conflicto bloquea la aplicación; timeout o ACK perdido se concilia por la solicitud original, sin crear otro ID ni elevar la revisión para forzar el cambio.
6. **Migración y aceptación aisladas.** Probar un cuerpo legado, dos y tres cuerpos, etapas superpuestas, recursos comunes, cantidades incompletas, conflicto y reentrada. Comparar resultados y flujos contra el libro canónico. Sólo después de la ampliación aprobada, desplegar en la implementación existente y verificar recibos, identidad de código y lectura final; ninguna prueba escribe en un libro real para simular éxito.

No se han creado los endpoints, el esquema de hojas, las fórmulas de esta segunda etapa ni un despliegue GAS. Los nombres de campos anteriores son una propuesta de contrato para revisar, no una API disponible.

## Evidencia y reversión

Los bloques locales informados incluyen controller23, workspace-navigation27, live70 y boot10 nuevas más11 previas; el consumidor PPP informa una suite de150 pruebas. Son conteos de bloques previos al cierre de QA final, no una suma del total de Portal. La entrega debe reemplazarlos por resultados finales y distinguir pruebas sintéticas, integración, Pages, navegación privada y aceptación en dispositivo.

Las fixtures son `despacho3d/ruisenor-interaction-test.html` con su módulo sintético y `potenciales-yod/tests/fixtures/ruisenor-volumenes.html`. Las declaraciones de navegación y el pin de PPP en el workflow de comprobación sólo describen compatibilidad del frontend; no amplían permisos.

Recorrido previsto: escritorio y celular, órdenes de texto y confirmación de voz, A/B/C, contexto nativo frente a legacy, edición en curso, respuestas tardías, cambio de caso, selector por escenario y borrador sin red de negocio. La fixture no acredita audio físico ni guardado financiero.

Reversión del alcance actual: deshabilitar el routing y editor del piloto o revertir sus consumidores por PR. Conservar versiones, historial, recibos y permisos. No limpiar hojas ni restaurar importes para deshacer una interfaz.
