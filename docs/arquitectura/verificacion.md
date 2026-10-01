# Alcance de verificación · 2026-09-30

## Lo comprobado

- Se inventariaron los 20 repositorios de la organización: 71 componentes, 86 conexiones y 12 procesos. El [inventario](inventario-fuentes.json) distingue archivos enumerados y fuentes revisadas; no se afirma revisión exhaustiva de cada línea.
- Los enlaces de evidencia fijan la versión de origen. Las declaraciones documentales y los pasos manuales conservan una categoría distinta del código comprobado.
- Se consultaron metadatos y rangos acotados de Control Maestro y Tesorería mediante el conector autorizado de Google Sheets. Se verificaron encabezados y contratos; ningún registro se modificó. Los hallazgos de conciliación se conservan fuera de este repositorio público.
- Las 17 entradas web públicas consultadas respondieron HTTP 200. Esto comprueba disponibilidad de esa ruta en ese momento; no equivale a iniciar sesión, medir carga sostenida o probar el backend.
- Las correcciones del portal se prueban con datos sintéticos: identidad, respuestas tardías, permisos, catálogo, estados de las fuentes, pagos y antigüedad de automatizaciones. Las pruebas de Flujo cubren renderizado y fallos parciales sin escribir en hojas reales.
- El modelo tiene validación de esquema, referencias y evidencia. Las vistas se regeneran de forma determinista. El visor es autónomo y no necesita llamar a APIs de negocio.

Los resultados reproducibles y su commit quedan registrados en GitHub Actions. Una comprobación verde valida los comandos de esa corrida; no acredita actividades ajenas a esos comandos.

Se obtuvieron por API las versiones activas de Portero, Tesorería, Codesarrolladores, Alquimia, Catálogo, Obra, Plan de Potencial, CRM y Obra Cliente. Las implementaciones coinciden exactamente con las direcciones usadas por sus clientes. El [registro de verificación](backends-verificados.json) contiene versiones y hashes de fuente, sin identificadores privados ni código de servidor. Esto acredita fuente y versión, no pruebas de operaciones por rol. Portero tiene cambios adicionales en el editor que se conservaron sin desplegar.

## Pendiente para cerrar producción

1. Completar el inventario de motores restantes y de scripts vinculados. La autenticación de Apps Script ya está concedida: se recuperaron las fuentes y versiones activas de nueve motores con identidad contrastada; Obra Cliente ya está identificado y contrastado.
2. Contrastar los motores de identidad, catálogo, finanzas y Obra con los clientes actuales. Los motores sin fuente accesible no se consideran auditados por estar referenciados en JavaScript.
3. Completar los recorridos funcionales de Obra por rol en un entorno aislado. La corrección acotada de Obra Cliente ya pasó diez escenarios sintéticos con los siete esquemas reales comprobados y se verificó su versión activa 2 por API, conservando implementación, URL y permisos. No se realizaron escrituras en hojas de producción.
4. Conciliar privadamente registros financieros y referencias de bolsas antes de cualquier corrección. Un ID repetido no acredita un pago duplicado; no se eliminan movimientos por inferencia.
5. Verificar inicio de sesión real y recorridos por rol en un entorno de prueba; confirmar que cada backend autoriza las operaciones. Ocultar una tarjeta en el navegador no sustituye autorización del servidor.
6. Observar la primera corrida de los publicadores adaptados y confirmar recursos publicados antes de montar referencias en el motor. Las pruebas de publicación usan dobles y no disparan procesos operativos reales.
7. Revisar y resolver las [alertas de dependencias](dependencias.md) detectadas en las compilaciones, distinguiendo código servido y herramientas de construcción; una instalación exitosa no demuestra ausencia de vulnerabilidades.
8. Medir tiempos de carga y fallos con una muestra representativa. Una respuesta HTTP o una captura local no constituye un diagnóstico completo de rendimiento.

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
