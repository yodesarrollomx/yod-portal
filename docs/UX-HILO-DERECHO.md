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
