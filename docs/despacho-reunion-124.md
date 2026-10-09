# Trabajo observable y reunión del autón · 124

2026-10-09 (UTC). Propuesta autorizada: cerrar conversación debe conservar el encargo y permitir observar cómo avanza y revisar una entrega breve en la sala.

## Antes y decisión

Los motores ya ejecutan objetivos persistentes en el servidor. La oficina, sin embargo, hacía paseos por temporizador, independientemente del trabajo. Se sustituye ese recorrido por destinos derivados de observaciones autenticadas. Sin observación vigente no se representa actividad nueva.

La interfaz ya guarda tareas y evidencias, pero obliga a leerlas como lista. Se añade una presentación determinista desde esos mismos registros: una lámina por tarea, guion, evidencia completa y una secuencia objetivo → avance → revisión. Preparado no significa aprobado. Una entrega bloqueada conserva su indicación de parcial.

## Entrega publicada

- Observación del catálogo autorizado, serial y sin lanzar tareas ni cambiar el proyecto seleccionado.
- Cada puesto muestra su proyecto; biblioteca y proyector usan únicamente el expediente seleccionado.
- Lecturas de documentos llevan al área de biblioteca; entregas preparadas o parciales llevan a una silla distinta en la mesa. El resto del trabajo permanece en su computadora.
- Ficha con el mismo modelo 3D autorizado de la oficina; sin identidades reales en el repositorio público.
- Presentación con voz de la sesión vigente, preguntas e interrupción existente. No abre una segunda conexión de audio.
- Documento HTML descargable con láminas, guion y evidencia. Puede abrirse localmente y guardarse como PDF desde imprimir. No se presenta como archivo de Google Slides creado en Drive.
- Los próximos encargos usan el flujo persistente existente. El objetivo anterior debe revisarse o detenerse antes de aceptar otro.

## Verificación y límites

517 pruebas de contratos y regresiones aprobadas. Arquitectura, impacto y verificaciones de YOD OS aprobados. Chromium comprueba escritorio y móvil, retrato sin invadir el título, PPP visible, documento descargable, narración vinculada al caso, revocación y recorrido de residentes por actividad observada. Los escenarios de navegador usan autorización y datos sintéticos y no acreditan escucha de un micrófono físico.

La ubicación de un personaje representa la última actividad recibida, no vídeo continuo. La observación se consulta por turnos para no multiplicar llamadas. El monitor de navegación conserva fecha de captura. La biblioteca muestra el extracto de una lectura completada, limitado a 8.000 caracteres, con fuente y fecha; no transmite una sesión privada de Google Drive. El servidor conserva automáticamente un guion por tarea al preparar una entrega (backend PR45).

Persistencia de objetivos pertenece al servidor existente. Esta entrega no amplía el alcance de escritura financiera de modelos Vertical o Patrimonial legacy, ni atribuye acceso a archivos por el nombre del avatar.

Reversión: revertir este PR conserva las tareas y sus evidencias.

2026-10-09 03:52 UTC: backend PR45 integrado, 267 pruebas correctas, una omitida, cero fallos. Despliegue Render dep-db469pdg1s2s738d7sjg en estado live a las 03:52:54 UTC. La interfaz se publicó posteriormente mediante PR138; el registro final siguiente conserva la evidencia.

2026-10-09 04:18 UTC: PR138 integrado en `611c762363e1a357efb8ea2b0b119e9fe56b04fb`. Cuatro verificaciones correctas sobre `092c2ba`: Arquitectura (517 pruebas), YOD OS, Chinches y Conocimiento del Despacho. Evidencia de navegador: https://github.com/yodesarrollomx/yod-portal/actions/runs/37882443953 . Comprobación HTTP de recursos publicados, invalidando caché: ejecución 37883194304 del repositorio privado de backend, correcta. El flujo se encuentra publicado; la aceptación del micrófono del usuario permanece pendiente. No se amplió la escritura financiera de otros adaptadores.
