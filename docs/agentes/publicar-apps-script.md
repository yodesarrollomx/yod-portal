# Publicar un Apps Script (backend vivo) · método para agentes

Orden de Dirección, 13-nov-2026: el agente que tenga el Chrome de Alejandro publica él mismo los
cambios de Apps Script, con este método, sin pedirle que pegue código ni que despliegue. El método
lo logró primero el chat «¿Me escuchas?» y se probó completo con la versión 110 del Portero
(13-nov-2026). En el Buzón es la guía **G37** (pestaña Guías) y la regla **27** de «Cómo trabajamos».

Sirve para cualquier proyecto de Apps Script que se edite en el navegador: el Portero, el servidor
de PPP 2, la Sala, Obra, etc. El repositorio de cada sistema es espejo: lo que corre es lo guardado
en el editor y publicado como versión de una implementación.

## Reglas que no se rompen

1. **Código vivo primero.** Se lee lo guardado en el editor, no la copia del repositorio.
2. **Lo guardado contra lo desplegado.** Si lo guardado trae cambios de otro agente que aún no se
   publican, no se publican sin su visto bueno en el Buzón.
3. **«Versión nueva» sobre la implementación existente.** Nunca «Nueva implementación»: cambia la
   URL `/exec` y deja sin backend a todos los tableros que la usan.
4. **Comprobar dos veces.** Huella sha256 en el editor antes de guardar y relectura por Drive
   después de guardar.
5. **Probar sólo con GET.** Un POST de prueba escribe filas, manda correos y gasta cuota. Nunca se
   borra `pyod_clave_v1`.

## 1. Leer el código vivo

Con el conector de Drive se exporta el proyecto completo:

```
download_file_content(fileId = <scriptId>,
                      exportMimeType = 'application/vnd.google-apps.script+json')
```

Llega un JSON con `content` en base64; adentro, `{files: [{name, type, source}]}`. Si el resultado
es grande, el conector lo guarda en un archivo; se decodifica aparte:

```python
import json, base64, hashlib
outer = json.load(open(RUTA_DEL_RESULTADO))
files = json.loads(base64.b64decode(outer['content']))['files']
for f in files:
    print(f['name'], hashlib.sha256(f['source'].encode()).hexdigest()[:12])
```

Esa es la **base**: un archivo por pieza y su huella.

## 2. Abrir el editor en una sola pestaña

`https://script.google.com/home/projects/<scriptId>/edit`. La página expone `window.monaco`. Cada
archivo es un modelo (`monaco.editor.getModels()`); su huella debe coincidir con la base:

```js
const out = [];
for (const m of monaco.editor.getModels()) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(m.getValue()));
  out.push(m.uri.path + ':' + [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 12));
}
out.join(' ')
```

`getValueLength()` cuenta unidades UTF-16: un emoji cuenta doble, por eso la longitud puede no
coincidir con Python aunque el contenido sea idéntico. La huella sí coincide.

## 3. ¿Lo guardado es lo desplegado?

- **Implementar → Gestionar implementaciones**: anotar la versión activa y su fecha; cerrar con
  Cancelar.
- **Historial del proyecto** (ícono del reloj): la fecha de «Versión actual» es la del último
  guardado. Si es posterior a la versión activa, hay cambios sin desplegar.
- Para verlos, abrir la última versión en el Historial: el editor crea modelos nuevos
  (`/editor-N/…`) con el contenido de esa versión. Se comparan contra la base por bloques de líneas
  (huella de las primeras k líneas y de las últimas k) hasta aislar las líneas distintas. Así se
  evita sacar 475 mil caracteres por la herramienta.
- Si los cambios son de otro agente y su fila del Buzón no dice que pueden publicarse, se **quitan
  temporalmente**, se publica, y se **restauran byte a byte** (paso 7). Ejemplo real: el 13-nov la
  versión guardada traía `HermesAccess.gs` y su línea de ruta, guardados por otro agente «sin
  despliegue ni activación». Se quitó sólo la línea de ruta para la versión 110 (el archivo viaja
  inerte, nadie lo llama) y se restauró después en el editor.

## 4. Editar con Monaco

- Abrir primero el archivo en la lista de la izquierda y editar el modelo del editor **visible**:

  ```js
  const ed = monaco.editor.getEditors()
    .find(e => e.getModel() && e.getDomNode() && e.getDomNode().offsetParent !== null);
  const model = ed.getModel();
  ```

  Al volver del Historial quedan editores viejos ocultos (`/editor-N` de la versión consultada);
  no se tocan.
- Los cambios se anclan a una línea de contenido **exacto y único**, nunca a un número de línea a
  ciegas, y se aplican juntos (las posiciones son las del texto original):

  ```js
  model.pushEditOperations([], [
    {range: new monaco.Range(linea, 1, linea + 1, 1), text: ''},              // borrar una línea
    {range: new monaco.Range(otra, 1, otra, 1), text: 'nueva línea\n'}         // insertar antes de «otra»
  ], () => null);
  ```

- **Archivo nuevo**: «+» junto a Archivos → Secuencia de comandos → escribir el nombre → Enter. Se
  guarda solo con un `myFunction` vacío; luego se reemplaza todo su contenido
  (`range: model.getFullModelRange()`). Los archivos se cargan en el orden de la lista: uno nuevo
  queda al final.
- Para meter el texto: si es chico, como literal JSON dentro de la llamada (generado con
  `json.dumps(..., ensure_ascii=True)`); si es grande y está en un repositorio público, con `fetch` a
  `raw.githubusercontent.com` y comprobando su sha256 antes de usarlo.

## 5. Comprobar y guardar

- Huella del modelo editado == huella esperada calculada aparte (por ejemplo, con Python sobre la
  base más el cambio).
- La herramienta del navegador **bloquea respuestas que parezcan query string o cookies** (se ve
  `[BLOCKED: Cookie/query string data]`). Devolver sólo números y huellas, nunca tokens ni líneas con
  `?recurso=…&k=…`. Si se bloquea, el código sí corrió: volver a consultar el estado sin texto.
- Guardar con el botón **«Guardar proyecto en Drive»** visible (hay otro igual, oculto). Esperar a
  que desaparezca «Guardando…»: un archivo de ~475 mil caracteres tarda de 20 a 30 segundos.
- Releer por Drive (paso 1) y comparar archivo por archivo: sólo cambia lo planeado. `node --check`
  a cada archivo como sintaxis mínima.

## 6. Publicar

Implementar → **Gestionar implementaciones** → lápiz **Editar** (si los campos siguen grises, otro
clic: el diálogo tarda en cargar) → **Versión** → «Versión nueva» → **Descripción** (ctrl+a y
escribir qué cambia, sobre qué versión y quién) → **Implementar**. Debe decir «La implementación se
ha actualizado correctamente · Versión N» con el **mismo** ID de implementación → **Hecho**.

## 7. Restaurar lo ajeno (si se quitó algo en el paso 3)

Volver a insertar lo quitado en su lugar exacto, guardar y releer por Drive: lo guardado debe ser el
original más el cambio propio, nada más.

## 8. Probar en vivo

Desde una página de `yodesarrollomx.github.io` (ahí vive la sesión), con `fetch` GET,
`credentials: 'omit'` y el token de `localStorage.pyod_clave_v1` sin imprimirlo:

- con la clave válida → `ok: true` y los conteos esperados;
- con una clave falsa → el error de siempre (`clave`, `liga`…).

Luego mirar la pantalla que usa ese dato.

## 9. Recibo

En el Buzón (fila del encargo, Intercom y Mando): versión anterior → nueva, archivos tocados con
sus huellas, cambios ajenos encontrados y qué se hizo con ellos, prueba en vivo y siguiente paso.
En el atlas, una evidencia `ejecucion` en el componente del backend.

## Caso de referencia · Portero v110 (13-nov-2026)

- Base: versión 109 (29-oct). Lo guardado traía además `HermesAccess.gs` y una línea de ruta de
  otro agente, sin visto bueno para publicarse.
- Cambio: archivo nuevo `Cartera.gs` y una línea en `doGet` (`recurso=cartera`, sólo lectura).
- Publicado como versión 110 sobre la misma implementación; la línea de Hermes se quitó para la
  versión y se restauró en el editor.
- Prueba: GET con sesión de Dirección → 19 proyectos en 7 etapas; clave falsa → `clave`. La tira de
  siete carriles del Inicio lo pinta en vivo.
