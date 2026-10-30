# Auditoría independiente del arranque de la oficina retro

Fecha: 2026-10-30. Fuente inspeccionada: `2ab2361d813315fef0b47427eeda4e312f602a23`, más los documentos de este bloque cuando se incorporen. Responsable: auditor independiente del equipo. Alcance autorizado del bloque: preparar el arranque documental de la misma oficina con presentación inspirada en Game Boy Color. Esta auditoría no implementa runtime, no publica y no llama a endpoints de negocio.

## Dictamen del primer paquete

**Arranque documental aprobado; apto para asignar I1, el plano aislado, bajo las condiciones explícitas del contrato de integración.** Se revisaron las cinco entregas R00–R04 y el diff de modelo/impacto. No se identificaron defectos bloqueantes en este paquete. El siguiente bloque requiere propietario y archivos exclusivos y el impacto de esos paths antes de tocar código, como establece R04. La cola documental termina aquí; este dictamen no inicia trabajo adicional.

Hay una base de navegación compartida, trece lugares canónicos y controles de acceso que permiten plantear una nueva presentación. No hay evidencia en esta revisión de una oficina retro implementada, de paridad funcional, de ejecución autenticada ni de despliegue. Aprobar I1 no aprueba activar la ruta de cabina ni publicar.

Los trece lugares no equivalen a trece integraciones operativas. Parte de las fichas son navegación o explicaciones de funciones futuras. Conservar la oficina significa conservar tanto sus funciones existentes como sus límites explícitos, sin presentar como conectadas capacidades pendientes.

## Evidencia de la base

Las referencias de línea corresponden al commit base; se deben volver a cotejar si cambia el runtime.

| Evidencia | Hecho observado | Implicación para el retro |
|---|---|---|
| `despacho3d/office-layout.mjs:2` | `places` contiene exactamente `editing`, `editorial`, `funnel`, `entry`, `library`, `reception`, `patio`, `potential`, `case`, `projects`, `delivery`, `decisions`, `lounge`; comparte límites y colisiones. | Mantener estos IDs y su significado; cualquier proyección de coordenadas debe ser visual y reversible. |
| `despacho3d/office-destination.mjs:3` | `computer → ppp`, `library → activity`, `decisions → meeting`; `case` abre menú radial. Revalida selección antes de abrir. | No derivar el destino técnico del nombre de una sala. `computer` es una interacción y no un decimocuarto lugar. |
| `despacho3d/office-destination.mjs:17` | El selector usa perfiles autorizados; revisa época/catálogo/selección tras operaciones asíncronas y dispone suscripción. | La nueva presentación no crea su propio registro de proyectos ni conserva datos de una selección revocada. |
| `os/despacho-section.js:13` y `:40` | La sección exige ruta, acceso listo y permitido; desmonta iframe al cambiar época; maneja `pagehide` y recuperación de historial. | Conservar guardas, contexto vigente y desmontaje. Un sprite seleccionado no concede permiso. |
| `despacho3d/office-boot.mjs:6` | El arranque intenta importar la oficina 3D y activa la alternativa tras fallo; el modo legible también se puede montar junto al 3D. | El arranque retro normal necesita una decisión explícita anterior al intento del renderer. Capturar un error WebGL no es una experiencia retro normal. |
| `despacho3d/office-accessible.mjs:9`, `:25`, `:65` | El plano usa Three.js, una `Scene` y pilotos de avatares, pero no crea renderer WebGL; expone una API de oficina. | «Sin WebGL» y «sin Three.js» son afirmaciones distintas. Documentar dependencias y demostrar que el camino normal no crea contexto WebGL; no prometer eliminar toda dependencia 3D sin comprobar imports transitivos. |
| `despacho3d/office-accessible.mjs:55` y `:135` | Los trece controles se generan desde `places`; algunos abren destino operativo y otros fichas locales. | Probar desplazamiento, apertura, cierre y retorno por separado; contar tarjetas no demuestra paridad. |
| `despacho3d/office-panels.mjs:6`, `:7`, `:14` | Proyectos/Obra y ventas explican conexiones pendientes; Edición conserva una navegación a `sala.html`. | Mantener la distinción entre navegación, ficha informativa y operación. Revisar las asignaciones finales del módulo, pues hay fichas redefinidas. |
| `despacho3d/office-boot.mjs:3` | El puente de chinches se monta antes de WebGL y la cámara no disponible es `null`, modo `map`. | No inventar cámara ni geometría 3D al reportar una interacción retro; reutilizar el paquete canónico y su contrato. |
| `docs/arquitectura/modelo.json`, componente `SYS-DESPACHO-3D` y conexiones `CON-DESPACHO-3D-MOTOR`, `CON-DESPACHO-3D-PPP` | El modelo distingue código y despliegues, conserva límites de comprobación; esas conexiones tienen `runtime_verified: false`. | No convertir evidencia del código o de fixtures en verificación de producción del retro. |
| `despacho3d/avatars/avatar.mjs:111` | `hermes` aparece como variante visual de avatar. | Esta referencia no prueba un agente Hermes disponible, una delegación ejecutada ni un acuse suyo. |

## Condiciones para aprobar el siguiente bloque

| Criterio | Evidencia exigida al arranque | Evidencia posterior para afirmar paridad |
|---|---|---|
| A. Alcance y propiedad | Entregas de coordinación, integración, paridad, UX y backend; archivos responsables, dependencias y reversión delimitados. Propuesta e impacto coherentes con el modelo. | Diff acotado, PR y comprobaciones requeridas; separar integrado, publicado y ejecutado. |
| B. Misma oficina | Matriz con los trece IDs exactos, etiqueta, acción, función existente, estado y módulo fuente; incluir `computer` como interacción. | Recorrido de los trece lugares con fixtures, abrir/cerrar/volver; conservar rutas de entrada y navegación de Sala/PPP. |
| C. Arranque sin WebGL | Selección del renderer y frontera con el host compartido definidas; inventario de imports y API que se conservará. | Navegador con WebGL deshabilitado desde antes de cargar: oficina usable, sin depender del fallo de `WebGLRenderer`; carga, error y recuperación claros. |
| D. Identidad y selección | Sesión Portero, código `DP`, selección autorizada, épocas, origen/emisor del puente y teardown conservados. | Pruebas sintéticas de denegación, revocación, cambio de actor/caso con respuesta tardía, navegación atrás y limpieza de estado; ninguna operación tras invalidación. |
| E. Mismos datos y contratos | Inventario por operación de transporte, backend lógico, lectura/mutación y control vigente. No nuevas hojas, endpoints, credenciales o almacenes de negocio para la estética. | Interceptación de red que compare mensajes y argumentos con el comportamiento existente; pruebas de respuestas de error, retraso, cancelación y reintento sin duplicación. |
| F. Funciones transversales | PPP, conversación, actividad, expediente/conocimiento, consejo, voz y chinches mapeados a consumidores existentes o declarados pendientes. No borrar una función por no pertenecer a una tarjeta espacial. | Casos de uso por consumidor; estados disponibles, en carga, denegados y fallidos. Voz física y servicios reales sólo se acreditan con su evidencia específica. |
| G. UX retro utilizable | Navegación táctil y teclado, foco/escape, texto legible, orientación y movimiento reducido; estados de actividad basados en observaciones reales. | Capturas y recorridos de escritorio e iPhone vertical/horizontal; ninguna acción depende sólo del color, hover o movimiento del personaje. |
| H. Evidencia y privacidad | Fuentes por commit/ruta; nombres, perfiles, hojas y registros reales fuera del repositorio público. | Datos sintéticos en capturas/tests públicos; recibos reales privados cuando se autorice su comprobación. Un loader cerrado no equivale a motor listo ni a operación exitosa. |

Los criterios de la última columna son obligaciones del bloque de implementación y aceptación, no resultados de esta auditoría documental. No se exigirá a los documentos fingir su ejecución.

## Pruebas y límites de esta revisión

Se leyeron `AGENTS.md`, `CLAUDE.md`, el README del repositorio, el índice y componentes/conexiones relevantes del modelo de arquitectura, el relevo del entorno y los módulos citados. Se confirmó por lectura el conjunto de trece lugares. No se ejecutaron pruebas de runtime ni navegación autenticada; no se consultaron ni modificaron Sheets, Apps Script o servicios de negocio. Las verificaciones completas del repositorio deben registrarse con su resultado real por el integrador; una auditoría de documentos no las sustituye.

Antes de entregar un cambio al portal, las instrucciones locales requieren `node scripts/arquitectura.cjs --check`, `node --test tests/*.cjs`, `node verify-os.cjs`, `node verify-portal.cjs`, `node verify-accesos.cjs` y `node verify-obra-app.cjs`. Fijar `ACCESOS_REF` en la comprobación coordinada y comprobar impacto con el repositorio explícito según el relevo. No usar endpoints de negocio como prueba, incluso mediante GET.

## Revisión de las entregas

| Entrega revisada | Resultado |
|---|---|
| R00 · `arranque-equipo.md` | Cola finita y propiedad exclusiva; conserva alcance, evidencia y límite de Hermes. Su corte de recepción R04/R05 es histórico: ambos archivos ya están presentes al cierre de esta auditoría. |
| R01 · `mapa-paridad.md` | Cubre los trece IDs, coordenadas, colisiones, anexo, diferencias entre pick y lugar y los destinos operativos. Identifica la ambigüedad `lounge`/Biblioteca y la ficha genérica de `entry` sin atribuir funciones nuevas. |
| R02 · `ux-retro.md` | Propone presentación original, controles DOM equivalentes, teclado, foco, móvil y movimiento reducido. Mantiene selección, estados y límites de las áreas preparadas. Es especificación, no evidencia visual de aceptación. |
| R03 · `contratos-backend.md` | Cubre identidad, época, transporte, mutaciones/recibos, voz, observaciones, chinches y ejecutor. Identifica dependencia transitiva de Three y el hueco de zona `library` en chinches. |
| R04 · `contrato-integracion.md` | Define entrada futura aislada, controles actuales, resolución de enlaces relativos, desmontaje, pruebas y reversión. Separa I1–I4 y deja la activación OS para I3. No confunde ruta propuesta con ruta existente. |
| `modelo.json` y `architecture-impact.json` | Revisión `2026-10-30.despacho-retro.1`, propuesta `RETRO`, cambio `CHG-DESPACHO-RETRO-20261030` y contrato `CTR-DESPACHO-RETRO-PRESENTACION` coherentes. Se añadió propiedad de `docs/retro-office/`; el estado de implementación sigue `propuesto`. El diff no cambia runtime ni reclasifica conexiones productivas como retro. |

### Condiciones acotadas para los bloques siguientes

1. **I1:** no importar Three ni la cadena de arranque/avatares 3D. La independencia de Three es una decisión técnica más estricta adoptada en R03/R04; la fuente actual sólo acredita que el mapa no crea renderer WebGL. Verificar grafo transitivo y carga de red con bloqueos, no sólo búsqueda textual de imports directos.
2. **I2:** conservar consumidores transversales, no limitar la paridad a trece botones. Resolver enlaces relativos de fichas desde la carpeta nueva y adaptar DOM/boots, presencia y ciclo de vida sin duplicar transporte. El caso `library` de chinches requiere decisión y prueba explícita; la limitación actual está documentada, no resuelta.
3. **I3/I4:** mantener pruebas completas de portal, permisos y recuperación; comprobar UX real y producción por separado. La aprobación documental no autoriza etiquetar una demo sintética como oficina funcional completa.

Estas son puertas de implementación ya identificadas por el equipo, no defectos que obliguen a prolongar el arranque. No hubo correcciones de runtime ni publicaciones por el auditor.

### Evidencia de verificación recibida y propia

- La raíz comunicó `node scripts/arquitectura.cjs --check` aprobado y `node --test tests/arquitectura.test.cjs` aprobado, **32/32**; también comunicó `git diff --check` limpio. Se registra como ejecución de la raíz, no del auditor.
- El auditor inspeccionó el diff de `modelo.json`/`architecture-impact.json` y ejecutó `git diff --check` sin errores al revisar el paquete. Este comando no certifica contenido ni ejecución de archivos nuevos no rastreados.
- No se ejecutó aquí la suite completa de portal ni un navegador retro. No hay resultados de runtime que atribuir a este bloque. El registro arquitectónico y sus comprobaciones acotadas no sustituyen esas pruebas futuras.

**Cierre:** R05 entregado. El paquete permite comenzar I1 de forma aislada con asignación concreta; la paridad operativa y la publicación permanecen pendientes. Hermes no tiene ruta identificada ni acuse acreditado.
