# YOD OS · Cobertura de la oficina

**Observación:** 2026-10-07T05:34:28Z · **Revisión:** 2026-10-07.109-encuentro-voz

**Encargado de verificación:** Coordinación técnica YOD

Inventario conciliado y asignación funcional propuesta. No concede permisos, no cambia geometría, no acredita integración operativa completa.

La ubicación es propuesta. Este documento no concede permisos, no activa herramientas y no certifica integración operativa.

- 26 sistemas y 86 componentes distribuidos exactamente una vez.
- 10 áreas; 116 conexiones registradas, 0 marcadas como verificadas en el atlas.

## Conciliación del catálogo

**Observado:** 2026-10-07T05:34:28Z

**Operativo:** SYS-PORTAL, SYS-MIRAMAR, SYS-TAREAS, SYS-FLUJO, SYS-INTERIORES, SYS-MARKETING, SYS-POTENCIALES, SYS-INVERSION, SYS-CONTROL, SYS-TRACK, SYS-OBRA, SYS-DESPACHO

**Técnico:** SYS-DESPACHO, SYS-POTENCIALES, SYS-TRACK, SYS-MIRAMAR, SYS-TAREAS, SYS-FLUJO, SYS-INTERIORES, SYS-INVERSION, SYS-MARKETING, SYS-OBRA, SYS-CONTROL

**Equivalencias declaradas:** SYS-PORTAL → SYS-YOD-OS

Los IDs originales se conservan; resolver un alias no modifica permisos.

## Dirección

**Ubicación propuesta:** decisions · 10 componentes.

### El Despacho · SYS-DESPACHO

**Función:** Priorizar y aprobar trabajo de Dirección

**Fuente oficial:** Tareas/BANDEJA: SHEET-OPERACION mediante GAS-OPERACION. Corcho: STORE-DESPACHO-CORCHO privado; adapter provisional propuesto en GAS-PORTERO conforme CTR-DESPACHO-CORCHO.

**Responsable operativo:** Dirección

**Estado registrado:** codigo. Registro en catálogo vivo verificado. Frontend Corcho integrado; routing exclusivo corchoGet/corchoSave a Portero propuesto bajo CHG-DESPACHO-CORCHO-PROVISIONAL-035; persistencia y aceptación autenticada pendientes.

**Entradas registradas:**

- https://yodesarrollomx.github.io/yod-despacho/ — Bandeja/Corcho de Dirección; destino del catálogo técnico.

**Conexiones registradas; no habilitan operaciones:**

- CON-016 · SYS-DESPACHO → GAS-OPERACION · api · Tareas ordinarias getAll/update en Operación · Estado: declarado · Ejecución no verificada en el atlas.
- CON-033 · SYS-YOD-OS → SYS-DESPACHO · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-047 · SYS-DESPACHO → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-061 · SYS-DESPACHO → EXT-GMAIL · accion\_humana\_y\_rutina · Aprobación de borradores por protocolo BANDEJA · Estado: declarado · Ejecución no verificada en el atlas.
- CON-DESPACHO-CORCHO-PORTERO · SYS-DESPACHO → GAS-PORTERO · api · Provisional: sólo corchoGet/corchoSave · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- Catálogo vivo conciliado el 1-oct-2026: SYS-DESPACHO en Portal y Sistemas, destino canónico, fórmulas/validaciones comprobadas, permisos DP conservados. Seguimiento yod-portal\#3 completado. · Estado: ejecucion · Sin revisión inmutable en esta referencia
- [Frontend Corcho integrado con CAS global, archivo/restauración y ACK; no acredita persistencia en servidor. · Estado: codigo · yodesarrollomx/yod-despacho · corcho.js · Revisión: 32330badba66dd9b23a7413498f421aeb628c9cb](https://github.com/yodesarrollomx/yod-despacho/blob/32330badba66dd9b23a7413498f421aeb628c9cb/corcho.js)

**Evidencia de conexiones:**

- CON-016 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/yod-despacho · README.md · Revisión: HEAD\_baseline
- [CON-016 · Cliente existente de tareas; separación de Corcho preparada por coordinador, todavía no integrada en el frontend publicado. · Estado: codigo · yodesarrollomx/yod-despacho · app.js · Revisión: 32330badba66dd9b23a7413498f421aeb628c9cb](https://github.com/yodesarrollomx/yod-despacho/blob/32330badba66dd9b23a7413498f421aeb628c9cb/app.js)
- CON-033 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-047 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-061 · Rutina externa declarada con aprobación humana · Estado: declarado · yodesarrollomx/yod-despacho · EJECUTOR.md · Revisión: HEAD\_baseline
- CON-DESPACHO-CORCHO-PORTERO · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 5 conexiones sin verificación de ejecución registrada.

### YOD OS · SYS-YOD-OS

**Función:** Integrar navegación, identidad y síntesis de tableros

**Fuente oficial:** Catálogo de código y Control Maestro; cada indicador hereda el almacén de su dominio

**Responsable operativo:** Dirección

**Estado registrado:** declarado. Portal PR114 publicado en Pages, commit 5eca769. Cobertura operativa completa y aceptación privada de recorridos pendientes.

**Entradas registradas:**

- os/ — Cabina YOD OS; SYS-PORTAL se conserva como alias del registro.

**Conexiones registradas; no habilitan operaciones:**

- CON-033 · SYS-YOD-OS → SYS-DESPACHO · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-034 · SYS-YOD-OS → SYS-POTENCIALES · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-035 · SYS-YOD-OS → SYS-TRACK · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-036 · SYS-YOD-OS → SYS-MIRAMAR · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-037 · SYS-YOD-OS → SYS-TAREAS · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-038 · SYS-YOD-OS → SYS-FLUJO · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-039 · SYS-YOD-OS → SYS-INTERIORES · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-040 · SYS-YOD-OS → SYS-INVERSION · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-041 · SYS-YOD-OS → SYS-MARKETING · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-042 · SYS-YOD-OS → SYS-OBRA · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-043 · SYS-YOD-OS → SYS-CONTROL · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-044 · SYS-YOD-OS → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-052 · GAS-PLAN-POTENCIAL → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-053 · GAS-MIRAMAR → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-054 · GAS-PORTERO → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-055 · GAS-OPERACION → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-056 · GAS-CODES → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-057 · GAS-OBRA → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-065 · SYS-YOD-OS → GAS-CRM · lectura\_agregada · Consulta leads del CRM · Estado: codigo · Ejecución no verificada en el atlas.
- CON-073 · SYS-YOD-OS → GAS-PORTERO-RESPALDO · autenticacion · Respaldo de identidad · Estado: codigo · Ejecución no verificada en el atlas.
- CON-EMD-GITHUB-EMBED · SYS-YOD-OS → SYS-EMD · embed · Wrapper EMD en dominio GitHub propio; legado compatible · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-OS-DESPACHO-3D · SYS-YOD-OS → SYS-DESPACHO-3D · navegacion · Ruta interna del despacho con sesión y permiso vigentes · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- El portal integra tableros · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- [PR \#14 integrado; doce archivos servidos comparados exactamente con commit 7e9094b y perfiles sintéticos sobre la publicación. No acredita sesiones ni escrituras reales. · Estado: ejecucion · yodesarrollomx/yod-portal · docs/arquitectura/control-maestro.md · Revisión: 7e9094bf2a70ea1ee4e790299370fe28cfc4d89b](https://github.com/yodesarrollomx/yod-portal/blob/7e9094bf2a70ea1ee4e790299370fe28cfc4d89b/docs/arquitectura/control-maestro.md)

**Evidencia de conexiones:**

- CON-033 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-034 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-035 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-036 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-037 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-038 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-039 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-040 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-041 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-042 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-043 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-044 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-052 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-053 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-054 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-055 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-056 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-057 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-065 · Conector de CRM · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-073 · Configuración del respaldo · Estado: codigo · yodesarrollomx/yod-portal · os/yod-acceso.js · Revisión: HEAD\_baseline
- CON-EMD-GITHUB-EMBED · Propietario confirma Pages main/raíz y ruta canónica /yod-portal/emd/; wrapper pendiente en PR separado, no evidencia de despliegue. · Estado: declarado · Sin revisión inmutable en esta referencia
- [CON-OS-DESPACHO-3D · Ruta interna del despacho con sesión y permiso vigentes · Estado: codigo · yodesarrollomx/yod-portal · os/despacho-section.js · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/os/despacho-section.js)

**Pendientes y límites:**

- 22 conexiones sin verificación de ejecución registrada.

### Control Maestro · SYS-CONTROL

**Función:** Administrar catálogo y registro de proyectos

**Fuente oficial:** Control Maestro en Google Sheets; catálogo técnico local puede divergir

**Responsable operativo:** Dirección

**Estado registrado:** ejecucion. Corrección técnica publicada: servidores 52/10 y frontend de PR \#14 comprobados. Catálogo y permisos contrastados con lecturas acotadas; aceptación sintética y rechazo real sin credencial. Sesión Google y modificaciones operativas reales no incluidas.

**Conexiones registradas; no habilitan operaciones:**

- CON-043 · SYS-YOD-OS → SYS-CONTROL · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-PPP-AUDITORIA · GAS-PORTERO → SYS-CONTROL · auditoria · Registra antes, después, actor y siguiente paso · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- Lecturas acotadas de Portal, registro Sistemas, esquema de Bitácora y configuración de roles/permisos, sin correos ni exportación de Accesos. Pruebas descritas en control-maestro.md. · Estado: ejecucion · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-043 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-PPP-AUDITORIA · Registro operativo privado actualizado; auditoría de transporte desplegada y activador de edición directa instalado. Primer evento real y recorrido de edición todavía sin observar. · Estado: codigo · Revisión: Apps Script version 53

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- Catálogo local y Control Maestro deben reconciliarse sin editar silenciosamente datos operativos

### Pintarrón · SYS-PINTARRON

**Función:** Mostrar estado de sesiones a partir de un recurso cifrado

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- Sin conexiones registradas.

**Evidencia de la ficha:**

- Arquitectura declarada de contenido cifrado · Estado: declarado · yodesarrollomx/pintarron · README.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- No hay conexiones registradas para este componente.
- No hay evidencia de integración con procesos ERP

### Portero y Potenciales · GAS-PORTERO

**Función:** Servir el contrato de Portero y Potenciales

**Fuente oficial:** Implementación existente y sus hojas canónicas; último recibo API del coordinador V66 desde V65 el 5-oct, con editor/candidato/versión inmutable iguales. Evidencias V51/V52/V53/V57/V65 históricas, con alcance y fecha propios.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Publicación API V66 desde V65 reportada por coordinador: adaptador PPP recuperado, siete archivos idénticos, misma URL/scopes/ACL y editor/candidato/versión iguales. GET real Patrimonial aprobado y 166 celdas exactas con Sheets en el caso inspeccionado; geometría pendiente. Vertical y otros casos no acreditados; aceptación final pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-001 · GAS-PORTERO → SHEET-PORTERO · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.
- CON-019 · SYS-POTENCIALES → GAS-PORTERO · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-020 · SYS-TRACK → GAS-PORTERO · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-044 · SYS-YOD-OS → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-045 · SYS-TAREAS → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-046 · SYS-FLUJO → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-047 · SYS-DESPACHO → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-048 · SYS-INTERIORES → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-049 · SYS-MARKETING → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-050 · SYS-MIRAMAR → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-051 · SYS-OBRA → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-054 · GAS-PORTERO → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-071 · SYS-INVERSION → GAS-PORTERO · autenticacion · Acceso compartido del equipo · Estado: codigo · Ejecución no verificada en el atlas.
- CON-085 · GAS-SALA → GAS-PORTERO · autenticacion · Valida credencial del OS desde servidor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-PPP-MODELO · GAS-PORTERO → SHEET-PPP-MODELOS · persistencia · Lee resultados nativos; escribe cantidades permitidas · Estado: ejecucion · Ejecución no verificada en el atlas.
- CON-PPP-AUDITORIA · GAS-PORTERO → SYS-CONTROL · auditoria · Registra antes, después, actor y siguiente paso · Estado: codigo · Ejecución no verificada en el atlas.
- CON-AUTH-FLUJO · GAS-FLUJO → GAS-PORTERO · autenticacion · Verifica credencial y acceso al módulo · Estado: codigo · Ejecución no verificada en el atlas.
- CON-AUTH-CRM · GAS-CRM → GAS-PORTERO · autenticacion · Consulta identidad y alcance de lectura · Estado: codigo · Ejecución no verificada en el atlas.
- CON-AUTH-OBRA · GAS-OBRA → GAS-PORTERO · autenticacion · Verifica credencial para operar · Estado: codigo · Ejecución no verificada en el atlas.
- CON-DESPACHO-CORCHO-PORTERO · SYS-DESPACHO → GAS-PORTERO · api · Provisional: sólo corchoGet/corchoSave · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-PORTERO-CORCHO-STORE · GAS-PORTERO → STORE-DESPACHO-CORCHO · persistencia · Provisional: CAS en Mi Corcho privado · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-PORTERO-CORCHO-DRIVE · GAS-PORTERO → EXT-DRIVE · autorizacion · Corcho: principal y ACL completos por GET · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-MOTOR-PORTERO · SVC-AUTON-CLOUD → GAS-PORTERO · api · Identidad, contexto, objetivos y cola autorizados · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: ausente · Estado: declarado · yodesarrollomx/potenciales-yod · CLAUDE.md · Revisión: HEAD\_baseline
- Registro backends-verificados.json: versión activa 51 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección. · Estado: codigo · Revisión: Apps Script version 51
- CHG-CONTROL-MAESTRO-001: versión 52; publicación contrastada por API y pruebas HTTP de lectura y rechazo el 2026-10-01. Detalle en control-maestro.md y registro de backends. · Estado: ejecucion · Revisión: Apps Script version 52
- CHG-PPP-BACKEND-001: versión53 observada tras actualizar la implementación existente; fuente de editor releída idéntica, configuración conservada y lectura HTTP autorizada de caso/lista conciliada. Activador directo instalado; sin POST de prueba. · Estado: ejecucion · Revisión: Apps Script version 53
- Preflight privado de Corcho comunicado por el coordinador: implementación existente V57, editor igual a fuente activa, principal de Dirección y scopes Drive completos ya autorizados. No acredita adapter Corcho desplegado. · Estado: declarado · Revisión: Apps Script version 57
- Relevo del coordinador confirmado por Dirección el 5-oct: fuente activa/editor V65 idénticos, adaptador Patrimonial ausente y GET sheet-model Patrimonial con error servidor; recuperación \#47 propuesta. Detalles y snapshots privados. · Estado: declarado · Revisión: Apps Script version 65; 2026-10-05
- Coordinador reporta publicación API V66 desde V65: CAS/readback confirma siete archivos idénticos y sólo Code PPP adaptado; misma URL/scopes/ACL y editor == candidato == versión inmutable V66. GET funcional posterior pendiente; sin POST de pruebas de negocio. · Estado: declarado · Revisión: Apps Script version 66; 2026-10-05
- Coordinador reporta GET real Patrimonial V66 aprobado y 166 celdas exactas con Sheets en el caso inspeccionado; dos escenarios conservan IDs y 269 campos, geometría pendiente. Acta privada fuera del repositorio. Vertical y otros casos no acreditados. · Estado: declarado · Revisión: Apps Script version 66; cotejo Patrimonial 2026-10-05

**Evidencia de conexiones:**

- CON-001 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/potenciales-yod · CLAUDE.md · Revisión: HEAD\_baseline
- CON-019 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/potenciales-yod · CLAUDE.md · Revisión: HEAD\_baseline
- CON-020 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-044 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-045 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-046 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-047 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-048 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-049 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-050 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-051 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-054 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-071 · Carga del Portero · Estado: codigo · yodesarrollomx/yodesarrollo-board · index.html · Revisión: HEAD\_baseline
- CON-085 · Valida credencial del OS desde servidor · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- CON-PPP-MODELO · Versión53 publicada; lectura HTTP de caso y lista conciliada con el libro piloto. Escritura permitida desplegada y probada con dobles; recorrido público de edición pendiente. · Estado: ejecucion · Revisión: Apps Script version 53
- CON-PPP-MODELO · Relevo del coordinador confirmado por Dirección el 5-oct: fuente activa/editor V65 idénticos, adaptador Patrimonial ausente y GET sheet-model Patrimonial con error servidor; recuperación \#47 propuesta. Detalles y snapshots privados. · Estado: declarado · Revisión: Apps Script version 65; 2026-10-05
- CON-PPP-MODELO · Coordinador reporta publicación API V66 desde V65: CAS/readback confirma siete archivos idénticos y sólo Code PPP adaptado; misma URL/scopes/ACL y editor == candidato == versión inmutable V66. GET funcional posterior pendiente; sin POST de pruebas de negocio. · Estado: declarado · Revisión: Apps Script version 66; 2026-10-05
- CON-PPP-MODELO · Coordinador reporta GET real Patrimonial V66 aprobado y 166 celdas exactas con Sheets en el caso inspeccionado; dos escenarios conservan IDs y 269 campos, geometría pendiente. Acta privada fuera del repositorio. Vertical y otros casos no acreditados. · Estado: declarado · Revisión: Apps Script version 66; cotejo Patrimonial 2026-10-05
- CON-PPP-AUDITORIA · Registro operativo privado actualizado; auditoría de transporte desplegada y activador de edición directa instalado. Primer evento real y recorrido de edición todavía sin observar. · Estado: codigo · Revisión: Apps Script version 53
- CON-AUTH-FLUJO · Revisión de fuente activa GAS-FLUJO, versión 15; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. · Estado: codigo · Revisión: Apps Script version 15
- CON-AUTH-CRM · Revisión de fuente activa GAS-CRM, versión 20; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. · Estado: codigo · Revisión: Apps Script version 20
- CON-AUTH-OBRA · Revisión de fuente activa GAS-OBRA, versión 16; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. · Estado: codigo · Revisión: Apps Script version 16
- CON-DESPACHO-CORCHO-PORTERO · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-PORTERO-CORCHO-STORE · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-PORTERO-CORCHO-DRIVE · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-MOTOR-PORTERO · Identidad, contexto, objetivos y cola autorizados · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/server.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/server.mjs)

**Pendientes y límites:**

- 23 conexiones sin verificación de ejecución registrada.
- La revisión acotada no certifica todas las operaciones de negocio ni sustituye la aceptación con usuarios reales.
- Las cachés de consumidores ajenos a esta entrega pueden conservar permisos temporalmente; revisarlos al continuar cada tablero.

### Datos de Portero y Potenciales · SHEET-PORTERO

**Función:** Almacenar registros del dominio identidad

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-001 · GAS-PORTERO → SHEET-PORTERO · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.
- CON-PPP-REGISTRO · SHEET-PORTERO → SHEET-PPP-MODELOS · registro · Registra caso, libro, carpeta y revisión del modelo · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-001 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/potenciales-yod · CLAUDE.md · Revisión: HEAD\_baseline
- CON-PPP-REGISTRO · Registro del piloto creado; organización y generación para todos los casos pendientes. · Estado: declarado · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 2 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Catálogo del OS · GAS-CATALOGO

**Función:** Servir el contrato de Catálogo del OS

**Fuente oficial:** Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Versión 10 publicada en la implementación existente; fuente inmutable y configuración comprobadas por API. Salud y rechazos sin credencial comprobados por HTTP. Autorización y recuperación probadas con registros sintéticos; no se ejecutaron escrituras operativas ni un recorrido autenticado real.

**Conexiones registradas; no habilitan operaciones:**

- CON-002 · GAS-CATALOGO → SHEET-CATALOGO · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.
- CON-072 · SYS-TRACK → GAS-CATALOGO · api · Consulta resource Track para codesarrollos · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: ausente · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- Registro backends-verificados.json: versión activa 9 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección. · Estado: codigo · Revisión: Apps Script version 9
- CHG-CONTROL-MAESTRO-001: versión 10; publicación contrastada por API y pruebas HTTP de lectura y rechazo el 2026-10-01. Detalle en control-maestro.md y registro de backends. · Estado: ejecucion · Revisión: Apps Script version 10

**Evidencia de conexiones:**

- CON-002 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-072 · Recurso Track del backend del catálogo · Estado: codigo · yodesarrollomx/yod-portal · track-codesarrollos.html · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- La revisión acotada no certifica todas las operaciones de negocio ni sustituye la aceptación con usuarios reales.
- Las cachés de consumidores ajenos a esta entrega pueden conservar permisos temporalmente; revisarlos al continuar cada tablero.
- Las escrituras y auditoría entre libros no son una transacción; un fallo parcial exige revisión sin reintento automático.

### Datos de Catálogo del OS · SHEET-CATALOGO

**Función:** Almacenar registros del dominio gobierno

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** ejecucion. Metadatos, catálogo, registro y configuración de permisos contrastados el 2026-10-01 mediante lecturas acotadas. Sin escrituras, migraciones ni exportación de identidades.

**Conexiones registradas; no habilitan operaciones:**

- CON-002 · GAS-CATALOGO → SHEET-CATALOGO · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- Metadatos y encabezados leídos mediante conector autorizado el 2026-09-30. Identificadores y registros reales omitidos de la versión pública. · Estado: ejecucion · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-002 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Despacho sigue ausente del registro vivo; su respaldo técnico se conserva.
- SYS-PORTAL y SYS-YOD-OS mantienen sus identificadores; el alias no se migró.
- El catálogo de roles no concede derechos por sí solo: se aplican los recursos y banderas explícitas de Accesos.

### Portero de respaldo · GAS-PORTERO-RESPALDO

**Función:** Reintentar autenticación ante falla del original sin reemplazarlo permanentemente

**Fuente oficial:** Despliegue real no inspeccionado

**Responsable operativo:** Responsable técnico

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-073 · SYS-YOD-OS → GAS-PORTERO-RESPALDO · autenticacion · Respaldo de identidad · Estado: codigo · Ejecución no verificada en el atlas.
- CON-086 · GAS-SALA → GAS-PORTERO-RESPALDO · autenticacion · Consulta respaldo de identidad · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Endpoint alterno de identidad · Estado: codigo · yodesarrollomx/yod-portal · os/yod-acceso.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-073 · Configuración del respaldo · Estado: codigo · yodesarrollomx/yod-portal · os/yod-acceso.js · Revisión: HEAD\_baseline
- CON-086 · Consulta respaldo de identidad · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.

### Mi Corcho · almacén privado de Dirección · STORE-DESPACHO-CORCHO

**Función:** Persistir notas y ejes del Corcho en un archivo privado independiente, autorizado solo al propietario exacto

**Fuente oficial:** Mi Corcho privado independiente ya preparado; propiedades privadas o fallback de módulo privado, sin publicar identificadores ni notas. Mismo archivo durante provisional y futura migración Ops.

**Responsable operativo:** Dirección / propietario único del archivo

**Estado registrado:** declarado. Mi Corcho privado vacío ya preparado, pestaña Corcho con encabezados id/version/payload\_json; ACL actual de archivo y raíz owner-only verificadas por coordinador. Integración y persistencia autenticada pendientes; revalidar principal y ACL en cada operación.

**Conexiones registradas; no habilitan operaciones:**

- CON-DESPACHO-CORCHO-STORE · GAS-OPERACION → STORE-DESPACHO-CORCHO · persistencia · Futuro Ops: mismo almacén Corcho tras identificar proyecto · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-PORTERO-CORCHO-STORE · GAS-PORTERO → STORE-DESPACHO-CORCHO · persistencia · Provisional: CAS en Mi Corcho privado · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Fuente integrada de almacenamiento separado, CAS, principal efectivo y ACL Drive exhaustiva; integración runtime pendiente. · Estado: codigo · yodesarrollomx/board-aurum · apps-script/corcho.gs · Revisión: 388ff869325bd9ea47ba8a2acccf00807fd85f4c](https://github.com/yodesarrollomx/board-aurum/blob/388ff869325bd9ea47ba8a2acccf00807fd85f4c/apps-script/corcho.gs)
- Registro privado previo de infraestructura: archivo independiente vacío con Corcho y encabezados, cero notas de prueba. Coordinador acredita ACL vigente owner-only de archivo y raíz; IDs y principal permanecen privados. · Estado: declarado · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-DESPACHO-CORCHO-STORE · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Migración futura condicionada a identificar editor/implementación Ops y validar el mismo principal, ACL y contrato; conservar archivo e IDs. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-PORTERO-CORCHO-STORE · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- Dependencia de identidad de ejecución y consentimiento vigentes para verificar privacidad antes de acceder a datos

## Comercial

**Ubicación propuesta:** funnel · 16 componentes.

### Plan de Potencial · SYS-PLAN-POTENCIAL

**Función:** Captar dueños de terreno y convertirlos a videollamada y servicio de pago

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-023 · SYS-PLAN-POTENCIAL → GAS-PLAN-POTENCIAL · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-075 · SYS-INVERSION → SYS-PLAN-POTENCIAL · captacion · CTA con atribución de presentación · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Cadena comercial documentada · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-023 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline
- CON-075 · CTA comercial con campaña · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 2 conexiones sin verificación de ejecución registrada.
- Confirmación de cita depende de cruce Calendar no verificable solo con frontend

### CroKiss · SYS-CROKISS

**Función:** Editor de planos con guardado que captura prospectos

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-024 · SYS-CROKISS → GAS-CROKISS · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Propósito comercial declarado · Estado: declarado · yodesarrollomx/crokiss · CLAUDE.md · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-024 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/crokiss · Code.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- No se comprobó traslado de leads a CRM central

### Embudo comercial · SYS-MARKETING

**Función:** Medir adquisición, citas, clientes y pauta

**Fuente oficial:** GAS-MARKETING y GAS-PLAN-POTENCIAL para embudos; API Meta y archivos generados para publicaciones

**Responsable operativo:** Comercial y marketing

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-021 · SYS-MARKETING → GAS-MARKETING · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-022 · SYS-MARKETING → GAS-PLAN-POTENCIAL · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-041 · SYS-YOD-OS → SYS-MARKETING · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-049 · SYS-MARKETING → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-060 · EXT-META → SYS-MARKETING · integracion · Obtiene métricas mediante Actions · Estado: declarado · Ejecución no verificada en el atlas.
- CON-076 · GAS-PLAN-POTENCIAL → SYS-MARKETING · atribucion · Cruza campañas/piezas con leads y citas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-077 · SYS-SALA-OPERACION → SYS-MARKETING · automatizacion · Genera métricas de campañas en utilidades históricas · Estado: pendiente · Ejecución no verificada en el atlas.
- CON-PUBLICADOR-MARKETING · EXT-GITHUB-PUBLISHER-APP → SYS-MARKETING · automatizacion · Crea PR del commit preparado de Marketing · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-021 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-022 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-041 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-049 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-060 · Generación periódica de métricas · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-076 · Atribución implementada a nivel campaña y pieza · Estado: codigo · yodesarrollomx/aurum-board · scripts/pull\_metrics.py · Revisión: HEAD\_baseline
- CON-077 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-PUBLICADOR-MARKETING · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 8 conexiones sin verificación de ejecución registrada.

### Experiencia Aurum · SYS-AURUM-EXPERIENCIA

**Función:** Redirigir preservando query y fragmento al sitio externo de Experiencia Aurum

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-074 · SYS-AURUM-EXPERIENCIA → EXT-AURUM-WEB · navegacion · Redirige conservando atribución y fragmento · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Dependencia de negocio externa con identidad separada · Estado: declarado · yodesarrollomx/yod-portal · docs/EXPEDIENTE.md · Revisión: HEAD\_baseline
- El repo clonado contiene redirect, no la aplicación de captación · Estado: codigo · yodesarrollomx/aurum-experiencia · index.html · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-074 · Redirect al sitio activo · Estado: codigo · yodesarrollomx/aurum-experiencia · index.html · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Mantener separación de marca y portal decidida anteriormente

### Métricas y CRM de captación · GAS-MARKETING

**Función:** Servir el contrato de Métricas y CRM de captación

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-005 · GAS-MARKETING → SHEET-MARKETING · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-021 · SYS-MARKETING → GAS-MARKETING · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fragmento\_autenticacion · Estado: codigo · yodesarrollomx/aurum-board · apps-script/portero-auth.gs · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-005 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/aurum-board · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- CON-021 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados

### Datos de Métricas y CRM de captación · SHEET-MARKETING

**Función:** Almacenar registros del dominio ventas

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-005 · GAS-MARKETING → SHEET-MARKETING · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-005 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/aurum-board · apps-script/portero-auth.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Captación de Plan Potencial · GAS-PLAN-POTENCIAL

**Función:** Servir el contrato de Captación de Plan Potencial

**Fuente oficial:** Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Versión 16 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados.

**Conexiones registradas; no habilitan operaciones:**

- CON-006 · GAS-PLAN-POTENCIAL → SHEET-PLAN-POTENCIAL · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.
- CON-022 · SYS-MARKETING → GAS-PLAN-POTENCIAL · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-023 · SYS-PLAN-POTENCIAL → GAS-PLAN-POTENCIAL · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-052 · GAS-PLAN-POTENCIAL → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-059 · GAS-PLAN-POTENCIAL → EXT-CALENDAR · integracion · Confirma cita agendada · Estado: declarado · Ejecución no verificada en el atlas.
- CON-076 · GAS-PLAN-POTENCIAL → SYS-MARKETING · atribucion · Cruza campañas/piezas con leads y citas · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: ausente · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline
- Registro backends-verificados.json: Fuente de versión activa 16 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente. · Estado: codigo · Revisión: Apps Script version 16

**Evidencia de conexiones:**

- CON-006 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline
- CON-022 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-023 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline
- CON-052 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-059 · Cruce declarado con Calendar · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline
- CON-076 · Atribución implementada a nivel campaña y pieza · Estado: codigo · yodesarrollomx/aurum-board · scripts/pull\_metrics.py · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 6 conexiones sin verificación de ejecución registrada.
- Permisos por operación y recorridos por rol pendientes de prueba

### Datos de Captación de Plan Potencial · SHEET-PLAN-POTENCIAL

**Función:** Almacenar registros del dominio ventas

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-006 · GAS-PLAN-POTENCIAL → SHEET-PLAN-POTENCIAL · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-006 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Guardado de planos · GAS-CROKISS

**Función:** Servir el contrato de Guardado de planos

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-007 · GAS-CROKISS → SHEET-CROKISS · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-024 · SYS-CROKISS → GAS-CROKISS · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fuente\_repositorio\_despliegue\_no\_verificado · Estado: codigo · yodesarrollomx/crokiss · Code.gs · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-007 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/crokiss · Code.gs · Revisión: HEAD\_baseline
- CON-024 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/crokiss · Code.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados

### Datos de Guardado de planos · SHEET-CROKISS

**Función:** Almacenar registros del dominio ventas

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-007 · GAS-CROKISS → SHEET-CROKISS · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-007 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/crokiss · Code.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### CRM comercial · GAS-CRM

**Función:** Servir leads y etapas del CRM al tablero cenital

**Fuente oficial:** Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos.

**Responsable operativo:** Responsable técnico

**Estado registrado:** codigo. Versión 20 desplegada en la implementación existente y fuente contrastada por API. Correcciones acotadas probadas con dobles; recorrido real de negocio por rol pendiente. Salud técnica pública comprobada por HTTP 200 sin datos de negocio.

**Conexiones registradas; no habilitan operaciones:**

- CON-065 · SYS-YOD-OS → GAS-CRM · lectura\_agregada · Consulta leads del CRM · Estado: codigo · Ejecución no verificada en el atlas.
- CON-066 · GAS-CRM → SHEET-CRM · persistencia · Persistencia comercial lógica · Estado: pendiente · Ejecución no verificada en el atlas.
- CON-AUTH-CRM · GAS-CRM → GAS-PORTERO · autenticacion · Consulta identidad y alcance de lectura · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Endpoint específico del CRM · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- Registro backends-verificados.json: versión activa 20 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección. · Estado: codigo · Revisión: Apps Script version 20

**Evidencia de conexiones:**

- CON-065 · Conector de CRM · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-066 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-AUTH-CRM · Revisión de fuente activa GAS-CRM, versión 20; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. · Estado: codigo · Revisión: Apps Script version 20

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- Quedan reglas de autorización y recorridos de negocio por comprobar; las pruebas aisladas no acreditan todos los permisos en producción.

### Datos de CRM comercial · SHEET-CRM

**Función:** Almacén lógico de prospectos y seguimiento

**Fuente oficial:** Google Sheets; correspondencia física pendiente

**Responsable operativo:** Comercial

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-066 · GAS-CRM → SHEET-CRM · persistencia · Persistencia comercial lógica · Estado: pendiente · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-066 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### Sitio de Arquitectura de Autor · EXT-AURUM-WEB

**Función:** Destino externo del cuestionario de experiencia

**Fuente oficial:** Repositorio externo no clonado

**Responsable operativo:** Comercial

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-074 · SYS-AURUM-EXPERIENCIA → EXT-AURUM-WEB · navegacion · Redirige conservando atribución y fragmento · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Redirect preserva parámetros y fragmento · Estado: codigo · yodesarrollomx/aurum-experiencia · index.html · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-074 · Redirect al sitio activo · Estado: codigo · yodesarrollomx/aurum-experiencia · index.html · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- Código de experiencia activo no está en el redirect local

### Meta · EXT-META

**Función:** Dependencia externa de procesos YOD OS

**Fuente oficial:** Datos del servicio externo; no inspeccionados

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-060 · EXT-META → SYS-MARKETING · integracion · Obtiene métricas mediante Actions · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-060 · Generación periódica de métricas · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Estado y permisos no comprobados

### Gmail · EXT-GMAIL

**Función:** Dependencia externa de procesos YOD OS

**Fuente oficial:** Datos del servicio externo; no inspeccionados

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-061 · SYS-DESPACHO → EXT-GMAIL · accion\_humana\_y\_rutina · Aprobación de borradores por protocolo BANDEJA · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-061 · Rutina externa declarada con aprobación humana · Estado: declarado · yodesarrollomx/yod-despacho · EJECUTOR.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Estado y permisos no comprobados

### Google Calendar · EXT-CALENDAR

**Función:** Dependencia externa de procesos YOD OS

**Fuente oficial:** Datos del servicio externo; no inspeccionados

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-059 · GAS-PLAN-POTENCIAL → EXT-CALENDAR · integracion · Confirma cita agendada · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-059 · Cruce declarado con Calendar · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Estado y permisos no comprobados

## Plan de Potencial y puesto

**Ubicación propuesta:** potential · 3 componentes.

### PPP · Potenciales · SYS-POTENCIALES

**Función:** Evaluar alternativas y escenarios de desarrollo

**Fuente oficial:** SHEET-PORTERO registra casos; libro canónico Sheets para el piloto con lectura pública verificada en v53. Los casos pendientes de migrar aún usan modelos del frontend.

**Responsable operativo:** Desarrollo y Comercial

**Estado registrado:** codigo. PPP patrimonial compacto publicado en PR17, commit d150ee0; Pages y regresiones Chromium/WebKit aprobados. Herramienta conversada publicada en motor b88ce380. No acredita micrófono físico, escritura privada ni equivalencia de todos los modelos/casos.

**Conexiones registradas; no habilitan operaciones:**

- CON-019 · SYS-POTENCIALES → GAS-PORTERO · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-034 · SYS-YOD-OS → SYS-POTENCIALES · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-DESPACHO-3D-PPP · SYS-DESPACHO-3D → SYS-POTENCIALES · embed · Tablero original con contexto compartido, escenario y revisión · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- [Frontend integrado por PR3 y publicado por Pages; código público incluye lectura del modelo nativo, cuerpos y flujo por etapas. Sesión y backend pendientes de verificación conjunta. · Estado: codigo · yodesarrollomx/potenciales-yod · mixto.html · Revisión: d446b637f408124f224afadc6c674e3675c62f38](https://github.com/yodesarrollomx/potenciales-yod/blob/d446b637f408124f224afadc6c674e3675c62f38/mixto.html)
- Lectura pública del caso y la lista del piloto comparadas con entradas, resultados, cuerpos y flujo nativos; coinciden. Evidencia operativa privada; no se ejecutaron POST de prueba. · Estado: ejecucion · Revisión: Apps Script version 53
- Relevo del coordinador confirmado por Dirección el 5-oct: fuente activa/editor V65 idénticos, adaptador Patrimonial ausente y GET sheet-model Patrimonial con error servidor; recuperación \#47 propuesta. Detalles y snapshots privados. · Estado: declarado · Revisión: Apps Script version 65; 2026-10-05
- Coordinador reporta publicación API V66 desde V65: CAS/readback confirma siete archivos idénticos y sólo Code PPP adaptado; misma URL/scopes/ACL y editor == candidato == versión inmutable V66. GET funcional posterior pendiente; sin POST de pruebas de negocio. · Estado: declarado · Revisión: Apps Script version 66; 2026-10-05
- Coordinador reporta GET real Patrimonial V66 aprobado y 166 celdas exactas con Sheets en el caso inspeccionado; dos escenarios conservan IDs y 269 campos, geometría pendiente. Acta privada fuera del repositorio. Vertical y otros casos no acreditados. · Estado: declarado · Revisión: Apps Script version 66; cotejo Patrimonial 2026-10-05
- [Tarjetas nativas del PPP patrimonial con datos del Store; pruebas y despliegue de PR17. · Estado: codigo · yodesarrollomx/potenciales-yod · ppp-agent-cards.js · Revisión: d150ee0c323803869cc52b084a1911f09e2cdc91](https://github.com/yodesarrollomx/potenciales-yod/blob/d150ee0c323803869cc52b084a1911f09e2cdc91/ppp-agent-cards.js)

**Evidencia de conexiones:**

- CON-019 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/potenciales-yod · CLAUDE.md · Revisión: HEAD\_baseline
- CON-034 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- [CON-DESPACHO-3D-PPP · Tablero original con contexto compartido, escenario y revisión · Estado: codigo · yodesarrollomx/yod-portal · despacho3d/project-station.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/project-station.mjs)

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- Backend de transporte v53 publicado en implementación existente. GET de caso y lista contrastados con el mismo libro y revisión; edición en pantalla y demás casos pendientes. Los casos no migrados conservan cálculo cliente.
- GET Patrimonial y cotejo de 166 celdas sólo acreditan el caso inspeccionado; geometría, Vertical y otros casos pendientes. Parche visual y regresión Chromium aprobados según coordinador; WebKit en CI del consumer, publicación/aceptación frontend pendientes.

### PPP · Libros de cálculo por caso · SHEET-PPP-MODELOS

**Función:** Conservar entradas, fórmulas nativas, versiones, flujos y datos de diagramas del mismo modelo por caso

**Fuente oficial:** Libro privado por caso registrado en SHEET-PORTERO; entradas y fórmulas canónicas. El tablero transporta y presenta resultados; no replica un motor financiero.

**Responsable operativo:** Dirección / propietario del libro

**Estado registrado:** ejecucion. Piloto y lectura pública de caso/lista conciliados; migración general y edición en pantalla pendientes

**Conexiones registradas; no habilitan operaciones:**

- CON-PPP-MODELO · GAS-PORTERO → SHEET-PPP-MODELOS · persistencia · Lee resultados nativos; escribe cantidades permitidas · Estado: ejecucion · Ejecución no verificada en el atlas.
- CON-PPP-REGISTRO · SHEET-PORTERO → SHEET-PPP-MODELOS · registro · Registra caso, libro, carpeta y revisión del modelo · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Lectura directa autorizada de un libro piloto; fórmulas nativas y versiones contrastadas. Evidencia detallada en registro operativo privado, sin publicar identificadores ni cifras. · Estado: ejecucion · Revisión: 2026-09-30
- Lectura nativa de programa por cuerpos y flujo por etapas. Campos ausentes quedan pendientes; comparación con proforma activa sin sustituir datos globales. Detalle en registro privado. · Estado: ejecucion · Revisión: 2026-10-01

**Evidencia de conexiones:**

- CON-PPP-MODELO · Versión53 publicada; lectura HTTP de caso y lista conciliada con el libro piloto. Escritura permitida desplegada y probada con dobles; recorrido público de edición pendiente. · Estado: ejecucion · Revisión: Apps Script version 53
- CON-PPP-MODELO · Relevo del coordinador confirmado por Dirección el 5-oct: fuente activa/editor V65 idénticos, adaptador Patrimonial ausente y GET sheet-model Patrimonial con error servidor; recuperación \#47 propuesta. Detalles y snapshots privados. · Estado: declarado · Revisión: Apps Script version 65; 2026-10-05
- CON-PPP-MODELO · Coordinador reporta publicación API V66 desde V65: CAS/readback confirma siete archivos idénticos y sólo Code PPP adaptado; misma URL/scopes/ACL y editor == candidato == versión inmutable V66. GET funcional posterior pendiente; sin POST de pruebas de negocio. · Estado: declarado · Revisión: Apps Script version 66; 2026-10-05
- CON-PPP-MODELO · Coordinador reporta GET real Patrimonial V66 aprobado y 166 celdas exactas con Sheets en el caso inspeccionado; dos escenarios conservan IDs y 269 campos, geometría pendiente. Acta privada fuera del repositorio. Vertical y otros casos no acreditados. · Estado: declarado · Revisión: Apps Script version 66; cotejo Patrimonial 2026-10-05
- CON-PPP-REGISTRO · Registro del piloto creado; organización y generación para todos los casos pendientes. · Estado: declarado · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- La lectura pública verificada del piloto no acredita la edición completa ni otros casos
- Faltan otros motores, nuevas altas, capturas por cuerpos y renta neta completa; el presupuesto mensual por etapas es preparación parcial

### Oficina 3D y puesto del autón · SYS-DESPACHO-3D

**Función:** Observar y conversar con el autón del proyecto, consultar su PPP y seguir el trabajo en un único puesto.

**Fuente oficial:** Perfil y expediente autorizados por servidor; PPP conserva su libro y Store canónicos.

**Responsable operativo:** Dirección técnica

**Estado registrado:** codigo. Radial107 publicado; Dirección confirmó conversación e interrupción con retardo estimado de 1–3 s. Encuentro108 implementado en rama: círculo no modal a 60 cm y voz por permanencia a 40 cm. Verificación técnica y publicación en curso; no acredita latencia física.

**Entradas registradas:**

- os/\#/despacho — Oficina y puesto del autón dentro de YOD OS; sesión y DP requeridos.

**Conexiones registradas; no habilitan operaciones:**

- CON-OS-DESPACHO-3D · SYS-YOD-OS → SYS-DESPACHO-3D · navegacion · Ruta interna del despacho con sesión y permiso vigentes · Estado: codigo · Ejecución no verificada en el atlas.
- CON-DESPACHO-3D-MOTOR · SYS-DESPACHO-3D → SVC-AUTON-CLOUD · api · Conversación y operaciones del puesto ligadas al caso y actor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-DESPACHO-3D-PPP · SYS-DESPACHO-3D → SYS-POTENCIALES · embed · Tablero original con contexto compartido, escenario y revisión · Estado: codigo · Ejecución no verificada en el atlas.
- CON-ESTADO-EXPORTACION · STORE-AUTON-ESTADO → SYS-DESPACHO-3D · lectura · Leer versiones, decisiones y exportación autorizadas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-DESPACHO-EXPORTAR-OBSIDIAN · SYS-DESPACHO-3D → EXT-OBSIDIAN · exportacion · Descarga manual de bóveda portable; no sincronización · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BIBLIOTECA-NOTEBOOKLM · SYS-DESPACHO-3D → EXT-NOTEBOOKLM · propuesta · Consulta documental prevista, conexión sin verificar · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Puesto compartido con PPP y ejecución de intención explícita; observar no otorga permisos. · Estado: codigo · yodesarrollomx/yod-portal · despacho3d/agent-workspace.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/agent-workspace.mjs)

**Evidencia de conexiones:**

- [CON-OS-DESPACHO-3D · Ruta interna del despacho con sesión y permiso vigentes · Estado: codigo · yodesarrollomx/yod-portal · os/despacho-section.js · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/os/despacho-section.js)
- [CON-DESPACHO-3D-MOTOR · Conversación y operaciones del puesto ligadas al caso y actor · Estado: codigo · yodesarrollomx/yod-portal · despacho3d/agent-workspace.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/agent-workspace.mjs)
- [CON-DESPACHO-3D-PPP · Tablero original con contexto compartido, escenario y revisión · Estado: codigo · yodesarrollomx/yod-portal · despacho3d/project-station.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/project-station.mjs)
- [CON-ESTADO-EXPORTACION · Leer versiones, decisiones y exportación autorizadas · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/case-knowledge.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/case-knowledge.mjs)
- [CON-DESPACHO-EXPORTAR-OBSIDIAN · Descarga manual de bóveda portable; no sincronización · Estado: codigo · yodesarrollomx/yod-portal · docs/arquitectura/despacho-conocimiento.md · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/docs/arquitectura/despacho-conocimiento.md)
- [CON-BIBLIOTECA-NOTEBOOKLM · Consulta documental prevista, conexión sin verificar · Estado: propuesto · yodesarrollomx/yod-portal · despacho3d/entorno.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/entorno.mjs)

**Pendientes y límites:**

- 6 conexiones sin verificación de ejecución registrada.

## Proyectos y diseño

**Ubicación propuesta:** projects · 13 componentes.

### Amalaya · SYS-AMALAYA

**Función:** Seguimiento de espacios, modelos y datos del desarrollo

**Fuente oficial:** Registros privados del desarrollo y contratos actuales del tablero; historial de chinches por ID.

**Responsable operativo:** Dirección y responsable del desarrollo

**Estado registrado:** codigo. Verificación independiente de esta entrega pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-AMALAYA-CLIENT · SYS-AMALAYA → GAS-AMALAYA · api · Consume contrato autenticado del tablero · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Fuente de interfaz revisada para estados vacíos y aviso de supuestos. · Estado: codigo · yodesarrollo/amalaya-board · src/componentes/FichaEspacio.jsx · Revisión: a3cf36f508015d288a04288fef040130f30ec3b7](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/src/componentes/FichaEspacio.jsx)

**Evidencia de conexiones:**

- [CON-AMALAYA-CLIENT · Contratos de chinches existentes y extensión de estado propuesta. · Estado: codigo · yodesarrollo/amalaya-board · apps-script/Code.gs · Revisión: a3cf36f508015d288a04288fef040130f30ec3b7](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- La calidad visual no valida datos comerciales definitivos; no convertir supuestos en hechos.

### Motor Amalaya · GAS-AMALAYA

**Función:** Servir contratos actuales y conciliar estados de chinches

**Fuente oficial:** Registros privados del desarrollo y contratos actuales del tablero; historial de chinches por ID.

**Responsable operativo:** Dirección y responsable del desarrollo

**Estado registrado:** codigo. Verificación independiente de esta entrega pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-AMALAYA-CLIENT · SYS-AMALAYA → GAS-AMALAYA · api · Consume contrato autenticado del tablero · Estado: codigo · Ejecución no verificada en el atlas.
- CON-AMALAYA-STORE · GAS-AMALAYA → SHEET-AMALAYA · persistencia · Conserva chinches y su historial · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Fuente contiene lectura de chinches y chincheTomada; extensión compatible propuesta. · Estado: codigo · yodesarrollo/amalaya-board · apps-script/Code.gs · Revisión: a3cf36f508015d288a04288fef040130f30ec3b7](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs)

**Evidencia de conexiones:**

- [CON-AMALAYA-CLIENT · Contratos de chinches existentes y extensión de estado propuesta. · Estado: codigo · yodesarrollo/amalaya-board · apps-script/Code.gs · Revisión: a3cf36f508015d288a04288fef040130f30ec3b7](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs)
- [CON-AMALAYA-STORE · Contratos de chinches existentes y extensión de estado propuesta. · Estado: codigo · yodesarrollo/amalaya-board · apps-script/Code.gs · Revisión: a3cf36f508015d288a04288fef040130f30ec3b7](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs)

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- La calidad visual no valida datos comerciales definitivos; no convertir supuestos en hechos.

### Datos de Amalaya · SHEET-AMALAYA

**Función:** Conservar registros operativos y chinches del desarrollo

**Fuente oficial:** Registros privados del desarrollo y contratos actuales del tablero; historial de chinches por ID.

**Responsable operativo:** Dirección y responsable del desarrollo

**Estado registrado:** declarado. Verificación independiente de esta entrega pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-AMALAYA-STORE · GAS-AMALAYA → SHEET-AMALAYA · persistencia · Conserva chinches y su historial · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Almacén lógico del tablero; evidencia de correspondencia física y detalles permanecen privados. · Estado: declarado · yodesarrollo/amalaya-board · README.md · Revisión: a3cf36f508015d288a04288fef040130f30ec3b7](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/README.md)

**Evidencia de conexiones:**

- [CON-AMALAYA-STORE · Contratos de chinches existentes y extensión de estado propuesta. · Estado: codigo · yodesarrollo/amalaya-board · apps-script/Code.gs · Revisión: a3cf36f508015d288a04288fef040130f30ec3b7](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- La calidad visual no valida datos comerciales definitivos; no convertir supuestos en hechos.

### Aurum · Interiores · SYS-INTERIORES

**Función:** Seleccionar y documentar programa de interiores

**Fuente oficial:** SHEET-INTERIORES mediante GAS-INTERIORES; no se comprobó segregación física por proyecto

**Responsable operativo:** Diseño y proyectos

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-027 · SYS-INTERIORES → GAS-INTERIORES · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-039 · SYS-YOD-OS → SYS-INTERIORES · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-048 · SYS-INTERIORES → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-027 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/interiores-aurum · CLAUDE.md · Revisión: HEAD\_baseline
- CON-039 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-048 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.

### Interiores · GAS-INTERIORES

**Función:** Servir el contrato de Interiores

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-010 · GAS-INTERIORES → SHEET-INTERIORES · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.
- CON-027 · SYS-INTERIORES → GAS-INTERIORES · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: ausente · Estado: declarado · yodesarrollomx/interiores-aurum · CLAUDE.md · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-010 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/interiores-aurum · CLAUDE.md · Revisión: HEAD\_baseline
- CON-027 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/interiores-aurum · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados

### Datos de Interiores · SHEET-INTERIORES

**Función:** Almacenar registros del dominio proyectos

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-010 · GAS-INTERIORES → SHEET-INTERIORES · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-010 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/interiores-aurum · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Alquimia Urbana · SYS-ALQUIMIA

**Función:** Coordinar trámites y dependencias entre equipos de proyectos

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-028 · SYS-ALQUIMIA → GAS-ALQUIMIA · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Separación explícita entre trámites y tareas · Estado: declarado · yodesarrollomx/alquimia-urbana · CLAUDE.md · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-028 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/alquimia-urbana · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Backend no versionado en este repositorio

### Registro del grupo · GAS-ALQUIMIA

**Función:** Servir el contrato de Registro del grupo

**Fuente oficial:** Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Versión 26 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados.

**Conexiones registradas; no habilitan operaciones:**

- CON-011 · GAS-ALQUIMIA → SHEET-ALQUIMIA · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.
- CON-028 · SYS-ALQUIMIA → GAS-ALQUIMIA · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: ausente · Estado: declarado · yodesarrollomx/alquimia-urbana · CLAUDE.md · Revisión: HEAD\_baseline
- Registro backends-verificados.json: Fuente de versión activa 26 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente. · Estado: codigo · Revisión: Apps Script version 26

**Evidencia de conexiones:**

- CON-011 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/alquimia-urbana · CLAUDE.md · Revisión: HEAD\_baseline
- CON-028 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/alquimia-urbana · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- Permisos por operación y recorridos por rol pendientes de prueba

### Datos de Registro del grupo · SHEET-ALQUIMIA

**Función:** Almacenar registros del dominio proyectos

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-011 · GAS-ALQUIMIA → SHEET-ALQUIMIA · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-011 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/alquimia-urbana · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Real de Miramar · SYS-MIRAMAR

**Función:** Gestionar trámites, inventario y costos de desarrollo

**Fuente oficial:** SHEET-MIRAMAR mediante GAS-MIRAMAR; alcances financieros separados

**Responsable operativo:** Desarrollo y responsable de trámites

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-026 · SYS-MIRAMAR → GAS-MIRAMAR · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-036 · SYS-YOD-OS → SYS-MIRAMAR · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-050 · SYS-MIRAMAR → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-026 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/real-miramar-board · assets/board.js · Revisión: HEAD\_baseline
- CON-036 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-050 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.

### Miramar · GAS-MIRAMAR

**Función:** Servir el contrato de Miramar

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-009 · GAS-MIRAMAR → SHEET-MIRAMAR · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-026 · SYS-MIRAMAR → GAS-MIRAMAR · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-053 · GAS-MIRAMAR → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fragmento\_autenticacion · Estado: codigo · yodesarrollomx/real-miramar-board · apps-script/portero-auth.gs · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-009 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/real-miramar-board · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- CON-026 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/real-miramar-board · assets/board.js · Revisión: HEAD\_baseline
- CON-053 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados

### Datos de Miramar · SHEET-MIRAMAR

**Función:** Almacenar registros del dominio proyectos

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-009 · GAS-MIRAMAR → SHEET-MIRAMAR · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-009 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/real-miramar-board · apps-script/portero-auth.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Tracks de codesarrollo · SYS-TRACK

**Función:** Seguir hitos de proyectos

**Fuente oficial:** GAS-PORTERO para tracks individuales; GAS-CATALOGO para track de codesarrollos

**Responsable operativo:** Dirección y responsables de proyecto

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-020 · SYS-TRACK → GAS-PORTERO · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-035 · SYS-YOD-OS → SYS-TRACK · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-072 · SYS-TRACK → GAS-CATALOGO · api · Consulta resource Track para codesarrollos · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-020 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-035 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-072 · Recurso Track del backend del catálogo · Estado: codigo · yodesarrollomx/yod-portal · track-codesarrollos.html · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.

## Operación y obra

**Ubicación propuesta:** delivery · 11 componentes.

### MOAC · SYS-TAREAS

**Función:** Asignar y cerrar tareas semanales

**Fuente oficial:** SHEET-OPERACION para tareas y SHEET-MOAC-METAS para estrategia; motores separados

**Responsable operativo:** Dirección y responsables de equipo

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-017 · SYS-TAREAS → GAS-OPERACION · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-037 · SYS-YOD-OS → SYS-TAREAS · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-045 · SYS-TAREAS → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-067 · SYS-TAREAS → GAS-MOAC-METAS · api · Enruta moac/moacSet/moacObjetivo a motor separado · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-017 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/board-aurum · README.md · Revisión: HEAD\_baseline
- CON-037 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-045 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-067 · Selección de motor por prefijo · Estado: codigo · yodesarrollomx/board-aurum · src/App.jsx · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.

### Obra en vivo · SYS-OBRA

**Función:** Capturar, verificar y autorizar avances de obra

**Fuente oficial:** GAS-OBRA y SHEET-OBRA; autorización no demuestra pago efectivo

**Responsable operativo:** Responsable de obra y autorizador

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-029 · SYS-OBRA → GAS-OBRA · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-042 · SYS-YOD-OS → SYS-OBRA · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-051 · SYS-OBRA → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-029 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/yod-portal · obra.html · Revisión: HEAD\_baseline
- CON-042 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-051 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.

### Obra · módulo cliente · SYS-OBRA-CLIENTE

**Función:** Publicar avance aprobado y gestionar pagos, documentos, dudas y gastos

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-030 · SYS-OBRA-CLIENTE → GAS-OBRA-CLIENTE · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Esquemas del módulo cliente · Estado: codigo · yodesarrollomx/yod-portal · obra-app/motor/ObraCliente.gs · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-030 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/yod-portal · obra-app/obras.js · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- No se comprobó conciliación con Tesorería

### Operación y tareas · GAS-OPERACION

**Función:** Servir el contrato de Operación y tareas

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-003 · GAS-OPERACION → SHEET-OPERACION · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-016 · SYS-DESPACHO → GAS-OPERACION · api · Tareas ordinarias getAll/update en Operación · Estado: declarado · Ejecución no verificada en el atlas.
- CON-017 · SYS-TAREAS → GAS-OPERACION · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-055 · GAS-OPERACION → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-DESPACHO-CORCHO-STORE · GAS-OPERACION → STORE-DESPACHO-CORCHO · persistencia · Futuro Ops: mismo almacén Corcho tras identificar proyecto · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fragmento\_autenticacion · Estado: codigo · yodesarrollomx/board-aurum · apps-script/portero-auth.gs · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-003 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/board-aurum · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- CON-016 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/yod-despacho · README.md · Revisión: HEAD\_baseline
- [CON-016 · Cliente existente de tareas; separación de Corcho preparada por coordinador, todavía no integrada en el frontend publicado. · Estado: codigo · yodesarrollomx/yod-despacho · app.js · Revisión: 32330badba66dd9b23a7413498f421aeb628c9cb](https://github.com/yodesarrollomx/yod-despacho/blob/32330badba66dd9b23a7413498f421aeb628c9cb/app.js)
- CON-017 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/board-aurum · README.md · Revisión: HEAD\_baseline
- CON-055 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-DESPACHO-CORCHO-STORE · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Migración futura condicionada a identificar editor/implementación Ops y validar el mismo principal, ACL y contrato; conservar archivo e IDs. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 5 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados
- Proyecto editable de Operación no identificado tras comparar 13 proyectos; no modificar getAll/update ni atribuir el Corcho provisional a este despliegue.

### Datos de Operación y tareas · SHEET-OPERACION

**Función:** Almacenar registros del dominio operacion

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-003 · GAS-OPERACION → SHEET-OPERACION · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-003 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/board-aurum · apps-script/portero-auth.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Metas y objetivos de MOAC · GAS-MOAC-METAS

**Función:** Relacionar metas, objetivos y tareas

**Fuente oficial:** Fuente desplegada no disponible

**Responsable operativo:** Responsable técnico

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-067 · SYS-TAREAS → GAS-MOAC-METAS · api · Enruta moac/moacSet/moacObjetivo a motor separado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-068 · GAS-MOAC-METAS → SHEET-MOAC-METAS · persistencia · Lee y vincula estrategia · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Motor distinto para acciones moac · Estado: codigo · yodesarrollomx/board-aurum · src/App.jsx · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-067 · Selección de motor por prefijo · Estado: codigo · yodesarrollomx/board-aurum · src/App.jsx · Revisión: HEAD\_baseline
- CON-068 · Libro fuente declarado en código · Estado: codigo · yodesarrollomx/board-aurum · src/App.jsx · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- El libro de metas es distinto del almacén de tareas

### Metas, objetivos y acciones · SHEET-MOAC-METAS

**Función:** Almacén lógico de estrategia vinculada a tareas

**Fuente oficial:** Google Sheets; esquema vivo por verificar

**Responsable operativo:** Dirección

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-068 · GAS-MOAC-METAS → SHEET-MOAC-METAS · persistencia · Lee y vincula estrategia · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Libro documentado en código · Estado: codigo · yodesarrollomx/board-aurum · src/App.jsx · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-068 · Libro fuente declarado en código · Estado: codigo · yodesarrollomx/board-aurum · src/App.jsx · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### Motor de obra · GAS-OBRA

**Función:** Servir el contrato de Motor de obra

**Fuente oficial:** Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Versión 16 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados.

**Conexiones registradas; no habilitan operaciones:**

- CON-012 · GAS-OBRA → SHEET-OBRA · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-029 · SYS-OBRA → GAS-OBRA · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-057 · GAS-OBRA → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-058 · GAS-OBRA-CLIENTE → GAS-OBRA · lectura · Consulta avance por folio mediante servicio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-AUTH-OBRA · GAS-OBRA → GAS-PORTERO · autenticacion · Verifica credencial para operar · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: ausente · Estado: codigo · yodesarrollomx/yod-portal · obra.html · Revisión: HEAD\_baseline
- Registro backends-verificados.json: Fuente de versión activa 16 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente. · Estado: codigo · Revisión: Apps Script version 16

**Evidencia de conexiones:**

- CON-012 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/yod-portal · obra.html · Revisión: HEAD\_baseline
- CON-029 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/yod-portal · obra.html · Revisión: HEAD\_baseline
- CON-057 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-058 · Lectura del motor de obra · Estado: codigo · yodesarrollomx/yod-portal · obra-app/motor/ObraCliente.gs · Revisión: HEAD\_baseline
- CON-AUTH-OBRA · Revisión de fuente activa GAS-OBRA, versión 16; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. · Estado: codigo · Revisión: Apps Script version 16

**Pendientes y límites:**

- 5 conexiones sin verificación de ejecución registrada.
- Permisos por operación y recorridos por rol pendientes de prueba

### Datos de Motor de obra · SHEET-OBRA

**Función:** Almacenar registros del dominio obra

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-012 · GAS-OBRA → SHEET-OBRA · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-012 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/yod-portal · obra.html · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Módulo cliente de obra · GAS-OBRA-CLIENTE

**Función:** Servir el contrato de Módulo cliente de obra

**Fuente oficial:** Fuente de Apps Script versión 2 y libro vinculado con encabezados verificados; las hojas conservan los datos operativos.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Versión 2 activa verificada por API. Diez pruebas aisladas con esquema real; operaciones de negocio en producción no ejecutadas.

**Conexiones registradas; no habilitan operaciones:**

- CON-013 · GAS-OBRA-CLIENTE → SHEET-OBRA-CLIENTE · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-030 · SYS-OBRA-CLIENTE → GAS-OBRA-CLIENTE · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-058 · GAS-OBRA-CLIENTE → GAS-OBRA · lectura · Consulta avance por folio mediante servicio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fuente\_repositorio\_despliegue\_no\_verificado · Estado: codigo · yodesarrollomx/yod-portal · obra-app/motor/ObraCliente.gs · Revisión: HEAD\_baseline
- Registro backends-verificados.json: Versión activa 2 contrastada con la implementación existente y el cliente; siete esquemas reales verificados y diez pruebas sintéticas aprobadas. · Estado: codigo · Revisión: Apps Script version 2

**Evidencia de conexiones:**

- CON-013 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/yod-portal · obra-app/motor/ObraCliente.gs · Revisión: HEAD\_baseline
- CON-030 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/yod-portal · obra-app/obras.js · Revisión: HEAD\_baseline
- CON-058 · Lectura del motor de obra · Estado: codigo · yodesarrollomx/yod-portal · obra-app/motor/ObraCliente.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- Permisos por operación y recorridos por rol pendientes de prueba

### Datos de Módulo cliente de obra · SHEET-OBRA-CLIENTE

**Función:** Almacenar registros del dominio obra

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-013 · GAS-OBRA-CLIENTE → SHEET-OBRA-CLIENTE · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-013 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/yod-portal · obra-app/motor/ObraCliente.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

## Capital y tesorería

**Ubicación propuesta:** decisions · 9 componentes.

### Presentación a inversionistas · SYS-INVERSION

**Función:** Presentar oportunidades de codesarrollo

**Fuente oficial:** SHEET-INVERSION; respaldo cifrado y cambios locales son copias

**Responsable operativo:** Comercial

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-040 · SYS-YOD-OS → SYS-INVERSION · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-069 · SYS-INVERSION → GAS-INVERSION · api · Lee presentación y guarda diagnóstico · Estado: codigo · Ejecución no verificada en el atlas.
- CON-071 · SYS-INVERSION → GAS-PORTERO · autenticacion · Acceso compartido del equipo · Estado: codigo · Ejecución no verificada en el atlas.
- CON-075 · SYS-INVERSION → SYS-PLAN-POTENCIAL · captacion · CTA con atribución de presentación · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-040 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-069 · Capa de datos de presentación · Estado: codigo · yodesarrollomx/yodesarrollo-board · data-loader.jsx · Revisión: HEAD\_baseline
- CON-069 · Acción de diagnóstico · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-071 · Carga del Portero · Estado: codigo · yodesarrollomx/yodesarrollo-board · index.html · Revisión: HEAD\_baseline
- CON-075 · CTA comercial con campaña · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.

### Carpeta de inversión · GAS-INVERSION

**Función:** Entregar contenido comercial y guardar diagnóstico de reunión

**Fuente oficial:** Apps Script desplegado no disponible

**Responsable operativo:** Responsable técnico

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-069 · SYS-INVERSION → GAS-INVERSION · api · Lee presentación y guarda diagnóstico · Estado: codigo · Ejecución no verificada en el atlas.
- CON-070 · GAS-INVERSION → SHEET-INVERSION · persistencia · Contenido y diagnósticos comerciales · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Fuente backend excluida de GitHub · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-069 · Capa de datos de presentación · Estado: codigo · yodesarrollomx/yodesarrollo-board · data-loader.jsx · Revisión: HEAD\_baseline
- CON-069 · Acción de diagnóstico · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-070 · Almacén canónico comercial · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.

### Contenido de carpeta comercial · SHEET-INVERSION

**Función:** Almacén lógico de contenido y diagnósticos comerciales

**Fuente oficial:** Google Sheets

**Responsable operativo:** Comercial

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-070 · GAS-INVERSION → SHEET-INVERSION · persistencia · Contenido y diagnósticos comerciales · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Precedencia de contenido · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-070 · Almacén canónico comercial · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### Portal de codesarrolladores · SYS-CODES-PORTAL

**Función:** Gestionar inversiones, aportaciones, comprobantes, asesores y referidos

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-025 · SYS-CODES-PORTAL → GAS-CODES · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Entidades del portal comercial · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · src/App.jsx · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-025 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · src/App.jsx · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Contrato de IDs entre proyectoId propio y PRJ del Control Maestro pendiente de verificar
- Alta completa y división de pagos parciales usan varias escrituras secuenciales; revisar recuperación ante fallo parcial
- El agregado del tablero cenital solicita una acción ausente en el backend versionado

### Portal de codesarrolladores · GAS-CODES

**Función:** Servir el contrato de Portal de codesarrolladores

**Fuente oficial:** Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Versión 40 obtenida por API y vinculada al endpoint del cliente. Operaciones de negocio y roles no probados.

**Conexiones registradas; no habilitan operaciones:**

- CON-008 · GAS-CODES → SHEET-CODES · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-025 · SYS-CODES-PORTAL → GAS-CODES · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-056 · GAS-CODES → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-062 · GAS-CODES → EXT-DRIVE · documentos · Almacena archivos y comprobantes · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fuente\_repositorio\_despliegue\_no\_verificado · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · apps\_script/Código.js · Revisión: HEAD\_baseline
- Registro backends-verificados.json: Fuente de versión activa 40 obtenida y contrastada por API el 2026-09-30; identidad por coincidencia exacta de implementación con el cliente. · Estado: codigo · Revisión: Apps Script version 40

**Evidencia de conexiones:**

- CON-008 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · apps\_script/Código.js · Revisión: HEAD\_baseline
- CON-025 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · src/App.jsx · Revisión: HEAD\_baseline
- CON-056 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-062 · Subida de archivos de portal · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · apps\_script/Código.js · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.
- Permisos por operación y recorridos por rol pendientes de prueba
- Autenticación propia por rol; token Portero no equivale a credencial administrativa
- resumenPublico no aparece entre acciones versionadas; parche/despliegue pendiente de contraste

### Datos de Portal de codesarrolladores · SHEET-CODES

**Función:** Almacenar registros del dominio ventas

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-008 · GAS-CODES → SHEET-CODES · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-008 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · apps\_script/Código.js · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Tesorería · SYS-FLUJO

**Función:** Controlar bolsas, movimientos y compromisos de caja

**Fuente oficial:** SHEET-FLUJO mediante GAS-FLUJO; respaldo cifrado es copia de consulta

**Responsable operativo:** Tesorería

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-018 · SYS-FLUJO → GAS-FLUJO · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-038 · SYS-YOD-OS → SYS-FLUJO · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-046 · SYS-FLUJO → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-018 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/board-flujo-yod · index.html · Revisión: HEAD\_baseline
- CON-038 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-046 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.

### Tesorería · GAS-FLUJO

**Función:** Servir el contrato de Tesorería

**Fuente oficial:** Fuente de la versión activa de Apps Script contrastada con el endpoint del cliente; las hojas siguen siendo fuente de datos operativos.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Versión 15 desplegada en la implementación existente y fuente contrastada por API. Correcciones acotadas probadas con dobles; recorrido real de negocio por rol pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-004 · GAS-FLUJO → SHEET-FLUJO · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-018 · SYS-FLUJO → GAS-FLUJO · api · Consume contrato del backend · Estado: codigo · Ejecución no verificada en el atlas.
- CON-AUTH-FLUJO · GAS-FLUJO → GAS-PORTERO · autenticacion · Verifica credencial y acceso al módulo · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fragmento\_autenticacion · Estado: codigo · yodesarrollomx/board-flujo-yod · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- Registro backends-verificados.json: versión activa 15 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección. · Estado: codigo · Revisión: Apps Script version 15

**Evidencia de conexiones:**

- CON-004 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/board-flujo-yod · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- CON-018 · Conexión cliente/backend · Estado: codigo · yodesarrollomx/board-flujo-yod · index.html · Revisión: HEAD\_baseline
- CON-AUTH-FLUJO · Revisión de fuente activa GAS-FLUJO, versión 15; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. · Estado: codigo · Revisión: Apps Script version 15

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- Quedan reglas de autorización y recorridos de negocio por comprobar; las pruebas aisladas no acreditan todos los permisos en producción.
- La idempotencia completa de pagos y la recuperación de fallos entre escrituras requieren persistencia y adaptación del cliente; no forman parte de esta corrección acotada.

### Datos de Tesorería · SHEET-FLUJO

**Función:** Almacenar registros del dominio finanzas

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** ejecucion. Lectura directa de estructura en Sheets el 2026-09-30; no certifica backend

**Conexiones registradas; no habilitan operaciones:**

- CON-004 · GAS-FLUJO → SHEET-FLUJO · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- Metadatos y encabezados leídos mediante conector autorizado el 2026-09-30. Identificadores y registros reales omitidos de la versión pública. · Estado: ejecucion · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-004 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/board-flujo-yod · apps-script/portero-auth.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados
- Comprobaciones de integridad de datos requieren reconciliación privada antes de cualquier corrección
- Zona horaria del libro difiere de la del Control Maestro; evaluar efecto en fechas límite antes de modificarla

## Contenido y producción

**Ubicación propuesta:** editing · 8 componentes.

### Sala de Edición · SYS-SALA

**Función:** Proponer, decidir y producir contenido con compuertas humanas

**Fuente oficial:** SHEET-SALA: propuestas, decisiones, producción, reglas, motores y cola; archivos de repositorio son superficie o respaldo

**Responsable operativo:** Editores y producción

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-031 · SYS-SALA → GAS-SALA · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-063 · SYS-SALA → EXT-ACTIONS · automatizacion · Orquesta producción en la nube · Estado: declarado · Ejecución no verificada en el atlas.
- CON-064 · SYS-SALA-OPERACION → SYS-SALA · automatizacion · Herramientas históricas de producción · Estado: declarado · Ejecución no verificada en el atlas.
- CON-PUBLICADOR-SALA · EXT-GITHUB-PUBLISHER-APP → SYS-SALA · automatizacion · Crea PR del commit preparado de Sala · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Decisiones reservadas a editores · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- El cliente automático impide decisiones editoriales antes de la red · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_cliente.py · Revisión: HEAD\_baseline
- El productor planifica compuertas de producción · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline
- El ejecutor solo admite etapas habilitadas por configuración · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-031 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-063 · Ciclo de producción en nube · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-064 · Migración de herramientas a nube · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-PUBLICADOR-SALA · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.
- Cambios de infraestructura y documentos históricos requieren reconciliación

### Herramientas de producción · SYS-SALA-OPERACION

**Función:** Ejecutar utilidades de producción y coordinación de contenido

**Fuente oficial:** Sistema privado; detalle técnico restringido

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-064 · SYS-SALA-OPERACION → SYS-SALA · automatizacion · Herramientas históricas de producción · Estado: declarado · Ejecución no verificada en el atlas.
- CON-077 · SYS-SALA-OPERACION → SYS-MARKETING · automatizacion · Genera métricas de campañas en utilidades históricas · Estado: pendiente · Ejecución no verificada en el atlas.
- CON-078 · SYS-SALA-OPERACION → GAS-AUX-METRICAS · lectura · Referencia literal a fuente de métricas de utilidad auxiliar · Estado: pendiente · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-064 · Migración de herramientas a nube · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-077 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-078 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 3 conexiones sin verificación de ejecución registrada.
- Repositorio contiene activos y datos de operación; cobertura pública limitada a metadatos técnicos

### Sala de Edición · GAS-SALA

**Función:** Servir el contrato de Sala de Edición

**Fuente oficial:** gas/Code.gs es fuente versionada; no se comprobó igualdad con versión desplegada

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-014 · GAS-SALA → SHEET-SALA · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-031 · SYS-SALA → GAS-SALA · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-080 · SVC-SALA-PRODUCTOR → GAS-SALA · api · Lee decisiones/reglas y escribe cola · Estado: codigo · Ejecución no verificada en el atlas.
- CON-082 · SVC-SALA-EJECUTOR → GAS-SALA · api · Lee cola y registra resultado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-085 · GAS-SALA → GAS-PORTERO · autenticacion · Valida credencial del OS desde servidor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-086 · GAS-SALA → GAS-PORTERO-RESPALDO · autenticacion · Consulta respaldo de identidad · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fuente\_repositorio\_despliegue\_no\_verificado · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- Ruta de decisión editorial en el backend versionado · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- Esquemas de tablas de Sala · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-014 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- CON-031 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-080 · Planificador de compuertas · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline
- CON-082 · Procesamiento de trabajo · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- CON-085 · Valida credencial del OS desde servidor · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- CON-086 · Consulta respaldo de identidad · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 6 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados

### Datos de Sala de Edición · SHEET-SALA

**Función:** Almacenar registros del dominio ventas

**Fuente oficial:** Google Sheets de Sala; identidad física y valores vivos no inspeccionados

**Responsable operativo:** Editores y producción

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-014 · GAS-SALA → SHEET-SALA · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-014 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Fuente de métricas en utilidades auxiliares · GAS-AUX-METRICAS

**Función:** Fuente literal de métricas consumida por scripts auxiliares; uso activo no comprobado

**Fuente oficial:** Sistema privado; detalle técnico restringido

**Responsable operativo:** Marketing

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-078 · SYS-SALA-OPERACION → GAS-AUX-METRICAS · lectura · Referencia literal a fuente de métricas de utilidad auxiliar · Estado: pendiente · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-078 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- No se demostró que el endpoint siga utilizado ni que corresponda al backend actual

### Productor de Sala · SVC-SALA-PRODUCTOR

**Función:** Abrir compuertas aprobadas y encolar trabajo sin decidir ni ejecutar

**Fuente oficial:** Configuración de reglas/motores y código de ejecución; ejecución viva pendiente

**Responsable operativo:** Producción

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-079 · EXT-ACTIONS → SVC-SALA-PRODUCTOR · automatizacion · Programa productor cada veinte minutos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-080 · SVC-SALA-PRODUCTOR → GAS-SALA · api · Lee decisiones/reglas y escribe cola · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Abrir compuertas aprobadas y encolar trabajo sin decidir ni ejecutar · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-079 · Frecuencia configurada en workflow, no evidencia de corridas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-080 · Planificador de compuertas · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
- Uso efectivo, configuración y costo en producción no comprobados

### Ejecutor de Sala · SVC-SALA-EJECUTOR

**Función:** Procesar trabajos habilitados y subir resultados

**Fuente oficial:** Configuración de reglas/motores y código de ejecución; ejecución viva pendiente

**Responsable operativo:** Producción

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-081 · EXT-ACTIONS → SVC-SALA-EJECUTOR · automatizacion · Programa ejecución de etapas habilitadas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-082 · SVC-SALA-EJECUTOR → GAS-SALA · api · Lee cola y registra resultado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-083 · SVC-SALA-EJECUTOR → EXT-MOTORES-MEDIA · integracion · Selecciona motor según configuración · Estado: codigo · Ejecución no verificada en el atlas.
- CON-084 · SVC-SALA-EJECUTOR → EXT-DRIVE · documentos · Sube activos producidos · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Procesar trabajos habilitados y subir resultados · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-081 · Disparador declarado cada dos horas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-082 · Procesamiento de trabajo · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- CON-083 · Registro de motores de producción · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_motores.py · Revisión: HEAD\_baseline
- CON-084 · Publicación de resultado en Drive · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.
- Uso efectivo, configuración y costo en producción no comprobados

### Motores de generación de contenido · EXT-MOTORES-MEDIA

**Función:** Generar texto, imagen, escena o voz según motor configurado

**Fuente oficial:** Configuración de reglas/motores y código de ejecución; ejecución viva pendiente

**Responsable operativo:** Producción

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-083 · SVC-SALA-EJECUTOR → EXT-MOTORES-MEDIA · integracion · Selecciona motor según configuración · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Generar texto, imagen, escena o voz según motor configurado · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_motores.py · Revisión: HEAD\_baseline

**Evidencia de conexiones:**

- CON-083 · Registro de motores de producción · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_motores.py · Revisión: HEAD\_baseline

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- Uso efectivo, configuración y costo en producción no comprobados

## Personas

**Ubicación propuesta:** lounge · 4 componentes.

### Evaluación de personas · SYS-EMD

**Función:** Evaluación privada y seguimiento de revisiones

**Fuente oficial:** Sistema privado; detalle técnico restringido

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-032 · SYS-EMD → GAS-EMD · api · Consume contrato del backend · Estado: pendiente · Ejecución no verificada en el atlas.
- CON-EMD-DRAFTS-LOCAL · SYS-EMD → STORE-EMD-DRAFTS · persistencia\_local · Propuesta: copia cifrada local · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-EMD-GITHUB-EMBED · SYS-YOD-OS → SYS-EMD · embed · Wrapper EMD en dominio GitHub propio; legado compatible · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-032 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-EMD-DRAFTS-LOCAL · Diseño propuesto de persistencia local; sin evidencia de publicación · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-EMD-GITHUB-EMBED · Propietario confirma Pages main/raíz y ruta canónica /yod-portal/emd/; wrapper pendiente en PR separado, no evidencia de despliegue. · Estado: declarado · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 3 conexiones sin verificación de ejecución registrada.
- No hay evidencia de integración transaccional con YOD OS; mantener datos y permisos privados

### Evaluación privada · GAS-EMD

**Función:** Servir el contrato de Evaluación privada

**Fuente oficial:** Sistema privado; detalle técnico restringido

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-015 · GAS-EMD → SHEET-EMD · persistencia · Lee/escribe registros del dominio · Estado: pendiente · Ejecución no verificada en el atlas.
- CON-032 · SYS-EMD → GAS-EMD · api · Consume contrato del backend · Estado: pendiente · Ejecución no verificada en el atlas.
- CON-EMD-PROFILES-DRIVE · GAS-EMD → EXT-DRIVE · persistencia · Propuesta: fotos privadas de perfil · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-015 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-032 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-EMD-PROFILES-DRIVE · Propuesta registrada; implementación y despliegue privados pendientes de pruebas · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados

### Datos de Evaluación privada · SHEET-EMD

**Función:** Almacenar registros del dominio personas

**Fuente oficial:** Sistema privado; detalle técnico restringido

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-015 · GAS-EMD → SHEET-EMD · persistencia · Lee/escribe registros del dominio · Estado: pendiente · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-015 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Borradores locales cifrados de evaluación · STORE-EMD-DRAFTS

**Función:** Conservar copia recuperable en el mismo navegador sin sustituir la confirmación del servidor

**Fuente oficial:** Copia local no confirmada; el backend conserva autoridad sobre revisiones y cierre

**Responsable operativo:** Participante autorizado del enlace vigente

**Estado registrado:** propuesto. Propuesta; implementación y publicación pendientes de evidencia privada

**Conexiones registradas; no habilitan operaciones:**

- CON-EMD-DRAFTS-LOCAL · SYS-EMD → STORE-EMD-DRAFTS · persistencia\_local · Propuesta: copia cifrada local · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Diseño de recuperación local y pruebas sintéticas propuestos · Estado: propuesto · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-EMD-DRAFTS-LOCAL · Diseño propuesto de persistencia local; sin evidencia de publicación · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- Copia limitada al navegador y enlace vigentes; borrar datos del navegador o cambiar enlace puede impedir recuperación
- Almacenamiento o criptografía pueden fallar; el servidor sigue siendo fuente de verdad
- Concurrencia entre pestañas y confirmaciones tardías exige aislamiento y revisión explícita

## Biblioteca y conocimiento

**Ubicación propuesta:** lounge · 5 componentes.

### Google Drive · EXT-DRIVE

**Función:** Dependencia externa de procesos YOD OS

**Fuente oficial:** Datos del servicio externo; no inspeccionados

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-062 · GAS-CODES → EXT-DRIVE · documentos · Almacena archivos y comprobantes · Estado: codigo · Ejecución no verificada en el atlas.
- CON-084 · SVC-SALA-EJECUTOR → EXT-DRIVE · documentos · Sube activos producidos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-EMD-PROFILES-DRIVE · GAS-EMD → EXT-DRIVE · persistencia · Propuesta: fotos privadas de perfil · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-PORTERO-CORCHO-DRIVE · GAS-PORTERO → EXT-DRIVE · autorizacion · Corcho: principal y ACL completos por GET · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-MOTOR-DRIVE · SVC-AUTON-CLOUD → EXT-DRIVE · lectura · Leer originales, documentos y pasajes del expediente · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-062 · Subida de archivos de portal · Estado: codigo · yodesarrollomx/Co-desarrolladores-Yod · apps\_script/Código.js · Revisión: HEAD\_baseline
- CON-084 · Publicación de resultado en Drive · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- CON-EMD-PROFILES-DRIVE · Propuesta registrada; implementación y despliegue privados pendientes de pruebas · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-PORTERO-CORCHO-DRIVE · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-MOTOR-DRIVE · Leer originales, documentos y pasajes del expediente · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/RESEARCH.md · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/RESEARCH.md)

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 5 conexiones sin verificación de ejecución registrada.
- Estado y permisos no comprobados

### JEV · búsqueda y selección · EXT-JEV

**Función:** Orientar la búsqueda y ordenar pasajes relevantes antes de investigar.

**Fuente oficial:** Fuentes autorizadas de cada expediente; la clasificación no confirma por sí sola los hechos.

**Responsable operativo:** Dirección técnica

**Estado registrado:** codigo. Adaptador implementado; disponibilidad y cobertura dependen de configuración y fuentes autorizadas.

**Conexiones registradas; no habilitan operaciones:**

- CON-MOTOR-JEV · SVC-AUTON-CLOUD → EXT-JEV · integracion · Orientar y ordenar fuentes autorizadas · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Cliente para orientar y filtrar información; conserva límites y errores. · Estado: codigo · alexpueblag/yod-agent-cloud · runtime/typesafe-jev.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/runtime/typesafe-jev.mjs)

**Evidencia de conexiones:**

- [CON-MOTOR-JEV · Orientar y ordenar fuentes autorizadas · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/RESEARCH.md · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/RESEARCH.md)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### Obsidian · bóveda de conocimiento · EXT-OBSIDIAN

**Función:** Relacionar notas, fuentes y decisiones del expediente mediante una bóveda portable.

**Fuente oficial:** Notas derivadas y referencias; originales en Drive y cálculos oficiales en Sheets.

**Responsable operativo:** Dirección técnica

**Estado registrado:** propuesto. Exportación Markdown/ZIP implementada. Instalación de bóveda y sincronización continua no acreditadas.

**Conexiones registradas; no habilitan operaciones:**

- CON-DESPACHO-EXPORTAR-OBSIDIAN · SYS-DESPACHO-3D → EXT-OBSIDIAN · exportacion · Descarga manual de bóveda portable; no sincronización · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Exportar una bóveda no instala Obsidian ni acredita sincronización. · Estado: codigo · yodesarrollomx/yod-portal · docs/arquitectura/despacho-conocimiento.md · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/docs/arquitectura/despacho-conocimiento.md)

**Evidencia de conexiones:**

- [CON-DESPACHO-EXPORTAR-OBSIDIAN · Descarga manual de bóveda portable; no sincronización · Estado: codigo · yodesarrollomx/yod-portal · docs/arquitectura/despacho-conocimiento.md · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/docs/arquitectura/despacho-conocimiento.md)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### NotebookLM · consulta documental prevista · EXT-NOTEBOOKLM

**Función:** Registrar la herramienta documental mencionada para Biblioteca y comprobar su forma de acceso.

**Fuente oficial:** Documentos originales autorizados; API y sincronización por verificar.

**Responsable operativo:** Dirección técnica

**Estado registrado:** propuesto. Mencionado en la biblioteca del entorno; no se acredita conexión ejecutable ni acceso a notebooks.

**Conexiones registradas; no habilitan operaciones:**

- CON-BIBLIOTECA-NOTEBOOKLM · SYS-DESPACHO-3D → EXT-NOTEBOOKLM · propuesta · Consulta documental prevista, conexión sin verificar · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Biblioteca menciona NotebookLM como capacidad por verificar. · Estado: declarado · yodesarrollomx/yod-portal · despacho3d/entorno.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/entorno.mjs)

**Evidencia de conexiones:**

- [CON-BIBLIOTECA-NOTEBOOKLM · Consulta documental prevista, conexión sin verificar · Estado: propuesto · yodesarrollomx/yod-portal · despacho3d/entorno.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/entorno.mjs)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### Estado y conocimiento del autón · STORE-AUTON-ESTADO

**Función:** Conservar fuentes, hechos, versiones, decisiones y recibos del expediente.

**Fuente oficial:** Volumen privado; las cantidades y fórmulas vigentes permanecen en Sheets.

**Responsable operativo:** Dirección técnica

**Estado registrado:** codigo. Persistencia con revisión y recibos implementada y probada. La aceptación del ciclo privado de Dirección se registra por separado.

**Conexiones registradas; no habilitan operaciones:**

- CON-MOTOR-ESTADO · SVC-AUTON-CLOUD → STORE-AUTON-ESTADO · persistencia · Conocimiento y recibos por expediente con revisión · Estado: codigo · Ejecución no verificada en el atlas.
- CON-ESTADO-EXPORTACION · STORE-AUTON-ESTADO → SYS-DESPACHO-3D · lectura · Leer versiones, decisiones y exportación autorizadas · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Conocimiento por caso, revisiones, versiones y recuperación. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/case-knowledge.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/case-knowledge.mjs)

**Evidencia de conexiones:**

- [CON-MOTOR-ESTADO · Conocimiento y recibos por expediente con revisión · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/case-knowledge.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/case-knowledge.mjs)
- [CON-ESTADO-EXPORTACION · Leer versiones, decisiones y exportación autorizadas · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/case-knowledge.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/case-knowledge.mjs)

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.

## Soporte técnico

**Ubicación propuesta:** reception · 7 componentes.

### Sitio de organización · SYS-SITIO-ORG

**Función:** Alojar portada y configuración de dirección pública

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- Sin conexiones registradas.

**Evidencia de la ficha:**

- Dependencia de direccionamiento de Pages · Estado: declarado · yodesarrollomx/yodesarrollomx.github.io · README.md · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- No hay conexiones registradas para este componente.
- Estado DNS y despliegue no comprobados

### Prueba de dominio · SYS-PRUEBA-DOMINIO

**Función:** Ensayo técnico de migración de dominio y acceso

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** codigo. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- Sin conexiones registradas.

**Evidencia de la ficha:**

- Entorno de comprobación de dominio · Estado: codigo · yodesarrollomx/prueba-dominio · index.html · Revisión: HEAD\_baseline

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- No hay conexiones registradas para este componente.
- No es tablero de negocio; sus consultas no prueban estado productivo

### GitHub Actions · EXT-ACTIONS

**Función:** Dependencia externa de procesos YOD OS

**Fuente oficial:** Datos del servicio externo; no inspeccionados

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** pendiente. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-063 · SYS-SALA → EXT-ACTIONS · automatizacion · Orquesta producción en la nube · Estado: declarado · Ejecución no verificada en el atlas.
- CON-079 · EXT-ACTIONS → SVC-SALA-PRODUCTOR · automatizacion · Programa productor cada veinte minutos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-081 · EXT-ACTIONS → SVC-SALA-EJECUTOR · automatizacion · Programa ejecución de etapas habilitadas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-PUBLICADOR-IDENTIDAD · EXT-ACTIONS → EXT-GITHUB-PUBLISHER-APP · autenticacion · Solicita identidad temporal limitada al repositorio · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-063 · Ciclo de producción en nube · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-079 · Frecuencia configurada en workflow, no evidencia de corridas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-081 · Disparador declarado cada dos horas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-PUBLICADOR-IDENTIDAD · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 4 conexiones sin verificación de ejecución registrada.
- Estado y permisos no comprobados

### Identidad de publicación GitHub · EXT-GITHUB-PUBLISHER-APP

**Función:** Crear PR automáticos con identidad propia para que se ejecuten sus revisiones obligatorias

**Fuente oficial:** GitHub App privada propiedad de la organización; configuración y llave permanecen fuera del atlas público.

**Responsable operativo:** Dirección técnica

**Estado registrado:** propuesto. Pendiente de registro, instalación y comprobación operativa

**Conexiones registradas; no habilitan operaciones:**

- CON-PUBLICADOR-IDENTIDAD · EXT-ACTIONS → EXT-GITHUB-PUBLISHER-APP · autenticacion · Solicita identidad temporal limitada al repositorio · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-PUBLICADOR-SALA · EXT-GITHUB-PUBLISHER-APP → SYS-SALA · automatizacion · Crea PR del commit preparado de Sala · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-PUBLICADOR-MARKETING · EXT-GITHUB-PUBLISHER-APP → SYS-MARKETING · automatizacion · Crea PR del commit preparado de Marketing · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-PUBLICADOR-IDENTIDAD · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia
- CON-PUBLICADOR-SALA · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia
- CON-PUBLICADOR-MARKETING · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- La instalación se limita a Sala de Edición y Marketing; no usar credenciales personales en CI
- Código probado no acredita una instalación ni publicación correcta

### Motor de nube del autón · SVC-AUTON-CLOUD

**Función:** Ejecutar conversación, consulta y tareas del expediente autorizado, con estado durable.

**Fuente oficial:** Expediente autorizado y registros de cada dominio; volumen privado para estado, recibos y recuperación.

**Responsable operativo:** Dirección técnica

**Estado registrado:** codigo. Commit b88ce380 activo en Render. Dos muestras consecutivas confirmaron disponibilidad. Piloto único; coordinación de varios autónomos pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-DESPACHO-3D-MOTOR · SYS-DESPACHO-3D → SVC-AUTON-CLOUD · api · Conversación y operaciones del puesto ligadas al caso y actor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-PORTERO · SVC-AUTON-CLOUD → GAS-PORTERO · api · Identidad, contexto, objetivos y cola autorizados · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-ESTADO · SVC-AUTON-CLOUD → STORE-AUTON-ESTADO · persistencia · Conocimiento y recibos por expediente con revisión · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-JEV · SVC-AUTON-CLOUD → EXT-JEV · integracion · Orientar y ordenar fuentes autorizadas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-DRIVE · SVC-AUTON-CLOUD → EXT-DRIVE · lectura · Leer originales, documentos y pasajes del expediente · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-OPENAI · SVC-AUTON-CLOUD → EXT-OPENAI · integracion · Voz y herramientas con claves de servidor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-RENDER-MOTOR · EXT-RENDER → SVC-AUTON-CLOUD · alojamiento · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Compone motor, voz, investigación, objetivos y conocimiento por caso. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/server.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/server.mjs)

**Evidencia de conexiones:**

- [CON-DESPACHO-3D-MOTOR · Conversación y operaciones del puesto ligadas al caso y actor · Estado: codigo · yodesarrollomx/yod-portal · despacho3d/agent-workspace.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/agent-workspace.mjs)
- [CON-MOTOR-PORTERO · Identidad, contexto, objetivos y cola autorizados · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/server.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/server.mjs)
- [CON-MOTOR-ESTADO · Conocimiento y recibos por expediente con revisión · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/case-knowledge.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/case-knowledge.mjs)
- [CON-MOTOR-JEV · Orientar y ordenar fuentes autorizadas · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/RESEARCH.md · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/RESEARCH.md)
- [CON-MOTOR-DRIVE · Leer originales, documentos y pasajes del expediente · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/RESEARCH.md · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/RESEARCH.md)
- [CON-MOTOR-OPENAI · Voz y herramientas con claves de servidor · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/voice-lane.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/voice-lane.mjs)
- [CON-RENDER-MOTOR · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · alexpueblag/yod-agent-cloud · cloud/README.txt · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/README.txt)

**Pendientes y límites:**

- 7 conexiones sin verificación de ejecución registrada.

### OpenAI · conversación y ejecución · EXT-OPENAI

**Función:** Proveer voz y respuestas con herramientas del servidor.

**Fuente oficial:** Configuración de sesión y herramientas autorizadas en servidor; resultados deben comprobarse contra registros de negocio.

**Responsable operativo:** Dirección técnica

**Estado registrado:** codigo. Voz configurada y disponible en el piloto. Micrófono físico e interacción de Dirección requieren aceptación independiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-MOTOR-OPENAI · SVC-AUTON-CLOUD → EXT-OPENAI · integracion · Voz y herramientas con claves de servidor · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Sesión de voz y herramientas conectadas desde el servidor. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/voice-lane.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/voice-lane.mjs)

**Evidencia de conexiones:**

- [CON-MOTOR-OPENAI · Voz y herramientas con claves de servidor · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/voice-lane.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/voice-lane.mjs)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### Render · alojamiento del motor · EXT-RENDER

**Función:** Alojar el servicio existente y su volumen persistente.

**Fuente oficial:** Configuración efectiva y versión activa del proveedor, separadas de los blueprints del repositorio.

**Responsable operativo:** Dirección técnica

**Estado registrado:** ejecucion. Commit b88ce380 confirmado live el 7-oct-2026 05:08:53 UTC. Disponibilidad comprobada a 05:10:46 y 05:10:56 UTC; no promesa de continuidad ininterrumpida.

**Conexiones registradas; no habilitan operaciones:**

- CON-RENDER-MOTOR · EXT-RENDER → SVC-AUTON-CLOUD · alojamiento · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Alojamiento del servicio con volumen durable. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/README.txt · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/README.txt)
- Conector Render confirmó la versión activa y el monitor de disponibilidad obtuvo dos muestras listas; recibos en la bitácora privada. · Estado: ejecucion · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- [CON-RENDER-MOTOR · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · alexpueblag/yod-agent-cloud · cloud/README.txt · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/README.txt)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
