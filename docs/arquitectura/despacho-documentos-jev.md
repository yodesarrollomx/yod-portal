# Gastón · documentos y Jev

CHG-DESPACHO-DOCUMENTOS-JEV-071, autorizada el 5-oct-2026 y registrada antes del código. El agente pidió recibir el PDF original y sus páginas visuales; antes disponía únicamente de su enlace.

Publicado en servidor privado mediante PR3, PR5 y PR6, commit 9d27b746. Las tres rutas —chat rápido, voz y mensajes en cola— reciben el mismo servicio: Drive de sólo lectura, búsqueda y listado paginados, documentos/presentaciones/texto, Sheets con pestaña/rango/fecha y PDF real inline para visión/OCR. Jev orienta antes de investigar y ordena resultados; conserva todos los archivos y declara su indisponibilidad si falla. Ningún texto documental cambia instrucciones, permisos o decisiones.

El JSON inicial Live permanece exacto. Después de session.started se añaden sólo tools e instructions del backend y se espera session.updated. Las funciones se procesan en el servidor a partir de sus eventos completos, devolviendo resultados antes de continuar. Al cerrar se descartan continuaciones pendientes. Claves y PDFs permanecen en servidor privado. No se activan objetivos autónomos.

Fuentes y fechas quedan junto al historial existente. Texto y cola añaden referencias al resultado; voz conserva fuentes como anotación separada de los deltas exactos. Journal/outbox mantienen respaldo e IDs. Límite: 12 llamadas por turno de chat o sesión de voz, PDF de 15 MiB y lectura de 24.000 caracteres; se declara truncado y se continúa una búsqueda mediante su siguiente página. Un índice no acredita haber leído todo Drive.

**Verificado:** 73 pruebas del servidor y sintaxis en Actions, incluido caso/contratos estrictos, continuación por funciones, paginación, errores y fuentes durables. Render confirmó publicación. La comprobación HTTP puntual del run37274467241 confirmó las capacidades y la lectura visual del PDF real con Jev, después de otorgar lector a la cuenta interna existente sobre los archivos registrados del expediente. El recibo completo está en el volumen privado; no se escribieron turnos de prueba ni cálculos en Sheets. Se conservaron originales, URLs e IDs.

**Pendiente:** Dirección revisa la identificación de claves con página/posición y sus dudas en una conversación real, incluida la recuperación del historial; la prueba sonora con dispositivo conserva su aceptación separada. El estudio inmobiliario y las escrituras posteriores siguen por etapas. La interfaz se revisa antes de completar las demás funciones.

Reversión: YOD_RESEARCH_ENABLED=false conserva voz, JSON inicial, expediente e historial. Los permisos de lectura concedidos se revisan en la configuración privada de Drive; no hacer públicos los archivos.
