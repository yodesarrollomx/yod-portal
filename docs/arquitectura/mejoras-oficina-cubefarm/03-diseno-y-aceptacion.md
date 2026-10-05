# Contrato visual y recorridos de aceptación

El parecido debe poder comprobarse mirando las mismas situaciones del video. Usar su jerarquía de trabajo visible, densidad de puestos y controles; conservar la identidad YOD/Aurum. La vista general del edificio sigue siendo útil, pero la entrada principal debe mostrar dónde y en qué trabajan los agentes.

## Superficies

| Superficie | Composición exigida | Interacción |
| --- | --- | --- |
| Oficina | Cámara cercana a altura humana; puestos legibles, agentes y rótulos; resumen compacto de trabajos/en revisión/listos; tablero mural visible. | Avatar y monitor abren su puesto; tablero mural abre el Kanban; Áreas/ascensor cambian ámbito; Ver todo conserva vista general. |
| Puesto | Encabezado con nombre, especialidad, tarea y estado. Terminal amplia con captura a la derecha en escritorio. Controles del proceso visibles. | Intervenir, detener y reconectar actúan sobre la ejecución seleccionada. La captura indica revisión y antigüedad. |
| Tablero | Cinco columnas legibles, contadores y tarjetas con responsable, criterio y estado; enlaces a evidencia, revisión y entrega. | Abrir tarjeta conserva contexto; cambio de etapa confirmado por servidor; filtros de proyecto/agente. |
| Teléfono | Panel compacto lateral para dirección, incorporaciones, compañía y juegos. | Conversación y encargos vinculados a tareas; cerrar devuelve el foco al control de apertura. |
| Vista previa | Aplicación de la revisión seleccionada, modo escritorio/teléfono, estado del proceso y recargar/reiniciar/detener. | Acceso desde tarjeta/puesto; error o proceso detenido claramente distinguibles de contenido vigente. |

En 1440×900, el tablero y puesto deben usar la mayor parte del ancho disponible; reservar el panel estrecho para conversación y teléfono. El parche 001 lleva Tareas a un máximo de 1100 px como primer paso. La entrega del Kanban puede requerir más ancho para sus cinco columnas. En móvil usar panel completo: selector de columna o desplazamiento horizontal contenido en el tablero, sin forzar toda la página a desbordarse. La terminal y captura pueden alternarse mediante controles con nombre.

No basar estados solo en color. Los controles necesitan nombre accesible y área táctil suficiente. Teclas de escritura y terminal no mueven al personaje; Escape y cierre respetan la sesión de terminal. La opción de movimiento reducido conserva toda la información de trabajo.

## Tomas que debe adjuntar cada entrega

| Evidencia nueva | Referencia visual aproximada | Qué debe mostrar |
| --- | --- | --- |
| Oficina, sin panel abierto | 01:00–01:15 | Agentes autorizados y tarea visible; ocupación y resumen consistentes. |
| Teléfono del director | 03:25 | Accesos a dirección, incorporaciones, compañía y juegos, con estados conectados. |
| Puesto/terminal | 05:15–05:30 | Proceso activo, controles y última captura de su tarea/revisión. |
| Tablero y QA | 08:00–08:30 | Cinco etapas, responsable, informe y devolución de una tarea que falla. |
| Aplicación en vista previa | 09:45–10:00 | Revisión identificada, cambio escritorio/teléfono y controles reales del proceso. |

Capturar a 1440×900 y 390×844; revisar navegación también a 320 px. Adjuntar commit, versión de frontend/backend, navegador, ámbito sintético y acciones realizadas. Una captura del diseño no demuestra ejecución: acompañarla con IDs sintéticos y recibos del recorrido, sin publicar datos operativos privados.

## Escenario sintético completo

1. Entrar a un proyecto de prueba autorizado con dos agentes y una tarea: «Cambiar el título de la página de ejemplo y comprobarlo». Criterio: texto exacto y prueba de navegador aprobada.
2. Crear y asignar una sola tarjeta. Abrirla desde tablero, monitor y avatar; los tres caminos identifican la misma tarea, expediente y ejecución.
3. Mostrar progreso real en terminal. Generar una captura que incluya revisión y fecha. Abrir esa misma revisión en el visor de aplicación.
4. Introducir un resultado que incumpla el criterio en el entorno de ensayo. QA debe devolverlo con informe; el tablero vuelve a trabajo conservando la ronda fallida.
5. Corregir, volver a revisar y entregar según las reglas del proyecto. Conservar informe y recibo; un resultado de otra revisión no sirve para aprobar esta.
6. Cerrar/reabrir panel y recargar. Recuperar la misma tarjeta y salida. Interrumpir conexión durante una confirmación y reintentar: no crear otro trabajo o entrega.
7. Revocar acceso al segundo agente y comprobar que desaparece su información de todos los paneles. Desconectar un runtime debe cambiar su disponibilidad y no simular actividad.
8. Comprobar teléfono, incorporación/configuración, navegación de proyectos, recorrido inicial y recreación. Guardar evidencia específica para cada R01–R15 antes de declarar la paridad mínima.

## Qué está probado en esta entrega

Se probó únicamente el parche de acceso a Terminal y ampliación de Tareas, con el frontend compilado en un entorno aislado, sin servicios productivos. Los recorridos anteriores son **criterios pendientes para las siguientes implementaciones**, no resultados que esta carpeta atribuya al sistema actual.
