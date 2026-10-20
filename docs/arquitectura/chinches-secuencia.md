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
