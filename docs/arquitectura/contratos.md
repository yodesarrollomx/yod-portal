# Contratos de datos e identidad

> Generado desde modelo.json. No editar a mano. Revisión 2026-09-30.2 · 2026-09-30.

Estos contratos no contienen registros reales. Su alcance de evidencia se indica individualmente.

## CTR-PORTERO

- Componentes: GAS-PORTERO, SYS-YOD-OS.
- Evidencia: Cliente yod-acceso/app/shell; backend vivo pendiente.
- Entrada/campos: `credencial de sesión`, `código de tablero cuando aplica`.
- Salida: ok, nombre, correo, rol, boards.

- Cada backend autoriza su operación
- Rechazo explícito no se convierte en permiso por cache o respaldo
- Cambio de token invalida datos y respuestas pendientes

## CTR-MOVIMIENTOS

- Componentes: SYS-FLUJO, SHEET-FLUJO.
- Evidencia: Encabezados Sheets leídos el 2026-09-30; no se publican filas.
- Entrada/campos: `id`, `fecha`, `tipo`, `monto`, `beneficiario`, `proyecto`, `notas`, `capturadoPor`, `timestamp`, `borrada`, `facturado`, `linkComprobante`, `historial`.
- Salida: saldos por bolsa, historial.

- Conservar trazabilidad y referencias
- Confirmar escritor servidor antes de afirmar guardado
- Transferencias parciales requieren conciliación; no reintentar automáticamente sin idempotencia servidor

## CTR-PAGOS

- Componentes: SYS-FLUJO, SYS-YOD-OS, SHEET-FLUJO.
- Evidencia: Encabezados Sheets y contrato frontend comprobados.
- Entrada/campos: `id`, `concepto`, `monto`, `fechaLimite`, `tipoPago`, `prioridad`, `proyecto`, `estado`, `timestamp`, `historial`.
- Salida: obligaciones pendientes, proyección de efectivo.

- El campo canónico de pagos es estado
- Compatibilidad con estatus solo cuando estado no existe
- Los pagos Pagado no cuentan como obligación pendiente

## CTR-INGRESOS

- Componentes: SYS-FLUJO, SHEET-FLUJO.
- Evidencia: Encabezados Sheets y frontend comprobados.
- Entrada/campos: `id`, `concepto`, `monto`, `fechaEsperada`, `estatus`, `proyecto`, `timestamp`.
- Salida: seguimiento de ingresos esperados.

- El campo canónico de ingresos esperados es estatus
- Las etapas visibles son Por gestionar, Por facturar, Facturado y Cobrado
- Cobrado en una pantalla no demuestra conciliación bancaria automática

## CTR-CATALOGO

- Componentes: SYS-YOD-OS, GAS-CATALOGO, SHEET-CATALOGO.
- Evidencia: Control Maestro y catálogo técnico; hay diferencias registradas.
- Entrada/campos: `system_id`, `sistema`, `función`, `url`, `repositorio`, `fuente_datos`, `estado`, `sensibilidad`, `responsable_id`, `última_revisión`, `notas`.
- Salida: menú y destinos permitidos.

- Un system_id identifica el sistema; resolver alias de portal explícitamente
- El catálogo no concede permisos de backend
- Dependencias institucionales de Sheets no equivalen al grafo de software

## CTR-PPP-SHEETS

- Componentes: SYS-POTENCIALES, GAS-PORTERO, SHEET-PORTERO, SHEET-PPP-MODELOS, SYS-CONTROL.
- Evidencia: Decisión explícita de Dirección y contrato público de cálculo nativo; pruebas aisladas y lectura de piloto documentadas en registro privado..
- Entrada/campos: `caso_id`, `escenario_id`, `campos de cantidad permitidos`, `revision_esperada`, `request_id`, `actor autenticado`.
- Salida: revision, versión activa, entradas canónicas, resultados calculados, flujo mensual, geometría y etapas, fuentes y auditoría.

- Datos y fórmulas viven en el libro privado por caso; no mantener motor financiero paralelo
- Las fórmulas están protegidas para propietario; AI actúa con su autorización y registra cambios
- Servidor resuelve el destino y verifica permisos, límites y revisión antes de escribir
- Una respuesta pendiente, conflicto o desconexión conserva el último dato confirmado con estado explícito
- Auditar antes/después y no marcar producción comprobada sin lectura pública final
- No modificar Portero ni crear otra implementación; conservar contratos y URL existentes
