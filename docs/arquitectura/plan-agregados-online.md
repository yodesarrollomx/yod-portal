# Lectura automática de agregados de Plan

Cambio CHG-PLAN-AGREGADOS-ONLINE-20261011 y contrato CTR-PLAN-AGREGADOS-ONLINE publicados el11-oct-2026. Fuente canónica leída por la cuenta de servicio existente con permiso lector. El proyecto no tiene Sheets API activa; la ruta confirmada usa Google Charts autenticado, con Bearer en cabecera y sólo columnas permitidas. Las personas y folios permanecen privados.

Sala produce agregados históricos, excluye PRUEBA y rechaza duplicados contradictorios. Sesión registrada requiere estado y fecha; no acredita Calendar. Marketing comprueba recibos antes/después, hash, frescura y contrato y conserva el último dato si hay error. Actualización declarada de fuente cada hora al minuto25 y consumidor al00; revisión diaria incluye la octava rutina.

Pruebas: suite Sala144 y consumidor Marketing17, además de las regresiones existentes, pasan. Producción: [lector/publicador Plan](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38156397507), [Pages](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38156497145) y [consumidor real](https://github.com/yodesarrollomx/aurum-board/actions/runs/38157069665) success. El lector HTTP de Marketing confirma76 publicaciones y snapshot409795880; medición caída=false.

Fuentes/editor IDs y disparadores de Apps Script original, correo, confirmación Calendar y medios históricos restantes siguen pendientes. No se desplegaron espejos ni se modificaron registros de captación.

Reversión: revertir la infraestructura/consumidor y conservar snapshots y hojas. Retirar sólo el nuevo permiso lector específico si corresponde.
