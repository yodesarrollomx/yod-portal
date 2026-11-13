# Plan de implementación por entregas

Objetivo: satisfacer R01–R15 de la comparativa. Estas entregas son propuestas, salvo el parche 001 que está preparado y probado localmente. Cada PR de código debe registrar antes su alcance en el modelo y `architecture-impact.json`, comprobar compatibilidad con la rama vigente y aportar evidencia de su entorno.

## A. Hacer accesibles las funciones que ya existen

**Archivos:** `despacho-agents/Agents.tsx`, `aurum.css`, `README.txt`; ayuda de `despacho3d/index.html`; `docs/arquitectura/despacho-capacidades.md`.

- Aplicar el parche 001 siguiendo [su guía](04-aplicar-parche.md): cinco accesos principales y superficie amplia para Tareas y Terminal.
- Corregir las descripciones antiguas. Texto sugerido para la ayuda: «Agentes abre conversación, expediente, tareas, terminal y actividad. Las tareas se habilitan cuando el motor autoriza sus metas. La terminal requiere conectar tu equipo. Puedes dictar y escuchar respuestas si tu navegador lo admite. El tablero con revisión y entregas se incorporará al completar su conexión.»
- Sustituir en el README las afirmaciones globales de funciones «pendientes» por cuatro estados: código disponible, runtime instalado, conexión disponible y recorrido comprobado. No convertir los reportes históricos en una nueva verificación.
- Mantener conversación, expediente y actividad; conservar las características de los avatares YOD/Aurum.

**Cierre:** terminal accesible con un clic; `CubefarmYOD.open('terminal')` abre esa pestaña; tareas legibles en escritorio y móvil. Compilación, verificaciones del portal y recorrido de foco sin regresión. Esta entrega reduce fricción, pero no cierra R08–R12.

## B. Declarar capacidades reales y diagnosticar la generación

**Archivos existentes:** `despacho3d/conversation.mjs` y transporte de casos, `despacho-runtime/source/runtime/backend-adapter.mjs`, `worker.mjs`, `codex-cli-executor.mjs`; contrato privado del servidor que resuelve el perfil. **Propuestos:** `despacho3d/capabilities.mjs`, `despacho-agents/CapabilitiesPanel.tsx`.

- Acordar una respuesta versionada del servidor: identidad autorizada, revisión del adaptador, capacidades, estado de conexión, última evidencia y límites de concurrencia. No insertar campos arbitrarios en respuestas que el cliente actual valida estrictamente.
- Distinguir al menos conversación, terminal, análisis de metas, modificación de archivos de trabajo, navegación, captura, vista previa, QA y entrega. Para cada una: `available`, `disconnected`, `unsupported` o `unverified`, con evidencia verificable y texto de acción para el usuario.
- Verificar qué ejecutor atiende realmente el trabajo. El ejecutor conversacional actual usa `--sandbox read-only`, `features.shell_tool=false` y `web_search="disabled"`. Implementar un adaptador de ejecución de tareas con herramientas explícitas y espacio de trabajo aislado; conservar el alcance de la conversación del expediente. Un indicador en el cliente no habilita herramientas en el servidor.
- Registrar por `job_id` y entorno: aceptación, toma de trabajo, comienzo de ejecución, primera salida si el adaptador la ofrece, fin y guardado. Así se distingue cola detenida, modelo lento, herramienta fallida y resultado no persistido. Mostrar al usuario el estado y el próximo paso; reservar detalles técnicos para diagnóstico.
- Reintentos conservan identidad y no duplican trabajo. Inicio/detención deben informar cuándo se aceptó la orden y cuándo el proceso realmente cambió de estado.

**Cierre:** una tarea sintética por capacidad produce un artefacto comprobable; al desconectar su adaptador cambia el estado correspondiente. Reportar tiempos medidos, sin prometer latencia o disponibilidad sin observarlas. Depende de A para la presentación; habilita C–G.

## C. Tablero de cinco columnas sobre tareas canónicas

**Archivos existentes:** `despacho3d/goals.mjs`, `despacho-agents/DurableGoalsPanel.tsx`, transporte autorizado de `os/app.js`; persistencia y endpoints del backend. **Propuestos:** `despacho3d/task-board.mjs`, `despacho-agents/TaskBoard.tsx`.

- Acordar primero un contrato de tareas versionado. [El ejemplo](contrato-tarea.example.json) describe los campos propuestos; el esquema vigente de metas rechaza campos adicionales. Mantener `readGoals/createGoal/reviewGoal` y metas históricas hasta completar una migración probada.
- Cada tarjeta conserva `case_id`, `goal_id`, `task_id`, revisión del expediente, ejecutor asignado, ejecución, criterio de aceptación, evidencias, revisión y entrega. Una tarea heredada `task-1` solo es única dentro de su meta: usar la clave compuesta, sin reasignar IDs históricos.
- Etapas nuevas: `backlog → in_progress → in_qa → ready_for_delivery → delivered`. Para repositorios, las últimas dos se presentan como «Listo para integrar» e «Integrado» y corresponden a PR/checks/merge. Para otros entregables: «Listo para entregar» y «Entregado», sujetos al flujo del proceso.
- Un estado `ready_for_review` de la meta actual significa «Por revisar»; no demuestra entrada a QA, QA aprobado ni entrega. Mostrar metas heredadas en su vista compatible hasta disponer de una conversión explícita.
- Toda transición se valida en servidor con `expected_revision` y `request_id`. Un reintento usa el mismo ID; un conflicto obliga a recargar. La lectura nunca inicia trabajo. Una tarjeta no cambia de etapa permanentemente por arrastrarla en el cliente.
- Añadir contadores y filtros por ámbito, agente y bloqueo. Ofrecer selección de etapa mediante botón/menú además de arrastre. Las metas pausadas o pendientes de datos muestran su bloqueo sin inventar progreso.

**Cierre:** crear, asignar, iniciar, bloquear, reanudar y revisar una tarea con evidencia; recargar devuelve la misma tarjeta y etapa; ACK perdido no duplica; eventos atrasados no revierten una revisión más reciente. Requiere B y contrato de backend antes de declarar Kanban operativo.

## D. Terminal, última captura y vista previa

**Archivos existentes:** `despacho-agents/TerminalPanel.tsx`, `despacho3d/terminal-link.mjs`, runtime de terminal local. **Propuestos:** `ArtifactPreview.tsx`, `AppPreview.tsx` y adaptadores del runtime correspondientes.

- Conservar el PTY y su protocolo actual. Montar a su derecha la última captura producida por la herramienta de navegador para la tarea seleccionada. Encabezado con agente, tarea, estado y controles reales de detener/continuar.
- El artefacto incluye ID, caso, tarea, ejecución, revisión, fecha, tipo MIME, dimensiones, hash y referencia de acceso autorizada. «Sin captura» y «Captura anterior a esta revisión» son estados distintos. No usar imágenes de muestra como evidencia de una ejecución.
- La aplicación en vivo usa un recurso de vista previa independiente: ID de ejecución, revisión, estado del proceso y endpoint accesible desde ese usuario. Un `localhost` del worker no funciona desde otra máquina. No resolverlo publicando puertos sin un mecanismo de acceso definido.
- Adaptar iniciar, reiniciar, detener y recargar a órdenes reales del runtime. Escritorio/teléfono cambia el tamaño del visor, no la identidad de la entrega. El iframe se limita al origen y capacidades acordados para esa vista previa.
- Cerrar un panel no finaliza el trabajo. Desconectar o detener son operaciones explícitas; restablecer el vínculo recupera la misma ejecución cuando sigue vigente.

**Cierre:** una tarea sintética cambia una aplicación, produce captura e informe, y abre esa revisión de la app desde su tarjeta. Un segundo usuario/equipo ve la dirección correcta. Al detener el proceso, el visor informa detenido; no conserva una falsa señal de funcionamiento. Requiere B y C.

## E. Revisión independiente y entrega

**Referencia de adaptación:** `server/swarm.ts`, `server/mergeGate.ts` y `shared/types.ts` de Cubefarm. **Propuestos en el runtime YOD:** adaptadores `task-review` y `delivery-gate`; módulos cliente de lectura de informes.

- Separar ejecutor y revisor. Registrar revisor, ronda, revisión exacta del artefacto y evidencia de las comprobaciones. Cambiar el resultado invalida una revisión anterior.
- QA evalúa el criterio de aceptación y las pruebas específicas de la tarea. Un fallo devuelve hallazgos al ejecutor y conserva el historial; limitar rondas y concurrencia para evitar bucles indefinidos.
- En software, comprobar el SHA del PR, checks requeridos y reglas de integración existentes. La disponibilidad de un botón no sustituye esos controles. Para negocio, el adaptador entrega un resultado al proceso actual; no interpreta `completed` como aprobación comercial.
- Persistir un recibo de entrega con resultado, revisión, destino lógico, evidencia y estado. Recuperar un ACK perdido no repite una entrega ya efectuada.

**Cierre:** prueba que falla → devolución → corrección → nueva revisión → entrega verificable. Una aprobación obsoleta, una auto-revisión o una confirmación incompleta no pueden marcarla entregada. Requiere C–D; cierra R10–R11.

## F. Oficina con trabajo visible y varios agentes

**Archivos:** `despacho3d/office.js`, `office.css`, `avatars/office-pilot.mjs`, `avatars/adapter.mjs`; nuevo controlador de oficina para varios perfiles y contrato de catálogo autorizado.

- Implementar primero el catálogo y la selección autorizada por servidor. Hoy `resolveCurrent` y el piloto representan el caso permitido; no basta cambiar el array del avatar ni aceptar cualquier `case_id` enviado desde el navegador.
- Situar los agentes autorizados en puestos, con nombre, rol, tarea resumida y estado real. Al cambiar de perfil, revocar referencias anteriores y limpiar datos tardíos; seleccionar puesto, tarjeta o avatar converge en el mismo expediente.
- Entrada a altura humana orientada al conjunto de puestos, manteniendo «Ver todo» para el plano general. Monitores y tablero mural abren Terminal y Tareas. El resumen global cuenta solo trabajos del ámbito autorizado.
- Animaciones de trabajar, esperar y bloqueo se alimentan de eventos. Un agente desconectado no escribe eternamente. Conservar los modelos y rasgos YOD/Aurum ya preparados; acercar la presentación al video mediante composición, interacción y densidad, sin sustituir esas identidades.
- Reutilizar geometrías/materiales cuando corresponda; un único ciclo de renderizado, pausa cuando la pestaña se oculta y soporte de movimiento reducido. Medir coste con la plantilla autorizada prevista; no abrir un proceso por cada mueble o avatar.

**Cierre:** dos agentes sintéticos con tareas distintas muestran sus estados correctos, cada clic conserva identidad, ningún dato cruza de expediente y ocultar el panel reduce actividad. Comprobar escritorio y dispositivo móvil de destino. Requiere B–C; seguir [el contrato visual](03-diseno-y-aceptacion.md).

## G. Director, teléfono, contratación y proyectos

**Propuestos:** `DirectorPhone.tsx`, `AgentSetup.tsx`, `ProjectDirectory.tsx`; adaptadores de coordinación, catálogo y configuración de motor. Referencias: `Phone.tsx`, `ManagerConsole.tsx`, `SetupWizard.tsx`, `ElevatorPanel.tsx`, `server/ceo.ts`.

- Teléfono con conversación del director, incorporaciones, compañía y juegos; conservar acceso claro al expediente del agente seleccionado. Teléfono compacto, tablero y terminal amplios.
- El director crea encargos y consulta resultados de C–E. Una orden debe tener correspondencia con sus tareas y ejecutores; un mensaje en pantalla no acredita delegación.
- Incorporar/habilitar un agente valida identidad, especialidad, herramientas, permisos, proveedor, modelo, esfuerzo y cupo de ejecución. Una instalación ausente impide iniciarlo y ofrece un siguiente paso comprensible.
- Directorio de pisos/proyectos enlaza los ámbitos autorizados. Diferenciar origen de software (GitHub/local/nuevo) y expediente de negocio. Conservar IDs del catálogo YOD y límites de acceso.
- Concurrencia, presupuesto y límites de sesión se validan en servidor; conservar cola y trabajo pendiente cuando se agota un cupo.

**Cierre:** configurar un agente, asignarlo a un proyecto, encargar una tarea desde el teléfono y recuperar la entrega revisada desde oficina/tablero. Cierra R02–R06 sobre B–F.

## H. Inicio guiado, recreación y continuidad

- Guía de nueve pasos adaptada a YOD: entrar al ámbito; elegir puesto; abrir expediente; conversar; crear tarea; ver terminal; revisar evidencia; aceptar entrega según el proceso; volver al resumen. Guardar avance por usuario sin insertar datos del expediente en almacenamiento público.
- Incorporar juegos/objetos recreativos de la referencia con su licencia y preferencia para desactivarlos. Deben poder pausarse y no capturar las teclas de la terminal ni afectar tareas.
- Ejercitar continuidad con desconexión de navegador y reinicio controlado de worker: leases/recuperación, idempotencia, vigencia de permisos, salida persistida y proceso de vista previa. Comprobar por separado reinicio físico del host y disponibilidad del servicio.

**Cierre:** R13–R15 con evidencias del dispositivo/entorno objetivo. El orden por entregas no elimina estas funciones del mínimo solicitado.

## Secuencia y reversión

Implementar A → B → C; D y E completan la entrega operativa; F y G usan esas mismas entidades; H valida el conjunto. Ninguna apariencia de tarjeta, avatar o teléfono cuenta como sustituto de su conexión.

Cada contrato nuevo se activa por versión/capacidad del backend y conserva el lector anterior hasta terminar la migración. Cada PR identifica su commit anterior, feature flag o adaptador reversible y pruebas de recuperación. La reversión del frontend no borra metas, trabajos ni entregas; las migraciones de datos requieren su propio plan comprobado. Si cambia `os/app.js`, actualizar también su versión de carga en `os/index.html`, según `CLAUDE.md`.
