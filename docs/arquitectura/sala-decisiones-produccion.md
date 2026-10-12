# Sala · de decisiones guardadas a producción

Se registra la corrección autorizada en CHG-SALA-DECISIONES-PRODUCCION-20261012 y CTR-SALA-DECISIONES-PRODUCCION. La mesa del editor muestra qué falta contestar; no puede representar por sí sola el trabajo ya aprobado o rechazado.

El lector de producción reutiliza el backend existente: día fresco con decisiones fusionadas y propuestas originales activas por fecha. No cambia Apps Script a partir de su espejo. Una propuesta retirada o una lectura incompleta no autoriza fabricar sobre una versión vieja.

La toma elegida fija imagen, texto e identidad del trabajo. La Mesa consume notas actuales y, tras aprobar la primera lámina, prepara las demás del guion como candidatas que requieren revisión. El Productor abre ramas aprobadas por separado y sólo abre el corte cuando existen todas las láminas del guion con sus aprobaciones. Los carruseles conservan su formato.

El cierre exige demostrar por separado guardado, fuentes canónicas, trabajos nuevos, productos durables y montaje de candidatos bajo un recibo de publicación. La prueba aislada de motores no acredita ese recorrido. Pruebas con fuentes sintéticas y dobles; ejecución real de decisiones existentes se registra por separado.

Reversión: PR de código y workflow, conservando versiones, medios, decisiones, colas y snapshots.

La ejecución real reveló dos bloqueos adicionales: modelos de IA retirados y recibos duplicados al llamar Mesa dos veces dentro del mismo run. Se verificó por API un alias ligero y un modelo estable; el catálogo por sí solo no acredita acceso. Se propone priorizar decisiones recientes, publicar estado agregado de generación y realizar cada pasada en un run nuevo. Un fallo total debe fallar, y lo parcial permanece declarado como tal.
