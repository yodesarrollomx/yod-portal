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

Primera integración publicada en el mismo Sitio como versión16 el15-oct-2026. Fuente `d16ec86fbc03dd0626b7480bf733dfc73c08cb0c`; despliegue nativo `succeeded` a las17:23UTC. Base D1 con dos tablas técnicas provisionadas, health200/ready y documento/once activos coincidentes con la fuente. Entrada nativa de inicio de sesión visible. Un visitante anónimo no controla y cabeceras de identidad no confiables no conceden permiso.

Pruebas aisladas: ocho contratos con SQLite y dos parejas independientes WebKit/Chromium invirtiendo conductor e invitado. Cubren gesto acotado, retorno al estado vigente, indicador de revisión, orientaciones, recarga, offline, captura de chinches y cierre. WebKit emite un diagnóstico esperado por cancelar una lectura al navegar; no hay excepciones ni rechazos no manejados. Los originales de dibujo, rotor y chinches coinciden exactamente y la base financiera se conserva.

Pendiente: primera sesión con cuentas SIWC reales, aceptación táctil en iPhone físico y medición de latencia/SSE hospedada. La lectura periódica de recuperación está disponible. Otras presentaciones conservan sus motores hasta su propia integración; no se da por adoptado globalmente este primer consumidor.

## D17: control privado y visor permanente

`CHG-PRESENTATION-LINKS-20261015` extiende el contrato del mismo Sitio. El propietario guarda una entrada de control por capacidad sin registro. El enlace del visor y la raíz siguen el mismo canal en celular o escritorio. La llave se consume antes de preparar el diagrama o las chinches y no llega a registros, vistas previas ni fuentes compartidas. Se conserva sólo su hash en servidor. Un arrendamiento con época arbitra el relevo entre dispositivos. Terminar/reiniciar no cambia los enlaces.

Los metadatos incluyen título, descripción y tarjeta de marca distinta para control/visor. El estado compartido sólo contiene posición técnica: no voz, notas o pantallas privadas. Lecturas coalescidas de JSON resuelto por proceso, streams propios acotados por tiempo y consultas reales, cola limitada, presencia espaciada y lectura periódica de recuperación. Las notas mantienen su referencia a la raíz ya autorizada de la misma presentación sin ampliar el circuito de recepción.

Mismo Sitio, versión17 publicada15-oct-2026 18:29UTC, fuente2fee176464f02faeecb7d7dfa0fddab3710b3082, despliegue nativo succeeded con revisión de entorno2 y migración adicional sin eliminar sesiones. Rutas privadas/públicas con títulos, descripción y tarjetas de marca; llave ausente de documento, captura y estado público. Salud y13activos exactos verificados hospedados. Control móvil sin registro, visor escritorio, recarga privada y compositor de chinches pasan en producción sin enviar revisiones de negocio. Cien lectores hospedados durante304.3s, 65678eventos, todos convergen, latencia p95393ms en esta prueba. Clientes ligeros en20contextos de navegador; no certifica cien teléfonos físicos ni múltiples regiones. Trece contratos SQLite, dos parejas WebKit/Chromium y prueba aislada de cien lectores durante300.8s aprobadas. Conservados finanzas, dibujos, rotor, compositor y transporte de chinches; sólo dos referencias de captura se normalizan a la misma raíz autorizada. Aceptación física iPhone pendiente.

Límites técnicos contrastados: [Worker](https://developers.cloudflare.com/workers/platform/limits/), [D1](https://developers.cloudflare.com/d1/platform/limits/), [contexto de I/O](https://developers.cloudflare.com/workers/observability/errors/#cannot-perform-io-on-behalf-of-a-different-request). El ensayo desde una máquina no representa carga multirregional. La primera aceptación táctil física continúa separada del despliegue y las pruebas.
