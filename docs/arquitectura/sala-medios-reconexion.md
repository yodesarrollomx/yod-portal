# Reconexión limitada de medios originales

Propuesta CHG-SALA-RECONECTAR-MEDIOS-20261011 y contrato CTR-SALA-RECONECTAR-MEDIOS. Hay dos voces originales recuperadas y verificadas en Drive privado que aún necesitan un acuse de reconexión a COLA.

Se propone un worker de mantenimiento de nube. Lee el informe privado, verifica bytes/MD5/SHA256 de las copias y la evidencia de los trabajos existentes. Ante identidad ambigua, hash diferente o fila cambiada, se detiene. Sólo actualiza la referencia y procedencia de evidencia; nunca manda estados, motores, decisiones o filas nuevas. Relee después y conserva antes/después en un acuse privado. No regenera originales faltantes.

El endpoint heredado carece de comparación atómica: se relee inmediatamente antes, se aborta ante cambios detectados y se conserva acuse para conciliación. No se afirma transacción global. Pruebas sintéticas cubren mismatch, idempotencia y conservación; producción sólo sobre las instrucciones de recuperación aprobadas.

Estado: propuesto; lectura de cola, autoridad del runtime y reconexión real pendientes. Las referencias/identidades físicas están únicamente en Drive privado.

Reversión: detener/revertir el worker, conservar medios e historial y conciliar sólo referencias técnicas previa revisión reciente. No restaurar hojas completas ni cambiar aprobaciones.
