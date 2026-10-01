# Alcance de verificación · 2026-10-01

## Lo comprobado

- Se inventariaron los 20 repositorios de la organización. El modelo vigente contiene 73 componentes, 95 conexiones y 12 procesos, incluidos los elementos propuestos que aún no están instalados. El [inventario](inventario-fuentes.json) distingue archivos enumerados y fuentes revisadas; no se afirma revisión exhaustiva de cada línea.
- Los enlaces de evidencia fijan la versión de origen. Las declaraciones documentales y los pasos manuales conservan una categoría distinta del código comprobado.
- Se consultaron metadatos y rangos acotados de Control Maestro y Tesorería mediante el conector autorizado de Google Sheets. Se verificaron encabezados y contratos; ningún registro se modificó. Los hallazgos de conciliación se conservan fuera de este repositorio público.
- Las 17 entradas web públicas consultadas respondieron HTTP 200. Esto comprueba disponibilidad de esa ruta en ese momento; no equivale a iniciar sesión, medir carga sostenida o probar el backend.
- Las correcciones del portal se prueban con datos sintéticos: identidad, respuestas tardías, permisos, catálogo, estados de las fuentes, pagos y antigüedad de automatizaciones. Las pruebas de Flujo cubren renderizado y fallos parciales sin escribir en hojas reales.
- El modelo tiene validación de esquema, referencias y evidencia. Las vistas se regeneran de forma determinista. El visor es autónomo y no necesita llamar a APIs de negocio.

Los resultados reproducibles y su commit quedan registrados en GitHub Actions. Una comprobación verde valida los comandos de esa corrida; no acredita actividades ajenas a esos comandos.

Se obtuvieron por API las versiones activas de Portero, Tesorería, Codesarrolladores, Alquimia, Catálogo, Obra, Plan de Potencial, CRM y Obra Cliente. Las implementaciones coinciden exactamente con las direcciones usadas por sus clientes. El [registro de verificación](backends-verificados.json) contiene versiones y hashes de fuente, sin identificadores privados ni código de servidor. Esto acredita fuente y versión, no pruebas de operaciones por rol. Portero tiene cambios adicionales en el editor que se conservaron sin desplegar.

Se amplió la revisión de autorización a Portero, Tesorería, Obra, Catálogo y CRM mediante fuentes activas y dobles con datos sintéticos. La matriz privada distingue controles, defectos técnicos reproducidos y reglas de negocio aún por definir. Bajo `CHG-BACKENDS-AUTORIZACION-001` se publicaron correcciones acotadas: Portero 51, Flujo 15, CRM 20 y Catálogo 9, conservando implementación, URL y permisos. Cada fuente activa se contrastó por API. Portero conservó además el borrador del editor con su parche, sin publicar sus funciones adicionales. El prototipo de Obra permanece sin integrar.

Pasaron 22 regresiones de Portero tanto sobre su versión publicada como sobre el borrador conservado; 12 de Flujo y 5 integraciones con su cliente vigente; y 38 compartidas de CRM/Catálogo. El prototipo privado de Obra pasó 21 pruebas sintéticas. El procedimiento de despliegue tuvo seis pruebas, incluidas recuperación y comprobación después de una respuesta incierta; Catálogo se confirmó con lecturas posteriores sin repetir la escritura. La lectura de salud pública de CRM devolvió HTTP 200 con únicamente campos técnicos. No se escribieron registros de negocio. Esto no acredita todos los recorridos ni cierra las decisiones pendientes de autorización e idempotencia.

El portal pasó 119 pruebas Node, incluida una batería de ocho pruebas Python del registro local de la App. Los PR de corrección de [Sala #53](https://github.com/yodesarrollomx/sala-edicion/pull/53) y [Marketing #27](https://github.com/yodesarrollomx/aurum-board/pull/27) tienen sus checks aprobados y 28 y 22 pruebas aisladas de publicadores, respectivamente. Permanecen sin integrar hasta instalar y configurar la identidad prevista; ver [publicador de GitHub](publicador-github.md).

## Pendiente para cerrar producción

1. Completar el inventario de motores restantes y de scripts vinculados. La autenticación de Apps Script ya está concedida: se recuperaron las fuentes y versiones activas de nueve motores con identidad contrastada; Obra Cliente ya está identificado y contrastado.
2. Completar el contraste de motores y clientes más allá de las correcciones aisladas registradas. Los motores sin fuente accesible no se consideran auditados por estar referenciados en JavaScript.
3. Completar los recorridos funcionales de Obra por rol en un entorno aislado. La corrección acotada de Obra Cliente ya pasó diez escenarios sintéticos con los siete esquemas reales comprobados y se verificó su versión activa 2 por API, conservando implementación, URL y permisos. No se realizaron escrituras en hojas de producción.
4. Conciliar privadamente registros financieros y referencias de bolsas antes de cualquier corrección. Un ID repetido no acredita un pago duplicado; no se eliminan movimientos por inferencia.
5. Verificar inicio de sesión real y recorridos por rol en un entorno de prueba; confirmar que cada backend autoriza las operaciones. Ocultar una tarjeta en el navegador no sustituye autorización del servidor.
6. Completar el registro e instalación personal de la App publicadora, configurar secretos cifrados e integrar los PR probados. Hubo una publicación correcta de Sala, pero corridas posteriores se detuvieron por la política de aprobación de workflows de PR creados con `GITHUB_TOKEN`. La corrección usa identidad de App solo para crear PR; después deberá comprobarse la publicación real antes de montar referencias en el motor. Una corrida manual verde no sustituye los checks exigidos al PR.
7. Revisar y resolver las [alertas de dependencias](dependencias.md) detectadas en las compilaciones, distinguiendo código servido y herramientas de construcción; una instalación exitosa no demuestra ausencia de vulnerabilidades.
8. Medir tiempos de carga y fallos con una muestra representativa. Una respuesta HTTP o una captura local no constituye un diagnóstico completo de rendimiento.
9. Confirmar `LIBRO_ID` del motor de Obra y la regla de firma delegada antes de vincular personas con permisos. Un libro localizado por nombre no demuestra ser el destino efectivo. La interfaz actual permite delegación; el prototipo no cambia esa regla por inferencia.
10. Definir en la propuesta H permisos por acción, recuperación de pagos tras fallos parciales y persistencia de reintentos. La corrección de Flujo preserva campos del servidor y rechaza pagos inexistentes; no promete idempotencia completa ni corrige registros históricos automáticamente.

## Cómo repetir verificaciones locales

```sh
node scripts/arquitectura.cjs --check
node --test tests/*.cjs
node verify-os.cjs
node verify-portal.cjs
node verify-accesos.cjs
node verify-obra-app.cjs
```

Las diez pruebas sintéticas de Obra Cliente acompañan ahora la fuente corregida, después de contrastar y verificar el despliegue. Los repositorios consumidores verifican impacto contra una versión inmutable del atlas. Sus pruebas funcionales propias se ejecutan además del control de arquitectura.
