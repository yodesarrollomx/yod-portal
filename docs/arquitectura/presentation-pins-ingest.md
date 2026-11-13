# Chinches de presentaciones → circuito de Sala

Contrato autorizado por Dirección; implementación publicada y verificada en los consumidores indicados. Contrato CTR-PRESENTATION-PINS-INGEST.

Reutilizar PRODUCCION de Sala y su contrato ENCARGO/CHN. Captura/comentario/contexto completos permanecen en el JSON privado; el issue público contiene sólo un aviso técnico y su ID. El frontend conserva borradores y entrega inmediata con sesión YOD existente; origen externo utiliza relevo de navegador limitado a esos orígenes, sin transferir credenciales. Confirmar POST ok y lectura por ID/huella; un envío ambiguo sólo se concilia en lectura. Conservar ID al rescatar pendientes y distinguir local, recibido, tomado y cumplido. El revisor existente consulta el sobre privado y atiende destino GitHub o Sites. No nuevo Sheet, backend ni cron.

Antes de habilitar consumidores, desplegar proyección pública mínima por ID y rechazo de sobres sin proyectar en snapshot y bundle final. El cliente exige su contrato servido. Los originales se conservan en la fuente privada y el revisor consulta su historial completo; la ventana del día no representa todas las solicitudes.

## Recibos y pendientes

Publicación y recepción del dispositivo se verifican separadamente. Se publicó la implementación; no se acredita aún recepción de una chinche desde la sesión privada de Dirección. La cadencia y activación del revisor existente se registran en su coordinación privada.

## Pruebas

- Contratos sintéticos: origen/emisor/nonce, payload acotado y captura privada, rol/clave existente sólo en origen YOD; no filtrar secretos en mensajes.
- Entrega y acuse por ID/huella, deduplicación, offline, error auth, respuesta perdida y recarga; sin POST de prueba en producción.
- WebKit/Chromium: captura, dictado, Clavar, historial, pendientes previos, conexión y cancelación; preservar gesto y27/68momentos.
- Atlas/modelo/vistas/impacto y suites existentes; recibos públicos exactos separados de entrega real.

## Reversión

Revertir sólo consumidores/relevo frontend; conservar IndexedDB, IDs, sobres privados y recibos de Sala. No reponer notas a nueva para reenviar un POST ambiguo; no borrar datos ni cambiar permisos, rutinas o backend.

## Publicación comprobada

- [Sala310](https://github.com/yodesarrollomx/sala-edicion/pull/310), código `d8a8171`, [Pages38762162219](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38762162219): contrato público y proyección servidos.
- [Board33](https://github.com/yodesarrollomx/yodesarrollo-board/pull/33), código `7435b2d`, [Pages38765885526](https://github.com/yodesarrollomx/yodesarrollo-board/actions/runs/38765885526): entradas vigente e histórica, integración con el recorrido concurrente preservado. Árbol `54e20aee` igual al probado; [CI38765037795](https://github.com/yodesarrollomx/yodesarrollo-board/actions/runs/38765037795) aprobado.
- Consumidor externo Sites: versión15, despliegue `appgdep_6ad0f98e53388191bd132da80d30b115` succeeded. Ocho activos públicos comparados con fuente aprobada; transportes idénticos en ambos consumidores.
- Pruebas sintéticas Chromium/WebKit con dos orígenesHTTPS: captura real, sesión confinada, ausencia/recuperación de sesión, respuesta perdida y recarga. ConflictoID bloquea reenvío; eventos de seguimiento no ocultan el sobre recibido. No se hicieron POST de prueba a producción.

Pendiente operativo: primer acuse de un dispositivo privado, revisión del pedido y adopción/ACK del resto de procesos. Mantener los originales y estados parciales; publicar código no cierra una chinche.
## Relevo sin navegación · 17 octubre 2026

Corrección dentro de CTR-PRESENTATION-PINS-INGEST y CHG-PRESENTATION-PINS-INGEST-20261015, sin alterar sus conexiones, fuentes, sesión ni contrato. El relevo existente admite un marco embebido además de la ventana explícita. Se mantienen origen, emisor y nonce; ninguna credencial cruza al consumidor. Si falta sesión o el navegador aísla el almacenamiento, la conexión explícita sigue siendo necesaria.

El consumidor conserva el original local, muestra un aviso no bloqueante y reintenta al volver o recuperar señal. Sólo el acuse por ID/huella permite «Recibida en Sala». Una respuesta ambigua no autoriza repetir POST. El transporte no cambia la cadencia del revisor ni acredita corrección editorial. Capturas y comentarios permanecen privados.

Pruebas sintéticas Chromium y WebKit: captura real; sin sesión queda pendiente sin abrir ventana; conexión explícita recupera acuse; recarga no duplica. Ningún POST de prueba a producción. La sesión privada del dispositivo sigue siendo una comprobación distinta. Rollback: revertir consumidor y relevo, conservando IndexedDB, IDs y recibos.
