# Despacho127 · igualdad de puestos y conexión

## 2026-10-09 · Diagnóstico
El propietario reportó que los otros personajes no abrían su puesto y sufrían demoras/cortes. La guarda de selección confundía un tablero abierto con voz activa. Los clics en figura y etiqueta seguían caminos diferentes y esperaban la red sin aviso. QA126 abría los tres puestos por código, sin acreditar esos clics.
Los logs privados muestran ráfagas periódicas de consultas de contexto y fallos transitorios; no se publican identidades ni contenido. La preparación de voz esperaba /fast/hello, que podía tardar más de su timeout. La credencial corta tampoco se renovaba durante una llamada.

## 2026-10-10T00:51Z · Implementación en rama
Se integra una única apertura para figuras/etiquetas, menú visible durante validación, reintento y explicación al intentar cambiar durante voz. Un puesto sin voz no bloquea cambiar de personaje. Se conserva aislamiento, cancelación de solicitudes tardías y validación exacta de caso.
La voz prepara mediante /voice/ready autenticado sin cargar documentos ni abrir micrófono; renueva credencial del mismo caso sin recrear la llamada, dentro del límite absoluto del backend. El servidor elimina consultas periódicas redundantes y conserva lectura de contexto autorizada bajo demanda.
backend_unavailable se clasifica como transitorio. La vigencia de autorización sigue en 120 s; no se extiende por fallos. El catálogo reintenta a los 2/4/8/15 s y se detiene al revocar. Pruebas añadidas para estos casos.

## 2026-10-10T00:55:30Z · Servidor publicado
Backend PR48 integrado en e55943540c3501784ec0a0d48d5432c504df9a46; Render dep-db4opn7lot8c73cfi7p0 live. Pruebas de backend: 288 aprobadas, una omitida, cero fallos, más navegador voz/PPP y proveedor. No se cambian plan, recursos, permisos ni implementación Apps Script.

## 2026-10-10T01:00Z · Verificación del portal
597 pruebas Node aprobadas, validadores y navegadores Chromium/WebKit aprobados. Recorrido adicional de clic en las tres figuras, radial y PPP aprobado. Recuperación de fallo temporal y aviso durante voz activa aprobados con datos sintéticos.
La regresión de voz esperaba todavía /fast/hello; se actualiza al contrato /voice/ready y se añade la comprobación de cero lecturas completas de contexto al preparar. Se conserva la exigencia de preparar antes de acercarse, sin micrófono ni sesión Live.

## Estado
Servidor publicado; interfaz en PR143. Cierre de las pruebas integradas y publicación del portal pendientes. No se garantiza disponibilidad perpetua ni se acredita micrófono físico con dobles de prueba.
