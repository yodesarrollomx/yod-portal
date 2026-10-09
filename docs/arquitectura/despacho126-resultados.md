# Integración 126 · bitácora verificable
Zona horaria: America/Hermosillo (UTC−07). Fecha local: 8 de octubre de 2026.

## 22:07:31 · Autorización y línea base
El usuario autoriza la versión normal en producción: personajes con nombres cortos, actividad verificable, trabajo persistente y trazabilidad; la representación pixel queda para otra etapa. Línea base portal: ec8463ac6c3b25cd4f3574baf4fcda44ecb63616. Backend: 7e7b52529f2d97984f9389b739839606e9afec8c.
La propuesta y el impacto se registraron antes de integrar: commit 5b3e73e4fe2711b0f9b24118faded3b92cc59051. Hora exacta del commit de propuesta; los otros apartados registran el momento aproximado de la decisión, contrastable con la historia Git.

## 22:14 · Identidad y continuidad
Antes: un único marcador del personaje seleccionado, selección espacial restringida al mismo personaje y ayuda de distancias desactualizada.
Cambio: presencia de todos los personajes autorizados; proyección común separada del render; candidato cercano con histéresis y revalidación, sin cambiar caso durante voz activa. La selección no otorga permiso. Las distancias existentes se documentan como 10 m preparación, 2.6 m círculo y 2 m voz.
Los nombres cortos llegan en display_name del perfil autorizado. Se conserva avatar.name canónico en transporte para compatibilidad con clientes anteriores.

## 22:16 · Puesto, pantallas y presupuesto
Antes: pantallas comunes seguían el proyecto seleccionado y podían mostrar trabajo de otra estación.
Cambio: propietarios de biblioteca/investigación derivados de actividad confirmada; los monitores de puesto conservan su caso. PPP/Trabajo/Expediente forman una sola navegación; iniciar voz conserva la pestaña. El plano usa las mismas rutas que el recorrido.
Los avatares normales son procedurales, sin nuevos modelos ni texturas descargados. Los dispositivos que anuncian ≤4 GB usan el presupuesto gráfico compacto ya usado por pantallas táctiles. Esto no acredita por sí solo una mejora porcentual de carga.

## 22:18 · Integración previa a pruebas
Se consolidan ramas de acceso, puesto, avatares y estaciones. Los tests utilizan expedientes sintéticos; no se hacen escrituras de negocio para comprobar la interfaz. Las regresiones de voz validan protocolo y estado, no el micrófono físico del usuario.
El servidor mantiene un ejecutor/browser por su presupuesto de memoria. La cola es compartida, el progreso sólo cuenta tareas confirmadas y una entrega preparada requiere revisión. Un ejecutor que no termina queda en cuarentena; no se inicia otro encima.
Siguiente puerta: pruebas Node completas, grafo de caché, Chromium escritorio/móvil/plano y publicación de los commits exactos aprobados por esas pruebas.


## 22:30–22:38 · Contrastar pruebas y capturas
La integración 44a8d4c termina 574 pruebas: 572 aprobadas y dos fallos en fixtures de geometría/canvas. Chromium y WebKit aprueban los recorridos de autones; el recorrido de entrada adicional requiere una revisión del clic de cierre. No se clasifica toda la interfaz como terminada con esos resultados.
El análisis del grafo comprueba 99 módulos alcanzables sin referencias de caché antiguas hacia los archivos modificados. Las capturas reales descubren un defecto que las comprobaciones de estado no veían: la animación heredada escalaba la boca a un metro. Se corrige el pivote de animación conservando la dimensión del mesh y se añade regresión de altura en reposo y habla.
Modelo adulto medido: 31 mallas, 3444 triángulos, cero texturas de personaje. No equivale a medir el consumo completo de memoria ni una mejora del 50% en el Chromebook.
La captura automatizada usa render de la aplicación y expedientes sintéticos; nunca se presenta como observación de una conversación privada.

## 22:34:06 · Backend integrado
PR privada46 integrada en dfe9c7a45ddeb997c32b8bd39483be3874e68658. Cabeza de pruebas4f69a9b: 283 pruebas (282 aprobadas, una omitida), navegadores de voz/PPP y puesto aprobados.
Apps Script V72 publicada sobre la implementación existente. Verificación independiente37888901829 confirma coincidencia de HEAD y versión publicada: 189630ca1ab4d19c17f54f9e13caacbfb6aa99c44ad34240ad6275d806224d3d. Se conserva la URL/exec.

## 22:36:33–22:37:10 · Servidor publicado
Despliegue Render dep-db47qobncjis73c3vrp0, commit dfe9c7a45ddeb997c32b8bd39483be3874e68658. Render confirma estado live a las22:37:10.191. Se conservan el plan, las variables y el volumen persistente existentes. Logs de arranque muestran lecturas de contexto preparadas en1749 y1996ms, sin error en esa ventana.
Los encargos autorizados usan la cola y el estado del servidor aunque no haya una pestaña abierta. La escena representa esos eventos cuando alguien la visita; no se necesita renderizar 3D en el servidor vacío. Un encargo incierto tras reinicio requiere reanudación explícita para no repetir acciones sin certeza.

## Pendiente de evidencia
- Resultados de integración y capturas reales del render con datos sintéticos.
- Prueba de entrada pública: la configuración OAuth externa puede rechazar un origen no registrado; no se altera identidad para ocultarlo.
- La aceptación del micrófono del equipo requiere observación real del usuario.
- Vista pixel ligera, concurrencia ilimitada, aprendizaje automático acumulado y edición financiera universal no se declaran implementados.
