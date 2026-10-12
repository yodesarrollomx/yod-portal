# YOD OS · marca, navegación y movimiento

Petición del propietario del 12-oct-2026: reinterpretar la identidad corporativa en la barra lateral, plegarla a iconos y extender el lenguaje a otros puntos del portal. La elección Aurum A (Galería de modelos) queda confirmada en la misma conversación.

## Base visual y alcance

Se inspeccionaron los archivos oficiales `marca/yod-oscuro.png`, `marca/yod-claro.png` y `marca/yod-mono-oscuro.png`, además del catálogo canónico y estilos existentes. La web corporativa rechazó la lectura automatizada con HTTP406; no se afirma una revisión completa de su versión actual. No se redibuja ni reemplaza el logotipo: se usan sus activos originales.

Marfil, carbón y dorado se conservan. Tras el rechazo explícito del propietario a los dibujos y movimientos iniciales, se sustituyen los pictogramas planos por motores isométricos originales de Hairline, sin modificar el proveedor. La barra conserva figuras de 40×36px; las tarjetas amplían el objeto a112×90px. El puntero sobre todo el control manipula la geometría de cada objeto y el foco de teclado selecciona una pose; al salir regresa al reposo. No hay saltito CSS compartido ni reproducción automática.

| Superficie | Cambio implementado |
|---|---|
| Barra principal | 268px expandida y 80px compacta, control superior, preferencia local, etiquetas con puntero/teclado |
| Marco compartido de tableros | Mismo control y marca; conserva contenido y navegación de cada tablero |
| Móvil | Conserva el cajón y añade cierre desde su cabecera; textos completos |
| Tarjetas de tableros | Misma familia de iconos y respuesta de movimiento |
| Accesos rápidos | Pictogramas y ritmo compartidos |
| Pulso y embudo | Iconos de cabecera, edición, métricas y plan; cifras intactas |
| Buscador | Lupa coherente, conserva interacción existente |
| Museo del Despacho | Galería de modelos elegida, sobre tarjeta existente; conserva estado operativo |

## Contratos y accesibilidad

`ui-chrome.js/css` es una capa visual compartida, sin fetch ni llamadas de negocio. No genera opciones autorizadas: decora las ya creadas por el catálogo. Conserva IDs, URLs, handlers, hidden, aria-disabled, permisos y datos. SVG decorativos sin foco, nombre accesible estable, tooltip sin HTML de usuario. `prefers-reduced-motion` elimina transiciones; el ajuste local `yod_os_sidebar_v1` guarda exclusivamente expanded/compact. Cambiar ancho no recrea el iframe ni pierde formularios.

El script del marco compartido carga el módulo visual desde su propio origen. Los tableros que usan una copia antigua independiente del marco requieren actualizar esa copia por separado. No se modifican repositorios de tableros ni cálculos financieros.

`os/design-preview.html` es una muestra pública sin credenciales ni datos reales, basada en el catálogo público. No es una sesión operativa.

## Verificación y reversión

633 pruebas Node; Arquitectura, OS, Portal, Accesos y Obra aprobados. `tests/os-chrome-browser.py` verifica marca, 12 accesos, tarjetas, persistencia, tooltip, teclado, acceso deshabilitado sin URL, ancho950, móvil, movimiento reducido y contenido/iframe retenido. Todo con red de negocio bloqueada y datos sintéticos. Ejecución: servidor estático en la raíz y `YOD_TEST_BASE=http://127.0.0.1:8787 python3 tests/os-chrome-browser.py` (Playwright/Chromium).

Revertir el PR, o retirar las cargas de `ui-chrome.js/css`, devuelve el marco anterior. Las identidades, permisos, catálogo y datos no necesitan migración. Integración y publicación se acreditan por separado con el PR y Pages.

## Corrección de dibujos y movimiento

`os/ui-figures.mjs` usa los motores ya versionados en `despacho3d/vendor/hairline/src/` (MIT). `npx esbuild os/ui-figures.mjs --bundle --format=esm --minify --outfile=os/ui-figures.bundle.mjs` genera el módulo de57.3KB; carga diferida desde el marco existente. El color adapta los objetos a la marca; son figuras existentes de Hairline, no un nuevo logotipo ni dibujos corporativos originales.

PPP usa terreno; Despacho, archivador; Codesarrollos, hitos; MOAC, casilleros; Flujo, bóveda; Obra, elevador entre plantas; AURUM, capas; Miramar, volúmenes giratorios; Embudo, tamices; presentación, gráfico; personas/inicio, conexiones; buscador, lupa. Los significados son decorativos y no comunican progreso operativo.

El adaptador envía coordenadas del puntero al motor, sin reproducir tours en bucle. Conserva la implementación original de springs/tweens y su suspensión fuera de pantalla. Impide nuevas respuestas bajo movimiento reducido o controles deshabilitados, devuelve al reposo al ocultar la página, y destruye las figuras de elementos retirados. Nunca incorpora controles de foco dentro de enlaces; los nombres accesibles siguen siendo los del catálogo. Una falla al cargar el módulo vuelve al icono de respaldo.

Verificación de la revisión:633 pruebas Node y verificadores requeridos aprobados. Chromium comprueba además cambios reales de geometría en PPP/Despacho/MOAC/Obra, reposo estable sin bucle, ausencia de respuesta bajo movimiento reducido e iconos visibles en barra compacta. Capturas inspeccionadas en escritorio expandido/compacto y móvil; revisión con datos sintéticos, sin acreditar una sesión autenticada. La aceptación estética por el propietario sigue pendiente.
