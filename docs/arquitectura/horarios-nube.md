# Horarios y vigilancia independientes de los chats

Dirección autorizó prioridad1 el11-oct-2026. El cron de GitHub y su propio monitor pueden dejar de emitir juntos. Se propone un vigilante residente en el Render existente con lectura cada5min, estado durable y recuperación de la última oportunidad autorizada.

El protocolo separa observar, reservar, solicitar ejecución y confirmar el job. No se reintenta automáticamente un POST de resultado incierto ni un trabajo fallido. Los workflows deshabilitados y las automatizaciones retiradas quedan fuera. Las pruebas viejas conservan su fecha y caducidad.

La GitHub App propia necesita Actionswrite y Contentsread únicamente en sala-edicion y yod-portal. El instalador web guarda la llave cifrada en el volumen privado; GitHub exige que la persona propietaria apruebe creación e instalación. El conector de desarrollo no sustituye ese consentimiento ni se exporta su credencial.

Hasta instalarla, se puede comprobar observación continua en Render; la recuperación sigue pendiente visible. El panel de Accesos muestra informe, hora, reservas y evidencias de ejecución por separado.
