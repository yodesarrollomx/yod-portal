# Chinches: instalación, versiones y revisión

La fuente de verdad es `chinche/registro.json`. El paquete `chinche/paquete.json` fija la versión SemVer y las huellas de sus fuentes. El formato del paquete grabado sigue siendo `sequenceProtocol: 1`: cambiar de release no invalida chinches anteriores.

## Instalación

Usar la skill **instalar-mantener-chinches** con una orden como «Instala las chinches en este proyecto». El agente inspecciona su entrada, autenticación y privacidad, registra la superficie y ejecuta primero un plan. No volver a escribir el grabador por proyecto.

```sh
node scripts/chinches-paquete.cjs verificar
node scripts/chinches-paquete.cjs registrar --id mi-app --repository owner/repo --mode shared --surface index.html --capture dom-guarded
node scripts/chinches-paquete.cjs instalar --id mi-app --dest /checkout/mi-app
```

`--write` aplica el plan local. Registrar no equivale a instalar; el modo compartido prepara un fragmento que debe incluirse en la entrada comprobada del host y publicarse. Las capturas técnicas y las pantallas que no admiten captura requieren un adaptador propio: el instalador genérico las rechaza. No modifica permisos ni inventa un backend de entrega. Las copias sólo admiten bloques con una huella conocida; una divergencia detiene la instalación antes de escribir.

## Versiones y actualización coordinada

```sh
node scripts/chinches-paquete.cjs versionar --version 1.1.0
node scripts/chinches-paquete.cjs activar --version 1.1.0
node scripts/chinches-paquete.cjs plan --repos-json /estado-privado/repos.json
node scripts/chinches-paquete.cjs instalar --id amalaya-board --dest /checkout/amalaya
```

El primer comando prepara un snapshot inmutable, el segundo propone activarlo. Revisar y aplicar con `--write`, ejecutar las pruebas y publicar mediante PR. La activación cambia el objetivo de todas las instalaciones y el bloque central conocido; el plan identifica las copias atrasadas, desviaciones, publicaciones y pasos de servidor. El revisor existente coordina los PRs por repositorio y comprueba sus publicaciones, sin cambiar un grabador durante una sesión abierta.

Las aplicaciones que importan el central heredan la siguiente publicación cuando vuelven a cargarlo. Board, Amalaya y Evaluación360 conservan sus adaptadores; sus bloques se sincronizan por huella. Evaluación360 exige además regenerar el HTMLService y publicar su implementación original cuando cambie ese contenido. Una actualización Apps Script se mantiene pendiente hasta confirmar su versión activa; no se sustituye por una afirmación del repositorio.

Observaciones de versiones: `{ "integrations": [{ "id": "...", "version": "1.0.0", "publishedVersion": "1.0.0", "backendProtocol": 1, "managed": [{"path":"...","sha256":"..."}], "receiptVerified": false, "replayVerified": false }] }`. Las huellas se obtienen del bloque real, no del texto de un lock. El núcleo compartido se comprueba una sola vez con `sharedCoreSha256`. Los datos ausentes producen una acción de auditoría, nunca «todo actualizado».

Revertir con `instalar --version VERSION_ANTERIOR` desde un snapshot conocido y revertir la activación/PR cuando corresponda. Conservar IDs, IndexedDB, medios, recibos y permisos; nunca borrar chinches para revertir código.

## Revisión incremental privada

```sh
node scripts/chinches-revision.cjs plan --snapshot /estado-privado/entrada.json --state /estado-privado/chinches.json --out /estado-privado/plan.json
node scripts/chinches-revision.cjs ack --state /estado-privado/chinches.json --integration ID --id CHINCHE --hash SHA256 --stage revisado --evidence receipt:REFERENCIA
```

La entrada contiene metadatos por fuente: `schemaVersion`, `cutoff` ISO y `sources` con `integrationId`, `complete`, `observedAt`, `cursor` e `items`. Cada item lleva ID, huella y tipo `legacy` o `sequence`. La secuencia necesita recibo con ID/huella exactos y comprobación del audio, fotogramas y eventos. El audio es opcional sólo si la fuente confirma que no se grabó; un audio fallido no se convierte en revisión completa.

`plan.work` contiene el trabajo nuevo, modificado o pendiente. No cargar medios de lo que ya se revisó con la misma huella. Una lectura parcial o un error conserva el corte previo. El corte indica observación completa, no revisión. IDs omitidos y fuentes inaccesibles siguen pendientes. `ack revisado` exige integridad y evidencia; `ack cumplido` exige revisión previa y evidencia de la corrección publicada. Las referencias de evidencia no verifican por sí solas su contenido: el agente debe haberlo comprobado.

Guardar estado, planes y cursores fuera de repositorios Git. No publicar notas, audio, capturas, llaves, identificadores privados o URLs de paquetes. El registro público sólo conserva cobertura técnica. Los borradores locales de otros dispositivos no son observables desde el servidor.

El estado duradero vive en **Chinches · Control**, dentro del Buzón privado existente. `node scripts/chinches-estado.cjs export --state ARCHIVO_PRIVADO --rows FILAS_PRIVADAS` genera fragmentos con manifiesto SHA256; `import` los verifica y reconstruye el estado. Conservar encabezados, escribir como `userEnteredValue.stringValue`, reservar la tarea para un único escritor y comprobar la huella anterior antes de reemplazar todas las filas del checkpoint en un lote. Releer y verificar el resultado. Si hay conflicto, fragmentos incompletos o estado inaccesible, detener el avance de cortes y conservar el pendiente. El checkpoint inicial está vacío porque aún no acredita una revisión real; no significa cero chinches.

## Cobertura y mantenimiento

`node scripts/chinches-reporte.cjs --scan /checkout/app --repository owner/repo` detecta fuentes sin registrar. La rutina compara además cambios del catálogo y repositorios autorizados, agregando superficies nuevas al registro; cero coincidencias no acredita ausencia. `node scripts/chinches-reporte.cjs` regenera el inventario compatible y `chinche/cobertura.json`. La CI comprueba que manifiesto, registro, snapshots y vistas coincidan.

La versión inicial registra 15 integraciones. Dos integraciones indirectas siguen sin confirmar; los recibos reales y la reproducción conservan su estado pendiente. El panel `chinche/control.html` hace visibles estos límites. La configuración de una rutina no demuestra una ejecución exitosa.
