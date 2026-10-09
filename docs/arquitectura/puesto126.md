# Puesto integral 126

Registro previo al código · 8-oct-2026, 22:03 Hermosillo (UTC−07).

Propuesta coordinada: CHG-DESPACHO-INTEGRAL-126. El modelo y architecture-impact.json los registra la rama de integración antes de esta implementación.

## Cambio
Mantener un solo puesto con tres destinos: PPP, Trabajo y Expediente. La reunión es un modo de Trabajo y la voz conserva la vista abierta. El PPP continúa siendo el tablero real registrado, con su handshake, escenario, revisión y recibos existentes. No se reemplaza con tarjetas ficticias ni se habilitan ajustes en modelos sin contrato de escritura.

La revalidación de acciones de voz enviará siempre el identificador de expediente actual. El inicio de voz no cambiará de pestaña. La reunión permitirá marcar explícitamente una entrega como revisada mediante el contrato canónico antes de abrir el siguiente encargo.

La conversación e historial compartirán una superficie. El texto conserva borrador; cambiar desde voz a escritura será explícito mientras el protocolo de voz no documente entrada textual. La vista móvil dará prioridad al PPP y conservará controles de voz accesibles.

## Impacto
SYS-YOD-OS, SYS-DESPACHO, SYS-DESPACHO-3D, SVC-AUTON-CLOUD y GAS-PORTERO. Sin cambio de IDs, permisos, contratos financieros, fuentes, configuración Live o herramientas de negocio. Los nombres del personaje siguen llegando del perfil autorizado.

## Verificación prevista
Pruebas aisladas de segundo y tercer expediente sin retorno implícito al piloto; revisión CAS desde la reunión, sin habilitar un segundo objetivo si falta recibo; inicio de voz desde cualquier vista sin navegación; conservación del iframe PPP al cambiar conversación; navegación y tamaño móvil. Pruebas de micrófono físico, sesión real y entregas de negocio no se acreditan por dobles.

## Reversión
Revertir sólo interfaz y llamadas contextualizadas de este cambio; conservar recibos, historial, expedientes y objetivos en servidor.
