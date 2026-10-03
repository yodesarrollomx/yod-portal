# Evolución del sistema

## EMD issue #39 · aprobación del 2 de octubre de 2026

Se registra `CHG-EMD-ESCALA-039` y `CTR-EMD-ESCALA-CAPTURA` para `SYS-EMD`,
`GAS-EMD` y `SHEET-EMD`: nuevas capturas 1..5, NA histórico confirmado en la
misma evaluación y pregunta y colores ascendentes rojo→verde. La propuesta
cuenta con aprobación explícita; implementación y despliegue privados quedan
pendientes del agente principal. No se alteran preguntas, asignaciones,
ponderación, accesos ni datos Google. La [matriz de aceptación y reversión](emd-escala-captura.md)
exige conservar historia y mantener el guard incluso al revertir frontend.

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

## Revisión 2026-09-30.2

Se concedieron los permisos de Apps Script y se contrastaron ocho motores mediante fuente versionada y coincidencia exacta de implementación con sus clientes. El atlas registra las versiones activas y conserva pendientes las pruebas funcionales y la cobertura de otros proyectos vinculados. Los cambios adicionales del editor de Portero no se desplegaron. No se modificaron motores ni datos operativos.

## Revisión 2026-09-30.4

Se conserva la migración PPP registrada en la revisión 2026-09-30.3. Se identificó el proyecto vinculado de Obra Cliente y se comprobó que la versión activa 1 coincidía con la referencia. La corrección de filas físicas, autorización explícita y pagos recibidos pasó diez pruebas aisladas usando los siete esquemas reales. Se actualizó la misma implementación a versión 2 y se verificaron fuente, URL y permisos por API. Se conserva la reversión a versión 1; no se modificaron celdas operativas.

## Revisión 2026-10-01.2

El [PR #11](https://github.com/yodesarrollomx/yod-portal/pull/11) registró una identidad propia para los publicadores y el formulario local de consentimiento, con permisos limitados a crear PR en Sala y Marketing. Conservó los cambios concurrentes de PPP y EMD. Los dos checks del portal aprobaron; el modelo y el visor publicados contienen 73 componentes y 92 conexiones. La App sigue propuesta hasta verificar su instalación; los PR consumidores aprobados aún no acreditan publicación operativa.

## Revisión 2026-10-01.3

El [PR #12](https://github.com/yodesarrollomx/yod-portal/pull/12) registró `CTR-AUTORIZACION-OPERACIONES` y la propuesta de correcciones `CHG-BACKENDS-AUTORIZACION-001` antes de preparar candidatos. La revisión de fuentes activas se amplió a cinco motores y se contrastaron comportamientos mediante dobles. Evidencias y candidatos sensibles permanecen privados. No se modificó ningún dato de negocio ni se desplegó un motor como parte de esa propuesta.

## Revisión 2026-10-01.4

Se registraron cuatro correcciones acotadas en las implementaciones existentes: Portero 50→51, Flujo 14→15, CRM 19→20 y Catálogo 8→9. La verificación por API confirmó fuente, versión, URL y permisos. El borrador de Portero conservó sus funciones adicionales y recibió el mismo parche; esas funciones adicionales no se desplegaron. Catálogo requirió una lectura posterior para confirmar el resultado; no se repitió la escritura.

La evidencia aislada comprende 22 regresiones de Portero en ambas variantes, 12 del backend de Flujo y 5 de integración con su cliente, 38 de CRM/Catálogo y 21 del prototipo de Obra. Se añadieron al diagrama tres dependencias de autenticación constatadas en código, para un total de 95 conexiones. La salud pública de CRM devolvió sólo campos técnicos. No hubo escrituras en registros de negocio.

Permanecen pendientes la instalación personal de la App publicadora, los recorridos reales por rol y las decisiones señaladas en H. Obra conserva su versión 16: antes de integrar el prototipo se necesita confirmar el libro efectivo y la delegación. La idempotencia completa de pagos requiere persistencia y cambios coordinados del cliente; no forma parte de los dos ajustes acotados de Flujo.

## Próximas revisiones

Cada propuesta nueva obtiene un ID estable en `modelo.json` y declara componentes, contratos, pruebas y reversión. El PR explica el problema concreto y el resultado. Al integrar, registrar el commit, las comprobaciones y el entorno; al desplegar un motor, registrar también la versión y la evidencia de ejecución. Una reversión se registra como un evento nuevo y conserva la trazabilidad anterior.

Las decisiones A–L se documentan con la instrucción del propietario, dependencias, criterio de aceptación y estado. No convertir una hipótesis comercial en automatización activa sin esa decisión.

## Revisión 2026-10-01.5 · Control Maestro

Registro CHG-CONTROL-MAESTRO-001. Portero 52 y Catálogo 10 (API 1.6.0) publicados en sus implementaciones existentes; configuración y borrador adicional conservados. Se contrastó el catálogo vivo y se corrigieron navegación, visibilidad y autorización. La aceptación sintética, las comprobaciones HTTP y los límites se detallan en [control-maestro.md](control-maestro.md). La publicación del frontend se contrasta tras integrar su PR; no se hicieron escrituras de negocio ni sesiones personales.

## Revisión 2026-10-01.6 · evidencia de publicación de Control Maestro

PR #14 integrado en 7e9094bf2a70ea1ee4e790299370fe28cfc4d89b, con checks aprobados del head exacto y de la integración. Doce archivos publicados coinciden byte a byte. El atlas actualiza el estado a publicado manteniendo el límite entre aceptación sintética y uso autenticado real.
