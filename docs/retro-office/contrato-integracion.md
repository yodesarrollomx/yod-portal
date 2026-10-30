# Contrato de integración de la oficina retro

Fecha: 2026-10-30. Base: `2ab2361d813315fef0b47427eeda4e312f602a23`.
Estado: **propuesto**, con alcance autorizado; este bloque entrega documentación y registro arquitectónico local. No contiene una interfaz retro construida, selección de ruta implementada, backend modificado, publicación ni aceptación productiva. Modelo: propuesta `RETRO`, cambio `CHG-DESPACHO-RETRO-20261030`, contrato `CTR-DESPACHO-RETRO-PRESENTACION`, revisión `2026-10-30.despacho-retro.1`.

Se incorporaron [arranque y cola](arranque-equipo.md), [mapa de paridad](mapa-paridad.md), [UX](ux-retro.md) y [contratos de backend](contratos-backend.md). Sus hallazgos proceden de fuente local; las funciones y despliegues no se comprobaron en producción. El destinatario Hermes no tiene aquí un transporte identificado: no se añade una conexión por su nombre.

## Decisión y frontera

Cambiar la presentación de la misma oficina a estética retro inspirada en Game Boy Color, conservando distribución, funciones y backend. Canvas2D para el plano y DOM para texto, controles y paneles son el candidato inicial. Los recursos gráficos serán originales. El arte puede redondearse a píxeles; las coordenadas y colisiones operativas conservan precisión canónica.

La entrada futura propuesta es `despacho-retro/index.html`, con grafo de carga independiente. Es una ruta de implementación por crear, no una ruta actual ni un destino nuevo del catálogo. La ruta actual `despacho3d/index.html` permanece como respaldo. La eventual selección de presentación vive en el host existente, después de validar acceso y época; no crea un login, catálogo, token, permiso o backend paralelo. No se cambia `os/despacho-section.js` en este bloque.

`office-accessible.mjs` importa `three` y pilotos/residentes visuales; `office-boot.mjs` intenta cargar la oficina 3D antes del fallback. Por eso el mapa accesible actual es referencia de comportamiento, pero no puede convertirse en arranque retro mediante un cambio de CSS. No importar desde la nueva entrada `office-boot.mjs`, `office-accessible.mjs`, `office.js`, `scene.js` ni la cadena de avatares 3D. Cada módulo reutilizado necesita revisión transitiva: no basta con que su import directo no diga Three.

| Capa | Fuente o destino | Incorporación futura |
|---|---|---|
| Distribución y navegación | `despacho3d/office-layout.mjs` | Reutilizar `places`, `bounds`, `annex`, `collisions`, `allowed`; no mantener otra copia del plano. |
| Intenciones y selector | `despacho3d/office-destination.mjs` | Reutilizar destino y revalidación de selección; conservar `createOfficeCasePicker`. |
| Fichas | `despacho3d/office-panels.mjs`, `panels.js` | Reutilizar contenido local con resolución explícita de enlaces relativos, que desde la nueva carpeta deben seguir apuntando a las rutas actuales de `despacho3d/`. |
| Plano y presencia | Renderer retro nuevo | Dibujar layout y snapshots autorizados; crear adaptador de presencia sin Scene ni objetos Three. No copiar identidades o actividad a assets. |
| Puesto, conversación, voz, PPP, reuniones, fuentes y terminal | Controladores y puentes existentes | Adaptar montaje/DOM requerido y conservar protocolos, capacidades, suscripciones y recibos; auditar imports antes de reutilizar cada boot. |
| Identidad, permisos y datos | OS, Portero, GAS, Sheets y servicio de agentes vigentes | Sin cambios de rutas, IDs, esquemas, cálculos, ACL, credenciales o ejecución por esta presentación. |

Los componentes afectados por la presentación son `SYS-YOD-OS`, `SYS-DESPACHO` y `SYS-DESPACHO-3D`. Se conserva el último ID como identidad técnica del componente existente; el nombre histórico no obliga a usar WebGL. Las conexiones y evidencias productivas existentes no se reclasifican como retro ni reciben afirmaciones nuevas de ejecución.

## Invariantes de paridad

Los 13 IDs exactos son `editing`, `editorial`, `funnel`, `entry`, `library`, `reception`, `patio`, `potential`, `case`, `projects`, `delivery`, `decisions`, `lounge`. El anexo de edición mantiene su abertura y circulación con la planta principal. Dibujar no modifica `allowed` ni su margen de 0.22. Una visita directa no demuestra una ruta recorrida; la llegada visual tampoco demuestra persistencia de visita.

`computer` sigue siendo un objeto del puesto y no un lugar número catorce. `case` abre el menú del caso; `computer` abre `ppp`; `library` abre `activity`; `decisions` abre `meeting`. Requieren selección autorizada actual y API disponible, con revalidación antes de abrir y después de esperas. `lounge` es Sala de encuentro y debe distinguirse de `library`; el rótulo ambiguo del mapa actual no se copia. `entry` conserva acceso por lista y navegación, sin inventarle una acción de cercanía que la versión 3D excluye.

Las nueve selecciones de objeto observadas y las acciones de área sin pick se representan con controles DOM equivalentes conforme a [mapa de paridad](mapa-paridad.md). Las fichas preparadas de Proyectos y permisos y Obra y ventas siguen sin atribuir tareas MOAC conectadas; los esquemas editoriales no se convierten en métricas reales.

## Contrato de adaptación y ciclo de vida

La interfaz práctica actual de `window.despacho` es referencia a preservar al integrar consumidores: `visit`, `openPanel`, `closeSheets`, `getState`, `getAgentState`, `setAgentActivity`, `layout`, `allowed`, y `agenteIr` sólo cuando exista capacidad. No devolver éxito ficticio para métodos indisponibles. Mantener `yod-office-ready` y los eventos de llegada que correspondan sólo después de estados efectivos; una pantalla cargada no equivale a autoridad, datos o servicio listo. La modalidad y la posición no deben fingir cámara 3D.

El adaptador nuevo tendrá desmontaje explícito e idempotente: detiene animación/timers, retira listeners, cancela gestos, suelta suscripciones, cierra paneles y elimina datos privados visibles. Integración con `pagehide`/`pageshow` y bfcache revalida autoridad antes de restaurar; no duplica montajes, consultas o mutaciones. El desmontaje del renderer no inventa un comando para detener agentes, terminal o voz: conserva los contratos particulares de cierre y revocación del host.

La época del host, el catálogo y la selección vigentes gobiernan toda respuesta. Cambio de persona/caso, revocación o invalidación impiden abrir paneles y descartan respuestas anteriores. La UI representa carga, vacío, reconexión, denegación y falta de confirmación por separado. Abrir, recargar, navegar, restaurar o dibujar un sprite no inicia inferencia, trabajo, micrófono, envío ni aprobación. Pausar sonido no cuelga una llamada. Las escrituras explícitas conservan `request_id`, revisión, no reintento automático y recibo según cada protocolo.

Chinches conserva el compositor y paquete canónicos. Esta tanda no instala otra superficie. Antes de implementar su integración se debe aplicar la skill de instalación exigida por `AGENTS.md`, revisar `chinche/paquete.json` y `chinche/registro.json`, definir anclaje 2D compatible y probar cada zona; `library` no pertenece hoy a `ZONES`. No inventar coordenadas de cámara 3D ni acreditar recepción por mostrar un indicador.

## Secuencia ejecutable y puertas de aceptación

| Bloque futuro | Entrega acotada | Evidencia para avanzar |
|---|---|---|
| I1 · plano aislado | Crear entrada retro, renderer candidato y controles DOM sólo con layout canónico y datos sintéticos; sin seleccionar aún esta presentación desde OS. | 13/13 IDs, geometría y anexo conservados; interacción por lista/teclado/tacto; grafo y red sin Three/WebGL, incluso con WebGL deshabilitado. |
| I2 · adaptación funcional | Montar presencia y controladores existentes sin dependencias gráficas 3D; incorporar selector autorizado, fichas, rutas, foco y desmontaje. | Paridad de cada fila de R01/R03 con dobles; caso retirado, época antigua, ACK perdido y carga/error sin exponer otro caso; enlaces relativos resueltos. |
| I3 · incorporación a cabina | Añadir selector explícito de presentación dentro del host actual, conservando acceso, época, iframe y 3D de respaldo; versionar recursos tocados. | Suite requerida por `AGENTS.md`, regresiones de host/puentes, navegador escritorio/móvil, movimiento reducido y fallback DOM. No basta una captura del plano. |
| I4 · publicación y aceptación | Entregar cambio revisable con evidencia y reversión; publicar sólo por el proceso autorizado y comprobar recursos/usuario posteriormente. | Registrar por separado integración, frontend publicado, backend existente y aceptación de Dirección; ninguna prueba sintética acredita operación real. |

Siguiente tarea ejecutable propuesta: **I1, plano retro aislado**. Antes de tocar código, Sol Flujo asigna propietario y archivos exclusivos; el escritor del modelo amplía el impacto con esos paths y la tarea aprobada. I1 no activa rutas OS ni modifica backend. La cola actual termina con la auditoría R05: esta tabla no asigna trabajo nuevo por sí sola.

Las pruebas de implementación usan dobles y fixtures sintéticos. Validar tanto grafo de imports como solicitudes de red: una importación dinámica o un boot visual oculto también puede cargar Three. Cubrir los 13 lugares, destinos `case`/`computer`/`library`/`decisions`, oclusiones, colisiones, selección y revocación, foco, zoom, giro, movimiento reducido, errores y DOM usable sin canvas. Ampliar con las regresiones existentes que identifica R03 y todos los verificadores obligatorios del repositorio al cambiar el portal; `ACCESOS_REF` debe fijarse a la revisión coordinada. No llamar endpoints de negocio ni asumir que un GET es inocuo.

## Verificación de este bloque y reversión

Comprobaciones de la entrega documental: regenerar `node scripts/arquitectura.cjs`, ejecutar `node scripts/arquitectura.cjs --check`, `node --test tests/arquitectura.test.cjs` y `git diff --check`. Los resultados ejecutados se informan en la entrega y R05; no equivalen a pruebas de una interfaz aún no construida. Las vistas generadas reflejan la propuesta; la cobertura operativa histórica de la oficina se conserva sin presentar nuevos consumidores como instalados.

Reversión documental: retirar únicamente esta propuesta/contrato/impacto y regenerar las vistas desde el modelo anterior, conservando trabajo ajeno. Reversión futura de interfaz: restaurar el selector al `despacho3d/index.html` existente y revertir módulos/recursos retro por PR; invalidar el montaje vigente mediante su ciclo normal. No borrar datos, historial, visitas, solicitudes, recibos, sesiones de servicio, terminal, hojas o fuentes para volver al 3D. No hay despliegue GAS que revertir por un cambio sólo de presentación.
