# Ruiseñor · cierre de interfaz y navegación
20-oct-2026. Encargo CG-RUISENOR-VOLUMENES-RESILIENCIA-20261020, continuación de CL-PUESTO-AGENTE-2-20261020.

La interfaz y navegación están publicadas. El guardado financiero por volumen y la aplicación de cambios por voz permanecen pendientes de ampliar el alcance original.

## Publicación comprobada
| Repositorio | PR | Merge probado en Pages | Resultado |
| --- | --- | --- | --- |
| yod-portal | [302](https://github.com/yodesarrollomx/yod-portal/pull/302) | b42173ffda031575d991498095ebacfc36ee06f4 | Pages39488693154 y tres workflows de validación success; 10/10 recursos HTTP200 y bytes idénticos |
| potenciales-yod | [39](https://github.com/yodesarrollomx/potenciales-yod/pull/39) | c8691031cdb6305325b5d7a8981fdd7934993b37 | Pages39489842000 y tres workflows de validación success; 6/6 recursos HTTP200 y bytes idénticos |

Los árboles remotos coinciden con las fuentes locales probadas. Los JSON adjuntos conservan recibos y hashes; el estado de workflows en online-ppp.json corresponde a su hora de consulta. Al cierre posterior, todos los workflows de ambos merges habían terminado en success.

## Comportamiento entregado
- Sólo el contexto autenticado del piloto Ruiseñor habilita el editor. Un query string no lo habilita.
- Cada propuesta pertenece al caso, escenario y revisión base. Empieza con un volumen y ofrece 1, 2 o 3. Campos independientes para nombre, niveles, viviendas, superficie, etapa, inicio y duración.
- La captura vive en memoria. Se puede descargar como borrador; se retira al salir o revocar. Cambiar revisión inicia una propuesta nueva y exige clic para continuar una anterior del mismo escenario.
- El texto directo puede abrir Plan, Trabajo, Expediente y secciones admitidas. El dictado parcial genera una confirmación antes de navegar. El micrófono físico sigue requiriendo toque.
- A solicita navegación al puente nativo y verifica su recibo; B utiliza el controlador local de presentación y comprueba contexto y visibilidad; C conserva una intención visible pendiente con reintento. Un bloqueo por edición, acceso o contexto detiene la acción. Ninguna ruta de navegación aplica importes ni acredita una escritura.
- Una petición de cambio permanece como intención hasta un recibo del editor nativo. No se inventan tipologías ni se llama guardado a una navegación.

## Validación
- Portal: 993/993 pruebas PASS; PPP:150/150 PASS. Verificadores de arquitectura, OS, portal, acceso, obra e impacto PASS.
- Chromium de pruebas separado, con recursos interceptados y datos sintéticos: HTML real de mixto, 1280×900 y390×844, navegación, asimetría entre volúmenes, continuidad explícita al cambiar revisión, bloqueo por edición, rechazo de contexto ajeno/tardío. Cero POST de negocio y cifras nativas intactas.
- Browser Chrome conectado, fixtures públicas de módulos reales: CSS1280×900 y390×843. A abrió y comprobó volúmenes; B abrió ventas con puente omitido; C dejó costos pendiente, y un reintento con A recuperado lo abrió. Dictado sintético dejó tarjeta provisional y sólo después del clic abrió ventas.
- Editor público: inicio1; selección3; captura por teclado de17/24/11 viviendas, total52; transición3→1→3 conservó los tres valores. Campos sin captura siguieron vacíos. Inputs nativos0, cambios nativos0; CSP bloquea conexiones, medios y formularios.
- En móvil, ancho documento390 sin desbordamiento. Caja de mensaje y avatar visibles junto al plan. Caja de conversación bottom780.76px en viewport843px; dialog incluye borde hasta843.73px. Override de viewport restaurado al terminar.
- Sin errores de consola en el recorrido. La escritura automatizada inicial con fill no disparaba change al rellenar sin foco; se verificó con teclado y cambio de foco reales, sin alterar código ni simular eventos desde evaluate.

Estas pruebas no acreditan micrófono físico, un turno de voz autenticado, aceptación en teléfono físico ni guardado/cálculo financiero por torre. No se escribieron casos reales.

## Evidencia visual
Todas las imágenes contienen exclusivamente datos sintéticos; el avatar es una figura de prueba.
- [Escritorio · tres volúmenes y conversación](desktop-volumenes.png)
- [Móvil · plan, selector y compositor](mobile-volumenes.png)
- [Móvil · conversación y acciones comprobadas](mobile-conversacion.png)

## Decisión pendiente para completar la interacción
El encargo original excluye Render, Apps Script y Sheets de negocio. Para terminar el comportamiento financiero y conversacional se propone ampliar el alcance exclusivamente para Ruiseñor:
1. Extender el contrato nativo por versión para cuerpos y etapas con IDs estables, revisión base y compatibilidad con un volumen. Fórmulas y consolidación siguen en el libro canónico; recursos compartidos se cuentan una vez.
2. Extender Apps Script y las Sheets existentes con validación de actor, permisos, caso, versión y revisión; cada cambio conserva un request_id y recibo consultable. Timeout se concilia con ese mismo ID antes de cualquier reenvío.
3. Conectar la intención de voz al contrato validado del backend del agente en Render: propuesta visible, aplicación autorizada, lectura del resultado nativo y explicación de diferencias. Acceso limitado al caso, sin controlador general de Workspace.
4. Probar migración, conflictos, reentrada y fallos sobre dobles/libros aislados antes de desplegar; verificar identidad de código y recibo de lectura final. Conservar base inmutable y reversión del código.

El detalle del modelo está en [la propuesta de arquitectura](../../arquitectura/ruisenor-interaccion-volumenes.md). No se han implementado ni desplegado esta segunda etapa, sus fórmulas, endpoints ni permisos adicionales.

