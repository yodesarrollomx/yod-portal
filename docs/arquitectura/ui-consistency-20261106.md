# Revisión de pantallas YOD OS · 6 de noviembre de 2026

## Alcance y resultado

Correcciones preparadas en rama para la cabina y el marco compartido. No integradas ni verificadas en producción. Se recorrieron las entradas de los once destinos web de `os/catalogo.js`, además del Inicio y la carpeta de inversión. El destino Control Maestro es una hoja externa y no se contó como pantalla web. No hubo sesión autorizada en el navegador de revisión; no se probaron datos ni escrituras privadas.

## Fallos y correcciones

| Fallo | Evidencia | Corrección |
|---|---|---|
| Enter cierra el buscador sin abrir resultado | Reproducido en MOAC; el único submit era el botón cancelar | Cierre con botón independiente; Enter activa el primer enlace habilitado y conserva su destino |
| Consulta vieja al reabrir y lista reiniciada | Reproducido en MOAC con consulta sintética | Reiniciar campo y resultados juntos |
| Enter con cero resultados cierra el diálogo | Reproducido en MOAC | Mantener diálogo abierto para corregir la consulta |
| Nombre del resultado diferente del menú según rol | Código de cabina usaba título del Sheet directamente | Usar `moduleTitle` en búsqueda y etiqueta, sin cambiar el registro ni el permiso |
| Búsqueda inconsistente con acentos, espacios y códigos | Comparación de los dos buscadores | Normalizar texto y agregar códigos en cabina; conservar filtrado de sesión |
| Buscador sin nombre accesible y cierre como glifo | DOM de producción | Etiquetas explícitas para diálogo, campo y cierre |
| Menú móvil compartido sin estado anunciado ni control de foco | Código de `wireDrawer` | Estado expandido, Tab circular, Escape, retorno del foco, panel cerrado inerte y vínculo del botón al panel |
| Panel de cabina fuera de pantalla seguía en recorrido de teclado | Código de cabina | Panel cerrado inerte; sincronización al cambiar tamaño; diálogo nativo tiene prioridad de foco |
| Saludo `Buenas tardes, .` | DOM de Inicio | Respaldo neutro `equipo` mientras no hay identidad |

Las etiquetas de versión se regeneraron con el mecanismo existente para que los consumidores carguen los cambios. Los otros HTML sólo cambian su etiqueta; no cambia su lógica. Las URLs de scripts que mantienen versiones anteriores en otros repositorios pueden conservar caché hasta su renovación; no se acredita propagación global.

## Cobertura del recorrido publicado

| Entrada | Observación | Pendiente |
|---|---|---|
| Inicio | Acceso Google; saludo vacío reproducido | Operación y módulos con identidad válida |
| El Despacho | Entrada y vistas Mi trabajo / Mi corcho; solicita acceso | Pendientes y funcionamiento interno |
| PPP | Marco y pantalla Sesión por validar | Planes, formularios, guardado y recarga |
| Mercado Hermosillo | Marco y pantalla Sesión por validar | Gráficas y controles internos |
| Codesarrollos | Track inicial; posteriormente apareció Inicio sin sesión | Continuidad autenticada y fichas |
| Real de Miramar | Entrada encontrada; prompt nativo bloquea interacción; cancelación terminó en timeout | Resolver continuidad con sesión; no se introdujo clave |
| MOAC | Marco y acceso; búsqueda Enter/reapertura reproducidos | Tareas y formularios internos |
| Flujo | Marco y acceso; posteriormente diálogo nativo bloqueó navegación | Datos, filtros y continuidad autenticada |
| AURUM | Marco y pantalla Sesión por validar | Proyectos y controles internos |
| Masterbrokers | Marco y pantalla Sesión por validar | Roles MD/MB, prospectos y presentaciones |
| Embudo comercial | Marco y pantalla Sesión por validar | Métricas y Sala |
| Obra en vivo | Título y enlace Entrar con Google | Captura, bandeja y aprobaciones; sin escrituras de prueba |
| Carpeta de inversión | Acceso Google y error de carga detrás del acceso | Datos y presentación autenticada |

No se califica como fallo de autenticación que una pantalla privada pida iniciar sesión. Las diferencias de prompts/retorno se registran como hallazgos para contrastar con acceso válido; no justifican retirar protecciones.

## Verificación aislada

- Seis regresiones nuevas ejecutan funciones reales con DOM sintético: consulta/reapertura, Enter/cerrar/cero resultados, normalización, rol/códigos/mantenimiento, teclado de cabina y menú móvil.
- 19 pruebas focales de UI, navegación y permisos aprobadas.
- Suite completa: 1,388/1,388 aprobadas con `node --test --test-concurrency=1 tests/*.cjs`.
- La primera ejecución paralela tuvo un fallo temporal en `despacho-live.test.cjs`, ajeno a los archivos editados (`closing` frente a `idle`). Sus 69 pruebas pasaron al ejecutarlas solas. No se cambió voz para ocultar el fallo.
- Arquitectura y vistas sincronizadas; `verify-os`, `verify-portal`, `verify-accesos`, `verify-obra-app`, versiones y `git diff --check` aprobados.
- La matriz de accesos se contrastó con `potenciales-yod/main`; no se modificó.
- No se pudo abrir el servidor aislado desde el navegador remoto: conexión rechazada. La versión corregida aún no tiene comprobación visual en navegador ni en iPhone. Las pruebas sintéticas no sustituyen ese recorrido.

## Siguiente comprobación y reversión

Revisar el PR, validar visualmente su versión aislada, integrar lo autorizado y comprobar Pages con sesión válida en escritorio y móvil. Repetir búsqueda, navegación, cierre/retorno del foco y recarga en los consumidores; luego revisar controles específicos y persistencia mediante entornos de prueba autorizados.

Reversión: revertir el PR y regenerar vistas/versiones, preservando cambios concurrentes. No borrar sesiones, permisos, datos de clientes ni historial.
