# Puesto de decisión YOD · bitácora de UX

2026-10-13 04:42 UTC · Propuesta previa a código. Dummy local, sin cambios de motor ni aplicación real.

La entrada actual separa objetivo, siguiente, PPP, versiones y seis listas. La nueva jerarquía: próximo movimiento con acción dominante, ruta de cuatro resultados y seis tarjetas con cantidades útiles. Conversación completa a derecha, contexto a izquierda.

Avance cuenta resultados de ejemplo con recibos explícitos, nunca tiempo/clics/cumplimiento normativo. Normativa distingue reunidas de fuentes oficiales comprobadas; mercado separa venta/renta/construcción con unidad y no las promedia. TIR por periodo/tipo/versión; V2 sigue defendida al consultarV3. Notas, historial, método, fórmulas, presentación y conexiones siguen accesibles.

## Rúbrica previa

Tres agentes separados: producto2026 y escenarios especulativos2028/2030. Son revisiones simuladas, no auditores humanos ni certificación internacional ni pruebas con usuarios reales. Pueden rechazar.

| Dimensión | Peso | Exigencia |
|---|---:|---|
| Comprensión |25%|Próximo resultado, bloqueo y acción|
| Control y flujo |25%|Dato→evidencia→conversación→resultado sin perder estado|
| Identidad y lectura |20%|Jerarquía YOD, números y densidad cómodos|
| Métricas y confianza |20%|Denominador, alcance, unidad, fecha y fuente|
| Acceso y responsive |10%|Teclado, foco, contraste, targets44px, móvil sin overflow|

Umbral: **cada** revisor≥9.5/10 sin gate abierto. Gate: estado/métrica engañosa, capacidad perdida, chat desplazado, caso/ref mezclado, CTA inoperante, errores/desbordamiento. No heredar notas ni cambiar rúbrica para aprobar; tras dos rechazos reales cambiar estrategia.

## Evidencia pendiente

Commit exacto, capturas de Chromium y regresiones, juicios por dimensión. Prueba local no acredita voz física, Sheets, servidor o autonomía24/7.

## Antes → después comprobado

| Parte | Antes | Después | Motivo |
|---|---|---|---|
| Entrada | Objetivo, siguiente y versiones dispersos; recorrido de escenas permanente | Mando horizontal: próximo resultado, evidencia, acción y avance | Orienta la siguiente decisión antes de abrir menús |
| Tablero | Listas y bloques de texto; cifras y alcance cortados | Seis resúmenes completos, precios/unidades, cobertura y TIR con escala | Permite leer el conjunto y comparar sin confundir unidades |
| Mecánica | Navegación como formulario | Ruta de cuatro resultados; prioridad escrita/color, recibos y siguiente movimiento | Hace el trabajo más ameno sin puntos, niveles, clics premiados o trabajo fingido |
| Detalle | Tarjetas compactas con altura heredada y mucho texto equivalente | Pestañas44px, dato/pasaje arriba, interpretación y procedencia desplegables | El inspector sirve para decidir mientras se conserva el chat |
| Conversación | Riesgo de etiqueta cancelada repetida | Un nodo de estado por turno, parcial/final/cancelado | Voz y texto mantienen el mismo hilo |
| Chromebook | Segunda fila fuera de vista | Tarjetas enteras dentro del área visible, no sólo del viewport | El equipo objetivo puede mostrar los seis KPIs simultáneamente |
| Utilidades | Escenas en la barra primaria y pies duplicados | Trabajo, notas, historial, presentación, fórmulas, método, conexiones y recorrido opcional en el mismo menú | Reduce controles visibles conservando capacidades |

El terreno distingue borrador y fuente. Documentos cuenta referencias del expediente. Normativa muestra materias con documento oficial comprobado, separado de referencias ficticias. Mercado reúne registros heterogéneos con unidad; no crea promedios engañosos. Escenarios muestra TIR anual del proyecto, escala0–25%, tres versiones y condición de V3. La viabilidad sigue la versión consultada, manteniendo V2 defendida.

## Bitácora UTC y rechazos

| Fecha/hora UTC | Commit/candidato | Resultado y razón |
|---|---|---|
|2026-10-13 04:46:41|fb2a2b9c16876feaa59f652d7cd829fccc66f2b4|Propuesta/rúbrica registradas antes de programar. Rama aislada, PRs abiertos sin solapamiento del prototipo.|
|2026-10-13 04:47:16|b8c22a80d167498e5bd2d3686a2b6958c0460dae|Vistas generadas reubicadas en atlas antes del PR; raíz del portal conservada.|
|2026-10-13 04:53:01|C1 ·9ea83bcbcd33be87145e331fa0d9f4e545b52325|Rechazado: tarjetas compactas heredaban194px, precios/periodo recortados y ausencia de dato confundida con discrepancia. Run38348621436 falla además por selector de prueba ambiguo.|
|2026-10-13 04:56:34|C2 ·bf223ee12e85dbd04cb0e395ea69f0ab1b0e72a0|Inspector44px y estados corregidos; rechazo visual de Chromebook. Evaluación provisional2026=9.225. Run38348910121 interrumpido por selector ambiguo de Presentación.|
|2026-10-13 05:02:16|C3 ·7bf064d97018e2856b060a6f6f2b18bb19c5ce9d|Cambio de estrategia tras dos rechazos: mando horizontal y eliminación de pies duplicados. Seis áreas completas en1440×900; run38349390537 rechaza encaje1366×768.|
|2026-10-13 05:05:22|C4 ·42828f6a8e203248b4bb2752f9e89753d5ab52a3|PPP y versiones en una línea para pantallas bajas. Run38349641852 PASS; revisores2026/2028 aprueban, pero2030 detecta borde inferior cortado. Sin consenso; no se publica como aprobado.|
|2026-10-13 05:09:58|C5 ·fde1888a6f293e87148706a1bdeab686eefa3065|Margen/gap ajustados; prueba reforzada contra borde real del scroller. Conserva targets44px, campos, unidades, fuentes y comportamiento.|
|2026-10-13 05:10:59.054614|C5 ·run38350021233/job115140052518|PASS del recorrido completo:28capturas. Las tarjetas inferiores terminan en y=727.70, dentro del visor.|
|2026-10-13 05:12:37|C5 ·revisión2026|Revalidación de diff/log y16capturas nuevas:9.57, sin gates.|
|2026-10-13 05:13:03|C5 ·revisión2030|16capturas del dummy+código y bounds:9.615, sin gates; hipótesis2030, no experto humano.|
|2026-10-13 05:14:52|Cierre documental|Consolidar las tres revisiones C5; cuerpo del prototipo conservado. Publicación y recibo pendientes de este cierre.|

La revisión2028 inspeccionó28capturas nuevas y aprobó C5 con9.605 tras el PASS de05:10:59. No se atribuye una hora exacta adicional a su mensaje. Cada nota corresponde a su candidato; no se heredan aprobaciones de C4.

## Evaluación final independiente

| Dimensión/peso | Producto2026 | Escenario2028 | Escenario2030 |
|---|---:|---:|---:|
|Comprensión25%|9.6|9.7|9.6|
|Control y flujo25%|9.6|9.6|9.7|
|Visual20%|9.5|9.5|9.5|
|Métricas/confianza20%|9.7|9.7|9.8|
|Acceso10%|9.3|9.4|9.3|
|**Ponderado exacto**|**9.57**|**9.605**|**9.615**|

Los tres superan9.5 y no encontraron gates pendientes en el alcance del dummy. Es juicio heurístico interno de tres agentes separados, no certificación de profesionales humanos, prueba con usuarios ni predicción del futuro.

Residuos que justifican descuentos: etiquetas secundarias pequeñas, chips documentales informativos, orientación del detalle móvil en dos filas y avatares por iniciales. Documentos largos requieren desplazamiento interno. Las métricas son de ejemplo y los recibos locales no acreditan negocio o normativa.

## Pruebas y entregables

- [PR222](https://github.com/yodesarrollomx/yod-portal/pull/222): historial, revisión, integración y publicación por separado.
- [Chromium C5](https://github.com/yodesarrollomx/yod-portal/actions/runs/38350021233/job/115140052518): commit exacto,28capturas, geometría, estado y bloqueo de red de negocio.
- [Arquitectura,692regresiones y obra](https://github.com/yodesarrollomx/yod-portal/actions/runs/38350021238):692pass/0fail, esquema/vistas/impacto y verify-obra-app.
- [OS,portal y accesos](https://github.com/yodesarrollomx/yod-portal/actions/runs/38350021440): comprobaciones correctas. Job Reuniones omitido por no tocar ese módulo.
- Capturas PNG reales de la página renderizada, **no ilustraciones**: artefacto ux-ppp-mockup del runC5. Incluye escritorio1440×900,Chromebook1366×768 y móvil390×844; entrada,seis detalles,evidencia,hilo,voz visual,corrección,siguiente,entrega y presentación.
- [Abrir dummy](https://yodesarrollomx.github.io/yod-portal/os/agent-dummy.html?v=3): Gastón,Luis,Ruiseñor con estado local aislado y capacidades comunes.

Se comprobó el ciclo completo de500→644 con fuente ficticia, preservación del borrador, cambio del siguiente resultado y presentación al lado de conversación. Explorar no suma resultados.4/4recibos locales mantiene0/3materias con fuente oficial comprobada yV3condicionada. El modo voz es visual, sin micrófono físico.

Código,revisión e integración no equivalen a publicación. La publicación real se añade al cuerpo del PR sólo después del recibo Pages; estas capturas se obtuvieron de código exacto servido localmente en Chromium aislado.

No se modifica la aplicación viva del Despacho, datos privados, servidores, permisos, APIs, cliente Apps Script, fórmulas canónicas, objetivos o automatizaciones canceladas. La futura integración operativa requiere comprobar esos transportes con estado real.

Reversión: revertirPR222; conservar todo estado de negocio y las publicaciones/documentos reales.
