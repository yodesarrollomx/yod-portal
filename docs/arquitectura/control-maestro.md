# Control Maestro · entrega técnica

Registro `CHG-CONTROL-MAESTRO-001`, revisión del atlas `2026-10-01.6`.
Esta entrega cierra correcciones técnicas de catálogo, navegación y autorización de sus dependencias; no habilita roles pendientes ni certifica todos los tableros de YOD OS.

## Estado comprobado

| Pieza | Estado | Evidencia |
|---|---|---|
| Portero | Versión 52 publicada; anterior 51 | Fuente inmutable y configuración contrastadas por API; salud pública y rechazo de credenciales ausentes/no válidas por HTTP |
| Catálogo | Versión 10 publicada; anterior 9; API 1.6.0 habilitada | Fuente inmutable y configuración por API; directorio público y rechazo de lectura protegida por HTTP |
| Editor de Portero | Borrador adicional conservado | Solo el parche revisado se aplicó también al editor; sus funciones adicionales no se publicaron |
| Portal | Integrado por PR #14 y publicado en Pages | Doce archivos comparados byte a byte con `7e9094bf2a70ea1ee4e790299370fe28cfc4d89b`; aceptación sintética local y sobre publicación |
| Hojas | Conservadas, sin escrituras operativas | Lecturas acotadas de estructura, catálogo y configuración; no se exportaron identidades |

La lectura pública devuelve dos módulos internos y diez IDs técnicos conocidos. Los IDs permiten distinguir un módulo ausente de una fila ocultada expresamente. No contienen nombres de personas, credenciales ni derechos de escritura.

## Comportamiento entregado

El menú y las tarjetas exigen un canje válido, con token coincidente, rol explícito y lista de permisos presente. Una lista vacía conserva cero permisos. El comodín conserva su alcance en los tableros; Control Maestro exige administración explícita y su hoja mantiene además los permisos propios de Google.

Catálogo consulta el canje vigente para filtrar metadatos restringidos. Los recursos protegidos y las modificaciones siguen usando identidad Google y ACL de Control Maestro: el token del Portero no sustituye ese contrato. Un visitante sin identidad Google no recibe acceso de escritura. El catálogo de roles describe funciones; no concede derechos implícitos por el nombre del rol. Las filas pendientes permanecen sin acceso.

La vigencia de la ACL se valida antes de autorizar. Fechas vacías conservan el significado de límite no configurado; las fechas indicadas deben ser válidas. Se admiten fechas ISO y `d/M/yyyy`, con límites de día inclusivos en Hermosillo. La selección de acceso considera recurso y operación; identidades ambiguas se rechazan. No se combinaron permisos de distintas personas ni se modificaron filas de acceso.

El respaldo agrega módulos que aún no están registrados, pero respeta los IDs que la respuesta vigente identifica como conocidos y ocultos. La búsqueda del marco respeta también los códigos de proyecto vigentes. Un rechazo de Catálogo descarta sus filas sin revocar una sesión de Portero ya validada ni conservar una confirmación falsa de actualización.

Las correcciones privadas anteriores se conservaron: validación de todos los campos antes de escribir, esquema de Bitácora de diez columnas, idempotencia ligada a actor, entidad y contenido, y errores explícitos ante fallos parciales. No hay transacción entre libros: un fallo parcial requiere revisión del estado efectivo antes de cualquier reintento.

## Pruebas y sus límites

- 124 casos locales del portal, más todos los verificadores exigidos por `AGENTS.md`.
- 33 escenarios privados de Portero, ejecutados tanto sobre la fuente revisada como sobre el editor pendiente preservado. Once casos adicionales reprodujeron fallos antes de corregirlos; después pasaron los 33.
- 50 escenarios privados compartidos de CRM/Catálogo, incluida integración sintética con Portero. CRM se usa para comprobar compatibilidad; no recibió un nuevo despliegue en este encargo.
- Seis pruebas del procedimiento de publicación y recuperación.
- Cinco perfiles en Chromium: permisos limitados, administración, comodín, permisos vacíos y respuesta incompleta. Escritorio de 1280 px y móvil de 390 px; buscador con teclado y ausencia de errores JavaScript. Todas las llamadas a motores, incluidos canjes por POST, fueron interceptadas; cero escrituras reales.
- Seis peticiones HTTP reales de lectura: salud de ambos motores, catálogo público, lectura protegida sin identidad y canje con credencial ausente/no válida. Todas pasaron y no entregaron registros protegidos.

Las capturas son sintéticas y lo indican en la imagen. No son sesiones de personas reales ni evidencia de escritura en producción. No se probaron Safari, dispositivos físicos, todos los flujos de cada backend ni la latencia de una sesión Google real. El canje vuelve a consultar permisos; su coste de carga requiere observación con uso autenticado.

## Mantener, publicar y recuperar

1. Leer `AGENTS.md`, el atlas vigente y `CLAUDE.md`. Registrar impacto y trabajar en una rama desde el `main` actual.
2. Editar el catálogo técnico en `os/catalogo.js`; regenerar sus copias con `node scripts/catalogo.cjs`. Los nombres y la visibilidad vivos siguen en Control Maestro. No migrar IDs o activar roles por inferencia.
3. Para Apps Script, obtener mediante API la fuente de la versión activa, el editor, el manifiesto y la implementación existente. Las fuentes y respaldos son privados. Comparar todas las piezas antes de preparar un cambio; el editor puede contener trabajo adicional.
4. Probar con registros sintéticos y dobles. Preservar identidad Google, contratos, propiedades y configuración. No usar movimientos reales como pruebas.
5. Ejecutar las comprobaciones del repositorio y revisar el commit exacto del PR. Para la paridad coordinada de accesos se contrastó Potenciales `d446b637f408124f224afadc6c674e3675c62f38`.
6. Publicar únicamente una versión inmutable revisada en la misma implementación. Conservar ID, URL, manifiesto y permisos. Releer fuentes/configuración y preservar el editor pendiente; ante respuesta incierta, consultar el estado antes de repetir una escritura.
7. Contrastar Pages con los archivos del commit integrado. Separar esta comprobación de las pruebas con motores simulados y del recorrido autenticado real.
8. Reversión de servidor: cambiar solo la versión de la implementación existente a Portero 51 o Catálogo 9, usando el respaldo privado y relectura de configuración. No restaurar filas ni sobrescribir el editor pendiente. Esas versiones anteriores requieren revisar las correcciones que se perderían. Reversión del portal: revertir el PR mediante otro PR con verificaciones.

## Pendientes precisos

- Aceptación con cuenta Google real autorizada y medición de carga. No se creó ni se solicitó una credencial personal para automatizarla.
- Nota histórica superada en la conciliación del 7-oct-2026: la lectura directa del registro confirmó SYS-DESPACHO presente. El catálogo técnico contiene once tableros y el registro agrega SYS-PORTAL, alias existente de SYS-YOD-OS. Se conservan IDs y permisos. Bandeja/Corcho de Dirección y oficina 3D son superficies distintas; ver [cobertura de oficina](oficina-cobertura.md).
- Los roles y accesos pendientes de Control Maestro no se activaron. Agregar usuarios o definir permisos nuevos corresponde a una decisión explícita del propietario.
- Verificación autenticada de modificaciones en un recurso de pruebas aislado y configuración efectiva de sus libros. Las pruebas de contrato y los guardas de esquema no certifican todos los destinos operativos.
- CRM conserva su despliegue 20. Revisar su caché de autorización y su recorrido comercial al continuar con CRM; la actualización de Portero no garantiza la frescura de todos sus consumidores.

El informe privado de entrega conserva hashes, diarios de API, referencias de reversión, resultados y capturas. El atlas público omite datos reales, identificadores de infraestructura y fuentes privadas.

## Publicación del frontend comprobada

[PR #14](https://github.com/yodesarrollomx/yod-portal/pull/14) integrado el 2026-10-01 a las 02:17:47 UTC. Head revisado `8759abcebffd4fc44d5eaa849f6b94e6aced9940`; integración `7e9094bf2a70ea1ee4e790299370fe28cfc4d89b`. Los checks obligatorios Arquitectura YOD y verificar aprobaron ese head exacto; también aprobaron la integración. La comparación HTTP de doce archivos públicos resultó idéntica al commit integrado. El registro privado conserva las marcas UTC y SHA-256 por archivo. Las pruebas de navegador sobre la publicación interceptan todos los motores: certifican la interfaz servida, sin confundirla con una sesión real.
