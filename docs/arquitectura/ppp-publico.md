# PPP público · Prueba tu proyecto

Petición de Dirección: una experiencia para campaña, sin terminal, que permita explorar rangos en un único escenario propio y enviar una copia para comparar. La decisión inicial está registrada en Buzón antes de construir; este recibo documenta la implementación independiente y no afirma una integración automática con todos los libros.

## Entrada y alcance

[Explorador público](https://yod-prueba-tu-proyecto.sayri-fraijo.chatgpt.site/) · [Dirección](https://yod-prueba-tu-proyecto.sayri-fraijo.chatgpt.site/direccion).

El ejemplo inicial es ficticio. No se publicaron expedientes reales. La interfaz permite explorar sin cuenta, comparar y ver deuda mensual; en móvil el resultado permanece visible mientras se mueven variables. Guardar y enviar requieren identidad ChatGPT. Un caso importado permanece privado hasta que Dirección revise y confirme qué datos numéricos se harán públicos.

No equivale a abrir los libros PPP2 ni a dar rol de editor PT. El único motor adaptado es **VERTICAL clásico**, exportación `potenciales-yod/vertical/v1`, 81 entradas. Dirección puede importar un caso, definir límites, publicarlo/pausarlo y exportar una propuesta para decisión posterior. No hay escritura en planes oficiales ni aprobación automática.

## Fuente y cálculo

Origen: `yodesarrollomx/potenciales-yod`, `mixto.html`, commit `7cc06435dfea4d0ffa4b6e2de181b0f576200dca`. SHA256 del bloque numérico: `b9ff487b2eb9ec3174820853350a7d13c2125cd534aae0853f3044972c2cc695`.

Se conserva el bloque original y las relaciones de entradas; un generador verifica huellas y produce ESM estático. Nueve asignaciones implícitas del bloque legacy quedan locales a cada llamada. No se reescribieron fórmulas ni se usa eval en runtime. Cliente y servidor calculan con la misma versión fijada; todo guardado se recalcula en servidor. Las cifras nunca dependen de resultados enviados por el visitante.

Rangos del ejemplo: precio de vivienda 35–55 mil MXN/m²; construcción sobre rasante 15–23 mil MXN/m²; obra 14–30 meses; capital disponible 0–20 millones MXN. El capital utilizado es distinto del máximo disponible. Las alertas incluyen faltantes de fondeo en meses intermedios, no sólo saldo final.

## Identidad y persistencia

Sites valida identidad y entrega ID estable por sitio. D1 conserva campañas, un escenario por ID/caso, eventos idempotentes y entregas fijas. Dirección se determina con correo verificado y secreto de runtime, nunca por un campo del navegador. Login no concede permisos de propietario.

El servidor exige rangos, campos permitidos, versión de motor, revisión vigente y UUID por operación. Los cambios, eventos y envíos se agrupan atómicamente. Reabrir un borrador no modifica entregas anteriores. La persona puede borrar su propio escenario, eventos y envíos. El dueño compara base, cambios y resultados y registra una nota privada; no hay correos automáticos.

La base pública comparte los 81 supuestos numéricos sólo tras confirmación explícita de Dirección. Contactos y escenarios permanecen privados. La cola muestra los 100 envíos más recientes y contadores totales. Cambiar una base requiere un caso nuevo en esta versión.

## MCP

El endpoint `/mcp` usa el mismo servicio: leer caso, simular, leer/guardar escenario propio, enviar revisión y bandeja exclusiva de Dirección. Sites aplica OAuth/identidad; el backend mantiene autorización por operación. El plugin generado figura instalado según la plataforma, pero sus herramientas no aparecieron en esta conversación. Esto no acredita conexión en Hermes, Claude ni Codex personales; el visitante web no necesita instalarlo.

## Publicación y evidencia

Fuente Site `38bdf10e4d7c8bc2c92c8ab19f31ec0e2a7b2e9e`; versión1; despliegue `appgdep_6afa455f2c08819193a98cdeb1537eef`, succeeded 2026-11-15T23:51:07Z. Audiencia pública; entorno revisión1. El código fuente permanece en el repositorio privado del Site. La bitácora privada conserva IDs operativos.

Pruebas locales: paridad de todos los resultados nativos en168 escenarios;10 pruebas funcionales con migración SQLite real; comprobación TypeScript y build. Navegador: escritorio y ancho390px, sliders, comparación, restauración de borrador local y rechazo de Dirección sin sesión. Además, con identidad ficticia en entorno local y D1 real se recorrieron guardar → enviar → recepción en Dirección → comparación → nota privada y estado revisado. El fixture de identidad se retiró y se comprobó que la fuente del Site vuelve a coincidir con el commit publicado. En producción: carga anónima, bloqueo de Dirección sin cuenta y navegación al login observadas. La entrada con una cuenta externa y el guardado en producción requieren aceptación separada; no se inventa ese acuse.

No hubo publicidad pagada, correos, invitaciones a terceros ni publicación de datos privados. No cambian Portero, Sheets, Apps Script, fórmulas, Kanban ni procesos de Hermes. Reversión: pausar campañas o limitar audiencia conservando la base de escenarios.
