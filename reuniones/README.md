# Reuniones del proyecto

Implementación separada de la sesión y del dictado del agente. La interfaz del PPP y
Reunión en el puesto abren `../reuniones/?case_id=...` en una ventana independiente:
cambiar de estación no destruye una captura. El identificador sólo contextualiza;
no concede acceso al servidor. La página no contiene credenciales ni reuniones.

## Modo principal: sin nuevas suscripciones

La ruta activa elegida por Dirección es Notas de Voz → Drive privado → ChatGPT/Whisper
local → resultados privados. El asistente usa el conector Drive de la conversación;
no necesita una credencial OAuth de servicio, Render ni Apple Developer. El usuario
comparte el audio y solicita procesarlo. Se aplican los límites de almacenamiento,
adjuntos y uso de sus cuentas existentes; no se invoca ninguna API facturable.

La interfaz permite guardar el enlace de carpeta sólo en el navegador, abrir Drive,
preparar/compartir un archivo con la hoja nativa y copiar un encargo con el contexto
del proyecto. Compartir no acredita subida: el asistente verifica el archivo remoto
al recuperarlo. Los IDs privados, recibos reales y configuración del asistente
permanecen fuera de este repositorio. No hay vigilancia de carpetas ni acompañamiento
continuo automático. Para una revisión intermedia el usuario puede enviar un bloque
terminado y pedir análisis provisional; no se garantiza cadencia de cinco minutos.

El backend y las fuentes iOS quedan como alternativas técnicas sin activar. El
Blueprint de pago se conserva sólo como referencia opcional, fuera del modo elegido.

## Estado y alcance

- Web: captura real con MediaRecorder, journal IndexedDB, pausa, descarga, recuperación,
  señal de micrófono, protección entre pestañas y respaldo reintentable.
- Servicio: autenticación por dispositivo/actor/proyectos, audio privado por SHA256,
  fsync antes del acuse, SQLite WAL/FULL, cierre por manifiesto exacto, jobs con lease.
- Whisper: procesamiento local en servidor; borradores por bloques de cinco minutos
  (ventana final de 315 segundos, con contexto solapado) y segunda pasada final completa.
- Acompañamiento inicial: detección **por reglas**, no razonamiento del agente completo.
  Extrae citas candidatas y preguntas generales; no atribuye responsables, aprueba
  acuerdos ni modifica PPP/MOAC. Las cifras y la transcripción necesitan revisión humana.
- Drive: entrega privada ZIP con audio, transcripción y manifiesto. Identidad de archivo
  persistida antes de subir y checksum/tamaño/carpeta verificados después; reintentos
  reutilizan la identidad. Requiere OAuth/credencial y carpeta autorizada por proyecto.
- iOS: fuentes de aplicación nativa, audio PCM continuo dividido en WAV
  de ~30 segundos sin reiniciar el micrófono, fsync periódico y recuperación del PCM.
  La compilación no certifica llamadas, Bluetooth, bloqueo de pantalla ni batería.

**No está desplegado ni instalado en el teléfono por la existencia de estos archivos.**
No hay promesa de pérdida cero. El navegador puede descartar IndexedDB; cerrar o matar
el proceso puede perder la cola todavía no confirmada. El teléfono puede apagarse o
fallar físicamente. Hay que comprobar la copia remota y conservar una segunda grabación
independiente durante la validación de dispositivos.

## Ejecución aislada

```sh
cd reuniones/service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
# ffmpeg debe estar instalado.
.venv/bin/python provision.py --owner operador --project proyecto-demo --out /ruta/privada/dispositivo.json
# MEETINGS_GRANTS: lista JSON de server_grant del archivo privado, nunca device_token.
# MEETINGS_DATA: directorio persistente privado, no el repo público.
# MEETINGS_ORIGINS: orígenes exactos separados por coma, sin comodines.
.venv/bin/python run.py
```

La credencial de cada dispositivo sólo autoriza sus proyectos. Retirar su grant y
reiniciar revoca el dispositivo. No reutilizar llaves del Portero ni permitir CORS
arbitrario. El frontend guarda su credencial sólo en sessionStorage; iPhone usa
iOS Keychain. El servidor no importa sesiones del navegador.

## Despliegue preparado

`render.yaml` propone **un servicio de pago y disco de 50 GB**. No crearlo sin decidir
el recurso/coste y las credenciales. API y worker comparten disco en una instancia;
no escalar horizontalmente este diseño. El audio sigue capturándose localmente cuando
la instancia reinicia o despliega. Monitorizar espacio, trabajos en retry, retraso de
la transcripción y edad del fragmento más antiguo sin respaldo.

Configurar `MEETINGS_DRIVE_FOLDERS` como mapa de identificador de proyecto a carpeta
privada. Usar una credencial Google dedicada con acceso mínimo a esas carpetas
(OAuth de usuario o cuenta de servicio en Drive compartido, según el caso).
`MEETINGS_GOOGLE_CREDENTIALS_JSON` se materializa con permisos 0600 en el disco privado.
El conector de Drive de este chat **no proporciona por sí solo** una credencial para
un servicio autónomo. Nunca publicar su JSON en GitHub.

No hay borrado automático. Definir retención y alertas de capacidad antes de producción.
Guardar snapshots consistentes con SQLite backup + audio y comprobar restauración en
otro disco. Drive es una copia adicional posterior, no una razón para borrar el teléfono.
El servicio registra un respaldo confirmado sólo cuando todos los hashes coinciden.

## Instalación móvil

### Sólo iPhone: alternativa inmediata

Grabar con Notas de Voz, compartir la grabación y guardarla en Archivos. En esta
interfaz usar **Importar audio**, elegir el archivo y esperar a que se confirme la
copia local. La importación conserva los bytes originales; no permite cerrar una
importación incompleta como si estuviera terminada. Conservar también el original
en Notas de Voz. Este camino procesa la reunión después de importar, no acompaña
en directo. La entrega remota requiere el servicio y la credencial configurados.

### iPhone/iPad

La compilación sin firma ya pasó en GitHub Actions con macOS/Xcode; esto no instala
la aplicación en un iPhone. Para distribuirla sin Mac local, usar compilación firmada
en macOS de CI y TestFlight, con equipo Apple Developer y credenciales de firma
aportadas mediante secretos privados. El alta de Apple requiere intervención del
titular; no puede sustituirse por instalar una página web.

En un Mac con Xcode y XcodeGen: `cd mobile/ios && xcodegen generate`, abrir
`YodReuniones.xcodeproj`, elegir el equipo de firma y conectar el iPhone.
Confirmar `Background Modes > Audio` y permiso de micrófono antes de probar en dispositivo.
El audio utiliza AVAudioEngine y se almacena bajo protección disponible tras el primer
desbloqueo. Llamada o retirada del dispositivo de audio finaliza como interrumpida;
no se reanuda sin intervención. Subida durante grabación o app activa; iOS puede suspender
los reintentos al terminar/cerrar y se recuperan al abrir la app. No prometer subida
continua después de un cierre forzado. ShareLink permite exportar los WAV conservados.

## Aceptación antes de uso habitual

1. Grabar voz real 30 minutos en cada teléfono; escuchar inicio, transiciones y final.
2. Repetir con pantalla bloqueada, llamada entrante, Bluetooth retirado y auriculares.
3. Modo avión durante 10 minutos; reconectar y comparar manifiestos/checksums.
4. Matar la app, reabrir, exportar lo conservado y comprobar indicación de interrupción.
5. Espacio escaso: detener y avisar, sin borrar otra reunión para continuar.
6. Reiniciar API y worker; perder respuesta de subida y cierre; comprobar idempotencia.
7. Desconectar Drive; comprobar audio local/remoto, trabajo pendiente y entrega al volver.
8. Revocar un dispositivo; comprobar 401. Cambiar proyecto no autorizado; comprobar 403.
9. Restaurar una copia en otro servidor y comparar audio/transcripción/manifiesto.

Pruebas automatizadas: `pytest reuniones/service/test_store.py`,
`node --test tests/reuniones.test.cjs`, `tests/reuniones/browser.cjs` (Playwright y
Python indicados por variables). Los ejemplos son sintéticos; nunca subir audio real al repo.

Reversión: retirar los botones y detener ingestión, conservar servicio/datos para
exportación; no borrar disco, IndexedDB, aplicación, credenciales de descifrado ni Drive.

## Archivo del proyecto y reuniones sin PPP

La oficina ofrece «Grabar reunión nueva» sin PPP. La ficha de captura mantiene un
meeting_id y case_id nulo hasta vinculación explícita, sin crear un plan. El audio
se comparte junto con esa ficha para que el asistente mantenga la relación exacta.

Tras procesar, el asistente entrega `yod-meeting-delivery/v1`: referencias privadas
Drive, resumen, hash del original y propuestas con evidencia. En Reunión del puesto,
«Incorporar ficha» comprueba el caso; «Archivar» recibe confirmación de la memoria
privada del agente. El historial se recupera del servicio existente, no de localStorage.
Una entrega inicial se vincula explícitamente al proyecto abierto; una entrega de otro
proyecto se rechaza. No se crea PPP por grabar, importar ni vincular una reunión.

El archivo en Drive y la confirmación del agente son pasos distintos. El conector del
chat no hereda la sesión del portal: la confirmación se realiza en el puesto autenticado.
No presentar una ficha descargada como ya archivada en el agente. La memoria conserva
resumen y enlaces; no acredita lectura del audio ni aprobación de sus afirmaciones.

Los pendientes se seleccionan en la grabadora o en el puesto y se exportan como lista
para autorizar en MOAC. No se escriben tareas ni se cambian estados comerciales. La
lista identifica reunión/proyecto, cita y minuto, y conserva sin asignar/sin fecha.
