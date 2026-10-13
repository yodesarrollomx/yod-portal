# Presentación principal · boceto de nueve escenas

Estado: propuesta aprobada y registro previo a implementación. Cambio `CHG-INVESTOR-PRINCIPAL-STORY`; revisión `2026-10-13.investor-principal-story.1`. Este documento no acredita frontend publicado, zonas validadas, viabilidad, conversión ni un acuerdo de inversión.

## Qué cambia y qué se conserva

La nueva entrada se diseña desde el boceto de nueve cuadros de Dirección. La versión monoline4r4 pasa a borrador beta dentro de la misma página, con su diagrama, copy y controles conservados. También se conservan los antecedentes inv1–inv7/hunt y las láminas originales. No se crea otra presentación, otro sitio ni archivos de Drive adicionales. La URL pública y la tarjeta Material del Masterbroker permanecen.

La marca pública es YoDesarrollo. La historia se dirige al posible codesarrollador; no publica identidad de broker, alianza interna, correo, cartera o acuerdos privados. La apertura no otorga acceso al tablero privado.

## Orden y semántica del nuevo recorrido

A/B/C son **tres zonas de Hermosillo**, según aclaración explícita de Dirección. Primero se comparan zonas; después se buscan y comparan propiedades dentro de ellas. Las letras no significan compra/aportación ni identifican tres propiedades. La beta histórica conserva su A/B original sin trasladar ese significado a la principal.

| Escena | Propósito narrativo | Evidencia y límite |
|---|---|---|
| 1. Territorio | Situar Hermosillo y sus conexiones. | Vías desde cartografía pública externa atribuida; no inventar rutas o zonificación. |
| 2. Tres zonas | Identificar A/B/C como ámbitos de búsqueda. | Selección ilustrativa hasta contar con estudio verificable; no zonas garantizadas. |
| 3. Zona A | Explicar qué buscar y cómo evaluar en A. | Contexto, mercado y fuentes; atributos desconocidos no se convierten en aprobación. |
| 4. Zona B | Evaluar B con la misma base y sus diferencias. | Comparación consistente; sin favorecer una zona con datos ficticios. |
| 5. Zona C | Completar la comparación territorial. | Mismos criterios observables y límites. |
| 6. Inmuebles | Buscar propiedades dentro de las zonas. | Terreno y construcción existente; compra/aportación son modalidades nombradas, no letras de zona. |
| 7. Comparación | Ordenar atributos físicos, mercado y cuenta económica. | Capacidad requiere estudio; precio y costos requieren respaldo; no anunciar ganador sin sustento. |
| 8. Proyecto evaluable | Traducir una oportunidad en propuesta, revisión y desarrollo. | Mercado, modelo, finanzas, documentación, proyecto, permisos y control; ninguna sigla nueva implica proceso operativo. |
| 9. Codesarrollo | Conectar capital, inmueble y coordinación YoDesarrollo con condiciones y cierre. | Codesarrolladores capitalistas y codesarrollador aportador del terreno; derechos y responsabilidades según acuerdo. |

Nueve escenas con cuatro momentos cada una: 36 momentos narrativos. El guion editorial desarrolla cada cuadro, conserva las ocho familias originales (negocio, operación, modelo, inversionista, riesgos, legal, mercado y finanzas) y separa lo añadido del texto fuente. Las auditorías del guion y del render no equivalen a evidencia de conversión o rentabilidad.

## Contrato editorial y renderer

`principal_version` y `principal_config` se agregan a la hoja editorial existente mediante el conector autorizado, sin sobrescribir `mono_*`, `hunt_*` ni `inv1_*`–`inv7_*`. La copia, etiquetas, titulares, escenas, controles, navegación, atribución y estilo públicos viven en Sheets; no en scripts ni repositorio. Mismo GET `recurso=textos` y cliente `presentacion/source.js`; sin nuevo endpoint, modificación de Apps Script o cambio de ACL.

El consumidor previsto contiene `presentacion/principal-core.js`, `principal.js` y `principal.css` junto a la entrada existente. Sólo geometría conceptual sintética y comportamiento en Git. La cartografía pública permanece en la fuente externa existente; croquis, propiedades y desarrollo se reconocen como ilustraciones, no fotografías de casos reales.

Un único SVG/path maestro naranja y una sola orden M. Trazo acumulativo con retornos exactos por segmentos existentes, conectores exteriores, cámara que acompaña el relato y zonas con identidad estable. No imágenes independientes, video, reemplazo global o dibujos nuevos que borren el origen. Scroll, reproducción, navegación y reversa usan un progreso común determinista. Movimiento reducido muestra el mismo diagrama completo estático y todos los textos accesibles.

## Integridad comercial y financiera

Los participantes públicos son codesarrolladores capitalistas, codesarrollador aportador del terreno y coordinación YoDesarrollo. El diagrama no asigna porcentajes, preferencias, retorno ni obligaciones por defecto. Aportaciones, plazo, recuperación, rendimiento estimado, funciones, decisiones, condiciones de salida y distribución se acuerdan para cada caso.

La aportación de un inmueble conserva su valor económico en la inversión una sola vez. Intereses/comisiones son costos; devolución del principal y aportaciones son flujos. No duplicar gastos ya incluidos ni confundir viviendas con unidades monetarias. Ingresos estimados menos inversión total presupuestada generan utilidad estimada del proyecto; no acreditan utilidad individual o cobro real. Riesgos y escenarios adversos acompañan la comparación.

Revisión legal/documental, uso compatible y factibilidad antes de comprometer o formalizar; proyecto, permisos y servicios antes de obra; documentación y condiciones de venta antes de escrituración; cobros efectivos y acuerdo antes de recuperar/distribuir. El cierre prepara una conversación, no envía mensajes ni solicita depósitos. Alcance de estudio, entregables, posibles costos y siguiente paso se acuerdan.

## Pruebas, publicación y reversión

Atlas: generador y `--check`, esquema, tests y verificadores de OS/portal/accesos/obra. Consumidor: fixtures sintéticos y contratos de nueve escenas/36 momentos; contenido seguro, una orden M, identidades zonas/propiedades distintas, conservación beta y compatibilidad anteriores. Chromium320/390/1440 comprueba scroll nativo/reversa, cámara/punta/posición, controles, navegación, mensajes copiables y lectura sin overflow. Movimiento reducido y navegación beta ida/vuelta mantienen contenido y sesión.

Integración del frontend, copy escrito y publicación se verifican por separado: código servido exacto, fuente editorial viva y apertura anónima tras la PR. No se prueban escrituras a sistemas de negocio. No se registra un PROC operativo ni nuevos contratos de identidad/permisos.

Reversión: revertir sólo PR frontend y restaurar beta4r4 como entrada en la misma URL; preservar copy principal_* y anteriores en Sheets, Material, originales, permisos y expedientes.
