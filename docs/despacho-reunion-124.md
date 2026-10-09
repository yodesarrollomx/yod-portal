# Trabajo observable y reunión del autón · 124

2026-10-09 (UTC). Propuesta autorizada: cerrar conversación debe conservar el encargo y permitir observar cómo avanza y revisar una entrega breve en la sala.

## Antes y decisión

Los motores ya ejecutan objetivos persistentes en el servidor. La oficina, sin embargo, hacía paseos por temporizador, independientemente del trabajo. Se sustituye ese recorrido por destinos derivados de observaciones autenticadas. Sin observación vigente no se representa actividad nueva.

La interfaz ya guarda tareas y evidencias, pero obliga a leerlas como lista. Se añade una presentación determinista desde esos mismos registros: una lámina por tarea, guion, evidencia completa y una secuencia objetivo → avance → revisión. Preparado no significa aprobado. Una entrega bloqueada conserva su indicación de parcial.

## Entrega implementada en rama

- Observación del catálogo autorizado, serial y sin lanzar tareas ni cambiar el proyecto seleccionado.
- Cada puesto muestra su proyecto; biblioteca y proyector usan únicamente el expediente seleccionado.
- Lecturas de documentos llevan al área de biblioteca; entregas preparadas o parciales llevan a una silla distinta en la mesa. El resto del trabajo permanece en su computadora.
- Ficha con el mismo modelo 3D autorizado de la oficina; sin identidades reales en el repositorio público.
- Presentación con voz de la sesión vigente, preguntas e interrupción existente. No abre una segunda conexión de audio.
- Documento HTML descargable con láminas, guion y evidencia. Puede abrirse localmente y guardarse como PDF desde imprimir. No se presenta como archivo de Google Slides creado en Drive.
- Los próximos encargos usan el flujo persistente existente. El objetivo anterior debe revisarse o detenerse antes de aceptar otro.

## Verificación y límites

Pruebas pendientes al registrar esta implementación. Los escenarios de navegador son sintéticos y no acreditan voz física del usuario.

La ubicación de un personaje representa la última actividad recibida, no vídeo continuo. La observación se consulta por turnos para no multiplicar llamadas. El monitor de navegación conserva fecha de captura. La biblioteca muestra actividad y evidencias registradas; no transmite una sesión privada de Google Drive.

Persistencia de objetivos pertenece al servidor existente. Esta entrega no amplía el alcance de escritura financiera de modelos Vertical o Patrimonial legacy, ni atribuye acceso a archivos por el nombre del avatar.

Reversión: revertir este PR conserva las tareas y sus evidencias.
