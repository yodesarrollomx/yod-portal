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

## 2026-10-10T01:09:42Z · Interfaz publicada
PR143 integrado en dc5233b7dde5fed77fa473620fce36f2bb6e6880. Pages38012047418 finalizó correctamente. La cabeza probada5699769f tiene el mismo runtime que la matriz visual286ae; los commits intermedios sólo ajustan expectativas de pruebas y bitácora.

Todos los controles de la cabeza5699769f aprobados: 597 pruebas Node, verificar, arquitectura, Chromium/WebKit y recorrido integrado38011488972, incluida voz y PPP colaborativo.
La matriz privada38011244981 comprobó clic real de las etiquetas de tres proyectos, mismos cuatro sectores, PPP propio, inicio y cierre de voz con case_id correspondiente, recuperación de backend_unavailable y resolución demorada5s. El clic real sobre las tres figuras se acredita en38010902615 job114090411929. Se inspeccionaron capturas; no hay contenido cruzado.

## Cambio concreto de la guarda
Antes, abrir el tablero bloqueaba otro caso aunque no hubiera conversación:
```js
beforeSelect: () => ['idle','error'].includes(voicePhase) && !window.YodVoiceWorkspace?.isOpen?.()
```
Ahora sólo la voz activa protege el caso:
```js
beforeSelect: () => ['idle','error'].includes(voicePhase)
```
Las dos superficies de clic delegan en resident-opening.mjs, que muestra preparación, valida autorización exacta y descarta respuestas canceladas o de otro caso. El menú abierto no concede permisos.

## 2026-10-10T01:01:23Z · Observación del servidor después de publicar
Logs completos durante5min53s: cero context-read/context-timing, lock_busy, motores detenidos o errores de voz. Antes se observaron cinco lecturas juntas a00:47Z (dos lock_busy) y otras cinco a00:52Z. La ráfaga no reapareció en la ventana observada; no se usa esa ausencia para afirmar latencia foreground.

## Resultado y límites
Corrección127 publicada. La validación de voz utiliza audio, identidad y PPP sintéticos: no acredita el micrófono físico del propietario ni latencia real de Sheets. Los tiempos del recorrido de navegador incluyen autoesperas de Playwright y renderizado SwiftShader; no se presentan como latencia del producto ni mejora50%. No se garantiza disponibilidad perpetua ni se acredita micrófono físico con dobles de prueba.
