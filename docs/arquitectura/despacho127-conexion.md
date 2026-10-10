# Despacho127 · igualdad de puestos y conexión

## 2026-10-09 · Diagnóstico
El propietario reportó que los otros personajes no abrían su puesto y sufrían demoras/cortes. La guarda de selección confundía un tablero abierto con voz activa. Los clics en figura y etiqueta seguían caminos diferentes y esperaban la red sin aviso. QA126 abría los tres puestos por código, sin acreditar esos clics.
Los logs privados muestran ráfagas periódicas de consultas de contexto y fallos transitorios; no se publican identidades ni contenido. La preparación de voz esperaba /fast/hello, que podía tardar más de su timeout. La credencial corta tampoco se renovaba durante una llamada.

## 2026-10-10T00:52Z · Implementación en rama
Se integra una única apertura para figuras/etiquetas, menú visible durante validación, reintento y explicación al intentar cambiar durante voz. Un puesto sin voz no bloquea cambiar de personaje. Se conserva aislamiento, cancelación de solicitudes tardías y validación exacta de caso.
La voz prepara mediante /voice/ready autenticado sin cargar documentos ni abrir micrófono; renueva credencial del mismo caso sin recrear la llamada, dentro del límite absoluto del backend. El servidor elimina consultas periódicas redundantes y conserva lectura de contexto autorizada bajo demanda.
backend_unavailable se clasifica como transitorio. La vigencia de autorización sigue en120s; no se extiende por fallos. El catálogo reintenta2/4/8/15s y se detiene al revocar. Pruebas añadidas para estos casos.

## Estado
Implementado en ramas; pruebas integradas y publicación pendientes. No se garantiza disponibilidad perpetua ni se acredita micrófono físico con dobles de prueba.
