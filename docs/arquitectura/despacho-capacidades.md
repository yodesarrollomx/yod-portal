# Capacidades compartidas de los agentes

Requisito del propietario: cada agente debe disponer de las capacidades operativas de la interfaz original, con su especialidad y expediente propios. No basta copiar paneles.

Referencia: [video de Leon van Zyl](https://www.youtube.com/watch?v=NBZmxhcz5lo) y [Cubefarm 0.3.2](https://github.com/leonvanzyl/cubefarm/tree/11237cf554f21312a2aecd9758d611f2817fc71e). Se compiló el código original y se inspeccionaron el teléfono, la terminal con captura de navegador el resumen de proyectos y el tablero Kanban en una instancia de demostración aislada. Esa demostración acredita la interfaz, no ejecución productiva de agentes YOD. No se obtuvo el audio o la transcripción completa del video.

| Capacidad común | Función de la referencia | Estado YOD comprobado |
| --- | --- | --- |
| Identidad y expediente | Agente con rol, instrucciones y proyecto propios | Resolución privada del expediente del piloto; registro de múltiples agentes pendiente |
| Chat y memoria | Instrucciones directas e historial | Dos turnos desde la sala, memoria recuperada y persistencia comprobados; cierre/reapertura confirmado por el propietario |
| Ejecución y control | Terminal en vivo, instrucción adicional y detener | Ejecutor acotado y eventos durables conectados; terminal interactiva y detener desde la sala pendientes |
| Tareas | Kanban con asignación y avance real | Columnas visuales y lectura de decisiones; gestor de tareas y asignación pendientes |
| Revisión QA | Verificación, captura, informe y devolución para corregir | No conectado al agente del expediente |
| Entregas | Vista previa de la app y evidencia de ejecución | No conectado al agente del expediente |
| Coordinación | Dirección, especialistas, propuestas y límites de sesiones | No conectado; piloto único |
| Disponibilidad | Servidor y sesiones que siguen trabajando | Launcher optativo de 30 minutos; alojamiento permanente pendiente |
| Voz y movimiento | Requisito adicional de la sala YOD | Pendiente después de aceptar conversación y memoria |

## Optimización del proceso

Un recorrido común: **instrucción → recibo guardado → ejecución → evidencia → revisión → resultado y memoria**. Cada paso conserva un identificador, estado y fecha. La pantalla distingue guardando, procesando, esperando datos/aprobación y detenido. Reabrir recupera el estado, sin repetir el trabajo.

Las lecturas de seguimiento son secuenciales. La siguiente empieza cinco segundos después de terminar la anterior, o diez cuando el turno supera 30 segundos. Una pestaña oculta no consulta. Después de tres minutos aparece un aviso y una acción de actualización. Si falta el recibo se reconcilia con el mismo ID; si el servidor confirmó que el trabajo se detuvo, solo el reenvío explícito crea otro turno.

Para todos los agentes se propone un único paquete versionado, con adaptadores por especialidad. Cada instalación debe resolver en servidor su identidad, expediente, herramientas y permisos; usar la misma cola durable y las mismas reglas de recuperación. El registro de capacidades debe indicar disponible, desconectada o pendiente, junto con su evidencia. Un agente no anuncia una herramienta que su adaptador no puede ejecutar.

La terminal original controla agentes de programación en worktrees; para agentes de negocio se necesita un adaptador de herramientas de su especialidad. No convertir automáticamente las tareas del expediente en GitHub issues ni las decisiones comerciales en merges. Los permisos y las revisiones humanas existentes siguen siendo la fuente de autorización.

## Orden de instalación y aceptación

1. Conversación, memoria, guardado y cierre/reapertura del piloto completados y confirmados por el propietario. Medir la optimización del servidor cuando se publique.
2. Establecer un servicio privado persistente para el motor y su transporte de eventos. Así su disponibilidad no depende de esta sesión de trabajo.
3. Conectar ejecución/control, tareas, QA y entregas a ese servicio, preservando los registros en Sheets y Drive.
4. Registrar cada agente con el mismo paquete, expediente, especialidad y límites propios. Comprobar que no lee ni ejecuta trabajos de otro agente.
5. Incorporar voz y acercamiento a los personajes.

La optimización de servidor agrupa las cuatro pestañas de fuentes en una llamada a Sheets, conservando los valores mostrados y la revisión del expediente. Se comprobaron equivalencia de revisión, frescura sin caché, límites y permisos. El paquete privado r2 está preparado para publicación manual; su latencia productiva aún no se ha medido.

La aceptación por agente exige una tarea auténtica: recibirla, ejecutarla con sus herramientas, mostrar la evidencia, guardar el resultado y recuperarlo al volver a entrar. Mientras falte cualquiera de esos pasos, la capacidad permanece pendiente. La propuesta se registra como `CHG-DESPACHO-CAPACIDADES-001`; este documento no acredita su instalación.
