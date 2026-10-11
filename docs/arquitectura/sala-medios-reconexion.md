# Reconexión limitada de medios originales

Cambio CHG-SALA-RECONECTAR-MEDIOS-20261011 y contrato CTR-SALA-RECONECTAR-MEDIOS publicados y comprobados el11-oct-2026. Dos voces originales recuperadas y verificadas en Drive privado quedaron reconectadas a sus trabajos existentes de COLA.

Worker de mantenimiento aprobado primero en Atlas PR165 e integrado por Sala PR269. Comprueba bytes/MD5/SHA256/tamaño de las copias contra el informe y MD5 completos de la evidencia original. Exige trabajo terminado, identidad/referencia exactas y fila única. Relee inmediatamente antes y después, actualiza sólo referencia/procedencia de evidencia y conserva estados, motores, bloqueos, prioridades y decisiones. No regenera ni crea trabajos.

Pruebas: suite completa164, incluidas20 de reconexión; Arquitectura YOD y verificar success. [Run real38159239581](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38159239581) success con code_sha159d932cd81c2d2c3fda31a862ea60fc0b3ae667. Dos intentos y dos actualizaciones confirmadas, error nulo y acuse privado completo de antes/después subido y leído byte exacto. El log público sólo muestra conteos; archivos/revisiones/referencias permanecen privados.

Workflow sin cron: activación por incorporación del código o manual, serializado con sala-ejecutor. Referencia ya reconectada se verifica sin reescribir; idempotencia probada con dobles. El API heredado no ofrece CAS atómico: se rechazan cambios detectados y se conserva antes/después para conciliación, sin afirmar una transacción global.

Pendientes: fuentes/editor IDs, disparadores y correo originales;26 medios históricos no localizados en las fuentes auditadas. Estos dos originales sí están recuperados/reconectados. No se modificaron los espejos Apps Script ni se reactivaron gestores cancelados.

Reversión: detener/revertir el worker y conservar acuses/medios. Conciliar sólo referencia técnica previa contra lectura reciente y revisión; no restaurar hojas completas ni cambiar aprobaciones.
