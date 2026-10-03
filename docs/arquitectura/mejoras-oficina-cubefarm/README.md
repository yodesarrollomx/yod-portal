# El Despacho: cambios para alcanzar la referencia Cubefarm

**Entrega para implementación · 3 de octubre de 2026 · propuesta `CHG-DESPACHO-CAPACIDADES-001`.**

La oficina debe alcanzar como mínimo las funciones y la composición operativa de [la referencia de Leon van Zyl](https://www.youtube.com/watch?v=NBZmxhcz5lo). Este paquete reúne el cotejo, los cambios por archivo, un parche aplicable y las pruebas de aceptación. No acredita que esas funciones estén instaladas en producción.

## Qué explica la diferencia

1. **La entrada actual muestra una vista general del edificio.** En la referencia predominan los puestos ocupados, los agentes con su tarea visible y los controles de trabajo. El piloto YOD representa un solo perfil autorizado y su animación es de reposo; no representa todavía una plantilla trabajando en distintos encargos.
2. **Varias capacidades existentes son difíciles de encontrar o están mal descritas.** La terminal se abre desde «Diagnóstico». Tareas conserva el ancho de un panel lateral. La ayuda y `despacho-agents/README.txt` todavía dicen que terminal, tareas y voz están pendientes, aunque sus componentes ya existen en el código.
3. **Falta completar el circuito operativo.** Hay conversación, expediente, terminal local y metas con evidencia, pero falta conectar el Kanban de cinco columnas, la revisión independiente, los entregables y la vista previa de aplicaciones como en Cubefarm. Los originales `KanbanView.tsx` y `TerminalView.tsx` conservados en `vendor/` no acreditan su integración en `Agents.tsx`.
4. **El ejecutor de conversación versionado tiene un alcance deliberadamente limitado.** `despacho-runtime/source/runtime/codex-cli-executor.mjs` usa lectura solamente, desactiva herramientas de shell y búsqueda web y solicita responder con la instantánea del expediente. Esto permite diagnosticar y contestar; no equivale a un agente de programación con herramientas. La terminal local constituye otro recorrido. Hay que consultar la versión y capacidades del motor realmente conectado antes de atribuirle esta misma configuración.

La conclusión procede del código y de una ejecución local con datos sintéticos. No se midió el tiempo de respuesta del servicio productivo ni se comprobó su configuración activa.

## Qué recibe el equipo

| Archivo | Uso |
| --- | --- |
| [01-comparativa.md](01-comparativa.md) | Quince requisitos, marcas del video, situación actual y brechas. |
| [02-plan-implementacion.md](02-plan-implementacion.md) | Entregas ordenadas, archivos, contratos, dependencias y aceptación. |
| [03-diseno-y-aceptacion.md](03-diseno-y-aceptacion.md) | Composición de la oficina, tablero, terminal y teléfono; escenas para comparar. |
| [04-aplicar-parche.md](04-aplicar-parche.md) | Aplicación, compilación, comprobaciones y reversión del primer parche. |
| [patches/001-terminal-y-tareas.patch](patches/001-terminal-y-tareas.patch) | Terminal en navegación principal y Tareas con ancho de trabajo. |
| [contrato-tarea.example.json](contrato-tarea.example.json) | Ejemplo sintético de contrato futuro; no es una respuesta compatible con la API actual. |
| [evidencia.json](evidencia.json) | Revisiones inspeccionadas, alcance y resultados de validación. |

## Encargo listo para el agente implementador

> Continúa `CHG-DESPACHO-CAPACIDADES-001` usando esta carpeta. Lee `AGENTS.md`, `CLAUDE.md` y el modelo vigente. Contrasta primero este corte con la rama actual y el motor conectado. Integra la entrega A y el parche 001 en un PR de código, registrando antes su impacto y reconstruyendo los assets. Después completa B–H con las dependencias indicadas. La aceptación mínima son los quince requisitos del cotejo; una maqueta o un componente sin su adaptador no cuenta como función terminada. Mantén los IDs, los expedientes y las reglas comerciales existentes. Documenta por separado código integrado, frontend publicado, backend instalado y recorrido comprobado. Usa pruebas sintéticas y el procedimiento autorizado del repositorio para la aceptación final.

## Alcance de esta entrega

El corte del portal es [`e1ae96e`](https://github.com/yodesarrollomx/yod-portal/tree/e1ae96e02efd4e6d45d77dfad14eefdc69d4a3ef). La referencia de código es [Cubefarm 0.3.2, `11237cf`](https://github.com/leonvanzyl/cubefarm/tree/11237cf554f21312a2aecd9758d611f2817fc71e), la revisión ya utilizada por el repositorio. En un fotograma del video aparece 0.3.1: no se afirma que ambos correspondan al mismo commit.

Se revisaron los 68 fotogramas del archivo de referencia, distribuidos cada 15 segundos entre 00:00 y 16:45, sus ocho hojas de contacto y seis ampliaciones. Se verificaron las 368 entradas con SHA-256 del manifiesto del paquete recuperado. **No se pudo reproducir directamente YouTube ni revisar el audio completo.** Las marcas indican evidencia visual aproximada; las propiedades de ejecución requieren además código y pruebas.

El primer parche compiló y pasó las 255 pruebas existentes en un worktree aislado. Se comprobó la interfaz local en escritorio y móvil; los detalles figuran en la guía del parche. Este PR agrega únicamente esta carpeta: no aplica el parche, no modifica el motor y no publica la oficina. Según [las reglas de cambios](../cambios.md), una entrega documental no necesita inventar una modificación funcional en el modelo. El PR que aplique el parche sí debe actualizar `architecture-impact.json` y la propuesta correspondiente antes de cambiar el código.

Los archivos privados de referencia, conversaciones, perfiles e identificadores operativos permanecen fuera de esta carpeta pública. Conservar la atribución y licencia MIT de Cubefarm al reutilizar su código.
