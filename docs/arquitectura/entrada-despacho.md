# Paso 1: oficina → autón → puesto del PPP

Alcance D01–D05/D20: una entrada coherente al proyecto ya autorizado. La ficha de la oficina usa la selección vigente, su identidad y el observador de actividad existente. No crea otro catálogo, inicia objetivos ni activa el micrófono.

El botón Abrir puesto, el personaje, la computadora y el plano abren el PPP registrado en el mismo puesto. Volver al despacho conserva el tablero y sus borradores del mismo caso; cambiar de caso o perder acceso retira los datos anteriores. Las opciones radiales siguen dentro del puesto.

## Límites de esta entrega

- La API vigente expone el caso seleccionado. La oficina con varios autones simultáneos requiere un padrón autorizado; no se simula con proyectos reales inventados.
- No modifica fórmulas, permisos, tareas, voz, conectores JEV/Obsidian ni servidores.
- Las pruebas de navegador de selección, cambio de caso y PPP usan autorización y tablero sintéticos, sobre los archivos reales de la interfaz.
- Las capturas de Pages son de la oficina publicada sin sesión privada. No demuestran que un PPP privado cargue correctamente dentro de la sesión del propietario.

## Comprobación

`node --test tests/despacho-entrada.test.cjs`: rechazo de actividad tardía de otro caso, ausencia de acceso y estado sin ejecución.

`node scripts/probar-entrada-browser.cjs`: escritorio, móvil y sin WebGL; teclado, foco al volver, PPP compartido, borrador preservado, cambio de identidad y revocación sin micrófono.

`node scripts/probar-entrada-publicada.cjs`: publicación efectiva y capturas reales de Pages sin sesión.

La aceptación privada debe recorrer YOD OS → Despacho → Abrir puesto con el PPP real. No marcar aprobada esa aceptación con capturas sintéticas.

Reversión: revertir el PR del frontend. No hay migración ni escritura de datos de negocio.
