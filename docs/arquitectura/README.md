# YOD OS · Mapa vivo del negocio

Esta es la entrada para entender y modificar YOD OS. Prioridad de mejora acordada: **vender más → mejorar margen y control → cobrar antes**. Integridad de datos y autorización son requisitos de cualquier cambio.

## Explorar

- [Abrir el atlas visual](index.html): búsqueda, dominios, conexiones, fichas, procesos y propuestas. Es autónomo: también funciona descargado, sin acceso a producción.
- [Diagramas de conexiones y contratos](mapas.md).
- [Fichas por tablero, motor y almacén](fichas.md).
- [Procesos, responsables y pasos manuales](procesos.md).
- [Contratos de datos e identidad](contratos.md) y [diferencias entre fuentes](diferencias.md).
- [Mejoras A–L para decidir](propuestas.md) y [plan de tres entregas](plan-entregas.md).
- [Modelo JSON](modelo.json) y [esquema](modelo.schema.json): fuente de las vistas y entrada para agentes.
- [Cobertura y verificación](verificacion.md), [reglas de cambio](cambios.md) y [evolución](evolucion.md).
- [Identidad del publicador automático](publicador-github.md): causa del bloqueo, permisos mínimos y registro pendiente.

- [Capacidades compartidas de los agentes](despacho-capacidades.md): referencia Cubefarm, funciones conectadas y plan de instalación por agente.

- [Entrega técnica de Control Maestro](control-maestro.md): versiones, aceptación, mantenimiento y reversión.

- [EMD #9 · cuestionario completo bajo URL GitHub](emd-github-embed.md): propuesta, handshake y matriz de aceptación; implementación en PR separado.

- [Sala #35 · Corcho provisional en Portero](despacho-corcho-provisional.md): routing exclusivo, identidad/ACL, archivo privado original, pruebas, reversión y manifests consumidores.

- [Sala #47 · Recuperación Patrimonial](ppp-patrimonial-recovery-047.md): transporte sobre V65, caché por caso, conciliación de ACK perdido y borrador durable; implementación coordinada por separado.

## Qué significa cada evidencia

**Código** acredita lo leído en una versión concreta de GitHub. **Ejecución** exige una comprobación registrada en el entorno identificado. **Declarado** proviene de documentación o una configuración cuyo comportamiento no se ha verificado. **Pendiente** identifica un vacío. **Propuesto** describe una mejora que aún no existe.

Una flecha entre dos pantallas puede ser solo navegación. Una tarjeta que resume datos no demuestra una integración transaccional. Los recorridos muestran los pasos manuales y los enlaces aún no comprobados. No se deben utilizar indicadores de salud del frontend para certificar por sí solos permisos, datos correctos o despliegues.

## Fuente de verdad

El modelo describe la arquitectura; no reemplaza los registros operativos. El catálogo técnico sigue en `os/catalogo.js`, los datos vivos en sus hojas y motores, y las decisiones del negocio en sus procesos actuales. Conservar `SYS-*`, `PRJ-*` y los contratos existentes. `board-aurum` es MOAC/operación; `aurum-board` es marketing.

Los enlaces de evidencia fijan el commit inspeccionado. Para actuar, comparar ese commit con la rama y el despliegue actuales. Apps Script puede ejecutar una versión diferente del código en GitHub; la presencia de un archivo `.gs` no demuestra instalación.

## Antes de cambiar algo

1. Leer `AGENTS.md`, este índice, la ficha y las conexiones del componente.
2. Actualizar el modelo con la propuesta y registrar componentes afectados, contratos, pruebas y reversión en `architecture-impact.json`.
3. Revisar la propuesta y sus impactos antes de implementar. Las decisiones comerciales pendientes requieren la selección del propietario.
4. Implementar en rama, añadir pruebas de los fallos reales y ejecutar las verificaciones del repositorio.
5. Regenerar las vistas con `node scripts/arquitectura.cjs`. Comprobarlas con `node scripts/arquitectura.cjs --check`.
6. Integrar mediante PR y comprobaciones obligatorias. Registrar por separado código integrado, frontend publicado y backend desplegado.

Una lectura GET a un backend de negocio puede crear o modificar datos. Las auditorías de datos usan lecturas directas autorizadas de Sheets; las pruebas con escrituras usan dobles o entornos aislados. No usar producción para probar movimientos financieros.

## Publicación y privacidad

Este repositorio es público. El modelo no almacena clientes, correos, importes reales, credenciales, URLs completas de Apps Script ni identificadores de hojas privadas. Las fuentes se expresan con IDs lógicos. Los hallazgos de seguridad explotables se tratan en avisos privados de GitHub hasta su corrección. Los ejemplos y pruebas utilizan datos sintéticos.

La auditoría no se considera completa mientras existan componentes críticos o despliegues sin comprobar; consultar siempre el alcance vigente en `modelo.json` y `verificacion.md`.
