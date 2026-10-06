# Conocimiento y versiones del expediente

CHG-DESPACHO-CONOCIMIENTO-078 / CTR-DESPACHO-CONOCIMIENTO. Portal publicado mediante [PR100](https://github.com/yodesarrollomx/yod-portal/pull/100), merge `c45e0f7d8a280b482c865ce80b8c9244e8b7a5e7`. La publicación, las pruebas técnicas y la aceptación operativa se registran por separado.

El puesto añade Conocimiento junto a navegador, PPP, pendientes y fuentes. Muestra hechos con procedencia, versiones/variantes, decisiones y próximos pasos del caso autorizado. No carga al iniciar voz ni consulta periódicamente: abre, actualiza por petición y relee después de un recibo. Un fallo de conocimiento no cierra la conversación.

Guardar lectura del PPP envía sólo título, tipo, origen, revisión esperada e ID de solicitud. El servidor debe capturar un tablero confirmado sin cambios pendientes; el panel nunca transmite cifras ni fórmulas. Una versión guardada es una captura, no aprobación del proyecto. Modalidad PPP y versión/variante son conceptos distintos. Un guardado incierto conserva su solicitud en memoria mientras permanece la misma sesión; comprobarlo reusa el ID y contenido. Cambio de caso o revocación limpia la vista. El consumidor no promete recuperar una intención local tras recargar todo el navegador; los recibos y versiones confirmados pertenecen al servidor.

La comparación usa dos versiones registradas: muestra valores, unidades, diferencias y faltantes, sin calcular un ganador ni evaluar viabilidad. Sheets conserva el cálculo canónico; una captura es evidencia de una revisión pasada.

La exportación tiene dos salidas: Markdown y bóveda ZIP portable, con archivos Markdown y sus enlaces. ZIP STORE se genera localmente sin librerías o red adicional; valida rutas relativas únicas y un total de dos MB UTF-8. Descargar una bóveda no instala Obsidian ni conecta un vault. Jev, exportación portable y sincronización Obsidian tienen estados independientes confirmados por el servidor.

Las pruebas sintéticas cubren contrato, recibo perdido, conflicto, revocación, cambio de caso, comparación, nombres/rutas, integridad ZIP y estados de subtareas interrumpidas. El recorrido Chromium comprueba 1280×900 y 390×844, descarga/error y continuidad de una pista MediaStream sintética al cambiar panel; no acredita micrófono físico ni conversación de Dirección. No contiene datos de negocio.

Reversión por PR conserva voz, navegador, PPP, expedientes, versiones, hechos, fuentes, decisiones y recibos. No borrar registros ni vaults.

## Publicación y evidencia · 5 de octubre, Hermosillo

- [Pages del merge](https://github.com/yodesarrollomx/yod-portal/actions/runs/37399848446) y [Verificar YOD OS](https://github.com/yodesarrollomx/yod-portal/actions/runs/37399848701) completados correctamente.
- Head `207d14e9e1c56697116e757bfa275fef65a47932`: [393 pruebas y atlas](https://github.com/yodesarrollomx/yod-portal/actions/runs/37398901161), [verificadores OS](https://github.com/yodesarrollomx/yod-portal/actions/runs/37398901195) y [Chromium sintético escritorio/móvil](https://github.com/yodesarrollomx/yod-portal/actions/runs/37398901159) aprobados. Incluye recibo perdido, revocación, recuperación de fuentes al reabrir, descarga, comparación y pista de audio sintética conservada; artifact11384077589 contiene dos capturas.
- Backend [PR26](https://github.com/alexpueblag/yod-agent-cloud/pull/26) y [PR27](https://github.com/alexpueblag/yod-agent-cloud/pull/27), commit `c9cf174049037ab99e5a086d35c9cb0900969f65`, integrado y publicado según recibo del coordinador. Diagnóstico con proveedor OpenAI real: herramientas, salida de audio y cierre confirmados a **2026-10-06 01:34:59 UTC**. Es evidencia técnica; no acredita micrófono físico, conversación de Dirección ni operación de negocio.
- [Cotejo HTTP final aprobado](https://github.com/alexpueblag/yod-agent-cloud/actions/runs/37400343823) a **2026-10-06 01:44:25.949 UTC**, contra backend publicado `c9cf174`: **13/13 recursos idénticos** a portal `c45e0f7` y PPP `58eb8e`; **8/8 comprobaciones de acceso en cuatro rutas** rechazaron solicitudes sin autorización: origen permitido con 401 y origen inválido con 403. Health informó `ready`, metas listas y voz, navegador y conocimiento disponibles; este recibo no incluye `voice_check`. [Artifact 11385465105](https://github.com/alexpueblag/yod-agent-cloud/actions/runs/37400343823/artifacts/11385465105), SHA-256 `cb3e887df286b4709b90db85703c617894542139568e38d564ac4be1b14ac35e`.

Readiness tardó varios minutos tras desplegar y se recuperó sin reinicio; la causa de la demora no fue aislada. Este corte técnico no equivale a aceptación funcional privada ni garantiza continuidad. El diagnóstico OpenAI anterior conserva su evidencia independiente.

La bóveda exportada es portable; esta publicación no instala Obsidian ni acredita Sync o migración total de documentos. Escrituras operativas y aceptación final conservan su comprobación separada.
