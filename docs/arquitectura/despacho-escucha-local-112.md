# Voz112: intervención y diagnóstico de conexión

Propuesta registrada antes de implementación: CHG-DESPACHO-ESCUCHA-LOCAL-112.
Base: voz111 más corrección de autenticación PR124. Continúa el paso 2.

## Antes y cambio

Escúchame ya silenciaba el audio en el navegador. Interrumpir hablando dependía
exclusivamente del proveedor. Se añade atenuación temporal sobre el mismo elemento
de audio al detectar entrada acústica sostenida en el stream ya autorizado.
El proveedor conserva la cancelación y respuesta semánticas; no se envían
instrucciones repetidas ni comandos nuevos. No se cierra la sesión ni sus tareas.

El monitor Web Audio toma muestras cada 40 ms, descarta impulsos menores que
120 ms, recupera salida tras 480 ms de silencio y deja de atenuar tras 8 s
continuos (hasta volver a silencio), para no bloquear salida por ruido ambiente.
Estos son parámetros del detector, no una promesa de latencia física.
Si falta Web Audio o la cancelación de eco está explícitamente desactivada,
continúa la conversación con interrupción del proveedor y Escúchame.
No se graban ni envían muestras adicionales. Se analiza sólo el micrófono abierto.
Pausa manual tiene prioridad; pausa de micrófono, suspensión, desconexión
y cierre liberan la atenuación automática. El transporte final permanece.

Audio y conexión muestra hitos acumulados desde iniciar: micrófono, acceso,
oferta WebRTC, respuesta del servidor, escucha, reproducción habilitada y contexto.
No se suman. Reproducción habilitada no demuestra sonido audible en el dispositivo.
No se añaden controles a la cápsula ni se abre el PPP automáticamente.

## Evidencia prevista

Pruebas de impulsos, señal sostenida, ruido continuo, suspensión, pausa manual,
cierre y tiempos por sesión; Chromium escritorio/móvil con Web Audio real y tono
sintético; regresión completa de arquitectura y portal. Aceptación en equipo real
y reducción de latencia remota pendientes. La precarga no abre sesiones OpenAI.

Reversión: revertir el PR del portal. Sin cambios de backend, Apps Script o datos.
