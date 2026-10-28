# Despacho: estados, lugares y entrada — 28 octubre 2026

Implementación preparada en PR316. Los estados operativos se consultan por POST autenticado `/fast/auton-status`, cuerpo vacío, para cada identidad autorizada. La fuente privada decide admisión y actividad; el navegador valida caso, frescura y coherencia. Un error de lectura no significa baja. Aprobar una presentación conserva la etapa comercial.

| Evidencia | Lugar y pose |
| --- | --- |
| Alta y ejecución reciente | Puesto propio, sentado |
| Alta en espera | Sillón cerca de entrada, sentado |
| Stand-by | Zona apartada de puestos, de pie |
| Revisión real del consejo activa | Ante la mesa del consejo, de pie |
| Baja | Fuera de escena, expediente conservado |
| Sin datos o datos vencidos | Zona neutral, estado sin confirmar |

La entrada usa cámara en primera persona. Dirección tiene avatar propio independiente de los casos, controles de movimiento y botón para volver a vista superior conservando posición. `OFICINA_PRIMERA_PERSONA` permite revertir esta entrada. `OFICINA_ESTADOS_REALES` permanece apagado hasta instalar y verificar el lector privado. El interruptor multicaso existente sigue activo.

Validación local: 1061 pruebas del portal y 694 del motor privado pasan; una integración privada opcional de navegador queda omitida. Suite privada sin credenciales heredadas y con salida externa bloqueada. Verificadores OS, portal, accesos, obra, arquitectura y paquete de chinches pasan. Chromium con WebGL muestra entrada, cambio a vista superior y tamaño móvil 390×844; la captura de seis estados usa identidades sintéticas y no acredita actividad productiva. Baja queda fuera: cinco figuras de seis casos. No se publican nombres, fuentes ni identidades de casos reales.

El repositorio privado contiene el lector de Proyectos, el endpoint, el registro con vínculos de proyecto y múltiples modelos por caso, y la preparación de patch de Portero con comprobación de hash. El nuevo caso aún necesita registro/grant real; el puente Vertical no se ha verificado. Fuente de admisión de un piloto sin fila de Proyectos sigue pendiente. No inferir alta ni trabajo a partir de la apariencia del avatar.

Instalación bloqueada: el workflow de Apps Script está deshabilitado manualmente, confirmado en GitHub. La solicitud actual sólo lee el Portero para obtener un snapshot previo a cualquier patch. Rehabilitar ese canal requiere decisión de Dirección. No es una aprobación del consejo ni cambia etapas. La configuración privada y la lectura autenticada deben comprobarse antes de encender estados reales.

Capturas de QA local: primera persona, vista superior y proyección sintética. No son capturas de producción.

![Entrada en primera persona — QA local](evidencia/despacho-20261028/primera-persona.png)

![Estados sintéticos — QA local](evidencia/despacho-20261028/estados-sinteticos.png)

## Activación y catálogo documental

Proyección privada comprobada en Portero101 y servicio publicado: cuatro consultas autenticadas de lectura devolvieron200 con identidad y referencia correctas. Se admite lectura lenta hasta45s (máximo observado26.5s); las rondas siguen seriales. No se etiqueta trabajando sin telemetría reciente. Registros documentales no solicitan sesiones del motor ni afirman puente PPP operativo. Catálogo hasta16, seis plazas visibles y baja libera plaza conservando expediente. Reversión: apagar OFICINA_ESTADOS_REALES y YOD_AUTON_RECORDS_ENABLED; no borrar fuentes ni registros.

Pruebas ampliadas:1065 portal aprobadas;703 privadas aprobadas y1opcional omitida. Se conserva la prueba de proyección anterior con interruptor apagado de forma explícita. La expectativa activa ante herramientas sin fuente de estado es «Estado sin confirmar».
