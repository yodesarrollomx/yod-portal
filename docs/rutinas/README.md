# Rutinas del reloj MOAC (prompts versionados)

Las dos rutinas existen ya en la lista de Rutinas de claude.ai (creadas el 5-sep-2026, **apagadas**):

| Rutina | id | cron (UTC) | Hermosillo |
|---|---|---|---|
| Cierre YodBot · 18:00 (lun-vie) | `trig_011bAe7ZVsK6rdpcBuNq7ize` | `0 1 * * 2-6` | lun–vie 18:00 |
| Lunes MOAC · 07:00 agenda | `trig_015zRMtskh7WSrq7rbvcDS6j` | `0 14 * * 1` | lunes 07:00 |

**Por qué están apagadas:** creadas desde una sesión de Claude Code no pueden llevar conectores
(la organización no permite el parámetro), así que la sesión que disparan no tendría Google Drive ni
Gmail y fallaría. Para encenderlas hace falta que Alejandro, en claude.ai → Rutinas, las abra y les
agregue **Google Drive** y **Gmail** (o las cree de nuevo desde ahí pegando el prompt de estos archivos).
Evidencia de que quedó: el primer correo «YodBot · Cierre <fecha>» en la bandeja.

Los prompts, palabra por palabra, están en `cierre-18h.md` y `lunes-moac.md`. Si se cambia uno,
se cambia aquí primero y luego en la rutina.
