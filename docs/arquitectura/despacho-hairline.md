# Bandeja de fuentes del expediente · Hairline

CHG-DESPACHO-HAIRLINE-20261011. Implementación en rama; pendiente de PR e integración. No publicada en el Despacho.

Antes: Expediente lista artículos con enlaces. Después: los mismos documentos validados del caso alimentan una bandeja isométrica, una lista de selección accesible y un enlace explícito al documento. Hasta ocho fichas por página; no oculta fuentes adicionales. El cambio sirve a cualquier caso autorizado, sin nombres ni documentos privados en el código.

La selección usa puntero, toque o flechas. La apertura requiere el enlace explícito. No solicita datos adicionales ni escribe estados. El contrato actual sólo acredita título, rol y URL; no confirma lectura ni versión. `safeDocumentUrl` mantiene el allowlist existente. El cambio de proyecto y la revocación destruyen el dibujo y sus listeners; las respuestas tardías conservan la protección por generación del puesto.

Hairline MIT, commit a2217852fed6d1a4f20bc7d43d4fad1a3de117b8. Kernel local con export ESM; dibujo adaptado de Riffle para cantidad variable. No CDN en runtime. Licencia y procedencia en `despacho3d/vendor/hairline/`.

## Evidencia

- 630 pruebas Node del portal aprobadas.
- Arquitectura, OS, Portal, Obra y matriz de Accesos aprobados. Matriz contrastada con Potenciales ae6182744c692ddb9c2e3cc901241295aa241ed4; Node requiere NODE_USE_ENV_PROXY=1 en este entorno.
- `python3 tests/hairline-browser.py`: Chromium 1280 y 390; selección, teclado, apertura del ejemplo, paginación, vacío, reconstrucción, movimiento reducido y ausencia de errores. Iniciar antes `python3 -m http.server 8787 --bind 127.0.0.1` desde la raíz. Dependencias: Python Playwright y Chromium en /usr/bin/chromium.
- `demos/hairline/` es sólo demostración sintética. No acredita fuentes privadas ni aceptación real del usuario. Las aperturas de la demo se interceptan para mostrar contenido ficticio local; la vista operativa usa el enlace autorizado.

Reversión: revertir el PR para restaurar la lista; no cambia datos, ACL, motor ni permisos.
