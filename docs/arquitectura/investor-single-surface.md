# Presentación móvil · una superficie y chinches

Estado: propuesta autorizada, registrada antes de implementar. `CHG-INVESTOR-SINGLE-SURFACE` · modelo `2026-10-15.investor-single.1`.

La presentación comercial conserva su URL pública y el relato completo. La siguiente versión adopta la interacción del Plan de Potencial de referencia: un solo gesto sobre el lienzo para avanzar/regresar, cabecera «Codesarrollo inmobiliario» y «Hermosillo» secundario, sin menú móvil inferior que se desplaza. Flechas y anotaciones de plumón evolucionan con los 27 momentos; la explicación íntegra permanece disponible en lector y el cierre conserva sus acciones.

## Alcance y fuente

Se inspeccionan en lectura las utilidades públicas de la referencia y se reutiliza únicamente código UX genérico. No se copian datos, imágenes, nombres, identificadores ni resultados del caso privado al repositorio, registros de CI o fixtures. Contenido y configuración editorial permanecen en la hoja vigente de Drive/Sheets; no se crea otro sitio, hoja o documento.

## Chinches

Se adapta la API YODChinche existente y el comportamiento D14 para señalar un punto o un recorte, escribir o dictar cuando el navegador lo permita y guardar captura/comentario en IndexedDB. Los bytes de imagen se conservan como ArrayBuffer para compatibilidad con WebKit. El historial local «En revisión» conserva las notas tras recarga. El origen del navegador aísla sus datos: no se promete sincronización con otro dominio.

Guardar una chinche no acredita que un revisor remoto la haya recibido. Compartir abre el mecanismo nativo sólo después de una acción expresa. Cancelar, carecer de esa función o fallar no borra el borrador ni comunica éxito. No se fabrica ACK, issue, envío, encargo tomado ni cumplimiento. No se cambian credenciales, permisos, Portero ni bases ajenas.

## Aceptación

- Una sola superficie táctil para avanzar la historia, con respuesta gradual, freno, límites y reversa inmediata. Sin menú inferior móvil ni scroll independiente.
- Cabecera y marca coherentes; flechas/notas legibles sin colisión en tamaños iPhone pequeños y horizontal. Texto íntegro en lector; 27 momentos y CTA final visibles.
- Teclado y movimiento reducido conservan acceso al contenido y a las acciones.
- Captura puntual/recorte y comentario persisten juntos tras recarga en WebKit y Chromium. Fallos de captura, cuota o cancelación conservan historial y muestran un estado veraz.
- Compartir y dictado se prueban con dobles, sin comunicaciones, POST de negocio ni cambios a credenciales. Datos exclusivamente sintéticos.
- Después de publicar el consumidor se comprueban archivos públicos exactos, fuente editorial viva y recorrido anónimo. Las pruebas emuladas se distinguen de un iPhone físico.

## Contratos y reversión

Componentes: SYS-INVERSION, SYS-YOD-OS, SYS-CONTROL, GAS-PLAN-POTENCIAL y SHEET-PLAN-POTENCIAL. Contrato: CTR-INVESTOR-SINGLE-SURFACE.

Revertir sólo el PR de frontend a la versión previa en la misma URL. Conservar contenido de Sheets, originales, versiones, historial local, accesos y expedientes. Este registro no acredita implementación o publicación; los recibos corresponden al PR consumidor.
