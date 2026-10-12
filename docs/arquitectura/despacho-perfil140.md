# Perfil común del autón · rediseño con Gastón
Registro: 12-oct-2026, America/Hermosillo (UTC−7). Estado: implementación y pruebas; PPP publicado, perfil en revisión antes de publicación.
La revisión partió del portal `5169b195` y del arranque nativo de Patrimonial; el candidato conserva también las integraciones posteriores de reuniones. No representa capturas de la sesión privada ni mediciones físicas del micrófono.

## Resultado que debe permitir
Abrir al autón, ver el mismo PPP autorizado y conversar sobre una tarjeta, entender el siguiente encargo y revisar su evidencia sin reconstruir información dispersa. Gastón inicia la prueba; Luis y Ruiseñor usan el mismo perfil y las mismas capacidades bajo sus permisos.

## Diagnóstico por superficie
| Superficie | Hallazgo de fuente | Consecuencia y corrección |
|---|---|---|
| Apertura | La preparación podía dejar esperando al caso seleccionado detrás de lecturas pendientes. El broker ya comparte lecturas en vuelo. | Priorizar el caso elegido dentro de la cola existente; conservar identidad/caso/credencial vigentes. No instalar un segundo caché ni guardar permisos persistentes. |
| PPP | El piloto depende de documentos para localizar su tablero; otros perfiles reciben descriptor explícito. | La lectura autorizada confirmó un vínculo único del piloto con su PPP. Se conserva ese mecanismo y sus comprobaciones; no se inventa una relación por nombre ni se escribe un ID privado en el frontend. |
| PPP nativo | Arranque Patrimonial espera catálogo antes de caso; un error temporal puede invocar el gate y borrar sesión compartida. | Lectura exacta del caso independiente del catálogo, espera acotada, error local y protección de respuestas tardías. |
| Navegación | Ocho superficies organizadas en grupos; los mismos datos se repiten en voz, resumen, actividad y objetivos. | PPP persistente, conversación lateral y bandeja contextual de trabajo. |
| Pendientes | Son encargos de análisis del runtime; no equivalen automáticamente a metas/acciones MOAC. | Etiquetar procedencia y distinguir estado de negocio, encargo, intento y entrega. |
| Siguiente acción | Orden por estado/actualización y número de tarea; no prioridad empresarial estructurada. | Mostrar una siguiente acción respaldada por estado e instrucción, sin inventar prioridad ni método. |
| Presentaciones | Existe presentación derivada de entrega real con revisión exacta y guion. | Reutilizarla desde la entrega; conservar grabación y reuniones en curso. |

La reproducción aislada del bootstrap detecta que lista={ok:false,error:lock_busy} lleva a borrar la sesión y no abrir el caso. Es un defecto de código; no demuestra que ése fuera el error particular de la sesión de Alejandro. Las demoras deben medirse, no inferirse por ese diagnóstico.

## Estructura del perfil
1. Cabecera compacta: nombre, proyecto, disponibilidad y fecha de información. El avatar identifica y no ocupa el lienzo.
2. PPP principal: tablero nativo, tarjetas cerradas y selección compartida. Conversación sigue visible al consultar una tarjeta.
3. Conversación: registro continuo, texto y voz. Un control de interrupción visible; diagnóstico/opciones plegados.
4. Trabajo: Ahora, Bloqueado y Para revisar. Historial detenido/completado aparte; no anunciarlo como nuevo pendiente.
5. Ficha contextual: resultado esperado, criterio, instrucción, fuentes disponibles, estado, evidencia y bloqueo. Un método ausente se declara, no se rellena con ficción.
6. Instrumentos: documentos, navegador y notas/versiones siguen disponibles, asociados al trabajo, sin competir como ocho destinos primarios.
7. Entrega: presentación desde un resultado identificado; una o dos láminas por tema, guion de esa versión, preguntas y revisión. Revisión técnica no altera negocio.

La rueda mantiene cuatro destinos conocidos y acceso por teclado/toque. Acercarse puede abrir la rueda; la conversación por proximidad sigue como cápsula y ampliar conserva el canal de voz. Cambiar una dirección no crea encargos. El PPP y los instrumentos se conservan al cambiar de vista; cambiar de caso invalida datos del anterior.

## Modelo de trabajo y estados
| Registro | Autoridad | Qué significa |
|---|---|---|
| PPP | Libro y motor canónicos del caso | Datos, tarjetas, versiones y cálculos compartidos |
| Meta/acción de negocio | MOAC expresamente vinculado | Compromiso y estado empresarial |
| Encargo | Solicitud durable autorizada | Resultado que se delegó y criterio de entrega |
| Ejecución | Lease, intento y herramientas observadas | Trabajo realmente en curso o interrumpido |
| Entrega | Evidencia y recibo exactos | Preparado para revisión |
| Presentación | Derivada de una entrega | Explicación breve; no aceptación automática |
| Conversación | Mensajes e intenciones explícitas | Hablar no equivale a guardar un encargo |
| Historial | Intentos, cambios y decisiones | Reconstrucción; abrir no reanuda |

Ahora requiere una ejecución vigente o un encargo explícito disponible. Bloqueado muestra la causa y la siguiente decisión. Para revisar requiere evidencia registrada. Las metas detenidas o aceptadas quedan en historial. El esquema actual no contiene método/fuentes por tarea estructurados: la interfaz utiliza únicamente instrucción/criterio/evidencia existentes y señala campos ausentes.

## Métodos utilizados
Son adaptaciones propias de principios publicados; los autores no participan ni firman esta revisión.
- Alex Hormozi: reducir demora y esfuerzo para obtener un resultado confiable. Se traduce en PPP/conversación simultáneos y evidencia visible, no en promesas o porcentajes inventados. [Checklist de valor](https://www.acquisition.com/hubfs/Offer%20Checklists%20-%20PDF%20Downloads/Pricing-Value-Checklist.pdf?hsLang=en).
- John Maxwell: equipar con ejemplo, acompañamiento, observación y corrección. Cada tipo de encargo debe tener criterio de buena entrega, herramienta disponible y revisión reutilizable. [Four Ways to Equip People](https://www.maxwellleadership.com/podcast/four-ways-to-equip-people/).
- Brian Tracy: ordenar por consecuencias y concentrarse en la acción prioritaria. La sugerencia debe explicar dependencia/impacto; delegar no concede permiso para borrar objetivos. [Método ABCDE](https://www.briantracy.com/blog/time-management/the-abcde-list-technique-for-setting-priorities/).
- UX: estado visible, control, consistencia y reconocimiento. Un fallo muestra recuperación local y conserva el trabajo autorizado. [Heurísticas de usabilidad](https://www.nngroup.com/articles/ten-usability-heuristics/).

## Método del autón
Leer el PPP y vínculos autorizados → fijar resultado y criterio → revisar biblioteca interna → investigar fuera cuando falte información → distinguir hechos/supuestos → producir evidencia → guardar entrega para revisión → presentar y recibir correcciones. La pantalla muestra el paso registrado, no una animación de trabajo.
Sin vínculo empresarial confirmado no se crea un MOAC paralelo. Sin fuente suficiente se pide el dato concreto. No se repiten efectos inciertos, se aprueban finanzas ni se reactivan objetivos cancelados.

## Carga y recuperación
Interfaz, datos y voz tienen estados independientes. Se reutiliza preparación autorizada vigente por expediente; una sesión de micrófono no se abre sólo para parecer precargada. PPP no depende de que la voz conecte. La lectura del caso no espera todo el catálogo. Timeout/error transitorio no borra la sesión del OS; denegación real retira datos de esa superficie y explica el acceso.
Métricas separadas: clic→perfil, clic→PPP, inicio→primer audio, intervención→corte local. Hard refresh y reapertura se miden por separado con el mismo escenario. Objetivos propuestos: respuesta visual≤100ms, perfil precargado útil≤1s, corte local≤200ms; pendientes de medición, no resultados logrados.

## Pruebas de cierre
| Recorrido | Condición |
|---|---|
| Avatar/nombre/rueda | Mismo caso y componente, sin ruta vacía |
| PPP y voz | Tablero y tarjetas reales simultáneos; selección/versiones coherentes |
| Catálogo lento/fallido | Caso exacto sigue cargando; sesión compartida conservada |
| Audio fallido | PPP y texto disponibles, error recuperable |
| Encargos | Procedencia, criterio, instrucción, evidencia y bloqueo comprensibles |
| Reapertura | No reanuda ni duplica solicitudes |
| Cambio de caso | Expulsa datos, permisos y acuses del anterior |
| Respuesta tardía | No aplica el caso anterior ni restaura acceso |
| Revisión/presentación | Identidad, revisión y recibo exactos; ningún cierre de negocio automático |
| Chromebook/móvil | Controles accesibles, sin overflow; foco y selección persistentes |
| Sesión privada | Evidencia real de PPP/micrófono, registrada de forma privada |

Las pruebas aisladas verifican lógica. El cierre operativo requiere commits, publicación real y recorridos privados; no se escriben cifras/objetivos de empresa para provocar un ensayo. Las capturas del usuario permanecen privadas; diagramas de organización no se presentan como screenshots.

## Orden y solapes
Primero corregir vínculo/carga/recuperación PPP; luego reorganizar el perfil; después verificar datos, voz y presentación. PortalPR199 trabaja reuniones/agent-workspace y PotencialesPR24 toca motores: se coordina el reparto y se conserva su funcionalidad. PR116 privado es publicación MOAC, no se mezcla con este rediseño ni se repiten sus instalaciones.
Conservar todas las capacidades, URLs, contratos, recibos y fuentes. Publicar sólo después de pruebas y revisión. Volver atrás mediante commits, sin restaurar hojas de negocio o borrar historia.


## Registro de ejecución y evidencia

Las horas siguientes son UTC; Hermosillo corresponde a UTC−7. Los resultados de navegador usan HTML y módulos reales con transportes y expedientes de prueba aislados. No son capturas ni mediciones de una conversación privada.

| Fecha UTC | Cambio y motivo | Resultado comprobado |
|---|---|---|
| 2026-10-12 19:17–19:32 | Se revisaron las ocho superficies, las fuentes y los solapes; se registró la propuesta antes de programar. | Propuesta `0a548fc`; coordinación privada con Claude para la prueba del recorrido autenticado. |
| 2026-10-12 19:32–19:44 | Se separó la lectura de fuentes de la validación de conversaciones; se priorizó la preparación del caso seleccionado y se montó el PPP con tarjetas cerradas. | Fuentes siguen limitadas al caso autorizado; una conversación inválida no habilita escrituras. La preparación no abre micrófonos anticipadamente. |
| 2026-10-12 19:44–20:00 | Se sustituyeron ocho accesos al mismo nivel por tres grupos; el PPP permanece junto al inspector. Se preservaron selección, foco, documentos, navegador, grabador y presentaciones. | Se añadieron recorridos de 1280, 860 y 390 px y comprobaciones geométricas. Las reuniones concurrentes se conservaron; no se reemplazó su archivo con el visor de presentación. |
| 2026-10-12 19:45–20:02 | La revisión separada detectó borradores atrapados, acceso sin recuperación, controles ocultos afectados por CSS y modelos de otro tipo aceptados por fallback. | Se corrigieron antes de integrar. La apertura no descarta borradores ni inicia escrituras; un modelo ajeno falla explícitamente. |
| 2026-10-12 20:02:46 | Se integró Potenciales PR29 tras revisión del commit `62cc4a4`. | 9 pruebas nuevas de apertura, 57 regresiones existentes y 32 recorridos del modo integrado en Chromium/WebKit aprobados. La apertura externa recibe una corrección complementaria al detectarse conflicto con la shell. Se conservan cálculos, API de escritura, URLs y ACL. |
| 2026-10-12 20:04 | Se verificó publicación de Potenciales `f9ce02a3`. | [GitHub Pages: publicación aprobada](https://github.com/yodesarrollomx/potenciales-yod/actions/runs/38301647256). |
| 2026-10-12 20:04–20:07 | Portal `bbe04f6` pasó lógica y verificaciones; dos recorridos de navegador aún buscaban los controles sustituidos. Se corrigen los recorridos, manteniendo sus invariantes. | 652 pruebas de lógica y verificaciones OS/portal/accesos/obra aprobadas; publicación de Portal pendiente del recorrido completo. |

### Qué cambia al trabajar
El PPP es el espacio estable de la conversación. «Trabajo» muestra encargos del autón en Ahora, Bloqueado y Para revisar; los detenidos y terminados permanecen en historial. En cada encargo se leen la instrucción, el criterio y la evidencia registrados. La pantalla informa cuando faltan; no rellena prioridades, planes ni métodos ficticios.
«Expediente» concentra fuentes y documentos. «Presentación» conserva entregas y archivo de reuniones, con identidad y revisión verificadas. El autón ya recibe en el runtime su método de trabajo con fuentes, resultado, criterio, evidencia y siguiente decisión; esta entrega organiza cómo verlo y utilizarlo, no afirma haber instalado otro motor.

### Límites de aceptación
La revisión fue hecha por un agente separado con capacidad de rechazar, dentro de la misma conexión de GitHub. No es independencia de cuentas. La cola de preparación da prioridad entre solicitudes pendientes; no interrumpe una petición en vuelo ni acredita una reducción medida del audio.
El recorrido privado autenticado de Gastón y la interrupción con micrófono físico se dejaron en la bitácora mutua para Claude. No se declaran aprobados por pasar fixtures. No se reactivaron automatizaciones canceladas, se cambió financiación ni se añadieron permisos.

### Continuidad conversacional comprobada
La revisión privada encontró respuestas que confundían recuperación de contexto con ausencia de historial y que mezclaban una respuesta de voz detenida con un encargo detenido. Los registros son fragmentos por intervalo; no sirven para medir latencia acústica ni acreditar ejecución. El diseño separa ambos estados y muestra el contexto registrado. La revisión técnica del arranque de voz sigue siendo necesaria: etiquetar una fase correctamente no demuestra que el modelo haya recibido el expediente antes de responder.
