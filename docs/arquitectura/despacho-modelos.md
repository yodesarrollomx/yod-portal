# Preferencias de modelo del autón · paso 4

Propuesta autorizada; implementación en ramas separadas, sin integración ni despliegue. Motor apilado sobre PR50.

El perfil se registra dentro del libro operativo canónico del agente que resuelve Portero (config.operational_book). Una hoja de eventos de preferencias extiende ese registro: última fila conserva estado y recibo en una sola escritura, bajo el lock existente y ACL vigente. No hay padrón alternativo ni preferencias en localStorage. Actor, fecha, anterior/nuevo y petición quedan en el historial privado. El servidor crea los identificadores de ejecución temporal; fin, expiración o reinicio no trasladan ajustes a otra tarea.

El control está en Expediente → Conocer al autón. Modelos Luna/Sol/Astra, esfuerzos admitidos, alcance Predeterminado o Solo esta tarea y recibo. El navegador no concede permisos. Las operaciones pasan por la sesión vigente del Portero; el motor lee con firma de worker. Solicitudes inválidas no alteran el valor confirmado; datos almacenados inválidos se rechazan y el motor usa Sol.

La capa tarea prevalece sobre agente, entorno y base. Sala/objetivos consultan antes de cada llamada; Live usa session.update y acuse del proveedor, sin cambiar gpt-live-1 ni Jev. La fila de consumo conserva modelo, esfuerzo y origen por campo, capturado al inicio de cada respuesta.

Costo orientativo Standard, contexto hasta 272k: Luna 0.05×, Sol 1×, Astra 5× por token de entrada sin caché/salida; caché tiene proporciones distintas. Esfuerzo no tiene multiplicador fijo: más razonamiento puede consumir más tokens. Catálogo fijado según documentación oficial consultada el 10-oct-2026: https://developers.openai.com/api/docs/models/gpt-6-luna , https://developers.openai.com/api/docs/models/gpt-6.1-sol , https://developers.openai.com/api/docs/models/gpt-6-astra . No es presupuesto ni costo de voz.

No se altera el PPP, identidad, libros ni facultades comerciales. PR146 se integró durante el trabajo. Esta rama conserva sus cambios y parte ahora de main 9861edcb0aad518603a2693ed517403a4b03be94. PR51 del motor también se integró; sus pruebas de continuidad no se editan. Aceptación real y publicación son pasos separados de Dirección.

## Resultado y contrato implementado

Estado: implementado y probado en rama; no integrado ni desplegado. En el libro operativo existente, AgentModelPreferences guarda estado, auditoría y recibo en una misma fila. readModelPreferences y setModelPreferences usan la sesión vigente del usuario; modelTask requiere la firma del worker. La ACL existente de editores del caso más DP conserva la autoridad para editar, sin nuevas concesiones.

Solo esta tarea muestra únicamente ejecuciones registradas por el motor: conversación en curso, ejecución de objetivo o sesión de voz. Un ID nuevo por ejecución evita herencia al reanudar o reiniciar. Fin elimina el ajuste; una interrupción abrupta queda cubierta por caducidad de 180 segundos, renovada cada 60 mientras vive el ejecutor. La caducidad no transforma un ajuste temporal en predeterminado. El cierre fallido del proveedor y el recibo perdido no se presentan como éxito.

La lectura canónica precede a cada llamada de sala/objetivos; la voz abierta se actualiza después de guardar y sólo se confirma con acuse correlacionado. Si el acuse no llega, la ficha conserva el recibo de guardado y muestra que la voz sigue sin confirmar; Actualizar vuelve a leer y reintenta la aplicación. No se cancela ni se reetiqueta una respuesta ya iniciada. La bitácora añade model_source/effort_source (base, env, agent, task); Jev y el modelo de voz no se modifican.

Para revisión futura, preparar el parche sobre un snapshot privado fresco con scripts/prepare-model-preferences.mjs: sólo genera un archivo con hash esperado. No se ha generado ni enviado ningún parche sobre producción en esta entrega. La instalación exige la implementación EXISTENTE de Portero; nunca una nueva implementación. Un backend anterior deja los controles indisponibles y conserva el fallback del motor.

Pruebas: 603 aprobadas en portal; recorrido sintético de navegador en escritorio 1280×900 y móvil 390×900, sin desbordamiento, errores de página ni red externa. Verificadores OS, portal, accesos (ref a163c245d03128a93ab03d9a3f3e54a878c78171), obra y atlas aprobados. Se reconciliaron el atlas y los cache bumps con PR146 ya integrado; sus cambios se conservan. No hay solapamiento de archivos funcionales con PR51 del motor.
