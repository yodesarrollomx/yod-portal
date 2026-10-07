# Trabajo recuperado y recorrido del puesto

CHG-PUESTO-TRABAJO-CLARO-099 continúa el trabajo observable de PR110 sin introducir otro almacén, servidor o tablero. Seleccionar el personaje o su computadora abre Trabajo en el mismo puesto. Plan de potencial, Pendientes y Fuentes permanecen accesibles; navegación manual y versiones quedan en Herramientas.

Trabajo presenta el objetivo, estado, fecha del último registro, resultado y siguiente paso. El análisis preparado exige comprobar el registro canónico en Pendientes antes de revisar; no representa una aprobación del PPP. Un registro interrumpido requiere una decisión humana para retomar. La pérdida de conexión deja visible el último registro, identificado como histórico. Retirar selección elimina contenido e identificadores.

El lector existente conserva case_id, run_id, goal_id y source_revision. Reabrir, observar o actualizar sólo consulta /computer/work y la captura fechada cuando corresponde. No crea objetivos, no los reanuda ni repite herramientas. Esta entrega mejora la presentación de recuperación existente; no acredita por sí sola que el servidor privado esté desplegado en la revisión del repositorio.

## Comprobación

Pruebas de reapertura con el mismo ID, ausencia de escrituras, pérdida de conexión, retiro de selección, respuesta tardía y aislamiento. puesto-demo.html usa el módulo real del puesto y un lector doble con datos sintéticos; no llama al backend. Permite reabrir, desconectar y retirar selección. El ancho de 390 píxeles usa un iframe; no acredita un dispositivo móvil real. La navegación física 3D requiere WebGL y sesión por separado.

## Autoevaluación de UX

| Criterio | Hallazgo | Cambio y condición de aceptación |
| --- | --- | --- |
| Orientación | El puesto abría PPP mientras el trabajo estaba dentro de Herramientas. | Trabajo es la entrada; la primera lectura debe explicar estado, resultado y qué sigue. |
| Jerarquía | Resultado, fuentes, eventos y operaciones se agrupaban en un bloque técnico. | Resultado y siguiente paso visibles; fuentes, evidencia e identificadores se despliegan por interés. |
| Decisión | Un análisis preparado podía interpretarse como trabajo aceptado. | Indicar que no aprueba el PPP y dirigir a Pendientes para comprobar y revisar. |
| Recuperación | Abrir la pantalla no explicaba si estaba retomando la ejecución. | Ninguna operación automática; interrupción y fecha del registro explícitas. |
| Coherencia | El plano indicaba abrir Agentes aunque ese acceso estaba oculto. | Indicar entrada desde El Despacho en YOD OS para validar acceso. |
| Alcance global | Entorno aún reúne permisos, visitas y espacios futuros; la voz y el PPP requieren aceptación con sesión. | La experiencia completa sigue abierta. No declarar aceptada toda la oficina por este cambio. |

## Reversión

Revertir frontend por PR. Conservar IDs, datos privados, permisos, historial, fuentes y revisiones. No requiere instalar Apps Script ni desplegar el servidor privado.
