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
