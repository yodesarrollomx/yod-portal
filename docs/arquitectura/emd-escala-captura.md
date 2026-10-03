# EMD issue #39 · escala de nuevas capturas

Registro: `CHG-EMD-ESCALA-039`. Contrato: `CTR-EMD-ESCALA-CAPTURA`.
Componentes: `SYS-EMD`, `GAS-EMD`, `SHEET-EMD`.

El propietario aprobó explícitamente el 2 de octubre de 2026 retirar NA de
nuevas capturas, conservar NA históricos y representar 1 rojo → 5 verde,
porque las 28 preguntas actuales son favorables. Esta autorización acota las
referencias previas a escala intacta; no modifica los textos ni la cantidad de
preguntas, asignaciones, ponderación, cálculos, accesos o reglas de cierre.

## Estado y compatibilidad

Este PR registra la propuesta aprobada y el contrato en el atlas. La
implementación del frontend y del guard de backend corresponde al agente
principal en el sistema privado. No se inspeccionó ni modificó el repositorio
EMD, el Apps Script activo o los datos Google como parte de este trabajo.
Integrar este registro no acredita implementación ni despliegue de EMD.

El servidor conserva autoridad sobre el valor confirmado vigente. Solo admite
NA cuando ya está confirmado en esa misma evaluación y pregunta; un cliente
antiguo, otra pregunta, otra evaluación o un borrador local no habilitan la
excepción. Si NA se reemplaza válidamente por 1..5, no puede introducirse otra
vez. Las evaluaciones cerradas permanecen cerradas.

El frontend presenta opciones 1..5 con números y etiquetas accesibles: rojo,
naranja, amarillo, verde claro y verde. NA histórico permanece legible con su
representación existente, sin ofrecerse como opción nueva ni colorearse como
puntaje. El color no transforma respuestas ni altera cálculos. El guard valida
el lote antes de escribir, conserva revisión e idempotencia existentes y debe
aceptar NA histórico sin cambios en payloads completos válidos. Guardar otra
pregunta o cerrar no normaliza ni reescribe los registros históricos.

La recuperación local sigue requiriendo revisión frente al servidor bajo
`CTR-EMD-DRAFTS`: un NA local sin confirmación vigente debe corregirse antes de
enviar, sin borrado silencioso de la copia. No se añaden campos, endpoints,
recursos, permisos ni conexiones. Las reglas existentes de vacío y
obligatoriedad permanecen.

## Matriz de aceptación pendiente en EMD

Todos los casos usan datos sintéticos y dobles aislados; no son resultados de
pruebas ya ejecutadas sobre el sistema privado.

| Caso | Resultado requerido |
|---|---|
| Pregunta vacía o numérica recibe 1, 2, 3, 4 o 5 | Admitir según autorización, revisión y reglas existentes |
| Pregunta vacía o numérica recibe NA, incluso desde cliente antiguo | Rechazar explícitamente antes de cualquier escritura |
| NA confirmado en evaluación E1/pregunta P1 se conserva | Admitir; conservar registro y significado históricos |
| NA confirmado en E1/P1 se copia a E1/P2 o E2/P1 | Rechazar; la excepción no se transfiere |
| Borrador local o snapshot obsoleto contiene NA sin confirmación vigente | Rechazar nuevo NA; conservar copia para corrección revisada |
| Edición de P2 con NA confirmado sin cambios en P1 | Guardar P2 sin normalizar ni reescribir P1 |
| Lote contiene NA histórico válido y otro NA nuevo | Rechazar el lote completo sin persistencia parcial |
| NA histórico se reemplaza por 1..5 y después se intenta volver a NA | Admitir primera edición válida; rechazar reintroducción |
| Revisión obsoleta o edición concurrente | Mantener rechazo de conflicto; no usar snapshot viejo para conceder NA |
| ACK perdido y reintento exacto | Mantener resultado idempotente existente; no duplicar ni saltar guard |
| Evaluación cerrada, recarga o intento de reabrir | Mantener cierre e historial; ningún nuevo permiso de edición |
| Guardado y cierre de evaluación con NA histórico | Conservar valores, tratamiento de cálculo y registros históricos |
| Móvil, escritorio y teclado | Opciones 1..5 rojo→verde, foco y etiquetas legibles; NA histórico visible |
| Regresión del instrumento | 28 textos/IDs, asignaciones, ponderación, cálculos y accesos sin cambios |

## Verificación del atlas

Ejecutar esquema/IDs y vistas con `node scripts/arquitectura.cjs --check`,
`node --test tests/*.cjs` y los verificadores `verify-os.cjs`,
`verify-portal.cjs`, `verify-accesos.cjs` y `verify-obra-app.cjs`.
Para accesos fijar `ACCESOS_REF=3ee8ca50bf14ef17d95e72523e54506eb996f262`,
la referencia coordinada existente. Comprobar impacto contra el commit base
del PR y `git diff --check`. La matriz funcional anterior queda pendiente del
HEAD privado y de la evidencia del agente principal.

## Orden y reversión

Integrar el atlas por PR después de sus checks. En la implementación privada,
respaldar fuente/configuración y versión activas sin publicarlas; preparar y
probar frontend y guard juntos. Activar el guard antes o junto al frontend:
ocultar NA en cliente sin guard deja clientes antiguos capaces de introducirlo.
Actualizar la implementación GAS existente conservando URL y permisos.
Registrar separadamente commit privado, versión GAS y comprobación del
recorrido publicado, sin escrituras de prueba sobre datos humanos.

Rollback del atlas: revertir este PR mediante otro PR y regenerar vistas,
preservando aportes concurrentes. Rollback funcional: restaurar frontend previo
manteniendo el guard que bloquea NA nuevos. Una versión GAS previa solo es
elegible si conserva un guard equivalente; si no existe, suspender la captura
afectada hasta preparar un parche compatible, conservando lectura e historial.
No reactivar NA como opción nueva. Nunca migrar, borrar, reescribir, imputar o
recalcular respuestas históricas como parte de la reversión.
