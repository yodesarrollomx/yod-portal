# Despacho: selección y lectura del catálogo

El backend puede responder `despacho_not_ready` cuando no existe un proyecto seleccionado. La oficina conserva entonces el estado de selección requerida: ningún perfil ni permiso se concede y el usuario elige un caso del catálogo autorizado. Un rechazo de autorización sigue retirando el acceso.

La lectura de `listAuthorized` dispone de un carril independiente. Una lectura lenta del catálogo no devuelve `transport_busy` a la resolución o lectura del caso elegido. Las lecturas idénticas conservan single-flight, y las respuestas tardías se descartan al cambiar la época de sesión. Las mutaciones mantienen su carril e IDs y no se reintentan.

Cambio acotado al frontend existente, sin elegir un proyecto por defecto, modificar ACL, instalar Apps Script, cambiar reglas de negocio ni ejecutar mensajes de prueba en producción. Los tiempos privados reportados motivan la regresión, pero esta entrega no mide ni certifica una mejora del backend.

Las regresiones de `tests/despacho-resident.test.cjs` cubren selección explícita sin autoridad, revocación, catálogo lento y descarte de respuestas de otra sesión. El PR registra los checks, SHA y publicación; la aceptación de sesión privada, voz y proveedor conserva su propio pendiente.

Reversión: revertir únicamente el frontend y su registro del atlas, conservando proyectos, hojas, historial, permisos y despliegues existentes.
