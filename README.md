# Portal de equipo · Yo Desarrollo

Vestíbulo interno que reúne los tableros de equipo de Yodesarrollo / Aurum en un solo lugar.
Se enlaza desde el menú **Accesos** de yodesarrollo.mx.

- En vivo: https://tableros.yodesarrollo.mx/yod-portal/
- Nueva cabina YOD OS (prueba segura): `/os/`. Reutiliza el catálogo de Control Maestro y el Portero YOD sin modificar ni copiar los datos de los tableros.
- El portal **no autentica**: es un directorio. Cada tablero mantiene su propio control de acceso.
- La pestaña `Portal` de **YOD OS · Control Maestro** gobierna orden, visibilidad, textos e iconos.
- URL, estado y sensibilidad se heredan por `system_id` desde la pestaña `Sistemas`.
- El endpoint público de solo lectura expone únicamente la proyección visual allowlisted de `Portal`; los demás recursos conservan autorización obligatoria.
- No existe copia local del catálogo: si Sheets no responde, el Portal falla cerrado y no habilita enlaces.
- Sólo una fila con `estado = Activo` y URL HTTPS de un dominio permitido se convierte en enlace.
- `noindex` (uso interno). Las vistas previas (`thumbs/`) van **difuminadas** a propósito: ningún dato real legible, porque el repo es público.

## Tableros que lista
| Tarjeta | Board |
|---|---|
| Proyectos y tareas | board-aurum |
| Finanzas | board-flujo-yod |
| Interiores | interiores-aurum (llave-maestra.html) |
| Presentación a inversionistas | yodesarrollo-board |
| Métricas de redes | aurum-board |
| Obra en vivo | yod-obra (Próximamente) |

**Fuera del portal:** Co-desarrolladores-Yod (portal financiero de inversionistas) — acceso directo aparte en el menú.

## Cómo agregar / cambiar un tablero
1. Crear o actualizar el registro canónico en `Sistemas`.
2. Agregar su `system_id` en `Portal` y editar orden, visibilidad, descripción, audiencia, icono y miniatura.
3. No duplicar URL, estado o sensibilidad en `Portal`: esas columnas son fórmulas vinculadas a `Sistemas`.
4. Ejecutar `node verify-portal.cjs` antes de publicar.

## Track de Codesarrollos
- La pestaña `Track` gobierna los pines mediante `project_id`.
- El endpoint público expone únicamente la proyección cartográfica y rechaza recursos operativos.
- Track no conserva copia local: si Sheets falla, no habilita pines ni destinos obsoletos.
- Los textos se escapan, el color se valida y cada URL exige estado `Activo` más destino aprobado por `project_id`.
