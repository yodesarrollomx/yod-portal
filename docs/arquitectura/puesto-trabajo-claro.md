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

## Paso 2 · revisión independiente antes de corregir

**2026-10-07 06:17 UTC — propuesta, todavía no implementada.** La revisión de `9c730ba02f748c34ae6c51fdf97c68fca3f94ce4` encuentra dos fallos reproducibles: el puesto solicita exports nuevos a una URL de `goals.mjs` que un navegador puede conservar de la versión anterior; además, ocultar el puesto descarta el recibo de un ajuste ya enviado al iframe.

La corrección propuesta actualiza las referencias de caché de los consumidores afectados y mantiene una recepción acotada al ajuste pendiente cuando se cierra el panel. El cierre no autoriza propuestas nuevas. Se preservan selección vigente, origen, emisor, nonce y generación; un cambio de proyecto invalida el trabajo anterior. Ningún intento de confirmar un recibo vuelve a escribir el PPP.

Criterios de aceptación: abrir con la superficie de exports anterior simulada en la URL antigua; cerrar mientras un ajuste se guarda, recibir su confirmación oculto y reabrir el mismo iframe sin duplicar el ajuste. El navegador de prueba usa datos sintéticos y transporte local. La ejecución de estas pruebas y las verificaciones obligatorias queda pendiente del commit de implementación y CI; esta nota no acredita funcionamiento en producción.

**2026-10-07 06:19:41 UTC — implementación preparada en rama.** El puesto y su arranque usan `goals.mjs?v=2`; las entradas del puesto pasan a `agent-workspace.mjs?v=10` y `live-voice-boot.mjs?v=16`. No cambia el contenido de `goals.mjs` ni el bundle React ya compilado. La recepción oculta exige una aplicación o recibo pendiente; un recibo ajeno se rechaza antes de la cola y cada elemento vuelve a comprobar selección y generación. `dispatchRequested` conserva su bloqueo cuando el panel no está activo.

El recorrido sintético de navegador incluye una contraprueba de importación: la URL antigua no exporta las funciones nuevas y el import falla; el puesto debe abrir con la dependencia versionada. Después se cierra el puesto durante el segundo ajuste, se rechaza un recibo ajeno, se confirma el ajuste desde el iframe retenido y se reabre sin repetirlo, tanto a 1280 como a 390 píxeles. La sintaxis de los módulos modificados y del script de navegador fue comprobada en V8; la ejecución Node/Playwright y los verificadores del repositorio quedan pendientes del CI coordinado de PR117. Los resultados se registrarán sobre la revisión final, sin confundir este control sintáctico con una prueba funcional o aceptación en producción.


### 2026-10-07 06:22:13 UTC · Acuse de recibo conciliado

Propuesta previa: atlas 51e06e74c61bb86b1195f40a86d2dc2ad0f4fafb, CTR-PPP-AJUSTE-CONVERSADO y CHG-DESPACHO-PUESTO-104. El puesto devuelve `yod:ppp:receipt-ack` con el request_id y revisión exactos únicamente después de `/board/resolve` satisfactorio y comprobación de la generación actual. El iframe conserva origen, nonce y caso por el canal existente. Un fallo no envía acuse. Regresión de navegador verifica ausencia de acuse tras503, acuse exacto tras reintento y conciliación con panel oculto. La recuperación durable del PPP se integra en su propio repositorio. No escribe cantidades ni modifica reglas financieras.

**2026-10-07 06:33 UTC — cola de confirmaciones del puesto.** La propuesta y contrato ampliados quedaron registrados antes del código en `43bb8429953ab0779d7571ed5d2bc47552455f59`. El recibo único se sustituye por una cola máxima de ocho entradas: los reintentos simultáneos comparten la operación, un fallo no reemplaza el recibo ni impide comprobar sus hermanos y sólo `ok:true`, `request_id` exacto y `status:applied` permiten enviar el acuse y retirarlo. No se exige una revisión en la respuesta del servidor: ese campo no pertenece a su contrato actual. La revisión original sí permanece en la solicitud y el acuse.

Los históricos no se convierten en aplicaciones nuevas. Un recibo pendiente bloquea repetir su propia solicitud, y la cola llena bloquea ajustes adicionales; un histórico sin resolver con espacio disponible conserva su aviso sin inmovilizar otras solicitudes. Al ocultar el puesto sólo termina la confirmación del ajuste ya en vuelo; cambiar de proyecto invalida cola y respuestas tardías. El error de cola llena explica que no se escribió de nuevo.

Tres regresiones del helper real pasaron en V8: concurrencia con 503 y respuesta de otro ID; límite de ocho sin reemplazo y respuestas incompletas; cierre durante confirmación y cambio de proyecto. El ensayo de navegador ahora simula la respuesta real del servidor y comprueba que un `ok:true` de otra solicitud no produce ACK ni segunda escritura. Las entradas se versionan a workspace12 y boot18; la demostración carga workspace12. Node y navegador completo permanecen pendientes del CI coordinado final; no se tocó el bundle compilado ni los datos operativos.
