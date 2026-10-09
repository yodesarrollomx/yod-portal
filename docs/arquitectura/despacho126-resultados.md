# Integración 126 · bitácora verificable
Zona horaria: America/Hermosillo (UTC−07). Fecha local: 8 de octubre de 2026.

## 21:xx · Autorización y línea base
El usuario autoriza la versión normal en producción: personajes con nombres cortos, actividad verificable, trabajo persistente y trazabilidad; la representación pixel queda para otra etapa. Línea base portal: ec8463ac6c3b25cd4f3574baf4fcda44ecb63616. Backend: 7e7b52529f2d97984f9389b739839606e9afec8c.
La propuesta y el impacto se registraron antes de integrar: commit 5b3e73e4fe2711b0f9b24118faded3b92cc59051. La hora de este encabezado es aproximada: prevalece la marca de tiempo del commit Git, no una medición inventada.

## 22:14 · Identidad y continuidad
Antes: un único marcador del personaje seleccionado, selección espacial restringida al mismo personaje y ayuda de distancias desactualizada.
Cambio: presencia de todos los personajes autorizados; proyección común separada del render; candidato cercano con histéresis y revalidación, sin cambiar caso durante voz activa. La selección no otorga permiso. Las distancias existentes se documentan como 10 m preparación, 2.6 m círculo y 2 m voz.
Los nombres cortos llegan en display_name del perfil autorizado. Se conserva avatar.name canónico en transporte para compatibilidad con clientes anteriores.

## 22:16 · Puesto, pantallas y presupuesto
Antes: pantallas comunes seguían el proyecto seleccionado y podían mostrar trabajo de otra estación.
Cambio: propietarios de biblioteca/investigación derivados de actividad confirmada; los monitores de puesto conservan su caso. PPP/Trabajo/Expediente forman una sola navegación; iniciar voz conserva la pestaña. El plano usa las mismas rutas que el recorrido.
Los avatares normales son procedurales, sin nuevos modelos ni texturas descargados. Los dispositivos que anuncian ≤4 GB usan el presupuesto gráfico compacto ya usado por pantallas táctiles. Esto no acredita por sí solo una mejora porcentual de carga.

## 22:20 · Integración previa a pruebas
Se consolidan ramas de acceso, puesto, avatares y estaciones. Los tests utilizan expedientes sintéticos; no se hacen escrituras de negocio para comprobar la interfaz. Las regresiones de voz validan protocolo y estado, no el micrófono físico del usuario.
El servidor mantiene un ejecutor/browser por su presupuesto de memoria. La cola es compartida, el progreso sólo cuenta tareas confirmadas y una entrega preparada requiere revisión. Un ejecutor que no termina queda en cuarentena; no se inicia otro encima.
Siguiente puerta: pruebas Node completas, grafo de caché, Chromium escritorio/móvil/plano y publicación de los commits exactos aprobados por esas pruebas.

## Pendiente de evidencia
- Resultados de integración y capturas reales del render con datos sintéticos.
- Publicación del backend y metadatos cortos por la implementación existente de Apps Script.
- Prueba de entrada pública: la configuración OAuth externa puede rechazar un origen no registrado; no se altera identidad para ocultarlo.
- La aceptación del micrófono del equipo requiere observación real del usuario.
- Vista pixel ligera, concurrencia ilimitada, aprendizaje automático acumulado y edición financiera universal no se declaran implementados.
