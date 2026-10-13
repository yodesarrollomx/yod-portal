# Mesa compartida y navegación constante

Propuesta autorizada el 12 de octubre de 2026. Registro UTC: 2026-10-13T00:49:44Z. Horario del despacho: Hermosillo, UTC−7.

[Mockup navegable](../../os/agent-preview.html) · [Fuente única de navegación](../../os/catalogo.js) · [Control compartido existente](../../os/ui-chrome.js).

## Recorrido propuesto

1. El logo YOD OS abre el inicio. La navegación global no agrega otro botón Inicio.
2. El control ya existente contrae la barra a iconos y conserva su preferencia entre la cabina y los tableros envueltos por shell.js. En móvil conserva el cajón existente.
3. Orden global: El Despacho → PPP → Codesarrollos → MOAC → Flujo → AURUM → Masterbrokers → Embudo comercial → Obra en vivo → Personas y accesos, sólo para Dirección. Se conserva la subsecuencia de los accesos permitidos.
4. Miramar permanece dentro de Codesarrollos. Si la sesión sólo puede entrar a Miramar, o el padre está apagado, el hijo mantiene su entrada.
5. El puesto muestra una sola identidad del autón, su resultado esperado y siguiente decisión. El PPP abre por defecto, con tarjetas cerradas y detalle al seleccionarlas; la conversación permanece al lado. Voz, interrupción y texto se reúnen abajo de esa conversación.
6. Trabajo, archivos, notas, presentación e historial siguen disponibles en una sola navegación contextual. Trabajo reúne ahora, bloqueo y resultado por revisar; no se inventa un porcentaje de avance.

## Qué se aplica y qué se propone

La navegación común se corrige en app.js, shell.js e index.html. Orden y relaciones se generan desde os/catalogo.js mediante scripts/catalogo.cjs; no se crea otra implementación del control de barra. La deduplicación no añade módulos ni permisos, y los filtros de sesión se mantienen antes de pintar.

El puesto del autón es una **maqueta visual navegable** con datos sintéticos, no una sustitución ya publicada de su interfaz privada. Cambiar Gastón, Luis o Ruiseñor limpia la conversación y muestra el expediente de ejemplo correspondiente. No consulta hojas, no usa el micrófono, no envía mensajes ni actualiza documentos. Un icono de escucha en la maqueta no acredita la voz real. El rediseño conservará los contratos actuales antes de integrarse al puesto real.

## Antes y después de la navegación

- Antes: Inicio aparece en varias acciones; el logo raíz apunta a la web corporativa; cada marco combina el orden de su fuente y sus respaldos.
- Después: logo hacia Inicio, catálogo técnico como orden estable, IDs únicos y mismo tratamiento de proyectos hijos. La entrada Personas y accesos conserva la restricción administrativa.
- Motivo: reconocer dónde ir sin volver a interpretar el menú cada vez que cambia la pantalla y dejar más espacio para el PPP.

## Verificación y reversión

El PR debe pasar los verificadores de catálogo, atlas, contratos, accesos, portal y Obra. Las pruebas con datos de ejemplo son diagnóstico de presentación y no aceptan operación autónoma ni integraciones de negocio.

Revertir el PR restaura la navegación anterior sin cambiar sesiones, permisos, expedientes, hojas o implementaciones. La maqueta puede retirarse de forma independiente.
