# Chinches con audio y secuencia · entrega técnica

Las cinco integraciones principales se publicaron el20oct2026: Portal, Sala, presentaciones, Amalaya y Evaluación360. Fuente de estado técnico: [registro canónico](../chinche/registro.json) y [control de versiones](../chinche/control.html). El registro conserva por separado los recibos reales y la reproducción pendientes; no certifica la entrega por fuente o CI.

El [paquete reutilizable](arquitectura/chinches-paquete.md) fija release SemVer, formato de secuencia y huellas. La skill `instalar-mantener-chinches` instala, registra, propone actualizaciones coordinadas y aplica una reversión conocida. No volver a copiar o reescribir módulos manualmente por proyecto.

Audio MediaRecorder, trazos temporales, capturas intermedias y reproducción siguen en el mismo componente. Se conservan los adaptadores y autenticaciones de cada host, los IDs y el SHA256 del paquete privado. Amalaya publicó el backend original versión7; Evaluación360 versión40; Sala versión76 observada y77 reportada por el responsable conservando chinches. Los proyectos originales y permisos se mantienen. Estas referencias no sustituyen una prueba privada de recepción y reproducción.

La revisión usa [el registro](../chinche/registro.json), metadatos por fuente y `scripts/chinches-revision.cjs`: procesa nuevos, modificados y pendientes; no vuelve a cargar medios ya revisados con la misma huella. Una paginación incompleta conserva el corte anterior. La rutina diaria existente conserva horario, pausas y reservas; no se crea otra. Configuración no equivale a corrida exitosa.

Privacidad: no publicar audio, capturas, comentarios, nombres, respuestas, IDs de archivos privados ni llaves. Evaluación360 conserva su tarjeta técnica. Las fuentes indirectas no comprobadas y los borradores locales de otros dispositivos permanecen como cobertura desconocida.

Reversión: restaurar el bloque administrado y release anterior por PR, preservando IndexedDB, medios, IDs, recibos, permisos y registros privados.
