# Propuestas para decidir

> Generado desde modelo.json. No editar a mano. Revisión 2026-10-07.101-composicion-despacho · 2026-10-05.

Prioridad: vender más → margen y control → cobrar antes. Son hipótesis de mejora: no se activan por aparecer en este archivo. Responde por ID: «A sí», «B con estos cambios», «C no».

## A · Atención comercial sin leads olvidados

- Tableros: SYS-MARKETING, SYS-PLAN-POTENCIAL, SYS-CROKISS, SYS-DESPACHO.
- Problema: Seguimientos fragmentados y confirmación de citas no verificada
- Beneficio esperado: Más conversaciones y citas atendidas
- Medición: Mediana de primer contacto; porcentaje de leads sin tocar a 24 h; citas confirmadas/lead
- Dependencias: Sin dependencias previas.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Definir plazo de respuesta y roles comerciales
- Acceso al backend vigente de cada captador

### Tareas

1. Acordar responsable, plazo y etapas de atención por origen
2. Mostrar bandeja de leads sin contacto, próximo paso y citas por confirmar
3. Probar asignación, deduplicación y cierre con casos sintéticos

### Criterios de aceptación

- Ningún lead activo queda sin responsable y próximo paso
- Se mide primer contacto y conversión a cita sin enviar mensajes automáticos no autorizados

## B · Atribución desde campaña hasta venta

- Tableros: SYS-SALA, SYS-MARKETING, SYS-PLAN-POTENCIAL, SYS-CROKISS.
- Problema: Ya existe atribución por campaña/pieza a leads y citas; falta comprobar cobertura del backend y continuidad hasta contrato, venta y margen
- Beneficio esperado: Invertir pauta y contenido en fuentes que generan ventas
- Medición: Venta y margen por campaña; conversión por etapa
- Dependencias: A.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Decidir ventana de atribución y qué evento cuenta como venta

### Tareas

1. Conservar campaña y pieza desde captación hasta oportunidad
2. Vincular oportunidad, propuesta y venta con folios
3. Comparar ventas y margen por origen, separando datos incompletos

### Criterios de aceptación

- Una venta de prueba conserva su origen verificable
- Las ventas sin atribución se muestran como pendientes

## C · Cotización, plan y siguiente paso comercial

- Tableros: SYS-CODES-PORTAL, SYS-INVERSION, SYS-PLAN-POTENCIAL, SYS-POTENCIALES, SYS-TRACK.
- Problema: No se comprobó continuidad folio de lead a propuesta y contrato
- Beneficio esperado: Aumentar cierre y reducir propuestas detenidas
- Medición: Propuestas ganadas/enviadas; días por etapa
- Dependencias: A.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Acordar estados comerciales y evidencia de aceptación

### Tareas

1. Definir folio y estados de propuesta comercial
2. Vincular propuesta con proyecto, responsable y siguiente contacto
3. Registrar aceptación o pérdida con motivo y fecha

### Criterios de aceptación

- Se sigue un caso desde lead hasta contrato sin duplicar proyecto
- Cada propuesta detenida tiene responsable y siguiente acción

## D · Referidos y reactivación con control humano

- Tableros: SYS-CODES-PORTAL, SYS-DESPACHO.
- Problema: El portal tiene referidos, pero integración comercial completa no comprobada
- Beneficio esperado: Más oportunidades desde clientes y asesores existentes
- Medición: Referidos calificados; ventas atribuidas; tiempo de atención
- Dependencias: A; B.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Definir elegibilidad de referidos y reglas de contacto

### Tareas

1. Relacionar referido con origen y consentimiento operativo
2. Preparar lista revisable de reactivación con motivos
3. Medir aceptación, citas y ventas referidas

### Criterios de aceptación

- Se conserva el origen del referido sin multiplicar personas
- Cualquier contacto saliente requiere la aprobación prevista

## E · Folio común de proyecto y datos conciliados

- Tableros: SYS-CONTROL, SYS-TAREAS, SYS-FLUJO, SYS-MIRAMAR, SYS-INTERIORES, SYS-OBRA.
- Problema: Identidad de proyecto se deriva parcialmente de nombres y alias
- Beneficio esperado: Evitar duplicados y conocer resultado de cada proyecto
- Medición: Porcentaje de registros con folio válido; duplicados pendientes
- Dependencias: Sin dependencias previas.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Responsable de conciliación
- Respaldo y fuente de servidor vigentes

### Tareas

1. Inventariar identificadores actuales y proponer correspondencias
2. Crear catálogo de folios preservando alias e historia
3. Migrar por lotes reversibles tras conciliación de muestra

### Criterios de aceptación

- Todo cambio conserva referencia al registro anterior
- No se fusionan proyectos por similitud de nombre sin validación

## F · Margen por proyecto y compromisos

- Tableros: SYS-ALQUIMIA, SYS-FLUJO, SYS-INTERIORES, SYS-MIRAMAR, SYS-OBRA.
- Problema: Caja por bolsa no demuestra rentabilidad y obligaciones por partida
- Beneficio esperado: Detectar desviaciones antes de perder margen
- Medición: Margen presupuestado/previsto/real; costo comprometido no pagado
- Dependencias: E.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Definición contable/operativa de margen
- Catálogo conciliado de proyectos y partidas

### Tareas

1. Acordar ingresos, costos, compromisos y partidas por proyecto
2. Calcular previsto y real con fecha y fuente
3. Mostrar desvíos y pendientes sin confundir caja con margen

### Criterios de aceptación

- Un proyecto de prueba reconcilia con sus partidas
- Los costos pendientes y datos incompletos quedan visibles

## G · Bloqueos y decisiones que frenan ventas y obra

- Tableros: SYS-DESPACHO, SYS-TAREAS, SYS-ALQUIMIA, SYS-MIRAMAR.
- Problema: Dependencias entre decisiones, trámites y tareas dispersas
- Beneficio esperado: Reducir días detenidos y retrabajo
- Medición: Edad de bloqueos; tiempo aprobación; hitos liberados
- Dependencias: E.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Acordar quién puede liberar cada tipo de bloqueo

### Tareas

1. Identificar bloqueos, decisión requerida y responsable
2. Relacionar tareas e hitos con dependencias reales
3. Presentar antigüedad y consecuencia del bloqueo

### Criterios de aceptación

- Un hito bloqueado identifica quién debe decidir y qué falta
- La liberación conserva evidencia e historial

## H · Autorizaciones y evidencia antes de afectar dinero

- Tableros: SYS-OBRA, SYS-OBRA-CLIENTE, SYS-CODES-PORTAL, SYS-FLUJO.
- Problema: Estados y segregación de responsabilidades necesitan revisión transversal
- Beneficio esperado: Menos pagos duplicados y correcciones
- Medición: Duplicados evitados; movimientos con comprobante; excepciones de autorización
- Dependencias: E.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Fuente y despliegue activo de motores financieros
- Matriz de autorización aprobada
- LIBRO_ID efectivo de Obra y cobertura de su tabla de roles
- Contrato de pagos que distinga operación incompleta, confirmada y repetida, compatible con datos históricos

### Tareas

1. Documentar quién propone, autoriza y confirma cada operación
2. Implementar validación del servidor e idempotencia donde corresponda
3. Probar reintentos, duplicados y transiciones fuera de orden
4. Confirmar libro efectivo de Obra y vinculación de identidad; definir cuándo se permite representar a otra persona y cómo se registra al firmante
5. Definir permisos de lectura, captura, ajustes de saldo, importación y mantenimiento por acción
6. Diseñar registro persistente de pago, referencias de cada efecto y respuesta canónica del servidor; probar recuperación tras fallo o respuesta perdida

### Criterios de aceptación

- Un reintento no produce un segundo efecto monetario
- Los permisos se rechazan en servidor y quedan auditables

## I · Calendario único de cobros y aportaciones

- Tableros: SYS-FLUJO, SYS-CODES-PORTAL, SYS-OBRA-CLIENTE.
- Problema: Cobros y aportaciones viven en contratos diferentes
- Beneficio esperado: Cobrar antes sin duplicar registros
- Medición: Monto vencido; días de atraso; compromisos cumplidos
- Dependencias: E; H.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Acordar estados y dueño de gestión de cobro

### Tareas

1. Relacionar obligaciones por contrato y proyecto
2. Unificar vistas de vencimiento sin duplicar fuentes de verdad
3. Registrar promesa, cumplimiento y siguiente gestión

### Criterios de aceptación

- Cada vencimiento conserva vínculo a su origen
- Los totales coinciden con fuentes conciliadas

## J · Conciliación de recibido, banco y Tesorería

- Tableros: SYS-FLUJO, SYS-CODES-PORTAL, SYS-OBRA-CLIENTE.
- Problema: Confirmar recibido no prueba conciliación bancaria
- Beneficio esperado: Conocer caja real y evitar cobros repetidos
- Medición: Porcentaje conciliado; días para conciliar; diferencias abiertas
- Dependencias: I.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Fuente bancaria o exportación autorizada
- Reglas de conciliación y revisión humana

### Tareas

1. Definir identificadores de comprobante y reglas de coincidencia
2. Preparar conciliación asistida con excepciones revisables
3. Aplicar confirmación autorizada y trazable

### Criterios de aceptación

- No se confirma conciliación solo por marcar recibido
- Toda diferencia conserva responsable y evidencia

## K · Indicadores confiables y rendimiento medido

- Tableros: SYS-AURUM-EXPERIENCIA, SYS-FLUJO, SYS-MARKETING, SYS-TAREAS, SYS-YOD-OS.
- Problema: Contratos estado/estatus y salud/frescura pueden mostrar indicadores incorrectos
- Beneficio esperado: Decisiones comerciales y operativas con cifras comprobables
- Medición: Indicadores con fuente y fecha; p95 carga; pruebas de contrato aprobadas
- Dependencias: Sin dependencias previas.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Acceso de prueba por roles
- Línea base de rendimiento; sin prometer p95 antes de medir

### Tareas

1. Definir contrato, fecha y calidad de cada indicador
2. Medir carga representativa y registrar fallos por fuente
3. Optimizar cuellos medidos y repetir prueba comparable

### Criterios de aceptación

- Se distingue falta de permiso, vacío, error y dato antiguo
- Se entrega comparación de latencia con misma muestra

## L · Mapa vivo, contratos y cambios verificables

- Tableros: SYS-YOD-OS, SYS-CONTROL.
- Problema: Documentos y despliegues divergen; varios GAS no están versionados
- Beneficio esperado: Cambiar procesos con menor riesgo y recuperación trazable
- Medición: Componentes verificados; cambios con impacto y pruebas; tiempo de recuperación
- Dependencias: Sin dependencias previas.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Permisos de repositorios y Apps Script
- Cerrar los vacíos de evidencia registrados

### Tareas

1. Completar inventario de fuentes y versiones desplegadas
2. Aplicar controles de impacto y pruebas en cada repositorio
3. Registrar cambios, despliegues, decisiones y reversión

### Criterios de aceptación

- Los cambios funcionales requieren impacto y propuesta registrada
- El atlas distingue commit integrado y backend desplegado

## PPP · Unificar tablero y fórmulas de potencial en Sheets

- Tableros: SYS-POTENCIALES, GAS-PORTERO, SHEET-PORTERO, SHEET-PPP-MODELOS, SYS-CONTROL.
- Problema: Entradas y escenarios se guardan en Sheets mientras los motores HTML calculan; una lectura de cada superficie puede reflejar motores distintos.
- Beneficio esperado: Una sola fuente de cálculo, versiones trazables y resultados comparables para venta, renta y lotificación.
- Medición: Cobertura de libros; igualdad de cantidades/resultados/flujos por revisión; escrituras con auditoría y rechazos de conflicto.
- Dependencias: Sin dependencias previas.
- Esfuerzo: L. Decisión: **aprobada**.

### Requisitos previos

- Backend vivo contrastado y pruebas aisladas
- Integrar propuesta central y fijar commit del atlas antes de integrar frontend
- Actualizar únicamente implementación existente después de frontend compatible
- Registrar despliegue y verificar conexión pública por separado del modelo nativo

### Tareas

1. Mapear y validar fórmulas nativas de cada motor con escenarios conservados
2. Registrar libro/carpeta por caso y proteger fórmulas para propietario
3. Conectar cantidades, resultados, versiones y diagramas con revisión esperada
4. Completar flujos operativos y por etapas sin inventar datos ausentes
5. Integrar casos existentes y fábrica de altas
6. Auditar escrituras y ediciones directas; resolver conflicto sin sobrescribir

### Criterios de aceptación

- Leer tablero o Sheets da los mismos resultados y revisión
- Cambiar cantidad actualiza fórmulas nativas; ninguna fórmula financiera paralela en cliente/servidor
- No mostrar datos locales como sincronizados ni confirmar una escritura fallida
- Cada versión conserva identidad, fuente e historial; datos faltantes permanecen pendientes
