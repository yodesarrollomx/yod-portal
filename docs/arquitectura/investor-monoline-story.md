# Presentación pública monoline · dirección4r4

Estado: plan autorizado y registrado antes de implementar. Este registro no acredita frontend publicado, lectura real ni un proyecto viable. Cambio `CHG-INVESTOR-MONOLINE-STORY`; revisión `2026-10-13.investor-monoline-story.1`.

## Alcance y fuentes

Misma URL `https://yodesarrollomx.github.io/yodesarrollo-board/presentacion/` y tarjeta Material del Masterbroker. Marca pública YoDesarrollo; sin identidad de broker, datos de cartera, precios reales o compromisos financieros. Contenido/configuración públicos en TEXTOS POTENCIAL, mediante `mono_version` y `mono_config`; mismo contrato GET `recurso=textos` y cliente `presentacion/source.js`. Las fuentes cartográficas existentes conservan atribución; territorio verificable y croquis local ilustrativo se distinguen. No se publican identificadores físicos de libros ni direcciones Apps Script.

Fuente editorial: cinco láminas originales de contenido más portada; las variantes internas no son originales adicionales. Se conservan ocho familias: negocio, operación, modelo, inversionista, riesgos, legal, mercado y finanzas. El original de riesgos sólo pide explicar qué puede salir mal y cómo reducirlo; costo mayor, precio menor y ventas más lentas son ampliaciones identificables, no una lista original atribuida.

## Jerarquía del relato

Titular inmediato: «Entiende el proyecto antes de decidir invertir». YoDesarrollo evalúa, proyecta y coordina desarrollo y venta; derechos, aportaciones y responsabilidades se acuerdan.

| Grupo visible | Escenas | Cobertura |
|---|---|---|
| Qué hacemos | 1 oportunidad;2 mercado y búsqueda | Inmueble con potencial, desarrollo de departamentos, venta y rentabilidad buscada. Mercado antes de producto: comparables, demanda, tamaños, precio/m², competencia y comprador. |
| Cómo decidimos | 3 comparación integral | Modelo8: precio/valor inmueble, m², departamentos posibles, costo de obra, inversión, precio de venta, ingresos y utilidad. Finanzas7: inversión, ingresos, utilidad, margen,ROI,tiempo,equilibrio; además flujo y escenario adverso. |
| Cómo participas | 4 revisar/acordar/formalizar;5 proyecto/permisos/obra;6 vender/cobrar/recuperar;7 conversación | Capital, plazo, recuperación y rendimiento estimado; responsabilidades, distribución/salida antes de formalizar. Revisión legal/documental y uso/factibilidad antes de adquirir/aportar. Proyecto, permisos y servicios antes de obra; regularización y condiciones documentales antes de escrituración; cobros efectivos antes de recuperación. |

Todos los detalles quedan bajo cada momento mediante scroll normal, sin menús, acordeones ni tablas diminutas. Tres grupos enlazan anclas; navegación no obliga a animación. Reordenación explícita del original: revisión documental/factibilidad se adelanta a la adquisición. La estrategia comercial empieza con mercado, no después de terminar obra.

## Dibujo y continuidad

`presentacion/monoline-core.js` contiene geometría conceptual sintética sin editorial; `monoline.js` controla escena y texto desde Sheets; `monoline.css` e `index.html` montan la versión. Un único SVG/path maestro acumulativo, un inicio y ninguna orden M adicional/subpath; sin morph global, borrado o sustitución de dibujos. Los contornos retornan al mismo vértice y las derivaciones retrazan exactamente segmentos existentes. Puentes exteriores conectan anclajes sin cruzar/fusionar predios; las avenidas no se transforman en edificios.

Anclajes: P0 intersección; SA/SB accesos; CA/CB cuentas; UA/UB condiciones; TA/TB secciones externas;F marco de conversación. A=Posible compra y B=Posible aportación mantienen identidad y contornos. Son ilustrativos: no unidades fijas, ofertas, legalidad aprobada o un ganador sin datos. Cotas sólo físicas; ROI/demanda/reparto no se representan con longitudes.

Scroll, reproducción y navegación usan un mismo progreso determinista y reversible. En movimiento reducido, el mismo SVG/path completo queda estático en un lienzo vertical, conservando textos/orden. Un color de trazo y texto, legible, validado desde configuración editorial; sin usar opacidades para dar significados financieros.

## Límites financieros y cierre

Valor del inmueble aportado cuenta una vez como inversión económica; aporte no equivale a gratis. Intereses/comisiones son costos; devolución del principal y aportaciones son flujos, no nuevos costos. Contingencia es previsión, no gasto consumado. No duplicar costos ya descontados de ingresos. Utilidad del proyecto no acredita rendimiento/reparto individual. Venta prevista no equivale a cobro real. Formalizar y distribuir se plantean según condiciones pactadas, sin prioridad automática.

CTA prepara conversación para evaluar inmueble o conocer participación con capital. No envía mensajes, solicita depósitos ni formaliza aceptación. Oportunidad, alcance de evaluación, entregables, posibles costos y siguiente paso se acuerdan; no promete estudio técnico gratis.

## Conservación, pruebas y reversión

Apertura y siete capítulos anteriores siguen dentro de Versión anterior de la misma página, activados por botón, sin otro deck. Conserva `hunt_*` e `inv1_*`–`inv7_*`. No modifica backend, permisos, Portero, acceso Masterbroker, expedientes o registros.

Atlas: generador/check, tests y verificadores canónicos. Consumidor: fixtures y pruebas de contratos; una orden M, retrazados, puentes, A/B, 21 momentos/siete escenas. Chromium320/390/1440 comprueba scroll nativo, reversa, umbrales, replay/pausa/nav, punta, lectura/overflow y CTA. Movimiento reducido conserva mismo dibujo y detalle. Producción se verifica tras integración con código servido exacto y copy vivo, sólo lecturas públicas. Una auditoría del guion no sustituye esos recibos.

Revertir PR frontend por PR conserva textos y anteriores; no restaurar negocio. Versiones editoriales permanecen en Sheets. El atlas registra autorización separada de integración y publicación.
