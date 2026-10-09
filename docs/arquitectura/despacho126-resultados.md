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

## 22:49–22:57 · Revisión visual y móvil
El recorrido de escritorio dfc690c comprobó los tres personajes, cambio por proximidad, conservación del contenedor PPP durante voz, bloqueo de cambio durante conversación, recuperación, reunión y radial. El runner agotó su límite al cerrar el contexto; los pasos pendientes de móvil y plano se ejecutaron por separado en37890648925 y aprobaron. El PPP de esa matriz es un doble HTML simplificado: acredita el contenedor y su continuidad, no el tablero nativo ni sus datos privados. Chromium eligió navegación normal al volver; BFCache real no fue observado, aunque sus estados tienen regresiones de lógica.
La prueba adicional de entrada detectó un desbordamiento real del retrato móvil: translateX(-5px) movía el canvas fuera de su host 40×56. Se elimina ese desplazamiento y se conserva proporción/centrado, manteniendo el assert.
La captura también mostró una etiqueta alejada de su personaje. La proyección mundial era correcta; el sistema para evitar solapamientos la elevaba151px sin asociación visual. Se incorpora un conector fino al mismo anclaje y se retira junto a la etiqueta cuando pierde visibilidad o acceso.
La tarjeta compacta reutiliza las etiquetas humanas de actividad; ya no muestra identificadores como navegador_abrir. Estos cambios requieren el cierre del recorrido de entrada sobre la nueva cabeza antes de publicar.

## 22:57–23:10 · Cerrar defectos y distinguirlos del arnés de prueba
La revisión focal de 921919 aprueba seis comprobaciones geométricas/visuales. La captura del retrato móvil mide host 40×56 y canvas 40×45.70 centrado, sin desbordamiento. El conector de etiqueta identifica a su personaje y la tarjeta muestra la actividad en lenguaje humano.
La arquitectura exige declarar el propietario exacto de la prueba nueva de etiquetas; se corrige el registro y las 580 pruebas Node quedan aprobadas. Chromium y WebKit también aprueban.
El recorrido de entrada conservaba dos fixtures anteriores al contrato actual: faltaban la identidad y fecha de la actividad y se ordenaba ir a biblioteca mientras se comprobaba la posición sentada en su escritorio. Se actualizan los datos sintéticos a un trabajo vigente en su propia computadora, sin eliminar las aserciones.
El run37891712312 completa los asserts de escritorio, móvil y plano; agota 4 minutos cuando cierra el navegador. El límite por paso aumenta a 6 minutos en f5f0d57, manteniendo las mismas comprobaciones y el límite global. No se presenta esta demora del runner como tiempo de carga del usuario.

## 23:20–23:22 · Recorrido integrado y selector heredado
Con el margen de cierre corregido, Entrada, Reunión y Trabajo observable aprueban en 37892778658. El paso panorámico falla porque busca el antiguo marcador único; se detiene la publicación y se actualiza el arnés para seleccionar al residente correcto del HUD múltiple. Las verificaciones de posición, movimiento, asiento y revocación se mantienen. Las tres suites posteriores se comprueban aparte para detectar problemas independientes sin esperar otra cadena completa.

La contraprueba privada37893263723 confirmó tres selectores/navegaciones heredados: herramientas plegadas retiradas, transcripción convertida en sección y pendientes que ahora pertenecen a Trabajo. Se actualiza el recorrido para utilizar los controles visibles. No se elimina ninguna aserción de permisos, aislamiento ni recibos financieros.

## 23:30–23:33 · Tres suites cerradas y geometría de asiento
En e0e51c, las suites de Conocimiento, Voz y PPP colaborativo terminan correctamente en escritorio y móvil (run 37893693009), con actividad y proveedor sintéticos. El recorrido panorámico conserva una fórmula fija del esqueleto anterior para medir el asiento. Se contrasta con el anclaje físico del nuevo rig; no se amplía la tolerancia ni se elimina la comprobación de contacto.
La auditoría pública anterior recuperada también confirma un rechazo real de Google GSI para el origen del portal. Se prepara comprobación final sin sesión; la configuración del cliente Web en Google Cloud no es editable mediante las herramientas de esta sesión.

## 23:34–23:37 · Contacto físico y coste de la evidencia
Se confirma asiento correcto del rig nuevo y se reemplaza la constante antigua por Box3 de ambos muslos contra la altura real de la silla, con la misma tolerancia de 1 mm. La corrección sólo afecta al arnés.
El recorrido panorámico producía diez capturas para seis situaciones: cuatro eran duplicados JPEG impresos como base64 además de sus PNG. Se conservan las seis PNG de artefacto y todas las aserciones; se retiran cuatro capturas redundantes. Esta reducción corresponde al runner, no acredita una mejora porcentual de la aplicación.
Se proporciona a Dirección el enlace y los pasos del cliente Web para registrar el origen del portal, sin confundirlo con el cliente de escritorio de Apps Script.

## 23:39–23:43 · Resolver el acceso Google con una contraprueba
La captura de Dirección demuestra que el cliente Web y el origen ya estaban configurados. Se corrige la indicación inicial de volver a agregar el origen; se descarta el duplicado sin alterar Cloud.
El portal suprimía Referer mediante meta no-referrer. Auditoría real: mismo client_id, origin de documento correcto, petición a Google sin Origin/Referer y respuesta400.
A/B manteniendo URL/cliente/HTML y cambiando sólo la política a strict-origin: Google pasa de400 a200. La réplica con canario en query confirma Referer exacto https://yodesarrollomx.github.io/, sin ruta ni consulta. Cero errores GSI_LOGGER en la variante corregida. Evidencia privada:37894902824/job113703938601 (23:42:57/59), réplica37894864013/job113703815225. No hubo login ni uso de credenciales privadas.
Se cambia únicamente la meta del contenedor OS, manteniendo rel=noreferrer en enlaces que lo requieren. El ajuste transmite el origen necesario para GSI y evita compartir rutas/consultas, incluso hacia recursos del mismo origen. La documentación de Google recomienda enviar el origen a GSI: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid .
Esto verifica el botón de acceso y su comunicación; no equivale a acreditar un inicio de sesión personal completo ni el micrófono.


## Aceptación pendiente
Publicación del portal, comprobación anónima de los recursos servidos y entrega HTML. El micrófono físico y los datos del PPP nativo requieren una sesión real; no se declaran acreditados por fixtures.
