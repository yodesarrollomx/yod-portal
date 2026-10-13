# Corrección dirigida · conversación y microinteracciones

Registro UTC 2026-10-13 04:17:50 UTC. Alcance: exclusivamente dummy/mockup de interacción.

## Petición vigente

Conversación siempre a derecha y de arriba abajo; voz/transcripción y texto son el mismo hilo; mini tarjetas útiles; detalles específicos y contenidos. Las notas9.1/9.2anteriores describían recorridos de una propuesta previa y no acreditan satisfacción del usuario. No se heredan, se elevan ni se usan como criterio de cierre de esta corrección.

## Antes y después

| Antes | Cambio | Motivo |
|---|---|---|
| Chat a izquierda, comparte altura con lector | Columna propia a derecha desde el inicio del puesto hasta el compositor | Leer fuentes no corta ni desplaza la conversación. |
| Fuente aparece como superficie abierta en el chat | Panel de detalle contenido dentro del proyecto, a izquierda | Se mantiene una jerarquía visible de proyecto, tarjeta y detalle, sin tapar chat. |
| Tarjeta abre texto genérico o repite su contenido | Terreno: discrepancia/respaldo; Documentos:listado;Normativa:aspectos/fuentes;Mercado:unidad/registro;Escenarios:comparación;Viabilidad:condición/decisión | Cada interacción tiene un propósito, evidencia y acción concretos. |
| Voz sólo indica estado, sin contrato de turno | Un registro por turno: parcial→final/cancelado; texto y voz comparten estructura | El final no crea otra transcripción ni una segunda burbuja. |
| Dibujar el historial reemplaza todo el DOM | Actualización por ID de mensaje | Preserva lectura, foco y citas mientras llega texto. |
| Abrir detalle pierde el contexto de conversación | Comentar coloca referencia y foco en el compositor; detalle permanece | El dato y la conversación pueden verse al mismo tiempo. |

## Lógica de cada detalle

Cada vista contiene dato principal/estado, evidencia, interpretación y acción. La discrepancia500/644tiene dos campos y el documento de respaldo; la corrección conserva su acuse local. Normativa muestra los aspectos por comprobar con artículos; Mercado conserva unidad, fecha y estudio. Escenarios separa consultada y defendida; Viabilidad explica la condición, el riesgo y la próxima decisión. No se cambian fórmulas, valores canónicos ni fuentes reales.

Al abrir un detalle, las seis tarjetas se compactan en sus mismos encabezados; no hay otra barra global. Volver restaura las tarjetas y su foco. La conversación no se desmonta ni se duplica.

## Texto y voz

La demostración del micrófono actualiza una sola burbuja mientras se completa la transcripción y una sola burbuja de respuesta. Eventos repetidos, tardíos o de otro caso no crean otro turno. Interrumpir cancela ese turno y descarta deltas posteriores. El borrador escrito no se borra.

El código maneja únicamente mensajes de ejemplo en memoria. No captura micrófono, reproduce audio ni conecta el protocolo privado de voz. Ese adaptador real sigue fuera de esta corrección de la maqueta; no se afirma que la demostración haya arreglado la conexión de voz productiva.

## Pantallas estrechas

En escritorio los dos espacios están visibles simultáneamente. En móvil se conserva el mismo proyecto a izquierda y el mismo hilo a derecha dentro de dos paneles laterales; el selector/swipe permite pasar entre ellos sin duplicar contenido ni desmontar el hilo. No se fuerzan columnas de texto ilegibles dentro de390px. Los elementos del panel fuera de vista quedan inert para la navegación por teclado.

## Evidencia de cierre

Se comprobarán posición/altura del chat antes y después de cada detalle, límites de la superficie izquierda, una sola conversación, un mensaje por turno, parcial/final/interrupción, borrador/referencia/caso/foco, móvil y navegación. No se concede una nota numérica de UX a partir de esos checks.

Las capturas y recibos corresponden a datos ficticios y al commit exacto del prototipo. El cierre registra publicación Pages aparte de las pruebas. No se llama a negocio, reinicia Render, instala APIs, altera permisos, cambia hojas o reactiva automatizaciones canceladas.

Reversión: revertir PR de esta maqueta y sus pruebas; las fuentes y la operación privada permanecen intactas.

## Primer recorrido

Candidato647f465: Arquitectura38345777587yYODOS38345777862success. Navegador38345777623/job115126734239 confirma posición/altura del chat, seis detalles contenidos, transcripción única, interrupción, aislamiento y móvil del mockup. El recorrido del dummy se detuvo al buscar644en una tarjeta compactada, que sólo mostraba su encabezado. Se comprueba ahora el valor visible en el detalle y, al volver, en la tarjeta expandida; no se elimina ninguna comprobación de integridad.

Capturas también detectaron menú de proyecto en tercera fila, título de detalle alineado al borde y un control global extra de escritorio. Se corrigen orden, alineación y visibilidad sin agregar controles ni capacidades.

## Cierre de las tres correcciones

Registro UTC **2026-10-13 04:26:53 UTC**. [PR220](https://github.com/yodesarrollomx/yod-portal/pull/220).
Código visual probado: **d8fa33e533b546090a74ba2de6bfec5950b182e7**.
[Recorrido Chromium](https://github.com/yodesarrollomx/yod-portal/actions/runs/38346113048/job/115127809947): **AGENT_THREAD_RESULT:PASS** a las2026-10-13T04:23:02.885Z, con26capturas de ambos prototipos.
[Capturas originales](https://github.com/yodesarrollomx/yod-portal/actions/runs/38346113048/artifacts/11788728319).
[Arquitectura](https://github.com/yodesarrollomx/yod-portal/actions/runs/38346113025) y [YODOS](https://github.com/yodesarrollomx/yod-portal/actions/runs/38346113249) success.

- Conversación a derecha, desde el inicio del puesto hasta el compositor. Geometría de x/y/ancho/alto comprobada antes y después de las seis interacciones.
- Un hilo y un registro por turno. La demostración parcial/final no duplica al usuario ni la respuesta; interrupción descarta finales tardíos.
- Detalles a izquierda contenidos dentro del proyecto. Tarjetas colapsan en sus mismos encabezados y el chat queda intacto. Evidencia, interpretación y acción distinguibles.

También se comprueban borrador/referencia, expediente, foco, corrección ficticia, presentación junto al chat, navegación móvil y ausencia de llamadas externas. No se asigna otra calificación numérica; la mejora de estética debe juzgarse en las capturas y la página, no deducirse de un PASS.

[Dummy actualizado](https://yodesarrollomx.github.io/yod-portal/os/agent-dummy.html?v=2). [Mockup base](https://yodesarrollomx.github.io/yod-portal/os/agent-preview.html?v=right2).
La guía de la maqueta apunta a este documento para evitar presentar el diseño y las notas anteriores como estado vigente. Integración y publicación reales se registran en PR220 tras el recibo Pages. Cambios de cierre posteriores al código revisado son documentación/atlas y esa referencia de guía; sin cambiar comportamiento del hilo.

No se instaló ni reinició un servidor. Voz, normas, precios y documentos siguen siendo demostraciones; ningún recibo local significa cambio en tu libro real.
