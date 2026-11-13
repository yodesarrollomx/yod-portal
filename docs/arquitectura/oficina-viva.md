# Oficina viva · dirección de producto y entregas
Decisión de Dirección, 6-oct-2026. La referencia es observar toda una oficina habitada, como en un simulador de vida: vista elevada, personajes y espacios legibles. No se solicita estética pixelada ni sustituir la oficina por un mapa de edificios.

## Experiencia
- Vista elevada ortográfica al entrar, también en móvil. Paredes recortadas para leer recorridos y puestos; acercar y desplazar sin perder la orientación. El recorrido a nivel de persona se conserva como segunda vista.
- Seleccionar al autón abre su puesto y PPP. Los espacios son herramientas: computadora, consulta documental, mesa de análisis y reunión.
- Un autón representa un PPP y mantiene sus incógnitas, alternativas, fuentes y pendientes. Objetivo: recomendar una alternativa viable y defendible según rendimiento, capital, riesgo, plazo, normativa y preferencias del dueño; no declarar un óptimo universal sin evidencia.
- Ciclo previsto: detectar incógnita → investigar → registrar evidencia → comparar variantes → evaluar → elegir siguiente pendiente.
- Presencia persistente no significa inferencia continua. Movimiento, pantalla, estado y resultado deben corresponder a actividad real; una animación no prueba una operación.

## Entregas en orden
1. **Panorama de la misma oficina.** Cámara elevada, recorte reversible de paredes, selección y rutas existentes. Publicado en PR109, commit efda8a7; escritorio/móvil y recursos servidos verificados. No altera autoridad del piloto.
2. **Una tarea observable de principio a fin.** Implementación CHG-TRABAJO-OBSERVABLE-098 en portal PR110 y servidor PR35: proyección privada ligada a ejecución/tarea, avance tras acuse, fuentes leídas y captura fechada en pantalla; observación no reanuda trabajo. Pruebas y despliegues en los PR. La aceptación de una investigación real del propietario se registra aparte. Vincular job/task/case con computadora, herramienta, fuente y resultado; mostrar estados leyendo, trabajando, esperando, revisión y error. Distinguir navegador vivo, captura fechada y enlace. No prometer iframe de sitios que no permiten embeberse. Usar solo URLs/capturas autorizadas y no exponer credenciales.
3. **Continuidad del PPP.** Cada resultado aporta fuente, versión, variante, motivo, criterio y recibo; recuperar tareas al reabrir. Las reanudaciones no repiten efectos y las propuestas no sobrescriben revisiones ajenas.
4. **Varios autónomos.** Registro autorizado por proyecto, puestos/rutas distintos y tareas aisladas. Verificar servidor, conversaciones, voz, resultados y permisos con dos casos antes de ampliar. El frontend multiidentidad no acredita ejecución simultánea.
5. **Investigación recurrente acotada.** Planificador por eventos y presupuesto, con condición de parada, bloqueos explícitos y revisión del dueño donde corresponde. Consultar memoria/fuentes relevantes y almacenar resultados reutilizables para reducir tiempo y tokens.

## Criterio de aceptación del siguiente recorrido
Pedir una investigación del PPP → verla asociada al personaje y a su computadora → inspeccionar la fuente y el resultado → revisar su efecto propuesto en el PPP → cerrar y recuperar el mismo estado. Evidencia separada para escenario sintético y sesión real.

## Límites actuales
El piloto autorizado y sus herramientas conservan sus capacidades efectivas. Esta documentación no instala nuevos agentes, un navegador remoto ni tareas automáticas. Registrar por separado implementación, pruebas y publicación.
