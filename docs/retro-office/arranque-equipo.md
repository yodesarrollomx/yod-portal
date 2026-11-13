# Arranque del rediseño de la oficina YOD

Fecha: 2026-10-30. Base inspeccionada: `2ab2361d813315fef0b47427eeda4e312f602a23`.
Estado actual: R00–R05 documentales e I1–I3 locales cerrados, con plano, consumidores existentes y ruta opt-in. Correcciones funcionales y visuales comprobadas en los entornos registrados. Cola congelada, sin nuevas asignaciones. Sin publicación ni aceptación productiva; Hermes sigue sin ruta identificada ni acuse.

El objetivo autorizado es transformar la misma oficina YOD a una presentación retro inspirada en Game Boy Color, conservando sus 13 lugares, sus sistemas, permisos, contratos y funciones. El registro conserva el arranque y la continuación autorizada hasta una implementación local revisable. No crea una oficina alternativa ni sustituye motores por demostraciones.

## Reglas del equipo

Sol Flujo es el único asignador de la cola. Cada responsable escribe únicamente su entrega asignada y comunica evidencia y bloqueos. Nadie abre tareas indefinidas, reasigna trabajo ni modifica archivos compartidos por iniciativa propia. Las discrepancias vuelven a Sol Flujo; el integrador resuelve el documento común en una sola escritura.

Se leyeron `AGENTS.md`, `CLAUDE.md` completo y `docs/arquitectura/README.md`. El relevo `docs/ENTORNO-AGENTE-RELEVO.md` aporta contexto histórico; sus estados fechados no sustituyen código o despliegues actuales.

En R00–R05 no se modificó código de ejecución, configuración o datos. Las asignaciones posteriores I1–I3 autorizan sólo los paths y cambios descritos abajo. Sol integración es el único escritor autorizado de `docs/arquitectura/modelo.json`, `architecture-impact.json` y los derivados necesarios para comprobar arquitectura; registra cada ampliación antes de implementarla. Cada especialista conserva sus paths asignados. No se hacen llamadas a endpoints de negocio, publicaciones, push, envíos externos ni cambios de conexión. Los ejemplos públicos deben ser sintéticos.

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

El corte anterior fue histórico: posteriormente se recibieron R04 y R05. Astra aprobó el arranque documental para asignar I1 aislado sin bloqueantes documentales. Hermes sigue sin ruta identificada y sin acuse. Las filas de la cola son un plan y un registro de entregas: no mantienen agentes ni trabajos ejecutándose después del cierre de la sesión.

## Continuación autorizada I1: plano retro aislado

Dirección pidió que el equipo siguiera y la raíz autorizó implementar I1 local. Esta asignación sustituye la restricción de documentación exclusiva para los paths enumerados a continuación. Sol Flujo mantiene la asignación única; no se crean subagentes. Los archivos documentales previos describen el estado del arranque y sus propuestas futuras, mientras esta sección registra la autorización posterior.

| ID | Responsable | Propiedad exclusiva | Dependencia y entrega |
|---|---|---|---|
| I1-P | Sol integración | `docs/arquitectura/modelo.json`, `architecture-impact.json`, derivados arquitectónicos y `contrato-integracion.md` | Registrar propuesta/impacto y propiedad de los paths antes de runtime; comunicar puerta abierta a todos; fijar detalles API. |
| I1-M | Terra mapa | `despacho-retro/retro-map.mjs` | Tras I1-P: renderer Canvas2D de los 13 lugares y geometría canónica; API común; píxeles originales y movimiento permitido. |
| I1-U | Terra UX | `despacho-retro/index.html`, `despacho-retro/retro.css`, `despacho-retro/retro-app.mjs` | Tras I1-P, en paralelo con I1-M: composición, lista DOM, selección, teclado/tacto, zoom y estados; integrar renderer al recibirlo. |
| I1-T | Terra contratos | `tests/despacho-retro.test.cjs` | Tras I1-P: preparar pruebas contra contrato acordado; ejecutar sobre I1-M/I1-U y verificar navegador si disponible. |
| I1-I | Sol integración | Registro y contrato comunes anteriores; verificación conjunta | Tras I1-M/I1-U/I1-T: resolver incompatibilidades asignando correcciones al dueño del archivo; ejecutar comprobaciones obligatorias y registrar evidencia. |
| I1-A | Astra auditoría | `docs/retro-office/auditoria-i1.md` | Tras integración: inspección independiente de código, red/imports, geometría, UX y pruebas; dictamen acotado I1. |
| I1-C | Sol Flujo | `docs/retro-office/arranque-equipo.md` | Coordinar estados y correcciones finitas, cotejar entregas con raíz y cerrar I1 sólo con evidencia. |

La puerta I1-P es obligatoria: ningún responsable escribe runtime hasta la confirmación explícita de Sol integración. No hay cambios de ruta OS, backend, catálogo, sesión, permisos, publicación, push o deploy. La geometría se importa de `../despacho3d/office-layout.mjs`; no se mantiene otro catálogo o mapa de colisiones. La vista local utiliza datos sintéticos visiblemente etiquetados y no hace solicitudes a endpoints de negocio.

### API mínima entre renderer, UI y pruebas

`createRetroMap({canvas, onSelect, onMove, host?})` devuelve `{visit(id), move(dx,dz), zoomBy(factor), getState(), destroy()}`. El renderer reexporta la geometría canónica importada para contrastarla; conserva precisión de `allowed` aunque dibuje sobre píxeles. `visit` selecciona/ubica un lugar para la demostración visual: no declara una ruta recorrida ni escribe visitas operativas. `move` usa coordenadas del mundo X/Z y nunca atraviesa una colisión por un salto grande. `zoomBy` controla el zoom visual sin alterar geometría. `getState` entrega una copia de estado; `destroy` es idempotente y retira recursos del renderer.

Sol integración abrió la puerta I1-P tras registrar `CHG-DESPACHO-RETRO-I1-20261030`, revisión `2026-10-30.despacho-retro.2`, con ownership e impacto y `--check` aprobado. API acordada: `visit`, `move` y `zoomBy` devuelven booleano; `getState()` entrega `{selected, position:{x,z}, zoom}`; `onSelect(id)` comunica selección y `onMove({x,z})` movimiento. `visit` sólo selecciona/reencuadra; no teletransporta ni abre automáticamente una ficha al caminar. El contenedor opcional se usa para resize y por defecto es `canvas.parentElement`; listeners, RAF y observer se limpian al destruir. UI y tests usan ese único acuerdo. `host` sólo representa un contenedor DOM opcional en I1; no es un host de autenticación ni una fuente de autoridad.

### Cierre verificable de I1

Exigir los 13 lugares y anexo completos, arte pixel original legible, selección por lista/canvas, movimiento con `allowed`, zoom, controles de teclado/tacto, diseño móvil/escritorio y movimiento reducido. El grafo y las solicitudes no deben cargar Three/WebGL ni servicios de negocio. Una lista DOM usable debe conservar orientación cuando canvas no esté disponible.

I1-T entrega pruebas significativas del contrato y navegación; I1-I ejecuta los checks obligatorios según el alcance, con la referencia de accesos coordinada. El navegador debe comprobar los comportamientos disponibles e identificar límites del entorno. No atribuir paridad de sistemas productivos a este plano sintético. La prueba de I1 sólo acredita representación e interacción local; I2–I4 mantienen integración funcional, ruta OS y publicación pendientes.

Reversión I1: retirar los cuatro archivos `despacho-retro/`, su prueba y el registro arquitectónico específico I1, regenerando derivados sin revertir cambios ajenos. La oficina existente y sus datos permanecen intactos. El trabajo continúa durante los turnos activos coordinados; no se promete ejecución después de cerrar la sesión.

## Continuidad autorizada después de I1

Dirección pidió explícitamente «Reactiva todo /en-equipo». La cola continúa por I2 (adaptación funcional de la misma oficina, backend y paquete de chinches existentes) e I3 (ruta opt-in con 3D de respaldo) hasta un resultado integrado y revisable. No se solicita otra autorización rutinaria entre bloques. Sol Flujo asignará sus paths y dependencias tras cotejar I1 y el grafo de consumidores; Sol integración registrará impacto antes de cada cambio nuevo. No se publica ni mezcla por esta continuidad. Las integraciones reales se comprobarán separadamente de las pruebas sintéticas y ningún diagnóstico ejecutará endpoints de negocio.

| ID | Responsable | Propiedad exclusiva adicional | Entrega y dependencia |
|---|---|---|---|
| I2-P | Sol integración | Modelo, impacto, derivados y contrato comunes | Registrar paths I2/I3 y acordar API antes de runtime nuevo. |
| I2-M | Terra mapa | `despacho-retro/retro-office.mjs` | Adaptar API `window.despacho`, selección/fichas/destinos y enlaces relativos usando fuentes canónicas; coordinar DOM con UX. |
| I2-U | Terra UX | `despacho-retro/retro-runtime.mjs` y sus tres archivos I1 | DOM soporte y montaje de controladores canónicos auditados sin Three; separar demostración de modo real autorizado. |
| I2-C | Terra contratos | `despacho-retro/retro-chinches.mjs` si hace falta, `chinche/registro.json`, `tests/despacho-retro-integration.test.cjs`, `tests/despacho-retro-host.test.cjs` | Aplicar skill/plan de chinches antes de escribir, reutilizar paquete/bridge común; pruebas de integración/host con dobles. Paths definitivos se registran en I2-P. |
| I2-V | Sol integración | `despacho3d/live-voice-boot.mjs`, nuevo `despacho3d/live-voice-core.mjs` y/o `avatar-card-core.mjs` según separación mínima registrada | Separar retrato Three de núcleo de voz mediante fábrica inyectable, conservando entrada 3D y protocolos sin duplicar el boot; dar API a UX. |
| I3-H | Sol integración | `os/despacho-section.js`, versionado correspondiente en `os/index.html` | Selección opt-in propuesta `office=retro`, default 3D y mismos permisos/época/bfcache/desmontaje; pruebas por Terra contratos. |
| I3-B | Raíz | Evidencia local de navegador fuera del repositorio | Capturas y pruebas con dobles en escritorio/móvil; no llamar negocio para probar. |
| I3-A | Astra auditoría | `docs/retro-office/auditoria-i1.md` | Auditoría progresiva I1–I3 y defectos corregidos por sus propietarios; distinguir plano, integración y producción. |

El grafo inspeccionado por integración permite reutilizar los boots DOM de residentes, observación, biblioteca, agentes, puesto y Entorno. `live-voice-boot` llega dinámicamente a Three mediante el retrato; I2-V elimina esa dependencia de la entrada retro preservando su funcionamiento 3D. El productor debe comprobar el grafo transitivo completo, incluidos imports dinámicos. No se copia el núcleo de negocio a la carpeta retro.

I2-P confirmado abierto por integración: revisión `2026-10-30.despacho-retro.3`, cambio `CHG-DESPACHO-RETRO-INTEGRACION-20261030`. La entrada retro usará `mountLiveVoice({mountAvatarCard: factoryDOM})`; la entrada 3D conserva su fábrica actual mediante wrapper. Terra contratos recibió además propiedad exclusiva para ajustar lecturas de fuente por la extracción, preservando las verificaciones, en `tests/despacho-puesto2.test.cjs`, `tests/despacho-workspace.test.cjs`, `tests/chat-draft-polling.test.cjs` y `tests/agent-interaction-boot.test.cjs`; integración debe registrar esos paths antes de su edición.

I2-M2 añadido por Dirección mediante raíz: Terra mapa adapta sus dos módulos para presencia 2D desde snapshots/perfiles autorizados, coordinando suscripciones con Terra UX. Seleccionar el sprite abre el caso sólo después de validar selección y capacidad actuales; revocación limpia figura y datos. No crear actividad ficticia ni personajes operativos desde un padrón público. La demostración conserva únicamente presencia sintética etiquetada. Sol integración registra esta capacidad antes de su cambio. La raíz recapturó el plano y confirmó corregido el encuadre completo de escritorio; no equivale aún a aceptación global.

La revisión inicial de chinches encontró modo mapa con interfaz v2 y cámara nula, 12 zonas y `library` excluida. I2-C no debe inventar cámara, recibos o una selección espacial 2D aceptada por un protocolo que sólo admite interfaz. Debe conservar capacidades reales y registrar por separado cualquier límite pendiente; una ampliación del protocolo común requiere propuesta/registro y pruebas de ambos consumidores. El plan con observaciones vacías sólo indicó `auditar-fuente`; no acredita recepción operativa.

Corte I1 recibido: renderer entregado, contratos reportó 5/5 pruebas aprobadas y raíz comprobó 1440×900, 390×844 y 844×390 con 13 IDs, sin errores/overflow y sólo cinco solicitudes locales. Las capturas quedan fuera del repo en `/workspace/retro-evidence/`. La raíz detectó encuadre móvil pequeño, vacío excesivo y flechas emoji; Sol Flujo asignó corrección a mapa/UX sin bloquear I2. Es evidencia local con datos sintéticos, no aceptación productiva.

Actualización de coordinación I2-M2: raíz aprobó representación de puestos con identidad autorizada y ubicación visual asignada; no equivale a seguimiento físico. Sólo se muestran estados de snapshots reales y se documenta esta distinción en ayuda. I2-V/I3-H suman propiedad exclusiva de `despacho3d/index.html` al integrador para versionar el wrapper de voz, previo registro de impacto. Los nombres de los dos tests de extracción son `tests/chat-draft-polling.test.cjs` y `tests/agent-interaction-boot.test.cjs`, sin prefijo adicional.

Auditoría incremental detectó y asignó correcciones concretas antes del cierre: UX debe aportar `.case-number` requerida por el boot de entrada, impedir que emisiones de selección invaliden su propia época, mantener el dock dentro del layout retro y mostrar fallback por encima de la regla CSS de canvas. Integración separa además `despacho3d/agent-workspace.mjs` y nuevo `agent-workspace-core.mjs`: su retrato podía importar Three dinámicamente al abrirse aunque el arranque no lo hiciera. Se conserva wrapper 3D y se propaga la fábrica DOM al núcleo. Terra contratos suma propiedad de `tests/despacho-goals.test.cjs` y `tests/despacho-ppp-connection.test.cjs` para lecturas del núcleo sin relajar assertions.

Raíz pidió prueba browser con autoridad simulada y apertura de PPP, chat, actividad, reunión y avatar. Sol Flujo asignó el harness a Terra mapa, reutilizando dobles/protocolos existentes y coordinando fixtures con Terra contratos. Si necesita persistir un archivo, su path exclusivo propuesto es `tests/despacho-retro-browser.cjs`, que integración debe registrar antes de escribirlo. La red debe interceptarse sin endpoints de negocio; raíz conserva capturas, móvil y fallback. Una ejecución que sólo recibe autoridad denegada no acredita estas superficies.

La adaptación de chinches prioriza IDs de DOM ya reconocidos: sección de mapa `#office-accessible`, lista `#areas`, ficha `#panel/#panel-body`, y bridge con `bindPanel`, zona actual y cierre de fichas. Esto evita duplicar selector o grabador. Una zona `library` no reconocida no puede atribuirse a `entry`; el señalamiento debe fallar cerrado o emplear una ampliación explícitamente registrada y probada. El aviso visual solo no evita una atribución falsa. Cualquier corrección del selector común tendrá dueño/impacto previos y pruebas de ambos consumidores.

Decisión posterior de raíz para este bloque: no modificar selector ni paquete común para añadir `library`. Terra UX excluye únicamente su control/subárbol mediante la exclusión canónica `data-chinche-ui="unsupported-library"`, conservando navegación y un aviso de zona pendiente. Terra contratos debe probar que señalar ese control no envía ni lo atribuye a entrada. No retirar sólo el marcador de lugar dejando que el control caiga en la zona genérica. La limitación existente permanece documentada.

Corte de auditoría en progreso: encuadre inicial y fallback visual corregidos; markup de entrada corregido; selección de catálogo y de figuras requieren pruebas positivas con emisiones de los mismos perfiles durante selección, además de revocación. El refactor de puesto requiere abrir avatar/capacidades sin cargas Three, no basta el arranque. La nueva acción de encuadre debe replegar sus controles en móvil sin overflow tanto con canvas como sin él. Estos puntos permanecen en la cola de correcciones hasta recibir pruebas y dictamen consolidado.

Corte posterior recibido del harness de Terra mapa: PPP, chat, actividad, reunión y avatar abrieron con autoridad sintética, revocación comprobada y cero errores/cargas Three/endpoints reales. La ampliación comprobó que señalar Biblioteca no envía, señalar Entrada sí emite zona `entry` con vista `map` y cámara nula, y las flechas no mueven al visitante con ficha o puesto abiertos. Astra reprodujo independientemente las cinco superficies y revocación con 123 solicitudes interceptadas, sin errores ni Three, y ejecutó 14/14 pruebas focales. Los conteos son del corte comunicado; la corrida final del integrador y el dictamen consolidado se registran aparte.

La cola de cierre queda finita: UX confirma exclusión de la tarjeta/botón dinámico de Biblioteca y estabilidad; raíz comprueba fallback móvil posterior al reflujo; integración ejecuta una corrida final sobre esos archivos; Astra consolida el dictamen. Sol Flujo sólo reabre correcciones por defectos materiales encontrados en esas comprobaciones. La entrega posterior será revisable; no equivale a publicación ni aceptación productiva.

Se emitió un primer freeze tras la entrega UX; integración comprobó 1126/1126 pruebas y verificadores/arquitectura/diff/impacto. El harness final encontró un defecto material y reabrió únicamente esa corrección: la exclusión de Biblioteca evitaba el pin pero dejaba pasar el clic a `#open-place`, abriendo Actividad mientras se intentaba señalar. UX debe consumir la activación de ese control cuando el señalador esté activo y conservarla en navegación normal; Contratos/Mapa/Astra deben comprobar ambos comportamientos sin forzar clics ni cerrar artificialmente un modal para ocultar el fallo. La raíz informó comprobaciones visuales finales aprobadas en 320 px, 390 px de runtime, tres formatos y fallback posterior al reflujo. El cierre espera la corrección puntual y su prueba; los resultados de la corrida anterior no acreditan un archivo cambiado después.

La corrección puntual posterior usa `isSelecting()` alimentado por `onChange` del selector canónico, y el guard UX consume la acción excluida mientras se señala. El harness final comunicado por Mapa a integración aprobó Biblioteca en lista, tarjeta y botón sin pin ni acción subyacente, Entrada con pin v2 y ACK sintético usando `requestId` exacto, teclado modal, cinco superficies, revocación y cero errores/Three. Las 123 solicitudes fueron interceptadas; no se atribuye recepción real al ACK del doble. Integración repite su corrida final tras este cambio y Astra consolida el dictamen; la implementación queda congelada salvo un defecto material nuevo.

## Cierre de integración local

Sol integración entregó el cierre congelado: suite 1126/1126, focales 14/14, arquitectura `--check` con 90 componentes/145 conexiones/18 procesos, verificadores OS/portal/accesos con SHA coordinado y proxy/obra, `git diff --check` e impacto de worktree con 25 rutas aprobados. Modelo y contrato indican `implementado_local`; derivados regenerados y comprobados. Son resultados comunicados por el integrador, distintos de la comprobación propia `git diff --check` de Sol Flujo. La auditoría conserva su dictamen y alcance en `auditoria-i1.md`.

La cola I1–I3 queda entregada a raíz para revisión y trámite de entrega autorizado, sin nuevas asignaciones abiertas de runtime ni trabajo autónomo prometido fuera de sesión. No se publicaron frontend/backend, no hubo merge ni comprobación productiva por este cierre. Se mantiene 3D como predeterminado y respaldo, retro opt-in y la limitación explícita de zona Biblioteca en chinches. Hermes sigue sin contrato de conexión ni acuse identificados.

Diagnóstico final del intento de cierre del puesto: el selector canónico conserva una protección de 700 ms para absorber el clic residual después de señalar. El intento dentro de esa ventana fue absorbido; no acreditó un defecto del cierre de voz. Mapa comprobó cierre y reapertura al superar la ventana y dejó una espera de 800 ms con comentario en el harness. La raíz y el integrador cotejaron la misma fuente. No se modifica la lógica canónica para eludir esa protección ni se fuerza el clic de prueba.

La entrega factual y la imagen exclusivamente sintética están en [validacion-local.md](validacion-local.md) y [evidencia-integrada.png](evidencia-integrada.png). La comparación local comunicada por raíz observó aproximadamente 61% menos bytes de recursos locales decodificados en una muestra inicial, con destinos externos bloqueados; no mide RAM, transferencia comprimida ni fluidez de un dispositivo físico. Permanecen pendientes QA real, dispositivo/Safari-WebKit, aceptación de Dirección, sesión autorizada real, recibo productivo de chinches y publicación. Son límites de la entrega, no nuevas asignaciones automáticas tras este freeze documental.
