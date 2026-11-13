# Parche 001: Terminal visible y Tareas amplias

Estado: preparado y verificado en un worktree aislado. Este paquete contiene el diff; aún no está aplicado al producto ni desplegado.

## Cambio concreto

- Agrega Terminal a la navegación principal de `Agents.tsx`, entre Tareas y Actividad. También permite abrirla mediante `CubefarmYOD.open('terminal')`, cuyo selector comprueba esa misma lista.
- Retira el acceso ambiguo «Diagnóstico» del pie y conserva atribución y regreso al Despacho.
- Amplía Tareas al mismo máximo de 1100 px que la terminal.
- Presenta cinco botones en móvil; a 360 px o menos la navegación se desplaza horizontalmente dentro de su contenedor.

El diff modifica solo `despacho-agents/Agents.tsx` y `despacho-agents/aurum.css`. No cambia contratos, ejecutor ni permisos. No agrega Kanban, QA o vista previa: son las entregas C–E.

## Aplicación en una rama de implementación

Base comprobada: `e1ae96e02efd4e6d45d77dfad14eefdc69d4a3ef`.

1. Leer instrucciones y modelo actuales. Registrar la implementación dentro de `CHG-DESPACHO-CAPACIDADES-001` y actualizar `architecture-impact.json` con componentes, pruebas y reversión antes de cambiar código. Consultar las reglas de impacto por ruta para incluir los componentes afectados. Regenerar vistas si se modifica el modelo.
2. Comparar el corte con la rama vigente. Desde la raíz del portal, comprobar y aplicar:

```sh
git apply --check docs/arquitectura/mejoras-oficina-cubefarm/patches/001-terminal-y-tareas.patch
git apply docs/arquitectura/mejoras-oficina-cubefarm/patches/001-terminal-y-tareas.patch
```

Si el primer comando falla, adaptar los hunks al código vigente y volver a revisar; no forzar su aplicación ni reemplazar archivos completos.

3. Preparar las dependencias del mismo upstream fijado por el repositorio, en una carpeta de trabajo elegida para esa dependencia:

```sh
git clone https://github.com/leonvanzyl/cubefarm.git /ruta/absoluta/cubefarm-reference
git -C /ruta/absoluta/cubefarm-reference checkout --detach 11237cf554f21312a2aecd9758d611f2817fc71e
npm --prefix /ruta/absoluta/cubefarm-reference ci --ignore-scripts --no-audit --no-fund
node despacho-agents/build.mjs /ruta/absoluta/cubefarm-reference
```

La ruta es un marcador: sustituirla por una carpeta absoluta real. El build genera `despacho3d/agents.js` y `despacho3d/agents.css`; incluir ambos en el PR. Conservar licencia y atribución. No editar manualmente el bundle minificado ni iniciar el servidor original para compilar este overlay.

4. Actualizar las versiones de carga `?v=` de `agents.js` y `agents.css` en `despacho3d/index.html` para evitar caché de la versión anterior. Incorporar la corrección de ayuda de la entrega A; comprobar el documento final.
5. Ejecutar los checks requeridos:

```sh
node scripts/arquitectura.cjs --check
node --test tests/*.cjs
node verify-os.cjs
node verify-portal.cjs
ACCESOS_REF=3ee8ca50bf14ef17d95e72523e54506eb996f262 node verify-accesos.cjs
node verify-obra-app.cjs
git diff --check
```

El commit de `ACCESOS_REF` es el usado en esta revisión; confirmar que sigue siendo el previsto para una integración posterior. En este entorno fue necesario anteponer `NODE_USE_ENV_PROXY=1` al check de accesos para que Node utilizara el proxy disponible. No es una nueva dependencia del producto.

6. Comprobar el impacto con la base real del PR, usando `node scripts/verificar-impacto.cjs --base <SHA_BASE_DEL_PR> --repo yodesarrollomx/yod-portal`. Revisar también Terminal, Tareas, cierre y foco en escritorio y móvil con el bundle recién compilado.
7. Entregar el PR de implementación con capturas sintéticas y resultados. Registrar publicación del frontend y conexión del runtime como comprobaciones separadas.

## Validación realizada

| Comprobación | Resultado |
| --- | --- |
| Build con dependencias Cubefarm `11237cf` | Correcto. |
| Suite existente, corte base | 255 pruebas aprobadas; 0 fallos. |
| Suite existente, parche aplicado y bundle reconstruido | 255 pruebas aprobadas; 0 fallos. |
| Modelo y vistas generadas del corte | Correctos: 78 componentes, 104 conexiones y 15 procesos. |
| Verificaciones OS, portal, accesos y obra | Correctas en el corte documental. |
| Navegador local, 1440×900 y 390×844 | Terminal en navegación; Tareas amplias; ninguna excepción de página. |
| Navegador local, 320×740 | Navegación desplazable; sin desbordamiento horizontal de la página. |
| API de apertura | `open('terminal')` muestra la pestaña Terminal. |

La inspección usó un servidor local y un padre de iframe sintético. Solo respondió a `resolveCurrent`, `read` y `readGoals`; bloqueó solicitudes externas. No se conectó un PTY del usuario, micrófono, backend de negocio ni proceso real de vista previa. Las 255 pruebas existentes no demuestran por sí solas las funcionalidades futuras.

## Reversión

En un PR que solo haya aplicado este parche, revertir su commit con los assets y versiones de carga correspondientes. Para un ensayo sin commit, `git apply -R --check` y después `git apply -R` sobre el mismo archivo revierten los fuentes si no hubo otros cambios; reconstruir entonces los assets y restaurar las versiones de carga. No borrar ni migrar registros del expediente: este parche no los modifica.
