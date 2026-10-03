# Personajes del despacho · v3

Módulo de figuras caricaturescas para instalar en la oficina existente. Añade once familias con rostro expresivo, cabello, prendas, accesorios y articulación; conserva los identificadores del expediente durante cambios visuales. No cambia el agente, transporte, memoria ni permisos ya implementados.

**Entrega:** código preparado para integración; aún no montado en `office.js` ni verificado en producción. El piloto de conversación/memoria existente conserva su estado descrito en `docs/arquitectura/despacho-capacidades.md`.

## Archivos

- `avatar.mjs`: `createAvatar`, `animateAvatar`, `disposeAvatar`, `FORMS`, `AVATAR_VERSION`.
- `identity.mjs`: alias explícitos, detección de conflictos y migración de estado local con archivo de datos anteriores.
- `adapter.mjs`: capa visual de perfiles autorizados, selección canónica, movimiento, cambio de apariencia y revocación.
- `demo.html`: muestra sintética de las once familias. Abrir mediante servidor local en la raíz del repo. Importa la misma versión vendorizada de Three que usa el despacho.
- `tests/despacho-avatars.test.cjs`: identidad, memoria, geometría, animaciones, revocación y selección.

Los perfiles reales, sus alias, fuentes y propuestas de aspecto se entregan en un paquete privado fuera de este repositorio público. No copiar a `despacho3d/`, fixtures ni issues una exportación del padrón. La representación mitológica es fantasía original, no reconstrucción histórica ni retrato de personas reales.

## Contrato del perfil privado

```js
{
  id: 'EXAMPLE-CASE-A',                 // canónico, estable y autorizado
  case_id: 'EXAMPLE-CASE-A',            // sólo si es un expediente
  entity_kind: 'case',                 // case/person/organization/tool
  name: 'Proyecto de ejemplo',
  form: 'robot', color: '#568a87',
  visual: {
    hairStyle: 'swept', skin: '#dcaa85', hair: '#30272b',
    accent: '#f1d9a5', glasses: false, beard: false,
    myth: 'guardian', role: 'studio'
  },
  placement: {position: [6.65, 0, -4.42], rotationY: 0, visible: true}
}
```

Formas: `child`, `child_female`, `young_female`, `young_male`, `woman`, `man`, `robot`, `spirit`, `deity`, `tool`, `visitor`. La etapa comercial nunca se deduce de la forma. Un cambio a robot no constituye un codesarrollo.

Cabello: `swept/bob/waves/bun/curly/crop`. Accesorios: `messenger/architect/site/legal/finance/studio`; las herramientas tienen sobre o tablilla. Animaciones: `idle/walk/sit/talk/wave/deliver`. La locomoción y las colisiones siguen siendo responsabilidad de la oficina.

## Instalación por el agente del despacho

1. Mantener el import map `three` existente. Importar `createAvatarLayer` en el código fuente de la oficina; no editar el bundle minificado de agentes.
2. Obtener los perfiles y alias del backend privado después de autenticar y autorizar. Conservar los IDs del padrón y el ID de expediente; los nombres y alias de conversación no son credenciales.
3. Crear la capa y montar perfiles ya autorizados. Reemplazar sólo la figura provisional correspondiente. Mantener mesa, colisiones y panel de expediente. Para varios personajes, asignar posiciones con la navegación existente.
4. Conectar la selección al panel existente. **`CTR-DESPACHO-CONVERSACION` usa `resolveCurrent` sin selector:** no pasar un `case_id` arbitrario desde el navegador ni asumir que seleccionar una figura concede acceso. Para el piloto, abrir el panel únicamente para el caso resuelto por el servidor. Para ampliar a múltiples agentes, implementar y probar primero la resolución y autorización del servidor.
5. Llamar `update` en el bucle de dibujo existente, sólo cuando éste dibuje. Respetar suspensión por overlay `yod-agents-visibility`, pestaña oculta y movimiento reducido. No abrir un segundo renderer/bucle para la oficina.
6. Las notificaciones sólo disparan `deliver` después de un evento confirmado por el transporte real. La animación no envía mensajes ni escribe recuerdos. Registrar la memoria una vez, con el identificador del evento y autorización del receptor.
7. En cierre/revocación, llamar `replaceAuthorizedProfiles([])` o `clear()`. La capa elimina geometrías, materiales, metadatos y selección. No conservar historias en esta capa gráfica.

```js
import {createAvatarLayer} from './avatars/adapter.mjs';
const avatars = createAvatarLayer({scene, onSelect(selection) {
  // Resolver/validar selection en el flujo autorizado de la oficina.
  // Abrir el panel existente sólo para el expediente autorizado.
}});
avatars.replaceAuthorizedProfiles(authorizedProfiles, confirmedAliases);
avatars.setMotion(authorizedProfiles[0].id, 'idle');
// En el render loop existente:
avatars.update(elapsedSeconds, {reducedMotion});
// En el raycast existente (recursive=true):
avatars.selectIntersection(raycaster.intersectObjects(avatars.pickables(), true)[0]);
```

La v3 es procedural y editable. Calidad `office` reduce segmentos respecto al estudio; instanciar sólo habitantes autorizados y necesarios, ocultar o descargar pisos no visibles. No se ha certificado un objetivo de FPS para el dispositivo final ni equivalencia técnica a una consola. El siguiente paso de optimización es agrupar geometría/materiales de partes estáticas tras medir en la oficina real, sin perder articulaciones ni selección.

## Aceptación y reversión

Verificar un caso autorizado y uno denegado; alias que abre el mismo expediente; casos independientes sin mezcla (en pruebas privadas); selección por malla; cambio visual que preserva recuerdos; consulta sentada; entrega confirmada sin doble memoria; móvil; revocación; ausencia de datos privados en assets públicos. Registrar por separado PR integrado, despliegue frontend y prueba del backend.

Reversión: desmontar la capa y recuperar la figura provisional anterior. Conservar IDs y registros privados. `migrateLocalState` conserva una copia por alias en `identityArchive`, pero sólo migra la maqueta local: una migración real del servidor necesita transacción y respaldo propios.
