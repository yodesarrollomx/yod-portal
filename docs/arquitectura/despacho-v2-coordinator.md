# Despacho 2.0 · parte 2: coordinador aislado

Implementación opt-in en `os/load-coordinator.mjs`. **No está conectada a las
pantallas ni activa en producción.** Parte 3 integra adaptadores; partes 4 y 5
resuelven continuidad y recursos; parte 6 mide el recorrido y activa la entrega.
Este núcleo no sustituye permisos, transportes, pool de acceso ni contratos de
escritura existentes. No instala caché, service worker ni coordinación de pestañas.

## Contrato ejecutable

`createLoadCoordinator({ context, limits?, now?, setTimer?, clearTimer?, defer? })`
crea una instancia explícita. `context` contiene `sessionEpoch` opaco (nunca token),
`caseId` y `selectionGeneration`. El adaptador propietario debe proporcionar una
época nueva al cambiar o revalidar identidad y una generación nueva al seleccionar.
`setContext` no concede autorización; sólo invalida trabajo anterior. `revoke`
bloquea nuevas admisiones hasta recibir otro contexto ya verificado.

`submit({ taskId, resourceKey, revision, run, ... })` devuelve
`{ promise, cancel, promote, status }`. `promise` siempre resuelve un resultado
estructurado: `state`, `reason` cuando aplica, `current`, y `value` sólo al tener
éxito. Errores del adapter no se exportan a diagnósticos. No registrar `value`.

| Campo | Regla |
|---|---|
| `resourceKey` | Operación y parámetros canónicos; sin tokens ni URLs privadas. El adaptador debe construirla correctamente. |
| `revision` | Versión compatible de recurso/adaptador/política. Se exige explícita; no TTL universal. |
| `scopeType` | `selection` por defecto; `session` sólo para recursos independientes del caso. |
| `kind` | `read`, `asset` o `write`; las escrituras sólo P0/P1 y nunca se deduplican. |
| `priority` | P0 continuidad/seguridad, P1 pantalla/acción, P2 siguiente paso, P3 resto. |
| `resource` | `network` o `cpu`; ejecución CPU debe dividirse y ceder control en el adaptador. |
| `origin` / `lane` | Identificadores lógicos, no URL; mantienen el límite del transporte existente. |
| `dependencies` | Handles anteriores de esta instancia y ámbito compatible; DAG sin referencias futuras. |
| `timeoutMs` | Plazo absoluto de esta tentativa desde admisión, incluida cola. Por defecto 25 s. |
| `run({signal,scope})` | Un solo intento; permisos actuales se comprueban dentro del adaptador. Devuelve datos, nunca pinta la vista directamente. |

La deduplicación existe sólo mientras la operación está pendiente/en vuelo, con
igual clave, revisión, ámbito, origen, carril, recurso, plazo y dependencias. La
segunda suscripción comparte la tentativa y su plazo restante, no prolonga el
límite. Al terminar, otra petición es otra lectura; el caché de datos corresponde
a la parte 4. `promote` sólo sube prioridad y no duplica la petición. La prioridad
se propaga a dependencias: una operación urgente no espera una precarga pausada.

El presupuesto inicial es red=4, CPU=1, fondo=1, por origen=2, por carril=1,
reserva de primer plano=1. Es configurable y aún no calibrado con producción.
P0/P1 elegibles impiden admitir fondo nuevo. P2/P3 progresan por prioridad y orden
de llegada cuando queda capacidad; no se promete ausencia de espera bajo carga
urgente sostenida. Una solicitud ya iniciada en un carril no es interrumpida para
simular prioridad. Un origen configurado con capacidad 1 no puede reservar otra
plaza: respeta el límite físico y espera.

## Cancelación, resultados y acuses

- Cancelar un consumidor no afecta a los otros. Al retirarse el último, una
  lectura recibe abort y su resultado se descarta. El aborto no acredita que
  Google o el servidor detengan la ejecución.
- Tras timeout/aborto, el slot físico se conserva hasta que `run` termine. Un
  adaptador que ignora abort puede dejar un slot drenando; no se libera para
  lanzar solicitudes superpuestas. Debe implementar un final observable.
- Cambio de contexto descarta lecturas pendientes/en vuelo del ámbito anterior.
  El consumidor debe cotejar también `handle.status().current` justo antes de
  aplicar el resultado a la vista: el contexto puede cambiar después de resolver.
- Una escritura admitida no se aborta al navegar, ocultar, revocar o disponer la
  instancia. El servidor conserva la decisión de permiso. Puede devolver su
  recibo con `current:false`; se conserva para conciliación, nunca pinta otro caso.
- Timeout o excepción de escritura produce `write_outcome_unknown`: no reintento.
  El mismo `taskId` de escritura queda reservado durante la vida de la instancia.
  Esto no reemplaza request_id/expected_revision del backend ni evita duplicados
  entre pestañas. Conciliar por esos contratos en la parte 4.
- `pauseBackground()` detiene nuevas precargas, no voz ni operaciones activas.
  La señal de visibilidad se integrará después con la política correspondiente.
- `snapshot()` sólo expone conteos/estado, nunca claves, contexto o resultados.
  `status().queueMs` sirve al adapter para medición. No mide render ni operación
  utilizable: esas marcas se incorporan al integrar y validar pantallas.

## Evidencia y cobertura

Pruebas deterministas en `tests/load-coordinator.test.cjs`, sin red ni datos reales.
Cubren orden, límites, progreso del fondo, prioridad heredada, dependencias,
deduplicación, cancelación compartida, aislamiento, cambio de contexto, plazos,
escrituras inciertas, CPU y diagnósticos sin contenido privado.

| Casos del plan | Cobertura de esta parte |
|---|---|
| A3, A4, A7, A13, A14 | Invariantes del núcleo probadas sintéticamente; integración de pantalla pendiente. |
| A5, A6, A10 | Fallo por rama, escritura incierta y límites probados; UI/recibos/recuperación todavía no integrados. |
| A1, A2, A8, A9, A11, A12 | Exigen partes 3–6: pantallas, caché/vigencia, voz, pestañas, 3D y conflictos. No se declaran aprobados. |

Ejecutar `node --test tests/load-coordinator.test.cjs`, suite Node completa y
verificadores del repo. No hay cambio visual que requiera QA de apariencia en
esta parte. Ningún índice/boot importa el módulo. Reversión: retirar estos archivos
y su declaración de arquitectura; sin migraciones de datos ni despliegue backend.

## Parte 3: integración opt-in de pantallas y consultas

`os/load-config.js` mantiene `enabled:false`. No se habilita mediante URL,
localStorage o mensajes del iframe. La activación y medición global corresponden
a la parte 6. `load-plan-boot.js` sólo importa el plan al habilitarlo; si no puede
cargarlo, Inicio y el puente de Despacho conservan su ruta anterior.

El plan comparte la admisión de catálogo, finanzas, marketing y operaciones de
Inicio con las lecturas del puente de Despacho. Inicio puede avanzar a prioridad
3 mientras está abierto Despacho; al volver a Inicio se promueven las cargas
pendientes. La selección explícita, recibida únicamente del iframe autorizado
y del mismo origen, eleva las lecturas de ese caso. Es una pista de planificación,
no una autorización: todos los controles del puente, transporte y servidor siguen
vigentes. La época utilizada es un contador local, nunca una credencial.

Las lecturas de caso comparten vuelos por operación y parámetros dentro de la
sesión. Cada consumidor seleccionado conserva su generación: cambiar A→B
cancela ese consumidor y descarta su respuesta, sin cancelar otro consumidor
independiente de fondo. La lectura física conserva su plaza hasta terminar.
Elegir un caso que ya estaba leyendo en fondo promueve y reutiliza ese vuelo.
Los carriles originales se mantienen; escrituras y emisión de sesiones rápidas
no pasan por el plan ni reciben reintentos nuevos.

Los límites se aplican a llamadas de adaptadores, no a cada petición interna de
red que pueda efectuar un adaptador. Las funciones existentes de Inicio conservan
sus comprobaciones de identidad antes de actualizar la interfaz; el plan no
sustituye esas comprobaciones. Esta parte no añade caché persistente, liderazgo
entre pestañas, reconciliación de escrituras, gestión de medios/voz ni una garantía
de frescura adicional: corresponden a las siguientes partes del contrato.

Validación sintética de la integración: `node --test tests/load-plan.test.cjs`
y el caso P3 de `tests/portal-identity.cjs`. Comprueba deduplicación, promoción,
selección cambiante, retención del carril físico, revocación, ruta de mutaciones,
arranque apagado, fallback y puente real con origen/iframe comprobados. No mide
latencia de producción ni acredita publicación.

## Parte 4: continuidad de datos, sin activar

`data-continuity.mjs` mantiene sólo memoria de la pestaña: lecturas de expediente
por 1 s, metas por 2.5 s y visitas por 3 s, con máximo 32 entradas. Catálogo de
casos, resolución de selección, permisos, pendientes de oficina y credenciales
no tienen caché nueva. Los adaptadores de Inicio conservan sus reglas actuales.
Una época nueva o revocación limpia datos y recibos locales. Un cambio incrementa
la revisión de lectura: una respuesta anterior no se publica ni se vuelve a usar
para una consulta posterior. Nunca se restaura autorización desde esta memoria.

El puente conserva sus carriles y los cuerpos originales de escritura. El diario
de recibos en memoria agrupa únicamente la misma operación/caso/request_id con
contenido idéntico; un contenido distinto recibe request_id_reused. No agrupa
encargos parecidos ni coordina escrituras entre pestañas. Un timeout deja el
resultado incierto; una repetición explícita consulta primero read/readGoals/
readVisits y no vuelve a mandar la mutación. Si llega el acuse original tarde,
se conserva ese acuse real. La lectura de un job permite al consumidor existente
conciliar el request_id, pero no se fabrica un ACK a partir de similitud o estado.

**Límite explícito:** las proyecciones actuales de metas y visitas no ofrecen un
lookup universal del recibo por request_id. Si el ACK se perdió definitivamente,
el guardado sigue sin confirmar: se conserva el borrador y queda pendiente la
conciliación por una fuente que identifique la operación. No equivale a fallo del
guardado ni autoriza repetirlo. La protección es de esta pestaña/época, no de
recargas o navegadores distintos; la idempotencia durable sigue siendo del backend.
El diario admite 500 operaciones por época y rechaza nuevas si se llena, sin
olvidar una operación incierta para abrir espacio. Rechazos previos a la admisión
(transport_busy/session_pending) permiten un intento explícito posterior.

`tab-continuity.mjs` transmite exclusivamente version/type/id aleatorio mediante
BroadcastChannel. Pulsos cada 5 s y expiración a 15 s eligen por ID quién admite
fondo; no comparten casos, cuerpos, cifras, URLs ni tokens. Es coordinación de
mejor esfuerzo, **no un mutex distribuido ni una garantía de líder único**. Una
pestaña sin soporte funciona sola. Ocultarse/desconectarse anuncia salida; volver
agrupa señales en 200 ms, revalida identidad, invalida lecturas y actualiza los
paneles abiertos. Los trabajos visibles y las escrituras ya admitidas no dependen
del líder. Sólo el fondo se pausa; no se cuelga voz ni se cambia trabajo remoto.

La validación de identidad termina sin esperar datos de fondo bloqueados por otra
pestaña. Si una carga diferida vence, Inicio queda elegible para volver a cargarla.
El mensaje de invalidación al iframe requiere padre/origen/esquema exactos;
usa los métodos existentes de actualización sin abrir paneles ni vaciar borradores.
Los conflictos siguen mostrando la resolución existente y nunca se sobrescriben.
No se añaden reintentos automáticos de mutación ni sondeo de negocio nuevo.

Pruebas: data-continuity, tab-continuity, integración real del puente en load-plan
y funciones reales de app en portal-identity. Fixtures de ACK perdido/tardío,
cambio de sesión, invalidación durante lectura, conflicto, límite de memoria,
TTL por recurso, caída de líder, offline/visibility y señales extranjeras.
La parte 6 comprobará activación y recorrido completo con este modo habilitado;
las regresiones existentes mantienen el interruptor apagado.

## P5 · recursos y operación activa (15 octubre 2026)

Dirección autorizó explícitamente «actival y continua a la 5». Sustituye la
espera anterior hasta P6 para activar el coordinador P2–P4 ya verificado.
P6 conserva la medición comparativa y validación general, sin porcentajes
anticipados de mejora.

- `load-config.js` activa el coordinador estáticamente. Reversión: `enabled:false`
  y nueva versión del script; nunca por URL o almacenamiento del cliente.
- `frame-budget.mjs` es dueño exclusivamente de los cuadros visuales: hasta
  60 fps normal, 30 en presupuesto compacto y 15 con el puesto superpuesto.
  Son topes, no rendimiento medido. Ocultar o perder contexto cancela el RAF;
  volver restaura un único ciclo y conserva el estado de cámara/selección.
- No se modifican audio, micrófono, renovación de sesión, contratos de voz
  ni ejecución remota. El presupuesto no llama a ninguna de esas capacidades.
- El observador deja de programar temporizadores mientras no sea visible/online;
  volver solicita una lectura, compartiendo el vuelo existente. Un observador
  sigue siendo lector: no inicia, reanuda ni cancela trabajos.
- Las texturas existentes mantienen una captura decodificada por pantalla y
  sustitución por identidad de ejecución; se conserva la liberación de imágenes
  pendientes y textura al retirar la oficina. Entorno y renderer se liberan
  al salir. No hay nueva caché persistente ni descarga especulativa de expedientes.
- La oficina accesible existente sigue disponible cuando WebGL falla; no se
  elimina diseño ni se oculta contenido para aparentar menor tiempo de carga.

Pruebas sintéticas: topes durante 120 cuadros, pausa/retorno/contexto perdido,
cancelación al retirar, cero temporizadores de observación ocultos y un vuelo
al despertar. Suite 776 PASS antes de publicación. Producción y mediciones
reales se acreditan con recibos separados; los tests no las sustituyen.
