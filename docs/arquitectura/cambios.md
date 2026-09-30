# Cambiar YOD OS con trazabilidad

## Contrato de trabajo

Cada cambio de comportamiento empieza con una propuesta identificada en el modelo: componentes, situación actual, comportamiento deseado, pruebas y despliegue. No convertir una propuesta en conexión observada hasta implementar; no marcar producción comprobada hasta verificar el despliegue.

`architecture-impact.json` acompaña el cambio en cada repositorio. Contiene el modelo de referencia, IDs de componentes, motivo, pruebas y reversión. La comprobación de impacto exige modificar ese registro cuando cambia código, contratos o automatizaciones. Los cambios solo documentales no necesitan inventar cambios funcionales, pero las vistas generadas deben mantenerse sincronizadas.

Para cambios entre repositorios: preparar la propuesta central, fijar su commit, incluirlo en cada registro de impacto y ordenar despliegues para mantener compatibilidad. La lectura del mapa es obligación del agente; CI comprueba el registro y las relaciones, no puede demostrar que una persona comprendió el texto.

## Autonomía y decisiones

Las correcciones inequívocas de defectos reproducidos pueden avanzar con pruebas y reversión. No reinterpretar precios, autorizaciones, reglas financieras ni estados históricos. Las mejoras A–L están pendientes hasta que el propietario seleccione su ID y condiciones. Las aprobaciones deben registrarse con fecha y alcance; no inferirlas de silencio.

## Despliegue y reversión

- Frontend: PR, verificaciones, integración y comprobación de la publicación. La reversión es un commit que restaura la versión anterior y conserva la historia.
- Apps Script: obtener fuente y versión activas, pruebas aisladas, respaldar configuración sin publicar secretos y actualizar la implementación existente cuando se requiera conservar URL. Registrar versión anterior/nueva y verificación. Revertir la versión de la misma implementación.
- Datos: generar primero una propuesta de cambios por ID, totales antes/después y reconciliación. No borrar registros financieros ni ejecutar operaciones con efectos como parte de una prueba.
- Automatizaciones: revisar permisos y consumidores antes de cambiar protecciones. Los productores de datos deben pasar por el mismo control de PR o por un canal de datos separado; no dejar una excepción general para cambios de código.

## Pruebas mínimas según impacto

Identidad: denegación, revocación, cambio de usuario y respuestas tardías. Datos: huecos, duplicados, referencias y fórmulas. Dinero: escrituras parciales, reintentos, concurrencia y conciliación. Integraciones: contrato, rechazo, vacío, error, caché y antigüedad. Interfaz: renderizado seguro, escritorio y móvil. Documentación: esquema, IDs, enlaces y regeneración determinista.

Los respaldos cifrados o caches son otra fuente con antigüedad y alcance propios. No deben mostrar estado «al día» ni sustituir validación de permisos.
