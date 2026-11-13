# Chinches · reloj del inicio del trazo

CHG-CHINCHES-STROKE-CLOCK-20261031 · revisión `2026-10-31.chinches-clock.1`.

El grabador 1.1.0 construye el primer punto antes de registrar el evento de trazo. Si las lecturas del reloj cruzan un milisegundo redondeado, el punto queda fechado antes del evento. La validación estricta rechaza la secuencia como «Punto inválido» al terminar o restaurar, aunque el respaldo local previo pueda haberse conservado.

La implementación local crea primero el evento y usa su tiempo para el primer punto. Los puntos siguientes conservan su lectura de reloj, los medios y el protocolo permanecen iguales y el validador sigue rechazando cronologías inválidas. No se reparan, eliminan ni reescriben borradores previos. La reproducción determinista en el módulo real acredita el mecanismo; un timeout de navegador por sí solo no identifica la causa exacta de una corrida fallida.

El cambio se prepara como release patch 1.1.1 mediante `versionar`, `activar` e `instalar` del paquete canónico. Los snapshots 1.0.0 y 1.1.0 permanecen inmutables. El bundle central se actualiza por la huella conocida; los consumidores con copia se actualizan mediante su instalador y pruebas propias. Los importadores compartidos reciben el cambio al recargar cuando la fuente central se publique. Una grabación abierta conserva su módulo cargado.

La validación usa un reloj sintético con cruce de redondeo, mismo intervalo y salto de reloj, además del recorrido de navegador del consumidor. Las pruebas distinguen guardado local, publicación, recepción y reproducción; no prueban un envío productivo ni el micrófono físico. El contador de protocolo, campos de escena, entrega, permisos y rutinas no cambian.

Reversión: seleccionar el snapshot anterior y revertir código/caché por PR, conservando todos los medios, borradores, recibos e IDs. La activación local y los objetivos de versión del registro no acreditan que todos los consumidores se hayan publicado.

Validación local desde `79a0aa5d358eec218ee41e060246c29e9187af5c`: 1136 pruebas aprobadas, incluidas tres regresiones del reloj. Los verificadores OS, Portal, Obra y Accesos pasan; este último usa Potenciales `15fc2c5a6ce2ed6fde6e9bfde7c24526aca00c59`. Paquete, reporte, etiquetas de caché y vistas de arquitectura están sincronizados. La publicación y las pruebas del consumidor se verifican por separado.
