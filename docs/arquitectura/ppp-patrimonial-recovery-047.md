# Recuperación Patrimonial · Sala #47

Propuesta `CHG-PPP-PATRIMONIAL-RECOVERY-047`, revisión `2026-10-05.86-ppp-patrimonial-recovery-alcance`. Registro previo al parche: `1f5a58bc2084f63cb9d2c8f88542883bd9285a9f`. Estado: **propuesto; publicación y aceptación pendientes**. Dirección autorizó resolver Sala #47 y analizar consistencias; el coordinador implementa frontend/backend por separado. Este worktree entrega sólo Atlas y verificaciones. El PR queda sin merge ni auto-merge hasta nuevo aviso del propietario.

Según el relevo privado del coordinador confirmado por Dirección el 5-oct, V65 activo/editor coinciden y sus ocho archivos no contienen definiciones `pppPat*`; `GET sheet-model` Patrimonial devuelve `ok:false,error:servidor`. V54 del 2-oct a las 05:47 UTC contenía el adaptador, pero el editor volvió a V53 sin él y una publicación posterior lo perdió. El mock reproduce `horizonte_invalido` al pasar la entrada nativa por el lector Vertical. Helpers candidatos iguales a V54 y mock de CAS, null/cero, Vertical e idempotencia aprobados según el relevo; este Atlas no repite esas pruebas privadas ni acredita restauración real. El cierre de Sala #47 del 3-oct y el cotejo V53 histórico no acreditan funcionamiento el 5-oct.

Se recupera el transporte aprobado por `CTR-PPP-PATRIMONIAL-NATIVO`: `pppPat*`, números `null` y cero distintos, rangos `integer`, CAS, revisiones, auditoría, idempotencia y protecciones. Se conservan funciones ajenas y los otros siete archivos V65 byte a byte, incluido manifest, además de URLs, scopes, configuración, ACL PT/PA, casos/IDs y fórmulas existentes.

El alcance frontend del coordinador incluye tres correcciones:

1. Caché por caso: editar A, abrir B y retornar A conserva el borrador y los últimos datos confirmados de A sin cruzarlos con B.
2. ACK perdido tras reload: recuperar el job exacto sólo después de un GET fresco autorizado; conservar `request_id`, payload y revisión originales. El backend devuelve un recibo existente en su caché de seis horas antes de comprobar CAS, sin repetir escritura. Si el recibo fue evictado y la revisión quedó obsoleta, responder conflicto sin overwrite. No sustituir el job ni elevar su revisión esperada para forzar el reintento.
3. Metadatos del borrador durables antes de paint: recarga y repintado conservan vínculo con caso/job y estado no confirmado. Un resultado pendiente sólo pasa a confirmado con su recibo.

El despliegue exige lock y CAS sobre fuente/configuración recién leídas. Si editor y activo coinciden en preflight, el editor final debe coincidir con el candidato publicado. **No volver al editor V53 sin adaptador.** Releer editor y fuente activa después, con el adaptador presente en ambos. Ante deriva concurrente detener sin pisar trabajo ajeno. Una reversión de emergencia se registra por separado.

Aceptación del consumer: regresiones sintéticas Vertical/Patrimonial y de las tres correcciones frontend; preservación de archivos, funciones y configuración; auditoría, fórmulas y rangos protegidos; preflight/postflight; GET real posterior comparado con lectura directa autorizada de Sheets por el coordinador. Cero POST de pruebas de negocio. El consumer fija el SHA completo de este Atlas y el contrato existente; sus checks, publicación frontend y despliegue backend se registran aparte. Entregar Atlas no cierra Sala #47.

Concurrencia comprobada al retomar: `origin/main` en `466db10a968bfb5bd6996661085a97f20c644892`; draft #100 fuera de alcance. No incorporarlo ni depender de él. Verificación coordinada de accesos fijada a Potenciales `5b84278f4dfb6384f357538e2219ca63e4aa5c0d`; revalidar referencias antes de integrar/publicar.

Reversión documental: revertir este PR y regenerar vistas conservando cambios concurrentes. Reversión funcional a cargo del coordinador: snapshot revisado de la misma implementación y frontend compatible, conservando jobs, borradores, recibos, historial, CAS y datos/fórmulas/libros; no restaurar editor antiguo por rutina ni reemitir jobs para resolver un conflicto. Registrar cualquier degradación Patrimonial de una reversión de emergencia.

La evidencia pública utiliza referencias lógicas y commits. Fuentes Apps Script, snapshots, celdas, identificadores privados, endpoints, credenciales y datos permanecen fuera del repositorio.
