# YOD Core · contratos y registro durable

**Entrega ejecutable local, no un segundo motor de producción.** Este paquete
termina la base técnica del PR281. No importa prospectos ni tareas de Sheets,
no modifica los objetivos existentes, no llama a Claude ni ejecuta herramientas
externas. No es una implementación completa de la estrategia empresarial 10X.

## Componentes

- `../os/yod-core-domain.cjs`: estados, responsable, aceptación, revisión y
  conciliación; funciona sin red ni persistencia y no concede permisos.
- `store.cjs`: tarea + evento + recibo se confirman en una transacción SQLite;
  índice único para una identidad activa y control de revisión. Prueba de dos
  procesos sobre el mismo archivo local, no de servidores independientes.
- `cli.cjs`: interfaz JSON para un operador local de confianza. Exige una ruta
  privada fuera del árbol publicado. No expone HTTP ni recibe tokens de usuarios.
- `tests/`: reinicio, concurrencia, caída antes de commit, fallo de recibo,
  referencias obsoletas, guardas de verificación y privacidad básica.

## Ejecución

Probado con Node **22.16.0**; `node:sqlite` es experimental en esa versión. Las
pruebas de dominio también corren con el Node20 de las verificaciones existentes.
No cambiar la versión del servicio cloud existente por instalar este paquete.

```sh
node --test tests/yod-core-domain.test.cjs yod-core/tests/*.cjs
mkdir -p "$HOME/.local/share/yod-core"
export YOD_CORE_DB="$HOME/.local/share/yod-core/work.sqlite"
printf '%s\n' '{"type":"metrics"}' | node yod-core/cli.cjs
```

Ejemplo **sintético**, sin conexión a un PPP real:

```json
{"type":"create","requestId":"demo-create-1","actor":"operador-local","work":{"id":"DEMO-1","entityId":"PRJ-DEMO","objective":"Comprobar un artefacto de ejemplo","scope":"demo-v1","acceptanceCriteria":"Artefacto revisado independientemente"}}
```

Enviar el JSON por stdin al CLI. Para asignar: `type:transition`, `to:assigned`,
`workId`, `requestId` nuevo, `expectedRevision` observado, `actor` y `owner`.
Sólo ese owner puede pasar a running y presentar evidencia en verifying.
`get`, `list`, `events`, `receipt` y `metrics` no cambian tareas.

## Cierre y recuperación seguros

El dominio comprueba que el verificador sea distinto del responsable y que la
prueba corresponda a la revisión exacta del trabajo y del artefacto. Eso es una
validación de **contrato**, no una visita a una URL ni ejecución de pruebas externas.

El almacén exige además un adaptador de confianza `verifyEvidence` que confirme
el recibo real. **Sin adaptador no se puede cerrar una tarea**, aunque el JSON
diga `passed:true`. El CLI no instala ese adaptador. La identidad `actor` del
cliente debe ser reemplazada por la identidad autenticada en la futura integración.

Una escritura incierta permanece bloqueada. Para salir exige un adaptador
`verifyReconciliation` y recibo coincidente. `applied` lleva a verificar el
resultado existente, nunca a repetirlo. `not_applied` permite reasignar de forma
explícita. Una interrupción no reactiva tareas por sí sola. Los checkpoints
conservan referencias a pasos confirmados, no ejecutan pasos al abrir la base.

Los adaptadores son funciones síncronas que consultan evidencia ya comprobada y
devuelven exactamente `true`; no hacen llamadas de red ni efectos dentro de la
transacción. Las pruebas inyectan dobles **sintéticos**, no acuses de otro agente.

## Integración pendiente, sin duplicar lo existente

La arquitectura ya identifica un motor privado del Despacho, metas durables,
cola y recibos. Antes de conectar este contrato se debe decidir la correspondencia
con sus IDs y transportes; no crear una segunda tarea para una meta existente.
El anfitrión debe aportar autenticación, autorización por entidad, validación
independiente de recibos, política de aprobación y el montaje privado real.
No instalar un nuevo endpoint público ni cambiar Portero para aparentar integración.

La unicidad aquí es exacta para entidad/objetivo/alcance activos (normalización NFC
y espacios extremos); no fusiona prospectos por semejanza. Dependencias sólo
referencian trabajos ya existentes y deben estar done antes de asignar/ejecutar.
Cifras comerciales, plazos prometidos y ahorros 10X no se infieren de estos tests.

## Conservación y límites

Usar disco local persistente del mismo servidor, no NFS ni carpetas sincronizadas.
El modo WAL no coordina máquinas diferentes. La política de capacidad y respaldos
para operación real debe definirse antes de su activación; no borrar registros
para resolver espacio. No publicar archivos `.sqlite`, `-wal` o `-shm`.

Los triggers impiden modificar eventos/recibos a través de operaciones normales,
pero un administrador con acceso al archivo puede alterar la base: no es un log
inmutable ante el administrador ni una firma criptográfica. WAL/FULL no reemplaza
respaldo ni protege contra destrucción del disco. Para copiar una base, cerrarla
limpiamente o usar la API de backup de SQLite; no copiar sólo el archivo principal
mientras hay transacciones activas. Revertir el código nunca borra la base.

Referencias técnicas: documentación de Node v22.16.0 `node:sqlite`; documentación
oficial SQLite de transacciones y WAL. La evidencia de ejecución vive en las
corridas GitHub Actions y la bitácora `../docs/arquitectura/yod-core-10x-20261017.md`.
