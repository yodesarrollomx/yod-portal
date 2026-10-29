# Relevo de Jev Images para YOD OS, Despacho, Sala y chinches
Decisión 2026-10-28. **Propuesta documentada: no implica que el portal ni la Sala usen ya visión Jev.** Es una referencia para los agentes de los flujos existentes, no una nueva cola ni un conector público.
Fuente: https://docs.typesafe.ai/images y https://typesafe.ai/blog/jev-1-14 ; video https://youtu.be/0SFKD0xkdR8 .
## Instrucciones a Sol, Terra y Astra
- **Sol (manager)** localiza el issue/chinche/recibo, comprueba versión, identidad del tablero y permiso, y asigna un trabajo con reserva; no duplica la fila ni abre otro issue cuando ya existe.
- **Terra** puede proponer clasificar una captura como pantalla, error visible, falta de evidencia o artefacto visual. Debe cotejarla con texto, estado real, prueba funcional y documentación. Un box sólo orienta dónde revisar.
- **Astra** audita con la evidencia real y pruebas; no aprueba la corrección por la clasificación ni por alta confianza.
- Actualizar el mismo issue, hoja y recibo en su mecanismo canónico; conservar texto de usuario, adjuntos privados, fechas, permisos, estados y atribución.
## Contrato del piloto
- **No usar el MCP textual como visión.** Jev Images/Box es experimental y sólo se prueba mediante adaptador privado explícito, modelo fijado, flag apagado por defecto, muestras autorizadas y datos mínimos. No poner API keys ni capturas privadas en este repo público.
- Antes de Box preguntar presencia, validar la región normalizada y usar la caja sólo para localizar una anomalía visual. No confundir etiqueta con diagnóstico ni reparación.
- En sombra comparar con flujo actual midiendo cobertura, falsos negativos, tiempos y costo de principio a fin. Si todos pasan a GPT, omitir prefiltro hasta demostrar otra ganancia.
- 0.95 es umbral candidato de ruteo de bajo riesgo a calibrar, no porcentaje de aciertos ni permiso para cerrar una chinche.
- Prohibido cambiar roles/ACL, Portero, Apps Script, GDrive, infraestructura, estados de negocio, pipeline de Sala o publicar por el mero resultado visual.
## Cierre y comunicación
Cada resultado debe contener `source_id`, `case_id/issue_id`, `revision`, `criterion_rev`, estado `observado/preparado/aplicado/verificado`, enlaces a recibos permitidos, prueba, responsable y siguiente paso. Los agentes sólo conocen esto al leer su instrucción/repo/issue; no asumir que un chat preexistente recibió un aviso. Motor/contratos privados: `alexpueblag/yod-agent-cloud/docs/jev/IMAGENES-2026-10-28.md`.
