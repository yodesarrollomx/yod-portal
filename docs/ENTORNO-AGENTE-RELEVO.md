# Relevo del entorno del agente y la versión de oficina (El Despacho 3D)

Documento para el siguiente agente o persona que continúe este trabajo. Está en un repositorio **público**: aquí no van datos de clientes, contactos, llaves ni identificadores reales. Última actualización: 2026-10-04.

## 1. Qué se pidió y en qué orden

Dirección pidió dos cosas: el **entorno del agente** (Gastón, el agente de cada expediente, se mueve entre espacios y cada espacio es una herramienta con su permiso y su registro de visitas) y la **versión de oficina** (el Despacho 3D como lugar de trabajo). El plan por bloques vive en el documento «15 · punto 13» del Drive de Dirección; resumen:

| Bloque | Contenido | Estado |
|---|---|---|
| A | Cerrar lo iniciado (PR #64 de consultas PPP/uso de suelo, meta real) | Fuera de alcance por ahora: Dirección pidió dejar de hablar de metas. PR #64 no se mezcla sin su visto bueno |
| B | Círculo de seis sectores | Hecho y publicado **apagado** (PR #69, #70, #71) |
| C1 | Base del entorno: 9 espacios, permisos, registro de visitas | Hecho, **encendido** (PR #72, #74) |
| C2 | La figura del agente camina entre espacios | Hecho, **encendido** (PR #73, #74) |
| D1 | Sala de juntas: «Ver entregas por aprobar» (solo lectura) | Hecho, **encendido** (PR #75 y el PR que añade este documento) |
| D2 | Centro de comunicación: WhatsApp y Gmail | **Pendiente** (ver §6) |
| E | Biblioteca (NotebookLM), sala de navegación, suite de Drive | Pendiente |
| F | Sala de edición y embudo comercial, oficina de Dirección, salón de usos múltiples, museo de maquetas | Pendiente |
| G | Voz en tiempo real y ampliación de la biblioteca | Pendiente |

Orden fijado por Dirección: cada función detrás de un interruptor, observar primero (solo lectura), y después la «versión de oficina».

## 2. Interruptores y dónde apagar cada cosa

Todo se apaga cambiando **una línea** y entregando un PR (o revirtiendo el PR correspondiente).

`despacho3d/entorno-config.mjs`

- `ENTORNO_ACTIVO` (hoy **true**): botón y hoja «Entorno» en el Despacho. Solo aparece con un perfil autorizado por el servidor. Apagar: `false`.
- `ENTORNO_AGENTE_CAMINA` (hoy **true**): botones «Enviar al agente» y «Que el agente vuelva a su lugar». Apagar: `false`.
- `ENTORNO_JUNTAS` (hoy **true**): «Ver entregas por aprobar» en la sala de juntas. Apagar: `false`.

`despacho3d/circulo-config.mjs` (círculo de seis sectores, **apagado**)

- `CIRCULO_ACTIVO` (false) y `CIRCULO_PENDIENTES_REALES` (false). Vista previa: `?circulo=1&pendientes=1`. Encenderlos solo con visto bueno de Dirección.

Vistas previas aunque el interruptor esté apagado (siempre con perfil autorizado): `?entorno=1`, `&camina=1`, `&juntas=1`.

Aviso: el botón «Entorno» aparece cuando el panel de Agentes ya cargó el perfil del caso (abrir «Agentes» una vez y esperar «Cargando expediente…»; tarda hasta ~30 s en frío).

## 3. Arquitectura del código (despacho3d/)

- `entorno.mjs`: catálogo `ESPACIOS` (9 espacios; cada uno con `lugar` = lugar existente del Despacho o `null` = por construir, `permiso`, `tope`, `etapa`), `PERMISOS`, `puedeActuar` (hoy nada concede más que «observar»), `crearRegistro` (visitas **en memoria** de la sesión), `crearEntorno` (hoja) y `montarEntorno` (botón, gating por perfil, vista previa por URL).
- `entorno-ruta.mjs`: `puestoDe(lugar)`, `rutaEntre(a,b,permitido,limites)` (cuadrícula + A* + suavizado verificado con la misma función `allowed` de colisiones que usa la persona al caminar) y `crearAgenteIr`.
- `avatars/office-pilot.mjs`: la figura del agente (posición inicial fija, no la puede fijar ningún expediente). Añade `recorrer`, `posicion`, `inicio`. Animación a 15 cuadros, se pausa con overlay, pestaña oculta o movimiento reducido.
- `office.js`: expone `window.despacho.agenteIr` solo si el interruptor o `?camina=1`.
- `circulo*.mjs`: círculo; `circulo-pendientes.mjs` lee metas con `readGoals` (solo lectura) y clasifica tarjetas; la sala de juntas lo reutiliza.
- Pruebas: `tests/despacho-entorno.test.cjs`, `tests/despacho-entorno-ruta.test.cjs` (incluye una prueba con los muebles reales de `scene.js`), `tests/despacho-circulo*.test.cjs`.
- Propuestas registradas: CHG-DESPACHO-CIRCULO-056/057/058, CHG-DESPACHO-ENTORNO-059, -MOVIMIENTO-060, -ENCENDIDO-061, -JUNTAS-062 y la de encendido de juntas (063).

## 4. Reglas que no se negocian

1. Repositorio público: nada de datos reales de clientes, contactos, llaves o exportaciones. Los nombres del caso llegan del perfil que autoriza el servidor, nunca del repo. La prueba `tests/despacho-public-assets.test.cjs` lo vigila.
2. **WhatsApp y Gmail**: las pruebas salen **solo al número/correo de Dirección y con su confirmación en el chat**. Borrador primero; nada sale sin visto bueno. Contactos solo autorizados.
3. El acceso al Despacho lo controla la matriz de Accesos (código DP); solo Dirección concede acceso. «Seleccionar una figura» nunca concede acceso.
4. Cada cambio de motor o portal termina con un clic de Dirección. En esta sesión Dirección delegó el merge para PR **con interruptor apagado y checks verdes**, y pidió expresamente encender el entorno, el movimiento y la sala de juntas. Para cualquier otra cosa, preguntar antes de mezclar.
5. Fuera de la lista por ahora: agente animal temporal, Ruiseñor, Casa Alysa.
6. No volver a hablar de «metas duraderas» (reanudar la meta detenida, tarjetas de Jev en metas) salvo que Dirección lo pida.
7. El auto-despliegue de Render está apagado. La rotación de la llave de TypeSafe está pospuesta (hay un recordatorio programado).

## 5. Método de entrega (probado en esta sesión)

Este repositorio protege `main`: hace falta PR con los checks «Arquitectura YOD» y «Verificar YOD OS / verificar».

1. Sincronizar: `git fetch origin && git checkout main && git merge --ff-only origin/main`.
2. Implementar con interruptor apagado (o encendido solo si Dirección lo pidió) y pruebas nuevas.
3. Registrar la propuesta en `docs/arquitectura/modelo.json` (subir `revision`, añadir un cambio en `changes[]` con `id`, `components`, `proposal`, `status:"propuesto"`, `approval`, `tests`, `deployment`, `rollback`) y actualizar `architecture-impact.json` con la misma revisión. Formato del JSON: `json.dumps(..., ensure_ascii=False, indent=2) + "\n"`.
4. **Cada archivo de prueba nuevo necesita su entrada en `path_ownership`** de `modelo.json` (`prefix` = ruta del archivo, `components` = `SYS-YOD-OS` y `SYS-DESPACHO`); si no, el check falla con «falta declarar impacto en SYS-TRACK».
5. Regenerar vistas: `node scripts/arquitectura.cjs` y luego `--check`.
6. Verificar: `node --test tests/*.cjs`, `node verify-os.cjs`, `node verify-portal.cjs`, `node verify-accesos.cjs`, `node verify-obra-app.cjs`, `git diff --check`, y **con el repo**: `BASE_SHA=<origin/main> HEAD_SHA=<HEAD> node scripts/verificar-impacto.cjs --repo yodesarrollomx/yod-portal` (sin `--repo` no revisa propietarios y da falsos verdes).
7. Subir y abrir PR. Si no hay credenciales de `git push`/`gh`, se usa la subida web de GitHub (`/upload/<rama>/<carpeta>`) archivo por archivo en tandas por carpeta, comentario de commit y «Create a new branch» la primera vez. **Esperar ~20 s tras adjuntar `docs/arquitectura/*` antes de confirmar** (si se confirma pronto el commit puede quedar vacío) y comprobar en la comparación que el PR trae todos los archivos esperados.
8. Esperar los dos checks en verde (~1 min). Mezclar con «Merge pull request» → «Confirm merge» solo si Dirección lo autorizó.
9. Pages despliega desde `main` en 1–2 min. Los módulos importados sin versión pueden quedar en caché: subir `?v=` en `index.html` y en los `import` cuando cambie un módulo.
10. Probar en vivo: abrir `https://yodesarrollomx.github.io/yod-portal/os/#/despacho` con la sesión de Dirección (el panel público de Agentes no puede chatear).

Pruebas locales con navegador: servidor `python3 -m http.server`, Playwright con Chromium (`--use-gl=swiftshader`) y un `window.CubefarmYOD` simulado definido con `Object.defineProperty` (para que `agents.js` no lo sobrescriba). **No usar `pkill -f http.server` en el entorno de trabajo: mata la terminal.**

## 6. Lo que sigue (en orden)

**D2 · Centro de comunicación (WhatsApp y Gmail).** Hoy es «por construir». Antes de código, decidir con Dirección **dónde vive un borrador**: lo más coherente con el sistema es la cola del Portero (Sheets / Apps Script) con estado `borrador → aprobado → enviado`, un registro de cada intento y el contacto validado contra la lista autorizada. Primera entrega: solo crear y mostrar borradores (nada sale). Segunda: envío de prueba **solo al número de Dirección y con su confirmación**. Después: aviso desde la sala de juntas cuando hay algo por aprobar («avisa y presenta»).

**E · Información.** Biblioteca (NotebookLM; por verificar si solo puede abrirse, no consultarse), sala de navegación (pantallas que muestran lo que consulta el agente: reutilizar el registro de visitas y mostrar solo fuentes), suite de Drive (crear documentos/presentaciones/hojas; empezar solo con borradores en una carpeta propia). Cada una necesita un lugar en `office.js` (`places`) y en `scene.js`; hoy solo existen el lugar de decisiones, la sala de encuentro y la sala de edición.

**F · Negocio.** Sala de edición con el embudo comercial de YOD OS (el lugar ya existe), oficina de Dirección (control, datos, programaciones, clientes), salón de usos múltiples, museo de maquetas de Aurum (recorrido y cuestionario). Los cuatro empiezan en solo lectura.

**G · Voz y biblioteca ampliada.** Hay `conversation-voice.mjs` (dictado con el servicio de voz del navegador); la voz en tiempo real es una etapa propia.

**Registro de visitas persistente.** Hoy el registro vive en memoria de la sesión. El paso natural es escribirlo en Sheets por el Portero (una fila por visita: espacio, quién, motivo, hora), con propuesta de arquitectura y contrato de datos nuevos.

**Subir permisos por espacio.** Hoy todo está en «observar». Subir a «borrador» o «acción» es una etapa aparte por espacio, autorizada por Dirección y reflejada en la matriz de Accesos.

**Personajes y cuarto de cada herramienta.** El plan de personajes (niño→joven para PPP, adulto para obra, robot para codesarrollo, equipo como dioses mitológicos, herramientas como agentes vivos con su oficina) está en el mismo documento del Drive; el módulo `avatars/` ya soporta once formas.

## 7. Cómo se ve que está bien

- La hoja «Entorno» lista 9 espacios, cada uno con «Solo observar».
- «Enviar al agente» lleva la figura a su mesa sin atravesar muebles y deja una visita del agente en la bitácora.
- «Ver entregas por aprobar» muestra solo tarjetas «por aprobar» y «por decidir» y dice que la aprobación se hace en YOD OS; no escribe nada.
- `node --test tests/*.cjs` y los dos checks del PR en verde.


## 8. Vista legible para agentes · publicada

Dirección pidió que el agente pueda observar y operar la sala aunque WebGL no esté disponible. CHG-DESPACHO-VISTA-LEGIBLE-064 añade «Plano y estado» y una alternativa DOM/SVG sin GPU. PR #77 integrado con autorización explícita; Pages comprobado en e5162b6166fd352fb5d83700ec8c599af75cc234. Prueba autenticada por plano: tres rutas, llegadas, una visita por espacio, regreso al puesto, navegación y lectura de juntas. Capturas en el plan privado. WebGL y móvil reales siguen pendientes. Ver `docs/arquitectura/despacho-vista-legible.md`.

El interruptor es `OFICINA_LEGIBLE` en `despacho3d/office-config.mjs`, `true` por esta petición. El piloto comparte sus rutas con el 3D; Entorno registra la visita después de la llegada confirmada. Las seis áreas por construir siguen pendientes. Los datos privados siguen llegando por el perfil autorizado.

## 9. Acción 1.1 contrato de actividad y tandas de trabajo

Dirección pidió continuar el plan en tandas de unos treinta minutos, cerrando cada tanda con avance guardado, evidencia y siguiente acción. CHG-DESPACHO-ACTIVIDAD-065 prepara el contrato y una demostración sintética independiente, accesible desde Entorno. `despacho3d/actividad.mjs` valida estados, identidad, secuencia, evidencia y reintentos de eventos en memoria. No autentica eventos ni implementa RPC o guardado en Sheets. Ver `docs/arquitectura/despacho-actividad.md`.

El contrato existente conserva IDs de conversación y trabajos. PR #78 publicado y demostrado por HTTPS, 322 pruebas y ambos checks aprobados; capturas privadas guardadas en el plan. La fuente privada del motor se pudo leer: la documentación está en cloud/README.txt, no README.md. Se identificaron manifiesto y outbox por request_id; no acredita un adaptador de visitas. El siguiente trabajo es contrastar la versión efectiva de Apps Script y diseñar 1.2: registro durable de visitas, recibos, CAS, autorización y recuperación. Reintento de eventos en memoria no acredita idempotencia durable por solicitud.

## 10. Acción 1.2 registro de visitas preparado

CHG-DESPACHO-VISITAS-067 añade servidor genérico de visitas, enlace al Portero r6-fast y prueba Sheets aislada; cliente con recuperación, cola, reintento y CAS, carril propio y aviso de recibos reales. `ENTORNO_VISITAS_PERSISTENTES=false`: la sala continúa con registro en memoria hasta comprobar instalación y encendido en otro PR. Ver `docs/arquitectura/despacho-visitas.md`.

Preflight: implementación activa de Portero v63 comprobada en el editor; build r6-fast y Code.gs actual idéntico a esa versión. Respaldo íntegro en el plan privado. La versión activa aún no acepta readVisits/recordVisit. DespachoVisitas.gs se guardó y ejecutó: 14 comprobaciones conectadas aprobadas en archivo sintético nuevo. Lectura por conector confirma dos visitas, recibos correlacionados y revisión 2, sin alterar pestaña original. Captura y archivo quedan en el plan privado. No se editó el router ni se publicó otra versión de Apps Script en esta tanda.

Siguiente entrega: contrastar de nuevo la fuente del módulo guardado con el repositorio e instalar el enlace, crear solo pestañas vacías, actualizar la implementación existente y comprobar lectura autenticada antes del PR de encendido. Ninguna escritura de prueba en el libro de negocio. La recuperación de visitas reales y aceptación móvil siguen pendientes.

## 11. Instalación y encendido de visitas · 4-oct-2026

CHG-DESPACHO-VISITAS-ENCENDIDO-068: Portero v64 confirmado en la implementación existente; URL, permisos y configuración conservados. Única inserción en Code.gs: dispatch de readVisits/recordVisit tras validar payload y antes del allowlist. Módulo y router guardados releídos idénticos. Preparación tuvo un lock_busy sin escribir; tras comprobar ausencia de pestañas, segundo intento creó ambas vacías. Conector confirma historial sin filas y revisión 0; propiedades anteriores intactas.

Cliente preparado con ENTORNO_VISITAS_PERSISTENTES=true y cache bumps. Tras Pages, comprobar lectura autenticada antes del recorrido; cotejar visita/recibo y recuperar al recargar sin otra fila. La aceptación se registra por separado. Reversión: flag false y, si hace falta, volver Portero a v63 conservando pestañas/datos.

PR81 publicado y Pages comprobado. Primera lectura OS 0 visitas; llegada autorizada a juntas guardó exactamente una fila/recibo, revisión 1. Lectura posterior UI falló: no repetir escritura. Diagnóstico editor-only leído sin escribir: snapshot válido y aceptado por validador cliente. Helper nuevo guardado en HEAD, fuera de v64 activa. DOM data-visits-status/error/revision permite acotar causa sin leer estado oculto. Recarga y aceptación pendientes; actualización completa en plan privado.


Cotejo final 1.2: PR82 integrado y Pages comprobado. Recarga OS recupera la misma visita y recibo en Entorno; sesión local vacía, DOM ready/error vacío/revisión 1. Actualización de solo lectura también ready. Conector confirma una fila y revisión 1: no se repitió el recorrido ni registro. Registro durable y recuperación funcional comprobados; no afirmar que el diagnóstico corrigió los fallos previos ni que su causa está resuelta. Evidencia y limitaciones en plan privado. Próximo paso 1.3: permisos por espacio/expediente/operación y revocación; móvil real/WebGL siguen pendientes en 0.4. Helper editor-only guardado en HEAD, implementación activa v64.

## 12. Acción 1.3 · política de permisos preparada

CHG-DESPACHO-PERMISOS-069 implementa un núcleo compartido entre Apps Script y prueba visual sintética. Matriz inicial: Juntas, Biblioteca y Edición solo observar; seis espacios sin conexión. No concede borradores, envíos ni aprobación. Cada consulta nueva revalida sesión/expediente/espacio/operación al inicio y al final; visitas conserva autorización antes de commit y añade comprobación al terminar lectura. No reemplaza autorización de otros protocolos existentes de conversación/metas. Ver `docs/arquitectura/despacho-permisos.md`.

`ENTORNO_PERMISOS_SERVIDOR=false`. Código nuevo probado fuera de producción; Portero activo sigue v64. No instalar el nuevo visitas-portero.gs sin núcleo/adaptador de permisos. Próxima acción: respaldar y cotejar HEAD/versión activa, instalar ambos módulos y dos dispatch de lectura en el mismo Portero, verificar lectura autenticada y entregar PR de encendido. No repetir recorrido ni escritura de visitas para depurar. La demostración `permisos-demo.html` usa datos sintéticos y no acredita servidor instalado. Guardar capturas permitida/denegada/revocada en plan privado y luego aceptación de matriz real. 1.3 continúa abierto hasta esa aceptación; después 1.4 recuperación de trabajo.
