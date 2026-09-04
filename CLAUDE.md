# YOD OS (yod-portal) — la cabina: el marco, el menú y el tablero de toda la operación YOD

Lee este archivo completo antes de tocar nada.

## Qué es

Es la **cabeza** del tablero YOD. No es "un tablero más": es el marco donde entran todos.
Lo usan Alejandro (Dirección), Sayri y el equipo interno; cada quien ve solo los tableros
que su fila de Accesos permite.

Cuatro piezas desde el mismo origen: **la cabina** (`os/`: menú, buscador ⌘K, identidad/rol, Pulso),
**el tablero cenital** (`tablero.html`, embebido en Inicio), **Avance de obra** (`obra.html`: cadena
por ROLES que vienen del Sheet — CAPTURA propone → VERIFICA verifica → AUTORIZA autoriza el pago;
`obra.html` no nombra a nadie, los nombres van en el comentario de `tablero.html`) y **los tracks**
+ **La Chinche** (`chinche.js`).

**Direcciones (comprobadas con curl el 2026-09-04):**
| URL | HTTP |
|---|---|
| `https://yodesarrollomx.github.io/yod-portal/` (raíz → redirige a `os/`) | **200** |
| `https://yodesarrollomx.github.io/yod-portal/os/` (la cabina) | **200** |
| `https://yodesarrollomx.github.io/yod-portal/tablero.html` | **200** |
| `https://yodesarrollomx.github.io/yod-portal/obra.html` | **200** |
| `https://yodesarrollomx.github.io/yod-portal/track-codesarrollos.html` | **200** |
| `https://alexpueblag.github.io/yod-portal/` (casa vieja, cascarón que reenvía) | **200** |
| `https://tableros.yodesarrollo.mx/yod-portal/` (dominio propio) | **000 — todavía no existe en el DNS** |

Repo: `yodesarrollomx/yod-portal` (`git remote -v`), público, Pages desde `main`.

## Reglas INVIOLABLES

1. **Las tres tablas de códigos dicen LO MISMO, siempre.** `os/access-policy.js` (`SYSTEM_CODES`),
   `os/shell.js` (`CODES`) y `potenciales-yod/accesos.html` (`CODES`). Si divergen, un colaborador
   con acceso queda bloqueado — fue el bug `BA`→`TA` del 15-jul-2026 (`CODIGOS-BOARDS.md`).
   Las dos primeras las compara `node verify-os.cjs`; la tercera vive en otro repo y va a ojo.
2. **Cada cambio a `os/app.js` exige subir el `?v=` en `os/index.html`** (la etiqueta de `app.js`,
   línea 215; la de `styles.css`, línea 19 — no copies el valor de aquí, léelo del archivo, cambia
   seguido). Sin el bump, Pages sirve el JS viejo y "no se ve el cambio"
   (memoria `yod-os-menu-catalogo`).
3. **No hay copia local del catálogo. Si Sheets no responde, el portal falla CERRADO** y no habilita
   enlaces (`README.md`; `portal-core.js` `enabled()` exige `estado='activo'` + URL del allowlist).
4. **El allowlist `DESTINATIONS` acepta las DOS casas** (yodesarrollomx y alexpueblag) a propósito.
   El Sheet se actualiza en otro momento que el código: con una sola base, todas las tarjetas quedan
   en "URL inválida" y el portal amanece vacío (comentario en `portal-core.js:7-15`).
5. **Ni `tablero.html` ni `obra.html` borran `pyod_clave_v1` por un rechazo propio** — antes cerraban
   la sesión de TODO el OS (commits `17b9e67`, `9204568`, 2-sep-2026).
6. **El portal no es el muro: cada backend valida su propio código.** El menú solo oculta
   (`os/shell.js:56-58`). Nunca confiar en que "no se ve" equivale a "no se puede".
7. **Repo público: cero datos reales en el HTML.** Las vistas previas de `thumbs/` van difuminadas
   a propósito, y las tres páginas llevan `noindex,nofollow,noarchive` (`README.md`, `os/index.html:6`).
8. **Antes de publicar: `node verify-portal.cjs` y `node verify-os.cjs`.** Los dos pasan hoy
   (corridos 2026-09-04).
9. **No hacer POST a los `/exec` para "probar":** hay backends que escriben (obra, Sala, CRM).

## Archivos

- `index.html` — un redirector de unas cuantas líneas: manda a `os/` conservando el hash. El portal viejo ya no vive aquí.
- `os/index.html` — el esqueleto de la cabina: menú, Inicio, secciones (`#tablero`, `#pulso`,
  `#seccionEmbudo`, `#operacion`, `#modulos`) y la **máscara del Embudo** (`#embudoMask`, 3 pestañas:
  Sala de Edición / Métricas / Plan de Potencial).
- `os/app.js` — el motor (63 KB): canje al Portero, catálogo, Pulso, máscara, rutas `#/embudo/...`,
  caché por sesión. **OJO 2026-09-04: hay otra sesión trabajando en este archivo.**
- `os/shell.js` — el MISMO marco, pero para los tableros de OTROS repos: se carga como `portero.js`
  y envuelve el board sin tocar su lógica. Se sale solo si la URL trae `embed=1`.
- `os/access-policy.js` — `SYSTEM_CODES` + `canOpen(boards, systemId, rol)`. Lo usan también
  `tablero.html` y `obra.html`.
- `os/adapters/{operations,finance,marketing}.js` — cada uno con su `/exec` y su `summarize()`.
- `portal-core.js` — allowlist `DESTINATIONS`/`TRACK_DESTINATIONS` + `safeUrl`, `enabled`, `badge`, `card`.
- `tablero.html` (102 KB) — el tablero cenital. Llama a 7 GAS; lee `?boards=` y `?rol=` del OS.
- `obra.html` (46 KB) — Avance de obra. Exige código `OB` (la línea con `canOpen(…,"SYS-OBRA",…)`).
- `chinche.js` — el capturador de pendientes (IndexedDB, por origen). Cargado en las 3 páginas.
- `verify-os.cjs` / `verify-portal.cjs` — las pruebas. `CODIGOS-BOARDS.md` — la tabla de códigos.
  `.claude/launch.json` — servidor local en el puerto 8787.

## Arquitectura de datos

**ADVERTENCIA: este repo es ESPEJO del front. Ningún Apps Script vive aquí.** Lo que corre es lo
pegado en el editor de Apps Script. Al desplegar: editar la implementación EXISTENTE → "Versión nueva".
NUNCA "Nueva implementación" (memoria `portal-gas-lectura-abierta`).

```
PORTERO (uno solo, GAS de Potenciales)          ← la cerradura de todo el sistema
  /exec AKfycbwlDDCWWz…            (ORIGINAL)
  /exec AKfycbyrhqMb70…            (RESPALDO — solo si el original falla en ESA llamada)
        │  ?recurso=canje&t=<token de localStorage pyod_clave_v1>
        │  devuelve {ok, nombre, correo, rol, boards}
        ▼
Sheet "YOD OS · Control Maestro" (1E_89GQBnOmwv5Nej2B-QEkAdVnFYQbBVQUffHWwI7Vk)
  · pestaña Portal   → nombres, orden, visible, icono, estado, sensibilidad, url
  · pestaña Sistemas → registro canónico (url/estado/sensibilidad se heredan por system_id)
        │  GAS "YOD OS Backend Seguro"  /exec AKfycby5LKYK…?action=read&resource=Portal[&k=<token>]
        │  sin k = solo filas «Interno» (hoy 2). Con k válida = catálogo completo.
        ▼
os/app.js  y  os/shell.js  → pintan el menú y las tarjetas
        │  el destino se pasa por portal-core.safeUrl(); fuera del allowlist = "URL inválida"
        ▼
iframe ../tablero.html?embed=1&boards=<códigos>&rol=<rol>&v=os2   (app.js, el data-src del iframe)
        └─ tablero.html solo llama a los GAS que YodAccessPolicy.canOpen permite; sin permiso pinta "—"
        └─ al validar clave manda parent.postMessage({yodTablero:'sesion'}, origin) y el OS revalida

Pulso del negocio (3 tarjetas, solo con sesión):
  Tesorería  ← adapters/finance.js     /exec AKfycbxbQpBn7f…
  Embudo     ← adapters/marketing.js   /exec AKfycbztAKA7K5…
  Operación / Decisiones ← adapters/operations.js /exec AKfycbyZ1p7rGHu… (caché aurum-cache-v5)

Máscara del Embudo (#/embudo/…): iframes a sala-edicion, aurum-board y plan-potencial.
  UNA SOLA LLAVE (canje_os retirado el 4-sep): la Sala lee viva la credencial del OS
  (pyod_clave_v1, mismo origen) y su GAS le pregunta al Portero (rolPorPortero_, caché 5 min).
  Esa pregunta tarda 60-86 s y la Sala se rinde a los 10 s × 3 → caía al respaldo viejo.
  Por eso app.js (llaveSalaLista_) hace ÉL la primera lectura GET recurso=dia&clave=<token>
  a SALA_GAS /exec AKfycbx61UWsEY… con 100 s de límite, y sólo entonces monta el iframe.

Obra: obra.html → GAS /exec AKfycbyVb6Y7m0… (mismo que usa tablero.html para el hexágono #16)
```

Los otros tableros no viven aquí: `potenciales-yod`, `board-aurum`, `board-flujo-yod`,
`interiores-aurum`, `yodesarrollo-board`, `aurum-board`, `real-miramar-board`. Este repo solo
guarda sus **direcciones** (`portal-core.js` `DESTINATIONS`) y sus **códigos** (`access-policy.js`).

## Decisiones

- **2026-06-27 · Alejandro** — el portal NO lleva clave propia: es directorio, cada tablero mantiene su
  gate (memoria `portal-boards-yod-project`). *Sigue vigente para las tarjetas; el Pulso y el tablero
  embebido sí exigen sesión (`app.js`), porque muestran cifras.*
- ~~**2026-07-06** — las tarjetas del portal son HTML estático: para agregar un tablero se edita
  `index.html`.~~ **OBSOLETO desde 2026-07-20**: `index.html` solo redirige y el catálogo sale del
  Sheet. Hoy se agrega una fila en `Sistemas` + `Portal` del Control Maestro (`README.md`).
- **2026-07-20** — el GAS del catálogo filtra por la columna `sensibilidad`: sin credencial solo
  «Interno». *Re-verificado hoy (2026-09-04): un GET anónimo devuelve 2 filas (SYS-TRACK, SYS-TAREAS).*
- **2026-07-30** — `SYS-OBRA` deja de apuntar al repo `yod-obra` y pasa a `obra.html` de este repo,
  porque aquél traía su secreto de escritura en el bundle y la nómina en un `data.json` público
  (comentario en `portal-core.js`, bloque `SYS-OBRA`).
- **2026-08-23** — la pestaña `Portal` del Control Maestro ES la fuente de los nombres del menú; el
  `NAME` de `shell.js` es solo respaldo y debe decir lo mismo (commits `8b149d2`, `58badd9`).
- **2026-08-23** — "pinta al instante lo último conocido, refresca en fondo", fail-closed si el canje de fondo falla (commit `05c3447`).
- **2026-09-01 · Alejandro** — mudanza: los tableros viven en `yodesarrollomx.github.io`; la puerta vieja reenvía (commit `9466aa7`).
- **2026-09-02** — enjambre "YOD OS a nivel Fable": 6 grupos de archivos disjuntos. De ahí salen los
  contratos vigentes (`boards`/`rol` al iframe, puertas MK/TA/OB, `[hidden]` gana a flex/grid,
  `verify-os.cjs` compara `CODES` con `SYSTEM_CODES`) — commits `66a5d40`…`32f66be`.
- **2026-09-02** — el Portero lento ya no cierra la sesión: espera 25 s y reintenta en fondo
  (`app.js:18`, `LIMITE_MS=25000`; commit `3415b2e`). Antes 12 s lo daba por muerto estando vivo.
- **2026-09-03/04** — entrar con Google basta para la Sala de Edición: el OS canja su token por la
  llave de la Sala (`llaveDeSala_`, commits `bdf7d32`, `447f8bc`).

## Pendientes

| Tema | Dueño | Evidencia para darlo por cerrado |
|---|---|---|
| DNS `tableros.yodesarrollo.mx` (CNAME → `yodesarrollomx.github.io.`) | Alejandro + Miguel Reina (cPanel) | `curl -o /dev/null -w "%{http_code}" https://tableros.yodesarrollo.mx/yod-portal/` devuelve 200 (hoy: 000) |
| Revisar CON credencial la columna `url` del Control Maestro: las filas que no se ven sin `k` son las que podrían traer `alexpueblag` escrito a mano | Alejandro (edita el Sheet) | El GET anónimo devuelve hoy `"url":""` en las 2 filas visibles, o sea heredan la base canónica de `portal-core.js`, que ya es yodesarrollomx (verificado 2026-09-04). Falta el mismo GET **con `k`**: se cierra cuando ninguna fila traiga `alexpueblag` |
| `CODES` de `potenciales-yod/accesos.html` sin prueba automática (regla 3 de `CODIGOS-BOARDS.md`) | quien toque `potenciales-yod` | Una prueba que compare las 3 tablas, o la revisión a ojo firmada con fecha |
| `TA` significa dos tableros en el Code.gs del Portero (MOAC y track Alysa); el Portero trata `boards` vacío como `*` y `access-policy` como nada | backend del Portero | El Code.gs pegado en el editor, con `TA` desambiguado y `boards` vacío = sin acceso |
| SHELL-10 (header pegajoso bajo la topbar del shell) y TABLERO-48 (mini-tablero ilegible en iPhone) | quien retome el enjambre | Captura de pantalla en iPhone y en un board con `shell.js` |
| `obra.html` carga `os/access-policy.js` **sin `?v=`** (la etiqueta `<script src="os/access-policy.js">`) — Pages puede servir la copia vieja tras un cambio de códigos | quien toque `access-policy.js` | La línea con su `?v=` alineado al de `os/index.html:211` |
| `os/embudo-c.html` y `os/embudo-dummy.html` no los referencia nadie (grep en todo el repo) | Alejandro decide | Borrados, o una nota diciendo para qué se conservan |

## Por confirmar (NO afirmar sin respuesta)

- **La Sala de Edición** (`https://yodesarrollomx.github.io/sala-edicion/`, responde 200 hoy) se abre
  desde la máscara del Embudo pero **no tiene `system_id` ni código propio** en `access-policy.js`.
  Pregunta a Alejandro: ¿la Sala debe entrar al Control Maestro con su código, o se queda colgada de `MK`?
- `track-codesarrollos.html:114` carga `shell.js` por URL absoluta de **este mismo repo**
  (`yodesarrollomx.github.io/yod-portal/os/shell.js?v=relevo5`). Pregunta: ¿es a propósito (para que
  el marco se actualice solo en todos lados) o debería ser ruta relativa?
- El `README.md` describe el portal v1 (6 tarjetas, "El portal no autentica", tarjeta de Obra en
  "Próximamente"). Pregunta: ¿se reescribe para que hable de YOD OS, o se deja como historia?
