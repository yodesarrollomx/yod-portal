# Códigos de tablero YOD OS — fuente única de verdad

Cada persona tiene en **Accesos** (`Hoja YOD-Potenciales` → pestaña `ACCESOS`,
columna `boards`) una lista de códigos separados por coma, o `*` para todo.
Cada backend valida su propio código antes de entregar datos. **Si el código
del backend no coincide con el de esta tabla, los colaboradores quedan
bloqueados aunque tengan el acceso** (fue exactamente el bug `BA`→`TA` de
Operación, 15-jul-2026).

| Tablero | Código | Repositorio | Endpoint valida con |
|---|---|---|---|
| Potenciales | `PT` (+ `MP,MA,MX,UN,RE,PA` internos) | potenciales-yod | Portero (nativo) |
| Codesarrollos | `CO` (`TC` alterno) | yod-portal/track-codesarrollos | OS Backend Seguro |
| Real Miramar | `RM` | real-miramar-board | `board=RM` |
| Operación semanal | `TA` | board-aurum | `board=TA` (antes `BA` ✗) |
| Flujo YOD | `FL` | board-flujo-yod | `board=FL` |
| Interiores | `IN` | interiores-aurum | `board=IN` |
| Inversionistas | `IV` | yodesarrollo-board | `board=IV` |
| Métricas / Marketing | `MK` | aurum-board | `board=MK` |
| Obra en vivo | `OB` | yod-portal/obra.html | adaptador de obra |
| Accesos (admin) | `AC` (no se otorga) | potenciales-yod/accesos.html | rol admin |
| La matriz | `MZ` | artifact claude.ai `836ce3db…` | privacidad del artifact |
| El Despacho | `DP` | artifact claude.ai `8d4242fb…` | privacidad del artifact |

## Reglas

0. **`MZ` y `DP` son artifacts privados de claude.ai, no tableros de GitHub Pages.**
   El código decide **quién ve la tarjeta** dentro del portal; **quién puede ABRIR la
   página** lo decide la privacidad del artifact en claude.ai, no este repo. Las dos URLs
   están en HTML público: el candado real está del otro lado.

1. **`admin` y `*` abren todo.** El resto se compara contra la lista `boards`.
2. El código que valida cada backend debe ser **idéntico** al de esta tabla y
   al que asigna la matriz de `accesos.html`.
3. Estas tres fuentes deben decir lo mismo siempre:
   - `yod-portal/os/access-policy.js` → `SYSTEM_CODES`
   - `yod-portal/os/shell.js` → `CODES`
   - `potenciales-yod/accesos.html` → `CODES` (matriz de alta)
   Las dos primeras las compara `node yod-portal/verify-os.cjs` (falla si divergen);
   la de `accesos.html` sigue siendo a ojo porque vive en otro repo.
4. **`SYS-CONTROL` (código `AC`) es el Sheet Control Maestro, no un tablero.**
   No se otorga desde la matriz de Accesos: `canOpen` solo lo abre con rol
   `admin` (o `*`). Se queda listado en las dos matrices para que digan lo
   mismo, pero no tiene tablero, ni icono, ni destino en `shell.js`.
5. Validación recomendada **sin `board=`**: pedir el canje simple al Portero
   (devuelve `boards`) y revisar el código aquí, en el backend. Así no depende
   del filtro por-board del Portero y no se puede volver a teclear mal el
   código. (Ver `board-aurum/apps-script/portero-auth.gs`.)

## Prueba de humo (manual, ~2 min)

Con una sesión de colaborador que tenga **solo** ciertos códigos, abrir cada
tablero: los de su lista deben cargar datos; los demás deben responder
`liga`/candado. Si un tablero de su lista responde `liga`, su backend tiene el
código mal — corregirlo contra esta tabla y **redesplegar (Nueva versión)**.
