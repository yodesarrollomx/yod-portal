INTERFAZ CUBEFARM EN EL DESPACHO YOD

Fuente: https://github.com/leonvanzyl/cubefarm, versión0.3.2, revisión11237cf554f21312a2aecd9758d611f2817fc71e. Licencia MIT de Leon van Zyl preservada. Los originales y sus hashes están en vendor/cubefarm y provenance.json.

El botón Agentes abre conversación, actividad y plan sobre la oficina YOD/Aurum. La identidad y los registros privados vienen del transporte autorizado del OS, nunca del bundle público. Cada operación requiere autorización del servidor.

El primer mensaje real desde la sala, su respuesta autenticada y su guardado en Sheets están comprobados. La memoria en un segundo turno desde la sala sigue pendiente. El runtime atiende bloques optativos de30minutos; no está establecido un servicio permanente.

La actividad es un registro de eventos, no una terminal interactiva. Plan muestra decisiones, no un gestor de tareas conectado. Terminal, tareas, QA, entregas y coordinación están pendientes; consultar docs/arquitectura/despacho-capacidades.md. El demo original sirve solo para inspeccionar la referencia y nunca alimenta el expediente.

El seguimiento de conversación es común: lecturas secuenciales, pausa en pestaña oculta, intervalo5/10segundos y aviso tras3minutos. Solo un clic explícito reenvía un mensaje detenido; un ACK perdido conserva suID. Cerrar o cambiar sesión descarta datos y respuestas tardías. Las Chinches mantienen su recorrido.

Reconstrucción: node despacho-agents/build.mjs /ruta/absoluta/al/cubefarm-instalado. Las dependencias originales proporcionan React, ReactDOM, esbuild y PostCSS. El servidor original Node/PTY no se publica en GitHub Pages. Sin API de pago, automatización horaria ni voz activadas.
