# Despacho: permisos por operación · acción 1.3

CHG-DESPACHO-PERMISOS-069 / CTR-DESPACHO-PERMISOS-V1. Código candidato implementado y pruebas fuera de producción. `ENTORNO_PERMISOS_SERVIDOR=false`: Portero v64 y su consumidor actual continúan activos hasta instalar y comprobar el enlace nuevo. La demostración usa identidades y datos sintéticos; no acredita instalación ni acceso real.

## Matriz inicial

| Espacio | Nivel efectivo | Operaciones |
| --- | --- | --- |
| Juntas | Observar | Registrar llegada; leer entregas por aprobar |
| Biblioteca | Observar | Registrar llegada |
| Edición | Observar | Registrar llegada |
| Comunicación, navegación, Drive, Dirección, usos múltiples, museo | Sin conexión | Ninguna |

La oficina permite leer visitas del expediente. «Observar» incluye el registro existente de una llegada reportada por el cliente; ese recibo acredita persistencia, no presencia física ni ejecución de herramientas. Ningún espacio concede crear borradores, enviar mensajes o aprobar entregas. Los otros protocolos existentes de conversación/metas conservan su autorización y no quedan cubiertos globalmente por esta matriz. Ampliarlos requiere una etapa propia.

## Autoridad y recorrido

1. El OS exige sesión vigente y usa su credencial en el cuerpo del POST al mismo Portero. Ambos puentes aceptan solo `case_id` para `readOfficePermissions` y `case_id,space_id:juntas` para `readOfficePending`. El carril office no bloquea el carril de visitas.
2. Apps Script resuelve actor mediante `yodDespachoActor_`, con las comprobaciones existentes de sesión, editores, DP y expediente canónico. No acepta actor, libro, nivel o permiso del navegador.
3. `createOfficePermissions` aplica reglas explícitas por expediente, espacio y operación. La matriz devuelta es informativa: no es credencial ni sustituye una autorización posterior. El núcleo exacto vive en `despacho-runtime/source/shared/office-permissions.js`; Apps Script y la demostración ejecutan el mismo código.
4. La lectura de Juntas delega a `readGoals` existente y comprueba acceso e identidad otra vez al finalizar. Una revocación o cambio de actor retiene la respuesta. Lectura de visitas también reautoriza después del acceso a Sheets. El registro conserva sus comprobaciones antes del lock y antes del commit.
5. El cliente valida esta versión cerrada de matriz, bloquea consultas mientras no se confirma, elimina tarjetas al perder el permiso y descarta respuestas de una sesión cerrada. Cada operación vuelve al servidor; un botón, avatar o parámetro no eleva permisos.

Estos controles comprueban acceso en puntos concretos; no convierten una ACL externa en una transacción atómica ni borran datos que el usuario ya vio. No hay consulta continua de permisos. Las denegaciones de identidad no devuelven contenido privado; errores desconocidos se sanitizan.

## Instalación pendiente y criterio de encendido

1. Releer y respaldar la implementación activa y HEAD de Apps Script. Conservar URL, principal, acceso y scopes. El helper editor-only de lectura de visitas guardado en HEAD no forma parte de v64.
2. Crear `DespachoPermisos.gs` concatenando el núcleo exacto y `permisos-portero.gs`. Reemplazar `DespachoVisitas.gs` con visitas.gs + visitas-aisladas.gs + visitas-portero.gs actuales. **Instalar ambos juntos**: el wrapper de visitas nuevo depende de `yodDespachoOfficeAccess_`.
3. En `yodDespachoRequest_`, después de validar payload y antes del allowlist existente, añadir solo el dispatch de `readOfficePermissions/readOfficePending` hacia `yodDespachoOffice_`. Mantener dispatch de visitas y el resto del router. Releer y cotejar exactamente la fuente guardada antes de publicar.
4. Ejecutar pruebas aisladas/sintéticas y comprobar contrato y ausencia de efectos externos. No cambiar ACL reales para simular revocación ni generar filas de prueba en el libro de negocio.
5. Actualizar la implementación existente y verificar versión efectiva. Comprobar lectura autenticada de matriz y Juntas, y lectura de la misma visita/recibo sin otra escritura. Solo entonces entregar otro PR con flag true y versiones de caché.
6. Capturas: matriz autenticada, consulta permitida y demostraciones sintéticas de denegación y revocación (lectura 1, datos entregados 0). Registrar fuente, condiciones, resultado y límites en el plan privado. WebGL/móvil real continúan pendientes en 0.4.

## Pruebas y reversión

Pruebas del núcleo y enlace real con dependencias sintéticas: sesión denegada; expediente ajeno; campos actor/nivel; operación desconocida; espacios sin conexión; borrador/envío/aprobación denegados; acceso retirado o actor cambiado durante lectura; registro revalidado antes de commit. Cliente y puentes comprueban origen/ventana, sesión, respuestas tardías, carriles independientes y retirada de tarjetas visibles.

`permisos-demo.html` permite seis comprobaciones en memoria y muestra lecturas ejecutadas/datos entregados. Nunca llama Portero, Sheets, Gmail o WhatsApp. Una demostración correcta no acredita el despliegue manual pendiente.

Reversión: consumidor false y, si se necesita, implementación anterior del mismo Portero. Conservar historial y recibos; no borrar pestañas ni cambiar ACL. Fuente nueva preparada con el flag apagado puede publicarse tras checks; instalación y encendido se registran por separado.
