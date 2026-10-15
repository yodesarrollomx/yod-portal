# Presentación guiada entre dispositivos

Dirección conduce el mismo recorrido que ve el invitado en su celular. Se comparte el estado de la presentación, no la pantalla del dispositivo. Las orientaciones pueden ser diferentes.

El invitado puede retroceder hasta tres cuadros mientras mantiene el gesto. El esfuerzo aumenta al retroceder, nunca permite adelantarse y al soltar regresa al punto vigente del conductor. No se añade una columna que quite ancho al diagrama.

## Contrato

`CTR-PRESENTATION-GUIDED` / `CHG-PRESENTATION-GUIDED-20261015`.

La sesión usa estado técnico efímero en el runtime nativo del mismo Sitio. La creación requiere identidad de presentador autorizada; el enlace del invitado tiene capacidad de lectura separada. Los mensajes tienen versión de guion y secuencia; llegar tarde o reconectar recupera el último estado. El cierre y la expiración invalidan la sesión.

La presentación conserva el rotor, dibujos y chinches. Las anotaciones siguen su circuito privado existente y no se transmiten a los demás participantes. El estado de la sesión no sustituye el plan ni sus fuentes.

## Validación y límite

Registrar por separado código, despliegue y prueba de sincronización hospedada. El streaming depende del alojamiento; si se retiene o falla, la lectura periódica debe recuperar posiciones recientes. Los saltos se marcan explícitamente; la interpolación nunca predice cuadros futuros. Dos navegadores aislados verifican el recorrido y la revisión temporal. iPhone físico requiere aceptación del propietario.

## Recibo de entrega
+
+Primera integración publicada en el mismo Sitio como versión16 el15-oct-2026. Fuente `d16ec86fbc03dd0626b7480bf733dfc73c08cb0c`; despliegue nativo `succeeded` a las17:23UTC. Base D1 con dos tablas técnicas provisionadas, health200/ready y documento/once activos coincidentes con la fuente. Entrada nativa de inicio de sesión visible. Un visitante anónimo no controla y cabeceras de identidad no confiables no conceden permiso.
+
+Pruebas aisladas: ocho contratos con SQLite y dos parejas independientes WebKit/Chromium invirtiendo conductor e invitado. Cubren gesto acotado, retorno al estado vigente, indicador de revisión, orientaciones, recarga, offline, captura de chinches y cierre. WebKit emite un diagnóstico esperado por cancelar una lectura al navegar; no hay excepciones ni rechazos no manejados. Los originales de dibujo, rotor y chinches coinciden exactamente y la base financiera se conserva.
+
+Pendiente: primera sesión con cuentas SIWC reales, aceptación táctil en iPhone físico y medición de latencia/SSE hospedada. La lectura periódica de recuperación está disponible. Otras presentaciones conservan sus motores hasta su propia integración; no se da por adoptado globalmente este primer consumidor.
