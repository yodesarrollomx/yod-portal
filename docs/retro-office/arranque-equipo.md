# Arranque del rediseño de la oficina YOD

Fecha: 2026-10-30. Base inspeccionada: `2ab2361d813315fef0b47427eeda4e312f602a23`.
Estado: preparación documental local. Esta entrega no implementa el rediseño ni acredita publicación, aceptación visual o conexión con Hermes.

El objetivo autorizado es transformar la misma oficina YOD a una presentación retro inspirada en Game Boy Color, conservando sus 13 lugares, sus sistemas, permisos, contratos y funciones. El bloque actual produce un arranque verificable para la siguiente implementación. No crea una oficina alternativa ni sustituye motores por demostraciones.

## Reglas del equipo

Sol Flujo es el único asignador de la cola. Cada responsable escribe únicamente su entrega asignada y comunica evidencia y bloqueos. Nadie abre tareas indefinidas, reasigna trabajo ni modifica archivos compartidos por iniciativa propia. Las discrepancias vuelven a Sol Flujo; el integrador resuelve el documento común en una sola escritura.

Se leyeron `AGENTS.md`, `CLAUDE.md` completo y `docs/arquitectura/README.md`. El relevo `docs/ENTORNO-AGENTE-RELEVO.md` aporta contexto histórico; sus estados fechados no sustituyen código o despliegues actuales.

Este bloque no modifica código de ejecución, configuración o datos. Sol integración es el único escritor autorizado de `docs/arquitectura/modelo.json`, `architecture-impact.json` y los derivados necesarios para comprobar arquitectura; registrará la propuesta y su impacto sin implementar runtime. Los demás responsables sólo escriben su entrega documental. No se hacen llamadas a endpoints de negocio, publicaciones, push, envíos externos ni cambios de conexión. Los ejemplos públicos deben ser sintéticos.

## Cola finita del arranque

Las responsabilidades están asignadas; la existencia de una fila no acredita que su entrega haya sido completada. El integrador debe cotejar los archivos y pruebas al cerrar el bloque.

| ID | Responsable | Entrega exclusiva | Dependencia | Condición de cierre |
|---|---|---|---|---|
| R00 | Sol Flujo | `arranque-equipo.md` | Lecturas obligatorias y base Git | Cola, propiedad, contratos, dependencias y límites explícitos |
| R01 | Terra mapa/inventario | `mapa-paridad.md` | Base Git | Matriz de los 13 IDs, paneles/destinos y funciones; distinguir existente, declarado y pendiente |
| R02 | Terra UX | `ux-retro.md` | Base Git; cotejo final con R01 | Propuesta retro para esos mismos lugares, navegación, estados, móvil, teclado y movimiento reducido; sin implementarla |
| R03 | Terra contratos | `contratos-backend.md` | Base Git | Contratos observables de selección, identidad, navegación, permisos, recuperación y funciones; límites de Hermes |
| R04 | Sol integración/arquitectura | `contrato-integracion.md` | R00–R03 | Estrategia de incorporación, componentes afectados, pruebas y reversión; registrar propuesta/impacto en modelo y generar derivados necesarios, sin runtime |
| R05 | Astra auditoría | `auditoria-arranque.md` | R00–R04 | Revisar cobertura, contradicciones, privacidad, pruebas y alcance; separar defectos bloqueantes de pendientes de implementación |

Los seis documentos de equipo viven en `docs/retro-office/`; R04 además tiene la propiedad exclusiva del registro arquitectónico y sus derivados necesarios. R01, R02 y R03 pueden avanzar independientemente en sus archivos; R02 incorpora el cotejo de IDs al recibir R01. R04 consume las tres entregas sin reescribirlas. R05 revisa el conjunto; sus hallazgos no se convierten automáticamente en nuevas asignaciones. Sol Flujo emite una corrección acotada al responsable correspondiente y después congela la cola al cerrar el arranque.

## Contrato de conservación

La fuente inspeccionada `despacho3d/office-layout.mjs` declara exactamente estos 13 lugares. La futura interfaz debe mantener su identidad y función aunque cambie su representación:

| ID | Nombre actual |
|---|---|
| `editing` | Sala de edición |
| `editorial` | Mesa editorial |
| `funnel` | Embudo comercial |
| `entry` | Entrada al Despacho |
| `library` | Biblioteca del proyecto |
| `reception` | Recepción |
| `patio` | Patio central |
| `potential` | Potenciales |
| `case` | Puesto del proyecto |
| `projects` | Proyectos y permisos |
| `delivery` | Obra y ventas |
| `decisions` | Decisiones |
| `lounge` | Sala de encuentro |

Trece lugares de navegación no equivalen al catálogo de espacios autorizados del Entorno ni a trece integraciones comprobadas. R01 debe mantener ambas dimensiones separadas y rastrear la función por lugar. La cobertura de salas no autoriza sistemas que el usuario no puede abrir.

El mapa de destinos de `despacho3d/office-destination.mjs` conserva `computer → ppp`, `library → activity`, `decisions → meeting` y `case → menú radial`, siempre condicionado a la selección autorizada actual. La relación entre un lugar espacial y un control con otro ID se documentará explícitamente en R01/R03.

La capa visual conserva `SYS-*`, `PRJ-*`, códigos de acceso, selección privada del expediente, rutas, destinos, solicitudes y recibos existentes. `os/catalogo.js` sigue siendo fuente del catálogo y el orden global sigue vigente. No se duplican los motores ni se alteran cálculos o datos de negocio para adaptar el diseño.

Como ejemplo de un contrato observable, `despacho3d/office-destination.mjs` revalida la selección vigente antes de abrir el puesto o su menú. El cambio visual debe conservar esa defensa, además de las autorizaciones del servidor; dibujar un avatar o una sala no concede acceso. R03 debe completar el inventario de estos contratos y sus pruebas existentes.

Abrir, recargar, moverse o restaurar una vista no inicia inferencias ni reanuda trabajos por sí solo. La implementación debe conservar las distinciones actuales entre fragmento recibido, respaldo pendiente, recibo confirmado, cierre incompleto y cierre confirmado cuando correspondan. No atribuir persistencia o disponibilidad por el color de un indicador.

## Hermes: evidencia y límite

La búsqueda textual local de `hermes`, excluyendo dependencias de `despacho3d/vendor/`, encontró una mención en `despacho3d/avatars/avatar.mjs`: la forma mitológica `hermes`, junto con `themis` y `thoth`, recibe un objeto visual de tableta. Esa mención no es un adaptador, endpoint, ruta o conexión de Hermes.

No se identificó una ruta de integración Hermes en esa búsqueda del repositorio. Este resultado se limita a la versión inspeccionada y no prueba inexistencia fuera del repo. «Para Hermes» es el destinatario del relevo en este bloque; no autoriza inventar transporte, credenciales, APIs ni afirmar conexión. Antes de una integración futura deberá identificarse el contrato real y comprobar su autorización.

## Entrega a implementación

La siguiente tanda sólo puede recibir tareas concretas después de cotejar R01–R05: cada una tendrá propietario, rutas exclusivas, dependencia, criterios verificables, prueba apropiada y reversión. La propuesta arquitectónica debe registrarse antes de modificar código; Sol integración conserva la propiedad exclusiva del modelo y su impacto.

La evidencia mínima del arranque es el commit base, las referencias locales de cada hallazgo, el conjunto de archivos existente, `git diff --check` y una auditoría de contradicciones. No se declaran aprobadas las verificaciones de código si no se ejecutaron. Al implementar cambios de portal se deberán ejecutar las comprobaciones exigidas por `AGENTS.md`, con `ACCESOS_REF` fijado cuando corresponda, además de las pruebas pertinentes de navegación, acceso y visualización.

La aceptación posterior deberá demostrar los 13 lugares, paridad de funciones y permisos, selección y revocación, escritorio y móvil, teclado, movimiento reducido, estados de carga/error y recuperación sin duplicación. Capturas o dobles sintéticos acreditan sólo el entorno de prueba identificado. Código integrado, frontend publicado, backend desplegado y aceptación de Dirección se registran por separado.

Reversión del bloque actual: retirar los documentos de arranque y revertir únicamente el registro de propuesta, impacto y derivados añadido por R04, conservando cambios ajenos. La reversión de la futura interfaz deberá restituir la presentación anterior conservando datos, historiales, permisos y recibos; R04 debe concretarla antes de implementar.

## Corte verificable de la cola

Al cotejar el directorio durante esta entrega, R00, R01, R02 y R03 estaban presentes; R04 y R05 todavía no tenían archivo entregado. Sus estados se cerrarán mediante la recepción de `contrato-integracion.md` y `auditoria-arranque.md`, y el cotejo por integración y raíz de sus hallazgos. No se atribuye terminación a un documento por la mera asignación de un agente.

La raíz informó que `node scripts/arquitectura.cjs --check` pasó con 90 componentes, 145 conexiones y 18 procesos; es evidencia comunicada por la raíz, distinta de una ejecución propia de Sol Flujo. Sol Flujo ejecutó `git diff --check` sin errores. Este bloque no ejecutó pruebas funcionales de una interfaz retro: esa interfaz sigue pendiente de implementación.

El relevo queda acotado al primer paquete documental. Hermes sigue sin ruta identificada y sin acuse. Las filas de la cola son un plan y un registro de entregas: no mantienen agentes ni trabajos ejecutándose después del cierre de la sesión.
