# Perfil común del autón · rediseño con Gastón
Registro: 12-oct-2026, America/Hermosillo. Estado: propuesta y diagnóstico; implementación y aceptación pendientes.
La revisión usa el código del portal5169b195 y el arranque real de Patrimonial. No representa capturas de la sesión privada ni mediciones físicas del micrófono.

## Resultado que debe permitir
Abrir al autón, ver el mismo PPP autorizado y conversar sobre una tarjeta, entender el siguiente encargo y revisar su evidencia sin reconstruir información dispersa. Gastón inicia la prueba; Luis y Ruiseñor usan el mismo perfil y las mismas capacidades bajo sus permisos.

## Diagnóstico por superficie
| Superficie | Hallazgo de fuente | Consecuencia y corrección |
|---|---|---|
| Apertura | Perfil/conversación y workspace consumen fuentes por caminos distintos. | Compartir una lectura en vuelo sólo con identidad/caso/credencial vigentes; no almacenar permisos persistentes. |
| PPP | El piloto depende de documentos para localizar su tablero; otros perfiles reciben descriptor explícito. | Localizar vínculo canónico una sola vez, preservando sus comprobaciones; emitir descriptor autorizado requiere coordinación con backend. |
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
