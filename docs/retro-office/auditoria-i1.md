# Auditoría independiente · oficina retro I1–I3

Fecha: 2026-10-30. Estado: **auditoría local I1–I3 terminada; apta para draft PR, sin bloqueos de código observados pendientes en el alcance probado**. Continúa la [auditoría del arranque](auditoria-arranque.md), que conserva su dictamen documental. No certifica backend real, paridad productiva completa, publicación ni aceptación de Dirección.

## Dictamen final

El plano retro conserva trece lugares, layout y colisiones canónicos, y funciona sin WebGL/Three. La integración opt-in conserva la puerta de sesión del host y delega en los consumidores actuales. Se corrigieron los problemas encontrados de encuadre, fallback, reflujo móvil, montaje, épocas de selección, retrato interno, teclado en modales y señalamiento de Biblioteca. No se duplicaron motores de negocio en la revisión observada.

La última ejecución propia de `node tests/despacho-retro-browser.cjs --run` **aprobó** apertura de PPP, Trabajo, Consejo/reunión, avatar y conversación, Biblioteca → actividad → volver → PPP → volver, revocación, selección de controles con chinches y teclado dentro de modales: **126 solicitudes interceptadas, cero errores y cero solicitudes Three/avatar-card**. El caso, autoridad, endpoint de agentes y contenido PPP son sintéticos. El recibo `composer_opened` se simula y comprueba el protocolo del compositor; **no acredita guardado ni recepción real de una chinche**.

| Verificación final | Evidencia y resultado |
|---|---|
| Focales retro | Auditor: **14/14 aprobadas**, renderer, adaptación, selección/revocación, host, chinches y grafo completo. |
| Navegador integrado | Auditor: harness **aprobado**, cinco superficies, cierre/reapertura, revocación, teclado modal y señalamiento sin acciones subyacentes. Captura sintética autorizada de la raíz inspeccionada. |
| Escritorio y móvil | Raíz: 1440×900, 390×844, 844×390 y 320×568 con trece botones, cero errores y sin desbordamiento. Iframe integrado 390×844 también sin errores/Three/desbordamiento. Capturas de escritorio y móvil inspeccionadas por el auditor. No equivale a Safari/iPhone físico. |
| Canvas no disponible | Raíz: canvas oculto, aviso visible y selección DOM operable tras el reflujo final. Auditor inspeccionó script y captura. |
| Repositorio completo | Sol Flujo comunicó el resultado final del integrador: **1126/1126 tests**, arquitectura **90 componentes / 145 conexiones / 18 procesos**, verificadores OS/portal/accesos/obra, diff e impacto de worktree aprobados. Accesos usó la revisión coordinada y proxy del entorno. No se atribuye esta ejecución completa al auditor. |
| Cambios del auditor | Sólo documentación propia y comprobaciones; `git diff --check` sin errores. Sin cambios de runtime, endpoints de negocio, push ni despliegue. |

El cierre que había agotado el tiempo quedó explicado y comprobado: `chinches-ui.mjs` consume clics residuales mediante `swallowUntil = Date.now() + 700`. El test estaba intentando cerrar dentro de esa ventana después de señalar. La última corrida propia usa una espera explícita de **800 ms** tras el ACK y verifica los recorridos de cierre/reapertura. No se modificó esa protección canónica ni se forzó el cierre.

Biblioteca conserva una limitación heredada: no hay anclaje de chinche por zona `library` en el contrato canónico. En el retro se muestra la limitación y se impiden tanto la emisión con zona falsa como la acción subyacente mientras se señala; fuera de señalamiento continúa su navegación normal. Esta exclusión está probada y no se presenta como una capacidad nueva instalada.

La evidencia permite **entregar el draft PR y revisar el cambio local I1–I3**. Siguen pendientes las comprobaciones autenticadas de servicios reales, voz/micrófono físico, datos y persistencia reales, despliegue y aceptación visual del propietario. No se declara cierre integral de producción ni acuse de Hermes. Los cortes siguientes conservan el historial de hallazgos; sus pendientes quedan sustituidos por este dictamen cuando se indican cerrados aquí.

## Primer corte · historial

**I1 implementado como prototipo aislado; aceptación visual pendiente de correcciones acotadas.** Los trece destinos proceden del layout canónico y están presentes en la lista. El renderer usa Canvas2D y no importa Three ni crea contexto WebGL. La pantalla declara datos de ejemplo y servicios sin conectar. No se encontraron llamadas de negocio en los cuatro archivos inspeccionados. Los cinco tests focales pasaron en ejecución propia del auditor.

La captura de escritorio aportada por la raíz demuestra recorte del norte de la oficina al entrar. Esta observación impide aprobar todavía el criterio de plano completo inicial. Se comunicó a Sol Flujo y raíz para asignación a los propietarios; el auditor no cambia runtime.

## Fuente y evidencia inspeccionadas

- `despacho-retro/index.html`: entrada aislada, aviso de desarrollo, canvas, lista DOM, controles, ayuda en diálogo; no modifica ruta OS.
- `despacho-retro/retro-app.mjs`: trece controles, selección explícita, import dinámico local del renderer, estado de error, diálogo, teclado, desmontaje y remontaje en recuperación de historial.
- `despacho-retro/retro-map.mjs`: importa únicamente el layout canónico; dibujo original por primitivas, conversión de coordenadas, selección, paneo, zoom y movimiento incremental con `allowed`.
- `despacho-retro/retro.css`: reflujo móvil, objetivos táctiles, contraste de selección y movimiento reducido.
- `tests/despacho-retro.test.cjs`: transformaciones, trece IDs, movimiento con colisiones/límites, zoom inválido y desmontaje, inspección del grafo del renderer.
- Evidencia de navegador de la raíz, externa al repositorio público: capturas 1440×900, 390×844 y reporte de tres formatos (también 844×390). El script usa Chromium con `--disable-webgl`, bloquea solicitudes no locales y registra errores, peticiones y desbordamiento. El auditor inspeccionó visualmente las capturas de escritorio y móvil vertical y leyó el reporte/script. No son pruebas de Safari ni de un iPhone físico.

## Resultados y límites

| Criterio I1 | Resultado del corte |
|---|---|
| Trece lugares | Fuente y lista cubren los trece IDs; tests propios comprueban visita válida por ID y rechazo de desconocidos. `computer` no se añade como lugar. |
| Layout y movimiento | `places`, límites y colisiones se reutilizan desde `office-layout.mjs`. El movimiento usa pasos máximos de 0.1 y la función `allowed`; cinco tests propios aprobados. La precisión lógica no depende del redondeo del arte. |
| Independencia gráfica | Grafo observado: HTML → app → mapa → layout; sin Three, renderer WebGL ni red de negocio. El reporte de la raíz registra sólo cinco recursos locales, sin errores, con WebGL deshabilitado. |
| Presentación | Arte dibujado por código local y rótulos originales; no assets comerciales ni perfiles reales. El encuadre inicial de escritorio está recortado; legibilidad/tamaño del plano móvil requieren la corrección visual que coordina Sol Flujo. |
| DOM y acceso | Lista con botones y `aria-pressed`; ayuda con diálogo, Escape nativo y restauración de foco. Los controles permiten acceso sin caminar. La mera inspección no acredita aún todos los recorridos de teclado/tacto. |
| Ciclo de vida | Renderer cancela frame, desconecta observador y retira listeners de forma idempotente; app invalida cargas pendientes y remonta en `pageshow.persisted`. Los tests cubren desmontaje del renderer, no la recuperación real de bfcache en navegador. |
| Fallo de canvas | App conserva lista y estado si no se puede crear renderer. El aviso dentro del marco podría quedar recortado por CSS; requiere corrección/comprobación. |
| Backend y paridad | No conectados por alcance I1 y declarados en pantalla. Esto no es un defecto de I1 ni demuestra conservación operativa de todas las funciones: corresponde a I2/I3. |

El test de grafo parte del renderer, no de la entrada HTML/app. En este corte la inspección del auditor y el registro de red de la raíz complementan ese límite; futuras importaciones deben mantenerse bajo prueba desde la entrada completa.

## Hallazgos y seguimiento finito

| ID | Prioridad / estado | Evidencia | Corrección y aceptación |
|---|---|---|---|
| AI1-01 | Bloquea aceptación visual I1; reportado | `start()` llama `map.visit(selected)` con `entry`; `visit()` cambia pan según su posición. Captura 1440×900 corta recepción/potenciales y el norte del anexo. | Arranque que muestre toda la planta y el anexo conservando visitante en entrada; una acción clara para recuperar el encuadre completo. Nueva captura de los tres formatos, incluyendo después de zoom/paneo. |
| AI1-02 | Menor; reportado | Canvas ocupa 100% de alto y `#map-fallback` sigue en flujo normal dentro de `.map-frame {overflow:hidden}`. Estado y lista permanecen fuera del marco. | Mostrar aviso dentro del marco cuando canvas falla; comprobar con `getContext('2d')` denegado o fallo de import, lista operable y controles gráficos deshabilitados. |

Sol Flujo informó además corrección de tamaño/encuadre móvil y de los símbolos de dirección que aparecen como emoji. Se cotejará la entrega corregida; no se amplía aquí la asignación ni se atribuye cierre a cambios aún no revisados.

## Pruebas ejecutadas

Ejecución propia del auditor: `node --test tests/despacho-retro.test.cjs`, **5/5 aprobadas**, cero fallos. Evidencia de raíz: navegador en 1440×900, 390×844 y 844×390, trece controles, sin errores registrados ni desbordamiento horizontal y cinco solicitudes locales. Estos resultados corresponden al primer corte anterior a las correcciones visuales.

Pendiente: reauditar los hallazgos corregidos, incorporar comprobaciones completas del integrador y separar el dictamen I1 de las pruebas de adaptación funcional I2/I3. No se declara cierre integral.

## Segundo corte · correcciones I1 y revisión I2/I3

La raíz amplió el encargo a I2/I3 mientras se revisaba I1. Los hallazgos de integración siguientes no cambian retroactivamente el alcance del prototipo aislado.

**AI1-01 corregido en fuente y confirmado visualmente:** la llamada inicial ya no recentra entrada; `fit()` restaura el plano completo sin mover al visitante y se agregó su control. Las nuevas capturas de escritorio y móvil vertical muestran toda la planta y el anexo. El plano móvil tiene proporción coherente y los controles de dirección ya no usan símbolos que se presentan como emoji. Las capturas inspeccionadas de este corte no prueban todavía el clic del control `fit()`.

**AI1-02 corregido en fuente, comprobación de navegador pendiente:** app oculta el canvas fallido y CSS añadió `.map-frame canvas[hidden]{display:none!important}` para que la regla de dibujo no venza a `hidden`. Se pidió probar `getContext('2d')` denegado con aviso visible y lista operable.

El auditor ejecutó además los tests de renderer, adaptación y host: **9/9 aprobados** en el corte de integración inicial. Sus resultados no cubrían todavía las emisiones reales del catálogo ni los consumidores dinámicos señalados abajo.

| ID | Hallazgo I2/I3 comunicado a Sol Flujo y raíz | Estado observado |
|---|---|---|
| AI2-01 | `office-entry.mjs` requiere `.case-number` en `#case-open`; el markup retro inicial no lo incluía y podía abortar el montaje. | Corregido en markup inspeccionado posteriormente; reporte de arranque de la raíz ya muestra `YodResidentAgents`, `YodVoiceWorkspace` y `CubefarmYOD` presentes sin errores. |
| AI2-02 | El selector incrementaba su época en toda emisión de catálogo. `authorized.select` emite al limpiar y al fijar selección, invalidando la misma operación `isCurrent`. | Fuente cambió a una huella de fase y IDs de catálogo; pendiente prueba con emisiones reales que conserve la selección actual y descarte revocación/cambio de catálogo. |
| AI2-03 | `agent-workspace.mjs` conserva retrato interno con `avatar-card.mjs`; al abrirlo importa dinámicamente Three/avatares y crea WebGLRenderer. Inyectar sólo el retrato de `live-voice-core` no cubre esa superficie. | Reportado para inyección/adaptación del retrato interno y prueba de esa pestaña. No se afirmó que este import dinámico impidiera el arranque inicial. |
| AI2-04 | El compositor canónico de chinches reconoce `#panel` y `bindPanel`; el retro inicial usaba `#place-panel` y no llamaba `bindPanel`. Los controles de lista/plano tampoco figuran por sí solos en sus raíces reconocidas. | Reportado para adaptar IDs, zona y cobertura sin duplicar grabador; no acreditar paridad por la sola aparición del botón de chinche. |

La extracción `live-voice-core.mjs` se cotejó mediante diff contra el boot original: en ese corte sólo retiró el import del retrato y envolvió el cuerpo en una función con inyección del renderer. No se observó reescritura de los contratos de voz dentro de esa extracción.

El host conserva puerta `ready/allowed`, ruta vigente, época y desmontaje; `office=retro` sólo decide presentación. `isRetroHost` no concede identidad por detectar mismo origen: los puentes siguen requiriendo la autoridad del host. El runtime importa `office-lifecycle.mjs`, que retira la interfaz al salir y navega a una instancia nueva tras bfcache; no se debe dar por válido remontar módulos con efectos laterales desde la caché sin esa recuperación. La prueba de host con dobles aprobada no equivale a una navegación bfcache real.

El reporte de navegador de la raíz para el iframe retro registra arranque de los consumidores y solicitudes locales sin errores. La captura seguía en «Validando tus proyectos…»: esa evidencia acredita montaje, no selección autenticada ni paridad operativa. La revisión integral sigue abierta hasta recibir las correcciones y sus pruebas.

## Seguimiento del segundo corte

- **AI1-02 cerrado:** el auditor leyó el script de la raíz y la captura de fallback móvil. El script deniega Canvas2D, exige aviso visible/canvas oculto y selecciona cuatro destinos representativos desde la lista. La captura confirma el estado. No se atribuyen trece clics a una prueba que ejecutó cuatro.
- **AI1-03, regresión móvil reportada:** esa misma captura tras añadir «Ver oficina completa» revela desbordamiento horizontal del grupo de controles (botón `+` fuera del viewport de 390 px). Se pidió reflujo y nueva comprobación normal/fallback. El reporte antiguo sin overflow era anterior a este control.
- **AI2-03, corrección recibida en fuente:** `agent-workspace-core.mjs` acepta ahora `mountAvatarCard`; `live-voice-core` pasa la fábrica inyectada y el wrapper 3D conserva la original. La prueba pendiente debe abrir también «Conocer al autón», no limitarse al arranque.
- **AI2-05, selección de figura reportada:** el callback de `subscribeAuthorizedProfiles` del nuevo adaptador incrementaba su época en cada emisión, reproduciendo el problema AI2-02 al elegir una figura nueva. Se pidió invalidar por cambio real de proveedor/catálogo/autoridad y probar tanto éxito con emisiones de iguales perfiles como revocación durante espera.

Las figuras del mapa representan puestos e identidades autorizadas; sus posiciones ilustrativas no son tracking físico ni prueba de actividad. El auditor recibió de Sol Flujo la confirmación de este alcance por la raíz. La limpieza por revocación y el uso del caso vigente al abrir siguen siendo condiciones de aceptación.

## Tercer corte · pruebas independientes de integración

El auditor ejecutó `node tests/despacho-retro-browser.cjs --run` y obtuvo aprobación: caso sintético autorizado, apertura de PPP, Trabajo, Consejo/reunión, Conocer al autón y conversación escrita; tras revocación se retira la selección y `openPanel('computer')` devuelve `false`. Se registraron **123 solicitudes interceptadas, cero errores y cero solicitudes Three/avatar-card**. El harness usa el DOM real de los consumidores; sustituye la autoridad, el servicio y el contenido del PPP por fixtures, y aborta otros destinos externos. No envía mensajes, operaciones financieras ni solicitudes a servicios productivos. Las acciones de abrir pestañas no prueban todas sus operaciones de negocio.

También se ejecutó `node --test tests/despacho-retro*.test.cjs`: **14/14 aprobadas**. Incluye pruebas nuevas de selección con emisiones de catálogo, revocación y reemplazo del proveedor, figura nueva con perfiles iguales, handshake/zonas del adaptador de chinches y grafo transitivo del runtime/listado de boots. Las emisiones del selector son simuladas dentro del test; su título no convierte ese doble en una sesión real.

Con esta evidencia se cierran AI2-01, AI2-02, AI2-03 y AI2-05 para el alcance local probado. AI2-04 tiene adaptación de IDs canónicos (`#panel`, `#areas`, `#office-accessible`), `bindPanel`, zona y cierre; queda por cotejar la prueba de selección exacta en navegador. `library` conserva un límite explícito de anclaje por zona, con exclusión canónica del señalamiento para impedir atribuir falsamente esa zona a `entry`; navegar a la biblioteca sigue disponible.

**AI1-03 normal cerrado:** el nuevo reporte de la raíz con el botón «Ver oficina completa» registra trece controles y `overflow:false` en 1440×900, 390×844 y 844×390. La regla de controles ahora permite reflujo. Pendiente sólo confirmar el último estado de fallback con ese mismo ajuste.

**AI2-06, teclado con panel abierto:** se detectó que flechas/WASD podían mover el mapa detrás de una ficha/puesto abierto. La fuente ya excluye cualquier `dialog[open]`, workspace inerte y controles de formulario/diálogo. Se espera prueba breve de teclado en modal junto al cierre de chinches. Es una corrección de convivencia de interfaces, sin cambio del transporte.

No se han encontrado otros bloqueos de código en este corte. El cierre local consolidado espera las últimas comprobaciones asignadas y los verificadores finales del integrador; publicación, servicios reales y aceptación de Dirección continúan siendo evidencias separadas.

## Comprobación final de chinches · corrección requerida

La ampliación del harness para señalar el botón y la tarjeta de Biblioteca produjo un fallo real en ejecución propia del auditor: el clic sobre `#open-place` abrió el puesto de actividad mientras estaba activo el señalamiento; la prueba siguiente agotó el tiempo porque el diálogo ya interceptaba el clic sobre el título de la tarjeta. El atributo de exclusión impide enviar la chinche, pero el selector canónico ignora eventos de elementos con `data-chinche-ui` y, sin adaptación adicional, permite su acción subyacente.

Se comunicó el resultado y se reabrió sólo la corrección de **AI2-04**. Criterio de cierre: durante señalamiento, Biblioteca no envía una zona falsa ni abre su acción; fuera de señalamiento conserva navegación normal. Cerrar el diálogo artificialmente en el test no resolvería el fallo. Se pidió también que el ACK sintético del harness utilice `requestId`, conforme al contrato, en lugar de `id`.

La raíz confirmó evidencia adicional: viewport 320×568 sin errores ni desbordamiento y trece botones; iframe integrado 390×844 sin errores, Three ni desbordamiento; fallback posterior al reflujo con canvas oculto y aviso/lista operables. Esto cierra AI1-03 en normal y fallback y no cambia el bloqueo acotado de chinches.
