# Contrato de la Fase 2 (añadido al CONTRATO.md) · v1 · 2026-11-01

Sol Integración (principal) es el único que edita este archivo, `02_cruces/*`, `03_visual/*` y `01_base/series-integradas.csv`.
Cada chunk escribe SOLO en su carpeta `01_base/f2-<chunk>/` (series, notas, checkpoints) o en la que diga su contrato.

## 1. Series (igual que CONTRATO.md, con estas precisiones)
- Mismo `series.csv` de 14 columnas del CONTRATO.md. `geografia` se respeta: un `serie_id` = una geografía (sufijo `-sonora`, `-nacional` si no es municipio). Prohibido mezclar geografías en un `serie_id` (corrección R2 de la Fase 1).
- Un `serie_id` = una unidad (R11).
- **Acumulados** (ene–MM): `serie_id` termina en `-acum`, `periodo` = `YYYY-MM` del último mes incluido, y la `nota` empieza con `Acumulado ene–MM`.
- **Proyecciones/metas de terceros** (p. ej. CONAPO 2030, meta de un programa): `calidad` = `declarado` (si es oficial) o `prensa`; nunca `observado`.
- **Supuestos propios** (probabilidad de ejecución, sendas de escenario): `calidad` = `supuesto`, con la justificación y la referencia en `nota`.
- Nada de memoria: cada número se lee en su fuente el 2026-11-01. Si no abre: `por verificar` + intento descrito.

## 2. Cartera de vivienda futura: `cartera.csv` (chunks C03 y C04)
Una fila = un programa o desarrollo × una etapa × una fecha de dato. Columnas, en este orden:
`cartera_id, programa, tipo, promotor, etapa, unidades, fecha_dato, entrega_esperada, precio_mxn, ubicacion, geografia, url, localizador, calidad, posible_duplicado_de, nota`
- `cartera_id`: slug estable por programa/desarrollo (ej. `conavi-bienestar-hmo-norte`). Mismo programa en otra etapa o fecha → mismo `cartera_id`, otra fila.
- `tipo`: `publico` | `privado` | `mixto`.
- `etapa` (vocabulario cerrado): `anunciada` | `en_proyecto` | `asignada_o_registrada` | `en_construccion` | `terminada` | `entregada` | `meta` (meta agregada sin proyecto identificado).
- `unidades`: entero. `fecha_dato`: `YYYY-MM-DD` de la fuente. `entrega_esperada`: `YYYY` o `YYYY-QN` si la fuente lo dice; si no, vacío.
- `geografia`: `municipio Hermosillo` o `Sonora` (las de Sonora no se usan para Hermosillo sin una fila `estimado` aparte).
- `posible_duplicado_de`: `cartera_id` de otra fila que podría contar las mismas viviendas (Sello H incluye Bienestar, etc.). Explicar en `nota`.
- **Prohibido sumar** entre programas o etapas dentro de este archivo.

## 3. Entregables de cada chunk
- `series.csv` (y `cartera.csv` si aplica), `notas.md` (máx. ~800 palabras: qué se obtuvo, definiciones, contradicciones con ambos valores, qué no se obtuvo) y `checkpoints.md`.
- **Checkpoint** al empezar, cada ~5 minutos de trabajo y al terminar: una línea con hora real (`date -u +%Y-%m-%dT%H:%M:%SZ`) | qué hice | qué cambió | evidencia | bloqueo | siguiente paso.
- Integra pronto: escribe `series.csv` desde el primer dato válido y ve agregando.
- Chunk pequeño: tope ~25 minutos de trabajo. Si no alcanzas, entrega lo que tengas con la lista de faltantes; no abras alcance.

## 4. Red y herramientas
- `curl` y Playwright reciben 403 del proxy hacia hosts oficiales: usar **WebFetch** (sí llega a SNIIV, INEGI, Banxico, gob.mx, prensa).
- SNIIV CuboAPI (GET públicos, WebFetch): `https://sniiv.sedatu.gob.mx/api/CuboAPI/Get{Produccion|Registro|Verificacion|Inventario|Infonavit|CNBV|FOVISSSTE|Financiamiento}/{años}/26/030/{dimensiones}`; inventario: `GetInventario/{año},{mes}/26/030/{dims}`. Municipio de Hermosillo = 26/030.
- SHF: `https://sniiv.sedatu.gob.mx/api/ShfPriceAPI/GetTerritorialVariation?baseYear=&baseQuarter=&finalYear=&finalQuarter=` y `.../GetNationalPrices?startYear=&startQuarter=&endYear=&endQuarter=&categories=&metric=index`.
- No usar el navegador Chrome del usuario. No hacer POST a ningún endpoint. No tocar archivos de otro chunk.
