# Sala · capacidad para imágenes nuevas

Contrato **CTR-SALA-MEDIOS-PUBLICOS**, cambio **CHG-SALA-MEDIOS-PUBLICOS-20261015**,
propuesta **MEDIOS** y revisión `2026-10-15.sala-medios.1`.

La autorización técnica de migración de Sala del 14-oct-2026 persiste.
Este registro prepara una fase de capacidad; **no activa externalización ni
crea releases o activos**. `SALA_MEDIOS_PUBLICOS` permanece desactivado.
No se añaden ámbitos de App, pagos, permisos de Drive ni decisiones editoriales.

## Capacidad y límite de esta fase

El artefacto inspeccionado ocupa **897647868 bytes**, cerca del 95% del
presupuesto de **900 MiB**. Cinco muestras de PNG con compresión sin pérdida
ahorraron sólo 2.57%; 196 PNG están vinculados por huellas MD5 y recomprimirlos
cambiaría su identidad. Se conservan presupuesto, bytes, rutas y URLs históricos.

Esta fase admite únicamente imágenes **nuevas**, ausentes tanto de Git como del
baseline, bajo `laminas/`, con sufijos `png`, `jpg`, `jpeg` o `webp`.
Vídeo, audio y muestras siguen en Pages. Las entradas de manifiesto ya publicadas
y sus activos son inmutables. El transporte externo no cambia la ruta lógica,
el MD5 de negocio, la selección ni las aprobaciones.

## Manifiesto schema 1

`datos/medios-publicos.json` contiene exactamente tres campos de primer nivel:
`schema: 1`, `repo: "yodesarrollomx/sala-edicion"` y `entries`.
Cada clave de `entries` es una ruta lógica de hasta 512 caracteres que cumple:

```text
^laminas/(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_.-]+\.(png|jpg|jpeg|webp)$
```

Se rechazan segmentos `.` y `..`, rutas absolutas, backslashes y otros sufijos.
No se admiten campos extra, IDs de Drive, texto privado o credenciales.

| Campo exacto de cada entrada | Restricción |
|---|---|
| `sha256` | 64 caracteres hexadecimales en minúsculas |
| `bytes` | Entero entre 1 y 25 MiB |
| `mime` | `image/png`, `image/jpeg` o `image/webp`, coherente con el sufijo |
| `release_id`, `asset_id` | Enteros positivos hasta `9007199254740991`, seguros en JavaScript |
| `tag` | `sala-media-<sha256 del payload canónico>-<mesa\|arranque>` |
| `url` | `https://github.com/yodesarrollomx/sala-edicion/releases/download/<tag>/<sha256>.<sufijo lógico>` |

`MAX_MANIFEST_BYTES` es **2 MiB**, comprobado antes de parsear o emitir.
Cada release admite hasta **1000 activos únicos**. El número total de entradas
no tiene otro tope arbitrario; queda limitado por los bytes del manifiesto.

El recibo fresco `version-online.json` incorpora `media_manifest_sha256`, el
SHA256 de los **bytes exactos** del JSON, incluida su newline si existe.
No se calcula sobre un objeto vuelto a serializar. La UI resuelve rutas sólo
después de verificar este pin y validar el manifiesto.

## Lectores antes del emisor

| Paso | Evidencia necesaria antes de avanzar |
|---|---|
| Publicar lectores | UI, FULL y consumidores compatibles con schema 1; recibo fresco y `<meta name="sala-medios-publicos" content="1">` en UI |
| Comprobar carga | Identidad de repo/tag/asset y digest SHA256 del activo draft antes de publicar; publicación inmutable acreditada |
| Comprobar acceso | Canario anónimo obtiene los bytes públicos y coteja SHA256, tamaño y tipo; ningún token llega al navegador |
| Comprobar consumidores | Lectores anteriores incompatibles protegidos; FULL/restauración, hidratación de Mesa/corte y `file_is_published` exactos |
| Habilitar emisión | Sólo `SALA_MEDIOS_PUBLICOS=1` permite imágenes nuevas, después de todas las pruebas anteriores |

Integrar código o publicar una URL por hash no acredita inmutabilidad,
accesibilidad anónima ni capacidad disponible. Esta tanda no acredita ninguno
de esos pasos de ejecución y mantiene el emisor OFF.

Un 404 del manifiesto sólo corresponde al modo legado cuando el recibo tampoco
declara pin. Un manifiesto existente sin pin, hash distinto, lectura fallida,
schema inválido o exceso de tamaño cierra imágenes y aprobaciones. No se
confirma montaje o publicación con una lectura inconclusa.

## Snapshots y publicación exacta

Los snapshots de datos siguen siendo **releases draft privados**. Las releases
públicas de imágenes constituyen otro contrato y no cambian esa privacidad.
El ZIP schema 1 mantiene formato y permite el nuevo JSON. Un FULL conserva el
manifiesto y sólo omite bytes externos cuando su publicación exacta está
comprobada; Mesa y corte hidratan los bytes verificados antes de usarlos.
`file_is_published` exige archivo lógico, pin, identidad y bytes coincidentes;
una URL o metadato por sí solos no bastan.

El tag cumple `^sala-media-([0-9a-f]{64})-(mesa|arranque)$` y depende del
payload de archivos, repo y proceso. **No depende de run, attempt ni source.**
El digest corresponde al SHA256 del JSON canónico
`{schema:1,repo,process,files:{rutaLogica:{sha256,bytes,mime,name}}}`:
`sort_keys=True`, `separators=(',', ':')`, `ensure_ascii=False`, codificación
UTF-8 y **sin newline**. `name` es el SHA256 de la imagen, punto y sufijo lógico
en minúsculas. Se excluyen `source_sha`, `run_id` y `attempt`.
El SHA256 del payload no es el SHA256 de una imagen ni el pin del manifiesto,
que sí incluye su newline cuando existe.
El descriptor conserva la procedencia técnica inicial para auditoría, pero la
reconciliación de una reentrada usa el payload actual para encontrar el mismo tag.

El uploader registra un checkpoint `online.json` en `RUNNER_TEMP`, separado por
run e intento, **antes** de cada POST. Al reentrar relee releases y assets por
identidad exacta. Si se pierde el runner tras un ACK perdido, un runner nuevo
con el mismo payload encuentra la misma release y sus activos por el tag estable;
concilia sus bytes y reutiliza esos objetos sin otra mutación. No necesita
recuperar el checkpoint local para identificar los objetos remotos existentes.
Una operación pendiente o confirmada sin prueba concluyente no se repite.
Los objetos invisibles o una consulta inconclusa se conservan pendientes.

| Caso de regresión requerido en el consumidor | Resultado esperado |
|---|---|
| Release/asset aceptado, ACK perdido, runner perdido y nuevo attempt con el mismo payload | GET del mismo tag y activo; cero POST adicionales |
| Mismo payload con otro run/attempt/source | Tag idéntico; procedencia original conservada |
| Cambio de archivo, hash, tamaño, MIME, nombre o proceso | Identidad de payload distinta |
| GET de conciliación no concluyente | Pendiente; cero mutaciones para adivinar el efecto |

Son criterios de aceptación sintéticos de esta fase; este registro no afirma
que hayan pasado en producción ni habilita el emisor.

## Reversión

Desactivar `SALA_MEDIOS_PUBLICOS` detiene nuevas externalizaciones. Si ya existe
un medio externo, se conservan lector compatible, manifiesto, pin del recibo,
releases y activos. Para volver a un lector antiguo hay que repatriar y verificar
todos los bytes referenciados, publicar un FULL íntegro dentro de 900 MiB y
comprobar recibo fresco y consumidores. No se retiran activos por revertir código.
El flag incremental de snapshots sigue OFF y mantiene su reversión específica.

## Integración relacionada: producción fuera de la ventana diaria

**CTR-SALA-PRODUCCION-HISTORICA** pertenece a la reparación NUBE ya autorizada;
CHG-SALA-MEDIOS-PUBLICOS-20261015 registra su integración de consumidor y añade
GAS-SALA/SHEET-SALA al impacto. Propone `GET recurso=produccion` sólo de lectura
con el rol agente existente y los mismos permisos. El backend **no está
desplegado**: `SALA_PRODUCCION_HISTORICA=0` hasta despliegue del propietario y
GET con `produccion-historica-v1` / `historial_completo` verificados. La cuenta
inspeccionada no administra ese despliegue; no se crean ACL, scopes o identidades.

La ventana técnica de 14 días puede omitir fuentes que siguen en Sheet.
El diagnóstico actual identificó cuatro cortes fallidos no vetados: tres se
asocian a dos fuentes únicas no retiradas y otro a una tercera fuente retirada.
Esto no acredita aprobación vigente de guion o toma. La auditoría nueva halló
**cero elegibles** y no reencoló ningún corte ni creó decisiones.

El recurso propuesto lee todo DEC y resuelve la última PROP hasta hoy; la
retirada más reciente impide revivir una versión anterior. Las marcas se ordenan
por sello UTC real de fila/editor/pid/lámina. `pending` conserva la marca previa;
`borrar` sólo retira la propia y un NO vigente del otro editor sigue vetando.
Empates contradictorios cierran. Las firmas de notas globales preservan autoría
y texto exactos. No se sustituye el sello por fecha del día, `envío_id` o lectura.

El contrato completo fija campos y límites. Una respuesta antigua reconocida
declara historial no confirmado; error de red, auth, forma o contrato falla
cerrado. Ni la lectura histórica ni desactivar su flag aprueban o reencolan
trabajos. Su aceptación exige dobles sintéticos de estos casos y después
despliegue y lectura canónica acreditados por separado.

## Evidencia anterior, separada de esta fase

La reparación de nube anterior está integrada mediante
[PR308](https://github.com/yodesarrollomx/sala-edicion/pull/308), commit
`e4da08887e45e984be8ea945ce607db464b0fb52`, con cinco CI del head revisado en verde.
El cierre de integración registró 394 pruebas Python, 18 Node y 13 verificaciones;
son pruebas de Sala de esa integración, no pruebas nuevas de este documento.

| Recorrido ya observado | Resultado acotado |
|---|---|
| [Pages38688574369](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38688574369) | Success; snapshot413444031 y recibo exacto |
| [Plan38688574251](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38688574251) y [Pages38688736093](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38688736093) | Success; snapshot413458897 y recibo exacto |
| [Revisión38688731578](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38688731578) y [Pages38689030877](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38689030877) | Success; snapshot413460646 y recibo exacto |
| [Cierre38688574178](https://github.com/yodesarrollomx/sala-edicion/actions/runs/38688574178) | Success; acuse privado byte-verificado, cero escrituras de negocio, productor cero trabajos nuevos y ejecutor cero pendientes |

Estas corridas no acreditan correo recibido, producción nueva, corrección de
todas las chinches, inmutabilidad de futuros activos ni offload. La recepción
real del próximo correo diario se comprueba aparte, sin enviar correo de prueba
ni sobrescribir el espejo del Apps Script original para simular un despliegue.
