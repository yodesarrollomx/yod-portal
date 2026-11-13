# Sala existente: ejecución continua en nube

Autorización de Dirección para la propuesta CHG-SALA-ONLINE-20261011, contrato CTR-SALA-SNAPSHOT-ONLINE, aprobada por [Portal PR161](https://github.com/yodesarrollomx/yod-portal/pull/161).

Estado: código integrado y publicación comprobada el 11-oct-2026. [Sala PR265](https://github.com/yodesarrollomx/sala-edicion/pull/265), [Marketing PR76](https://github.com/yodesarrollomx/aurum-board/pull/76) y [PR77](https://github.com/yodesarrollomx/aurum-board/pull/77) conservaron CI obligatorio. Los consumidores fijan la propuesta aprobada; esta actualización añade evidencia posterior a la misma arquitectura.

## Ejecución acreditada

- [Prueba CPU 38139680521](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38139680521): Tiny-SD, profundidad ONNX/parallax, Kokoro y ffmpeg; seis archivos privados en Drive releídos con SHA256. Corte H264/AAC 1080×1920 de 10.166667 s; cero registros de negocio y decisiones editoriales.
- [Revisión 38141812652](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38141812652) y [Pages 38141874311](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38141874311), ambas exitosas: cola y rutinas confirmadas, errores vacíos, snapshot 409673426 y recibo exacto releído desde el sitio. Revisión diaria a las 07:05 Hermosillo y después de publicar código.
- [Métricas 38141736288](https://github.com/yodesarrollomx/aurum-board/actions/runs/38141736288), exitosa: 76 publicaciones reales; snapshot 409673351 publicado en la rama exclusiva de agregados y releído por el cliente con hash exacto. Código continúa en Pages/main y datos se actualizan cada hora.

Los snapshots continúan como releases draft privados. Sólo salidas públicas permitidas llegan al sitio; cambios de código conservan PR/CI. La serialización utiliza lease CAS y el montaje exige una versión exacta publicada. Las decisiones editoriales siguen siendo humanas.

## Límites vigentes

La escena CPU es parallax y no acredita animación LTX. Permanecen pendientes el inventario del Apps Script original y sus disparadores/correo, la lectura automática rechazada de Plan de Potencial y la conciliación de medios históricos. Se conserva el último dato acreditado y se muestra medición incompleta; un error no se convierte en cero. No se desplegó el espejo GAS como si fuera la fuente viva.

Rollback: revertir PR de infraestructura y restaurar el último snapshot confirmado. No borrar Sheets, colas, decisiones, medios, métricas ni auditoría. El publicador Git anterior necesita su identidad/CI resueltos antes de habilitarlo otra vez.
