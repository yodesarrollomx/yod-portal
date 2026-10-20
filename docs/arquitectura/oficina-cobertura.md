# YOD OS · Cobertura de la oficina

**Observación:** 2026-10-07T05:34:28Z · **Revisión:** 2026-10-20.puesto-agente2.1

**Encargado de verificación:** Coordinación técnica YOD

Inventario conciliado y asignación funcional propuesta. No concede permisos, no cambia geometría, no acredita integración operativa completa.

La ubicación es propuesta. Este documento no concede permisos, no activa herramientas y no certifica integración operativa.

- 26 sistemas y 90 componentes distribuidos exactamente una vez.
- 10 áreas; 143 conexiones registradas, 10 marcadas como verificadas en el atlas.

## Conciliación del catálogo

**Observado:** 2026-10-07T05:34:28Z

**Operativo:** SYS-PORTAL, SYS-MIRAMAR, SYS-TAREAS, SYS-FLUJO, SYS-INTERIORES, SYS-MARKETING, SYS-POTENCIALES, SYS-INVERSION, SYS-CONTROL, SYS-TRACK, SYS-OBRA, SYS-DESPACHO

**Técnico:** SYS-DESPACHO, SYS-POTENCIALES, SYS-TRACK, SYS-MIRAMAR, SYS-TAREAS, SYS-FLUJO, SYS-INTERIORES, SYS-INVERSION, SYS-MARKETING, SYS-OBRA, SYS-CONTROL

**Equivalencias declaradas:** SYS-PORTAL → SYS-YOD-OS

Los IDs originales se conservan; resolver un alias no modifica permisos.

## Dirección

**Ubicación propuesta:** decisions · 12 componentes.

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

**Estado registrado:** declarado. Portal PR141 publicado en Pages (0351157). El clienteWeb y origen ya estaban registrados correctamente: OS recupera Referer de sólo origen y GSI devuelve200 en publicación escritorio/móvil. No acredita inicio de sesión personal, micrófono físico ni cobertura operativa completa de YOD. Implementado283 en rama: diagnóstico seguro de canje; publicación pendiente.

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
- [GSI recupera origen mediante strict-origin; A/B real pasa400→200 y confirma Referer sin rutas/query. No modifica clientesOAuth ni acredita login personal completo. · Estado: ejecucion · yodesarrollomx/yod-portal · os/index.html · Revisión: 0351157a71ec9fc3c5b3beae70702c92646ece58](https://github.com/yodesarrollomx/yod-portal/blob/0351157a71ec9fc3c5b3beae70702c92646ece58/os/index.html)
- CHG-CHINCHES-SECUENCIA-20261020: voz, trazos y capturas sincronizados en componente común; archivo privado y recibo por ID/SHA256. Propuesta autorizada; publicación y backend se verifican aparte. · Estado: propuesto · Sin revisión inmutable en esta referencia

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
- CON-SALUD-ACCESOS · SYS-CONTROL → SYS-POTENCIALES · observacion · Informe técnico por proceso visible en Accesos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-SALUD-SALA · SYS-SALA → SYS-CONTROL · observacion · Lecturas agregadas y canario aislado de Sala · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-SALUD-ACTIONS · SYS-CONTROL → EXT-ACTIONS · observacion · Pruebas programadas y evidencia de ejecución · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-HORARIOS-ACCESOS · SVC-HORARIOS-CLOUD → SYS-CONTROL · integracion · Resultados sanitizados observados desde Accesos · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- Lecturas acotadas de Portal, registro Sistemas, esquema de Bitácora y configuración de roles/permisos, sin correos ni exportación de Accesos. Pruebas descritas en control-maestro.md. · Estado: ejecucion · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-043 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-PPP-AUDITORIA · Registro operativo privado actualizado; auditoría de transporte desplegada y activador de edición directa instalado. Primer evento real y recorrido de edición todavía sin observar. · Estado: codigo · Revisión: Apps Script version 53
- CON-SALUD-ACCESOS · Solicitud explícita de Dirección el11-oct-2026; implementación pendiente. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-SALUD-ACCESOS · Frontend Accesos publicado byte exacto y8 recorridos aislados. Validación real del usuario al abrir conserva su autoridad; no certificar el rol personal por pruebas sintéticas. · Estado: codigo · yodesarrollomx/yod-portal · docs/SALUD-SISTEMAS.md · Revisión: de33d90af87e9b5b225b0405841145348d42b8b0](https://github.com/yodesarrollomx/yod-portal/blob/de33d90af87e9b5b225b0405841145348d42b8b0/docs/SALUD-SISTEMAS.md)
- CON-SALUD-SALA · Solicitud explícita de Dirección el11-oct-2026; implementación pendiente. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-SALUD-SALA · Monitor38170852821 y canario38170259463 success; resultados técnicos y fuentes leídas realmente, con alcance/caducidad.40 correctos,59 pendientes; sin operaciones comerciales como prueba. · Estado: ejecucion · yodesarrollomx/yod-portal · docs/SALUD-SISTEMAS.md · Revisión: de33d90af87e9b5b225b0405841145348d42b8b0](https://github.com/yodesarrollomx/yod-portal/blob/de33d90af87e9b5b225b0405841145348d42b8b0/docs/SALUD-SISTEMAS.md)
- CON-SALUD-ACTIONS · Solicitud explícita de Dirección el11-oct-2026; implementación pendiente. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-SALUD-ACTIONS · Monitor38170852821 y canario38170259463 success; resultados técnicos y fuentes leídas realmente, con alcance/caducidad.40 correctos,59 pendientes; sin operaciones comerciales como prueba. · Estado: ejecucion · yodesarrollomx/yod-portal · docs/SALUD-SISTEMAS.md · Revisión: de33d90af87e9b5b225b0405841145348d42b8b0](https://github.com/yodesarrollomx/yod-portal/blob/de33d90af87e9b5b225b0405841145348d42b8b0/docs/SALUD-SISTEMAS.md)
- CON-HORARIOS-ACCESOS · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-ACCESOS · Cliente publicado y doce recorridos aislados; sesión administradora personal no operada por el agente. · Estado: codigo · yodesarrollomx/yod-portal · os/yod-salud.js · Revisión: 9b2e5f4497878223aba26531076c64894e17823e](https://github.com/yodesarrollomx/yod-portal/blob/9b2e5f4497878223aba26531076c64894e17823e/os/yod-salud.js)

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.
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

**Fuente oficial:** Implementación existente y hojas canónicas. V72 verificada el 2026-10-09 para metadatos autorizados de autones; pruebas de negocio históricas conservan su alcance específico.

**Responsable operativo:** Responsable técnico del backend

**Estado registrado:** codigo. Publicación API V66 desde V65 reportada por coordinador: adaptador PPP recuperado, siete archivos idénticos, misma URL/scopes/ACL y editor/candidato/versión iguales. GET real Patrimonial aprobado y 166 celdas exactas con Sheets en el caso inspeccionado; geometría pendiente. Vertical y otros casos no acreditados; aceptación final pendiente. Despacho126: V72 comprobada por lectura independiente el 2026-10-09; display\_name autorizado y perfiles adultos sin cambiar IDs ni URL. La lectura de metadatos no amplía la aceptación financiera.

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
- CON-BROKER-PREEVALUATION · SYS-INVERSION → GAS-PORTERO · api · Preevaluación y retorno de terreno a cartera · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-PORTERO · GAS-BANDEJA-NUBE → GAS-PORTERO · autorizacion · Revalidar identidad de Dirección para aprobar y antes de enviar · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BROKERS-PPP-SAVED · SYS-INVERSION → GAS-PORTERO · lectura · Resumen guardado de PPP por expediente · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: ausente · Estado: declarado · yodesarrollomx/potenciales-yod · CLAUDE.md · Revisión: HEAD\_baseline
- Registro backends-verificados.json: versión activa 51 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección. · Estado: codigo · Revisión: Apps Script version 51
- CHG-CONTROL-MAESTRO-001: versión 52; publicación contrastada por API y pruebas HTTP de lectura y rechazo el 2026-10-01. Detalle en control-maestro.md y registro de backends. · Estado: ejecucion · Revisión: Apps Script version 52
- CHG-PPP-BACKEND-001: versión53 observada tras actualizar la implementación existente; fuente de editor releída idéntica, configuración conservada y lectura HTTP autorizada de caso/lista conciliada. Activador directo instalado; sin POST de prueba. · Estado: ejecucion · Revisión: Apps Script version 53
- Preflight privado de Corcho comunicado por el coordinador: implementación existente V57, editor igual a fuente activa, principal de Dirección y scopes Drive completos ya autorizados. No acredita adapter Corcho desplegado. · Estado: declarado · Revisión: Apps Script version 57
- Relevo del coordinador confirmado por Dirección el 5-oct: fuente activa/editor V65 idénticos, adaptador Patrimonial ausente y GET sheet-model Patrimonial con error servidor; recuperación \#47 propuesta. Detalles y snapshots privados. · Estado: declarado · Revisión: Apps Script version 65; 2026-10-05
- Coordinador reporta publicación API V66 desde V65: CAS/readback confirma siete archivos idénticos y sólo Code PPP adaptado; misma URL/scopes/ACL y editor == candidato == versión inmutable V66. GET funcional posterior pendiente; sin POST de pruebas de negocio. · Estado: declarado · Revisión: Apps Script version 66; 2026-10-05
- Coordinador reporta GET real Patrimonial V66 aprobado y 166 celdas exactas con Sheets en el caso inspeccionado; dos escenarios conservan IDs y 269 campos, geometría pendiente. Acta privada fuera del repositorio. Vertical y otros casos no acreditados. · Estado: declarado · Revisión: Apps Script version 66; cotejo Patrimonial 2026-10-05
- V72 verificada en ejecución privada37888901829: HEAD y versión coinciden en hash189630ca1ab4d19c17f54f9e13caacbfb6aa99c44ad34240ad6275d806224d3d; mismos IDs/implementación/URL. display\_name separado de avatar.name canónico; no certifica escrituras de negocio. · Estado: ejecucion · Revisión: Apps Script version72; 2026-10-09

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
- [CON-BROKER-PREEVALUATION · PR12 integrado: lanzamiento de un solo uso y retorno autorizado; backend v92 publicado, flujo individual comprobado con servicios sintéticos. · Estado: codigo · yodesarrollomx/yodesarrollo-board · brokers-evaluator.js · Revisión: 19fbe950af458778607f2ae0baa70b8bc7894105](https://github.com/yodesarrollomx/yodesarrollo-board/blob/19fbe950af458778607f2ae0baa70b8bc7894105/brokers-evaluator.js)
- CON-BANDEJA-PORTERO · Permiso privado ligado a sesión real, tarjeta, huella y última aprobación; veto aparte de comentarios. Regresiones sintéticas aprobadas; consentimiento y sesión real pendientes. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/Approval.gs · Sin revisión inmutable en esta referencia
- CON-BANDEJA-PORTERO · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia
- CON-BROKERS-PPP-SAVED · Consumo propuesto del mismo contrato empleado por el PPP; lectura autorizada y campos guardados se comprobarán por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 26 conexiones sin verificación de ejecución registrada.
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

### Ejecutor de Bandeja en nube · GAS-BANDEJA-NUBE

**Función:** Revisar los encargos BANDEJA existentes, rehacer borradores por API y ejecutar sólo envíos aprobados

**Fuente oficial:** BANDEJA en SHEET-OPERACION; Gmail conserva borradores y mensajes. Registro técnico aparte sólo para idempotencia y salud.

**Responsable operativo:** Dirección

**Estado registrado:** codigo. Proyecto Google creado y publicado por API; fuente/hash/versión2 cotejados sobre la misma implementación. Consentimiento Gmail, libro efectivo, timer nativo, relevo y envío pendientes.

**Conexiones registradas; no habilitan operaciones:**

- CON-BANDEJA-TAREAS · GAS-BANDEJA-NUBE → SHEET-OPERACION · persistencia · Leer BANDEJA y añadir resultados al mismo libro · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-GMAIL · GAS-BANDEJA-NUBE → EXT-GMAIL · api · Borradores y envíos aprobados por API · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-IA · GAS-BANDEJA-NUBE → EXT-OPENAI · api · Redactar cambios con API de pago por uso · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-RECIBOS · GAS-BANDEJA-NUBE → STORE-BANDEJA-RECIBOS · persistencia · Intención durable antes del efecto · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-SALUD · GAS-BANDEJA-NUBE → SVC-HORARIOS-CLOUD · observacion · Recibo técnico leído por el vigilante y mostrado en Accesos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-PORTERO · GAS-BANDEJA-NUBE → GAS-PORTERO · autorizacion · Revalidar identidad de Dirección para aprobar y antes de enviar · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Dirección autorizó continuar la migración de automatizaciones a APIs de nube y preparar el cierre para Claude Chrome. · Estado: declarado · Sin revisión inmutable en esta referencia
- [Instalación API38187136866 y actualización38187558929:fuente exacta y versión2 sobre proyecto dedicado original, cero escrituras de negocio; no son eventos del timer. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/Ejecutor.gs · Revisión: 4daeedbf4017576acd4ff1a903a74df538f6d317](https://github.com/alexpueblag/yod-agent-cloud/blob/4daeedbf4017576acd4ff1a903a74df538f6d317/server/bandeja/Ejecutor.gs)

**Evidencia de conexiones:**

- CON-BANDEJA-TAREAS · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-TAREAS · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia
- CON-BANDEJA-GMAIL · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-GMAIL · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia
- CON-BANDEJA-IA · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-IA · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia
- CON-BANDEJA-RECIBOS · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-RECIBOS · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia
- CON-BANDEJA-SALUD · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-SALUD · Render publicó seis comprobaciones de Bandeja pendientes, en el mismo servidor. Pruebas públicas de lectura y bytes separadas del consentimiento y la ejecución Google. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia
- CON-BANDEJA-PORTERO · Permiso privado ligado a sesión real, tarjeta, huella y última aprobación; veto aparte de comentarios. Regresiones sintéticas aprobadas; consentimiento y sesión real pendientes. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/Approval.gs · Sin revisión inmutable en esta referencia
- CON-BANDEJA-PORTERO · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 6 conexiones sin verificación de ejecución registrada.
- Gmail y Sheets no comparten transacción; no prometer entrega ni cancelación sin recibo real.
- Rutina Claude y nuevo ejecutor no pueden enviar en paralelo.

### Recibos privados de Bandeja · STORE-BANDEJA-RECIBOS

**Función:** Reservar efectos antes de Gmail y conciliar resultados inciertos sin repetir envíos

**Fuente oficial:** Sólo intención/resultado técnico de los efectos producidos por GAS-BANDEJA-NUBE.

**Responsable operativo:** Dirección

**Estado registrado:** codigo. Reserva/permiso privados implementados y probados con dobles. ScriptProperties reales de la rutina no se acreditan hasta ejecutar instalación con el propietario.

**Conexiones registradas; no habilitan operaciones:**

- CON-BANDEJA-RECIBOS · GAS-BANDEJA-NUBE → STORE-BANDEJA-RECIBOS · persistencia · Intención durable antes del efecto · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Almacén técnico privado propuesto; no copia ni sustituye tareas, comentarios o borradores de los sistemas canónicos. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [44 regresiones de Bandeja/vigilante: identidad real, reserva, veto privado, respuesta perdida, reinicio, conciliación, timer/observación y salud con fechas. Pruebas sintéticas. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/Approval.gs · Revisión: 4daeedbf4017576acd4ff1a903a74df538f6d317](https://github.com/alexpueblag/yod-agent-cloud/blob/4daeedbf4017576acd4ff1a903a74df538f6d317/server/bandeja/Approval.gs)

**Evidencia de conexiones:**

- CON-BANDEJA-RECIBOS · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-RECIBOS · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.
- Cupo de ScriptProperties: los resultados inciertos no se podan ni se reintentan por falta de espacio.

## Comercial

**Ubicación propuesta:** funnel · 16 componentes.

### Plan de Potencial · SYS-PLAN-POTENCIAL

**Función:** Captar dueños de terreno y convertirlos a videollamada y servicio de pago

**Fuente oficial:** Fuente de GitHub; despliegue y datos reales por verificar

**Responsable operativo:** Responsable del proceso por confirmar

**Estado registrado:** declarado. Lectura automática agregada confirmada; backend de captación, inventario Apps Script/Calendar/pagos por verificar.

**Conexiones registradas; no habilitan operaciones:**

- CON-023 · SYS-PLAN-POTENCIAL → GAS-PLAN-POTENCIAL · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-075 · SYS-INVERSION → SYS-PLAN-POTENCIAL · captacion · CTA con atribución de presentación · Estado: declarado · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Cadena comercial documentada · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline
- [Lectura de atribución del Sheet canónico comprobada mediante worker Sala; no acredita el despliegue completo del formulario, backend, pagos o Calendar. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/plan\_agregados.py · Revisión: a3b6c7053b3cd26333dd06878e74bb666288ce51](https://github.com/yodesarrollomx/sala-edicion/blob/a3b6c7053b3cd26333dd06878e74bb666288ce51/nube/plan_agregados.py)

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

**Estado registrado:** ejecucion. Run38157069665: 76 publicaciones Meta y Plan histórico confirmado con recibo/hash/frescura; leads\_medicion\_caida=false. Seis registros históricos válidos, cuatro sesiones registradas, una prueba excluida y sólo una atribución campaña/pieza. Captación/pagos/Calendar y backends originales no acreditados por esta lectura.

**Conexiones registradas; no habilitan operaciones:**

- CON-021 · SYS-MARKETING → GAS-MARKETING · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-022 · SYS-MARKETING → GAS-PLAN-POTENCIAL · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-041 · SYS-YOD-OS → SYS-MARKETING · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-049 · SYS-MARKETING → GAS-PORTERO · autenticacion · Canje de sesión y permisos · Estado: declarado · Ejecución no verificada en el atlas.
- CON-060 · EXT-META → SYS-MARKETING · integracion · Obtiene métricas mediante Actions · Estado: declarado · Ejecución no verificada en el atlas.
- CON-076 · GAS-PLAN-POTENCIAL → SYS-MARKETING · atribucion · Cruza campañas/piezas con leads y citas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-077 · SYS-SALA-OPERACION → SYS-MARKETING · automatizacion · Genera métricas de campañas en utilidades históricas · Estado: pendiente · Ejecución no verificada en el atlas.
- CON-PUBLICADOR-MARKETING · EXT-GITHUB-PUBLISHER-APP → SYS-MARKETING · automatizacion · Crea PR del commit preparado de Marketing · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-MARKETING-DATOS-ONLINE · SYS-MARKETING → EXT-ACTIONS · publicacion · Agregados públicos en rama de datos; UI de Pages conserva código aprobado · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-PLAN-METRICAS-ONLINE · SYS-SALA → SYS-MARKETING · lectura · Marketing consume agregados de Plan publicados con hash · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- [PR76/77 integrados. Run 38141736288 success; rama de datos agregados y lector verifican 76 publicaciones y snapshot 409673351. Main conserva PR/CI. · Estado: ejecucion · yodesarrollomx/aurum-board · docs/ONLINE.md · Revisión: 6ad059cd1ed97edee894df5a9b2032d919143e0f](https://github.com/yodesarrollomx/aurum-board/blob/6ad059cd1ed97edee894df5a9b2032d919143e0f/docs/ONLINE.md)
- [PR78 integrado; run 38157069665 success. Plan lectura confirmada con hash y frescura; leads\_medicion\_caida=false, 76 publicaciones Meta. El lector HTTP comprueba bytes/recibo de snapshot409795880. · Estado: ejecucion · yodesarrollomx/aurum-board · scripts/pull\_metrics.py · Revisión: e3dd428a01b01d1c8b5775c7fcca408735c98357](https://github.com/yodesarrollomx/aurum-board/blob/e3dd428a01b01d1c8b5775c7fcca408735c98357/scripts/pull_metrics.py)

**Evidencia de conexiones:**

- CON-021 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-022 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-041 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-049 · Cada backend valida su acceso · Estado: declarado · yodesarrollomx/yod-portal · CLAUDE.md · Revisión: HEAD\_baseline
- CON-060 · Generación periódica de métricas · Estado: declarado · yodesarrollomx/aurum-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-076 · Atribución implementada a nivel campaña y pieza · Estado: codigo · yodesarrollomx/aurum-board · scripts/pull\_metrics.py · Revisión: HEAD\_baseline
- CON-077 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-PUBLICADOR-MARKETING · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia
- [CON-MARKETING-DATOS-ONLINE · Run 38141736288 success: actualizó y publicó 76 publicaciones de Meta, confirmó hash/recibo del HTTP real y conservó el snapshot como draft privado. · Estado: ejecucion · yodesarrollomx/aurum-board · scripts/snapshots\_online.py · Revisión: 6ad059cd1ed97edee894df5a9b2032d919143e0f](https://github.com/yodesarrollomx/aurum-board/blob/6ad059cd1ed97edee894df5a9b2032d919143e0f/scripts/snapshots_online.py)
- [CON-MARKETING-DATOS-ONLINE · LECTOR\_ONLINE ok:true, posts:76, run\_id:38141736288. El navegador recibe sólo agregados/covers y verifica SHA256. Plan rechazado mantiene último dato acreditado y señal de medición incompleta. · Estado: ejecucion · yodesarrollomx/aurum-board · metrics-online.js · Revisión: 6ad059cd1ed97edee894df5a9b2032d919143e0f](https://github.com/yodesarrollomx/aurum-board/blob/6ad059cd1ed97edee894df5a9b2032d919143e0f/metrics-online.js)
- [CON-MARKETING-DATOS-ONLINE · PR78 integrado; run 38157069665 success. Plan lectura confirmada con hash y frescura; leads\_medicion\_caida=false, 76 publicaciones Meta. El lector HTTP comprueba bytes/recibo de snapshot409795880. · Estado: ejecucion · yodesarrollomx/aurum-board · metrics-online.js · Revisión: e3dd428a01b01d1c8b5775c7fcca408735c98357](https://github.com/yodesarrollomx/aurum-board/blob/e3dd428a01b01d1c8b5775c7fcca408735c98357/metrics-online.js)
- [CON-PLAN-METRICAS-ONLINE · PR78 integrado; run 38157069665 success. Plan lectura confirmada con hash y frescura; leads\_medicion\_caida=false, 76 publicaciones Meta. El lector HTTP comprueba bytes/recibo de snapshot409795880. · Estado: ejecucion · yodesarrollomx/aurum-board · scripts/pull\_metrics.py · Revisión: e3dd428a01b01d1c8b5775c7fcca408735c98357](https://github.com/yodesarrollomx/aurum-board/blob/e3dd428a01b01d1c8b5775c7fcca408735c98357/scripts/pull_metrics.py)

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
- CON-INVESTOR-STORY-TEXTS · SYS-INVERSION → GAS-PLAN-POTENCIAL · lectura · Lee copy público de presentación por recurso=textos · Estado: propuesto · Ejecución no verificada en el atlas.

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
- CON-INVESTOR-STORY-TEXTS · GET de textos comerciales ya utilizado por la landing pública; propuesta de consumo por la primera escena de inversión. · Estado: codigo · yodesarrollomx/plan-potencial · index.html · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 7 conexiones sin verificación de ejecución registrada.
- Permisos por operación y recorridos por rol pendientes de prueba

### Datos de Captación de Plan Potencial · SHEET-PLAN-POTENCIAL

**Función:** Almacenar registros del dominio ventas

**Fuente oficial:** Hoja canónica contrastada mediante metadatos, encabezados y valores acotados; identidad técnica sólo en configuración privada.

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** ejecucion. Permiso lector de la cuenta de servicio y ejecución cloud verificados: sólo columnas contractuales; no crear/modificar leads. Calidad del resto de columnas y código del backend original pendientes.

**Conexiones registradas; no habilitan operaciones:**

- CON-006 · GAS-PLAN-POTENCIAL → SHEET-PLAN-POTENCIAL · persistencia · Lee/escribe registros del dominio · Estado: declarado · Ejecución no verificada en el atlas.
- CON-PLAN-SHEETS-ONLINE · SHEET-PLAN-POTENCIAL → SYS-SALA · lectura · Lectura de Plan por cuenta de servicio y salida agregada · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- Metadatos y encabezados de LEADS - POTENCIAL contrastados con documentación y lecturas autorizadas acotadas el11-oct-2026. Datos y ID físico omitidos del atlas; autoridad del runtime de servicio pendiente. · Estado: ejecucion · Sin revisión inmutable en esta referencia
- [PR266/267/268 integrados. Run 38156397507 success: cuenta de servicio existente con permiso lector, consulta autenticada GViz sólo cuando Sheets API está deshabilitada, columnas permitidas, exclusión de prueba y publicación verificada. Fuente no modificada. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/plan\_agregados.py · Revisión: a3b6c7053b3cd26333dd06878e74bb666288ce51](https://github.com/yodesarrollomx/sala-edicion/blob/a3b6c7053b3cd26333dd06878e74bb666288ce51/nube/plan_agregados.py)

**Evidencia de conexiones:**

- CON-006 · Backend asociado al almacén de su dominio · Estado: declarado · yodesarrollomx/plan-potencial · CLAUDE.md · Revisión: HEAD\_baseline
- [CON-PLAN-SHEETS-ONLINE · PR266/267/268 integrados. Run 38156397507 success: cuenta de servicio existente con permiso lector, consulta autenticada GViz sólo cuando Sheets API está deshabilitada, columnas permitidas, exclusión de prueba y publicación verificada. Fuente no modificada. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/plan\_agregados.py · Revisión: a3b6c7053b3cd26333dd06878e74bb666288ce51](https://github.com/yodesarrollomx/sala-edicion/blob/a3b6c7053b3cd26333dd06878e74bb666288ce51/nube/plan_agregados.py)

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 1 conexiones sin verificación de ejecución registrada.
- Verificación limitada a columnas contractuales; no acredita calidad de campos privados no leídos ni confirmación independiente de Calendar.

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
- CON-PPP-CARTERA-LECTURA · SYS-POTENCIALES → GAS-CRM · api · Lee expedientes previos al PPP y su historial autorizado · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Endpoint específico del CRM · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- Registro backends-verificados.json: versión activa 20 comprobada por API el 2026-10-01, con misma implementación, URL y permisos; pruebas aisladas de la corrección. · Estado: codigo · Revisión: Apps Script version 20

**Evidencia de conexiones:**

- CON-065 · Conector de CRM · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-066 · Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- CON-AUTH-CRM · Revisión de fuente activa GAS-CRM, versión 20; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. · Estado: codigo · Revisión: Apps Script version 20
- CON-PPP-CARTERA-LECTURA · Propuesta de lector brokers\_snapshot sobre brokers.v1 existente; no acredita sesión privada real. · Estado: propuesto · yodesarrollomx/yod-portal · docs/arquitectura/ppp-cartera-lectura.md · Revisión: CHG-PPP-CARTERA-LECTURA-20261019

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.
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
- CON-SALA-CORREO-ONLINE · GAS-SALA → EXT-GMAIL · correo · Correo diario y entrada al destinatario existente · Estado: ejecucion · Ejecución no verificada en el atlas.
- CON-BANDEJA-GMAIL · GAS-BANDEJA-NUBE → EXT-GMAIL · api · Borradores y envíos aprobados por API · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-061 · Rutina externa declarada con aprobación humana · Estado: declarado · yodesarrollomx/yod-despacho · EJECUTOR.md · Revisión: HEAD\_baseline
- [CON-SALA-CORREO-ONLINE · Bitácora del backend registra correo diario tres días a07:13Hermosillo; solicitud de entrada38166137118 aceptada y acuse privado byte-verificado. Recepción en Gmail y fuente/inventario completo de disparadores siguen sin verificar. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/correo\_estado.py · Revisión: 4582fc3c42a2ac8459dea7d553c42f9719f07962](https://github.com/yodesarrollomx/sala-edicion/blob/4582fc3c42a2ac8459dea7d553c42f9719f07962/nube/correo_estado.py)
- CON-BANDEJA-GMAIL · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-GMAIL · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 3 conexiones sin verificación de ejecución registrada.
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
- CON-SALUD-ACCESOS · SYS-CONTROL → SYS-POTENCIALES · observacion · Informe técnico por proceso visible en Accesos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-PPP-CARTERA-LECTURA · SYS-POTENCIALES → GAS-CRM · api · Lee expedientes previos al PPP y su historial autorizado · Estado: propuesto · Ejecución no verificada en el atlas.

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
- CON-SALUD-ACCESOS · Solicitud explícita de Dirección el11-oct-2026; implementación pendiente. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-SALUD-ACCESOS · Frontend Accesos publicado byte exacto y8 recorridos aislados. Validación real del usuario al abrir conserva su autoridad; no certificar el rol personal por pruebas sintéticas. · Estado: codigo · yodesarrollomx/yod-portal · docs/SALUD-SISTEMAS.md · Revisión: de33d90af87e9b5b225b0405841145348d42b8b0](https://github.com/yodesarrollomx/yod-portal/blob/de33d90af87e9b5b225b0405841145348d42b8b0/docs/SALUD-SISTEMAS.md)
- CON-PPP-CARTERA-LECTURA · Propuesta de lector brokers\_snapshot sobre brokers.v1 existente; no acredita sesión privada real. · Estado: propuesto · yodesarrollomx/yod-portal · docs/arquitectura/ppp-cartera-lectura.md · Revisión: CHG-PPP-CARTERA-LECTURA-20261019

**Pendientes y límites:**

- 5 conexiones sin verificación de ejecución registrada.
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

**Función:** Observar y conversar con el autón del proyecto, consultar su PPP y seguir el trabajo en un único puesto. Equipo se monta desde cabina Dirección con época real, transporte autorizado y teardown; conexión productiva pendiente.

**Fuente oficial:** Perfil y expediente autorizados por servidor; PPP conserva su libro y Store canónicos.

**Responsable operativo:** Dirección técnica

**Estado registrado:** codigo. Versión normal126 publicada por PR141 (0351157): presencia de tres proyectos autorizados, puestos PPP/Trabajo/Expediente y pantallas ligadas al caso. Siete recorridos de navegador aprobados con datos sintéticos; accesoGSI400 corregido en OS enviando sólo el origen. No acredita micrófono físico ni apariencia/datos del PPP nativo privado. Puesto2.0 piloto implementado localmente por CHG-PUESTO-AGENTE-2-20261020; sin publicación ni recorrido Chromium HTTP verificados todavía.

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
- [Publicación126 con bitácora, geometría de avatar, presencia y estaciones aisladas por caso; evidencia de navegador distingue fixtures de solicitudesGSI reales. · Estado: ejecucion · yodesarrollomx/yod-portal · docs/arquitectura/despacho126-resultados.md · Revisión: 0351157a71ec9fc3c5b3beae70702c92646ece58](https://github.com/yodesarrollomx/yod-portal/blob/0351157a71ec9fc3c5b3beae70702c92646ece58/docs/arquitectura/despacho126-resultados.md)
- Puesto2.0 implementado localmente en puesto-agente.mjs/css: avatar existente, hilo visible, vistas propias, resumen de snapshot confirmado y retorno clásico; publicación y recorrido Chromium HTTP pendientes. · Estado: codigo · yodesarrollomx/yod-portal · docs/arquitectura/puesto-agente2.md · Sin revisión inmutable en esta referencia

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

**Estado registrado:** codigo. Fuente activa inspeccionada y respaldada el12-oct-2026; puente de entregas propuesto y publicación pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-003 · GAS-OPERACION → SHEET-OPERACION · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-016 · SYS-DESPACHO → GAS-OPERACION · api · Tareas ordinarias getAll/update en Operación · Estado: declarado · Ejecución no verificada en el atlas.
- CON-017 · SYS-TAREAS → GAS-OPERACION · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-055 · GAS-OPERACION → SYS-YOD-OS · lectura\_agregada · Agrega indicadores en tablero cenital · Estado: codigo · Ejecución no verificada en el atlas.
- CON-DESPACHO-CORCHO-STORE · GAS-OPERACION → STORE-DESPACHO-CORCHO · persistencia · Futuro Ops: mismo almacén Corcho tras identificar proyecto · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fragmento\_autenticacion · Estado: codigo · yodesarrollomx/board-aurum · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- [Lectura API de fuente y versión activa con hashes y respaldos privados; ningún cambio de datos. · Estado: ejecucion · alexpueblag/yod-agent-cloud · scripts/apps-script/inspect-moac.mjs · Revisión: 44e6dda9a36c84fda3116d863ff11361642ecb3b](https://github.com/alexpueblag/yod-agent-cloud/blob/44e6dda9a36c84fda3116d863ff11361642ecb3b/scripts/apps-script/inspect-moac.mjs)

**Evidencia de conexiones:**

- CON-003 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/board-aurum · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- CON-016 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/yod-despacho · README.md · Revisión: HEAD\_baseline
- [CON-016 · Cliente existente de tareas; separación de Corcho preparada por coordinador, todavía no integrada en el frontend publicado. · Estado: codigo · yodesarrollomx/yod-despacho · app.js · Revisión: 32330badba66dd9b23a7413498f421aeb628c9cb](https://github.com/yodesarrollomx/yod-despacho/blob/32330badba66dd9b23a7413498f421aeb628c9cb/app.js)
- CON-017 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/board-aurum · README.md · Revisión: HEAD\_baseline
- CON-055 · Conector de resumen · Estado: codigo · yodesarrollomx/yod-portal · tablero.html · Revisión: HEAD\_baseline
- CON-DESPACHO-CORCHO-STORE · CHG-DESPACHO-CORCHO-PROVISIONAL-035: Migración futura condicionada a identificar editor/implementación Ops y validar el mismo principal, ACL y contrato; conservar archivo e IDs. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 5 conexiones sin verificación de ejecución registrada.

### Datos de Operación y tareas · SHEET-OPERACION

**Función:** Almacenar registros del dominio operacion

**Fuente oficial:** Almacén lógico Google Sheets; correspondencia con archivo vivo por verificar

**Responsable operativo:** Dueño del dato por confirmar

**Estado registrado:** declarado. No verificado en despliegue

**Conexiones registradas; no habilitan operaciones:**

- CON-003 · GAS-OPERACION → SHEET-OPERACION · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-TAREAS · GAS-BANDEJA-NUBE → SHEET-OPERACION · persistencia · Leer BANDEJA y añadir resultados al mismo libro · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-003 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/board-aurum · apps-script/portero-auth.gs · Revisión: HEAD\_baseline
- CON-BANDEJA-TAREAS · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-TAREAS · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 2 conexiones sin verificación de ejecución registrada.
- Esquema y calidad de datos vivos no inspeccionados

### Metas y objetivos de MOAC · GAS-MOAC-METAS

**Función:** Relacionar metas, objetivos y tareas

**Fuente oficial:** Fuente desplegada no disponible

**Responsable operativo:** Responsable técnico

**Estado registrado:** codigo. Fuente activa inspeccionada y respaldada el12-oct-2026; puente de entregas propuesto y publicación pendiente.

**Conexiones registradas; no habilitan operaciones:**

- CON-067 · SYS-TAREAS → GAS-MOAC-METAS · api · Enruta moac/moacSet/moacObjetivo a motor separado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-068 · GAS-MOAC-METAS → SHEET-MOAC-METAS · persistencia · Lee y vincula estrategia · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Motor distinto para acciones moac · Estado: codigo · yodesarrollomx/board-aurum · src/App.jsx · Revisión: HEAD\_baseline
- [Lectura API de fuente y versión activa con hashes y respaldos privados; ningún cambio de datos. · Estado: ejecucion · alexpueblag/yod-agent-cloud · scripts/apps-script/inspect-moac.mjs · Revisión: 44e6dda9a36c84fda3116d863ff11361642ecb3b](https://github.com/alexpueblag/yod-agent-cloud/blob/44e6dda9a36c84fda3116d863ff11361642ecb3b/scripts/apps-script/inspect-moac.mjs)

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

### Masterbrokers · SYS-INVERSION

**Función:** Espacio de trabajo del Masterbroker: oferta comercial, oportunidades propias, solicitudes a YOD, red de contactos y acuerdos por expediente; presentación comercial conservada.

**Fuente oficial:** SHEET-CRM y cartera canónica; SHEET-INVERSION conserva presentación comercial

**Responsable operativo:** Comercial

**Estado registrado:** codigo. Brokers publicado y lectura autenticada de Dirección comprobada; CRM v21. Acceso individual pendiente de correo verificado; guardado en producción no probado.

**Conexiones registradas; no habilitan operaciones:**

- CON-040 · SYS-YOD-OS → SYS-INVERSION · navegacion · Navega al sistema autorizado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-069 · SYS-INVERSION → GAS-INVERSION · api · Lee presentación y guarda diagnóstico · Estado: codigo · Ejecución no verificada en el atlas.
- CON-071 · SYS-INVERSION → GAS-PORTERO · autenticacion · Acceso compartido del equipo · Estado: codigo · Ejecución no verificada en el atlas.
- CON-075 · SYS-INVERSION → SYS-PLAN-POTENCIAL · captacion · CTA con atribución de presentación · Estado: declarado · Ejecución no verificada en el atlas.
- CON-BROKER-PREEVALUATION · SYS-INVERSION → GAS-PORTERO · api · Preevaluación y retorno de terreno a cartera · Estado: codigo · Ejecución no verificada en el atlas.
- CON-INVESTOR-STORY-TEXTS · SYS-INVERSION → GAS-PLAN-POTENCIAL · lectura · Lee copy público de presentación por recurso=textos · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-BROKERS-PPP-SAVED · SYS-INVERSION → GAS-PORTERO · lectura · Resumen guardado de PPP por expediente · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Sistema presente en el catálogo canónico · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CHG-CHINCHES-SECUENCIA-20261020: voz, trazos y capturas sincronizados en componente común; archivo privado y recibo por ID/SHA256. Propuesta autorizada; publicación y backend se verifican aparte. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-040 · Destino del catálogo · Estado: codigo · yodesarrollomx/yod-portal · os/catalogo.js · Revisión: HEAD\_baseline
- CON-069 · Capa de datos de presentación · Estado: codigo · yodesarrollomx/yodesarrollo-board · data-loader.jsx · Revisión: HEAD\_baseline
- CON-069 · Acción de diagnóstico · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline
- CON-071 · Carga del Portero · Estado: codigo · yodesarrollomx/yodesarrollo-board · index.html · Revisión: HEAD\_baseline
- CON-075 · CTA comercial con campaña · Estado: declarado · yodesarrollomx/yodesarrollo-board · CLAUDE.md · Revisión: HEAD\_baseline
- [CON-BROKER-PREEVALUATION · PR12 integrado: lanzamiento de un solo uso y retorno autorizado; backend v92 publicado, flujo individual comprobado con servicios sintéticos. · Estado: codigo · yodesarrollomx/yodesarrollo-board · brokers-evaluator.js · Revisión: 19fbe950af458778607f2ae0baa70b8bc7894105](https://github.com/yodesarrollomx/yodesarrollo-board/blob/19fbe950af458778607f2ae0baa70b8bc7894105/brokers-evaluator.js)
- CON-INVESTOR-STORY-TEXTS · GET de textos comerciales ya utilizado por la landing pública; propuesta de consumo por la primera escena de inversión. · Estado: codigo · yodesarrollomx/plan-potencial · index.html · Sin revisión inmutable en esta referencia
- CON-BROKERS-PPP-SAVED · Consumo propuesto del mismo contrato empleado por el PPP; lectura autorizada y campos guardados se comprobarán por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 7 conexiones sin verificación de ejecución registrada.

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

**Estado registrado:** ejecucion. PR308 integrado y recorridos 38688574369/38688574251/38688731578/38688574178 success en el alcance auditado: Pages y snapshots exactos, productor sin trabajos nuevos y ejecutor sin pendientes. Recepción de correo, equivalencia completa, fallos históricos y producción nueva no acreditados. Nueva externalización de medios propuesta, desactivada y sin canario.

**Conexiones registradas; no habilitan operaciones:**

- CON-031 · SYS-SALA → GAS-SALA · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-063 · SYS-SALA → EXT-ACTIONS · automatizacion · Orquesta producción en la nube · Estado: declarado · Ejecución no verificada en el atlas.
- CON-064 · SYS-SALA-OPERACION → SYS-SALA · automatizacion · Herramientas históricas de producción · Estado: declarado · Ejecución no verificada en el atlas.
- CON-PUBLICADOR-SALA · EXT-GITHUB-PUBLISHER-APP → SYS-SALA · automatizacion · Crea PR del commit preparado de Sala · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-SALA-SNAPSHOT-ONLINE · SYS-SALA → EXT-ACTIONS · publicacion · Snapshots privados de datos públicos y Pages con recibo verificable · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-PLAN-SHEETS-ONLINE · SHEET-PLAN-POTENCIAL → SYS-SALA · lectura · Lectura de Plan por cuenta de servicio y salida agregada · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-PLAN-METRICAS-ONLINE · SYS-SALA → SYS-MARKETING · lectura · Marketing consume agregados de Plan publicados con hash · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-SALUD-SALA · SYS-SALA → SYS-CONTROL · observacion · Lecturas agregadas y canario aislado de Sala · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-SALA-MEDIOS-PUBLICOS · SYS-SALA → EXT-ACTIONS · publicacion · Imágenes nuevas en releases públicos inmutables con manifiesto fijado por recibo · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Decisiones reservadas a editores · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- El cliente automático impide decisiones editoriales antes de la red · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_cliente.py · Revisión: HEAD\_baseline
- El productor planifica compuertas de producción · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline
- El ejecutor solo admite etapas habilitadas por configuración · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- [PR265 integrado. Revisión 38141812652 y Pages 38141874311 success; publicación exacta del snapshot 409673426 y diagnóstico agregado sin filas privadas. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-ONLINE.md · Revisión: 73902861db96d213a07f788996f50fdcf3c65566](https://github.com/yodesarrollomx/sala-edicion/blob/73902861db96d213a07f788996f50fdcf3c65566/docs/SALA-ONLINE.md)
- [PR266/267/268 integrados. Run 38156397507 success: cuenta de servicio existente con permiso lector, consulta autenticada GViz sólo cuando Sheets API está deshabilitada, columnas permitidas, exclusión de prueba y publicación verificada. Fuente no modificada. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/PLAN-ONLINE.md · Revisión: a3b6c7053b3cd26333dd06878e74bb666288ce51](https://github.com/yodesarrollomx/sala-edicion/blob/a3b6c7053b3cd26333dd06878e74bb666288ce51/docs/PLAN-ONLINE.md)
- [PR269 integrado. Run38159239581 success: dos voces originales recuperadas verificadas por MD5/SHA256/tamaño y dos referencias técnicas de COLA actualizadas y leídas de vuelta. Todos los campos operativos/aprobaciones conservados; acuse privado subido y releído byte exacto. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/medios\_reconexion.py · Revisión: 159d932cd81c2d2c3fda31a862ea60fc0b3ae667](https://github.com/yodesarrollomx/sala-edicion/blob/159d932cd81c2d2c3fda31a862ea60fc0b3ae667/nube/medios_reconexion.py)
- [PR270/271 y run38166137118 acreditan cierre, productor/ejecutor y comparación aislada con16 archivos privados byte-verificados. Correo diario registrado y entrada aceptada; recepción y equivalencia completa pendientes. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-CIERRE-ONLINE.md · Revisión: 4582fc3c42a2ac8459dea7d553c42f9719f07962](https://github.com/yodesarrollomx/sala-edicion/blob/4582fc3c42a2ac8459dea7d553c42f9719f07962/docs/SALA-CIERRE-ONLINE.md)
- Ampliación técnica autorizada por Dirección en la conversación actual: recuperación de transporte, publicación acumulativa, correo trazable y conciliación de chinches. Registro previo; la fuente no acredita despliegue. Registro local: docs/arquitectura/sala-nube-20261015.md. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [PR308 integrado; cinco CI del head revisado en verde. Pages 38688574369, Plan 38688574251 y Revisión 38688731578 success; hijos Pages 38688736093 y 38689030877 confirmaron snapshot y data\_sha exactos. Cierre 38688574178 success con acuse privado byte-verificado y cero escrituras de negocio. No acredita correo recibido, producción nueva ni offload. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-ONLINE.md · Revisión: e4da08887e45e984be8ea945ce607db464b0fb52](https://github.com/yodesarrollomx/sala-edicion/blob/e4da08887e45e984be8ea945ce607db464b0fb52/docs/SALA-ONLINE.md)
- CHG-SALA-MESA-LOCAL-20261020: caché de consulta por sesión con actualización en segundo plano; registro previo, sin permisos restaurados ni rendimiento productivo acreditado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CHG-CHINCHES-SECUENCIA-20261020: voz, trazos y capturas sincronizados en componente común; archivo privado y recibo por ID/SHA256. Propuesta autorizada; publicación y backend se verifican aparte. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-031 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-031 · Diseño local del contrato produccion-historica-v1 para corregir exclusión técnica por ventana14d. Aún sin despliegue Apps Script ni GET completo verificado; no cambia ACL/scopes ni habilita flag. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-063 · Ciclo de producción en nube · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-064 · Migración de herramientas a nube · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-PUBLICADOR-SALA · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia
- [CON-SALA-SNAPSHOT-ONLINE · Run 38141812652 publicó la revisión acumulativa y esperó el recibo exacto de Pages run 38141874311; ambos success. ZIP permitido, bloqueo CAS y release permanece draft:true. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/snapshots\_online.py · Revisión: 73902861db96d213a07f788996f50fdcf3c65566](https://github.com/yodesarrollomx/sala-edicion/blob/73902861db96d213a07f788996f50fdcf3c65566/nube/snapshots_online.py)
- [CON-SALA-SNAPSHOT-ONLINE · PR308 integrado. Pages 38688574369, Pages de Plan 38688736093 y Pages de Revisión 38689030877 success con snapshots413444031/413458897/413460646 y recibos exactos. FULL operativo en el alcance inspeccionado; incremental OFF y offload no activado. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/snapshots\_online.py · Revisión: e4da08887e45e984be8ea945ce607db464b0fb52](https://github.com/yodesarrollomx/sala-edicion/blob/e4da08887e45e984be8ea945ce607db464b0fb52/nube/snapshots_online.py)
- [CON-PLAN-SHEETS-ONLINE · PR266/267/268 integrados. Run 38156397507 success: cuenta de servicio existente con permiso lector, consulta autenticada GViz sólo cuando Sheets API está deshabilitada, columnas permitidas, exclusión de prueba y publicación verificada. Fuente no modificada. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/plan\_agregados.py · Revisión: a3b6c7053b3cd26333dd06878e74bb666288ce51](https://github.com/yodesarrollomx/sala-edicion/blob/a3b6c7053b3cd26333dd06878e74bb666288ce51/nube/plan_agregados.py)
- [CON-PLAN-METRICAS-ONLINE · PR78 integrado; run 38157069665 success. Plan lectura confirmada con hash y frescura; leads\_medicion\_caida=false, 76 publicaciones Meta. El lector HTTP comprueba bytes/recibo de snapshot409795880. · Estado: ejecucion · yodesarrollomx/aurum-board · scripts/pull\_metrics.py · Revisión: e3dd428a01b01d1c8b5775c7fcca408735c98357](https://github.com/yodesarrollomx/aurum-board/blob/e3dd428a01b01d1c8b5775c7fcca408735c98357/scripts/pull_metrics.py)
- CON-SALUD-SALA · Solicitud explícita de Dirección el11-oct-2026; implementación pendiente. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-SALUD-SALA · Monitor38170852821 y canario38170259463 success; resultados técnicos y fuentes leídas realmente, con alcance/caducidad.40 correctos,59 pendientes; sin operaciones comerciales como prueba. · Estado: ejecucion · yodesarrollomx/yod-portal · docs/SALUD-SISTEMAS.md · Revisión: de33d90af87e9b5b225b0405841145348d42b8b0](https://github.com/yodesarrollomx/yod-portal/blob/de33d90af87e9b5b225b0405841145348d42b8b0/docs/SALUD-SISTEMAS.md)
- CON-SALA-MEDIOS-PUBLICOS · Diseño local en docs/arquitectura/sala-medios-publicos-20261015.md y schema 1 acordado por UI/snapshots/almacén. Sin release/asset, canario, activación o despliegue acreditado. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 5 conexiones sin verificación de ejecución registrada.
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

**Estado registrado:** codigo. GET cola y POST cola/op:estado sólo para evidencia técnica de dos voces originales comprobados el11-oct-2026; conservación de campos y acuse real. Fuente/editor, versión completa, otras funciones, disparadores y correo no acreditados por esta comprobación.

**Conexiones registradas; no habilitan operaciones:**

- CON-014 · GAS-SALA → SHEET-SALA · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.
- CON-031 · SYS-SALA → GAS-SALA · api · Consume contrato del backend · Estado: declarado · Ejecución no verificada en el atlas.
- CON-080 · SVC-SALA-PRODUCTOR → GAS-SALA · api · Lee decisiones/reglas y escribe cola · Estado: codigo · Ejecución no verificada en el atlas.
- CON-082 · SVC-SALA-EJECUTOR → GAS-SALA · api · Lee cola y registra resultado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-085 · GAS-SALA → GAS-PORTERO · autenticacion · Valida credencial del OS desde servidor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-086 · GAS-SALA → GAS-PORTERO-RESPALDO · autenticacion · Consulta respaldo de identidad · Estado: codigo · Ejecución no verificada en el atlas.
- CON-SALA-RECONEXION-MEDIOS · SVC-SALA-EJECUTOR → GAS-SALA · conciliacion · Mantenimiento limitado de evidencia de voces originales recuperadas · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-SALA-CORREO-ONLINE · GAS-SALA → EXT-GMAIL · correo · Correo diario y entrada al destinatario existente · Estado: ejecucion · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Tipo de fuente disponible: fuente\_repositorio\_despliegue\_no\_verificado · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- Ruta de decisión editorial en el backend versionado · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- Esquemas de tablas de Sala · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- [PR269 integrado. Run38159239581 success: dos voces originales recuperadas verificadas por MD5/SHA256/tamaño y dos referencias técnicas de COLA actualizadas y leídas de vuelta. Todos los campos operativos/aprobaciones conservados; acuse privado subido y releído byte exacto. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/medios\_reconexion.py · Revisión: 159d932cd81c2d2c3fda31a862ea60fc0b3ae667](https://github.com/yodesarrollomx/sala-edicion/blob/159d932cd81c2d2c3fda31a862ea60fc0b3ae667/nube/medios_reconexion.py)
- Ampliación técnica autorizada por Dirección en la conversación actual: recuperación de transporte, publicación acumulativa, correo trazable y conciliación de chinches. Registro previo; la fuente no acredita despliegue. Registro local: docs/arquitectura/sala-nube-20261015.md. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-014 · Backend asociado al almacén de su dominio · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- CON-031 · Conexión cliente/backend · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-031 · Diseño local del contrato produccion-historica-v1 para corregir exclusión técnica por ventana14d. Aún sin despliegue Apps Script ni GET completo verificado; no cambia ACL/scopes ni habilita flag. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-080 · Planificador de compuertas · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline
- CON-082 · Procesamiento de trabajo · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- CON-085 · Valida credencial del OS desde servidor · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- CON-086 · Consulta respaldo de identidad · Estado: codigo · yodesarrollomx/sala-edicion · gas/Code.gs · Revisión: HEAD\_baseline
- [CON-SALA-RECONEXION-MEDIOS · PR269 integrado. Run38159239581 success: dos voces originales recuperadas verificadas por MD5/SHA256/tamaño y dos referencias técnicas de COLA actualizadas y leídas de vuelta. Todos los campos operativos/aprobaciones conservados; acuse privado subido y releído byte exacto. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/medios\_reconexion.py · Revisión: 159d932cd81c2d2c3fda31a862ea60fc0b3ae667](https://github.com/yodesarrollomx/sala-edicion/blob/159d932cd81c2d2c3fda31a862ea60fc0b3ae667/nube/medios_reconexion.py)
- [CON-SALA-CORREO-ONLINE · Bitácora del backend registra correo diario tres días a07:13Hermosillo; solicitud de entrada38166137118 aceptada y acuse privado byte-verificado. Recepción en Gmail y fuente/inventario completo de disparadores siguen sin verificar. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/correo\_estado.py · Revisión: 4582fc3c42a2ac8459dea7d553c42f9719f07962](https://github.com/yodesarrollomx/sala-edicion/blob/4582fc3c42a2ac8459dea7d553c42f9719f07962/nube/correo_estado.py)

**Pendientes y límites:**

- 7 conexiones sin verificación de ejecución registrada.
- Código desplegado y permisos reales no contrastados

### Datos de Sala de Edición · SHEET-SALA

**Función:** Almacenar registros del dominio ventas

**Fuente oficial:** Google Sheets de Sala; identidad física y valores vivos no inspeccionados

**Responsable operativo:** Editores y producción

**Estado registrado:** declarado. Lectura/conciliación de evidencia en dos trabajos existentes de COLA comprobadas vía backend autorizado. Sin fila nueva, estado o decisión cambiada. Identidad física/otras hojas y backend original por verificar.

**Conexiones registradas; no habilitan operaciones:**

- CON-014 · GAS-SALA → SHEET-SALA · persistencia · Lee/escribe registros del dominio · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia
- [PR269 integrado. Run38159239581 success: dos voces originales recuperadas verificadas por MD5/SHA256/tamaño y dos referencias técnicas de COLA actualizadas y leídas de vuelta. Todos los campos operativos/aprobaciones conservados; acuse privado subido y releído byte exacto. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/medios\_reconexion.py · Revisión: 159d932cd81c2d2c3fda31a862ea60fc0b3ae667](https://github.com/yodesarrollomx/sala-edicion/blob/159d932cd81c2d2c3fda31a862ea60fc0b3ae667/nube/medios_reconexion.py)

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

**Estado registrado:** ejecucion. Productor real38310054319 success; lee la fuente vigente y preserva aprobaciones. No abrió trabajos nuevos en esta vuelta. Reemplazos pendientes de crédito y revisión editorial no se convierten en aprobaciones.

**Conexiones registradas; no habilitan operaciones:**

- CON-079 · EXT-ACTIONS → SVC-SALA-PRODUCTOR · automatizacion · Programa productor cada veinte minutos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-080 · SVC-SALA-PRODUCTOR → GAS-SALA · api · Lee decisiones/reglas y escribe cola · Estado: codigo · Ejecución no verificada en el atlas.
- CON-SALA-IMAGEN-OPENAI · SVC-SALA-PRODUCTOR → SVC-AUTON-CLOUD · api · Imagen para Sala con modelo fijo y recibo · Estado: propuesto · Ejecución no verificada en el atlas.
- CON-SALA-HIDREAM · SVC-SALA-PRODUCTOR → EXT-MOTORES-MEDIA · api · Fotografía HiDream oficial con adaptadores I1 y O1 y recibos · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Abrir compuertas aprobadas y encolar trabajo sin decidir ni ejecutar · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline
- [PR270/271 y run38166137118 acreditan cierre, productor/ejecutor y comparación aislada con16 archivos privados byte-verificados. Correo diario registrado y entrada aceptada; recepción y equivalencia completa pendientes. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-CIERRE-ONLINE.md · Revisión: 4582fc3c42a2ac8459dea7d553c42f9719f07962](https://github.com/yodesarrollomx/sala-edicion/blob/4582fc3c42a2ac8459dea7d553c42f9719f07962/docs/SALA-CIERRE-ONLINE.md)
- [Lote38310054319: productor success. Ningún nuevo trabajo habilitado; las imágenes rehechas esperan revisión editorial. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: dde4ab0151c5cc36071882380afe7ecf495ecef6](https://github.com/yodesarrollomx/sala-edicion/blob/dde4ab0151c5cc36071882380afe7ecf495ecef6/nube/sala_productor.py)
- Ampliación técnica autorizada por Dirección en la conversación actual: recuperación de transporte, publicación acumulativa, correo trazable y conciliación de chinches. Registro previo; la fuente no acredita despliegue. Registro local: docs/arquitectura/sala-nube-20261015.md. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [PR308 integrado. Productor del Cierre 38688574178 success: 14 fuentes recuperadas/visibles, 29 decisiones sí y 153 trabajos ya existentes; cero nuevos. La ejecución acredita conciliación del proceso, no nueva producción ni aprobación editorial. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-ONLINE.md · Revisión: e4da08887e45e984be8ea945ce607db464b0fb52](https://github.com/yodesarrollomx/sala-edicion/blob/e4da08887e45e984be8ea945ce607db464b0fb52/docs/SALA-ONLINE.md)

**Evidencia de conexiones:**

- CON-079 · Frecuencia configurada en workflow, no evidencia de corridas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-080 · Planificador de compuertas · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_productor.py · Revisión: HEAD\_baseline
- CON-SALA-IMAGEN-OPENAI · Propuesta autorizada para usar el servicio existente, aún sin prueba de generación. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-SALA-HIDREAM · Lote real38342683066 en rama operativa; integración recurrente propuesta. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.
- Uso efectivo, configuración y costo en producción no comprobados

### Ejecutor de Sala · SVC-SALA-EJECUTOR

**Función:** Procesar trabajos habilitados y subir resultados

**Fuente oficial:** Configuración de reglas/motores y código de ejecución; ejecución viva pendiente

**Responsable operativo:** Producción

**Estado registrado:** ejecucion. Ejecutor real38310054319 success;124 registros de COLA revisados y0 trabajos habilitados pendientes. Las entregas anteriores y sus evidencias se conservan. No acredita aprobación editorial de las láminas nuevas.

**Conexiones registradas; no habilitan operaciones:**

- CON-081 · EXT-ACTIONS → SVC-SALA-EJECUTOR · automatizacion · Programa ejecución de etapas habilitadas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-082 · SVC-SALA-EJECUTOR → GAS-SALA · api · Lee cola y registra resultado · Estado: codigo · Ejecución no verificada en el atlas.
- CON-083 · SVC-SALA-EJECUTOR → EXT-MOTORES-MEDIA · integracion · Selecciona motor según configuración · Estado: codigo · Ejecución no verificada en el atlas.
- CON-084 · SVC-SALA-EJECUTOR → EXT-DRIVE · documentos · Sube activos producidos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-SALA-RECONEXION-MEDIOS · SVC-SALA-EJECUTOR → GAS-SALA · conciliacion · Mantenimiento limitado de evidencia de voces originales recuperadas · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-SALA-CIERRE-ONLINE · SVC-SALA-EJECUTOR → EXT-ACTIONS · automatizacion · Cierre, activación acotada y comparación aislada · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.

**Evidencia de la ficha:**

- Procesar trabajos habilitados y subir resultados · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- [PR265 conserva compuertas, aprobaciones y procedencia; Modal default 0 y CPU de respaldo. CI completo acreditado. · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: 73902861db96d213a07f788996f50fdcf3c65566](https://github.com/yodesarrollomx/sala-edicion/blob/73902861db96d213a07f788996f50fdcf3c65566/nube/sala_ejecutor.py)
- [PR269 integrado. Run38159239581 success: dos voces originales recuperadas verificadas por MD5/SHA256/tamaño y dos referencias técnicas de COLA actualizadas y leídas de vuelta. Todos los campos operativos/aprobaciones conservados; acuse privado subido y releído byte exacto. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/medios\_reconexion.py · Revisión: 159d932cd81c2d2c3fda31a862ea60fc0b3ae667](https://github.com/yodesarrollomx/sala-edicion/blob/159d932cd81c2d2c3fda31a862ea60fc0b3ae667/nube/medios_reconexion.py)
- [PR270/271 y run38166137118 acreditan cierre, productor/ejecutor y comparación aislada con16 archivos privados byte-verificados. Correo diario registrado y entrada aceptada; recepción y equivalencia completa pendientes. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-CIERRE-ONLINE.md · Revisión: 4582fc3c42a2ac8459dea7d553c42f9719f07962](https://github.com/yodesarrollomx/sala-edicion/blob/4582fc3c42a2ac8459dea7d553c42f9719f07962/docs/SALA-CIERRE-ONLINE.md)
- [Lote38310054319: ejecutor success; COLA124 registros,0 trabajos habilitados pendientes,0 entregables nuevos en esta vuelta. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: dde4ab0151c5cc36071882380afe7ecf495ecef6](https://github.com/yodesarrollomx/sala-edicion/blob/dde4ab0151c5cc36071882380afe7ecf495ecef6/nube/sala_ejecutor.py)
- Ampliación técnica autorizada por Dirección en la conversación actual: recuperación de transporte, publicación acumulativa, correo trazable y conciliación de chinches. Registro previo; la fuente no acredita despliegue. Registro local: docs/arquitectura/sala-nube-20261015.md. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [PR308 integrado. Ejecutor del Cierre 38688574178 success: cero pendientes; cola agregada 138 hecho, 11 fallo y 4 obsoleto. Sin ejecución nueva de medios ni acreditación de entrega de correo. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-ONLINE.md · Revisión: e4da08887e45e984be8ea945ce607db464b0fb52](https://github.com/yodesarrollomx/sala-edicion/blob/e4da08887e45e984be8ea945ce607db464b0fb52/docs/SALA-ONLINE.md)

**Evidencia de conexiones:**

- CON-081 · Disparador declarado cada dos horas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-082 · Procesamiento de trabajo · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- CON-083 · Registro de motores de producción · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_motores.py · Revisión: HEAD\_baseline
- CON-084 · Publicación de resultado en Drive · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_ejecutor.py · Revisión: HEAD\_baseline
- [CON-SALA-RECONEXION-MEDIOS · PR269 integrado. Run38159239581 success: dos voces originales recuperadas verificadas por MD5/SHA256/tamaño y dos referencias técnicas de COLA actualizadas y leídas de vuelta. Todos los campos operativos/aprobaciones conservados; acuse privado subido y releído byte exacto. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/medios\_reconexion.py · Revisión: 159d932cd81c2d2c3fda31a862ea60fc0b3ae667](https://github.com/yodesarrollomx/sala-edicion/blob/159d932cd81c2d2c3fda31a862ea60fc0b3ae667/nube/medios_reconexion.py)
- [CON-SALA-CIERRE-ONLINE · PR270/271 y run38166137118 acreditan cierre, productor/ejecutor y comparación aislada con16 archivos privados byte-verificados. Correo diario registrado y entrada aceptada; recepción y equivalencia completa pendientes. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-CIERRE-ONLINE.md · Revisión: 4582fc3c42a2ac8459dea7d553c42f9719f07962](https://github.com/yodesarrollomx/sala-edicion/blob/4582fc3c42a2ac8459dea7d553c42f9719f07962/docs/SALA-CIERRE-ONLINE.md)

**Pendientes y límites:**

- 4 conexiones sin verificación de ejecución registrada.
- Uso efectivo, configuración y costo en producción no comprobados

### Motores de generación de contenido · EXT-MOTORES-MEDIA

**Función:** Generar texto, imagen, escena o voz según motor configurado

**Fuente oficial:** Configuración de reglas/motores y código de ejecución; ejecución viva pendiente

**Responsable operativo:** Producción

**Estado registrado:** ejecucion. Imágenes por API GPT Image1.5 en servidor propio: prueba real y10 fotografías montadas;6 de27 reemplazos completados,21 pendientes por saldo agotado. Pollinations FLUX y segmind/tiny-sd retirados de producción y revisión. Pruebas CPU anteriores quedan como historia; voz y cámara conservan sus compuertas, Modal sigue opcional.

**Conexiones registradas; no habilitan operaciones:**

- CON-083 · SVC-SALA-EJECUTOR → EXT-MOTORES-MEDIA · integracion · Selecciona motor según configuración · Estado: codigo · Ejecución no verificada en el atlas.
- CON-SALA-HIDREAM · SVC-SALA-PRODUCTOR → EXT-MOTORES-MEDIA · api · Fotografía HiDream oficial con adaptadores I1 y O1 y recibos · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Generar texto, imagen, escena o voz según motor configurado · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_motores.py · Revisión: HEAD\_baseline
- [Run 38139680521 success: seis artefactos privados verificados por SHA256, corte 1080x1920 H264/AAC 10.166667s. Entradas sintéticas, sin filas o decisiones de negocio. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/prueba\_online.py · Revisión: 6e67927f01829baba72267aad15d59ea60139444](https://github.com/yodesarrollomx/sala-edicion/blob/6e67927f01829baba72267aad15d59ea60139444/nube/prueba_online.py)
- [API GPT Image1.5 probada38302218587; montaje real38310054319:10 nuevas fotografías recuperadas,6 sustituciones y4 continuaciones. Quedan21 sustituciones por credit\_balance\_exhausted; CF y Gemini también429. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/motores/imagen.py · Revisión: dde4ab0151c5cc36071882380afe7ecf495ecef6](https://github.com/yodesarrollomx/sala-edicion/blob/dde4ab0151c5cc36071882380afe7ecf495ecef6/nube/motores/imagen.py)

**Evidencia de conexiones:**

- CON-083 · Registro de motores de producción · Estado: codigo · yodesarrollomx/sala-edicion · nube/sala\_motores.py · Revisión: HEAD\_baseline
- CON-SALA-HIDREAM · Lote real38342683066 en rama operativa; integración recurrente propuesta. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.
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

**Ubicación propuesta:** reception · 9 componentes.

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
- CON-SALA-SNAPSHOT-ONLINE · SYS-SALA → EXT-ACTIONS · publicacion · Snapshots privados de datos públicos y Pages con recibo verificable · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-MARKETING-DATOS-ONLINE · SYS-MARKETING → EXT-ACTIONS · publicacion · Agregados públicos en rama de datos; UI de Pages conserva código aprobado · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-SALA-CIERRE-ONLINE · SVC-SALA-EJECUTOR → EXT-ACTIONS · automatizacion · Cierre, activación acotada y comparación aislada · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-SALUD-ACTIONS · SYS-CONTROL → EXT-ACTIONS · observacion · Pruebas programadas y evidencia de ejecución · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-HORARIOS-ACTIONS · SVC-HORARIOS-CLOUD → EXT-ACTIONS · integracion · Observar ejecuciones y recuperar horarios omitidos con GitHub App · Estado: codigo · Ejecución no verificada en el atlas.
- CON-SALA-MEDIOS-PUBLICOS · SYS-SALA → EXT-ACTIONS · publicacion · Imágenes nuevas en releases públicos inmutables con manifiesto fijado por recibo · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Integración pendiente de verificar · Estado: pendiente · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- CON-063 · Ciclo de producción en nube · Estado: declarado · yodesarrollomx/sala-edicion · CLAUDE.md · Revisión: HEAD\_baseline
- CON-079 · Frecuencia configurada en workflow, no evidencia de corridas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-081 · Disparador declarado cada dos horas · Estado: codigo · yodesarrollomx/sala-edicion · .github/workflows/sala-cada-hora.yml · Revisión: HEAD\_baseline
- CON-PUBLICADOR-IDENTIDAD · Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB\_TOKEN; requiere registro e instalación personal de una App privada de la organización. · Estado: declarado · Sin revisión inmutable en esta referencia
- [CON-SALA-SNAPSHOT-ONLINE · Run 38141812652 publicó la revisión acumulativa y esperó el recibo exacto de Pages run 38141874311; ambos success. ZIP permitido, bloqueo CAS y release permanece draft:true. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/snapshots\_online.py · Revisión: 73902861db96d213a07f788996f50fdcf3c65566](https://github.com/yodesarrollomx/sala-edicion/blob/73902861db96d213a07f788996f50fdcf3c65566/nube/snapshots_online.py)
- [CON-SALA-SNAPSHOT-ONLINE · PR308 integrado. Pages 38688574369, Pages de Plan 38688736093 y Pages de Revisión 38689030877 success con snapshots413444031/413458897/413460646 y recibos exactos. FULL operativo en el alcance inspeccionado; incremental OFF y offload no activado. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/snapshots\_online.py · Revisión: e4da08887e45e984be8ea945ce607db464b0fb52](https://github.com/yodesarrollomx/sala-edicion/blob/e4da08887e45e984be8ea945ce607db464b0fb52/nube/snapshots_online.py)
- [CON-MARKETING-DATOS-ONLINE · Run 38141736288 success: actualizó y publicó 76 publicaciones de Meta, confirmó hash/recibo del HTTP real y conservó el snapshot como draft privado. · Estado: ejecucion · yodesarrollomx/aurum-board · scripts/snapshots\_online.py · Revisión: 6ad059cd1ed97edee894df5a9b2032d919143e0f](https://github.com/yodesarrollomx/aurum-board/blob/6ad059cd1ed97edee894df5a9b2032d919143e0f/scripts/snapshots_online.py)
- [CON-MARKETING-DATOS-ONLINE · LECTOR\_ONLINE ok:true, posts:76, run\_id:38141736288. El navegador recibe sólo agregados/covers y verifica SHA256. Plan rechazado mantiene último dato acreditado y señal de medición incompleta. · Estado: ejecucion · yodesarrollomx/aurum-board · metrics-online.js · Revisión: 6ad059cd1ed97edee894df5a9b2032d919143e0f](https://github.com/yodesarrollomx/aurum-board/blob/6ad059cd1ed97edee894df5a9b2032d919143e0f/metrics-online.js)
- [CON-MARKETING-DATOS-ONLINE · PR78 integrado; run 38157069665 success. Plan lectura confirmada con hash y frescura; leads\_medicion\_caida=false, 76 publicaciones Meta. El lector HTTP comprueba bytes/recibo de snapshot409795880. · Estado: ejecucion · yodesarrollomx/aurum-board · metrics-online.js · Revisión: e3dd428a01b01d1c8b5775c7fcca408735c98357](https://github.com/yodesarrollomx/aurum-board/blob/e3dd428a01b01d1c8b5775c7fcca408735c98357/metrics-online.js)
- [CON-SALA-CIERRE-ONLINE · PR270/271 y run38166137118 acreditan cierre, productor/ejecutor y comparación aislada con16 archivos privados byte-verificados. Correo diario registrado y entrada aceptada; recepción y equivalencia completa pendientes. · Estado: ejecucion · yodesarrollomx/sala-edicion · docs/SALA-CIERRE-ONLINE.md · Revisión: 4582fc3c42a2ac8459dea7d553c42f9719f07962](https://github.com/yodesarrollomx/sala-edicion/blob/4582fc3c42a2ac8459dea7d553c42f9719f07962/docs/SALA-CIERRE-ONLINE.md)
- CON-SALUD-ACTIONS · Solicitud explícita de Dirección el11-oct-2026; implementación pendiente. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-SALUD-ACTIONS · Monitor38170852821 y canario38170259463 success; resultados técnicos y fuentes leídas realmente, con alcance/caducidad.40 correctos,59 pendientes; sin operaciones comerciales como prueba. · Estado: ejecucion · yodesarrollomx/yod-portal · docs/SALUD-SISTEMAS.md · Revisión: de33d90af87e9b5b225b0405841145348d42b8b0](https://github.com/yodesarrollomx/yod-portal/blob/de33d90af87e9b5b225b0405841145348d42b8b0/docs/SALUD-SISTEMAS.md)
- CON-HORARIOS-ACTIONS · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-ACTIONS · Código entregado y probado con dobles; instalación personal y recuperación real pendientes. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/scheduler/github-app.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/cloud/scheduler/github-app.mjs)
- CON-SALA-MEDIOS-PUBLICOS · Diseño local en docs/arquitectura/sala-medios-publicos-20261015.md y schema 1 acordado por UI/snapshots/almacén. Sin release/asset, canario, activación o despliegue acreditado. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- Responsable operativo pendiente de confirmación; el encargado de verificación no sustituye esa asignación.
- 6 conexiones sin verificación de ejecución registrada.
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

**Estado registrado:** codigo. Render dfe9c7a45ddeb997c32b8bd39483be3874e68658 live desde 2026-10-09T05:37:10Z. Cola FIFO persistente con un ejecutor y cuarentena si no termina; historial privado por caso desde esta entrega. Pruebas automáticas de voz/PPP aprobadas; micrófono físico y primera conversación privada por proximidad no acreditados. Imagen Sala: puente GPT Image1.5 en servicio existente; montaje real de10 fotografías. Proveedor de imagen bloqueado por credit\_balance\_exhausted; no certifica producción completa.

**Conexiones registradas; no habilitan operaciones:**

- CON-DESPACHO-3D-MOTOR · SYS-DESPACHO-3D → SVC-AUTON-CLOUD · api · Conversación y operaciones del puesto ligadas al caso y actor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-PORTERO · SVC-AUTON-CLOUD → GAS-PORTERO · api · Identidad, contexto, objetivos y cola autorizados · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-ESTADO · SVC-AUTON-CLOUD → STORE-AUTON-ESTADO · persistencia · Conocimiento y recibos por expediente con revisión · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-JEV · SVC-AUTON-CLOUD → EXT-JEV · integracion · Orientar y ordenar fuentes autorizadas · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-DRIVE · SVC-AUTON-CLOUD → EXT-DRIVE · lectura · Leer originales, documentos y pasajes del expediente · Estado: codigo · Ejecución no verificada en el atlas.
- CON-MOTOR-OPENAI · SVC-AUTON-CLOUD → EXT-OPENAI · integracion · Voz y herramientas con claves de servidor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-RENDER-MOTOR · EXT-RENDER → SVC-AUTON-CLOUD · alojamiento · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · Ejecución no verificada en el atlas.
- CON-SALA-IMAGEN-OPENAI · SVC-SALA-PRODUCTOR → SVC-AUTON-CLOUD · api · Imagen para Sala con modelo fijo y recibo · Estado: propuesto · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Compone motor, voz, investigación, objetivos y conocimiento por caso. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/server.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/server.mjs)
- [Historia por ejecución, FIFO, progreso confirmado y recuperación; 282 pruebas aprobadas y una omitida, navegadores aprobados; recibo Render dep-db47qobncjis73c3vrp0 live. · Estado: ejecucion · alexpueblag/yod-agent-cloud · cloud/AUTONOMY-126.md · Revisión: dfe9c7a45ddeb997c32b8bd39483be3874e68658](https://github.com/alexpueblag/yod-agent-cloud/blob/dfe9c7a45ddeb997c32b8bd39483be3874e68658/cloud/AUTONOMY-126.md)
- [Puente de propósito exclusivo e idempotencia desplegado en servicio existente: diagnóstico de crédito/ritmo, una solicitud nueva por minuto y recibos persistentes;559 pruebas pasadas y0 fallos antes del arranque vigente. · Estado: ejecucion · alexpueblag/yod-agent-cloud · cloud/sala-image-broker.mjs · Revisión: 7f1297cbf1ba9fe12f663faf2f843f35f79d411e](https://github.com/alexpueblag/yod-agent-cloud/blob/7f1297cbf1ba9fe12f663faf2f843f35f79d411e/cloud/sala-image-broker.mjs)

**Evidencia de conexiones:**

- [CON-DESPACHO-3D-MOTOR · Conversación y operaciones del puesto ligadas al caso y actor · Estado: codigo · yodesarrollomx/yod-portal · despacho3d/agent-workspace.mjs · Revisión: 5eca769947e60bc5b51389244393e0f63817cf86](https://github.com/yodesarrollomx/yod-portal/blob/5eca769947e60bc5b51389244393e0f63817cf86/despacho3d/agent-workspace.mjs)
- [CON-MOTOR-PORTERO · Identidad, contexto, objetivos y cola autorizados · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/server.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/server.mjs)
- [CON-MOTOR-ESTADO · Conocimiento y recibos por expediente con revisión · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/case-knowledge.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/case-knowledge.mjs)
- [CON-MOTOR-JEV · Orientar y ordenar fuentes autorizadas · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/RESEARCH.md · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/RESEARCH.md)
- [CON-MOTOR-DRIVE · Leer originales, documentos y pasajes del expediente · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/RESEARCH.md · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/RESEARCH.md)
- [CON-MOTOR-OPENAI · Voz y herramientas con claves de servidor · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/voice-lane.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/voice-lane.mjs)
- [CON-RENDER-MOTOR · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · alexpueblag/yod-agent-cloud · cloud/README.txt · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/README.txt)
- CON-SALA-IMAGEN-OPENAI · Propuesta autorizada para usar el servicio existente, aún sin prueba de generación. · Estado: propuesto · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 8 conexiones sin verificación de ejecución registrada.

### OpenAI · conversación y ejecución · EXT-OPENAI

**Función:** Proveer voz y respuestas con herramientas del servidor.

**Fuente oficial:** Configuración de sesión y herramientas autorizadas en servidor; resultados deben comprobarse contra registros de negocio.

**Responsable operativo:** Dirección técnica

**Estado registrado:** codigo. Voz configurada y disponible en el piloto. Micrófono físico e interacción de Dirección requieren aceptación independiente. Imagen: generación real comprobada; saldo agotado confirmado para GPT Image1.5. Quedan21 reemplazos sin producir.

**Conexiones registradas; no habilitan operaciones:**

- CON-MOTOR-OPENAI · SVC-AUTON-CLOUD → EXT-OPENAI · integracion · Voz y herramientas con claves de servidor · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-IA · GAS-BANDEJA-NUBE → EXT-OPENAI · api · Redactar cambios con API de pago por uso · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- [Sesión de voz y herramientas conectadas desde el servidor. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/voice-lane.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/voice-lane.mjs)
- [GPT Image1.5 real por servidor existente; código429 credit\_balance\_exhausted e insufficient\_quota confirmado38310564537. Configuración accesible no equivale a saldo disponible. · Estado: ejecucion · yodesarrollomx/sala-edicion · nube/motores/imagen.py · Revisión: dde4ab0151c5cc36071882380afe7ecf495ecef6](https://github.com/yodesarrollomx/sala-edicion/blob/dde4ab0151c5cc36071882380afe7ecf495ecef6/nube/motores/imagen.py)

**Evidencia de conexiones:**

- [CON-MOTOR-OPENAI · Voz y herramientas con claves de servidor · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/voice-lane.mjs · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/voice-lane.mjs)
- CON-BANDEJA-IA · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-IA · Código publicado; su compuerta o consentimiento reales todavía no se acreditan. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 2 conexiones sin verificación de ejecución registrada.

### Render · alojamiento del motor · EXT-RENDER

**Función:** Alojar el servicio existente y su volumen persistente.

**Fuente oficial:** Configuración efectiva y versión activa del proveedor, separadas de los blueprints del repositorio.

**Responsable operativo:** Dirección técnica

**Estado registrado:** ejecucion. Commit b88ce380 confirmado live el 7-oct-2026 05:08:53 UTC. Disponibilidad comprobada a 05:10:46 y 05:10:56 UTC; no promesa de continuidad ininterrumpida.

**Conexiones registradas; no habilitan operaciones:**

- CON-RENDER-MOTOR · EXT-RENDER → SVC-AUTON-CLOUD · alojamiento · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · Ejecución no verificada en el atlas.
- CON-HORARIOS-RENDER · EXT-RENDER → SVC-HORARIOS-CLOUD · integracion · Alojar un vigilante ligero dentro del servicio existente · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.

**Evidencia de la ficha:**

- [Alojamiento del servicio con volumen durable. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/README.txt · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/README.txt)
- Conector Render confirmó la versión activa y el monitor de disponibilidad obtuvo dos muestras listas; recibos en la bitácora privada. · Estado: ejecucion · Sin revisión inmutable en esta referencia

**Evidencia de conexiones:**

- [CON-RENDER-MOTOR · Servicio y volumen persistentes en la versión efectiva · Estado: declarado · alexpueblag/yod-agent-cloud · cloud/README.txt · Revisión: b88ce380d7e437cf535facdbd5592a0b8bc14dc1](https://github.com/alexpueblag/yod-agent-cloud/blob/b88ce380d7e437cf535facdbd5592a0b8bc14dc1/cloud/README.txt)
- CON-HORARIOS-RENDER · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-RENDER · Vigilancia residente en servicio existente; dos ciclos reales y versión exacta. No acredita despacho por App. · Estado: ejecucion · alexpueblag/yod-agent-cloud · scripts/scheduler-live.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/scripts/scheduler-live.mjs)

**Pendientes y límites:**

- 1 conexiones sin verificación de ejecución registrada.

### Vigilante y programador en nube · SVC-HORARIOS-CLOUD

**Función:** Observar horarios declarados y recuperar sólo ejecuciones actuales omitidas, sin depender de las sesiones de chat.

**Fuente oficial:** Estado privado del servicio existente y ejecuciones reales de Actions; reglas editoriales y datos de negocio conservan sus fuentes.

**Responsable operativo:** Dirección técnica

**Estado registrado:** ejecucion. Proceso residente observado en Render por dos ciclos verificables y logs consecutivos; sin sesiones de chat. Despacho real de recuperación pendiente de App autorizada.

**Conexiones registradas; no habilitan operaciones:**

- CON-HORARIOS-RENDER · EXT-RENDER → SVC-HORARIOS-CLOUD · integracion · Alojar un vigilante ligero dentro del servicio existente · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-HORARIOS-ESTADO · SVC-HORARIOS-CLOUD → STORE-HORARIOS-CLOUD · integracion · Reservas durables y configuración privada cifrada · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.
- CON-HORARIOS-ACTIONS · SVC-HORARIOS-CLOUD → EXT-ACTIONS · integracion · Observar ejecuciones y recuperar horarios omitidos con GitHub App · Estado: codigo · Ejecución no verificada en el atlas.
- CON-HORARIOS-ACCESOS · SVC-HORARIOS-CLOUD → SYS-CONTROL · integracion · Resultados sanitizados observados desde Accesos · Estado: codigo · Ejecución no verificada en el atlas.
- CON-BANDEJA-SALUD · GAS-BANDEJA-NUBE → SVC-HORARIOS-CLOUD · observacion · Recibo técnico leído por el vigilante y mostrado en Accesos · Estado: codigo · Ejecución no verificada en el atlas.

**Evidencia de la ficha:**

- Dirección autoriza prioridad1: horarios, vigilancia, recuperación segura y evidencia en Accesos. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [Verificador38182585661 confirma versión viva y dos ciclos independientes; estado técnico cifrado/readback. Recuperación por App sigue pendiente. · Estado: ejecucion · alexpueblag/yod-agent-cloud · cloud/scheduler/hub.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/cloud/scheduler/hub.mjs)

**Evidencia de conexiones:**

- CON-HORARIOS-RENDER · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-RENDER · Vigilancia residente en servicio existente; dos ciclos reales y versión exacta. No acredita despacho por App. · Estado: ejecucion · alexpueblag/yod-agent-cloud · scripts/scheduler-live.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/scripts/scheduler-live.mjs)
- CON-HORARIOS-ESTADO · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-ESTADO · Persistencia del informe técnico cifrado/readback; no acredita efectos de negocio o reservas reales de despacho. · Estado: ejecucion · alexpueblag/yod-agent-cloud · scripts/scheduler-live.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/scripts/scheduler-live.mjs)
- CON-HORARIOS-ACTIONS · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-ACTIONS · Código entregado y probado con dobles; instalación personal y recuperación real pendientes. · Estado: codigo · alexpueblag/yod-agent-cloud · cloud/scheduler/github-app.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/cloud/scheduler/github-app.mjs)
- CON-HORARIOS-ACCESOS · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-ACCESOS · Cliente publicado y doce recorridos aislados; sesión administradora personal no operada por el agente. · Estado: codigo · yodesarrollomx/yod-portal · os/yod-salud.js · Revisión: 9b2e5f4497878223aba26531076c64894e17823e](https://github.com/yodesarrollomx/yod-portal/blob/9b2e5f4497878223aba26531076c64894e17823e/os/yod-salud.js)
- CON-BANDEJA-SALUD · CTR-BANDEJA-NUBE: propuesta y contratos registrados antes de implementar. Instalación y ejecución reales pendientes. · Estado: propuesto · Sin revisión inmutable en esta referencia
- CON-BANDEJA-SALUD · Render publicó seis comprobaciones de Bandeja pendientes, en el mismo servidor. Pruebas públicas de lectura y bytes separadas del consentimiento y la ejecución Google. · Estado: codigo · alexpueblag/yod-agent-cloud · server/bandeja/README.md · Sin revisión inmutable en esta referencia

**Pendientes y límites:**

- 3 conexiones sin verificación de ejecución registrada.
- No acreditar verde sin prueba vigente; reconcilación de efectos inciertos antes de otro intento.

### Estado privado de horarios · STORE-HORARIOS-CLOUD

**Función:** Conservar recibos, reservas de ejecución y configuración de la App cifrada para reconciliar reinicios sin duplicar efectos.

**Fuente oficial:** Estado privado del servicio existente y ejecuciones reales de Actions; reglas editoriales y datos de negocio conservan sus fuentes.

**Responsable operativo:** Dirección técnica

**Estado registrado:** ejecucion. Estado cifrado escrito y releído en el volumen privado del servicio; reservas de efectos externos sólo probadas con dobles, pues App aún no instalada.

**Conexiones registradas; no habilitan operaciones:**

- CON-HORARIOS-ESTADO · SVC-HORARIOS-CLOUD → STORE-HORARIOS-CLOUD · integracion · Reservas durables y configuración privada cifrada · Estado: ejecucion · Ejecución marcada como verificada en el atlas; revisar evidencia.

**Evidencia de la ficha:**

- Dirección autoriza prioridad1: horarios, vigilancia, recuperación segura y evidencia en Accesos. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [Verificador38182585661 confirma versión viva y dos ciclos independientes; estado técnico cifrado/readback. Recuperación por App sigue pendiente. · Estado: ejecucion · alexpueblag/yod-agent-cloud · cloud/scheduler/hub.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/cloud/scheduler/hub.mjs)

**Evidencia de conexiones:**

- CON-HORARIOS-ESTADO · Prioridad1 autorizada; implementação y aceptación real por separado. · Estado: propuesto · Sin revisión inmutable en esta referencia
- [CON-HORARIOS-ESTADO · Persistencia del informe técnico cifrado/readback; no acredita efectos de negocio o reservas reales de despacho. · Estado: ejecucion · alexpueblag/yod-agent-cloud · scripts/scheduler-live.mjs · Revisión: b41a98751ae3ae89f43372557d61e77461aa086c](https://github.com/alexpueblag/yod-agent-cloud/blob/b41a98751ae3ae89f43372557d61e77461aa086c/scripts/scheduler-live.mjs)

**Pendientes y límites:**

- No acreditar verde sin prueba vigente; reconcilación de efectos inciertos antes de otro intento.
