# Terminal en el puesto · 0.3.0

Actualización de una instalación local 0.2 existente. Node 22, Codex y su sesión,
keeper, workspace, enlace privado y checkpoint se conservan. El instalador usa la
última instantánea local validada para vincular el puesto; no contiene identidades
ni credenciales y no crea un agente nuevo al instalar. El archivo descargado se
comprueba con SHA-256 antes de extraerlo. Las dependencias fijadas no cambian.

En Agentes → Terminal, Conectar mi terminal abre una ventana de localhost. El
propietario concede el acceso desde esa ventana; origen, ventana, nonce y caso
deben coincidir. Un MessageChannel transmite pantalla, teclado manual, estado y
controles. No hay CORS global, túnel público, tokens en URL ni copia del login.
La ventana local debe permanecer abierta. Cerrar el panel conserva conexión y
proceso; volver a abrir recupera la pantalla. Cerrar/revocar el vínculo corta el
canal y limpia la vista, sin matar el proceso. Detener agente es explícito.

Una sola sesión: modo manual interactivo **o** motor de sala con Sheets. En modo
manual, Codex utiliza workspace-write y aprobación on-request existentes; no se
otorgan herramientas o accesos nuevos. Su salida no se registra automáticamente
como conversación de negocio. En modo sala, escribir desde Conversación; el
teclado de la terminal es de sólo lectura. Si un trabajo queda sin confirmar, se
conserva el bloqueo para revisar su recibo.

En otro dispositivo, localhost se refiere a ese dispositivo, no a la Chromebook.
No se anuncia acceso remoto a su terminal desde móvil. El chat en Sheets conserva
su transporte actual. Tareas, revisión independiente, entregas y voz siguen
necesitando conexión operativa; no se simulan con esta actualización.

El código genérico revisable está en `source/`; el binario empaquetado, en
`releases/0.3.0.tar.gz`. Reutiliza la terminal y keeper de Cubefarm, licencia MIT
adjunta. Los módulos del motor tienen pruebas en el repositorio privado; las
pruebas del puente cliente están en `tests/despacho-terminal-link.test.cjs`.

Reversión: restaurar el launcher `~/.local/bin/yod-terminal.before-puesto-0.3` y
reiniciar sólo el servidor con KillMode=process. Conservar keeper y todos los
datos de `~/.local/share/yod-terminal`; no borrar checkpoints ni reinstalar login.
