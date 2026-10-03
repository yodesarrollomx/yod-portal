# Fichas de los componentes

> Generado desde modelo.json. No editar a mano. Revisión 2026-10-03.41-despacho-espera · 2026-10-03.

## SYS-DESPACHO · El Despacho

Priorizar y aprobar trabajo de Dirección

- Tipo: tablero. Dominio: Operación. Responsable: Dirección.
- Evidencia: codigo. Producción: Registro en catálogo vivo verificado; frontend y nuevo Corcho requieren verificación independiente..
- Entidades: tarea, comentario, borrador, decision.
- Fuente de verdad: SHEET-OPERACION mediante GAS-OPERACION; protocolo BANDEJA en comentarios.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L16) — Sistema presente en el catálogo canónico; Catálogo vivo conciliado el 1-oct-2026: SYS-DESPACHO en Portal y Sistemas, destino canónico, fórmulas/validaciones comprobadas, permisos DP conservados. Seguimiento yod-portal#3 completado..
- Conexiones: CON-016 (SYS-DESPACHO → GAS-OPERACION); CON-033 (SYS-YOD-OS → SYS-DESPACHO); CON-047 (SYS-DESPACHO → GAS-PORTERO); CON-061 (SYS-DESPACHO → EXT-GMAIL).
- Mejoras: A · Atención comercial sin leads olvidados; D · Referidos y reactivación con control humano; G · Bloqueos y decisiones que frenan ventas y obra.

## SYS-POTENCIALES · PPP · Potenciales

Evaluar alternativas y escenarios de desarrollo

- Tipo: tablero. Dominio: Ventas. Responsable: Desarrollo y Comercial.
- Evidencia: codigo. Producción: Frontend publicado y lectura pública del piloto conciliada con Sheets; sesión de pantalla y recorrido de edición aún pendientes.
- Entidades: caso, escenario, variable_calculo, flujo_proyectado.
- Fuente de verdad: SHEET-PORTERO registra casos; libro canónico Sheets para el piloto con lectura pública verificada en v53. Los casos pendientes de migrar aún usan modelos del frontend..
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L17) — Sistema presente en el catálogo canónico; [potenciales-yod/mixto.html](https://github.com/yodesarrollomx/potenciales-yod/blob/4694f7db9a3de4d5415e711d090140e6a2875f01/mixto.html) — Frontend integrado por PR3 y publicado por Pages; código público incluye lectura del modelo nativo, cuerpos y flujo por etapas. Sesión y backend pendientes de verificación conjunta.; Lectura pública del caso y la lista del piloto comparadas con entradas, resultados, cuerpos y flujo nativos; coinciden. Evidencia operativa privada; no se ejecutaron POST de prueba..
- Conexiones: CON-019 (SYS-POTENCIALES → GAS-PORTERO); CON-034 (SYS-YOD-OS → SYS-POTENCIALES).
- Mejoras: C · Cotización, plan y siguiente paso comercial; PPP · Unificar tablero y fórmulas de potencial en Sheets.
- Pendientes: Backend de transporte v53 publicado en implementación existente. GET de caso y lista contrastados con el mismo libro y revisión; edición en pantalla y demás casos pendientes. Los casos no migrados conservan cálculo cliente..

## SYS-TRACK · Tracks de codesarrollo

Seguir hitos de proyectos

- Tipo: tablero. Dominio: Proyectos. Responsable: Dirección y responsables de proyecto.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: proyecto, hito, actividad.
- Fuente de verdad: GAS-PORTERO para tracks individuales; GAS-CATALOGO para track de codesarrollos.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L18) — Sistema presente en el catálogo canónico.
- Conexiones: CON-020 (SYS-TRACK → GAS-PORTERO); CON-035 (SYS-YOD-OS → SYS-TRACK); CON-072 (SYS-TRACK → GAS-CATALOGO).
- Mejoras: C · Cotización, plan y siguiente paso comercial.

## SYS-MIRAMAR · Real de Miramar

Gestionar trámites, inventario y costos de desarrollo

- Tipo: tablero. Dominio: Proyectos. Responsable: Desarrollo y responsable de trámites.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: proyecto, lote, hito, tramite, costo.
- Fuente de verdad: SHEET-MIRAMAR mediante GAS-MIRAMAR; alcances financieros separados.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L19) — Sistema presente en el catálogo canónico.
- Conexiones: CON-026 (SYS-MIRAMAR → GAS-MIRAMAR); CON-036 (SYS-YOD-OS → SYS-MIRAMAR); CON-050 (SYS-MIRAMAR → GAS-PORTERO).
- Mejoras: E · Folio común de proyecto y datos conciliados; F · Margen por proyecto y compromisos; G · Bloqueos y decisiones que frenan ventas y obra.

## SYS-TAREAS · MOAC

Asignar y cerrar tareas semanales

- Tipo: tablero. Dominio: Operación. Responsable: Dirección y responsables de equipo.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: tarea, responsable, estado, meta, objetivo, comentario.
- Fuente de verdad: SHEET-OPERACION para tareas y SHEET-MOAC-METAS para estrategia; motores separados.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L20) — Sistema presente en el catálogo canónico.
- Conexiones: CON-017 (SYS-TAREAS → GAS-OPERACION); CON-037 (SYS-YOD-OS → SYS-TAREAS); CON-045 (SYS-TAREAS → GAS-PORTERO); CON-067 (SYS-TAREAS → GAS-MOAC-METAS).
- Mejoras: E · Folio común de proyecto y datos conciliados; G · Bloqueos y decisiones que frenan ventas y obra; K · Indicadores confiables y rendimiento medido.

## SYS-FLUJO · Tesorería

Controlar bolsas, movimientos y compromisos de caja

- Tipo: tablero. Dominio: Finanzas. Responsable: Tesorería.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: bolsa, movimiento, pago_planificado, ingreso_esperado, historial.
- Fuente de verdad: SHEET-FLUJO mediante GAS-FLUJO; respaldo cifrado es copia de consulta.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L21) — Sistema presente en el catálogo canónico.
- Conexiones: CON-018 (SYS-FLUJO → GAS-FLUJO); CON-038 (SYS-YOD-OS → SYS-FLUJO); CON-046 (SYS-FLUJO → GAS-PORTERO).
- Mejoras: E · Folio común de proyecto y datos conciliados; F · Margen por proyecto y compromisos; H · Autorizaciones y evidencia antes de afectar dinero; I · Calendario único de cobros y aportaciones; J · Conciliación de recibido, banco y Tesorería; K · Indicadores confiables y rendimiento medido.

## SYS-INTERIORES · Aurum · Interiores

Seleccionar y documentar programa de interiores

- Tipo: tablero. Dominio: Proyectos. Responsable: Diseño y proyectos.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: proyecto, espacio, producto, seleccion, presupuesto, historial.
- Fuente de verdad: SHEET-INTERIORES mediante GAS-INTERIORES; no se comprobó segregación física por proyecto.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L22) — Sistema presente en el catálogo canónico.
- Conexiones: CON-027 (SYS-INTERIORES → GAS-INTERIORES); CON-039 (SYS-YOD-OS → SYS-INTERIORES); CON-048 (SYS-INTERIORES → GAS-PORTERO).
- Mejoras: E · Folio común de proyecto y datos conciliados; F · Margen por proyecto y compromisos.

## SYS-INVERSION · Presentación a inversionistas

Presentar oportunidades de codesarrollo

- Tipo: tablero. Dominio: Ventas. Responsable: Comercial.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: diagnostico, proyecto, lote, supuesto, acuerdo_pago.
- Fuente de verdad: SHEET-INVERSION; respaldo cifrado y cambios locales son copias.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L23) — Sistema presente en el catálogo canónico.
- Conexiones: CON-040 (SYS-YOD-OS → SYS-INVERSION); CON-069 (SYS-INVERSION → GAS-INVERSION); CON-071 (SYS-INVERSION → GAS-PORTERO); CON-075 (SYS-INVERSION → SYS-PLAN-POTENCIAL).
- Mejoras: C · Cotización, plan y siguiente paso comercial.

## SYS-MARKETING · Embudo comercial

Medir adquisición, citas, clientes y pauta

- Tipo: tablero. Dominio: Ventas. Responsable: Comercial y marketing.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: lead_agregado, cita_agregada, campaña, pieza, gasto, conversion.
- Fuente de verdad: GAS-MARKETING y GAS-PLAN-POTENCIAL para embudos; API Meta y archivos generados para publicaciones.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L24) — Sistema presente en el catálogo canónico.
- Conexiones: CON-021 (SYS-MARKETING → GAS-MARKETING); CON-022 (SYS-MARKETING → GAS-PLAN-POTENCIAL); CON-041 (SYS-YOD-OS → SYS-MARKETING); CON-049 (SYS-MARKETING → GAS-PORTERO); CON-060 (EXT-META → SYS-MARKETING); CON-076 (GAS-PLAN-POTENCIAL → SYS-MARKETING); CON-077 (SYS-SALA-OPERACION → SYS-MARKETING); CON-PUBLICADOR-MARKETING (EXT-GITHUB-PUBLISHER-APP → SYS-MARKETING).
- Mejoras: A · Atención comercial sin leads olvidados; B · Atribución desde campaña hasta venta; K · Indicadores confiables y rendimiento medido.

## SYS-OBRA · Obra en vivo

Capturar, verificar y autorizar avances de obra

- Tipo: tablero. Dominio: Obra. Responsable: Responsable de obra y autorizador.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: proyecto, unidad, partida, avance, rol, autorizacion.
- Fuente de verdad: GAS-OBRA y SHEET-OBRA; autorización no demuestra pago efectivo.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L25) — Sistema presente en el catálogo canónico.
- Conexiones: CON-029 (SYS-OBRA → GAS-OBRA); CON-042 (SYS-YOD-OS → SYS-OBRA); CON-051 (SYS-OBRA → GAS-PORTERO).
- Mejoras: E · Folio común de proyecto y datos conciliados; F · Margen por proyecto y compromisos; H · Autorizaciones y evidencia antes de afectar dinero.

## SYS-CONTROL · Control Maestro

Administrar catálogo y registro de proyectos

- Tipo: tablero. Dominio: Gobierno. Responsable: Dirección.
- Evidencia: ejecucion. Producción: Corrección técnica publicada: servidores 52/10 y frontend de PR #14 comprobados. Catálogo y permisos contrastados con lecturas acotadas; aceptación sintética y rechazo real sin credencial. Sesión Google y modificaciones operativas reales no incluidas..
- Entidades: sistema, portal, proyecto, folio.
- Fuente de verdad: Control Maestro en Google Sheets; catálogo técnico local puede divergir.
- Evidencia: [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L26) — Sistema presente en el catálogo canónico; Lecturas acotadas de Portal, registro Sistemas, esquema de Bitácora y configuración de roles/permisos, sin correos ni exportación de Accesos. Pruebas descritas en control-maestro.md..
- Conexiones: CON-043 (SYS-YOD-OS → SYS-CONTROL); CON-PPP-AUDITORIA (GAS-PORTERO → SYS-CONTROL).
- Mejoras: E · Folio común de proyecto y datos conciliados; L · Mapa vivo, contratos y cambios verificables; PPP · Unificar tablero y fórmulas de potencial en Sheets.
- Pendientes: Catálogo local y Control Maestro deben reconciliarse sin editar silenciosamente datos operativos.

## SYS-YOD-OS · YOD OS

Integrar navegación, identidad y síntesis de tableros

- Tipo: portal. Dominio: Gobierno. Responsable: Dirección.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: sistema, sesion, resumen, proyecto.
- Fuente de verdad: Catálogo de código y Control Maestro; cada indicador hereda el almacén de su dominio.
- Evidencia: [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L7) — El portal integra tableros; [yod-portal/docs/arquitectura/control-maestro.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/docs/arquitectura/control-maestro.md) — PR #14 integrado; doce archivos servidos comparados exactamente con commit 7e9094b y perfiles sintéticos sobre la publicación. No acredita sesiones ni escrituras reales..
- Conexiones: CON-033 (SYS-YOD-OS → SYS-DESPACHO); CON-034 (SYS-YOD-OS → SYS-POTENCIALES); CON-035 (SYS-YOD-OS → SYS-TRACK); CON-036 (SYS-YOD-OS → SYS-MIRAMAR); CON-037 (SYS-YOD-OS → SYS-TAREAS); CON-038 (SYS-YOD-OS → SYS-FLUJO); CON-039 (SYS-YOD-OS → SYS-INTERIORES); CON-040 (SYS-YOD-OS → SYS-INVERSION); CON-041 (SYS-YOD-OS → SYS-MARKETING); CON-042 (SYS-YOD-OS → SYS-OBRA); CON-043 (SYS-YOD-OS → SYS-CONTROL); CON-044 (SYS-YOD-OS → GAS-PORTERO); CON-052 (GAS-PLAN-POTENCIAL → SYS-YOD-OS); CON-053 (GAS-MIRAMAR → SYS-YOD-OS); CON-054 (GAS-PORTERO → SYS-YOD-OS); CON-055 (GAS-OPERACION → SYS-YOD-OS); CON-056 (GAS-CODES → SYS-YOD-OS); CON-057 (GAS-OBRA → SYS-YOD-OS); CON-065 (SYS-YOD-OS → GAS-CRM); CON-073 (SYS-YOD-OS → GAS-PORTERO-RESPALDO); CON-EMD-GITHUB-EMBED (SYS-YOD-OS → SYS-EMD).
- Mejoras: K · Indicadores confiables y rendimiento medido; L · Mapa vivo, contratos y cambios verificables.

## SYS-PLAN-POTENCIAL · Plan de Potencial

Captar dueños de terreno y convertirlos a videollamada y servicio de pago

- Tipo: captacion. Dominio: Ventas. Responsable: Responsable del proceso por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: lead, folio, actividad, cita.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [plan-potencial/CLAUDE.md](https://github.com/yodesarrollomx/plan-potencial/blob/78e616f858ad593f16891d2f5158cd46d5617bc2/CLAUDE.md#L79) — Cadena comercial documentada.
- Conexiones: CON-023 (SYS-PLAN-POTENCIAL → GAS-PLAN-POTENCIAL); CON-075 (SYS-INVERSION → SYS-PLAN-POTENCIAL).
- Mejoras: A · Atención comercial sin leads olvidados; B · Atribución desde campaña hasta venta; C · Cotización, plan y siguiente paso comercial.
- Pendientes: Confirmación de cita depende de cruce Calendar no verificable solo con frontend.

## SYS-CROKISS · CroKiss

Editor de planos con guardado que captura prospectos

- Tipo: captacion. Dominio: Ventas. Responsable: Responsable del proceso por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: plano, prospecto, evento.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [crokiss/CLAUDE.md](https://github.com/yodesarrollomx/crokiss/blob/3d440a21a6902fcefe79a124a804963613d5a31f/CLAUDE.md#L15) — Propósito comercial declarado.
- Conexiones: CON-024 (SYS-CROKISS → GAS-CROKISS).
- Mejoras: A · Atención comercial sin leads olvidados; B · Atribución desde campaña hasta venta.
- Pendientes: No se comprobó traslado de leads a CRM central.

## SYS-CODES-PORTAL · Portal de codesarrolladores

Gestionar inversiones, aportaciones, comprobantes, asesores y referidos

- Tipo: portal_cliente. Dominio: Ventas. Responsable: Responsable del proceso por confirmar.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: inversion, aportacion, proyecto, documento, referido, asesor.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [Co-desarrolladores-Yod/src/App.jsx](https://github.com/yodesarrollomx/Co-desarrolladores-Yod/blob/f15154f784f204b60946985524e83a2539f40732/src/App.jsx#L28) — Entidades del portal comercial.
- Conexiones: CON-025 (SYS-CODES-PORTAL → GAS-CODES).
- Mejoras: C · Cotización, plan y siguiente paso comercial; D · Referidos y reactivación con control humano; H · Autorizaciones y evidencia antes de afectar dinero; I · Calendario único de cobros y aportaciones; J · Conciliación de recibido, banco y Tesorería.
- Pendientes: Contrato de IDs entre proyectoId propio y PRJ del Control Maestro pendiente de verificar; Alta completa y división de pagos parciales usan varias escrituras secuenciales; revisar recuperación ante fallo parcial; El agregado del tablero cenital solicita una acción ausente en el backend versionado.

## SYS-ALQUIMIA · Alquimia Urbana

Coordinar trámites y dependencias entre equipos de proyectos

- Tipo: tablero. Dominio: Proyectos. Responsable: Responsable del proceso por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: proyecto, tramite, hito.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [alquimia-urbana/CLAUDE.md](https://github.com/yodesarrollomx/alquimia-urbana/blob/bf295e2970ad008e58fa3f216a8cfc14353cf7e8/CLAUDE.md#L8) — Separación explícita entre trámites y tareas.
- Conexiones: CON-028 (SYS-ALQUIMIA → GAS-ALQUIMIA).
- Mejoras: F · Margen por proyecto y compromisos; G · Bloqueos y decisiones que frenan ventas y obra.
- Pendientes: Backend no versionado en este repositorio.

## SYS-SALA · Sala de Edición

Proponer, decidir y producir contenido con compuertas humanas

- Tipo: produccion. Dominio: Ventas. Responsable: Editores y producción.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: pieza, version, propuesta, decision, peticion, produccion, regla, motor, trabajo_cola.
- Fuente de verdad: SHEET-SALA: propuestas, decisiones, producción, reglas, motores y cola; archivos de repositorio son superficie o respaldo.
- Evidencia: [sala-edicion/CLAUDE.md](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/CLAUDE.md#L29) — Decisiones reservadas a editores; [sala-edicion/nube/sala_cliente.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_cliente.py#L42) — El cliente automático impide decisiones editoriales antes de la red; [sala-edicion/nube/sala_productor.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_productor.py#L130) — El productor planifica compuertas de producción; [sala-edicion/nube/sala_ejecutor.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_ejecutor.py#L48) — El ejecutor solo admite etapas habilitadas por configuración.
- Conexiones: CON-031 (SYS-SALA → GAS-SALA); CON-063 (SYS-SALA → EXT-ACTIONS); CON-064 (SYS-SALA-OPERACION → SYS-SALA); CON-PUBLICADOR-SALA (EXT-GITHUB-PUBLISHER-APP → SYS-SALA).
- Mejoras: B · Atribución desde campaña hasta venta.
- Pendientes: Cambios de infraestructura y documentos históricos requieren reconciliación.

## SYS-SALA-OPERACION · Herramientas de producción

Ejecutar utilidades de producción y coordinación de contenido

- Tipo: automatizacion. Dominio: Ventas. Responsable: Responsable del proceso por confirmar.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: pieza, estado, archivo.
- Fuente de verdad: Sistema privado; detalle técnico restringido.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-064 (SYS-SALA-OPERACION → SYS-SALA); CON-077 (SYS-SALA-OPERACION → SYS-MARKETING); CON-078 (SYS-SALA-OPERACION → GAS-AUX-METRICAS).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Repositorio contiene activos y datos de operación; cobertura pública limitada a metadatos técnicos.

## SYS-OBRA-CLIENTE · Obra · módulo cliente

Publicar avance aprobado y gestionar pagos, documentos, dudas y gastos

- Tipo: portal_cliente. Dominio: Obra. Responsable: Responsable del proceso por confirmar.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: unidad, pago, documento, duda, foto, gasto.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [yod-portal/obra-app/motor/ObraCliente.gs](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra-app/motor/ObraCliente.gs#L25) — Esquemas del módulo cliente.
- Conexiones: CON-030 (SYS-OBRA-CLIENTE → GAS-OBRA-CLIENTE).
- Mejoras: H · Autorizaciones y evidencia antes de afectar dinero; I · Calendario único de cobros y aportaciones; J · Conciliación de recibido, banco y Tesorería.
- Pendientes: No se comprobó conciliación con Tesorería.

## SYS-AURUM-EXPERIENCIA · Experiencia Aurum

Redirigir preservando query y fragmento al sitio externo de Experiencia Aurum

- Tipo: redirect. Dominio: Ventas. Responsable: Responsable del proceso por confirmar.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: lead, respuesta.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [yod-portal/docs/EXPEDIENTE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/docs/EXPEDIENTE.md#L48) — Dependencia de negocio externa con identidad separada; [aurum-experiencia/index.html](https://github.com/yodesarrollomx/aurum-experiencia/blob/b67d48a8935c6747caf146cb0b69d25ea5a7ad21/index.html#L23) — El repo clonado contiene redirect, no la aplicación de captación.
- Conexiones: CON-074 (SYS-AURUM-EXPERIENCIA → EXT-AURUM-WEB).
- Mejoras: K · Indicadores confiables y rendimiento medido.
- Pendientes: Mantener separación de marca y portal decidida anteriormente.

## SYS-EMD · Evaluación de personas

Evaluación privada y seguimiento de revisiones

- Tipo: aplicacion_auxiliar. Dominio: Personas. Responsable: Responsable del proceso por confirmar.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: evaluacion, revision, chinche, contacto_preparado.
- Fuente de verdad: Sistema privado; detalle técnico restringido.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-032 (SYS-EMD → GAS-EMD); CON-EMD-DRAFTS-LOCAL (SYS-EMD → STORE-EMD-DRAFTS); CON-EMD-GITHUB-EMBED (SYS-YOD-OS → SYS-EMD).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: No hay evidencia de integración transaccional con YOD OS; mantener datos y permisos privados.

## SYS-PINTARRON · Pintarrón

Mostrar estado de sesiones a partir de un recurso cifrado

- Tipo: aplicacion_auxiliar. Dominio: Gobierno. Responsable: Responsable del proceso por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: sesion.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [pintarron/README.md](https://github.com/yodesarrollomx/pintarron/blob/8978b9aa926738c379b9721ea021d59abf193f82/README.md#L3) — Arquitectura declarada de contenido cifrado.
- Conexiones: Ninguna integración comprobada.
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: No hay evidencia de integración con procesos ERP.

## SYS-SITIO-ORG · Sitio de organización

Alojar portada y configuración de dirección pública

- Tipo: infraestructura. Dominio: Infraestructura. Responsable: Responsable del proceso por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: .
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [yodesarrollomx.github.io/README.md](https://github.com/yodesarrollomx/yodesarrollomx.github.io/blob/1835fbfc699ab17a6715576670f82f1fd474683c/README.md#L4) — Dependencia de direccionamiento de Pages.
- Conexiones: Ninguna integración comprobada.
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Estado DNS y despliegue no comprobados.

## SYS-PRUEBA-DOMINIO · Prueba de dominio

Ensayo técnico de migración de dominio y acceso

- Tipo: auxiliar. Dominio: Infraestructura. Responsable: Responsable del proceso por confirmar.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: .
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [prueba-dominio/index.html](https://github.com/yodesarrollomx/prueba-dominio/blob/957c6cbe4967753bb2f308b4b47096c2c197d76d/index.html#L156) — Entorno de comprobación de dominio.
- Conexiones: Ninguna integración comprobada.
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: No es tablero de negocio; sus consultas no prueban estado productivo.

## GAS-PORTERO · Portero y Potenciales

Servir el contrato de Portero y Potenciales

- Tipo: apps_script. Dominio: Identidad. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión53 publicada en la implementación existente. Código leído del editor coincide con el cambio guardado; configuración conservada. Lectura pública PPP de caso/lista conciliada con Sheets; activador directo instalado. Edición real, sesión de pantalla y aceptación por rol pendientes..
- Entidades: acceso, sesion, caso, escenario, track.
- Fuente de verdad: Versión53 de implementación existente observada en editor; lectura HTTP PPP contrastada con libro canónico. Evidencia API de versiones51/52 histórica; los datos operativos siguen en sus hojas..
- Evidencia: [potenciales-yod/CLAUDE.md](https://github.com/yodesarrollomx/potenciales-yod/blob/4694f7db9a3de4d5415e711d090140e6a2875f01/CLAUDE.md#L35) — Tipo de fuente disponible: ausente; Registro backends-verificados.json: versión activa 51 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección.; CHG-CONTROL-MAESTRO-001: versión 52; publicación contrastada por API y pruebas HTTP de lectura y rechazo el 2026-10-01. Detalle en control-maestro.md y registro de backends.; CHG-PPP-BACKEND-001: versión53 observada tras actualizar la implementación existente; fuente de editor releída idéntica, configuración conservada y lectura HTTP autorizada de caso/lista conciliada. Activador directo instalado; sin POST de prueba..
- Conexiones: CON-001 (GAS-PORTERO → SHEET-PORTERO); CON-019 (SYS-POTENCIALES → GAS-PORTERO); CON-020 (SYS-TRACK → GAS-PORTERO); CON-044 (SYS-YOD-OS → GAS-PORTERO); CON-045 (SYS-TAREAS → GAS-PORTERO); CON-046 (SYS-FLUJO → GAS-PORTERO); CON-047 (SYS-DESPACHO → GAS-PORTERO); CON-048 (SYS-INTERIORES → GAS-PORTERO); CON-049 (SYS-MARKETING → GAS-PORTERO); CON-050 (SYS-MIRAMAR → GAS-PORTERO); CON-051 (SYS-OBRA → GAS-PORTERO); CON-054 (GAS-PORTERO → SYS-YOD-OS); CON-071 (SYS-INVERSION → GAS-PORTERO); CON-085 (GAS-SALA → GAS-PORTERO); CON-PPP-MODELO (GAS-PORTERO → SHEET-PPP-MODELOS); CON-PPP-AUDITORIA (GAS-PORTERO → SYS-CONTROL); CON-AUTH-FLUJO (GAS-FLUJO → GAS-PORTERO); CON-AUTH-CRM (GAS-CRM → GAS-PORTERO); CON-AUTH-OBRA (GAS-OBRA → GAS-PORTERO).
- Mejoras: PPP · Unificar tablero y fórmulas de potencial en Sheets.
- Pendientes: La revisión acotada no certifica todas las operaciones de negocio ni sustituye la aceptación con usuarios reales.; Las cachés de consumidores ajenos a esta entrega pueden conservar permisos temporalmente; revisarlos al continuar cada tablero..

## SHEET-PORTERO · Datos de Portero y Potenciales

Almacenar registros del dominio identidad

- Tipo: google_sheets. Dominio: Identidad. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: acceso, sesion, caso, escenario, track.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-001 (GAS-PORTERO → SHEET-PORTERO); CON-PPP-REGISTRO (SHEET-PORTERO → SHEET-PPP-MODELOS).
- Mejoras: PPP · Unificar tablero y fórmulas de potencial en Sheets.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-CATALOGO · Catálogo del OS

Servir el contrato de Catálogo del OS

- Tipo: apps_script. Dominio: Gobierno. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión 10 publicada en la implementación existente; fuente inmutable y configuración comprobadas por API. Salud y rechazos sin credencial comprobados por HTTP. Autorización y recuperación probadas con registros sintéticos; no se ejecutaron escrituras operativas ni un recorrido autenticado real..
- Entidades: sistema, portal.
- Fuente de verdad: Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos..
- Evidencia: [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L103) — Tipo de fuente disponible: ausente; Registro backends-verificados.json: versión activa 9 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección.; CHG-CONTROL-MAESTRO-001: versión 10; publicación contrastada por API y pruebas HTTP de lectura y rechazo el 2026-10-01. Detalle en control-maestro.md y registro de backends..
- Conexiones: CON-002 (GAS-CATALOGO → SHEET-CATALOGO); CON-072 (SYS-TRACK → GAS-CATALOGO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: La revisión acotada no certifica todas las operaciones de negocio ni sustituye la aceptación con usuarios reales.; Las cachés de consumidores ajenos a esta entrega pueden conservar permisos temporalmente; revisarlos al continuar cada tablero.; Las escrituras y auditoría entre libros no son una transacción; un fallo parcial exige revisión sin reintento automático..

## SHEET-CATALOGO · Datos de Catálogo del OS

Almacenar registros del dominio gobierno

- Tipo: google_sheets. Dominio: Gobierno. Responsable: Dueño del dato por confirmar.
- Evidencia: ejecucion. Producción: Metadatos, catálogo, registro y configuración de permisos contrastados el 2026-10-01 mediante lecturas acotadas. Sin escrituras, migraciones ni exportación de identidades..
- Entidades: Sistemas, Portal, Track, Proyectos, Personas, Roles, Accesos, Dependencias institucionales, Permisos, Documentos, Tareas, Hitos, Reglas, Bitácora.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar; Metadatos y encabezados leídos mediante conector autorizado el 2026-09-30. Identificadores y registros reales omitidos de la versión pública..
- Conexiones: CON-002 (GAS-CATALOGO → SHEET-CATALOGO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Despacho sigue ausente del registro vivo; su respaldo técnico se conserva.; SYS-PORTAL y SYS-YOD-OS mantienen sus identificadores; el alias no se migró.; El catálogo de roles no concede derechos por sí solo: se aplican los recursos y banderas explícitas de Accesos..

## GAS-OPERACION · Operación y tareas

Servir el contrato de Operación y tareas

- Tipo: apps_script. Dominio: Operación. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: tarea, comentario.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [board-aurum/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/apps-script/portero-auth.gs#L63) — Tipo de fuente disponible: fragmento_autenticacion.
- Conexiones: CON-003 (GAS-OPERACION → SHEET-OPERACION); CON-016 (SYS-DESPACHO → GAS-OPERACION); CON-017 (SYS-TAREAS → GAS-OPERACION); CON-055 (GAS-OPERACION → SYS-YOD-OS); CON-DESPACHO-CORCHO-STORE (GAS-OPERACION → STORE-DESPACHO-CORCHO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código desplegado y permisos reales no contrastados.

## SHEET-OPERACION · Datos de Operación y tareas

Almacenar registros del dominio operacion

- Tipo: google_sheets. Dominio: Operación. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: tarea, comentario.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-003 (GAS-OPERACION → SHEET-OPERACION).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-FLUJO · Tesorería

Servir el contrato de Tesorería

- Tipo: apps_script. Dominio: Finanzas. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión 15 desplegada en la implementación existente y fuente contrastada por API. Correcciones acotadas probadas con dobles; recorrido real de negocio por rol pendiente..
- Entidades: bolsa, movimiento, pago_planificado, ingreso_esperado, historial.
- Fuente de verdad: Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos..
- Evidencia: [board-flujo-yod/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/board-flujo-yod/blob/ef2e6e1fade1b515d10af239bc60519417d906c4/apps-script/portero-auth.gs#L36) — Tipo de fuente disponible: fragmento_autenticacion; Registro backends-verificados.json: versión activa 15 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección..
- Conexiones: CON-004 (GAS-FLUJO → SHEET-FLUJO); CON-018 (SYS-FLUJO → GAS-FLUJO); CON-AUTH-FLUJO (GAS-FLUJO → GAS-PORTERO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Quedan reglas de autorización y recorridos de negocio por comprobar; las pruebas aisladas no acreditan todos los permisos en producción.; La idempotencia completa de pagos y la recuperación de fallos entre escrituras requieren persistencia y adaptación del cliente; no forman parte de esta corrección acotada..

## SHEET-FLUJO · Datos de Tesorería

Almacenar registros del dominio finanzas

- Tipo: google_sheets. Dominio: Finanzas. Responsable: Dueño del dato por confirmar.
- Evidencia: ejecucion. Producción: Lectura directa de estructura en Sheets el 2026-09-30; no certifica backend.
- Entidades: bolsa, movimiento, pago_planificado, ingreso_esperado, historial.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar; Metadatos y encabezados leídos mediante conector autorizado el 2026-09-30. Identificadores y registros reales omitidos de la versión pública..
- Conexiones: CON-004 (GAS-FLUJO → SHEET-FLUJO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados; Comprobaciones de integridad de datos requieren reconciliación privada antes de cualquier corrección; Zona horaria del libro difiere de la del Control Maestro; evaluar efecto en fechas límite antes de modificarla.

## GAS-MARKETING · Métricas y CRM de captación

Servir el contrato de Métricas y CRM de captación

- Tipo: apps_script. Dominio: Ventas. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: lead, gasto, actividad.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [aurum-board/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/aurum-board/blob/ed41c34892aa8554b9599f0f50f325bb7b1d4deb/apps-script/portero-auth.gs#L43) — Tipo de fuente disponible: fragmento_autenticacion.
- Conexiones: CON-005 (GAS-MARKETING → SHEET-MARKETING); CON-021 (SYS-MARKETING → GAS-MARKETING).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código desplegado y permisos reales no contrastados.

## SHEET-MARKETING · Datos de Métricas y CRM de captación

Almacenar registros del dominio ventas

- Tipo: google_sheets. Dominio: Ventas. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: lead, gasto, actividad.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-005 (GAS-MARKETING → SHEET-MARKETING).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-PLAN-POTENCIAL · Captación de Plan Potencial

Servir el contrato de Captación de Plan Potencial

- Tipo: apps_script. Dominio: Ventas. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión 16 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados..
- Entidades: lead, actividad, cita.
- Fuente de verdad: Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos..
- Evidencia: [plan-potencial/CLAUDE.md](https://github.com/yodesarrollomx/plan-potencial/blob/78e616f858ad593f16891d2f5158cd46d5617bc2/CLAUDE.md#L95) — Tipo de fuente disponible: ausente; Registro backends-verificados.json: Fuente de versión activa 16 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente..
- Conexiones: CON-006 (GAS-PLAN-POTENCIAL → SHEET-PLAN-POTENCIAL); CON-022 (SYS-MARKETING → GAS-PLAN-POTENCIAL); CON-023 (SYS-PLAN-POTENCIAL → GAS-PLAN-POTENCIAL); CON-052 (GAS-PLAN-POTENCIAL → SYS-YOD-OS); CON-059 (GAS-PLAN-POTENCIAL → EXT-CALENDAR); CON-076 (GAS-PLAN-POTENCIAL → SYS-MARKETING).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Permisos por operación y recorridos por rol pendientes de prueba.

## SHEET-PLAN-POTENCIAL · Datos de Captación de Plan Potencial

Almacenar registros del dominio ventas

- Tipo: google_sheets. Dominio: Ventas. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: lead, actividad, cita.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-006 (GAS-PLAN-POTENCIAL → SHEET-PLAN-POTENCIAL).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-CROKISS · Guardado de planos

Servir el contrato de Guardado de planos

- Tipo: apps_script. Dominio: Ventas. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: plano, evento, historial.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [crokiss/Code.gs](https://github.com/yodesarrollomx/crokiss/blob/3d440a21a6902fcefe79a124a804963613d5a31f/Code.gs#L234) — Tipo de fuente disponible: fuente_repositorio_despliegue_no_verificado.
- Conexiones: CON-007 (GAS-CROKISS → SHEET-CROKISS); CON-024 (SYS-CROKISS → GAS-CROKISS).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código desplegado y permisos reales no contrastados.

## SHEET-CROKISS · Datos de Guardado de planos

Almacenar registros del dominio ventas

- Tipo: google_sheets. Dominio: Ventas. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: plano, evento, historial.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-007 (GAS-CROKISS → SHEET-CROKISS).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-CODES · Portal de codesarrolladores

Servir el contrato de Portal de codesarrolladores

- Tipo: apps_script. Dominio: Ventas. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión 40 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados..
- Entidades: inversion, aportacion, documento, referido.
- Fuente de verdad: Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos..
- Evidencia: [Co-desarrolladores-Yod/apps_script/Código.js](https://github.com/yodesarrollomx/Co-desarrolladores-Yod/blob/f15154f784f204b60946985524e83a2539f40732/apps_script/C%C3%B3digo.js#L517) — Tipo de fuente disponible: fuente_repositorio_despliegue_no_verificado; Registro backends-verificados.json: Fuente de versión activa 40 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente..
- Conexiones: CON-008 (GAS-CODES → SHEET-CODES); CON-025 (SYS-CODES-PORTAL → GAS-CODES); CON-056 (GAS-CODES → SYS-YOD-OS); CON-062 (GAS-CODES → EXT-DRIVE).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Permisos por operación y recorridos por rol pendientes de prueba; Autenticación propia por rol; token Portero no equivale a credencial administrativa; resumenPublico no aparece entre acciones versionadas; parche/despliegue pendiente de contraste.

## SHEET-CODES · Datos de Portal de codesarrolladores

Almacenar registros del dominio ventas

- Tipo: google_sheets. Dominio: Ventas. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: inversion, aportacion, documento, referido.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-008 (GAS-CODES → SHEET-CODES).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-MIRAMAR · Miramar

Servir el contrato de Miramar

- Tipo: apps_script. Dominio: Proyectos. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: tramite, hito, lote, costo.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [real-miramar-board/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/real-miramar-board/blob/a46e513548ceb188fb631bd123ef9f682eff95bf/apps-script/portero-auth.gs#L48) — Tipo de fuente disponible: fragmento_autenticacion.
- Conexiones: CON-009 (GAS-MIRAMAR → SHEET-MIRAMAR); CON-026 (SYS-MIRAMAR → GAS-MIRAMAR); CON-053 (GAS-MIRAMAR → SYS-YOD-OS).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código desplegado y permisos reales no contrastados.

## SHEET-MIRAMAR · Datos de Miramar

Almacenar registros del dominio proyectos

- Tipo: google_sheets. Dominio: Proyectos. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: tramite, hito, lote, costo.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-009 (GAS-MIRAMAR → SHEET-MIRAMAR).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-INTERIORES · Interiores

Servir el contrato de Interiores

- Tipo: apps_script. Dominio: Proyectos. Responsable: Responsable técnico del backend.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: espacio, producto, proyecto, historial.
- Fuente de verdad: Fuente de GitHub; despliegue y datos reales por verificar.
- Evidencia: [interiores-aurum/CLAUDE.md](https://github.com/yodesarrollomx/interiores-aurum/blob/6722c50b504c2f326d29d187605b2ad126e7ce17/CLAUDE.md#L33) — Tipo de fuente disponible: ausente.
- Conexiones: CON-010 (GAS-INTERIORES → SHEET-INTERIORES); CON-027 (SYS-INTERIORES → GAS-INTERIORES).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código desplegado y permisos reales no contrastados.

## SHEET-INTERIORES · Datos de Interiores

Almacenar registros del dominio proyectos

- Tipo: google_sheets. Dominio: Proyectos. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: espacio, producto, proyecto, historial.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-010 (GAS-INTERIORES → SHEET-INTERIORES).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-ALQUIMIA · Registro del grupo

Servir el contrato de Registro del grupo

- Tipo: apps_script. Dominio: Proyectos. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión 26 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados..
- Entidades: proyecto, tramite, hito.
- Fuente de verdad: Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos..
- Evidencia: [alquimia-urbana/CLAUDE.md](https://github.com/yodesarrollomx/alquimia-urbana/blob/bf295e2970ad008e58fa3f216a8cfc14353cf7e8/CLAUDE.md#L63) — Tipo de fuente disponible: ausente; Registro backends-verificados.json: Fuente de versión activa 26 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente..
- Conexiones: CON-011 (GAS-ALQUIMIA → SHEET-ALQUIMIA); CON-028 (SYS-ALQUIMIA → GAS-ALQUIMIA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Permisos por operación y recorridos por rol pendientes de prueba.

## SHEET-ALQUIMIA · Datos de Registro del grupo

Almacenar registros del dominio proyectos

- Tipo: google_sheets. Dominio: Proyectos. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: proyecto, tramite, hito.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-011 (GAS-ALQUIMIA → SHEET-ALQUIMIA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-OBRA · Motor de obra

Servir el contrato de Motor de obra

- Tipo: apps_script. Dominio: Obra. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión 16 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados..
- Entidades: concepto, avance, rol.
- Fuente de verdad: Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos..
- Evidencia: [yod-portal/obra.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra.html#L259) — Tipo de fuente disponible: ausente; Registro backends-verificados.json: Fuente de versión activa 16 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente..
- Conexiones: CON-012 (GAS-OBRA → SHEET-OBRA); CON-029 (SYS-OBRA → GAS-OBRA); CON-057 (GAS-OBRA → SYS-YOD-OS); CON-058 (GAS-OBRA-CLIENTE → GAS-OBRA); CON-AUTH-OBRA (GAS-OBRA → GAS-PORTERO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Permisos por operación y recorridos por rol pendientes de prueba.

## SHEET-OBRA · Datos de Motor de obra

Almacenar registros del dominio obra

- Tipo: google_sheets. Dominio: Obra. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: concepto, avance, rol.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-012 (GAS-OBRA → SHEET-OBRA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-OBRA-CLIENTE · Módulo cliente de obra

Servir el contrato de Módulo cliente de obra

- Tipo: apps_script. Dominio: Obra. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: Versión 2 activa verificada por API. Diez pruebas aisladas con esquema real; operaciones de negocio en producción no ejecutadas..
- Entidades: pago, gasto, cliente_unidad.
- Fuente de verdad: Fuente de Apps Script versión 2 y libro vinculado con encabezados verificados; las hojas conservan los datos operativos..
- Evidencia: [yod-portal/obra-app/motor/ObraCliente.gs](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra-app/motor/ObraCliente.gs#L175) — Tipo de fuente disponible: fuente_repositorio_despliegue_no_verificado; Registro backends-verificados.json: Versión activa 2 contrastada con la implementación existente y el cliente; siete esquemas reales verificados y diez pruebas sintéticas aprobadas..
- Conexiones: CON-013 (GAS-OBRA-CLIENTE → SHEET-OBRA-CLIENTE); CON-030 (SYS-OBRA-CLIENTE → GAS-OBRA-CLIENTE); CON-058 (GAS-OBRA-CLIENTE → GAS-OBRA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Permisos por operación y recorridos por rol pendientes de prueba.

## SHEET-OBRA-CLIENTE · Datos de Módulo cliente de obra

Almacenar registros del dominio obra

- Tipo: google_sheets. Dominio: Obra. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: pago, gasto, cliente_unidad.
- Fuente de verdad: Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-013 (GAS-OBRA-CLIENTE → SHEET-OBRA-CLIENTE).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-SALA · Sala de Edición

Servir el contrato de Sala de Edición

- Tipo: apps_script. Dominio: Ventas. Responsable: Responsable técnico del backend.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: propuesta, decision, produccion.
- Fuente de verdad: gas/Code.gs es fuente versionada; no se comprobó igualdad con versión desplegada.
- Evidencia: [sala-edicion/gas/Code.gs](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/gas/Code.gs#L713) — Tipo de fuente disponible: fuente_repositorio_despliegue_no_verificado; [sala-edicion/gas/Code.gs](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/gas/Code.gs#L962) — Ruta de decisión editorial en el backend versionado; [sala-edicion/gas/Code.gs](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/gas/Code.gs#L27) — Esquemas de tablas de Sala.
- Conexiones: CON-014 (GAS-SALA → SHEET-SALA); CON-031 (SYS-SALA → GAS-SALA); CON-080 (SVC-SALA-PRODUCTOR → GAS-SALA); CON-082 (SVC-SALA-EJECUTOR → GAS-SALA); CON-085 (GAS-SALA → GAS-PORTERO); CON-086 (GAS-SALA → GAS-PORTERO-RESPALDO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código desplegado y permisos reales no contrastados.

## SHEET-SALA · Datos de Sala de Edición

Almacenar registros del dominio ventas

- Tipo: google_sheets. Dominio: Ventas. Responsable: Editores y producción.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: propuesta, decision, pieza, version, produccion, regla, motor, cola, historial.
- Fuente de verdad: Google Sheets de Sala; identidad física y valores vivos no inspeccionados.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-014 (GAS-SALA → SHEET-SALA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## GAS-EMD · Evaluación privada

Servir el contrato de Evaluación privada

- Tipo: apps_script. Dominio: Personas. Responsable: Responsable técnico del backend.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: evaluacion, revision, contacto_preparado.
- Fuente de verdad: Sistema privado; detalle técnico restringido.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-015 (GAS-EMD → SHEET-EMD); CON-032 (SYS-EMD → GAS-EMD); CON-EMD-PROFILES-DRIVE (GAS-EMD → EXT-DRIVE).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código desplegado y permisos reales no contrastados.

## SHEET-EMD · Datos de Evaluación privada

Almacenar registros del dominio personas

- Tipo: google_sheets. Dominio: Personas. Responsable: Dueño del dato por confirmar.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: evaluacion, revision, contacto_preparado.
- Fuente de verdad: Sistema privado; detalle técnico restringido.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-015 (GAS-EMD → SHEET-EMD).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Esquema y calidad de datos vivos no inspeccionados.

## EXT-DRIVE · Google Drive

Dependencia externa de procesos YOD OS

- Tipo: servicio_externo. Dominio: Infraestructura. Responsable: Responsable del proceso por confirmar.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: .
- Fuente de verdad: Datos del servicio externo; no inspeccionados.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-062 (GAS-CODES → EXT-DRIVE); CON-084 (SVC-SALA-EJECUTOR → EXT-DRIVE); CON-EMD-PROFILES-DRIVE (GAS-EMD → EXT-DRIVE).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Estado y permisos no comprobados.

## EXT-CALENDAR · Google Calendar

Dependencia externa de procesos YOD OS

- Tipo: servicio_externo. Dominio: Infraestructura. Responsable: Responsable del proceso por confirmar.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: .
- Fuente de verdad: Datos del servicio externo; no inspeccionados.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-059 (GAS-PLAN-POTENCIAL → EXT-CALENDAR).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Estado y permisos no comprobados.

## EXT-META · Meta

Dependencia externa de procesos YOD OS

- Tipo: servicio_externo. Dominio: Infraestructura. Responsable: Responsable del proceso por confirmar.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: .
- Fuente de verdad: Datos del servicio externo; no inspeccionados.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-060 (EXT-META → SYS-MARKETING).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Estado y permisos no comprobados.

## EXT-GMAIL · Gmail

Dependencia externa de procesos YOD OS

- Tipo: servicio_externo. Dominio: Infraestructura. Responsable: Responsable del proceso por confirmar.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: .
- Fuente de verdad: Datos del servicio externo; no inspeccionados.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-061 (SYS-DESPACHO → EXT-GMAIL).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Estado y permisos no comprobados.

## EXT-ACTIONS · GitHub Actions

Dependencia externa de procesos YOD OS

- Tipo: servicio_externo. Dominio: Infraestructura. Responsable: Responsable del proceso por confirmar.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: .
- Fuente de verdad: Datos del servicio externo; no inspeccionados.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-063 (SYS-SALA → EXT-ACTIONS); CON-079 (EXT-ACTIONS → SVC-SALA-PRODUCTOR); CON-081 (EXT-ACTIONS → SVC-SALA-EJECUTOR); CON-PUBLICADOR-IDENTIDAD (EXT-ACTIONS → EXT-GITHUB-PUBLISHER-APP).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Estado y permisos no comprobados.

## GAS-CRM · CRM comercial

Servir leads y etapas del CRM al tablero cenital

- Tipo: apps_script. Dominio: Ventas. Responsable: Responsable técnico.
- Evidencia: codigo. Producción: Versión 20 desplegada en la implementación existente y fuente contrastada por API. Correcciones acotadas probadas con dobles; recorrido real de negocio por rol pendiente. Salud técnica pública comprobada por HTTP 200 sin datos de negocio..
- Entidades: lead, etapa, seguimiento.
- Fuente de verdad: Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos..
- Evidencia: [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1800) — Endpoint específico del CRM; Registro backends-verificados.json: versión activa 20 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección..
- Conexiones: CON-065 (SYS-YOD-OS → GAS-CRM); CON-066 (GAS-CRM → SHEET-CRM); CON-AUTH-CRM (GAS-CRM → GAS-PORTERO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Quedan reglas de autorización y recorridos de negocio por comprobar; las pruebas aisladas no acreditan todos los permisos en producción..

## SHEET-CRM · Datos de CRM comercial

Almacén lógico de prospectos y seguimiento

- Tipo: google_sheets. Dominio: Ventas. Responsable: Comercial.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: lead, etapa, seguimiento.
- Fuente de verdad: Google Sheets; correspondencia física pendiente.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-066 (GAS-CRM → SHEET-CRM).
- Mejoras: Conservar y verificar alcance antes de ampliar.

## GAS-MOAC-METAS · Metas y objetivos de MOAC

Relacionar metas, objetivos y tareas

- Tipo: apps_script. Dominio: Operación. Responsable: Responsable técnico.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: meta, objetivo, tarea_objetivo.
- Fuente de verdad: Fuente desplegada no disponible.
- Evidencia: [board-aurum/src/App.jsx](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/src/App.jsx#L27) — Motor distinto para acciones moac.
- Conexiones: CON-067 (SYS-TAREAS → GAS-MOAC-METAS); CON-068 (GAS-MOAC-METAS → SHEET-MOAC-METAS).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: El libro de metas es distinto del almacén de tareas.

## SHEET-MOAC-METAS · Metas, objetivos y acciones

Almacén lógico de estrategia vinculada a tareas

- Tipo: google_sheets. Dominio: Operación. Responsable: Dirección.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: meta, objetivo, tarea_objetivo.
- Fuente de verdad: Google Sheets; esquema vivo por verificar.
- Evidencia: [board-aurum/src/App.jsx](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/src/App.jsx#L1957) — Libro documentado en código.
- Conexiones: CON-068 (GAS-MOAC-METAS → SHEET-MOAC-METAS).
- Mejoras: Conservar y verificar alcance antes de ampliar.

## GAS-INVERSION · Carpeta de inversión

Entregar contenido comercial y guardar diagnóstico de reunión

- Tipo: apps_script. Dominio: Ventas. Responsable: Responsable técnico.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: diagnostico, proyecto, lote, supuesto.
- Fuente de verdad: Apps Script desplegado no disponible.
- Evidencia: [yodesarrollo-board/CLAUDE.md](https://github.com/yodesarrollomx/yodesarrollo-board/blob/4774888ede9caf53684ed7509d36ef7ffe1e126e/CLAUDE.md#L24) — Fuente backend excluida de GitHub.
- Conexiones: CON-069 (SYS-INVERSION → GAS-INVERSION); CON-070 (GAS-INVERSION → SHEET-INVERSION).
- Mejoras: Conservar y verificar alcance antes de ampliar.

## SHEET-INVERSION · Contenido de carpeta comercial

Almacén lógico de contenido y diagnósticos comerciales

- Tipo: google_sheets. Dominio: Ventas. Responsable: Comercial.
- Evidencia: declarado. Producción: No verificado en despliegue.
- Entidades: diagnostico, proyecto, lote, supuesto.
- Fuente de verdad: Google Sheets.
- Evidencia: [yodesarrollo-board/CLAUDE.md](https://github.com/yodesarrollomx/yodesarrollo-board/blob/4774888ede9caf53684ed7509d36ef7ffe1e126e/CLAUDE.md#L21) — Precedencia de contenido.
- Conexiones: CON-070 (GAS-INVERSION → SHEET-INVERSION).
- Mejoras: Conservar y verificar alcance antes de ampliar.

## GAS-PORTERO-RESPALDO · Portero de respaldo

Reintentar autenticación ante falla del original sin reemplazarlo permanentemente

- Tipo: apps_script. Dominio: Identidad. Responsable: Responsable técnico.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: sesion.
- Fuente de verdad: Despliegue real no inspeccionado.
- Evidencia: [yod-portal/os/yod-acceso.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/yod-acceso.js#L16) — Endpoint alterno de identidad.
- Conexiones: CON-073 (SYS-YOD-OS → GAS-PORTERO-RESPALDO); CON-086 (GAS-SALA → GAS-PORTERO-RESPALDO).
- Mejoras: Conservar y verificar alcance antes de ampliar.

## EXT-AURUM-WEB · Sitio de Arquitectura de Autor

Destino externo del cuestionario de experiencia

- Tipo: sitio_externo. Dominio: Ventas. Responsable: Comercial.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: lead.
- Fuente de verdad: Repositorio externo no clonado.
- Evidencia: [aurum-experiencia/index.html](https://github.com/yodesarrollomx/aurum-experiencia/blob/b67d48a8935c6747caf146cb0b69d25ea5a7ad21/index.html#L23) — Redirect preserva parámetros y fragmento.
- Conexiones: CON-074 (SYS-AURUM-EXPERIENCIA → EXT-AURUM-WEB).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Código de experiencia activo no está en el redirect local.

## GAS-AUX-METRICAS · Fuente de métricas en utilidades auxiliares

Fuente literal de métricas consumida por scripts auxiliares; uso activo no comprobado

- Tipo: apps_script. Dominio: Ventas. Responsable: Marketing.
- Evidencia: pendiente. Producción: No verificado en despliegue.
- Entidades: lead_agregado, cita_agregada.
- Fuente de verdad: Sistema privado; detalle técnico restringido.
- Evidencia: Integración pendiente de verificar.
- Conexiones: CON-078 (SYS-SALA-OPERACION → GAS-AUX-METRICAS).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: No se demostró que el endpoint siga utilizado ni que corresponda al backend actual.

## SVC-SALA-PRODUCTOR · Productor de Sala

Abrir compuertas aprobadas y encolar trabajo sin decidir ni ejecutar

- Tipo: worker. Dominio: Ventas. Responsable: Producción.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: trabajo, pieza, version.
- Fuente de verdad: Configuración de reglas/motores y código de ejecución; ejecución viva pendiente.
- Evidencia: [sala-edicion/nube/sala_productor.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_productor.py#L130) — Abrir compuertas aprobadas y encolar trabajo sin decidir ni ejecutar.
- Conexiones: CON-079 (EXT-ACTIONS → SVC-SALA-PRODUCTOR); CON-080 (SVC-SALA-PRODUCTOR → GAS-SALA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Uso efectivo, configuración y costo en producción no comprobados.

## SVC-SALA-EJECUTOR · Ejecutor de Sala

Procesar trabajos habilitados y subir resultados

- Tipo: worker. Dominio: Ventas. Responsable: Producción.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: trabajo, pieza, version.
- Fuente de verdad: Configuración de reglas/motores y código de ejecución; ejecución viva pendiente.
- Evidencia: [sala-edicion/nube/sala_ejecutor.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_ejecutor.py#L88) — Procesar trabajos habilitados y subir resultados.
- Conexiones: CON-081 (EXT-ACTIONS → SVC-SALA-EJECUTOR); CON-082 (SVC-SALA-EJECUTOR → GAS-SALA); CON-083 (SVC-SALA-EJECUTOR → EXT-MOTORES-MEDIA); CON-084 (SVC-SALA-EJECUTOR → EXT-DRIVE).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Uso efectivo, configuración y costo en producción no comprobados.

## EXT-MOTORES-MEDIA · Motores de generación de contenido

Generar texto, imagen, escena o voz según motor configurado

- Tipo: servicio_externo. Dominio: Ventas. Responsable: Producción.
- Evidencia: codigo. Producción: No verificado en despliegue.
- Entidades: trabajo, pieza, version.
- Fuente de verdad: Configuración de reglas/motores y código de ejecución; ejecución viva pendiente.
- Evidencia: [sala-edicion/nube/sala_motores.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_motores.py#L37) — Generar texto, imagen, escena o voz según motor configurado.
- Conexiones: CON-083 (SVC-SALA-EJECUTOR → EXT-MOTORES-MEDIA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Uso efectivo, configuración y costo en producción no comprobados.

## SHEET-PPP-MODELOS · PPP · Libros de cálculo por caso

Conservar entradas, fórmulas nativas, versiones, flujos y datos de diagramas del mismo modelo por caso

- Tipo: google_sheets. Dominio: Ventas. Responsable: Dirección / propietario del libro.
- Evidencia: ejecucion. Producción: Piloto y lectura pública de caso/lista conciliados; migración general y edición en pantalla pendientes.
- Entidades: caso, version, entrada, formula, flujo, geometria, etapa, fuente, revision, cambio.
- Fuente de verdad: Libro privado por caso registrado en SHEET-PORTERO; entradas y fórmulas canónicas. El tablero transporta y presenta resultados; no replica un motor financiero..
- Evidencia: Lectura directa autorizada de un libro piloto; fórmulas nativas y versiones contrastadas. Evidencia detallada en registro operativo privado, sin publicar identificadores ni cifras.; Lectura nativa de programa por cuerpos y flujo por etapas. Campos ausentes quedan pendientes; comparación con proforma activa sin sustituir datos globales. Detalle en registro privado..
- Conexiones: CON-PPP-MODELO (GAS-PORTERO → SHEET-PPP-MODELOS); CON-PPP-REGISTRO (SHEET-PORTERO → SHEET-PPP-MODELOS).
- Mejoras: PPP · Unificar tablero y fórmulas de potencial en Sheets.
- Pendientes: La lectura pública verificada del piloto no acredita la edición completa ni otros casos; Faltan otros motores, nuevas altas, capturas por cuerpos y renta neta completa; el presupuesto mensual por etapas es preparación parcial.

## EXT-GITHUB-PUBLISHER-APP · Identidad de publicación GitHub

Crear PR automáticos con identidad propia para que se ejecuten sus revisiones obligatorias

- Tipo: servicio_externo. Dominio: Infraestructura. Responsable: Dirección técnica.
- Evidencia: propuesto. Producción: Pendiente de registro, instalación y comprobación operativa.
- Entidades: identidad temporal, pull request, repositorio autorizado.
- Fuente de verdad: GitHub App privada propiedad de la organización; configuración y llave permanecen fuera del atlas público..
- Evidencia: Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB_TOKEN; requiere registro e instalación personal de una App privada de la organización..
- Conexiones: CON-PUBLICADOR-IDENTIDAD (EXT-ACTIONS → EXT-GITHUB-PUBLISHER-APP); CON-PUBLICADOR-SALA (EXT-GITHUB-PUBLISHER-APP → SYS-SALA); CON-PUBLICADOR-MARKETING (EXT-GITHUB-PUBLISHER-APP → SYS-MARKETING).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: La instalación se limita a Sala de Edición y Marketing; no usar credenciales personales en CI; Código probado no acredita una instalación ni publicación correcta.

## STORE-EMD-DRAFTS · Borradores locales cifrados de evaluación

Conservar copia recuperable en el mismo navegador sin sustituir la confirmación del servidor

- Tipo: almacen_navegador. Dominio: Personas. Responsable: Participante autorizado del enlace vigente.
- Evidencia: propuesto. Producción: Propuesta; implementación y publicación pendientes de evidencia privada.
- Entidades: borrador_cifrado, mutacion_pendiente.
- Fuente de verdad: Copia local no confirmada; el backend conserva autoridad sobre revisiones y cierre.
- Evidencia: Diseño de recuperación local y pruebas sintéticas propuestos.
- Conexiones: CON-EMD-DRAFTS-LOCAL (SYS-EMD → STORE-EMD-DRAFTS).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Copia limitada al navegador y enlace vigentes; borrar datos del navegador o cambiar enlace puede impedir recuperación; Almacenamiento o criptografía pueden fallar; el servidor sigue siendo fuente de verdad; Concurrencia entre pestañas y confirmaciones tardías exige aislamiento y revisión explícita.

## SYS-AMALAYA · Amalaya

Seguimiento de espacios, modelos y datos del desarrollo

- Tipo: tablero. Dominio: Desarrollos. Responsable: Dirección y responsable del desarrollo.
- Evidencia: codigo. Producción: Verificación independiente de esta entrega pendiente..
- Entidades: espacio, modelo, supuesto, chinche.
- Fuente de verdad: Registros privados del desarrollo y contratos actuales del tablero; historial de chinches por ID..
- Evidencia: [amalaya-board/src/componentes/FichaEspacio.jsx](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/src/componentes/FichaEspacio.jsx) — Fuente de interfaz revisada para estados vacíos y aviso de supuestos..
- Conexiones: CON-AMALAYA-CLIENT (SYS-AMALAYA → GAS-AMALAYA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: La calidad visual no valida datos comerciales definitivos; no convertir supuestos en hechos..

## GAS-AMALAYA · Motor Amalaya

Servir contratos actuales y conciliar estados de chinches

- Tipo: apps_script. Dominio: Desarrollos. Responsable: Dirección y responsable del desarrollo.
- Evidencia: codigo. Producción: Verificación independiente de esta entrega pendiente..
- Entidades: chinche, historial.
- Fuente de verdad: Registros privados del desarrollo y contratos actuales del tablero; historial de chinches por ID..
- Evidencia: [amalaya-board/apps-script/Code.gs](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs) — Fuente contiene lectura de chinches y chincheTomada; extensión compatible propuesta..
- Conexiones: CON-AMALAYA-CLIENT (SYS-AMALAYA → GAS-AMALAYA); CON-AMALAYA-STORE (GAS-AMALAYA → SHEET-AMALAYA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: La calidad visual no valida datos comerciales definitivos; no convertir supuestos en hechos..

## SHEET-AMALAYA · Datos de Amalaya

Conservar registros operativos y chinches del desarrollo

- Tipo: google_sheets. Dominio: Desarrollos. Responsable: Dirección y responsable del desarrollo.
- Evidencia: declarado. Producción: Verificación independiente de esta entrega pendiente..
- Entidades: espacio, chinche, historial.
- Fuente de verdad: Registros privados del desarrollo y contratos actuales del tablero; historial de chinches por ID..
- Evidencia: [amalaya-board/README.md](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/README.md) — Almacén lógico del tablero; evidencia de correspondencia física y detalles permanecen privados..
- Conexiones: CON-AMALAYA-STORE (GAS-AMALAYA → SHEET-AMALAYA).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: La calidad visual no valida datos comerciales definitivos; no convertir supuestos en hechos..

## STORE-DESPACHO-CORCHO · Mi Corcho · almacén privado de Dirección

Persistir notas y ejes del Corcho en un archivo privado independiente, autorizado solo al propietario exacto

- Tipo: google_sheets. Dominio: Dirección. Responsable: Dirección / propietario único del archivo.
- Evidencia: propuesto. Producción: Preparación de infraestructura privada; integración y publicación pendientes.
- Entidades: nota, configuracion, revision.
- Fuente de verdad: Archivo privado independiente configurado por propiedad de script; no publicar identificadores ni notas.
- Evidencia: [board-aurum/apps-script/corcho.gs](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/apps-script/corcho.gs) — Contrato propuesto de almacenamiento por propiedad privada; archivo físico e identidad de ejecución por verificar en registro privado.
- Conexiones: CON-DESPACHO-CORCHO-STORE (GAS-OPERACION → STORE-DESPACHO-CORCHO).
- Mejoras: Conservar y verificar alcance antes de ampliar.
- Pendientes: Dependencia de identidad de ejecución y consentimiento vigentes para verificar privacidad antes de acceder a datos.
