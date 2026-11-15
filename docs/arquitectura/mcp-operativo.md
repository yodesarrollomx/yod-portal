# Conexión operativa del PPP con asistentes

Propuesta `CHG-YOD-MCP-OPERATIVO-20261115`, registrada antes de implementar.
El servicio compartido v0.1 acredita lectura de una liga. El objetivo de trabajar
desde los tres asistentes sigue abierto: no hay acuse de instalación personal.

Para los clientes que corren en el equipo se usa stdio. La conexión se inicia
en ese equipo y se autoriza en una página del propio PPP con el Portero actual.
La persona elige los planes y si permite cambios. El proceso local comprueba la
sesión con la API existente y guarda la conexión en un archivo privado. No se
pegan claves en conversaciones ni se crea otra base, identidad o motor financiero.
Las llamadas sucesivas releen ese permiso local; retirarlo detiene nuevas llamadas.

El adaptador consulta y modifica mediante las operaciones del PPP, conservando
sus permisos, revisión y bitácora. Devuelve el enlace a la misma ficha. Las cifras
deducidas mantienen su procedencia. El diario local guarda recibos y evita repetir
un resultado incierto: no sustituye la bitácora del libro.

La instalación utiliza los comandos nativos de Codex CLI, Claude Code y Hermes;
no reemplaza sus configuraciones completas. Una interfaz exclusivamente remota
necesita autenticación remota propia: esta conexión local no la acredita.

La aceptación exige conectar el cliente personal, leer un plan permitido y
comprobar una operación autorizada en su ficha. Las pruebas automatizadas usan
el código del servidor y la pantalla reales con datos inventados, no escrituras
en proyectos de producción. Se registran por separado desarrollo, publicación,
instalación por cliente y aceptación del recorrido privado.

La primera entrega cubre planes con libro (PPP 2), además del visor compartido.
La edición de motores clásicos, CRM y Obra requiere adaptar sus contratos propios.
No se promete aislamiento nuevo en sistemas ajenos a este cambio.

Reversión: desconectar el permiso local y retirar sólo esta entrada MCP. Conservar
historial y recibos; ningún cambio de fórmula, hoja o Apps Script que revertir.
