# Conversación de Gastón · mejora 1

Dirección priorizó una mejora a la vez: conversación confiable y UX ordenada antes de ampliar agentes. CHG-DESPACHO-VOZ-UX-079.

## Comportamiento

- Tres estados independientes: conversación, acceso al expediente/PPP y guardado. Recibir texto no acredita persistencia ni aprobar una propuesta.
- Autoplay bloqueado ofrece Activar audio sin otra sesión ni permisos adicionales. El micrófono puede silenciarse; las indicaciones respetan ese estado.
- Esperar session.started tiene plazo propio, incluso si falla el estado del servidor. Cierre conserva audio/transporte hasta session.closed; sin confirmación permanece incompleto.
- Un intento fallido conserva la transcripción visible del mismo expediente. Se oculta mientras se valida la selección y se limpia al cambiar de expediente. Al conectar otra conversación comienza un registro nuevo.
- Descargar transcripción conserva texto exacto y tiempos en copia local, sin acreditar un recibo remoto. El aviso de pendientes anteriores no invita a repetir el encargo.
- Inicio y recuperación de contexto evitan disparos concurrentes. La transcripción no desplaza a quien esté leyendo mensajes anteriores.
- PPP y sus cálculos, permisos, JSON Live, claves y recibos mantienen sus contratos existentes. Una mejora de interfaz no decide viabilidad ni completa encargos.

## Evidencia y límites

Pruebas de contrato en tests/despacho-live.test.cjs y navegador aislado en scripts/probar-voz-ux-browser.cjs, a 1280×900 y390×844. La evidencia de CI y publicación se registra en el PR. El navegador usa protocolo, audio y datos sintéticos; no acredita voz física ni escritura del negocio.

La incidencia observada de contención/timeout del Portero sigue abierta. No se modificó su código vigente ni se declara la mejora1 operativamente completa. La aceptación exige conversación en dispositivo, recuperación del contexto, recibo real y reapertura sin duplicados. No usar escrituras de prueba en libros de negocio.

## Reversión

Revertir consumidor, estilos y versiones de caché mediante PR. Conservar historial, outbox, recibos, versiones PPP y bóvedas; no cambiar la implementación GAS.
