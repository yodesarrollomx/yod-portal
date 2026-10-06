# Trabajo observable en la computadora

CHG-TRABAJO-OBSERVABLE-098. Implementado en portal PR110 y servidor PR35; pruebas y despliegues se registran por separado en esos PR.

La computadora comparte una proyección privada del objetivo ejecutado: caso, ejecución, revisión fuente, tarea actual, herramienta invocada, resultado y fuentes de esa llamada. El progreso sólo se presenta como confirmado tras el acuse del backend canónico. El resultado del ejecutor se llama análisis preparado; la aceptación y estado final se consultan en Pendientes. No inicia trabajo al abrir, observar o recargar.

El servidor registra eventos acotados, sin argumentos ni razonamiento interno del modelo. Al reiniciar, una ejecución antes activa se muestra interrumpida; observar no la reanuda. Si el registro falla, se muestra observación no disponible sin convertir ese fallo en repetición de negocio. Capturas anteriores conservan fecha y vínculo de ejecución/tarea; nunca se atribuyen a una tarea distinta.

La oficina muestra la pantalla del puesto autorizado. Seleccionarla abre Computadora dentro del mismo puesto; PPP y conversación se conservan. El panel presenta la acción actual y permite desplegar pasos, fuentes y evidencia sin multiplicar controles. Se consulta mientras la página está visible, sin inferencia nueva ni consultas a documentos al observar. Cambio de caso, revocación o error de autorización retira datos e imagen.

## Prueba y límites

Probar ejecución sintética real del motor con herramientas dobles y acuses controlados: fuente correlacionada, pasos persistentes, error/cancelación, recarga y aislamiento. Probar representación 3D y panel en escritorio/móvil; comprobar por separado artefactos publicados y revisión del servidor. Una captura fechada no es transmisión de video. Esta entrega no instala múltiples workers, no crea un objetivo de negocio para probar y no convierte el análisis en aprobación financiera.
