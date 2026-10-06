# Recuperación de transporte Patrimonial · Sala #47

Propuesta `CHG-PPP-PATRIMONIAL-RECOVERY-047`, revisión `2026-10-05.85-ppp-patrimonial-recovery-propuesta`. Registrada el 5-oct-2026 antes del parche backend coordinado. Estado: **propuesto; restauración pendiente**.

Los snapshots privados de V65 activo/editor coinciden y sus ocho archivos no contienen definiciones `pppPat*`. El coordinador observó `GET sheet-model` Patrimonial con `ok:false,error:servidor` el 5-oct. La publicación V54 del 2-oct a las 05:47 UTC sí contenía el adaptador, pero dejó el editor en V53 sin él; una actualización posterior perdió esa recuperación. La reproducción aislada de la entrada nativa en el lector Vertical y `horizonte_invalido` se está preparando. El cierre de Sala #47 del 3-oct no acredita lectura funcional el 5-oct.

Se recupera solamente el transporte aprobado por `CTR-PPP-PATRIMONIAL-NATIVO`: `pppPat*`, números `null`, rangos `integer`, CAS, revisiones, auditoría y protecciones. Se conservan el endpoint existente, ACL PT/PA, casos/IDs y todos los demás módulos/archivos V65. Sin nuevas fórmulas o negocio. El coordinador conserva la responsabilidad exclusiva del backend; este worktree modifica Atlas, documentación y verificaciones, sin tocar Potenciales ni backend.

El despliegue exige lock y CAS sobre fuente y configuración recién leídas. Si el editor coincide con la versión activa en preflight, el estado final del editor debe coincidir con el candidato publicado. **No volver al editor V53 sin adaptador.** Releer editor y fuente de la versión activa después, con el adaptador presente en ambos. Ante deriva concurrente detener sin pisar trabajo ajeno. Una reversión de emergencia se registra por separado y no se confunde con la prevención requerida.

Faltan regresión Vertical y Patrimonial en Node/native/backend mock, preservación byte a byte de otros archivos y funciones, CAS/revisiones/auditoría/protecciones y GET real posterior comparado con Sheets. Cero POST de pruebas de negocio. La evidencia pública utiliza referencias lógicas y hashes; los IDs privados, endpoints y datos permanecen fuera del repositorio.
