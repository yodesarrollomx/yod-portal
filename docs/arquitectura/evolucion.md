# Evolución del sistema

## Revisión 2026-09-30.1

Se construyó el primer atlas de los 20 repositorios, con fichas de componentes, conexiones con evidencia, contratos y procesos. El JSON genera los diagramas y el visor; las propuestas A–L quedan pendientes de decisión comercial.

### Cambios preparados

| Registro | Resultado | Verificación | Publicación |
|---|---|---|---|
| CHG-ATLAS-001 | Atlas, reglas para agentes y control de impacto en GitHub | Esquema, referencias, generación determinista y navegación autónoma | Consultar PR y corrida asociados a esta revisión |
| CHG-PORTAL-DATOS-001 | Pagos usan `estado`; fuentes y automatizaciones distinguen vacío, rechazo, error y antigüedad | Pruebas sintéticas de contratos y estados | Frontend; no cambia Sheets |
| CHG-SESION-001 | Canje vigente antes de mostrar identidad; descarte de respuestas de sesiones anteriores | Pruebas de cambio de usuario, rechazo, catálogo y respuestas tardías | Frontend; requiere recorrido real por rol para cerrar producción |
| CHG-FLUJO-001 | Renderizado seguro, bloqueo de envío concurrente y aviso persistente de transferencia parcial | Pruebas de renderizado y fallos entre escrituras | No incorpora atomicidad ni idempotencia del servidor |
| CHG-OBRA-001 | Corrección de invariantes de servidor preparada en registro restringido | Diez pruebas sintéticas del motor | Pendiente acceso y contraste del Apps Script activo |
| CHG-METRICS-001 | Publicación recurrente de marketing mediante PR y revisión del commit exacto | Pruebas aisladas del publicador | Requiere permisos y protección configurados |
| CHG-SALA-PUBLICACION-001 | Publicación de recursos y datos de Sala antes de montar referencias en el motor | Pruebas aisladas del publicador | Requiere permisos, protección y observación de primera corrida |

Los commits y PR constituyen la cronología técnica. Los estados de esta tabla describen alcance; no certifican el despliegue de Apps Script. No se alteraron registros financieros reales para resolver discrepancias.

## Próximas revisiones

Cada propuesta nueva obtiene un ID estable en `modelo.json` y declara componentes, contratos, pruebas y reversión. El PR explica el problema concreto y el resultado. Al integrar, registrar el commit, las comprobaciones y el entorno; al desplegar un motor, registrar también la versión y la evidencia de ejecución. Una reversión se registra como un evento nuevo y conserva la trazabilidad anterior.

Las decisiones A–L se documentan con la instrucción del propietario, dependencias, criterio de aceptación y estado. No convertir una hipótesis comercial en automatización activa sin esa decisión.
