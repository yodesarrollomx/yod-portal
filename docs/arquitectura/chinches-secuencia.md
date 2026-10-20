# Chinches · explicación sincronizada

CHG-CHINCHES-SECUENCIA-20261020. Orden de Dirección: alternativa de chinche con contexto, voz y dibujo paso a paso, compartida entre consumidores.

## Contrato y fuentes

El componente común registra una base visual congelada, eventos de trazos con reloj monotónico, fotogramas al terminar trazos y periódicos, audio original con su desfase y duración. IndexedDB conserva el paquete antes del envío; nunca localStorage para medios. Ninguna transcripción se inventa ni sustituye al audio original. Sin permiso de micrófono se conserva el dibujo y se informa el fallo.

El backend Sala valida la sesión existente. Un paquete JSON privado en Drive conserva medios y contexto; PRODUCCION conserva ID/huella y referencia privada. Archivo y registro se concilian por ID/huella bajo bloqueo, sin duplicar por respuesta perdida. El revisor recupera el paquete autenticado y verifica su huella antes de reproducir. Un marcador público nunca contiene audio, imagen, nota ni URL privada. No cambiar ACL, decisiones ni marcas editoriales.

## Cobertura

- Portal/OS/Obra/boards con shell: capturador central.
- Presentaciones y Master Brokers: copia controlada y adaptadores; conservar guards y transporte antiguo para chinches previas.
- Sala: alClavar debe reconocer paquete antes de su ruta antigua.
- Amalaya: copia independiente, origen y sesión propios; requiere adaptador autenticado propio, nunca transferir clave YOD.
- Evaluación360: capturador/identidad de participante independiente; requiere revisión y adaptador específico, no heredar permisos de editores.

## Verificación y activación

Registrar cobertura por consumidor y pruebas sintéticas: grabación/fin, denegación, cancelación, cambio de sesión, trazo/undo, reproducción/seek, recarga, cuota, hash, respuesta perdida, duplicado/conflicto, privacidad. Safari/iPad físico y despliegue GAS son comprobaciones distintas. No activar interfaz que prometa entrega sin backend confirmado. La implementación en Git no acredita despliegue GAS.

## Revisión

Ampliar la rutina diaria existente; conservar pausas y reservas. Inventariar todas las fuentes con corte/paginación, leer paquetes privados completos; incompleto no es revisado, recibido no es cumplido. El puente horario conserva su programación y sólo cosecha/concilia.

## Reversión

Revertir código consumidor y rutas nuevas, conservando archivos privados, IndexedDB, IDs, recibos y estados. No borrar originales ni reenviar operaciones inciertas.

## Micrófono en contenedores restringidos

El marco exterior de Apps Script observado el 20-oct-2026 no delega micrófono. Si la política del documento lo bloquea, la misma chinche abre `chinche/microfono.html` como ventana superior. Allí el usuario pulsa Grabar y concede micrófono; vuelve al dibujo para continuar. El audio vuelve exclusivamente al opener verificado por origen, ventana y nonce aleatorio, sin servidor intermedio. Cierre prematuro, rechazo o fallo no confirman entrega. La chinche conserva su reloj de trazos y capturas durante esa grabación. Prueba sintética: `node scripts/probar-microfono-marco.cjs`. Publicar primero el capturador antes de consumidores nativos.

## Audio Safari y recuperación · paquete1.1.0

El capturador acepta espacios y comillas en el parámetro `codecs` de audio MP4/WebM/Ogg. Antes de entregar normaliza sólo la cabecera MIME; conserva exactamente el payload y registra la cabecera original. No cambia el contenedor, transcodifica, borra audio ni convierte un error en una entrega confirmada. El servidor del protocolo1 existente acepta esta representación canónica sin cambios ni ampliación de permisos.

El borrador privado del aparato se escribe antes de validar y al recibir trazos/chunks. Guarda audio original, reloj, trazos, base y capturas; no viaja a Git ni a otro servidor. `Recuperar borrador` permite reabrirlo en la misma pantalla; `Descargar respaldo` funciona aun con audio rechazado o cuota agotada y `Importar respaldo` permite recuperarlo. Un respaldo de una grabación interrumpida puede contener audio parcial y se identifica como tal. Sólo la confirmación del guardado local de la chinche elimina su borrador; un recibo remoto continúa siendo un estado independiente.

Para una pestaña anterior ya abierta, **no recargar**: [rescate local](../../chinche/rescate.html) explica cómo cargar el ayudante en esa misma pestaña. El ayudante prepara cabeceras compatibles durante la lectura, restaura inmediatamente las APIs del navegador, ofrece descarga íntegra y del audio original y deja `Clavar` a cargo del humano. No sube medios ni clava automáticamente. Si no logra preparar el paquete, conserva la pestaña y comunica el fallo. Publicar una reparación no acredita haber recuperado la grabación particular de un iPad.

QA aislada: formatos Safari con espacios/comillas y payload idéntico; recuperación tras recarga de audio/trazos/capturas; cuota agotada y audio inválido conservados; rescate del compositor1.0.0 sin recargar; micrófono real sintético en ventana superior con política denegada en padre. La comprobación física del iPad y su recibo se registran separadamente.
