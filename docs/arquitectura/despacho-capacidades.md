# Capacidades compartidas de los agentes

Requisito del propietario: cada agente debe disponer de las capacidades operativas de la interfaz original, con su especialidad y expediente propios. No basta copiar paneles.

Referencia: [video de Leon van Zyl](https://www.youtube.com/watch?v=NBZmxhcz5lo) y [Cubefarm 0.3.2](https://github.com/leonvanzyl/cubefarm/tree/11237cf554f21312a2aecd9758d611f2817fc71e). Se compiló el código original y se inspeccionaron el teléfono, la terminal con captura de navegador, el resumen de proyectos y el tablero Kanban en una instancia aislada. El relevo privado aporta 68 fotogramas, seis detalles y un cotejo de 15 funciones con tiempos. Se leyeron la conversación original y las instrucciones de integración; el paquete completo de 369 archivos pasó la comprobación de integridad. Esa evidencia describe el objetivo y la maqueta; no acredita ejecución productiva de todas sus capacidades. No se revisó el audio completo del video.

| Capacidad común | Función de la referencia | Estado YOD comprobado |
| --- | --- | --- |
| Identidad y expediente | Agente con rol, instrucciones y proyecto propios | Resolución privada del piloto; padrón privado recibido con 56 identidades únicas, alias comprobados y estados separados. Registro no equivale a autorización ni motor instalado |
| Chat y memoria | Instrucciones directas e historial | Dos turnos desde la sala, memoria recuperada y persistencia comprobados; cierre/reapertura confirmado por el propietario |
| Ejecución y control | Terminal en vivo, instrucción adicional y detener | Terminal local interactiva comprobada en Chromebook, incluida continuidad al cerrar la pestaña. Modo Atender Despacho conectado a la cola y respuesta real persistida. El chat de sala usa un ejecutor acotado. Panel Terminal del piloto y runtime0.3 implementados y probados con PTY real y datos sintéticos; instalación en la Chromebook y aceptación de esta integración pendientes. No acredita herramientas instaladas en los 56 puestos |
| Tareas | Kanban con asignación y avance real | Preparación de una meta en Codex nativo desde Plan implementada para el piloto: el agente puede descomponer y guardar tareas locales. Asignación automática, tablero canónico y sincronización de tareas con Sheets pendientes |
| Revisión QA | Verificación, captura, informe y devolución para corregir | No conectado al agente del expediente |
| Entregas | Vista previa de la app y evidencia de ejecución | No conectado al agente del expediente |
| Coordinación | Dirección, especialistas, propuestas y límites de sesiones | No conectado; piloto único |
| Disponibilidad | Servidor y sesiones que siguen trabajando | Servicio local continuo mientras Linux está activo, con un solo proceso de agente. Disponibilidad 24/7 y recuperación tras reinicio físico pendientes de comprobar |
| Voz y movimiento | Requisito adicional de la sala YOD | Pendiente después de aceptar conversación y memoria |

## Optimización del proceso

Un recorrido común: **instrucción → recibo guardado → ejecución → evidencia → revisión → resultado y memoria**. Cada paso conserva un identificador, estado y fecha. La pantalla distingue guardando, procesando, esperando datos/aprobación y detenido. Reabrir recupera el estado, sin repetir el trabajo.

Las lecturas de seguimiento son secuenciales. La siguiente empieza cinco segundos después de terminar la anterior, o diez cuando el turno supera 30 segundos. Una pestaña oculta no consulta. Después de tres minutos aparece un aviso y una acción de actualización. Si falta el recibo se reconcilia con el mismo ID; si el servidor confirmó que el trabajo se detuvo, solo el reenvío explícito crea otro turno.

Para todos los agentes se propone un único paquete versionado, con adaptadores por especialidad. Cada instalación debe resolver en servidor su identidad, expediente, herramientas y permisos; usar la misma cola durable y las mismas reglas de recuperación. El registro de capacidades debe indicar disponible, desconectada o pendiente, junto con su evidencia. Un agente no anuncia una herramienta que su adaptador no puede ejecutar.

La terminal original controla agentes de programación en worktrees; para agentes de negocio se necesita un adaptador de herramientas de su especialidad. No convertir automáticamente las tareas del expediente en GitHub issues ni las decisiones comerciales en merges. Los permisos y las revisiones humanas existentes siguen siendo la fuente de autorización.

## Orden de instalación y aceptación

1. Conservar conversación, memoria, guardado y cierre/reapertura ya comprobados, y el servicio local con respuesta real persistida. No reinstalar la terminal para montar personajes.
2. Montar un personaje del caso resuelto por el servidor y un panel lateral de conversación, actividad y expediente. El perfil se obtiene por el mismo canal autenticado; el padrón nunca se publica como asset. La extensión privada de servidor y su publicación se verifican por separado.
3. Unir el puesto a ejecución/control, tareas, QA y entregas reales, preservando los registros en Sheets y Drive. El objetivo del video incluye terminal y vista previa (05:15), cinco columnas (07:18), revisor distinto con evidencia y devolución (08:00), cierre condicionado (08:45) y vista de escritorio/móvil (09:45).
4. Registrar cada agente con el mismo paquete, expediente, especialidad y límites propios. Comprobar que no lee ni ejecuta trabajos de otro agente. Dirección, altas y pisos por proyecto forman parte del objetivo; no activar 56 procesos simultáneos en la Chromebook.
5. Incorporar voz y acercamiento a los personajes.

La optimización de servidor agrupa las cuatro pestañas de fuentes en una llamada a Sheets, conservando los valores mostrados y la revisión del expediente. Se comprobaron equivalencia de revisión, frescura sin caché, límites y permisos. La posterior revisión r3 y el servicio de la Chromebook completaron un turno real. Línea base de ese turno: 66,501 segundos entre encolado y guardado; 8,726 segundos en cola y 57,775 en procesamiento más persistencia. No se separó el tiempo del modelo del de Sheets ni se midió cuándo apareció en pantalla. Es una observación, no una mediana ni una promesa de velocidad. Antes de atribuir la demora al modelo o al equipo, instrumentar esos tramos sin registrar claves ni contenido privado.

La apariencia sigue la etapa documentada y admite propuestas editables: infancia en primer contacto, crecimiento con el Plan de Potencial, formas adultas durante ejecución, robot sólo al formalizar codesarrollo y almas para proyectos aislados. Cambiar una figura no cambia la etapa, la identidad ni los permisos. Las deidades del equipo y los puestos de herramientas requieren aprobación e instalación individual. Una entrega animada debe corresponder a un evento real guardado una sola vez; caminar o mostrar una tarjeta no prueba que una herramienta trabajó.

La aceptación por agente exige una tarea auténtica: recibirla, ejecutarla con sus herramientas, mostrar la evidencia, guardar el resultado y recuperarlo al volver a entrar. Mientras falte cualquiera de esos pasos, la capacidad permanece pendiente. La propuesta se registra como `CHG-DESPACHO-CAPACIDADES-001`; este documento no acredita su instalación.

## Puesto de terminal · 3 de octubre de 2026

La [capacidad de consultas y decisiones con Jev](jev-consultas.md),
`CHG-JEV-CONSULTAS-001`, se prepara como paquete opcional compartido para los
puestos nativos. Descubre todos los almacenes Sheets del atlas, relee los rangos
autorizados y conserva fuentes/revisiones. Los adaptadores privados y la
instalación por agente siguen pendientes; no cambia el ejecutor acotado del chat.

La [actualización local 0.3](../../despacho-runtime/README.md) conserva login, keeper, workspace, vínculo y checkpoint. El panel recibe pantalla y teclado mediante una ventana local consentida, ligada al caso autorizado. Conectar no inicia procesos; iniciar, reabrir y detener son acciones explícitas. Cerrar el panel conserva la sesión; retirar el acceso limpia la vista sin matar el proceso. Una sola sesión manual o de sala a la vez. La sesión manual no escribe automáticamente su pantalla ni sus cambios en Sheets.

Se comprobaron entrada/salida de PTY, reapertura, revocación, aislamiento de origen y la vista de 1280 y 390 píxeles con backend y ejecutor sintéticos. El paquete extraído también pasó la regresión nativa; el modo de sala pasó enlace firmado, ejecución, persistencia y recuperación sintéticos. No son una prueba de instalación en el equipo del propietario, ni una medición de su velocidad. La terminal requiere estar en la misma Chromebook; no hay túnel para acceder desde otro equipo.

El despliegue Apps Script r4 respondió al metadato de versión y su fuente activa coincidió con la entrega privada; se conserva la URL existente. La aceptación visual autenticada del nuevo puesto se registra después de actualizar el equipo. Tareas, QA, vista previa, entregas, coordinación de especialistas y voz permanecen pendientes de conexión operativa.

## Primera meta con herramientas · 3 de octubre de 2026

El ejecutor de Conversación está acotado a leer una instantánea y responder, con herramientas deshabilitadas. La terminal nativa sí mantiene herramientas locales y los permisos existentes. Plan prepara un encargo para esa sesión: objetivo, criterio de cierre, identidad/revisión, carpeta de tareas y evidencias, sin copiar código ni actualizar el runtime0.3. El propietario confirma que Codex muestra su entrada vacía; el panel pega texto acotado sin Enter. Sólo el propietario envía desde la terminal. No se inicia ni detiene ningún proceso por preparar una meta.

El agente debe verificar expediente.json contra el caso y revisión, proponer tareas, ejecutar las acciones locales autorizadas y comprobar sus resultados. Los documentos se tratan como evidencia y la copia se identifica como instantánea local. Los archivos en metas/ pertenecen a la ejecución local: no son el tablero canónico, no se sincronizan automáticamente con Sheets y no acreditan revisión independiente. No se presupone que Gmail, Drive u otros conectores están instalados en Codex.

Una ejecución real de Codex autenticado, en un entorno de preparación separado de la Chromebook, leyó una copia recién obtenida de cuatro pestañas del expediente y evidencia técnica, produjo diagnóstico y plan con seis tareas (tres realizadas, tres pendientes) y comprobó referencias/JSON/archivos. Ejecutó tres comandos de herramientas, con salida correcta, durante 128 segundos. Los resultados y recibo se guardaron y releyeron en Drive privado; no se publican datos aquí. Esta ejecución no demuestra trabajo autónomo, instalación de herramientas externas ni ejecución física en la Chromebook. La propuesta CHG-DESPACHO-META-TERMINAL-001 mantiene esas distinciones.
