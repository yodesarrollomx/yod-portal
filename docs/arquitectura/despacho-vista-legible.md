# Despacho · Vista accesible y alternativa sin WebGL

Propuesta CHG-DESPACHO-VISTA-LEGIBLE-064. Dirección solicita una oficina que un agente pueda leer y operar, además de verla como recorrido 3D. Implementada en rama; publicación y aceptación visual pendientes.

## Comportamiento

- `office-boot.mjs` intenta el recorrido 3D. Si no puede iniciarlo, activa un plano DOM/SVG navegable, sin GPU. No cambia la autenticación ni el acceso DP.
- «Plano y estado» abre la misma vista desde el recorrido 3D. La capa incluye nombres, controles con etiquetas, ubicación de la vista, posición del agente, destino y movimiento. La vista se puede desplazar en móvil.
- `office-layout.mjs` contiene los lugares compartidos y los obstáculos de navegación. Las pruebas comparan sus límites y cada obstáculo con `createOffice` de `scene.js`, para impedir una discrepancia silenciosa entre plano y 3D.
- La alternativa utiliza el mismo `createOfficePilot` y `crearAgenteIr`: A*, posiciones y velocidad del piloto. El marcador representa su posición real en el modelo local, no una respuesta simulada del motor de negocio.
- Los controles del agente requieren el perfil vigente autorizado por el panel existente. Sin perfil no hay agente ni movimiento. Retirarlo cancela la ruta y borra identidad y coordenadas del DOM.
- La llegada se confirma al finalizar la ruta; la orden aceptada solo dice «En camino». Una ruta reemplazada o cancelada no produce una llegada.
- Entorno registra visitas del agente con `yod-agent-arrived`, después de llegar. Las visitas de la vista requieren que `visit` retorne `true` y que el perfil siga siendo el mismo. El registro continúa en memoria de sesión.
- Moverse no ejecuta herramientas, envía comunicaciones ni confirma aprobaciones. Los seis espacios aún sin lugar continúan por construir.

## Contrato local observable

El contrato anterior `window.despacho` conserva `visit`, `setMode`, `openPanel`, `closeSheets`, `allowed` y `agenteIr`. `visit` devuelve una promesa booleana: `false` para destino inválido o transición cancelada; `true` cuando la vista ya cambió.

Se añaden `view` (`3d` o `map`), `layout` y `getAgentState()`: `place`, `destination`, `motion`, `position`. `place` es la última llegada confirmada, `destination` la ruta actual y `position` un par de coordenadas x,z. Sin perfil son nulos. El DOM visible usa atributos geométricos `data-renderer`, `data-selected`, `data-agent-motion`, `data-agent-place`, `data-agent-destination` y texto legible. No contiene credenciales ni exporta datos por mensajes entre ventanas.

`yod-agent-arrived` es un evento local con `{lugar}` del catálogo. Se emite al finalizar el piloto; no representa una aprobación de negocio ni persiste fuera de la sesión. No se añadió una API remota ni una ruta de escritura.

## Verificación

Pruebas aisladas: igualdad geométrica con escena real, rutas sin atravesar obstáculos, pausa, llegada única, reemplazo de ruta, cancelación al retirar perfil, movimiento reducido y componente DOM sin GPU con caso sintético. Suite y verificadores del portal requeridos por AGENTS.md.

La prueba DOM aislada no sustituye capturas reales en navegador. El navegador de revisión no permite HTTP local ni archivos locales. Pendiente tras publicar por HTTPS:

1. Captura inicial con WebGL deshabilitado: plano y aviso de alternativa; no foto de error.
2. Cargar perfil mediante Agentes; capturar nombre autorizado y estado inicial.
3. «Enviar agente a Sala de juntas»: capturar «En camino» con coordenadas intermedias.
4. Capturar llegada, marcador final y visita en Entorno. Abrir juntas y leer entregas sin aprobar.
5. Repetir Biblioteca, Edición y regreso al puesto; retirar perfil y comprobar desaparición del marcador/controles.
6. En navegador con WebGL, comprobar recorrido y alternancia con plano, y probar tamaños móvil/escritorio. Una captura de escritorio no certifica iPhone.

Cada captura se acompaña de acción, resultado esperado, resultado observado y pendiente. No adjuntar capturas privadas al repositorio público.

## Reversión

`despacho3d/office-config.mjs`: `OFICINA_LEGIBLE=false` desactiva la nueva vista y la alternativa. Para revertir también el contrato de llegada, revertir el PR completo. Conservar los interruptores de Entorno, agente y juntas.
